const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const lucide = require('lucide-react');
const root = path.resolve(__dirname, '..');
// Render the installed Lucide library at build time; never hand-draw icon paths.
const iconNames = { tag: 'Tags', upload: 'ImagePlus', image: 'Image', preview: 'ScanLine', plus: 'Plus', x: 'X', download: 'Download', file: 'FileDown', loader: 'LoaderCircle', shield: 'ShieldCheck', ruler: 'Ruler', trash: 'Trash2' };
const icons = Object.fromEntries(Object.entries(iconNames).map(([name, component]) => [name,
  renderToStaticMarkup(React.createElement(lucide[component], { className: 'studio-icon' + (name === 'loader' ? ' icon-spin' : ''), size: 20, strokeWidth: 1.75, 'aria-hidden': 'true', focusable: 'false' }))
]));
const iconRuntime = '// Generated from lucide-react (ISC license). Do not hand-edit paths.\n' +
  'window.LabelIcons = Object.freeze(' + JSON.stringify(icons) + ');\n';
const html = fs.readFileSync(path.join(root, 'ui-src/label-studio/index.html'), 'utf8')
  .replace(/<span data-icon="([a-z]+)" aria-hidden="true"><\/span>/g, (_, name) => {
    if (!icons[name]) throw new Error('Unknown studio icon: ' + name);
    return icons[name];
  });
const script = fs.readFileSync(path.resolve(root, '../../outputs/plm-material-summary.user.js'), 'utf8');
const names = ['renderToyLabelPrintCanvas', 'renderToyLabelPreviewCanvas', 'drawDimensionGuide', 'drawLineWithTicks', 'trimCm', 'loadImage', 'drawImageContained', 'trimImageWhitespace', 'canvasToBlob', 'renderCode128Barcode', 'canvasToFlatPsdBlob'];
const functions = names.map((name) => {
  const start = script.search(new RegExp('^  (?:async )?function ' + name + '\\(', 'm'));
  if (start < 0) throw new Error('Missing label engine function: ' + name);
  const rest = script.slice(start);
  const next = rest.slice(1).search(/\n  (?:async )?function /);
  if (next < 0) throw new Error('Cannot locate label engine boundary: ' + name);
  let code = rest.slice(0, next + 1).trimEnd().replace(/\r\n/g, '\n');
  if (name === 'renderToyLabelPrintCanvas') {
    if ((code.match(/\* 300\)/g) || []).length !== 2) throw new Error('Review changed label print resolution before adapting it');
    // 3000x2250 preserves product detail while keeping the physical 4x3cm.
    code = code.replace(/\* 300\)/g, '* 750)');
  }
  if (name === 'renderToyLabelPreviewCanvas') {
    code = code.replace('const ctx = canvas.getContext(\'2d\');', "const ctx = canvas.getContext('2d');\n    ctx.imageSmoothingQuality = 'high';");
  }
  if (name === 'drawImageContained') code = fs.readFileSync(path.join(root, 'ui-src/label-studio/render-quality.js'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  if (name === 'canvasToFlatPsdBlob') code = fs.readFileSync(path.join(root, 'ui-src/label-studio/psd-export.js'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  return code;
});
const engine = '// Generated from the existing userscript by build-label-studio.cjs.\n' +
  "(() => {\n  'use strict';\n" + functions.join('\n\n') +
  '\n  window.LabelEngine = Object.freeze({renderToyLabelPrintCanvas, renderToyLabelPreviewCanvas, canvasToBlob, canvasToFlatPsdBlob, PRINT_DPI:1905});\n})();\n';
const outputs = {
  'index.html': html,
  'app.js': fs.readFileSync(path.join(root, 'ui-src/label-studio/app.js'), 'utf8'),
  'app.css': fs.readFileSync(path.join(root, 'ui-src/modules/label-studio.css'), 'utf8'),
  'engine.js': engine,
  'icons.js': iconRuntime,
  'lucide-LICENSE.txt': fs.readFileSync(path.join(root, 'node_modules/lucide-react/LICENSE'), 'utf8'),
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
