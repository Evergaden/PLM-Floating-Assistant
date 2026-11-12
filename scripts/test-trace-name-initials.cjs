const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');

(async () => {
  const { nameInitials } = await import(pathToFileURL(path.join(root, 'cloudflare/plm-cloud-backup/src/trace-name-initials.js')));
  const worker = (await import(pathToFileURL(path.join(root, 'cloudflare/plm-cloud-backup/src/index.js')))).default;
  for (const [name, initials] of [
    ['张三', 'ZS'], ['曾小贤', 'ZXX'], ['单田芳', 'STF'], ['仇英', 'QY'], ['区伟', 'OW'],
    ['欧阳娜娜', 'OYNN'], ['长孙无忌', 'ZSWJ'], ['Élodie Dubois', 'ED'], ['John 张三', 'JZS'],
  ]) assert.equal(nameInitials(name).initials, initials, name);
  const call = (name, authorized = true) => worker.fetch(new Request('https://test/users/name-initials', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(authorized ? { 'x-api-key': 'test-key' } : {}) }, body: JSON.stringify({ name }),
  }), { API_KEY: 'test-key' });
  assert.equal((await call('张三', false)).status, 401);
  for (const name of ['', '123', '张'.repeat(81), {}, null]) assert.equal((await call(name)).status, 400);
  const response = await call('  张三  ');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, name: '张三', initials: 'ZS' });

  const code = fs.readFileSync(path.join(root, 'src/trace-name-pinyin.module.js'), 'utf8');
  const storage = new Map();
  let name = '张三', calls = 0, complete;
  const context = vm.createContext({
    state: {}, findCurrentPlmUserName: () => name, showToast() {},
    GM_getValue: (key, fallback) => storage.has(key) ? structuredClone(storage.get(key)) : fallback,
    GM_setValue: (key, value) => storage.set(key, structuredClone(value)),
    cloudRequest: async (_, options) => { calls++; return nameInitials(options.body.name); },
  });
  vm.runInContext(code, context);
  await Promise.all([context.ensureCurrentTraceNameInitials(), context.ensureCurrentTraceNameInitials()]);
  assert.equal(calls, 1, 'Concurrent exports share one request');
  assert.equal(context.getTraceNameInitials('张三'), 'ZS');
  await context.ensureCurrentTraceNameInitials();
  assert.equal(calls, 1, 'Cached names do not call the cloud');
  name = '李四';
  context.cloudRequest = () => { calls++; return new Promise((resolve) => { complete = resolve; }); };
  const pending = context.ensureCurrentTraceNameInitials();
  context.saveTraceNameInitials(name, 'CUSTOM');
  complete(nameInitials(name));
  await pending;
  assert.equal(context.getTraceNameInitials(name), 'CUSTOM', 'A pending request cannot overwrite a correction');
  assert.equal(context.getTraceNameInitials('张三'), 'ZS', 'Accounts retain separate entries');
  name = '王五';
  context.cloudRequest = async () => { calls++; throw new Error('offline'); };
  await context.ensureCurrentTraceNameInitials();
  const failedCalls = calls;
  await context.ensureCurrentTraceNameInitials();
  assert.equal(calls, failedCalls, 'Network failures have a retry cooldown');
  assert.equal(context.getTraceNameInitials(name), '', 'Failures are not persisted as initials');
  name = 'Jane Doe';
  await context.ensureCurrentTraceNameInitials();
  assert.equal(calls, failedCalls, 'Latin names require no cloud request');
  const reloaded = vm.createContext({ GM_getValue: context.GM_getValue });
  vm.runInContext(code, reloaded);
  assert.equal(reloaded.getTraceNameInitials('李四'), 'CUSTOM', 'Corrections survive a reload');
  // Exercise the localStorage fallback separately from the GM storage path.
  const local = new Map();
  const fallback = vm.createContext({ localStorage: { getItem: (key) => local.get(key), setItem: (key, value) => local.set(key, value) } });
  vm.runInContext(code, fallback);
  fallback.saveTraceNameInitials('张三', 'ZS');
  assert.equal(fallback.getTraceNameInitials('张三'), 'ZS');
  fallback.saveTraceNameInitials('张三', '');
  assert.equal(fallback.getTraceNameInitials('张三'), '');
  console.log('Name initials: authenticated Worker API, surname conversion, persistent cache, concurrency, corrections and offline retry passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
