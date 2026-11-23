const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/core-detail-copywriting.module.js'), 'utf8');
const code = source.slice(source.indexOf('  function copywritingVisibleSignature('), source.indexOf('  function switchDetailViewTab('));
const record = { fileName: 'copy.docx', parserVersion: '1', fullText: 'Original', sections: [{ key: 'name', label: 'Name', text: 'Original' }], missingSections: [], changedSectionKeys: [], removedSections: [] };
async function runScenario({ fresh = false, result, error = null, initialRecord = record, entering = false, force = false }) {
  const state = { selectedSku: 'SKU1', view: 'detail', copywritingMode: !entering, copywritingError: '', data: { sku: 'SKU1', copywriting: initialRecord } };
  let renders = 0;
  const ctx = vm.createContext({ state, COPYWRITING_PARSER_VERSION: '1', COPYWRITING_CACHE_DEBOUNCE_MS: 0,
    normalizeData: (value) => value, normalizeCopywritingRecord: (value) => value || null,
    getCopywritingDisplayRecord: (data) => data && data.copywriting || null,
    loadData: () => state.data, isCopywritingCheckFresh: () => fresh,
    stopScan() {}, stopMaterialWatch() {}, cancelDrawerTabFlow() {}, addLog() {}, showToast() {},
    expandPanel: (options) => { if (options.render) renders++; }, renderShell: () => { renders++; },
    wait: async () => {}, formatErrorMessage: (value) => String(value.message || value),
    tryHydrateCopywritingFromApi: async (_sku, opts) => { opts.onStatus('Checking'); if (error) throw error; return result; },
  });
  vm.runInContext(code, ctx);
  await ctx.openCopywritingFromCurrent(force);
  assert.equal(state.copywritingChecking, false);
  assert.equal(state.copywritingQuietCheck, false);
  return { renders, state };
}
(async () => {
  let outcome = await runScenario({ fresh: true });
  assert.equal(outcome.renders, 0, 'Fresh cached copy does not rerender');
  outcome = await runScenario({ result: { handled: true, skipped: true, data: { sku: 'SKU1', copywriting: { ...record, lastCheckedAtMs: 10 } } } });
  assert.equal(outcome.renders, 0, 'An unchanged background check updates metadata without rerendering');
  outcome = await runScenario({ force: true, result: { handled: true, data: { sku: 'SKU1', copywriting: { ...record, fetchedAt: 'later' } } } });
  assert.equal(outcome.renders, 0, 'A manual reread with identical displayed copy does not rerender');
  const changed = { ...record, fullText: 'Updated', sections: [{ key: 'name', label: 'Name', text: 'Updated' }] };
  outcome = await runScenario({ result: { handled: true, updated: true, data: { sku: 'SKU1', copywriting: changed } } });
  assert.equal(outcome.renders, 1, 'Changed copy renders once');
  outcome = await runScenario({ result: { noFile: true } });
  assert.equal(outcome.renders, 1, 'Missing source produces an error indication');
  outcome = await runScenario({ error: new Error('offline') });
  assert.equal(outcome.renders, 1, 'Read errors remain visible');
  outcome = await runScenario({ entering: true, fresh: true });
  assert.equal(outcome.renders, 1, 'Entering the copywriting tab renders the cached content once');
  outcome = await runScenario({ initialRecord: null, result: { handled: true, data: { sku: 'SKU1', copywriting: record } } });
  assert(outcome.renders >= 2, 'An initial load renders progress and the new content');
  console.log('Copywriting background checks preserve the current view until content or errors change');
})().catch((error) => { console.error(error); process.exitCode = 1; });
