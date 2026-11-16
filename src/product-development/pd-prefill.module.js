
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
    if (definition && definition.key === 'specification') productDevelopmentSyncSpecificationFromCopy(detail);
    if (definition && ['firstPrice', 'secondPrice', 'thirdPrice'].includes(definition.key)) productDevelopmentSyncCostTierPrices(detail);
    if (definition && definition.key === 'procurementPrice') productDevelopmentSyncProcurementPrice(detail);
    if (definition && ['outerLength', 'outerWidth', 'outerHeight', 'outerVolume', 'standardPackingQuantity'].includes(definition.key)) {
      productDevelopmentSyncReworkOuterDimensions(detail);
      productDevelopmentRefreshDerivedDimensions(detail);
    }
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

  function productDevelopmentSyncSpecificationFromCopy(detail) {
    if (!detail || !detail.sku) return;
    const sku = String(detail.sku).trim().toUpperCase();
    const review = typeof state !== 'undefined' && state.productDevelopmentReview && state.productDevelopmentReview.sku === sku
      ? state.productDevelopmentReview
      : typeof getProductDevelopmentReviewDraft === 'function' ? getProductDevelopmentReviewDraft(sku) : null;
    if (!review || String(review.sku || '').toUpperCase() !== sku) return;
    const text = review.editorDocument && typeof review.editorDocument.replacementEn === 'string'
      ? review.editorDocument.replacementEn
      : review.plainTextCopy || review.approvedPlainText || review.finalCopy || (review.items || []).map((item) => item.replacementEn || item.sourceText || '').join('\n');
    const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const amount = '(\\d+(?:\\.\\d+)?)\\s*(ml|kg|g|l|capsules?|tablets?|gummies|pcs?)\\b';
    const marked = lines.flatMap((line, index) => /\bnet\s*(?:content|contents|wt\.?|weight)\b|净含量/i.test(line) ? [line + ' ' + (lines[index + 1] || '')] : []);
    const candidates = marked.length ? marked : lines.filter((line) => new RegExp('^(?:NET\\s*(?:WT\\.?|CONTENTS?)\\s*[:：]?\\s*)?' + amount, 'i').test(line));
    const matches = candidates.map((line) => line.match(new RegExp('(?:^|[^a-z0-9.])' + amount, 'i'))).filter(Boolean).filter((match) => Number(match[1]) > 0);
    const contents = Array.from(new Set(matches.map((match) => Number(match[1]) + ({ l: 'L', capsules: '粒', capsule: '粒', tablets: '片', tablet: '片', gummies: '粒', pc: '个', pcs: '个' }[match[2].toLowerCase()] || match[2].toLowerCase()))));
    const fields = productDevelopmentProductFieldCollections(detail);
    const definition = { attrId: 119 };
    const previous = productDevelopmentPrefillLocalAttrValue(detail, definition);
    // A cleared/ambiguous source must not silently retain a previously derived value.
    const derivedBefore = detail.productDetailLocalValues && detail.productDetailLocalValues['119@1']?.source === '当前英文文案';
    if (contents.length !== 1 && !derivedBefore) return;
    const field = fields.find((item) => item.key === 'specification' || Number(item.attrId) === 119);
    const old = String(previous !== undefined ? previous : field && (field.displayValue || field.value) || '');
    const box = detail.materialDrafts && detail.materialDrafts.box;
    const hasBox = box && box.enabled !== false || (detail.bomRows || []).some((row) => /纸盒/.test(String(row.name || '') + ' ' + String(row.category || '')));
    const unit = hasBox ? '盒' : (old.match(/\/\s*(盒|瓶|袋|支|罐|包|套|个)/) || [])[1];
    const specification = contents.length === 1 ? contents[0] + (unit ? '/' + unit : '') : '';
    productDevelopmentRememberLocalProductField(detail, definition, specification, specification, '当前英文文案');
    fields.filter((item) => item.key === 'specification' || Number(item.attrId) === 119).forEach((item) => { item.value = specification; item.displayValue = specification; item.source = '当前英文文案'; });
  }

  function productDevelopmentSyncCostTierPrices(detail, scope) {
    if (!detail) return;
    const fields = productDevelopmentProductFieldCollections(detail);
    const costField = fields.find((field) => Number(field.attrId) === 153 || field.key === 'costPrice');
    const local = productDevelopmentPrefillLocalAttrValue(detail, { attrId: 153 });
    const raw = productDevelopmentPrefillText(local !== undefined ? local : costField && (costField.displayValue || costField.value)).replace(/,/g, '');
    const cost = raw !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;
    for (const [key, attrId, increase] of [['thirdPrice',156,2], ['secondPrice',155,3], ['firstPrice',154,4]]) {
      const value = cost === null ? '' : productDevelopmentRoundUnitPrice(cost + increase);
      productDevelopmentRememberLocalProductField(detail, { attrId }, value, value, '成本价自动计算');
      fields.filter((field) => Number(field.attrId) === attrId).forEach((field) => { field.value = value; field.displayValue = value; });
      if (scope) scope.querySelectorAll('[data-form-group="prefill"][data-form-key="' + key + '"]').forEach((input) => { input.value = value; input.closest('label')?.classList.toggle('is-missing', value === ''); });
    }
  }

  function productDevelopmentSyncProcurementPrice(detail, scope) {
    productDevelopmentApplyBomUnitPrice(detail);
    if (!detail || detail.productDetailProcurementPriceSource === 'manual') return;
    const raw = productDevelopmentPrefillText(productDevelopmentProcurementFieldValue(detail, 'materialPrice')).replace(/,/g, '');
    if (raw === '' && !productDevelopmentPrefillHasValue(detail.productDetailLocalProcurement, 'materialPrice')) return;
    const unitPrice = productDevelopmentRoundUnitPrice(raw);
    const price = unitPrice !== '' ? (Number(unitPrice) + 0.5).toFixed(2) : '';
    const definition = { attrId: 152 };
    if (String(productDevelopmentPrefillLocalAttrValue(detail, definition) ?? '') !== price) {
      productDevelopmentRememberLocalProductField(detail, definition, price, price, '采购单价 + 0.5');
      productDevelopmentProductFieldCollections(detail).filter((field) => Number(field.attrId) === 152).forEach((field) => { field.value = price; field.displayValue = price; });
    }
    if (scope) scope.querySelectorAll('[data-form-group="prefill"][data-form-key="procurementPrice"]').forEach((input) => { input.value = price; });
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
    if (key === 'materialPrice') productDevelopmentApplyBomUnitPrice(detail);
    const local = detail && detail.productDetailLocalProcurement && typeof detail.productDetailLocalProcurement === 'object'
      ? detail.productDetailLocalProcurement
      : {};
    if (productDevelopmentPrefillHasValue(local, key)) {
      const legacyDefault = key === 'quantity' && String(local[key]) === '100'
        && detail.productDetailProcurementQuantitySource !== 'manual'
        && (detail.productDetailProcurementQuantitySource === 'default' || detail.productDevelopmentReworkLookup);
      return legacyDefault ? PRODUCT_DEVELOPMENT_REWORK_DEFAULT_PROCUREMENT.quantity : key === 'materialPrice' ? productDevelopmentRoundUnitPrice(local[key]) : local[key];
    }
    if (key === 'quantity') return PRODUCT_DEVELOPMENT_REWORK_DEFAULT_PROCUREMENT.quantity;
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
    return sourceKey ? (key === 'materialPrice' ? productDevelopmentRoundUnitPrice(row[sourceKey]) : row[sourceKey]) : '';
  }

  function productDevelopmentRoundUnitPrice(value) {
    const text = String(value ?? '').trim().replace(/,/g, '');
    const number = Number(text);
    if (!text || !Number.isFinite(number) || number < 0) return '';
    return (Math.round((number + Number.EPSILON * Math.max(1, number)) * 100) / 100).toFixed(2);
  }

  function productDevelopmentApplyBomUnitPrice(detail) {
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    const materials = rows.filter((row) => Number(row.typeValue) === 2 && row.isPricing !== false && row.isPricing !== 0);
    if (!materials.length) return;
    let total = 0;
    for (const row of materials) {
      const price = String(row.price ?? '').trim();
      const usage = String(row.usage ?? '').trim();
      if (!price || !usage || !Number.isFinite(Number(price)) || !Number.isFinite(Number(usage)) || Number(price) < 0 || Number(usage) < 0) return;
      total += Number(price) * Number(usage);
    }
    const signature = JSON.stringify(materials.map((row) => [row.joinId, row.code, row.price, row.usage]));
    if (detail.productDetailBomPriceSignature === signature) return;
    detail.productDetailBomPriceSignature = signature;
    if (!detail.productDetailLocalProcurement) detail.productDetailLocalProcurement = {};
    const price = productDevelopmentRoundUnitPrice(total);
    if (String(detail.productDetailLocalProcurement.materialPrice ?? '') !== price) detail.productDetailProcurementPriceSource = 'default';
    detail.productDetailLocalProcurement.materialPrice = price;
  }

  // Fixed lists observed in the logged-in PLM drawer on 2026-11-13. Supplier choices use its live search API.
  function productDevelopmentPrefillOptions(field, detail) {
    const fixed = {
      processType: ['直采', '来料加工', '仅加工'],
      taxRate: ['不含税', '0.00%', '1.00%', '1.50%', '2.00%', '3.00%', '4.00%', '5.00%', '6.00%', '6.50%', '7.00%', '7.50%', '8.00%', '8.50%', '9.00%', '10.00%', '11.00%', '12.00%', '13.00%'],
      productProductionLine: ['软管', '针管', '牙胶', '膏霜灌装', '水类灌装', '粉末类', '蜡基类', '其他手工', '鼻通', '粉底'],
    };
    const fromPlm = detail && detail.prefillOptions && detail.prefillOptions[field.attrId];
    return Array.isArray(fromPlm) && fromPlm.length ? fromPlm : (fixed[field.key] || []).map((label) => ({ label, value: label }));
  }

  function productDevelopmentAttributeOptions(attr) {
    const list = (value) => { if (Array.isArray(value)) return value; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; } };
    return list(attr.option_list_json).concat(list(attr.multi_attr_value_options_json).flatMap((group) => list(group.options))).map((option) => ({
      value: option.value === undefined ? option.id : option.value,
      label: String((option.option_label_list || []).find((item) => Number(item.language_id) === 1)?.label || (option.option_label_list || [])[0]?.label || option.mult_attr_value_name || option.label || option.value || ''),
    })).filter((option) => option.value !== undefined && option.label);
  }

  function productDevelopmentSearchSuppliers(input) {
    window.clearTimeout(input.pfhSupplierTimer);
    const query = String(input.value || '').trim();
    const sku = input.getAttribute('data-form-sku');
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    if (!detail) return;
    input.pfhSupplierQuery = query;
    input.pfhSupplierTimer = window.setTimeout(async () => {
      try {
        input.setAttribute('aria-busy', 'true');
        const payload = await fetchPlmJson('/api/ProjectFormData/GetSrmSupplierDataSourceList?page=1&pageSize=20&status=1&name=' + encodeURIComponent(query));
        if (payload && payload.success === false) throw new Error('供应商查询失败');
        if (!input.isConnected || input.pfhSupplierQuery !== query || state.productDevelopmentTaskFormData[sku] !== detail) return;
        const list = payload && payload.data && payload.data.list;
        detail.productDevelopmentSupplierOptions = (Array.isArray(list) ? list : []).map((item) => ({ label: String(item.company_supplier_name || ''), value: item.company_supplier_id })).filter((item) => item.label && item.value);
        const datalist = document.getElementById(input.getAttribute('list'));
        if (datalist) datalist.innerHTML = detail.productDevelopmentSupplierOptions.map((item) => '<option value="' + escapeHtml(item.label) + '"></option>').join('');
        input.title = detail.productDevelopmentSupplierOptions.length ? '请从候选供应商中选择' : '没有匹配的供应商';
        if (detail.productDevelopmentSupplierOptions.some((item) => item.label === input.value)) productDevelopmentHandleChange({ target: input });
      } catch (_) {
        if (input.isConnected && input.pfhSupplierQuery === query) input.title = '供应商查询失败，请重新输入后重试';
      } finally { if (input.pfhSupplierQuery === query) input.removeAttribute('aria-busy'); }
    }, 250);
  }

  function productDevelopmentApplyProductDetailLocalValues(detail) {
    if (!detail || typeof detail !== 'object') return detail;
    productDevelopmentSyncReworkOuterDimensions(detail);
    productDevelopmentRefreshDerivedDimensions(detail);
    productDevelopmentSyncSpecificationFromCopy(detail);
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


  function productDevelopmentClearReworkLocalProductFields(detail) {
    if (!detail || !detail.productDetailLocalValues || typeof detail.productDetailLocalValues !== 'object') return;
    const attrIds = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.map((definition) => Number(definition.attrId))
      .concat([301, 457, 522, 587, 652, 717, 1183]);
    Array.from(new Set(attrIds)).forEach((attrId) => {
      const key = attrId + '@1';
      const entry = detail.productDetailLocalValues[key];
      if (entry && ['返工编码 API', '对标编码 API'].includes(entry.source)) delete detail.productDetailLocalValues[key];
    });
  }

  function productDevelopmentApplyReworkProductLookup(detail, lookup) {
    if (!detail || !lookup || typeof lookup !== 'object') return null;
    const referenceLabel = productDevelopmentReferenceLabel(detail);
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
      productDevelopmentRememberLocalProductField(detail, definition, rawValue, textValue, referenceLabel + '编码 API');
      productDevelopmentProductFieldCollections(detail).filter((field) => Number(field && field.attrId) === Number(definition.attrId)).forEach((field) => {
        field.value = productDevelopmentCloneValue(rawValue);
        field.displayValue = textValue;
        field.status = '已预填（' + referenceLabel + '编码）';
        field.source = referenceLabel + '编码 API';
      });
      return true;
    };
    setField('specification', enriched.specification, enriched.specification);
    setField('roughWeight', enriched.roughWeight, enriched.roughWeight);
    setField('outerLength', enriched.outerLength, enriched.outerLength);
    setField('outerWidth', enriched.outerWidth, enriched.outerWidth);
    setField('outerHeight', enriched.outerHeight, enriched.outerHeight);
    setField('outerVolume', enriched.outerVolume, enriched.outerVolume);
    productDevelopmentSyncReworkOuterDimensions(detail, enriched);
    setField('productProductionLine', enriched.productLineValue, enriched.productLine);
    setField('minimumOrderQuantity', '100', '100');
    setField('procurementPrice', enriched.procurementPrice, enriched.procurementPrice);
    setField('costPrice', enriched.costPrice, enriched.costPrice);
    setField('firstPrice', enriched.firstPrice, enriched.firstPrice);
    setField('secondPrice', enriched.secondPrice, enriched.secondPrice);
    setField('thirdPrice', enriched.thirdPrice, enriched.thirdPrice);
    setField('standardPackingQuantity', enriched.standardPackingQuantity, enriched.standardPackingQuantity);
    if (!detail.productDetailLocalProcurement || typeof detail.productDetailLocalProcurement !== 'object') detail.productDetailLocalProcurement = Object.create(null);
    const quantity = productDevelopmentProcurementFieldValue(detail, 'quantity');
    Object.assign(detail.productDetailLocalProcurement, {
      ...PRODUCT_DEVELOPMENT_REWORK_DEFAULT_PROCUREMENT,
      quantity,
      materialPrice: enriched.procurementPrice,
    });
    if (detail.productDetailProcurementQuantitySource !== 'manual') detail.productDetailProcurementQuantitySource = 'default';
    if (Array.isArray(detail.bomRows) && detail.bomRows.length) {
      delete detail.productDetailBomPriceSignature;
      productDevelopmentSyncProcurementPrice(detail);
    }
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
    const parsed = productDevelopmentReadonlyDimensionText(productDevelopmentPrefillText(value, 240));
    return parsed && parsed.every((item) => Number.isFinite(item) && item > 0) ? parsed : null;
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
    const draft = detail && detail.materialDrafts && detail.materialDrafts.box;
    if (draft && draft.enabled !== false) {
      const dimensions = productDevelopmentReworkLookupObjectDimensions(draft, [
        ['length'], ['width'], ['height'],
      ]) || productDevelopmentReworkLookupDimensions(draft.specification);
      if (dimensions) return dimensions;
    }
    const rows = detail && Array.isArray(detail.bomRows) ? detail.bomRows : [];
    for (const row of rows) {
      if (!row || !(/纸盒/.test(String((row.name || '') + (row.category || '') + (row.specification || '')))
        || productDevelopmentMaterialRowKind(row) === 'box')) continue;
      const dimensions = productDevelopmentReworkLookupObjectDimensions(row, [
        ['length', 'material_length', 'materialLength'],
        ['width', 'material_width', 'materialWidth'],
        ['height', 'material_height', 'materialHeight'],
      ]) || productDevelopmentReworkLookupDimensions(row.specification);
      if (dimensions) return dimensions;
    }
    return null;
  }

  function productDevelopmentSyncReworkOuterDimensions(detail, lookupOverride) {
    if (!detail) return false;
    const lookup = lookupOverride || productDevelopmentReworkLookupState(detail).data;
    if (!lookup) return false;
    const dimensions = productDevelopmentReworkLookupPaperBoxDimensions(detail);
    const keys = ['outerLength', 'outerWidth', 'outerHeight', 'outerVolume'];
    const values = dimensions ? dimensions.concat(Number((dimensions[0] * dimensions[1] * dimensions[2]).toFixed(2))) : keys.map((key) => lookup[key]);
    const referenceLabel = productDevelopmentReferenceLabel(detail);
    const source = dimensions ? 'BOM 纸盒尺寸' : referenceLabel + '编码 API';
    let changed = false;
    keys.forEach((key, index) => {
      const value = values[index];
      if (!productDevelopmentReworkLookupValuePresent(value)) return;
      const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
      if (!definition) return;
      const entry = detail.productDetailLocalValues && detail.productDetailLocalValues[definition.attrId + '@1'];
      if (entry && (!entry.source || /manual|人工/.test(entry.source))) return;
      // Without a box, preserve manual outer dimensions; only undo our own override.
      if (!dimensions && (!entry || entry.source !== 'BOM 纸盒尺寸')) return;
      if (entry && entry.source === source && String(entry.value) === String(value)) return;
      const text = productDevelopmentPrefillText(value, 800);
      productDevelopmentRememberLocalProductField(detail, definition, value, text, source);
      productDevelopmentProductFieldCollections(detail).filter((field) => Number(field && field.attrId) === Number(definition.attrId)).forEach((field) => {
        field.value = productDevelopmentCloneValue(value);
        field.displayValue = text;
        field.status = dimensions ? '已预填（BOM 纸盒）' : '已预填（' + referenceLabel + '编码）';
        field.source = source;
      });
      changed = true;
    });
    if (changed) productDevelopmentMarkProductDetailDirty(detail);
    return changed;
  }

  function productDevelopmentRefreshDerivedDimensions(detail, scope) {
    if (!detail) return;
    const fields = productDevelopmentProductFieldCollections(detail);
    const dimensions = ['outerLength', 'outerWidth', 'outerHeight'].map((key) => {
      const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
      const local = productDevelopmentPrefillLocalAttrValue(detail, definition);
      const field = fields.find((item) => item.key === key || definition && Number(item.attrId) === Number(definition.attrId));
      return productDevelopmentReworkLookupNumber(local !== undefined ? local : field && (field.value === undefined ? field.displayValue : field.value));
    });
    const complete = dimensions.every((value) => value !== null && value > 0);
    const recommendation = complete ? calculateLocalPackRecommendation(dimensions.join('x')) : null;
    const values = {
      outerVolume: complete ? Number((dimensions[0] * dimensions[1] * dimensions[2]).toFixed(2)) : '',
      standardPackingQuantity: complete ? recommendation && recommendation.packCount || 0 : '',
    };
    Object.entries(values).forEach(([key, value]) => {
      const definition = PRODUCT_DEVELOPMENT_PREFILL_PAGE2_FIELDS.find((item) => item.key === key);
      if (!definition) return;
      productDevelopmentRememberLocalProductField(detail, definition, value, String(value), '长宽高实时计算');
      fields.filter((item) => Number(item.attrId) === Number(definition.attrId)).forEach((item) => {
        item.value = value; item.displayValue = String(value); item.source = '长宽高实时计算';
      });
      if (scope && scope.querySelectorAll) scope.querySelectorAll('[data-form-group="prefill"][data-form-key="' + key + '"]').forEach((input) => {
        input.value = String(value);
        const label = input.closest('.pfh-product-development-form-field');
        if (label) label.classList.toggle('is-missing', value === '');
      });
    });
  }

  function productDevelopmentReworkLookupUnitDimensions(detail, lookup) {
    const paperBoxDimensions = productDevelopmentReworkLookupPaperBoxDimensions(detail);
    if (paperBoxDimensions && lookup && lookup.packagingType !== 'bottle') {
      return { dimensions: paperBoxDimensions, source: '纸盒尺寸' };
    }
    return {
      dimensions: lookup && Array.isArray(lookup.outerDimensions) ? lookup.outerDimensions.slice() : null,
      source: productDevelopmentReferenceLabel(detail) + '产品外长宽高',
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
      source: fallback && fallback > 0 ? productDevelopmentReferenceLabel(detail) + '产品原标准装箱数（未取得可计算尺寸）' : '待补充箱规或尺寸',
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

  async function productDevelopmentFetchReworkProductData(code, detail, task) {
    const normalizedCode = productDevelopmentNormalizeReworkProductCode(code);
    const referenceLabel = productDevelopmentReferenceLabel(detail, task);
    if (!normalizedCode) throw new Error('请先填写' + referenceLabel + '产品编码');
    const listPayload = productDevelopmentReworkLookupCheckPayload(
      await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(normalizedCode)),
      referenceLabel + '产品查询',
    );
    const list = productDevelopmentReadonlyList(listPayload);
    const exactProduct = (Array.isArray(list) ? list : []).find((item) => [
      item && item.code,
      item && item.style_code,
      item && item.product_code,
      item && item.jst_old_code,
    ].some((value) => productDevelopmentNormalizeReworkProductCode(value) === normalizedCode));
    const product = exactProduct || (Array.isArray(list) && list.length === 1 ? list[0] : null);
    if (!product) throw new Error('PLM 中没有找到' + referenceLabel + '产品编码“' + normalizedCode + '”');
    const productId = String(productDevelopmentReworkLookupValue(product, ['product_id', 'productId', 'product_main_id', 'productMainId']) || '').trim();
    const productVersionId = String(productDevelopmentReworkLookupValue(product, ['product_version_id', 'productVersionId', 'version_id', 'versionId']) || '').trim();
    const categoryId = String(productDevelopmentReworkLookupValue(product, ['category_id', 'categoryId']) || '').trim();
    if (!/^\d+$/.test(productId) || !/^\d+$/.test(productVersionId) || !/^\d+$/.test(categoryId)) {
      throw new Error(referenceLabel + '产品“' + normalizedCode + '”缺少产品版本或类目 ID');
    }
    const [pricePayload, contentPayload] = await Promise.all([
      fetchPlmJson('/api/Product/GetProductPriceInfo?type=1&product_version_id=' + encodeURIComponent(productVersionId))
        .then((payload) => productDevelopmentReworkLookupCheckPayload(payload, referenceLabel + '采购价查询')),
      fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(productVersionId))
        .then((payload) => productDevelopmentReworkLookupCheckPayload(payload, referenceLabel + '产品详情查询')),
    ]);
    const attrs = productDevelopmentReadonlyAttrs(contentPayload);
    if (!attrs.length) throw new Error(referenceLabel + '产品“' + normalizedCode + '”没有读取到建品详情字段');
    const priceData = productDevelopmentReadonlyPayloadData(pricePayload) || {};
    const priceFromApi = productDevelopmentReworkLookupValue(priceData, ['procurement_price', 'procurementPrice', 'purchase_price', 'purchasePrice']);
    const priceFromProduct = productDevelopmentReworkLookupValue(product, ['procurement_price', 'procurementPrice', 'purchase_price', 'purchasePrice']);
    const procurementPrice = productDevelopmentReworkLookupNumber(priceFromApi) !== null
      ? productDevelopmentReworkLookupNumber(priceFromApi)
      : productDevelopmentReworkLookupNumber(priceFromProduct);
    if (procurementPrice === null) throw new Error(referenceLabel + '产品“' + normalizedCode + '”没有可用采购价');
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
    const referenceProjectId = String(productDevelopmentReworkLookupValue(product, ['project_id', 'projectId']) || '').trim();
    let bomRows = [];
    let bomLookupStatus = 'unavailable';
    if (!productDevelopmentIsSupplement(detail, task) && /^\d+$/.test(referenceProjectId)) {
      try {
        bomRows = await productDevelopmentReadBomRows(referenceProjectId);
        bomLookupStatus = 'ready';
      } catch (_) {
        // Price/field prefilling remains useful if the optional reference BOM is unavailable.
        bomLookupStatus = 'error';
      }
    }
    return {
      code: normalizedCode,
      productCode: productDevelopmentReworkLookupValue(product, ['code', 'style_code', 'product_code']) || normalizedCode,
      productId,
      productVersionId,
      referenceProjectId,
      bomRows,
      bomLookupStatus,
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
