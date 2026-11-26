"""Screen reviewed HCMUS images for exact and perceptual cross-split duplicates."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/hcmus-nguyen-van-cu"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--distance", type=int, default=6)
    args = parser.parse_args()
    rows = json.loads((DATA / "reviewed-manifest.json").read_text(encoding="utf-8"))["records"]
    hashes = []
    for row in rows:
        path = (DATA / row["local_path"]).resolve()
        if not path.is_relative_to(DATA.resolve()):
            raise ValueError("Image path must stay inside dataset")
        with Image.open(path) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            exact = hashlib.sha256(str(image.size).encode()+image.tobytes()).hexdigest()
            small = image.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
            difference = sum(int(small.getpixel((x, y)) > small.getpixel((x+1, y))) << (y*8+x)
                             for y in range(8) for x in range(8))
        hashes.append((row, exact, difference))
    candidates = []
    for i, (a, exact_a, hash_a) in enumerate(hashes):
        for b, exact_b, hash_b in hashes[i+1:]:
            if a["split"] == b["split"]:
                continue
            distance = (hash_a ^ hash_b).bit_count()
            if exact_a == exact_b or distance <= args.distance:
                candidates.append(dict(a=a["id"], b=b["id"], distance=distance, exact=exact_a == exact_b))
    report = dict(images_checked=len(rows), cross_split_candidate_distance_max=args.distance,
                  possible_cross_split_near_duplicates=candidates,
                  notes=["Exact decoded-pixel duplicate checks also run during preparation.",
                         "64-bit dHash is a screening aid; visual source/scene review is still required.",
                         "Entire videos/events/user phone outing stay in one split; frames are correlated.",
                         "Legacy test sources were already evaluated in v2; new-source cohort is separately identified."])
    target = ROOT / "content/hcmus/vision-data-audit.json"
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(dict(images_checked=len(rows), cross_split_candidates=candidates)), flush=True)
    if candidates:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
