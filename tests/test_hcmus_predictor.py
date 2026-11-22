"""Check portable HCMUS loading and rejection; these are not accuracy tests."""
import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import unittest

from PIL import Image
import torch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from hcmus_predictor import HcmusPredictor, CHECKPOINTS


class PortableHcmusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(4)
        cls.predictor = HcmusPredictor(device="cpu")

    def test_weights_reload_with_only_the_four_agreed_checkpoints(self):
        self.assertEqual(set(self.predictor.model.names.values()), CHECKPOINTS | {"other"})
        self.assertEqual(self.predictor.device, "cpu")

    def test_blank_photo_does_not_return_a_checkpoint(self):
        with TemporaryDirectory() as folder:
            path = Path(folder) / "blank.png"
            Image.new("RGB", (128, 128), "white").save(path)
            result = self.predictor.predict(path)
            self.assertEqual(result["status"], "unknown")
            self.assertIsNone(result["checkpointId"])
            self.assertTrue(result["experimental"])

    def test_model_checksum_is_required_before_loading(self):
        with TemporaryDirectory() as folder:
            path = Path(folder) / "wrong-policy.json"
            policy = dict(self.predictor.policy, model_sha256="0"*64)
            path.write_text(json.dumps(policy), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                HcmusPredictor(path, device="cpu")

    def test_known_training_photo_is_only_a_loading_smoke_check(self):
        photo = ROOT / "datasets/hcmus-nguyen-van-cu/candidates/campus-anniversary-2025-4f290de5ff1b.jpg"
        if not photo.exists():
            self.skipTest("Optional local training photograph unavailable")
        result = self.predictor.predict(photo)
        self.assertEqual(result["predicted"], "building-a")


if __name__ == "__main__":
    unittest.main()
