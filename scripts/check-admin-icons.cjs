const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const context = vm.createContext({ console, URL, Response, Request });
vm.runInContext(read('cloudflare/plm-cloud-backup/src/generated-admin-icons.js').replace('export const', 'const'), context);
vm.runInContext(read('cloudflare/plm-cloud-backup/src/index.js').replace(/^import .+;\r?$/gm, '').replace('export default {', 'const workerExport = {'), context);
for (const icon of ['overview', 'notifications', 'tips', 'greetings', 'users', 'brand', 'features', 'holidays', 'feedback', 'diagnostics', 'publish', 'backup']) {
  const svg = context.renderAdminNavIcon(icon);
  assert.match(svg, /class="lucide lucide-/);
  assert.match(svg, /aria-hidden="true"/);
  assert.match(svg, /stroke-width="1.8"/);
}
const html = context.renderAdminOverviewSection('', { backup_users: 16, sku_total: 16953 }, {}, [], Array(7).fill({ enabled: 1 }), [], Array(39).fill({}));
assert.equal((html.match(/class="lucide lucide-/g) || []).length, 7, 'Four shortcuts and three status rows use library SVGs');
assert(!/[＋✦◇▣◌✓]/.test(html), 'No character icons remain in overview');
assert.equal(context.renderAdminNavIcon('unknown'), context.renderAdminNavIcon('overview'));
if (process.argv.includes('--preview')) {
  const output = path.join(root, 'tmp', 'admin-icons-preview.html');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const css = read('cloudflare/plm-cloud-backup/static/admin-console.css');
  fs.writeFileSync(output, '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>' + css + '</style><body><main style="padding:24px">' + html + '</main></body></html>');
  console.log(output);
}
console.log('Admin icons passed: official Lucide SVGs across sidebar, shortcuts and status rows.');
