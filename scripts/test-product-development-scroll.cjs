const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const extract = (source, first, next) => source.slice(source.indexOf(first), source.indexOf(next, source.indexOf(first)));
const { document } = parseHTML('<html><body><div id="panel"><section class="pfh-detail"></section></div></body></html>');
let active = null;
Object.defineProperty(document, 'activeElement', { get: () => active });
const panel = document.getElementById('panel');
const detail = panel.querySelector('.pfh-detail');
let supplier = 'JSJ';
const context = vm.createContext({ document, state: { productDevelopmentTaskView: 'detail' },
  normalizeProductDevelopmentTaskTab: (value) => value, escapeHtml: (value) => String(value),
  renderStatusHtml: (status) => status ? '<p>' + status + '</p>' : '',
  productDevelopmentTaskTabsHtml: () => '<nav>Tabs</nav>',
  productDevelopmentTaskHeroHtml: () => '<header>Product</header>',
  productDevelopmentTaskActionsHtml: (task) => '<div class="nested-scroll"><label><span>Cost</span><input type="text" data-form-sku="' + task.sku + '" data-form-group="prefill" data-form-key="costPrice" value="0"></label><label><span>Supplier</span><input data-form-sku="' + task.sku + '" data-form-group="procurement" data-form-key="supplier" value="' + supplier + '"></label></div>',
});
const views = read('src/core-panel-views.module.js');
vm.runInContext(extract(views, '  function skuSidebarNodeKey(', '  function updateSkuSidebarMarkup('), context);
vm.runInContext(extract(read('src/product-development/pd-task-views.module.js'), '  function renderProductDevelopmentTaskDetail(', '  function renderProductDevelopmentTaskWorkspace('), context);
context.renderProductDevelopmentTaskDetail(panel, '', { sku: 'SKU1' });
const scroll = detail.querySelector('.pfh-detail-scroll');
const nested = detail.querySelector('.nested-scroll');
const cost = detail.querySelector('[data-form-key="costPrice"]');
active = cost;
cost.value = '4.25';
cost.selectionStart = 3;
cost.selectionEnd = 3;
scroll.scrollTop = 580;
nested.scrollTop = 190;
supplier = 'Updated supplier';
context.renderProductDevelopmentTaskDetail(panel, 'Reference query complete', { sku: 'SKU1' });
assert.equal(detail.querySelector('.pfh-detail-scroll'), scroll, 'Status insertion must retain the form scroll node');
assert.equal(detail.querySelector('.nested-scroll'), nested);
assert.equal(scroll.scrollTop, 580);
assert.equal(nested.scrollTop, 190);
assert.equal(detail.querySelector('[data-form-key="costPrice"]'), cost);
assert.equal(cost.value, '4.25', 'Async refresh must not overwrite active typing');
assert.equal(cost.selectionStart, 3);
assert.equal(cost.selectionEnd, 3);
assert.equal(detail.querySelector('[data-form-key="supplier"]').value, 'Updated supplier', 'Other fields still receive queried data');
context.renderProductDevelopmentTaskDetail(panel, '', { sku: 'SKU1' });
assert.equal(detail.querySelector('[data-form-key="costPrice"]'), cost, 'Status removal also retains active fields');
assert.equal(scroll.scrollTop, 580);
// A previously queued restoration must not overwrite newer user scrolling.
const frames = [];
context.window = { requestAnimationFrame: (callback) => frames.push(callback) };
for (const name of ['capturePanelScroll', 'capturePanelScrollAnchor', 'restorePanelScroll']) {
  const start = views.indexOf('  function ' + name + '(');
  const end = views.indexOf('\n  }', start);
  vm.runInContext(views.slice(start, end + 4), context);
}
const snapshot = context.capturePanelScroll(panel);
scroll.scrollTop = 680;
context.restorePanelScroll(panel, snapshot);
while (frames.length) frames.shift()();
assert.equal(scroll.scrollTop, 680, 'Deferred restoration cannot undo scrolling on a retained form');
context.renderProductDevelopmentTaskDetail(panel, '', { sku: 'SKU2' });
assert.notEqual(detail.querySelector('.pfh-detail-scroll'), scroll, 'Switching SKU intentionally creates a fresh form');
assert.equal(detail.querySelector('[data-form-key="costPrice"]').getAttribute('data-form-sku'), 'SKU2');
context.state.productDevelopmentTaskView = 'copywriting';
let copyStatus = 'Ready';
context.productDevelopmentTaskEmbeddedViewHtml = () => '<section class="pfh-cw-workspace"><textarea data-product-development-one-shot-field="regularIngredientsEn">Saved ingredients</textarea><p>' + copyStatus + '</p></section>';
context.productDevelopmentMountReviewEditorOverlay = () => {};
context.renderProductDevelopmentTaskDetail(panel, '', { sku: 'SKU2' });
const copyScroll = detail.querySelector('.pfh-detail-scroll');
const ingredients = detail.querySelector('textarea');
assert.equal(detail.querySelector('.pfh-detail-view-tabs'), null); // Fixture uses a plain nav.
assert.equal(detail.querySelector('.pfh-cw-task-frame > nav').textContent, 'Tabs');
assert.equal(copyScroll.querySelector('nav'), null, 'Copywriting tabs remain outside the scrolling form');
active = ingredients;
ingredients.value = 'Typing current ingredients';
ingredients.selectionStart = 6;
ingredients.selectionEnd = 6;
copyScroll.scrollTop = 380;
copyStatus = 'Updated progress';
context.renderProductDevelopmentTaskDetail(panel, '', { sku: 'SKU2' });
assert.equal(detail.querySelector('.pfh-detail-scroll'), copyScroll);
assert.equal(copyScroll.scrollTop, 380);
assert.equal(detail.querySelector('textarea'), ingredients);
assert.equal(ingredients.value, 'Typing current ingredients');
assert.equal(ingredients.selectionStart, 6);
assert.equal(detail.querySelector('.pfh-cw-workspace p').textContent, 'Updated progress');
console.log('Development form: async status/data refresh retains nested scroll, active input and caret; SKU switches reset context');
const domSource = read('src/product-development/pd-dom.module.js');
vm.runInContext(extract(domSource, '  function productDevelopmentMaterialRadioHtml(', '  function productDevelopmentFinishedProductBindingHtml('), context);
const options = document.createElement('div');
options.innerHTML = context.productDevelopmentMaterialRadioHtml('SKU2', 'box', 'multiPage', '是否多页', false);
for (const value of [true, false, true]) {
  const next = document.createElement('div');
  next.innerHTML = context.productDevelopmentMaterialRadioHtml('SKU2', 'box', 'multiPage', '是否多页', value);
  context.reconcileAssistantPanelNode(options, next);
  assert.deepEqual(Array.from(options.querySelectorAll('label'), (node) => node.textContent), ['是', '否'], 'Radio options keep distinct reconciliation keys');
  assert.equal(options.querySelectorAll('input').length, 2);
  assert.equal(options.querySelector('input[checked]').getAttribute('value'), String(value));
}
