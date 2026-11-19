"""Download public photo candidates with source groups; never auto-label them."""
import hashlib
import importlib.util
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
import time
from urllib.parse import urljoin, urlsplit

from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("collector", ROOT / "scripts/collect-palace-images.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
OUT = ROOT / "datasets/palace"
SOURCES = {
    "travelika": "https://travelikalocal.com/vietnam/ho-chi-minh-city/the-reunification-palace/",
    "nomadic": "https://www.nomadicexperiences.com/2012/07/reunification-palace-last-bastion-of.html",
    "postcard": "https://www.themodernpostcard.com/a-day-in-ho-chi-minh-city-ghosts-of-grandeur-ghosts-of-war/",
    "journey": "https://thejourneytaken.wordpress.com/2017/02/05/a-visit-to-reunification-palace-and-the-war-remnants-museum-in-ho-chi-minh-city/",
    "baughman": "https://baughmanblog.com/2024/04/welcome-to-ho-chi-minh-city-%F0%9F%A4%AB-saigon.html",
    "plo": "https://plo.vn/doc-dao-duong-ham-boc-thep-chong-bom-duoi-dinh-doc-lap-post480468.html",
    "gtrip": "https://gtrip.vn/vietnam-tours/attractions/independence-palace",
}


class Pictures(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag != "img":
            return
        url = a.get("data-original") or a.get("data-src") or a.get("src", "")
        if url and not url.startswith("data:"):
            self.images.append((url, a.get("alt", "")))


def main():
    folder = OUT / "candidates/web"
    folder.mkdir(parents=True, exist_ok=True)
    records = []
    for name, page in SOURCES.items():
        try:
            parser = Pictures()
            parser.feed(c.get(page).text)
        except Exception as error:
            print(name, "page unavailable:", str(error)[:100], flush=True)
            continue
        urls = set()
        for index, (url, alt) in enumerate(parser.images):
            url = urljoin(page, url)
            if url in urls or any(t in url.lower() for t in ("logo", "avatar", "gravatar", "icon", "banner", "widget")):
                continue
            urls.add(url)
            # Only known image hosts; never fetch arbitrary protocols from markup.
            if urlsplit(url).scheme not in ("https", "http"):
                continue
            record = dict(id=f"web-{name}-{index:02}", source_page=page, download_url=url,
                description=alt, author="See original source photo credit", license=None,
                rights_status="reuse_license_not_verified", split_group="web-publisher-"+urlsplit(page).netloc,
                label=None, review_status="pending")
            path = folder / (record["id"] + ".jpg")
            try:
                if not path.exists():
                    raw = c.get(url).content
                    with Image.open(BytesIO(raw)) as original:
                        if min(original.size) < 380:
                            continue
                        image = ImageOps.exif_transpose(original).convert("RGB")
                        image.thumbnail((1280, 1280))
                        image.save(path, quality=90)
                with Image.open(path) as image:
                    record["pixel_sha256"] = hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()
                record["local_path"] = path.relative_to(OUT).as_posix()
                record["transformations"] = "EXIF transpose; max 1280px; JPEG quality 90"
            except Exception as error:
                record["download_error"] = str(error)[:150]
            records.append(record)
            c.write_json(OUT / "web-manifest.json", records)
            time.sleep(0.2)
        print(name, "downloaded", sum(r.get("local_path") is not None for r in records if r["id"].startswith("web-"+name+"-")), flush=True)
    available = [r for r in records if r.get("local_path")]
    for start in range(0, len(available), 30):
        sheet = Image.new("RGB", (1200, 6*155), "white")
        draw = ImageDraw.Draw(sheet)
        for j, row in enumerate(available[start:start+30]):
            x, y = (j % 5)*240, (j // 5)*155
            with Image.open(OUT / row["local_path"]) as image:
                sheet.paste(ImageOps.contain(image, (232, 125)), (x, y))
            draw.text((x, y+128), row["id"], fill="black")
        sheet.save(OUT / f"web-review-{start//30+1:02}.jpg", quality=92)
    print("Total public-web candidates:", len(available), flush=True)


if __name__ == "__main__":
    main()
