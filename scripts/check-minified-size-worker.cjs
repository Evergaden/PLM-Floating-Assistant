const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createCanvas, loadImage } = require(process.env.PLM_CANVAS_MODULE || '@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
function extract(source, name) {
  const match = new RegExp('\\bfunction\\s+' + name + '\\s*\\(').exec(source);
  assert(match, 'Missing preserved function name: ' + name);
  for (let end = source.indexOf('}', match.index); end >= 0; end = source.indexOf('}', end + 1)) {
    const candidate = source.slice(match.index, end + 1);
    try { new vm.Script('(' + candidate + ')'); return candidate; } catch (_) {}
  }
  throw new Error('Cannot extract ' + name);
}
const names = ['clamp', 'trimNumber', 'formatSizeImageNumber', 'createSizeImageCanvas', 'drawImageTraceWatermark', 'exportSizeImageCanvas', 'getSizeImageSourceDimensions', 'getCartonBodyWidths', 'drawSizeImageLine', 'isDoubleSidedPrintedBagSizeImage', 'drawSizeImageContained', 'drawPrintedBagSealDimension', 'traceSizeImageRoundedRect', 'traceCartonSizeImageOutline', 'matchFlatSizeImageRatio', 'analyzeSizeImageGeometry', 'analyzeLabelSizeImageGeometry', 'hasSizeImageBarcodePixels', 'detectSizeImageBarcode', 'getLabelBatchNoteText', 'generateSizeImageJpeg', 'generateLabelSizeImageJpeg', 'getSizeImageWorkerSource'];
function OffscreenCanvas(width, height) {
  const canvas = createCanvas(width, height);
  canvas.convertToBlob = async () => new Blob([canvas.toBuffer('image/jpeg')], { type: 'image/jpeg' });
  return canvas;
}
async function check(fileName, carton) {
  const source = fs.readFileSync(path.join(root, 'outputs', fileName), 'utf8');
  const context = vm.createContext({ OffscreenCanvas, Blob });
  for (const name of names) vm.runInContext(extract(source, name), context);
  const factoryText = extract(source, 'getSizeImageWorkerSource');
  const cachedName = factoryText.match(/if\s*\(\s*([\w$]+)\s*\)\s*return\s+\1/)[1];
  context[cachedName] = '';
  const workerSource = context.getSizeImageWorkerSource();
  assert.equal(context.getSizeImageWorkerSource(), workerSource, 'cached source is stable');
  const label = createCanvas(600, 300);
  label.getContext('2d').fillRect(0, 0, 600, 300);
  for (const kind of carton ? ['label', 'carton'] : ['label']) {
    let result;
    const worker = vm.createContext({
      OffscreenCanvas, Blob, createImageBitmap: async (image) => image,
      self: { postMessage: (value) => { result = value; } },
    });
    vm.runInContext(workerSource, worker);
    const spec = { length: 3.8, width: 3.8, height: 11, extraWidths: [] };
    await worker.self.onmessage({ data: {
      file: kind === 'carton' ? carton : label, fileName: kind + '.png', fileType: 'image/png',
      preferredType: kind === 'carton' ? '' : 'label:flat', cartonSpec: kind === 'carton' ? spec : null,
      labelSpecs: [{ key: 'flat', kind: 'label', width: 6, height: 3 }],
      includeRemark: true, includeRoundArc: false, includeBatchNumber: false,
      traceWatermark: {}, renderMeta: { carton: { titleText: '纸盒' }, labels: { flat: { titleText: '标签' } } },
    } });
    assert(result && result.ok, fileName + ' ' + kind + ': ' + (result && result.error));
    assert.equal(result.status, 'ready', fileName + ' ' + kind + ' must not fall into manual label matching');
    assert.equal(result.detectedType, kind);
    assert.equal(result.blob.type, 'image/jpeg');
    const output = await loadImage(Buffer.from(await result.blob.arrayBuffer()));
    assert.equal(output.width, 3000); assert.equal(output.height, 3000);
  }
  console.log('PASS actual Worker from ' + fileName + ': ' + (carton ? 'automatic carton + label' : 'label') + ', 3000 x 3000 JPG');
}
(async () => {
  const carton = process.argv[2] ? await loadImage(process.argv[2]) : null;
  for (const file of ['plm-material-summary.user.js', 'plm-material-summary.min.user.js', 'plm-material-summary.workspace-preview.user.js', 'plm-material-summary.workspace-preview.min.user.js']) await check(file, carton);
})().catch((error) => { console.error(error); process.exitCode = 1; });
