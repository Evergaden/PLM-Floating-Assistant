const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const worker = vm.createContext({ Request, Response, URL, console, crypto: require('node:crypto').webcrypto, btoa, atob, TextEncoder, TextDecoder });
vm.runInContext(read('cloudflare/plm-cloud-backup/src/index.js').replace(/^import .+;\r?$/gm, '').replace('export default {', 'const workerExport = {'), worker);
let row = null;
let selectedName = '';
let selectedNames = [];
const env = { API_KEY: 'test', DB: { prepare(sql) {
  return { bind(...names) { selectedName = names[0]; selectedNames = names; return this; }, async first() { return row; }, async run() { return {}; } };
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
let grants = {};
let responseNames = null;
let authRefreshRequested = false;
const frontend = vm.createContext({
  state, findCurrentPlmUserName: () => currentUser,
  openProductDevelopmentTaskWorkspace: (view) => { opened = view; },
  window: { setTimeout: () => 1, clearTimeout: () => {} },
  readCloudAuthToken: () => ({ user: { name: 'Alice' } }),
  cloudRequest: async (path, options) => {
    assert.equal(path, '/features/development');
    authRefreshRequested = options.forceAuth;
    return { developmentAccess: grants, accessNames: responseNames || [currentUser] };
  },
  renderShell: () => {},
});
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
  const identity = worker.extractPlmUser({ data: { userInfo: { userId: 'ID1', name: 'account', realName: 'Alice', nickname: 'Alice Nick' }, manager: { userId: 'ID2', realName: 'Other User' } } });
  assert(identity.accessNames.includes('Alice'));
  assert(!identity.accessNames.includes('Other User'), 'Aliases must belong to the authenticated user record');
  const tokenEnv = { WORKER_TOKEN_SECRET: 'test-only-development-access-signing-secret' };
  const token = await worker.createWorkerAccessToken(identity, tokenEnv);
  const claims = await worker.verifyWorkerAccessToken(token, tokenEnv);
  assert(claims.accessNames.includes('Alice'), 'Real-name aliases survive signed token creation and verification');
  const aliasRequest = request();
  worker.req = aliasRequest;
  vm.runInContext("requestAuthContexts.set(req, { claims: { userName: 'account', accessNames: ['Alice'] } })", worker);
  assert.equal(await worker.requireDevelopmentFeature(aliasRequest, env, 'development-review'), null);
  assert.deepEqual(selectedNames, ['account', 'Alice'], 'Signed account and real-name aliases both match admin grants');
  const permissionRequest = new Request('https://test/features/development');
  worker.req = permissionRequest;
  vm.runInContext("requestAuthContexts.set(req, { claims: { userName: 'account', accessNames: ['Alice'] } })", worker);
  const permissionResponse = await worker.handleRequest(permissionRequest, env);
  assert.equal(permissionResponse.status, 200);
  const permissionBody = await permissionResponse.json();
  assert.equal(permissionBody.developmentAccess['development-review'], true);
  assert.deepEqual(permissionBody.accessNames, ['account', 'Alice']);
  assert.equal((await worker.requireDevelopmentFeature(request(false), env, 'development-review')).status, 403, 'API key alone cannot impersonate a permitted user');
  for (const handler of ['Review', 'OneShot', 'Copywriting']) {
    row = null;
    const response = await worker['handleProductDevelopment' + handler](request(), env);
    assert.equal(response.status, 403, 'Denied before model calls or payload processing');
  }
  state.view = 'home';
  assert.equal(frontend.productDevelopmentHasAccess('development-review'), false);
  frontend.productDevelopmentHandleAction('product-development-review-open');
  await new Promise(setImmediate);
  assert.equal(dialogs, 1);
  assert.equal(authRefreshRequested, true, 'Old cached auth must refresh before reading the new identity aliases');
  assert.equal(opened, '');
  state.productDevelopmentAccess = { name: 'Alice', 'development-review': true };
  frontend.productDevelopmentHandleAction('product-development-review-open');
  assert.equal(opened, 'review', 'Home entry opens product workspace without a current SKU');
  frontend.productDevelopmentHandleAction('product-development-task-tab', { getAttribute: () => 'copywriting' });
  await new Promise(setImmediate);
  assert.equal(dialogs, 2, 'Task tabs use the same permission prompt');
  grants = { 'development-review': true };
  opened = '';
  frontend.productDevelopmentHandleAction('product-development-review-open');
  await new Promise(setImmediate);
  assert.equal(opened, 'review', 'A newly granted feature opens on click after checking the server again');
  assert.equal(dialogs, 2, 'Fresh grants never show the denial prompt');
  assert.equal(frontend.productDevelopmentFeatureForAction('product-development-copywriting-ingredient-run'), 'development-ingredient');
  assert.equal(frontend.productDevelopmentFeatureForAction('product-development-copywriting-ingredient-confirm'), 'development-copywriting');
  assert.equal(frontend.productDevelopmentHandleAction('product-development-history-view'), false, 'Removed history entry cannot reopen an independent page');
  assert.equal(frontend.productDevelopmentHandleAction('product-development-history-open'), false, 'Removed history action does not load cached records');
  frontend.homeViewHtml = (status) => 'home:' + status;
  state.productDevelopmentView = 'history';
  assert.equal(frontend.productDevelopmentViewHtml('ready'), 'home:ready', 'Stale history view falls back to the home page');
  currentUser = 'Bob';
  assert.equal(frontend.productDevelopmentHasAccess('development-review'), false, 'Account changes never inherit another user grant');
  responseNames = ['Alice'];
  await frontend.refreshProductDevelopmentAccess({ force: true });
  assert.equal(frontend.productDevelopmentHasAccess('development-review'), false, 'A grant returned for another signed identity cannot unlock this page');
  frontend.PRODUCT_DEVELOPMENT_TASK_TABS = [{ id: 'detail', label: '详情' }, { id: 'review', label: '侵权图' }];
  frontend.normalizeProductDevelopmentTaskTab = (view) => view || 'detail';
  frontend.escapeHtml = (text) => text;
  const tabsSource = read('src/product-development/pd-task-sync.module.js');
  vm.runInContext(tabsSource.slice(0, tabsSource.indexOf('  function setupProductDevelopmentTaskTabs')), frontend);
  const tabs = frontend.productDevelopmentTaskTabsHtml('detail');
  assert(tabs.includes('is-access-locked'));
  assert(!tabs.includes('<svg') && !tabs.includes('未解锁'), 'Restricted tabs are gray with no visible lock badge');
  assert(!/<button[^>]*\\sdisabled[\\s=>]/.test(tabs), 'Gray tabs remain clickable for permission recheck and Paimon prompt');
  const home = read('src/core-ledger-detail.module.js');
  const page = home.slice(home.indexOf('  function productDevelopmentHomeFeaturePageHtml()'), home.indexOf('  function playProductDevelopmentHomeFeatureRailAnimation'));
  assert(!page.includes('当前 SKU'));
  const art = read('src/product-development/pd-permission-art.module.js').match(/base64,([^']+)/)[1];
  assert.equal(Buffer.from(art, 'base64').subarray(0, 4).toString(), 'RIFF');
  console.log('Development access: default deny, independent flags, signed identity, API denial, workspace routing and embedded illustration passed.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
