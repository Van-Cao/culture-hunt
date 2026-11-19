"""Apply visual decisions to exact captured screenshots and create review sheets."""
from collections import Counter
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/palace"
rows = json.loads((DATA / "tour-screenshot-manifest.json").read_text(encoding="utf-8"))
decisions = json.loads((ROOT / "content/palace/tour-screenshot-review.json").read_text(encoding="utf-8"))["decisions"]
accepted = []
for row in rows:
    image_path = DATA / row["local_path"]
    digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
    decision = decisions.get(row["id"])
    if not decision or decision["file_sha256"] != digest or not decision["label"]:
        continue
    row.update(label=decision["label"], review_status="visually_reviewed", split="train")
    with Image.open(image_path) as image:
        row["pixel_sha256"] = hashlib.sha256(image.convert("RGB").tobytes()).hexdigest()
        pixels = list(image.convert("L").resize((9, 8)).tobytes())
        bits = [pixels[y*9+x] > pixels[y*9+x+1] for y in range(8) for x in range(8)]
        row["dhash"] = format(sum(int(bit) << i for i, bit in enumerate(bits)), "016x")
    accepted.append(row)
for start in range(0, len(rows), 24):
    sheet = Image.new("RGB", (1280, 6*150), "white")
    draw = ImageDraw.Draw(sheet)
    for j, row in enumerate(rows[start:start+24]):
        x, y = (j % 4)*320, (j // 4)*150
        with Image.open(DATA / row["local_path"]) as image:
            sheet.paste(ImageOps.contain(image, (312, 115)), (x, y))
        draw.text((x, y+117), row["id"][:44], fill="black")
        draw.text((x, y+130), row.get("label") or "not approved", fill="black")
    sheet.save(DATA / f"tour-review-{start//24+1:02}.jpg")
(DATA / "reviewed-tour-manifest.json").write_text(json.dumps(accepted, ensure_ascii=False, indent=2), encoding="utf-8")
print("Accepted screenshots:", len(accepted), dict(Counter(r["label"] for r in accepted)))
print("All screenshots remain one tour-session group, train only; no open reuse license verified.")
