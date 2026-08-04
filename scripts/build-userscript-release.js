const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'outputs', 'plm-material-summary.user.js');
const outputPath = path.join(root, 'outputs', 'plm-material-summary.min.user.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const metadataEndMarker = '// ==/UserScript==';
const metadataEnd = source.indexOf(metadataEndMarker);

if (metadataEnd < 0) throw new Error('userscript metadata marker is missing');

const metadata = source.slice(0, metadataEnd + metadataEndMarker.length).trimEnd();
const npxCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
const npx = process.platform === 'win32' && fs.existsSync(npxCli) ? process.execPath : 'npx';
const npxArgs = [
  '--yes',
  'terser@5.44.0',
  sourcePath,
  '--compress',
  '--mangle',
  '--comments',
  'false',
];
const result = spawnSync(npx, process.platform === 'win32' && fs.existsSync(npxCli) ? [npxCli, ...npxArgs] : npxArgs, {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Terser failed with exit code ${result.status}`);

const minified = String(result.stdout || '').trim();
if (!minified) throw new Error('Terser returned an empty output');

fs.writeFileSync(outputPath, `${metadata}\n\n${minified}\n`, 'utf8');
console.log(`Wrote ${path.relative(root, outputPath)}`);
