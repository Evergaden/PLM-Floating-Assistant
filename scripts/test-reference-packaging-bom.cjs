const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const { document } = parseHTML('<div id="drawer"><button id="add">添加物料</button></div><div class="ant-dropdown-menu-item">其他物料</div>');
const drawer = document.getElementById('drawer');
const log = [];
const context = vm.createContext({ document,
  productDevelopmentDomVisible: () => true,
  productDevelopmentDomText: (value) => String(value || '').trim(),
  productDevelopmentCleanText: (value) => String(value || '').trim(),
  productDevelopmentIsSupplement: (detail) => detail.supplement === true,
  productDevelopmentReferenceLabel: (detail) => detail.supplement ? '返工' : '对标',
  productDevelopmentReworkLookupState: (detail) => detail.productDevelopmentReworkLookup || {},
  productDevelopmentReadonlyList: (payload) => payload.data,
  productDevelopmentPrefillText: (value) => String(value || ''),
  waitFor: async (find) => { const value = find(); if (!value) throw new Error('Fixture target missing'); return value; },
});
for (const file of ['pd-pricing-drafts', 'pd-dom']) vm.runInContext(fs.readFileSync(path.join(root, 'src/product-development/' + file + '.module.js'), 'utf8'), context);
context.productDevelopmentDomVisible = () => true;
context.productDevelopmentDomWait = async () => {};
context.productDevelopmentDomNativeSetter = (input, value) => { input.value = value; log.push('code:' + value); };
context.productDevelopmentDomSelectionMatches = (input, value) => input.getAttribute('data-selected') === value;
context.productDevelopmentDomSelectOption = async (input, value) => { assert.equal(value, '包材'); input.setAttribute('data-selected', value); log.push('type:' + value); };
document.getElementById('add').addEventListener('click', () => log.push('add'));
document.querySelector('.ant-dropdown-menu-item').addEventListener('click', () => {
  log.push('其他物料');
  const form = document.createElement('div');
  form.className = 'card';
  form.innerHTML = '<input placeholder="搜索物料编码"><button>搜索</button>';
  form.querySelector('button').addEventListener('click', () => {
    log.push('search');
    assert.equal(form.querySelector('input').value, '2-A0208-00459');
    form.remove();
    const result = document.createElement('div');
    result.className = 'cardBox';
    result.innerHTML = '<span>2-A0208-00459</span><b>47-60ml透明圆形PET广口瓶盖套装</b><div class="ant-select"><input role="combobox" placeholder="请选择"></div>';
    drawer.appendChild(result);
  });
  drawer.appendChild(form);
});
const packaging = { materialId: '501', code: '2-A0208-00459', name: '47-60ml透明圆形PET广口瓶盖套装', materialType: '3', typeValue: 2, usage: '1' };
const referenceRows = [packaging, { ...packaging }, { code: 'MTL1', name: '标签', materialType: '1' }, { code: 'MTL2', name: '纸盒', materialType: '0' }, { code: 'A-C038-W00000-011', name: '化妆品-白色清凉膏', materialType: '4' }, { code: 'SKU00052445', name: '肩颈舒缓镁霜', typeValue: 1 }];
const detail = { sku: 'SKU1', projectId: '12', productMainId: '999', productDevelopmentReworkLookup: { data: { bomRows: referenceRows } }, materialDrafts: { box: { enabled: false }, label: { enabled: false }, instruction: { enabled: false } }, bomRows: [{ code: 'SKU00052445', productMainId: '999', typeValue: 1, type: '成品', joinId: '1' }] };
(async () => {
  assert.deepEqual(Array.from(context.productDevelopmentReferencePackagingRows(detail), (row) => row.code), [packaging.code], 'Select packaging, not labels/boxes/formula/finished goods; deduplicate');
  assert.equal(context.productDevelopmentReferencePackagingRows({ ...detail, supplement: true }).length, 0, 'Legacy supplement workflow stays separate');
  await context.productDevelopmentBomDomAddReferencePackaging(drawer, packaging);
  assert.deepEqual(log, ['add', '其他物料', 'code:2-A0208-00459', 'search', 'type:包材']);
  assert.equal(await context.productDevelopmentBomDomAddReferencePackaging(drawer, packaging), false, 'Already bound packaging is not added again');
  assert.equal(log.length, 5);
  const source = fs.readFileSync(path.join(root, 'src/product-development/pd-dom.module.js'), 'utf8');
  assert(source.includes('if (reworkProductCode && isSupplement)'));
  const calls = [];
  let rows = structuredClone(detail.bomRows);
  context.state = { productDevelopmentTaskFormData: { SKU1: detail } };
  context.getProductDevelopmentTaskBySku = () => ({ sku: 'SKU1', projectId: '12' });
  context.getProductDevelopmentTaskMeta = () => ({ reworkProductCode: 'SKU00052445' });
  context.productDevelopmentEnsureMaterialDrafts = () => {};
  context.productDevelopmentMaterialDraftMissingFields = () => [];
  context.productDevelopmentReadBomRows = async () => structuredClone(rows);
  context.scheduleProductDevelopmentReadonlyDetailCache = () => {};
  context.saveProductDevelopmentReadonlyDetailCache = () => {};
  context.productDevelopmentReworkLookupField = () => ({ value: '' });
  context.productDevelopmentSyncNotice = () => '';
  context.fetchPlmJson = async () => ({ data: [{ code: 'SKU1', id: 123 }] });
  context.fetchPlmApiJson = async (url, body) => {
    calls.push({ url, body });
    if (url.endsWith('/AddBatchProjectPMJoin')) {
      assert(!body.product_ids.includes(999), 'Never bind the reference product ID');
      if (body.product_ids.includes(123)) rows.push({ code: 'SKU1', productMainId: '123', typeValue: 1, type: '成品', joinId: '2' });
      if (body.material_ids.includes(501)) rows.push({ ...packaging, joinId: '3' });
    }
    return { success: true };
  };
  await context.productDevelopmentSaveBomToPlm('SKU1');
  const sync = calls.find((call) => call.url.endsWith('/MaterialBatchSaveAndSyncToProduct')).body;
  const row = sync.materials.find((item) => item.code === packaging.code);
  assert.equal(row.type, 2); assert.equal(row.material_id, 501); assert.equal(row.material_type, 3);
  assert(sync.materials.some((item) => item.code === 'SKU1' && item.product_main_id === 123));
  const adds = calls.filter((call) => call.url.endsWith('/AddBatchProjectPMJoin')).length;
  await context.productDevelopmentSaveBomToPlm('SKU1');
  assert.equal(calls.filter((call) => call.url.endsWith('/AddBatchProjectPMJoin')).length, adds, 'Repeat API saves do not rebind packaging');
  context.productDevelopmentNormalizeReworkProductCode = (code) => String(code || '').trim().toUpperCase();
  context.productDevelopmentBomDomDrawer = () => drawer;
  let finishedSearches = 0;
  context.productDevelopmentBomDomSearchProduct = async () => { finishedSearches++; return true; };
  await context.productDevelopmentFillBomDrawer('SKU1');
  assert.equal(finishedSearches, 0, 'The actual non-supplement fill flow never searches reference finished products');
  detail.supplement = true;
  await context.productDevelopmentFillBomDrawer('SKU1');
  assert.equal(finishedSearches, 1, 'Supplement rework still uses its original finished-product search');
  detail.supplement = false;
  detail.productDevelopmentReworkLookup.data.bomRows = [];
  const writes = calls.length;
  const empty = await context.productDevelopmentSaveBomToPlm('SKU1');
  assert(empty.skipped.some((item) => item.includes('对标包材')));
  assert.equal(calls.length, writes, 'No ready material means no PLM mutation');
  detail.materialDrafts.label = { enabled:true, incomplete:true };
  detail.materialDrafts.box = { enabled:true, materialName:'完整纸盒' };
  context.productDevelopmentMaterialDraftMissingFields = (kind,draft) => draft.incomplete ? ['标签规格型号','标签长度'] : [];
  const ready = context.productDevelopmentReadyBomDrafts(detail);
  assert.deepEqual(Array.from(ready.drafts, ([kind]) => kind), ['box']);
  let filled = [];
  context.productDevelopmentBomDomFillEditor = async (target,kind) => { filled.push(kind); };
  context.productDevelopmentMaterialExistingRow = () => ({ name: 'stale cached row' });
  const liveBox = document.createElement('div');
  liveBox.className = 'cardBox'; liveBox.textContent = '完整纸盒 包材/纸盒'; drawer.appendChild(liveBox);
  await context.productDevelopmentFillBomDrawer('SKU1');
  assert.deepEqual(filled, [], 'An actual visible box is not duplicated');
  liveBox.remove();
  const partial = await context.productDevelopmentFillBomDrawer('SKU1');
  assert.deepEqual(filled,['box'],'An old cached row must not prevent adding a box missing from the live drawer');
  assert(partial.skipped.some((item) => item.includes('标签规格型号')));
  context.productDevelopmentMaterialDraftPayload = () => ({code:'BOX'});
  const save = context.fetchPlmApiJson;
  context.fetchPlmApiJson = async (url,body) => {
    if(url.endsWith('/SaveMaterialDraftOfProduct')) { rows.push({code:'BOX',joinId:'20',materialId:'502',materialType:0,typeValue:2}); return {data:{id:502,code:'BOX'}}; }
    return save(url,body);
  };
  const saved = await context.productDevelopmentSaveBomToPlm('SKU1');
  assert(saved.skipped.some((item)=>item.includes('标签规格型号')));
  assert.equal(detail.materialDrafts.label.materialId,undefined,'Skipped label is never created');
  console.log('Reference BOM: packaging classification, exact search/menu/type sequence, duplicate prevention and current-product API binding passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
