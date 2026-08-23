const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'ui-src');
const releasePath = path.join(sourceRoot, 'release.json');
const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
const checkOnly = process.argv.includes('--check');
const enforceExactDebtBaselines = release.enforceExactDebtBaselines === true;

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

function assertFontWeightPolicy(css, label) {
  const parsed = postcss.parse(String(css || ''), { from: label });
  parsed.walkDecls((declaration) => {
    if (declaration.prop === 'font-weight') {
      if (/^(?:bold|bolder)$/i.test(declaration.value.trim())) {
        throw new Error(`Font weight policy requires explicit 400 or 700 tiers in ${label}: ${declaration.toString()}`);
      }
      const numericWeights = Array.from(declaration.value.matchAll(/(?:^|[\s,(])([1-9]\d{2})(?=$|[\s,)])/g), (match) => Number(match[1]));
      const invalidWeight = numericWeights.find((weight) => weight !== 400 && weight !== 700);
      if (invalidWeight) {
        throw new Error(`Font weight policy allows only 400 and 700 in ${label}: ${declaration.toString()}`);
      }
    }
    if (declaration.prop === 'font' && /(?:^|\s)(?:(?!400\b)[1-9]\d{2}|bold|bolder)(?=\s)/.test(declaration.value)) {
      throw new Error(`Font shorthand must use weight 400 in ${label}; use an explicit title font-weight: ${declaration.toString()}`);
    }
  });
}

function analyzeCss(css) {
  const root = postcss.parse(String(css || ''));
  const bySelector = new Map();
  const importantDeclarationKeys = new Set();
  parseRules(css).forEach((rule) => {
    if (!bySelector.has(rule.selector)) bySelector.set(rule.selector, []);
    bySelector.get(rule.selector).push(rule.declarations);
  });
  let duplicateSelectors = 0;
  let conflictingSelectors = 0;
  bySelector.forEach((declarationSets) => {
    if (declarationSets.length < 2) return;
    const valuesByProperty = new Map();
    const occurrencesByProperty = new Map();
    declarationSets.forEach((declarations) => {
      Object.entries(declarations).forEach(([property, value]) => {
        if (!valuesByProperty.has(property)) valuesByProperty.set(property, new Set());
        valuesByProperty.get(property).add(value);
        occurrencesByProperty.set(property, (occurrencesByProperty.get(property) || 0) + 1);
      });
    });
    if (Array.from(occurrencesByProperty.values()).some((count) => count > 1)) {
      duplicateSelectors += 1;
    }
    if (Array.from(valuesByProperty.values()).some((values) => values.size > 1)) {
      conflictingSelectors += 1;
    }
  });
  let important = 0;
  let supersededImportantDeclarations = 0;
  root.walkDecls((declaration) => {
    if (!declaration.important) return;
    important += 1;
    const rule = declaration.parent;
    if (!rule || rule.type !== 'rule') return;
    const atRuleContext = [];
    for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
      if (parent.type === 'atrule') {
        atRuleContext.push(`@${parent.name} ${String(parent.params || '').replace(/\s+/g, ' ').trim()}`);
      }
    }
    const selector = String(rule.selector || '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([>+~])\s*/g, '$1')
      .trim();
    const key = [atRuleContext.reverse().join('|'), selector, declaration.prop].join('\0');
    if (importantDeclarationKeys.has(key)) supersededImportantDeclarations += 1;
    importantDeclarationKeys.add(key);
  });
  return {
    important,
    supersededImportantDeclarations,
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
  assertFontWeightPolicy(css, absolutePath);
  const parsedRules = parseRules(css);
  const sourceBytes = Buffer.byteLength(css.replace(/\r\n/g, '\n'));
  let sourceImportant = 0;
  postcss.parse(css, { from: absolutePath }).walkDecls((declaration) => {
    if (declaration.important) sourceImportant += 1;
  });
  if (source.maxBytes != null && sourceBytes > Number(source.maxBytes)) {
    throw new Error(`UI source byte budget exceeded for ${relativePath}: ${sourceBytes} > ${source.maxBytes}`);
  }
  if (enforceExactDebtBaselines && source.maxBytes != null && sourceBytes !== Number(source.maxBytes)) {
    throw new Error(`UI source normalized byte baseline must match ${relativePath}: ${source.maxBytes} != ${sourceBytes}`);
  }
  if (source.maxImportant != null && sourceImportant > Number(source.maxImportant)) {
    throw new Error(`UI source !important budget exceeded for ${relativePath}: ${sourceImportant} > ${source.maxImportant}`);
  }
  if (enforceExactDebtBaselines && source.maxImportant != null && sourceImportant !== Number(source.maxImportant)) {
    throw new Error(`UI source !important baseline must match ${relativePath}: ${source.maxImportant} != ${sourceImportant}`);
  }
  (source.forbidSelectorFragments || []).forEach((fragment) => {
    const match = parsedRules.find(({ selector }) => selector.includes(fragment));
    if (match) {
      throw new Error(`Migrated selector ${fragment} cannot return to ${relativePath}: ${match.selector}`);
    }
  });
  (source.forbidTextFragments || []).forEach((fragment) => {
    if (css.includes(fragment)) {
      throw new Error(`Removed UI source fragment cannot return to ${relativePath}: ${fragment}`);
    }
  });
  (source.forbidDeclarations || []).forEach(({ selector, property }) => {
    const match = parsedRules.find((rule) => rule.selector === selector && Object.hasOwn(rule.declarations, property));
    if (match) {
      throw new Error(`Migrated declaration ${selector} { ${property} } cannot return to ${relativePath}`);
    }
  });
  (source.forbidProperties || []).forEach((property) => {
    const match = parsedRules.find((rule) => Object.hasOwn(rule.declarations, property));
    if (match) {
      throw new Error(`Migrated property ${property} cannot return to ${relativePath}: ${match.selector}`);
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
  if (enforceExactDebtBaselines && metrics[name] !== Number(limit)) {
    throw new Error(`UI debt baseline must match ${name}: ${limit} != ${metrics[name]}`);
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

const remoteSourcePath = path.join(sourceRoot, 'remote-workbench.css');
const remoteOutputPath = path.join(root, 'static', 'remote', 'app.css');
if (!fs.existsSync(remoteSourcePath)) throw new Error('Missing UI source: remote-workbench.css');
const remoteOutput = fs.readFileSync(remoteSourcePath, 'utf8').replace(/\r\n/g, '\n');
assertFontWeightPolicy(remoteOutput, remoteSourcePath);
if (checkOnly) {
  if (!fs.existsSync(remoteOutputPath)) throw new Error('Missing generated remote UI asset: static/remote/app.css');
  if (fs.readFileSync(remoteOutputPath, 'utf8') !== remoteOutput) throw new Error('Generated remote UI asset is stale: static/remote/app.css');
} else {
  fs.mkdirSync(path.dirname(remoteOutputPath), { recursive: true });
  fs.writeFileSync(remoteOutputPath, remoteOutput, 'utf8');
}
console.log(`${checkOnly ? 'Verified' : 'Built'} ${path.relative(root, remoteOutputPath)}`);
