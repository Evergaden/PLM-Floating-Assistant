const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

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
  const root = postcss.parse(String(css || ''));
  root.walkRules((rule) => {
    if (/^(from|to|\d+%)$/.test(rule.selector.trim())) return;
    const declarations = {};
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value + (declaration.important ? ' !important' : '');
    });
    rule.selectors.forEach((rawSelector) => {
      const selector = rawSelector.replace(/\s+/g, ' ').trim();
      if (selector) rules.push({ selector, declarations });
    });
  });
  return rules;
}

function analyzeCss(css) {
  const root = postcss.parse(String(css || ''));
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
  let important = 0;
  root.walkDecls((declaration) => {
    if (declaration.important) important += 1;
  });
  return {
    important,
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
  const parsedRules = parseRules(css);
  const sourceBytes = Buffer.byteLength(css);
  let sourceImportant = 0;
  postcss.parse(css, { from: absolutePath }).walkDecls((declaration) => {
    if (declaration.important) sourceImportant += 1;
  });
  if (source.maxBytes != null && sourceBytes > Number(source.maxBytes)) {
    throw new Error(`UI source byte budget exceeded for ${relativePath}: ${sourceBytes} > ${source.maxBytes}`);
  }
  if (source.maxImportant != null && sourceImportant > Number(source.maxImportant)) {
    throw new Error(`UI source !important budget exceeded for ${relativePath}: ${sourceImportant} > ${source.maxImportant}`);
  }
  (source.forbidSelectorFragments || []).forEach((fragment) => {
    const match = parsedRules.find(({ selector }) => selector.includes(fragment));
    if (match) {
      throw new Error(`Migrated selector ${fragment} cannot return to ${relativePath}: ${match.selector}`);
    }
  });
  (source.forbidDeclarations || []).forEach(({ selector, property }) => {
    const match = parsedRules.find((rule) => rule.selector === selector && Object.hasOwn(rule.declarations, property));
    if (match) {
      throw new Error(`Migrated declaration ${selector} { ${property} } cannot return to ${relativePath}`);
    }
  });
  if (mode === 'module') {
    if (sourceImportant) throw new Error(`Canonical module cannot use !important: ${relativePath}`);
    if (/final(?:-final)? cascade/i.test(css)) {
      throw new Error(`Canonical module cannot add cascade patches: ${relativePath}`);
    }
    parsedRules.forEach(({ selector }) => {
      if (canonicalOwners.has(selector) && canonicalOwners.get(selector) !== relativePath) {
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
