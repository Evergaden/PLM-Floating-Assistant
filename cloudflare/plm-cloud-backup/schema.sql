CREATE TABLE IF NOT EXISTS user_backups (
  user_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  version TEXT,
  user_name TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backup_owners (
  user_id TEXT PRIMARY KEY,
  user_name TEXT,
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

CREATE TABLE IF NOT EXISTS feishu_synced_records (
  sync_key TEXT PRIMARY KEY,
  record_type TEXT,
  sku TEXT,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_report_cache (
  cache_key TEXT PRIMARY KEY,
  source TEXT,
  report TEXT NOT NULL,
  error TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cleaning_rules (
  rule_id TEXT PRIMARY KEY,
  missing_field TEXT NOT NULL,
  priority TEXT,
  action_code TEXT,
  action_label TEXT,
  maintenance_status TEXT,
  status_override TEXT,
  likely_plm_empty INTEGER NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 0,
  sources TEXT,
  issue_kinds TEXT,
  examples TEXT,
  reason TEXT,
  suggestion TEXT,
  note TEXT,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  latest_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cleaning_rules_priority
ON cleaning_rules(priority, updated_at);

CREATE TABLE IF NOT EXISTS classification_rules (
  rule_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  keywords TEXT,
  negative_keywords TEXT,
  confidence REAL NOT NULL DEFAULT 0,
  examples TEXT,
  payload TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classification_rules_kind
ON classification_rules(kind, updated_at);

CREATE TABLE IF NOT EXISTS loading_tips (
  tip_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  weight INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loading_tips_enabled_order
ON loading_tips(enabled, sort_order, updated_at);
