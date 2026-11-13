const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const worker = vm.createContext({ Request, Response, URL, console });
vm.runInContext(read('cloudflare/plm-cloud-backup/src/index.js').replace(/^import .+;\r?$/gm, '').replace('export default {', 'const workerExport = {'), worker);
let row = null;
let selectedName = '';
const env = { API_KEY: 'test', DB: { prepare(sql) {
  return { bind(name) { selectedName = name; return this; }, async first() { return row; }, async run() { return {}; } };
} } };
function request(signed = true) {
  const req = new Request('https://test/ai-image/product-development-copywriting', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': 'test' }, body: JSON.stringify({ name: 'Authorized Other User', userName: 'Authorized Other User' }) });
  if (signed) { worker.req = req; vm.runInContext("requestAuthContexts.set(req, { claims: { userName: 'Alice' } })", worker); }
  return req;
}
const state = {};
let currentUser = 'Alice';
let dialogs = 0;
let opened = '';
const frontend = vm.createContext({ state, findCurrentPlmUserName: () => currentUser, openProductDevelopmentTaskWorkspace: (view) => { opened = view; } });
vm.runInContext(read('src/product-development/pd-access.module.js'), frontend);
frontend.showProductDevelopmentPermissionDialog = () => { dialogs++; };
vm.runInContext(read('src/product-development/pd-dispatcher.module.js'), frontend);
(async () => {
  for (const feature of ['review', 'copywriting', 'ingredient']) {
    assert.equal(await worker.requireDevelopmentFeature(request(), env, 'development-' + feature).then((r) => r.status), 403, 'Missing row denies access');
  }
  row = { development_review_enabled: 1, development_copywriting_enabled: 0, development_ingredient_enabled: 0 };
  assert.equal(await worker.requireDevelopmentFeature(request(), env, 'development-review'), null);
  assert.equal(selectedName, 'Alice', 'Use signed identity, never product name or body userName');
  assert.equal((await worker.requireDevelopmentFeature(request(false), env, 'development-review')).status, 403, 'API key alone cannot impersonate a permitted user');
  for (const handler of ['Review', 'OneShot', 'Copywriting']) {
    row = null;
    const response = await worker['handleProductDevelopment' + handler](request(), env);
    assert.equal(response.status, 403, 'Denied before model calls or payload processing');
  }
  state.view = 'home';
  assert.equal(frontend.productDevelopmentHasAccess('development-review'), false);
  frontend.productDevelopmentHandleAction('product-development-review-open');
  assert.equal(dialogs, 1);
  assert.equal(opened, '');
  state.productDevelopmentAccess = { name: 'Alice', 'development-review': true };
  frontend.productDevelopmentHandleAction('product-development-review-open');
  assert.equal(opened, 'review', 'Home entry opens product workspace without a current SKU');
  frontend.productDevelopmentHandleAction('product-development-task-tab', { getAttribute: () => 'copywriting' });
  assert.equal(dialogs, 2, 'Task tabs use the same permission prompt');
  assert.equal(frontend.productDevelopmentFeatureForAction('product-development-copywriting-ingredient-run'), 'development-ingredient');
  assert.equal(frontend.productDevelopmentFeatureForAction('product-development-copywriting-ingredient-confirm'), 'development-copywriting');
  currentUser = 'Bob';
  assert.equal(frontend.productDevelopmentHasAccess('development-review'), false, 'Account changes never inherit another user grant');
  const home = read('src/core-ledger-detail.module.js');
  const page = home.slice(home.indexOf('  function productDevelopmentHomeFeaturePageHtml()'), home.indexOf('  function playProductDevelopmentHomeFeatureRailAnimation'));
  assert(!page.includes('当前 SKU'));
  const art = read('src/product-development/pd-permission-art.module.js').match(/base64,([^']+)/)[1];
  assert.equal(Buffer.from(art, 'base64').subarray(0, 4).toString(), 'RIFF');
  console.log('Development access: default deny, independent flags, signed identity, API denial, workspace routing and embedded illustration passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
