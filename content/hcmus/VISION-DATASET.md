# HCMUS Nguyễn Văn Cừ — experimental YOLO model

The only checkpoints are **Giảng đường 1 → Tòa I → Tòa A → Tòa B**, at 227 Nguyễn Văn Cừ. IDs: `lecture-hall-1`, `building-i`, `building-a`, `building-b`. `other` is a rejection class, not another checkpoint. C/E/F are excluded from the checkpoint catalog. Palace weights are unchanged.

## Result, 2026-11-22

YOLO26s classification was fine-tuned on the local RTX 3060. Selected weights:

`output/yolo/hcmus-nguyen-van-cu/hcmus-v2/weights/best.pt`

SHA-256: `8c74e31e9d8126df1ecd8b0b84e394f879aad69c9c87255ef874bf080c7c83c9`

| Class | Train | Validation | Test | Correct on original test files |
| --- | ---: | ---: | ---: | ---: |
| Giảng đường 1 | 7 | 2 | 2 | 2/2 |
| Tòa I | 21 | 2 | 3 | 3/3 |
| Tòa A | 9 | 2 | 3 | 2/3 |
| Tòa B | 15 | 2 | 2 | 1/2 |
| Other | 20 | 2 | 6 | 5/6 |
| **Total** | **72** | **10** | **16** | **13/16 (81.25%)** |

This small public-web test is **not field accuracy**. Its 16 images come from four source groups and include correlated video frames. Results of 2/2 or 3/3 do not establish reliable real-world accuracy for a checkpoint. Sources span different years, camera angles, interiors/exteriors and renovations.

The frozen gate requires probability ≥0.98, margin ≥0.5 and usable image quality. It accepted **0/16** test images and rejected all 16. This demonstrates poor coverage at that strict threshold, not a proven zero-error recognizer. Raw `predicted` labels are suggestions; do not use them for automatic unlocks. **HCMUS recognition is not enabled in gameplay.**

The first run used 56 training images and reached 6/10 trainer validation. A training-only pass added 16 reviewed views; the second run fine-tuned all layers at a lower learning rate and reached 7/10 trainer validation. It was selected before test predictions were inspected. Training stopped after 41 epochs by early stopping. Model and thresholds were not changed after test evaluation.

Trainer validation uses canonical JPEG copies. Original-file inference gives 6/10 validation: one borderline Tòa I image changes top label after JPEG re-encoding. Both values are retained in `vision-training-report.json`; the 13/16 test score uses original reviewed files, as would an upload. Saved whole-image 320×320 preprocessing is preserved when loading the checkpoint.

## Sources and review

`image-sources.json` lists official HCMUS sources: Geology welcome event, Nobel lecture, graduation and Nguyễn Văn Cừ library photos. The library introduction locates these rooms on floors 9/10 of I. Images explicitly labelled Thủ Đức are negatives. Historical URLs returning 404 are not inputs.

`video-sources.json` records six public YouTube videos, authors and dates. The Nguyễn Văn Cừ walk-through identifies A around 01:45, B around 05:57–09:08 and I around 10:06. Other videos were compared visually against facades, signs and the distinctive lobby mural. Introduction videos contain both campuses; reviewed non-target frames are negatives.

`vision-reviewed-images.json` records all 98 image/frame IDs, timestamps, provenance, labels, splits and review evidence. Entire videos/events/publications stay in one split: five training groups, two validation groups, four test groups. Exact decoded-pixel duplicates across groups are rejected. Screening at 64-bit dHash distance ≤6 found no possible cross-split near-duplicates (`vision-data-audit.json`). Frames within one video remain correlated observations.

Photos/videos and weights stay in ignored directories. Attribution is retained; public access does not establish an open reuse license. Original web images are not added to public app assets or the demo ZIP.

## Try the model

```powershell
.\.venv-yolo\Scripts\python.exe scripts/hcmus_predictor.py path/to/photo.jpg
.\.venv-yolo\Scripts\python.exe scripts/hcmus_predictor.py path/to/photo.jpg --cpu
```

The JSON gives `predicted`, confidence, margin, `status` and `checkpointId`. A null checkpoint means the policy abstained. Confidence is not calibrated correctness. The predictor verifies checksum and class catalog. `output/yolo/hcmus-demo.zip` includes weights/config/code/report for local inference, without an HTTP server or gameplay integration.

## Reproduce or extend

```powershell
.\.venv-yolo\Scripts\python.exe scripts/collect-hcmus-images.py
.\.venv-yolo\Scripts\python.exe -m pip install yt-dlp
# Repeat for the public URLs in content/hcmus/video-sources.json:
.\.venv-yolo\Scripts\python.exe -m yt_dlp --js-runtimes node --remote-components ejs:github --no-playlist --no-continue -f "bestvideo[height<=720][protocol=https][ext=mp4]" --write-info-json -o "datasets/hcmus-nguyen-van-cu/videos/%(id)s.%(ext)s" "VIDEO_URL"
.\.venv-yolo\Scripts\python.exe scripts/extract-hcmus-video.py VIDEO_ID --step 10
# First-time copy only; merge later reviews instead of overwriting:
Copy-Item content/hcmus/vision-reviewed-images.json datasets/hcmus-nguyen-van-cu/reviewed-manifest.json -NoClobber
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --check-data
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --prepare-only
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --epochs 80 --name hcmus-next
```

Sampling: OPKa7SUlOYc every 8 seconds, Zrlmfq6aIhw every 3, others every 10. For O59Cr6vZD0Y also pass `--timestamps 28 30 34 114 124 128 356 362 368 372 374 612 616 622 628 634`. These are additional training-only reviewed views. Re-running a completed download with another format must use `--no-continue` to avoid mixing formats in a partial file.

Every new reviewed row needs unique `id`, valid label, dataset-relative `local_path`, genuine photographer/session `split_group`, provenance and `review_status: "visually_reviewed"`. Fixed splits must cover every class and never divide a source group. Missing classes, insufficient independent groups, conflicting duplicate labels, leakage and paths outside the dataset stop preparation. Do not invent independent groups to pass checks. Keep test sources held out; future tuning needs fresh test sources for an unbiased evaluation.

```powershell
.\.venv-yolo\Scripts\python.exe scripts/evaluate-hcmus-vision.py output/yolo/hcmus-nguyen-van-cu/hcmus-v2/weights/best.pt --split-manifest datasets/hcmus-nguyen-van-cu/training-b3cf21de2ff5/split-manifest.json
.\.venv-yolo\Scripts\python.exe tests/test_hcmus_training.py
.\.venv-yolo\Scripts\python.exe tests/test_hcmus_predictor.py
.\.venv-yolo\Scripts\python.exe scripts/package-hcmus-vision.py
```
