const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const rootPath = path.resolve(__dirname, '..');
const moduleSource = fs.readFileSync(path.join(rootPath, 'src/lucian-preview.module.js'), 'utf8');
const script = fs.readFileSync(path.join(rootPath, 'outputs/plm-material-summary.user.js'), 'utf8');
const css = fs.readFileSync(path.join(rootPath, 'cloudflare/plm-cloud-backup/ui-src/modules/lucian-preview.css'), 'utf8');
class Node {
  constructor() {
    this.listeners = {}; this.attributes = {}; this.values = {}; this.children = new Map(); this.isConnected = true;
    const classes = new Set();
    this.classList = { add: (v) => classes.add(v), remove: (v) => classes.delete(v), contains: (v) => classes.has(v), toggle: (v, on) => on ? classes.add(v) : classes.delete(v) };
    this.style = { setProperty: (key, value) => { this.values[key] = String(value); } };
  }
  querySelector(selector) { if (!this.children.has(selector)) this.children.set(selector, new Node()); return this.children.get(selector); }
  querySelectorAll() { return []; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  emit(type, event = {}) { for (const fn of this.listeners[type] || []) fn({ button: 0, pointerId: 1, preventDefault() {}, stopPropagation() {}, target: { closest: () => null }, ...event }); }
  getBoundingClientRect() { return { left: 0, width: 200 }; }
  setPointerCapture(id) { this.captured = id; }
  focus() { this.focused = true; }
  appendChild(node) { node.parentNode = this; }
}
let reduced = false, frameId = 0;
const frames = new Map(), timers = [];
const state = { skuFilters: { brand: 'A', imageColor: 'blue' }, searchQuery: 'needle', skuPage: 3 };
let queue = [];
const context = vm.createContext({
  state, Object, PANEL_ID: 'plm-floating-helper', LUCIAN_PREVIEW_CSS: css,
  escapeHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'),
  getSearchMatches: () => [{ brand: 'A', color: 'red' }, { brand: 'B', color: 'blue' }],
  getSkuSearchFacet: (item) => item, getSkuImageColor: (item) => item.color,
  loadExcelBatchQueue: () => queue, renderSkuList: () => {},
  document: { getElementById: () => null, createElement: () => new Node(), documentElement: new Node() },
  window: {
    matchMedia: () => ({ matches: reduced }),
    requestAnimationFrame: (fn) => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id), setTimeout: (fn, ms) => { timers.push({ fn, ms }); },
  },
});
vm.runInContext(moduleSource, context);
const filterStart = script.indexOf('  function getFilteredSearchMatches(');
const filterEnd = script.indexOf('\n  function skuFilterOptionsHtml(', filterStart);
vm.runInContext(script.slice(filterStart, filterEnd), context);
function flush() {
  let count = 0;
  while (frames.size && count++ < 400) {
    const pending = [...frames.values()]; frames.clear(); pending.forEach((fn) => fn());
  }
  assert(count < 400, 'spring must settle and stop requesting frames');
  return count;
}
const slider = new Node();
context.bindLucianComparisons({ querySelectorAll: () => [slider] });
context.bindLucianComparisons({ querySelectorAll: () => [slider] });
assert.equal(slider.listeners.pointerdown.length, 1, 'rebind is idempotent');
assert.equal(slider.values['--x'], '50.00%');
slider.emit('pointerdown', { clientX: 150 });
assert(frames.size > 0, 'normal pointer interaction must schedule spring animation');
assert(flush() > 1, 'spring must have multiple visible intermediate positions');
assert.equal(slider.values['--x'], '75.00%');
slider.emit('pointermove', { clientX: 40 });
assert.equal(slider.values['--x'], '20.00%');
slider.emit('pointerup');
slider.emit('pointermove', { clientX: 140 });
assert.equal(slider.values['--x'], '20.00%');
slider.emit('keydown', { key: 'End' }); flush();
assert.equal(slider.values['--x'], '100.00%');
slider.emit('dblclick'); flush();
assert.equal(slider.values['--x'], '50.00%');
slider.emit('keydown', { key: 'ArrowLeft' }); flush();
assert.equal(slider.values['--x'], '45.00%');
reduced = true;
slider.emit('keydown', { key: 'Home' });
assert.equal(slider.values['--x'], '0.00%');
assert.equal(frames.size, 0);
reduced = false;
slider.emit('dblclick'); slider.isConnected = false; flush();
assert.equal(frames.size, 0, 'detached slider must stop');

assert.equal(context.lucianComparisonHtml({ url: 'same' }), '');
const comparison = context.lucianComparisonHtml({ parentUrl: 'before?a="<', url: 'after' });
assert(comparison.includes('&quot;&lt;'));
const empty = context.lucianEmptySearchHtml(['needle']);
assert.equal(state.skuFilters.brand, 'A', 'calculating suggestions cannot mutate current filters');
assert.equal((empty.match(/移除后显示/g) || []).length, 2);
assert(empty.includes('1 条'));
const filterButton = new Node(); filterButton.dataset = { field: 'brand' }; filterButton.closest = () => null;
const panel = new Node(); panel.querySelectorAll = () => [];
context.handleLucianFilterAction({ target: { closest: () => filterButton } }, panel);
assert.equal(timers[0].ms, 330, 'chip collapse motion retained');
timers.shift().fn();
assert.equal(state.skuFilters.brand, '');
assert.equal(state.skuFilters.imageColor, 'blue');
assert.equal(state.skuPage, 1);

const progressPanel = new Node(), slot = new Node(); progressPanel.querySelector = () => slot;
state.batchExcelWorkerRunning = true;
queue = [{ sku: 'SKU1', status: 'preparing' }, { sku: 'SKU2', status: 'pending' }];
context.syncLucianExcelProgress(progressPanel);
const progress = progressPanel.pfhLucianExcelProgress;
assert(!progress.classList.contains('is-det'), 'queue uses moving segments before first result');
const fill = progress.querySelector('.u083-fill');
queue[0].status = 'ready'; queue[1].status = 'preparing';
context.syncLucianExcelProgress(progressPanel);
assert.equal(progressPanel.pfhLucianExcelProgress, progress);
assert.equal(progress.querySelector('.u083-fill'), fill, 'keep fill node for CSS progress transition');
assert.equal(fill.values['--p'], '0.5');
assert(progress.classList.contains('is-det'));
state.batchExcelWorkerPaused = true;
context.syncLucianExcelProgress(progressPanel);
assert(progress.classList.contains('is-paused'));

const postcss = require('../cloudflare/plm-cloud-backup/node_modules/postcss');
const ast = postcss.parse(css);
const animationNames = new Set(); ast.walkAtRules('keyframes', (rule) => animationNames.add(rule.params));
for (const name of ['u092-scan', 'u092-up', 'u083-a', 'u083-b', 'u083-in']) assert(animationNames.has(name));
ast.walkDecls((decl) => assert(!decl.important, 'do not fight hosted styles with important'));
for (const name of ['u092-lens', 'u083-seg.a', 'u060-hd']) {
  let matched = false;
  ast.walkRules((rule) => { if (rule.selector === '#plm-floating-helper .pfh-lucian .' + name) matched = true; });
  assert(matched, 'child style must match actual DOM: ' + name);
}
assert(css.includes('animation:u092-scan 3.6s ease-in-out infinite'));
assert(css.includes('animation:u083-a 1.6s cubic-bezier(.65,.05,.35,1) infinite'));
assert(css.includes('transition:transform .5s var(--ux-ease)'));
assert(script.includes(JSON.stringify(css)), 'installable build embeds exact component CSS');
console.log('Lucian checks passed: real filter counts/actions, 330ms chip collapse, live progress with stable nodes, pointer/keyboard/spring motion, reduced motion, cleanup and CSS animation wiring.');
