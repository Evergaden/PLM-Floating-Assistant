const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'cloudflare/plm-cloud-backup/src/index.js'), 'utf8');
const worker = vm.createContext({ Request, Response, URL, console });
vm.runInContext(source.replace(/^import .+;\r?$/gm, '').replace('export default {', 'const workerExport = {'), worker);

const fields = Object.fromEntries([
  'usage', 'sellingPoints', 'efficacy', 'advantages', 'ingredientSummary', 'ingredientEfficacy',
].map((key) => [key, { cn: '中文内容', en: 'English content' }]));

(async () => {
  const response = await worker.handleAiImageCopywritingComplete(new Request('https://test/ai-image/copywriting-complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': 'test' },
    body: JSON.stringify({ sku: 'SKU1', fields }),
  }), { API_KEY: 'test' });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.ok, true);
  assert.equal(body.provider, 'existing');
  console.log('Copywriting completion: SKU-only context no longer fails with name required');
})().catch((error) => { console.error(error); process.exitCode = 1; });
