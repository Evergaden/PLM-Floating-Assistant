const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const assetRoot = path.join(root, 'cloudflare', 'plm-cloud-backup', 'static', 'assets');
const manifestPath = path.join(assetRoot, 'v1', 'product-development-copywriting-templates', 'manifest.json');

function visibleXmlText(xml) {
  return String(xml || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value) => String.fromCodePoint(Number(value)));
}

function readZipEntries(buffer) {
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error('ZIP end record is missing');
  const total = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let index = 0; index < total; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP central directory');
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? Buffer.from(compressed) : method === 8 ? zlib.inflateRawSync(compressed) : null;
    if (!data) throw new Error('Unsupported ZIP compression method ' + method + ' for ' + name);
    entries.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

(async () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const templates = Array.isArray(manifest.templates) ? manifest.templates : [];
  if (templates.length !== 11) throw new Error('Expected 11 copywriting templates, received ' + templates.length);
  const productSource = fs.readFileSync(path.join(root, 'src', 'product-development.module.js'), 'utf8');
  const catalogMatch = /const PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CATALOG = Object\.freeze\((\[[\s\S]*?\])\);/.exec(productSource);
  if (!catalogMatch) throw new Error('Userscript copywriting template catalog is missing');
  const catalogContext = vm.createContext({ Object });
  vm.runInContext('this.catalog = ' + catalogMatch[1], catalogContext);
  const catalog = Array.from(catalogContext.catalog || []);
  if (JSON.stringify(catalog) !== JSON.stringify(templates)) throw new Error('Userscript copywriting template catalog does not match the cloud manifest');
  for (const template of templates) {
    const buffer = fs.readFileSync(path.join(assetRoot, ...String(template.path || '').split('/')));
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    if (hash !== template.sha256) throw new Error(template.id + ': SHA-256 mismatch');
    const entries = readZipEntries(buffer);
    const documentFile = entries.get('word/document.xml');
    if (!documentFile) throw new Error(template.id + ': word/document.xml is missing');
    const xml = documentFile.toString('utf8');
    const text = visibleXmlText(xml).replace(/\s+/g, '');
    for (const label of ['产品名称', 'A.产品功效', 'B.产品优势', 'C.产品卖点', 'D.成分功能']) {
      if (!text.includes(label)) throw new Error(template.id + ': missing ' + label);
    }
    const mediaCount = Array.from(entries.keys()).filter((name) => /^word\/media\/[^/]+$/i.test(name)).length;
    console.log(template.id + ' | ' + template.label + ' | ' + buffer.length + ' bytes | media=' + mediaCount);
  }
  console.log('Copywriting template check passed: ' + templates.length + ' templates');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
