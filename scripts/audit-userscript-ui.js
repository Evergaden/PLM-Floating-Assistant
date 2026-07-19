const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const uiPath = path.join(root, 'src', 'ui-foundation.module.js');
const output = fs.readFileSync(outputPath, 'utf8');
const uiSource = fs.readFileSync(uiPath, 'utf8');

function extractTemplate(source) {
  const marker = 'style.textContent = `';
  const start = source.indexOf(marker);
  const end = source.lastIndexOf('`;');
  if (start < 0 || end < start) throw new Error('UI style template is missing');
  return source.slice(start + marker.length, end).replace(/\$\{[^}]+\}/g, 'PFH_ID');
}

function selectorReport(css) {
  const selectors = [];
  const matcher = /([^{}]+)\{/g;
  let match;
  while ((match = matcher.exec(css))) {
    const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
    if (!selector || selector.startsWith('@') || /^(?:from|to|\d+(?:\.\d+)?%)$/.test(selector)) continue;
    if (selector.includes(': ') || selector.includes(';')) continue;
    selectors.push(selector);
  }
  const counts = new Map();
  selectors.forEach((selector) => counts.set(selector, (counts.get(selector) || 0) + 1));
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
  return { total: selectors.length, duplicates };
}

function extractModule(source, name) {
  const start = `  // <${name}-module>\n`;
  const end = `\n  // </${name}-module>`;
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  if (from < 0 || to < 0) return null;
  return source.slice(from + start.length, to).replace(/\r\n/g, '\n').trimEnd();
}

const css = extractTemplate(uiSource);
const selectors = selectorReport(css);
const styleAssignments = (output.match(/style\.textContent\s*=/g) || []).length;
const importantCount = (css.match(/!important/g) || []).length;
const colors = [...new Set((css.match(/#[0-9a-f]{3,8}\b/gi) || []).map((value) => value.toUpperCase()))].sort();
const bannedLegacyColors = ['#1677FF', '#7C3AED', '#8B5CF6'].filter((color) => colors.includes(color));
const legacyCssClasses = [
  'pfh-resizer', 'pfh-toolrow', 'pfh-list-note', 'pfh-about-note', 'pfh-table-head',
  'pfh-upload-side', 'pfh-upload-side-card', 'pfh-upload-history-card', 'pfh-upload-info-grid',
  'pfh-upload-inline-actions', 'pfh-upload-line', 'pfh-upload-time', 'pfh-upload-file-name',
  'pfh-warning-note', 'pfh-manual-note', 'pfh-easter-egg', 'pfh-first-run-actions',
  'pfh-tutorial-actions', 'pfh-tutorial-hero', 'pfh-tutorial-steps', 'pfh-ledger-head',
];
const remainingLegacyClasses = legacyCssClasses.filter((name) => new RegExp(`\\.${name}(?![\\w-])`).test(css));
const cssClasses = new Set([...css.matchAll(/\.((?:pfh-)[a-z0-9_-]+)/gi)].map((match) => match[1]));
const codeWithoutUiModule = output.replace(/  \/\/ <ui-foundation-module>[\s\S]*?  \/\/ <\/ui-foundation-module>/, '');
const contractOnlyClasses = new Set(['pfh-btn-primary', 'pfh-btn-secondary', 'pfh-btn-ghost', 'pfh-btn-danger', 'pfh-card', 'pfh-actions-primary']);
const cssOnlyClasses = [...cssClasses].filter((name) => !codeWithoutUiModule.includes(name) && !contractOnlyClasses.has(name)).sort();

const moduleNames = ['parameter-logo-assets', 'parameter-image', 'cloud-assets', 'icon-assets', 'notifications', 'ui-foundation'];
const moduleMismatches = moduleNames.filter((name) => {
  const embedded = extractModule(output, name);
  const sourcePath = path.join(root, 'src', `${name}.module.js`);
  return embedded == null || !fs.existsSync(sourcePath) || embedded !== fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
});
const metadataVersion = (output.match(/@version\s+([^\s]+)/) || [])[1] || '';
const scriptVersion = (output.match(/const SCRIPT_VERSION = '([^']+)'/) || [])[1] || '';
const sharedDropzones = ['pfh-upload-drop', 'pfh-parameter-drop', 'pfh-size-image-drop'].filter((legacy) => {
  const pattern = new RegExp(`class=["'][^"']*pfh-dropzone[^"']*${legacy}|class=["'][^"']*${legacy}[^"']*pfh-dropzone`);
  return pattern.test(codeWithoutUiModule);
});
const pageBackCount = (codeWithoutUiModule.match(/class="[^"]*pfh-page-back[^"]*"[^>]*data-action=(?:"|' \+ )/g) || []).length;

const report = {
  styleAssignments,
  importantCount,
  selectorCount: selectors.total,
  duplicateSelectorGroups: selectors.duplicates.length,
  duplicateSelectors: selectors.duplicates,
  uniqueHexColors: colors.length,
  bannedLegacyColors,
  remainingLegacyClasses,
  cssOnlyClasses,
  sharedDropzones,
  pageBackCount,
  moduleMismatches,
  version: { metadata: metadataVersion, runtime: scriptVersion },
};

const failures = [];
if (styleAssignments !== 1) failures.push(`expected one style assignment, found ${styleAssignments}`);
if (importantCount > 100) failures.push(`!important count ${importantCount} exceeds 100`);
if (selectors.duplicates.length > 40) failures.push(`duplicate selector groups ${selectors.duplicates.length} exceeds 40`);
if (bannedLegacyColors.length) failures.push(`legacy brand colors remain: ${bannedLegacyColors.join(', ')}`);
if (remainingLegacyClasses.length) failures.push(`dead legacy CSS remains: ${remainingLegacyClasses.join(', ')}`);
if (cssOnlyClasses.length) failures.push(`unexplained CSS-only classes: ${cssOnlyClasses.join(', ')}`);
if (sharedDropzones.length !== 3) failures.push(`shared dropzone contract covers ${sharedDropzones.length}/3 uploaders`);
if (pageBackCount < 5) failures.push(`shared page-back contract found on only ${pageBackCount} render paths`);
if (moduleMismatches.length) failures.push(`embedded modules differ from source: ${moduleMismatches.join(', ')}`);
if (metadataVersion !== scriptVersion) failures.push(`version mismatch: metadata ${metadataVersion}, runtime ${scriptVersion}`);

if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify({ ...report, failures }, null, 2)}\n`);
} else {
  console.log(`UI styles: ${styleAssignments} block; ${importantCount} !important; ${selectors.duplicates.length} duplicate selector groups`);
  console.log(`Contracts: ${sharedDropzones.length}/3 dropzones; ${pageBackCount} page-back render paths; ${cssOnlyClasses.length} unexplained CSS-only classes`);
  console.log(`Modules: ${moduleMismatches.length ? `mismatch (${moduleMismatches.join(', ')})` : 'embedded sources match'}; version ${metadataVersion}`);
  console.log(`Colors: ${colors.length} unique hex values; ${bannedLegacyColors.length} banned legacy colors`);
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
}

if (failures.length) process.exitCode = 1;
