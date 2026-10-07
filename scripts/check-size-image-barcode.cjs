const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createCanvas, loadImage, GlobalFonts } = require(process.env.PLM_CANVAS_MODULE || '@napi-rs/canvas');
if (process.env.PLM_CJK_FONT) GlobalFonts.registerFromPath(process.env.PLM_CJK_FONT, 'Microsoft YaHei');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const texts = [];

function extract(name) {
  const from = source.indexOf('  function ' + name + '(');
  assert(from >= 0, name);
  const rest = source.slice(from + 1);
  const next = rest.search(/\n  (?:async )?function /);
  assert(next >= 0, name);
  return source.slice(from, from + 1 + next);
}

function OffscreenCanvas(width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const fillText = context.fillText.bind(context);
  context.fillText = (text, ...args) => { texts.push(String(text)); return fillText(text, ...args); };
  canvas.convertToBlob = async () => new Blob([canvas.toBuffer('image/jpeg')], { type: 'image/jpeg' });
  return canvas;
}

const context = vm.createContext({
  OffscreenCanvas, Blob, sizeImageWorkerSource: '',
  buildImageTraceWatermark: () => ({}),
  getSizeImageSpec: (data) => data && data.carton || null,
  getLabelSizeImageSpec: () => ({ kind: 'label' }),
  getSizeImageTitle: () => '标签（圆弧 食品两年）',
  drawImageTraceWatermark: function drawImageTraceWatermark() {},
});
const names = [
  'clamp', 'trimNumber', 'formatSizeImageNumber', 'createSizeImageCanvas', 'exportSizeImageCanvas',
  'getSizeImageSourceDimensions', 'getCartonBodyWidths', 'drawSizeImageLine',
  'isDoubleSidedPrintedBagSizeImage', 'drawSizeImageContained', 'drawPrintedBagSealDimension',
  'traceSizeImageRoundedRect', 'traceCartonSizeImageOutline', 'matchFlatSizeImageRatio',
  'analyzeSizeImageGeometry', 'analyzeLabelSizeImageGeometry', 'hasSizeImageBarcodePixels',
  'detectSizeImageBarcode', 'getLabelBatchNoteText', 'shouldUseFullLabelDateRemark',
  'generateSizeImageJpeg', 'generateLabelSizeImageJpeg', 'getSizeImageWorkerSource',
];
vm.runInContext(names.map(extract).join('\n'), context);

function sampleBarcode(rotated) {
  const canvas = createCanvas(640, 240);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 640, 240);
  ctx.fillStyle = '#000000';
  let x = 30;
  for (let index = 0; index < 34; index++) {
    const width = 2 * (index % 3 + 1);
    ctx.fillRect(x, 70, width, 90);
    x += width + 2 * (index % 2 + 1);
  }
  if (!rotated) return canvas;
  const output = createCanvas(240, 640);
  const out = output.getContext('2d');
  out.translate(240, 0); out.rotate(Math.PI / 2); out.drawImage(canvas, 0, 0);
  return output;
}

function detect(image) {
  return context.detectSizeImageBarcode(image, { cropX: 0, cropY: 0, cropWidth: image.width, cropHeight: image.height });
}

async function workerRender(image, cartonSpec, includeBatchNumber) {
  texts.length = 0;
  let result;
  const worker = vm.createContext({
    OffscreenCanvas, Blob, createImageBitmap: async (file) => file,
    self: { postMessage: (value) => { result = value; } },
  });
  vm.runInContext(context.getSizeImageWorkerSource(), worker);
  await worker.self.onmessage({ data: {
    file: image, fileName: 'label.png', preferredType: 'label:flat',
    cartonSpec, labelSpecs: [{ key: 'flat', kind: 'label', width: image.width / 100, height: image.height / 100 }],
    includeRemark: true, includeRoundArc: true, includeBatchNumber,
    renderMeta: { labels: { flat: { titleText: '标签（圆弧 食品两年）', batchNoteText: '（批次号）' } } },
    traceWatermark: {},
  } });
  assert(result && result.ok, result && result.error);
  assert.equal(result.status, 'ready');
  return result;
}

(async () => {
  assert(detect(sampleBarcode(false)), 'horizontal barcode');
  assert(detect(sampleBarcode(true)), 'rotated barcode');
  const blank = createCanvas(640, 240);
  const blankCtx = blank.getContext('2d');
  blankCtx.fillStyle = 'white'; blankCtx.fillRect(0, 0, 640, 240);
  assert(!detect(blank), 'blank image');
  blankCtx.fillStyle = 'black'; blankCtx.font = '22px sans-serif';
  blankCtx.fillText('Supplement Facts 0123456789 ABCDEFGHIJKLMNOP', 10, 90);
  for (let y = 110; y < 190; y += 20) blankCtx.fillRect(10, y, 600, 2);
  assert(!detect(blank), 'text and table rules must not count as a barcode');
  assert(context.shouldUseFullLabelDateRemark({ brand: 'OTHER' }, { kind: 'label' }, true));
  assert(!context.shouldUseFullLabelDateRemark({ brand: 'OTHER', carton: {} }, { kind: 'label' }, true));
  assert(!context.shouldUseFullLabelDateRemark({ brand: 'OTHER' }, { kind: 'print' }, true));
  assert(!context.shouldUseFullLabelDateRemark({ brand: 'OTHER' }, { kind: 'label' }, false));
  assert(context.shouldUseFullLabelDateRemark({ brand: 'DOCTEAT' }, { kind: 'label' }, false), 'preserve existing brand rule');

  await workerRender(sampleBarcode(true), null, true);
  assert(texts.includes('（生产日期+截止日期+批次号）'), 'worker full date note');
  await workerRender(sampleBarcode(true), { length: 10, width: 5, height: 5 }, true);
  assert(texts.includes('（批次号）'), 'carton product keeps existing note');
  await workerRender(sampleBarcode(true), null, false);
  assert(!texts.some((text) => text.includes('批次号')), 'unchecked batch option hides the note');

  if (process.argv[2]) {
    const image = await loadImage(process.argv[2]);
    assert(detect(image), 'user supplied label barcode');
    const cropped = createCanvas(Math.round(image.width * 0.88), image.height);
    cropped.getContext('2d').drawImage(image, 0, 0);
    assert(!detect(cropped), 'same label with barcode removed');
    const spec = { key: 'flat', kind: 'label', width: 16.9, height: 6.2 };
    const geometry = context.analyzeLabelSizeImageGeometry(image, spec, true);
    geometry.hasBarcode = context.detectSizeImageBarcode(image, geometry);
    texts.length = 0;
    const output = context.generateLabelSizeImageJpeg(image, geometry, spec, { brand: 'OTHER' }, true, true, true, '', { returnCanvas: true, traceWatermark: {} });
    assert(texts.includes('（生产日期+截止日期+批次号）'), 'main-thread full date note');
    if (process.argv[3]) fs.writeFileSync(process.argv[3], output.toBuffer('image/jpeg'));
    await workerRender(image, null, true);
    assert(texts.includes('（生产日期+截止日期+批次号）'), 'worker recognizes supplied label');
  }
  console.log('Size-image barcode and batch-note checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
