"""Collect traceable candidates, NOT automatically labelled training examples."""
import argparse
import hashlib
import html
import json
import re
import time
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import xml.etree.ElementTree as ET

import requests
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datasets/palace"
API = "https://commons.wikimedia.org/w/api.php"
TOUR = "https://sanpham.starglobal3d.vn/smart-heritage-3d/dinh-doc-lap/"
CATEGORIES = ["Independence Palace", "Interiors of Independence Palace",
              "Telecommunications in the Independence Palace",
              "Bell UH-1 Iroquois in the Independence Palace"]
SESSION = requests.Session()
SESSION.headers["User-Agent"] = "CultureHuntAcademicDataset/0.1 (educational image research)"


def get(url, **kwargs):
    for attempt in range(6):
        try:
            response = SESSION.get(url, timeout=45, **kwargs)
            response.raise_for_status()
            return response
        except requests.RequestException:
            if 'response' in locals() and response.status_code in (400, 401, 403, 404):
                raise
            if attempt == 5:
                raise
            time.sleep(min(60, 10 * (attempt + 1)))


def plain(value):
    return html.unescape(re.sub(r"<[^>]+>", " ", value or "")).strip()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def discover():
    files = {}
    for category in CATEGORIES:
        params = dict(action="query", format="json", list="categorymembers",
                      cmtitle="Category:" + category, cmnamespace=6, cmlimit=500)
        while True:
            data = get(API, params=params).json()
            for item in data["query"]["categorymembers"]:
                files.setdefault(item["pageid"], item)["category"] = category
            if "continue" not in data:
                break
            params.update(data["continue"])
    ids = list(files)
    records = []
    for start in range(0, len(ids), 50):
        data = get(API, params=dict(action="query", format="json", prop="imageinfo",
                   pageids="|".join(map(str, ids[start:start+50])),
                   iiprop="url|size|extmetadata|sha1", iiurlwidth=1280)).json()
        for key, page in data["query"]["pages"].items():
            info = page.get("imageinfo", [{}])[0]
            if info.get("width", 0) < 640 or info.get("height", 0) < 480:
                continue
            if not urlsplit(info.get("url", "")).path.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            meta = info.get("extmetadata", {})
            field = lambda name: plain(meta.get(name, {}).get("value", ""))
            records.append(dict(id="commons-"+key, title=page["title"],
                category=files[int(key)]["category"], source_page=info["descriptionurl"],
                original_url=info["url"], download_url=info.get("thumburl", info["url"]),
                width=info["width"], height=info["height"], source_sha1=info.get("sha1"),
                author=field("Artist"), license=field("LicenseShortName"),
                license_url=field("LicenseUrl"), description=field("ImageDescription"),
                date=field("DateTimeOriginal"), label=None, review_status="pending",
                split_group=None, note="Set split_group by photographer/session before splitting."))
        print("Metadata", min(start+50, len(ids)), "/", len(ids), flush=True)
        write_json(OUT / "commons-catalog.partial.json", records)
        time.sleep(2)
    records.sort(key=lambda x: x["id"])
    write_json(OUT / "commons-catalog.json", records)
    (OUT / "commons-catalog.partial.json").unlink(missing_ok=True)
    print("Commons candidates:", len(records), flush=True)
    return records


def tour_catalog():
    url = urljoin(TOUR, "tour_xml/tour.xml")
    response = get(url)
    (OUT / "sources").mkdir(parents=True, exist_ok=True)
    (OUT / "sources/tour.xml").write_bytes(response.content)
    root = ET.fromstring(response.content)
    scenes = []
    for scene in root.findall(".//scene"):
        scenes.append(dict(attributes=scene.attrib,
            images=[dict(tag=e.tag, **e.attrib) for e in scene.findall(".//image//*")]))
    write_json(OUT / "tour-scenes.json", dict(source=url, scenes=scenes,
        rights="No open training/reuse license verified; source catalog only."))
    print("Tour scenes:", len(scenes), flush=True)


def download(records, limit):
    folder = OUT / "candidates/commons"
    folder.mkdir(parents=True, exist_ok=True)
    # Prioritize interiors and the specific helicopter/telecom collections.
    records = sorted(records, key=lambda r: (r["category"] == "Independence Palace", r["id"]))[:limit]
    seen = {}
    results = []
    for index, record in enumerate(records):
        record = dict(record)
        path = folder / (record["id"] + ".jpg")
        try:
            if not path.exists():
                raw = get(record["download_url"]).content
                with Image.open(BytesIO(raw)) as source:
                    image = ImageOps.exif_transpose(source).convert("RGB")
                    image.thumbnail((1280, 1280))
                    image.save(path, quality=90)
            with Image.open(path) as image:
                digest = hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()
            record.update(local_path=path.relative_to(OUT).as_posix(), pixel_sha256=digest,
                          duplicate_of=seen.get(digest))
            seen.setdefault(digest, record["id"])
        except Exception as error:
            record["download_error"] = str(error)[:300]
        results.append(record)
        # Checkpoint progress so an interrupted collection can resume.
        write_json(OUT / "download-manifest.json", results)
        if index % 20 == 0:
            print("Downloaded", index+1, "/", len(records), flush=True)
        time.sleep(0.15)
    return results


def sheets(records):
    records = [r for r in records if r.get("local_path") and not r.get("duplicate_of")]
    for start in range(0, len(records), 40):
        sheet = Image.new("RGB", (1200, 8*145), "white")
        draw = ImageDraw.Draw(sheet)
        for i, record in enumerate(records[start:start+40]):
            with Image.open(OUT / record["local_path"]) as source:
                tile = ImageOps.contain(source, (232, 115))
                x, y = (i % 5)*240, (i // 5)*145
                sheet.paste(tile, (x, y))
                draw.text((x, y+117), record["id"], fill="black")
        path = OUT / f"review-{start//40+1:02}.jpg"
        sheet.save(path, quality=90)
    print("Review sheets:", (len(records)+39)//40, flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=240)
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = OUT / "commons-catalog.json"
    records = discover() if args.refresh or not catalog.exists() else json.loads(catalog.read_text(encoding="utf-8"))
    try:
        tour_catalog()
    except Exception as error:
        print("Tour catalog unavailable:", str(error)[:200], flush=True)
    sheets(download(records, args.limit))
