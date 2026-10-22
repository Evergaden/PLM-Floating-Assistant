const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../ui-src/label-studio/psd-export.js'), 'utf8');
const encode = vm.runInNewContext(source + '\ncanvasToFlatPsdBlob;', { Blob });

function decode(buffer, width, height) {
  assert.equal(buffer.toString('ascii', 0, 4), '8BPS');
  assert.equal(buffer.readUInt32BE(14), height);
  assert.equal(buffer.readUInt32BE(18), width);
  assert.equal(buffer.readUInt32BE(46) / 65536, 1905);
  const method = buffer.readUInt16BE(66);
  const rgb = Buffer.alloc(width * height * 3);
  if (method === 0) {
    buffer.copy(rgb, 0, 68);
    assert.equal(buffer.length, 68 + rgb.length);
    return rgb;
  }
  assert.equal(method, 1);
  let at = 68 + height * 3 * 2;
  for (let row = 0; row < height * 3; row++) {
    const length = buffer.readUInt16BE(68 + row * 2);
    const end = at + length;
    let out = row * width;
    while (at < end) {
      const control = buffer.readInt8(at++);
      if (control >= 0) {
        const n = control + 1;
        buffer.copy(rgb, out, at, at + n);
        at += n; out += n;
      } else if (control !== -128) {
        const n = 1 - control;
        rgb.fill(buffer[at++], out, out + n); out += n;
      }
    }
    assert.equal(at, end);
    assert.equal(out, (row + 1) * width);
  }
  assert.equal(at, buffer.length);
  return rgb;
}

async function test(width, height, value) {
  const rgba = Uint8Array.from({ length: width * height * 4 }, (_, i) => i % 4 === 3 ? 255 : value(i));
  const canvas = { width, height, getContext: () => ({ getImageData: () => ({ data: rgba }) }) };
  const buffer = Buffer.from(await encode(canvas, 1905).arrayBuffer());
  const decoded = decode(buffer, width, height);
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < width * height; i++) assert.equal(decoded[c * width * height + i], rgba[i * 4 + c]);
  }
  assert(buffer.length <= 68 + width * height * 3, 'raw fallback must prevent size growth');
}

(async () => {
  for (const width of [1, 2, 3, 127, 128, 129, 130, 255, 256, 257, 3000]) {
    await test(width, 4, () => 255);
    await test(width, 4, (i) => (i * 73 + (i >>> 3) * 17) % 256);
    await test(width, 4, (i) => Math.floor(i / 4) % 7 < 3 ? 30 : (i * 97) % 256);
  }
  console.log('PSD lossless check passed: 33 fixtures; RLE runs/literals, 128-byte boundaries, RGB ordering, DPI and raw fallback');
})().catch((error) => { console.error(error); process.exitCode = 1; });
