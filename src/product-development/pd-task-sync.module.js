
  function productDevelopmentTaskTabsHtml(activeView) {
    const active = normalizeProductDevelopmentTaskTab(activeView || state.productDevelopmentTaskView);
    const buttons = PRODUCT_DEVELOPMENT_TASK_TABS.map((tab) => {
      const feature = productDevelopmentFeatureForView(tab.id);
      const locked = feature && !productDevelopmentHasAccess(feature);
      return '<button type="button" role="tab" data-action="product-development-task-tab" data-product-development-tab="' + tab.id + '" class="' + (tab.id === active ? 'is-active' : '') + (locked ? ' is-access-locked' : '') + '" aria-selected="' + String(tab.id === active) + '"' + (locked ? ' aria-disabled="true"' : '') + '>' + escapeHtml(tab.label) + '</button>';
    }).join('');
    return '<nav class="pfh-detail-view-tabs pfh-product-development-task-tabs" data-active-view="' + escapeHtml(active) + '" role="tablist" aria-label="开发 SKU 视图"><span class="pfh-detail-view-indicator" aria-hidden="true"></span>' + buttons + '</nav>';
  }

  function setupProductDevelopmentTaskTabs(panel) {
    closeProductDevelopmentDetailJumpMenu(panel);
    const tabs = panel && panel.querySelector('.pfh-product-development-task-tabs');
    const indicator = tabs && tabs.querySelector('.pfh-detail-view-indicator');
    const activeButton = tabs && tabs.querySelector('button.is-active');
    if (!tabs || !indicator || !activeButton) return;
    setupProductDevelopmentDetailJump(panel, tabs);
    const transition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    const moveIndicator = (button) => {
      if (!button) return;
      indicator.style.setProperty('left', button.offsetLeft + 'px', 'important');
      indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    };
    const previousValue = String(state.productDevelopmentTaskPreviousTab || '').trim();
    const previous = previousValue ? normalizeProductDevelopmentTaskTab(previousValue) : '';
    const previousButton = previous && previous !== activeButton.getAttribute('data-product-development-tab')
      ? tabs.querySelector('button[data-product-development-tab="' + previous + '"]')
      : null;
    indicator.style.setProperty('transition', 'none', 'important');
    moveIndicator(previousButton || activeButton);
    window.requestAnimationFrame(() => {
      if (!indicator.isConnected) return;
      indicator.style.setProperty('transition', transition, 'important');
      if (previousButton) moveIndicator(activeButton);
    });
    state.productDevelopmentTaskPreviousTab = '';
  }

  function closeProductDevelopmentDetailJumpMenu(panel) {
    const menu = panel && panel.querySelector('.pfh-development-detail-jump');
    if (menu && menu.pfhClose) menu.pfhClose();
  }

  function productDevelopmentDetailJumpTargets(panel) {
    const form = panel.querySelector('.pfh-product-development-product-form-header');
    return [
      ['local', '产品本地填写', panel.querySelector('.pfh-product-development-task-local-meta')],
      ['product', '填写建品信息', form && form.closest('section')],
      ['box', '纸盒', panel.querySelector('[data-material-card="box"]')],
    ];
  }

  function setupProductDevelopmentDetailJump(panel, tabs) {
    const trigger = tabs.querySelector('[data-product-development-tab="detail"]');
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    if (trigger.pfhDetailJumpBound) return;
    trigger.pfhDetailJumpBound = true;
    let openTimer = 0;
    let closeTimer = 0;
    let selectionTimer = 0;
    let menu = null;
    let suppressClick = false;
    const cancelOpen = () => window.clearTimeout(openTimer);
    const close = () => {
      cancelOpen();
      window.clearTimeout(closeTimer);
      window.clearTimeout(selectionTimer);
      if (menu) menu.remove();
      menu = null;
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
    };
    const outside = (event) => { if (!trigger.contains(event.target) && !(menu && menu.contains(event.target))) close(); };
    const leave = () => { cancelOpen(); window.clearTimeout(selectionTimer); closeTimer = window.setTimeout(close, 180); };
    const jump = (item) => {
      if (!item || item.disabled) return;
      const target = productDevelopmentDetailJumpTargets(panel).find(([id]) => id === item.getAttribute('data-development-detail-jump'));
      const section = target && target[2];
      const scroll = section && section.closest('.pfh-detail-scroll');
      if (!scroll) return;
      const top = section.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - tabs.getBoundingClientRect().height - 12;
      scroll.scrollTop = Math.max(0, top);
      close();
    };
    const open = () => {
      if (!trigger.isConnected || state.view !== 'productDevelopmentTasks' || state.productDevelopmentTaskView !== 'detail') return;
      window.clearTimeout(closeTimer);
      if (menu && menu.isConnected) return;
      closeProductDevelopmentDetailJumpMenu(panel);
      menu = document.createElement('div');
      menu.className = 'pfh-development-detail-jump';
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', '详情快捷目录');
      menu.innerHTML = productDevelopmentDetailJumpTargets(panel).map(([id, label, section]) => '<button type="button" role="menuitem" data-development-detail-jump="' + id + '"' + (section ? '' : ' disabled') + '>' + label + '</button>').join('');
      menu.pfhClose = close;
      panel.appendChild(menu);
      const panelRect = panel.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(triggerRect.left - panelRect.left, panelRect.width - menuRect.width - 8)) + 'px';
      menu.style.top = Math.max(8, Math.min(triggerRect.bottom - panelRect.top, panelRect.height - menuRect.height - 8)) + 'px';
      trigger.setAttribute('aria-expanded', 'true');
      menu.addEventListener('pointerenter', () => window.clearTimeout(closeTimer));
      menu.addEventListener('pointerleave', leave);
      const armSelection = (item) => {
        window.clearTimeout(closeTimer);
        window.clearTimeout(selectionTimer);
        if (!item.disabled) selectionTimer = window.setTimeout(() => { if (menu && menu.contains(item)) jump(item); }, 220);
      };
      menu.addEventListener('pointerover', (event) => {
        const item = event.target.closest('[data-development-detail-jump]');
        if (!item || item.contains(event.relatedTarget)) return;
        armSelection(item);
      });
      menu.addEventListener('pointermove', (event) => {
        const item = event.target.closest('[data-development-detail-jump]');
        if (item) armSelection(item);
      });
      menu.addEventListener('pointerout', (event) => {
        const item = event.target.closest('[data-development-detail-jump]');
        if (item && !item.contains(event.relatedTarget)) window.clearTimeout(selectionTimer);
      });
      menu.addEventListener('click', (event) => { jump(event.target.closest('[data-development-detail-jump]')); });
      menu.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { close(); trigger.focus({ preventScroll: true }); event.preventDefault(); return; }
        if (event.key === 'Tab') { trigger.focus({ preventScroll: true }); close(); return; }
        const items = Array.from(menu.querySelectorAll('button:not(:disabled)'));
        if (!items.length) return;
        const index = items.indexOf(event.target);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items[next].focus({ preventScroll: true });
          jump(items[next]);
          event.preventDefault();
        } else if (event.key === 'Enter' || event.key === ' ') { jump(event.target); event.preventDefault(); }
      });
      document.addEventListener('pointerdown', outside, true);
    };
    trigger.addEventListener('pointerenter', (event) => {
      window.clearTimeout(closeTimer);
      if (event.pointerType === 'touch') return;
      cancelOpen();
      openTimer = window.setTimeout(open, 450);
    });
    trigger.addEventListener('pointerleave', leave);
    const endPress = () => {
      cancelOpen();
      document.removeEventListener('pointerup', endPress, true);
      document.removeEventListener('pointercancel', endPress, true);
      window.setTimeout(() => { suppressClick = false; }, 0);
    };
    trigger.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      cancelOpen();
      openTimer = window.setTimeout(() => { open(); suppressClick = Boolean(menu); }, 350);
      document.addEventListener('pointerup', endPress, true);
      document.addEventListener('pointercancel', endPress, true);
    });
    trigger.addEventListener('click', (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { close(); event.preventDefault(); }
      if (event.key !== 'ArrowDown') return;
      open();
      const first = menu && menu.querySelector('button:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
      event.preventDefault();
    });
  }

  function normalizeProductDevelopmentCachedTask(item) {
    if (!item || typeof item !== 'object') return null;
    const sku = String(item.sku || item.product_code || item.productCode || '').trim().toUpperCase();
    if (!sku) return null;
    return {
      ...item,
      sku,
      rowId: String(item.rowId || item.projectId || item.id || '').trim(),
      projectId: String(item.projectId || item.rowId || item.id || '').trim(),
      developerName: productDevelopmentCleanText(item.developerName || item.dev_work_user_name || '', 80),
      developerUsername: productDevelopmentCleanText(item.developerUsername || item.dev_work_user_username || '', 80),
      name: productDevelopmentCleanText(item.name || item.product_name || item.dev_product_name || '', 240),
      projectStatus: productDevelopmentCleanText(item.projectStatus || item.status_format || item.status || '', 120),
      developmentAssignedAt: productDevelopmentCleanText(item.developmentAssignedAt || item.dev_assign_at || '', 80),
      projectCreatedAt: productDevelopmentCleanText(item.projectCreatedAt || item.create_at || '', 80),
    };
  }

  function loadProductDevelopmentTaskCache() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TASK_CACHE_KEY, null);
    const source = value && typeof value === 'object' ? value : {};
    return {
      userName: productDevelopmentCleanText(source.userName || '', 80),
      fetchedAt: Number(source.fetchedAt) || 0,
      rows: (Array.isArray(source.rows) ? source.rows : []).map(normalizeProductDevelopmentCachedTask).filter(Boolean).slice(0, 20),
    };
  }

  function saveProductDevelopmentTaskCache(rows, userName) {
    const cache = {
      userName: productDevelopmentCleanText(userName || '', 80),
      fetchedAt: Date.now(),
      rows: (Array.isArray(rows) ? rows : []).map(normalizeProductDevelopmentCachedTask).filter(Boolean).slice(0, 20),
    };
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TASK_CACHE_KEY, cache);
    return cache;
  }

  function productDevelopmentReadonlyDetailCopy(detail) {
    if (!detail || typeof detail !== 'object') return null;
    try {
      return JSON.parse(JSON.stringify(detail));
    } catch (error) {
      return null;
    }
  }

  function productDevelopmentReadonlyDetailForCache(detail) {
    const copy = productDevelopmentReadonlyDetailCopy(detail);
    if (!copy) return null;
    ['requiredFields', 'baseFields', 'priceFields', 'productFields', 'attachments'].forEach((key) => {
      if (!Array.isArray(copy[key])) return;
      copy[key] = copy[key].map((field) => {
        if (!field || typeof field !== 'object') return field;
        const next = { ...field };
        delete next.attr;
        return next;
      });
    });
    delete copy.cacheSource;
    copy.cachedAt = Date.now();
    return copy;
  }

  function loadProductDevelopmentReadonlyDetailCache() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_DETAIL_CACHE_KEY, null);
    const source = value && typeof value === 'object' && value.entries && typeof value.entries === 'object'
      ? value.entries
      : {};
    const version = Number(value && value.version) || 0;
    const entries = Object.create(null);
    Object.keys(source).forEach((key) => {
      const sku = String(key || '').trim().toUpperCase();
      const raw = source[key];
      const detail = raw && typeof raw === 'object' && raw.detail && typeof raw.detail === 'object' ? raw.detail : raw;
      if (!sku || !detail || typeof detail !== 'object' || detail.error) return;
      entries[sku] = {
        detail,
        cachedAt: Number(raw && raw.cachedAt) || Number(detail.cachedAt) || 0,
        version: Number(raw && raw.version) || version,
      };
    });
    return entries;
  }

  function getProductDevelopmentReadonlyDetailCacheEntry(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return null;
    const entries = loadProductDevelopmentReadonlyDetailCache();
    const entry = entries[normalizedSku];
    const detail = entry && entry.detail ? productDevelopmentReadonlyDetailCopy(entry.detail) : null;
    if (!detail) return null;
    detail.cacheSource = 'local-cache';
    return {
      detail,
      cachedAt: Number(entry.cachedAt) || Number(detail.cachedAt) || 0,
      version: Number(entry.version) || 0,
    };
  }

  function getProductDevelopmentReadonlyDetailCache(sku) {
    const entry = getProductDevelopmentReadonlyDetailCacheEntry(sku);
    return entry ? entry.detail : null;
  }

  function saveProductDevelopmentReadonlyDetailCache(sku, detail) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const cachedDetail = productDevelopmentReadonlyDetailForCache(detail);
    if (!normalizedSku || !cachedDetail || cachedDetail.error) return;
    const cachedAt = Date.now();
    cachedDetail.cachedAt = cachedAt;
    const entries = loadProductDevelopmentReadonlyDetailCache();
    entries[normalizedSku] = { detail: cachedDetail, cachedAt, version: PRODUCT_DEVELOPMENT_DETAIL_CACHE_VERSION };
    const storedEntries = {};
    Object.entries(entries)
      .sort((a, b) => Number(b[1] && b[1].cachedAt) - Number(a[1] && a[1].cachedAt))
      .slice(0, PRODUCT_DEVELOPMENT_DETAIL_CACHE_LIMIT)
      .forEach(([key, value]) => { storedEntries[key] = value; });
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_DETAIL_CACHE_KEY, { version: PRODUCT_DEVELOPMENT_DETAIL_CACHE_VERSION, entries: storedEntries });
  }

  function scheduleProductDevelopmentReadonlyDetailCache(sku, detail) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || !detail) return;
    if (productDevelopmentDetailCacheWriteTimers[normalizedSku]) window.clearTimeout(productDevelopmentDetailCacheWriteTimers[normalizedSku]);
    productDevelopmentDetailCacheWriteTimers[normalizedSku] = window.setTimeout(() => {
      delete productDevelopmentDetailCacheWriteTimers[normalizedSku];
      saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    }, 250);
  }

  function clearProductDevelopmentReadonlyDetailCacheWriteTimer(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || !productDevelopmentDetailCacheWriteTimers[normalizedSku]) return;
    window.clearTimeout(productDevelopmentDetailCacheWriteTimers[normalizedSku]);
    delete productDevelopmentDetailCacheWriteTimers[normalizedSku];
  }

  function productDevelopmentTaskUserKey(value) {
    return productDevelopmentCleanText(value, 80).replace(/[\s\u3000]+/g, '').toLowerCase();
  }

  function getProductDevelopmentTaskUserName() {
    const cached = loadProductDevelopmentTaskCache();
    const candidates = [
      typeof findCurrentPlmUserName === 'function' ? findCurrentPlmUserName() : '',
      state && state.productDevelopmentTaskUserName,
      cached.userName,
    ];
    return candidates.map((value) => productDevelopmentCleanText(value, 80)).find(Boolean) || '';
  }

  function productDevelopmentNormalizeTaskRow(item) {
    if (!item || typeof item !== 'object') return null;
    const sku = String(item.product_code || item.productCode || item.sku || item.sku_code || item.skuCode || '').trim().toUpperCase();
    if (!sku) return null;
    const projectId = String(item.id || item.project_id || item.chemical_id || item.project_row_id || item.projectRowId || '').trim();
    const developerName = productDevelopmentCleanText(item.dev_work_user_name || '', 80);
    const benchmarkImageUrl = typeof getApiAssetUrl === 'function'
      ? getApiAssetUrl(item.main_pic || item.mainPic || '', 0)
      : productDevelopmentReadImageValue(item.main_pic || item.mainPic);
    const productListImageUrl = typeof getApiAssetUrl === 'function'
      ? getApiAssetUrl(item.pic || item.product_pic || item.product_image || '', 0)
      : productDevelopmentReadImageValue(item.pic || item.product_pic || item.product_image);
    const cleanCell = (value) => typeof cleanProjectListCell === 'function'
      ? cleanProjectListCell(value)
      : productDevelopmentCleanText(value, 240);
    const brandParts = productDevelopmentBrandAndCategory(item.brand_name || item.product_brand_name || '');
    const categorySource = cleanCell(item.category_name || item.project_series_name) || brandParts.category;
    return {
      sku,
      rowId: projectId,
      projectId,
      projectCode: productDevelopmentCleanText(item.code, 80),
      productId: String(item.product_id || '').trim(),
      productMainId: String(item.product_main_id || item.productMainId || item.product_version_id || item.productVersionId || '').trim(),
      productVersionId: String(item.product_version_id || item.productVersionId || item.product_main_id || item.productMainId || '').trim(),
      developerName,
      developerUsername: productDevelopmentCleanText(item.dev_work_user_username || item.dev_work_user_userName || '', 80),
      developerText: [developerName, productDevelopmentCleanText(item.dev_work_user_jobtitlename || '', 80)].filter(Boolean).join(' '),
      brand: brandParts.brand,
      name: typeof normalizeProductNameValue === 'function'
        ? normalizeProductNameValue(item.product_name || item.dev_product_name || '')
        : productDevelopmentCleanText(item.product_name || item.dev_product_name || '', 240),
      benchmarkImageUrl,
      referenceUrl: productDevelopmentCleanText(item.main_url || item.reference_url || item.referenceUrl || '', 1200),
      developmentAdvice: cleanCell(item.dev_proposals || item.remark),
      artPriority: cleanCell(item.priority_label),
      projectStatus: cleanCell(item.status_format || item.status),
      designType: cleanCell(item.design_type_label),
      productListImageUrl,
      developmentAssignedAt: productDevelopmentCleanText(item.dev_assign_at || item.devAssignAt || '', 80),
      projectCreatedAt: productDevelopmentCleanText(item.create_at || item.audit_at || '', 80),
      departmentName: cleanCell(item.dev_work_user_department_name),
      projectOwnerName: cleanCell(item.dev_work_user_name),
      promotionStatus: cleanCell(item.promote_status_format),
      listingStatus: cleanCell(item.sale_status_format),
      bomStatus: cleanCell(item.bom_status_format),
      requiresPlanStock: item.is_plan_stock === true || item.is_plan_stock === 1 ? '是' : (item.is_plan_stock === false || item.is_plan_stock === 0 ? '否' : cleanCell(item.is_plan_stock)),
      plmCategory: productDevelopmentNormalizeCategoryPathValue(categorySource),
      categoryId: String(item.category_id || '').trim(),
      productType: cleanCell(item.product_type_format || item.product_type),
      productTypeValue: item.product_type,
      reworkProductCode: productDevelopmentCleanText(item.rework_product_code || item.reworkProductCode || item.return_product_code || item.returnProductCode || '', 120),
    };
  }

  function productDevelopmentTaskTime(value) {
    const raw = String(value || '').trim();
    if (typeof parseSkuListTime === 'function') return parseSkuListTime(raw);
    const parsed = Date.parse(raw.replace(/-/g, '/'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async function fetchProductDevelopmentTaskRows() {
    const currentUserName = getProductDevelopmentTaskUserName();
    if (!currentUserName) throw new Error('暂时无法识别当前 PLM 用户姓名，请确认页面右上角已登录');
    state.productDevelopmentTaskUserName = currentUserName;
    const rows = [];
    let total = 0;
    for (let page = 1; page <= PRODUCT_DEVELOPMENT_TASK_MAX_PAGES; page += 1) {
      const payload = await fetchPlmJson(PRODUCT_DEVELOPMENT_TASK_ENDPOINT + '?page=' + page + '&pageSize=' + PRODUCT_DEVELOPMENT_TASK_PAGE_SIZE);
      if (payload && payload.success === false) {
        throw new Error(formatPlmApiMessage(payload.msg) || formatPlmApiMessage(payload.message) || '开发任务 API 返回失败');
      }
      const pageRows = typeof getApiListItems === 'function' ? getApiListItems(payload) : [];
      total = typeof getApiListTotal === 'function' ? getApiListTotal(payload) || total : total;
      rows.push(...pageRows);
      if (!pageRows.length || (total && rows.length >= total) || (!total && pageRows.length < PRODUCT_DEVELOPMENT_TASK_PAGE_SIZE)) break;
    }
    const currentUserKey = productDevelopmentTaskUserKey(currentUserName);
    const deduped = new Map();
    rows.forEach((item) => {
      const row = productDevelopmentNormalizeTaskRow(item);
      if (!row || !row.developerName || productDevelopmentTaskUserKey(row.developerName) !== currentUserKey) return;
      const previous = deduped.get(row.sku);
      if (!previous || productDevelopmentTaskTime(row.developmentAssignedAt || row.projectCreatedAt) >= productDevelopmentTaskTime(previous.developmentAssignedAt || previous.projectCreatedAt)) deduped.set(row.sku, row);
    });
    return Array.from(deduped.values()).sort((a, b) => productDevelopmentTaskTime(b.developmentAssignedAt || b.projectCreatedAt) - productDevelopmentTaskTime(a.developmentAssignedAt || a.projectCreatedAt));
  }

  function getProductDevelopmentTaskBySku(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    return (Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks : []).find((item) => item && item.sku === normalizedSku) || null;
  }

  function productDevelopmentTaskImageUrl(task, data) {
    const row = task || {};
    const source = data || {};
    return row.productListImageUrl || row.benchmarkImageUrl || source.productListImageUrl || source.benchmarkImageUrl || getSkuListImageUrl(source) || '';
  }

  function productDevelopmentTaskSeedData(task) {
    const row = task || {};
    const sku = String(row.sku || '').trim().toUpperCase();
    const detail = state.productDevelopmentTaskDetailData && state.productDevelopmentTaskDetailData[sku]
      ? state.productDevelopmentTaskDetailData[sku]
      : {};
    const cached = state && state.data && String(state.data.sku || '').trim().toUpperCase() === sku ? state.data : loadData(sku);
    return normalizeData({
      ...(cached || {}),
      ...detail,
      sku,
      brand: row.brand || detail.brand || cached && cached.brand || '',
      name: row.name || detail.name || cached && cached.name || '',
      projectRowId: row.projectId || detail.projectRowId || cached && cached.projectRowId || '',
      projectId: row.projectId || detail.projectId || cached && cached.projectId || '',
      projectCode: row.projectCode || detail.projectCode || '',
      productId: row.productId || detail.productId || cached && cached.productId || '',
      productMainId: row.productMainId || detail.productMainId || cached && cached.productMainId || '',
      productVersionId: row.productVersionId || detail.productVersionId || cached && cached.productVersionId || '',
      developerName: row.developerName || detail.developerName || '',
      developerText: row.developerText || detail.developerText || '',
      benchmarkImageUrl: row.benchmarkImageUrl || detail.benchmarkImageUrl || cached && cached.benchmarkImageUrl || '',
      benchmarkImageFallbackUrl: row.benchmarkImageUrl || detail.benchmarkImageFallbackUrl || cached && cached.benchmarkImageFallbackUrl || '',
      referenceUrl: row.referenceUrl || detail.referenceUrl || cached && cached.referenceUrl || '',
      developmentAdvice: row.developmentAdvice || detail.developmentAdvice || '',
      artPriority: row.artPriority || detail.artPriority || '',
      projectStatus: row.projectStatus || detail.projectStatus || '',
      designType: row.designType || detail.designType || '',
      departmentName: row.departmentName || detail.departmentName || '',
      projectOwnerName: row.projectOwnerName || detail.projectOwnerName || '',
      promotionStatus: row.promotionStatus || detail.promotionStatus || '',
      listingStatus: row.listingStatus || detail.listingStatus || '',
      bomStatus: row.bomStatus || detail.bomStatus || '',
      requiresPlanStock: row.requiresPlanStock || detail.requiresPlanStock || '',
      plmCategory: row.plmCategory || detail.plmCategory || '',
      categoryId: row.categoryId || detail.categoryId || '',
      productType: row.productType || detail.productType || '',
      productTypeValue: row.productTypeValue || detail.productTypeValue || '',
      ingredientEvidence: row.ingredientEvidence || detail.ingredientEvidence || cached && cached.ingredientEvidence || '',
      attributeEvidence: row.attributeEvidence || detail.attributeEvidence || cached && cached.attributeEvidence || '',
      claimEvidence: row.claimEvidence || detail.claimEvidence || cached && cached.claimEvidence || '',
      sourceEvidence: row.sourceEvidence || detail.sourceEvidence || cached && cached.sourceEvidence || '',
      origin: row.origin || detail.origin || cached && cached.origin || '',
      countryOfOrigin: row.countryOfOrigin || detail.countryOfOrigin || cached && cached.countryOfOrigin || '',
      madeIn: row.madeIn || detail.madeIn || cached && cached.madeIn || '',
    });
  }

  function productDevelopmentReadonlyDetailForTask(task) {
    const sku = String(task && task.sku || '').trim().toUpperCase();
    if (!sku) return null;
    const inMemory = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    if (inMemory && typeof inMemory === 'object' && !inMemory.error) return inMemory;
    return getProductDevelopmentReadonlyDetailCache(sku);
  }

  function productDevelopmentPreserveLocalBomState(target, previous) {
    if (!target || !previous || typeof previous !== 'object') return target;
    if (previous.materialDrafts) target.materialDrafts = previous.materialDrafts;
    ['bomDraftDirty', 'bomDraftSavedAt', 'bomDraftSaveState', 'bomDraftSaveMessage', 'bomPlmSaveState', 'bomPlmSaveMessage'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(previous, key)) target[key] = previous[key];
    });
    return target;
  }

  function productDevelopmentPreserveLocalProductState(target, previous) {
    if (!target || !previous || typeof previous !== 'object') return target;
    if (previous.productDetailLocalValues && typeof previous.productDetailLocalValues === 'object') {
      target.productDetailLocalValues = productDevelopmentCloneValue(previous.productDetailLocalValues);
    }
    if (previous.productDetailLocalNames && typeof previous.productDetailLocalNames === 'object') {
      target.productDetailLocalNames = productDevelopmentCloneValue(previous.productDetailLocalNames);
    }
    if (previous.productDetailLocalPage1 && typeof previous.productDetailLocalPage1 === 'object') {
      target.productDetailLocalPage1 = productDevelopmentCloneValue(previous.productDetailLocalPage1);
    }
    if (previous.productDetailLocalProcurement && typeof previous.productDetailLocalProcurement === 'object') {
      target.productDetailLocalProcurement = productDevelopmentCloneValue(previous.productDetailLocalProcurement);
    }
    if (previous.productDevelopmentReworkLookup && typeof previous.productDevelopmentReworkLookup === 'object') {
      target.productDevelopmentReworkLookup = productDevelopmentCloneValue(previous.productDevelopmentReworkLookup);
    }
    [
      'productDetailDraftDirty',
      'productDetailSavedAt',
      'productDetailProcurementPriceSource',
      'productDetailSaveState',
      'productDetailSaveMessage',
      'productDetailPlmSaveState',
      'productDetailPlmSaveMessage',
    ].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(previous, key)) target[key] = previous[key];
    });
    productDevelopmentApplyProductDetailLocalValues(target);
    const localNames = target.productDetailLocalNames || {};
    ['productNameCn', 'productNameEn'].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(localNames, key)) return;
      target[key] = localNames[key];
      const field = Array.isArray(target.baseFields) && target.baseFields.find((item) => item && item.key === key);
      if (field) {
        field.value = localNames[key];
        field.displayValue = localNames[key];
        field.status = localNames[key] ? '已填写（本地）' : '待补充';
        field.source = localNames[key] ? '本地人工填写（未写入）' : '待人工补充';
      }
    });
    return target;
  }

  function productDevelopmentApplyReadonlyDetailState(task, readOnlyDetail, next) {
    const sku = String(task && task.sku || '').trim().toUpperCase();
    if (!sku || !readOnlyDetail) return next || null;
    if (!state.productDevelopmentTaskDetailData || typeof state.productDevelopmentTaskDetailData !== 'object') state.productDevelopmentTaskDetailData = Object.create(null);
    if (!state.productDevelopmentTaskFormData || typeof state.productDevelopmentTaskFormData !== 'object') state.productDevelopmentTaskFormData = Object.create(null);
    if (next) state.productDevelopmentTaskDetailData[sku] = next;
    state.productDevelopmentTaskFormData[sku] = readOnlyDetail;
    productDevelopmentRecordMaterialsFromBom(sku, readOnlyDetail.bomRows);
    if (state.productDevelopmentTaskSelectedSku === sku && state.selectedSku === sku) {
      if (next) state.data = next;
      state.selectedSku = sku;
    }
    return next || state.productDevelopmentTaskDetailData[sku] || null;
  }

  async function hydrateProductDevelopmentTaskDetail(task, options) {
    if (!task || !task.sku) return null;
    const opts = options || {};
    const sku = task.sku;
    const previousDetail = productDevelopmentReadonlyDetailForTask(task);
    const cacheEntry = getProductDevelopmentReadonlyDetailCacheEntry(sku);
    const inMemoryDetail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    const cachedDetail = inMemoryDetail && typeof inMemoryDetail === 'object' && !inMemoryDetail.error
      ? inMemoryDetail
      : cacheEntry && cacheEntry.detail;
    if (typeof isWestmonthLoginPage === 'function' && isWestmonthLoginPage()) {
      if (!cachedDetail) return null;
      const current = state.productDevelopmentTaskDetailData && state.productDevelopmentTaskDetailData[sku];
      const next = current || normalizeData({ ...productDevelopmentTaskSeedData(task), sku });
      return productDevelopmentApplyReadonlyDetailState(task, cachedDetail, next);
    }
    const cacheAge = cacheEntry && cacheEntry.cachedAt ? Date.now() - cacheEntry.cachedAt : Infinity;
    const hasFreshDetailCache = Boolean(
      cachedDetail &&
      cacheEntry &&
      cacheEntry.version === PRODUCT_DEVELOPMENT_DETAIL_CACHE_VERSION &&
      cacheAge >= 0 &&
      cacheAge < PRODUCT_DEVELOPMENT_DETAIL_SYNC_COOLDOWN_MS,
    );
    if (!opts.force) {
      if (hasFreshDetailCache) {
        const current = state.productDevelopmentTaskDetailData && state.productDevelopmentTaskDetailData[sku];
        const next = current || normalizeData({ ...productDevelopmentTaskSeedData(task), sku });
        return productDevelopmentApplyReadonlyDetailState(task, cachedDetail, next);
      }
    } else {
      clearProductDevelopmentReadonlyDetailCacheWriteTimer(sku);
    }
    const seed = productDevelopmentTaskSeedData(task);
    const [project, product] = await Promise.all([
      typeof fetchApiProjectSnapshot === 'function' ? fetchApiProjectSnapshot(seed, { force: true }).catch(() => null) : Promise.resolve(null),
      typeof fetchApiProductSnapshot === 'function' ? fetchApiProductSnapshot(seed, { force: true }).catch(() => null) : Promise.resolve(null),
    ]);
    const readOnlyDetail = await fetchProductDevelopmentReadonlyDetail(task, product).catch((error) => ({
      sku,
      projectId: String(task.projectId || task.rowId || '').trim(),
      error: formatErrorMessage(error),
      readonly: true,
      loadedAt: new Date().toLocaleString(),
      requiredFields: [],
      priceFields: [],
      attachments: [],
      bomRows: [],
      bomReadState: 'error',
      materialDrafts: previousDetail && previousDetail.materialDrafts || null,
    }));
    const next = normalizeData({
      ...seed,
      ...(project || {}),
      ...(product || {}),
      ...productDevelopmentTaskSeedData(task),
      sku,
    });
    if (readOnlyDetail && !readOnlyDetail.error) {
      productDevelopmentPreserveLocalBomState(readOnlyDetail, previousDetail);
      productDevelopmentPreserveLocalProductState(readOnlyDetail, previousDetail);
      readOnlyDetail.cacheSource = 'plm';
      saveProductDevelopmentReadonlyDetailCache(sku, readOnlyDetail);
    }
    productDevelopmentApplyReadonlyDetailState(task, readOnlyDetail, next);
    return next;
  }

  function selectProductDevelopmentTask(sku, options) {
    const task = getProductDevelopmentTaskBySku(sku);
    if (!task) return null;
    const opts = options || {};
    const normalizedSku = task.sku;
    const previousSku = String(state.productDevelopmentTaskSelectedSku || '').trim().toUpperCase();
    const preserveSession = Boolean(opts.preserveSession && previousSku === normalizedSku);
    if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
    state.productDevelopmentSelectedTask = task;
    state.productDevelopmentTaskSelectedSku = normalizedSku;
    state.selectedSku = normalizedSku;
    state.data = productDevelopmentTaskSeedData(task);
    if (!preserveSession) {
      state.productDevelopmentSnapshot = null;
      state.productDevelopmentBenchmarkImageDataUrl = '';
      state.productDevelopmentBenchmarkImageName = '';
      state.productDevelopmentReview = null;
      state.productDevelopmentReviewEditorOpen = false;
      state.productDevelopmentCopywriting = null;
      state.productDevelopmentTaskView = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
      state.productDevelopmentTaskPreviousTab = '';
      state.productDevelopmentError = '';
    }
    const cachedDetail = productDevelopmentReadonlyDetailForTask(task);
    if (cachedDetail) {
      if (!state.productDevelopmentTaskFormData || typeof state.productDevelopmentTaskFormData !== 'object') state.productDevelopmentTaskFormData = Object.create(null);
      state.productDevelopmentTaskFormData[normalizedSku] = cachedDetail;
    }
    restoreProductDevelopmentReviewDraft(normalizedSku);
    const renderTaskSelection = () => {
      const taskPanel = ensurePanel();
      const listEl = taskPanel && taskPanel.querySelector('.pfh-list');
      if (state.view !== 'productDevelopmentTasks' || !listEl) return false;
      const nextSku = String(state.productDevelopmentTaskSelectedSku || '').trim().toUpperCase();
      listEl.querySelectorAll('.pfh-sku-waterfall-card[data-sku], .pfh-sku[data-sku]').forEach((card) => {
        card.classList.toggle('is-active', card.getAttribute('data-sku') === nextSku);
      });
      const currentTask = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku) || state.productDevelopmentSelectedTask;
      if (!currentTask) return false;
      state.data = productDevelopmentTaskSeedData(currentTask);
      renderProductDevelopmentTaskDetail(taskPanel, '', currentTask);
      setupProductDevelopmentTaskTabs(taskPanel);
      return true;
    };
    if (!(opts.render === false)) { if (!renderTaskSelection()) renderShell(); }
    if (!(opts.hydrate === false)) {
      hydrateProductDevelopmentTaskDetail(task).then(() => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === normalizedSku) { if (!renderTaskSelection()) renderShell(); }
      }).catch((error) => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === normalizedSku) {
          state.productDevelopmentError = formatErrorMessage(error);
          if (!renderTaskSelection()) renderShell();
        }
      });
    }
    return task;
  }

  function productDevelopmentTaskListHtml(imageSignature) {
    const query = state.searchQuery.trim();
    const searchTokens = parseSearchTokens(query);
    const filters = state.skuFilters;
    const activeFilterCount = Object.values(filters).filter(Boolean).length;
    const allTasks = Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks : [];
    const filteredTasks = allTasks.filter((item) => {
      if (!matchesSearchItem(item, searchTokens)) return false;
      if (!activeFilterCount) return true;
      const facet = getSkuSearchFacet(item);
      return (!filters.developer || facet.developer === filters.developer)
        && (!filters.brand || facet.brand === filters.brand)
        && (!filters.status || facet.status === filters.status)
        && (!filters.designType || facet.designType === filters.designType)
        && (!filters.imageColor || getSkuImageColor(item) === filters.imageColor);
    });
    const tasks = sortSkuListItems(filteredTasks);
    const listMode = getSkuListMode();
    const pageSize = listMode === 'waterfall' ? 20 : 10;
    const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
    state.productDevelopmentTaskPage = Math.max(1, Math.min(totalPages, Number(state.productDevelopmentTaskPage) || 1));
    const page = state.productDevelopmentTaskPage;
    const items = tasks.slice((page - 1) * pageSize, page * pageSize);
    const listSort = getSkuListSort();
    const listSortLabel = listSort === 'acquired' ? '获取时间' : '分配时间';
    const listSortMenu = '<div class="pfh-export-menu pfh-sku-sort-menu' + (state.skuSortMenuOpen ? ' is-open' : '') + '">' +
      '<button type="button" class="pfh-export-menu-button" data-action="sku-sort-toggle" aria-expanded="' + (state.skuSortMenuOpen ? 'true' : 'false') + '"><span>' + escapeHtml(listSortLabel) + '</span><i></i></button>' +
      '<div class="pfh-export-menu-list"><button type="button" data-action="sku-list-sort" data-sort="assigned" class="' + (listSort === 'assigned' ? 'is-active' : '') + '">分配时间</button><button type="button" data-action="sku-list-sort" data-sort="acquired" class="' + (listSort === 'acquired' ? 'is-active' : '') + '">获取时间</button></div></div>';
    const listTools = '<div class="pfh-sku-list-toolbar"><div class="pfh-sku-view-switch" data-active-mode="' + listMode + '" role="group" aria-label="SKU列表视图"><span class="pfh-sku-view-indicator" aria-hidden="true"></span>' +
      '<button type="button" data-action="sku-list-mode" data-mode="list" class="' + (listMode === 'list' ? 'is-active' : '') + '">列表</button><button type="button" data-action="sku-list-mode" data-mode="waterfall" class="' + (listMode === 'waterfall' ? 'is-active' : '') + '">瀑布流</button></div>' +
      '<label class="pfh-sku-sort"><span>排序</span>' + listSortMenu + '</label></div>';
    const filterTools = '<div class="pfh-sku-filter-toolbar"><button type="button" data-action="sku-filter-toggle" aria-haspopup="dialog" aria-expanded="' + String(state.skuFilterOpen) + '" class="' + (activeFilterCount ? 'is-active' : '') + '">筛选' + (activeFilterCount ? ' · ' + activeFilterCount : '') + '</button><span>' + (activeFilterCount ? '已按条件筛选' : '开发人员、品牌、状态、设计类型、效果图主色') + '</span><button type="button" data-action="product-development-tasks-refresh" title="刷新本人开发任务"' + (state.productDevelopmentTasksLoading ? ' disabled' : '') + '>' + (state.productDevelopmentTasksLoading ? '刷新中…' : '刷新任务') + '</button></div>';
    const listHead = '<div class="pfh-list-head"><button type="button" class="pfh-upload-back" data-action="product-development-tasks-home" aria-label="返回开发主页">' + iconHtml('backArrow') + '</button><strong>开发 SKU</strong><span>共 ' + tasks.length + ' 条</span><button type="button" class="pfh-sku-add-button" data-action="product-development-tasks-refresh" title="刷新本人开发任务" aria-label="刷新本人开发任务"' + (state.productDevelopmentTasksLoading ? ' disabled aria-busy="true"' : '') + '>' + iconHtml('refresh') + '</button></div>' + listTools + filterTools;
    if (state.productDevelopmentTasksLoading && !tasks.length) return listHead + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll"><div class="pfh-empty">正在读取本人开发任务…</div></div></div>';
    if (state.productDevelopmentTaskError && !tasks.length) return listHead + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll"><div class="pfh-empty">' + escapeHtml(state.productDevelopmentTaskError) + '</div></div></div>';
    if (!items.length) return listHead + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll">' + (searchTokens.length || activeFilterCount ? '<div class="pfh-empty">没有符合搜索或筛选条件的产品</div>' : taskEmptyStateHtml('暂无产品开发任务', '当前用户没有开发人员字段匹配的产品任务')) + '</div></div>';
    const cards = items.map((item) => {
      const data = productDevelopmentTaskSeedData(item);
      const image = productDevelopmentTaskImageUrl(item, data);
      return skuListCardHtml(item, listMode, state.productDevelopmentTaskSelectedSku, {
        imageSignature,
        action: 'product-development-task-select',
        data,
        image,
        productName: item.name || data.name || '未命名产品',
      });
    }).join('');
    const pager = '<div class="pfh-list-pager"><div><button type="button" data-action="product-development-task-page" data-page="prev"' + (page <= 1 ? ' disabled' : '') + '>‹</button>' + renderCompactPager('product-development-task-page-goto', page, totalPages) + '<button type="button" data-action="product-development-task-page" data-page="next"' + (page >= totalPages ? ' disabled' : '') + '>›</button></div></div>';
    const scrollContext = ['product-development-tasks', listMode, listSort, page, query, ...Object.values(filters)].join('|');
    return listHead + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll' + (listMode === 'waterfall' ? ' is-waterfall' : '') + '" data-scroll-context="' + escapeHtml(scrollContext) + '">' + (listMode === 'waterfall' ? '<div class="pfh-sku-waterfall-grid">' + cards + '</div>' : cards) + '</div>' + pager + '</div>';
  }

  function productDevelopmentReadonlyPayloadData(payload) {
    if (typeof getApiPayloadDataObject === 'function') return getApiPayloadDataObject(payload);
    return payload && payload.data !== undefined ? payload.data : payload || {};
  }

  function productDevelopmentReadonlyList(payload) {
    if (typeof getApiListItems === 'function') {
      try {
        const items = getApiListItems(payload);
        if (Array.isArray(items) && items.length) return items;
      } catch (error) {
        // Fall through to the product-development response shapes below.
      }
    }
    const collectionKeys = [
      'list', 'rows', 'items', 'records', 'materials', 'material_list',
      'project_pm_join_list', 'projectPMJoinList', 'project_material_list',
      'projectMaterialList', 'bom', 'bomRows', 'data',
    ];
    const findCollection = (value, depth) => {
      if (Array.isArray(value)) return value;
      if (!value || typeof value !== 'object' || depth > 4) return [];
      for (const key of collectionKeys) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
        const result = findCollection(value[key], depth + 1);
        if (result.length || Array.isArray(value[key])) return result;
      }
      return [];
    };
    return findCollection(payload, 0);
  }

  function productDevelopmentReadonlyAttrGroups(payload) {
    const root = payload && payload.data !== undefined ? payload.data : payload;
    if (Array.isArray(root)) return root;
    if (root && Array.isArray(root.category_template_attr_groups)) return root.category_template_attr_groups;
    if (root && Array.isArray(root.categoryTemplateAttrGroups)) return root.categoryTemplateAttrGroups;
    if (root && Array.isArray(root.data)) return root.data;
    return [];
  }

  function productDevelopmentReadonlyAttrs(payload) {
    return productDevelopmentReadonlyAttrGroups(payload).flatMap((group) => Array.isArray(group && group.category_template_attrs)
      ? group.category_template_attrs.map((attr) => ({ ...attr, groupName: ((group.attr_group_language_config_json || [])[0] || {}).attr_group_name || '' }))
      : Array.isArray(group && group.categoryTemplateAttrs)
        ? group.categoryTemplateAttrs.map((attr) => ({ ...attr, groupName: ((group.attrGroupLanguageConfigJson || [])[0] || {}).attrGroupName || '' }))
        : []);
  }

  function productDevelopmentReadonlyAttrValue(attr, languageId) {
    const id = Number(languageId || 1);
    const configs = Array.isArray(attr && attr.attr_language_config_json) ? attr.attr_language_config_json : [];
    const config = configs.find((item) => Number(item && item.language_id) === id) || configs[0];
    if (config && config.value !== undefined) return config.value;
    if (attr && attr.value !== undefined) return attr.value;
    if (attr && attr.attr_value !== undefined) return attr.attr_value;
    return '';
  }

  function productDevelopmentSnapshotOuterDimensions(contentPayload) {
    const attrs = productDevelopmentReadonlyAttrs(contentPayload || {});
    if (!attrs.length) return null;
    const keys = ['long_outer_packaging', 'wide_outer_packaging', 'high_outer_packaging'];
    const values = [133, 134, 135].map((attrId, index) => {
      const attr = attrs.find((item) => Number(item && item.attr_id) === Number(attrId)
        || String(item && item.variable_name || '') === keys[index]);
      if (!attr) return null;
      const raw = productDevelopmentReadonlyAttrValue(attr, 1);
      const num = Number(String(raw === null || raw === undefined ? '' : raw).trim().replace(/[^\d.]/g, ''));
      return Number.isFinite(num) && num > 0 ? num : null;
    });
    return values.every((value) => value !== null) ? values : null;
  }

  function productDevelopmentResolvePackagingKind(snapshot) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : null;
    const draft = state.productDevelopmentOneShotInput || {};
    const sku = String(source && source.sku || '').trim().toUpperCase();
    if (sku && String(draft.sku || '').trim().toUpperCase() === sku && ['boxed', 'bagged'].includes(draft.packagingKind)) return Promise.resolve(draft.packagingKind);
    if (source && (source.packagingKind === 'boxed' || source.packagingKind === 'bagged')) return Promise.resolve(source.packagingKind);
    const dims = source && Array.isArray(source.outerDimensions) && source.outerDimensions.length === 3
      && source.outerDimensions.every((value) => Number(value) > 0);
    if (dims) return Promise.resolve('boxed');
    // 外包装长宽高缺失时，回退用已缓存的纸盒三维尺寸判断：有纸盒尺寸 → 盒装。
    const detail = (state.productDevelopmentTaskDetailData && state.productDevelopmentTaskDetailData[sku])
      || (state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku])
      || null;
    const paperBoxDimensions = detail ? productDevelopmentReworkLookupPaperBoxDimensions(detail) : null;
    if (paperBoxDimensions && paperBoxDimensions.every((value) => Number(value) > 0)) {
      productDevelopmentLog('info', 'PLM 外包装长宽高缺失，按纸盒三维尺寸判定为盒装', sku);
      return Promise.resolve('boxed');
    }
    return Promise.reject(new Error('无法自动判断包装形式，请在生成设置中选择盒装或袋装'));
  }

  function productDevelopmentCloneValue(value) {
    if (value === undefined) return undefined;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return value;
    }
  }

  function productDevelopmentProductAttrValuesFromAttrs(attrs) {
    const values = [];
    (Array.isArray(attrs) ? attrs : []).forEach((attr) => {
      const attrId = Number(attr && attr.attr_id);
      if (!Number.isFinite(attrId) || attrId <= 0) return;
      const configs = Array.isArray(attr && attr.attr_language_config_json) ? attr.attr_language_config_json : [];
      if (configs.length) {
        configs.forEach((config) => {
          const languageId = Number(config && config.language_id || 1);
          values.push({
            attr_id: attrId,
            language_id: Number.isFinite(languageId) && languageId > 0 ? languageId : 1,
            value: productDevelopmentCloneValue(config && config.value !== undefined ? config.value : null),
          });
        });
        return;
      }
      values.push({
        attr_id: attrId,
        language_id: 1,
        value: productDevelopmentCloneValue(attr && attr.value !== undefined ? attr.value : attr && attr.attr_value !== undefined ? attr.attr_value : null),
      });
    });
    return values;
  }

  function productDevelopmentProductAttrValueEntry(detail, attrId, languageId) {
    const targetId = Number(attrId);
    const targetLanguageId = Number(languageId || 1);
    if (!detail || !Array.isArray(detail.productAttrValues) || !Number.isFinite(targetId)) return null;
    return detail.productAttrValues.find((item) => Number(item && item.attr_id) === targetId
      && Number(item && item.language_id || 1) === targetLanguageId) || null;
  }

  function productDevelopmentSetProductAttrValue(detail, attrId, languageId, value) {
    const targetId = Number(attrId);
    const targetLanguageId = Number(languageId || 1);
    if (!detail || !Number.isFinite(targetId) || targetId <= 0) return false;
    if (!Array.isArray(detail.productAttrValues)) detail.productAttrValues = [];
    const entry = productDevelopmentProductAttrValueEntry(detail, targetId, targetLanguageId);
    if (entry) {
      entry.value = productDevelopmentCloneValue(value);
      return true;
    }
    detail.productAttrValues.push({
      attr_id: targetId,
      language_id: Number.isFinite(targetLanguageId) && targetLanguageId > 0 ? targetLanguageId : 1,
      value: productDevelopmentCloneValue(value),
    });
    return true;
  }

  function productDevelopmentProductFieldCollections(detail) {
    if (!detail || typeof detail !== 'object') return [];
    return [detail.productFields, detail.priceFields, detail.requiredFields]
      .filter((fields) => Array.isArray(fields))
      .flat();
  }
