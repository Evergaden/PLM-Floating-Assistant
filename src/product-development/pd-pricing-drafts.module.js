
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
    const match = productDevelopmentMaterialDimensionMatch(text);
    if (!match) return { length: '', width: '', height: '' };
    const sharedUnit = match[6] || match[4] || match[2] || 'cm';
    const dimension = (number, unit) => number ? productDevelopmentMaterialNumberText(Number(number) / (/^(?:mm|毫米)$/i.test(unit || sharedUnit) ? 10 : 1), 6) : '';
    return {
      length: dimension(match[1], match[2]),
      width: dimension(match[3], match[4]),
      height: dimension(match[5], match[6]),
    };
  }

  function productDevelopmentMaterialDimensionMatch(value) {
    return String(value || '').match(/(\d+(?:\.\d+)?|\.\d+)\s*(mm|cm|毫米|厘米)?\s*[x×*]\s*(\d+(?:\.\d+)?|\.\d+)\s*(mm|cm|毫米|厘米)?(?:\s*[x×*]\s*(\d+(?:\.\d+)?|\.\d+)\s*(mm|cm|毫米|厘米)?)?/i);
  }

  function productDevelopmentSyncMaterialDimensions(kind, draft, changedKey, detail) {
    if (!draft || !['box', 'label'].includes(kind)) return;
    const keys = kind === 'box' ? ['length', 'width', 'height'] : ['length', 'width'];
    const specification = String(draft.specification || '');
    if (changedKey === 'specification') {
      const dimensions = productDevelopmentMaterialDimensions(specification);
      const complete = keys.every((key) => dimensions[key]);
      keys.forEach((key) => { draft[key] = complete ? dimensions[key] : ''; });
      return;
    }
    if (!keys.includes(changedKey)) return;
    draft[changedKey] = productDevelopmentMaterialNumberText(draft[changedKey], 6);
    const values = keys.map((key) => productDevelopmentMaterialNumberText(draft[key], 6));
    const dimensionText = values.every(Boolean) ? values.join('x') + 'cm' : '';
    const match = productDevelopmentMaterialDimensionMatch(specification);
    if (match) {
      draft.specification = specification.slice(0, match.index) + dimensionText + specification.slice(match.index + match[0].length);
    } else if (dimensionText) {
      draft.specification = [specification, dimensionText].filter(Boolean).join('，');
    }
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

  function productDevelopmentMaterialReferenceRow(detail, kind) {
    const reference = detail && detail.productDevelopmentReworkLookup && detail.productDevelopmentReworkLookup.data;
    const referenceRows = reference && Array.isArray(reference.bomRows) ? reference.bomRows : [];
    return referenceRows.find((row) => productDevelopmentMaterialRowKind(row) === kind)
      || productDevelopmentMaterialExistingRow(detail, kind);
  }

  function productDevelopmentMaterialReferenceRemark(row) {
    const explicit = productDevelopmentCleanText(row && (row.remark || row.remarks || row.note), 180);
    if (explicit) return explicit;
    const match = String(row && row.name || '').match(/[（(]([^（）()]*)[）)]\s*$/);
    return productDevelopmentCleanText(match && match[1], 180);
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
    if (detail && typeof productDevelopmentPrefillProductFieldValue === 'function' && typeof productDevelopmentProductFieldCollections === 'function') {
      const current = productDevelopmentPrefillProductFieldValue(detail, { key: 'specification', attrId: 119 });
      if (productDevelopmentCleanText(current, 160)) return productDevelopmentCleanText(current, 160);
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
    const shelfLife = productDevelopmentCleanText(draft.shelfLife || (draft.isSupplement !== false ? '食品两年' : ''), 40);
    if (kind === 'instruction') return productDevelopmentCleanText(draft.defaultName || PRODUCT_DEVELOPMENT_MATERIAL_DEFAULTS.instruction.defaultName, 240);
    if (draft.isSupplement === false) {
      const remark = productDevelopmentCleanText(draft.referenceRemark || shelfLife, 180);
      return base + (kind === 'label' ? '标签' : '纸盒') + (remark ? '（' + remark + '）' : '');
    }
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
    const length = productDevelopmentMaterialNumberText(draft.length, 6);
    const width = productDevelopmentMaterialNumberText(draft.width, 6);
    const height = productDevelopmentMaterialNumberText(draft.height, 6);
    const adhesive = productDevelopmentCleanText(draft.adhesive || (draft.isSupplement !== false ? '玻璃加粘' : ''), 60);
    const dimensionText = kind === 'box'
      ? (length && width && height ? length + 'x' + width + 'x' + height + 'cm' : '')
      : (length && width ? length + 'x' + width + 'cm' + (adhesive ? '（' + adhesive + '）' : '') : '');
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
    const isSupplement = productDevelopmentIsSupplement(detail, task);
    const referenceRemark = productDevelopmentMaterialReferenceRemark(productDevelopmentMaterialReferenceRow(detail, kind));
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
    const packSpec = productDevelopmentCleanText(productDevelopmentMaterialPackSpec(detail, kind) || raw.packSpec || defaults.defaultSpecification, 160);
    const hasName = Object.prototype.hasOwnProperty.call(raw, 'materialName');
    const hasSpecification = Object.prototype.hasOwnProperty.call(raw, 'specification');
    const nameSource = String(raw.nameSource || (hasName ? 'manual' : existing && existing.name ? 'plm' : 'generated'));
    const specificationSource = String(raw.specificationSource || (hasSpecification ? 'manual' : 'generated'));
    const hasExplicitEnabled = Object.prototype.hasOwnProperty.call(raw, 'enabled') || Object.prototype.hasOwnProperty.call(raw, 'removed');
    const dimensionValue = (rawKey, existingValue, parsedValue) => {
      if (Object.prototype.hasOwnProperty.call(raw, rawKey)) return raw[rawKey];
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
      isSupplement,
      referenceRemark: productDevelopmentCleanText(isSupplement ? referenceRemark || raw.referenceRemark : referenceRemark.replace(/食品两年/g, '').trim(), 180),
      shelfLife: productDevelopmentCleanText(isSupplement ? raw.shelfLife || defaults.shelfLife : (raw.shelfLife && raw.shelfLife !== '食品两年' ? raw.shelfLife : ''), 40),
      labelShape: productDevelopmentCleanText(isSupplement ? raw.labelShape || defaults.labelShape : (/圆弧/.test(referenceRemark) ? '圆弧' : raw.labelShape && raw.labelShape !== defaults.labelShape ? raw.labelShape : ''), 40),
      adhesive: productDevelopmentCleanText(isSupplement ? raw.adhesive || defaults.adhesive : (/玻璃加粘/.test(referenceRemark) ? '玻璃加粘' : raw.adhesive && raw.adhesive !== defaults.adhesive ? raw.adhesive : ''), 60),
      defaultName: productDevelopmentCleanText(defaults.defaultName, 240),
      length: kind === 'instruction' ? '' : productDevelopmentMaterialNumberText(dimensionValue('length', existing && existing.length, dimensions.length), 6),
      width: kind === 'instruction' ? '' : productDevelopmentMaterialNumberText(dimensionValue('width', existing && existing.width, dimensions.width), 6),
      height: kind === 'box'
        ? productDevelopmentMaterialNumberText(dimensionValue('height', existing && existing.height, dimensions.height), 6)
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
    if (!isSupplement) draft.materialName = String(draft.materialName || '').replace(/食品两年/g, '').replace(/[（(]\s*[）)]/g, '').replace(/\s+([）)])/g, '$1').trim();
    if (!draft.materialName && draft.nameSource !== 'manual') draft.materialName = productDevelopmentMaterialDefaultName(kind, baseName, draft);
    if (!draft.specification && draft.specificationSource !== 'manual') draft.specification = productDevelopmentMaterialDefaultSpecification(kind, draft);
    if (kind !== 'instruction') {
      const specificationDimensions = productDevelopmentMaterialDimensions(draft.specification);
      const dimensionKeys = kind === 'box' ? ['length', 'width', 'height'] : ['length', 'width'];
      if (draft.specificationSource !== 'manual') productDevelopmentSyncMaterialDimensions(kind, draft, 'length', detail);
      else if (dimensionKeys.every((key) => specificationDimensions[key])) productDevelopmentSyncMaterialDimensions(kind, draft, 'specification', detail);
    }
    productDevelopmentSyncMaterialPackSpecification(kind, draft, detail);
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
    if (kind === 'box') productDevelopmentSyncReworkOuterDimensions(detail);
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
    if (draft.specificationSource !== 'manual') {
      if (kind !== 'instruction' && draft.specification) productDevelopmentSyncMaterialDimensions(kind, draft, 'length', detail);
      else draft.specification = productDevelopmentMaterialDefaultSpecification(kind, draft);
    }
    productDevelopmentSyncMaterialPackSpecification(kind, draft, detail);
  }

  function productDevelopmentSyncMaterialPackSpecification(kind, draft, detail) {
    if (!draft || !['box', 'label'].includes(kind)) return;
    const prefix = /^\s*\d+(?:\.\d+)?\s*(?:ml|kg|g|l|粒|片|个|袋|支|capsules?|tablets?|gummies|pcs?)\s*\/\s*[^\s，,;；]+/i;
    const current = String(productDevelopmentMaterialPackSpec(detail, kind) || '').match(prefix);
    if (!current) return;
    const packSpec = current[0].trim();
    draft.packSpec = packSpec;
    const body = String(draft.specification || '').replace(prefix, '').replace(/^[\s，,;；]+/, '');
    draft.specification = [packSpec, body].filter(Boolean).join('，');
  }

  function productDevelopmentMaterialDraftIssues(kind, draft) {
    const errors = {};
    if (!productDevelopmentCleanText(draft && draft.materialName, 240)) errors.materialName = '请填写物料名称';
    const specification = String(draft && draft.specification || '').trim();
    if (!specification) errors.specification = '请补全规格型号';
    if (kind !== 'instruction') {
      if (!/^\d+(?:\.\d+)?\s*(?:ml|kg|g|l|粒|片|个|袋|支|capsules?|tablets?|gummies|pcs?)\s*\//i.test(specification)) errors.specification = '规格需以当前产品规格开头，如 80ml/盒';
      if (draft && draft.packSpec && !specification.startsWith(draft.packSpec + '，')) errors.specification = '请补全当前产品规格及物料尺寸';
      const parsed = productDevelopmentMaterialDimensions(specification);
      ['length', 'width'].concat(kind === 'box' ? ['height'] : []).forEach((field) => {
        if (productDevelopmentMaterialNumber(draft && draft[field]) === null) errors[field] = '请填写大于 0 的尺寸';
        if (!parsed[field] || Number(parsed[field]) !== Number(draft && draft[field])) errors.specification = '规格中的尺寸需完整并与长宽高一致';
      });
    }
    if (productDevelopmentMaterialNumber(draft && draft.price) === null) errors.price = '请补全尺寸以计算采购价';
    return errors;
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
    else if (productDevelopmentMaterialDraftIssues(kind, draft).specification) missing.push(title + '规格型号不符合规则');
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
    const sku = String(detail && detail.sku || task && task.sku || '').trim().toUpperCase();
    const existing = (Array.isArray(rows) ? rows : []).find((row) => row && (Number(row.typeValue) === 1 || row.type === '成品') && String(row.code || '').trim().toUpperCase() === sku && row.productMainId);
    if (existing && existing.productMainId) return String(existing.productMainId);
    const direct = detail && (detail.productMainId || detail.product_main_id)
      || task && (task.productMainId || task.product_main_id)
      || state.data && (state.data.productMainId || state.data.product_main_id);
    const foreignProduct = (Array.isArray(rows) ? rows : []).some((row) => row && (Number(row.typeValue) === 1 || row.type === '成品') && String(row.code || '').trim().toUpperCase() !== sku);
    if (direct && !foreignProduct && productDevelopmentIsSupplement(detail, task)) return String(direct);
    if (!sku) return '';
    const payload = await fetchPlmJson('/api/ProjectFormData/GetProductList?type=1&codes_precise=' + encodeURIComponent(sku));
    const list = productDevelopmentApiList(payload);
    const product = list.find((item) => String(item && (item.code || item.product_code || '')).trim().toUpperCase() === sku);
    return String(product && (product.id || product.product_main_id || product.productMainId) || '').trim();
  }

  async function productDevelopmentReadBomRows(projectId) {
    const paths = [
      '/api/ChemicalNewAll/GetProjectPMJoinList?id=' + encodeURIComponent(projectId),
      '/api/ChemicalNewDevTask/GetProjectPMJoinList?id=' + encodeURIComponent(projectId),
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

  function productDevelopmentReferencePackagingRows(detail, task) {
    if (productDevelopmentIsSupplement(detail, task)) return [];
    const reference = productDevelopmentReworkLookupState(detail).data;
    const rows = reference && Array.isArray(reference.bomRows) ? reference.bomRows : [];
    const seen = new Set();
    return rows.filter((row) => {
      if (!row || Number(row.typeValue) === 1 || row.type === '成品' || productDevelopmentMaterialRowKind(row)) return false;
      const code = String(row.code || '').trim();
      if (!code || seen.has(code.toUpperCase()) || !/^2-/i.test(code) && !/包材|瓶|罐|盖|软管|包装容器/.test([row.category, row.name].join(' '))) return false;
      seen.add(code.toUpperCase());
      return true;
    });
  }

  function productDevelopmentReadyBomDrafts(detail) {
    const skipped = [];
    const drafts = ['box', 'label', 'instruction'].map((kind) => [kind, detail.materialDrafts[kind]])
      .filter(([, draft]) => draft && draft.enabled !== false).filter(([kind, draft]) => {
        const missing = productDevelopmentMaterialDraftMissingFields(kind, draft);
        if (missing.length) skipped.push((kind === 'box' ? '纸盒' : kind === 'label' ? '标签' : '说明书') + '（缺少：' + missing.join('、') + '）');
        return !missing.length;
      });
    return { drafts, skipped };
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
    const { drafts, skipped } = productDevelopmentReadyBomDrafts(detail);
    const referenceCode = getProductDevelopmentTaskMeta(task, detail).reworkProductCode;
    const packagingRows = productDevelopmentReferencePackagingRows(detail, task).filter((row) => {
      const ready = /^\d+$/.test(String(row.materialId || '')) && row.materialType !== '' && row.materialType !== null && row.materialType !== undefined;
      if (!ready) skipped.push('对标包材 ' + row.code + '（缺少物料 ID 或类型）');
      return ready;
    });
    if (!productDevelopmentIsSupplement(detail, task) && referenceCode && !packagingRows.length) skipped.push('对标包材（尚未读取到完整资料）');
    if (!drafts.length && !packagingRows.length) {
      detail.bomPlmSaveMessage = '没有可保存的完整物料；已跳过：' + skipped.join('、');
      return { skipped, rows: detail.bomRows || [] };
    }
    let rows = Array.isArray(detail.bomRows) ? detail.bomRows.slice() : [];
    const productMainId = await productDevelopmentResolveProductMainId(task, detail, rows);
    if (!productMainId) {
      throw new Error('未找到当前 SKU 的已建品主产品，无法绑定 BOM');
    }
    const hasProduct = rows.some((row) => (Number(row && row.typeValue) === 1 || row && row.type === '成品') && String(row.code || '').toUpperCase() === normalizedSku);
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
    const missingMaterialIds = Array.from(new Set(drafts
      .map(([, draft]) => String(draft.materialId || '').trim()).concat(packagingRows.map((row) => String(row.materialId || '').trim()))))
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
    const batchMaterials = rows.map((row) => {
      const packaging = packagingRows.find((item) => String(item.materialId) === String(row.materialId));
      return productDevelopmentMaterialBatchPayload(packaging ? { ...row, typeValue: 2, type: '物料', materialType: packaging.materialType } : row);
    }).filter(Boolean);
    const savedDraftJoinIds = drafts.map(([, draft]) => String(draft.joinId || '').trim()).filter(Boolean);
    const productBinding = batchMaterials.find((item) => Number(item.type) === 1 && String(item.code).toUpperCase() === normalizedSku);
    if (!productBinding) throw new Error('未读取到成品绑定行，物料未提交，请刷新 BOM 后重试');
    if (packagingRows.some((row) => !batchMaterials.some((item) => Number(item.type) === 2 && String(item.material_id) === String(row.materialId)))) throw new Error('对标包材未出现在当前 BOM 中，请刷新后重试');
    if (savedDraftJoinIds.some((joinId) => !batchMaterials.some((item) => String(item.id) === joinId))) throw new Error('PLM 已保存物料，但未读取到对应 BOM 绑定行，请刷新后重试');
    const syncPayload = await fetchPlmApiJson('/api/ChemicalNewBom/MaterialBatchSaveAndSyncToProduct', {
      project_id: productDevelopmentApiNumber(projectId, projectId),
      materials: batchMaterials,
      effect_picture_files: [],
    });
    const pricing = rows.map(productDevelopmentBomPricingPayload).filter(Boolean);
    if (pricing.length) await fetchPlmApiJson('/api/ChemicalNewBom/SaveBomPricing', pricing);
    detail.bomRows = rows;
    detail.bomDraftDirty = skipped.length > 0;
    detail.bomDraftSavedAt = new Date().toLocaleString();
    detail.bomDraftSaveState = 'saved';
    detail.bomDraftSaveMessage = '已同步 PLM · ' + detail.bomDraftSavedAt;
    const syncMessage = syncPayload && typeof syncPayload.data === 'string' ? syncPayload.data : '';
    detail.bomPlmSaveMessage = syncMessage && /未建品|无法同步图片/.test(syncMessage)
      ? 'BOM 已保存到 PLM；项目未建品，图片同步已跳过'
      : 'BOM 已保存到 PLM';
    detail.bomPlmSaveState = 'saved';
    if (skipped.length) detail.bomPlmSaveMessage += '；已跳过：' + skipped.join('、');
    detail.cacheSource = 'local-cache';
    saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    return { warning: syncMessage, rows, skipped };
  }

  function productDevelopmentSaveBomLocally(sku, scope) {
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
    detail.bomDraftSaveMessage = 'BOM 已自动保存到本地';
    detail.bomPlmSaveState = '';
    detail.cacheSource = 'local-cache';
    clearProductDevelopmentReadonlyDetailCacheWriteTimer(normalizedSku);
    saveProductDevelopmentReadonlyDetailCache(normalizedSku, detail);
    const status = scope && scope.querySelector('.pfh-product-development-material-save-status');
    if (status) { status.textContent = detail.bomDraftSaveMessage; status.classList.remove('is-dirty', 'is-error'); status.classList.add('is-saved'); }
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
    productDevelopmentSyncCostTierPrices(detail);
    productDevelopmentSyncProcurementPrice(detail);
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
      procurement_price: productDevelopmentPrefillProductFieldValue(detail, { key: 'procurementPrice', attrId: 152 }) || null,
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
    const unitPrice = productDevelopmentProcurementFieldValue(detail, 'materialPrice');
    if (unitPrice !== '' && Number.isFinite(Number(unitPrice)) && Array.isArray(product.product_procure_infos) && product.product_procure_infos[0]) product.product_procure_infos[0].material_price = Number(unitPrice);
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
