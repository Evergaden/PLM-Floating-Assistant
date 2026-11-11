
  function productDevelopmentDomWait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function productDevelopmentDomText(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\s+/g, ' ')
      .replace(/\s*([\/／>＞|])\s*/g, '$1')
      .trim();
  }

  function productDevelopmentDomVisible(element) {
    if (!element || !element.isConnected) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = element.getBoundingClientRect();
    return Boolean(rect.width || rect.height);
  }

  function productDevelopmentDomNativeSetter(element, value, events) {
    if (!element || element.type === 'file') return false;
    const stringValue = String(value === null || value === undefined ? '' : value);
    const prototype = element instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(element, stringValue);
    else element.value = stringValue;
    (Array.isArray(events) ? events : ['input', 'change', 'blur']).forEach((type) => {
      const event = type === 'input' && typeof window.InputEvent === 'function'
        ? new window.InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: stringValue })
        : new Event(type, { bubbles: true, composed: true });
      element.dispatchEvent(event);
    });
    return true;
  }

  function productDevelopmentDomSelectedText(input) {
    const container = input && input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    if (!container) return productDevelopmentDomText(input && input.value);
    const items = Array.from(container.querySelectorAll('.ant-select-selection-item, .ant-cascader-picker-label')).filter(productDevelopmentDomVisible);
    const values = items.map((item) => {
      const content = item.querySelector('.ant-select-selection-item-content');
      return productDevelopmentDomText(item.getAttribute('title') || content && content.textContent || item.textContent);
    }).filter(Boolean);
    return values.join(' / ') || productDevelopmentDomText(input && input.value);
  }

  function productDevelopmentDomClickTarget(input) {
    if (!input) return null;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    return container && (container.querySelector('.ant-select-selector, .ant-cascader-picker') || container) || input;
  }

  function productDevelopmentDomActivateTarget(target, focusTarget) {
    if (!target) return false;
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
    const eventOptions = { bubbles: true, cancelable: true, composed: true, button: 0, buttons: 1 };
    target.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    target.dispatchEvent(new MouseEvent('mouseup', { ...eventOptions, buttons: 0 }));
    target.click();
    return true;
  }

  function productDevelopmentDomOptionText(option) {
    if (!option) return '';
    const content = option.querySelector('.ant-select-item-option-content, .ant-cascader-menu-item-content');
    return productDevelopmentDomText(option.getAttribute('title') || option.getAttribute('aria-label') || content && content.textContent || option.textContent);
  }

  function productDevelopmentDomCategoryTextVariants(value) {
    const text = productDevelopmentDomText(value);
    const variants = new Set(text ? [text] : []);
    if (text === '食物酒水') variants.add('食品酒水');
    if (text === '食品酒水') variants.add('食物酒水');
    return Array.from(variants);
  }

  function productDevelopmentDomCascaderTextMatches(candidate, wanted) {
    const wantedVariants = productDevelopmentDomCategoryTextVariants(wanted);
    return productDevelopmentDomCategoryTextVariants(candidate).some((candidateText) => wantedVariants.some((wantedText) => (
      candidateText === wantedText || candidateText.endsWith(wantedText)
    )));
  }

  function productDevelopmentDomVisibleDropdowns() {
    return Array.from(document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden), .ant-cascader-dropdown'))
      .filter(productDevelopmentDomVisible);
  }

  function productDevelopmentDomVisibleCascaderMenus() {
    return productDevelopmentDomVisibleDropdowns()
      .filter((dropdown) => dropdown.classList.contains('ant-cascader-dropdown') || dropdown.querySelector('.ant-cascader-menu'))
      .flatMap((dropdown) => Array.from(dropdown.querySelectorAll('.ant-cascader-menu')).filter(productDevelopmentDomVisible));
  }

  function productDevelopmentDomCascaderMenuOptions(menu) {
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('.ant-cascader-menu-item, [role="menuitem"]'))
      .filter(productDevelopmentDomVisible)
      .filter((option) => option.getAttribute('aria-disabled') !== 'true' && !option.classList.contains('ant-cascader-menu-item-disabled'));
  }

  function productDevelopmentDomRecordCascaderOptions(stage) {
    const record = productDevelopmentDomVisibleCascaderMenus().map((menu, index) => ({
      column: index + 1,
      stage: String(stage || ''),
      options: productDevelopmentDomCascaderMenuOptions(menu).map((option) => ({
        text: productDevelopmentDomOptionText(option),
        id: option.getAttribute('data-id') || option.getAttribute('data-value') || option.getAttribute('value') || '',
        title: option.getAttribute('title') || '',
        hasChildren: option.classList.contains('ant-cascader-menu-item-expand') || Boolean(option.querySelector('.ant-cascader-menu-item-expand-icon')),
      })).filter((item) => item.text),
    })).filter((item) => item.options.length);
    if (record.length) {
      const detail = record.map((item) => '第' + item.column + '列：' + item.options.map((option) => option.text).join('、')).join(' | ');
      const key = String(stage || '') + '|' + detail;
      if (!productDevelopmentCategoryOptionRecordKeys.has(key)) {
        productDevelopmentCategoryOptionRecordKeys.add(key);
        productDevelopmentLog('info', '记录 PLM 类目选项', (stage ? String(stage) + ' | ' : '') + detail);
      }
    }
    return record;
  }

  async function productDevelopmentLoadCategoryOptions(parentId) {
    const key = String(parentId === undefined || parentId === null ? 0 : parentId);
    if (productDevelopmentCategoryOptionsCache[key]) return productDevelopmentCategoryOptionsCache[key];
    const payload = await fetchPlmJson('/api/ProjectFormData/GetCategorySelectOptionNew?types=1&parent_id=' + encodeURIComponent(key));
    const nodes = productDevelopmentReadonlyList(payload).map((node) => ({
      id: String(node && node.id || '').trim(),
      parentId: String(node && node.parent_id === undefined ? key : node.parent_id || '').trim(),
      name: productDevelopmentDomText(node && node.name),
      children: Array.isArray(node && node.children) ? node.children : [],
    })).filter((node) => node.id && node.name);
    productDevelopmentCategoryOptionsCache[key] = nodes;
    if (nodes.length) productDevelopmentLog('info', '读取 PLM 类目接口选项', 'parent_id=' + key + ' | ' + nodes.map((node) => node.name + '(' + node.id + ')').join('、'));
    return nodes;
  }

  async function productDevelopmentResolveCascaderSegments(input, target) {
    const directSegments = productDevelopmentDomCascaderSegments(input, target);
    const rawSegments = productDevelopmentPrefillText(target, 800).split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    if (!input || input.id !== 'form_item_category_id') return directSegments;
    const categorySegments = rawSegments[0] === '成品' ? rawSegments.slice(1) : rawSegments;
    if (categorySegments.length !== 1) return directSegments;
    const wanted = productDevelopmentDomText(categorySegments[0]);
    if (!wanted) return directSegments;
    const queue = [{ parentId: '0', path: [] }];
    const visited = new Set();
    while (queue.length && visited.size < 160) {
      const current = queue.shift();
      const parentKey = String(current.parentId);
      if (visited.has(parentKey)) continue;
      visited.add(parentKey);
      let nodes = [];
      try {
        nodes = await productDevelopmentLoadCategoryOptions(parentKey);
      } catch (error) {
        productDevelopmentLog('warn', '读取 PLM 类目选项失败', parentKey + ' | ' + formatErrorMessage(error));
        continue;
      }
      nodes.forEach((node) => {
        const path = current.path.concat(node.name);
        if (productDevelopmentDomCascaderTextMatches(node.name, wanted)) {
          queue.length = 0;
          queue.push({ parentId: '__resolved__', path });
          return;
        }
        if (Number(node.id) > 0 && (node.children.length || path.length < 4)) queue.push({ parentId: node.id, path });
      });
      const resolved = queue.find((item) => item.parentId === '__resolved__');
      if (resolved) return resolved.path;
    }
    return directSegments;
  }

  async function productDevelopmentDomWaitForCascaderOption(segment, columnIndex, timeout, stage) {
    const option = await waitFor(() => {
      const menus = productDevelopmentDomVisibleCascaderMenus();
      productDevelopmentDomRecordCascaderOptions(stage || '第' + (columnIndex + 1) + '列');
      const menu = menus[columnIndex] || menus[menus.length - 1];
      if (!menu) return null;
      const wanted = productDevelopmentDomText(segment);
      return productDevelopmentDomCascaderMenuOptions(menu).find((item) => productDevelopmentDomCascaderTextMatches(productDevelopmentDomOptionText(item), wanted))
        || null;
    }, timeout || 10000, 100);
    if (!option) throw new Error('PLM 类目第' + (columnIndex + 1) + '列找不到“' + segment + '”');
    return option;
  }

  function productDevelopmentDomDropdownOpen(input) {
    const container = input && input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    return Boolean(input && input.getAttribute('aria-expanded') === 'true'
      || container && (container.classList.contains('ant-select-open') || container.classList.contains('ant-cascader-picker-open')));
  }

  async function productDevelopmentDomOpenDropdown(input) {
    const container = input && input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const targets = [
      input,
      productDevelopmentDomClickTarget(input),
      container && container.querySelector('.ant-select-arrow, .ant-cascader-picker-arrow'),
    ].filter((target, index, list) => target && list.indexOf(target) === index);
    for (const target of targets) {
      productDevelopmentDomActivateTarget(target, input);
      const opened = await waitFor(() => productDevelopmentDomDropdownOpen(input) && productDevelopmentDomVisibleDropdowns().length > 0, 1800, 80);
      if (opened) return true;
    }
    return false;
  }

  function productDevelopmentDomVisibleOptions() {
    const selectors = [
      '.ant-select-item-option',
      '[role="option"]',
      '.ant-cascader-menu-item',
    ];
    const seen = new Set();
    const dropdowns = productDevelopmentDomVisibleDropdowns();
    return dropdowns.flatMap((dropdown) => selectors.flatMap((selector) => Array.from(dropdown.querySelectorAll(selector)))).filter((option) => {
      if (seen.has(option) || !productDevelopmentDomVisible(option)) return false;
      seen.add(option);
      return option.getAttribute('aria-disabled') !== 'true' && !option.classList.contains('ant-select-item-option-disabled');
    });
  }

  function productDevelopmentDomFindOption(target) {
    const wanted = productDevelopmentDomText(target);
    const options = productDevelopmentDomVisibleOptions();
    return options.find((option) => productDevelopmentDomOptionText(option) === wanted)
      || options.find((option) => productDevelopmentDomOptionText(option).endsWith(wanted))
      || options.find((option) => productDevelopmentDomOptionText(option).includes(wanted));
  }

  function productDevelopmentDomFindExactOption(target) {
    const wanted = productDevelopmentDomText(target);
    return productDevelopmentDomVisibleOptions().find((option) => productDevelopmentDomOptionText(option) === wanted);
  }

  function productDevelopmentDomSelectionMatches(input, target) {
    const current = productDevelopmentDomText(productDevelopmentDomSelectedText(input));
    const wanted = productDevelopmentDomText(target);
    return Boolean(current && wanted && (current === wanted || current.includes(wanted)));
  }

  function productDevelopmentDomCascaderSegments(input, target) {
    const segments = productDevelopmentPrefillText(target, 800).split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    if (!segments.length) return segments;
    if (input && input.id === 'form_item_category_id' && segments[0] !== '成品') segments.unshift('成品');
    if (input && input.id === 'product_group_id' && !['成品（新品）', '成品（定制品）'].includes(segments[0])) segments.unshift('成品（新品）');
    return segments;
  }

  async function productDevelopmentDomWaitForOption(target, timeout) {
    const option = await waitFor(() => productDevelopmentDomFindOption(target), timeout || 6000, 100);
    if (!option) throw new Error('PLM 下拉中找不到“' + target + '”');
    return option;
  }

  async function productDevelopmentDomSelectOption(input, target, control) {
    if (!input) throw new Error('未找到 PLM 下拉控件');
    const wanted = productDevelopmentPrefillText(target, 800);
    if (!wanted) throw new Error('下拉字段缺少填写值');
    if (productDevelopmentDomSelectionMatches(input, wanted)) return;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const clear = container && container.querySelector('.ant-select-clear, .ant-cascader-picker-clear');
    if (clear && productDevelopmentDomVisible(clear)) clear.click();
    if (control === 'search-select' && !input.readOnly && input.type !== 'file') {
      input.focus();
      productDevelopmentDomNativeSetter(input, wanted, ['input']);
    }
    const opened = await productDevelopmentDomOpenDropdown(input);
    if (!opened) throw new Error('PLM 下拉未能展开');
    if (control === 'cascader') {
      const segments = await productDevelopmentResolveCascaderSegments(input, wanted);
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const option = await productDevelopmentDomWaitForCascaderOption(segment, index, 12000, segments.slice(0, index + 1).join(' / '));
        productDevelopmentDomActivateTarget(option);
        if (index < segments.length - 1) {
          await waitFor(() => {
            const menus = productDevelopmentDomVisibleCascaderMenus();
            productDevelopmentDomRecordCascaderOptions(segments.slice(0, index + 1).join(' / '));
            const nextMenu = menus[index + 1] || menus[menus.length - 1];
            if (!nextMenu) return false;
            const wantedNext = productDevelopmentDomText(segments[index + 1]);
            return productDevelopmentDomCascaderMenuOptions(nextMenu).some((item) => {
              const text = productDevelopmentDomOptionText(item);
              return productDevelopmentDomCascaderTextMatches(text, wantedNext);
            });
          }, 12000, 100);
          await productDevelopmentDomWait(80);
        }
      }
    } else if (control === 'search-select') {
      if (input.readOnly || input.type === 'file') throw new Error('PLM 搜索下拉不可输入');
      input.focus();
      productDevelopmentDomNativeSetter(input, wanted, ['input']);
      const option = await waitFor(() => productDevelopmentDomFindExactOption(wanted), 8000, 100);
      if (!option) throw new Error('PLM 搜索结果中找不到“' + wanted + '”');
      option.click();
    } else {
      if (!input.readOnly && input.type !== 'file') {
        productDevelopmentDomNativeSetter(input, wanted, ['input']);
      }
      const option = await productDevelopmentDomWaitForOption(wanted, 8000);
      option.click();
    }
    const confirmed = await waitFor(() => productDevelopmentDomSelectionMatches(input, wanted), 5000, 100);
    if (!confirmed) throw new Error('PLM 未确认选中“' + wanted + '”');
  }

  function productDevelopmentDomFindButton(label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from(document.querySelectorAll('button')).find((button) => productDevelopmentDomVisible(button) && productDevelopmentDomText(button.textContent) === wanted)
      || Array.from(document.querySelectorAll('button')).find((button) => productDevelopmentDomVisible(button) && productDevelopmentDomText(button.textContent).includes(wanted));
  }

  async function productDevelopmentDomEnsureEnglishLanguage() {
    const englishInput = () => {
      const input = document.getElementById('product_name1');
      return input && productDevelopmentDomVisible(input) ? input : null;
    };
    if (englishInput()) return false;
    const button = Array.from(document.querySelectorAll('button')).find((item) => (
      productDevelopmentDomVisible(item) && productDevelopmentDomText(item.textContent) === '英语(美国)'
    ));
    if (!button) throw new Error('页面1未找到“英语(美国)”语言按钮');
    const alreadySelected = Boolean(button.querySelector('.showCheckIcon'));
    if (!alreadySelected) button.click();
    const mounted = await waitFor(englishInput, 10000, 100);
    if (!mounted) throw new Error('点击“英语(美国)”后英文表单未出现');
    return !alreadySelected;
  }

  function productDevelopmentBomDomDrawer(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (typeof getProjectBomDrawerForSku === 'function') {
      const drawer = getProjectBomDrawerForSku(normalizedSku);
      if (drawer) return drawer;
    }
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(productDevelopmentDomVisible)
      .find((drawer) => {
        const text = productDevelopmentDomText(drawer.textContent);
        return /绑定BOM|绑BOM/.test(text) && (!normalizedSku || text.includes(normalizedSku));
      }) || null;
  }

  function productDevelopmentBomDomActiveEditor(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.cardBox, .materialEditList, .card'))
      .filter(productDevelopmentDomVisible)
      .find((card) => {
        const input = card.querySelector('#form_item_name');
        return input && productDevelopmentDomVisible(input) && card.querySelector('form');
      }) || null;
  }

  function productDevelopmentBomDomButton(scope, label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from((scope || document).querySelectorAll('button'))
      .filter(productDevelopmentDomVisible)
      .find((button) => productDevelopmentDomText(button.textContent) === wanted) || null;
  }

  function productDevelopmentBomDomMenuItem(label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from(document.querySelectorAll('.ant-dropdown-menu-item, [role="menuitem"]'))
      .filter(productDevelopmentDomVisible)
      .find((item) => productDevelopmentDomText(item.textContent) === wanted) || null;
  }

  async function productDevelopmentBomDomSelectCategory(input, target, options) {
    const wanted = productDevelopmentPrefillText(target, 800);
    const force = Boolean(options && options.force);
    if (!input || !wanted) throw new Error('物料分类缺少填写值');
    if (!force && productDevelopmentDomSelectionMatches(input, wanted)) return;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const clear = container && container.querySelector('.ant-select-clear, .ant-cascader-picker-clear');
    if (clear && productDevelopmentDomVisible(clear)) {
      clear.click();
      await productDevelopmentDomWait(80);
    }
    const opened = await productDevelopmentDomOpenDropdown(input);
    if (!opened) throw new Error('物料分类下拉未能展开');
    const segments = wanted.split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex];
      const option = await productDevelopmentDomWaitForCascaderOption(segment, segmentIndex, 12000, segments.slice(0, segmentIndex + 1).join(' / '));
      productDevelopmentDomActivateTarget(option);
      if (segmentIndex < segments.length - 1) {
        const nextSegment = segments[segmentIndex + 1];
        const nextMenuReady = await waitFor(() => {
          const menus = productDevelopmentDomVisibleCascaderMenus();
          productDevelopmentDomRecordCascaderOptions(segments.slice(0, segmentIndex + 1).join(' / '));
          const nextMenu = menus[segmentIndex + 1] || menus[menus.length - 1];
          if (!nextMenu) return false;
          const wantedNext = productDevelopmentDomText(nextSegment);
          return productDevelopmentDomCascaderMenuOptions(nextMenu).some((item) => {
            const text = productDevelopmentDomOptionText(item);
            return text === wantedNext || text.endsWith(wantedNext);
          });
        }, 12000, 100);
        if (!nextMenuReady) throw new Error('PLM 物料分类下一层“' + nextSegment + '”未加载');
      }
    }
    const selected = await waitFor(() => productDevelopmentDomSelectionMatches(input, wanted) || !productDevelopmentDomDropdownOpen(input), 5000, 100);
    if (!force && !selected) throw new Error('PLM 未确认物料分类“' + wanted + '”');
  }

  function productDevelopmentBomDomKindLabel(kind) {
    return kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '说明书';
  }

  function productDevelopmentBomDomMenuLabel(kind) {
    return kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '印刷';
  }

  function productDevelopmentBomDomProductSearch(drawer) {
    if (!drawer) return null;
    const input = Array.from(drawer.querySelectorAll('input[placeholder="搜索成品编码"]'))
      .find(productDevelopmentDomVisible);
    if (!input) return null;
    return {
      input,
      scope: input.closest('.cardBox, .materialEditList, .card') || input.parentElement || drawer,
    };
  }

  function productDevelopmentBomDomHasProductCode(drawer, code) {
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    if (!drawer || !normalizedCode) return false;
    return Array.from(drawer.querySelectorAll('.cardBox'))
      .filter(productDevelopmentDomVisible)
      .filter((card) => !card.querySelector('input[placeholder="搜索成品编码"]'))
      .some((card) => productDevelopmentDomText(card.textContent).includes(normalizedCode));
  }

  async function productDevelopmentBomDomSearchProduct(drawer, code) {
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    if (!normalizedCode) return false;
    if (productDevelopmentBomDomActiveEditor(drawer) || productDevelopmentBomDomProductSearch(drawer)) {
      throw new Error('PLM 当前还有未确认的物料或成品搜索行，请先确定或取消后再试');
    }
    const addButton = productDevelopmentBomDomButton(drawer, '添加物料');
    if (!addButton) throw new Error('当前绑定 BOM 抽屉未找到“添加物料”按钮');
    addButton.click();
    const menuItem = await waitFor(() => productDevelopmentBomDomMenuItem('成品'), 5000, 100);
    if (!menuItem) throw new Error('添加物料菜单未找到“成品”');
    menuItem.click();
    const search = await waitFor(() => productDevelopmentBomDomProductSearch(drawer), 8000, 120);
    if (!search || !search.input) throw new Error('PLM 未打开成品搜索表单');
    productDevelopmentDomNativeSetter(search.input, normalizedCode);
    await productDevelopmentDomWait(80);
    const searchButton = productDevelopmentBomDomButton(search.scope, '搜索') || productDevelopmentBomDomButton(drawer, '搜索');
    if (!searchButton) throw new Error('成品搜索表单未找到“搜索”按钮');
    searchButton.click();
    await productDevelopmentDomWait(300);
    return true;
  }

  function productDevelopmentBomDomCardMatches(drawer, kind, draft) {
    if (!drawer || !draft) return false;
    const materialName = productDevelopmentDomText(draft.materialName);
    return Array.from(drawer.querySelectorAll('.cardBox'))
      .filter(productDevelopmentDomVisible)
      .filter((card) => !card.querySelector('form #form_item_name'))
      .some((card) => {
        const text = productDevelopmentDomText(card.textContent);
        if (materialName && text.includes(materialName)) return true;
        if (kind === 'box') return /纸盒/.test(text) && /包材[\s/／>-]*纸盒/.test(text);
        if (kind === 'label') return /标签/.test(text) && /包材[\s/／>-]*标签/.test(text);
        return /说明书/.test(text);
      });
  }

  async function productDevelopmentBomDomOpenEditor(drawer, kind) {
    if (productDevelopmentBomDomActiveEditor(drawer)) throw new Error('PLM 当前还有未确认的物料行，请先确定或取消后再试');
    const addButton = productDevelopmentBomDomButton(drawer, '添加物料');
    if (!addButton) throw new Error('当前绑定 BOM 抽屉未找到“添加物料”按钮');
    addButton.click();
    const menuLabel = productDevelopmentBomDomMenuLabel(kind);
    const menuItem = await waitFor(() => productDevelopmentBomDomMenuItem(menuLabel), 5000, 100);
    if (!menuItem) throw new Error('添加物料菜单未找到“' + menuLabel + '”');
    menuItem.click();
    const editor = await waitFor(() => productDevelopmentBomDomActiveEditor(drawer), 8000, 120);
    if (!editor) throw new Error('PLM 未打开“' + menuLabel + '”物料表单');
    return editor;
  }

  async function productDevelopmentBomDomFillEditor(drawer, kind, draft) {
    let editor = await productDevelopmentBomDomOpenEditor(drawer, kind);
    const categoryInput = editor.querySelector('#form_item_category_id');
    if (!categoryInput) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到物料分类控件');
    await productDevelopmentBomDomSelectCategory(categoryInput, draft.categoryPath, { force: true });
    editor = productDevelopmentBomDomActiveEditor(drawer) || editor;
    const supplierInput = editor.querySelector('#form_item_default_supplier_id');
    if (!supplierInput) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到默认供应商控件');
    if (kind === 'instruction') {
      await productDevelopmentDomSelectOption(supplierInput, draft.supplier, 'select');
    }
    editor = productDevelopmentBomDomActiveEditor(drawer) || editor;
    const values = [
      ['form_item_name', draft.materialName, '物料名称', true],
      ['form_item_specification', draft.specification, '规格型号', true],
      ['form_item_long', kind === 'instruction' ? '' : draft.length, '长', kind !== 'instruction'],
      ['form_item_wide', kind === 'instruction' ? '' : draft.width, '宽', kind !== 'instruction'],
      ['form_item_high', kind === 'box' ? draft.height : '', '高', kind === 'box'],
      ['form_item_sale_price', draft.price, '采购价', true],
    ];
    values.forEach(([id, value, label, required]) => {
      const input = editor.querySelector('#' + id);
      if (!input) {
        if (required) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到“' + label + '”控件');
        return;
      }
      if (value !== '' && value !== null && value !== undefined) productDevelopmentDomNativeSetter(input, value);
    });
    const confirmButton = productDevelopmentBomDomButton(editor, '确定');
    if (!confirmButton) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到“确定”按钮');
    confirmButton.click();
    const confirmed = await waitFor(() => !productDevelopmentDomVisible(editor) || !editor.isConnected || productDevelopmentBomDomActiveEditor(drawer) !== editor, 12000, 120);
    if (!confirmed) {
      const validation = Array.from(editor.querySelectorAll('.ant-form-item-explain-error, [role="alert"]'))
        .map((node) => productDevelopmentDomText(node.textContent)).filter(Boolean).join('、');
      throw new Error(productDevelopmentBomDomKindLabel(kind) + '未能确认添加' + (validation ? '：' + validation : ''));
    }
  }

  async function productDevelopmentFillBomDrawer(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const task = getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {};
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) throw new Error('当前 SKU 详情还未读取完成');
    const taskMeta = getProductDevelopmentTaskMeta(task, detail);
    const reworkProductCode = productDevelopmentNormalizeReworkProductCode(taskMeta.reworkProductCode);
    productDevelopmentEnsureMaterialDrafts(detail, task);
    const drafts = [
      ['box', detail.materialDrafts.box],
      ['label', detail.materialDrafts.label],
      ['instruction', detail.materialDrafts.instruction],
    ].filter(([, draft]) => draft && draft.enabled !== false);
    const missing = drafts.flatMap(([kind, draft]) => productDevelopmentMaterialDraftMissingFields(kind, draft));
    if (missing.length) throw new Error('请先补充 BOM：' + missing.join('、'));
    let drawer = productDevelopmentBomDomDrawer(normalizedSku);
    if (!drawer && typeof ensureProjectBomDrawerForData === 'function') {
      drawer = await ensureProjectBomDrawerForData({
        sku: normalizedSku,
        projectId: detail.projectId || task.projectId || task.rowId || '',
        projectRowId: task.rowId || task.projectId || detail.projectId || '',
      });
    }
    if (!drawer) throw new Error('请先在 PLM 打开当前 SKU 的“绑定 BOM”抽屉');
    if (productDevelopmentBomDomActiveEditor(drawer) || productDevelopmentBomDomProductSearch(drawer)) throw new Error('PLM 当前还有未确认的物料或成品搜索行，请先确定或取消后再试');
    const added = [];
    const skipped = [];
    for (const [kind, draft] of drafts) {
      const title = productDevelopmentBomDomKindLabel(kind);
      if (productDevelopmentMaterialExistingRow(detail, kind) || productDevelopmentBomDomCardMatches(drawer, kind, draft)) {
        skipped.push(title);
        continue;
      }
      state.productDevelopmentStatus = '正在填入 PLM BOM：' + title + '…';
      await productDevelopmentBomDomFillEditor(drawer, kind, draft);
      added.push(title);
    }
    let searchedReworkProduct = '';
    if (reworkProductCode) {
      if (productDevelopmentBomDomHasProductCode(drawer, reworkProductCode)) {
        skipped.push('返工成品 ' + reworkProductCode);
      } else {
        state.productDevelopmentStatus = '正在搜索返工成品：' + reworkProductCode + '…';
        await productDevelopmentBomDomSearchProduct(drawer, reworkProductCode);
        searchedReworkProduct = reworkProductCode;
      }
    }
    if (!added.length && !searchedReworkProduct) throw new Error(skipped.length ? 'BOM 物料或返工成品已存在，未重复添加' : '没有启用的 BOM 物料可填写');
    const filledMessage = added.length ? '已填入 PLM 待保存行：' + added.join('、') : '';
    const reworkMessage = searchedReworkProduct ? '已搜索返工成品：' + searchedReworkProduct + '，请检查搜索结果' : '';
    const message = [filledMessage, reworkMessage, skipped.length ? '已跳过：' + skipped.join('、') : ''].filter(Boolean).join('；') + '。请核对后点击“批量保存”';
    detail.bomPlmSaveState = 'filled';
    detail.bomPlmSaveMessage = message;
    detail.cacheSource = 'local-cache';
    scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    return { added, skipped, message };
  }

  function productDevelopmentDomAvailableValues(definitions, valueReader) {
    return definitions.map((definition) => ({ definition, value: valueReader(definition) })).filter((item) => productDevelopmentPrefillText(item.value));
  }

  async function productDevelopmentFillPlmPage1(detail) {
    await productDevelopmentDomEnsureEnglishLanguage();
    const values = productDevelopmentDomAvailableValues(PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS, (definition) => productDevelopmentPage1FieldValue(detail, definition.key));
    const warnings = [];
    if (!values.length) return { warnings: ['悬浮助手页面1暂无可填写的数据'] };
    for (const item of values) {
      const definition = item.definition;
      const element = document.getElementById(definition.domId);
      if (!element) {
        warnings.push('页面1未找到“' + definition.label + '”控件');
        continue;
      }
      const value = productDevelopmentPrefillText(item.value, 800);
      try {
        if (definition.control) await productDevelopmentDomSelectOption(element, value, definition.control);
        else productDevelopmentDomNativeSetter(element, value);
      } catch (error) {
        warnings.push(definition.label + '：' + formatErrorMessage(error));
      }
    }
    return { warnings };
  }

  async function productDevelopmentFillPlmPage2(detail) {
    const values = productDevelopmentDomAvailableValues(PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS, (definition) => productDevelopmentPrefillProductFieldValue(detail, definition));
    const procurementValues = productDevelopmentDomAvailableValues(PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS, (definition) => productDevelopmentProcurementFieldValue(detail, definition.key));
    const warnings = [];
    if (!values.length && !procurementValues.length) return { warnings: ['悬浮助手页面2暂无可填写的数据'] };
    for (const item of values) {
      const definition = item.definition;
      const element = document.getElementById(definition.domId);
      if (!element) {
        warnings.push('页面2未找到“' + definition.label + '”控件');
        continue;
      }
      const value = productDevelopmentPrefillText(item.value, definition.type === 'textarea' ? 12000 : 800);
      try {
        if (definition.control) await productDevelopmentDomSelectOption(element, value, definition.control);
        else productDevelopmentDomNativeSetter(element, value);
      } catch (error) {
        warnings.push(definition.label + '：' + formatErrorMessage(error));
      }
    }
    if (procurementValues.length) {
      let supplierInput = document.getElementById(PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS[0].domId);
      if (!supplierInput) {
        const addRow = productDevelopmentDomFindButton('新增一行');
        if (addRow) {
          addRow.click();
          await productDevelopmentDomWait(180);
          supplierInput = document.getElementById(PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS[0].domId);
        }
      }
      if (!supplierInput) {
        warnings.push('采购明细暂无数据，也找不到“新增一行”按钮');
      } else {
        for (const item of procurementValues) {
          const definition = item.definition;
          const element = document.getElementById(definition.domId);
          if (!element) {
            warnings.push('采购明细未找到“' + definition.label + '”控件');
            continue;
          }
          const value = productDevelopmentPrefillText(item.value, 800);
          try {
            if (definition.control) await productDevelopmentDomSelectOption(element, value, definition.control);
            else productDevelopmentDomNativeSetter(element, value);
          } catch (error) {
            warnings.push(definition.label + '：' + formatErrorMessage(error));
          }
        }
      }
    }
    warnings.push('产品正面图、产品文案 DOCX 属于文件上传控件，请在 PLM 页面2手动检查并上传');
    return { warnings };
  }

  function productDevelopmentRunPlmDomFill(page, sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentDomFillSku) return;
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) {
      showToast('当前 SKU 详情还未读取完成');
      return;
    }
    const normalizedPage = page === 'page2' ? 'page2' : 'page1';
    state.productDevelopmentDomFillSku = normalizedSku;
    state.productDevelopmentStatus = '正在填写 PLM ' + (normalizedPage === 'page1' ? '页面1' : '页面2') + '…';
    state.productDevelopmentError = '';
    renderShell();
    const runner = normalizedPage === 'page1' ? productDevelopmentFillPlmPage1 : productDevelopmentFillPlmPage2;
    Promise.resolve().then(() => runner(detail)).then((result) => {
      const baseMessage = normalizedPage === 'page1'
        ? '页面1已填写，请确认后在 PLM 点击下一步'
        : '页面2已填写，请检查文件并在 PLM 手动上传后保存';
      const warnings = result && Array.isArray(result.warnings) ? result.warnings : [];
      state.productDevelopmentStatus = warnings.length ? baseMessage + '；' + warnings.join('；') : baseMessage;
      showToast(state.productDevelopmentStatus);
    }).catch((error) => {
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentDomFillSku = '';
      renderShell();
    });
  }

  function productDevelopmentRunBomDomFill(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentBomDomFillSku) return;
    if (typeof window.confirm === 'function' && !window.confirm('确认把当前启用的纸盒、标签和说明书逐条填入 PLM“绑定 BOM”界面？如已填写返工产品编码，还会打开“成品”并执行搜索；脚本不会选择搜索结果或点击“批量保存”，请最后人工核对。')) return;
    state.productDevelopmentBomDomFillSku = normalizedSku;
    state.productDevelopmentStatus = '正在打开并填写 PLM BOM…';
    state.productDevelopmentError = '';
    renderShell();
    productDevelopmentFillBomDrawer(normalizedSku).then((result) => {
      const message = result && result.message || 'BOM 物料已填入 PLM 界面，请核对后批量保存';
      state.productDevelopmentStatus = message;
      showToast(message);
    }).catch((error) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      if (detail) {
        detail.bomPlmSaveState = 'error';
        detail.bomPlmSaveMessage = '填入 PLM 界面失败：' + formatErrorMessage(error);
        detail.cacheSource = 'local-cache';
        scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      }
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentBomDomFillSku = '';
      renderShell();
    });
  }

  function productDevelopmentRunBomPlmSave(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentBomSaveSku) return;
    if (typeof window.confirm === 'function' && !window.confirm('确认将当前启用的 BOM 物料和成品绑定保存到 PLM？已移除的纸盒/标签不会新建；已有 PLM 绑定不会自动删除。')) return;
    state.productDevelopmentBomSaveSku = normalizedSku;
    state.productDevelopmentStatus = '正在保存 BOM 到 PLM…';
    state.productDevelopmentError = '';
    renderShell();
    productDevelopmentSaveBomToPlm(normalizedSku).then((result) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      const message = detail && detail.bomPlmSaveMessage || 'BOM 已保存到 PLM';
      state.productDevelopmentStatus = message;
      showToast(message);
      if (result && result.warning && /未建品|无法同步图片/.test(result.warning)) showToast('PLM 提示：项目未建品，图片同步已跳过');
    }).catch((error) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      if (detail) {
        detail.bomPlmSaveState = 'error';
        detail.bomPlmSaveMessage = '保存到 PLM 失败：' + formatErrorMessage(error);
        detail.cacheSource = 'local-cache';
        scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      }
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentBomSaveSku = '';
      renderShell();
    });
  }

  function productDevelopmentReadonlyBomRow(row) {
    const source = row && typeof row === 'object' ? row : {};
    const value = (...keys) => {
      for (const key of keys) {
        if (source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
      }
      return '';
    };
    const rawPics = source.pics !== undefined ? source.pics : value('picture_files', 'pictureFiles');
    let pics = rawPics;
    if (typeof rawPics === 'string') {
      try { pics = JSON.parse(rawPics); } catch (error) { pics = []; }
    }
    return {
      joinId: String(value('id', 'join_id', 'joinId')).trim(),
      productId: String(value('product_id', 'productId')).trim(),
      productMainId: String(value('product_main_id', 'productMainId', 'product_version_id', 'productVersionId')).trim(),
      materialId: String(value('material_id', 'materialId')).trim(),
      pics: rawPics === null ? null : (Array.isArray(pics) ? pics.slice(0, 20) : []),
      typeValue: value('type', 'type_value', 'typeValue') === '' ? '' : Number(value('type', 'type_value', 'typeValue')),
      type: Number(value('type', 'type_value', 'typeValue')) === 1 ? '成品' : '物料',
      code: productDevelopmentCleanText(value('code', 'material_code', 'materialCode'), 100),
      name: productDevelopmentCleanText(value('name', 'material_name', 'materialName', 'product_name', 'productName'), 180),
      categoryId: String(value('category_id', 'categoryId')).trim(),
      category: productDevelopmentCleanText(value('category_name', 'categoryName', 'category'), 180),
      specification: productDevelopmentCleanText(value('properties_value', 'propertiesValue', 'specification'), 220),
      usage: value('usage_value', 'usageValue', 'usage') === '' ? '' : String(value('usage_value', 'usageValue', 'usage')),
      materialType: value('material_type', 'materialType') === '' ? '' : String(value('material_type', 'materialType')),
      supplier: productDevelopmentCleanText(value('default_supplier_name', 'defaultSupplierName', 'supplier'), 180),
      supplierId: String(value('default_supplier_id', 'defaultSupplierId', 'supplierId')).trim(),
      price: value('sale_price', 'salePrice', 'purchase_price', 'purchasePrice') === '' ? '' : String(value('sale_price', 'salePrice', 'purchase_price', 'purchasePrice')),
      length: value('material_length', 'materialLength', 'length'),
      width: value('material_width', 'materialWidth', 'width'),
      height: value('material_height', 'materialHeight', 'height'),
    };
  }

  function productDevelopmentReadonlyFieldValue(attrs, definition, info, bomRows) {
    const attr = attrs.find((item) => Number(item && item.attr_id) === Number(definition.attrId)
      || String(item && item.variable_name || '') === String(definition.key || ''));
    const organizationDefault = productDevelopmentOrganizationDefaultForDefinition(definition, attr);
    let value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
    let source = value !== '' && value !== null && value !== undefined ? 'PLM 建品详情' : '';
    if (!productDevelopmentReadonlyValueText(value, attr) && organizationDefault) {
      value = organizationDefault.displayValue;
      source = organizationDefault.source;
    }
    const paperBox = bomRows.find((row) => /纸盒/.test(row.name + row.category));
    const finishedProduct = bomRows.find((row) => row.type === '成品');
    if (!productDevelopmentReadonlyValueText(value, attr) && definition.key === 'specification') {
      value = finishedProduct && finishedProduct.specification || paperBox && paperBox.specification || '';
      source = value ? 'BOM 自动带出' : '';
    }
    if (!productDevelopmentReadonlyValueText(value, attr) && ['long_outer_packaging', 'wide_outer_packaging', 'high_outer_packaging'].includes(definition.key)) {
      const dimensions = productDevelopmentReadonlyDimensionText(paperBox && paperBox.specification);
      const index = { long_outer_packaging: 0, wide_outer_packaging: 1, high_outer_packaging: 2 }[definition.key];
      value = dimensions ? dimensions[index] : (paperBox && [paperBox.length, paperBox.width, paperBox.height][index]);
      source = value !== undefined && value !== null && value !== '' ? 'BOM 自动带出' : '';
    }
    if (!productDevelopmentReadonlyValueText(value, attr) && definition.key === 'volume_outer_packaging') {
      const dimensions = ['long_outer_packaging', 'wide_outer_packaging', 'high_outer_packaging'].map((key) => {
        const item = PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS.find((candidate) => candidate.key === key);
        return Number(productDevelopmentReadonlyFieldValue(attrs, item, info, bomRows).value);
      });
      if (dimensions.every((item) => Number.isFinite(item) && item > 0)) {
        value = Number((dimensions[0] * dimensions[1] * dimensions[2]).toFixed(2));
        source = '尺寸计算';
      }
    }
    if (!productDevelopmentReadonlyValueText(value, attr) && info && info[definition.key] !== undefined) {
      value = info[definition.key];
      source = 'PLM 基础信息';
    }
    return {
      ...definition,
      value,
      displayValue: productDevelopmentReadonlyValueText(value, attr),
      source: source || '待人工补充',
      status: productDevelopmentReadonlyValueText(value, attr) ? '已预填' : '待补充',
      required: true,
      attr,
    };
  }

  function productDevelopmentReadonlyPriceFields(attrs, info, excludedDefinitions) {
    const excluded = new Set((Array.isArray(excludedDefinitions) ? excludedDefinitions : []).map((definition) => Number(definition && definition.attrId)));
    const definitions = [PRODUCT_DEVELOPMENT_PURCHASE_PRICE_FIELD].concat(PRODUCT_DEVELOPMENT_PRICE_FIELD_FALLBACKS.filter((definition) => !excluded.has(Number(definition.attrId))));
    return definitions.map((definition) => {
      const attr = attrs.find((item) => Number(item && item.attr_id) === Number(definition.attrId)
        || String(item && item.variable_name || '') === definition.key);
      let value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
      if (!productDevelopmentReadonlyValueText(value, attr) && info) {
        const infoValue = definition.key === 'procurement_rice'
          ? (info.procurement_rice !== undefined ? info.procurement_rice : info.purchase_price !== undefined ? info.purchase_price : info.purchasePrice !== undefined ? info.purchasePrice : info.procurement_price)
          : info[definition.key];
        if (infoValue !== undefined && infoValue !== null && infoValue !== '') value = infoValue;
      }
      return {
        ...definition,
        value,
        displayValue: productDevelopmentReadonlyValueText(value, attr),
        source: productDevelopmentReadonlyValueText(value, attr) ? 'PLM 建品详情' : '待人工填写',
        status: productDevelopmentReadonlyValueText(value, attr) ? '已预填' : '待补充',
        attr,
      };
    });
  }

  function productDevelopmentReadonlyAttachmentFields(attrs) {
    return [
      { attrId: 418, label: '成分表 PDF' },
      { attrId: 365, label: '条码文件' },
      { attrId: 372, label: '产品正面图' },
      { attrId: 358, label: '产品文案 DOCX' },
    ].map((definition) => {
      const attr = attrs.find((item) => Number(item && item.attr_id) === definition.attrId);
      const value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
      return {
        ...definition,
        value: productDevelopmentCloneValue(value),
        displayValue: productDevelopmentReadonlyValueText(value, attr),
        status: productDevelopmentReadonlyValueText(value, attr) ? '已读取' : '未读取',
        attr,
      };
    });
  }

  function productDevelopmentReadonlyBaseFields(values) {
    return (Array.isArray(values) ? values : []).map((definition) => {
      const value = productDevelopmentCleanText(definition.value, 800);
      return {
        ...definition,
        value,
        displayValue: value,
        source: value ? (definition.source || '开发任务 / PLM 基础信息') : '待人工补充',
        status: value ? '已预填' : '待补充',
      };
    });
  }

  function productDevelopmentReadonlyProductFields(attrs, info, bomRows) {
    const sourceAttrs = Array.isArray(attrs) && attrs.length
      ? attrs
      : PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS.map((definition) => ({
        attr_id: definition.attrId,
        variable_name: definition.key,
        attr_name: definition.label,
        is_must: true,
        value: '',
      }));
    const priceAttrIds = new Set([Number(PRODUCT_DEVELOPMENT_PURCHASE_PRICE_FIELD.attrId)].concat(PRODUCT_DEVELOPMENT_PRICE_FIELD_FALLBACKS.map((definition) => Number(definition.attrId))));
    const seen = new Set();
    return sourceAttrs.map((attr) => {
      const attrId = Number(attr && attr.attr_id);
      const key = String(attr && attr.variable_name || (Number.isFinite(attrId) ? 'attr_' + attrId : '')).trim();
      if (priceAttrIds.has(attrId) || !key || seen.has(key)) return null;
      seen.add(key);
      const definition = {
        attrId: Number.isFinite(attrId) ? attrId : 0,
        key,
        label: productDevelopmentCleanText(attr && (attr.attr_name || attr.name) || '字段 ' + (attrId || key), 100),
        groupName: productDevelopmentCleanText(attr && attr.groupName || '建品字段', 100) || '建品字段',
        required: Boolean(attr && attr.is_must),
      };
      const derived = definition.required ? productDevelopmentReadonlyFieldValue(attrs, definition, info, bomRows) : null;
      const value = derived ? derived.value : productDevelopmentReadonlyAttrValue(attr, 1);
      const displayValue = derived ? derived.displayValue : productDevelopmentReadonlyValueText(value, attr);
      return {
        ...definition,
        value,
        displayValue,
        source: derived ? derived.source : (displayValue ? 'PLM 建品详情' : '待人工补充'),
        status: displayValue ? '已预填' : '待补充',
        attr,
      };
    }).filter(Boolean);
  }

  function productDevelopmentNormalizeReadonlyDetail(task, infoPayload, contentPayload, bomPayload, productSnapshot, categoryIdOverride) {
    const source = task || {};
    const info = productDevelopmentReadonlyPayloadData(infoPayload);
    const attrs = productDevelopmentReadonlyAttrs(contentPayload);
    const rawBomRows = Array.isArray(bomPayload) ? bomPayload : productDevelopmentReadonlyList(bomPayload);
    const bomRows = rawBomRows.map((row) => row && Object.prototype.hasOwnProperty.call(row, 'joinId') && Object.prototype.hasOwnProperty.call(row, 'typeValue')
      ? row
      : productDevelopmentReadonlyBomRow(row)).filter((row) => row.code || row.name);
    const categoryId = String(categoryIdOverride || info.category_id || source.categoryId || productSnapshot && productSnapshot.categoryId || '').trim();
    const categoryName = productDevelopmentCleanText(info.category_name || source.plmCategory || productSnapshot && productSnapshot.plmCategory, 180);
    const requiredDefinitions = attrs.filter((attr) => attr && attr.is_must).map((attr) => ({
      attrId: Number(attr.attr_id),
      key: String(attr.variable_name || 'attr_' + attr.attr_id),
      label: productDevelopmentCleanText(attr.attr_name || '字段 ' + attr.attr_id, 100),
    }));
    const definitions = (requiredDefinitions.length ? requiredDefinitions : PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS).filter((item, index, list) => list.findIndex((candidate) => Number(candidate.attrId) === Number(item.attrId)) === index);
    const requiredFields = definitions.map((definition) => productDevelopmentReadonlyFieldValue(attrs, definition, info, bomRows));
    const productNameCn = productDevelopmentCleanText((info.language_config || []).find((item) => Number(item && item.language_id) === 1)?.product_name || source.name || productSnapshot && productSnapshot.chineseName, 180);
    const productNameEnSource = productDevelopmentCleanText((info.language_config || []).find((item) => Number(item && item.language_id) === 2)?.product_name || productSnapshot && productSnapshot.englishName, 180);
    const productNameEn = productDevelopmentIsEntryProductName(source.name) || productDevelopmentIsEntryProductName(productNameCn)
      ? 'Dietary Supplement'
      : productNameEnSource;
    const productId = String(info.product_id || source.productId || productSnapshot && productSnapshot.productId || '').trim();
    const productVersionId = String(info.product_version_id || source.productVersionId || productSnapshot && productSnapshot.productVersionId || '').trim();
    const productMainId = String(info.product_main_id || info.productMainId || source.productMainId || source.product_main_id || productSnapshot && (productSnapshot.productMainId || productSnapshot.product_main_id) || (bomRows.find((row) => row.type === '成品') || {}).productMainId || '').trim();
    const productInfo = productDevelopmentCloneValue(info) || {};
    const productAttrValues = productDevelopmentProductAttrValuesFromAttrs(attrs);
    const baseFields = productDevelopmentReadonlyBaseFields([
      { key: 'sku', label: 'SKU', value: source.sku, source: '开发任务' },
      { key: 'projectCode', label: '项目编码', value: source.projectCode, source: '开发任务' },
      { key: 'projectId', label: '项目 ID', value: source.projectId || source.rowId, source: '开发任务' },
      { key: 'productId', label: '产品 ID', value: productId, source: 'PLM 建品详情' },
      { key: 'productMainId', label: '成品主产品 ID', value: productMainId, source: 'PLM 建品详情 / BOM 成品绑定' },
      { key: 'productVersionId', label: '产品版本 ID', value: productVersionId, source: 'PLM 建品详情' },
      { key: 'categoryId', label: '分类 ID', value: categoryId, source: 'PLM 建品详情' },
      { key: 'categoryName', label: '分类名称', value: categoryName, source: 'PLM 建品详情' },
      { key: 'productNameCn', label: '产品中文名', value: productNameCn, source: 'PLM 建品详情' },
      { key: 'productNameEn', label: '产品英文名', value: productNameEn, source: 'PLM 建品详情' },
      { key: 'brand', label: '品牌', value: productDevelopmentNormalizeBrandValue(source.brand || productSnapshot && productSnapshot.brand || ''), source: '开发任务 / PLM' },
      { key: 'productType', label: '产品类型', value: source.productType || productSnapshot && productSnapshot.productType, source: '开发任务 / PLM' },
      { key: 'developerName', label: '开发人员', value: source.developerName, source: '开发任务' },
      { key: 'projectStatus', label: '开发任务状态', value: source.projectStatus, source: '开发任务' },
    ]);
    const materialDraftDetail = {
      sku: source.sku,
      projectId: String(source.projectId || source.rowId || '').trim(),
      productMainId,
      productNameCn,
      productNameEn,
      name: source.name || productNameCn,
      bomRows,
      requiredFields,
    };
    return {
      sku: source.sku,
      projectId: String(source.projectId || source.rowId || '').trim(),
      projectCode: source.projectCode || '',
      categoryId,
      categoryName,
      productId: String(info.product_id || source.productId || productSnapshot && productSnapshot.productId || '').trim(),
      productGroupId: String(info.product_group_id || source.productGroupId || productSnapshot && productSnapshot.productGroupId || '').trim(),
      productMainId,
      productVersionId: String(info.product_version_id || source.productVersionId || productSnapshot && productSnapshot.productVersionId || '').trim(),
      productNameCn,
      productNameEn,
      reworkProductCode: productDevelopmentCleanText(info.rework_product_code || info.reworkProductCode || info.return_product_code || info.returnProductCode || source.reworkProductCode, 120),
      baseFields,
      brand: productDevelopmentNormalizeBrandValue(source.brand || productSnapshot && productSnapshot.brand || ''),
      productType: source.productType || productSnapshot && productSnapshot.productType || '',
      productFields: productDevelopmentReadonlyProductFields(attrs, info, bomRows),
      requiredFields,
      organizationDefaults: productDevelopmentOrganizationDefaults(attrs),
      priceFields: productDevelopmentReadonlyPriceFields(attrs, info, []),
      attachments: productDevelopmentReadonlyAttachmentFields(attrs),
      bomRows,
      materialDrafts: productDevelopmentNormalizeMaterialDrafts(null, materialDraftDetail, source),
      productInfo,
      productAttrValues,
      productDetailLocalValues: {},
      productDetailLocalNames: {},
      productDetailLocalPage1: {},
      productDetailLocalProcurement: {},
      productDevelopmentReworkLookup: {
        status: 'idle',
        code: '',
        message: '',
        updatedAt: 0,
        data: null,
      },
      productDetailDraftDirty: false,
      productDetailSaveState: '',
      productDetailSaveMessage: '',
      productDetailPlmSaveState: '',
      productDetailPlmSaveMessage: '',
      bomReadState: 'loaded',
      bomLoadedAt: Date.now(),
      readonly: true,
      loadedAt: new Date().toLocaleString(),
    };
  }

  function productDevelopmentCategoryNames(task, info, productSnapshot) {
    const raw = [
      task && task.plmCategory,
      task && task.categoryName,
      info && info.category_name,
      productSnapshot && productSnapshot.plmCategory,
      productSnapshot && productSnapshot.categoryName,
    ].map((value) => productDevelopmentCleanText(value, 180)).filter(Boolean).join('/');
    return Array.from(new Set(raw.split(/[\\/\\>＞|]+/).map((value) => value.trim()).filter(Boolean))).sort((a, b) => b.length - a.length);
  }

  async function productDevelopmentFindCategoryIdByName(task, info, productSnapshot) {
    const names = productDevelopmentCategoryNames(task, info, productSnapshot);
    if (!names.length) return '';
    const targetName = names[0];
    const visited = new Set();
    const pendingParents = [0];
    while (pendingParents.length && visited.size < 80) {
      const parentId = pendingParents.shift();
      if (visited.has(parentId)) continue;
      visited.add(parentId);
      let nodes = [];
      try {
        const payload = await fetchPlmJson('/api/ProjectFormData/GetCategorySelectOptionNew?types=1&parent_id=' + encodeURIComponent(parentId));
        nodes = productDevelopmentReadonlyList(payload);
      } catch (error) {
        continue;
      }
      for (const node of nodes) {
        const nodeName = productDevelopmentCleanText(node && node.name, 180);
        if (nodeName && (nodeName === targetName || targetName.endsWith('/' + nodeName))) return String(node.id || '').trim();
        const children = Array.isArray(node && node.children) ? node.children : [];
        children.forEach((child) => {
          if (child && child.id !== undefined) pendingParents.push(Number(child.id));
        });
        if (node && Number(node.exists_child) === 1 && node.id !== undefined) pendingParents.push(Number(node.id));
      }
    }
    return '';
  }

  async function fetchProductDevelopmentReadonlyDetail(task, productSnapshot) {
    const source = task || {};
    const projectId = String(source.projectId || source.rowId || '').trim();
    if (!/^\d+$/.test(projectId)) throw new Error('当前开发任务缺少项目 ID');
    const [infoPayload, bomRows] = await Promise.all([
      fetchPlmJson('/api/ChemicalNewDevTask/GetProductDetailInfo?id=' + encodeURIComponent(projectId)),
      productDevelopmentReadBomRows(projectId),
    ]);
    const info = productDevelopmentReadonlyPayloadData(infoPayload);
    const resolvedCategoryId = await productDevelopmentFindCategoryIdByName(source, info, productSnapshot).catch(() => '');
    const categoryCandidates = Array.from(new Set([
      resolvedCategoryId,
      info.category_id,
      source.categoryId,
      productSnapshot && productSnapshot.categoryId,
    ].map((value) => String(value || '').trim()).filter((value) => /^\d+$/.test(value))));
    let contentPayload = null;
    let categoryId = '';
    for (const candidate of categoryCandidates) {
      try {
        const candidatePayload = await fetchPlmJson('/api/ChemicalNewDevTask/GetProductDetailContent?id=' + encodeURIComponent(projectId) + '&category_id=' + encodeURIComponent(candidate));
        if (productDevelopmentReadonlyAttrs(candidatePayload).length) {
          contentPayload = candidatePayload;
          categoryId = candidate;
          break;
        }
      } catch (error) {
        // Try the next known category candidate.
      }
    }
    return productDevelopmentNormalizeReadonlyDetail(source, infoPayload, contentPayload, bomRows, productSnapshot, categoryId);
  }

  function productDevelopmentReadonlyFieldHtml(field, formSku) {
    const missing = !String(field.displayValue || '').trim();
    const value = field.displayValue === '待人工补充' || field.displayValue === '待人工填写' ? '' : field.displayValue || '';
    return '<label class="pfh-product-development-form-field' + (missing ? ' is-missing' : '') + '"><span>' + escapeHtml(field.label) + '</span><input type="text" class="pfh-product-development-form-input" data-form-sku="' + escapeHtml(formSku || '') + '" data-form-group="' + escapeHtml(field.formGroup || 'required') + '" data-form-key="' + escapeHtml(field.key || '') + '" value="' + escapeHtml(value) + '"></label>';
  }

  function productDevelopmentPrefillFieldHtml(field, formSku, value) {
    const inputValue = productDevelopmentPrefillText(value, field && field.type === 'textarea' ? 12000 : 800);
    const missing = !inputValue;
    const isTextarea = field && field.type === 'textarea';
    const inputType = field && field.type === 'number' ? 'number' : 'text';
    const inputAttributes = ' class="pfh-product-development-form-input" data-form-sku="' + escapeHtml(formSku || '') + '" data-form-group="' + escapeHtml(field && field.formGroup || 'prefill') + '" data-form-key="' + escapeHtml(field && field.key || '') + '" data-form-control="' + escapeHtml(field && field.control || '') + '"' + (inputType === 'number' ? ' inputmode="decimal" step="any"' : '') + ' placeholder="' + escapeHtml(field && field.placeholder || '') + '"';
    const control = isTextarea
      ? '<textarea' + inputAttributes + ' rows="4" style="width:100%;min-height:82px;box-sizing:border-box;padding:8px 10px;border:1px solid var(--pfh-theme-border);border-radius:9px;outline:0;background:var(--pfh-theme-control-surface);color:var(--pfh-theme-text);font:inherit;font-size:11px;line-height:1.45;resize:vertical">' + escapeHtml(inputValue) + '</textarea>'
      : '<input type="' + inputType + '"' + inputAttributes + ' value="' + escapeHtml(inputValue) + '">';
    return '<label class="pfh-product-development-form-field' + (missing ? ' is-missing' : '') + '"><span>' + escapeHtml(field && field.label || '建品字段') + '</span>' + control + '</label>';
  }

  function productDevelopmentReadonlyBomFieldHtml(row, index, key, label, formSku) {
    const value = productDevelopmentReadonlyValueText(row && row[key], null);
    return productDevelopmentReadonlyFieldHtml({
      key: String(index) + '.' + key,
      label,
      displayValue: value,
      source: 'BOM 绑定数据',
      formGroup: 'bom',
    }, formSku);
  }

  function productDevelopmentReadonlyBomHtml(rows, formSku) {
    const definitions = [
      ['joinId', '绑定 ID'],
      ['type', 'BOM 类型'],
      ['code', '物料 / 成品编码'],
      ['name', '物料 / 成品名称'],
      ['category', '物料分类'],
      ['specification', '规格 / 属性'],
      ['materialType', '物料类型'],
      ['supplier', '默认供应商'],
      ['supplierId', '供应商 ID'],
      ['price', '采购 / 销售价'],
      ['usage', '用量'],
      ['length', '长度'],
      ['width', '宽度'],
      ['height', '高度'],
    ];
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<div class="pfh-product-development-form-empty">暂无 BOM 记录，可先在本地补充。</div>';
    return '<div class="pfh-product-development-file-list">' + list.map((row, index) => '<article class="pfh-product-development-card"><div class="pfh-product-development-card-head"><strong>BOM ' + (index + 1) + '</strong><i>' + escapeHtml(row.type || '未分类') + '</i></div><div class="pfh-product-development-form-grid">' + definitions.map((definition) => productDevelopmentReadonlyBomFieldHtml(row, index, definition[0], definition[1], formSku)).join('') + '</div></article>').join('') + '</div>';
  }

  function productDevelopmentMaterialInputHtml(sku, kind, field, label, value, options) {
    const config = options || {};
    const type = config.type || 'text';
    const readonly = config.readonly ? ' readonly' : '';
    const inputValue = value === null || value === undefined ? '' : String(value);
    return '<label class="pfh-product-development-material-field' + (config.wide ? ' is-wide' : '') + (config.readonly ? ' is-readonly' : '') + '"><span>' + escapeHtml(label) + '</span><input type="' + escapeHtml(type) + '" inputmode="decimal" class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '" value="' + escapeHtml(inputValue) + '"' + readonly + (config.placeholder ? ' placeholder="' + escapeHtml(config.placeholder) + '"' : '') + '></label>';
  }

  function productDevelopmentMaterialSelectHtml(sku, kind, field, label, value, options) {
    const choices = Array.isArray(options) ? options : [];
    return '<label class="pfh-product-development-material-field"><span>' + escapeHtml(label) + '</span><select class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '">' + choices.map((option) => '<option value="' + escapeHtml(option.value) + '"' + (String(option.value) === String(value) ? ' selected' : '') + '>' + escapeHtml(option.label) + '</option>').join('') + '</select></label>';
  }

  function productDevelopmentMaterialRadioHtml(sku, kind, field, label, value) {
    return '<div class="pfh-product-development-material-option-group"><span>' + escapeHtml(label) + '</span><div><label><input type="radio" class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '" name="pd-material-' + escapeHtml(kind) + '-' + escapeHtml(field) + '-' + escapeHtml(sku) + '" value="true"' + (value ? ' checked' : '') + '>是</label><label><input type="radio" class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '" name="pd-material-' + escapeHtml(kind) + '-' + escapeHtml(field) + '-' + escapeHtml(sku) + '" value="false"' + (!value ? ' checked' : '') + '>否</label></div></div>';
  }

  function productDevelopmentFinishedProductBindingHtml(detail, task) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    const row = rows.find((item) => item && (Number(item.typeValue) === 1 || item.type === '成品')) || null;
    const sku = String(detail && detail.sku || task && task.sku || '').trim().toUpperCase();
    const productMainId = String(row && row.productMainId || detail && detail.productMainId || task && task.productMainId || '').trim();
    const code = productDevelopmentCleanText(row && row.code || sku, 100);
    const name = productDevelopmentCleanText(row && row.name || detail && detail.productNameCn || task && task.name || '当前 SKU 成品', 180);
    const specification = productDevelopmentCleanText(row && row.specification || productDevelopmentMaterialPackSpec(detail), 160);
    const status = row && row.joinId ? '已绑定' : (productMainId ? '待保存' : '待绑定');
    const statusClass = status === '已绑定' ? ' is-ready' : (status === '待绑定' ? ' is-missing' : '');
    return '<article class="pfh-product-development-product-binding"><header><div><strong>成品绑定</strong><span>保存 BOM 时自动绑定当前产品</span></div><em class="' + statusClass + '">' + escapeHtml(status) + '</em></header><div class="pfh-product-development-binding-grid"><div><small>产品编码</small><b>' + escapeHtml(code || '待补充') + '</b></div><div><small>产品名称</small><b>' + escapeHtml(name || '待补充') + '</b></div><div><small>规格型号</small><b>' + escapeHtml(specification || '按 PLM 成品记录') + '</b></div></div></article>';
  }

  function productDevelopmentMaterialCardHtml(kind, draft, sku, baseName) {
    const isBox = kind === 'box';
    const isLabel = kind === 'label';
    const isInstruction = kind === 'instruction';
    const title = isBox ? '纸盒' : isLabel ? '标签' : '说明书';
    if (!draft || draft.enabled === false) {
      return '<article class="pfh-product-development-material-card is-disabled"><header><div class="pfh-product-development-material-card-title"><strong>' + escapeHtml(title) + '（本地不需要）</strong><span>已从本地物料填写中移除</span></div><button type="button" data-action="product-development-bom-toggle-material" data-bom-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-enabled="true">恢复' + escapeHtml(title) + '</button></header><p>已有 PLM 绑定不会自动删除。</p></article>';
    }
    const priceText = draft.price || (isInstruction ? '' : '按尺寸自动计算');
    const dimensionFields = isInstruction
      ? ''
      : isBox
      ? [
        productDevelopmentMaterialInputHtml(sku, kind, 'length', '长（正面，cm）', draft.length, { type: 'number', required: true }),
        productDevelopmentMaterialInputHtml(sku, kind, 'width', '宽（侧面，cm）', draft.width, { type: 'number', required: true }),
        productDevelopmentMaterialInputHtml(sku, kind, 'height', '高（cm）', draft.height, { type: 'number', required: true }),
      ].join('')
      : [
        productDevelopmentMaterialInputHtml(sku, kind, 'length', '长（cm）', draft.length, { type: 'number', required: true }),
        productDevelopmentMaterialInputHtml(sku, kind, 'width', '宽（cm）', draft.width, { type: 'number', required: true }),
      ].join('');
    const calculatorOptions = isBox
      ? '<div class="pfh-product-development-material-options"><strong>纸盒计算器选项</strong><div class="pfh-product-development-material-option-grid">' +
        productDevelopmentMaterialSelectHtml(sku, kind, 'quantity', '采购数量', draft.quantity, PRODUCT_DEVELOPMENT_BOX_QUANTITY_OPTIONS) +
        productDevelopmentMaterialRadioHtml(sku, kind, 'multiPage', '是否多页', draft.multiPage) +
        productDevelopmentMaterialRadioHtml(sku, kind, 'insertCard', '是否需内卡', draft.insertCard) +
        productDevelopmentMaterialRadioHtml(sku, kind, 'thicken', '是否需加厚', draft.thicken) +
        '</div></div>'
      : isLabel
        ? '<div class="pfh-product-development-material-defaults"><strong>标签默认规则</strong><span>圆弧 · 玻璃加粘 · 食品两年 · 用量 1</span></div>'
        : '<div class="pfh-product-development-material-defaults"><strong>说明书默认规则</strong><span>半成品 · 配件类 · 用量 1 · 不使用纸盒/标签尺寸计算</span></div>';
    const priceInput = isInstruction
      ? productDevelopmentMaterialInputHtml(sku, kind, 'price', '采购价（手动）', draft.price, { required: true })
      : productDevelopmentMaterialInputHtml(sku, kind, 'price', '采购价（自动）', priceText, { readonly: true });
    const cardClass = 'pfh-product-development-material-card' + (isInstruction ? ' is-instruction' : '');
    const cardSubtitle = productDevelopmentCleanText(draft.materialName || baseName || sku, 180);
    return '<article class="' + cardClass + '" data-material-card="' + escapeHtml(kind) + '"><header><div class="pfh-product-development-material-card-title"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(cardSubtitle) + '</span></div><div class="pfh-product-development-material-card-actions"><em data-material-price-label="' + escapeHtml(kind) + '">采购价：' + escapeHtml(priceText) + (draft.price ? ' 元' : '') + '</em><button type="button" data-action="product-development-bom-toggle-material" data-bom-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-enabled="false">移除</button></div></header><div class="pfh-product-development-material-grid">' +
      productDevelopmentMaterialInputHtml(sku, kind, 'materialName', '物料名称', draft.materialName, { wide: true, required: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'categoryPath', '物料分类（默认）', draft.categoryPath, { readonly: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'specification', '规格型号', draft.specification, { wide: isInstruction, required: true }) +
      dimensionFields +
      productDevelopmentMaterialInputHtml(sku, kind, 'supplier', '默认供应商', draft.supplier, { readonly: true }) +
      priceInput +
      '</div>' + calculatorOptions + '</article>';
  }

  function productDevelopmentMaterialPlannerHtml(detail, task) {
    const formSku = String(detail && detail.sku || '').trim().toUpperCase();
    if (!formSku) return '';
    const ensured = productDevelopmentEnsureMaterialDrafts(detail, task);
    if (ensured.changed) {
      detail.cacheSource = 'local-cache';
      scheduleProductDevelopmentReadonlyDetailCache(formSku, detail);
    }
    const baseName = productDevelopmentMaterialBaseName(task, detail);
    const saveStatus = detail.bomDraftDirty
      ? '有未保存修改'
      : detail.bomDraftSaveMessage || (detail.bomDraftSavedAt ? '已保存本地 · ' + detail.bomDraftSavedAt : '尚未保存');
    const saveStatusClass = detail.bomDraftDirty ? ' is-dirty' : (detail.bomDraftSaveState === 'error' ? ' is-error' : (detail.bomDraftSavedAt ? ' is-saved' : ''));
    const plmBusy = state.productDevelopmentBomSaveSku === formSku;
    const bomDomFillBusy = state.productDevelopmentBomDomFillSku === formSku;
    const anyBomBusy = plmBusy || bomDomFillBusy;
    const plmStatus = detail.bomPlmSaveMessage ? '<p class="pfh-product-development-material-plm-status' + (detail.bomPlmSaveState === 'error' ? ' is-error' : ' is-saved') + '">' + escapeHtml(detail.bomPlmSaveMessage) + '</p>' : '';
    const existingBom = '<section class="pfh-product-development-form-section pfh-product-development-bom-existing"><h4>PLM 当前绑定 BOM（' + escapeHtml(String((detail.bomRows || []).length)) + ' 项）</h4>' + productDevelopmentReadonlyBomHtml(detail.bomRows || [], formSku) + '</section>';
    return '<section class="pfh-product-development-material-planner"><header><div><small>BOM 绑定</small><h3>填写 BOM 物料</h3></div><div class="pfh-product-development-material-header-actions"><span class="pfh-product-development-material-save-status' + saveStatusClass + '">' + escapeHtml(saveStatus) + '</span><button type="button" data-action="product-development-bom-save-local" data-bom-sku="' + escapeHtml(formSku) + '">保存本地</button><button type="button" class="is-primary" data-action="product-development-bom-fill-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (anyBomBusy ? ' disabled' : '') + ' title="只填写 BOM 表单，不会选择成品搜索结果或点击“批量保存”">' + (bomDomFillBusy ? '正在填入…' : '一键填入 PLM BOM') + '</button><button type="button" data-action="product-development-bom-save-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (anyBomBusy ? ' disabled' : '') + '>' + (plmBusy ? '正在保存…' : 'API 直接保存') + '</button></div></header><p class="pfh-product-development-material-note">说明书从“印刷”入口填写；返工产品编码有值时会从“成品”入口执行搜索。</p>' + plmStatus + productDevelopmentFinishedProductBindingHtml(detail, task) + '<div class="pfh-product-development-material-list">' + productDevelopmentMaterialCardHtml('box', ensured.value.box, formSku, baseName) + productDevelopmentMaterialCardHtml('label', ensured.value.label, formSku, baseName) + productDevelopmentMaterialCardHtml('instruction', ensured.value.instruction, formSku, baseName) + '</div>' + existingBom + '</section>';
  }

  function productDevelopmentReadonlyAttachmentHtml(item, index, formSku) {
    const status = item && item.status ? item.status : '未读取';
    return '<article class="pfh-product-development-card"><div class="pfh-product-development-card-head"><strong>' + escapeHtml(item && item.label || '资料字段') + '</strong><i class="' + (status === '已读取' ? 'is-ready' : 'is-missing') + '">' + escapeHtml(status) + '</i></div><div class="pfh-product-development-form-grid">' + productDevelopmentReadonlyFieldHtml({
      key: String(index) + '.displayValue',
      label: '文件值 / 路径',
      displayValue: item && item.displayValue || '',
      source: '建品资料字段 ID ' + String(item && item.attrId || ''),
      formGroup: 'attachments',
    }, formSku) + '</div></article>';
  }
