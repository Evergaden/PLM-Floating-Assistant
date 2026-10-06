const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const code = source.slice(source.indexOf('  function runSearch('), source.indexOf('  function clearSearch('));
function search(query, matches, filtered = false, unfiltered = []) {
  const input = { value: query };
  const notices = [];
  const context = {
    state: { selectedSku: 'OLD', data: { sku: 'OLD' }, view: 'detail' },
    normalizeDetailViewTab: (value) => value,
    getCurrentDetailViewTab: () => 'detail',
    ensurePanel: () => ({ querySelector: () => input }),
    normalizeSearchInput: (value) => value.trim(),
    parseSearchTokens: (value) => value.trim() ? value.trim().split(/\s+/) : [],
    hasSkuFilters: () => filtered,
    getFilteredSearchMatches: () => matches,
    getSearchMatches: () => unfiltered,
    loadData: (sku) => ({ sku }), normalizeData: (data) => data,
    updateSearchClear() {}, resetExcelState() {}, expandPanel() {}, renderShell() {},
    showToast: (text, options) => notices.push({ text, options }),
  };
  vm.createContext(context); vm.runInContext(code, context); context.runSearch('detail');
  return { notices, state: context.state };
}
const blank = search('', []);
assert.match(blank.notices[0].text, /请输入/);
const missing = search('SKU999', []);
assert.match(missing.notices[0].text, /本地资料中未找到“SKU999”/);
assert.equal(missing.state.selectedSku, 'OLD');
assert.equal(missing.state.data.sku, 'OLD');
assert.equal(missing.notices[0].options.diagnostic, false);
assert.match(search('SKU999', [], true, [{ sku: 'SKU999' }]).notices[0].text, /筛选条件/);
const found = search('SKU001', [{ sku: 'SKU001' }]);
assert.equal(found.notices.length, 0);
assert.equal(found.state.selectedSku, 'SKU001');
console.log('Empty queries, missing products, filter exclusions and successful searches passed');
