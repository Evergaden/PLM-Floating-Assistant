  const PRODUCT_DEVELOPMENT_VERSION = '1.4.0';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION = 'builtin-v1';
  const PRODUCT_DEVELOPMENT_HISTORY_KEY = 'plm-floating-helper:product-development-history:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_KEY = 'plm-floating-helper:product-development-template:v1';
  const PRODUCT_DEVELOPMENT_TEMPLATE_VERSION_KEY = 'plm-floating-helper:product-development-template-version:v1';
  const PRODUCT_DEVELOPMENT_MAX_HISTORY = 8;
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
    Object.freeze({ id: 'review', title: '产品图风险筛查', subtitle: '提取图片文字，生成红框编号的中英文修改对照图', action: 'product-development-review-open', icon: 'image', badge: 'V1' }),
    Object.freeze({ id: 'copywriting', title: 'A-D 文案 DOCX', subtitle: '按当前 SKU 成分和卖点生成双语文案文件', action: 'product-development-copywriting-open', icon: 'batchExcel', badge: 'V1' }),
    Object.freeze({ id: 'pricing', title: '定价标准', subtitle: '三档价格和公式价，后续接入配置化规则', action: '', icon: 'calculator', badge: '后续' }),
    Object.freeze({ id: 'stocking', title: '备货标准', subtitle: '出单数量、手工贴标和返工 100 件规则', action: '', icon: 'box', badge: '后续' }),
    Object.freeze({ id: 'packaging', title: '包装与成分表', subtitle: '规格、标签尺寸、成分表模板和审核', action: '', icon: 'box', badge: '后续' }),
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
        templateVersion: String(source.templateVersion || '').trim().slice(0, 60),
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
    const candidates = [
      state && state.selectedSku,
      state && state.data && state.data.sku,
      state && state.sku,
      state && state.observedSku,
    ];
    return candidates.map((value) => String(value || '').trim().toUpperCase()).find(Boolean) || '';
  }

  function getProductDevelopmentSeedData(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const source = state && state.data && String(state.data.sku || '').trim().toUpperCase() === normalizedSku
      ? state.data
      : loadData(normalizedSku);
    return normalizeData(source || { sku: normalizedSku });
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
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '已选择本地对标图片：' + state.productDevelopmentBenchmarkImageName;
    renderShell();
  }

  async function loadProductDevelopmentSnapshot(sku, force, options) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const requireIngredients = !(options && options.requireIngredients === false);
    const imageKind = options && options.imageKind === 'benchmark' ? 'benchmark' : 'product';
    if (!normalizedSku) throw new Error('请先在日常工作中选择一个 SKU');
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
    const manualBenchmarkImage = imageKind === 'benchmark' ? productDevelopmentReadImageValue(state.productDevelopmentBenchmarkImageDataUrl) : '';
    let imageSource = imageKind === 'benchmark'
      ? (manualBenchmarkImage
        ? { imageUrl: manualBenchmarkImage, imageFallbackUrl: manualBenchmarkImage, source: '本地手动选择的对标图片' }
        : productDevelopmentGetBenchmarkImageSource(data))
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
        ? '当前 SKU 没有可读取的对标图片，请在页面上方手动选择对标图片'
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

  function productDevelopmentNormalizeRiskItems(value) {
    const source = value && typeof value === 'object' ? value : {};
    const list = Array.isArray(source.items) ? source.items : [];
    const seen = new Set();
    return list.map((item, index) => {
      const sourceItem = item && typeof item === 'object' ? item : {};
      const bboxSource = sourceItem.bbox || sourceItem.box || {};
      const x = Math.max(0, Math.min(1, Number(bboxSource.x)));
      const y = Math.max(0, Math.min(1, Number(bboxSource.y)));
      const w = Math.max(0, Math.min(1 - x, Number(bboxSource.w !== undefined ? bboxSource.w : bboxSource.width)));
      const h = Math.max(0, Math.min(1 - y, Number(bboxSource.h !== undefined ? bboxSource.h : bboxSource.height)));
      const sourceText = productDevelopmentCleanText(sourceItem.sourceText || sourceItem.originalText || sourceItem.text, 240);
      const replacementEn = productDevelopmentCleanText(sourceItem.replacementEn || sourceItem.modifiedEnglish || sourceItem.english, 300);
      const replacementZh = productDevelopmentCleanText(sourceItem.replacementZh || sourceItem.chinese || sourceItem.translation, 300);
      const key = [sourceText.toLowerCase(), x.toFixed(4), y.toFixed(4)].join('|');
      if (!sourceText || !replacementEn || !replacementZh || !Number.isFinite(x) || !Number.isFinite(y) || w <= 0.001 || h <= 0.001 || seen.has(key)) return null;
      seen.add(key);
      return {
        id: String(sourceItem.id || index + 1),
        sourceText,
        bbox: { x, y, w, h },
        riskTypes: Array.from(new Set((Array.isArray(sourceItem.riskTypes) ? sourceItem.riskTypes : [sourceItem.riskType])
          .map((type) => String(type || '').trim().toLowerCase())
          .filter((type) => ['banned', 'exaggeration', 'medical', 'brand', 'unsupported', 'other'].includes(type)))).slice(0, 4),
        replacementEn,
        replacementZh,
        confidence: Math.max(0, Math.min(1, Number(sourceItem.confidence) || 0)),
      };
    }).filter(Boolean).slice(0, 30);
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
    const items = productDevelopmentNormalizeRiskItems(result);
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
    for (const item of items) {
      const term = productDevelopmentFindBannedTerm(item.replacementEn + ' ' + item.replacementZh, brand);
      if (term) throw new Error('侵权对照图修改内容含风险词：' + term);
      if (item.replacementEn.includes('*') || item.replacementZh.includes('*')) throw new Error('侵权对照图修改内容不能含星号');
    }
    return {
      items,
      warnings: Array.isArray(result && result.warnings) ? result.warnings.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12) : [],
      provider: String(result && result.provider || ''),
      model: String(result && result.model || ''),
    };
  }

  function productDevelopmentWrapCanvasText(ctx, value, x, y, maxWidth, lineHeight, maxLines) {
    const text = String(value || '');
    const chars = Array.from(text);
    let line = '';
    let lines = [];
    chars.forEach((char) => {
      const candidate = line + char;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = char;
      } else line = candidate;
    });
    if (line) lines.push(line);
    lines = lines.slice(0, maxLines || 3);
    lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
    return lines.length;
  }

  async function composeProductDevelopmentComparison(sourceDataUrl, items, snapshot) {
    const image = await loadImage(sourceDataUrl);
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const padding = 32;
    const headerHeight = 92;
    const leftWidth = Math.max(760, Math.min(1180, iw));
    const rightWidth = 760;
    const imageAreaWidth = leftWidth - padding * 2;
    const imageAreaHeight = Math.max(640, Math.min(1500, ih * imageAreaWidth / iw));
    const rowHeight = 118;
    const rows = Math.max(1, Math.min(20, items.length));
    const height = Math.max(headerHeight + imageAreaHeight + padding * 2, headerHeight + rows * rowHeight + padding * 2);
    const canvas = document.createElement('canvas');
    canvas.width = leftWidth + rightWidth + padding * 3;
    canvas.height = Math.ceil(height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建对照图画布');
    ctx.fillStyle = '#f6f8fb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(padding, padding, leftWidth, canvas.height - padding * 2);
    ctx.fillRect(padding * 2 + leftWidth, padding, rightWidth, canvas.height - padding * 2);
    const titleFont = '700 30px Arial, Microsoft YaHei, sans-serif';
    ctx.font = titleFont;
    ctx.fillStyle = '#172033';
    ctx.fillText('Original Product Image', padding * 2, padding + 48);
    ctx.fillText('Revised Bilingual Copy', padding * 2 + leftWidth, padding + 48);
    const scale = Math.min(imageAreaWidth / iw, imageAreaHeight / ih);
    const drawWidth = iw * scale;
    const drawHeight = ih * scale;
    const drawX = padding + (leftWidth - drawWidth) / 2;
    const drawY = padding + headerHeight + (imageAreaHeight - drawHeight) / 2;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.strokeStyle = '#d7dee9';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, leftWidth, canvas.height - padding * 2);
    ctx.strokeRect(padding * 2 + leftWidth, padding, rightWidth, canvas.height - padding * 2);
    const displayItems = items.slice(0, 20);
    displayItems.forEach((item, index) => {
      const box = item.bbox;
      const x = drawX + box.x * drawWidth;
      const y = drawY + box.y * drawHeight;
      const w = box.w * drawWidth;
      const h = box.h * drawHeight;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(3, Math.round(Math.min(drawWidth, drawHeight) / 260));
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(Math.max(drawX + 18, x), Math.max(drawY + 18, y), 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(index + 1), Math.max(drawX + 18, x), Math.max(drawY + 24, y + 6));
      ctx.textAlign = 'left';
      const rowY = padding + headerHeight + 34 + index * rowHeight;
      ctx.fillStyle = '#ef4444';
      ctx.font = '700 22px Arial, Microsoft YaHei, sans-serif';
      ctx.fillText(String(index + 1) + '.', padding * 2 + leftWidth + 22, rowY);
      ctx.fillStyle = '#344054';
      ctx.font = '600 20px Arial, Microsoft YaHei, sans-serif';
      productDevelopmentWrapCanvasText(ctx, item.replacementEn, padding * 2 + leftWidth + 62, rowY, rightWidth - 100, 27, 2);
      ctx.fillStyle = '#667085';
      ctx.font = '18px Arial, Microsoft YaHei, sans-serif';
      productDevelopmentWrapCanvasText(ctx, '中文：' + item.replacementZh, padding * 2 + leftWidth + 62, rowY + 58, rightWidth - 100, 25, 2);
    });
    if (!displayItems.length) {
      ctx.fillStyle = '#667085';
      ctx.font = '20px Arial, Microsoft YaHei, sans-serif';
      ctx.fillText('未检测到需要修改的风险文字', padding * 2 + leftWidth + 24, padding + headerHeight + 58);
    }
    ctx.fillStyle = '#98a2b3';
    ctx.font = '16px Arial, Microsoft YaHei, sans-serif';
    ctx.fillText('SKU ' + String(snapshot && snapshot.sku || '') + ' · 原图保留 · 仅生成审核对照稿', padding * 2, canvas.height - 18);
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
      showToast('请先在日常工作中打开或选择当前 SKU');
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
          brand: snapshot.brand,
          sellingPoints: snapshot.sourceCopywriting.sellingPoints,
          efficacy: snapshot.sourceCopywriting.efficacy,
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
        comparisonDataUrl: comparison.dataUrl,
        items: validated.items,
        warnings: validated.warnings,
        provider: validated.provider,
        model: validated.model,
        fileName,
        createdAt: new Date().toLocaleString(),
      };
      saveProductDevelopmentHistory({
        id,
        sku: snapshot.sku,
        name: snapshot.name,
        kind: 'review',
        createdAt: state.productDevelopmentReview.createdAt,
        fileName,
        itemCount: validated.items.length,
        comparisonDataUrl: comparison.dataUrl,
        warnings: validated.warnings,
      });
      state.productDevelopmentStatus = validated.items.length ? '已生成对照图，请人工确认风险和修改理由' : '未检测到风险文字，可下载留档并继续人工检查';
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
    const bbox = source.bbox || {};
    const x = Number(bbox.x);
    const y = Number(bbox.y);
    const w = Number(bbox.w);
    const h = Number(bbox.h);
    return !String(source.sourceText || '').trim()
      || !String(source.replacementEn || '').trim()
      || !String(source.replacementZh || '').trim()
      || ![x, y, w, h].every(Number.isFinite)
      || x < 0 || y < 0 || w <= 0.001 || h <= 0.001 || x + w > 1 || y + h > 1;
  }

  function productDevelopmentReviewEditorHtml(result, items) {
    const rows = (Array.isArray(items) ? items : []).map((item, index) => {
      const bbox = item && item.bbox || { x: 0.08, y: 0.08, w: 0.2, h: 0.08 };
      const riskText = Array.isArray(item && item.riskTypes) && item.riskTypes.length ? item.riskTypes.join('、') : '人工添加';
      return '<article class="pfh-product-development-review-editor-row"><div class="pfh-product-development-review-editor-head"><b>' + (index + 1) + '</b><span>风险类型：' + escapeHtml(riskText) + '</span><button type="button" data-action="product-development-review-remove" data-review-index="' + index + '">删除</button></div>' +
        '<label>原图文字<input type="text" class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="sourceText" value="' + escapeHtml(item.sourceText) + '"></label>' +
        '<label>英文修改<textarea class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="replacementEn" rows="2">' + escapeHtml(item.replacementEn) + '</textarea></label>' +
        '<label>中文修改<textarea class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="replacementZh" rows="2">' + escapeHtml(item.replacementZh) + '</textarea></label>' +
        '<div class="pfh-product-development-review-bbox"><small>红框位置（归一化 0-1）</small>' +
        ['x', 'y', 'w', 'h'].map((key) => '<label>' + key + '<input type="number" min="0" max="1" step="0.01" class="pfh-product-development-review-input" data-review-index="' + index + '" data-review-field="bbox.' + key + '" value="' + escapeHtml(String(Number(bbox[key]) || 0)) + '"></label>').join('') +
        '</div></article>';
    }).join('');
    const empty = rows ? '' : '<div class="pfh-product-development-result-empty">未检测到可靠风险文字，可手动添加需要核对的图片文字。</div>';
    return '<section class="pfh-product-development-review-editor"><header><div><small>MANUAL REVIEW</small><h3>人工修改对照内容</h3></div><span>修改后点击重新生成</span></header>' + empty + '<div class="pfh-product-development-review-editor-list">' + rows + '</div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-review-add">手动添加文字</button><button type="button" data-action="product-development-review-recompose"' + (!result || state.productDevelopmentReviewBusy ? ' disabled' : '') + '>按修改重新生成对照图</button></div></section>';
  }

  async function recomposeProductDevelopmentReview() {
    const result = state.productDevelopmentReview;
    if (!result || !result.sourceImageDataUrl) {
      showToast('请先完成一次图片文字分析');
      return;
    }
    const items = Array.isArray(result.items) ? result.items : [];
    if (items.some(productDevelopmentReviewItemIncomplete)) {
      showToast('请补全原图文字、英文修改、中文修改和红框位置');
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
      const validated = productDevelopmentValidateReview({ items, warnings: result.warnings }, snapshot);
      const comparison = await composeProductDevelopmentComparison(result.sourceImageDataUrl, validated.items, snapshot);
      result.items = validated.items;
      result.comparisonDataUrl = comparison.dataUrl;
      result.warnings = validated.warnings;
      result.manualEditedAt = new Date().toLocaleString();
      saveProductDevelopmentHistory({
        id: result.id,
        sku: result.sku,
        name: snapshot.name || result.sku,
        kind: 'review',
        createdAt: result.createdAt,
        fileName: result.fileName,
        itemCount: result.items.length,
        comparisonDataUrl: result.comparisonDataUrl,
        warnings: result.warnings,
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
      showToast('请先在日常工作中打开或选择当前 SKU');
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
      state.productDevelopmentCopywriting = { id, sku: snapshot.sku, content, blob, fileName, templateVersion: state.productDevelopmentTemplateVersion || PRODUCT_DEVELOPMENT_TEMPLATE_VERSION, createdAt: new Date().toLocaleString() };
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
    if (previous !== next) state.homeModeTransition = next === 'product-development' ? 'to-product' : 'to-daily';
    state.workMode = next;
    state.productDevelopmentView = 'home';
    state.settings.workMode = next;
    saveSettings(state.settings);
    state.homeFeatureEditMode = false;
    if (next === 'product-development') {
      state.view = 'home';
      state.copywritingMode = false;
      state.productDevelopmentError = '';
    } else {
      state.view = 'home';
      state.productDevelopmentError = '';
    }
    expandPanel();
    if (state.view === 'home') {
      const panel = ensurePanel();
      const scrollSnapshot = capturePanelScroll(panel);
      renderHome(panel);
      restorePanelScroll(panel, scrollSnapshot);
    } else {
      renderShell();
    }
    if (previous !== next) {
      const transition = state.homeModeTransition;
      window.setTimeout(() => {
        if (state.homeModeTransition === transition) state.homeModeTransition = '';
      }, 520);
    }
  }

  function productDevelopmentModeSwitchHtml() {
    return '<div class="pfh-work-mode-switch" role="tablist" aria-label="工作模式">' +
      '<button type="button" data-action="work-mode" data-work-mode="daily" class="' + (state.workMode === 'daily' ? 'is-active' : '') + '">日常工作</button>' +
      '<button type="button" data-action="work-mode" data-work-mode="product-development" class="' + (state.workMode === 'product-development' ? 'is-active' : '') + '">产品开发</button>' +
      '</div>';
  }

  function productDevelopmentSkuSummaryHtml(snapshot) {
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) return '<div class="pfh-product-development-empty"><strong>还没有当前 SKU</strong><p>请先切换回日常工作，在 PLM 详情中打开一个产品，再进入产品开发。</p><button type="button" data-action="work-mode" data-work-mode="daily">返回日常工作</button></div>';
    const data = snapshot || (state.data && state.data.sku === sku ? state.data : null) || {};
    return '<article class="pfh-product-development-context"><div class="pfh-product-development-context-icon">' + iconHtml('package') + '</div><div><small>当前 PLM SKU</small><strong>' + escapeHtml(sku) + '</strong><p>' + escapeHtml(data.name || '等待读取产品资料') + '</p></div><button type="button" data-action="product-development-context-refresh">刷新资料</button></article>';
  }

  function productDevelopmentHistoryHtml(limit) {
    const maxItems = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(PRODUCT_DEVELOPMENT_MAX_HISTORY, Number(limit))) : 4;
    const history = normalizeProductDevelopmentHistory(state.productDevelopmentHistory).slice(0, maxItems);
    if (!history.length) return '<div class="pfh-product-development-history-empty">本地历史记录会显示在这里</div>';
    return history.map((item) => '<button type="button" class="pfh-product-development-history-row" data-action="product-development-history-open" data-history-id="' + escapeHtml(item.id) + '" title="打开本地历史"><span class="pfh-product-development-history-kind">' + escapeHtml(item.kind === 'review' ? '图' : '文') + '</span><div><strong>' + escapeHtml(item.sku) + '</strong><small>' + escapeHtml(item.createdAt) + ' · ' + escapeHtml(item.fileName || '') + '</small></div><em>' + (item.kind === 'review' ? item.itemCount + ' 个风险项' : 'A-D') + '</em></button>').join('');
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
        warnings: item.warnings || [],
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
      return '<article class="pfh-product-development-card' + (disabled ? ' is-disabled' : '') + '"><div class="pfh-product-development-card-head"><span>' + iconHtml(feature.icon) + '</span><i>' + escapeHtml(feature.badge) + '</i></div><h3>' + escapeHtml(feature.title) + '</h3><p>' + escapeHtml(feature.subtitle) + '</p>' + (feature.action ? '<button type="button" data-action="' + feature.action + '"' + (!sku ? ' disabled' : '') + '>打开功能 →</button>' : '<small>已记录规则，后续接入</small>') + '</article>';
    }).join('');
    return '<div class="pfh-product-development">' + productDevelopmentModeSwitchHtml() +
      '<section class="pfh-product-development-hero"><div><small>PRODUCT DEVELOPMENT / V' + escapeHtml(PRODUCT_DEVELOPMENT_VERSION) + '</small><h2>产品开发工作台</h2><p>开发资料、风险筛查和文案输出独立管理，结果只在本地生成，不向 PLM 写入。</p></div><span class="pfh-product-development-readonly">只读 PLM</span></section>' +
      productDevelopmentSkuSummaryHtml(snapshot) +
      productDevelopmentEvidenceHtml(snapshot) +
      '<section class="pfh-product-development-section"><header><div><small>FUNCTION MAP</small><h3>开发功能</h3></div><span>共用浮窗布局，和日常工作分区</span></header><div class="pfh-product-development-grid">' + cards + '</div></section>' +
      '<section class="pfh-product-development-section pfh-product-development-history"><header><div><small>LOCAL HISTORY</small><h3>本地历史</h3></div><span>最多保留 ' + PRODUCT_DEVELOPMENT_MAX_HISTORY + ' 条</span></header><div>' + productDevelopmentHistoryHtml() + '</div></section>' +
      '<p class="pfh-product-development-note">合规提示：AI 结果只能作为草稿，必须人工核对品牌、禁词、成分和平台规则；当前版本不自动查询 WIPO，也不自动回写 PLM。</p></div>';
  }

  function productDevelopmentReviewHtml() {
    const result = state.productDevelopmentReview;
    const sku = getProductDevelopmentCurrentSku();
    const resultMatchesCurrentSku = Boolean(result && result.sku === sku);
    const canShowResult = Boolean(result && (resultMatchesCurrentSku || result.fromHistory));
    const items = canShowResult ? result.items || [] : [];
    const preview = result && result.comparisonDataUrl ? '<section class="pfh-product-development-preview"><div class="pfh-product-development-preview-head"><strong>对照图预览</strong><small>滚动查看完整图片，底部可下载 PNG</small></div><div class="pfh-product-development-preview-scroll"><img src="' + escapeHtml(result.comparisonDataUrl) + '" alt="侵权对照图"></div><button type="button" data-action="product-development-review-download">下载 PNG</button></section>' : '';
    const list = canShowResult
      ? (result.fromHistory
        ? '<section class="pfh-product-development-history-readonly"><strong>本地历史对照图</strong><p>当前打开的是已保存的 PNG 结果，可查看和下载。若要修改文字或红框，请重新分析当前对标图片。</p></section>'
        : productDevelopmentReviewEditorHtml(result, items))
      : '<div class="pfh-product-development-result-empty">完成分析后，这里会列出原图文字、风险类型和修改内容，并支持手动修改。</div>';
    return '<div class="pfh-product-development pfh-product-development-subview">' + productDevelopmentModeSwitchHtml() +
      '<header class="pfh-product-development-subview-head"><button type="button" data-action="product-development-home">← 产品开发主页</button><div><small>IMAGE REVIEW</small><h2>产品图风险筛查</h2></div></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>生成侵权对照图</h3><p>以当前 SKU 的对标图片为唯一图片来源，读取图片文字后筛查品牌、禁词和夸大风险；不要求成分。原图保留，修改后可人工调整。</p><div class="pfh-product-development-review-source"><div><strong>分析图片：对标图片</strong><small>' + escapeHtml(state.productDevelopmentBenchmarkImageName ? '已手动选择：' + state.productDevelopmentBenchmarkImageName : '自动读取当前 SKU 对标图片；读取不到时可手动选择') + '</small></div><label class="pfh-product-development-benchmark-picker">选择/替换对标图片<input type="file" accept="image/*" class="pfh-product-development-benchmark-input"></label></div></div><button type="button" data-action="product-development-review-run"' + (state.productDevelopmentReviewBusy || !sku ? ' disabled' : '') + '>' + (state.productDevelopmentReviewBusy ? '正在分析…' : '开始一次分析') + '</button></section>' +
      (state.productDevelopmentStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentStatus) + '</p>' : '') +
      (state.productDevelopmentError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentError) + '</p>' : '') +
      preview + list +
      '<p class="pfh-product-development-note">本功能只发送当前图片给已配置的 AI 服务用于读取图片文字和风险初筛，不读取成分，不访问 WIPO 或其他外部查询网站，不修改原图，不发起 PLM 写入请求。</p></div>';
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
      setProductDevelopmentWorkMode(actionTarget && actionTarget.getAttribute('data-work-mode'));
      return true;
    }
    if (action === 'product-development-home') {
      state.productDevelopmentView = 'home';
      state.productDevelopmentError = '';
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
      state.productDevelopmentView = 'review';
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
      if (result.items.length >= 30) {
        showToast('最多保留 30 个风险文字项');
        return true;
      }
      result.items.push({
        id: 'manual-' + Date.now().toString(36),
        sourceText: '',
        bbox: { x: 0.08, y: 0.08, w: 0.24, h: 0.08 },
        riskTypes: ['other'],
        replacementEn: '',
        replacementZh: '',
        confidence: 0,
      });
      state.productDevelopmentStatus = '已添加手动文字项，请填写内容和红框位置';
      renderShell();
      return true;
    }
    if (action === 'product-development-review-remove') {
      const result = state.productDevelopmentReview;
      const index = Number(actionTarget && actionTarget.getAttribute('data-review-index'));
      if (result && Array.isArray(result.items) && Number.isInteger(index) && result.items[index]) {
        result.items.splice(index, 1);
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
      state.productDevelopmentView = 'copywriting';
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
      state.productDevelopmentSnapshot = null;
      if (sku) loadProductDevelopmentSnapshot(sku, true, { requireIngredients: false, imageKind: 'benchmark' }).then(() => { state.productDevelopmentStatus = '当前 SKU 资料已刷新'; renderShell(); }).catch((error) => { state.productDevelopmentError = formatErrorMessage(error); renderShell(); });
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
    target.value = '';
    if (target.classList.contains('pfh-product-development-benchmark-input')) {
      if (files[0]) importProductDevelopmentBenchmarkImage(files[0]).catch((error) => showToast(formatErrorMessage(error)));
      return true;
    }
    if (!target.classList.contains('pfh-product-development-template-input')) return false;
    if (files[0]) importProductDevelopmentTemplate(files[0]).catch((error) => showToast(formatErrorMessage(error)));
    return true;
  }

  function productDevelopmentHandleInput(event) {
    const target = event && event.target;
    if (!target || !target.classList || !target.classList.contains('pfh-product-development-review-input')) return false;
    const result = state.productDevelopmentReview;
    const index = Number(target.getAttribute('data-review-index'));
    const field = String(target.getAttribute('data-review-field') || '');
    const item = result && Array.isArray(result.items) && Number.isInteger(index) ? result.items[index] : null;
    if (!item) return true;
    if (field === 'sourceText' || field === 'replacementEn' || field === 'replacementZh') {
      item[field] = String(target.value || '').slice(0, 500);
      return true;
    }
    if (field.indexOf('bbox.') === 0) {
      const key = field.slice(5);
      if (['x', 'y', 'w', 'h'].includes(key)) {
        const value = Number(target.value);
        if (Number.isFinite(value)) item.bbox[key] = Math.max(0, Math.min(1, value));
      }
      return true;
    }
    return true;
  }
