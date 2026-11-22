"""Run the experimental four-checkpoint HCMUS classifier on CPU or CUDA."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps
import torch
from ultralytics import YOLO

from palace_predictor import assess_image, decide

ROOT = Path(__file__).resolve().parents[1]
CHECKPOINTS = {"lecture-hall-1", "building-i", "building-a", "building-b"}


class HcmusPredictor:
    def __init__(self, config_path=ROOT / "content/hcmus/vision-model.json", device=None):
        self.policy = json.loads(Path(config_path).read_text(encoding="utf-8"))
        self.weights = ROOT / self.policy["weights"]
        if hashlib.sha256(self.weights.read_bytes()).hexdigest() != self.policy["model_sha256"]:
            raise ValueError("HCMUS model checksum mismatch")
        self.device = device if device is not None else (0 if torch.cuda.is_available() else "cpu")
        self.model = YOLO(str(self.weights))
        if set(self.model.names.values()) != CHECKPOINTS | {"other"}:
            raise ValueError("Wrong class catalog for HCMUS")

    def predict(self, path):
        with Image.open(path) as original:
            if original.format not in {"JPEG", "PNG", "WEBP"} or original.width*original.height > 25_000_000:
                raise ValueError("Expected JPG/PNG/WebP up to 25 megapixels")
            image = ImageOps.exif_transpose(original).convert("RGB")
        quality = assess_image(image)
        result = self.model.predict(image, imgsz=self.policy["image_size"], device=self.device, verbose=False)[0]
        values, indices = torch.topk(result.probs.data.float().cpu(), 2)
        raw = dict(predicted=result.names[int(indices[0])], confidence=float(values[0]),
                   margin=float(values[0]-values[1]), quality_reasons=quality)
        decision = decide(raw, self.policy)
        return dict(decision, predicted=raw["predicted"], margin=raw["margin"],
                    destinationId="hcmus", experimental=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--config", type=Path, default=ROOT / "content/hcmus/vision-model.json")
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args()
    torch.set_num_threads(4)
    predictor = HcmusPredictor(args.config, device="cpu" if args.cpu else None)
    print(json.dumps(predictor.predict(args.image), ensure_ascii=False))
