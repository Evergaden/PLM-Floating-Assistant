// Node-only modal lifecycle checks. Does not open a PLM browser session.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const extract = (name) => {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n  }', start) + 4);
};
const state = { skuFilterOpen: true, skuFilters: { developer: '', brand: '', status: '', designType: '', imageColor: '' }, index: [{ developer: 'Alice', brand: '<Brand>', status: 'Assigned', designType: 'Label' }] };
const styles = new Map();
let writes = 0, modalFocus = 0, triggerFocus = 0;
const trigger = { setAttribute: (key, value) => { trigger[key] = value; }, focus: () => triggerFocus++ };
const panel = {
  layer: null, appendChild: (node) => { panel.layer = node; node.isConnected = true; },
  querySelector: (selector) => selector === '[data-action="sku-filter-toggle"]' ? trigger : selector === '.pfh-sku-filter-modal' ? panel.layer : selector === '.pfh-sku-filter-dialog' ? panel.layer.dialog : null,
};
const context = vm.createContext({
  state, PANEL_ID: 'panel', SKU_FILTER_MODAL_CSS: 'test-css', skuSearchFacetsReady: true,
  getSkuSearchFacet: (item) => item, syncSkuImageColorControls: () => {}, ensurePanel: () => panel,
  window: { requestAnimationFrame: (callback) => callback() },
  document: {
    getElementById: (id) => styles.get(id),
    documentElement: { appendChild: (node) => styles.set(node.id, node) },
    createElement: (tag) => tag === 'style' ? {} : makeLayer(),
  },
});
vm.runInContext('const SKU_IMAGE_COLORS = Object.freeze(' + source.match(/const SKU_IMAGE_COLORS = Object.freeze\((\[[\s\S]*?\])\);/)[1] + ');globalThis.colorIds = ["", ...SKU_IMAGE_COLORS.map(([id]) => id)];', context);
['escapeHtml', 'skuFilterOptionsHtml', 'skuImageColorFilterHtml', 'renderSkuFilterPanel', 'renderSkuFilterModal', 'closeSkuFilterModal', 'handlePanelKeydown'].forEach((name) => vm.runInContext(extract(name), context));
function makeLayer() {
  const selects = ['developer','brand','status','designType'].map((field) => ({ dataset: { skuFilter: field }, value: '' }));
  const buttons = Array.from(context.colorIds, (color) => ({ dataset: { skuColor: color }, setAttribute(key, value) { this[key] = value; } }));
  const body = { querySelectorAll: (selector) => selector.startsWith('select') ? selects : buttons };
  Object.defineProperty(body, 'innerHTML', { set(value) { this.html = value; writes++; } });
  const first = { getClientRects: () => [1], focus: () => modalFocus++ };
  const last = { getClientRects: () => [1], focus: () => modalFocus++ };
  const layer = {
    dataset: {}, isConnected: false, body, buttons, selects, first, last,
    dialog: { querySelectorAll: () => [first, last] },
    querySelector: (selector) => selector === '.pfh-sku-filter-body' ? body : first,
    remove: () => { layer.isConnected = false; panel.layer = null; },
  };
  return layer;
}
context.renderSkuFilterModal(panel);
const original = panel.layer;
assert.ok(original.body.html.includes('pfh-sku-color-dot'));
assert.ok(!original.body.html.includes('<select data-sku-filter="imageColor"'), 'Colors use swatches, not a dropdown');
assert.ok(original.body.html.includes('&lt;Brand&gt;'));
assert.equal(original.buttons.length, 14, 'All colors plus unknown and all');
assert.equal(modalFocus, 1);
state.skuFilters.imageColor = 'blue'; state.skuFilters.developer = 'Alice';
context.renderSkuFilterModal(panel);
assert.equal(panel.layer, original); assert.equal(writes, 1, 'Choosing conditions preserves the modal controls');
assert.equal(original.buttons.find((button) => button.dataset.skuColor === 'blue')['aria-pressed'], 'true');
assert.equal(original.selects[0].value, 'Alice'); assert.equal(modalFocus, 1, 'Background updates do not steal focus');
let prevented = 0;
context.handlePanelKeydown({ key: 'Tab', target: original.last, preventDefault: () => prevented++ });
assert.equal(prevented, 1, 'Tab wraps within the dialog');
context.handlePanelKeydown({ key: 'Escape', preventDefault: () => {}, stopPropagation: () => {} });
assert.equal(state.skuFilterOpen, false); assert.equal(panel.layer, null); assert.equal(triggerFocus, 1);
assert.equal(state.skuFilters.imageColor, 'blue', 'Closing retains filters');
state.skuFilterOpen = true; context.renderSkuFilterModal(panel);
assert.equal(panel.layer.buttons.find((button) => button.dataset.skuColor === 'blue')['aria-pressed'], 'true');
assert.equal(styles.size, 1, 'Reopening does not inject duplicate CSS');
console.log('SKU filter modal checks passed: circular swatches, escaped options, stable controls, live selection, keyboard focus, close and reopen.');
