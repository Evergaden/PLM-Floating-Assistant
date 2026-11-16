
  function startDrawerWatcher() {
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleDrawerState();
        ensurePageToyCopywritingButton();
        observeManualTabRead();
        scheduleProjectListPrefetch();
        positionLauncher(document.getElementById(LAUNCHER_ID));
      }, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function handleUserDrawerTabClick(event) {
    if (!event || !event.isTrusted || !(event.target instanceof Element)) return;
    const detailButton = event.target.closest('button, a, [role="button"]');
    const projectRow = detailButton && detailButton.closest('tr');
    if (
      detailButton && projectRow &&
      !detailButton.closest('#' + PANEL_ID + ', .ant-drawer-open, .ant-drawer') &&
      /\/projectManagementChemicalNew/.test(location.pathname) &&
      compactText(detailButton.innerText || detailButton.textContent) === '\u8be6\u60c5'
    ) {
      const sku = findProjectSkuForActionRow(projectRow);
      if (sku) showProjectDetailOpeningFeedback(sku, loadData(sku) || { sku });
      return;
    }
    const tab = event.target.closest('[role="tab"], .ant-tabs-tab');
    if (!tab) return;
    const drawer = tab.closest('.ant-drawer-open, .ant-drawer');
    if (!drawer || drawer !== getProjectDrawer()) return;
    if (state.scanRunning) {
      const partial = state.scanData && state.scanData.sku ? state.scanData : null;
      stopScan();
      if (partial) {
        saveData(partial.sku, partial);
        if (state.selectedSku === partial.sku) state.data = normalizeData(loadData(partial.sku) || partial);
      }
    }
    if (state.drawerTabFlowRunning || state.drawerTabFlowTimer) {
      state.drawerTabFlowUserInterrupted = true;
      cancelDrawerTabFlow({ preserveUserInterrupted: true });
    }
    const sku = getProjectDrawerHeaderSku(drawer);
    const tabName = compactText(tab.innerText || tab.textContent || '');
    if (sku && tabName) {
      state.observedDrawer = drawer;
      state.observedSku = sku;
      state.observedTab = tabName;
      stopManualTabRead();
      state.manualCollectTimer = window.setTimeout(() => readCurrentManualTab(drawer, sku, tabName), 420);
    }
  }

  function findProjectSkuForActionRow(row) {
    if (!row) return '';
    const directSku = findSku(getVisibleText(row));
    if (directSku) return directSku;
    const rowId = row.getAttribute('rowid');
    if (!rowId) return '';
    const linkedRow = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"]'))
      .find((candidate) => candidate !== row && findSku(getVisibleText(candidate)));
    return linkedRow ? findSku(getVisibleText(linkedRow)) : '';
  }

  function showProjectDetailOpeningFeedback(sku, data) {
    if (!sku) return;
    state.openingProjectDetail = true;
    state.openingProjectDetailSku = sku;
    state.view = 'detail';
    state.selectedSku = sku;
    state.data = normalizeData(data || { sku });
    resetExcelState();
    lockLoadingTip(sku);
    expandPanel();
    renderShell(L.openingDetail);
    window.setTimeout(() => {
      if (!state.openingProjectDetail || state.openingProjectDetailSku !== sku) return;
      state.openingProjectDetail = false;
      state.openingProjectDetailSku = '';
      renderShell();
    }, 7000);
  }

  function cancelDrawerTabFlow(options) {
    const preserveUserInterrupted = Boolean(options && options.preserveUserInterrupted);
    clearScanLoadingTipTimer();
    if (state.drawerTabFlowTimer) window.clearTimeout(state.drawerTabFlowTimer);
    state.drawerTabFlowTimer = 0;
    state.drawerTabFlowToken += 1;
    state.drawerTabFlowRunning = false;
    state.drawerTabFlowSku = '';
    state.drawerTabFlowDrawer = null;
    if (!preserveUserInterrupted) state.drawerTabFlowUserInterrupted = false;
  }

  function beginForegroundDrawerTabFlow(sku, drawer) {
    cancelDrawerTabFlow();
    const token = state.drawerTabFlowToken + 1;
    state.drawerTabFlowToken = token;
    state.drawerTabFlowRunning = true;
    state.drawerTabFlowSku = String(sku || '');
    state.drawerTabFlowDrawer = drawer || null;
    state.drawerTabFlowUserInterrupted = false;
    return token;
  }

  function finishForegroundDrawerTabFlow(token) {
    if (state.drawerTabFlowToken !== token) return;
    state.drawerTabFlowRunning = false;
    state.drawerTabFlowSku = '';
    state.drawerTabFlowDrawer = null;
  }

  function scheduleProjectListPrefetch() {
    scheduleAssignedDesignTaskAutoSync(1400);
    if (!state.settings.collectionEnabled || !/\/projectManagementChemicalNew/.test(location.pathname)) return;
    window.clearTimeout(state.projectListPrefetchTimer);
    state.projectListPrefetchTimer = window.setTimeout(prefetchProjectAllListData, 360);
  }

  function prefetchProjectAllListData() {
    state.projectListPrefetchTimer = 0;
    const activeWorkflowTab = getActiveProjectWorkflowTabText();
    if (!state.settings.collectionEnabled || !/^(?:\u5168\u90e8|\u8bbe\u8ba1\u4efb\u52a1)/.test(activeWorkflowTab)) return;
    const rows = collectProjectAllListRows();
    if (!rows.length) return;
    const signature = activeWorkflowTab + '|' + JSON.stringify(rows);
    if (signature === state.projectListPrefetchSignature) return;
    state.projectListPrefetchSignature = signature;
    return syncProjectListRowsToCache(rows, {
      source: 'project-all',
      ledgerLog: '\u6574\u9875\u8bbe\u8ba1\u5206\u914d\u4efb\u52a1\u5df2\u540c\u6b65\u5230\u4eca\u65e5\u5de5\u4f5c\u53f0',
      cacheLog: '\u65b0\u54c1\u5f00\u53d1\u5217\u8868\u57fa\u7840\u4fe1\u606f\u5df2\u9759\u9ed8\u7f13\u5b58',
    });
  }

  function syncProjectListRowsToCache(rows, options) {
    const opts = options || {};
    const source = String(opts.source || 'project-all');
    const list = (Array.isArray(rows) ? rows : []).filter((row) => row && row.sku);
    if (!list.length) return { fetchedCount: 0, changedCount: 0, addedCount: 0, ledgerChangedCount: 0, ledgerAddedCount: 0 };
    let changedCount = 0;
    let addedCount = 0;
    let ledgerChangedCount = 0;
    let ledgerAddedCount = 0;
    let ledgerEligibleCount = 0;
    syncDailyLedgerBeforeMutation();
    list.forEach((row) => {
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const rowName = normalizeProductNameValue(row.name);
      const previousName = normalizeProductNameValue(previous.name);
      const benchmarkImageUrl = stripOssResizeParams(row.benchmarkImageUrl || '');
      const productListImageUrl = stripOssResizeParams(row.productListImageUrl || '');
      const preserveEffectImage = previous.skuImageSource === 'effectImage' && Boolean(previous.skuImageUrl || previous.skuImageFallbackUrl);
      const useProductListAsSkuImage = row.projectStatus === '\u5df2\u5b8c\u6210' && Boolean(productListImageUrl || row.productListImageUrl) && !preserveEffectImage;
      const candidate = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: rowName || previousName || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        projectId: row.projectId || previous.projectId || '',
        productId: row.productId || previous.productId || '',
        productVersionId: row.productVersionId || previous.productVersionId || '',
        developerName: row.developerName || previous.developerName || '',
        developerText: row.developerText || previous.developerText || '',
        benchmarkImageUrl: benchmarkImageUrl || previous.benchmarkImageUrl || '',
        benchmarkImageFallbackUrl: row.benchmarkImageUrl || previous.benchmarkImageFallbackUrl || benchmarkImageUrl || '',
        referenceUrl: row.referenceUrl || previous.referenceUrl || '',
        developmentAdvice: row.developmentAdvice || previous.developmentAdvice || '',
        artPriority: row.artPriority || previous.artPriority || '',
        projectStatus: row.projectStatus || previous.projectStatus || '',
        designType: row.designType || previous.designType || '',
        specificationText: row.specificationText || previous.specificationText || '',
        productListImageUrl: productListImageUrl || previous.productListImageUrl || '',
        productListImageFallbackUrl: row.productListImageUrl || previous.productListImageFallbackUrl || productListImageUrl || '',
        designAssignedAt: row.designAssignedAt || previous.designAssignedAt || '',
        developmentAssignedAt: row.developmentAssignedAt || previous.developmentAssignedAt || '',
        projectCreatedAt: row.projectCreatedAt || previous.projectCreatedAt || '',
        departmentName: row.departmentName || previous.departmentName || '',
        projectOwnerName: row.projectOwnerName || previous.projectOwnerName || '',
        promotionStatus: row.promotionStatus || previous.promotionStatus || '',
        listingStatus: row.listingStatus || previous.listingStatus || '',
        bomStatus: row.bomStatus || previous.bomStatus || '',
        requiresPlanStock: row.requiresPlanStock || previous.requiresPlanStock || '',
        bomAuditStatus: row.bomAuditStatus || previous.bomAuditStatus || '',
        plmCategory: row.plmCategory || previous.plmCategory || '',
        productType: row.productType || previous.productType || '',
        productTypeValue: row.productTypeValue || previous.productTypeValue || '',
        skuImageUrl: useProductListAsSkuImage ? (productListImageUrl || row.productListImageUrl) : (previous.skuImageUrl || ''),
        skuImageFallbackUrl: useProductListAsSkuImage ? (row.productListImageUrl || productListImageUrl) : (previous.skuImageFallbackUrl || ''),
        skuImageSource: useProductListAsSkuImage ? 'productListImage' : (previous.skuImageSource || ''),
        listPrefetchSource: previous.listPrefetchSource || source,
      });
      const assignedDate = parseLedgerDateFromText(row.designAssignedAt);
      if (assignedDate && !opts.skipLedger) {
        ledgerEligibleCount += 1;
        const assignedMonth = getMonthKeyFromDateKey(assignedDate);
        const existingLedger = (state.ledgerRecords || []).find((item) => item.sku === row.sku && getMonthKeyFromDateKey(item.date) === assignedMonth);
        const syncedLedger = upsertDailyLedgerFromData(candidate, {
          deferSave: true,
          skipStorageSync: true,
          skipUnchanged: true,
          note: existingLedger ? undefined : (opts.ledgerNote || '\u6574\u9875\u5217\u8868\u81ea\u52a8\u52a0\u5165'),
        });
        if (syncedLedger && syncedLedger !== existingLedger) {
          ledgerChangedCount += 1;
          if (!existingLedger) ledgerAddedCount += 1;
        }
      }
      const dataChanged = hasMeaningfulDataChange(previous, candidate);
      const indexMissing = !state.index.some((item) => item && item.sku === row.sku);
      if (indexMissing) addedCount += 1;
      if (!dataChanged && !indexMissing) return;
      const saved = dataChanged ? normalizeData({
        ...candidate,
        listPrefetchedAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        updatedAtMs: Date.now(),
      }) : candidate;
      if (dataChanged) saveDataDirect(row.sku, saved);
      upsertIndex(saved);
      if (state.data && state.data.sku === row.sku) state.data = saved;
      changedCount += 1;
    });
    if (ledgerChangedCount) {
      saveDailyLedger();
      if (opts.ledgerLog !== false) addLog('info', opts.ledgerLog || '\u8bbe\u8ba1\u5206\u914d\u4efb\u52a1\u5df2\u540c\u6b65\u5230\u4eca\u65e5\u5de5\u4f5c\u53f0', ledgerChangedCount + '/' + ledgerEligibleCount + '\u4e2a\u7f16\u7801');
    }
    if (!changedCount && !ledgerChangedCount) return { fetchedCount: list.length, changedCount, addedCount, ledgerChangedCount, ledgerAddedCount };
    if (changedCount) {
      queueCloudBackup();
      if (opts.cacheLog !== false) addLog('info', opts.cacheLog || '\u65b0\u54c1\u5f00\u53d1\u5217\u8868\u57fa\u7840\u4fe1\u606f\u5df2\u9759\u9ed8\u7f13\u5b58', changedCount + '/' + list.length + '\u4e2a\u7f16\u7801');
    }
    if (opts.render !== false && (state.view === 'home' || state.view === 'detail' || state.view === 'ledger')) renderShell();
    return { fetchedCount: list.length, changedCount, addedCount, ledgerChangedCount, ledgerAddedCount };
  }

  function normalizeAssignedDesignTaskRow(item) {
    if (!item || typeof item !== 'object') return null;
    const sku = String(item.product_code || item.productCode || item.code || '').trim().toUpperCase();
    if (!sku) return null;
    const projectId = String(item.id || item.project_id || item.chemical_id || item.project_row_id || item.projectRowId || '').trim();
    const benchmarkImageUrl = getApiAssetUrl(item.main_pic || item.mainPic || '', 0);
    const productListImageUrl = getApiAssetUrl(item.pic || item.product_pic || item.product_image || '', 0);
    const developerName = cleanName(item.dev_work_user_name || item.dev_head_user_name || '');
    const developerText = [developerName, item.dev_work_user_jobtitlename || item.dev_head_user_jobtitlename || ''].filter(Boolean).join(' ');
    const planStock = item.is_plan_stock === true || item.is_plan_stock === 1
      ? '\u662f'
      : (item.is_plan_stock === false || item.is_plan_stock === 0 ? '\u5426' : cleanProjectListCell(item.is_plan_stock));
    return {
      sku,
      rowId: projectId,
      projectId,
      productId: String(item.product_id || '').trim(),
      productVersionId: String(item.product_main_id || item.product_version_id || '').trim(),
      developerText,
      developerName,
      brand: cleanName(item.brand_name || item.product_brand_name || ''),
      name: normalizeProductNameValue(cleanName(item.product_name || item.dev_product_name || '')),
      benchmarkImageUrl,
      referenceUrl: String(item.main_url || item.reference_url || item.referenceUrl || '').trim(),
      developmentAdvice: cleanProjectListCell(item.remark || item.dev_proposals),
      artPriority: cleanProjectListCell(item.priority_label),
      projectStatus: cleanProjectListCell(item.status_format || item.status),
      designType: cleanProjectListCell(item.design_type_label),
      specificationText: cleanProjectListCell(item.specification),
      productListImageUrl,
      designAssignedAt: String(item.design_assign_at || item.designAssignedAt || '').trim(),
      developmentAssignedAt: String(item.dev_assign_at || item.developmentAssignedAt || '').trim(),
      projectCreatedAt: String(item.create_at || item.audit_at || item.projectCreatedAt || '').trim(),
      departmentName: cleanProjectListCell(item.design_work_user_department_name || item.dev_work_user_department_name),
      projectOwnerName: cleanProjectListCell(item.design_work_user_name || item.dev_work_user_name),
      promotionStatus: cleanProjectListCell(item.promote_status_format),
      listingStatus: cleanProjectListCell(item.sale_status_format),
      bomStatus: cleanProjectListCell(item.bom_status_format),
      requiresPlanStock: planStock,
      bomAuditStatus: cleanProjectListCell(item.audit_bom_status_format),
      plmCategory: cleanProjectListCell(item.category_name),
      productType: cleanProjectListCell(item.product_type_format || item.product_type),
      productTypeValue: item.product_type,
    };
  }

  function getApiListTotal(payload) {
    const data = getApiPayloadDataObject(payload);
    return Number(data.total || payload && payload.total || 0) || 0;
  }

  function scheduleAssignedDesignTaskAutoSync(delay) {
    if (state.assignedDesignTaskAutoSyncTimer) return;
    state.assignedDesignTaskAutoSyncTimer = window.setTimeout(async () => {
      state.assignedDesignTaskAutoSyncTimer = 0;
      let nextDelay = ASSIGNED_DESIGN_TASK_SYNC_COOLDOWN_MS;
      try {
        if (state.settings.collectionEnabled && !state.catalogSyncRunning && state.workMode !== 'product-development'
          && /\/projectManagementChemicalNew/.test(location.pathname)) {
          await syncAssignedDesignTasksFromApi();
        }
      } catch (error) {
        nextDelay = 60000;
        addLog('warn', '设计任务自动读取失败，保留已有任务并稍后重试', formatErrorMessage(error));
      } finally {
        scheduleAssignedDesignTaskAutoSync(nextDelay);
      }
    }, Math.max(0, Number(delay) || 0));
  }

  async function fetchAssignedDesignTaskRows(options) {
    const catalog = Boolean(options && options.catalog);
    const currentUserName = String(findCurrentPlmUserName() || '').replace(/\s+/g, '').toLowerCase();
    if (!catalog && !currentUserName) throw new Error('暂时无法识别当前 PLM 用户，请确认已登录');
    const rows = [];
    const pageSignatures = new Set();
    let total = 0;
    for (let page = 1; ; page += 1) {
      if (catalog && options.beforePage) await options.beforePage(page);
      const payload = await fetchPlmJson((catalog ? '/api/ChemicalNewAll/GetList' : ASSIGNED_DESIGN_TASK_ENDPOINT) + '?page=' + page + '&pageSize=' + ASSIGNED_DESIGN_TASK_PAGE_SIZE
        + '&sort_field=' + encodeURIComponent(catalog ? 'create_at' : ASSIGNED_DESIGN_TASK_SORT_FIELD)
        + '&sort_asc=' + String(ASSIGNED_DESIGN_TASK_SORT_ASC), catalog ? { singleAttempt: true } : undefined);
      if (payload && payload.success === false) {
        throw new Error(formatPlmApiMessage(payload.msg) || formatPlmApiMessage(payload.message) || '\u8bbe\u8ba1\u4efb\u52a1\u6570\u636e\u8bfb\u53d6\u5931\u8d25');
      }
      const pageRows = getApiListItems(payload);
      total = getApiListTotal(payload) || total;
      if (!pageRows.length) {
        if (total && rows.length < total) throw new Error('设计任务分页未读取完整，请稍后重试');
        break;
      }
      const signature = JSON.stringify(pageRows.map((item) => [item.id || item.project_id || '', item.product_code || item.productCode || item.code || '']));
      if (pageSignatures.has(signature)) throw new Error('设计任务接口返回重复分页，已停止读取并保留已有缓存');
      pageSignatures.add(signature);
      rows.push(...pageRows);
      if (catalog && options.onProgress) options.onProgress(rows.length, total, page);
      if ((total && rows.length >= total) || (!total && pageRows.length < ASSIGNED_DESIGN_TASK_PAGE_SIZE)) break;
    }
    if (String(findCurrentPlmUserName() || '').replace(/\s+/g, '').toLowerCase() !== currentUserName) {
      throw new Error('读取期间登录用户发生变化，请重新读取设计任务');
    }
    const deduped = new Map();
    let unknownOwnerCount = 0;
    rows.forEach((item) => {
      const owner = String(item.design_work_user_name || item.design_user_name || '').replace(/\s+/g, '').toLowerCase();
      if (!catalog && !owner) { unknownOwnerCount += 1; return; }
      if (!catalog && owner !== currentUserName) return;
      const row = normalizeAssignedDesignTaskRow(item);
      if (!row) return;
      const previous = deduped.get(row.sku);
      if (!previous || parseSkuListTime(row.designAssignedAt) >= parseSkuListTime(previous.designAssignedAt)) deduped.set(row.sku, row);
    });
    if (unknownOwnerCount) addLog('warn', '部分设计任务缺少设计人员信息，未自动加入', unknownOwnerCount + ' 条，请检查 PLM 设计人员字段');
    return Array.from(deduped.values());
  }

  function toggleCatalogCollectionPause() {
    if (!state.catalogSyncRunning || state.catalogCollection.phase === 'saving') return;
    state.catalogSyncPaused = !state.catalogSyncPaused;
    state.catalogCollection.phase = state.catalogSyncPaused ? 'paused' : 'waiting';
    if (!state.catalogSyncPaused && state.catalogSyncResume) { const resume = state.catalogSyncResume; state.catalogSyncResume = null; resume(); }
    refreshHomeCollectionCard();
  }

  async function syncAllCatalogProducts() {
    if (state.catalogSyncRunning) return;
    if (!state.settings.collectionEnabled) { showToast('请先在设置中开启自动采集'); return; }
    state.catalogSyncRunning = true;
    state.catalogSyncPaused = false;
    state.catalogCollection = { phase: 'reading', count: 0, total: 0, page: 0, startedAt: Date.now() };
    const update = (text) => document.querySelectorAll('#' + PANEL_ID + ' [data-action="sku-sync-all"]').forEach(button => {
      button.disabled = state.catalogSyncRunning; button.textContent = text;
    });
    update('同步中…');
    refreshHomeCollectionCard();
    showToast('开始分批采集全部产品，可在产品列表查看进度或暂停');
    const currentUser = String(findCurrentPlmUserName() || '').replace(/\s+/g, '').toLowerCase();
    try {
      if (state.assignedDesignTaskSyncPromise) {
        try { await state.assignedDesignTaskSyncPromise; } catch (_) { /* The manual scan reports its own errors. */ }
        await wait(2000);
      }
      const rows = await fetchAssignedDesignTaskRows({ catalog: true,
        beforePage: async (page) => {
          if (page > 1) {
            state.catalogCollection.phase = state.catalogSyncPaused ? 'paused' : 'waiting';
            refreshHomeCollectionCard();
            await wait(2000 + Math.floor(Math.random() * 1001));
          }
          if (state.catalogSyncPaused) await new Promise(resolve => { state.catalogSyncResume = resolve; });
          if (!state.settings.collectionEnabled) throw new Error('采集已关闭，已停止翻页');
          if (String(findCurrentPlmUserName() || '').replace(/\s+/g, '').toLowerCase() !== currentUser) throw new Error('登录用户发生变化，已停止采集');
          state.catalogCollection.phase = 'reading'; refreshHomeCollectionCard();
        },
        onProgress: (count, total, page) => {
          Object.assign(state.catalogCollection, { count, total, page });
          update(count + '/' + (total || '?')); refreshHomeCollectionCard();
        },
      });
      if (!state.settings.collectionEnabled) throw new Error('采集已关闭，未写入本地');
      state.catalogCollection.phase = 'saving'; refreshHomeCollectionCard();
      const result = syncProjectListRowsToCache(rows, { source: 'all-products-api', skipLedger: true, render: false, cacheLog: '全部产品列表已同步到本地' });
      state.catalogSyncRunning = false;
      Object.assign(state.catalogCollection, { phase: 'done', added: result.addedCount, unique: rows.length, finishedAt: Date.now() });
      renderShell();
      showToast('已同步 ' + rows.length + ' 个产品，新增 ' + result.addedCount + ' 个 SKU');
    } catch (error) {
      Object.assign(state.catalogCollection, { phase: 'error', error: formatErrorMessage(error) });
      addLog('warn', '全部产品同步失败，保留已有缓存', formatErrorMessage(error));
      showToast('全部产品同步失败：' + formatErrorMessage(error));
    } finally {
      state.catalogSyncRunning = false; state.catalogSyncPaused = false; state.catalogSyncResume = null;
      update('同步全部'); refreshHomeCollectionCard();
    }
  }

  function syncAssignedDesignTasksFromApi(options) {
    if (state.catalogSyncRunning) return Promise.resolve({ skipped: true, catalogRunning: true });
    if (!state.settings.collectionEnabled) return Promise.resolve({ fetchedCount: 0, changedCount: 0, addedCount: 0, ledgerChangedCount: 0, ledgerAddedCount: 0, disabled: true });
    if (state.assignedDesignTaskSyncPromise) return state.assignedDesignTaskSyncPromise;
    const now = Date.now();
    const currentUser = String(findCurrentPlmUserName() || '').replace(/\s+/g, '').toLowerCase();
    const lastStartedAt = Number(state.assignedDesignTaskSyncLastStartedAt || 0);
    const elapsed = now - lastStartedAt;
    if (state.assignedDesignTaskSyncUser === currentUser && lastStartedAt > 0 && elapsed >= 0 && elapsed < ASSIGNED_DESIGN_TASK_SYNC_COOLDOWN_MS) {
      return Promise.resolve({
        fetchedCount: 0,
        changedCount: 0,
        addedCount: 0,
        ledgerChangedCount: 0,
        ledgerAddedCount: 0,
        skipped: true,
        cooldownRemainingMs: ASSIGNED_DESIGN_TASK_SYNC_COOLDOWN_MS - elapsed,
      });
    }
    state.assignedDesignTaskSyncLastStartedAt = now;
    state.assignedDesignTaskSyncUser = currentUser;
    const request = (async () => {
      const rows = await fetchAssignedDesignTaskRows();
      if (!state.settings.collectionEnabled) return { fetchedCount: 0, disabled: true };
      return syncProjectListRowsToCache(rows, {
        source: 'assigned-design-api',
        ledgerNote: '\u6211\u7684\u8be6\u60c5 API \u81ea\u52a8\u52a0\u5165',
        ledgerLog: '\u6211\u7684\u8be6\u60c5\u5df2\u901a\u8fc7\u8bbe\u8ba1\u4efb\u52a1 API \u540c\u6b65\u5230\u4eca\u65e5\u5de5\u4f5c\u53f0',
        cacheLog: '\u6211\u7684\u8be6\u60c5\u5df2\u901a\u8fc7\u8bbe\u8ba1\u4efb\u52a1 API \u66f4\u65b0\u672c\u5730\u7f13\u5b58',
        render: options && options.deferRender ? false : undefined,
      });
    })();
    const task = request.catch((error) => {
      state.assignedDesignTaskSyncLastStartedAt = 0;
      throw error;
    }).finally(() => {
      if (state.assignedDesignTaskSyncPromise === task) state.assignedDesignTaskSyncPromise = null;
    });
    state.assignedDesignTaskSyncPromise = task;
    return task;
  }

  function collectProjectAllListRows() {
    const headerCells = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => {
        const names = cells.map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
        return names.includes('\u5546\u54c1\u7f16\u7801')
          && (names.includes('\u9879\u76ee\u72b6\u6001') || names.includes('\u8bbe\u8ba1\u7c7b\u578b') || names.includes('BOM\u72b6\u6001') || names.includes('\u5bf9\u6807\u4ea7\u54c1\u94fe\u63a5'));
      }) || [];
    if (!headerCells.length) return [];
    const headers = headerCells.map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
    const indexOf = (name) => headers.indexOf(name);
    const skuIndex = indexOf('\u5546\u54c1\u7f16\u7801');
    const imageIndex = indexOf('\u5546\u54c1\u56fe\u7247');
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body || skuIndex < 0) return [];
    const textAt = (cells, name) => {
      const index = indexOf(name);
      return index >= 0 && cells[index] ? cleanProjectListCell(cells[index].innerText || cells[index].textContent) : '';
    };
    const imageAt = (cells, name) => {
      const index = indexOf(name);
      const cell = index >= 0 ? cells[index] : null;
      if (!cell) return '';
      const image = cell.querySelector('img');
      const candidates = image ? [
        image.getAttribute('data-src'),
        image.getAttribute('data-original'),
        image.getAttribute('data-url'),
        image.currentSrc,
        image.src,
        image.getAttribute('src'),
      ] : [];
      const link = cell.querySelector('a[href]');
      if (link) candidates.push(link.href || link.getAttribute('href'));
      return candidates.map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
    };
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const developerText = textAt(cells, '\u5f00\u53d1\u4eba\u5458');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        developerText,
        developerName: (developerText.match(/^[\u4e00-\u9fa5A-Za-z ._-]+?(?=\s+(?:\u5f00\u53d1|\u4e3b\u7ba1|\u7ecf\u7406|\u4e13\u5458)|\s*\||$)/) || [])[0] || '',
        brand: textAt(cells, '\u54c1\u724c'),
        name: textAt(cells, '\u5546\u54c1\u540d\u79f0'),
        benchmarkImageUrl: imageAt(cells, '\u5bf9\u6807\u56fe\u7247'),
        referenceUrl: textAt(cells, '\u5bf9\u6807\u4ea7\u54c1\u94fe\u63a5'),
        developmentAdvice: textAt(cells, '\u5f00\u53d1\u5efa\u8bae'),
        artPriority: textAt(cells, '\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7'),
        projectStatus: textAt(cells, '\u9879\u76ee\u72b6\u6001'),
        designType: textAt(cells, '\u8bbe\u8ba1\u7c7b\u578b'),
        specificationText: textAt(cells, '\u89c4\u683c\u578b\u53f7'),
        productListImageUrl: imageAt(cells, '\u5546\u54c1\u56fe\u7247'),
        designAssignedAt: textAt(cells, '\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4'),
        projectCreatedAt: textAt(cells, '\u521b\u5efa\u65f6\u95f4'),
        departmentName: textAt(cells, '\u6240\u5728\u90e8\u95e8'),
        projectOwnerName: textAt(cells, '\u7528\u6237\u540d\u79f0'),
        promotionStatus: textAt(cells, '\u63a8\u5e7f\u72b6\u6001'),
        listingStatus: textAt(cells, '\u4e0a\u67b6\u72b6\u6001'),
        bomStatus: textAt(cells, 'BOM\u72b6\u6001'),
        requiresPlanStock: textAt(cells, '\u662f\u5426\u8981\u6c42\u8ba1\u5212\u5907\u8d27'),
        bomAuditStatus: textAt(cells, '\u5ba1\u6838Bom\u72b6\u6001'),
        plmCategory: textAt(cells, '\u54c1\u7c7b'),
      };
    }).filter((row) => row.sku && row.rowId);
  }

  function normalizeProjectListHeader(value) {
    return compactText(value).replace(/^\*\s*/, '').replace(/[\ue000-\uf8ff]/g, '').trim();
  }

  function cleanProjectListCell(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function isWestmonthLoginPage() {
    return /auth\.westmonth\.com\/auth\/login/.test(location.href);
  }

  function autoClickWestmonthLogin() {
    const tryClick = () => {
      const inputs = Array.from(document.querySelectorAll('input')).filter(isVisibleElement);
      const account = inputs.find((input) => /工号|手机号|邮箱|账号|用户名/i.test(input.placeholder || '') || input.type === 'text');
      const password = inputs.find((input) => input.type === 'password' || /密码/i.test(input.placeholder || ''));
      if (!account || !password || !account.value || !password.value) return false;
      const button = findWestmonthLoginButton();
      if (!button || !isActionButtonReady(button)) return false;
      button.click();
      return true;
    };
    if (tryClick()) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (tryClick() || Date.now() - startedAt > 15000) window.clearInterval(timer);
    }, 500);
  }

  function findWestmonthLoginButton() {
    return Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const text = compactText(el.innerText || el.textContent || el.value).replace(/\s+/g, '');
        return text === '\u767b\u5f55' || /^log\s*in$/i.test(text);
      }) || null;
  }

  function startUploadQueueSync() {
    let refreshTimer = 0;
    const refresh = () => {
      state.uploadQueue = loadUploadQueue();
      state.uploadHistory = loadUploadHistory();
      const mode = isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : normalizeUploadMode(state.uploadMode);
      state.uploadWorkerMode = mode;
      state.uploadRunning = loadUploadWorkerRunning(mode);
      if (state.view === 'upload') {
        if (!refreshUploadViewInPlace(ensurePanel())) renderShell();
      }
      else if (state.uploadExpanded) renderShell();
    };
    const scheduleRefresh = (resetHistoryPage) => {
      if (resetHistoryPage && state.uploadView === 'history') state.uploadHistoryPage = 1;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh, 0);
    };
    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(UPLOAD_QUEUE_KEY, (_name, _oldValue, _newValue, remote) => {
        if (!remote && isUploadWorkerPage()) return;
        scheduleRefresh(false);
      });
      GM_addValueChangeListener(UPLOAD_HISTORY_KEY, () => {
        scheduleRefresh(true);
        scheduleDesktopBridgeSnapshot();
      });
      GM_addValueChangeListener(UPLOAD_WORKER_KEY, () => scheduleRefresh(false));
      GM_addValueChangeListener(UPLOAD_WORKER_STATES_KEY, () => scheduleRefresh(false));
    }
    window.addEventListener('storage', (event) => {
      if (event.key === UPLOAD_QUEUE_KEY || event.key === UPLOAD_HISTORY_KEY || event.key === UPLOAD_WORKER_KEY || event.key === UPLOAD_WORKER_STATES_KEY) refresh();
      if (event.key === UPLOAD_HISTORY_KEY) scheduleDesktopBridgeSnapshot();
    });
    window.setInterval(refresh, 5000);
  }

  function handleDrawerState() {
    if (state.workMode === 'product-development' || state.view === 'productDevelopmentTasks') return;
    if (state.view === 'batchExcel' || state.view === 'tools') return;
    const lockedSku = state.openingProjectDetailSku || '';
    const drawer = getProjectDrawer();
    if (!drawer) {
      if (lockedSku) return;
      scheduleDrawerClosedCollapse();
      return;
    }

    const text = getVisibleText(drawer);
    const sku = getProjectDrawerHeaderSku(drawer);
    if (!sku) return;
    if (state.drawerTabFlowSku && ((state.drawerTabFlowDrawer && drawer !== state.drawerTabFlowDrawer) || (sku && sku !== state.drawerTabFlowSku))) {
      stopScan();
      cancelDrawerTabFlow();
    }
    if (sku && state.selectedSku && sku !== state.selectedSku) {
      state.copywritingMode = false;
      state.copywritingError = '';
      state.copywritingStatus = '';
    }
    if (lockedSku && sku && sku !== lockedSku) return;
    if (lockedSku && !sku && state.openingProjectDetail) return;
    if (state.userCollapsedPanel && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    const shouldAdoptProgrammaticDetail = sku && state.openingProjectDetailSku && sku === state.openingProjectDetailSku;
    if (!shouldAdoptProgrammaticDetail && (state.view === 'sizeImage' || state.view === 'parameterImage')) {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      return;
    }
    if (!shouldAdoptProgrammaticDetail && (state.view === 'about' || state.view === 'upload')) {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      if (sku) state.selectedSku = sku;
      return;
    }
    const changed = drawer !== state.drawer || (sku && sku !== state.sku);
    if (state.scanRunning && drawer === state.drawer) {
      if (sku && sku !== state.sku) {
        state.sku = sku;
        state.scanTargetSku = sku;
        state.scanData = normalizeData(loadData(sku) || {
          sku,
          name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
        });
      }
      return;
    }
    if (!changed && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    if (!changed) return;
    state.manuallyCollapsedForSku = '';
    if (shouldAdoptProgrammaticDetail) {
      state.openingProjectDetail = false;
      state.openingProjectDetailSku = '';
    }

    const cached = sku ? loadData(sku) : null;
    if (cached) {
      state.drawer = drawer;
      state.sku = sku || '';
      state.data = normalizeData(cached);
      const projectStatus = extractProjectStatus(text);
      if (projectStatus && projectStatus !== state.data.projectStatus) {
        state.data = normalizeData({ ...state.data, projectStatus });
        saveData(sku, state.data);
      }
      state.selectedSku = sku;
      state.view = 'detail';
      resetExcelState();
      expandPanel();
      upsertIndex(state.data);
      stopScan();
      if (!shouldSkipLedgerDrawer(drawer)) {
        upsertDailyLedgerFromData(state.data, { status: '待定稿', stage: '待定稿', note: '打开详情自动记录', requireCurrentMonth: true });
      }
      renderShell(L.scanning);
      scheduleDrawerProductFlow(state.data, { reason: 'cached-open', includeScanTabs: true });
      return;
    }

    state.drawer = drawer;
    state.sku = sku || '';
    state.data = sku ? normalizeData({ sku, name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''), projectStatus: extractProjectStatus(text) }) : null;
    state.selectedSku = sku || '';
    state.view = 'detail';
    resetExcelState();
    expandPanel();
    if (state.settings.collectionEnabled) {
      resetRound();
      state.scanTargetSku = sku || '';
      startScan();
      return;
    }
    renderShell();
  }

  function scheduleDrawerClosedCollapse() {
    const hadDrawer = Boolean(state.drawer || state.sku);
    stopScan();
    cancelDrawerTabFlow();
    stopMaterialWatch();
    stopManualTabRead();
    state.drawer = null;
    state.sku = '';
    state.observedDrawer = null;
    state.observedSku = '';
    state.observedTab = '';
    if (hadDrawer) collapsePanel(true);
  }

  function resetRound() {
    stopScan();
    cancelDrawerTabFlow();
    state.scanRunning = false;
    state.scanTargetSku = '';
    state.scanData = null;
  }

  function startScan(options) {
    const opts = options || {};
    if (!state.settings.collectionEnabled) return;
    const drawer = getProjectDrawer();
    if (!drawer) {
      showToast('\u8bf7\u5148\u6253\u5f00\u9879\u76ee\u8be6\u60c5');
      return;
    }
    stopScan();
    const drawerSku = getProjectDrawerHeaderSku(drawer);
    const requestedSku = state.scanTargetSku || state.sku || '';
    if (!drawerSku || (requestedSku && requestedSku !== drawerSku)) {
      state.scanRunning = true;
      state.scanTimer = window.setTimeout(startScan, 250);
      return;
    }
    const targetSku = drawerSku;
    if (targetSku) {
      state.scanTargetSku = targetSku;
      if (!state.scanData || state.scanData.sku !== targetSku) {
        const activeData = state.data && state.data.sku === targetSku ? state.data : null;
        state.scanData = normalizeData(activeData || loadData(targetSku) || { sku: targetSku });
      }
    }
    lockLoadingTip(targetSku || state.selectedSku || '');
    state.scanRunning = true;
    if (!isLoadingTipVisible()) renderShell(L.scanning);
    scheduleDrawerProductFlow(state.scanData || { sku: targetSku }, {
      reason: 'scan',
      includeScanTabs: true,
      replace: true,
      forceAllTabs: Boolean(opts.forceAllTabs),
    });
  }

  async function refreshSelectedData() {
    if (!state.settings.collectionEnabled) {
      showToast('数据采集已关闭');
      return;
    }
    const targetSku = (state.data && state.data.sku) || state.selectedSku || '';
    if (!targetSku) {
      showToast(L.excelNeedData);
      return;
    }
    state.view = 'detail';
    stopMaterialWatch();
    stopScan();
    expandPanel();

    let drawer = getProjectDrawer();
    const drawerText = drawer ? getVisibleText(drawer) : '';
    if (!drawer || !drawerText.includes(targetSku)) {
      renderShell('\u6b63\u5728\u6253\u5f00\u6b63\u786e\u7f16\u7801\u8be6\u60c5...');
      await openSelectedProjectDetail();
      drawer = await waitFor(() => getProjectDrawerForSku(targetSku), 5000, 150);
      if (!drawer) {
        showToast(L.openDetailFailed);
        renderShell();
        return;
      }
    }

    state.drawer = drawer;
    state.sku = targetSku;
    state.selectedSku = targetSku;
    state.data = createRefreshSeedData(targetSku);
    resetExcelState();
    resetRound();
    state.scanTargetSku = targetSku;
    renderShell(L.scanning);
    startScan({ forceAllTabs: true });
  }

  function createRefreshSeedData(sku) {
    const cached = normalizeData(loadData(sku) || {});
    const preservedImageSource = /^(?:effectImage|productListImage)$/.test(cached.skuImageSource || '') ? cached.skuImageSource : '';
    return normalizeData({
      sku,
      name: cached.name || '',
      brand: cached.brand || '',
      manualCategory: cached.manualCategory || '',
      aiProductType: cached.aiProductType || '',
      aiCategory: cached.aiCategory || '',
      productType: cached.productType || '',
      category: cached.category || '',
      plmCategory: cached.plmCategory || '',
      departmentName: cached.departmentName || '',
      manualFieldOverrides: cached.manualFieldOverrides || {},
      recentFieldChanges: Array.isArray(cached.recentFieldChanges) ? cached.recentFieldChanges : [],
      recentFieldChangesAcknowledgedSignature: cached.recentFieldChangesAcknowledgedSignature || '',
      dataUpdateLog: Array.isArray(cached.dataUpdateLog) ? cached.dataUpdateLog : [],
      infringementHistory: Array.isArray(cached.infringementHistory) ? cached.infringementHistory : [],
      projectRowId: cached.projectRowId || '',
      projectId: cached.projectId || '',
      copywriting: cached.copywriting || null,
      copywritingIngredientEnglish: cached.copywritingIngredientEnglish || '',
      copywritingIngredientChinese: cached.copywritingIngredientChinese || '',
      copywritingIngredientSplit: Boolean(cached.copywritingIngredientSplit),
      ingredientEnglish: cached.ingredientEnglish || '',
      ingredientChinese: cached.ingredientChinese || '',
      ingredientItems: Array.isArray(cached.ingredientItems) ? cached.ingredientItems : [],
      ingredientPdfFileName: cached.ingredientPdfFileName || '',
      ingredientPdfHash: cached.ingredientPdfHash || '',
      ingredientPdfModel: cached.ingredientPdfModel || '',
      ingredientPdfUpdatedAt: cached.ingredientPdfUpdatedAt || '',
      ingredientNormalizerVersion: cached.ingredientNormalizerVersion || '',
      ingredientSource: cached.ingredientSource || '',
      ingredientWordFileName: cached.ingredientWordFileName || '',
      ingredientWordHash: cached.ingredientWordHash || '',
      ingredientWordUpdatedAt: cached.ingredientWordUpdatedAt || '',
      printRawText: cached.printRawText || '',
      tailSealLengthValue: cached.tailSealLengthValue || '',
      purchasePrice: cached.purchasePrice || '',
      purchasePriceSource: cached.purchasePriceSource || '',
      purchasePriceUpdatedAt: cached.purchasePriceUpdatedAt || '',
      seenDesign: cached.seenDesign,
      productListImageUrl: cached.productListImageUrl || '',
      productListImageFallbackUrl: cached.productListImageFallbackUrl || '',
      benchmarkImageUrl: cached.benchmarkImageUrl || '',
      benchmarkImageFallbackUrl: cached.benchmarkImageFallbackUrl || '',
      infringementImageUrls: [],
      infringementImageUrl: '',
      infringementImageSource: '',
      infringementCopywriting: cached.infringementCopywriting || '',
      skuImageUrl: preservedImageSource ? (cached.skuImageUrl || '') : '',
      skuImageFallbackUrl: preservedImageSource ? (cached.skuImageFallbackUrl || '') : '',
      skuImageSource: preservedImageSource,
    });
  }

  function stopScan() {
    clearScanLoadingTipTimer();
    if (state.scanTimer) {
      window.clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
    state.scanRunning = false;
  }

  function clearScanLoadingTipTimer() {
    if (!state.scanLoadingTipTimer) return;
    window.clearTimeout(state.scanLoadingTipTimer);
    state.scanLoadingTipTimer = 0;
  }

  function armScanLoadingTipTimeout(sku, token) {
    clearScanLoadingTipTimer();
    state.scanLoadingTipTimer = window.setTimeout(() => {
      state.scanLoadingTipTimer = 0;
      if (
        !state.scanRunning
        || state.drawerTabFlowToken !== token
        || state.drawerTabFlowSku !== sku
      ) return;
      state.scanRunning = false;
      if (state.apiReadStatus && state.apiReadStatus.sku === sku && state.apiReadStatus.phase === 'loading') {
        setApiReadStatus(sku, 'loading', '正在后台读取 PLM 数据');
      }
      if (state.selectedSku === sku && state.view === 'detail') renderShell();
      addLog('info', '详情前台提示超时，已切换为后台读取', sku + ' | ' + SCAN_FOREGROUND_LOADING_TIMEOUT_MS + 'ms');
    }, SCAN_FOREGROUND_LOADING_TIMEOUT_MS);
  }

  function stopManualTabRead() {
    if (state.manualCollectTimer) {
      window.clearTimeout(state.manualCollectTimer);
      state.manualCollectTimer = 0;
    }
  }

  function observeManualTabRead() {
    const drawer = getProjectDrawer();
    if (!drawer || state.scanRunning || !state.settings.collectionEnabled) return;
    const sku = getProjectDrawerHeaderSku(drawer);
    const tab = getActiveTabText(drawer);
    if (!sku || !tab) return;
    if (drawer !== state.observedDrawer || sku !== state.observedSku) {
      state.observedDrawer = drawer;
      state.observedSku = sku;
      state.observedTab = tab;
      return;
    }
    if (tab === state.observedTab) return;
    state.observedTab = tab;
    stopManualTabRead();
    state.manualCollectTimer = window.setTimeout(() => readCurrentManualTab(drawer, sku, tab), 420);
  }

  function readCurrentManualTab(drawer, sku, tab) {
    state.manualCollectTimer = 0;
    if (!state.settings.collectionEnabled || state.scanRunning || drawer !== getProjectDrawerForSku(sku) || getActiveTabText(drawer) !== tab) return;
    const next = extractData(drawer, { forceSkuImage: tab === L.productTab });
    if (!next.sku || next.sku !== sku) return;
    const merged = mergeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }), next);
    const previous = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    const changed = hasMeaningfulDataChange(previous, merged);
    if (changed) {
      saveData(sku, merged);
      if (state.selectedSku === sku) renderShell();
    }
    if (tab === L.productTab) {
      scheduleDrawerProductFlow(merged, { reason: 'manual-product-tab', includeScanTabs: false, replace: true });
    }
  }

  function stopMaterialWatch() {
    if (state.materialWatchTimer) {
      window.clearTimeout(state.materialWatchTimer);
      state.materialWatchTimer = 0;
    }
  }

  function checkMaterialOnce() {
    const targetSku = state.scanTargetSku || state.sku || (state.data && state.data.sku) || '';
    const drawer = targetSku ? getProjectDrawerForSku(targetSku) : null;
    const trackedData = state.scanData && state.scanData.sku === targetSku
      ? state.scanData
      : normalizeData(loadData(targetSku) || {});
    if (!drawer || !targetSku || !trackedData.sku) {
      stopMaterialWatch();
      return;
    }

    state.materialWatchAttempts += 1;
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const onMaterial = activeTabText === L.materialTab || /\u7269\u6599\u7f16\u7801.*\u7269\u6599\u540d\u79f0.*\u89c4\u683c\u578b\u53f7/.test(text);

    if (!onMaterial) {
      const tab = findTabButton(drawer, L.materialTab);
      if (tab && !isActiveTab(tab)) {
        state.ignoreOutsideClickUntil = Date.now() + 1200;
        tab.click();
      }
    } else {
      const packaging = extractPackaging(drawer);
      if (hasPackagingChanged(trackedData, packaging)) {
        const packageNums = packaging.packageNums || trackedData.packageNums || null;
        const hasInnerCard = hasInnerCardMark(packaging) || hasInnerCardMark(trackedData);
        const productNums = productNumsFromPackage(packageNums, hasInnerCard);
        const updatedData = normalizeData({
          ...trackedData,
          accessories: packaging.accessories,
          packageSizeText: packaging.packageSizeText || trackedData.packageSizeText,
          packageSizeLabel: packaging.packageSizeLabel || trackedData.packageSizeLabel,
          packageCode: packaging.packageCode || trackedData.packageCode,
          printSizeText: packaging.printSizeText || trackedData.printSizeText,
          printSizeLabel: packaging.printSizeLabel || trackedData.printSizeLabel,
          printCode: packaging.printCode || trackedData.printCode,
          materialDimensionUnitIssues: packaging.materialDimensionUnitIssues,
          packageNums,
          productNums,
          packageSource: packaging.packageSizeText ? L.sourceMaterial : trackedData.packageSource,
          hasInnerCard,
          netContent: packaging.netContent || trackedData.netContent,
          updatedAt: new Date().toLocaleString(),
          updatedAtMs: Date.now(),
        });
        if (state.scanData && state.scanData.sku === targetSku) state.scanData = updatedData;
        saveData(targetSku, updatedData);
        renderShell('\u7269\u6599\u6e05\u5355\u5c3a\u5bf8\u5df2\u66f4\u65b0');
        stopMaterialWatch();
        return;
      }
    }

    if (state.materialWatchAttempts >= MATERIAL_WATCH_ATTEMPTS) {
      stopMaterialWatch();
      renderShell(L.cached);
      return;
    }
    state.materialWatchTimer = window.setTimeout(checkMaterialOnce, SCAN_INTERVAL_MS);
  }

  function hasPackagingChanged(data, packaging) {
    if (!packaging) return false;
    if (JSON.stringify(normalizeAccessories(data.accessories)) !== JSON.stringify(normalizeAccessories(packaging.accessories))) return true;
    if (packaging.packageSizeText && packaging.packageSizeText !== data.packageSizeText) return true;
    if (packaging.packageSizeLabel && packaging.packageSizeLabel !== data.packageSizeLabel) return true;
    if (hasInnerCardMark(packaging) !== hasInnerCardMark(data)) return true;
    if (packaging.printSizeText && packaging.printSizeText !== data.printSizeText) return true;
    if (packaging.printSizeLabel && packaging.printSizeLabel !== data.printSizeLabel) return true;
    return false;
  }

  function scheduleDrawerProductFlow(data, options) {
    const opts = options || {};
    const sku = String(data && data.sku || '');
    if (!state.settings.collectionEnabled || !sku) return;
    if (!opts.replace && state.drawerTabFlowRunning && state.drawerTabFlowSku === sku) return;
    cancelDrawerTabFlow();
    const token = state.drawerTabFlowToken + 1;
    state.drawerTabFlowToken = token;
    state.drawerTabFlowSku = sku;
    state.drawerTabFlowUserInterrupted = false;
    if (opts.includeScanTabs) {
      state.scanRunning = true;
      state.scanTargetSku = sku;
      state.scanData = normalizeData(data);
      armScanLoadingTipTimeout(sku, token);
    }
    state.drawerTabFlowTimer = window.setTimeout(() => {
      state.drawerTabFlowTimer = 0;
      runDrawerProductFlow(sku, token, opts).catch((error) => {
        addLog('warn', '\u4ea7\u54c1\u4fe1\u606f\u96c6\u4e2d\u83b7\u53d6\u5931\u8d25', sku + ' | ' + formatErrorMessage(error));
      });
    }, opts.reason === 'cached-open' ? 220 : 0);
  }

  function hasCurrentCopywritingCache(data) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    return Boolean(record && record.fullText && record.parserVersion === COPYWRITING_PARSER_VERSION);
  }

  function getDrawerCollectionTabs(data, includeScanTabs, forceAllTabs) {
    if (!includeScanTabs) return [L.productTab];
    if (forceAllTabs) return ['\u9879\u76ee\u4fe1\u606f', L.materialTab, L.productTab];
    const cached = normalizeData(data || {});
    const tabs = [];
    const hasProjectCache = Boolean(cached.name && cached.projectStatus);
    const projectNeedsTab = (!hasProjectCache && !isApiFieldResolved(cached, 'project'))
      || (!cached.referenceUrl && !cached.benchmarkLink && !isApiFieldResolved(cached, 'benchmarkLink'));
    if (projectNeedsTab) tabs.push('\u9879\u76ee\u4fe1\u606f');
    const hasPackageDimensions = Boolean(cached.packageLength && cached.packageWidth && cached.packageHeight);
    const hasMaterialUnitIssue = Boolean(getMaterialDimensionUnitIssue(cached, 'package') || getMaterialDimensionUnitIssue(cached, 'print'));
    const missingMaterialSize = !hasPackageDimensions && !cached.printSizeText && !hasMaterialUnitIssue
      && !isApiFieldResolved(cached, 'materialSize');
    const missingPackageSize = Boolean((cached.packageCode || cached.packageSizeLabel) && !cached.packageSizeText)
      && !isApiFieldResolved(cached, 'packageSize');
    const missingPrintSize = Boolean((cached.printCode || cached.printSizeLabel) && !cached.printSizeText)
      && !isApiFieldResolved(cached, 'printSize');
    const missingPackageLabel = Boolean((cached.packageCode || cached.packageSizeText) && !cached.packageSizeLabel)
      && !isApiFieldResolved(cached, 'packageLabel');
    const missingPrintLabel = Boolean((cached.printCode || cached.printSizeText) && !cached.printSizeLabel)
      && !isApiFieldResolved(cached, 'printLabel');
    const hasIngredientCache = Boolean(cached.ingredientChinese || cached.ingredientEnglish || cached.plmIngredientText);
    const ingredientCheckFresh = Number(cached.plmIngredientParserVersion || 0) === PLM_INGREDIENT_CACHE_VERSION
      && Number(cached.plmIngredientCheckedAt || 0) > 0
      && Date.now() - Number(cached.plmIngredientCheckedAt || 0) < PLM_INGREDIENT_CHECK_WINDOW_MS;
    const materialNeedsTab = (!cached.seenMaterial && !isApiFieldResolved(cached, 'material'))
      || missingMaterialSize || missingPackageSize || missingPrintSize || missingPackageLabel || missingPrintLabel;
    if (materialNeedsTab) tabs.push(L.materialTab);
    const productNeedsTab = (!cached.seenProduct && !isApiFieldResolved(cached, 'product'))
      || (!cached.grossWeight && !isApiFieldResolved(cached, 'grossWeight'))
      || !hasCurrentCopywritingCache(cached)
      || (!hasIngredientCache && !ingredientCheckFresh);
    if (productNeedsTab) tabs.push(L.productTab);
    return tabs;
  }

  function isDrawerProductFlowCurrent(sku, token, drawer) {
    return Boolean(
      !state.drawerTabFlowUserInterrupted &&
      state.drawerTabFlowToken === token &&
      state.drawerTabFlowSku === sku &&
      drawer && drawer === getProjectDrawerForSku(sku) &&
      getProjectDrawerHeaderSku(drawer) === sku
    );
  }

  async function waitForStableProjectDrawerIdentity(drawer, sku, timeout) {
    const startedAt = Date.now();
    let stableSince = 0;
    while (Date.now() - startedAt < (Number(timeout) || 5000)) {
      if (getProjectDrawerHeaderSku(drawer) === sku && drawer === getProjectDrawerForSku(sku)) {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince >= 300) return true;
      } else {
        stableSince = 0;
      }
      await wait(100);
    }
    return false;
  }

  async function runDrawerProductFlow(sku, token, options) {
    const includeScanTabs = Boolean(options && options.includeScanTabs);
    const drawer = getProjectDrawerForSku(sku);
    const identityReady = drawer && await waitForStableProjectDrawerIdentity(drawer, sku, 5000);
    if (!identityReady || state.drawerTabFlowToken !== token || state.drawerTabFlowSku !== sku) {
      if (state.drawerTabFlowToken === token) {
        if (includeScanTabs) {
          stopScan();
          state.scanTargetSku = '';
          state.scanData = null;
          renderShell(L.openDetailFailed);
        }
        state.drawerTabFlowRunning = false;
        state.drawerTabFlowSku = '';
        state.drawerTabFlowDrawer = null;
      }
      return;
    }
    state.drawerTabFlowRunning = true;
    state.drawerTabFlowDrawer = drawer;
    const scanSeed = includeScanTabs && state.scanData && state.scanData.sku === sku ? state.scanData : null;
    let merged = normalizeData(scanSeed || loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    const apiBaseline = normalizeData(merged);
    let apiDataSaved = false;
    try {
      const apiPackaging = await fetchApiMaterialPackaging(merged);
      if (hasApiPackagingResult(apiPackaging)) {
        merged = normalizeData({
          ...mergeApiPackagingData(merged, apiPackaging),
          packageSource: resolveApiMaterialPackageSource(merged, apiPackaging),
          updatedAt: new Date().toLocaleString(),
          updatedAtMs: Date.now(),
        });
        if (includeScanTabs) state.scanData = merged;
      } else {
        merged = normalizeData({
          ...merged,
          apiFieldStates: omitApiFieldStates(merged.apiFieldStates, getApiPackagingFieldStateKeys()),
        });
        if (includeScanTabs) state.scanData = merged;
      }
      const tabs = getDrawerCollectionTabs(merged, includeScanTabs, Boolean(options && options.forceAllTabs));
      const refreshProductPage = tabs.includes(L.productTab);
      for (const tab of tabs) {
        const ready = await switchDrawerTab(drawer, tab, { flowToken: token, timeout: 4500 });
        if (!ready || !isDrawerProductFlowCurrent(sku, token, drawer)) return;
        let live = extractData(drawer, { forceSkuImage: tab === L.productTab });
        if (live.sku !== sku) return;
        merged = mergeData(merged, live);
        const needsShortReread = (tab === '\u9879\u76ee\u4fe1\u606f' && !live.name && !live.projectStatus)
          || (tab === L.materialTab && !live.seenMaterial)
          || (tab === L.productTab && (!live.seenProduct || !live.grossWeight));
        if (needsShortReread) {
          if (tab === L.productTab && !live.grossWeight) await waitFor(() => getGrossWeightValue(drawer), 2600, 120);
          else await wait(280);
          if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
          live = extractData(drawer, { forceSkuImage: tab === L.productTab });
          if (live.sku !== sku) return;
          merged = mergeData(merged, live);
        }
        if (tab === L.productTab && requiresSkuImage(merged) && !getProductThumbUrl(merged)) {
          await waitForProductInfoImage(drawer, 420);
          if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
          live = extractData(drawer, { forceSkuImage: true });
          if (live.sku !== sku) return;
          merged = mergeData(merged, live);
        }
        if (includeScanTabs) state.scanData = merged;
      }
      const apiPackagingFinal = await fetchApiMaterialPackaging(merged);
      if (hasApiPackagingResult(apiPackagingFinal)) {
        merged = normalizeData({
          ...mergeApiPackagingData(merged, apiPackagingFinal),
          packageSource: resolveApiMaterialPackageSource(merged, apiPackagingFinal),
          updatedAt: new Date().toLocaleString(),
          updatedAtMs: Date.now(),
        });
        if (apiPackagingFinal.packageSizeText || apiPackagingFinal.printSizeText || apiPackagingFinal.netContent || apiPackagingFinal.grossWeight) {
          addLog('success', '已用 PLM 数据服务更新产品与包材数据', sku + ' | 纸盒 ' + (apiPackagingFinal.packageSizeText || '无') + ' | 标签/印刷 ' + (apiPackagingFinal.printSizeText || '无') + ' | 净含量 ' + (apiPackagingFinal.netContent || '无') + ' | 毛重 ' + (apiPackagingFinal.grossWeight || '无'));
        }
      }
      const apiDomesticThirdTierPrice = extractApiDomesticThirdTierPrice([apiPackagingFinal, apiPackagingFinal && apiPackagingFinal.apiProject]);
      if (apiDomesticThirdTierPrice && !normalizeLedgerPurchasePrice(merged.purchasePrice)) {
        merged = normalizeData({
          ...merged,
          purchasePrice: apiDomesticThirdTierPrice,
          purchasePriceSource: 'plm-api-domestic-third-tier',
          purchasePriceUpdatedAt: new Date().toLocaleString(),
        });
        addLog('success', '已用 PLM 数据服务读取国内三档价格', sku + ' | ' + apiDomesticThirdTierPrice);
      }
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
      saveData(sku, merged, { changeSource: 'PLM 数据服务' });
      apiDataSaved = true;
      if (state.selectedSku === sku) state.data = normalizeData(loadData(sku) || merged);
      if (includeScanTabs && !shouldSkipLedgerDrawer(drawer)) {
        upsertDailyLedgerFromData(merged, { status: '\u5f85\u5b9a\u7a3f', stage: '\u5f85\u5b9a\u7a3f', note: '\u6253\u5f00\u8be6\u60c5\u81ea\u52a8\u8bb0\u5f55', requireCurrentMonth: true });
      }

      if (merged.projectStatus === '\u5df2\u5b8c\u6210' && !normalizeLedgerPurchasePrice(merged.purchasePrice)) {
        const stockReady = await switchDrawerTab(drawer, '\u5907\u8d27\u4fe1\u606f', { flowToken: token, timeout: 3800 });
        if (stockReady && isDrawerProductFlowCurrent(sku, token, drawer)) {
          const price = await waitFor(() => extractDomesticTierPrice(drawer), 2200, 120);
          if (price && isDrawerProductFlowCurrent(sku, token, drawer)) merged = cacheDomesticTierPrice(sku, merged, price);
        }
      }

      if (refreshProductPage) {
        if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
        await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 4500 });
        if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;

        const copywritingData = await hydrateCopywritingForSku(sku, {
          silent: true,
          drawer,
        });
        const copywritingRecord = normalizeCopywritingRecord(copywritingData && copywritingData.copywriting);
        if (!copywritingRecord || !copywritingRecord.fullText) addLog('info', '\u4ea7\u54c1\u4fe1\u606f\u672a\u627e\u5230\u4ea7\u54c1\u6587\u6848 Word', sku);
        const ingredientData = await hydrateIngredientPdfForSku(sku, {
          silent: true,
          drawer,
        });
        if (!ingredientData.ingredientEnglish && !ingredientData.ingredientChinese) {
          addLog('info', '\u4ea7\u54c1\u4fe1\u606f\u672a\u627e\u5230\u6210\u5206\u8868 PDF', sku);
        }
      }
    } finally {
      if (includeScanTabs && isDrawerProductFlowCurrent(sku, token, drawer)) {
        await switchDrawerTab(drawer, L.materialTab, { flowToken: token, timeout: 4500 }).catch(() => false);
      }
      if (state.drawerTabFlowToken === token) {
        if (includeScanTabs) {
          stopScan();
          state.scanTargetSku = '';
          state.scanData = null;
          renderShell(L.scanDone);
        } else if (state.selectedSku === sku) {
          renderShell(L.cached);
        }
        if (apiDataSaved && state.selectedSku === sku) showApiDataChangeNotice(sku, apiBaseline, merged);
        state.drawerTabFlowRunning = false;
        state.drawerTabFlowSku = '';
        state.drawerTabFlowDrawer = null;
      }
    }
  }

  function extractDomesticTierPrice(drawer) {
    if (!drawer || getActiveTabText(drawer) !== '\u5907\u8d27\u4fe1\u606f') return '';
    const labeled = getFormValueByLooseLabel('\u56fd\u5185\u4e09\u6863\u4ef7\u683c', drawer);
    const fromLabel = normalizeLedgerPurchasePrice(String(labeled || '').replace(/^[^\d]*/, ''));
    if (fromLabel) return fromLabel;
    const text = getVisibleText(drawer);
    const match = text.match(/\u56fd\u5185\u4e09\u6863\u4ef7\u683c\s*[:\uff1a]?\s*(?:[\uffe5\u00a5]|RMB)?\s*(\d+(?:\.\d+)?)(?![\d.])/i);
    return normalizeLedgerPurchasePrice(match ? match[1] : '');
  }

  function cacheDomesticTierPrice(sku, data, price, source) {
    const normalizedPrice = normalizeLedgerPurchasePrice(price);
    if (!sku || !normalizedPrice) return data;
    const previousPrice = normalizeLedgerPurchasePrice(data && data.purchasePrice);
    const priceSource = String(source || 'plm-stock-domestic-tier');
    const next = normalizeData({
      ...(data || {}),
      purchasePrice: normalizedPrice,
      purchasePriceSource: priceSource,
      purchasePriceUpdatedAt: new Date().toLocaleString(),
    });
    saveData(sku, next);
    if (state.selectedSku === sku) {
      state.data = next;
      state.excelPurchasePrice = normalizedPrice;
    }
    if (state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === sku) {
      state.excelExtra.excelData = next;
    }
    upsertDailyLedgerFromData(next, { purchasePrice: normalizedPrice });
    if (previousPrice !== normalizedPrice) recordCommerceInsight(next, null, { price: normalizedPrice, source: priceSource });
    addLog('success', '\u5df2\u7f13\u5b58\u56fd\u5185\u4e09\u6863\u4ef7\u683c', sku + ' | ' + normalizedPrice);
    return next;
  }



  function sanitizeDiagnosticAttempts(attempts) {
    return Array.isArray(attempts) ? attempts.slice(0, 8).map((item) => ({
      tab: String(item && item.tab || '').slice(0, 40),
      count: Number(item && item.count || 0) || 0,
      beforeMissing: Array.isArray(item && item.beforeMissing) ? item.beforeMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      afterMissing: Array.isArray(item && item.afterMissing) ? item.afterMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
    })).filter((item) => item.tab) : [];
  }


  function requiresSkuImage(data) {
    return Boolean(data && data.projectStatus === '\u5df2\u5b8c\u6210');
  }

  function getProjectDrawerHeaderSku(drawer) {
    if (!drawer) return '';
    const header = drawer.querySelector('.taskInfo');
    if (!header || !isVisibleElement(header)) return '';
    const match = getVisibleText(header).match(/\u5546\u54c1\u7f16\u7801\s*[:\uff1a]\s*(SKU\d+)/i);
    return match ? match[1].toUpperCase() : '';
  }

  function getProjectDrawer() {
    if (state.openingProjectDetailSku) {
      const locked = getProjectDrawerForSku(state.openingProjectDetailSku);
      return locked || null;
    }
    const drawers = Array.from(document.querySelectorAll('.ant-drawer-open'))
      .filter(isVisibleElement)
      .filter((drawer) => {
        const text = getVisibleText(drawer);
        if (/\u67e5\u770b\u5546\u54c1/.test(text)) return false;
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text);
      });
    return drawers[drawers.length - 1] || null;
  }

  function extractData(drawer, options) {
    const opts = options || {};
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const hasMaterialContent = /\u7269\u6599\u7f16\u7801[\s\S]*\u7269\u6599\u540d\u79f0[\s\S]*\u89c4\u683c\u578b\u53f7|\u5305\u88c5\u5c3a\u5bf8|\u5370\u5237\u5c3a\u5bf8|\u51c0\u542b\u91cf/.test(text);
    const hasProductContent = /PRODUCT\s*NAME|\u5546\u54c1\u540d\u79f0|\u4ea7\u54c1\u540d\u79f0|\u89c4\u683c\u4fe1\u606f|\u6bdb\u91cd|\u51c0\u542b\u91cf|\u6548\u679c\u56fe\u4fe1\u606f/.test(text);
    const seenMaterial = activeTabText === L.materialTab && hasMaterialContent;
    const seenProduct = activeTabText === L.productTab && hasProductContent;
    const plmIngredientText = seenProduct
      ? cleanExcelFieldValue(getFormValueByLooseLabel('\u6210\u5206', drawer) || getFormValueByLooseLabel('\u6210\u4efd', drawer))
      : '';
    const plmIngredientEnglishText = seenProduct
      ? cleanExcelFieldValue(getFormValueByLooseLabel('INGREDIENTS', drawer) || getFormValueByLooseLabel('INGREDIENT', drawer))
      : '';
    const projectStatus = extractProjectStatus(text);
    const packaging = seenMaterial ? extractPackaging(drawer) : emptyPackaging();
    const outer = extractOuterPackage(drawer);
    const inner = seenProduct ? extractInnerPackage(drawer) : { productNums: null };
    const food = seenMaterial ? extractFoodSemiFinished(drawer) : emptyFoodSemiFinished();
    const imageInfo = seenProduct && (projectStatus === '\u5df2\u5b8c\u6210' || opts.forceSkuImage) ? findDesignImageInfo(drawer) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const tubeFields = extractTubeFields(drawer);
    const tubeSpec = packaging.isTubePrintMaterial
      ? findTubeSizeSpec([tubeFields.text, packaging.printRawText, packaging.printSizeText, packaging.printSizeLabel].filter(Boolean).join('\n'), tubeFields)
      : null;
    const isTubePrint = Boolean(tubeSpec);
    const singleBottle = Boolean(
      food.productNums && !packaging.packageNums && outer.packageNums &&
      !/\u7eb8\u76d2/.test(String(packaging.packageSizeLabel || '') + String(packaging.packageSizeText || ''))
    );
    const packageNums = singleBottle ? null : (packaging.packageNums || outer.packageNums);
    const hasInnerCard = hasInnerCardMark(packaging);
    const productNums = singleBottle ? outer.packageNums : (packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : food.productNums);

    const brand = getProjectField(text, '\u54c1\u724c') || getFormValueByLabel('\u54c1\u724c', drawer);
    const developerText = extractDeveloperText(text);
    return {
      sku: getProjectDrawerHeaderSku(drawer),
      name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
      packageSizeText: packaging.packageSizeText || '',
      packageSizeLabel: packaging.packageSizeLabel || '',
      packageCode: packaging.packageCode || '',
      accessories: seenMaterial ? packaging.accessories : undefined,
      printSizeText: tubeSpec ? tubeSpec.printSizeText : (packaging.printSizeText || ''),
      printSizeLabel: tubeSpec ? '\u5370\u5237' : (packaging.printSizeLabel || ''),
      printCode: packaging.printCode || '',
      tubeSegmentText: tubeSpec ? tubeSpec.segmentText : '',
      tubeTailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tubeDiameter: tubeSpec ? tubeSpec.diameter : '',
      tubeBody: tubeSpec ? tubeSpec.body : '',
      tubeSpecKey: tubeSpec ? tubeSpec.key : '',
      // Only promote the material to a tube after its segmented print size is recognized.
      // A generic printed-size row must remain a normal print material.
      isTubePrintMaterial: isTubePrint,
      packageNums,
      isPrintedBagOuterPackage: Boolean(packaging.isPrintedBagOuterPackage),
      productNums: inner.productNums || productNums,
      plmProductNums: inner.productNums,
      bottleNums: singleBottle ? outer.packageNums : null,
      singleBottle,
      packageSource: packaging.packageSizeText || food.productNums || isTubePrint ? L.sourceMaterial : (outer.packageNums ? L.sourceOuter : ''),
      hasInnerCard,
      materialDimensionUnitIssues: seenMaterial ? packaging.materialDimensionUnitIssues : undefined,
      developerText,
      developerName: extractDeveloperName(developerText),
      brand,
      englishName: seenProduct ? cleanEnglishProductName(extractLineAfter(text, 'PRODUCT NAME'), brand) : '',
      plmIngredientText,
      plmIngredientEnglishText,
      plmIngredientParserVersion: PLM_INGREDIENT_CACHE_VERSION,
      plmIngredientCheckedAt: seenProduct ? Date.now() : 0,
      designType: getProjectLooseField(text, '\u8bbe\u8ba1\u7c7b\u578b'),
      artPriority: getProjectLooseField(text, '\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7') || extractArtPriority(text),
      projectStatus,
      referenceUrl: extractReferenceUrl(text),
      designAssignedAt: getProjectLooseField(text, '\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4'),
      developmentAssignedAt: getProjectLooseField(text, '\u5f00\u53d1\u5206\u914d\u65f6\u95f4'),
      netContent: normalizeNetContentValue(getBestNetContent(drawer) || food.netContent || packaging.netContent),
      grossWeight: getGrossWeightValue(drawer),
      skuImageUrl: imageInfo.isSkuDesignImage ? (imageInfo.imageUrl || '') : '',
      skuImageFallbackUrl: imageInfo.isSkuDesignImage ? (imageInfo.imageFallbackUrl || '') : '',
      skuImageSource: imageInfo.isSkuDesignImage ? 'effectImage' : '',
      seenMaterial,
      seenProduct,
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    };
  }

  function mergeData(previous, next) {
    if (!previous) return normalizeData(next);
    const sameSku = previous.sku && next.sku && previous.sku === next.sku;
    if (!sameSku) return normalizeData(next);

    const merged = { ...previous };
    for (const key of Object.keys(next)) {
      const value = key === 'name' ? normalizeProductNameValue(next[key]) : next[key];
      if (isUsefulValue(value)) merged[key] = value;
    }
    if (next.seenMaterial) {
      if (Array.isArray(next.accessories)) merged.accessories = normalizeAccessories(next.accessories);
      const hasTubeSpec = Boolean(next.tubeSegmentText || next.tubeTailSealLengthValue || next.tailSealLengthValue || next.tubeDiameter || next.tubeBody || next.tubeSpecKey || next.isTubePrintMaterial);
      if (hasTubeSpec) {
        ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'].forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(next, key)) merged[key] = next[key] || '';
        });
        if (Object.prototype.hasOwnProperty.call(next, 'isTubePrintMaterial')) merged.isTubePrintMaterial = Boolean(next.isTubePrintMaterial);
      } else {
        ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'].forEach((key) => {
          merged[key] = '';
        });
        merged.isTubePrintMaterial = false;
      }
    }
    if (next.seenProduct && (next.skuImageUrl || next.skuImageFallbackUrl)) {
      merged.skuImageUrl = next.skuImageUrl || merged.skuImageUrl || '';
      merged.skuImageFallbackUrl = next.skuImageFallbackUrl || merged.skuImageFallbackUrl || '';
      merged.skuImageSource = next.skuImageSource || merged.skuImageSource || 'effectImage';
    }
    if (next.seenProduct && Object.prototype.hasOwnProperty.call(next, 'plmProductNums')) {
      merged.plmProductNums = Array.isArray(next.plmProductNums) ? next.plmProductNums : null;
    }
    merged.seenMaterial = previous.seenMaterial || next.seenMaterial;
    merged.seenProduct = previous.seenProduct || next.seenProduct;
    return normalizeData(merged);
  }

  function hasMeaningfulDataChange(previous, next) {
    const ignored = new Set(['updatedAt', 'updatedAtMs', 'infringementUpdatedAt', 'infringementUpdatedAtMs', 'lastMissingDiagnostic', 'recentFieldChanges', 'dataUpdateLog', 'infringementHistory']);
    const before = {};
    const after = {};
    Object.keys(previous || {}).forEach((key) => {
      if (!ignored.has(key)) before[key] = getComparableDataFieldValue(key, previous[key]);
    });
    Object.keys(next || {}).forEach((key) => {
      if (!ignored.has(key)) after[key] = getComparableDataFieldValue(key, next[key]);
    });
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  function isOrderInsensitiveTrackedField(key) {
    return key === 'printCode' || key === 'printSizeText';
  }

  function normalizeTrackedDataValue(key, value) {
    if (key === 'infringementImageUrls') {
      const urls = Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
      return urls.length ? urls.length + ' 张图片' : '';
    }
    if (key === 'infringementCopywriting') {
      return String(value || '').replace(/\r\n?/g, '\n').trim();
    }
    const text = key === 'name' ? normalizeProductNameValue(value) : compactText(value);
    if (!isOrderInsensitiveTrackedField(key) || !text) return text;
    return text.split(/\s*[;；]\s*/).map((item) => item.trim()).filter(Boolean).sort().join(';');
  }

  function getComparableDataFieldValue(key, value) {
    return isOrderInsensitiveTrackedField(key) ? normalizeTrackedDataValue(key, value) : value;
  }

  function trackedDataValuesEqual(key, before, after) {
    return normalizeTrackedDataValue(key, before) === normalizeTrackedDataValue(key, after);
  }

  function isManualOverrideField(key) {
    return MANUAL_OVERRIDE_FIELDS.includes(key);
  }

  function normalizeManualFieldOverrides(data) {
    const overrides = {};
    const explicit = data && data.manualFieldOverrides;
    if (explicit && typeof explicit === 'object' && !Array.isArray(explicit)) {
      MANUAL_OVERRIDE_FIELDS.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(explicit, key)) {
          overrides[key] = explicit[key] == null ? '' : String(explicit[key]).trim();
        }
      });
    }
    // Records created before 2.7.75 did not have an explicit override map.
    // Recover the last values that were saved from the manual calibration form.
    if (Array.isArray(data && data.recentFieldChanges)) {
      data.recentFieldChanges.forEach((change) => {
        if (!change || change.source !== '手动校准' || !isManualOverrideField(change.key) || Object.prototype.hasOwnProperty.call(overrides, change.key)) return;
        overrides[change.key] = change.after == null ? '' : String(change.after).trim();
      });
    }
    return overrides;
  }

  function applyManualFieldOverrides(data, overrides) {
    const next = { ...(data || {}), manualFieldOverrides: { ...(overrides || {}) } };
    const has = (key) => Object.prototype.hasOwnProperty.call(overrides || {}, key);
    const value = (key) => overrides[key] == null ? '' : String(overrides[key]).trim();
    MANUAL_OVERRIDE_FIELDS.forEach((key) => {
      if (has(key) && !/^(?:package|product)(?:Length|Width|Height)$/.test(key)) next[key] = value(key);
    });

    const applyDimensionGroup = (fields, numsKey, sizeKey) => {
      const hasDimensionOverride = fields.some((key) => has(key));
      if (!hasDimensionOverride) return;
      const nums = fields.map((key) => firstNumber(value(key)));
      if (!nums.every((item) => Number.isFinite(item) && item > 0)) return;
      next[numsKey] = nums;
      fields.forEach((key, index) => { next[key] = formatSingleDimension(nums[index]); });
      if (!has(sizeKey)) next[sizeKey] = nums.map(trimNumber).join('x') + 'cm';
    };

    applyDimensionGroup(['packageLength', 'packageWidth', 'packageHeight'], 'packageNums', 'packageSizeText');
    if (has('packageSizeText') && !['packageLength', 'packageWidth', 'packageHeight'].some((key) => has(key))) {
      const packageNums = parseDimension(value('packageSizeText'), 3);
      if (packageNums) {
        next.packageNums = packageNums;
        next.packageLength = formatDimensionPart(packageNums, 0);
        next.packageWidth = formatDimensionPart(packageNums, 1);
        next.packageHeight = formatDimensionPart(packageNums, 2);
      }
    }
    const productFields = ['productLength', 'productWidth', 'productHeight'];
    if (productFields.some((key) => has(key))) {
      const productNums = productFields.map((key) => firstNumber(value(key)));
      if (productNums.every((item) => Number.isFinite(item) && item > 0)) {
        next.productNums = productNums;
        next.plmProductNums = productNums;
        productFields.forEach((key, index) => { next[key] = formatSingleDimension(productNums[index]); });
        next.productSizeSource = 'manual';
        next.omitEstimatedProductSize = false;
      }
    }
    return next;
  }

  const INFRINGEMENT_HISTORY_LIMIT = 24;
  const DATA_UPDATE_LOG_LIMIT = 60;

  function normalizeInfringementHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const imageUrls = Array.from(new Set([
        ...(Array.isArray(entry.imageUrls) ? entry.imageUrls : []),
        ...(Array.isArray(entry.images) ? entry.images : []),
        entry.imageUrl,
      ].map((value) => normalizeApiAssetUrl(value) || String(value || '').trim()).filter(Boolean))).slice(0, 20);
      const copywriting = String(entry.copywriting || entry.infringementCopywriting || '').replace(/\r\n?/g, '\n').trim().slice(0, 24000);
      if (!imageUrls.length && !copywriting) return null;
      const updatedAtMs = Number(entry.updatedAtMs || entry.changedAtMs || 0) || 0;
      const updatedAt = String(entry.updatedAt || entry.changedAt || '').trim();
      return {
        id: String(entry.id || ('infringement-version-' + (updatedAtMs || index))),
        updatedAt,
        updatedAtMs,
        source: String(entry.source || 'PLM 数据服务').trim(),
        imageUrls,
        copywriting,
        signature: String(entry.signature || JSON.stringify([imageUrls, copywriting])),
      };
    }).filter(Boolean).slice(-INFRINGEMENT_HISTORY_LIMIT);
  }

  function normalizeDataUpdateLog(log) {
    if (!Array.isArray(log)) return [];
    return log.map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const changes = Array.isArray(entry.changes)
        ? entry.changes.map((change) => {
          if (!change || !change.key) return null;
          return {
            key: String(change.key),
            label: String(change.label || getSkuDataFieldLabel(change.key)),
            before: String(change.before == null ? '' : change.before).slice(0, 2400),
            after: String(change.after == null ? '' : change.after).slice(0, 2400),
          };
        }).filter(Boolean).slice(0, 30)
        : [];
      if (!changes.length) return null;
      const changedAtMs = Number(entry.changedAtMs || entry.updatedAtMs || 0) || 0;
      return {
        id: String(entry.id || ('data-update-' + (changedAtMs || index))),
        changedAt: String(entry.changedAt || entry.updatedAt || '').trim(),
        changedAtMs,
        source: String(entry.source || '自动获取').trim(),
        changes,
      };
    }).filter(Boolean).slice(-DATA_UPDATE_LOG_LIMIT);
  }

  function getInfringementSnapshot(data) {
    const imageUrls = Array.from(new Set([
      ...(Array.isArray(data && data.infringementImageUrls) ? data.infringementImageUrls : []),
      data && data.infringementImageUrl,
    ].map((value) => normalizeApiAssetUrl(value) || String(value || '').trim()).filter(Boolean))).slice(0, 20);
    const copywriting = String(data && data.infringementCopywriting || '').replace(/\r\n?/g, '\n').trim().slice(0, 24000);
    return {
      imageUrls,
      copywriting,
      updatedAt: String(data && (data.infringementUpdatedAt || data.updatedAt) || '').trim(),
      updatedAtMs: Number(data && (data.infringementUpdatedAtMs || data.updatedAtMs) || 0) || 0,
    };
  }

  function getInfringementSnapshotSignature(snapshot) {
    return JSON.stringify([snapshot && snapshot.imageUrls || [], snapshot && snapshot.copywriting || '']);
  }

  function appendInfringementHistory(previous, next, options) {
    const opts = options || {};
    const previousHistory = previous && Array.isArray(previous.infringementHistory) && previous.infringementHistory.length
      ? previous.infringementHistory
      : (next && next.infringementHistory);
    const history = normalizeInfringementHistory(previousHistory);
    const add = (snapshot, source) => {
      if (!snapshot || (!snapshot.imageUrls.length && !snapshot.copywriting)) return;
      const signature = getInfringementSnapshotSignature(snapshot);
      const last = history[history.length - 1];
      if (last && last.signature === signature) return;
      const updatedAtMs = Number(snapshot.updatedAtMs || Date.now()) || Date.now();
      history.push({
        id: 'infringement-version-' + updatedAtMs + '-' + Math.random().toString(36).slice(2, 7),
        updatedAt: snapshot.updatedAt || new Date(updatedAtMs).toLocaleString(),
        updatedAtMs,
        source: String(source || opts.changeSource || 'PLM 数据服务'),
        imageUrls: snapshot.imageUrls.slice(0, 20),
        copywriting: snapshot.copywriting,
        signature,
      });
    };
    add(getInfringementSnapshot(previous), '历史版本');
    add(getInfringementSnapshot(next), opts.changeSource || 'PLM 数据服务');
    return history.slice(-INFRINGEMENT_HISTORY_LIMIT);
  }

  function normalizeData(data) {
    const safe = data || {};
    safe.accessories = normalizeAccessories(safe.accessories);
    safe.apiFieldStates = normalizeApiFieldStates(safe.apiFieldStates);
    safe.name = normalizeProductNameValue(safe.name);
    const productNameNetContent = productNameDerivedNetContent(safe.name, safe.netContent, safe.specificationText);
    safe.brand = normalizeSkuBrandValue(safe.brand, safe);
    const manualFieldOverrides = normalizeManualFieldOverrides(safe);
    migrateLabelValue(safe, 'packageSizeLabel', 'packageSizeText');
    migrateLabelValue(safe, 'printSizeLabel', 'printSizeText');
    stripKnownLabelPrefix(safe, 'packageSizeLabel', 'packageSizeText');
    stripKnownLabelPrefix(safe, 'printSizeLabel', 'printSizeText');
    safe.packageSizeLabel = cleanPackageDisplayLabel(safe.packageSizeLabel);
    const materialDimensionUnitIssues = normalizeMaterialDimensionUnitIssues(safe.materialDimensionUnitIssues, safe);
    const parsedPackageNums = materialDimensionUnitIssues.package ? null : parseDimension(safe.packageSizeText, 3);
    // Keep the dimension array aligned with the displayed text. Older cached
    // records may still carry only the first three values of a multi-page box.
    const detectedPackageNums = Array.isArray(safe.packageNums) &&
      (!parsedPackageNums || safe.packageNums.length === parsedPackageNums.length)
      ? safe.packageNums
      : parsedPackageNums;
    const classificationText = [safe.name, safe.netContent, safe.packageSizeLabel, safe.packageSizeText, safe.printSizeLabel, safe.printSizeText].filter(Boolean).join(' ');
    const singleBottle = Boolean(safe.singleBottle || (
      detectedPackageNums &&
      !/\u7eb8\u76d2/.test(String(safe.packageSizeLabel || '') + String(safe.packageSizeText || '')) &&
      /\u6807\u7b7e/.test(String(safe.printSizeLabel || '') + String(safe.printSizeText || '')) &&
      /\u98df\u54c1|\u80f6\u56ca|\u8f6f\u7cd6|capsules?|gumm(?:y|ies)|tablets?/i.test(classificationText)
    ));
    const bottleNums = singleBottle
      ? (Array.isArray(safe.bottleNums) ? safe.bottleNums : (detectedPackageNums || (Array.isArray(safe.productNums) ? safe.productNums : null)))
      : null;
    const packageNums = singleBottle ? null : detectedPackageNums;
    const hasInnerCard = hasInnerCardMark(safe);
    if (packageNums && packageNums.length >= 5 && !/\u591a\u9875/.test(String(safe.packageSizeLabel || ''))) {
      safe.packageSizeLabel = appendChineseRemark(safe.packageSizeLabel, '\u591a\u9875');
    }
    const plmProductNums = Array.isArray(safe.plmProductNums) && safe.plmProductNums.length >= 3
      ? safe.plmProductNums.slice(0, 3).map(Number)
      : null;
    const hasPlmProductSize = Boolean(plmProductNums && plmProductNums.every((value) => Number.isFinite(value) && value > 0));
    const omitEstimatedProductSize = !singleBottle && !hasPlmProductSize && isToyDimensionProduct(safe);
    const productNums = singleBottle
      ? bottleNums
      : (hasPlmProductSize
        ? plmProductNums
        : (!omitEstimatedProductSize
          ? (packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : (Array.isArray(safe.productNums) ? safe.productNums : null))
          : null));
    const isTubePrint = isTubePrintData(safe);
    const copywriting = normalizeCopywritingRecord(safe.copywriting);
    const copywritingIngredientEnglish = normalizeIngredientLocantHyphens(String(safe.copywritingIngredientEnglish || copywriting && copywriting.cleanedIngredientEnglish || '').trim());
    const copywritingIngredientChinese = String(safe.copywritingIngredientChinese || copywriting && copywriting.cleanedIngredientChinese || '').trim();
    const plmIngredientText = String(safe.plmIngredientText || '').trim();
    const plmIngredientEnglishText = normalizeIngredientLocantHyphens(String(safe.plmIngredientEnglishText || '').trim());
    const infringementImageUrls = Array.from(new Set([
      ...(Array.isArray(safe.infringementImageUrls) ? safe.infringementImageUrls : []),
      safe.infringementImageUrl,
    ].map((value) => normalizeApiAssetUrl(value) || String(value || '').trim()).filter(Boolean))).slice(0, 20);
    const infringementCopywriting = String(safe.infringementCopywriting || '').replace(/\r\n?/g, '\n').trim();
    const infringementImageSource = String(safe.infringementImageSource || '').trim();
    return applyManualFieldOverrides({
      ...safe,
      manualFieldOverrides,
      copywriting,
      copywritingIngredientEnglish,
      copywritingIngredientChinese,
      netContent: productNameNetContent || safe.netContent || '',
      copywritingIngredientSplit: Boolean(safe.copywritingIngredientSplit || copywriting && copywriting.ingredientSplit),
      ingredientEnglish: normalizeIngredientLocantHyphens(safe.ingredientEnglish || copywritingIngredientEnglish || plmIngredientEnglishText),
      ingredientChinese: safe.ingredientChinese || copywritingIngredientChinese || plmIngredientText,
      infringementImageUrls,
      infringementImageUrl: infringementImageUrls[0] || '',
      infringementImageSource,
      infringementCopywriting,
      infringementHistory: normalizeInfringementHistory(safe.infringementHistory),
      dataUpdateLog: normalizeDataUpdateLog(safe.dataUpdateLog),
      hasInnerCard,
      singleBottle,
      bottleNums,
      isTubePrint,
      isTubePrintMaterial: Boolean(safe.isTubePrintMaterial),
      materialDimensionUnitIssues,
      packageNums,
      productNums,
      plmProductNums: hasPlmProductSize ? plmProductNums : null,
      productSizeSource: singleBottle ? 'product' : (hasPlmProductSize ? 'plm' : (productNums ? 'estimated' : 'none')),
      omitEstimatedProductSize,
      packageLength: formatDimensionPart(packageNums, 0),
      packageWidth: formatDimensionPart(packageNums, 1),
      packageHeight: formatDimensionPart(packageNums, 2),
      tubeSegmentText: isTubePrint ? (safe.tubeSegmentText || '') : '',
      tubeTailSealLengthValue: isTubePrint ? (safe.tubeTailSealLengthValue || '') : '',
      tailSealLengthValue: isTubePrint ? (safe.tailSealLengthValue || safe.tubeTailSealLengthValue || '') : '',
      productLength: isTubePrint ? (safe.tailSealLengthValue || safe.tubeTailSealLengthValue || '') : formatDimensionPart(productNums, 0),
      productWidth: formatDimensionPart(productNums, 1),
      productHeight: formatDimensionPart(productNums, 2),
    }, manualFieldOverrides);
  }

  function hasInnerCardMark(data) {
    if (!data) return false;
    return Boolean(data.hasInnerCard || /\u5185\u5361/.test(String(data.packageSizeLabel || '') + String(data.packageSizeText || '')));
  }

  function isDowmooBrand(data) {
    return Boolean(data && /\bDOWMOO\b/i.test(String(data.brand || '').trim()));
  }

  function isToyDimensionProduct(data) {
    if (isDowmooBrand(data)) return true;
    const text = [
      data && data.name,
      data && data.manualCategory,
      data && data.plmCategory,
      data && data.aiProductType,
      data && data.aiCategory,
      data && data.productType,
      data && data.category,
      data && data.departmentName,
    ].filter(Boolean).join(' ');
    if (/\btoys?\b|\bdolls?\b|玩具|公仔|玩偶|捏捏|积木|盲盒|史莱姆|解压/i.test(text)) return true;
    try {
      return getProductTypeForInsight(data, null) === '\u73a9\u5177';
    } catch (error) {
      return false;
    }
  }

  function shouldOmitToyProductSize(data) {
    if (normalizeAccessories(data && data.accessories).some((item) => item.sizeText)) return false;
    return Boolean(data && (data.omitEstimatedProductSize || (isToyDimensionProduct(data) && data.productSizeSource !== 'plm' && !data.singleBottle)));
  }

  function migrateLabelValue(data, labelKey, valueKey) {
    if (!data || data[labelKey] || !data[valueKey]) return;
    const text = String(data[valueKey]);
    const index = text.indexOf('\uff1a');
    if (index <= 0) return;
    data[labelKey] = text.slice(0, index);
    data[valueKey] = text.slice(index + 1);
  }

  function stripKnownLabelPrefix(data, labelKey, valueKey) {
    if (!data || !data[labelKey] || !data[valueKey]) return;
    const prefix = data[labelKey] + '\uff1a';
    if (String(data[valueKey]).startsWith(prefix)) {
      data[valueKey] = String(data[valueKey]).slice(prefix.length);
    }
    data[valueKey] = stripGenericDimensionPrefixes(data[valueKey]);
  }

  function stripGenericDimensionPrefixes(value) {
    return String(value || '')
      .split(/\s*[\uff1b;]\s*/)
      .map((item) => item.replace(/^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)[:\uff1a]\s*(?=\d)/, ''))
      .filter(Boolean)
      .join('\uff1b');
  }

  function isUsefulValue(value) {
    if (value === '' || value === undefined || value === null || value === false) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }
