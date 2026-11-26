"""Check HEIC import, source-file preservation and safe handling of download failures."""
import importlib.util
from io import BytesIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import Mock, patch

from PIL import Image
from pillow_heif import from_pillow

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("drive_import", ROOT / "scripts/import-hcmus-drive.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.out = Path(self.temp.name) / "drive"
        self.override = patch.object(importer, "OUT", self.out)
        self.override.start()
        self.addCleanup(self.override.stop)
        self.item = dict(id="photo_123", label="building-b", mime_type="image/heic",
                         filename="IMG_123.HEIC", download_url="https://example.invalid/signed-secret",
                         source_page="https://drive.google.com/file/d/photo_123/view",
                         folder_url="https://drive.google.com/drive/folders/photos")

    def test_heic_becomes_review_jpeg_and_original_is_retained_without_signed_url(self):
        raw = BytesIO()
        from_pillow(Image.new("RGB", (100, 150), "red")).save(raw)
        response = Mock(content=raw.getvalue())
        with patch.object(importer.requests, "get", return_value=response) as get:
            row = importer.materialize(self.item)
            cached = importer.materialize(self.item)
        get.assert_called_once()
        self.assertEqual(row["original_sha256"], cached["original_sha256"])
        self.assertEqual((self.out.parent / row["original_path"]).read_bytes(), raw.getvalue())
        with Image.open(self.out.parent / row["local_path"]) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(image.size, (100, 150))
        self.assertEqual(row["review_status"], "pending")
        self.assertIsNone(row["label"])
        self.assertNotIn("signed-secret", json.dumps(row))

    def test_login_html_is_not_saved_as_a_photo(self):
        with patch.object(importer.requests, "get", return_value=Mock(content=b"<html>Sign in</html>")):
            with self.assertRaises(OSError):
                importer.materialize(self.item)
        self.assertEqual(list(self.out.rglob("*.heic")), [])

    def test_bad_id_or_unknown_building_does_not_fetch_or_write(self):
        for change in [dict(id="../escape"), dict(id=""), dict(label="building-f")]:
            with self.subTest(change=change), patch.object(importer.requests, "get") as get:
                with self.assertRaises(ValueError):
                    importer.materialize(dict(self.item, **change))
                get.assert_not_called()
        self.assertFalse(self.out.exists())


if __name__ == "__main__":
    unittest.main()
