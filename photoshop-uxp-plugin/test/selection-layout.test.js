const assert = require('assert');
const { buildPage4Layout } = require('../copywriting');
const { buildSelectionPlan, normalizeBounds } = require('../selection-layout');

const product = {
  copywriting: {
    sections: [
      { key: 'productName', text: 'PRODUCT NAME:\nRose Nourishing Hand Cream' },
      { key: 'ingredients', text: 'INGREDIENTS:\nAQUA, GLYCERIN, MINERAL OIL' },
      { key: 'directions', text: 'DIRECTIONS OF SAFE USE:\n1. Clean and dry your hands.' },
      { key: 'warning', text: 'WARNING:\nKeep out of reach of children.' },
      { key: 'email', text: 'E-MAIL: zhengyingdai@gmail.com' },
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
const selection = { left: 100, top: 200, right: 700, bottom: 2000 };
const plan = buildSelectionPlan(layout, selection, 300);

assert.deepEqual(normalizeBounds(selection), selection);
assert.equal(plan.size, 4);
assert.equal(plan.blocks.length, 5);
assert.equal(plan.blocks[0].key, 'info');
assert.equal(plan.blocks[1].key, 'address');
assert.equal(plan.blocks[0].bounds.bottom < selection.bottom, true);
assert.equal(plan.blocks[2].headingBounds.right > plan.blocks[2].headingBounds.left, true);
assert.equal(plan.blocks[2].bodyBounds.top > plan.blocks[2].headingBounds.bottom, true);
assert.equal(plan.blocks[4].bodyBounds.bottom <= selection.bottom, true);

console.log('selection layout: ok');
