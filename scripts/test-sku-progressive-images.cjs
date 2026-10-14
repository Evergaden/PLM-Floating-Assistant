const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
let callback, observerOptions, revealCallback, disconnected = 0;
class Observer {
  constructor(cb, options) {
    if (options.rootMargin === '0px') revealCallback = cb;
    else { callback = cb; observerOptions = options; }
  }
  observe() {}
  unobserve() {}
  disconnect() { disconnected++; }
}
const sandbox = { URL, IntersectionObserver: Observer, window: { location: { origin: 'https://plm.westmonth.cn' }, IntersectionObserver: Observer, matchMedia: () => ({ matches: false }) }, iconHtml: () => '<svg></svg>', escapeHtml: (value) => value };
vm.createContext(sandbox);
vm.runInContext(extract('  function getLedgerThumbnailUrl(', '  function ledgerSelectionToolbarHtml(') + extract('  function getSkuPlaceholderUrl(', '  function skuListCardHtml('), sandbox);
assert.match(sandbox.getSkuPlaceholderUrl('https://oss-pro.plm.westmonth.cn/a.jpg'), /w_32/);
assert.equal(sandbox.getSkuPlaceholderUrl('https://oss-pro.plm.westmonth.cn/a.jpg?Signature=abc&Expires=12'), '');
assert.equal(sandbox.getSkuPlaceholderUrl('https://example.org/a.jpg'), '');
assert.doesNotMatch(sandbox.skuProgressiveImageHtml('https://example.org/a.jpg'), / src=/);
function fixture() {
  const classes = new Set(), motions = [];
  const placeholder = { getAttribute: () => 'tiny.jpg', removeAttribute() {}, remove() { this.removed = true; }, animate() { return {}; } };
  const frame = { classList: { add: (value) => classes.add(value), contains: (value) => classes.has(value) }, querySelector: () => placeholder };
  const image = { attrs: { 'data-sku-image': 'original.jpg', 'data-sku-reveal': 'pending' }, getAttribute(key) { return this.attrs[key]; }, removeAttribute(key) { delete this.attrs[key]; }, closest: () => frame, isConnected: true, naturalWidth: 100, complete: false, decode: async () => {}, animate(frames, options) { motions.push({ frames, options }); } };
  const root = {};
  const scope = { querySelectorAll: () => image.attrs['data-sku-reveal'] ? [image] : [], querySelector: () => root };
  return { classes, motions, placeholder, image, scope, root };
}
(async () => {
  const f = fixture();
  sandbox.setupSkuProgressiveImages(f.scope);
  assert.equal(observerOptions.root, f.root);
  assert.equal(observerOptions.rootMargin, '300px 0px');
  assert.equal(f.image.src, undefined);
  callback([{ target: f.image, isIntersecting: false }]);
  assert.equal(f.image.src, undefined);
  callback([{ target: f.image, isIntersecting: true }]);
  assert.equal(f.image.src, 'original.jpg');
  assert.equal(f.placeholder.src, 'tiny.jpg');
  await f.image.onload();
  assert.equal(f.motions.length, 0, 'Preloading outside the viewport must not consume the reveal animation');
  assert.ok(!f.classes.has('is-image-ready'));
  revealCallback([{ target: f.image, isIntersecting: true }]);
  assert.ok(f.classes.has('is-image-ready'));
  assert.equal(f.motions[0].options.duration, 500);
  assert.equal(f.motions[0].frames[0].transform, 'scale(1.04)');
  sandbox.setupSkuProgressiveImages(f.scope);
  assert.equal(disconnected, 2);
  const reduced = fixture();
  sandbox.window.matchMedia = () => ({ matches: true });
  sandbox.setupSkuProgressiveImages(reduced.scope);
  revealCallback([{ target: reduced.image, isIntersecting: true }]);
  callback([{ target: reduced.image, isIntersecting: true }]);
  await reduced.image.onload();
  assert.equal(reduced.motions.length, 1, 'Reduced motion retains an opacity reveal');
  assert.equal(reduced.motions[0].frames[0].transform, undefined);
  const failed = fixture();
  sandbox.setupSkuProgressiveImages(failed.scope);
  callback([{ target: failed.image, isIntersecting: true }]);
  failed.image.onerror();
  assert.ok(failed.classes.has('is-image-error'));
  assert.ok(failed.placeholder.removed);
  console.log('PASS: safe tiny thumbnails, scroll-root loading gate, decoded reveal and image failure fallback');
})().catch((error) => { console.error(error); process.exitCode = 1; });
