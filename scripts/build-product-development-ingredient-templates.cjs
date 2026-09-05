const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'src', 'product-development-ingredient-templates.module.js');
const templates = [
  {
    id: 'human-builtin',
    kind: 'human',
    label: '人类食品成分表',
    fileName: '人类食品成分表1216.xlsx',
    source: path.join(root, 'src', 'assets', 'product-development-human-ingredient-template.xlsx'),
  },
  {
    id: 'pet-builtin',
    kind: 'pet',
    label: '宠物食品成分表',
    fileName: '宠物食品成分表1模板.xlsx',
    source: path.join(root, 'src', 'assets', 'product-development-pet-ingredient-template.xlsx'),
  },
];

function decodeXml(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      const codePoint = Number.parseInt(hex, 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&#(\d+);/g, (match, decimal) => {
      const codePoint = Number.parseInt(decimal, 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function xmlAttribute(attributes, name) {
  const pattern = new RegExp('(?:^|\\s)' + name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '\\s*=\\s*"([^"]*)"', 'i');
  const match = String(attributes || '').match(pattern);
  return match ? decodeXml(match[1]) : '';
}

function xmlText(xml) {
  const parts = [];
  const pattern = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
  let match;
  while ((match = pattern.exec(String(xml || '')))) parts.push(decodeXml(match[1]));
  return parts.join('');
}

function zipEntries(filePath) {
  const bytes = fs.readFileSync(filePath);
  const endSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const endOffset = bytes.lastIndexOf(endSignature);
  if (endOffset < 0) throw new Error('Invalid XLSX archive: end of central directory is missing');
  const entryCount = bytes.readUInt16LE(endOffset + 10);
  const centralOffset = bytes.readUInt32LE(endOffset + 16);
  const entries = new Map();
  let offset = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid XLSX archive: central directory entry is missing');
    const method = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const fileNameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const fileName = bytes.toString('utf8', offset + 46, offset + 46 + fileNameLength);
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = zlib.inflateRawSync(compressed);
    else throw new Error('Unsupported XLSX compression method: ' + method);
    entries.set(fileName, data);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function readEntry(entries, name) {
  const data = entries.get(name);
  if (!data) throw new Error('XLSX entry is missing: ' + name);
  return data.toString('utf8');
}

function cellCoordinate(address) {
  const match = String(address || '').match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  let column = 0;
  for (const character of match[1].toUpperCase()) column = column * 26 + character.charCodeAt(0) - 64;
  const row = Number(match[2]);
  return Number.isInteger(row) && row > 0 && column > 0 ? { row, column } : null;
}

function sharedStrings(xml) {
  const values = [];
  const pattern = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let match;
  while ((match = pattern.exec(xml))) values.push(xmlText(match[1]));
  return values;
}

function sheetCells(xml, shared) {
  const cells = [];
  const pattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi;
  let match;
  while ((match = pattern.exec(xml))) {
    const address = xmlAttribute(match[1], 'r');
    const coordinate = cellCoordinate(address);
    if (!coordinate || coordinate.row > 120 || coordinate.column > 40) continue;
    const type = xmlAttribute(match[1], 't');
    const body = match[2] || '';
    const valueNode = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);
    const rawValue = valueNode ? decodeXml(valueNode[1]) : '';
    let value = rawValue;
    if (type === 's' && /^\d+$/.test(rawValue)) value = shared[Number(rawValue)] || '';
    else if (type === 'inlineStr') value = xmlText(body);
    if (value === undefined || value === null || !String(value).trim()) continue;
    cells.push({
      address: address.toUpperCase(),
      row: coordinate.row,
      column: coordinate.column,
      value: String(value).replace(/\r\n?/g, '\n').slice(0, 6000),
    });
    if (cells.length >= 600) break;
  }
  return cells;
}

function normalizeSheetTarget(target) {
  const cleanTarget = decodeXml(target).replace(/^\/+/, '');
  return cleanTarget.startsWith('xl/') ? path.posix.normalize(cleanTarget) : path.posix.normalize(path.posix.join('xl', cleanTarget));
}

function summarizeWorkbook(filePath) {
  const entries = zipEntries(filePath);
  const shared = entries.has('xl/sharedStrings.xml') ? sharedStrings(readEntry(entries, 'xl/sharedStrings.xml')) : [];
  const workbookXml = readEntry(entries, 'xl/workbook.xml');
  const relsXml = readEntry(entries, 'xl/_rels/workbook.xml.rels');
  const relationships = {};
  const relationshipPattern = /<Relationship\b([^>]*?)\/>/gi;
  let relationshipMatch;
  while ((relationshipMatch = relationshipPattern.exec(relsXml))) {
    const id = xmlAttribute(relationshipMatch[1], 'Id');
    if (id) relationships[id] = xmlAttribute(relationshipMatch[1], 'Target');
  }
  const sheets = [];
  const sheetPattern = /<sheet\b([^>]*?)(?:\/>|>)/gi;
  let sheetMatch;
  while ((sheetMatch = sheetPattern.exec(workbookXml))) {
    const name = xmlAttribute(sheetMatch[1], 'name');
    const relationshipId = xmlAttribute(sheetMatch[1], 'r:id');
    const target = relationships[relationshipId];
    if (!name || !target) continue;
    sheets.push({ name, cells: sheetCells(readEntry(entries, normalizeSheetTarget(target)), shared) });
  }
  if (!sheets.length) throw new Error('XLSX 没有可用工作表: ' + filePath);
  return sheets;
}

const summaries = templates.map((template) => ({
  id: template.id,
  kind: template.kind,
  label: template.label,
  fileName: template.fileName,
  sheets: summarizeWorkbook(template.source),
}));
const json = JSON.stringify(summaries);
const compressedBase64 = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 }).toString('base64');
const base64Lines = compressedBase64.match(/.{1,120}/g) || [''];
const compressedExpression = base64Lines
  .map((line) => JSON.stringify(line))
  .join(' +\n    ');
const output = [
  '// Generated from the supplied ingredient table workbooks as a text-only summary. Do not edit this file by hand.',
  '  const PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_GZIP_BASE64 = ' + compressedExpression + ';',
  '  let productDevelopmentIngredientTemplatesCache = null;',
  '  function productDevelopmentIngredientTemplatesData() {',
  '    if (productDevelopmentIngredientTemplatesCache !== null) return productDevelopmentIngredientTemplatesCache;',
  "    const codec = (typeof fflate !== 'undefined' && fflate) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.fflate);",
  "    if (!codec || typeof codec.gunzipSync !== 'function' || typeof codec.strFromU8 !== 'function') return [];",
  '    try {',
  '      const bytes = new Uint8Array(base64ToArrayBuffer(PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_GZIP_BASE64));',
  '      const value = JSON.parse(codec.strFromU8(codec.gunzipSync(bytes)));',
  '      productDevelopmentIngredientTemplatesCache = Object.freeze(Array.isArray(value) ? value : []);',
  '    } catch (error) {',
  "      console.warn('PLM ingredient templates decode failed:', error);",
  '      productDevelopmentIngredientTemplatesCache = Object.freeze([]);',
  '    }',
  '    return productDevelopmentIngredientTemplatesCache;',
  '  }',
  '',
].join('\n');
fs.writeFileSync(outputPath, output, 'utf8');
console.log('Wrote ' + path.relative(root, outputPath) + ' (' + Buffer.byteLength(output, 'utf8') + ' bytes)');
