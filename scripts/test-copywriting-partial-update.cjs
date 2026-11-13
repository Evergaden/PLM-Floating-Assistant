const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const clone = (value) => JSON.parse(JSON.stringify(value));
const worker = vm.createContext({ Request, Response, URL, console });
vm.runInContext(read('cloudflare/plm-cloud-backup/src/index.js').replace(/^import .+;\r?$/gm, '').replace('export default {', 'const workerExport = {'), worker);
worker.requireDevelopmentFeature = async () => null; // Authorized-user fixture; access denial is covered by test-development-access.cjs.
function extract(file, name) {
  const text = read(file);
  const start = text.indexOf('  function ' + name + '(');
  const next = text.slice(start + 3).search(/\n  (?:async )?function /);
  assert(start >= 0, name);
  return text.slice(start, next < 0 ? undefined : start + 3 + next);
}
const content = {
  efficacy: [{ en: 'AQUA keeps skin comfortable.', cn: '肌肤保持舒适。' }],
  advantages: [{ en: 'Original advantage.', cn: '原优势。' }],
  sellingPoints: [{ en: 'Original selling point.', cn: '原卖点。', titleEn: 'Title', titleCn: '标题' }],
  directions: [{ en: 'Apply gently.', cn: '轻轻涂抹。' }],
  ingredientFunctions: [{ ingredientEn: 'AQUA', ingredientCn: '水', en: 'Original function.', cn: '原成分功能。' }],
  productNameTranslations: Array(24).fill('Old Cream'),
};
const regularIngredients = { activeEn: ['AQUA'], inactiveEn: [], activeCn: ['水'], inactiveCn: [], cn: '水' };
let meta = { productNameEn: 'Old Cream', productNameCn: '面霜', brand: 'Brand' };
const makeResult = () => ({ id: 'COPY', sku: 'SKU1', snapshot: { sku: 'SKU1', name: '面霜', englishName: 'Old Cream', brand: 'Brand', copywritingCategory: 'regular', regularIngredients: clone(regularIngredients) }, content: clone(content), blob: 'old-docx' });
const state = { productDevelopmentOneShotInput: { sku: 'SKU1', regularIngredientsEn: 'AQUA', regularIngredientsCn: '水' } };
let calls = [];
let saved;
let currentSku = 'SKU1';
let modelBehavior = null;
const ctx = vm.createContext({
  Blob, state,
  getProductDevelopmentCurrentSku: () => currentSku,
  getProductDevelopmentTaskBySku: (sku) => ({ sku }),
  getProductDevelopmentTaskMeta: () => meta,
  productDevelopmentCleanText: (text, max = 4000) => String(text || '').trim().slice(0, max),
  productDevelopmentNormalizedClaimText: (text) => String(text || '').trim().toLowerCase(),
  productDevelopmentRegularHeroIngredients: (pairs) => pairs.slice(0, 4),
  productDevelopmentCopywritingFileName: (snapshot) => snapshot.englishName + '.docx',
  saveProductDevelopmentCopywritingCache: (value) => { saved = clone(value); },
  withCopywritingTimeout: (promise) => promise,
  cloudRequest: async (url, options) => {
    calls.push(clone(options.body));
    if (modelBehavior) return modelBehavior();
    return { patch: { productNameTranslations: Array(24).fill(options.body.englishName), ingredientFunctions: options.body.ingredients.map((pair) => ({ ingredientEn: pair.en, ingredientCn: pair.cn, en: 'New ingredient function.', cn: '新增成分功能。' })), sellingPoints: [{ en: 'DO NOT USE' }] } };
  },
});
vm.runInContext(extract('src/product-development/pd-copywriting-run.module.js', 'productDevelopmentParseRegularIngredientText'), ctx);
vm.runInContext(read('src/product-development/pd-docx-builders.module.js'), ctx);
const protectedSections = (result) => clone(['efficacy', 'advantages', 'sellingPoints', 'directions'].map((key) => result.content[key]));
const request = (body, key = 'test') => new Request('https://test/ai-image/product-development-copywriting', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key }, body: JSON.stringify(body) });
(async () => {
  let result = makeResult();
  const protectedOriginal = protectedSections(result);
  meta.productNameEn = 'New Cream';
  await ctx.productDevelopmentUpdateCopywritingForDownload(result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].mode, 'partial-update');
  assert.deepEqual(calls[0].ingredients, []);
  assert.equal(result.snapshot.englishName, 'New Cream');
  assert.equal(result.fileName, 'New Cream.docx');
  assert.equal(result.blob, null);
  assert.deepEqual(protectedSections(result), protectedOriginal);
  assert.deepEqual(clone(result.content.ingredientFunctions), content.ingredientFunctions);
  assert.equal(saved.snapshot.englishName, 'New Cream');
  await ctx.productDevelopmentUpdateCopywritingForDownload(result);
  assert.equal(calls.length, 1, 'Unchanged repeated downloads make no AI request');

  state.productDevelopmentOneShotInput.regularIngredientsCn = '纯化水';
  await ctx.productDevelopmentUpdateCopywritingForDownload(result);
  assert.equal(calls.length, 1, 'Chinese ingredient correction is local');
  assert.equal(result.content.ingredientFunctions[0].ingredientCn, '纯化水');
  assert.equal(result.content.ingredientFunctions[0].en, content.ingredientFunctions[0].en);
  state.productDevelopmentOneShotInput.regularIngredientsEn = 'GLYCERIN';
  state.productDevelopmentOneShotInput.regularIngredientsCn = '甘油';
  await ctx.productDevelopmentUpdateCopywritingForDownload(result);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].translateName, false);
  assert.deepEqual(calls[1].ingredients, [{ en: 'GLYCERIN', cn: '甘油' }]);
  assert.equal(result.content.ingredientFunctions.length, 1);
  assert.match(result.partialUpdateWarning, /AQUA/);
  assert.deepEqual(protectedSections(result), protectedOriginal);

  const before = clone(result);
  meta.productNameEn = 'Failed Cream';
  modelBehavior = () => { throw new Error('offline'); };
  await assert.rejects(ctx.productDevelopmentUpdateCopywritingForDownload(result), /offline/);
  assert.deepEqual(clone(result), before, 'Failed patch cannot mutate saved content or snapshot');
  modelBehavior = () => ({ patch: { productNameTranslations: ['incomplete'] } });
  await assert.rejects(ctx.productDevelopmentUpdateCopywritingForDownload(result), /24/);
  assert.deepEqual(clone(result), before);
  modelBehavior = () => { meta.productNameEn = 'Edited While Waiting'; return { patch: { productNameTranslations: Array(24).fill('Failed Cream') } }; };
  await assert.rejects(ctx.productDevelopmentUpdateCopywritingForDownload(result), /更新期间/);
  assert.deepEqual(clone(result), before);
  modelBehavior = null;
  meta.productNameEn = 'New Cream';
  state.productDevelopmentOneShotInput = { sku: 'OTHER', regularIngredientsEn: 'WRONG' };
  assert.equal(ctx.productDevelopmentCopywritingUpdatePlan(result).changed, false, 'Ignore another SKU draft');
  result.fromHistory = true; currentSku = 'OTHER';
  assert.equal(ctx.productDevelopmentCopywritingUpdatePlan(result).changed, false, 'History downloads never borrow current SKU data');
  currentSku = 'SKU1';
  result = makeResult();
  state.productDevelopmentOneShotInput = { sku: 'SKU1', regularIngredientsEn: '', regularIngredientsCn: '' };
  state.productDevelopmentCopywritingDirtySku = 'SKU1';
  assert.throws(() => ctx.productDevelopmentCopywritingUpdatePlan(result), /成分不能为空/);
  state.productDevelopmentCopywritingDirtySku = '';

  state.productDevelopmentCopywriting = result;
  let writes = 0;
  ctx.chooseCopywritingSaveTarget = async () => null;
  ctx.writeImageBlobToFileHandle = async () => { writes++; };
  const previousCalls = calls.length;
  await ctx.downloadProductDevelopmentCopywritingResult();
  assert.equal(calls.length, previousCalls, 'Cancel save dialog before any AI work');
  assert.equal(writes, 0);
  state.productDevelopmentOneShotInput = { sku: 'SKU1', regularIngredientsEn: 'AQUA', regularIngredientsCn: '水' };
  ctx.chooseCopywritingSaveTarget = async (name) => { assert.equal(name, 'New Cream.docx'); return {}; };
  ctx.renderShell = () => {};
  ctx.resolveProductDevelopmentCachedCopywritingTemplate = () => ({ label: 'template' });
  ctx.loadProductDevelopmentCopywritingTemplateSource = async () => 'source';
  ctx.buildProductDevelopmentDocx = async (copy, source, snapshot) => {
    assert.equal(snapshot.englishName, 'New Cream');
    assert.deepEqual(protectedSections({ content: copy }), protectedOriginal);
    return new Blob(['updated']);
  };
  ctx.productDevelopmentLog = () => {};
  ctx.productDevelopmentTraceDocxBlob = async (blob) => { assert.equal(await blob.text(), 'updated'); return new Blob(['watermarked']); };
  ctx.writeImageBlobToFileHandle = async (_, blob) => { assert.equal(await blob.text(), 'watermarked'); writes++; };
  ctx.showToast = () => {};
  await ctx.downloadProductDevelopmentCopywritingResult();
  assert.equal(writes, 1, 'Export rebuilt document through watermark and selected handle');

  result = makeResult();
  result.id = 'FACTS-copy';
  result.snapshot.copywritingCategory = '';
  delete result.snapshot.regularIngredients;
  result.snapshot.ingredients = [{ en: 'AQUA', cn: '水' }];
  result.snapshot.ingredientTable = { otherIngredientsEn: 'Water', otherIngredientsCn: '水' };
  state.productDevelopmentOneShotResult = { id: 'FACTS', sku: 'SKU1', content: clone(content), ingredientTable: { otherIngredientsEn: 'Glycerin', otherIngredientsCn: '甘油' } };
  ctx.productDevelopmentOneShotConfirmedIngredientTable = (oneShot) => oneShot.ingredientTable;
  ctx.productDevelopmentOneShotConfirmedIngredients = () => [{ en: 'AQUA', cn: '纯化水' }, { en: 'GLYCERIN', cn: '甘油' }];
  const callsBeforeFacts = calls.length;
  await ctx.productDevelopmentUpdateCopywritingForDownload(result);
  assert.equal(calls.length, callsBeforeFacts + 1);
  assert.deepEqual(calls.at(-1).ingredients, [{ en: 'GLYCERIN', cn: '甘油' }]);
  assert.equal(result.snapshot.ingredientTable.otherIngredientsEn, 'Glycerin');
  assert.equal(result.content.ingredientFunctions[0].en, content.ingredientFunctions[0].en);
  assert.deepEqual(protectedSections(result), protectedOriginal);
  assert.deepEqual(clone(state.productDevelopmentOneShotResult.content), clone(result.content));
  await ctx.productDevelopmentUpdateCopywritingForDownload(result);
  assert.equal(calls.length, callsBeforeFacts + 1, 'Repeated confirmed-table export reuses updated content');

  let validator;
  worker.callPreferredAiText = async (_, options, validate) => {
    validator = validate;
    assert(options.system.includes('禁止生成功效'));
    const input = JSON.parse(options.prompt);
    const candidate = { productNameTranslations: Array(24).fill(input.englishName), ingredientFunctions: (input.ingredients || []).map((pair) => ({ ingredientEn: pair.en, ingredientCn: pair.cn, en: 'Helps keep skin feeling soft and comfortable with gentle moisture support.', cn: '帮助肌肤保持柔软舒适。' })), sellingPoints: [{ en: 'MALICIOUS REWRITE' }] };
    return { value: validate({ text: JSON.stringify(candidate) }) };
  };
  let response = await worker.handleProductDevelopmentCopywriting(request({ mode: 'partial-update', sku: 'SKU1', englishName: 'New Cream', translateName: true, ingredients: [{ en: 'GLYCERIN', cn: '甘油' }], copywritingCategory: 'regular' }), { API_KEY: 'test' });
  let body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.patch.productNameTranslations.length, 24);
  assert.equal(body.patch.ingredientFunctions[0].ingredientEn, 'GLYCERIN');
  assert.equal(body.patch.sellingPoints, undefined);
  assert.throws(() => validator({ text: JSON.stringify({ productNameTranslations: ['bad'] }) }), /24/);
  assert.throws(() => validator({ text: JSON.stringify({ productNameTranslations: Array(24).fill('Wrong'), ingredientFunctions: [] }) }), /English name/);
  const bad = { productNameTranslations: Array(24).fill('New Cream'), ingredientFunctions: [{ ingredientEn: 'GLYCERIN', en: 'Use twice a day.', cn: '每日两次。' }] };
  assert.throws(() => validator({ text: JSON.stringify(bad) }), /restricted/);
  response = await worker.handleProductDevelopmentCopywriting(request({ mode: 'partial-update', sku: 'SKU1' }), { API_KEY: 'test' });
  assert.equal(response.status, 400);
  response = await worker.handleProductDevelopmentCopywriting(request({ mode: 'partial-update', sku: 'SKU1', translateName: true, englishName: 'Cream' }, 'wrong'), { API_KEY: 'test' });
  assert.equal(response.status, 401);
  console.log('Partial copywriting update: protected sections, local corrections, scoped AI, atomic failures, stale drafts, save cancellation, rebuilt/watermarked export and Worker auth/validation passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
