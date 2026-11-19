"""Freeze rejection policy on validation, then evaluate the reserved web test exactly once."""
from collections import Counter
import hashlib
from importlib.metadata import version
import json
from pathlib import Path

import torch
from ultralytics import YOLO

from palace_predictor import PalacePredictor, CHECKPOINTS, decide

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/palace"
WEIGHTS = ROOT / "output/yolo/palace-v3-web/weights/best.pt"
REPORT = ROOT / "content/palace/vision-v3-report.json"


def summarize(rows, policy=None):
    classes = sorted(CHECKPOINTS | {"other"})
    matrix = {a: {b: 0 for b in classes} for a in classes}
    for row in rows:
        matrix[row["expected"]][row["predicted"]] += 1
    per_class = {}
    for label in classes:
        tp = matrix[label][label]
        support = sum(matrix[label].values())
        predicted = sum(matrix[a][label] for a in classes)
        per_class[label] = dict(support=support, correct=tp, recall=tp/max(support, 1),
            f1=2*tp/max(support+predicted, 1))
    result = dict(count=len(rows), correct=sum(r["predicted"] == r["expected"] for r in rows),
        macro_f1=sum(r["f1"] for r in per_class.values())/len(classes), per_class=per_class, confusion_matrix=matrix)
    result["accuracy"] = result["correct"]/max(len(rows), 1)
    if policy:
        accepted = [(row, decide(row, policy)) for row in rows]
        accepted = [(row, answer) for row, answer in accepted if answer["status"] == "matched"]
        correct = sum(answer["checkpointId"] == row["expected"] for row, answer in accepted)
        positive_count = sum(r["expected"] != "other" for r in rows)
        result["rejection_policy"] = dict(accepted=len(accepted), accepted_correct=correct,
            accepted_wrong=len(accepted)-correct, rejected=len(rows)-len(accepted),
            accepted_precision=correct/len(accepted) if accepted else None,
            positive_recall=correct/max(positive_count, 1),
            negative_false_accepts=sum(row["expected"] == "other" for row, _ in accepted),
            negative_count=sum(row["expected"] == "other" for row in rows))
    return result


def main():
    if REPORT.exists():
        raise RuntimeError("Test already evaluated. Preserve this report; collect a new holdout before a new test-based iteration.")
    torch.set_num_threads(4)
    pointer = json.loads((DATA / "v3-dataset.json").read_text(encoding="utf-8"))
    folder = ROOT / pointer["folder"]
    manifest = json.loads((folder / "split-manifest.json").read_text(encoding="utf-8"))
    digest = hashlib.sha256(WEIGHTS.read_bytes()).hexdigest()
    policy = dict(version=3, weights=WEIGHTS.relative_to(ROOT).as_posix(), model_sha256=digest,
        image_size=320, preprocessing="RGB; resize entire image 320x320; float tensor [0,1]",
        min_probability=0.85, min_margin=0.2, enabled_checkpoints=sorted(CHECKPOINTS),
        dataset_fingerprint=manifest["fingerprint"],
        intended_use="Small Palace demo with abstention. Confidence is not a calibrated probability of correctness.")
    predictor = PalacePredictor(weights=WEIGHTS, policy=policy)
    def predict_split(split):
        return [dict(id=row["id"], expected=row["label"], source_group=row["split_group"],
                     **predictor.inspect(folder / split / row["label"] / (row["id"]+".jpg")))
                for row in manifest["records"] if row["split"] == split]
    validation = predict_split("val")
    candidates = []
    for threshold in (0.85, 0.9, 0.95, 0.98, 0.995):
        for margin in (0.2, 0.3, 0.4, 0.5):
            candidate = dict(policy, min_probability=threshold, min_margin=margin)
            counts = summarize(validation, candidate)["rejection_policy"]
            if counts["accepted_wrong"] == 0:
                candidates.append((counts["accepted_correct"], threshold+margin, candidate))
    if not candidates:
        raise RuntimeError("No rejection policy satisfied validation precision; do not enable recognition")
    policy = max(candidates, key=lambda c: (c[0], c[1]))[2]
    # Disable any class without an accepted, correct validation example.
    policy["enabled_checkpoints"] = sorted({r["expected"] for r in validation
        if r["expected"] != "other" and decide(r, policy)["checkpointId"] == r["expected"]})
    policy["validation_support"] = dict(Counter(r["expected"] for r in validation))
    policy["policy_frozen_before_test"] = True
    config = ROOT / "content/palace/vision-model.json"
    config.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
    # No policy or hyperparameter changes after this point.
    test = predict_split("test")
    test_rows = [r for r in manifest["records"] if r["split"] == "test"]
    sources = [str(folder / "test" / r["label"] / (r["id"]+".jpg")) for r in test_rows]
    baseline = None
    old_weights = ROOT / "output/yolo/palace-v2-tour/weights/best.pt"
    if old_weights.exists():
        old_model = YOLO(str(old_weights))
        old_results = old_model.predict(sources, imgsz=320, device=0, verbose=False)
        old_rows = [dict(id=r["id"], expected=r["label"], predicted=result.names[result.probs.top1])
                    for r, result in zip(test_rows, old_results)]
        baseline = summarize(old_rows)
    report = dict(model=policy, counts=manifest["counts"],
        environment={name: version(name) for name in ("torch", "torchvision", "ultralytics")},
        protocol=manifest["test_protocol"], source_group_counts={s: len(g) for s, g in manifest["source_groups"].items()},
        validation=summarize(validation, policy), test=summarize(test, policy),
        v2_on_same_test=baseline, baseline_available=old_weights.exists(),
        validation_predictions=validation, test_predictions=test,
        limitations="Small web-only test with sparse positive classes, not field accuracy. Validation selects both epoch and rejection policy. No automatic gameplay unlock integration has been enabled.")
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (WEIGHTS.parent.parent / "palace-evaluation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"validation": report["validation"], "test": report["test"], "baseline": report["v2_on_same_test"]}, indent=2))


if __name__ == "__main__":
    main()
