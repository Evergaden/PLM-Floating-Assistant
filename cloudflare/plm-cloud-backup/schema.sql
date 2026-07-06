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

CREATE TABLE IF NOT EXISTS insight_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  sku TEXT,
  brand TEXT,
  name TEXT,
  product_type TEXT,
  price TEXT,
  pack_qty TEXT,
  package_size TEXT,
  product_size TEXT,
  missing_fields TEXT,
  source TEXT,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insight_events_type_time
ON insight_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_insight_events_sku
ON insight_events(sku);

CREATE INDEX IF NOT EXISTS idx_insight_events_product_type
ON insight_events(product_type);
