"""Download traceable HCMUS image candidates for manual building-label review."""
from concurrent.futures import ThreadPoolExecutor
import argparse
import hashlib
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import requests
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datasets/hcmus-nguyen-van-cu"


class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []

    def handle_starttag(self, tag, attrs):
        if tag != "img":
            return
        attrs = dict(attrs)
        source = attrs.get("data-src") or attrs.get("src", "")
        if not any(part in source for part in ("/uploads/", "/images/", "/inline-images/")) or any(part in source.lower() for part in ("logo", "banner", "emoji")):
            return
        if attrs.get("width", "").isdigit() and int(attrs["width"]) < 400:
            return
        self.items.append((source, attrs.get("alt", "")))


def fetch(url, referer=None):
    response = requests.get(url, timeout=25, headers={
        "User-Agent": "Mozilla/5.0", "Referer": referer or url})
    response.raise_for_status()
    return response


def collect_source(source):
    records = []
    try:
        parser = Images()
        parser.feed(fetch(source["url"]).text)
        seen = set()
        candidates = [(url, "") for url in source["imageUrls"]] if source.get("imageUrls") else parser.items
        for image_url, alt in candidates[:60]:
            image_url = urljoin(source["url"], image_url)
            host = urlsplit(image_url).hostname or ""
            if image_url in seen or not (host == "hcmus.edu.vn" or host.endswith(".hcmus.edu.vn") or host in source.get("allowedImageHosts", [])):
                continue
            seen.add(image_url)
            photo_id = source["id"] + "-" + hashlib.sha256(image_url.encode()).hexdigest()[:12]
            local_path = "candidates/" + photo_id + ".jpg"
            path = OUT / local_path
            try:
                if not path.exists():
                    raw = fetch(image_url, source["url"]).content
                    with Image.open(BytesIO(raw)) as original:
                        image = ImageOps.exif_transpose(original).convert("RGB")
                        if min(image.size) < 240:
                            continue
                        image.thumbnail((1600, 1600))
                        image.save(path, quality=95)
                with Image.open(path) as image:
                    width, height = image.size
                records.append(dict(id=photo_id, local_path=local_path, width=width, height=height,
                    source_page=source["url"], original_url=image_url, alt=alt,
                    candidate_checkpoint=source["candidateCheckpoint"], label=None,
                    source_group_hint=source["id"], split_group=None, review_status="pending",
                    author="Not stated", license="Not established", rights_status="unverified"))
            except (requests.RequestException, OSError) as error:
                print("Image unavailable:", photo_id, str(error), flush=True)
        return records, dict(id=source["id"], candidates=len(records), error=None)
    except (requests.RequestException, ValueError) as error:
        return [], dict(id=source["id"], candidates=0, error=str(error))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-ids", nargs="+")
    args = parser.parse_args()
    (OUT / "candidates").mkdir(parents=True, exist_ok=True)
    config = json.loads((ROOT / "content/hcmus/image-sources.json").read_text(encoding="utf-8"))
    sources = config["sources"]
    if args.source_ids:
        sources = [source for source in sources if source["id"] in args.source_ids]
        if {source["id"] for source in sources} != set(args.source_ids):
            parser.error("Unknown source ID")
    records, outcomes = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for photos, outcome in pool.map(collect_source, sources):
            records.extend(photos)
            outcomes.append(outcome)
            print(outcome, flush=True)
    manifest_path = OUT / "candidate-manifest.json"
    if manifest_path.exists():
        previous = json.loads(manifest_path.read_text(encoding="utf-8"))
        merged = {row["id"]: row for row in previous["records"]}
        merged.update({row["id"]: row for row in records})
        records = list(merged.values())
        old_outcomes = {row["id"]: row for row in previous["sources"]}
        old_outcomes.update({row["id"]: row for row in outcomes})
        outcomes = list(old_outcomes.values())
    manifest_path.write_text(json.dumps(dict(records=records, sources=outcomes),
        ensure_ascii=False, indent=2), encoding="utf-8")
    for start in range(0, len(records), 24):
        batch = records[start:start+24]
        sheet = Image.new("RGB", (1200, ((len(batch)+3)//4)*225), "white")
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(batch):
            x, y = (i % 4)*300, (i//4)*225
            with Image.open(OUT / row["local_path"]) as original:
                image = ImageOps.contain(original, (296, 190))
                sheet.paste(image, (x, y))
            draw.text((x+2, y+192), row["id"][-12:], fill="black")
            draw.text((x+2, y+208), row["source_group_hint"], fill="black")
        sheet.save(OUT / f"contact-{start//24+1}.jpg", quality=90)
    print("Pending review:", len(records), "photos. No training labels assigned.", flush=True)


if __name__ == "__main__":
    main()
