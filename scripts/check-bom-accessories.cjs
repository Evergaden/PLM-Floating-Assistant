const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
function extract(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, name);
  const next = source.indexOf('\n  function ', start + 1);
  return source.slice(start, next);
}
const context = {
  compactText: (text) => String(text ?? '').replace(/\s+/g, ' ').trim(),
  getApiMaterialDimensions: (item) => {
    const match = String(item.specification || '').match(/(\d+(?:\.\d+)?)[x*](\d+(?:\.\d+)?)(?:[x*](\d+(?:\.\d+)?))?(cm|mm)/i);
    return match ? match.slice(1, 4).filter(Boolean).map((v) => Number(v) / (match[4] === 'mm' ? 10 : 1)) : null;
  },
  formatApiMaterialDimensions: (nums) => nums.join('x') + 'cm',
  formatExcelDimFromParts: (parts) => parts.every(Boolean) ? parts.join('*') + 'CM' : '',
  formatExcelDim: (nums) => nums ? nums.join('*') + 'CM' : '',
  normalizeExcelUnit: (text) => String(text || '').toUpperCase(),
  isUsefulValue: (value) => Array.isArray(value) ? value.length > 0 : Boolean(value),
  hasProductDetailPackage: () => false,
  mergeApiFieldStates: (...states) => Object.assign({}, ...states),
  mergeMaterialDimensionUnitIssues: () => ({}),
  trimNumber: (value) => String(Number(value.toFixed(4))),
  isVisibleElement: () => true,
  state: { skuEditMode: false },
  isApiBoxCategory: (text) => /纸盒/.test(text),
  isPaperBoxMaterialText: (text) => /纸盒/.test(text),
  isPrintedBagMaterialText: () => false,
  isPrintMaterialRow: (text) => /标签/.test(text),
  getApiPackageDisplayName: () => '纸盒',
  getApiPrintDisplayName: () => '标签',
  getApiTubeMaterialSource: () => '',
  extractApiTubeFields: () => ({}),
  isTubePrintRow: () => false,
  getApiPrintMaterialDimensions: (item) => context.getApiMaterialDimensions(item, 2, true),
  extractNetContentFromMaterial: () => '100ml',
  escapeHtml: (text) => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'),
};
vm.createContext(context);
for (const name of ['normalizeAccessories', 'getApiMaterialCode', 'getApiMaterialSourceText', 'getApiMaterialUnitIssue', 'getApiMaterialDimensions', 'detectMaterialDimensionUnitIssue', 'normalizeMaterialDimensionUnitIssue', 'normalizeMaterialDimensionUnitIssues', 'extractDimensionString', 'normalizeDimensionText', 'normalizeDimensionParts', 'parseDimension', 'firstNumber', 'formatApiMaterialDimensions', 'extractBomAccessory', 'extractDomAccessories', 'mergeApiPackagingData', 'buildExcelProductSizeWithAccessories', 'buildExcelSpecificationWithAccessories', 'materialSummaryCardHtml', 'accessoryCardsHtml', 'setCell']) vm.runInContext(extract(name), context);
const sponge = context.extractBomAccessory({ name: '黄色圆形海绵', code: 'JU-C01-0002-01', category_name: '成品 - 家居百货 - 厨房清洁', specification: '黄色圆形海绵,1个,直径7cmx高2cm' });
for (const name of ['getApiMaterialItems', 'hasApiMaterialItemsPayload', 'getApiFieldState', 'isApiBoxMaterial', 'extractApiMaterialPackaging']) vm.runInContext(extract(name), context);
const api = context.extractApiMaterialPackaging({ data: { pms: [
  { name: '黄色圆形海绵', code: sponge.code, category_name: '成品 - 厨房清洁', specification: sponge.specification },
  { name: '大灯焕新剂纸盒', code: 'MTL00083040', category_name: '包材 - 纸盒', specification: '100ml瓶+1海绵/盒,4.6x4x17.5cm' },
  { name: '大灯焕新剂标签', code: 'MTL00083042', category_name: '包材 - 标签', specification: '10x8cm' },
] } });
assert.equal(api.accessories.length, 1);
assert.equal(api.packageCode, 'MTL00083040');
assert.equal(api.printCode, 'MTL00083042');
assert.equal(context.extractApiMaterialPackaging({ data: { pms: [] } }).apiFieldStates.accessories, 'empty');
assert.equal(context.extractApiMaterialPackaging({}).apiFieldStates.accessories, undefined);
assert.equal(sponge.sizeText, '直径7cm × 高2cm');
assert.equal(sponge.quantity, 1);
assert.equal(sponge.code, 'JU-C01-0002-01');
const brush = context.extractBomAccessory({ name: '刷子', specification: '3x14cm', usage_value: 2, quantity: 1000 });
assert.equal(brush.quantity, 2, 'use BOM usage, not procurement quantity');
assert.equal(brush.sizeText, '3x14cm');
assert.equal(context.extractBomAccessory({ name: '专用连接件', category_name: '配件类', specification: '30x20mm' }).sizeText, '3x2cm');
assert.equal(context.extractBomAccessory({ name: '刮板', specification: '1个,长140mm,宽30mm' }).sizeText, '长14cm × 宽3cm');
for (const name of ['纸盒', '标签', '100ml瓶', '瓶盖', '产品使用说明书']) assert.equal(context.extractBomAccessory({ name, category_name: '包材', specification: '100ml瓶+1海绵/盒,4.6x4x17.5cm' }), null);
assert.equal(context.extractBomAccessory({ name: '大灯焕新剂', category_name: '成品', specification: '100ml' }), null);
assert.equal(context.normalizeAccessories([sponge, sponge]).length, 1);
assert.equal(context.normalizeAccessories(undefined).length, 0);
assert.equal(context.mergeApiPackagingData({ accessories: [sponge] }, { accessories: [], apiFieldStates: { accessories: 'empty' } }).accessories.length, 0);
assert.equal(context.mergeApiPackagingData({ accessories: [sponge] }, {}).accessories.length, 1, 'failed request retains cached accessories');
const cells = ['', 'JU-C01-0002-01', 'hsyx-黄色圆形海绵', '黄色圆形海绵', '成品 - 厨房清洁', '黄色圆形海绵,1个,直径7cmx高2cm'];
const dom = { querySelectorAll: () => [{ querySelectorAll: () => cells.map((textContent) => ({ textContent })) }] };
assert.equal(context.extractDomAccessories(dom)[0].sizeText, sponge.sizeText);
const data = { name: '大灯焕新剂', netContent: '100ml', productNums: [4.4, 3.8, 17.3], accessories: [sponge, brush] };
const size = context.buildExcelProductSizeWithAccessories(data);
assert.match(size, /大灯焕新剂：\n4.4\*3.8\*17.3CM/);
assert.match(size, /黄色圆形海绵：\n直径7cm × 高2cm/);
assert.match(context.buildExcelSpecificationWithAccessories(data), /大灯焕新剂：100ML×1，\n黄色圆形海绵×1，\n刷子×2/);
assert.equal(context.buildExcelSpecificationWithAccessories({ netContent: '100ml' }), '100ML');
const html = context.materialSummaryCardHtml('package', '纸盒', '4.6x4x17.5cm', 'MTL00083040');
assert.match(html, /data-material-copy-key="packageSizeText"/);
assert.match(html, /data-material-copy-key="packageCode"/);
assert.ok(!html.includes('纸盒编码'));
assert.match(context.accessoryCardsHtml(data), /data-copy-value="JU-C01-0002-01"/);
const cell = {}, row = { height: 96 };
context.setCell({ getCell: () => cell, getRow: () => row }, 'I4', size);
assert.equal(cell.alignment.wrapText, true);
assert.ok(row.height >= size.split('\n').length * 18 + 20);
console.log('BOM accessories: names, quantities, cm/mm dimensions, exclusions, cache clearing, separate copy targets and Excel text passed');
