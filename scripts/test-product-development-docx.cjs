const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'src/product-development', name + '.module.js'), 'utf8');
const review = read('pd-review-copywriting');
const views = read('pd-task-views');

// Small namespace-aware DOM fixture. Runs the real export code without a browser.
class Element {
  constructor(name, text = '') { this.nodeName = name; this.localName = name.split(':').pop(); this.childNodes = []; this.attributes = {}; this.text = text; }
  get firstChild() { return this.childNodes[0] || null; }
  get textContent() { return this.text + this.childNodes.map((node) => node.textContent).join(''); }
  set textContent(value) { this.text = String(value); this.childNodes = []; }
  appendChild(node) { node.parentNode = this; this.childNodes.push(node); return node; }
  insertBefore(node, before) { if (!before) return this.appendChild(node); node.parentNode = this; this.childNodes.splice(this.childNodes.indexOf(before), 0, node); return node; }
  removeChild(node) { this.childNodes.splice(this.childNodes.indexOf(node), 1); node.parentNode = null; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] || ''; }
  getElementsByTagNameNS(ns, name) { return this.childNodes.flatMap((node) => (node.localName === name ? [node] : []).concat(node.getElementsByTagNameNS(ns, name))); }
  getElementsByTagName(name) { return this.getElementsByTagNameNS('', name.split(':').pop()); }
  createElementNS(ns, name) { return new Element(name); }
  cloneNode(deep) { const node = new Element(this.nodeName, this.text); node.attributes = { ...this.attributes }; if (deep) this.childNodes.forEach((child) => node.appendChild(child.cloneNode(true))); return node; }
}
function el(name, ...children) { const node = new Element('w:' + name); children.forEach((child) => node.appendChild(typeof child === 'string' ? new Element('w:t', child) : child)); return node; }
const paragraph = (text) => el('p', el('r', el('rPr', el('b')), text));
const cell = (...lines) => el('tc', el('tcPr'), ...lines.map(paragraph));
const row = (label, english = '', chinese = '') => el('tr', cell(label), cell(english), cell(chinese), cell('template notes'));
function fixture() {
  return el('document', el('body', el('tbl',
    row('产品名称', 'PRODUCT NAME:'), row('外网参考链接'),
    row('24国语言功效内容'), row('成分表', 'INGREDIENTS:'),
    row('警告语', 'WARNING: Keep original warning.'),
    row('A.产品功效', 'FUNCTIONS：'), row('B.建议使用方法', 'DIRECTIONS OF SAFE USE：'),
    row('使用说明(固定不改动)', 'For external use only.'),
    row('C.产品优势'), row('D.产品卖点'), row('E.成分功能'),
  )));
}
function extract(source, name) {
  const start = source.indexOf('  function ' + name + '(');
  assert(start >= 0, name);
  const next = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 3 + next);
}
let currentDoc;
let outputDoc;
const context = vm.createContext({
  Blob,
  state: {},
  PRODUCT_DEVELOPMENT_W_NS: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  DOMParser: class { parseFromString() { return currentDoc.cloneNode(true); } },
  XMLSerializer: class { serializeToString(doc) { outputDoc = doc; return 'validated by DOM assertions'; } },
  productDevelopmentBuiltinDocumentXml: () => '<fixture/>',
  createProductDevelopmentBuiltinDocx: async () => new Blob(['fixture']),
  productDevelopmentCopywritingNameWithBrand: (brand, name) => [brand, name].filter(Boolean).join(' '),
  productDevelopmentCleanText: (text, max = 4000) => String(text || '').trim().slice(0, max),
  productDevelopmentCopywritingPairValues: (item) => ({ en: String(item.en || '').trim(), cn: String(item.cn || '').trim() }),
  productDevelopmentCopywritingText: (text) => String(text || '').trim(),
  productDevelopmentLog: () => {},
});
for (const name of ['productDevelopmentXmlElements', 'productDevelopmentCellText', 'productDevelopmentClearCell', 'productDevelopmentXmlSafeText', 'productDevelopmentBodyRunProperties', 'productDevelopmentSetCellLines', 'productDevelopmentDocxTextLines', 'productDevelopmentSetCellHeadingAndLines', 'productDevelopmentCellGridSpan', 'productDevelopmentSetDirectionsCells', 'productDevelopmentIngredientHeading', 'productDevelopmentCellHeadingPrefix', 'productDevelopmentFindRow', 'productDevelopmentSectionLines']) {
  vm.runInContext(extract(review, name), context);
}
vm.runInContext(extract(views, 'productDevelopmentCopywritingReferenceUrl'), context);
vm.runInContext(extract(review, 'productDevelopmentNormalizeCopywritingTitle'), context);
vm.runInContext(extract(review, 'productDevelopmentNormalizeCopywriting'), context);
vm.runInContext(read('pd-docx-builders'), context);
vm.runInContext(extract(read('pd-task-sync'), 'productDevelopmentResolvePackagingKind'), context);
const elements = (node, name) => Array.from(context.productDevelopmentXmlElements(node, name));
const rows = () => elements(outputDoc, 'tr');
const findCell = (label, index = 1) => elements(rows().find((node) => context.productDevelopmentCellText(elements(node, 'tc')[0]) === label), 'tc')[index];
const lines = (node) => elements(node, 'p').map((p) => context.productDevelopmentCellText(p));

(async () => {
  const content = {
    efficacy: [{ en: 'Helps skin feel soft.', cn: '帮助肌肤保持柔软。' }], advantages: [], sellingPoints: [], ingredientFunctions: [],
    directions: [{ en: 'Apply with the roller.', cn: '使用滚珠涂抹。' }, { en: 'Massage gently.', cn: '轻轻按摩。' }],
    productNameTranslations: ['Roll-On', 'Roll-On DE'],
  };
  const snapshot = { packagingKind: 'boxed', copywritingCategory: 'regular', englishName: 'Body Roll-On', name: '身体滚珠', brand: 'BRAND', benchmarkLink: 'https://example.test/item?a=1&b=2', regularIngredients: { activeEn: ['AQUA', 'GLYCERIN'], inactiveEn: [] } };
  const cachedContent = JSON.parse(JSON.stringify(context.productDevelopmentNormalizeCopywriting({ sections: content })));
  assert.deepEqual(cachedContent.directions, content.directions);
  assert.deepEqual(Array.from(context.productDevelopmentNormalizeCopywriting({}).directions), []);
  currentDoc = fixture();
  await context.buildProductDevelopmentDocx(content, null, snapshot);
  assert.deepEqual(lines(findCell('产品名称')), ['PRODUCT NAME:', 'BRAND Body Roll-On']);
  assert.deepEqual(lines(findCell('成分表')), ['INGREDIENTS:', 'AQUA、GLYCERIN']);
  assert.deepEqual(lines(findCell('A.产品功效')), ['FUNCTIONS：', '1. Helps skin feel soft.']);
  assert.deepEqual(lines(findCell('B.建议使用方法')), ['DIRECTIONS OF SAFE USE：', '1. Apply with the roller.', '2. Massage gently.']);
  assert.deepEqual(lines(findCell('B.建议使用方法', 2)), ['1、使用滚珠涂抹。', '2、轻轻按摩。']);
  assert.deepEqual(lines(findCell('外网参考链接')), [snapshot.benchmarkLink]);
  assert.deepEqual(lines(findCell('24国语言功效内容')), ['Roll-On;Roll-On DE']);
  assert.deepEqual(lines(findCell('警告语')), ['WARNING: Keep original warning.']);
  assert.deepEqual(lines(findCell('使用说明(固定不改动)')), ['For external use only.']);
  assert.deepEqual(lines(findCell('成分表', 2)), ['']);
  assert(elements(findCell('产品名称'), 'b').some((node) => node.getAttribute('w:val') === '0'));
  assert.deepEqual(lines(elements(elements(currentDoc, 'tr')[0], 'tc')[1]), ['PRODUCT NAME:']);

  assert.equal(context.productDevelopmentCopywritingReferenceUrl({ referenceUrl: 'N/A', benchmarkLink: '' }, { main_url: '参考：https://example.test/p?q=1&amp;x=2' }), 'https://example.test/p?q=1&x=2');
  assert.equal(context.productDevelopmentCopywritingReferenceUrl('javascript:alert(1)', { referenceUrl: '' }), '');
  assert.equal(context.productDevelopmentCopywritingReferenceUrl('https://first.test', 'https://second.test'), 'https://first.test');

  await context.buildProductDevelopmentDocx({ ...content, directions: [] }, null, { ...snapshot, labeling: { directionsEn: 'Approved step one.\nApproved step two.', directionsCn: '已确认步骤。' } });
  assert.deepEqual(lines(findCell('B.建议使用方法')), ['DIRECTIONS OF SAFE USE：', 'Approved step one.', 'Approved step two.']);
  assert.deepEqual(lines(findCell('警告语')), ['WARNING: Keep original warning.']);
  await context.buildProductDevelopmentDocx({ ...content, directions: [] }, null, snapshot);
  assert.deepEqual(lines(findCell('B.建议使用方法')), ['DIRECTIONS OF SAFE USE：']);

  const merged = cell('DIRECTIONS:');
  const span = el('gridSpan'); span.setAttribute('w:val', '2'); merged.firstChild.appendChild(span);
  const auxiliary = cell('sample only');
  context.productDevelopmentSetDirectionsCells([cell('食用方法'), merged, auxiliary], { directionsEn: 'Use as directed.', directionsCn: '按说明使用。' }, currentDoc);
  assert.deepEqual(lines(merged), ['DIRECTIONS:', 'Use as directed.', '按说明使用。']);
  assert.equal(elements(auxiliary, 't').length, 0);

  const workerSource = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/src/index.js'), 'utf8');
  const workerStart = workerSource.indexOf('function normalizeProductDevelopmentCopywritingCandidate(');
  const workerEnd = workerSource.indexOf('\nfunction productDevelopmentOneShotNumber(', workerStart);
  const worker = vm.createContext({
    cleanText: (value, max) => String(value || '').trim().slice(0, max),
    readProductDevelopmentField: (source, aliases) => aliases.map((key) => source[key]).find((value) => value !== undefined),
    normalizeProductDevelopmentPair: (value) => value,
  });
  vm.runInContext(workerSource.slice(workerStart, workerEnd), worker);
  const normalized = worker.normalizeProductDevelopmentCopywritingCandidate({ sections: { directions: content.directions.concat([{ en: 'incomplete' }]) } }, [], '', { requiredSections: ['directions'] });
  assert.deepEqual(JSON.parse(JSON.stringify(normalized.directions)), content.directions);
  assert.deepEqual(JSON.parse(JSON.stringify(context.productDevelopmentNormalizeCopywriting({ sections: normalized }).directions)), content.directions);
  console.log('Product development DOCX export regression passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
