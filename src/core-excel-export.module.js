
  function resetExcelState() {
    state.exportMenuOpen = false;
    state.excelPanelOpen = false;
    state.excelExtra = null;
    state.excelMissing = [];
    state.excelStatus = '';
    state.excelPackQty = '';
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    state.excelPurchasePrice = String(data && data.purchasePrice || '6');
  }

  function syncExcelInputs() {
    const panel = ensurePanel();
    const pack = panel.querySelector('.pfh-excel-pack');
    const price = panel.querySelector('.pfh-excel-price');
    if (pack) state.excelPackQty = pack.value;
    if (price) state.excelPurchasePrice = price.value;
  }

  function buildCachedExcelExtraData(data) {
    const cached = normalizeData(data || {});
    const imageInfo = getCachedSkuImageInfo(cached.sku);
    return {
      englishName: cleanEnglishProductName(cached.englishName, cached.brand),
      chineseName: cached.name || '',
      ingredients: getPreferredExcelIngredients(cached),
      ingredientEnglish: cached.ingredientEnglish || cached.copywritingIngredientEnglish || '',
      ingredientChinese: cached.ingredientChinese || cached.copywritingIngredientChinese || '',
      benchmarkLink: cached.benchmarkLink || cached.referenceUrl || '',
      imageUrl: imageInfo.imageUrl || '',
      imageFallbackUrl: imageInfo.imageFallbackUrl || '',
      skuImageUrl: imageInfo.skuImageUrl || '',
      skuImageFallbackUrl: imageInfo.skuImageFallbackUrl || '',
      skuImageSource: imageInfo.skuImageSource || '',
      isSkuDesignImage: Boolean(imageInfo.isSkuDesignImage),
      apiResolved: false,
      apiFieldStates: {},
      liveData: null,
    };
  }

  function formatExcelMissingStatus(missing) {
    const fields = Array.isArray(missing) ? missing.filter(Boolean) : [];
    return fields.length ? L.excelIncomplete + '：缺少' + fields.join('、') + '；可直接缺项导出' : L.excelReady;
  }

  function formatExcelCacheDiagnostic(data, extra, missing) {
    const available = [];
    if (extra.englishName) available.push('英文产品名');
    if (extra.ingredients) available.push('成分');
    if (extra.isSkuDesignImage && (extra.imageUrl || extra.imageFallbackUrl)) available.push('产品图');
    if (extra.benchmarkLink) available.push('对标链接');
    if (data.productLength && data.productWidth && data.productHeight) available.push('产品尺寸');
    if (data.packageLength && data.packageWidth && data.packageHeight) available.push('包装尺寸');
    if (data.netContent) available.push('净含量');
    if (data.grossWeight) available.push('毛重');
    return '缓存已有：' + (available.join('、') || '无') + ' | 缓存缺少：' + ((missing || []).join('、') || '无');
  }

  async function prepareExcelInfo() {
    syncExcelInputs();
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    state.view = 'detail';
    state.selectedSku = data.sku;
    state.data = data;
    if (data.purchasePrice) state.excelPurchasePrice = String(data.purchasePrice);
    state.excelPanelOpen = true;
    const cachedExtra = buildCachedExcelExtraData(data);
    const cachedMissing = getExcelMissingFields(data, cachedExtra);
    state.excelExtra = { extra: cachedExtra, excelData: data };
    state.excelMissing = cachedMissing;
    state.excelStatus = cachedMissing.length ? L.excelPreparing + '（缺少：' + cachedMissing.join('、') + '；可直接缺项导出）' : L.excelReady + '（使用缓存）';
    addLog(cachedMissing.length ? 'info' : 'success', 'Excel 缓存预检', data.sku + ' | ' + formatExcelCacheDiagnostic(data, cachedExtra, cachedMissing));
    renderShell();
    if (!cachedMissing.length) {
      await fillRecommendedPackQty(data);
      await fillRecommendedPurchasePrice(data, cachedExtra);
      renderShell();
      return true;
    }
    try {
      addLog('info', 'Excel 开始补全实时数据', data.sku + ' | 需要补全：' + cachedMissing.join('、'));
      let extra = await collectExcelExtraData(data.sku);
      let excelData = normalizeData(mergeData(data, extra.liveData || {}));
      let remaining = getExcelMissingFields(excelData, extra);
      if (getExcelDrawerFallbackMissingFields(excelData, extra).length) {
        if (!(await ensureProjectDrawerForData(excelData))) throw new Error('未能打开目标项目详情抽屉');
        extra = await collectExcelExtraData(data.sku);
        excelData = normalizeData(mergeData(excelData, extra.liveData || {}));
        remaining = getExcelMissingFields(excelData, extra);
      }
      cacheProductThumb(excelData, extra);
      state.excelExtra = { extra, excelData };
      state.excelMissing = remaining;
      state.excelStatus = formatExcelMissingStatus(state.excelMissing);
      addLog(state.excelMissing.length ? 'warn' : 'success', 'Excel 信息补全结果', data.sku + ' | ' + formatExcelCacheDiagnostic(excelData, extra, state.excelMissing));
      await fillRecommendedPackQty(excelData);
      await fillRecommendedPurchasePrice(excelData, extra);
      if (state.excelMissing.length) showExcelMissingToast();
      return true;
    } catch (error) {
      console.warn('PLM floating helper excel prepare failed:', error);
      state.excelExtra = { extra: cachedExtra, excelData: data };
      state.excelMissing = cachedMissing;
      state.excelStatus = formatExcelMissingStatus(cachedMissing);
      addLog('error', '\u83b7\u53d6\u8868\u683c\u4fe1\u606f\u5931\u8d25', data.sku + ' | ' + formatExcelCacheDiagnostic(data, cachedExtra, cachedMissing) + ' | 错误：' + formatErrorMessage(error));
      recordDataQuality(data, 'excelPrepareFailed');
      showExcelMissingToast();
      return true;
    } finally {
      renderShell();
    }
  }

  function cacheProductThumb(data, extra) {
    const sku = data && data.sku;
    const src = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (!sku || !src) return;
    const thumbData = normalizeData({
      ...data,
      skuImageUrl: extra.skuImageUrl || extra.imageUrl || '',
      skuImageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extra.skuImageUrl || extra.imageUrl || '',
      skuImageSource: extra.skuImageSource || data.skuImageSource || 'effectImage',
    });
    saveDataDirect(sku, thumbData);
    if ((state.data && state.data.sku === sku) || (!state.data && state.selectedSku === sku)) state.data = thumbData;
    upsertIndex(thumbData);
  }

  function getExcelMissingFields(data, extra) {
    const missing = [];
    if (!extra.englishName) missing.push('\u82f1\u6587\u4ea7\u54c1\u540d');
    if (!extra.ingredients) missing.push('\u6210\u5206');
    if (!extra.isSkuDesignImage || (!extra.imageUrl && !extra.imageFallbackUrl)) missing.push('\u4ea7\u54c1\u56fe');
    if (!extra.benchmarkLink) missing.push('\u5bf9\u6807\u94fe\u63a5');
    if (!shouldOmitToyProductSize(data) && (!data.productLength || !data.productWidth || !data.productHeight)) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.singleBottle && (!data.packageLength || !data.packageWidth || !data.packageHeight)) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    return missing;
  }

  function getExcelDrawerFallbackMissingFields(data, extra) {
    const missing = getExcelMissingFields(data, extra || {});
    if (!extra || !extra.apiResolved) return missing;
    const stateKeys = {
      '\u82f1\u6587\u4ea7\u54c1\u540d': 'englishName',
      '\u5bf9\u6807\u94fe\u63a5': 'benchmarkLink',
      '\u4ea7\u54c1\u5c3a\u5bf8': 'productSize',
      '\u5305\u88c5\u5c3a\u5bf8': 'packageSize',
      '\u51c0\u542b\u91cf': 'netContent',
      '\u6bdb\u91cd': 'grossWeight',
    };
    const states = mergeApiFieldStates(extra.apiFieldStates, data && data.apiFieldStates);
    return missing.filter((label) => {
      const key = stateKeys[label];
      return !key || (states[key] !== 'value' && states[key] !== 'empty');
    });
  }

  function extractExcelBatchSkus(value) {
    const matches = String(value || '').match(/\bSKU\d{8}\b/gi) || [];
    const seen = new Set();
    return matches.map((item) => String(item).toUpperCase()).filter((sku) => {
      if (seen.has(sku)) return false;
      seen.add(sku);
      return true;
    });
  }

  function getExcelBatchCacheSnapshot(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const indexed = state.index.find((item) => String(item && item.sku || '').toUpperCase() === normalizedSku);
    const data = normalizeData(loadData(normalizedSku) || indexed || { sku: normalizedSku });
    const extra = buildCachedExcelExtraData(data);
    const missing = getExcelMissingFields(data, extra);
    const packQty = normalizePackQty(getLocalPackQty(data));
    if (!packQty) missing.push('\u88c5\u7bb1\u6570');
    return {
      data,
      extra,
      missing: Array.from(new Set(missing)),
      packQty,
      purchasePrice: String(data.purchasePrice || '6'),
    };
  }

  function addExcelBatchQueueItems(value) {
    const skus = extractExcelBatchSkus(value);
    if (!skus.length) {
      showToast('\u6ca1\u6709\u627e\u5230\u6709\u6548 SKU\uff0c\u8bf7\u68c0\u67e5\u7f16\u7801\u683c\u5f0f');
      return;
    }
    const queue = loadExcelBatchQueue();
    const next = queue.slice();
    skus.forEach((sku) => {
      const snapshot = getExcelBatchCacheSnapshot(sku);
      const index = next.findIndex((entry) => entry.sku === sku);
      const previous = index >= 0 ? next[index] : {};
      const item = {
        ...previous,
        sku,
        status: 'pending',
        missing: snapshot.missing,
        packQty: snapshot.packQty,
        purchasePrice: snapshot.purchasePrice,
        error: '',
        updatedAt: Date.now(),
      };
      if (index >= 0) next[index] = item;
      else next.push(item);
    });
    state.batchExcelInput = '';
    saveExcelBatchQueue(next);
    state.batchExcelStatus = '\u5df2\u52a0\u5165 ' + skus.length + ' \u4e2a SKU\uff0c\u7b49\u5f85\u8865\u5168\u7f13\u5b58';
    renderShell();
    showToast(state.batchExcelStatus);
    startExcelBatchPreparation();
  }

  function updateExcelBatchQueueEntry(sku, patch) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const queue = loadExcelBatchQueue();
    const next = queue.map((entry) => entry.sku === normalizedSku ? { ...entry, ...(patch || {}), updatedAt: Date.now() } : entry);
    saveExcelBatchQueue(next);
    return next.find((entry) => entry.sku === normalizedSku) || null;
  }

  function removeExcelBatchQueueItem(sku) {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) {
      showToast('\u5f53\u524d\u961f\u5217\u6b63\u5728\u5904\u7406\uff0c\u8bf7\u7b49\u5f85\u5b8c\u6210');
      return;
    }
    const normalizedSku = String(sku || '').trim().toUpperCase();
    saveExcelBatchQueue(loadExcelBatchQueue().filter((entry) => entry.sku !== normalizedSku));
    renderShell();
  }

  function retryExcelBatchQueueItem(sku) {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!loadExcelBatchQueue().some((entry) => entry.sku === normalizedSku)) return;
    updateExcelBatchQueueEntry(normalizedSku, { status: 'pending', error: '' });
    renderShell();
    startExcelBatchPreparation();
  }

  function pauseExcelBatchPreparation() {
    if (!state.batchExcelWorkerRunning) {
      if (state.batchExcelWorkerPaused) {
        state.batchExcelWorkerPaused = false;
        startExcelBatchPreparation();
      }
      return;
    }
    state.batchExcelWorkerPaused = !state.batchExcelWorkerPaused;
    state.batchExcelStatus = state.batchExcelWorkerPaused
      ? '已请求暂停，当前 SKU 完成后暂停队列'
      : '已继续补全队列';
    renderShell();
  }

  function clearCompletedExcelBatchQueue() {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    saveExcelBatchQueue(loadExcelBatchQueue().filter((entry) => entry.status !== 'downloaded'));
    state.batchExcelStatus = '\u5df2\u6e05\u9664\u5df2\u4e0b\u8f7d\u9879';
    renderShell();
  }

  async function startExcelBatchPreparation() {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    const pending = loadExcelBatchQueue().filter((entry) => entry.status === 'pending' || entry.status === 'error');
    if (!pending.length) {
      state.batchExcelStatus = loadExcelBatchQueue().length ? '\u5f53\u524d\u961f\u5217\u6ca1\u6709\u9700\u8981\u8865\u5168\u7684\u9879\u76ee' : '\u961f\u5217\u6682\u7a7a';
      renderShell();
      return;
    }
    state.batchExcelWorkerRunning = true;
    state.batchExcelWorkerPaused = false;
    state.view = 'batchExcel';
    expandPanel();
    state.batchExcelStatus = '\u5f00\u59cb\u6309\u987a\u5e8f\u8865\u5168 ' + pending.length + ' \u4e2a SKU';
    renderShell();
    try {
      for (let index = 0; index < pending.length; index += 1) {
        if (state.batchExcelWorkerPaused) break;
        const item = loadExcelBatchQueue().find((entry) => entry.sku === pending[index].sku);
        if (!item || (item.status !== 'pending' && item.status !== 'error')) continue;
        const sku = item.sku;
        state.batchExcelCurrentSku = sku;
        state.batchExcelStatus = '\u6b63\u5728\u8865\u5168 ' + (index + 1) + '/' + pending.length + '\uff1a' + sku;
        updateExcelBatchQueueEntry(sku, { status: 'preparing', error: '' });
        renderShell();
        try {
          let prepared = null;
          let lastError = null;
          for (let attempt = 1; attempt <= EXCEL_BATCH_PREPARE_RETRIES; attempt += 1) {
            try {
              prepared = await prepareExcelBatchSku(sku);
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              if (error && error.name === 'AbortError') throw error;
              if (attempt >= EXCEL_BATCH_PREPARE_RETRIES) break;
              state.batchExcelStatus = sku + ' 页面仍在加载，等待重试 ' + attempt + '/' + EXCEL_BATCH_PREPARE_RETRIES;
              addLog('warn', 'Excel 批量补全等待页面加载', sku + ' | 第 ' + attempt + ' 次失败：' + formatErrorMessage(error));
              if (state.view === 'batchExcel') renderShell();
              await wait(1200 * attempt);
            }
          }
          if (!prepared) throw lastError || new Error('未取得完整页面数据');
          const patch = {
            status: prepared.missing.length ? 'partial' : 'ready',
            missing: prepared.missing,
            packQty: prepared.packQty,
            purchasePrice: prepared.purchasePrice,
            error: '',
          };
          updateExcelBatchQueueEntry(sku, patch);
          state.batchExcelStatus = prepared.missing.length
            ? sku + ' \u8fd8\u7f3a\uff1a' + prepared.missing.join('\u3001') + '\uff0c\u4ecd\u53ef\u751f\u6210 Excel'
            : sku + ' API \u5df2\u5237\u65b0\uff0c\u7b49\u5f85\u4e0b\u8f7d';
        } catch (error) {
          if (error && error.name === 'AbortError') {
            updateExcelBatchQueueEntry(sku, { status: 'pending', error: '' });
            state.batchExcelWorkerPaused = true;
            state.batchExcelStatus = '已暂停补全，当前产品保留在队列中，可点击继续';
            addLog('info', 'Excel 批量补全已暂停', sku + ' | ' + formatErrorMessage(error));
            break;
          }
          const message = formatErrorMessage(error) || '\u672a\u77e5\u9519\u8bef';
          updateExcelBatchQueueEntry(sku, { status: 'error', error: message, missing: getExcelBatchCacheSnapshot(sku).missing });
          state.batchExcelStatus = sku + ' \u8865\u5168\u5931\u8d25\uff1a' + message;
          addLog('error', 'Excel \u6279\u91cf\u8865\u5168\u5931\u8d25', sku + ' | ' + message);
        }
        if (state.view === 'batchExcel') renderShell();
        await wait(650);
      }
    } finally {
      const paused = Boolean(state.batchExcelWorkerPaused);
      state.batchExcelWorkerRunning = false;
      state.batchExcelCurrentSku = '';
      if (paused) state.batchExcelStatus = '\u8865\u5168\u5df2\u6682\u505c，可点击“继续补全”继续处理剩余项目';
      else if (!state.batchExcelStatus || /\u6b63\u5728\u8865\u5168/.test(state.batchExcelStatus)) state.batchExcelStatus = '\u8865全队列已完成';
      if (state.view === 'batchExcel') renderShell();
    }
  }

  async function prepareExcelBatchSku(sku) {
    let snapshot = getExcelBatchCacheSnapshot(sku);
    let data = snapshot.data;
    let extra = snapshot.extra;
    state.selectedSku = sku;
    state.data = data;
    resetExcelState();
    state.selectedSku = sku;
    state.data = data;
    try {
      // A batch export must refresh the API snapshot even when the local cache
      // already looks complete; otherwise stale page/manual values can reach Excel.
      extra = await collectExcelExtraData(sku, { force: true });
      data = normalizeData(mergeData(data, extra.liveData || {}));
      if (getExcelDrawerFallbackMissingFields(data, extra).length) {
        const currentDrawer = getProjectDrawer();
        const currentSku = currentDrawer ? getProjectDrawerHeaderSku(currentDrawer) : '';
        if (currentDrawer && currentSku && currentSku !== sku) await closeProjectDetailDrawerForSku(currentSku).catch(() => false);
        if (!(await ensureProjectDrawerForData(data))) throw new Error('\u672a\u80fd\u6253\u5f00 ' + sku + ' \u9879\u76ee\u8be6\u60c5\u62bd\u5c49');
        try {
          extra = await collectExcelExtraData(sku, { force: true });
        } finally {
          await closeProjectDetailDrawerForSku(sku).catch(() => false);
        }
        data = normalizeData(mergeData(data, extra.liveData || {}));
      }
      const ingredientValue = extra.ingredients || extra.ingredientChinese || extra.ingredientEnglish || data.ingredientChinese || data.ingredientEnglish || '';
      const enriched = {
        ...data,
        englishName: extra.englishName || data.englishName || '',
        name: data.name || extra.chineseName || '',
        ingredientChinese: extra.ingredientChinese || ingredientValue,
        ingredientEnglish: extra.ingredientEnglish || ingredientValue,
        copywritingIngredientChinese: extra.ingredientChinese || ingredientValue,
        copywritingIngredientEnglish: extra.ingredientEnglish || ingredientValue,
        benchmarkLink: extra.benchmarkLink || data.benchmarkLink || '',
        referenceUrl: extra.benchmarkLink || data.referenceUrl || '',
        skuImageUrl: extra.skuImageUrl || extra.imageUrl || data.skuImageUrl || '',
        skuImageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || data.skuImageFallbackUrl || '',
        skuImageSource: extra.skuImageSource || data.skuImageSource || '',
      };
      cacheProductThumb(enriched, extra);
      saveData(sku, enriched, { suppressChangeTracking: true, changeSource: '\u6279\u91cf Excel \u8865\u5168' });
      data = normalizeData(loadData(sku) || enriched);
      extra = buildCachedExcelExtraData(data);
      state.data = data;
      state.selectedSku = sku;
      state.excelPackQty = '';
      state.excelPurchasePrice = String(data.purchasePrice || '6');
      await fillRecommendedPackQty(data);
      data = normalizeData(loadData(sku) || data);
      extra = buildCachedExcelExtraData(data);
      await fillRecommendedPurchasePrice(data, extra);
      data = normalizeData(loadData(sku) || data);
      extra = buildCachedExcelExtraData(data);
      const missing = getExcelMissingFields(data, extra);
      const packQty = normalizePackQty(getLocalPackQty(data));
      if (!packQty) missing.push('\u88c5\u7bb1\u6570');
      return {
        data,
        extra,
        missing: Array.from(new Set(missing)),
        packQty,
        purchasePrice: String(state.excelPurchasePrice || data.purchasePrice || '6'),
      };
    } finally {
      await closeProjectDetailDrawerForSku(sku).catch(() => false);
    }
  }

  function getExcelBatchField(data, keys) {
    for (const key of keys || []) {
      const value = data && data[key];
      if (value !== undefined && value !== null && compactText(value)) return compactText(value);
    }
    return '';
  }

  function cloneExcelTemplateValue(value) {
    if (!value || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return { ...value };
    }
  }

  function captureExcelTemplateRow(sheet, rowNumber) {
    const row = sheet.getRow(rowNumber);
    const count = Math.max(21, Number(sheet.columnCount) || 0);
    return {
      height: row.height,
      cells: Array.from({ length: count }, (_, index) => {
        const cell = row.getCell(index + 1);
        return { value: cloneExcelTemplateValue(cell.value), style: cloneExcelTemplateValue(cell.style) };
      }),
    };
  }

  function removeUnusedExcelTemplateRow(sheet) {
    if (!sheet || Number(sheet.rowCount) < 5 || typeof sheet.spliceRows !== 'function') return;
    const row = sheet.getRow(5);
    const payloadColumns = [1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const hasPayload = payloadColumns.some((column) => {
      const value = row.getCell(column).value;
      return value !== undefined && value !== null && compactText(value);
    });
    if (!hasPayload) sheet.spliceRows(5, 1);
  }

  function applyExcelTemplateRow(sheet, rowNumber, template) {
    const row = sheet.getRow(rowNumber);
    (template && template.cells || []).forEach((source, index) => {
      const cell = row.getCell(index + 1);
      cell.value = cloneExcelTemplateValue(source.value);
      if (source.style) cell.style = cloneExcelTemplateValue(source.style);
    });
    row.height = Math.max(Number(template && template.height) || 0, 96);
  }

  function abbreviateExcelTraceName(value) {
    const name = normalizeTraceName(value);
    if (!name) return 'U';
    const cached = getTraceNameInitials(name);
    if (cached) return cached;
    if (/\p{Script=Han}/u.test(name)) return name;
    const parts = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[\p{Script=Han}]+|[A-Za-z]+/gu) || [];
    const initials = parts.map((part) => {
      return part[0];
    }).join('').toUpperCase().replace(/[^A-Z]/g, '');
    return initials || 'U';
  }

  function buildImageTraceWatermark(generatedAt) {
    const date = generatedAt instanceof Date && !Number.isNaN(generatedAt.getTime()) ? generatedAt : new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const timestamp = String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
    const actor = abbreviateExcelTraceName(currentTraceName());
    return 'PFH · ' + actor + ' · ' + timestamp + ' · v' + SCRIPT_VERSION;
  }

  function drawImageTraceWatermark(context, width, height, trace) {
    if (!context || !trace) return;
    const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.0075));
    const margin = Math.max(12, Math.round(Math.min(width, height) * 0.008));
    context.save();
    try {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 0.2;
      context.fillStyle = '#c8c8c8';
      context.font = '400 ' + fontSize + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillText(String(trace), width / 2, height - margin, width - margin * 2);
    } finally {
      context.restore();
    }
  }

  function buildExcelTraceWatermark(exportedAt) {
    const date = exportedAt instanceof Date && !Number.isNaN(exportedAt.getTime()) ? exportedAt : new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const timestamp = pad(date.getFullYear() % 100) + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes());
    const actor = abbreviateExcelTraceName(currentTraceName());
    return 'PFH\u00b7' + actor + '\u00b7' + timestamp + '\u00b7V' + String(SCRIPT_VERSION || '').replace(/\D/g, '');
  }

  function applyExcelTraceWatermark(workbook, exportedAt) {
    if (!workbook) return '';
    const date = exportedAt instanceof Date && !Number.isNaN(exportedAt.getTime()) ? exportedAt : new Date();
    const watermark = buildExcelTraceWatermark(date);
    workbook.creator = watermark;
    workbook.lastModifiedBy = watermark;
    workbook.created = date;
    workbook.modified = date;
    workbook.subject = watermark;
    workbook.keywords = watermark;
    workbook.description = watermark;
    return watermark;
  }

  function formatExcelAccessorySize(value) {
    return String(value || '').replace(/(\d+(?:\.\d+)?\s*(?:cm|mm|厘米|毫米)?)\s*[xX×＊*]\s*(?=(?:直径|长|宽|高|厚(?:度)?)?\s*\d)/gi, '$1*');
  }

  function formatExcelQuantityText(value) {
    return String(value || '').replace(/(\d+(?:\.\d+)?\s*(?:kg|mg|mcg|ug|g|ml|cl|dl|l|floz|oz|lbs?|粒|片|支|瓶|袋|盒|包|个|件|套)?)\s*[xX×＊*]\s*(?=\d)/gi, '$1x');
  }

  function buildExcelProductSizeWithAccessories(data) {
    const primarySize = formatExcelDimFromParts([data.productLength, data.productWidth, data.productHeight]) || formatExcelDim(data.productNums, []);
    const accessories = normalizeAccessories(data.accessories).filter((item) => item.sizeText);
    if (!accessories.length) return primarySize;
    return [primarySize ? (data.name || '主产品') + '：\n' + primarySize : '', ...accessories.map((item) => item.name + '：\n' + formatExcelAccessorySize(item.sizeText))].filter(Boolean).join('\n');
  }

  function buildExcelSpecificationWithAccessories(data) {
    const accessories = normalizeAccessories(data.accessories);
    const net = formatExcelQuantityText(normalizeExcelUnit(data.netContent));
    if (!accessories.length) return net;
    return [(data.brand ? data.brand + ' ' : '') + (data.name || '主产品') + (net ? '：' + net : '') + 'x1', ...accessories.map((item) => item.name + 'x' + item.quantity)].join('，\n');
  }

  function writeExcelBatchRow(sheet, rowNumber, data, extra, packQty, purchasePrice) {
    const cell = (column, value) => setCell(sheet, column + rowNumber, value);
    const productSize = buildExcelProductSizeWithAccessories(data);
    const packageSize = formatExcelDimFromParts([data.packageLength, data.packageWidth, data.packageHeight]) || formatExcelDim(data.packageNums, []);
    const cartonSpec = getExcelBatchField(data, ['cartonSpec', 'outerCartonSpec', 'cartonSize', 'cartonSizeText', 'boxSpec']);
    const material = getExcelBatchField(data, ['packageMaterial', 'packagingMaterial', 'material']);
    const dueText = getExcelBatchField(data, ['leadTimeText', 'deliveryText', 'deliveryNote', 'leadTimeNote']);
    const aliLink = getExcelBatchField(data, ['alibabaLink', 'aliLink', '1688Link', 'alibabaUrl']);
    cell('A', buildExcelKeyword(data, extra));
    cell('B', data.name || extra.chineseName || '');
    cell('C', '');
    if (cartonSpec) cell('D', cartonSpec);
    cell('E', compactText(packQty));
    cell('F', buildExcelBatchWeightFormula(rowNumber, 'N'));
    cell('G', data.sku || '');
    if (data.singleBottle) cell('H', '\u74f6\u88c5');
    else cell('H', { formula: 'IF(LEN(J' + rowNumber + ')-LEN(SUBSTITUTE(J' + rowNumber + ',"*",""))=2,"\u76d2\u88c5",IF(LEN(J' + rowNumber + ')-LEN(SUBSTITUTE(J' + rowNumber + ',"*",""))=1,"\u888b\u88c5",""))' });
    cell('I', productSize);
    cell('J', packageSize);
    if (material) cell('K', material);
    cell('L', formatIngredientsForExcel(extra.ingredients || getPreferredExcelIngredients(data)));
    cell('M', buildExcelSpecificationWithAccessories(data));
    if (normalizeAccessories(data.accessories).length) setCell(sheet, 'M3', '规格');
    cell('N', normalizeExcelUnit(data.grossWeight));
    cell('O', normalizeExcelNumberOrText(purchasePrice));
    cell('P', data.returnDate || getReturnDateText(7));
    if (dueText) cell('Q', dueText);
    if (aliLink) cell('R', aliLink);
    cell('S', extra.benchmarkLink || data.benchmarkLink || data.referenceUrl || '');
  }

  function buildExcelBatchWeightFormula(rowNumber, grossWeightColumn) {
    const grossCell = grossWeightColumn + rowNumber;
    const packCell = 'E' + rowNumber;
    return { formula: 'IF(OR(' + packCell + '="",' + grossCell + '=""),"",IFERROR(TEXT(VALUE(LEFT(' + packCell + ',LEN(' + packCell + ')-3))*(VALUE(LEFT(' + grossCell + ',LEN(' + grossCell + ')-1))/1000)+0.75,"0.00")&"kg",""))' };
  }

  function applyExcelBatchSingleColumnLayout(sheet, data) {
    if (shouldOmitToyProductSize(data)) {
      sheet.spliceColumns(9, 1);
      sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
      sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
    } else if (shouldRemoveExcelPackageSizeColumn(data)) {
      sheet.spliceColumns(10, 1);
      sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
      sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
    }
  }

  function applyExcelBatchMergedColumnLayout(sheet, items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return;
    const omitProductSize = rows.every((item) => shouldOmitToyProductSize(item.data));
    const removePackageSize = !omitProductSize && rows.every((item) => shouldRemoveExcelPackageSizeColumn(item.data));
    if (!omitProductSize && !removePackageSize) return;
    if (omitProductSize) sheet.spliceColumns(9, 1);
    else sheet.spliceColumns(10, 1);
    const lastRow = 3 + rows.length;
    for (let rowNumber = 4; rowNumber <= lastRow; rowNumber += 1) {
      sheet.getCell('H' + rowNumber).value = rows[rowNumber - 4].data.singleBottle
        ? '\u74f6\u88c5'
        : { formula: 'IF(LEN(I' + rowNumber + ')-LEN(SUBSTITUTE(I' + rowNumber + ',"*",""))=2,"\u76d2\u88c5",IF(LEN(I' + rowNumber + ')-LEN(SUBSTITUTE(I' + rowNumber + ',"*",""))=1,"\u888b\u88c5",""))' };
      sheet.getCell('F' + rowNumber).value = buildExcelBatchWeightFormula(rowNumber, 'M');
    }
    sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
  }

  async function getExcelBatchImageInfo(item) {
    const source = getExcelImageSource(item.data, item.extra);
    const target = source.imageUrl || source.imageFallbackUrl;
    const imageInfo = target ? await fetchImageForExcel(target, source.imageFallbackUrl).catch(() => null) : null;
    if (!imageInfo || !imageInfo.dataUrl) return null;
    if (await isPlaceholderSkuImage(imageInfo.dataUrl)) return null;
    return imageInfo;
  }

  async function buildExcelBatchSingleBuffer(item) {
    const Excel = await ensureExcelJsLoaded();
    const workbook = await loadCloudExcelTemplateWorkbook(Excel);
    const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    removeUnusedExcelTemplateRow(sheet);
    const imageInfo = await getExcelBatchImageInfo(item);
    writeExcelBatchRow(sheet, 4, item.data, item.extra, item.packQty, item.purchasePrice);
    applyExcelBatchSingleColumnLayout(sheet, item.data);
    if (imageInfo) {
      const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
      sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
    }
    await ensureCurrentTraceNameInitials();
    applyExcelTraceWatermark(workbook);
    return workbook.xlsx.writeBuffer();
  }

  async function buildExcelBatchMergedBuffer(items) {
    const Excel = await ensureExcelJsLoaded();
    const workbook = await loadCloudExcelTemplateWorkbook(Excel);
    const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    removeUnusedExcelTemplateRow(sheet);
    const template = captureExcelTemplateRow(sheet, 4);
    sheet.getRow(4).height = Math.max(Number(template.height) || 0, 96);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const rowNumber = index === 0 ? 4 : sheet.addRow([]).number;
      if (index > 0) applyExcelTemplateRow(sheet, rowNumber, template);
      const imageInfo = await getExcelBatchImageInfo(item);
      writeExcelBatchRow(sheet, rowNumber, item.data, item.extra, item.packQty, item.purchasePrice);
      if (imageInfo) {
        const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
        sheet.addImage(imageId, getExcelImageAnchor(imageInfo, rowNumber - 4));
      }
    }
    applyExcelBatchMergedColumnLayout(sheet, items);
    await ensureCurrentTraceNameInitials();
    applyExcelTraceWatermark(workbook);
    return workbook.xlsx.writeBuffer();
  }

  function getExcelBatchDownloadItems() {
    return loadExcelBatchQueue().map((entry) => {
      const snapshot = getExcelBatchCacheSnapshot(entry.sku);
      return {
        entry,
        data: snapshot.data,
        extra: snapshot.extra,
        missing: snapshot.missing,
        packQty: normalizePackQty(getLocalPackQty(snapshot.data)),
        purchasePrice: String(entry.purchasePrice || snapshot.purchasePrice || '6'),
      };
    }).filter((item) => item.entry.status !== 'preparing');
  }

  function buildExcelBatchFileName(items) {
    const first = items[0] || {};
    const data = first.data || {};
    const skuSummary = [data.sku, items.length > 1 ? '等' + items.length + '个SKU' : ''].filter(Boolean).join(' ');
    const parts = [data.brand, data.name || (first.extra && first.extra.chineseName), skuSummary].filter(Boolean);
    return sanitizeExcelFileName((parts.join(' ').replace(/\s+/g, ' ').trim() || 'PLM\u6279\u91cf\u4ea7\u54c1\u4fe1\u606f') + '.xlsx');
  }

  function markExcelBatchItemsDownloaded(items, fileName) {
    const skus = new Set((items || []).map((item) => item.data && item.data.sku).filter(Boolean));
    saveExcelBatchQueue(loadExcelBatchQueue().map((entry) => skus.has(entry.sku)
      ? { ...entry, status: 'downloaded', missing: [], lastFileName: fileName, downloadedAt: Date.now(), error: '' }
      : entry));
  }

  function recordExcelBatchItems(items, source, fileName) {
    (items || []).forEach((item) => {
      const data = item.data || {};
      const extra = item.extra || {};
      syncInsightEvent('excel_generated', { sku: data.sku || '', name: data.name || '', source });
      recordCommerceInsight(data, extra, { price: item.purchasePrice, packQty: item.packQty, source, fileName });
      upsertDailyLedgerFromData(data, { status: '制作中', stage: '表格/上传处理中', note: '已生成 Excel' });
    });
  }

  async function downloadExcelBatchQueue() {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    try {
      await ensureExcelJsLoaded();
    } catch (error) {
      showToast(formatErrorMessage(error) || L.excelNeedLibrary);
      return;
    }
    if (!await ensureExcelTemplateLoaded()) {
      showToast('\u6a21\u677f\u5c1a\u672a\u7f13\u5b58\uff0c\u8bf7\u8054\u7f51\u540e\u91cd\u8bd5');
      return;
    }
    const items = getExcelBatchDownloadItems();
    if (!items.length) {
      showToast('\u961f\u5217\u4e2d\u6ca1\u6709\u53ef\u751f\u6210\u7684 SKU');
      return;
    }
    state.batchExcelDownloadRunning = true;
    state.view = 'batchExcel';
    expandPanel();
    renderShell();
    try {
      if (state.batchExcelMode === 'merge') {
        const fileName = buildExcelBatchFileName(items);
        const saveTarget = await chooseExcelSaveTarget(fileName);
        if (!saveTarget) {
          state.batchExcelStatus = L.excelSaveCanceled;
          return;
        }
        state.batchExcelStatus = '\u6b63\u5728\u5408\u5e76 ' + items.length + ' \u4e2a SKU \u5e76\u63d2\u5165\u4ea7\u54c1\u56fe';
        renderShell();
        const buffer = await buildExcelBatchMergedBuffer(items);
        await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
        markExcelBatchItemsDownloaded(items, fileName);
        recordExcelBatchItems(items, 'excel-batch-merge', fileName);
        state.batchExcelStatus = '\u5408\u5e76 Excel \u5df2\u4e0b\u8f7d\uff1a' + fileName;
        showToast('\u5df2\u4e0b\u8f7d\u5408\u5e76 Excel');
      } else {
        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          const fileName = sanitizeExcelFileName(buildExcelFileName(item.data, item.extra));
          const saveTarget = await chooseExcelSaveTarget(fileName);
          if (!saveTarget) {
            state.batchExcelStatus = L.excelSaveCanceled;
            break;
          }
          state.batchExcelStatus = '\u6b63\u5728\u4e0b\u8f7d ' + (index + 1) + '/' + items.length + '\uff1a' + item.data.sku;
          renderShell();
          try {
            const buffer = await buildExcelBatchSingleBuffer(item);
            await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
            markExcelBatchItemsDownloaded([item], fileName);
            recordExcelBatchItems([item], 'excel-batch', fileName);
          } catch (error) {
            const message = formatExcelExportError(error);
            updateExcelBatchQueueEntry(item.data.sku, { status: 'error', error: message });
            state.batchExcelStatus = item.data.sku + ' \u4e0b\u8f7d\u5931\u8d25\uff1a' + message;
            addLog('error', 'Excel \u5355\u72ec\u4e0b\u8f7d\u5931\u8d25', item.data.sku + ' | ' + message);
          }
          if (state.view === 'batchExcel') renderShell();
          await wait(120);
        }
      }
    } catch (error) {
      const message = formatExcelExportError(error);
      state.batchExcelStatus = '\u6279\u91cf Excel \u751f\u6210\u5931\u8d25\uff1a' + message;
      addLog('error', '\u6279\u91cf Excel \u751f\u6210\u5931\u8d25', message);
      showToast(state.batchExcelStatus);
    } finally {
      state.batchExcelDownloadRunning = false;
      if (state.view === 'batchExcel') renderShell();
    }
  }

  function isExcelFileBusyError(error) {
    const name = String(error && error.name || '');
    const message = String(error && error.message || '');
    return name === 'InvalidStateError'
      || /state cached in an interface object|state had changed since/i.test(message);
  }

  function formatExcelExportError(error) {
    if (isExcelFileBusyError(error)) return L.excelFileBusy;
    return formatErrorMessage(error) || '\u672a\u77e5\u9519\u8bef';
  }

  function showExcelMissingToast() {
    showToast(L.excelMissing + state.excelMissing.join('\u3001'));
  }

  function clearExcelExportResultTimers() {
    window.clearTimeout(state.excelExportResultTimer);
    window.clearInterval(state.excelExportResultInterval);
    state.excelExportResultTimer = 0;
    state.excelExportResultInterval = 0;
  }

  function updateExcelExportResultCountdown(panel) {
    const result = state.excelExportResult;
    const countdown = panel && panel.querySelector('[data-excel-export-countdown]');
    if (!result || !countdown) return;
    countdown.textContent = String(Math.max(0, Math.ceil((Number(result.closesAt) - Date.now()) / 1000)));
  }

  function renderExcelExportResultModal(panel) {
    if (!panel) return;
    let layer = panel.querySelector('[data-excel-export-result-layer="1"]');
    const result = state.excelExportResult;
    if (!result) {
      if (layer) layer.remove();
      return;
    }
    const missing = Array.isArray(result.missing) ? result.missing.filter(Boolean) : [];
    const renderKey = [String(result.fileName || ''), String(result.sku || ''), missing.join('\u0001')].join('\u0002');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-notification-layer pfh-excel-export-result-layer pfh-xr-layer';
      layer.setAttribute('data-excel-export-result-layer', '1');
      layer.setAttribute('data-action', 'excel-export-result-close');
      panel.querySelector('.pfh-full').appendChild(layer);
    } else if (layer.dataset.xrRenderKey === renderKey && layer.querySelector('.pfh-xr-card')) {
      // 内容未变化时只刷新倒计时，避免面板重绘反复重建 DOM 造成闪烁与动画重放。
      layer.style.alignItems = 'center';
      layer.style.justifyContent = 'center';
      layer.style.padding = '24px';
      updateExcelExportResultCountdown(panel);
      return;
    }
    layer.dataset.xrRenderKey = renderKey;
    layer.style.alignItems = 'center';
    layer.style.justifyContent = 'center';
    layer.style.padding = '24px';
    const isOk = !missing.length;
    const statusBlock = isOk
      ? '<div class="pfh-xr-status is-ok"><span class="pfh-xr-status-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.6 9.6 17 20 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</span><div class="pfh-xr-status-copy"><strong>本次导出数据完整</strong><span>没有检测到缺失字段，可直接使用。</span></div></div>'
      : '<div class="pfh-xr-status is-warn"><span class="pfh-xr-status-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8.6v5.1" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><circle cx="12" cy="17.1" r="1.35" fill="currentColor"/></svg>' +
        '</span><div class="pfh-xr-status-copy"><strong>缺少 ' + missing.length + ' 项数据</strong><span>对应单元格已留空，不影响本次文件使用。</span></div>' +
        '<div class="pfh-xr-chips">' + missing.map((item) => '<span class="pfh-xr-chip">' + escapeHtml(item) + '</span>').join('') + '</div></div>';
    layer.innerHTML =
      '<style>' +
        '.pfh-xr-layer,.pfh-xr-layer *{box-sizing:border-box}' +
        '#plm-floating-helper .pfh-xr-layer.pfh-notification-layer,#plm-floating-helper[data-pfh-theme] .pfh-xr-layer.pfh-notification-layer{position:absolute;inset:0;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;border-radius:inherit;background:radial-gradient(120% 90% at 50% 0%,rgba(23,18,48,.28),rgba(15,12,32,.52))!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;animation:pfh-xr-fade .26s ease both}' +
        '.pfh-xr-card{position:relative;width:min(452px,calc(100% - 12px));max-height:calc(100% - 28px);overflow-x:hidden;overflow-y:auto;padding:30px 30px 24px;border-radius:24px;border:1px solid var(--pfh-theme-border,rgba(226,224,240,.9));background:linear-gradient(180deg,var(--pfh-theme-surface,#fff) 0%,var(--pfh-theme-surface-alt,#FBFAFF) 100%);box-shadow:0 30px 80px -24px rgba(31,20,70,.42),0 4px 14px -6px rgba(31,20,70,.16),inset 0 1px 0 rgba(255,255,255,.7);animation:pfh-xr-rise .42s cubic-bezier(.21,.9,.28,1) both;scrollbar-width:thin}' +
        '.pfh-xr-card::-webkit-scrollbar{width:6px}' +
        '.pfh-xr-card::-webkit-scrollbar-thumb{border-radius:999px;background:var(--pfh-theme-border-strong,rgba(120,120,150,.32))}' +
        '.pfh-xr-card::-webkit-scrollbar-track{background:transparent}' +
        '.pfh-xr-card::before{content:"";position:absolute;inset:0 0 auto;height:120px;border-radius:24px 24px 0 0;background:radial-gradient(90% 130% at 50% -30%,var(--pfh-theme-primary-soft,rgba(109,53,232,.14)),transparent 68%);pointer-events:none}' +
        '#plm-floating-helper .pfh-xr-close{position:absolute!important;top:14px!important;right:14px!important;z-index:2;display:grid!important;place-items:center!important;width:32px!important;min-width:32px!important;height:32px!important;min-height:32px!important;margin:0!important;padding:0!important;border:none!important;border-radius:50%!important;background:transparent!important;color:var(--pfh-theme-muted,#9aa0b0)!important;box-shadow:none!important;cursor:pointer;transition:background .18s ease,color .18s ease,transform .18s ease}' +
        '#plm-floating-helper .pfh-xr-close:hover:not(:disabled){background:var(--pfh-theme-soft,rgba(20,16,50,.06))!important;color:var(--pfh-theme-text,#1F2937)!important;transform:rotate(90deg)!important}' +
        '.pfh-xr-close svg{width:16px;height:16px}' +
        '.pfh-xr-hero{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px}' +
        '.pfh-xr-badge{position:relative;display:grid;place-items:center;width:70px;height:70px;border-radius:50%;background:linear-gradient(150deg,#3ddc97 0%,#12b981 52%,#0e9f6e 100%);box-shadow:0 14px 28px -10px rgba(15,150,105,.6),inset 0 2px 4px rgba(255,255,255,.45),inset 0 -4px 10px rgba(6,78,60,.28);animation:pfh-xr-pop .5s cubic-bezier(.2,1.25,.4,1) .06s both}' +
        '.pfh-xr-badge::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(18,185,129,.5);animation:pfh-xr-ring 1.9s ease-out .5s infinite}' +
        '.pfh-xr-badge svg{width:34px;height:34px;color:#fff;filter:drop-shadow(0 1px 1px rgba(4,66,48,.35))}' +
        '.pfh-xr-badge svg path{stroke-dasharray:23.5;stroke-dashoffset:23.5;animation:pfh-xr-draw .55s ease .28s forwards}' +
        '.pfh-xr-title{margin:16px 0 0;font-size:19px;font-weight:700;line-height:1.3;letter-spacing:.2px;color:var(--pfh-theme-text,#1F2937)}' +
        '.pfh-xr-sub{margin:0;font-size:12.5px;line-height:1.5;color:var(--pfh-theme-muted,#9aa0b0)}' +
        '.pfh-xr-sub b{font-weight:600;color:var(--pfh-theme-text,#1F2937);font-variant-numeric:tabular-nums}' +
        '.pfh-xr-body{margin-top:22px;display:flex;flex-direction:column;gap:14px}' +
        '.pfh-xr-file{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:15px;border:1px solid var(--pfh-theme-border,rgba(226,224,240,.95));background:var(--pfh-theme-card,rgba(248,248,253,.9));min-width:0}' +
        '.pfh-xr-file-icon{flex:0 0 auto;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:linear-gradient(150deg,rgba(23,168,110,.16),rgba(23,168,110,.06));color:#0f9d64}' +
        '.pfh-xr-file-icon svg{width:20px;height:20px}' +
        '.pfh-xr-file-name{flex:1 1 auto;min-width:0;font-size:13.5px;line-height:1.5;font-weight:600;color:var(--pfh-theme-text,#1F2937);word-break:break-all;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
        '.pfh-xr-status{position:relative;display:flex;flex-wrap:wrap;align-items:flex-start;gap:11px;padding:14px 15px;border-radius:15px;font-size:13px;line-height:1.55;border:1px solid transparent}' +
        '.pfh-xr-status.is-ok{background:linear-gradient(180deg,rgba(16,185,129,.1),rgba(16,185,129,.045));border-color:rgba(16,185,129,.22);color:#0f7a52}' +
        '.pfh-xr-status.is-warn{background:linear-gradient(180deg,rgba(245,166,35,.12),rgba(245,166,35,.05));border-color:rgba(226,150,30,.28);color:#93591a}' +
        '.pfh-xr-status-icon{flex:0 0 auto;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;color:#fff}' +
        '.pfh-xr-status.is-ok .pfh-xr-status-icon{background:linear-gradient(150deg,#34d399,#0e9f6e);box-shadow:0 6px 14px -6px rgba(15,150,105,.7)}' +
        '.pfh-xr-status.is-warn .pfh-xr-status-icon{background:linear-gradient(150deg,#fbbf24,#e08600);box-shadow:0 6px 14px -6px rgba(200,120,10,.65)}' +
        '.pfh-xr-status-icon svg{width:15px;height:15px}' +
        '.pfh-xr-status-copy{display:flex;flex-direction:column;gap:2px;min-width:0}' +
        '.pfh-xr-status-copy strong{font-size:13.5px;font-weight:650}' +
        '.pfh-xr-status-copy span{opacity:.82}' +
        '.pfh-xr-chips{flex-basis:100%;display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}' +
        '.pfh-xr-chip{padding:4px 10px;border-radius:999px;border:1px solid rgba(226,150,30,.32);background:rgba(255,247,232,.9);font-size:12px;line-height:1.45;color:#8f4b16}' +
        '.pfh-xr-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;padding-top:14px;border-top:1px solid var(--pfh-theme-border,rgba(226,224,240,.9))}' +
        '.pfh-xr-sku{font-size:12px;letter-spacing:.3px;color:var(--pfh-theme-muted,#9aa0b0);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '#plm-floating-helper .pfh-xr-btn{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:38px!important;min-height:38px!important;padding:0 22px!important;border-radius:11px!important;border:1px solid transparent!important;background:linear-gradient(160deg,var(--pfh-theme-primary,#6d35e8),var(--pfh-theme-primary-hover,#5422c9))!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:13.5px!important;line-height:1!important;font-weight:600!important;cursor:pointer;box-shadow:0 10px 20px -10px rgba(84,34,201,.75)!important;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease}' +
        '#plm-floating-helper .pfh-xr-btn:hover:not(:disabled){background:linear-gradient(160deg,var(--pfh-theme-primary,#6d35e8),var(--pfh-theme-primary-hover,#5422c9))!important;border-color:transparent!important;color:#fff!important;transform:translateY(-1px)!important;filter:brightness(1.06);box-shadow:0 14px 24px -10px rgba(84,34,201,.8)!important}' +
        '#plm-floating-helper .pfh-xr-btn:active:not(:disabled){transform:translateY(0)!important;filter:brightness(.97)}' +
        '@keyframes pfh-xr-fade{from{opacity:0}to{opacity:1}}' +
        '@keyframes pfh-xr-rise{from{opacity:0;transform:translateY(16px) scale(.975)}to{opacity:1;transform:none}}' +
        '@keyframes pfh-xr-pop{0%{opacity:0;transform:scale(.55)}100%{opacity:1;transform:scale(1)}}' +
        '@keyframes pfh-xr-ring{0%{transform:scale(1);opacity:.7}70%{transform:scale(1.32);opacity:0}100%{transform:scale(1.32);opacity:0}}' +
        '@keyframes pfh-xr-draw{to{stroke-dashoffset:0}}' +
        '@media (max-width:520px){#plm-floating-helper .pfh-xr-layer.pfh-notification-layer{padding:14px!important}.pfh-xr-card{padding:24px 20px 20px;border-radius:20px}.pfh-xr-badge{width:60px;height:60px}.pfh-xr-badge svg{width:29px;height:29px}.pfh-xr-title{font-size:17.5px}}' +
        '@media (prefers-reduced-motion:reduce){.pfh-xr-layer,.pfh-xr-card,.pfh-xr-badge,.pfh-xr-badge::after{animation:none!important}.pfh-xr-badge svg path{stroke-dashoffset:0;animation:none!important}}' +
      '</style>' +
      '<section class="pfh-xr-card" role="dialog" aria-modal="true" aria-label="表格导出成功">' +
        '<button type="button" class="pfh-xr-close" data-action="excel-export-result-close" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<div class="pfh-xr-hero">' +
          '<span class="pfh-xr-badge"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.6 9.6 17 20 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
          '<h3 class="pfh-xr-title">表格导出成功</h3>' +
          '<p class="pfh-xr-sub"><b data-excel-export-countdown>0</b> 秒后自动关闭</p>' +
        '</div>' +
        '<div class="pfh-xr-body">' +
          '<div class="pfh-xr-file"><span class="pfh-xr-file-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 3h7.2L18.5 8v12.2a.8.8 0 0 1-.8.8H6.5a.8.8 0 0 1-.8-.8V3.8A.8.8 0 0 1 6.5 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.4 3.2V8.2h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.2 12.6l4.4 4.6M13.6 12.6l-4.4 4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><span class="pfh-xr-file-name">' + escapeHtml(result.fileName || 'Excel 文件') + '</span></div>' +
          statusBlock +
          '<div class="pfh-xr-foot"><span class="pfh-xr-sku">' + escapeHtml(result.sku || '') + '</span><button type="button" class="pfh-xr-btn" data-action="excel-export-result-close">关闭</button></div>' +
        '</div>' +
      '</section>';
    updateExcelExportResultCountdown(panel);
  }

  function closeExcelExportResultModal() {
    clearExcelExportResultTimers();
    state.excelExportResult = null;
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('[data-excel-export-result-layer="1"]');
    if (layer) layer.remove();
  }

  function showExcelExportResultModal(result) {
    closeExcelExportResultModal();
    const duration = 7000;
    state.excelExportResult = {
      fileName: String(result && result.fileName || ''),
      sku: String(result && result.sku || ''),
      missing: Array.isArray(result && result.missing) ? result.missing.filter(Boolean) : [],
      closesAt: Date.now() + duration,
    };
    const panel = ensurePanel();
    renderExcelExportResultModal(panel);
    state.excelExportResultInterval = window.setInterval(() => updateExcelExportResultCountdown(panel), 250);
    state.excelExportResultTimer = window.setTimeout(() => closeExcelExportResultModal(), duration);
  }

  async function generateExcelFromCurrent() {
    let generationToastToken = 0;
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    try {
      await ensureExcelJsLoaded();
    } catch (error) {
      showToast(formatErrorMessage(error) || L.excelNeedLibrary);
      return;
    }
    if (!await ensureExcelTemplateLoaded()) {
      showToast('Excel \u6a21\u677f\u5c1a\u672a\u7f13\u5b58\uff0c\u8bf7\u8054\u7f51\u540e\u91cd\u8bd5');
      return;
    }
    syncExcelInputs();
    const purchasePrice = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    let exportSnapshot = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku
      ? state.excelExtra
      : null;
    if (!exportSnapshot) {
      addLog('info', '生成 Excel 使用当前缓存并后台补全', data.sku + ' | 当前没有匹配的表格数据快照');
      prepareExcelInfo().catch((error) => {
        addLog('warn', 'Excel 后台补全失败', data.sku + ' | ' + formatErrorMessage(error));
      });
      exportSnapshot = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku
        ? state.excelExtra
        : null;
    }
    if (!exportSnapshot) {
      state.excelStatus = '\ud83d\udd34 \u8868\u683c\u6570\u636e\u51c6\u5907\u5931\u8d25';
      renderShell();
      showToast(state.excelStatus);
      return;
    }
    const extra = exportSnapshot.extra || buildCachedExcelExtraData(data);
    const excelData = normalizeData(exportSnapshot.excelData || data);
    const exportMissing = getExcelMissingFields(excelData, extra);
    state.excelMissing = exportMissing;
    if (exportMissing.length) {
      state.excelStatus = formatExcelMissingStatus(exportMissing);
      addLog('warn', 'Excel 将使用不完整数据立即生成', data.sku + ' | 缺少：' + exportMissing.join('、'));
      renderShell();
    }
    try {
      const Excel = await ensureExcelJsLoaded();
      const packQty = normalizePackQty(getLocalPackQty(excelData));
      state.excelPackQty = packQty;
      if (!packQty) {
        addLog('warn', 'Excel 缺少装箱数，继续生成', excelData.sku + ' | 装箱数单元格留空');
      }
      const fileName = sanitizeExcelFileName(buildExcelFileName(excelData, extra));
      const saveTarget = await chooseExcelSaveTarget(fileName);
      if (!saveTarget) {
        state.excelStatus = L.excelSaveCanceled;
        renderShell();
        showToast(L.excelSaveCanceled);
        return;
      }
      generationToastToken = showToast(L.excelGenerating, { tone: 'info' });
      const workbook = await loadCloudExcelTemplateWorkbook(Excel);
      const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
      state.excelStatus = L.excelImageLoading;
      renderShell();
      const excelImageSource = getExcelImageSource(excelData, extra);
      const imageInfo = excelImageSource.imageUrl ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper image fetch failed:', error);
        return null;
      }) : null;
      cacheProductThumb(data, extra);

      setCell(sheet, 'A4', buildExcelKeyword(excelData, extra));
      setCell(sheet, 'B4', excelData.name || extra.chineseName || '');
      setCell(sheet, 'C4', '');
      setCell(sheet, 'E4', compactText(packQty));
      sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'N');
      setCell(sheet, 'G4', excelData.sku || '');
      if (excelData.singleBottle) setCell(sheet, 'H4', '\u74f6\u88c5');
      else sheet.getCell('H4').value = { formula: 'IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"\u76d2\u88c5",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"\u888b\u88c5",""))' };
      setCell(sheet, 'I4', buildExcelProductSizeWithAccessories(excelData));
      setCell(sheet, 'J4', formatExcelDimFromParts([excelData.packageLength, excelData.packageWidth, excelData.packageHeight]) || formatExcelDim(excelData.packageNums, []));
      setCell(sheet, 'L4', formatIngredientsForExcel(extra.ingredients));
      setCell(sheet, 'M4', buildExcelSpecificationWithAccessories(excelData));
      if (normalizeAccessories(excelData.accessories).length) setCell(sheet, 'M3', '规格');
      setCell(sheet, 'N4', normalizeExcelUnit(excelData.grossWeight));
      setCell(sheet, 'O4', normalizeExcelNumberOrText(purchasePrice));
      setCell(sheet, 'P4', getReturnDateText(7));
      setCell(sheet, 'S4', extra.benchmarkLink || '');

      if (shouldOmitToyProductSize(excelData)) {
        sheet.spliceColumns(9, 1);
        sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
        sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
        sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
      } else if (shouldRemoveExcelPackageSizeColumn(excelData)) {
        sheet.spliceColumns(10, 1);
        sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
        sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","净重",IF(RIGHT(L4,2)="ml","容量","规格"))' };
      }

      if (imageInfo) {
        state.excelStatus = L.excelPacking;
        renderShell();
        const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
        sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
      }
      await ensureCurrentTraceNameInitials();
      applyExcelTraceWatermark(workbook);
      const buffer = await workbook.xlsx.writeBuffer();
      state.excelStatus = L.excelDownloading + ' ' + fileName;
      renderShell();
      console.info('PLM floating helper Excel filename:', fileName);
      await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
      dismissToast(generationToastToken);
      syncInsightEvent('excel_generated', { sku: excelData.sku || '', name: excelData.name || '', source: 'excel-generation' });
      recordCommerceInsight(excelData, extra, {
        price: purchasePrice,
        packQty,
        source: 'excel',
        fileName,
      });
      upsertDailyLedgerFromData(excelData, { status: '制作中', stage: '表格/上传处理中', note: '已生成 Excel' });
      state.excelStatus = exportMissing.length
        ? L.excelDone + '（缺失字段已留空）'
        : L.excelDone;
      renderShell();
      showExcelExportResultModal({
        fileName,
        sku: excelData.sku,
        missing: exportMissing,
      });
    } catch (error) {
      console.warn('PLM floating helper excel failed:', error);
      const message = formatExcelExportError(error);
      state.excelStatus = L.excelFailed + '：' + message;
      addLog('error', 'Excel 生成失败', data.sku + ' | ' + message);
      renderShell();
      showToast(state.excelStatus);
    } finally {
      dismissToast(generationToastToken);
    }
  }

  async function generateToyLabelFromCurrent(options) {
    const opts = options || {};
    let data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    syncExcelInputs();
    try {
      if (!opts.skipExcelPrepare && (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku)) {
        await prepareExcelInfo();
        data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
      }
      const matchingExcel = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku ? state.excelExtra : null;
      let extra = matchingExcel && matchingExcel.extra ? matchingExcel.extra : {};
      let labelData = normalizeData((matchingExcel && matchingExcel.excelData) || data);
      state.excelStatus = L.labelGenerating;
      renderShell();
      showToast(L.labelGenerating);

      const ensuredImage = await ensureToyLabelProductImage(labelData, extra);
      labelData = ensuredImage.data;
      extra = ensuredImage.extra;
      const imageSource = ensuredImage.imageSource;
      const productImage = imageSource.imageUrl ? await fetchImageForExcel(imageSource.imageUrl, imageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper label product image fetch failed:', error);
        addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u4ea7\u54c1\u56fe\u83b7\u53d6\u5931\u8d25', error && error.message ? error.message : '');
        return null;
      }) : null;
      if (!productImage || !productImage.dataUrl) {
        throw new Error('\u672a\u80fd\u8bfb\u53d6 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u53ea\u5269\u6761\u7801\u7684\u6807\u7b7e\u8bf4\u660e\u56fe');
      }
      const barcodeImage = await getBarcodeForToyLabel(labelData.sku);
      const size = getToyLabelSizeCm(labelData);
      const printCanvas = await renderToyLabelPrintCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        productImage,
        barcodeImage,
      });
      const previewCanvas = await renderToyLabelPreviewCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        printCanvas,
      });
      const baseName = cleanFileNamePart([labelData.brand, labelData.name, labelData.sku].filter(Boolean).join(' ')) || labelData.sku;
      const sizeName = trimCm(size.width) + 'x' + trimCm(size.height) + 'cm';
      const previewBlob = await canvasToBlob(previewCanvas, 'image/jpeg', 0.95);
      const printBlob = await canvasToBlob(printCanvas, 'image/jpeg', 0.95);
      const psdBlob = canvasToFlatPsdBlob(printCanvas, printCanvas.width / ((Number(size.width) || 4) * CM_TO_INCH));
      const previewFilename = baseName + ' \u6807\u7b7e\u8bf4\u660e\u56fe.jpg';
      const printFilename = baseName + ' \u6807\u7b7e\u5370\u5237' + sizeName + '.jpg';
      const materialCode = cleanFileNamePart(labelData.printCode || '');
      const productName = cleanFileNamePart([labelData.brand, labelData.name].filter(Boolean).join('')) || labelData.sku;
      const psdFilename = '\u6807\u7b7e \uff08' + sizeName + '\uff09' + [materialCode, productName].filter(Boolean).join(' ') + '.psd';
      if (Array.isArray(opts.collectFiles)) {
        const generatedFiles = [
          { sku: labelData.sku, filename: previewFilename, blob: previewBlob },
          { sku: labelData.sku, filename: printFilename, blob: printBlob },
          { sku: labelData.sku, filename: psdFilename, blob: psdBlob }
        ];
        opts.collectFiles.push(...generatedFiles);
        await stageToyLabelBatchFiles(generatedFiles, opts.batchSignature || state.toyLabelBatchPreparedSignature);
      } else {
        downloadBlob(previewBlob, previewFilename);
        await wait(250);
        downloadBlob(printBlob, printFilename);
        await wait(250);
        downloadBlob(psdBlob, psdFilename);
      }
      if (!opts.skipBomUpload) await uploadToyLabelPreviewToBom(labelData, previewBlob, previewFilename, opts);
      state.excelStatus = L.labelDone;
      upsertDailyLedgerFromData(labelData, { status: '制作中', stage: '图包/标签/纸盒处理中', note: '已生成玩具标签', labelFileState: 'done', labelFileDone: true });
      renderShell();
      addLog('success', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6210\u529f', labelData.sku);
      showToast(L.labelDone);
      return true;
    } catch (error) {
      console.warn('PLM floating helper label failed:', error);
      state.excelStatus = L.labelFailed;
      renderShell();
      addLog('error', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u5931\u8d25', error && error.message ? error.message : '');
      showToast(L.labelFailed);
      return false;
    }
  }

  async function uploadToyLabelPreviewToBom(data, blob, filename, options) {
    const sku = data && data.sku;
    if (!sku) throw new Error('\u672a\u627e\u5230 SKU\uff0c\u65e0\u6cd5\u4e0a\u4f20\u5230\u7ed1BOM');
    addLog('info', '\u73a9\u5177\u6807\u7b7e\uff1a\u51c6\u5907\u4e0a\u4f20\u8bf4\u660e\u56fe\u5230\u7ed1BOM', sku);
    const drawer = await ensureProjectBomDrawerForData(data, options);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u7ed1BOM\u62bd\u5c49');
    const uploadItem = await waitUntil(() => findBomLabelUploadItem(drawer), 12000, 250);
    if (!uploadItem) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u4e2d\u6807\u7b7e\u884c\u7684\u4e0a\u4f20\u52a0\u53f7');
    uploadItem.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(180);
    await putFileIntoUploadItem(uploadItem, blob, filename);
    await waitUploadItemDone(uploadItem, filename, 180000);
    await wait(1600);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u8bf4\u660e\u56fe\u5df2\u4e0a\u4f20\u5230\u7ed1BOM\u6807\u7b7e', filename);
    await saveProjectBomDrawer(drawer);
    await closeProjectBomDrawer(drawer);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u7ed1BOM\u5df2\u6279\u91cf\u4fdd\u5b58\u5e76\u5173\u95ed', sku);
  }

  function getToyLabelSizeCm(data) {
    return { width: 4, height: 3 };
  }

  function getToyLabelImageSource(data, extra) {
    const batchImageUrl = data && (data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl);
    if (batchImageUrl) {
      return {
        imageUrl: data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
        imageFallbackUrl: data.toyLabelProductImageFallbackUrl || data.productListImageFallbackUrl || data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
      };
    }
    const source = getExcelImageSource(data, extra);
    const imageUrl = stripOssResizeParams(source.imageUrl || source.imageFallbackUrl || '');
    const imageFallbackUrl = stripOssResizeParams(source.imageFallbackUrl || '');
    return {
      imageUrl: imageUrl || source.imageUrl || '',
      imageFallbackUrl: imageFallbackUrl || imageUrl || source.imageFallbackUrl || '',
    };
  }

  async function getBarcodeForToyLabel(sku) {
    return { canvas: renderCode128Barcode(sku, 980, 260), source: 'generated-code128b' };
  }

  async function ensureToyLabelProductImage(data, extra) {
    const cachedSource = getToyLabelImageSource(data, extra);
    if (cachedSource.imageUrl || cachedSource.imageFallbackUrl) {
      return { data, extra, imageSource: cachedSource };
    }
    if (!(await ensureProjectDrawerForData(data))) {
      throw new Error('\u672a\u6253\u5f00\u5f53\u524d SKU \u7684\u9879\u76ee\u8be6\u60c5\uff0c\u65e0\u6cd5\u8bfb\u53d6\u6548\u679c\u56fe');
    }
    const drawer = getProjectDrawerForSku(data.sku) || getProjectDrawer();
    const imageInfo = drawer ? await collectProductImageInfo(drawer, {
      sku: data.sku,
      allowPreview: true,
      restoreTab: true,
      productInfoTimeout: 4500,
    }) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageUrl = imageInfo.isSkuDesignImage && (imageInfo.imageUrl || imageInfo.imageFallbackUrl);
    if (!imageUrl) {
      throw new Error('\u672a\u627e\u5230 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u4e0a\u4f20\u7a7a\u767d\u6807\u7b7e\u8bf4\u660e\u56fe');
    }
    const imageExtra = {
      ...(extra || {}),
      ...imageInfo,
      imageUrl: imageInfo.imageUrl || imageUrl,
      imageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      skuImageUrl: imageInfo.imageUrl || imageUrl,
      skuImageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      isSkuDesignImage: true,
    };
    const imageData = normalizeData({
      ...data,
      skuImageUrl: imageExtra.skuImageUrl,
      skuImageFallbackUrl: imageExtra.skuImageFallbackUrl,
      skuImageSource: 'effectImage',
    });
    cacheProductThumb(imageData, imageExtra);
    if (state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === imageData.sku) {
      state.excelExtra = { extra: imageExtra, excelData: imageData };
    }
    return { data: imageData, extra: imageExtra, imageSource: getToyLabelImageSource(imageData, imageExtra) };
  }


  async function renderToyLabelPrintCanvas(options) {
    const width = Math.round((Number(options.widthCm) || 4) * 300);
    const height = Math.round((Number(options.heightCm) || 3) * 300);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const productBox = { x: width * 0.18, y: height * 0.11, w: width * 0.64, h: height * 0.39 };
    if (options.productImage && options.productImage.dataUrl) {
      const image = await loadImage(options.productImage.dataUrl);
      drawImageContained(ctx, trimImageWhitespace(image), productBox.x, productBox.y, productBox.w, productBox.h);
    }

    const barcodeBox = { x: width * 0.13, y: height * 0.62, w: width * 0.74, h: height * 0.17 };
    const barcode = options.barcodeImage && options.barcodeImage.canvas
      ? options.barcodeImage.canvas
      : options.barcodeImage && options.barcodeImage.dataUrl
        ? await loadImage(options.barcodeImage.dataUrl)
        : renderCode128Barcode(options.sku, 900, 210);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(barcode, barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + Math.round(height * 0.052) + 'px Arial, sans-serif';
    ctx.fillText(options.sku || '', width / 2, height * 0.86);
    return canvas;
  }

  async function renderToyLabelPreviewCanvas(options) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '400 88px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u6807\u7b7e', 640, 300);
    ctx.font = '400 90px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a  \u5bbd' + trimCm(options.widthCm) + 'X\u9ad8' + trimCm(options.heightCm) + 'CM', 640, 455);

    const labelX = 585;
    const labelY = 958;
    const labelW = 1888;
    const labelH = Math.round(labelW * (Number(options.heightCm) || 3) / (Number(options.widthCm) || 4));
    ctx.strokeStyle = '#9f9f9f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(labelX, labelY, labelW, labelH);
    ctx.drawImage(options.printCanvas, labelX + 2, labelY + 2, labelW - 4, labelH - 4);
    drawDimensionGuide(ctx, labelX, labelY, labelW, labelH, options.widthCm, options.heightCm);
    return canvas;
  }

  function drawDimensionGuide(ctx, x, y, w, h, widthCm, heightCm) {
    ctx.save();
    ctx.strokeStyle = '#ef1f24';
    ctx.fillStyle = '#ef1f24';
    ctx.lineWidth = 4;
    const leftX = x - 70;
    const bottomY = y + h + 62;
    drawLineWithTicks(ctx, leftX, y, leftX, y + h, 28, true);
    drawLineWithTicks(ctx, x, bottomY, x + w, bottomY, 28, false);
    ctx.font = '700 86px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(leftX - 78, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(trimCm(heightCm) + 'cm', 0, 0);
    ctx.restore();
    ctx.fillText(trimCm(widthCm) + 'cm', x + w / 2, bottomY + 86);
    ctx.restore();
  }

  function drawLineWithTicks(ctx, x1, y1, x2, y2, tick, vertical) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x1 - tick / 2, y1);
      ctx.lineTo(x1 + tick / 2, y1);
      ctx.moveTo(x2 - tick / 2, y2);
      ctx.lineTo(x2 + tick / 2, y2);
    } else {
      ctx.moveTo(x1, y1 - tick / 2);
      ctx.lineTo(x1, y1 + tick / 2);
      ctx.moveTo(x2, y2 - tick / 2);
      ctx.lineTo(x2, y2 + tick / 2);
    }
    ctx.stroke();
  }

  function trimCm(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Number(num.toFixed(2))).replace(/\.0$/, '') : String(value || '');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawImageContained(ctx, image, x, y, w, h) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const ratio = Math.min(w / iw, h / ih);
    const dw = iw * ratio;
    const dh = ih * ratio;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function trimImageWhitespace(image) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const canvas = document.createElement('canvas');
    canvas.width = iw;
    canvas.height = ih;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, iw, ih).data;
    let minX = iw;
    let minY = ih;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < ih; y += 1) {
      for (let x = 0; x < iw; x += 1) {
        const index = (y * iw + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        if (a > 12 && !(r > 245 && g > 245 && b > 245)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return image;
    const pad = Math.round(Math.max(iw, ih) * 0.02);
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(iw - sx, maxX - minX + 1 + pad * 2);
    const sh = Math.min(ih - sy, maxY - minY + 1 + pad * 2);
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('canvas export failed')), type || 'image/png', quality);
    });
  }

  function renderCode128Barcode(text, width, height) {
    const patterns = [
      '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
    ];
    const value = String(text || '').replace(/[^\x20-\x7f]/g, '');
    const codes = [104];
    for (let i = 0; i < value.length; i += 1) codes.push(value.charCodeAt(i) - 32);
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
    codes.push(checksum % 103, 106);
    const quiet = 10;
    const modules = codes.reduce((sum, code) => sum + patterns[code].split('').reduce((a, n) => a + Number(n), 0), quiet * 2);
    const moduleWidth = width / modules;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    let x = quiet * moduleWidth;
    codes.forEach((code) => {
      const pattern = patterns[code];
      for (let i = 0; i < pattern.length; i += 1) {
        const w = Number(pattern[i]) * moduleWidth;
        if (i % 2 === 0) ctx.fillRect(Math.round(x), 0, Math.ceil(w), height);
        x += w;
      }
    });
    return canvas;
  }

  function canvasToFlatPsdBlob(canvas, dpi) {
    const width = canvas.width;
    const height = canvas.height;
    const resolution = Math.max(72, Math.round(Number(dpi) || 300));
    const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const pixelCount = width * height;
    const resolutionResourceLength = 28;
    const size = 26 + 4 + 4 + resolutionResourceLength + 4 + 2 + pixelCount * 3;
    const bytes = new Uint8Array(size);
    let offset = 0;
    const writeText = (value) => {
      for (let i = 0; i < value.length; i += 1) bytes[offset++] = value.charCodeAt(i);
    };
    const write16 = (value) => {
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    const write32 = (value) => {
      bytes[offset++] = (value >> 24) & 255;
      bytes[offset++] = (value >> 16) & 255;
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    writeText('8BPS');
    write16(1);
    offset += 6;
    write16(3);
    write32(height);
    write32(width);
    write16(8);
    write16(3);
    write32(0);
    write32(resolutionResourceLength);
    writeText('8BIM');
    write16(1005);
    write16(0);
    write32(16);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(0);
    write16(0);
    for (let channel = 0; channel < 3; channel += 1) {
      for (let i = 0; i < pixelCount; i += 1) bytes[offset++] = rgba[i * 4 + channel];
    }
    return new Blob([bytes], { type: 'image/vnd.adobe.photoshop' });
  }

  function setCell(sheet, address, value) {
    sheet.getCell(address).value = value;
    if (/^[IM]\d+$/.test(address) && typeof value === 'string' && value.includes('\n')) {
      const cell = sheet.getCell(address);
      cell.alignment = { ...(cell.alignment || {}), wrapText: true };
      const row = sheet.getRow(Number(address.match(/\d+$/)[0]));
      row.height = Math.max(Number(row.height) || 0, value.split('\n').length * 18 + 20);
    }
  }

  function getExcelImageSource(data, extra) {
    const extraImageUrl = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (extraImageUrl) {
      return { imageUrl: extra.skuImageUrl || extra.imageUrl || extraImageUrl, imageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extraImageUrl };
    }
    const skuImageUrl = data && /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') && (data.skuImageUrl || data.skuImageFallbackUrl);
    if (skuImageUrl) {
      return { imageUrl: data.skuImageUrl || skuImageUrl, imageFallbackUrl: data.skuImageFallbackUrl || data.skuImageUrl || skuImageUrl };
    }
    const productListImageUrl = data && (data.productListImageUrl || data.productListImageFallbackUrl);
    if (productListImageUrl) {
      return {
        imageUrl: data.productListImageUrl || productListImageUrl,
        imageFallbackUrl: data.productListImageFallbackUrl || data.productListImageUrl || productListImageUrl,
      };
    }
    return { imageUrl: '', imageFallbackUrl: '' };
  }

  function getPreferredExcelIngredients(data) {
    const cached = normalizeData(data || {});
    if (cached.copywritingIngredientSplit && cached.copywritingIngredientChinese) return cached.copywritingIngredientChinese;
    return cached.ingredientChinese
      || cached.copywritingIngredientChinese
      || cached.ingredientEnglish
      || cached.copywritingIngredientEnglish
      || '';
  }

  function buildExcelExtraFromApi(data, apiResult, previous) {
    const cached = buildCachedExcelExtraData(data);
    const result = apiResult || {};
    const imageUrl = result.imageUrl || cached.imageUrl || '';
    const imageFallbackUrl = result.imageFallbackUrl || cached.imageFallbackUrl || imageUrl;
    return {
      ...cached,
      englishName: result.englishName || cached.englishName || '',
      chineseName: result.chineseName || cached.chineseName || '',
      ingredients: getPreferredExcelIngredients(data) || (previous && previous.ingredients) || '',
      benchmarkLink: result.benchmarkLink || cached.benchmarkLink || '',
      imageUrl,
      imageFallbackUrl,
      skuImageUrl: result.skuImageUrl || cached.skuImageUrl || imageUrl,
      skuImageFallbackUrl: result.skuImageFallbackUrl || cached.skuImageFallbackUrl || imageFallbackUrl,
      skuImageSource: result.skuImageSource || cached.skuImageSource || '',
      isSkuDesignImage: Boolean(result.isSkuDesignImage || cached.isSkuDesignImage || imageUrl),
      apiResolved: Boolean(result.apiResolved),
      apiFieldStates: normalizeApiFieldStates(result.apiFieldStates || data && data.apiFieldStates),
      liveData: data,
    };
  }

  async function collectExcelExtraData(sku, options) {
    const opts = options || {};
    stopScan();
    cancelDrawerTabFlow();
    let drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    const cachedData = normalizeData((state.data && state.data.sku === sku ? state.data : null) || loadData(sku) || {});
    let apiLiveData = cachedData;
    let extra = buildCachedExcelExtraData(cachedData);
    try {
      const apiResult = await fetchApiExcelData(cachedData, { force: Boolean(opts.force) });
      if (apiResult && apiResult.found) {
        apiLiveData = normalizeData(apiResult.data || cachedData);
        if (apiResult.ingredientFile && (!apiLiveData.ingredientEnglish || !apiLiveData.ingredientChinese || apiLiveData.ingredientPdfFileName !== apiResult.ingredientFile.fileName)) {
          await hydrateIngredientPdfForSku(sku, { silent: true, drawer, apiFile: apiResult.ingredientFile });
          apiLiveData = normalizeData(loadData(sku) || apiLiveData);
        }
        extra = buildExcelExtraFromApi(apiLiveData, apiResult, extra);
        extra.liveData = apiLiveData;
        saveData(sku, apiLiveData, { suppressDataQuality: true, changeSource: 'Excel PLM 数据同步' });
        if (state.selectedSku === sku) state.data = apiLiveData;
        const apiMissing = getExcelMissingFields(apiLiveData, extra);
        addLog(apiMissing.length ? 'info' : 'success', 'Excel PLM 数据补全结果', sku + ' | ' + (apiMissing.length ? '仍缺：' + apiMissing.join('、') : '已取得生成所需字段'));
        if (!getExcelDrawerFallbackMissingFields(apiLiveData, extra).length) return extra;
      }
    } catch (error) {
      addLog('warn', 'Excel PLM 数据补全异常，改用现有页面读取', sku + ' | ' + formatErrorMessage(error));
    }
    if (!drawer) return extra;
    drawer = await waitForExcelProjectDrawerReady(sku, 12000) || drawer;
    const token = beginForegroundDrawerTabFlow(sku, drawer);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 12000 }))) throw new Error('\u4ea7\u54c1\u4fe1\u606f\u9875\u7b7e\u672a\u52a0\u8f7d\u5b8c\u6210');
      let liveData = mergeData(apiLiveData, extractData(drawer, { forceSkuImage: true }));
      if (!liveData.grossWeight && !isApiFieldResolved(liveData, 'grossWeight')) {
        await waitFor(() => getGrossWeightValue(drawer), 2600, 120);
        liveData = mergeData(liveData, extractData(drawer, { forceSkuImage: true }));
      }
      const packageReady = Boolean(liveData.packageSizeText || (liveData.packageLength && liveData.packageWidth && liveData.packageHeight));
      const materialNeedsRead = (!liveData.seenMaterial && !isApiFieldResolved(liveData, 'material'))
        || (!liveData.singleBottle && !packageReady && !isApiFieldResolved(liveData, 'packageSize'))
        || (!liveData.printSizeText && !isApiFieldResolved(liveData, 'printSize'))
        || (!liveData.netContent && !isApiFieldResolved(liveData, 'netContent'));
      if (materialNeedsRead) {
        if (!(await switchDrawerTab(drawer, L.materialTab, { flowToken: token, timeout: 12000 }))) throw new Error('\u7269\u6599\u6e05\u5355\u9875\u7b7e\u672a\u52a0\u8f7d\u5b8c\u6210');
        let materialData = extractData(drawer);
        if (!materialData.seenMaterial) {
          await waitFor(() => {
            materialData = extractData(drawer);
            return materialData.seenMaterial;
          }, 3500, 120);
        }
        if (!materialData.seenMaterial) throw new Error('\u7269\u6599\u6e05\u5355\u5185\u5bb9\u672a\u52a0\u8f7d\u5b8c\u6210');
        liveData = mergeData(liveData, materialData);
      }
      extra.liveData = liveData;
      if (liveData.sku === sku) {
        const refreshed = mergeData(cachedData, liveData);
        saveData(sku, refreshed, { suppressDataQuality: true });
        if (state.selectedSku === sku) state.data = refreshed;
      }
      let ingredientData = normalizeData(loadData(sku) || cachedData);
      let copywritingRecord = normalizeCopywritingRecord(ingredientData.copywriting);
      if (!copywritingRecord || copywritingRecord.parserVersion !== COPYWRITING_PARSER_VERSION) {
        if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 25000, 200);
        ingredientData = normalizeData(loadData(sku) || ingredientData);
        copywritingRecord = normalizeCopywritingRecord(ingredientData.copywriting);
        if (!copywritingRecord || copywritingRecord.parserVersion !== COPYWRITING_PARSER_VERSION) {
          ingredientData = await hydrateCopywritingForSku(sku, { silent: true, drawer });
        }
      }
      if (!ingredientData.ingredientEnglish || !ingredientData.ingredientChinese) {
        if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
        else ingredientData = await hydrateIngredientPdfForSku(sku, { silent: true, drawer });
        ingredientData = normalizeData(loadData(sku) || ingredientData);
      }
      extra.ingredientEnglish = ingredientData.ingredientEnglish || extra.ingredientEnglish;
      extra.ingredientChinese = ingredientData.ingredientChinese || extra.ingredientChinese;
      const productText = getVisibleText(drawer);
      const previewImageInfo = await collectProductImageInfo(drawer, {
        sku,
        includeBenchmark: false,
        allowPreview: true,
        restoreTab: false,
        productInfoTimeout: 4500,
        flowToken: token,
      });
      const resolvedImageInfo = previewImageInfo && previewImageInfo.isSkuDesignImage ? previewImageInfo : getCachedSkuImageInfo(sku);
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) {
        const error = new Error('\u7528\u6237\u5df2\u5207\u6362\u9875\u7b7e\uff0cExcel \u8865\u5145\u8bfb\u53d6\u5df2\u53d6\u6d88');
        error.name = 'AbortError';
        throw error;
      }
      Object.assign(extra, {
        englishName: cleanEnglishProductName(extractLineAfter(productText, 'PRODUCT NAME'), cachedData.brand) || extra.englishName,
        chineseName: extractLineAfter(productText, '\u5546\u54c1\u540d\u79f0') || extra.chineseName,
        ingredients: getPreferredExcelIngredients(ingredientData) || extra.ingredients || extractNamedField(productText, '\u6210\u5206') || extractNamedField(productText, '\u6210\u4efd') || '',
        ...resolvedImageInfo,
        skuImageSource: previewImageInfo && previewImageInfo.isSkuDesignImage ? 'effectImage' : (resolvedImageInfo.skuImageSource || extra.skuImageSource || ''),
      });

      if (!(await switchDrawerTab(drawer, '\u9879\u76ee\u4fe1\u606f', { flowToken: token, timeout: 9000 }))) throw new Error('\u9879\u76ee\u4fe1\u606f\u9875\u7b7e\u672a\u52a0\u8f7d\u5b8c\u6210');
      extra.benchmarkLink = extractBenchmarkLink(getVisibleText(drawer)) || extra.benchmarkLink;
      await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 9000 });
      return extra;
    } finally {
      finishForegroundDrawerTabFlow(token);
    }
  }

  function getCachedSkuImageInfo(sku) {
    const current = state.data && state.data.sku === sku ? state.data : null;
    const data = normalizeData(current || loadData(sku) || {});
    const hasReusableSkuImage = /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') && Boolean(data.skuImageUrl || data.skuImageFallbackUrl);
    const imageUrl = hasReusableSkuImage
      ? (data.skuImageUrl || data.skuImageFallbackUrl || '')
      : (data.productListImageUrl || data.productListImageFallbackUrl || '');
    if (!imageUrl) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageFallbackUrl = hasReusableSkuImage
      ? (data.skuImageFallbackUrl || data.skuImageUrl || imageUrl)
      : (data.productListImageFallbackUrl || data.productListImageUrl || imageUrl);
    const skuImageSource = hasReusableSkuImage ? data.skuImageSource : 'productListImage';
    return {
      imageUrl,
      imageFallbackUrl,
      skuImageUrl: imageUrl,
      skuImageFallbackUrl: imageFallbackUrl,
      skuImageSource,
      isSkuDesignImage: true,
    };
  }

  async function switchDrawerTab(drawer, label, options) {
    const opts = options || {};
    if (!drawer) return false;
    if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
    const timeout = Number(opts.timeout || 3500) || 3500;
    const startedAt = Date.now();
    const button = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      return findTabButton(drawer, label);
    }, timeout, 120);
    if (!button) return false;
    if (!isActiveTab(button)) {
      state.ignoreOutsideClickUntil = Date.now() + 1200;
      button.click();
    }
    const active = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      const current = findTabButton(drawer, label);
      return current && isActiveTab(current);
    }, Math.max(500, timeout - (Date.now() - startedAt)), 100);
    if (!active) return false;
    const readinessTimeout = Math.max(500, timeout - (Date.now() - startedAt));
    const ready = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      return isDrawerTabContentReady(drawer, label);
    }, readinessTimeout, 120);
    if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
    return Boolean(ready);
  }

  function isDrawerTabContentReady(drawer, label) {
    if (!drawer || getActiveTabText(drawer) !== label) return false;
    const text = getVisibleText(drawer);
    if (label === L.materialTab) return /\u7269\u6599\u7f16\u7801[\s\S]*\u7269\u6599\u540d\u79f0|\u89c4\u683c\u578b\u53f7|\u5305\u88c5\u5c3a\u5bf8|\u5370\u5237\u5c3a\u5bf8|\u51c0\u542b\u91cf/.test(text);
    if (label === L.productTab) return /PRODUCT\s*NAME|\u5546\u54c1\u540d\u79f0|\u4ea7\u54c1\u540d\u79f0|\u89c4\u683c\u4fe1\u606f|\u6bdb\u91cd|\u51c0\u542b\u91cf|\u6548\u679c\u56fe\u4fe1\u606f/.test(text);
    if (label === '\u5907\u8d27\u4fe1\u606f') return /\u56fd\u5185\u4e09\u6863\u4ef7\u683c|\u91c7\u8d2d\u4ef7/.test(text);
    if (label === '\u9879\u76ee\u4fe1\u606f') return /\u9879\u76ee\u7f16\u7801|\u5bf9\u6807\u94fe\u63a5/.test(text);
    return true;
  }


  async function collectProductImageInfo(drawer, options) {
    const opts = options || {};
    const activeText = opts.restoreTab ? getActiveTabText(drawer) : '';
    let imageInfo = { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const ownsFlow = !opts.flowToken && Boolean(opts.sku);
    if (ownsFlow) stopScan();
    const flowToken = opts.flowToken || (ownsFlow ? beginForegroundDrawerTabFlow(opts.sku, drawer) : 0);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken, timeout: opts.productInfoTimeout || 3500 }))) return imageInfo;
      await waitForProductInfoImage(drawer, opts.productInfoTimeout || 1800);
      if (flowToken && state.drawerTabFlowToken !== flowToken) return imageInfo;
      imageInfo = findDesignImageInfo(drawer);
      if ((!imageInfo.imageUrl && !imageInfo.imageFallbackUrl) && opts.allowPreview) {
        imageInfo = await openPreviewAndGetImageInfo(drawer);
      }
      if (opts.restoreTab && activeText) await switchDrawerTab(drawer, activeText, { flowToken });
      return imageInfo;
    } finally {
      if (ownsFlow) finishForegroundDrawerTabFlow(flowToken);
    }
  }

  async function waitForProductInfoImage(drawer, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const imageInfo = findDesignImageInfo(drawer);
      if (imageInfo.imageUrl || imageInfo.imageFallbackUrl) return true;
      scrollDesignImageCardsIntoView(drawer);
      await wait(120);
    }
    return false;
  }

  function scrollDesignImageCardsIntoView(drawer) {
    if (!drawer) return;
    const card = findDesignPreviewCard(drawer);
    if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function findDesignPreviewCard(root) {
    const item = findStrictEffectImageItem(root || document);
    if (!item) return null;
    return Array.from(item.querySelectorAll('.filePreviewCard, .filePreviewMainBox, .removeOtherContent, .previewMasker, .preview'))
      .filter(isVisibleElement)
      .find((el) => isStrictEffectImageFileContext(getDesignAssetContext(el))) || null;
  }

  function extractLineAfter(text, label) {
    const lines = getCleanLines(text);
    const normalizedLabel = label.replace(/[：:]\s*$/, '');
    const index = lines.findIndex((line) => line.replace(/[：:]\s*$/, '') === normalizedLabel);
    if (index < 0) return '';
    return cleanExcelFieldValue(lines[index + 1]);
  }

  function extractNamedField(text, label) {
    const lines = getCleanLines(text);
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (lines[index] !== label) continue;
      const value = cleanExcelFieldValue(lines[index + 1]);
      if (value && !isLikelyFieldLabel(value)) return value;
    }
    return '';
  }

  function getCleanLines(text) {
    return String(text || '').split('\n').map((line) => compactText(line)).filter(Boolean);
  }

  function cleanExcelFieldValue(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function cleanEnglishProductName(value, brand) {
    let text = cleanExcelFieldValue(value)
      .replace(/^PRODUCT\s*NAME\s*[:：]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';

    const brandText = compactText(brand).replace(/[._-]+/g, ' ').trim();
    if (brandText) {
      const escapedBrand = brandText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s._-]+');
      text = text.replace(new RegExp('^' + escapedBrand + '(?:[\\s._–—-]+|$)', 'i'), '').trim();
    }

    const logoMatch = text.match(/^([A-Z][A-Z0-9]{3,})(?:[®™©])?[\s._–—-]+(.+)$/);
    if (logoMatch && /[A-Za-z]/.test(logoMatch[2])) text = logoMatch[2].trim();
    return text;
  }

  function isLikelyFieldLabel(value) {
    return /^(PRODUCT NAME|\u4e2d\u6587-\u7b80\u4f53|\u82f1\u8bed|\u6210\u4efd\u8868|\u6210\u5206\u529f\u80fd|\u4ea7\u54c1\u5356\u70b9|\u4ea7\u54c1\u4f18\u52bf|\u4ea7\u54c1\u529f\u6548|\u4f7f\u7528\u65b9\u6cd5|\u8b66\u544a\u8bed|\u4ea7\u54c1\u6807\u8bc6|\u5176\u4ed6\u6807\u8bc6)/.test(value);
  }

  function findDesignImageInfo(drawer) {
    const item = findStrictEffectImageItem(drawer);
    if (!item) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const fallback = Array.from(item.querySelectorAll('img.ant-image-img, .ant-image img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .find(isStrictDesignImageUrl) || '';
    const original = stripOssResizeParams(fallback);
    return { imageUrl: original, imageFallbackUrl: fallback || original, isSkuDesignImage: Boolean(fallback) };
  }

  function findStrictEffectImageItem(drawer) {
    if (!drawer) return null;
    const root = getDesignContentRoot(drawer);
    if (!root) return null;
    return Array.from(root.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => isEffectImageFormItem(root, item) && isStrictEffectImageFileContext(item.innerText || item.textContent)) || null;
  }

  function getDesignContentRoot(drawer) {
    const roots = Array.from(drawer.querySelectorAll('.previewFormRoot .tabContent, .tabContent, .previewFormRoot'))
      .filter(isVisibleElement)
      .filter((el) => !el.closest('.searchDropdownPanel, .searchDropdown'));
    return roots.find((el) => /\u6548\u679c\u56fe\u4fe1\u606f[\s\S]*\u56fe\u7247/.test(el.innerText || el.textContent))
      || roots[0]
      || drawer;
  }

  function isEffectImageFormItem(root, item) {
    const label = compactText((item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).innerText || (item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).textContent || '');
    if (label !== '\u56fe\u7247') return false;
    return getPreviousDesignSection(root, item) === '\u6548\u679c\u56fe\u4fe1\u606f';
  }

  function getPreviousDesignSection(root, item) {
    const itemTop = item.getBoundingClientRect().top;
    const titles = Array.from(root.querySelectorAll('.titleRow, .titleContent, .title'))
      .filter(isVisibleElement)
      .map((el) => ({ top: el.getBoundingClientRect().top, text: compactText(el.innerText || el.textContent) }))
      .filter((entry) => entry.top <= itemTop && /^(\u57fa\u672c\u4fe1\u606f|\u6548\u679c\u56fe\u4fe1\u606f|\u4ea7\u54c1\u6587\u6848|\u8bbe\u8ba1\u6587\u4ef6|\u5907\u6ce8\u4fe1\u606f)$/.test(entry.text))
      .sort((a, b) => a.top - b.top);
    let section = '';
    titles.forEach((entry) => { section = entry.text; });
    return section;
  }

  function isStrictEffectImageFileContext(context) {
    const text = compactText(context);
    if (!text || isExcludedDesignImageContext(text)) return false;
    return /\.(jpg|jpeg|png|webp)\b/i.test(text);
  }

  function isExcludedDesignImageContext(context) {
    return /(\u6807\u7b7e\u5c3a\u5bf8\u56fe|\u4ea7\u54c1\u6587\u6848|\u4ea7\u54c1\u6b63\u9762\u6587\u6848|\u6587\u6848|\u4f01\u4e1a\u5fae\u4fe1|\u622a\u56fe|\.pdf\b|\.docx?\b|\.xlsx?\b)/i.test(compactText(context));
  }

  async function openPreviewAndGetImageInfo(drawer) {
    const beforeUrls = getVisibleOssImageUrls(document);
    const preview = findDesignPreviewCard(drawer);
    if (!preview) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    preview.click();
    const images = await waitForPreviewImageUrls(beforeUrls, 1600);
    closeImagePreview();
    const fallback = images[0] || '';
    return { imageUrl: stripOssResizeParams(fallback), imageFallbackUrl: fallback, isSkuDesignImage: Boolean(fallback) };
  }

  async function waitForPreviewImageUrls(beforeUrls, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const images = getVisibleOssImageUrls(document)
        .filter((src) => !beforeUrls.includes(src))
        .filter((src) => !/filePic\//i.test(src));
      if (images.length) return images;
      await wait(160);
    }
    return [];
  }

  function getVisibleOssImageUrls(root) {
    return Array.from((root || document).querySelectorAll('.ant-image-preview-img, .ant-image-preview-wrap img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(src));
  }

  function isStrictDesignImageUrl(src) {
    return /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(String(src || '')) && !/\/filePic\//i.test(src);
  }

  function closeImagePreview() {
    const close = document.querySelector('.ant-image-preview-close');
    if (close) close.click();
  }



  function getDesignAssetContext(el) {
    const preferred = el.closest('.filePreviewCard, .filePreviewMainBox, .removeOtherContent');
    if (preferred) return compactText(preferred.innerText || preferred.textContent || '');
    let node = el.parentElement;
    while (node && node !== document.body) {
      const text = compactText(node.innerText || node.textContent || '');
      if (text) return text;
      node = node.parentElement;
    }
    return '';
  }

  function stripOssResizeParams(url) {
    return String(url || '').replace(/\?x-oss-process=.*$/i, '');
  }

  function extractBenchmarkLink(text) {
    const lines = getCleanLines(text);
    const index = lines.findIndex((line) => /\u5bf9\u6807\u94fe\u63a5/.test(line));
    const nearby = index >= 0 ? lines.slice(index + 1, index + 5).join(' ') : text;
    return ((nearby.match(/https?:\/\/\S+/) || String(text || '').match(/https?:\/\/\S+/)) || [''])[0];
  }

  function formatExcelDim(nums, fallbackParts) {
    const parts = (Array.isArray(nums) && nums.length >= 3 ? nums.slice(0, 3).map(trimNumber) : fallbackParts.map(extractCmValue))
      .filter((part) => part !== '');
    return parts.length >= 2 ? parts.join('*') + 'cm' : '';
  }

  function formatExcelDimFromParts(parts) {
    const values = (parts || []).map(extractCmValue).filter((part) => part !== '');
    return values.length >= 2 ? values.join('*') + 'cm' : '';
  }

  function extractCmValue(value) {
    const match = String(value || '').match(/\d+(?:\.\d+)?/);
    return match ? trimNumber(Number(match[0])) : '';
  }

  function normalizeExcelUnit(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text || text === L.unknown) return '';
    return text.replace(/(kg|mg|mcg|ug|g|ml|cl|dl|l|floz|oz|lbs?)$/i, (unit) => unit.toLowerCase());
  }

  function formatIngredientsForExcel(value) {
    return String(value || '').replace(/\s*(\u975e\u6d3b\u6027\u6210\u5206[:\uff1a])\s*/g, '\n$1');
  }

  function normalizeExcelNumberOrText(value) {
    const text = compactText(value);
    if (!text) return '';
    const num = Number(text);
    return Number.isFinite(num) ? num : text;
  }

  function normalizePackQty(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text) return '';
    return /pcs$/i.test(text) ? text.replace(/pcs$/i, 'pcs') : text + 'pcs';
  }

  async function fillRecommendedPackQty(data) {
    const boxKey = buildPackBoxKey(data);
    const recommendation = calculateLocalPackRecommendation(boxKey);
    const count = recommendation && recommendation.packCount ? String(recommendation.packCount) : '';
    state.excelPackQty = count;
    if (!count) return false;
    state.excelStatus = '装箱数已按当前尺寸本地计算：' + count;
    return true;
  }

  async function closeToyCopywritingDrawerForSku(sku) {
    const drawer = getToyCopywritingDrawerForSku(sku) || getProjectDrawerForSku(sku);
    if (!drawer) return true;
    const close = findDrawerCloseButton(drawer);
    if (!close) return false;
    clickElement(close);
    const result = await waitFor(() => {
      const modal = getVisibleModal();
      if (modal && isCancelConfigModal(modal)) return { modal };
      if (!isVisibleElement(drawer) || !document.body.contains(drawer)) return { closed: true };
      return null;
    }, 10000, 100);
    if (!result) return false;
    if (result.modal) {
      confirmCancelConfigModal(result.modal);
      return Boolean(await waitFor(() => {
        return !getVisibleModal() && (!isVisibleElement(drawer) || !document.body.contains(drawer));
      }, 10000, 100));
    }
    return Boolean(result.closed);
  }

  async function fillRecommendedPurchasePrice(data, extra) {
    const savedPrice = normalizeLedgerPurchasePrice(data && data.purchasePrice);
    if (savedPrice) {
      state.excelPurchasePrice = savedPrice;
      return false;
    }
    const current = String(state.excelPurchasePrice || '').trim();
    if (current && current !== '6') return false;
    try {
      const domesticThirdTierPrice = await fetchApiDomesticThirdTierPrice(data, { force: false });
      if (domesticThirdTierPrice) {
        cacheDomesticTierPrice(data && data.sku, data, domesticThirdTierPrice, 'plm-api-domestic-third-tier');
        state.excelPurchasePrice = domesticThirdTierPrice;
        state.excelStatus = '\u56fd\u5185\u4e09\u6863\u4ef7\u683c: ' + domesticThirdTierPrice;
        return true;
      }
    } catch (error) {
      addLog('info', '\u56fd\u5185\u4e09\u6863\u4ef7\u683c\u8bfb\u53d6\u5931\u8d25\uff0c\u7ee7\u7eed\u4f7f\u7528\u672c\u5730\u4ef7\u683c', (data && data.sku || '') + ' | ' + formatErrorMessage(error));
    }
    const productType = getProductTypeForInsight(data, extra);
    // 2026-08-07: 停用云端推荐价格 API，避免不准确的推荐写入 Excel。
    // 价格补全只使用本地历史推荐，避免 Excel 出现错误价格。
    const effectiveProductType = productType;
    const recommendation = getLocalPriceRecommendation(data, effectiveProductType);
    const price = recommendation && recommendation.recommendedPrice ? String(recommendation.recommendedPrice) : '';
    if (!price) return false;
    const reason = recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, effectiveProductType);
    const confidenceText = recommendation.priceConfidence || recommendation.recommendationConfidence || '';
    const priceStatsText = formatRecommendationPriceStats(recommendation.priceStats);
    state.excelPurchasePrice = price;
    state.excelStatus = '\u63a8\u8350\u4ef7\u683c: ' + price + (effectiveProductType ? ' / ' + effectiveProductType : '') + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (recommendation.source ? ' / ' + recommendation.source : '') + (reason ? ' / ' + reason : '');
    addLog('success', '\u5df2\u667a\u80fd\u8865\u5168\u91c7\u8d2d\u4ef7\u683c', (data && data.sku || '') + ' ' + effectiveProductType + ' ' + price + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (priceStatsText ? ' / ' + priceStatsText : '') + (reason ? ' / ' + reason : ''));
    syncInsightEvent('recommendation', {
      sku: data && data.sku || '',
      brand: data && data.brand || '',
      name: data && data.name || '',
      productType: effectiveProductType || productType || '',
      price,
      recommendedPrice: price,
      source: recommendation.source || 'recommendation',
      reason,
      recommendationReason: reason,
      productTypeSource: recommendation.productTypeSource || '',
      productTypeScore: recommendation.productTypeScore || '',
      typeSampleCount: recommendation.typeSampleCount || '',
      recommendedProductType: recommendation.recommendedProductType || '',
      effectiveProductType,
      priceConfidence: confidenceText,
      recommendationConfidence: confidenceText,
      priceStats: recommendation.priceStats || null,
    });
    return true;
  }

  function formatRecommendationPriceStats(stats) {
    if (!stats || !stats.count) return '';
    return '\u6837\u672c' + stats.count + ' / \u4e2d\u4f4d' + stats.median + ' / \u5747\u4ef7' + stats.avg + ' / \u533a\u95f4' + stats.min + '-' + stats.max;
  }

  function buildLocalRecommendationReason(recommendation, productType) {
    if (!recommendation || !recommendation.recommendedPrice) return '';
    if (recommendation.source === 'local-same-sku') return '\u672c\u5730\u540c SKU \u5386\u53f2\u4ef7';
    if (recommendation.source === 'local-same-type') return '\u672c\u5730\u540c\u7c7b\u578b\u5386\u53f2\u4ef7' + (productType ? '\uff1a' + productType : '');
    if (recommendation.source === 'local-name') return '\u672c\u5730\u76f8\u4f3c\u5546\u54c1\u540d\u5386\u53f2\u4ef7';
    return '';
  }

  function getLocalPriceRecommendation(data, productType) {
    const history = state.insights && Array.isArray(state.insights.priceHistory) ? state.insights.priceHistory : [];
    if (!history.length || !data) return null;
    const sku = String(data.sku || '');
    const name = String(data.name || '').trim();
    const valid = history.map((item) => ({
      ...item,
      numericPrice: Number(String(item.price || '').replace(/[^0-9.]/g, '')),
    })).filter((item) => item.numericPrice > 0);
    const sameSku = valid.find((item) => sku && item.sku === sku);
    if (sameSku) return { recommendedPrice: sameSku.numericPrice, source: 'local-same-sku' };
    const sameType = valid.find((item) => productType && item.productType === productType);
    if (sameType) return { recommendedPrice: sameType.numericPrice, source: 'local-same-type' };
    const sameName = valid.find((item) => name && String(item.name || '').includes(name.slice(0, 8)));
    if (sameName) return { recommendedPrice: sameName.numericPrice, source: 'local-name' };
    return null;
  }

  function getReturnDateText(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return '\uff08' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '\uff09';
  }
