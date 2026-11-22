"""Package HCMUS inference weights and provenance, excluding downloaded photos/videos."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / "content/hcmus/vision-model.json").read_text(encoding="utf-8"))
weights = ROOT / config["weights"]
if hashlib.sha256(weights.read_bytes()).hexdigest() != config["model_sha256"]:
    raise ValueError("HCMUS model/policy checksum mismatch")
config["weights"] = "models/hcmus.pt"
target = ROOT / "output/yolo/hcmus-demo.zip"
readme = """# Culture Hunt — experimental HCMUS classifier

Python 3.11+. CPU supported; NVIDIA GPU optional.
1. Extract this ZIP.
2. python -m pip install -r requirements.txt
3. python scripts/hcmus_predictor.py path/to/photo.jpg --cpu

Only checkpoints: Lecture Hall 1, buildings I, A and B, at Nguyen Van Cu.
predicted is a raw candidate; checkpointId=null means the strict gate abstained.
Raw held-out web result: 13/16 (81.25%). Very small correlated sample, not field accuracy.
The fixed gate accepted 0/16 test images, so automatic recognition is not validated.
No HTTP API or gameplay integration. See MODEL-CARD.md and report.json.
"""
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    archive.write(weights, "models/hcmus.pt")
    archive.writestr("content/hcmus/vision-model.json", json.dumps(config, ensure_ascii=False, indent=2))
    for filename in ("hcmus_predictor.py", "palace_predictor.py"):
        archive.write(ROOT / "scripts" / filename, "scripts/" + filename)
    archive.write(ROOT / "scripts/requirements-vision-inference.txt", "requirements.txt")
    archive.write(ROOT / "content/hcmus/vision-training-report.json", "report.json")
    archive.write(ROOT / "content/hcmus/VISION-DATASET.md", "MODEL-CARD.md")
    archive.write(ROOT / "content/hcmus/video-sources.json", "video-sources.json")
    archive.write(ROOT / "content/hcmus/vision-reviewed-images.json", "reviewed-images.json")
    archive.writestr("README.md", readme)
print("Created:", target, "bytes:", target.stat().st_size)
