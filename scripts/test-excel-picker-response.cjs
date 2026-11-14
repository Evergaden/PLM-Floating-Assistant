const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/core-excel-export.module.js'), 'utf8');
const start = source.indexOf('  async function generateExcelFromCurrent(');
const end = source.indexOf('  async function generateToyLabelFromCurrent(', start);
assert(start >= 0 && end > start);
function setup() {
  const calls = [];
  const data = { sku: 'SKU1', name: 'Product' };
  let resolvePicker;
  const sandbox = vm.createContext({
    state: { data, settings: {}, excelPurchasePrice: '6', excelExtra: { excelData: data, extra: {} } },
    L: { excelGenerating: 'Generating', excelSaveCanceled: 'Cancelled', excelFailed: 'Failed' },
    normalizeData: value => value,
    syncExcelInputs() {}, getExcelMissingFields: () => [], normalizePackQty: value => value,
    getLocalPackQty: () => 24, sanitizeExcelFileName: value => value, buildExcelFileName: () => 'Product SKU1.xlsx',
    chooseExcelSaveTarget: filename => { calls.push(['picker', filename]); return new Promise(resolve => { resolvePicker = resolve; }); },
    showToast: message => { calls.push(['toast', message]); return calls.length; },
    dismissToast: token => calls.push(['dismiss', token]), renderShell() {}, addLog() {},
    ensureExcelJsLoaded: async () => { calls.push(['library']); throw new Error('Library unavailable'); },
    ensureExcelTemplateLoaded: async () => { calls.push(['template']); return false; },
    formatExcelExportError: error => error.message,
    console: { warn() {} },
  });
  vm.runInContext(source.slice(start, end), sandbox);
  return { sandbox, calls, pick: target => resolvePicker(target) };
}
(async () => {
  const cancelled = setup();
  const first = cancelled.sandbox.generateExcelFromCurrent();
  assert(cancelled.calls.some(call => call[0] === 'toast'), 'click gives immediate feedback');
  assert.equal(cancelled.calls.filter(call => call[0] === 'picker').length, 1, 'picker is invoked synchronously before any library await');
  assert(!cancelled.calls.some(call => call[0] === 'library' || call[0] === 'template'));
  await cancelled.sandbox.generateExcelFromCurrent();
  assert.equal(cancelled.calls.filter(call => call[0] === 'picker').length, 1, 'duplicate clicks do not open another picker');
  cancelled.pick(null);
  await first;
  assert.equal(cancelled.sandbox.state.excelGenerating, false);
  assert.equal(cancelled.sandbox.state.excelStatus, 'Cancelled');
  assert(!cancelled.calls.some(call => call[0] === 'library'), 'cancelling performs no library loading');
  const failed = setup();
  const attempt = failed.sandbox.generateExcelFromCurrent();
  failed.pick({ type: 'fileSystem', handle: {} });
  await attempt;
  assert(failed.calls.findIndex(call => call[0] === 'library') > failed.calls.findIndex(call => call[0] === 'picker'));
  assert.match(failed.sandbox.state.excelStatus, /Library unavailable/);
  assert.equal(failed.sandbox.state.excelGenerating, false, 'failure permits retry');
  const retry = failed.sandbox.generateExcelFromCurrent();
  assert.equal(failed.calls.filter(call => call[0] === 'picker').length, 2);
  failed.pick(null); await retry;
  const template = setup();
  template.sandbox.ensureExcelJsLoaded = async () => ({});
  const templateAttempt = template.sandbox.generateExcelFromCurrent();
  template.pick({ type: 'download', direct: true });
  await templateAttempt;
  assert.match(template.sandbox.state.excelStatus, /模板尚未缓存/);
  assert.equal(template.sandbox.state.excelGenerating, false);
  console.log('PASS: Excel picker precedes dependency loading; feedback, cancellation, duplicate clicks and failure retry verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
