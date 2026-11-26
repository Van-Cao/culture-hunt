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
report = json.loads((ROOT / "content/hcmus/vision-training-report.json").read_text(encoding="utf-8"))
if report["model_sha256"] != config["model_sha256"] or report["weights"] != config["weights"]:
    raise ValueError("HCMUS report does not describe the selected model")
comparison = json.loads((ROOT / "content/hcmus/vision-training-comparison.json").read_text(encoding="utf-8"))
if comparison["candidate"]["model_sha256"] != config["model_sha256"]:
    raise ValueError("HCMUS comparison does not describe the selected model")
baseline_test = comparison["baseline"]["test"]
config["weights"] = "models/hcmus.pt"
target = ROOT / "output/yolo/hcmus-demo.zip"
test = report["test"]
cohorts = "\n".join(f"- {name}: {item['correct']}/{item['total']} raw top-1; {item['source_groups']} source groups."
                    for name, item in test.get("cohorts", {}).items())
readme = f"""# Culture Hunt — experimental HCMUS classifier

Python 3.11+. CPU supported; NVIDIA GPU optional.
1. Extract this ZIP.
2. python -m pip install -r requirements.txt
3. python scripts/hcmus_predictor.py path/to/photo.jpg --cpu

Only checkpoints: Lecture Hall 1, buildings I, A and B, at Nguyen Van Cu.
predicted is a raw candidate; checkpointId=null means the strict gate abstained.
Raw web test/regression result: {test['correct']}/{test['total']} ({test['accuracy']:.2%}).
{cohorts}
Very small correlated sample, not field accuracy. See report.json for missing cohort classes.
Baseline v2 on the same test: {baseline_test['correct']}/{baseline_test['total']}.
Overall accuracy improvement has not been demonstrated; see comparison.json.
The fixed gate accepted {test['fixed_gate']['accepted']}/{test['total']} test images,
with {test['fixed_gate']['false_acceptances']} false acceptances in this small sample.
Automatic recognition is not validated. All user phone photos were training-only.
No HTTP API or gameplay integration. See MODEL-CARD.md and report.json.
"""
with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    archive.write(weights, "models/hcmus.pt")
    archive.writestr("content/hcmus/vision-model.json", json.dumps(config, ensure_ascii=False, indent=2))
    for filename in ("hcmus_predictor.py", "palace_predictor.py"):
        archive.write(ROOT / "scripts" / filename, "scripts/" + filename)
    archive.write(ROOT / "scripts/requirements-vision-inference.txt", "requirements.txt")
    archive.write(ROOT / "content/hcmus/vision-training-report.json", "report.json")
    archive.write(ROOT / "content/hcmus/vision-training-comparison.json", "comparison.json")
    archive.write(ROOT / "content/hcmus/vision-model-selection-2026-11-26.json", "selection.json")
    archive.write(ROOT / "content/hcmus/VISION-DATASET.md", "MODEL-CARD.md")
    archive.write(ROOT / "content/hcmus/video-sources.json", "video-sources.json")
    archive.write(ROOT / "content/hcmus/image-sources.json", "image-sources.json")
    archive.write(ROOT / "content/hcmus/vision-data-audit.json", "data-audit.json")
    archive.write(ROOT / "content/hcmus/drive-review-2026-11-26.json", "drive-review.json")
    archive.write(ROOT / "content/hcmus/vision-reviewed-images.json", "reviewed-images.json")
    archive.writestr("README.md", readme)
print("Created:", target, "bytes:", target.stat().st_size)
