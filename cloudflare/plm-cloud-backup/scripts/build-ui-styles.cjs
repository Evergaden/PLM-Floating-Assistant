const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'ui-src');
const releasePath = path.join(sourceRoot, 'release.json');
const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
const checkOnly = process.argv.includes('--check');

if (release.schemaVersion !== 1) throw new Error('Unsupported UI release schema');
if (!/^\d+\.\d+\.\d+$/.test(String(release.version || ''))) {
  throw new Error('ui-src/release.json must contain a semantic UI version');
}
if (!Array.isArray(release.sources) || !release.sources.length) {
  throw new Error('ui-src/release.json must contain at least one source');
}

function parseRules(css) {
  const rules = [];
  const clean = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(clean))) {
    const prelude = match[1].trim();
    if (!prelude || prelude.startsWith('@') || /^(from|to|\d+%)$/.test(prelude)) continue;
    const declarations = {};
    match[2].split(';').forEach((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) return;
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      if (property && value) declarations[property] = value;
    });
    prelude.split(',').forEach((rawSelector) => {
      const selector = rawSelector.replace(/\s+/g, ' ').trim();
      if (selector) rules.push({ selector, declarations });
    });
  }
  return rules;
}

function analyzeCss(css) {
  const uncommented = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const bySelector = new Map();
  parseRules(css).forEach((rule) => {
    if (!bySelector.has(rule.selector)) bySelector.set(rule.selector, []);
    bySelector.get(rule.selector).push(rule.declarations);
  });
  let duplicateSelectors = 0;
  let conflictingSelectors = 0;
  bySelector.forEach((declarationSets) => {
    if (declarationSets.length < 2) return;
    duplicateSelectors += 1;
    const valuesByProperty = new Map();
    declarationSets.forEach((declarations) => {
      Object.entries(declarations).forEach(([property, value]) => {
        if (!valuesByProperty.has(property)) valuesByProperty.set(property, new Set());
        valuesByProperty.get(property).add(value);
      });
    });
    if (Array.from(valuesByProperty.values()).some((values) => values.size > 1)) {
      conflictingSelectors += 1;
    }
  });
  return {
    important: (uncommented.match(/!important/g) || []).length,
    duplicateSelectors,
    conflictingSelectors,
    uniqueSelectors: bySelector.size,
  };
}

const canonicalOwners = new Map();
const parts = release.sources.map((source) => {
  const relativePath = String(source.path || '').replace(/\\/g, '/');
  const mode = String(source.mode || 'module');
  const absolutePath = path.resolve(sourceRoot, relativePath);
  if (!absolutePath.startsWith(sourceRoot + path.sep)) {
    throw new Error(`UI source escapes ui-src: ${relativePath}`);
  }
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing UI source: ${relativePath}`);
  const css = fs.readFileSync(absolutePath, 'utf8').trimEnd();
  const sourceBytes = Buffer.byteLength(css);
  const sourceImportant = (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/!important/g) || []).length;
  if (source.maxBytes != null && sourceBytes > Number(source.maxBytes)) {
    throw new Error(`UI source byte budget exceeded for ${relativePath}: ${sourceBytes} > ${source.maxBytes}`);
  }
  if (source.maxImportant != null && sourceImportant > Number(source.maxImportant)) {
    throw new Error(`UI source !important budget exceeded for ${relativePath}: ${sourceImportant} > ${source.maxImportant}`);
  }
  if (mode === 'module') {
    if (sourceImportant) throw new Error(`Canonical module cannot use !important: ${relativePath}`);
    if (/final(?:-final)? cascade/i.test(css)) {
      throw new Error(`Canonical module cannot add cascade patches: ${relativePath}`);
    }
    parseRules(css).forEach(({ selector }) => {
      if (canonicalOwners.has(selector)) {
        throw new Error(`Canonical selector ${selector} is owned by both ${canonicalOwners.get(selector)} and ${relativePath}`);
      }
      canonicalOwners.set(selector, relativePath);
    });
  } else if (mode !== 'legacy' && mode !== 'compat') {
    throw new Error(`Unknown UI source mode ${mode}: ${relativePath}`);
  }
  return `/* source: ${relativePath} (${mode}) */\n${css}`;
});

const output = [
  `/* Generated UI ${release.version}. Edit ui-src/, never this artifact. */`,
  ...parts,
].join('\n\n') + '\n';
const metrics = analyzeCss(output);
Object.entries(release.budgets || {}).forEach(([name, limit]) => {
  if (!(name in metrics)) throw new Error(`Unknown UI budget: ${name}`);
  if (metrics[name] > Number(limit)) {
    throw new Error(`UI budget exceeded for ${name}: ${metrics[name]} > ${limit}`);
  }
});

const repositoryRoot = path.resolve(root, '..', '..');
const userscriptPath = path.join(repositoryRoot, 'outputs', 'plm-material-summary.user.js');
const userscript = fs.readFileSync(userscriptPath, 'utf8');
const versionMatch = /const UI_ASSET_VERSION = '([^']+)'/.exec(userscript);
if (!versionMatch || versionMatch[1] !== release.version) {
  throw new Error(`Userscript UI_ASSET_VERSION must be ${release.version}`);
}

const outputDirectory = path.resolve(root, String(release.outputDirectory || 'static/assets/v15'));
const outputPath = path.join(outputDirectory, `ui-${release.version}.css`);
if (checkOnly) {
  if (!fs.existsSync(outputPath)) throw new Error(`Missing generated UI asset: ${path.relative(root, outputPath)}`);
  const current = fs.readFileSync(outputPath, 'utf8');
  if (current !== output) throw new Error(`Generated UI asset is stale: ${path.relative(root, outputPath)}`);
} else {
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf8');
}

console.log(`${checkOnly ? 'Verified' : 'Built'} ${path.relative(root, outputPath)}`);
console.log(`UI metrics: ${JSON.stringify(metrics)}`);
