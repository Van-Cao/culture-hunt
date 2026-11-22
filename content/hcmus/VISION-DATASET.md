# HCMUS Nguyễn Văn Cừ: four-checkpoint training status

The only checkpoint labels are, in journey order:

1. `lecture-hall-1` — Giảng đường 1
2. `building-i` — Tòa I
3. `building-a` — Tòa A
4. `building-b` — Tòa B

`other` is a rejection/background class, not a checkpoint. Tòa C, E and F are not part of this model. The Palace classifier and its labels remain separate.

## Collection and review, 2026-11-22

Running `scripts/collect-hcmus-images.py` downloaded 76 candidates from the five official pages in `image-sources.json`. The old tradition-space page was readable, but its six image URLs returned HTTP 404. Candidates also include portraits, event posters, unrelated article thumbnails and images whose building cannot be established; downloading an image does not assign a training label.

Visual review selected five seed photos. Their URLs, evidence and conservative source groups are recorded in `vision-reviewed-images.json`:

| Class | Reviewed photos | Source groups | Remaining gap |
| --- | ---: | ---: | --- |
| Giảng đường 1 | 3 | 1 | More independent sessions; entrance/exterior views |
| Tòa I | 0 | 0 | Verified building views; an exhibition close-up is not sufficient exterior evidence |
| Tòa A | 2 | 1 | More independent sessions; the red A is visible in both reviewed images |
| Tòa B | 0 | 0 | Verified photos of this building at Nguyễn Văn Cừ |
| Other | 0 | 0 | Reviewed non-target scenes and confusing buildings |

The review keeps photos from the same event/publication together. Splitting near-identical photos or crops between train and validation would give misleading results. The seed is intentionally incomplete: **no HCMUS model has been trained and no accuracy is available**. CUDA detects the local RTX 3060; data coverage is the current blocker.

The source photos and generated contact sheets stay under the ignored `datasets/hcmus-nguyen-van-cu/` directory. Metadata is committed; website access does not establish an open reuse license. No downloaded photo is added to the app's public assets.

## Resume

From the repository root in PowerShell:

```powershell
.\.venv-yolo\Scripts\python.exe scripts/collect-hcmus-images.py
# First-time seed only. Merge this file into an existing reviewed manifest instead of replacing later reviews.
Copy-Item content/hcmus/vision-reviewed-images.json datasets/hcmus-nguyen-van-cu/reviewed-manifest.json -NoClobber
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --check-data
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py --prepare-only
.\.venv-yolo\Scripts\python.exe scripts/train-hcmus-vision.py
```

Review additional photos before adding them to `reviewed-manifest.json`. Every row needs a unique `id`, one of the five `label` values, `local_path` relative to the dataset, a real photographer/session `split_group`, source metadata and `review_status: "visually_reviewed"`. Merge related publications into one group if they reuse the same photos/session. Do not invent independent groups to make preparation pass. New source pages can be added to `image-sources.json` with the relevant checkpoint as a discovery hint, not a label.

The trainer rejects missing classes, fewer than two independent groups per class, identical images assigned to different classes or groups, and paths outside the dataset. Passing these checks only makes a train/validation split possible; it does not establish sufficient diversity or reliable accuracy. Reserve a separate source-disjoint test set, inspect near-duplicates and evaluate false acceptances before integrating the model into gameplay.

Training starts from `yolo26s-cls.pt` and writes under `output/yolo/hcmus-nguyen-van-cu/hcmus-v1*`. These weights are ignored by Git. The script never replaces the Palace model or enables HCMUS recognition automatically.
