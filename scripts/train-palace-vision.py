"""Train an experimental checkpoint classifier with photographer-disjoint validation."""
import argparse
from collections import Counter
from copy import copy
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import random
import shutil

import torch
import torchvision.transforms as T
from ultralytics import YOLO
from ultralytics.data.dataset import ClassificationDataset
from ultralytics.models.yolo.classify import ClassificationTrainer, ClassificationValidator

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/palace"


class FullImageDataset(ClassificationDataset):
    def __init__(self, root, args, augment=False, prefix="", names=None):
        super().__init__(root, args, augment, prefix, names)
        # Preserve every part of the room. The aspect ratio changes, but no identifying
        # feature is cropped out. Built-in transforms remain serializable in best.pt.
        operations = [T.Resize((args.imgsz, args.imgsz))]
        if augment:
            operations.append(T.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1))
        operations.append(T.ToTensor())
        self.torch_transforms = T.Compose(operations)


class FullImageValidator(ClassificationValidator):
    def build_dataset(self, img_path):
        return FullImageDataset(img_path, self.args, False, self.args.split, self.names)

    def get_stats(self):
        stats = super().get_stats()
        # Gameplay uses the first prediction, not membership in the top five.
        stats["fitness"] = stats["metrics/accuracy_top1"]
        return stats


class FullImageTrainer(ClassificationTrainer):
    def build_dataset(self, img_path, mode="train", batch=None):
        return FullImageDataset(img_path, self.args, mode == "train", mode, self.data["names"])

    def get_validator(self):
        return FullImageValidator(self.test_loader, self.save_dir,
                                  args=copy(self.args), _callbacks=self.callbacks)


def prepare(include_tour=False):
    reviewed = json.loads((DATA / "reviewed-manifest.json").read_text(encoding="utf-8"))
    rows = [dict(r) for r in reviewed["records"]
            if r["rights_status"] == "open_license" and not r.get("duplicate_of")]
    # Link near-duplicate photographers before choosing any split.
    parent = {r["split_group"]: r["split_group"] for r in rows}
    def find(group):
        while parent[group] != group:
            group = parent[group]
        return group
    by_id = {r["id"]: r for r in rows}
    for pair in reviewed["near_duplicate_pairs"]:
        if pair["a"] in by_id and pair["b"] in by_id:
            a, b = (find(by_id[pair[key]]["split_group"]) for key in ("a", "b"))
            parent[b] = a
    for row in rows:
        row["split_group"] = find(row["split_group"])
    groups = sorted({r["split_group"] for r in rows})
    counts = Counter(r["label"] for r in rows)
    rng, best = random.Random(2026), None
    # Select the split using counts only, never predictions or accuracy.
    for _ in range(20000):
        val_groups = {group for group in groups if rng.random() < 0.25}
        val = Counter(r["label"] for r in rows if r["split_group"] in val_groups)
        if any(not (0 < val[label] < count) for label, count in counts.items()):
            continue
        score = sum(abs(val[label] / count - 0.25) for label, count in counts.items())
        if best is None or score < best[0]:
            best = (score, val_groups)
    if best is None:
        raise RuntimeError("Insufficient independent groups for train/val coverage of every class")
    for row in rows:
        row["split"] = "val" if row["split_group"] in best[1] else "train"
    if include_tour:
        screenshots = json.loads((DATA / "reviewed-tour-manifest.json").read_text(encoding="utf-8"))
        # Preserve the baseline Commons split; the whole tour is additional training only.
        val_rows = [r for r in rows if r["split"] == "val"]
        for row in screenshots:
            if row["review_status"] != "visually_reviewed" or row["split_group"] != "official-tour-session":
                raise ValueError("Unexpected screenshot review/group")
            for reference in val_rows:
                distance = (int(row["dhash"], 16) ^ int(reference["dhash"], 16)).bit_count()
                if row["pixel_sha256"] == reference["pixel_sha256"] or distance <= 6:
                    raise ValueError(f"Possible screenshot/validation duplicate: {row['id']} / {reference['id']}")
            row["split"] = "train"
        rows.extend(screenshots)
    fingerprint = hashlib.sha256(json.dumps([(r["id"], r["pixel_sha256"], r["label"], r["split"])
                                             for r in rows], sort_keys=True).encode()).hexdigest()[:12]
    folder = DATA / ("training-" + fingerprint)
    for row in rows:
        target = folder / row["split"] / row["label"] / (row["id"] + ".jpg")
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copy2(DATA / row["local_path"], target)
    assert not ({r["split_group"] for r in rows if r["split"] == "train"} &
                {r["split_group"] for r in rows if r["split"] == "val"})
    manifest = dict(fingerprint=fingerprint, records=rows,
                    counts={s: dict(Counter(r["label"] for r in rows if r["split"] == s))
                            for s in ("train", "val")},
                    independent_test_set=False,
                    includes_tour_screenshots=include_tour,
                    note="Commons baseline uses open-license images. Optional official tour screenshots are train-only local research inputs with unverified reuse rights. Validation selects best epoch; it is not an independent test.")
    (folder / "split-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Dataset:", folder, "\nCounts:", manifest["counts"], flush=True)
    return folder, manifest


def evaluate(weights, folder, manifest, destination):
    model = YOLO(str(weights))
    rows = [r for r in manifest["records"] if r["split"] == "val"]
    sources = [str(folder / "val" / r["label"] / (r["id"] + ".jpg")) for r in rows]
    predictions = model.predict(sources, imgsz=320, device=0, verbose=False)
    labels = sorted({r["label"] for r in manifest["records"]})
    confusion = {a: {b: 0 for b in labels} for a in labels}
    details = []
    for row, result in zip(rows, predictions):
        label = result.names[result.probs.top1]
        confusion[row["label"]][label] += 1
        details.append(dict(id=row["id"], expected=row["label"], predicted=label,
                            confidence=float(result.probs.top1conf)))
    per_class = {}
    for label in labels:
        tp = confusion[label][label]
        support = sum(confusion[label].values())
        predicted = sum(confusion[a][label] for a in labels)
        precision, recall = tp / max(predicted, 1), tp / max(support, 1)
        per_class[label] = dict(support=support, precision=precision, recall=recall,
                               f1=2*precision*recall/max(precision+recall, 1e-12))
    correct = sum(r["expected"] == r["predicted"] for r in details)
    report = dict(weights=str(weights.relative_to(ROOT)), counts=manifest["counts"],
                  includes_tour_screenshots=manifest.get("includes_tour_screenshots", False),
                  model_sha256=hashlib.sha256(weights.read_bytes()).hexdigest(),
                  environment={name: version(name) for name in ("torch", "torchvision", "ultralytics")},
                  selection_metric="validation top-1 accuracy", seed=2026,
                  dataset_fingerprint=manifest["fingerprint"], validation_correct=correct,
                  validation_count=len(rows), validation_accuracy=correct/len(rows),
                  macro_f1=sum(v["f1"] for v in per_class.values())/len(labels),
                  per_class=per_class, confusion_matrix=confusion, predictions=details,
                  preprocessing="RGB, resize entire image to 320x320, tensor [0,1]; no crop",
                  independent_test_set=False,
                  limitations="Tiny validation set used for epoch selection; no real-world accuracy claim or calibrated rejection threshold. Do not enable checkpoint unlocks yet.")
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("validation_correct", "validation_count", "validation_accuracy", "macro_f1")}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--include-tour-screenshots", action="store_true",
                        help="Include visually approved official-tour screenshots for local research, train only")
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--name", default="palace-v1-top1")
    args = parser.parse_args()
    folder, manifest = prepare(args.include_tour_screenshots)
    if args.prepare_only:
        return
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA unavailable; expected RTX 3060")
    torch.set_num_threads(4)
    model = YOLO(str(ROOT / "yolo26s-cls.pt"))
    model.train(trainer=FullImageTrainer, data=str(folder), device=0,
                epochs=args.epochs, patience=20, imgsz=320, batch=8, workers=0,
                optimizer="AdamW", lr0=0.001, lrf=0.1, weight_decay=0.001,
                freeze=8, dropout=0.2, seed=2026, deterministic=True, amp=False,
                project=str(ROOT / "output/yolo"), name=args.name, plots=True)
    best = Path(model.trainer.best)
    destination = best.parent.parent / "palace-evaluation.json"
    evaluate(best, folder, manifest, destination)
    report_name = "vision-tour-training-report.json" if args.include_tour_screenshots else "vision-training-report.json"
    shutil.copy2(destination, ROOT / "content/palace" / report_name)
    print("Model:", best, "\nEvaluation:", destination, flush=True)


if __name__ == "__main__":
    main()
