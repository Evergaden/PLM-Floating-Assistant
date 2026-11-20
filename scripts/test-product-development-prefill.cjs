const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'src/product-development', name + '.module.js'), 'utf8');
function extract(source, name) {
  const match = new RegExp('  (?:async )?function ' + name + '\\(').exec(source);
  assert(match, name);
  const start = match.index;
  const next = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 3 + next);
}
const keys = ['outerLength', 'outerWidth', 'outerHeight', 'outerVolume'];
const definitions = keys.map((key, index) => ({ key, attrId: 133 + index }));
const context = vm.createContext({
  productDevelopmentRefreshDerivedDimensions() {},
  PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS: definitions,
  productDevelopmentReferenceLabel: () => '返工',
  productDevelopmentCleanText: (value, limit = 4000) => String(value ?? '').trim().slice(0, limit),
  productDevelopmentCloneValue: (value) => JSON.parse(JSON.stringify(value)),
  productDevelopmentMaterialRowKind: (row) => row.kind,
  productDevelopmentProductFieldCollections: (detail) => detail.fields,
  productDevelopmentSetProductAttrValue: (detail, attrId, languageId, value) => { detail.attrs[attrId] = value; },
});
const prefill = read('pd-prefill');
assert.match(prefill, /setField\('minimumOrderQuantity', '1000', '1000'\)/, 'Reference-product prefill uses the 1000 minimum order quantity default');
context.state = { productDevelopmentSelectedTask: {} };
context.getProductDevelopmentTaskBySku = () => ({});
context.getProductDevelopmentTaskMeta = () => ({ productNameCn: '最新中文名', productNameEn: 'New name', brand: 'NEW' });
context.productDevelopmentEntryEnglishProductName = () => '';
context.productDevelopmentNormalizeBrandValue = (value) => value;
context.productDevelopmentNormalizeCategoryPathValue = (value) => value;
vm.runInContext(extract(prefill, 'productDevelopmentPage1FieldValue'), context);
for (const name of ['productDevelopmentPrefillHasValue', 'productDevelopmentPrefillText', 'productDevelopmentPrefillLocalAttrValue', 'productDevelopmentPrefillProductFieldValue', 'productDevelopmentRememberLocalProductField', 'productDevelopmentMarkProductDetailDirty', 'productDevelopmentNormalizeReworkProductCode', 'productDevelopmentReworkLookupState', 'productDevelopmentReworkLookupValuePresent', 'productDevelopmentReworkLookupNumber', 'productDevelopmentReworkLookupValue', 'productDevelopmentReadonlyDimensionText', 'productDevelopmentReworkLookupDimensions', 'productDevelopmentReworkLookupObjectDimensions', 'productDevelopmentReworkLookupPaperBoxDimensions', 'productDevelopmentSyncReworkOuterDimensions']) {
  vm.runInContext(extract(prefill, name), context);
}
const cachedPage1 = { sku: 'SKU1', productDetailLocalPage1: { productNameCn: '旧中文名', productNameEn: 'Old name', brand: 'OLD', categoryPath: '旧分类', productGroupPath: '旧分组' } };
assert.equal(context.productDevelopmentPage1FieldValue(cachedPage1, 'productNameCn'), '最新中文名');
assert.equal(context.productDevelopmentPage1FieldValue(cachedPage1, 'productNameEn'), 'New name');
assert.equal(context.productDevelopmentPage1FieldValue(cachedPage1, 'brand'), 'NEW');
assert.equal(context.productDevelopmentPage1FieldValue(cachedPage1, 'categoryPath'), '旧分类');
assert.equal(context.productDevelopmentPage1FieldValue(cachedPage1, 'productGroupPath'), '旧分组');
function checkDimensions() {
  const original = { outerLength: 1, outerWidth: 1, outerHeight: 1, outerVolume: 1, outerDimensions: [1, 1, 1], packagingType: 'bottle' };
  const detail = {
    fields: definitions.map((item) => ({ ...item, value: 1 })), attrs: {},
    productDetailLocalValues: {}, productDevelopmentReworkLookup: { status: 'ready', data: original },
    materialDrafts: { box: { enabled: true, length: 3.2, width: 4.5, height: 10 } },
    bomRows: [{ name: '纸盒', length: 2, width: 2, height: 2 }],
  };
  assert.equal(context.productDevelopmentSyncReworkOuterDimensions(detail), true);
  assert.deepEqual(keys.map((key, index) => detail.attrs[133 + index]), [3.2, 4.5, 10, 144]);
  assert.equal(detail.productDetailLocalValues['133@1'].source, 'BOM 纸盒尺寸');
  assert.equal(original.outerLength, 1);
  assert.equal(context.productDevelopmentSyncReworkOuterDimensions(detail), false);
  detail.materialDrafts.box.length = 3.5;
  assert.equal(context.productDevelopmentPrefillProductFieldValue(detail, definitions[0]), '3.5');
  assert.equal(detail.attrs[136], 157.5);
  detail.materialDrafts.box.enabled = false;
  assert.equal(context.productDevelopmentSyncReworkOuterDimensions(detail), true);
  assert.equal(detail.attrs[133], 2); // An existing bound box is still valid.
  assert.equal(context.productDevelopmentReworkLookupDimensions('0x2x3cm'), null);
  detail.bomRows = [{ name: '纸盒（无尺寸）' }, { name: '纸盒', specification: '5x6x7cm' }];
  context.productDevelopmentSyncReworkOuterDimensions(detail);
  assert.deepEqual(keys.map((key, index) => detail.attrs[133 + index]), [5, 6, 7, 210]);
  detail.bomRows = [];
  context.productDevelopmentSyncReworkOuterDimensions(detail);
  assert.deepEqual(keys.map((key, index) => detail.attrs[133 + index]), [1, 1, 1, 1]);
  detail.productDetailLocalValues['133@1'] = { value: 8, displayValue: '8', source: 'manual' };
  context.productDevelopmentSyncReworkOuterDimensions(detail);
  assert.equal(detail.productDetailLocalValues['133@1'].value, 8);
  detail.productDevelopmentReworkLookup = { status: 'idle' };
  assert.equal(context.productDevelopmentSyncReworkOuterDimensions(detail), false);
  const local = { fields: definitions.map((item) => ({ ...item, value: '' })), attrs: {}, productDetailLocalValues: {}, materialDrafts: { box: { enabled: true, length: '6.3', width: '', height: '' } } };
  const displayed = {};
  const scope = { querySelectorAll(selector) { const key = selector.match(/data-form-key="([^"]+)"/)[1]; return [{ set value(value) { displayed[key] = value; }, closest() { return null; } }]; } };
  assert.equal(context.productDevelopmentSyncReworkOuterDimensions(local, null, scope), true, 'Local carton dimensions do not require a reference lookup');
  assert.equal(local.attrs[133], 6.3);
  assert.equal(displayed.outerLength, '6.3', 'Visible outer length updates immediately');
  local.materialDrafts.box.width = '5';
  local.materialDrafts.box.height = '4';
  context.productDevelopmentSyncReworkOuterDimensions(local, null, scope);
  assert.deepEqual(keys.map((key, index) => local.attrs[133 + index]), [6.3, 5, 4, 126]);
  local.productDetailLocalValues['133@1'] = { value: 8, displayValue: '8', source: 'manual' };
  local.materialDrafts.box.length = '7';
  context.productDevelopmentSyncReworkOuterDimensions(local);
  assert.equal(local.productDetailLocalValues['133@1'].value, 8, 'Manually entered outer dimensions are preserved');
}

async function checkPrice() {
  const events = [];
  let active = null;
  let field;
  let model = null;
  let previousInput = '2.02';
  let validationError = true;
  let forceError = false;
  class Input {
    constructor(value) { this.stored = value; this.id = 'price'; this.isConnected = true; }
    get value() { return this.stored; }
    set value(value) { this.stored = value; }
    focus() { active = this; events.push('focus'); }
    blur() { assert.equal(active, this); active = null; events.push('real-blur'); validationError = forceError || model === null; }
    dispatchEvent(event) {
      events.push([event.type, this.value]);
      if (event.type === 'input' && this.value !== previousInput) {
        previousInput = this.value;
        model = this.value === '' ? null : Number(this.value);
      }
    }
    closest() { return { querySelector: () => validationError ? {} : null }; }
    getAttribute() { return validationError ? 'true' : 'false'; }
  }
  class SyntheticEvent { constructor(type, options) { this.type = type; Object.assign(this, options); } }
  const price = vm.createContext({
    window: { HTMLInputElement: Input, HTMLTextAreaElement: class {}, InputEvent: SyntheticEvent }, Event: SyntheticEvent,
    document: { getElementById: () => field },
    productDevelopmentDomVisible: () => true,
    productDevelopmentDomWait: async () => {},
  });
  const dom = read('pd-dom');
  vm.runInContext(extract(dom, 'productDevelopmentDomNativeSetter'), price);
  vm.runInContext(extract(dom, 'productDevelopmentDomCommitNumber'), price);
  field = new Input('2.02');
  await price.productDevelopmentDomCommitNumber(field, '2.02');
  assert.equal(model, 2.02);
  assert.equal(validationError, false);
  assert(events.some((item) => Array.isArray(item) && item[0] === 'input' && item[1] === ''));
  assert(events.includes('real-blur'));
  await price.productDevelopmentDomCommitNumber(field, 0);
  assert.equal(model, 0);
  await assert.rejects(price.productDevelopmentDomCommitNumber(field, 'invalid'), /有效数字/);
  forceError = true;
  await assert.rejects(price.productDevelopmentDomCommitNumber(field, 2.02), /尚未通过/);
  forceError = false;
  const blur = field.blur.bind(field);
  field.blur = () => { blur(); if (model === 1000) field.stored = '1,000'; };
  await price.productDevelopmentDomCommitNumber(field, 1000, '最小起订量');
  assert.equal(model, 1000, 'Formatted thousands still verify against the numeric form value');
  const getAttribute = field.getAttribute.bind(field);
  field.getAttribute = (name) => name === 'aria-valuemax' ? '10000' : getAttribute(name);
  const eventCount = events.length;
  await assert.rejects(price.productDevelopmentDomCommitNumber(field, 40425, '标准装箱数'), /标准装箱数.*最大 10000/);
  assert.equal(events.length, eventCount, 'Out-of-range values must not clear or write the PLM field');
}
checkDimensions();
checkPrice().then(() => console.log('Product development price commit and BOM dimensions regression passed')).catch((error) => { console.error(error); process.exitCode = 1; });
