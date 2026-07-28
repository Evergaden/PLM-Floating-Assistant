const assert = require('assert');
const { matchProductByFilename } = require('../file-match');

const products = [
  {
    sku: 'SKU00045440',
    packageCode: 'MTL00057740',
    printCode: 'LBL00057740',
    name: 'AMZ焕彩亮肤面部精油',
  },
  {
    sku: 'SKU00045441',
    packageCode: 'MTL00057741',
    name: '另一个产品',
  },
];

const matched = matchProductByFilename(
  '纸盒（3.2x3.2x10cm）MTL00057740 AMZ焕彩亮肤面部精油.psd',
  products,
);

assert(matched);
assert.strictEqual(matched.product.sku, 'SKU00045440');
assert.strictEqual(matched.raw, 'MTL00057740');
assert.strictEqual(matched.key, 'packageCode');
assert.strictEqual(matchProductByFilename('纸盒 SKU00045441.psd', products).product.sku, 'SKU00045441');
console.log('filename matcher: ok');
