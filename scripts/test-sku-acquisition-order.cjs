const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const storage = fs.readFileSync(path.join(root, 'src/core-storage.module.js'), 'utf8');
const layout = fs.readFileSync(path.join(root, 'src/core-layout-utils.module.js'), 'utf8');
function extract(source, name) {
  const start = source.indexOf('  function ' + name + '(');
  assert(start >= 0, name);
  const next = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 3 + next);
}
const stored = new Map();
const clone = (value) => JSON.parse(JSON.stringify(value));
let reads = 0;
const context = vm.createContext({
  state: { index: [], settings: { skuListSort: 'acquired' } },
  STORAGE_INDEX_KEY: 'index', STORAGE_PREFIX: 'sku:',
  GM_setValue: (key, value) => stored.set(key, clone(value)),
  GM_getValue: (key, fallback) => { reads += 1; return stored.has(key) ? clone(stored.get(key)) : fallback; },
  loadData: (sku) => stored.get('sku:' + sku) || null,
  cleanName: (value) => value,
  saveIndex: () => {},
  skuSearchFacetCache: new Map(),
  getSkuListImageUrl: () => '', scheduleSkuImageColorIndex: () => {},
  console: { warn: () => {} },
});
for (const name of ['parseSkuListTime', 'getSkuListSort', 'getSkuAcquiredTime', 'preserveSkuAcquiredTime', 'normalizeSkuIndexAcquisition', 'loadIndex', 'sortSkuListItems', 'upsertIndex']) vm.runInContext(extract(storage, name), context);
vm.runInContext(extract(layout, 'saveDataDirect'), context);
const first = Date.parse('2026-11-01T01:00:00Z');
const second = first + 1000;
const ids = (items) => Array.from(items, (item) => item.sku);
context.upsertIndex({ sku: 'A', acquiredAtMs: first });
context.upsertIndex({ sku: 'B', acquiredAtMs: second });
assert.deepEqual(ids(context.sortSkuListItems(context.state.index)), ['B', 'A']);
context.saveDataDirect('A', { sku: 'A', updatedAtMs: Date.now(), fetchedAtMs: Date.now(), acquiredAtMs: Date.now() });
assert.equal(stored.get('sku:A').acquiredAtMs, first);
context.upsertIndex(stored.get('sku:A'));
assert.deepEqual(ids(context.state.index), ['B', 'A']);
assert.deepEqual(ids(context.sortSkuListItems(context.state.index)), ['B', 'A']);
assert.equal(reads, 0, 'Sorting must not read all full SKU records');

// Equal acquisition times retain catalog order even when API rows arrive reversed.
context.upsertIndex({ sku: 'C', acquiredAtMs: second });
assert.deepEqual(ids(context.sortSkuListItems([{ sku: 'A' }, { sku: 'B' }, { sku: 'C' }])), ['C', 'B', 'A']);
context.upsertIndex({ sku: 'B', updatedAtMs: Date.now() });
assert.deepEqual(ids(context.sortSkuListItems(context.state.index)), ['C', 'B', 'A']);
context.state.index.find((item) => item.sku === 'A').pinned = true;
assert.equal(context.sortSkuListItems(context.state.index)[0].sku, 'A');

// Freeze the available historical timestamps once; later updates cannot promote a SKU.
stored.set('index', [{ sku: 'X', updatedAtMs: first }, { sku: 'Y', updatedAtMs: second }]);
context.state.index = context.loadIndex();
assert.equal(context.state.index[0].acquiredAtMs, first);
context.upsertIndex({ sku: 'X', updatedAtMs: Date.now() });
assert.equal(context.state.index[0].acquiredAtMs, first);
assert.deepEqual(ids(context.sortSkuListItems(context.state.index)), ['Y', 'X']);
const migrated = clone(stored.get('index'));
assert.deepEqual(clone(context.normalizeSkuIndexAcquisition(migrated)), migrated);

// A brand-new acquisition uses local receipt time, not the remote creation date.
const fresh = { sku: 'NEW', createdAt: '2020-01-01' };
const before = Date.now();
context.saveDataDirect('NEW', fresh);
assert(fresh.acquiredAtMs >= before);
context.upsertIndex(fresh);
assert.equal(context.sortSkuListItems(context.state.index)[0].sku, 'NEW');

context.state.settings.skuListSort = 'assigned';
context.state.index = [{ sku: 'A', acquiredAtMs: second, designAssignedAt: '2026-01-01' }, { sku: 'B', acquiredAtMs: first, designAssignedAt: '2026-02-01' }];
assert.deepEqual(ids(context.sortSkuListItems(context.state.index)), ['B', 'A']);
context.GM_setValue = () => { throw new Error('quota'); };
assert.equal(context.normalizeSkuIndexAcquisition([{ sku: 'LEGACY', updatedAtMs: first }]).length, 1, 'Migration write failure must not hide the list');
console.log('Stable first-acquisition SKU ordering regression passed');
