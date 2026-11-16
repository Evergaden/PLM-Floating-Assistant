  const STORAGE_PREFIX = 'plm-floating-helper:data:';
  const STORAGE_INDEX_KEY = 'plm-floating-helper:index';
  const POSITION_KEY = 'plm-floating-helper:position';
  const LAUNCHER_POSITION_KEY = 'plm-floating-helper:launcher-position';
  const SPLIT_KEY = 'plm-floating-helper:split-width';
  const SIZE_KEY = 'plm-floating-helper:size';
  const WORKSPACE_SIZE_KEY = 'plm-floating-helper:size:workspace';
  const DEFAULT_PANEL_WIDTH = 890;
  const DEFAULT_PANEL_HEIGHT = 943;
  const INITIAL_LAYOUT = Object.freeze({
    panelLeftRatio: 67 / 1920,
    panelTopRatio: 129 / 1080,
    launcherLeftRatio: 674 / 1920,
    launcherTopRatio: 940 / 1080,
    splitWidth: 237,
  });
  const SETTINGS_KEY = 'plm-floating-helper:settings';
  const SUPPLEMENT_FACTS_KEY = 'plm-floating-helper:supplement-facts:v1';
  const SUPPLEMENT_FACTS_DEFAULT_ROWS = Object.freeze([
    Object.freeze({ name: 'Vitamin B6 (as Pyridoxine Hydrochloride)', amount: '10 mg', dailyValue: '588%' }),
    Object.freeze({ name: 'Vitamin D3 (as Cholecalciferol)', amount: '25 mcg (1,000 IU)', dailyValue: '125%' }),
    Object.freeze({ name: 'Zinc (as Zinc Citrate)', amount: '15 mg', dailyValue: '136%' }),
    Object.freeze({ name: 'Selenium (as L-Selenomethionine)', amount: '100 mcg', dailyValue: '182%' }),
    Object.freeze({ name: 'Boron (as Boron Citrate)', amount: '3 mg', dailyValue: '**' }),
    Object.freeze({ name: 'Shilajit Extract (standardized to 20% Fulvic Acid)', amount: '250 mg', dailyValue: '**' }),
    Object.freeze({ name: 'Maca Root Extract (10:1)', amount: '200 mg', dailyValue: '**' }),
    Object.freeze({ name: 'Ginseng Extract (Panax ginseng, 10% Ginsenosides)', amount: '100 mg', dailyValue: '**' }),
  ]);
  const SUPPLEMENT_FACTS_DEFAULT_DRAFT = Object.freeze({
    title: 'Supplement Facts',
    servingSize: '2 Capsules',
    servingsPerContainer: '30',
    filename: 'supplement-facts.pdf',
    showFooter: true,
    rows: SUPPLEMENT_FACTS_DEFAULT_ROWS,
  });

  function cloneSupplementFactsDefaultDraft() {
    return {
      title: SUPPLEMENT_FACTS_DEFAULT_DRAFT.title,
      servingSize: SUPPLEMENT_FACTS_DEFAULT_DRAFT.servingSize,
      servingsPerContainer: SUPPLEMENT_FACTS_DEFAULT_DRAFT.servingsPerContainer,
      filename: SUPPLEMENT_FACTS_DEFAULT_DRAFT.filename,
      showFooter: SUPPLEMENT_FACTS_DEFAULT_DRAFT.showFooter,
      rows: SUPPLEMENT_FACTS_DEFAULT_ROWS.map((row) => ({ ...row })),
    };
  }

  function normalizeSupplementFactsDraft(value) {
    let source = value && typeof value === 'object' ? value : {};
    if (typeof value === 'string') {
      try { source = JSON.parse(value); } catch (error) { source = {}; }
    }
    const rawRows = Array.isArray(source.rows) && source.rows.length
      ? source.rows
      : SUPPLEMENT_FACTS_DEFAULT_ROWS;
    const rows = rawRows.map((row) => ({
      name: String(row && row.name || '').trim(),
      amount: String(row && row.amount || '').trim(),
      dailyValue: String(row && row.dailyValue || '').trim(),
    }));
    return {
      title: String(source.title == null ? SUPPLEMENT_FACTS_DEFAULT_DRAFT.title : source.title).trim() || SUPPLEMENT_FACTS_DEFAULT_DRAFT.title,
      servingSize: String(source.servingSize == null ? SUPPLEMENT_FACTS_DEFAULT_DRAFT.servingSize : source.servingSize).trim() || SUPPLEMENT_FACTS_DEFAULT_DRAFT.servingSize,
      servingsPerContainer: String(source.servingsPerContainer == null ? SUPPLEMENT_FACTS_DEFAULT_DRAFT.servingsPerContainer : source.servingsPerContainer).trim() || SUPPLEMENT_FACTS_DEFAULT_DRAFT.servingsPerContainer,
      filename: String(source.filename == null ? SUPPLEMENT_FACTS_DEFAULT_DRAFT.filename : source.filename).trim() || SUPPLEMENT_FACTS_DEFAULT_DRAFT.filename,
      showFooter: source.showFooter !== false,
      rows,
    };
  }

  function loadSupplementFactsDraft() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(SUPPLEMENT_FACTS_KEY, null)
        : JSON.parse(localStorage.getItem(SUPPLEMENT_FACTS_KEY) || 'null');
      return saved ? normalizeSupplementFactsDraft(saved) : cloneSupplementFactsDefaultDraft();
    } catch (error) {
      return cloneSupplementFactsDefaultDraft();
    }
  }

  function saveSupplementFactsDraft(value) {
    const draft = normalizeSupplementFactsDraft(value);
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SUPPLEMENT_FACTS_KEY, draft);
      else localStorage.setItem(SUPPLEMENT_FACTS_KEY, JSON.stringify(draft));
    } catch (error) {
      // Storage is optional; the editor remains usable for the current page.
    }
    return draft;
  }

  const HOME_FEATURE_DEFINITIONS = Object.freeze([
    Object.freeze({ id: 'detail', action: 'open-first-detail', icon: 'folder', title: '我的详情', description: '查看我的产品资料与任务，\n自动检查并加入新的设计分配。' }),
    Object.freeze({ id: 'batchExcel', action: 'home-batch-excel', icon: 'batchExcel', title: '批量生成 Excel', description: '输入多个 SKU 补全产品资料，\n按需分别下载或合并成表。' }),
    Object.freeze({ id: 'upload', action: 'upload-toggle', icon: 'upload', title: '批量提审上传', description: '批量添加文件并提交上传，\n在队列中查看每项处理状态。' }),
    Object.freeze({ id: 'magicUpload', action: 'home-magic-upload', icon: 'upload', title: '魔法上传', description: '自动识别图包中的商品编码，\n批量上传文件并跟踪进度。' }),
    Object.freeze({ id: 'parameterImage', action: 'home-parameter-image', icon: 'image', title: '生成参数图', description: '整理产品尺寸与相关参数，\n生成尺寸图和英文参数图。' }),
    Object.freeze({ id: 'ledger', action: 'ledger-open', icon: 'taskPlan', title: '今日工作台', description: '集中查看设计分配与定稿，\n跟进纸盒、标签和图包进度。' }),
    Object.freeze({ id: 'tools', action: 'home-tools', icon: 'tools', title: '小工具', description: '常用换算和编码整理，\n支持批量补全玩具文案。' }),
    Object.freeze({ id: 'feedback', action: 'home-feedback', icon: 'messageCircle', title: '提交反馈', description: '记录使用中遇到的问题，\n也欢迎分享你的改进建议。' }),
  ]);
  const DEFAULT_HOME_FEATURE_GROUPS = Object.freeze({
    common: Object.freeze(['detail', 'batchExcel', 'upload', 'magicUpload', 'parameterImage']),
    more: Object.freeze(['ledger', 'tools', 'feedback']),
  });
  function normalizeHomeFeatureGroups(value) {
    const source = value && typeof value === 'object' ? value : {};
    const known = new Set(HOME_FEATURE_DEFINITIONS.map((item) => item.id));
    const seen = new Set();
    const groups = { common: [], more: [] };
    const append = (group, item) => {
      const id = String(item || '').trim();
      if (!known.has(id) || seen.has(id)) return;
      seen.add(id);
      groups[group].push(id);
    };
    (Array.isArray(source.common) ? source.common : []).forEach((id) => append('common', id));
    (Array.isArray(source.more) ? source.more : []).forEach((id) => append('more', id));
    DEFAULT_HOME_FEATURE_GROUPS.common.forEach((id) => append('common', id));
    DEFAULT_HOME_FEATURE_GROUPS.more.forEach((id) => append('more', id));
    return groups;
  }
  const DEFAULT_THEME_ID = 'default';
  const THEME_SKIN_VERSION = 2;
  const LULU_THEME_RESOURCE_PATH = '/assets/v9/plm-lulu-theme.user.js';
  const LULU_THEME_RESOURCE_VERSION = '1.8.0';
  const THEME_OPTIONS = Object.freeze([
    { id: 'lulu', name: '噜噜乐园', primary: '#f39a3d', primaryHover: '#d97722', primarySoft: '#fff2d7', secondary: '#e4c641', secondarySoft: '#fff9d8', page: '#fffaf0', surface: '#fffef9', surfaceAlt: '#fff7e7', border: '#f0d8ad', borderStrong: '#e8b76b', text: '#5b4634', muted: '#9a8064', header: '#fff3cf' },
    { id: 'default', name: '默认', primary: '#7c3aed', primaryHover: '#5b21b6', primarySoft: '#f3efff', secondary: '#0891b2', secondarySoft: '#e8f7fa', page: '#fafbff', surface: '#ffffff', surfaceAlt: '#f7f8fc', border: '#d8deea', borderStrong: '#b9a8ed', text: '#1f2937', muted: '#64748b', header: '#f5f7fb' },
    { id: 'gold', name: '金黄色', primary: '#d8bd78', primaryHover: '#a78d4f', primarySoft: '#fff9e7', secondary: '#c5a976', secondarySoft: '#fff7e8', page: '#fffdf8', surface: '#fffefa', surfaceAlt: '#fffbf0', border: '#eee5ca', borderStrong: '#ddc98f', text: '#665a3f', muted: '#9e9273', header: '#fff8df' },
    { id: 'light-orange', name: '浅橙色', primary: '#e3a276', primaryHover: '#b87850', primarySoft: '#fff4ed', secondary: '#d9b07d', secondarySoft: '#fff7eb', page: '#fffdfb', surface: '#ffffff', surfaceAlt: '#fff9f4', border: '#f0dfd1', borderStrong: '#e5bfa6', text: '#6c574b', muted: '#a08b7f', header: '#fff4eb' },
    { id: 'brick-red', name: '砖红色', primary: '#c68c82', primaryHover: '#a4665d', primarySoft: '#fff2ef', secondary: '#c38383', secondarySoft: '#fff0f0', page: '#fffdfc', surface: '#ffffff', surfaceAlt: '#fff8f7', border: '#eedbd8', borderStrong: '#dfb8b0', text: '#664b49', muted: '#9c807d', header: '#ffefec' },
    { id: 'crimson', name: '鸢红色', primary: '#cf909d', primaryHover: '#aa6876', primarySoft: '#fff1f4', secondary: '#ca86a1', secondarySoft: '#fff0f5', page: '#fffdfd', surface: '#ffffff', surfaceAlt: '#fff8fa', border: '#eed9de', borderStrong: '#e1b5bf', text: '#684c55', muted: '#9e8089', header: '#ffedf1' },
    { id: 'red', name: '红色', primary: '#dc929d', primaryHover: '#b86a76', primarySoft: '#fff1f3', secondary: '#d18b9a', secondarySoft: '#fff0f3', page: '#fffdfd', surface: '#ffffff', surfaceAlt: '#fff8f9', border: '#f0d8dc', borderStrong: '#e4b2bb', text: '#6c4a52', muted: '#a18088', header: '#ffedf0' },
    { id: 'rose', name: '玫瑰色', primary: '#d99bb6', primaryHover: '#b87495', primarySoft: '#fff0f6', secondary: '#cf91b4', secondarySoft: '#fff0f7', page: '#fffdfd', surface: '#ffffff', surfaceAlt: '#fff8fb', border: '#eed9e4', borderStrong: '#e2b4cb', text: '#684e5f', muted: '#a08293', header: '#ffedf5' },
    { id: 'blue', name: '蓝色', primary: '#82acd8', primaryHover: '#5f83b0', primarySoft: '#edf6ff', secondary: '#7eb8c2', secondarySoft: '#edf9fa', page: '#fbfdff', surface: '#ffffff', surfaceAlt: '#f5faff', border: '#d9e7f3', borderStrong: '#b8d0e7', text: '#4c6276', muted: '#8498a9', header: '#edf7ff' },
    { id: 'pink-tail', name: '粉黛尾花色', primary: '#d5a0bc', primaryHover: '#af7597', primarySoft: '#fff1f7', secondary: '#c99cbd', secondarySoft: '#fff1f8', page: '#fffdfd', surface: '#ffffff', surfaceAlt: '#fff8fc', border: '#eedbe7', borderStrong: '#dfb8d1', text: '#665065', muted: '#9f8399', header: '#ffedf6' },
    { id: 'iris', name: '蕾蒲色', primary: '#b996c7', primaryHover: '#8f6ca0', primarySoft: '#faf1fc', secondary: '#a79acb', secondarySoft: '#f5f2fc', page: '#fefcff', surface: '#ffffff', surfaceAlt: '#fbf6fd', border: '#e8ddec', borderStrong: '#d0b9dc', text: '#5c4e64', muted: '#95869d', header: '#f9effa' },
    { id: 'light-blue', name: '浅蓝色', primary: '#91c5dd', primaryHover: '#6699b4', primarySoft: '#eef9fd', secondary: '#83c3c6', secondarySoft: '#edfafa', page: '#fbfeff', surface: '#ffffff', surfaceAlt: '#f5fbfd', border: '#d9ebf1', borderStrong: '#b2d6e1', text: '#4d6570', muted: '#8499a1', header: '#edf9fc' },
    { id: 'seagreen', name: '海泡石', primary: '#87c5c1', primaryHover: '#5e9996', primarySoft: '#eefaf8', secondary: '#7ebaa4', secondarySoft: '#edf9f3', page: '#fbfefd', surface: '#ffffff', surfaceAlt: '#f4fbf9', border: '#d7ece8', borderStrong: '#afd5cd', text: '#4d6a67', muted: '#849d99', header: '#ecfaf7' },
    { id: 'sky', name: '天青色', primary: '#77bdc8', primaryHover: '#51909b', primarySoft: '#ebf9fb', secondary: '#86b8d1', secondarySoft: '#edf7fb', page: '#fbfeff', surface: '#ffffff', surfaceAlt: '#f4fbfc', border: '#d4ebee', borderStrong: '#aad5dc', text: '#4c6870', muted: '#82979c', header: '#ebf9fa' },
    { id: 'gray', name: '灰色', primary: '#a5afb9', primaryHover: '#78848f', primarySoft: '#f1f4f6', secondary: '#9cabb8', secondarySoft: '#f0f4f6', page: '#fcfdfe', surface: '#ffffff', surfaceAlt: '#f7f9fa', border: '#e3e8ec', borderStrong: '#cbd5dc', text: '#59636d', muted: '#8f99a3', header: '#f3f6f8' },
    { id: 'green', name: '绿色', primary: '#8cbe93', primaryHover: '#64946d', primarySoft: '#eff9f0', secondary: '#7db9a5', secondarySoft: '#edf9f3', page: '#fbfefb', surface: '#ffffff', surfaceAlt: '#f5fbf5', border: '#d9eddc', borderStrong: '#b5d6b9', text: '#506b56', muted: '#879e8b', header: '#effaf0' },
    { id: 'cloudy', name: '阴天', primary: '#a3b1b6', primaryHover: '#788a91', primarySoft: '#f1f5f6', secondary: '#91b0b6', secondarySoft: '#eff7f8', page: '#fcfefe', surface: '#ffffff', surfaceAlt: '#f6fafb', border: '#e0eaec', borderStrong: '#c2d2d6', text: '#586b70', muted: '#8b9ba0', header: '#f0f6f7' },
    { id: 'storm', name: '风暴', primary: '#8fa2b6', primaryHover: '#687c92', primarySoft: '#eef3f8', secondary: '#88aeba', secondarySoft: '#edf7fa', page: '#fbfdff', surface: '#ffffff', surfaceAlt: '#f5f9fc', border: '#dbe5ee', borderStrong: '#b9cbdc', text: '#526376', muted: '#8796a6', header: '#eef5fa' },
    { id: 'blue-gray', name: '蓝灰色', primary: '#8caaba', primaryHover: '#668494', primarySoft: '#eef7fa', secondary: '#89b7be', secondarySoft: '#eef8f9', page: '#fbfeff', surface: '#ffffff', surfaceAlt: '#f4fafc', border: '#d9e9ed', borderStrong: '#b5d0d8', text: '#506a75', muted: '#879ba2', header: '#edf8fa' },
    { id: 'dark-gray', name: '暗灰色', primary: '#98a3aa', primaryHover: '#707c84', primarySoft: '#f0f3f4', secondary: '#8fa8a9', secondarySoft: '#eef6f5', page: '#fcfefe', surface: '#ffffff', surfaceAlt: '#f6f9f9', border: '#e0e6e8', borderStrong: '#c4d0d3', text: '#56636a', muted: '#8b989d', header: '#f1f5f6' },
    { id: 'camouflage', name: '迷彩色', primary: '#aab88c', primaryHover: '#7f9061', primarySoft: '#f3f8e9', secondary: '#9dbb94', secondarySoft: '#f0f8ee', page: '#fcfefb', surface: '#ffffff', surfaceAlt: '#f7fbf2', border: '#e2ecd8', borderStrong: '#c5d5b2', text: '#5b6a4f', muted: '#909e84', header: '#f0f7e8' },
  ]);
  const THEME_BY_ID = Object.freeze(THEME_OPTIONS.reduce((map, theme) => { map[theme.id] = theme; return map; }, Object.create(null)));

  // Theme resolution and application live in the ui-loader module, which is
  // injected later in the file and owns the canonical implementations.

  const TUTORIAL_SEEN_KEY = 'plm-floating-helper:tutorial-seen';
  const UPLOAD_QUEUE_KEY = 'plm-floating-helper:upload-queue';
  const EXCEL_BATCH_QUEUE_KEY = 'plm-floating-helper:excel-batch-queue';
  const EXCEL_BATCH_PREPARE_RETRIES = 3;
  const MANUAL_SKU_ADD_QUEUE_KEY = 'plm-floating-helper:manual-sku-add-queue:v1';
  const MANUAL_SKU_ADD_DELAY_MS = 1100;
  const MANUAL_SKU_ADD_MAX_ITEMS = 500;
  let manualSkuAddWorkerPromise = null;
  let manualSkuImageRefreshPromise = null;
  const UPLOAD_HISTORY_KEY = 'plm-floating-helper:upload-history';
  const UPLOAD_WORKER_KEY = 'plm-floating-helper:upload-worker-running';
  const UPLOAD_WORKER_STATES_KEY = 'plm-floating-helper:upload-worker-states';
  const UPLOAD_MODES = Object.freeze(['standard', 'toy-label', 'toy-effect', 'copyright']);
  const TOY_COPYWRITING_BATCH_KEY = 'plm-floating-helper:toy-copywriting-batch';
  const TOY_LABEL_EXPORT_MANIFEST_KEY = 'plm-floating-helper:toy-label-export-manifest';
  const LOG_KEY = 'plm-floating-helper:logs';
  const INSIGHTS_KEY = 'plm-floating-helper:insights';
  const USER_INSTANCE_KEY = 'plm-floating-helper:user-instance';
  const FEATURE_ACCESS_CACHE_KEY = 'plm-floating-helper:feature-access-cache:v1';
  const FEATURE_ACCESS_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  const FEATURE_ACCESS_CACHE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
  const DAILY_LEDGER_KEY = 'plm-floating-helper:daily-ledger';
  const DAILY_LEDGER_TRASH_KEY = 'plm-floating-helper:daily-ledger-trash';
  const DAILY_LEDGER_SERIES_EXCLUDED_KEY = 'plm-floating-helper:daily-ledger-series-excluded';
  const DAILY_LEDGER_MANUAL_MIGRATION_KEY = 'plm-floating-helper:daily-ledger-manual-migration:v1';
  const LEDGER_PERFORMANCE_GROUP_MAX_ITEMS = 300;
  // PLM reuses GetGenPicAiResult for both initial submission and polling:
  // the first request needs copywrite, while later requests only need code.
  // Keep the initial read path separate from the explicit generation action.
  const LEDGER_AI_IMAGE_COPYWRITING_ENDPOINT = '/api/ProjectFormData/GetProductTextAiResult';
  const LEDGER_AI_IMAGE_TASK_ENDPOINT = '/api/ProjectFormData/CheckGenPicTaskExists';
  const LEDGER_AI_IMAGE_RESULT_ENDPOINT = '/api/ProjectFormData/GetGenPicAiResult';
  const LEDGER_AI_IMAGE_RETOUCH_ENDPOINT = '/api/ProjectFormData/GetRetouchAiResult';
  const LEDGER_AI_IMAGE_POLL_DELAY_MS = 5000;
  const LEDGER_AI_IMAGE_MAX_POLLS = 60;
  const LEDGER_AI_IMAGE_RETOUCH_TIMEOUT_MS = 120000;
  const LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS = 60;
  const LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS = 20;
  const LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS = 120;
  const LEDGER_AI_IMAGE_DOWNLOAD_CONCURRENCY = 4;
  const LEDGER_AI_IMAGE_RETOUCH_QUICK_PHRASES = Object.freeze([
    Object.freeze({ group: '包装与材质', text: '内料改成XX色' }),
    Object.freeze({ group: '包装与材质', text: '把内料改成XX色，其他元素保持不变' }),
    Object.freeze({ group: '包装与材质', text: '纸盒不要展示侧面，只保留正面' }),
    Object.freeze({ group: '包装与材质', text: '纸盒只展示正面和顶部，不要出现侧面' }),
    Object.freeze({ group: '包装与材质', text: '将瓶身材质改成磨砂质感，保持瓶型和文字不变' }),
    Object.freeze({ group: '包装与材质', text: '将包装颜色改成XX色，保持品牌、文字和版式不变' }),
    Object.freeze({ group: '删减元素', text: '去除纸盒' }),
    Object.freeze({ group: '删减元素', text: '去除瓶子' }),
    Object.freeze({ group: '删减元素', text: '去除多余的手' }),
    Object.freeze({ group: '删减元素', text: '去除多余人物、手指和肢体' }),
    Object.freeze({ group: '删减元素', text: '去除背景中多余物体和杂物' }),
    Object.freeze({ group: '删减元素', text: '去除包装上的多余标签、贴纸和水印' }),
    Object.freeze({ group: '文字与版式', text: '保留产品包装上的品牌、成分和规格文字，不要改动' }),
    Object.freeze({ group: '文字与版式', text: '去除图片中所有文字和水印，只保留产品本体' }),
    Object.freeze({ group: '文字与版式', text: '修复并补全被遮挡的英文文字，保持原有字体和排版' }),
    Object.freeze({ group: '文字与版式', text: '把产品调整为居中正面展示，文字保持清晰可读' }),
    Object.freeze({ group: '背景与构图', text: '将背景改成纯白色' }),
    Object.freeze({ group: '背景与构图', text: '将背景改成浅灰色，并保留柔和自然阴影' }),
    Object.freeze({ group: '背景与构图', text: '将背景改成透明背景，只保留完整产品' }),
    Object.freeze({ group: '背景与构图', text: '把产品调整为45度角展示，保持产品比例不变' }),
    Object.freeze({ group: '背景与构图', text: '补全被裁切的产品边缘和包装轮廓' }),
    Object.freeze({ group: '背景与构图', text: '只修改背景，不改变产品本身、包装和文字' }),
    Object.freeze({ group: '质感与修复', text: '去除反光、污渍、划痕和不自然的褶皱' }),
    Object.freeze({ group: '质感与修复', text: '增强产品细节和清晰度，但不要改变产品结构' }),
    Object.freeze({ group: '质感与修复', text: '增加柔和自然的光影和接触阴影' }),
  ]);
  const LEDGER_AI_IMAGE_RENAME_RULES = Object.freeze([
    Object.freeze({ pattern: /^input-main-prompt-1(?:-[a-zA-Z0-9]{8})?$/, name: '主图1' }),
    Object.freeze({ pattern: /^input-main-prompt-2(?:-[a-zA-Z0-9]{8})?$/, name: '主图2' }),
    Object.freeze({ pattern: /^input-main-prompt-3(?:-[a-zA-Z0-9]{8})?$/, name: '主图3' }),
    Object.freeze({ pattern: /^input-main-prompt-4(?:-[a-zA-Z0-9]{8})?$/, name: '主图4' }),
    Object.freeze({ pattern: /^input-main-prompt-5(?:-[a-zA-Z0-9]{8})?$/, name: '主图5' }),
    Object.freeze({ pattern: /^input-main-prompt-6(?:-[a-zA-Z0-9]{8})?$/, name: '主图6' }),
    Object.freeze({ pattern: /^input-main-prompt-7(?:-[a-zA-Z0-9]{8})?$/, name: '主图7' }),
    Object.freeze({ pattern: /^input-detail-sale-prompt-1(?:-.+)?$/, name: '详情图1' }),
    Object.freeze({ pattern: /^input-detail-sale-prompt-2(?:-.+)?$/, name: '详情图2' }),
    Object.freeze({ pattern: /^input-detail-component-prompt(?:-.+)?$/, name: '详情图3' }),
    Object.freeze({ pattern: /^input-detail-advantage-prompt-1(?:-.+)?$/, name: '详情图4' }),
    Object.freeze({ pattern: /^input-detail-advantage-prompt-2(?:-.+)?$/, name: '详情图5' }),
    Object.freeze({ pattern: /^input-detail-details-prompt-1(?:-.+)?$/, name: '详情图6' }),
    Object.freeze({ pattern: /^input-detail-details-prompt-2(?:-.+)?$/, name: '详情图7' }),
    Object.freeze({ pattern: /^input-detail-efficacy-prompt(?:-.+)?$/, name: '详情图8' }),
    Object.freeze({ pattern: /^input-detail-use-step-prompt(?:-.+)?$/, name: '详情图9' }),
    Object.freeze({ pattern: /^input-detail-scene-prompt(?:-.+)?$/, name: '详情图10' }),
  ]);
  const UPLOAD_DB_NAME = 'plm-floating-helper-files';
  const UPLOAD_DB_STORE = 'files';
  const UPLOAD_MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const MAGIC_UPLOAD_QUEUE_KEY = 'plm-floating-helper:magic-upload-queue:v1';
  const MAGIC_UPLOAD_HISTORY_KEY = 'plm-floating-helper:magic-upload-history:v1';
  const MAGIC_UPLOAD_METRICS_KEY = 'plm-floating-helper:magic-upload-metrics:v1';
  const MANUAL_TOY_EFFECT_PACKING_KEY = 'plm-floating-helper:manual-toy-effect-packing:v1';
  const MAGIC_TOY_LABEL_QUEUE_KEY = 'plm-floating-helper:magic-toy-label-queue:v1';
  const MAGIC_TOY_LABEL_HISTORY_KEY = 'plm-floating-helper:magic-toy-label-history:v1';
  const MAGIC_UPLOAD_CONCURRENCY = 3;
  const MAGIC_UPLOAD_MAX_FILE_BYTES = 100 * 1024 * 1024;
  const MAGIC_UPLOAD_XLSX_MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAGIC_UPLOAD_ARCHIVE_MAX_FILE_BYTES = 150 * 1024 * 1024;
  const MAGIC_UPLOAD_IMAGE_MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAGIC_UPLOAD_MEDIA_MAX_FILE_BYTES = 200 * 1024 * 1024;
  const OSS_UPLOAD_SDK_RETRY_MAX = 2;
  const OSS_UPLOAD_RETRY_MAX = 4;
  const OSS_UPLOAD_RETRY_DELAY_MS = 1200;
  const OSS_UPLOAD_TIMEOUT_MS = 120000;
  let magicUploadQueueRunPromise = null;
  let magicToyLabelQueueRunPromise = null;
  let magicUploadEtaTimer = 0;
  const magicUploadSharedOssCache = new Map();
  const magicUploadProgressAnimations = new WeakMap();
  let magicUploadAuthPaused = false;
  let toyEffectCandidateCache = null;
  const MAGIC_UPLOAD_CATEGORIES = Object.freeze({
    '主图': { rule: '主图', archiveTypeId: 1 },
    '英文参数图': { rule: '英文参数图', archiveTypeId: 1 },
    '详情图': { rule: '详情图', archiveTypeId: 1 },
    'SKU图': { rule: 'SKU图', archiveTypeId: 1 },
    '产品参数图': { rule: '产品参数图', archiveTypeId: 1 },
    '视频': { rule: '视频', archiveTypeId: 3 },
    '动图': { rule: '动图', archiveTypeId: 3 },
    '图包素材': { rule: '图包素材', archiveTypeId: 7 },
    '推品资料': { rule: '推品资料', archiveTypeId: 4 },
  });
  const MAGIC_UPLOAD_CATEGORY_DISPLAY_ORDER = Object.freeze(['主图', '详情图', 'SKU图', '英文参数图', '产品参数图', '视频', '动图', '图包素材', '推品资料', '待确认']);
  const MAGIC_UPLOAD_CATEGORY_DISPLAY_LABELS = Object.freeze({ '英文参数图': '英文详情图', '产品参数图': '尺寸图' });
  // ZIP 图包中需要剔除的目录名（第一级目录精确匹配），其内容不进入上传队列，也不显示待确认
  const MAGIC_UPLOAD_IGNORE_DIRS = Object.freeze(['文案']);
  const MAGIC_UPLOAD_ATTRIBUTE_VARIABLES = Object.freeze({
    '主图': 'main_image',
    '英文参数图': 'english_specification_diagram',
    '详情图': 'detail_image',
    'SKU图': 'sku_pic',
    '产品参数图': 'product_parameter_diagram',
    '视频': 'video',
    '动图': 'animated_image',
    '图包素材': 'image_package_materials',
    '推品资料': 'promotion_materials',
  });
  const MAGIC_UPLOAD_PACKING_FIELDS = Object.freeze([
    Object.freeze({ key: 'standardPackingQuantity', variableName: 'standard_packing_quantity', attrName: '标准装箱数', attrId: 123, label: '装箱数' }),
    Object.freeze({ key: 'boxWeight', variableName: 'box_weight', attrName: '箱重', attrId: 301, label: '箱重' }),
  ]);
  const MAGIC_UPLOAD_CARTON_GAUGE_FIELD = Object.freeze({ key: 'cartonSpec', variableName: 'box_gauge', attrName: '箱规', attrId: 149, label: '箱规' });
  const MAGIC_UPLOAD_EXCEL_PACKING_FIELDS = Object.freeze(MAGIC_UPLOAD_PACKING_FIELDS.concat([MAGIC_UPLOAD_CARTON_GAUGE_FIELD]));
  const TOY_EFFECT_MAX_FILES = 3;
  const PROJECT_RESULT_MAX_PAGE_SIZE = 250;
  const TOY_EFFECT_CANDIDATE_CACHE_KEY = 'plm-floating-helper:toy-effect-candidates:v1';
  const TOY_EFFECT_CANDIDATE_CACHE_TTL_MS = 30 * 60 * 1000;
  const TOY_EFFECT_CANDIDATE_CACHE_MAX = PROJECT_RESULT_MAX_PAGE_SIZE;
  const CLOUD_BACKUP_API_BASE = 'https://velvet.qzz.io';
  const CLOUD_ASSET_FALLBACK_API_BASE = 'https://plm-cloud-backup.wt196731.workers.dev';
  const CLOUD_AUTH_TOKEN_KEY = 'plm-floating-helper:cloud-auth-token:v1';
  const CLOUD_AUTH_TOKEN_SKEW_MS = 2 * 60 * 1000;
  const CLOUD_AUTH_TOKEN_WAIT_MS = 8000;
  const CLOUD_AUTH_EXCHANGE_TIMEOUT_MS = 15000;
  // Bootstrap schedules cloud requests before the later function definitions execute.
  // Initialize the auth state here so those requests never observe its TDZ.
  let cloudAuthState = null;
  let cloudAuthExchangePromise = null;
  let cloudApiBase = CLOUD_BACKUP_API_BASE;
  const CLOUD_BACKUP_DEBOUNCE_MS = 8000;
  const CLOUD_BACKUP_KDF_ITERATIONS = 180000;
  const CLOUD_BACKUP_INLINE_LIMIT = 760000;
  const CLOUD_BACKUP_CHUNK_SIZE = 500000;
  const CLOUD_BACKUP_MAX_CHUNKS = 64;
  const PRODUCT_REPLACE_UPLOAD_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe', '\u89c6\u9891', '\u52a8\u56fe', '\u63a8\u54c1\u8d44\u6599', '\u56fe\u5305\u7d20\u6750'];
  const PRODUCT_BATCH_IMAGE_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe'];
  const PLM_API_MONITOR_STATE_KEY = 'plm-floating-helper:api-monitor:v1';
  const PLM_API_MONITOR_MAX_ENTRIES = 160;
  function loadPlmApiMonitorState() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(PLM_API_MONITOR_STATE_KEY, null) : JSON.parse(localStorage.getItem(PLM_API_MONITOR_STATE_KEY) || 'null');
      return { enabled: Boolean(value && value.enabled), entries: Array.isArray(value && value.entries) ? value.entries.slice(0, PLM_API_MONITOR_MAX_ENTRIES) : [] };
    } catch (_) { return { enabled: false, entries: [] }; }
  }
  let plmApiMonitorState = loadPlmApiMonitorState();
  const plmAuthHeaders = Object.create(null);
  function isPlmAuthCaptureTarget(value) {
    if (!value) return false;
    try {
      const url = new URL(String(value || ''), location.href);
      const samePageOrigin = url.origin === location.origin;
      const plmApiOrigin = /^api-x\.westmonth\.com$/i.test(url.hostname);
      return (samePageOrigin || plmApiOrigin) && !/\/assets\//i.test(url.pathname) && !/\.(css|js|png|jpg|svg|woff2?)$/i.test(url.pathname);
    } catch (_) { return false; }
  }
  function isOssAuthorizationHeader(name, value) {
    return /^authorization$/i.test(String(name || '').trim()) && /^(?:OSS|AWS4-HMAC-SHA256)\s/i.test(String(value || '').trim());
  }
  function capturePlmAuthHeaders(headers, requestUrl) {
    // The OSS SDK also sends an Authorization header, but its value is an OSS
    // signature and must never replace the PLM page session header.
    if (!headers || !isPlmAuthCaptureTarget(requestUrl)) return;
    const capture = (name, value) => {
      const headerName = String(name || '').trim();
      if (!headerName || /^x-oss-/i.test(headerName) || !/authorization|(?:^|[-_])(auth|token|session|jwt)(?:$|[-_])/i.test(headerName)) return;
      const headerValue = String(value || '').trim();
      if (isOssAuthorizationHeader(headerName, headerValue)) return;
      if (headerValue && headerValue.length <= 4096) plmAuthHeaders[headerName] = headerValue;
    };
    if (typeof headers.forEach === 'function') {
      headers.forEach((value, name) => capture(name, value));
    } else if (Array.isArray(headers)) {
      headers.forEach((item) => capture(item && item[0], item && item[1]));
    } else if (typeof headers === 'object') {
      Object.keys(headers).forEach((name) => capture(name, headers[name]));
    }
  }
  function getPlmAuthHeaders() {
    return Object.keys(plmAuthHeaders).reduce((headers, name) => {
      if (!isOssAuthorizationHeader(name, plmAuthHeaders[name])) headers[name] = plmAuthHeaders[name];
      return headers;
    }, {});
  }
  function getStoredPlmAccessToken() {
    try {
      const root = typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window;
      const storage = root && root.localStorage;
      const raw = storage && storage.getItem('plmUserData');
      if (!raw) return '';
      const data = JSON.parse(raw);
      const candidates = [data, data && data.data, data && data.user, data && data.userInfo].filter(Boolean);
      const token = candidates.map((item) => item.access_token || item.accessToken || item.token).find(Boolean);
      return /^Bearer\s+/i.test(String(token || ''))
        ? String(token).replace(/^Bearer\s+/i, '').trim()
        : String(token || '').trim();
    } catch (_) {
      return '';
    }
  }
  function getPlmBearerToken() {
    const storedToken = getStoredPlmAccessToken();
    if (storedToken) return storedToken;
    const headers = getPlmAuthHeaders();
    const name = Object.keys(headers).find((key) => /^authorization$/i.test(key));
    const value = name ? String(headers[name] || '').trim() : '';
    return /^Bearer\s+/i.test(value) ? value.replace(/^Bearer\s+/i, '').trim() : '';
  }
  function waitForPlmBearerToken() {
    const first = getPlmBearerToken();
    if (first) return Promise.resolve(first);
    const startedAt = Date.now();
    return new Promise((resolve) => {
      const poll = () => {
        const token = getPlmBearerToken();
        if (token || Date.now() - startedAt >= CLOUD_AUTH_TOKEN_WAIT_MS) {
          resolve(token);
          return;
        }
        window.setTimeout(poll, 200);
      };
      poll();
    });
  }
  function savePlmApiMonitorState() {
    const value = { enabled: Boolean(plmApiMonitorState.enabled), entries: (plmApiMonitorState.entries || []).slice(0, PLM_API_MONITOR_MAX_ENTRIES) };
    if (typeof GM_setValue === 'function') GM_setValue(PLM_API_MONITOR_STATE_KEY, value);
    else localStorage.setItem(PLM_API_MONITOR_STATE_KEY, JSON.stringify(value));
  }
  function isPlmApiMonitorTarget(value) {
    try {
      const url = new URL(String(value || ''), location.href);
      return url.origin === location.origin && !/\/assets\//i.test(url.pathname) && !/\.(css|js|png|jpg|svg|woff2?)$/i.test(url.pathname);
    } catch (_) { return false; }
  }
  function sanitizePlmApiMonitorValue(value, depth) {
    if (depth > 3 || value === null || value === undefined) return value;
    if (typeof value === 'string') return value.length > 6000 ? value.slice(0, 6000) + '…[截断]' : value;
    if (typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.slice(0, 40).map((item) => sanitizePlmApiMonitorValue(item, depth + 1));
    return Object.keys(value).slice(0, 80).reduce((output, key) => {
      output[key] = /token|password|passwd|secret|cookie|authorization|credential/i.test(key) ? '[已隐藏]' : sanitizePlmApiMonitorValue(value[key], depth + 1);
      return output;
    }, {});
  }
  function parsePlmApiMonitorBody(value) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value !== 'string') return sanitizePlmApiMonitorValue(value, 0);
    try { return sanitizePlmApiMonitorValue(JSON.parse(value), 0); } catch (_) { return sanitizePlmApiMonitorValue(value, 0); }
  }
  function recordPlmApiMonitorRequest(entry) {
    if (!plmApiMonitorState.enabled || !isPlmApiMonitorTarget(entry.url)) return;
    let url = String(entry.url || '');
    try {
      const parsed = new URL(url, location.href);
      parsed.searchParams.forEach((value, key) => { if (/token|secret|password|cookie|authorization/i.test(key)) parsed.searchParams.set(key, '[已隐藏]'); });
      url = parsed.href;
    } catch (_) { /* keep original */ }
    plmApiMonitorState.entries.unshift({ time: new Date().toISOString(), method: String(entry.method || 'GET').toUpperCase(), url, status: Number(entry.status || 0), requestBody: parsePlmApiMonitorBody(entry.requestBody), response: parsePlmApiMonitorBody(entry.response) });
    plmApiMonitorState.entries = plmApiMonitorState.entries.slice(0, PLM_API_MONITOR_MAX_ENTRIES);
    savePlmApiMonitorState();
  }
  function installPlmApiMonitor() {
    const root = typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window;
    if (!root || root.__PLM_API_MONITOR_INSTALLED__) return;
    root.__PLM_API_MONITOR_INSTALLED__ = true;
    if (typeof root.fetch === 'function') {
      const originalFetch = root.fetch;
      root.fetch = function (input, init) {
        const requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
        const method = (init && init.method) || (input && input.method) || 'GET';
        const requestBody = init && init.body;
        capturePlmAuthHeaders(init && init.headers, requestUrl);
        capturePlmAuthHeaders(input && input.headers, requestUrl);
        const result = originalFetch.apply(this, arguments);
        result.then((response) => {
          const contentType = response.headers && response.headers.get ? response.headers.get('content-type') || '' : '';
          if (/json|text\//i.test(contentType)) response.clone().text().then((body) => recordPlmApiMonitorRequest({ url: response.url || requestUrl, method, requestBody, status: response.status, response: body })).catch(() => {});
        }).catch(() => {});
        return result;
      };
    }
    const xhrProto = root.XMLHttpRequest && root.XMLHttpRequest.prototype;
    if (xhrProto && xhrProto.open && xhrProto.send) {
      const originalOpen = xhrProto.open;
      const originalSend = xhrProto.send;
      const originalSetRequestHeader = xhrProto.setRequestHeader;
      xhrProto.open = function (method, url) { this.__plmApiMonitor = { method, url }; return originalOpen.apply(this, arguments); };
      if (originalSetRequestHeader) {
        xhrProto.setRequestHeader = function (name, value) {
          const requestUrl = this.__plmApiMonitor && this.__plmApiMonitor.url;
          capturePlmAuthHeaders({ [name]: value }, requestUrl);
          return originalSetRequestHeader.apply(this, arguments);
        };
      }
      xhrProto.send = function (body) {
        const xhr = this;
        xhr.addEventListener('load', () => {
          const contentType = xhr.getResponseHeader ? xhr.getResponseHeader('content-type') || '' : '';
          if (/json|text\//i.test(contentType)) recordPlmApiMonitorRequest({ ...(xhr.__plmApiMonitor || {}), requestBody: body, status: xhr.status, response: xhr.responseType === 'json' ? xhr.response : xhr.responseText });
        }, { once: true });
        return originalSend.apply(this, arguments);
      };
    }
    root.PLMApiMonitor = { status: () => ({ enabled: Boolean(plmApiMonitorState.enabled), count: plmApiMonitorState.entries.length }), entries: () => plmApiMonitorState.entries.slice(), clear: () => { plmApiMonitorState.entries = []; savePlmApiMonitorState(); }, export: () => downloadBlob(new Blob([JSON.stringify(plmApiMonitorState.entries, null, 2)], { type: 'application/json' }), 'plm-data-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json') };
  }
