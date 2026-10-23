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
assert(context.homeCollectionCardHtml().includes('aria-valuenow="100"'));
assert(context.homeCollectionCardHtml().includes('u083-fill'));
const modules = source.slice(source.indexOf('    const carouselModules = ['), source.indexOf('    const carouselSlides ='));
assert(modules.includes("id: 'collection', label: '采集详情', html: homeCollectionCardHtml()"));
assert(!source.includes('      homeCollectionCardHtml() +'), 'collection is only a carousel page');
let reduced = false, hidden = false, determinate = true, paused = false;
const animations = [];
function animate(frames, options) { const animation = { frames, options, cancelled: false, cancel() { this.cancelled = true; } }; animations.push(animation); return animation; }
const fill = { style: { getPropertyValue: () => '.4' }, animate };
const segments = [{ animate }, { animate }];
const progress = { classList: { contains: name => name === 'is-det' ? determinate : paused }, querySelector: () => fill, querySelectorAll: () => segments };
const card = { querySelector: () => progress, closest: () => ({ getAttribute: () => String(hidden) }) };
context.window = { matchMedia: () => ({ matches: reduced }) };
context.animateHomeCollectionProgress(card, '.2');
assert.equal(animations[0].options.duration, 500);
context.animateHomeCollectionProgress(card, '.4');
assert.equal(animations[0].cancelled, false, 'same-value state refresh preserves the fill animation');
reduced = true; context.animateHomeCollectionProgress(card);
assert.equal(animations[0].cancelled, true);
reduced = false; determinate = false; context.animateHomeCollectionProgress(card);
assert.equal(animations.length, 3);
assert.equal(animations[1].options.duration, 1600);
assert.equal(animations[2].options.delay, 550);
paused = true; context.animateHomeCollectionProgress(card);
assert(animations[1].cancelled && animations[2].cancelled, 'pause stops both continuous segments');
paused = false; hidden = true; context.animateHomeCollectionProgress(card);
assert.equal(animations.length, 3, 'offscreen carousel does not start animations');
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
