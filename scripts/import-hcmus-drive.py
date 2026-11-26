"""Materialize authenticated Drive file references supplied as JSON on stdin.

The connector supplies a fresh file_uri.download_url after metadata is read.
Signed URLs are used in memory only and are never written to the dataset catalog.
This script does not change files or permissions in Google Drive.
"""
from concurrent.futures import ThreadPoolExecutor
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
import sys

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener
import requests

register_heif_opener()
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "datasets/hcmus-nguyen-van-cu/drive-2026-11-26"
LABELS = {"building-a", "building-b", "building-i"}


def materialize(item):
    photo_id, label = item["id"], item["label"]
    if label not in LABELS or not re.fullmatch(r"[A-Za-z0-9_-]+", photo_id):
        raise ValueError("Unexpected Drive file ID or building label")
    directory = OUT / label
    directory.mkdir(parents=True, exist_ok=True)
    extension = ".heic" if item["mime_type"] in {"image/heic", "image/heif"} else ".jpg"
    original_path = directory / (photo_id + extension)
    if not original_path.exists():
        response = requests.get(item["download_url"], timeout=45)
        response.raise_for_status()
        data = response.content
        # Decode before retaining a response, which may otherwise be a login/error page.
        with Image.open(BytesIO(data)) as original:
            original.load()
        original_path.write_bytes(data)
    with Image.open(original_path) as original:
        exif = original.getexif()
        datetime_original = exif.get(36867) or exif.get(306)
        try:
            datetime_original = exif.get_ifd(34665).get(36867) or datetime_original
        except (KeyError, TypeError, ValueError):
            pass
        image = ImageOps.exif_transpose(original).convert("RGB")
        original_size = image.size
        image.thumbnail((1600, 1600))
        target = directory / (photo_id + "-review.jpg")
        image.save(target, quality=95)
    return dict(id="drive-"+photo_id, drive_file_id=photo_id, filename=item["filename"],
        label_hint=label, label=None, local_path=target.relative_to(OUT.parent).as_posix(),
        original_path=original_path.relative_to(OUT.parent).as_posix(),
        source_page=item["source_page"], folder_url=item["folder_url"],
        original_sha256=hashlib.sha256(original_path.read_bytes()).hexdigest(),
        original_width=original_size[0], original_height=original_size[1],
        photo_datetime=str(datetime_original) if datetime_original else None,
        review_status="pending", split_group=None,
        rights_status="user_supplied_for_training", author="User-supplied Drive collection")


def main():
    items = json.loads(sys.stdin.read().lstrip("\ufeff"))
    rows, errors = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [(item["id"], pool.submit(materialize, item)) for item in items]
        for photo_id, future in futures:
            try:
                rows.append(future.result())
            except Exception as error:
                # Exception messages may contain a signed URL; log only the type and file ID.
                errors.append(dict(id=photo_id, error=type(error).__name__))
    path = OUT / "candidate-manifest.json"
    old = json.loads(path.read_text(encoding="utf-8"))["records"] if path.exists() else []
    merged = {row["id"]: row for row in old}
    merged.update({row["id"]: row for row in rows})
    path.write_text(json.dumps(dict(records=list(merged.values())), ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(dict(downloaded=len(rows), total=len(merged), errors=errors)), flush=True)
    if errors:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
