  const PRODUCT_DEVELOPMENT_VERSION = '1.32.0';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION = 'copywriting-templates-v1';
  const PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID = 'capsule';
  const PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CATALOG = Object.freeze([
    Object.freeze({ id: 'capsule', label: '胶囊', fileName: '胶囊产品文案模板.docx', path: 'v1/product-development-copywriting-templates/capsule.docx', bytes: 120452, sha256: '870267f33a71a6b0098ed2efa4c8dd909efce922e305e73cad98ed2e6c0df48a' }),
    Object.freeze({ id: 'softgel', label: '软胶囊', fileName: '软胶囊产品文案模板.docx', path: 'v1/product-development-copywriting-templates/softgel.docx', bytes: 117740, sha256: 'fd91be52b233e6286699d4e7f82f68372b45179a5ccf2a6b5dc6ac972ab2dd02' }),
    Object.freeze({ id: 'tablet', label: '片剂', fileName: '片剂产品文案模板.docx', path: 'v1/product-development-copywriting-templates/tablet.docx', bytes: 135181, sha256: '86316b25b452f9b2ceb927ccb17ce7843ecdaccbde125c0685b9d01a7269c886' }),
    Object.freeze({ id: 'chewable', label: '咀嚼片', fileName: '咀嚼片产品文案模板.docx', path: 'v1/product-development-copywriting-templates/chewable.docx', bytes: 112529, sha256: 'acf43bb8d822c0d02e849ac8a60f3347f003541dfb714bfa0c4000aa5a60b123' }),
    Object.freeze({ id: 'drops', label: '滴剂', fileName: '滴剂产品文案模版.docx', path: 'v1/product-development-copywriting-templates/drops.docx', bytes: 131393, sha256: '36775495607a79e91d50c82f84e600d8c7c38af394dddc842f375387de5e437a' }),
    Object.freeze({ id: 'pet-drops', label: '宠物滴剂', fileName: '宠物滴剂产品文案模版.docx', path: 'v1/product-development-copywriting-templates/pet-drops.docx', bytes: 224228, sha256: '58b2a3edc4c5934623fa58c4b340e41e6ebf77ef91aa67703fe4d9d41c59e7cb' }),
    Object.freeze({ id: 'powder', label: '粉剂', fileName: '粉剂产品文案模版.docx', path: 'v1/product-development-copywriting-templates/powder.docx', bytes: 143606, sha256: '472712afedb6ff95f42b2c9e2faebedd13f2dfcf7f070a85dbdf1de11fcdd341' }),
    Object.freeze({ id: 'sachet-powder', label: '粉剂袋装', fileName: '粉剂袋装产品文案模版.docx', path: 'v1/product-development-copywriting-templates/sachet-powder.docx', bytes: 140416, sha256: '0b3c74d116d11313f68f61e788c7a93aca1244968c2a77cd69e90c3e839dc23e' }),
    Object.freeze({ id: 'gummy', label: '软糖', fileName: '软糖产品文案模版.docx', path: 'v1/product-development-copywriting-templates/gummy.docx', bytes: 112833, sha256: 'd991768c83126eb8c4ebcdf8ab8053140b94a07afad976dc3dd696fb501efc43' }),
    Object.freeze({ id: 'tea', label: '茶包', fileName: '茶产品文案模版.docx', path: 'v1/product-development-copywriting-templates/tea.docx', bytes: 166673, sha256: '0b7aeaa3d9e8889983d082d6bac74501792864874655eaf60722117b33c2081e' }),
    Object.freeze({ id: 'lozenge', label: '口腔含片', fileName: '口腔含片产品文案模版.docx', path: 'v1/product-development-copywriting-templates/lozenge.docx', bytes: 82132, sha256: 'fb935a2614d5104ed3ec77946be02ed467802dbfb555278111b2085e301a8aa2' }),
  ]);
  const PRODUCT_DEVELOPMENT_HISTORY_KEY = 'plm-floating-helper:product-development-history:v1';
  const PRODUCT_DEVELOPMENT_REVIEW_DRAFT_KEY = 'plm-floating-helper:product-development-review-drafts:v1';
  const PRODUCT_DEVELOPMENT_REVIEW_DRAFT_LIMIT = 8;
  // The current product-development UI no longer exposes the old translation
  // workspace, but the shared shell still imports and exports this legacy
  // backup field. Keep the storage contract so startup and old backups remain
  // compatible when the module is rebuilt.
  const PRODUCT_DEVELOPMENT_TRANSLATE_WORKSPACE_KEY = 'plm-floating-helper:product-development-translate-workspaces:v1';
  const PRODUCT_DEVELOPMENT_TRANSLATE_ACTIVE_KEY = 'plm-floating-helper:product-development-translate-active:v1';
  const PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY = 'plm-floating-helper:product-development-translate-backup-dirty:v1';
  const PRODUCT_DEVELOPMENT_TRANSLATE_WORKSPACE_LIMIT = 2000;
  const PRODUCT_DEVELOPMENT_COPYWRITING_CACHE_KEY = 'plm-floating-helper:product-development-copywriting-cache:v1';
  const PRODUCT_DEVELOPMENT_COPYWRITING_CACHE_LIMIT = 20;
  const PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_KEY = 'plm-floating-helper:product-development-copywriting-template-cache:v1';
  const PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_LIMIT = 4;
  const PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_MAX_BYTES = 800000;
  const PRODUCT_DEVELOPMENT_TASK_META_KEY = 'plm-floating-helper:product-development-task-meta:v1';
  const PRODUCT_DEVELOPMENT_TASK_SIDEBAR_KEY = 'plm-floating-helper:product-development-task-sidebar:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_KEY = 'plm-floating-helper:product-development-template:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY = 'plm-floating-helper:product-development-template-version:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_SELECTION_KEY = 'plm-floating-helper:product-development-template-selection:v1';
  const PRODUCT_DEVELOPMENT_INGREDIENT_DRAFT_KEY = 'plm-floating-helper:product-development-ingredient-drafts:v1';
  // Retain the legacy key for compatibility; ingredient templates are loaded
  // from the cloud and cached locally, and no longer accept local imports.
  const PRODUCT_DEVELOPMENT_INGREDIENT_LOCAL_TEMPLATE_KEY = 'plm-floating-helper:product-development-ingredient-local-templates:v1';
  const PRODUCT_DEVELOPMENT_INGREDIENT_MAX_CELLS = 600;
  const PRODUCT_DEVELOPMENT_ONE_SHOT_RULE_VERSION = 'ingredient-template-v5';
  const PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY = 'plm-floating-helper:product-development-one-shot-draft:v1';
  const PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT = Object.freeze({
    sku: '',
    brand: '',
    nameCn: '',
    nameEn: '',
    productType: 'Human dietary supplement / liquid drops',
    netContent: '60 mL',
    servingSize: '1 mL',
    servingsPerContainer: '60',
    targetActiveMg: '',
    targetActiveMgExplicit: 'false',
    targetActivePercent: '0',
    targetActivePercentExplicit: 'false',
    requestedFunctions: '',
    otherIngredientsEn: '',
    otherIngredientsCn: '',
    referenceUrl: '',
  });
  const PRODUCT_DEVELOPMENT_MAX_HISTORY = 8;
  const productDevelopmentReviewDraftWriteTimers = Object.create(null);
  const productDevelopmentTaskMetaWriteTimers = Object.create(null);
  const productDevelopmentReworkLookupTimers = Object.create(null);
  const productDevelopmentReworkLookupRequestTokens = Object.create(null);
  const productDevelopmentCategoryOptionsCache = Object.create(null);
  const productDevelopmentCategoryOptionRecordKeys = new Set();
  const productDevelopmentCopywritingTemplateBufferCache = Object.create(null);
  const PRODUCT_DEVELOPMENT_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const PRODUCT_DEVELOPMENT_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const PRODUCT_DEVELOPMENT_BANNED_TERMS = Object.freeze([
    'natural', 'nature', 'naturally', '天然', '自然',
    'organic', '有机', 'vegan', '素食主义者',
    'crueltyfree', 'cruelty free', '无残忍',
    'biodegradable', '可生物降解', 'environmentally friendly',
    'tested', 'test', 'lab-tested', 'lab tested', 'laboratory', 'laboratories',
    'third-party', 'third party', 'verified', 'certified', 'certification',
    'scientifically', 'scientific', 'proven', 'scientifically proven', 'scientific evidence',
    '检测', '测试', '经检测', '第三方', '独立第三方', '实验室', '验证', '认证', '证明',
    'efficient', 'efficiently', 'efficiency', 'high-efficiency', '高效', '高效率', '高效吸收',
    'reduce', 'remove', 'repair', 'treatment', 'therapy', 'instantly',
    'prevent', 'prevention', 'cure', 'cure-all', 'heal', 'diagnose', 'diagnosis',
    'clinical', 'clinically', 'clinically proven', 'fda approved', 'doctor recommended',
    'veterinarian recommended', 'fast-acting', 'quick relief', 'instant relief',
    'guaranteed', 'guarantee', '100%', 'zero risk', 'risk-free', 'no side effects',
    'miracle', 'miraculous', 'best', 'better', 'ultimate', 'perfect', 'maximum',
    'number one', 'no. 1', 'top-rated', 'leading', 'long-lasting',
    'medical grade', 'medical-grade', '医疗级', '治疗', '疗效', '治愈',
    '全效', '特效', '速效', '第一', '最佳', '顶级', '极致', '最强', '唯一',
    '保证', '有效保证', '百分百', '零风险', '无副作用', '立刻见效', '立即见效',
    '快速见效', '永久', '彻底', '万能', '全能', '无敌', '专家推荐', '权威推荐',
    '实验认证', '认证', '疾病', '药品', '处方', '诊断', '抗炎', '止痛', '抗癌',
    '减肥', '降脂', '降糖', '增强免疫', '改善疾病',
  ]);
  const PRODUCT_DEVELOPMENT_REVIEW_RULE_VERSION = 'approved-samples-v6';
  const PRODUCT_DEVELOPMENT_REVIEW_ACTIONS = Object.freeze({
    remove: 'remove',
    replaceLogo: 'replace-logo',
    replacePhrase: 'replace-phrase',
    standardizeCount: 'standardize-count',
    standardizeNetContent: 'standardize-net-content',
  });
  const PRODUCT_DEVELOPMENT_REVIEW_FIXED_PHRASES = Object.freeze([
    Object.freeze({ pattern: /\bMAGNESIUM\s+COMPLEX\b/i, replacementEn: 'Magnesium Blend', replacementZh: '镁混合物' }),
    Object.freeze({ pattern: /\bMAXIMUM\s+BENEFITS\b/i, replacementEn: 'Balanced Benefits', replacementZh: '均衡功效' }),
    Object.freeze({ pattern: /\bNATURAL\s+SUPPORT\b/i, replacementEn: 'Nutrition Support', replacementZh: '营养支持' }),
  ]);
  const PRODUCT_DEVELOPMENT_REVIEW_COUNT_UNITS = Object.freeze([
    Object.freeze({ pattern: /\bCAPSULES?\b/i, en: 'CAPSULES', zh: '粒胶囊' }),
    Object.freeze({ pattern: /\bSOFTGELS?\b/i, en: 'SOFTGELS', zh: '粒软胶囊' }),
    Object.freeze({ pattern: /\bGUMM(?:Y|IES)\b/i, en: 'GUMMIES', zh: '粒软糖' }),
  ]);
  const PRODUCT_DEVELOPMENT_FEATURES = Object.freeze([
    Object.freeze({ id: 'tasks', title: '我的开发任务', subtitle: '先做侵权图和文案，再查看产品详情预填表单', action: 'product-development-tasks-open', icon: 'folder', requiresSku: false }),
    Object.freeze({ id: 'review', title: '产品图风险筛查', subtitle: '提取全部图片文字，生成中英文修改对照图', action: 'product-development-review-open', icon: 'image' }),
    Object.freeze({ id: 'copywriting', title: 'A-D 文案 DOCX', subtitle: '按当前 SKU 成分和卖点生成双语文案文件', action: 'product-development-copywriting-open', icon: 'batchExcel' }),
    Object.freeze({ id: 'ingredientFacts', title: '制作成分表', subtitle: '按需加载云端人类或宠物模板摘要，编辑后导出 PDF', action: 'product-development-ingredient-open', icon: 'batchExcel', requiresSku: false }),
    Object.freeze({ id: 'pricing', title: '定价标准', subtitle: '全包价格计算国内三档价格', action: 'product-development-pricing-open', icon: 'calculator', requiresSku: false }),
    Object.freeze({ id: 'stocking', title: '备货标准', subtitle: '出单数量、手工贴标和返工 100 件规则', action: '', icon: 'box' }),
    Object.freeze({ id: 'packaging', title: '包装与标签', subtitle: '规格、尺寸和标签资料', action: '', icon: 'box' }),
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

  // Confirmed by the category-template HAR: each organization field has one
  // default option and does not need an editable value in this local form.
  const PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS = Object.freeze({
    create_organization: Object.freeze({ attrId: 163, key: 'create_organization', label: '创建组织', value: [1], displayValue: '西月集团' }),
    use_organization: Object.freeze({ attrId: 164, key: 'use_organization', label: '使用组织', value: [1], displayValue: '西月集团' }),
    procurement_organization: Object.freeze({ attrId: 165, key: 'procurement_organization', label: '采购组织', value: [1], displayValue: '西月总部' }),
  });

  const PRODUCT_DEVELOPMENT_PRICE_FIELD_FALLBACKS = Object.freeze([
    Object.freeze({ attrId: 153, key: 'cost_rice', label: '成本价' }),
    Object.freeze({ attrId: 154, key: 'first_price', label: '国内一档价格' }),
    Object.freeze({ attrId: 155, key: 'second_price', label: '国内二档价格' }),
    Object.freeze({ attrId: 156, key: 'third_price', label: '国内三档价格' }),
  ]);
  const PRODUCT_DEVELOPMENT_PURCHASE_PRICE_FIELD = Object.freeze({ attrId: 152, key: 'procurement_rice', label: '采购价（含税运）' });
  const PRODUCT_DEVELOPMENT_REWORK_DEFAULT_PROCUREMENT = Object.freeze({
    supplier: 'JSJ',
    processType: '直采',
    processFee: '0',
    taxRate: '0.00%',
    quantity: '100',
  });
  const PRODUCT_DEVELOPMENT_PRICING_DRAFT_KEY = 'plm-floating-helper:product-development-pricing:v1';

  // This is the intentionally small contract between the local assistant form
  // and the two-step PLM create-product drawer. Keep this list limited to the
  // fields confirmed during the current manual product creation flow; PLM
  // defaults and untouched fields should remain managed by PLM itself.
  const PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS = Object.freeze([
    Object.freeze({ key: 'categoryPath', label: '类目', domId: 'form_item_category_id', control: 'cascader', placeholder: '如：成品 / 食品酒水 / 酒水饮品' }),
    Object.freeze({ key: 'productNameCn', label: '中文商品名称', domId: 'product_name0', placeholder: '填写页面 1 中文商品名称' }),
    Object.freeze({ key: 'productNameEn', label: '英文商品名称', domId: 'product_name1', placeholder: '填写页面 1 英文商品名称' }),
    Object.freeze({ key: 'brand', label: '品牌', domId: 'brand_id', control: 'search-select', placeholder: '输入品牌名称并从 PLM 搜索结果中选择' }),
    Object.freeze({ key: 'productGroupPath', label: '产品分组', domId: 'product_group_id', control: 'cascader', placeholder: '按层级用 / 分隔' }),
  ]);

  const PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS = Object.freeze([
    Object.freeze({ key: 'specification', attrId: 119, label: '规格型号', domId: 'form_item_0_attr_group_0_0_attr_language_config_json_0_value' }),
    Object.freeze({ key: 'roughWeight', attrId: 122, label: '毛重', domId: 'form_item_0_attr_group_0_2_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'outerLength', attrId: 133, label: '长（外包装）', domId: 'form_item_0_attr_group_36_0_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'outerWidth', attrId: 134, label: '宽（外包装）', domId: 'form_item_0_attr_group_36_1_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'outerHeight', attrId: 135, label: '高（外包装）', domId: 'form_item_0_attr_group_36_2_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'outerVolume', attrId: 136, label: '体积（外包装）', domId: 'form_item_0_attr_group_36_3_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'productProductionLine', attrId: 131, label: '产品产线', domId: 'form_item_3_attr_group_35_0_attr_language_config_json_0_value', control: 'select' }),
    Object.freeze({ key: 'minimumOrderQuantity', attrId: 2764, label: '最小起订量', domId: 'form_item_3_attr_group_35_1_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'procurementPrice', attrId: 152, label: '采购价', domId: 'form_item_procurement_price', type: 'number' }),
    Object.freeze({ key: 'costPrice', attrId: 153, label: '成本价', domId: 'form_item_6_attr_group_0_1_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'firstPrice', attrId: 154, label: '国内一档价格', domId: 'form_item_6_attr_group_35_0_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'secondPrice', attrId: 155, label: '国内二档价格', domId: 'form_item_6_attr_group_35_1_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'thirdPrice', attrId: 156, label: '国内三档价格', domId: 'form_item_6_attr_group_35_2_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'standardPackingQuantity', attrId: 123, label: '标准装箱数', domId: 'form_item_7_attr_group_0_0_attr_language_config_json_0_value', type: 'number' }),
  ]);

  const PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS = Object.freeze([
    Object.freeze({ key: 'supplier', label: '供应商子公司名称', domId: 'form_item_0_company_supplier_id', control: 'select', placeholder: '如：JSJ' }),
    Object.freeze({ key: 'processType', label: '加工方式', domId: 'form_item_0_process_type', control: 'select', placeholder: '如：直采' }),
    Object.freeze({ key: 'processFee', label: '加工费', domId: 'form_item_0_process_fee', type: 'number' }),
    Object.freeze({ key: 'taxRate', label: '税率', domId: 'form_item_0_tax_rate_id', control: 'select', placeholder: '如：0.00%' }),
    Object.freeze({ key: 'quantity', label: '采购数量', domId: 'form_item_0_quantity', type: 'number' }),
    Object.freeze({ key: 'materialPrice', label: '单价', domId: 'form_item_0_material_price', type: 'number' }),
  ]);

  function normalizeProductDevelopmentWorkMode(value) {
    return String(value || '').trim() === 'product-development' ? 'product-development' : 'daily';
  }

  function productDevelopmentObjectCategoryHints(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.entries(source).filter(([key, item]) => {
      const name = String(key || '').toLowerCase();
      return /category|class|series|product[_-]?type|品类|类目/i.test(name)
        && !/(?:id|value)$/i.test(name)
        && (typeof item === 'string' || typeof item === 'number');
    }).map(([, item]) => item);
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

  function productDevelopmentTranslateWorkspaceValue(value) {
    const source = value && typeof value === 'object' ? value : {};
    const sku = String(source.sku || source.code || '').trim().toUpperCase();
    if (!sku) return null;
    return {
      version: 1,
      sku,
      brand: productDevelopmentCleanText(source.brand, 180),
      name: productDevelopmentCleanText(source.name || source.productName, 240),
      imageUrl: productDevelopmentCleanText(source.imageUrl || source.benchmarkImageUrl, 2400),
      imageDataUrl: typeof source.imageDataUrl === 'string' && /^data:image\//i.test(source.imageDataUrl) ? source.imageDataUrl : '',
      imageName: productDevelopmentCleanText(source.imageName || source.benchmarkImageName, 180),
      sourceLanguage: productDevelopmentCleanText(source.sourceLanguage || source.sl || 'en', 40),
      targetLanguage: productDevelopmentCleanText(source.targetLanguage || source.tl || 'zh-CN', 40),
      sourceText: productDevelopmentCleanText(source.sourceText || source.googleSourceText, 12000),
      translatedText: productDevelopmentCleanText(source.translatedText || source.googleTranslatedText, 12000),
      annotations: Array.isArray(source.annotations) ? source.annotations.slice(0, 180) : [],
      translateUrl: productDevelopmentCleanText(source.translateUrl, 2400),
      createdAt: productDevelopmentCleanText(source.createdAt || new Date().toLocaleString(), 80),
      updatedAt: Number(source.updatedAt) || Date.now(),
    };
  }

  function productDevelopmentTranslateWorkspaceEntries(value) {
    const stored = value && typeof value === 'object' ? value : {};
    const source = stored.workspaces && typeof stored.workspaces === 'object'
      ? stored.workspaces
      : (stored.entries && typeof stored.entries === 'object' ? stored.entries : stored);
    const entries = Object.create(null);
    const list = Array.isArray(source) ? source : Object.values(source || {});
    list.forEach((item) => {
      const workspace = productDevelopmentTranslateWorkspaceValue(item);
      if (workspace) entries[workspace.sku] = workspace;
    });
    return entries;
  }

  function loadProductDevelopmentTranslateWorkspaces() {
    return productDevelopmentTranslateWorkspaceEntries(readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_WORKSPACE_KEY, {}));
  }

  function scheduleProductDevelopmentTranslateCloudBackup() {
    if (typeof isGoogleTranslatePage === 'function' && isGoogleTranslatePage()) return;
    const dirty = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
    if (!dirty || !dirty.sku) return;
    const appState = typeof state !== 'undefined' ? state : null;
    window.clearTimeout(appState && appState.productDevelopmentTranslateCloudBackupTimer);
    if (appState) appState.productDevelopmentTranslateCloudBackupTimer = window.setTimeout(() => {
      if (typeof getCloudBackupKey === 'function' && getCloudBackupKey() && typeof queueCloudBackup === 'function') queueCloudBackup();
    }, 1800);
  }

  function buildProductDevelopmentTranslateWorkspacesBackup(value, options) {
    const entries = productDevelopmentTranslateWorkspaceEntries(value || loadProductDevelopmentTranslateWorkspaces());
    const includeLocalImages = Boolean(options && options.includeLocalImages);
    const output = {};
    Object.keys(entries)
      .sort((a, b) => Number(entries[b] && entries[b].updatedAt) - Number(entries[a] && entries[a].updatedAt))
      .slice(0, PRODUCT_DEVELOPMENT_TRANSLATE_WORKSPACE_LIMIT)
      .forEach((sku) => {
        const item = { ...entries[sku] };
        if (!includeLocalImages) item.imageDataUrl = '';
        output[sku] = item;
      });
    return output;
  }

  function productDevelopmentOneShotInputValue(value) {
    const source = value && typeof value === 'object' ? value : {};
    const result = {};
    Object.keys(PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT).forEach((key) => {
      const fallback = PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT[key];
      const raw = source[key] === undefined || source[key] === null ? fallback : source[key];
      result[key] = String(raw === undefined || raw === null ? '' : raw).trim().slice(0, key === 'requestedFunctions' ? 1800 : key === 'otherIngredientsEn' ? 1600 : key === 'otherIngredientsCn' ? 1200 : key === 'referenceUrl' ? 1200 : 240);
    });
    if (result.otherIngredientsEn === 'Purified Water, Vegetable Glycerin, Citric Acid, Potassium Sorbate' || result.otherIngredientsEn === 'Chicken Flavor, Beef Flavor, Lecithin, Citric Acid') result.otherIngredientsEn = '';
    if (result.otherIngredientsCn === '纯化水、植物甘油、柠檬酸、山梨酸钾' || result.otherIngredientsCn === '鸡肉风味剂、牛肉风味剂、卵磷脂、柠檬酸') result.otherIngredientsCn = '';
    result.servingsPerContainer = String(Math.max(1, Math.min(365, Math.round(Number(result.servingsPerContainer) || 60))));
    const targetActiveMgExplicit = String(source.targetActiveMgExplicit || '').toLowerCase() === 'true';
    const targetActiveMgText = String(result.targetActiveMg || '').trim();
    const targetActiveMgNumber = Number(targetActiveMgText);
    result.targetActiveMgExplicit = targetActiveMgExplicit ? 'true' : 'false';
    result.targetActiveMg = targetActiveMgText && (targetActiveMgExplicit || targetActiveMgText !== '700') && Number.isFinite(targetActiveMgNumber) && targetActiveMgNumber > 0
      ? String(Math.max(1, Math.min(5000, targetActiveMgNumber)))
      : '';
    const targetPercentText = String(result.targetActivePercent === undefined || result.targetActivePercent === null ? '' : result.targetActivePercent).trim();
    const targetPercentExplicit = String(source.targetActivePercentExplicit || '').toLowerCase() === 'true';
    const migratedTargetPercentText = !targetPercentExplicit && targetPercentText === '30' ? '' : targetPercentText;
    const targetPercent = migratedTargetPercentText === '' ? 0 : Number(migratedTargetPercentText);
    result.targetActivePercentExplicit = targetPercentExplicit ? 'true' : 'false';
    result.targetActivePercent = String(Math.max(0, Math.min(100, Number.isFinite(targetPercent) ? targetPercent : 0)));
    return result;
  }

  function productDevelopmentOneShotLoadDraft() {
    return productDevelopmentOneShotInputValue(readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY, {}));
  }

  function saveProductDevelopmentOneShotDraft(value) {
    const draft = productDevelopmentOneShotInputValue(value);
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY, draft);
    return draft;
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

  function productDevelopmentCopywritingSnapshotValue(value) {
    const source = value && typeof value === 'object' ? value : {};
    const nested = source.snapshot && typeof source.snapshot === 'object' ? source.snapshot : {};
    const read = (key, fallback) => nested[key] !== undefined && nested[key] !== null ? nested[key] : source[key] !== undefined && source[key] !== null ? source[key] : fallback;
    const labelingSource = read('labeling', {});
    const ingredientTableSource = read('ingredientTable', {});
    const labeling = labelingSource && typeof labelingSource === 'object' ? {
      directionsEn: productDevelopmentCleanText(labelingSource.directionsEn, 600),
      directionsCn: productDevelopmentCleanText(labelingSource.directionsCn, 600),
      disclaimerEn: productDevelopmentCleanText(labelingSource.disclaimerEn, 1000),
      disclaimerCn: productDevelopmentCleanText(labelingSource.disclaimerCn, 1000),
      warningsEn: productDevelopmentCleanText(labelingSource.warningsEn, 1200),
      warningsCn: productDevelopmentCleanText(labelingSource.warningsCn, 1200),
    } : {};
    const ingredientTable = ingredientTableSource && typeof ingredientTableSource === 'object' ? {
      otherIngredientsEn: productDevelopmentCleanText(ingredientTableSource.otherIngredientsEn, 1600),
      otherIngredientsCn: productDevelopmentCleanText(ingredientTableSource.otherIngredientsCn, 1200),
    } : {};
    return {
      sku: productDevelopmentCleanText(read('sku', ''), 80).toUpperCase(),
      name: productDevelopmentCleanText(read('name', ''), 300),
      englishName: productDevelopmentCleanText(read('englishName', ''), 300),
      brand: productDevelopmentCleanText(read('brand', ''), 160),
      productType: productDevelopmentCleanText(read('productType', ''), 180),
      productTypeCn: productDevelopmentCleanText(read('productTypeCn', ''), 180),
      netContent: productDevelopmentCleanText(read('netContent', ''), 120).toUpperCase(),
      referenceUrl: productDevelopmentCleanText(read('referenceUrl', ''), 1000),
      sourcePlainTextCopy: productDevelopmentCleanText(read('sourcePlainTextCopy', ''), 12000),
      labeling,
      ingredientTable,
    };
  }

  function productDevelopmentCopywritingCacheValue(value) {
    const source = value && typeof value === 'object' ? value : {};
    const sku = String(source.sku || source.snapshot && source.snapshot.sku || '').trim().toUpperCase();
    const id = productDevelopmentCleanText(source.id, 80);
    const content = productDevelopmentNormalizeCopywriting(source.content);
    if (!sku || !id || !content.efficacy.length || !content.advantages.length || !content.sellingPoints.length || !content.ingredientFunctions.length) return null;
    const snapshot = productDevelopmentCopywritingSnapshotValue({ ...source, sku });
    return {
      id,
      sku,
      content,
      snapshot,
      fileName: productDevelopmentCleanText(source.fileName || productDevelopmentCopywritingFileName(snapshot), 180),
      provider: productDevelopmentCleanText(source.provider, 80),
      model: productDevelopmentCleanText(source.model, 120),
      templateVersion: productDevelopmentCleanText(source.templateVersion, 80),
      templateId: productDevelopmentCleanText(source.templateId, 80),
      templateLabel: productDevelopmentCleanText(source.templateLabel, 120),
      createdAt: productDevelopmentCleanText(source.createdAt || new Date().toLocaleString(), 80),
      updatedAt: Number(source.updatedAt) || Date.now(),
      blob: null,
      fromCache: true,
    };
  }

  function loadProductDevelopmentCopywritingCache() {
    const stored = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_COPYWRITING_CACHE_KEY, null);
    const source = stored && Array.isArray(stored.entries) ? stored.entries : (Array.isArray(stored) ? stored : []);
    return source.map(productDevelopmentCopywritingCacheValue).filter(Boolean).slice(0, PRODUCT_DEVELOPMENT_COPYWRITING_CACHE_LIMIT);
  }

  function getProductDevelopmentCopywritingCache(sku, id) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const normalizedId = String(id || '').trim();
    return loadProductDevelopmentCopywritingCache().find((item) => normalizedId ? item.id === normalizedId : item.sku === normalizedSku) || null;
  }

  function saveProductDevelopmentCopywritingCache(result) {
    const cached = productDevelopmentCopywritingCacheValue({ ...result, updatedAt: Date.now() });
    if (!cached) return null;
    const entries = [cached].concat(loadProductDevelopmentCopywritingCache().filter((item) => item.id !== cached.id))
      .slice(0, PRODUCT_DEVELOPMENT_COPYWRITING_CACHE_LIMIT);
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_COPYWRITING_CACHE_KEY, { version: 1, entries });
    return cached;
  }

  function restoreProductDevelopmentCopywritingCache(sku, id) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const current = state.productDevelopmentCopywriting;
    if (!id && current && current.sku === normalizedSku && current.content) return current;
    const cached = getProductDevelopmentCopywritingCache(normalizedSku, id);
    if (!cached) return null;
    state.productDevelopmentCopywriting = cached;
    return cached;
  }

  function productDevelopmentReviewDraftItem(value) {
    const source = value && typeof value === 'object' ? value : {};
    const sourceText = productDevelopmentCompactSemanticText(source.sourceText || source.originalText || source.text, 240);
    const textRole = productDevelopmentCleanText(source.textRole || source.role, 40).toLowerCase();
    const replacementEn = productDevelopmentCompactSemanticText(source.replacementEn || source.modifiedEnglish || source.english, 300);
    return {
      id: productDevelopmentCleanText(source.id || '', 60),
      sourceText,
      bbox: source.bbox && typeof source.bbox === 'object' ? {
        x: Number(source.bbox.x) || 0,
        y: Number(source.bbox.y) || 0,
        w: Number(source.bbox.w !== undefined ? source.bbox.w : source.bbox.width) || 0,
        h: Number(source.bbox.h !== undefined ? source.bbox.h : source.bbox.height) || 0,
      } : null,
      onPackaging: source.onPackaging !== false && !/^(?:false|no|0)$/i.test(String(source.onPackaging || '').trim()),
      textRole,
      riskTypes: Array.isArray(source.riskTypes) ? source.riskTypes.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4) : [],
      riskTerms: Array.isArray(source.riskTerms) ? source.riskTerms.map((item) => productDevelopmentCleanText(item, 100)).filter(Boolean).slice(0, 8) : [],
      riskReason: productDevelopmentCompactSemanticText(source.riskReason || source.reason || source.warning, 400),
      replacementEn: (productDevelopmentIsNetContentText(textRole, sourceText) ? replacementEn.toUpperCase() : replacementEn).replace(/\bDIETARY\s+SUPPLEMENT\b/gi, 'DIETARY SUPPLEMENT'),
      replacementZh: productDevelopmentCompactSemanticText(source.replacementZh || source.modifiedChinese || source.chinese || source.translation || source.translationZh, 300),
      translationZh: productDevelopmentCompactSemanticText(source.translationZh || source.translation || source.chinese, 300),
      revisionAction: productDevelopmentNormalizeReviewAction(source.revisionAction || source.action || source.editAction),
      replacementOptions: Array.isArray(source.replacementOptions) ? source.replacementOptions.map((item) => ({
        en: productDevelopmentCompactSemanticText(item && (item.en || item.english || item.replacementEn), 300),
        zh: productDevelopmentCompactSemanticText(item && (item.zh || item.chinese || item.translation), 300),
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
      brand: productDevelopmentCleanText(source.brand, 160),
      productType: productDevelopmentCleanText(source.productType || source.category, 180),
      netContent: productDevelopmentCleanText(source.netContent, 120).toUpperCase(),
      humanSupplement: source.humanSupplement === true,
      sourceImageDataUrl: dataUrl(source.sourceImageDataUrl, 2600000),
      sourceImageName: productDevelopmentCleanText(source.sourceImageName || source.benchmarkImageName, 180),
      comparisonDataUrl: dataUrl(source.comparisonDataUrl, 2600000),
      items: (Array.isArray(source.items) ? source.items : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
      extractedTexts: (Array.isArray(source.extractedTexts) ? source.extractedTexts : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
      packagingBboxes: productDevelopmentReviewPackagingBboxes(source).slice(0, 8),
      warnings: Array.isArray(source.warnings) ? source.warnings.map((item) => productDevelopmentCleanText(item, 240)).filter(Boolean).slice(0, 12) : [],
      provider: productDevelopmentCleanText(source.provider, 80),
      model: productDevelopmentCleanText(source.model, 120),
      plainTextCopy: productDevelopmentCleanText(source.plainTextCopy || source.approvedPlainText || source.finalCopy, 12000),
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

  function productDevelopmentBrandAndCategory(value) {
    const text = productDevelopmentCleanText(value, 180);
    const match = text.match(/^AMZ(?:\s+|[\/／>＞|]+)(.+)$/i);
    const suffix = match ? productDevelopmentCleanText(match[1], 160) : '';
    if (match && /健康保健食品/.test(suffix)) return { brand: 'AMZ', category: suffix };
    return { brand: text, category: '' };
  }

  function productDevelopmentNormalizeBrandValue(value) {
    return productDevelopmentBrandAndCategory(value).brand;
  }

  function productDevelopmentNormalizeCategoryPathValue(value) {
    const split = productDevelopmentBrandAndCategory(value);
    const text = split.category || productDevelopmentCleanText(value, 180);
    // The task list calls this branch “食物酒水”, while the create-product
    // cascader uses “食品酒水” and requires a third-level leaf. These tasks are
    // the health-supplement flow, so use the PLM leaf confirmed in the drawer.
    if (text === '食物酒水' || text === '食品酒水') return '食品酒水 / 滋补保健';
    return text;
  }

  function normalizeProductDevelopmentTaskMeta(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      brand: productDevelopmentNormalizeBrandValue(source.brand),
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
      brand: productDevelopmentNormalizeBrandValue(task && task.brand || detail && detail.brand || baseValue(['brand']) || ''),
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
    const meta = { ...productDevelopmentTaskMetaFallback(task, detail), ...stored, ...memory };
    const entryEnglishProductName = productDevelopmentEntryEnglishProductName(detail, task, meta);
    return entryEnglishProductName ? { ...meta, productNameEn: entryEnglishProductName } : meta;
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

  function productDevelopmentScheduleReworkProductLookup(sku, code) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return;
    if (productDevelopmentReworkLookupTimers[normalizedSku]) window.clearTimeout(productDevelopmentReworkLookupTimers[normalizedSku]);
    delete productDevelopmentReworkLookupTimers[normalizedSku];
    productDevelopmentReworkLookupRequestTokens[normalizedSku] = (productDevelopmentReworkLookupRequestTokens[normalizedSku] || 0) + 1;
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    if (!normalizedCode || normalizedCode.length < 2) return;
    productDevelopmentReworkLookupTimers[normalizedSku] = window.setTimeout(() => {
      delete productDevelopmentReworkLookupTimers[normalizedSku];
      productDevelopmentRunReworkProductLookup(normalizedSku, normalizedCode, { silent: true });
    }, 650);
  }

  function productDevelopmentRunReworkProductLookup(sku, codeOverride, options) {
    const opts = options || {};
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!normalizedSku || !detail) {
      if (!opts.silent) showToast('当前 SKU 详情还未读取完成');
      return Promise.resolve(null);
    }
    if (productDevelopmentReworkLookupTimers[normalizedSku]) {
      window.clearTimeout(productDevelopmentReworkLookupTimers[normalizedSku]);
      delete productDevelopmentReworkLookupTimers[normalizedSku];
    }
    const task = getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {};
    const meta = getProductDevelopmentTaskMeta(task, detail);
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(codeOverride !== undefined ? codeOverride : meta.reworkProductCode);
    if (!normalizedCode) {
      if (!opts.silent) showToast('请先填写返工产品编码');
      return Promise.resolve(null);
    }
    if (productDevelopmentNormalizeReworkProductCode(meta.reworkProductCode) !== normalizedCode) return Promise.resolve(null);
    const requestToken = (productDevelopmentReworkLookupRequestTokens[normalizedSku] || 0) + 1;
    productDevelopmentReworkLookupRequestTokens[normalizedSku] = requestToken;
    detail.productDevelopmentReworkLookup = {
      status: 'loading',
      code: normalizedCode,
      message: '正在读取返工产品资料…',
      updatedAt: Date.now(),
      data: null,
    };
    state.productDevelopmentStatus = '正在读取返工编码 ' + normalizedCode + '…';
    state.productDevelopmentError = '';
    renderShell();
    return productDevelopmentFetchReworkProductData(normalizedCode).then((lookup) => {
      if (productDevelopmentReworkLookupRequestTokens[normalizedSku] !== requestToken) return null;
      const enriched = productDevelopmentApplyReworkProductLookup(detail, lookup);
      const message = '返工编码 ' + normalizedCode + ' 已自动回填采购价、产线、价格和默认采购明细';
      detail.productDevelopmentReworkLookup = {
        status: 'ready',
        code: normalizedCode,
        message,
        updatedAt: Date.now(),
        data: productDevelopmentCloneValue(enriched),
      };
      detail.cacheSource = 'local-cache';
      scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      state.productDevelopmentStatus = message;
      state.productDevelopmentError = '';
      if (!opts.silent) showToast(message);
      renderShell();
      return enriched;
    }).catch((error) => {
      if (productDevelopmentReworkLookupRequestTokens[normalizedSku] !== requestToken) return null;
      const message = '返工资料查询失败：' + formatErrorMessage(error);
      detail.productDevelopmentReworkLookup = {
        status: 'error',
        code: normalizedCode,
        message,
        updatedAt: Date.now(),
        data: null,
      };
      detail.cacheSource = 'local-cache';
      scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      state.productDevelopmentStatus = '';
      state.productDevelopmentError = message;
      if (!opts.silent) showToast(message);
      renderShell();
      return null;
    });
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

  function productDevelopmentCopywritingBuiltinTemplates() {
    return PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CATALOG;
  }

  function loadProductDevelopmentCopywritingTemplateId() {
    const templates = productDevelopmentCopywritingBuiltinTemplates();
    const stored = String(readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TEMPLATE_SELECTION_KEY, '') || '').trim();
    if (stored === 'local' && loadProductDevelopmentTemplate()) return stored;
    if (templates.some((item) => item.id === stored)) return stored;
    if (loadProductDevelopmentTemplate()) return 'local';
    return templates.some((item) => item.id === PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID)
      ? PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID
      : String(templates[0] && templates[0].id || '');
  }

  function productDevelopmentCopywritingTemplateBuffer(value) {
    if (value instanceof ArrayBuffer) return value;
    if (value && value.buffer instanceof ArrayBuffer) return value.buffer.slice(value.byteOffset || 0, (value.byteOffset || 0) + value.byteLength);
    return null;
  }

  function loadProductDevelopmentCopywritingTemplateCache() {
    const stored = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_KEY, {});
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  }

  function loadProductDevelopmentCachedTemplateSource(template) {
    if (!template || !template.id || !template.sha256) return null;
    const entry = loadProductDevelopmentCopywritingTemplateCache()[template.id];
    if (!entry || entry.sha256 !== String(template.sha256).toLowerCase() || typeof entry.base64 !== 'string') return null;
    try {
      const buffer = base64ToArrayBuffer(entry.base64);
      if (!buffer || buffer.byteLength < 1000 || buffer.byteLength > PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_MAX_BYTES) return null;
      return buffer;
    } catch (error) {
      return null;
    }
  }

  function saveProductDevelopmentCachedTemplateSource(template, value) {
    const buffer = productDevelopmentCopywritingTemplateBuffer(value);
    if (!template || !template.id || !template.sha256 || !buffer || buffer.byteLength > PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_MAX_BYTES) return;
    try {
      const entries = loadProductDevelopmentCopywritingTemplateCache();
      entries[template.id] = {
        sha256: String(template.sha256).toLowerCase(),
        base64: arrayBufferToBase64(buffer),
        updatedAt: Date.now(),
      };
      const kept = Object.keys(entries)
        .sort((a, b) => Number(entries[b] && entries[b].updatedAt) - Number(entries[a] && entries[a].updatedAt))
        .slice(0, PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_LIMIT)
        .reduce((result, key) => {
          result[key] = entries[key];
          return result;
        }, {});
      writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_COPYWRITING_TEMPLATE_CACHE_KEY, kept);
    } catch (error) {
      // Template caching is optional; the current generation may still use the network result.
    }
  }

  function saveProductDevelopmentCopywritingTemplateId(templateId) {
    const value = String(templateId || '').trim().slice(0, 80);
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TEMPLATE_SELECTION_KEY, value);
    state.productDevelopmentCopywritingTemplateId = value;
  }

  function resolveProductDevelopmentCopywritingTemplate() {
    const templates = productDevelopmentCopywritingBuiltinTemplates();
    const selectedId = String(state.productDevelopmentCopywritingTemplateId || '').trim();
    if (selectedId === 'local' && state.productDevelopmentTemplateBase64) {
      return {
        id: 'local',
        label: '本地自定义模板',
        fileName: '',
        source: state.productDevelopmentTemplateBase64,
        version: state.productDevelopmentTemplateVersion || 'local-template',
        local: true,
      };
    }
    const selected = templates.find((item) => item.id === selectedId)
      || templates.find((item) => item.id === PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID)
      || templates[0];
    if (!selected) {
      return {
        id: 'legacy',
        label: '通用四列表格',
        fileName: '',
        base64: '',
        version: 'builtin-v1',
        local: false,
      };
    }
    return {
      ...selected,
      version: 'copywriting-' + selected.id + '-v1',
      local: false,
    };
  }

  function resolveProductDevelopmentCachedCopywritingTemplate(result) {
    const templateId = String(result && result.templateId || '').trim();
    if (templateId === 'local' && state.productDevelopmentTemplateBase64) {
      return {
        id: 'local',
        label: result.templateLabel || '本地自定义模板',
        source: state.productDevelopmentTemplateBase64,
        version: result.templateVersion || state.productDevelopmentTemplateVersion || 'local-template',
        local: true,
      };
    }
    const template = productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === templateId);
    return template ? { ...template, version: result.templateVersion || 'copywriting-' + template.id + '-v1', local: false } : resolveProductDevelopmentCopywritingTemplate();
  }

  async function loadProductDevelopmentCopywritingTemplateSource(template) {
    if (!template || !template.id) throw new Error('请先选择文案模板');
    if (template.local) return template.source;
    if (productDevelopmentCopywritingTemplateBufferCache[template.id]) return productDevelopmentCopywritingTemplateBufferCache[template.id];
    const cachedSource = loadProductDevelopmentCachedTemplateSource(template);
    if (cachedSource) {
      productDevelopmentCopywritingTemplateBufferCache[template.id] = cachedSource;
      productDevelopmentLog('info', '命中本地文案模板缓存', template.id + ' | ' + template.label);
      return cachedSource;
    }
    const buffer = await fetchCloudAsset(template, 'arraybuffer');
    saveProductDevelopmentCachedTemplateSource(template, buffer);
    productDevelopmentCopywritingTemplateBufferCache[template.id] = buffer;
    return buffer;
  }

  function productDevelopmentTemplateVersionValue(template) {
    if (!template) return '';
    return template.id === 'local'
      ? state.productDevelopmentTemplateVersion || 'local-template'
      : 'copywriting-' + template.id + '-v1';
  }

  function productDevelopmentApplyCopywritingTemplateToResults(template) {
    const currentSku = getProductDevelopmentCurrentSku();
    let result = state.productDevelopmentCopywriting;
    if ((!result || result.sku !== currentSku) && currentSku) result = restoreProductDevelopmentCopywritingCache(currentSku);
    const canPreserve = result && result.content && (!currentSku || result.sku === currentSku);
    if (canPreserve) {
      result.templateId = template.id;
      result.templateVersion = productDevelopmentTemplateVersionValue(template);
      result.templateLabel = template.label;
      result.blob = null;
      result.updatedAt = Date.now();
      state.productDevelopmentCopywriting = result;
      saveProductDevelopmentCopywritingCache(result);
    }
    const oneShot = state.productDevelopmentOneShotResult;
    if (oneShot && oneShot.copywritingTemplateId !== template.id) {
      oneShot.copywritingTemplateId = template.id;
      oneShot.copywritingTemplateLabel = template.label;
      oneShot.docxBlob = null;
      // Switching a template must not discard an already generated copy or a
      // confirmed ingredient table. Only the DOCX package is rebuilt.
      if (oneShot.stage === 'copywriting' && state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.id === oneShot.id + '-copy') {
        state.productDevelopmentCopywriting.templateId = template.id;
        state.productDevelopmentCopywriting.templateVersion = productDevelopmentTemplateVersionValue(template);
        state.productDevelopmentCopywriting.templateLabel = template.label;
        state.productDevelopmentCopywriting.blob = null;
        saveProductDevelopmentCopywritingCache(state.productDevelopmentCopywriting);
      }
    }
    return Boolean(canPreserve);
  }

  function selectProductDevelopmentCopywritingTemplate(templateId) {
    const targetId = String(templateId || '').trim();
    if (targetId === 'local' && !state.productDevelopmentTemplateBase64) throw new Error('请先添加本地 DOCX 模板');
    const template = targetId === 'local'
      ? { id: 'local', label: '本地自定义模板' }
      : productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === targetId);
    if (!template) throw new Error('文案模板不存在');
    saveProductDevelopmentCopywritingTemplateId(template.id);
    const preserved = productDevelopmentApplyCopywritingTemplateToResults(template);
    state.productDevelopmentStatus = preserved
      ? '已切换“' + template.label + '”模板，原文案已保留，下载时会重新套用模板'
      : '已选择文案模板：' + template.label;
    state.productDevelopmentError = '';
    renderShell();
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
  const PRODUCT_DEVELOPMENT_DETAIL_CACHE_VERSION = 3;
  const PRODUCT_DEVELOPMENT_DETAIL_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
  const PRODUCT_DEVELOPMENT_DETAIL_CACHE_LIMIT = 20;
  const PRODUCT_DEVELOPMENT_MATERIAL_DRAFT_VERSION = 2;
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
    instruction: Object.freeze({
      label: '说明书',
      categoryId: '152',
      categoryPath: '半成品 / 配件类 / 配件类 / 说明书',
      materialType: 6,
      supplierId: '80000173',
      supplier: '汕头市柠彩文化传媒有限公司-标签',
      usage: '1',
      shelfLife: '食品两年',
      defaultName: '产品使用说明书（英德法意西日韩捷瑞波荷葡）',
      defaultSpecification: '60G双胶纸,1pc,10x10cm,双面印刷,OEM',
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
    const cacheEntry = getProductDevelopmentReadonlyDetailCacheEntry(sku);
    const inMemoryDetail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    const cachedDetail = inMemoryDetail && typeof inMemoryDetail === 'object' && !inMemoryDetail.error
      ? inMemoryDetail
      : cacheEntry && cacheEntry.detail;
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
      state.productDevelopmentTaskView = 'detail';
      state.productDevelopmentTaskPreviousTab = '';
      state.productDevelopmentError = '';
    }
    const cachedDetail = productDevelopmentReadonlyDetailForTask(task);
    if (cachedDetail) {
      if (!state.productDevelopmentTaskFormData || typeof state.productDevelopmentTaskFormData !== 'object') state.productDevelopmentTaskFormData = Object.create(null);
      state.productDevelopmentTaskFormData[normalizedSku] = cachedDetail;
    }
    restoreProductDevelopmentReviewDraft(normalizedSku);
    if (!(opts.render === false)) renderShell();
    if (!(opts.hydrate === false)) {
      hydrateProductDevelopmentTaskDetail(task).then(() => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === normalizedSku) renderShell();
      }).catch((error) => {
        if (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskSelectedSku === normalizedSku) {
          state.productDevelopmentError = formatErrorMessage(error);
          renderShell();
        }
      });
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

  function productDevelopmentPrefillHasValue(source, key) {
    return Boolean(source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, key));
  }

  function productDevelopmentPrefillText(value, maxLength) {
    if (Array.isArray(value)) value = value.map((item) => productDevelopmentPrefillText(item, maxLength)).filter(Boolean).join(' / ');
    else if (value && typeof value === 'object') {
      if (productDevelopmentPrefillHasValue(value, 'displayValue')) value = value.displayValue;
      else if (productDevelopmentPrefillHasValue(value, 'label')) value = value.label;
      else if (productDevelopmentPrefillHasValue(value, 'value')) value = value.value;
    }
    return String(value === null || value === undefined ? '' : value)
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .trim()
      .slice(0, maxLength || 12000);
  }

  function productDevelopmentPrefillLocalAttrValue(detail, definition) {
    const attrId = Number(definition && definition.attrId);
    const localValues = detail && detail.productDetailLocalValues && typeof detail.productDetailLocalValues === 'object'
      ? detail.productDetailLocalValues
      : {};
    const entry = Number.isFinite(attrId) && attrId > 0 ? localValues[attrId + '@1'] : null;
    if (entry && typeof entry === 'object') return productDevelopmentPrefillHasValue(entry, 'displayValue') && productDevelopmentPrefillText(entry.displayValue) ? entry.displayValue : entry.value;
    return undefined;
  }

  function productDevelopmentPrefillProductFieldValue(detail, definition) {
    const localValue = productDevelopmentPrefillLocalAttrValue(detail, definition);
    if (localValue !== undefined) return localValue;
    const fields = productDevelopmentProductFieldCollections(detail);
    const attrId = Number(definition && definition.attrId);
    const field = fields.find((item) => item && (
      Number.isFinite(attrId) && attrId > 0 && Number(item.attrId) === attrId
      || String(item.key || '') === String(definition && definition.key || '')
    ));
    if (!field) return '';
    if (productDevelopmentPrefillText(field.displayValue)) return field.displayValue;
    return field.value === undefined ? '' : field.value;
  }

  function productDevelopmentIsEntryProductName(value) {
    return /[（(]\s*入口\s*[）)]/i.test(productDevelopmentPrefillText(value, 300));
  }

  function productDevelopmentEntryEnglishProductName(detail, task, meta) {
    const localPage1 = detail && detail.productDetailLocalPage1 && typeof detail.productDetailLocalPage1 === 'object'
      ? detail.productDetailLocalPage1
      : {};
    const localNames = detail && detail.productDetailLocalNames && typeof detail.productDetailLocalNames === 'object'
      ? detail.productDetailLocalNames
      : {};
    const names = [
      detail && detail.name,
      detail && detail.productNameCn,
      detail && detail.productNameEn,
      task && task.name,
      task && task.productName,
      task && task.productNameCn,
      task && task.productNameEn,
      meta && meta.productNameCn,
      meta && meta.productNameEn,
      localPage1.productNameCn,
      localPage1.productNameEn,
      localNames.productNameCn,
      localNames.productNameEn,
    ];
    return names.some(productDevelopmentIsEntryProductName) ? 'Dietary Supplement' : '';
  }

  function productDevelopmentPage1FieldValue(detail, key) {
    const localPage1 = detail && detail.productDetailLocalPage1 && typeof detail.productDetailLocalPage1 === 'object'
      ? detail.productDetailLocalPage1
      : {};
    const task = getProductDevelopmentTaskBySku(detail && detail.sku) || state.productDevelopmentSelectedTask || {};
    const meta = getProductDevelopmentTaskMeta(task, detail);
    const entryEnglishProductName = productDevelopmentEntryEnglishProductName(detail, task, meta);
    if (productDevelopmentPrefillHasValue(localPage1, key)) {
      if (key === 'categoryPath') return productDevelopmentNormalizeCategoryPathValue(localPage1[key]);
      if (key === 'brand') return productDevelopmentNormalizeBrandValue(localPage1[key]);
      if (key === 'productNameEn' && entryEnglishProductName) return entryEnglishProductName;
      return localPage1[key];
    }
    const info = detail && detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    const group = info.product_group && typeof info.product_group === 'object' ? info.product_group : {};
    if (key === 'categoryPath') return productDevelopmentNormalizeCategoryPathValue(detail && (detail.categoryName || info.category_name || task.plmCategory) || '');
    if (key === 'productNameCn') return detail && detail.productDetailLocalNames && productDevelopmentPrefillHasValue(detail.productDetailLocalNames, key)
      ? detail.productDetailLocalNames[key]
      : meta.productNameCn || detail && detail.productNameCn || '';
    if (key === 'productNameEn') return detail && detail.productDetailLocalNames && productDevelopmentPrefillHasValue(detail.productDetailLocalNames, key)
      ? entryEnglishProductName || detail.productDetailLocalNames[key]
      : entryEnglishProductName || meta.productNameEn || detail && detail.productNameEn || '';
    if (key === 'brand') return productDevelopmentNormalizeBrandValue(meta.brand || detail && detail.brand || info.brand_name || info.brandName || '');
    if (key === 'productGroupPath') return info.product_group_path || info.product_group_full_name || info.product_group_name || group.path || group.full_name || group.name || detail && detail.productGroupName || '';
    return '';
  }

  function productDevelopmentProcurementRow(detail) {
    const info = detail && detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    const candidates = [
      info.product_procure_infos,
      info.productProcureInfos,
      detail && detail.productProcureInfos,
      detail && detail.productProcureInfo,
    ];
    const row = candidates.find((value) => Array.isArray(value) && value.length) || candidates.find((value) => value && typeof value === 'object' && !Array.isArray(value));
    return Array.isArray(row) ? row[0] || {} : row && typeof row === 'object' ? row : {};
  }

  function productDevelopmentProcurementFieldValue(detail, key) {
    const local = detail && detail.productDetailLocalProcurement && typeof detail.productDetailLocalProcurement === 'object'
      ? detail.productDetailLocalProcurement
      : {};
    if (productDevelopmentPrefillHasValue(local, key)) return local[key];
    const row = productDevelopmentProcurementRow(detail);
    const candidates = {
      supplier: ['company_supplier_name', 'companySupplierName', 'supplier_name', 'supplierName', 'supplier', 'company_supplier_id'],
      processType: ['process_type_name', 'processTypeName', 'process_type', 'processType'],
      processFee: ['process_fee', 'processFee'],
      taxRate: ['tax_rate_name', 'taxRateName', 'tax_rate', 'taxRate', 'tax_rate_id'],
      quantity: ['quantity', 'purchase_quantity', 'purchaseQuantity'],
      materialPrice: ['material_price', 'materialPrice', 'unit_price', 'unitPrice'],
    }[key] || [];
    const sourceKey = candidates.find((candidate) => row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== '');
    return sourceKey ? row[sourceKey] : '';
  }

  function productDevelopmentApplyProductDetailLocalValues(detail) {
    if (!detail || typeof detail !== 'object') return detail;
    const localValues = detail.productDetailLocalValues && typeof detail.productDetailLocalValues === 'object'
      ? detail.productDetailLocalValues
      : {};
    Object.keys(localValues).forEach((key) => {
      const item = localValues[key];
      if (!item || typeof item !== 'object') return;
      const match = key.match(/^(\d+)@(\d+)$/);
      if (!match) return;
      const attrId = Number(match[1]);
      const languageId = Number(match[2]);
      productDevelopmentSetProductAttrValue(detail, attrId, languageId, item.value);
      productDevelopmentProductFieldCollections(detail).filter((field) => Number(field && field.attrId) === attrId).forEach((field) => {
        field.value = productDevelopmentCloneValue(item.value);
        field.displayValue = productDevelopmentCleanText(item.displayValue !== undefined ? item.displayValue : item.value, 800);
        field.status = field.displayValue ? '已填写（本地）' : '待补充';
        field.source = field.displayValue ? '本地人工填写（未写入）' : '待人工补充';
      });
    });
    return detail;
  }

  function productDevelopmentRememberLocalProductField(detail, field, value, displayValue, source) {
    const attrId = Number(field && field.attrId);
    if (!detail || !Number.isFinite(attrId) || attrId <= 0) return false;
    const languageId = 1;
    if (!detail.productDetailLocalValues || typeof detail.productDetailLocalValues !== 'object') detail.productDetailLocalValues = Object.create(null);
    detail.productDetailLocalValues[attrId + '@' + languageId] = {
      value: productDevelopmentCloneValue(value),
      displayValue: productDevelopmentCleanText(displayValue !== undefined ? displayValue : value, 800),
      source: productDevelopmentCleanText(source, 80),
    };
    productDevelopmentSetProductAttrValue(detail, attrId, languageId, value);
    return true;
  }

  function productDevelopmentReworkLookupState(detail) {
    const source = detail && detail.productDevelopmentReworkLookup && typeof detail.productDevelopmentReworkLookup === 'object'
      ? detail.productDevelopmentReworkLookup
      : {};
    const data = source.data && typeof source.data === 'object'
      ? source.data
      : (source.procurementPrice !== undefined ? source : null);
    return {
      status: ['loading', 'ready', 'error'].includes(String(source.status || '')) ? String(source.status) : 'idle',
      code: productDevelopmentNormalizeReworkProductCode(source.code),
      message: productDevelopmentPrefillText(source.message, 800),
      updatedAt: Number(source.updatedAt) || 0,
      data,
    };
  }

  function productDevelopmentReworkLookupStatusText(detail) {
    const lookup = productDevelopmentReworkLookupState(detail);
    if (lookup.status === 'loading') return '正在读取返工产品资料…';
    if (lookup.status === 'error') return lookup.message || '返工产品资料查询失败';
    if (lookup.status === 'ready') {
      const data = lookup.data || {};
      const price = productDevelopmentPrefillText(data.procurementPrice);
      const packing = productDevelopmentPrefillText(data.standardPackingQuantity);
      return '已按 ' + (lookup.code || data.code || '返工编码') + ' 回填' + (price ? '采购价 ' + price : '') + (packing ? ' · 标准装箱数 ' + packing : '');
    }
    return '填写返工编码后自动查询采购价、产线和价格档位；采购明细默认 JSJ / 直采 / 100 件';
  }

  function productDevelopmentClearReworkLocalProductFields(detail) {
    if (!detail || !detail.productDetailLocalValues || typeof detail.productDetailLocalValues !== 'object') return;
    const attrIds = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.map((definition) => Number(definition.attrId))
      .concat([301, 457, 522, 587, 652, 717, 1183]);
    Array.from(new Set(attrIds)).forEach((attrId) => {
      const key = attrId + '@1';
      const entry = detail.productDetailLocalValues[key];
      if (entry && entry.source === '返工编码 API') delete detail.productDetailLocalValues[key];
    });
  }

  function productDevelopmentApplyReworkProductLookup(detail, lookup) {
    if (!detail || !lookup || typeof lookup !== 'object') return null;
    const packing = productDevelopmentReworkLookupPacking(detail, lookup);
    const enriched = {
      ...productDevelopmentCloneValue(lookup),
      standardPackingQuantity: packing.quantity,
      standardPackingSource: packing.source,
      unitDimensions: packing.unitDimensions,
    };
    productDevelopmentClearReworkLocalProductFields(detail);
    const setField = (key, value, displayValue) => {
      if (!productDevelopmentReworkLookupValuePresent(value) && !productDevelopmentReworkLookupValuePresent(displayValue)) return false;
      const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
      if (!definition) return false;
      const rawValue = productDevelopmentReworkLookupValuePresent(value) ? value : displayValue;
      const textValue = productDevelopmentPrefillText(productDevelopmentReworkLookupValuePresent(displayValue) ? displayValue : rawValue, 800);
      productDevelopmentRememberLocalProductField(detail, definition, rawValue, textValue, '返工编码 API');
      productDevelopmentProductFieldCollections(detail).filter((field) => Number(field && field.attrId) === Number(definition.attrId)).forEach((field) => {
        field.value = productDevelopmentCloneValue(rawValue);
        field.displayValue = textValue;
        field.status = '已预填（返工编码）';
        field.source = '返工编码 API';
      });
      return true;
    };
    setField('specification', enriched.specification, enriched.specification);
    setField('roughWeight', enriched.roughWeight, enriched.roughWeight);
    setField('outerLength', enriched.outerLength, enriched.outerLength);
    setField('outerWidth', enriched.outerWidth, enriched.outerWidth);
    setField('outerHeight', enriched.outerHeight, enriched.outerHeight);
    setField('outerVolume', enriched.outerVolume, enriched.outerVolume);
    setField('productProductionLine', enriched.productLineValue, enriched.productLine);
    setField('minimumOrderQuantity', '100', '100');
    setField('procurementPrice', enriched.procurementPrice, enriched.procurementPrice);
    setField('costPrice', enriched.costPrice, enriched.costPrice);
    setField('firstPrice', enriched.firstPrice, enriched.firstPrice);
    setField('secondPrice', enriched.secondPrice, enriched.secondPrice);
    setField('thirdPrice', enriched.thirdPrice, enriched.thirdPrice);
    setField('standardPackingQuantity', enriched.standardPackingQuantity, enriched.standardPackingQuantity);
    if (!detail.productDetailLocalProcurement || typeof detail.productDetailLocalProcurement !== 'object') detail.productDetailLocalProcurement = Object.create(null);
    Object.assign(detail.productDetailLocalProcurement, {
      ...PRODUCT_DEVELOPMENT_REWORK_DEFAULT_PROCUREMENT,
      materialPrice: enriched.procurementPrice,
    });
    detail.reworkProductCode = enriched.code;
    productDevelopmentMarkProductDetailDirty(detail);
    return enriched;
  }

  function productDevelopmentRememberLocalProductName(detail, key, value) {
    if (!detail || !['productNameCn', 'productNameEn'].includes(key)) return false;
    if (!detail.productDetailLocalNames || typeof detail.productDetailLocalNames !== 'object') detail.productDetailLocalNames = {};
    detail.productDetailLocalNames[key] = productDevelopmentCleanText(value, 180);
    const languageId = key === 'productNameEn' ? 2 : 1;
    const languageConfig = Array.isArray(detail.productInfo && detail.productInfo.language_config)
      ? detail.productInfo.language_config
      : [];
    let language = languageConfig.find((item) => Number(item && item.language_id) === languageId);
    if (!language) {
      language = { language_id: languageId, product_name: '', product_remark: null };
      languageConfig.push(language);
    }
    language.product_name = detail.productDetailLocalNames[key];
    detail.productInfo = detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    detail.productInfo.language_config = languageConfig;
    return true;
  }

  function productDevelopmentMarkProductDetailDirty(detail) {
    if (!detail) return;
    detail.productDetailDraftDirty = true;
    detail.productDetailSaveState = 'dirty';
    detail.productDetailPlmSaveState = '';
    detail.productDetailPlmSaveMessage = '';
    detail.cacheSource = 'local-cache';
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

  function productDevelopmentOrganizationDefaultForDefinition(definition, attr) {
    const key = String(definition && definition.key || '').trim();
    const fallback = PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS[key]
      || Object.values(PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS).find((item) => Number(item.attrId) === Number(definition && definition.attrId)
        || item.label === String(definition && definition.label || '').trim());
    if (!fallback) return null;
    let options = attr && attr.option_list_json;
    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch (error) { options = []; }
    }
    const defaultOption = (Array.isArray(options) ? options : []).find((option) => option && (
      option.is_def === true || option.is_default === true || option.isDefault === true
    ));
    const rawValue = defaultOption && defaultOption.value !== undefined ? defaultOption.value : fallback.value;
    const optionLabel = defaultOption && Array.isArray(defaultOption.option_label_list)
      ? defaultOption.option_label_list.find((item) => Number(item && item.language_id || 1) === 1) || defaultOption.option_label_list[0]
      : null;
    return {
      ...fallback,
      value: Array.isArray(rawValue) ? rawValue.slice() : [rawValue],
      displayValue: productDevelopmentCleanText(optionLabel && optionLabel.label || fallback.displayValue, 100),
      source: defaultOption ? 'PLM 默认选项' : 'HAR 默认选项',
    };
  }

  function productDevelopmentIsDefaultOrganizationField(field) {
    if (!field) return false;
    const key = String(field.key || '').trim();
    return Boolean(PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS[key]
      || Object.values(PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS).some((item) => Number(item.attrId) === Number(field.attrId)
        || item.label === String(field.label || '').trim()));
  }

  function productDevelopmentOrganizationDefaults(attrs) {
    return Object.keys(PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS).map((key) => {
      const definition = PRODUCT_DEVELOPMENT_ORGANIZATION_DEFAULTS[key];
      const attr = (Array.isArray(attrs) ? attrs : []).find((item) => Number(item && item.attr_id) === Number(definition.attrId)
        || String(item && item.variable_name || '') === key);
      return productDevelopmentOrganizationDefaultForDefinition(definition, attr);
    }).filter(Boolean);
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

  function productDevelopmentNormalizeReworkProductCode(value) {
    return String(value || '').trim().toUpperCase();
  }

  function productDevelopmentReworkLookupValuePresent(value) {
    return value !== null && value !== undefined && value !== '' && Boolean(productDevelopmentPrefillText(value));
  }

  function productDevelopmentReworkLookupNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(number) ? number : null;
  }

  function productDevelopmentReworkLookupValue(source, keys) {
    if (!source || typeof source !== 'object') return undefined;
    const candidates = Array.isArray(keys) ? keys : [keys];
    for (const key of candidates) {
      const name = String(key || '').trim();
      if (!name || !Object.prototype.hasOwnProperty.call(source, name)) continue;
      const value = source[name];
      if (productDevelopmentReworkLookupValuePresent(value)) return value;
    }
    return undefined;
  }

  function productDevelopmentReworkLookupAttr(attrs, attrId, key) {
    return (Array.isArray(attrs) ? attrs : []).find((item) => Number(item && item.attr_id) === Number(attrId)
      || String(item && item.variable_name || '') === String(key || '')) || null;
  }

  function productDevelopmentReworkLookupField(attrs, source, attrId, key, fallbackKeys) {
    const attr = productDevelopmentReworkLookupAttr(attrs, attrId, key);
    let raw = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : undefined;
    if (!productDevelopmentReworkLookupValuePresent(raw)) raw = productDevelopmentReworkLookupValue(source, fallbackKeys || [key]);
    const displayValue = attr
      ? productDevelopmentReadonlyValueText(raw, attr)
      : productDevelopmentPrefillText(raw, 800);
    return {
      attr,
      value: productDevelopmentCloneValue(raw),
      displayValue,
    };
  }

  function productDevelopmentReworkLookupDimensions(value) {
    if (Array.isArray(value)) {
      const direct = value.slice(0, 3).map(productDevelopmentReworkLookupNumber);
      if (direct.length === 3 && direct.every((item) => item !== null && item > 0)) return direct;
    } else if (value && typeof value === 'object') {
      const direct = ['length', 'width', 'height'].map((key) => productDevelopmentReworkLookupNumber(value[key]));
      if (direct.every((item) => item !== null && item > 0)) return direct;
    }
    return productDevelopmentReadonlyDimensionText(productDevelopmentPrefillText(value, 240));
  }

  function productDevelopmentReworkLookupObjectDimensions(source, keyGroups) {
    const values = (Array.isArray(keyGroups) ? keyGroups : []).map((keys) => productDevelopmentReworkLookupValue(source, keys));
    const dimensions = values.map(productDevelopmentReworkLookupNumber);
    return dimensions.length === 3 && dimensions.every((item) => item !== null && item > 0) ? dimensions : null;
  }

  function productDevelopmentReworkLookupPackagingType(specification) {
    const text = String(specification || '').replace(/\s+/g, '');
    if (/(?:\/|／)盒/.test(text)) return 'box';
    if (/(?:\/|／)瓶/.test(text)) return 'bottle';
    return '';
  }

  function productDevelopmentReworkLookupPaperBoxDimensions(detail) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    const paperBox = rows.find((row) => /纸盒/.test(String(row && (row.name || '') + (row.category || '') + (row.specification || '')))
      || productDevelopmentMaterialRowKind(row) === 'box');
    const rowDimensions = productDevelopmentReworkLookupObjectDimensions(paperBox, [
      ['length', 'material_length', 'materialLength'],
      ['width', 'material_width', 'materialWidth'],
      ['height', 'material_height', 'materialHeight'],
    ]) || productDevelopmentReworkLookupDimensions(paperBox && paperBox.specification);
    if (rowDimensions) return rowDimensions;
    const draft = detail && detail.materialDrafts && detail.materialDrafts.box;
    if (draft && draft.enabled !== false) {
      return productDevelopmentReworkLookupObjectDimensions(draft, [
        ['length'],
        ['width'],
        ['height'],
      ]) || productDevelopmentReworkLookupDimensions(draft.specification);
    }
    return null;
  }

  function productDevelopmentReworkLookupUnitDimensions(detail, lookup) {
    const paperBoxDimensions = productDevelopmentReworkLookupPaperBoxDimensions(detail);
    if (paperBoxDimensions && lookup && lookup.packagingType !== 'bottle') {
      return { dimensions: paperBoxDimensions, source: '纸盒尺寸' };
    }
    return {
      dimensions: lookup && Array.isArray(lookup.outerDimensions) ? lookup.outerDimensions.slice() : null,
      source: '返工产品外长宽高',
    };
  }

  function productDevelopmentReworkLookupPackingCount(cartonDimensions, unitDimensions) {
    if (!Array.isArray(cartonDimensions) || cartonDimensions.length !== 3 || !Array.isArray(unitDimensions) || unitDimensions.length !== 3) return null;
    if (!cartonDimensions.every((item) => Number.isFinite(Number(item)) && Number(item) > 0)
      || !unitDimensions.every((item) => Number.isFinite(Number(item)) && Number(item) > 0)) return null;
    const permutations = [
      [0, 1, 2], [0, 2, 1], [1, 0, 2],
      [1, 2, 0], [2, 0, 1], [2, 1, 0],
    ];
    let maximum = 0;
    permutations.forEach((permutation) => {
      const count = cartonDimensions.reduce((total, carton, index) => total * Math.floor(Number(carton) / Number(unitDimensions[permutation[index]])), 1);
      if (Number.isFinite(count) && count > maximum) maximum = count;
    });
    return maximum > 0 ? maximum : null;
  }

  function productDevelopmentReworkLookupPacking(detail, lookup) {
    const unit = productDevelopmentReworkLookupUnitDimensions(detail, lookup);
    const calculated = productDevelopmentReworkLookupPackingCount(lookup && lookup.cartonDimensions, unit.dimensions);
    if (calculated) return { quantity: calculated, source: unit.source + ' × 箱规', unitDimensions: unit.dimensions };
    const fallback = productDevelopmentReworkLookupNumber(lookup && lookup.sourceStandardPackingQuantity);
    return {
      quantity: fallback && fallback > 0 ? fallback : '',
      source: fallback && fallback > 0 ? '返工产品原标准装箱数（未取得可计算尺寸）' : '待补充箱规或尺寸',
      unitDimensions: unit.dimensions,
    };
  }

  function productDevelopmentReworkLookupCheckPayload(payload, label) {
    if (payload && payload.success === false) {
      const message = typeof formatPlmApiMessage === 'function'
        ? formatPlmApiMessage(payload.msg) || formatPlmApiMessage(payload.message)
        : String(payload.msg || payload.message || '');
      throw new Error(message || label + '接口返回失败');
    }
    return payload;
  }

  async function productDevelopmentFetchReworkProductData(code) {
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    if (!normalizedCode) throw new Error('请先填写返工产品编码');
    const listPayload = productDevelopmentReworkLookupCheckPayload(
      await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(normalizedCode)),
      '返工产品查询',
    );
    const list = productDevelopmentReadonlyList(listPayload);
    const exactProduct = (Array.isArray(list) ? list : []).find((item) => [
      item && item.code,
      item && item.style_code,
      item && item.product_code,
      item && item.jst_old_code,
    ].some((value) => productDevelopmentNormalizeReworkProductCode(value) === normalizedCode));
    const product = exactProduct || (Array.isArray(list) && list.length === 1 ? list[0] : null);
    if (!product) throw new Error('PLM 中没有找到返工产品编码“' + normalizedCode + '”');
    const productId = String(productDevelopmentReworkLookupValue(product, ['product_id', 'productId', 'product_main_id', 'productMainId']) || '').trim();
    const productVersionId = String(productDevelopmentReworkLookupValue(product, ['product_version_id', 'productVersionId', 'version_id', 'versionId']) || '').trim();
    const categoryId = String(productDevelopmentReworkLookupValue(product, ['category_id', 'categoryId']) || '').trim();
    if (!/^\d+$/.test(productId) || !/^\d+$/.test(productVersionId) || !/^\d+$/.test(categoryId)) {
      throw new Error('返工产品“' + normalizedCode + '”缺少产品版本或类目 ID');
    }
    const [pricePayload, contentPayload] = await Promise.all([
      fetchPlmJson('/api/Product/GetProductPriceInfo?type=1&product_version_id=' + encodeURIComponent(productVersionId))
        .then((payload) => productDevelopmentReworkLookupCheckPayload(payload, '返工采购价查询')),
      fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(productVersionId))
        .then((payload) => productDevelopmentReworkLookupCheckPayload(payload, '返工产品详情查询')),
    ]);
    const attrs = productDevelopmentReadonlyAttrs(contentPayload);
    if (!attrs.length) throw new Error('返工产品“' + normalizedCode + '”没有读取到建品详情字段');
    const priceData = productDevelopmentReadonlyPayloadData(pricePayload) || {};
    const priceFromApi = productDevelopmentReworkLookupValue(priceData, ['procurement_price', 'procurementPrice', 'purchase_price', 'purchasePrice']);
    const priceFromProduct = productDevelopmentReworkLookupValue(product, ['procurement_price', 'procurementPrice', 'purchase_price', 'purchasePrice']);
    const procurementPrice = productDevelopmentReworkLookupNumber(priceFromApi) !== null
      ? productDevelopmentReworkLookupNumber(priceFromApi)
      : productDevelopmentReworkLookupNumber(priceFromProduct);
    if (procurementPrice === null) throw new Error('返工产品“' + normalizedCode + '”没有可用采购价');
    const specification = productDevelopmentReworkLookupField(attrs, product, 119, 'specification', ['spec_model', 'specification']);
    const roughWeight = productDevelopmentReworkLookupField(attrs, product, 122, 'rough_weight', ['rough_weight', 'roughWeight']);
    const outerLength = productDevelopmentReworkLookupField(attrs, product, 133, 'long_outer_packaging', ['long_outer_packaging', 'outer_length', 'outerLength']);
    const outerWidth = productDevelopmentReworkLookupField(attrs, product, 134, 'wide_outer_packaging', ['wide_outer_packaging', 'outer_width', 'outerWidth']);
    const outerHeight = productDevelopmentReworkLookupField(attrs, product, 135, 'high_outer_packaging', ['high_outer_packaging', 'outer_height', 'outerHeight']);
    const outerVolume = productDevelopmentReworkLookupField(attrs, product, 136, 'volume_outer_packaging', ['volume_outer_packaging', 'outer_volume', 'outerVolume']);
    const productLine = productDevelopmentReworkLookupField(attrs, product, 131, 'product_production_line', ['product_production_line', 'productProductionLine', 'production_line', 'productionLine', 'product_production_line_name']);
    const costPrice = productDevelopmentReworkLookupField(attrs, product, 153, 'cost_rice', ['cost_rice', 'cost_price', 'costPrice']);
    const firstPrice = productDevelopmentReworkLookupField(attrs, product, 154, 'first_price', ['first_price', 'firstPrice']);
    const secondPrice = productDevelopmentReworkLookupField(attrs, product, 155, 'second_price', ['second_price', 'secondPrice']);
    const thirdPrice = productDevelopmentReworkLookupField(attrs, product, 156, 'third_price', ['third_price', 'thirdPrice']);
    const sourceStandardPacking = productDevelopmentReworkLookupField(attrs, product, 123, 'standard_packing_quantity', ['standard_packing_quantity', 'standardPackingQuantity']);
    const boxGauge = productDevelopmentReworkLookupField(attrs, product, 149, 'box_gauge', ['product_carton_specification_format', 'product_carton_specification', 'box_gauge', 'boxGauge']);
    const outerDimensions = [outerLength, outerWidth, outerHeight].map((field) => productDevelopmentReworkLookupNumber(field.value));
    const normalizedOuterDimensions = outerDimensions.every((item) => item !== null && item > 0) ? outerDimensions : null;
    const calculatedVolume = normalizedOuterDimensions
      ? Number((normalizedOuterDimensions[0] * normalizedOuterDimensions[1] * normalizedOuterDimensions[2]).toFixed(2))
      : '';
    const cartonCandidates = [
      boxGauge.displayValue,
      productDevelopmentReworkLookupValue(product, ['product_carton_specification_format']),
      productDevelopmentReworkLookupValue(product, ['product_carton_specification']),
    ];
    const cartonDimensions = cartonCandidates.map(productDevelopmentReworkLookupDimensions).find(Boolean) || null;
    const resolvedSpecification = specification.displayValue || productDevelopmentPrefillText(specification.value, 800);
    return {
      code: normalizedCode,
      productCode: productDevelopmentReworkLookupValue(product, ['code', 'style_code', 'product_code']) || normalizedCode,
      productId,
      productVersionId,
      categoryId,
      productNameCn: productDevelopmentPrefillText(productDevelopmentReworkLookupValue(product, ['cn_name', 'product_name', 'productName']), 180),
      specification: resolvedSpecification,
      packagingType: productDevelopmentReworkLookupPackagingType(resolvedSpecification),
      roughWeight: roughWeight.value,
      outerLength: outerLength.value,
      outerWidth: outerWidth.value,
      outerHeight: outerHeight.value,
      outerVolume: productDevelopmentReworkLookupValuePresent(outerVolume.value) ? outerVolume.value : calculatedVolume,
      outerDimensions: normalizedOuterDimensions,
      productLineValue: productLine.value,
      productLine: productLine.displayValue || productDevelopmentPrefillText(productLine.value, 800),
      costPrice: costPrice.value,
      firstPrice: firstPrice.value,
      secondPrice: secondPrice.value,
      thirdPrice: thirdPrice.value,
      sourceStandardPackingQuantity: sourceStandardPacking.value,
      boxGauge: boxGauge.displayValue || productDevelopmentPrefillText(boxGauge.value, 800),
      cartonDimensions,
      procurementPrice,
      fetchedAt: Date.now(),
    };
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

  function productDevelopmentPricingNumber(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().replace(/,/g, '');
    if (!text) return null;
    const number = Number(text);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function productDevelopmentPricingTaxRatePercent(value) {
    const text = String(value === null || value === undefined ? '' : value).trim();
    if (!text) return null;
    const hasPercent = /%/.test(text);
    const number = Number(text.replace(/%/g, '').trim());
    if (!Number.isFinite(number) || number < 0) return null;
    const percent = hasPercent || number > 1 ? number : number * 100;
    return percent >= 0 && percent <= 100 ? percent : null;
  }

  function productDevelopmentPricingInputValue(value, sku) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      sku: String(sku === undefined ? source.sku : sku || '').trim().toUpperCase(),
      fullPackagePrice: String(source.fullPackagePrice === null || source.fullPackagePrice === undefined ? '' : source.fullPackagePrice).trim().replace(/,/g, '').slice(0, 40),
      taxRatePercent: String(source.taxRatePercent === null || source.taxRatePercent === undefined ? '' : source.taxRatePercent).trim().replace(/%/g, '').slice(0, 20),
    };
  }

  function loadProductDevelopmentPricingDrafts() {
    const value = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_PRICING_DRAFT_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function saveProductDevelopmentPricingInput(value) {
    const input = productDevelopmentPricingInputValue(value);
    const drafts = loadProductDevelopmentPricingDrafts();
    const key = input.sku || '_default';
    drafts[key] = {
      fullPackagePrice: input.fullPackagePrice,
      taxRatePercent: input.taxRatePercent,
    };
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_PRICING_DRAFT_KEY, drafts);
    state.productDevelopmentPricingInput = input;
    return input;
  }

  function productDevelopmentPricingDetailValue(detail, key) {
    if (!detail || detail.error) return '';
    const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
    return definition ? productDevelopmentPrefillProductFieldValue(detail, definition) : '';
  }

  function productDevelopmentPricingInputForSku(sku, detail) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const current = state.productDevelopmentPricingInput && typeof state.productDevelopmentPricingInput === 'object'
      ? productDevelopmentPricingInputValue(state.productDevelopmentPricingInput)
      : null;
    if (current && current.sku === normalizedSku) {
      const detailPrice = productDevelopmentPricingDetailValue(detail, 'procurementPrice');
      const detailTaxRate = productDevelopmentPricingTaxRatePercent(productDevelopmentProcurementFieldValue(detail, 'taxRate'));
      if (!current.fullPackagePrice && detailPrice) current.fullPackagePrice = String(detailPrice).trim();
      if (!current.taxRatePercent && detailTaxRate !== null) current.taxRatePercent = String(detailTaxRate);
      state.productDevelopmentPricingInput = current;
      return current;
    }
    const drafts = loadProductDevelopmentPricingDrafts();
    const saved = drafts[normalizedSku] || (!normalizedSku ? drafts._default : null) || {};
    const detailPrice = productDevelopmentPricingDetailValue(detail, 'procurementPrice');
    const detailTaxRate = productDevelopmentPricingTaxRatePercent(productDevelopmentProcurementFieldValue(detail, 'taxRate'));
    const input = productDevelopmentPricingInputValue({
      sku: normalizedSku,
      fullPackagePrice: String(saved.fullPackagePrice || '').trim() || detailPrice,
      taxRatePercent: String(saved.taxRatePercent || '').trim() || (detailTaxRate === null ? '' : detailTaxRate),
    });
    state.productDevelopmentPricingInput = input;
    return input;
  }

  function productDevelopmentCalculateTierPrices(fullPackagePrice, taxRatePercent) {
    const fullPrice = productDevelopmentPricingNumber(fullPackagePrice);
    const taxRate = productDevelopmentPricingTaxRatePercent(taxRatePercent);
    if (fullPrice === null || fullPrice <= 0 || taxRate === null || taxRate < 0 || taxRate > 100) return null;
    const thirdPrice = Number(((fullPrice * (1 + taxRate / 100) + 3) / 0.7).toFixed(2));
    return {
      thirdPrice,
      secondPrice: Number((thirdPrice + 1).toFixed(2)),
      firstPrice: Number((thirdPrice + 2).toFixed(2)),
    };
  }

  function productDevelopmentPricingPriceText(value) {
    const number = productDevelopmentPricingNumber(value);
    return number === null ? '' : number.toFixed(2);
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

  function productDevelopmentMaterialRowText(row) {
    return [row && row.name, row && row.category, row && row.specification]
      .map((value) => String(value || ''))
      .join(' ');
  }

  function productDevelopmentMaterialRowKind(row) {
    if (!row) return '';
    const text = productDevelopmentMaterialRowText(row);
    const materialTypeText = String(row.materialType === null || row.materialType === undefined ? '' : row.materialType).trim();
    const materialType = materialTypeText === '' ? null : Number(materialTypeText);
    if (materialType === 6 || /说明书|使用说明/.test(text)) return 'instruction';
    if (materialType === 0 || /纸盒/.test(text)) return 'box';
    if (materialType === 1 || /标签/.test(text)) return 'label';
    return '';
  }

  function productDevelopmentMaterialExistingRow(detail, kind) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    return rows.find((row) => productDevelopmentMaterialRowKind(row) === kind) || null;
  }

  function productDevelopmentMaterialBaseName(task, detail) {
    const meta = getProductDevelopmentTaskMeta(task, detail);
    return productDevelopmentCleanText(
      meta.productNameCn || detail && detail.productNameCn || task && task.name || detail && detail.name || detail && detail.sku,
      180,
    );
  }

  function productDevelopmentMaterialPackSpec(detail, kind) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    if (kind === 'instruction') {
      const instruction = rows.find((row) => productDevelopmentMaterialRowKind(row) === 'instruction');
      return productDevelopmentCleanText(instruction && instruction.specification || PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS.instruction.defaultSpecification, 160);
    }
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
    if (kind === 'instruction') return productDevelopmentCleanText(draft.defaultName || PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS.instruction.defaultName, 240);
    if (kind === 'label') {
      const shape = productDevelopmentCleanText(draft.labelShape || '圆弧', 40);
      return [base, '标签（' + shape + ' ' + shelfLife + '）'].filter(Boolean).join('');
    }
    const insertCard = draft.insertCard ? '内卡 ' : '';
    return [base, '纸盒（' + insertCard + shelfLife + '）'].filter(Boolean).join('');
  }

  function productDevelopmentMaterialDefaultSpecification(kind, draft) {
    const packSpec = productDevelopmentCleanText(draft.packSpec, 160);
    if (kind === 'instruction') return packSpec || PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS.instruction.defaultSpecification;
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
    if (kind === 'box') return productDevelopmentCalculatePaperBoxPrice(draft);
    if (kind === 'label') return productDevelopmentCalculateLabelPrice(draft);
    return productDevelopmentMaterialNumberText(draft && draft.price, 6);
  }

  function productDevelopmentNormalizeMaterialDraft(rawValue, kind, detail, task) {
    const defaults = PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS[kind];
    const source = rawValue && typeof rawValue === 'object' ? rawValue : {};
    const existing = productDevelopmentMaterialExistingRow(detail, kind);
    const existingMaterialId = String(existing && existing.materialId || '').trim();
    const existingJoinId = String(existing && existing.joinId || '').trim();
    const sourceMaterialId = String(source.materialId || '').trim();
    const sourceJoinId = String(source.joinId || '').trim();
    const legacyMismatchedDraft = Number(source.schemaVersion || 0) < PRODUCT_DEVELOPMENT_MATERIAL_DRAFT_VERSION
      && existing
      && ((sourceMaterialId && existingMaterialId && sourceMaterialId !== existingMaterialId)
        || (sourceJoinId && existingJoinId && sourceJoinId !== existingJoinId));
    const raw = { ...source };
    if (legacyMismatchedDraft) {
      ['materialId', 'code', 'joinId', 'packSpec', 'materialName', 'specification', 'length', 'width', 'height', 'price', 'nameSource', 'specificationSource'].forEach((key) => delete raw[key]);
    }
    const hasExisting = Boolean(existing);
    const dimensions = productDevelopmentMaterialDimensions(existing && existing.specification);
    const baseName = productDevelopmentMaterialBaseName(task, detail);
    const packSpec = productDevelopmentCleanText(raw.packSpec || productDevelopmentMaterialPackSpec(detail, kind) || defaults.defaultSpecification, 160);
    const hasName = Object.prototype.hasOwnProperty.call(raw, 'materialName');
    const hasSpecification = Object.prototype.hasOwnProperty.call(raw, 'specification');
    const nameSource = String(raw.nameSource || (hasName ? 'manual' : existing && existing.name ? 'plm' : 'generated'));
    const specificationSource = String(raw.specificationSource || (hasSpecification ? 'manual' : 'generated'));
    const hasExplicitEnabled = Object.prototype.hasOwnProperty.call(raw, 'enabled') || Object.prototype.hasOwnProperty.call(raw, 'removed');
    const dimensionValue = (rawKey, existingValue, parsedValue) => {
      if (raw[rawKey] !== undefined && raw[rawKey] !== null && String(raw[rawKey]).trim() !== '') return raw[rawKey];
      if (existingValue !== undefined && existingValue !== null && String(existingValue).trim() !== '') return existingValue;
      return parsedValue;
    };
    const draft = {
      schemaVersion: PRODUCT_DEVELOPMENT_MATERIAL_DRAFT_VERSION,
      kind,
      enabled: hasExplicitEnabled
        ? raw.enabled !== false && raw.removed !== true
        : (kind === 'instruction' ? hasExisting : true),
      label: defaults.label,
      materialType: raw.materialType !== undefined
        ? String(raw.materialType)
        : (existing && String(existing.materialType || '').trim() !== '' ? String(existing.materialType) : String(defaults.materialType)),
      categoryId: String(raw.categoryId || existing && existing.categoryId || defaults.categoryId),
      categoryPath: productDevelopmentCleanText(raw.categoryPath || defaults.categoryPath, 160),
      supplierId: String(raw.supplierId || existing && existing.supplierId || defaults.supplierId),
      supplier: productDevelopmentCleanText(raw.supplier || existing && existing.supplier || defaults.supplier, 180),
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
      defaultName: productDevelopmentCleanText(defaults.defaultName, 240),
      length: kind === 'instruction' ? '' : productDevelopmentMaterialNumberText(dimensionValue('length', existing && existing.length, dimensions.length), 2),
      width: kind === 'instruction' ? '' : productDevelopmentMaterialNumberText(dimensionValue('width', existing && existing.width, dimensions.width), 2),
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
      instruction: productDevelopmentNormalizeMaterialDraft(source.instruction, 'instruction', detail, task),
    };
  }

  function productDevelopmentEnsureMaterialDrafts(detail, task) {
    if (!detail || typeof detail !== 'object') return { value: { box: {}, label: {}, instruction: {} }, changed: false };
    const normalized = productDevelopmentNormalizeMaterialDrafts(detail.materialDrafts, detail, task);
    const previous = JSON.stringify(detail.materialDrafts || null);
    const next = JSON.stringify(normalized);
    if (previous !== next) detail.materialDrafts = normalized;
    return { value: normalized, changed: previous !== next };
  }

  function productDevelopmentSetMaterialEnabled(sku, kind, enabled) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || !['box', 'label', 'instruction'].includes(kind)) return false;
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
    const title = kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '说明书';
    state.productDevelopmentStatus = (enabled ? '已恢复' : '已移除') + title + '本地填写卡片';
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
      material_type: draft.materialType === '' || draft.materialType === null || draft.materialType === undefined
        ? null
        : productDevelopmentApiNumber(draft.materialType, null),
    };
  }

  function productDevelopmentMaterialDraftMissingFields(kind, draft) {
    const title = kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '说明书';
    const missing = [];
    if (!productDevelopmentCleanText(draft && draft.materialName, 240)) missing.push(title + '物料名称');
    if (!productDevelopmentCleanText(draft && draft.specification, 240)) missing.push(title + '规格型号');
    if (kind !== 'instruction') {
      ['length', 'width'].concat(kind === 'box' ? ['height'] : []).forEach((field) => {
        if (productDevelopmentMaterialNumber(draft && draft[field]) === null) missing.push(title + field);
      });
    }
    if (productDevelopmentMaterialNumber(draft && draft.price) === null) missing.push(title + '采购价');
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
      ['instruction', detail.materialDrafts.instruction],
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

  function productDevelopmentSaveProductDetailLocally(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) {
      showToast('当前 SKU 详情还未读取完成');
      return false;
    }
    productDevelopmentApplyProductDetailLocalValues(detail);
    detail.productDetailDraftDirty = false;
    detail.productDetailSavedAt = new Date().toLocaleString();
    detail.productDetailSaveState = 'saved';
    detail.productDetailSaveMessage = '建品资料已保存到本地';
    detail.productDetailPlmSaveState = '';
    detail.productDetailPlmSaveMessage = '';
    detail.cacheSource = 'local-cache';
    saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    state.productDevelopmentStatus = '建品资料已保存到本地';
    showToast('建品资料已保存到本地');
    renderShell();
    return true;
  }

  function productDevelopmentProductDetailMissingFields(detail) {
    const missing = [];
    const checks = [];
    PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS.forEach((definition) => checks.push({
      label: definition.label,
      value: productDevelopmentPage1FieldValue(detail, definition.key),
    }));
    PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.forEach((definition) => checks.push({
      label: definition.label,
      value: productDevelopmentPrefillProductFieldValue(detail, definition),
    }));
    PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS.forEach((definition) => checks.push({
      label: definition.label,
      value: productDevelopmentProcurementFieldValue(detail, definition.key),
    }));
    checks.forEach((item) => {
      if (!productDevelopmentPrefillText(item.value)) missing.push(item.label);
    });
    return Array.from(new Set(missing));
  }

  function productDevelopmentProductDetailFieldValue(detail, key) {
    const fields = productDevelopmentProductFieldCollections(detail);
    const field = fields.find((item) => item && item.key === key);
    if (field) return field.value !== undefined ? field.value : field.displayValue !== undefined ? field.displayValue : '';
    const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key || key === 'procurement_rice' && Number(item.attrId) === 152);
    return definition ? productDevelopmentPrefillProductFieldValue(detail, definition) : '';
  }

  function productDevelopmentProductDetailLanguageConfig(detail, task) {
    const info = detail && detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    const source = Array.isArray(info.language_config) ? productDevelopmentCloneValue(info.language_config) : [];
    const languages = Array.isArray(source) ? source : [];
    const resolvedTask = task || getProductDevelopmentTaskBySku(detail && detail.sku) || {};
    const meta = getProductDevelopmentTaskMeta(resolvedTask, detail);
    const entryEnglishProductName = productDevelopmentEntryEnglishProductName(detail, resolvedTask, meta);
    const localNames = detail && detail.productDetailLocalNames && typeof detail.productDetailLocalNames === 'object'
      ? detail.productDetailLocalNames
      : {};
    const ensureLanguage = (languageId, fallbackName) => {
      let language = languages.find((item) => Number(item && item.language_id) === languageId);
      if (!language) {
        language = { language_id: languageId, product_name: fallbackName || '', product_remark: null };
        languages.push(language);
      }
      return language;
    };
    const cn = Object.prototype.hasOwnProperty.call(localNames, 'productNameCn')
      ? localNames.productNameCn
      : detail && detail.productNameCn || '';
    const en = entryEnglishProductName || (Object.prototype.hasOwnProperty.call(localNames, 'productNameEn')
      ? localNames.productNameEn
      : detail && detail.productNameEn || '');
    const chinese = ensureLanguage(1, cn);
    if (cn !== '') chinese.product_name = productDevelopmentCleanText(cn, 180);
    const existingEnglish = languages.some((item) => Number(item && item.language_id) === 2);
    if (en || existingEnglish) {
      const english = ensureLanguage(2, en);
      if (en !== '') english.product_name = productDevelopmentCleanText(en, 180);
    }
    return languages;
  }

  function productDevelopmentBuildProductDetailPayload(detail, task) {
    const source = detail && detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    const sku = productDevelopmentCleanText(detail && detail.sku || task && task.sku, 100).toUpperCase();
    const productId = productDevelopmentApiNumber(detail && detail.productId || source.product_id, null);
    if (productId === null) throw new Error('当前项目尚未建品，PLM 暂无可保存的产品 ID，请先在 PLM 建品页完成建品');
    const attrValues = Array.isArray(detail && detail.productAttrValues)
      ? detail.productAttrValues
      : [];
    if (!attrValues.length) throw new Error('未读取到完整建品字段，请先刷新当前 SKU 详情后再保存');
    const missing = productDevelopmentProductDetailMissingFields(detail);
    if (missing.length) throw new Error('请先补充建品必填项：' + missing.join('、'));
    const infoValue = (key, fallback) => source[key] !== undefined && source[key] !== null && source[key] !== ''
      ? productDevelopmentCloneValue(source[key])
      : productDevelopmentCloneValue(fallback);
    const product = {
      language_config: productDevelopmentProductDetailLanguageConfig(detail, task),
      product_id: productId,
      code: infoValue('code', sku),
      product_type: infoValue('product_type', infoValue('type', 1)),
      same_style_code: infoValue('same_style_code', null),
      is_AMZ: infoValue('is_AMZ', false),
      brand_id: infoValue('brand_id', null),
      category_id: infoValue('category_id', productDevelopmentApiNumber(detail && detail.categoryId || task && task.categoryId, null)),
      product_group_id: infoValue('product_group_id', productDevelopmentApiNumber(detail && detail.productGroupId || task && task.productGroupId, null)),
      product_main_group_id: infoValue('product_main_group_id', null),
      jst_old_code: infoValue('jst_old_code', sku),
      virtual_classification: infoValue('virtual_classification', 1),
      financial_settlement_classification: infoValue('financial_settlement_classification', 1),
      basic_unit_id: infoValue('basic_unit_id', 11),
      basic_unit_name: infoValue('basic_unit_name', 'pcs'),
      purchase_unit_id: infoValue('purchase_unit_id', infoValue('basic_unit_id', 11)),
      purchase_unit_name: infoValue('purchase_unit_name', infoValue('basic_unit_name', 'pcs')),
      sale_unit_id: infoValue('sale_unit_id', infoValue('basic_unit_id', 11)),
      sale_unit_name: infoValue('sale_unit_name', infoValue('basic_unit_name', 'pcs')),
      purchase_conversion: infoValue('purchase_conversion', 1),
      sale_conversion: infoValue('sale_conversion', 1),
      style_code: infoValue('style_code', sku),
      is_SRS: infoValue('is_SRS', false),
      srs_code: infoValue('srs_code', null),
      data_source: infoValue('data_source', 0),
      srs_product_code: infoValue('srs_product_code', sku),
      srs_store_information: infoValue('srs_store_information', null),
      srs_store_supplier: infoValue('srs_store_supplier', null),
      product_version_id: infoValue('product_version_id', productDevelopmentApiNumber(detail && detail.productVersionId, null)),
      procurement_price: infoValue('procurement_price', productDevelopmentProductDetailFieldValue(detail, 'procurement_rice') || null),
      invoice_category: infoValue('invoice_category', ''),
      invoice_item_name: infoValue('invoice_item_name', detail && detail.productNameCn || sku),
      product_procure_infos: infoValue('product_procure_infos', []),
      is_need_to_process_product_procure_infos: infoValue('is_need_to_process_product_procure_infos', true),
      attr_values: attrValues.map((item) => ({
        attr_id: Number(item && item.attr_id),
        language_id: Number(item && item.language_id || 1),
        value: productDevelopmentCloneValue(item && item.value),
      })).filter((item) => Number.isFinite(item.attr_id) && item.attr_id > 0),
    };
    if (!product.category_id) throw new Error('建品资料缺少分类 ID，无法保存到 PLM');
    return product;
  }

  async function productDevelopmentSaveProductDetailToPlm(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const task = getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {};
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) throw new Error('当前 SKU 详情还未读取完成');
    if (typeof fetchPlmApiJson !== 'function') throw new Error('当前脚本没有可用的 PLM 写入请求能力');
    const projectId = String(detail.projectId || task.projectId || task.rowId || '').trim();
    if (!/^\d+$/.test(projectId)) throw new Error('当前开发任务缺少有效项目 ID');
    productDevelopmentApplyProductDetailLocalValues(detail);
    const product = productDevelopmentBuildProductDetailPayload(detail, task);
    const response = await fetchPlmApiJson('/api/ChemicalNewDevTask/SaveProductDetail', {
      id: productDevelopmentApiNumber(projectId, projectId),
      product,
    }, { timeout: 120000 });
    const saved = response && response.data && typeof response.data === 'object' ? response.data : {};
    if (saved.id !== undefined && saved.id !== null) detail.productId = String(saved.id);
    if (saved.product_version_id !== undefined && saved.product_version_id !== null) detail.productVersionId = String(saved.product_version_id);
    detail.productInfo = {
      ...(detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {}),
      product_id: detail.productId || product.product_id,
      product_version_id: detail.productVersionId || product.product_version_id,
      category_id: product.category_id,
      code: product.code,
      language_config: product.language_config,
    };
    detail.productDetailDraftDirty = false;
    detail.productDetailSavedAt = new Date().toLocaleString();
    detail.productDetailSaveState = 'saved';
    detail.productDetailSaveMessage = '建品资料已保存到 PLM · ' + detail.productDetailSavedAt;
    detail.productDetailPlmSaveState = 'saved';
    detail.productDetailPlmSaveMessage = '建品资料已保存到 PLM';
    detail.cacheSource = 'local-cache';
    saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    return { response, product };
  }

  function productDevelopmentRunProductDetailPlmSave(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentProductSaveSku) return;
    if (typeof window.confirm === 'function' && !window.confirm('确认只将当前建品资料保存到 PLM？本次不会保存或修改 BOM。')) return;
    state.productDevelopmentProductSaveSku = normalizedSku;
    state.productDevelopmentStatus = '正在保存建品资料到 PLM…';
    state.productDevelopmentError = '';
    renderShell();
    productDevelopmentSaveProductDetailToPlm(normalizedSku).then(() => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      const message = detail && detail.productDetailPlmSaveMessage || '建品资料已保存到 PLM';
      state.productDevelopmentStatus = message;
      showToast(message);
    }).catch((error) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      if (detail) {
        detail.productDetailPlmSaveState = 'error';
        detail.productDetailPlmSaveMessage = '保存建品资料失败：' + formatErrorMessage(error);
        detail.cacheSource = 'local-cache';
        scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      }
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentProductSaveSku = '';
      renderShell();
    });
  }

  function productDevelopmentDomWait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function productDevelopmentDomText(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\s+/g, ' ')
      .replace(/\s*([\/／>＞|])\s*/g, '$1')
      .trim();
  }

  function productDevelopmentDomVisible(element) {
    if (!element || !element.isConnected) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = element.getBoundingClientRect();
    return Boolean(rect.width || rect.height);
  }

  function productDevelopmentDomNativeSetter(element, value, events) {
    if (!element || element.type === 'file') return false;
    const stringValue = String(value === null || value === undefined ? '' : value);
    const prototype = element instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(element, stringValue);
    else element.value = stringValue;
    (Array.isArray(events) ? events : ['input', 'change', 'blur']).forEach((type) => element.dispatchEvent(new Event(type, { bubbles: true })));
    return true;
  }

  function productDevelopmentDomSelectedText(input) {
    const container = input && input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    if (!container) return productDevelopmentDomText(input && input.value);
    const items = Array.from(container.querySelectorAll('.ant-select-selection-item, .ant-cascader-picker-label')).filter(productDevelopmentDomVisible);
    const values = items.map((item) => {
      const content = item.querySelector('.ant-select-selection-item-content');
      return productDevelopmentDomText(item.getAttribute('title') || content && content.textContent || item.textContent);
    }).filter(Boolean);
    return values.join(' / ') || productDevelopmentDomText(input && input.value);
  }

  function productDevelopmentDomClickTarget(input) {
    if (!input) return null;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    return container && (container.querySelector('.ant-select-selector, .ant-cascader-picker') || container) || input;
  }

  function productDevelopmentDomActivateTarget(target, focusTarget) {
    if (!target) return false;
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
    const eventOptions = { bubbles: true, cancelable: true, composed: true, button: 0, buttons: 1 };
    target.dispatchEvent(new MouseEvent('mousedown', eventOptions));
    target.dispatchEvent(new MouseEvent('mouseup', { ...eventOptions, buttons: 0 }));
    target.click();
    return true;
  }

  function productDevelopmentDomOptionText(option) {
    if (!option) return '';
    const content = option.querySelector('.ant-select-item-option-content, .ant-cascader-menu-item-content');
    return productDevelopmentDomText(option.getAttribute('title') || option.getAttribute('aria-label') || content && content.textContent || option.textContent);
  }

  function productDevelopmentDomCategoryTextVariants(value) {
    const text = productDevelopmentDomText(value);
    const variants = new Set(text ? [text] : []);
    if (text === '食物酒水') variants.add('食品酒水');
    if (text === '食品酒水') variants.add('食物酒水');
    return Array.from(variants);
  }

  function productDevelopmentDomCascaderTextMatches(candidate, wanted) {
    const wantedVariants = productDevelopmentDomCategoryTextVariants(wanted);
    return productDevelopmentDomCategoryTextVariants(candidate).some((candidateText) => wantedVariants.some((wantedText) => (
      candidateText === wantedText || candidateText.endsWith(wantedText)
    )));
  }

  function productDevelopmentDomVisibleDropdowns() {
    return Array.from(document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden), .ant-cascader-dropdown'))
      .filter(productDevelopmentDomVisible);
  }

  function productDevelopmentDomVisibleCascaderMenus() {
    return productDevelopmentDomVisibleDropdowns()
      .filter((dropdown) => dropdown.classList.contains('ant-cascader-dropdown') || dropdown.querySelector('.ant-cascader-menu'))
      .flatMap((dropdown) => Array.from(dropdown.querySelectorAll('.ant-cascader-menu')).filter(productDevelopmentDomVisible));
  }

  function productDevelopmentDomCascaderMenuOptions(menu) {
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('.ant-cascader-menu-item, [role="menuitem"]'))
      .filter(productDevelopmentDomVisible)
      .filter((option) => option.getAttribute('aria-disabled') !== 'true' && !option.classList.contains('ant-cascader-menu-item-disabled'));
  }

  function productDevelopmentDomRecordCascaderOptions(stage) {
    const record = productDevelopmentDomVisibleCascaderMenus().map((menu, index) => ({
      column: index + 1,
      stage: String(stage || ''),
      options: productDevelopmentDomCascaderMenuOptions(menu).map((option) => ({
        text: productDevelopmentDomOptionText(option),
        id: option.getAttribute('data-id') || option.getAttribute('data-value') || option.getAttribute('value') || '',
        title: option.getAttribute('title') || '',
        hasChildren: option.classList.contains('ant-cascader-menu-item-expand') || Boolean(option.querySelector('.ant-cascader-menu-item-expand-icon')),
      })).filter((item) => item.text),
    })).filter((item) => item.options.length);
    if (record.length) {
      const detail = record.map((item) => '第' + item.column + '列：' + item.options.map((option) => option.text).join('、')).join(' | ');
      const key = String(stage || '') + '|' + detail;
      if (!productDevelopmentCategoryOptionRecordKeys.has(key)) {
        productDevelopmentCategoryOptionRecordKeys.add(key);
        productDevelopmentLog('info', '记录 PLM 类目选项', (stage ? String(stage) + ' | ' : '') + detail);
      }
    }
    return record;
  }

  async function productDevelopmentLoadCategoryOptions(parentId) {
    const key = String(parentId === undefined || parentId === null ? 0 : parentId);
    if (productDevelopmentCategoryOptionsCache[key]) return productDevelopmentCategoryOptionsCache[key];
    const payload = await fetchPlmJson('/api/ProjectFormData/GetCategorySelectOptionNew?types=1&parent_id=' + encodeURIComponent(key));
    const nodes = productDevelopmentReadonlyList(payload).map((node) => ({
      id: String(node && node.id || '').trim(),
      parentId: String(node && node.parent_id === undefined ? key : node.parent_id || '').trim(),
      name: productDevelopmentDomText(node && node.name),
      children: Array.isArray(node && node.children) ? node.children : [],
    })).filter((node) => node.id && node.name);
    productDevelopmentCategoryOptionsCache[key] = nodes;
    if (nodes.length) productDevelopmentLog('info', '读取 PLM 类目接口选项', 'parent_id=' + key + ' | ' + nodes.map((node) => node.name + '(' + node.id + ')').join('、'));
    return nodes;
  }

  async function productDevelopmentResolveCascaderSegments(input, target) {
    const directSegments = productDevelopmentDomCascaderSegments(input, target);
    const rawSegments = productDevelopmentPrefillText(target, 800).split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    if (!input || input.id !== 'form_item_category_id') return directSegments;
    const categorySegments = rawSegments[0] === '成品' ? rawSegments.slice(1) : rawSegments;
    if (categorySegments.length !== 1) return directSegments;
    const wanted = productDevelopmentDomText(categorySegments[0]);
    if (!wanted) return directSegments;
    const queue = [{ parentId: '0', path: [] }];
    const visited = new Set();
    while (queue.length && visited.size < 160) {
      const current = queue.shift();
      const parentKey = String(current.parentId);
      if (visited.has(parentKey)) continue;
      visited.add(parentKey);
      let nodes = [];
      try {
        nodes = await productDevelopmentLoadCategoryOptions(parentKey);
      } catch (error) {
        productDevelopmentLog('warn', '读取 PLM 类目选项失败', parentKey + ' | ' + formatErrorMessage(error));
        continue;
      }
      nodes.forEach((node) => {
        const path = current.path.concat(node.name);
        if (productDevelopmentDomCascaderTextMatches(node.name, wanted)) {
          queue.length = 0;
          queue.push({ parentId: '__resolved__', path });
          return;
        }
        if (Number(node.id) > 0 && (node.children.length || path.length < 4)) queue.push({ parentId: node.id, path });
      });
      const resolved = queue.find((item) => item.parentId === '__resolved__');
      if (resolved) return resolved.path;
    }
    return directSegments;
  }

  async function productDevelopmentDomWaitForCascaderOption(segment, columnIndex, timeout, stage) {
    const option = await waitFor(() => {
      const menus = productDevelopmentDomVisibleCascaderMenus();
      productDevelopmentDomRecordCascaderOptions(stage || '第' + (columnIndex + 1) + '列');
      const menu = menus[columnIndex] || menus[menus.length - 1];
      if (!menu) return null;
      const wanted = productDevelopmentDomText(segment);
      return productDevelopmentDomCascaderMenuOptions(menu).find((item) => productDevelopmentDomCascaderTextMatches(productDevelopmentDomOptionText(item), wanted))
        || null;
    }, timeout || 10000, 100);
    if (!option) throw new Error('PLM 类目第' + (columnIndex + 1) + '列找不到“' + segment + '”');
    return option;
  }

  function productDevelopmentDomDropdownOpen(input) {
    const container = input && input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    return Boolean(input && input.getAttribute('aria-expanded') === 'true'
      || container && (container.classList.contains('ant-select-open') || container.classList.contains('ant-cascader-picker-open')));
  }

  async function productDevelopmentDomOpenDropdown(input) {
    const container = input && input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const targets = [
      input,
      productDevelopmentDomClickTarget(input),
      container && container.querySelector('.ant-select-arrow, .ant-cascader-picker-arrow'),
    ].filter((target, index, list) => target && list.indexOf(target) === index);
    for (const target of targets) {
      productDevelopmentDomActivateTarget(target, input);
      const opened = await waitFor(() => productDevelopmentDomDropdownOpen(input) && productDevelopmentDomVisibleDropdowns().length > 0, 1800, 80);
      if (opened) return true;
    }
    return false;
  }

  function productDevelopmentDomVisibleOptions() {
    const selectors = [
      '.ant-select-item-option',
      '[role="option"]',
      '.ant-cascader-menu-item',
    ];
    const seen = new Set();
    const dropdowns = productDevelopmentDomVisibleDropdowns();
    return dropdowns.flatMap((dropdown) => selectors.flatMap((selector) => Array.from(dropdown.querySelectorAll(selector)))).filter((option) => {
      if (seen.has(option) || !productDevelopmentDomVisible(option)) return false;
      seen.add(option);
      return option.getAttribute('aria-disabled') !== 'true' && !option.classList.contains('ant-select-item-option-disabled');
    });
  }

  function productDevelopmentDomFindOption(target) {
    const wanted = productDevelopmentDomText(target);
    const options = productDevelopmentDomVisibleOptions();
    return options.find((option) => productDevelopmentDomOptionText(option) === wanted)
      || options.find((option) => productDevelopmentDomOptionText(option).endsWith(wanted))
      || options.find((option) => productDevelopmentDomOptionText(option).includes(wanted));
  }

  function productDevelopmentDomFindExactOption(target) {
    const wanted = productDevelopmentDomText(target);
    return productDevelopmentDomVisibleOptions().find((option) => productDevelopmentDomOptionText(option) === wanted);
  }

  function productDevelopmentDomSelectionMatches(input, target) {
    const current = productDevelopmentDomText(productDevelopmentDomSelectedText(input));
    const wanted = productDevelopmentDomText(target);
    return Boolean(current && wanted && (current === wanted || current.includes(wanted)));
  }

  function productDevelopmentDomCascaderSegments(input, target) {
    const segments = productDevelopmentPrefillText(target, 800).split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    if (!segments.length) return segments;
    if (input && input.id === 'form_item_category_id' && segments[0] !== '成品') segments.unshift('成品');
    if (input && input.id === 'product_group_id' && !['成品（新品）', '成品（定制品）'].includes(segments[0])) segments.unshift('成品（新品）');
    return segments;
  }

  async function productDevelopmentDomWaitForOption(target, timeout) {
    const option = await waitFor(() => productDevelopmentDomFindOption(target), timeout || 6000, 100);
    if (!option) throw new Error('PLM 下拉中找不到“' + target + '”');
    return option;
  }

  async function productDevelopmentDomSelectOption(input, target, control) {
    if (!input) throw new Error('未找到 PLM 下拉控件');
    const wanted = productDevelopmentPrefillText(target, 800);
    if (!wanted) throw new Error('下拉字段缺少填写值');
    if (productDevelopmentDomSelectionMatches(input, wanted)) return;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const clear = container && container.querySelector('.ant-select-clear, .ant-cascader-picker-clear');
    if (clear && productDevelopmentDomVisible(clear)) clear.click();
    if (control === 'search-select' && !input.readOnly && input.type !== 'file') {
      input.focus();
      productDevelopmentDomNativeSetter(input, wanted, ['input']);
    }
    const opened = await productDevelopmentDomOpenDropdown(input);
    if (!opened) throw new Error('PLM 下拉未能展开');
    if (control === 'cascader') {
      const segments = await productDevelopmentResolveCascaderSegments(input, wanted);
      for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const option = await productDevelopmentDomWaitForCascaderOption(segment, index, 12000, segments.slice(0, index + 1).join(' / '));
        productDevelopmentDomActivateTarget(option);
        if (index < segments.length - 1) {
          await waitFor(() => {
            const menus = productDevelopmentDomVisibleCascaderMenus();
            productDevelopmentDomRecordCascaderOptions(segments.slice(0, index + 1).join(' / '));
            const nextMenu = menus[index + 1] || menus[menus.length - 1];
            if (!nextMenu) return false;
            const wantedNext = productDevelopmentDomText(segments[index + 1]);
            return productDevelopmentDomCascaderMenuOptions(nextMenu).some((item) => {
              const text = productDevelopmentDomOptionText(item);
              return productDevelopmentDomCascaderTextMatches(text, wantedNext);
            });
          }, 12000, 100);
          await productDevelopmentDomWait(80);
        }
      }
    } else if (control === 'search-select') {
      if (input.readOnly || input.type === 'file') throw new Error('PLM 搜索下拉不可输入');
      input.focus();
      productDevelopmentDomNativeSetter(input, wanted, ['input']);
      const option = await waitFor(() => productDevelopmentDomFindExactOption(wanted), 8000, 100);
      if (!option) throw new Error('PLM 搜索结果中找不到“' + wanted + '”');
      option.click();
    } else {
      if (!input.readOnly && input.type !== 'file') {
        productDevelopmentDomNativeSetter(input, wanted, ['input']);
      }
      const option = await productDevelopmentDomWaitForOption(wanted, 8000);
      option.click();
    }
    const confirmed = await waitFor(() => productDevelopmentDomSelectionMatches(input, wanted), 5000, 100);
    if (!confirmed) throw new Error('PLM 未确认选中“' + wanted + '”');
  }

  function productDevelopmentDomFindButton(label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from(document.querySelectorAll('button')).find((button) => productDevelopmentDomVisible(button) && productDevelopmentDomText(button.textContent) === wanted)
      || Array.from(document.querySelectorAll('button')).find((button) => productDevelopmentDomVisible(button) && productDevelopmentDomText(button.textContent).includes(wanted));
  }

  async function productDevelopmentDomEnsureEnglishLanguage() {
    const englishInput = () => {
      const input = document.getElementById('product_name1');
      return input && productDevelopmentDomVisible(input) ? input : null;
    };
    if (englishInput()) return false;
    const button = Array.from(document.querySelectorAll('button')).find((item) => (
      productDevelopmentDomVisible(item) && productDevelopmentDomText(item.textContent) === '英语(美国)'
    ));
    if (!button) throw new Error('页面1未找到“英语(美国)”语言按钮');
    const alreadySelected = Boolean(button.querySelector('.showCheckIcon'));
    if (!alreadySelected) button.click();
    const mounted = await waitFor(englishInput, 10000, 100);
    if (!mounted) throw new Error('点击“英语(美国)”后英文表单未出现');
    return !alreadySelected;
  }

  function productDevelopmentBomDomDrawer(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (typeof getProjectBomDrawerForSku === 'function') {
      const drawer = getProjectBomDrawerForSku(normalizedSku);
      if (drawer) return drawer;
    }
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(productDevelopmentDomVisible)
      .find((drawer) => {
        const text = productDevelopmentDomText(drawer.textContent);
        return /绑定BOM|绑BOM/.test(text) && (!normalizedSku || text.includes(normalizedSku));
      }) || null;
  }

  function productDevelopmentBomDomActiveEditor(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.cardBox, .materialEditList, .card'))
      .filter(productDevelopmentDomVisible)
      .find((card) => {
        const input = card.querySelector('#form_item_name');
        return input && productDevelopmentDomVisible(input) && card.querySelector('form');
      }) || null;
  }

  function productDevelopmentBomDomButton(scope, label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from((scope || document).querySelectorAll('button'))
      .filter(productDevelopmentDomVisible)
      .find((button) => productDevelopmentDomText(button.textContent) === wanted) || null;
  }

  function productDevelopmentBomDomMenuItem(label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from(document.querySelectorAll('.ant-dropdown-menu-item, [role="menuitem"]'))
      .filter(productDevelopmentDomVisible)
      .find((item) => productDevelopmentDomText(item.textContent) === wanted) || null;
  }

  async function productDevelopmentBomDomSelectCategory(input, target, options) {
    const wanted = productDevelopmentPrefillText(target, 800);
    const force = Boolean(options && options.force);
    if (!input || !wanted) throw new Error('物料分类缺少填写值');
    if (!force && productDevelopmentDomSelectionMatches(input, wanted)) return;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const clear = container && container.querySelector('.ant-select-clear, .ant-cascader-picker-clear');
    if (clear && productDevelopmentDomVisible(clear)) {
      clear.click();
      await productDevelopmentDomWait(80);
    }
    const opened = await productDevelopmentDomOpenDropdown(input);
    if (!opened) throw new Error('物料分类下拉未能展开');
    const segments = wanted.split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const segment = segments[segmentIndex];
      const option = await productDevelopmentDomWaitForCascaderOption(segment, segmentIndex, 12000, segments.slice(0, segmentIndex + 1).join(' / '));
      productDevelopmentDomActivateTarget(option);
      if (segmentIndex < segments.length - 1) {
        const nextSegment = segments[segmentIndex + 1];
        const nextMenuReady = await waitFor(() => {
          const menus = productDevelopmentDomVisibleCascaderMenus();
          productDevelopmentDomRecordCascaderOptions(segments.slice(0, segmentIndex + 1).join(' / '));
          const nextMenu = menus[segmentIndex + 1] || menus[menus.length - 1];
          if (!nextMenu) return false;
          const wantedNext = productDevelopmentDomText(nextSegment);
          return productDevelopmentDomCascaderMenuOptions(nextMenu).some((item) => {
            const text = productDevelopmentDomOptionText(item);
            return text === wantedNext || text.endsWith(wantedNext);
          });
        }, 12000, 100);
        if (!nextMenuReady) throw new Error('PLM 物料分类下一层“' + nextSegment + '”未加载');
      }
    }
    const selected = await waitFor(() => productDevelopmentDomSelectionMatches(input, wanted) || !productDevelopmentDomDropdownOpen(input), 5000, 100);
    if (!force && !selected) throw new Error('PLM 未确认物料分类“' + wanted + '”');
  }

  function productDevelopmentBomDomKindLabel(kind) {
    return kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '说明书';
  }

  function productDevelopmentBomDomMenuLabel(kind) {
    return kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '印刷';
  }

  function productDevelopmentBomDomProductSearch(drawer) {
    if (!drawer) return null;
    const input = Array.from(drawer.querySelectorAll('input[placeholder="搜索成品编码"]'))
      .find(productDevelopmentDomVisible);
    if (!input) return null;
    return {
      input,
      scope: input.closest('.cardBox, .materialEditList, .card') || input.parentElement || drawer,
    };
  }

  function productDevelopmentBomDomHasProductCode(drawer, code) {
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    if (!drawer || !normalizedCode) return false;
    return Array.from(drawer.querySelectorAll('.cardBox'))
      .filter(productDevelopmentDomVisible)
      .filter((card) => !card.querySelector('input[placeholder="搜索成品编码"]'))
      .some((card) => productDevelopmentDomText(card.textContent).includes(normalizedCode));
  }

  async function productDevelopmentBomDomSearchProduct(drawer, code) {
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    if (!normalizedCode) return false;
    if (productDevelopmentBomDomActiveEditor(drawer) || productDevelopmentBomDomProductSearch(drawer)) {
      throw new Error('PLM 当前还有未确认的物料或成品搜索行，请先确定或取消后再试');
    }
    const addButton = productDevelopmentBomDomButton(drawer, '添加物料');
    if (!addButton) throw new Error('当前绑定 BOM 抽屉未找到“添加物料”按钮');
    addButton.click();
    const menuItem = await waitFor(() => productDevelopmentBomDomMenuItem('成品'), 5000, 100);
    if (!menuItem) throw new Error('添加物料菜单未找到“成品”');
    menuItem.click();
    const search = await waitFor(() => productDevelopmentBomDomProductSearch(drawer), 8000, 120);
    if (!search || !search.input) throw new Error('PLM 未打开成品搜索表单');
    productDevelopmentDomNativeSetter(search.input, normalizedCode);
    await productDevelopmentDomWait(80);
    const searchButton = productDevelopmentBomDomButton(search.scope, '搜索') || productDevelopmentBomDomButton(drawer, '搜索');
    if (!searchButton) throw new Error('成品搜索表单未找到“搜索”按钮');
    searchButton.click();
    await productDevelopmentDomWait(300);
    return true;
  }

  function productDevelopmentBomDomCardMatches(drawer, kind, draft) {
    if (!drawer || !draft) return false;
    const materialName = productDevelopmentDomText(draft.materialName);
    return Array.from(drawer.querySelectorAll('.cardBox'))
      .filter(productDevelopmentDomVisible)
      .filter((card) => !card.querySelector('form #form_item_name'))
      .some((card) => {
        const text = productDevelopmentDomText(card.textContent);
        if (materialName && text.includes(materialName)) return true;
        if (kind === 'box') return /纸盒/.test(text) && /包材[\s/／>-]*纸盒/.test(text);
        if (kind === 'label') return /标签/.test(text) && /包材[\s/／>-]*标签/.test(text);
        return /说明书/.test(text);
      });
  }

  async function productDevelopmentBomDomOpenEditor(drawer, kind) {
    if (productDevelopmentBomDomActiveEditor(drawer)) throw new Error('PLM 当前还有未确认的物料行，请先确定或取消后再试');
    const addButton = productDevelopmentBomDomButton(drawer, '添加物料');
    if (!addButton) throw new Error('当前绑定 BOM 抽屉未找到“添加物料”按钮');
    addButton.click();
    const menuLabel = productDevelopmentBomDomMenuLabel(kind);
    const menuItem = await waitFor(() => productDevelopmentBomDomMenuItem(menuLabel), 5000, 100);
    if (!menuItem) throw new Error('添加物料菜单未找到“' + menuLabel + '”');
    menuItem.click();
    const editor = await waitFor(() => productDevelopmentBomDomActiveEditor(drawer), 8000, 120);
    if (!editor) throw new Error('PLM 未打开“' + menuLabel + '”物料表单');
    return editor;
  }

  async function productDevelopmentBomDomFillEditor(drawer, kind, draft) {
    let editor = await productDevelopmentBomDomOpenEditor(drawer, kind);
    const categoryInput = editor.querySelector('#form_item_category_id');
    if (!categoryInput) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到物料分类控件');
    await productDevelopmentBomDomSelectCategory(categoryInput, draft.categoryPath, { force: true });
    editor = productDevelopmentBomDomActiveEditor(drawer) || editor;
    const supplierInput = editor.querySelector('#form_item_default_supplier_id');
    if (!supplierInput) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到默认供应商控件');
    if (kind === 'instruction') {
      await productDevelopmentDomSelectOption(supplierInput, draft.supplier, 'select');
    }
    editor = productDevelopmentBomDomActiveEditor(drawer) || editor;
    const values = [
      ['form_item_name', draft.materialName, '物料名称', true],
      ['form_item_specification', draft.specification, '规格型号', true],
      ['form_item_long', kind === 'instruction' ? '' : draft.length, '长', kind !== 'instruction'],
      ['form_item_wide', kind === 'instruction' ? '' : draft.width, '宽', kind !== 'instruction'],
      ['form_item_high', kind === 'box' ? draft.height : '', '高', kind === 'box'],
      ['form_item_sale_price', draft.price, '采购价', true],
    ];
    values.forEach(([id, value, label, required]) => {
      const input = editor.querySelector('#' + id);
      if (!input) {
        if (required) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到“' + label + '”控件');
        return;
      }
      if (value !== '' && value !== null && value !== undefined) productDevelopmentDomNativeSetter(input, value);
    });
    const confirmButton = productDevelopmentBomDomButton(editor, '确定');
    if (!confirmButton) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到“确定”按钮');
    confirmButton.click();
    const confirmed = await waitFor(() => !productDevelopmentDomVisible(editor) || !editor.isConnected || productDevelopmentBomDomActiveEditor(drawer) !== editor, 12000, 120);
    if (!confirmed) {
      const validation = Array.from(editor.querySelectorAll('.ant-form-item-explain-error, [role="alert"]'))
        .map((node) => productDevelopmentDomText(node.textContent)).filter(Boolean).join('、');
      throw new Error(productDevelopmentBomDomKindLabel(kind) + '未能确认添加' + (validation ? '：' + validation : ''));
    }
  }

  async function productDevelopmentFillBomDrawer(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const task = getProductDevelopmentTaskBySku(normalizedSku) || state.productDevelopmentSelectedTask || {};
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) throw new Error('当前 SKU 详情还未读取完成');
    const taskMeta = getProductDevelopmentTaskMeta(task, detail);
    const reworkProductCode = productDevelopmentNormalizeReworkProductCode(taskMeta.reworkProductCode);
    productDevelopmentEnsureMaterialDrafts(detail, task);
    const drafts = [
      ['box', detail.materialDrafts.box],
      ['label', detail.materialDrafts.label],
      ['instruction', detail.materialDrafts.instruction],
    ].filter(([, draft]) => draft && draft.enabled !== false);
    const missing = drafts.flatMap(([kind, draft]) => productDevelopmentMaterialDraftMissingFields(kind, draft));
    if (missing.length) throw new Error('请先补充 BOM：' + missing.join('、'));
    let drawer = productDevelopmentBomDomDrawer(normalizedSku);
    if (!drawer && typeof ensureProjectBomDrawerForData === 'function') {
      drawer = await ensureProjectBomDrawerForData({
        sku: normalizedSku,
        projectId: detail.projectId || task.projectId || task.rowId || '',
        projectRowId: task.rowId || task.projectId || detail.projectId || '',
      });
    }
    if (!drawer) throw new Error('请先在 PLM 打开当前 SKU 的“绑定 BOM”抽屉');
    if (productDevelopmentBomDomActiveEditor(drawer) || productDevelopmentBomDomProductSearch(drawer)) throw new Error('PLM 当前还有未确认的物料或成品搜索行，请先确定或取消后再试');
    const added = [];
    const skipped = [];
    for (const [kind, draft] of drafts) {
      const title = productDevelopmentBomDomKindLabel(kind);
      if (productDevelopmentMaterialExistingRow(detail, kind) || productDevelopmentBomDomCardMatches(drawer, kind, draft)) {
        skipped.push(title);
        continue;
      }
      state.productDevelopmentStatus = '正在填入 PLM BOM：' + title + '…';
      await productDevelopmentBomDomFillEditor(drawer, kind, draft);
      added.push(title);
    }
    let searchedReworkProduct = '';
    if (reworkProductCode) {
      if (productDevelopmentBomDomHasProductCode(drawer, reworkProductCode)) {
        skipped.push('返工成品 ' + reworkProductCode);
      } else {
        state.productDevelopmentStatus = '正在搜索返工成品：' + reworkProductCode + '…';
        await productDevelopmentBomDomSearchProduct(drawer, reworkProductCode);
        searchedReworkProduct = reworkProductCode;
      }
    }
    if (!added.length && !searchedReworkProduct) throw new Error(skipped.length ? 'BOM 物料或返工成品已存在，未重复添加' : '没有启用的 BOM 物料可填写');
    const filledMessage = added.length ? '已填入 PLM 待保存行：' + added.join('、') : '';
    const reworkMessage = searchedReworkProduct ? '已搜索返工成品：' + searchedReworkProduct + '，请检查搜索结果' : '';
    const message = [filledMessage, reworkMessage, skipped.length ? '已跳过：' + skipped.join('、') : ''].filter(Boolean).join('；') + '。请核对后点击“批量保存”';
    detail.bomPlmSaveState = 'filled';
    detail.bomPlmSaveMessage = message;
    detail.cacheSource = 'local-cache';
    scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    return { added, skipped, message };
  }

  function productDevelopmentDomAvailableValues(definitions, valueReader) {
    return definitions.map((definition) => ({ definition, value: valueReader(definition) })).filter((item) => productDevelopmentPrefillText(item.value));
  }

  async function productDevelopmentFillPlmPage1(detail) {
    await productDevelopmentDomEnsureEnglishLanguage();
    const values = productDevelopmentDomAvailableValues(PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS, (definition) => productDevelopmentPage1FieldValue(detail, definition.key));
    const warnings = [];
    if (!values.length) return { warnings: ['悬浮助手页面1暂无可填写的数据'] };
    for (const item of values) {
      const definition = item.definition;
      const element = document.getElementById(definition.domId);
      if (!element) {
        warnings.push('页面1未找到“' + definition.label + '”控件');
        continue;
      }
      const value = productDevelopmentPrefillText(item.value, 800);
      try {
        if (definition.control) await productDevelopmentDomSelectOption(element, value, definition.control);
        else productDevelopmentDomNativeSetter(element, value);
      } catch (error) {
        warnings.push(definition.label + '：' + formatErrorMessage(error));
      }
    }
    return { warnings };
  }

  async function productDevelopmentFillPlmPage2(detail) {
    const values = productDevelopmentDomAvailableValues(PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS, (definition) => productDevelopmentPrefillProductFieldValue(detail, definition));
    const procurementValues = productDevelopmentDomAvailableValues(PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS, (definition) => productDevelopmentProcurementFieldValue(detail, definition.key));
    const warnings = [];
    if (!values.length && !procurementValues.length) return { warnings: ['悬浮助手页面2暂无可填写的数据'] };
    for (const item of values) {
      const definition = item.definition;
      const element = document.getElementById(definition.domId);
      if (!element) {
        warnings.push('页面2未找到“' + definition.label + '”控件');
        continue;
      }
      const value = productDevelopmentPrefillText(item.value, definition.type === 'textarea' ? 12000 : 800);
      try {
        if (definition.control) await productDevelopmentDomSelectOption(element, value, definition.control);
        else productDevelopmentDomNativeSetter(element, value);
      } catch (error) {
        warnings.push(definition.label + '：' + formatErrorMessage(error));
      }
    }
    if (procurementValues.length) {
      let supplierInput = document.getElementById(PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS[0].domId);
      if (!supplierInput) {
        const addRow = productDevelopmentDomFindButton('新增一行');
        if (addRow) {
          addRow.click();
          await productDevelopmentDomWait(180);
          supplierInput = document.getElementById(PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS[0].domId);
        }
      }
      if (!supplierInput) {
        warnings.push('采购明细暂无数据，也找不到“新增一行”按钮');
      } else {
        for (const item of procurementValues) {
          const definition = item.definition;
          const element = document.getElementById(definition.domId);
          if (!element) {
            warnings.push('采购明细未找到“' + definition.label + '”控件');
            continue;
          }
          const value = productDevelopmentPrefillText(item.value, 800);
          try {
            if (definition.control) await productDevelopmentDomSelectOption(element, value, definition.control);
            else productDevelopmentDomNativeSetter(element, value);
          } catch (error) {
            warnings.push(definition.label + '：' + formatErrorMessage(error));
          }
        }
      }
    }
    warnings.push('产品正面图、产品文案 DOCX 属于文件上传控件，请在 PLM 页面2手动检查并上传');
    return { warnings };
  }

  function productDevelopmentRunPlmDomFill(page, sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentDomFillSku) return;
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
    if (!detail) {
      showToast('当前 SKU 详情还未读取完成');
      return;
    }
    const normalizedPage = page === 'page2' ? 'page2' : 'page1';
    state.productDevelopmentDomFillSku = normalizedSku;
    state.productDevelopmentStatus = '正在填写 PLM ' + (normalizedPage === 'page1' ? '页面1' : '页面2') + '…';
    state.productDevelopmentError = '';
    renderShell();
    const runner = normalizedPage === 'page1' ? productDevelopmentFillPlmPage1 : productDevelopmentFillPlmPage2;
    Promise.resolve().then(() => runner(detail)).then((result) => {
      const baseMessage = normalizedPage === 'page1'
        ? '页面1已填写，请确认后在 PLM 点击下一步'
        : '页面2已填写，请检查文件并在 PLM 手动上传后保存';
      const warnings = result && Array.isArray(result.warnings) ? result.warnings : [];
      state.productDevelopmentStatus = warnings.length ? baseMessage + '；' + warnings.join('；') : baseMessage;
      showToast(state.productDevelopmentStatus);
    }).catch((error) => {
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentDomFillSku = '';
      renderShell();
    });
  }

  function productDevelopmentRunBomDomFill(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku || state.productDevelopmentBomDomFillSku) return;
    if (typeof window.confirm === 'function' && !window.confirm('确认把当前启用的纸盒、标签和说明书逐条填入 PLM“绑定 BOM”界面？如已填写返工产品编码，还会打开“成品”并执行搜索；脚本不会选择搜索结果或点击“批量保存”，请最后人工核对。')) return;
    state.productDevelopmentBomDomFillSku = normalizedSku;
    state.productDevelopmentStatus = '正在打开并填写 PLM BOM…';
    state.productDevelopmentError = '';
    renderShell();
    productDevelopmentFillBomDrawer(normalizedSku).then((result) => {
      const message = result && result.message || 'BOM 物料已填入 PLM 界面，请核对后批量保存';
      state.productDevelopmentStatus = message;
      showToast(message);
    }).catch((error) => {
      const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[normalizedSku];
      if (detail) {
        detail.bomPlmSaveState = 'error';
        detail.bomPlmSaveMessage = '填入 PLM 界面失败：' + formatErrorMessage(error);
        detail.cacheSource = 'local-cache';
        scheduleProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
      }
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    }).finally(() => {
      state.productDevelopmentBomDomFillSku = '';
      renderShell();
    });
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
      categoryId: String(value('category_id', 'categoryId')).trim(),
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
    const organizationDefault = productDevelopmentOrganizationDefaultForDefinition(definition, attr);
    let value = attr ? productDevelopmentReadonlyAttrValue(attr, 1) : '';
    let source = value !== '' && value !== null && value !== undefined ? 'PLM 建品详情' : '';
    if (!productDevelopmentReadonlyValueText(value, attr) && organizationDefault) {
      value = organizationDefault.displayValue;
      source = organizationDefault.source;
    }
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
        value,
        displayValue: productDevelopmentReadonlyValueText(value, attr),
        source: productDevelopmentReadonlyValueText(value, attr) ? 'PLM 建品详情' : '待人工填写',
        status: productDevelopmentReadonlyValueText(value, attr) ? '已预填' : '待补充',
        attr,
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
        value: productDevelopmentCloneValue(value),
        displayValue: productDevelopmentReadonlyValueText(value, attr),
        status: productDevelopmentReadonlyValueText(value, attr) ? '已读取' : '未读取',
        attr,
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
    const productNameEnSource = productDevelopmentCleanText((info.language_config || []).find((item) => Number(item && item.language_id) === 2)?.product_name || productSnapshot && productSnapshot.englishName, 180);
    const productNameEn = productDevelopmentIsEntryProductName(source.name) || productDevelopmentIsEntryProductName(productNameCn)
      ? 'Dietary Supplement'
      : productNameEnSource;
    const productId = String(info.product_id || source.productId || productSnapshot && productSnapshot.productId || '').trim();
    const productVersionId = String(info.product_version_id || source.productVersionId || productSnapshot && productSnapshot.productVersionId || '').trim();
    const productMainId = String(info.product_main_id || info.productMainId || source.productMainId || source.product_main_id || productSnapshot && (productSnapshot.productMainId || productSnapshot.product_main_id) || (bomRows.find((row) => row.type === '成品') || {}).productMainId || '').trim();
    const productInfo = productDevelopmentCloneValue(info) || {};
    const productAttrValues = productDevelopmentProductAttrValuesFromAttrs(attrs);
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
      productGroupId: String(info.product_group_id || source.productGroupId || productSnapshot && productSnapshot.productGroupId || '').trim(),
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
      organizationDefaults: productDevelopmentOrganizationDefaults(attrs),
      priceFields: productDevelopmentReadonlyPriceFields(attrs, info, []),
      attachments: productDevelopmentReadonlyAttachmentFields(attrs),
      bomRows,
      materialDrafts: productDevelopmentNormalizeMaterialDrafts(null, materialDraftDetail, source),
      productInfo,
      productAttrValues,
      productDetailLocalValues: {},
      productDetailLocalNames: {},
      productDetailLocalPage1: {},
      productDetailLocalProcurement: {},
      productDevelopmentReworkLookup: {
        status: 'idle',
        code: '',
        message: '',
        updatedAt: 0,
        data: null,
      },
      productDetailDraftDirty: false,
      productDetailSaveState: '',
      productDetailSaveMessage: '',
      productDetailPlmSaveState: '',
      productDetailPlmSaveMessage: '',
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

  function productDevelopmentPrefillFieldHtml(field, formSku, value) {
    const inputValue = productDevelopmentPrefillText(value, field && field.type === 'textarea' ? 12000 : 800);
    const missing = !inputValue;
    const isTextarea = field && field.type === 'textarea';
    const inputType = field && field.type === 'number' ? 'number' : 'text';
    const inputAttributes = ' class="pfh-product-development-form-input" data-form-sku="' + escapeHtml(formSku || '') + '" data-form-group="' + escapeHtml(field && field.formGroup || 'prefill') + '" data-form-key="' + escapeHtml(field && field.key || '') + '" data-form-control="' + escapeHtml(field && field.control || '') + '"' + (inputType === 'number' ? ' inputmode="decimal" step="any"' : '') + ' placeholder="' + escapeHtml(field && field.placeholder || (missing ? '填写' + String(field && field.label || '字段') : '')) + '"';
    const control = isTextarea
      ? '<textarea' + inputAttributes + ' rows="4" style="width:100%;min-height:82px;box-sizing:border-box;padding:8px 10px;border:1px solid var(--pfh-theme-border);border-radius:9px;outline:0;background:var(--pfh-theme-control-surface);color:var(--pfh-theme-text);font:inherit;font-size:11px;line-height:1.45;resize:vertical">' + escapeHtml(inputValue) + '</textarea>'
      : '<input type="' + inputType + '"' + inputAttributes + ' value="' + escapeHtml(inputValue) + '">';
    const hint = field && field.control === 'cascader'
      ? '<small>按 PLM 层级文字填写，层级之间用 / 分隔</small>'
      : field && field.control === 'select'
        ? '<small>填写 PLM 下拉选项显示文字</small>'
        : '';
    return '<label class="pfh-product-development-form-field' + (missing ? ' is-missing' : '') + '"><span>' + escapeHtml(field && field.label || '建品字段') + ' <i>需填写</i></span>' + control + hint + '</label>';
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
    const status = row && row.joinId ? '已绑定' : (productMainId ? '待保存' : '待绑定');
    const statusClass = status === '已绑定' ? ' is-ready' : (status === '待绑定' ? ' is-missing' : '');
    return '<article class="pfh-product-development-product-binding"><header><div><strong>成品绑定</strong><span>保存 BOM 时自动绑定当前产品</span></div><em class="' + statusClass + '">' + escapeHtml(status) + '</em></header><div class="pfh-product-development-binding-grid"><div><small>产品编码</small><b>' + escapeHtml(code || '待补充') + '</b></div><div><small>产品名称</small><b>' + escapeHtml(name || '待补充') + '</b></div><div><small>规格型号</small><b>' + escapeHtml(specification || '按 PLM 成品记录') + '</b></div></div><p>保存 BOM 时会自动保留当前产品绑定。</p></article>';
  }

  function productDevelopmentMaterialCardHtml(kind, draft, sku, baseName) {
    const isBox = kind === 'box';
    const isLabel = kind === 'label';
    const isInstruction = kind === 'instruction';
    const title = isBox ? '纸盒' : isLabel ? '标签' : '说明书';
    if (!draft || draft.enabled === false) {
      return '<article class="pfh-product-development-material-card is-disabled"><header><div class="pfh-product-development-material-card-title"><strong>' + escapeHtml(title) + '（本地不需要）</strong><span>已从本地物料填写中移除</span></div><button type="button" data-action="product-development-bom-toggle-material" data-bom-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-enabled="true">恢复' + escapeHtml(title) + '</button></header><p>已有 PLM 绑定不会自动删除；如需重新填写，可点击恢复。</p></article>';
    }
    const priceText = draft.price || (isInstruction ? '填写采购价' : '填写尺寸后自动计算');
    const dimensionFields = isInstruction
      ? ''
      : isBox
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
      : isLabel
        ? '<div class="pfh-product-development-material-defaults"><strong>标签默认规则</strong><span>圆弧 · 玻璃加粘 · 食品两年 · 用量 1</span></div>'
        : '<div class="pfh-product-development-material-defaults"><strong>说明书默认规则</strong><span>半成品 · 配件类 · 用量 1 · 不使用纸盒/标签尺寸计算</span></div>';
    const priceInput = isInstruction
      ? productDevelopmentMaterialInputHtml(sku, kind, 'price', '采购价（手动）', draft.price, { required: true, placeholder: '填写采购价' })
      : productDevelopmentMaterialInputHtml(sku, kind, 'price', '采购价（自动）', priceText, { readonly: true });
    const cardClass = 'pfh-product-development-material-card' + (isInstruction ? ' is-instruction' : '');
    const cardSubtitle = productDevelopmentCleanText(draft.materialName || baseName || sku, 180);
    return '<article class="' + cardClass + '" data-material-card="' + escapeHtml(kind) + '"><header><div class="pfh-product-development-material-card-title"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(cardSubtitle) + '</span></div><div class="pfh-product-development-material-card-actions"><em data-material-price-label="' + escapeHtml(kind) + '">采购价：' + escapeHtml(priceText) + (draft.price ? ' 元' : '') + '</em><button type="button" data-action="product-development-bom-toggle-material" data-bom-sku="' + escapeHtml(sku) + '" data-material-kind="' + escapeHtml(kind) + '" data-material-enabled="false">移除</button></div></header><div class="pfh-product-development-material-grid">' +
      productDevelopmentMaterialInputHtml(sku, kind, 'materialName', '物料名称', draft.materialName, { wide: true, required: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'categoryPath', '物料分类（默认）', draft.categoryPath, { readonly: true }) +
      productDevelopmentMaterialInputHtml(sku, kind, 'specification', '规格型号', draft.specification, { wide: isInstruction, required: true }) +
      dimensionFields +
      productDevelopmentMaterialInputHtml(sku, kind, 'supplier', '默认供应商', draft.supplier, { readonly: true }) +
      priceInput +
      '</div>' + calculatorOptions + '</article>';
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
    const bomDomFillBusy = state.productDevelopmentBomDomFillSku === formSku;
    const anyBomBusy = plmBusy || bomDomFillBusy;
    const plmStatus = detail.bomPlmSaveMessage ? '<p class="pfh-product-development-material-plm-status' + (detail.bomPlmSaveState === 'error' ? ' is-error' : ' is-saved') + '">' + escapeHtml(detail.bomPlmSaveMessage) + '</p>' : '';
    const existingBom = '<section class="pfh-product-development-form-section pfh-product-development-bom-existing"><h4>PLM 当前绑定 BOM（' + escapeHtml(String((detail.bomRows || []).length)) + ' 项）</h4>' + productDevelopmentReadonlyBomHtml(detail.bomRows || [], formSku) + '</section>';
    return '<section class="pfh-product-development-material-planner"><header><div><small>BOM 绑定</small><h3>填写 BOM 物料</h3></div><div class="pfh-product-development-material-header-actions"><span class="pfh-product-development-material-save-status' + saveStatusClass + '">' + escapeHtml(saveStatus) + '</span><button type="button" data-action="product-development-bom-save-local" data-bom-sku="' + escapeHtml(formSku) + '">保存本地</button><button type="button" class="is-primary" data-action="product-development-bom-fill-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (anyBomBusy ? ' disabled' : '') + '>' + (bomDomFillBusy ? '正在填入…' : '一键填入 PLM BOM') + '</button><button type="button" data-action="product-development-bom-save-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (anyBomBusy ? ' disabled' : '') + '>' + (plmBusy ? '正在保存…' : 'API 直接保存') + '</button></div></header><p class="pfh-product-development-material-note">纸盒和标签可按产品需要移除；说明书从“印刷”入口填写；返工产品编码有值时会从“成品”入口执行搜索。一键填入不会选择成品搜索结果或点击“批量保存”。</p>' + plmStatus + productDevelopmentFinishedProductBindingHtml(detail, task) + '<div class="pfh-product-development-material-list">' + productDevelopmentMaterialCardHtml('box', ensured.value.box, formSku, baseName) + productDevelopmentMaterialCardHtml('label', ensured.value.label, formSku, baseName) + productDevelopmentMaterialCardHtml('instruction', ensured.value.instruction, formSku, baseName) + '</div>' + existingBom + '</section>';
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
    const localNaming = state.productDevelopmentReview && state.productDevelopmentReview.sku === formSku
      ? productDevelopmentNormalizeProductNaming(state.productDevelopmentReview.productNaming)
      : null;
    const localNamingMeta = localNaming && (localNaming.chineseProductName || localNaming.englishProductName)
      ? '<span>本地建议中文名：<b>' + escapeHtml(localNaming.chineseProductName || '待补充') + '</b></span><span>本地建议英文名：<b>' + escapeHtml(localNaming.englishProductName || '待补充') + '</b></span>'
      : '';
    const sourceHint = detail.cacheSource === 'local-cache'
      ? '本地缓存 · 5分钟内免重复读取'
      : '已读取 PLM · 可本地填写 · 更新时间 ' + String(detail.loadedAt || '');
    const domFillBusy = state.productDevelopmentDomFillSku === formSku;
    const domFillDisabled = domFillBusy || productPlmBusy ? ' disabled' : '';
    const page1Fields = PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS.map((definition) => ({ ...definition, formGroup: 'page1' }));
    const page2Fields = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.map((definition) => ({ ...definition, formGroup: 'prefill' }));
    const procurementFields = PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS.map((definition) => ({ ...definition, formGroup: 'procurement' }));
    const renderFields = (fields, valueReader) => fields.map((field) => productDevelopmentPrefillFieldHtml(field, formSku, valueReader(field))).join('');
    const attachments = (detail.attachments || []).filter((item) => item && ['产品正面图', '产品文案 DOCX'].includes(String(item.label || '')));
    const attachmentSummary = attachments.length
      ? attachments.map((item) => '<span>' + escapeHtml(item.label) + '：' + escapeHtml(item.displayValue || item.status || '待手动上传') + '</span>').join('')
      : '<span>产品正面图、产品文案 DOCX：请在 PLM 页面 2 手动上传</span>';
    return '<section class="pfh-product-development-detail-form"><header><div><small>建品资料</small><h3>填写建品信息</h3></div><div class="pfh-product-development-material-header-actions"><span class="pfh-product-development-material-save-status' + productSaveStatusClass + '">' + escapeHtml(domFillBusy ? '正在填写 PLM…' : productSaveStatus) + '</span><button type="button" class="is-primary" data-action="product-development-product-fill-page1" data-product-sku="' + escapeHtml(formSku) + '"' + domFillDisabled + '>一键填写页面1</button><button type="button" class="is-primary" data-action="product-development-product-fill-page2" data-product-sku="' + escapeHtml(formSku) + '"' + domFillDisabled + '>一键填写页面2</button><button type="button" data-action="product-development-product-save-local" data-product-sku="' + escapeHtml(formSku) + '">保存本地</button><button type="button" data-action="product-development-product-save-plm" data-product-sku="' + escapeHtml(formSku) + '"' + (productPlmBusy ? ' disabled' : '') + '>' + (productPlmBusy ? '正在保存…' : '保存建品到 PLM') + '</button></div></header>' +
      '<div class="pfh-product-development-detail-banner"><strong>有值就填，空白字段会自动跳过。</strong><span>先在 PLM 页面 1 点击“页面1”，进入页面 2 后点击“页面2”；按钮只填写当前表单，不会自动点下一步或保存。</span><span>' + escapeHtml(sourceHint) + '</span>' + (detail.error ? '<em>' + escapeHtml(detail.error) + '</em>' : '') + '</div>' +
      productPlmStatus +
      (localNamingMeta ? '<div class="pfh-product-development-detail-meta">' + localNamingMeta + '</div>' : '') +
      '<section class="pfh-product-development-form-section"><h4>页面 1 · 建品基础信息（' + page1Fields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + renderFields(page1Fields, (field) => productDevelopmentPage1FieldValue(detail, field.key)) + '</div></section>' +
      '<section class="pfh-product-development-form-section"><h4>页面 2 · 产品详情（' + page2Fields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + renderFields(page2Fields, (field) => productDevelopmentPrefillProductFieldValue(detail, field)) + '</div></section>' +
      '<section class="pfh-product-development-form-section"><h4>页面 2 · 采购明细（' + procurementFields.length + ' 项）</h4><div class="pfh-product-development-form-grid">' + renderFields(procurementFields, (field) => productDevelopmentProcurementFieldValue(detail, field.key)) + '</div></section>' +
      '<section class="pfh-product-development-form-section"><h4>页面 2 · 文件上传</h4><div class="pfh-product-development-detail-meta">' + attachmentSummary + '</div><small class="pfh-product-development-form-note">产品正面图和产品文案 DOCX 属于浏览器文件控件，页面 2 按钮不会伪造文件路径；请在 PLM 中手动选择文件。</small></section></section>';
  }

  function productDevelopmentTaskLocalMetaHtml(task, detail) {
    const source = task || {};
    const meta = getProductDevelopmentTaskMeta(source, detail);
    const sku = String(source.sku || detail && detail.sku || '').trim().toUpperCase();
    const lookup = productDevelopmentReworkLookupState(detail);
    const lookupDisabled = !meta.reworkProductCode || lookup.status === 'loading' ? ' disabled' : '';
    const lookupLabel = lookup.status === 'loading' ? '正在查询…' : '查询返工资料';
    const input = (field, label, value, placeholder) => '<label>' + escapeHtml(label) + '<input type="text" class="pfh-product-development-task-meta-input" data-meta-sku="' + escapeHtml(sku) + '" data-meta-field="' + escapeHtml(field) + '" value="' + escapeHtml(value || '') + '" placeholder="' + escapeHtml(placeholder || '') + '"></label>';
    return '<section class="pfh-product-development-product-naming pfh-product-development-task-local-meta"><header><div><small>LOCAL PRODUCT DATA</small><h3>产品本地填写</h3></div><span>仅本地记录 · 不写入 PLM</span></header>' +
      '<div class="pfh-product-development-product-naming-grid">' +
      input('brand', '产品品牌', meta.brand, '填写产品品牌') +
      input('productNameCn', '产品中文名', meta.productNameCn, '填写产品中文名') +
      input('productNameEn', '产品英文名', meta.productNameEn, '填写产品英文名') +
      input('reworkProductCode', '返工产品编码', meta.reworkProductCode, '没有则留空') +
      '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-rework-lookup" data-product-sku="' + escapeHtml(sku) + '"' + lookupDisabled + '>' + lookupLabel + '</button><button type="button" data-action="product-development-task-meta-save">保存本地</button><small>' + escapeHtml(productDevelopmentReworkLookupStatusText(detail)) + '</small></div></section>';
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

  function productDevelopmentSyncMaterialDraftDom(sku, kind, draft) {
    const elements = productDevelopmentMaterialInputElements(sku, kind);
    const setValue = (field, value) => {
      const element = elements.find((item) => item.getAttribute('data-material-field') === field);
      if (element && element.value !== String(value === null || value === undefined ? '' : value)) element.value = String(value === null || value === undefined ? '' : value);
    };
    if (draft.nameSource !== 'manual') setValue('materialName', draft.materialName);
    if (draft.specificationSource !== 'manual') setValue('specification', draft.specification);
    const pricePlaceholder = kind === 'instruction' ? '填写采购价' : '填写尺寸后自动计算';
    setValue('price', draft.price || pricePlaceholder);
    const card = elements[0] && elements[0].closest('[data-material-card]');
    const priceLabel = card && card.querySelector('[data-material-price-label]');
    if (priceLabel) priceLabel.textContent = '采购价：' + (draft.price ? draft.price + ' 元' : pricePlaceholder);
  }

  function productDevelopmentHandleMaterialField(target) {
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
    loadProductDevelopmentTasks({ force: true }).then((rows) => {
      if (state.view !== 'productDevelopmentTasks') return;
      const selected = getProductDevelopmentTaskBySku(state.productDevelopmentTaskSelectedSku);
      const first = selected || (Array.isArray(rows) ? rows[0] : null);
      if (!first) return;
      if (!selected) selectProductDevelopmentTask(first.sku);
      else renderShell();
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

  async function loadProductDevelopmentSnapshot(sku, force, options) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const opts = options || {};
    const requireIngredients = opts.requireIngredients !== false;
    const includeImage = opts.includeImage !== false;
    const imageKind = includeImage ? (opts.imageKind === 'benchmark' ? 'benchmark' : 'product') : 'none';
    const preferCachedIngredients = Boolean(opts.preferCachedIngredients);
    if (!normalizedSku) throw new Error('请先在设计任务中选择一个 SKU');
    if (!force && state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === normalizedSku
      && state.productDevelopmentSnapshot.imageKind === imageKind
      && (!requireIngredients || Array.isArray(state.productDevelopmentSnapshot.ingredients) && state.productDevelopmentSnapshot.ingredients.length)) {
      productDevelopmentLog('info', '命中本次会话资料缓存', normalizedSku + ' | 成分=' + state.productDevelopmentSnapshot.ingredients.length + ' 项');
      return state.productDevelopmentSnapshot;
    }
    const seed = getProductDevelopmentSeedData(normalizedSku);
    const cachedIngredients = productDevelopmentCachedIngredientPairs(normalizedSku, seed);
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
    if (cachedIngredients.length) {
      productDevelopmentLog('success', '成分缓存命中，跳过重新识别', normalizedSku + ' | ' + cachedIngredients.length + ' 项');
    } else if (requireIngredients && !ingredients.length && typeof hydrateIngredientPdfForSku === 'function') {
      productDevelopmentLog('info', '未命中成分缓存，开始读取成分表', normalizedSku);
      const hydrated = await withCopywritingTimeout(
        hydrateIngredientPdfForSku(normalizedSku, { preferApi: true, silent: true }),
        120000,
        '成分表读取',
      ).catch((error) => {
        productDevelopmentLog('warn', '成分表读取失败', normalizedSku + ' | ' + formatErrorMessage(error));
        return null;
      });
      if (hydrated && hydrated.sku) data = normalizeData({ ...data, ...hydrated });
    }
    const resolvedIngredients = productDevelopmentIngredientPairs(data, {
      en: liveIngredients.product_ingredients_summary_en || plmCopywriting.ingredientSummary.en || data.ingredientEnglish,
      cn: liveIngredients.product_ingredients_summary_ch || plmCopywriting.ingredientSummary.cn || data.ingredientChinese,
    });
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
      brand: productDevelopmentCleanText(snapshot && snapshot.brand || data.brand, 160),
      productType: productDevelopmentCleanText(snapshot && snapshot.productType || data.productType || data.manualCategory, 180),
      productTypeCn: productDevelopmentCleanText(snapshot && snapshot.productTypeCn || data.productTypeCn, 180),
      netContent: productDevelopmentCleanText(snapshot && snapshot.netContent || data.netContent, 120).toUpperCase(),
      referenceUrl: productDevelopmentCleanText(snapshot && snapshot.referenceUrl || data.referenceUrl || data.benchmarkLink, 1000),
      ingredients: resolvedIngredients,
      ingredientEvidence,
      ingredientSummary: {
        en: productDevelopmentCleanText(liveIngredients.product_ingredients_summary_en || plmCopywriting.ingredientSummary.en || data.ingredientEnglish, 8000),
        cn: productDevelopmentCleanText(liveIngredients.product_ingredients_summary_ch || plmCopywriting.ingredientSummary.cn || data.ingredientChinese, 8000),
      },
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
    if (['fast-acting', 'quick relief', 'instant relief', 'zero risk', 'risk-free', 'no side effects'].includes(lower)) return 'daily use';
    if (['miracle', 'miraculous'].includes(lower)) return 'routine';
    return 'daily';
  }

  function productDevelopmentRewriteGeneratedCopyText(value, extraTerms) {
    let output = String(value || '')
      .replace(/\b(?:independently\s+)?tested\s+(?:in|by)\s+(?:an?\s+)?(?:independent\s+)?(?:third[- ]party\s+)?laborator(?:y|ies)\b/gi, 'designed for daily use')
      .replace(/\b(?:third[- ]party\s+)?lab[- ]tested\b/gi, 'designed for daily use')
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

  async function composeProductDevelopmentComparison(sourceDataUrl, items, snapshot) {
    const image = await loadImage(sourceDataUrl);
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const padding = 34;
    const columnGap = 22;
    const headerHeight = 94;
    const imageColumnWidth = Math.max(820, Math.min(1100, Math.max(820, iw)));
    const englishColumnWidth = 620;
    const translationColumnWidth = 760;
    const imageAreaWidth = imageColumnWidth - padding * 2;
    const imageAreaHeight = Math.max(820, Math.min(1700, ih * imageAreaWidth / iw));
    const displayItems = (Array.isArray(items) ? items : []).slice(0, 80);
    const englishTextWidth = englishColumnWidth - 92;
    const translationTextWidth = translationColumnWidth - 68;
    const bodyFont = '400 24px Arial, Microsoft YaHei, sans-serif';
    const bodyLineHeight = 30;
    const riskFont = '700 18px Arial, Microsoft YaHei, sans-serif';
    const riskLineHeight = 24;
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (!measureCtx) throw new Error('无法创建对照图测量画布');
    const rowHeights = displayItems.map((item, index) => {
      const isRisk = Array.isArray(item.riskTypes) && item.riskTypes.length;
      const riskLabel = '风险 · ' + item.riskTypes.join('、') + (Array.isArray(item.riskTerms) && item.riskTerms.length ? ' · ' + item.riskTerms.join('、') : '');
      measureCtx.font = riskFont;
      const riskLines = isRisk
        ? productDevelopmentCanvasTextLines(measureCtx, riskLabel, englishTextWidth, 2).length
        : 0;
      measureCtx.font = bodyFont;
      const sourceLines = productDevelopmentCanvasTextLines(measureCtx, item.sourceText || '（未读取到可靠原文）', englishTextWidth, 6).length;
      const replacementEnLines = productDevelopmentCanvasTextLines(measureCtx, item.replacementEn || item.sourceText, translationTextWidth, 6).length;
      const replacementZhLines = productDevelopmentCanvasTextLines(measureCtx, item.replacementZh || item.translationZh || item.sourceText, translationTextWidth, 6).length;
      const riskHeight = isRisk ? riskLines * riskLineHeight + 8 : 0;
      const leftHeight = sourceLines * bodyLineHeight;
      const rightHeight = replacementEnLines * bodyLineHeight + 8 + replacementZhLines * bodyLineHeight;
      return Math.max(68, Math.max(riskHeight + leftHeight, rightHeight)) + 14;
    });
    const contentHeight = Math.max(imageAreaHeight, rowHeights.reduce((total, value) => total + value, 0) + 24);
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
    const titleFont = '700 32px Arial, Microsoft YaHei, sans-serif';
    ctx.font = titleFont;
    ctx.fillStyle = '#172033';
    ctx.fillText('Benchmark Image / 对标图', imageX + 26, panelY + 27);
    ctx.fillText('English Original / 英文原文', englishX + 26, panelY + 27);
    ctx.fillText('Revised Copy / 改写与翻译', translationX + 26, panelY + 27);
    ctx.fillStyle = '#dbe4f1';
    ctx.fillRect(imageX + 26, panelY + 76, 78, 4);
    ctx.fillStyle = '#8b6ac8';
    ctx.fillRect(englishX + 26, panelY + 76, 78, 4);
    ctx.fillStyle = '#27a5a0';
    ctx.fillRect(translationX + 26, panelY + 76, 78, 4);
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
    let rowY = contentY + 18;
    displayItems.forEach((item, index) => {
      const isRisk = Array.isArray(item.riskTypes) && item.riskTypes.length;
      const rowTextX = englishX + 66;
      const rightTextX = translationX + 42;
      const riskLabel = '风险 · ' + item.riskTypes.join('、') + (Array.isArray(item.riskTerms) && item.riskTerms.length ? ' · ' + item.riskTerms.join('、') : '');
      const riskHeight = isRisk
        ? (() => {
          ctx.font = riskFont;
          return productDevelopmentCanvasTextLines(ctx, riskLabel, englishTextWidth, 2).length * riskLineHeight + 8;
        })()
        : 0;
      ctx.fillStyle = isRisk ? '#b42318' : '#718096';
      ctx.font = '700 16px Arial, Microsoft YaHei, sans-serif';
      ctx.fillText(String(index + 1).padStart(2, '0'), englishX + 26, rowY + 2);
      const riskLines = isRisk
        ? productDevelopmentWrapCanvasText(ctx, riskLabel, rowTextX, rowY, englishTextWidth, riskLineHeight, 2)
        : 0;
      const sourceY = rowY + riskHeight;
      const revisedY = rowY;
      ctx.fillStyle = '#2f415b';
      ctx.font = bodyFont;
      productDevelopmentWrapCanvasText(ctx, item.sourceText || '（未读取到可靠原文）', rowTextX, sourceY, englishTextWidth, bodyLineHeight, 6);
      ctx.fillStyle = '#8b6ac8';
      ctx.fillRect(translationX + 26, revisedY + 4, 4, 22);
      ctx.font = bodyFont;
      const replacementEnLines = productDevelopmentWrapCanvasText(ctx, item.replacementEn || item.sourceText, rightTextX, revisedY, translationTextWidth, bodyLineHeight, 6);
      const replacementZhY = revisedY + replacementEnLines * bodyLineHeight + 8;
      ctx.fillStyle = '#168b87';
      ctx.fillRect(translationX + 26, replacementZhY + 4, 4, 22);
      ctx.font = bodyFont;
      productDevelopmentWrapCanvasText(ctx, item.replacementZh || item.translationZh || item.sourceText, rightTextX, replacementZhY, translationTextWidth, bodyLineHeight, 6);
      ctx.fillStyle = '#e8edf4';
      ctx.fillRect(englishX + 22, rowY + (rowHeights[index] || 82) - 8, englishColumnWidth - 44, 1);
      ctx.fillRect(translationX + 22, rowY + (rowHeights[index] || 82) - 8, translationColumnWidth - 44, 1);
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
    ctx.fillText('SKU ' + String(snapshot && snapshot.sku || '') + ' · 对标图保留 · 原文 / 英文改写 / 中文翻译 · 坐标不可靠时不绘制红框 · 仅生成审核稿', padding, height - 27);
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

  function productDevelopmentFileDate() {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
  }

  function productDevelopmentSafeFileLabel(value, maxLength) {
    return String(value || '')
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[. ]+$/g, '')
      .slice(0, Math.max(1, Number(maxLength) || 120));
  }

  function productDevelopmentCopywritingFileName(snapshot) {
    const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
    const date = productDevelopmentFileDate();
    const brand = productDevelopmentSafeFileLabel(productDevelopmentCopywritingOutputBrand(source.brand), 60);
    let name = productDevelopmentSafeFileLabel(productDevelopmentCopywritingNameWithoutInternalBrand(source.name), 120);
    if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) name = name.slice(brand.length).trim();
    const productLabel = [brand, name].filter(Boolean).join(' ') || productDevelopmentSafeFileLabel(source.sku, 80) || '产品';
    return date + '-' + productLabel + '-产品文案.docx';
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
    state.productDevelopmentReviewEditorOpen = false;
    state.productDevelopmentReviewBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '正在读取当前 SKU 的对标图片…';
    renderShell();
    try {
      const snapshot = await loadProductDevelopmentSnapshot(sku, true, { requireIngredients: false, imageKind: 'benchmark' });
      state.productDevelopmentStatus = '正在提交一次图片风险分析…';
      renderShell();
      const image = await productDevelopmentFetchImage(snapshot.imageUrl, snapshot.imageFallbackUrl);
      const reviewBrand = productDevelopmentCleanText(snapshot.brand, 160);
      const reviewProductType = productDevelopmentCleanText(snapshot.productType, 180);
      const reviewAudienceText = [snapshot.name, reviewProductType].filter(Boolean).join(' ');
      const reviewSeed = getProductDevelopmentSeedData(sku);
      const reviewNetContent = productDevelopmentCleanText(snapshot.netContent || reviewSeed.netContent, 120).toUpperCase();
      const humanSupplement = productDevelopmentIsHumanSupplement({ ...snapshot, netContent: reviewNetContent }, '');
      const isKriathPet = /^kriath$/i.test(reviewBrand) && /(?:入口宠物|宠物|pet)/i.test(reviewProductType);
      const petAudience = isKriathPet
        ? /(?:猫|\bcat(?:s)?\b)/i.test(reviewAudienceText) && !/(?:狗|\bdog(?:s)?\b)/i.test(reviewAudienceText)
          ? 'FOR CATS'
          : /(?:狗|\bdog(?:s)?\b)/i.test(reviewAudienceText) && !/(?:猫|\bcat(?:s)?\b)/i.test(reviewAudienceText)
            ? 'FOR DOGS'
            : 'FOR DOGS & CATS'
        : '';
      const response = await cloudRequest('/ai-image/product-development-review', {
        method: 'POST',
        timeoutMs: 150000,
        body: {
          sku: snapshot.sku,
          name: snapshot.name,
          productType: snapshot.productType,
          category: snapshot.productType,
          brand: snapshot.brand,
          netContentStandard: reviewNetContent,
          humanSupplement,
          petAudience,
          ingredients: snapshot.ingredients,
          ingredientEvidence: snapshot.ingredientEvidence,
          sourceCopywriting: snapshot.sourceCopywriting,
          attributeEvidence: snapshot.attributeEvidence,
          claimEvidence: snapshot.claimEvidence,
          sourceEvidence: snapshot.sourceEvidence,
          origin: snapshot.origin,
          countryOfOrigin: snapshot.countryOfOrigin,
          madeIn: snapshot.madeIn,
          sellingPoints: snapshot.sourceCopywriting.sellingPoints,
          efficacy: snapshot.sourceCopywriting.efficacy,
          namingExamples: PRODUCT_DEVELOPMENT_NAME_EXAMPLES,
          reviewRuleVersion: PRODUCT_DEVELOPMENT_REVIEW_RULE_VERSION,
          namingRule: '英文产品名取对标图上清晰可见的产品主标题；如果产品名带有（入口），英文产品名固定填写 Dietary Supplement；中文产品名使用适用对象、朦胧作用/状态和剂型组合，不使用医疗、预防、治疗、绝对化或夸大表达。',
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
      const reviewResult = {
        id,
        sku: snapshot.sku,
        brand: reviewBrand,
        productType: reviewProductType,
        netContent: reviewNetContent,
        humanSupplement,
        sourceImageDataUrl: image.dataUrl,
        sourceImageName: state.productDevelopmentBenchmarkImageName,
        comparisonDataUrl: comparison.dataUrl,
        items: validated.items,
        extractedTexts: validated.extractedTexts,
        packagingBboxes: validated.packagingBboxes,
        warnings: validated.warnings,
        provider: validated.provider,
        model: validated.model,
        plainTextCopy: '',
        productNaming: validated.productNaming,
        fileName,
        createdAt: new Date().toLocaleString(),
      };
      reviewResult.plainTextCopy = productDevelopmentReviewCopyValue(reviewResult, 'revised');
      state.productDevelopmentReview = reviewResult;
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
    const list = Array.isArray(items) ? items : [];
    const riskCount = list.filter((item) => Array.isArray(item && item.riskTypes) && item.riskTypes.length).length;
    const warnings = result && Array.isArray(result.warnings)
      ? result.warnings.map((item) => productDevelopmentCompactSemanticText(item, 240)).filter(Boolean).slice(0, 12)
      : [];
    const warningHtml = warnings.length
      ? '<div class="pfh-product-development-review-editor-warnings"><strong>识别提醒</strong><div>' + warnings.map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</div></div>'
      : '';
    const rows = list.map((item, index) => {
      const isRisk = Array.isArray(item && item.riskTypes) && item.riskTypes.length;
      const actionLabel = item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove
        ? '删除禁词'
        : item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo
          ? '更换 Logo'
          : item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeCount
            ? '数量统一为 60'
            : item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeNetContent
              ? '统一净含量'
              : item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replacePhrase
                ? '替换表述'
            : '';
      const riskText = isRisk ? item.riskTypes.join('、') + (actionLabel ? ' · ' + actionLabel : '') : '';
      const riskReason = productDevelopmentCompactSemanticText(item && (item.riskReason || item.reason || item.warning), 400)
        || (Array.isArray(item && item.riskTerms) && item.riskTerms.length ? '识别到：' + item.riskTerms.join('、') : '请人工确认该文字是否需要替换。');
      const options = isRisk && Array.isArray(item && item.replacementOptions)
        ? item.replacementOptions.map((option) => ({
          en: productDevelopmentCompactSemanticText(option && (option.en || option.english || option.replacementEn), 300),
          zh: productDevelopmentCompactSemanticText(option && (option.zh || option.chinese || option.translation), 300),
        })).filter((option) => option.en || option.zh).slice(0, 3)
        : [];
      const optionHtml = isRisk
        ? '<div class="pfh-product-development-review-options' + (options.length ? '' : ' is-empty') + '"><small>建议替换备选</small>' + (options.length
          ? options.map((option) => '<div class="pfh-product-development-review-option"><span>' + escapeHtml(option.en || '—') + '</span><em>' + escapeHtml(option.zh || '—') + '</em></div>').join('')
          : '<span>暂无备选，请直接编辑右侧改写。</span>') + '</div>'
        : '';
      const riskHtml = isRisk
        ? '<div class="pfh-product-development-review-risk-detail"><strong>侵权提醒</strong><span>' + escapeHtml(riskReason) + '</span></div>' + optionHtml
        : '';
      const rowClass = isRisk ? ' is-risk' : ' is-clear';
      return '<article class="pfh-product-development-review-editor-row' + rowClass + '"><div class="pfh-product-development-review-editor-head"><b>' + String(index + 1).padStart(2, '0') + '</b>' +
        (isRisk ? '<span class="pfh-product-development-review-risk-badge">风险 · ' + escapeHtml(riskText) + '</span>' : '<span class="pfh-product-development-review-clear-badge">可保留</span>') +
        '<button type="button" aria-label="删除第 ' + (index + 1) + ' 个文字块" data-action="product-development-review-remove" data-review-index="' + index + '">×</button></div>' +
        '<div class="pfh-product-development-review-editor-columns"><textarea class="pfh-product-development-review-input is-original" data-review-index="' + index + '" data-review-field="sourceText" rows="2" aria-label="英文原文" placeholder="图片原文（可编辑）">' + escapeHtml(productDevelopmentCompactSemanticText(item && item.sourceText, 240)) + '</textarea>' +
        '<div class="pfh-product-development-review-editor-revised"><textarea class="pfh-product-development-review-input is-rewrite" data-review-index="' + index + '" data-review-field="replacementEn" rows="2" aria-label="英文改写" placeholder="English rewrite / 英文改写">' + escapeHtml(productDevelopmentCompactSemanticText(item && item.replacementEn, 300)) + '</textarea>' +
        '<textarea class="pfh-product-development-review-input is-translation" data-review-index="' + index + '" data-review-field="replacementZh" rows="2" aria-label="中文翻译" placeholder="中文翻译">' + escapeHtml(productDevelopmentCompactSemanticText(item && (item.replacementZh || item.translationZh), 300)) + '</textarea>' + riskHtml + '</div></div></article>';
    }).join('');
    const empty = rows ? '' : '<div class="pfh-product-development-result-empty">未检测到可靠风险文字，可手动添加需要核对的图片文字。</div>';
    const isOpen = Boolean(state.productDevelopmentReviewEditorOpen);
    return '<div class="pfh-product-development-review-editor-float' + (isOpen ? ' is-open' : '') + '" aria-hidden="' + (isOpen ? 'false' : 'true') + '"><button type="button" class="pfh-product-development-review-editor-backdrop" data-action="product-development-review-editor-close" aria-label="关闭编辑浮窗"></button><section class="pfh-product-development-review-editor" role="dialog" aria-modal="true" aria-label="图片文字编辑浮窗"><header><div><small>EDITABLE COPY</small><h3>图片文字紧凑校对</h3></div><span>' + list.length + ' 个文字块 · ' + riskCount + ' 个风险</span><button type="button" class="pfh-product-development-review-editor-close" data-action="product-development-review-editor-close" aria-label="关闭编辑浮窗">×</button></header>' +
      '<div class="pfh-product-development-review-editor-legend"><span><i class="is-original">原文</i> 可编辑</span><span><i class="is-rewrite">英文改写</i> 可编辑</span><span><i class="is-translation">中文翻译</i> 可编辑</span><small>语义块保留换行，不插入空行</small></div>' + warningHtml + empty +
      '<div class="pfh-product-development-review-editor-columns-head"><span>English Original / 英文原文</span><span><i class="is-rewrite">EN</i> Revised Copy · <i class="is-translation">中</i> 中文翻译</span></div>' +
      '<div class="pfh-product-development-review-editor-list">' + rows + '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-review-add">手动添加文字</button><button type="button" data-action="product-development-review-copy-all">复制全文</button><button type="button" data-action="product-development-review-copy-revised">复制修改后的文案</button><button type="button" data-action="product-development-review-recompose"' + (!result || state.productDevelopmentReviewBusy ? ' disabled' : '') + '>按修改重新生成对照图</button></div></section></div>';
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

  function productDevelopmentPlainTextCopyHtml(result) {
    const value = productDevelopmentCleanText(result && (result.plainTextCopy || result.approvedPlainText || result.finalCopy), 12000);
    return '<section class="pfh-product-development-plain-copy"><header><div><small>APPROVED PLAIN COPY</small><h3>纯文字文案版本</h3></div><span>仅本地缓存 · 输入即保存</span></header>' +
      '<textarea class="pfh-product-development-plain-copy-input" data-review-plain-copy rows="6" aria-label="用户确定的纯文字文案版本" placeholder="把用户确定好的纯文字文案粘贴到这里；输入后会自动保存到当前 SKU 缓存，不需要点击确定。">' + escapeHtml(value) + '</textarea>' +
      '<small>仅作为当前 SKU 的本地缓存备忘，不会调用 API、不会写入 PLM，也不会触发重新生成对照图。</small></section>';
  }

  function productDevelopmentReviewCopyContext(result) {
    const sku = String(result && result.sku || '').trim().toUpperCase();
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku
      ? state.productDevelopmentSnapshot
      : null;
    return snapshot || {
      sku,
      brand: result && result.brand || '',
      productType: result && result.productType || '',
      netContent: result && result.netContent || '',
      humanSupplement: Boolean(result && result.humanSupplement),
    };
  }

  function productDevelopmentReviewCopyValue(result, mode) {
    const context = productDevelopmentReviewCopyContext(result);
    const items = (Array.isArray(result && result.items) ? result.items : []).map((item) => ({ ...item }));
    productDevelopmentEnsureHumanSupplementLine(items, context);
    if (mode === 'revised') {
      let value = productDevelopmentCleanText(result && (result.plainTextCopy || result.approvedPlainText || result.finalCopy), 12000);
      if (!value) {
        value = items.map((item) => {
          const sourceText = productDevelopmentCompactSemanticText(item && item.sourceText, 240);
          const english = productDevelopmentIsNetContentText(item && item.textRole, sourceText)
            ? String(item && item.replacementEn || '').toUpperCase()
            : productDevelopmentCompactSemanticText(item && item.replacementEn, 300);
          const chinese = productDevelopmentCompactSemanticText(item && (item.replacementZh || item.translationZh), 300);
          return [english, chinese].filter(Boolean).join('\n');
        }).filter(Boolean).join('\n');
      } else {
        const netContent = productDevelopmentCleanText(context && context.netContent, 120).toUpperCase();
        const normalizedNetContent = netContent.replace(/\s+/g, '').toLowerCase();
        value = value.split('\n').map((line) => {
          const normalizedLine = String(line || '').replace(/\s+/g, '').toLowerCase();
          return /net[\s_-]*(?:content|contents|wt|weight)|净含量/i.test(line)
            || normalizedNetContent && normalizedLine === normalizedNetContent
            ? line.toUpperCase()
            : line;
        }).join('\n');
      }
      value = value.replace(/\bDIETARY\s+SUPPLEMENT\b/gi, 'DIETARY SUPPLEMENT');
      if (productDevelopmentIsHumanSupplement(context, value) && !/\bDIETARY\s+SUPPLEMENT\b/i.test(value)) value = [value, 'DIETARY SUPPLEMENT'].filter(Boolean).join('\n');
      return productDevelopmentCompactSemanticText(value, 12000);
    }
    return items.map((item) => productDevelopmentCompactSemanticText(item && item.sourceText, 240)).filter(Boolean).join('\n');
  }

  async function recomposeProductDevelopmentReview() {
    const result = state.productDevelopmentReview;
    if (!result || !result.sourceImageDataUrl) {
      showToast('请先完成一次图片文字分析');
      return;
    }
    const items = Array.isArray(result.items) ? result.items : [];
    if (items.some(productDevelopmentReviewItemIncomplete)) {
      showToast('请补全原文、英文改写和中文翻译');
      return;
    }
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === result.sku
      ? state.productDevelopmentSnapshot
      : {
        sku: result.sku,
        brand: result.brand || '',
        productType: result.productType || '',
        netContent: result.netContent || '',
        humanSupplement: result.humanSupplement === true,
      };
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
    return productDevelopmentXmlSafeText(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function productDevelopmentXmlSafeText(value) {
    const input = String(value || '');
    let output = '';
    for (let index = 0; index < input.length; index += 1) {
      const code = input.charCodeAt(index);
      if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 0xfffe || code === 0xffff) continue;
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = input.charCodeAt(index + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          output += input[index] + input[index + 1];
          index += 1;
        }
        continue;
      }
      if (code >= 0xdc00 && code <= 0xdfff) continue;
      output += input[index];
    }
    return output;
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

  function productDevelopmentBuiltinDocxFiles(documentXml) {
    return {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PRODUCT_DEVELOPMENT_REL_NS + '"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      'word/document.xml': documentXml,
      'word/styles.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="' + PRODUCT_DEVELOPMENT_W_NS + '"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Microsoft YaHei"/><w:sz w:val="22"/></w:rPr></w:style></w:styles>',
      'word/_rels/document.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + PRODUCT_DEVELOPMENT_REL_NS + '"></Relationships>',
    };
  }

  async function createProductDevelopmentBuiltinDocx(documentXml) {
    const files = productDevelopmentBuiltinDocxFiles(documentXml);
    const Fflate = (typeof fflate !== 'undefined' && fflate) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.fflate);
    if (Fflate && typeof Fflate.zipSync === 'function' && typeof Fflate.strToU8 === 'function') {
      const entries = Object.keys(files).reduce((result, name) => {
        result[name] = Fflate.strToU8(files[name]);
        return result;
      }, {});
      const bytes = Fflate.zipSync(entries, { level: 0 });
      return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    const Zip = getLazyExternalRuntime('jszip') || await ensureLazyExternalScript('jszip').catch(() => null);
    if (typeof Zip !== 'function') throw new Error('DOCX 组件未加载');
    const zip = new Zip();
    Object.keys(files).forEach((name) => zip.file(name, files[name]));
    return zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true });
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

  function productDevelopmentBodyRunProperties(source, doc) {
    if (!doc) return null;
    const clone = source ? source.cloneNode(true) : doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:rPr');
    Array.from(clone.childNodes || []).forEach((child) => {
      const localName = String(child.localName || child.nodeName || '').replace(/^w:/, '');
      if (localName === 'b' || localName === 'bCs' || localName === 'rStyle') clone.removeChild(child);
    });
    // A template can make a run bold through paragraph/character styles even
    // when the source run has no direct <w:b>. Explicitly turn bold off on
    // generated text so Word cannot re-inherit that formatting.
    const bold = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:b');
    bold.setAttribute('w:val', '0');
    const boldCs = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:bCs');
    boldCs.setAttribute('w:val', '0');
    // Keep the OOXML run-property order valid: rFonts/rStyle come before
    // b/bCs, while size/color/etc. follow them.
    const firstAfterFonts = Array.from(clone.childNodes || []).find((child) => {
      const localName = String(child.localName || child.nodeName || '').replace(/^w:/, '');
      return localName !== 'rStyle' && localName !== 'rFonts';
    }) || null;
    clone.insertBefore(bold, firstAfterFonts);
    clone.insertBefore(boldCs, firstAfterFonts);
    return clone;
  }

  function productDevelopmentSetCellLines(cell, lines, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRuns = sourceParagraph ? productDevelopmentXmlElements(sourceParagraph, 'r').filter((run) => productDevelopmentCellText(run)) : [];
    const sourceRun = sourceRuns[1] || sourceRuns[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const sourceRPr = sourceRun && productDevelopmentXmlElements(sourceRun, 'rPr')[0];
    productDevelopmentClearCell(cell);
    const values = Array.isArray(lines) ? lines : [lines];
    values.filter((line) => String(line || '').trim()).forEach((line) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      const bodyRPr = productDevelopmentBodyRunProperties(sourceRPr, doc);
      if (bodyRPr) run.appendChild(bodyRPr);
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = productDevelopmentXmlSafeText(line);
      run.appendChild(text);
      paragraph.appendChild(run);
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentDocxTextLines(value) {
    return String(value || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function productDevelopmentSetCellHeadingAndLines(cell, heading, lines, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRuns = sourceParagraph ? productDevelopmentXmlElements(sourceParagraph, 'r').filter((run) => productDevelopmentCellText(run)) : [];
    const headingRPr = sourceRuns[0] && productDevelopmentXmlElements(sourceRuns[0], 'rPr')[0];
    const bodyRun = sourceRuns[1] || sourceRuns[0];
    const bodyRPr = bodyRun && productDevelopmentXmlElements(bodyRun, 'rPr')[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const values = [heading].concat(Array.isArray(lines) ? lines : [lines])
      .map((line) => String(line || '').trim())
      .filter(Boolean);
    const appendRun = (paragraph, textValue, runProperties) => {
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      if (runProperties) run.appendChild(runProperties.cloneNode(true));
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = productDevelopmentXmlSafeText(textValue);
      run.appendChild(text);
      paragraph.appendChild(run);
    };
    productDevelopmentClearCell(cell);
    values.forEach((line, index) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      appendRun(
        paragraph,
        line,
        index === 0 ? headingRPr : productDevelopmentBodyRunProperties(bodyRPr, doc),
      );
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentCellGridSpan(cell) {
    const gridSpan = cell && productDevelopmentXmlElements(cell, 'gridSpan')[0];
    const value = gridSpan && (gridSpan.getAttribute('w:val') || gridSpan.getAttribute('val'));
    return Math.max(1, Number(value) || 1);
  }

  function productDevelopmentSetDirectionsCells(cells, labeling, doc) {
    if (!cells || !cells[1]) return;
    const directionsEn = productDevelopmentDocxTextLines(labeling && labeling.directionsEn);
    const directionsCn = productDevelopmentDocxTextLines(labeling && labeling.directionsCn);
    const isMergedLanguageCell = productDevelopmentCellGridSpan(cells[1]) > 1 || cells.length < 4;
    if (isMergedLanguageCell) {
      productDevelopmentSetCellHeadingAndLines(cells[1], 'DIRECTIONS:', directionsEn.concat(directionsCn), doc);
      // In the three-cell templates this is the auxiliary sample/rules cell,
      // not a second language column. Clear it after moving both languages
      // into the merged content cell so the sample text is not exported.
      if (cells[2]) productDevelopmentSetCellLines(cells[2], [], doc);
      return;
    }
    productDevelopmentSetCellHeadingAndLines(cells[1], 'DIRECTIONS:', directionsEn, doc);
    if (cells[2]) productDevelopmentSetCellLines(cells[2], directionsCn, doc);
  }

  function productDevelopmentSetCellPrefixedLines(cell, prefix, lines, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRuns = sourceParagraph ? productDevelopmentXmlElements(sourceParagraph, 'r').filter((run) => productDevelopmentCellText(run)) : [];
    const headingRun = sourceRuns[0];
    const bodyRun = sourceRuns[1] || sourceRuns[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const headingRPr = headingRun && productDevelopmentXmlElements(headingRun, 'rPr')[0];
    const bodyRPr = bodyRun && productDevelopmentXmlElements(bodyRun, 'rPr')[0];
    const values = (Array.isArray(lines) ? lines : [lines]).filter((line) => String(line || '').trim());
    const appendRun = (paragraph, textValue, runProperties) => {
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      if (runProperties) run.appendChild(runProperties.cloneNode(true));
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = productDevelopmentXmlSafeText(textValue);
      run.appendChild(text);
      paragraph.appendChild(run);
    };
    productDevelopmentClearCell(cell);
    values.forEach((line, index) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      if (index === 0 && prefix) appendRun(paragraph, String(prefix).trim() + ' ', headingRPr);
      appendRun(paragraph, line, productDevelopmentBodyRunProperties(bodyRPr, doc));
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentCellHeadingPrefix(cell, pattern) {
    const runs = productDevelopmentXmlElements(cell, 'r');
    return runs.map((run) => productDevelopmentCellText(run)).find((text) => text && pattern.test(text)) || '';
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
      efficacy: list('efficacy').map((item) => productDevelopmentCopywritingPairValues(typeof item === 'object' ? item : { cn: item })).filter((item) => item.cn || item.en),
      advantages: list('advantages').map((item) => productDevelopmentCopywritingPairValues(typeof item === 'object' ? item : { cn: item })).filter((item) => item.cn || item.en),
      sellingPoints: list('sellingPoints').map((item, index) => {
        const sourceItem = item && typeof item === 'object' ? item : { cn: item };
        const titleEn = productDevelopmentNormalizeCopywritingTitle(sourceItem.titleEn || sourceItem.title_en || sourceItem.titleEnglish);
        const titleCn = productDevelopmentNormalizeCopywritingTitle(sourceItem.titleCn || sourceItem.title_cn || sourceItem.titleChinese);
        const rawEn = productDevelopmentCopywritingText(sourceItem.en || sourceItem.english, 400);
        const rawCn = productDevelopmentCopywritingText(sourceItem.cn || sourceItem.chinese, 400);
        const en = index < 4 && titleEn && rawEn.toLowerCase().startsWith(titleEn.toLowerCase())
          ? rawEn.slice(titleEn.length).replace(/^[:：]\s*/, '').trim()
          : rawEn;
        const cn = index < 4 && titleCn && rawCn.startsWith(titleCn)
          ? rawCn.slice(titleCn.length).replace(/^[:：]\s*/, '').trim()
          : rawCn;
        return {
          titleEn: index < 4 ? titleEn : '',
          titleCn: index < 4 ? titleCn : '',
          en,
          cn,
        };
      }).filter((item) => item.cn || item.en),
      ingredientFunctions: list('ingredientFunctions').map((item) => {
        const sourceItem = item && typeof item === 'object' ? item : {};
        return {
          ingredientEn: productDevelopmentCleanText(sourceItem.ingredientEn || sourceItem.englishName || sourceItem.ingredientEnglish || sourceItem.ingredient_en, 300),
          ingredientCn: productDevelopmentCleanText(sourceItem.ingredientCn || sourceItem.chineseName || sourceItem.ingredientChinese || sourceItem.ingredient_cn, 300),
          en: productDevelopmentCopywritingText(sourceItem.en || sourceItem.english, 400),
          cn: productDevelopmentCopywritingText(sourceItem.cn || sourceItem.chinese, 400),
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

  function productDevelopmentNormalizeCopywritingTitle(value) {
    return productDevelopmentCopywritingText(value, 100)
      .replace(/^\s*\d+\s*[.)、:：-]?\s*/, '')
      .replace(/[:：]\s*$/, '')
      .trim();
  }

  function productDevelopmentValidateCopywriting(value, snapshot) {
    const result = productDevelopmentNormalizeCopywriting(value);
    const expected = Array.isArray(snapshot && snapshot.ingredients) ? snapshot.ingredients : [];
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
    const rewriteGeneratedPair = (item) => ({
      ...item,
      titleEn: productDevelopmentRewriteGeneratedCopyText(item && item.titleEn, brand),
      titleCn: productDevelopmentRewriteGeneratedCopyText(item && item.titleCn, brand),
      en: productDevelopmentRewriteGeneratedCopyText(item && item.en, brand),
      cn: productDevelopmentRewriteGeneratedCopyText(item && item.cn, brand),
    });
    result.efficacy = result.efficacy.map(rewriteGeneratedPair);
    result.advantages = result.advantages.map(rewriteGeneratedPair);
    result.sellingPoints = result.sellingPoints.map(rewriteGeneratedPair);
    result.ingredientFunctions = result.ingredientFunctions.map(rewriteGeneratedPair);
    const errors = [];
    if (result.efficacy.length !== 4) errors.push('A 产品功效必须为 4 条');
    if (result.advantages.length !== 4) errors.push('B 产品优势必须为 4 条');
    if (result.sellingPoints.length !== 15) errors.push('C 产品卖点必须为 15 条');
    if (result.ingredientFunctions.length !== expected.length) errors.push('D 成分功能必须覆盖全部有效成分');
    const complianceTexts = [];
    const addComplianceText = (label, text) => {
      const value = String(text || '');
      if (value) complianceTexts.push({ label, value });
    };
    result.efficacy.forEach((item, index) => {
      addComplianceText('A 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('A 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('A 第 ' + (index + 1) + ' 条中英文不完整');
      if (productDevelopmentChineseCount(item.cn) > 30 || productDevelopmentEnglishWordCount(item.en) > 30) errors.push('A 第 ' + (index + 1) + ' 条超出长度');
    });
    result.advantages.forEach((item, index) => {
      addComplianceText('B 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('B 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('B 第 ' + (index + 1) + ' 条中英文不完整');
      if (productDevelopmentChineseCount(item.cn) > 24 || productDevelopmentEnglishWordCount(item.en) > 14) errors.push('B 第 ' + (index + 1) + ' 条超出长度');
    });
    result.sellingPoints.forEach((item, index) => {
      addComplianceText('C 第 ' + (index + 1) + ' 条英文标题', item.titleEn);
      addComplianceText('C 第 ' + (index + 1) + ' 条中文标题', item.titleCn);
      addComplianceText('C 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('C 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('C 第 ' + (index + 1) + ' 条中英文不完整');
      const ingredientKeys = expected.flatMap((ingredient) => [ingredient && ingredient.en, ingredient && ingredient.cn])
        .map(productDevelopmentNormalizedClaimText)
        .filter(Boolean);
      const titleHasIngredient = [item.titleEn, item.titleCn].some((title) => {
        const normalizedTitle = productDevelopmentNormalizedClaimText(title);
        return normalizedTitle && ingredientKeys.some((key) => normalizedTitle.includes(key));
      });
      if (index < 4) {
        if (!item.titleEn || !item.titleCn) errors.push('C 第 ' + (index + 1) + ' 条必须有中英文小标题');
        if (titleHasIngredient) errors.push('C 第 ' + (index + 1) + ' 条小标题不能写成分');
      } else {
        if (item.titleEn || item.titleCn) errors.push('C 第 ' + (index + 1) + ' 条不能有小标题');
      }
    });
    if (result.ingredientFunctions.length === expected.length && expected.length) {
      const aligned = productDevelopmentAlignIngredientFunctions(result.ingredientFunctions, expected);
      if (aligned) result.ingredientFunctions = aligned;
    }
    result.ingredientFunctions.forEach((item, index) => {
      // ingredientEn/ingredientCn are PLM source labels. They must match the
      // input ingredients, but a source ingredient name must not invalidate the
      // generated copywriting compliance check by itself.
      addComplianceText('D 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('D 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('D 第 ' + (index + 1) + ' 条中英文不完整');
      const target = expected[index] || {};
      const targetKeys = productDevelopmentIngredientLabelKeys(target, true);
      const actualKeys = productDevelopmentIngredientLabelKeys(item, false);
      if (!actualKeys.length || !targetKeys.length || !actualKeys.some((key) => targetKeys.includes(key))) errors.push('D 第 ' + (index + 1) + ' 个成分与 PLM 不一致');
      if (productDevelopmentChineseCount(item.cn) > 30 || productDevelopmentEnglishWordCount(item.en) > 30) errors.push('D 第 ' + (index + 1) + ' 条超出长度');
    });
    const invalid = complianceTexts.map((entry) => {
      const term = productDevelopmentFindBannedTerm(entry.value, brand);
      if (term) return entry.label + '含限制词“' + term + '”';
      if (entry.value.includes('*')) return entry.label + '含星号';
      if (/\n\s*\n/.test(entry.value)) return entry.label + '含空行';
      return '';
    }).find(Boolean);
    if (invalid) errors.push(invalid);
    if (errors.length) throw new Error(errors.slice(0, 5).join('；'));
    return result;
  }

  function productDevelopmentFriendlyCopywritingError(error) {
    const message = formatErrorMessage(error);
    if (/产品资料读取|PLM 卖点读取|PLM 产品详情读取|成分表读取/.test(message) && /超时|失败/.test(message)) {
      return '产品资料读取超时或失败，已保留本地缓存；请稍后重试，日志中可查看具体阶段。';
    }
    if (/DOCX|Word|模板/i.test(message) && /超时|失败|缺少|无法|组件/.test(message)) {
      return 'DOCX 文件生成超时或模板无法处理；AI 文案已返回，请检查模板后重新生成。';
    }
    if (/D item \d+ exceeds length|D 第 \d+ 条超出长度/i.test(message)) {
      return '文案生成未完成：D 成分功能文案过长，请再次生成。';
    }
    if (/restricted term|含限制词|asterisk|blank line|星号|空行/i.test(message)) {
      const termMatch = message.match(/restricted term\s+["“]([^"”]+)["”]/i) || message.match(/含限制词[“"]([^”"]+)[”"]/i);
      const term = termMatch ? termMatch[1] : '';
      return term
        ? '文案生成未完成：生成内容命中限制词“' + term + '”，请再次生成。'
        : '文案生成未完成：生成内容包含限制词或格式异常，请再次生成。';
    }
    if (/C item|C 第|sellingPoints|小标题|title must|must not have a title|about 20 Chinese/i.test(message)) {
      return '文案生成未完成：C 产品卖点必须为 15 条，前 4 条有双语小标题，后 11 条不带小标题，请再次生成。';
    }
    if (/ModelScope|Gemini|timeout|timed out|aborted|bilingual|中英文不完整|copywriting completion|must contain/i.test(message)) {
      return '文案生成未完成：Qwen 响应超时或内容未通过校验，请再次点击生成。';
    }
    return message;
  }

  function productDevelopmentCopywritingNameWithBrand(brand, name) {
    const brandText = productDevelopmentCopywritingOutputBrand(brand);
    const nameText = productDevelopmentCopywritingNameWithoutInternalBrand(name);
    if (!brandText) return nameText;
    if (!nameText) return brandText;
    return nameText.toLowerCase().includes(brandText.toLowerCase()) ? nameText : brandText + ' ' + nameText;
  }

  function productDevelopmentCopywritingOutputBrand(value) {
    const brandText = productDevelopmentCleanText(value, 160);
    return /^AMZ$/i.test(brandText) ? '' : brandText;
  }

  function productDevelopmentCopywritingNameWithoutInternalBrand(value) {
    return productDevelopmentCleanText(value, 300)
      .replace(/^\s*AMZ(?=\s|[\/／>＞|:_：-]|[\u3400-\u9fff])[\s\/／>＞|:_：-]*/i, '')
      .trim();
  }

  function productDevelopmentDocxCodec() {
    const codec = (typeof fflate !== 'undefined' && fflate)
      || (typeof unsafeWindow !== 'undefined' && unsafeWindow.fflate);
    return codec
      && typeof codec.unzipSync === 'function'
      && typeof codec.zipSync === 'function'
      && typeof codec.strFromU8 === 'function'
      && typeof codec.strToU8 === 'function'
      ? codec
      : null;
  }

  async function buildProductDevelopmentDocx(content, templateSource, snapshot) {
    let zip = null;
    let zipEntries = null;
    let codec = null;
    let templateBuffer = null;
    let xml = productDevelopmentBuiltinDocumentXml();
    if (templateSource) {
      templateBuffer = typeof templateSource === 'string' ? base64ToArrayBuffer(templateSource) : templateSource;
      let Zip = getLazyExternalRuntime('jszip');
      if (!Zip) {
        try {
          Zip = await ensureLazyExternalScript('jszip');
        } catch (error) {
          productDevelopmentLog('warn', 'JSZip 按需加载失败，改用备用 DOCX 解压', formatErrorMessage(error));
        }
      }
      // JSZip keeps the original DOCX package parts and relationships in a
      // Word-compatible round trip. fflate remains a fallback for hosts where
      // the required JSZip userscript dependency was not loaded.
      if (typeof Zip === 'function') {
        try {
          zip = await withCopywritingTimeout(Zip.loadAsync(templateBuffer), 30000, 'JSZip 读取模板');
          const documentFile = zip.file('word/document.xml');
          if (!documentFile) throw new Error('模板缺少 word/document.xml');
          xml = await withCopywritingTimeout(documentFile.async('string'), 30000, 'JSZip 读取正文');
        } catch (error) {
          codec = productDevelopmentDocxCodec();
          if (!codec) throw error;
          productDevelopmentLog('warn', 'JSZip 读取模板失败，切换备用 DOCX 解压', formatErrorMessage(error));
          zip = null;
          zipEntries = codec.unzipSync(new Uint8Array(templateBuffer));
          const documentBytes = zipEntries['word/document.xml'];
          if (!documentBytes) throw new Error('模板缺少 word/document.xml');
          xml = codec.strFromU8(documentBytes);
        }
      } else {
        codec = productDevelopmentDocxCodec();
        if (!codec) throw new Error('DOCX 组件未加载');
        zipEntries = codec.unzipSync(new Uint8Array(templateBuffer));
        const documentBytes = zipEntries['word/document.xml'];
        if (!documentBytes) throw new Error('模板缺少 word/document.xml');
        xml = codec.strFromU8(documentBytes);
      }
    }
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (!doc || doc.getElementsByTagName('parsererror').length) throw new Error('模板文档结构无法读取');
    const rows = productDevelopmentXmlElements(doc, 'tr');
    if (!rows.length) throw new Error('模板没有可编辑表格');
    const targets = {
      productName: productDevelopmentFindRow(rows, [/产品名称/i]),
      referenceUrl: productDevelopmentFindRow(rows, [/外网参考链接/i, /参考链接/i]),
      productType: productDevelopmentFindRow(rows, [/产品类型/i, /PRODUCT\s*TYPE/i]),
      netContent: productDevelopmentFindRow(rows, [/净含量/i, /NET\s*(?:CONTENT|WT|WEIGHT)/i]),
      otherIngredients: productDevelopmentFindRow(rows, [/补充品标示及营养成分含量/i, /OTHER\s+INGREDIENTS?/i]),
      directions: productDevelopmentFindRow(rows, [/食用方法/i, /DIRECTIONS?/i]),
      warnings: productDevelopmentFindRow(rows, [/警告语/i, /WARNINGS?/i]),
      efficacy: productDevelopmentFindRow(rows, [/^A[.．、)]?产品功效/i, /产品功效/i]),
      advantages: productDevelopmentFindRow(rows, [/^B[.．、)]?产品优势/i, /产品优势/i]),
      sellingPoints: productDevelopmentFindRow(rows, [/^C[.．、)]?产品卖点/i, /产品卖点/i]),
      ingredientFunctions: productDevelopmentFindRow(rows, [/^D[.．、)]?成分功能/i, /成分功能/i]),
    };
    const findRowByCellText = (patterns) => rows.find((row) => productDevelopmentXmlElements(row, 'tc').some((cell) => patterns.some((pattern) => pattern.test(productDevelopmentCellText(cell))))) || null;
    const disclaimer = findRowByCellText([/These statements have not been evaluated by the Food and Drug Administration/i, /FDA.*免责声明/i, /FDA.*声明/i]);
    const dietarySupplement = findRowByCellText([/^DIETARY\\s+SUPPLEMENT$/i, /膳食补充剂/]);
    const missing = ['efficacy', 'advantages', 'sellingPoints', 'ingredientFunctions'].filter((key) => !targets[key]);
    if (missing.length) throw new Error('模板缺少字段：' + missing.join('、'));
    const fill = (row, english, chinese) => {
      const cells = productDevelopmentXmlElements(row, 'tc');
      if (cells.length < 4) throw new Error('模板字段不是四列表格');
      productDevelopmentSetCellLines(cells[1], english, doc);
      productDevelopmentSetCellLines(cells[2], chinese, doc);
    };
    if (targets.productName && snapshot) {
      const cells = productDevelopmentXmlElements(targets.productName, 'tc');
      const englishName = productDevelopmentCopywritingNameWithBrand(snapshot.brand, snapshot.englishName);
      const chineseName = productDevelopmentCopywritingNameWithBrand(snapshot.brand, snapshot.name);
      if (cells[1] && englishName) {
        const productNamePrefix = productDevelopmentCellHeadingPrefix(cells[1], /PRODUCT\s*NAME/i) || 'PRODUCT NAME:';
        productDevelopmentSetCellPrefixedLines(cells[1], productNamePrefix, [englishName], doc);
      }
      if (cells[2] && chineseName) productDevelopmentSetCellLines(cells[2], [chineseName], doc);
    }
    if (targets.referenceUrl && snapshot && snapshot.referenceUrl) {
      const cells = productDevelopmentXmlElements(targets.referenceUrl, 'tc');
      if (cells[1]) productDevelopmentSetCellLines(cells[1], [snapshot.referenceUrl], doc);
    }
    const labeling = snapshot && snapshot.labeling && typeof snapshot.labeling === 'object' ? snapshot.labeling : null;
    const ingredientTable = snapshot && snapshot.ingredientTable && typeof snapshot.ingredientTable === 'object' ? snapshot.ingredientTable : null;
    const hasLabeling = Boolean(labeling && Object.values(labeling).some((value) => String(value || '').trim()));
    const hasIngredientTable = Boolean(ingredientTable && Object.values(ingredientTable).some((value) => String(value || '').trim()));
    if (snapshot && (hasLabeling || hasIngredientTable)) {
      if (targets.productType) {
        const cells = productDevelopmentXmlElements(targets.productType, 'tc');
        const productTypeEn = productDevelopmentCleanText(snapshot.productType || 'Human dietary supplement / liquid drops', 180);
        const productTypeCn = productDevelopmentCleanText(snapshot.productTypeCn || '人用膳食补充剂 / 滴剂', 180);
        if (cells[1]) productDevelopmentSetCellLines(cells[1], ['PRODUCT TYPE: ' + productTypeEn], doc);
        if (cells[2]) productDevelopmentSetCellLines(cells[2], [productTypeCn], doc);
      }
      if (targets.netContent && snapshot.netContent) {
        const cells = productDevelopmentXmlElements(targets.netContent, 'tc');
        if (cells[1]) productDevelopmentSetCellLines(cells[1], ['NET CONTENT: ' + String(snapshot.netContent)], doc);
        if (cells[2]) productDevelopmentSetCellLines(cells[2], ['净含量：' + String(snapshot.netContent)], doc);
      }
      if (dietarySupplement) {
        const cells = productDevelopmentXmlElements(dietarySupplement, 'tc');
        if (cells[1]) productDevelopmentSetCellLines(cells[1], ['DIETARY SUPPLEMENT'].concat(!targets.netContent && snapshot.netContent ? ['NET CONTENT: ' + String(snapshot.netContent)] : []), doc);
        if (cells[2]) productDevelopmentSetCellLines(cells[2], ['膳食补充剂'].concat(!targets.netContent && snapshot.netContent ? ['净含量：' + String(snapshot.netContent)] : []), doc);
      }
      if (targets.otherIngredients && hasIngredientTable) {
        const cells = productDevelopmentXmlElements(targets.otherIngredients, 'tc');
        if (cells[1]) productDevelopmentSetCellLines(cells[1], ['Other Ingredients: ' + String(ingredientTable.otherIngredientsEn || '')], doc);
        if (cells[2]) productDevelopmentSetCellLines(cells[2], [String(ingredientTable.otherIngredientsCn || '')], doc);
      }
      if (targets.directions && hasLabeling) {
        const cells = productDevelopmentXmlElements(targets.directions, 'tc');
        productDevelopmentSetDirectionsCells(cells, labeling, doc);
      }
      if (disclaimer && hasLabeling) {
        const cells = productDevelopmentXmlElements(disclaimer, 'tc');
        if (cells[1]) productDevelopmentSetCellLines(cells[1], [String(labeling.disclaimerEn || '')], doc);
        if (cells[2]) productDevelopmentSetCellLines(cells[2], [String(labeling.disclaimerCn || '')], doc);
      }
      if (targets.warnings && hasLabeling) {
        const cells = productDevelopmentXmlElements(targets.warnings, 'tc');
        if (cells[1]) productDevelopmentSetCellLines(cells[1], ['WARNING: ' + String(labeling.warningsEn || '')], doc);
        if (cells[2]) productDevelopmentSetCellLines(cells[2], [String(labeling.warningsCn || '')], doc);
      }
    }
    const efficacyEnglish = productDevelopmentSectionLines(content.efficacy, (item, index) => index + '. ' + item.en);
    const efficacyCells = productDevelopmentXmlElements(targets.efficacy, 'tc');
    const efficacyChinese = productDevelopmentSectionLines(content.efficacy, (item, index) => index + '、' + item.cn);
    const efficacyPrefix = productDevelopmentCellHeadingPrefix(efficacyCells[1], /\bFUNCTIONS?\b/i);
    if (efficacyPrefix) {
      productDevelopmentSetCellPrefixedLines(efficacyCells[1], efficacyPrefix, efficacyEnglish, doc);
      productDevelopmentSetCellLines(efficacyCells[2], efficacyChinese, doc);
    } else fill(targets.efficacy, efficacyEnglish, efficacyChinese);
    fill(targets.advantages,
      productDevelopmentSectionLines(content.advantages, (item, index) => index + '. ' + item.en),
      productDevelopmentSectionLines(content.advantages, (item, index) => index + '、' + item.cn));
    fill(targets.sellingPoints,
      productDevelopmentSectionLines(content.sellingPoints, (item, index) => index + '. ' + (item.titleEn ? item.titleEn + ': ' : '') + item.en),
      productDevelopmentSectionLines(content.sellingPoints, (item, index) => index + '、' + (item.titleCn ? item.titleCn + '：' : '') + item.cn));
    fill(targets.ingredientFunctions,
      productDevelopmentSectionLines(content.ingredientFunctions, (item, index) => index + '. ' + (item.ingredientEn || item.ingredientCn) + ': ' + item.en),
      productDevelopmentSectionLines(content.ingredientFunctions, (item, index) => index + '、' + (item.ingredientCn || item.ingredientEn) + '：' + item.cn));
    const documentXml = new XMLSerializer().serializeToString(doc);
    if (zip) {
      try {
        zip.file('word/document.xml', documentXml);
        const bytes = await withCopywritingTimeout(
          zip.generateAsync({ type: 'uint8array', compression: 'STORE' }),
          60000,
          'JSZip 打包 DOCX',
        );
        return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      } catch (error) {
        codec = productDevelopmentDocxCodec();
        if (!codec || !templateBuffer) throw error;
        productDevelopmentLog('warn', 'JSZip 打包模板失败，切换备用 DOCX 打包', formatErrorMessage(error));
        zipEntries = codec.unzipSync(new Uint8Array(templateBuffer));
      }
    }
    if (zipEntries && codec) {
      zipEntries['word/document.xml'] = codec.strToU8(documentXml);
      const bytes = codec.zipSync(zipEntries, { level: 0 });
      return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    return createProductDevelopmentBuiltinDocx(documentXml);
  }

  async function rebuildProductDevelopmentCachedDocx(result) {
    if (!result || !result.content) throw new Error('本地没有可恢复的产品文案');
    const template = resolveProductDevelopmentCachedCopywritingTemplate(result);
    try {
      const source = await withCopywritingTimeout(loadProductDevelopmentCopywritingTemplateSource(template), 60000, 'DOCX 模板下载');
      const snapshot = result.snapshot && typeof result.snapshot === 'object' ? result.snapshot : { sku: result.sku };
      const blob = await withCopywritingTimeout(buildProductDevelopmentDocx(result.content, source, snapshot), 180000, 'DOCX 生成');
      result.blob = blob;
      state.productDevelopmentCopywriting = result;
      productDevelopmentLog('success', '本地文案 DOCX 已恢复', result.sku + ' | 模板=' + template.label + ' | 大小=' + String(blob.size || 0) + ' bytes');
      return result;
    } catch (error) {
      productDevelopmentLog('error', '本地文案 DOCX 恢复失败', result.sku + ' | 模板=' + template.label + ' | ' + formatErrorMessage(error));
      throw error;
    }
  }

  async function downloadProductDevelopmentCopywritingResult() {
    let result = state.productDevelopmentCopywriting || restoreProductDevelopmentCopywritingCache(getProductDevelopmentCurrentSku());
    if (!result || !result.content) throw new Error('暂无可下载的 DOCX');
    if (!result.blob) {
      state.productDevelopmentCopywritingBusy = true;
      state.productDevelopmentStatus = '正在从本地缓存恢复 DOCX…';
      state.productDevelopmentError = '';
      renderShell();
      try {
        result = await rebuildProductDevelopmentCachedDocx(result);
        state.productDevelopmentStatus = '本地缓存 DOCX 已恢复，可继续下载';
      } finally {
        state.productDevelopmentCopywritingBusy = false;
        renderShell();
      }
    }
    downloadBlob(result.blob, result.fileName || productDevelopmentCopywritingFileName(result.snapshot || result));
  }

  async function runProductDevelopmentCopywriting() {
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) {
      showToast('请先在设计任务中打开或选择当前 SKU');
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
    state.productDevelopmentStatus = '正在检查本地成分缓存并读取产品资料…';
    productDevelopmentLog('info', '开始生成 A-D 文案', sku + ' | 本地成分缓存=' + productDevelopmentCachedIngredientPairs(sku).length + ' 项');
    renderShell();
    try {
      stage = '读取产品资料与成分缓存';
      const snapshot = await withCopywritingTimeout(
        loadProductDevelopmentSnapshot(sku, false, { requireIngredients: true, includeImage: false, preferCachedIngredients: true }),
        180000,
        '产品资料读取',
      );
      const copywritingTemplate = resolveProductDevelopmentCopywritingTemplate();
      productDevelopmentLog('success', '产品资料与成分读取完成', sku + ' | 成分=' + snapshot.ingredients.length + ' 项 | 用时=' + (Date.now() - startedAt) + 'ms');
      stage = '加载 DOCX 模板';
      state.productDevelopmentStatus = copywritingTemplate.local
        ? '正在读取本地 DOCX 模板…'
        : '正在从云端加载' + copywritingTemplate.label + '文案模板…';
      renderShell();
      const copywritingTemplateSource = await withCopywritingTimeout(
        loadProductDevelopmentCopywritingTemplateSource(copywritingTemplate),
        60000,
        'DOCX 模板下载',
      );
      productDevelopmentLog('success', 'DOCX 模板已就绪', sku + ' | 模板=' + copywritingTemplate.label + ' | 来源=' + (copywritingTemplate.local ? '本地' : '云端'));
      state.productDevelopmentStatus = '正在一次性生成完整 A-D 文案，最长等待约 10 分钟…';
      renderShell();
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
      productDevelopmentLog('success', 'AI 文案已缓存到本地', sku + ' | id=' + id);
      state.productDevelopmentStatus = '正在按四列表格模板生成 DOCX…';
      renderShell();
      stage = '生成 DOCX';
      productDevelopmentLog('info', '开始生成 DOCX 文件', sku + ' | 模板=' + copywritingTemplate.label + ' | id=' + copywritingTemplate.id + ' | 编码器=' + (getLazyExternalRuntime('jszip') ? 'JSZip' : productDevelopmentDocxCodec() ? 'fflate' : 'none'));
      const blob = await withCopywritingTimeout(
        buildProductDevelopmentDocx(content, copywritingTemplateSource, snapshot),
        180000,
        'DOCX 生成',
      );
      productDevelopmentLog('success', 'DOCX 文件生成完成', sku + ' | 大小=' + String(blob && blob.size || 0) + ' bytes | 用时=' + (Date.now() - startedAt) + 'ms');
      state.productDevelopmentCopywriting.blob = blob;
      state.productDevelopmentStatus = 'A-D 文案 DOCX 已生成，未向 PLM 回写';
      productDevelopmentLog('success', 'A-D 文案 DOCX 生成完成', sku + ' | 条目=' + (content.efficacy.length + content.advantages.length + content.sellingPoints.length + content.ingredientFunctions.length) + ' | 总用时=' + (Date.now() - startedAt) + 'ms');
      showToast('A-D 文案 DOCX 已生成');
    } catch (error) {
      productDevelopmentLog('error', 'A-D 文案生成失败', sku + ' | 阶段=' + stage + ' | 用时=' + (Date.now() - startedAt) + 'ms | ' + formatErrorMessage(error));
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
    selectProductDevelopmentCopywritingTemplate(PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID);
    showToast('已恢复默认胶囊文案模板');
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
    state.productDevelopmentReviewEditorOpen = false;
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
      const cached = restoreProductDevelopmentCopywritingCache(item.sku, item.id) || restoreProductDevelopmentCopywritingCache(item.sku);
      if (cached) cached.fromHistory = true;
      state.productDevelopmentStatus = cached
        ? '已打开本地缓存文案，可预览或重新构建并下载 DOCX'
        : '这条旧历史只有生成记录，没有可恢复的文案内容';
    }
    renderShell();
  }

  function productDevelopmentHistoryViewHtml() {
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>LOCAL HISTORY</small><h2>本地历史</h2></div></header>' +
      '<section class="pfh-product-development-section pfh-product-development-history"><header><div><small>LOCAL HISTORY</small><h3>已生成记录</h3></div><span>最多保留 ' + PRODUCT_DEVELOPMENT_MAX_HISTORY + ' 条</span></header><div>' + productDevelopmentHistoryHtml(PRODUCT_DEVELOPMENT_MAX_HISTORY) + '</div></section>' +
      '<p class="pfh-product-development-note">图片历史可直接查看和下载已保存的 PNG；文案历史保存完整 A-D 内容，刷新后仍可预览并重新构建 DOCX。所有结果只保存在本地，不向 PLM 回写。</p></div>';
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
      const requiresSku = feature.requiresSku !== false;
      return '<article class="pfh-product-development-card' + (disabled ? ' is-disabled' : '') + '"><div class="pfh-product-development-card-head"><span>' + iconHtml(feature.icon) + '</span></div><h3>' + escapeHtml(feature.title) + '</h3><p>' + escapeHtml(feature.subtitle) + '</p>' + (feature.action ? '<button type="button" data-action="' + feature.action + '"' + (requiresSku && !sku ? ' disabled' : '') + '>打开功能 →</button>' : '<small>功能占位</small>') + '</article>';
    }).join('');
    return '<div class="pfh-product-development">' + productDevelopmentModeSwitchHtml() +
      '<section class="pfh-product-development-hero"><div><small>PRODUCT DEVELOPMENT</small><h2>产品开发工作台</h2><p>先制作侵权图和文案，再查看产品详情预填表单；默认只读，只有 BOM 区域人工点击“保存到 PLM”才写入。</p></div><span class="pfh-product-development-readonly">默认只读 PLM</span></section>' +
      productDevelopmentSkuSummaryHtml(snapshot) +
      productDevelopmentEvidenceHtml(snapshot) +
      '<section class="pfh-product-development-section"><header><div><small>FUNCTION MAP</small><h3>开发功能</h3></div><span>共用浮窗布局，和设计任务分区</span></header><div class="pfh-product-development-grid">' + cards + '</div></section>' +
      '<section class="pfh-product-development-section pfh-product-development-history"><header><div><small>LOCAL HISTORY</small><h3>本地历史</h3></div><span>最多保留 ' + PRODUCT_DEVELOPMENT_MAX_HISTORY + ' 条</span></header><div>' + productDevelopmentHistoryHtml() + '</div></section>' +
      '<p class="pfh-product-development-note">合规提示：AI 结果只能作为草稿，必须人工核对品牌、禁词、成分和平台规则；侵权图、文案和详情字段不自动写回，BOM 仅在明确点击保存后调用 PLM 接口。</p></div>';
  }

  function productDevelopmentPricingResultHtml(result, sku, detail) {
    if (!result) return '<div class="pfh-product-development-result-empty">请输入全包价格和税率，系统会按定价标准计算三档价格。</div>';
    const canApply = Boolean(sku && detail && !detail.error);
    const applyHint = canApply
      ? '只填入当前 SKU 的本地建品草稿，不会直接写入 PLM。'
      : sku
        ? '当前 SKU 详情尚未读取完成，读取后即可填入建品资料。'
        : '选择开发 SKU 后可把结果填入对应的本地建品资料。';
    const tiers = [
      ['国内一档价格', result.firstPrice, '三档价格 + 2'],
      ['国内二档价格', result.secondPrice, '三档价格 + 1'],
      ['国内三档价格', result.thirdPrice, '（全包价格 × (1 + 税率/100) + 3）÷ 0.7'],
    ];
    return '<div class="pfh-product-development-grid pfh-product-development-pricing-result-grid">' + tiers.map((tier) => '<article class="pfh-product-development-card pfh-product-development-pricing-tier"><div class="pfh-product-development-card-head"><span>' + iconHtml('calculator') + '</span><i>公式建议</i></div><h3>' + escapeHtml(tier[0]) + '</h3><p><strong>¥' + escapeHtml(productDevelopmentPricingPriceText(tier[1])) + '</strong></p><small>' + escapeHtml(tier[2]) + '</small></article>').join('') + '</div>' +
      '<div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-pricing-apply" data-product-sku="' + escapeHtml(sku) + '"' + (canApply ? '' : ' disabled') + '>填入当前 SKU 建品资料</button><small>' + escapeHtml(applyHint) + '</small></div>';
  }

  function productDevelopmentPricingViewHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    const input = productDevelopmentPricingInputForSku(sku, detail);
    const result = productDevelopmentCalculateTierPrices(input.fullPackagePrice, input.taxRatePercent);
    const sourceHint = detail && !detail.error
      ? '全包价格默认读取当前 SKU 的采购价（含税运），税率默认读取采购明细。'
      : sku
        ? '当前 SKU 详情尚未读取完成，也可以先手动输入计算。'
        : '未选择开发 SKU，可先手动输入全包价格和税率。';
    const statusHtml = state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '';
    const errorHtml = state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>PRICING STANDARD</small><h2>定价标准</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>计算国内三档价格</h3><p>三档价格 = （全包价格 × (1 + 税率/100) + 3）÷ 0.7；二档价格 = 三档价格 + 1；一档价格 = 三档价格 + 2。</p></div><span>' + escapeHtml(sku ? '当前 SKU：' + sku : '公式计算工具') + '</span></section>' +
      '<section class="pfh-product-development-detail-form"><header><div><small>PRICING INPUT</small><h3>定价输入</h3></div><span>' + escapeHtml(sourceHint) + '</span></header><div class="pfh-product-development-form-grid"><label class="pfh-product-development-material-field"><span>全包价格（元）</span><input type="number" min="0" step="0.01" inputmode="decimal" class="pfh-product-development-pricing-input" data-product-development-pricing-field="fullPackagePrice" value="' + escapeHtml(input.fullPackagePrice) + '" placeholder="例如：6.50"></label><label class="pfh-product-development-material-field"><span>税率（%）</span><input type="number" min="0" max="100" step="0.01" inputmode="decimal" class="pfh-product-development-pricing-input" data-product-development-pricing-field="taxRatePercent" value="' + escapeHtml(input.taxRatePercent) + '" placeholder="例如：13"></label></div><p class="pfh-product-development-form-note">税率按百分数填写，例如 13% 填写 13；也支持填写 0.13，系统会按 13% 换算。</p></section>' +
      statusHtml + errorHtml +
      '<section class="pfh-product-development-form-section"><h4>计算结果</h4><div class="pfh-product-development-pricing-result">' + productDevelopmentPricingResultHtml(result, sku, detail) + '</div></section>' +
      '<p class="pfh-product-development-note">结果保留两位小数，仅作为建品定价建议。点击“填入当前 SKU 建品资料”后，会把一档、二档、三档写入本地草稿，仍需人工确认后再保存到 PLM。</p></div>';
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
    const canShowResult = Boolean(result && (resultMatchesCurrentSku || result.fromHistory));
    const items = canShowResult ? result.items || [] : [];
    const extractedTexts = canShowResult && Array.isArray(result.extractedTexts) ? result.extractedTexts : [];
    const riskCount = items.filter((item) => Array.isArray(item && item.riskTypes) && item.riskTypes.length).length;
    const extractedSummary = extractedTexts.length ? '<div class="pfh-product-development-preview-note"><strong>已读取 ' + extractedTexts.length + ' 项文字，识别风险 ' + riskCount + ' 项。</strong></div>' : '';
    const canEditResult = canShowResult && !result.fromHistory;
    const previewCopyActions = Array.isArray(items) && items.length
      ? '<button type="button" data-action="product-development-review-copy-all" title="复制图片识别出的全部原文">复制全文</button><button type="button" data-action="product-development-review-copy-revised" title="复制当前修改后的中英文文案">复制修改后的文案</button>'
      : '';
    const preview = canShowResult && result.comparisonDataUrl ? '<section class="pfh-product-development-preview"><div class="pfh-product-development-preview-head"><strong>三列对照图预览</strong><small>预览按容器自适应，下载 PNG 保留大字版</small></div><div class="pfh-product-development-preview-scroll"><img src="' + escapeHtml(result.comparisonDataUrl) + '" alt="侵权对照图" style="display:block;width:100%;min-width:0;max-width:100%;height:auto;object-fit:contain"></div><div class="pfh-product-development-preview-actions">' + (canEditResult ? '<button type="button" data-action="product-development-review-editor-open">浮窗编辑文字</button>' : '') + previewCopyActions + '<button type="button" data-action="product-development-review-download">下载 PNG</button></div></section>' : '';
    const list = canShowResult
      ? (result.fromHistory
        ? '<section class="pfh-product-development-history-readonly"><strong>本地历史对照图</strong><p>当前打开的是已保存的 PNG 结果，可查看和下载。若要修改文字，请重新分析当前对标图片。</p></section>'
        : '')
      : '<div class="pfh-product-development-result-empty">完成分析后，这里会列出原图文字、风险类型和修改内容，并支持手动修改。</div>';
    const editor = canEditResult ? productDevelopmentReviewEditorHtml(result, items) : '';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>IMAGE REVIEW</small><h2>产品图风险筛查</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>生成侵权对照图</h3><p>使用当前 SKU 的对标图片生成三列对照图。</p></div><button type="button" data-action="product-development-review-run"' + (state.productDevelopmentReviewBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentReviewBusy ? '正在分析…' : '开始一次分析') + '</button></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '') +
      extractedSummary +
      (canShowResult ? productDevelopmentProductNamingHtml(result) : '') +
      (canEditResult ? productDevelopmentPlainTextCopyHtml(result) : '') +
      preview + list + editor +
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
    const isVisible = () => (state.view === 'home' && state.productDevelopmentView === 'copywriting')
      || (state.view === 'productDevelopmentTasks' && state.productDevelopmentTaskView === 'copywriting');
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
    if (review && Array.isArray(review.items) && review.items.length && !review.fromHistory) {
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
    const task = state.productDevelopmentSelectedTask && typeof state.productDevelopmentSelectedTask === 'object'
      ? state.productDevelopmentSelectedTask
      : {};
    const name = productDevelopmentCleanText(snapshot && snapshot.name || task.name || task.productName || '当前选中产品', 220);
    const imageReady = Boolean(snapshot && snapshot.imageKind === 'benchmark' && snapshot.imageUrl);
    const referenceUrl = productDevelopmentCleanText(snapshot && snapshot.referenceUrl || '', 1200);
    const input = productDevelopmentOneShotInputForRender();
    const copywritingTemplate = resolveProductDevelopmentCopywritingTemplate();
    const ingredientTemplate = productDevelopmentOneShotIngredientTemplate();
    const productType = productDevelopmentCleanText(input.productType || snapshot && snapshot.productType || '生成时按当前 SKU 读取', 180);
    const ingredientTemplateLabel = ingredientTemplate
      ? productDevelopmentCleanText(ingredientTemplate.label || ingredientTemplate.fileName, 120)
      : '未选择成分表模板';
    const templateOptions = productDevelopmentOneShotIngredientTemplateOptions(ingredientTemplate);
    const sheetOptions = productDevelopmentOneShotIngredientSheetOptions(ingredientTemplate);
    const plainTextCopy = productDevelopmentOneShotPlainTextCopy(sku, snapshot);
    const resolvedSheet = productDevelopmentCleanText(state.productDevelopmentOneShotResolvedSheetName, 120);
    const sourceCopyLabel = plainTextCopy ? '已读取纯文字文案版本' : '尚未填写纯文字文案版本';
    const sourceCopyHint = plainTextCopy ? '生成时优先按侵权图修改后的纯文字文案识别定位和核心成分' : '建议先在“产品图风险筛查”中确认纯文字文案，生成时将优先使用它';
    const imageLabel = plainTextCopy ? '本次生成不读取效果图' : imageReady ? '已读取当前 SKU 对标图' : '点击生成时自动读取';
    const imageHint = plainTextCopy ? '已确认纯文字文案，效果图仅用于风险对照图查看' : referenceUrl || '参考链接将在读取产品资料后自动带入';
    return '<div class="pfh-product-development-one-shot-source"><div><small>当前选中产品</small><strong>' + escapeHtml(name) + '</strong><span>SKU ' + escapeHtml(sku || '未选择') + '</span></div><div><small>成分识别依据</small><strong>' + escapeHtml(sourceCopyLabel) + '</strong><span>' + escapeHtml(sourceCopyHint) + '</span></div><div><small>对标图与参考链接</small><strong>' + imageLabel + '</strong><span>' + escapeHtml(imageHint) + '</span></div><div><small>产品类型</small><strong>' + escapeHtml(productType) + '</strong><label class="pfh-product-development-material-field"><span>成分表模板</span><select class="pfh-product-development-one-shot-ingredient-template-input" aria-label="选择成分表模板">' + templateOptions + '</select></label><label class="pfh-product-development-material-field"><span>参考工作表（可选）</span><select class="pfh-product-development-one-shot-ingredient-sheet-input" aria-label="选择参考工作表"' + (ingredientTemplate ? '' : ' disabled') + '>' + sheetOptions + '</select></label><span>当前：' + escapeHtml(ingredientTemplateLabel) + (resolvedSheet && !state.productDevelopmentIngredientSheetName ? ' · 自动参考：' + escapeHtml(resolvedSheet) : '') + ' · 文案：' + escapeHtml(copywritingTemplate.label || '当前选择') + '</span></div></div>';
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
      const template = productDevelopmentOneShotIngredientTemplate();
      const factsLabel = normalizeProductDevelopmentIngredientKind(template && template.kind) === 'pet' ? 'Product Facts' : 'Supplement Facts';
      return '<div class="pfh-product-development-result-empty">点击上方“生成成分表”后，这里会出现可编辑的 ' + factsLabel + ' 草稿。成分表确认前不会生成文案，校验通过前不会允许导出 PDF。</div>';
    }
    const table = result.ingredientTable || {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind);
    const isPet = ingredientKind === 'pet';
    const validation = productDevelopmentOneShotDraftValidation(result);
    const warnings = Array.isArray(result.warnings) ? result.warnings.filter(Boolean).slice(0, 12) : [];
    const warningHtml = warnings.length ? '<div class="pfh-product-development-preview-note"><strong>人工复核提醒</strong><p>' + warnings.map((item) => escapeHtml(item)).join('<br>') + '</p></div>' : '';
    const labeling = result.labeling && typeof result.labeling === 'object' ? result.labeling : {};
    const labelingHtml = '<div class="pfh-product-development-preview-note"><strong>标签用语（确认成分表后写入文案 DOCX）</strong><p>Directions: ' + escapeHtml(labeling.directionsEn || '') + '</p><p>' + escapeHtml(labeling.directionsCn || '') + '</p>' + (labeling.disclaimerEn ? '<p>FDA disclaimer: ' + escapeHtml(labeling.disclaimerEn) + '</p>' : '') + '<p>' + escapeHtml(labeling.warningsEn || '') + '</p></div>';
    const validationHtml = validation.valid
      ? '<div class="pfh-product-development-one-shot-validation is-valid"><strong>' + (result.content ? '成分表已确认，文案已生成' : '校验通过，请确认成分表后生成文案') + '</strong><span>' + (validation.hasMassAmounts ? '活性合计 ' + escapeHtml(String(validation.activeTotalMg)) + ' mg' : '活性用量按包装标示单位') + (isPet || !validation.hasMassAmounts ? '' : ' · 标准化活性 ' + escapeHtml(String(validation.standardizedActivePercent)) + '%') + '</span></div>'
      : '<div class="pfh-product-development-one-shot-validation is-invalid"><strong>成分表仍需修正，暂不能导出</strong><span>' + validation.errors.map((item) => escapeHtml(item)).join('；') + '</span></div>';
    const footerChecked = !isPet && table.showFooter !== false;
    const copywritingAction = result.content
      ? '<button type="button" data-action="product-development-one-shot-download-copywriting">下载文案 DOCX</button>'
      : '<button type="button" data-action="product-development-copywriting-ingredient-confirm"' + (validation.valid && !state.productDevelopmentOneShotBusy ? '' : ' disabled') + '>' + (state.productDevelopmentOneShotBusy ? '正在生成文案…' : '确认成分表并生成文案') + '</button>';
    return '<section class="pfh-product-development-detail-form pfh-product-development-one-shot-editor"><header><div><small>' + (isPet ? 'PRODUCT FACTS PDF' : 'SUPPLEMENT FACTS PDF') + '</small><h3>编辑成分表草稿</h3></div><span>' + escapeHtml(String(result.snapshot && result.snapshot.englishName || (isPet ? 'Pet Nutrition Support' : 'Daily Wellness Support Drops'))) + '</span></header><div class="pfh-product-development-form-grid">' +
      productDevelopmentOneShotEditorFieldHtml(table, 'title', '标题', 'text', false, true) +
      productDevelopmentOneShotEditorFieldHtml(table, 'servingSize', 'Serving Size', 'text', false, false) +
      productDevelopmentOneShotEditorFieldHtml(table, 'servingsPerContainer', 'Servings Per Container', 'number', false, false) +
      productDevelopmentOneShotEditorFieldHtml(table, 'requiredActiveMg', '活性目标（可选，mg / serving）', 'number', false, false) +
      (isPet ? '' : productDevelopmentOneShotEditorFieldHtml(table, 'requiredStandardizedActivePercent', '标准化活性目标（可选，%）', 'number', false, false)) +
      productDevelopmentOneShotEditorFieldHtml(table, 'otherIngredientsEn', isPet ? 'Inactive Ingredients（可选）' : 'Other Ingredients（可选）', 'text', true, true) +
      productDevelopmentOneShotEditorFieldHtml(table, 'otherIngredientsCn', '其他成分（中文，可选）', 'text', true, true) +
      (isPet ? '' : '<label class="pfh-product-development-check-field"><input type="checkbox" data-product-development-one-shot-editor-field="showFooter"' + (footerChecked ? ' checked' : '') + '><span>显示 “**Daily Value not established.”</span></label>') + '</div><div class="pfh-product-development-one-shot-table-head' + (isPet ? ' is-pet' : '') + '" aria-hidden="true"><span>成分名称 / Ingredient</span><span>用量 / Amount</span>' + (isPet ? '' : '<span>% Daily Value</span><span>标志物 mg</span>') + '<span></span></div><div class="pfh-product-development-review-editor-list">' + productDevelopmentOneShotEditorRowsHtml(result) + '</div><button type="button" class="pfh-product-development-one-shot-add" data-action="product-development-one-shot-ingredient-add"' + (Array.isArray(table.rows) && table.rows.length >= 6 ? ' disabled' : '') + '>＋ 添加成分行（最多 6 行）</button>' + validationHtml.replace('<div class="pfh-product-development-one-shot-validation', '<div data-product-development-one-shot-validation class="pfh-product-development-one-shot-validation') + productDevelopmentOneShotPreviewHtml(result) + labelingHtml + warningHtml + '<div class="pfh-product-development-download-row"><button type="button" data-action="product-development-one-shot-download-pdf"' + (validation.valid ? '' : ' disabled') + '>' + (validation.valid ? (isPet ? '导出 Product Facts PDF' : '导出 Supplement Facts PDF') : '修正后导出 PDF') + '</button>' + copywritingAction + '<small>成分表先单独校验；确认后才会把表格内容交给文案生成。格式来自当前选择的模板，模板示例不会直接当作当前产品成分。</small></div></section>';
  }

  function productDevelopmentOneShotEmbeddedHtml(sku) {
    const input = productDevelopmentOneShotInputForRender();
    const template = productDevelopmentOneShotIngredientTemplate();
    const isPet = normalizeProductDevelopmentIngredientKind(template && template.kind) === 'pet';
    const result = state.productDevelopmentOneShotResult && (!sku || state.productDevelopmentOneShotResult.sku === sku)
      ? state.productDevelopmentOneShotResult
      : null;
    const configHtml = result ? '' : '<div class="pfh-product-development-form-grid">' +
      productDevelopmentOneShotFieldHtml(input, 'productType', '产品类型', 'text') +
      productDevelopmentOneShotFieldHtml(input, 'netContent', '净含量', 'text') +
      productDevelopmentOneShotFieldHtml(input, 'servingSize', '每份用量', 'text') +
      productDevelopmentOneShotFieldHtml(input, 'servingsPerContainer', '每瓶份数', 'number') +
      productDevelopmentOneShotFieldHtml(input, 'targetActiveMg', '每份活性目标（可选，mg）', 'number') +
      (isPet ? '' : productDevelopmentOneShotFieldHtml(input, 'targetActivePercent', '标准化活性目标（可选，%）', 'number')) +
      productDevelopmentOneShotFieldHtml(input, 'otherIngredientsEn', isPet ? 'Inactive Ingredients（可选）' : 'Other Ingredients（可选）', 'text', true) +
      productDevelopmentOneShotFieldHtml(input, 'otherIngredientsCn', '其他成分（中文，可选）', 'text', true) +
      '</div>';
    return '<section class="pfh-product-development-detail-form pfh-product-development-one-shot-launch"><header><div><small>STEP 1 → STEP 2 IN EDIT COPYWRITING</small><h3>先生成成分表，再生成文案</h3></div><span>优先使用侵权图纯文字文案，不读取效果图</span></header>' + productDevelopmentOneShotSelectedSourceHtml(sku) + configHtml + '<div class="pfh-product-development-one-shot-launch-actions"><button type="button" class="pfh-product-development-work-card-button" data-action="product-development-copywriting-ingredient-run"' + (state.productDevelopmentOneShotBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentOneShotBusy ? '正在生成成分表…' : result ? '重新生成成分表' : '生成成分表') + '</button><small>先编辑并确认 ' + (isPet ? 'Product Facts' : 'Supplement Facts') + '，确认后才生成文案。</small></div></section>' + productDevelopmentOneShotResultHtml(result);
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

  function productDevelopmentCopywritingHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const currentResult = state.productDevelopmentCopywriting;
    if ((!currentResult || currentResult.sku !== sku) && !(currentResult && currentResult.fromHistory) && sku) restoreProductDevelopmentCopywritingCache(sku);
    const result = state.productDevelopmentCopywriting;
    const content = result && (result.sku === sku || result.fromHistory) ? result.content : null;
    const template = resolveProductDevelopmentCopywritingTemplate();
    const templateOptions = productDevelopmentCopywritingBuiltinTemplates()
      .map((item) => '<option value="' + escapeHtml(item.id) + '"' + (item.id === template.id ? ' selected' : '') + '>' + escapeHtml(item.label + '产品文案模板') + '</option>')
      .concat(state.productDevelopmentTemplateBase64
        ? ['<option value="local"' + (template.id === 'local' ? ' selected' : '') + '>本地自定义模板</option>']
        : [])
      .join('');
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku ? state.productDevelopmentSnapshot : null;
    const snapshotIngredientCount = snapshot && Array.isArray(snapshot.ingredients)
      ? state.productDevelopmentSnapshot.ingredients.length
      : 0;
    const cachedIngredientCount = productDevelopmentCachedIngredientPairs(sku).length;
    const ingredientCount = snapshotIngredientCount || cachedIngredientCount;
    const ingredientSourceLabel = snapshotIngredientCount ? '' : (cachedIngredientCount ? '（本地缓存）' : '');
    const displayError = state.productDevelopmentError || '';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>产品文案</small><h2>生成双语文案</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>生成产品文案 DOCX</h3><p>根据当前产品名称、成分和卖点生成中英文内容，并自动填入 Word 模板。</p></div><button type="button" data-action="product-development-copywriting-run"' + (state.productDevelopmentCopywritingBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentCopywritingBusy ? '正在生成…' : '生成文案 DOCX') + '</button></section>' +
      '<section class="pfh-product-development-template-card"><div><small>文案模板</small><strong>' + escapeHtml(template.label) + '</strong><select class="pfh-product-development-copywriting-template-input" aria-label="选择文案模板">' + templateOptions + '</select></div><label class="pfh-product-development-template-picker">添加或替换本地模板<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="pfh-product-development-template-input"></label>' + (state.productDevelopmentTemplateBase64 ? '<button type="button" data-action="product-development-template-reset">删除本地模板</button>' : '') + '<span>已读取成分：' + escapeHtml(ingredientCount ? String(ingredientCount) + ' 个' + ingredientSourceLabel : '待读取') + '</span><small class="pfh-product-development-template-note">生成时保留所选模板的完整行、图片、备注、字体和列宽，只替换当前 SKU 字段与 A–D 文案。</small></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (displayError ? '<p class="pfh-product-development-error">' + escapeHtml(displayError) + '</p>' : '') +
      (result && content ? '<div class="pfh-product-development-download-row"><button type="button" data-action="product-development-copywriting-download">' + (result.blob ? '下载 ' : '恢复并下载 ') + escapeHtml(result.fileName) + '</button><small>完整 A-D 文案已缓存到本地，刷新页面不会丢失</small></div>' : '') +
      productDevelopmentOneShotEmbeddedHtml(sku) +
      productDevelopmentCopywritingPreviewHtml(content) +
      '<p class="pfh-product-development-note">文案内容和模板信息自动缓存到本地；DOCX 下载文件不会自动上传或修改 PLM。</p></div>';
  }

  function productDevelopmentOneShotInputForRender() {
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

  function productDevelopmentOneShotFieldHtml(input, key, label, type, multiline) {
    const isOptionalTarget = ['targetActiveMg', 'targetActivePercent'].includes(key);
    const value = isOptionalTarget && !(Number(input[key]) > 0) ? '' : String(input[key] || '');
    const control = multiline
      ? '<textarea class="pfh-product-development-review-input" rows="3" data-product-development-one-shot-field="' + escapeHtml(key) + '" spellcheck="false">' + escapeHtml(value) + '</textarea>'
      : '<input type="' + escapeHtml(type || 'text') + '" class="pfh-product-development-review-input" data-product-development-one-shot-field="' + escapeHtml(key) + '" value="' + escapeHtml(value) + '"' + (type === 'number' ? ' step="any"' : '') + '>';
    return '<label class="pfh-product-development-material-field"><span>' + escapeHtml(label) + '</span>' + control + '</label>';
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
    const brand = productDevelopmentCleanText(input.brand || product.brand, 160);
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

  function productDevelopmentOneShotNormalizeResponse(response, input, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(opts.ingredientKind || input && input.ingredientKind);
    const isPet = ingredientKind === 'pet';
    const table = response && response.ingredientTable && typeof response.ingredientTable === 'object' ? response.ingredientTable : {};
    const rawRows = Array.isArray(table.rows) ? table.rows : [];
    const normalizedRows = rawRows.map((row) => {
      const source = row && typeof row === 'object' ? row : {};
      const rawAmount = ['amountText', 'amount', 'amountPerServing', 'quantity', 'dosage', '含量', 'amountMg']
        .map((key) => source[key])
        .find((value) => value !== undefined && value !== null && String(value).trim());
      const parsedAmount = productDevelopmentOneShotParseAmount(rawAmount);
      return {
        ...source,
        amountText: parsedAmount.valid ? parsedAmount.amountText : String(source.amountText || rawAmount || ''),
        amountValue: parsedAmount.valid ? parsedAmount.value : Number(source.amountValue) || 0,
        amountUnit: parsedAmount.valid ? parsedAmount.unit : String(source.amountUnit || ''),
        amountIsMass: Boolean(parsedAmount.valid && parsedAmount.isMass),
        amountMg: parsedAmount.valid && parsedAmount.isMass ? parsedAmount.massMg : 0,
      };
    });
    const frontFacts = productDevelopmentOneShotFrontFacts(input && input.sourcePlainTextCopy);
    const rows = productDevelopmentOneShotApplyFrontFacts(
      productDevelopmentOneShotFrontCopyRows(normalizedRows, input && input.sourcePlainTextCopy),
      frontFacts,
      input && input.sourcePlainTextCopy,
    );
    const otherIngredientsEn = productDevelopmentCleanText(input && input.otherIngredientsEn || (input && input.sourcePlainTextCopy ? '' : table.otherIngredientsEn), 1600);
    const otherIngredientsCn = productDevelopmentCleanText(input && input.otherIngredientsCn || (input && input.sourcePlainTextCopy ? '' : table.otherIngredientsCn), 1200);
    const rowTotalMg = rows.reduce((sum, row) => sum + (Number(row && row.amountMg) || 0), 0);
    const activeTotalMg = productDevelopmentOneShotRounded(rowTotalMg);
    const standardizedActiveMg = productDevelopmentOneShotRounded(rows.reduce((sum, row) => sum + (Number(row && row.markerActiveMg) || 0), 0));
    const standardizedActivePercent = activeTotalMg > 0 ? productDevelopmentOneShotRounded(standardizedActiveMg / activeTotalMg * 100, 2) : 0;
    const targetActiveMg = Number(input && input.targetActiveMg) > 0 ? Number(input.targetActiveMg) : 0;
    const targetActivePercentText = input && input.targetActivePercent !== undefined && input.targetActivePercent !== null
      ? String(input.targetActivePercent).trim()
      : '';
    const targetActivePercent = targetActivePercentText === '' ? 0 : Number(targetActivePercentText);
    const invalidRow = rows.some((row) => !row || !row.nameEn || !row.nameCn || !productDevelopmentOneShotHasMeasuredAmount(productDevelopmentOneShotEditableAmountText(row)));
    const hasMassAmounts = rows.some((row) => row.amountIsMass);
    const allMassAmounts = rows.length > 0 && rows.every((row) => row.amountIsMass);
    if (rows.length < 1 || rows.length > 6 || invalidRow || !Number.isFinite(activeTotalMg) || (targetActiveMg > 0 && allMassAmounts && Math.abs(rowTotalMg - targetActiveMg) > 0.01)) {
      throw new Error('一次生成结果未达到每份活性成分目标');
    }
    if (!isPet && targetActivePercent > 0 && hasMassAmounts && standardizedActivePercent + 0.001 < targetActivePercent) {
      throw new Error('一次生成结果未达到标准化活性目标');
    }
    let content = null;
    if (opts.requireCopywriting !== false) {
      const copySource = response && response.copywriting && typeof response.copywriting === 'object'
        ? (response.copywriting.sections && typeof response.copywriting.sections === 'object' ? response.copywriting.sections : response.copywriting)
        : response && response.sections && typeof response.sections === 'object' ? response.sections : {};
      const provisionalSnapshot = {
        ingredients: rows.map((row) => ({ en: productDevelopmentCleanText(row.nameEn, 300), cn: productDevelopmentCleanText(row.nameCn, 300) })),
        brand: productDevelopmentCleanText(input.brand, 160),
      };
      content = productDevelopmentValidateCopywriting({ sections: copySource }, provisionalSnapshot);
    }
    const snapshot = productDevelopmentOneShotSnapshot(response, input, content, opts);
    const id = 'pd-one-shot-' + Date.now().toString(36);
    const safeName = productDevelopmentSafeFileLabel(snapshot.englishName || snapshot.name || snapshot.sku, 100) || snapshot.sku;
    return {
      id,
      sku: snapshot.sku,
      product: response.product || {},
      snapshot,
      ingredientTable: {
        ...table,
        title: isPet ? 'Product Facts' : 'Supplement Facts',
        servingSize: frontFacts.servingSize || String(table.servingSize || input && input.servingSize || (isPet ? '1 Dropper (1 mL)' : '1 mL')),
        servingsPerContainer: frontFacts.servingsPerContainer || Number(table.servingsPerContainer) || Number(input && input.servingsPerContainer) || 60,
        activeTotalMg: productDevelopmentOneShotRounded(activeTotalMg),
        standardizedActiveMg: productDevelopmentOneShotRounded(standardizedActiveMg),
        standardizedActivePercent: productDevelopmentOneShotRounded(Number.isFinite(standardizedActivePercent) ? standardizedActivePercent : 0, 2),
        requiredActiveMg: targetActiveMg,
        requiredStandardizedActivePercent: targetActivePercent > 0 ? targetActivePercent : 0,
        showFooter: !isPet && table.showFooter !== false,
        otherIngredientsLabel: isPet ? 'Inactive Ingredients' : 'Other Ingredients',
        otherIngredientsEn,
        otherIngredientsCn,
        rows: rows.map((row) => ({ ...row, labelEn: productDevelopmentOneShotIngredientLabel(row, false) })),
      },
      labeling: response && response.labeling && typeof response.labeling === 'object' ? response.labeling : {},
      content,
      ingredientConfirmed: false,
      ingredientKind,
      ingredientTemplateId: productDevelopmentCleanText(opts.ingredientTemplateId, 80),
      ingredientTemplateLabel: productDevelopmentCleanText(opts.ingredientTemplateLabel, 120),
      ingredientTemplateSheetName: productDevelopmentCleanText(opts.ingredientTemplateSheetName, 120),
      copywritingTemplateId: productDevelopmentCleanText(opts.copywritingTemplateId, 80),
      copywritingTemplateLabel: productDevelopmentCleanText(opts.copywritingTemplateLabel, 120),
      warnings: Array.isArray(response && response.warnings) ? response.warnings : [],
      provider: productDevelopmentCleanText(response && response.provider, 80),
      model: productDevelopmentCleanText(response && response.model, 120),
      oneShotRuleVersion: productDevelopmentCleanText(response && response.oneShotRuleVersion || PRODUCT_DEVELOPMENT_ONE_SHOT_RULE_VERSION, 80),
      pdfFileName: productDevelopmentFileDate() + '-' + safeName + '-' + (isPet ? 'Product-Facts' : 'Supplement-Facts') + '.pdf',
      docxFileName: productDevelopmentCopywritingFileName(snapshot),
      pdfBlob: null,
      docxBlob: null,
      createdAt: new Date().toLocaleString(),
    };
  }

  async function productDevelopmentOneShotBuildDocx(result) {
    if (!result || !result.content) throw new Error('请先确认成分表并生成文案');
    const templateId = String(result.copywritingTemplateId || '').trim();
    const template = templateId === 'local'
      ? resolveProductDevelopmentCopywritingTemplate()
      : productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === templateId)
        || productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === 'drops')
        || resolveProductDevelopmentCopywritingTemplate();
    const source = await withCopywritingTimeout(loadProductDevelopmentCopywritingTemplateSource(template), 60000, 'DOCX 模板下载');
    return {
      blob: await withCopywritingTimeout(buildProductDevelopmentDocx(result.content, source, result.snapshot), 180000, 'DOCX 生成'),
      fileName: result.docxFileName,
    };
  }

  function productDevelopmentOneShotPdfAscii(value) {
    let text = String(value === undefined || value === null ? '' : value)
      .replace(/[μµ]/g, 'u')
      .replace(/[–—]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    if (typeof text.normalize === 'function') text = text.normalize('NFKD');
    return text.replace(/[^\x20-\x7e]/g, '?').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function productDevelopmentOneShotPdfNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  function productDevelopmentOneShotPdfEscape(value) {
    return productDevelopmentOneShotPdfAscii(value).replace(/([\\()])/g, '\\$1');
  }

  function productDevelopmentOneShotPdfWidth(value, fontSize) {
    const text = productDevelopmentOneShotPdfAscii(value);
    let units = 0;
    Array.from(text).forEach((character) => {
      if (character === ' ') units += 0.28;
      else if ('ilI.,:;!|'.includes(character)) units += 0.25;
      else if ('MW@#%'.includes(character)) units += 0.82;
      else if ('()[]{}-_/'.includes(character)) units += 0.34;
      else units += /[A-Z0-9]/.test(character) ? 0.58 : 0.5;
    });
    return units * Number(fontSize || 10.812);
  }

  function productDevelopmentOneShotPdfWrapText(value, fontSize, maxWidth) {
    const text = productDevelopmentOneShotPdfAscii(value);
    if (!text) return [];
    const lines = [];
    let line = '';
    const appendToken = (token) => {
      let remaining = String(token || '');
      while (remaining && productDevelopmentOneShotPdfWidth(remaining, fontSize) > maxWidth) {
        let length = 1;
        while (length < remaining.length && productDevelopmentOneShotPdfWidth(remaining.slice(0, length + 1), fontSize) <= maxWidth) length += 1;
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(remaining.slice(0, length));
        remaining = remaining.slice(length);
      }
      if (!remaining) return;
      if (!line) line = remaining;
      else if (productDevelopmentOneShotPdfWidth(line + ' ' + remaining, fontSize) <= maxWidth) line += ' ' + remaining;
      else {
        lines.push(line);
        line = remaining;
      }
    };
    text.split(/\s+/).filter(Boolean).forEach(appendToken);
    if (line) lines.push(line);
    return lines;
  }

  function productDevelopmentOneShotPdfFitText(value, fontSize, maxWidth, minimumSize) {
    let text = productDevelopmentOneShotPdfAscii(value);
    let size = Number(fontSize) || 10.812;
    const min = Number(minimumSize) || 6.6;
    while (size > min && productDevelopmentOneShotPdfWidth(text, size) > maxWidth) size -= 0.2;
    if (productDevelopmentOneShotPdfWidth(text, size) <= maxWidth) return { text, size };
    const suffix = '...';
    while (text.length && productDevelopmentOneShotPdfWidth(text + suffix, size) > maxWidth) text = text.slice(0, -1);
    return { text: (text.trimEnd() || '') + suffix, size };
  }

  function productDevelopmentOneShotPdfEncode(value) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(String(value || ''));
    const text = String(value || '');
    const bytes = new Uint8Array(text.length);
    for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index) & 0xff;
    return bytes;
  }

  function productDevelopmentOneShotPdfFileName(result) {
    const snapshot = result && result.snapshot && typeof result.snapshot === 'object' ? result.snapshot : {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || snapshot.ingredientKind));
    const factsLabel = ingredientKind === 'pet' ? 'Product-Facts' : 'Supplement-Facts';
    const label = productDevelopmentSafeFileLabel(snapshot.englishName || snapshot.name || snapshot.sku || factsLabel, 100) || factsLabel;
    return productDevelopmentFileDate() + '-' + label + '-' + factsLabel + '.pdf';
  }

  function productDevelopmentOneShotBuildPdf(result, options) {
    const validation = options && options.skipValidation
      ? { valid: true, errors: [] }
      : productDevelopmentOneShotApplyDraftMetrics(result);
    if (!validation.valid) throw new Error('成分表仍有问题：' + validation.errors.slice(0, 5).join('；'));
    const table = result.ingredientTable;
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    const pageWidth = 595.25;
    const pageHeight = 841.85;
    const outerLeft = 53.88;
    const outerRight = 538.56;
    const outerTopOffset = 71.88;
    const baseOuterBottomOffset = 432.96;
    const innerLeft = 68.51;
    const thickLeft = 65.76;
    const thickRight = 526.68;
    const thinLeft = 66.36;
    const thinRight = 526.08;
    const amountRight = 465.66;
    const dailyValueRight = 524.94;
    const rowHeight = 30.84;
    const rowLineHeight = 12.83;
    const rowStart = 166.02;
    const bodyFontSize = 10.812;
    const titleFontSize = 24.45;
    const amountRightEdge = isPet ? dailyValueRight : amountRight;
    const rowLayouts = rows.map((row) => {
      const amount = productDevelopmentOneShotEditableAmountText(row);
      const amountWidth = productDevelopmentOneShotPdfWidth(amount, bodyFontSize);
      // Keep the body font size fixed. Long ingredient descriptions wrap in
      // the name column instead of being shrunk or truncated.
      const maxNameWidth = Math.max(120, Math.min(350, amountRightEdge - amountWidth - innerLeft - 18));
      const nameLines = productDevelopmentOneShotPdfWrapText(productDevelopmentOneShotEditableRowLabel(row), bodyFontSize, maxNameWidth);
      return {
        amount,
        nameLines: nameLines.length ? nameLines : [''],
        height: rowHeight + Math.max(0, nameLines.length - 1) * rowLineHeight,
      };
    });
    const totalRowHeight = rowLayouts.reduce((sum, row) => sum + row.height, 0);
    const rowDelta = totalRowHeight - 8 * rowHeight;
    const hasOtherIngredients = Boolean(String(table.otherIngredientsEn || '').trim());
    const otherDelta = hasOtherIngredients ? 30 : 0;
    const outerBottomOffset = baseOuterBottomOffset + rowDelta + otherDelta;
    const finalThickOffset = 400.08 + rowDelta;
    const footerOffset = 413.22 + rowDelta;
    const commands = [];
    const number = productDevelopmentOneShotPdfNumber;
    const rect = (left, right, top, height, fill) => {
      const y = pageHeight - top - height;
      commands.push([number(left), number(y), number(right - left), number(height), 're', fill ? 'f' : 'S'].join(' '));
    };
    const text = (font, size, x, top, value) => {
      const baseline = pageHeight - top - size * 0.79;
      const safe = productDevelopmentOneShotPdfEscape(value);
      if (!safe) return;
      commands.push('BT /' + font + ' ' + number(size) + ' Tf 1 0 0 1 ' + number(x) + ' ' + number(baseline) + ' Tm (' + safe + ') Tj ET');
    };
    const rightText = (font, size, right, top, value) => {
      const safe = productDevelopmentOneShotPdfAscii(value);
      text(font, size, right - productDevelopmentOneShotPdfWidth(safe, size), top, safe);
    };
    commands.push('q 0 0 0 RG 0 0 0 rg 0.6 w');
    rect(outerLeft, outerRight, outerTopOffset, outerBottomOffset - outerTopOffset, false);
    const title = productDevelopmentOneShotPdfFitText(isPet ? 'Product Facts' : 'Supplement Facts', titleFontSize, thickRight - 70.45, 18);
    text('F2', title.size, 70.45, 80.42, title.text);
    text('F1', bodyFontSize, 70.45, 104.08, 'Serving Size ' + (table.servingSize || '1 mL'));
    text('F1', bodyFontSize, 70.45, 116.91, 'Servings Per Container ' + String(table.servingsPerContainer || 60));
    rect(thickLeft, thickRight, 129.84, 1.8, true);
    if (isPet) text('F2', bodyFontSize, innerLeft, 139.58, 'Active Ingredients Per ' + (table.servingSize || '1 Dropper (1 mL)'));
    else {
      text('F2', bodyFontSize, innerLeft, 139.58, 'Amount Per Serving');
      rightText('F2', bodyFontSize, dailyValueRight, 139.58, '% Daily Value');
    }
    rect(thinLeft, thinRight, 153.96, 0.6, true);
    let rowTop = rowStart;
    rowLayouts.forEach((layout, index) => {
      layout.nameLines.forEach((line, lineIndex) => text('F1', bodyFontSize, innerLeft, rowTop + lineIndex * rowLineHeight, line));
      rightText('F1', bodyFontSize, isPet ? dailyValueRight : amountRight, rowTop, layout.amount);
      if (!isPet) rightText('F1', bodyFontSize, dailyValueRight, rowTop, rows[index] && rows[index].dailyValue || '**');
      if (index < rows.length - 1) rect(thinLeft, thinRight, rowTop + 18.78 + Math.max(0, layout.nameLines.length - 1) * rowLineHeight, 0.6, true);
      rowTop += layout.height;
    });
    rect(thickLeft, thickRight, finalThickOffset, 1.8, true);
    if (!isPet && table.showFooter !== false) text('F1', bodyFontSize, innerLeft, footerOffset, '**Daily Value not established.');
    if (hasOtherIngredients) {
      const otherLabel = isPet ? 'Inactive Ingredients' : 'Other Ingredients';
      const otherText = productDevelopmentOneShotPdfFitText(otherLabel + ': ' + table.otherIngredientsEn, 8.6, thickRight - innerLeft - 8, 6.6);
      text('F1', otherText.size, innerLeft, isPet ? footerOffset : footerOffset + 14, otherText.text);
    }
    commands.push('Q');
    const content = commands.join('\n') + '\n';
    const objects = [
      null,
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + number(pageWidth) + ' ' + number(pageHeight) + '] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      '<< /Length ' + productDevelopmentOneShotPdfEncode(content).length + ' >>\nstream\n' + content + 'endstream',
    ];
    const chunks = [];
    let byteLength = 0;
    const append = (value) => {
      const bytes = productDevelopmentOneShotPdfEncode(value);
      chunks.push(bytes);
      byteLength += bytes.length;
    };
    append('%PDF-1.4\n% PLM Supplement Facts\n');
    const offsets = [0];
    for (let index = 1; index < objects.length; index += 1) {
      offsets[index] = byteLength;
      append(index + ' 0 obj\n' + objects[index] + '\nendobj\n');
    }
    const xrefOffset = byteLength;
    append('xref\n0 ' + objects.length + '\n0000000000 65535 f \n');
    for (let index = 1; index < objects.length; index += 1) append(String(offsets[index]).padStart(10, '0') + ' 00000 n \n');
    append('trailer\n<< /Size ' + objects.length + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  async function downloadProductDevelopmentOneShotIngredient() {
    const result = state.productDevelopmentOneShotResult;
    if (!result) {
      showToast('请先完成一次生成');
      return;
    }
    const validation = productDevelopmentOneShotDraftValidation(result);
    if (!validation.valid) {
      state.productDevelopmentStatus = '成分表仍需修正：' + validation.errors.slice(0, 3).join('；');
      showToast('成分表未通过校验，暂不能导出 PDF');
      renderShell();
      return;
    }
    if (!result.pdfBlob) {
      state.productDevelopmentOneShotBusy = true;
      const factsLabel = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind) === 'pet' ? 'Product Facts' : 'Supplement Facts';
      state.productDevelopmentStatus = '正在生成 ' + factsLabel + ' PDF…';
      renderShell();
      try {
        result.pdfBlob = productDevelopmentOneShotBuildPdf(result);
        result.pdfFileName = result.pdfFileName || productDevelopmentOneShotPdfFileName(result);
      } finally {
        state.productDevelopmentOneShotBusy = false;
        renderShell();
      }
    }
    downloadBlob(result.pdfBlob, result.pdfFileName || productDevelopmentOneShotPdfFileName(result));
    const factsLabel = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind) === 'pet' ? 'Product Facts' : 'Supplement Facts';
    state.productDevelopmentStatus = factsLabel + ' PDF 已导出：' + (result.pdfFileName || productDevelopmentOneShotPdfFileName(result));
    showToast(factsLabel + ' PDF 已导出');
    renderShell();
  }

  async function downloadProductDevelopmentOneShotDocx() {
    const result = state.productDevelopmentOneShotResult;
    if (!result || !result.content) {
      showToast('请先确认成分表并生成文案');
      return;
    }
    if (!result.docxBlob) {
      state.productDevelopmentOneShotBusy = true;
      state.productDevelopmentStatus = '正在恢复文案 DOCX…';
      renderShell();
      try {
        const file = await productDevelopmentOneShotBuildDocx(result);
        result.docxBlob = file.blob;
      } finally {
        state.productDevelopmentOneShotBusy = false;
        renderShell();
      }
    }
    downloadBlob(result.docxBlob, result.docxFileName);
  }

  function productDevelopmentOneShotConfirmedIngredientTable(result) {
    const table = result && result.ingredientTable && typeof result.ingredientTable === 'object' ? result.ingredientTable : {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    const rows = Array.isArray(table.rows) ? table.rows.slice(0, 6) : [];
    return {
      title: isPet ? 'Product Facts' : 'Supplement Facts',
      servingSize: productDevelopmentCleanText(table.servingSize || (isPet ? '1 Dropper (1 mL)' : '1 mL'), 80),
      servingsPerContainer: Math.max(1, Math.min(365, Math.round(Number(table.servingsPerContainer) || 60))),
      requiredActiveMg: Number(table.requiredActiveMg) || 0,
      requiredStandardizedActivePercent: Number(table.requiredStandardizedActivePercent) || 0,
      activeTotalMg: Number(table.activeTotalMg) || 0,
      standardizedActiveMg: Number(table.standardizedActiveMg) || 0,
      standardizedActivePercent: Number(table.standardizedActivePercent) || 0,
      otherIngredientsEn: productDevelopmentCleanText(table.otherIngredientsEn, 1600),
      otherIngredientsCn: productDevelopmentCleanText(table.otherIngredientsCn, 1200),
      footnote: productDevelopmentCleanText(table.footnote || '**Daily Value not established.', 180),
      otherIngredientsLabel: isPet ? 'Inactive Ingredients' : 'Other Ingredients',
      showFooter: !isPet && table.showFooter !== false,
      rows: rows.map((row) => ({
        nameEn: productDevelopmentCleanText(productDevelopmentOneShotEditableRowLabel(row) || row && row.nameEn, 300),
        nameCn: productDevelopmentCleanText(row && row.nameCn, 300),
        labelEn: productDevelopmentCleanText(productDevelopmentOneShotEditableRowLabel(row), 600),
        latinName: productDevelopmentCleanText(row && row.latinName, 220),
        sourcePart: productDevelopmentCleanText(row && row.sourcePart, 160),
        standardization: productDevelopmentCleanText(row && row.standardization, 220),
        amountMg: Number(row && row.amountMg) || 0,
        amountText: productDevelopmentCleanText(productDevelopmentOneShotEditableAmountText(row), 80),
        dailyValue: productDevelopmentCleanText(row && row.dailyValue || '**', 40),
        markerActiveMg: Number(row && row.markerActiveMg) || 0,
      })),
    };
  }

  function productDevelopmentOneShotConfirmedIngredients(result) {
    const table = productDevelopmentOneShotConfirmedIngredientTable(result);
    return table.rows.map((row) => ({ en: row.nameEn, cn: row.nameCn })).filter((row) => row.en && row.cn);
  }

  async function runProductDevelopmentIngredientTable() {
    if (state.productDevelopmentOneShotBusy) return;
    const currentSku = getProductDevelopmentCurrentSku();
    if (!currentSku) {
      showToast('请先在编辑文案页选择当前 SKU');
      return;
    }
    state.productDevelopmentOneShotBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentOneShotIngredientConfirmed = false;
    state.productDevelopmentStatus = '正在读取当前 SKU 的产品类型、对标图和模板…';
    renderShell();
    let stage = '读取当前 SKU 资料';
    try {
      stage = '加载云端成分表模板';
      state.productDevelopmentStatus = '正在加载云端成分表模板…';
      renderShell();
      await ensureProductDevelopmentIngredientTemplatesLoaded();
      state.productDevelopmentStatus = '正在读取当前 SKU 的产品类型、对标图和模板…';
      renderShell();
      restoreProductDevelopmentReviewDraft(currentSku);
      const existingPlainTextCopy = productDevelopmentOneShotPlainTextCopy(currentSku, null);
      const snapshot = await withCopywritingTimeout(
        loadProductDevelopmentSnapshot(currentSku, false, { requireIngredients: false, includeImage: !existingPlainTextCopy, imageKind: 'benchmark' }),
        180000,
        '当前 SKU 资料读取',
      );
      state.productDevelopmentSnapshot = snapshot;
      const ingredientTemplate = productDevelopmentOneShotIngredientTemplate();
      if (!ingredientTemplate) throw new Error('当前没有可用成分表模板，请先选择模板');
      const ingredientKind = normalizeProductDevelopmentIngredientKind(ingredientTemplate.kind);
      state.productDevelopmentIngredientKind = ingredientKind;
      state.productDevelopmentIngredientTemplateId = ingredientTemplate.id;
      const copywritingTemplate = resolveProductDevelopmentCopywritingTemplate();
      const ingredientTemplateId = ingredientTemplate && ingredientTemplate.id || '';
      const ingredientTemplateLabel = ingredientTemplate && productDevelopmentCleanText(ingredientTemplate.label || ingredientTemplate.fileName, 120) || '人类食品成分表';
      const requestedSheetName = productDevelopmentCleanText(state.productDevelopmentIngredientSheetName, 120);
      const ingredientTemplateSheetName = productDevelopmentOneShotIngredientTemplateSheets(ingredientTemplate)
        .some((sheet) => String(sheet.name || '').trim() === requestedSheetName)
        ? requestedSheetName
        : '';
      state.productDevelopmentIngredientSheetName = ingredientTemplateSheetName;
      const copywritingTemplateId = copywritingTemplate && copywritingTemplate.id || '';
      const copywritingTemplateLabel = copywritingTemplate && productDevelopmentCleanText(copywritingTemplate.label, 120) || '当前选择的文案模板';
      const referenceUrl = productDevelopmentCleanText(snapshot.referenceUrl || '', 1200);
      const sourcePlainTextCopy = productDevelopmentOneShotPlainTextCopy(currentSku, snapshot);
      const templateDefaults = productDevelopmentOneShotTemplateDefaults(ingredientTemplate, ingredientTemplateSheetName, [snapshot.name, snapshot.productType, snapshot.englishName, sourcePlainTextCopy].filter(Boolean).join(' '));
      let input = productDevelopmentOneShotInputValue({
        ...state.productDevelopmentOneShotInput,
        sku: snapshot.sku,
        brand: snapshot.brand || state.productDevelopmentOneShotInput && state.productDevelopmentOneShotInput.brand || '',
        nameCn: snapshot.name || state.productDevelopmentOneShotInput && state.productDevelopmentOneShotInput.nameCn || '',
        nameEn: productDevelopmentEntryEnglishProductName(snapshot)
          || snapshot.englishName
          || state.productDevelopmentOneShotInput && state.productDevelopmentOneShotInput.nameEn
          || '',
        netContent: snapshot.netContent || state.productDevelopmentOneShotInput && state.productDevelopmentOneShotInput.netContent || PRODUCT_DEVELOPMENT_ONE_SHOT_DEFAULT_INPUT.netContent,
        referenceUrl: /^https?:\/\//i.test(referenceUrl) ? referenceUrl : '',
      });
      input = productDevelopmentOneShotApplyTemplateDefaults(input, ingredientTemplate, ingredientTemplateSheetName, { force: false });
      input.sourcePlainTextCopy = sourcePlainTextCopy;
      saveProductDevelopmentOneShotDraft(input);
      state.productDevelopmentOneShotInput = input;
      if (!snapshot.imageUrl && !sourcePlainTextCopy && !input.referenceUrl) throw new Error('当前 SKU 没有对标图片或纯文字文案版本');
      const ingredientSelectionLabel = ingredientTemplateLabel + (ingredientTemplateSheetName ? ' / ' + ingredientTemplateSheetName : '');
      state.productDevelopmentStatus = '正在按“' + ingredientSelectionLabel + '”和' + (sourcePlainTextCopy ? '侵权图纯文字文案' : '当前产品资料') + '生成成分表，最长等待约 10 分钟…';
      renderShell();
      stage = '读取当前 SKU 对标图';
      let image = '';
      if (!sourcePlainTextCopy && snapshot.imageUrl) {
        const imageResult = await withCopywritingTimeout(
          productDevelopmentFetchImage(snapshot.imageUrl, snapshot.imageFallbackUrl),
          60000,
          '对标图片读取',
        );
        image = imageResult && imageResult.dataUrl ? String(imageResult.dataUrl) : '';
        if (!/^data:image\//i.test(image)) throw new Error('当前 SKU 对标图片无法转换为可提交的图片');
        image = await productDevelopmentOneShotOptimizeImage(image);
      }
      stage = '生成成分表';
      const response = await withCopywritingTimeout(cloudRequest('/ai-image/product-development-one-shot', {
        method: 'POST',
        timeoutMs: 600000,
        body: {
          ...input,
          kind: ingredientKind,
          stage: 'ingredient',
          mode: 'ingredient',
          referenceUrl: input.referenceUrl,
          imageDataUrl: image,
          sourcePlainTextCopy,
          ingredientTemplateId,
          ingredientTemplateLabel,
          ingredientTemplateSheetName,
          ingredientTemplateSheetHeader: templateDefaults.resolvedSheetHeader,
          copywritingTemplateId,
          copywritingTemplateLabel,
          productAttributes: {
            sku: snapshot.sku,
            ingredientKind,
            brand: snapshot.brand,
            nameCn: snapshot.name,
            nameEn: productDevelopmentEntryEnglishProductName(snapshot) || snapshot.englishName,
            productType: input.productType,
            netContent: input.netContent,
            servingSize: input.servingSize,
            servingsPerContainer: input.servingsPerContainer,
            requestedFunctions: input.requestedFunctions,
            sourcePlainTextCopy,
            ingredientTemplateId,
            ingredientTemplateLabel,
            ingredientTemplateSheetName,
            ingredientTemplateSheetHeader: templateDefaults.resolvedSheetHeader,
            copywritingTemplateId,
            copywritingTemplateLabel,
          },
        },
      }), 620000, '成分表生成');
      state.productDevelopmentStatus = '正在校验成分表目标和模板字段…';
      renderShell();
      const result = productDevelopmentOneShotNormalizeResponse(response, input, {
        requireCopywriting: false,
        ingredientKind,
        ingredientTemplateId,
        ingredientTemplateLabel,
        ingredientTemplateSheetName,
        ingredientTemplateSheetHeader: templateDefaults.resolvedSheetHeader,
        copywritingTemplateId,
        copywritingTemplateLabel,
      });
      result.snapshot = {
        ...result.snapshot,
        sku: snapshot.sku || result.snapshot.sku,
        name: snapshot.name || result.snapshot.name,
        englishName: productDevelopmentEntryEnglishProductName(snapshot) || snapshot.englishName || result.snapshot.englishName,
        brand: snapshot.brand || result.snapshot.brand,
        productType: input.productType || snapshot.productType || result.snapshot.productType,
        netContent: snapshot.netContent || result.snapshot.netContent,
        imageUrl: snapshot.imageUrl,
        imageFallbackUrl: snapshot.imageFallbackUrl,
        imageKind: snapshot.imageKind === 'benchmark' ? 'benchmark' : 'none',
        imageSource: snapshot.imageSource || (sourcePlainTextCopy ? '已确认纯文字文案' : 'PLM 只读对标图片'),
        referenceUrl: input.referenceUrl,
        ingredientFunctions: snapshot.ingredientFunctions || { en: '', cn: '' },
        sourcePlainTextCopy,
        sourceCopywriting: snapshot.sourceCopywriting || { efficacy: {}, advantages: {}, sellingPoints: {}, usage: {} },
        labeling: result.labeling,
        ingredientTable: result.ingredientTable,
      };
      productDevelopmentOneShotApplyDraftMetrics(result);
      result.stage = 'ingredient';
      result.ingredientConfirmed = false;
      result.copywritingTemplateId = copywritingTemplateId;
      result.copywritingTemplateLabel = copywritingTemplateLabel;
      result.ingredientKind = ingredientKind;
      result.ingredientTemplateSheetName = ingredientTemplateSheetName;
      result.ingredientTemplateSheetHeader = templateDefaults.resolvedSheetHeader;
      if (state.productDevelopmentCopywriting && String(state.productDevelopmentCopywriting.id || '').startsWith('pd-one-shot-')) state.productDevelopmentCopywriting = null;
      state.productDevelopmentOneShotResult = result;
      const validation = productDevelopmentOneShotDraftValidation(result);
      state.productDevelopmentStatus = validation.valid
        ? '成分表草稿已生成，请编辑并确认；确认后才会生成文案'
        : '成分表草稿已生成，但仍需修正后才能确认和导出 PDF';
      showToast('成分表草稿已生成，请编辑并确认');
    } catch (error) {
      productDevelopmentLog('error', '成分表生成失败', 'SKU=' + currentSku + ' | 阶段=' + stage + ' | ' + formatErrorMessage(error));
      state.productDevelopmentError = formatErrorMessage(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    } finally {
      state.productDevelopmentOneShotBusy = false;
      renderShell();
    }
  }

  async function runProductDevelopmentCopywritingFromIngredientTable() {
    if (state.productDevelopmentOneShotBusy) return;
    const currentSku = getProductDevelopmentCurrentSku();
    const result = state.productDevelopmentOneShotResult;
    if (!currentSku) {
      showToast('请先在编辑文案页选择当前 SKU');
      return;
    }
    if (!result || result.sku !== currentSku || !result.ingredientTable) {
      showToast('请先生成当前 SKU 的成分表');
      return;
    }
    const validation = productDevelopmentOneShotDraftValidation(result);
    if (!validation.valid) {
      state.productDevelopmentStatus = '成分表仍需修正：' + validation.errors.slice(0, 3).join('；');
      showToast('请先修正成分表，再确认生成文案');
      renderShell();
      return;
    }
    const confirmedTable = productDevelopmentOneShotConfirmedIngredientTable(result);
    const ingredients = productDevelopmentOneShotConfirmedIngredients(result);
    if (ingredients.length !== confirmedTable.rows.length) {
      showToast('每一行成分都需要填写中英文名称');
      return;
    }
    const sourceSnapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === currentSku
      ? state.productDevelopmentSnapshot
      : result.snapshot || {};
    const copywritingTemplate = resolveProductDevelopmentCopywritingTemplate();
    const copySnapshot = {
      ...result.snapshot,
      sku: currentSku,
      ingredientKind: result.ingredientKind || result.snapshot.ingredientKind || normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind),
      name: sourceSnapshot.name || result.snapshot.name,
      englishName: productDevelopmentEntryEnglishProductName(sourceSnapshot) || sourceSnapshot.englishName || result.snapshot.englishName,
      brand: sourceSnapshot.brand || result.snapshot.brand,
      productType: result.snapshot.productType || sourceSnapshot.productType,
      netContent: sourceSnapshot.netContent || result.snapshot.netContent,
      referenceUrl: result.snapshot.referenceUrl || sourceSnapshot.referenceUrl || '',
      ingredients,
      ingredientSummary: {
        en: confirmedTable.rows.map((row) => row.labelEn + ' ' + row.amountText).join(', '),
        cn: confirmedTable.rows.map((row) => row.nameCn + ' ' + row.amountText).join('、'),
      },
      ingredientFunctions: sourceSnapshot.ingredientFunctions || result.snapshot.ingredientFunctions || { en: '', cn: '' },
      sourcePlainTextCopy: result.snapshot.sourcePlainTextCopy || productDevelopmentOneShotPlainTextCopy(currentSku, sourceSnapshot),
      sourceCopywriting: sourceSnapshot.sourceCopywriting || result.snapshot.sourceCopywriting || { efficacy: {}, advantages: {}, sellingPoints: {}, usage: {} },
      labeling: result.labeling || {},
      ingredientTable: confirmedTable,
    };
    state.productDevelopmentOneShotBusy = true;
    state.productDevelopmentOneShotIngredientConfirmed = true;
    result.ingredientConfirmed = true;
    result.ingredientConfirmedAt = Date.now();
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '成分表已确认，正在按“' + copywritingTemplate.label + '”模板生成文案…';
    renderShell();
    let stage = '准备文案生成';
    const startedAt = Date.now();
    try {
      stage = '生成 A-D 文案';
      const response = await withCopywritingTimeout(cloudRequest('/ai-image/product-development-copywriting', {
        method: 'POST',
        timeoutMs: 600000,
        body: {
          sku: currentSku,
          name: copySnapshot.name,
          productType: copySnapshot.productType,
          netContent: copySnapshot.netContent,
          brand: copySnapshot.brand,
          ingredients,
          ingredientSummary: copySnapshot.ingredientSummary,
          ingredientFunctions: copySnapshot.ingredientFunctions,
          sourcePlainTextCopy: copySnapshot.sourcePlainTextCopy,
          sourceCopywriting: copySnapshot.sourceCopywriting,
          ingredientTable: confirmedTable,
          confirmedIngredientTable: true,
          ingredientKind: copySnapshot.ingredientKind,
          ingredientTemplateId: result.ingredientTemplateId || '',
          ingredientTemplateLabel: result.ingredientTemplateLabel || '',
          ingredientTemplateSheetName: result.ingredientTemplateSheetName || '',
          ingredientTemplateSheetHeader: result.ingredientTemplateSheetHeader || '',
          templateVersion: copywritingTemplate.version,
          templateId: copywritingTemplate.id,
          templateLabel: copywritingTemplate.label,
        },
      }), 620000, 'AI 文案生成');
      stage = '校验 A-D 文案';
      const content = productDevelopmentValidateCopywriting(response, copySnapshot);
      const id = result.id + '-copy';
      const fileName = productDevelopmentCopywritingFileName(copySnapshot);
      const copyResult = {
        id,
        sku: currentSku,
        content,
        snapshot: copySnapshot,
        blob: null,
        fileName,
        provider: productDevelopmentCleanText(response && response.provider, 80),
        model: productDevelopmentCleanText(response && response.model, 120),
        templateVersion: copywritingTemplate.version,
        templateId: copywritingTemplate.id,
        templateLabel: copywritingTemplate.label,
        createdAt: new Date().toLocaleString(),
        updatedAt: Date.now(),
        fromCache: false,
      };
      state.productDevelopmentCopywriting = copyResult;
      saveProductDevelopmentCopywritingCache(copyResult);
      saveProductDevelopmentHistory({
        id,
        sku: currentSku,
        name: copySnapshot.name,
        kind: 'copywriting',
        createdAt: copyResult.createdAt,
        fileName,
        itemCount: content.efficacy.length + content.advantages.length + content.sellingPoints.length + content.ingredientFunctions.length,
        templateVersion: copyResult.templateVersion,
      });
      result.snapshot = copySnapshot;
      result.content = content;
      result.stage = 'copywriting';
      result.copywritingTemplateId = copywritingTemplate.id;
      result.copywritingTemplateLabel = copywritingTemplate.label;
      result.docxFileName = fileName;
      result.docxBlob = null;
      state.productDevelopmentOneShotResult = result;
      state.productDevelopmentStatus = '文案已生成，正在按所选模板生成 DOCX…';
      renderShell();
      stage = '生成 DOCX';
      const templateSource = await withCopywritingTimeout(loadProductDevelopmentCopywritingTemplateSource(copywritingTemplate), 60000, 'DOCX 模板下载');
      const blob = await withCopywritingTimeout(buildProductDevelopmentDocx(content, templateSource, copySnapshot), 180000, 'DOCX 生成');
      result.docxBlob = blob;
      copyResult.blob = blob;
      state.productDevelopmentStatus = '成分表已确认，文案 DOCX 已按“' + copywritingTemplate.label + '”模板生成';
      productDevelopmentLog('success', '确认成分表后文案生成完成', currentSku + ' | 模板=' + copywritingTemplate.id + ' | 用时=' + (Date.now() - startedAt) + 'ms');
      showToast('成分表已确认，文案 DOCX 已生成');
    } catch (error) {
      productDevelopmentLog('error', '确认成分表后文案生成失败', 'SKU=' + currentSku + ' | 阶段=' + stage + ' | ' + formatErrorMessage(error));
      state.productDevelopmentError = productDevelopmentFriendlyCopywritingError(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    } finally {
      state.productDevelopmentOneShotBusy = false;
      renderShell();
    }
  }

  function normalizeProductDevelopmentIngredientKind(value) {
    return String(value || '').trim().toLowerCase() === 'pet' ? 'pet' : 'human';
  }

  function productDevelopmentIngredientTemplates(kind) {
    const normalizedKind = normalizeProductDevelopmentIngredientKind(kind);
    return productDevelopmentIngredientTemplatesData()
      .filter((item) => item && normalizeProductDevelopmentIngredientKind(item.kind) === normalizedKind);
  }

  function productDevelopmentIngredientSelectedTemplate(kind, templateId) {
    const templates = productDevelopmentIngredientTemplates(kind);
    return templates.find((item) => item.id === templateId) || templates[0] || null;
  }

  function productDevelopmentOneShotClearResultForIngredientSelection(template, sheetName) {
    const currentSku = getProductDevelopmentCurrentSku();
    const result = state.productDevelopmentOneShotResult;
    const selectedKind = normalizeProductDevelopmentIngredientKind(template && template.kind);
    const selectedTemplateId = String(template && template.id || '').trim();
    const selectedSheetName = String(sheetName || '').trim();
    const resultMatches = result && result.sku === currentSku
      && normalizeProductDevelopmentIngredientKind(result.ingredientKind || selectedKind) === selectedKind
      && String(result.ingredientTemplateId || '') === selectedTemplateId
      && String(result.ingredientTemplateSheetName || '') === selectedSheetName;
    if (result && result.sku === currentSku && !resultMatches) {
      state.productDevelopmentOneShotResult = null;
      state.productDevelopmentOneShotIngredientConfirmed = false;
      return true;
    }
    return false;
  }

  function productDevelopmentOneShotSwitchIngredientTemplate(templateId) {
    const template = productDevelopmentIngredientTemplateById(templateId);
    if (!template) {
      state.productDevelopmentError = '成分表模板不存在，请重新选择';
      renderShell();
      return;
    }
    const previousKind = normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind);
    const kind = normalizeProductDevelopmentIngredientKind(template.kind);
    state.productDevelopmentIngredientKind = kind;
    state.productDevelopmentIngredientTemplateId = template.id;
    state.productDevelopmentIngredientSheetName = '';
    const currentInput = productDevelopmentOneShotApplyTemplateDefaults(
      state.productDevelopmentOneShotInput,
      template,
      '',
      { force: previousKind !== kind },
    );
    state.productDevelopmentOneShotInput = saveProductDevelopmentOneShotDraft(currentInput);
    const cleared = productDevelopmentOneShotClearResultForIngredientSelection(template, '');
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = cleared
      ? '已切换为“' + template.label + '”，请重新生成成分表'
      : '已选择成分表模板：' + template.label;
    renderShell();
  }

  function productDevelopmentOneShotSwitchIngredientSheet(sheetName) {
    const template = productDevelopmentOneShotIngredientTemplate();
    const sheets = productDevelopmentOneShotIngredientTemplateSheets(template);
    const requested = String(sheetName || '').trim();
    const selected = requested && sheets.some((sheet) => String(sheet.name || '').trim() === requested) ? requested : '';
    state.productDevelopmentIngredientSheetName = selected;
    state.productDevelopmentOneShotInput = saveProductDevelopmentOneShotDraft(productDevelopmentOneShotApplyTemplateDefaults(
      state.productDevelopmentOneShotInput,
      template,
      selected,
      { force: false },
    ));
    const cleared = productDevelopmentOneShotClearResultForIngredientSelection(template, selected);
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = cleared
      ? '已切换参考工作表，请重新生成成分表'
      : selected ? '已选择参考工作表：' + selected : '已设为自动匹配参考工作表';
    renderShell();
  }

  function productDevelopmentIngredientDraftKey(kind, templateId, sheetName) {
    return [normalizeProductDevelopmentIngredientKind(kind), String(templateId || ''), String(sheetName || '')].join('|');
  }

  function productDevelopmentIngredientDraft(kind, templateId, sheetName) {
    const stored = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_INGREDIENT_DRAFT_KEY, null);
    const source = stored && stored.drafts && typeof stored.drafts === 'object' ? stored.drafts : {};
    const raw = source[productDevelopmentIngredientDraftKey(kind, templateId, sheetName)];
    const values = raw && raw.values && typeof raw.values === 'object' ? raw.values : {};
    const normalizedValues = {};
    Object.keys(values).slice(0, PRODUCT_DEVELOPMENT_INGREDIENT_MAX_CELLS).forEach((address) => {
      const value = values[address];
      if (/^[A-Z]{1,3}[1-9]\d{0,5}$/.test(address) && (typeof value === 'string' || typeof value === 'number')) {
        normalizedValues[address] = String(value).slice(0, 6000);
      }
    });
    return { values: normalizedValues };
  }

  function saveProductDevelopmentIngredientEditorDraft(editor) {
    if (!editor || !editor.templateId || !editor.sheetName || !Array.isArray(editor.cells)) return false;
    const values = {};
    editor.cells.slice(0, PRODUCT_DEVELOPMENT_INGREDIENT_MAX_CELLS).forEach((cell) => {
      if (!cell || !cell.address) return;
      const current = String(cell.value === undefined || cell.value === null ? '' : cell.value);
      if (current !== String(cell.original === undefined || cell.original === null ? '' : cell.original)) {
        values[cell.address] = current.slice(0, 6000);
      }
    });
    const stored = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_INGREDIENT_DRAFT_KEY, null);
    const drafts = stored && stored.drafts && typeof stored.drafts === 'object' ? { ...stored.drafts } : {};
    const key = productDevelopmentIngredientDraftKey(editor.kind, editor.templateId, editor.sheetName);
    drafts[key] = { kind: editor.kind, templateId: editor.templateId, sheetName: editor.sheetName, values, updatedAt: Date.now() };
    const recent = Object.entries(drafts)
      .sort((a, b) => Number(b[1] && b[1].updatedAt) - Number(a[1] && a[1].updatedAt))
      .slice(0, 40);
    const retained = {};
    recent.forEach(([entryKey, entry]) => { retained[entryKey] = entry; });
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_INGREDIENT_DRAFT_KEY, { version: 1, drafts: retained });
    return true;
  }

  function scheduleProductDevelopmentIngredientEditorDraftSave(editor) {
    if (!editor || !editor.templateId || !editor.sheetName) return;
    const key = productDevelopmentIngredientDraftKey(editor.kind, editor.templateId, editor.sheetName);
    if (state.productDevelopmentIngredientDraftTimer) window.clearTimeout(state.productDevelopmentIngredientDraftTimer);
    state.productDevelopmentIngredientDraftTimer = window.setTimeout(() => {
      state.productDevelopmentIngredientDraftTimer = 0;
      saveProductDevelopmentIngredientEditorDraft(editor);
    }, 300);
  }

  function productDevelopmentIngredientCellText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (Array.isArray(value.richText)) return value.richText.map((part) => String(part && part.text || '')).join('');
      if (Object.prototype.hasOwnProperty.call(value, 'text')) return String(value.text || '');
      if (Object.prototype.hasOwnProperty.call(value, 'result')) return String(value.result === null || value.result === undefined ? '' : value.result);
      if (Object.prototype.hasOwnProperty.call(value, 'formula')) return String(value.formula || '');
    }
    return String(value);
  }

  function productDevelopmentIngredientExtractCells(worksheet) {
    const source = worksheet && Array.isArray(worksheet.cells) ? worksheet.cells : [];
    const cells = source.slice(0, PRODUCT_DEVELOPMENT_INGREDIENT_MAX_CELLS).map((cell) => {
      const rowNumber = Number(cell && cell.row) || 0;
      const column = Number(cell && cell.column) || 0;
      const address = String(cell && cell.address || '').trim().toUpperCase();
      const value = productDevelopmentIngredientCellText(cell && cell.value).replace(/\r\n?/g, '\n').slice(0, 6000);
      if (!rowNumber || rowNumber > 120 || !column || column > 40 || !address || !value) return null;
      return { address, row: rowNumber, column, original: value, value };
    }).filter(Boolean);
    return cells.length ? cells : [{ address: 'A1', row: 1, column: 1, original: '', value: '' }];
  }

  async function loadProductDevelopmentIngredientEditor() {
    const token = Number(state.productDevelopmentIngredientLoadToken || 0) + 1;
    state.productDevelopmentIngredientLoadToken = token;
    const kind = normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind);
    state.productDevelopmentIngredientKind = kind;
    state.productDevelopmentIngredientEditor = null;
    state.productDevelopmentIngredientBusy = true;
    state.productDevelopmentIngredientError = '';
    state.productDevelopmentIngredientStatus = '正在从云端加载成分表模板…';
    renderShell();
    try {
      await ensureProductDevelopmentIngredientTemplatesLoaded();
      if (token !== Number(state.productDevelopmentIngredientLoadToken || 0) || state.productDevelopmentView !== 'ingredient') return;
      const template = productDevelopmentIngredientSelectedTemplate(kind, state.productDevelopmentIngredientTemplateId);
      if (!template) throw new Error('当前类型没有可用成分表模板');
      state.productDevelopmentIngredientTemplateId = template.id;
      state.productDevelopmentIngredientStatus = '正在加载云端模板摘要…';
      renderShell();
      const sheets = Array.isArray(template.sheets) ? template.sheets : [];
      const sheetNames = sheets.map((sheet) => String(sheet && sheet.name || '')).filter(Boolean);
      if (!sheetNames.length) throw new Error('模板没有可用工作表');
      const requestedSheet = String(state.productDevelopmentIngredientSheetName || '');
      const sheetName = sheetNames.includes(requestedSheet) ? requestedSheet : sheetNames[0];
      const worksheet = sheets.find((sheet) => String(sheet && sheet.name || '') === sheetName) || sheets[0];
      const draft = productDevelopmentIngredientDraft(kind, template.id, worksheet.name);
      const cells = productDevelopmentIngredientExtractCells(worksheet);
      cells.forEach((cell) => {
        if (Object.prototype.hasOwnProperty.call(draft.values, cell.address)) cell.value = draft.values[cell.address];
      });
      if (token !== Number(state.productDevelopmentIngredientLoadToken || 0) || state.productDevelopmentView !== 'ingredient') return;
      state.productDevelopmentIngredientSheetName = worksheet.name;
      state.productDevelopmentIngredientEditor = {
        kind,
        templateId: template.id,
        sheetName: worksheet.name,
        sheetNames,
        cells,
      };
      state.productDevelopmentIngredientBusy = false;
      state.productDevelopmentIngredientError = '';
      state.productDevelopmentIngredientStatus = '云端模板已加载，可修改文字后保存或导出 PDF';
      renderShell();
    } catch (error) {
      if (token !== Number(state.productDevelopmentIngredientLoadToken || 0)) return;
      state.productDevelopmentIngredientBusy = false;
      state.productDevelopmentIngredientEditor = null;
      state.productDevelopmentIngredientError = formatErrorMessage(error);
      state.productDevelopmentIngredientStatus = '';
      renderShell();
    }
  }

  function productDevelopmentIngredientSwitchSelection(kind, templateId, sheetName) {
    if (state.productDevelopmentIngredientEditor) saveProductDevelopmentIngredientEditorDraft(state.productDevelopmentIngredientEditor);
    const normalizedKind = normalizeProductDevelopmentIngredientKind(kind);
    const template = productDevelopmentIngredientSelectedTemplate(normalizedKind, templateId);
    state.productDevelopmentIngredientKind = normalizedKind;
    state.productDevelopmentIngredientTemplateId = template ? template.id : '';
    state.productDevelopmentIngredientSheetName = String(sheetName || '');
    state.productDevelopmentIngredientEditor = null;
    state.productDevelopmentIngredientError = '';
    state.productDevelopmentIngredientStatus = '';
    renderShell();
    loadProductDevelopmentIngredientEditor();
  }

  function productDevelopmentIngredientCellInputHtml(cell) {
    const address = String(cell && cell.address || 'A1');
    const rawValue = cell && cell.value !== undefined && cell.value !== null ? cell.value : '';
    const value = String(rawValue);
    const multiline = value.includes('\n') || value.length > 140;
    const control = multiline
      ? '<textarea class="pfh-product-development-review-input pfh-product-development-ingredient-cell-input" rows="3" data-product-development-ingredient-cell="' + escapeHtml(address) + '" spellcheck="false">' + escapeHtml(value) + '</textarea>'
      : '<input type="text" class="pfh-product-development-review-input pfh-product-development-ingredient-cell-input" data-product-development-ingredient-cell="' + escapeHtml(address) + '" value="' + escapeHtml(value) + '" spellcheck="false">';
    return '<div class="pfh-product-development-review-editor-row"><div class="pfh-product-development-review-editor-head"><b>' + escapeHtml(address) + '</b><span>模板单元格</span></div><label>内容' + control + '</label></div>';
  }

  function productDevelopmentIngredientEditorHtml(editor) {
    if (!editor) return '<div class="pfh-product-development-result-empty">选择模板后会显示可编辑内容。</div>';
    const cells = Array.isArray(editor.cells) ? editor.cells : [];
    return '<section class="pfh-product-development-review-editor"><header><div><small>云端模板摘要</small><h3>编辑当前工作表</h3></div><span>' + cells.length + ' 个可编辑单元格</span></header><p class="pfh-product-development-form-note">以下文字来自云端模板摘要；修改后按原成分表 PDF 版式导出，不需要导入模板文件。</p><div class="pfh-product-development-review-editor-list">' + cells.map(productDevelopmentIngredientCellInputHtml).join('') + '</div></section>';
  }

  function productDevelopmentIngredientFactsHtml() {
    const kind = normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind);
    const templates = productDevelopmentIngredientTemplates(kind);
    const template = productDevelopmentIngredientSelectedTemplate(kind, state.productDevelopmentIngredientTemplateId);
    const editor = state.productDevelopmentIngredientEditor && state.productDevelopmentIngredientEditor.templateId === (template && template.id)
      ? state.productDevelopmentIngredientEditor
      : null;
    state.productDevelopmentIngredientKind = kind;
    state.productDevelopmentIngredientTemplateId = template ? template.id : '';
    const sheetNames = editor && Array.isArray(editor.sheetNames) ? editor.sheetNames : [];
    const selectedSheet = editor ? editor.sheetName : state.productDevelopmentIngredientSheetName;
    const typeOptions = [['human', '人类食品'], ['pet', '宠物食品']].map((item) => '<option value="' + item[0] + '"' + (item[0] === kind ? ' selected' : '') + '>' + item[1] + '</option>').join('');
    const templateOptions = templates.map((item) => '<option value="' + escapeHtml(item.id) + '"' + (item.id === (template && template.id) ? ' selected' : '') + '>' + escapeHtml(item.label) + '</option>').join('');
    const sheetOptions = sheetNames.length
      ? sheetNames.map((name) => '<option value="' + escapeHtml(name) + '"' + (name === selectedSheet ? ' selected' : '') + '>' + escapeHtml(name) + '</option>').join('')
      : '<option value="">' + (state.productDevelopmentIngredientBusy ? '正在加载工作表…' : '请先选择内置模板') + '</option>';
    const canExport = Boolean(editor && !state.productDevelopmentIngredientBusy);
    const factsLabel = kind === 'pet' ? 'Product Facts' : 'Supplement Facts';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>INGREDIENT TABLE</small><h2>制作成分表</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>编辑成分表内容</h3><p>按需从云端加载模板摘要，选择食品类型和工作表后直接编辑；完成后按原来的 ' + factsLabel + ' 版式导出 PDF。</p></div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-ingredient-save-local"' + (canExport ? '' : ' disabled') + '>保存本地</button><button type="button" data-action="product-development-ingredient-export"' + (canExport ? '' : ' disabled') + '>导出 ' + factsLabel + ' PDF</button></div></section>' +
      '<section class="pfh-product-development-detail-form"><header><div><small>模板选择</small><h3>人类食品 / 宠物食品</h3></div><span>' + (template ? '云端模板摘要' : '暂无模板') + '</span></header><div class="pfh-product-development-form-grid">' +
        '<label class="pfh-product-development-material-field"><span>食品类型</span><select class="pfh-product-development-ingredient-kind-input">' + typeOptions + '</select></label>' +
        '<label class="pfh-product-development-material-field"><span>成分表模板</span><select class="pfh-product-development-ingredient-template-input">' + (templateOptions || (state.productDevelopmentIngredientBusy ? '<option value="">正在加载云端模板…</option>' : '<option value="">暂无模板</option>')) + '</select></label>' +
        '<label class="pfh-product-development-material-field"><span>工作表</span><select class="pfh-product-development-ingredient-sheet-input"' + (sheetNames.length ? '' : ' disabled') + '>' + sheetOptions + '</select></label>' +
      '</div><small class="pfh-product-development-form-note">人类食品和宠物食品模板摘要从云端按需加载并缓存在本地，用户无需导入 Excel。</small></section>' +
      (state.productDevelopmentIngredientStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentIngredientStatus) + '</p>' : '') +
      (state.productDevelopmentIngredientError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentIngredientError) + '</p>' : '') +
      productDevelopmentIngredientEditorHtml(editor) +
      '<p class="pfh-product-development-note">模板摘要由云端提供，修改内容只在本地编辑；导出文件为 PDF，不会写入 PLM。</p></div>';
  }

  function saveProductDevelopmentIngredientLocal() {
    if (!state.productDevelopmentIngredientEditor) {
      showToast('请先选择内置模板');
      return;
    }
    saveProductDevelopmentIngredientEditorDraft(state.productDevelopmentIngredientEditor);
    state.productDevelopmentIngredientStatus = '已保存本地修改';
    state.productDevelopmentIngredientError = '';
    showToast('成分表修改已保存到本地');
    renderShell();
  }

  function productDevelopmentIngredientPdfCellText(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  function productDevelopmentIngredientPdfAmount(value) {
    const text = productDevelopmentIngredientPdfCellText(value).replace(/[（]/g, '(').replace(/[）]/g, ')');
    const matches = text.match(/\b\d[\d,]*(?:\.\d+)?\s*(?:mg|mcg|μg|µg|ug|g|kg|mL|ml|IU|CFU)\b(?:\s*\([^\n)]{1,50}\))?/gi);
    return matches && matches.length ? matches[matches.length - 1].replace(/\s+/g, ' ').trim() : '';
  }

  function productDevelopmentIngredientPdfDailyValue(value) {
    const match = productDevelopmentIngredientPdfCellText(value).match(/\b\d[\d,]*(?:\.\d+)?\s*%|\*\*/);
    return match ? match[0].replace(/,/g, '').replace(/\s+/g, '') : '**';
  }

  function productDevelopmentIngredientPdfResultFromEditor(editor, template) {
    const ingredientKind = normalizeProductDevelopmentIngredientKind(editor && editor.kind);
    const isPet = ingredientKind === 'pet';
    const cells = editor && Array.isArray(editor.cells) ? editor.cells : [];
    const rowsByNumber = Object.create(null);
    cells.forEach((cell) => {
      const rowNumber = Number(cell && cell.row);
      const column = Number(cell && cell.column);
      const value = productDevelopmentIngredientPdfCellText(cell && cell.value);
      if (!Number.isInteger(rowNumber) || rowNumber < 1 || !Number.isInteger(column) || column < 1 || !value) return;
      if (!rowsByNumber[rowNumber]) rowsByNumber[rowNumber] = Object.create(null);
      rowsByNumber[rowNumber][column] = value;
    });
    const rowNumbers = Object.keys(rowsByNumber).map(Number).sort((left, right) => left - right);
    const rowText = (rowNumber) => Object.keys(rowsByNumber[rowNumber] || {})
      .sort((left, right) => Number(left) - Number(right))
      .map((column) => rowsByNumber[rowNumber][column])
      .filter(Boolean)
      .join('\n');
    const headerText = [rowText(2), rowText(3)].filter(Boolean).join('\n');
    const title = isPet ? 'Product Facts' : productDevelopmentIngredientPdfCellText(headerText.split('\n')[0]) || 'Supplement Facts';
    const servingMatch = headerText.match(/Serving\s*Size\s*:?\s*([^\n]+)/i)
      || headerText.match(/(?:Active\s+)?Ingredients?\s+Per\s+([^:\n]+)\s*:?/i);
    const containerMatch = headerText.match(/Servings?\s+Per\s+Container\s*:?\s*([^\n]+)/i);
    const servingSize = productDevelopmentIngredientPdfCellText(servingMatch && servingMatch[1]) || '1 serving';
    const servingsPerContainer = productDevelopmentIngredientPdfCellText(containerMatch && containerMatch[1]) || '1';
    const rows = [];
    let otherIngredients = '';
    rowNumbers.forEach((rowNumber) => {
      if (rowNumber <= 3) return;
      const row = rowsByNumber[rowNumber] || {};
      const columnValues = Object.keys(row).sort((left, right) => Number(left) - Number(right)).map((column) => row[column]).filter(Boolean);
      const nameSource = productDevelopmentIngredientPdfCellText(row[3] || columnValues[0] || '');
      const amountSource = productDevelopmentIngredientPdfCellText(row[4] || columnValues[1] || nameSource);
      if (!nameSource && !amountSource) return;
      if (/\*{2}\s*Daily\s+Value\s+not\s+established/i.test(nameSource)) {
        return;
      }
      const otherMatch = nameSource.match(/(?:Other|Inactive)\s+Ingredients?\s*:\s*([\s\S]*)/i)
        || nameSource.match(/^Ingredients?\s*:\s*([\s\S]*)/i);
      if (otherMatch) {
        otherIngredients = productDevelopmentIngredientPdfCellText(otherMatch[1]);
        return;
      }
      if (/Amount\s+Per\s+Serving|(?:Active|Inactive|Other)\s+Ingredients?\s+Per\b|Serving\s+Size|Servings?\s+Per\s+Container/i.test(nameSource)) return;
      const amount = productDevelopmentIngredientPdfAmount(row[4] || nameSource);
      if (!amount) return;
      const name = productDevelopmentIngredientPdfCellText(nameSource)
        .replace(amount, '')
        .replace(/[.．…。·･]{2,}/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[.\s]+|[.\s]+$/g, '')
        .trim();
      if (!name || /^\*+$/.test(name)) return;
      rows.push({
        labelEn: name,
        nameEn: name,
        nameCn: name,
        amountText: amount,
        dailyValue: isPet ? '**' : productDevelopmentIngredientPdfDailyValue(row[4] || nameSource),
        markerActiveMg: 0,
      });
    });
    if (!rows.length) throw new Error('当前工作表没有可识别的成分行，请选择包含 Supplement Facts 或 Nutrition Facts 的工作表');
    if (rows.length > 18) throw new Error('当前单页 PDF 最多支持 18 行成分，请选择较短的工作表或拆分后再导出');
    const baseLabel = productDevelopmentSafeFileLabel(
      (template && (template.label || template.fileName) || '成分表') + '-' + String(editor && editor.sheetName || ''),
      100,
    ) || 'Supplement-Facts';
    return {
      snapshot: { name: baseLabel, englishName: baseLabel, sku: String(editor && editor.sheetName || baseLabel), ingredientKind },
      ingredientKind,
      ingredientTable: {
        title,
        servingSize,
        servingsPerContainer,
        rows,
        otherIngredientsEn: otherIngredients,
        otherIngredientsLabel: isPet ? 'Inactive Ingredients' : 'Other Ingredients',
        showFooter: !isPet,
      },
      pdfFileName: productDevelopmentFileDate() + '-' + baseLabel + '-' + (isPet ? 'Product-Facts' : 'Supplement-Facts') + '.pdf',
    };
  }

  async function exportProductDevelopmentIngredientPdf() {
    const editor = state.productDevelopmentIngredientEditor;
    if (!editor || state.productDevelopmentIngredientBusy) {
      showToast('请先选择内置模板');
      return;
    }
    const template = productDevelopmentIngredientSelectedTemplate(editor.kind, editor.templateId);
    if (!template) {
      showToast('当前模板不存在，请重新选择');
      return;
    }
    saveProductDevelopmentIngredientEditorDraft(editor);
    state.productDevelopmentIngredientBusy = true;
    state.productDevelopmentIngredientError = '';
    const factsLabel = normalizeProductDevelopmentIngredientKind(editor.kind) === 'pet' ? 'Product Facts' : 'Supplement Facts';
    state.productDevelopmentIngredientStatus = '正在生成 ' + factsLabel + ' PDF…';
    renderShell();
    const startedAt = Date.now();
    try {
      const pdfResult = productDevelopmentIngredientPdfResultFromEditor(editor, template);
      const blob = productDevelopmentOneShotBuildPdf(pdfResult, { skipValidation: true });
      const fileName = pdfResult.pdfFileName;
      downloadBlob(blob, fileName);
      state.productDevelopmentIngredientStatus = factsLabel + ' PDF 已下载：' + fileName;
      productDevelopmentLog('success', '成分表 PDF 生成完成', editor.kind + ' | 模板=' + template.fileName + ' | 工作表=' + editor.sheetName + ' | 行数=' + pdfResult.ingredientTable.rows.length + ' | 用时=' + (Date.now() - startedAt) + 'ms');
      showToast(factsLabel + ' PDF 已下载');
    } catch (error) {
      state.productDevelopmentIngredientError = formatErrorMessage(error);
      state.productDevelopmentIngredientStatus = '';
      productDevelopmentLog('error', '成分表 PDF 生成失败', formatErrorMessage(error));
      showToast(state.productDevelopmentIngredientError);
    } finally {
      state.productDevelopmentIngredientBusy = false;
      renderShell();
    }
  }

  function productDevelopmentViewHtml(statusText) {
    const view = state.productDevelopmentView === 'pricing' ? 'pricing' : (state.productDevelopmentView === 'review' ? 'review' : (state.productDevelopmentView === 'copywriting' ? 'copywriting' : (state.productDevelopmentView === 'ingredient' ? 'ingredient' : 'home')));
    if (view === 'pricing') return productDevelopmentPricingViewHtml();
    if (view === 'review') return productDevelopmentReviewHtml(statusText);
    if (view === 'copywriting') return productDevelopmentCopywritingHtml(statusText);
    if (view === 'ingredient') return productDevelopmentIngredientFactsHtml();
    if (state.productDevelopmentView === 'history') return productDevelopmentHistoryViewHtml(statusText);
    return homeViewHtml(statusText);
  }

  function productDevelopmentHandleAction(action, actionTarget) {
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
      state.workMode = 'product-development';
      state.settings.workMode = 'product-development';
      saveSettings(state.settings);
      const sku = getProductDevelopmentCurrentSku();
      const task = getProductDevelopmentTaskBySku(sku) || state.productDevelopmentSelectedTask;
      state.productDevelopmentView = 'pricing';
      state.view = 'home';
      state.productDevelopmentError = '';
      state.productDevelopmentStatus = '';
      productDevelopmentPricingInputForSku(sku, state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku]);
      renderShell();
      const taskDetail = task && state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[task.sku];
      if (task && task.sku && (!taskDetail || taskDetail.error)) {
        hydrateProductDevelopmentTaskDetail(task).then(() => {
          if (state.productDevelopmentView === 'pricing' && getProductDevelopmentCurrentSku() === task.sku) renderShell();
        }).catch(() => {});
      }
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
      state.productDevelopmentView = 'ingredient';
      state.view = 'home';
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
    if (action === 'product-development-rework-lookup') {
      const sku = String(actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku()).trim().toUpperCase();
      productDevelopmentRunReworkProductLookup(sku, undefined, { silent: false });
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
    if (action === 'product-development-product-save-local') {
      productDevelopmentSaveProductDetailLocally(actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-product-save-plm') {
      productDevelopmentRunProductDetailPlmSave(actionTarget && actionTarget.getAttribute('data-product-sku') || getProductDevelopmentCurrentSku());
      return true;
    }
    if (action === 'product-development-bom-save-local') {
      productDevelopmentSaveBomLocally(actionTarget && actionTarget.getAttribute('data-bom-sku') || getProductDevelopmentCurrentSku());
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
      state.productDevelopmentReviewEditorOpen = false;
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
    if (action === 'product-development-review-editor-open') {
      const result = state.productDevelopmentReview;
      if (!result || result.fromHistory) {
        showToast('当前结果不可编辑，请重新分析当前对标图片');
        return true;
      }
      state.productDevelopmentReviewEditorOpen = true;
      renderShell();
      return true;
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
      state.workMode = 'product-development';
      state.settings.workMode = 'product-development';
      saveSettings(state.settings);
      const currentSku = getProductDevelopmentCurrentSku();
      if (state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.fromHistory) state.productDevelopmentCopywriting = null;
      restoreProductDevelopmentCopywritingCache(currentSku);
      if (state.view === 'productDevelopmentTasks') {
        state.productDevelopmentTaskPreviousTab = normalizeProductDevelopmentTaskTab(state.productDevelopmentTaskView);
        state.productDevelopmentTaskView = 'copywriting';
        state.productDevelopmentError = '';
        state.productDevelopmentStatus = '';
        renderShell();
        productDevelopmentWarmIngredientTemplates();
        return true;
      }
      state.productDevelopmentView = 'copywriting';
      state.view = 'home';
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
        if (state.productDevelopmentView === 'copywriting') renderShell();
      }, 0);
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
    if (productDevelopmentHandleMaterialField(target)) return true;
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
      const nextValue = String(target.value || '').slice(0, oneShotField === 'requestedFunctions' ? 1800 : oneShotField === 'otherIngredientsEn' ? 1600 : oneShotField === 'otherIngredientsCn' ? 1200 : oneShotField === 'referenceUrl' ? 1200 : 240);
      state.productDevelopmentOneShotInput[oneShotField] = nextValue;
      if (oneShotField === 'targetActiveMg' || oneShotField === 'targetActivePercent') {
        state.productDevelopmentOneShotInput[oneShotField + 'Explicit'] = nextValue.trim() ? 'true' : 'false';
      }
      saveProductDevelopmentOneShotDraft(state.productDevelopmentOneShotInput);
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
          const value = String(target.value || '').slice(0, 800);
          item.value = Array.isArray(item.value) ? (value ? [value] : []) : value;
          item.displayValue = value;
          item.status = item.displayValue.trim() ? '已填写（本地）' : '未读取';
          productDevelopmentRememberLocalProductField(detail, item, item.value, item.displayValue);
          productDevelopmentMarkProductDetailDirty(detail);
          persistDetail();
          return true;
        }
      }
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
          const value = String(target.value || '').slice(0, definition.type === 'textarea' ? 12000 : 800);
          const displayValue = productDevelopmentPrefillText(value, 12000);
          productDevelopmentRememberLocalProductField(detail, { attrId: definition.attrId }, value, displayValue);
          productDevelopmentProductFieldCollections(detail).filter((item) => Number(item && item.attrId) === Number(definition.attrId)).forEach((item) => {
            item.value = value;
            item.displayValue = displayValue;
            item.status = displayValue ? '已填写（本地）' : '待补充';
            item.source = displayValue ? '本地人工填写（未写入）' : '待人工补充';
          });
          productDevelopmentMarkProductDetailDirty(detail);
          persistDetail();
        }
        return true;
      }
      if (detail && group === 'procurement') {
        const definition = PRODUCT_DEVELOPMENT_PREFILL_PROCUREMENT_FIELDS.find((item) => item.key === key);
        if (definition) {
          const value = String(target.value || '').slice(0, 800);
          if (!detail.productDetailLocalProcurement || typeof detail.productDetailLocalProcurement !== 'object') detail.productDetailLocalProcurement = Object.create(null);
          detail.productDetailLocalProcurement[key] = value;
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
      if (result && !result.fromHistory) {
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
