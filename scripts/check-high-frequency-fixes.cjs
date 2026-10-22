const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.user.js'), 'utf8');
function section(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from);
  return source.slice(from, to);
}

async function checkBackup(failures, message = 'backup chunks incomplete', status = 409) {
  let commits = 0;
  const chunks = [];
  const data = 'abcdefghijkl';
  const context = vm.createContext({
    CLOUD_BACKUP_INLINE_LIMIT: 0, CLOUD_BACKUP_CHUNK_SIZE: 5, CLOUD_BACKUP_MAX_CHUNKS: 10,
    createCloudBackupSnapshotId: () => 'snapshot-test',
    cloudRequest: async (endpoint, options) => {
      if (endpoint === '/backup/chunk') { chunks.push(options.body); return { ok: true }; }
      assert.equal(endpoint, '/backup/save');
      assert.equal(options.body.payload.snapshotId, 'snapshot-test');
      assert.equal(options.body.payload.data, undefined);
      if (++commits <= failures) throw Object.assign(new Error(message), { status });
      return { ok: true };
    },
  });
  vm.runInContext(section('  async function uploadCloudBackupEnvelope(', '  async function loadCloudBackupRecord('), context);
  let error;
  try { await context.uploadCloudBackupEnvelope('id', 'key', 'test', { encrypted: true, data }); }
  catch (caught) { error = caught; }
  const expected = failures && (message !== 'backup chunks incomplete' || status !== 409) ? 1 : Math.min(failures + 1, 2);
  assert.equal(commits, expected);
  assert.equal(chunks.length, expected * 3);
  for (let offset = 0; offset < chunks.length; offset += 3) {
    assert.equal(chunks.slice(offset, offset + 3).map((item) => item.data).join(''), data);
    assert(chunks.slice(offset, offset + 3).every((item, index) => item.chunkIndex === index && item.snapshotId === 'snapshot-test'));
  }
  assert.equal(Boolean(error), failures >= 2 || (failures > 0 && expected === 1));
}

async function checkBatch(cancellation) {
  const queue = [{ sku: 'SKU1', status: 'pending' }, { sku: 'SKU2', status: 'pending' }];
  let calls = 0;
  const logs = [];
  const context = vm.createContext({
    state: {}, EXCEL_BATCH_PREPARE_RETRIES: 3,
    loadExcelBatchQueue: () => queue,
    updateExcelBatchQueueEntry: (sku, patch) => Object.assign(queue.find((item) => item.sku === sku), patch),
    expandPanel() {}, renderShell() {}, wait: async () => {},
    addLog: (...args) => logs.push(args), formatErrorMessage: (error) => error.message,
    getExcelBatchCacheSnapshot: () => ({ missing: [] }),
    prepareExcelBatchSku: async () => {
      calls++;
      if (cancellation || calls === 1) throw Object.assign(new Error('cancelled or temporary failure'), { name: cancellation ? 'AbortError' : 'Error' });
      return { missing: [], packQty: '10', purchasePrice: '6' };
    },
  });
  vm.runInContext(section('  async function startExcelBatchPreparation(', '  async function prepareExcelBatchSku('), context);
  await context.startExcelBatchPreparation();
  assert.equal(calls, cancellation ? 1 : 3);
  assert.equal(Boolean(context.state.batchExcelWorkerPaused), cancellation);
  assert.equal(context.state.batchExcelWorkerRunning, false);
  assert(queue.every((item) => item.status === (cancellation ? 'pending' : 'ready')));
  if (cancellation) assert(logs.every((item) => item[0] === 'info'));
}

function checkServerCleanup() {
  const worker = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/src/index.js'), 'utf8');
  const save = worker.slice(worker.indexOf('async function handleBackupSave('), worker.indexOf('async function handleBackupChunkSave('));
  const queries = [...save.matchAll(/(?:`|")(DELETE FROM user_backup_chunks[^`"]*)(?:`|")/g)].map((match) => match[1]);
  assert.equal(queries.length, 1, 'inline cleanup query');
  const chunked = save.match(/`\s*(DELETE FROM user_backup_chunks[\s\S]*?)`/)[1];
  const result = spawnSync('python', ['-c', `
import sqlite3, sys, json
queries=json.loads(sys.argv[1])
for query in queries:
 db=sqlite3.connect(':memory:')
 db.execute('CREATE TABLE user_backup_chunks(user_id TEXT,snapshot_id TEXT,created_at TEXT)')
 for user,snapshot,age in [('u','committed','-2 days'),('u','uploading','-1 hour'),('u','stale','-2 days'),('other','stale','-2 days')]:
  db.execute("INSERT INTO user_backup_chunks VALUES(?,?,datetime('now',?))",(user,snapshot,age))
 db.execute(query,('u','committed') if 'snapshot_id !=' in query else ('u',))
 rows=set(db.execute('SELECT user_id,snapshot_id FROM user_backup_chunks'))
 assert ('u','uploading') in rows
 assert ('other','stale') in rows
 assert ('u','stale') not in rows
 if 'snapshot_id !=' in query: assert ('u','committed') in rows
print('SQLite cleanup checks passed: concurrent upload and committed snapshot retained; stale orphan removed.')
`, JSON.stringify([chunked, queries[0]])], { encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  process.stdout.write(result.stdout);
}

(async () => {
  await checkBackup(0);
  await checkBackup(1);
  await checkBackup(2);
  await checkBackup(1, 'backup owner mismatch');
  await checkBackup(1, 'backup chunks incomplete', 500);
  await checkBatch(true);
  await checkBatch(false);
  checkServerCleanup();
  console.log('PASS: bounded same-snapshot recovery, no retry on other conflicts, Excel cancellation pause and transient retry.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
