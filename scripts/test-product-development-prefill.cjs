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
  PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS: definitions,
  productDevelopmentReferenceLabel: () => '返工',
  productDevelopmentCleanText: (value, limit = 4000) => String(value ?? '').trim().slice(0, limit),
  productDevelopmentCloneValue: (value) => JSON.parse(JSON.stringify(value)),
  productDevelopmentMaterialRowKind: (row) => row.kind,
  productDevelopmentProductFieldCollections: (detail) => detail.fields,
  productDevelopmentSetProductAttrValue: (detail, attrId, languageId, value) => { detail.attrs[attrId] = value; },
});
const prefill = read('pd-prefill');
for (const name of ['productDevelopmentPrefillHasValue', 'productDevelopmentPrefillText', 'productDevelopmentPrefillLocalAttrValue', 'productDevelopmentPrefillProductFieldValue', 'productDevelopmentRememberLocalProductField', 'productDevelopmentMarkProductDetailDirty', 'productDevelopmentNormalizeReworkProductCode', 'productDevelopmentReworkLookupState', 'productDevelopmentReworkLookupValuePresent', 'productDevelopmentReworkLookupNumber', 'productDevelopmentReworkLookupValue', 'productDevelopmentReadonlyDimensionText', 'productDevelopmentReworkLookupDimensions', 'productDevelopmentReworkLookupObjectDimensions', 'productDevelopmentReworkLookupPaperBoxDimensions', 'productDevelopmentSyncReworkOuterDimensions']) {
  vm.runInContext(extract(prefill, name), context);
}
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
}
checkDimensions();
checkPrice().then(() => console.log('Product development price commit and BOM dimensions regression passed')).catch((error) => { console.error(error); process.exitCode = 1; });
