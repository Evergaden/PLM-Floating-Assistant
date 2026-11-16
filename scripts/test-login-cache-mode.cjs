const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.join(__dirname, '../src', name + '.module.js'), 'utf8');
function extract(source, name) {
  const start = source.search(new RegExp('  (?:async )?function ' + name + '\\('));
  assert(start >= 0, name);
  const end = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, end < 0 ? undefined : start + 3 + end);
}
let calls = 0;
const saved = { sku: 'SKU1', bomRows: [{ name: '纸盒' }], materialDrafts: { box: { materialName: '保留' } } };
const ctx = vm.createContext({
  isWestmonthLoginPage: () => true,
  state: { productDevelopmentTasks: [], productDevelopmentTaskFormData: {}, productDevelopmentTaskDetailData: {} },
  loadProductDevelopmentTaskCache: () => ({ rows: [{ sku: 'SKU1' }] }),
  productDevelopmentReadonlyDetailForTask: () => null,
  getProductDevelopmentReadonlyDetailCacheEntry: () => ({ detail: saved, cachedAt: 1, version: 1 }),
  normalizeData: (x) => x,
  productDevelopmentTaskSeedData: (x) => x,
  productDevelopmentApplyReadonlyDetailState: (task, detail) => detail,
  fetchApiProjectSnapshot: () => { calls++; throw Error('must not fetch'); },
  fetchApiProductSnapshot: () => { calls++; throw Error('must not fetch'); },
});
vm.runInContext(extract(read('product-development/pd-task-views'), 'loadProductDevelopmentTasks'), ctx);
vm.runInContext(extract(read('product-development/pd-task-sync'), 'hydrateProductDevelopmentTaskDetail'), ctx);
vm.runInContext(extract(read('core-plm-api'), 'fetchPlmJson'), ctx);
vm.runInContext(extract(read('core-plm-api'), 'fetchPlmApiJson'), ctx);
(async () => {
  assert.equal((await ctx.loadProductDevelopmentTasks({ force: true }))[0].sku, 'SKU1');
  assert.equal(await ctx.hydrateProductDevelopmentTaskDetail({ sku: 'SKU1' }, { force: true }), saved, 'Even stale cache survives forced refresh');
  assert.equal(calls, 0);
  ctx.getProductDevelopmentReadonlyDetailCacheEntry = () => null;
  assert.equal(await ctx.hydrateProductDevelopmentTaskDetail({ sku: 'SKU2' }, { force: true }), null);
  await assert.rejects(ctx.fetchPlmJson('/api/test'), /缓存模式/);
  await assert.rejects(ctx.fetchPlmApiJson('/api/test', {}), /缓存模式/);
  assert.equal(calls, 0);
  ctx.isWestmonthLoginPage = () => false;
  ctx.PRODUCT_DEVELOPMENT_DETAIL_CACHE_VERSION = 1;
  ctx.PRODUCT_DEVELOPMENT_DETAIL_SYNC_COOLDOWN_MS = 60000;
  ctx.getProductDevelopmentReadonlyDetailCacheEntry = () => ({ detail: saved, cachedAt: Date.now(), version: 1 });
  assert.equal(await ctx.hydrateProductDevelopmentTaskDetail({ sku: 'SKU1' }), saved, 'Fresh cache avoids a PLM request');
  assert.equal(calls, 0);
  ctx.getProductDevelopmentReadonlyDetailCacheEntry = () => ({ detail: saved, cachedAt: 1, version: 1 });
  ctx.fetchApiProjectSnapshot = async () => { calls++; return null; };
  ctx.fetchApiProductSnapshot = async () => { calls++; return null; };
  ctx.fetchProductDevelopmentReadonlyDetail = async () => ({ sku: 'SKU1', bomRows: [] });
  ctx.productDevelopmentPreserveLocalBomState = () => {};
  ctx.productDevelopmentPreserveLocalProductState = () => {};
  ctx.saveProductDevelopmentReadonlyDetailCache = () => {};
  await ctx.hydrateProductDevelopmentTaskDetail({ sku: 'SKU1' });
  assert.equal(calls, 2, 'Stale cache follows the original refresh policy');
  console.log('Login cache mode preserves saved tasks and blocks PLM requests');
})().catch((error) => { console.error(error); process.exitCode = 1; });
