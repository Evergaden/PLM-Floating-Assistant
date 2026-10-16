// Deterministic pixel, filter and async scan checks; no browser/network needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
function extract(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n  }', start) + 4);
}
const cache = {}, scan = { running: false }, state = {
  index: [{ sku: 'A', image: 'a.png', developer: 'Alice' }, { sku: 'B', image: 'b.png', developer: 'Bob' }, { sku: 'C', image: '' }],
  skuFilters: { developer: '', brand: '', status: '', designType: '', imageColor: '' },
};
let calls = [], inFlight = 0, peak = 0, saves = 0, failB = true;
const context = vm.createContext({
  state, skuImageColorCache: cache, skuImageColorScan: scan, PANEL_ID: 'test-panel',
  loadData: () => null, getSkuListImageUrl: (item) => item.image || '',
  getSearchMatches: () => state.index, getSkuSearchFacet: (item) => item,
  document: { getElementById: () => null }, window: { setTimeout },
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
['skuPixelColor', 'classifySkuImagePixels', 'getSkuImageColorSource', 'getSkuImageColor', 'hasSkuFilters', 'getFilteredSearchMatches', 'startSkuImageColorScan'].forEach((name) => vm.runInContext(extract(name), context));
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
  assert.equal(context.startSkuImageColorScan(), first, 'Concurrent requests share one scan');
  await first;
  assert.equal(scan.completed, 3); assert.equal(scan.failed, 1); assert.equal(scan.running, false);
  assert.ok(peak <= 2 && peak > 0, 'Bounded parallel image fetches');
  assert.equal(context.getSkuImageColor(state.index[0]), 'green');
  assert.equal(context.getSkuImageColor(state.index[1]), 'unknown');
  assert.equal(context.getSkuImageColor(state.index[2]), 'unknown');
  state.skuFilters.imageColor = 'green';
  assert.deepEqual(Array.from(context.getFilteredSearchMatches([]), (item) => item.sku), ['A']);
  state.skuFilters.developer = 'Bob';
  assert.equal(context.getFilteredSearchMatches([]).length, 0, 'Color combines with existing filters');
  state.skuFilters.developer = ''; state.skuFilters.imageColor = 'unknown';
  assert.deepEqual(Array.from(context.getFilteredSearchMatches([]), (item) => item.sku), ['B', 'C']);
  calls = []; failB = false;
  await context.startSkuImageColorScan();
  assert.deepEqual(calls, ['b.png'], 'Successful unchanged images are cached; failed ones retry');
  state.index[0].image = 'replacement.png';
  assert.equal(context.getSkuImageColor(state.index[0]), 'unknown', 'Replacing image invalidates cached color');
  calls = [];
  await context.startSkuImageColorScan();
  assert.deepEqual(calls, ['replacement.png']);
  assert.equal(context.getSkuImageColor(state.index[0]), 'blue');
  state.index = Array.from({ length: 8 }, (_, n) => ({ sku: 'NEW' + n, image: n + '.png' }));
  const stopped = context.startSkuImageColorScan(); scan.stop = true; await stopped;
  assert.ok(scan.completed <= 2, 'Stop prevents remaining queued downloads');
  assert.ok(saves >= 4, 'Partial and completed scans persist');
  console.log('SKU image color checks passed: palette, backgrounds, transparency, filters, cache invalidation, retry, concurrency and stop.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
