// DOM/async contract checks only; the installed userscript still needs manual QA.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const { document } = parseHTML('<html><body><div id="panel"></div></body></html>');
let active = null;
Object.defineProperty(document, 'activeElement', { get: () => active });
const panel = document.getElementById('panel');
const timers = new Map();
let nextTimer = 0;
let renders = 0;
const state = { productDevelopmentOneShotInput: { sku: 'SKU1', productLine: 'regular', regularNdcKind: 'non-ndc', productType: 'Lotion', regularIngredientsEn: 'AQUA 84.77\n1,2-HEXANEDIOL 0.5', regularIngredientsCn: '水\n1,2-己二醇' }, productDevelopmentSelectedTask: { name: 'Lotion' }, productDevelopmentCopywritingTemplateId: 'capsule' };
const templates = ['capsule', 'gummy', 'regular-non-ndc', 'regular-ndc'].map((id) => ({ id, label: id }));
const context = vm.createContext({
  document, state, PANEL_ID: 'panel',
  PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID: 'capsule',
  PRODUCT_DEVELOPMENT_REGULAR_HERO_HINTS: [], PRODUCT_DEVELOPMENT_REGULAR_BASE_INGREDIENT_PATTERN: /^(AQUA)$/,
  PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT: {},
  getProductDevelopmentCurrentSku: () => 'SKU1',
  productDevelopmentCleanText: (value) => String(value || '').trim(),
  productDevelopmentNormalizedClaimText: (value) => String(value || '').toLowerCase(),
  escapeHtml: (value) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
  iconHtml: (name) => '<svg data-icon="' + name + '"></svg>',
  formatErrorMessage: (error) => error.message || String(error),
  productDevelopmentCopywritingBuiltinTemplates: () => templates,
  resolveProductDevelopmentCopywritingTemplate: () => ({ ...templates.find((item) => item.id === state.productDevelopmentCopywritingTemplateId), local: state.productDevelopmentCopywritingTemplateId === 'local' }),
  saveProductDevelopmentCopywritingTemplateId: (id) => { state.productDevelopmentCopywritingTemplateId = id; },
  setTimeout: (callback) => { timers.set(++nextTimer, callback); return nextTimer; },
  clearTimeout: (id) => timers.delete(id),
  renderShell: () => renders++, showToast: () => {}, productDevelopmentLog: () => {},
  withCopywritingTimeout: (promise) => promise,
  loadProductDevelopmentSnapshot: async () => ({ sku: 'SKU1', name: 'Lotion', imageUrl: 'https://example.test/product.png' }),
  productDevelopmentFetchImage: async () => ({ dataUrl: 'data:image/png;base64,dGVzdA==' }),
  loadProductDevelopmentCopywritingTemplateSource: async () => 'template',
  productDevelopmentCopywritingReferenceUrl: () => '',
  productDevelopmentCopywritingFileName: () => 'copy.docx',
  productDevelopmentCopywritingSnapshotValue: (snapshot) => ({ ...snapshot }),
  productDevelopmentValidateCopywriting: () => ({ efficacy: [], advantages: [], sellingPoints: [], ingredientFunctions: [] }),
  productDevelopmentFriendlyCopywritingError: (error) => error.message,
  saveProductDevelopmentCopywritingCache: () => {},
  buildProductDevelopmentDocx: async () => ({ size: 42 }),
});
vm.runInContext(read('src/product-development/pd-copywriting-run.module.js'), context);
vm.runInContext(read('src/product-development/pd-batch-runners.module.js'), context);
const syncSource = read('src/product-development/pd-task-sync.module.js');
const packagingStart = syncSource.indexOf('  function productDevelopmentResolvePackagingKind(');
vm.runInContext(syncSource.slice(packagingStart, syncSource.indexOf('\n  }', packagingStart) + 4), context);
// Fixtures replace unrelated template-library and draft-persistence integrations.
context.productDevelopmentOneShotInputForRender = () => state.productDevelopmentOneShotInput;
context.productDevelopmentOneShotIngredientTemplate = () => null;
context.productDevelopmentOneShotIngredientTemplateOptions = () => '';
context.productDevelopmentOneShotIngredientSheetOptions = () => '';
context.productDevelopmentOneShotResultHtml = () => '';
context.productDevelopmentOneShotPlainTextCopy = () => '';

for (const [name, expected] of [['男士增强喷雾笔','建议做 NDC'], ['抗橘皮身体油','建议做 NDC'], ['祛痘沐浴露','建议做 NDC'], ['Skin Tag Remover Cream','建议做 NDC'], ['镁霜 Magnesium Cream','NDC 待确认'], ['紧致眼霜','NDC 待确认'], ['生发护理精华','NDC 待确认'], ['脱毛喷雾','NDC 待确认'], ['牙贴','建议非 NDC'], ['身体乳','建议非 NDC'], ['驱鼠丸','NDC 不适用'], ['普通产品','NDC 待确认']]) assert.equal(context.productDevelopmentNdcSuggestion(name).label, expected, name);

panel.innerHTML = context.productDevelopmentOneShotEmbeddedHtml('SKU1');
assert.match(panel.querySelector('.pfh-cw-product strong').textContent, /NDC 待确认/, 'Show an independent NDC suggestion beside the name');
assert.equal(state.productDevelopmentOneShotInput.regularNdcKind, 'non-ndc', 'Suggestions never change the selected template');
assert.equal(panel.querySelector('.pfh-product-development-one-shot-settings-product'), null, 'Regular product type is not displayed');
assert.doesNotMatch(panel.textContent, /尺寸不完整时|来源：|英文支持逗号或换行/);
assert.equal(panel.querySelectorAll('.pfh-cw-template-row').length, 1, 'One template entry inside generation settings');
assert.equal(panel.querySelector('.pfh-product-development-copywriting-template-input').value, 'regular-non-ndc');
assert.equal(panel.querySelectorAll('.pfh-product-development-copywriting-template-input option').length, 1, 'Food templates cannot conflict with regular product classification');
assert.equal(panel.querySelectorAll('.pfh-cw-pair textarea').length, 2);
assert.equal(panel.querySelectorAll('[data-product-development-one-shot-field="packagingKind"] option').length, 3, 'Packaging choices live in the form');
assert.equal(panel.querySelectorAll('.pfh-cw-tools svg').length, 0, 'Template tools are text-only');
assert.equal(panel.querySelector('.pfh-cw-actions [data-action="product-development-copywriting-download"]').disabled, true);
assert.match(panel.querySelector('[data-cw-ingredient-count]').textContent, /英文已识别 2 项 · 中文已识别 2 项/);
const english = panel.querySelector('textarea');
english.scrollTop = 55;
state.productDevelopmentOneShotInput.regularIngredientsCn = '水';
context.productDevelopmentCopywritingUpdateIngredientCounts(panel);
assert.match(panel.querySelector('[data-cw-ingredient-count]').textContent, /数量不一致/);
assert.equal(panel.querySelector('textarea'), english, 'Live counts retain input and scroll');
assert.equal(english.scrollTop, 55);

state.productDevelopmentOneShotInput.regularNdcKind = 'ndc';
panel.innerHTML = context.productDevelopmentOneShotEmbeddedHtml('SKU1');
assert.equal(state.productDevelopmentCopywritingTemplateId, 'regular-ndc');
assert.equal(panel.querySelectorAll('.pfh-cw-pair').length, 2, 'NDC active and inactive groups each pair English with Chinese');
state.productDevelopmentOneShotInput.productLine = 'food';
panel.innerHTML = context.productDevelopmentOneShotEmbeddedHtml('SKU1');
assert.equal(state.productDevelopmentCopywritingTemplateId, 'capsule');
assert.ok(panel.querySelector('.pfh-product-development-one-shot-settings-product'), 'Food product type control remains available');
assert.equal(panel.querySelectorAll('.pfh-product-development-copywriting-template-input option').length, 2);
state.productDevelopmentTemplateBase64 = 'custom';
state.productDevelopmentCopywritingTemplateId = 'local';
state.productDevelopmentOneShotInput.productLine = 'regular';
panel.innerHTML = context.productDevelopmentOneShotEmbeddedHtml('SKU1');
assert.equal(state.productDevelopmentCopywritingTemplateId, 'local', 'Classification changes preserve an explicit custom template');

const tools = panel.querySelector('.pfh-cw-tools');
const toggle = tools.querySelector('button');
toggle.focus = () => { active = toggle; };
for (const item of tools.querySelectorAll('[role="menuitem"]')) item.focus = () => { active = item; };
context.productDevelopmentCopywritingHandleToolsKeydown({ target: toggle, key: 'ArrowDown', preventDefault() {} });
assert.equal(toggle.getAttribute('aria-expanded'), 'true');
assert.equal(active.getAttribute('role'), 'menuitem');
context.productDevelopmentCopywritingHandleToolsKeydown({ target: active, key: 'Escape', preventDefault() {}, stopPropagation() {} });
assert.equal(toggle.getAttribute('aria-expanded'), 'false');
assert.equal(active, toggle, 'Escape returns focus to the tools trigger');
context.productDevelopmentCopywritingHandleToolsKeydown({ target: toggle, key: 'ArrowUp', preventDefault() {} });
assert.equal(active, tools.querySelectorAll('[role="menuitem"]')[1], 'ArrowUp opens on the last enabled menu action');
context.productDevelopmentCopywritingSetToolsOpen(tools, true);
context.productDevelopmentCopywritingDismissTools({ target: panel });
assert.equal(toggle.getAttribute('aria-expanded'), 'false', 'Outside clicks close the menu');

async function run() {
  assert.equal(await context.productDevelopmentResolvePackagingKind({ sku: 'SKU1', outerDimensions: [1, 2, 3] }), 'boxed');
  await assert.rejects(context.productDevelopmentResolvePackagingKind({ sku: 'SKU1' }), /生成设置/);
  state.productDevelopmentOneShotInput.packagingKind = 'bagged';
  assert.equal(await context.productDevelopmentResolvePackagingKind({ sku: 'SKU1', packagingKind: 'boxed', outerDimensions: [1, 2, 3] }), 'bagged', 'Inline selection overrides detected and cached packaging');
  state.productDevelopmentOneShotInput.packagingKind = 'boxed';
  state.productDevelopmentCopywritingTemplateId = 'regular-ndc';
  state.productDevelopmentOneShotInput.regularNdcKind = 'ndc';
  panel.innerHTML = '<textarea id="draft">Keep this input</textarea><section data-cw-progress></section>';
  const inputNode = panel.querySelector('textarea');
  let resolveAI;
  context.cloudRequest = () => new Promise((resolve) => { resolveAI = resolve; });
  const pending = context.runProductDevelopmentRegularCopywriting();
  for (let i = 0; i < 10 && !resolveAI; i++) await Promise.resolve();
  assert.equal(state.productDevelopmentCopywritingProgress.index, 2, 'AI stage follows actual awaited data/template work');
  assert.equal(state.productDevelopmentCopywritingProgress.status, 'running', state.productDevelopmentError);
  assert.equal(renders, 1, 'Intermediate stages update the progress area, without rebuilding the form');
  assert.equal(panel.querySelector('textarea'), inputNode);
  assert.equal(panel.querySelector('[aria-current="step"]').textContent, '生成文案');
  assert.equal(timers.size, 1, 'Exactly one elapsed-time timer runs');
  resolveAI({ provider: 'test', model: 'test' });
  await pending;
  assert.equal(state.productDevelopmentCopywritingProgress.status, 'complete');
  assert.equal(state.productDevelopmentCopywriting.blob.size, 42);
  assert.equal(timers.size, 0, 'Timer stops after completion');
  assert.equal(renders, 2);
  const buttonHost = document.createElement('div');
  buttonHost.innerHTML = context.productDevelopmentCopywritingDownloadButtonHtml('SKU1');
  assert.equal(buttonHost.firstElementChild.textContent, '更新并下载文案');
  assert.equal(buttonHost.firstElementChild.classList.contains('is-ready'), true, 'Available document downloads are highlighted');
  assert.equal(buttonHost.firstElementChild.disabled, false);
  const previousResult = state.productDevelopmentCopywriting;
  context.cloudRequest = async () => { throw new Error('AI unavailable'); };
  await context.runProductDevelopmentRegularCopywriting();
  assert.equal(state.productDevelopmentCopywritingProgress.status, 'error');
  assert.equal(state.productDevelopmentCopywritingProgress.index, 2);
  assert.equal(state.productDevelopmentCopywriting, previousResult, 'Failed regeneration retains the previous result');
  assert.equal(state.productDevelopmentOneShotInput.regularIngredientsEn.includes('1,2-HEXANEDIOL'), true);
  assert.equal(timers.size, 0, 'Timer also stops after failure');
  state.productDevelopmentOneShotInput.packagingKind = '';
  let requests = 0;
  context.cloudRequest = async () => { requests++; };
  await context.runProductDevelopmentRegularCopywriting();
  assert.equal(requests, 0, 'Unknown packaging is rejected before spending an AI request');
  assert.match(state.productDevelopmentError, /生成设置/);
  assert.equal(document.querySelector('[data-packaging-dialog]'), null, 'No packaging modal is mounted');
  console.log('Copywriting workspace: classification/template consistency, bilingual grouping/counts, accessible tools, real async stages and failure preservation passed');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
