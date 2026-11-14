  const PRODUCT_DEVELOPMENT_VERSION = '1.33.0';
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
    Object.freeze({ id: 'regular-ndc', label: '常规涉NDC', fileName: '（ndc）24国语言健康保健类、贴类涉ndc文案模板.docx', path: 'v1/product-development-copywriting-templates/regular-ndc.docx', bytes: 105603, sha256: '3639756c75be3e1d7c347cbe28f41054dadd96084530afafdf8cec328caa0c3e' }),
    Object.freeze({ id: 'regular-non-ndc', label: '常规非NDC', fileName: '(非ndc)24国语言美妆、个护类产品文案模板.docx', path: 'v1/product-development-copywriting-templates/regular-non-ndc.docx', bytes: 104184, sha256: '9eb0fd09d70fa193a9cb96651018186aa0e9188338f3d6d7423fc33fe8136428' }),
  ]);

  const PRODUCT_DEVELOPMENT_REVIEW_DRAFT_KEY = 'plm-floating-helper:product-development-review-drafts:v1';
  const PRODUCT_DEVELOPMENT_REVIEW_DRAFT_LIMIT = 8;
  const PRODUCT_DEVELOPMENT_REVIEW_LAYOUT_KEY = 'plm-floating-helper:product-development-review-layout:v1';
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
    productLine: '',
    regularNdcKind: '',
    packagingKind: '',
    regularIngredientsEn: '',
    regularIngredientsInactiveEn: '',
    regularIngredientsCn: '',
    regularIngredientsInactiveCn: '',
  });

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
  const PRODUCT_DEVELOPMENT_COPYWRITING_RESTRICTION_RULES = Object.freeze([
    Object.freeze({
      code: 'usage',
      label: 'dosage, frequency, serving or supply claim',
      patterns: Object.freeze([
        /\b(?:serving\s+size|servings?\s+per\s+container|directions?|recommended\s+(?:use|serving|dosage)|dosage|dose)\b/i,
        /\b(?:once|twice|[1-9]\d*)\s+(?:a|per|each)\s+day\b/i,
        /\b(?:each|every|daily)\s+serving\b/i,
        /\b(?:per|each|every)\s+serving\b/i,
        /\b(?:daily|extended|long[- ]term)\s+(?:supply|serving|use|usage|intake|dose|dosage|needs?)\b/i,
        /\b\d+\s*[- ]?days?\s+supply\b/i,
        /\b(?:one|two|three|four|five|six|[1-9]\d*)\s+(?:capsules?|softgels?|tablets?|gummies?|chews?|drops?|droppers?|sprays?|scoops?|servings?)\b/i,
        /\b(?:take|consume|give)\b[\s\S]{0,80}\b(?:capsules?|softgels?|tablets?|gummies?|chews?|drops?|droppers?|sprays?|scoops?|servings?)\b/i,
        /(?:每(?:日|天)(?:\s*[一二两三四五六\d]+)?\s*(?:次|粒|颗|片|胶囊|软胶囊|软糖|滴|喷|袋|勺|毫升|毫克|份)|每(?:次|粒|颗|片|滴|喷|袋|份)|服用|食用|用量|剂量|推荐用法|推荐用量|使用方法|供应周期|每日用量|每日供应|每日需求|每天一次|每天两次|\d+\s*(?:天|日)\s*(?:供应|用量|周期))/i,
      ]),
    }),
    Object.freeze({
      code: 'dietary-attribute',
      label: 'unsupported dietary-attribute claim',
      patterns: Object.freeze([
        /\b(?:suitable\s+for\s+vegans?|vegan[- ]friendly|non[- ]?gmo|(?:gluten|sugar|dairy|soy|lactose|allergen)[- ]free|free\s+from\s+(?:gluten|added\s+sugars?|sugar|dairy|soy|lactose|allergens?)|no\s+added\s+(?:sugar|sugars|preservatives?))\b/i,
        /(?:适合素食(?:者|人群)?|素食主义|非转基因|无麸质|不含麸质|无糖|不含(?:添加)?糖|无乳制品|不含乳制品|无大豆|不含大豆|无乳糖|不含乳糖|无过敏原|不含过敏原)/i,
      ]),
    }),
    Object.freeze({
      code: 'quality-process',
      label: 'unsupported manufacturing, quality or standards claim',
      patterns: Object.freeze([
        /\b(?:strict|rigorous)\s+quality\s+control\b/i,
        /\bquality\s+(?:control|assurance|consistency)\b/i,
        /\b(?:product|formula|manufacturing)\s+consistency\b/i,
        /\b(?:recognized|established|industry|production|manufacturing)\s+standards?\b/i,
        /\b(?:manufactured|produced)\s+(?:under|following|according\s+to|in\s+compliance\s+with)\b/i,
        /(?:严格(?:的)?(?:质量|品质|生产)(?:控制|管理|标准)?|质量控制|品质控制|产品一致性|生产一致性|(?:符合|遵循|按照|依照)[^。；，,]{0,12}(?:标准|规范)|高标准生产|生产工艺|严格生产)/i,
      ]),
    }),
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
    Object.freeze({ id: 'tasks', title: '我的开发任务', subtitle: '先做侵权图和文案，再查看产品详情预填表单', action: 'product-development-tasks-open', icon: 'folder' }),
    Object.freeze({ id: 'review', title: '产品图风险筛查', subtitle: '提取全部图片文字，生成中英文修改对照图', action: 'product-development-review-open', icon: 'image' }),
    Object.freeze({ id: 'copywriting', title: '文案 DOCX', subtitle: '选择开发产品，生成双语文案文件', action: 'product-development-copywriting-open', icon: 'batchExcel' }),
    Object.freeze({ id: 'ingredientFacts', title: '制作成分表', subtitle: '按需加载云端人类或宠物模板摘要，编辑后导出 PDF', action: 'product-development-ingredient-open', icon: 'batchExcel' }),
    Object.freeze({ id: 'pricing', title: '定价标准', subtitle: '全包价格计算国内三档价格', action: 'product-development-pricing-open', icon: 'calculator' }),
    Object.freeze({ id: 'stocking', title: '备货标准', subtitle: '出单数量、手工贴标和返工 100 件规则', action: '', icon: 'box' }),
    Object.freeze({ id: 'materials', title: '包材库', subtitle: 'BOM 用过的包材自动归档，图片化浏览', action: 'product-development-materials-view', icon: 'box' }),
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
    quantity: '1000',
  });
  const PRODUCT_DEVELOPMENT_PRICING_DRAFT_KEY = 'plm-floating-helper:product-development-pricing:v1';

  // This is the intentionally small contract between the local assistant form
  // and the two-step PLM create-product drawer. Keep this list limited to the
  // fields confirmed during the current manual product creation flow; PLM
  // defaults and untouched fields should remain managed by PLM itself.
  const PRODUCT_DEVELOPMENT_PREFILL_PAGE1_FIELDS = Object.freeze([
    Object.freeze({ key: 'categoryPath', label: '类目', domId: 'form_item_category_id', control: 'cascader', placeholder: '如：成品 / 食品酒水 / 酒水饮品' }),
    Object.freeze({ key: 'productNameCn', label: '中文商品名称', domId: 'product_name0' }),
    Object.freeze({ key: 'productNameEn', label: '英文商品名称', domId: 'product_name1' }),
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
    Object.freeze({ key: 'costPrice', attrId: 153, label: '成本价', domId: 'form_item_7_attr_group_0_1_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'firstPrice', attrId: 154, label: '国内一档价格', domId: 'form_item_7_attr_group_35_0_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'secondPrice', attrId: 155, label: '国内二档价格', domId: 'form_item_7_attr_group_35_1_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'thirdPrice', attrId: 156, label: '国内三档价格', domId: 'form_item_7_attr_group_35_2_attr_language_config_json_0_value', type: 'number' }),
    Object.freeze({ key: 'standardPackingQuantity', attrId: 123, label: '标准装箱数', domId: 'form_item_8_attr_group_0_0_attr_language_config_json_0_value', type: 'number' }),
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
      brand: productDevelopmentNormalizeBrandValue(source.brand),
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
      result[key] = String(raw === undefined || raw === null ? '' : raw).trim().slice(0, key === 'requestedFunctions' ? 1800 : key === 'otherIngredientsEn' ? 1600 : key === 'otherIngredientsCn' ? 1200 : key === 'referenceUrl' ? 1200 : key === 'regularIngredientsEn' || key === 'regularIngredientsInactiveEn' || key === 'regularIngredientsCn' || key === 'regularIngredientsInactiveCn' ? 3000 : 240);
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

  function productDevelopmentOneShotSkuDraftKey(sku) {
    const normalized = String(sku || '').trim().toUpperCase();
    return normalized ? PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY + ':sku:' + encodeURIComponent(normalized) : '';
  }

  function productDevelopmentOneShotLoadDraft(sku) {
    const current = String(sku || '').trim().toUpperCase();
    const legacy = productDevelopmentOneShotInputValue(readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY, {}));
    if (!current) return legacy;
    const key = productDevelopmentOneShotSkuDraftKey(current);
    const stored = readProductDevelopmentStorage(key, null);
    if (stored && typeof stored === 'object' && String(stored.sku || '').trim().toUpperCase() === current) return productDevelopmentOneShotInputValue(stored);
    if (String(legacy.sku || '').trim().toUpperCase() === current) {
      legacy.sku = current;
      writeProductDevelopmentStorage(key, legacy);
      return legacy;
    }
    // Retain shared settings, but never borrow another SKU's ingredients.
    return productDevelopmentOneShotInputValue({
      ...legacy,
      sku: current,
      regularIngredientsEn: '',
      regularIngredientsInactiveEn: '',
      regularIngredientsCn: '',
      regularIngredientsInactiveCn: '',
      otherIngredientsEn: '',
      otherIngredientsCn: '',
    });
  }

  function saveProductDevelopmentOneShotDraft(value) {
    const draft = productDevelopmentOneShotInputValue(value);
    draft.sku = String(draft.sku || '').trim().toUpperCase();
    const key = productDevelopmentOneShotSkuDraftKey(draft.sku);
    if (key) writeProductDevelopmentStorage(key, draft);
    // Keep the original last-used draft key compatible with older clients.
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_ONE_SHOT_DRAFT_KEY, draft);
    return draft;
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
    const copywritingCategory = String(read('copywritingCategory', '') || '') === 'regular' ? 'regular' : '';
    const regularIngredientsSource = read('regularIngredients', null);
    const regularIngredientNames = (key) => Array.isArray(regularIngredientsSource[key])
      ? regularIngredientsSource[key].map((item) => productDevelopmentCleanText(item, 300)).filter(Boolean).slice(0, 80)
      : [];
    const regularIngredients = regularIngredientsSource && typeof regularIngredientsSource === 'object' ? {
      activeEn: regularIngredientNames('activeEn'),
      inactiveEn: regularIngredientNames('inactiveEn'),
      activeCn: regularIngredientNames('activeCn'),
      inactiveCn: regularIngredientNames('inactiveCn'),
      // Legacy single-column Chinese value, kept for cached results.
      cn: productDevelopmentCleanText(regularIngredientsSource.cn, 3000),
    } : null;
    const outerDimensionsSource = read('outerDimensions', null);
    const outerDimensions = Array.isArray(outerDimensionsSource) && outerDimensionsSource.length === 3
      ? outerDimensionsSource.map((value) => {
        const num = Number(value);
        return Number.isFinite(num) && num > 0 ? num : 0;
      })
      : null;
    const packagingKindRaw = String(read('packagingKind', '') || '');
    return {
      sku: productDevelopmentCleanText(read('sku', ''), 80).toUpperCase(),
      name: productDevelopmentCleanText(read('name', ''), 300),
      englishName: productDevelopmentCleanText(read('englishName', ''), 300),
      brand: productDevelopmentNormalizeBrandValue(read('brand', '')),
      productType: productDevelopmentCleanText(read('productType', ''), 180),
      productTypeCn: productDevelopmentCleanText(read('productTypeCn', ''), 180),
      netContent: productDevelopmentCleanText(read('netContent', ''), 120).toUpperCase(),
      referenceUrl: productDevelopmentCleanText(read('referenceUrl', ''), 1000),
      sourcePlainTextCopy: productDevelopmentCleanText(read('sourcePlainTextCopy', ''), 12000),
      outerDimensions,
      packagingKind: packagingKindRaw === 'boxed' || packagingKindRaw === 'bagged' ? packagingKindRaw : '',
      labeling,
      ingredientTable,
      copywritingCategory,
      regularIngredients,
      ingredients: (Array.isArray(read('ingredients', null)) ? read('ingredients', []) : []).map((pair) => ({ en: productDevelopmentCleanText(pair && pair.en, 300), cn: productDevelopmentCleanText(pair && pair.cn, 300) })).filter((pair) => pair.en || pair.cn).slice(0, 80),
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
      partialUpdateWarning: productDevelopmentCleanText(source.partialUpdateWarning, 1600),
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
      brand: productDevelopmentNormalizeBrandValue(source.brand),
      productType: productDevelopmentCleanText(source.productType || source.category, 180),
      netContent: productDevelopmentCleanText(source.netContent, 120).toUpperCase(),
      humanSupplement: source.humanSupplement === true,
      reviewMode: source.reviewMode || '',
      editorDocument: source.editorDocument && typeof source.editorDocument.replacementEn === 'string' ? {
        replacementEn: source.editorDocument.replacementEn,
        replacementZh: String(source.editorDocument.replacementZh || ''),
      } : undefined,
      sourceImageDataUrl: dataUrl(source.sourceImageDataUrl, 2600000),
      sourceImageName: productDevelopmentCleanText(source.sourceImageName || source.benchmarkImageName, 180),
      comparisonDataUrl: dataUrl(source.comparisonDataUrl, 2600000),
      items: (Array.isArray(source.items) ? source.items : []).map((item) => source.reviewMode === 'original-report' ? { ...productDevelopmentReviewDraftItem(item), sourceText: String(item.sourceText || ''), replacementEn: String(item.replacementEn == null ? item.sourceText || '' : item.replacementEn), replacementZh: String(item.replacementZh || ''), riskReason: String(item.riskReason || '') } : productDevelopmentReviewDraftItem(item)).slice(0, 80),
      extractedTexts: (Array.isArray(source.extractedTexts) ? source.extractedTexts : []).map(productDevelopmentReviewDraftItem).slice(0, 80),
      packagingBboxes: productDevelopmentReviewPackagingBboxes(source).slice(0, 8),
      warnings: Array.isArray(source.warnings) ? source.warnings.map((item) => productDevelopmentCleanText(item, 240)).filter(Boolean).slice(0, 12) : [],
      provider: productDevelopmentCleanText(source.provider, 80),
      model: productDevelopmentCleanText(source.model, 120),
      plainTextCopy: productDevelopmentCleanText(source.plainTextCopy || source.approvedPlainText || source.finalCopy, 12000),
      // Retain retired draft data for compatibility; the raw-material tool is removed.
      rawMaterialDraft: source.rawMaterialDraft && typeof source.rawMaterialDraft === 'object' ? source.rawMaterialDraft : undefined,
      productNaming: naming,
      fileName: productDevelopmentCleanText(source.fileName || productDevelopmentFileName(sku, 'infringement-comparison', 'png'), 180),
      createdAt: productDevelopmentCleanText(source.createdAt || new Date().toLocaleString(), 80),
      updatedAt: Number(source.updatedAt) || Date.now(),
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
    if (!result) return;
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
    if (state.productDevelopmentReview && state.productDevelopmentReview.sku === normalizedSku) return state.productDevelopmentReview;
    const draft = getProductDevelopmentReviewDraft(normalizedSku);
    if (!draft) return null;
    state.productDevelopmentReview = draft;
    if (draft.sourceImageDataUrl) state.productDevelopmentBenchmarkImageDataUrl = draft.sourceImageDataUrl;
    if (draft.sourceImageName) state.productDevelopmentBenchmarkImageName = draft.sourceImageName;
    return draft;
  }

  // PLM project lists store the brand column as "<brand> <category>", e.g.
  // "AMZ 美容个护" / "AMZ 健康保健食品". The brand itself is only the leading
  // token; the trailing text is a PLM category label and must not leak into
  // brand fields, copywriting or compliance checks.
  const PRODUCT_DEVELOPMENT_BRAND_TOKENS = Object.freeze(['AMZ', 'HANCHOBIT', 'ODM', 'OEM', 'DOWMOO']);
  const PRODUCT_DEVELOPMENT_BRAND_SPLIT_RE = new RegExp(
    '^(' + PRODUCT_DEVELOPMENT_BRAND_TOKENS.join('|') + ')(?:\\s+|[\\/／>＞|]+)(.+)$', 'i');

  function productDevelopmentBrandAndCategory(value) {
    const text = productDevelopmentCleanText(value, 180);
    const match = text.match(PRODUCT_DEVELOPMENT_BRAND_SPLIT_RE);
    if (!match) return { brand: text, category: '' };
    const suffix = productDevelopmentCleanText(match[2], 160);
    // Only suffixes we can map to a real PLM category path are kept. Other
    // labels (美容个护 etc.) are display-only and would otherwise be written
    // into the category cascader.
    return {
      brand: match[1].toUpperCase(),
      category: /健康保健食品/.test(suffix) ? suffix : '',
    };
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

  function productDevelopmentIsSupplement(detail, task) {
    const source = detail && typeof detail === 'object' ? detail : {};
    const taskSource = task && typeof task === 'object' ? task : {};
    const info = source.productInfo && typeof source.productInfo === 'object' ? source.productInfo : {};
    const local = source.productDetailLocalPage1 && typeof source.productDetailLocalPage1 === 'object' ? source.productDetailLocalPage1 : {};
    const categories = [local.categoryPath, taskSource.plmCategory, taskSource.categoryName, source.categoryName, source.plmCategory, source.category, info.category_name]
      .map((value) => String(value || '').trim()).filter(Boolean);
    for (const category of categories) {
      if (/健康保健|滋补保健|保健食品|膳食|营养补充|dietary\s+supplement|health\s+supplement/i.test(category)) return true;
      if (/美妆|美容|个护|护肤|身体护理|日化|化妆|家居|玩具|文具|宠物|cosmetic|beauty|skin\s*care|personal\s*care/i.test(category)) return false;
      if (/零食|糖果|饼干|巧克力|饮料|咖啡|茶饮|谷物|食用油|调味|(?:食品酒水|食物酒水)\s*(?:\/|>|→)\s*[^\s/>]+/i.test(category)) return false;
      // A generic parent category does not override another source's concrete leaf.
    }
    if (source.humanSupplement === true || taskSource.humanSupplement === true) return true;
    if (source.humanSupplement === false || taskSource.humanSupplement === false) return false;
    const names = [source.name, source.productNameCn, source.productNameEn, local.productNameCn, local.productNameEn, taskSource.name, taskSource.productNameCn, taskSource.productNameEn].filter(Boolean).join(' ');
    if (typeof productDevelopmentGuessProductLine === 'function' && productDevelopmentGuessProductLine(names) === 'regular') return false;
    // Unclassified legacy tasks used the supplement workflow; preserve that default.
    return true;
  }

  function productDevelopmentReferenceLabel(detail, task) {
    return productDevelopmentIsSupplement(detail, task) ? '返工' : '对标';
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
    const normalized = { ...meta, brand: productDevelopmentNormalizeBrandValue(meta.brand) };
    const entryEnglishProductName = productDevelopmentEntryEnglishProductName(detail, task, normalized);
    return entryEnglishProductName ? { ...normalized, productNameEn: entryEnglishProductName } : normalized;
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
    const referenceLabel = productDevelopmentReferenceLabel(detail, task);
    const meta = getProductDevelopmentTaskMeta(task, detail);
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(codeOverride !== undefined ? codeOverride : meta.reworkProductCode);
    if (!normalizedCode) {
      if (!opts.silent) showToast('请先填写' + referenceLabel + '产品编码');
      return Promise.resolve(null);
    }
    if (productDevelopmentNormalizeReworkProductCode(meta.reworkProductCode) !== normalizedCode) return Promise.resolve(null);
    const requestToken = (productDevelopmentReworkLookupRequestTokens[normalizedSku] || 0) + 1;
    productDevelopmentReworkLookupRequestTokens[normalizedSku] = requestToken;
    detail.productDevelopmentReworkLookup = {
      status: 'loading',
      code: normalizedCode,
      message: '正在读取' + referenceLabel + '产品资料…',
      updatedAt: Date.now(),
      data: null,
    };
    state.productDevelopmentStatus = '正在读取' + referenceLabel + '编码 ' + normalizedCode + '…';
    state.productDevelopmentError = '';
    renderShell();
    return productDevelopmentFetchReworkProductData(normalizedCode, detail, task).then((lookup) => {
      if (productDevelopmentReworkLookupRequestTokens[normalizedSku] !== requestToken) return null;
      const enriched = productDevelopmentApplyReworkProductLookup(detail, lookup);
      const message = referenceLabel + '编码 ' + normalizedCode + ' 已自动回填采购价、产线、价格和默认采购明细';
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
      const message = referenceLabel + '资料查询失败：' + formatErrorMessage(error);
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
    // Picking a regular NDC/non-NDC template directly must also update the
    // NDC dropdown state. Otherwise the form keeps showing the wrong field
    // set and inactive ingredients are dropped from the generated deck.
    if (productDevelopmentIsRegularCopywritingTemplateId(template.id)) {
      const input = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
        ? state.productDevelopmentOneShotInput
        : productDevelopmentOneShotLoadDraft();
      input.regularNdcKind = template.id === 'regular-ndc' ? 'ndc' : 'non-ndc';
      state.productDevelopmentOneShotInput = saveProductDevelopmentOneShotDraft(input);
    }
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
    { id: 'ingredient', label: '成分表' },
    { id: 'pricing', label: '定价标准' },
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
