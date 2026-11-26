"""Verify dataset rejection and source separation without training a model."""
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("hcmus_training", ROOT / "scripts/train-hcmus-vision.py")
training = importlib.util.module_from_spec(spec)
spec.loader.exec_module(training)


class DatasetTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.config = dict(datasetDirectory=str(self.root),
                           checkpoints=[dict(id="building-a"), dict(id="building-b")],
                           backgroundClass="other")
        self.rows = []
        for label_index, label in enumerate(("building-a", "building-b", "other")):
            for session in range(2):
                photo_id = f"{label}-{session}"
                Image.new("RGB", (80, 70), (20+label_index*50, 30+session*60, 80)).save(self.root / f"{photo_id}.png")
                self.rows.append(dict(id=photo_id, label=label, local_path=f"{photo_id}.png",
                                      split_group=f"session-{session}", review_status="visually_reviewed"))

    def write(self):
        (self.root / "reviewed-manifest.json").write_text(json.dumps(self.rows), encoding="utf-8")

    def test_split_keeps_every_source_session_on_one_side(self):
        self.write()
        root, rows, _ = training.load_data(self.config)
        folder = training.prepare(root, rows)
        saved = json.loads((folder / "split-manifest.json").read_text(encoding="utf-8"))
        groups = {split: {r["split_group"] for r in saved["records"] if r["split"] == split} for split in ("train", "val")}
        self.assertFalse(groups["train"] & groups["val"])
        for split in ("train", "val"):
            self.assertEqual({r["label"] for r in saved["records"] if r["split"] == split}, {"building-a", "building-b", "other"})
        self.assertFalse(saved["independent_test_set"])

    def test_missing_checkpoint_does_not_start_training(self):
        self.rows = [r for r in self.rows if r["label"] != "building-b"]
        self.write()
        with self.assertRaisesRegex(ValueError, "building-b: 0 photos"):
            training.load_data(self.config)

    def test_frozen_labels_and_source_pixels_cannot_change_to_improve_the_score(self):
        self.write()
        _, rows, _ = training.load_data(self.config)
        for row in rows:
            row["split"] = "train" if row["split_group"] == "session-0" else "val"
        contract = dict(records=[dict(row) for row in rows])
        training.validate_frozen_records(rows, contract)
        for key, value in [("pixel_sha256", "replaced-photo"), ("label", "other"), ("split", "train")]:
            with self.subTest(key=key):
                edited = [dict(row) for row in rows]
                edited[1][key] = value
                with self.assertRaisesRegex(ValueError, "Frozen reviewed image changed"):
                    training.validate_frozen_records(edited, contract)
        with self.assertRaisesRegex(ValueError, "missing"):
            training.validate_frozen_records(rows[1:], contract)

    def test_reusing_a_campus_photo_for_two_buildings_is_rejected(self):
        self.rows[2]["local_path"] = self.rows[0]["local_path"]
        self.write()
        with self.assertRaisesRegex(ValueError, "conflicting building labels"):
            training.load_data(self.config)

    def test_duplicate_photo_cannot_enter_another_session(self):
        self.rows[1]["local_path"] = self.rows[0]["local_path"]
        self.write()
        with self.assertRaisesRegex(ValueError, "share a source group"):
            training.load_data(self.config)

    def test_photo_path_cannot_escape_the_dataset(self):
        self.rows[0]["local_path"] = "../outside.png"
        self.write()
        with self.assertRaisesRegex(ValueError, "stay inside"):
            training.load_data(self.config)

    def test_fixed_split_cannot_put_frames_from_one_video_on_both_sides(self):
        self.write()
        root, rows, _ = training.load_data(self.config)
        for row in rows:
            row["split"] = "train" if row["split_group"] == "session-0" else "val"
        rows[0]["split"] = "val"
        with self.assertRaisesRegex(ValueError, "cannot cross dataset splits"):
            training.prepare(root, rows)

    def test_fixed_holdout_is_preserved_and_requires_every_class(self):
        self.write()
        root, rows, _ = training.load_data(self.config)
        for row in rows:
            row["split"] = "train" if row["split_group"] == "session-0" else "val"
        holdout = [dict(row, id=row["id"]+"-heldout", split="test", split_group="session-test")
                   for row in rows if row["split"] == "val"]
        folder = training.prepare(root, rows+holdout)
        saved = json.loads((folder / "split-manifest.json").read_text(encoding="utf-8"))
        self.assertTrue(saved["independent_test_set"])
        self.assertEqual(saved["counts"]["test"], {"building-a": 1, "building-b": 1, "other": 1})
        with self.assertRaisesRegex(ValueError, "Every class needs coverage"):
            training.prepare(root, rows+holdout[:-1])


if __name__ == "__main__":
    unittest.main()
