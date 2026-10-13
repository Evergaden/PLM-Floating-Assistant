const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../outputs/plm-material-summary.user.js'), 'utf8');
const declarations = source.match(/  const myProfile =[^\n]+\n  const PROFILE_USAGE_KEY =[^\n]+/)[0];
const profileFunctions = source.slice(source.indexOf('  function profileUsageRecord('), source.indexOf('  const DETAIL_VIEW_TABS'));
const profile = declarations + '\n' + profileFunctions;
const tasks = source.slice(source.indexOf('  function profileTaskProgress('), source.indexOf('  function getHomeFeatureGroups('));
const storage = {};
let writes = 0, cleared = 0, focused = 0, removed = 0;
const sandbox = {
  Date, Number, Array, String, encodeURIComponent,
  state: { magicUploadQueue: [], uploadQueue: [], batchExcelQueue: [] },
  readProductDevelopmentStorage: (key, fallback) => storage[key] || fallback,
  writeProductDevelopmentStorage: (key, value) => { storage[key] = value; writes++; },
  magicUploadStatusLabel: () => '正在上传',
  escapeHtml: (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
  iconHtml: () => '',
  window: { matchMedia: () => ({ matches: false }), clearInterval: () => cleared++, removeEventListener() {} },
  document: { getElementById: () => ({ querySelector: () => ({ setAttribute: () => {} }) }) },
  PANEL_ID: 'test',
  CLOUD_BACKUP_API_BASE: 'https://assets.test',
};
vm.createContext(sandbox);
vm.runInContext(profile + tasks + '\nglobalThis.profileState = myProfile;', sandbox);
(async () => {
  // Replay the actual declaration order around the first shell render.
  // The previous release threw a TDZ ReferenceError here despite passing syntax checks.
  const startupPosition = source.indexOf('  renderShell(L.noDrawer);');
  const declarationPosition = source.indexOf('  const myProfile =');
  const bootstrap = 'renderMyProfile({ querySelector: () => null });';
  const startupSandbox = { ...sandbox, findCurrentPlmUserName: () => '启动用户', getCloudBackupKey: () => '',
    readProductDevelopmentStorage: (key, fallback) => fallback, writeProductDevelopmentStorage: () => {} };
  vm.createContext(startupSandbox);
  vm.runInContext(profileFunctions + '\n' + (declarationPosition < startupPosition
    ? declarations + '\n' + bootstrap : bootstrap + '\n' + declarations), startupSandbox);
  const lateDeclarations = { ...startupSandbox };
  vm.createContext(lateDeclarations);
  assert.throws(() => vm.runInContext(profileFunctions + '\n' + bootstrap + '\n' + declarations, lateDeclarations),
    /before initialization/, 'The regression fixture must reproduce the previous startup failure');
  assert.equal(sandbox.profileUsageRecord(''), null);
  assert.equal(writes, 0, 'Do not attribute anonymous use to a later logged-in user');
  const first = sandbox.profileUsageRecord('用户甲');
  assert.equal(sandbox.profileUsageRecord('用户甲').recordedAtMs, first.recordedAtMs);
  assert.equal(writes, 1, 'Refreshing must not overwrite the earliest recorded date');
  sandbox.profileUsageRecord('用户乙');
  assert.equal(writes, 2, 'Users on the same browser need separate records');
  assert.equal(Object.keys(Object.values(storage)[0]).length, 2);
  let html = sandbox.myProfileBodyHtml('<用户甲>', first);
  assert.match(html, /&lt;用户甲>/);
  assert.match(html, /还没有云备份记录/);
  assert.match(html, /本机记录始于/);
  assert.match(html, /暂时没有进行中的任务/);
  assert.match(html, /task-empty-glass-v1.png/);
  assert.equal(sandbox.profileCompanionDays('2026-01-01T15:59:00Z', Date.parse('2026-01-01T16:00:00Z')), 2, 'Count Beijing calendar days across midnight');
  assert.equal(sandbox.profileCompanionDays('2999-01-01'), 0, 'Reject future dates');
  sandbox.profileState.backupOrigin = { firstBackupAt: new Date(Date.now() - 86400000).toISOString(), firstBackupExact: true };
  assert.match(sandbox.myProfileBodyHtml('用户甲', first), /助手已陪伴你/);
  assert.match(sandbox.myProfileBodyHtml('用户甲', first), /从首次备份算起/);
  sandbox.profileState.backupOrigin.firstBackupExact = false;
  assert.match(sandbox.myProfileBodyHtml('用户甲', first), /从最早可查备份算起/);
  sandbox.state.magicUploadQueue = [{ sku: '<SKU>', status: 'processing' }, { sku: '完成', status: 'success' }];
  html = sandbox.myProfileBodyHtml('用户甲', first);
  assert.match(html, /&lt;SKU>/);
  assert.match(html, /home-magic-upload/);
  assert.doesNotMatch(html, /完成/);
  sandbox.animateMyProfile({ animate: (frames, options) => {
    assert.equal(options.duration, 420);
    assert.match(frames[1].transform, /1\.035/, 'Open animation overshoots before settling');
    return {};
  } }, false);
  let resolveAnimation;
  const finished = new Promise((resolve) => { resolveAnimation = resolve; });
  const dialog = { animate: (frames, options) => {
    assert.equal(options.duration, 220);
    assert.match(frames[1].transform, /1\.025/, 'Close animation anticipates before shrinking');
    return { finished };
  } };
  sandbox.profileState.open = true;
  sandbox.profileState.timer = 123;
  sandbox.profileState.layer = { remove: () => removed++, querySelector: () => dialog };
  sandbox.profileState.focus = { isConnected: true, focus: () => focused++ };
  sandbox.closeMyProfile();
  assert.equal(cleared, 1);
  assert.equal(removed, 0, 'Do not remove the dialog before its closing animation finishes');
  sandbox.closeMyProfile();
  assert.equal(cleared, 1, 'Repeated close must not start duplicate cleanup');
  resolveAnimation();
  await finished;
  await Promise.resolve();
  assert.equal(removed, 1);
  assert.equal(focused, 1);
  assert.equal(sandbox.profileState.closing, false);
  sandbox.window.innerWidth = 800;
  sandbox.window.innerHeight = 600;
  sandbox.profileState.layer = { style: {} };
  sandbox.document.getElementById = () => ({ querySelector: () => ({ getBoundingClientRect: () => ({ left: 720, bottom: 60 }) }) });
  sandbox.positionMyProfile();
  assert.equal(sandbox.profileState.layer.style.top, '68px', 'Popover anchors below the avatar');
  assert.equal(sandbox.profileState.layer.style.left, '468px', 'Keep the popover inside the viewport near the right edge');
  assert.equal(sandbox.profileState.layer.style.width, '320px');
  sandbox.window.matchMedia = () => ({ matches: true });
  assert.equal(sandbox.animateMyProfile(dialog, false), null);
  assert.doesNotMatch(source, /toggle-collection|pfh-collection-mark|homeTaskPanelHtml/);
  console.log('PASS: per-user local dates, honest history label, task filtering and escaping, animated close cleanup and reduced motion');
})().catch((error) => { console.error(error); process.exitCode = 1; });
