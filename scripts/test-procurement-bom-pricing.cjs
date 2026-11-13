const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const { document } = parseHTML('<div class="pfh-detail"></div>');
const detail = { sku: 'SKU1', projectId: '65024', fields: [{ attrId: 152 }], productAttrValues: [], productDetailLocalProcurement: { materialPrice: '2.03' }, bomRows: [] };
let timer;
const context = vm.createContext({ document, state: { productDevelopmentTaskFormData: { SKU1: detail } },
  window: { setTimeout: (callback) => { timer = callback; return 1; }, clearTimeout() {} },
  productDevelopmentCloneValue: structuredClone,
  productDevelopmentCleanText: (value, limit = 12000) => String(value ?? '').trim().slice(0, limit),
  escapeHtml: (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
  productDevelopmentHandleOneShotEditorInput: () => false,
  scheduleProductDevelopmentReadonlyDetailCache() {},
});
for (const name of ['pd-foundation', 'pd-prefill', 'pd-pricing-drafts', 'pd-dom', 'pd-task-views', 'pd-dispatcher']) vm.runInContext(fs.readFileSync(path.join(root, 'src/product-development', name + '.module.js'), 'utf8'), context);
context.productDevelopmentProductFieldCollections = (value) => value.fields;
context.productDevelopmentSetProductAttrValue = (value, attrId, languageId, data) => {
  const item = value.productAttrValues.find((item) => item.attr_id === attrId);
  if (item) item.value = data; else value.productAttrValues.push({ attr_id: attrId, language_id: languageId, value: data });
};
// Sanitized numeric fixture from the user HAR, excluding headers, credentials and supplier records.
const raw = [[0.19,1],[0.04,1],[1.08,1],[2,0.05]].map(([price, usage], i) => ({ id:i+1, code:'M'+i, type:2, sale_price:price, usage_value:usage, is_pricing:true }));
detail.bomRows = raw.map(context.productDevelopmentReadonlyBomRow);
const procurementDefinition = { key:'procurementPrice', attrId:152, formGroup:'prefill', type:'number', label:'采购价' };
assert.equal(context.productDevelopmentProcurementFieldValue(detail, 'materialPrice'), '1.41');
assert.equal(context.productDevelopmentPrefillProductFieldValue(detail, procurementDefinition), '1.91');
assert.equal(detail.productAttrValues.find(item=>item.attr_id === 152).value, '1.91');
detail.bomRows.push(context.productDevelopmentReadonlyBomRow({ type:2, id:9, code:'UNCHECKED', sale_price:100, usage_value:1, is_pricing:false }));
detail.bomRows.push(context.productDevelopmentReadonlyBomRow({ type:1, id:10, code:'FINISHED', sale_price:100, usage_value:1 }));
assert.equal(context.productDevelopmentProcurementFieldValue(detail, 'materialPrice'), '1.41', 'Exclude unchecked pricing and finished-product rows');
const scope = document.querySelector('.pfh-detail');
scope.innerHTML = context.productDevelopmentPrefillFieldHtml(procurementDefinition, 'SKU1', '1.91') + context.productDevelopmentPrefillFieldHtml({key:'materialPrice',formGroup:'procurement',type:'number',label:'单价'},'SKU1','1.41');
const priceInput = scope.querySelector('[data-form-key="procurementPrice"]');
priceInput.readOnly = true;
context.productDevelopmentHandleInput({ target: priceInput, type:'input' });
assert.notEqual(detail.productDetailProcurementPriceSource, 'manual');
context.productDevelopmentHandleProtectedField({ target:priceInput, type:'dblclick' });
assert.equal(priceInput.readOnly, false);
priceInput.value = '3'; context.productDevelopmentHandleInput({ target:priceInput, type:'input' });
assert.equal(context.productDevelopmentPrefillProductFieldValue(detail, procurementDefinition), '3', 'Explicit manual price survives ordinary rendering');
context.productDevelopmentHandleProtectedField({ target:priceInput, type:'focusout' });
assert.equal(priceInput.readOnly, true);
const unitInput = scope.querySelector('[data-form-key="materialPrice"]');
unitInput.value = '2.03'; context.productDevelopmentHandleInput({ target:unitInput, type:'input' });
assert.equal(priceInput.value, '2.53', 'Unit price changes update procurement price immediately');
detail.bomRows[3].usage = '0.1';
assert.equal(context.productDevelopmentProcurementFieldValue(detail, 'materialPrice'), '1.51', 'New BOM pricing replaces an old unit price');
assert.equal(context.productDevelopmentPrefillProductFieldValue(detail, procurementDefinition), '2.01');
detail.bomRows[0].price = '';
assert.equal(context.productDevelopmentProcurementFieldValue(detail, 'materialPrice'), '1.51', 'Incomplete data must not produce a partial total');
const options = context.productDevelopmentAttributeOptions({option_list_json:JSON.stringify([{value:42,option_label_list:[{language_id:1,label:'膏霜灌装'}]}])});
detail.prefillOptions = { 131:options };
scope.innerHTML = context.productDevelopmentPrefillFieldHtml({key:'productProductionLine',attrId:131,formGroup:'prefill',control:'select'},'SKU1','膏霜灌装');
const line = scope.querySelector('select'); assert(line);
context.productDevelopmentHandleInput({target:line,type:'change'});
assert.deepEqual(Array.from(detail.productDetailLocalValues['131@1'].value), [42]);
assert.equal(context.productDevelopmentPrefillOptions({key:'processType'},detail).length,3);
assert(context.productDevelopmentPrefillOptions({key:'taxRate'},detail).some(item=>item.label==='13.00%'));
scope.innerHTML = context.productDevelopmentPrefillFieldHtml({key:'supplier',formGroup:'procurement'},'SKU1','JSJ');
const supplier = scope.querySelector('input');
context.fetchPlmJson = async (url) => { assert(url.endsWith('name=JSJ')); return {data:{list:[{company_supplier_name:'JSJ',company_supplier_id:80001166}]},success:true}; };
context.productDevelopmentHandleChange = () => {};
(async () => {
  detail.bomRows[0].price = '0.19';
  detail.productId = '1'; detail.categoryId = '2';
  detail.productInfo = { product_id:1, category_id:2, procurement_price:99, product_procure_infos:[{material_price:99,quantity:1000}] };
  context.productDevelopmentProductDetailMissingFields = () => [];
  context.productDevelopmentProductDetailLanguageConfig = () => [];
  const product = context.productDevelopmentBuildProductDetailPayload(detail, {});
  assert.equal(product.procurement_price, '2.01', 'API save must not restore an old procurement price');
  assert.equal(product.product_procure_infos[0].material_price, 1.51);
  assert.equal(detail.productInfo.product_procure_infos[0].material_price,99,'Payload preparation preserves the source snapshot');
  const available = context.productDevelopmentDomAvailableValues;
  context.productDevelopmentDomAvailableValues = () => [];
  context.productDevelopmentReadBomRows = async (id) => { assert.equal(id,'65024'); return raw.map(context.productDevelopmentReadonlyBomRow); };
  await context.productDevelopmentFillPlmPage2(detail);
  assert.equal(detail.productDetailLocalProcurement.materialPrice,'1.41', 'Page 2 refreshes the current project BOM before filling');
  assert.equal(context.productDevelopmentPrefillProductFieldValue(detail,procurementDefinition),'1.91');
  detail.productDetailProcurementPriceSource = 'manual';
  context.productDevelopmentRememberLocalProductField(detail,{attrId:152},'3.2','3.2','manual');
  await context.productDevelopmentFillPlmPage2(detail);
  assert.equal(context.productDevelopmentPrefillProductFieldValue(detail,procurementDefinition),'3.2','A deliberate procurement price override survives an unchanged BOM refresh');
  context.productDevelopmentReadBomRows = async () => { throw new Error('network'); };
  await assert.rejects(context.productDevelopmentFillPlmPage2(detail), /network/);
  assert.equal(detail.productDetailLocalProcurement.materialPrice,'1.41');
  context.productDevelopmentDomAvailableValues = available;
  context.productDevelopmentSearchSuppliers(supplier); await timer();
  assert.equal(scope.querySelector('datalist option').getAttribute('value'),'JSJ');
  assert.equal(detail.productDevelopmentSupplierOptions[0].value,80001166);
  const previous = scope.querySelector('datalist').innerHTML;
  context.fetchPlmJson = async () => { supplier.pfhSupplierQuery = 'new query'; return {data:{list:[{company_supplier_name:'stale',company_supplier_id:1}]}}; };
  context.productDevelopmentSearchSuppliers(supplier); await timer();
  assert.equal(scope.querySelector('datalist').innerHTML,previous,'Late search results cannot overwrite a newer query');
  console.log('BOM unit price: HAR weighted total, pricing flags, price + 0.5, double-click locking, immediate updates, real dropdown values and live supplier search passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
