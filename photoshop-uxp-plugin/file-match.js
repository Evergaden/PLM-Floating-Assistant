function normalizeIdentifier(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function splitIdentifiers(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  const values = raw.split(/[;,，；、\s]+/).map((item) => item.trim()).filter(Boolean);
  return values.length ? values : [raw];
}

function productIdentifiers(product) {
  const source = product || {};
  const fields = [
    { key: 'packageCode', label: '纸盒编码', priority: 0 },
    { key: 'fileCode', label: '文件编码', priority: 0 },
    { key: 'materialCode', label: '物料编码', priority: 0 },
    { key: 'printCode', label: '标签/印刷编码', priority: 1 },
    { key: 'productCode', label: '产品编码', priority: 1 },
    { key: 'sku', label: 'SKU', priority: 2 },
  ];
  const result = [];
  fields.forEach((field) => {
    splitIdentifiers(source[field.key]).forEach((raw) => {
      const normalized = normalizeIdentifier(raw);
      if (normalized.length < 5) return;
      result.push({ raw, normalized, key: field.key, label: field.label, priority: field.priority });
    });
  });
  return result;
}

function matchProductByFilename(title, products) {
  const normalizedTitle = normalizeIdentifier(title);
  if (!normalizedTitle || !Array.isArray(products)) return null;
  const matches = [];
  products.forEach((product, productIndex) => {
    productIdentifiers(product).forEach((identifier) => {
      if (!normalizedTitle.includes(identifier.normalized)) return;
      matches.push({ product, productIndex, ...identifier });
    });
  });
  matches.sort((a, b) => (
    a.priority - b.priority ||
    b.normalized.length - a.normalized.length ||
    a.productIndex - b.productIndex
  ));
  return matches[0] || null;
}

module.exports = {
  normalizeIdentifier,
  productIdentifiers,
  matchProductByFilename,
};
