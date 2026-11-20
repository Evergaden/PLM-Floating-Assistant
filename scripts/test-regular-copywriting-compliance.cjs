const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('cloudflare/plm-cloud-backup/src/index.js');
const worker = vm.createContext({ Request, Response, URL, console });
vm.runInContext(source.replace(/^import .+;\r?$/gm, '').replace('export default {', 'const workerExport = {'), worker);
worker.requireDevelopmentFeature = async () => null; // Authorized-user fixture; access denial is covered by test-development-access.cjs.
const foundation = read('src/product-development/pd-foundation.module.js');
const frontend = vm.createContext({ formatErrorMessage: (error) => error.message });
vm.runInContext(foundation.slice(foundation.indexOf('  const PRODUCT_DEVELOPMENT_COPYWRITING_RESTRICTION_RULES'), foundation.indexOf('  const PRODUCT_DEVELOPMENT_REVIEW_RULE_VERSION')), frontend);
function loadFunction(file, name) {
  const text = read(file);
  const start = text.indexOf('  function ' + name + '(');
  const end = text.indexOf('\n  }', start);
  vm.runInContext(text.slice(start, end + 4), frontend);
}
loadFunction('src/product-development/pd-task-views.module.js', 'productDevelopmentFindCopywritingRestriction');
loadFunction('src/product-development/pd-review-copywriting.module.js', 'productDevelopmentFriendlyCopywritingError');
const options = { copywritingCategory: 'regular' };
for (const runtime of [worker, frontend]) {
  assert.equal(runtime.productDevelopmentFindCopywritingRestriction('Suitable for daily use.', options), null);
  assert.equal(runtime.productDevelopmentFindCopywritingRestriction('Designed for extended use.', options), null);
  assert.equal(runtime.productDevelopmentFindCopywritingRestriction('Suitable for daily use.').code, 'usage', 'Food rules stay unchanged');
  for (const text of ['Use twice a day.', 'Take one capsule.', 'Apply a dose.', '每日两次', '每次两毫升']) assert.equal(runtime.productDevelopmentFindCopywritingRestriction(text, options).code, 'usage');
  assert.equal(runtime.productDevelopmentFindCopywritingRestriction('Gluten-free formula.', options).code, 'dietary-attribute');
  assert.equal(runtime.productDevelopmentFindCopywritingRestriction('Strict quality control.', options).code, 'quality-process');
}
const pair = { en: 'Suitable for daily use.', cn: '适合日常使用。' };
const sections = {
  efficacy: Array.from({ length: 4 }, () => ({ ...pair })),
  advantages: Array.from({ length: 4 }, () => ({ ...pair })),
  sellingPoints: Array.from({ length: 15 }, (_, index) => ({ ...pair, titleEn: index < 4 ? 'Simple Care Routine' : '', titleCn: index < 4 ? '日常护理' : '' })),
  ingredientFunctions: [{ ...pair, ingredientEn: 'MAGNESIUM CHLORIDE', ingredientCn: '氯化镁' }],
  directions: [{ en: 'Apply the product to the skin.', cn: '将本品涂抹于肌肤。' }],
};
const ingredients = [{ en: 'MAGNESIUM CHLORIDE', cn: '氯化镁' }];
assert.equal(worker.normalizeProductDevelopmentCopywritingCandidate({ sections }, ingredients, '', options).sellingPoints.length, 15);
for (const sentence of ['爱护动物人士寻求纯净选择，这款植物基油符合这些理念。', '消费者关注道德标准，这款配方开发过程中未进行动物实验。', 'Animal lovers seek an ethical choice.', 'The formula is not tested on animals.']) {
  const offTopic = structuredClone(sections);
  offTopic.sellingPoints[14] = { en: 'Suitable for daily use.', cn: sentence };
  assert.throws(() => worker.normalizeProductDevelopmentCopywritingCandidate({ sections: offTopic }, ingredients, '', options), /off-topic ethics/, sentence);
}
assert.throws(() => worker.normalizeProductDevelopmentCopywritingCandidate({ sections }, ingredients, ''), /dosage/);
const bad = structuredClone(sections);
bad.advantages[0] = { en: 'Use twice a day.', cn: '每日两次。' };
const repaired = worker.productDevelopmentLocalComplianceFallback(JSON.stringify({ sections: bad }), ingredients, '', options);
assert(repaired);
assert(!repaired.advantages[0].cn.includes('营养'), 'Regular repair must not add supplement positioning');
assert.match(frontend.productDevelopmentFriendlyCopywritingError(new Error('copywriting B item 2 contains unsupported manufacturing, quality or standards claim')), /B 第 2 条含无依据的生产或质量背书/);
// Exercise the actual handler with a model stub to verify classification reaches prompts and validation.
worker.callPreferredAiText = async (_, config, validate) => {
  assert.equal(JSON.parse(config.prompt.split('\n')[0]).copywritingCategory, 'regular');
  assert(config.system.includes('当前为常规非食品产品'));
  assert(!config.system.includes('你是美国电商宠物/营养产品的双语包装文案草稿助手'));
  assert(config.system.includes('依据当前产品类型、用途和资料写作'));
  assert(config.system.includes('围绕产品本身发挥'));
  assert(config.system.includes('历史通过稿总结的用法写作经验'));
  assert(config.system.includes('不能作为该 SKU 的事实证据'));
  assert(config.system.includes('没有明确用法时仍需根据产品类型写基础操作'));
  const missing = structuredClone(sections);
  missing.directions = [];
  assert.throws(() => validate({ text: JSON.stringify({ sections: missing }) }), /directions must contain/);
  const candidate = { text: JSON.stringify({ sections }), provider: 'test', model: 'test' };
  return { result: candidate, value: validate(candidate) };
};
(async () => {
  const response = await worker.handleProductDevelopmentCopywriting(new Request('https://test/ai-image/product-development-copywriting', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': 'test' },
    body: JSON.stringify({ sku: 'TEST', englishName: 'Magnesium Cream', templateId: 'regular-non-ndc', copywritingCategory: 'regular', ingredients }),
  }), { API_KEY: 'test' });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.ok, true);
  assert.equal(body.sections.directions[0].cn, '将本品涂抹于肌肤。');
  console.log('Regular copywriting: frontend/Worker parity, daily-use false positives, strict claims, category routing and neutral repairs passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
