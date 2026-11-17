const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.PLM_DOM_MODULE || '../tmp/sku-render-check/node_modules/linkedom');
const { document } = parseHTML('<body><div class="ant-drawer"><div class="ant-drawer-title">创建项目</div><div class="ant-drawer-body"><form><div class="ant-select"><input id="form_item_design_type" aria-controls="design-list"><span class="ant-select-selection-item">无logo</span></div><input type="checkbox" id="form_item_is_popular"><input type="checkbox" id="form_item_is_agent_sent"><input id="form_item_dev_product_name" value="不要保存"></form></div></div><div class="ant-select-dropdown ant-select-dropdown-hidden"><div id="design-list" role="listbox"></div></div><div class="ant-select-dropdown"><div id="design-list" role="listbox"></div><div class="ant-select-item-option">无logo</div><div class="ant-select-item-option">换Logo</div></div></body>');
const storage = {};
const context = vm.createContext({ document, location: { pathname: '/projectManagementChemicalNew' }, localStorage: { setItem: (key, value) => { storage[key] = value; }, getItem: (key) => storage[key] },
  productDevelopmentDomText: (value) => String(value || '').replace(/\s+/g, ' ').trim(),
  productDevelopmentDomVisible: () => true,
  productDevelopmentDomOptionText: (option) => option.textContent.trim(),
  productDevelopmentDomWait: async () => {},
  productDevelopmentDomOpenDropdown: async () => true,
  productDevelopmentDomDropdownOpen: () => false,
  productDevelopmentDomSelectionMatches: (input, value) => input.closest('.ant-select').querySelector('.ant-select-selection-item').textContent === value,
  waitFor: async (fn) => fn(), formatErrorMessage: (error) => error.message, showToast: () => {}, Event,
});
const source = fs.readFileSync(path.join(__dirname, '../src/core-project-nav.module.js'), 'utf8');
vm.runInContext(source, context);
const drawer = document.querySelector('.ant-drawer');
const selection = drawer.querySelector('.ant-select-selection-item');
const checkbox = drawer.querySelector('#form_item_is_popular');
checkbox.checked = true;
checkbox.click = () => { checkbox.checked = !checkbox.checked; };
const agent = drawer.querySelector('#form_item_is_agent_sent'); agent.checked = false;
for (const option of document.querySelectorAll('.ant-select-item-option')) option.click = () => { selection.textContent = option.textContent; };
context.ensureCreateProjectTemplateButtons();
context.ensureCreateProjectTemplateButtons();
assert.equal(drawer.querySelectorAll('[data-pfh-project-template] button').length, 2, 'Only one pair of buttons is injected');
assert(drawer.querySelector('[data-pfh-project-template] style').textContent.includes('color:#7134e8!important'), 'Buttons have a readable independent color');
assert(drawer.querySelector('[data-pfh-project-template] .is-primary'), 'Quick fill uses the primary button style');
assert.equal(context.createProjectTemplateSave(drawer), 1);
const saved = JSON.parse(Object.values(storage)[0]);
assert.equal(saved.selects.form_item_design_type, '无logo');
assert.equal(saved.checks.form_item_is_popular, true);
assert(!JSON.stringify(saved).includes('不要保存'), 'Product-specific fields are not captured');
selection.textContent = '换Logo'; checkbox.checked = false;
(async () => {
  const failed = await context.createProjectTemplateFill(drawer);
  assert.equal(failed.length, 0);
  assert.equal(selection.textContent, '无logo');
  assert.equal(checkbox.checked, true);
  assert.equal(drawer.querySelector('#form_item_dev_product_name').value, '不要保存');
  selection.textContent = '换Logo';
  const visibleDropdown = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  visibleDropdown.remove();
  let polls = 0;
  context.waitFor = async (fn) => {
    let result = fn();
    if (!result) { polls++; document.body.appendChild(visibleDropdown); result = fn(); }
    return result;
  };
  await context.createProjectTemplateSelect(drawer.querySelector('#form_item_design_type'), '无logo');
  assert.equal(selection.textContent, '无logo', 'Wait for the correct dropdown to mount on first use');
  assert.equal(polls, 1, 'A hidden duplicate list must not prevent waiting for the visible one');
  delete storage[Object.keys(storage)[0]];
  await assert.rejects(context.createProjectTemplateFill(drawer), /先保存模板/);
  console.log('Create-project template: scoped capture, local persistence, select and checkbox restore passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });
