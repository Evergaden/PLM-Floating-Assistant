const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetRoot = path.join(root, 'static', 'assets');
const manifestPath = path.join(assetRoot, 'manifest.json');
const previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const dataVersion = String(process.argv[2] || previous.dataVersion || '').trim();
if (!dataVersion) throw new Error('Pass a data version, for example: npm run assets:manifest -- 2026-07-19.2');

const definitions = {
  runtimeData: 'v1/runtime-data.json',
  excelTemplate: 'v1/excel-template.xlsx',
  icons: 'v1/icons.json',
  uiStyles: 'v1/ui-2.5.134.css',
};
const assets = {};
for (const [name, relativePath] of Object.entries(definitions)) {
  const data = fs.readFileSync(path.join(assetRoot, relativePath));
  assets[name] = {
    path: relativePath,
    bytes: data.length,
    sha256: crypto.createHash('sha256').update(data).digest('hex'),
  };
}

const manifest = {
  schemaVersion: 1,
  dataVersion,
  minimumClientVersion: previous.minimumClientVersion || '2.5.103',
  assets,
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Updated ${path.relative(root, manifestPath)} to ${dataVersion}`);
