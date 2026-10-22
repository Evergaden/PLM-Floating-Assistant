const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const preview = process.argv.includes('--preview');
const workspacePreview = process.argv.includes('--workspace-preview');
if (preview && workspacePreview) throw new Error('Choose --preview or --workspace-preview');
const fullOutputPath = path.join(root, 'outputs', 'plm-material-summary.workspace-preview.user.js');
const outputPath = path.join(root, 'outputs', workspacePreview
  ? 'plm-material-summary.workspace-preview.min.user.js' : preview
  ? 'plm-material-summary.min.preview.user.js'
  : 'plm-material-summary.min.user.js');
let source = fs.readFileSync(sourcePath, 'utf8');
const lucianModule = fs.readFileSync(path.join(root, 'src', 'lucian-preview.module.js'), 'utf8').trimEnd();
const lucianModulePattern = /  \/\/ <lucian-preview-module>[\s\S]*?  \/\/ <\/lucian-preview-module>/;
if (!lucianModulePattern.test(source)) throw new Error('Lucian module build marker is missing');
source = source.replace(lucianModulePattern, () => '  // <lucian-preview-module>\n' + lucianModule + '\n  // </lucian-preview-module>');
// All installable builds need the layout CSS because users can switch at runtime.
// This generated literal is synced from the canonical ui-src module.
const cssPath = path.join(root, 'cloudflare', 'plm-cloud-backup', 'ui-src', 'modules', 'workspace-preview.css');
const css = fs.readFileSync(cssPath, 'utf8');
if (!/^  const WORKSPACE_PREVIEW_CSS = .*;$/m.test(source)) throw new Error('Workspace CSS build marker is missing');
let syncedSource = source.replace(/^  const WORKSPACE_PREVIEW_CSS = .*;$/m, () => '  const WORKSPACE_PREVIEW_CSS = ' + JSON.stringify(css) + ';');
const lucianCss = fs.readFileSync(path.join(root, 'cloudflare', 'plm-cloud-backup', 'ui-src', 'modules', 'lucian-preview.css'), 'utf8');
syncedSource = syncedSource.replace(/^  const LUCIAN_PREVIEW_CSS = .*;$/m, () => '  const LUCIAN_PREVIEW_CSS = ' + JSON.stringify(lucianCss) + ';');
const filterCss = fs.readFileSync(path.join(root, 'cloudflare', 'plm-cloud-backup', 'ui-src', 'modules', 'sku-search-filters.css'), 'utf8');
if (!/^  const SKU_FILTER_MODAL_CSS = .*;$/m.test(syncedSource)) throw new Error('Filter CSS build marker is missing');
syncedSource = syncedSource.replace(/^  const SKU_FILTER_MODAL_CSS = .*;$/m, () => '  const SKU_FILTER_MODAL_CSS = ' + JSON.stringify(filterCss) + ';');
const ledgerCss = fs.readFileSync(path.join(root, 'cloudflare', 'plm-cloud-backup', 'ui-src', 'modules', 'ledger-workspace.css'), 'utf8');
if (!/^  const LEDGER_WORKSPACE_CSS = .*;$/m.test(syncedSource)) throw new Error('Ledger CSS build marker is missing');
syncedSource = syncedSource.replace(/^  const LEDGER_WORKSPACE_CSS = .*;$/m, () => '  const LEDGER_WORKSPACE_CSS = ' + JSON.stringify(ledgerCss) + ';');
if (syncedSource !== fs.readFileSync(sourcePath, 'utf8')) fs.writeFileSync(sourcePath, syncedSource, 'utf8');
source = syncedSource;
if (workspacePreview) {
  source = source
    .replace("const WORKSPACE_PREVIEW = false;", 'const WORKSPACE_PREVIEW = true;')
    // Preserve @name/@namespace so updating retains the manager's GM cache.
    .replace('// @description  ', '// @description  [布局验证版] ');
  if (!source.includes('const WORKSPACE_PREVIEW = true;') || !source.includes(css.slice(0, 50))) {
    throw new Error('Workspace preview build markers are missing');
  }
  fs.writeFileSync(fullOutputPath, source, 'utf8');
  console.log(`Wrote ${path.relative(root, fullOutputPath)}`);
}
const metadataEndMarker = '// ==/UserScript==';
const metadataEnd = source.indexOf(metadataEndMarker);

if (metadataEnd < 0) throw new Error('userscript metadata marker is missing');

const metadata = source.slice(0, metadataEnd + metadataEndMarker.length).trimEnd();
const licenses = (source.match(/\/\* @license[\s\S]*?\*\//g) || []).join('\n\n');
const npxCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
const npx = process.platform === 'win32' && fs.existsSync(npxCli) ? process.execPath : 'npx';
const npxArgs = [
  '--yes',
  'terser@5.44.0',
  workspacePreview ? fullOutputPath : sourcePath,
  '--compress',
  '--mangle',
  // Worker source serializes functions and calls them by name inside strings.
  // Preserve those names and their references in compressed installable builds.
  '--keep-fnames',
  '--comments',
  'false',
  ...(preview ? ['--format', 'beautify=true,semicolons=false,max_line_len=2000'] : []),
];
const result = spawnSync(npx, process.platform === 'win32' && fs.existsSync(npxCli) ? [npxCli, ...npxArgs] : npxArgs, {
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
  stdio: ['ignore', 'pipe', 'inherit'],
});

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Terser failed with exit code ${result.status}`);

const minified = String(result.stdout || '')
  .trim()
  .split(/\r?\n/)
  .map((line) => line.trimEnd())
  .join('\n');
if (!minified) throw new Error('Terser returned an empty output');

fs.writeFileSync(outputPath, `${metadata}\n\n${licenses ? `${licenses}\n\n` : ''}${minified}\n`, 'utf8');
console.log(`Wrote ${path.relative(root, outputPath)}`);
