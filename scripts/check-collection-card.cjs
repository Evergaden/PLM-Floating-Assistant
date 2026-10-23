const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.user.js'), 'utf8');
const start = source.indexOf('  function homeCollectionCardHtml(');
const context = vm.createContext({ state: {}, escapeHtml: text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') });
vm.runInContext(source.slice(start, source.indexOf('  function homeViewHtml(', start)), context);
assert(context.homeCollectionCardHtml().includes('开始采集'));
context.state.catalogSyncRunning = true;
context.state.catalogCollection = { phase: 'waiting', count: 20, total: 1250, page: 1 };
let html = context.homeCollectionCardHtml();
assert(html.includes('20 / 1250'));
assert(html.includes('等待下一批'));
assert(html.includes('暂停采集'));
context.state.catalogSyncPaused = true;
context.state.catalogCollection.phase = 'paused';
assert(context.homeCollectionCardHtml().includes('继续采集'));
context.state.catalogSyncRunning = false;
context.state.catalogCollection = { phase: 'error', error: '<img onerror="bad">' };
html = context.homeCollectionCardHtml();
assert(html.includes('&lt;img'));
assert(html.includes('重新采集'));
assert(!html.includes('<img onerror'));
context.state.catalogCollection = { phase: 'done', count: 1250, total: 1250, page: 63, unique: 1240, added: 334 };
assert(context.homeCollectionCardHtml().includes('新增 334'));
for (const file of ['plm-material-summary.user.js', 'plm-material-summary.workspace-preview.user.js']) {
  const built = fs.readFileSync(path.join(root, 'outputs', file), 'utf8');
  assert.equal(JSON.parse(built.match(/const HOME_COLLECTION_CSS = (.*);/)[1]), fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/ui-src/modules/home-collection.css'), 'utf8'));
}
(async () => {
  let requests = 0, fallbacks = 0, waits = 0, auth;
  const transport = vm.createContext({ AbortController,
    window: { setTimeout, clearTimeout },
    fetch: async (url, options) => { requests++; auth = options.headers.Authorization; return { ok: false, status: 429 }; },
    getPlmAuthHeaders: () => ({ Authorization: 'test-session' }),
    reportDiagnosticRequest() {}, wait: async () => { waits++; },
    GM_xmlhttpRequest() { fallbacks++; },
  });
  const from = source.indexOf('  async function fetchPlmJson(');
  vm.runInContext(source.slice(from, source.indexOf('  function formatPlmApiMessage(', from)), transport);
  await assert.rejects(transport.fetchPlmJson('/api/ChemicalNewAll/GetList', { singleAttempt: true }), /HTTP 429/);
  assert.equal(requests, 1, 'rate limit stops after one request');
  assert.equal(fallbacks, 0, 'no alternate transport retries after rate limit');
  assert.equal(waits, 0);
  assert.equal(auth, 'test-session', 'first attempt uses available page authorization');
  console.log('Collection card states, escaped errors, embedded CSS and single-attempt rate-limit handling passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
