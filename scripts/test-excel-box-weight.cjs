const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const extract = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const cells = { F4: { value: '0.75kg' } };
const sheet = { getCell: (address) => cells[address] || (cells[address] = {}) };
class Workbook {
  constructor() { this.worksheets = [sheet]; this.calcProperties = {}; this.xlsx = { load: async () => {} }; }
  getWorksheet() { return sheet; }
}
const sandbox = { TEMPLATE_XLSX_BASE64: 'old cached template', ensureExcelTemplateLoaded: async () => true, base64ToArrayBuffer: (value) => value };
vm.createContext(sandbox);
vm.runInContext(extract('  function buildExcelBatchWeightFormula(', '  function applyExcelBatchSingleColumnLayout(')
  + extract('  async function loadCloudExcelTemplateWorkbook(', '  // </cloud-assets-module>'), sandbox);
(async () => {
  const workbook = await sandbox.loadCloudExcelTemplateWorkbook({ Workbook });
  assert.match(cells.F4.value.formula, /LEFT\(E4,LEN\(E4\)-3\)/);
  assert.match(cells.F4.value.formula, /LEFT\(N4,LEN\(N4\)-1\)/);
  assert.equal(workbook.calcProperties.fullCalcOnLoad, true);
  const shifted = sandbox.buildExcelBatchWeightFormula(4, 'M');
  assert.match(shifted.formula, /LEFT\(M4,LEN\(M4\)-1\)/);
  assert.doesNotMatch(shifted.formula, /N4/);
  const batch = sandbox.buildExcelBatchWeightFormula(7, 'N');
  assert.match(batch.formula, /E7/);
  assert.match(batch.formula, /N7/);
  assert.doesNotMatch(batch.formula, /E4|N4/);
  const ordinaryExports = source.match(/setCell\(sheet, 'E4', compactText\(packQty\)\);\s*sheet\.getCell\('F4'\)\.value = buildExcelBatchWeightFormula\(4, 'N'\);/g);
  assert.equal(ordinaryExports.length, 2, 'Both ordinary and desktop exports must explicitly restore the formula');
  console.log('PASS: fixed-value cached template repaired, recalculation enabled, normal/shifted/batch references preserved');
})().catch((error) => { console.error(error); process.exitCode = 1; });
