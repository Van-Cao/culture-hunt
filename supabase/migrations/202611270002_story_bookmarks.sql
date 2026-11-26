ALTER TABLE culture_hunt.explorer_progress ADD COLUMN IF NOT EXISTS bookmarks_json TEXT NOT NULL DEFAULT '[]';
