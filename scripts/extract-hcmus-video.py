"""Extract public campus-video candidates; every video remains one source group."""
import argparse
import json
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets/hcmus-nguyen-van-cu"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video_id")
    parser.add_argument("--step", type=int, default=10)
    parser.add_argument("--timestamps", type=int, nargs="+")
    args = parser.parse_args()
    if not args.video_id.replace("_", "").replace("-", "").isalnum() or args.step <= 0:
        parser.error("Use a video ID and a positive sampling interval")
    metadata = json.loads((DATA / "videos" / f"{args.video_id}.info.json").read_text(encoding="utf-8"))
    video = cv2.VideoCapture(str(DATA / "videos" / f"{args.video_id}.mp4"))
    if not video.isOpened():
        raise RuntimeError("Video unavailable")
    folder = DATA / "video-frames" / args.video_id
    folder.mkdir(parents=True, exist_ok=True)
    rows = []
    timestamps = args.timestamps if args.timestamps is not None else range(0, int(metadata["duration"]), args.step)
    for seconds in sorted(set(timestamps)):
        if not 0 <= seconds < int(metadata["duration"]):
            parser.error("Timestamp is outside the video")
        video.set(cv2.CAP_PROP_POS_MSEC, seconds*1000)
        ok, frame = video.read()
        if not ok:
            continue
        photo_id = f"video-{args.video_id}-{seconds:05d}"
        path = folder / f"{seconds:05d}.jpg"
        cv2.imwrite(str(path), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        rows.append(dict(id=photo_id, local_path=path.relative_to(DATA).as_posix(),
            source_page=metadata["webpage_url"], seconds=seconds,
            author=metadata.get("uploader"), license=metadata.get("license") or "Not established",
            rights_status="unverified", split_group="video-" + args.video_id,
            label=None, review_status="pending"))
    video.release()
    manifest_path = folder / "candidates.json"
    if manifest_path.exists():
        previous = json.loads(manifest_path.read_text(encoding="utf-8"))["records"]
        merged = {row["seconds"]: row for row in previous}
        merged.update({row["seconds"]: row for row in rows})
        rows = [merged[key] for key in sorted(merged)]
    manifest_path.write_text(json.dumps(dict(records=rows), ensure_ascii=False, indent=2), encoding="utf-8")
    for start in range(0, len(rows), 40):
        batch = rows[start:start+40]
        sheet = Image.new("RGB", (1600, ((len(batch)+4)//5)*200), "white")
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(batch):
            x, y = (i % 5)*320, (i//5)*200
            with Image.open(DATA / row["local_path"]) as original:
                sheet.paste(ImageOps.contain(original, (316, 177)), (x, y))
            seconds = row["seconds"]
            draw.text((x+2, y+180), f"{seconds//60:02d}:{seconds%60:02d} ({seconds}s)", fill="black")
        sheet.save(folder / f"contact-{start//40+1}.jpg", quality=92)
    print(args.video_id, len(rows), "pending frames", flush=True)


if __name__ == "__main__":
    main()
