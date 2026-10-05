const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const constants = source.slice(source.indexOf('  const SHORTCUT_GUIDE_VERSION'), source.indexOf('  const state ='));
const functions = source.slice(source.indexOf('  function normalizeShortcutBindings('), source.indexOf('  function renderAbout('));
let saved;
let modal = false;
let route = '';
let generated = 0;
let toggled = 0;
let copied = '';
const panel = { querySelectorAll: () => modal ? [{}] : [], querySelector: () => ({ focus() {}, select() {}, setAttribute() {} }) };
const context = {
  state: { settings: {}, expanded: true, view: 'home', shortcutRunning: new Set() },
  PANEL_ID: 'panel',
  document: {
    getElementById: () => panel,
    createElement: () => ({ setAttribute(name, value) { this[name] = value; } }),
  },
  ensurePanel: () => panel,
  isVisibleElement: () => true,
  expandPanel() { context.state.expanded = true; },
  togglePanelVisible() { toggled++; },
  renderShell() {},
  saveSettings(settings) { saved = JSON.parse(JSON.stringify(settings)); },
  showToast() {},
  copyText(value) { copied = value; },
  syncExcelInputs() {},
  async generateExcelFromCurrent() { generated++; },
  handlePanelClick(event) { route = event.target['data-action']; },
  reportDiagnostic(error) { throw error; },
  formatErrorMessage: String,
  settingsGroupHtml: (icon, title, body) => body,
  settingsCardHtml: (title, badge, body) => body,
  escapeHtml: String,
};
vm.createContext(context);
vm.runInContext(constants + functions + '\nthis.actions = SHORTCUT_ACTIONS;', context);
const event = (key, extras = {}) => ({
  key, code: 'Key' + key.toUpperCase(), altKey: true, shiftKey: true,
  target: { closest: () => null },
  preventDefault() { this.prevented = true; },
  stopImmediatePropagation() { this.stopped = true; },
  ...extras,
});
const target = (id) => ({ getAttribute: () => id });
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  assert.equal(context.shortcutFromEvent(event('é', { code: 'KeyE' })), 'Alt+Shift+E');
  assert.equal(context.shortcutFromEvent(event('a', { isComposing: true })), '');
  assert.equal(context.shortcutFromEvent(event('a', { getModifierState: () => true })), '');
  const defaults = context.normalizeShortcutBindings();
  assert.equal(defaults.toggle, 'Alt+Shift+P');
  assert.equal(context.normalizeShortcutBindings({ toggle: null }).toggle, null);
  assert.equal(context.normalizeShortcutBindings({ toggle: 'Ctrl+R' }).toggle, null);
  assert.equal(context.normalizeShortcutBindings({ toggle: 'Alt+Shift+F' }).search, null);

  context.state.view = 'about'; context.state.settingsPage = 'shortcuts';
  context.handleShortcutSettingsAction('shortcut-record', target('toggle'));
  const conflict = event('F'); context.handleShortcutKeydown(conflict);
  assert.equal(conflict.prevented, true);
  assert.equal(context.state.shortcutRecording, 'toggle');
  assert.match(context.state.shortcutHint, /已用于/);
  context.handleShortcutKeydown(event('R', { altKey: false, shiftKey: false, ctrlKey: true }));
  assert.match(context.state.shortcutHint, /浏览器/);
  context.handleShortcutKeydown(event('9', { code: 'Digit9', ctrlKey: true }));
  assert.equal(saved.shortcutBindings.toggle, 'Ctrl+Alt+Shift+9');
  assert.equal(context.normalizeShortcutBindings(saved.shortcutBindings).toggle, 'Ctrl+Alt+Shift+9');
  context.handleShortcutSettingsAction('shortcut-delete', target('toggle'));
  assert.equal(context.normalizeShortcutBindings(saved.shortcutBindings).toggle, null);
  context.handleShortcutSettingsAction('shortcut-record', target('toggle'));
  context.handleShortcutKeydown(event('Escape'));
  assert.equal(context.state.shortcutRecording, '');
  assert.equal(saved.shortcutBindings.toggle, null);
  context.handleShortcutSettingsAction('shortcut-record', target('toggle'));
  const tab = event('Tab'); context.handleShortcutKeydown(tab);
  assert.equal(tab.prevented, undefined);
  assert.equal(context.state.shortcutRecording, '');

  context.state.settings = {}; context.state.view = 'home';
  for (const extra of [
    { repeat: true }, { isComposing: true }, { defaultPrevented: true },
    { target: { closest: () => ({}) } }, { target: { isContentEditable: true } },
  ]) {
    const key = event('P', extra); context.handleShortcutKeydown(key);
    assert.equal(key.prevented, undefined);
  }
  modal = true; context.handleShortcutKeydown(event('P')); await flush();
  assert.equal(toggled, 0); modal = false;
  context.state.expanded = false;
  const hidden = event('H'); context.handleShortcutKeydown(hidden); await flush();
  assert.equal(hidden.prevented, undefined);
  context.handleShortcutKeydown(event('P')); await flush(); assert.equal(toggled, 1);
  context.state.expanded = true;
  for (const item of context.actions.filter(item => item.action)) {
    assert.ok(source.includes("action === '" + item.action + "'"), 'missing route: ' + item.action);
    context.handleShortcutKeydown(event(item.key)); await flush(); assert.equal(route, item.action);
  }
  context.state.selectedSku = 'SKU123';
  context.handleShortcutKeydown(event('C')); await flush(); assert.equal(copied, 'SKU123');
  context.handleShortcutKeydown(event('E')); await flush(); assert.equal(generated, 0);
  context.state.data = { sku: 'SKU123' }; context.state.excelExtra = { excelData: { sku: 'SKU123' } };
  context.handleShortcutKeydown(event('E')); context.handleShortcutKeydown(event('E')); await flush();
  assert.equal(generated, 1);
  let finishExport;
  context.generateExcelFromCurrent = () => new Promise(resolve => { finishExport = resolve; });
  context.handleShortcutKeydown(event('E')); await flush();
  context.handleShortcutKeydown(event('P')); await flush();
  assert.equal(toggled, 2, 'other shortcuts stay available during export');
  assert.equal(context.state.shortcutRunning.has('excel'), true);
  finishExport(); await flush();
  assert.equal(context.state.shortcutRunning.size, 0);

  context.state.settings = {}; context.state.tutorialModalOpen = true;
  context.guideShortcutUpdate(); assert.equal(context.state.settings.shortcutGuideVersion, undefined);
  context.state.tutorialModalOpen = false;
  context.guideShortcutUpdate();
  assert.equal(context.state.view, 'about'); assert.equal(context.state.settingsPage, 'shortcuts');
  assert.equal(saved.shortcutGuideVersion, 1);
  context.state.view = 'home'; context.guideShortcutUpdate(); assert.equal(context.state.view, 'home');
  assert.match(context.renderShortcutSettings(), /shortcut-delete/);
  console.log('Shortcut defaults, persistence, deletion, conflicts, input guards, routes, task deduplication, and update guidance passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
