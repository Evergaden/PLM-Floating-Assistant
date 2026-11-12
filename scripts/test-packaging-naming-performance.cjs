// Synthetic DOM/storage checks; no browser or real user caches are accessed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const source = fs.readFileSync(path.join(__dirname, '../src/core-ledger-workbench.module.js'), 'utf8');
const extract = (name) => {
  const start = source.search(new RegExp('  (?:async )?function ' + name + '\\('));
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n  }', start) + 4);
};
const { document } = parseHTML('<html><body><div id="panel"><span data-key="printSizeText"></span></div></body></html>');
const panel = document.getElementById('panel');
panel.getBoundingClientRect = () => ({ left: 0, top: 0, width: 700, height: 800 });
document.defaultView.HTMLElement.prototype.getBoundingClientRect = () => ({ width: 400, height: 400 });
const records = Array.from({ length: 240 }, (_, index) => ({ sku: 'SKU' + index, brand: index % 2 ? 'OTHER' : 'BRAND', name: 'Product', code: 'MTL' + String(index).padStart(6, '0'), values: [10 + index % 4 * 0.1, 6], updatedAtMs: index }));
const data = { sku: 'CURRENT', brand: 'BRAND', name: 'Current product', values: [10, 6], code: 'MTL999999' };
const state = { data, index: records.map((item) => ({ sku: item.sku })) };
let reads = 0;
let yields = 0;
let cancelAtYield = false;
const frames = [];
const context = vm.createContext({
  state, document, performance, PANEL_ID: 'panel',
  window: { requestAnimationFrame: (callback) => frames.push(callback), setTimeout: (callback) => { yields++; if (cancelAtYield) context.closePackagingNamingCard(panel); return setTimeout(callback, 0); } },
  compactText: (value) => String(value || '').trim(), cleanName: (value) => String(value || '').trim(),
  escapeHtml: (value) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
  normalizeData: (value) => value,
  loadData: (sku) => {
    reads++;
    // Model a slow userscript storage bridge without touching the user's data.
    const end = performance.now() + 0.2;
    while (performance.now() < end) {}
    return records.find((item) => item.sku === sku);
  },
  showToast: () => {}, reportDiagnostic: (error) => { throw error; },
});
for (const name of ['namingLogoKey', 'namingProductText', 'namingLine', 'namingDimensionDistance']) vm.runInContext(extract(name), context);
context.packagingNamingEntries = (item) => [{ code: item.code, label: 'Label', values: item.values, size: item.values.join('x') + 'cm' }];
vm.runInContext('let packagingNamingHistoryCache = new WeakMap();', context);
for (const name of ['invalidatePackagingNamingHistoryCache', 'packagingNamingHistorySummary', 'historicalNamingRecommendations', 'closePackagingNamingCard', 'positionPackagingNamingCard', 'showPackagingNamingCard']) vm.runInContext(extract(name), context);

async function run() {
  const row = panel.querySelector('span');
  const started = performance.now();
  context.showPackagingNamingCard(row, 'printSizeText', { clientX: 680, clientY: 790 });
  const openingMs = performance.now() - started;
  const card = panel.querySelector('.pfh-packaging-naming-card');
  assert.ok(card, 'Naming/copy controls mount before history work');
  assert.equal(reads, 0, 'Opening the panel must not read all SKU records');
  assert.match(card.textContent, /Current product/);
  assert.equal(card.querySelector('[aria-busy]').getAttribute('aria-busy'), 'true');
  frames.shift()();
  assert.equal(reads, 0, 'History waits for a paint opportunity');
  await frames.shift()();
  assert.equal(reads, 240);
  assert.ok(yields >= 29, 'Large histories yield repeatedly instead of blocking one event');
  const codes = Array.from(card.querySelectorAll('.pfh-packaging-naming-history b'), (node) => node.textContent);
  assert.deepEqual(codes, ['MTL000236', 'MTL000232', 'MTL000228', 'MTL000224', 'MTL000220'], 'Same-logo, exact dimensions and recency retain ranking');
  assert.equal(card.querySelector('[aria-busy]').getAttribute('aria-busy'), 'false');
  await context.historicalNamingRecommendations(data, 'printSizeText', context.packagingNamingEntries(data));
  assert.equal(reads, 240, 'Repeat opens reuse compact history summaries');
  records[236].code = 'MTL888888';
  context.invalidatePackagingNamingHistoryCache();
  const refreshed = await context.historicalNamingRecommendations(data, 'printSizeText', context.packagingNamingEntries(data));
  assert.equal(refreshed[0].code, 'MTL888888', 'A storage write can invalidate stale summaries');
  context.invalidatePackagingNamingHistoryCache();
  reads = 0;
  context.showPackagingNamingCard(row, 'printSizeText', { clientX: 10, clientY: 10 });
  frames.shift()();
  cancelAtYield = true;
  await frames.shift()();
  assert.ok(reads <= 8, 'Closing the panel stops the remaining history scan');
  assert.equal(panel.querySelector('.pfh-packaging-naming-card'), null);
  console.log('Naming panel: synthetic 240-SKU open ' + openingMs.toFixed(1) + 'ms, 0 synchronous history reads; yielding, ranking, cache refresh and cancellation passed');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
