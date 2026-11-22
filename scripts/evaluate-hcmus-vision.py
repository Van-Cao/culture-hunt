"""Evaluate fixed validation/test partitions once, without changing model or thresholds."""
import argparse
import csv
import hashlib
import json
from pathlib import Path

import torch
from PIL import Image, ImageOps
from ultralytics import YOLO
from palace_predictor import assess_image

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/hcmus-nguyen-van-cu"


def evaluate(model, rows, device):
    labels = sorted(model.names.values())
    confusion = {actual: {predicted: 0 for predicted in labels} for actual in labels}
    details = []
    for row in rows:
        result = model.predict(str(DATA / row["local_path"]), imgsz=320, device=device, verbose=False)[0]
        values, indices = torch.topk(result.probs.data.float().cpu(), 2)
        predicted = result.names[int(indices[0])]
        confidence, margin = float(values[0]), float(values[0]-values[1])
        with Image.open(DATA / row["local_path"]) as original:
            quality = assess_image(ImageOps.exif_transpose(original).convert("RGB"))
        accepted = not quality and predicted != "other" and confidence >= 0.98 and margin >= 0.5
        confusion[row["label"]][predicted] += 1
        details.append(dict(id=row["id"], actual=row["label"], predicted=predicted,
                            confidence=confidence, margin=margin, accepted=accepted,
                            correct=predicted == row["label"], source_group=row["split_group"], quality_reasons=quality))
    correct = sum(row["correct"] for row in details)
    accepted = [row for row in details if row["accepted"]]
    return dict(total=len(details), correct=correct, accuracy=correct/len(details),
                source_groups=len({row["split_group"] for row in rows}),
                per_class={label: dict(total=sum(confusion[label].values()), correct=confusion[label][label])
                           for label in labels}, confusion=confusion,
                fixed_gate=dict(min_probability=0.98, min_margin=0.5, accepted=len(accepted),
                    accepted_correct=sum(row["correct"] for row in accepted),
                    false_acceptances=sum(not row["correct"] for row in accepted),
                    rejected=len(details)-len(accepted)), details=details)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("weights", type=Path)
    parser.add_argument("--split-manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=ROOT / "content/hcmus/vision-training-report.json")
    args = parser.parse_args()
    torch.set_num_threads(4)
    config = json.loads((ROOT / "content/hcmus/vision-training.json").read_text(encoding="utf-8"))
    manifest = json.loads(args.split_manifest.read_text(encoding="utf-8"))
    classes = {row["id"] for row in config["checkpoints"]} | {config["backgroundClass"]}
    groups = {split: {row["split_group"] for row in manifest["records"] if row["split"] == split}
              for split in ("train", "val", "test")}
    if groups["train"] & groups["val"] or groups["train"] & groups["test"] or groups["val"] & groups["test"]:
        raise ValueError("Dataset source groups overlap")
    model = YOLO(str(args.weights))
    if set(model.names.values()) != classes:
        raise ValueError("Wrong model class catalog")
    device = 0 if torch.cuda.is_available() else "cpu"
    report = dict(destinationId="hcmus", campusId="nguyen-van-cu", schema_version=1,
                  training_run=args.weights.parent.parent.name,
                  weights=args.weights.resolve().relative_to(ROOT).as_posix(),
                  model_sha256=hashlib.sha256(args.weights.read_bytes()).hexdigest(),
                  dataset_fingerprint=manifest["fingerprint"],
                  split_counts=manifest["counts"],
                  split_groups={split: sorted(value) for split, value in groups.items()},
                  threshold_selection="Fixed before evaluation: probability 0.98 and margin 0.5; not tuned on test.",
                  field_validated=False, enabled_in_gameplay=False,
                  limitations=["Small public-web sample with correlated frames within each video.",
                    "Validation selects the checkpoint epoch; test sources are held out from training and epoch selection.",
                    "The test result is not expected real-world accuracy and must not be presented as such.",
                    "Older images and current phone photographs may differ in appearance and conditions."])
    for split in ("val", "test"):
        rows = [row for row in manifest["records"] if row["split"] == split]
        if not rows or {row["label"] for row in rows} != classes:
            raise ValueError(f"Missing {split} coverage")
        report[split] = evaluate(model, rows, device)
        print(split, report[split]["correct"], "/", report[split]["total"], report[split]["fixed_gate"], flush=True)
    experiments = []
    for folder in sorted(args.weights.parent.parent.parent.glob("hcmus-v*")):
        result_path = folder / "results.csv"
        if not result_path.exists():
            continue
        with result_path.open(encoding="utf-8") as handle:
            epochs = list(csv.DictReader(handle))
        best = max(epochs, key=lambda epoch: float(epoch["metrics/accuracy_top1"]))
        experiments.append(dict(run=folder.name, epochs_completed=len(epochs),
            best_validation_epoch=int(best["epoch"]),
            best_trainer_validation_accuracy=float(best["metrics/accuracy_top1"]),
            selected=folder == args.weights.parent.parent))
    report["model_selection"] = dict(basis="Higher validation top-1 before looking at held-out test predictions.", experiments=experiments)
    report["input_encoding_note"] = "Trainer validates canonical JPEG copies; this report evaluates the original reviewed files. A borderline prediction can change after JPEG re-encoding. See trainer validation and original-file validation separately."
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("Report:", args.output, flush=True)


if __name__ == "__main__":
    main()
