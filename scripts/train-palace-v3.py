"""Train v3 with class balancing; validation only selects weights, test remains sealed."""
import argparse
from copy import copy
import json
from pathlib import Path

import torch
import torchvision.transforms as T
from ultralytics import YOLO
from ultralytics.data.dataset import ClassificationDataset
from ultralytics.models.yolo.classify import ClassificationTrainer, ClassificationValidator

ROOT = Path(__file__).resolve().parents[1]


class RoomDataset(ClassificationDataset):
    def __init__(self, root, args, augment=False, prefix="", names=None):
        super().__init__(root, args, augment, prefix, names)
        transforms = [T.Resize((320, 320))]
        if augment:
            transforms.extend([T.RandomAffine(degrees=5, translate=(0.035, 0.035), scale=(0.95, 1.05), fill=114),
                               T.ColorJitter(brightness=0.22, contrast=0.2, saturation=0.15)])
        transforms.append(T.ToTensor())
        self.torch_transforms = T.Compose(transforms)


class RoomValidator(ClassificationValidator):
    def build_dataset(self, img_path):
        return RoomDataset(img_path, self.args, False, self.args.split, self.names)

    def get_stats(self):
        stats = super().get_stats()
        prediction = torch.cat(self.pred, 0)[:, 0]
        target = torch.cat(self.targets, 0)
        f1s = []
        for index in range(len(self.names)):
            tp = int(((prediction == index) & (target == index)).sum())
            fp = int(((prediction == index) & (target != index)).sum())
            fn = int(((prediction != index) & (target == index)).sum())
            f1s.append(2*tp / max(2*tp+fp+fn, 1))
        stats["fitness"] = sum(f1s) / len(f1s)
        return stats


class RoomTrainer(ClassificationTrainer):
    def build_dataset(self, img_path, mode="train", batch=None):
        return RoomDataset(img_path, self.args, mode == "train", mode, self.data["names"])

    def get_validator(self):
        return RoomValidator(self.test_loader, self.save_dir, args=copy(self.args), _callbacks=self.callbacks)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", default="palace-v3-web")
    parser.add_argument("--epochs", type=int, default=100)
    args = parser.parse_args()
    pointer = json.loads((ROOT / "datasets/palace/v3-dataset.json").read_text(encoding="utf-8"))
    folder = ROOT / pointer["folder"]
    if not torch.cuda.is_available():
        raise RuntimeError("Expected CUDA GPU")
    torch.set_num_threads(4)
    model = YOLO(str(ROOT / "yolo26s-cls.pt"))
    model.train(trainer=RoomTrainer, data=str(folder), device=0, epochs=args.epochs,
                patience=25, imgsz=320, batch=8, workers=0, optimizer="AdamW", lr0=0.0005,
                lrf=0.1, cos_lr=True, weight_decay=0.001, freeze=4, cls_pw=0.5, dropout=0.25,
                seed=2026, deterministic=True, amp=False, project=str(ROOT / "output/yolo"),
                name=args.name, plots=True)
    print("Best model:", model.trainer.best, flush=True)
    print("Test has NOT been evaluated; freeze weights and validation rejection policy before test.", flush=True)


if __name__ == "__main__":
    main()
