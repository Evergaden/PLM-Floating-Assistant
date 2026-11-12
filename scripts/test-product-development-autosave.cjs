const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const detail = { sku: 'SKU1', productDetailLocalProcurement: {}, bomRows: [{ length: '10' }] };
let persisted, cleared = '', rendered = 0, scheduled = 0;
const status = { textContent: '', classList: { remove() {}, add() {} } };
const context = vm.createContext({
  state: { productDevelopmentTaskFormData: { SKU1: detail } },
  PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS: [],
  PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS: [],
  PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS: [{ key: 'quantity' }],
  productDevelopmentHandleOneShotEditorInput: () => false,
  productDevelopmentMarkProductDetailDirty: (value) => { value.productDetailDraftDirty = true; },
  scheduleProductDevelopmentReadonlyDetailCache: () => { scheduled++; },
  clearProductDevelopmentReadonlyDetailCacheWriteTimer: (sku) => { cleared = sku; },
  saveProductDevelopmentReadonlyDetailCache: (sku, value) => { persisted = JSON.parse(JSON.stringify(value)); },
  renderShell: () => { rendered++; },
  escapeHtml: (value) => String(value || ''),
  productDevelopmentPrefillFieldHtml: () => '',
  productDevelopmentProcurementFieldValue: () => '1000',
  getProductDevelopmentTaskMeta: () => ({ reworkProductCode: 'SKU2' }),
  productDevelopmentNormalizeBrandValue: (value) => value || '',
  productDevelopmentReferenceLabel: () => '对标',
});
for (const file of ['pd-task-views', 'pd-dispatcher']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'src/product-development', file + '.module.js'), 'utf8'), context);
}
const target = {
  value: '2400', classList: { contains: (name) => name === 'pfh-product-development-form-input' },
  getAttribute: (key) => ({ 'data-form-sku': 'SKU1', 'data-form-group': 'procurement', 'data-form-key': 'quantity' })[key] || '',
  closest: () => ({ querySelector: () => status }),
};
assert.equal(context.productDevelopmentHandleInput({ target }), true);
assert.equal(detail.productDetailLocalProcurement.quantity, '2400');
assert.equal(detail.productDetailProcurementQuantitySource, 'manual');
assert.equal(detail.productDetailDraftDirty, true);
assert.equal(scheduled, 1, 'Typing still schedules a crash-recovery draft');
assert.equal(context.productDevelopmentHandleChange({ target }), true);
assert.equal(cleared, 'SKU1');
assert.equal(persisted.productDetailLocalProcurement.quantity, '2400', 'Blur persists the exact latest value');
assert.equal(persisted.productDetailDraftDirty, false);
assert.equal(persisted.productDetailSaveState, 'saved');
assert.ok(persisted.productDetailSavedAt);
assert.match(status.textContent, /自动保存/);
assert.equal(rendered, 0, 'Blur must not replace the form or interrupt the next focus/click');
target.getAttribute = (key) => ({ 'data-form-sku': 'SKU1', 'data-form-group': 'bom', 'data-form-key': '0.length' })[key] || '';
target.value = '999';
context.productDevelopmentHandleInput({ target });
assert.equal(detail.bomRows[0].length, '10', 'Bound PLM BOM is not an editable draft');
const html = context.productDevelopmentReadonlyDetailHtml(detail);
assert(!html.includes('文件上传'));
assert(!html.includes('product-development-product-save-local'));
assert(html.includes('pfh-product-development-detail-heading'));
const meta = context.productDevelopmentTaskLocalMetaHtml({ sku: 'SKU1' }, detail);
assert(meta.includes('对标产品编码'));
assert(!meta.includes('product-development-rework-lookup'));
assert(!meta.includes('product-development-task-meta-save'));
console.log('Product-development blur persistence, manual quantity ownership and simplified form checks passed');
