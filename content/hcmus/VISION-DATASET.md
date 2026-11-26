# HCMUS Nguyễn Văn Cừ — experimental YOLO model

The only checkpoints are **Giảng đường 1 → Tòa I → Tòa A → Tòa B**, at 227 Nguyễn Văn Cừ. IDs: `lecture-hall-1`, `building-i`, `building-a`, `building-b`. `other` is a rejection class. C/E/F are not checkpoints. Palace uses its separate model.

## Result, 2026-11-26

Selected experimental candidate: **hcmus-v3-drive**, YOLO26s classification, whole-image RGB resize to 320×320, trained on the local RTX 3060.

Weights: `output/yolo/hcmus-nguyen-van-cu/hcmus-v3-drive/weights/best.pt`

SHA-256: `7b0d817d4e98096372834814f33b53d80148f56015d180eed8aebfe73088bb52`

**Overall accuracy improvement has not been demonstrated.** On the same 22 original web/video test files, v2 scores **17/22 (77.27%)**, while this candidate scores **16/22 (72.73%)**. I improves from 4/5 to 5/5; rejection of non-checkpoint scenes falls from 7/9 to 5/9. This is a small regression benchmark, not expected real-world accuracy. The candidate was selected by validation (7/10 versus v2's 6/10), rather than by maximizing this test score.

| Class | Train | Validation | Test | v2 test correct | Candidate test correct |
| --- | ---: | ---: | ---: | ---: | ---: |
| Giảng đường 1 | 12 | 2 | 2 | 2/2 | 2/2 |
| Tòa I | 32 | 2 | 5 | 4/5 | 5/5 |
| Tòa A | 17 | 2 | 4 | 3/4 | 3/4 |
| Tòa B | 49 | 2 | 2 | 1/2 | 1/2 |
| Other | 20 | 2 | 9 | 7/9 | 5/9 |
| **Total** | **130** | **10** | **22** | **17/22** | **16/22** |

| Evaluation cohort | v2 correct | Candidate correct | Source groups |
| --- | ---: | ---: | ---: |
| legacy-regression | 13/16 | 12/16 | 4 |
| new-source-2026-11-26 | 4/6 | 4/6 | 2 |

The 16 legacy test images were already evaluated in v2. Six extra frames cover only A, I and `other`, with no new B or Giảng đường 1 coverage. Frames within each video are correlated. After the first expanded test, a further balanced/frozen-layer experiment was tried; it did not win validation selection. **All final test numbers are regression evidence, not a blind final accuracy estimate.** No test image was used as a training input. New photos from independent phone outings are still needed for field validation.

The unchanged gate requires probability ≥0.98, margin ≥0.5 and usable image quality. It accepted **5/22**, all correct in this small sample, and rejected **17/22**. This does not establish real-world precision. **Automatic acceptance and HCMUS gameplay recognition remain unvalidated and disabled.** Raw `predicted` labels are suggestions; confidence is not calibrated correctness.

## Drive collection and added web data

Source folder: https://drive.google.com/drive/folders/1vd6l8Ltg46AUWAH_byxTiCLa66rUJFV3

| User folder | Downloaded | Selected for training |
| --- | ---: | ---: |
| Tòa I | 19 | 10 |
| Tòa A | 15 | 8 |
| Tòa B | 130 | 34 |
| **Total** | **164** | **52** |

All 164 originals were downloaded and decoded. There are **27 exact duplicate uploads**, all in B. Of the remaining 137 unique files, 52 informative views were selected; 85 near-repeated, generic, blurred or misleading views were excluded. These include plants, noticeboards, tightly cropped doors/windows, and B-folder shots facing I. `drive-review-2026-11-26.json` records every decision, original SHA-256 and provenance. HEIC is decoded with pillow-heif; EXIF orientation is applied, and RGB JPEG review copies are produced without GPS metadata. Original files remain local.

EXIF dates identify one outing on **2026-11-25**. All 52 selected phone photos use the single train-only group `user-drive-2026-11-25`. No random train/test split of this outing is used, and no accuracy on unseen phone photos is claimed.

Six additional training images came from official sites: five wide Giảng đường 1 views at FETEL graduation and one GCC group photo in I's distinctive lobby. Event/article location alone was not used as the image label; close-up people, posters and sidebar thumbnails were excluded. Two further public videos supply the six additional evaluation frames. Ambiguous classrooms were not labelled as Giảng đường 1.

The final reviewed catalog has **162 images: 130 train, 10 validation, 22 test**, fingerprint `eee4ae8bd422`. All 98 earlier records keep their labels, source groups and splits. Entire videos/events/publications/phone outings stay in one split. Exact decoded-pixel duplicates are checked during preparation; dHash screening at distance ≤6 found no possible cross-split near-duplicates (`vision-data-audit.json`). This screening supplements visual review.

`image-sources.json`, `video-sources.json` and `vision-reviewed-images.json` retain attribution and review evidence. Public access does not establish an open reuse license. Photos/videos, signed download references and weights are not committed to Git; the inference ZIP excludes photo/video contents.

## Model selection and retained baseline

| Run | Original-file validation | Checkpoint trainer validation loss |
| --- | ---: | ---: |
| hcmus-v2 | 6/10 | 0.85910 |
| hcmus-v3-drive | 7/10 | 0.98781 |
| hcmus-v4-drive-warmstart | 7/10 | 1.23986 |
| hcmus-v5-drive-balanced | 7/10 | 1.08012 |

All new runs use the same 130 training images and unchanged validation sources. v3 starts from pretrained YOLO26s (lr 0.0003, all layers trainable, inverse-frequency class-weight power 0.5). v4 starts from v2 (lr 0.0001). v5 starts from v2 with eight early layers frozen and class-weight power 1, after reviewing regression errors. Best original-file validation top-1 wins; ties use checkpoint trainer validation loss. The selected v3 completed 25 epochs with early stopping. v2 metadata/report/catalog/card are retained in `history/v2/`; v2 weights also remain local.

Trainer validation uses canonical JPEG copies, while the evaluation report uses original reviewed files. JPEG encoding can change a borderline prediction. Ultralytics overwrites `best.pt` on equal maximum fitness, so the first epoch reaching maximum validation is not necessarily the saved epoch. Reports retain both first/last maximum epochs and the loaded checkpoint's validation metrics.

`vision-model-selection-2026-11-26.json` retains the initial pre-test selection and the later regression-aware comparison. `vision-training-comparison.json` pairs v2 and candidate predictions on identical evaluation IDs.

## Try or reproduce

```powershell
.\.venv-yolo\Scripts\python.exe scripts/hcmus_predictor.py path/to/photo.jpg --cpu
.\.venv-yolo\Scripts\python.exe scripts/package-hcmus-vision.py
```

`output/yolo/hcmus-demo.zip` contains the selected weights, checksum-bound policy, predictor, requirements and reports. It runs on another machine with Python; a GPU is optional for inference. JSON `checkpointId: null` means the strict gate abstained. It is an experimental CLI package.

To reproduce data preparation, obtain the source files listed in the provenance catalogs, install `scripts/requirements-vision-data.txt`, and decode Drive photos with `scripts/import-hcmus-drive.py` using fresh authenticated file references supplied on stdin. Signed URLs are used only in memory. Preserve the reviewed labels and source groups; the importer deliberately assigns no final labels. Public image collection uses `scripts/collect-hcmus-images.py`; videos use `scripts/extract-hcmus-video.py` and the timestamps recorded in the catalog.

```powershell
# After materializing the source files at catalog local_path locations:
Copy-Item content/hcmus/vision-reviewed-images.json datasets/hcmus-nguyen-van-cu/reviewed-manifest.json
.\.venv-yolo\Scripts\python.exe scripts/audit-hcmus-images.py
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --prepare-only
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --epochs 80 --name hcmus-next
# Evaluate validation before inspecting any NEW test sources:
.\.venv-yolo\Scripts\python.exe scripts/evaluate-hcmus-vision.py output/yolo/hcmus-nguyen-van-cu/hcmus-v3-drive/weights/best.pt --split-manifest datasets/hcmus-nguyen-van-cu/training-eee4ae8bd422/split-manifest.json --splits val --output output/yolo/hcmus-validation.json
.\.venv-yolo\Scripts\python.exe tests/test_hcmus_drive_import.py
.\.venv-yolo\Scripts\python.exe tests/test_hcmus_training.py
.\.venv-yolo\Scripts\python.exe tests/test_hcmus_predictor.py
npm test
```

Further improvements need independent phone sessions for A/B/I/G1, more non-checkpoint buildings and varied light/angles. Preserve this regression set; do not move its errors into training and continue calling it an independent test.
