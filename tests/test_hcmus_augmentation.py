"""Verify that rounded validation fitness preserves accuracy and resolves overfit ties."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

import torch
from ultralytics.models.yolo.classify import ClassificationValidator

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from hcmus_training import HcmusValidator


class Loader:
    dataset = list(range(10))

    def __len__(self):
        return 1


class SelectionTests(unittest.TestCase):
    def fitness(self, accuracy, loss):
        validator = object.__new__(HcmusValidator)
        validator.training = True
        validator.loss = {"loss": torch.tensor(loss)}
        validator.dataloader = Loader()
        with patch.object(ClassificationValidator, "get_stats", return_value={"metrics/accuracy_top1": accuracy}):
            result = validator.get_stats()
        self.assertEqual(result["metrics/accuracy_top1"], accuracy)
        # BaseValidator rounds metrics to five decimals before checkpoint selection.
        return round(result["fitness"], 5)

    def test_higher_accuracy_wins_even_with_a_much_larger_loss(self):
        self.assertGreater(self.fitness(0.9, 100), self.fitness(0.8, 0))

    def test_equal_accuracy_keeps_lower_loss_after_ultralytics_rounding(self):
        self.assertGreater(self.fitness(0.8, 0.4), self.fitness(0.8, 1.2))
        self.assertGreater(self.fitness(0.8, 0.48701), self.fitness(0.8, 0.4888))


if __name__ == "__main__":
    unittest.main()
