const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');

function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, start);
  return source.slice(from, to);
}

function fixture(settings = {}) {
  const input = { value: settings.cloudBackupKey || 'shared-key' };
  const status = { textContent: '' };
  const guide = { innerHTML: '' };
  const timers = new Map();
  const toasts = [];
  let requests = 0;
  let saved;
  const context = vm.createContext({
    crypto: webcrypto, Uint8Array, Date,
    console: { warn() {} },
    state: { settings: { cloudBackupKey: input.value, ...settings }, index: [], cloudBackupRunning: false },
    L: { cloudBackupReady: 'ready', cloudBackupSaving: 'saving', cloudBackupSavedAt: 'saved', cloudBackupSaved: 'saved', cloudBackupFailed: 'failed' },
    SCRIPT_VERSION: 'test', CLOUD_BACKUP_DEBOUNCE_MS: 100,
    PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY: 'dirty',
    ensurePanel: () => ({ querySelector: (selector) => ({ '.pfh-cloud-backup-key': input, '.pfh-cloud-status': status, '.pfh-cloud-key-guide': guide })[selector] }),
    saveSettings: (value) => { saved = { ...value }; },
    showToast: (message) => toasts.push(message),
    window: { setTimeout: (fn) => { const id = timers.size + 1; timers.set(id, fn); return id; }, clearTimeout: (id) => timers.delete(id) },
    readProductDevelopmentStorage: () => null,
    writeProductDevelopmentStorage: () => {},
    buildCachePayload: () => ({ backupOwnerName: 'current-user' }),
    sanitizeInsightsForCloudBackup: (value) => value,
    getCloudBackupId: async (key) => 'id-' + key,
    encodeCloudBackupPayload: async (value) => value,
    buildCompactCachePayload: (value) => value,
    buildMinimalCachePayload: (value) => value,
    buildIndexOnlyCachePayload: (value) => value,
    uploadCloudBackupEnvelope: async (id) => { requests++; return { ok: true, userId: id }; },
    addLog: () => {},
  });
  vm.runInContext([
    section('  function diagnosticHash(', '  function makeDiagnosticCode('),
    section('  function redactCloudBackupOwnerMismatch(', '  function saveLogs('),
    section('  function getCloudBackupKey()', '  function getCloudBackupOwnerName()'),
    section('  function getCloudBackupStatusText()', '  function getInsightAiModelSetting()'),
    section('  function setCloudBackupStatus(', '  async function restoreCloudBackup()'),
  ].join('\n'), context);
  return { context, input, status, guide, timers, toasts, saved: () => saved, requests: () => requests };
}

(async () => {
  const f = fixture();
  let attempts = 0;
  f.context.uploadCloudBackupEnvelope = async () => {
    attempts++;
    throw Object.assign(new Error('backup owner mismatch'), { cloudData: { error: 'backup owner mismatch' }, status: 409 });
  };
  f.context.queueCloudBackup();
  assert.equal(await f.context.saveCloudBackup({ silent: true }), false);
  assert(f.context.isCloudBackupKeyConflict());
  assert.equal(f.context.state.cloudBackupQueued, false);
  assert.equal(f.timers.size, 0);
  assert.equal(f.context.state.cloudBackupRunning, false);
  assert(f.guide.innerHTML.includes('自动备份已暂停'));
  assert(f.toasts.some((message) => message.includes('生成个人密钥并验证')));
  f.context.queueCloudBackup();
  await f.context.saveCloudBackup({ silent: true });
  assert.equal(attempts, 1, 'blocked keys must not make further uploads');
  assert.equal(f.timers.size, 0);
  const reload = fixture(f.saved());
  assert(reload.context.isCloudBackupKeyConflict(), 'conflict survives reload');
  assert.equal(await reload.context.saveCloudBackup({ silent: true }), false);
  assert.equal(reload.requests(), 0);

  const legacy = fixture();
  Object.assign(legacy.context, {
    SKU_LIST_PREFERENCE_VERSION: 1, DEFAULT_THEME_ID: 'default', THEME_SKIN_VERSION: 1,
    DEFAULT_HOME_FEATURE_GROUPS: [], DEFAULT_PRODUCT_DEVELOPMENT_FEATURE_GROUPS: [], SETTINGS_KEY: 'settings',
    normalizeHomeFeatureGroups: (value) => value,
    normalizeProductDevelopmentFeatureGroups: (value) => value,
    normalizeThemeId: (value) => value,
    normalizeShortcutBindings: (value) => value,
    normalizePixelRoomTime: (value) => value,
    normalizeProductDevelopmentWorkMode: (value) => value,
    GM_getValue: () => ({ cloudBackupKey: 'shared-key', cloudBackupStatus: '云备份上传失败：该备份密钥不可用于当前账号，请更换备份密钥' }),
    GM_setValue: () => {},
  });
  vm.runInContext(section('  function loadSettings()', '  function saveSettings('), legacy.context);
  legacy.context.state.settings = legacy.context.loadSettings();
  assert(legacy.context.isCloudBackupKeyConflict(), 'existing conflict status must migrate on upgrade');
  assert.equal(await legacy.context.saveCloudBackup({ silent: true }), false);
  assert.equal(legacy.requests(), 0);

  f.context.updateCloudBackupKey('personal-key');
  f.input.value = 'personal-key';
  assert(!f.context.isCloudBackupKeyConflict());
  assert(f.status.textContent.includes('尚未验证'));
  f.context.uploadCloudBackupEnvelope = async () => { throw new Error('offline'); };
  assert.equal(await f.context.saveCloudBackupNow(), false);
  assert(!f.status.textContent.includes('验证通过'), 'network failure must not validate a key');
  f.context.uploadCloudBackupEnvelope = async () => ({ ok: true, responseFormat: 'html' });
  assert.equal(await f.context.saveCloudBackupNow(), false, 'unconfirmed HTML response must not validate');
  f.context.uploadCloudBackupEnvelope = async () => ({ ok: true, userId: 'another-id' });
  assert.equal(await f.context.saveCloudBackupNow(), false, 'acknowledgement must match the key');
  f.context.uploadCloudBackupEnvelope = async (id) => ({ ok: true, userId: id });
  assert.equal(await f.context.saveCloudBackupNow(), true);
  assert(f.status.textContent.includes('密钥验证通过'));
  assert.equal(f.saved().cloudBackupConflictKeyHash, '');
  f.context.queueCloudBackup();
  assert.equal(f.timers.size, 1, 'automatic backup resumes for the new key');

  const generated = fixture();
  assert.equal(await generated.context.generatePersonalCloudBackupKey(), true);
  assert.match(generated.input.value, /^plm-[a-f0-9]{32}$/);
  assert.equal(generated.requests(), 1, 'generated key is actually uploaded');
  assert(generated.status.textContent.includes('密钥验证通过'));
  const previousKey = generated.input.value;
  generated.context.state.cloudBackupRunning = true;
  assert.equal(await generated.context.generatePersonalCloudBackupKey(), false);
  assert.equal(generated.input.value, previousKey, 'running upload prevents key regeneration');

  const changed = fixture();
  changed.context.uploadCloudBackupEnvelope = async (id) => {
    changed.context.updateCloudBackupKey('newer-key');
    return { ok: true, userId: id };
  };
  await changed.context.saveCloudBackup({ silent: true });
  assert(changed.status.textContent.includes('尚未验证'), 'old upload cannot validate a newly edited key');
  console.log('Backup key conflict checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
