"""Collect official reference candidates; keep reuse rights distinct from visual labels."""
import hashlib
import importlib.util
from io import BytesIO
from pathlib import Path
from html.parser import HTMLParser

from PIL import Image, ImageOps

spec = importlib.util.spec_from_file_location("collector", Path(__file__).with_name("collect-palace-images.py"))
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


class ArticleImages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        src = attrs.get("src", "")
        if tag == "img" and "anh-dinh-doc-lap-noi-luu-giu" in src:
            self.images.append((src, attrs.get("alt", "")))


def save(record):
    path = c.OUT / "candidates/official" / (record["id"] + ".jpg")
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        if not path.exists():
            with Image.open(BytesIO(c.get(record["download_url"]).content)) as source:
                image = ImageOps.exif_transpose(source).convert("RGB")
                image.thumbnail((1280, 1280))
                image.save(path, quality=90)
        with Image.open(path) as image:
            record["pixel_sha256"] = hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()
        record.update(local_path=path.relative_to(c.OUT).as_posix(), label=None,
                      review_status="pending", rights_status="reuse_license_not_verified")
    except Exception as error:
        record["download_error"] = str(error)[:200]
    return record


if __name__ == "__main__":
    c.OUT.mkdir(parents=True, exist_ok=True)
    c.tour_catalog()
    import json
    scenes = json.loads((c.OUT / "tour-scenes.json").read_text(encoding="utf-8"))["scenes"]
    records, seen = [], set()
    for scene in scenes:
        name = scene["attributes"]["name"]
        if name in seen:
            continue
        seen.add(name)
        label = ("reception" if "phong_khanh_tiet" in name else
                 "cabinet" if "phong_noi_cac" in name else
                 "facade" if "mat_tien_dinh" in name or "phia_truoc_dinh" in name else None)
        if not label:
            continue
        cube = next((i["url"] for i in scene["images"] if i["tag"] == "cube" and "/vr/" in i.get("url", "")), None)
        if not cube:
            continue
        for face in "fblr":
            record = dict(id=f"official-{name}-{face}", source_page="https://thamquanvr360.dinhdoclap.gov.vn/",
                          download_url=cube.replace("%s", face), scene=name, suggested_label=label,
                          split_group="official-tour-session", panorama_group=name,
                          author="Official Palace tour / StarGlobal 3D", license=None,
                          transformations="Cube side face; resized to maximum 1280px, JPEG quality 90")
            # The public tour currently returns HTTP 403 for these image assets.
            # Keep the provenance catalog; do not retry protected assets or treat them as downloaded.
            record.update(download_error="Not attempted: sample cube assets returned HTTP 403 during source inspection",
                          review_status="source_unavailable", rights_status="reuse_license_not_verified")
            records.append(record)
            c.write_json(c.OUT / "official-manifest.json", records)
        print("Official scene:", name, flush=True)
    article = "https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/"
    parser = ArticleImages()
    parser.feed(c.get(article).text)
    for index, (url, description) in enumerate(dict(parser.images).items()):
        records.append(save(dict(id=f"official-article-{index:02}", source_page=article,
            download_url=url, description=description, suggested_label=None,
            split_group="official-article-session", author="See official article / original photo credit",
            license=None, transformations="Resized to maximum 1280px, JPEG quality 90")))
        c.write_json(c.OUT / "official-manifest.json", records)
    # Keep this collection's sheets separate from the Commons sheets.
    available = [r for r in records if r.get("local_path")]
    for start in range(0, len(available), 40):
        from PIL import ImageDraw
        sheet = Image.new("RGB", (1200, 8*150), "white")
        draw = ImageDraw.Draw(sheet)
        for i, record in enumerate(available[start:start+40]):
            if not record.get("local_path"):
                continue
            with Image.open(c.OUT / record["local_path"]) as source:
                x, y = (i % 5)*240, (i // 5)*150
                sheet.paste(ImageOps.contain(source, (232, 110)), (x, y))
                short = record["id"].replace("official-scene_", "")
                draw.text((x, y+112), short[:33], fill="black")
                draw.text((x, y+125), short[33:], fill="black")
        sheet.save(c.OUT / f"official-review-{start//40+1:02}.jpg", quality=90)
    print("Official candidates:", len(records), flush=True)
