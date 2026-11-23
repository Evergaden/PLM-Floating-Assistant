const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/core-tools-size-image.module.js', 'utf8');
const config = fs.readFileSync('src/core-config.module.js', 'utf8');
const events = fs.readFileSync('src/core-events.module.js', 'utf8');
const home = fs.readFileSync('src/core-ledger-detail.module.js', 'utf8');
const take = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));

const groups = vm.runInNewContext(take(config, 'const HOME_FEATURE_DEFINITIONS', '  const DEFAULT_THEME_ID') + '\nnormalizeHomeFeatureGroups({common:["upload"],more:["detail"]})');
assert.equal(groups.common.includes('freeSizeImage'), true);
assert.equal(groups.more.includes('detail'), true);
assert.match(home, /entry\.id === 'freeSizeImage'[\s\S]*?entry\.disabled = !state\.sizeImageAccessEnabled/);
assert.match(events, /action === 'home-size-image' \|\| action === 'home-free-size-image'[\s\S]*?if \(!state\.sizeImageAccessEnabled\)[\s\S]*?return;[\s\S]*?action === 'home-free-size-image'/);

const values = { sku: '', packageSizeText: '2×3×4cm', flatSizeText: '10×2cm', flatKind: 'label', packageTitle: '纸盒', flatTitle: '标签' };
const panel = { querySelector(selector) {
  const key = selector.match(/data-size-image-custom-key="([^"]+)"/)?.[1];
  return key ? { value: values[key] || '', checked: true } : null;
} };
let regenerated = 0;
const state = { sizeImageFreeMode: true, sizeImageCustomData: null, sizeImageSessions: {}, view: 'sizeImage' };
const context = vm.createContext({ state, ensurePanel: () => panel, normalizeData: (x) => x,
  getSizeImageSpec: (x) => x.packageSizeText ? { length: 2, width: 3, height: 4 } : null,
  getLabelSizeImageSpecs: (x) => x.printSizeText ? [{ key: x.printSizeText, kind: x.sizeImageCustomFlatKind }] : [],
  isPrintedBagPackageDimensionData: () => false, expandPanel: () => {}, renderShell: () => {}, showToast: () => {},
  regenerateCurrentSizeImages: () => { regenerated += 1; } });
vm.runInContext(take(source, '  function readSizeImageCustomField(', '  function sizeImageViewHtml(') + '\n' + take(source, '  function ensureSizeImageSession(', '  function sizeImagePendingMatchHtml('), context);
context.saveSizeImageCustomConfig();
assert.equal(state.sizeImageCustomData.sizeImageNoSku, true);
assert.equal(state.sizeImageCustomData.sku, '__PFH_FREE_SIZE__');
assert.equal(state.sizeImageCustomData.sizeImageFreeSku, '');
assert.equal(regenerated, 0);
let session = state.sizeImageSessions.__PFH_FREE_SIZE__;
session.cartonFile = { name: 'box.png' };
session.flatFiles['10×2cm'] = { name: 'label.png' };
session.cartonResultDataUrl = 'old-result';
session.flatResults['10×2cm'] = { dataUrl: 'old-result' };
values.packageSizeText = '3×3×5cm';
values.flatSizeText = '11×2cm';
values.sku = 'SKU123';
context.saveSizeImageCustomConfig();
session = state.sizeImageSessions.__PFH_FREE_SIZE__;
assert.equal(state.sizeImageCustomData.sizeImageFreeSku, 'SKU123');
assert.equal(session.cartonFile.name, 'box.png');
assert.equal(session.flatFiles['11×2cm'].name, 'label.png');
assert.equal(session.cartonResultDataUrl, undefined);
assert.equal(Object.keys(session.flatResults).length, 0);
assert.equal(regenerated, 1);
console.log('free size image access and edit checks passed');
