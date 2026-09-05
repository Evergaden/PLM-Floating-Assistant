const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'src', 'product-development-ingredient-templates.module.js');
const cloudAssetPath = path.join(root, 'cloudflare', 'plm-cloud-backup', 'static', 'assets', 'v1', 'product-development-ingredient-templates.json');
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
const json = JSON.stringify({ schemaVersion: 1, templates: summaries });
fs.mkdirSync(path.dirname(cloudAssetPath), { recursive: true });
fs.writeFileSync(cloudAssetPath, json + '\n', 'utf8');
const output = [
  '// Generated cloud-backed ingredient template loader. Do not edit this file by hand.',
  "  const PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_KEY = 'plm-floating-helper:product-development-ingredient-templates:v1';",
  '  const PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_SCHEMA = 1;',
  '  const PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_EMPTY = Object.freeze([]);',
  '  let productDevelopmentIngredientTemplatesRemoteCache = loadProductDevelopmentIngredientTemplatesCache();',
  '  let productDevelopmentIngredientTemplatesLoadPromise = null;',
  '  let productDevelopmentIngredientTemplatesRemoteCheckedAt = 0;',
  '',
  '  function normalizeProductDevelopmentIngredientTemplates(value) {',
  '    const list = Array.isArray(value) ? value : value && Array.isArray(value.templates) ? value.templates : [];',
  "    return list.filter((item) => item && String(item.id || '').trim() && (String(item.kind || '').trim().toLowerCase() === 'human' || String(item.kind || '').trim().toLowerCase() === 'pet') && Array.isArray(item.sheets) && item.sheets.some((sheet) => sheet && String(sheet.name || '').trim() && Array.isArray(sheet.cells) && sheet.cells.length));",
  '  }',
  '',
  '  function loadProductDevelopmentIngredientTemplatesCache() {',
  '    try {',
  "      const stored = typeof GM_getValue === 'function'",
  "        ? GM_getValue(PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_KEY, null)",
  "        : (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_KEY) || 'null') : null);",
  "      const value = typeof stored === 'string' ? JSON.parse(stored) : stored;",
  '      const templates = value && Number(value.schemaVersion) === PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_SCHEMA',
  '        ? normalizeProductDevelopmentIngredientTemplates(value.templates)',
  '        : [];',
  '      return templates.length ? { ...value, templates: Object.freeze(templates) } : null;',
  '    } catch (_) {',
  '      return null;',
  '    }',
  '  }',
  '',
  '  function saveProductDevelopmentIngredientTemplatesCache(value) {',
  '    try {',
  "      if (typeof GM_setValue === 'function') GM_setValue(PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_KEY, value);",
  "      else if (typeof localStorage !== 'undefined') localStorage.setItem(PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_KEY, JSON.stringify(value));",
  '    } catch (_) {',
  '      // A cache write failure must not prevent the cloud asset from being used.',
  '    }',
  '  }',
  '',
  '  function productDevelopmentIngredientTemplatesData() {',
  '    return productDevelopmentIngredientTemplatesRemoteCache',
  '      ? productDevelopmentIngredientTemplatesRemoteCache.templates',
  '      : PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_EMPTY;',
  '  }',
  '',
  '  async function ensureProductDevelopmentIngredientTemplatesLoaded(force) {',
  '    if (productDevelopmentIngredientTemplatesLoadPromise) return productDevelopmentIngredientTemplatesLoadPromise;',
  '    const cached = productDevelopmentIngredientTemplatesRemoteCache;',
  '    const cachedTemplates = cached && Array.isArray(cached.templates) ? cached.templates : PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_EMPTY;',
  '    if (!force && cachedTemplates.length && productDevelopmentIngredientTemplatesRemoteCheckedAt && Date.now() - productDevelopmentIngredientTemplatesRemoteCheckedAt < 24 * 60 * 60 * 1000) return cachedTemplates;',
  '    productDevelopmentIngredientTemplatesLoadPromise = (async () => {',
  '      try {',
  "        if (typeof cloudAssetRequest !== 'function' || typeof fetchCloudAsset !== 'function') throw new Error('云端成分表模板加载器不可用');",
  "        const manifest = await cloudAssetRequest('/assets/manifest.json', 'json');",
  '        const descriptor = manifest && manifest.assets && manifest.assets.ingredientTemplates;',
  "        if (!descriptor || !descriptor.path) throw new Error('云端尚未发布成分表模板');",
  "        const descriptorHash = String(descriptor.sha256 || '').toLowerCase();",
  "        if (!force && cachedTemplates.length && descriptorHash && String(cached.assetHash || '').toLowerCase() === descriptorHash) {",
  '          productDevelopmentIngredientTemplatesRemoteCheckedAt = Date.now();',
  '          return cachedTemplates;',
  '        }',
  "        const text = await fetchCloudAsset(descriptor, 'text');",
  "        const payload = JSON.parse(text || '{}');",
  '        if (!payload || Number(payload.schemaVersion) !== PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_SCHEMA) throw new Error(\'云端成分表模板格式无效\');',
  '        const templates = normalizeProductDevelopmentIngredientTemplates(payload.templates);',
  "        if (!templates.length) throw new Error('云端成分表模板为空');",
  '        const next = {',
  '          schemaVersion: PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES_CACHE_SCHEMA,',
  "          dataVersion: String(manifest.dataVersion || ''),",
  "          assetPath: String(descriptor.path || ''),",
  '          assetHash: descriptorHash,',
  '          updatedAt: new Date().toISOString(),',
  '          templates: Object.freeze(templates),',
  '        };',
  '        saveProductDevelopmentIngredientTemplatesCache(next);',
  '        productDevelopmentIngredientTemplatesRemoteCache = next;',
  '        productDevelopmentIngredientTemplatesRemoteCheckedAt = Date.now();',
  '        return next.templates;',
  '      } catch (error) {',
  '        if (cachedTemplates.length) {',
  '          productDevelopmentIngredientTemplatesRemoteCheckedAt = Date.now();',
  "          console.warn('PLM ingredient templates cloud refresh failed; using local cache:', error);",
  '          return cachedTemplates;',
  '        }',
  '        throw error;',
  '      }',
  '    })().finally(() => {',
  '      productDevelopmentIngredientTemplatesLoadPromise = null;',
  '    });',
  '    return productDevelopmentIngredientTemplatesLoadPromise;',
  '  }',
  '',
].join('\n');
fs.writeFileSync(outputPath, output, 'utf8');
console.log('Wrote ' + path.relative(root, outputPath) + ' (' + Buffer.byteLength(output, 'utf8') + ' bytes)');
console.log('Wrote ' + path.relative(root, cloudAssetPath) + ' (' + Buffer.byteLength(json + '\n', 'utf8') + ' bytes)');
