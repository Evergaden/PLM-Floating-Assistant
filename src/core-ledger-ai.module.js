
  function openLedgerFinalizedTimeEditor(sku, dateKey) {
    if (!sku) return;
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    if (!existing || !existing.finalizedAt) {
      showToast('请先定稿后再修改时间');
      return;
    }
    state.ledgerTimeEditor = { sku, dateKey: key, timeMs: existing.finalizedAtMs || parseLedgerDateTimeMs(existing.finalizedAt) || Date.now() };
    renderShell();
  }

  function saveLedgerFinalizedTimeEditor() {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hour = panel.querySelector('.pfh-ledger-time-hour');
    const minute = panel.querySelector('.pfh-ledger-time-minute');
    const value = String(dateInput && dateInput.value || '').trim() + ' ' + String(hour && hour.value || '').trim().padStart(2, '0') + ':' + String(minute && minute.value || '').trim().padStart(2, '0');
    const timeMs = parseLedgerDateTimeMs(value);
    if (!timeMs) {
      showToast('时间格式不正确，请使用 2026-07-10 14:30');
      return;
    }
    const date = new Date(timeMs);
    const finalizedDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    updateDailyLedgerForSku(editor.sku, {
      status: '已定稿',
      stage: '已定稿',
      finalizedAt: formatLedgerMinuteLabel(timeMs),
      finalizedDate,
      finalizedAtMs: timeMs,
      note: '已修改定稿时间',
    }, editor.dateKey);
    state.ledgerTimeEditor = null;
    showToast('定稿时间已更新');
    renderShell();
  }

  function updateLedgerTimeEditorPreset(action) {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const date = new Date();
    if (action === 'ledger-time-yesterday') date.setDate(date.getDate() - 1);
    else if (action === 'ledger-time-day-before') date.setDate(date.getDate() - 2);
    date.setHours(9, 0, 0, 0);
    editor.timeMs = date.getTime();
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hourInput = panel.querySelector('.pfh-ledger-time-hour');
    const minuteInput = panel.querySelector('.pfh-ledger-time-minute');
    if (dateInput) dateInput.value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    if (hourInput) hourInput.value = String(date.getHours()).padStart(2, '0');
    if (minuteInput) minuteInput.value = String(date.getMinutes()).padStart(2, '0');
  }

  function getSelectedLedgerWorkFlagRecords(sku, dateKey) {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const key = normalizeLedgerDate(dateKey);
    if (!sku || !key || !selected.has(getLedgerSelectionKey({ sku, date: key }))) return [];
    return getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((record) => selected.has(getLedgerSelectionKey(record)));
  }

  function toggleLedgerWorkFlag(action, sku, dateKey) {
    if (!sku) return;
    syncDailyLedgerBeforeMutation();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const field = action === 'ledger-toggle-box-file'
      ? 'boxFileState'
      : (action === 'ledger-toggle-label-file' ? 'labelFileState' : 'imagePackState');
    const doneField = action === 'ledger-toggle-box-file'
      ? 'boxFileDone'
      : (action === 'ledger-toggle-label-file' ? 'labelFileDone' : 'imagePackDone');
    const label = field === 'boxFileState' ? '\u7eb8\u76d2\u6587\u4ef6' : (field === 'labelFileState' ? '\u6807\u7b7e\u5370\u5237\u6587\u4ef6' : '\u56fe\u5305');
    const nextValue = nextLedgerFileState(existing && existing[field], existing && existing[doneField]);
    if (action === 'ledger-toggle-image-pack' && nextValue !== 'pending') state.ledgerFilterWorkflow = 'image-pack-pending';
    const selectedRecords = getSelectedLedgerWorkFlagRecords(sku, key);
    if (selectedRecords.length > 1) {
      const patch = { [field]: nextValue, [doneField]: nextValue === 'done', note: label + ledgerFileStateLabel(nextValue), skipStorageSync: true, deferSave: true, skipUnchanged: true };
      let changedCount = 0;
      selectedRecords.forEach((record) => {
        const updatedRecord = updateDailyLedgerForSku(record.sku, patch, record.date);
        if (updatedRecord !== record) changedCount += 1;
      });
      if (changedCount) saveDailyLedger();
      if (state.view === 'ledger' && !renderLedgerTabContent(ensurePanel())) renderShell();
      refreshLedgerPerformanceSummary();
      scheduleDesktopBridgeSnapshot();
      showToast('已同步 ' + selectedRecords.length + ' 个选中产品的' + label + '：' + ledgerFileStateLabel(nextValue));
      return;
    }
    const updatedRecord = updateDailyLedgerForSku(sku, { [field]: nextValue, [doneField]: nextValue === 'done', note: label + ledgerFileStateLabel(nextValue), skipStorageSync: true }, key);
    refreshLedgerCard(updatedRecord);
    scheduleDesktopBridgeSnapshot();
  }

  function getLedgerAiImageStatusMeta(record) {
    const status = normalizeLedgerAiImageStatus(record && record.aiImageStatus, record && record.aiImageMessage);
    const manual = normalizeLedgerArtworkState(record && record.artworkState);
    const mainCount = normalizeLedgerAiImageItems(record && record.aiMainImages, 12).length;
    const detailCount = normalizeLedgerAiImageItems(record && record.aiDetailImages, 20).length;
    const total = mainCount + detailCount;
    if (status === 'success' && total) return { status, label: '查看生图 · ' + total, title: '点击查看 AI 生图（主图 ' + mainCount + ' 张，详情图 ' + detailCount + ' 张）', count: total };
    if (status === 'result-missing') return { status, label: '结果缺失', title: 'PLM 返回完成状态但没有图片列表，打开后可手动重新生成', count: 0 };
    if (status === 'success') return { status, label: '结果缺失', title: 'AI 生图完成但没有图片列表，打开后可手动重新生成', count: 0 };
    if (status === 'loading') {
      const message = String(record && record.aiImageMessage || '');
      const preparing = /正在准备|提交 PLM AI 生图/.test(message);
      return { status, label: preparing ? '准备生图…' : '检查生图历史…', title: preparing ? '正在准备生图资料并提交 PLM AI 生图' : '正在检查是否存在 PLM AI 生图历史，不会提交生成请求', count: 0 };
    }
    if (status === 'running') return { status, label: '生图中…', title: 'PLM AI 生图正在执行，只跟踪当前 SKU', count: 0 };
    if (status === 'empty') return { status, label: '查询生图', title: '当前没有可查看的 PLM AI 生图；打开后可手动选择主图或详情图生成', count: 0 };
    if (status === 'needs-prerequisites') return { status, label: '需补全资料', title: '生图前置校验未通过，请先补齐产品文案和 SKU 效果图', count: 0 };
    if (status === 'needs-sku-image') return { status, label: '需补全 SKU 图', title: 'PLM 缺少 SKU 效果图，请先上传 SKU 图后再生成', count: 0 };
    if (status === 'needs-copywriting') return { status, label: '需补全文案', title: 'PLM 缺少有效产品文案，请先补齐产品文案后再生成', count: 0 };
    if (status === 'task-error') return { status, label: '任务异常', title: 'PLM 有生图任务记录但查询不到结果，请刷新或联系管理员清理任务', count: 0 };
    if (status === 'error') return { status, label: '查询失败', title: 'AI 生图状态查询失败，打开后可手动刷新', count: 0 };
    if (manual === 'doing') return { status, label: '生图中 · 查询', title: '当前是手动生图标记，点击查询 PLM 实际状态', count: 0 };
    if (manual === 'done') return { status, label: '已生图 · 查询', title: '当前是手动完成标记，点击查询并查看 PLM AI 生图', count: 0 };
    return { status, label: '查询生图', title: '点击查询 PLM AI 生图状态；不会自动提交文案或开始生成', count: 0 };
  }

  function ledgerArtworkStateButtonHtml(record, sku, dateAttr) {
    const meta = getLedgerAiImageStatusMeta(record);
    return '<button type="button" class="pfh-ledger-artwork is-ai-' + escapeHtml(meta.status) + '" data-action="ledger-ai-image" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="' + escapeHtml(meta.title) + '" aria-label="' + escapeHtml('生图状态：' + meta.label) + '">' + escapeHtml(meta.label) + '</button>';
  }

  function ledgerAiImageGenerateButtonHtml(record, kind, status) {
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const label = normalizedKind === 'detail' ? '详情图' : '主图';
    const requestKey = getLedgerAiImageRequestKey(record && record.sku);
    const busy = ['loading', 'running'].includes(status) || Boolean(state.ledgerAiImageRequests[requestKey]);
    const retry = ['error', 'needs-copywriting', 'needs-sku-image', 'needs-prerequisites', 'task-error', 'result-missing'].includes(status);
    const text = busy ? '生成中…' : (retry ? '重新生成' + label + ' AI' : '生成' + label + ' AI');
    return '<button type="button" class="pfh-ledger-ai-image-generate" data-action="ledger-ai-image-generate" data-kind="' + normalizedKind + '" data-sku="' + escapeHtml(record && record.sku || '') + '" data-date="' + escapeHtml(record && record.date || '') + '" title="点击后读取实时产品文案并提交 PLM AI 生图；PLM 接口会同时返回主图和详情图"' + (busy ? ' disabled' : '') + '>' + escapeHtml(text) + '</button>';
  }

  function getLedgerAiImageRequestKey(sku) {
    return getLedgerSkuKey(sku);
  }

  function getLedgerAiImageDownloadKey(sku, dateKey, kind) {
    return getLedgerAiImageRequestKey(sku) + '|' + (normalizeLedgerDate(dateKey) || '') + '|' + (kind === 'detail' ? 'detail' : 'main');
  }

  function findLedgerRecord(sku, dateKey) {
    const normalizedSku = getLedgerSkuKey(sku);
    const normalizedDate = normalizeLedgerDate(dateKey);
    return (state.ledgerRecords || []).find((item) => getLedgerSkuKey(item.sku) === normalizedSku && (!normalizedDate || normalizeLedgerDate(item.date) === normalizedDate)) || null;
  }

  function parseLedgerAiImageResult(payload) {
    const data = payload && payload.data && typeof payload.data === 'object' ? payload.data : {};
    const mainImages = normalizeLedgerAiImageItems(data.mainImages || data.main_images, 12);
    const detailImages = normalizeLedgerAiImageItems(data.detailImages || data.detail_images, 20);
    const statusCode = Number(data.status);
    const message = String(data.message || payload && (payload.message || payload.msg) || '').trim();
    const jobId = String(data.job_id || data.jobId || '').trim();
    const hasImages = mainImages.length || detailImages.length;
    const status = hasImages
      ? 'success'
      : statusCode === 1
        ? 'running'
        : statusCode === 2
          ? 'result-missing'
          : /失败|错误|异常|fail|error/i.test(message)
            ? 'error'
            : 'empty';
    return {
      status,
      message: message || (status === 'running'
        ? 'AI 生成提示：任务执行中'
        : (status === 'result-missing' ? 'PLM 返回完成状态但没有图片列表' : (status === 'empty' ? '未发现可用的 AI 生图任务' : '执行成功'))),
      jobId,
      mainImages,
      detailImages,
    };
  }

  function getLedgerAiImageCopywriteList(payload) {
    const data = payload && payload.data !== undefined ? payload.data : payload;
    if (Array.isArray(data)) return data;
    const candidates = [
      data && data.textList,
      data && data.text_list,
      data && data.copywrite,
      data && data.copyWrite,
      payload && payload.textList,
      payload && payload.text_list,
    ];
    return candidates.find((value) => Array.isArray(value)) || [];
  }

  const LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS = [
    {
      key: 'new_product_usage',
      label: '使用说明',
      types: ['new_product_usage', 'product_usage', 'usage'],
      labels: ['建议使用方法', '使用说明', 'recommended usage', 'directions of safe use'],
    },
    {
      key: 'new_product_selling_points',
      label: '产品卖点',
      types: ['new_product_selling_points', 'product_selling_points', 'selling_points'],
      labels: ['产品卖点', 'product selling points'],
    },
    {
      key: 'new_product_efficacy',
      label: '产品功效',
      types: ['new_product_efficacy', 'product_efficacy', 'efficacy'],
      labels: ['产品功效', 'product efficacy'],
    },
    {
      key: 'new_product_advantages',
      label: '产品优势',
      types: ['new_product_advantages', 'product_advantages', 'advantages'],
      labels: ['产品优势', 'product advantages'],
    },
  ];

  function isLedgerAiImageRecommendationItem(source) {
    const item = source && typeof source === 'object' ? source : {};
    const type = String(item.type || item.key || '').trim().toLowerCase();
    const title = [item.title, item.title_cn, item.titleCn, item.label, item.name]
      .map((part) => String(part || '').trim().toLowerCase())
      .filter(Boolean)
      .join(' ');
    return type === 'new_product_recommendation'
      || type === 'product_recommendation'
      || /new product recommendation|recommendation list|新品(?:temu)?推荐类目|新品文案/.test(title);
  }

  function getLedgerAiImageCopywriteValues(item) {
    const source = item && typeof item === 'object' ? item : { value: item };
    const rawValueEn = getApiScalarText(source.value !== undefined ? source.value : (source.value_en !== undefined ? source.value_en : (source.valueEn !== undefined ? source.valueEn : (source.english !== undefined ? source.english : source.en))), 0);
    const rawValueCn = getApiScalarText(source.value_cn !== undefined ? source.value_cn : (source.valueCn !== undefined ? source.valueCn : (source.chinese !== undefined ? source.chinese : source.zh)), 0);
    const valueEn = isLedgerAiImageRecommendationItem(source) && !rawValueEn ? rawValueCn : rawValueEn;
    const valueCn = rawValueCn;
    const fallback = getApiScalarText(source.text !== undefined ? source.text : source.content, 0);
    return {
      value: String(valueEn || '').trim(),
      value_cn: String(valueCn || '').trim(),
      fallback: String(fallback || '').trim(),
    };
  }


  function normalizeLedgerAiImageCopywriteItems(value) {
    return (Array.isArray(value) ? value : []).map((item, index) => {
      const source = item && typeof item === 'object' ? item : { value: item };
      const values = getLedgerAiImageCopywriteValues(source);
      const fallbackIsChinese = /[\u3400-\u9fff]/.test(values.fallback);
      const normalizedEn = String(values.value || (!fallbackIsChinese ? values.fallback : '') || '').trim();
      const normalizedCn = String(values.value_cn || (fallbackIsChinese ? values.fallback : '') || '').trim();
      if (!normalizedEn && !normalizedCn) return null;
      return {
        id: Number(source.id || source.key || index + 1) || index + 1,
        type: String(source.type || source.key || 'product_text_' + (index + 1)).trim().slice(0, 80),
        title: String(source.title || source.title_en || source.titleEn || source.label || source.name || source.type || '').trim().slice(0, 160),
        title_cn: String(source.title_cn || source.titleCn || source.title_zh || source.titleZh || source.label_cn || source.labelCn || source.label || source.name || source.title || '').trim().slice(0, 160),
        value: normalizedEn.slice(0, 12000),
        value_cn: normalizedCn.slice(0, 12000),
      };
    }).filter(Boolean).slice(0, 40);
  }


  function getLedgerAiImagePayloadRoots(payload) {
    const roots = [];
    const add = (value) => {
      if (!value || typeof value !== 'object' || roots.includes(value)) return;
      roots.push(value);
    };
    add(payload);
    add(payload && payload.data);
    add(payload && payload.result);
    add(payload && payload.data && payload.data.data);
    add(payload && payload.data && payload.data.result);
    return roots;
  }

  function getLedgerAiImagePayloadField(payload, keys) {
    const roots = getLedgerAiImagePayloadRoots(payload);
    for (const root of roots) {
      for (const key of keys || []) {
        if (root[key] === undefined || root[key] === null) continue;
        const value = getApiScalarText(root[key], 0);
        if (value) return value;
      }
    }
    return '';
  }

  function getLedgerAiImageLiveIngredientPayload(payload) {
    return {
      product_ingredients_efficacy_ch: getLedgerAiImagePayloadField(payload, ['product_ingredients_efficacy_ch', 'productIngredientsEfficacyCh']),
      product_ingredients_summary_ch: getLedgerAiImagePayloadField(payload, ['product_ingredients_summary_ch', 'productIngredientsSummaryCh']),
      product_ingredients_efficacy_en: getLedgerAiImagePayloadField(payload, ['product_ingredients_efficacy_en', 'productIngredientsEfficacyEn']),
      product_ingredients_summary_en: getLedgerAiImagePayloadField(payload, ['product_ingredients_summary_en', 'productIngredientsSummaryEn']),
    };
  }

  function getLedgerAiImagePlmAttributeValue(values, spec, languageId) {
    const candidates = Array.isArray(values) ? values : [];
    const language = Number(languageId) || 1;
    const ids = new Set((spec && spec.ids || []).map((value) => String(value)));
    const variables = new Set((spec && spec.variables || []).map((value) => String(value).toLowerCase()));
    const labels = spec && spec.label instanceof RegExp ? spec.label : null;
    const matches = candidates.filter((item) => {
      if (!item || Number(item.language_id) !== language) return false;
      const idMatch = ids.size && ids.has(String(item.attr_id));
      const variable = String(item.variable_name || '').trim().toLowerCase();
      const label = String(item.attr_name || '').trim();
      return idMatch || (variables.size && variables.has(variable)) || (labels && labels.test(label));
    });
    const match = matches.find((item) => isValidLedgerAiImageText(getApiScalarText(item.value, 0))) || matches[0];
    return match ? String(getApiScalarText(match.value, 0) || '').trim() : '';
  }

  function getLedgerAiImagePlmCopywritingPayload(contentPayload) {
    const values = flattenMagicUploadProductAttributes(contentPayload);
    const value = (spec) => ({
      cn: getLedgerAiImagePlmAttributeValue(values, spec, 1),
      en: getLedgerAiImagePlmAttributeValue(values, spec, 2),
    });
    return {
      usage: value({ ids: [370], variables: ['usage_method'], label: /使用方法|directions/i }),
      sellingPoints: value({ ids: [223], variables: ['product_selling_points'], label: /产品卖点|selling points/i }),
      efficacy: value({ ids: [368], variables: ['product_efficacy'], label: /产品功效|product efficacy/i }),
      advantages: value({ ids: [222], variables: ['product_advantages'], label: /产品优势|product advantages/i }),
      ingredientSummary: value({ ids: [395], variables: ['ingredients'], label: /^成分$|ingredients?/i }),
      ingredientEfficacy: value({ ids: [217], variables: ['ingredient_function'], label: /成分功能|component function/i }),
    };
  }

  function mergeLedgerAiImagePlmCopywritingPayload(preparation, payload, options) {
    const target = preparation || {};
    const source = payload || {};
    const authoritative = Boolean(options && options.authoritative);
    const byKey = {
      usage: 'new_product_usage',
      sellingPoints: 'new_product_selling_points',
      efficacy: 'new_product_efficacy',
      advantages: 'new_product_advantages',
    };
    Object.keys(byKey).forEach((key) => {
      const values = source[key] || {};
      const rule = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.find((item) => item.key === byKey[key]);
      if (!rule) return;
      const item = ensureLedgerAiPreparationCopyItem(target, rule);
      if (authoritative || !String(item.value_cn || '').trim()) item.value_cn = String(values.cn || '').trim();
      if (authoritative || !String(item.value || '').trim()) item.value = String(values.en || '').trim();
    });
    const ingredientMap = {
      ingredientSummary: ['product_ingredients_summary_ch', 'product_ingredients_summary_en'],
      ingredientEfficacy: ['product_ingredients_efficacy_ch', 'product_ingredients_efficacy_en'],
    };
    target.ingredients = target.ingredients && typeof target.ingredients === 'object' ? target.ingredients : {};
    Object.keys(ingredientMap).forEach((key) => {
      const values = source[key] || {};
      const fields = ingredientMap[key];
      if (authoritative || !String(target.ingredients[fields[0]] || '').trim()) target.ingredients[fields[0]] = String(values.cn || '').trim();
      if (authoritative || !String(target.ingredients[fields[1]] || '').trim()) target.ingredients[fields[1]] = String(values.en || '').trim();
    });
    return target;
  }


  function isValidLedgerAiImageText(value) {
    const text = String(value || '').trim();
    return text.length >= 3 && !/^(?:--+|null|undefined|none|n\/a|无|暂无|待补|待填写)$/i.test(text);
  }

  function getLedgerAiPreparationKey(sku) {
    return getLedgerSkuKey(sku);
  }

  function findLedgerAiPreparationCopyItem(preparation, rule) {
    const items = preparation && Array.isArray(preparation.copywrite) ? preparation.copywrite : [];
    return items.find((candidate) => {
      const source = candidate && typeof candidate === 'object' ? candidate : {};
      const type = String(source.type || source.key || '').trim().toLowerCase();
      const title = [source.title_cn, source.title, source.label, source.name].map((part) => String(part || '').trim().toLowerCase()).join(' ');
      return rule.types.some((candidateType) => type === candidateType) || rule.labels.some((label) => title.includes(String(label).toLowerCase()));
    }) || null;
  }

  function findLedgerAiImageRecommendationItem(preparation) {
    const items = preparation && Array.isArray(preparation.copywrite) ? preparation.copywrite : [];
    return items.find(isLedgerAiImageRecommendationItem) || null;
  }

  function ensureLedgerAiPreparationCopyItem(preparation, rule) {
    let item = findLedgerAiPreparationCopyItem(preparation, rule);
    if (item) return item;
    item = { id: (preparation.copywrite || []).length + 1, type: rule.key, title: rule.label, title_cn: rule.label, value: '', value_cn: '' };
    preparation.copywrite = (preparation.copywrite || []).concat(item);
    return item;
  }

  function calculateLedgerAiPreparationMissing(preparation) {
    const missing = [];
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      const item = findLedgerAiPreparationCopyItem(preparation, rule);
      if (!item || !isValidLedgerAiImageText(getLedgerAiImageCopywriteValues(item).value_cn)) missing.push(rule.label + '（中文）');
      if (!item || !isValidLedgerAiImageText(getLedgerAiImageCopywriteValues(item).value)) missing.push(rule.label + '（英文）');
    });
    const ingredients = preparation && preparation.ingredients || {};
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_summary_ch)) missing.push('成分（中文）');
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_summary_en)) missing.push('成分（英文）');
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_efficacy_ch)) missing.push('成分功能（中文）');
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_efficacy_en)) missing.push('成分功能（英文）');
    const recommendation = getLedgerAiImageCopywriteValues(findLedgerAiImageRecommendationItem(preparation));
    if (!isValidLedgerAiImageText(recommendation.value)) missing.push('新品推荐类目');
    if (preparation && preparation.plmDetailLoaded === false) missing.push('PLM 详情资料');
    if (!preparation || !preparation.skuImage || preparation.skuImage.status !== 'available') missing.push('SKU 效果图');
    return missing;
  }

  function getLedgerAiPreparationMissing(preparation) {
    return preparation && Array.isArray(preparation.plmMissing)
      ? preparation.plmMissing.slice()
      : calculateLedgerAiPreparationMissing(preparation);
  }

  async function loadLedgerAiImagePreparation(sku, force) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const key = getLedgerAiPreparationKey(normalizedSku);
    if (!force && state.ledgerAiImagePreparations[key]) return state.ledgerAiImagePreparations[key];
    const data = normalizeData(loadData(normalizedSku) || { sku: normalizedSku });
    const preparation = { sku: normalizedSku, copywrite: [], ingredients: {}, skuImage: { status: 'unknown', reason: '' }, loading: true, loadingStage: '正在读取产品文案', loadingDetail: '先检查使用方法、卖点、功效、优势和成分；不会自动提交生图。', saving: false, error: '', plmDetailLoaded: false, updatedAtMs: Date.now() };
    state.ledgerAiImagePreparations[key] = preparation;
    const renderStage = (stage, detail) => {
      preparation.loadingStage = stage;
      preparation.loadingDetail = detail;
      preparation.updatedAtMs = Date.now();
      if (state.view === 'ledger' && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku)) {
        renderLedgerAiImageViewer(ensurePanel());
      }
    };
    renderStage('正在读取产品文案', '检查使用方法、卖点、功效、优势和成分；不会自动提交生图。');
    try {
      const payload = await fetchPlmJson(LEDGER_AI_IMAGE_COPYWRITING_ENDPOINT + '?code=' + encodeURIComponent(normalizedSku));
      if (payload && payload.success === false) throw new Error(formatPlmApiMessage(payload.msg) || formatPlmApiMessage(payload.message) || 'PLM 产品文案接口返回失败');
      preparation.copywrite = normalizeLedgerAiImageCopywriteItems(getLedgerAiImageCopywriteList(payload));
      preparation.ingredients = getLedgerAiImageLiveIngredientPayload(payload);
    } catch (error) {
      preparation.error = '读取 PLM 文案失败：' + (formatErrorMessage(error) || '接口异常');
    }
    renderStage('正在读取商品详情字段', '继续核对 PLM 详情中的中英文文案和功能字段…');
    try {
      const snapshot = await fetchApiProductSnapshot(data, { force: true });
      let contentPayload = snapshot && snapshot.contentPayload;
      if (snapshot && snapshot.productId && snapshot.productVersionId && snapshot.categoryId) {
        try {
          contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(snapshot.productId) + '&category_id=' + encodeURIComponent(snapshot.categoryId) + '&product_version_id=' + encodeURIComponent(snapshot.productVersionId));
        } catch (_) {
          // The read-only snapshot remains a compatible fallback for older PLM deployments.
        }
      }
      if (!contentPayload) throw new Error('PLM 商品详情未返回字段数据');
      const plmCopywriting = getLedgerAiImagePlmCopywritingPayload(contentPayload);
      preparation.plmDetailLoaded = true;
      mergeLedgerAiImagePlmCopywritingPayload(preparation, plmCopywriting, { authoritative: true });
    } catch (error) {
      preparation.plmDetailError = '读取 PLM 详情字段失败：' + (formatErrorMessage(error) || '接口异常');
    }
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      ensureLedgerAiPreparationCopyItem(preparation, rule);
    });
    renderStage('正在检查 SKU 效果图', '检查 PLM 的 sku_pic / SKU 效果图字段，确认是否具备生图条件…');
    try { preparation.skuImage = await fetchLedgerAiImageSkuPreflight(normalizedSku, data); }
    catch (error) { preparation.skuImage = { status: 'unknown', reason: formatErrorMessage(error) || '接口异常' }; }
    preparation.plmMissing = calculateLedgerAiPreparationMissing(preparation);
    preparation.loading = false;
    preparation.loadingStage = '生图资料检查完成';
    preparation.loadingDetail = preparation.plmMissing.length ? '已完成读取，正在展示缺少的字段和效果图检查结果。' : '文案和 SKU 效果图已完成检查，可以继续保存或提交。';
    preparation.updatedAtMs = Date.now();
    if (state.view === 'ledger' && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku)) {
      renderLedgerAiImageViewer(ensurePanel());
    }
    return preparation;
  }

  function getLedgerAiImagePreparationPayload(preparation) {
    const missing = getLedgerAiPreparationMissing(preparation);
    if (missing.length) {
      const error = new Error('AI 生图资料不完整：' + missing.join('、'));
      error.ledgerAiImagePreflight = {
        missingCopywriting: missing.some((item) => item !== 'SKU 效果图'),
        missingCopywriteFields: missing.filter((item) => !/^成分/.test(item) && item !== 'SKU 效果图'),
        missingIngredientFields: missing.filter((item) => /^成分/.test(item)),
        skuImageStatus: preparation && preparation.skuImage && preparation.skuImage.status || 'unknown',
        skuImageReason: preparation && preparation.skuImage && preparation.skuImage.reason || '',
      };
      throw error;
    }
    return { code: preparation.sku, copywrite: normalizeLedgerAiImageCopywriteItems(preparation.copywrite), ...(preparation.ingredients || {}) };
  }

  function ledgerAiImageLoadingHtml(title, detail, options) {
    const submitting = Boolean(options && options.submitting);
    const note = submitting
      ? '已开始向 PLM 提交生图请求，请勿重复点击；提交完成后会显示“生图中”，可手动刷新查看结果。'
      : '这是后台读取和校验，不会自动提交生图；网络较慢时仍可继续等待。';
    return '<div class="pfh-ledger-ai-image-loading" role="status" aria-live="polite"><span class="pfh-ledger-ai-loading-spinner" aria-hidden="true"></span><div><strong>' + escapeHtml(title || '正在读取生图资料') + '</strong><p>' + escapeHtml(detail || '正在从 PLM 读取资料，请稍候…') + '</p><small>' + escapeHtml(note) + '</small></div></div>';
  }

  function ledgerAiImagePreparationHtml(record, kind) {
    const preparation = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(record && record.sku)];
    const submitting = /(?:准备提交|提交 PLM AI 生图|已开始提交|生图请求)/i.test(String(record && record.aiImageMessage || ''));
    if (!preparation) return ledgerAiImageLoadingHtml('正在准备生图资料', '页面会依次读取产品文案、商品详情和 SKU 效果图，请稍候…', { submitting });
    if (preparation.loading) return ledgerAiImageLoadingHtml(preparation.loadingStage || '正在读取生图资料', preparation.loadingDetail || '正在从 PLM 读取生图前置资料，请稍候…', { submitting });
    const rows = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.map((rule) => {
      const item = ensureLedgerAiPreparationCopyItem(preparation, rule);
      const values = getLedgerAiImageCopywriteValues(item);
      return '<fieldset class="pfh-ledger-ai-prep-row"><legend>' + escapeHtml(rule.label) + '</legend><label>中文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(values.value_cn) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="copy" data-prep-key="' + escapeHtml(rule.key) + '" data-prep-lang="cn" placeholder="填写 PLM 中文' + escapeHtml(rule.label) + '">' + escapeHtml(values.value_cn) + '</textarea></label><label>英文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(values.value) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="copy" data-prep-key="' + escapeHtml(rule.key) + '" data-prep-lang="en" placeholder="填写 PLM 英文' + escapeHtml(rule.label) + '">' + escapeHtml(values.value) + '</textarea></label></fieldset>';
    }).join('');
    const ingredientRows = [
      ['product_ingredients_summary', '成分'],
      ['product_ingredients_efficacy', '成分功能'],
    ].map(([key, label]) => '<fieldset class="pfh-ledger-ai-prep-row"><legend>' + label + '</legend><label>中文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(preparation.ingredients[key + '_ch']) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="ingredient" data-prep-key="' + key + '_ch" placeholder="填写 PLM 中文' + label + '">' + escapeHtml(preparation.ingredients[key + '_ch'] || '') + '</textarea></label><label>英文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(preparation.ingredients[key + '_en']) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="ingredient" data-prep-key="' + key + '_en" placeholder="填写 PLM 英文' + escapeHtml(label) + '">' + escapeHtml(preparation.ingredients[key + '_en'] || '') + '</textarea></label></fieldset>').join('');
    const missing = getLedgerAiPreparationMissing(preparation);
    const imageStatus = preparation.skuImage && preparation.skuImage.status === 'available' ? 'SKU 效果图已就绪' : 'SKU 效果图不可用：' + (preparation.skuImage && preparation.skuImage.reason || '未找到');
    const prepKey = getLedgerAiPreparationKey(record.sku);
    const busy = Boolean(state.ledgerAiImageAutofillRequests[prepKey]);
    const saving = Boolean(state.ledgerAiImageSaveRequests[prepKey] || preparation.saving);
    const preparationNotice = preparation.error || preparation.plmDetailError
      ? (preparation.error || preparation.plmDetailError) + '；当前按 PLM 资料不完整处理。'
      : (missing.length
        ? 'PLM 数据检测缺少：' + missing.join('、') + '。填写后请点击“保存到 PLM 草稿”；没有 SKU 效果图时不会允许开始 AI 生图。'
        : 'PLM 草稿已保存且后台回读完整；提交前还会再次校验文案和 SKU 效果图。');
    return '<div class="pfh-ledger-ai-preparation"><div class="pfh-ledger-ai-prep-head"><div><strong>生图资料</strong><span class="' + (missing.length ? 'is-missing' : 'is-ready') + '">' + escapeHtml(missing.length ? 'PLM 还缺 ' + missing.length + ' 项' : 'PLM 资料已完整') + '</span></div><p>' + escapeHtml(imageStatus) + '</p></div><div class="pfh-ledger-ai-prep-grid">' + rows + ingredientRows + '</div><div class="pfh-ledger-ai-prep-actions"><button type="button" data-action="ledger-ai-prep-save" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (saving ? ' disabled' : '') + '>' + (saving ? '正在保存…' : '保存到 PLM 草稿') + '</button><button type="button" data-action="ledger-ai-prep-refresh" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '">重新检测</button><button type="button" data-action="ledger-ai-prep-autofill" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (busy || saving ? ' disabled' : '') + '>' + (busy ? '正在补齐并保存…' : 'AI 补齐并保存草稿') + '</button><button type="button" class="is-primary pfh-ledger-ai-prep-submit" data-action="ledger-ai-image-generate" data-kind="' + (kind === 'detail' ? 'detail' : 'main') + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (missing.length || saving ? ' disabled' : '') + '>PLM 资料完整，提交 AI 生图</button></div><p class="pfh-ledger-ai-prep-missing">' + escapeHtml(preparationNotice) + '</p></div>';
  }

  function isLedgerAiImageDedicatedAttribute(attr) {
    const variableName = String(attr && attr.variable_name || '').trim();
    const label = getApiAttributeLabel(attr);
    return /^sku[_\s-]*pic$/i.test(variableName)
      || /(?:SKU\s*(?:图|效果图|diagram)|SKU图)/i.test(label);
  }

  function getLedgerAiImageSkuAttributes(contentPayload) {
    const attrs = getApiDetailAttributes(contentPayload);
    const list = Array.isArray(attrs) ? attrs : [];
    const dedicated = list.find(isLedgerAiImageDedicatedAttribute);
    const genericPicture = list.find((attr) => {
      const variableName = String(attr && attr.variable_name || '').trim();
      const label = getApiAttributeLabel(attr);
      return Number(attr && attr.attr_id) === 148
        || /^(?:picture|product[_\s-]*(?:pic|image))$/i.test(variableName)
        || /(?:^|\s)(?:picture|图片|产品图)(?:\s|$)/i.test(label);
    });
    return [dedicated, genericPicture].filter((attr, index, items) => attr && items.indexOf(attr) === index);
  }


  async function inspectLedgerAiImageSkuContent(contentPayload) {
    const attrs = getLedgerAiImageSkuAttributes(contentPayload);
    if (!attrs.length) return { status: 'unknown', reason: 'PLM 产品详情未返回 SKU 图或产品图片字段' };
    let foundField = false;
    const candidates = [];
    for (const attr of attrs) {
      const rawValue = getApiAttributeValue(attr, 1);
      const directUrl = getApiAssetUrl(rawValue, 0);
      const ids = getApiAttributeFileIds([attr], /sku[_\s-]*pic|SKU\s*(?:图|效果图|diagram)|picture|图片|产品图/i);
      if (directUrl || ids.length) foundField = true;
      candidates.push({
        attr,
        directUrl,
        fileIds: ids,
        source: isLedgerAiImageDedicatedAttribute(attr) ? 'plm-sku-pic' : 'plm-picture',
      });
    }

    const resolveArchiveImage = async (candidate) => {
      if (!candidate || !candidate.fileIds.length) return null;
      const files = (await fetchApiArchiveFileRecordsByIds(candidate.fileIds))
        .map(buildApiArchiveFileInfo)
        .filter((file) => file.url && (/(?:jpg|jpeg|png|webp|gif|bmp|avif)/i.test(file.fileName) || /(?:jpg|jpeg|png|webp|gif|bmp|avif)/i.test(file.fileFormat)));
      return files.find((file) => candidate.fileIds.includes(String(file.fileId))) || null;
    };

    const dedicated = candidates.find((candidate) => isLedgerAiImageDedicatedAttribute(candidate.attr));
    const generic = candidates.find((candidate) => !isLedgerAiImageDedicatedAttribute(candidate.attr));
    if (dedicated && dedicated.directUrl) return { status: 'available', url: dedicated.directUrl, source: dedicated.source };
    try {
      const dedicatedImage = await resolveArchiveImage(dedicated);
      if (dedicatedImage) return { status: 'available', url: dedicatedImage.url, source: dedicated.source, fileId: dedicatedImage.fileId };
      if (generic && generic.directUrl) return { status: 'available', url: generic.directUrl, source: generic.source };
      const genericImage = await resolveArchiveImage(generic);
      if (genericImage) return { status: 'available', url: genericImage.url, source: generic.source, fileId: genericImage.fileId };
      return { status: 'missing', reason: foundField ? 'PLM 的 SKU 图附件不存在' : 'PLM 的 SKU 图/产品图片字段为空' };
    } catch (error) {
      if (generic && generic.directUrl) return { status: 'available', url: generic.directUrl, source: generic.source };
      return { status: 'unknown', reason: '读取 SKU 图附件失败：' + (formatErrorMessage(error) || '接口异常') };
    }
  }

  async function fetchLedgerAiImageSkuPreflight(sku, data) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const seed = normalizeData({ ...(data || {}), sku: normalizedSku });
    let fallbackReason = '';
    try {
      const snapshot = await fetchApiProductSnapshot(seed, { force: true });
      let contentPayload = snapshot && snapshot.contentPayload;
      if (snapshot && snapshot.productId && snapshot.productVersionId && snapshot.categoryId) {
        try {
          contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(snapshot.productId) + '&category_id=' + encodeURIComponent(snapshot.categoryId) + '&product_version_id=' + encodeURIComponent(snapshot.productVersionId));
        } catch (_) {
          // Fall back to the read-only snapshot when the edit endpoint is unavailable.
        }
      }
      if (contentPayload) {
        const result = await inspectLedgerAiImageSkuContent(contentPayload);
        if (result.status !== 'unknown') return result;
        fallbackReason = result.reason || '';
      } else if (snapshot && snapshot.contentError) {
        fallbackReason = snapshot.contentError;
      }
    } catch (error) {
      fallbackReason = formatErrorMessage(error) || '';
    }

    let projectId = getProjectIdForMaterialApi(seed);
    if (!projectId) {
      try {
        const project = await fetchApiProjectSnapshot(seed, { force: true });
        projectId = String(project && project.projectId || '').trim();
      } catch (error) {
        fallbackReason = fallbackReason || formatErrorMessage(error) || '';
      }
    }
    if (!projectId || !/^\d+$/.test(projectId)) {
      return { status: 'unknown', reason: fallbackReason || '未找到对应的 PLM 项目，无法确认 SKU 图' };
    }

    try {
      const infoPayload = await fetchPlmJson('/api/ChemicalNewDesignTask/GetProductDetailInfo?id=' + encodeURIComponent(projectId));
      const info = getApiPayloadDataObject(infoPayload);
      const categoryId = String(info.category_id || seed.categoryId || '').trim();
      if (!categoryId) return { status: 'unknown', reason: 'PLM 项目缺少类目，无法确认 SKU 图' };
      const contentPayload = await fetchPlmJson('/api/ChemicalNewDesignTask/GetProductDetailContent?id=' + encodeURIComponent(projectId) + '&category_id=' + encodeURIComponent(categoryId));
      return inspectLedgerAiImageSkuContent(contentPayload);
    } catch (error) {
      return { status: 'unknown', reason: '读取 PLM SKU 图字段失败：' + (formatErrorMessage(error) || fallbackReason || '接口异常') };
    }
  }

  async function getLedgerAiImageTaskExists(sku) {
    const normalizedSku = String(sku || '').trim();
    if (!normalizedSku) return null;
    try {
      const payload = await fetchPlmJson(LEDGER_AI_IMAGE_TASK_ENDPOINT + '?code=' + encodeURIComponent(normalizedSku));
      if (payload && payload.success === false) return null;
      return payload && payload.data === true;
    } catch (_) {
      return null;
    }
  }

  async function prepareLedgerAiImageGenerationPayload(sku, suppliedPreparation) {
    const normalizedSku = String(sku || '').trim();
    if (!normalizedSku) throw new Error('缺少 SKU，无法开始 AI 生图');
    const prepared = suppliedPreparation && !suppliedPreparation.loading
      ? suppliedPreparation
      : await loadLedgerAiImagePreparation(normalizedSku, true);
    return getLedgerAiImagePreparationPayload(prepared);
  }

  function ledgerAiImageResultMatches(record, result) {
    if (!record || !result) return false;
    return normalizeLedgerAiImageStatus(record.aiImageStatus) === result.status
      && String(record.aiImageMessage || '') === String(result.message || '')
      && String(record.aiImageJobId || '') === String(result.jobId || '')
      && JSON.stringify(normalizeLedgerAiImageItems(record.aiMainImages, 12)) === JSON.stringify(result.mainImages)
      && JSON.stringify(normalizeLedgerAiImageItems(record.aiDetailImages, 20)) === JSON.stringify(result.detailImages);
  }

  function updateLedgerAiImageRecord(sku, dateKey, patch, shouldSave) {
    const updated = updateDailyLedgerForSku(sku, { ...(patch || {}), deferSave: true, skipStorageSync: true }, dateKey);
    if (updated && shouldSave) saveDailyLedger();
    return updated;
  }

  function getLedgerAiImageFieldNames(kind) {
    const isDetail = kind === 'detail';
    return {
      kind: isDetail ? 'detail' : 'main',
      originalField: isDetail ? 'aiDetailImages' : 'aiMainImages',
      retouchedField: isDetail ? 'aiDetailRetouchedImages' : 'aiMainRetouchedImages',
      taskField: isDetail ? 'aiDetailRetouchTasks' : 'aiMainRetouchTasks',
      hiddenField: isDetail ? 'aiDetailHiddenImageKeys' : 'aiMainHiddenImageKeys',
      imageLimit: isDetail ? 20 : 12,
    };
  }

  function getLedgerAiImageRetouchRequestKey(sku, dateKey, kind, imageUrl, prompt) {
    return [getLedgerSkuKey(sku), normalizeLedgerDate(dateKey) || '', kind === 'detail' ? 'detail' : 'main', String(imageUrl || ''), String(prompt || '').trim()].join('|');
  }

  function createLedgerAiImageRetouchTaskId() {
    const random = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
    return 'retouch-' + Date.now().toString(36) + '-' + random;
  }

  function getLedgerAiImageRetouchSource(record, kind, imageUrl) {
    if (!record) return null;
    const fields = getLedgerAiImageFieldNames(kind);
    const targetUrl = String(imageUrl || '').trim();
    return normalizeLedgerAiImageItems(record[fields.originalField], fields.imageLimit)
      .concat(normalizeLedgerAiImageItems(record[fields.retouchedField], LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS))
      .find((item) => item.url === targetUrl) || null;
  }

  function getLedgerAiImageRetouchTasks(record, kind) {
    const fields = getLedgerAiImageFieldNames(kind);
    return normalizeLedgerAiImageRetouchTasks(record && record[fields.taskField], LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS);
  }

  function getLedgerAiImageHiddenKeys(record, kind) {
    const fields = getLedgerAiImageFieldNames(kind);
    return new Set(normalizeLedgerAiImageHiddenKeys(record && record[fields.hiddenField], LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS));
  }

  function isLedgerAiImageViewerFor(sku, dateKey) {
    const viewer = state.ledgerAiImageViewer;
    return Boolean(viewer
      && getLedgerSkuKey(viewer.sku) === getLedgerSkuKey(sku)
      && (!dateKey || normalizeLedgerDate(viewer.date) === normalizeLedgerDate(dateKey)));
  }

  function renderLedgerAiImageRetouchState(sku, dateKey) {
    if (isLedgerAiImageViewerFor(sku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
  }

  function parseLedgerAiImageRetouchResult(payload) {
    const raw = payload && typeof payload.data === 'object'
      ? payload.data.url || payload.data.imageUrl || payload.data.path
      : payload && payload.data;
    const normalized = normalizeLedgerAiImageItems([{ url: raw }], 1)[0];
    if (!normalized) throw new Error('PLM 未返回有效的修改图片地址');
    return normalized.url;
  }

  async function submitLedgerAiImageRetouch(sku, dateKey, kind, imageUrl, prompt) {
    const normalizedSku = String(sku || '').trim();
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const normalizedDate = normalizeLedgerDate(dateKey) || getTodayKey();
    const normalizedPrompt = String(prompt || '').trim();
    const record = findLedgerRecord(normalizedSku, normalizedDate);
    const source = getLedgerAiImageRetouchSource(record, normalizedKind, imageUrl);
    if (!record || !source || !normalizedPrompt) return null;
    const requestKey = getLedgerAiImageRetouchRequestKey(normalizedSku, normalizedDate, normalizedKind, source.url, normalizedPrompt);
    const existingRequest = state.ledgerAiImageRetouchRequests[requestKey];
    if (existingRequest) {
      showToast('这张图的相同修改正在处理中，关闭弹窗也会继续');
      return existingRequest;
    }
    const fields = getLedgerAiImageFieldNames(normalizedKind);
    const allOriginals = normalizeLedgerAiImageItems(record[fields.originalField], fields.imageLimit);
    const sourceIndex = allOriginals.findIndex((item) => item.url === source.url);
    const displayName = getLedgerAiImageDisplayName(source, normalizedKind, sourceIndex >= 0 ? sourceIndex : 0);
    const baseUrl = String(source.baseUrl || source.url || '').trim();
    const baseFilename = String(source.baseFilename || getLedgerAiImageSourceFilename(source) || displayName + '.png').trim();
    const sequence = getLedgerAiImageSequence(source) || (sourceIndex >= 0 ? sourceIndex + 1 : 0);
    const now = Date.now();
    const task = {
      id: createLedgerAiImageRetouchTaskId(),
      sourceUrl: source.url,
      displayName,
      baseFilename,
      sequence,
      prompt: normalizedPrompt,
      status: 'running',
      error: '',
      createdAt: new Date(now).toLocaleString(),
      createdAtMs: now,
      updatedAtMs: now,
    };
    const currentTasks = getLedgerAiImageRetouchTasks(record, normalizedKind)
      .filter((item) => !(item.sourceUrl === task.sourceUrl && item.prompt === task.prompt));
    const taskUpdated = updateLedgerAiImageRecord(normalizedSku, normalizedDate, {
      [fields.taskField]: [task].concat(currentTasks),
    }, true);
    if (!taskUpdated) return null;
    showToast(displayName + ' 修改任务已提交，完成后可关闭并重新打开查看');
    const request = (async () => {
      try {
        const payload = await fetchPlmApiJson(LEDGER_AI_IMAGE_RETOUCH_ENDPOINT, {
          code: normalizedSku,
          prompt: normalizedPrompt,
          image: source.url,
        }, { timeout: LEDGER_AI_IMAGE_RETOUCH_TIMEOUT_MS });
        const resultUrl = parseLedgerAiImageRetouchResult(payload);
        const extension = getLedgerAiImageExtension(source) || '.png';
        const retouchedItem = normalizeLedgerAiImageItems([{
          url: resultUrl,
          filename: displayName + extension,
          displayName,
          baseUrl,
          parentUrl: source.url,
          baseFilename,
          prompt: normalizedPrompt,
          sequence,
          createdAt: new Date().toLocaleString(),
          createdAtMs: Date.now(),
        }], 1)[0];
        if (!retouchedItem) throw new Error('修改图片地址无法保存');
        const latest = findLedgerRecord(normalizedSku, normalizedDate) || record;
        const latestRetouched = normalizeLedgerAiImageItems(latest[fields.retouchedField], LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS);
        const latestTasks = getLedgerAiImageRetouchTasks(latest, normalizedKind)
          .filter((item) => item.id !== task.id && !(item.sourceUrl === task.sourceUrl && item.prompt === task.prompt));
        const updated = updateLedgerAiImageRecord(normalizedSku, normalizedDate, {
          [fields.retouchedField]: [retouchedItem].concat(latestRetouched.filter((item) => item.url !== retouchedItem.url)),
          [fields.taskField]: latestTasks,
          aiImageMessage: 'AI 生图与修改图已保存到工作台',
        }, true) || latest;
        refreshLedgerCard(updated);
        renderLedgerAiImageRetouchState(normalizedSku, normalizedDate);
        showToast(displayName + ' 修改完成，原图和修改图都已保留');
        return updated;
      } catch (error) {
        const latest = findLedgerRecord(normalizedSku, normalizedDate) || record;
        const latestTasks = getLedgerAiImageRetouchTasks(latest, normalizedKind).map((item) => item.id === task.id
          ? { ...item, status: 'error', error: formatErrorMessage(error) || '修改图片失败', updatedAtMs: Date.now() }
          : item);
        const updated = updateLedgerAiImageRecord(normalizedSku, normalizedDate, {
          [fields.taskField]: latestTasks,
        }, true) || latest;
        refreshLedgerCard(updated);
        renderLedgerAiImageRetouchState(normalizedSku, normalizedDate);
        showToast(displayName + ' 修改失败：' + (formatErrorMessage(error) || '网络请求失败'));
        return updated;
      }
    })();
    state.ledgerAiImageRetouchRequests[requestKey] = request;
    renderLedgerAiImageRetouchState(normalizedSku, normalizedDate);
    try {
      return await request;
    } finally {
      if (state.ledgerAiImageRetouchRequests[requestKey] === request) delete state.ledgerAiImageRetouchRequests[requestKey];
    }
  }

  function closeLedgerAiImageRetouchComposer() {
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('.pfh-ledger-ai-retouch-composer-layer');
    if (layer) layer.remove();
    state.ledgerAiImageRetouchComposer = null;
  }

  function renderLedgerAiImageRetouchComposer() {
    const composer = state.ledgerAiImageRetouchComposer;
    const panel = document.getElementById(PANEL_ID) || ensurePanel();
    if (!composer || !panel) {
      const stale = panel && panel.querySelector('.pfh-ledger-ai-retouch-composer-layer');
      if (stale) stale.remove();
      return;
    }
    const full = panel.querySelector('.pfh-full') || panel;
    let layer = full.querySelector('.pfh-ledger-ai-retouch-composer-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-ledger-ai-retouch-composer-layer';
      layer.setAttribute('data-action', 'ledger-ai-retouch-composer-close');
      full.appendChild(layer);
    }
    const groups = [];
    LEDGER_AI_IMAGE_RETOUCH_QUICK_PHRASES.forEach((phrase) => {
      let group = groups.find((item) => item.name === phrase.group);
      if (!group) {
        group = { name: phrase.group, items: [] };
        groups.push(group);
      }
      group.items.push(phrase.text);
    });
    const quickHtml = groups.map((group) => '<div class="pfh-ledger-ai-retouch-quick-group"><strong>' + escapeHtml(group.name) + '</strong><div class="pfh-ledger-ai-retouch-quick-items">' + group.items.map((text) => '<button type="button" data-action="ledger-ai-retouch-quick-phrase" data-text="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>').join('') + '</div></div>').join('');
    const sourceFilename = String(composer.sourceFilename || '').trim();
    layer.innerHTML = '<section class="pfh-ledger-ai-retouch-composer" role="dialog" aria-modal="true" aria-label="修改图片"><header><div><h3>修改图 · ' + escapeHtml(composer.displayName || '当前图片') + '</h3><p>可直接输入修改要求，也可以点击右侧快捷语录追加；提交后原图仍会保留。</p></div><button type="button" data-action="ledger-ai-retouch-composer-close" aria-label="关闭">×</button></header><div class="pfh-ledger-ai-retouch-compose-body"><div class="pfh-ledger-ai-retouch-compose-target"><img src="' + escapeHtml(composer.imageUrl) + '" alt="' + escapeHtml(composer.displayName || '当前图片') + '" loading="eager" decoding="async"><strong>' + escapeHtml(composer.displayName || '当前图片') + '</strong><small>' + escapeHtml(sourceFilename || '保留原图文件名') + '</small></div><div class="pfh-ledger-ai-retouch-compose-editor"><label>修改要求<textarea class="pfh-ledger-ai-retouch-composer-input" data-action="ledger-ai-retouch-composer-input" placeholder="例如：内料改成蓝色，纸盒只展示正面，其他元素保持不变"></textarea></label><div class="pfh-ledger-ai-retouch-quick-head"><span>快捷语录 <small>点击后追加到输入框</small></span><button type="button" data-action="ledger-ai-retouch-composer-clear">清空</button></div><div class="pfh-ledger-ai-retouch-quick-list">' + quickHtml + '</div><p class="pfh-ledger-ai-retouch-quick-tip">提示：XX色、XX材质等占位词可以直接改成你的具体要求；多条语录可以连续点击。</p></div></div><footer><span>通常约 45 秒返回；关闭工作台不会取消任务。</span><div><button type="button" data-action="ledger-ai-retouch-composer-close">取消</button><button type="button" class="is-primary" data-action="ledger-ai-retouch-composer-submit">提交修改</button></div></footer></section>';
    const input = layer.querySelector('.pfh-ledger-ai-retouch-composer-input');
    if (input) {
      input.value = String(composer.value || '');
      if (!layer.dataset.focused) {
        layer.dataset.focused = '1';
        window.requestAnimationFrame(() => {
          if (input.isConnected) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        });
      }
    }
  }

  function openLedgerAiImageRetouchComposer(sku, dateKey, kind, imageUrl) {
    const record = findLedgerRecord(sku, dateKey);
    const source = getLedgerAiImageRetouchSource(record, kind, imageUrl);
    if (!record || !source) return;
    const fields = getLedgerAiImageFieldNames(kind);
    const originalItems = normalizeLedgerAiImageItems(record[fields.originalField], fields.imageLimit);
    const sourceIndex = originalItems.findIndex((item) => item.url === source.url);
    const displayName = getLedgerAiImageDisplayName(source, kind, sourceIndex >= 0 ? sourceIndex : 0);
    closeLedgerAiImageRetouchComposer();
    state.ledgerAiImageRetouchComposer = {
      sku: String(sku || '').trim(),
      dateKey: normalizeLedgerDate(dateKey) || getTodayKey(),
      kind: kind === 'detail' ? 'detail' : 'main',
      imageUrl: source.url,
      displayName,
      sourceFilename: getLedgerAiImageSourceFilename(source),
      value: '',
    };
    renderLedgerAiImageRetouchComposer();
  }

  function promptLedgerAiImageRetouch(sku, dateKey, kind, imageUrl) {
    openLedgerAiImageRetouchComposer(sku, dateKey, kind, imageUrl);
  }

  function appendLedgerAiImageRetouchPhrase(text) {
    const composer = state.ledgerAiImageRetouchComposer;
    const phrase = String(text || '').trim();
    if (!composer || !phrase) return;
    const current = String(composer.value || '').trim();
    const lines = current.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (lines.includes(phrase)) {
      showToast('这条快捷语录已经添加');
      return;
    }
    composer.value = current ? current + '\n' + phrase : phrase;
    const input = document.querySelector('#' + PANEL_ID + ' .pfh-ledger-ai-retouch-composer-input');
    if (input) {
      input.value = composer.value;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  function clearLedgerAiImageRetouchComposer() {
    const composer = state.ledgerAiImageRetouchComposer;
    if (!composer) return;
    composer.value = '';
    const input = document.querySelector('#' + PANEL_ID + ' .pfh-ledger-ai-retouch-composer-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  function submitLedgerAiImageRetouchComposer() {
    const composer = state.ledgerAiImageRetouchComposer;
    if (!composer) return;
    const prompt = String(composer.value || '').trim();
    if (!prompt) {
      showToast('修改提示词不能为空');
      const input = document.querySelector('#' + PANEL_ID + ' .pfh-ledger-ai-retouch-composer-input');
      if (input) input.focus();
      return;
    }
    const payload = { ...composer };
    closeLedgerAiImageRetouchComposer();
    submitLedgerAiImageRetouch(payload.sku, payload.dateKey, payload.kind, payload.imageUrl, prompt);
  }

  function getLedgerDetail3Image(record) {
    const items = normalizeLedgerAiImageItems(record && record.aiDetailImages, 20);
    return items.find((item, index) => getLedgerAiImageSequence(item) === 3 || getLedgerAiImageDisplayName(item, 'detail', index) === '详情图3') || null;
  }

  function getLedgerDetail3ExpectedIngredients(sku) {
    const preparation = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(sku)];
    const data = normalizeData(loadData(sku) || { sku });
    const record = normalizeCopywritingRecord(data.copywriting);
    const candidates = [
      preparation && preparation.ingredients && preparation.ingredients.product_ingredients_summary_en,
      data.ingredientEnglish,
      data.copywritingIngredientEnglish,
      record && record.cleanedIngredientEnglish,
      preparation && preparation.ingredients && preparation.ingredients.product_ingredients_summary_ch,
      data.ingredientChinese,
      data.copywritingIngredientChinese,
    ].map((value) => String(value || '').trim()).filter(isValidLedgerAiImageText);
    // Some PLM deployments put the Chinese value in the *_en field. Prefer a
    // candidate without CJK characters whenever another English cache exists,
    // but keep Chinese as a last-resort input so the Worker can translate it
    // internally instead of incorrectly rejecting the audit.
    return candidates.find((value) => !/[\u3400-\u9fff]/.test(value)) || candidates[0] || '';
  }

  async function auditLedgerDetail3(sku, dateKey, force) {
    const normalizedSku = getLedgerSkuKey(sku);
    const key = [normalizedSku, normalizeLedgerDate(dateKey) || ''].join('|');
    if (state.ledgerDetail3AuditRequests[key]) return state.ledgerDetail3AuditRequests[key];
    const record = findLedgerRecord(normalizedSku, dateKey);
    const image = getLedgerDetail3Image(record);
    if (!record || !image) return null;
    const expectedIngredients = getLedgerDetail3ExpectedIngredients(normalizedSku);
    const current = normalizeLedgerDetail3Audit(record.aiDetail3Audit);
    if (!force && current.imageUrl === image.url && current.expectedIngredients === expectedIngredients && current.status !== 'idle' && current.status !== 'loading') return current;
    const loading = normalizeLedgerDetail3Audit({ status: 'loading', summary: '正在识别详情图3并核对英文成分…', imageUrl: image.url, expectedIngredients, checkedAtMs: Date.now() });
    const loadingRecord = updateLedgerAiImageRecord(normalizedSku, dateKey, { aiDetail3Audit: loading }, true) || record;
    if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
    const request = (async () => {
      try {
        if (!isValidLedgerAiImageText(expectedIngredients)) throw new Error('英文成分文案为空，无法核对详情图3');
        const response = await cloudRequest('/ai-image/ingredient-audit', { method: 'POST', timeoutMs: 150000, body: { sku: normalizedSku, imageUrl: image.url, expectedIngredients } });
        if (!response || !response.ok) throw new Error(response && response.summary || response && response.error || 'AI 识别失败');
        const audit = normalizeLedgerDetail3Audit({ ...response, imageUrl: image.url, expectedIngredients, checkedAtMs: Date.now() });
        const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, { aiDetail3Audit: audit }, true) || loadingRecord;
        refreshLedgerCard(updated);
        if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
        if (audit.status === 'warning' || audit.status === 'error') showToast(normalizedSku + ' 详情图3发现异常：' + (audit.summary || '请检查成分展示'));
        return audit;
      } catch (error) {
        const audit = normalizeLedgerDetail3Audit({ status: 'error', summary: formatErrorMessage(error) || '详情图3识别失败', retryable: Boolean(error && error.cloudData && error.cloudData.retryable) || /insufficient balance|timeout|aborted|overload|high demand|429|5\d\d/i.test(formatErrorMessage(error)), imageUrl: image.url, expectedIngredients, checkedAtMs: Date.now() });
        const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, { aiDetail3Audit: audit }, true) || loadingRecord;
        refreshLedgerCard(updated);
        if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
        return audit;
      }
    })();
    state.ledgerDetail3AuditRequests[key] = request;
    try { return await request; }
    finally { if (state.ledgerDetail3AuditRequests[key] === request) delete state.ledgerDetail3AuditRequests[key]; }
  }

  function clearLedgerAiImagePoll(sku) {
    const key = getLedgerAiImageRequestKey(sku);
    window.clearTimeout(state.ledgerAiImagePollTimers[key]);
    delete state.ledgerAiImagePollTimers[key];
    delete state.ledgerAiImagePollCounts[key];
  }

  function scheduleLedgerAiImagePoll(sku, dateKey) {
    const key = getLedgerAiImageRequestKey(sku);
    window.clearTimeout(state.ledgerAiImagePollTimers[key]);
    const count = Number(state.ledgerAiImagePollCounts[key] || 0) + 1;
    if (count > LEDGER_AI_IMAGE_MAX_POLLS) {
      delete state.ledgerAiImagePollTimers[key];
      return;
    }
    state.ledgerAiImagePollCounts[key] = count;
    state.ledgerAiImagePollTimers[key] = window.setTimeout(() => {
      delete state.ledgerAiImagePollTimers[key];
      if (state.view !== 'ledger' || state.ledgerView !== 'finalized') return;
      const viewer = state.ledgerAiImageViewer;
      queryLedgerAiImageStatus(sku, dateKey, {
        openViewer: Boolean(viewer && getLedgerSkuKey(viewer.sku) === getLedgerSkuKey(sku)),
      });
    }, LEDGER_AI_IMAGE_POLL_DELAY_MS);
  }

  function openLedgerAiImageViewer(record) {
    if (!record) return;
    const previous = state.ledgerAiImageViewer;
    const sameRecord = Boolean(previous
      && getLedgerSkuKey(previous.sku) === getLedgerSkuKey(record.sku)
      && normalizeLedgerDate(previous.date) === normalizeLedgerDate(record.date));
    state.ledgerAiImageViewer = {
      sku: record.sku,
      date: record.date,
      tab: sameRecord ? previous.tab : 'main',
      selected: sameRecord && previous.selected
        ? { ...previous.selected }
        : { main: '', detail: '' },
    };
    renderLedgerAiImageViewer(ensurePanel());
  }

  function closeLedgerAiImageViewer() {
    closeLedgerAiImageRetouchComposer();
    state.ledgerAiImageViewer = null;
    renderLedgerAiImageViewer(ensurePanel());
  }

  function hideLedgerAiImageEntry(sku, dateKey, kind, entryKey) {
    const normalizedSku = String(sku || '').trim();
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const key = String(entryKey || '').trim();
    const record = findLedgerRecord(normalizedSku, dateKey);
    if (!record || !key) return;
    const fields = getLedgerAiImageFieldNames(normalizedKind);
    const hiddenKeys = normalizeLedgerAiImageHiddenKeys(record[fields.hiddenField], LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS);
    if (!hiddenKeys.includes(key)) hiddenKeys.push(key);
    const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
      [fields.hiddenField]: hiddenKeys,
    }, true);
    if (!updated) return;
    refreshLedgerCard(updated);
    showToast((normalizedKind === 'detail' ? '详情图' : '主图') + '已从悬浮助手隐藏，PLM 原图未删除');
    renderLedgerAiImageViewer(ensurePanel());
  }

  function restoreLedgerAiImageHidden(sku, dateKey, kind) {
    const normalizedSku = String(sku || '').trim();
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const record = findLedgerRecord(normalizedSku, dateKey);
    if (!record) return;
    const fields = getLedgerAiImageFieldNames(normalizedKind);
    const hiddenKeys = normalizeLedgerAiImageHiddenKeys(record[fields.hiddenField], LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS);
    if (!hiddenKeys.length) return;
    const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
      [fields.hiddenField]: [],
    }, true);
    if (!updated) return;
    refreshLedgerCard(updated);
    showToast('已恢复' + (normalizedKind === 'detail' ? '详情图' : '主图') + '列表');
    renderLedgerAiImageViewer(ensurePanel());
  }

  function downloadLedgerAiImageZip(sku, dateKey, kind) {
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    if (state.ledgerAiImageDownloadKey) return Promise.resolve(false);
    const record = findLedgerRecord(sku, dateKey);
    if (!record) return Promise.resolve(false);
    const images = getLedgerAiImageDownloadItems(record, normalizedKind);
    const label = normalizedKind === 'detail' ? '详情图' : '主图';
    if (!images.length) {
      showToast('当前没有可下载的' + label);
      return Promise.resolve(false);
    }
    const downloadKey = getLedgerAiImageDownloadKey(record.sku, record.date, normalizedKind);
    state.ledgerAiImageDownloadKey = downloadKey;
    state.ledgerAiImageDownloadProgress = '准备并发下载 ' + images.length + ' 张' + label + '（' + LEDGER_AI_IMAGE_DOWNLOAD_CONCURRENCY + ' 路）…';
    renderLedgerAiImageViewer(ensurePanel());
    return (async () => {
      const downloaded = new Array(images.length);
      const workerCount = Math.min(LEDGER_AI_IMAGE_DOWNLOAD_CONCURRENCY, images.length);
      let nextIndex = 0;
      let completed = 0;
      const failures = [];
      const workers = Array.from({ length: workerCount }, async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= images.length) return;
          const item = images[index];
          const displayName = getLedgerAiImageDisplayName(item, normalizedKind, index);
          try {
            const blob = await fetchLedgerAiImageBlob(item.url);
            downloaded[index] = { item, displayName, blob };
          } catch (error) {
            failures.push(displayName + '：' + (formatErrorMessage(error) || '下载失败'));
          } finally {
            completed += 1;
            state.ledgerAiImageDownloadProgress = '并发下载中 ' + completed + '/' + images.length + ' 张' + label + '…';
            renderLedgerAiImageViewer(ensurePanel());
          }
        }
      });
      await Promise.all(workers);
      // Partial success still packs a zip; throwing away the completed blobs
      // because one image failed made every transient network hiccup fatal.
      const succeeded = downloaded.filter(Boolean);
      if (!succeeded.length) throw new Error(failures[0] || '全部' + label + '下载失败');
      const files = [];
      const usedNames = Object.create(null);
      succeeded.forEach((entry) => {
        if (!entry || !entry.blob) return;
        const extension = getLedgerAiImageExtension(entry.item, entry.blob);
        const baseFilename = entry.displayName + extension;
        const occurrence = Number(usedNames[baseFilename] || 0) + 1;
        usedNames[baseFilename] = occurrence;
        const filename = occurrence === 1
          ? baseFilename
          : entry.displayName + '-' + occurrence + extension;
        files.push({ path: filename, blob: entry.blob });
      });
      state.ledgerAiImageDownloadProgress = '正在打包 ' + files.length + '/' + images.length + ' 张' + label + '…';
      renderLedgerAiImageViewer(ensurePanel());
      const zip = await createStoredZipBlob(files, (done, total) => {
        state.ledgerAiImageDownloadProgress = '正在打包 ' + done + '/' + total + ' 张' + label + '…';
        renderLedgerAiImageViewer(ensurePanel());
      });
      downloadBlob(zip, String(record.sku || 'SKU') + '-' + label + '.zip');
      if (failures.length) {
        showToast(record.sku + ' 的' + label + '已下载 ' + files.length + '/' + images.length + ' 张；失败：' + failures.join('；'));
      } else {
        showToast(record.sku + ' 的' + label + '已下载');
      }
      return true;
    })().catch((error) => {
      showToast('下载' + label + '失败：' + (formatErrorMessage(error) || '网络请求失败'));
      return false;
    }).finally(() => {
      if (state.ledgerAiImageDownloadKey === downloadKey) {
        state.ledgerAiImageDownloadKey = '';
        state.ledgerAiImageDownloadProgress = '';
        renderLedgerAiImageViewer(ensurePanel());
      }
    });
  }

  function getLedgerAiImageSingleDownloadKey(sku, dateKey, kind, imageUrl) {
    return getLedgerAiImageDownloadKey(sku, dateKey, kind) + '|item|' + String(imageUrl || '');
  }

  function downloadLedgerAiImageItem(sku, dateKey, kind, imageUrl, displayName) {
    if (state.ledgerAiImageDownloadKey) return;
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const record = findLedgerRecord(sku, dateKey);
    const item = getLedgerAiImageRetouchSource(record, normalizedKind, imageUrl);
    if (!record || !item) return;
    const name = String(displayName || getLedgerAiImageDisplayName(item, normalizedKind, 0)).trim() || (normalizedKind === 'detail' ? '详情图' : '主图');
    const downloadKey = getLedgerAiImageSingleDownloadKey(record.sku, record.date, normalizedKind, item.url);
    state.ledgerAiImageDownloadKey = downloadKey;
    state.ledgerAiImageDownloadProgress = '正在下载 ' + name + '…';
    renderLedgerAiImageViewer(ensurePanel());
    (async () => {
      try {
        const blob = await fetchLedgerAiImageBlob(item.url);
        const extension = getLedgerAiImageExtension(item, blob);
        downloadBlob(blob, name + extension);
        showToast(name + ' 已下载');
      } catch (error) {
        showToast('下载' + name + '失败：' + (formatErrorMessage(error) || '网络请求失败'));
      } finally {
        if (state.ledgerAiImageDownloadKey === downloadKey) {
          state.ledgerAiImageDownloadKey = '';
          state.ledgerAiImageDownloadProgress = '';
          renderLedgerAiImageViewer(ensurePanel());
        }
      }
    })();
  }

  function getLedgerAiImageViewerEntries(record, kind) {
    const fields = getLedgerAiImageFieldNames(kind);
    const originals = normalizeLedgerAiImageItems(record && record[fields.originalField], fields.imageLimit);
    const retouched = normalizeLedgerAiImageItems(record && record[fields.retouchedField], LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS);
    const tasks = getLedgerAiImageRetouchTasks(record, kind);
    const entries = [];
    originals.forEach((item, index) => entries.push({
      item,
      displayName: getLedgerAiImageDisplayName(item, kind, index),
      sequence: getLedgerAiImageSequence(item) || index + 1,
      isRetouched: false,
      isTask: false,
      rank: 0,
      order: index,
    }));
    retouched.forEach((item, index) => entries.push({
      item,
      displayName: getLedgerAiImageDisplayName(item, kind, index),
      sequence: getLedgerAiImageSequence(item) || Number(item.sequence) || 9999,
      isRetouched: true,
      isTask: false,
      rank: 1,
      order: index,
    }));
    tasks.forEach((task, index) => {
      const source = getLedgerAiImageRetouchSource(record, kind, task.sourceUrl);
      entries.push({
        item: source,
        task,
        displayName: task.displayName || (source ? getLedgerAiImageDisplayName(source, kind, 0) : ((kind === 'detail' ? '详情图' : '主图') + (task.sequence || index + 1))),
        sequence: Number(task.sequence) || (source ? getLedgerAiImageSequence(source) : 9999),
        isRetouched: false,
        isTask: true,
        rank: 2,
        order: index,
      });
    });
    const sortedEntries = entries.sort((left, right) => {
      const leftSequence = Number(left.sequence) || 9999;
      const rightSequence = Number(right.sequence) || 9999;
      const leftTime = Number(left.task && left.task.createdAtMs || left.item && left.item.createdAtMs || 0);
      const rightTime = Number(right.task && right.task.createdAtMs || right.item && right.item.createdAtMs || 0);
      return leftSequence - rightSequence
        || left.rank - right.rank
        || rightTime - leftTime
        || left.order - right.order;
    });
    const hiddenKeys = getLedgerAiImageHiddenKeys(record, kind);
    return sortedEntries.filter((entry) => !hiddenKeys.has(getLedgerAiImageViewerEntryKey(entry)));
  }

  function getLedgerAiImageViewerEntryKey(entry) {
    if (!entry) return '';
    if (entry.isTask) return 'task:' + String(entry.task && entry.task.id || '');
    return 'image:' + String(entry.item && entry.item.url || '');
  }

  function getLedgerAiImageDownloadItems(record, kind) {
    const seen = new Set();
    return getLedgerAiImageViewerEntries(record, kind)
      .filter((entry) => !entry.isTask && entry.item && entry.item.url)
      .map((entry) => entry.item)
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
  }

  function getLedgerAiImageViewerTabCount(record, kind) {
    const entries = getLedgerAiImageViewerEntries(record, kind);
    const originalCount = entries.filter((entry) => !entry.isRetouched && !entry.isTask).length;
    const retouchedCount = entries.filter((entry) => entry.isRetouched).length;
    const taskCount = entries.filter((entry) => entry.isTask).length;
    return String(originalCount) + (retouchedCount ? ' + 改' + retouchedCount : '') + (taskCount ? ' · 中' + taskCount : '');
  }

  function renderLedgerAiImageViewer(panel) {
    if (!panel) return;
    let layer = panel.querySelector('.pfh-ledger-ai-image-layer');
    if (state.view !== 'ledger' || !state.ledgerAiImageViewer) {
      if (layer) layer.remove();
      return;
    }
    const viewer = state.ledgerAiImageViewer;
    const record = findLedgerRecord(viewer.sku, viewer.date);
    if (!record) {
      state.ledgerAiImageViewer = null;
      if (layer) layer.remove();
      return;
    }
    const mainEntries = getLedgerAiImageViewerEntries(record, 'main');
    const detailEntries = getLedgerAiImageViewerEntries(record, 'detail');
    const mainImages = getLedgerAiImageDownloadItems(record, 'main');
    const detailImages = getLedgerAiImageDownloadItems(record, 'detail');
    const tab = viewer.tab === 'detail' ? 'detail' : 'main';
    state.ledgerAiImageViewer.tab = tab;
    const entries = tab === 'detail' ? detailEntries : mainEntries;
    const meta = getLedgerAiImageStatusMeta(record);
    const mainDownloadKey = getLedgerAiImageDownloadKey(record.sku, record.date, 'main');
    const detailDownloadKey = getLedgerAiImageDownloadKey(record.sku, record.date, 'detail');
    const isCurrentDownload = state.ledgerAiImageDownloadKey === mainDownloadKey
      || state.ledgerAiImageDownloadKey === detailDownloadKey
      || String(state.ledgerAiImageDownloadKey || '').indexOf(getLedgerAiImageDownloadKey(record.sku, record.date, tab) + '|item|') === 0;
    const retouchTasks = getLedgerAiImageRetouchTasks(record, tab);
    const detail3Audit = normalizeLedgerDetail3Audit(record.aiDetail3Audit);
    const message = String(record.aiImageMessage || meta.title || '').trim();
    const isSubmissionLoading = meta.status === 'loading' && /(?:准备提交|提交 PLM AI 生图|已开始提交|生图请求)/i.test(message);
    const getEntryViewState = (entry) => {
      const item = entry && entry.item;
      const task = entry && entry.task;
      const displayName = entry && entry.displayName || (tab === 'detail' ? '详情图' : '主图');
      const sourceFilename = item ? getLedgerAiImageSourceFilename(item) : (task && task.baseFilename || '');
      const title = sourceFilename && sourceFilename !== displayName
        ? displayName + ' · ' + sourceFilename
        : displayName;
      const activeTask = task || (item && retouchTasks.find((candidate) => candidate.sourceUrl === item.url && candidate.status === 'running'));
      const activeRequest = activeTask && activeTask.status === 'running'
        ? state.ledgerAiImageRetouchRequests[getLedgerAiImageRetouchRequestKey(record.sku, record.date, tab, activeTask.sourceUrl, activeTask.prompt)]
        : null;
      const taskStatus = activeTask && activeTask.status === 'error'
        ? '修改失败'
        : (activeTask && activeTask.status === 'running' ? '生成中' : (activeTask ? '待重试' : ''));
      const variantLabel = entry && entry.isRetouched ? '修改版' : (task ? taskStatus : '原图');
      const prompt = entry && entry.isRetouched && item && item.prompt
        ? item.prompt
        : (activeTask && activeTask.prompt || '');
      return {
        entry,
        item,
        task,
        displayName,
        sourceFilename,
        title,
        activeTask,
        activeRequest,
        taskStatus,
        variantLabel,
        prompt,
        key: getLedgerAiImageViewerEntryKey(entry),
        isGenerating: Boolean(activeTask && activeTask.status === 'running'),
      };
    };
    if (!viewer.selected) viewer.selected = { main: '', detail: '' };
    let selectedKey = String(viewer.selected[tab] || '');
    let selectedEntry = entries.find((entry) => getLedgerAiImageViewerEntryKey(entry) === selectedKey) || entries[0] || null;
    if (selectedEntry) {
      selectedKey = getLedgerAiImageViewerEntryKey(selectedEntry);
      viewer.selected[tab] = selectedKey;
    }
    const selectedView = selectedEntry ? getEntryViewState(selectedEntry) : null;
    const targetLabel = tab === 'detail' ? '详情图' : '主图';
    const emptyMessage = meta.status === 'loading'
      ? (isSubmissionLoading ? '正在提交 AI 生图请求；提交完成后会显示“生图中”，本次不会自动轮询。' : '正在检查这个 SKU 是否已有生图历史，不会自动提交生图。')
      : (meta.status === 'running'
        ? '图片还在生成，当前只跟踪这个 SKU。'
      : (meta.status === 'task-error'
        ? 'PLM 有生图任务记录，但暂时没有返回图片结果；请先刷新，必要时联系管理员清理任务。'
        : (meta.status === 'result-missing'
          ? 'PLM 返回了完成状态，但没有图片列表；点击下方按钮可手动重新生成。'
          : (meta.status === 'needs-prerequisites'
            ? '生图前置校验未通过，请先补齐产品文案和 SKU 效果图。'
            : (meta.status === 'needs-sku-image'
              ? 'PLM 缺少 SKU 效果图，请先上传 SKU 图后再生成。'
              : (meta.status === 'needs-copywriting'
                ? 'PLM 缺少有效产品文案，请先补齐产品文案后再生成。'
                : (meta.status === 'error'
                  ? '状态查询失败；可以先刷新状态，再手动提交生成。'
                  : '当前没有可查看的' + targetLabel + '；点击下方按钮后才会开始生成。')))))));
    const preparation = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(record.sku)];
    const showPreparation = Boolean(preparation && (preparation.loading || !['loading', 'running'].includes(meta.status)));
    const emptyStateHtml = showPreparation
      ? ledgerAiImagePreparationHtml(record, tab)
      : (meta.status === 'loading'
        ? ledgerAiImageLoadingHtml(meta.label || '正在检查生图历史', emptyMessage, { submitting: isSubmissionLoading })
        : '<div class="pfh-ledger-ai-image-empty-state"><span>' + escapeHtml(emptyMessage) + '</span>' + ledgerAiImageGenerateButtonHtml(record, tab, meta.status) + '</div>');
    const thumbnailHtml = entries.length
      ? entries.map((entry) => {
        const view = getEntryViewState(entry);
        const selected = view.key === selectedKey;
        const imageHtml = view.item
          ? '<img src="' + escapeHtml(view.item.url) + '" alt="' + escapeHtml(view.displayName) + '" loading="lazy" decoding="async">'
          : '<span class="pfh-ledger-ai-image-thumb-missing">无图</span>';
        const isDetail3 = tab === 'detail' && view.displayName === '详情图3';
        const auditClass = isDetail3 && /^(?:warning|error)$/.test(detail3Audit.status) ? ' is-audit-error' : (isDetail3 && detail3Audit.status === 'pass' ? ' is-audit-pass' : '');
        const auditLabel = isDetail3 && detail3Audit.status !== 'idle' ? '<em class="pfh-ledger-detail3-badge is-' + escapeHtml(detail3Audit.status) + '">' + escapeHtml(detail3Audit.status === 'pass' ? '核对通过' : (detail3Audit.status === 'loading' ? '识别中' : '有异常')) + '</em>' : '';
        const hideLabel = entry.isTask ? '隐藏此修改任务' : '从悬浮助手隐藏此图片';
        return '<div class="pfh-ledger-ai-image-thumb-row"><button type="button" class="pfh-ledger-ai-image-thumb' + (selected ? ' is-selected' : '') + (entry.isRetouched ? ' is-retouched' : '') + (entry.isTask ? ' is-retouch-task is-' + escapeHtml(view.task && view.task.status || 'running') : '') + auditClass + '" data-action="ledger-ai-image-select" data-kind="' + tab + '" data-entry-key="' + escapeHtml(view.key) + '" title="' + escapeHtml(view.title) + '">' +
          '<span class="pfh-ledger-ai-image-thumb-media">' + imageHtml + '</span><span class="pfh-ledger-ai-image-thumb-copy"><strong>' + escapeHtml(view.displayName) + '</strong><small>' + escapeHtml(view.variantLabel) + '</small>' + auditLabel + '</span></button><button type="button" class="pfh-ledger-ai-image-delete" data-action="ledger-ai-image-hide" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '" data-entry-key="' + escapeHtml(view.key) + '" title="' + escapeHtml(hideLabel) + '" aria-label="' + escapeHtml(hideLabel) + '">×</button></div>';
      }).join('')
      : (showPreparation
        ? (preparation.loading
          ? '<div class="pfh-ledger-ai-image-thumb-loading"><span class="pfh-ledger-ai-loading-spinner" aria-hidden="true"></span><small>正在读取生图资料</small></div>'
          : '<div class="pfh-ledger-ai-image-thumb-missing">暂无生图<br>请先补全右侧资料</div>')
        : emptyStateHtml);
    const previewImageHtml = selectedView && selectedView.item
      ? '<a class="pfh-ledger-ai-image-preview-link" href="' + escapeHtml(selectedView.item.url) + '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(selectedView.title + '（点击打开图片）') + '"><img src="' + escapeHtml(selectedView.item.url) + '" alt="' + escapeHtml(selectedView.displayName) + '" loading="eager" decoding="async"></a>'
      : '<div class="pfh-ledger-ai-image-preview-missing">' + (selectedView ? '原图地址已失效' : escapeHtml(emptyMessage)) + '</div>';
    const selectedIsDetail3 = Boolean(selectedView && tab === 'detail' && selectedView.displayName === '详情图3');
    const detail3AuditHtml = selectedIsDetail3 && detail3Audit.status !== 'idle'
      ? '<div class="pfh-ledger-detail3-audit is-' + escapeHtml(detail3Audit.status) + '"><strong>' + escapeHtml(detail3Audit.status === 'pass' ? '详情图3成分核对通过' : (detail3Audit.status === 'loading' ? '正在识别详情图3' : '详情图3需要检查')) + '</strong><p>' + escapeHtml(detail3Audit.summary || '') + '</p>' + (detail3Audit.retryable ? '<span>AI 服务暂时不可用，可点击“重新核对成分”重试。</span>' : '') + (detail3Audit.missing.length ? '<span>缺漏：' + escapeHtml(detail3Audit.missing.join('、')) + '</span>' : '') + (detail3Audit.extra.length ? '<span>多余/错误：' + escapeHtml(detail3Audit.extra.join('、')) + '</span>' : '') + (detail3Audit.duplicates.length ? '<span>重复：' + escapeHtml(detail3Audit.duplicates.join('、')) + '</span>' : '') + (detail3Audit.anomalies.length ? '<span>生图异常：' + escapeHtml(detail3Audit.anomalies.join('、')) + '</span>' : '') + '</div>'
      : '';
    const previewActionHtml = selectedView && selectedView.item
      ? '<div class="pfh-ledger-ai-image-preview-actions">' + (selectedIsDetail3 ? '<button type="button" data-action="ledger-detail3-audit" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '">重新核对成分</button>' : '') + '<button type="button" data-action="ledger-ai-image-download-item" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '" data-image-url="' + escapeHtml(selectedView.item.url) + '" data-image-name="' + escapeHtml(selectedView.displayName) + '"' + (state.ledgerAiImageDownloadKey ? ' disabled' : '') + '>下载</button><button type="button" data-action="ledger-ai-image-retouch" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '" data-image-url="' + escapeHtml(selectedView.item.url) + '"' + (selectedView.isGenerating ? ' disabled' : '') + '>' + (selectedView.isGenerating ? '生成中…' : (selectedView.activeTask ? '重新修改' : '修改图')) + '</button></div>'
      : '';
    const previewHtml = selectedView
      ? '<div class="pfh-ledger-ai-image-preview-stage">' + (lucianComparisonHtml(selectedEntry && selectedEntry.isRetouched && selectedView.item) || previewImageHtml) + '</div><div class="pfh-ledger-ai-image-preview-info"><div class="pfh-ledger-ai-image-preview-heading"><div><strong>' + escapeHtml(selectedView.displayName) + '</strong><em class="pfh-ledger-ai-image-variant">' + escapeHtml(selectedView.variantLabel) + '</em></div><small title="' + escapeHtml(selectedView.title) + '">' + escapeHtml(selectedView.sourceFilename || '保留原图文件名') + '</small></div>' + (selectedView.prompt ? '<p class="pfh-ledger-ai-image-prompt" title="' + escapeHtml(selectedView.prompt) + '">提示词：' + escapeHtml(selectedView.prompt) + '</p>' : '') + detail3AuditHtml + previewActionHtml + '</div>'
      : '<div class="pfh-ledger-ai-image-preview-empty">' + emptyStateHtml + '</div>';
    const downloadButtonHtml = (kind, count, label, downloadKey) => {
      const busy = state.ledgerAiImageDownloadKey === downloadKey;
      const disabled = !count || Boolean(state.ledgerAiImageDownloadKey);
      return '<button type="button" data-action="ledger-ai-image-download" data-kind="' + kind + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (disabled ? ' disabled' : '') + '>' + escapeHtml(busy ? '打包中…' : label) + '</button>';
    };
    const downloadProgress = isCurrentDownload && state.ledgerAiImageDownloadProgress
      ? state.ledgerAiImageDownloadProgress
      : '原图和修改图都会保存在今日工作台；本功能不会自动替换或保存 PLM 商品草稿。';
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-ledger-ai-image-layer';
      layer.setAttribute('data-action', 'ledger-ai-image-close');
      const full = panel.querySelector('.pfh-full');
      if (full) full.appendChild(layer);
      else panel.appendChild(layer);
    }
    layer.style.setProperty('z-index', '320', 'important');
    const hiddenKeys = getLedgerAiImageHiddenKeys(record, tab);
    const restoreHiddenHtml = hiddenKeys.size
      ? '<button type="button" class="pfh-ledger-ai-image-restore" data-action="ledger-ai-image-restore-hidden" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '">恢复隐藏 ' + hiddenKeys.size + ' 张</button>'
      : '';
    layer.innerHTML = '<section class="pfh-ledger-ai-image-dialog" role="dialog" aria-modal="true" aria-label="AI 生图" data-ledger-ai-image-dialog="1">' +
      '<header><div><h3>AI 生图 · ' + escapeHtml(record.sku) + '</h3><p class="pfh-ledger-ai-image-status is-' + escapeHtml(meta.status) + '">' + escapeHtml(meta.label) + (message ? ' · ' + escapeHtml(message) : '') + '</p></div><button type="button" class="pfh-ledger-ai-image-close" data-action="ledger-ai-image-close" aria-label="关闭">×</button></header>' +
      '<nav><button type="button" data-action="ledger-ai-image-tab" data-tab="main" class="' + (tab === 'main' ? 'is-active' : '') + '">主图 <em>' + getLedgerAiImageViewerTabCount(record, 'main') + '</em></button><button type="button" data-action="ledger-ai-image-tab" data-tab="detail" class="' + (tab === 'detail' ? 'is-active' : '') + '">详情图 <em>' + getLedgerAiImageViewerTabCount(record, 'detail') + '</em></button></nav>' +
      '<div class="pfh-ledger-ai-image-workspace"><aside class="pfh-ledger-ai-image-sidebar"><div class="pfh-ledger-ai-image-sidebar-head"><div><strong>图片列表</strong><span>' + entries.length + ' 张</span></div>' + restoreHiddenHtml + '</div><div class="pfh-ledger-ai-image-thumbs">' + thumbnailHtml + '</div></aside><main class="pfh-ledger-ai-image-preview">' + previewHtml + '</main></div>' +
      '<footer><span>' + escapeHtml(downloadProgress || '原图和修改图会保存在今日工作台记录中；关闭弹窗不会清除。') + '</span><div class="pfh-ledger-ai-image-download-actions">' + downloadButtonHtml('main', mainImages.length, '下载全部主图', mainDownloadKey) + downloadButtonHtml('detail', detailImages.length, '下载全部详情图', detailDownloadKey) + '<button type="button" data-action="ledger-ai-image-refresh" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (state.ledgerAiImageDownloadKey ? ' disabled' : '') + '>刷新状态</button></div></footer>' +
      '</section>';
    bindLucianComparisons(layer);
  }

  function handleLedgerAiImageButton(sku, dateKey) {
    const record = findLedgerRecord(sku, dateKey);
    if (!record) return;
    const hasImages = getLedgerAiImageViewerEntries(record, 'main').length || getLedgerAiImageViewerEntries(record, 'detail').length;
    if (hasImages) {
      openLedgerAiImageViewer(record);
      return;
    }
    queryLedgerAiImageStatus(sku, dateKey, {
      openViewer: true,
      submit: false,
    });
  }

  async function handleLedgerAiImageGenerate(sku, dateKey, kind) {
    const record = findLedgerRecord(sku, dateKey);
    if (!record) return;
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const key = getLedgerAiImageRequestKey(sku);
    if (state.ledgerAiImageRequests[key]) {
      showToast('这个 SKU 的 AI 生图正在处理中，请等待结果');
      return;
    }
    const status = normalizeLedgerAiImageStatus(record.aiImageStatus, record.aiImageMessage);
    if (status === 'loading' || status === 'running') {
      showToast('这个 SKU 的 AI 生图正在处理中，请等待结果');
      return;
    }
    const preparing = updateLedgerAiImageRecord(sku, dateKey, {
      aiImageStatus: 'loading',
      aiImageMessage: '正在准备并提交 PLM AI 生图（' + (normalizedKind === 'detail' ? '详情图' : '主图') + '）；请勿重复点击…',
      aiImageCheckedAtMs: Date.now(),
    }, false) || record;
    refreshLedgerCard(preparing);
    if (isLedgerAiImageViewerFor(sku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
    showToast(sku + ' 已开始准备提交 AI 生图，请稍候；提交成功后会显示“生图中”');
    let preparation = null;
    try {
      const preparationKey = getLedgerAiPreparationKey(sku);
      preparation = state.ledgerAiImagePreparations[preparationKey] || null;
      if (preparation && !preparation.loading) preparation = collectLedgerAiImagePreparationForm(sku) || preparation;
      if (!preparation || preparation.loading) preparation = await loadLedgerAiImagePreparation(sku, false);
      const missing = getLedgerAiPreparationMissing(preparation);
      if (missing.length) {
        const blocked = updateLedgerAiImageRecord(sku, dateKey, {
          aiImageStatus: missing.includes('SKU 效果图')
            ? (missing.length > 1 ? 'needs-prerequisites' : 'needs-sku-image')
            : 'needs-copywriting',
          aiImageMessage: '生图前置校验未通过：' + missing.join('、'),
          aiImageCheckedAtMs: Date.now(),
        }, true) || record;
        openLedgerAiImageViewer(blocked);
        showToast('已拦截 AI 生图：请先补齐 ' + missing.join('、'));
        return;
      }
    } catch (error) {
      const message = formatErrorMessage(error) || '接口异常';
      const failed = updateLedgerAiImageRecord(sku, dateKey, {
        aiImageStatus: 'error',
        aiImageMessage: '生图资料检查失败：' + message,
        aiImageCheckedAtMs: Date.now(),
      }, true) || findLedgerRecord(sku, dateKey) || record;
      refreshLedgerCard(failed);
      openLedgerAiImageViewer(failed);
      showToast('无法确认生图资料，已停止提交：' + message);
      return;
    }
    queryLedgerAiImageStatus(sku, dateKey, {
      openViewer: false,
      reopenViewerOnUpdate: false,
      poll: false,
      submit: true,
      generationKind: normalizedKind,
      preparation,
    });
  }

  function getLedgerAiPreparationFieldsForApi(preparation) {
    const result = {};
    const keyMap = {
      new_product_usage: 'usage',
      new_product_selling_points: 'sellingPoints',
      new_product_efficacy: 'efficacy',
      new_product_advantages: 'advantages',
    };
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      const values = getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparation, rule));
      result[keyMap[rule.key]] = { cn: values.value_cn || '', en: values.value || '' };
    });
    result.ingredientSummary = { cn: preparation.ingredients.product_ingredients_summary_ch || '', en: preparation.ingredients.product_ingredients_summary_en || '' };
    result.ingredientEfficacy = { cn: preparation.ingredients.product_ingredients_efficacy_ch || '', en: preparation.ingredients.product_ingredients_efficacy_en || '' };
    return result;
  }


  function mergeLedgerAiImagePreparationFields(preparation, fields) {
    const target = preparation || {};
    const source = fields || {};
    const keyMap = {
      new_product_usage: 'usage',
      new_product_selling_points: 'sellingPoints',
      new_product_efficacy: 'efficacy',
      new_product_advantages: 'advantages',
    };
    let filledCount = 0;
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      const item = ensureLedgerAiPreparationCopyItem(target, rule);
      const values = source[keyMap[rule.key]] || {};
      const cn = String(values.cn || '').trim();
      const en = String(values.en || '').trim();
      if (!String(item.value_cn || '').trim() && cn) { item.value_cn = cn; filledCount += 1; }
      if (!String(item.value || '').trim() && en) { item.value = en; filledCount += 1; }
    });
    target.ingredients = target.ingredients && typeof target.ingredients === 'object' ? target.ingredients : {};
    const ingredientFields = [
      ['ingredientSummary', 'product_ingredients_summary_ch', 'product_ingredients_summary_en'],
      ['ingredientEfficacy', 'product_ingredients_efficacy_ch', 'product_ingredients_efficacy_en'],
    ];
    ingredientFields.forEach(([sourceKey, cnKey, enKey]) => {
      const values = source[sourceKey] || {};
      const cn = String(values.cn || '').trim();
      const en = String(values.en || '').trim();
      if (!String(target.ingredients[cnKey] || '').trim() && cn) { target.ingredients[cnKey] = cn; filledCount += 1; }
      if (!String(target.ingredients[enKey] || '').trim() && en) { target.ingredients[enKey] = en; filledCount += 1; }
    });
    target.plmMissing = calculateLedgerAiPreparationMissing(target);
    return filledCount;
  }

  function getLedgerAiImagePlmDraftAttribute(values, spec, languageId) {
    const candidates = Array.isArray(values) ? values : [];
    const language = Number(languageId) || 1;
    const ids = new Set((spec && spec.ids || []).map((value) => String(value)));
    const variables = new Set((spec && spec.variables || []).map((value) => String(value).toLowerCase()));
    const labels = spec && spec.label instanceof RegExp ? spec.label : null;
    return candidates.find((item) => {
      if (!item || Number(item.language_id) !== language) return false;
      const idMatch = ids.size && ids.has(String(item.attr_id));
      const variable = String(item.variable_name || '').trim().toLowerCase();
      const label = String(item.attr_name || '').trim();
      return idMatch || (variables.size && variables.has(variable)) || (labels && labels.test(label));
    }) || null;
  }

  function buildLedgerAiImageProductDraft(infoPayload, contentPayload, sku, preparation, productContext) {
    const info = getMagicUploadPayloadData(infoPayload);
    const values = flattenMagicUploadProductAttributes(contentPayload);
    if (!values.length) throw new Error('未读取到商品模板字段，无法保存生图资料');
    const normalizedSku = getLedgerSkuKey(sku);
    const context = productContext || {};
    const draft = {};
    [
      'procurement_price', 'invoice_item_name', 'invoice_category', 'product_procure_infos',
      'is_need_to_process_product_procure_infos', 'language_config', 'product_type',
      'same_style_code', 'style_code', 'is_AMZ', 'brand_id', 'category_id', 'product_group_id',
      'virtual_classification', 'financial_settlement_classification', 'jst_old_code',
      'basic_unit_id', 'purchase_unit_id', 'sale_unit_id', 'purchase_conversion', 'sale_conversion',
      'is_SRS', 'srs_code', 'data_source', 'srs_product_code', 'srs_store_information', 'srs_store_supplier',
    ].forEach((key) => {
      draft[key] = info[key] === undefined ? null : cloneMagicUploadDraftValue(info[key]);
    });
    if (draft.product_procure_infos === null) draft.product_procure_infos = [];
    if (draft.is_need_to_process_product_procure_infos === null) draft.is_need_to_process_product_procure_infos = true;
    draft.product_version_id = Number(info.product_version_id || context.productVersionId) || info.product_version_id || context.productVersionId;
    draft.product_id = Number(info.product_id || context.productId) || info.product_id || context.productId;
    draft.code = String(info.code || context.productCode || normalizedSku).trim().toUpperCase();
    draft.attr_values = values.map((item) => ({ attr_id: item.attr_id, language_id: item.language_id, value: cloneMagicUploadDraftValue(item.value) }));
    const preparationData = preparation || {};
    const copyFields = [
      ['usage', { ids: [370], variables: ['usage_method'], label: /使用方法|directions/i }],
      ['sellingPoints', { ids: [223], variables: ['product_selling_points'], label: /产品卖点|selling points/i }],
      ['efficacy', { ids: [368], variables: ['product_efficacy'], label: /产品功效|product efficacy/i }],
      ['advantages', { ids: [222], variables: ['product_advantages'], label: /产品优势|product advantages/i }],
      ['ingredientSummary', { ids: [395], variables: ['ingredients'], label: /^成分$|ingredients?/i }],
      ['ingredientEfficacy', { ids: [217], variables: ['ingredient_function'], label: /成分功能|component function/i }],
    ];
    const copyValues = {
      usage: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[0])),
      sellingPoints: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[1])),
      efficacy: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[2])),
      advantages: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[3])),
      ingredientSummary: { value: preparationData.ingredients && preparationData.ingredients.product_ingredients_summary_en || '', value_cn: preparationData.ingredients && preparationData.ingredients.product_ingredients_summary_ch || '' },
      ingredientEfficacy: { value: preparationData.ingredients && preparationData.ingredients.product_ingredients_efficacy_en || '', value_cn: preparationData.ingredients && preparationData.ingredients.product_ingredients_efficacy_ch || '' },
    };
    copyFields.forEach(([key, spec]) => {
      const itemCn = getLedgerAiImagePlmDraftAttribute(values, spec, 1);
      const itemEn = getLedgerAiImagePlmDraftAttribute(values, spec, 2);
      if (!itemCn || !itemEn) throw new Error('商品模板缺少“' + (key === 'ingredientSummary' ? '成分' : (key === 'ingredientEfficacy' ? '成分功能' : key)) + '”中英文字段');
      const draftCn = draft.attr_values.find((item) => String(item.attr_id) === String(itemCn.attr_id) && Number(item.language_id) === 1);
      const draftEn = draft.attr_values.find((item) => String(item.attr_id) === String(itemEn.attr_id) && Number(item.language_id) === 2);
      if (!draftCn || !draftEn) throw new Error('商品模板字段“' + key + '”无法转换为保存格式');
      draftCn.value = String(copyValues[key].value_cn || '').trim();
      draftEn.value = String(copyValues[key].value || '').trim();
    });
    return draft;
  }

  async function saveLedgerAiImagePreparationDirect(sku, preparation) {
    const normalizedSku = getLedgerSkuKey(sku);
    if (!normalizedSku) throw new Error('缺少 SKU，无法保存生图资料');
    const listPayload = await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(normalizedSku));
    const list = getApiProductListItems(listPayload);
    const product = list.find((item) => String(item && (item.product_code || item.productCode || item.code || '')).trim().toUpperCase() === normalizedSku) || list[0];
    if (!product) throw new Error('产品列表未找到 SKU：' + normalizedSku);
    const productId = product.product_id || product.id;
    const productVersionId = product.product_version_id || product.product_main_id;
    if (!productId || !productVersionId) throw new Error('目标 SKU 缺少商品版本信息：' + normalizedSku);
    const infoPayload = await fetchPlmJson('/api/Product/GetDetailInfoByEdit?product_id=' + encodeURIComponent(productId) + '&product_version_id=' + encodeURIComponent(productVersionId));
    const info = getMagicUploadPayloadData(infoPayload);
    const categoryId = info.category_id || product.category_id;
    if (!categoryId) throw new Error('目标 SKU 缺少商品类目，无法保存生图资料');
    const contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(productVersionId));
    const draft = buildLedgerAiImageProductDraft(infoPayload, contentPayload, normalizedSku, preparation, {
      productId: String(productId),
      productVersionId: String(productVersionId),
      productCode: String(product.product_code || product.code || normalizedSku),
    });
    return fetchPlmApiJson('/api/Product/SaveProductDraftByEdit', draft);
  }

  function collectLedgerAiImagePreparationForm(sku) {
    const normalizedSku = getLedgerSkuKey(sku);
    const current = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(normalizedSku)];
    if (!current) return null;
    const preparation = {
      ...current,
      copywrite: Array.isArray(current.copywrite) ? current.copywrite.map((item) => ({ ...(item || {}) })) : [],
      ingredients: { ...(current.ingredients || {}) },
    };
    const layer = ensurePanel().querySelector('.pfh-ledger-ai-image-layer');
    if (layer) {
      layer.querySelectorAll('.pfh-ledger-ai-prep-input').forEach((input) => {
        const kind = input.getAttribute('data-prep-kind');
        const key = input.getAttribute('data-prep-key') || '';
        const value = String(input.value || '').trim();
        if (kind === 'copy') {
          const rule = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.find((item) => item.key === key);
          if (!rule) return;
          const item = ensureLedgerAiPreparationCopyItem(preparation, rule);
          if (input.getAttribute('data-prep-lang') === 'cn') item.value_cn = value;
          else item.value = value;
        } else if (kind === 'ingredient' && key) {
          preparation.ingredients[key] = value;
        }
      });
    }
    preparation.plmMissing = calculateLedgerAiPreparationMissing(preparation);
    preparation.localDirty = true;
    state.ledgerAiImagePreparations[getLedgerAiPreparationKey(normalizedSku)] = preparation;
    return preparation;
  }

  function updateLedgerAiImagePreparationInlineState(sku) {
    const preparation = collectLedgerAiImagePreparationForm(sku);
    if (!preparation) return;
    const layer = ensurePanel().querySelector('.pfh-ledger-ai-image-layer');
    if (!layer) return;
    const missing = getLedgerAiPreparationMissing(preparation);
    layer.querySelectorAll('.pfh-ledger-ai-prep-input').forEach((input) => {
      const value = String(input.value || '').trim();
      input.classList.toggle('is-missing', !isValidLedgerAiImageText(value));
    });
    const badge = layer.querySelector('.pfh-ledger-ai-prep-head span');
    if (badge) {
      badge.textContent = missing.length ? 'PLM 还缺 ' + missing.length + ' 项' : 'PLM 资料已完整';
      badge.classList.toggle('is-missing', Boolean(missing.length));
      badge.classList.toggle('is-ready', !missing.length);
    }
    const submit = layer.querySelector('.pfh-ledger-ai-prep-submit');
    if (submit) submit.disabled = Boolean(missing.length);
    const notice = layer.querySelector('.pfh-ledger-ai-prep-missing');
    if (notice) notice.textContent = missing.length
      ? '当前缺少：' + missing.join('、') + '。保存后会由 PLM API 回读确认；没有 SKU 效果图时不能开始 AI 生图。'
      : 'PLM 资料已完整；提交前还会再次检查文案和 SKU 效果图。';
  }

  async function saveLedgerAiImagePreparationDraft(sku) {
    const normalizedSku = getLedgerSkuKey(sku);
    const key = getLedgerAiPreparationKey(normalizedSku);
    if (state.ledgerAiImageSaveRequests[key]) return state.ledgerAiImageSaveRequests[key];
    const preparation = collectLedgerAiImagePreparationForm(normalizedSku);
    if (!preparation) return null;
    preparation.saving = true;
    renderLedgerAiImageViewer(ensurePanel());
    const request = (async () => {
      await saveLedgerAiImagePreparationDirect(normalizedSku, preparation);
      showToast('生图资料已保存到 PLM 草稿，正在回读校验…');
      await wait(350);
      const verified = await loadLedgerAiImagePreparation(normalizedSku, true);
      renderLedgerAiImageViewer(ensurePanel());
      const missing = getLedgerAiPreparationMissing(verified);
      showToast(missing.length ? '已保存，但当前仍缺：' + missing.join('、') : 'PLM 草稿已保存，文案和 SKU 效果图均已通过校验');
      return verified;
    })();
    state.ledgerAiImageSaveRequests[key] = request;
    try { return await request; }
    catch (error) { showToast('保存生图资料失败：' + (formatErrorMessage(error) || '接口异常')); return null; }
    finally {
      if (state.ledgerAiImageSaveRequests[key] === request) delete state.ledgerAiImageSaveRequests[key];
      const current = state.ledgerAiImagePreparations[key];
      if (current) current.saving = false;
      renderLedgerAiImageViewer(ensurePanel());
    }
  }

  async function applyLedgerAiPreparationToPlmDraft(sku, fields) {
    const normalizedSku = getLedgerSkuKey(sku);
    const preparation = await loadLedgerAiImagePreparation(normalizedSku, true);
    const filledCount = mergeLedgerAiImagePreparationFields(preparation, fields);
    await saveLedgerAiImagePreparationDirect(normalizedSku, preparation);
    return filledCount;
  }

  async function refreshLedgerAiImagePreparation(sku) {
    const key = getLedgerAiPreparationKey(sku);
    const existing = state.ledgerAiImagePreparations[key];
    state.ledgerAiImagePreparations[key] = { ...(existing || {}), sku: getLedgerSkuKey(sku), copywrite: existing && existing.copywrite || [], ingredients: existing && existing.ingredients || {}, skuImage: existing && existing.skuImage || { status: 'unknown' }, loading: true, loadingStage: '正在重新读取生图资料', loadingDetail: '正在重新检查产品文案、成分和 SKU 效果图…' };
    renderLedgerAiImageViewer(ensurePanel());
    await loadLedgerAiImagePreparation(sku, true);
    renderLedgerAiImageViewer(ensurePanel());
  }

  async function autofillLedgerAiImagePreparation(sku) {
    const key = getLedgerAiPreparationKey(sku);
    if (state.ledgerAiImageAutofillRequests[key]) return state.ledgerAiImageAutofillRequests[key];
    const request = (async () => {
      const preparation = await loadLedgerAiImagePreparation(sku, true);
      const data = normalizeData(loadData(sku) || { sku });
      const response = await cloudRequest('/ai-image/copywriting-complete', {
        method: 'POST',
        timeoutMs: 90000,
        body: { sku, name: data.name || sku, fields: getLedgerAiPreparationFieldsForApi(preparation) },
      });
      if (!response || !response.ok) throw new Error(response && response.error || 'AI 未返回可用文案');
      const filledCount = await applyLedgerAiPreparationToPlmDraft(sku, response.fields || {});
      showToast('PLM 草稿保存成功，正在通过后台服务回读校验…');
      await wait(500);
      const verified = await loadLedgerAiImagePreparation(sku, true);
      renderLedgerAiImageViewer(ensurePanel());
      const missing = getLedgerAiPreparationMissing(verified);
      showToast(missing.length
        ? '草稿已保存，但 PLM 后台回读仍缺 ' + missing.length + ' 项：' + missing.join('、')
        : '已补齐 ' + filledCount + ' 个字段、保存 PLM 草稿并通过后台完整性校验');
      return verified;
    })();
    state.ledgerAiImageAutofillRequests[key] = request;
    renderLedgerAiImageViewer(ensurePanel());
    try { return await request; }
    catch (error) { showToast('AI 补齐或保存草稿失败：' + (formatErrorMessage(error) || '接口异常')); return null; }
    finally {
      if (state.ledgerAiImageAutofillRequests[key] === request) delete state.ledgerAiImageAutofillRequests[key];
      renderLedgerAiImageViewer(ensurePanel());
    }
  }

  async function queryLedgerAiImageStatus(sku, dateKey, options) {
    const normalizedSku = String(sku || '').trim();
    const key = getLedgerAiImageRequestKey(normalizedSku);
    if (!normalizedSku) return null;
    const opts = options || {};
    const existingRequest = state.ledgerAiImageRequests[key];
    if (existingRequest) {
      const current = findLedgerRecord(normalizedSku, dateKey);
      if (opts.openViewer && current) openLedgerAiImageViewer(current);
      else if (current && isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
      return existingRequest;
    }
    const current = findLedgerRecord(normalizedSku, dateKey);
    if (!current) return null;
    const shouldSubmit = Boolean(opts.submit);
    const allowPolling = opts.poll !== false;
    if (shouldSubmit && !allowPolling) clearLedgerAiImagePoll(normalizedSku);
    let taskExists = null;
    let loadingRecord = current;
    if (normalizeLedgerAiImageStatus(current.aiImageStatus) !== 'loading') {
      loadingRecord = updateLedgerAiImageRecord(normalizedSku, dateKey, {
        aiImageStatus: 'loading',
        aiImageMessage: shouldSubmit
          ? '正在提交 PLM AI 生图（' + (opts.generationKind === 'detail' ? '详情图' : '主图') + '入口）；不会自动查询结果…'
          : '正在检查这个 SKU 是否已有生图历史；不会提交生成请求…',
      }, false) || current;
      refreshLedgerCard(loadingRecord);
    }
    if (opts.openViewer) openLedgerAiImageViewer(loadingRecord);
    else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
    const request = (async () => {
      try {
        if (!shouldSubmit) {
          taskExists = await getLedgerAiImageTaskExists(normalizedSku);
          if (taskExists !== true) {
            if (taskExists === null) {
              const failed = updateLedgerAiImageRecord(normalizedSku, dateKey, {
                aiImageStatus: 'error',
                aiImageMessage: '无法确认是否存在生图历史；已停止查询，不会提交生成',
                aiImageCheckedAtMs: Date.now(),
              }, true) || loadingRecord;
              refreshLedgerCard(failed);
              if (opts.openViewer) openLedgerAiImageViewer(failed);
              else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
              showToast(normalizedSku + ' 生图历史查询失败，未提交任何生图请求');
              return failed;
            }
            const preparation = await loadLedgerAiImagePreparation(normalizedSku, true);
            const missing = getLedgerAiPreparationMissing(preparation);
            const status = missing.includes('SKU 效果图')
              ? (missing.length > 1 ? 'needs-prerequisites' : 'needs-sku-image')
              : (missing.length ? 'needs-copywriting' : 'empty');
            const ready = updateLedgerAiImageRecord(normalizedSku, dateKey, {
              aiImageStatus: status,
              aiImageMessage: missing.length ? '没有生图历史；请先补齐：' + missing.join('、') : '没有生图历史；资料已完整，可手动提交 AI 生图',
              aiImageJobId: '',
              aiImageCheckedAtMs: Date.now(),
            }, true) || loadingRecord;
            refreshLedgerCard(ready);
            if (opts.openViewer) openLedgerAiImageViewer(ready);
            else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
            return ready;
          }
        }
        const requestBody = shouldSubmit
          ? await prepareLedgerAiImageGenerationPayload(normalizedSku, opts.preparation)
          : { code: normalizedSku };
        if (shouldSubmit) {
          const preparing = findLedgerRecord(normalizedSku, dateKey) || loadingRecord;
          const preparingUpdated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
            aiImageStatus: 'loading',
            aiImageMessage: '生图资料已准备，正在提交 PLM AI 生图（' + (opts.generationKind === 'detail' ? '详情图' : '主图') + '入口）；不会自动查询结果…',
          }, true) || preparing;
          refreshLedgerCard(preparingUpdated);
          if (opts.openViewer) openLedgerAiImageViewer(preparingUpdated);
          else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
        }
        const payload = await fetchPlmApiJson(LEDGER_AI_IMAGE_RESULT_ENDPOINT, requestBody);
        const result = parseLedgerAiImageResult(payload);
        const latest = findLedgerRecord(normalizedSku, dateKey) || loadingRecord;
        const changed = !ledgerAiImageResultMatches(latest, result);
        const patch = {
          aiImageStatus: result.status,
          aiImageMessage: result.message,
          aiImageJobId: result.jobId,
          aiMainImages: result.mainImages,
          aiDetailImages: result.detailImages,
          artworkState: result.status === 'success' ? 'done' : (result.status === 'running' ? 'doing' : latest.artworkState),
        };
        if (changed) patch.aiImageCheckedAtMs = Date.now();
        const updated = changed ? (updateLedgerAiImageRecord(normalizedSku, dateKey, patch, true) || latest) : latest;
        if (changed) refreshLedgerCard(updated);
        if (result.status === 'running' && allowPolling) scheduleLedgerAiImagePoll(normalizedSku, dateKey);
        else clearLedgerAiImagePoll(normalizedSku);
        const viewerMatches = isLedgerAiImageViewerFor(normalizedSku, dateKey);
        if (opts.openViewer || (opts.reopenViewerOnUpdate !== false && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku))) {
          openLedgerAiImageViewer(updated);
        } else if (viewerMatches) {
          renderLedgerAiImageViewer(ensurePanel());
        }
        if (!shouldSubmit && result.status === 'success' && getLedgerDetail3Image(updated)) auditLedgerDetail3(normalizedSku, dateKey, false);
        if (result.status === 'empty' && opts.openViewer) showToast(normalizedSku + ' 暂无可查看的 AI 生图');
        if (shouldSubmit) showToast(normalizedSku + ' AI 生图已提交，后台生成中；本次不会自动轮询。');
        return updated;
      } catch (error) {
        const latest = findLedgerRecord(normalizedSku, dateKey) || loadingRecord;
        const message = formatErrorMessage(error);
        const queryCopywritingFailure = !shouldSubmit && isLedgerAiImageCopywritingError(message);
        const preflight = error && error.ledgerAiImagePreflight;
        const preflightStatus = preflight
          ? (preflight.missingCopywriting && preflight.skuImageStatus !== 'available'
            ? 'needs-prerequisites'
            : (preflight.skuImageStatus !== 'available' ? 'needs-sku-image' : 'needs-copywriting'))
          : '';
        const status = preflightStatus || (queryCopywritingFailure
          ? (taskExists === true ? 'task-error' : (taskExists === false ? 'empty' : 'error'))
          : normalizeLedgerAiImageStatus('error', message));
        let statusMessage = message || (shouldSubmit ? 'AI 生图提交失败' : 'AI 生图状态查询失败');
        if (status === 'needs-prerequisites') {
          statusMessage = '生图前置校验未通过：请先补齐产品文案和 SKU 效果图，再开始生成';
        } else if (status === 'needs-sku-image') {
          statusMessage = '生图前置校验未通过：请先上传 SKU 效果图，再开始生成';
        } else if (status === 'needs-copywriting') {
          statusMessage = '生图前置校验未通过：请先补齐有效产品文案，再开始生成';
        } else if (status === 'task-error') {
          statusMessage = 'PLM 有生图任务记录，但查询不到图片结果，请刷新或联系管理员清理任务';
        } else if (status === 'empty' && queryCopywritingFailure) {
          statusMessage = '当前未发现 PLM AI 生图结果，请在弹窗中手动选择主图或详情图生成';
        }
        const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
          aiImageStatus: status,
          aiImageMessage: statusMessage,
          aiImageJobId: '',
          aiImageCheckedAtMs: Date.now(),
        }, true) || latest;
        clearLedgerAiImagePoll(normalizedSku);
        refreshLedgerCard(updated);
        const viewerMatches = isLedgerAiImageViewerFor(normalizedSku, dateKey);
        if (opts.openViewer || (opts.reopenViewerOnUpdate !== false && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku))) openLedgerAiImageViewer(updated);
        else if (viewerMatches) renderLedgerAiImageViewer(ensurePanel());
        if (status === 'needs-prerequisites') {
          showToast(normalizedSku + ' 缺少产品文案或 SKU 效果图，已拦截生图请求');
        } else if (status === 'needs-sku-image') {
          showToast(normalizedSku + ' 缺少 SKU 效果图，已拦截生图请求');
        } else if (status === 'needs-copywriting') {
          showToast(normalizedSku + ' 缺少产品文案，暂时无法开始 AI 生图');
        } else if (status === 'task-error') {
          showToast(normalizedSku + ' 有生图任务记录，但查询不到结果，请联系管理员清理任务');
        } else if (status === 'empty' && queryCopywritingFailure) {
          showToast(normalizedSku + ' 当前未生成 AI 生图，请在弹窗内手动选择主图或详情图生成');
        } else {
          showToast((shouldSubmit ? '提交 ' : '查询 ') + normalizedSku + ' AI 生图失败：' + (message || '网络请求失败'));
        }
        return updated;
      }
    })();
    state.ledgerAiImageRequests[key] = request;
    try {
      return await request;
    } finally {
      if (state.ledgerAiImageRequests[key] === request) delete state.ledgerAiImageRequests[key];
    }
  }

  function cycleLedgerArtworkState(sku, dateKey) {
    syncDailyLedgerBeforeMutation();
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const current = normalizeLedgerArtworkState(existing && existing.artworkState);
    const next = current === 'pending' ? 'doing' : (current === 'doing' ? 'done' : 'pending');
    const label = next === 'doing' ? '生图中' : (next === 'done' ? '完成生图' : '待生图');
    const updated = updateDailyLedgerForSku(sku, { artworkState: next, note: label, skipStorageSync: true }, key);
    refreshLedgerCard(updated);
  }

  function openLedgerReference(sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const url = record && record.referenceUrl;
    if (!url) {
      showToast('这个编码没有参考链接');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function openReverseImageSearch(engine, imageUrl) {
    const source = String(imageUrl || '').trim();
    let parsed;
    try { parsed = new URL(source, window.location.origin); } catch (_) { parsed = null; }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) {
      showToast('当前图片没有可公开搜索的地址');
      return;
    }
    const normalized = parsed.href;
    if (engine === 'google') {
      window.open('https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(normalized), '_blank', 'noopener,noreferrer');
      return;
    }
    if (engine === 'yandex') {
      window.open('https://yandex.com/images/search?rpt=imageview&url=' + encodeURIComponent(normalized), '_blank', 'noopener,noreferrer');
      return;
    }
    copyText(normalized);
    window.open('https://s.1688.com/youyuan/index.htm?tab=imageSearch', '_blank', 'noopener,noreferrer');
    showToast('图片地址已复制；1688 打开后点相机并粘贴/上传当前图');
  }

  function captureLedgerReturnScroll(originCard) {
    const panel = document.getElementById(PANEL_ID);
    const detailScroll = panel && panel.querySelector('.pfh-detail-scroll');
    const ledgerList = panel && panel.querySelector('.pfh-ledger-list');
    const card = originCard && originCard.classList && originCard.classList.contains('pfh-ledger-item') ? originCard : null;
    const detailRect = detailScroll && detailScroll.getBoundingClientRect();
    const cardRect = card && card.getBoundingClientRect();
    return {
      detailTop: detailScroll ? detailScroll.scrollTop : 0,
      detailLeft: detailScroll ? detailScroll.scrollLeft : 0,
      listTop: ledgerList ? ledgerList.scrollTop : 0,
      listLeft: ledgerList ? ledgerList.scrollLeft : 0,
      sku: card && card.getAttribute('data-ledger-sku') || '',
      date: card && card.getAttribute('data-ledger-date') || '',
      cardOffset: detailRect && cardRect ? cardRect.top - detailRect.top : null,
    };
  }

  function restoreLedgerReturnScroll(snapshot) {
    if (!snapshot) return;
    window.requestAnimationFrame(() => {
      const panel = document.getElementById(PANEL_ID);
      const detailScroll = panel && panel.querySelector('.pfh-detail-scroll');
      const ledgerList = panel && panel.querySelector('.pfh-ledger-list');
      if (detailScroll) {
        detailScroll.scrollTop = Number(snapshot.detailTop) || 0;
        detailScroll.scrollLeft = Number(snapshot.detailLeft) || 0;
      }
      if (ledgerList) {
        ledgerList.scrollTop = Number(snapshot.listTop) || 0;
        ledgerList.scrollLeft = Number(snapshot.listLeft) || 0;
      }
      window.requestAnimationFrame(() => {
        if (!detailScroll || !Number.isFinite(snapshot.cardOffset) || !snapshot.sku) return;
        const card = Array.from(panel.querySelectorAll('.pfh-ledger-item')).find((item) =>
          item.getAttribute('data-ledger-sku') === snapshot.sku && (!snapshot.date || item.getAttribute('data-ledger-date') === snapshot.date)
        );
        if (!card) return;
        const delta = card.getBoundingClientRect().top - detailScroll.getBoundingClientRect().top - snapshot.cardOffset;
        if (Math.abs(delta) > 1) detailScroll.scrollTop += delta;
      });
    });
  }

  function openLedgerSku(sku, originCard) {
    if (!sku) return;
    const data = normalizeData(loadData(sku) || { sku });
    state.detailReturnScroll = state.view === 'ledger' ? captureLedgerReturnScroll(originCard) : null;
    state.selectedSku = sku;
    state.data = data;
    state.detailReturnView = state.view || 'ledger';
    state.view = 'detail';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
    window.setTimeout(() => refreshMaterialFromApiWithoutDrawer(sku, data).catch((error) => {
      addLog('warn', '今日工作台后台刷新物料失败', sku + ' | ' + formatErrorMessage(error));
    }), 0);
  }
