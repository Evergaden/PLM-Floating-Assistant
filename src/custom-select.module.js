  const CUSTOM_SELECT_LAYER_ID = PANEL_ID + '-custom-select-layer';
  const CUSTOM_SELECT_SEARCH_THRESHOLD = 8;
  let customSelectState = null;
  let customSelectGlobalListenersInstalled = false;

  function isCustomSelectEligible(select, panel) {
    if (!select || select.tagName !== 'SELECT' || select.disabled || select.multiple) return false;
    if (select.hasAttribute('data-native-select') || Number(select.getAttribute('size') || 0) > 1) return false;
    if (panel && !panel.contains(select)) return false;
    return Array.from(select.options || []).some((option) => !option.disabled && !option.parentElement?.disabled);
  }

  function getCustomSelectLabel(select) {
    const ariaLabel = String(select && select.getAttribute('aria-label') || '').trim();
    if (ariaLabel) return ariaLabel;
    const label = select && select.closest('label');
    const labelText = label && Array.from(label.children).find((child) => child.tagName === 'SPAN');
    return String(labelText && labelText.textContent || '选择选项').trim() || '选择选项';
  }

  function getCustomSelectOptionSearchText(option) {
    const group = option && option.parentElement && option.parentElement.tagName === 'OPTGROUP'
      ? option.parentElement.label
      : '';
    return [group, option && option.textContent, option && option.value].filter(Boolean).join(' ').toLocaleLowerCase();
  }

  function closeCustomSelect(options) {
    const current = customSelectState;
    customSelectState = null;
    const layer = document.getElementById(CUSTOM_SELECT_LAYER_ID);
    if (layer) layer.remove();
    if (!current || !current.select) return;
    current.select.classList.remove('is-custom-select-open');
    current.select.setAttribute('aria-expanded', 'false');
    if (options && options.restoreFocus && current.select.isConnected) {
      try { current.select.focus({ preventScroll: true }); } catch (_) { current.select.focus(); }
    }
  }

  function customSelectEnabledOptionButtons() {
    const menu = customSelectState && customSelectState.menu;
    return menu ? Array.from(menu.querySelectorAll('.pfh-custom-select-option:not(:disabled)')).filter((button) => !button.hidden) : [];
  }

  function focusCustomSelectOption(direction, fromElement) {
    const buttons = customSelectEnabledOptionButtons();
    if (!buttons.length) return;
    const currentIndex = buttons.indexOf(fromElement || document.activeElement);
    let nextIndex = currentIndex;
    if (direction === 'first') nextIndex = 0;
    else if (direction === 'last') nextIndex = buttons.length - 1;
    else if (direction > 0) nextIndex = currentIndex < 0 ? 0 : Math.min(buttons.length - 1, currentIndex + 1);
    else nextIndex = currentIndex < 0 ? buttons.length - 1 : Math.max(0, currentIndex - 1);
    buttons[nextIndex].focus({ preventScroll: true });
    buttons[nextIndex].scrollIntoView({ block: 'nearest' });
  }

  function filterCustomSelectOptions(query) {
    const current = customSelectState;
    if (!current) return;
    const keyword = String(query || '').trim().toLocaleLowerCase();
    let visibleCount = 0;
    current.menu.querySelectorAll('.pfh-custom-select-option').forEach((button) => {
      const option = current.select.options[Number(button.dataset.optionIndex)];
      const visible = !keyword || getCustomSelectOptionSearchText(option).includes(keyword);
      button.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    current.menu.querySelectorAll('.pfh-custom-select-group').forEach((group) => {
      group.hidden = !group.querySelector('.pfh-custom-select-option:not([hidden])');
    });
    const empty = current.menu.querySelector('.pfh-custom-select-empty');
    if (empty) empty.hidden = visibleCount > 0;
  }

  function positionCustomSelectMenu() {
    const current = customSelectState;
    if (!current || !current.select.isConnected || !current.menu.isConnected) {
      closeCustomSelect();
      return;
    }
    const rect = current.select.getBoundingClientRect();
    const edge = 8;
    const gap = 6;
    const width = Math.min(window.innerWidth - edge * 2, Math.max(220, rect.width));
    current.menu.style.width = width + 'px';
    current.menu.style.left = Math.max(edge, Math.min(window.innerWidth - width - edge, rect.left)) + 'px';
    const roomBelow = window.innerHeight - rect.bottom - edge - gap;
    const roomAbove = rect.top - edge - gap;
    const available = Math.max(150, Math.min(380, Math.max(roomBelow, roomAbove)));
    current.menu.style.setProperty('--pfh-custom-select-available-height', available + 'px');
    const menuHeight = Math.min(current.menu.scrollHeight, available);
    const openAbove = roomBelow < Math.min(210, menuHeight) && roomAbove > roomBelow;
    const top = openAbove ? rect.top - menuHeight - gap : rect.bottom + gap;
    current.menu.classList.toggle('is-above', openAbove);
    current.menu.style.top = Math.max(edge, Math.min(window.innerHeight - menuHeight - edge, top)) + 'px';
  }

  function buildCustomSelectOptions(select) {
    let activeGroup = null;
    let html = '';
    Array.from(select.options || []).forEach((option, index) => {
      const groupNode = option.parentElement && option.parentElement.tagName === 'OPTGROUP' ? option.parentElement : null;
      const groupLabel = groupNode ? String(groupNode.label || '') : '';
      if (groupLabel !== activeGroup) {
        if (activeGroup !== null) html += '</div>';
        activeGroup = groupLabel;
        html += '<div class="pfh-custom-select-group">' + (groupLabel ? '<div class="pfh-custom-select-group-label">' + escapeHtml(groupLabel) + '</div>' : '');
      }
      const disabled = option.disabled || Boolean(groupNode && groupNode.disabled);
      const checkIcon = option.selected
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="m8.2 12.1 2.4 2.4 5.2-5.2"></path></svg>'
        : '';
      html += '<button type="button" class="pfh-custom-select-option' + (option.selected ? ' is-selected' : '') + '" role="option" aria-selected="' + (option.selected ? 'true' : 'false') + '" data-option-index="' + index + '"' + (disabled ? ' disabled' : '') + '><span>' + escapeHtml(option.textContent || option.value || '') + '</span><i aria-hidden="true">' + checkIcon + '</i></button>';
    });
    if (activeGroup !== null) html += '</div>';
    return html;
  }

  function copyCustomSelectTheme(panel, layer) {
    if (!panel || !layer) return;
    const style = getComputedStyle(panel);
    [
      '--pfh-theme-surface', '--pfh-theme-control-surface', '--pfh-theme-text', '--pfh-theme-muted',
      '--pfh-theme-border', '--pfh-theme-border-strong', '--pfh-theme-primary', '--pfh-theme-primary-hover',
      '--pfh-theme-primary-soft', '--pfh-theme-shadow-soft',
    ].forEach((name) => {
      const value = style.getPropertyValue(name);
      if (value) layer.style.setProperty(name, value);
    });
  }

  function chooseCustomSelectOption(index) {
    const current = customSelectState;
    if (!current || !current.select.isConnected) return;
    const option = current.select.options[Number(index)];
    if (!option || option.disabled || option.parentElement?.disabled) return;
    const changed = current.select.selectedIndex !== Number(index);
    current.select.selectedIndex = Number(index);
    closeCustomSelect({ restoreFocus: true });
    if (!changed) return;
    current.select.dispatchEvent(new Event('input', { bubbles: true }));
    current.select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function openCustomSelect(select) {
    const panel = document.getElementById(PANEL_ID);
    if (!isCustomSelectEligible(select, panel)) return;
    closeCustomSelect();
    const label = getCustomSelectLabel(select);
    const optionCount = select.options.length;
    const searchable = optionCount >= CUSTOM_SELECT_SEARCH_THRESHOLD;
    const layer = document.createElement('div');
    layer.id = CUSTOM_SELECT_LAYER_ID;
    layer.className = 'pfh-custom-select-layer';
    layer.innerHTML = '<section class="pfh-custom-select-menu" role="listbox" aria-label="' + escapeHtml(label) + '"><header><strong>' + escapeHtml(label) + '</strong><small>' + optionCount + ' 项</small></header>' +
      (searchable ? '<label class="pfh-custom-select-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"></circle><path d="m16 16 4.2 4.2"></path></svg><input type="search" autocomplete="off" placeholder="搜索选项" aria-label="搜索' + escapeHtml(label) + '"></label>' : '') +
      '<div class="pfh-custom-select-options">' + buildCustomSelectOptions(select) + '<div class="pfh-custom-select-empty" hidden>没有匹配选项</div></div></section>';
    copyCustomSelectTheme(panel, layer);
    document.documentElement.appendChild(layer);
    const menu = layer.querySelector('.pfh-custom-select-menu');
    customSelectState = { select, layer, menu };
    select.classList.add('is-custom-select-open');
    select.setAttribute('aria-haspopup', 'listbox');
    select.setAttribute('aria-expanded', 'true');
    positionCustomSelectMenu();
    const search = menu.querySelector('.pfh-custom-select-search input');
    const selected = menu.querySelector('.pfh-custom-select-option.is-selected:not(:disabled)');
    window.requestAnimationFrame(() => {
      if (!customSelectState || customSelectState.select !== select) return;
      if (search) search.focus({ preventScroll: true });
      else if (selected) selected.focus({ preventScroll: true });
      else focusCustomSelectOption('first');
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    });
  }

  function handleCustomSelectPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const panel = event.currentTarget;
    const select = event.target && event.target.closest && event.target.closest('select');
    if (!isCustomSelectEligible(select, panel)) return;
    event.preventDefault();
    event.stopPropagation();
    openCustomSelect(select);
  }

  function handleCustomSelectClickCapture(event) {
    const select = event.target && event.target.closest && event.target.closest('select');
    if (!isCustomSelectEligible(select, event.currentTarget)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function handleCustomSelectSourceKeydown(event) {
    const select = event.target && event.target.closest && event.target.closest('select');
    if (!isCustomSelectEligible(select, event.currentTarget)) return;
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    openCustomSelect(select);
  }

  function handleCustomSelectLayerClick(event) {
    const button = event.target && event.target.closest && event.target.closest('.pfh-custom-select-option');
    if (!button || button.disabled) return;
    chooseCustomSelectOption(button.dataset.optionIndex);
  }

  function handleCustomSelectLayerInput(event) {
    if (!event.target.matches('.pfh-custom-select-search input')) return;
    filterCustomSelectOptions(event.target.value);
  }

  function handleCustomSelectLayerKeydown(event) {
    if (!customSelectState) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCustomSelect({ restoreFocus: true });
      return;
    }
    if (event.key === 'Tab') {
      closeCustomSelect();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusCustomSelectOption(event.key === 'ArrowDown' ? 1 : -1, event.target);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusCustomSelectOption(event.key === 'Home' ? 'first' : 'last');
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.pfh-custom-select-option')) {
      event.preventDefault();
      chooseCustomSelectOption(event.target.dataset.optionIndex);
    }
  }

  function installCustomSelectController(panel) {
    if (!panel || panel.__pfhCustomSelectInstalled) return;
    if (customSelectState && !customSelectState.select.isConnected) closeCustomSelect();
    panel.__pfhCustomSelectInstalled = true;
    panel.addEventListener('pointerdown', handleCustomSelectPointerDown, true);
    panel.addEventListener('mousedown', handleCustomSelectClickCapture, true);
    panel.addEventListener('click', handleCustomSelectClickCapture, true);
    panel.addEventListener('keydown', handleCustomSelectSourceKeydown, true);
    const observer = new MutationObserver(() => {
      if (customSelectState && !customSelectState.select.isConnected) closeCustomSelect();
    });
    observer.observe(panel, { childList: true, subtree: true });
    panel.__pfhCustomSelectObserver = observer;
    if (customSelectGlobalListenersInstalled) return;
    customSelectGlobalListenersInstalled = true;
    document.addEventListener('pointerdown', (event) => {
      const current = customSelectState;
      if (!current || current.menu.contains(event.target) || event.target === current.select) return;
      closeCustomSelect();
    }, true);
    document.addEventListener('click', handleCustomSelectLayerClick);
    document.addEventListener('input', handleCustomSelectLayerInput);
    document.addEventListener('keydown', handleCustomSelectLayerKeydown);
    document.addEventListener('scroll', (event) => {
      if (customSelectState && !customSelectState.menu.contains(event.target)) closeCustomSelect();
    }, true);
    window.addEventListener('resize', () => {
      if (customSelectState) positionCustomSelectMenu();
    });
  }
