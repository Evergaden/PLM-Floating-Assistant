const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'src', name + '.module.js'), 'utf8');
const slice = (source, start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const { document } = parseHTML('<html><body><div id="panel"><div class="pfh-detail"></div></div></body></html>');
const panel = document.getElementById('panel');
const state = { settings: {}, view: 'detail', workMode: 'daily', selectedSku: 'A', data: { sku: 'A', projectId: '123' }, sizeImageAccessEnabled: true, parameterImageAccessEnabled: true };
let access = true, dialogs = 0, renders = 0;
const pending = [];
const ctx = vm.createContext({
  state, document, console,
  escapeHtml: (value) => String(value || ''), iconHtml: (name) => '<svg data-icon="' + name + '"></svg>',
  productDevelopmentFeatureForView: (view) => view === 'review' || view === 'copywriting' ? view : '',
  productDevelopmentHasAccess: () => access,
  showProductDevelopmentPermissionDialog: () => dialogs++,
  normalizeData: (data) => data, loadData: () => null, showToast: () => {}, expandPanel: () => renders++,
  parameterImageFeature: { loadRules() {} }, openCopywritingFromCurrent() {},
  saveProductDevelopmentReviewDraft: () => {}, restoreProductDevelopmentReviewDraft: () => {},
  getProductDevelopmentTaskBySku: () => null,
  productDevelopmentTaskActionsHtml: (task) => '<section data-task="' + task.sku + '">Development detail</section>',
  productDevelopmentTaskEmbeddedViewHtml: (view) => '<section data-editor="' + view + '"></section>',
  updateAssistantDetailMarkup: (detail, html) => { detail.innerHTML = html; },
  productDevelopmentMountReviewEditorOverlay: () => {},
  hydrateProductDevelopmentTaskDetail: (task) => new Promise((resolve) => pending.push({ sku: task.sku, resolve })),
  renderShell: () => renders++,
  formatErrorMessage: (error) => error.message,
});
vm.runInContext(slice(read('core-panel-views'), '  const DETAIL_VIEW_TABS', '  function setupDetailViewTabs('), ctx);
vm.runInContext(slice(read('core-detail-copywriting'), '  function switchDetailViewTab(', '  function acknowledgeCopywritingUpdate('), ctx);
vm.runInContext(slice(read('product-development/pd-task-views'), '  function renderDesignDevelopmentDetail(', '  function renderProductDevelopmentTaskDetail('), ctx);
vm.runInContext(slice(read('product-development/pd-task-sync'), '  function productDevelopmentApplyReadonlyDetailState(', '  async function hydrateProductDevelopmentTaskDetail('), ctx);
ctx.productDevelopmentRecordMaterialsFromBom = () => {};
const nav = () => { const root = document.createElement('div'); root.innerHTML = ctx.detailViewTabsHtml(); return root.firstElementChild; };
assert.equal(nav().querySelectorAll('button').length, 4, 'Existing installations keep four design tabs');
assert.equal(ctx.normalizeDetailViewTab('development-review'), 'detail');
state.settings.designDevelopmentTabs = true;
assert.equal(nav().querySelectorAll('button').length, 7);
assert.equal(nav().querySelectorAll('.is-development').length, 3);
access = false;
ctx.switchDetailViewTab('development-review');
assert.equal(dialogs, 1);
assert.equal(state.designDevelopmentTab, undefined, 'Locked editor must not open');
access = true;
ctx.switchDetailViewTab('development-detail');
assert.equal(state.view, 'detail');
assert.equal(state.workMode, 'daily', 'Integrated editors keep the design workspace');
assert.equal(ctx.renderDesignDevelopmentDetail(panel), true);
assert.equal(state.productDevelopmentTaskSelectedSku, 'A');
assert.equal(pending.length, 1);
ctx.renderDesignDevelopmentDetail(panel);
assert.equal(pending.length, 1, 'Editor rerenders must not repeat hydration');
ctx.switchDetailViewTab('development-review');
ctx.renderDesignDevelopmentDetail(panel);
assert.equal(ctx.getCurrentDetailViewTab(), 'development-review');
assert.equal(panel.querySelector('[data-editor]').getAttribute('data-editor'), 'review');
assert.equal(nav().querySelector('.is-active').getAttribute('aria-label'), '侵权图');
state.selectedSku = 'B'; state.data = { sku: 'B' };
state.productDevelopmentBenchmarkImageDataUrl = 'data:previous-product';
ctx.renderDesignDevelopmentDetail(panel);
assert.equal(state.productDevelopmentSelectedTask.sku, 'B', 'Changing design SKU rebinds the development editor');
assert.equal(state.productDevelopmentBenchmarkImageDataUrl, '', 'Benchmark uploads must not leak across SKUs');
assert.equal(pending.length, 2);
ctx.productDevelopmentApplyReadonlyDetailState({ sku: 'A' }, { bomRows: [] }, { sku: 'A' });
assert.equal(state.selectedSku, 'B', 'Late hydration must not reselect an old SKU');
assert.equal(state.data.sku, 'B');
// Also cover leaving an integrated editor before its request finishes.
state.productDevelopmentTaskSelectedSku = 'A';
ctx.productDevelopmentApplyReadonlyDetailState({ sku: 'A' }, { bomRows: [] }, { sku: 'A' });
assert.equal(state.selectedSku, 'B');
ctx.switchDetailViewTab('parameterImage');
assert.equal(state.designDevelopmentTab, '');
assert.equal(state.view, 'parameterImage');
assert.equal(ctx.getCurrentDetailViewTab(), 'parameterImage');
state.settings.designDevelopmentTabs = false;
assert.equal(nav().querySelectorAll('button').length, 4);
vm.runInContext(slice(read('core-project-nav'), '  function runSearch(', '  function clearSearch('), ctx);
Object.assign(ctx, {
  ensurePanel: () => ({ querySelector: () => ({ value: 'C' }) }),
  normalizeSearchInput: (value) => value, parseSearchTokens: (value) => value ? [value] : [],
  updateSearchClear() {}, hasSkuFilters: () => false, getFilteredSearchMatches: () => [{ sku: 'C' }],
  resetExcelState() {}, loadData: (sku) => ({ sku }),
});
state.settings.designDevelopmentTabs = true;
ctx.runSearch('development-copywriting');
assert.equal(state.view, 'detail', 'Searching from an integrated tab keeps a valid design view');
assert.equal(state.designDevelopmentTab, 'development-copywriting');
assert.equal(state.selectedSku, 'C');
ctx.renderDesignDevelopmentDetail(panel);
assert.equal(state.productDevelopmentTaskSelectedSku, 'C');
state.settings.designDevelopmentTabs = false;
(async () => {
  const before = renders;
  pending.forEach((request) => request.resolve());
  await Promise.resolve();
  assert.equal(renders, before, 'Requests finishing outside the integrated editor must not redraw it');
  console.log('Integrated design tabs, access checks, current SKU binding, stale hydration and opt-out passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
