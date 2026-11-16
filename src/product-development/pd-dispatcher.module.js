
  function productDevelopmentViewHtml(statusText) {
    if (state.productDevelopmentView === 'materials') return productDevelopmentMaterialsViewHtml(statusText);
    return homeViewHtml(statusText);
  }

  function productDevelopmentHandleAction(action, actionTarget) {
    const accessFeature = productDevelopmentFeatureForAction(action, actionTarget);
    if (accessFeature && !productDevelopmentHasAccess(accessFeature)) {
      const name = findCurrentPlmUserName();
      refreshProductDevelopmentAccess({ force: true }).then(() => {
        if (findCurrentPlmUserName() !== name) return;
        if (productDevelopmentHasAccess(accessFeature)) productDevelopmentHandleAction(action, actionTarget);
        else showProductDevelopmentPermissionDialog();
      }).catch(() => showToast('权限检查失败，请稍后重试'));
      return true;
    }
    const workspaceViews = {
      'product-development-review-open': 'review',
      'product-development-copywriting-open': 'copywriting',
      'product-development-ingredient-open': 'ingredient',
      'product-development-pricing-open': 'pricing',
    };
    if (workspaceViews[action] && state.view !== 'productDevelopmentTasks') {
      openProductDevelopmentTaskWorkspace(workspaceViews[action]);
      return true;
    }
    if (action === 'product-development-copywriting-more') {
      const moreWrapper = actionTarget && actionTarget.closest('.pfh-cw-tools');
      if (moreWrapper) productDevelopmentCopywritingSetToolsOpen(moreWrapper, !moreWrapper.classList.contains('is-open'));
      return true;
    }
    if (action === 'product-development-template-import') {
      const tools = actionTarget.closest('.pfh-cw-tools');
      const input = tools.parentElement.querySelector('.pfh-product-development-template-input');
      productDevelopmentCopywritingSetToolsOpen(tools, false);
      if (input) input.click();
      return true;
    }
    if (action === 'product-development-copywriting-copy') {
      const result = state.productDevelopmentCopywriting;
      if (result && result.content && result.sku === getProductDevelopmentCurrentSku()) {
        copyText([['产品功效', 'efficacy'], ['产品优势', 'advantages'], ['产品卖点', 'sellingPoints'], ['成分功能', 'ingredientFunctions']].map(([label, key]) => label + '\n' + (result.content[key] || []).map((item) => [item.titleEn, item.en || item.ingredientEn, item.titleCn, item.cn || item.ingredientCn].filter(Boolean).join('\n')).join('\n\n')).join('\n\n'));
        showToast('文案已复制');
      }
      return true;
    }
    if (action === 'work-mode') {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      if (state.productDevelopmentIngredientEditor) saveProductDevelopmentIngredientEditorDraft(state.productDevelopmentIngredientEditor);
      state.productDevelopmentReviewEditorOpen = false;
      setProductDevelopmentWorkMode(actionTarget && actionTarget.getAttribute('data-work-mode'));
      return true;
    }
    if (action === 'product-development-home') {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      if (state.productDevelopmentIngredientEditor) saveProductDevelopmentIngredientEditorDraft(state.productDevelopmentIngredientEditor);
      state.productDevelopmentIngredientLoadToken = Number(state.productDevelopmentIngredientLoadToken || 0) + 1;
      state.productDevelopmentReviewEditorOpen = false;
      state.view = 'home';
      state.productDevelopmentView = 'home';
      state.productDevelopmentError = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-pricing-open') {
      state.productDevelopmentTaskView = 'pricing';
      renderShell();
      return true;
    }
    if (action === 'product-development-pricing-apply') {
      productDevelopmentApplyPricingToProduct(actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-ingredient-open') {
      state.workMode = 'product-development';
      state.settings.workMode = 'product-development';
      saveSettings(state.settings);
      state.productDevelopmentTaskView = 'ingredient';
      state.productDevelopmentIngredientError = '';
      state.productDevelopmentIngredientStatus = '';
      renderShell();
      loadProductDevelopmentIngredientEditor();
      return true;
    }
    if (action === 'product-development-copywriting-one-shot-run' || action === 'product-development-copywriting-ingredient-run') {
      runProductDevelopmentIngredientTable();
      return true;
    }
    if (action === 'product-development-copywriting-ingredient-confirm') {
      runProductDevelopmentCopywritingFromIngredientTable();
      return true;
    }
    if (action === 'product-development-one-shot-download-pdf') {
      downloadProductDevelopmentOneShotIngredient().catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (action === 'product-development-one-shot-download-copywriting') {
      downloadProductDevelopmentOneShotDocx().catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (action === 'product-development-one-shot-ingredient-add') {
      const result = state.productDevelopmentOneShotResult;
      const rows = result && result.ingredientTable && Array.isArray(result.ingredientTable.rows) ? result.ingredientTable.rows : null;
      if (!rows) {
        showToast('请先完成一次生成');
        return true;
      }
      if (rows.length >= 6) {
        showToast('当前成分表最多保留 6 行核心活性成分');
        return true;
      }
      rows.push({ nameEn: '', nameCn: '', latinName: '', sourcePart: '', standardization: '', amountMg: 0, amountValue: 0, amountUnit: '', amountText: '', dailyValue: '**', markerActiveMg: 0, labelEn: '' });
      productDevelopmentOneShotApplyDraftMetrics(result);
      renderShell();
      return true;
    }
    if (action === 'product-development-one-shot-ingredient-remove') {
      const result = state.productDevelopmentOneShotResult;
      const rows = result && result.ingredientTable && Array.isArray(result.ingredientTable.rows) ? result.ingredientTable.rows : null;
      const index = Number(actionTarget && actionTarget.getAttribute('data-product-development-one-shot-row-index'));
      if (!rows || !Number.isInteger(index) || !rows[index]) return true;
      if (rows.length <= 1) {
        showToast('至少保留 1 行核心活性成分');
        return true;
      }
      rows.splice(index, 1);
      productDevelopmentOneShotApplyDraftMetrics(result);
      renderShell();
      return true;
    }
    if (action === 'product-development-ingredient-home') {
      if (state.productDevelopmentIngredientEditor) saveProductDevelopmentIngredientEditorDraft(state.productDevelopmentIngredientEditor);
      state.productDevelopmentIngredientLoadToken = Number(state.productDevelopmentIngredientLoadToken || 0) + 1;
      state.productDevelopmentView = 'home';
      state.productDevelopmentIngredientBusy = false;
      state.productDevelopmentIngredientError = '';
      state.productDevelopmentIngredientStatus = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-ingredient-save-local') {
      saveProductDevelopmentIngredientLocal();
      return true;
    }
    if (action === 'product-development-ingredient-export') {
      exportProductDevelopmentIngredientPdf();
      return true;
    }
    if (action === 'product-development-tasks-open') {
      openProductDevelopmentTaskWorkspace();
      return true;
    }
    if (action === 'product-development-tasks-home') {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      state.productDevelopmentReviewEditorOpen = false;
      state.view = 'home';
      state.productDevelopmentView = 'home';
      state.productDevelopmentError = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-tasks-refresh') {
      loadProductDevelopmentTasks({ force: true }).catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (action === 'product-development-task-select') {
      const task = selectProductDevelopmentTask(actionTarget && actionTarget.getAttribute('data-sku'));
      if (!task) showToast('开发任务不存在或已刷新');
      return true;
    }
    if (action === 'product-development-task-meta-translate') {
      const sku = String(actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku()).trim().toUpperCase();
      const panel = ensurePanel();
      const cnInput = panel && panel.querySelector('.pfh-product-development-task-meta-input[data-meta-sku="' + sku + '"][data-meta-field="productNameCn"]');
      const enInput = panel && panel.querySelector('.pfh-product-development-task-meta-input[data-meta-sku="' + sku + '"][data-meta-field="productNameEn"]');
      const metaNow = state.productDevelopmentTaskMeta && typeof state.productDevelopmentTaskMeta === 'object' ? state.productDevelopmentTaskMeta[sku] : null;
      const cnValue = String(cnInput && cnInput.value || metaNow && metaNow.productNameCn || '').trim();
      if (!cnValue) { showToast('请先填写产品中文名'); return true; }
      const originalLabel = actionTarget ? actionTarget.textContent : '';
      if (actionTarget) { actionTarget.disabled = true; actionTarget.textContent = '翻译中…'; }
      productDevelopmentTranslateZhToEn(cnValue).then((translated) => {
        const value = translated.slice(0, 180);
        if (enInput) {
          enInput.value = value;
          enInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          const meta = getProductDevelopmentTaskMeta(state.productDevelopmentSelectedTask, state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku]);
          meta.productNameEn = value;
          if (!state.productDevelopmentTaskMeta || typeof state.productDevelopmentTaskMeta !== 'object') state.productDevelopmentTaskMeta = Object.create(null);
          state.productDevelopmentTaskMeta[sku] = meta;
          saveProductDevelopmentTaskMeta(sku, meta);
          scheduleProductDevelopmentTaskMetaSave(sku, meta);
        }
        if (actionTarget) { actionTarget.disabled = false; actionTarget.textContent = originalLabel || '中文名翻英文名'; }
        showToast('已翻译英文名：' + value);
      }).catch((error) => {
        if (actionTarget) { actionTarget.disabled = false; actionTarget.textContent = originalLabel || '中文名翻英文名'; }
        showToast('翻译失败：' + String(error && error.message || '未知错误'));
      });
      return true;
    }
    if (action === 'product-development-product-fill-page1') {
      productDevelopmentRunPlmDomFill('page1', actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-product-fill-page2') {
      productDevelopmentRunPlmDomFill('page2', actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-product-save-plm') {
      productDevelopmentRunProductDetailPlmSave(actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-bom-fill-plm') {
      productDevelopmentRunBomDomFill(actionTarget && actionTarget.getAttribute('data-bom-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-bom-save-plm') {
      productDevelopmentRunBomPlmSave(actionTarget && actionTarget.getAttribute('data-bom-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-bom-toggle-material') {
      const enabled = actionTarget && actionTarget.getAttribute('data-material-enabled') === 'true';
      productDevelopmentSetMaterialEnabled(
        actionTarget && actionTarget.getAttribute('data-bom-sku') || getProductDevelopmentCurrentSku(),
        actionTarget && actionTarget.getAttribute('data-material-kind') || '',
        enabled,
      );
      return true;
    }
    if (action === 'product-development-task-tab') {
      const next = normalizeProductDevelopmentTaskTab(actionTarget && actionTarget.getAttribute('data-product-development-tab'));
      const current = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
      if (next === current) return true;
      state.productDevelopmentTaskPreviousTab = current;
      state.productDevelopmentTaskView = next;
      if (next === 'ingredient') loadProductDevelopmentIngredientEditor();
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      const taskPanel = ensurePanel();
      const task = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku) || state.productDevelopmentSelectedTask;
      if (state.view === 'productDevelopmentTasks' && task && taskPanel.querySelector('.pfh-product-development-task-tabs')) {
        state.data = productDevelopmentTaskSeedData(task);
        state.selectedSku = task.sku;
        renderProductDevelopmentTaskDetail(taskPanel, '', task);
        setupProductDevelopmentTaskTabs(taskPanel);
      } else renderShell();
      return true;
    }
    if (action === 'product-development-task-page' || action === 'product-development-task-page-goto') {
      const pageSize = getSkuListMode() === 'waterfall' ? 20 : 10;
      const totalPages = Math.max(1, Math.ceil((Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks.length : 0) / pageSize));
      const current = Number(state.productDevelopmentTaskPage) || 1;
      const requested = Number(actionTarget && actionTarget.getAttribute('data-page'));
      state.productDevelopmentTaskPage = Number.isInteger(requested) && requested > 0
        ? Math.max(1, Math.min(totalPages, requested))
        : (actionTarget && actionTarget.getAttribute('data-page') === 'prev'
          ? Math.max(1, current - 1)
          : Math.min(totalPages, current + 1));
      renderProductDevelopmentTaskSidebarList(ensurePanel());
      return true;
    }
    if (action === 'product-development-materials-view') {
      productDevelopmentSweepMaterialsFromCaches();
      state.productDevelopmentView = 'materials';
      state.productDevelopmentError = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-review-open') {
      state.productDevelopmentReviewEditorOpen = false;
      restoreProductDevelopmentReviewDraft(getProductDevelopmentCurrentSku());
      state.productDevelopmentTaskPreviousTab = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
      state.productDevelopmentTaskView = 'review';
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-review-run') {
      runProductDevelopmentReview();
      return true;
    }
    if (action === 'product-development-review-editor-open') {
      // The editor opens in a dedicated browser tab: the helper panel's root
      // carries backdrop-filter, so any in-panel overlay stays trapped inside
      // the panel no matter how it is positioned or re-parented.
      return productDevelopmentOpenReviewEditorTab();
    }
    if (action === 'product-development-review-editor-close') {
      state.productDevelopmentReviewEditorOpen = false;
      renderShell();
      return true;
    }
    if (action === 'product-development-review-copy-all' || action === 'product-development-review-copy-revised') {
      const result = state.productDevelopmentReview;
      const mode = action === 'product-development-review-copy-revised' ? 'revised' : 'all';
      const value = productDevelopmentReviewCopyValue(result, mode);
      if (!value) {
        showToast(mode === 'revised' ? '暂无可复制的修改后文案' : '暂无可复制的图片原文');
      } else {
        copyText(value);
        showToast(mode === 'revised' ? '修改后的文案已复制' : '图片原文全文已复制');
      }
      return true;
    }
    if (action === 'product-development-review-translate-revised') {
      const result = state.productDevelopmentReview;
      if (!result) {
        showToast('当前结果不可编辑，请重新分析当前对标图片');
        return true;
      }
      const list = Array.isArray(result.items) ? result.items : [];
      const targets = list.filter((item) => productDevelopmentCompactSemanticText(item && item.replacementEn, 300));
      if (!targets.length) {
        showToast('没有可翻译的英文改写内容');
        return true;
      }
      state.productDevelopmentReviewTranslateBusy = true;
      renderShell();
      productDevelopmentTranslatePool(targets, (item) => productDevelopmentTranslateEnToZh(productDevelopmentCompactSemanticText(item.replacementEn, 300)).then((translated) => {
        item.replacementZh = productDevelopmentCleanText(translated, 500);
      }), 4).then(() => {
        state.productDevelopmentReviewTranslateBusy = false;
        saveProductDevelopmentReviewDraft(result);
        state.productDevelopmentStatus = '已把英文改写翻译为中文，可继续手动调整';
        renderShell();
      }).catch((error) => {
        state.productDevelopmentReviewTranslateBusy = false;
        saveProductDevelopmentReviewDraft(result);
        showToast('翻译失败：' + String(error && error.message || '未知错误'));
        renderShell();
      });
      return true;
    }
    if (action === 'product-development-review-add') {
      const result = state.productDevelopmentReview;
      if (!result) {
        showToast('请先完成一次图片文字分析');
        return true;
      }
      if (!Array.isArray(result.items)) result.items = [];
      if (result.items.length >= 80) {
        showToast('最多保留 80 个图片文字项');
        return true;
      }
      result.items.push({
        id: 'manual-' + Date.now().toString(36),
        sourceText: '',
        riskTypes: ['other'],
        replacementEn: '',
        replacementZh: '',
        confidence: 0,
      });
      saveProductDevelopmentReviewDraft(result);
      state.productDevelopmentStatus = '已添加手动文字项，请填写原文、英文改写和中文翻译';
      renderShell();
      return true;
    }
    if (action === 'product-development-review-remove') {
      const result = state.productDevelopmentReview;
      const index = Number(actionTarget && actionTarget.getAttribute('data-review-index'));
      if (result && Array.isArray(result.items) && Number.isInteger(index) && result.items[index]) {
        result.items.splice(index, 1);
        saveProductDevelopmentReviewDraft(result);
        state.productDevelopmentStatus = '已移除当前风险文字项，请重新生成对照图';
        renderShell();
      }
      return true;
    }
    if (action === 'product-development-review-recompose') {
      recomposeProductDevelopmentReview();
      return true;
    }
    if (action === 'product-development-review-download') {
      const result = state.productDevelopmentReview;
      if (!result || !result.comparisonDataUrl) {
        showToast('暂无可下载的对照图');
        return true;
      }
      downloadProductDevelopmentDataUrl(result.comparisonDataUrl, result.fileName || productDevelopmentFileName(result.sku, 'infringement-comparison', 'png')).catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (action === 'product-development-copywriting-open') {
      restoreProductDevelopmentCopywritingCache(getProductDevelopmentCurrentSku());
      state.productDevelopmentTaskPreviousTab = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
      state.productDevelopmentTaskView = 'copywriting';
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      renderShell();
      productDevelopmentWarmIngredientTemplates();
      return true;
    }
    if (action === 'product-development-copywriting-run') {
      runProductDevelopmentCopywriting();
      return true;
    }
    if (action === 'product-development-copywriting-regular-run') {
      runProductDevelopmentRegularCopywriting();
      return true;
    }
    if (action === 'product-development-copywriting-download') {
      downloadProductDevelopmentCopywritingResult().catch((error) => {
        state.productDevelopmentError = productDevelopmentFriendlyCopywritingError(error);
        state.productDevelopmentStatus = '';
        showToast(state.productDevelopmentError);
        renderShell();
      });
      return true;
    }
    if (action === 'product-development-context-refresh') {
      const sku = getProductDevelopmentCurrentSku();
      const task = getProductDevelopmentTaskBySku(sku) || state.productDevelopmentSelectedTask;
      state.productDevelopmentSnapshot = null;
      state.productDevelopmentStatus = '正在重新读取当前 SKU 的 PLM 资料…';
      renderShell();
      const requests = [];
      if (sku) requests.push(loadProductDevelopmentSnapshot(sku, true, { requireIngredients: false, imageKind: 'benchmark' }));
      if (task && task.sku) requests.push(hydrateProductDevelopmentTaskDetail(task, { force: true }));
      if (requests.length) Promise.all(requests).then(() => { state.productDevelopmentStatus = '当前 SKU 资料已刷新'; renderShell(); }).catch((error) => { state.productDevelopmentError = formatErrorMessage(error); renderShell(); });
      return true;
    }
    if (action === 'product-development-template-reset') {
      const tools = actionTarget && actionTarget.closest('.pfh-cw-tools');
      if (tools) productDevelopmentCopywritingSetToolsOpen(tools, false);
      resetProductDevelopmentTemplate();
      return true;
    }
    return false;
  }

  function productDevelopmentHandleChange(event) {
    const target = event && event.target;
    if (!target || !target.classList) return false;
    if (target.getAttribute('data-product-development-one-shot-editor-field') || target.getAttribute('data-product-development-one-shot-row-index')) {
      window.setTimeout(() => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskView === 'copywriting'
          || state.view === 'detail' && state.settings.designDevelopmentTabs === true && state.designDevelopmentTab === 'development-copywriting') renderShell();
      }, 0);
      return true;
    }
    if (target.classList.contains('pfh-product-development-form-input')) {
      const label = target.closest && target.closest('.pfh-product-development-form-field');
      if (label && label.classList) label.classList.toggle('is-missing', !String(target.value || '').trim());
      productDevelopmentHandleInput(event);
      const sku = String(target.getAttribute('data-form-sku') || '').trim().toUpperCase();
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
      if (detail && detail.productDetailDraftDirty) {
        detail.productDetailDraftDirty = false;
        detail.productDetailSavedAt = new Date().toLocaleString();
        detail.productDetailSaveState = 'saved';
        detail.productDetailSaveMessage = '建品资料已自动保存到本地';
        detail.cacheSource = 'local-cache';
        clearProductDevelopmentReadonlyDetailCacheWriteTimer(sku);
        saveProductDevelopmentReadonlyDetailCache(sku, detail);
        const form = target.closest && target.closest('.pfh-product-development-detail-form');
        const status = form && form.querySelector('.pfh-product-development-material-save-status');
        if (status) {
          status.textContent = detail.productDetailSaveMessage;
          status.classList.remove('is-dirty', 'is-error');
          status.classList.add('is-saved');
        }
      }
      return true;
    }
    const files = Array.from(target.files || []);
    if (target.classList.contains('pfh-product-development-copywriting-template-input')) {
      try {
        selectProductDevelopmentCopywritingTemplate(target.value);
      } catch (error) {
        showToast(formatErrorMessage(error));
      }
      return true;
    }
    if (target.classList.contains('pfh-product-development-one-shot-ingredient-template-input')) {
      productDevelopmentOneShotSwitchIngredientTemplate(target.value);
      return true;
    }
    if (target.classList.contains('pfh-product-development-one-shot-ingredient-sheet-input')) {
      productDevelopmentOneShotSwitchIngredientSheet(target.value);
      return true;
    }
    if (target.classList.contains('pfh-product-development-ingredient-kind-input')) {
      productDevelopmentIngredientSwitchSelection(target.value, '', '');
      return true;
    }
    if (target.classList.contains('pfh-product-development-ingredient-template-input')) {
      productDevelopmentIngredientSwitchSelection(state.productDevelopmentIngredientKind, target.value, '');
      return true;
    }
    if (target.classList.contains('pfh-product-development-ingredient-sheet-input')) {
      productDevelopmentIngredientSwitchSelection(state.productDevelopmentIngredientKind, state.productDevelopmentIngredientTemplateId, target.value);
      return true;
    }
    if (target.classList.contains('pfh-product-development-benchmark-input')) {
      target.value = '';
      if (files[0]) importProductDevelopmentBenchmarkImage(files[0]).catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (productDevelopmentHandleMaterialField(target, 'change')) return true;
    if (!target.classList.contains('pfh-product-development-template-input')) return false;
    target.value = '';
    if (files[0]) importProductDevelopmentTemplate(files[0]).catch((error) => showToast(formatErrorMessage(error)));
    return true;
  }

  function productDevelopmentHandleInput(event) {
    const target = event && event.target;
    if (!target || !target.classList) return false;
    if (target.classList.contains('pfh-product-development-pricing-input')) {
      const field = String(target.getAttribute('data-product-development-pricing-field') || '').trim();
      if (!['fullPackagePrice', 'taxRatePercent'].includes(field)) return true;
      const sku = getProductDevelopmentCurrentSku();
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
      const input = productDevelopmentPricingInputForSku(sku, detail);
      input[field] = String(target.value || '').trim().slice(0, field === 'fullPackagePrice' ? 40 : 20);
      saveProductDevelopmentPricingInput(input);
      const result = productDevelopmentCalculateTierPrices(input.fullPackagePrice, input.taxRatePercent);
      const root = target.closest && target.closest('.pfh-product-development');
      const preview = root && root.querySelector('.pfh-product-development-pricing-result');
      if (preview) preview.innerHTML = productDevelopmentPricingResultHtml(result, sku, detail);
      return true;
    }
    if (productDevelopmentHandleOneShotEditorInput(target)) return true;
    const oneShotField = String(target.getAttribute('data-product-development-one-shot-field') || '').trim();
    if (oneShotField && Object.prototype.hasOwnProperty.call(PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT, oneShotField)) {
      if (!state.productDevelopmentOneShotInput || typeof state.productDevelopmentOneShotInput !== 'object') state.productDevelopmentOneShotInput = productDevelopmentOneShotLoadDraft();
      const nextValue = String(target.value || '').slice(0, oneShotField === 'requestedFunctions' ? 1800 : oneShotField === 'otherIngredientsEn' ? 1600 : oneShotField === 'otherIngredientsCn' ? 1200 : oneShotField === 'referenceUrl' ? 1200 : oneShotField === 'regularIngredientsEn' || oneShotField === 'regularIngredientsInactiveEn' || oneShotField === 'regularIngredientsCn' || oneShotField === 'regularIngredientsInactiveCn' ? 3000 : 240);
      state.productDevelopmentOneShotInput[oneShotField] = nextValue;
      if (oneShotField === 'targetActiveMg' || oneShotField === 'targetActivePercent') {
        state.productDevelopmentOneShotInput[oneShotField + 'Explicit'] = nextValue.trim() ? 'true' : 'false';
      }
      saveProductDevelopmentOneShotDraft(state.productDevelopmentOneShotInput);
      if (oneShotField === 'packagingKind') {
        const snapshot = state.productDevelopmentSnapshot;
        if (snapshot && snapshot.sku === getProductDevelopmentCurrentSku()) snapshot.packagingKind = ['boxed', 'bagged'].includes(nextValue) ? nextValue : '';
        const result = state.productDevelopmentCopywriting;
        if (result && result.sku === getProductDevelopmentCurrentSku() && result.content) {
          result.snapshot = { ...result.snapshot, packagingKind: ['boxed', 'bagged'].includes(nextValue) ? nextValue : '' };
          result.blob = null;
          saveProductDevelopmentCopywritingCache(result);
        }
        const oneShot = state.productDevelopmentOneShotResult;
        if (oneShot && oneShot.sku === getProductDevelopmentCurrentSku()) {
          oneShot.snapshot = { ...oneShot.snapshot, packagingKind: ['boxed', 'bagged'].includes(nextValue) ? nextValue : '' };
          oneShot.docxBlob = null;
        }
        return true;
      }
      productDevelopmentCopywritingMarkDirty();
      productDevelopmentCopywritingUpdateIngredientCounts();
      return true;
    }
    if (target.classList.contains('pfh-product-development-one-shot-product-line-input') || target.classList.contains('pfh-product-development-one-shot-ndc-input')) {
      if (!state.productDevelopmentOneShotInput || typeof state.productDevelopmentOneShotInput !== 'object') state.productDevelopmentOneShotInput = productDevelopmentOneShotLoadDraft();
      const previousLine = productDevelopmentEffectiveProductLine();
      if (target.classList.contains('pfh-product-development-one-shot-product-line-input')) {
        state.productDevelopmentOneShotInput.productLine = target.value === 'food' || target.value === 'regular' ? target.value : '';
      } else {
        state.productDevelopmentOneShotInput.regularNdcKind = target.value === 'ndc' ? 'ndc' : 'non-ndc';
      }
      const currentLine = productDevelopmentEffectiveProductLine();
      if (currentLine === 'regular' && (!state.productDevelopmentOneShotInput.productType || state.productDevelopmentOneShotInput.productType === PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.productType)) {
        state.productDevelopmentOneShotInput.productType = 'Cosmetic / personal care product';
      }
      if (currentLine === 'food' && state.productDevelopmentOneShotInput.productType === 'Cosmetic / personal care product') {
        state.productDevelopmentOneShotInput.productType = PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.productType;
      }
      saveProductDevelopmentOneShotDraft(state.productDevelopmentOneShotInput);
      productDevelopmentCopywritingMarkDirty();
      productDevelopmentSyncRegularCopywritingTemplate();
      if (previousLine !== currentLine && state.productDevelopmentOneShotResult && state.productDevelopmentOneShotResult.sku === getProductDevelopmentCurrentSku()) {
        state.productDevelopmentOneShotResult = null;
        state.productDevelopmentOneShotIngredientConfirmed = false;
      }
      renderShell();
      return true;
    }
    if (target.classList.contains('pfh-product-development-ingredient-cell-input')) {
      const editor = state.productDevelopmentIngredientEditor;
      const address = String(target.getAttribute('data-product-development-ingredient-cell') || '').trim();
      const cell = editor && Array.isArray(editor.cells) ? editor.cells.find((item) => item && item.address === address) : null;
      if (cell) {
        cell.value = String(target.value || '').slice(0, 6000);
        scheduleProductDevelopmentIngredientEditorDraftSave(editor);
      }
      return true;
    }
    if (productDevelopmentHandleMaterialField(target)) return true;
    if (target.classList.contains('pfh-product-development-form-input')) {
      const label = target.closest && target.closest('.pfh-product-development-form-field');
      if (label && label.classList) label.classList.toggle('is-missing', !String(target.value || '').trim());
      const sku = String(target.getAttribute('data-form-sku') || '').trim().toUpperCase();
      const group = String(target.getAttribute('data-form-group') || 'required').trim();
      const key = String(target.getAttribute('data-form-key') || '').trim();
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
      const persistDetail = () => {
        if (!detail) return;
        detail.cacheSource = 'local-cache';
        scheduleProductDevelopmentReadonlyDetailCache(sku, detail);
      };
      let field = null;
      if (group === 'bom' || group === 'attachments') return true;
      if (detail && group === 'page1') {
        const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS.find((item) => item.key === key);
        if (definition) {
          const value = String(target.value || '').slice(0, 800);
          if (!detail.productDetailLocalPage1 || typeof detail.productDetailLocalPage1 !== 'object') detail.productDetailLocalPage1 = Object.create(null);
          detail.productDetailLocalPage1[key] = value;
          if (['productNameCn', 'productNameEn'].includes(key)) {
            detail[key] = value;
            productDevelopmentRememberLocalProductName(detail, key, value);
          }
          if (['brand', 'productNameCn', 'productNameEn'].includes(key)) {
            const task = getProductDevelopmentTaskBySku(sku) || state.productDevelopmentSelectedTask || {};
            const meta = getProductDevelopmentTaskMeta(task, detail);
            meta[key] = value;
            if (!state.productDevelopmentTaskMeta || typeof state.productDevelopmentTaskMeta !== 'object') state.productDevelopmentTaskMeta = Object.create(null);
            state.productDevelopmentTaskMeta[sku] = meta;
            saveProductDevelopmentTaskMeta(sku, meta);
          }
          productDevelopmentMarkProductDetailDirty(detail);
          persistDetail();
        }
        return true;
      }
      if (detail && group === 'prefill') {
        const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
        if (definition) {
          const scope = target.closest && target.closest('.pfh-detail');
          if (['firstPrice', 'secondPrice', 'thirdPrice'].includes(key)) { productDevelopmentSyncCostTierPrices(detail, scope); return true; }
          if (key === 'procurementPrice') {
            if (target.readOnly) return true;
            detail.productDetailProcurementPriceSource = 'manual';
          }
          if (['outerVolume', 'standardPackingQuantity'].includes(key)) {
            productDevelopmentRefreshDerivedDimensions(detail, scope);
            return true;
          }
          const value = String(target.value || '').slice(0, definition.type === 'textarea' ? 12000 : 800);
          const displayValue = productDevelopmentPrefillText(value, 12000);
          const option = (detail.prefillOptions && detail.prefillOptions[definition.attrId] || []).find((item) => item.label === displayValue);
          const storedValue = option ? (Array.isArray(option.value) ? option.value : [option.value]) : value;
          productDevelopmentRememberLocalProductField(detail, { attrId: definition.attrId }, storedValue, displayValue);
          productDevelopmentProductFieldCollections(detail).filter((item) => Number(item && item.attrId) === Number(definition.attrId)).forEach((item) => {
            item.value = storedValue;
            item.displayValue = displayValue;
            item.status = displayValue ? '已填写（本地）' : '待补充';
            item.source = displayValue ? '本地人工填写（未写入）' : '待人工补充';
          });
          if (['outerLength', 'outerWidth', 'outerHeight'].includes(key)) productDevelopmentRefreshDerivedDimensions(detail, scope);
          if (key === 'costPrice') productDevelopmentSyncCostTierPrices(detail, scope);
          productDevelopmentMarkProductDetailDirty(detail);
          persistDetail();
        }
        return true;
      }
      if (detail && group === 'procurement') {
        const definition = PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS.find((item) => item.key === key);
        if (definition) {
          let value = String(target.value || '').slice(0, 800);
          if (key === 'materialPrice' && event.type === 'change') {
            const rounded = productDevelopmentRoundUnitPrice(value);
            if (rounded !== '') { value = rounded; target.value = rounded; }
          }
          if (key === 'supplier') {
            const options = detail.productDevelopmentSupplierOptions || [];
            if (!options.some((item) => item.label === value)) {
              if (event.type === 'input') productDevelopmentSearchSuppliers(target);
              return true;
            }
          }
          if (!detail.productDetailLocalProcurement || typeof detail.productDetailLocalProcurement !== 'object') detail.productDetailLocalProcurement = Object.create(null);
          detail.productDetailLocalProcurement[key] = value;
          if (key === 'materialPrice') {
            detail.productDetailProcurementPriceSource = 'default';
            productDevelopmentSyncProcurementPrice(detail, target.closest && target.closest('.pfh-detail'));
          }
          if (key === 'quantity') detail.productDetailProcurementQuantitySource = 'manual';
          productDevelopmentMarkProductDetailDirty(detail);
          persistDetail();
        }
        return true;
      }
      const fields = detail && (group === 'price'
        ? detail.priceFields
        : group === 'base'
          ? detail.baseFields
          : group === 'product'
            ? detail.productFields
            : detail.requiredFields);
      field = Array.isArray(fields) ? fields.find((item) => String(item && item.key || '') === key) : null;
      if (field) {
        field.value = String(target.value || '').slice(0, 800);
        field.displayValue = field.value;
        field.status = field.value.trim() ? '已填写（本地）' : '待补充';
        field.source = field.value.trim() ? '本地人工填写（未写入）' : '待人工补充';
        if (group === 'product' || group === 'price') {
          productDevelopmentRememberLocalProductField(detail, field, field.value, field.displayValue);
          productDevelopmentMarkProductDetailDirty(detail);
        } else if (group === 'base' && ['productNameCn', 'productNameEn'].includes(key)) {
          productDevelopmentRememberLocalProductName(detail, key, field.value);
          productDevelopmentMarkProductDetailDirty(detail);
        }
        persistDetail();
      }
      return true;
    }
    if (target.classList.contains('pfh-product-development-task-meta-input')) {
      const sku = String(target.getAttribute('data-meta-sku') || '').trim().toUpperCase();
      const field = String(target.getAttribute('data-meta-field') || '').trim();
      if (sku && ['brand', 'productNameCn', 'productNameEn', 'reworkProductCode'].includes(field)) {
        if (!state.productDevelopmentTaskMeta || typeof state.productDevelopmentTaskMeta !== 'object') state.productDevelopmentTaskMeta = Object.create(null);
        const meta = getProductDevelopmentTaskMeta(state.productDevelopmentSelectedTask, state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku]);
        const rawValue = String(target.value || '').slice(0, field === 'reworkProductCode' ? 120 : 180);
        meta[field] = field === 'brand' ? productDevelopmentNormalizeBrandValue(rawValue) : rawValue;
        state.productDevelopmentTaskMeta[sku] = meta;
        saveProductDevelopmentTaskMeta(sku, meta);
        scheduleProductDevelopmentTaskMetaSave(sku, meta);
        if (field === 'reworkProductCode') productDevelopmentScheduleReworkProductLookup(sku, meta[field]);
        if (field === 'productNameCn') {
          const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
          if (detail) {
            productDevelopmentEnsureMaterialDrafts(detail, state.productDevelopmentSelectedTask || {});
            ['box', 'label', 'instruction'].forEach((kind) => productDevelopmentRecalculateMaterialDraft(kind, detail.materialDrafts[kind], detail, state.productDevelopmentSelectedTask || {}));
            detail.bomDraftDirty = true;
            detail.bomDraftSaveState = 'dirty';
            detail.bomPlmSaveState = '';
            detail.bomPlmSaveMessage = '';
            detail.cacheSource = 'local-cache';
            scheduleProductDevelopmentReadonlyDetailCache(sku, detail);
            ['box', 'label', 'instruction'].forEach((kind) => productDevelopmentSyncMaterialDraftDom(sku, kind, detail.materialDrafts[kind]));
          }
        }
      }
      return true;
    }
    if (target.classList.contains('pfh-product-development-name-input')) {
      const result = state.productDevelopmentReview;
      const field = String(target.getAttribute('data-name-field') || '');
      if (result && ['chineseProductName', 'englishProductName'].includes(field)) {
        result.productNaming = productDevelopmentNormalizeProductNaming(result.productNaming);
        result.productNaming[field] = productDevelopmentCleanText(target.value, 180);
        saveProductDevelopmentReviewDraft(result);
      }
      return true;
    }
    if (target.classList.contains('pfh-product-development-plain-copy-input')) {
      const result = state.productDevelopmentReview;
      if (result) {
        result.plainTextCopy = productDevelopmentCleanText(target.value, 12000);
        scheduleProductDevelopmentReviewDraftSave(result);
      }
      return true;
    }
    if (!target.classList.contains('pfh-product-development-review-input')) return false;
    const result = state.productDevelopmentReview;
    const index = Number(target.getAttribute('data-review-index'));
    const field = String(target.getAttribute('data-review-field') || '');
    const item = result && Array.isArray(result.items) && Number.isInteger(index) ? result.items[index] : null;
    if (!item) return true;
    if (field === 'sourceText' || field === 'replacementEn' || field === 'replacementZh') {
      const value = String(target.value || '').slice(0, 500);
      item[field] = field === 'replacementEn' && productDevelopmentIsNetContentText(item.textRole, item.sourceText)
        ? value.toUpperCase()
        : value;
      scheduleProductDevelopmentReviewDraftSave(result);
      return true;
    }
    return true;
  }
