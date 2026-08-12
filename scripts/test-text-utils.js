const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const modulePath = path.join(root, 'src', 'data', 'text-utils.module.js');
const source = fs.readFileSync(modulePath, 'utf8')
  + '\nthis.api = { normalizeText, truncateFileName, compactText, compactLabel, trimNumber };';
const context = {};

vm.runInNewContext(source, context, { filename: modulePath });

assert.strictEqual(context.api.normalizeText('\u00a0  A  \n  B  '), 'A \nB');
assert.strictEqual(context.api.compactText('  A\n  B  '), 'A B');
assert.strictEqual(context.api.compactLabel('label***'), 'label');
assert.strictEqual(context.api.trimNumber(12.5), '12.5');
assert.strictEqual(context.api.trimNumber(12), '12');
assert.strictEqual(
  context.api.truncateFileName('abcdefghij', 8),
  'abcde' + String.fromCodePoint(0x2026) + 'ij',
);

console.log('text-utils checks passed');
