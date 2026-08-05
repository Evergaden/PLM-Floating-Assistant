const assert = require('assert');
const { buildPage4Layout, rangeSegments } = require('../copywriting');

const product = {
  copywriting: {
    sections: [
      { key: 'productName', text: 'PRODUCT NAME:\nRose Nourishing Hand Cream' },
      { key: 'functionsHeading', text: 'Functions|Funktionen|Fonctions：' },
      { key: 'functions', text: 'Rose Nourishing Hand Cream;Creme nourrissante pour les mains' },
      { key: 'ingredients', text: 'INGREDIENTS:\nAQUA\u3001GLYCERIN\u3001MINERAL OIL' },
      { key: 'directions', text: 'DIRECTIONS OF SAFE USE:\n1. Clean and dry your hands.' },
      { key: 'warning', text: 'WARNING:\nKeep out of reach of children.' },
      { key: 'email', text: 'e-mail: zhengyingdai@gmail.com' },
      { key: 'netContent', text: '30G/ 1.06 OZ' },
      { key: 'origin', text: 'MADE IN CHINA' },
      { key: 'shelfLife', text: 'SHELF LIFE: 3 Years' },
      { key: 'distributedBy', text: 'DISTRIBUTED BY: Guangzhou AOHELA Biotechnology Co., Ltd.' },
      { key: 'address', text: 'ADDRESS: Room 0585, Area C' },
      { key: 'euRep', text: 'EU REP\nYKT EU REP SAS\nBUREAU 1471' },
      { key: 'ukRep', text: 'UK REP\nMJCM Product LTD' },
      { key: 'usRep', text: 'US REP\nDH&C Health Food Co.Inc' },
    ],
  },
};

const layout = buildPage4Layout(product);
assert.equal(layout.missing.length, 0);
assert.ok(layout.text.includes('INGREDIENTS:\nAQUA、 GLYCERIN、 MINERAL OIL'));
assert.ok(layout.text.includes('MADE IN CHINA'));
assert.ok(layout.text.indexOf('PRODUCT NAME:') < layout.text.indexOf('INGREDIENTS:'));
assert.ok(layout.text.indexOf('Functions|Funktionen|Fonctions:') > layout.text.indexOf('PRODUCT NAME:'));
assert.ok(layout.text.indexOf('Functions|Funktionen|Fonctions:') < layout.text.indexOf('INGREDIENTS:'));
assert.equal(layout.text.includes('Functions|Funktionen|Fonctions：'), false);
assert.equal(layout.segments.find((segment) => segment.text.includes('Functions|Funktionen|Fonctions:')).bold, false);
assert.ok(layout.text.indexOf('US REP') > layout.text.indexOf('UK REP'));
assert.ok(!/barcode/i.test(layout.text));

const ranges = rangeSegments(layout);
assert.equal(ranges.reduce((total, range) => total + range.to - range.from, 0), layout.text.length);
assert.ok(ranges.some((range) => range.bold));
assert.equal(layout.boxes.reps.length, 3);
assert.equal(layout.boxes.info.text.includes('PRODUCT NAME:'), true);
assert.equal(layout.boxes.info.text.includes('DISTRIBUTED BY:'), false);
assert.equal(layout.boxes.address.text.includes('DISTRIBUTED BY:'), true);
assert.equal(layout.boxes.address.text.includes('ADDRESS:'), true);
assert.equal(layout.boxes.reps[0].text.includes('YKT EU REP SAS'), true);
assert.equal(/^EU REP(?:\r?\n|$)/.test(layout.boxes.reps[0].text), false);

const withoutFunctions = buildPage4Layout({
  copywriting: {
    sections: product.copywriting.sections.filter((section) => !/^functions/i.test(section.key)),
  },
});
assert.equal(withoutFunctions.boxes.reps.length, 0);
assert.equal(withoutFunctions.boxes.address.text.includes('DISTRIBUTED BY:'), true);
assert.equal(withoutFunctions.boxes.address.text.includes('ADDRESS:'), true);
assert.equal(withoutFunctions.text.includes('EU REP'), false);

const labelLayout = buildPage4Layout(product, { mode: 'label' });
assert.equal(labelLayout.mode, 'label');
assert.equal(labelLayout.boxes.labelName.text.includes('PRODUCT NAME:'), false);
assert.equal(labelLayout.boxes.labelFacts.text.includes('MADE IN CHINA'), true);
assert.equal(labelLayout.boxes.address.text.includes('DISTRIBUTED BY:'), true);
assert.equal(labelLayout.boxes.reps.length, 3);

console.log('copywriting formatter: ok');
