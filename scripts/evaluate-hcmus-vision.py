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
    image_size = int(model.overrides.get("imgsz", 320))
    confusion = {actual: {predicted: 0 for predicted in labels} for actual in labels}
    details = []
    for row in rows:
        result = model.predict(str(DATA / row["local_path"]), imgsz=image_size, device=device, verbose=False)[0]
        values, indices = torch.topk(result.probs.data.float().cpu(), 2)
        predicted = result.names[int(indices[0])]
        confidence, margin = float(values[0]), float(values[0]-values[1])
        with Image.open(DATA / row["local_path"]) as original:
            quality = assess_image(ImageOps.exif_transpose(original).convert("RGB"))
        accepted = not quality and predicted != "other" and confidence >= 0.98 and margin >= 0.5
        confusion[row["label"]][predicted] += 1
        details.append(dict(id=row["id"], actual=row["label"], predicted=predicted,
                            confidence=confidence, margin=margin, accepted=accepted,
                            correct=predicted == row["label"], source_group=row["split_group"], quality_reasons=quality,
                            evaluation_cohort=row.get("evaluation_cohort")))
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
    parser.add_argument("--splits", nargs="+", choices=("val", "test"), default=["val", "test"],
                        help="Use --splits val for model selection before inspecting test predictions")
    parser.add_argument("--post-regression-review", action="store_true",
                        help="Mark evaluation as regression evidence after earlier expanded-test results were inspected")
    parser.add_argument("--minimum-regression-accuracy", type=float, default=0.8,
                        help="Record whether raw test accuracy strictly exceeds this target; never excludes rejected images")
    args = parser.parse_args()
    if not 0 <= args.minimum_regression_accuracy < 1:
        parser.error("minimum regression accuracy must be within [0,1)")
    torch.set_num_threads(4)
    config = json.loads((ROOT / "content/hcmus/vision-training.json").read_text(encoding="utf-8"))
    manifest = json.loads(args.split_manifest.read_text(encoding="utf-8"))
    classes = {row["id"] for row in config["checkpoints"]} | {config["backgroundClass"]}
    extra_test = [row for row in manifest["records"] if row["split"] == "test" and
                  (row.get("evaluation_cohort") or "").startswith("new-source-")]
    missing_extra_classes = sorted(classes - {row["label"] for row in extra_test})
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
                  image_size=int(model.overrides.get("imgsz", 320)),
                  dataset_fingerprint=manifest["fingerprint"],
                  split_counts=manifest["counts"],
                  split_groups={split: sorted(value) for split, value in groups.items()},
                  threshold_selection="Fixed before evaluation: probability 0.98 and margin 0.5; not tuned on test.",
                  field_validated=False, enabled_in_gameplay=False,
                  expanded_test_used_in_prior_error_analysis=args.post_regression_review,
                  limitations=["Small public-web sample with correlated frames within each video.",
                    "Validation selects the checkpoint epoch. Test images are not training inputs.",
                    "Legacy test predictions were already seen in v2; they are regression evidence, not a fresh blind evaluation.",
                    f"Additional source-disjoint test: {len(extra_test)} frames; missing classes: {', '.join(missing_extra_classes) or 'none'}. This small cohort does not establish field accuracy.",
                    "All user phone photos are training-only, one outing; field accuracy on new phone photos remains unknown.",
                    "The test result is not expected real-world accuracy and must not be presented as such.",
                    "Older images and current phone photographs may differ in appearance and conditions."])
    for split in dict.fromkeys(args.splits):
        rows = [row for row in manifest["records"] if row["split"] == split]
        if not rows or {row["label"] for row in rows} != classes:
            raise ValueError(f"Missing {split} coverage")
        report[split] = evaluate(model, rows, device)
        print(split, report[split]["correct"], "/", report[split]["total"], report[split]["fixed_gate"], flush=True)
        if split == "test":
            report["regression_target"] = dict(metric="raw_top1_accuracy_on_unchanged_regression_images",
                minimum_exclusive=args.minimum_regression_accuracy, actual=report[split]["accuracy"],
                passed=report[split]["accuracy"] > args.minimum_regression_accuracy,
                field_accuracy_guaranteed=False)
            # Summarize existing predictions: never rerun or tune a threshold per cohort.
            cohorts = {}
            for name in sorted({r.get("evaluation_cohort") or "unspecified" for r in rows}):
                details = [r for r in report[split]["details"] if (r["evaluation_cohort"] or "unspecified") == name]
                accepted = [r for r in details if r["accepted"]]
                cohorts[name] = dict(total=len(details), correct=sum(r["correct"] for r in details),
                    accuracy=sum(r["correct"] for r in details)/len(details),
                    classes=sorted({r["actual"] for r in details}),
                    source_groups=len({r["source_group"] for r in details}),
                    accepted=len(accepted), false_acceptances=sum(not r["correct"] for r in accepted))
            report[split]["cohorts"] = cohorts
    experiments = []
    for folder in sorted(args.weights.parent.parent.parent.glob("hcmus-v*")):
        result_path = folder / "results.csv"
        if not result_path.exists():
            continue
        with result_path.open(encoding="utf-8") as handle:
            epochs = list(csv.DictReader(handle))
        best = max(epochs, key=lambda epoch: float(epoch["metrics/accuracy_top1"]))
        last_best = [epoch for epoch in epochs if float(epoch["metrics/accuracy_top1"]) == float(best["metrics/accuracy_top1"])][-1]
        experiments.append(dict(run=folder.name, epochs_completed=len(epochs),
            first_maximum_validation_epoch=int(best["epoch"]),
            last_maximum_validation_epoch=int(last_best["epoch"]),
            checkpoint_validation_loss=float(last_best["val/loss"]),
            best_trainer_validation_accuracy=float(best["metrics/accuracy_top1"]),
            selected=folder == args.weights.parent.parent))
        selected_metadata = folder / "selected-checkpoint.json"
        if selected_metadata.exists():
            experiments[-1]["saved_checkpoint"] = json.loads(selected_metadata.read_text(encoding="utf-8"))
            experiments[-1]["checkpoint_validation_loss"] = experiments[-1]["saved_checkpoint"]["metrics"]["val/loss"]
    report["model_selection"] = dict(
        basis=("Select by original-file validation top-1; break ties by checkpoint trainer validation loss. " +
               ("Data, augmentation and architecture experiments followed earlier regression error analysis. Treat all test scores as regression evidence, not a blind final accuracy estimate."
                if args.post_regression_review else
                "Selection is frozen before expanded test predictions. Legacy v2 test history was already known.")),
        epoch_note="Old runs overwrote best.pt on equal top-1. New runs use validation loss to break top-1 ties; saved_checkpoint records the actual selected epoch. First/last maximum CSV epochs alone do not identify the checkpoint.",
        selected_checkpoint_validation_metrics=model.ckpt.get("train_metrics"), experiments=experiments)
    report["input_encoding_note"] = "Trainer validates canonical JPEG copies; this report evaluates the original reviewed files. A borderline prediction can change after JPEG re-encoding. See trainer validation and original-file validation separately."
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print("Report:", args.output, flush=True)


if __name__ == "__main__":
    main()
