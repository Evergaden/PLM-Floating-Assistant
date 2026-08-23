const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'ui-src', 'modules', 'admin-console.css');
const outputPath = path.join(root, 'static', 'admin-console.css');
const checkOnly = process.argv.includes('--check');

const source = fs.readFileSync(sourcePath, 'utf8').trimEnd();
postcss.parse(source, { from: sourcePath });
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
