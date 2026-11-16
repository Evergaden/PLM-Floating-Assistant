
  function uploadFileKey(sku, kind) {
    return String(sku || '') + ':' + String(kind || '');
  }

  function renderSkuListForActiveView(panel) {
    if (state.workMode === 'product-development' && state.view === 'productDevelopmentTasks' && typeof renderProductDevelopmentTaskSidebarList === 'function') {
      if (renderProductDevelopmentTaskSidebarList(panel)) return;
    }
    renderSkuList(panel);
  }

  function runSearch(targetView) {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = normalizeSearchInput(input.value);
    state.searchQuery = input ? input.value.trim() : '';
    state.skuPage = 1;
    updateSearchClear();
    if (state.workMode === 'product-development' && state.view === 'productDevelopmentTasks') {
      state.productDevelopmentTaskPage = 1;
      if (!renderProductDevelopmentTaskSidebarList(ensurePanel())) renderShell();
      return;
    }
    const requestedView = normalizeDetailViewTab(targetView || getCurrentDetailViewTab());
    const previousView = getCurrentDetailViewTab();
    if (!parseSearchTokens(state.searchQuery).length && !hasSkuFilters()) {
      showToast('请输入产品名、SKU 或物料编码后再搜索。', { tone: 'quiet', diagnostic: false });
      return;
    }
    const matches = parseSearchTokens(state.searchQuery).length || hasSkuFilters() ? getFilteredSearchMatches(state.searchQuery) : [];
    if (matches.length) {
      const target = matches[0];
      const data = loadData(target.sku);
      state.selectedSku = target.sku;
      state.data = data ? normalizeData(data) : null;
      state.detailViewPreviousTab = previousView !== requestedView ? previousView : '';
      const developmentView = requestedView.startsWith('development-');
      state.designDevelopmentTab = developmentView ? requestedView : '';
      state.view = requestedView === 'copywriting' || developmentView ? 'detail' : requestedView;
      state.copywritingMode = requestedView === 'copywriting';
      resetExcelState();
      if (requestedView === 'parameterImage') parameterImageFeature.loadRules();
      if (requestedView === 'copywriting' && state.data) {
        state.copywritingMode = false;
        openCopywritingFromCurrent(false);
        return;
      }
    }
    expandPanel();
    renderShell();
    if (!matches.length) {
      const hiddenByFilters = hasSkuFilters() && getSearchMatches(parseSearchTokens(state.searchQuery)).length > 0;
      showToast(hiddenByFilters
        ? '当前筛选条件下没有匹配产品，请调整或清除筛选条件。'
        : '本地资料中未找到' + (state.searchQuery ? '“' + state.searchQuery.slice(0, 60) + '”' : '匹配产品') + '，请检查编码或名称，或先在「我的详情」更新产品资料。', { tone: 'quiet', diagnostic: false });
    }
  }

  function clearSearch() {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    state.skuPage = 1;
    updateSearchClear();
    expandPanel();
    renderShell();
  }

  function updateSearchClear() {
    const panel = ensurePanel();
    const input = panel.querySelector('.pfh-search-input');
    const clear = panel.querySelector('.pfh-search-clear');
    if (!clear) return;
    clear.classList.toggle('is-visible', Boolean(input && input.value));
  }

  async function openSelectedProjectDetail(options) {
    if (state.openingProjectDetail) {
      showToast(L.openingDetail);
      return;
    }
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const sku = data && data.sku;
    if (!sku) {
      showToast(L.excelNeedData);
      return;
    }
    const preserveCopywriting = Boolean(options && options.preserveCopywriting && state.copywritingMode && state.selectedSku === sku);
    state.ignoreOutsideClickUntil = Date.now() + 2500;
    if (preserveCopywriting) {
      state.openingProjectDetail = false;
      state.openingProjectDetailSku = '';
      state.selectedSku = sku;
      state.data = data;
      resetExcelState();
      expandPanel();
    } else {
      showProjectDetailOpeningFeedback(sku, data);
    }
    showToast(L.openingDetail);
    try {
      if (!(await ensureNewProductProjectPage())) throw new Error('new product project page not ready');
      let rowId = data.projectRowId || data.projectId || '';
      if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
        cacheProjectRowId(sku, rowId);
        adoptOpenedProjectDrawer(sku);
        showToast(L.openDetailDone);
        return;
      }

      rowId = await queryProjectRowIdBySku(sku);
      if (!rowId || !(await clickProjectDetailByRowId(rowId, sku))) throw new Error('detail button not found');
      cacheProjectRowId(sku, rowId);
      adoptOpenedProjectDrawer(sku);
      showToast(L.openDetailDone);
    } catch (error) {
      console.warn('PLM floating helper open detail failed:', error);
      showToast(L.openDetailFailed);
    } finally {
      state.openingProjectDetail = false;
      if (state.selectedSku === sku) renderShell(preserveCopywriting ? '' : (state.scanRunning ? L.scanning : ''));
      window.setTimeout(() => {
        if (state.openingProjectDetailSku === sku) state.openingProjectDetailSku = '';
      }, 1000);
    }
  }

  function workspaceInitialSkuItem() {
    const selected = state.index.find((item) => item.sku === state.selectedSku);
    if (selected) return selected;
    const items = sortSkuListItems(getFilteredSearchMatches(parseSearchTokens(state.searchQuery.trim())));
    const page = clamp(state.skuPage || 1, 1, Math.max(1, Math.ceil(items.length / 10)));
    return items[(page - 1) * 10] || null;
  }

  function openFirstCachedDetail() {
    const workspaceEnabled = isWorkspaceLayoutEnabled();
    const previewItem = workspaceEnabled ? workspaceInitialSkuItem() : null;
    const first = workspaceEnabled ? (previewItem && previewItem.sku || '') : (state.index[0] && state.index[0].sku ? state.index[0].sku : '');
    if (!workspaceEnabled && !first && !state.settings.collectionEnabled) {
      showToast(L.emptyList);
      return;
    }
    if (first) {
      state.selectedSku = first;
      state.data = normalizeData(loadData(first) || previewItem || state.index[0]);
    } else {
      state.selectedSku = '';
      state.data = null;
    }
    state.view = 'detail';
    state.copywritingMode = false;
    // Avoid rendering the same detail view twice. renderShell() sorts the local
    // catalog, so the duplicate pass was especially noticeable on large lists.
    expandPanel({ render: false });
    renderShell(first ? '正在后台检查新的设计分配...' : workspaceEnabled ? '' : L.openingDetail);
    if (!state.settings.collectionEnabled) return;
    window.setTimeout(() => {
      if (state.assignedDesignTaskSyncPromise) return;
      syncAssignedDesignTasksFromApi({ deferRender: true }).then((syncResult) => {
        if (syncResult && syncResult.skipped) {
          showToast(syncResult.catalogRunning ? '全部产品正在分批采集，可在产品列表查看进度' : '五分钟内已查询过，暂不重复请求');
          return;
        }
        if (state.view === 'detail' && !state.selectedSku && state.index[0] && state.index[0].sku) {
          const nextSku = state.index[0].sku;
          state.selectedSku = nextSku;
          state.data = normalizeData(loadData(nextSku) || state.index[0]);
        }
        if (state.view === 'detail') renderShell();
        const addedCount = Math.max(Number(syncResult && syncResult.addedCount || 0), Number(syncResult && syncResult.ledgerAddedCount || 0));
        showToast(addedCount ? '已自动加入 ' + addedCount + ' 个新分配任务' : '已检查，暂无新分配任务');
      }).catch((error) => {
        addLog('warn', '我的详情自动同步分配任务失败', formatErrorMessage(error));
        showToast('分配任务查询失败，已保留当前详情', { tone: 'info' });
      });
    }, 0);
  }

  function findUploadRetryNotice() {
    return Array.from(document.querySelectorAll('.ant-notification-notice, .ant-notification'))
      .filter(isVisibleElement)
      .find((node) => /\u5b58\u5728\s*\u9700\u8981\u91cd\u8bd5\u6587\u4ef6/.test(compactText(node.innerText || node.textContent || ''))) || null;
  }

  function throwIfUploadRetryNoticeVisible() {
    if (!findUploadRetryNotice()) return;
    const error = new Error('\u5b58\u5728\u9700\u8981\u91cd\u8bd5\u6587\u4ef6');
    error.code = 'PFH_UPLOAD_REFRESH_RETRY';
    throw error;
  }

  function isUploadRetryRefreshError(error) {
    return Boolean(error && (error.code === 'PFH_UPLOAD_REFRESH_RETRY' || /\u5b58\u5728\s*\u9700\u8981\u91cd\u8bd5\u6587\u4ef6/.test(error.message || '')));
  }

  async function refreshPageAndRetryUploadItem(item) {
    const mode = getUploadItemMode(item);
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const retryCount = Math.max(0, Number(latestItem.uploadPageRefreshRetryCount) || 0) + 1;
    if (retryCount > 3) {
      const reason = '\u8fde\u7eed\u5237\u65b0 3 \u6b21\u4ecd\u63d0\u793a\u5b58\u5728\u9700\u8981\u91cd\u8bd5\u6587\u4ef6';
      markUploadQueueBlocked(item, L.uploadFailed, reason, { uploadPageRefreshRetryCount: retryCount });
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u81ea\u52a8\u6062\u590d\u5931\u8d25', (item.sku || '') + ' ' + reason);
      showToast((item.sku || '') + ' ' + reason);
      return;
    }
    updateUploadItem(item, '\u5f85\u4e0a\u4f20', '\u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u5237\u65b0\u540e\u91cd\u65b0\u641c\u7d22\u4e0a\u4f20', {
      forceReplace: true,
      resumeUploadAfterRefresh: true,
      uploadPageRefreshRetryCount: retryCount,
    });
    state.uploadWorkerMode = mode;
    state.uploadRunning = true;
    saveUploadWorkerRunning(mode, true);
    addLog('warn', '\u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u5237\u65b0\u540e\u91cd\u8bd5\u7f16\u7801', (item.sku || '') + ' (' + retryCount + '/3)');
    showToast((item.sku || '') + ' \u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u6b63\u5728\u5237\u65b0\u9875\u9762\u91cd\u65b0\u4e0a\u4f20');
    await wait(120);
    const refreshUrl = new URL(window.location.href);
    refreshUrl.pathname = '/productManagementProduct';
    refreshUrl.searchParams.set('plmUploadWorker', '1');
    refreshUrl.searchParams.set('plmUploadMode', mode);
    window.location.replace(refreshUrl.toString());
    await new Promise(() => {});
  }

  function pinCurrentSearchResults() {
    const matches = getFilteredSearchMatches(state.searchQuery);
    if (!matches.length) return;
    matches.forEach((match, index) => {
      const item = state.index.find((entry) => entry.sku === match.sku);
      if (!item) return;
      item.pinned = true;
      // Reserve the very top slots for this batch while retaining result order.
      item.pinOrder = index + 1;
    });
    saveIndex();
    state.skuPage = 1;
    showToast('已置顶 ' + matches.length + ' 个编码');
    renderShell();
  }

  function adoptOpenedProjectDrawer(sku, options) {
    const opts = options || {};
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return;
    const switchingSku = Boolean(state.selectedSku && state.selectedSku !== sku);
    state.drawer = drawer;
    state.sku = sku;
    state.selectedSku = sku;
    const cached = loadData(sku);
    if (cached) state.data = normalizeData(cached);
    else if (!state.data || state.data.sku !== sku) state.data = normalizeData({ sku });
    state.view = opts.keepToolsView ? 'tools' : 'detail';
    if (switchingSku) state.copywritingMode = false;
    resetExcelState();
    expandPanel();
    renderShell(L.scanning);
    scheduleDrawerProductFlow(state.data, { reason: 'cached-open', includeScanTabs: true });
  }

  async function ensureNewProductProjectPage() {
    if (isNewProductProjectPageReady()) return true;
    addLog('info', '\u6253\u5f00\u8be6\u60c5\uff1a\u5207\u6362\u5230\u9879\u76ee\u7ba1\u7406-\u65b0\u54c1\u5f00\u53d1');
    const tabButton = findTopTabByText('\u65b0\u54c1\u5f00\u53d1');
    if (tabButton) {
      clickElement(tabButton);
      const readyFromTab = await waitFor(() => isNewProductProjectPageReady(), 5000, 150);
      if (readyFromTab) return true;
    }
    const menuItem = findMenuItemByPathOrText('/projectManagementChemicalNew', '\u65b0\u54c1\u5f00\u53d1');
    if (menuItem) {
      clickElement(menuItem);
      const readyFromMenu = await waitFor(() => isNewProductProjectPageReady(), 8000, 150);
      if (readyFromMenu) return true;
    }
    addLog('error', '\u6253\u5f00\u8be6\u60c5\uff1a\u672a\u627e\u5230\u65b0\u54c1\u5f00\u53d1\u9876\u90e8\u6807\u7b7e\u6216\u5de6\u4fa7\u83dc\u5355');
    return isNewProductProjectPageReady();
  }

  function isNewProductProjectPageReady() {
    return /\/projectManagementChemicalNew/.test(location.pathname) && Boolean(findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801') && findButtonByText('\u67e5\u8be2'));
  }

  function findTopTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.ant-tabs-tab, .ant-tabs-tab-btn, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  function findMenuItemByPathOrText(path, text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('[data-menu-id], .ant-menu-item, .ant-menu-submenu-title, li'))
      .filter(isVisibleElement)
      .find((el) => (el.getAttribute('data-menu-id') || '') === path || compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function queryProjectRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) return '';
    setNativeInputValue(input, sku);
    button.click();
    return await waitFor(() => findProjectRowIdBySku(sku), 5000, 150);
  }

  async function queryDesignTaskRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    if (!(await ensureDesignTaskTab())) return '';
    return await queryProjectRowIdBySku(sku);
  }

  async function ensureDesignTaskTab() {
    const active = getActiveProjectWorkflowTabText();
    if (/^\u8bbe\u8ba1\u4efb\u52a1/.test(active)) return true;
    const tab = findProjectWorkflowTabByText('\u8bbe\u8ba1\u4efb\u52a1');
    if (!tab) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u672a\u627e\u5230\u8bbe\u8ba1\u4efb\u52a1\u9875\u7b7e');
      return false;
    }
    clickElement(tab);
    return Boolean(await waitFor(() => /^\u8bbe\u8ba1\u4efb\u52a1/.test(getActiveProjectWorkflowTabText()), 5000, 120));
  }


  function getActiveProjectWorkflowTabText() {
    const tab = Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab-active, .ant-tabs-tab-active'))
      .filter(isVisibleElement)
      .find((el) => /^(?:\u5168\u90e8|\u5f00\u53d1\u4efb\u52a1|\u8bbe\u8ba1\u4efb\u52a1|\u63a8\u5e7f\u4e0a\u67b6)/.test(compactText(el.innerText || el.textContent)));
    return tab ? compactText(tab.innerText || tab.textContent) : '';
  }

  function findProjectWorkflowTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab, .filterTabs .ant-tabs-tab-btn, .ant-tabs-tab, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const current = compactText(el.innerText || el.textContent);
        return current === expected || current.startsWith(expected);
      }) || null;
  }

  async function clickProjectDetailByRowId(rowId, sku) {
    if (isProjectDrawerOpenForSku(sku)) return true;
    const row = findOperationRowByRowId(rowId);
    if (!row) return false;
    const detailButton = Array.from(row.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5');
    if (!detailButton) return false;
    detailButton.click();
    return Boolean(await waitFor(() => isProjectDrawerOpenForSku(sku), 8000, 120));
  }

  async function clickProjectEditByRowId(rowId, sku) {
    if (getToyCopywritingDrawerForSku(sku)) return true;
    const button = findOperationButtonByRowId(rowId, '编辑');
    if (!button) return false;
    clickElement(button);
    const editDrawer = await waitFor(() => getProductEditDrawerForSku(sku), 20000, 150);
    if (!editDrawer) return false;
    await enterProductEditSecondStep(sku);
    return Boolean(await waitFor(() => getToyCopywritingDrawerForSku(sku), 30000, 150));
  }

  function isProjectDrawerOpenForSku(sku) {
    return Boolean(getProjectDrawerForSku(sku));
  }

  function getProjectDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        const headerSku = getProjectDrawerHeaderSku(drawer);
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text) && Boolean(headerSku) && (!sku || headerSku === String(sku).toUpperCase());
      }) || null;
  }

  function findButtonLikeInScope(scope, text) {
    const expected = compactText(text);
    return Array.from(scope.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function ensureProjectDrawerForData(data) {
    const sku = data && data.sku;
    if (!sku) return false;
    if (getProjectDrawerForSku(sku)) return Boolean(await waitForExcelProjectDrawerReady(sku, 12000));
    if (!(await ensureNewProductProjectPage())) return false;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
      return Boolean(await waitForExcelProjectDrawerReady(sku, 12000));
    }
    rowId = await queryProjectRowIdBySku(sku);
    if (!rowId) return false;
    const clicked = await clickProjectDetailByRowId(rowId, sku);
    const ready = clicked && Boolean(await waitForExcelProjectDrawerReady(sku, 12000));
    if (ready) cacheProjectRowId(sku, rowId);
    return ready;
  }

  async function waitForExcelProjectDrawerReady(sku, timeout) {
    const drawer = await waitFor(() => {
      const current = getProjectDrawerForSku(sku);
      if (!current) return '';
      return findTabButton(current, L.productTab) || findTabButton(current, L.materialTab) ? current : '';
    }, Number(timeout || 12000) || 12000, 150);
    if (!drawer) return null;
    const stable = await waitForStableProjectDrawerIdentity(drawer, sku, Math.min(Number(timeout || 12000) || 12000, 6000));
    return stable ? (getProjectDrawerForSku(sku) || drawer) : null;
  }

  async function ensureProjectBomDrawerForData(data, options) {
    const opts = options || {};
    const sku = data && data.sku;
    if (!sku) return null;
    const opened = getProjectBomDrawerForSku(sku);
    if (opened) return opened;
    const otherBom = getProjectBomDrawerForSku('');
    if (otherBom && !getVisibleText(otherBom).includes(sku)) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u5f53\u524d\u6253\u5f00\u7684\u7ed1BOM\u4e0d\u662f\u76ee\u6807 SKU', sku);
      return null;
    }
    await closeProjectDetailDrawerForSku(sku);
    if (!(await ensureNewProductProjectPage())) return null;
    if (!(await ensureDesignTaskTab())) return null;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectBomByRowId(rowId, sku)) {
      return getProjectBomDrawerForSku(sku);
    }
    if (opts.batchRowOnly) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u6279\u91cf\u641c\u7d22\u884c\u5df2\u5931\u6548\uff0c\u672a\u91cd\u65b0\u5355\u72ec\u641c\u7d22', sku);
      return null;
    }
    rowId = await queryDesignTaskRowIdBySku(sku);
    if (!rowId) return null;
    const clicked = await clickProjectBomByRowId(rowId, sku);
    if (clicked) cacheProjectRowId(sku, rowId);
    return clicked ? getProjectBomDrawerForSku(sku) : null;
  }

  async function closeProjectDetailDrawerForSku(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return true;
    const close = findDrawerCloseButton(drawer);
    if (!close) return false;
    clickElement(close);
    await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 5000, 150);
    return true;
  }

  async function clickProjectBomByRowId(rowId, sku) {
    if (getProjectBomDrawerForSku(sku)) return true;
    const button = findOperationButtonByRowId(rowId, '\u7ed1BOM');
    if (!button) return false;
    clickElement(button);
    return Boolean(await waitFor(() => getProjectBomDrawerForSku(sku), 5000, 150));
  }

  function getProjectBomDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        return /\u7ed1\u5b9aBOM|\u7ed1BOM/.test(text) && (!sku || text.includes(sku));
      }) || null;
  }

  function findBomLabelUploadItem(drawer) {
    if (!drawer) return null;
    const isLabelUploadScope = (el) => {
      if (!el || !el.querySelector('input[type="file"]')) return false;
      const text = getVisibleText(el);
      const compact = compactText(text);
      return /\u6807\u7b7e/.test(text) && (/\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text) || compact.startsWith('\u6807\u7b7e'));
    };
    const upload = Array.from(drawer.querySelectorAll('.ant-upload, .ant-upload-wrapper, input[type="file"]'))
      .filter(isVisibleElement)
      .map((el) => el.closest('.materialCardItemHeader, .ant-collapse-item, .typeCard, .cardBox') || el.parentElement)
      .filter(Boolean)
      .find(isLabelUploadScope);
    if (upload) return upload;
    const cards = Array.from(drawer.querySelectorAll('.cardBox, .typeCard'))
      .filter(isVisibleElement)
      .filter((card) => card.querySelector('input[type="file"]'));
    const byTitle = cards.find((card) => compactText((card.querySelector('.cardTitle') || {}).innerText || '') === '\u6807\u7b7e');
    if (byTitle) return byTitle;
    const byMaterial = cards.find((card) => {
      const text = getVisibleText(card);
      return /\u6807\u7b7e/.test(text) && /\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text);
    });
    if (byMaterial) return byMaterial;
    return Array.from(drawer.querySelectorAll('.ant-collapse-item, .materialCardItemHeader'))
      .filter(isVisibleElement)
      .find(isLabelUploadScope) || null;
  }


  async function saveProjectBomDrawer(drawer) {
    const button = findButtonLikeInScope(drawer, '\u6279\u91cf\u4fdd\u5b58');
    if (!button) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u6309\u94ae');
    const existingNotices = new Set(getVisiblePlmNoticeNodes());
    clickElement(button);
    const result = await waitFor(() => getFreshBomSaveNoticeResult(existingNotices), 120000, 150);
    if (result === 'saved') return true;
    state.uploadRunning = false;
    saveUploadWorkerRunning(getUploadControlMode(), false);
    if (result === 'failed') {
      throw new Error('\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u5931\u8d25\uff0c\u5df2\u6682\u505c\u961f\u5217\u5e76\u4fdd\u7559\u5f53\u524d\u62bd\u5c49');
    }
    throw new Error('\u672a\u68c0\u6d4b\u5230\u7ed1BOM\u201c\u4fdd\u5b58\u6210\u529f\u201d\u63d0\u793a\uff0c\u5df2\u6682\u505c\u961f\u5217\u5e76\u4fdd\u7559\u5f53\u524d\u62bd\u5c49');
  }

  function getVisiblePlmNoticeNodes() {
    return Array.from(document.querySelectorAll('.ant-message-notice, .ant-notification-notice'))
      .filter(isVisibleElement)
      .filter((node) => !node.closest('#' + PANEL_ID));
  }

  function getFreshBomSaveNoticeResult(existingNotices) {
    const baseline = existingNotices && typeof existingNotices.has === 'function' ? existingNotices : new Set();
    const text = getVisiblePlmNoticeNodes()
      .filter((node) => !baseline.has(node))
      .map((node) => getNodeText(node))
      .join('\n');
    if (/\u4fdd\u5b58\u5931\u8d25|\u64cd\u4f5c\u5931\u8d25|\u8bf7\u6c42\u5931\u8d25|\u7f51\u7edc\u5f02\u5e38|\u7cfb\u7edf\u5f02\u5e38/.test(text)) return 'failed';
    if (/\u4fdd\u5b58\u6210\u529f|\u64cd\u4f5c\u6210\u529f|\u6279\u91cf\u4fdd\u5b58\u6210\u529f/.test(text)) return 'saved';
    return '';
  }

  async function closeProjectBomDrawer(drawer) {
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u62bd\u5c49\u5173\u95ed\u6309\u94ae');
    clickElement(close);
    const closed = await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 8000, 150);
    if (!closed) throw new Error('\u7ed1BOM\u62bd\u5c49\u672a\u6210\u529f\u5173\u95ed');
  }

  function findProjectRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  function findOperationRowByRowId(rowId) {
    return Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((row) => Array.from(row.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5')) || null;
  }

  function findOperationButtonByRowId(rowId, text) {
    const expected = compactText(text);
    const rows = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement);
    for (const row of rows) {
      const button = Array.from(row.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === expected);
      if (button) return button;
    }
    return null;
  }

  function cacheProjectRowId(sku, rowId) {
    if (!sku || !rowId) return;
    const data = normalizeData({ ...(loadData(sku) || state.data || {}), sku, projectRowId: String(rowId) });
    saveData(sku, data, { suppressDataQuality: true });
  }

  function findInputByPlaceholder(placeholder) {
    return Array.from(document.querySelectorAll('input'))
      .filter(isVisibleElement)
      .find((input) => input.getAttribute('placeholder') === placeholder) || null;
  }

  function findButtonByText(text) {
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitFor(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval);
    }
    return '';
  }
