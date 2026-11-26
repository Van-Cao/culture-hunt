# HCMUS Nguyễn Văn Cừ — experimental YOLO model

Checkpoints: **Giảng đường 1 → Tòa I → Tòa A → Tòa B**, at 227 Nguyễn Văn Cừ. IDs: `lecture-hall-1`, `building-i`, `building-a`, `building-b`. `other` means a non-checkpoint or insufficiently identifiable scene. It is not an additional stop.

## Measured result, 2026-11-26

**YOLO26m classification achieves 19/22 (86.36%) on the unchanged regression set**, versus v3's 16/22 (72.73%) and historical v2's 17/22 (77.27%). The requested **>80% regression target passes**. Original-file validation is **8/10**, versus v3's 7/10. This does not establish >80% accuracy on future phone images or at each checkpoint.

Selected run: `hcmus-v8-medium`; selected epoch **15**, **35 epochs** completed with early stopping on the RTX 3060.

Weights: `output/yolo/hcmus-nguyen-van-cu/hcmus-v8-medium/weights/best.pt`

SHA-256: `399a2baf45423d476e739fd9e26116561102d19293799f7e729e40bd5071bb0e`

Input: EXIF-corrected RGB, whole-image resize to **448×448**, tensor [0,1]. Saved inference transforms use built-in torchvision classes and reload on CPU.

| Class | Train | Validation | Regression | v3 correct | Current correct |
| --- | ---: | ---: | ---: | ---: | ---: |
| Giảng đường 1 | 12 | 2 | 2 | 2/2 | 2/2 |
| Tòa I | 37 | 2 | 5 | 5/5 | 4/5 |
| Tòa A | 18 | 2 | 4 | 3/4 | 4/4 |
| Tòa B | 49 | 2 | 2 | 1/2 | 1/2 |
| Other | 41 | 2 | 9 | 5/9 | 8/9 |
| **Total** | **157** | **10** | **22** | **16/22** | **19/22** |

| Cohort | v3 correct | Current correct | Source groups |
| --- | ---: | ---: | ---: |
| legacy-regression | 12/16 | 15/16 | 4 |
| new-source-2026-11-26 | 4/6 | 4/6 | 2 |

The 22 regression images come from six web/video source groups and include correlated frames. These sources were examined in earlier error analysis, so the score is **regression evidence**, not a blind final accuracy estimate. The six added-source frames cover only A, I and `other`. In particular, **B is only 1/2 correct**; this tiny class result needs more diverse independent photographs. All phone photos belong to one training-only outing; unseen-phone accuracy remains unknown.

The unchanged strict gate requires probability ≥0.98, margin ≥0.5 and usable image quality. It accepts **6/22**, all correct in this sample, and abstains on **16/22**. This limited sample does not establish real-world acceptance precision. Raw predictions remain suggestions. **Automatic acceptance and HCMUS gameplay recognition remain disabled and unvalidated.**

## Data and training changes

The catalog has **189 real reviewed images: 157 train, 10 validation, 22 regression**, fingerprint `0845e4b332df`. The previous 162 records retain their labels, split groups and decoded-pixel SHA-256 in `evaluation-baseline.json`. Missing/relabelled/replaced records stop training. All validation/test source images remain excluded from training.

Training adds **27 visually reviewed frames**: 21 negatives, 5 I views and 1 A view. These come from a new Nguyễn Văn Cừ Schannel campus tour and additional frames of the two existing training videos. I's entrance/SCIENCE wall and A's timber shutters/tiled canopy were matched visually. F-marked corridors, access roads, unrelated events and generic close-up objects are negatives; ambiguous lecture rooms are excluded. Entire videos remain in one split. `vision-data-expansion.json` lists the additions; `video-sources.json` retains URLs, authors and dates.

The Drive collection originally contained 164 uploads: I 19, A 15, B 130. It contributes **52 training photos (I 10, A 8, B 34)**, all in `user-drive-2026-11-25`. The other unique views were excluded as near-repeated, generic or misleading. HEIC originals are normalized into EXIF-corrected RGB review JPEGs without GPS metadata. **27 exact duplicate uploads and their 27 review copies were removed**, with canonical bytes verified by SHA-256; 137 unique originals remain local. Every decision and duplicate reference is retained in `drive-review-2026-11-26.json`.

No stochastic augmentation is counted as a new source image. Train-time augmentation applies mild affine/perspective changes, brightness/contrast/color variation, occasional blur/grayscale and small erasing regions. Inference keeps the whole image. Inverse-frequency loss weights balance class totals. Validation fitness uses raw top-1 first and loss to break ties, with a term large enough to survive Ultralytics' five-decimal rounding and smaller than one image's accuracy increment. `selected-checkpoint.json` records the actual saved epoch.

| Candidate | Original-file validation | Saved checkpoint validation loss |
| --- | ---: | ---: |
| hcmus-v6-geometric | 8/10 | 0.67159 |
| hcmus-v7-geometric-refine | 8/10 | 0.48059 |
| hcmus-v8-medium | 8/10 | 0.39870 |

v6 uses YOLO26s at 448px; v7 continues from v6 at lr 0.00005; v8 uses pretrained YOLO26m at lr 0.0003. All use the same 157 training photos and unchanged validation sources. Selection uses original-file validation top-1 and then checkpoint validation loss, before this candidate's regression predictions are evaluated. Confidence is not calibrated correctness.

Exact decoded-pixel duplicate checks and dHash screening at distance ≤6 found no possible cross-split duplicates (`vision-data-audit.json`). Perceptual hashing supplements visual review. Attribution is retained, and public access does not establish an open reuse license. Source photos/videos and weights are local ignored files, not public app assets.

## Current files and cleanup

`vision-model.json` pins the current weights, checksum and input resolution. `vision-training-report.json` contains measured predictions. `vision-training-comparison.json` keeps compact baseline/current metrics. `vision-model-selection-2026-11-26.json` records candidate selection. The regression threshold is guarded by the repository's metadata tests; changing the labels/splits or dropping hard images is not a way to meet it.

About 376 MB of obsolete run weights, caches, package-check folders, duplicate copies and unused previews were sent to Windows Recycle Bin. Redundant full v2 snapshots are replaced by the compact frozen contract and comparison; earlier tracked versions remain in Git history. Cleanup is recorded in `vision-cleanup.json`. Keep the current `best.pt`, source photos/video frames, current dataset and provenance for future work.

## Run or reproduce

```powershell
.\.venv-yolo\Scripts\python.exe scripts/hcmus_predictor.py path/to/photo.jpg --cpu
.\.venv-yolo\Scripts\python.exe scripts/package-hcmus-vision.py
```

`output/yolo/hcmus-demo.zip` contains current weights, checksum-bound configuration, predictor and reports. It can infer on another Python machine with CPU or GPU. A null `checkpointId` means abstention.

```powershell
# After obtaining the source files at the reviewed catalog's local_path locations:
.\.venv-yolo\Scripts\python.exe -m pip install -r scripts/requirements-vision-data.txt
Copy-Item content/hcmus/vision-reviewed-images.json datasets/hcmus-nguyen-van-cu/reviewed-manifest.json
.\.venv-yolo\Scripts\python.exe scripts/audit-hcmus-images.py
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --prepare-only
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --epochs 100 --name hcmus-next --base-model yolo26m-cls.pt --augmentation geometric --image-size 448 --class-weight-power 1
.\.venv-yolo\Scripts\python.exe scripts/evaluate-hcmus-vision.py output/yolo/hcmus-nguyen-van-cu/hcmus-v8-medium/weights/best.pt --split-manifest datasets/hcmus-nguyen-van-cu/training-0845e4b332df/split-manifest.json --post-regression-review
.\.venv-yolo\Scripts\python.exe -m unittest discover -s tests -p "test_hcmus_*.py"
npm test
```

Materialize Drive photos through `scripts/import-hcmus-drive.py` using fresh authenticated file references supplied on stdin. Signed URLs stay in memory. Public collection uses `scripts/collect-hcmus-images.py` and `scripts/extract-hcmus-video.py`; video timestamps and labels are in the reviewed catalog. Future improvements need genuinely new phone outings for all four checkpoints and non-checkpoint buildings, with separate independent evaluation. Preserve this fixed regression set.
