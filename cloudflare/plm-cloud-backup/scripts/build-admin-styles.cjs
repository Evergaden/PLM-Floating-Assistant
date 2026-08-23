const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'ui-src', 'modules', 'admin-console.css');
const outputPath = path.join(root, 'static', 'admin-console.css');
const checkOnly = process.argv.includes('--check');

const source = fs.readFileSync(sourcePath, 'utf8').trimEnd();
const parsed = postcss.parse(source, { from: sourcePath });
parsed.walkDecls((declaration) => {
  if (declaration.important) {
    throw new Error(`Admin canonical CSS cannot use !important: ${declaration.toString()}`);
  }
  if (declaration.prop === 'font-weight') {
    if (/^(?:bold|bolder)$/i.test(declaration.value.trim())) {
      throw new Error(`Admin font weight policy requires explicit 400 or 700 tiers: ${declaration.toString()}`);
    }
    const numericWeights = Array.from(declaration.value.matchAll(/(?:^|[\s,(])([1-9]\d{2})(?=$|[\s,)])/g), (match) => Number(match[1]));
    const invalidWeight = numericWeights.find((weight) => weight !== 400 && weight !== 700);
    if (invalidWeight) {
      throw new Error(`Admin font weight policy allows only 400 and 700: ${declaration.toString()}`);
    }
  }
  if (declaration.prop === 'font' && /(?:^|\s)(?:(?!400\b)[1-9]\d{2}|bold|bolder)(?=\s)/.test(declaration.value)) {
    throw new Error(`Admin font shorthand must use weight 400; use an explicit title font-weight: ${declaration.toString()}`);
  }
});
const output = '/* Generated admin UI. Edit ui-src/modules/admin-console.css, never this artifact. */\n' + source + '\n';

if (checkOnly) {
  if (!fs.existsSync(outputPath)) throw new Error('Missing generated admin asset: static/admin-console.css');
  const current = fs.readFileSync(outputPath, 'utf8');
  if (current !== output) throw new Error('Generated admin asset is stale: static/admin-console.css');
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf8');
}

console.log(`${checkOnly ? 'Verified' : 'Built'} static/admin-console.css`);
