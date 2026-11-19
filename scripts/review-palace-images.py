"""Merge visual decisions with provenance; never automatically split correlated images."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/palace"
labels = json.loads((ROOT / "content/palace/vision-labels.json").read_text(encoding="utf-8"))["labels"]
rows = []
seen = {}
for name in ("download-manifest.json", "official-manifest.json"):
    for row in json.loads((DATA / name).read_text(encoding="utf-8")):
        if not row.get("local_path"):
            continue
        label = labels.get(row["id"])
        if label is None:
            continue
        row.update(label=label, review_status="visually_reviewed")
        if row["id"].startswith("commons-"):
            # Conservatively keep all photos from one photographer together,
            # even if their original date is incomplete/nonstandard.
            author = row.get("author") or row["id"]
            row["split_group"] = "commons-author-" + hashlib.sha256(author.encode()).hexdigest()[:16]
            row["rights_status"] = "open_license" if re.match(r"^(CC0|CC BY|Public domain)", row.get("license", "")) else "review_required"
        # Reject byte-identical decoded pixels; flag visual near-duplicates below.
        digest = row["pixel_sha256"]
        if digest in seen:
            row["duplicate_of"] = seen[digest]
        else:
            seen[digest] = row["id"]
        with Image.open(DATA / row["local_path"]) as image:
            image = image.convert("L").resize((9, 8))
            pixels = list(image.tobytes())
            bits = [pixels[y*9+x] > pixels[y*9+x+1] for y in range(8) for x in range(8)]
            row["dhash"] = format(sum(int(bit) << i for i, bit in enumerate(bits)), "016x")
        rows.append(row)
pairs = []
for i, a in enumerate(rows):
    for b in rows[i+1:]:
        distance = (int(a["dhash"], 16) ^ int(b["dhash"], 16)).bit_count()
        if distance <= 6:
            pairs.append(dict(a=a["id"], b=b["id"], distance=distance))
result = dict(records=rows, near_duplicate_pairs=pairs,
    note="Review duplicate pairs and connect their split groups BEFORE train/val/test split. No split or training has been performed.")
(DATA / "reviewed-manifest.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print("Reviewed:", dict(Counter(r["label"] for r in rows)))
print("Open-license reviewed:", dict(Counter(r["label"] for r in rows if r["rights_status"] == "open_license")))
print("Near-duplicate pairs to check:", len(pairs))
