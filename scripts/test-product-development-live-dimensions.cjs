const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const { document } = parseHTML('<div class="pfh-detail">' + ['outerLength', 'outerWidth', 'outerHeight', 'outerVolume', 'standardPackingQuantity'].map((key) => '<label class="pfh-product-development-form-field is-missing"><input class="pfh-product-development-form-input" data-form-sku="SKU1" data-form-group="prefill" data-form-key="' + key + '"></label>').join('') + '</div>');
const fields = ['outerLength', 'outerWidth', 'outerHeight', 'outerVolume', 'standardPackingQuantity'].map((key, index) => ({ key, attrId: index === 4 ? 123 : 133 + index, value: '' }));
const detail = { sku: 'SKU1', fields, attrs: {}, materialDrafts: { box: { enabled: true, length: 4.3, width: 4.3, height: 11.7 } }, productDevelopmentReworkLookup: { status: 'ready', data: { outerLength: 1, outerWidth: 1, outerHeight: 1, outerVolume: 1, standardPackingQuantity: 40425 } } };
let saves = 0;
const context = vm.createContext({ document, state: { productDevelopmentTaskFormData: { SKU1: detail } },
  productDevelopmentCloneValue: (value) => structuredClone(value),
  productDevelopmentCleanText: (value, limit = 12000) => String(value ?? '').trim().slice(0, limit),
  productDevelopmentHandleOneShotEditorInput: () => false,
  scheduleProductDevelopmentReadonlyDetailCache: () => { saves++; },
});
for (const name of ['pd-foundation', 'pd-prefill', 'pd-task-views', 'pd-dispatcher']) vm.runInContext(read('src/product-development/' + name + '.module.js'), context);
context.productDevelopmentProductFieldCollections = (value) => value.fields;
context.productDevelopmentSetProductAttrValue = (value, attr, lang, data) => { value.attrs[attr] = data; };
context.productDevelopmentMaterialRowKind = () => 'box';
const cloud = read('src/core-cloud-backup.module.js');
const start = cloud.indexOf('  function calculateLocalPackRecommendation(');
vm.runInContext(cloud.slice(start, cloud.indexOf('\n  }', start) + 4), context);
const inputs = Object.fromEntries(Array.from(document.querySelectorAll('input')).map((input) => [input.getAttribute('data-form-key'), input]));
const write = (key, value) => { inputs[key].value = value; context.productDevelopmentHandleInput({ target: inputs[key] }); };
write('outerLength', '4.3'); write('outerWidth', '4.3'); write('outerHeight', '11.7');
assert.equal(inputs.outerVolume.value, '216.33');
assert.equal(inputs.standardPackingQuantity.value, String(context.calculateLocalPackRecommendation('4.3x4.3x11.7').packCount));
assert(!inputs.outerHeight.closest('label').classList.contains('is-missing'), 'Typing clears the missing-field style immediately');
write('outerLength', '4'); write('outerWidth', '4'); write('outerHeight', '12');
assert.equal(inputs.outerVolume.value, '192');
assert.equal(inputs.standardPackingQuantity.value, '210');
assert.equal(detail.attrs[136], 192, 'Computed values reach saved PLM attributes');
context.productDevelopmentSyncReworkOuterDimensions(detail);
assert.equal(detail.productDetailLocalValues['133@1'].value, '4', 'Rendering/BOM prefill must not overwrite the edited dimension');
write('outerHeight', '');
assert.equal(inputs.outerVolume.value, '');
assert.equal(inputs.standardPackingQuantity.value, '');
write('outerHeight', '0');
assert.equal(inputs.standardPackingQuantity.value, '');
write('outerHeight', '1000');
assert.equal(inputs.standardPackingQuantity.value, '0', 'Oversized products do not reuse the old reference count');
assert(saves >= 6);
const css = read('cloudflare/plm-cloud-backup/ui-src/modules/product-development.css');
assert(!css.slice(css.indexOf('.pfh-product-development-form-field.is-missing input'), css.indexOf('}', css.indexOf('.pfh-product-development-form-field.is-missing input'))).includes('font-style: italic'));
console.log('Live dimensions: input/DOM/attributes, Excel packing rule, manual priority, missing/zero/oversized values and upright field styles passed');
