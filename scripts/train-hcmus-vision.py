"""Prepare/train a separate HCMUS classifier only after reviewed, grouped photos exist."""
import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import random
import re

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "content/hcmus/vision-training.json"


def load_data(config):
    root = ROOT / config["datasetDirectory"]
    manifest = root / "reviewed-manifest.json"
    if not manifest.exists():
        raise ValueError(f"No reviewed HCMUS dataset: {manifest}. Add labelled photos and photographer/session groups first.")
    raw = json.loads(manifest.read_text(encoding="utf-8"))
    records = raw["records"] if isinstance(raw, dict) else raw
    classes = {c["id"] for c in config["checkpoints"]} | {config["backgroundClass"]}
    rows, seen, ids = [], {}, set()
    for record in records:
        if record.get("review_status") != "visually_reviewed":
            continue
        if record.get("label") not in classes or not record.get("split_group"):
            raise ValueError("Each reviewed photo needs a valid checkpoint label and photographer/session split_group")
        if not re.fullmatch(r"[A-Za-z0-9_-]+", record.get("id", "")) or record["id"] in ids:
            raise ValueError("Photo IDs must be unique and contain only letters, digits, underscores or hyphens")
        ids.add(record["id"])
        source = (root / record["local_path"]).resolve()
        if not source.is_relative_to(root.resolve()):
            raise ValueError("Photo path must stay inside the HCMUS dataset")
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            if min(image.size) < 64:
                raise ValueError(f"Photo too small: {record['id']}")
            digest = hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()
        if digest in seen:
            if seen[digest]["label"] != record["label"]:
                raise ValueError("Same photo has conflicting building labels; do not train with the shared campus overview")
            if seen[digest]["split_group"] != record["split_group"]:
                raise ValueError("Duplicate photos must share a source group before splitting")
            continue
        row = dict(record, pixel_sha256=digest)
        seen[digest] = row
        rows.append(row)
    counts = Counter(r["label"] for r in rows)
    missing = []
    for label in sorted(classes):
        groups = {r["split_group"] for r in rows if r["label"] == label}
        if counts[label] < 2 or len(groups) < 2:
            missing.append(f"{label}: {counts[label]} photos / {len(groups)} source groups")
    if missing:
        raise ValueError("Insufficient independent data (need train and validation coverage): " + "; ".join(missing))
    return root, rows, counts


def prepare(root, rows):
    if any("split" in row for row in rows):
        if any(row.get("split") not in {"train", "val", "test"} for row in rows):
            raise ValueError("Every reviewed row must specify train, val or test when using a fixed split")
        group_splits = {}
        for row in rows:
            existing = group_splits.setdefault(row["split_group"], row["split"])
            if existing != row["split"]:
                raise ValueError("A photographer/session group cannot cross dataset splits")
        classes = {row["label"] for row in rows}
        splits = {row["split"] for row in rows}
        if not {"train", "val"} <= splits:
            raise ValueError("Fixed splits need train and validation data")
        for split in splits:
            if {row["label"] for row in rows if row["split"] == split} != classes:
                raise ValueError(f"Every class needs coverage in the {split} split")
        return materialize(root, rows)
    groups = sorted({r["split_group"] for r in rows})
    counts = Counter(r["label"] for r in rows)
    rng, best = random.Random(2026), None
    for _ in range(20000):
        val_groups = {group for group in groups if rng.random() < 0.25}
        val = Counter(r["label"] for r in rows if r["split_group"] in val_groups)
        if any(not 0 < val[label] < total for label, total in counts.items()):
            continue
        score = sum(abs(val[label]/total-0.25) for label, total in counts.items())
        if best is None or score < best[0]:
            best = score, val_groups
    if best is None:
        raise ValueError("Cannot split source groups without losing a class; collect more independent sessions")
    rows = [dict(r, split="val" if r["split_group"] in best[1] else "train") for r in rows]
    return materialize(root, rows)


def materialize(root, rows):
    fingerprint = hashlib.sha256(json.dumps([(r["id"], r["label"], r["pixel_sha256"], r["split"]) for r in rows]).encode()).hexdigest()[:12]
    folder = root / ("training-" + fingerprint)
    for row in rows:
        target = folder / row["split"] / row["label"] / (row["id"] + ".jpg")
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            with Image.open(root / row["local_path"]) as original:
                ImageOps.exif_transpose(original).convert("RGB").save(target, quality=95)
    has_test = any(row["split"] == "test" for row in rows)
    manifest = dict(fingerprint=fingerprint, records=rows, independent_test_set=has_test,
                    counts={split: dict(Counter(row["label"] for row in rows if row["split"] == split))
                            for split in ("train", "val", "test")},
                    note="Source-disjoint phone/public-web data. Test sources are excluded from training/epoch selection. Legacy regression and fresh-source cohorts must be reported separately; this is not a field evaluation."
                    if has_test else "Train/validation only; collect a separate source-disjoint test before claiming accuracy.")
    (folder / "split-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return folder


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-data", action="store_true")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--name", default="hcmus-v1")
    parser.add_argument("--initial-weights", type=Path, help="Optional previous HCMUS checkpoint for continued fine-tuning")
    parser.add_argument("--learning-rate", type=float, default=0.0003)
    parser.add_argument("--freeze", type=int, default=0, help="Number of early layers to freeze")
    parser.add_argument("--class-weight-power", type=float, default=0.5,
                        help="Inverse-frequency loss weight power; 1 balances class totals")
    args = parser.parse_args()
    if args.epochs <= 0 or args.learning_rate <= 0 or args.freeze < 0 or not 0 <= args.class_weight_power <= 1:
        parser.error("epochs/lr must be positive, freeze non-negative and class weight power within [0,1]")
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    try:
        root, rows, counts = load_data(config)
        print("Reviewed HCMUS photos:", dict(counts), flush=True)
        if args.check_data:
            return
        folder = prepare(root, rows)
    except (ValueError, KeyError, OSError) as error:
        print("HCMUS training not started:", error, flush=True)
        raise SystemExit(2)
    print("Prepared:", folder, flush=True)
    if args.prepare_only:
        return
    # Reuse the established whole-image preprocessing; weights/output stay separate.
    spec = importlib.util.spec_from_file_location("palace_training", ROOT / "scripts/train-palace-vision.py")
    shared = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(shared)
    import torch
    from ultralytics import YOLO
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; configure a training device before continuing")
    torch.set_num_threads(4)
    model = YOLO(str(args.initial_weights or ROOT / config["baseModel"]))
    if args.initial_weights and set(model.names.values()) != {row["id"] for row in config["checkpoints"]} | {config["backgroundClass"]}:
        raise ValueError("Initial HCMUS checkpoint has the wrong class catalog")
    model.train(trainer=shared.FullImageTrainer, data=str(folder), device=0, epochs=args.epochs,
                patience=20, imgsz=config["imageSize"], batch=8, workers=0,
                optimizer="AdamW", lr0=args.learning_rate, warmup_epochs=0,
                cls_pw=args.class_weight_power, freeze=args.freeze, dropout=0.2,
                seed=2026, deterministic=True, amp=False,
                project=str(ROOT / config["outputDirectory"]), name=args.name)
    print("HCMUS model:", model.trainer.best, flush=True)
    print("Evaluate on independent HCMUS photos before enabling recognition.", flush=True)


if __name__ == "__main__":
    main()
