// Focused Node checks. No PLM browser session or stored user data is touched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.user.js'), 'utf8');
function functionText(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, 'Missing function ' + name);
  const end = source.indexOf('\n  }', start);
  return source.slice(start, end + 4);
}
const state = {
  view: 'detail', selectedSku: 'SKU0', searchQuery: '', skuPage: 1,
  settings: { skuListMode: 'waterfall' }, skuFilters: {},
};
let catalog = Array.from({ length: 23 }, (_, n) => ({
  sku: 'SKU' + n, name: n === 0 ? '<Product & "quoted">' : 'Product ' + n,
  developerName: 'Developer', projectStatus: 'Assigned',
  skuImageUrl: n === 0 ? 'https://example.com/effect.png?a=1&b=2' : '',
}));
const context = vm.createContext({
  WORKSPACE_PREVIEW: true, state,
  loadData: (sku) => catalog.find((item) => item.sku === sku),
  getProductThumbUrl: (data) => data.skuImageUrl,
  getLedgerThumbnailUrl: (url) => url,
  iconHtml: (name) => '<i class="icon-' + name + '"></i>',
  TOOLTIP: { pin: 'Pin', unpin: 'Unpin' },
  parseSearchTokens: (query) => query ? [query] : [],
  getFilteredSearchMatches: (tokens) => catalog.filter((item) => !tokens.length || item.sku === tokens[0]),
  sortSkuListItems: (items) => items,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  getSkuListSort: () => 'assigned', renderSkuFilterPanel: () => '',
  renderCompactPager: () => '', L: { noSearchResult: 'No matches', emptyList: 'Empty' },
  setupSkuViewFusion: () => {}, syncSkuImageColorControls: () => {}, document: {}, window: {}, URL,
});
[
  'escapeHtml', 'isWorkspaceLayoutEnabled', 'isWorkspaceSkuView', 'getSkuListMode', 'getSkuListImageUrl',
  'getSkuPlaceholderUrl', 'skuProgressiveImageHtml', 'workspaceSkuRowHtml',
  'renderSkuListHtml', 'syncWorkspaceSkuSelection', 'renderSkuList',
  'setupSkuProgressiveImages', 'workspaceNavigationButtonHtml', 'workspaceInitialSkuItem',
].forEach((name) => vm.runInContext(functionText(name), context));
assert.equal(context.getSkuListMode(), 'list');
assert.equal(state.settings.skuListMode, 'waterfall', 'Saved waterfall preference stays intact');
let html = context.renderSkuListHtml();
assert.equal((html.match(/class="pfh-workspace-row(?: is-active)?"/g) || []).length, 10);
assert.ok(html.includes('&lt;Product &amp; &quot;quoted&quot;&gt;'));
assert.ok(html.includes('https://example.com/effect.png?a=1&amp;b=2'));
assert.ok(html.includes('data-sku-reveal="pending"'), 'Uses progressive image error handling');
assert.ok(html.includes('pfh-workspace-image-empty'), 'Missing images have a placeholder');
assert.ok(html.includes('Developer') && html.includes('Assigned'));
state.skuPage = 3;
assert.equal((context.renderSkuListHtml().match(/class="pfh-workspace-row(?: is-active)?"/g) || []).length, 3);
state.searchQuery = 'SKU21';
html = context.renderSkuListHtml();
assert.equal(state.skuPage, 1, 'Filter clamps an out-of-range page');
assert.equal((html.match(/class="pfh-workspace-row(?: is-active)?"/g) || []).length, 1);
state.searchQuery = 'missing';
assert.ok(context.renderSkuListHtml().includes('No matches'));
state.searchQuery = '';
catalog[0].name = 'A'.repeat(500);
assert.ok(context.workspaceSkuRowHtml(catalog[0], 'SKU0').includes('A'.repeat(500)));

// Selection changes must retain the list subtree, images and scroll container.
let writes = 0;
const list = { querySelector: () => ({}) };
Object.defineProperty(list, 'innerHTML', { set: () => { writes++; } });
const row = { dataset: { sku: 'SKU1' }, classList: { toggle: (_, value) => { row.active = value; } }, setAttribute: (_, value) => { row.pressed = value; } };
const panel = { querySelector: (selector) => selector === '.pfh-list' ? list : null, querySelectorAll: () => [row] };
context.renderSkuList(panel);
state.selectedSku = 'SKU1';
context.renderSkuList(panel);
assert.equal(writes, 1, 'Selecting another SKU preserves list and image DOM');
assert.equal(row.active, true);
assert.equal(row.pressed, 'true');
state.skuPage = 2;
context.renderSkuList(panel);
assert.equal(writes, 2, 'Changing page refreshes list contents');
state.index = catalog;
assert.equal(context.workspaceInitialSkuItem().sku, 'SKU1', 'Existing selection survives reopening');
state.selectedSku = '';
assert.equal(context.workspaceInitialSkuItem().sku, 'SKU10', 'No selection defaults to the current page first row');
state.searchQuery = 'missing';
assert.equal(context.workspaceInitialSkuItem(), null, 'Empty filtered lists do not choose an unrelated SKU');
state.searchQuery = '';

// A failed image must enable the existing fallback rather than stay blank.
const classes = new Set();
const frame = { querySelector: () => null, classList: { add: (name) => classes.add(name) } };
const attrs = { 'data-sku-image': 'https://example.com/broken.png' };
const image = { getAttribute: (name) => attrs[name], removeAttribute: (name) => delete attrs[name], closest: () => frame };
context.setupSkuProgressiveImages({ querySelectorAll: () => [image] });
assert.equal(image.src, 'https://example.com/broken.png');
image.onerror();
assert.ok(classes.has('is-image-error'));
let nav = context.workspaceNavigationButtonHtml({ id: 'detail', action: 'open-first-detail', title: 'Details', icon: 'folder' });
assert.ok(nav.includes('aria-current="page"'));
nav = context.workspaceNavigationButtonHtml({ id: 'magicUpload', action: 'home-magic-upload', title: 'Locked', icon: 'upload', disabled: true });
assert.ok(nav.includes(' disabled'));
state.view = 'home';
assert.equal(context.getSkuListMode(), 'waterfall');

const full = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.workspace-preview.user.js'), 'utf8');
const min = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.workspace-preview.min.user.js'), 'utf8');
const normal = fs.readFileSync(path.join(root, 'outputs/plm-material-summary.min.user.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/ui-src/modules/workspace-preview.css'), 'utf8');
assert.ok(full.includes('const WORKSPACE_PREVIEW = true;'));
assert.ok(full.includes('const WORKSPACE_PREVIEW_CSS = ' + JSON.stringify(css) + ';'));
assert.equal(full
  .replace('const WORKSPACE_PREVIEW = true;', 'const WORKSPACE_PREVIEW = false;')
  .replace('const WORKSPACE_PREVIEW_CSS = ' + JSON.stringify(css) + ';', "const WORKSPACE_PREVIEW_CSS = '';")
  .replace('// @description  [布局验证版] ', '// @description  '), source, 'Full test package matches current source');
assert.ok(min.includes('布局验证版') && min.includes('pfh-workspace-stage'));
assert.ok(!normal.includes('Experimental module: embedded only'));
const metadataVersion = source.match(/@version\s+(\S+)/)[1];
assert.equal(metadataVersion, source.match(/const SCRIPT_VERSION = '([^']+)'/)[1]);
assert.ok(full.includes('@version      ' + metadataVersion));
assert.ok(min.includes('@version      ' + metadataVersion));
checkWorkspaceLayoutSwitch();
console.log('Workspace preview checks passed: rows, images, pagination, filtering, selection DOM, permissions, isolated builds.');

function checkWorkspaceLayoutSwitch() {
  const stored = new Map([['classic-size', { width: 780, height: 800 }]]);
  const settings = { skuListMode: 'waterfall', theme: 'test-theme' };
  const testState = { settings, selectedSku: 'KEEP', skuPage: 3, view: 'about' };
  let renders = 0;
  const runtime = vm.createContext({
    WORKSPACE_PREVIEW: true, state: testState, SIZE_KEY: 'classic-size', WORKSPACE_SIZE_KEY: 'workspace-size',
    DEFAULT_PANEL_WIDTH: 890, DEFAULT_PANEL_HEIGHT: 943, PANEL_ID: 'test',
    GM_getValue: (key, fallback) => stored.get(key) || fallback,
    GM_setValue: (key, value) => stored.set(key, JSON.parse(JSON.stringify(value))),
    saveSettings: (value) => stored.set('settings', JSON.stringify(value)), renderShell: () => renders++,
    document: { getElementById: () => null }, window: { innerWidth: 1600, innerHeight: 1200 },
    getPanelMaxHeight: () => 1100, clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    settingsCardHtml: (title, badge, body) => title + badge + body,
  });
  ['isWorkspaceLayoutEnabled', 'isWorkspaceSkuView', 'getSkuListMode', 'getPanelSizeStorageKey', 'loadPanelSize', 'savePanelSize', 'setWorkspaceLayoutEnabled', 'workspaceLayoutSettingsHtml'].forEach((name) => vm.runInContext(functionText(name), runtime));
  assert.equal(runtime.isWorkspaceLayoutEnabled(), true, 'Existing preview installations default to new view');
  assert.equal(runtime.loadPanelSize().width, 780, 'New size starts from legacy preference');
  runtime.savePanelSize({ width: 1100, height: 940 });
  runtime.setWorkspaceLayoutEnabled(false);
  assert.equal(runtime.isWorkspaceLayoutEnabled(), false);
  assert.equal(testState.panelSize.width, 780);
  assert.equal(runtime.getSkuListMode(), 'waterfall', 'Classic view restores the saved list preference');
  assert.ok(runtime.workspaceLayoutSettingsHtml().includes('aria-checked="false"'));
  runtime.savePanelSize({ width: 560, height: 700 });
  runtime.setWorkspaceLayoutEnabled(true);
  assert.equal(testState.panelSize.width, 1100);
  assert.equal(testState.panelSize.height, 940);
  runtime.setWorkspaceLayoutEnabled(false);
  assert.equal(testState.panelSize.width, 560, 'Manual narrow width survives round trip');
  assert.equal(stored.get('workspace-size').width, 1100);
  assert.equal(stored.get('classic-size').width, 560);
  assert.equal(JSON.parse(stored.get('settings')).workspaceLayout, 'classic', 'Selection persists');
  assert.equal(testState.selectedSku, 'KEEP'); assert.equal(testState.skuPage, 3);
  assert.equal(testState.settings.theme, 'test-theme');
  const before = renders; runtime.setWorkspaceLayoutEnabled(false); assert.equal(renders, before, 'Unchanged switch does not redraw');
  assert.equal(renders, 3);

  // Simulated DOM verifies the original nodes return to their original slots.
  const list = { id: 'list' }, splitter = { id: 'splitter', listener: 'keep' }, detail = { id: 'detail' }, search = { id: 'search', value: 'keep search' };
  const close = { id: 'close' }, buttonIds = ['home-main', 'notifications', 'about'];
  const buttons = Object.fromEntries(buttonIds.map((id) => [id, { id, classList: { remove: () => {} }, removeAttribute: () => {} }]));
  const actions = { children: [close], querySelector: () => close, insertBefore: (node, target) => actions.children.splice(actions.children.indexOf(target), 0, node) };
  const heading = { children: [], appendChild: (node) => heading.children.push(node) }, badge = {};
  const main = { children: [], appendChild: (node) => main.children.push(node) };
  let removed = false;
  const workspace = {
    querySelector: (selector) => ({ '.pfh-list': list, '.pfh-splitter': splitter, '.pfh-detail': detail }[selector] || buttons[(selector.match(/data-action="([^"]+)"/) || [])[1]]),
    remove: () => { removed = true; main.children = main.children.filter((node) => node !== workspace); },
  };
  main.children.push(workspace);
  const panel = { dataset: { workspacePreview: 'true' }, pfhWorkspaceSearch: search, querySelector: (selector) => ({
    '.pfh-workspace': removed ? null : workspace, '.pfh-main': main, '.pfh-header .pfh-actions': actions,
    '.pfh-heading': heading, '.pfh-edition-badge b': badge,
  }[selector]) };
  runtime.PRODUCT_EDITION = { label: 'TEST' };
  vm.runInContext(functionText('restoreWorkspaceClassicShell'), runtime);
  runtime.restoreWorkspaceClassicShell(panel);
  assert.deepEqual(main.children, [list, splitter, detail]);
  assert.deepEqual(actions.children.map((node) => node.id), [...buttonIds, 'close']);
  assert.equal(heading.children[0], search); assert.equal(search.value, 'keep search');
  assert.equal(splitter.listener, 'keep'); assert.equal(panel.dataset.workspacePreview, undefined);
  runtime.restoreWorkspaceClassicShell(panel); // Idempotent after classic mode is restored.
}
