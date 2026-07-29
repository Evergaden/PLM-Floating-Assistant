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

CREATE TABLE IF NOT EXISTS feature_access (
  user_name TEXT PRIMARY KEY,
  size_image_enabled INTEGER NOT NULL DEFAULT 0,
  magic_upload_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Backward-compatible migration for databases created before Magic Upload.
-- SQLite/D1 ignores this only when the column already exists; the Worker also
-- applies the same guarded migration during requests.

CREATE INDEX IF NOT EXISTS idx_feature_access_size_image
ON feature_access(size_image_enabled, updated_at);

CREATE INDEX IF NOT EXISTS idx_feature_access_magic_upload
ON feature_access(magic_upload_enabled, updated_at);

CREATE TABLE IF NOT EXISTS plm_users (
  user_name TEXT PRIMARY KEY,
  instance_id TEXT,
  script_version TEXT,
  sku_count INTEGER NOT NULL DEFAULT 0,
  heartbeat_count INTEGER NOT NULL DEFAULT 0,
  size_image_success INTEGER NOT NULL DEFAULT 0,
  size_image_failure INTEGER NOT NULL DEFAULT 0,
  last_backup_at TEXT,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plm_users_last_seen
ON plm_users(last_seen_at);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_enabled_published
ON notifications(enabled, published_at);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  instance_id TEXT NOT NULL,
  script_version TEXT,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(notification_id, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_notification
ON notification_reads(notification_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
ON notification_reads(user_name, read_at);

CREATE TABLE IF NOT EXISTS feature_access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loading_tip_campaigns (
  tip_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  weight INTEGER NOT NULL DEFAULT 1,
  include_names TEXT,
  exclude_names TEXT,
  start_date TEXT,
  end_date TEXT,
  start_time TEXT,
  end_time TEXT,
  weekdays TEXT,
  holiday_eve INTEGER NOT NULL DEFAULT 0,
  access_mode TEXT,
  version_rule TEXT,
  daily_limit INTEGER NOT NULL DEFAULT 3,
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loading_tip_campaigns_enabled
ON loading_tip_campaigns(enabled, sort_order, updated_at);

CREATE TABLE IF NOT EXISTS loading_tip_impressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tip_id TEXT NOT NULL,
  user_name TEXT,
  instance_id TEXT,
  shown_day TEXT NOT NULL,
  shown_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loading_tip_impressions_lookup
ON loading_tip_impressions(tip_id, user_name, shown_day, shown_at);

CREATE TABLE IF NOT EXISTS holiday_calendar (
  holiday_id TEXT PRIMARY KEY,
  holiday_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  reminder_date TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holiday_calendar_reminder
ON holiday_calendar(reminder_date, enabled);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  client_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parameter_feature_rules (
  rule_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  phrase TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parameter_feature_rules_enabled
ON parameter_feature_rules(enabled, priority);

CREATE TABLE IF NOT EXISTS brand_compliance (
  brand_key TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  distributed_by TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  eu_rep_json TEXT NOT NULL DEFAULT '{}',
  uk_rep_json TEXT NOT NULL DEFAULT '{}',
  us_rep_json TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brand_compliance_sort
ON brand_compliance(sort_order, brand);

CREATE TABLE IF NOT EXISTS brand_compliance_meta (
  meta_key TEXT PRIMARY KEY,
  meta_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
