const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/product-development/pd-task-sync.module.js'), 'utf8');
const start = source.indexOf('  function productDevelopmentTaskSeedData(');
const end = source.indexOf('\n  }', start);
if (start < 0 || end < 0) throw new Error('productDevelopmentTaskSeedData was not found');

const context = vm.createContext({
  state: { productDevelopmentTaskDetailData: Object.create(null), data: null },
  loadData: () => null,
  normalizeData: (value) => value,
  getProductDevelopmentTaskMeta: () => ({ brand: '本地品牌', productNameCn: '本地产品名', productNameEn: 'Local Product Name' }),
});
vm.runInContext(source.slice(start, end + 4), context);

const result = context.productDevelopmentTaskSeedData({ sku: 'SKU0001', name: '' });
assert.equal(result.name, '本地产品名');
assert.equal(result.productNameCn, '本地产品名');
assert.equal(result.productNameEn, 'Local Product Name');
assert.equal(result.englishName, 'Local Product Name');
assert.equal(result.brand, '本地品牌');

console.log('Product-development task seed: local product names are preserved for copywriting generation');
