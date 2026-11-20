const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'src/product-development', name + '.module.js'), 'utf8');
function extract(source, name) {
  const match = new RegExp('  (?:async )?function ' + name + '\\(').exec(source);
  assert(match, name);
  const next = source.slice(match.index + 3).search(/\n  (?:async )?function /);
  return source.slice(match.index, next < 0 ? undefined : match.index + 3 + next);
}
const foundation = read('pd-foundation');
const prefill = read('pd-prefill');
const dom = read('pd-dom');
const definitions = [{ key: 'procurementPrice', attrId: 152 }, { key: 'minimumOrderQuantity', attrId: 2764 }];
const context = vm.createContext({
  PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS: definitions,
  productDevelopmentCloneValue: (value) => JSON.parse(JSON.stringify(value)),
  productDevelopmentCleanText: (value, max = 4000) => String(value ?? '').trim().slice(0, max),
  productDevelopmentGuessProductLine: (value) => /精华|serum/i.test(value) ? 'regular' : 'food',
  productDevelopmentReworkLookupPacking: () => ({ quantity: 24, source: 'BOM', unitDimensions: [1, 2, 3] }),
  productDevelopmentSyncReworkOuterDimensions() {},
  productDevelopmentProductFieldCollections: (detail) => detail.fields || [],
  productDevelopmentRememberLocalProductField: (detail, field, value, displayValue, source) => {
    detail.productDetailLocalValues ||= {};
    detail.productDetailLocalValues[field.attrId + '@1'] = { value, displayValue, source };
  },
  productDevelopmentMarkProductDetailDirty: (detail) => { detail.dirty = true; },
});
const defaults = foundation.slice(foundation.indexOf('  const PRODUCT_DEVELOPMENT_REWORK_DEFAULT_PROCUREMENT = '), foundation.indexOf('  const PRODUCT_DEVELOPMENT_PRICING_DRAFT_KEY = '));
vm.runInContext(defaults, context);
for (const name of ['productDevelopmentIsSupplement', 'productDevelopmentReferenceLabel']) vm.runInContext(extract(foundation, name), context);
for (const name of ['productDevelopmentPrefillHasValue', 'productDevelopmentPrefillText', 'productDevelopmentProcurementRow', 'productDevelopmentProcurementFieldValue', 'productDevelopmentReworkLookupValuePresent', 'productDevelopmentClearReworkLocalProductFields', 'productDevelopmentApplyReworkProductLookup']) vm.runInContext(extract(prefill, name), context);

assert.equal(context.productDevelopmentReferenceLabel({ categoryName: '成品 / 美容个护 / 身体护理' }), '对标');
assert.equal(context.productDevelopmentReferenceLabel({}, { plmCategory: '食品酒水 / 滋补保健' }), '返工');
assert.equal(context.productDevelopmentReferenceLabel({ name: '身体滚珠精华液' }), '对标');
assert.equal(context.productDevelopmentReferenceLabel({ humanSupplement: true }), '返工');
assert.equal(context.productDevelopmentReferenceLabel({ humanSupplement: false }), '对标');
assert.equal(context.productDevelopmentReferenceLabel({ categoryName: '食品酒水 / 零食 / 饼干' }), '对标');
assert.equal(context.productDevelopmentReferenceLabel({ categoryName: '成品' }, { plmCategory: '美容个护' }), '对标', 'Generic categories cannot mask a concrete task category');
assert.equal(context.productDevelopmentReferenceLabel({ categoryName: '健康保健食品', productDetailLocalPage1: { categoryPath: '美容个护' } }), '对标', 'Edited category is authoritative');
assert.equal(context.productDevelopmentReferenceLabel({}), '返工', 'Unclassified legacy tasks retain their workflow');

const detail = { categoryName: '美容个护', productInfo: { product_procure_infos: [{ quantity: 8000 }] } };
assert.equal(context.productDevelopmentProcurementFieldValue(detail, 'quantity'), '1000', 'Source purchase quantity is never used as the default');
const lookup = { code: 'SKU123', procurementPrice: 2.02, purchaseQuantity: 8000 };
context.productDevelopmentApplyReworkProductLookup(detail, lookup);
assert.equal(detail.productDetailLocalProcurement.quantity, '1000');
assert.equal(detail.productDetailLocalValues['152@1'].source, '对标编码 API');
detail.productDetailLocalProcurement.quantity = '2300';
detail.productDetailProcurementQuantitySource = 'manual';
context.productDevelopmentApplyReworkProductLookup(detail, lookup);
assert.equal(detail.productDetailLocalProcurement.quantity, '2300', 'Repeated lookups preserve user purchase quantity');
detail.productDetailLocalProcurement.quantity = '100';
context.productDevelopmentApplyReworkProductLookup(detail, lookup);
assert.equal(detail.productDetailLocalProcurement.quantity, '100', 'An explicitly entered 100 remains valid');
detail.productDetailProcurementQuantitySource = 'default';
assert.equal(context.productDevelopmentProcurementFieldValue(detail, 'quantity'), '1000', 'Legacy generated 100 migrates to the new default');
const supplement = { categoryName: '食品酒水 / 滋补保健' };
context.productDevelopmentApplyReworkProductLookup(supplement, lookup);
assert.equal(supplement.productDetailLocalValues['152@1'].source, '返工编码 API');

const categoryContext = vm.createContext({
  productDevelopmentCategoryNames: () => ['目标类目'],
  productDevelopmentCleanText: (value) => String(value || '').trim(),
  productDevelopmentReadonlyList: (payload) => payload && payload.data && payload.data.list || [],
  setTimeout,
  fetchPlmJson: async (url) => {
    const parentId = Number(new URLSearchParams(url.split('?')[1]).get('parent_id'));
    categoryContextState.active += 1;
    categoryContextState.maxActive = Math.max(categoryContextState.maxActive, categoryContextState.active);
    await new Promise((resolve) => setTimeout(resolve, 8));
    categoryContextState.active -= 1;
    const list = parentId === 0
      ? Array.from({ length: 6 }, (_, index) => ({ id: index + 1, name: '一级' + index, exists_child: 1 }))
      : parentId === 5 ? [{ id: 105, name: '目标类目' }] : [];
    return { data: { list } };
  },
});
const categoryContextState = { active: 0, maxActive: 0 };
vm.runInContext(extract(dom, 'productDevelopmentFindCategoryIdByName'), categoryContext);
categoryContext.productDevelopmentFindCategoryIdByName({}, {}, {}).then((id) => {
  assert.equal(id, '105', 'Category lookup still finds the matching leaf');
  assert.equal(categoryContextState.maxActive, 4, 'Category lookup resolves branches with bounded parallel requests');
  console.log('Product development reference labels, procurement default and parallel category lookup passed');
}).catch((error) => { console.error(error); process.exitCode = 1; });
