
  async function runProductDevelopmentCopywriting() {
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) {
      showToast('请先在设计任务中打开或选择当前 SKU');
      return;
    }
    if (state.productDevelopmentOneShotBusy) {
      productDevelopmentLog('warn', '忽略直接读取文案请求', sku + ' | 成分表草稿仍在生成');
      return;
    }
    if (state.productDevelopmentCopywritingBusy) {
      productDevelopmentLog('warn', '忽略重复生成请求', sku + ' | 当前任务仍在执行');
      return;
    }
    const startedAt = Date.now();
    let stage = '准备';
    state.productDevelopmentCopywritingBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '正在读取 PLM 成分表并读取产品资料…';
    productDevelopmentCopywritingProgressStart(sku, ['读取 PLM 资料与成分表', '加载文案模板', '生成文案', '校验中英文', '生成 DOCX']);
    productDevelopmentLog('info', '开始直接读取 PLM 成分表生成 文案', sku + ' | 本地成分缓存=' + productDevelopmentCachedIngredientPairs(sku).length + ' 项');
    renderShell();
    try {
      stage = '读取 PLM 产品资料与成分表';
      const snapshot = await withCopywritingTimeout(
        loadProductDevelopmentSnapshot(sku, true, { requireIngredients: true, includeImage: false, preferCachedIngredients: false, refreshIngredients: true }),
        180000,
        'PLM 成分表读取',
      );
      snapshot.packagingKind = await productDevelopmentResolvePackagingKind(snapshot);
      const copywritingTemplate = resolveProductDevelopmentCopywritingTemplate();
      productDevelopmentLog('success', '产品资料与成分读取完成', sku + ' | 成分=' + snapshot.ingredients.length + ' 项 | 用时=' + (Date.now() - startedAt) + 'ms');
      stage = '加载 DOCX 模板';
      productDevelopmentCopywritingProgressStage(1);
      state.productDevelopmentStatus = copywritingTemplate.local
        ? '正在读取本地 DOCX 模板…'
        : '正在从云端加载' + copywritingTemplate.label + '文案模板…';
      const copywritingTemplateSource = await withCopywritingTimeout(
        loadProductDevelopmentCopywritingTemplateSource(copywritingTemplate),
        60000,
        'DOCX 模板下载',
      );
      productDevelopmentLog('success', 'DOCX 模板已就绪', sku + ' | 模板=' + copywritingTemplate.label + ' | 来源=' + (copywritingTemplate.local ? '本地' : '云端'));
      state.productDevelopmentStatus = '正在一次性生成完整 文案，最长等待约 10 分钟…';
      productDevelopmentCopywritingProgressStage(2);
      stage = 'AI 生成完整文案';
      const response = await withCopywritingTimeout(
        cloudRequest('/ai-image/product-development-copywriting', {
          method: 'POST',
          timeoutMs: 600000,
          body: {
            sku: snapshot.sku,
            name: snapshot.name,
            productType: snapshot.productType,
            brand: snapshot.brand,
            ingredients: snapshot.ingredients,
            ingredientSummary: snapshot.ingredientSummary,
            ingredientFunctions: snapshot.ingredientFunctions,
            sourcePlainTextCopy: snapshot.sourcePlainTextCopy || productDevelopmentOneShotPlainTextCopy(snapshot.sku, snapshot),
            sourceCopywriting: snapshot.sourceCopywriting,
            templateVersion: copywritingTemplate.version,
            templateId: copywritingTemplate.id,
            templateLabel: copywritingTemplate.label,
          },
        }),
        620000,
        'AI 文案生成',
      );
      productDevelopmentLog('success', 'AI 文案返回', sku + ' | provider=' + productDevelopmentCleanText(response && response.provider, 80) + ' | model=' + productDevelopmentCleanText(response && response.model, 120) + ' | 用时=' + (Date.now() - startedAt) + 'ms');
      stage = '校验中英文条目';
      productDevelopmentCopywritingProgressStage(3);
      const content = productDevelopmentValidateCopywriting(response, snapshot);
      productDevelopmentLog('success', '文案校验通过', sku + ' | A=' + content.efficacy.length + ' | B=' + content.advantages.length + ' | C=' + content.sellingPoints.length + ' | D=' + content.ingredientFunctions.length);
      const id = 'pd-copywriting-' + Date.now().toString(36);
      const fileName = productDevelopmentCopywritingFileName(snapshot);
      state.productDevelopmentCopywriting = {
        id,
        sku: snapshot.sku,
        content,
        snapshot: productDevelopmentCopywritingSnapshotValue(snapshot),
        blob: null,
        fileName,
        provider: productDevelopmentCleanText(response.provider, 80),
        model: productDevelopmentCleanText(response.model, 120),
        templateVersion: copywritingTemplate.version,
        templateId: copywritingTemplate.id,
        templateLabel: copywritingTemplate.label,
        createdAt: new Date().toLocaleString(),
        updatedAt: Date.now(),
        fromCache: false,
      };
      saveProductDevelopmentCopywritingCache(state.productDevelopmentCopywriting);
      productDevelopmentLog('success', 'AI 文案已缓存到本地', sku + ' | id=' + id);
      if (state.productDevelopmentOneShotResult && state.productDevelopmentOneShotResult.sku === sku) {
        state.productDevelopmentOneShotResult = null;
        state.productDevelopmentOneShotIngredientConfirmed = false;
      }
      state.productDevelopmentStatus = '正在按四列表格模板生成 DOCX…';
      productDevelopmentCopywritingProgressStage(4);
      stage = '生成 DOCX';
      productDevelopmentLog('info', '开始生成 DOCX 文件', sku + ' | 模板=' + copywritingTemplate.label + ' | id=' + copywritingTemplate.id + ' | 编码器=' + (getLazyExternalRuntime('jszip') ? 'JSZip' : productDevelopmentDocxCodec() ? 'fflate' : 'none'));
      const blob = await withCopywritingTimeout(
        buildProductDevelopmentDocx(content, copywritingTemplateSource, snapshot),
        180000,
        'DOCX 生成',
      );
      productDevelopmentLog('success', 'DOCX 文件生成完成', sku + ' | 大小=' + String(blob && blob.size || 0) + ' bytes | 用时=' + (Date.now() - startedAt) + 'ms');
      state.productDevelopmentCopywriting.blob = blob;
      state.productDevelopmentStatus = '文案 DOCX 已生成，未向 PLM 回写';
      productDevelopmentLog('success', '文案 DOCX 生成完成', sku + ' | 条目=' + (content.efficacy.length + content.advantages.length + content.sellingPoints.length + content.ingredientFunctions.length) + ' | 总用时=' + (Date.now() - startedAt) + 'ms');
      showToast('文案 DOCX 已生成');
      productDevelopmentCopywritingProgressEnd();
    } catch (error) {
      productDevelopmentCopywritingProgressEnd(error);
      productDevelopmentLog('error', '文案生成失败', sku + ' | 阶段=' + stage + ' | 用时=' + (Date.now() - startedAt) + 'ms | ' + formatErrorMessage(error));
      state.productDevelopmentError = productDevelopmentFriendlyCopywritingError(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    } finally {
      state.productDevelopmentCopywritingBusy = false;
      renderShell();
    }
  }

  async function importProductDevelopmentTemplate(file) {
    if (!file) return;
    if (!/\.docx$/i.test(file.name || '') && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error('请选择 DOCX 模板');
    }
    const buffer = await file.arrayBuffer();
    if (!buffer || buffer.byteLength < 1000) throw new Error('模板文件为空');
    const base64 = arrayBufferToBase64(buffer);
    const version = 'local-' + String(file.name || 'template').replace(/[^A-Za-z0-9\u3400-\u9fff]+/g, '-').slice(0, 45);
    saveProductDevelopmentTemplate(base64, version);
    selectProductDevelopmentCopywritingTemplate('local');
    state.productDevelopmentStatus = state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.content
      ? '已保存本地模板：' + file.name + '，原文案已保留，下载时会重新套用模板'
      : '已保存本地模板：' + file.name;
    showToast('本地 DOCX 模板已保存');
    renderShell();
  }

  function resetProductDevelopmentTemplate() {
    try {
      if (typeof GM_deleteValue === 'function') {
        GM_deleteValue(PRODUCT_DEVELOPMENT_TEMPLATE_KEY);
        GM_deleteValue(PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY);
        GM_deleteValue(PRODUCT_DEVELOPMENT_TEMPLATE_SELECTION_KEY);
      } else {
        localStorage.removeItem(PRODUCT_DEVELOPMENT_TEMPLATE_KEY);
        localStorage.removeItem(PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY);
        localStorage.removeItem(PRODUCT_DEVELOPMENT_TEMPLATE_SELECTION_KEY);
      }
    } catch (error) {
      // Continue with in-memory reset.
    }
    state.productDevelopmentTemplateBase64 = '';
    state.productDevelopmentTemplateVersion = '';
    state.productDevelopmentCopywritingTemplateId = '';
    selectProductDevelopmentCopywritingTemplate(productDevelopmentEffectiveProductLine() === 'regular' ? productDevelopmentRegularCopywritingTemplateIdForKind(productDevelopmentEffectiveRegularNdcKind()) : PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID);
    showToast('已恢复当前产品线的内置文案模板');
    renderShell();
  }

  function setProductDevelopmentWorkMode(mode) {
    const previous = normalizeProductDevelopmentWorkMode(state.workMode);
    const next = normalizeProductDevelopmentWorkMode(mode);
    const wasEditing = Boolean(state.homeFeatureEditMode);
    if (previous !== next) state.homeModeTransition = next === 'product-development' ? 'to-product' : 'to-daily';
    state.workMode = next;
    state.productDevelopmentView = 'home';
    state.settings.workMode = next;
    saveSettings(state.settings);
    state.homeFeatureEditMode = false;
    if (next === 'product-development') {
      suspendDesignCollectionForProductDevelopment();
      state.view = 'home';
      state.copywritingMode = false;
      state.productDevelopmentError = '';
      if (typeof loadProductDevelopmentTasks === 'function') loadProductDevelopmentTasks({ silent: true }).catch(() => {});
    } else {
      state.view = 'home';
      state.productDevelopmentError = '';
    }
    const existingPanel = document.getElementById(PANEL_ID);
    const canUpdateInPlace = state.view === 'home'
      && !wasEditing
      && existingPanel
      && existingPanel.querySelector('.pfh-home-feature-track');
    const updatedInPlace = canUpdateInPlace && updateProductDevelopmentHomeModeDom(next);
    if (!updatedInPlace && state.view === 'home') {
      expandPanel();
      const panel = ensurePanel();
      const scrollSnapshot = capturePanelScroll(panel);
      renderHome(panel);
      restorePanelScroll(panel, scrollSnapshot);
      if (previous !== next) {
        const renderedTrack = panel.querySelector('.pfh-home-feature-track');
        if (renderedTrack) playProductDevelopmentHomeFeatureRailAnimation(renderedTrack, next === 'product-development', true);
      }
    } else if (!updatedInPlace) {
      expandPanel();
      renderShell();
    }
    if (updatedInPlace) state.homeModeTransition = '';
    if (previous !== next) {
      const transition = state.homeModeTransition;
      window.setTimeout(() => {
        if (state.homeModeTransition === transition) state.homeModeTransition = '';
      }, 520);
    }
  }

  function productDevelopmentModeSwitchHtml() {
    return '<div class="pfh-work-mode-switch" role="tablist" aria-label="工作模式">' +
      '<button type="button" data-action="work-mode" data-work-mode="daily" class="' + (state.workMode === 'daily' ? 'is-active' : '') + '">设计任务</button>' +
      '<button type="button" data-action="work-mode" data-work-mode="product-development" class="' + (state.workMode === 'product-development' ? 'is-active' : '') + '">产品开发</button>' +
      '</div>';
  }




  const PRODUCT_DEVELOPMENT_MATERIAL_LIBRARY_KEY = 'plm-floating-helper:product-development-materials:v1';
  const PRODUCT_DEVELOPMENT_MATERIAL_LIBRARY_MAX = 600;

  function productDevelopmentMaterialExcluded(category, name) {
    const text = String(category || '') + ' ' + String(name || '');
    return /盒|箱|标签|标贴|贴纸|说明书|纸卡|吊牌|卡片/.test(text);
  }

  function loadProductDevelopmentMaterialLibrary() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_MATERIAL_LIBRARY_KEY, null);
    return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && item.code
      && !productDevelopmentMaterialExcluded(item.category, item.name)) : [];
  }

  function saveProductDevelopmentMaterialLibrary(list) {
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_MATERIAL_LIBRARY_KEY, list.slice(0, PRODUCT_DEVELOPMENT_MATERIAL_LIBRARY_MAX));
  }

  function productDevelopmentMaterialImageUrl(entry) {
    const candidates = Array.isArray(entry) ? entry : (entry === null || entry === undefined ? [] : [entry]);
    for (const item of candidates) {
      if (!item) continue;
      const url = (typeof getApiAssetUrl === 'function' ? getApiAssetUrl(item, 0) : '')
        || normalizeApiAssetUrl(typeof item === 'object'
          ? (item.file_save_full_path || item.file_path || item.oss_path || item.oss_url || item.download_url || item.file_url || item.fileUrl || item.url || item.src || item.pic || item.image || '')
          : item);
      if (url) return url;
    }
    return '';
  }

  function productDevelopmentMaterialTypeFromCategory(category) {
    const segments = String(category || '').split(/\s*[-/／>＞]\s*/).map((item) => item.trim()).filter(Boolean);
    if (segments.length <= 1) return segments[0] || '包材';
    return segments[1] || segments[0];
  }

  function productDevelopmentRecordMaterialsFromBom(sku, bomRows) {
    const rows = Array.isArray(bomRows) ? bomRows : [];
    if (!rows.length) return false;
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const list = loadProductDevelopmentMaterialLibrary();
    const byCode = new Map(list.map((item) => [item.code, item]));
    let changed = false;
    const now = new Date().toLocaleString();
    rows.forEach((row) => {
      if (!row || row.type === '成品') return;
      const code = String(row.code || '').trim();
      const name = String(row.name || '').trim();
      const category = String(row.category || '').trim();
      if (!code || !name) return;
      if (!category || !/包材/.test(category)) return;
      if (productDevelopmentMaterialExcluded(category, name)) return;
      const image = productDevelopmentMaterialImageUrl(row.pics);
      const existing = byCode.get(code);
      if (existing) {
        if (!existing.image && image) { existing.image = image; changed = true; }
        if (!existing.supplier && row.supplier) { existing.supplier = String(row.supplier).trim(); changed = true; }
        if (!Array.isArray(existing.sourceSkus)) existing.sourceSkus = existing.sourceSku ? [existing.sourceSku] : [];
        if (normalizedSku && !existing.sourceSkus.includes(normalizedSku)) { existing.sourceSkus.push(normalizedSku); changed = true; }
        return;
      }
      const record = {
        code,
        name,
        type: productDevelopmentMaterialTypeFromCategory(category),
        category,
        specification: String(row.specification || '').trim(),
        supplier: String(row.supplier || '').trim(),
        price: String(row.price || '').trim(),
        image,
        sourceSku: normalizedSku,
        sourceSkus: normalizedSku ? [normalizedSku] : [],
        recordedAt: now,
      };
      byCode.set(code, record);
      list.unshift(record);
      changed = true;
    });
    if (changed) saveProductDevelopmentMaterialLibrary(list);
    return changed;
  }

  function productDevelopmentSweepMaterialsFromCaches() {
    let changed = false;
    [state.productDevelopmentTaskDetailData, state.productDevelopmentTaskFormData].forEach((map) => {
      if (!map || typeof map !== 'object') return;
      Object.keys(map).forEach((sku) => {
        const detail = map[sku];
        if (detail && Array.isArray(detail.bomRows) && detail.bomRows.length) {
          changed = productDevelopmentRecordMaterialsFromBom(sku, detail.bomRows) || changed;
        }
      });
    });
    try {
      const entries = loadProductDevelopmentReadonlyDetailCache();
      Object.keys(entries || {}).forEach((sku) => {
        const entry = entries[sku];
        const detail = entry && entry.detail;
        if (detail && Array.isArray(detail.bomRows) && detail.bomRows.length) {
          changed = productDevelopmentRecordMaterialsFromBom(sku, detail.bomRows) || changed;
        }
      });
    } catch (error) { /* 缓存读取失败时忽略，不影响库展示 */ }
    return changed;
  }

  function productDevelopmentMaterialsViewHtml() {
    const items = loadProductDevelopmentMaterialLibrary();
    const cards = items.map((item) => {
      const type = escapeHtml(item.type || '包材');
      return '<article class="pfh-plm-material-card">'
        + '<div class="pfh-plm-material-thumb">' + (item.image
          ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name || item.code) + '" loading="lazy" referrerpolicy="no-referrer">'
          : '<span>无图</span>') + '</div>'
        + '<div class="pfh-plm-material-info"><strong>' + escapeHtml(item.name || '') + '</strong><code>' + escapeHtml(item.code) + '</code>'
        + (item.specification ? '<small>' + escapeHtml(item.specification) + '</small>' : '')
        + '</div>'
        + '<span class="pfh-plm-material-type-chip">' + type + '</span>'
        + '</article>';
    }).join('');
    return '<div class="pfh-product-development pfh-product-development-subview">'
      + '<header class="pfh-product-development-subview-head"><button type="button" class="pfh-upload-back" data-action="product-development-home" aria-label="返回产品开发主页">' + iconHtml('backArrow') + '</button><strong>包材库</strong><span>' + items.length + ' 种</span></header>'
      + '<section class="pfh-product-development-section">'
      + (items.length
        ? '<div class="pfh-plm-material-grid">' + cards + '</div>'
        : '<div class="pfh-plm-material-empty">还没有归档包材。打开或刷新开发任务的 SKU 后，BOM 里的瓶子等包材会自动记录到这里。</div>')
      + '</section></div>';
  }




  function productDevelopmentPricingResultHtml(result, sku, detail) {
    if (!result) return '<div class="pfh-product-development-result-empty">请输入全包价格和税率，系统会按定价标准计算三档价格。</div>';
    const canApply = Boolean(sku && detail && !detail.error);
    const tiers = [
      ['国内一档价格', result.firstPrice, '三档价格 + 2'],
      ['国内二档价格', result.secondPrice, '三档价格 + 1'],
      ['国内三档价格', result.thirdPrice, '（全包价格 × (1 + 税率/100) + 3）÷ 0.7'],
    ];
    return '<div class="pfh-product-development-grid pfh-product-development-pricing-result-grid">' + tiers.map((tier) => '<article class="pfh-product-development-card pfh-product-development-pricing-tier"><div class="pfh-product-development-card-head"><span>' + iconHtml('calculator') + '</span><i>公式建议</i></div><h3>' + escapeHtml(tier[0]) + '</h3><p><strong>¥' + escapeHtml(productDevelopmentPricingPriceText(tier[1])) + '</strong></p><small>' + escapeHtml(tier[2]) + '</small></article>').join('') + '</div>' +
      '<div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-pricing-apply" data-product-sku="' + escapeHtml(sku) + '"' + (canApply ? '' : ' disabled') + '>填入当前 SKU 建品资料</button></div>';
  }

  function productDevelopmentPricingViewHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    const input = productDevelopmentPricingInputForSku(sku, detail);
    const result = productDevelopmentCalculateTierPrices(input.fullPackagePrice, input.taxRatePercent);
    const statusHtml = state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '';
    const errorHtml = state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '';
    return '<div class="pfh-product-development pfh-product-development-subview">' +
      '<header class="pfh-product-development-subview-head"><button type="button" class="pfh-upload-back" data-action="product-development-home" aria-label="返回产品开发主页">' + iconHtml('backArrow') + '</button><strong>定价标准</strong></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>计算国内三档价格</h3><p>三档价格 = （全包价格 × (1 + 税率/100) + 3）÷ 0.7；二档价格 = 三档价格 + 1；一档价格 = 三档价格 + 2。</p></div><span>' + escapeHtml(sku ? '当前 SKU：' + sku : '公式计算工具') + '</span></section>' +
      '<section class="pfh-product-development-detail-form"><header><div><h3>定价输入</h3></div></header><div class="pfh-product-development-form-grid"><label class="pfh-product-development-material-field"><span>全包价格（元）</span><input type="number" min="0" step="0.01" inputmode="decimal" class="pfh-product-development-pricing-input" data-product-development-pricing-field="fullPackagePrice" value="' + escapeHtml(input.fullPackagePrice) + '" placeholder="例如：6.50"></label><label class="pfh-product-development-material-field"><span>税率（%）</span><input type="number" min="0" max="100" step="0.01" inputmode="decimal" class="pfh-product-development-pricing-input" data-product-development-pricing-field="taxRatePercent" value="' + escapeHtml(input.taxRatePercent) + '" placeholder="例如：13"></label></div></section>' +
      statusHtml + errorHtml +
      '<section class="pfh-product-development-form-section"><h4>计算结果</h4><div class="pfh-product-development-pricing-result">' + productDevelopmentPricingResultHtml(result, sku, detail) + '</div></section></div>';
  }

  function productDevelopmentApplyPricingToProduct(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail || detail.error) {
      showToast('当前 SKU 详情还未读取完成');
      return false;
    }
    const input = productDevelopmentPricingInputForSku(normalizedSku, detail);
    const result = productDevelopmentCalculateTierPrices(input.fullPackagePrice, input.taxRatePercent);
    if (!result) {
      showToast('请先填写有效的全包价格和 0–100 的税率');
      return false;
    }
    [
      ['firstPrice', result.firstPrice],
      ['secondPrice', result.secondPrice],
      ['thirdPrice', result.thirdPrice],
    ].forEach(([key, value]) => {
      const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
      if (!definition) return;
      const text = productDevelopmentPricingPriceText(value);
      productDevelopmentRememberLocalProductField(detail, definition, text, text, '定价标准公式');
      productDevelopmentProductFieldCollections(detail)
        .filter((field) => Number(field && field.attrId) === Number(definition.attrId))
        .forEach((field) => {
          field.value = text;
          field.displayValue = text;
          field.status = '已填写（本地）';
          field.source = '定价标准公式（未写入）';
        });
    });
    productDevelopmentMarkProductDetailDirty(detail);
    scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    state.productDevelopmentStatus = '已按定价标准填入一档、二档、三档价格（本地草稿）';
    state.productDevelopmentError = '';
    showToast(state.productDevelopmentStatus);
    renderShell();
    return true;
  }

  function productDevelopmentReviewHtml() {
    const result = state.productDevelopmentReview;
    const sku = getProductDevelopmentCurrentSku();
    const resultMatchesCurrentSku = Boolean(result && result.sku === sku);
    const canShowResult = Boolean(result && resultMatchesCurrentSku);
    const items = canShowResult ? result.items || [] : [];
    const extractedTexts = canShowResult && Array.isArray(result.extractedTexts) ? result.extractedTexts : [];
    const riskCount = items.filter((item) => Array.isArray(item && item.riskTypes) && item.riskTypes.length).length;
    const extractedSummary = extractedTexts.length ? '<div class="pfh-product-development-preview-note"><strong>已读取 ' + extractedTexts.length + ' 项文字，识别风险 ' + riskCount + ' 项。</strong></div>' : '';
    const canEditResult = canShowResult;
    const previewCopyActions = Array.isArray(items) && items.length
      ? '<button type="button" data-action="product-development-review-copy-all" title="复制图片识别出的全部原文">复制全文</button><button type="button" data-action="product-development-review-copy-revised" title="复制当前修改后的中英文文案">复制修改后的文案</button>'
      : '';
    const preview = canShowResult && result.comparisonDataUrl ? '<section class="pfh-product-development-preview"><div class="pfh-product-development-preview-head"><strong>三列对照图预览</strong></div><div class="pfh-product-development-preview-scroll"><img src="' + escapeHtml(result.comparisonDataUrl) + '" alt="侵权对照图"' + (canEditResult ? ' data-action="product-development-review-editor-open" class="pfh-product-development-preview-zoom" title="点击打开对照编辑"' : '') + ' style="display:block;width:100%;min-width:0;max-width:100%;height:auto;object-fit:contain"></div><div class="pfh-product-development-preview-actions">' + (canEditResult ? '<button type="button" data-action="product-development-review-editor-open">编辑对照文字</button>' : '') + previewCopyActions + '<button type="button" data-action="product-development-review-download">下载 PNG</button></div></section>' : '';
    const list = canShowResult ? '' : '<div class="pfh-product-development-result-empty">完成分析后，这里会列出原图文字、风险类型和修改内容，并支持手动修改。</div>';
    const editor = canEditResult ? productDevelopmentReviewEditorHtml(result, items) : '';
    return '<div class="pfh-product-development pfh-product-development-subview">' +
      '<header class="pfh-product-development-subview-head"><button type="button" class="pfh-upload-back" data-action="product-development-home" aria-label="返回产品开发主页">' + iconHtml('backArrow') + '</button><strong>产品图风险筛查</strong></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>生成侵权对照图</h3></div><button type="button" data-action="product-development-review-run"' + (state.productDevelopmentReviewBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentReviewBusy ? '正在分析…' : '开始一次分析') + '</button></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '') +
      extractedSummary +
      (canShowResult ? productDevelopmentRawMaterialHtml(result) : '') +
      (canShowResult ? productDevelopmentProductNamingHtml(result) : '') +
      (canEditResult ? productDevelopmentPlainTextCopyHtml(result) : '') +
      preview + list + editor + '</div>';
  }

  function productDevelopmentCopywritingPreviewHtml(content) {
    if (!content) return '';
    const rows = [
      ['A 产品功效', content.efficacy],
      ['B 产品优势', content.advantages],
      ['C 产品卖点', content.sellingPoints],
      ['D 成分功能', content.ingredientFunctions],
    ];
    return '<div class="pfh-product-development-copywriting-preview">' + rows.map((row) => '<section><h4>' + escapeHtml(row[0]) + '</h4><div><ol>' + row[1].map((item) => '<li><span>' + escapeHtml((row[0] === 'C 产品卖点' && item.titleEn ? item.titleEn + ': ' : '') + (item.en || item.ingredientEn)) + '</span><em>' + escapeHtml((row[0] === 'C 产品卖点' && item.titleCn ? item.titleCn + '：' : '') + (item.cn || item.ingredientCn)) + '</em></li>').join('') + '</ol></div></section>').join('') + '</div>';
  }

  function productDevelopmentIngredientTemplateById(templateId) {
    const id = String(templateId || '').trim();
    if (!id) return null;
    return productDevelopmentIngredientTemplatesData()
      .find((item) => item && String(item.id || '').trim() === id) || null;
  }

  function productDevelopmentOneShotIngredientTemplate() {
    const selected = productDevelopmentIngredientTemplateById(state.productDevelopmentIngredientTemplateId);
    if (selected) return selected;
    const kind = normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind);
    return productDevelopmentIngredientSelectedTemplate(kind, '') || productDevelopmentIngredientTemplateById('human-builtin');
  }

  function productDevelopmentOneShotIngredientTemplateSheets(template) {
    return template && Array.isArray(template.sheets)
      ? template.sheets.filter((sheet) => sheet && String(sheet.name || '').trim() && Array.isArray(sheet.cells) && sheet.cells.length)
      : [];
  }

  function productDevelopmentOneShotIngredientTemplateOptions(selectedTemplate) {
    const templates = productDevelopmentIngredientTemplates('human').concat(productDevelopmentIngredientTemplates('pet'));
    return templates.map((item) => '<option value="' + escapeHtml(item.id) + '"' + (item.id === (selectedTemplate && selectedTemplate.id) ? ' selected' : '') + '>' + escapeHtml(item.label || item.fileName || item.id) + '</option>').join('')
      || '<option value="">正在加载云端模板…</option>';
  }

  function productDevelopmentWarmIngredientTemplates() {
    const isVisible = () => state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskView === 'copywriting';
    ensureProductDevelopmentIngredientTemplatesLoaded().then(() => {
      if (isVisible()) renderShell();
    }).catch((error) => {
      if (!isVisible()) return;
      state.productDevelopmentError = '云端成分表模板加载失败：' + formatErrorMessage(error);
      renderShell();
    });
  }

  function productDevelopmentOneShotIngredientSheetOptions(template) {
    const selectedSheet = String(state.productDevelopmentIngredientSheetName || '').trim();
    const sheets = productDevelopmentOneShotIngredientTemplateSheets(template);
    return '<option value=""' + (!sheets.some((sheet) => String(sheet.name || '') === selectedSheet) ? ' selected' : '') + '>自动匹配参考工作表</option>' + sheets.map((sheet) => {
      const name = String(sheet.name || '').trim();
      return '<option value="' + escapeHtml(name) + '"' + (name === selectedSheet ? ' selected' : '') + '>' + escapeHtml(name) + '</option>';
    }).join('');
  }

  function productDevelopmentOneShotTemplateHeader(sheet) {
    const source = sheet && Array.isArray(sheet.cells) ? sheet.cells : [];
    return source
      .filter((cell) => Number(cell && cell.row) > 0 && Number(cell && cell.row) <= 3)
      .map((cell) => String(cell && cell.value || '').trim())
      .filter(Boolean)
      .join('\n');
  }

  function productDevelopmentOneShotTemplateSheetForSelection(template, sheetName, hints) {
    const sheets = productDevelopmentOneShotIngredientTemplateSheets(template);
    if (!sheets.length) return null;
    const requested = String(sheetName || '').trim();
    const exact = requested ? sheets.find((sheet) => String(sheet.name || '').trim() === requested) : null;
    if (exact) return exact;
    const hint = String(hints || '').toLowerCase();
    const formRules = [
      { pattern: /drop|liquid|滴剂|饮用|口服|喷雾|水剂/, score: 40 },
      { pattern: /softgel|soft\s+gel|软胶囊/, score: 40 },
      { pattern: /capsule|胶囊/, score: 35 },
      { pattern: /tablet|lozenge|片剂|含片/, score: 35 },
      { pattern: /gummy|chew|软糖|咀嚼|软颗粒|颗粒/, score: 35 },
      { pattern: /powder|sachet|粉|牙粉/, score: 30 },
    ];
    let best = sheets[0];
    let bestScore = -1;
    sheets.forEach((sheet, index) => {
      const text = (String(sheet.name || '') + ' ' + productDevelopmentOneShotTemplateHeader(sheet)).toLowerCase();
      let score = Math.max(0, 12 - index / 100);
      formRules.forEach((rule) => {
        if (rule.pattern.test(hint) && rule.pattern.test(text)) score += rule.score;
      });
      if (score > bestScore) {
        best = sheet;
        bestScore = score;
      }
    });
    return best;
  }

  function productDevelopmentOneShotNormalizeServingSize(value) {
    let text = productDevelopmentCleanText(value, 120).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    text = text
      .replace(/\bml\b/gi, 'mL')
      .replace(/\bmcg\b/gi, 'mcg')
      .replace(/\bsoft\s+chews?\b/gi, (match) => /s$/i.test(match) ? 'Soft Chews' : 'Soft Chew')
      .replace(/\bsoft\s*gels?\b/gi, (match) => /s$/i.test(match) ? 'Softgels' : 'Softgel')
      .replace(/\b(dropper|droppers)\b/gi, 'Dropper')
      .replace(/\b(scoop|scoops)\b/gi, 'Scoop')
      .replace(/\b(spoon|spoons)\b/gi, 'Spoon')
      .replace(/\(\s*xx\s*g\s*\)/gi, '')
      .replace(/\s*:\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (/^dropper\b/i.test(text) && !/^\d/.test(text)) text = '1 ' + text;
    text = text.replace(/^(\d+)\s*(scoop|spoon)\b/i, '$1 $2');
    return text;
  }

  function productDevelopmentOneShotTemplateForm(sheet, kind) {
    const sheetName = String(sheet && sheet.name || '').toLowerCase();
    const header = productDevelopmentOneShotTemplateHeader(sheet).toLowerCase();
    const text = sheetName + ' ' + header;
    if (/softgel|soft\s+gel|软胶囊/.test(text)) return kind === 'pet' ? 'soft chews' : 'softgel capsules';
    if (/capsule|胶囊/.test(text)) return kind === 'pet' ? 'soft chews' : 'capsules';
    if (/tablet|lozenge|片剂|含片/.test(text)) return kind === 'pet' ? 'soft chews' : 'tablets';
    if (/gummy|chew|软糖|咀嚼|软颗粒|颗粒/.test(text)) return kind === 'pet' ? 'soft chews' : 'gummies';
    if (/powder|sachet|粉|牙粉/.test(text)) return 'powder';
    return 'liquid drops';
  }

  function productDevelopmentOneShotTemplateDefaults(template, sheetName, hints) {
    const kind = normalizeProductDevelopmentIngredientKind(template && template.kind);
    const sheet = productDevelopmentOneShotTemplateSheetForSelection(template, sheetName, hints);
    const header = productDevelopmentOneShotTemplateHeader(sheet);
    const servingSizeMatch = header.match(/serving\s+size\s*[:：]?\s*([^\r\n]+)/i);
    const activePerMatch = header.match(/(?:active\s+ingredients|ingredients)\s+per\s*[:：]?\s*([^\r\n:]+)/i);
    const form = productDevelopmentOneShotTemplateForm(sheet, kind);
    let servingSize = productDevelopmentOneShotNormalizeServingSize(servingSizeMatch && servingSizeMatch[1]);
    if (!servingSize) servingSize = productDevelopmentOneShotNormalizeServingSize(activePerMatch && activePerMatch[1]);
    if (!servingSize) {
      servingSize = form === 'liquid drops'
        ? (kind === 'pet' ? '1 Dropper (1 mL)' : '1 mL')
        : form === 'powder'
          ? (kind === 'pet' ? '1 Scoop (5 g)' : '5 g')
          : form === 'softgel capsules'
            ? '1 Softgel'
            : form === 'capsules'
              ? '1 Capsule'
              : form === 'tablets'
                ? '2 Tablets'
                : form === 'gummies'
                  ? '2 Gummies'
                  : '2 Soft Chews';
    }
    const servingsMatch = header.match(/serv(?:ing|ings)\s+per\s+container\s*[:：]?\s*(\d+)/i);
    const defaultServings = servingsMatch ? String(Math.max(1, Math.min(365, Number(servingsMatch[1])))) : '60';
    const humanOtherEn = PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.otherIngredientsEn;
    const humanOtherCn = PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.otherIngredientsCn;
    const petOtherEn = PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.otherIngredientsEn;
    const petOtherCn = PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.otherIngredientsCn;
    return {
      productType: (kind === 'pet' ? 'Pet food supplement / ' : 'Human dietary supplement / ') + form,
      servingSize,
      servingsPerContainer: defaultServings,
      targetActivePercent: '0',
      otherIngredientsEn: kind === 'pet' ? petOtherEn : humanOtherEn,
      otherIngredientsCn: kind === 'pet' ? petOtherCn : humanOtherCn,
      resolvedSheetName: String(sheet && sheet.name || '').trim(),
      resolvedSheetHeader: header,
    };
  }

  function productDevelopmentOneShotApplyTemplateDefaults(input, template, sheetName, options) {
    const result = productDevelopmentOneShotInputValue(input);
    const snapshot = state.productDevelopmentSnapshot && typeof state.productDevelopmentSnapshot === 'object' ? state.productDevelopmentSnapshot : {};
    const task = state.productDevelopmentSelectedTask && typeof state.productDevelopmentSelectedTask === 'object' ? state.productDevelopmentSelectedTask : {};
    const sourcePlainTextCopy = snapshot.sku ? productDevelopmentOneShotPlainTextCopy(snapshot.sku, snapshot) : '';
    const hints = [snapshot.name, snapshot.productType, snapshot.englishName, task.name, task.productName, task.productType, sourcePlainTextCopy].filter(Boolean).join(' ');
    const frontFacts = productDevelopmentOneShotFrontFacts(sourcePlainTextCopy);
    const defaults = productDevelopmentOneShotTemplateDefaults(template, sheetName, hints);
    const previous = state.productDevelopmentOneShotTemplateDefaults && typeof state.productDevelopmentOneShotTemplateDefaults === 'object'
      ? state.productDevelopmentOneShotTemplateDefaults
      : {};
    const force = Boolean(options && options.force);
    ['productType', 'servingSize', 'servingsPerContainer', 'targetActivePercent', 'otherIngredientsEn', 'otherIngredientsCn'].forEach((key) => {
      const current = String(result[key] || '').trim();
      const isGeneric = key === 'productType' && /^(?:Human dietary supplement|Pet food supplement) \/ (?:liquid drops|soft chews)$/i.test(current);
      const explicitlyEntered = key === 'targetActivePercent' && result.targetActivePercentExplicit === 'true';
      if (!explicitlyEntered && (force || !current || current === String(previous[key] || '').trim() || current === String(PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT[key] || '').trim() || isGeneric)) result[key] = defaults[key];
    });
    if (frontFacts.servingSize) {
      const current = String(result.servingSize || '').trim();
      const previousServing = String(previous.servingSize || '').trim();
      if (force || !current || current === previousServing || current === String(PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.servingSize || '').trim() || current === String(defaults.servingSize || '').trim()) result.servingSize = frontFacts.servingSize;
    }
    if (frontFacts.servingsPerContainer > 0) {
      const current = String(result.servingsPerContainer || '').trim();
      const previousServings = String(previous.servingsPerContainer || '').trim();
      if (force || !current || current === previousServings || current === String(PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.servingsPerContainer || '').trim() || current === String(defaults.servingsPerContainer || '').trim()) result.servingsPerContainer = String(frontFacts.servingsPerContainer);
    }
    state.productDevelopmentOneShotTemplateDefaults = { ...defaults };
    state.productDevelopmentOneShotResolvedSheetName = defaults.resolvedSheetName;
    return result;
  }

  function productDevelopmentOneShotPlainTextCopy(sku, snapshot) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const review = state.productDevelopmentReview && state.productDevelopmentReview.sku === normalizedSku
      ? state.productDevelopmentReview
      : getProductDevelopmentReviewDraft(normalizedSku);
    const snapshotCopy = productDevelopmentCleanText(snapshot && snapshot.sourcePlainTextCopy, 12000);
    if (snapshotCopy) return snapshotCopy;
    const stored = productDevelopmentCleanText(review && (review.plainTextCopy || review.approvedPlainText || review.finalCopy), 12000);
    if (stored) return stored;
    if (review && Array.isArray(review.items) && review.items.length) {
      try {
        return productDevelopmentCleanText(productDevelopmentReviewCopyValue(review, 'revised'), 12000);
      } catch (_) {
        return '';
      }
    }
    return '';
  }

  function productDevelopmentOneShotSelectedSourceHtml(sku) {
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku
      ? state.productDevelopmentSnapshot
      : null;
    const result = state.productDevelopmentOneShotResult && state.productDevelopmentOneShotResult.sku === sku
      ? state.productDevelopmentOneShotResult
      : null;
    const task = state.productDevelopmentSelectedTask && typeof state.productDevelopmentSelectedTask === 'object'
      ? state.productDevelopmentSelectedTask
      : {};
    const name = productDevelopmentCleanText(snapshot && snapshot.name || task.name || task.productName || '当前选中产品', 220);
    const input = productDevelopmentOneShotInputForRender();
    const ingredientTemplate = productDevelopmentOneShotIngredientTemplate();
    const productType = productDevelopmentCleanText(input.productType || snapshot && snapshot.productType || '生成时按当前 SKU 读取', 180);
    const templateOptions = productDevelopmentOneShotIngredientTemplateOptions(ingredientTemplate);
    const sheetOptions = productDevelopmentOneShotIngredientSheetOptions(ingredientTemplate);
    const isRegularLine = productDevelopmentEffectiveProductLine() === 'regular';
    const regularInput = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
      ? state.productDevelopmentOneShotInput
      : {};
    const manualLine = String(regularInput.productLine || '').trim();
    const guessedLine = productDevelopmentGuessProductLine(productDevelopmentRegularDetectName());
    const ndcKind = productDevelopmentEffectiveRegularNdcKind();
    const lineSelectHtml = '<label class="pfh-product-development-material-field"><span>产品线</span><select class="pfh-product-development-one-shot-product-line-input" aria-label="选择产品线"><option value="auto"' + (manualLine ? '' : ' selected') + '>自动匹配：' + (guessedLine === 'regular' ? '常规产品（非食品）' : '食品') + '</option><option value="food"' + (manualLine === 'food' ? ' selected' : '') + '>食品（膳食补充）</option><option value="regular"' + (manualLine === 'regular' ? ' selected' : '') + '>常规产品（非食品）</option></select></label>';
    const ndcSelectHtml = isRegularLine
      ? '<label class="pfh-product-development-material-field"><span>NDC 类型</span><select class="pfh-product-development-one-shot-ndc-input" aria-label="选择 NDC 类型"><option value="non-ndc"' + (ndcKind === 'non-ndc' ? ' selected' : '') + '>非 NDC（美妆/个护）</option><option value="ndc"' + (ndcKind === 'ndc' ? ' selected' : '') + '>涉 NDC（健康保健/贴类）</option></select></label>'
      : '';
    const productTypeHtml = result
      ? '<div class="pfh-product-development-one-shot-settings-product"><small>产品类型</small><strong>' + escapeHtml(productType) + '</strong></div>'
      : '<div class="pfh-product-development-one-shot-settings-product">' + productDevelopmentOneShotFieldHtml(input, 'productType', '产品类型', 'text') + '</div>';
    const ingredientTemplateHtml = isRegularLine ? '' : '<label class="pfh-product-development-material-field"><span>成分表模板</span><select class="pfh-product-development-one-shot-ingredient-template-input" aria-label="选择成分表模板">' + templateOptions + '</select></label>';
    const sheetSelectHtml = isRegularLine ? '' : '<label class="pfh-product-development-material-field"><span>参考工作表（可选）</span><select class="pfh-product-development-one-shot-ingredient-sheet-input" aria-label="选择参考工作表"' + (ingredientTemplate ? '' : ' disabled') + '>' + sheetOptions + '</select></label>';
    const packagingKind = ['boxed', 'bagged'].includes(input.packagingKind) ? input.packagingKind : '';
    const packagingHtml = '<label class="pfh-product-development-material-field"><span>包装形式</span><select data-product-development-one-shot-field="packagingKind" aria-label="选择包装形式"><option value=""' + (!packagingKind ? ' selected' : '') + '>自动识别（按 PLM 尺寸）</option><option value="boxed"' + (packagingKind === 'boxed' ? ' selected' : '') + '>盒装 · 删除袋装窒息标识行</option><option value="bagged"' + (packagingKind === 'bagged' ? ' selected' : '') + '>袋装 · 保留窒息标识行</option></select><small>尺寸不完整时，请手动选择盒装或袋装。</small></label>';
    return '<div class="pfh-cw-source"><div class="pfh-cw-product"><strong>' + escapeHtml(name) + '</strong><span>' + escapeHtml(sku || '未选择 SKU') + '</span></div><h3>生成设置</h3><div class="pfh-cw-settings">' + lineSelectHtml + ndcSelectHtml + packagingHtml + productTypeHtml + ingredientTemplateHtml + sheetSelectHtml + '</div>' + productDevelopmentCopywritingToolbarHtml() + '</div>';
  }

  function productDevelopmentOneShotEditorFieldHtml(value, key, label, type, multiline, wide) {
    const rawValue = typeof value === 'object' && value !== null ? value[key] : value;
    const isOptionalTarget = ['requiredActiveMg', 'requiredStandardizedActivePercent'].includes(key);
    const safeValue = isOptionalTarget && !(Number(rawValue) > 0)
      ? ''
      : String(rawValue === undefined || rawValue === null ? '' : rawValue);
    const className = 'pfh-product-development-material-field' + (wide ? ' is-wide' : '');
    const control = multiline
      ? '<textarea class="pfh-product-development-review-input" rows="3" data-product-development-one-shot-editor-field="' + escapeHtml(key) + '" spellcheck="false">' + escapeHtml(safeValue) + '</textarea>'
      : '<input type="' + escapeHtml(type || 'text') + '" class="pfh-product-development-review-input" data-product-development-one-shot-editor-field="' + escapeHtml(key) + '" value="' + escapeHtml(safeValue) + '"' + (type === 'number' ? ' step="any"' : '') + '>';
    return '<label class="' + className + '"><span>' + escapeHtml(label) + '</span>' + control + '</label>';
  }

  function productDevelopmentOneShotEditableRowLabel(row) {
    const source = row && typeof row === 'object' ? row : {};
    const value = Object.prototype.hasOwnProperty.call(source, 'labelEn')
      ? source.labelEn
      : productDevelopmentOneShotIngredientLabel(source, false);
    return productDevelopmentCleanText(value, 600);
  }

  function productDevelopmentOneShotEditableAmountText(row) {
    const source = row && typeof row === 'object' ? row : {};
    return Object.prototype.hasOwnProperty.call(source, 'amountText')
      ? String(source.amountText || '')
      : Number.isFinite(Number(source.amountValue)) && source.amountUnit
        ? productDevelopmentOneShotFormatMeasuredAmount(source.amountValue, source.amountUnit)
      : productDevelopmentOneShotFormatAmount(source.amountMg);
  }

  function productDevelopmentOneShotAmountToMg(value) {
    const parsed = productDevelopmentOneShotParseAmount(value);
    return parsed.isMass ? parsed.massMg : NaN;
  }

  function productDevelopmentOneShotFormatMeasuredAmount(value, unit) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return '';
    const text = String(productDevelopmentOneShotRounded(amount, 3)).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    return text + (unit ? ' ' + String(unit).trim() : '');
  }

  function productDevelopmentOneShotMarkerToMg(value) {
    const text = String(value === undefined || value === null ? '' : value).replace(/,/g, '').trim();
    return text ? productDevelopmentOneShotAmountToMg(text) : 0;
  }

  function productDevelopmentOneShotDraftValidation(result) {
    const table = result && result.ingredientTable && typeof result.ingredientTable === 'object' ? result.ingredientTable : {};
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    const errors = [];
    const names = new Set();
    let activeTotalMg = 0;
    let standardizedActiveMg = 0;
    if (!String(table.title || '').trim()) errors.push((isPet ? 'Product Facts' : 'Supplement Facts') + ' 标题不能为空');
    if (!String(table.servingSize || '').trim()) errors.push('Serving Size 不能为空');
    if (!(Number(table.servingsPerContainer) > 0)) errors.push('Servings Per Container 必须大于 0');
    if (rows.length < 1) errors.push('至少保留 1 行核心活性成分');
    if (rows.length > 6) errors.push('当前成分表最多保留 6 行核心活性成分');
    rows.forEach((row, index) => {
      const line = index + 1;
      const label = productDevelopmentOneShotEditableRowLabel(row);
      const amountMg = productDevelopmentOneShotAmountToMg(productDevelopmentOneShotEditableAmountText(row));
      const markerMg = productDevelopmentOneShotMarkerToMg(row && row.markerActiveMg);
      const normalizedName = productDevelopmentNormalizedClaimText(label);
      if (!label) errors.push('第 ' + line + ' 行缺少成分名称');
      if (!String(row && row.nameCn || '').trim()) errors.push('第 ' + line + ' 行缺少中文名称');
      if (normalizedName && names.has(normalizedName)) errors.push('第 ' + line + ' 行与其他成分重复');
      if (normalizedName) names.add(normalizedName);
      if (!Number.isFinite(amountMg) && !productDevelopmentOneShotHasMeasuredAmount(productDevelopmentOneShotEditableAmountText(row))) errors.push('第 ' + line + ' 行 Amount Per Serving 必须填写带单位的数值');
      if (!isPet && (!Number.isFinite(markerMg) || markerMg < 0 || markerMg > amountMg + 0.001)) errors.push('第 ' + line + ' 行标志物 mg 必须不大于该成分含量');
      const dailyValue = String(row && row.dailyValue || '**').trim();
      if (!isPet && dailyValue !== '**' && !/^\d+(?:\.\d+)?%$/.test(dailyValue)) errors.push('第 ' + line + ' 行 % Daily Value 请填写数字百分比或 **');
      if (Number.isFinite(amountMg) && amountMg > 0) activeTotalMg += amountMg;
      if (Number.isFinite(markerMg) && markerMg > 0) standardizedActiveMg += markerMg;
    });
    const targetActiveMg = Number(table.requiredActiveMg || 0);
    const targetStandardizedPercent = Number(table.requiredStandardizedActivePercent || 0);
    const standardizedActivePercent = activeTotalMg > 0 ? standardizedActiveMg / activeTotalMg * 100 : 0;
    const hasMassAmounts = rows.some((row) => Number.isFinite(productDevelopmentOneShotAmountToMg(productDevelopmentOneShotEditableAmountText(row))));
    const allMassAmounts = rows.length > 0 && rows.every((row) => Number.isFinite(productDevelopmentOneShotAmountToMg(productDevelopmentOneShotEditableAmountText(row))));
    if (targetActiveMg > 0 && allMassAmounts && Math.abs(activeTotalMg - targetActiveMg) > 0.01) errors.push('活性合计 ' + productDevelopmentOneShotRounded(activeTotalMg, 3) + ' mg 必须等于目标 ' + productDevelopmentOneShotRounded(targetActiveMg, 3) + ' mg');
    if (!isPet && targetStandardizedPercent > 0 && hasMassAmounts && standardizedActivePercent + 0.001 < targetStandardizedPercent) errors.push('标准化活性比例 ' + productDevelopmentOneShotRounded(standardizedActivePercent, 2) + '% 低于目标 ' + productDevelopmentOneShotRounded(targetStandardizedPercent, 2) + '%');
    return {
      valid: errors.length === 0,
      errors: Array.from(new Set(errors)).slice(0, 8),
      activeTotalMg: productDevelopmentOneShotRounded(activeTotalMg, 3),
      standardizedActiveMg: productDevelopmentOneShotRounded(standardizedActiveMg, 3),
      standardizedActivePercent: productDevelopmentOneShotRounded(standardizedActivePercent, 2),
      hasMassAmounts,
      allMassAmounts,
    };
  }

  function productDevelopmentOneShotApplyDraftMetrics(result) {
    if (!result || !result.ingredientTable) return productDevelopmentOneShotDraftValidation(result);
    const validation = productDevelopmentOneShotDraftValidation(result);
    result.ingredientTable.activeTotalMg = validation.activeTotalMg;
    result.ingredientTable.standardizedActiveMg = validation.standardizedActiveMg;
    result.ingredientTable.standardizedActivePercent = validation.standardizedActivePercent;
    result.pdfBlob = null;
    return validation;
  }

  function productDevelopmentOneShotEditorRowsHtml(result) {
    const table = result && result.ingredientTable && typeof result.ingredientTable === 'object' ? result.ingredientTable : {};
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    return rows.map((row, index) => {
      const label = productDevelopmentOneShotEditableRowLabel(row);
      const amount = productDevelopmentOneShotEditableAmountText(row);
      const marker = row && Number(row.markerActiveMg) > 0 ? productDevelopmentOneShotRounded(row.markerActiveMg, 3) : '';
      const humanFields = '<label class="pfh-product-development-material-field"><span>% Daily Value</span><input type="text" class="pfh-product-development-review-input" data-product-development-one-shot-row-index="' + index + '" data-product-development-one-shot-row-field="dailyValue" value="' + escapeHtml(row && row.dailyValue || '**') + '" spellcheck="false"></label><label class="pfh-product-development-material-field"><span>标志物 mg（用于标准化比例校验）</span><input type="text" class="pfh-product-development-review-input" data-product-development-one-shot-row-index="' + index + '" data-product-development-one-shot-row-field="markerActiveMg" value="' + escapeHtml(marker) + '" placeholder="可留空" spellcheck="false"></label>';
      return '<div class="pfh-product-development-review-editor-row"><div class="pfh-product-development-review-editor-head"><b>' + String(index + 1).padStart(2, '0') + '</b><span>活性成分编辑</span><button type="button" data-action="product-development-one-shot-ingredient-remove" data-product-development-one-shot-row-index="' + index + '"' + (rows.length <= 1 ? ' disabled' : '') + ' aria-label="删除第 ' + (index + 1) + ' 行">×</button></div><div class="pfh-product-development-form-grid"><label class="pfh-product-development-material-field is-wide"><span>成分名称 / Ingredient（需要时填写 Latin scientific name）</span><input type="text" class="pfh-product-development-review-input" data-product-development-one-shot-row-index="' + index + '" data-product-development-one-shot-row-field="labelEn" value="' + escapeHtml(label) + '" spellcheck="false"></label><label class="pfh-product-development-material-field"><span>中文名称</span><input type="text" class="pfh-product-development-review-input" data-product-development-one-shot-row-index="' + index + '" data-product-development-one-shot-row-field="nameCn" value="' + escapeHtml(row && row.nameCn || '') + '"></label><label class="pfh-product-development-material-field"><span>用量 / Amount Per Serving（可保留 FU、IU、CFU 等包装单位）</span><input type="text" class="pfh-product-development-review-input" data-product-development-one-shot-row-index="' + index + '" data-product-development-one-shot-row-field="amountText" value="' + escapeHtml(amount) + '" spellcheck="false"></label>' + (isPet ? '' : humanFields) + '</div></div>';
    }).join('');
  }

  function productDevelopmentOneShotPreviewHtml(result) {
    const table = result && result.ingredientTable && typeof result.ingredientTable === 'object' ? result.ingredientTable : {};
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    const rowHtml = rows.map((row) => '<tr><td>' + escapeHtml(productDevelopmentOneShotEditableRowLabel(row)) + '</td><td>' + escapeHtml(productDevelopmentOneShotEditableAmountText(row)) + '</td>' + (isPet ? '' : '<td>' + escapeHtml(row && row.dailyValue || '**') + '</td>') + '</tr>').join('');
    const otherIngredients = String(table.otherIngredientsEn || '').trim();
    return '<div class="pfh-product-development-one-shot-preview"><strong>' + escapeHtml(table.title || (isPet ? 'Product Facts' : 'Supplement Facts')) + '</strong><span>Serving Size ' + escapeHtml(table.servingSize || (isPet ? '1 Dropper (1 mL)' : '1 mL')) + ' · Servings Per Container ' + escapeHtml(String(table.servingsPerContainer || 60)) + '</span><table><thead><tr><th>Ingredient</th><th>Amount Per Serving</th>' + (isPet ? '' : '<th>% Daily Value</th>') + '</tr></thead><tbody>' + rowHtml + '</tbody></table>' + (otherIngredients ? '<small>' + (isPet ? 'Inactive Ingredients: ' : 'Other Ingredients: ') + escapeHtml(otherIngredients) + '</small>' : '') + '</div>';
  }

  function productDevelopmentOneShotResultHtml(result) {
    if (!result) {
      return '<div class="pfh-product-development-result-empty">可生成成分表后确认，也可直接读取 PLM 成分表生成文案。</div>';
    }
    const table = result.ingredientTable || {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind);
    const isPet = ingredientKind === 'pet';
    const validation = productDevelopmentOneShotDraftValidation(result);
    const warnings = Array.isArray(result.warnings) ? result.warnings.filter(Boolean).slice(0, 12) : [];
    const warningHtml = warnings.length ? '<div class="pfh-product-development-preview-note"><strong>人工复核提醒</strong><p>' + warnings.map((item) => escapeHtml(item)).join('<br>') + '</p></div>' : '';
    const labeling = result.labeling && typeof result.labeling === 'object' ? result.labeling : {};
    const labelingParts = [
      labeling.directionsEn ? '<p>Directions: ' + escapeHtml(labeling.directionsEn) + '</p>' : '',
      labeling.directionsCn ? '<p>' + escapeHtml(labeling.directionsCn) + '</p>' : '',
      labeling.disclaimerEn ? '<p>FDA disclaimer: ' + escapeHtml(labeling.disclaimerEn) + '</p>' : '',
      labeling.warningsEn ? '<p>' + escapeHtml(labeling.warningsEn) + '</p>' : '',
    ].filter(Boolean);
    const labelingHtml = labelingParts.length
      ? '<div class="pfh-product-development-preview-note"><strong>标签用语</strong>' + labelingParts.join('') + '</div>'
      : '';
    const validationHtml = validation.valid
      ? '<div class="pfh-product-development-one-shot-validation is-valid"><strong>' + (result.content ? '成分表已确认，文案已生成' : '校验通过，请确认成分表后生成文案') + '</strong><span>' + (validation.hasMassAmounts ? '活性合计 ' + escapeHtml(String(validation.activeTotalMg)) + ' mg' : '活性用量按包装标示单位') + (isPet || !validation.hasMassAmounts ? '' : ' · 标准化活性 ' + escapeHtml(String(validation.standardizedActivePercent)) + '%') + '</span></div>'
      : '<div class="pfh-product-development-one-shot-validation is-invalid"><strong>成分表仍需修正，暂不能导出</strong><span>' + validation.errors.map((item) => escapeHtml(item)).join('；') + '</span></div>';
    const footerChecked = !isPet && table.showFooter !== false;
    const copywritingAction = result.content
      ? ''
      : '<button type="button" class="pfh-product-development-one-shot-action-primary" data-action="product-development-copywriting-ingredient-confirm"' + (validation.valid && !state.productDevelopmentOneShotBusy ? '' : ' disabled') + '>' + (state.productDevelopmentOneShotBusy ? '正在生成文案…' : '确认成分表并生成文案') + '</button>';
    return '<section class="pfh-product-development-detail-form pfh-product-development-one-shot-editor"><header><div><small>' + (isPet ? 'PRODUCT FACTS PDF' : 'SUPPLEMENT FACTS PDF') + '</small><h3>编辑成分表草稿</h3></div><span>' + escapeHtml(String(result.snapshot && result.snapshot.englishName || (isPet ? 'Pet Nutrition Support' : 'Daily Wellness Support Drops'))) + '</span></header><div class="pfh-product-development-form-grid">' +
      productDevelopmentOneShotEditorFieldHtml(table, 'title', '标题', 'text', false, true) +
      productDevelopmentOneShotEditorFieldHtml(table, 'servingSize', 'Serving Size', 'text', false, false) +
      productDevelopmentOneShotEditorFieldHtml(table, 'servingsPerContainer', 'Servings Per Container', 'number', false, false) +
      productDevelopmentOneShotEditorFieldHtml(table, 'requiredActiveMg', '活性目标（可选，mg / serving）', 'number', false, false) +
      (isPet ? '' : productDevelopmentOneShotEditorFieldHtml(table, 'requiredStandardizedActivePercent', '标准化活性目标（可选，%）', 'number', false, false)) +
      productDevelopmentOneShotEditorFieldHtml(table, 'otherIngredientsEn', isPet ? 'Inactive Ingredients（可选）' : 'Other Ingredients（可选）', 'text', true, true) +
      productDevelopmentOneShotEditorFieldHtml(table, 'otherIngredientsCn', '其他成分（中文，可选）', 'text', true, true) +
      (isPet ? '' : '<label class="pfh-product-development-check-field"><input type="checkbox" data-product-development-one-shot-editor-field="showFooter"' + (footerChecked ? ' checked' : '') + '><span>显示 “**Daily Value not established.”</span></label>') + '</div><div class="pfh-product-development-one-shot-table-head' + (isPet ? ' is-pet' : '') + '" aria-hidden="true"><span>成分名称 / Ingredient</span><span>用量 / Amount</span>' + (isPet ? '' : '<span>% Daily Value</span><span>标志物 mg</span>') + '<span></span></div><div class="pfh-product-development-review-editor-list">' + productDevelopmentOneShotEditorRowsHtml(result) + '</div><button type="button" class="pfh-product-development-one-shot-add" data-action="product-development-one-shot-ingredient-add"' + (Array.isArray(table.rows) && table.rows.length >= 6 ? ' disabled' : '') + '>＋ 添加成分行（最多 6 行）</button>' + validationHtml.replace('<div class="pfh-product-development-one-shot-validation', '<div data-product-development-one-shot-validation class="pfh-product-development-one-shot-validation') + productDevelopmentOneShotPreviewHtml(result) + labelingHtml + warningHtml + '<div class="pfh-product-development-download-row"><button type="button" class="pfh-product-development-one-shot-action-secondary" data-action="product-development-one-shot-download-pdf"' + (validation.valid ? '' : ' disabled') + '>' + (validation.valid ? (isPet ? '导出 Product Facts PDF' : '导出 Supplement Facts PDF') : '修正后导出 PDF') + '</button>' + copywritingAction + '</div></section>';
  }

  const PRODUCT_DEVELOPMENT_REGULAR_PRODUCT_HINTS = Object.freeze([
    '面霜', '霜', '乳液', '身体乳', '护手霜', '眼霜', '颈霜', '膏', '贴', '贴剂', '凝胶', '啫喱',
    '精华', '面膜', '眼膜', '足膜', '手膜', '喷雾', '洗手', '沐浴', '洗发', '护发', '香水', '香氛',
    '唇膏', '润唇', '口红', '粉底', '爽肤', '化妆水', '精油', '按摩', '防晒', '指甲', '痱子',
    '除臭', '止汗', '祛疣', '祛痘', '痤疮', '湿疹', '癣', '牙膏', '漱口', '湿巾', '擦拭', '私护',
  ]);
  const PRODUCT_DEVELOPMENT_FOOD_PRODUCT_HINTS = Object.freeze([
    '胶囊', '软胶囊', '片剂', '含片', '咀嚼', '软糖', '滴剂', '粉剂', '粉', '茶包', '口服液',
    '冲剂', '饮料', '饮品', '丸', '代餐', '蛋白粉', '鱼油', '益生菌',
  ]);
  const PRODUCT_DEVELOPMENT_REGULAR_HERO_HINTS = Object.freeze([
    'hyaluronic', 'niacinamide', 'retinol', 'salicylic', 'glycolic', 'lactic', 'vitamin', 'collagen',
    'ceramide', 'peptide', 'allantoin', 'aloe', 'tea tree', 'menthol', 'camphor', 'urea', 'panthenol',
    'titanium dioxide', 'zinc oxide', 'lanolin', 'aluminum chloride', 'sodium sulfide', 'glycerin',
    'shea', 'argan', 'jojoba', 'charcoal', 'caffeine', 'biotin', 'keratin', 'arbutin', 'kojic',
    'centella', 'tocopherol', 'ascorbic',
    '玻尿酸', '烟酰胺', '视黄醇', '水杨酸', '果酸', '乳酸', '维生素', '胶原', '神经酰胺', '尿囊素',
    '芦荟', '茶树', '薄荷', '樟脑', '尿素', '泛醇', '二氧化钛', '氧化锌', '羊毛脂', '氯化铝',
    '硫化钠', '甘油', '积雪草', '熊果苷', '咖啡因', '生物素', '角蛋白',
  ]);
  const PRODUCT_DEVELOPMENT_REGULAR_BASE_INGREDIENT_PATTERN = /^(?:purified\s+water|deionized\s+water|aqua|water|纯化水|水|去离子水)$/i;

  function productDevelopmentGuessProductLine(name) {
    const text = String(name === undefined || name === null ? '' : name);
    if (!text.trim()) return 'food';
    let regularScore = 0;
    let foodScore = 0;
    PRODUCT_DEVELOPMENT_REGULAR_PRODUCT_HINTS.forEach((hint) => {
      if (text.includes(hint)) regularScore += 1;
    });
    PRODUCT_DEVELOPMENT_FOOD_PRODUCT_HINTS.forEach((hint) => {
      if (text.includes(hint)) foodScore += 1;
    });
    // 分数相同或都无法识别时保持食品流程，避免改变既有膳食补充产品的默认行为。
    return regularScore > foodScore ? 'regular' : 'food';
  }

  function productDevelopmentRegularDetectName() {
    const sku = getProductDevelopmentCurrentSku();
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku
      ? state.productDevelopmentSnapshot
      : null;
    const task = state.productDevelopmentSelectedTask && typeof state.productDevelopmentSelectedTask === 'object'
      ? state.productDevelopmentSelectedTask
      : {};
    const input = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
      ? state.productDevelopmentOneShotInput
      : {};
    return String(input.nameCn || (snapshot && snapshot.name) || task.name || task.productName || '');
  }

  function productDevelopmentEffectiveProductLine() {
    const input = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
      ? state.productDevelopmentOneShotInput
      : {};
    const manual = String(input.productLine || '').trim();
    if (manual === 'food' || manual === 'regular') return manual;
    return productDevelopmentGuessProductLine(productDevelopmentRegularDetectName());
  }

  function productDevelopmentEffectiveRegularNdcKind() {
    const input = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
      ? state.productDevelopmentOneShotInput
      : {};
    return String(input.regularNdcKind || '').trim() === 'ndc' ? 'ndc' : 'non-ndc';
  }

  function productDevelopmentParseRegularIngredientText(value) {
    const text = String(value === undefined || value === null ? '' : value).replace(/\u00a0/g, ' ');
    if (!text.trim()) return [];
    const seen = new Set();
    const pairs = [];
    // 保护 "1,2-HEXANEDIOL" 等成分名内部的数字逗号，避免被分隔符误拆。
    const COMMA_PLACEHOLDER = '\u0001';
    const protectedText = text.replace(/(\d),(\d)/g, '$1' + COMMA_PLACEHOLDER + '$2');
    protectedText.split(/[\n\r;；,，、]+/).map((token) => token.trim()).filter(Boolean)
      // PDF/表格粘贴常见“同一行多个成分”或“成分与占比分开两列”，按多空格/制表符再拆一次。
      .flatMap((token) => token.split(/\t|\s{2,}/)).map((token) => token.trim()).filter(Boolean)
      .forEach((rawToken) => {
      if (pairs.length >= 80) return;
      const token = rawToken.replace(new RegExp(COMMA_PLACEHOLDER, 'g'), ',');
      // 剥离句尾占比（如 "AQUA 84.77"、"GLYCERIN 8%"、"MINERAL OIL 5.0 %"），成分名内部数字不受影响。
      const cleaned = token.replace(/\s+\d+(?:\.\d+)?\s*%?$/, '').trim();
      // 纯数字/百分号（表格粘贴时占比常被多空格拆成独立 token）不是成分，跳过。
      if (!cleaned || /^[\d.,\s%]+$/.test(cleaned)) return;
      // 中文名允许 “1,2-己二醇”“维生素B5” 这类数字/连字符前后缀，避免只留汉字丢掉编号。
      const cnParts = cleaned.match(/[\d.,，\-]*[\u3400-\u9fff][\u3400-\u9fff\d\s·（）()，,\-]*[\u3400-\u9fff\d）)]|[\u3400-\u9fff]/g) || [];
      const cn = cnParts.join('').replace(/\s+/g, '').replace(/^[\s.,，\-]+|[\s.,，\-]+$/g, '').trim().slice(0, 300);
      const en = cleaned.replace(/[\u3400-\u9fff][\u3400-\u9fff\s·（）()\-]*/g, ' ')
        // 逗号在此处只会出现在数字之间（如 1,2-HEXANEDIOL，分隔用逗号已在拆分阶段处理）。
        .replace(/[^A-Za-z0-9\s.'\-(),]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);
      if (!en && !cn) return;
      const key = productDevelopmentNormalizedClaimText(en || cn);
      if (!key || seen.has(key)) return;
      seen.add(key);
      pairs.push({ en, cn });
    });
    return pairs;
  }

  function productDevelopmentRegularHeroIngredients(pairs) {
    const source = Array.isArray(pairs) ? pairs.filter((pair) => pair && (pair.en || pair.cn)) : [];
    if (source.length <= 4) return source.slice();
    const scored = source.map((pair, index) => {
      const haystack = (pair.en + ' ' + pair.cn).toLowerCase();
      const hero = PRODUCT_DEVELOPMENT_REGULAR_HERO_HINTS.some((hint) => haystack.includes(hint.toLowerCase()));
      const base = PRODUCT_DEVELOPMENT_REGULAR_BASE_INGREDIENT_PATTERN.test(pair.en.trim())
        || /^(?:水|纯化水|去离子水)$/.test(pair.cn.trim());
      return { pair, index, hero, base };
    });
    const preferred = scored.filter((item) => item.hero && !item.base);
    const ordinary = scored.filter((item) => !item.hero && !item.base && !preferred.includes(item));
    const bases = scored.filter((item) => item.base && !preferred.includes(item) && !ordinary.includes(item));
    const selected = preferred.concat(ordinary).slice(0, 4);
    while (selected.length < 3 && bases.length) selected.push(bases.shift());
    return selected.sort((a, b) => a.index - b.index).map((item) => item.pair);
  }

  function productDevelopmentRegularCopywritingTemplateIdForKind(ndcKind) {
    return ndcKind === 'ndc' ? 'regular-ndc' : 'regular-non-ndc';
  }

  function productDevelopmentIsRegularCopywritingTemplateId(id) {
    return id === 'regular-ndc' || id === 'regular-non-ndc';
  }

  function productDevelopmentSyncRegularCopywritingTemplate() {
    const line = productDevelopmentEffectiveProductLine();
    const currentId = String(state.productDevelopmentCopywritingTemplateId || '').trim();
    if (currentId === 'local' && state.productDevelopmentTemplateBase64) return;
    if (line === 'regular') {
      const targetId = productDevelopmentRegularCopywritingTemplateIdForKind(productDevelopmentEffectiveRegularNdcKind());
      if (currentId !== targetId) {
        try {
          selectProductDevelopmentCopywritingTemplate(targetId);
        } catch (_) {
          state.productDevelopmentCopywritingTemplateId = targetId;
        }
        showToast('已切换到“' + (targetId === 'regular-ndc' ? '常规涉NDC' : '常规非NDC') + '”文案模板');
      }
      return;
    }
    if (productDevelopmentIsRegularCopywritingTemplateId(currentId)) {
      try {
        selectProductDevelopmentCopywritingTemplate(PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID);
      } catch (_) {
        state.productDevelopmentCopywritingTemplateId = PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID;
      }
      showToast('已切换回食品文案模板');
    }
  }

  function productDevelopmentOneShotEmbeddedHtml(sku) {
    const input = productDevelopmentOneShotInputForRender();
    const isRegularProductLine = productDevelopmentEffectiveProductLine() === 'regular';
    const template = isRegularProductLine ? null : productDevelopmentOneShotIngredientTemplate();
    const isPet = normalizeProductDevelopmentIngredientKind(template && template.kind) === 'pet';
    const busy = Boolean(state.productDevelopmentOneShotBusy || state.productDevelopmentCopywritingBusy);
    const result = state.productDevelopmentOneShotResult && (!sku || state.productDevelopmentOneShotResult.sku === sku)
      ? state.productDevelopmentOneShotResult
      : null;
    const copywritingState = state.productDevelopmentCopywriting;
    if (isRegularProductLine) {
      // 常规产品（非食品）：无需成分表，跳过成分表生成，直接由用户成分生成 文案。
      const isNdc = productDevelopmentEffectiveRegularNdcKind() === 'ndc';
      const configHtml = '<section class="pfh-cw-ingredients"><header><h3>成分输入</h3><span>来源：手动输入</span></header><p>英文支持逗号或换行分隔，可带占比；中文用于对照。</p>' +
        productDevelopmentCopywritingIngredientPairHtml(input, 'regularIngredientsEn', 'regularIngredientsCn', isNdc ? '活性成分' : '') +
        (isNdc ? productDevelopmentCopywritingIngredientPairHtml(input, 'regularIngredientsInactiveEn', 'regularIngredientsInactiveCn', '非活性成分') : '') + '</section>';
      const actionLabel = state.productDevelopmentCopywritingBusy ? '正在生成文案…' : copywritingState && copywritingState.sku === sku && copywritingState.content ? '重新生成文案' : '生成文案';
      return '<section class="pfh-cw-form"><fieldset class="pfh-cw-fields"' + (busy ? ' disabled' : '') + '>' + productDevelopmentOneShotSelectedSourceHtml(sku) + '<div class="pfh-cw-compose">' + configHtml + '<div class="pfh-cw-actions"><button type="button" data-action="product-development-copywriting-regular-run"' + (busy || !sku ? ' disabled' : '') + '>' + actionLabel + '</button>' + productDevelopmentCopywritingDownloadButtonHtml(sku) + '</div></div></fieldset></section>';
    }
    const configHtml = result ? '' : '<div class="pfh-product-development-one-shot-inputs">' +
      productDevelopmentOneShotFieldHtml(input, 'netContent', '净含量', 'text') +
      productDevelopmentOneShotFieldHtml(input, 'servingSize', '每份用量', 'text') +
      productDevelopmentOneShotFieldHtml(input, 'servingsPerContainer', '每瓶份数', 'number') +
      productDevelopmentOneShotFieldHtml(input, 'targetActiveMg', '每份活性目标（可选，mg）', 'number') +
      (isPet ? '' : productDevelopmentOneShotFieldHtml(input, 'targetActivePercent', '标准化活性目标（可选，%）', 'number')) +
      '<div class="pfh-cw-pair-wrap">' + productDevelopmentCopywritingIngredientPairHtml(input, 'otherIngredientsEn', 'otherIngredientsCn', isPet ? '非活性成分（可选）' : '其他成分（可选）') + '</div>' +
      '</div>';
    return '<section class="pfh-cw-form"><fieldset class="pfh-cw-fields"' + (busy ? ' disabled' : '') + '>' + productDevelopmentOneShotSelectedSourceHtml(sku) + '<div class="pfh-cw-compose"><section class="pfh-cw-ingredients"><header><h3>成分与用量</h3><span>生成后确认成分表，或直接读取 PLM</span></header>' + configHtml + '</section><div class="pfh-cw-actions"><button type="button" data-action="product-development-copywriting-ingredient-run"' + (busy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentOneShotBusy ? '正在处理…' : result ? '重新生成成分表' : '生成成分表') + '</button><button type="button" class="is-secondary" data-action="product-development-copywriting-run"' + (busy || !sku ? ' disabled' : '') + '>读取 PLM 成分表生成文案</button>' + productDevelopmentCopywritingDownloadButtonHtml(sku) + '</div></div></fieldset></section>' + productDevelopmentOneShotResultHtml(result);
  }

  function productDevelopmentOneShotUpdateInlineValidation() {
    const result = state.productDevelopmentOneShotResult;
    if (!result || !result.ingredientTable) return;
    const validation = productDevelopmentOneShotDraftValidation(result);
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind);
    const isPet = ingredientKind === 'pet';
    const root = document.querySelector('#plm-floating-helper .pfh-product-development-one-shot-editor');
    if (!root) return;
    const validationNode = root.querySelector('[data-product-development-one-shot-validation]');
    const pdfButton = root.querySelector('[data-action="product-development-one-shot-download-pdf"]');
    const copywritingButton = root.querySelector('[data-action="product-development-copywriting-ingredient-confirm"]');
    if (validationNode) {
      validationNode.className = 'pfh-product-development-one-shot-validation ' + (validation.valid ? 'is-valid' : 'is-invalid');
      validationNode.innerHTML = validation.valid
        ? '<strong>' + (result.content ? '成分表已确认，文案已生成' : '校验通过，请确认成分表后生成文案') + '</strong><span>' + (validation.hasMassAmounts ? '活性合计 ' + escapeHtml(String(validation.activeTotalMg)) + ' mg' : '活性用量按包装标示单位') + (isPet || !validation.hasMassAmounts ? '' : ' · 标准化活性 ' + escapeHtml(String(validation.standardizedActivePercent)) + '%') + '</span>'
        : '<strong>成分表仍需修正，暂不能导出</strong><span>' + validation.errors.map((item) => escapeHtml(item)).join('；') + '</span>';
    }
    if (pdfButton) {
      pdfButton.disabled = !validation.valid;
      pdfButton.textContent = validation.valid ? (isPet ? '导出 Product Facts PDF' : '导出 Supplement Facts PDF') : '修正后导出 PDF';
    }
    if (copywritingButton) {
      copywritingButton.disabled = !validation.valid || Boolean(state.productDevelopmentOneShotBusy) || Boolean(result.content);
      copywritingButton.textContent = state.productDevelopmentOneShotBusy ? '正在生成文案…' : result.content ? '文案 DOCX 已生成' : '确认成分表并生成文案';
    }
  }

  function productDevelopmentHandleOneShotEditorInput(target) {
    const field = String(target && target.getAttribute('data-product-development-one-shot-editor-field') || '').trim();
    const rowIndexText = String(target && target.getAttribute('data-product-development-one-shot-row-index') || '').trim();
    if (!field && !rowIndexText) return false;
    const value = target && target.type === 'checkbox' ? Boolean(target.checked) : String(target && target.value || '').slice(0, field === 'otherIngredientsEn' ? 1600 : field === 'otherIngredientsCn' ? 1200 : field === 'labelEn' ? 600 : 600);
    const result = state.productDevelopmentOneShotResult;
    const hadCopywriting = Boolean(result && result.content);
    if (rowIndexText) {
      const rowIndex = Number(rowIndexText);
      const rows = result && result.ingredientTable && Array.isArray(result.ingredientTable.rows) ? result.ingredientTable.rows : null;
      const row = rows && Number.isInteger(rowIndex) ? rows[rowIndex] : null;
      if (!row || !field) return true;
      row[field] = value;
      if (field === 'amountText') {
        const parsedAmount = productDevelopmentOneShotParseAmount(value);
        row.amountValue = parsedAmount.valid ? parsedAmount.value : 0;
        row.amountUnit = parsedAmount.valid ? parsedAmount.unit : '';
        row.amountMg = parsedAmount.valid && parsedAmount.isMass ? parsedAmount.massMg : 0;
      }
      if (field === 'markerActiveMg') {
        const markerMg = productDevelopmentOneShotMarkerToMg(value);
        row.markerActiveMg = Number.isFinite(markerMg) ? markerMg : value;
      }
      if (field === 'dailyValue' && !String(value).trim()) row.dailyValue = '**';
    } else {
      const table = result && result.ingredientTable && typeof result.ingredientTable === 'object' ? result.ingredientTable : null;
      if (table) table[field] = value;
      const inputKey = {
        requiredActiveMg: 'targetActiveMg',
        requiredStandardizedActivePercent: 'targetActivePercent',
      }[field] || field;
      if (Object.prototype.hasOwnProperty.call(PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT, inputKey)) {
        if (!state.productDevelopmentOneShotInput || typeof state.productDevelopmentOneShotInput !== 'object') state.productDevelopmentOneShotInput = productDevelopmentOneShotLoadDraft();
        state.productDevelopmentOneShotInput[inputKey] = String(value === true || value === false ? value : value || '');
        if (inputKey === 'targetActiveMg' || inputKey === 'targetActivePercent') {
          state.productDevelopmentOneShotInput[inputKey + 'Explicit'] = String(value || '').trim() ? 'true' : 'false';
        }
        saveProductDevelopmentOneShotDraft(state.productDevelopmentOneShotInput);
      }
    }
    if (result) {
      if (hadCopywriting) {
        result.content = null;
        result.docxBlob = null;
        result.stage = 'ingredient';
        result.ingredientConfirmed = false;
        result.snapshot.ingredientTable = result.ingredientTable;
        state.productDevelopmentOneShotIngredientConfirmed = false;
        if (state.productDevelopmentCopywriting && String(state.productDevelopmentCopywriting.id || '').startsWith('pd-one-shot-')) state.productDevelopmentCopywriting = null;
        state.productDevelopmentStatus = '成分表已修改，请重新确认后生成文案';
      }
      productDevelopmentOneShotApplyDraftMetrics(result);
      productDevelopmentOneShotUpdateInlineValidation();
    }
    return true;
  }

  function productDevelopmentCopywritingIngredientPairHtml(input, enKey, cnKey, title) {
    const enCount = productDevelopmentParseRegularIngredientText(input[enKey]).length;
    const cnCount = productDevelopmentParseRegularIngredientText(input[cnKey]).length;
    return '<div class="pfh-cw-ingredient-group" data-cw-en="' + enKey + '" data-cw-cn="' + cnKey + '">' + (title ? '<h4>' + escapeHtml(title) + '</h4>' : '') + '<div class="pfh-cw-pair">' +
      productDevelopmentOneShotFieldHtml(input, enKey, enKey === 'otherIngredientsEn' ? '英文成分（可选）' : title ? '英文成分' : '英文成分 · 必填', 'text', true, false) +
      productDevelopmentOneShotFieldHtml(input, cnKey, '中文成分（可选）', 'text', true, false) + '</div><p class="pfh-cw-count' + (cnCount && enCount !== cnCount ? ' is-warning' : '') + '" data-cw-ingredient-count>' + productDevelopmentCopywritingIngredientCountText(enCount, cnCount) + '</p></div>';
  }

  function productDevelopmentCopywritingIngredientCountText(en, cn) {
    return '英文已识别 ' + en + ' 项 · 中文已识别 ' + cn + ' 项' + (cn && en !== cn ? '；数量不一致，请核对中英文对应关系' : '');
  }

  function productDevelopmentCopywritingMarkDirty() {
    const result = state.productDevelopmentCopywriting;
    if (!result || result.sku !== getProductDevelopmentCurrentSku() || !result.content) return;
    state.productDevelopmentCopywritingDirtySku = result.sku;
    const node = document.querySelector('#' + PANEL_ID + ' [data-cw-result-status]');
    if (node) node.textContent = '输入已修改；下载时更新名称和成分，其他文案保留';
  }

  function productDevelopmentCopywritingUpdateIngredientCounts(root) {
    const host = root || document.getElementById(PANEL_ID);
    if (!host) return;
    host.querySelectorAll('[data-cw-ingredient-count]').forEach((node) => {
      const group = node.closest('[data-cw-en]');
      const input = state.productDevelopmentOneShotInput || {};
      const en = productDevelopmentParseRegularIngredientText(input[group.getAttribute('data-cw-en')]).length;
      const cn = productDevelopmentParseRegularIngredientText(input[group.getAttribute('data-cw-cn')]).length;
      node.textContent = productDevelopmentCopywritingIngredientCountText(en, cn);
      node.classList.toggle('is-warning', Boolean(cn && en !== cn));
    });
  }

  function productDevelopmentCopywritingAlignTemplate() {
    const current = resolveProductDevelopmentCopywritingTemplate();
    if (current.local) return current;
    const regular = productDevelopmentEffectiveProductLine() === 'regular';
    const target = regular ? productDevelopmentRegularCopywritingTemplateIdForKind(productDevelopmentEffectiveRegularNdcKind()) : PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID;
    if ((regular && current.id !== target) || (!regular && productDevelopmentIsRegularCopywritingTemplateId(current.id))) {
      saveProductDevelopmentCopywritingTemplateId(target);
    }
    return resolveProductDevelopmentCopywritingTemplate();
  }

  function productDevelopmentCopywritingToolbarHtml() {
    const template = productDevelopmentCopywritingAlignTemplate();
    const regular = productDevelopmentEffectiveProductLine() === 'regular';
    const templateOptions = productDevelopmentCopywritingBuiltinTemplates()
      .filter((item) => regular ? item.id === productDevelopmentRegularCopywritingTemplateIdForKind(productDevelopmentEffectiveRegularNdcKind()) : !productDevelopmentIsRegularCopywritingTemplateId(item.id))
      .map((item) => '<option value="' + escapeHtml(item.id) + '"' + (item.id === template.id ? ' selected' : '') + '>' + escapeHtml(item.label + '文案模板') + '</option>')
      .concat(state.productDevelopmentTemplateBase64 ? ['<option value="local"' + (template.local ? ' selected' : '') + '>本地自定义模板</option>'] : []).join('');
    const moreItems = '<button type="button" role="menuitem" data-action="product-development-template-import">导入 DOCX 模板</button>' +
      '<button type="button" role="menuitem" data-action="product-development-template-reset"' + (state.productDevelopmentTemplateBase64 ? '' : ' disabled') + '>恢复内置模板</button>';
    return '<div class="pfh-cw-template-row"><label class="pfh-product-development-material-field"><span>文案模板</span><select class="pfh-product-development-copywriting-template-input" aria-label="选择文案模板">' + templateOptions + '</select></label><div class="pfh-cw-tools"><button type="button" class="pfh-cw-tools-toggle" data-action="product-development-copywriting-more" aria-expanded="false" aria-controls="pfh-cw-template-menu" aria-haspopup="menu">模板工具</button><div class="pfh-cw-tools-menu" id="pfh-cw-template-menu" role="menu" aria-label="模板工具">' + moreItems + '</div></div><input hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="pfh-product-development-template-input"><p>来源：' + (template.local ? '本地自定义模板' : '内置模板 · 根据产品线' + (regular ? '和 NDC 类型' : '及所选剂型') + '匹配') + '</p></div>';
  }

  let productDevelopmentCopywritingProgressTimer = 0;

  function productDevelopmentCopywritingSetToolsOpen(tools, open) {
    tools.classList.toggle('is-open', open);
    const toggle = tools.querySelector('.pfh-cw-tools-toggle');
    toggle.setAttribute('aria-expanded', String(open));
    document.removeEventListener('pointerdown', productDevelopmentCopywritingDismissTools, true);
    if (open) document.addEventListener('pointerdown', productDevelopmentCopywritingDismissTools, true);
  }

  function productDevelopmentCopywritingDismissTools(event) {
    const tools = document.querySelector('#' + PANEL_ID + ' .pfh-cw-tools.is-open');
    if (!tools) {
      document.removeEventListener('pointerdown', productDevelopmentCopywritingDismissTools, true);
      return;
    }
    if (!tools.contains(event.target)) productDevelopmentCopywritingSetToolsOpen(tools, false);
  }

  function productDevelopmentCopywritingHandleToolsKeydown(event) {
    const tools = event.target && event.target.closest && event.target.closest('.pfh-cw-tools');
    if (!tools) return false;
    if (event.key === 'Escape') {
      productDevelopmentCopywritingSetToolsOpen(tools, false);
      tools.querySelector('.pfh-cw-tools-toggle').focus();
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    if (event.key === 'Tab') {
      setTimeout(() => { if (!tools.contains(document.activeElement)) productDevelopmentCopywritingSetToolsOpen(tools, false); }, 0);
      return false;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return false;
    productDevelopmentCopywritingSetToolsOpen(tools, true);
    const items = Array.from(tools.querySelectorAll('[role="menuitem"]:not(:disabled)'));
    if (!items.length) return false;
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index < 0 ? (event.key === 'ArrowDown' ? 0 : items.length - 1) : event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next].focus();
    event.preventDefault();
    return true;
  }

  function productDevelopmentCopywritingProgressStart(sku, stages) {
    clearTimeout(productDevelopmentCopywritingProgressTimer);
    state.productDevelopmentCopywritingProgress = { sku, stages, index: 0, status: 'running', startedAt: Date.now(), endedAt: 0, error: '' };
    productDevelopmentCopywritingProgressTick();
  }

  function productDevelopmentCopywritingProgressStage(index) {
    const progress = state.productDevelopmentCopywritingProgress;
    if (!progress || progress.status !== 'running') return;
    progress.index = index;
    productDevelopmentCopywritingProgressUpdate();
  }

  function productDevelopmentCopywritingProgressEnd(error) {
    const progress = state.productDevelopmentCopywritingProgress;
    if (!progress) return;
    progress.status = error ? 'error' : 'complete';
    progress.error = error ? formatErrorMessage(error) : '';
    progress.endedAt = Date.now();
    if (!error && progress.stages[progress.stages.length - 1] === '生成 DOCX') state.productDevelopmentCopywritingDirtySku = '';
    clearTimeout(productDevelopmentCopywritingProgressTimer);
    productDevelopmentCopywritingProgressUpdate();
  }

  function productDevelopmentCopywritingProgressHtml() {
    const progress = state.productDevelopmentCopywritingProgress;
    if (!progress || progress.sku !== getProductDevelopmentCurrentSku()) return '';
    const seconds = Math.max(0, Math.floor(((progress.endedAt || Date.now()) - progress.startedAt) / 1000));
    const elapsed = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    const label = progress.status === 'complete' ? '已完成' : progress.status === 'error' ? '失败：' + progress.stages[progress.index] : progress.stages[progress.index];
    return '<header><h3>生成进度</h3><span data-cw-elapsed>已用时 ' + elapsed + '</span></header><ol>' + progress.stages.map((item, index) => {
      const status = progress.status === 'complete' || index < progress.index ? 'complete' : index === progress.index ? progress.status : 'pending';
      return '<li class="is-' + status + '"' + (index === progress.index && progress.status === 'running' ? ' aria-current="step"' : '') + '><span class="pfh-cw-step-icon" aria-hidden="true"><i></i></span>' + escapeHtml(item) + '</li>';
    }).join('') + '</ol><p role="status">' + escapeHtml(label) + (progress.status === 'running' ? '…' : '') + '</p>' + (progress.error ? '<p class="pfh-cw-progress-error">' + escapeHtml(progress.error) + '。输入与已有结果已保留，可重新生成。</p>' : '');
  }

  function productDevelopmentCopywritingProgressUpdate() {
    const node = document.querySelector('#' + PANEL_ID + ' [data-cw-progress]');
    if (!node) return;
    node.innerHTML = productDevelopmentCopywritingProgressHtml();
    node.hidden = !node.innerHTML;
  }

  function productDevelopmentCopywritingProgressTick() {
    const progress = state.productDevelopmentCopywritingProgress;
    const node = document.querySelector('#' + PANEL_ID + ' [data-cw-elapsed]');
    if (node && progress && progress.sku === getProductDevelopmentCurrentSku()) {
      const seconds = Math.max(0, Math.floor(((progress.endedAt || Date.now()) - progress.startedAt) / 1000));
      node.textContent = '已用时 ' + String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    }
    if (progress && progress.status === 'running') {
      productDevelopmentCopywritingProgressTimer = setTimeout(productDevelopmentCopywritingProgressTick, 1000);
    }
  }

  function productDevelopmentCopywritingResultHeaderHtml(result, content) {
    if (!content) return '';
    return '<header class="pfh-cw-result-head"><div><h3>文案结果</h3><p data-cw-result-status>' + escapeHtml(state.productDevelopmentCopywritingDirtySku === getProductDevelopmentCurrentSku() ? '输入已修改；下载时更新名称和成分，其他文案保留' : result && (result.partialUpdateWarning || result.templateLabel) || '当前模板') + '</p></div><div><button type="button" data-action="product-development-copywriting-copy">复制全文</button></div></header>';
  }

  function productDevelopmentCopywritingDownloadButtonHtml(sku) {
    const result = state.productDevelopmentCopywriting;
    const ready = Boolean(result && result.content && result.sku === sku && !state.productDevelopmentOneShotBusy && !state.productDevelopmentCopywritingBusy);
    return '<button type="button" class="pfh-cw-download' + (ready ? ' is-ready' : '') + '" data-action="product-development-copywriting-download"' + (ready ? '' : ' disabled') + '>更新并下载文案</button>';
  }

  function productDevelopmentCopywritingHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const currentResult = state.productDevelopmentCopywriting;
    if ((!currentResult || currentResult.sku !== sku) && sku) restoreProductDevelopmentCopywritingCache(sku);
    const result = state.productDevelopmentCopywriting;
    const content = result && result.sku === sku ? result.content : null;
    const displayError = state.productDevelopmentError || '';
    return '<div class="pfh-product-development pfh-product-development-subview pfh-cw-workspace">' +
      '<header class="pfh-product-development-subview-head"><button type="button" class="pfh-upload-back" data-action="product-development-home" aria-label="返回产品开发主页">' + iconHtml('backArrow') + '</button><strong>生成双语文案</strong></header>' +
      productDevelopmentOneShotEmbeddedHtml(sku) +
      '<section class="pfh-cw-progress" data-cw-progress' + (productDevelopmentCopywritingProgressHtml() ? '' : ' hidden') + '>' + productDevelopmentCopywritingProgressHtml() + '</section>' +
      (state.productDevelopmentStatus && !state.productDevelopmentOneShotBusy && !state.productDevelopmentCopywritingBusy ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (displayError ? '<p class="pfh-product-development-error">' + escapeHtml(displayError) + '</p>' : '') +
      productDevelopmentCopywritingResultHeaderHtml(result, content) +
      productDevelopmentCopywritingPreviewHtml(content) +
      '</div>';
  }

  function productDevelopmentOneShotSyncDraftSku(sku) {
    const current = String(sku || getProductDevelopmentCurrentSku() || '').trim().toUpperCase();
    const draft = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
      ? state.productDevelopmentOneShotInput
      : productDevelopmentOneShotLoadDraft();
    const draftSku = String(draft.sku || '').trim().toUpperCase();
    if (!current || draftSku === current) return draft;
    if (draftSku) saveProductDevelopmentOneShotDraft(draft);
    state.productDevelopmentOneShotInput = saveProductDevelopmentOneShotDraft(productDevelopmentOneShotLoadDraft(current));
    return state.productDevelopmentOneShotInput;
  }

  function productDevelopmentOneShotInputForRender() {
    productDevelopmentOneShotSyncDraftSku();
    const template = productDevelopmentOneShotIngredientTemplate();
    const input = productDevelopmentOneShotApplyTemplateDefaults(
      state.productDevelopmentOneShotInput,
      template,
      state.productDevelopmentIngredientSheetName,
      { force: false },
    );
    state.productDevelopmentOneShotInput = input;
    return input;
  }

  function productDevelopmentOneShotRounded(value, digits) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    const factor = 10 ** Math.max(0, Math.min(6, Number(digits) || 3));
    return Math.round(number * factor) / factor;
  }

  function productDevelopmentOneShotFormatAmount(value) {
    const amount = Number(value) || 0;
    const rounded = productDevelopmentOneShotRounded(amount, 3);
    const text = String(rounded).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    return amount > 0 && amount < 1 ? text + ' mcg' : text + ' mg';
  }

  function productDevelopmentOneShotParseAmount(value) {
    const source = String(value === undefined || value === null ? '' : value)
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const match = source.match(/^(-?\d[\d,]*(?:\.\d+)?)\s*(mg|mcg|μg|µg|ug|g|kg|ml|l|fu|gdu|du|iu|cfu|kcal|usp|units?|cu|au|pu|te)?\b/i);
    if (!match) return { valid: false, value: NaN, unit: '', amountText: '', massMg: NaN, isMass: false };
    const amount = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) return { valid: false, value: amount, unit: '', amountText: '', massMg: NaN, isMass: false };
    const rawUnit = String(match[2] || 'mg').toLowerCase();
    const unit = rawUnit === 'mg' || rawUnit === 'mcg' || rawUnit === 'g' || rawUnit === 'kg' ? rawUnit : rawUnit === 'μg' || rawUnit === 'µg' || rawUnit === 'ug' ? 'mcg' : rawUnit === 'ml' ? 'mL' : rawUnit === 'l' ? 'L' : rawUnit === 'units' || rawUnit === 'unit' ? 'units' : rawUnit.toUpperCase();
    const isMass = ['mg', 'mcg', 'g', 'kg'].includes(rawUnit);
    const massMg = !isMass
      ? NaN
      : rawUnit === 'kg'
        ? amount * 1000000
        : rawUnit === 'g'
          ? amount * 1000
          : rawUnit === 'mcg' || rawUnit === 'μg' || rawUnit === 'µg' || rawUnit === 'ug'
            ? amount / 1000
            : amount;
    const amountText = match[2]
      ? source.replace(/\s+(?:per|each)\s+(?:serving|dose|day)\b.*$/i, '').trim().slice(0, 80)
      : match[1].replace(/,/g, '') + ' mg';
    return { valid: true, value: amount, unit, amountText, massMg, isMass };
  }

  function productDevelopmentOneShotHasMeasuredAmount(value) {
    return productDevelopmentOneShotParseAmount(value).valid;
  }

  function productDevelopmentOneShotFrontFacts(value) {
    const source = String(value === undefined || value === null ? '' : value)
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const potencyClaims = [];
    const potencyPattern = /\b\d[\d,]*(?:\.\d+)?\s*(?:FU|GDU|DU|IU|CFU|KCAL|USP)\b(?:\s*(?:per|each|\/)\s*(?:serving|dose|day))?/gi;
    let potencyMatch;
    while ((potencyMatch = potencyPattern.exec(source))) {
      const parsed = productDevelopmentOneShotParseAmount(potencyMatch[0]);
      if (parsed.valid && !parsed.isMass) potencyClaims.push({
        amountText: parsed.amountText,
        value: parsed.value,
        unit: parsed.unit,
      });
    }
    const amountClaims = [];
    const amountPattern = /\b\d[\d,]*(?:\.\d+)?\s*(?:mg|mcg|μg|µg|ug|g|kg|FU|GDU|DU|IU|CFU|KCAL|USP)\b(?:\s*(?:per|each|\/)\s*(?:serving|dose|day))?/gi;
    let amountMatch;
    while ((amountMatch = amountPattern.exec(source))) {
      const parsed = productDevelopmentOneShotParseAmount(amountMatch[0]);
      if (parsed.valid) amountClaims.push({
        amountText: parsed.amountText,
        value: parsed.value,
        unit: parsed.unit,
        isMass: parsed.isMass,
      });
    }
    const unitPattern = '(capsules?|soft\\s*gel(?:s)?|tablets?|gummies?|soft\\s*chews?|chews?|sachets?|drops?)';
    const canonicalUnit = (value) => {
      const unit = String(value || '').toLowerCase().replace(/\s+/g, ' ');
      if (/capsule/.test(unit)) return 'Capsules';
      if (/soft\s*gel/.test(unit)) return 'Softgels';
      if (/tablet/.test(unit)) return 'Tablets';
      if (/gumm/.test(unit)) return 'Gummies';
      if (/soft\s*chew/.test(unit)) return 'Soft Chews';
      if (/chew/.test(unit)) return 'Chews';
      if (/sachet/.test(unit)) return 'Sachets';
      return 'Drops';
    };
    const formatCount = (value) => productDevelopmentOneShotFormatNumber(Number(value));
    const packMatch = source.match(new RegExp('\\b(\\d[\\d,]*)\\s*' + unitPattern + '\\b', 'i'));
    const packCount = packMatch ? Number(String(packMatch[1]).replace(/,/g, '')) : 0;
    const packUnit = packMatch ? canonicalUnit(packMatch[2]) : '';
    const supplyMatch = source.match(/\b(\d+)\s*[- ]?day(?:s)?(?:\s+supply)?\b/i);
    const supplyDays = supplyMatch ? Number(supplyMatch[1]) : 0;
    const servingSizeMatch = source.match(new RegExp('\\bserving\\s+size\\s*[:：-]?\\s*(\\d+(?:\\.\\d+)?)\\s*' + unitPattern + '\\b', 'i'))
      || source.match(new RegExp('\\b(?:active\\s+ingredients?|ingredients?)\\s+per\\s*[:：-]?\\s*(\\d+(?:\\.\\d+)?)\\s*' + unitPattern + '\\b', 'i'))
      || source.match(new RegExp('\\b(\\d+(?:\\.\\d+)?)\\s*' + unitPattern + '\\s*(?:per|each|/)\\s*serving\\b', 'i'));
    const explicitServingCount = servingSizeMatch ? Number(servingSizeMatch[1]) : 0;
    const explicitServingUnit = servingSizeMatch ? canonicalUnit(servingSizeMatch[2]) : '';
    const servingsPerContainerMatch = source.match(/\bserv(?:ing|ings)\s+per\s+container\s*[:：-]?\s*(\d+)\b/i);
    let servingsPerContainer = servingsPerContainerMatch ? Number(servingsPerContainerMatch[1]) : 0;
    if (!servingsPerContainer && supplyDays > 0) servingsPerContainer = supplyDays;
    if (!servingsPerContainer && packCount > 0 && explicitServingCount > 0 && packCount % explicitServingCount === 0) servingsPerContainer = packCount / explicitServingCount;
    let servingSize = explicitServingCount > 0 && explicitServingUnit
      ? formatCount(explicitServingCount) + ' ' + explicitServingUnit
      : '';
    if (!servingSize && packCount > 0 && servingsPerContainer > 0 && packCount % servingsPerContainer === 0) servingSize = formatCount(packCount / servingsPerContainer) + ' ' + packUnit;
    return {
      potencyClaims,
      amountClaims,
      servingSize,
      servingsPerContainer: servingsPerContainer > 0 ? Math.max(1, Math.min(365, Math.round(servingsPerContainer))) : 0,
      packCount,
      packUnit,
      supplyDays,
    };
  }

  function productDevelopmentOneShotFrontCopyRows(rows, sourcePlainTextCopy) {
    const facts = productDevelopmentOneShotFrontFacts(sourcePlainTextCopy);
    const sourceKey = productDevelopmentNormalizedClaimText(sourcePlainTextCopy);
    if (!sourceKey || facts.amountClaims.length !== 1 || !Array.isArray(rows) || rows.length <= 1) return rows;
    const matched = rows.filter((row) => {
      const nameKey = productDevelopmentNormalizedClaimText(row && row.nameEn);
      return nameKey.length >= 5 && sourceKey.includes(nameKey);
    });
    if (matched.length === 1) return matched;
    const claimKey = productDevelopmentNormalizedClaimText(facts.amountClaims[0] && facts.amountClaims[0].amountText);
    const claimIndex = claimKey ? sourceKey.indexOf(claimKey) : -1;
    const ranked = matched.map((row) => {
      const nameKey = productDevelopmentNormalizedClaimText(row && row.nameEn);
      const nameIndex = nameKey && claimIndex >= 0 ? sourceKey.lastIndexOf(nameKey, claimIndex) : -1;
      return { row, distance: nameIndex >= 0 && claimIndex >= 0 ? claimIndex - nameIndex : Number.MAX_SAFE_INTEGER };
    }).sort((a, b) => a.distance - b.distance);
    return ranked.length > 1 && ranked[0].distance + 12 < ranked[1].distance ? [ranked[0].row] : rows;
  }

  function productDevelopmentOneShotApplyFrontFacts(rows, frontFacts, sourcePlainTextCopy) {
    const facts = frontFacts && typeof frontFacts === 'object' ? frontFacts : {};
    const output = Array.isArray(rows) ? rows : [];
    const claims = Array.isArray(facts.amountClaims) ? facts.amountClaims : [];
    if (claims.length !== 1 || output.length !== 1) return output;
    const sourceKey = productDevelopmentNormalizedClaimText(sourcePlainTextCopy);
    const row = output[0];
    const rowKey = productDevelopmentNormalizedClaimText(row && row.nameEn);
    if (!rowKey || rowKey.length < 5 || !sourceKey.includes(rowKey)) return output;
    const claim = claims[0];
    const current = productDevelopmentOneShotParseAmount(row && row.amountText);
    if (current.amountText !== claim.amountText || current.isMass || current.unit !== claim.unit) {
      const parsedClaim = productDevelopmentOneShotParseAmount(claim.amountText);
      row.amountText = claim.amountText;
      row.amountValue = claim.value;
      row.amountUnit = claim.unit;
      row.amountIsMass = Boolean(parsedClaim.valid && parsedClaim.isMass);
      row.amountMg = row.amountIsMass ? productDevelopmentOneShotRounded(parsedClaim.massMg) : 0;
      if (row.amountIsMass && row.category !== 'other') {
        row.markerActiveMg = row.amountMg;
        row.markerBasis = 'amount';
      } else {
        row.markerActiveMg = 0;
        row.markerBasis = 'none';
      }
    }
    if (row.sourcePart && !sourceKey.includes(productDevelopmentNormalizedClaimText(row.sourcePart))) row.sourcePart = '';
    if (!/%|standard(?:ized|ised)|assay|活性含量|标准化/i.test(String(sourcePlainTextCopy || ''))) row.standardization = '';
    row.labelEn = productDevelopmentOneShotIngredientLabel(row, false);
    return output;
  }

  function productDevelopmentOneShotFieldHtml(input, key, label, type, multiline, wide) {
    const isOptionalTarget = ['targetActiveMg', 'targetActivePercent'].includes(key);
    const value = isOptionalTarget && !(Number(input[key]) > 0) ? '' : String(input[key] || '');
    const rowcount = ['regularIngredientsEn', 'regularIngredientsInactiveEn', 'regularIngredientsCn', 'regularIngredientsInactiveCn', 'otherIngredientsEn', 'otherIngredientsCn'].includes(key) ? 8 : 3;
    const control = multiline
      ? '<textarea class="pfh-product-development-review-input" rows="' + rowcount + '" data-product-development-one-shot-field="' + escapeHtml(key) + '" spellcheck="false">' + escapeHtml(value) + '</textarea>'
      : '<input type="' + escapeHtml(type || 'text') + '" class="pfh-product-development-review-input" data-product-development-one-shot-field="' + escapeHtml(key) + '" value="' + escapeHtml(value) + '"' + (type === 'number' ? ' step="any"' : '') + '>';
    return '<label class="pfh-product-development-material-field' + (wide ? ' is-wide' : '') + '"><span>' + escapeHtml(label) + '</span>' + control + '</label>';
  }

  async function productDevelopmentOneShotOptimizeImage(dataUrl) {
    const source = String(dataUrl || '');
    if (!/^data:image\//i.test(source) || source.length <= 4300000 || typeof Image !== 'function') return source;
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const maxDimension = 2400;
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
          canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            resolve(source);
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          let quality = 0.92;
          let result = canvas.toDataURL('image/jpeg', quality);
          while (result.length > 4300000 && quality > 0.62) {
            quality -= 0.08;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(result.length < source.length || result.length <= 4300000 ? result : source);
        } catch (_) {
          resolve(source);
        }
      };
      image.onerror = () => resolve(source);
      image.src = source;
    });
  }

  function productDevelopmentOneShotIngredientLabel(row, chinese) {
    const source = row && typeof row === 'object' ? row : {};
    const base = productDevelopmentCleanText(chinese ? source.nameCn : source.nameEn, 300);
    const latin = productDevelopmentCleanText(source.latinName, 220);
    const part = productDevelopmentCleanText(source.sourcePart, 160);
    const standardization = productDevelopmentCleanText(source.standardization, 220);
    const suffix = [latin, part, standardization].filter(Boolean).join('; ');
    return base + (suffix ? ' (' + suffix + ')' : '');
  }

  function productDevelopmentOneShotSnapshot(response, input, content, metadata) {
    const product = response && response.product && typeof response.product === 'object' ? response.product : {};
    const table = response && response.ingredientTable && typeof response.ingredientTable === 'object' ? response.ingredientTable : {};
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const copy = content && typeof content === 'object' ? content : {};
    const sectionText = (key, field) => Array.isArray(copy[key])
      ? copy[key].map((item) => productDevelopmentCleanText(item && item[field] || item && (field === 'en' ? item.ingredientEn : item.ingredientCn) || '', 800)).filter(Boolean).join('\n')
      : '';
    const meta = metadata && typeof metadata === 'object' ? metadata : {};
    const name = productDevelopmentCleanText(product.nameCn || input.nameCn || '日常营养支持滴剂', 220);
    const englishName = productDevelopmentIsEntryProductName(name) || productDevelopmentIsEntryProductName(input && input.nameEn)
      ? 'Dietary Supplement'
      : productDevelopmentCleanText(product.nameEn || input.nameEn || 'Daily Wellness Support Drops', 220);
    const brand = productDevelopmentNormalizeBrandValue(input.brand || product.brand);
    return {
      version: PRODUCT_DEVELOPMENT_VERSION,
      sku: productDevelopmentCleanText(response && response.sku || input.sku || 'ONE-SHOT-' + Date.now().toString(36), 80).toUpperCase(),
      name,
      englishName,
      brand,
      productType: productDevelopmentCleanText(input.productType || product.productType || (normalizeProductDevelopmentIngredientKind(meta.ingredientKind || input.ingredientKind) === 'pet' ? 'Pet food supplement / liquid drops' : 'Human dietary supplement / liquid drops'), 180),
      productTypeCn: productDevelopmentCleanText(product.productTypeCn || input.productTypeCn, 180),
      netContent: productDevelopmentCleanText(input.netContent || product.netContent || '60 mL', 120).toUpperCase(),
      referenceUrl: productDevelopmentCleanText(input.referenceUrl, 1200),
      ingredients: rows.map((row) => ({ en: productDevelopmentCleanText(row.nameEn, 300), cn: productDevelopmentCleanText(row.nameCn, 300) })).filter((row) => row.en || row.cn),
      ingredientSummary: {
        en: rows.map((row) => productDevelopmentOneShotIngredientLabel(row, false) + ' ' + productDevelopmentCleanText(row.amountText || row.amountMg, 80)).join(', '),
        cn: rows.map((row) => productDevelopmentOneShotIngredientLabel(row, true) + ' ' + productDevelopmentCleanText(row.amountText || row.amountMg, 80)).join('、'),
      },
      ingredientFunctions: { en: '', cn: '' },
      sourcePlainTextCopy: productDevelopmentCleanText(input.sourcePlainTextCopy, 12000),
      sourceCopywriting: {
        efficacy: { en: sectionText('efficacy', 'en'), cn: sectionText('efficacy', 'cn') },
        advantages: { en: sectionText('advantages', 'en'), cn: sectionText('advantages', 'cn') },
        sellingPoints: { en: sectionText('sellingPoints', 'en'), cn: sectionText('sellingPoints', 'cn') },
        usage: { en: '', cn: '' },
      },
      labeling: response && response.labeling && typeof response.labeling === 'object' ? response.labeling : {},
      ingredientTable: {
        otherIngredientsEn: productDevelopmentCleanText(table.otherIngredientsEn, 1600),
        otherIngredientsCn: productDevelopmentCleanText(table.otherIngredientsCn, 1200),
      },
      ingredientKind: normalizeProductDevelopmentIngredientKind(meta.ingredientKind || input.ingredientKind),
      ingredientTemplateId: productDevelopmentCleanText(meta.ingredientTemplateId, 80),
      ingredientTemplateLabel: productDevelopmentCleanText(meta.ingredientTemplateLabel, 120),
      ingredientTemplateSheetName: productDevelopmentCleanText(meta.ingredientTemplateSheetName, 120),
      ingredientTemplateSheetHeader: productDevelopmentCleanText(meta.ingredientTemplateSheetHeader, 1200),
      copywritingTemplateId: productDevelopmentCleanText(meta.copywritingTemplateId, 80),
      copywritingTemplateLabel: productDevelopmentCleanText(meta.copywritingTemplateLabel, 120),
      updatedAt: new Date().toLocaleString(),
    };
  }
