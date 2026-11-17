const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'src/product-development', name + '.module.js'), 'utf8');
const defaults = {
  box: { label: '纸盒', materialType: 0, shelfLife: '食品两年' },
  label: { label: '标签', materialType: 1, shelfLife: '食品两年', labelShape: '圆弧', adhesive: '玻璃加粘' },
  instruction: { label: '说明书', materialType: 6 },
};
const context = vm.createContext({
  productDevelopmentRefreshDerivedDimensions() {},
  PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS: defaults,
  PRODUCT_DEVELOPMENT_MATERIAL_DRAFT_VERSION: 2,
  PRODUCT_DEVELOPMENT_BOX_QUANTITY_OPTIONS: [{ value: 1, factor: 4.5, minPrice: 0.18 }],
  productDevelopmentCleanText: (value, max = 4000) => String(value ?? '').trim().slice(0, max),
  productDevelopmentIsSupplement: (detail) => detail.isSupplement !== false,
  getProductDevelopmentTaskMeta: () => ({ productNameCn: '身体滚珠精华液' }),
  productDevelopmentReadonlyValueText: (value) => String(value ?? ''),
  escapeHtml: (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'),
});
vm.runInContext(read('pd-pricing-drafts') + read('pd-dom'), context);
const sync = context.productDevelopmentSyncMaterialDimensions;
const box = { specification: '50ml/盒，4.3x4.3x11.7cm（内卡）', length: '4.3', width: '4.3', height: '11.7', specificationSource: 'manual' };
box.length = '5.25';
sync('box', box, 'length');
assert.equal(box.specification, '50ml/盒，5.25x4.3x11.7cm（内卡）');
box.length = '4.333';
sync('box', box, 'length');
assert.equal(box.specification, '50ml/盒，4.333x4.3x11.7cm（内卡）');
box.specification = '50ml/盒，43×44×117mm（内卡）';
sync('box', box, 'specification');
assert.deepEqual([box.length, box.width, box.height], ['4.3', '4.4', '11.7']);
box.height = '12';
sync('box', box, 'height');
assert.equal(box.specification, '50ml/盒，4.3x4.4x12cm（内卡）');
box.specification = '50ml/盒，4.3x';
sync('box', box, 'specification');
assert.deepEqual([box.length, box.width, box.height], ['', '', ''], 'Incomplete specification cannot retain stale dimensions');
const label = { specification: '50ml/盒，100mm*60mm（玻璃加粘）', length: '', width: '' };
sync('label', label, 'specification');
assert.deepEqual([label.length, label.width], ['10', '6']);
label.width = '7';
sync('label', label, 'width');
assert.equal(label.specification, '50ml/盒，10x7cm（玻璃加粘）');
const detail = {
  isSupplement: false, sku: 'SKU1',
  bomRows: [{ materialType: 0, materialId: 'CURRENT', name: '旧品纸盒（内卡）', specification: '50ml/盒，4x5x12cm，白卡', length: 4, width: 5, height: 12 }],
  productDevelopmentReworkLookup: { data: { bomRows: [{ materialType: 0, materialId: 'REFERENCE', name: '对标纸盒（哑膜）' }] } },
};
const normalized = context.productDevelopmentNormalizeMaterialDraft(null, 'box', detail, {});
assert.equal(normalized.materialId, 'CURRENT', 'Reference material IDs must not overwrite current bindings');
assert.equal(normalized.referenceRemark, '哑膜');
assert.equal(normalized.shelfLife, '');
const noReference = { ...detail, productDevelopmentReworkLookup: null, bomRows: [] };
const renamed = { ...noReference, productDetailLocalNames: { productNameCn: '新产品' } };
const generated = context.productDevelopmentNormalizeMaterialDraft({ materialName: 'SKU1纸盒', nameSource: 'generated' }, 'box', renamed, {});
assert.equal(generated.materialName, '新产品纸盒', 'Generated cached SKU names follow the locally edited product name');
const manualName = context.productDevelopmentNormalizeMaterialDraft({ materialName: '人工名称', nameSource: 'manual' }, 'box', renamed, {});
assert.equal(manualName.materialName, '人工名称', 'Manually edited material names are preserved');
const oldFood = context.productDevelopmentNormalizeMaterialDraft({materialName:'镁霜标签（圆弧 食品两年）',referenceRemark:'食品两年',shelfLife:'食品两年'}, 'label', noReference, {});
assert(!oldFood.materialName.includes('食品两年'));
assert.equal(oldFood.referenceRemark, '');
assert.equal(oldFood.shelfLife, '');
normalized.nameSource = 'generated';
normalized.length = '4.5';
sync('box', normalized, 'length');
context.productDevelopmentRecalculateMaterialDraft('box', normalized, detail, {});
assert.equal(normalized.materialName, '身体滚珠精华液纸盒（哑膜）');
assert.equal(normalized.specification, '50ml/盒，4.5x5x12cm，白卡', 'Recalculation preserves non-size specification text');
const legacy = context.productDevelopmentNormalizeMaterialDraft({ shelfLife: '食品两年' }, 'label', { isSupplement: false }, {});
assert(!legacy.materialName.includes('食品两年'));
const supplement = context.productDevelopmentNormalizeMaterialDraft(null, 'label', { isSupplement: true }, {});
assert.equal(supplement.materialName, '身体滚珠精华液标签（圆弧 食品两年）');
// Editing an empty dimension must not lose the other values during normalization.
const partial = { ...normalized, specificationSource: 'manual', length: '' };
sync('box', partial, 'length');
const resumed = context.productDevelopmentNormalizeMaterialDraft(partial, 'box', detail, {});
assert.equal(resumed.length, '', 'Explicitly cleared dimension must not be restored from current BOM');
assert.equal(resumed.width, '5');
assert.equal(resumed.height, '12');
const html = context.productDevelopmentReadonlyBomHtml([{ code: 'MTL1', name: '<测试>', price: 0.2 }], 'SKU1');
assert(!/<(?:input|textarea|select)\b/.test(html), 'Bound BOM is displayed without editable controls');
assert(html.includes('<dl ') && html.includes('&lt;测试&gt;'));
// Exercise the real input handler and peer DOM updates as one interaction.
vm.runInContext(read('pd-task-views'), context);
detail.materialDrafts = { box: normalized };
context.state = { productDevelopmentTaskFormData: { SKU1: detail } };
context.getProductDevelopmentTaskBySku = () => ({});
context.productDevelopmentSyncReworkOuterDimensions = () => {};
let scheduled = 0;
context.scheduleProductDevelopmentReadonlyDetailCache = () => { scheduled++; };
const { document } = parseHTML('<article data-material-card="box">' + ['materialName', 'specification', 'length', 'width', 'height', 'price'].map((field) => '<label class="pfh-product-development-material-field"><input class="pfh-product-development-material-input" data-material-sku="SKU1" data-material-kind="box" data-material-field="' + field + '" value="' + normalized[field] + '"><small data-material-error="' + field + '" hidden></small></label>').join('') + '</article>');
const inputs = Array.from(document.querySelectorAll('input'));
context.document = document;
const specificationInput = inputs[1];
specificationInput.value = '50ml/盒，7.25x5x12cm，白卡';
assert.equal(context.productDevelopmentHandleMaterialField(specificationInput), true);
assert.equal(inputs[2].value, '7.25', 'Specification input immediately updates the dimension control');
assert.equal(specificationInput.value, '50ml/盒，7.25x5x12cm，白卡', 'Active text is not replaced');
inputs[4].value = '12.333';
context.productDevelopmentHandleMaterialField(inputs[4]);
assert.equal(specificationInput.value, '50ml/盒，7.25x5x12.333cm，白卡', 'Dimension input immediately updates specification');
assert.equal(scheduled, 2);
let currentSpecification = '80ml/盒';
context.productDevelopmentPrefillProductFieldValue = () => currentSpecification;
context.productDevelopmentProductFieldCollections = () => [];
context.productDevelopmentSaveBomLocally = () => {};
specificationInput.value = '4x4x13.5cm，白卡';
context.productDevelopmentHandleMaterialField(specificationInput, 'change');
assert.equal(specificationInput.value, '80ml/盒，4x4x13.5cm，白卡', 'Manual dimensions-only legacy specs receive the current product prefix on commit');
assert.equal(detail.materialDrafts.box.packSpec, '80ml/盒');
assert.equal(specificationInput.getAttribute('aria-invalid'), 'false');
currentSpecification = '100ml/盒';
context.productDevelopmentEnsureMaterialDrafts(detail, {});
context.productDevelopmentSyncMaterialDraftDom('SKU1', 'box', detail.materialDrafts.box);
assert.equal(specificationInput.value, '100ml/盒，4x4x13.5cm，白卡', 'Changed product specification replaces the prefix without duplicates or lost remarks');
const labelDraft = context.productDevelopmentNormalizeMaterialDraft({ specification: '50ml/盒，10x6cm（玻璃加粘）', specificationSource: 'manual' }, 'label', detail, {});
assert.equal(labelDraft.specification, '100ml/盒，10x6cm（玻璃加粘）', 'Labels share the current product prefix and retain their own size and remarks');
currentSpecification = '50g/盒';
const duplicated = context.productDevelopmentNormalizeMaterialDraft({ nameSource: 'generated', specificationSource: 'generated', specification: '50g，6.3x6.3x5.4cm', length: '6.3', width: '6.3', height: '5.4' }, 'box', renamed, {});
assert.equal(duplicated.specification, '50g/盒，6.3x6.3x5.4cm', 'A legacy bare net quantity is not repeated after the product prefix');
inputs[4].value = '';
context.productDevelopmentHandleMaterialField(inputs[4]);
assert(inputs[4].closest('label').classList.contains('is-invalid'));
assert.equal(inputs[4].getAttribute('aria-invalid'), 'true');
assert(specificationInput.closest('label').classList.contains('is-invalid'));
assert.equal(inputs[4].closest('label').querySelector('small').hidden, false);
inputs[4].value = '13.5';
context.productDevelopmentHandleMaterialField(inputs[4]);
assert.equal(inputs[4].getAttribute('aria-invalid'), 'false');
assert.equal(specificationInput.getAttribute('aria-invalid'), 'false');
assert.equal(inputs[4].closest('label').querySelector('small').hidden, true);
const issues = context.productDevelopmentMaterialDraftIssues('box', { materialName: '', specification: '4x4x13.5cm', length: 4, width: 4, height: 13.5, price: '' });
assert(issues.materialName && issues.specification && issues.price, 'Nonempty but invalid specs are incomplete too');
const rendered = context.productDevelopmentMaterialInputHtml('SKU1', 'box', 'materialName', '物料名称', '', { required: true });
assert(rendered.includes('is-invalid') && rendered.includes('aria-invalid="true"'));
console.log('Material dimensions, specification round trips, reference remarks, legacy supplement defaults and readonly BOM checks passed');
