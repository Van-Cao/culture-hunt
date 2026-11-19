"""Package the frozen v3 model and inference code without the training dataset."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / "content/palace/vision-model.json").read_text(encoding="utf-8"))
weights = ROOT / config["weights"]
if hashlib.sha256(weights.read_bytes()).hexdigest() != config["model_sha256"]:
    raise ValueError("Model/policy checksum mismatch")
config["weights"] = "models/palace-v3.pt"
target = ROOT / "output/yolo/palace-v3-demo.zip"
readme = """# Culture Hunt Palace v3 — local demo inference

Requires Python 3.11+. CPU is supported; NVIDIA GPU is optional.

1. Extract this ZIP.
2. Install: python -m pip install -r requirements.txt
3. Run: python scripts/palace_predictor.py path/to/photo.jpg --cpu

The result is matched + checkpointId or unknown + null checkpointId.
Keep the model and its checksum-bound configuration together.

This package is inference code, not an HTTP server or Vercel deployment.
For a Python API, initialize PalacePredictor once and call predict(photo_bytes).
Continue checking game state and expected checkpoint on the server.

Evaluation: 34/40 raw classifications correct on a small held-out web set.
The frozen rejection policy accepted 9 correct checkpoint photos and 1 incorrect
outside-catalog photo, rejecting 30/31 outside-catalog photos. One corridor was
misidentified as bunker. Only 9 positive test photos; no field-accuracy guarantee.
See report.json and MODEL-CARD.md for limitations and provenance.
"""
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    archive.write(weights, "models/palace-v3.pt")
    archive.writestr("content/palace/vision-model.json", json.dumps(config, ensure_ascii=False, indent=2))
    archive.write(ROOT / "scripts/palace_predictor.py", "scripts/palace_predictor.py")
    archive.write(ROOT / "scripts/requirements-vision-inference.txt", "requirements.txt")
    archive.write(ROOT / "content/palace/vision-v3-report.json", "report.json")
    archive.write(ROOT / "content/palace/VISION-V3.md", "MODEL-CARD.md")
    archive.writestr("README.md", readme)
print("Created:", target, "bytes:", target.stat().st_size)
