"""Check the acceptance contract and portable model loading, not model accuracy."""
from io import BytesIO
import json
from pathlib import Path
import sys
import unittest

from PIL import Image
import torch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from palace_predictor import PalacePredictor, decide, assess_image


class RejectionPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = json.loads((ROOT / "content/palace/vision-model.json").read_text(encoding="utf-8"))

    def raw(self, predicted="cabinet", confidence=0.999, margin=0.9, quality_reasons=None):
        return dict(predicted=predicted, confidence=confidence, margin=margin,
                    quality_reasons=quality_reasons or [])

    def test_other_never_returns_unlockable_checkpoint(self):
        result = decide(self.raw("other", 1.0), self.config)
        self.assertEqual(result["status"], "unknown")
        self.assertIsNone(result["checkpointId"])

    def test_confident_but_ambiguous_prediction_is_rejected(self):
        result = decide(self.raw(confidence=0.99, margin=0.1), self.config)
        self.assertIsNone(result["checkpointId"])

    def test_flat_or_unusable_image_cannot_match(self):
        reasons = assess_image(Image.new("RGB", (640, 480), "black"))
        self.assertTrue(reasons)
        self.assertIsNone(decide(self.raw(quality_reasons=reasons), self.config)["checkpointId"])

    def test_model_and_policy_must_match(self):
        bad = dict(self.config, model_sha256="0"*64)
        with self.assertRaisesRegex(ValueError, "checksum"):
            PalacePredictor(weights=ROOT / self.config["weights"], policy=bad, device="cpu")


class PortableInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(4)
        cls.predictor = PalacePredictor(ROOT / "content/palace/vision-model.json", device="cpu")

    def test_reload_on_cpu_and_recognize_known_smoke_photo(self):
        # Bundled image is a smoke check, never presented as a held-out accuracy test.
        answer = self.predictor.predict(ROOT / "public/images/palace/rooftop.webp")
        self.assertEqual(answer["checkpointId"], "rooftop")

    def test_bytes_input_and_flat_image_rejection(self):
        data = BytesIO()
        Image.new("RGB", (128, 128), "white").save(data, format="PNG")
        self.assertIsNone(self.predictor.predict(data.getvalue())["checkpointId"])

    def test_unsupported_image_format(self):
        data = BytesIO()
        Image.new("RGB", (128, 128), "white").save(data, format="GIF")
        with self.assertRaisesRegex(ValueError, "JPG/PNG/WebP"):
            self.predictor.predict(data.getvalue())


if __name__ == "__main__":
    unittest.main()
