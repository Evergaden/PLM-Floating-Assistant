const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const configArgIndex = process.argv.indexOf('--config');
const configPath = configArgIndex >= 0 && process.argv[configArgIndex + 1]
  ? path.resolve(process.argv[configArgIndex + 1])
  : path.join(__dirname, 'ui-copy-replacements.js');
const write = process.argv.includes('--write');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unicodeForms(character) {
  const codePoint = character.codePointAt(0);
  const literal = escapeRegExp(character);
  if (codePoint <= 0x7f) return literal;

  if (codePoint <= 0xffff) {
    const hex = codePoint.toString(16).padStart(4, '0');
    return '(?:' + literal + '|\\\\u' + hex + '|\\\\u\\{' + hex + '\\})';
  }

  const offset = codePoint - 0x10000;
  const high = (0xd800 + (offset >> 10)).toString(16);
  const low = (0xdc00 + (offset & 0x3ff)).toString(16);
  const hex = codePoint.toString(16);
  return '(?:' + literal + '|\\\\u' + high + '\\\\u' + low + '|\\\\u\\{' + hex + '\\})';
}

function copyPattern(text, ignoreWhitespace) {
  const chars = Array.from(ignoreWhitespace ? text.replace(/\s+/g, '') : text);
  const source = chars.map((character, index) => (ignoreWhitespace && index ? '\\s*' : '') + unicodeForms(character)).join('');
  return new RegExp(source, 'giu');
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function nextPatchVersion(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    throw new Error('Unsupported userscript version: ' + version);
  }
  parts[2] += 1;
  return parts.join('.');
}

function bumpUserscriptVersion(source) {
  const metadataMatch = source.match(/^\/\/ @version\s+(\d+\.\d+\.\d+)\s*$/m);
  const constantMatch = source.match(/const SCRIPT_VERSION = '(\d+\.\d+\.\d+)'/);
  if (!metadataMatch || !constantMatch) throw new Error('Userscript version fields were not found');
  if (metadataMatch[1] !== constantMatch[1]) throw new Error('Userscript version fields do not match');

  const next = nextPatchVersion(metadataMatch[1]);
  return {
    source: source
      .replace(/^(\/\/ @version\s+)\d+\.\d+\.\d+(\s*)$/m, '$1' + next + '$2')
      .replace(/(const SCRIPT_VERSION = ')\d+\.\d+\.\d+(';)/, '$1' + next + '$2'),
    previous: metadataMatch[1],
    next,
  };
}

if (!fs.existsSync(configPath)) throw new Error('Missing replacement list: ' + configPath);
const replacements = require(configPath);
if (!Array.isArray(replacements) || replacements.length === 0) {
  console.error('No copy changes configured. Edit scripts/ui-copy-replacements.js first.');
  process.exitCode = 1;
  return;
}

const seen = new Set();
for (const [index, item] of replacements.entries()) {
  if (!item || typeof item.from !== 'string' || typeof item.to !== 'string') {
    throw new Error('Replacement #' + (index + 1) + ' must contain string values for from and to');
  }
  if (!item.from || item.from === item.to) throw new Error('Replacement #' + (index + 1) + ' has no effective change');
  if (seen.has(item.from)) throw new Error('Duplicate source copy in replacement #' + (index + 1));
  seen.add(item.from);
}

const original = fs.readFileSync(sourcePath, 'utf8');
let updated = original;

for (const [index, item] of replacements.entries()) {
  const expected = item.expected === undefined ? 1 : Number(item.expected);
  if (!Number.isInteger(expected) || expected < 1) {
    throw new Error('Replacement #' + (index + 1) + ' has an invalid expected count');
  }

  let pattern = copyPattern(item.from, false);
  let matches = Array.from(updated.matchAll(pattern));
  let matchedWithFlexibleWhitespace = false;
  if (matches.length === 0) {
    pattern = copyPattern(item.from, true);
    matches = Array.from(updated.matchAll(pattern));
    matchedWithFlexibleWhitespace = matches.length > 0;
  }
  if (matches.length !== expected) {
    throw new Error(
      'Replacement #' + (index + 1) + ' expected ' + expected + ' match(es), found ' + matches.length + ': ' + item.from
    );
  }

  const lines = matches.map((match) => lineNumberAt(updated, match.index));
  console.log('#' + (index + 1) + ' line ' + lines.join(', ') + ':');
  if (matchedWithFlexibleWhitespace) console.log('  (matched after ignoring spacing differences)');
  console.log('  - ' + item.from);
  console.log('  + ' + item.to);
  updated = updated.replace(pattern, () => item.to);
}

const version = bumpUserscriptVersion(updated);
if (!write) {
  console.log('\nPreview only. Version would change from ' + version.previous + ' to ' + version.next + '.');
  console.log('Run node scripts/replace-userscript-copy.js --write to apply.');
  return;
}

fs.writeFileSync(sourcePath, version.source, 'utf8');
const syntax = spawnSync(process.execPath, ['--check', sourcePath], { encoding: 'utf8' });
if (syntax.status !== 0) {
  fs.writeFileSync(sourcePath, original, 'utf8');
  process.stderr.write(syntax.stderr || syntax.stdout || 'Userscript syntax check failed\n');
  throw new Error('The userscript was restored because syntax validation failed');
}

console.log('\nUpdated ' + path.relative(root, sourcePath));
console.log('Version: ' + version.previous + ' -> ' + version.next);
console.log('Syntax check passed.');
