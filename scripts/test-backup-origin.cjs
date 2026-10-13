const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../cloudflare/plm-cloud-backup/src/index.js'), 'utf8');
const code = source.slice(source.indexOf('function backupOrigin('), source.indexOf('async function handleBackupChunkSave('));
const contexts = new Map();
const sandbox = {
  Date, JSON, Number, String, URL,
  requestAuthContexts: contexts,
  requireApiKey: (request) => contexts.has(request) || request.headers.get('x-api-key') === 'test',
  parseJson: (request) => request.json(),
  resolveBackupUserId: async (body) => body.backupId ? { userId: body.backupId } : { error: 'missing identity' },
  normalizeBackupOwnerName: (name) => String(name || '').trim(),
  parseStoredBackupPayload: (value) => { try { return JSON.parse(value); } catch (_) { return null; } },
  getBackupOwnerNameFromPayload: (value) => JSON.parse(value || '{}').backupOwnerName || '',
  isEncryptedBackupPayload: (payload) => Boolean(payload && payload.encrypted),
  MAX_BACKUP_INLINE_CHARS: 1000000,
  json: (body, status = 200) => ({ body, status }),
};
vm.createContext(sandbox); vm.runInContext(code, sandbox);
let row = null;
const env = { DB: { prepare: (sql) => ({ bind: (...params) => ({
  first: async () => row,
  run: async () => {
    if (/INSERT INTO user_backups/.test(sql)) row = { payload: params[1], updated_at: new Date().toISOString() };
  },
}) }) } };
const request = (payload) => ({ headers: new Map([['x-api-key', 'test']]), json: async () => ({ backupId: 'id', payload }) });
(async () => {
  assert.equal((await sandbox.handleBackupSave(request({ backupOwnerName: '甲', pfhBackupOrigin: { at: '2000-01-01', exact: true } }), env)).status, 200);
  const first = sandbox.backupOrigin(row);
  assert.equal(first.firstBackupExact, true);
  assert.ok(Date.parse(first.firstBackupAt) > Date.parse('2026-01-01'), 'Ignore a forged client-provided origin');
  await sandbox.handleBackupSave(request({ backupOwnerName: '甲' }), env);
  assert.equal(sandbox.backupOrigin(row).firstBackupAt, first.firstBackupAt, 'Old clients must not reset the first backup date');
  row = { payload: JSON.stringify({ backupOwnerName: '甲' }), updated_at: '2026-01-02 03:04:05' };
  await sandbox.handleBackupSave(request({ backupOwnerName: '甲' }), env);
  assert.equal(sandbox.backupOrigin(row).firstBackupAt, '2026-01-02T03:04:05.000Z');
  assert.equal(sandbox.backupOrigin(row).firstBackupExact, false, 'Legacy last-modified time is only earliest available evidence');
  const profileRequest = { url: 'https://test/backup/profile?backupId=id&name=甲', headers: new Map([['x-api-key', 'test']]) };
  const profile = await sandbox.handleBackupProfile(profileRequest, env);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.found, true);
  assert.equal(profile.body.payload, undefined, 'Profile response must not include backup contents');
  contexts.set(profileRequest, { claims: { userName: '乙' } });
  assert.equal((await sandbox.handleBackupProfile(profileRequest, env)).status, 403, 'Authenticated identity overrides a forged query name');
  assert.equal((await sandbox.handleBackupProfile({ ...profileRequest, headers: new Map() }, env)).status, 401);
  console.log('PASS: first backup retention, old client compatibility, legacy date labeling and profile owner authorization');
})().catch((error) => { console.error(error); process.exitCode = 1; });
