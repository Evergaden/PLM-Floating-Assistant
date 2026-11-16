
  function productDevelopmentReadonlyDetailHtml(detail) {
    if (!detail) return '<section class="pfh-product-development-detail-form"><header><div><small>PRODUCT DETAIL</small><h3>产品详情预填表单</h3></div><span>正在读取只读字段…</span></header><div class="pfh-product-development-form-empty">正在读取 BOM 和建品字段…</div></section>';
    const formSku = String(detail.sku || '').trim().toUpperCase();
    const productPlmBusy = state.productDevelopmentProductSaveSku === formSku;
    const productSaveStatus = detail.productDetailDraftDirty
      ? '有未保存修改'
      : detail.productDetailSaveMessage || (detail.productDetailSavedAt ? '已保存本地 · ' + detail.productDetailSavedAt : '尚未保存');
    const productSaveStatusClass = detail.productDetailDraftDirty
      ? ' is-dirty'
      : (detail.productDetailSaveState === 'error' || detail.productDetailPlmSaveState === 'error'
        ? ' is-error'
        : (detail.productDetailSavedAt ? ' is-saved' : ''));
    const productPlmStatus = detail.productDetailPlmSaveMessage
      ? '<p class="pfh-product-development-material-plm-status' + (detail.productDetailPlmSaveState === 'error' ? ' is-error' : ' is-saved') + '">' + escapeHtml(detail.productDetailPlmSaveMessage) + '</p>'
      : '';
    const sourceHint = detail.cacheSource === 'local-cache'
      ? '本地缓存' + (detail.loadedAt ? ' · 更新时间 ' + String(detail.loadedAt) : '')
      : '已读取 PLM · 更新时间 ' + String(detail.loadedAt || '');
    const domFillBusy = state.productDevelopmentDomFillSku === formSku;
    const domFillDisabled = domFillBusy || productPlmBusy ? ' disabled' : '';
    const page1Fields = PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS.map((definition) => ({ ...definition, formGroup: 'page1' }));
    const page2Fields = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.filter((definition) => !['outerVolume', 'standardPackingQuantity'].includes(definition.key)).map((definition) => ({ ...definition, formGroup: 'prefill' }));
    const procurementFields = PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS.map((definition) => ({ ...definition, formGroup: 'procurement' }));
    const renderFields = (fields, valueReader) => fields.map((field) => productDevelopmentPrefillFieldHtml(field, formSku, valueReader(field))).join('');
    return '<section class="pfh-product-development-detail-form"><header class="pfh-product-development-product-form-header" title="' + escapeHtml(sourceHint) + '"><div class="pfh-product-development-detail-heading"><h3>填写建品信息</h3><span class="pfh-product-development-material-save-status' + productSaveStatusClass + '">' + escapeHtml(domFillBusy ? '正在填写 PLM…' : productSaveStatus) + '</span></div><div class="pfh-product-development-material-header-actions"><button type="button" class="is-primary" data-action="product-development-product-fill-page1" data-product-sku="' + escapeHtml(formSku) + '"' + domFillDisabled + ' title="请在 PLM 停留在对应页面时使用；只填写当前表单，不会自动点下一步或保存">填写页面 1</button><button type="button" class="is-primary" data-action="product-development-product-fill-page2" data-product-sku="' + escapeHtml(formSku) + '"' + domFillDisabled + ' title="请在 PLM 停留在对应页面时使用；只填写当前表单，不会自动点下一步或保存">填写页面 2</button><button type="button" data-action="product-development-product-save-plm" data-product-sku="' + escapeHtml(formSku) + '"' + (productPlmBusy ? ' disabled' : '') + '>' + (productPlmBusy ? '正在保存…' : '保存到 PLM') + '</button></div></header>' +
      (detail.error
        ? '<p class="pfh-product-development-material-plm-status is-error">' + escapeHtml(detail.error) + '</p>'
        : '') +
      productPlmStatus +
      '<section class="pfh-product-development-form-section"><h4>页面 1 · 建品基础信息（' + page1Fields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + renderFields(page1Fields, (field) => productDevelopmentPage1FieldValue(detail, field.key)) + '</div></section>' +
      '<section class="pfh-product-development-form-section"><h4>页面 2 · 产品详情（' + page2Fields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + renderFields(page2Fields, (field) => productDevelopmentPrefillProductFieldValue(detail, field)) + '</div></section>' +
      '<section class="pfh-product-development-form-section"><h4>页面 2 · 采购明细（' + procurementFields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + renderFields(procurementFields, (field) => productDevelopmentProcurementFieldValue(detail, field.key)) + '</div></section></section>';
  }

  function productDevelopmentGoogleTranslate(text, sourceLang, targetLang) {
    return new Promise((resolve, reject) => {
      const query = String(text || '').trim().slice(0, 400);
      if (!query) { reject(new Error('文本为空')); return; }
      const sl = String(sourceLang || 'zh-CN');
      const tl = String(targetLang || 'en');
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + encodeURIComponent(sl) + '&tl=' + encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(query);
      const extract = (data) => {
        const segments = Array.isArray(data && data[0]) ? data[0] : [];
        const translated = segments.map((item) => Array.isArray(item) && typeof item[0] === 'string' ? item[0] : '').join('').trim();
        return translated;
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          timeout: 12000,
          onload: (response) => {
            try {
              if (response.status !== 200) { reject(new Error('HTTP ' + response.status)); return; }
              const translated = extract(JSON.parse(response.responseText));
              if (!translated) reject(new Error('翻译结果为空'));
              else resolve(translated);
            } catch (error) { reject(error); }
          },
          onerror: () => reject(new Error('网络请求失败')),
          ontimeout: () => reject(new Error('请求超时')),
        });
        return;
      }
      fetch(url).then((response) => response.ok ? response.json() : Promise.reject(new Error('HTTP ' + response.status))).then((data) => {
        const translated = extract(data);
        if (!translated) reject(new Error('翻译结果为空'));
        else resolve(translated);
      }).catch(reject);
    });
  }

  function productDevelopmentTranslateZhToEn(text) {
    return productDevelopmentGoogleTranslate(text, 'zh-CN', 'en');
  }

  function productDevelopmentTranslateEnToZh(text) {
    return productDevelopmentGoogleTranslate(text, 'en', 'zh-CN');
  }






  function productDevelopmentTranslatePool(requests, run, limit) {
    return new Promise((resolve, reject) => {
      const results = new Array(requests.length);
      let cursor = 0;
      let failures = 0;
      const errors = [];
      const workers = new Array(Math.max(1, Math.min(Number(limit) || 4, requests.length || 1))).fill(0).map(() => new Promise((done) => {
        const step = async () => {
          while (cursor < requests.length) {
            const index = cursor++;
            try {
              results[index] = await run(requests[index]);
            } catch (error) {
              results[index] = '';
              failures++;
              if (errors.length < 3) errors.push(error && error.message || String(error));
            }
          }
          done();
        };
        step();
      }));
      Promise.all(workers).then(() => {
        if (failures >= requests.length && requests.length) reject(new Error(errors[0] || '翻译失败'));
        else resolve(results);
      }).catch(reject);
    });
  }





  function productDevelopmentTaskLocalMetaHtml(task, detail) {
    const source = task || {};
    const meta = getProductDevelopmentTaskMeta(source, detail);
    const sku = String(source.sku || detail && detail.sku || '').trim().toUpperCase();
    const input = (field, label, value, placeholder) => '<label>' + escapeHtml(label) + '<input type="text" class="pfh-product-development-task-meta-input" data-meta-sku="' + escapeHtml(sku) + '" data-meta-field="' + escapeHtml(field) + '" value="' + escapeHtml(value || '') + '" placeholder="' + escapeHtml(placeholder || '') + '"></label>';
    return '<section class="pfh-product-development-product-naming pfh-product-development-task-local-meta"><header><div><h3>产品本地填写</h3></div></header>' +
      '<div class="pfh-product-development-product-naming-grid">' +
      input('brand', '产品品牌', productDevelopmentNormalizeBrandValue(meta.brand), '') +
      input('productNameCn', '产品中文名', meta.productNameCn, '') +
      input('productNameEn', '产品英文名', meta.productNameEn, '') +
      input('reworkProductCode', productDevelopmentReferenceLabel(detail, source) + '产品编码', meta.reworkProductCode, '没有则留空') +
      '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-task-meta-translate" data-product-sku="' + escapeHtml(sku) + '">中文名翻英文名</button></div></section>';
  }

  function productDevelopmentTaskActionsHtml(task) {
    const source = task || {};
    const formDetail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[source.sku];
    const materialPlanner = formDetail
      ? productDevelopmentMaterialPlannerHtml(formDetail, source)
      : '<section class="pfh-product-development-material-planner"><header><div><small>BOM FORM · LOCAL / PLM</small><h3>填写 BOM 物料</h3></div></header><div class="pfh-product-development-form-empty">正在读取当前 SKU 的 BOM 和产品中文名…</div></section>';
    return productDevelopmentTaskLocalMetaHtml(source, formDetail) + productDevelopmentReadonlyDetailHtml(formDetail) + materialPlanner;
  }

  function productDevelopmentMaterialInputElements(sku, kind) {
    return Array.from(document.querySelectorAll('.pfh-product-development-material-input')).filter((element) => (
      String(element.getAttribute('data-material-sku') || '').trim().toUpperCase() === String(sku || '').trim().toUpperCase() &&
      String(element.getAttribute('data-material-kind') || '') === String(kind || '')
    ));
  }

  function productDevelopmentSyncMaterialDraftDom(sku, kind, draft, activeInput) {
    const elements = productDevelopmentMaterialInputElements(sku, kind);
    const setValue = (field, value) => {
      const element = elements.find((item) => item.getAttribute('data-material-field') === field);
      if (element && element !== activeInput && element.value !== String(value === null || value === undefined ? '' : value)) element.value = String(value === null || value === undefined ? '' : value);
    };
    if (draft.nameSource !== 'manual') setValue('materialName', draft.materialName);
    setValue('specification', draft.specification);
    ['length', 'width', 'height'].forEach((field) => setValue(field, draft[field]));
    const pricePlaceholder = kind === 'instruction' ? '' : '按尺寸自动计算';
    setValue('price', draft.price || pricePlaceholder);
    const card = elements[0] && elements[0].closest('[data-material-card]');
    const priceLabel = card && card.querySelector('[data-material-price-label]');
    if (priceLabel) priceLabel.textContent = draft.price ? '采购价：' + draft.price + ' 元' : (pricePlaceholder ? '采购价：' + pricePlaceholder : '采购价');
    const errors = productDevelopmentMaterialDraftIssues(kind, draft);
    elements.forEach((element) => {
      const field = element.getAttribute('data-material-field');
      const error = errors[field] || '';
      element.setAttribute('aria-invalid', String(Boolean(error)));
      const label = element.closest('.pfh-product-development-material-field');
      if (!label) return;
      label.classList.toggle('is-invalid', Boolean(error));
      const hint = label.querySelector('[data-material-error]');
      if (hint) { hint.textContent = error; hint.hidden = !error; }
    });
  }

  function productDevelopmentHandleMaterialField(target, eventType) {
    if (!target || !target.classList || !target.classList.contains('pfh-product-development-material-input')) return false;
    if (target.type === 'radio' && !target.checked) return true;
    const sku = String(target.getAttribute('data-material-sku') || '').trim().toUpperCase();
    const kind = String(target.getAttribute('data-material-kind') || '').trim();
    const field = String(target.getAttribute('data-material-field') || '').trim();
    const task = getProductDevelopmentTaskBySku(sku) || state.productDevelopmentSelectedTask || {};
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    if (!sku || !detail || !['box', 'label', 'instruction'].includes(kind)) return true;
    productDevelopmentEnsureMaterialDrafts(detail, task);
    const draft = detail.materialDrafts && detail.materialDrafts[kind];
    if (!draft || ['categoryPath', 'supplier'].includes(field)) return true;
    if (field === 'price') {
      if (kind !== 'instruction') return true;
      draft.price = productDevelopmentMaterialNumberText(target.value, 6);
    } else if (['multiPage', 'insertCard', 'thicken'].includes(field)) draft[field] = target.value === 'true';
    else if (field === 'quantity') draft.quantity = Math.max(1, Math.min(7, Number(target.value) || 1));
    else if (['length', 'width', 'height'].includes(field)) draft[field] = productDevelopmentMaterialNumberText(target.value, 6);
    else if (field === 'materialName') {
      draft.materialName = productDevelopmentCleanText(target.value, 240);
      draft.nameSource = 'manual';
    } else if (field === 'specification') {
      draft.specification = productDevelopmentCleanText(target.value, 240);
      draft.specificationSource = 'manual';
    } else return true;
    productDevelopmentSyncMaterialDimensions(kind, draft, field, detail);
    productDevelopmentRecalculateMaterialDraft(kind, draft, detail, task);
    if (kind === 'box') {
      productDevelopmentSyncReworkOuterDimensions(detail);
      productDevelopmentRefreshDerivedDimensions(detail, target.closest && target.closest('.pfh-detail'));
    }
    detail.bomDraftDirty = true;
    detail.bomDraftSaveState = 'dirty';
    detail.bomPlmSaveState = '';
    detail.bomPlmSaveMessage = '';
    detail.cacheSource = 'local-cache';
    scheduleProductDevelopmentReadonlyDetailCache(sku, detail);
    productDevelopmentSyncMaterialDraftDom(sku, kind, draft, eventType === 'change' && field === 'specification' ? null : target);
    if (eventType === 'change') productDevelopmentSaveBomLocally(sku, target.closest && target.closest('.pfh-bom-form'));
    return true;
  }

  function productDevelopmentTaskHeroHtml(task) {
    const source = task || {};
    const data = productDevelopmentTaskSeedData(source);
    const sku = String(source.sku || data.sku || '未选择 SKU').trim().toUpperCase();
    const title = [source.brand || data.brand, source.name || data.name].filter(Boolean).join(' ') || sku;
    const status = source.projectStatus || data.projectStatus || '开发任务';
    return '<section class="pfh-section pfh-file-section pfh-product-development-task-hero"><div class="pfh-product-hero"><div class="pfh-title-meta pfh-sku-detail-card">' + productThumbHtml(data, productDevelopmentTaskImageUrl(source, data)) + '<div class="pfh-detail-card-content"><div class="pfh-detail-card-heading"><span class="pfh-detail-sku-badge" title="当前开发 SKU">' + iconHtml('tag') + '<span>' + escapeHtml(sku) + '</span></span><strong class="pfh-detail-product-title" title="产品开发详情">' + escapeHtml(title) + '</strong></div><div class="pfh-detail-card-meta"><span class="is-design-type" title="产品开发任务">' + iconHtml('tag') + '<span>产品开发</span></span><span class="is-design-type" title="开发状态">' + iconHtml('info') + '<span>' + escapeHtml(status) + '</span></span></div></div></div></div></section>';
  }

  function productDevelopmentTaskEmbeddedViewHtml(view, statusText) {
    const feature = productDevelopmentFeatureForView(view);
    if (feature && !productDevelopmentHasAccess(feature)) return '<div class="pfh-empty">前面的区域，以后再来探索吧</div>';
    const source = view === 'review' ? productDevelopmentReviewHtml(statusText)
      : view === 'ingredient' ? productDevelopmentIngredientFactsHtml()
        : view === 'pricing' ? productDevelopmentPricingViewHtml() : productDevelopmentCopywritingHtml(statusText);
    const template = document.createElement('template');
    template.innerHTML = source;
    const root = template.content.firstElementChild;
    if (!root) return '';
    const modeSwitch = root.querySelector('.pfh-work-mode-switch');
    const subviewHead = root.querySelector('.pfh-product-development-subview-head');
    if (modeSwitch) modeSwitch.remove();
    if (subviewHead) subviewHead.remove();
    root.classList.remove('pfh-product-development-subview');
    root.classList.add('is-task-embedded');
    return root.outerHTML;
  }

  function renderDesignDevelopmentDetail(panel, statusText) {
    const tab = DESIGN_DEVELOPMENT_TABS.find((item) => item.id === state.designDevelopmentTab);
    if (!tab || state.view !== 'detail' || state.workMode === 'product-development') return false;
    const data = state.data;
    if (!data || !data.sku) return false;
    const sku = String(data.sku).trim().toUpperCase();
    // Keep the design SKU list and work mode; only share the development editor session.
    if (state.productDevelopmentTaskSelectedSku !== sku || !state.productDevelopmentSelectedTask) {
      const task = getProductDevelopmentTaskBySku(sku) || { ...data, sku, projectId: data.projectId || data.projectRowId || '' };
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      state.productDevelopmentSelectedTask = task;
      state.productDevelopmentTaskSelectedSku = sku;
      state.productDevelopmentSnapshot = null;
      state.productDevelopmentBenchmarkImageDataUrl = '';
      state.productDevelopmentBenchmarkImageName = '';
      state.productDevelopmentReview = null;
      state.productDevelopmentReviewEditorOpen = false;
      state.productDevelopmentCopywriting = null;
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      restoreProductDevelopmentReviewDraft(sku);
    }
    const task = state.productDevelopmentSelectedTask;
    // The integrated view bypasses selectProductDevelopmentTask(), which normally
    // hydrates the form from persistent cache before the first render.
    if (!state.productDevelopmentTaskFormData) state.productDevelopmentTaskFormData = Object.create(null);
    if (!state.productDevelopmentTaskFormData[sku]) {
      const cachedDetail = productDevelopmentReadonlyDetailForTask(task);
      if (cachedDetail) state.productDevelopmentTaskFormData[sku] = cachedDetail;
    }
    state.productDevelopmentTaskView = tab.view;
    const detail = panel.querySelector('.pfh-detail');
    const feature = productDevelopmentFeatureForView(tab.view);
    const body = feature && !productDevelopmentHasAccess(feature)
      ? '<div class="pfh-empty">前面的区域，以后再来探索吧</div>'
      : tab.view === 'detail' ? productDevelopmentTaskActionsHtml(task) : productDevelopmentTaskEmbeddedViewHtml(tab.view, statusText);
    detail.classList.remove('is-loading');
    updateAssistantDetailMarkup(detail, '<div class="pfh-detail-view-frame pfh-cw-task-frame">' + detailViewTabsHtml(tab.id) + '<div class="pfh-detail-scroll pfh-cw-task-content">' + body + '</div></div>', sku + '|' + tab.id);
    productDevelopmentMountReviewEditorOverlay(panel);
    // Use the same cache-age and refresh policy as the original workspace.
    // Cached data is already visible above while stale data refreshes.
    if (detail.pfhDesignDevelopmentSku !== sku) {
      detail.pfhDesignDevelopmentSku = sku;
      hydrateProductDevelopmentTaskDetail(task).then(() => {
        if (state.view === 'detail' && state.settings.designDevelopmentTabs === true && state.designDevelopmentTab && state.selectedSku === sku) renderShell();
      }).catch((error) => {
        if (state.selectedSku !== sku) return;
        state.productDevelopmentError = formatErrorMessage(error);
        if (state.view === 'detail' && state.designDevelopmentTab) renderShell();
      });
    }
    return true;
  }

  function renderProductDevelopmentTaskDetail(panel, statusText, task) {
    const detail = panel && panel.querySelector('.pfh-detail');
    if (!detail) return;
    const view = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
    state.productDevelopmentTaskView = view;
    if (view === 'detail') {
      state.copywritingMode = false;
      detail.classList.remove('is-loading');
      const context = String(task && task.sku || '') + '|' + view;
      const html = renderStatusHtml(statusText) + '<div class="pfh-detail-scroll pfh-product-development-task-detail-scroll" data-scroll-context="' + escapeHtml(context) + '">' + productDevelopmentTaskTabsHtml(view) + productDevelopmentTaskHeroHtml(task) + productDevelopmentTaskActionsHtml(task) + '</div>';
      if (detail.pfhProductDevelopmentContext === context && detail.firstChild) {
        const next = detail.cloneNode(false);
        next.innerHTML = html;
        reconcileAssistantPanelNode(detail, next);
      } else detail.innerHTML = html;
      detail.pfhProductDevelopmentContext = context;
      return;
    }
    const embedded = view === 'placeholder'
      ? '<section class="pfh-section pfh-product-development-task-placeholder"><div class="pfh-section-title"><h3>功能占位</h3><span>后续开发</span></div><div class="pfh-empty">该功能暂未开放，后续会在这里接入。</div></section>'
      : productDevelopmentTaskEmbeddedViewHtml(view, statusText);
    detail.classList.remove('is-loading');
    const context = String(task && task.sku || '') + '|' + view;
    const html = view === 'copywriting'
      ? '<div class="pfh-detail-view-frame pfh-cw-task-frame">' + productDevelopmentTaskTabsHtml(view) + '<div class="pfh-detail-scroll pfh-cw-task-content" data-scroll-context="' + escapeHtml(context) + '">' + embedded + '</div></div>'
      : '<div class="pfh-detail-scroll pfh-product-development-task-scroll">' + productDevelopmentTaskTabsHtml(view) + embedded + '</div>';
    if (view === 'copywriting' && detail.pfhProductDevelopmentContext === context && detail.firstChild) {
      const next = detail.cloneNode(false);
      next.innerHTML = html;
      reconcileAssistantPanelNode(detail, next);
    } else detail.innerHTML = html;
    detail.pfhProductDevelopmentContext = context;
    productDevelopmentMountReviewEditorOverlay(panel);
  }

  function renderProductDevelopmentTaskWorkspace(panel, statusText) {
    const list = panel && panel.querySelector('.pfh-list');
    const detail = panel && panel.querySelector('.pfh-detail');
    if (list) {
      renderProductDevelopmentTaskSidebarList(panel);
      list.removeAttribute('aria-hidden');
    }
    if (!detail) return;
    let task = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku) || state.productDevelopmentSelectedTask;
    if (!task) {
      const tasks = Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks : [];
      const fallbackTask = tasks[0];
      if (fallbackTask) {
        selectProductDevelopmentTask(fallbackTask.sku, { render: false });
        task = getProductDevelopmentTaskBySku(fallbackTask.sku);
      } else if (state.productDevelopmentTasksLoading || state.productDevelopmentTaskRequestPromise) {
        detail.classList.remove('is-loading');
        detail.innerHTML = '<div class="pfh-detail-scroll"><section class="pfh-section pfh-product-development-task-empty"><div class="pfh-section-title"><h3>我的开发任务</h3><span>按当前 PLM 用户筛选</span></div><div class="pfh-empty">正在读取本人开发任务…</div></section></div>';
        return;
      } else {
        loadProductDevelopmentTasks({ force: true }).catch(() => {});
        detail.classList.remove('is-loading');
        detail.innerHTML = '<div class="pfh-detail-scroll"><section class="pfh-section pfh-product-development-task-empty"><div class="pfh-section-title"><h3>我的开发任务</h3><span>按当前 PLM 用户筛选</span></div><div class="pfh-empty">正在读取本人开发任务…</div></section></div>';
        return;
      }
    }
    if (!task) {
      detail.classList.remove('is-loading');
      detail.innerHTML = '<div class="pfh-detail-scroll"><section class="pfh-section pfh-product-development-task-empty"><div class="pfh-section-title"><h3>我的开发任务</h3><span>按当前 PLM 用户筛选</span></div><div class="pfh-empty">暂无本人开发任务。</div><div class="pfh-about-actions"><button type="button" data-action="product-development-tasks-refresh">刷新任务</button><button type="button" data-action="product-development-tasks-home">返回开发功能</button></div></section></div>';
      return;
    }
    state.data = productDevelopmentTaskSeedData(task);
    state.selectedSku = task.sku;
    renderProductDevelopmentTaskDetail(panel, statusText, task);
  }

  function renderProductDevelopmentTaskSidebarList(panel) {
    if (state.view !== 'productDevelopmentTasks') return false;
    const list = panel && panel.querySelector('.pfh-list');
    if (!list) return false;
    const html = productDevelopmentTaskListHtml(true);
    if (list.pfhSkuRenderSignature === html && list.querySelector('.pfh-sku-list-content')) return true;
    updateSkuSidebarMarkup(list, productDevelopmentTaskListHtml());
    list.pfhSkuRenderSignature = html;
    setupSkuViewFusion(list);
    return true;
  }

  async function loadProductDevelopmentTasks(options) {
    const opts = options || {};
    if (typeof isWestmonthLoginPage === 'function' && isWestmonthLoginPage()) {
      const cached = loadProductDevelopmentTaskCache();
      const rows = Array.isArray(state.productDevelopmentTasks) && state.productDevelopmentTasks.length ? state.productDevelopmentTasks : cached.rows;
      state.productDevelopmentTasks = Array.isArray(rows) ? rows : [];
      state.productDevelopmentTaskError = state.productDevelopmentTasks.length ? '缓存模式：显示上次保存的任务，数据可能不是最新' : '本机没有已保存的开发任务缓存';
      return state.productDevelopmentTasks;
    }
    if (state.productDevelopmentTaskRequestPromise) return state.productDevelopmentTaskRequestPromise;
    const now = Date.now();
    if (!opts.force && state.productDevelopmentTasksLoadedAt && now - state.productDevelopmentTasksLoadedAt < PRODUCT_DEVELOPMENT_TASK_SYNC_COOLDOWN_MS && Array.isArray(state.productDevelopmentTasks) && state.productDevelopmentTasks.length) return state.productDevelopmentTasks;
    const existingTasks = Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks.slice() : [];
    state.productDevelopmentTasksLoading = true;
    state.productDevelopmentTaskError = '';
    if (!opts.silent || state.view === 'productDevelopmentTasks') renderShell('正在读取本人开发任务…');
    const request = (async () => {
      const fetchedRows = await fetchProductDevelopmentTaskRows();
      const rows = fetchedRows.length ? fetchedRows : existingTasks;
      if (fetchedRows.length) saveProductDevelopmentTaskCache(fetchedRows, state.productDevelopmentTaskUserName);
      else if (existingTasks.length) state.productDevelopmentTaskError = '本次未读取到新任务，已保留上次任务缓存';
      state.productDevelopmentTasks = rows;
      state.productDevelopmentTasksLoadedAt = Date.now();
      state.productDevelopmentTaskPage = 1;
      const shouldAutoSelect = state.view === 'productDevelopmentTasks' || !opts.silent;
      const selected = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku) || (shouldAutoSelect ? rows[0] : null);
      if (selected) {
        const selectedSku = String(state.productDevelopmentTaskSelectedSku || '').trim().toUpperCase();
        const preserveSession = selectedSku === selected.sku && Boolean(
          state.productDevelopmentCopywritingBusy
          || state.productDevelopmentReviewBusy
          || state.productDevelopmentTaskView !== 'detail'
          || state.productDevelopmentSnapshot
          || state.productDevelopmentReview
          || state.productDevelopmentCopywriting,
        );
        selectProductDevelopmentTask(selected.sku, { render: false, hydrate: false, preserveSession });
      } else {
        state.productDevelopmentSelectedTask = null;
        state.productDevelopmentTaskSelectedSku = '';
      }
      if (state.workMode === 'product-development' && (state.view === 'productDevelopmentTasks' || (!opts.silent && state.view === 'home'))) renderShell();
      if (selected) hydrateProductDevelopmentTaskDetail(selected).then(() => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === selected.sku) renderShell();
      }).catch((error) => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === selected.sku) {
          state.productDevelopmentError = formatErrorMessage(error);
          renderShell();
        }
      });
      return rows;
    })().catch((error) => {
      state.productDevelopmentTaskError = formatErrorMessage(error);
      const cached = loadProductDevelopmentTaskCache();
      if (!Array.isArray(state.productDevelopmentTasks) || !state.productDevelopmentTasks.length) state.productDevelopmentTasks = existingTasks.length ? existingTasks : cached.rows;
      if (!state.productDevelopmentTaskUserName && cached.userName) state.productDevelopmentTaskUserName = cached.userName;
      const selected = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku);
      if (!selected) {
        const fallback = Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks[0] : null;
        if (fallback) selectProductDevelopmentTask(fallback.sku, {
          render: false,
          hydrate: false,
          preserveSession: String(state.productDevelopmentTaskSelectedSku || '').trim().toUpperCase() === fallback.sku,
        });
        else {
          state.productDevelopmentSelectedTask = null;
          state.productDevelopmentTaskSelectedSku = '';
        }
      }
      if (state.workMode === 'product-development' && (state.view === 'home' || state.view === 'productDevelopmentTasks')) renderShell();
      throw error;
    }).finally(() => {
      state.productDevelopmentTasksLoading = false;
      state.productDevelopmentTaskRequestPromise = null;
    });
    state.productDevelopmentTaskRequestPromise = request;
    return request;
  }

  function suspendDesignCollectionForProductDevelopment() {
    if (typeof stopScan === 'function') stopScan();
    if (typeof stopMaterialWatch === 'function') stopMaterialWatch();
    if (typeof stopManualTabRead === 'function') stopManualTabRead();
    if (typeof cancelDrawerTabFlow === 'function') cancelDrawerTabFlow();
    state.scanTargetSku = '';
    state.scanData = null;
    state.openingProjectDetail = false;
    state.openingProjectDetailSku = '';
  }

  function openProductDevelopmentTaskWorkspace(view) {
    suspendDesignCollectionForProductDevelopment();
    state.workMode = 'product-development';
    state.settings.workMode = 'product-development';
    saveSettings(state.settings);
    state.productDevelopmentView = 'home';
    state.productDevelopmentTaskView = normalizeProductDevelopmentTaskTab(view);
    state.productDevelopmentTaskPreviousTab = '';
    state.view = 'productDevelopmentTasks';
    state.copywritingMode = false;
    state.skuEditMode = false;
    state.productDevelopmentError = '';
    state.productDevelopmentTaskError = '';
    expandPanel();
    renderShell('正在读取本人开发任务…');
    loadProductDevelopmentTasks({ force: true }).then((rows) => {
      if (state.view !== 'productDevelopmentTasks') return;
      const selected = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku);
      const first = selected || (Array.isArray(rows) ? rows[0] : null);
      if (!first) return;
      if (!selected) selectProductDevelopmentTask(first.sku);
      state.productDevelopmentTaskView = normalizeProductDevelopmentTaskTab(view);
      renderShell();
      if (view === 'ingredient') loadProductDevelopmentIngredientEditor();
      if (view === 'copywriting') productDevelopmentWarmIngredientTemplates();
    }).catch(() => {});
  }

  function getProductDevelopmentSeedData(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const source = state && state.data && String(state.data.sku || '').trim().toUpperCase() === normalizedSku
      ? state.data
      : loadData(normalizedSku);
    const task = getProductDevelopmentTaskBySku(normalizedSku);
    return task ? productDevelopmentTaskSeedData(task) : normalizeData(source || { sku: normalizedSku });
  }

  function productDevelopmentCleanText(value, maxLength) {
    return String(value || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim().slice(0, maxLength || 4000);
  }

  function productDevelopmentCompactSemanticText(value, maxLength) {
    return productDevelopmentCleanText(value, maxLength)
      .replace(/[ \t]*\n[ \t]*(?:\n[ \t]*)+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .trim();
  }

  function productDevelopmentNormalizeIngredientPart(value) {
    return productDevelopmentCleanText(value, 500)
      .replace(/^[-*\u2022\s]+/, '')
      .replace(/^\d+\s*[.)、:：-]\s*/, '')
      .replace(/^[：:.;；、，,\s]+|[：:.;；、，,\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function productDevelopmentSplitIngredientText(value) {
    let text = productDevelopmentCleanText(value, 12000);
    const inactive = text.search(/(?:\bINACTIVE\s+INGREDIENTS?\b|\bOTHER\s+INGREDIENTS?\b|非活性成分|其他成分)/i);
    if (inactive >= 0) text = text.slice(0, inactive);
    text = text.replace(/(?:\bACTIVE\s+INGREDIENTS?\b|\bINGREDIENTS?\b|活性成分|成分表|成分)\s*[:：]?/gi, '\n');
    return splitCopywritingIngredientItems(text)
      .map(productDevelopmentNormalizeIngredientPart)
      .filter((item) => item && !/^(?:active|inactive|other)\s+ingredients?$/i.test(item) && !/^(?:活性|非活性|其他)?成分$/.test(item))
      .filter((item, index, items) => items.indexOf(item) === index)
      .slice(0, 100);
  }

  function productDevelopmentIngredientPairs(data, liveIngredients) {
    const english = productDevelopmentSplitIngredientText(liveIngredients && liveIngredients.en || data && data.ingredientEnglish);
    const chinese = productDevelopmentSplitIngredientText(liveIngredients && liveIngredients.cn || data && data.ingredientChinese);
    if (english.length || chinese.length) {
      const length = Math.max(english.length, chinese.length);
      return Array.from({ length }).map((_, index) => ({ en: english[index] || '', cn: chinese[index] || '' }))
        .filter((item) => item.en || item.cn)
        .slice(0, 100);
    }
    const itemSource = Array.isArray(data && data.ingredientItems) ? data.ingredientItems : [];
    const itemPairs = itemSource.map((item) => {
      const source = item && typeof item === 'object' ? item : {};
      const inactive = source.active === false || source.isActive === false
        || /inactive|other|非活性|其他/i.test(String(source.type || source.category || source.group || ''));
      if (inactive) return null;
      return {
        en: productDevelopmentNormalizeIngredientPart(source.english || source.en || source.ingredientEnglish || source.name_en),
        cn: productDevelopmentNormalizeIngredientPart(source.chinese || source.cn || source.ingredientChinese || source.name_cn),
      };
    }).filter((item) => item && (item.en || item.cn));
    if (itemPairs.length) return itemPairs.slice(0, 100);
    return [];
  }

  function productDevelopmentCachedIngredientPairs(sku, data) {
    const source = data || getProductDevelopmentSeedData(sku);
    return productDevelopmentIngredientPairs(source, {
      en: source && source.ingredientEnglish,
      cn: source && source.ingredientChinese,
    });
  }

  function productDevelopmentLog(level, message, detail) {
    if (typeof addLog === 'function') addLog(level || 'info', '产品开发文案：' + String(message || ''), detail || '');
  }

  function productDevelopmentPairValues(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      cn: productDevelopmentCleanText(source.cn || source.chinese || source.value_cn || source.valueChinese, 6000),
      en: productDevelopmentCleanText(source.en || source.english || source.value || source.value_en || source.valueEnglish, 6000),
    };
  }

  function productDevelopmentCopywritingText(value, maxLength) {
    return productDevelopmentCleanText(value, maxLength)
      .replace(/\*/g, '')
      .replace(/[ \t]*\n[ \t]*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function productDevelopmentCopywritingPairValues(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      cn: productDevelopmentCopywritingText(source.cn || source.chinese || source.value_cn || source.valueChinese, 6000),
      en: productDevelopmentCopywritingText(source.en || source.english || source.value || source.value_en || source.valueEnglish, 6000),
    };
  }

  function productDevelopmentCopywriteValues(copyPayload) {
    const source = copyPayload && typeof copyPayload === 'object' ? copyPayload : {};
    return {
      usage: productDevelopmentPairValues(source.usage),
      sellingPoints: productDevelopmentPairValues(source.sellingPoints),
      efficacy: productDevelopmentPairValues(source.efficacy),
      advantages: productDevelopmentPairValues(source.advantages),
      ingredientSummary: productDevelopmentPairValues(source.ingredientSummary),
      ingredientEfficacy: productDevelopmentPairValues(source.ingredientEfficacy),
    };
  }

  function productDevelopmentNormalizeProductNaming(value) {
    const source = value && typeof value === 'object' ? value : {};
    const candidate = source.productNaming && typeof source.productNaming === 'object'
      ? source.productNaming
      : source.naming && typeof source.naming === 'object' ? source.naming : source;
    return {
      chineseProductName: productDevelopmentCleanText(candidate.chineseProductName || candidate.productNameCn || candidate.chineseName || candidate.cn, 180),
      englishProductName: productDevelopmentCleanText(candidate.englishProductName || candidate.productNameEn || candidate.englishName || candidate.en, 180),
      functionSummary: productDevelopmentCleanText(candidate.functionSummary || candidate.productFunction || candidate['作用'] || '', 300),
      evidenceText: productDevelopmentCleanText(candidate.evidenceText || candidate.mainTitle || candidate.titleEvidence || '', 300),
      confidence: Math.max(0, Math.min(1, Number(candidate.confidence) || 0)),
    };
  }

  function productDevelopmentReadImageValue(value) {
    if (!value) return '';
    if (typeof value === 'object') {
      return productDevelopmentReadImageValue(value.url || value.src || value.imageUrl || value.image_url || value.fileUrl || value.file_url);
    }
    return String(value || '').trim();
  }

  function productDevelopmentGetBenchmarkImageSource(data) {
    const candidates = [
      { imageUrl: data && data.benchmarkImageUrl, imageFallbackUrl: data && data.benchmarkImageFallbackUrl, source: 'PLM 只读对标图片' },
      { imageUrl: data && data.benchmarkImageFallbackUrl, imageFallbackUrl: data && data.benchmarkImageUrl, source: 'PLM 只读对标图片' },
      { imageUrl: data && data.referenceImageUrl, imageFallbackUrl: data && data.referenceImageFallbackUrl, source: 'PLM 只读参考图片' },
      { imageUrl: data && data.referenceImageFallbackUrl, imageFallbackUrl: data && data.referenceImageUrl, source: 'PLM 只读参考图片' },
      { imageUrl: data && data.benchmarkImage, imageFallbackUrl: data && data.benchmarkImageFallback, source: 'PLM 只读对标图片' },
    ];
    const listCandidates = [data && data.benchmarkImages, data && data.referenceImages]
      .filter(Array.isArray)
      .flatMap((list) => list.slice(0, 5).map((item) => ({ imageUrl: item, imageFallbackUrl: item, source: 'PLM 只读对标图片' })));
    for (const candidate of candidates.concat(listCandidates)) {
      const imageUrl = productDevelopmentReadImageValue(candidate.imageUrl);
      if (!imageUrl) continue;
      const imageFallbackUrl = productDevelopmentReadImageValue(candidate.imageFallbackUrl) || imageUrl;
      return { imageUrl, imageFallbackUrl, source: candidate.source };
    }
    return { imageUrl: '', imageFallbackUrl: '', source: 'PLM 对标图片字段为空' };
  }

  async function productDevelopmentFetchImage(imageUrl, fallbackUrl) {
    const target = String(imageUrl || '').trim();
    if (!/^data:image\//i.test(target)) return fetchImageForExcel(target, fallbackUrl);
    const size = typeof getImageSize === 'function'
      ? await getImageSize(target).catch(() => ({ width: 118, height: 64 }))
      : { width: 118, height: 64 };
    const extension = (target.match(/^data:image\/([^;,]+)/i) || [])[1] || 'png';
    return { dataUrl: target, extension, width: size.width, height: size.height };
  }

  function productDevelopmentReadFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (typeof FileReader !== 'function') {
        reject(new Error('当前浏览器不支持本地图片读取'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('对标图片读取失败'));
      reader.readAsDataURL(file);
    });
  }

  async function importProductDevelopmentBenchmarkImage(file) {
    if (!file || !/^image\//i.test(String(file.type || ''))) throw new Error('请选择 PNG、JPG 或其他图片文件');
    if (Number(file.size || 0) > 15 * 1024 * 1024) throw new Error('对标图片不能超过 15 MB');
    const dataUrl = await productDevelopmentReadFileAsDataUrl(file);
    if (!/^data:image\//i.test(dataUrl)) throw new Error('对标图片格式无法识别');
    state.productDevelopmentBenchmarkImageDataUrl = dataUrl;
    state.productDevelopmentBenchmarkImageName = String(file.name || '本地对标图片').slice(0, 180);
    state.productDevelopmentSnapshot = null;
    state.productDevelopmentReview = null;
    state.productDevelopmentReviewEditorOpen = false;
    deleteProductDevelopmentReviewDraft(getProductDevelopmentCurrentSku());
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '已选择本地对标图片：' + state.productDevelopmentBenchmarkImageName;
    renderShell();
  }

  function productDevelopmentCopywritingReferenceUrl(...sources) {
    for (const source of sources) {
      const values = typeof source === 'string' ? [source] : source && typeof source === 'object'
        ? [source.referenceUrl, source.benchmarkLink, source.main_url, source.reference_url, source.benchmark_url, source.benchmark_link]
        : [];
      for (const value of values) {
        const match = String(value || '').match(/https?:\/\/[^\s<>"']+/i);
        if (match) return match[0].replace(/&amp;/g, '&').replace(/[。，；）]+$/, '');
      }
    }
    return '';
  }

  async function loadProductDevelopmentSnapshot(sku, force, options) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const opts = options || {};
    const requireIngredients = opts.requireIngredients !== false;
    const includeImage = opts.includeImage !== false;
    const imageKind = includeImage ? (opts.imageKind === 'benchmark' ? 'benchmark' : 'product') : 'none';
    const preferCachedIngredients = Boolean(opts.preferCachedIngredients);
    const refreshIngredients = Boolean(opts.refreshIngredients);
    if (!normalizedSku) throw new Error('请先在设计任务中选择一个 SKU');
    if (!force && state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === normalizedSku
      && state.productDevelopmentSnapshot.imageKind === imageKind
      && (!requireIngredients || Array.isArray(state.productDevelopmentSnapshot.ingredients) && state.productDevelopmentSnapshot.ingredients.length)) {
      productDevelopmentLog('info', '命中本次会话资料缓存', normalizedSku + ' | 成分=' + state.productDevelopmentSnapshot.ingredients.length + ' 项');
      return state.productDevelopmentSnapshot;
    }
    const seed = getProductDevelopmentSeedData(normalizedSku);
    const cachedIngredients = refreshIngredients ? [] : productDevelopmentCachedIngredientPairs(normalizedSku, seed);
    const startedAt = Date.now();
    productDevelopmentLog('info', '开始读取产品资料', normalizedSku + ' | 成分缓存=' + (cachedIngredients.length ? cachedIngredients.length + ' 项，优先复用' : '未命中') + ' | 强制刷新=' + (force ? '是' : '否'));
    const snapshotRequest = fetchApiProductSnapshot(seed, { force: Boolean(force && !preferCachedIngredients) })
      .catch((error) => {
        productDevelopmentLog('warn', 'PLM 基础资料读取失败，继续使用本地任务资料', normalizedSku + ' | ' + formatErrorMessage(error));
        return null;
      });
    const liveCopyRequest = withCopywritingTimeout(
      fetchPlmJson(LEDGER_AI_IMAGE_COPYWRITING_ENDPOINT + '?code=' + encodeURIComponent(normalizedSku)),
      60000,
      'PLM 卖点读取',
    ).catch((error) => {
      productDevelopmentLog('warn', 'PLM 卖点读取失败，继续使用已有资料', normalizedSku + ' | ' + formatErrorMessage(error));
      return null;
    });
    const [snapshot, liveCopyPayload] = await Promise.all([snapshotRequest, liveCopyRequest]);
    productDevelopmentLog('info', '产品资料读取完成', normalizedSku + ' | 用时=' + (Date.now() - startedAt) + 'ms');
    let contentPayload = snapshot && snapshot.contentPayload;
    if (!contentPayload && snapshot && snapshot.productId && snapshot.productVersionId && snapshot.categoryId) {
      try {
        contentPayload = await withCopywritingTimeout(
          fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(snapshot.productId) + '&category_id=' + encodeURIComponent(snapshot.categoryId) + '&product_version_id=' + encodeURIComponent(snapshot.productVersionId)),
          60000,
          'PLM 产品详情读取',
        );
      } catch (error) {
        productDevelopmentLog('warn', 'PLM 产品详情读取失败，继续使用已读取资料', normalizedSku + ' | ' + formatErrorMessage(error));
      }
    }
    const liveIngredients = getLedgerAiImageLiveIngredientPayload(liveCopyPayload || {});
    const plmCopywriting = getLedgerAiImagePlmCopywritingPayload(contentPayload || {});
    let data = normalizeData({
      ...seed,
      ...(snapshot || {}),
      sku: normalizedSku,
      name: (snapshot && snapshot.chineseName) || seed.name,
      productType: (snapshot && snapshot.productType) || seed.productType || seed.manualCategory,
      ingredientEnglish: snapshot && snapshot.ingredientEnglish || seed.ingredientEnglish || '',
      ingredientChinese: snapshot && snapshot.ingredientChinese || seed.ingredientChinese || '',
      ingredientItems: snapshot && Array.isArray(snapshot.ingredientItems) && snapshot.ingredientItems.length
        ? snapshot.ingredientItems
        : seed.ingredientItems,
    });
    const liveCopy = productDevelopmentCopywriteValues({
      usage: liveCopyPayload ? getLedgerAiImageCopywriteValues(findLedgerAiImageCopyItem(liveCopyPayload, 'usage')) : null,
      sellingPoints: liveCopyPayload ? getLedgerAiImageCopywriteValues(findLedgerAiImageCopyItem(liveCopyPayload, 'sellingPoints')) : null,
      efficacy: liveCopyPayload ? getLedgerAiImageCopywriteValues(findLedgerAiImageCopyItem(liveCopyPayload, 'efficacy')) : null,
      advantages: liveCopyPayload ? getLedgerAiImageCopywriteValues(findLedgerAiImageCopyItem(liveCopyPayload, 'advantages')) : null,
      ingredientSummary: liveIngredients,
      ingredientEfficacy: plmCopywriting.ingredientEfficacy,
    });
    const ingredients = productDevelopmentIngredientPairs(data, {
      en: liveIngredients.product_ingredients_summary_en || plmCopywriting.ingredientSummary.en || data.ingredientEnglish,
      cn: liveIngredients.product_ingredients_summary_ch || plmCopywriting.ingredientSummary.cn || data.ingredientChinese,
    });
    let refreshedIngredients = [];
    if (cachedIngredients.length) {
      productDevelopmentLog('success', '成分缓存命中，跳过重新识别', normalizedSku + ' | ' + cachedIngredients.length + ' 项');
    } else if (requireIngredients && (refreshIngredients || !ingredients.length) && typeof hydrateIngredientPdfForSku === 'function') {
      productDevelopmentLog('info', refreshIngredients ? '开始直接读取 PLM 成分表' : '未命中成分缓存，开始读取成分表', normalizedSku);
      const hydrated = await withCopywritingTimeout(
        hydrateIngredientPdfForSku(normalizedSku, { preferApi: true, silent: true, force: refreshIngredients }),
        120000,
        '成分表读取',
      ).catch((error) => {
        productDevelopmentLog('warn', '成分表读取失败', normalizedSku + ' | ' + formatErrorMessage(error));
        return null;
      });
      if (hydrated && hydrated.sku) {
        data = normalizeData({ ...data, ...hydrated });
        refreshedIngredients = productDevelopmentIngredientPairs(data, {
          en: data.ingredientEnglish,
          cn: data.ingredientChinese,
        });
        if (refreshIngredients && refreshedIngredients.length) {
          productDevelopmentLog('success', 'PLM 成分表读取完成', normalizedSku + ' | ' + refreshedIngredients.length + ' 项');
        }
      }
    }
    const resolvedIngredients = refreshIngredients && refreshedIngredients.length
      ? refreshedIngredients
      : productDevelopmentIngredientPairs(data, {
        en: liveIngredients.product_ingredients_summary_en || plmCopywriting.ingredientSummary.en || data.ingredientEnglish,
        cn: liveIngredients.product_ingredients_summary_ch || plmCopywriting.ingredientSummary.cn || data.ingredientChinese,
      });
    const resolvedIngredientSummary = refreshIngredients && refreshedIngredients.length
      ? {
        en: productDevelopmentCleanText(data.ingredientEnglish || refreshedIngredients.map((item) => item.en).filter(Boolean).join(', '), 8000),
        cn: productDevelopmentCleanText(data.ingredientChinese || refreshedIngredients.map((item) => item.cn).filter(Boolean).join('、'), 8000),
      }
      : {
        en: productDevelopmentCleanText(liveIngredients.product_ingredients_summary_en || plmCopywriting.ingredientSummary.en || data.ingredientEnglish, 8000),
        cn: productDevelopmentCleanText(liveIngredients.product_ingredients_summary_ch || plmCopywriting.ingredientSummary.cn || data.ingredientChinese, 8000),
      };
    if (requireIngredients && !resolvedIngredients.length) throw new Error('当前 SKU 没有读取到有效成分，已停止生成');
    let skuImage = null;
    let imageSource = { imageUrl: '', imageFallbackUrl: '', source: '文案生成不读取效果图' };
    if (includeImage) {
      imageSource = imageKind === 'benchmark'
        ? productDevelopmentGetBenchmarkImageSource(data)
        : (typeof getExcelImageSource === 'function' ? getExcelImageSource(data) : { imageUrl: '', imageFallbackUrl: '' });
      if (imageKind !== 'benchmark' && typeof fetchLedgerAiImageSkuPreflight === 'function') {
        skuImage = await fetchLedgerAiImageSkuPreflight(normalizedSku, data).catch(() => null);
        if (skuImage && skuImage.status === 'available' && skuImage.url) {
          imageSource = { imageUrl: skuImage.url, imageFallbackUrl: skuImage.url };
        }
      }
    }
    const sourceCopywriting = {
      sellingPoints: liveCopy.sellingPoints.en || liveCopy.sellingPoints.cn ? liveCopy.sellingPoints : productDevelopmentPairValues(plmCopywriting.sellingPoints),
      efficacy: liveCopy.efficacy.en || liveCopy.efficacy.cn ? liveCopy.efficacy : productDevelopmentPairValues(plmCopywriting.efficacy),
      advantages: liveCopy.advantages.en || liveCopy.advantages.cn ? liveCopy.advantages : productDevelopmentPairValues(plmCopywriting.advantages),
      usage: liveCopy.usage.en || liveCopy.usage.cn ? liveCopy.usage : productDevelopmentPairValues(plmCopywriting.usage),
    };
    const evidenceSource = { ...data, sourceCopywriting };
    const ingredientEvidence = productDevelopmentSnapshotEvidenceText(evidenceSource, 'ingredient');
    const attributeEvidence = productDevelopmentSnapshotEvidenceText(evidenceSource, 'attribute');
    const sourceEvidence = productDevelopmentSnapshotEvidenceText(evidenceSource, 'source');
    const productName = productDevelopmentCleanText(snapshot && snapshot.chineseName || data.name, 300);
    const englishNameSource = productDevelopmentCleanText(snapshot && snapshot.englishName, 300);
    const result = {
      version: PRODUCT_DEVELOPMENT_VERSION,
      sku: normalizedSku,
      name: productName,
      englishName: productDevelopmentIsEntryProductName(data.name) || productDevelopmentIsEntryProductName(productName)
        ? 'Dietary Supplement'
        : englishNameSource,
      brand: productDevelopmentNormalizeBrandValue(snapshot && snapshot.brand || data.brand),
      productType: productDevelopmentCleanText(snapshot && snapshot.productType || data.productType || data.manualCategory, 180),
      productTypeCn: productDevelopmentCleanText(snapshot && snapshot.productTypeCn || data.productTypeCn, 180),
      netContent: productDevelopmentCleanText(snapshot && snapshot.netContent || data.netContent, 120).toUpperCase(),
      referenceUrl: productDevelopmentCopywritingReferenceUrl(snapshot, data, seed, getProductDevelopmentTaskBySku(normalizedSku)),
      outerDimensions: productDevelopmentSnapshotOuterDimensions(contentPayload),
      packagingKind: '',
      ingredients: resolvedIngredients,
      ingredientEvidence,
      ingredientSummary: resolvedIngredientSummary,
      ingredientFunctions: {
        en: productDevelopmentCleanText(liveIngredients.product_ingredients_efficacy_en || plmCopywriting.ingredientEfficacy.en, 8000),
        cn: productDevelopmentCleanText(liveIngredients.product_ingredients_efficacy_ch || plmCopywriting.ingredientEfficacy.cn, 8000),
      },
      sourcePlainTextCopy: productDevelopmentOneShotPlainTextCopy(normalizedSku, null),
      sourceCopywriting: {
        ...sourceCopywriting,
      },
      attributeEvidence,
      claimEvidence: attributeEvidence,
      sourceEvidence,
      origin: productDevelopmentCleanText(data.origin || data.originCountry || data.countryOfOrigin, 400),
      countryOfOrigin: productDevelopmentCleanText(data.countryOfOrigin || data.originCountry || data.origin, 400),
      madeIn: productDevelopmentCleanText(data.madeIn || data.countryOfManufacture, 400),
      imageUrl: String(imageSource && imageSource.imageUrl || ''),
      imageFallbackUrl: String(imageSource && imageSource.imageFallbackUrl || imageSource && imageSource.imageUrl || ''),
      imageKind: includeImage ? imageKind : 'none',
      imageSource: includeImage
        ? imageKind === 'benchmark'
          ? imageSource.source || 'PLM 只读对标图片'
          : skuImage && skuImage.source || data.skuImageSource || 'PLM read-only product image'
        : '文案生成不读取效果图',
      updatedAt: new Date().toLocaleString(),
    };
    if (includeImage && !result.imageUrl) {
      throw new Error(imageKind === 'benchmark'
        ? '当前 SKU 没有可读取的对标图片'
        : '当前 SKU 没有可读取的主产品效果图');
    }
    state.productDevelopmentSnapshot = result;
    return result;
  }

  function findLedgerAiImageCopyItem(payload, key) {
    const normalizedKey = String(key || '').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    const rawItems = typeof getLedgerAiImageCopywriteList === 'function'
      ? getLedgerAiImageCopywriteList(payload)
      : payload && (payload.data || payload.list || payload.result || payload.items);
    const items = typeof normalizeLedgerAiImageCopywriteItems === 'function'
      ? normalizeLedgerAiImageCopywriteItems(rawItems)
      : (Array.isArray(rawItems) ? rawItems : []);
    const rule = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS && LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.find((item) => item.key === key || item.type === key || item.types && item.types.includes(key) || item.key === normalizedKey || item.type === normalizedKey || item.types && item.types.includes(normalizedKey));
    return items.find((item) => {
      const value = String(item && (item.type || item.key || item.variable_name || item.title || item.label || '')).toLowerCase();
      return value === String(key || '').toLowerCase() || value === normalizedKey || value.includes(String(key || '').toLowerCase()) || value.includes(normalizedKey) || rule && (
        String(rule.label || '').toLowerCase() === value
        || Array.isArray(rule.types) && rule.types.some((type) => String(type).toLowerCase() === value)
        || Array.isArray(rule.labels) && rule.labels.some((label) => value.includes(String(label).toLowerCase()))
      );
    }) || null;
  }

  function productDevelopmentDetectSourceRisks(value, brand) {
    const normalized = productDevelopmentNormalizedClaimText(value);
    if (!normalized) return { types: [], terms: [] };
    const brandTerms = (Array.isArray(brand) ? brand : [brand])
      .map((term) => productDevelopmentCleanText(term, 120))
      .filter(Boolean)
      .filter((term, index, list) => list.indexOf(term) === index)
      .filter((term) => normalized.includes(productDevelopmentNormalizedClaimText(term)));
    const restrictedTerms = PRODUCT_DEVELOPMENT_BANNED_TERMS
      .filter((term) => productDevelopmentBannedTermMatches(value, term, normalized))
      .slice(0, 6);
    return {
      types: (brandTerms.length ? ['brand'] : []).concat(restrictedTerms.length ? ['banned'] : []),
      terms: brandTerms.concat(restrictedTerms).slice(0, 8),
    };
  }

  function productDevelopmentNormalizeReviewAction(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
    if (!normalized) return '';
    if (['remove', 'delete', 'omit', 'remove-from-packaging', '删除', '去掉'].includes(normalized)) return PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove;
    if (['replace-logo', 'replace-brand', 'logo', '换logo', '换-logo'].includes(normalized)) return PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo;
    if (['replace-phrase', 'phrase', 'fixed-phrase'].includes(normalized)) return PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replacePhrase;
    if (['standardize-count', 'count', '数量统一'].includes(normalized)) return PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeCount;
    if (['standardize-net-content', 'net-content', '净含量规范'].includes(normalized)) return PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeNetContent;
    return '';
  }

  function productDevelopmentHasHerbalEvidence(snapshot, extraText) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    const evidence = [
      source.name,
      source.productType,
      source.ingredientSummary && source.ingredientSummary.en,
      source.ingredientSummary && source.ingredientSummary.cn,
      Array.isArray(source.ingredients) ? source.ingredients.map((item) => item && (item.en || item.cn)).join(' ') : '',
      extraText,
    ].filter(Boolean).join(' ');
    return /\b(?:herbal|botanical|cinnamon|sage|leaf|root|extract)\b|草本|植物|肉桂|鼠尾草|叶|根|提取物/i.test(evidence);
  }

  function productDevelopmentIsHumanSupplement(snapshot, extraText) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    const categoryText = [source.productType, source.category, source.manualCategory].filter(Boolean).join(' ');
    if (/(?:宠物|犬|狗|猫|\bpet\b|\bdog(?:s)?\b|\bcat(?:s)?\b)/i.test(categoryText)) return false;
    if (source.humanSupplement === true) return true;
    const evidence = [
      categoryText,
      source.name,
      source.englishName,
      source.ingredientSummary && source.ingredientSummary.en,
      source.ingredientSummary && source.ingredientSummary.cn,
      Array.isArray(source.ingredients) ? source.ingredients.map((item) => item && (item.en || item.cn)).join(' ') : '',
      extraText,
    ].filter(Boolean).join(' ');
    if (/(?:宠物|犬|狗|猫|\bpet\b|\bdog(?:s)?\b|\bcat(?:s)?\b)/i.test(evidence)) return false;
    return /\bhuman\b|人类|人用|保健品?|保健食品|膳食补充|营养补充|营养品|dietary\s+supplement|supplement|wellness\s+product|health\s+supplement|capsule|softgel|gumm(?:y|ies)?|vitamin|mineral|probiotic|fish\s*oil|protein\s*powder|胶囊|软胶囊|软糖|维生素|益生菌|鱼油|蛋白粉/i.test(evidence);
  }

  function productDevelopmentIsNetContentText(textRole, sourceText) {
    return /net[\s_-]*(?:content|contents|wt|weight)|净含量/i.test(String(textRole || '') + ' ' + String(sourceText || ''));
  }

  function productDevelopmentNormalizeReviewBbox(value) {
    const source = value && typeof value === 'object' ? value : {};
    const rawX = Number(source.x);
    const rawY = Number(source.y);
    const rawW = Number(source.w !== undefined ? source.w : source.width);
    const rawH = Number(source.h !== undefined ? source.h : source.height);
    const valid = [rawX, rawY, rawW, rawH].every(Number.isFinite) && rawW > 0.001 && rawH > 0.001;
    if (!valid) return null;
    const x = Math.max(0, Math.min(1, rawX));
    const y = Math.max(0, Math.min(1, rawY));
    const w = Math.max(0, Math.min(1 - x, rawW));
    const h = Math.max(0, Math.min(1 - y, rawH));
    return w > 0.001 && h > 0.001 ? { x, y, w, h } : null;
  }

  function productDevelopmentReviewPackagingBboxes(source) {
    const value = source && typeof source === 'object' ? source : {};
    const candidate = value.packagingBboxes || value.packagingBbox || value.packageBboxes || value.packageBbox || value.productBboxes || value.productBbox;
    const list = Array.isArray(candidate) ? candidate : candidate && typeof candidate === 'object' ? [candidate] : [];
    return list.map(productDevelopmentNormalizeReviewBbox).filter(Boolean).slice(0, 8);
  }

  function productDevelopmentReviewBboxTouchesPackaging(bbox, packagingBboxes) {
    if (!bbox || !Array.isArray(packagingBboxes) || !packagingBboxes.length) return true;
    const centerX = bbox.x + bbox.w / 2;
    const centerY = bbox.y + bbox.h / 2;
    const area = bbox.w * bbox.h;
    return packagingBboxes.some((packageBbox) => {
      const centerInside = centerX >= packageBbox.x && centerX <= packageBbox.x + packageBbox.w
        && centerY >= packageBbox.y && centerY <= packageBbox.y + packageBbox.h;
      const overlapWidth = Math.max(0, Math.min(bbox.x + bbox.w, packageBbox.x + packageBbox.w) - Math.max(bbox.x, packageBbox.x));
      const overlapHeight = Math.max(0, Math.min(bbox.y + bbox.h, packageBbox.y + packageBbox.h) - Math.max(bbox.y, packageBbox.y));
      return centerInside || area > 0 && overlapWidth * overlapHeight / area >= 0.25;
    });
  }

  function productDevelopmentReviewItemIsOutsidePackaging(item) {
    const source = item && typeof item === 'object' ? item : {};
    const booleanValues = ['onPackaging', 'isOnPackaging', 'onPackage', 'isOnPackage']
      .filter((key) => Object.prototype.hasOwnProperty.call(source, key))
      .map((key) => source[key]);
    if (booleanValues.some((value) => value === false || /^(?:false|no|0)$/i.test(String(value || '').trim()))) return true;
    if (booleanValues.some((value) => value === true || /^(?:true|yes|1)$/i.test(String(value || '').trim()))) return false;
    const scopeText = [source.surface, source.textSurface, source.location, source.scope, source.textLocation, source.textRole, source.role]
      .filter(Boolean).join(' ');
    return /\b(?:outside|background|banner|callout|prop|decorative|webpage|not\s+on\s+(?:the\s+)?package)\b|包装外|背景|旁边|外部|干扰|非包装|道具|装饰/i.test(scopeText);
  }

  function productDevelopmentFlattenEvidenceText(value, depth) {
    const level = Number(depth || 0);
    if (level > 4 || value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.slice(0, 100).flatMap((item) => productDevelopmentFlattenEvidenceText(item, level + 1));
    if (value && typeof value === 'object') return Object.values(value).slice(0, 100).flatMap((item) => productDevelopmentFlattenEvidenceText(item, level + 1));
    const text = productDevelopmentCleanText(value, 1200);
    return text ? [text] : [];
  }

  function productDevelopmentSnapshotEvidenceText(snapshot, type) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    const keyPattern = type === 'ingredient'
      ? /ingredient|active|other|formula|配料|原料|成分/i
      : type === 'source'
        ? /origin|country|made|manufactur|sourc|distribut|import|产地|原产|制造|生产|来源|进口|经销/i
        : /attribute|claim|support|verify|certif|test|gmp|natural|organic|vegan|gluten|sugar|dairy|soy|lactose|selling|efficacy|advantage|benefit|usage|direction|copywriting|宣称|属性|卖点|功效|优势|作用|功能|认证|检测|测试|有机|天然|无麸质|非转基因|不含|含量/i;
    const values = [];
    const seen = new Set();
    const add = (value) => productDevelopmentFlattenEvidenceText(value).forEach((text) => {
      const normalized = text.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        values.push(text);
      }
    });
    [source, source.product, source.info].forEach((container) => {
      if (!container || typeof container !== 'object') return;
      Object.keys(container).forEach((key) => {
        if (type === 'source' && /copywriting/i.test(key)) return;
        if (keyPattern.test(String(key))) add(container[key]);
      });
    });
    const attrs = Array.isArray(source.attrs) ? source.attrs : [];
    attrs.forEach((attr) => {
      if (!attr || typeof attr !== 'object') return;
      const label = productDevelopmentCleanText(attr.attr_name || attr.name || attr.variable_name || attr.key, 200);
      if (!label || !keyPattern.test(label)) return;
      const configs = Array.isArray(attr.attr_language_config_json) ? attr.attr_language_config_json : [];
      const parts = [label]
        .concat(productDevelopmentFlattenEvidenceText(attr.value))
        .concat(productDevelopmentFlattenEvidenceText(attr.attr_value))
        .concat(configs.flatMap((config) => productDevelopmentFlattenEvidenceText(config && config.value)));
      if (parts.length > 1) add(parts.join(': '));
    });
    return productDevelopmentCleanText(values.join('\n'), 4000);
  }

  function productDevelopmentReviewEvidenceValues(snapshot, type) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    const copywriting = source.sourceCopywriting && typeof source.sourceCopywriting === 'object' ? source.sourceCopywriting : {};
    const flatten = (value) => {
      if (Array.isArray(value)) return value.flatMap(flatten);
      if (value && typeof value === 'object') return Object.values(value).flatMap(flatten);
      const text = productDevelopmentCleanText(value, 4000);
      return text ? [text] : [];
    };
    if (type === 'ingredient') {
      return [
        source.ingredientEvidence,
        source.ingredientSummary && source.ingredientSummary.en,
        source.ingredientSummary && source.ingredientSummary.cn,
        source.activeIngredients,
        source.otherIngredients,
        source.activeIngredient,
        source.otherIngredient,
        source.ingredientList,
        source.formula,
        Array.isArray(source.ingredients) ? source.ingredients.map((item) => item && [item.en, item.cn]) : [],
      ].flatMap(flatten);
    }
    if (type === 'source') {
      return [source.sourceEvidence, source.originEvidence, source.origin, source.countryOfOrigin, source.madeIn, source.sourceCountry, source.originCountry, source.manufacturerCountry, source.countryOfManufacture, source.manufacturer, source.distributor].flatMap(flatten);
    }
    return [
      source.attributeEvidence,
      source.claimEvidence,
      source.supportedClaims,
      source.verifiedClaims,
      source.productClaims,
      source.claims,
      source.sellingPoints,
      source.efficacy,
      source.advantages,
      source.usage,
      source.directions,
      source.copywriting,
      copywriting.sellingPoints,
      copywriting.efficacy,
      copywriting.advantages,
      copywriting.usage,
    ].flatMap(flatten);
  }

  function productDevelopmentUnsupportedClaimType(sourceText, textRole) {
    const text = String(sourceText || '').trim();
    const role = String(textRole || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (!text || /^(?:supplement\s+facts|nutrition\s+facts|ingredients?|active\s+ingredients?|other\s+ingredients?|成分表|成分|配料|原料)$/i.test(text)) return '';
    if (/\b(?:made|manufactured|formulated)\s+in\b|\bproduct\s+of\b|\bcountry\s+of\s+origin\b|\bimported?\s+from\b|\bsourced?\s+from\b|\b(?:origin|originated)\b|\b(?:from|of)\s+(?:the\s+)?(?:usa|u\.?s\.?a?\.?|united\s+states|australia|new\s+zealand|canada|germany|france|italy|japan|korea|switzerland|uk|united\s+kingdom)\b|\b(?:american|australian|canadian|german|french|italian|japanese|korean|swiss)[ -]?made\b/i.test(text)) return 'source';
    if (/(?:ingredient|ingredients|activeingredient|otheringredient|成分|配料|原料)/i.test(role)
      || /^(?:contains?|ingredients?|active\s+ingredients?|other\s+ingredients?|成分|配料|原料)\s*[:：]/i.test(text)
      || /\b(?:made\s+with|contains?|powered\s+by)\s+/i.test(text)
      || (!role && /\b(?:acid|ate|ide|citrate|glycinate|oxide|chloride|sulfate|gluconate|phosphate|aspartate|malate|picolinate|taurate|collagen|probiotic|vitamin|minerals?|magnesium|zinc|calcium|iron|potassium|sodium|extract|oil|glycerin|sorbate|enzyme|fiber|fibre|protein|peptide|coq10|nad|nac)\b|(?:维生素|益生菌|胶原蛋白|提取物|甘氨酸|柠檬酸|山梨酸|蛋白|酶|膳食纤维)/i.test(text))) return 'ingredient';
    if (/\b(?:non[-\s]?gmo|gluten[-\s]?free|sugar[-\s]?free|dairy[-\s]?free|soy[-\s]?free|lactose[-\s]?free|zero\s+(?:fat|sugar|calories)|no\s+added\s+(?:sugar|sucrose|preservatives?)|free\s+from|high\s+in|rich\s+in|low\s+in|low[-\s]+dose|\d+\s*(?:day|days|week|weeks|month|months)\s+supply|\d+\s*x\s*(?:daily|per\s+day)|supports?|promotes?|helps?|maintains?|improves?|health|wellness|wild[-\s]?caught|high\s+purity|purity|molecularly|distilled|pure|clean|premium|natural|organic|vegan|gmp(?:\s+certified)?|certified|lab[-\s]?tested|tested|scientific(?:ally)?(?:\s+proven)?|efficient(?:ly)?|rapid\s+absorption|fast[-\s]?acting)\b|(?:非转基因|无麸质|无糖|无乳糖|无大豆|纯素|有机|天然|纯|优质|高效|快速吸收|认证|检测|经测试|低脂|低糖|零脂肪|零糖|不含|支持|促进|帮助|维持|改善|健康|高纯度|分子蒸馏|野生捕捞)/i.test(text)) return 'attribute';
    return '';
  }

  function productDevelopmentReviewClaimHasEvidence(claim, snapshot, type) {
    const stopWords = new Set(['made', 'with', 'contains', 'contain', 'ingredient', 'ingredients', 'active', 'other', 'as', 'from', 'in', 'the', 'product', 'of', 'country', 'origin', 'manufactured', 'formulated', 'sourced', 'imported', 'distributed', 'by', 'and']);
    const tokens = (String(claim || '').toLowerCase().normalize('NFKC').match(/[a-z0-9\u3400-\u9fff]+/g) || [])
      .filter((token) => !stopWords.has(token));
    if (!tokens.length) return false;
    return productDevelopmentReviewEvidenceValues(snapshot, type).some((evidence) => {
      const normalized = productDevelopmentNormalizedClaimText(evidence);
      return tokens.every((token) => normalized.includes(productDevelopmentNormalizedClaimText(token)));
    });
  }

  function productDevelopmentReviewProductAnchor(snapshot) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    const context = [
      source.name,
      source.englishName,
      source.productType,
      source.ingredientSummary && source.ingredientSummary.en,
      source.ingredientSummary && source.ingredientSummary.cn,
      Array.isArray(source.ingredients) ? source.ingredients.map((item) => item && [item.en, item.cn].filter(Boolean).join(' ')).join(' ') : '',
    ].filter(Boolean).join(' ');
    const anchors = [
      { pattern: /omega[-\s]?3/i, shortEn: 'Omega-3', mediumEn: 'Omega-3 Formula', longEn: 'Omega-3 Nutritional Formula', shortZh: 'Omega-3', mediumZh: 'Omega-3配方', longZh: 'Omega-3营养配方' },
      { pattern: /fish\s*oil|鱼油/i, shortEn: 'Fish Oil', mediumEn: 'Fish Oil Formula', longEn: 'Fish Oil Nutritional Formula', shortZh: '鱼油', mediumZh: '鱼油配方', longZh: '鱼油营养配方' },
      { pattern: /magnesium|镁/i, shortEn: 'Magnesium', mediumEn: 'Magnesium Formula', longEn: 'Magnesium Nutritional Formula', shortZh: '镁', mediumZh: '镁配方', longZh: '镁营养配方' },
      { pattern: /probiotic|益生菌/i, shortEn: 'Probiotic', mediumEn: 'Probiotic Formula', longEn: 'Probiotic Nutritional Formula', shortZh: '益生菌', mediumZh: '益生菌配方', longZh: '益生菌营养配方' },
      { pattern: /collagen|胶原蛋白/i, shortEn: 'Collagen', mediumEn: 'Collagen Formula', longEn: 'Collagen Nutritional Formula', shortZh: '胶原蛋白', mediumZh: '胶原蛋白配方', longZh: '胶原蛋白营养配方' },
      { pattern: /vitamin|维生素/i, shortEn: 'Vitamin Formula', mediumEn: 'Daily Vitamin Formula', longEn: 'Daily Vitamin Nutritional Formula', shortZh: '维生素配方', mediumZh: '日常维生素配方', longZh: '日常维生素营养配方' },
    ];
    return anchors.find((anchor) => anchor.pattern.test(context)) || {
      shortEn: 'Formula',
      mediumEn: 'Product Formula',
      longEn: 'Daily Nutritional Formula',
      shortZh: '配方',
      mediumZh: '产品配方',
      longZh: '日常营养配方',
    };
  }

  function productDevelopmentReviewNeutralReplacement(sourceText, snapshot, type) {
    const text = String(sourceText || '').trim();
    const sourceLength = text.replace(/\s/g, '').length;
    const anchor = productDevelopmentReviewProductAnchor(snapshot);
    const chooseLength = (shortValue, mediumValue, longValue) => {
      if (sourceLength <= String(shortValue || '').replace(/\s/g, '').length + 3) return shortValue;
      if (sourceLength <= String(mediumValue || '').replace(/\s/g, '').length + 8) return mediumValue;
      return longValue;
    };
    if (type === 'attribute') {
      const topics = [
        { pattern: /heart|心脏/i, en: 'Heart', zh: '心脏' },
        { pattern: /brain|大脑|脑部/i, en: 'Brain', zh: '大脑' },
        { pattern: /joint|关节/i, en: 'Joints', zh: '关节' },
        { pattern: /digest|消化|肠道/i, en: 'Digestive', zh: '消化' },
        { pattern: /immune|免疫/i, en: 'Immune', zh: '免疫' },
        { pattern: /energy|活力|精力/i, en: 'Energy', zh: '活力' },
        { pattern: /hair|头发/i, en: 'Hair', zh: '头发' },
        { pattern: /skin|皮肤/i, en: 'Skin', zh: '皮肤' },
        { pattern: /eye|眼睛/i, en: 'Eyes', zh: '眼睛' },
        { pattern: /sleep|睡眠/i, en: 'Sleep', zh: '睡眠' },
      ].filter((topic) => topic.pattern.test(text)).slice(0, 4);
      if (topics.length) {
        const englishTopics = topics.length === 1
          ? topics[0].en
          : topics.slice(0, -1).map((topic) => topic.en).join(', ') + ' & ' + topics[topics.length - 1].en;
        const chineseTopics = topics.length === 1
          ? topics[0].zh
          : topics.slice(0, -1).map((topic) => topic.zh).join('、') + '和' + topics[topics.length - 1].zh;
        return {
          replacementEn: 'Daily Nutrition for ' + englishTopics,
          replacementZh: chineseTopics + '日常营养支持',
        };
      }
    }
    return {
      replacementEn: chooseLength(anchor.shortEn, anchor.mediumEn, anchor.longEn),
      replacementZh: chooseLength(anchor.shortZh, anchor.mediumZh, anchor.longZh),
    };
  }

  function productDevelopmentReviewReplacementIsSafe(sourceText, replacementEn, replacementZh, snapshot, brand, type) {
    const nextEn = productDevelopmentCompactSemanticText(replacementEn, 300).replace(/\*/g, '');
    const nextZh = productDevelopmentCompactSemanticText(replacementZh, 300).replace(/\*/g, '');
    if (!nextEn || !nextZh || /omit\s+from\s+packaging|从包装中删除/i.test(nextEn + ' ' + nextZh)) return false;
    if (productDevelopmentNormalizedClaimText(nextEn + ' ' + nextZh) === productDevelopmentNormalizedClaimText(sourceText)) return false;
    const sourceLength = String(sourceText || '').replace(/\s/g, '').length;
    const replacementLength = nextEn.replace(/\s/g, '').length;
    if (sourceLength > 8 && (replacementLength < sourceLength * 0.4 || replacementLength > sourceLength * 2.2)) return false;
    if (productDevelopmentFindBannedTerm(nextEn + ' ' + nextZh, brand)) return false;
    const candidateType = productDevelopmentUnsupportedClaimType(nextEn, '');
    if (candidateType === 'source' || candidateType === 'attribute') return false;
    if (candidateType === 'ingredient' && /\b(?:made\s+with|contains?|powered\s+by)\b/i.test(nextEn)) return false;
    return type !== 'source' || !/\b(?:made|manufactured|formulated)\s+in\b|\bproduct\s+of\b|\bcountry\s+of\s+origin\b/i.test(nextEn);
  }

  function productDevelopmentEnsureHumanSupplementLine(items, snapshot) {
    const list = Array.isArray(items) ? items : [];
    const evidence = list.map((item) => [item && item.sourceText, item && item.replacementEn, item && item.replacementZh].filter(Boolean).join(' ')).join('\n');
    if (!productDevelopmentIsHumanSupplement(snapshot, evidence)) return list;
    const hasSupplement = list.some((item) => /\bDIETARY\s+SUPPLEMENT\b/i.test(String(item && item.replacementEn || '')));
    if (hasSupplement) {
      list.forEach((item) => {
        if (item && item.replacementEn) item.replacementEn = String(item.replacementEn).replace(/\bDIETARY\s+SUPPLEMENT\b/gi, 'DIETARY SUPPLEMENT');
      });
      return list;
    }
    const target = list.find((item) => productDevelopmentIsNetContentText(item && item.textRole, item && item.sourceText))
      || list.find((item) => /\b(?:CAPSULES?|SOFTGELS?|GUMM(?:Y|IES))\b/i.test(String(item && item.sourceText || '') + ' ' + String(item && item.replacementEn || '')))
      || list.find((item) => item && item.revisionAction !== PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove
        && !(Array.isArray(item.riskTypes) && item.riskTypes.includes('brand')));
    if (!target) return list;
    target.replacementEn = productDevelopmentCompactSemanticText([target.replacementEn, 'DIETARY SUPPLEMENT'].filter(Boolean).join('\n'), 300);
    target.replacementZh = productDevelopmentCompactSemanticText([target.replacementZh, '膳食补充剂'].filter(Boolean).join('\n'), 300);
    target.revisionAction = target.revisionAction || PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeNetContent;
    return list;
  }

  function productDevelopmentReplaceApprovedPhrase(value, rule) {
    return String(value || '').replace(rule.pattern, (match) => {
      if (match === match.toUpperCase()) return rule.replacementEn.toUpperCase();
      if (match === match.toLowerCase()) return rule.replacementEn.toLowerCase();
      return rule.replacementEn;
    });
  }

  function productDevelopmentApprovedCountPair(sourceText, replacementEn, replacementZh) {
    const source = String(sourceText || '');
    const nextSource = String(replacementEn || '');
    const countPattern = /\b(\d+(?:\.\d+)?)\s*(CAPSULES?|SOFTGELS?|GUMM(?:Y|IES))\b/i;
    const sourceMatch = source.match(countPattern);
    const replacementMatch = nextSource.match(countPattern);
    const sourceNeedsNormalization = sourceMatch && Number(sourceMatch[1]) !== 60;
    const replacementNeedsNormalization = replacementMatch && Number(replacementMatch[1]) !== 60;
    if (!sourceNeedsNormalization && !replacementNeedsNormalization) return null;
    const unitMatch = sourceMatch || replacementMatch;
    const unit = PRODUCT_DEVELOPMENT_REVIEW_COUNT_UNITS.find((item) => item.pattern.test(unitMatch[2]));
    if (!unit) return null;
    const hasSupplement = /\bDIETARY\s+SUPPLEMENT\b/i.test(source + '\n' + String(replacementEn || ''));
    let nextEn = replacementMatch
      ? nextSource.replace(countPattern, '60 ' + unit.en)
      : '60 ' + unit.en + (nextSource ? '\n' + nextSource : '');
    nextEn = nextEn.replace(/^\n+/, '').replace(/\s*(?:\bA\s+)?\bDIETARY\s+SUPPLEMENT\b/i, '\nDIETARY SUPPLEMENT');
    nextEn = nextEn.replace(/^\n+/, '');
    if (hasSupplement && !/\bDIETARY\s+SUPPLEMENT\b/i.test(nextEn)) nextEn += '\nDIETARY SUPPLEMENT';
    const nextChinese = String(replacementZh || '');
    const chineseCountPattern = /\d+(?:\.\d+)?\s*(粒胶囊|粒软胶囊|粒软糖)/;
    const chineseMatch = nextChinese.match(chineseCountPattern);
    let nextZh = chineseMatch
      ? nextChinese.replace(chineseCountPattern, '60' + unit.zh)
      : '60' + unit.zh + (nextChinese ? '\n' + nextChinese : '');
    nextZh = nextZh.replace(/^\n+/, '').replace(/\s*膳食补充剂/, '\n膳食补充剂');
    nextZh = nextZh.replace(/^\n+/, '');
    if (hasSupplement && !/膳食补充剂/.test(nextZh)) nextZh += '\n膳食补充剂';
    return { replacementEn: nextEn, replacementZh: nextZh, action: PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeCount };
  }

  function productDevelopmentApplyApprovedReviewRules(sourceItem, sourceText, replacementEn, replacementZh, options) {
    const item = sourceItem && typeof sourceItem === 'object' ? sourceItem : {};
    const opts = options || {};
    const textRole = String(item.textRole || item.role || '').trim().toLowerCase();
    const rawTypes = Array.isArray(item.riskTypes) ? item.riskTypes : [item.riskType];
    const hasBrandRisk = rawTypes.map((value) => String(value || '').trim().toLowerCase()).includes('brand');
    let action = productDevelopmentNormalizeReviewAction(item.revisionAction || item.action || item.editAction);
    let nextEn = String(replacementEn || '').trim();
    let nextZh = String(replacementZh || '').trim();
    if (textRole === 'brand' || textRole === 'logo' || item.isLogo === true || action === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo || hasBrandRisk) {
      return {
        replacementEn: 'REPLACE WITH OWN LOGO',
        replacementZh: '更换为自有 Logo',
        action: PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo,
      };
    }
    const neutralRiskRewrite = Boolean(opts.unsupportedClaim || opts.neutralRiskRewrite || action === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove || /omit\s+from\s+packaging|从包装中删除/i.test(nextEn + ' ' + nextZh));
    if (neutralRiskRewrite) {
      const claimType = opts.unsupportedClaimType || productDevelopmentUnsupportedClaimType(sourceText, textRole) || 'attribute';
      const fixedRule = PRODUCT_DEVELOPMENT_REVIEW_FIXED_PHRASES.find((rule) => rule.pattern.test(sourceText));
      const fixedEn = fixedRule ? productDevelopmentReplaceApprovedPhrase(sourceText, fixedRule) : '';
      const fixedZh = fixedRule ? fixedRule.replacementZh : '';
      const candidate = productDevelopmentReviewReplacementIsSafe(sourceText, nextEn, nextZh, opts.snapshot, opts.brand, claimType)
        ? { replacementEn: nextEn, replacementZh: nextZh }
        : productDevelopmentReviewNeutralReplacement(sourceText, opts.snapshot, claimType);
      const selected = fixedEn && productDevelopmentReviewReplacementIsSafe(sourceText, fixedEn, fixedZh, opts.snapshot, opts.brand, claimType)
        ? { replacementEn: fixedEn, replacementZh: fixedZh }
        : candidate;
      return {
        replacementEn: selected.replacementEn,
        replacementZh: selected.replacementZh,
        action: PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replacePhrase,
      };
    }
    for (const rule of PRODUCT_DEVELOPMENT_REVIEW_FIXED_PHRASES) {
      if (!rule.pattern.test(sourceText)) continue;
      nextEn = productDevelopmentReplaceApprovedPhrase(nextEn, rule);
      if (!nextZh || nextZh.toLowerCase() === sourceText.toLowerCase() || sourceText.replace(rule.pattern, '').trim() === '') nextZh = rule.replacementZh;
      if (rule.replacementZh === '均衡功效') nextZh = nextZh.replace(/最大(?:功效|好处|益处)/g, rule.replacementZh);
      if (rule.replacementZh === '营养支持') nextZh = nextZh.replace(/(?:天然|自然)支持/g, rule.replacementZh);
      action = action || PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replacePhrase;
    }
    const countPair = productDevelopmentApprovedCountPair(sourceText, nextEn, nextZh);
    if (countPair) {
      nextEn = countPair.replacementEn;
      nextZh = countPair.replacementZh;
      action = countPair.action;
    }
    const replacementBanned = productDevelopmentFindBannedTerm(nextEn + ' ' + nextZh, opts.brand);
    if (replacementBanned) {
      const naturalClaim = /\b(?:100\s*%\s*)?NATURAL\b/i.test(sourceText);
      if (naturalClaim && productDevelopmentHasHerbalEvidence(opts.snapshot, sourceText)) {
        nextEn = 'HERBAL';
        nextZh = '草本';
        action = PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replacePhrase;
      } else {
        nextEn = 'OMIT FROM PACKAGING';
        nextZh = '从包装中删除';
        action = PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove;
      }
    }
    if (action === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove) {
      nextEn = 'OMIT FROM PACKAGING';
      nextZh = '从包装中删除';
    }
    return { replacementEn: nextEn, replacementZh: nextZh, action };
  }

  function productDevelopmentNormalizeRiskItems(value, options) {
    const source = value && typeof value === 'object' ? value : {};
    const list = Array.isArray(source.items) ? source.items : [];
    const brand = options && options.brand;
    const snapshot = options && options.snapshot;
    const netContentStandard = productDevelopmentCleanText(snapshot && snapshot.netContent, 120).toUpperCase();
    const packagingBboxes = productDevelopmentReviewPackagingBboxes(source);
    const seen = new Set();
    const items = list.map((item, index) => {
      const sourceItem = item && typeof item === 'object' ? item : {};
      if (productDevelopmentReviewItemIsOutsidePackaging(sourceItem)) return null;
      const bboxSource = sourceItem.bbox || sourceItem.box || {};
      const rawX = Number(bboxSource.x);
      const rawY = Number(bboxSource.y);
      const rawW = Number(bboxSource.w !== undefined ? bboxSource.w : bboxSource.width);
      const rawH = Number(bboxSource.h !== undefined ? bboxSource.h : bboxSource.height);
      const hasBbox = [rawX, rawY, rawW, rawH].every(Number.isFinite) && rawW > 0.001 && rawH > 0.001;
      const normalizedBbox = hasBbox ? productDevelopmentNormalizeReviewBbox(bboxSource) : null;
      const x = normalizedBbox ? normalizedBbox.x : 0;
      const y = normalizedBbox ? normalizedBbox.y : 0;
      const w = normalizedBbox ? normalizedBbox.w : 0;
      const h = normalizedBbox ? normalizedBbox.h : 0;
      const sourceText = productDevelopmentCompactSemanticText(sourceItem.sourceText || sourceItem.originalText || sourceItem.text, 240);
      const textRole = productDevelopmentCleanText(sourceItem.textRole || sourceItem.role, 40).toLowerCase();
      let rawReplacementEn = productDevelopmentCompactSemanticText(sourceItem.replacementEn || sourceItem.modifiedEnglish || sourceItem.english || sourceText, 300);
      const rawReplacementZh = productDevelopmentCompactSemanticText(sourceItem.replacementZh || sourceItem.chinese || sourceItem.translation || sourceItem.translationZh || sourceText, 300);
      if (productDevelopmentIsNetContentText(textRole, sourceText)) rawReplacementEn = netContentStandard || rawReplacementEn.toUpperCase();
      const key = [sourceText.toLowerCase(), hasBbox ? x.toFixed(4) + '|' + y.toFixed(4) : 'no-bbox'].join('|');
      if (!sourceText || !rawReplacementEn || !rawReplacementZh || seen.has(key)) return null;
      if (normalizedBbox && !productDevelopmentReviewBboxTouchesPackaging(normalizedBbox, packagingBboxes)) return null;
      seen.add(key);
      const detected = productDevelopmentDetectSourceRisks(sourceText, brand);
      const sourceRiskTypes = (Array.isArray(sourceItem.riskTypes) ? sourceItem.riskTypes : [sourceItem.riskType])
        .map((type) => String(type || '').trim().toLowerCase())
        .filter((type) => ['banned', 'exaggeration', 'medical', 'brand', 'unsupported', 'other'].includes(type));
      const modelUnsupported = sourceRiskTypes.includes('unsupported') && !productDevelopmentIsNetContentText(textRole, sourceText);
      const inferredUnsupportedType = /ingredient|formula|成分|配料|原料/i.test(textRole)
        ? 'ingredient'
        : /origin|source|country|made|manufactur|产地|原产|来源|制造|生产/i.test(textRole)
          ? 'source'
          : 'attribute';
      const unsupportedClaimType = productDevelopmentUnsupportedClaimType(sourceText, textRole) || (modelUnsupported ? inferredUnsupportedType : '');
      const unsupportedClaim = Boolean(modelUnsupported || (unsupportedClaimType && !productDevelopmentReviewClaimHasEvidence(sourceText, snapshot, unsupportedClaimType)));
      const neutralRiskRewrite = sourceRiskTypes.some((type) => ['banned', 'exaggeration', 'medical', 'unsupported'].includes(type));
      const riskTypes = Array.from(new Set(sourceRiskTypes.concat(detected.types).concat(unsupportedClaim ? ['unsupported'] : []))).slice(0, 4);
      const riskTerms = Array.from(new Set((Array.isArray(sourceItem.riskTerms) ? sourceItem.riskTerms : [])
        .map((term) => productDevelopmentCleanText(term, 100)).filter(Boolean).concat(detected.terms)
        .concat(unsupportedClaim ? ['缺少 PLM 证据的' + (unsupportedClaimType === 'ingredient' ? '成分' : unsupportedClaimType === 'source' ? '来源' : '属性') + '声明'] : []))).slice(0, 8);
      const approved = productDevelopmentApplyApprovedReviewRules(sourceItem, sourceText, rawReplacementEn, rawReplacementZh, {
        brand,
        snapshot,
        unsupportedClaim,
        unsupportedClaimType,
        neutralRiskRewrite,
      });
      if (approved.action && !riskTypes.length) {
        riskTypes.push(approved.action === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo ? 'brand' : 'other');
      }
      return {
        id: String(sourceItem.id || index + 1),
        sourceText,
        bbox: normalizedBbox,
        onPackaging: true,
        textRole,
        riskTypes,
        riskTerms,
        riskReason: productDevelopmentCompactSemanticText(sourceItem.riskReason || sourceItem.reason || sourceItem.warning, 400) || (unsupportedClaim ? '原图存在缺少 PLM 证据的' + (unsupportedClaimType === 'ingredient' ? '成分' : unsupportedClaimType === 'source' ? '来源' : '属性') + '声明，已改为近似长度的中性产品表述' : riskTerms.length ? '原文检测到：' + riskTerms.join('、') : ''),
        replacementEn: productDevelopmentCompactSemanticText(approved.replacementEn, 300),
        replacementZh: productDevelopmentCompactSemanticText(approved.replacementZh, 300),
        translationZh: productDevelopmentCompactSemanticText(sourceItem.translationZh || sourceItem.translation || sourceItem.chinese || approved.replacementZh, 300),
        revisionAction: approved.action,
        replacementOptions: Array.isArray(sourceItem.replacementOptions) ? sourceItem.replacementOptions.map((option) => ({
          en: productDevelopmentCompactSemanticText(option && (option.en || option.english || option.replacementEn), 300),
          zh: productDevelopmentCompactSemanticText(option && (option.zh || option.chinese || option.translation), 300),
        })).filter((option) => option.en || option.zh).slice(0, 3) : [],
        confidence: Math.max(0, Math.min(1, Number(sourceItem.confidence) || 0)),
      };
    }).filter(Boolean).slice(0, 80);
    const normalizedItems = productDevelopmentEnsureHumanSupplementLine(items, snapshot);
    normalizedItems.packagingBboxes = packagingBboxes;
    return normalizedItems;
  }

  function productDevelopmentNormalizedClaimText(value) {
    return String(value || '').toLowerCase().normalize('NFKC').replace(/[\s_\-–—·.,:;!?()［］【】「」『』]/g, '');
  }

  function productDevelopmentIngredientLabelKeys(value, includePairValues) {
    const source = value && typeof value === 'object' ? value : { value };
    const values = [
      source.ingredientEn,
      source.ingredientCn,
      source.englishName,
      source.chineseName,
      source.ingredientEnglish,
      source.ingredientChinese,
    ];
    if (includePairValues) values.push(source.en, source.cn, source.value);
    return values
      .map(productDevelopmentNormalizedClaimText)
      .filter(Boolean)
      .filter((item, index, items) => items.indexOf(item) === index);
  }

  function productDevelopmentAlignIngredientFunctions(items, expected) {
    const remaining = Array.isArray(items) ? items.slice() : [];
    const aligned = [];
    for (let index = 0; index < expected.length; index += 1) {
      const expectedKeys = productDevelopmentIngredientLabelKeys(expected[index], true);
      const matchIndex = remaining.findIndex((item) => {
        const actualKeys = productDevelopmentIngredientLabelKeys(item, false);
        return actualKeys.some((key) => expectedKeys.includes(key));
      });
      if (matchIndex < 0) return null;
      aligned.push(remaining.splice(matchIndex, 1)[0]);
    }
    return remaining.length ? null : aligned;
  }

  function productDevelopmentBannedTermMatches(value, term, normalized) {
    const raw = String(term || '').trim();
    if (/^[A-Za-z][A-Za-z0-9]*(?:[ '\-][A-Za-z0-9]+)*$/.test(raw)) {
      const pattern = raw.split(/[\s-]+/).map((part) => part.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/[{}]/g, '\\$&')).join('[\\s-]+');
      return new RegExp('(^|[^A-Za-z0-9])' + pattern + '(?=$|[^A-Za-z0-9])', 'i').test(String(value || ''));
    }
    const candidate = productDevelopmentNormalizedClaimText(raw);
    return Boolean(candidate && normalized.includes(candidate));
  }

  function productDevelopmentFindBannedTerm(value, extraTerms) {
    const normalized = productDevelopmentNormalizedClaimText(value);
    if (!normalized) return '';
    const terms = PRODUCT_DEVELOPMENT_BANNED_TERMS.concat(Array.isArray(extraTerms) ? extraTerms : []);
    return terms.map((term) => String(term || '').trim()).filter(Boolean).find((term) => productDevelopmentBannedTermMatches(value, term, normalized)) || '';
  }

  function productDevelopmentFindCopywritingRestriction(value, options) {
    let text = String(value || '').replace(/\s+/g, ' ').trim();
    if (options && options.copywritingCategory === 'regular') text = text.replace(/\b(?:daily|extended|long[- ]term)\s+(?:use|usage|needs?)\b/gi, '');
    if (!text) return null;
    return PRODUCT_DEVELOPMENT_COPYWRITING_RESTRICTION_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(text))) || null;
  }

  function productDevelopmentCopywritingReplacementForTerm(term) {
    const raw = String(term || '').trim();
    const lower = raw.toLowerCase();
    if (/[\u3400-\u9fff]/.test(raw)) return '日常';
    if (['natural', 'nature', 'naturally'].includes(lower)) return 'everyday';
    if (['organic', 'vegan', 'crueltyfree', 'cruelty free', 'biodegradable', 'environmentally friendly'].includes(lower)) return 'formula';
    if (['better', 'best', 'ultimate', 'perfect', 'maximum', 'number one', 'no. 1', 'top-rated', 'leading', 'long-lasting'].includes(lower)) return 'balanced';
    if (['guaranteed', 'guarantee'].includes(lower)) return 'designed';
    if (['reduce', 'remove', 'repair', 'treatment', 'therapy', 'instantly', 'prevent', 'prevention', 'cure', 'heal', 'diagnose', 'diagnosis'].includes(lower)) return 'daily';
    if (['clinical', 'clinically', 'clinically proven', 'fda approved', 'doctor recommended', 'veterinarian recommended', 'medical grade', 'medical-grade'].includes(lower)) return 'formula';
    if (['fast-acting', 'quick relief', 'instant relief', 'zero risk', 'risk-free', 'no side effects'].includes(lower)) return 'routine support';
    if (['miracle', 'miraculous'].includes(lower)) return 'routine';
    return 'daily';
  }

  function productDevelopmentRewriteGeneratedCopyText(value, extraTerms) {
    let output = String(value || '')
      .replace(/\b(?:independently\s+)?tested\s+(?:in|by)\s+(?:an?\s+)?(?:independent\s+)?(?:third[- ]party\s+)?laborator(?:y|ies)\b/gi, 'designed for routine support')
      .replace(/\b(?:third[- ]party\s+)?lab[- ]tested\b/gi, 'designed for routine support')
      .replace(/\b(?:scientifically|clinically)\s+proven\b/gi, 'formula information')
      .replace(/\b(?:designed\s+for\s+)?(?:efficient|rapid|optimal)\s+nutrient\s+absorption\b/gi, 'daily nutrition support')
      .replace(/\b(?:efficient|rapid|optimal)\s+absorption\b/gi, 'daily nutrition support')
      .replace(/(?:经|由)?(?:独立)?(?:第三方)?(?:实验室)?(?:检测|测试|验证|认证|证明)(?:过|的)?/g, '日常');
    const extra = Array.isArray(extraTerms) ? extraTerms : extraTerms ? [extraTerms] : [];
    const terms = PRODUCT_DEVELOPMENT_BANNED_TERMS.concat(extra)
      .map((term) => String(term || '').trim())
      .filter(Boolean)
      .sort((left, right) => right.length - left.length);
    terms.forEach((term) => {
      const replacement = productDevelopmentCopywritingReplacementForTerm(term);
      if (/^[A-Za-z][A-Za-z0-9]*(?:[ '\-][A-Za-z0-9]+)*$/.test(term)) {
        const pattern = term.split(/[\s-]+/).map((part) => part.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/[{}]/g, '\\$&')).join('[\\s-]+');
        output = output.replace(new RegExp('(^|[^A-Za-z0-9])' + pattern + '(?=$|[^A-Za-z0-9])', 'gi'), (match, prefix) => prefix + replacement);
      } else {
        const pattern = term.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/[{}]/g, '\\$&');
        output = output.replace(new RegExp(pattern, 'gi'), replacement);
      }
    });
    return output.replace(/\s{2,}/g, ' ').trim();
  }

  function productDevelopmentValidateReview(result, snapshot) {
    const source = result && typeof result === 'object' ? result : {};
    if (source.reviewMode === 'original-report') {
      const items = (source.items || source.texts || []).filter((item) => item.onPackaging !== false && typeof item.sourceText === 'string' && item.sourceText.trim()).slice(0, 80).map((item, index) => ({
        ...item, id: String(item.id || index + 1), replacementEn: item.sourceText, replacementZh: '',
        riskTypes: Array.isArray(item.riskTypes) ? item.riskTypes : [], revisionAction: '', replacementOptions: Array.isArray(item.replacementOptions) ? item.replacementOptions : [],
      }));
      return { items, extractedTexts: items.map((item) => ({ ...item })), warnings: source.warnings || [], provider: source.provider, model: source.model, packagingBboxes: [], productNaming: {} };
    }
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
    const sourceItems = Array.isArray(source.texts) && source.texts.length ? source.texts : source.items;
    const extractedTexts = productDevelopmentNormalizeRiskItems({ items: sourceItems, packagingBboxes: source.packagingBboxes }, { brand, snapshot });
    const items = extractedTexts;
    for (const item of extractedTexts) {
      const term = productDevelopmentFindBannedTerm(item.replacementEn + ' ' + item.replacementZh, brand);
      if (term) throw new Error('侵权对照图修改内容含风险词：' + term);
      if (item.replacementEn.includes('*') || item.replacementZh.includes('*')) throw new Error('侵权对照图修改内容不能含星号');
    }
    const productNaming = productDevelopmentNormalizeProductNaming(result);
    const entryEnglishProductName = productDevelopmentEntryEnglishProductName(snapshot);
    if (entryEnglishProductName) productNaming.englishProductName = entryEnglishProductName;
    const namingText = productNaming.chineseProductName + ' ' + productNaming.englishProductName;
    const namingBanned = productDevelopmentFindBannedTerm(namingText, brand);
    if (namingBanned || namingText.includes('*')) throw new Error('AI 产品名称含风险词：' + (namingBanned || '星号'));
    return {
      items,
      extractedTexts,
      warnings: Array.isArray(source.warnings) ? source.warnings.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12) : [],
      provider: String(source.provider || ''),
      model: String(source.model || ''),
      productNaming,
      packagingBboxes: extractedTexts.packagingBboxes || productDevelopmentReviewPackagingBboxes(source),
    };
  }

  function productDevelopmentWrapCanvasText(ctx, value, x, y, maxWidth, lineHeight, maxLines) {
    const lines = productDevelopmentCanvasTextLines(ctx, value, maxWidth, maxLines);
    lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
    return lines.length;
  }

  function productDevelopmentCanvasTextLines(ctx, value, maxWidth, maxLines) {
    const paragraphs = String(value || '').split(/\r?\n/);
    const lines = [];
    paragraphs.forEach((paragraph) => {
      const chars = Array.from(paragraph);
      let line = '';
      chars.forEach((char) => {
        const candidate = line + char;
        if (line && ctx.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = char;
        } else line = candidate;
      });
      if (line || !chars.length) lines.push(line);
    });
    return lines.slice(0, maxLines || 3);
  }
