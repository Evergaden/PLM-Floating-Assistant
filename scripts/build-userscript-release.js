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
if (workspacePreview) {
  const cssPath = path.join(root, 'cloudflare', 'plm-cloud-backup', 'ui-src', 'modules', 'workspace-preview.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  source = source
    .replace("const WORKSPACE_PREVIEW = false;", 'const WORKSPACE_PREVIEW = true;')
    .replace("const WORKSPACE_PREVIEW_CSS = '';", () => 'const WORKSPACE_PREVIEW_CSS = ' + JSON.stringify(css) + ';')
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
