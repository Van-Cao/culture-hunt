"""Load the trained Palace model and return conservative, API-ready recognition results."""
import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps
import torch
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[1]
CHECKPOINTS = {"facade", "reception", "cabinet", "rooftop", "bunker"}


def assess_image(image):
    sample = image.copy()
    sample.thumbnail((640, 640))
    gray = cv2.cvtColor(np.asarray(sample), cv2.COLOR_RGB2GRAY)
    reasons = []
    if min(image.size) < 64:
        reasons.append("image_too_small")
    if float(gray.std()) < 8:
        reasons.append("image_has_too_little_detail")
    if float(gray.mean()) < 15 or float(gray.mean()) > 245:
        reasons.append("image_exposure_unusable")
    return reasons


def decide(raw, policy):
    reason = "matched"
    if raw["quality_reasons"]:
        reason = raw["quality_reasons"][0]
    elif raw["predicted"] == "other":
        reason = "outside_checkpoint_catalog"
    elif raw["predicted"] not in policy["enabled_checkpoints"]:
        reason = "checkpoint_not_validated"
    elif raw["confidence"] < policy["min_probability"] or raw["margin"] < policy["min_margin"]:
        reason = "uncertain_prediction"
    return dict(status="matched" if reason == "matched" else "unknown",
                checkpointId=raw["predicted"] if reason == "matched" else None,
                confidence=raw["confidence"], reason=reason, mode="yolo")


class PalacePredictor:
    def __init__(self, config_path=None, *, weights=None, policy=None, device=None):
        if config_path is not None:
            policy = json.loads(Path(config_path).read_text(encoding="utf-8"))
            weights = weights or ROOT / policy["weights"]
        if policy is None or weights is None:
            raise ValueError("Provide a model config or weights plus policy")
        self.policy = policy
        weights = Path(weights)
        if policy.get("model_sha256") and hashlib.sha256(weights.read_bytes()).hexdigest() != policy["model_sha256"]:
            raise ValueError("Model checksum does not match its validation/rejection policy")
        self.device = device if device is not None else (0 if torch.cuda.is_available() else "cpu")
        self.model = YOLO(str(weights))
        if set(self.model.names.values()) != CHECKPOINTS | {"other"}:
            raise ValueError("Wrong class catalog for the Palace model")

    def inspect(self, source):
        if isinstance(source, bytes):
            if len(source) > 5*1024*1024:
                raise ValueError("Image exceeds 5MB")
            source = BytesIO(source)
        with Image.open(source) as original:
            if original.format not in {"JPEG", "PNG", "WEBP"} or original.width*original.height > 25_000_000:
                raise ValueError("Expected JPG/PNG/WebP up to 25 megapixels")
            image = ImageOps.exif_transpose(original).convert("RGB")
        quality = assess_image(image)
        result = self.model.predict(image, imgsz=320, device=self.device, verbose=False)[0]
        scores = result.probs.data.float().cpu()
        values, indices = torch.topk(scores, 2)
        return dict(predicted=result.names[int(indices[0])], confidence=float(values[0]),
                    margin=float(values[0]-values[1]), quality_reasons=quality)

    def predict(self, source):
        return decide(self.inspect(source), self.policy)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--config", type=Path, default=ROOT / "content/palace/vision-model.json")
    parser.add_argument("--weights", type=Path)
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args()
    torch.set_num_threads(4)
    predictor = PalacePredictor(args.config, weights=args.weights, device="cpu" if args.cpu else None)
    print(json.dumps(predictor.predict(args.image), ensure_ascii=False))
