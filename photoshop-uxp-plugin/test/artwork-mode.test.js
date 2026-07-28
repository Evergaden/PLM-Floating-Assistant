const assert = require('assert');
const {
  selectionRatio,
  filenameKind,
  detectArtworkMode,
} = require('../artwork-mode');

assert.equal(filenameKind('纸盒（3x3x11.1cm）MTL00061827.psd'), 'box');
assert.equal(filenameKind('标签 贴纸 MTL00061827.psd'), 'label');
assert.equal(selectionRatio({ left: 0, top: 0, right: 400, bottom: 100 }), 4);
assert.equal(detectArtworkMode('纸盒 MTL00061827.psd', { left: 0, top: 0, right: 400, bottom: 500 }), 'box-portrait');
assert.equal(detectArtworkMode('纸盒 MTL00061827.psd', { left: 0, top: 0, right: 800, bottom: 400 }), 'box-wide');
assert.equal(detectArtworkMode('标签 MTL00061827.psd', { left: 0, top: 0, right: 800, bottom: 400 }), 'label');
assert.equal(detectArtworkMode('标签 MTL00061827.psd', { left: 0, top: 0, right: 1400, bottom: 400 }), 'label-wide');

console.log('artwork mode: ok');
