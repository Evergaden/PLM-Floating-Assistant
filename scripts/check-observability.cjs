const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const moduleSource = fs.readFileSync(path.join(root, 'src/observability.module.js'), 'utf8');
const scriptSource = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.user.js'), 'utf8');

function fixture() {
  const saved = new Map();
  const timers = new Map();
  const listeners = new Map();
  let timerId = 0;
  const context = vm.createContext({
    console, URL, Date, crypto: { randomUUID: () => 'event-' + ++timerId },
    SCRIPT_VERSION: 'test', UI_ASSET_VERSION: 'test-ui',
    location: { pathname: '/products' }, navigator: { onLine: true },
    state: { data: { sku: 'SKU00000001' } },
    findSku: (text) => String(text).match(/SKU\d+/i)?.[0] || '',
    GM_getValue: (key, fallback) => saved.get(key) || fallback,
    GM_setValue: (key, value) => saved.set(key, value),
    window: {
      setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
      clearTimeout: (id) => timers.delete(id),
      addEventListener: (type, handler) => listeners.set(type, handler),
    },
    cloudRequest: async () => ({ ok: true }),
    showToast: () => {}, formatErrorMessage: (error) => error.message || String(error),
  });
  vm.runInContext(moduleSource, context);
  const run = (code) => vm.runInContext(code, context);
  return { context, saved, timers, listeners, run, queue: () => run('diagnosticStoreGet()') };
}

function extract(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, start);
  return source.slice(from, to);
}

(async () => {
  const f = fixture();
  assert(f.run("shouldReportDiagnosticLog('warn', '魔法上传任务失败', '文件超过 20MB 上限')"));
  assert(f.run("shouldReportDiagnosticLog('warn', '数据缺失', '缺少物料')"));
  assert(!f.run("shouldReportDiagnosticLog('warn', 'SKU 数据发生变化', '名称已更新')"));
  assert.equal(f.run("inferDiagnosticFeature('生成参数图上传失败')"), 'image');
  f.run("reportDiagnosticFromLog('魔法上传任务失败', 'SKU00000001 | 文件超过 20MB 上限', 'warn')");
  f.run("reportDiagnosticFromLog('魔法上传任务失败', 'SKU00000002 | 文件超过 20MB 上限', 'warn')");
  f.run("reportDiagnosticFromLog('魔法上传任务失败', 'SKU00000001 | 文件超过 20MB 上限', 'warn')");
  assert.equal(f.queue().length, 2, 'dedup must preserve different SKUs');
  assert.equal(f.queue()[0].severity, 'warn');
  assert.notEqual(f.run("createDiagnosticEvent('HTTP 401', {}).fingerprint"), f.run("createDiagnosticEvent('HTTP 500', {}).fingerprint"));
  f.run("reportDiagnosticRequest(new Error('timeout'), '/api/Product/GetProductList?codes=SKU00000003&token=private', 'plm-api', 'GET')");
  assert.equal(f.queue()[2].action, 'GET /api/Product/GetProductList');
  assert.equal(f.queue()[2].sku, 'SKU00000003');
  assert(!f.run("sanitizeDiagnosticText('token=private Bearer abc.def https://host/path?secret=hidden', 600)").includes('private'));
  f.context.cloudRequest = async () => { throw new Error('offline'); };
  await f.run('flushDiagnosticQueue()');
  assert.equal(f.queue().length, 3, 'failed delivery must remain queued');
  const retry = [...f.timers.values()].find((timer) => timer.delay === 2000);
  assert(retry, 'automatic retry must be scheduled');
  f.context.cloudRequest = async () => ({ ok: true });
  await retry.fn();
  assert.equal(f.queue().length, 2, 'success removes only the delivered event');
  f.run('installObservability()');
  const before = f.queue().length;
  f.listeners.get('error')({ target: { src: 'https://example.com/unrelated.js' } });
  assert.equal(f.queue().length, before, 'unrelated page errors must be ignored');
  f.listeners.get('error')({ target: { src: 'https://cdn.example.com/exceljs.min.js' } });
  assert.equal(f.queue().length, before + 1);
  f.run("runDiagnosticAction(function download() { throw new Error('download failed'); }, { target: null })");
  assert.equal(f.queue().at(-1).action, 'download');
  const afterAction = f.queue().length;
  f.run("runDiagnosticAction(function cancelled() { throw { name: 'AbortError', message: 'cancelled' }; }, {})");
  assert.equal(f.queue().length, afterAction);

  const fullStorage = fixture();
  fullStorage.context.GM_setValue = () => { throw new Error('QuotaExceededError'); };
  fullStorage.run("reportDiagnostic('缓存保存失败', { feature: 'storage' })");
  assert.equal(fullStorage.queue().length, 1, 'full storage must retain reports in memory');
  await fullStorage.run('flushDiagnosticQueue()');
  assert.equal(fullStorage.queue().length, 0, 'in-memory reports must still be delivered');

  const transport = fixture();
  vm.runInContext(extract(scriptSource, '  async function cloudRequest(path, options)', '  async function authenticatedCloudRequest'), transport.context);
  transport.context.authenticatedCloudRequest = async () => { throw new Error('network failure'); };
  await assert.rejects(transport.context.cloudRequest('/diagnostics/report', {}));
  assert.equal(transport.queue().length, 0, 'diagnostic transport cannot report itself');
  await assert.rejects(transport.context.cloudRequest('/backup/save', { method: 'POST' }));
  assert.equal(transport.queue().length, 1);

  const deletion = fixture();
  Object.assign(deletion.context, {
    STORAGE_PREFIX: 'sku:',
    normalizeData: (data) => data, sortSkuListItems: (items) => items,
    loadData: () => null, saveIndex: () => {}, queueCloudBackup: () => {}, addLog: () => {},
    GM_deleteValue: (key) => deletion.saved.delete(key),
    state: {
      index: [{ sku: 'SKU00000001' }, { sku: 'SKU00000002' }],
      selectedSku: 'SKU00000001', data: { sku: 'SKU00000001' },
      skuResultGeneration: {}, ingredientHydratingSkus: new Set(), copywritingHydratingSkus: new Set(),
      ingredientHydrateFailedAt: {}, copywritingHydrateFailedAt: {}, sizeImageSessions: {},
    },
  });
  deletion.saved.set('sku:SKU00000001', { sku: 'SKU00000001' });
  vm.runInContext(extract(scriptSource, '  function deleteSkuFromList(sku)', '  function loadData(sku)'), deletion.context);
  deletion.context.deleteSkuFromList('SKU00000001');
  assert.equal(deletion.context.state.index.length, 1);
  assert.equal(deletion.context.state.selectedSku, 'SKU00000002');
  assert(!deletion.saved.has('sku:SKU00000001'));
  deletion.context.deleteSkuFromList('SKU00000002');
  assert.equal(deletion.context.state.selectedSku, '');
  assert.equal(deletion.context.state.data, null);

  const worker = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/src/index.js'), 'utf8');
  const renderer = vm.createContext({
    htmlEscape: (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    formatBeijingDateTime: (value) => value || '',
  });
  vm.runInContext(extract(worker, 'function renderDiagnosticDetails(item)', 'function renderAdminDashboardPage'), renderer);
  const rendered = renderer.renderDiagnosticDetails({ message: '<script>bad</script>', stack: '<img>', severity: 'warn', script_version: '2.9.37' });
  assert(rendered.includes('&lt;script&gt;'));
  assert(!rendered.includes('<script>'));
  assert(rendered.includes('2.9.37'));
  console.log('Observability, retry, deletion, and diagnostic rendering checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
