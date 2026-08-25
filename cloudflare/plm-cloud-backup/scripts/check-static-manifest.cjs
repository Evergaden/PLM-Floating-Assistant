const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetRoot = path.join(root, 'static', 'assets');
const manifestPath = path.join(assetRoot, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const descriptors = new Map();

function collect(value) {
  if (!value || typeof value !== 'object') return;
  if (typeof value.path === 'string' && Number.isInteger(value.bytes) && typeof value.sha256 === 'string') {
    descriptors.set(value.path, value);
    return;
  }
  Object.values(value).forEach(collect);
}

collect(manifest.assets);
if (!descriptors.size) throw new Error('Static asset manifest contains no verifiable assets');

const errors = [];
for (const [relativePath, descriptor] of descriptors) {
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, '/'));
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    errors.push(relativePath + ': unsafe asset path');
    continue;
  }
  const filePath = path.join(assetRoot, ...normalized.split('/'));
  if (!fs.existsSync(filePath)) {
    errors.push(relativePath + ': file is missing');
    continue;
  }
  const data = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  if (data.length !== descriptor.bytes) errors.push(relativePath + ': bytes ' + data.length + ' != ' + descriptor.bytes);
  if (sha256 !== descriptor.sha256.toLowerCase()) errors.push(relativePath + ': sha256 ' + sha256 + ' != ' + descriptor.sha256);
}

if (errors.length) {
  throw new Error('Static asset manifest mismatch:\n' + errors.map((item) => ' - ' + item).join('\n') + '\nRun npm run assets:manifest -- <data-version> before deploying.');
}

console.log('Verified ' + descriptors.size + ' static asset manifest entries');
