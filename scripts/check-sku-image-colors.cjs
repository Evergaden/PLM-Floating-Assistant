// Deterministic pixel, filter and async scan checks; no browser/network needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
function extract(name) {
  let start = source.indexOf('  function ' + name + '(');
  if (start < 0) start = source.indexOf('  async function ' + name + '(');
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n  }', start) + 4);
}
const cache = {}, scan = { running: false }, state = {
  index: [{ sku: 'A', image: 'a.png', developer: 'Alice' }, { sku: 'B', image: 'b.png', developer: 'Bob' }, { sku: 'C', image: '' }],
  skuFilters: { developer: '', brand: '', status: '', designType: '', imageColor: '' },
};
let calls = [], inFlight = 0, peak = 0, saves = 0, failB = true, schedules = [];
const context = vm.createContext({
  state, skuImageColorCache: cache, skuImageColorScan: scan, PANEL_ID: 'test-panel',
  loadData: () => { throw new Error('Filters must not read full product records'); }, getSkuListImageUrl: (item) => item.image || '',
  getSearchMatches: () => state.index, getSkuSearchFacet: (item) => item,
  document: { getElementById: () => null }, window: { setTimeout, clearTimeout },
  waitForSkuImageColorIdle: () => Promise.resolve(),
  scheduleSkuImageColorIndex: (delay) => { schedules.push(delay); },
  renderSkuList: () => {}, syncSkuImageColorControls: () => {},
  saveSkuImageColorCache: () => { saves++; },
  identifySkuImageColor: async (url) => {
    calls.push(url); inFlight++; peak = Math.max(peak, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 2)); inFlight--;
    if (url === 'b.png' && failB) throw new Error('Image unavailable');
    return url === 'a.png' ? 'green' : 'blue';
  },
});
vm.runInContext('const SKU_IMAGE_COLORS = Object.freeze(' + source.match(/const SKU_IMAGE_COLORS = Object.freeze\((\[[\s\S]*?\])\);/)[1] + ');', context);
['skuPixelColor', 'classifySkuImagePixels', 'getSkuImageColorSource', 'getSkuImageColor', 'hasSkuFilters', 'getFilteredSearchMatches', 'getSkuImageColorIndexTasks', 'pauseSkuImageColorIndex', 'startSkuImageColorScan'].forEach((name) => vm.runInContext(extract(name), context));
const swatches = [
  ['red', 255, 0, 0], ['orange', 255, 130, 0], ['yellow', 250, 230, 0],
  ['green', 0, 150, 50], ['blue', 0, 70, 230], ['purple', 140, 30, 200],
  ['pink', 255, 150, 190], ['brown', 110, 70, 35], ['beige', 235, 215, 180],
  ['black', 10, 10, 10], ['white', 250, 250, 250], ['gray', 130, 130, 130],
];
for (const [color, r, g, b] of swatches) {
  const pixels = new Uint8ClampedArray(20 * 20 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([r, g, b, 255], i);
  assert.equal(context.classifySkuImagePixels(pixels, 20, 20), color, 'Solid ' + color);
}
const pixels = new Uint8ClampedArray(40 * 40 * 4);
for (let i = 0; i < pixels.length; i += 4) pixels.set([255, 255, 255, 255], i);
for (let y = 12; y < 28; y++) for (let x = 12; x < 28; x++) pixels.set([0, 150, 50, 255], (y * 40 + x) * 4);
assert.equal(context.classifySkuImagePixels(pixels, 40, 40), 'green', 'White studio margins do not dominate');
for (let y = 12; y < 28; y++) for (let x = 12; x < 28; x++) pixels.set([10, 10, 10, 255], (y * 40 + x) * 4);
assert.equal(context.classifySkuImagePixels(pixels, 40, 40), 'black', 'Black product on white background');
assert.equal(context.classifySkuImagePixels(new Uint8ClampedArray(16), 2, 2), 'unknown', 'Transparent image');
async function main() {
  const first = context.startSkuImageColorScan();
  state.skuImageColorIndexDirty = true;
  assert.equal(context.startSkuImageColorScan(), first, 'Concurrent requests share one scan');
  await first;
  assert.equal(schedules[0], 1000, 'Catalog changes just before completion trigger a prompt follow-up');
  assert.equal(scan.completed, 2); assert.equal(scan.failed, 1); assert.equal(scan.running, false);
  assert.equal(peak, 1, 'Only one image is processed at a time');
  assert.equal(context.getSkuImageColor(state.index[0]), 'green');
  assert.equal(context.getSkuImageColor(state.index[1]), 'unknown');
  assert.equal(context.getSkuImageColor(state.index[2]), 'unknown');
  state.skuFilters.imageColor = 'green';
  assert.deepEqual(Array.from(context.getFilteredSearchMatches([]), (item) => item.sku), ['A']);
  state.skuFilters.developer = 'Bob';
  assert.equal(context.getFilteredSearchMatches([]).length, 0, 'Color combines with existing filters');
  state.skuFilters.developer = ''; state.skuFilters.imageColor = 'unknown';
  assert.deepEqual(Array.from(context.getFilteredSearchMatches([]), (item) => item.sku), ['B', 'C']);
  calls = [];
  await context.startSkuImageColorScan({ automatic: true });
  assert.equal(calls.length, 0, 'Automatic indexing respects failed-image cooldown');
  failB = false;
  await context.startSkuImageColorScan();
  assert.deepEqual(calls, ['b.png'], 'Successful unchanged images are cached; failed ones retry');
  state.index[0].image = 'replacement.png';
  assert.equal(context.getSkuImageColor(state.index[0]), 'unknown', 'Replacing image invalidates cached color');
  calls = [];
  await context.startSkuImageColorScan();
  assert.deepEqual(calls, ['replacement.png']);
  assert.equal(context.getSkuImageColor(state.index[0]), 'blue');
  state.index = Array.from({ length: 8 }, (_, n) => ({ sku: 'NEW' + n, image: n + '.png' }));
  const stopped = context.startSkuImageColorScan(); context.pauseSkuImageColorIndex(); await stopped;
  assert.ok(scan.completed <= 1, 'Pause prevents remaining queued downloads');
  assert.equal(state.skuImageColorIndexPaused, true);
  const schedulesBefore = schedules.length;
  await context.startSkuImageColorScan({ automatic: true });
  assert.equal(schedules.length, schedulesBefore, 'Paused indexing does not restart automatically');
  state.index = Array.from({ length: 900 }, (_, n) => ({ sku: 'CACHED' + n, image: n + '.png' }));
  for (const item of state.index) cache[item.sku] = { url: item.image, color: 'green', status: 'ready' };
  calls = [];
  await context.startSkuImageColorScan();
  assert.equal(calls.length, 0, '900 indexed products cause zero image requests');
  assert.equal(scan.total, 0, 'The job queues pending images only');
  state.skuFilters.imageColor = 'green';
  assert.equal(context.getFilteredSearchMatches([]).length, 900, '900 product color query uses only the lightweight index');
  cache.CACHED0 = { url: '0.png', color: 'unknown', status: 'failed', attempts: 3, updatedAt: Date.now() - 3600000 };
  assert.equal(context.getSkuImageColorIndexTasks(false).length, 0, 'Repeated failures back off for a day');
  assert.equal(context.getSkuImageColorIndexTasks(true).length, 1, 'Manual retry bypasses failure cooldown');
  assert.ok(saves >= 4, 'Partial and completed scans persist');
  await checkSchedulerAndResources();
  console.log('SKU color index checks passed: 900 cached products, zero query downloads, incremental queue, single-image concurrency, idle scheduling, pause/resume, retries and resource cleanup.');
}

async function checkSchedulerAndResources() {
  const timers = new Map(), timerState = {}, job = { running: false };
  let sequence = 0, starts = 0;
  const scheduled = vm.createContext({
    state: timerState, skuImageColorScan: job, navigator: { onLine: true },
    window: { setTimeout: (callback, delay) => { timers.set(++sequence, { callback, delay }); return sequence; }, clearTimeout: (id) => timers.delete(id) },
    startSkuImageColorScan: async (options) => { assert.equal(options.automatic, true); starts++; },
  });
  vm.runInContext(extract('scheduleSkuImageColorIndex'), scheduled);
  scheduled.scheduleSkuImageColorIndex(); scheduled.scheduleSkuImageColorIndex();
  assert.equal(timers.size, 1, 'Catalog updates coalesce into one timer');
  const fire = () => { const [id, timer] = [...timers][0]; timers.delete(id); timer.callback(); };
  scheduled.navigator.onLine = false; fire();
  assert.equal([...timers.values()][0].delay, 60000, 'Offline job defers downloads');
  scheduled.navigator.onLine = true; fire(); assert.equal(starts, 1);
  job.running = true; scheduled.scheduleSkuImageColorIndex(); fire();
  assert.equal(job.dirty, true, 'New images during a scan schedule a follow-up pass');
  timerState.skuImageColorIndexPaused = true; scheduled.scheduleSkuImageColorIndex(); assert.equal(timers.size, 0);

  let closed = 0, revoked = 0, blobSize = 1024;
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray(80 * 80 * 4) }) }) };
  const image = { width: 80, height: 80, close: () => closed++ };
  const resources = vm.createContext({
    fetchLedgerAiImageBlob: async () => ({ size: blobSize }), getLedgerThumbnailUrl: (url) => url,
    window: { createImageBitmap: async () => image, setTimeout, clearTimeout },
    document: { createElement: () => canvas },
    classifySkuImagePixels: () => 'blue', URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => revoked++ },
    loadImage: async () => image,
  });
  vm.runInContext(extract('identifySkuImageColor'), resources);
  assert.equal(await resources.identifySkuImageColor('photo'), 'blue');
  assert.equal(closed, 1); assert.equal(canvas.width, 0); assert.equal(canvas.height, 0);
  delete resources.window.createImageBitmap;
  await resources.identifySkuImageColor('photo'); assert.equal(revoked, 1, 'Fallback object URL is revoked');
  blobSize = 9 * 1024 * 1024;
  await assert.rejects(resources.identifySkuImageColor('large-photo'), /size limit/);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
