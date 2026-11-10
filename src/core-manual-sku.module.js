
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function parseSearchTokens(query) {
    const source = String(query || '');
    const skuTokens = source.match(/SKU\d+/ig) || [];
    if (skuTokens.length > 1) {
      return Array.from(new Set(skuTokens.map((token) => token.toLowerCase())));
    }
    return Array.from(new Set(source.split(/[\s,，;；、|/\\]+/).map((token) => token.trim().toLowerCase()).filter(Boolean)));
  }

  function normalizeSearchInput(value) {
    return String(value || '').replace(/[\r\n,，;；、|/\\]+/g, ' ').replace(/\s+/g, ' ').trimStart();
  }

  function extractManualSkuCodes(value) {
    return Array.from(new Set((String(value || '').match(/\bSKU\d+\b/ig) || [])
      .map((sku) => String(sku || '').trim().toUpperCase())
      .filter((sku) => /^SKU\d+$/.test(sku))));
  }

  async function fetchManualSkuProjectImage(sku, data) {
    const current = normalizeData({ ...(data || {}), sku });
    const project = await fetchApiProjectSnapshot(current, { force: true });
    const projectId = String(project && project.projectId || '').trim() || getProjectIdForMaterialApi(current);
    if (!projectId || !/^\d+$/.test(projectId)) return { project, projectId: '', imageUrl: '' };
    const effectPayload = await fetchPlmJson('/api/ChemicalNew/GetProjectEffectPicture?id=' + encodeURIComponent(projectId));
    const imageUrl = getMagicToyLabelEffectPicturePaths(effectPayload).map(getMagicToyLabelImageUrl).find(Boolean) || '';
    return { project, projectId, imageUrl };
  }

  function buildManualSkuData(sku, existing, snapshot, isNew) {
    const current = normalizeData({ ...(existing || {}), sku });
    const metrics = snapshot && snapshot.contentPayload ? extractApiProductMetrics(snapshot.contentPayload) : {};
    const optional = snapshot && snapshot.optional || {};
    const nowMs = Date.now();
    const nowText = new Date(nowMs).toLocaleString();
    const imageUrl = String(snapshot && snapshot.productListImageUrl || '').trim();
    const infringementImageUrls = snapshot && Array.isArray(snapshot.infringementImageUrls) && snapshot.infringementImageUrls.length
      ? snapshot.infringementImageUrls
      : current.infringementImageUrls;
    return normalizeData({
      ...current,
      sku,
      brand: snapshot && snapshot.brand || current.brand || '',
      name: snapshot && snapshot.chineseName || current.name || '',
      englishName: snapshot && snapshot.englishName || current.englishName || '',
      productType: snapshot && snapshot.productType || current.productType || '',
      plmCategory: snapshot && snapshot.plmCategory || current.plmCategory || '',
      categoryId: snapshot && snapshot.categoryId || current.categoryId || '',
      productId: snapshot && snapshot.productId || current.productId || '',
      productVersionId: snapshot && snapshot.productVersionId || current.productVersionId || '',
      packageNums: snapshot && (snapshot.outerPackageNums || snapshot.packageNums) || current.packageNums || null,
      outerPackageNums: snapshot && (snapshot.outerPackageNums || snapshot.packageNums) || current.outerPackageNums || null,
      innerPackageNums: snapshot && snapshot.innerPackageNums || current.innerPackageNums || null,
      productNums: snapshot && snapshot.productNums || current.productNums || null,
      productSizeText: snapshot && snapshot.productSizeText || current.productSizeText || '',
      packageSizeText: snapshot && snapshot.outerPackageSizeText || current.packageSizeText || '',
      referenceUrl: snapshot && snapshot.referenceUrl || current.referenceUrl || '',
      packQty: snapshot && snapshot.packQty || current.packQty || '',
      purchasePrice: snapshot && snapshot.purchasePrice || current.purchasePrice || '',
      netContent: metrics.netContent || current.netContent || '',
      grossWeight: metrics.grossWeight || current.grossWeight || '',
      cartonSpec: optional.cartonSpec || current.cartonSpec || '',
      packageMaterial: optional.packageMaterial || current.packageMaterial || '',
      leadTimeText: optional.leadTimeText || current.leadTimeText || '',
      alibabaLink: optional.alibabaLink || current.alibabaLink || '',
      productListImageUrl: imageUrl || current.productListImageUrl || '',
      productListImageFallbackUrl: imageUrl || current.productListImageFallbackUrl || '',
      designAssignedAt: current.designAssignedAt || (isNew ? nowText : ''),
      infringementImageUrls: infringementImageUrls || [],
      infringementImageUrl: snapshot && snapshot.infringementImageUrl || current.infringementImageUrl || '',
      infringementImageSource: snapshot && snapshot.infringementImageSource || current.infringementImageSource || '',
      infringementCopywriting: snapshot && snapshot.infringementCopywriting || current.infringementCopywriting || '',
      apiFieldStates: mergeApiFieldStates(current.apiFieldStates, snapshot && snapshot.apiFieldStates, metrics.apiFieldStates),
      acquiredAt: current.acquiredAt || nowText,
      acquiredAtMs: current.acquiredAtMs || nowMs,
      skuListSource: current.skuListSource || (isNew ? 'manual-code' : ''),
      manualSkuAddedAt: current.manualSkuAddedAt || (isNew ? nowText : ''),
      manualSkuAddedAtMs: current.manualSkuAddedAtMs || (isNew ? nowMs : 0),
      updatedAt: nowText,
      updatedAtMs: nowMs,
    });
  }

  async function addSkuByCode(value, options) {
    const opts = options || {};
    const sku = String(value || '').trim().toUpperCase();
    if (!/^SKU\d+$/.test(sku)) return { sku: '', added: false, enriched: false, error: '请输入有效的 SKU 编码' };
    const cached = loadData(sku);
    const indexed = state.index.find((item) => item && String(item.sku || '').toUpperCase() === sku) || null;
    const existing = cached || indexed;
    const isNew = !indexed;
    let snapshot = null;
    let apiError = '';
    if (!cached || opts.force) {
      try {
        snapshot = await fetchApiProductSnapshot({ sku }, { force: Boolean(opts.force) });
        if (!snapshot || !snapshot.found) apiError = String(snapshot && snapshot.reason || 'PLM 未返回商品信息');
      } catch (error) {
        apiError = formatErrorMessage(error);
        addLog('warn', '手动添加 SKU 的产品信息读取失败', sku + ' | ' + apiError);
      }
    }
    if (!isNew && cached && !snapshot) return { sku, data: normalizeData(cached), added: false, enriched: false, error: '' };
    let data = buildManualSkuData(sku, existing, snapshot, isNew);
    let projectImage = null;
    try {
      projectImage = await fetchManualSkuProjectImage(sku, data);
    } catch (error) {
      addLog('info', '手动添加 SKU 的项目效果图读取失败，继续使用商品图', sku + ' | ' + formatErrorMessage(error));
    }
    const productImageUrl = String(data.productListImageUrl || data.productListImageFallbackUrl || '').trim();
    const existingEffectImageUrl = data.skuImageSource === 'effectImage'
      ? String(data.skuImageUrl || data.skuImageFallbackUrl || '').trim()
      : '';
    const effectImageUrl = String(projectImage && projectImage.imageUrl || '').trim() || existingEffectImageUrl;
    const resolvedImageUrl = effectImageUrl || productImageUrl || String(data.skuImageUrl || data.skuImageFallbackUrl || '').trim();
    const project = projectImage && projectImage.project;
    data = normalizeData({
      ...data,
      projectRowId: String(projectImage && projectImage.projectId || data.projectRowId || ''),
      projectId: String(projectImage && projectImage.projectId || data.projectId || ''),
      brand: data.brand || project && project.brand || '',
      name: data.name || project && project.name || '',
      referenceUrl: project && project.referenceUrl || data.referenceUrl || '',
      infringementImageUrls: project && Array.isArray(project.infringementImageUrls) && project.infringementImageUrls.length
        ? project.infringementImageUrls
        : data.infringementImageUrls,
      infringementImageUrl: project && project.infringementImageUrl || data.infringementImageUrl || '',
      infringementImageSource: project && project.infringementImageSource || data.infringementImageSource || '',
      infringementCopywriting: project && project.infringementCopywriting || data.infringementCopywriting || '',
      skuImageUrl: resolvedImageUrl,
      skuImageFallbackUrl: resolvedImageUrl,
      skuImageSource: effectImageUrl ? 'effectImage' : (productImageUrl ? 'productListImage' : data.skuImageSource || ''),
      manualSkuImageCheckedAtMs: Date.now(),
      manualSkuImageRefreshVersion: SCRIPT_VERSION,
    });
    saveData(sku, data, { changeSource: isNew ? '手动添加编码' : '手动补充编码信息' });
    upsertDailyLedgerFromData(data, {
      date: getTodayKey(),
      status: '待定稿',
      stage: '待定稿',
      note: isNew ? '手动添加自动加入今日工作台' : undefined,
    });
    if (state.view === 'ledger' && !opts.background && !renderLedgerTabContent(ensurePanel())) renderShell();
    addLog(isNew ? 'success' : 'info', isNew ? '已手动添加 SKU' : '已补充 SKU 信息', sku + (snapshot && snapshot.found ? ' | 已读取产品信息' : ' | ' + apiError));
    return { sku, data, added: isNew, enriched: Boolean(snapshot && snapshot.found), effectImageFound: Boolean(effectImageUrl), error: apiError };
  }

  function scheduleMissingManualSkuImageRefresh(delayMs) {
    window.setTimeout(() => {
      if (manualSkuAddWorkerPromise) {
        scheduleMissingManualSkuImageRefresh(1500);
        return;
      }
      if (manualSkuImageRefreshPromise) return;
      manualSkuImageRefreshPromise = refreshMissingManualSkuImages().catch((error) => {
        addLog('warn', '手动 SKU 图片后台补全失败', formatErrorMessage(error));
        return 0;
      }).finally(() => {
        manualSkuImageRefreshPromise = null;
      });
    }, Math.max(0, Number(delayMs) || 0));
  }

  async function refreshMissingManualSkuImages() {
    syncDailyLedgerBeforeMutation();
    const currentMonth = getMonthKeyFromDateKey(getTodayKey());
    const candidates = Array.from(new Set((state.ledgerRecords || []).filter((record) => {
      if (!record || getMonthKeyFromDateKey(record.date) !== currentMonth || isLedgerFinalizedRecord(record)) return false;
      const sku = String(record.sku || '').trim().toUpperCase();
      if (!sku) return false;
      const cached = normalizeData(loadData(sku) || state.index.find((item) => item && String(item.sku || '').toUpperCase() === sku) || { sku });
      const isManual = cached.skuListSource === 'manual-code' || Boolean(cached.manualSkuAddedAt || cached.manualSkuAddedAtMs);
      if (!isManual) return false;
      const hasProjectId = /^\d+$/.test(getProjectIdForMaterialApi(cached));
      const hasEffectImage = cached.skuImageSource === 'effectImage' && Boolean(String(cached.skuImageUrl || cached.skuImageFallbackUrl || '').trim());
      return (!hasProjectId || !hasEffectImage) && cached.manualSkuImageRefreshVersion !== SCRIPT_VERSION;
    }).map((record) => String(record.sku || '').trim().toUpperCase()).filter(Boolean))).slice(0, 80);
    if (!candidates.length) return 0;
    let updatedCount = 0;
    for (const sku of candidates) {
      try {
        const result = await addSkuByCode(sku, { force: true, background: true });
        if (result && result.data && String(result.data.skuImageUrl || result.data.skuImageFallbackUrl || '').trim()) updatedCount += 1;
      } catch (error) {
        addLog('info', '手动 SKU 图片后台补全跳过', sku + ' | ' + formatErrorMessage(error));
      }
      await wait(450);
    }
    if (updatedCount && state.view === 'ledger' && !renderLedgerTabContent(ensurePanel())) renderShell();
    addLog('info', '手动 SKU 图片后台补全完成', '检查 ' + candidates.length + ' 个，更新 ' + updatedCount + ' 个');
    return updatedCount;
  }

  function getManualSkuAddQueueStats(queue) {
    const items = Array.isArray(queue) ? queue : [];
    return {
      total: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      processing: items.filter((item) => item.status === 'processing').length,
      success: items.filter((item) => item.status === 'success').length,
      partial: items.filter((item) => item.status === 'partial').length,
      skipped: items.filter((item) => item.status === 'skipped').length,
      error: items.filter((item) => item.status === 'error').length,
    };
  }

  function getManualSkuAddStatusText(status) {
    const labels = {
      pending: '等待中',
      processing: '读取中',
      success: '已完成',
      partial: '已加入·资料不全',
      skipped: '已存在',
      error: '失败',
    };
    return labels[status] || labels.pending;
  }

  function manualSkuAddModalHtml() {
    if (!state.manualSkuAddOpen) return '';
    const queue = Array.isArray(state.manualSkuAddQueue) ? state.manualSkuAddQueue : [];
    const stats = getManualSkuAddQueueStats(queue);
    const running = Boolean(state.manualSkuAddWorkerRunning);
    const retryCount = stats.partial + stats.error;
    const rows = queue.length
      ? queue.map((entry) => {
        const status = String(entry.status || 'pending');
        const detail = [entry.step, entry.error].filter(Boolean).join(' · ') || '等待后台读取产品信息';
        return '<div class="pfh-manual-sku-add-row is-' + escapeHtml(status) + '"><b>' + escapeHtml(entry.sku) + '</b><small title="' + escapeHtml(detail) + '">' + escapeHtml(detail) + '</small><span class="pfh-manual-sku-add-status is-' + escapeHtml(status) + '">' + escapeHtml(getManualSkuAddStatusText(status)) + '</span></div>';
      }).join('')
      : '<div class="pfh-manual-sku-add-empty">还没有手动添加任务。可以一次粘贴多个 SKU，队列会逐个读取。</div>';
    const progress = state.manualSkuAddStatus
      || (running ? '后台正在按顺序读取产品信息' : '关闭弹窗不会停止后台队列');
    const hasPending = stats.pending > 0;
    const canSubmit = Boolean(String(state.manualSkuAddInput || '').trim());
    return '<div class="pfh-manual-sku-add-layer" data-action="sku-manual-add-close"><section class="pfh-manual-sku-add-dialog" role="dialog" aria-modal="true" aria-label="手动添加 SKU" data-manual-sku-add-dialog="true">' +
      '<header><div><h3>手动添加 SKU</h3><p>不经过搜索，逐个从 PLM 产品接口读取并加入 SKU 列表。</p></div><button type="button" data-action="sku-manual-add-close" aria-label="关闭">×</button></header>' +
      '<div class="pfh-manual-sku-add-body"><textarea class="pfh-manual-sku-add-input" placeholder="粘贴多个 SKU，例如：SKU00046398\nSKU00046397\nSKU00046396">' + escapeHtml(state.manualSkuAddInput || '') + '</textarea><p class="pfh-manual-sku-add-hint">支持换行、空格、逗号分隔；每次只处理 1 个 SKU，间隔约 1.1 秒，避免连续读取触发限制。</p>' +
      '<div class="pfh-manual-sku-add-summary"><strong>添加队列</strong><span>共 ' + stats.total + '</span><span>等待 ' + stats.pending + '</span><span>读取中 ' + stats.processing + '</span><span>完成 ' + (stats.success + stats.skipped) + '</span><span>待重试 ' + retryCount + '</span></div>' +
      '<div class="pfh-manual-sku-add-queue">' + rows + '</div><div class="pfh-mini-tool-actions"><button type="button" class="is-primary" data-action="sku-manual-add-submit"' + (canSubmit ? '' : ' disabled') + '>加入后台队列</button></div></div>' +
      '<footer><span title="' + escapeHtml(progress) + '">' + escapeHtml(progress) + (state.manualSkuAddCurrentSku ? '：' + escapeHtml(state.manualSkuAddCurrentSku) : '') + '</span><div>' +
      (running ? '<button type="button" data-action="sku-manual-add-pause">暂停队列</button>' : '<button type="button" data-action="sku-manual-add-start"' + (hasPending ? '' : ' disabled') + '>继续队列</button>') +
      '<button type="button" data-action="sku-manual-add-retry-errors"' + (retryCount ? '' : ' disabled') + '>重试失败</button><button type="button" data-action="sku-manual-add-clear-done"' + ((stats.success + stats.skipped) ? '' : ' disabled') + '>清除已完成</button><button type="button" data-action="sku-manual-add-close">关闭</button></div></footer></section></div>';
  }

  function renderManualSkuAddModal(panel) {
    const root = panel || ensurePanel();
    const existing = root && root.querySelector('.pfh-manual-sku-add-layer');
    if (!state.manualSkuAddOpen) {
      if (existing) existing.remove();
      return;
    }
    const active = existing && document.activeElement && existing.contains(document.activeElement)
      ? document.activeElement
      : null;
    const activeInput = active && active.classList.contains('pfh-manual-sku-add-input');
    const selectionStart = activeInput ? active.selectionStart : null;
    const selectionEnd = activeInput ? active.selectionEnd : null;
    const queueScrollTop = existing && existing.querySelector('.pfh-manual-sku-add-queue')
      ? existing.querySelector('.pfh-manual-sku-add-queue').scrollTop
      : 0;
    if (existing) existing.outerHTML = manualSkuAddModalHtml();
    else root.insertAdjacentHTML('beforeend', manualSkuAddModalHtml());
    const next = root.querySelector('.pfh-manual-sku-add-layer');
    const queue = next && next.querySelector('.pfh-manual-sku-add-queue');
    if (queue) queue.scrollTop = queueScrollTop;
    const input = next && next.querySelector('.pfh-manual-sku-add-input');
    if (activeInput && input) {
      input.focus();
      try { input.setSelectionRange(selectionStart, selectionEnd); } catch (_) { /* ignore selection restore */ }
    }
  }

  function openManualSkuAddModal() {
    state.manualSkuAddOpen = true;
    state.manualSkuAddQueue = loadManualSkuAddQueue();
    expandPanel();
    const panel = ensurePanel();
    renderManualSkuAddModal(panel);
    window.setTimeout(() => {
      const input = panel.querySelector('.pfh-manual-sku-add-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  function closeManualSkuAddModal() {
    state.manualSkuAddOpen = false;
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('.pfh-manual-sku-add-layer');
    if (layer) layer.remove();
  }

  function refreshManualSkuAddUi() {
    state.manualSkuAddQueue = loadManualSkuAddQueue();
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const list = panel.querySelector('.pfh-list');
    if (list && state.view !== 'home' && state.view !== 'about' && state.view !== 'ledger' && state.view !== 'upload' && state.view !== 'magicUpload' && state.view !== 'tools' && state.view !== 'batchExcel' && state.view !== 'feedback') {
      const scroll = list.querySelector('.pfh-sku-scroll');
      const scrollTop = scroll ? scroll.scrollTop : 0;
      renderSkuList(panel);
      const nextScroll = list.querySelector('.pfh-sku-scroll');
      if (nextScroll) nextScroll.scrollTop = scrollTop;
    }
    if (state.manualSkuAddOpen) renderManualSkuAddModal(panel);
  }

  function addManualSkuQueueItems(value) {
    const skus = extractManualSkuCodes(value);
    if (!skus.length) {
      showToast('没有找到有效 SKU，请检查编码格式');
      return;
    }
    const queue = loadManualSkuAddQueue();
    const next = queue.slice();
    let addedCount = 0;
    let refreshCount = 0;
    skus.slice(0, MANUAL_SKU_ADD_MAX_ITEMS).forEach((sku) => {
      const existingIndex = next.findIndex((entry) => entry.sku === sku);
      const previous = existingIndex >= 0 ? next[existingIndex] : null;
      const inCatalog = isSkuInCatalog(sku);
      const item = {
        ...(previous || {}),
        sku,
        status: 'pending',
        step: inCatalog ? '等待刷新产品信息和效果图' : '等待后台读取产品信息和效果图',
        error: '',
        updatedAt: Date.now(),
      };
      if (inCatalog) refreshCount += 1;
      else addedCount += existingIndex >= 0 ? 0 : 1;
      if (existingIndex >= 0) next[existingIndex] = item;
      else next.push(item);
    });
    state.manualSkuAddInput = '';
    state.manualSkuAddStatus = '已加入 ' + skus.slice(0, MANUAL_SKU_ADD_MAX_ITEMS).length + ' 个 SKU，等待后台逐个读取产品信息和效果图';
    saveManualSkuAddQueue(next);
    refreshManualSkuAddUi();
    showToast(refreshCount && !addedCount ? '已加入刷新队列：' + refreshCount + ' 个 SKU' : state.manualSkuAddStatus);
    startManualSkuAddQueue();
  }

  function updateManualSkuAddQueueEntry(sku, patch) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const queue = loadManualSkuAddQueue();
    const next = queue.map((entry) => entry.sku === normalizedSku
      ? { ...entry, ...(patch || {}), updatedAt: Date.now() }
      : entry);
    saveManualSkuAddQueue(next);
    refreshManualSkuAddUi();
    return next.find((entry) => entry.sku === normalizedSku) || null;
  }

  function retryManualSkuAddErrors() {
    const queue = loadManualSkuAddQueue();
    const retryable = queue.filter((entry) => entry.status === 'error' || entry.status === 'partial');
    if (!retryable.length) {
      showToast('当前没有需要重试的任务');
      return;
    }
    saveManualSkuAddQueue(queue.map((entry) => retryable.some((item) => item.sku === entry.sku)
      ? { ...entry, status: 'pending', step: '等待重试', error: '' }
      : entry));
    state.manualSkuAddStatus = '已将 ' + retryable.length + ' 个失败任务放回队列';
    refreshManualSkuAddUi();
    startManualSkuAddQueue();
  }

  function clearManualSkuAddCompleted() {
    const queue = loadManualSkuAddQueue();
    const next = queue.filter((entry) => entry.status !== 'success' && entry.status !== 'skipped');
    saveManualSkuAddQueue(next);
    state.manualSkuAddStatus = '已清除完成任务';
    refreshManualSkuAddUi();
  }

  function pauseManualSkuAddQueue() {
    if (!state.manualSkuAddWorkerRunning) return;
    state.manualSkuAddWorkerRunning = false;
    state.manualSkuAddCurrentSku = '';
    const queue = loadManualSkuAddQueue().map((entry) => entry.status === 'processing'
      ? { ...entry, status: 'pending', step: '已暂停，等待继续', error: '' }
      : entry);
    saveManualSkuAddQueue(queue);
    state.manualSkuAddStatus = '队列已暂停，已完成的任务不会回滚';
    refreshManualSkuAddUi();
  }

  function startManualSkuAddQueue() {
    if (manualSkuAddWorkerPromise) return manualSkuAddWorkerPromise;
    const pending = loadManualSkuAddQueue().filter((entry) => entry.status === 'pending');
    if (!pending.length) {
      if (state.manualSkuAddOpen && !state.manualSkuAddStatus) {
        state.manualSkuAddStatus = '当前没有等待处理的任务';
        refreshManualSkuAddUi();
      }
      return Promise.resolve(false);
    }
    state.manualSkuAddWorkerRunning = true;
    state.manualSkuAddStatus = '开始按顺序读取 ' + pending.length + ' 个 SKU';
    refreshManualSkuAddUi();
    manualSkuAddWorkerPromise = processManualSkuAddQueue().catch((error) => {
      state.manualSkuAddStatus = '队列异常：' + formatErrorMessage(error);
      addLog('error', '手动添加 SKU 队列异常', formatErrorMessage(error));
      return false;
    }).finally(() => {
      state.manualSkuAddWorkerRunning = false;
      state.manualSkuAddCurrentSku = '';
      if (!state.manualSkuAddStatus || /^开始按顺序|^正在读取/.test(state.manualSkuAddStatus)) state.manualSkuAddStatus = '手动添加队列已完成';
      manualSkuAddWorkerPromise = null;
      refreshManualSkuAddUi();
    });
    return manualSkuAddWorkerPromise;
  }

  async function processManualSkuAddQueue() {
    while (state.manualSkuAddWorkerRunning) {
      const entry = loadManualSkuAddQueue().find((item) => item.status === 'pending');
      if (!entry) break;
      const sku = entry.sku;
      state.manualSkuAddCurrentSku = sku;
      state.manualSkuAddStatus = '正在读取 ' + sku + ' 的产品信息和效果图';
      updateManualSkuAddQueueEntry(sku, { status: 'processing', step: '正在读取 PLM 产品和项目效果图', error: '' });
      try {
        const result = await addSkuByCode(sku, { force: true });
        if (!isSkuInCatalog(sku)) throw new Error('SKU 未能写入本地列表');
        updateManualSkuAddQueueEntry(sku, {
          status: result && result.enriched ? 'success' : 'partial',
          step: result && result.enriched
            ? (result.effectImageFound ? '产品信息和效果图已更新，并同步今日工作台' : '产品信息已更新，未找到效果图，已使用商品图')
            : '已加入列表和今日工作台，但产品 API 未返回完整信息',
          error: result && result.error || '',
        });
      } catch (error) {
        updateManualSkuAddQueueEntry(sku, { status: 'error', step: '读取或写入失败', error: formatErrorMessage(error) });
        addLog('warn', '手动添加 SKU 失败', sku + ' | ' + formatErrorMessage(error));
      }
      if (state.manualSkuAddWorkerRunning) await wait(MANUAL_SKU_ADD_DELAY_MS);
    }
  }
