const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const start = source.indexOf('  function scheduleAssignedDesignTaskAutoSync(');
const code = source.slice(start, source.indexOf('  function collectProjectAllListRows(', start));
const row = (id, owner = '张三', date = '2026/10/05') => ({ id, product_code: 'SKU' + id, design_work_user_name: owner, design_assign_at: date });
function setup(fetcher) {
  let user = '张三'; let reads = 0; let commits = 0;
  const timers = [];
  const context = {
    state: { settings: { collectionEnabled: true }, workMode: 'daily' },
    location: { pathname: '/projectManagementChemicalNew' },
    window: { setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; } },
    ASSIGNED_DESIGN_TASK_SYNC_COOLDOWN_MS: 300000,
    ASSIGNED_DESIGN_TASK_ENDPOINT: '/tasks', ASSIGNED_DESIGN_TASK_PAGE_SIZE: 20,
    ASSIGNED_DESIGN_TASK_SORT_FIELD: 'design_assign_at', ASSIGNED_DESIGN_TASK_SORT_ASC: false,
    findCurrentPlmUserName: () => user,
    fetchPlmJson: async url => { reads++; return fetcher(Number(new URL(url, 'https://example.test').searchParams.get('page'))); },
    getApiListItems: data => data.rows,
    getApiListTotal: data => data.total,
    formatPlmApiMessage: String,
    formatErrorMessage: String,
    normalizeAssignedDesignTaskRow: item => ({ sku: item.product_code, designAssignedAt: item.design_assign_at }),
    parseSkuListTime: date => Date.parse(date) || 0,
    addLog() {},
    syncProjectListRowsToCache(rows) { commits++; return { fetchedCount: rows.length }; },
  };
  vm.createContext(context); vm.runInContext(code, context);
  return { context, timers, user(value) { user = value; }, reads: () => reads, commits: () => commits };
}
(async () => {
  const all = Array.from({ length: 2100 }, (_, i) => row(i, i % 2 ? '李四' : '张三'));
  const large = setup(page => ({ rows: all.slice((page - 1) * 20, page * 20), total: all.length }));
  const result = await large.context.syncAssignedDesignTasksFromApi();
  assert.equal(large.reads(), 105, 'reads beyond old 100-page limit');
  assert.equal(result.fetchedCount, 1050, 'imports only current designer');
  assert.equal(large.commits(), 1);
  assert.equal((await large.context.syncAssignedDesignTasksFromApi()).skipped, true);
  large.user('李四');
  assert.equal((await large.context.syncAssignedDesignTasksFromApi()).fetchedCount, 1050, 'cooldown does not block a changed account');

  const partial = setup(page => ({ rows: page === 1 ? [row(1)] : [row(2), row(3)], total: 3 }));
  assert.equal((await partial.context.fetchAssignedDesignTaskRows()).length, 3, 'known total overrides short pages');
  const unique = setup(() => ({ rows: [row(1, '张三', '2026/10/01'), row(1), row(2, '张三', ''), row(3, ''), row(4, '李四')], total: 5 }));
  const uniqueRows = await unique.context.fetchAssignedDesignTaskRows();
  assert.equal(uniqueRows.length, 2, 'deduplicates and retains owned products without an assignment date');
  assert.equal(uniqueRows[0].designAssignedAt, '2026/10/05');

  const repeated = setup(() => ({ rows: [row(1)], total: 2 }));
  await assert.rejects(repeated.context.syncAssignedDesignTasksFromApi(), /重复分页/);
  assert.equal(repeated.commits(), 0, 'partial reads never mutate cache');
  assert.equal(repeated.context.state.assignedDesignTaskSyncLastStartedAt, 0);
  const incomplete = setup(page => ({ rows: page === 1 ? [row(1)] : [], total: 2 }));
  await assert.rejects(incomplete.context.syncAssignedDesignTasksFromApi(), /未读取完整/);
  assert.equal(incomplete.commits(), 0);
  const changed = setup(() => { changed.user('李四'); return { rows: [row(1)], total: 1 }; });
  await assert.rejects(changed.context.syncAssignedDesignTasksFromApi(), /用户发生变化/);
  assert.equal(changed.commits(), 0);
  const unknown = setup(() => ({ rows: [], total: 0 })); unknown.user('');
  await assert.rejects(unknown.context.syncAssignedDesignTasksFromApi(), /无法识别/);
  assert.equal(unknown.reads(), 0);

  const background = setup(() => ({ rows: [row(1)], total: 1 }));
  background.context.scheduleAssignedDesignTaskAutoSync(1400);
  background.context.scheduleAssignedDesignTaskAutoSync(1400);
  assert.equal(background.timers.length, 1, 'only one background timer');
  await background.timers[0].callback();
  assert.equal(background.commits(), 1);
  assert.equal(background.timers[1].delay, 300000);
  const retry = setup(() => { throw new Error('network'); });
  retry.context.scheduleAssignedDesignTaskAutoSync(0); await retry.timers[0].callback();
  assert.equal(retry.timers[1].delay, 60000);
  for (const inactive of ['disabled', 'development', 'otherPage']) {
    const blocked = setup(() => ({ rows: [row(1)], total: 1 }));
    if (inactive === 'disabled') blocked.context.state.settings.collectionEnabled = false;
    if (inactive === 'development') blocked.context.state.workMode = 'product-development';
    if (inactive === 'otherPage') blocked.context.location.pathname = '/other';
    blocked.context.scheduleAssignedDesignTaskAutoSync(0); await blocked.timers[0].callback();
    assert.equal(blocked.reads(), 0);
  }
  console.log('Design task complete pagination, owner filtering, deduplication, interrupted reads, cooldown, and background retries passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
