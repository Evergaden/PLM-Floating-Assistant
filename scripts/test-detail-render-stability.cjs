const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', 'src', file + '.module.js'), 'utf8');
const extract = (text, first, next) => text.slice(text.indexOf(first), text.indexOf(next, text.indexOf(first)));
const { document } = parseHTML('<html><body><div id="panel"><main class="pfh-main"><div class="pfh-detail"></div></main></div></body></html>');
const panel = document.getElementById('panel');
const detail = panel.querySelector('.pfh-detail');
let active;
Object.defineProperty(document, 'activeElement', { get: () => active });
const state = { selectedSku: 'A', data: { sku: 'A', name: 'Product', photo: 'A.jpg', grossWeight: '100' }, settings: {}, view: 'detail', apiReadStatus: {} };
let frames = [];
const ctx = vm.createContext({ document, state, PANEL_ID: 'panel',
  L: { openingDetail: 'Opening', scanning: 'Scanning', checkingMaterial: 'Checking' }, TOOLTIP: {}, DETAIL_VIEW_TABS: [{ id: 'detail' }, { id: 'copywriting' }],
  window: { requestAnimationFrame: (fn) => frames.push(fn), clearTimeout() {}, setTimeout: () => 1 },
  normalizeData: (data) => data, loadData: () => null,
  escapeHtml: (text) => String(text || ''), iconHtml: () => '',
  getSkuListImageUrl: (data) => data.photo, getLedgerThumbnailUrl: (url) => 'thumb:' + url,
  renderStatusHtml: (text) => text ? '<div class="pfh-loading-tip">' + text + '</div>' : '',
  detailViewTabsHtml: () => '<nav class="pfh-detail-view-tabs"><span class="pfh-detail-view-indicator"></span><button data-action="detail-view-tab" data-detail-view="detail" class="is-active">Detail</button></nav>',
  materialSummaryCardHtml: (_, label, text) => '<article>' + text + '</article>', rowHtml: (key, label, value) => '<label>' + key + '<input data-detail-field="' + key + '" value="' + value + '"></label>',
  apiReadStatusHtml: () => '', getCurrentLoadingTip: () => 'Loading',
  formatPrintSizeDisplay: () => '', formatTitleMeta: () => '', normalizeCopywritingRecord: () => null,
  excelTriggerHtml: () => '<button data-action="export-submit"' + (state.excelGenerating ? ' disabled' : '') + '>Export ' + (state.excelStatus || '') + '</button>',
  copywritingViewHtml: () => '<div>Copywriting</div>',
});
for (const name of ['materialDimensionUnitAlertHtml', 'skuDataChangeAlertHtml', 'accessoryCardsHtml', 'toyCopywritingButtonHtml', 'toyCopywritingFeedbackHtml', 'infringementSectionHtml', 'skuDataLogTriggerHtml']) ctx[name] = () => '';
vm.runInContext(extract(read('core-panel-views'), '  function skuSidebarNodeKey(', '  function updateSkuSidebarMarkup('), ctx);
vm.runInContext(extract(read('core-panel-views'), '  function setupDetailViewTabs(', '  function isWorkspaceLayoutEnabled('), ctx);
vm.runInContext(extract(read('core-panel-views'), '  function designDetailTabs(', '  function normalizeDetailViewTab('), ctx);
vm.runInContext(extract(read('core-ledger-workbench'), '  function productThumbHtml(', '  function formatSkuDetailPriority('), ctx);
vm.runInContext(extract(read('core-ledger-detail'), '  function renderLoadingDetail(', '  function productHeroSectionHtml('), ctx);
ctx.productHeroSectionHtml = (data) => '<section class="pfh-file-section">' + ctx.productThumbHtml(data) + '<h3>' + data.name + '</h3></section>';
ctx.renderDetail(panel);
ctx.setupDetailViewTabs(panel);
frames.splice(0).forEach((fn) => fn());
const thumb = detail.querySelector('.pfh-product-thumb');
const image = thumb.querySelector('img');
const scroll = detail.querySelector('.pfh-detail-scroll');
const tabs = detail.querySelector('.pfh-detail-view-tabs');
const field = detail.querySelector('input');
image.pfhLocalImageSource = image.getAttribute('data-local-image');
image.removeAttribute('data-local-image');
image.setAttribute('src', 'blob:decoded-A');
let events = 0;
image.addEventListener('load', () => events++);
state.scanRunning = true;
ctx.renderDetail(panel, 'Scanning');
assert.equal(detail.classList.contains('is-loading'), false, 'Refreshing visible cached data must not dim the product image');
assert.equal(detail.querySelector('img'), image);
state.scanRunning = false;
active = field; field.value = 'unfinished'; scroll.scrollTop = 412;
for (const status of ['', 'Reading PLM', 'Read complete', '']) {
  state.data.grossWeight = String(Number(state.data.grossWeight) + 1);
  state.excelStatus = status;
  ctx.renderDetail(panel, status);
  ctx.setupDetailViewTabs(panel);
  assert.equal(detail.querySelector('.pfh-product-thumb'), thumb);
  assert.equal(detail.querySelector('img'), image);
  assert.equal(image.getAttribute('src'), 'blob:decoded-A');
  assert.equal(detail.querySelector('.pfh-detail-scroll'), scroll);
  assert.equal(scroll.scrollTop, 412);
  assert.equal(detail.querySelector('.pfh-detail-view-tabs'), tabs);
  assert.equal(field.value, 'unfinished');
  assert.equal(frames.length, 0, 'Background refresh does not restart tab animation');
}
image.dispatchEvent(new document.defaultView.Event('load'));
assert.equal(events, 1, 'Image load handlers survive ordinary refresh');
const markup = detail.innerHTML;
ctx.renderDetail(panel);
assert.equal(detail.innerHTML, markup, 'Unchanged rendering does not alter DOM');
active = null;
state.data.name = 'Updated product';
state.data.photo = 'B.jpg';
ctx.renderDetail(panel);
assert.notEqual(detail.querySelector('img'), image, 'An actual photo change creates fresh loader nodes');
assert.equal(detail.querySelector('h3').textContent, 'Updated product');
const nextImage = detail.querySelector('img');
state.data.sku = 'B'; state.selectedSku = 'B';
ctx.renderDetail(panel);
assert.notEqual(detail.querySelector('img'), nextImage, 'A new SKU has an independent detail lifecycle');
state.openingProjectDetail = true;
ctx.renderDetail(panel);
assert(!detail.querySelector('.pfh-product-thumb'), 'Opening a different drawer still shows its loading view');
state.openingProjectDetail = false;
ctx.renderDetail(panel);
assert(detail.querySelector('.pfh-product-thumb'), 'Returning from loading cannot reuse a stale markup signature');

ctx.updateAssistantDetailMarkup(detail, '<div class="pfh-detail-scroll"><section><div class="pfh-copywriting-content"><article>Copy</article></div></section></div>', 'B|copywriting');
const copyContent = detail.querySelector('.pfh-copywriting-content');
copyContent.scrollTop = 320;
ctx.updateAssistantDetailMarkup(detail, '<div class="pfh-detail-scroll"><section><div class="pfh-copywriting-alert">Checking</div><div class="pfh-copywriting-content"><article>Copy</article></div></section></div>', 'B|copywriting');
assert.equal(detail.querySelector('.pfh-copywriting-content'), copyContent, 'Adding a status preserves the copywriting scroll container');
assert.equal(copyContent.scrollTop, 320);
ctx.updateAssistantDetailMarkup(detail, '<div class="pfh-detail-scroll"><section><div class="pfh-copywriting-content"><article>Copy changed</article></div></section></div>', 'B|copywriting');
assert.equal(detail.querySelector('.pfh-copywriting-content'), copyContent, 'Removing a status and updating copy preserves the scroll container');
assert.equal(copyContent.scrollTop, 320);

vm.runInContext(extract(read('core-magic-upload'), '  function renderSizeImage(', '  function loadMagicUploadQueue('), ctx);
ctx.sizeImageViewHtml = () => '<section><img src="size.jpg"><canvas width="400" height="300"></canvas></section>';
ctx.parameterImageFeature = { viewHtml: () => '<section><img src="parameter.jpg"><input value="draft"></section>' };
for (const name of ['renderSizeImage', 'renderParameterImage']) {
  ctx[name](panel);
  const image = detail.querySelector('img');
  ctx[name](panel);
  assert.equal(detail.querySelector('img'), image, name + ' retains its preview during background refresh');
}

vm.runInContext(extract(read('core-ledger-detail'), '  function updateApiReadStatusView(', '  function setApiReadStatus('), ctx);
detail.innerHTML = '<div class="pfh-note"><button>Refresh</button></div>';
ctx.apiReadStatusHtml = () => '<span class="pfh-api-status"><i class="pfh-loading-ring"></i><span>Reading</span></span>';
ctx.updateApiReadStatusView();
const ring = detail.querySelector('.pfh-loading-ring');
ctx.updateApiReadStatusView();
assert.equal(detail.querySelector('.pfh-loading-ring'), ring, 'Repeated loading status retains spinner nodes');
console.log('Detail stability: PLM/status/export changes, decoded images, handlers, focus/scroll, tab setup, source/SKU replacement, loading recovery and size/parameter previews passed');
