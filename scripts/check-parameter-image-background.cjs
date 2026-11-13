const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/parameter-image.module.js'), 'utf8');
function extract(name) {
  const start = source.indexOf('    function ' + name + '(');
  assert(start >= 0, name);
  for (let end = source.indexOf('}', start); end >= 0; end = source.indexOf('}', end + 1)) {
    const candidate = source.slice(start, end + 1);
    try { new vm.Script('(' + candidate + ')'); return candidate; } catch (_) {}
  }
  throw new Error(name);
}
const sandbox = vm.createContext({ dimensionLabel: () => '4.6cm/1.81inch', number: Number });
for (const name of ['removeConnectedWhiteBackground', 'dimensionLayoutBox', 'dimensionOverlapArea', 'chooseDimensionPlacement', 'editorDimensionGeometry', 'isParameterPngFile', 'fitSource']) vm.runInContext(extract(name), sandbox);
const pixels = new Uint8ClampedArray(20 * 20 * 4).fill(255);
for (let y = 5; y < 15; y++) for (let x = 5; x < 15; x++) {
  if (x === 5 || x === 14 || y === 5 || y === 14) pixels.set([220, 220, 220, 255], (y * 20 + x) * 4);
}
assert.equal(sandbox.removeConnectedWhiteBackground(pixels, 20, 20), 300);
assert.equal(pixels[(10 * 20 + 10) * 4 + 3], 255, 'enclosed white packaging stays opaque');
assert.equal(pixels[3], 0, 'frame-connected white is removed');
assert.equal(pixels[(5 * 20 + 5) * 4 + 3], 255, 'low contrast carton edge is retained');
for (const name of ['a.jpg', 'a.JPEG', 'a.webp', 'a.png']) assert(sandbox.isParameterPngFile({ name }));
assert(!sandbox.isParameterPngFile({ name: 'a.svg', type: 'image/svg+xml' }));
const ctx = { save() {}, restore() {}, measureText: () => ({ width: 280 }) };
const geometry = sandbox.editorDimensionGeometry(ctx, { x: 400, y: 100 }, { x: 400, y: 1100 }, 13.2, 1, {}, 1);
assert.equal(geometry.angle, -Math.PI / 2, 'left height text faces the product');
const obstacles = [{ left: 400, top: 200, right: 700, bottom: 1000 }, { left: 720, top: 200, right: 1100, bottom: 1040 }];
const placement = sandbox.chooseDimensionPlacement(ctx, { x: 675, y: 1000 }, { x: 720, y: 960 }, 4.6, 1, { avoidBoxes: obstacles.slice(), bounds: { left: 30, top: 30, right: 1570, bottom: 1530 } });
assert.equal(placement.textAngle, 0, 'short depth dimension can use horizontal text');
for (const rect of obstacles) {
  assert.equal(sandbox.dimensionOverlapArea(placement.box.textBox, rect), 0, 'text avoids products');
  assert.equal(sandbox.dimensionOverlapArea(placement.box.lineBox, rect), 0, 'line avoids products');
}
const fit = sandbox.fitSource(null, { sourceWidth: 3000, sourceHeight: 3000, box: { left: 400, top: 600, right: 1000, bottom: 2400 }, product: { left: 1100, top: 900, right: 2000, bottom: 2400 } }, { x: 380, y: 230, width: 840, height: 1080 });
assert.equal(fit.scale, .525, 'white source margins do not shrink the product');
console.log('Parameter white background, input formats, facing direction and collision placement checks passed');
module.exports = { extract, source };
