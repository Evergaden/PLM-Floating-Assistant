  const PRODUCT_DEVELOPMENT_VERSION = '1.12.2';
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
  const PRODUCT_DEVELOPMENT_TASK_META_KEY = 'plm-floating-helper:product-development-task-meta:v1';
  const PRODUCT_DEVELOPMENT_TASK_SIDEBAR_KEY = 'plm-floating-helper:product-development-task-sidebar:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_KEY = 'plm-floating-helper:product-development-template:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY = 'plm-floating-helper:product-development-template-version:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_SELECTION_KEY = 'plm-floating-helper:product-development-template-selection:v1';
  const PRODUCT_DEVELOPMENT_INGREDIENT_DRAFT_KEY = 'plm-floating-helper:product-development-ingredient-drafts:v1';
  const PRODUCT_DEVELOPMENT_INGREDIENT_LOCAL_TEMPLATE_KEY = 'plm-floating-helper:product-development-ingredient-local-templates:v1';
  const PRODUCT_DEVELOPMENT_INGREDIENT_MAX_TEMPLATE_SIZE = 5 * 1024 * 1024;
  const PRODUCT_DEVELOPMENT_INGREDIENT_MAX_CELLS = 600;
  const PRODUCT_DEVELOPMENT_MAX_HISTORY = 8;
  const productDevelopmentReviewDraftWriteTimers = Object.create(null);
  const productDevelopmentTaskMetaWriteTimers = Object.create(null);
  const productDevelopmentReworkLookupTimers = Object.create(null);
  const productDevelopmentReworkLookupRequestTokens = Object.create(null);
  const productDevelopmentCopywritingTemplateBufferCache = Object.create(null);
  const PRODUCT_DEVELOPMENT_W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const PRODUCT_DEVELOPMENT_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const PRODUCT_DEVELOPMENT_BANNED_TERMS = Object.freeze([
    'natural', 'nature', 'naturally', '天然', '自然',
    'organic', '有机', 'vegan', '素食主义者',
    'crueltyfree', 'cruelty free', '无残忍',
    'biodegradable', '可生物降解', 'environmentally friendly',
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
  const PRODUCT_DEVELOPMENT_REVIEW_RULE_VERSION = 'approved-samples-v1';
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
    Object.freeze({ id: 'ingredientFacts', title: '制作成分表', subtitle: '分别选择人类或宠物模板，编辑后下载 Excel', action: 'product-development-ingredient-open', icon: 'batchExcel', requiresSku: false }),
    Object.freeze({ id: 'pricing', title: '定价标准', subtitle: '三档价格和公式价', action: '', icon: 'calculator' }),
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

  // This is the intentionally small contract between the local assistant form
  // and the two-step PLM create-product drawer. Keep this list limited to the
  // fields confirmed during the current manual product creation flow; PLM
  // defaults and untouched fields should remain managed by PLM itself.
  const PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS = Object.freeze([
    Object.freeze({ key: 'categoryPath', label: '类目', domId: 'form_item_category_id', control: 'cascader', placeholder: '如：成品 / 食品酒水 / 酒水饮品' }),
    Object.freeze({ key: 'productNameCn', label: '中文商品名称', domId: 'product_name0', placeholder: '填写页面 1 中文商品名称' }),
    Object.freeze({ key: 'productNameEn', label: '英文商品名称', domId: 'product_name1', placeholder: '填写页面 1 英文商品名称' }),
    Object.freeze({ key: 'brand', label: '品牌', domId: 'brand_id', control: 'select', placeholder: '按 PLM 下拉选项填写品牌' }),
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
      sourceText: productDevelopmentCompactSemanticText(source.sourceText || source.originalText || source.text, 240),
      bbox: source.bbox && typeof source.bbox === 'object' ? {
        x: Number(source.bbox.x) || 0,
        y: Number(source.bbox.y) || 0,
        w: Number(source.bbox.w !== undefined ? source.bbox.w : source.bbox.width) || 0,
        h: Number(source.bbox.h !== undefined ? source.bbox.h : source.bbox.height) || 0,
      } : null,
      textRole: productDevelopmentCleanText(source.textRole || source.role, 40).toLowerCase(),
      riskTypes: Array.isArray(source.riskTypes) ? source.riskTypes.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4) : [],
      riskTerms: Array.isArray(source.riskTerms) ? source.riskTerms.map((item) => productDevelopmentCleanText(item, 100)).filter(Boolean).slice(0, 8) : [],
      riskReason: productDevelopmentCompactSemanticText(source.riskReason || source.reason || source.warning, 400),
      replacementEn: productDevelopmentCompactSemanticText(source.replacementEn || source.modifiedEnglish || source.english, 300),
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
      sourceImageDataUrl: dataUrl(source.sourceImageDataUrl, 2600000),
      sourceImageName: productDevelopmentCleanText(source.sourceImageName || source.benchmarkImageName, 180),
      comparisonDataUrl: dataUrl(source.comparisonDataUrl, 2600000),
      items: (Array.isArray(source.items) ? source.items : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
      extractedTexts: (Array.isArray(source.extractedTexts) ? source.extractedTexts : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
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
    return split.category || productDevelopmentCleanText(value, 180);
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

  async function loadProductDevelopmentCopywritingTemplateSource(template) {
    if (!template || !template.id) throw new Error('请先选择文案模板');
    if (template.local) return template.source;
    if (productDevelopmentCopywritingTemplateBufferCache[template.id]) return productDevelopmentCopywritingTemplateBufferCache[template.id];
    const buffer = await fetchCloudAsset(template, 'arraybuffer');
    productDevelopmentCopywritingTemplateBufferCache[template.id] = buffer;
    return buffer;
  }

  function selectProductDevelopmentCopywritingTemplate(templateId) {
    const targetId = String(templateId || '').trim();
    if (targetId === 'local' && !state.productDevelopmentTemplateBase64) throw new Error('请先添加本地 DOCX 模板');
    const template = targetId === 'local'
      ? { id: 'local', label: '本地自定义模板' }
      : productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === targetId);
    if (!template) throw new Error('文案模板不存在');
    saveProductDevelopmentCopywritingTemplateId(template.id);
    state.productDevelopmentCopywriting = null;
    state.productDevelopmentStatus = '已选择文案模板：' + template.label;
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

  function productDevelopmentPage1FieldValue(detail, key) {
    const localPage1 = detail && detail.productDetailLocalPage1 && typeof detail.productDetailLocalPage1 === 'object'
      ? detail.productDetailLocalPage1
      : {};
    if (productDevelopmentPrefillHasValue(localPage1, key)) return key === 'categoryPath'
      ? productDevelopmentNormalizeCategoryPathValue(localPage1[key])
      : key === 'brand'
        ? productDevelopmentNormalizeBrandValue(localPage1[key])
        : localPage1[key];
    const task = getProductDevelopmentTaskBySku(detail && detail.sku) || state.productDevelopmentSelectedTask || {};
    const meta = getProductDevelopmentTaskMeta(task, detail);
    const info = detail && detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    const group = info.product_group && typeof info.product_group === 'object' ? info.product_group : {};
    if (key === 'categoryPath') return productDevelopmentNormalizeCategoryPathValue(detail && (detail.categoryName || info.category_name || task.plmCategory) || '');
    if (key === 'productNameCn') return detail && detail.productDetailLocalNames && productDevelopmentPrefillHasValue(detail.productDetailLocalNames, key)
      ? detail.productDetailLocalNames[key]
      : meta.productNameCn || detail && detail.productNameCn || '';
    if (key === 'productNameEn') return detail && detail.productDetailLocalNames && productDevelopmentPrefillHasValue(detail.productDetailLocalNames, key)
      ? detail.productDetailLocalNames[key]
      : meta.productNameEn || detail && detail.productNameEn || '';
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

  function productDevelopmentProductDetailLanguageConfig(detail) {
    const info = detail && detail.productInfo && typeof detail.productInfo === 'object' ? detail.productInfo : {};
    const source = Array.isArray(info.language_config) ? productDevelopmentCloneValue(info.language_config) : [];
    const languages = Array.isArray(source) ? source : [];
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
    const en = Object.prototype.hasOwnProperty.call(localNames, 'productNameEn')
      ? localNames.productNameEn
      : detail && detail.productNameEn || '';
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
      language_config: productDevelopmentProductDetailLanguageConfig(detail),
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

  function productDevelopmentDomOptionText(option) {
    if (!option) return '';
    const content = option.querySelector('.ant-select-item-option-content, .ant-cascader-menu-item-content');
    return productDevelopmentDomText(option.getAttribute('title') || option.getAttribute('aria-label') || content && content.textContent || option.textContent);
  }

  function productDevelopmentDomVisibleOptions() {
    const selectors = [
      '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option',
      '.ant-select-dropdown:not(.ant-select-dropdown-hidden) [role="option"]',
      '.ant-cascader-dropdown .ant-cascader-menu-item',
      '.ant-cascader-menus .ant-cascader-menu-item',
      '[role="option"]',
    ];
    const seen = new Set();
    return selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))).filter((option) => {
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

  function productDevelopmentDomSelectionMatches(input, target) {
    const current = productDevelopmentDomText(productDevelopmentDomSelectedText(input));
    const wanted = productDevelopmentDomText(target);
    return Boolean(current && wanted && (current === wanted || current.includes(wanted)));
  }

  async function productDevelopmentDomSelectOption(input, target, control) {
    if (!input) throw new Error('未找到 PLM 下拉控件');
    const wanted = productDevelopmentPrefillText(target, 800);
    if (!wanted) throw new Error('下拉字段缺少填写值');
    if (productDevelopmentDomSelectionMatches(input, wanted)) return;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const clear = container && container.querySelector('.ant-select-clear, .ant-cascader-picker-clear');
    if (clear && productDevelopmentDomVisible(clear)) clear.click();
    const clickTarget = productDevelopmentDomClickTarget(input);
    if (!clickTarget) throw new Error('未找到 PLM 下拉点击区域');
    clickTarget.click();
    await productDevelopmentDomWait(120);
    if (control === 'cascader') {
      const segments = wanted.split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
      for (const segment of segments) {
        await productDevelopmentDomWait(80);
        const option = productDevelopmentDomFindOption(segment);
        if (!option) throw new Error('PLM 下拉中找不到“' + segment + '”');
        option.click();
        await productDevelopmentDomWait(140);
      }
    } else {
      if (!input.readOnly && input.type !== 'file') {
        productDevelopmentDomNativeSetter(input, wanted, ['input']);
        await productDevelopmentDomWait(120);
      }
      const option = productDevelopmentDomFindOption(wanted);
      if (!option) throw new Error('PLM 下拉中找不到“' + wanted + '”');
      option.click();
      await productDevelopmentDomWait(180);
    }
    if (!productDevelopmentDomSelectionMatches(input, wanted)) throw new Error('PLM 未确认选中“' + wanted + '”');
  }

  function productDevelopmentDomFindButton(label) {
    const wanted = productDevelopmentDomText(label);
    return Array.from(document.querySelectorAll('button')).find((button) => productDevelopmentDomVisible(button) && productDevelopmentDomText(button.textContent) === wanted)
      || Array.from(document.querySelectorAll('button')).find((button) => productDevelopmentDomVisible(button) && productDevelopmentDomText(button.textContent).includes(wanted));
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

  async function productDevelopmentBomDomSelectCategory(input, target) {
    const wanted = productDevelopmentPrefillText(target, 800);
    if (!input || !wanted) throw new Error('物料分类缺少填写值');
    if (productDevelopmentDomSelectionMatches(input, wanted)) return;
    const container = input.closest('.ant-select, .ant-cascader-picker, .ant-cascader');
    const clear = container && container.querySelector('.ant-select-clear, .ant-cascader-picker-clear');
    if (clear && productDevelopmentDomVisible(clear)) clear.click();
    const clickTarget = productDevelopmentDomClickTarget(input);
    if (!clickTarget) throw new Error('未找到物料分类点击区域');
    clickTarget.click();
    const segments = wanted.split(/[\/／>＞|]+/).map((item) => item.trim()).filter(Boolean);
    for (const segment of segments) {
      const option = await waitFor(() => {
        const menus = Array.from(document.querySelectorAll('.ant-cascader-menu'))
          .filter(productDevelopmentDomVisible);
        const menu = menus[menus.length - 1];
        if (!menu) return null;
        return Array.from(menu.querySelectorAll('.ant-cascader-menu-item'))
          .filter(productDevelopmentDomVisible)
          .find((item) => productDevelopmentDomOptionText(item) === productDevelopmentDomText(segment)) || null;
      }, 5000, 100);
      if (!option) throw new Error('PLM 物料分类中找不到“' + segment + '”');
      option.click();
      await productDevelopmentDomWait(140);
    }
    if (!productDevelopmentDomSelectionMatches(input, wanted)) throw new Error('PLM 未确认物料分类“' + wanted + '”');
  }

  function productDevelopmentBomDomKindLabel(kind) {
    return kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '说明书';
  }

  function productDevelopmentBomDomMenuLabel(kind) {
    return kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '印刷';
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
    await productDevelopmentBomDomSelectCategory(categoryInput, draft.categoryPath);
    editor = productDevelopmentBomDomActiveEditor(drawer) || editor;
    const supplierInput = editor.querySelector('#form_item_default_supplier_id');
    if (!supplierInput) throw new Error(productDevelopmentBomDomKindLabel(kind) + '未找到默认供应商控件');
    await productDevelopmentDomSelectOption(supplierInput, draft.supplier, 'select');
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
    if (productDevelopmentBomDomActiveEditor(drawer)) throw new Error('PLM 当前还有未确认的物料行，请先确定或取消后再试');
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
    if (!added.length) throw new Error(skipped.length ? '纸盒、标签或说明书已存在，未重复添加' : '没有启用的 BOM 物料可填写');
    const message = '已填入 PLM 待保存行：' + added.join('、') + (skipped.length ? '；已跳过：' + skipped.join('、') : '') + '。请核对后点击“批量保存”';
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
    if (typeof window.confirm === 'function' && !window.confirm('确认把当前启用的纸盒、标签和说明书逐条填入 PLM“绑定 BOM”界面？脚本会点击每行“确定”，但不会点击“批量保存”；请最后人工核对。')) return;
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
    const productNameEn = productDevelopmentCleanText((info.language_config || []).find((item) => Number(item && item.language_id) === 2)?.product_name || productSnapshot && productSnapshot.englishName, 180);
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
    return '<section class="pfh-product-development-material-planner"><header><div><small>BOM 绑定</small><h3>填写 BOM 物料</h3></div><div class="pfh-product-development-material-header-actions"><span class="pfh-product-development-material-save-status' + saveStatusClass + '">' + escapeHtml(saveStatus) + '</span><button type="button" data-action="product-development-bom-save-local" data-bom-sku="' + escapeHtml(formSku) + '">保存本地</button><button type="button" class="is-primary" data-action="product-development-bom-fill-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (anyBomBusy ? ' disabled' : '') + '>' + (bomDomFillBusy ? '正在填入…' : '一键填入 PLM BOM') + '</button><button type="button" data-action="product-development-bom-save-plm" data-bom-sku="' + escapeHtml(formSku) + '"' + (anyBomBusy ? ' disabled' : '') + '>' + (plmBusy ? '正在保存…' : 'API 直接保存') + '</button></div></header><p class="pfh-product-development-material-note">纸盒和标签可按产品需要移除；说明书从“印刷”入口填写。一键填入只生成待保存行，核对后再在 PLM 点击“批量保存”。</p>' + plmStatus + productDevelopmentFinishedProductBindingHtml(detail, task) + '<div class="pfh-product-development-material-list">' + productDevelopmentMaterialCardHtml('box', ensured.value.box, formSku, baseName) + productDevelopmentMaterialCardHtml('label', ensured.value.label, formSku, baseName) + productDevelopmentMaterialCardHtml('instruction', ensured.value.instruction, formSku, baseName) + '</div>' + existingBom + '</section>';
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
    const result = {
      version: PRODUCT_DEVELOPMENT_VERSION,
      sku: normalizedSku,
      name: productDevelopmentCleanText(snapshot && snapshot.chineseName || data.name, 300),
      englishName: productDevelopmentCleanText(snapshot && snapshot.englishName, 300),
      brand: productDevelopmentCleanText(snapshot && snapshot.brand || data.brand, 160),
      productType: productDevelopmentCleanText(snapshot && snapshot.productType || data.productType || data.manualCategory, 180),
      netContent: productDevelopmentCleanText(snapshot && snapshot.netContent || data.netContent, 120),
      referenceUrl: productDevelopmentCleanText(snapshot && snapshot.referenceUrl || data.referenceUrl || data.benchmarkLink, 1000),
      projectCreatedAt: productDevelopmentCleanText(snapshot && (snapshot.projectCreatedAt || snapshot.create_at) || data.projectCreatedAt || seed.projectCreatedAt, 80),
      ingredients: resolvedIngredients,
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
      .filter((term) => normalized.includes(productDevelopmentNormalizedClaimText(term)))
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
      const sourceText = productDevelopmentCompactSemanticText(sourceItem.sourceText || sourceItem.originalText || sourceItem.text, 240);
      const rawReplacementEn = productDevelopmentCompactSemanticText(sourceItem.replacementEn || sourceItem.modifiedEnglish || sourceItem.english || sourceText, 300);
      const rawReplacementZh = productDevelopmentCompactSemanticText(sourceItem.replacementZh || sourceItem.chinese || sourceItem.translation || sourceItem.translationZh || sourceText, 300);
      const key = [sourceText.toLowerCase(), hasBbox ? x.toFixed(4) + '|' + y.toFixed(4) : 'no-bbox'].join('|');
      if (!sourceText || !rawReplacementEn || !rawReplacementZh || seen.has(key)) return null;
      seen.add(key);
      const detected = productDevelopmentDetectSourceRisks(sourceText, brand);
      const riskTypes = Array.from(new Set((Array.isArray(sourceItem.riskTypes) ? sourceItem.riskTypes : [sourceItem.riskType])
        .map((type) => String(type || '').trim().toLowerCase())
        .filter((type) => ['banned', 'exaggeration', 'medical', 'brand', 'unsupported', 'other'].includes(type))
        .concat(detected.types))).slice(0, 4);
      const riskTerms = Array.from(new Set((Array.isArray(sourceItem.riskTerms) ? sourceItem.riskTerms : [])
        .map((term) => productDevelopmentCleanText(term, 100)).filter(Boolean).concat(detected.terms))).slice(0, 8);
      const approved = productDevelopmentApplyApprovedReviewRules(sourceItem, sourceText, rawReplacementEn, rawReplacementZh, {
        brand,
        snapshot: options && options.snapshot,
      });
      if (approved.action && !riskTypes.length) {
        riskTypes.push(approved.action === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo ? 'brand' : 'other');
      }
      return {
        id: String(sourceItem.id || index + 1),
        sourceText,
        bbox: hasBbox && w > 0.001 && h > 0.001 ? { x, y, w, h } : null,
        textRole: productDevelopmentCleanText(sourceItem.textRole || sourceItem.role, 40).toLowerCase(),
        riskTypes,
        riskTerms,
        riskReason: productDevelopmentCompactSemanticText(sourceItem.riskReason || sourceItem.reason || sourceItem.warning, 400) || (riskTerms.length ? '原文检测到：' + riskTerms.join('、') : ''),
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
    const extractedTexts = productDevelopmentNormalizeRiskItems({ items: sourceItems }, { brand, snapshot });
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

  function productDevelopmentFileDate(value) {
    const raw = String(value || '').trim();
    const direct = raw.match(/(?:^|\D)(\d{4})[-/.年]?(\d{1,2})[-/.月]?(\d{1,2})(?:日|\D|$)/);
    let date = null;
    if (direct) {
      const year = Number(direct[1]);
      const month = Number(direct[2]);
      const day = Number(direct[3]);
      const candidate = new Date(year, month - 1, day);
      if (candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day) date = candidate;
    }
    if (!date) {
      const timestamp = productDevelopmentTaskTime(raw);
      if (timestamp > 0) date = new Date(timestamp);
    }
    if (!date || !Number.isFinite(date.getTime())) date = new Date();
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
    const date = productDevelopmentFileDate(source.projectCreatedAt);
    const brand = productDevelopmentSafeFileLabel(source.brand, 60);
    let name = productDevelopmentSafeFileLabel(source.name, 120);
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
          petAudience,
          sellingPoints: snapshot.sourceCopywriting.sellingPoints,
          efficacy: snapshot.sourceCopywriting.efficacy,
          namingExamples: PRODUCT_DEVELOPMENT_NAME_EXAMPLES,
          reviewRuleVersion: PRODUCT_DEVELOPMENT_REVIEW_RULE_VERSION,
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
        plainTextCopy: '',
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
      '<div class="pfh-product-development-review-editor-list">' + rows + '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-review-add">手动添加文字</button><button type="button" data-action="product-development-review-recompose"' + (!result || state.productDevelopmentReviewBusy ? ' disabled' : '') + '>按修改重新生成对照图</button></div></section></div>';
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
    if (typeof JSZip !== 'function') throw new Error('DOCX 组件未加载');
    const zip = new JSZip();
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
          ingredientEn: productDevelopmentCleanText(sourceItem.ingredientEn || sourceItem.englishName, 300),
          ingredientCn: productDevelopmentCleanText(sourceItem.ingredientCn || sourceItem.chineseName, 300),
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
      if (productDevelopmentChineseCount(item.cn) > 20 || productDevelopmentEnglishWordCount(item.en) > 20) errors.push('A 第 ' + (index + 1) + ' 条超出长度');
    });
    result.advantages.forEach((item, index) => {
      addComplianceText('B 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('B 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('B 第 ' + (index + 1) + ' 条中英文不完整');
      if (productDevelopmentChineseCount(item.cn) > 15 || productDevelopmentEnglishWordCount(item.en) > 8) errors.push('B 第 ' + (index + 1) + ' 条超出长度');
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
    result.ingredientFunctions.forEach((item, index) => {
      // ingredientEn/ingredientCn are PLM source labels. They must match the
      // input ingredients, but a source ingredient name must not invalidate the
      // generated copywriting compliance check by itself.
      addComplianceText('D 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('D 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('D 第 ' + (index + 1) + ' 条中英文不完整');
      const target = expected[index] || {};
      const targetKey = productDevelopmentNormalizedClaimText(target.en || target.cn);
      const actualKey = productDevelopmentNormalizedClaimText(item.ingredientEn || item.ingredientCn);
      if (!actualKey || !targetKey || actualKey !== targetKey) errors.push('D 第 ' + (index + 1) + ' 个成分与 PLM 不一致');
      if (productDevelopmentChineseCount(item.cn) > 20 || productDevelopmentEnglishWordCount(item.en) > 18) errors.push('D 第 ' + (index + 1) + ' 条超出长度');
    });
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
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
      return '文案生成未完成：AI 响应超时或中英文内容不完整，请再次点击生成。系统会自动切换备用模型。';
    }
    return message;
  }

  function productDevelopmentCopywritingNameWithBrand(brand, name) {
    const brandText = productDevelopmentCleanText(brand, 160);
    const nameText = productDevelopmentCleanText(name, 300);
    if (!brandText) return nameText;
    if (!nameText) return brandText;
    return nameText.toLowerCase().includes(brandText.toLowerCase()) ? nameText : brandText + ' ' + nameText;
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
    let xml = productDevelopmentBuiltinDocumentXml();
    if (templateSource) {
      const templateBuffer = typeof templateSource === 'string' ? base64ToArrayBuffer(templateSource) : templateSource;
      codec = productDevelopmentDocxCodec();
      if (codec) {
        zipEntries = codec.unzipSync(new Uint8Array(templateBuffer));
        const documentBytes = zipEntries['word/document.xml'];
        if (!documentBytes) throw new Error('模板缺少 word/document.xml');
        xml = codec.strFromU8(documentBytes);
      } else {
        if (typeof JSZip !== 'function') throw new Error('DOCX 组件未加载');
        zip = await JSZip.loadAsync(templateBuffer);
        const documentFile = zip.file('word/document.xml');
        if (!documentFile) throw new Error('模板缺少 word/document.xml');
        xml = await documentFile.async('string');
      }
    }
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (!doc || doc.getElementsByTagName('parsererror').length) throw new Error('模板文档结构无法读取');
    const rows = productDevelopmentXmlElements(doc, 'tr');
    if (!rows.length) throw new Error('模板没有可编辑表格');
    const targets = {
      productName: productDevelopmentFindRow(rows, [/产品名称/i]),
      referenceUrl: productDevelopmentFindRow(rows, [/外网参考链接/i, /参考链接/i]),
      efficacy: productDevelopmentFindRow(rows, [/^A[.．、)]?产品功效/i, /产品功效/i]),
      advantages: productDevelopmentFindRow(rows, [/^B[.．、)]?产品优势/i, /产品优势/i]),
      sellingPoints: productDevelopmentFindRow(rows, [/^C[.．、)]?产品卖点/i, /产品卖点/i]),
      ingredientFunctions: productDevelopmentFindRow(rows, [/^D[.．、)]?成分功能/i, /成分功能/i]),
    };
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
      if (cells[1] && englishName) productDevelopmentSetCellLines(cells[1], ['PRODUCT NAME: ' + englishName], doc);
      if (cells[2] && chineseName) productDevelopmentSetCellLines(cells[2], [chineseName], doc);
    }
    if (targets.referenceUrl && snapshot && snapshot.referenceUrl) {
      const cells = productDevelopmentXmlElements(targets.referenceUrl, 'tc');
      if (cells[1]) productDevelopmentSetCellLines(cells[1], [snapshot.referenceUrl], doc);
    }
    const efficacyEnglish = productDevelopmentSectionLines(content.efficacy, (item, index) => index + '. ' + item.en);
    const efficacyCells = productDevelopmentXmlElements(targets.efficacy, 'tc');
    if (efficacyEnglish.length && /\bFUNCTIONS?\b/i.test(productDevelopmentCellText(efficacyCells[1] || ''))) {
      efficacyEnglish[0] = 'FUNCTIONS：' + efficacyEnglish[0];
    }
    fill(targets.efficacy,
      efficacyEnglish,
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
    const documentXml = new XMLSerializer().serializeToString(doc);
    if (zipEntries && codec) {
      zipEntries['word/document.xml'] = codec.strToU8(documentXml);
      const bytes = codec.zipSync(zipEntries, { level: 0 });
      return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    if (!zip) return createProductDevelopmentBuiltinDocx(documentXml);
    zip.file('word/document.xml', documentXml);
    const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'STORE' });
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
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
      state.productDevelopmentStatus = '正在按四列表格模板生成 DOCX…';
      renderShell();
      stage = '生成 DOCX';
      productDevelopmentLog('info', '开始生成 DOCX 文件', sku + ' | 模板=' + copywritingTemplate.label + ' | id=' + copywritingTemplate.id + ' | 编码器=' + (productDevelopmentDocxCodec() ? 'fflate' : 'JSZip'));
      const blob = await withCopywritingTimeout(
        buildProductDevelopmentDocx(content, copywritingTemplateSource, snapshot),
        180000,
        'DOCX 生成',
      );
      productDevelopmentLog('success', 'DOCX 文件生成完成', sku + ' | 大小=' + String(blob && blob.size || 0) + ' bytes | 用时=' + (Date.now() - startedAt) + 'ms');
      const id = 'pd-copywriting-' + Date.now().toString(36);
      const fileName = productDevelopmentCopywritingFileName(snapshot);
      state.productDevelopmentCopywriting = {
        id,
        sku: snapshot.sku,
        content,
        blob,
        fileName,
        provider: productDevelopmentCleanText(response.provider, 80),
        model: productDevelopmentCleanText(response.model, 120),
        templateVersion: copywritingTemplate.version,
        templateId: copywritingTemplate.id,
        templateLabel: copywritingTemplate.label,
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
    saveProductDevelopmentCopywritingTemplateId('local');
    state.productDevelopmentCopywriting = null;
    state.productDevelopmentStatus = '已保存本地模板：' + file.name;
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
    state.productDevelopmentCopywritingTemplateId = PRODUCT_DEVELOPMENT_DEFAULT_COPYWRITING_TEMPLATE_ID;
    state.productDevelopmentCopywriting = null;
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
    const preview = canShowResult && result.comparisonDataUrl ? '<section class="pfh-product-development-preview"><div class="pfh-product-development-preview-head"><strong>三列对照图预览</strong><small>预览按容器自适应，下载 PNG 保留大字版</small></div><div class="pfh-product-development-preview-scroll"><img src="' + escapeHtml(result.comparisonDataUrl) + '" alt="侵权对照图" style="display:block;width:100%;min-width:0;max-width:100%;height:auto;object-fit:contain"></div><div class="pfh-product-development-preview-actions">' + (canEditResult ? '<button type="button" data-action="product-development-review-editor-open">浮窗编辑文字</button>' : '') + '<button type="button" data-action="product-development-review-download">下载 PNG</button></div></section>' : '';
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

  function productDevelopmentCopywritingHtml() {
    const sku = getProductDevelopmentCurrentSku();
    const content = state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.sku === sku ? state.productDevelopmentCopywriting.content : null;
    const template = resolveProductDevelopmentCopywritingTemplate();
    const templateOptions = productDevelopmentCopywritingBuiltinTemplates()
      .map((item) => '<option value="' + escapeHtml(item.id) + '"' + (item.id === template.id ? ' selected' : '') + '>' + escapeHtml(item.label + '产品文案模板') + '</option>')
      .concat(state.productDevelopmentTemplateBase64
        ? ['<option value="local"' + (template.id === 'local' ? ' selected' : '') + '>本地自定义模板</option>']
        : [])
      .join('');
    const snapshotIngredientCount = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku && Array.isArray(state.productDevelopmentSnapshot.ingredients)
      ? state.productDevelopmentSnapshot.ingredients.length
      : 0;
    const cachedIngredientCount = productDevelopmentCachedIngredientPairs(sku).length;
    const ingredientCount = snapshotIngredientCount || cachedIngredientCount;
    const ingredientSourceLabel = snapshotIngredientCount ? '' : (cachedIngredientCount ? '（本地缓存）' : '');
    const displayError = state.productDevelopmentError && !/效果图|对标图片/.test(String(state.productDevelopmentError)) ? state.productDevelopmentError : '';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>产品文案</small><h2>生成双语文案</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>生成产品文案 DOCX</h3><p>根据当前产品名称、成分和卖点生成中英文内容，并自动填入 Word 模板。</p></div><button type="button" data-action="product-development-copywriting-run"' + (state.productDevelopmentCopywritingBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentCopywritingBusy ? '正在生成…' : '生成文案 DOCX') + '</button></section>' +
      '<section class="pfh-product-development-template-card"><div><small>文案模板</small><strong>' + escapeHtml(template.label) + '</strong><select class="pfh-product-development-copywriting-template-input" aria-label="选择文案模板">' + templateOptions + '</select></div><label class="pfh-product-development-template-picker">添加或替换本地模板<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="pfh-product-development-template-input"></label>' + (state.productDevelopmentTemplateBase64 ? '<button type="button" data-action="product-development-template-reset">删除本地模板</button>' : '') + '<span>已读取成分：' + escapeHtml(ingredientCount ? String(ingredientCount) + ' 个' + ingredientSourceLabel : '待读取') + '</span><small class="pfh-product-development-template-note">生成时保留所选模板的完整行、图片、备注、字体和列宽，只替换当前 SKU 字段与 A–D 文案。</small></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (displayError ? '<p class="pfh-product-development-error">' + escapeHtml(displayError) + '</p>' : '') +
      (state.productDevelopmentCopywriting && state.productDevelopmentCopywriting.blob ? '<div class="pfh-product-development-download-row"><button type="button" data-action="product-development-copywriting-download">下载 ' + escapeHtml(state.productDevelopmentCopywriting.fileName) + '</button><small>已完成禁词、品牌、星号、条数和成分覆盖校验</small></div>' : '') +
      productDevelopmentCopywritingPreviewHtml(content) +
      '<p class="pfh-product-development-note">生成结果只下载到本地，不会自动上传或修改 PLM。</p></div>';
  }

  function normalizeProductDevelopmentIngredientKind(value) {
    return String(value || '').trim().toLowerCase() === 'pet' ? 'pet' : 'human';
  }

  function productDevelopmentIngredientLocalTemplateValue(value) {
    const source = value && typeof value === 'object' ? value : {};
    const kind = normalizeProductDevelopmentIngredientKind(source.kind);
    const base64 = typeof source.base64 === 'string' ? source.base64.trim() : '';
    if (!base64 || base64.length > Math.ceil(PRODUCT_DEVELOPMENT_INGREDIENT_MAX_TEMPLATE_SIZE * 4 / 3) + 1024) return null;
    return {
      id: productDevelopmentCleanText(source.id || '', 100),
      kind,
      label: productDevelopmentCleanText(source.label || source.fileName || '本地模板', 120),
      fileName: productDevelopmentCleanText(source.fileName || 'ingredient-template.xlsx', 180),
      base64,
      local: true,
    };
  }

  function loadProductDevelopmentIngredientLocalTemplates() {
    const stored = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_INGREDIENT_LOCAL_TEMPLATE_KEY, null);
    const source = Array.isArray(stored) ? stored : (stored && Array.isArray(stored.templates) ? stored.templates : []);
    return source.map(productDevelopmentIngredientLocalTemplateValue).filter((item) => item && item.id);
  }

  function saveProductDevelopmentIngredientLocalTemplates(templates) {
    const normalized = (Array.isArray(templates) ? templates : [])
      .map(productDevelopmentIngredientLocalTemplateValue)
      .filter((item) => item && item.id)
      .slice(0, 6);
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_INGREDIENT_LOCAL_TEMPLATE_KEY, { version: 1, templates: normalized });
    return normalized;
  }

  function productDevelopmentIngredientTemplates(kind) {
    const normalizedKind = normalizeProductDevelopmentIngredientKind(kind);
    const builtins = (Array.isArray(PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES) ? PRODUCT_DEVELOPMENT_INGREDIENT_TEMPLATES : [])
      .filter((item) => item && normalizeProductDevelopmentIngredientKind(item.kind) === normalizedKind);
    return builtins.concat(loadProductDevelopmentIngredientLocalTemplates().filter((item) => item.kind === normalizedKind));
  }

  function productDevelopmentIngredientSelectedTemplate(kind, templateId) {
    const templates = productDevelopmentIngredientTemplates(kind);
    return templates.find((item) => item.id === templateId) || templates[0] || null;
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
    const cells = [];
    if (!worksheet || typeof worksheet.eachRow !== 'function') return [{ address: 'A1', row: 1, column: 1, original: '', value: '' }];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowNumber = Number(row && row.number) || 0;
      if (!rowNumber || rowNumber > 120 || !row || typeof row.eachCell !== 'function') return;
      row.eachCell({ includeEmpty: false }, (cell) => {
        const column = Number(cell && cell.col) || 0;
        if (!column || column > 40 || cells.length >= PRODUCT_DEVELOPMENT_INGREDIENT_MAX_CELLS) return;
        const value = productDevelopmentIngredientCellText(cell.value).replace(/\r\n?/g, '\n').slice(0, 6000);
        if (!value) return;
        cells.push({ address: String(cell.address || ''), row: rowNumber, column, original: value, value });
      });
    });
    return cells.length ? cells : [{ address: 'A1', row: 1, column: 1, original: '', value: '' }];
  }

  async function loadProductDevelopmentIngredientEditor() {
    const token = Number(state.productDevelopmentIngredientLoadToken || 0) + 1;
    state.productDevelopmentIngredientLoadToken = token;
    const kind = normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind);
    const template = productDevelopmentIngredientSelectedTemplate(kind, state.productDevelopmentIngredientTemplateId);
    if (!template) {
      state.productDevelopmentIngredientEditor = null;
      state.productDevelopmentIngredientError = '当前类型没有可用成分表模板';
      state.productDevelopmentIngredientBusy = false;
      renderShell();
      return;
    }
    state.productDevelopmentIngredientKind = kind;
    state.productDevelopmentIngredientTemplateId = template.id;
    state.productDevelopmentIngredientEditor = null;
    state.productDevelopmentIngredientBusy = true;
    state.productDevelopmentIngredientError = '';
    state.productDevelopmentIngredientStatus = '正在读取成分表模板…';
    renderShell();
    try {
      if (!window.ExcelJS) throw new Error('ExcelJS 尚未加载，无法读取成分表模板');
      const workbook = new window.ExcelJS.Workbook();
      await workbook.xlsx.load(base64ToArrayBuffer(template.base64));
      const sheetNames = workbook.worksheets.map((worksheet) => String(worksheet.name || '')).filter(Boolean);
      if (!sheetNames.length) throw new Error('模板没有可用工作表');
      const requestedSheet = String(state.productDevelopmentIngredientSheetName || '');
      const sheetName = sheetNames.includes(requestedSheet) ? requestedSheet : sheetNames[0];
      const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];
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
      state.productDevelopmentIngredientStatus = '模板已加载，可修改内容后保存或下载';
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
    return '<section class="pfh-product-development-review-editor"><header><div><small>模板内容</small><h3>编辑当前工作表</h3></div><span>' + cells.length + ' 个可编辑单元格</span></header><p class="pfh-product-development-form-note">修改下面的单元格内容，模板原有版式、颜色和图片会随文件保留。</p><div class="pfh-product-development-review-editor-list">' + cells.map(productDevelopmentIngredientCellInputHtml).join('') + '</div></section>';
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
    const templateOptions = templates.map((item) => '<option value="' + escapeHtml(item.id) + '"' + (item.id === (template && template.id) ? ' selected' : '') + '>' + escapeHtml(item.label + (item.local ? '（本地）' : '（内置）')) + '</option>').join('');
    const sheetOptions = sheetNames.length
      ? sheetNames.map((name) => '<option value="' + escapeHtml(name) + '"' + (name === selectedSheet ? ' selected' : '') + '>' + escapeHtml(name) + '</option>').join('')
      : '<option value="">' + (state.productDevelopmentIngredientBusy ? '正在读取工作表…' : '请先读取模板') + '</option>';
    const canExport = Boolean(editor && !state.productDevelopmentIngredientBusy);
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>INGREDIENT TABLE</small><h2>制作成分表</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>编辑成分表模板</h3><p>按食品类型选择模板和工作表，填写后下载新的 Excel 文件。</p></div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-ingredient-save-local"' + (canExport ? '' : ' disabled') + '>保存本地</button><button type="button" data-action="product-development-ingredient-export"' + (canExport ? '' : ' disabled') + '>下载 Excel</button></div></section>' +
      '<section class="pfh-product-development-detail-form"><header><div><small>模板选择</small><h3>人类食品 / 宠物食品</h3></div><span>' + escapeHtml(template ? template.fileName : '暂无模板') + '</span></header><div class="pfh-product-development-form-grid">' +
        '<label class="pfh-product-development-material-field"><span>食品类型</span><select class="pfh-product-development-ingredient-kind-input">' + typeOptions + '</select></label>' +
        '<label class="pfh-product-development-material-field"><span>成分表模板</span><select class="pfh-product-development-ingredient-template-input">' + (templateOptions || '<option value="">暂无模板</option>') + '</select></label>' +
        '<label class="pfh-product-development-material-field"><span>工作表</span><select class="pfh-product-development-ingredient-sheet-input"' + (sheetNames.length ? '' : ' disabled') + '>' + sheetOptions + '</select></label>' +
        '<label class="pfh-product-development-template-picker">添加本地 Excel 模板<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="pfh-product-development-ingredient-template-file-input"></label>' +
      '</div><small class="pfh-product-development-form-note">内置模板来自已提供的人类食品和宠物食品成分表；本地模板只保存在当前浏览器。</small></section>' +
      (state.productDevelopmentIngredientStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentIngredientStatus) + '</p>' : '') +
      (state.productDevelopmentIngredientError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentIngredientError) + '</p>' : '') +
      productDevelopmentIngredientEditorHtml(editor) +
      '<p class="pfh-product-development-note">成分表只在本地编辑和下载，不会写入 PLM。</p></div>';
  }

  async function importProductDevelopmentIngredientTemplate(file) {
    if (!file) return;
    if (!/\.xlsx$/i.test(String(file.name || '')) && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') throw new Error('请选择 XLSX 成分表模板');
    if (Number(file.size || 0) > PRODUCT_DEVELOPMENT_INGREDIENT_MAX_TEMPLATE_SIZE) throw new Error('本地模板不能超过 5 MB');
    const kind = normalizeProductDevelopmentIngredientKind(state.productDevelopmentIngredientKind);
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const id = kind + '-local-' + Date.now().toString(36);
    const template = { id, kind, label: String(file.name || '本地模板').replace(/\.xlsx$/i, '').slice(0, 100), fileName: String(file.name || 'ingredient-template.xlsx').slice(0, 180), base64, local: true };
    const templates = loadProductDevelopmentIngredientLocalTemplates().filter((item) => item.id !== id);
    templates.unshift(template);
    saveProductDevelopmentIngredientLocalTemplates(templates);
    state.productDevelopmentIngredientTemplateId = id;
    state.productDevelopmentIngredientSheetName = '';
    state.productDevelopmentIngredientEditor = null;
    state.productDevelopmentIngredientStatus = '已添加本地模板：' + template.fileName;
    state.productDevelopmentIngredientError = '';
    renderShell();
    await loadProductDevelopmentIngredientEditor();
  }

  function saveProductDevelopmentIngredientLocal() {
    if (!state.productDevelopmentIngredientEditor) {
      showToast('请先选择并读取模板');
      return;
    }
    saveProductDevelopmentIngredientEditorDraft(state.productDevelopmentIngredientEditor);
    state.productDevelopmentIngredientStatus = '已保存本地修改';
    state.productDevelopmentIngredientError = '';
    showToast('成分表修改已保存到本地');
    renderShell();
  }

  async function exportProductDevelopmentIngredientWorkbook() {
    const editor = state.productDevelopmentIngredientEditor;
    if (!editor || state.productDevelopmentIngredientBusy) {
      showToast('请先选择并读取模板');
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
    state.productDevelopmentIngredientStatus = '正在生成 Excel 文件…';
    renderShell();
    const startedAt = Date.now();
    try {
      if (!window.ExcelJS) throw new Error('ExcelJS 尚未加载，无法生成 Excel');
      const workbook = new window.ExcelJS.Workbook();
      await workbook.xlsx.load(base64ToArrayBuffer(template.base64));
      const worksheet = workbook.getWorksheet(editor.sheetName);
      if (!worksheet) throw new Error('模板工作表不存在：' + editor.sheetName);
      editor.cells.forEach((cell) => {
        if (!cell || !cell.address) return;
        const current = String(cell.value === undefined || cell.value === null ? '' : cell.value);
        const original = String(cell.original === undefined || cell.original === null ? '' : cell.original);
        if (current !== original) worksheet.getCell(cell.address).value = current ? current : null;
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const nameBase = String(template.fileName || 'ingredient-template.xlsx').replace(/\.xlsx$/i, '').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 100) || '成分表模板';
      const fileName = nameBase + '-已编辑-' + new Date().toISOString().slice(0, 10) + '.xlsx';
      downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
      state.productDevelopmentIngredientStatus = 'Excel 已下载：' + fileName;
      productDevelopmentLog('success', '成分表 Excel 生成完成', editor.kind + ' | 模板=' + template.fileName + ' | 工作表=' + editor.sheetName + ' | 用时=' + (Date.now() - startedAt) + 'ms');
      showToast('成分表 Excel 已下载');
    } catch (error) {
      state.productDevelopmentIngredientError = formatErrorMessage(error);
      state.productDevelopmentIngredientStatus = '';
      productDevelopmentLog('error', '成分表 Excel 生成失败', formatErrorMessage(error));
      showToast(state.productDevelopmentIngredientError);
    } finally {
      state.productDevelopmentIngredientBusy = false;
      renderShell();
    }
  }

  function productDevelopmentViewHtml(statusText) {
    const view = state.productDevelopmentView === 'review' ? 'review' : (state.productDevelopmentView === 'copywriting' ? 'copywriting' : (state.productDevelopmentView === 'ingredient' ? 'ingredient' : 'home'));
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
      exportProductDevelopmentIngredientWorkbook();
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
    if (target.classList.contains('pfh-product-development-copywriting-template-input')) {
      try {
        selectProductDevelopmentCopywritingTemplate(target.value);
      } catch (error) {
        showToast(formatErrorMessage(error));
      }
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
    if (target.classList.contains('pfh-product-development-ingredient-template-file-input')) {
      target.value = '';
      if (files[0]) importProductDevelopmentIngredientTemplate(files[0]).catch((error) => showToast(formatErrorMessage(error)));
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
      item[field] = String(target.value || '').slice(0, 500);
      scheduleProductDevelopmentReviewDraftSave(result);
      return true;
    }
    return true;
  }
