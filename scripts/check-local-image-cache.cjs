const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { indexedDB } = require(process.env.PLM_FAKE_INDEXEDDB || '../tmp/local-image-cache-check/node_modules/fake-indexeddb');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/local-image-cache.module.js'), 'utf8');
let downloads = 0;
function session() {
  const context = vm.createContext({ indexedDB, Blob, URL, Date, Map, Promise,
    fetchLedgerAiImageBlob: async url => { downloads++; if (url.endsWith('fail')) throw new Error('network'); return new Blob(['image'], { type: 'image/png' }); },
  });
  vm.runInContext(source, context); return context;
}
(async () => {
  const first = session();
  await Promise.all([first.getLocalImageBlob('https://test/a'), first.getLocalImageBlob('https://test/a')]);
  assert.equal(downloads, 1, 'concurrent requests are deduplicated');
  const second = session();
  assert.equal((await second.getLocalImageBlob('https://test/a')).size, 5);
  assert.equal(downloads, 1, 'new session reads persisted bytes without downloading');
  let sourceWrites = 0, imageSource = '';
  const cachedImage = { isConnected: true, getAttribute: () => imageSource, addEventListener() {},
    set src(value) { sourceWrites++; imageSource = value; } };
  await second.setLocalImageSource(cachedImage, 'https://test/a');
  const firstSource = imageSource;
  await second.setLocalImageSource(cachedImage, 'https://test/a');
  assert.equal(sourceWrites, 1, 'An already assigned image source is not replaced with another object URL');
  assert.equal(imageSource, firstSource);
  URL.revokeObjectURL(cachedImage.pfhLocalObjectUrl);
  await second.getLocalImageBlob('https://test/a?v=2');
  assert.equal(downloads, 2, 'changed URLs use a distinct cached file');
  await second.localImageTransaction('readwrite', store => store.put({ url: 'https://test/expired', blob: new Blob(['old']), size: 3, savedAt: 1 }));
  await second.getLocalImageBlob('https://test/expired');
  assert.equal(downloads, 3, 'expired files are refreshed');
  await second.localImageTransaction('readwrite', store => store.put({ url: 'https://test/large', blob: new Blob(['x']), size: 100 * 1024 * 1024, savedAt: 2 }));
  await second.trimLocalImageCache(6 * 1024 * 1024);
  const evicted = await second.localImageTransaction('readonly', (store, done) => { const request = store.get('https://test/large'); request.onsuccess = () => done(request.result); });
  assert.equal(evicted, undefined, 'old files are evicted before exceeding disk budget');
  const third = session(); third.localImageTransaction = async () => { throw new Error('quota'); };
  assert.equal((await third.getLocalImageBlob('https://test/private')).size, 5, 'storage denial still displays downloaded bytes');
  const image = { isConnected: true, addEventListener() {} };
  await third.setLocalImageSource(image, 'https://test/fail');
  assert.equal(image.src, 'https://test/fail', 'network failure falls back to normal image loading');
  const fallbackImage = { isConnected: true, addEventListener() {} };
  await third.setLocalImageSource(fallbackImage, 'https://test/fail', 'https://test/thumbnail');
  assert.equal(fallbackImage.pfhLocalImageSource, 'https://test/thumbnail', 'Original download failure uses the available thumbnail');
  assert(fallbackImage.src.startsWith('blob:'));
  URL.revokeObjectURL(fallbackImage.pfhLocalObjectUrl);
  const handlers = [];
  const corruptImage = { isConnected: true, addEventListener(type, callback) { if (type === 'error') handlers.push(callback); } };
  await third.setLocalImageSource(corruptImage, 'https://test/corrupt', 'https://test/thumbnail');
  handlers[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(corruptImage.pfhLocalImageSource, 'https://test/thumbnail', 'A cached blob decoding error also falls back to the thumbnail');
  URL.revokeObjectURL(corruptImage.pfhLocalObjectUrl);
  const detached = { isConnected: false };
  await third.setLocalImageSource(detached, 'https://test/detached');
  assert.equal(detached.src, undefined, 'detached image does not allocate an object URL');
  console.log('Local image cache: persistence, deduplication, changed URLs, expiry, eviction, quota and display fallback passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
