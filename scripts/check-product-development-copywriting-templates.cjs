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
  if (templates.length !== 13) throw new Error('Expected 13 copywriting templates, received ' + templates.length);
  // The module lives as multiple pd-*.module.js parts; order is irrelevant
  // because only a single catalog literal is extracted below.
  const pdDir = path.join(root, 'src', 'product-development');
  const productSource = fs.readdirSync(pdDir)
    .filter((name) => name.endsWith('.module.js'))
    .map((name) => fs.readFileSync(path.join(pdDir, name), 'utf8'))
    .join('\n');
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
    const requiredLabelsByTemplate = {
      // 常规产品（非食品）模板沿用中文区块名，不带 A-D 编号前缀：
      // NDC 版为“产品功效/产品优势/产品卖点/成分功能”，非 NDC 版为 A.产品功效/C.产品优势/D.产品卖点/E.成分功能。
      'regular-ndc': ['产品名称', '产品功效', '产品优势', '产品卖点', '成分功能', '警告语', 'ACTIVE INGREDIENTS', 'INACTIVE INGREDIENTS'],
      'regular-non-ndc': ['产品名称', '产品功效', '产品优势', '产品卖点', '成分功能', '警告语', 'INGREDIENTS'],
    };
    const requiredLabels = requiredLabelsByTemplate[template.id] || ['产品名称', 'A.产品功效', 'B.产品优势', 'C.产品卖点', 'D.成分功能'];
    for (const label of requiredLabels) {
      // text 已去除全部空白，标签同样去空白后再比对（兼容 ACTIVE INGREDIENTS 等英文标签）。
      if (!text.includes(label.replace(/\s+/g, ''))) throw new Error(template.id + ': missing ' + label);
    }
    const mediaCount = Array.from(entries.keys()).filter((name) => /^word\/media\/[^/]+$/i.test(name)).length;
    console.log(template.id + ' | ' + template.label + ' | ' + buffer.length + ' bytes | media=' + mediaCount);
  }
  console.log('Copywriting template check passed: ' + templates.length + ' templates');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
