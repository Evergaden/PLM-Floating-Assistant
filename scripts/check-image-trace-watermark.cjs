const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const extract = (first, next) => source.slice(source.indexOf('  function ' + first), source.indexOf('  ' + next, source.indexOf('  function ' + first)));
const metadataCode = extract('abbreviateExcelTraceName(', 'function buildExcelTraceWatermark(');
const exportCode = extract('exportSizeImageCanvas(', "let sizeImageWorkerSource = '';");
const version = source.match(/const SCRIPT_VERSION = '([^']+)'/)[1];
const context = { Date, SCRIPT_VERSION: version, state: {}, findCurrentPlmUserName: () => '张三' };
vm.createContext(context); vm.runInContext(metadataCode + exportCode, context);
const trace = context.buildImageTraceWatermark(new Date(2026, 9, 5, 18, 12, 34));
assert.equal(trace, 'PFH · 张＊ · 20261005-181234 · v' + version);
context.findCurrentPlmUserName = () => 'Jane Doe';
assert.match(context.buildImageTraceWatermark(), / · JD · /);
context.findCurrentPlmUserName = () => '';
assert.match(context.buildImageTraceWatermark(), / · U · /);

for (const size of [1600, 3000]) {
  let stamped = false, encoded = false, snapshot;
  const ctx = {
    globalAlpha: 0.8,
    save() { snapshot = this.globalAlpha; },
    restore() { this.globalAlpha = snapshot; },
    setTransform() {},
    fillText(text, x, y, maxWidth) {
      stamped = true;
      assert.equal(text, trace);
      assert.equal(x, size / 2);
      assert.ok(y < size && y > size * 0.98);
      assert.ok(maxWidth < size);
      assert.equal(this.globalAlpha, 0.2);
      assert.equal(this.fillStyle, '#c8c8c8');
    },
  };
  const canvas = { width: size, height: size, getContext: () => ctx, toDataURL() { assert.equal(stamped, true); encoded = true; return 'jpeg'; } };
  assert.equal(context.exportSizeImageCanvas(canvas, { traceWatermark: trace }), 'jpeg');
  assert.equal(ctx.globalAlpha, 0.8, 'canvas drawing state restored');
  assert.equal(encoded, true);
  encoded = false;
  assert.equal(context.exportSizeImageCanvas(canvas, { traceWatermark: trace, returnCanvas: true }), canvas);
  assert.equal(encoded, false, 'worker receives already watermarked canvas');
}
assert.equal((source.match(/return exportSizeImageCanvas\(canvas, renderOptions\);/g) || []).length, 2);
const moduleSource = fs.readFileSync(path.join(__dirname, '../src/parameter-image.module.js'), 'utf8');
assert.equal((moduleSource.match(/context.applyTraceWatermark\(canvas\)/g) || []).length, 2);
assert.ok(source.includes('renderOptions.traceWatermark = payload.traceWatermark;'));
console.log('Image trace metadata, faint drawing, canvas state, and main-thread/worker export checks passed');
