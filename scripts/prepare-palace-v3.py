"""Freeze a source-disjoint train/validation/test split before running v3 predictions."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import shutil

import numpy as np
import cv2
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/palace"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def hashes(path):
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        pixels = list(rgb.convert("L").resize((9, 8)).tobytes())
        dhash = sum(int(pixels[y*9+x] > pixels[y*9+x+1]) << (y*8+x) for y in range(8) for x in range(8))
        low = cv2.dct(np.asarray(rgb.convert("L").resize((32, 32)), dtype=np.float32))[:8, :8].flatten()
        phash = sum(int(value > np.median(low[1:])) << i for i, value in enumerate(low))
        sha = hashlib.sha256(str(rgb.size).encode() + rgb.tobytes()).hexdigest()
        return sha, dhash, phash


def main():
    decisions = read(ROOT / "content/palace/vision-v3-labels.json")
    labels = read(ROOT / "content/palace/vision-labels.json")["labels"] | decisions["labels"]
    raw = sum((read(DATA / name) for name in ("download-manifest.json", "official-manifest.json", "web-manifest.json")), [])
    rows = []
    for record in raw:
        if record["id"] not in labels or not record.get("local_path"):
            continue
        row = dict(record, label=labels[record["id"]], review_status="visually_reviewed")
        if row["id"].startswith("commons-"):
            row["split_group"] = "commons-author-" + hashlib.sha256((row.get("author") or row["id"]).encode()).hexdigest()[:16]
        sha, dhash, phash = hashes(DATA / row["local_path"])
        row.update(pixel_sha256=sha, dhash=f"{dhash:016x}", phash=f"{phash:016x}")
        rows.append(row)
    for record in read(DATA / "reviewed-tour-manifest.json"):
        row = dict(record)
        sha, dhash, phash = hashes(DATA / row["local_path"])
        row.update(pixel_sha256=sha, dhash=f"{dhash:016x}", phash=f"{phash:016x}")
        rows.append(row)
    missing = set(labels) - {r["id"] for r in rows}
    if missing:
        raise ValueError(f"Labels missing downloaded images: {sorted(missing)}")
    parent = {r["split_group"]: r["split_group"] for r in rows}
    def find(group):
        while parent[group] != group:
            group = parent[group]
        return group
    links, seen, deduped = [], {}, []
    for i, row in enumerate(rows):
        for previous in rows[:i]:
            hd = (int(row["dhash"], 16) ^ int(previous["dhash"], 16)).bit_count()
            hp = (int(row["phash"], 16) ^ int(previous["phash"], 16)).bit_count()
            if row["pixel_sha256"] == previous["pixel_sha256"] or (hd <= 4 and hp <= 6):
                if row["label"] != previous["label"]:
                    raise ValueError(f"Possible conflicting labels: {row['id']} / {previous['id']}")
                a, b = find(row["split_group"]), find(previous["split_group"])
                parent[b] = a
                links.append(dict(a=row["id"], b=previous["id"], dhash_distance=hd, phash_distance=hp))
        if row["pixel_sha256"] not in seen:
            deduped.append(row)
            seen[row["pixel_sha256"]] = row["id"]
    by_id = {r["id"]: r for r in rows}
    test_groups = {find(by_id[key]["split_group"]) for key in decisions["test_seeds"]}
    val_groups = {find(by_id[key]["split_group"]) for key in decisions["val_seeds"]} - test_groups
    for row in deduped:
        row["split_group"] = find(row["split_group"])
        row["split"] = "test" if row["split_group"] in test_groups else "val" if row["split_group"] in val_groups else "train"
    labels_set = sorted(set(labels.values()))
    counts = {split: dict(Counter(r["label"] for r in deduped if r["split"] == split)) for split in ("train", "val", "test")}
    for split, counter in counts.items():
        if set(counter) != set(labels_set):
            raise ValueError(f"Missing class coverage: {split} {counter}")
    groups = {split: {r["split_group"] for r in deduped if r["split"] == split} for split in counts}
    assert not groups["train"] & groups["val"] and not groups["train"] & groups["test"] and not groups["val"] & groups["test"]
    fingerprint = hashlib.sha256(json.dumps([(r["id"], r["pixel_sha256"], r["split"], r["label"]) for r in deduped]).encode()).hexdigest()[:12]
    folder = DATA / ("v3-" + fingerprint)
    for row in deduped:
        target = folder / row["split"] / row["label"] / (row["id"] + ".jpg")
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copy2(DATA / row["local_path"], target)
    manifest = dict(fingerprint=fingerprint, counts=counts, records=deduped, near_duplicate_links=links,
        source_groups={split: sorted(group) for split, group in groups.items()},
        test_protocol="New source groups reserved before v3 inference. Do not train, select epochs, or tune rejection thresholds on test. Web-only evaluation, not a real-world accuracy guarantee.")
    (folder / "split-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "v3-dataset.json").write_text(json.dumps(dict(folder=folder.relative_to(ROOT).as_posix(), fingerprint=fingerprint), indent=2), encoding="utf-8")
    print("Dataset:", folder, "\nCounts:", counts, "\nNear duplicate links:", len(links))


if __name__ == "__main__":
    main()
