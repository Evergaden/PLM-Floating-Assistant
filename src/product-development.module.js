  const PRODUCT_DEVELOPMENT_VERSION = '1.9.2';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION = 'builtin-v1';
  const PRODUCT_DEVELOPMENT_HISTORY_KEY = 'plm-floating-helper:product-development-history:v1';
  const PRODUCT_DEVELOPMENT_REVIEW_DRAFT_KEY = 'plm-floating-helper:product-development-review-drafts:v1';
  const PRODUCT_DEVELOPMENT_REVIEW_DRAFT_LIMIT = 8;
  const PRODUCT_DEVELOPMENT_TASK_META_KEY = 'plm-floating-helper:product-development-task-meta:v1';
  const PRODUCT_DEVELOPMENT_TASK_SIDEBAR_KEY = 'plm-floating-helper:product-development-task-sidebar:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_KEY = 'plm-floating-helper:product-development-template:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY = 'plm-floating-helper:product-development-template-version:v1';
  const PRODUCT_DEVELOPMENT_MAX_HISTORY = 8;
  const productDevelopmentReviewDraftWriteTimers = Object.create(null);
  const productDevelopmentTaskMetaWriteTimers = Object.create(null);
  const PRODUCT_DEVELOPMENT_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const PRODUCT_DEVELOPMENT_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const PRODUCT_DEVELOPMENT_BANNED_TERMS = Object.freeze([
    'natural', 'nature', 'naturally', '天然', '自然',
    'organic', '有机', 'vegan', '素食主义者',
    'crueltyfree', 'cruelty free', '无残忍',
    'biodegradable', '可生物降解', 'environmentally friendly',
    'reduce', 'remove', 'repair', 'treatment', 'therapy', 'instantly',
    'prevent', 'prevention', 'cure', 'cure-all', 'clinical', 'clinically',
    'medical grade', 'medical-grade', '医疗级', '治疗', '疗效', '治愈',
    '全效', '特效', '速效', '第一', '最佳', '顶级', '百分百',
    '实验认证', '认证', '疾病', '药品', '处方', '诊断',
  ]);
  const PRODUCT_DEVELOPMENT_FEATURES = Object.freeze([
    Object.freeze({ id: 'tasks', title: '我的开发任务', subtitle: '先做侵权图和文案，再查看产品详情预填表单', action: 'product-development-tasks-open', icon: 'folder', requiresSku: false }),
    Object.freeze({ id: 'review', title: '产品图风险筛查', subtitle: '提取全部图片文字，生成中英文修改对照图', action: 'product-development-review-open', icon: 'image' }),
    Object.freeze({ id: 'copywriting', title: 'A-D 文案 DOCX', subtitle: '按当前 SKU 成分和卖点生成双语文案文件', action: 'product-development-copywriting-open', icon: 'batchExcel' }),
    Object.freeze({ id: 'pricing', title: '定价标准', subtitle: '三档价格和公式价', action: '', icon: 'calculator' }),
    Object.freeze({ id: 'stocking', title: '备货标准', subtitle: '出单数量、手工贴标和返工 100 件规则', action: '', icon: 'box' }),
    Object.freeze({ id: 'packaging', title: '包装与成分表', subtitle: '规格、标签尺寸、成分表模板和审核', action: '', icon: 'box' }),
  ]);

  // These are style examples from the supplied product-material workbook. They
  // are naming references only; the AI must not copy their factual claims or
  // invent an ingredient that is absent from the current product evidence.
  const PRODUCT_DEVELOPMENT_NAME_EXAMPLES = Object.freeze([
    '犬猫益生菌滴剂',
    '狗狗舒缓褪黑素滴剂',
    '狗狗支持泌尿舒缓滴剂',
    '狗专用免疫草本滴剂',
    '狗狗胶原蛋白营养滴剂',
    '宠物胶原蛋白滴剂',
    '宠物口腔除臭滴剂',
    'Kriath 狗狗肠道精油滴剂',
    '猫咪褪黑素滴剂（精品）',
    '狗狗助睡眠滴剂',
  ]);

  const PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS = Object.freeze([
    Object.freeze({ attrId: 119, key: 'specification', label: '规格型号' }),
    Object.freeze({ attrId: 122, key: 'rough_weight', label: '毛重' }),
    Object.freeze({ attrId: 133, key: 'long_outer_packaging', label: '长（外包装）' }),
    Object.freeze({ attrId: 134, key: 'wide_outer_packaging', label: '宽（外包装）' }),
    Object.freeze({ attrId: 135, key: 'high_outer_packaging', label: '高（外包装）' }),
    Object.freeze({ attrId: 136, key: 'volume_outer_packaging', label: '体积（外包装）' }),
    Object.freeze({ attrId: 131, key: 'product_production_line', label: '产品产线' }),
    Object.freeze({ attrId: 2764, key: 'min_stock_quantity', label: '最小起订量' }),
    Object.freeze({ attrId: 153, key: 'cost_rice', label: '成本价' }),
    Object.freeze({ attrId: 123, key: 'standard_packing_quantity', label: '标准装箱数' }),
    Object.freeze({ attrId: 149, key: 'box_gauge', label: '箱规' }),
    Object.freeze({ attrId: 301, key: 'box_weight', label: '箱重' }),
    Object.freeze({ attrId: 163, key: 'create_organization', label: '创建组织' }),
    Object.freeze({ attrId: 164, key: 'use_organization', label: '使用组织' }),
    Object.freeze({ attrId: 165, key: 'procurement_organization', label: '采购组织' }),
  ]);

  const PRODUCT_DEVELOPMENT_PRICE_FIELD_FALLBACKS = Object.freeze([
    Object.freeze({ attrId: 153, key: 'cost_rice', label: '成本价' }),
    Object.freeze({ attrId: 154, key: 'first_price', label: '国内一档价格' }),
    Object.freeze({ attrId: 155, key: 'second_price', label: '国内二档价格' }),
    Object.freeze({ attrId: 156, key: 'third_price', label: '国内三档价格' }),
  ]);
  const PRODUCT_DEVELOPMENT_PURCHASE_PRICE_FIELD = Object.freeze({ attrId: 152, key: 'procurement_rice', label: '采购价（含税运）' });

  function normalizeProductDevelopmentWorkMode(value) {
    return String(value || '').trim() === 'product-development' ? 'product-development' : 'daily';
  }

  function readProductDevelopmentStorage(key, fallback) {
    try {
      const value = typeof GM_getValue === 'function'
        ? GM_getValue(key, null)
        : JSON.parse(localStorage.getItem(key) || 'null');
      return value === null || value === undefined ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeProductDevelopmentStorage(key, value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(key, value);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Local history is optional; the current result remains available.
    }
  }

  function loadProductDevelopmentTaskListOpen() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TASK_SIDEBAR_KEY, null);
    return value === null || value === undefined ? true : value !== false && value !== 'false';
  }

  function saveProductDevelopmentTaskListOpen(open) {
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TASK_SIDEBAR_KEY, Boolean(open));
  }

  function normalizeProductDevelopmentHistory(value) {
    const list = Array.isArray(value) ? value : [];
    return list.map((item) => {
      const source = item && typeof item === 'object' ? item : {};
      return {
        id: String(source.id || ''),
        sku: String(source.sku || '').trim().toUpperCase(),
        name: String(source.name || '').trim().slice(0, 200),
        kind: source.kind === 'copywriting' ? 'copywriting' : 'review',
        createdAt: String(source.createdAt || '').trim(),
        fileName: String(source.fileName || '').trim().slice(0, 180),
        itemCount: Math.max(0, Math.min(60, Number(source.itemCount) || 0)),
        extractedTextCount: Math.max(0, Math.min(100, Number(source.extractedTextCount) || 0)),
        templateVersion: String(source.templateVersion || '').trim().slice(0, 60),
        productNameCn: productDevelopmentCleanText(source.productNameCn || source.chineseProductName, 180),
        productNameEn: productDevelopmentCleanText(source.productNameEn || source.englishProductName, 180),
        comparisonDataUrl: typeof source.comparisonDataUrl === 'string' && source.comparisonDataUrl.length < 2600000
          ? source.comparisonDataUrl
          : '',
        warnings: Array.isArray(source.warnings) ? source.warnings.map((text) => String(text || '').trim()).filter(Boolean).slice(0, 12) : [],
      };
    }).filter((item) => item.sku && item.id).slice(0, PRODUCT_DEVELOPMENT_MAX_HISTORY);
  }

  function loadProductDevelopmentHistory() {
    return normalizeProductDevelopmentHistory(readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_HISTORY_KEY, []));
  }

  function saveProductDevelopmentHistory(record) {
    const current = normalizeProductDevelopmentHistory(state.productDevelopmentHistory);
    const next = normalizeProductDevelopmentHistory([record].concat(current.filter((item) => item.id !== record.id)));
    state.productDevelopmentHistory = next;
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_HISTORY_KEY, next);
    return next;
  }

  function productDevelopmentReviewDraftItem(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      id: productDevelopmentCleanText(source.id || '', 60),
      sourceText: productDevelopmentCleanText(source.sourceText || source.originalText || source.text, 240),
      bbox: source.bbox && typeof source.bbox === 'object' ? {
        x: Number(source.bbox.x) || 0,
        y: Number(source.bbox.y) || 0,
        w: Number(source.bbox.w !== undefined ? source.bbox.w : source.bbox.width) || 0,
        h: Number(source.bbox.h !== undefined ? source.bbox.h : source.bbox.height) || 0,
      } : null,
      riskTypes: Array.isArray(source.riskTypes) ? source.riskTypes.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4) : [],
      riskTerms: Array.isArray(source.riskTerms) ? source.riskTerms.map((item) => productDevelopmentCleanText(item, 100)).filter(Boolean).slice(0, 8) : [],
      riskReason: productDevelopmentCleanText(source.riskReason || source.reason || source.warning, 400),
      replacementEn: productDevelopmentCleanText(source.replacementEn || source.modifiedEnglish || source.english, 300),
      replacementZh: productDevelopmentCleanText(source.replacementZh || source.modifiedChinese || source.chinese || source.translation || source.translationZh, 300),
      translationZh: productDevelopmentCleanText(source.translationZh || source.translation || source.chinese, 300),
      replacementOptions: Array.isArray(source.replacementOptions) ? source.replacementOptions.map((item) => ({
        en: productDevelopmentCleanText(item && (item.en || item.english || item.replacementEn), 300),
        zh: productDevelopmentCleanText(item && (item.zh || item.chinese || item.translation), 300),
      })).filter((item) => item.en || item.zh).slice(0, 3) : [],
      confidence: Math.max(0, Math.min(1, Number(source.confidence) || 0)),
    };
  }

  function productDevelopmentReviewDraftValue(value) {
    const source = value && typeof value === 'object' ? value : {};
    const sku = String(source.sku || '').trim().toUpperCase();
    if (!sku) return null;
    const dataUrl = (candidate, maxLength) => {
      const text = typeof candidate === 'string' ? candidate : '';
      return /^data:image\//i.test(text) && text.length <= maxLength ? text : '';
    };
    const naming = productDevelopmentNormalizeProductNaming(source.productNaming || source);
    return {
      id: productDevelopmentCleanText(source.id || 'pd-review-' + Date.now().toString(36), 80),
      sku,
      sourceImageDataUrl: dataUrl(source.sourceImageDataUrl, 2600000),
      sourceImageName: productDevelopmentCleanText(source.sourceImageName || source.benchmarkImageName, 180),
      comparisonDataUrl: dataUrl(source.comparisonDataUrl, 2600000),
      items: (Array.isArray(source.items) ? source.items : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
      extractedTexts: (Array.isArray(source.extractedTexts) ? source.extractedTexts : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
      warnings: Array.isArray(source.warnings) ? source.warnings.map((item) => productDevelopmentCleanText(item, 240)).filter(Boolean).slice(0, 12) : [],
      provider: productDevelopmentCleanText(source.provider, 80),
      model: productDevelopmentCleanText(source.model, 120),
      productNaming: naming,
      fileName: productDevelopmentCleanText(source.fileName || productDevelopmentFileName(sku, 'infringement-comparison', 'png'), 180),
      createdAt: productDevelopmentCleanText(source.createdAt || new Date().toLocaleString(), 80),
      updatedAt: Number(source.updatedAt) || Date.now(),
      fromHistory: false,
    };
  }

  function loadProductDevelopmentReviewDrafts() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_REVIEW_DRAFT_KEY, null);
    const source = value && typeof value === 'object' && value.entries && typeof value.entries === 'object' ? value.entries : {};
    const entries = Object.create(null);
    Object.keys(source).forEach((key) => {
      const draft = productDevelopmentReviewDraftValue(source[key]);
      if (draft && draft.sku) entries[draft.sku] = draft;
    });
    return entries;
  }

  function getProductDevelopmentReviewDraft(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return null;
    const draft = loadProductDevelopmentReviewDrafts()[normalizedSku];
    return draft ? productDevelopmentReviewDraftValue(draft) : null;
  }

  function saveProductDevelopmentReviewDraft(result) {
    if (!result || result.fromHistory) return;
    const draft = productDevelopmentReviewDraftValue(result);
    if (!draft) return;
    const entries = loadProductDevelopmentReviewDrafts();
    entries[draft.sku] = draft;
    const storedEntries = {};
    Object.entries(entries)
      .sort((a, b) => Number(b[1] && b[1].updatedAt) - Number(a[1] && a[1].updatedAt))
      .slice(0, PRODUCT_DEVELOPMENT_REVIEW_DRAFT_LIMIT)
      .forEach(([key, value]) => { storedEntries[key] = value; });
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_REVIEW_DRAFT_KEY, { version: 1, entries: storedEntries });
  }

  function scheduleProductDevelopmentReviewDraftSave(result) {
    const sku = String(result && result.sku || '').trim().toUpperCase();
    if (!sku || !result) return;
    if (productDevelopmentReviewDraftWriteTimers[sku]) window.clearTimeout(productDevelopmentReviewDraftWriteTimers[sku]);
    productDevelopmentReviewDraftWriteTimers[sku] = window.setTimeout(() => {
      delete productDevelopmentReviewDraftWriteTimers[sku];
      saveProductDevelopmentReviewDraft(result);
    }, 250);
  }

  function deleteProductDevelopmentReviewDraft(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return;
    if (productDevelopmentReviewDraftWriteTimers[normalizedSku]) {
      window.clearTimeout(productDevelopmentReviewDraftWriteTimers[normalizedSku]);
      delete productDevelopmentReviewDraftWriteTimers[normalizedSku];
    }
    const entries = loadProductDevelopmentReviewDrafts();
    delete entries[normalizedSku];
    const storedEntries = {};
    Object.entries(entries).forEach(([key, value]) => { storedEntries[key] = value; });
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_REVIEW_DRAFT_KEY, { version: 1, entries: storedEntries });
  }

  function restoreProductDevelopmentReviewDraft(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return null;
    if (state.productDevelopmentReview && state.productDevelopmentReview.sku === normalizedSku && !state.productDevelopmentReview.fromHistory) return state.productDevelopmentReview;
    const draft = getProductDevelopmentReviewDraft(normalizedSku);
    if (!draft) return null;
    state.productDevelopmentReview = draft;
    if (draft.sourceImageDataUrl) state.productDevelopmentBenchmarkImageDataUrl = draft.sourceImageDataUrl;
    if (draft.sourceImageName) state.productDevelopmentBenchmarkImageName = draft.sourceImageName;
    return draft;
  }

  function normalizeProductDevelopmentTaskMeta(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      brand: productDevelopmentCleanText(source.brand, 160),
      productNameCn: productDevelopmentCleanText(source.productNameCn || source.chineseProductName, 180),
      productNameEn: productDevelopmentCleanText(source.productNameEn || source.englishProductName, 180),
      reworkProductCode: productDevelopmentCleanText(source.reworkProductCode || source.reworkCode, 120),
    };
  }

  function loadProductDevelopmentTaskMeta() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TASK_META_KEY, null);
    const source = value && typeof value === 'object' && value.entries && typeof value.entries === 'object' ? value.entries : {};
    const entries = Object.create(null);
    Object.keys(source).forEach((key) => {
      const sku = String(key || '').trim().toUpperCase();
      if (!sku) return;
      entries[sku] = { ...normalizeProductDevelopmentTaskMeta(source[key]), updatedAt: Number(source[key] && source[key].updatedAt) || 0 };
    });
    return entries;
  }

  function productDevelopmentTaskMetaFallback(task, detail) {
    const baseFields = detail && Array.isArray(detail.baseFields) ? detail.baseFields : [];
    const baseValue = (keys) => {
      const field = baseFields.find((item) => item && keys.includes(String(item.key || '')));
      return field ? String(field.displayValue || field.value || '') : '';
    };
    return {
      brand: String(task && task.brand || detail && detail.brand || baseValue(['brand']) || ''),
      productNameCn: String(detail && detail.productNameCn || task && task.name || baseValue(['productNameCn', 'product_name_cn']) || ''),
      productNameEn: String(detail && detail.productNameEn || task && task.productNameEn || baseValue(['productNameEn', 'product_name_en']) || ''),
      reworkProductCode: String(task && task.reworkProductCode || detail && detail.reworkProductCode || ''),
    };
  }

  function getProductDevelopmentTaskMeta(task, detail) {
    const sku = String(task && task.sku || detail && detail.sku || '').trim().toUpperCase();
    if (!sku) return normalizeProductDevelopmentTaskMeta({});
    const stored = loadProductDevelopmentTaskMeta()[sku] || {};
    const memory = state.productDevelopmentTaskMeta && state.productDevelopmentTaskMeta[sku] || {};
    return { ...productDevelopmentTaskMetaFallback(task, detail), ...stored, ...memory };
  }

  function saveProductDevelopmentTaskMeta(sku, value) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return;
    const entries = loadProductDevelopmentTaskMeta();
    entries[normalizedSku] = { ...normalizeProductDevelopmentTaskMeta(value), updatedAt: Date.now() };
    const storedEntries = {};
    Object.entries(entries)
      .sort((a, b) => Number(b[1] && b[1].updatedAt) - Number(a[1] && a[1].updatedAt))
      .slice(0, PRODUCT_DEVELOPMENT_DETAIL_CACHE_LIMIT)
      .forEach(([key, entry]) => { storedEntries[key] = entry; });
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TASK_META_KEY, { version: 1, entries: storedEntries });
  }

  function scheduleProductDevelopmentTaskMetaSave(sku, value) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return;
    if (productDevelopmentTaskMetaWriteTimers[normalizedSku]) window.clearTimeout(productDevelopmentTaskMetaWriteTimers[normalizedSku]);
    productDevelopmentTaskMetaWriteTimers[normalizedSku] = window.setTimeout(() => {
      delete productDevelopmentTaskMetaWriteTimers[normalizedSku];
      saveProductDevelopmentTaskMeta(normalizedSku, value);
    }, 250);
  }

  function loadProductDevelopmentTemplate() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TEMPLATE_KEY, '');
    return typeof value === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(value) ? value.replace(/\s+/g, '') : '';
  }

  function loadProductDevelopmentTemplateVersion() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY, '');
    return String(value || '').trim().slice(0, 80);
  }

  function saveProductDevelopmentTemplate(base64, version) {
    const value = String(base64 || '').replace(/\s+/g, '');
    if (!value || value.length > 1800000) throw new Error('模板文件过大，暂不保存');
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TEMPLATE_KEY, value);
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY, String(version || 'local-template').slice(0, 80));
    state.productDevelopmentTemplateBase64 = value;
    state.productDevelopmentTemplateVersion = String(version || 'local-template').slice(0, 80);
  }

  function getProductDevelopmentCurrentSku() {
    const taskCandidates = [
      state && state.productDevelopmentSelectedTask && state.productDevelopmentSelectedTask.sku,
      state && state.productDevelopmentTaskSelectedSku,
    ];
    const taskSku = taskCandidates.map((value) => String(value || '').trim().toUpperCase()).find(Boolean) || '';
    if (state && normalizeProductDevelopmentWorkMode(state.workMode) === 'product-development') return taskSku;
    const candidates = taskCandidates.concat([
      state && state.selectedSku,
      state && state.data && state.data.sku,
      state && state.sku,
      state && state.observedSku,
    ]);
    return candidates.map((value) => String(value || '').trim().toUpperCase()).find(Boolean) || '';
  }

  const PRODUCT_DEVELOPMENT_TASK_ENDPOINT = '/api/ChemicalNewAll/GetList';
  const PRODUCT_DEVELOPMENT_TASK_PAGE_SIZE = 100;
  const PRODUCT_DEVELOPMENT_TASK_MAX_PAGES = 100;
  const PRODUCT_DEVELOPMENT_TASK_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
  const PRODUCT_DEVELOPMENT_TASK_CACHE_KEY = 'plm-floating-helper:product-development-tasks:v1';
  const PRODUCT_DEVELOPMENT_DETAIL_CACHE_KEY = 'plm-floating-helper:product-development-detail:v1';
  const PRODUCT_DEVELOPMENT_DETAIL_CACHE_LIMIT = 20;
  const productDevelopmentDetailCacheWriteTimers = Object.create(null);
  const PRODUCT_DEVELOPMENT_TASK_TABS = Object.freeze([
    { id: 'detail', label: '详情' },
    { id: 'review', label: '侵权图' },
    { id: 'copywriting', label: '编辑文案' },
    { id: 'placeholder', label: '尺寸图' },
  ]);

  const PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS = Object.freeze({
    box: Object.freeze({
      label: '纸盒',
      categoryId: '114',
      categoryPath: '包材 / 纸盒 / 白卡 / 白卡',
      materialType: 0,
      supplierId: '80000249',
      supplier: '广州美多印刷有限公司-纸盒',
      usage: '1',
      shelfLife: '食品两年',
    }),
    label: Object.freeze({
      label: '标签',
      categoryId: '119',
      categoryPath: '包材 / 标签 / 标签 / 标签',
      materialType: 1,
      supplierId: '80000173',
      supplier: '汕头市柠彩文化传媒有限公司-标签',
      usage: '1',
      labelShape: '圆弧',
      adhesive: '玻璃加粘',
      shelfLife: '食品两年',
    }),
  });

  const PRODUCT_DEVELOPMENT_BOX_QUANTITY_OPTIONS = Object.freeze([
    Object.freeze({ value: 1, label: '0–1999 个', factor: 4.5, minPrice: 0.18 }),
    Object.freeze({ value: 2, label: '2000–4999 个', factor: 4, minPrice: 0.14 }),
    Object.freeze({ value: 3, label: '5000–9999 个', factor: 3.5, minPrice: 0.11 }),
    Object.freeze({ value: 4, label: '10000–19999 个', factor: 3, minPrice: 0.072 }),
    Object.freeze({ value: 5, label: '20000–49999 个', factor: 3, minPrice: 0.07 }),
    Object.freeze({ value: 6, label: '50000–99999 个', factor: 3, minPrice: 0.068 }),
    Object.freeze({ value: 7, label: '100000 个以上', factor: 3, minPrice: 0.065 }),
  ]);

  function normalizeProductDevelopmentTaskTab(value) {
    const tab = String(value || '').trim();
    return PRODUCT_DEVELOPMENT_TASK_TABS.some((item) => item.id === tab) ? tab : 'detail';
  }

  function productDevelopmentTaskTabsHtml(activeView) {
    const active = normalizeProductDevelopmentTaskTab(activeView || state.productDevelopmentTaskView);
    const buttons = PRODUCT_DEVELOPMENT_TASK_TABS.map((tab) => '<button type="button" role="tab" data-action="product-development-task-tab" data-product-development-tab="' + tab.id + '" class="' + (tab.id === active ? 'is-active' : '') + '" aria-selected="' + String(tab.id === active) + '">' + escapeHtml(tab.label) + '</button>').join('');
    return '<nav class="pfh-detail-view-tabs pfh-product-development-task-tabs" data-active-view="' + escapeHtml(active) + '" role="tablist" aria-label="开发 SKU 视图"><span class="pfh-detail-view-indicator" aria-hidden="true"></span>' + buttons + '</nav>';
  }

  function setupProductDevelopmentTaskTabs(panel) {
    const tabs = panel && panel.querySelector('.pfh-product-development-task-tabs');
    const indicator = tabs && tabs.querySelector('.pfh-detail-view-indicator');
    const activeButton = tabs && tabs.querySelector('button.is-active');
    if (!tabs || !indicator || !activeButton) return;
    const transition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    const moveIndicator = (button) => {
      if (!button) return;
      indicator.style.setProperty('left', button.offsetLeft + 'px', 'important');
      indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    };
    const previous = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskPreviousTab);
    const previousButton = previous !== activeButton.getAttribute('data-product-development-tab')
      ? tabs.querySelector('button[data-product-development-tab="' + previous + '"]')
      : null;
    indicator.style.setProperty('transition', 'none', 'important');
    moveIndicator(previousButton || activeButton);
    window.requestAnimationFrame(() => {
      if (!indicator.isConnected) return;
      indicator.style.setProperty('transition', transition, 'important');
      moveIndicator(activeButton);
    });
    state.productDevelopmentTaskPreviousTab = '';
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
    ['requiredFields', 'baseFields', 'priceFields', 'productFields'].forEach((key) => {
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
    const entries = Object.create(null);
    Object.keys(source).forEach((key) => {
      const sku = String(key || '').trim().toUpperCase();
      const raw = source[key];
      const detail = raw && typeof raw === 'object' && raw.detail && typeof raw.detail === 'object' ? raw.detail : raw;
      if (!sku || !detail || typeof detail !== 'object' || detail.error) return;
      entries[sku] = {
        detail,
        cachedAt: Number(raw && raw.cachedAt) || Number(detail.cachedAt) || 0,
      };
    });
    return entries;
  }

  function getProductDevelopmentReadonlyDetailCache(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return null;
    const entries = loadProductDevelopmentReadonlyDetailCache();
    const entry = entries[normalizedSku];
    const detail = entry && entry.detail ? productDevelopmentReadonlyDetailCopy(entry.detail) : null;
    if (!detail) return null;
    detail.cacheSource = 'local-cache';
    return detail;
  }

  function saveProductDevelopmentReadonlyDetailCache(sku, detail) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const cachedDetail = productDevelopmentReadonlyDetailForCache(detail);
    if (!normalizedSku || !cachedDetail || cachedDetail.error) return;
    const entries = loadProductDevelopmentReadonlyDetailCache();
    entries[normalizedSku] = { detail: cachedDetail, cachedAt: Date.now() };
    const storedEntries = {};
    Object.entries(entries)
      .sort((a, b) => Number(b[1] && b[1].cachedAt) - Number(a[1] && a[1].cachedAt))
      .slice(0, PRODUCT_DEVELOPMENT_DETAIL_CACHE_LIMIT)
      .forEach(([key, value]) => { storedEntries[key] = value; });
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_DETAIL_CACHE_KEY, { version: 1, entries: storedEntries });
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
      brand: productDevelopmentCleanText(item.brand_name || item.product_brand_name || '', 160),
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
      plmCategory: cleanCell(item.category_name || item.project_series_name),
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

  function productDevelopmentApplyReadonlyDetailState(task, readOnlyDetail, next) {
    const sku = String(task && task.sku || '').trim().toUpperCase();
    if (!sku || !readOnlyDetail) return next || null;
    if (!state.productDevelopmentTaskDetailData || typeof state.productDevelopmentTaskDetailData !== 'object') state.productDevelopmentTaskDetailData = Object.create(null);
    if (!state.productDevelopmentTaskFormData || typeof state.productDevelopmentTaskFormData !== 'object') state.productDevelopmentTaskFormData = Object.create(null);
    if (next) state.productDevelopmentTaskDetailData[sku] = next;
    state.productDevelopmentTaskFormData[sku] = readOnlyDetail;
    if (state.productDevelopmentTaskSelectedSku === sku) {
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
    if (!opts.force) {
      const cachedDetail = productDevelopmentReadonlyDetailForTask(task);
      const hasBomSnapshot = cachedDetail && Array.isArray(cachedDetail.bomRows) && cachedDetail.bomRows.length > 0;
      if (cachedDetail && hasBomSnapshot) {
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
      readOnlyDetail.cacheSource = 'plm';
      saveProductDevelopmentReadonlyDetailCache(sku, readOnlyDetail);
    }
    productDevelopmentApplyReadonlyDetailState(task, readOnlyDetail, next);
    return next;
  }

  function selectProductDevelopmentTask(sku, options) {
    const task = getProductDevelopmentTaskBySku(sku);
    if (!task) return null;
    if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
    const normalizedSku = task.sku;
    state.productDevelopmentSelectedTask = task;
    state.productDevelopmentTaskSelectedSku = normalizedSku;
    state.selectedSku = normalizedSku;
    state.data = productDevelopmentTaskSeedData(task);
    state.productDevelopmentSnapshot = null;
    state.productDevelopmentBenchmarkImageDataUrl = '';
    state.productDevelopmentBenchmarkImageName = '';
    state.productDevelopmentReview = null;
    state.productDevelopmentCopywriting = null;
    state.productDevelopmentTaskView = 'detail';
    state.productDevelopmentTaskPreviousTab = '';
    state.productDevelopmentError = '';
    const cachedDetail = productDevelopmentReadonlyDetailForTask(task);
    if (cachedDetail) {
      if (!state.productDevelopmentTaskFormData || typeof state.productDevelopmentTaskFormData !== 'object') state.productDevelopmentTaskFormData = Object.create(null);
      state.productDevelopmentTaskFormData[normalizedSku] = cachedDetail;
    }
    restoreProductDevelopmentReviewDraft(normalizedSku);
    if (!(options && options.render === false)) renderShell();
    if (!(options && options.hydrate === false)) {
      hydrateProductDevelopmentTaskDetail(task).then(() => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === normalizedSku) renderShell();
      }).catch(() => {});
    }
    return task;
  }

  function productDevelopmentTaskListHtml() {
    const tasks = Array.isArray(state.productDevelopmentTasks) ? sortSkuListItems(state.productDevelopmentTasks) : [];
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
    const listTools = '<div class="pfh-sku-list-toolbar"><div class="pfh-sku-view-switch" data-active-mode="' + listMode + '" role="group" aria-label="开发 SKU 列表视图"><span class="pfh-sku-view-indicator" aria-hidden="true"></span>' +
      '<button type="button" data-action="sku-list-mode" data-mode="list" class="' + (listMode === 'list' ? 'is-active' : '') + '">列表</button><button type="button" data-action="sku-list-mode" data-mode="waterfall" class="' + (listMode === 'waterfall' ? 'is-active' : '') + '">瀑布流</button></div>' +
      '<label class="pfh-sku-sort"><span>排序</span>' + listSortMenu + '</label></div>';
    const taskListOpen = state.productDevelopmentTaskListOpen !== false;
    const sidebarToggle = '<button type="button" class="pfh-product-development-task-sidebar-collapse" data-action="product-development-task-list-toggle" aria-expanded="' + (taskListOpen ? 'true' : 'false') + '" title="' + (taskListOpen ? '收起开发 SKU 列表' : '固定开发 SKU 列表') + '">' + (taskListOpen ? '‹' : '›') + '</button>';
    const listHead = '<div class="pfh-list-head"><button type="button" class="pfh-upload-back" data-action="product-development-tasks-home" aria-label="返回开发主页">' + iconHtml('backArrow') + '</button><strong>开发 SKU</strong><span>共 ' + tasks.length + ' 条</span><button type="button" class="pfh-sku-add-button" data-action="product-development-tasks-refresh" title="刷新本人开发任务" aria-label="刷新本人开发任务">↻</button>' + sidebarToggle + '</div>' + listTools;
    const userNote = state.productDevelopmentTaskUserName ? '<div class="pfh-list-note">开发人员：' + escapeHtml(state.productDevelopmentTaskUserName) + '</div>' : '';
    if (state.productDevelopmentTasksLoading && !tasks.length) return listHead + userNote + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll"><div class="pfh-empty">正在读取本人开发任务…</div></div></div>';
    if (state.productDevelopmentTaskError && !tasks.length) return listHead + userNote + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll"><div class="pfh-empty">' + escapeHtml(state.productDevelopmentTaskError) + '</div></div></div>';
    if (!items.length) return listHead + userNote + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll"><div class="pfh-empty">当前用户暂无开发人员字段匹配的产品任务</div></div></div>';
    const cards = items.map((item) => {
      const data = productDevelopmentTaskSeedData(item);
      const image = item.productListImageUrl || item.benchmarkImageUrl || data.productListImageUrl || data.benchmarkImageUrl || '';
      return skuListCardHtml(item, listMode, state.productDevelopmentTaskSelectedSku, {
        action: 'product-development-task-select',
        data,
        image,
        productName: item.name || data.name || '未命名产品',
      });
    }).join('');
    const pager = '<div class="pfh-list-pager"><div><button type="button" data-action="product-development-task-page" data-page="prev"' + (page <= 1 ? ' disabled' : '') + '>‹</button>' + renderCompactPager('product-development-task-page-goto', page, totalPages) + '<button type="button" data-action="product-development-task-page" data-page="next"' + (page >= totalPages ? ' disabled' : '') + '>›</button></div></div>';
    return listHead + userNote + '<div class="pfh-sku-list-content"><div class="pfh-sku-scroll' + (listMode === 'waterfall' ? ' is-waterfall' : '') + '" data-scroll-context="product-development-tasks|' + listMode + '|' + page + '">' + (listMode === 'waterfall' ? '<div class="pfh-sku-waterfall-grid">' + cards + '</div>' : cards) + '</div>' + pager + '</div>';
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

  function productDevelopmentReadonlyOptionLabel(attr, rawValue) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    const labels = [];
    const options = Array.isArray(attr && attr.option_list_json) ? attr.option_list_json : [];
    const multiGroups = Array.isArray(attr && attr.multi_attr_value_options_json) ? attr.multi_attr_value_options_json : [];
    const multiOptions = multiGroups.flatMap((group) => Array.isArray(group && group.options) ? group.options : []);
    values.forEach((value) => {
      const key = String(value);
      const option = options.find((item) => String(item && item.value) === key);
      const multi = multiOptions.find((item) => String(item && (item.id !== undefined ? item.id : item.value)) === key);
      const optionLabel = option && Array.isArray(option.option_label_list) && option.option_label_list[0] && option.option_label_list[0].label;
      labels.push(String(optionLabel || multi && multi.mult_attr_value_name || value || '').trim());
    });
    return labels.filter(Boolean).join('、');
  }

  function productDevelopmentReadonlyValueText(value, attr) {
    if (value === null || value === undefined || value === '') return '';
    if (Array.isArray(value)) {
      const label = productDevelopmentReadonlyOptionLabel(attr, value);
      return label || value.map((item) => productDevelopmentReadonlyValueText(item, attr)).filter(Boolean).join('、');
    }
    if (typeof value === 'object') {
      const fileName = value.file_name || value.fileName || value.original_file_name || value.originalFileName;
      if (fileName) return String(fileName);
      return Object.values(value).map((item) => productDevelopmentReadonlyValueText(item, attr)).filter(Boolean).join('、');
    }
    const text = String(value).replace(/\r\n?/g, '\n').trim();
    if (!text || text === '[]' || text === '{}') return '';
    return text.length > 800 ? text.slice(0, 800) + '…' : text;
  }

  function productDevelopmentReadonlyDimensionText(value) {
    const text = productDevelopmentCleanText(value, 200);
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)/i);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  }

  function productDevelopmentMaterialNumber(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().replace(/,/g, '');
    if (!text) return null;
    const number = Number(text);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function productDevelopmentMaterialNumberText(value, digits) {
    const number = productDevelopmentMaterialNumber(value);
    if (number === null) return '';
    const precision = Number.isInteger(digits) ? digits : 6;
    return String(Number(number.toFixed(precision)));
  }

  function productDevelopmentMaterialDimensions(value) {
    const text = productDevelopmentCleanText(value, 240);
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)(?:\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?))?/i);
    if (!match) return { length: '', width: '', height: '' };
    return {
      length: match[1] || '',
      width: match[2] || '',
      height: match[3] || '',
    };
  }

  function productDevelopmentMaterialExistingRow(detail, kind) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    return rows.find((row) => {
      if (!row) return false;
      const materialType = Number(row.materialType);
      const text = [row.name, row.category, row.specification].map((value) => String(value || '')).join(' ');
      return kind === 'box'
        ? materialType === 0 || /纸盒/.test(text)
        : materialType === 1 || /标签/.test(text);
    }) || null;
  }

  function productDevelopmentMaterialBaseName(task, detail) {
    const meta = getProductDevelopmentTaskMeta(task, detail);
    return productDevelopmentCleanText(
      meta.productNameCn || detail && detail.productNameCn || task && task.name || detail && detail.name || detail && detail.sku,
      180,
    );
  }

  function productDevelopmentMaterialPackSpec(detail) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    const finishedProduct = rows.find((row) => row && row.type === '成品' && row.specification);
    if (finishedProduct) return productDevelopmentCleanText(finishedProduct.specification, 160);
    const specification = Array.isArray(detail && detail.requiredFields)
      ? detail.requiredFields.find((field) => field && field.key === 'specification')
      : null;
    return productDevelopmentCleanText(specification && (specification.displayValue || specification.value), 160);
  }

  function productDevelopmentMaterialDefaultName(kind, baseName, draft) {
    const base = productDevelopmentCleanText(baseName, 180);
    const shelfLife = productDevelopmentCleanText(draft.shelfLife || '食品两年', 40);
    if (kind === 'label') {
      const shape = productDevelopmentCleanText(draft.labelShape || '圆弧', 40);
      return [base, '标签（' + shape + ' ' + shelfLife + '）'].filter(Boolean).join('');
    }
    const insertCard = draft.insertCard ? '内卡 ' : '';
    return [base, '纸盒（' + insertCard + shelfLife + '）'].filter(Boolean).join('');
  }

  function productDevelopmentMaterialDefaultSpecification(kind, draft) {
    const packSpec = productDevelopmentCleanText(draft.packSpec, 160);
    const length = productDevelopmentMaterialNumberText(draft.length, 2);
    const width = productDevelopmentMaterialNumberText(draft.width, 2);
    const height = productDevelopmentMaterialNumberText(draft.height, 2);
    const dimensionText = kind === 'box'
      ? (length && width && height ? length + 'x' + width + 'x' + height + 'cm' : '')
      : (length && width ? length + 'x' + width + 'cm（' + productDevelopmentCleanText(draft.adhesive || '玻璃加粘', 60) + '）' : '');
    return [packSpec, dimensionText].filter(Boolean).join('，');
  }

  function productDevelopmentCalculatePaperBoxPrice(draft) {
    const length = productDevelopmentMaterialNumber(draft && draft.length);
    const width = productDevelopmentMaterialNumber(draft && draft.width);
    const height = productDevelopmentMaterialNumber(draft && draft.height);
    const quantity = Number(draft && draft.quantity || 0);
    const rule = PRODUCT_DEVELOPMENT_BOX_QUANTITY_OPTIONS.find((item) => item.value === quantity);
    if (length === null || width === null || height === null || !rule) return '';
    const front = 2 * (length + width) + 1.5;
    const side = height + 2 * width + 3;
    const raw = front * side / 10000 * rule.factor;
    let price = Math.max(raw, rule.minPrice);
    if (draft.thicken) price *= 1.2;
    if (draft.insertCard) price *= 2;
    if (draft.multiPage) price += 0.02;
    return String(Number(price.toFixed(2)));
  }

  function productDevelopmentCalculateLabelPrice(draft) {
    const length = productDevelopmentMaterialNumber(draft && draft.length);
    const width = productDevelopmentMaterialNumber(draft && draft.width);
    if (length === null || width === null) return '';
    const price = Math.max((length / 100) * (width / 100) * 9, 0.04);
    return String(Number(price.toFixed(6)));
  }

  function productDevelopmentCalculateMaterialPrice(kind, draft) {
    return kind === 'box'
      ? productDevelopmentCalculatePaperBoxPrice(draft)
      : productDevelopmentCalculateLabelPrice(draft);
  }

  function productDevelopmentNormalizeMaterialDraft(rawValue, kind, detail, task) {
    const defaults = PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS[kind];
    const raw = rawValue && typeof rawValue === 'object' ? rawValue : {};
    const existing = productDevelopmentMaterialExistingRow(detail, kind);
    const dimensions = productDevelopmentMaterialDimensions(existing && existing.specification);
    const baseName = productDevelopmentMaterialBaseName(task, detail);
    const packSpec = productDevelopmentCleanText(raw.packSpec || productDevelopmentMaterialPackSpec(detail), 160);
    const hasName = Object.prototype.hasOwnProperty.call(raw, 'materialName');
    const hasSpecification = Object.prototype.hasOwnProperty.call(raw, 'specification');
    const nameSource = String(raw.nameSource || (hasName ? 'manual' : existing && existing.name ? 'plm' : 'generated'));
    const specificationSource = String(raw.specificationSource || (hasSpecification ? 'manual' : 'generated'));
    const dimensionValue = (rawKey, existingValue, parsedValue) => {
      if (raw[rawKey] !== undefined && raw[rawKey] !== null && String(raw[rawKey]).trim() !== '') return raw[rawKey];
      if (existingValue !== undefined && existingValue !== null && String(existingValue).trim() !== '') return existingValue;
      return parsedValue;
    };
    const draft = {
      kind,
      enabled: raw.enabled !== false && raw.removed !== true,
      label: defaults.label,
      materialType: defaults.materialType,
      categoryId: String(raw.categoryId || defaults.categoryId),
      categoryPath: productDevelopmentCleanText(raw.categoryPath || defaults.categoryPath, 160),
      supplierId: String(raw.supplierId || defaults.supplierId),
      supplier: productDevelopmentCleanText(raw.supplier || defaults.supplier, 180),
      usage: String(raw.usage || defaults.usage || '1'),
      projectId: String(raw.projectId || detail && detail.projectId || task && task.projectId || ''),
      productCode: String(raw.productCode || detail && detail.sku || task && task.sku || '').trim().toUpperCase(),
      materialId: productDevelopmentCleanText(raw.materialId || existing && existing.materialId, 80),
      code: productDevelopmentCleanText(raw.code || existing && existing.code, 100),
      joinId: productDevelopmentCleanText(raw.joinId || existing && existing.joinId, 100),
      pics: Array.isArray(raw.pics) ? raw.pics.slice(0, 3) : (Array.isArray(existing && existing.pics) ? existing.pics.slice(0, 3) : []),
      packSpec,
      shelfLife: productDevelopmentCleanText(raw.shelfLife || defaults.shelfLife, 40),
      labelShape: productDevelopmentCleanText(raw.labelShape || defaults.labelShape, 40),
      adhesive: productDevelopmentCleanText(raw.adhesive || defaults.adhesive, 60),
      length: productDevelopmentMaterialNumberText(dimensionValue('length', existing && existing.length, dimensions.length), 2),
      width: productDevelopmentMaterialNumberText(dimensionValue('width', existing && existing.width, dimensions.width), 2),
      height: kind === 'box'
        ? productDevelopmentMaterialNumberText(dimensionValue('height', existing && existing.height, dimensions.height), 2)
        : '',
      quantity: kind === 'box' ? Math.max(1, Math.min(7, Number(raw.quantity || 1) || 1)) : '',
      multiPage: kind === 'box' ? Boolean(raw.multiPage) : false,
      insertCard: kind === 'box' ? (raw.insertCard !== undefined ? Boolean(raw.insertCard) : Boolean(existing && /内卡/.test(existing.name || ''))) : false,
      thicken: kind === 'box' ? Boolean(raw.thicken) : false,
      nameSource,
      specificationSource,
      materialName: hasName
        ? productDevelopmentCleanText(raw.materialName, 240)
        : productDevelopmentCleanText(existing && existing.name, 240),
      specification: hasSpecification
        ? productDevelopmentCleanText(raw.specification, 240)
        : productDevelopmentCleanText(existing && existing.specification, 240),
      price: productDevelopmentCleanText(raw.price !== undefined ? raw.price : existing && existing.price, 40),
    };
    if (!draft.materialName && draft.nameSource !== 'manual') draft.materialName = productDevelopmentMaterialDefaultName(kind, baseName, draft);
    if (!draft.specification && draft.specificationSource !== 'manual') draft.specification = productDevelopmentMaterialDefaultSpecification(kind, draft);
    const calculatedPrice = productDevelopmentCalculateMaterialPrice(kind, draft);
    if (calculatedPrice !== '') draft.price = calculatedPrice;
    return draft;
  }

  function productDevelopmentNormalizeMaterialDrafts(value, detail, task) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      box: productDevelopmentNormalizeMaterialDraft(source.box, 'box', detail, task),
      label: productDevelopmentNormalizeMaterialDraft(source.label, 'label', detail, task),
    };
  }

  function productDevelopmentEnsureMaterialDrafts(detail, task) {
    if (!detail || typeof detail !== 'object') return { value: { box: {}, label: {} }, changed: false };
    const normalized = productDevelopmentNormalizeMaterialDrafts(detail.materialDrafts, detail, task);
    const previous = JSON.stringify(detail.materialDrafts || null);
    const next = JSON.stringify(normalized);
    if (previous !== next) detail.materialDrafts = normalized;
    return { value: normalized, changed: previous !== next };
  }

  function productDevelopmentSetMaterialEnabled(sku, kind, enabled) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || !['box', 'label'].includes(kind)) return false;
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) return false;
    const task = getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {};
    productDevelopmentEnsureMaterialDrafts(detail, task);
    const draft = detail.materialDrafts && detail.materialDrafts[kind];
    if (!draft) return false;
    draft.enabled = Boolean(enabled);
    detail.bomDraftDirty = true;
    detail.bomDraftSaveState = 'dirty';
    detail.bomPlmSaveState = '';
    detail.bomPlmSaveMessage = '';
    detail.cacheSource = 'local-cache';
    scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    state.productDevelopmentStatus = (enabled ? '已恢复' : '已移除') + (kind === 'box' ? '纸盒' : '标签') + '本地填写卡片';
    showToast(state.productDevelopmentStatus);
    renderShell();
    return true;
  }

  function productDevelopmentRecalculateMaterialDraft(kind, draft, detail, task) {
    if (!draft) return;
    const baseName = productDevelopmentMaterialBaseName(task, detail);
    const calculatedPrice = productDevelopmentCalculateMaterialPrice(kind, draft);
    draft.price = calculatedPrice;
    if (draft.nameSource !== 'manual') draft.materialName = productDevelopmentMaterialDefaultName(kind, baseName, draft);
    if (draft.specificationSource !== 'manual') draft.specification = productDevelopmentMaterialDefaultSpecification(kind, draft);
  }

  function productDevelopmentApiNumber(value, fallback) {
    if (value === null || value === undefined || String(value).trim() === '') return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function productDevelopmentMaterialDraftPayload(draft) {
    const projectId = productDevelopmentApiNumber(draft.projectId, draft.projectId);
    const categoryId = productDevelopmentApiNumber(draft.categoryId, draft.categoryId);
    const supplierId = productDevelopmentApiNumber(draft.supplierId, draft.supplierId);
    const materialId = productDevelopmentApiNumber(draft.materialId, null);
    return {
      id: materialId,
      pics: Array.isArray(draft.pics) ? draft.pics.slice(0, 3) : [],
      material_name: draft.materialName,
      project_id: projectId,
      category_id: categoryId,
      specification: draft.specification,
      w: productDevelopmentApiNumber(draft.width, null),
      h: productDevelopmentApiNumber(draft.height, null),
      l: productDevelopmentApiNumber(draft.length, null),
      product_code: draft.productCode,
      default_supplier_id: supplierId,
      sale_price: productDevelopmentApiNumber(draft.price, 0),
      material_type: Number(draft.materialType),
    };
  }

  function productDevelopmentMaterialDraftMissingFields(kind, draft) {
    const missing = [];
    if (!productDevelopmentCleanText(draft && draft.materialName, 240)) missing.push(kind === 'box' ? '纸盒物料名称' : '标签物料名称');
    if (!productDevelopmentCleanText(draft && draft.specification, 240)) missing.push(kind === 'box' ? '纸盒规格型号' : '标签规格型号');
    ['length', 'width'].concat(kind === 'box' ? ['height'] : []).forEach((field) => {
      if (productDevelopmentMaterialNumber(draft && draft[field]) === null) missing.push((kind === 'box' ? '纸盒' : '标签') + field);
    });
    if (productDevelopmentMaterialNumber(draft && draft.price) === null) missing.push((kind === 'box' ? '纸盒' : '标签') + '采购价');
    return missing;
  }

  function productDevelopmentMaterialBatchPayload(row) {
    const joinId = productDevelopmentApiNumber(row && row.joinId, null);
    if (joinId === null || !row) return null;
    const isFinishedProduct = Number(row.typeValue) === 1 || row.type === '成品';
    const code = productDevelopmentCleanText(row.code || (isFinishedProduct ? row.productCode : ''), 100);
    if (!code) return null;
    const materialId = productDevelopmentApiNumber(row.materialId, null);
    const productMainId = productDevelopmentApiNumber(row.productMainId, null);
    const materialType = row.materialType === '' || row.materialType === null || row.materialType === undefined
      ? null
      : productDevelopmentApiNumber(row.materialType, null);
    const hasTypeValue = row.typeValue !== '' && row.typeValue !== null && row.typeValue !== undefined;
    const type = hasTypeValue && Number.isFinite(Number(row.typeValue)) ? Number(row.typeValue) : (row.type === '成品' ? 1 : 2);
    return {
      id: joinId,
      pics: row.pics === null ? null : (Array.isArray(row.pics) ? row.pics.slice(0, 20) : []),
      code,
      material_id: materialId,
      material_type: materialType,
      usage_value: productDevelopmentApiNumber(row.usage, 1),
      product_main_id: productMainId,
      type,
    };
  }

  function productDevelopmentBomPricingPayload(row) {
    const joinId = productDevelopmentApiNumber(row && row.joinId, null);
    const price = productDevelopmentMaterialNumber(row && row.price);
    if (joinId === null || price === null) return null;
    return {
      id: joinId,
      suggested_purchase_price: price,
      is_pricing: 0,
      usage_value: productDevelopmentApiNumber(row.usage, 1),
      material_purchase_price: price,
    };
  }

  function productDevelopmentApiList(payload) {
    return productDevelopmentReadonlyList(payload);
  }

  async function productDevelopmentResolveProductMainId(task, detail, rows) {
    const existing = (Array.isArray(rows) ? rows : []).find((row) => row && (Number(row.typeValue) === 1 || row.type === '成品') && row.productMainId);
    if (existing && existing.productMainId) return String(existing.productMainId);
    const direct = detail && (detail.productMainId || detail.product_main_id)
      || task && (task.productMainId || task.product_main_id)
      || state.data && (state.data.productMainId || state.data.product_main_id);
    if (direct) return String(direct);
    const sku = String(detail && detail.sku || task && task.sku || '').trim().toUpperCase();
    if (!sku) return '';
    const payload = await fetchPlmJson('/api/ProjectFormData/GetProductList?type=1&codes_precise=' + encodeURIComponent(sku));
    const list = productDevelopmentApiList(payload);
    const product = list.find((item) => String(item && (item.code || item.product_code || '')).trim().toUpperCase() === sku) || list[0];
    return String(product && (product.id || product.product_main_id || product.productMainId) || '').trim();
  }

  async function productDevelopmentReadBomRows(projectId) {
    const paths = [
      '/api/ChemicalNewDevTask/GetProjectPMJoinList?id=' + encodeURIComponent(projectId),
      '/api/ChemicalNewAll/GetProjectPMJoinList?id=' + encodeURIComponent(projectId),
    ];
    const results = await Promise.allSettled(paths.map((path) => fetchPlmJson(path)));
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    if (!fulfilled.length) throw (results[0] && results[0].reason) || new Error('BOM 读取接口不可用');
    const rows = [];
    const seen = new Set();
    fulfilled.forEach((result) => {
      productDevelopmentReadonlyList(result.value).forEach((source) => {
        const row = productDevelopmentReadonlyBomRow(source);
        if (!row.code && !row.name) return;
        const key = row.joinId || [row.typeValue, row.materialId, row.productMainId, row.code, row.name].join('|');
        if (seen.has(key)) return;
        seen.add(key);
        rows.push(row);
      });
    });
    return rows;
  }

  async function productDevelopmentSaveBomToPlm(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const task = getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {};
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) throw new Error('当前 SKU 详情还未读取完成');
    if (typeof fetchPlmApiJson !== 'function') throw new Error('当前脚本没有可用的 PLM 写入请求能力');
    const projectId = String(detail.projectId || task.projectId || task.rowId || '').trim();
    if (!/^\d+$/.test(projectId)) throw new Error('当前开发任务缺少有效项目 ID');
    productDevelopmentEnsureMaterialDrafts(detail, task);
    const drafts = [
      ['box', detail.materialDrafts.box],
      ['label', detail.materialDrafts.label],
    ].filter(([, draft]) => draft && draft.enabled !== false);
    const missing = drafts.flatMap(([kind, draft]) => productDevelopmentMaterialDraftMissingFields(kind, draft));
    if (missing.length) throw new Error('请先补充 BOM：' + missing.join('、'));
    let rows = Array.isArray(detail.bomRows) ? detail.bomRows.slice() : [];
    const productMainId = await productDevelopmentResolveProductMainId(task, detail, rows);
    if (!productMainId && !rows.some((row) => Number(row && row.typeValue) === 1 || row && row.type === '成品')) {
      throw new Error('未找到当前 SKU 的已建品主产品，无法绑定 BOM');
    }
    const hasProduct = rows.some((row) => Number(row && row.typeValue) === 1 || row && row.type === '成品');
    if (!hasProduct && productMainId) {
      await fetchPlmApiJson('/api/ChemicalNewBom/AddBatchProjectPMJoin', {
        project_id: productDevelopmentApiNumber(projectId, projectId),
        material_ids: [],
        product_ids: [productDevelopmentApiNumber(productMainId, productMainId)],
      });
      rows = await productDevelopmentReadBomRows(projectId);
    }
    for (const [, draft] of drafts) {
      const response = await fetchPlmApiJson('/api/ChemicalNewBom/SaveMaterialDraftOfProduct', productDevelopmentMaterialDraftPayload(draft));
      const data = response && response.data && typeof response.data === 'object' ? response.data : {};
      if (data.id !== undefined && data.id !== null) draft.materialId = String(data.id);
      if (data.code) draft.code = productDevelopmentCleanText(data.code, 100);
    }
    rows = await productDevelopmentReadBomRows(projectId);
    const missingMaterialIds = drafts
      .map(([, draft]) => String(draft.materialId || '').trim())
      .filter((materialId) => materialId && !rows.some((row) => String(row.materialId || '').trim() === materialId));
    if (missingMaterialIds.length) {
      await fetchPlmApiJson('/api/ChemicalNewBom/AddBatchProjectPMJoin', {
        project_id: productDevelopmentApiNumber(projectId, projectId),
        material_ids: missingMaterialIds.map((value) => productDevelopmentApiNumber(value, value)),
        product_ids: [],
      });
      rows = await productDevelopmentReadBomRows(projectId);
    }
    drafts.forEach(([, draft]) => {
      const row = rows.find((item) => String(item.materialId || '').trim() === String(draft.materialId || '').trim() || String(item.code || '').trim() === String(draft.code || '').trim());
      if (!row) return;
      draft.joinId = row.joinId;
      draft.code = row.code || draft.code;
      draft.materialId = row.materialId || draft.materialId;
    });
    const batchMaterials = rows.map(productDevelopmentMaterialBatchPayload).filter(Boolean);
    const savedDraftJoinIds = drafts.map(([, draft]) => String(draft.joinId || '').trim()).filter(Boolean);
    const productBinding = batchMaterials.find((item) => Number(item.type) === 1);
    if (!productBinding) throw new Error('未读取到成品绑定行，物料未提交，请刷新 BOM 后重试');
    if (savedDraftJoinIds.some((joinId) => !batchMaterials.some((item) => String(item.id) === joinId))) throw new Error('PLM 已保存物料，但未读取到对应 BOM 绑定行，请刷新后重试');
    const syncPayload = await fetchPlmApiJson('/api/ChemicalNewBom/MaterialBatchSaveAndSyncToProduct', {
      project_id: productDevelopmentApiNumber(projectId, projectId),
      materials: batchMaterials,
      effect_picture_files: [],
    });
    const pricing = rows.map(productDevelopmentBomPricingPayload).filter(Boolean);
    if (pricing.length) await fetchPlmApiJson('/api/ChemicalNewBom/SaveBomPricing', pricing);
    detail.bomRows = rows;
    detail.bomDraftDirty = false;
    detail.bomDraftSavedAt = new Date().toLocaleString();
    detail.bomDraftSaveState = 'saved';
    detail.bomDraftSaveMessage = '已同步 PLM · ' + detail.bomDraftSavedAt;
    const syncMessage = syncPayload && typeof syncPayload.data === 'string' ? syncPayload.data : '';
    detail.bomPlmSaveMessage = syncMessage && /未建品|无法同步图片/.test(syncMessage)
      ? 'BOM 已保存到 PLM；项目未建品，图片同步已跳过'
      : 'BOM 已保存到 PLM';
    detail.bomPlmSaveState = 'saved';
    detail.cacheSource = 'local-cache';
    saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    return { warning: syncMessage, rows };
  }

  function productDevelopmentSaveBomLocally(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) {
      showToast('当前 SKU 详情还未读取完成');
      return false;
    }
    productDevelopmentEnsureMaterialDrafts(detail, getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {});
    detail.bomDraftDirty = false;
    detail.bomDraftSavedAt = new Date().toLocaleString();
    detail.bomDraftSaveState = 'saved';
    detail.bomDraftSaveMessage = 'BOM 已保存到本地';
    detail.bomPlmSaveState = '';
    detail.cacheSource = 'local-cache';
    saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    state.productDevelopmentStatus = 'BOM 已保存到本地';
    showToast('BOM 已保存到本地');
    renderShell();
    return true;
  }

  function productDevelopmentRunBomPlmSave(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentBomSaveSku) return;
    if (typeof window.confirm === 'function' && !window.confirm('确认将当前启用的 BOM 物料和成品绑定保存到 PLM？已移除的纸盒/标签不会新建；已有 PLM 绑定不会自动删除。')) return;
    state.productDevelopmentBomSaveSku = normalizedSku;
    state.productDevelopmentStatus = '正在保存 BOM 到 PLM…';
    state.productDevelopmentError = '';
    renderShell();
    productDevelopmentSaveBomToPlm(normalizedSku).then((result) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      const message = detail && detail.bomPlmSaveMessage || 'BOM 已保存到 PLM';
      state.productDevelopmentStatus = message;
      showToast(message);
      if (result && result.warning && /未建品|无法同步图片/.test(result.warning)) showToast('PLM 提示：项目未建品，图片同步已跳过');
    }).catch((error) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      if (detail) {
        detail.bomPlmSaveState = 'error';
        detail.bomPlmSaveMessage = '保存到 PLM 失败：' + formatErrorMessage(error);
        detail.cacheSource = 'local-cache';
        scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      }
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentBomSaveSku = '';
      renderShell();
    });
  }

  function productDevelopmentReadonlyBomRow(row) {
    const source = row && typeof row === 'object' ? row : {};
    const value = (...keys) => {
      for (const key of keys) {
        if (source[key] !== undefined && source[key] !== null && source[key] !== '') return source[key];
      }
      return '';
    };
    const rawPics = source.pics !== undefined ? source.pics : value('picture_files', 'pictureFiles');
    let pics = rawPics;
    if (typeof rawPics === 'string') {
      try { pics = JSON.parse(rawPics); } catch (error) { pics = []; }
    }
    return {
      joinId: String(value('id', 'join_id', 'joinId')).trim(),
      productId: String(value('product_id', 'productId')).trim(),
      productMainId: String(value('product_main_id', 'productMainId', 'product_version_id', 'productVersionId')).trim(),
      materialId: String(value('material_id', 'materialId')).trim(),
      pics: rawPics === null ? null : (Array.isArray(pics) ? pics.slice(0, 20) : []),
      typeValue: value('type', 'type_value', 'typeValue') === '' ? '' : Number(value('type', 'type_value', 'typeValue')),
      type: Number(value('type', 'type_value', 'typeValue')) === 1 ? '成品' : '物料',
      code: productDevelopmentCleanText(value('code', 'material_code', 'materialCode'), 100),
      name: productDevelopmentCleanText(value('name', 'material_name', 'materialName', 'product_name', 'productName'), 180),
      category: productDevelopmentCleanText(value('category_name', 'categoryName', 'category'), 180),
      specification: productDevelopmentCleanText(value('properties_value', 'propertiesValue', 'specification'), 220),
      usage: value('usage_value', 'usageValue', 'usage') === '' ? '' : String(value('usage_value', 'usageValue', 'usage')),
      materialType: value('material_type', 'materialType') === '' ? '' : String(value('material_type', 'materialType')),
      supplier: productDevelopmentCleanText(value('default_supplier_name', 'defaultSupplierName', 'supplier'), 180),
      supplierId: String(value('default_supplier_id', 'defaultSupplierId', 'supplierId')).trim(),
      price: value('sale_price', 'salePrice', 'purchase_price', 'purchasePrice') === '' ? '' : String(value('sale_price', 'salePrice', 'purchase_price', 'purchasePrice')),
      length: value('material_length', 'materialLength', 'length'),
      width: value('material_width', 'materialWidth', 'width'),
      height: value('material_height', 'materialHeight', 'height'),
    };
  }

  function productDevelopmentReadonlyFieldValue(attrs, definition, info, bomRows) {
    const attr = attrs.find((item) => Number(item && item.attr_id) === Number(definition.attrId)
      || String(item && item.variable_name || '') === String(definition.key || ''));
    let value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
    let source = value !== '' && value !== null && value !== undefined ? 'PLM 建品详情' : '';
    const paperBox = bomRows.find((row) => /纸盒/.test(row.name + row.category));
    const finishedProduct = bomRows.find((row) => row.type === '成品');
    if (!productDevelopmentReadonlyValueText(value, attr) && definition.key === 'specification') {
      value = finishedProduct && finishedProduct.specification || paperBox && paperBox.specification || '';
      source = value ? 'BOM 自动带出' : '';
    }
    if (!productDevelopmentReadonlyValueText(value, attr) && ['long_outer_packaging', 'wide_outer_packaging', 'high_outer_packaging'].includes(definition.key)) {
      const dimensions = productDevelopmentReadonlyDimensionText(paperBox && paperBox.specification);
      const index = { long_outer_packaging: 0, wide_outer_packaging: 1, high_outer_packaging: 2 }[definition.key];
      value = dimensions ? dimensions[index] : (paperBox && [paperBox.length, paperBox.width, paperBox.height][index]);
      source = value !== undefined && value !== null && value !== '' ? 'BOM 自动带出' : '';
    }
    if (!productDevelopmentReadonlyValueText(value, attr) && definition.key === 'volume_outer_packaging') {
      const dimensions = ['long_outer_packaging', 'wide_outer_packaging', 'high_outer_packaging'].map((key) => {
        const item = PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS.find((candidate) => candidate.key === key);
        return Number(productDevelopmentReadonlyFieldValue(attrs, item, info, bomRows).value);
      });
      if (dimensions.every((item) => Number.isFinite(item) && item > 0)) {
        value = Number((dimensions[0] * dimensions[1] * dimensions[2]).toFixed(2));
        source = '尺寸计算';
      }
    }
    if (!productDevelopmentReadonlyValueText(value, attr) && info && info[definition.key] !== undefined) {
      value = info[definition.key];
      source = 'PLM 基础信息';
    }
    return {
      ...definition,
      value,
      displayValue: productDevelopmentReadonlyValueText(value, attr),
      source: source || '待人工补充',
      status: productDevelopmentReadonlyValueText(value, attr) ? '已预填' : '待补充',
      required: true,
      attr,
    };
  }

  function productDevelopmentReadonlyPriceFields(attrs, info, excludedDefinitions) {
    const excluded = new Set((Array.isArray(excludedDefinitions) ? excludedDefinitions : []).map((definition) => Number(definition && definition.attrId)));
    const definitions = [PRODUCT_DEVELOPMENT_PURCHASE_PRICE_FIELD].concat(PRODUCT_DEVELOPMENT_PRICE_FIELD_FALLBACKS.filter((definition) => !excluded.has(Number(definition.attrId))));
    return definitions.map((definition) => {
      const attr = attrs.find((item) => Number(item && item.attr_id) === Number(definition.attrId)
        || String(item && item.variable_name || '') === definition.key);
      let value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
      if (!productDevelopmentReadonlyValueText(value, attr) && info) {
        const infoValue = definition.key === 'procurement_rice'
          ? (info.procurement_rice !== undefined ? info.procurement_rice : info.purchase_price !== undefined ? info.purchase_price : info.purchasePrice !== undefined ? info.purchasePrice : info.procurement_price)
          : info[definition.key];
        if (infoValue !== undefined && infoValue !== null && infoValue !== '') value = infoValue;
      }
      return {
        ...definition,
        displayValue: productDevelopmentReadonlyValueText(value, attr),
        source: productDevelopmentReadonlyValueText(value, attr) ? 'PLM 建品详情' : '待人工填写',
        status: productDevelopmentReadonlyValueText(value, attr) ? '已预填' : '待补充',
      };
    });
  }

  function productDevelopmentReadonlyAttachmentFields(attrs) {
    return [
      { attrId: 418, label: '成分表 PDF' },
      { attrId: 365, label: '条码文件' },
      { attrId: 372, label: '产品正面图' },
      { attrId: 358, label: '产品文案 DOCX' },
    ].map((definition) => {
      const attr = attrs.find((item) => Number(item && item.attr_id) === definition.attrId);
      const value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
      return {
        ...definition,
        displayValue: productDevelopmentReadonlyValueText(value, attr),
        status: productDevelopmentReadonlyValueText(value, attr) ? '已读取' : '未读取',
      };
    });
  }

  function productDevelopmentReadonlyBaseFields(values) {
    return (Array.isArray(values) ? values : []).map((definition) => {
      const value = productDevelopmentCleanText(definition.value, 800);
      return {
        ...definition,
        value,
        displayValue: value,
        source: value ? (definition.source || '开发任务 / PLM 基础信息') : '待人工补充',
        status: value ? '已预填' : '待补充',
      };
    });
  }

  function productDevelopmentReadonlyProductFields(attrs, info, bomRows) {
    const sourceAttrs = Array.isArray(attrs) && attrs.length
      ? attrs
      : PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS.map((definition) => ({
        attr_id: definition.attrId,
        variable_name: definition.key,
        attr_name: definition.label,
        is_must: true,
        value: '',
      }));
    const priceAttrIds = new Set([Number(PRODUCT_DEVELOPMENT_PURCHASE_PRICE_FIELD.attrId)].concat(PRODUCT_DEVELOPMENT_PRICE_FIELD_FALLBACKS.map((definition) => Number(definition.attrId))));
    const seen = new Set();
    return sourceAttrs.map((attr) => {
      const attrId = Number(attr && attr.attr_id);
      const key = String(attr && attr.variable_name || (Number.isFinite(attrId) ? 'attr_' + attrId : '')).trim();
      if (priceAttrIds.has(attrId) || !key || seen.has(key)) return null;
      seen.add(key);
      const definition = {
        attrId: Number.isFinite(attrId) ? attrId : 0,
        key,
        label: productDevelopmentCleanText(attr && (attr.attr_name || attr.name) || '字段 ' + (attrId || key), 100),
        groupName: productDevelopmentCleanText(attr && attr.groupName || '建品字段', 100) || '建品字段',
        required: Boolean(attr && attr.is_must),
      };
      const derived = definition.required ? productDevelopmentReadonlyFieldValue(attrs, definition, info, bomRows) : null;
      const value = derived ? derived.value : productDevelopmentReadonlyAttrValue(attr, 1);
      const displayValue = derived ? derived.displayValue : productDevelopmentReadonlyValueText(value, attr);
      return {
        ...definition,
        value,
        displayValue,
        source: derived ? derived.source : (displayValue ? 'PLM 建品详情' : '待人工补充'),
        status: displayValue ? '已预填' : '待补充',
        attr,
      };
    }).filter(Boolean);
  }

  function productDevelopmentNormalizeReadonlyDetail(task, infoPayload, contentPayload, bomPayload, productSnapshot, categoryIdOverride) {
    const source = task || {};
    const info = productDevelopmentReadonlyPayloadData(infoPayload);
    const attrs = productDevelopmentReadonlyAttrs(contentPayload);
    const rawBomRows = Array.isArray(bomPayload) ? bomPayload : productDevelopmentReadonlyList(bomPayload);
    const bomRows = rawBomRows.map((row) => row && Object.prototype.hasOwnProperty.call(row, 'joinId') && Object.prototype.hasOwnProperty.call(row, 'typeValue')
      ? row
      : productDevelopmentReadonlyBomRow(row)).filter((row) => row.code || row.name);
    const categoryId = String(categoryIdOverride || info.category_id || source.categoryId || productSnapshot && productSnapshot.categoryId || '').trim();
    const categoryName = productDevelopmentCleanText(info.category_name || source.plmCategory || productSnapshot && productSnapshot.plmCategory, 180);
    const requiredDefinitions = attrs.filter((attr) => attr && attr.is_must).map((attr) => ({
      attrId: Number(attr.attr_id),
      key: String(attr.variable_name || 'attr_' + attr.attr_id),
      label: productDevelopmentCleanText(attr.attr_name || '字段 ' + attr.attr_id, 100),
    }));
    const definitions = (requiredDefinitions.length ? requiredDefinitions : PRODUCT_DEVELOPMENT_REQUIRED_FIELD_FALLBACKS).filter((item, index, list) => list.findIndex((candidate) => Number(candidate.attrId) === Number(item.attrId)) === index);
    const requiredFields = definitions.map((definition) => productDevelopmentReadonlyFieldValue(attrs, definition, info, bomRows));
    const productNameCn = productDevelopmentCleanText((info.language_config || []).find((item) => Number(item && item.language_id) === 1)?.product_name || source.name || productSnapshot && productSnapshot.chineseName, 180);
    const productNameEn = productDevelopmentCleanText((info.language_config || []).find((item) => Number(item && item.language_id) === 2)?.product_name || productSnapshot && productSnapshot.englishName, 180);
    const productId = String(info.product_id || source.productId || productSnapshot && productSnapshot.productId || '').trim();
    const productVersionId = String(info.product_version_id || source.productVersionId || productSnapshot && productSnapshot.productVersionId || '').trim();
    const productMainId = String(info.product_main_id || info.productMainId || source.productMainId || source.product_main_id || productSnapshot && (productSnapshot.productMainId || productSnapshot.product_main_id) || (bomRows.find((row) => row.type === '成品') || {}).productMainId || '').trim();
    const baseFields = productDevelopmentReadonlyBaseFields([
      { key: 'sku', label: 'SKU', value: source.sku, source: '开发任务' },
      { key: 'projectCode', label: '项目编码', value: source.projectCode, source: '开发任务' },
      { key: 'projectId', label: '项目 ID', value: source.projectId || source.rowId, source: '开发任务' },
      { key: 'productId', label: '产品 ID', value: productId, source: 'PLM 建品详情' },
      { key: 'productMainId', label: '成品主产品 ID', value: productMainId, source: 'PLM 建品详情 / BOM 成品绑定' },
      { key: 'productVersionId', label: '产品版本 ID', value: productVersionId, source: 'PLM 建品详情' },
      { key: 'categoryId', label: '分类 ID', value: categoryId, source: 'PLM 建品详情' },
      { key: 'categoryName', label: '分类名称', value: categoryName, source: 'PLM 建品详情' },
      { key: 'productNameCn', label: '产品中文名', value: productNameCn, source: 'PLM 建品详情' },
      { key: 'productNameEn', label: '产品英文名', value: productNameEn, source: 'PLM 建品详情' },
      { key: 'brand', label: '品牌', value: source.brand || productSnapshot && productSnapshot.brand, source: '开发任务 / PLM' },
      { key: 'productType', label: '产品类型', value: source.productType || productSnapshot && productSnapshot.productType, source: '开发任务 / PLM' },
      { key: 'developerName', label: '开发人员', value: source.developerName, source: '开发任务' },
      { key: 'projectStatus', label: '开发任务状态', value: source.projectStatus, source: '开发任务' },
    ]);
    const materialDraftDetail = {
      sku: source.sku,
      projectId: String(source.projectId || source.rowId || '').trim(),
      productMainId,
      productNameCn,
      productNameEn,
      name: source.name || productNameCn,
      bomRows,
      requiredFields,
    };
    return {
      sku: source.sku,
      projectId: String(source.projectId || source.rowId || '').trim(),
      projectCode: source.projectCode || '',
      categoryId,
      categoryName,
      productId: String(info.product_id || source.productId || productSnapshot && productSnapshot.productId || '').trim(),
      productMainId,
      productVersionId: String(info.product_version_id || source.productVersionId || productSnapshot && productSnapshot.productVersionId || '').trim(),
      productNameCn,
      productNameEn,
      reworkProductCode: productDevelopmentCleanText(info.rework_product_code || info.reworkProductCode || info.return_product_code || info.returnProductCode || source.reworkProductCode, 120),
      baseFields,
      brand: source.brand || productSnapshot && productSnapshot.brand || '',
      productType: source.productType || productSnapshot && productSnapshot.productType || '',
      productFields: productDevelopmentReadonlyProductFields(attrs, info, bomRows),
      requiredFields,
      priceFields: productDevelopmentReadonlyPriceFields(attrs, info, []),
      attachments: productDevelopmentReadonlyAttachmentFields(attrs),
      bomRows,
      materialDrafts: productDevelopmentNormalizeMaterialDrafts(null, materialDraftDetail, source),
      bomReadState: 'loaded',
      bomLoadedAt: Date.now(),
      readonly: true,
      loadedAt: new Date().toLocaleString(),
    };
  }

  function productDevelopmentCategoryNames(task, info, productSnapshot) {
    const raw = [
      task && task.plmCategory,
      task && task.categoryName,
      info && info.category_name,
      productSnapshot && productSnapshot.plmCategory,
      productSnapshot && productSnapshot.categoryName,
    ].map((value) => productDevelopmentCleanText(value, 180)).filter(Boolean).join('/');
    return Array.from(new Set(raw.split(/[\\/\\>＞|]+/).map((value) => value.trim()).filter(Boolean))).sort((a, b) => b.length - a.length);
  }

  async function productDevelopmentFindCategoryIdByName(task, info, productSnapshot) {
    const names = productDevelopmentCategoryNames(task, info, productSnapshot);
    if (!names.length) return '';
    const targetName = names[0];
    const visited = new Set();
    const pendingParents = [0];
    while (pendingParents.length && visited.size < 80) {
      const parentId = pendingParents.shift();
      if (visited.has(parentId)) continue;
      visited.add(parentId);
      let nodes = [];
      try {
        const payload = await fetchPlmJson('/api/ProjectFormData/GetCategorySelectOptionNew?types=1&parent_id=' + encodeURIComponent(parentId));
        nodes = productDevelopmentReadonlyList(payload);
      } catch (error) {
        continue;
      }
      for (const node of nodes) {
        const nodeName = productDevelopmentCleanText(node && node.name, 180);
        if (nodeName && (nodeName === targetName || targetName.endsWith('/' + nodeName))) return String(node.id || '').trim();
        const children = Array.isArray(node && node.children) ? node.children : [];
        children.forEach((child) => {
          if (child && child.id !== undefined) pendingParents.push(Number(child.id));
        });
        if (node && Number(node.exists_child) === 1 && node.id !== undefined) pendingParents.push(Number(node.id));
      }
    }
    return '';
  }

  async function fetchProductDevelopmentReadonlyDetail(task, productSnapshot) {
    const source = task || {};
    const projectId = String(source.projectId || source.rowId || '').trim();
    if (!/^\d+$/.test(projectId)) throw new Error('当前开发任务缺少项目 ID');
    const [infoPayload, bomRows] = await Promise.all([
      fetchPlmJson('/api/ChemicalNewDevTask/GetProductDetailInfo?id=' + encodeURIComponent(projectId)),
      productDevelopmentReadBomRows(projectId),
    ]);
    const info = productDevelopmentReadonlyPayloadData(infoPayload);
    const resolvedCategoryId = await productDevelopmentFindCategoryIdByName(source, info, productSnapshot).catch(() => '');
    const categoryCandidates = Array.from(new Set([
      resolvedCategoryId,
      info.category_id,
      source.categoryId,
      productSnapshot && productSnapshot.categoryId,
    ].map((value) => String(value || '').trim()).filter((value) => /^\d+$/.test(value))));
    let contentPayload = null;
    let categoryId = '';
    for (const candidate of categoryCandidates) {
      try {
        const candidatePayload = await fetchPlmJson('/api/ChemicalNewDevTask/GetProductDetailContent?id=' + encodeURIComponent(projectId) + '&category_id=' + encodeURIComponent(candidate));
        if (productDevelopmentReadonlyAttrs(candidatePayload).length) {
          contentPayload = candidatePayload;
          categoryId = candidate;
          break;
        }
      } catch (error) {
        // Try the next known category candidate.
      }
    }
    return productDevelopmentNormalizeReadonlyDetail(source, infoPayload, contentPayload, bomRows, productSnapshot, categoryId);
  }

  function productDevelopmentReadonlyFieldHtml(field, formSku) {
    const missing = !String(field.displayValue || '').trim();
    const value = field.displayValue === '待人工补充' || field.displayValue === '待人工填写' ? '' : field.displayValue || '';
    return '<label class="pfh-product-development-form-field' + (missing ? ' is-missing' : '') + '"><span>' + escapeHtml(field.label) + (field.required ? ' <i>必填</i>' : '') + '</span><input type="text" class="pfh-product-development-form-input" data-form-sku="' + escapeHtml(formSku || '') + '" data-form-group="' + escapeHtml(field.formGroup || 'required') + '" data-form-key="' + escapeHtml(field.key || '') + '" value="' + escapeHtml(value) + '" placeholder="' + escapeHtml(missing ? (field.displayValue || '待人工补充') : '') + '"></label>';
  }

  function productDevelopmentReadonlyBomFieldHtml(row, index, key, label, formSku) {
    const value = productDevelopmentReadonlyValueText(row && row[key], null);
    return productDevelopmentReadonlyFieldHtml({
      key: String(index) + '.' + key,
      label,
      displayValue: value,
      source: 'BOM 绑定数据',
      formGroup: 'bom',
    }, formSku);
  }

  function productDevelopmentReadonlyBomHtml(rows, formSku) {
    const definitions = [
      ['joinId', '绑定 ID'],
      ['type', 'BOM 类型'],
      ['code', '物料 / 成品编码'],
      ['name', '物料 / 成品名称'],
      ['category', '物料分类'],
      ['specification', '规格 / 属性'],
      ['materialType', '物料类型'],
      ['supplier', '默认供应商'],
      ['supplierId', '供应商 ID'],
      ['price', '采购 / 销售价'],
      ['usage', '用量'],
      ['length', '长度'],
      ['width', '宽度'],
      ['height', '高度'],
    ];
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return '<div class="pfh-product-development-form-empty">暂无 BOM 记录，可先在本地补充。</div>';
    return '<div class="pfh-product-development-file-list">' + list.map((row, index) => '<article class="pfh-product-development-card"><div class="pfh-product-development-card-head"><strong>BOM ' + (index + 1) + '</strong><i>' + escapeHtml(row.type || '未分类') + '</i></div><div class="pfh-product-development-form-grid">' + definitions.map((definition) => productDevelopmentReadonlyBomFieldHtml(row, index, definition[0], definition[1], formSku)).join('') + '</div></article>').join('') + '</div>';
  }

  function productDevelopmentMaterialInputHtml(sku, kind, field, label, value, options) {
    const config = options || {};
    const type = config.type || 'text';
    const readonly = config.readonly ? ' readonly' : '';
    const required = config.required ? ' <i>需确认</i>' : '';
    const inputValue = value === null || value === undefined ? '' : String(value);
    return '<label class="pfh-product-development-material-field' + (config.wide ? ' is-wide' : '') + (config.readonly ? ' is-readonly' : '') + '"><span>' + escapeHtml(label) + required + '</span><input type="' + escapeHtml(type) + '" inputmode="decimal" class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '" value="' + escapeHtml(inputValue) + '"' + readonly + (config.placeholder ? ' placeholder="' + escapeHtml(config.placeholder) + '"' : '') + '></label>';
  }

  function productDevelopmentMaterialSelectHtml(sku, kind, field, label, value, options) {
    const choices = Array.isArray(options) ? options : [];
    return '<label class="pfh-product-development-material-field"><span>' + escapeHtml(label) + '</span><select class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '">' + choices.map((option) => '<option value="' + escapeHtml(option.value) + '"' + (String(option.value) === String(value) ? ' selected' : '') + '>' + escapeHtml(option.label) + '</option>').join('') + '</select></label>';
  }

  function productDevelopmentMaterialRadioHtml(sku, kind, field, label, value) {
    return '<div class="pfh-product-development-material-option-group"><span>' + escapeHtml(label) + '</span><div><label><input type="radio" class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '" name="pd-material-' + escapeHtml(kind) + '-' + escapeHtml(field) + '-' + escapeHtml(sku) + '" value="true"' + (value ? ' checked' : '') + '>是</label><label><input type="radio" class="pfh-product-development-material-input" data-material-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-field="' + escapeHtml(field) + '" name="pd-material-' + escapeHtml(kind) + '-' + escapeHtml(field) + '-' + escapeHtml(sku) + '" value="false"' + (!value ? ' checked' : '') + '>否</label></div></div>';
  }

  function productDevelopmentFinishedProductBindingHtml(detail, task) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    const row = rows.find((item) => item && (Number(item.typeValue) === 1 || item.type === '成品')) || null;
    const sku = String(detail && detail.sku || task && task.sku || '').trim().toUpperCase();
    const productMainId = String(row && row.productMainId || detail && detail.productMainId || task && task.productMainId || '').trim();
    const code = productDevelopmentCleanText(row && row.code || sku, 100);
    const name = productDevelopmentCleanText(row && row.name || detail && detail.productNameCn || task && task.name || '当前 SKU 成品', 180);
    const specification = productDevelopmentCleanText(row && row.specification || productDevelopmentMaterialPackSpec(detail), 160);
    const status = row && row.joinId ? '已绑定' : (productMainId ? '待保存' : '未读取主产品');
    const statusClass = status === '已绑定' ? ' is-ready' : (status === '未读取主产品' ? ' is-missing' : '');
    return '<article class="pfh-product-development-product-binding"><header><div><strong>成品绑定</strong><span>type=1 · 与纸盒、标签一起提交</span></div><em class="' + statusClass + '">' + escapeHtml(status) + '</em></header><div class="pfh-product-development-binding-grid"><div><small>产品编码</small><b>' + escapeHtml(code || '待补充') + '</b></div><div><small>成品主产品 ID</small><b>' + escapeHtml(productMainId || '保存时按 SKU 查找') + '</b></div><div><small>产品名称</small><b>' + escapeHtml(name || '待补充') + '</b></div><div><small>规格型号</small><b>' + escapeHtml(specification || '按 PLM 成品记录') + '</b></div></div><p>只读绑定参考；保存到 PLM 时会校验成品绑定行。</p></article>';
  }

  function productDevelopmentMaterialCardHtml(kind, draft, sku, baseName) {
    const isBox = kind === 'box';
    const title = isBox ? '纸盒' : '标签';
    const materialType = isBox ? '0' : '1';
    if (!draft || draft.enabled === false) {
      return '<article class="pfh-product-development-material-card is-disabled"><header><div><strong>' + escapeHtml(title) + '（本地不需要）</strong><span>已从本地 BOM 填写和新建流程中移除</span></div><button type="button" data-action="product-development-bom-toggle-material" data-bom-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-enabled="true">恢复' + escapeHtml(title) + '</button></header><p>已有 PLM 绑定不会自动删除；如需重新填写，可点击恢复。</p></article>';
    }
    const priceText = draft.price || '填写尺寸后自动计算';
    const dimensionFields = isBox
      ? [
        productDevelopmentMaterialInputHtml(sku, kind, 'length', '长（正面，cm）', draft.length, { type: 'number', required: true }),
        productDevelopmentMaterialInputHtml(sku, kind, 'width', '宽（侧面，cm）', draft.width, { type: 'number', required: true }),
        productDevelopmentMaterialInputHtml(sku, kind, 'height', '高（cm）', draft.height, { type: 'number', required: true }),
      ].join('')
      : [
        productDevelopmentMaterialInputHtml(sku, kind, 'length', '长（cm）', draft.length, { type: 'number', required: true }),
        productDevelopmentMaterialInputHtml(sku, kind, 'width', '宽（cm）', draft.width, { type: 'number', required: true }),
      ].join('');
    const calculatorOptions = isBox
      ? '<div class="pfh-product-development-material-options"><strong>纸盒计算器选项</strong><div class="pfh-product-development-material-option-grid">' +
        productDevelopmentMaterialSelectHtml(sku, kind, 'quantity', '采购数量', draft.quantity, PRODUCT_DEVELOPMENT_BOX_QUANTITY_OPTIONS) +
        productDevelopmentMaterialRadioHtml(sku, kind, 'multiPage', '是否多页', draft.multiPage) +
        productDevelopmentMaterialRadioHtml(sku, kind, 'insertCard', '是否需内卡', draft.insertCard) +
        productDevelopmentMaterialRadioHtml(sku, kind, 'thicken', '是否需加厚', draft.thicken) +
        '</div></div>'
      : '<div class="pfh-product-development-material-defaults"><strong>标签默认规则</strong><span>圆弧 · 玻璃加粘 · 食品两年 · 用量 1</span></div>';
    return '<article class="pfh-product-development-material-card" data-material-card="' + escapeHtml(kind) + '"><header><div><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(baseName || sku) + ' · material_type=' + materialType + '</span></div><div class="pfh-product-development-material-card-actions"><em data-material-price-label="' + escapeHtml(kind) + '">采购价：' + escapeHtml(priceText) + (draft.price ? ' 元' : '') + '</em><button type="button" data-action="product-development-bom-toggle-material" data-bom-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-enabled="false">移除</button></div></header><div class="pfh-product-development-material-grid">' +
      productDevelopmentMaterialInputHtml(sku, kind, 'materialName', '物料名称', draft.materialName, { wide: true, required: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'categoryPath', '物料分类（默认）', draft.categoryPath, { readonly: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'specification', '规格型号', draft.specification, { required: true }) +
      dimensionFields +
      productDevelopmentMaterialInputHtml(sku, kind, 'supplier', '默认供应商', draft.supplier, { readonly: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'price', '采购价（自动）', priceText, { readonly: true }) +
      '</div>' + calculatorOptions + '<div class="pfh-product-development-material-binding-defaults">PLM 绑定默认：project_id=' + escapeHtml(draft.projectId || '当前项目') + ' · product_code=' + escapeHtml(draft.productCode || sku) + ' · category_id=' + escapeHtml(draft.categoryId) + ' · usage_value=' + escapeHtml(draft.usage || '1') + ' · type=2 · pics=[]</div></article>';
  }

  function productDevelopmentMaterialPlannerHtml(detail, task) {
    const formSku = String(detail && detail.sku || '').trim().toUpperCase();
    if (!formSku) return '';
    const ensured = productDevelopmentEnsureMaterialDrafts(detail, task);
    if (ensured.changed) {
      detail.cacheSource = 'local-cache';
      scheduleProductDevelopmentReadonlyDetailCache(formSku, detail);
    }
    const baseName = productDevelopmentMaterialBaseName(task, detail);
    const saveStatus = detail.bomDraftDirty
      ? '有未保存修改'
      : detail.bomDraftSaveMessage || (detail.bomDraftSavedAt ? '已保存本地 · ' + detail.bomDraftSavedAt : '尚未保存');
    const saveStatusClass = detail.bomDraftDirty ? ' is-dirty' : (detail.bomDraftSaveState === 'error' ? ' is-error' : (detail.bomDraftSavedAt ? ' is-saved' : ''));
    const plmBusy = state.productDevelopmentBomSaveSku === formSku;
    const plmStatus = detail.bomPlmSaveMessage ? '<p class="pfh-product-development-material-plm-status' + (detail.bomPlmSaveState === 'error' ? ' is-error' : ' is-saved') + '">' + escapeHtml(detail.bomPlmSaveMessage) + '</p>' : '';
    return '<section class="pfh-product-development-material-planner"><header><div><small>BOM FORM · LOCAL / PLM</small><h3>填写 BOM 物料</h3></div><div class="pfh-product-development-material-header-actions"><span class="pfh-product-development-material-save-status' + saveStatusClass + '">' + escapeHtml(saveStatus) + '</span><button type="button" data-action="product-development-bom-save-local" data-bom-sku="' + escapeHtml(formSku) + '">保存 BOM（本地）</button><button type="button" class="is-primary" data-action="product-development-bom-save-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (plmBusy ? ' disabled' : '') + '>' + (plmBusy ? '正在保存…' : '保存到 PLM') + '</button></div></header><p class="pfh-product-development-material-note">纸盒、标签可按产品需要移除；成品绑定会随启用的物料一起提交。尺寸、规格型号和计算器选项可手动调整。</p>' + plmStatus + productDevelopmentFinishedProductBindingHtml(detail, task) + '<div class="pfh-product-development-material-list">' + productDevelopmentMaterialCardHtml('box', ensured.value.box, formSku, baseName) + productDevelopmentMaterialCardHtml('label', ensured.value.label, formSku, baseName) + '</div></section>';
  }

  function productDevelopmentReadonlyAttachmentHtml(item, index, formSku) {
    const status = item && item.status ? item.status : '未读取';
    return '<article class="pfh-product-development-card"><div class="pfh-product-development-card-head"><strong>' + escapeHtml(item && item.label || '资料字段') + '</strong><i class="' + (status === '已读取' ? 'is-ready' : 'is-missing') + '">' + escapeHtml(status) + '</i></div><div class="pfh-product-development-form-grid">' + productDevelopmentReadonlyFieldHtml({
      key: String(index) + '.displayValue',
      label: '文件值 / 路径',
      displayValue: item && item.displayValue || '',
      source: '建品资料字段 ID ' + String(item && item.attrId || ''),
      formGroup: 'attachments',
    }, formSku) + '</div></article>';
  }

  function productDevelopmentReadonlyDetailHtml(detail) {
    if (!detail) return '<section class="pfh-product-development-detail-form"><header><div><small>PRODUCT DETAIL</small><h3>产品详情预填表单</h3></div><span>正在读取只读字段…</span></header><div class="pfh-product-development-form-empty">正在读取 BOM 和建品字段；默认不写入 PLM。</div></section>';
    const formSku = String(detail.sku || '').trim().toUpperCase();
    const localNaming = state.productDevelopmentReview && state.productDevelopmentReview.sku === formSku
      ? productDevelopmentNormalizeProductNaming(state.productDevelopmentReview.productNaming)
      : null;
    const localNamingMeta = localNaming && (localNaming.chineseProductName || localNaming.englishProductName)
      ? '<span>本地建议中文名：<b>' + escapeHtml(localNaming.chineseProductName || '待补充') + '</b></span><span>本地建议英文名：<b>' + escapeHtml(localNaming.englishProductName || '待补充') + '</b></span>'
      : '';
    const baseFields = detail.baseFields || [];
    const productFields = Array.isArray(detail.productFields) && detail.productFields.length ? detail.productFields : (detail.requiredFields || []);
    const productFieldGroups = new Map();
    productFields.forEach((field) => {
      const title = String(field && field.groupName || '建品字段').trim() || '建品字段';
      if (!productFieldGroups.has(title)) productFieldGroups.set(title, []);
      productFieldGroups.get(title).push(field);
    });
    const productFieldSections = Array.from(productFieldGroups.entries()).map(([title, fields]) => '<section class="pfh-product-development-form-section"><h4>建品字段 · ' + escapeHtml(title) + '（' + fields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + fields.map((field) => productDevelopmentReadonlyFieldHtml({ ...field, formGroup: 'product' }, formSku)).join('') + '</div></section>').join('');
    const fieldGroups = [
      { title: '建品基础信息', key: 'base', fields: baseFields },
      { title: '价格信息（采购价和三档价格人工确认）', key: 'price', fields: detail.priceFields || [] },
    ];
    const attachments = (detail.attachments || []).map((item, index) => productDevelopmentReadonlyAttachmentHtml(item, index, formSku)).join('');
    const sourceHint = detail.cacheSource === 'local-cache'
      ? '本地缓存 · 点击“刷新资料”重新读取 PLM'
      : '已读取 PLM · 可本地填写 · 更新时间 ' + String(detail.loadedAt || '');
    return '<section class="pfh-product-development-detail-form"><header><div><small>PRODUCT DETAIL</small><h3>产品详情预填表单</h3></div><span>' + escapeHtml(sourceHint) + '</span></header>' +
      '<div class="pfh-product-development-detail-banner"><strong>默认只展示、预填和人工确认；只有点击 BOM 区域“保存到 PLM”才执行写入。</strong><span>产品详情、侵权图、文案和本地 BOM 内容不会自动写回；其它字段仍仅保存在本地。</span>' + (detail.error ? '<em>' + escapeHtml(detail.error) + '</em>' : '') + '</div>' +
      (localNamingMeta ? '<div class="pfh-product-development-detail-meta">' + localNamingMeta + '</div>' : '') +
      fieldGroups.map((group) => '<section class="pfh-product-development-form-section"><h4>' + escapeHtml(group.title) + '</h4><div class="pfh-product-development-form-grid">' + group.fields.map((field) => productDevelopmentReadonlyFieldHtml({ ...field, formGroup: group.key }, formSku)).join('') + '</div></section>').join('') +
      productFieldSections +
      '<section class="pfh-product-development-form-section"><h4>PLM 已有 BOM（' + escapeHtml(String((detail.bomRows || []).length)) + ' 项，只读参考）</h4>' + productDevelopmentReadonlyBomHtml(detail.bomRows || [], formSku) + '</section>' +
      '<section class="pfh-product-development-form-section"><h4>建品资料字段（可编辑文件值 / 路径）</h4><div class="pfh-product-development-file-list">' + (attachments || '<span>暂无资料字段</span>') + '</div></section></section>';
  }

  function productDevelopmentTaskLocalMetaHtml(task, detail) {
    const source = task || {};
    const meta = getProductDevelopmentTaskMeta(source, detail);
    const sku = String(source.sku || detail && detail.sku || '').trim().toUpperCase();
    const input = (field, label, value, placeholder) => '<label>' + escapeHtml(label) + '<input type="text" class="pfh-product-development-task-meta-input" data-meta-sku="' + escapeHtml(sku) + '" data-meta-field="' + escapeHtml(field) + '" value="' + escapeHtml(value || '') + '" placeholder="' + escapeHtml(placeholder || '') + '"></label>';
    return '<section class="pfh-product-development-product-naming pfh-product-development-task-local-meta"><header><div><small>LOCAL PRODUCT DATA</small><h3>产品本地填写</h3></div><span>仅本地记录 · 不写入 PLM</span></header>' +
      '<div class="pfh-product-development-product-naming-grid">' +
      input('brand', '产品品牌', meta.brand, '填写产品品牌') +
      input('productNameCn', '产品中文名', meta.productNameCn, '填写产品中文名') +
      input('productNameEn', '产品英文名', meta.productNameEn, '填写产品英文名') +
      input('reworkProductCode', '返工产品编码', meta.reworkProductCode, '没有则留空') +
      '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-task-meta-save">保存本地</button><small>切换 SKU 或刷新页面后仍保留</small></div></section>';
  }

  function productDevelopmentTaskActionsHtml(task) {
    const source = task || {};
    const formDetail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[source.sku];
    const materialPlanner = formDetail
      ? productDevelopmentMaterialPlannerHtml(formDetail, source)
      : '<section class="pfh-product-development-material-planner"><header><div><small>BOM FORM · LOCAL / PLM</small><h3>填写 BOM 物料</h3></div></header><div class="pfh-product-development-form-empty">正在读取当前 SKU 的 BOM 和产品中文名…</div></section>';
    return productDevelopmentTaskLocalMetaHtml(source, formDetail) + materialPlanner + productDevelopmentReadonlyDetailHtml(formDetail);
  }

  function productDevelopmentMaterialInputElements(sku, kind) {
    return Array.from(document.querySelectorAll('.pfh-product-development-material-input')).filter((element) => (
      String(element.getAttribute('data-material-sku') || '').trim().toUpperCase() === String(sku || '').trim().toUpperCase() &&
      String(element.getAttribute('data-material-kind') || '') === String(kind || '')
    ));
  }

  function productDevelopmentSyncMaterialDraftDom(sku, kind, draft) {
    const elements = productDevelopmentMaterialInputElements(sku, kind);
    const setValue = (field, value) => {
      const element = elements.find((item) => item.getAttribute('data-material-field') === field);
      if (element && element.value !== String(value === null || value === undefined ? '' : value)) element.value = String(value === null || value === undefined ? '' : value);
    };
    if (draft.nameSource !== 'manual') setValue('materialName', draft.materialName);
    if (draft.specificationSource !== 'manual') setValue('specification', draft.specification);
    setValue('price', draft.price || '填写尺寸后自动计算');
    const card = elements[0] && elements[0].closest('[data-material-card]');
    const priceLabel = card && card.querySelector('[data-material-price-label]');
    if (priceLabel) priceLabel.textContent = '采购价：' + (draft.price ? draft.price + ' 元' : '填写尺寸后自动计算');
  }

  function productDevelopmentHandleMaterialField(target) {
    if (!target || !target.classList || !target.classList.contains('pfh-product-development-material-input')) return false;
    if (target.type === 'radio' && !target.checked) return true;
    const sku = String(target.getAttribute('data-material-sku') || '').trim().toUpperCase();
    const kind = String(target.getAttribute('data-material-kind') || '').trim();
    const field = String(target.getAttribute('data-material-field') || '').trim();
    const task = getProductDevelopmentTaskBySku(sku) || state.productDevelopmentSelectedTask || {};
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    if (!sku || !detail || !['box', 'label'].includes(kind)) return true;
    productDevelopmentEnsureMaterialDrafts(detail, task);
    const draft = detail.materialDrafts && detail.materialDrafts[kind];
    if (!draft || ['categoryPath', 'supplier', 'price'].includes(field)) return true;
    if (['multiPage', 'insertCard', 'thicken'].includes(field)) draft[field] = target.value === 'true';
    else if (field === 'quantity') draft.quantity = Math.max(1, Math.min(7, Number(target.value) || 1));
    else if (['length', 'width', 'height'].includes(field)) draft[field] = productDevelopmentMaterialNumberText(target.value, 2);
    else if (field === 'materialName') {
      draft.materialName = productDevelopmentCleanText(target.value, 240);
      draft.nameSource = 'manual';
    } else if (field === 'specification') {
      draft.specification = productDevelopmentCleanText(target.value, 240);
      draft.specificationSource = 'manual';
    } else return true;
    productDevelopmentRecalculateMaterialDraft(kind, draft, detail, task);
    detail.bomDraftDirty = true;
    detail.bomDraftSaveState = 'dirty';
    detail.bomPlmSaveState = '';
    detail.bomPlmSaveMessage = '';
    detail.cacheSource = 'local-cache';
    scheduleProductDevelopmentReadonlyDetailCache(sku, detail);
    productDevelopmentSyncMaterialDraftDom(sku, kind, draft);
    return true;
  }

  function productDevelopmentTaskHeroHtml(task) {
    const source = task || {};
    const data = productDevelopmentTaskSeedData(source);
    const sku = String(source.sku || data.sku || '未选择 SKU').trim().toUpperCase();
    const title = [source.brand || data.brand, source.name || data.name].filter(Boolean).join(' ') || sku;
    const status = source.projectStatus || data.projectStatus || '开发任务';
    return '<section class="pfh-section pfh-file-section pfh-product-development-task-hero"><div class="pfh-product-hero"><div class="pfh-title-meta pfh-sku-detail-card">' + productThumbHtml(data) + '<div class="pfh-detail-card-content"><div class="pfh-detail-card-heading"><span class="pfh-detail-sku-badge" title="当前开发 SKU">' + iconHtml('tag') + '<span>' + escapeHtml(sku) + '</span></span><strong class="pfh-detail-product-title" title="产品开发详情">' + escapeHtml(title) + '</strong></div><div class="pfh-detail-card-meta"><span class="is-design-type" title="产品开发任务">' + iconHtml('tag') + '<span>产品开发</span></span><span class="is-design-type" title="开发状态">' + iconHtml('info') + '<span>' + escapeHtml(status) + '</span></span></div></div></div></div></section>';
  }

  function productDevelopmentTaskEmbeddedViewHtml(view, statusText) {
    const source = view === 'review' ? productDevelopmentReviewHtml(statusText) : productDevelopmentCopywritingHtml(statusText);
    const template = document.createElement('template');
    template.innerHTML = source;
    const root = template.content.firstElementChild;
    if (!root) return '';
    const modeSwitch = root.querySelector('.pfh-work-mode-switch');
    const subviewHead = root.querySelector('.pfh-product-development-subview-head');
    if (modeSwitch) modeSwitch.remove();
    if (subviewHead) subviewHead.remove();
    root.classList.remove('pfh-product-development-subview');
    return root.outerHTML;
  }

  function renderProductDevelopmentTaskDetail(panel, statusText, task) {
    const detail = panel && panel.querySelector('.pfh-detail');
    if (!detail) return;
    const view = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
    state.productDevelopmentTaskView = view;
    if (view === 'detail') {
      state.copywritingMode = false;
      detail.classList.remove('is-loading');
      detail.innerHTML = renderStatusHtml(statusText) + '<div class="pfh-detail-scroll pfh-product-development-task-detail-scroll">' + productDevelopmentTaskTabsHtml(view) + productDevelopmentTaskHeroHtml(task) + productDevelopmentTaskActionsHtml(task) + '</div>';
      return;
    }
    const embedded = view === 'placeholder'
      ? '<section class="pfh-section pfh-product-development-task-placeholder"><div class="pfh-section-title"><h3>功能占位</h3><span>后续开发</span></div><div class="pfh-empty">该功能暂未开放，后续会在这里接入。</div></section>'
      : productDevelopmentTaskEmbeddedViewHtml(view, statusText);
    detail.classList.remove('is-loading');
    detail.innerHTML = '<div class="pfh-detail-scroll pfh-product-development-task-scroll">' + productDevelopmentTaskTabsHtml(view) + embedded + '</div>';
  }

  function renderProductDevelopmentTaskWorkspace(panel, statusText) {
    const list = panel && panel.querySelector('.pfh-list');
    const sidebar = panel && panel.querySelector('.pfh-product-development-task-sidebar');
    const sidebarBody = sidebar && sidebar.querySelector('.pfh-product-development-task-sidebar-body');
    const detail = panel && panel.querySelector('.pfh-detail');
    if (list) {
      list.innerHTML = '';
      list.setAttribute('aria-hidden', 'true');
    }
    if (sidebar) sidebar.classList.toggle('is-open', state.productDevelopmentTaskListOpen !== false);
    if (sidebarBody) sidebarBody.innerHTML = productDevelopmentTaskListHtml();
    if (!detail) return;
    const task = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku) || state.productDevelopmentSelectedTask;
    if (!task) {
      detail.classList.remove('is-loading');
      detail.innerHTML = '<div class="pfh-detail-scroll"><section class="pfh-section pfh-product-development-task-empty"><div class="pfh-section-title"><h3>我的开发任务</h3><span>按当前 PLM 用户筛选</span></div><div class="pfh-empty">选择左侧开发 SKU 后显示详情。</div><div class="pfh-about-actions"><button type="button" data-action="product-development-tasks-refresh">刷新任务</button><button type="button" data-action="product-development-tasks-home">返回开发功能</button></div></section></div>';
      return;
    }
    state.data = productDevelopmentTaskSeedData(task);
    state.selectedSku = task.sku;
    renderProductDevelopmentTaskDetail(panel, statusText, task);
  }

  async function loadProductDevelopmentTasks(options) {
    const opts = options || {};
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
      const selected = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku) || (opts.silent ? null : rows[0]);
      if (selected) {
        selectProductDevelopmentTask(selected.sku, { render: false, hydrate: false });
      } else {
        state.productDevelopmentSelectedTask = null;
        state.productDevelopmentTaskSelectedSku = '';
      }
      if (state.workMode === 'product-development' && (state.view === 'productDevelopmentTasks' || (!opts.silent && state.view === 'home'))) renderShell();
      if (selected) hydrateProductDevelopmentTaskDetail(selected).then(() => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === selected.sku) renderShell();
      }).catch(() => {});
      return rows;
    })().catch((error) => {
      state.productDevelopmentTaskError = formatErrorMessage(error);
      const cached = loadProductDevelopmentTaskCache();
      if (!Array.isArray(state.productDevelopmentTasks) || !state.productDevelopmentTasks.length) state.productDevelopmentTasks = existingTasks.length ? existingTasks : cached.rows;
      if (!state.productDevelopmentTaskUserName && cached.userName) state.productDevelopmentTaskUserName = cached.userName;
      const selected = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku);
      if (!selected) {
        const fallback = Array.isArray(state.productDevelopmentTasks) ? state.productDevelopmentTasks[0] : null;
        if (fallback) selectProductDevelopmentTask(fallback.sku, { render: false, hydrate: false });
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

  function openProductDevelopmentTaskWorkspace() {
    suspendDesignCollectionForProductDevelopment();
    state.workMode = 'product-development';
    state.settings.workMode = 'product-development';
    saveSettings(state.settings);
    state.productDevelopmentView = 'home';
    state.productDevelopmentTaskView = 'detail';
    state.productDevelopmentTaskPreviousTab = '';
    state.view = 'productDevelopmentTasks';
    state.copywritingMode = false;
    state.skuEditMode = false;
    state.productDevelopmentError = '';
    state.productDevelopmentTaskError = '';
    expandPanel();
    renderShell('正在读取本人开发任务…');
    loadProductDevelopmentTasks({ force: true }).catch(() => {});
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

  function productDevelopmentPairValues(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      cn: productDevelopmentCleanText(source.cn || source.chinese || source.value_cn || source.valueChinese, 6000),
      en: productDevelopmentCleanText(source.en || source.english || source.value || source.value_en || source.valueEnglish, 6000),
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
    deleteProductDevelopmentReviewDraft(getProductDevelopmentCurrentSku());
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '已选择本地对标图片：' + state.productDevelopmentBenchmarkImageName;
    renderShell();
  }

  async function loadProductDevelopmentSnapshot(sku, force, options) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const requireIngredients = !(options && options.requireIngredients === false);
    const imageKind = options && options.imageKind === 'benchmark' ? 'benchmark' : 'product';
    if (!normalizedSku) throw new Error('请先在设计任务中选择一个 SKU');
    if (!force && state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === normalizedSku
      && state.productDevelopmentSnapshot.imageKind === imageKind
      && (!requireIngredients || Array.isArray(state.productDevelopmentSnapshot.ingredients) && state.productDevelopmentSnapshot.ingredients.length)) return state.productDevelopmentSnapshot;
    const seed = getProductDevelopmentSeedData(normalizedSku);
    const snapshot = await fetchApiProductSnapshot(seed, { force: true }).catch(() => null);
    let liveCopyPayload = null;
    try {
      liveCopyPayload = await fetchPlmJson(LEDGER_AI_IMAGE_COPYWRITING_ENDPOINT + '?code=' + encodeURIComponent(normalizedSku));
    } catch (error) {
      liveCopyPayload = null;
    }
    let contentPayload = snapshot && snapshot.contentPayload;
    if (snapshot && snapshot.productId && snapshot.productVersionId && snapshot.categoryId) {
      try {
        contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(snapshot.productId) + '&category_id=' + encodeURIComponent(snapshot.categoryId) + '&product_version_id=' + encodeURIComponent(snapshot.productVersionId));
      } catch (error) {
        // The read-only product snapshot remains the compatible fallback.
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
    });
    if (requireIngredients && (!data.ingredientEnglish && !data.ingredientChinese) && typeof hydrateIngredientPdfForSku === 'function') {
      const hydrated = await hydrateIngredientPdfForSku(normalizedSku, { preferApi: true, silent: true }).catch(() => null);
      if (hydrated && hydrated.sku) data = normalizeData(hydrated);
    }
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
    if (requireIngredients && !ingredients.length) throw new Error('当前 SKU 没有读取到有效成分，已停止生成');
    let imageSource = imageKind === 'benchmark'
      ? productDevelopmentGetBenchmarkImageSource(data)
      : (typeof getExcelImageSource === 'function' ? getExcelImageSource(data) : { imageUrl: '', imageFallbackUrl: '' });
    let skuImage = null;
    if (imageKind !== 'benchmark' && typeof fetchLedgerAiImageSkuPreflight === 'function') {
      skuImage = await fetchLedgerAiImageSkuPreflight(normalizedSku, data).catch(() => null);
      if (skuImage && skuImage.status === 'available' && skuImage.url) {
        imageSource = { imageUrl: skuImage.url, imageFallbackUrl: skuImage.url };
      }
    }
    const result = {
      version: PRODUCT_DEVELOPMENT_VERSION,
      sku: normalizedSku,
      name: productDevelopmentCleanText(snapshot && snapshot.chineseName || data.name, 300),
      englishName: productDevelopmentCleanText(snapshot && snapshot.englishName, 300),
      brand: productDevelopmentCleanText(snapshot && snapshot.brand || data.brand, 160),
      productType: productDevelopmentCleanText(snapshot && snapshot.productType || data.productType || data.manualCategory, 180),
      referenceUrl: productDevelopmentCleanText(snapshot && snapshot.referenceUrl || data.referenceUrl || data.benchmarkLink, 1000),
      ingredients,
      ingredientSummary: {
        en: productDevelopmentCleanText(liveIngredients.product_ingredients_summary_en || plmCopywriting.ingredientSummary.en || data.ingredientEnglish, 8000),
        cn: productDevelopmentCleanText(liveIngredients.product_ingredients_summary_ch || plmCopywriting.ingredientSummary.cn || data.ingredientChinese, 8000),
      },
      ingredientFunctions: {
        en: productDevelopmentCleanText(liveIngredients.product_ingredients_efficacy_en || plmCopywriting.ingredientEfficacy.en, 8000),
        cn: productDevelopmentCleanText(liveIngredients.product_ingredients_efficacy_ch || plmCopywriting.ingredientEfficacy.cn, 8000),
      },
      sourceCopywriting: {
        sellingPoints: liveCopy.sellingPoints.en || liveCopy.sellingPoints.cn ? liveCopy.sellingPoints : productDevelopmentPairValues(plmCopywriting.sellingPoints),
        efficacy: liveCopy.efficacy.en || liveCopy.efficacy.cn ? liveCopy.efficacy : productDevelopmentPairValues(plmCopywriting.efficacy),
        advantages: liveCopy.advantages.en || liveCopy.advantages.cn ? liveCopy.advantages : productDevelopmentPairValues(plmCopywriting.advantages),
        usage: liveCopy.usage.en || liveCopy.usage.cn ? liveCopy.usage : productDevelopmentPairValues(plmCopywriting.usage),
      },
      imageUrl: String(imageSource && imageSource.imageUrl || ''),
      imageFallbackUrl: String(imageSource && imageSource.imageFallbackUrl || imageSource && imageSource.imageUrl || ''),
      imageKind,
      imageSource: imageKind === 'benchmark'
        ? imageSource.source || 'PLM 只读对标图片'
        : skuImage && skuImage.source || data.skuImageSource || 'PLM read-only product image',
      updatedAt: new Date().toLocaleString(),
    };
    if (!result.imageUrl) {
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
      .filter((term) => normalized.includes(productDevelopmentNormalizedClaimText(term)))
      .slice(0, 6);
    return {
      types: (brandTerms.length ? ['brand'] : []).concat(restrictedTerms.length ? ['banned'] : []),
      terms: brandTerms.concat(restrictedTerms).slice(0, 8),
    };
  }

  function productDevelopmentNormalizeRiskItems(value, options) {
    const source = value && typeof value === 'object' ? value : {};
    const list = Array.isArray(source.items) ? source.items : [];
    const brand = options && options.brand;
    const seen = new Set();
    return list.map((item, index) => {
      const sourceItem = item && typeof item === 'object' ? item : {};
      const bboxSource = sourceItem.bbox || sourceItem.box || {};
      const rawX = Number(bboxSource.x);
      const rawY = Number(bboxSource.y);
      const rawW = Number(bboxSource.w !== undefined ? bboxSource.w : bboxSource.width);
      const rawH = Number(bboxSource.h !== undefined ? bboxSource.h : bboxSource.height);
      const hasBbox = [rawX, rawY, rawW, rawH].every(Number.isFinite) && rawW > 0.001 && rawH > 0.001;
      const x = hasBbox ? Math.max(0, Math.min(1, rawX)) : 0;
      const y = hasBbox ? Math.max(0, Math.min(1, rawY)) : 0;
      const w = hasBbox ? Math.max(0, Math.min(1 - x, rawW)) : 0;
      const h = hasBbox ? Math.max(0, Math.min(1 - y, rawH)) : 0;
      const sourceText = productDevelopmentCleanText(sourceItem.sourceText || sourceItem.originalText || sourceItem.text, 240);
      const replacementEn = productDevelopmentCleanText(sourceItem.replacementEn || sourceItem.modifiedEnglish || sourceItem.english || sourceText, 300);
      const replacementZh = productDevelopmentCleanText(sourceItem.replacementZh || sourceItem.chinese || sourceItem.translation || sourceItem.translationZh || sourceText, 300);
      const key = [sourceText.toLowerCase(), hasBbox ? x.toFixed(4) + '|' + y.toFixed(4) : 'no-bbox'].join('|');
      if (!sourceText || !replacementEn || !replacementZh || seen.has(key)) return null;
      seen.add(key);
      const detected = productDevelopmentDetectSourceRisks(sourceText, brand);
      const riskTypes = Array.from(new Set((Array.isArray(sourceItem.riskTypes) ? sourceItem.riskTypes : [sourceItem.riskType])
        .map((type) => String(type || '').trim().toLowerCase())
        .filter((type) => ['banned', 'exaggeration', 'medical', 'brand', 'unsupported', 'other'].includes(type))
        .concat(detected.types))).slice(0, 4);
      const riskTerms = Array.from(new Set((Array.isArray(sourceItem.riskTerms) ? sourceItem.riskTerms : [])
        .map((term) => productDevelopmentCleanText(term, 100)).filter(Boolean).concat(detected.terms))).slice(0, 8);
      return {
        id: String(sourceItem.id || index + 1),
        sourceText,
        bbox: hasBbox && w > 0.001 && h > 0.001 ? { x, y, w, h } : null,
        riskTypes,
        riskTerms,
        riskReason: productDevelopmentCleanText(sourceItem.riskReason || sourceItem.reason || sourceItem.warning, 400) || (riskTerms.length ? '原文检测到：' + riskTerms.join('、') : ''),
        replacementEn,
        replacementZh,
        translationZh: productDevelopmentCleanText(sourceItem.translationZh || sourceItem.translation || sourceItem.chinese || replacementZh, 300),
        replacementOptions: Array.isArray(sourceItem.replacementOptions) ? sourceItem.replacementOptions : [],
        confidence: Math.max(0, Math.min(1, Number(sourceItem.confidence) || 0)),
      };
    }).filter(Boolean).slice(0, 80);
  }

  function productDevelopmentNormalizedClaimText(value) {
    return String(value || '').toLowerCase().normalize('NFKC').replace(/[\s_\-–—·.,:;!?()［］【】「」『』]/g, '');
  }

  function productDevelopmentFindBannedTerm(value, extraTerms) {
    const normalized = productDevelopmentNormalizedClaimText(value);
    if (!normalized) return '';
    const terms = PRODUCT_DEVELOPMENT_BANNED_TERMS.concat(Array.isArray(extraTerms) ? extraTerms : []);
    return terms.map((term) => String(term || '').trim()).filter(Boolean).find((term) => {
      const candidate = productDevelopmentNormalizedClaimText(term);
      return candidate && normalized.includes(candidate);
    }) || '';
  }

  function productDevelopmentValidateReview(result, snapshot) {
    const source = result && typeof result === 'object' ? result : {};
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
    const sourceItems = Array.isArray(source.texts) && source.texts.length ? source.texts : source.items;
    const extractedTexts = productDevelopmentNormalizeRiskItems({ items: sourceItems }, { brand });
    const items = extractedTexts;
    for (const item of extractedTexts) {
      const term = productDevelopmentFindBannedTerm(item.replacementEn + ' ' + item.replacementZh, brand);
      if (term) throw new Error('侵权对照图修改内容含风险词：' + term);
      if (item.replacementEn.includes('*') || item.replacementZh.includes('*')) throw new Error('侵权对照图修改内容不能含星号');
    }
    const productNaming = productDevelopmentNormalizeProductNaming(result);
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

  async function composeProductDevelopmentComparison(sourceDataUrl, items, snapshot) {
    const image = await loadImage(sourceDataUrl);
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const padding = 34;
    const columnGap = 22;
    const headerHeight = 102;
    const imageColumnWidth = Math.max(820, Math.min(1100, Math.max(820, iw)));
    const englishColumnWidth = 620;
    const translationColumnWidth = 760;
    const imageAreaWidth = imageColumnWidth - padding * 2;
    const imageAreaHeight = Math.max(820, Math.min(1700, ih * imageAreaWidth / iw));
    const displayItems = (Array.isArray(items) ? items : []).slice(0, 80);
    const innerEnglishWidth = englishColumnWidth - 52;
    const innerTranslationWidth = translationColumnWidth - 52;
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) throw new Error('无法创建对照图测量画布');
    const rowHeights = displayItems.map((item, index) => {
      const isRisk = Array.isArray(item.riskTypes) && item.riskTypes.length;
      measureCtx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      const riskLines = isRisk
        ? productDevelopmentCanvasTextLines(measureCtx, String(index + 1) + '. 风险：' + item.riskTypes.join('、'), innerEnglishWidth, 3).length
        : 0;
      measureCtx.font = '400 24px Arial, Microsoft YaHei, sans-serif';
      const sourceLines = productDevelopmentCanvasTextLines(measureCtx, item.sourceText || '（未读取到可靠原文）', innerEnglishWidth, 6).length;
      const replacementEnLines = productDevelopmentCanvasTextLines(measureCtx, item.replacementEn || item.sourceText, innerTranslationWidth, 4).length;
      const replacementZhLines = productDevelopmentCanvasTextLines(measureCtx, item.replacementZh || item.translationZh || item.sourceText, innerTranslationWidth, 4).length;
      const leftHeight = (isRisk ? riskLines * 29 + 16 : 0) + 29 + 12 + sourceLines * 31;
      const rightHeight = (isRisk ? riskLines * 29 + 16 : 0) + 29 + 12 + replacementEnLines * 31 + 18 + 29 + 12 + replacementZhLines * 31;
      return Math.max(isRisk ? 212 : 166, leftHeight, rightHeight) + 22;
    });
    const contentHeight = Math.max(imageAreaHeight, rowHeights.reduce((total, value) => total + value, 0) + 28);
    const footerHeight = 42;
    const height = padding * 2 + headerHeight + contentHeight + footerHeight;
    const canvas = document.createElement('canvas');
    canvas.width = padding * 2 + imageColumnWidth + englishColumnWidth + translationColumnWidth + columnGap * 2;
    canvas.height = Math.ceil(height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建对照图画布');
    const imageX = padding;
    const englishX = imageX + imageColumnWidth + columnGap;
    const translationX = englishX + englishColumnWidth + columnGap;
    const panelY = padding;
    const panelHeight = height - padding * 2 - footerHeight;
    const contentY = panelY + headerHeight;
    ctx.fillStyle = '#f6f8fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(imageX, panelY, imageColumnWidth, panelHeight);
    ctx.fillRect(englishX, panelY, englishColumnWidth, panelHeight);
    ctx.fillRect(translationX, panelY, translationColumnWidth, panelHeight);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const titleFont = '700 34px Arial, Microsoft YaHei, sans-serif';
    ctx.font = titleFont;
    ctx.fillStyle = '#172033';
    ctx.fillText('Benchmark Image / 对标图', imageX + 26, panelY + 27);
    ctx.fillText('English Original / 英文原文', englishX + 26, panelY + 27);
    ctx.fillText('Revised Translation / 对照翻译', translationX + 26, panelY + 27);
    const scale = Math.min(imageAreaWidth / iw, imageAreaHeight / ih);
    const drawWidth = iw * scale;
    const drawHeight = ih * scale;
    const drawX = imageX + (imageColumnWidth - drawWidth) / 2;
    const drawY = contentY + (imageAreaHeight - drawHeight) / 2;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.strokeStyle = '#d7dee9';
    ctx.lineWidth = 2;
    ctx.strokeRect(imageX, panelY, imageColumnWidth, panelHeight);
    ctx.strokeRect(englishX, panelY, englishColumnWidth, panelHeight);
    ctx.strokeRect(translationX, panelY, translationColumnWidth, panelHeight);
    let rowY = contentY + 24;
    displayItems.forEach((item, index) => {
      const isRisk = Array.isArray(item.riskTypes) && item.riskTypes.length;
      const markerColor = isRisk ? '#dc2626' : '#64748b';
      const innerWidth = englishColumnWidth - 52;
      ctx.fillStyle = markerColor;
      ctx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      const riskLines = isRisk
        ? productDevelopmentWrapCanvasText(ctx, String(index + 1) + '. 风险：' + item.riskTypes.join('、'), englishX + 26, rowY, innerWidth, 29, 3)
        : 0;
      const textOffset = isRisk ? riskLines * 29 + 16 : 0;
      ctx.fillStyle = '#344054';
      ctx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      ctx.fillText('原文', englishX + 26, rowY + textOffset);
      ctx.font = '400 24px Arial, Microsoft YaHei, sans-serif';
      const sourceY = rowY + textOffset + 36;
      const sourceLines = productDevelopmentWrapCanvasText(ctx, item.sourceText || '（未读取到可靠原文）', englishX + 26, sourceY, innerWidth, 31, 6);
      const translationOffset = isRisk ? riskLines * 29 + 16 : 0;
      ctx.fillStyle = isRisk ? '#dc2626' : '#344054';
      ctx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      const translationTitle = isRisk ? '风险修改' : '对照翻译';
      productDevelopmentWrapCanvasText(ctx, translationTitle, translationX + 26, rowY + translationOffset, translationColumnWidth - 52, 29, 2);
      ctx.fillStyle = '#344054';
      ctx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      const translationEnglishLabelY = rowY + translationOffset + 36;
      ctx.fillText('英文：', translationX + 26, translationEnglishLabelY);
      ctx.font = '400 24px Arial, Microsoft YaHei, sans-serif';
      const translationEnglishY = translationEnglishLabelY + 36;
      const replacementEnLines = productDevelopmentWrapCanvasText(ctx, item.replacementEn || item.sourceText, translationX + 26, translationEnglishY, translationColumnWidth - 52, 31, 4);
      ctx.fillStyle = '#667085';
      ctx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      const translationChineseLabelY = translationEnglishY + replacementEnLines * 31 + 18;
      ctx.fillText('中文：', translationX + 26, translationChineseLabelY);
      ctx.font = '400 24px Arial, Microsoft YaHei, sans-serif';
      productDevelopmentWrapCanvasText(ctx, item.replacementZh || item.translationZh || item.sourceText, translationX + 26, translationChineseLabelY + 36, translationColumnWidth - 52, 31, 4);
      rowY += rowHeights[index] || 188;
    });
    if (!displayItems.length) {
      ctx.fillStyle = '#667085';
      ctx.font = '24px Arial, Microsoft YaHei, sans-serif';
      ctx.fillText('未提取到可确认的图片文字', englishX + 26, contentY + 52);
      ctx.fillText('请手动添加或重新分析', translationX + 26, contentY + 52);
    }
    ctx.fillStyle = '#98a2b3';
    ctx.font = '16px Arial, Microsoft YaHei, sans-serif';
    ctx.fillText('SKU ' + String(snapshot && snapshot.sku || '') + ' · 对标图保留 · 英文原文与修改中文对照 · 仅生成审核稿', padding, height - 27);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
    };
  }

  function productDevelopmentFileName(sku, suffix, extension) {
    const safeSku = String(sku || 'product').replace(/[^A-Za-z0-9_-]+/g, '_');
    return safeSku + '-' + suffix + '.' + extension;
  }

  async function downloadProductDevelopmentDataUrl(dataUrl, filename) {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('本地结果读取失败');
    downloadBlob(await response.blob(), filename);
  }

  async function runProductDevelopmentReview() {
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) {
      showToast('请先在设计任务中打开或选择当前 SKU');
      return;
    }
    state.productDevelopmentReviewBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '正在读取当前 SKU 的对标图片…';
    renderShell();
    try {
      const snapshot = await loadProductDevelopmentSnapshot(sku, true, { requireIngredients: false, imageKind: 'benchmark' });
      state.productDevelopmentStatus = '正在提交一次图片风险分析…';
      renderShell();
      const image = await productDevelopmentFetchImage(snapshot.imageUrl, snapshot.imageFallbackUrl);
      const response = await cloudRequest('/ai-image/product-development-review', {
        method: 'POST',
        timeoutMs: 150000,
        body: {
          sku: snapshot.sku,
          name: snapshot.name,
          productType: snapshot.productType,
          category: snapshot.productType,
          brand: snapshot.brand,
          sellingPoints: snapshot.sourceCopywriting.sellingPoints,
          efficacy: snapshot.sourceCopywriting.efficacy,
          namingExamples: PRODUCT_DEVELOPMENT_NAME_EXAMPLES,
          namingRule: '英文产品名取对标图上清晰可见的产品主标题；中文产品名使用适用对象、朦胧作用/状态和剂型组合，不使用医疗、预防、治疗、绝对化或夸大表达。',
          imageDataUrl: image.dataUrl,
          referenceUrl: snapshot.referenceUrl,
        },
      });
      const validated = productDevelopmentValidateReview(response, snapshot);
      state.productDevelopmentStatus = '正在生成左图右文的本地对照图…';
      renderShell();
      const comparison = await composeProductDevelopmentComparison(image.dataUrl, validated.items, snapshot);
      const id = 'pd-review-' + Date.now().toString(36);
      const fileName = productDevelopmentFileName(snapshot.sku, 'infringement-comparison', 'png');
      state.productDevelopmentReview = {
        id,
        sku: snapshot.sku,
        sourceImageDataUrl: image.dataUrl,
        sourceImageName: state.productDevelopmentBenchmarkImageName,
        comparisonDataUrl: comparison.dataUrl,
        items: validated.items,
        extractedTexts: validated.extractedTexts,
        warnings: validated.warnings,
        provider: validated.provider,
        model: validated.model,
        productNaming: validated.productNaming,
        fileName,
        createdAt: new Date().toLocaleString(),
      };
      saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      saveProductDevelopmentHistory({
        id,
        sku: snapshot.sku,
        name: snapshot.name,
        kind: 'review',
        createdAt: state.productDevelopmentReview.createdAt,
        fileName,
        itemCount: validated.items.filter((item) => Array.isArray(item.riskTypes) && item.riskTypes.length).length,
        extractedTextCount: validated.extractedTexts.length,
        comparisonDataUrl: comparison.dataUrl,
        warnings: validated.warnings,
        productNameCn: validated.productNaming.chineseProductName,
        productNameEn: validated.productNaming.englishProductName,
      });
      const riskCount = validated.items.filter((item) => Array.isArray(item.riskTypes) && item.riskTypes.length).length;
      state.productDevelopmentStatus = riskCount ? '已识别 ' + validated.extractedTexts.length + ' 项图片文字，生成 ' + riskCount + ' 项风险对照，请人工确认' : '已识别 ' + validated.extractedTexts.length + ' 项图片文字，未检测到风险，可下载留档并继续人工检查';
      showToast('侵权对照图已生成');
    } catch (error) {
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    } finally {
      state.productDevelopmentReviewBusy = false;
      renderShell();
    }
  }

  function productDevelopmentReviewItemIncomplete(item) {
    const source = item && typeof item === 'object' ? item : {};
    return !String(source.sourceText || '').trim()
      || !String(source.replacementEn || '').trim()
      || !String(source.replacementZh || '').trim();
  }

  function productDevelopmentReviewEditorHtml(result, items) {
    const rows = (Array.isArray(items) ? items : []).map((item, index) => {
      const isRisk = Array.isArray(item && item.riskTypes) && item.riskTypes.length;
      const riskText = isRisk ? item.riskTypes.join('、') + (Array.isArray(item.riskTerms) && item.riskTerms.length ? ' · ' + item.riskTerms.join('、') : '') : '';
      const rowClass = isRisk ? ' is-risk' : ' is-clear';
      return '<article class="pfh-product-development-review-editor-row' + rowClass + '"><div class="pfh-product-development-review-editor-head"><b>' + (index + 1) + '</b><span>' + escapeHtml(riskText) + '</span><button type="button" data-action="product-development-review-remove" data-review-index="' + index + '">删除</button></div>' +
        '<label>原图文字<input type="text" class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="sourceText" value="' + escapeHtml(item.sourceText) + '"></label>' +
        '<label>英文修改<textarea class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="replacementEn" rows="2">' + escapeHtml(item.replacementEn) + '</textarea></label>' +
        '<label>中文修改<textarea class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="replacementZh" rows="2">' + escapeHtml(item.replacementZh) + '</textarea></label></article>';
    }).join('');
    const empty = rows ? '' : '<div class="pfh-product-development-result-empty">未检测到可靠风险文字，可手动添加需要核对的图片文字。</div>';
    return '<section class="pfh-product-development-review-editor"><header><div><small>MANUAL REVIEW</small><h3>人工修改对照内容</h3></div><span>修改后点击重新生成</span></header>' + empty + '<div class="pfh-product-development-review-editor-list">' + rows + '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-review-add">手动添加文字</button><button type="button" data-action="product-development-review-recompose"' + (!result || state.productDevelopmentReviewBusy ? ' disabled' : '') + '>按修改重新生成对照图</button></div></section>';
  }

  function productDevelopmentProductNamingHtml(result) {
    const naming = productDevelopmentNormalizeProductNaming(result && result.productNaming);
    if (!naming.chineseProductName && !naming.englishProductName && !naming.functionSummary) return '';
    return '<section class="pfh-product-development-product-naming"><header><div><small>PRODUCT NAMING</small><h3>产品名建议</h3></div></header>' +
      '<div class="pfh-product-development-product-naming-grid">' +
      '<label>中文产品名（朦胧作用）<input type="text" class="pfh-product-development-name-input" data-name-field="chineseProductName" value="' + escapeHtml(naming.chineseProductName) + '"></label>' +
      '<label>英文产品名（包装大标题）<input type="text" class="pfh-product-development-name-input" data-name-field="englishProductName" value="' + escapeHtml(naming.englishProductName) + '"></label>' +
      '</div>' +
      (naming.functionSummary ? '<p><strong>识别的产品作用：</strong>' + escapeHtml(naming.functionSummary) + '</p>' : '') +
      '</section>';
  }

  async function recomposeProductDevelopmentReview() {
    const result = state.productDevelopmentReview;
    if (!result || !result.sourceImageDataUrl) {
      showToast('请先完成一次图片文字分析');
      return;
    }
    const items = Array.isArray(result.items) ? result.items : [];
    if (items.some(productDevelopmentReviewItemIncomplete)) {
      showToast('请补全原图文字、英文修改和中文修改');
      return;
    }
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === result.sku
      ? state.productDevelopmentSnapshot
      : { sku: result.sku, brand: '' };
    state.productDevelopmentReviewBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '正在按人工修改重新生成对照图…';
    renderShell();
    try {
      const validated = productDevelopmentValidateReview({ items, warnings: result.warnings, productNaming: result.productNaming }, snapshot);
      const comparison = await composeProductDevelopmentComparison(result.sourceImageDataUrl, validated.items, snapshot);
      result.items = validated.items;
      result.extractedTexts = validated.extractedTexts;
      result.comparisonDataUrl = comparison.dataUrl;
      result.warnings = validated.warnings;
      result.productNaming = validated.productNaming;
      result.manualEditedAt = new Date().toLocaleString();
      saveProductDevelopmentReviewDraft(result);
      saveProductDevelopmentHistory({
        id: result.id,
        sku: result.sku,
        name: snapshot.name || result.sku,
        kind: 'review',
        createdAt: result.createdAt,
        fileName: result.fileName,
        itemCount: result.items.filter((item) => Array.isArray(item.riskTypes) && item.riskTypes.length).length,
        extractedTextCount: result.extractedTexts.length,
        comparisonDataUrl: result.comparisonDataUrl,
        warnings: result.warnings,
        productNameCn: result.productNaming.chineseProductName,
        productNameEn: result.productNaming.englishProductName,
      });
      state.productDevelopmentStatus = '已按人工修改重新生成对照图';
      showToast('人工修改已应用');
    } catch (error) {
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    } finally {
      state.productDevelopmentReviewBusy = false;
      renderShell();
    }
  }

  function productDevelopmentXmlEscape(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function productDevelopmentBuiltinCell(text, bold) {
    return '<w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr><w:p><w:r>' + (bold ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + productDevelopmentXmlEscape(text) + '</w:t></w:r></w:p></w:tc>';
  }

  function productDevelopmentBuiltinRow(label) {
    return '<w:tr>' + productDevelopmentBuiltinCell(label, true) + productDevelopmentBuiltinCell('', false) + productDevelopmentBuiltinCell('', false) + productDevelopmentBuiltinCell('', false) + '</w:tr>';
  }

  function productDevelopmentBuiltinDocumentXml() {
    const rows = [
      '<w:tr>' + productDevelopmentBuiltinCell('内容说明', true) + productDevelopmentBuiltinCell('文案英文内容', true) + productDevelopmentBuiltinCell('文案中文内容', true) + productDevelopmentBuiltinCell('备注', true) + '</w:tr>',
      productDevelopmentBuiltinRow('产品名称'),
      productDevelopmentBuiltinRow('产品类型'),
      productDevelopmentBuiltinRow('A. 产品功效 Function'),
      productDevelopmentBuiltinRow('B. 产品优势 Advantages'),
      productDevelopmentBuiltinRow('C. 产品卖点 Selling Points'),
      productDevelopmentBuiltinRow('D. 成分功能 Ingredient Functions'),
      productDevelopmentBuiltinRow('E. 产品销售关键词 Keywords'),
      productDevelopmentBuiltinRow('F. 1688 建议上架标题 Title'),
    ].join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="' + PRODUCT_DEVELOPMENT_W_NS + '"><w:body><w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="8800" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/><w:gridCol w:w="2200"/></w:tblGrid>' + rows + '</w:tbl><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr></w:body></w:document>';
  }

  async function createProductDevelopmentBuiltinTemplate() {
    if (typeof JSZip !== 'function') throw new Error('DOCX 组件未加载');
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PRODUCT_DEVELOPMENT_REL_NS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', productDevelopmentBuiltinDocumentXml());
    zip.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="' + PRODUCT_DEVELOPMENT_W_NS + '"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Microsoft YaHei"/><w:sz w:val="22"/></w:rPr></w:style></w:styles>');
    zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PRODUCT_DEVELOPMENT_REL_NS + '"></Relationships>');
    return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  }

  function productDevelopmentXmlElements(node, tagName) {
    const namespaced = node && node.getElementsByTagNameNS ? Array.from(node.getElementsByTagNameNS(PRODUCT_DEVELOPMENT_W_NS, tagName)) : [];
    if (namespaced.length) return namespaced;
    return node && node.getElementsByTagName ? Array.from(node.getElementsByTagName('w:' + tagName)) : [];
  }

  function productDevelopmentCellText(cell) {
    return productDevelopmentXmlElements(cell, 't').map((node) => node.textContent || '').join('').replace(/\s+/g, ' ').trim();
  }

  function productDevelopmentClearCell(cell) {
    const children = Array.from(cell && cell.childNodes || []);
    children.forEach((child) => {
      const localName = String(child.localName || child.nodeName || '').replace(/^w:/, '');
      if (localName !== 'tcPr') cell.removeChild(child);
    });
  }

  function productDevelopmentSetCellLines(cell, lines, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRun = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'r')[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const sourceRPr = sourceRun && productDevelopmentXmlElements(sourceRun, 'rPr')[0];
    productDevelopmentClearCell(cell);
    const values = Array.isArray(lines) ? lines : [lines];
    values.filter((line) => String(line || '').trim()).forEach((line) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      if (sourceRPr) run.appendChild(sourceRPr.cloneNode(true));
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = String(line);
      run.appendChild(text);
      paragraph.appendChild(run);
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentFindRow(rows, patterns) {
    return rows.find((row) => {
      const cells = productDevelopmentXmlElements(row, 'tc');
      const label = productDevelopmentCellText(cells[0] || '').replace(/\s+/g, '');
      return patterns.some((pattern) => pattern.test(label));
    }) || null;
  }

  function productDevelopmentSectionLines(section, formatter) {
    const list = Array.isArray(section) ? section : [];
    return list.map((item, index) => formatter(item, index + 1)).filter(Boolean);
  }

  function productDevelopmentNormalizeCopywriting(value) {
    const source = value && typeof value === 'object' ? value.sections || value : {};
    const list = (key) => Array.isArray(source[key]) ? source[key] : [];
    return {
      efficacy: list('efficacy').map((item) => productDevelopmentPairValues(typeof item === 'object' ? item : { cn: item })).filter((item) => item.cn || item.en),
      advantages: list('advantages').map((item) => productDevelopmentPairValues(typeof item === 'object' ? item : { cn: item })).filter((item) => item.cn || item.en),
      sellingPoints: list('sellingPoints').map((item) => {
        const sourceItem = item && typeof item === 'object' ? item : { cn: item };
        return {
          titleEn: productDevelopmentCleanText(sourceItem.titleEn || sourceItem.title_en, 100),
          titleCn: productDevelopmentCleanText(sourceItem.titleCn || sourceItem.title_cn, 100),
          en: productDevelopmentCleanText(sourceItem.en || sourceItem.english, 400),
          cn: productDevelopmentCleanText(sourceItem.cn || sourceItem.chinese, 400),
        };
      }).filter((item) => item.cn || item.en),
      ingredientFunctions: list('ingredientFunctions').map((item) => {
        const sourceItem = item && typeof item === 'object' ? item : {};
        return {
          ingredientEn: productDevelopmentCleanText(sourceItem.ingredientEn || sourceItem.englishName, 300),
          ingredientCn: productDevelopmentCleanText(sourceItem.ingredientCn || sourceItem.chineseName, 300),
          en: productDevelopmentCleanText(sourceItem.en || sourceItem.english, 400),
          cn: productDevelopmentCleanText(sourceItem.cn || sourceItem.chinese, 400),
        };
      }).filter((item) => item.ingredientEn || item.ingredientCn || item.cn || item.en),
    };
  }

  function productDevelopmentChineseCount(value) {
    return String(value || '').replace(/[^\u3400-\u9fff]/g, '').length;
  }

  function productDevelopmentEnglishWordCount(value) {
    return (String(value || '').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
  }

  function productDevelopmentValidateCopywriting(value, snapshot) {
    const result = productDevelopmentNormalizeCopywriting(value);
    const expected = Array.isArray(snapshot && snapshot.ingredients) ? snapshot.ingredients : [];
    const errors = [];
    if (result.efficacy.length !== 4) errors.push('A 产品功效必须为 4 条');
    if (result.advantages.length !== 4) errors.push('B 产品优势必须为 4 条');
    if (result.sellingPoints.length !== 15) errors.push('C 产品卖点必须为 15 条');
    if (result.ingredientFunctions.length !== expected.length) errors.push('D 成分功能必须覆盖全部有效成分');
    const allText = [];
    result.efficacy.forEach((item, index) => {
      allText.push(item.en, item.cn);
      if (productDevelopmentChineseCount(item.cn) > 20 || productDevelopmentEnglishWordCount(item.en) > 20) errors.push('A 第 ' + (index + 1) + ' 条超出长度');
    });
    result.advantages.forEach((item, index) => {
      allText.push(item.en, item.cn);
      if (productDevelopmentChineseCount(item.cn) > 15 || productDevelopmentEnglishWordCount(item.en) > 8) errors.push('B 第 ' + (index + 1) + ' 条超出长度');
    });
    result.sellingPoints.forEach((item, index) => {
      allText.push(item.titleEn, item.titleCn, item.en, item.cn);
      if (productDevelopmentChineseCount(item.cn) > 22 || productDevelopmentEnglishWordCount(item.en) > 14) errors.push('C 第 ' + (index + 1) + ' 条超出长度');
      if (item.titleEn && (productDevelopmentEnglishWordCount(item.titleEn) < 3 || productDevelopmentEnglishWordCount(item.titleEn) > 4)) errors.push('C 第 ' + (index + 1) + ' 条小标题词数异常');
    });
    result.ingredientFunctions.forEach((item, index) => {
      allText.push(item.ingredientEn, item.ingredientCn, item.en, item.cn);
      const target = expected[index] || {};
      const targetKey = productDevelopmentNormalizedClaimText(target.en || target.cn);
      const actualKey = productDevelopmentNormalizedClaimText(item.ingredientEn || item.ingredientCn);
      if (!actualKey || !targetKey || actualKey !== targetKey) errors.push('D 第 ' + (index + 1) + ' 个成分与 PLM 不一致');
      if (productDevelopmentChineseCount(item.cn) > 20 || productDevelopmentEnglishWordCount(item.en) > 18) errors.push('D 第 ' + (index + 1) + ' 条超出长度');
    });
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
    const invalid = allText.find((text) => productDevelopmentFindBannedTerm(text, brand) || String(text || '').includes('*') || /\n\s*\n/.test(String(text || '')));
    if (invalid) errors.push('输出包含禁词、品牌词、星号或空行');
    if (errors.length) throw new Error(errors.slice(0, 5).join('；'));
    return result;
  }

  async function buildProductDevelopmentDocx(content, templateBase64) {
    if (typeof JSZip !== 'function') throw new Error('DOCX 组件未加载');
    const buffer = templateBase64 ? base64ToArrayBuffer(templateBase64) : await createProductDevelopmentBuiltinTemplate();
    const zip = await JSZip.loadAsync(buffer);
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) throw new Error('模板缺少 word/document.xml');
    const xml = await documentFile.async('string');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (!doc || doc.getElementsByTagName('parsererror').length) throw new Error('模板文档结构无法读取');
    const rows = productDevelopmentXmlElements(doc, 'tr');
    if (!rows.length) throw new Error('模板没有可编辑表格');
    rows.forEach((row) => {
      const cells = productDevelopmentXmlElements(row, 'tc');
      const label = productDevelopmentCellText(cells[0] || '');
      if (!/内容说明|文案英文内容|文案中文内容/.test(label)) cells.slice(1).forEach((cell) => productDevelopmentClearCell(cell));
    });
    const targets = {
      efficacy: productDevelopmentFindRow(rows, [/^A[.．、)]?产品功效/i, /产品功效/i]),
      advantages: productDevelopmentFindRow(rows, [/^B[.．、)]?产品优势/i, /产品优势/i]),
      sellingPoints: productDevelopmentFindRow(rows, [/^C[.．、)]?产品卖点/i, /产品卖点/i]),
      ingredientFunctions: productDevelopmentFindRow(rows, [/^D[.．、)]?成分功能/i, /成分功能/i]),
    };
    const missing = Object.keys(targets).filter((key) => !targets[key]);
    if (missing.length) throw new Error('模板缺少字段：' + missing.join('、'));
    const fill = (row, english, chinese) => {
      const cells = productDevelopmentXmlElements(row, 'tc');
      if (cells.length < 4) throw new Error('模板字段不是四列表格');
      productDevelopmentSetCellLines(cells[1], english, doc);
      productDevelopmentSetCellLines(cells[2], chinese, doc);
      productDevelopmentClearCell(cells[3]);
    };
    fill(targets.efficacy,
      productDevelopmentSectionLines(content.efficacy, (item, index) => index + '. ' + item.en),
      productDevelopmentSectionLines(content.efficacy, (item, index) => index + '、' + item.cn));
    fill(targets.advantages,
      productDevelopmentSectionLines(content.advantages, (item, index) => index + '. ' + item.en),
      productDevelopmentSectionLines(content.advantages, (item, index) => index + '、' + item.cn));
    fill(targets.sellingPoints,
      productDevelopmentSectionLines(content.sellingPoints, (item, index) => index + '. ' + (item.titleEn ? item.titleEn + ': ' : '') + item.en),
      productDevelopmentSectionLines(content.sellingPoints, (item, index) => index + '、' + (item.titleCn ? item.titleCn + '：' : '') + item.cn));
    fill(targets.ingredientFunctions,
      productDevelopmentSectionLines(content.ingredientFunctions, (item, index) => index + '. ' + (item.ingredientEn || item.ingredientCn) + ': ' + item.en),
      productDevelopmentSectionLines(content.ingredientFunctions, (item, index) => index + '、' + (item.ingredientCn || item.ingredientEn) + '：' + item.cn));
    zip.file('word/document.xml', new XMLSerializer().serializeToString(doc));
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  }

  async function runProductDevelopmentCopywriting() {
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) {
      showToast('请先在设计任务中打开或选择当前 SKU');
      return;
    }
    state.productDevelopmentCopywritingBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '正在读取当前 SKU 的成分和卖点…';
    renderShell();
    try {
      const snapshot = await loadProductDevelopmentSnapshot(sku, true);
      const response = await cloudRequest('/ai-image/product-development-copywriting', {
        method: 'POST',
        timeoutMs: 150000,
        body: {
          sku: snapshot.sku,
          name: snapshot.name,
          productType: snapshot.productType,
          brand: snapshot.brand,
          ingredients: snapshot.ingredients,
          ingredientSummary: snapshot.ingredientSummary,
          ingredientFunctions: snapshot.ingredientFunctions,
          sourceCopywriting: snapshot.sourceCopywriting,
          templateVersion: state.productDevelopmentTemplateVersion || PRODUCT_DEVELOPMENT_TEMPLATE_VERSION,
        },
      });
      const content = productDevelopmentValidateCopywriting(response, snapshot);
      state.productDevelopmentStatus = '正在按四列表格模板生成 DOCX…';
      renderShell();
      const blob = await buildProductDevelopmentDocx(content, state.productDevelopmentTemplateBase64);
      const id = 'pd-copywriting-' + Date.now().toString(36);
      const fileName = productDevelopmentFileName(snapshot.sku, 'copywriting-A-D', 'docx');
      state.productDevelopmentCopywriting = {
        id,
        sku: snapshot.sku,
        content,
        blob,
        fileName,
        provider: productDevelopmentCleanText(response.provider, 80),
        model: productDevelopmentCleanText(response.model, 120),
        templateVersion: state.productDevelopmentTemplateVersion || PRODUCT_DEVELOPMENT_TEMPLATE_VERSION,
        createdAt: new Date().toLocaleString(),
      };
      saveProductDevelopmentHistory({
        id,
        sku: snapshot.sku,
        name: snapshot.name,
        kind: 'copywriting',
        createdAt: state.productDevelopmentCopywriting.createdAt,
        fileName,
        itemCount: content.efficacy.length + content.advantages.length + content.sellingPoints.length + content.ingredientFunctions.length,
        templateVersion: state.productDevelopmentCopywriting.templateVersion,
      });
      state.productDevelopmentStatus = 'A-D 文案 DOCX 已生成，未向 PLM 回写';
      showToast('A-D 文案 DOCX 已生成');
    } catch (error) {
      state.productDevelopmentError = formatErrorMessage(error);
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
    state.productDevelopmentStatus = '已保存本地模板：' + file.name;
    showToast('本地 DOCX 模板已保存');
    renderShell();
  }

  function resetProductDevelopmentTemplate() {
    try {
      if (typeof GM_deleteValue === 'function') {
        GM_deleteValue(PRODUCT_DEVELOPMENT_TEMPLATE_KEY);
        GM_deleteValue(PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY);
      } else {
        localStorage.removeItem(PRODUCT_DEVELOPMENT_TEMPLATE_KEY);
        localStorage.removeItem(PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY);
      }
    } catch (error) {
      // Continue with in-memory reset.
    }
    state.productDevelopmentTemplateBase64 = '';
    state.productDevelopmentTemplateVersion = '';
    showToast('已恢复内置四列表格模板');
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

  function productDevelopmentSkuSummaryHtml(snapshot) {
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) return '<div class="pfh-product-development-empty"><strong>还没有当前 SKU</strong><p>请先切换回设计任务，在 PLM 详情中打开一个产品，再进入产品开发。</p><button type="button" data-action="work-mode" data-work-mode="daily">返回设计任务</button></div>';
    const data = snapshot || (state.data && state.data.sku === sku ? state.data : null) || {};
    return '<article class="pfh-product-development-context"><div class="pfh-product-development-context-icon">' + iconHtml('package') + '</div><div><small>当前 PLM SKU</small><strong>' + escapeHtml(sku) + '</strong><p>' + escapeHtml(data.name || '等待读取产品资料') + '</p></div><button type="button" data-action="product-development-context-refresh">刷新资料</button></article>';
  }

  function productDevelopmentHistoryHtml(limit) {
    const maxItems = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(PRODUCT_DEVELOPMENT_MAX_HISTORY, Number(limit))) : 4;
    const history = normalizeProductDevelopmentHistory(state.productDevelopmentHistory).slice(0, maxItems);
    if (!history.length) return '<div class="pfh-product-development-history-empty">本地历史记录会显示在这里</div>';
    return history.map((item) => '<button type="button" class="pfh-product-development-history-row" data-action="product-development-history-open" data-history-id="' + escapeHtml(item.id) + '" title="打开本地历史"><span class="pfh-product-development-history-kind">' + escapeHtml(item.kind === 'review' ? '图' : '文') + '</span><div><strong>' + escapeHtml(item.sku) + '</strong><small>' + escapeHtml(item.createdAt) + ' · ' + escapeHtml(item.fileName || '') + '</small></div><em>' + (item.kind === 'review' ? item.itemCount + ' 个风险项' + (item.extractedTextCount ? ' · ' + item.extractedTextCount + ' 项文字' : '') : 'A-D') + '</em></button>').join('');
  }

  function productDevelopmentOpenHistory(item) {
    if (!item) {
      showToast('本地历史记录不存在或已被清理');
      return;
    }
    state.workMode = 'product-development';
    state.settings.workMode = 'product-development';
    saveSettings(state.settings);
    state.productDevelopmentError = '';
    if (item.kind === 'review' && item.comparisonDataUrl) {
      state.productDevelopmentView = 'review';
      state.productDevelopmentReview = {
        id: item.id,
        sku: item.sku,
        comparisonDataUrl: item.comparisonDataUrl,
        items: [],
        extractedTexts: [],
        warnings: item.warnings || [],
        productNaming: {
          chineseProductName: item.productNameCn,
          englishProductName: item.productNameEn,
          functionSummary: '',
          evidenceText: '',
          confidence: 0,
        },
        fileName: item.fileName || productDevelopmentFileName(item.sku, 'infringement-comparison', 'png'),
        createdAt: item.createdAt,
        sourceImageDataUrl: '',
        fromHistory: true,
      };
      state.productDevelopmentStatus = '已打开本地历史对照图，可滚动查看或下载 PNG';
    } else if (item.kind === 'review') {
      state.productDevelopmentView = 'review';
      state.productDevelopmentReview = null;
      state.productDevelopmentStatus = '这条历史只保存了索引，没有可预览的对照图，请重新分析';
    } else {
      state.productDevelopmentView = 'copywriting';
      state.productDevelopmentCopywriting = null;
      state.productDevelopmentStatus = '文案历史目前只保存生成记录，请在此页面重新生成 DOCX';
    }
    renderShell();
  }

  function productDevelopmentHistoryViewHtml() {
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>LOCAL HISTORY</small><h2>本地历史</h2></div></header>' +
      '<section class="pfh-product-development-section pfh-product-development-history"><header><div><small>LOCAL HISTORY</small><h3>已生成记录</h3></div><span>最多保留 ' + PRODUCT_DEVELOPMENT_MAX_HISTORY + ' 条</span></header><div>' + productDevelopmentHistoryHtml(PRODUCT_DEVELOPMENT_MAX_HISTORY) + '</div></section>' +
      '<p class="pfh-product-development-note">图片历史可直接查看和下载已保存的 PNG；文案历史目前只保存生成记录，打开后可重新生成 DOCX。所有结果只保存在本地，不向 PLM 回写。</p></div>';
  }

  function productDevelopmentEvidenceHtml(snapshot) {
    const ingredientText = snapshot && Array.isArray(snapshot.ingredients)
      ? snapshot.ingredients.slice(0, 12).map((item) => [item.en, item.cn].filter(Boolean).join(' / ')).filter(Boolean).join('、')
      : '';
    const sellingPoints = snapshot && snapshot.sourceCopywriting && snapshot.sourceCopywriting.sellingPoints
      ? productDevelopmentPairValues(snapshot.sourceCopywriting.sellingPoints)
      : { en: '', cn: '' };
    const sellingText = [sellingPoints.cn, sellingPoints.en].filter(Boolean).join(' / ');
    const hint = snapshot ? '已读取当前 SKU 的只读资料' : '点击上方“刷新资料”读取当前 SKU';
    return '<section class="pfh-product-development-section"><header><div><small>PLM EVIDENCE</small><h3>成分与产品卖点</h3></div><span>' + escapeHtml(hint) + '</span></header><div class="pfh-product-development-grid"><article class="pfh-product-development-card"><div class="pfh-product-development-card-head"><span>' + iconHtml('box') + '</span><i>' + escapeHtml(snapshot ? String(snapshot.ingredients.length) + ' 项' : '待读取') + '</i></div><h3>有效成分</h3><p>' + escapeHtml(ingredientText || '尚未读取成分，生成前会再次校验当前 SKU。') + '</p></article><article class="pfh-product-development-card"><div class="pfh-product-development-card-head"><span>' + iconHtml('batchExcel') + '</span><i>' + (sellingText ? 'PLM' : '待读取') + '</i></div><h3>当前卖点</h3><p>' + escapeHtml(sellingText || '尚未读取卖点，生成时会优先使用 PLM 当前字段。') + '</p></article></div></section>';
  }

  function productDevelopmentHomeHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku ? state.productDevelopmentSnapshot : null;
    const cards = PRODUCT_DEVELOPMENT_FEATURES.map((feature) => {
      const disabled = !feature.action;
      return '<article class="pfh-product-development-card' + (disabled ? ' is-disabled' : '') + '"><div class="pfh-product-development-card-head"><span>' + iconHtml(feature.icon) + '</span></div><h3>' + escapeHtml(feature.title) + '</h3><p>' + escapeHtml(feature.subtitle) + '</p>' + (feature.action ? '<button type="button" data-action="' + feature.action + '"' + (!sku ? ' disabled' : '') + '>打开功能 →</button>' : '<small>功能占位</small>') + '</article>';
    }).join('');
    return '<div class="pfh-product-development">' + productDevelopmentModeSwitchHtml() +
      '<section class="pfh-product-development-hero"><div><small>PRODUCT DEVELOPMENT</small><h2>产品开发工作台</h2><p>先制作侵权图和文案，再查看产品详情预填表单；默认只读，只有 BOM 区域人工点击“保存到 PLM”才写入。</p></div><span class="pfh-product-development-readonly">默认只读 PLM</span></section>' +
      productDevelopmentSkuSummaryHtml(snapshot) +
      productDevelopmentEvidenceHtml(snapshot) +
      '<section class="pfh-product-development-section"><header><div><small>FUNCTION MAP</small><h3>开发功能</h3></div><span>共用浮窗布局，和设计任务分区</span></header><div class="pfh-product-development-grid">' + cards + '</div></section>' +
      '<section class="pfh-product-development-section pfh-product-development-history"><header><div><small>LOCAL HISTORY</small><h3>本地历史</h3></div><span>最多保留 ' + PRODUCT_DEVELOPMENT_MAX_HISTORY + ' 条</span></header><div>' + productDevelopmentHistoryHtml() + '</div></section>' +
      '<p class="pfh-product-development-note">合规提示：AI 结果只能作为草稿，必须人工核对品牌、禁词、成分和平台规则；侵权图、文案和详情字段不自动写回，BOM 仅在明确点击保存后调用 PLM 接口。</p></div>';
  }

  function productDevelopmentReviewHtml() {
    const result = state.productDevelopmentReview;
    const sku = getProductDevelopmentCurrentSku();
    const resultMatchesCurrentSku = Boolean(result && result.sku === sku);
    const canShowResult = Boolean(result && (resultMatchesCurrentSku || result.fromHistory));
    const items = canShowResult ? result.items || [] : [];
    const extractedTexts = canShowResult && Array.isArray(result.extractedTexts) ? result.extractedTexts : [];
    const riskCount = items.filter((item) => Array.isArray(item && item.riskTypes) && item.riskTypes.length).length;
    const extractedSummary = extractedTexts.length ? '<div class="pfh-product-development-preview-note"><strong>已读取 ' + extractedTexts.length + ' 项文字，识别风险 ' + riskCount + ' 项。</strong></div>' : '';
    const preview = result && result.comparisonDataUrl ? '<section class="pfh-product-development-preview"><div class="pfh-product-development-preview-head"><strong>三列对照图预览</strong><small>预览按容器自适应，下载 PNG 保留大字版</small></div><div class="pfh-product-development-preview-scroll"><img src="' + escapeHtml(result.comparisonDataUrl) + '" alt="侵权对照图" style="display:block;width:100%;min-width:0;max-width:100%;height:auto;object-fit:contain"></div><button type="button" data-action="product-development-review-download">下载 PNG</button></section>' : '';
    const list = canShowResult
      ? (result.fromHistory
        ? '<section class="pfh-product-development-history-readonly"><strong>本地历史对照图</strong><p>当前打开的是已保存的 PNG 结果，可查看和下载。若要修改文字，请重新分析当前对标图片。</p></section>'
        : productDevelopmentReviewEditorHtml(result, items))
      : '<div class="pfh-product-development-result-empty">完成分析后，这里会列出原图文字、风险类型和修改内容，并支持手动修改。</div>';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>IMAGE REVIEW</small><h2>产品图风险筛查</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>生成侵权对照图</h3><p>使用当前 SKU 的对标图片生成三列对照图。</p></div><button type="button" data-action="product-development-review-run"' + (state.productDevelopmentReviewBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentReviewBusy ? '正在分析…' : '开始一次分析') + '</button></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '') +
      extractedSummary +
      (canShowResult ? productDevelopmentProductNamingHtml(result) : '') +
      preview + list +
      '<p class="pfh-product-development-note">结果仅在本地生成，不修改原图或写入 PLM。</p></div>';
  }

  function productDevelopmentCopywritingPreviewHtml(content) {
    if (!content) return '<div class="pfh-product-development-result-empty">生成后显示 A-D 四个字段的中英文条目。</div>';
    const rows = [
      ['A 产品功效', content.efficacy],
      ['B 产品优势', content.advantages],
      ['C 产品卖点', content.sellingPoints],
      ['D 成分功能', content.ingredientFunctions],
    ];
    return '<div class="pfh-product-development-copywriting-preview">' + rows.map((row) => '<section><h4>' + escapeHtml(row[0]) + '</h4><div><ol>' + row[1].map((item) => '<li><span>' + escapeHtml(item.en || item.ingredientEn) + '</span><em>' + escapeHtml(item.cn || item.ingredientCn) + '</em></li>').join('') + '</ol></div></section>').join('') + '</div>';
  }

  function productDevelopmentCopywritingHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const content = state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.sku === sku ? state.productDevelopmentCopywriting.content : null;
    const templateVersion = state.productDevelopmentTemplateVersion || PRODUCT_DEVELOPMENT_TEMPLATE_VERSION + '（内置）';
    const ingredientCount = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku ? state.productDevelopmentSnapshot.ingredients.length : '--';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>DOCX COPYWRITING</small><h2>A-D 双语文案 DOCX</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>只生成 A-D 字段</h3><p>英文放第二列，中文放第三列，第四列留白；成分功能覆盖当前 PLM 读取到的全部有效成分。</p></div><button type="button" data-action="product-development-copywriting-run"' + (state.productDevelopmentCopywritingBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentCopywritingBusy ? '正在生成…' : '生成 DOCX') + '</button></section>' +
      '<section class="pfh-product-development-template-card"><div><small>模板版本</small><strong>' + escapeHtml(templateVersion) + '</strong></div><label class="pfh-product-development-template-picker">替换本地模板<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="pfh-product-development-template-input"></label><button type="button" data-action="product-development-template-reset">恢复内置模板</button><span>当前有效成分：' + escapeHtml(String(ingredientCount)) + ' 个</span></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '') +
      (state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.blob ? '<div class="pfh-product-development-download-row"><button type="button" data-action="product-development-copywriting-download">下载 ' + escapeHtml(state.productDevelopmentCopywriting.fileName) + '</button><small>已完成禁词、品牌、星号、条数和成分覆盖校验</small></div>' : '') +
      productDevelopmentCopywritingPreviewHtml(content) +
      '<p class="pfh-product-development-note">内置模板为版本化四列表格；可以替换为你们的 DOCX 样式模板。生成结果只下载到本地，暂不自动上传或回写 PLM。</p></div>';
  }

  function productDevelopmentViewHtml(statusText) {
    const view = state.productDevelopmentView === 'review' ? 'review' : (state.productDevelopmentView === 'copywriting' ? 'copywriting' : 'home');
    if (view === 'review') return productDevelopmentReviewHtml(statusText);
    if (view === 'copywriting') return productDevelopmentCopywritingHtml(statusText);
    if (state.productDevelopmentView === 'history') return productDevelopmentHistoryViewHtml(statusText);
    return homeViewHtml(statusText);
  }

  function productDevelopmentHandleAction(action, actionTarget) {
    if (action === 'work-mode') {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      setProductDevelopmentWorkMode(actionTarget && actionTarget.getAttribute('data-work-mode'));
      return true;
    }
    if (action === 'product-development-home') {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      state.view = 'home';
      state.productDevelopmentView = 'home';
      state.productDevelopmentError = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-tasks-open') {
      openProductDevelopmentTaskWorkspace();
      return true;
    }
    if (action === 'product-development-tasks-home') {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
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
    if (action === 'product-development-task-list-toggle') {
      state.productDevelopmentTaskListOpen = state.productDevelopmentTaskListOpen === false;
      saveProductDevelopmentTaskListOpen(state.productDevelopmentTaskListOpen);
      renderShell();
      return true;
    }
    if (action === 'product-development-task-meta-save') {
      const sku = getProductDevelopmentCurrentSku();
      const meta = getProductDevelopmentTaskMeta(state.productDevelopmentSelectedTask, state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku]);
      saveProductDevelopmentTaskMeta(sku, meta);
      if (!state.productDevelopmentTaskMeta || typeof state.productDevelopmentTaskMeta !== 'object') state.productDevelopmentTaskMeta = Object.create(null);
      state.productDevelopmentTaskMeta[sku] = meta;
      state.productDevelopmentStatus = '产品品牌、名称和返工编码已保存到本地';
      renderShell();
      return true;
    }
    if (action === 'product-development-bom-save-local') {
      productDevelopmentSaveBomLocally(actionTarget && actionTarget.getAttribute('data-bom-sku') || getProductDevelopmentCurrentSku());
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
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      renderShell();
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
      renderShell();
      return true;
    }
    if (action === 'product-development-history-view') {
      state.productDevelopmentView = 'history';
      state.productDevelopmentError = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-history-open') {
      const historyId = String(actionTarget && actionTarget.getAttribute('data-history-id') || '');
      const item = normalizeProductDevelopmentHistory(state.productDevelopmentHistory).find((record) => record.id === historyId);
      productDevelopmentOpenHistory(item);
      return true;
    }
    if (action === 'product-development-review-open') {
      state.workMode = 'product-development';
      state.settings.workMode = 'product-development';
      saveSettings(state.settings);
      restoreProductDevelopmentReviewDraft(getProductDevelopmentCurrentSku());
      if (state.view === 'productDevelopmentTasks') {
        state.productDevelopmentTaskPreviousTab = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
        state.productDevelopmentTaskView = 'review';
        state.productDevelopmentError = '';
        state.productDevelopmentStatus = '';
        renderShell();
        return true;
      }
      state.productDevelopmentView = 'review';
      state.view = 'home';
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-review-run') {
      runProductDevelopmentReview();
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
      state.productDevelopmentStatus = '已添加手动文字项，请填写原文和修改内容';
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
      state.workMode = 'product-development';
      state.settings.workMode = 'product-development';
      saveSettings(state.settings);
      if (state.view === 'productDevelopmentTasks') {
        state.productDevelopmentTaskPreviousTab = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
        state.productDevelopmentTaskView = 'copywriting';
        state.productDevelopmentError = '';
        state.productDevelopmentStatus = '';
        renderShell();
        return true;
      }
      state.productDevelopmentView = 'copywriting';
      state.view = 'home';
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      renderShell();
      return true;
    }
    if (action === 'product-development-copywriting-run') {
      runProductDevelopmentCopywriting();
      return true;
    }
    if (action === 'product-development-copywriting-download') {
      const result = state.productDevelopmentCopywriting;
      if (!result || !result.blob) {
        showToast('暂无可下载的 DOCX');
        return true;
      }
      downloadBlob(result.blob, result.fileName || productDevelopmentFileName(result.sku, 'copywriting-A-D', 'docx'));
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
      resetProductDevelopmentTemplate();
      return true;
    }
    return false;
  }

  function productDevelopmentHandleChange(event) {
    const target = event && event.target;
    if (!target || !target.classList) return false;
    const files = Array.from(target.files || []);
    if (target.classList.contains('pfh-product-development-benchmark-input')) {
      target.value = '';
      if (files[0]) importProductDevelopmentBenchmarkImage(files[0]).catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (productDevelopmentHandleMaterialField(target)) return true;
    if (!target.classList.contains('pfh-product-development-template-input')) return false;
    target.value = '';
    if (files[0]) importProductDevelopmentTemplate(files[0]).catch((error) => showToast(formatErrorMessage(error)));
    return true;
  }

  function productDevelopmentHandleInput(event) {
    const target = event && event.target;
    if (!target || !target.classList) return false;
    if (productDevelopmentHandleMaterialField(target)) return true;
    if (target.classList.contains('pfh-product-development-form-input')) {
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
      if (detail && group === 'bom') {
        const match = key.match(/^(\d+)\.(.+)$/);
        const row = match && Array.isArray(detail.bomRows) ? detail.bomRows[Number(match[1])] : null;
        const rowKey = match && match[2];
        if (row && rowKey && Object.prototype.hasOwnProperty.call(row, rowKey)) {
          row[rowKey] = String(target.value || '').slice(0, 800);
          persistDetail();
          return true;
        }
      }
      if (detail && group === 'attachments') {
        const match = key.match(/^(\d+)\.displayValue$/);
        const item = match && Array.isArray(detail.attachments) ? detail.attachments[Number(match[1])] : null;
        if (item) {
          item.displayValue = String(target.value || '').slice(0, 800);
          item.status = item.displayValue.trim() ? '已填写（本地）' : '未读取';
          persistDetail();
          return true;
        }
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
        meta[field] = String(target.value || '').slice(0, field === 'reworkProductCode' ? 120 : 180);
        state.productDevelopmentTaskMeta[sku] = meta;
        saveProductDevelopmentTaskMeta(sku, meta);
        scheduleProductDevelopmentTaskMetaSave(sku, meta);
        if (field === 'productNameCn') {
          const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
          if (detail) {
            productDevelopmentEnsureMaterialDrafts(detail, state.productDevelopmentSelectedTask || {});
            ['box', 'label'].forEach((kind) => productDevelopmentRecalculateMaterialDraft(kind, detail.materialDrafts[kind], detail, state.productDevelopmentSelectedTask || {}));
            detail.bomDraftDirty = true;
            detail.bomDraftSaveState = 'dirty';
            detail.bomPlmSaveState = '';
            detail.bomPlmSaveMessage = '';
            detail.cacheSource = 'local-cache';
            scheduleProductDevelopmentReadonlyDetailCache(sku, detail);
            ['box', 'label'].forEach((kind) => productDevelopmentSyncMaterialDraftDom(sku, kind, detail.materialDrafts[kind]));
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
    if (!target.classList.contains('pfh-product-development-review-input')) return false;
    const result = state.productDevelopmentReview;
    const index = Number(target.getAttribute('data-review-index'));
    const field = String(target.getAttribute('data-review-field') || '');
    const item = result && Array.isArray(result.items) && Number.isInteger(index) ? result.items[index] : null;
    if (!item) return true;
    if (field === 'sourceText' || field === 'replacementEn' || field === 'replacementZh') {
      item[field] = String(target.value || '').slice(0, 500);
      scheduleProductDevelopmentReviewDraftSave(result);
      return true;
    }
    return true;
  }
