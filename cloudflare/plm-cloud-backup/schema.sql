CREATE TABLE IF NOT EXISTS user_backups (
  user_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  version TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pack_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  box_key TEXT NOT NULL,
  pack_count INTEGER NOT NULL,
  source TEXT,
  sku TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pack_records_box_key
ON pack_records(box_key);

CREATE INDEX IF NOT EXISTS idx_pack_records_box_count
ON pack_records(box_key, pack_count);
