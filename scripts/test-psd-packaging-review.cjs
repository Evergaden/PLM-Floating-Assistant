const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = ['pd-psd-review-template', 'pd-file-review'].map((name) =>
  fs.readFileSync(path.join(__dirname, '..', 'src', 'product-development', name + '.module.js'), 'utf8'));
const eu = {
  company: 'Approved EU company',
  address: '1 Test Street\nParis, France',
  contact: 'Test contact',
  phone: '+33 100000000',
  postal_code: '75002',
};
const { reference, assess, render, highlight } = vm.runInNewContext(modules.join('\n') + `
  ({
    reference: productDevelopmentPsdReviewReference,
    assess: productDevelopmentPsdReviewAssess,
    render: productDevelopmentPsdReviewCurrentHtml,
    highlight: productDevelopmentPsdReviewHighlight,
  })
`, {
  getProductDevelopmentSeedData: () => ({ origin: 'China' }),
  findBrandCompliance: ({ brand }) => brand === 'TEST' ? {
    distributed_by: 'Distributor Inc.', address: '1 Test Street, Paris', eu_rep: eu,
  } : null,
  escapeHtml: (value) => String(value).replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
  iconHtml: () => '',
});

const expected = reference({
  sku: 'SKU00000001',
  snapshot: {
    brand: 'TEST',
    englishName: 'Firming Roll-On',
    netContent: '50 mL',
    ingredients: [{ en: 'AQUA' }, { en: '1,2-HEXANEDIOL' }, { en: 'GLYCERIN' }],
    labeling: { directionsEn: 'DIRECTIONS OF SAFE USE: Massage onto clean skin.', warningsEn: 'Keep away from children.' },
  },
  content: {
    productNameTranslations: ['Firming Roll-On', 'Titre A', 'Titre B', 'Titre C', 'Titre D'],
    sellingPoints: [{ en: 'Editorial prose for a different surface' }],
  },
});
const titles = 'Firming Roll-On;Titre A;Titre B;Titre C;Titre D';
const common = '50ML / 1.69 FL.OZ  MADE IN CHINA\nDISTRIBUTED BY:Distributor Inc.\nADDRESS:1 Test Street,Paris';
const layers = (text) => ({
  hiddenCount: 1,
  smartCount: 2,
  layers: [
    { text, name: 'Content' },
    { text: 'EU', name: 'EU', bounds: { top: 0, bottom: 10, left: 12 } },
    { text: Object.values(eu).join('\n').replace(eu.company, 'Different EU company'), name: 'EU text',
      bounds: { top: 20, left: 10 } },
    { text: 'Task note: Editorial prose for a different surface', name: 'Notes' },
  ],
});
const map = (report) => Object.fromEntries(report.rows.map((row) => [row.key, row]));
const label = assess(layers(titles + '\n' + common), '标签.psd', expected);
assert.equal(label.type, 'label');
assert.deepEqual(Object.keys(map(label)), ['name', 'translations', 'net', 'origin', 'distributor', 'address', 'eu']);
assert.equal(map(label).net.status, 'match');
assert.equal(map(label).address.status, 'match');
assert.equal(map(label).eu.status, 'difference');
assert.match(map(label).eu.actual, /^Different EU company/);

const cartonText = [
  'PRODUCT NAME:', 'Firming Roll-On', 'Functions|Stray words|Fonctions:', titles,
  'INGREDIENTS:AQUA、1,2-HEXANEDIOL、GLYCERIN',
  'DIRECTIONS OF SAFE USE:Massage onto damp skin.',
  'WARNING:Keep away from children.', 'SHELF LIFE: 3 years', common,
].join('\n');
const carton = assess(layers(cartonText), '纸盒.psd', expected);
assert.equal(carton.type, 'carton');
assert.equal(map(carton).name.actual, 'Firming Roll-On');
assert.equal(map(carton).ingredients.status, 'match');
assert.equal(map(carton).directions.status, 'difference');
assert.equal(map(carton).warnings.status, 'match');
assert.equal(map(carton).shelfLife.status, 'reference');
assert.equal(map(assess(layers(cartonText.replace('WARNING:Keep away from children.\n', '')), '纸盒.psd', expected)).warnings.status, 'unread');
assert.equal(map(assess(layers(cartonText.replace('50ML', '150ML')), '纸盒.psd', expected)).net.status, 'difference');
assert.equal(assess(layers(cartonText), '标签.psd', expected).type, '');
assert.equal(assess(layers('Unregistered layout'), '标签.psd', expected).rows.length, 0);
assert.equal(assess({ layers: [...layers(cartonText).layers, ...label.layers] }, 'combined.psd', expected).type, '');

const html = render({ report: carton, field: 'directions', filter: 'review', raw: false });
assert.match(html, /助手对照文案/);
assert.match(html, /PSD 图层原文/);
assert.match(html, /<mark>clean<\/mark>/);
assert.match(html, /<mark>damp<\/mark>/);
assert.doesNotMatch(html, /Editorial prose|Stray words/);
assert.doesNotMatch(highlight('<script>', '<img>').join(''), /<(script|img)>/);
console.log('PSD label and carton scope, representatives, unknown templates, and field differences verified');
