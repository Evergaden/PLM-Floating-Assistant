const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const postcss = require(path.join(root, 'cloudflare/plm-cloud-backup/node_modules/postcss'));
for (const file of ['plm-material-summary.user.js', 'plm-material-summary.workspace-preview.user.js']) {
  const source = fs.readFileSync(path.join(root, 'outputs', file), 'utf8');
  const start = source.indexOf('  function syncLedgerSurfaceBridge(');
  const values = new Map([['background', ['old-background', '']]]);
  const surface = { style: {
    getPropertyValue: key => (values.get(key) || [])[0] || '',
    getPropertyPriority: key => (values.get(key) || [])[1] || '',
    setProperty: (key, value, priority) => values.set(key, [value, priority]),
    removeProperty: key => values.delete(key),
  } };
  const context = vm.createContext({ state: { view: 'ledger' } });
  vm.runInContext(source.slice(start, source.indexOf('  function renderLedger(', start)), context);
  const panel = { querySelector: () => surface };
  context.syncLedgerSurfaceBridge(panel); context.syncLedgerSurfaceBridge(panel);
  assert.deepEqual(values.get('border'), ['0', 'important']);
  context.state.view = 'detail'; context.syncLedgerSurfaceBridge(panel);
  assert.deepEqual(values.get('background'), ['old-background', '']);
  assert.equal(values.has('border'), false, 'leaving ledger restores previous styles');
  const patchStart = source.indexOf('  function getWorkflowPatchCssText(');
  const encoded = source.slice(source.indexOf('    const encoded =', patchStart), source.indexOf('    const codec =', patchStart));
  const css = zlib.gunzipSync(Buffer.from([...encoded.matchAll(/'([^']+)'/g)].map(item => item[1]).join(''), 'base64')).toString();
  postcss.parse(css).walkRules(rule => {
    if (!rule.selectors.every(selector => /\.pfh-ledger-(?:page|hero|workbench-shell|tools-panel|tools-body|controlbar)$/.test(selector.trim()))) return;
    rule.walkDecls(decl => assert(!/^(border|background|box-shadow|padding)/.test(decl.prop), 'old workflow bridge must not restore frames'));
  });
  const literal = JSON.parse(source.match(/const LEDGER_WORKSPACE_CSS = (.*);/)[1]);
  assert.equal(literal, fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/ui-src/modules/ledger-workspace.css'), 'utf8'));
}
console.log('Ledger flat layout: embedded canonical CSS, obsolete bridge removal and reversible surface styles passed');
