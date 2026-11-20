const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/core-detail-copywriting.module.js'), 'utf8');
const start = source.indexOf('  function formatCopywritingNetContent(');
const end = source.indexOf('\n  async function ', start);
assert(start >= 0 && end > start);
const ctx = vm.createContext({
  cleanCopywritingLine: (value) => String(value || '').trim(),
  trimNumber: (value) => String(value),
  L: { unknown: '未知' },
  normalizeCopywritingCompatibilityCharacters: (value) => value,
  normalizeIngredientLocantHyphens: (value) => value,
  formatBrandComplianceSections: () => [{ key: 'address', label: 'ADDRESS', text: 'ADDRESS: Test Street' }],
});
vm.runInContext(source.slice(start, end), ctx);
vm.runInContext(source.slice(source.indexOf('  function getCopywritingDisplayRecord('), source.indexOf('  function extractLabeledCopywritingSection(')), ctx);
vm.runInContext(source.slice(source.indexOf('  function normalizeCopywritingRecord('), source.indexOf('  function isCopywritingCheckFresh(')), ctx);
assert.equal(ctx.formatCopywritingNetContent('80ml').text, '80ML/ 2.71 FL.OZ');
assert.equal(ctx.formatCopywritingNetContent('60g').text, '60G/ 2.12 OZ');
assert.equal(ctx.formatCopywritingNetContent('60capsules').text, '60CAPSULES');
assert.equal(ctx.formatCopywritingNetContent('unknown').text, 'unknown');

const cached = {
  fileName: 'PLM product copy.docx',
  fullText: 'PRODUCT NAME: Test product\nMADE IN CHINA',
  sections: [
    { key: 'productName', label: '产品名称', text: 'Test product' },
    { key: 'origin', label: '原产国', text: 'MADE IN CHINA' },
  ],
  missingSections: ['净含量', '警告语'],
};
const corrected = ctx.getCopywritingDisplayRecord({ netContent: '30g', copywriting: cached });
assert.equal(corrected.sections.map((section) => section.key).join(','), 'productName,netContent,origin,address');
assert.equal(corrected.sections[1].text, '30G/ 1.06 OZ');
assert.match(corrected.fullText, /30G\/ 1\.06 OZ/);
assert.match(corrected.fullText, /ADDRESS: Test Street/);
assert.equal(corrected.missingSections.join(','), '警告语');
assert.deepEqual(cached.missingSections, ['净含量', '警告语']);
assert.match(ctx.getCopywritingDisplayRecord({ copywriting: cached }).missingSections.join(','), /净含量/);
assert.equal(ctx.getCopywritingDisplayRecord({ netContent: '30g' }), null);
const including = { key: 'netContent', label: '净含量', text: 'INCLUDING: 3 rolls and 1 pouch' };
const explicit = ctx.getCopywritingDisplayRecord({
  netContent: '30g',
  copywriting: { ...cached, sections: [...cached.sections, including], fullText: cached.fullText + '\n' + including.text },
});
assert.equal(explicit.sections.filter((section) => section.key === 'netContent').length, 1);
assert.equal(explicit.sections.find((section) => section.key === 'netContent').text, including.text);
assert.doesNotMatch(explicit.fullText, /30G/);
assert.equal(explicit.missingSections.join(','), '警告语');
console.log('Design copy net content: cached missing fields, detail fallback, and Word content precedence passed');
