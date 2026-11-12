const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const codec = require(process.env.PLM_DOCX_FFLATE || '../tmp/docx-save-check/node_modules/fflate');
const { DOMParser, XMLSerializer } = require(process.env.PLM_XML_DOM_MODULE || '../tmp/docx-save-check/node_modules/@xmldom/xmldom');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ Blob, Uint8Array, DOMParser, XMLSerializer, console, Date,
  state: { settings: { excelDownloadMode: 'direct' } },
  productDevelopmentDocxCodec: () => codec,
  ensureCurrentTraceNameInitials: async () => {},
  buildExcelTraceWatermark: () => 'PFH·ZS·261112-1530·V21057',
  formatErrorMessage: (error) => error.message,
  showToast() {}, renderShell() {}, downloadBlob() { throw new Error('Direct downloads are forbidden'); },
});
for (const file of ['src/core-download-utils.module.js', 'src/product-development/pd-docx-builders.module.js', 'src/product-development/pd-one-shot.module.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const cp = 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties';
const dc = 'http://purl.org/dc/elements/1.1/';
const entries = {
  '[Content_Types].xml': codec.strToU8('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
  '_rels/.rels': codec.strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
  'word/document.xml': codec.strToU8('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>文案正文</w:t></w:r></w:p></w:body></w:document>'),
  'word/media/image1.png': new Uint8Array([1, 2, 3, 4]),
};
const original = new Blob([codec.zipSync(entries)]);
(async () => {
  let stamped = await context.productDevelopmentTraceDocxBlob(original);
  stamped = await context.productDevelopmentTraceDocxBlob(stamped);
  const after = codec.unzipSync(new Uint8Array(await stamped.arrayBuffer()));
  for (const file of ['word/document.xml', 'word/media/image1.png']) assert.deepEqual(after[file], entries[file], 'Body and assets remain byte-identical');
  const core = new DOMParser().parseFromString(codec.strFromU8(after['docProps/core.xml']), 'application/xml');
  assert.equal(core.getElementsByTagNameNS(dc, 'creator')[0].textContent, 'PFH·ZS·261112-1530·V21057');
  assert.equal(core.getElementsByTagNameNS(cp, 'lastModifiedBy').length, 1);
  assert.equal((codec.strFromU8(after['_rels/.rels']).match(/metadata\/core-properties/g) || []).length, 1, 'Repeated downloads do not duplicate relationships');
  assert.equal((codec.strFromU8(after['[Content_Types].xml']).match(/PartName="\/docProps\/core.xml"/g) || []).length, 1);
  const templateBytes = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/static/assets/v1/product-development-copywriting-templates/regular-non-ndc.docx'));
  const templateBefore = codec.unzipSync(templateBytes);
  const templateStamped = await context.productDevelopmentTraceDocxBlob(new Blob([templateBytes]));
  const templateAfter = codec.unzipSync(new Uint8Array(await templateStamped.arrayBuffer()));
  for (const file of Object.keys(templateBefore)) {
    if (['docProps/core.xml', '_rels/.rels', '[Content_Types].xml'].includes(file)) continue;
    assert.deepEqual(templateAfter[file], templateBefore[file], 'Actual template part preserved: ' + file);
  }
  const order = [];
  let saved, closes = 0;
  const handle = { createWritable: async () => ({ write: async (blob) => { saved = blob; order.push('write'); }, close: async () => { closes++; }, abort: async () => {} }) };
  context.getSaveFilePicker = () => (options) => { order.push('picker'); assert(options.suggestedName.endsWith('.docx')); return Promise.resolve(handle); };
  context.ensureCurrentTraceNameInitials = async () => { order.push('initials'); };
  context.state.productDevelopmentCopywriting = { content: {}, blob: original, fileName: 'test.docx' };
  await context.downloadProductDevelopmentCopywritingResult();
  assert.equal(order[0], 'picker', 'The picker opens during the button gesture before async work');
  assert(saved instanceof Blob); assert.equal(closes, 1);
  context.state.productDevelopmentOneShotResult = { content: {}, docxBlob: original, docxFileName: 'one-shot.docx' };
  await context.downloadProductDevelopmentOneShotDocx();
  assert.equal(closes, 2, 'One-shot downloads also use the chosen handle');
  context.state.productDevelopmentCopywriting.blob = null;
  context.rebuildProductDevelopmentCachedDocx = async (result) => { order.push('rebuild'); result.blob = original; return result; };
  order.length = 0;
  await context.downloadProductDevelopmentCopywritingResult();
  assert.equal(order[0], 'picker');
  assert.equal(order[1], 'rebuild', 'Cache restoration happens after folder/file selection');
  context.getSaveFilePicker = () => async () => { const error = new Error('cancelled'); error.name = 'AbortError'; throw error; };
  await context.downloadProductDevelopmentCopywritingResult();
  assert.equal(closes, 3, 'Cancelling does not write or start a direct download');
  context.getSaveFilePicker = () => null;
  await assert.rejects(context.downloadProductDevelopmentCopywritingResult(), /无法打开保存位置/);
  console.log('DOCX trace properties, unchanged body/assets, idempotency, both save entries, picker ordering, cancellation and unsupported browser passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
