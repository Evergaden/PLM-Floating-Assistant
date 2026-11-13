
  async function tryHydrateCopywritingFromApi(sku, options) {
    const opts = options || {};
    const normalizedSku = String(sku || '').trim();
    if (!normalizedSku) return { handled: false };
    const updateStatus = (message) => {
      if (typeof opts.onStatus === 'function') opts.onStatus(message);
    };
    const workingData = normalizeData(opts.data || loadData(normalizedSku) || { sku: normalizedSku });
    const cached = normalizeCopywritingRecord(workingData.copywriting);
    let file;
    try {
      updateStatus('正在通过 PLM API 定位产品文案 Word...');
      file = await fetchApiCopywritingFile(workingData, { force: Boolean(opts.force) });
    } catch (error) {
      addLog('warn', '产品文案：定位失败，改用页面下载', normalizedSku + ' | ' + formatErrorMessage(error));
      return { handled: false, error };
    }
    if (!file || !file.found) return { handled: false, noFile: true };
    const fileName = file.fileName;
    const fileTimestamp = file.fileTimestamp || '';
    const sameFile = Boolean(cached && cached.fullText
      && cached.parserVersion === COPYWRITING_PARSER_VERSION
      && compactText(cached.fileName).toLowerCase() === compactText(fileName).toLowerCase());
    if (!opts.force && sameFile) {
      const next = markCopywritingCheckedAt(workingData, cached, Date.now());
      addLog('info', '产品文案：命中历史缓存', normalizedSku + ' | ' + fileName);
      return { handled: true, skipped: true, data: next, file };
    }
    if (!opts.force && cached && cached.fileTimestamp && fileTimestamp && fileTimestamp < cached.fileTimestamp) {
      const next = markCopywritingCheckedAt(workingData, cached, Date.now());
      addLog('warn', '产品文案：当前 Word 早于缓存，保留较新文案', normalizedSku + ' | ' + fileName + ' < ' + cached.fileName);
      return { handled: true, skipped: true, older: true, data: next, file };
    }
    try {
      updateStatus('正在通过 API 下载 Word ' + fileName);
      const arrayBuffer = await withCopywritingTimeout(downloadCopywritingDocument(file.url), 18000, 'API Word 文件读取');
      if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('后台返回内容不是有效 Word 文件');
      updateStatus('正在解析 API Word 表格...');
      addLog('info', '产品文案：开始解析 Word', normalizedSku + ' | ' + fileName + ' | ' + arrayBuffer.byteLength + 'B');
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      const parsedDocument = await withCopywritingTimeout(parseCopywritingDocxRows(arrayBuffer), 20000, 'API Word 表格解析');
      const built = buildMainstreamCopywriting(parsedDocument, workingData);
      if (!built.sections.length) throw new Error('后台 Word 中未识别到主流版文案字段');
      const nextRecord = buildCopywritingRecord(fileName, fileTimestamp, fileHash, built, cached);
      const next = mergeCopywritingCacheIntoData(workingData, nextRecord);
      saveData(normalizedSku, next);
      const updated = Boolean(cached && cached.fullText && nextRecord.updatePending && (
        nextRecord.fileHash !== cached.fileHash
        || nextRecord.fileName !== cached.fileName
        || nextRecord.fullText !== cached.fullText
      ));
      addLog('info', updated ? '产品文案：检测到更新' : '产品文案：读取成功', normalizedSku + ' | ' + fileName + ' | ' + built.sections.length + '段');
      return { handled: true, data: next, updated, file };
    } catch (error) {
      addLog('warn', '产品文案：Word 读取失败，改用页面下载', normalizedSku + ' | ' + formatErrorMessage(error));
      return { handled: false, error, file };
    }
  }

  async function openCopywritingFromCurrent(force) {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast('请先选择一个产品');
      return;
    }
    const sku = data.sku;
    const currentCached = normalizeCopywritingRecord(data.copywriting);
    const hasImmediateCopywriting = Boolean(currentCached && currentCached.fullText);
    if (!state.copywritingMode) state.copywritingView = 'file';
    state.copywritingMode = true;
    state.copywritingLoading = !hasImmediateCopywriting;
    state.copywritingChecking = true;
    state.copywritingError = '';
    state.copywritingStatus = hasImmediateCopywriting ? '正在检查新文案...' : '正在读取本地缓存...';
    stopScan();
    stopMaterialWatch();
    cancelDrawerTabFlow();
    expandPanel();
    await wait(COPYWRITING_CACHE_DEBOUNCE_MS);
    const storedData = hasImmediateCopywriting ? data : normalizeData(loadData(sku) || data);
    const storedCached = normalizeCopywritingRecord(storedData.copywriting);
    const initialCached = (currentCached && currentCached.fullText ? currentCached : null)
      || (storedCached && storedCached.fullText ? storedCached : null)
      || currentCached
      || storedCached;
    const hasCachedCopywriting = Boolean(initialCached && initialCached.fullText);
    const skipRecentCopywritingCheck = !force && hasCachedCopywriting
      && initialCached.parserVersion === COPYWRITING_PARSER_VERSION
      && isCopywritingCheckFresh(initialCached);
    if (initialCached && initialCached.fullText && !hasImmediateCopywriting) {
      state.data = normalizeData({ ...state.data, copywriting: initialCached });
    }
    if (skipRecentCopywritingCheck) {
      state.copywritingLoading = false;
      state.copywritingChecking = false;
      state.copywritingStatus = '';
      state.copywritingError = '';
      addLog('info', '产品文案：30分钟内已检查，跳过重复检查', sku);
      renderShell();
      return;
    }
    if (initialCached && initialCached.fullText && !hasImmediateCopywriting) {
      state.copywritingLoading = false;
      state.copywritingStatus = '正在检查新文案...';
      state.copywritingChecking = true;
      renderShell();
    }
    addLog('info', '产品文案：开始读取', sku + (force ? ' 重新获取' : ''));
    try {
      const apiResult = await tryHydrateCopywritingFromApi(sku, {
        force: Boolean(force),
        data: normalizeData(loadData(sku) || state.data || data),
        onStatus: (message) => {
          state.copywritingStatus = message;
          renderShell();
        },
      });
      if (apiResult && apiResult.handled) {
        state.data = normalizeData(apiResult.data || loadData(sku) || data);
        state.copywritingStatus = '';
        state.copywritingError = '';
        if (!apiResult.skipped) showToast(apiResult.updated ? '文案已更新，差异已高亮' : '文案读取成功');
        renderShell();
        return;
      }
      if (apiResult && apiResult.noFile) {
        state.data = normalizeData(loadData(sku) || state.data || data);
        state.copywritingLoading = false;
        state.copywritingChecking = false;
        state.copywritingStatus = '';
        state.copywritingError = '';
        addLog('info', '产品文案：未找到 Word，不再读取页面附件', sku);
        renderShell();
        return;
      }
      let drawer = getProjectDrawerForSku(sku);
      if (!drawer) {
        await openSelectedProjectDetail({ preserveCopywriting: hasCachedCopywriting });
        drawer = await waitFor(() => getProjectDrawerForSku(sku), 6000, 150);
      }
      if (!drawer) throw new Error('未打开当前编码的项目详情');
      stopScan();
      state.copywritingStatus = '正在定位产品信息里的产品文案...';
      renderShell();
      await switchDrawerTab(drawer, L.productTab);
      const productReady = await waitFor(() => {
        const tab = findTabButton(drawer, L.productTab);
        return tab && isActiveTab(tab);
      }, 5000, 120);
      if (!productReady) throw new Error('无法切换到产品信息');
      const item = await waitFor(() => findProductCopywritingItem(drawer), 5000, 160);
      if (!item) throw new Error('产品信息中未找到“产品文案”字段');
      const file = findProductCopywritingFile(item, sku);
      if (!file) throw new Error('产品文案字段中未找到当前编码的 Word 文件');
      let workingData = normalizeData(loadData(sku) || state.data || data);
      let cached = normalizeCopywritingRecord(workingData.copywriting);
      if (cached && cached.fullText) {
        workingData = markCopywritingCheckedAt(workingData, cached, Date.now());
        cached = normalizeCopywritingRecord(workingData.copywriting);
      }
      const fileTimestamp = extractCopywritingFileTimestamp(file.fileName);
      if (!force && cached && cached.fullText && cached.parserVersion === COPYWRITING_PARSER_VERSION && compactText(cached.fileName).toLowerCase() === compactText(file.fileName).toLowerCase()) {
        state.data = workingData;
        state.copywritingStatus = '';
        state.copywritingError = '';
        addLog('info', '产品文案：命中历史缓存', file.fileName);
        return;
      }
      if (!force && cached && cached.fileTimestamp && fileTimestamp && fileTimestamp < cached.fileTimestamp) {
        state.copywritingError = '页面中的 Word 版本早于缓存，已保留较新的文案';
        addLog('warn', '产品文案：检测到旧附件', file.fileName + ' < ' + cached.fileName);
        return;
      }
      if (!hasCachedCopywriting) state.copywritingLoading = true;
      state.copywritingStatus = '正在触发 Word 下载 ' + file.fileName;
      renderShell();
      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, 'Word 下载监听');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('未读取到 Word 文件内容');
      addLog('info', '产品文案：已取得文件内容', source.arrayBuffer ? '内存 Word 数据' : String(source.url || '').replace(/\?.*$/, '?...'));
      let arrayBuffer;
      try {
        state.copywritingStatus = source.arrayBuffer ? '正在校验 Word 文件...' : '正在读取 Word 文件...';
        renderShell();
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, 'Word 文件读取');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('读取到的内容不是有效 Word 文件');
      } catch (error) {
        if (source.kind === 'captured') throw error;
        addLog('warn', '产品文案：组件地址不可直接读取，改用下载监听', formatErrorMessage(error));
        state.copywritingStatus = '正在重新监听 Word 下载...';
        renderShell();
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '备用下载监听')), kind: 'captured' };
        if (!source.url && !source.arrayBuffer) throw error;
        state.copywritingStatus = source.arrayBuffer ? '正在校验 Word 文件...' : '正在读取 Word 文件...';
        renderShell();
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '备用 Word 文件读取');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('下载监听取得的内容不是有效 Word 文件');
      }
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      state.copywritingStatus = '正在解析 Word 表格...';
      renderShell();
      addLog('info', '产品文案：开始解析 Word', file.fileName + ' | ' + arrayBuffer.byteLength + 'B');
      const parsedDocument = await withCopywritingTimeout(parseCopywritingDocxRows(arrayBuffer), 20000, 'Word 表格解析');
      const built = buildMainstreamCopywriting(parsedDocument, workingData);
      if (!built.sections.length) throw new Error('Word 中未识别到主流版文案字段');
      const next = buildCopywritingRecord(file.fileName, fileTimestamp, fileHash, built, cached);
      saveData(sku, mergeCopywritingCacheIntoData(workingData, next));
      state.copywritingStatus = '';
      state.copywritingError = '';
      const updated = Boolean(cached && cached.fullText && next.updatePending && (
        next.fileHash !== cached.fileHash
        || next.fileName !== cached.fileName
        || next.fullText !== cached.fullText
      ));
      addLog('info', updated ? '产品文案：检测到更新' : '产品文案：读取成功', file.fileName + ' ' + built.sections.length + '段');
      showToast(updated ? '文案已更新，差异已高亮' : '文案读取成功');
    } catch (error) {
      state.copywritingError = formatErrorMessage(error) || '产品文案读取失败';
      addLog('error', '产品文案读取失败', sku + ' ' + state.copywritingError);
      showToast('产品文案读取失败');
    } finally {
      state.copywritingLoading = false;
      state.copywritingChecking = false;
      renderShell();
    }
  }

  function switchDetailViewTab(nextView) {
    const target = normalizeDetailViewTab(nextView);
    const current = getCurrentDetailViewTab();
    if (target === 'sizeImage' && !state.sizeImageAccessEnabled) {
      showToast(state.sizeImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待');
      return;
    }
    if (target === 'parameterImage' && !state.parameterImageAccessEnabled) {
      showToast(state.parameterImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待');
      scheduleParameterImageAccessRefresh(0);
      return;
    }
    if (target === current) return;
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast('请先从左侧选择 SKU');
      return;
    }
    state.detailViewPreviousTab = current;
    state.selectedSku = data.sku;
    state.data = data;
    if (target === 'copywriting') {
      state.view = 'detail';
      state.copywritingMode = false;
      openCopywritingFromCurrent(false);
      return;
    }
    state.copywritingMode = false;
    state.view = target;
    if (target === 'parameterImage') parameterImageFeature.loadRules();
    expandPanel();
  }

  function acknowledgeCopywritingUpdate() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (!data || !data.sku || !record) return;
    const next = {
      ...record,
      updatePending: false,
      changedSectionKeys: [],
      removedSections: [],
      previousSections: [],
    };
    saveData(data.sku, { ...data, copywriting: next });
    showToast('已标记为查看');
    renderShell();
  }

  async function hydrateCopywritingForSku(sku, options) {
    const opts = options || {};
    const resultGeneration = Number(state.skuResultGeneration[sku] || 0);
    if (!sku || state.copywritingHydratingSkus.has(sku)) return normalizeData(loadData(sku) || {});
    const failedAt = Number(state.copywritingHydrateFailedAt[sku] || 0);
    if (!opts.force && failedAt && Date.now() - failedAt < 10 * 60 * 1000) return normalizeData(loadData(sku) || {});
    const recentData = normalizeData(loadData(sku) || {});
    const recentRecord = normalizeCopywritingRecord(recentData.copywriting);
    if (!opts.force && recentRecord && recentRecord.parserVersion === COPYWRITING_PARSER_VERSION && isCopywritingCheckFresh(recentRecord)) return recentData;
    state.copywritingHydratingSkus.add(sku);
    let drawer = null;
    let originalTab = '';
    try {
      if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
      const apiResult = await tryHydrateCopywritingFromApi(sku, {
        force: Boolean(opts.force),
        data: recentData,
        onStatus: !opts.silent ? (message) => {
          state.copywritingStatus = message;
          renderShell();
        } : null,
      });
      if (apiResult && apiResult.handled) {
        delete state.copywritingHydrateFailedAt[sku];
        return normalizeData(apiResult.data || loadData(sku) || recentData);
      }
      if (apiResult && apiResult.noFile) return recentData;
      drawer = opts.drawer || getProjectDrawerForSku(sku);
      if (!drawer || drawer !== getProjectDrawerForSku(sku)) return normalizeData(loadData(sku) || {});
      originalTab = getActiveTabText(drawer);
      if (opts.silent && !opts.file && getActiveTabText(drawer) !== L.productTab && !(apiResult && apiResult.error)) return normalizeData(loadData(sku) || {});
      if (!opts.file) await switchDrawerTab(drawer, L.productTab);
      if (!opts.file) await waitFor(() => findProductCopywritingItem(drawer), 5000, 160);
      const item = opts.file ? null : findProductCopywritingItem(drawer);
      if (!opts.file && !item) return normalizeData(loadData(sku) || {});
      const file = opts.file || findProductCopywritingFile(item, sku);
      if (!file) return normalizeData(loadData(sku) || {});
      const cached = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      const oldRecord = normalizeCopywritingRecord(cached.copywriting);
      const sameFile = oldRecord && oldRecord.fullText
        && oldRecord.parserVersion === COPYWRITING_PARSER_VERSION
        && compactText(oldRecord.fileName).toLowerCase() === compactText(file.fileName).toLowerCase();
      if (!opts.force && isCopywritingCheckFresh(oldRecord)) return cached;
      const fileTimestamp = extractCopywritingFileTimestamp(file.fileName);
      if (!opts.force && sameFile) return markCopywritingCheckedAt(cached, oldRecord, Date.now());
      if (!opts.force && oldRecord && oldRecord.fileTimestamp && fileTimestamp && fileTimestamp < oldRecord.fileTimestamp) return markCopywritingCheckedAt(cached, oldRecord, Date.now());

      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, '\u4ea7\u54c1\u6587\u6848 Word \u4e0b\u8f7d\u76d1\u542c');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('\u672a\u8bfb\u53d6\u5230\u4ea7\u54c1\u6587\u6848 Word');
      let arrayBuffer;
      try {
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '\u4ea7\u54c1\u6587\u6848 Word \u8bfb\u53d6');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('\u8bfb\u53d6\u5230\u7684\u5185\u5bb9\u4e0d\u662f\u6709\u6548 Word \u6587\u4ef6');
      } catch (error) {
        if (source.kind === 'captured') throw error;
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '\u5907\u7528\u4ea7\u54c1\u6587\u6848 Word \u4e0b\u8f7d\u76d1\u542c')), kind: 'captured' };
        arrayBuffer = source.arrayBuffer || (source.url ? await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '\u5907\u7528\u4ea7\u54c1\u6587\u6848 Word \u8bfb\u53d6') : null);
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw error;
      }
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      const parsedDocument = await withCopywritingTimeout(parseCopywritingDocxRows(arrayBuffer), 20000, '\u4ea7\u54c1\u6587\u6848 Word \u8868\u683c\u89e3\u6790');
      const built = buildMainstreamCopywriting(parsedDocument, cached);
      if (!built.sections.length) throw new Error('Word \u4e2d\u672a\u8bc6\u522b\u5230\u4e3b\u6d41\u7248\u6587\u6848\u5b57\u6bb5');
      const nextRecord = buildCopywritingRecord(file.fileName, fileTimestamp, fileHash, built, oldRecord);
      const next = mergeCopywritingCacheIntoData(cached, nextRecord);
      if (drawer !== getProjectDrawerForSku(sku) || Number(state.skuResultGeneration[sku] || 0) !== resultGeneration) return normalizeData(loadData(sku) || {});
      saveData(sku, next);
      delete state.copywritingHydrateFailedAt[sku];
      addLog('success', '\u4ea7\u54c1\u6587\u6848\u9759\u9ed8\u7f13\u5b58\u5b8c\u6210', sku + ' | ' + file.fileName);
      return next;
    } catch (error) {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) {
        state.copywritingHydrateFailedAt[sku] = Date.now();
        addLog('warn', '\u4ea7\u54c1\u6587\u6848\u9759\u9ed8\u8bfb\u53d6\u5931\u8d25', sku + ' | ' + formatErrorMessage(error));
      }
      return normalizeData(loadData(sku) || {});
    } finally {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) state.copywritingHydratingSkus.delete(sku);
      const currentDrawer = getProjectDrawerForSku(sku);
      if (!opts.silent && currentDrawer && originalTab && getActiveTabText(currentDrawer) !== originalTab) await switchDrawerTab(currentDrawer, originalTab);
    }
  }

  async function hydrateIngredientPdfFromApi(sku, options) {
    const opts = options || {};
    let file = opts.apiFile || null;
    try {
      if (!file) file = await fetchApiIngredientPdfFile({ sku }, { force: Boolean(opts.force) });
    } catch (error) {
      addLog('warn', '成分表：定位失败，改用页面附件', sku + ' | ' + formatErrorMessage(error));
      return { handled: false, error };
    }
    if (!file || !file.found) return { handled: false, noFile: true };
    if (!file.url) throw new Error('成分表附件缺少下载地址');
    const cached = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    const fileName = String(file.fileName || ('ingredient-' + sku + '.pdf')).trim();
    if (!opts.force && cached.ingredientNormalizerVersion === INGREDIENT_NORMALIZER_VERSION && cached.ingredientPdfFileName === fileName && cached.ingredientEnglish && cached.ingredientChinese) {
      addLog('info', '成分表：命中历史缓存', sku + ' | ' + fileName);
      return { handled: true, skipped: true, data: cached, file };
    }
    try {
      const arrayBuffer = await withCopywritingTimeout(downloadCopywritingDocument(file.url), 18000, 'API 成分表 PDF 读取');
      if (!isPdfBuffer(arrayBuffer)) throw new Error('后台返回内容不是有效 PDF');
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      if (!opts.force && cached.ingredientNormalizerVersion === INGREDIENT_NORMALIZER_VERSION && cached.ingredientPdfHash === fileHash && cached.ingredientEnglish && cached.ingredientChinese) {
        const next = cached.ingredientPdfFileName === fileName ? cached : normalizeData({ ...cached, ingredientPdfFileName: fileName, ingredientSource: 'ingredientPdfApi' });
        saveData(sku, next, { suppressDataQuality: true });
        return { handled: true, skipped: true, data: next, file };
      }
      let rawText = '';
      try {
        rawText = await withCopywritingTimeout(extractIngredientPdfText(arrayBuffer), 20000, 'API 成分表 PDF 解析');
      } catch (error) {
        addLog('warn', '成分表：PDF 文本层不可用', sku + ' | 将转为图片交给 AI | ' + formatErrorMessage(error));
      }
      const requestBody = { sku, fileName, rawText };
      if (!rawText || rawText.length < 20) {
        try {
          requestBody.pageImages = await withCopywritingTimeout(renderIngredientPdfImages(arrayBuffer), 25000, 'API 成分表 PDF 转图片');
        } catch (error) {
          addLog('warn', '成分表：PDF 转图片失败，改用 AI 直接读取 PDF', sku + ' | ' + formatErrorMessage(error));
        }
        requestBody.pdfBase64 = arrayBufferToBase64(arrayBuffer);
      }
      const response = await cloudRequest('/ingredients/normalize', { method: 'POST', timeoutMs: 90000, body: requestBody });
      if (!response || !response.ok || !response.english || !response.chinese) throw new Error(response && response.error ? response.error : 'AI 未返回有效成分');
      const next = normalizeData({
        ...cached,
        ingredientEnglish: String(response.english || '').slice(0, 8000),
        ingredientChinese: String(response.chinese || '').slice(0, 8000),
        ingredientItems: Array.isArray(response.items) ? response.items.slice(0, 100) : [],
        ingredientPdfFileName: fileName,
        ingredientPdfHash: fileHash,
        ingredientPdfModel: String(response.model || ''),
        ingredientPdfUpdatedAt: new Date().toLocaleString(),
        ingredientNormalizerVersion: String(response.normalizerVersion || INGREDIENT_NORMALIZER_VERSION),
        ingredientSource: 'ingredientPdfApi',
      });
      const drawer = opts.drawer || getProjectDrawerForSku(sku);
      if (opts.drawer && (drawer !== getProjectDrawerForSku(sku) || Number(state.skuResultGeneration[sku] || 0) !== Number(opts.resultGeneration || state.skuResultGeneration[sku] || 0))) return { handled: true, data: normalizeData(loadData(sku) || {}) };
      saveData(sku, next, { suppressDataQuality: true });
      const clearedCopywritingError = state.toyCopywritingErrorSku === sku && state.toyCopywritingErrorKind === 'ingredient-cache' && Boolean(state.toyCopywritingError);
      if (clearedCopywritingError) {
        clearToyCopywritingError(sku);
        if (state.selectedSku === sku) renderShell();
        showToast('成分表缓存已获取，现在可以重试智能补充食品文案');
      }
      delete state.ingredientHydrateFailedAt[sku];
      addLog('success', '成分表缓存完成', sku + ' | ' + next.ingredientEnglish);
      return { handled: true, data: next, file };
    } catch (error) {
      addLog('warn', '成分表：读取失败，改用页面附件', sku + ' | ' + formatErrorMessage(error));
      return { handled: false, error, file };
    }
  }

  async function hydrateIngredientPdfForSku(sku, options) {
    const opts = options || {};
    const resultGeneration = Number(state.skuResultGeneration[sku] || 0);
    if (!sku || state.ingredientHydratingSkus.has(sku)) return normalizeData(loadData(sku) || {});
    const failedAt = Number(state.ingredientHydrateFailedAt[sku] || 0);
    if (!opts.force && failedAt && Date.now() - failedAt < 10 * 60 * 1000) return normalizeData(loadData(sku) || {});
    const drawer = opts.drawer || getProjectDrawerForSku(sku);
    if (!drawer && opts.preferApi === false) return normalizeData(loadData(sku) || {});
    if (drawer && drawer !== getProjectDrawerForSku(sku) && opts.preferApi === false) return normalizeData(loadData(sku) || {});
    state.ingredientHydratingSkus.add(sku);
    const originalTab = drawer ? getActiveTabText(drawer) : '';
    try {
      let apiResult = null;
      if (opts.preferApi !== false) {
        apiResult = await hydrateIngredientPdfFromApi(sku, { ...opts, drawer, resultGeneration, apiFile: opts.apiFile || null });
        if (apiResult && apiResult.handled) return apiResult.data || normalizeData(loadData(sku) || {});
        if (apiResult && apiResult.noFile) return normalizeData(loadData(sku) || {});
      }
      if (!drawer || drawer !== getProjectDrawerForSku(sku)) return normalizeData(loadData(sku) || {});
      if (opts.silent && !opts.file && getActiveTabText(drawer) !== L.productTab && !(apiResult && apiResult.error)) return normalizeData(loadData(sku) || {});
      if (!opts.file) await switchDrawerTab(drawer, L.productTab);
      if (!opts.file) await waitFor(() => findIngredientPdfItem(drawer), 3500, 140);
      const item = opts.file ? null : findIngredientPdfItem(drawer);
      if (!opts.file && !item) return normalizeData(loadData(sku) || {});
      const file = opts.file || findIngredientPdfFile(item);
      if (!file) return normalizeData(loadData(sku) || {});
      const cached = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      if (!opts.force && cached.ingredientNormalizerVersion === INGREDIENT_NORMALIZER_VERSION && cached.ingredientPdfFileName === file.fileName && cached.ingredientEnglish && cached.ingredientChinese) return cached;

      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, '成分表 PDF 下载监听');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('未读取到成分表 PDF');
      let arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '成分表 PDF 读取');
      if (!isPdfBuffer(arrayBuffer) && source.kind !== 'captured') {
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '备用成分表 PDF 下载监听')), kind: 'captured' };
        arrayBuffer = source.arrayBuffer || (source.url ? await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '备用成分表 PDF 读取') : null);
      }
      if (!isPdfBuffer(arrayBuffer)) throw new Error('读取到的内容不是有效 PDF');
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      if (!opts.force && cached.ingredientNormalizerVersion === INGREDIENT_NORMALIZER_VERSION && cached.ingredientPdfHash === fileHash && cached.ingredientEnglish && cached.ingredientChinese) {
        if (cached.ingredientPdfFileName !== file.fileName && drawer === getProjectDrawerForSku(sku) && Number(state.skuResultGeneration[sku] || 0) === resultGeneration) saveData(sku, { ...cached, ingredientPdfFileName: file.fileName });
        return cached;
      }
      let rawText = '';
      try {
        rawText = await withCopywritingTimeout(extractIngredientPdfText(arrayBuffer), 20000, '成分表 PDF 解析');
      } catch (error) {
        addLog('warn', '成分表 PDF 文本层不可用', sku + ' | 将转为图片交给魔搭读取 | ' + formatErrorMessage(error));
      }
      const requestBody = { sku, fileName: file.fileName, rawText };
      if (!rawText || rawText.length < 20) {
        try {
          requestBody.pageImages = await withCopywritingTimeout(renderIngredientPdfImages(arrayBuffer), 25000, '成分表 PDF 转图片');
        } catch (error) {
          addLog('warn', '成分表 PDF 转图片失败', sku + ' | 将回退 Gemini 直接读取 PDF | ' + formatErrorMessage(error));
        }
        requestBody.pdfBase64 = arrayBufferToBase64(arrayBuffer);
      }
      const response = await cloudRequest('/ingredients/normalize', {
        method: 'POST',
        timeoutMs: 90000,
        body: requestBody,
      });
      if (!response || !response.ok || !response.english || !response.chinese) throw new Error(response && response.error ? response.error : 'AI 未返回有效成分');
      const next = normalizeData({
        ...cached,
        ingredientEnglish: String(response.english || '').slice(0, 8000),
        ingredientChinese: String(response.chinese || '').slice(0, 8000),
        ingredientItems: Array.isArray(response.items) ? response.items.slice(0, 100) : [],
        ingredientPdfFileName: file.fileName,
        ingredientPdfHash: fileHash,
        ingredientPdfModel: String(response.model || ''),
        ingredientPdfUpdatedAt: new Date().toLocaleString(),
        ingredientNormalizerVersion: String(response.normalizerVersion || INGREDIENT_NORMALIZER_VERSION),
        ingredientSource: 'ingredientPdf',
      });
      if (drawer !== getProjectDrawerForSku(sku) || Number(state.skuResultGeneration[sku] || 0) !== resultGeneration) return normalizeData(loadData(sku) || {});
      saveData(sku, next);
      const clearedCopywritingError = state.toyCopywritingErrorSku === sku && state.toyCopywritingErrorKind === 'ingredient-cache' && Boolean(state.toyCopywritingError);
      if (clearedCopywritingError) {
        clearToyCopywritingError(sku);
        if (state.selectedSku === sku) renderShell();
        showToast('\u6210\u5206\u8868\u7f13\u5b58\u5df2\u83b7\u53d6\uff0c\u73b0\u5728\u53ef\u4ee5\u91cd\u8bd5\u667a\u80fd\u8865\u5145\u98df\u54c1\u6587\u6848');
      }
      delete state.ingredientHydrateFailedAt[sku];
      addLog('success', '成分表静默缓存完成', sku + ' | ' + next.ingredientEnglish);
      return next;
    } catch (error) {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) {
        state.ingredientHydrateFailedAt[sku] = Date.now();
        addLog('warn', '成分表静默读取失败', sku + ' | ' + formatErrorMessage(error));
      }
      return normalizeData(loadData(sku) || {});
    } finally {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) state.ingredientHydratingSkus.delete(sku);
      const currentDrawer = getProjectDrawerForSku(sku);
      if (!opts.silent && currentDrawer && originalTab && getActiveTabText(currentDrawer) !== originalTab) await switchDrawerTab(currentDrawer, originalTab);
    }
  }

  function findIngredientPdfItem(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => {
        const label = item.querySelector('.ant-form-item-label');
        return /^(?:成份表|成分表)$/.test(compactText(label && (label.innerText || label.textContent)).replace(/[：:*]/g, ''));
      }) || null;
  }

  function findIngredientPdfFile(item) {
    const cards = Array.from(item.querySelectorAll('.filePreviewMainBox, .filePreviewCard, .removeOtherContent'))
      .filter(isVisibleElement)
      .map((card) => ({ card, fileName: extractPdfFileName(card) }))
      .filter((entry) => /\.pdf$/i.test(entry.fileName));
    const unique = cards.filter((entry, index) => cards.findIndex((candidate) => candidate.fileName === entry.fileName) === index);
    return unique[0] || null;
  }

  function isPdfBuffer(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 4) return false;
    const bytes = new Uint8Array(arrayBuffer, 0, 4);
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }


  async function extractIngredientPdfText(arrayBuffer) {
    const Pdf = getLazyExternalRuntime('pdfjs') || await ensureLazyExternalScript('pdfjs').catch(() => null);
    if (!Pdf || typeof Pdf.getDocument !== 'function') throw new Error('PDF 解析组件未加载');
    if (Pdf.GlobalWorkerOptions && !Pdf.GlobalWorkerOptions.workerSrc) {
      Pdf.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    const task = Pdf.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
    const documentHandle = await task.promise;
    const pages = [];
    try {
      const pageCount = Math.min(Number(documentHandle.numPages) || 0, 12);
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await documentHandle.getPage(pageNumber);
        const content = await page.getTextContent();
        let line = '';
        const lines = [];
        (content.items || []).forEach((item) => {
          const value = String(item && item.str || '').trim();
          if (value) line += (line ? ' ' : '') + value;
          if (item && item.hasEOL && line) {
            lines.push(line);
            line = '';
          }
        });
        if (line) lines.push(line);
        pages.push(lines.join('\n'));
      }
    } finally {
      if (documentHandle && typeof documentHandle.destroy === 'function') await documentHandle.destroy();
    }
    return pages.join('\n\n').replace(/[ \t]+/g, ' ').trim().slice(0, 30000);
  }

  async function renderIngredientPdfImages(arrayBuffer) {
    const Pdf = getLazyExternalRuntime('pdfjs') || await ensureLazyExternalScript('pdfjs').catch(() => null);
    if (!Pdf || typeof Pdf.getDocument !== 'function') throw new Error('PDF 解析组件未加载');
    if (Pdf.GlobalWorkerOptions && !Pdf.GlobalWorkerOptions.workerSrc) {
      Pdf.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    const task = Pdf.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
    const documentHandle = await task.promise;
    const images = [];
    let totalLength = 0;
    try {
      const pageCount = Math.min(Number(documentHandle.numPages) || 0, 6);
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await documentHandle.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1800 / Math.max(1, baseViewport.width), 2400 / Math.max(1, baseViewport.height));
        const viewport = page.getViewport({ scale: Math.max(0.1, scale) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('无法创建 PDF 图片画布');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        const image = canvas.toDataURL('image/jpeg', 0.82);
        canvas.width = 1;
        canvas.height = 1;
        if (typeof page.cleanup === 'function') page.cleanup();
        if (image.length > 4500000 || (images.length && totalLength + image.length > 12000000)) break;
        images.push(image);
        totalLength += image.length;
      }
    } finally {
      if (documentHandle && typeof documentHandle.destroy === 'function') await documentHandle.destroy();
    }
    if (!images.length) throw new Error('PDF 页面未生成图片');
    return images;
  }

  function findProductCopywritingItem(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => {
        const label = item.querySelector('.ant-form-item-label');
        return compactText(label && (label.innerText || label.textContent)).replace(/[：:*]/g, '') === '产品文案';
      }) || null;
  }

  function findProductCopywritingFile(item, sku) {
    const cards = Array.from(item.querySelectorAll('.filePreviewMainBox, .filePreviewCard, .removeOtherContent'))
      .filter(isVisibleElement)
      .map((card) => ({ card, fileName: extractCopywritingFileName(card) }))
      .filter((entry) => /\.docx$/i.test(entry.fileName));
    const unique = cards.filter((entry, index) => cards.findIndex((candidate) => candidate.fileName === entry.fileName) === index);
    if (!unique.length) return null;
    const skuMatches = unique.filter((entry) => !sku || new RegExp(escapeRegExp(sku), 'i').test(entry.fileName));
    const pool = skuMatches.length ? skuMatches : (unique.length === 1 ? unique : []);
    if (!pool.length) return null;
    return pool.sort((a, b) => extractCopywritingFileTimestamp(b.fileName).localeCompare(extractCopywritingFileTimestamp(a.fileName)))[0];
  }

  function extractCopywritingFileName(card) {
    if (!card) return '';
    const titleSpans = Array.from(card.querySelectorAll('.title span, [class*="title"] span'))
      .map((el) => compactText(el.innerText || el.textContent))
      .filter((text) => /\.docx$/i.test(text));
    if (titleSpans.length) return titleSpans[titleSpans.length - 1];
    return ((compactText(card.innerText || card.textContent).match(/[^\n\\/:*?"<>|]+\.docx\b/i) || [])[0] || '').trim();
  }

  function extractPdfFileName(card) {
    if (!card) return '';
    const titleSpans = Array.from(card.querySelectorAll('.title span, [class*="title"] span'))
      .map((el) => compactText(el.innerText || el.textContent))
      .filter((text) => /\.pdf$/i.test(text));
    if (titleSpans.length) return titleSpans[titleSpans.length - 1];
    return ((compactText(card.innerText || card.textContent).match(/[^\n\\/:*?"<>|]+\.pdf\b/i) || [])[0] || '').trim();
  }

  function extractCopywritingFileTimestamp(fileName) {
    return ((String(fileName || '').match(/_(\d{14,17})(?=\.docx$)/i) || [])[1] || '');
  }

  async function resolveCopywritingDocumentSource(card, fileName) {
    const attachmentLabel = /\.pdf$/i.test(String(fileName || '')) ? '成分表' : '产品文案';
    const direct = findCopywritingUrlInCard(card);
    if (direct) {
      addLog('info', attachmentLabel + '：命中卡片地址', fileName + ' | ' + redactCopywritingUrl(direct));
      return { url: direct, arrayBuffer: null, kind: 'direct' };
    }
    addLog('info', attachmentLabel + '：未发现静态地址，直接监听下载动作', fileName);
    return { ...(await captureCopywritingDownloadSource(card, fileName)), kind: 'captured' };
  }

  function withCopywritingTimeout(promise, timeout, stage) {
    let timer = null;
    const limit = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error((stage || '产品文案处理') + '超时')), Math.max(1000, Number(timeout) || 12000));
    });
    return Promise.race([Promise.resolve(promise), limit]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  function redactCopywritingUrl(value) {
    return String(value || '').replace(/\?.*$/, '?...').slice(0, 500);
  }

  function findCopywritingUrlInCard(card) {
    if (!card) return '';
    const attrs = ['href', 'src', 'data-url', 'data-src', 'data-file-url', 'data-download-url', 'download-url'];
    const nodes = [card].concat(Array.from(card.querySelectorAll('*')));
    for (const node of nodes) {
      for (const name of attrs) {
        const value = node.getAttribute && node.getAttribute(name);
        const url = normalizeCopywritingUrl(value);
        if (url && isUsableCopywritingUrl(url)) return url;
      }
    }
    const html = String(card.outerHTML || '').replace(/&amp;/g, '&');
    const urls = html.match(/https?:\/\/[^"'<>\s]+/g) || [];
    return urls.map(normalizeCopywritingUrl).find(isUsableCopywritingUrl) || '';
  }

  function normalizeCopywritingUrl(value) {
    const text = String(value || '').trim().replace(/&amp;/g, '&').replace(/\\\//g, '/');
    if (!text || /^(?:data:|javascript:)/i.test(text) || /filePic\/word\.png/i.test(text)) return '';
    if (/^(?:https?:|blob:)/i.test(text)) return text;
    if (/^\/\//.test(text)) return location.protocol + text;
    if (/^\//.test(text)) return location.origin + text;
    return '';
  }

  function isUsableCopywritingUrl(url) {
    const text = String(url || '');
    return /^blob:/i.test(text) || (/^https?:/i.test(text) && /(?:\.(?:docx|pdf)(?:\?|$)|download|attachment)/i.test(text));
  }

  function scoreCopywritingUrl(url, fileName) {
    const text = String(url || '').toLowerCase();
    if (!text || /filepic\/word\.png|data:image/i.test(text)) return -100;
    let score = /^(?:https?:|blob:)/i.test(text) ? 1 : 0;
    if (/^blob:/i.test(text)) score += 100;
    if (/\.docx(?:\?|$)/i.test(text)) score += 90;
    if (/\.pdf(?:\?|$)/i.test(text)) score += 90;
    if (/download|attachment/i.test(text)) score += 45;
    if (/file(?:\/|=|\?|_)/i.test(text)) score += 18;
    if (/oss|object|storage/i.test(text)) score += 10;
    const normalizedName = String(fileName || '').toLowerCase();
    if (normalizedName && (text.includes(normalizedName) || text.includes(encodeURIComponent(normalizedName).toLowerCase()))) score += 80;
    return score;
  }


  async function captureCopywritingDownloadSource(card, fileName) {
    const wantsPdf = /\.pdf$/i.test(String(fileName || ''));
    const attachmentLogLabel = wantsPdf ? '成分表' : '产品文案';
    if (!card) {
      addLog('error', attachmentLogLabel + '：下载监听失败', '附件卡片不存在');
      return { url: '', arrayBuffer: null };
    }
    // PLM only reveals this control on hover, but HTMLElement.click() works while it is hidden.
    const control = card.querySelector('.delBtn .anticon-vertical-align-bottom, .delBtn [aria-label="vertical-align-bottom"], .anticon-vertical-align-bottom, [aria-label="vertical-align-bottom"], [class*="download" i]');
    const clickable = control && (control.closest('.delBtn, button, a, [role="button"]') || control);
    if (!clickable) {
      addLog('error', attachmentLogLabel + '：下载监听失败', fileName + ' | 未找到下载图标，卡片类名：' + String(card.className || ''));
      return { url: '', arrayBuffer: null };
    }
    let captured = '';
    let capturedScore = -100;
    let capturedAt = 0;
    let capturedReady = false;
    let capturedBuffer = null;
    const root = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const restores = [];
    const trace = [];
    const capture = (value, bonus, ready) => {
      const url = normalizeCopywritingUrl(value);
      const score = scoreCopywritingUrl(url, fileName) + Number(bonus || 0);
      if (!url || (score < 25 && !ready)) return false;
      if (url && score > capturedScore) {
        captured = url;
        capturedScore = score;
        capturedAt = Date.now();
        capturedReady = Boolean(ready);
        trace.push('地址:' + redactCopywritingUrl(url));
      }
      return Boolean(url);
    };
    const captureBuffer = (value) => {
      if (!value) return;
      const convert = Object.prototype.toString.call(value) === '[object ArrayBuffer]'
        ? Promise.resolve(value)
        : (typeof value.arrayBuffer === 'function' ? value.arrayBuffer() : Promise.resolve(null));
      convert.then((buffer) => {
        if (!buffer || !buffer.byteLength) return;
        const bytes = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
        const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
        const isDocx = bytes[0] === 0x50 && bytes[1] === 0x4b;
        if ((wantsPdf && isPdf) || (!wantsPdf && isDocx)) {
          capturedBuffer = buffer;
          trace.push('内存' + (wantsPdf ? 'PDF:' : 'Word:') + buffer.byteLength + 'B');
        } else trace.push('非目标文件响应:' + buffer.byteLength + 'B');
      }).catch(() => {});
    };
    try {
      const anchorProto = root.HTMLAnchorElement && root.HTMLAnchorElement.prototype;
      if (anchorProto && anchorProto.click) {
        const originalAnchorClick = anchorProto.click;
        anchorProto.click = function () {
          const url = this.href || this.getAttribute('href') || '';
          if (capture(url, 70, true)) return;
          return originalAnchorClick.apply(this, arguments);
        };
        restores.push(() => { anchorProto.click = originalAnchorClick; });
      }
      if (typeof root.open === 'function') {
        const originalOpen = root.open;
        root.open = function (url) {
          if (capture(url, 70, true)) return null;
          return originalOpen.apply(this, arguments);
        };
        restores.push(() => { root.open = originalOpen; });
      }
      if (root.URL && typeof root.URL.createObjectURL === 'function') {
        const originalCreate = root.URL.createObjectURL;
        root.URL.createObjectURL = function () {
          const url = originalCreate.apply(this, arguments);
          captureBuffer(arguments[0]);
          capture(url, 100, true);
          return url;
        };
        restores.push(() => { root.URL.createObjectURL = originalCreate; });
      }
      if (root.URL && typeof root.URL.revokeObjectURL === 'function') {
        const originalRevoke = root.URL.revokeObjectURL;
        root.URL.revokeObjectURL = function (url) {
          if (captured && String(url || '') === captured) return;
          return originalRevoke.apply(this, arguments);
        };
        restores.push(() => { root.URL.revokeObjectURL = originalRevoke; });
      }
      if (typeof root.fetch === 'function') {
        const originalFetch = root.fetch;
        root.fetch = function (input) {
          const requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
          capture(requestUrl, 15, false);
          const result = originalFetch.apply(this, arguments);
          result.then((response) => {
            const disposition = response.headers && response.headers.get ? (response.headers.get('content-disposition') || '') : '';
            const contentType = response.headers && response.headers.get ? (response.headers.get('content-type') || '') : '';
            capture(response.url || requestUrl, 25, false);
            if (/docx|pdf|officedocument|octet-stream|attachment/i.test(disposition + ' ' + contentType + ' ' + requestUrl)) {
              try { captureBuffer(response.clone()); } catch (error) { /* no-op */ }
            }
          }).catch(() => {});
          return result;
        };
        restores.push(() => { root.fetch = originalFetch; });
      }
      const xhrProto = root.XMLHttpRequest && root.XMLHttpRequest.prototype;
      if (xhrProto && xhrProto.open && xhrProto.send) {
        const originalXhrOpen = xhrProto.open;
        const originalXhrSend = xhrProto.send;
        xhrProto.open = function (method, url) {
          this.__pfhCopywritingUrl = String(url || '');
          capture(url, 15, false);
          return originalXhrOpen.apply(this, arguments);
        };
        xhrProto.send = function () {
          const xhr = this;
          const requestUrl = xhr.__pfhCopywritingUrl || '';
          xhr.addEventListener('load', () => {
            let disposition = '';
            let contentType = '';
            try {
              disposition = xhr.getResponseHeader('content-disposition') || '';
              contentType = xhr.getResponseHeader('content-type') || '';
            } catch (error) { /* no-op */ }
            capture(xhr.responseURL || requestUrl, 25, false);
            if (/docx|pdf|officedocument|octet-stream|attachment/i.test(disposition + ' ' + contentType + ' ' + requestUrl)) captureBuffer(xhr.response);
          }, { once: true });
          return originalXhrSend.apply(this, arguments);
        };
        restores.push(() => {
          xhrProto.open = originalXhrOpen;
          xhrProto.send = originalXhrSend;
        });
      }
    } catch (error) {
      addLog('warn', attachmentLogLabel + '：下载地址监听受限', formatErrorMessage(error));
    }
    const before = new Set((performance.getEntriesByType && performance.getEntriesByType('resource') || []).map((entry) => entry.name));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => Array.from(mutation.addedNodes || []).forEach((node) => {
        if (!node || node.nodeType !== 1) return;
        capture(node.href || (node.getAttribute && (node.getAttribute('href') || node.getAttribute('src'))) || '', 45, true);
        if (!captured && node.querySelectorAll) {
          Array.from(node.querySelectorAll('a[href], [src]')).some((el) => capture(el.href || el.src || '', 45, true));
        }
      }));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    try {
      clickElement(clickable);
      trace.push('已点击:' + String(clickable.className || clickable.getAttribute('aria-label') || clickable.tagName));
      const observed = await waitUntil(() => {
        if (capturedBuffer) return 'buffer';
        if (captured && capturedReady) return 'url';
        const resources = (performance.getEntriesByType && performance.getEntriesByType('resource') || [])
          .map((entry) => entry.name)
          .filter((name) => !before.has(name));
        resources.forEach((url) => capture(url, 20, false));
        if (captured && capturedAt && Date.now() - capturedAt > 6500) return 'url';
        return '';
      }, 9000, 100);
      if (!observed && captured) capturedReady = true;
    } finally {
      observer.disconnect();
      restores.reverse().forEach((restore) => {
        try { restore(); } catch (error) { /* no-op */ }
      });
    }
    if (capturedBuffer) addLog('info', attachmentLogLabel + '：下载监听成功', fileName + ' | 内存 ' + (wantsPdf ? 'PDF ' : 'Word ') + capturedBuffer.byteLength + 'B');
    else if (captured) addLog('info', attachmentLogLabel + '：下载监听捕获地址', fileName + ' | ' + redactCopywritingUrl(captured));
    else addLog('error', attachmentLogLabel + '：下载监听未取得文件', fileName + ' | ' + (trace.join('；') || '点击后未发现下载地址、Blob 或目标文件响应'));
    return { url: captured, arrayBuffer: capturedBuffer };
  }

  function downloadCopywritingDocument(url) {
    if (/^blob:/i.test(url)) {
      return fetch(url).then((response) => {
        if (!response.ok) throw new Error('Word 下载失败：' + response.status);
        return response.arrayBuffer();
      }).finally(() => {
        try { URL.revokeObjectURL(url); } catch (error) { /* no-op */ }
      });
    }
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        fetch(url).then((response) => {
          if (!response.ok) throw new Error('Word 下载失败：' + response.status);
          return response.arrayBuffer();
        }).then(resolve, reject);
        return;
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        timeout: 20000,
        onload: (response) => {
          if (response.status < 200 || response.status >= 300) {
            reject(new Error('Word 下载失败：HTTP ' + response.status));
            return;
          }
          if (response.response instanceof ArrayBuffer) resolve(response.response);
          else if (response.response && response.response.arrayBuffer) response.response.arrayBuffer().then(resolve, reject);
          else reject(new Error('Word 下载内容为空'));
        },
        onerror: () => reject(new Error('Word 下载请求失败')),
        ontimeout: () => reject(new Error('Word 下载超时')),
      });
    });
  }

  function isCopywritingDocxBuffer(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 4) return false;
    const bytes = new Uint8Array(arrayBuffer, 0, 4);
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  async function parseCopywritingDocxRows(arrayBuffer) {
    let xmlText = '';
    try {
      xmlText = await readDocxDocumentXmlNative(arrayBuffer);
      addLog('info', '产品文案：Word 原生解压成功', xmlText.length + ' 字符');
    } catch (nativeError) {
      addLog('warn', '产品文案：原生解压不可用，尝试 JSZip', formatErrorMessage(nativeError));
      const Zip = getLazyExternalRuntime('jszip') || await ensureLazyExternalScript('jszip').catch(() => null);
      if (!Zip) throw new Error('Word 解析组件未加载，且原生解压失败：' + formatErrorMessage(nativeError));
      const zip = await Zip.loadAsync(arrayBuffer, { checkCRC32: false, createFolders: false });
      const documentFile = zip.file('word/document.xml');
      if (!documentFile) throw new Error('Word 文件结构不完整');
      xmlText = await documentFile.async('string');
      addLog('info', '产品文案：JSZip 解压成功', xmlText.length + ' 字符');
    }
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Word XML 解析失败');
    const rows = [];
    Array.from(xml.getElementsByTagNameNS('*', 'tr')).forEach((row) => {
      const cells = Array.from(row.children || []).filter((node) => node.localName === 'tc').map(copywritingCellLines);
      if (cells.length >= 2) rows.push(cells);
    });
    const fullText = rows
      .filter((cells) => !/^内容说明$/.test(cleanCopywritingLine((cells[0] || []).join('')).replace(/\s+/g, '')))
      .map((cells) => [
        (cells[1] || []).map(cleanCopywritingLine).filter(Boolean).join('\n'),
        (cells[2] || []).map(cleanCopywritingLine).filter(Boolean).join('\n'),
      ].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n');
    return { rows, fullText: fullText.slice(0, 50000) };
  }

  async function readDocxDocumentXmlNative(arrayBuffer) {
    if (typeof DecompressionStream !== 'function') throw new Error('浏览器不支持原生 ZIP 解压');
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const readU16 = (offset) => view.getUint16(offset, true);
    const readU32 = (offset) => view.getUint32(offset, true);
    let eocd = -1;
    const start = Math.max(0, bytes.length - 65557);
    for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
      if (readU32(offset) === 0x06054b50) {
        eocd = offset;
        break;
      }
    }
    if (eocd < 0) throw new Error('未找到 Word ZIP 目录');
    const entryCount = readU16(eocd + 10);
    let offset = readU32(eocd + 16);
    const decoder = new TextDecoder('utf-8');
    for (let index = 0; index < entryCount; index += 1) {
      if (offset + 46 > bytes.length || readU32(offset) !== 0x02014b50) throw new Error('Word ZIP 目录损坏');
      const compression = readU16(offset + 10);
      const compressedSize = readU32(offset + 20);
      const nameLength = readU16(offset + 28);
      const extraLength = readU16(offset + 30);
      const commentLength = readU16(offset + 32);
      const localOffset = readU32(offset + 42);
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      offset += 46 + nameLength + extraLength + commentLength;
      if (name !== 'word/document.xml') continue;
      if (localOffset + 30 > bytes.length || readU32(localOffset) !== 0x04034b50) throw new Error('Word 正文位置无效');
      const localNameLength = readU16(localOffset + 26);
      const localExtraLength = readU16(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      if (compression === 0) return decoder.decode(compressed);
      if (compression !== 8) throw new Error('Word 使用了不支持的压缩方式：' + compression);
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const inflated = await new Response(stream).arrayBuffer();
      return decoder.decode(new Uint8Array(inflated));
    }
    throw new Error('Word 中没有正文 XML');
  }

  function copywritingCellLines(cell) {
    const numbering = {};
    let previousNumberingKey = '';
    let previousWasNumbered = false;
    return Array.from(cell.getElementsByTagNameNS('*', 'p'))
      .map((paragraph) => {
        const text = Array.from(paragraph.querySelectorAll('*'))
          .filter((node) => ['t', 'noBreakHyphen', 'softHyphen', 'tab', 'br', 'cr'].includes(node.localName))
          .map((node) => {
            if (node.localName === 'noBreakHyphen' || node.localName === 'softHyphen') return '-';
            if (node.localName === 'tab') return '\t';
            if (node.localName === 'br' || node.localName === 'cr') return '\n';
            return node.textContent || '';
          })
          .join('');
        const numPr = Array.from(paragraph.children || []).find((node) => node.localName === 'pPr')
          && Array.from(Array.from(paragraph.children || []).find((node) => node.localName === 'pPr').children || [])
            .find((node) => node.localName === 'numPr');
        const numIdNode = numPr && Array.from(numPr.children || []).find((node) => node.localName === 'numId');
        const ilvlNode = numPr && Array.from(numPr.children || []).find((node) => node.localName === 'ilvl');
        const numId = numIdNode && numIdNode.getAttribute('w:val') || numIdNode && numIdNode.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'val') || '';
        const ilvl = ilvlNode && ilvlNode.getAttribute('w:val') || ilvlNode && ilvlNode.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'val') || '0';
        const numberingKey = numId && numId !== '0' ? numId + ':' + ilvl : '';
        let marker = '';
        if (numberingKey) {
          if (numberingKey !== previousNumberingKey || !previousWasNumbered) numbering[numberingKey] = 0;
          numbering[numberingKey] = (numbering[numberingKey] || 0) + 1;
          marker = /^\s*\d+[.)、]\s*/.test(text) ? '' : numbering[numberingKey] + '. ';
        }
        previousNumberingKey = numberingKey;
        previousWasNumbered = Boolean(numberingKey);
        return marker + text;
      })
      .map(cleanCopywritingLine)
      .filter(Boolean);
  }

  function normalizeCopywritingCompatibilityCharacters(value) {
    return String(value || '').replace(/[\u2010\u2011]/g, '-');
  }

  function cleanCopywritingLine(value) {
    return normalizeCopywritingCompatibilityCharacters(value).replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/[ \t]+/g, ' ').trim();
  }

  function normalizeIngredientLocantHyphens(value) {
    return String(value || '').replace(/\b(\d+(?:\s*[,、]\s*\d+)+)\s*(?=[A-Za-z])/g, (_match, locants) => locants.replace(/\s*[,、]\s*/g, ',') + '-');
  }

  function splitCopywritingIngredientItems(value) {
    const text = String(value || '');
    const items = [];
    let current = '';
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      let separator = /[\n、，;；]/.test(character);
      if (character === ',') {
        let before = index - 1;
        let after = index + 1;
        while (before >= 0 && /\s/.test(text[before])) before -= 1;
        while (after < text.length && /\s/.test(text[after])) after += 1;
        const isNumericLocant = before >= 0 && after < text.length
          && /\d/.test(text[before]) && /\d/.test(text[after]);
        separator = !isNumericLocant;
      }
      if (separator) {
        items.push(current);
        current = '';
      } else {
        current += character;
      }
    }
    items.push(current);
    return items;
  }

  function cleanCopywritingIngredientValue(lines, language) {
    let text = (lines || []).map(cleanCopywritingLine).filter(Boolean).join('\n').trim();
    if (!text) return '';
    if (language === 'chinese') {
      text = text.replace(/(?:非活性成分|活性成分|(?:中文)?成[分份]表|(?:中文)?成[分份])\s*[:：]?/gi, '、');
    } else {
      text = text.replace(/\b(?:(?:INACTIVE|ACTIVE)\s+)?INGREDIENTS?\s*[:：]?/gi, '、');
    }
    return splitCopywritingIngredientItems(text)
      .map((item) => normalizeIngredientLocantHyphens(cleanCopywritingLine(item).replace(/^[\s:：.。]+|[\s:：.。]+$/g, '')))
      .filter(Boolean)
      .join('、')
      .slice(0, 8000);
  }

  function hasSplitCopywritingIngredients(englishLines, chineseLines) {
    const english = (englishLines || []).map(cleanCopywritingLine).join('\n');
    const chinese = (chineseLines || []).map(cleanCopywritingLine).join('\n');
    return (/\bACTIVE\s+INGREDIENTS?\s*[:：]?/i.test(english) && /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i.test(english))
      || (/(?:^|\n)\s*活性成分\s*[:：]?/.test(chinese) && /(?:^|\n)\s*非活性成分\s*[:：]?/.test(chinese));
  }

  function buildMainstreamCopywriting(parsedDocument, data) {
    const rows = Array.isArray(parsedDocument) ? parsedDocument : (parsedDocument && parsedDocument.rows || []);
    const wordFullText = Array.isArray(parsedDocument) ? '' : String(parsedDocument && parsedDocument.fullText || '').trim();
    const rowMap = {};
    (rows || []).forEach((cells) => {
      const label = cleanCopywritingLine((cells[0] || []).join('')).replace(/\s+/g, '');
      if (label && !rowMap[label]) rowMap[label] = { english: cells[1] || [], chinese: cells[2] || [] };
    });
    const find = (pattern, language) => {
      const key = Object.keys(rowMap).find((label) => pattern.test(label));
      const entry = key ? rowMap[key] : null;
      return entry ? (entry[language === 'chinese' ? 'chinese' : 'english'] || []).slice() : [];
    };
    const sections = [];
    const missingSections = [];
    const add = (key, label, text, required) => {
      const value = String(text || '').trim();
      if (value) sections.push({ key, label, text: value.slice(0, 12000) });
      else if (required !== false) missingSections.push(label);
    };
    const productSection = preserveCopywritingHeading(find(/^产品名称$/), /^PRODUCT\s+NAME\s*[:：]?$/i, 'PRODUCT NAME:');
    add('productName', '产品名称', joinCopywritingSection(productSection.heading, productSection.lines));
    const functionsHeading = find(/^24国语言功效标题/).join('').trim();
    add('functionsHeading', '24国语言功效标题', functionsHeading, false);
    const functionLines = find(/^24国语言功效内容/).map((line) => line.replace(/;\s*$/, '').trim()).filter(Boolean);
    add('functions', '24国语言功效内容', functionLines.join(';  '), false);
    const ingredientLines = find(/^(?:成分表|成分活性非活性成分)/);
    const ingredientChineseLines = find(/^(?:成分表|成分活性非活性成分)/, 'chinese');
    const ingredientEnglish = cleanCopywritingIngredientValue(ingredientLines, 'english');
    const ingredientChinese = cleanCopywritingIngredientValue(ingredientChineseLines, 'chinese');
    const ingredientSplit = hasSplitCopywritingIngredients(ingredientLines, ingredientChineseLines);
    const activeIngredients = extractLabeledCopywritingSection(ingredientLines, /\bACTIVE\s+INGREDIENTS?\s*[:：]?/i, /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i, 'ACTIVE INGREDIENTS:');
    const inactiveIngredients = extractLabeledCopywritingSection(ingredientLines, /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i, null, 'INACTIVE INGREDIENTS:');
    if (activeIngredients.lines.length || inactiveIngredients.lines.length) {
      add('activeIngredients', 'ACTIVE INGREDIENTS', joinCopywritingSection(activeIngredients.heading, activeIngredients.lines));
      add('inactiveIngredients', 'INACTIVE INGREDIENTS', joinCopywritingSection(inactiveIngredients.heading, inactiveIngredients.lines));
    } else {
      const ingredientSection = preserveCopywritingHeading(ingredientLines, /^INGREDIENTS?\s*[:：]?$/i, 'INGREDIENTS:');
      add('ingredients', '成分表', joinCopywritingSection(ingredientSection.heading, ingredientSection.lines));
    }
    const materialEnglish = find(/^(?:材质|材料)$/);
    const materialChinese = find(/^(?:材质|材料)$/, 'chinese');
    // The file view is used for the English artwork copy.  Do not append the
    // Chinese material cell here; it remains available in the raw full-text view.
    add('material', '材质', materialEnglish.join('\n'), false);
    const directionSection = preserveCopywritingHeading(find(/^(?:[AB][.．、]?\s*)?(?:建议使用方法|使用方法|食用方法)/i), /^DIRECTIONS(?:\s+OF\s+SAFE\s+USE)?\s*[:：]?$/i, 'DIRECTIONS:');
    add('directions', '建议使用方法', joinCopywritingSection(directionSection.heading, directionSection.lines));
    add('directionsChinese', '中文使用方法', find(/^(?:[AB][.．、]?\s*)?(?:建议使用方法|使用方法|食用方法)/i, 'chinese').join('\n'));
    const warningSection = preserveCopywritingHeading(find(/^警告语$/), /^WARNINGS?\s*[:：]?$/i, 'WARNINGS:');
    add('warning', '警告语', joinCopywritingSection(warningSection.heading, warningSection.lines));
    const emailLines = find(/^美国不良事故联系人邮箱$/);
    const emailSection = preserveCopywritingHeading(emailLines, /^E-?MAIL\s*[:：]?$/i, 'e-mail:');
    add('email', '联系邮箱', joinCopywritingSection(emailSection.heading, emailSection.lines), false);
    // Some Word templates place the actual package contents in a separate
    // “包含 / INCLUDING” row instead of the product net-content field.  Keep
    // that complete English statement in the net-content card and do not
    // reduce it to the first numeric quantity (the foaming net is an accessory).
    const includingLines = find(/^(?:包含|包括|内含|INCLUDING)[:：]?$/i);
    const includingSection = preserveCopywritingHeading(includingLines, /^INCLUDING\s*[:：]?$/i, 'INCLUDING:');
    const includingText = joinCopywritingSection(includingSection.heading, includingSection.lines);
    const net = formatCopywritingNetContent(data && data.netContent);
    if (!includingText && net.warning && net.text) missingSections.push(net.warning);
    add('netContent', '净含量', includingText || net.text);
    const originLines = find(/^原产国$/);
    add('origin', '原产国', originLines.join('\n'));
    const shelfLines = find(/^保质期$/);
    add('shelfLife', '保质期', shelfLines.join('\n'));
    formatBrandComplianceSections(data).forEach((section) => add(section.key, section.label, section.text));
    return {
      sections,
      fullText: (wordFullText || sections.map((section) => section.text).join('\n')).slice(0, 50000),
      missingSections,
      ingredientEnglish,
      ingredientChinese,
      ingredientSplit,
    };
  }

  function findBrandCompliance(data) {
    const brand = String(data && data.brand || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!brand) return null;
    return BRAND_COMPLIANCE_DATA.find((item) => {
      const names = [item && item.brand].concat(Array.isArray(item && item.aliases) ? item.aliases : []);
      return names.some((name) => String(name || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() === brand);
    }) || null;
  }

  function cleanComplianceValue(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean).join('\n').trim();
  }

  function formatBrandComplianceSections(data) {
    const info = findBrandCompliance(data);
    if (!info) return [];
    const distributedBy = cleanComplianceValue(info.distributed_by);
    const address = cleanComplianceValue(info.address);
    if (!distributedBy && !address) return [];
    const sections = [];
    if (distributedBy) sections.push({ key: 'distributedBy', label: 'DISTRIBUTED BY', text: 'DISTRIBUTED BY: ' + distributedBy });
    if (address) sections.push({ key: 'address', label: 'ADDRESS', text: 'ADDRESS: ' + address });
    [['EU REP', 'euRep', info.eu_rep], ['UK REP', 'ukRep', info.uk_rep], ['US REP', 'usRep', info.us_rep]].forEach(([label, key, rep]) => {
      if (!rep || !cleanComplianceValue(rep.company)) return;
      const lines = [cleanComplianceValue(rep.company), cleanComplianceValue(rep.address), cleanComplianceValue(rep.contact), cleanComplianceValue(rep.phone), cleanComplianceValue(rep.postal_code)].filter(Boolean);
      if (lines.length) sections.push({ key, label, text: label + '\n' + lines.join('\n') });
    });
    return sections;
  }

  function getCopywritingDisplayRecord(data) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (!record) return null;
    const existingKeys = new Set(record.sections.map((section) => section.key));
    const complianceSections = formatBrandComplianceSections(data)
      .filter((section) => section && section.key && !existingKeys.has(section.key));
    if (!complianceSections.length) return record;
    const complianceText = complianceSections.map((section) => section.text).filter(Boolean).join('\n');
    return normalizeCopywritingRecord({
      ...record,
      sections: record.sections.concat(complianceSections),
      fullText: [record.fullText, complianceText].filter(Boolean).join('\n'),
    });
  }

  function extractLabeledCopywritingSection(lines, headingPattern, nextHeadingPattern, fallbackHeading) {
    const text = (lines || []).map(cleanCopywritingLine).filter(Boolean).join('\n');
    const match = text.match(headingPattern);
    if (!match) return { heading: fallbackHeading, lines: [] };
    const start = Number(match.index) || 0;
    const heading = String(match[0] || '').trim() || fallbackHeading;
    let value = text.slice(start + match[0].length).replace(/^\s*[:：]\s*/, '');
    if (nextHeadingPattern) {
      const next = value.search(nextHeadingPattern);
      if (next >= 0) value = value.slice(0, next);
    }
    return { heading, lines: value.split(/\r?\n/).map(cleanCopywritingLine).filter(Boolean) };
  }

  function preserveCopywritingHeading(lines, headingPattern, fallbackHeading) {
    const result = (lines || []).map(cleanCopywritingLine).filter(Boolean);
    if (!result.length) return { heading: fallbackHeading, lines: [] };
    const first = result[0];
    const colonIndex = first.search(/[:：]/);
    const prefix = colonIndex >= 0 ? first.slice(0, colonIndex + 1).trim() : first.trim();
    const hasExpectedHeading = headingPattern.test(first) || (colonIndex >= 0 && headingPattern.test(prefix));
    const hasSourceHeading = colonIndex >= 0 && /^[A-Z][A-Z0-9 /().&-]*[:：]$/.test(prefix);
    if (!hasExpectedHeading && !hasSourceHeading) {
      return { heading: fallbackHeading, lines: result };
    }
    const body = colonIndex >= 0 ? first.slice(colonIndex + 1).trim() : '';
    result.shift();
    if (body) result.unshift(body);
    return { heading: prefix || fallbackHeading, lines: result };
  }

  function joinCopywritingSection(heading, lines) {
    const body = (lines || []).map(cleanCopywritingLine).filter(Boolean);
    return body.length ? [heading].concat(body).join('\n') : '';
  }

  function formatCopywritingNetContent(value) {
    const text = cleanCopywritingLine(value);
    if (!text || text === '--' || text === L.unknown) return { text: '', warning: '净含量' };
    if (/^\d+(?:\.\d+)?(?:CAPSULES|SOFTGELS|GUMMIES|TABLETS|PAIR|PAIRS|PCS?|PC)$/i.test(text)) return { text: text.toUpperCase(), warning: '' };
    const match = text.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
    if (!match) return { text, warning: '净含量单位无法换算' };
    const amount = Number(match[1]);
    const unit = match[2].toUpperCase();
    if (!Number.isFinite(amount)) return { text, warning: '净含量单位无法换算' };
    const imperial = unit === 'G' ? amount / 28.349523125 : amount / 29.5735295625;
    return { text: trimNumber(amount) + unit + '/ ' + imperial.toFixed(2) + (unit === 'G' ? ' OZ' : ' FL OZ'), warning: '' };
  }

  async function hashCopywritingBuffer(arrayBuffer) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', arrayBuffer.slice(0));
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      const bytes = new Uint8Array(arrayBuffer);
      let hash = 2166136261;
      for (let index = 0; index < bytes.length; index += 1) hash = Math.imul(hash ^ bytes[index], 16777619);
      return (hash >>> 0).toString(16);
    }
  }

  function normalizeCopywritingComparisonText(value) {
    return String(value || '')
      .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/(\d+(?:\.\d+)?)\s*(fl\s*oz|mcg|mg|kg|g|ml|l|oz|lbs?|cm|mm|in(?:ches?)?|ft|pcs?|capsules?|tablets?|gummies?|pairs?)(?=\b)/gi, (_, amount, unit) => amount + unit.replace(/\s+/g, '').toLowerCase())
      .trim();
  }

  function areCopywritingSectionsEquivalent(previousSections, nextSections) {
    if (!Array.isArray(previousSections) || !Array.isArray(nextSections) || previousSections.length !== nextSections.length) return false;
    const nextMap = new Map(nextSections.map((section) => [section.key, section]));
    return previousSections.every((section) => {
      const next = nextMap.get(section.key);
      return Boolean(next) && normalizeCopywritingComparisonText(section.text) === normalizeCopywritingComparisonText(next.text);
    });
  }

  function buildCopywritingRecord(fileName, fileTimestamp, fileHash, built, cached) {
    const now = new Date().toLocaleString();
    const old = normalizeCopywritingRecord(cached);
    const oldMap = new Map((old && old.sections || []).map((section) => [section.key, section]));
    const nextMap = new Map((built.sections || []).map((section) => [section.key, section]));
    const contentChangedSectionKeys = built.sections
      .filter((section) => !oldMap.has(section.key) || normalizeCopywritingComparisonText(oldMap.get(section.key).text) !== normalizeCopywritingComparisonText(section.text))
      .map((section) => section.key);
    const contentRemovedSections = (old && old.sections || [])
      .filter((section) => !nextMap.has(section.key))
      .map((section) => section.label || section.key);
    const changedFile = Boolean(old && old.fullText && (
      old.fileName !== fileName
      || normalizeCopywritingComparisonText(old.fullText) !== normalizeCopywritingComparisonText(built.fullText)
      || contentChangedSectionKeys.length
      || contentRemovedSections.length
    ));
    const changedSectionKeys = changedFile
      ? contentChangedSectionKeys
      : (old && old.updatePending ? old.changedSectionKeys.slice() : []);
    const removedSections = changedFile
      ? contentRemovedSections
      : (old && old.updatePending ? old.removedSections.slice() : []);
    return normalizeCopywritingRecord({
      fileName,
      parserVersion: COPYWRITING_PARSER_VERSION,
      fileTimestamp,
      fileHash,
      fetchedAt: now,
      lastCheckedAtMs: Date.now(),
      sections: built.sections,
      fullText: built.fullText,
      ingredientEnglish: built.ingredientEnglish,
      ingredientChinese: built.ingredientChinese,
      cleanedIngredientEnglish: built.ingredientEnglish,
      cleanedIngredientChinese: built.ingredientChinese,
      ingredientSplit: Boolean(built.ingredientSplit),
      missingSections: built.missingSections,
      updatePending: changedFile || Boolean(old && old.updatePending),
      changedSectionKeys,
      removedSections,
      previousSections: changedFile ? old.sections : (old && old.updatePending ? old.previousSections : []),
      copiedSectionKeys: changedFile ? [] : (old && old.copiedSectionKeys || []),
      copiedFullText: changedFile ? false : Boolean(old && old.copiedFullText),
    });
  }

  function normalizeCopywritingRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const normalizeSections = (items) => (Array.isArray(items) ? items : []).slice(0, 80).map((section) => ({
      key: String(section && section.key || '').slice(0, 60),
      label: normalizeCopywritingCompatibilityCharacters(String(section && section.label || '')).slice(0, 100),
      text: normalizeCopywritingCompatibilityCharacters(String(section && section.text || '')).slice(0, 12000),
    })).filter((section) => section.key && section.text);
    const sections = normalizeSections(record.sections).map((section) => ({
      ...section,
      text: /ingredient/i.test(section.key) ? normalizeIngredientLocantHyphens(section.text) : section.text,
    }));
    const previousSections = normalizeSections(record.previousSections);
    const updatePending = Boolean(record.updatePending) && (!previousSections.length || !areCopywritingSectionsEquivalent(previousSections, sections));
    return {
      fileName: String(record.fileName || '').slice(0, 300),
      parserVersion: String(record.parserVersion || '').slice(0, 20),
      fileTimestamp: String(record.fileTimestamp || '').slice(0, 20),
      fileHash: String(record.fileHash || '').slice(0, 128),
      fetchedAt: String(record.fetchedAt || '').slice(0, 80),
      lastCheckedAtMs: Math.max(0, Number(record.lastCheckedAtMs) || 0),
      sections,
      fullText: normalizeIngredientLocantHyphens(normalizeCopywritingCompatibilityCharacters(String(record.fullText || '')).slice(0, 50000)),
      ingredientEnglish: normalizeIngredientLocantHyphens(normalizeCopywritingCompatibilityCharacters(String(record.ingredientEnglish || '').trim())).slice(0, 8000),
      ingredientChinese: String(record.ingredientChinese || '').trim().slice(0, 8000),
      cleanedIngredientEnglish: normalizeIngredientLocantHyphens(normalizeCopywritingCompatibilityCharacters(String(record.cleanedIngredientEnglish || record.ingredientEnglish || '').trim())).slice(0, 8000),
      cleanedIngredientChinese: String(record.cleanedIngredientChinese || record.ingredientChinese || '').trim().slice(0, 8000),
      ingredientSplit: Boolean(record.ingredientSplit),
      missingSections: (Array.isArray(record.missingSections) ? record.missingSections : []).map((item) => String(item || '').slice(0, 100)).filter(Boolean).slice(0, 16),
      updatePending,
      changedSectionKeys: updatePending ? (Array.isArray(record.changedSectionKeys) ? record.changedSectionKeys : []).map((item) => String(item || '').slice(0, 60)).filter(Boolean).slice(0, 16) : [],
      removedSections: updatePending ? (Array.isArray(record.removedSections) ? record.removedSections : []).map((item) => String(item || '').slice(0, 100)).filter(Boolean).slice(0, 16) : [],
      previousSections: updatePending ? previousSections : [],
      copiedSectionKeys: (Array.isArray(record.copiedSectionKeys) ? record.copiedSectionKeys : []).map((item) => String(item || '').slice(0, 60)).filter(Boolean).slice(0, 80),
      copiedFullText: Boolean(record.copiedFullText),
    };
  }

  function isCopywritingCheckFresh(record, now) {
    const checkedAtMs = Number(record && record.lastCheckedAtMs) || 0;
    const currentTime = Number(now) || Date.now();
    return checkedAtMs > 0 && currentTime >= checkedAtMs && currentTime - checkedAtMs < COPYWRITING_CHECK_WINDOW_MS;
  }

  function markCopywritingCheckedAt(data, record, checkedAtMs) {
    const cached = normalizeCopywritingRecord(record);
    if (!data || !data.sku || !cached || !cached.fullText) return normalizeData(data || {});
    const checkedAt = Number(checkedAtMs) || Date.now();
    if (cached.lastCheckedAtMs && checkedAt - cached.lastCheckedAtMs < 1000) return normalizeData(data);
    const nextRecord = normalizeCopywritingRecord({ ...cached, lastCheckedAtMs: checkedAt });
    const next = mergeCopywritingCacheIntoData(data, nextRecord);
    saveData(data.sku, next, { suppressChangeTracking: true });
    return next;
  }

  function mergeCopywritingCacheIntoData(data, record) {
    const cached = normalizeCopywritingRecord(record);
    const english = String(cached && cached.cleanedIngredientEnglish || '').trim();
    const chinese = String(cached && cached.cleanedIngredientChinese || '').trim();
    const hasExistingIngredients = Boolean(data && (data.ingredientEnglish || data.ingredientChinese));
    return normalizeData({
      ...(data || {}),
      copywriting: cached,
      copywritingIngredientEnglish: english,
      copywritingIngredientChinese: chinese,
      copywritingIngredientSplit: Boolean(cached && cached.ingredientSplit),
      ingredientEnglish: data && data.ingredientEnglish || english,
      ingredientChinese: data && data.ingredientChinese || chinese,
      ingredientSource: hasExistingIngredients ? (data && data.ingredientSource || '') : (english || chinese ? 'copywritingWord' : data && data.ingredientSource || ''),
      ingredientWordFileName: english || chinese ? cached.fileName : data && data.ingredientWordFileName || '',
      ingredientWordHash: english || chinese ? cached.fileHash : data && data.ingredientWordHash || '',
      ingredientWordUpdatedAt: english || chinese ? cached.fetchedAt : data && data.ingredientWordUpdatedAt || '',
    });
  }

  function uploadPanelHtml() {
    state.uploadExpanded = true;
    const uploadMode = normalizeUploadMode(state.uploadMode);
    state.uploadMode = uploadMode;
    state.uploadWorkerMode = uploadMode;
    state.uploadRunning = loadUploadWorkerRunning(uploadMode);
    moveCompletedUploadsToHistory(uploadMode);
    normalizeRunningUploadsInQueue();
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    const viewingHistory = state.uploadView === 'history';
    const history = (state.uploadHistory || []).filter((item) => getUploadItemMode(item) === uploadMode);
    const successfulHistory = history.filter(isUploadHistorySuccess);
    const queue = (state.uploadQueue || []).filter((item) => getUploadItemMode(item) === uploadMode && !/\u6210\u529f/.test(item.status || ''));
    const allItems = viewingHistory ? history : queue;
    const pageSize = 10;
    const pageKey = viewingHistory ? 'uploadHistoryPage' : 'uploadPage';
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state[pageKey] = clamp(state[pageKey] || 1, 1, totalPages);
    const pageItems = allItems.slice((state[pageKey] - 1) * pageSize, state[pageKey] * pageSize);
    const currentSku = state.data && state.data.sku ? state.data.sku : '';
    const currentUpload = state.uploadRunning ? getCurrentRunningUpload(queue, uploadMode) : null;
    const statusText = (state.uploadRunning ? '\u8fd0\u884c\u4e2d' : '\u5df2\u6682\u505c') + (currentUpload ? ' | ' + currentUpload.sku : '');
    const visibleIdSet = new Set(allItems.map((item) => item.id));
    const selectedIds = new Set((state.uploadSelectedIds || []).filter((id) => visibleIdSet.has(id)));
    const rows = pageItems.length ? pageItems.map((item) => {
      const active = currentSku && item.sku === currentSku ? ' is-current' : '';
      const isToyLabel = item.kind === 'toy-label';
      const isToyEffect = item.kind === 'toy-effect';
      const isCopyright = item.kind === 'copyright';
      const ready = isUploadItemReady(item);
      const historyStatus = isToyLabel && (!item.status || item.status === L.uploadSuccess)
        ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f'
        : (isToyEffect && (!item.status || item.status === L.uploadSuccess)
          ? '\u6548\u679c\u56fe\u4e0a\u4f20\u6210\u529f'
          : (isCopyright && (!item.status || item.status === L.uploadSuccess) ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : (item.status || L.uploadSuccess)));
      const defaultStatus = isToyLabel ? '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e' : (isToyEffect ? '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe' : '\u5f85\u4e0a\u4f20');
      const status = viewingHistory ? historyStatus : (ready ? (item.status || defaultStatus) : '\u7f3a\u6587\u4ef6');
      const statusClass = /\u6210\u529f/.test(status) ? 'is-success' : (!ready || /\u5931\u8d25|\u8df3\u8fc7|\u5df2\u6709\u5185\u5bb9/.test(status) ? 'is-missing' : 'is-ready');
      const copyrightFiles = getCopyrightUploadEntries(item);
      const toyEffectFiles = getToyEffectUploadEntries(item);
      const files = isToyLabel
        ? '\u73a9\u5177\u6807\u7b7e\uff1a\u751f\u6210 / \u4e0a\u4f20 BOM / \u4e0b\u8f7d PSD \u4e0e\u56fe\u7247'
        : (isToyEffect
          ? '\u6548\u679c\u56fe\uff1a' + (toyEffectFiles.length ? toyEffectFiles.map((entry) => entry.name).join(' / ') : '\u7f3a\u5c11\u56fe\u7247')
        : (isCopyright
          ? '\u7248\u6743\u56fe\uff1a' + (copyrightFiles.length ? copyrightFiles.map((entry) => entry.name).join(' / ') : '\u7f3a\u5c11\u56fe\u7247')
          : [
            item.xlsxName ? 'XLSX \u5df2\u6709 ' + item.xlsxName : 'XLSX \u7f3a\u5c11',
            item.zipName ? 'ZIP \u5df2\u6709 ' + item.zipName : 'ZIP \u7f3a\u5c11',
          ].join(' | ')));
      const previousUpload = viewingHistory ? null : findPreviousSuccessfulUpload(item, successfulHistory);
      const previousUploadText = previousUpload ? '\u4e0a\u6b21\u4e0a\u4f20\uff1a' + (previousUpload.completedAt || previousUpload.updatedAt || '') : '';
      const progressText = viewingHistory ? (item.completedAt || item.updatedAt || '') : [previousUploadText, item.step || files].filter(Boolean).join(' \u00b7 ');
      const progressTitle = viewingHistory ? (item.step || item.skipReason || '') : [previousUploadText, files].filter(Boolean).join('\n');
      const uploadName = getUploadDisplayName(item);
      const selectAction = viewingHistory ? 'upload-history-select' : 'upload-queue-select';
      const selectHtml = '<button type="button" class="pfh-upload-check' + (selectedIds.has(item.id) ? ' is-checked' : '') + '" data-action="' + selectAction + '" data-upload-id="' + escapeHtml(item.id) + '" title="\u9009\u4e2d"></button>';
      const actionHtml = selectHtml;
      return '<div class="pfh-upload-item' + active + (viewingHistory ? ' is-history' : '') + '" data-upload-id="' + escapeHtml(item.id) + '">' +
        '<div><b>' + escapeHtml(item.sku) + '</b><small>' + escapeHtml(uploadName) + '</small></div>' +
        '<span class="' + statusClass + '">' + escapeHtml(status) + '</span>' +
        '<em title="' + escapeHtml(progressTitle) + '">' + escapeHtml(progressText) + '</em>' +
        actionHtml +
        '</div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(viewingHistory ? L.uploadHistoryEmpty : L.uploadQueueEmpty) + '</div>';
    const historyHeadActions = '<span class="pfh-upload-head-project"><b>\u9879\u76ee</b></span>';
    const tableHead = '<div class="pfh-upload-table-head' + (viewingHistory ? ' is-history' : '') + '">' + historyHeadActions + '<span>\u72b6\u6001</span><span>' + escapeHtml(viewingHistory ? '\u65f6\u95f4' : '\u6587\u4ef6/\u8fdb\u5ea6') + '</span><span>\u9009\u62e9</span></div>';
    const pagerAction = viewingHistory ? 'upload-history-page' : 'upload-page';
    const pager = '<div class="pfh-upload-pager"><span>\u5171 ' + allItems.length + ' \u6761</span><div><button type="button" data-action="' + pagerAction + '-prev"' + (state[pageKey] <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager(pagerAction, state[pageKey], totalPages) + '<button type="button" data-action="' + pagerAction + '-next"' + (state[pageKey] >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    const selectedActionHtml = '<button type="button" data-action="upload-clear-list">' + escapeHtml(L.uploadClearList) + '</button><button type="button" data-action="upload-selected-delete"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadDelete) + '</button><button type="button" data-action="upload-selected-retry"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadRetry) + '</button>';
    const backAction = viewingHistory ? 'upload-history-toggle' : 'home-back';
    const backLabel = viewingHistory ? '\u8fd4\u56de\u63d0\u5ba1\u4e0a\u4f20' : '\u8fd4\u56de\u4e3b\u9875';
    const uploadModeTabs = !viewingHistory ? '<div class="pfh-upload-mode-tabs is-four' + (uploadMode === 'toy-label' ? ' is-toy-label' : '') + (uploadMode === 'toy-effect' ? ' is-toy-effect' : '') + (uploadMode === 'copyright' ? ' is-copyright' : '') + '" data-active-mode="' + escapeHtml(uploadMode) + '" style="--pfh-upload-mode-count:4;grid-template-columns:repeat(4,minmax(68px,1fr));width:min(100%,360px)"><i class="pfh-upload-mode-indicator" aria-hidden="true"></i><button type="button" data-action="upload-mode" data-upload-mode="standard" class="' + (uploadMode === 'standard' ? 'is-active' : '') + '">\u56fe\u5305\u8868\u683c</button><button type="button" data-action="upload-mode" data-upload-mode="toy-label" class="' + (uploadMode === 'toy-label' ? 'is-active' : '') + '">\u73a9\u5177\u6807\u7b7e</button><button type="button" data-action="upload-mode" data-upload-mode="toy-effect" class="' + (uploadMode === 'toy-effect' ? 'is-active' : '') + '">\u73a9\u5177\u6548\u679c\u56fe</button><button type="button" data-action="upload-mode" data-upload-mode="copyright" class="' + (uploadMode === 'copyright' ? 'is-active' : '') + '">\u7248\u6743\u56fe</button></div>' : '';
    const copyrightPendingFiles = Array.isArray(state.copyrightPendingFiles) ? state.copyrightPendingFiles : [];
    const queueControl = state.uploadRunning ? '<button type="button" data-action="upload-pause">' + escapeHtml(L.uploadPauseQueue) + '</button>' : '<button type="button" data-action="upload-start">' + escapeHtml(L.uploadStartQueue) + '</button>';
    const uploadSkuDropHtml = isUploadSkuPickerMode(uploadMode) ? '<div class="pfh-upload-sku-drop-target" data-upload-sku-drop="true" tabindex="0" role="button">\u62d6\u52a8\u4e0a\u65b9 SKU \u5361\u7247\u5230\u8fd9\u91cc\u6dfb\u52a0\u4efb\u52a1</div>' : '';
    const uploadSkuPickerHtml = !viewingHistory && isUploadSkuPickerMode(uploadMode) ? '<div class="pfh-upload-sku-picker" data-upload-sku-picker="true"></div>' : '';
    const copyrightModeHtml = '<textarea class="pfh-toy-label-sku-input pfh-copyright-sku-input" placeholder="\u7c98\u8d34\u4e00\u4e2a\u6216\u591a\u4e2a SKU \u7f16\u7801">' + escapeHtml(state.copyrightSkuInput || '') + '</textarea>' +
      '<div class="pfh-upload-drop pfh-copyright-drop" data-action="upload-pick" data-upload-drop="copyright" tabindex="0" role="button" aria-label="\u7c98\u8d34\u6216\u62d6\u5165\u7248\u6743\u56fe">\u7c98\u8d34\u6216\u62d6\u5165\u7248\u6743\u56fe\uff08JPG / PNG\uff09' + (copyrightPendingFiles.length ? '<small>\u5df2\u9009 ' + copyrightPendingFiles.length + ' \u5f20\uff1a' + escapeHtml(copyrightPendingFiles.slice(0, 6).map((file) => file.name).join(' / ') + (copyrightPendingFiles.length > 6 ? ' ...' : '')) + '</small>' : '') + '</div>' +
      '<input class="pfh-upload-file" data-upload-kind="copyright" type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png">' +
      '<div class="pfh-upload-actions"><button type="button" data-action="copyright-queue-add"' + (!(state.copyrightSkuInput || '').trim() || !copyrightPendingFiles.length ? ' disabled' : '') + '>\u52a0\u5165\u7248\u6743\u56fe\u4efb\u52a1</button>' + (copyrightPendingFiles.length ? '<button type="button" data-action="copyright-pending-clear">\u6e05\u7a7a\u5df2\u9009</button>' : '') + queueControl + '</div>';
    const toyEffectModeHtml = '<div class="pfh-upload-drop pfh-toy-effect-drop" data-action="upload-pick" data-upload-drop="toy-effect" tabindex="0" role="button" aria-label="\u62d6\u5165\u73a9\u5177\u6548\u679c\u56fe">\u62d6\u5165\u73a9\u5177\u6548\u679c\u56fe\uff08JPG / PNG\uff09<small>\u6309\u6587\u4ef6\u540d\u4e2d\u7684\u4ea7\u54c1\u540d\u5339\u914d SKU\uff0c\u4e0a\u4f20\u5230\u5bf9\u5e94 BOM \u7684\u6548\u679c\u56fe</small></div>' +
      (state.toyEffectMatchStatus ? '<div class="pfh-upload-match-status is-error">' + escapeHtml(state.toyEffectMatchStatus) + '</div>' : '') +
      '<input class="pfh-upload-file" data-upload-kind="toy-effect" type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png">' +
      '<div class="pfh-upload-actions"><button type="button" data-action="upload-pick" data-upload-kind="toy-effect">\u9009\u62e9\u6548\u679c\u56fe</button>' + queueControl + '</div>';
    const historyBottomButton = '<button type="button" data-action="upload-history-toggle">' + escapeHtml(viewingHistory ? '\u8fd4\u56de\u63d0\u5ba1\u4e0a\u4f20' : '\u5386\u53f2\u8bb0\u5f55') + '</button>';
    return '<div class="pfh-detail-scroll pfh-upload-scroll"><section class="pfh-section pfh-upload-section is-open' + (viewingHistory ? ' is-history-view' : '') + '">' +
      '<div class="pfh-section-title pfh-upload-title"><button type="button" class="pfh-upload-back" data-action="' + backAction + '" aria-label="' + backLabel + '">' + iconHtml('backArrow') + '</button><h3>' + escapeHtml(L.uploadSection) + '</h3>' + uploadModeTabs +
      '<span class="pfh-upload-status">' + escapeHtml(statusText) + '</span>' +
      '<button type="button" class="pfh-upload-guide-button" data-action="upload-guide" title="\u4f7f\u7528\u8bf4\u660e" aria-label="\u4f7f\u7528\u8bf4\u660e">' + uploadGuideIconHtml() + '</button>' +
      '</div>' + uploadSkuPickerHtml +
      '<div class="pfh-upload-body">' +
        (viewingHistory ? '' : (uploadMode === 'toy-label'
          ? uploadSkuDropHtml + '<textarea class="pfh-toy-label-sku-input" placeholder="\u7c98\u8d34\u591a\u4e2a SKU \u7f16\u7801\uff0c\u6bcf\u884c\u4e00\u4e2a\u6216\u7528\u7a7a\u683c/\u9017\u53f7\u5206\u9694">' + escapeHtml(state.toyLabelSkuInput || '') + '</textarea><div class="pfh-upload-actions"><button type="button" data-action="toy-label-queue-add">\u52a0\u5165\u73a9\u5177\u6807\u7b7e\u4efb\u52a1</button>' + queueControl + '</div>'
          : (uploadMode === 'toy-effect' ? toyEffectModeHtml : (uploadMode === 'copyright' ? uploadSkuDropHtml + copyrightModeHtml : '<div class="pfh-upload-drop" data-action="upload-pick" data-upload-drop="any" tabindex="0" role="button" aria-label="' + escapeHtml(L.uploadDropHint) + '">' + escapeHtml(L.uploadDropHint) + '</div>' +
        '<input class="pfh-upload-file" data-upload-kind="any" type="file" multiple accept=".xls,.xlsx,.zip,.rar">' +
        '<div class="pfh-upload-actions"><button type="button" data-action="upload-pick" data-upload-kind="any">\u9009\u62e9\u6587\u4ef6</button>' + queueControl + '</div>'))) ) +
        tableHead + '<div class="pfh-upload-list">' + rows + '</div>' +
      '</div>' +
      '</section></div>' +
      '<div class="pfh-upload-bottom"><div class="pfh-upload-bottom-line">' + pager + '<div class="pfh-upload-bottom-actions">' + historyBottomButton + selectedActionHtml + '</div></div></div>' +
      uploadGuideModalHtml() + uploadClearConfirmModalHtml();
  }

  function uploadGuideIconHtml() {
    return '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512 85.3c235.3 0 426.7 191.4 426.7 426.7 0 235.3-191.4 426.7-426.7 426.7S85.3 747.3 85.3 512C85.3 276.7 276.7 85.3 512 85.3m0-64C241 21.3 21.3 241 21.3 512S241 1002.7 512 1002.7 1002.7 783 1002.7 512 783 21.3 512 21.3z"></path><path d="M512 277.3m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"></path><path d="M512 810.7c-35.3 0-64-28.7-64-64v-256c0-35.3 28.7-64 64-64s64 28.7 64 64v256c0 35.3-28.7 64-64 64z"></path></svg>';
  }

  function uploadGuideModalHtml() {
    if (!state.uploadGuideOpen) return '';
    return '<div class="pfh-upload-guide-modal" data-action="upload-guide-close"><section role="dialog" aria-modal="true" aria-label="\u4f7f\u7528\u8bf4\u660e"><header><h3>\u4f7f\u7528\u8bf4\u660e</h3><button type="button" data-action="upload-guide-close" aria-label="\u5173\u95ed">\u00d7</button></header><article><b>\u56fe\u5305\u8868\u683c</b><p>\u628a XLSX \u548c ZIP \u4e00\u8d77\u62d6\u5165\uff0c\u811a\u672c\u6309\u6587\u4ef6\u540d\u4e2d\u7684 SKU \u81ea\u52a8\u5339\u914d\u5e76\u52a0\u5165\u4efb\u52a1\u680f\u3002</p><b>\u73a9\u5177\u6807\u7b7e</b><p>\u7c98\u8d34\u591a\u4e2a SKU \u540e\u52a0\u5165\u4efb\u52a1\uff1b\u961f\u5217\u4f1a\u9010\u4e2a\u751f\u6210\u6807\u7b7e\u3001\u4e0a\u4f20 BOM\uff0c\u5e76\u5728\u7ed3\u675f\u540e\u4e0b\u8f7d\u4e00\u4e2a ZIP \u538b\u7f29\u5305\u3002</p><b>\u7248\u6743\u56fe</b><p>\u8f93\u5165 SKU \u540e\u7c98\u8d34\u6216\u62d6\u5165 JPG/PNG\uff1b\u961f\u5217\u4f1a\u4e0a\u4f20\u5230\u300c\u8bbe\u8ba1\u6587\u4ef6 - \u7248\u6743\u56fe\u300d\uff0c\u4fdd\u5b58\u8349\u7a3f\u540e\u63d0\u5ba1\u3002\u591a SKU \u53ef\u6309\u6587\u4ef6\u540d\u4e2d\u7684 SKU \u5339\u914d\uff0c\u6216\u6309\u56fe\u7247\u987a\u5e8f\u4e00\u5bf9\u4e00\u5206\u914d\u3002</p><p class="pfh-upload-guide-tip">\u8bf7\u5148\u4fdd\u8bc1 SKU \u5df2\u6709\u672c\u5730\u7f13\u5b58\uff0c\u4ee5\u907f\u514d\u4efb\u52a1\u65e0\u6cd5\u83b7\u53d6\u5236\u4f5c\u6570\u636e\u3002</p></article></section></div>';
  }

  function uploadClearConfirmModalHtml() {
    if (!state.uploadClearConfirmOpen) return '';
    const history = state.uploadView === 'history';
    return '<div class="pfh-upload-guide-modal pfh-upload-clear-modal"><section role="dialog" aria-modal="true" aria-label="确认清空"><header><h3>确认清空</h3><button type="button" data-action="upload-clear-cancel" aria-label="关闭">×</button></header><article><b>' + (history ? '清空全部历史记录？' : '清空当前提审队列？') + '</b><p>' + (history ? '清空后将无法在历史记录中查看已上传或报错的产品。' : '队列中的待上传文件会被移除，这项操作无法撤销。') + '</p><footer><button type="button" data-action="upload-clear-cancel">取消</button><button type="button" class="is-danger" data-action="upload-clear-confirm">确认清空</button></footer></article></section></div>';
  }

  function renderCompactPager(actionPrefix, currentPage, totalPages) {
    const pages = buildCompactPages(currentPage, totalPages);
    return pages.map((page) => {
      if (page === '...') return '<span class="pfh-pager-ellipsis">\u2026</span>';
      const active = page === currentPage;
      return active
        ? '<b>' + page + '</b>'
        : '<button type="button" class="pfh-pager-page" data-action="' + actionPrefix + '-goto" data-page="' + page + '">' + page + '</button>';
    }).join('');
  }

  function buildCompactPages(currentPage, totalPages) {
    if (totalPages <= 1) return [1];
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage <= 3) {
      [2, 3, 4].forEach((page) => pages.add(page));
    } else if (currentPage >= totalPages - 2) {
      [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
    } else {
      [currentPage - 1, currentPage + 1].forEach((page) => pages.add(page));
    }
    const sorted = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    return sorted.reduce((result, page) => {
      const previous = result[result.length - 1];
      if (typeof previous === 'number' && page - previous > 1) result.push('...');
      result.push(page);
      return result;
    }, []);
  }

  function handleLedgerMoreAction(button) {
    if (!button || button.disabled) return;
    const sku = String(button.getAttribute('data-sku') || '').trim();
    const date = normalizeLedgerDate(button.getAttribute('data-date')) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    if (!sku) return;
    const panel = ensurePanel();
    const card = button.closest('.pfh-ledger-item');
    const record = findLedgerRecord(sku, date) || (state.ledgerRecords || []).find((item) => getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku));
    if (!record || !card) return;
    state.ledgerFlowTransitionSku = '';
    const opening = state.ledgerMenuSku !== sku || state.ledgerMenuDate !== date;
    state.ledgerMenuSku = opening ? sku : '';
    state.ledgerMenuDate = opening ? date : '';
    closeRenderedLedgerMenus(panel, opening ? card : null);
    card.classList.toggle('is-menu-open', opening);
    button.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if (!opening) return;
    card.insertAdjacentHTML('beforeend', ledgerOverflowMenuHtml(record, sku, escapeHtml(date), Boolean(record.imageGeneratedAt)));
    const nextButton = card.querySelector('[data-action="ledger-more"]');
    if (nextButton) positionRenderedLedgerMenu(panel, nextButton);
  }

  function handleLedgerMoreClickCapture(event) {
    if (!event || state.view !== 'ledger') return;
    const target = event.target;
    const button = target && typeof target.closest === 'function'
      ? target.closest('[data-action="ledger-more"]')
      : null;
    if (!button || button.disabled) return;
    event.preventDefault();
    // The panel also has a normal bubble listener. Stop sibling listeners here
    // so one click cannot open the menu and immediately toggle it closed again.
    event.stopImmediatePropagation();
    handleLedgerMoreAction(button);
  }
