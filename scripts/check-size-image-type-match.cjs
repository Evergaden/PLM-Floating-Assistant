const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
function extract(name, async = false) {
  const from = source.indexOf('  ' + (async ? 'async ' : '') + 'function ' + name + '(');
  assert(from >= 0, name);
  const end = source.indexOf('\n  }', from) + 4;
  return source.slice(from, end);
}
const file = { name: 'carton<&.png' };
const session = { pendingLabelMatches: [{ id: 'pending1', file, cartonError: 'shape <mismatch>' }] };
const calls = [];
let value = 'carton';
const context = vm.createContext({
  state: {}, PANEL_ID: 'panel',
  getActiveSizeImageSku: () => 'SKU1', ensureSizeImageSession: () => session,
  document: { getElementById: () => ({ querySelector: () => ({ value }) }) },
  cssEscape: (text) => text,
  escapeHtml: (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
  formatSizeImageNumber: (number) => String(number), showToast: () => {},
  processSizeImageFile: async (...args) => calls.push(args),
});
vm.runInContext(extract('sizeImagePendingMatchHtml') + '\n' + extract('confirmPendingSizeImageMatch', true), context);
(async () => {
  const specs = [{ key: 'flat-0', kind: 'label', width: 10, height: 4.3 }];
  const html = context.sizeImagePendingMatchHtml(session, { length: 3.8, width: 3.8, height: 11 }, specs);
  assert(html.includes('<option value="">请选择类型与尺寸</option><option value="carton">纸盒 3.8 × 3.8 × 11 cm</option>'));
  assert(html.includes('value="label:flat-0"'));
  assert(html.includes('shape &lt;mismatch>'));
  assert(!html.includes('carton<&'));
  assert(!context.sizeImagePendingMatchHtml(session, null, specs).includes('value="carton"'));
  await context.confirmPendingSizeImageMatch('pending1');
  assert.equal(calls.at(-1)[1], 'carton');
  value = 'label:flat-0'; await context.confirmPendingSizeImageMatch('pending1');
  assert.equal(calls.at(-1)[1], 'label:flat-0');
  value = 'flat-0'; await context.confirmPendingSizeImageMatch('pending1');
  assert.equal(calls.at(-1)[1], 'label:flat-0', 'old select values remain compatible');
  const count = calls.length;
  value = ''; await context.confirmPendingSizeImageMatch('pending1');
  assert.equal(calls.length, count, 'do not silently select the first label');
  value = 'carton'; context.state.sizeImageBusySku = 'SKU1';
  await context.confirmPendingSizeImageMatch('pending1');
  assert.equal(calls.length, count);
  const imagePath = process.argv[2];
  if (imagePath) {
    const { createCanvas, loadImage } = require(process.env.PLM_CANVAS_MODULE || '@napi-rs/canvas');
    const geometryContext = vm.createContext({ createSizeImageCanvas: createCanvas });
    for (const name of ['getSizeImageSourceDimensions', 'getCartonBodyWidths', 'analyzeSizeImageGeometry']) vm.runInContext(extract(name), geometryContext);
    const image = await loadImage(imagePath);
    const spec = { length: 3.8, width: 3.8, height: 11, extraWidths: [] };
    const geometry = geometryContext.analyzeSizeImageGeometry(image, spec);
    assert(Math.abs(geometry.pixelsPerCmX - geometry.pixelsPerCmY) / geometry.pixelsPerCmX < .045);
    console.log('Attached transparent carton passes geometry check at 3.8 x 3.8 x 11 cm.');
  }
  console.log('PASS: carton/label options, explicit selection, escaped diagnostics, compatible routing and busy guard.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
