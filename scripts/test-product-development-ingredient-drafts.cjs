const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'src/product-development', name + '.module.js'), 'utf8');
const foundation = read('pd-foundation');
const copywriting = read('pd-copywriting-run');
const keyMatch = foundation.match(/const PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY = ('[^']+');/);
const defaultsMatch = foundation.match(/const PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT = Object\.freeze\((\{[\s\S]*?\})\);/);
assert(keyMatch && defaultsMatch);
const storage = new Map();
const clone = (value) => JSON.parse(JSON.stringify(value));
let selected = 'SKU00064102';
let writes = 0;
const context = vm.createContext({
  state: {},
  getProductDevelopmentCurrentSku: () => selected,
  readProductDevelopmentStorage: (key, fallback) => storage.has(key) ? clone(storage.get(key)) : fallback,
  writeProductDevelopmentStorage: (key, value) => { storage.set(key, clone(value)); writes += 1; },
});
vm.runInContext('const PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY = ' + keyMatch[1] + '; const PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT = ' + defaultsMatch[1] + ';', context);
function extract(source, name) {
  const start = source.indexOf('  function ' + name + '(');
  assert(start >= 0, name);
  const next = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 3 + next);
}
for (const name of ['productDevelopmentOneShotInputValue', 'productDevelopmentOneShotSkuDraftKey', 'productDevelopmentOneShotLoadDraft', 'saveProductDevelopmentOneShotDraft']) vm.runInContext(extract(foundation, name), context);
vm.runInContext(extract(copywriting, 'productDevelopmentOneShotSyncDraftSku'), context);
const legacyKey = vm.runInContext('PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY', context);
const fields = ['regularIngredientsEn', 'regularIngredientsInactiveEn', 'regularIngredientsCn', 'regularIngredientsInactiveCn', 'otherIngredientsEn', 'otherIngredientsCn'];
const ingredients = Object.fromEntries(fields.map((key, index) => [key, 'ingredient ' + index + '\nsecond line']));
// Existing last-used drafts remain readable and migrate without losing text.
storage.set(legacyKey, { sku: selected, ...ingredients, regularNdcKind: 'ndc' });
context.state.productDevelopmentOneShotInput = context.productDevelopmentOneShotLoadDraft();
assert.deepEqual(fields.map((key) => context.productDevelopmentOneShotLoadDraft(selected)[key]), Object.values(ingredients));
assert(storage.has(context.productDevelopmentOneShotSkuDraftKey(selected)));

// Switching away archives A and starts B without A's ingredients.
selected = 'SKU00064103';
context.productDevelopmentOneShotSyncDraftSku();
assert.deepEqual(fields.map((key) => context.state.productDevelopmentOneShotInput[key]), fields.map(() => ''));
context.state.productDevelopmentOneShotInput.regularIngredientsEn = 'B ingredients';
context.state.productDevelopmentOneShotInput.regularIngredientsCn = 'B 中文成分';
context.saveProductDevelopmentOneShotDraft(context.state.productDevelopmentOneShotInput);
selected = 'SKU00064102';
context.productDevelopmentOneShotSyncDraftSku();
assert.deepEqual(fields.map((key) => context.state.productDevelopmentOneShotInput[key]), Object.values(ingredients));

// Temporary missing selection / rerender must not erase or reassign A.
selected = '';
const before = clone(context.state.productDevelopmentOneShotInput);
const previousWrites = writes;
context.productDevelopmentOneShotSyncDraftSku();
assert.deepEqual(clone(context.state.productDevelopmentOneShotInput), before);
assert.equal(writes, previousWrites);

// Deliberate clearing is persisted, not replaced by older generated content.
selected = 'SKU00064102';
context.state.productDevelopmentOneShotInput.regularIngredientsEn = '';
context.saveProductDevelopmentOneShotDraft(context.state.productDevelopmentOneShotInput);
selected = 'SKU00064103';
context.productDevelopmentOneShotSyncDraftSku();
assert.equal(context.state.productDevelopmentOneShotInput.regularIngredientsEn, 'B ingredients');
assert.equal(context.productDevelopmentOneShotLoadDraft(' sku00064102 ').regularIngredientsEn, '');
assert.equal(context.productDevelopmentOneShotLoadDraft('SKU00064102').regularIngredientsCn, ingredients.regularIngredientsCn);

// A page reload while B is the last-used draft still restores A by SKU.
context.state.productDevelopmentOneShotInput = context.productDevelopmentOneShotLoadDraft();
selected = 'SKU00064102';
context.productDevelopmentOneShotSyncDraftSku();
assert.equal(context.state.productDevelopmentOneShotInput.regularIngredientsEn, '');
assert.equal(context.state.productDevelopmentOneShotInput.regularIngredientsCn, ingredients.regularIngredientsCn);
assert.equal(context.productDevelopmentOneShotLoadDraft('SKU00064103').regularIngredientsEn, 'B ingredients');
console.log('Per-SKU ingredient draft persistence regression passed');
