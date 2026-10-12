const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/network-diagnostics.module.js'), 'utf8');

function context(outcomes = {}, defer = false) {
  let calls = 0;
  let accessCalls = 0;
  let layer = null;
  const queue = [];
  const full = { appendChild: (element) => { layer = element; } };
  const panel = { querySelector: (selector) => selector === '.pfh-full' ? full : layer };
  const sandbox = {
    window: { setTimeout, clearTimeout }, navigator: { onLine: true },
    document: { createElement: () => ({ setAttribute: () => {}, remove: () => { layer = null; } }) },
    SCRIPT_VERSION: 'test', EXCELJS_URL: 'https://cdn.test/excel.js', GREASYFORK_SCRIPT_URL: 'https://update.test/script',
    CLOUD_BACKUP_API_BASE: 'https://cloud.test', CLOUD_ASSET_FALLBACK_API_BASE: 'https://fallback.test',
    ensurePanel: () => panel, expandPanel: () => {}, findCurrentPlmUserName: () => 'private-user',
    formatErrorMessage: (error) => error && error.message || '',
    escapeHtml: (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    cloudRequest: async (url) => {
      accessCalls++;
      const outcome = outcomes.permission || 'ok';
      if (outcome !== 'ok' && outcome !== 'disabled') throw { status: typeof outcome === 'number' ? outcome : 0,
        message: outcome, cloudTransportFailure: outcome === 'blocked' };
      return { enabled: outcome !== 'disabled' };
    },
    GM_xmlhttpRequest: (options) => {
      calls++;
      assert.equal(options.anonymous, true);
      assert.equal(options.headers, undefined);
      const complete = () => {
        const outcome = outcomes[new URL(options.url).hostname] || 'ok';
        if (outcome === 'timeout') options.ontimeout();
        else if (outcome === 'blocked') options.onerror();
        else options.onload({ status: typeof outcome === 'number' ? outcome : 200,
          responseText: outcome === 'html' ? '<html>intercepted</html>' : '{"ok":true}',
          responseHeaders: outcome === 'html' ? 'content-type: text/html' : '' });
      };
      if (defer) queue.push(complete); else complete();
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source + '\nglobalThis.diagnostics = networkDiagnostics;', sandbox);
  return { sandbox, queue, calls: () => calls, accessCalls: () => accessCalls, html: () => layer && layer.innerHTML || '' };
}

(async () => {
  const consent = context();
  consent.sandbox.recordNetworkPermissionResult('/features/size-image', null, { cloudTransportFailure: true, message: 'network' });
  assert.equal(consent.sandbox.diagnostics.offerOpen, false, 'Background attempts must not interrupt automatic retries');
  consent.sandbox.offerNetworkDiagnostics('当前操作失败');
  assert.match(consent.html(), /暂不检测/);
  assert.match(consent.html(), /开始检测/);
  assert.match(consent.html(), /role="dialog"/, 'Shortcut handling must recognize the offer dialog');
  await consent.sandbox.requestNetworkDiagnostics(false);
  assert.equal(consent.calls(), 0, 'No public probes before user chooses Start');
  assert.equal(consent.accessCalls(), 0, 'No permission probes before consent');
  consent.sandbox.diagnostics.offerOpen = false;
  consent.sandbox.renderNetworkDiagnostics(consent.sandbox.ensurePanel());
  consent.sandbox.offerNetworkDiagnostics('另一次失败');
  assert.equal(consent.sandbox.diagnostics.offerOpen, false, 'Dismissed offers must not immediately reopen');

  const incremental = context({}, true);
  const pending = incremental.sandbox.requestNetworkDiagnostics(true);
  assert.equal(incremental.sandbox.diagnostics.results.filter((row) => row.kind === 'waiting').length, 9);
  assert.match(incremental.html(), /class="pfh-api-spinner"/);
  assert.match(incremental.html(), /role="dialog"/, 'Shortcut handling must recognize the results dialog');
  assert.match(incremental.html(), /value="0"/);
  assert.equal(pending, incremental.sandbox.requestNetworkDiagnostics(true), 'Repeated Start shares the running check');
  incremental.queue.shift()();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(incremental.sandbox.diagnostics.results.filter((row) => row.kind !== 'waiting').length, 5);
  assert.match(incremental.html(), /5 \/ 9/);
  incremental.sandbox.diagnostics.open = false;
  incremental.sandbox.renderNetworkDiagnostics(incremental.sandbox.ensurePanel());
  incremental.queue.forEach((complete) => complete());
  await pending;
  assert.equal(incremental.sandbox.diagnostics.open, false, 'Finishing a closed check must not reopen it');
  assert.equal(incremental.calls(), 5);
  assert.equal(incremental.accessCalls(), 4);
  assert.equal(incremental.sandbox.networkDiagnosticsConclusion().kind, 'recovered');

  for (const [outcomes, expected] of [
    [{ 'update.test': 'blocked', 'cloud.test': 'timeout', 'fallback.test': 'blocked', permission: 'blocked' }, 'network'],
    [{ 'cloud.test': 'blocked' }, 'recovered'],
    [{ 'cloud.test': 500, 'fallback.test': 500 }, 'server'],
    [{ 'cloud.test': 'html', 'fallback.test': 'html' }, 'server'],
    [{ 'cdn.test': 'html' }, 'server'],
    [{ 'update.test': 403 }, 'server'],
    [{ permission: 403 }, 'auth'],
    [{ permission: 500 }, 'server'],
    [{ permission: 'disabled' }, 'recovered'],
  ]) {
    const test = context(outcomes);
    await test.sandbox.requestNetworkDiagnostics(true);
    assert.equal(test.sandbox.networkDiagnosticsConclusion().kind, expected, JSON.stringify(outcomes));
    assert.doesNotMatch(test.sandbox.networkDiagnosticsReport(), /private-user|Authorization|Bearer/);
    assert.match(test.html(), /9 \/ 9/);
    assert.doesNotMatch(test.html(), /class="pfh-api-spinner"/, 'Spinner must stop once checking finishes');
  }

  const runtime = context();
  runtime.sandbox.offerNetworkDiagnostics('组件没有运行', { scriptRuntimeFailure: true, componentKey: 'exceljs' });
  await runtime.sandbox.requestNetworkDiagnostics(true);
  assert.equal(runtime.sandbox.networkDiagnosticsConclusion().kind, 'script');
  runtime.sandbox.getLazyExternalRuntime = () => ({ Workbook: function () {} });
  assert.equal(runtime.sandbox.networkDiagnosticsConclusion().kind, 'recovered', 'A late-loaded component must not still be blamed on the script');
  const spinnerCss = fs.readFileSync(path.join(__dirname, '../cloudflare/plm-cloud-backup/ui-src/legacy.css'), 'utf8');
  assert.match(spinnerCss, /\.pfh-api-spinner\{[^}]*animation:pfh-api-status-spin \.8s linear infinite/,
    'Waiting indicators must reuse the existing continuous CSS rotation');
  assert.match(spinnerCss, /@keyframes pfh-api-status-spin\{to\{transform:rotate\(360deg\)\}\}/);
  assert.doesNotMatch(runtime.sandbox.networkDiagnosticIcon('waiting'), /animateTransform/);

  const unsupported = context();
  delete unsupported.sandbox.GM_xmlhttpRequest;
  await unsupported.sandbox.requestNetworkDiagnostics(true);
  assert.equal(unsupported.sandbox.networkDiagnosticsConclusion().kind, 'browser');
  unsupported.sandbox.navigator.onLine = false;
  assert.equal(unsupported.sandbox.networkDiagnosticsConclusion().kind, 'offline');

  const demo = context();
  const frames = [];
  demo.sandbox.window.setTimeout = (callback) => { frames.push(callback); return frames.length; };
  demo.sandbox.window.clearTimeout = () => {};
  demo.sandbox.openNetworkDiagnosticsDemo();
  assert.match(demo.html(), /开始检测/);
  assert.match(demo.html(), /动画演示/);
  const animation = demo.sandbox.requestNetworkDiagnostics(true, demo.sandbox.diagnostics.simulation);
  assert.equal(demo.calls(), 0);
  assert.equal(demo.accessCalls(), 0, 'Animation preview must not fetch real permissions');
  frames[0]();
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(demo.html(), /1 \/ 9/);
  assert.match(demo.html(), /class="pfh-api-spinner"/);
  frames.slice(1).forEach((frame) => frame());
  await animation;
  assert.equal(demo.sandbox.networkDiagnosticsConclusion().kind, 'network');
  assert.match(demo.html(), /演示 ·/);
  assert.match(demo.sandbox.networkDiagnosticsReport(), /所有结果为模拟/);
  demo.sandbox.window.setTimeout = setTimeout;
  demo.sandbox.window.clearTimeout = clearTimeout;
  await demo.sandbox.requestNetworkDiagnostics(true);
  assert.equal(demo.calls(), 5, 'Manual real check after demo must use real probes');
  assert.equal(demo.sandbox.diagnostics.simulation, false);
  assert.doesNotMatch(demo.sandbox.networkDiagnosticsReport(), /所有结果为模拟|动画演示：模拟/);

  const timeout = context().sandbox;
  let watchdog;
  timeout.window.setTimeout = (callback) => { watchdog = callback; return 1; };
  timeout.window.clearTimeout = () => {};
  timeout.GM_xmlhttpRequest = () => {};
  const hungPublic = timeout.probeNetworkTarget({ id: 'update', url: 'https://update.test' });
  watchdog();
  assert.equal((await hungPublic).kind, 'unreachable');
  timeout.cloudRequest = () => new Promise(() => {});
  const hungPermission = timeout.probeNetworkTarget({ id: 'permission-size-image', permission: true, path: '/features/size-image' });
  watchdog();
  assert.equal((await hungPermission).kind, 'pending-timeout', 'Auth delay must not be falsely blamed on the proxy');

  const userscript = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
  const actions = userscript.slice(userscript.indexOf("    if (action === 'developer-settings-tap')"), userscript.indexOf("    if (action === 'plm-api-monitor-toggle')"));
  const developer = { Date: { now: () => 1000 }, state: { developerSettingsTapCount: 0, developerSettingsTapAt: 0,
    developerInsightsUnlocked: false, developerInsightsOpen: false, developerToolsOpen: false },
    renderShell: () => {}, showToast: () => {}, networkDiagnostics: { checking: false },
    openNetworkDiagnosticsDemo: () => {}, requestNetworkDiagnostics: () => {} };
  vm.createContext(developer);
  vm.runInContext('function handleDeveloperAction(action) {' + actions + '}', developer);
  for (let i = 0; i < 4; i++) developer.handleDeveloperAction('developer-settings-tap');
  assert.equal(developer.state.developerInsightsUnlocked, false);
  developer.handleDeveloperAction('developer-settings-tap');
  assert.equal(developer.state.developerInsightsUnlocked, true);
  assert.equal(developer.state.developerToolsOpen, false, 'Five taps reveal a button instead of opening developer content');
  assert.equal(developer.state.developerInsightsOpen, false, 'Unlock must not expand data insights');
  developer.handleDeveloperAction('developer-mode-toggle');
  assert.equal(developer.state.developerToolsOpen, true);
  developer.handleDeveloperAction('developer-insights-toggle');
  assert.equal(developer.state.developerInsightsOpen, true);
  assert.doesNotMatch(userscript, /setTimeout\(\(\) => requestNetworkDiagnostics|addEventListener\('(online|offline)', \(\) => requestNetworkDiagnostics/);
  const requestSource = userscript.slice(userscript.indexOf('  async function cloudRequest('), userscript.indexOf('  function cloudRequestWithRetry('));
  const auth = context().sandbox;
  let requests = 0;
  let exchanges = 0;
  let cleared = 0;
  auth.ensureCloudAuthToken = async () => 'token-' + (++exchanges);
  auth.clearCloudAuthToken = () => cleared++;
  auth.cloudTransport = async (url, options, headers) => {
    if (++requests === 1) throw { status: 401, message: 'expired' };
    assert.equal(headers.Authorization, 'Bearer token-2');
    assert.equal(options.__authRetried, true);
    return { enabled: false };
  };
  vm.runInContext(requestSource, auth);
  assert.equal((await auth.cloudRequest('/features/size-image', { method: 'GET' })).enabled, false);
  assert.equal(cleared, 1);
  assert.equal(auth.diagnostics.permissions['/features/size-image'].kind, 'ok');
  assert.equal(auth.diagnostics.offerOpen, false);
  let reports = 0;
  auth.reportDiagnosticRequest = () => reports++;
  auth.cloudTransport = async () => { throw { status: 403, message: 'Forbidden' }; };
  await assert.rejects(auth.cloudRequest('/features/size-image'), (error) => error.status === 403);
  assert.equal(reports, 1, 'Existing telemetry must still receive failed requests');
  console.log('PASS: user consent, incremental progress, animation, dismissal, deadlines, classification, privacy and auth retry');
})().catch((error) => { console.error(error); process.exitCode = 1; });
