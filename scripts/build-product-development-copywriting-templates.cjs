const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetRoot = path.join(root, 'cloudflare', 'plm-cloud-backup', 'static', 'assets', 'v1', 'product-development-copywriting-templates');
const manifestPath = path.join(assetRoot, 'manifest.json');
const checkOnly = process.argv.includes('--check');
const templates = [
  { id: 'capsule', label: '胶囊', fileName: '胶囊产品文案模板.docx', assetName: 'capsule.docx' },
  { id: 'softgel', label: '软胶囊', fileName: '软胶囊产品文案模板.docx', assetName: 'softgel.docx' },
  { id: 'tablet', label: '片剂', fileName: '片剂产品文案模板.docx', assetName: 'tablet.docx' },
  { id: 'chewable', label: '咀嚼片', fileName: '咀嚼片产品文案模板.docx', assetName: 'chewable.docx' },
  { id: 'drops', label: '滴剂', fileName: '滴剂产品文案模版.docx', assetName: 'drops.docx' },
  { id: 'pet-drops', label: '宠物滴剂', fileName: '宠物滴剂产品文案模版.docx', assetName: 'pet-drops.docx' },
  { id: 'powder', label: '粉剂', fileName: '粉剂产品文案模版.docx', assetName: 'powder.docx' },
  { id: 'sachet-powder', label: '粉剂袋装', fileName: '粉剂袋装产品文案模版.docx', assetName: 'sachet-powder.docx' },
  { id: 'gummy', label: '软糖', fileName: '软糖产品文案模版.docx', assetName: 'gummy.docx' },
  { id: 'tea', label: '茶包', fileName: '茶产品文案模版.docx', assetName: 'tea.docx' },
  { id: 'lozenge', label: '口腔含片', fileName: '口腔含片产品文案模版.docx', assetName: 'lozenge.docx' },
];

function describe(template) {
  const source = path.join(assetRoot, template.assetName);
  if (!fs.existsSync(source)) throw new Error('Missing template asset: ' + path.relative(root, source));
  const buffer = fs.readFileSync(source);
  return {
    id: template.id,
    label: template.label,
    fileName: template.fileName,
    path: 'v1/product-development-copywriting-templates/' + template.assetName,
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  };
}

const manifest = {
  schemaVersion: 1,
  version: '2026-08-27.1',
  templates: templates.map(describe),
};
const output = JSON.stringify(manifest, null, 2) + '\n';
if (checkOnly) {
  const current = fs.existsSync(manifestPath)
    ? fs.readFileSync(manifestPath, 'utf8').replace(/\r\n/g, '\n')
    : '';
  if (current !== output) {
    throw new Error('Copywriting template manifest is stale. Run node scripts/build-product-development-copywriting-templates.cjs');
  }
  console.log('Verified ' + templates.length + ' cloud copywriting templates');
} else {
  fs.writeFileSync(manifestPath, output, 'utf8');
  console.log('Wrote ' + path.relative(root, manifestPath) + ' with ' + templates.length + ' templates');
}
