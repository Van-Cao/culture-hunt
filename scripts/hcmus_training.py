"""HCMUS-only augmentation and validation checkpoint selection."""
from copy import copy

import torchvision.transforms as T
from torchvision.transforms import InterpolationMode
from ultralytics.data.dataset import ClassificationDataset
from ultralytics.models.yolo.classify import ClassificationTrainer, ClassificationValidator


class HcmusDataset(ClassificationDataset):
    def __init__(self, root, args, augment=False, prefix="", names=None, profile="basic"):
        super().__init__(root, args, augment, prefix, names)
        operations = [T.Resize((args.imgsz, args.imgsz))]
        if augment:
            if profile == "geometric":
                operations.extend([
                    T.RandomAffine(7, translate=(0.06, 0.06), scale=(0.85, 1.1),
                                   interpolation=InterpolationMode.BILINEAR, fill=114),
                    T.RandomApply([T.RandomPerspective(0.15, p=1,
                        interpolation=InterpolationMode.BILINEAR, fill=114)], p=0.2),
                    T.ColorJitter(0.25, 0.25, 0.15, 0.02),
                    T.RandomGrayscale(p=0.05),
                    T.RandomApply([T.GaussianBlur(3, sigma=(0.1, 1.2))], p=0.1),
                ])
            else:
                operations.append(T.ColorJitter(0.15, 0.15, 0.1))
        operations.append(T.ToTensor())
        if augment and profile == "geometric":
            operations.append(T.RandomErasing(p=0.15, scale=(0.02, 0.1), ratio=(0.5, 2)))
        # Only these built-in validation transforms are attached to the saved model.
        self.torch_transforms = T.Compose(operations)


class HcmusValidator(ClassificationValidator):
    def build_dataset(self, img_path):
        return HcmusDataset(img_path, self.args, False, self.args.split, self.names)

    def get_stats(self):
        stats = super().get_stats()
        loss = 0.0
        if self.training and self.loss:
            loss = sum(float(value) for value in self.loss.values()) / max(len(self.dataloader), 1)
        # Validator rounds metrics to five decimals. A 1e-6 term vanishes there.
        # Bound the tie-break below a quarter of one image's accuracy increment.
        support = max(len(self.dataloader.dataset), 1)
        stats["fitness"] = stats["metrics/accuracy_top1"] + 0.25 / support / (1 + max(loss, 0))
        return stats


class HcmusTrainer(ClassificationTrainer):
    augmentation_profile = "basic"

    def build_dataset(self, img_path, mode="train", batch=None):
        return HcmusDataset(img_path, self.args, mode == "train", mode,
                            self.data["names"], self.augmentation_profile)

    def get_validator(self):
        return HcmusValidator(self.test_loader, self.save_dir,
                              args=copy(self.args), _callbacks=self.callbacks)
