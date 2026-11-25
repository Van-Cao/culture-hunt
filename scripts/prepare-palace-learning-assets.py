"""Download credited reference photographs for the authored Palace learning journey.

Keeps the existing recognition/map photographs unchanged. No generative edits.
"""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
import hashlib
import json
import requests
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public/images/palace/learning"
PHOTO_PAGE = "https://dinhdoclap.gov.vn/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong/"
HISTORY_PAGE = "https://dinhdoclap.gov.vn/lich-su-dinh-doc-lap/"
BASE = "https://dinhdoclap.gov.vn/wp-content/uploads/2025/12/anh-dinh-doc-lap-noi-luu-giu-dau-an-sau-50-nam-giai-phong-9976"
HISTORY = "https://dinhdoclap.gov.vn/wp-content/uploads/2018/03/"
ASSETS = [
    ("facade", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Reunification_Palace_front_view.jpg?width=2848", "https://commons.wikimedia.org/wiki/File:Reunification_Palace_front_view.jpg", "Amore Mio · CC BY-SA 3.0"),
    ("painting", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Palacio_de_la_Reunificaci%C3%B3n,_Ciudad_Ho_Chi_Minh,_Vietnam,_2013-08-14,_DD_11.JPG?width=3840", "https://commons.wikimedia.org/wiki/File:Palacio_de_la_Reunificaci%C3%B3n,_Ciudad_Ho_Chi_Minh,_Vietnam,_2013-08-14,_DD_11.JPG", "Diego Delso, delso.photo · CC BY-SA 3.0"),
    ("norodom", HISTORY + "1.jpg", HISTORY_PAGE, "Di tích Dinh Độc Lập · ảnh tư liệu"),
    ("damage-1962", HISTORY + "5.-Dinh-Norodom-bi-nem-bom-27.2.1962-scaled.jpg", HISTORY_PAGE, "Di tích Dinh Độc Lập · ảnh tư liệu"),
    ("opening-1966", HISTORY + "7.-Cat-bang-khanh-thanh-Dinh-scaled.jpg", HISTORY_PAGE, "Di tích Dinh Độc Lập · ảnh tư liệu"),
    ("gate-1975", HISTORY + "8.-ANH-XE-TANG-30-4-PHAP.jpg", HISTORY_PAGE, "Di tích Dinh Độc Lập · ảnh tư liệu"),
    ("reception", "https://commons.wikimedia.org/wiki/Special:Redirect/file/Independence_Palace_(36992717822).jpg?width=3840", "https://commons.wikimedia.org/wiki/File:Independence_Palace_(36992717822).jpg", "Terrazzo · CC BY 2.0 · 2017"),
    ("cabinet-archive", BASE + "-15.jpg", PHOTO_PAGE, "Di tích Dinh Độc Lập · ảnh tư liệu"),
    ("cabinet", BASE + "-16.jpg", PHOTO_PAGE, "Di tích Dinh Độc Lập"),
    ("roof", BASE + "-20.jpg", PHOTO_PAGE, "Di tích Dinh Độc Lập"),
    ("bunker", BASE + "-22.jpg", PHOTO_PAGE, "Di tích Dinh Độc Lập"),
    ("screens", HISTORY + "202512114-web-di-tich-docx-google-t-i-li-u.jpg", "https://dinhdoclap.gov.vn/kien-truc-dinh-doc-lap/", "Di tích Dinh Độc Lập"),
    ("f5e", "https://dinhdoclap.gov.vn/wp-content/uploads/2026/03/IMG_0016.jpg", "https://dinhdoclap.gov.vn/dau-tich-su-kien-nem-bom-dinh-doc-lap-ngay-08-04-1975/", "Di tích Dinh Độc Lập · F-5E trưng bày đồng dạng"),
]

def prepare(item):
    name, url, source, credit = item
    response = requests.get(url, timeout=45, headers={"User-Agent": "CultureHuntDemo/1.0 (educational reference photographs)"})
    response.raise_for_status()
    photo = Image.open(BytesIO(response.content)).convert("RGB")
    original = photo.size
    photo.thumbnail((3840, 3840))
    path = DEST / (name + ".webp")
    photo.save(path, "WEBP", quality=92, method=6)
    return name, {"src": "/images/palace/learning/" + path.name, "width": photo.width, "height": photo.height,
                  "originalWidth": original[0], "originalHeight": original[1], "source": source, "download": url,
                  "credit": credit, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}

if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    assets = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        for name, data in pool.map(prepare, ASSETS):
            assets[name] = data
            print(name, data["width"], data["height"], flush=True)
    (ROOT / "content/palace/learning-assets.json").write_text(json.dumps(assets, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
