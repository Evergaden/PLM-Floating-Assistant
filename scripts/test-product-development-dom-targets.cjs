const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, 'src', file + '.module.js'), 'utf8');
function extract(source, name) {
  const start = source.search(new RegExp('  (?:async )?function ' + name + '\\('));
  assert(start >= 0, name);
  const next = source.slice(start + 3).search(/\n  (?:async )?function /);
  return source.slice(start, next < 0 ? undefined : start + 3 + next);
}
const { document } = parseHTML('<main id="plm"></main><aside id="assistant"><label>成本价<input placeholder="请输入成本价"></label></aside>');
const context = vm.createContext({ document, PANEL_ID: 'assistant', URL,
  state: { productDevelopmentOneShotInput: null },
  productDevelopmentOneShotLoadDraft: () => ({}),
  window: { location: { origin: 'https://plm.westmonth.com' } },
  productDevelopmentDomVisible: (element) => !element.closest('[hidden]'),
  productDevelopmentPrefillText: (value) => String(value ?? '').trim(),
  productDevelopmentPrefillProductFieldValue: (detail, field) => detail[field.key],
  productDevelopmentProcurementFieldValue: () => '',
  PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS: [],
  getSkuListImageUrl: (data) => data.skuImageUrl || data.benchmarkImageUrl || '',
  escapeHtml: (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;'),
  formatErrorMessage: (error) => error.message,
});
const dom = read('product-development/pd-dom');
for (const name of ['productDevelopmentDomText', 'productDevelopmentDomAvailableValues', 'productDevelopmentDomValueMatches', 'productDevelopmentDomResolveField', 'productDevelopmentDomFillEnglishIngredients', 'productDevelopmentFillPlmPage2']) vm.runInContext(extract(dom, name), context);
context.productDevelopmentDomSelectedText = (element) => element.getAttribute('data-selected');
const selectFixture = document.createElement('input');
selectFixture.setAttribute('data-selected', '大号');
assert.equal(context.productDevelopmentDomValueMatches(selectFixture, '大', { control: 'select' }), false, 'A substring is not an identical selection');
assert.equal(context.productDevelopmentDomValueMatches(selectFixture, '大号', { control: 'select' }), true);
const definitions = [
  { key: 'costPrice', attrId: 153, label: '成本价', domId: 'old-cost', type: 'number' },
  { key: 'firstPrice', attrId: 154, label: '国内一档价格', domId: 'old-first', type: 'number' },
  { key: 'secondPrice', attrId: 155, label: '国内二档价格', domId: 'old-second', type: 'number' },
  { key: 'thirdPrice', attrId: 156, label: '国内三档价格', domId: 'old-third', type: 'number' },
  { key: 'standardPackingQuantity', attrId: 123, label: '标准装箱数', domId: 'old-packing', type: 'number' },
];
// Label markup and new group indexes observed read-only in the logged-in PLM on 2026-11-13.
const ids = ['form_item_7_attr_group_0_1_attr_language_config_json_0_value', ...[0,1,2].map(i => `form_item_7_attr_group_35_${i}_attr_language_config_json_0_value`), 'form_item_8_attr_group_0_0_attr_language_config_json_0_value'];
document.getElementById('plm').innerHTML = definitions.map((field, i) => `<div class="ant-form-item"><label for="${ids[i]}"><span id="${field.attrId}">${field.label}<span>*</span></span>${i === 4 ? '<span>AI一键生成</span>' : ''}</label><input id="${ids[i]}" role="spinbutton" placeholder="请输入${field.label}"></div>`).join('') + '<div class="ant-form-item"><label>箱重</label><input id="old-packing"></div>';
context.PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS = definitions;
const commits = [];
context.productDevelopmentDomCommitNumber = async (input, value, label) => { input.value = value; commits.push({ id: input.id, value, label }); };
context.productDevelopmentDomNativeSetter = () => { throw new Error('Numbers must commit through the form control'); };
(async () => {
  const detail = { costPrice: 4, firstPrice: 8, secondPrice: 7, thirdPrice: 6, standardPackingQuantity: 240 };
  let result = await context.productDevelopmentFillPlmPage2(detail);
  assert.equal(result.warnings.length, 0);
  assert.deepEqual(commits.map(item => item.id), ids);
  commits.length = 0;
  document.getElementById(ids[0]).value = '4.00';
  detail.secondPrice = 9;
  await context.productDevelopmentFillPlmPage2(detail);
  assert.deepEqual(commits.map(item => item.id), [ids[2]], 'Only changed numeric field is committed; equivalent number is untouched');
  assert.equal(document.getElementById('old-packing').value, '', 'An old positional ID must not overwrite another field');
  // Future group movement still follows the attribute label and its current for target.
  const cost = document.getElementById(ids[0]);
  cost.id = 'form_item_10_new_cost';
  cost.closest('.ant-form-item').querySelector('label').setAttribute('for', cost.id);
  assert.equal(context.productDevelopmentDomResolveField(definitions[0]), cost);
  cost.closest('.ant-form-item').remove();
  result = await context.productDevelopmentFillPlmPage2(detail);
  assert(result.warnings.some(warning => warning.includes('成本价')));
  assert.equal(document.querySelector('#assistant input').value, '', 'Never fill the assistant itself');
  const first = document.getElementById(ids[1]);
  first.closest('.ant-form-item').querySelector('label').remove();
  assert.equal(context.productDevelopmentDomResolveField(definitions[1]), first, 'Exact placeholder fallback');
  const duplicate = first.cloneNode(); duplicate.id = 'duplicate'; document.getElementById('plm').appendChild(duplicate);
  assert.equal(context.productDevelopmentDomResolveField(definitions[1]), null, 'Ambiguous matching must not write arbitrarily');
  duplicate.remove();
  first.closest('.ant-form-item').setAttribute('hidden', '');
  assert.equal(context.productDevelopmentDomResolveField(definitions[1]), null, 'Hidden forms are excluded');
  // Page 1 labels and mismatched label-for/input IDs read from PLM on 2026-11-16.
  const page1Fields = [{ key: 'productNameCn', label: '中文商品名称', domId: 'product_name0' }, { key: 'productNameEn', label: '英文商品名称', domId: 'product_name1' }];
  const nameField = (id, index, label) => '<div class="ant-form-item"><label for="form_item_language_config_' + index + '_product_name"><span>' + label + '</span></label><input id="' + id + '" placeholder="请输入"></div>';
  const plm = document.getElementById('plm');
  plm.innerHTML = '<button id="english-language">英语(美国)<span class="checkIcon"></span></button>' + nameField('product_name0', 0, '商品名称');
  let languageClicks = 0;
  document.getElementById('english-language').addEventListener('click', () => {
    languageClicks++;
    document.getElementById('english-language').querySelector('span').classList.add('showCheckIcon');
    plm.insertAdjacentHTML('beforeend', nameField('product_name1', 1, 'PRODUCT NAME'));
  });
  context.PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS = page1Fields;
  context.productDevelopmentPage1FieldValue = (detail, key) => detail[key];
  context.waitFor = async (fn) => fn();
  let textWrites = 0;
  context.productDevelopmentDomNativeSetter = (input, value) => { input.value = value; textWrites++; };
  for (const name of ['productDevelopmentDomEnsureEnglishLanguage', 'productDevelopmentFillPlmPage1']) vm.runInContext(extract(dom, name), context);
  const page1 = { productNameCn: '海藻身体油', productNameEn: 'Seaweed Body Oil' };
  result = await context.productDevelopmentFillPlmPage1(page1);
  assert.equal(result.warnings.length, 0, 'Live generic language labels must not reject the correct name controls');
  assert.equal(document.getElementById('product_name0').value, page1.productNameCn);
  assert.equal(document.getElementById('product_name1').value, page1.productNameEn);
  assert.equal(languageClicks, 1, 'Enable missing English once');
  await context.productDevelopmentFillPlmPage1(page1);
  assert.equal(textWrites, 2, 'Unchanged name fields do not fire a second write');
  page1.productNameEn = 'Updated Body Oil';
  await context.productDevelopmentFillPlmPage1(page1);
  assert.equal(textWrites, 3, 'Only the changed name is written');
  assert.equal(languageClicks, 1, 'Do not toggle off an already enabled English form');
  const chinese = document.getElementById('product_name0');
  chinese.closest('.ant-form-item').querySelector('span').textContent = '成本价';
  assert.equal(context.productDevelopmentDomResolveField(page1Fields[0]), null, 'A language ID with an unrelated label remains unsafe');
  chinese.closest('.ant-form-item').querySelector('span').textContent = '商品名称';
  const duplicateName = chinese.closest('.ant-form-item').cloneNode(true);
  plm.appendChild(duplicateName);
  assert.equal(context.productDevelopmentDomResolveField(page1Fields[0]), null, 'Multiple visible language controls remain ambiguous');
  duplicateName.setAttribute('hidden', '');
  assert.equal(context.productDevelopmentDomResolveField(page1Fields[0]), chinese, 'Ignore hidden duplicate form controls');
  plm.innerHTML = '<div role="tablist"><div role="tab" aria-selected="true">中文-简体</div><div role="tab" aria-selected="false">英语(美国)</div></div>' +
    '<div class="ant-form-item"><label for="form_item_2_attr_group_205_0_attr_language_config_json_0_value"><span id="202">成分占比</span></label><textarea id="form_item_2_attr_group_205_0_attr_language_config_json_0_value"></textarea></div>' +
    '<div class="ant-form-item" hidden><label for="form_item_2_attr_group_205_0_attr_language_config_json_1_value"><span id="202">INGREDIENTS(成分占比)</span></label><textarea id="form_item_2_attr_group_205_0_attr_language_config_json_1_value"></textarea></div>';
  const tabs = plm.querySelectorAll('[role="tab"]');
  const fields = plm.querySelectorAll('.ant-form-item');
  tabs.forEach((tab, index) => tab.addEventListener('click', () => {
    tabs.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
    fields.forEach((item, i) => i === index ? item.removeAttribute('hidden') : item.setAttribute('hidden', ''));
  }));
  context.productDevelopmentDomWait = async () => {};
  context.PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS = [];
  context.state.productDevelopmentOneShotInput = { sku: 'SKU1', regularIngredientsEn: 'AQUA 84.77\n1,2-HEXANEDIOL 0.5' };
  result = await context.productDevelopmentFillPlmPage2({}, 'SKU1');
  assert.equal(result.warnings.length, 0);
  assert.equal(fields[1].querySelector('textarea').value, 'AQUA 84.77\n1,2-HEXANEDIOL 0.5', 'Preserve raw ingredient percentages and commas');
  assert.equal(fields[0].querySelector('textarea').value, '', 'Never overwrite Chinese ingredients');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true', 'Restore original language');
  context.productDevelopmentOneShotLoadDraft = () => ({ regularIngredientsEn: '' });
  result = await context.productDevelopmentFillPlmPage2({}, 'SKU2');
  assert(result.warnings.some(warning => warning.includes('暂无可填写')), 'Do not reuse another SKU ingredients');
  fields[1].remove();
  result = await context.productDevelopmentFillPlmPage2({}, 'SKU1');
  assert(result.warnings.some(warning => warning.includes('英文成分占比')));
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true', 'Restore language after a missing field');
  plm.innerHTML = '<div class="ant-form-item"><label for="top-process"><span id="118">加工方式</span></label><input id="top-process"></div>' +
    '<input id="supplier"><input id="row-process"><input id="row-quantity"><input id="form_item_0_minimum_order_quantity" value="1">';
  context.state.productDevelopmentOneShotInput = null;
  context.PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS = [];
  context.PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS = [{key:'supplier',label:'供应商',domId:'supplier'}, {key:'processType',label:'加工方式',domId:'row-process',control:'select'}, {key:'quantity',label:'采购数量',domId:'row-quantity',type:'number'}];
  context.productDevelopmentProcurementFieldValue = (_, key) => ({supplier:'JSJ',processType:'来料加工',quantity:'1000'})[key] || '';
  const selected = [];
  context.productDevelopmentDomSelectOption = async (input, value) => { selected.push([input.id, value]); };
  context.productDevelopmentDomNativeSetter = (input, value) => { input.value = value; };
  context.productDevelopmentDomCommitNumber = async (input, value) => { input.value = value; };
  result = await context.productDevelopmentFillPlmPage2({});
  assert.equal(result.warnings.length, 0);
  assert.deepEqual(selected, [['top-process','来料加工'],['row-process','来料加工']], 'Both independent processing selectors receive the same choice');
  assert.equal(document.getElementById('row-quantity').value, '1000');
  assert.equal(document.getElementById('form_item_0_minimum_order_quantity').value, '1', 'Leave procurement row minimum order untouched');
  for (const [file, name] of [['product-development/pd-task-sync', 'productDevelopmentTaskImageUrl'], ['core-ledger-workbench', 'getLedgerThumbnailUrl'], ['core-ledger-workbench', 'productThumbHtml']]) vm.runInContext(extract(read(file), name), context);
  const source = 'https://oss-pro.plm.westmonth.cn/working.png';
  const image = context.productDevelopmentTaskImageUrl({ benchmarkImageUrl: source }, { skuImageUrl: 'https://test/stale.png' });
  assert.equal(image, source, 'Hero and sidebar use the same task image ahead of stale cached SKU images');
  const template = document.createElement('div'); template.innerHTML = context.productThumbHtml({ skuImageUrl: 'https://test/stale.png' }, image);
  assert.equal(template.querySelector('.pfh-thumb-frame img').getAttribute('data-local-image'), context.getLedgerThumbnailUrl(source));
  assert.equal(template.querySelector('.pfh-thumb-preview img').getAttribute('data-local-image-fallback'), context.getLedgerThumbnailUrl(source));
  assert(dom.includes('部分字段未填入：') && !dom.includes('请检查文件并在 PLM 手动上传'));
  console.log('PLM fields: live ID fixture, stable attribute labels, future group movement, ambiguity/hidden/panel exclusion, numeric commits and shared hero thumbnails passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
