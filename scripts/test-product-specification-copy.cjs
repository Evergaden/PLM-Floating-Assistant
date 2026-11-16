const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'src/product-development', name + '.module.js'), 'utf8');
function extract(source, name) {
  const start = source.search(new RegExp('  (?:async )?function ' + name + '\\('));
  assert(start >= 0, name);
  const next = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 3 + next);
}
const { document } = parseHTML('<main></main>');
const detail = { sku: 'SKU1', fields: [{ key: 'specification', attrId: 119, value: '4x4x13.5cm' }], materialDrafts: { box: { enabled: true } }, attrs: {} };
const state = { productDevelopmentReview: { sku: 'SKU1', editorDocument: { replacementEn: 'BOTANICAL\nBody Oil\n80ML/ 2.71 FL.OZ' } } };
const ctx = vm.createContext({ document, state,
  productDevelopmentCleanText: (value) => String(value ?? '').trim(),
  productDevelopmentCloneValue: (value) => structuredClone(value),
  productDevelopmentProductFieldCollections: (value) => value.fields,
  productDevelopmentSetProductAttrValue: (value, id, lang, data) => { value.attrs[id] = data; },
});
vm.runInContext(read('pd-prefill'), ctx);
const get = () => ctx.productDevelopmentPrefillProductFieldValue(detail, { key: 'specification', attrId: 119 });
assert.equal(get(), '80ml/盒');
assert.equal(detail.attrs[119], '80ml/盒');
state.productDevelopmentReview.editorDocument.replacementEn = 'Body Oil\nNET CONTENTS\n100 ML / 3.38 FL.OZ';
assert.equal(get(), '100ml/盒', 'Read latest English document rather than cached reference dimensions');
state.productDevelopmentReview.editorDocument.replacementEn = 'NET WT. 60 G / 2.12 OZ';
assert.equal(get(), '60g/盒');
state.productDevelopmentReview.editorDocument.replacementEn = 'Body Oil\n4x4x13.5cm\n1% Essential Oil';
assert.equal(get(), '', 'Do not reuse old derived contents when current copy has no net amount');
state.productDevelopmentReview.editorDocument.replacementEn = 'Body Oil\n80ML / 2.71 FL.OZ\n100ML / 3.38 FL.OZ';
assert.equal(get(), '', 'Ambiguous package amounts require correction instead of guessing');
state.productDevelopmentReview = { sku: 'OTHER', editorDocument: { replacementEn: '500ml' } };
detail.fields[0].value = '4x4x13.5cm';
delete detail.productDetailLocalValues;
assert.equal(get(), '4x4x13.5cm', 'Never read another SKU copy');
ctx.getProductDevelopmentReviewDraft = (sku) => ({ sku, plainTextCopy: 'Body Oil\n80ml / 2.71 fl.oz' });
assert.equal(get(), '80ml/盒', 'Same-SKU persisted copy works after switching views/reloading');
detail.materialDrafts = {};
detail.productDetailLocalValues['119@1'].value = '80ml/瓶';
detail.productDetailLocalValues['119@1'].displayValue = '80ml/瓶';
assert.equal(get(), '80ml/瓶', 'Retain known bottle unit when no carton is present');

// The UI hides derived inputs; the full field definitions remain available to
// filling/saving, so calculation and PLM write payloads are not removed.
vm.runInContext(read('pd-foundation'), ctx);
ctx.escapeHtml = (value) => String(value ?? '');
ctx.productDevelopmentPrefillFieldHtml = (field) => '<input data-form-key="' + field.key + '">';
ctx.productDevelopmentPage1FieldValue = () => '';
ctx.productDevelopmentProcurementFieldValue = () => '';
ctx.productDevelopmentPrefillProductFieldValue = () => '';
vm.runInContext(extract(read('pd-task-views'), 'productDevelopmentReadonlyDetailHtml'), ctx);
const host = document.querySelector('main');
host.innerHTML = ctx.productDevelopmentReadonlyDetailHtml(detail);
assert(!host.querySelector('[data-form-key="outerVolume"]'));
assert(!host.querySelector('[data-form-key="standardPackingQuantity"]'));
assert(host.querySelector('[data-form-key="outerLength"]'));
assert(host.querySelector('[data-form-key="specification"]'));
assert(vm.runInContext('PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.some(field => field.key === "outerVolume") && PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.some(field => field.key === "standardPackingQuantity")', ctx));
console.log('Product specification: current/persisted same-SKU English net contents, metric priority, units, stale/ambiguous handling and derived-input removal passed');
