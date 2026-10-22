const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.resolve(root, '../../outputs/plm-material-summary.user.js'), 'utf8');
const names = ['renderToyLabelPrintCanvas', 'renderToyLabelPreviewCanvas', 'drawDimensionGuide', 'drawLineWithTicks', 'trimCm', 'loadImage', 'drawImageContained', 'trimImageWhitespace', 'canvasToBlob', 'renderCode128Barcode', 'canvasToFlatPsdBlob'];
const functions = names.map((name) => {
  const start = script.search(new RegExp('^  (?:async )?function ' + name + '\\(', 'm'));
  if (start < 0) throw new Error('Missing label engine function: ' + name);
  const rest = script.slice(start);
  const next = rest.slice(1).search(/\n  (?:async )?function /);
  if (next < 0) throw new Error('Cannot locate label engine boundary: ' + name);
  return rest.slice(0, next + 1).trimEnd().replace(/\r\n/g, '\n');
});
const engine = '// Generated from the existing userscript by build-label-studio.cjs.\n' +
  "(() => {\n  'use strict';\n" + functions.join('\n\n') +
  '\n  window.LabelEngine = Object.freeze({renderToyLabelPrintCanvas, renderToyLabelPreviewCanvas, canvasToBlob, canvasToFlatPsdBlob});\n})();\n';
const outputs = {
  'index.html': fs.readFileSync(path.join(root, 'ui-src/label-studio/index.html'), 'utf8'),
  'app.js': fs.readFileSync(path.join(root, 'ui-src/label-studio/app.js'), 'utf8'),
  'app.css': fs.readFileSync(path.join(root, 'ui-src/modules/label-studio.css'), 'utf8'),
  'engine.js': engine,
};
const check = process.argv.includes('--check');
const dest = path.join(root, 'static/label-studio');
if (!check) fs.mkdirSync(dest, { recursive: true });
for (const [name, value] of Object.entries(outputs)) {
  if (check) {
    if (!fs.existsSync(path.join(dest, name)) || fs.readFileSync(path.join(dest, name), 'utf8') !== value) throw new Error('Label studio output stale: ' + name);
  } else fs.writeFileSync(path.join(dest, name), value);
}
console.log('Label studio ' + (check ? 'checked' : 'built') + ': original rendering engine + standalone assets');
