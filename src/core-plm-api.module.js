
  function getProjectIdForMaterialApi(data) {
    const candidates = [data && data.projectRowId, data && data.projectId];
    const rowIdFromPage = data && data.sku ? findProjectRowIdBySku(data.sku) : '';
    const id = candidates.concat(rowIdFromPage).map((value) => String(value || '').trim()).find((value) => /^\d+$/.test(value));
    return id || '';
  }

  function getApiMaterialItems(payload) {
    const data = payload && (payload.data || payload.response && payload.response.data);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.pms)) return data.pms;
    if (data && data.data && Array.isArray(data.data.pms)) return data.data.pms;
    if (payload && Array.isArray(payload.pms)) return payload.pms;
    if (data && Array.isArray(data.list)) return data.list;
    return [];
  }

  function hasApiMaterialItemsPayload(payload) {
    const data = payload && (payload.data || payload.response && payload.response.data);
    return Boolean(
      Array.isArray(data)
      || data && Array.isArray(data.pms)
      || data && data.data && Array.isArray(data.data.pms)
      || payload && Array.isArray(payload.pms)
      || data && Array.isArray(data.list)
    );
  }

  function getApiFieldState(value, resolved) {
    if (!resolved) return '';
    if (Array.isArray(value)) return value.length ? 'value' : 'empty';
    return value !== undefined && value !== null && String(value).trim() && String(value).trim() !== '--' ? 'value' : 'empty';
  }

  function normalizeApiFieldStates(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.keys(value).reduce((result, key) => {
      if (value[key] === 'value' || value[key] === 'empty') result[key] = value[key];
      return result;
    }, {});
  }

  function mergeApiFieldStates() {
    return Array.from(arguments).reduce((result, value) => ({ ...result, ...normalizeApiFieldStates(value) }), {});
  }

  function isApiFieldResolved(data, key) {
    const state = data && data.apiFieldStates && data.apiFieldStates[key];
    return state === 'value' || state === 'empty';
  }

  function getApiListItems(payload) {
    const data = payload && payload.data !== undefined ? payload.data : payload && payload.response && payload.response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.list)) return data.list;
    if (data && Array.isArray(data.rows)) return data.rows;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && data.data && Array.isArray(data.data.list)) return data.data.list;
    if (payload && Array.isArray(payload.list)) return payload.list;
    if (payload && Array.isArray(payload.rows)) return payload.rows;
    return [];
  }

  function getApiProductListItems(payload) {
    const items = getApiListItems(payload);
    return items.length ? items : getApiMaterialItems(payload);
  }

  function getApiDetailAttributes(payload) {
    const root = payload && payload.data !== undefined ? payload.data : payload && payload.response && payload.response.data;
    const groups = Array.isArray(root)
      ? root
      : (root && Array.isArray(root.data) ? root.data
        : (root && root.data && Array.isArray(root.data.list) ? root.data.list
          : (root && Array.isArray(root.list) ? root.list : [])));
    const attrs = [];
    const addGroup = (group) => {
      if (!group || typeof group !== 'object') return;
      const candidates = [group.category_template_attrs, group.categoryTemplateAttrs, group.attrs];
      candidates.forEach((value) => {
        if (Array.isArray(value)) value.forEach((attr) => { if (attr && typeof attr === 'object') attrs.push(attr); });
      });
    };
    groups.forEach(addGroup);
    if (root && !Array.isArray(root)) addGroup(root);
    if (root && root.data && typeof root.data === 'object' && !Array.isArray(root.data)) addGroup(root.data);
    return attrs;
  }

  function getApiProjectDetailAttributes(payload) {
    const root = getApiPayloadDataObject(payload);
    const attrs = [];
    const visited = new Set();
    const addGroup = (group) => {
      if (!group || typeof group !== 'object') return;
      [group.category_template_attrs, group.categoryTemplateAttrs, group.attrs].forEach((value) => {
        if (Array.isArray(value)) value.forEach((attr) => {
          if (attr && typeof attr === 'object' && !attrs.includes(attr)) attrs.push(attr);
        });
      });
    };
    const visit = (value, depth) => {
      if (!value || depth > 4) return;
      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, depth + 1));
        return;
      }
      if (typeof value !== 'object' || visited.has(value)) return;
      visited.add(value);
      addGroup(value);
      ['design', 'dev', 'project', 'product', 'data'].forEach((key) => visit(value[key], depth + 1));
    };
    visit(root, 0);
    return attrs;
  }

  function getApiAttributeLanguages(attr) {
    if (!attr || typeof attr !== 'object') return [];
    if (Array.isArray(attr.attr_language_config_json)) return attr.attr_language_config_json;
    if (Array.isArray(attr.language_config)) return attr.language_config;
    if (Object.prototype.hasOwnProperty.call(attr, 'value')) return [{ language_id: attr.language_id || 1, value: attr.value }];
    return [];
  }

  function getApiAttributeValue(attr, languageId) {
    const languages = getApiAttributeLanguages(attr);
    const preferred = languages.find((item) => Number(item && item.language_id) === Number(languageId) && item.value !== undefined && item.value !== null)
      || languages.find((item) => item && item.value !== undefined && item.value !== null);
    return preferred ? preferred.value : '';
  }

  function getApiPreservedScalarText(value, depth) {
    if (value === null || value === undefined || depth > 4) return '';
    if (typeof value === 'string') return value.replace(/\r\n?/g, '\n').trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map((item) => getApiPreservedScalarText(item, (depth || 0) + 1)).filter(Boolean).join('\n');
    if (typeof value !== 'object') return '';
    for (const key of ['text', 'content', 'value', 'label', 'name', 'url', 'file_url', 'download_url', 'oss_url', 'path', 'file_path', 'file_save_full_path']) {
      if (value[key] === undefined || value[key] === null) continue;
      const text = getApiPreservedScalarText(value[key], (depth || 0) + 1);
      if (text) return text;
    }
    return '';
  }

  function getApiAttributePreservedTextState(attrs, pattern, languageId) {
    const candidates = (Array.isArray(attrs) ? attrs : []).map((attr, index) => {
      const label = getApiAttributeLabel(attr);
      return pattern.test(label) ? { attr, index } : null;
    }).filter(Boolean).sort((a, b) => a.index - b.index);
    let found = false;
    for (const candidate of candidates) {
      found = true;
      const value = getApiPreservedScalarText(getApiAttributeValue(candidate.attr, languageId || 1), 0);
      if (value) return { value, found: true };
    }
    return { value: '', found };
  }

  function collectApiAssetUrls(value, urls, depth) {
    if (value === null || value === undefined || depth > 4) return;
    if (typeof value === 'string') {
      const url = normalizeApiAssetUrl(value);
      if (url && !urls.includes(url)) urls.push(url);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => collectApiAssetUrls(item, urls, (depth || 0) + 1));
      return;
    }
    if (typeof value !== 'object') return;
    ['url', 'src', 'pic', 'image', 'file_url', 'download_url', 'oss_url', 'path', 'file_path', 'file_save_full_path', 'value'].forEach((key) => {
      if (value[key] !== undefined && value[key] !== null) collectApiAssetUrls(value[key], urls, (depth || 0) + 1);
    });
  }

  function extractApiInfringementData(payload) {
    const root = getApiPayloadDataObject(payload);
    const project = root && root.project && typeof root.project === 'object' ? root.project : root;
    const attrs = getApiDetailAttributes(payload).concat(getApiProjectDetailAttributes(payload));
    const copywritingState = getApiAttributePreservedTextState(attrs, /产品文案修改|product[\s_-]*copywriting[\s_-]*modify/i, 1);
    const frontProductCopyAttr = attrs.find((attr) => /产品正面文案|front[\s_-]*product[\s_-]*copy/i.test(getApiAttributeLabel(attr)));
    const frontProductCopyProjectKeys = ['front_product_copy', 'frontProductCopy', 'product_front_copy', 'productFrontCopy'];
    const hasFrontProductCopyProjectField = Boolean(project && frontProductCopyProjectKeys.some((key) => Object.prototype.hasOwnProperty.call(project, key)));
    const imageUrls = [];
    [
      getApiAttributeValue(frontProductCopyAttr, 1),
      ...frontProductCopyProjectKeys.map((key) => project && project[key]),
    ].forEach((value) => collectApiAssetUrls(value, imageUrls, 0));
    const imageFieldFound = Boolean(frontProductCopyAttr || hasFrontProductCopyProjectField);
    return {
      infringementImageUrls: imageUrls.slice(0, 20),
      infringementImageUrl: imageUrls[0] || '',
      infringementImageSource: imageFieldFound ? 'frontProductCopy' : '',
      infringementCopywriting: copywritingState.value,
      apiFieldStates: {
        infringementImage: imageFieldFound ? (imageUrls.length ? 'value' : 'empty') : '',
        infringementCopywriting: copywritingState.found ? (copywritingState.value ? 'value' : 'empty') : '',
      },
    };
  }

  function getApiScalarText(value, depth) {
    if (value === null || value === undefined || depth > 4) return '';
    if (typeof value === 'string' || typeof value === 'number') return compactText(value);
    if (Array.isArray(value)) return value.map((item) => getApiScalarText(item, (depth || 0) + 1)).filter(Boolean).join('；');
    if (typeof value !== 'object') return '';
    for (const key of ['text', 'label', 'name', 'value', 'product_name', 'url', 'file_url', 'download_url', 'oss_url', 'path', 'file_path', 'file_save_full_path']) {
      if (value[key] !== undefined && value[key] !== null) {
        const text = getApiScalarText(value[key], (depth || 0) + 1);
        if (text) return text;
      }
    }
    return '';
  }

  function getApiAttributeLabel(attr) {
    if (!attr) return '';
    const archive = attr.archive_type_attr_data || attr.archiveTypeAttrData || {};
    return [attr.variable_name, attr.attr_name, attr.name, attr.title, attr.display_name, archive.name]
      .map((value) => compactText(value)).filter(Boolean).join(' ');
  }

  function getApiAttributeText(attrs, pattern, languageId) {
    const candidates = (Array.isArray(attrs) ? attrs : []).map((attr, index) => {
      const label = getApiAttributeLabel(attr);
      const match = label.match(pattern);
      return match ? { attr, index, score: match[0].length + (String(attr.variable_name || '').toLowerCase().includes('product_name') ? 20 : 0) } : null;
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index);
    for (const candidate of candidates) {
      const value = getApiScalarText(getApiAttributeValue(candidate.attr, languageId || 1), 0);
      if (value && !/^\d+(?:[.,;]\d+)*$/.test(value)) return value;
    }
    return '';
  }

  function getApiObjectFieldValue(objects, keys) {
    const objectList = Array.isArray(objects) ? objects : (objects && typeof objects === 'object' ? [objects] : []);
    const keyList = Array.isArray(keys) ? keys : (keys ? [keys] : []);
    for (const object of objectList) {
      if (!object || typeof object !== 'object') continue;
      for (const key of keyList) {
        if (object[key] === undefined || object[key] === null || object[key] === '') continue;
        const value = getApiScalarText(object[key], 0);
        if (value) return value;
      }
    }
    return '';
  }

  function getApiAttributeRawValue(attrs, field) {
    const variableName = String(field && field.variableName || '').trim().toLowerCase();
    const labelPattern = field && field.labelPattern;
    const attr = (Array.isArray(attrs) ? attrs : []).find((item) => {
      const variable = String(item && item.variable_name || '').trim().toLowerCase();
      if (variableName && variable === variableName) return true;
      return Boolean(labelPattern && labelPattern.test(getApiAttributeLabel(item)));
    });
    return attr ? getApiScalarText(getApiAttributeValue(attr, 1), 0) : '';
  }

  function normalizeApiDimensionNumber(value, unit) {
    const text = compactText(value);
    if (!text || text === '--') return NaN;
    const number = Number(text) || firstNumber(text);
    if (!Number.isFinite(number) || number <= 0) return NaN;
    const unitText = String(unit || '') + ' ' + text;
    return /mm|毫米/i.test(unitText) ? number / 10 : number;
  }

  function getApiProductDimensionNums(objects, attrs, fields) {
    const nums = (fields || []).map((field) => {
      const objectValue = getApiObjectFieldValue(objects, [field.valueKey]);
      const objectUnit = getApiObjectFieldValue(objects, [field.unitKey]);
      const raw = objectValue || getApiAttributeRawValue(attrs, field);
      return normalizeApiDimensionNumber(raw, objectUnit);
    });
    return nums.length && nums.every((value) => Number.isFinite(value) && value > 0) ? nums : null;
  }

  function formatApiDimensionText(nums) {
    return Array.isArray(nums) && nums.length >= 3
      ? nums.slice(0, 3).map((value) => trimNumber(Number(value))).join('x') + 'cm'
      : '';
  }

  function isApiSingleBottleProduct(product, data, packaging) {
    if (!product || !Array.isArray(product.outerPackageNums) || product.outerPackageNums.length < 3) return false;
    if (data && data.singleBottle) return true;
    const packagingText = [
      packaging && packaging.packageSizeLabel,
      packaging && packaging.packageSizeText,
      packaging && packaging.apiMaterialSource,
    ].filter(Boolean).join(' ');
    const specificationText = compactText(product.specificationText);
    const text = [
      specificationText,
      product.chineseName,
      product.englishName,
      product.productType,
      product.plmCategory,
      data && data.name,
      data && data.productType,
      data && data.plmCategory,
    ].filter(Boolean).join(' ');
    if (isToyDimensionProduct({ ...(data || {}), productType: product.productType || data && data.productType, plmCategory: product.plmCategory || data && data.plmCategory })) return false;
    if (/\/\s*瓶(?:\s|$|[,，;；])/i.test(specificationText)) return true;
    if (isPaperBoxMaterialText(packagingText) || /纸盒/.test(packagingText)) return false;
    if (/(?:盒装|套装|\/\s*盒|箱装|纸盒)/i.test(text)) return false;
    return /(?:单瓶|单罐|瓶装|罐装|\/\s*(?:瓶|罐)|(?:bottle|jar)s?\b)/i.test(text);
  }

  function getApiObjectAssetUrl(objects, keys) {
    const objectList = Array.isArray(objects) ? objects : (objects && typeof objects === 'object' ? [objects] : []);
    const keyList = Array.isArray(keys) ? keys : (keys ? [keys] : []);
    for (const object of objectList) {
      if (!object || typeof object !== 'object') continue;
      for (const key of keyList) {
        const url = getApiAssetUrl(object[key], 0);
        if (url) return url;
      }
    }
    return '';
  }

  function getApiPayloadDataObject(payload) {
    const data = payload && payload.data !== undefined ? payload.data : payload && payload.response && payload.response.data;
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  function getApiProductLanguageName(product, languageId) {
    const configs = product && (product.language_config || product.languageConfig);
    if (!Array.isArray(configs)) return '';
    const item = configs.find((entry) => Number(entry && entry.language_id) === Number(languageId))
      || configs.find((entry) => entry && entry.product_name);
    return compactText(item && (item.product_name || item.name || item.value));
  }

  function getApiLanguageConfigName(object, languageId) {
    const configs = object && (object.language_config || object.languageConfig);
    if (!Array.isArray(configs)) return '';
    const item = configs.find((entry) => Number(entry && entry.language_id) === Number(languageId))
      || configs.find((entry) => entry && entry.product_name);
    return compactText(item && (item.product_name || item.name || item.value));
  }

  function getApiEnglishProductName(values, brand) {
    const valueList = Array.isArray(values) ? values : (values ? [values] : []);
    for (const value of valueList) {
      const text = cleanEnglishProductName(value, brand);
      if (text && /[A-Za-z]/.test(text) && !/[\u3400-\u9fff]/.test(text)) return text;
    }
    return '';
  }

  function normalizeApiAssetUrl(value) {
    const text = compactText(value).replace(/&amp;/g, '&').replace(/\\\//g, '/');
    if (!text || /^(?:data:|javascript:)/i.test(text)) return '';
    if (/^https?:\/\//i.test(text)) return stripOssResizeParams(text);
    if (/^\/\//.test(text)) return stripOssResizeParams(location.protocol + text);
    if (/^(?:\/|[a-z0-9_-]+\/)/i.test(text) && !/^(?:filePic|assets)\//i.test(text)) return buildApiArchiveFileUrl(text);
    return '';
  }

  function getApiAssetUrl(value, depth) {
    if (value === null || value === undefined || depth > 4) return '';
    if (typeof value === 'string') return normalizeApiAssetUrl(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const url = getApiAssetUrl(item, (depth || 0) + 1);
        if (url) return url;
      }
      return '';
    }
    if (typeof value !== 'object') return '';
    for (const key of ['url', 'src', 'pic', 'image', 'file_url', 'download_url', 'oss_url', 'path', 'file_path', 'file_save_full_path', 'value']) {
      const url = getApiAssetUrl(value[key], (depth || 0) + 1);
      if (url) return url;
    }
    return '';
  }

  function getApiAttributeFileIds(attrs, pattern) {
    const ids = [];
    (Array.isArray(attrs) ? attrs : []).forEach((attr) => {
      if (!pattern.test(getApiAttributeLabel(attr))) return;
      getApiAttributeLanguages(attr).forEach((language) => collectApiCopywritingFileIds(language && language.value, ids));
      if (attr && attr.value !== undefined) collectApiCopywritingFileIds(attr.value, ids);
    });
    return ids.filter((id, index, list) => list.indexOf(id) === index);
  }

  async function fetchApiArchiveFileRecordsByIds(ids) {
    const normalizedIds = Array.from(new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));
    if (!normalizedIds.length) return [];
    let lastError = null;
    for (const endpoint of ['/api/ProjectFormData/GetArchiveFileVersionListByFileVersionId', '/api/Product/GetArchiveFileVersionListByFileVersionId']) {
      try {
        const payload = await fetchPlmApiJson(endpoint, { ids: normalizedIds });
        const records = getApiArchiveFileRecords(payload);
        if (records.length || endpoint.indexOf('/Product/') >= 0) return records;
      } catch (error) {
        lastError = error;
        if (/\b401\b|\b403\b/.test(formatErrorMessage(error))) throw error;
      }
    }
    if (lastError) throw lastError;
    return [];
  }

  function buildApiArchiveFileInfo(record) {
    const fileName = compactText(record && (record.file_name || record.file_original_name || record.original_file_name));
    const filePath = compactText(record && (record.file_path || record.file_save_full_path || record.oss_path || record.file_url || record.url));
    const fileId = String(record && (record.archive_file_version_id || record.file_version_id || record.id) || '');
    return {
      fileName,
      filePath,
      fileId,
      fileFormat: compactText(record && (record.file_format || record.format)),
      createdAt: compactText(record && (record.create_at || record.created_at || record.updated_at)),
      url: buildApiArchiveFileUrl(filePath),
    };
  }

  function getApiProductArchiveImageIds(attrs) {
    return getApiAttributeFileIds(attrs, /sku[_\s-]*pic|main[_\s-]*image|picture|产品图|主图/i);
  }

  function extractApiProductSnapshot(product, infoPayload, contentPayload) {
    const info = getApiPayloadDataObject(infoPayload);
    const attrs = getApiDetailAttributes(contentPayload).concat(getApiDetailAttributes(infoPayload));
    const infringement = extractApiInfringementData(contentPayload);
    const objects = [product, info];
    const configs = product && (product.language_config || product.languageConfig);
    const outerDimensionFields = [
      { valueKey: 'long_outer_packaging', unitKey: 'long_outer_packaging_unit_name', variableName: 'long_outer_packaging', labelPattern: /长.*外包装/ },
      { valueKey: 'wide_outer_packaging', unitKey: 'wide_outer_packaging_unit_name', variableName: 'wide_outer_packaging', labelPattern: /宽.*外包装/ },
      { valueKey: 'high_outer_packaging', unitKey: 'high_outer_packaging_unit_name', variableName: 'high_outer_packaging', labelPattern: /高.*外包装/ },
    ];
    const innerDimensionFields = [
      { valueKey: 'long_inner_packing_materials', unitKey: 'long_inner_packing_materials_unit_name', variableName: 'long_inner_packing_materials', labelPattern: /长.*(?:内包材|内包装|产品)/ },
      { valueKey: 'wide_inner_packing_materials', unitKey: 'wide_inner_packing_materials_unit_name', variableName: 'wide_inner_packing_materials', labelPattern: /宽.*(?:内包材|内包装|产品)/ },
      { valueKey: 'high_inner_packing_materials', unitKey: 'high_inner_packing_materials_unit_name', variableName: 'high_inner_packing_materials', labelPattern: /高.*(?:内包材|内包装|产品)/ },
    ];
    const outerPackageNums = getApiProductDimensionNums(objects, attrs, outerDimensionFields);
    const innerPackageNums = getApiProductDimensionNums(objects, attrs, innerDimensionFields);
    const productCategory = getApiObjectFieldValue(objects, ['category_name', 'categoryName', 'product_category_name', 'productCategoryName'])
      || getApiAttributeText(attrs, /category|类目|品类/i, 1);
    const isToyProduct = isToyDimensionProduct({ plmCategory: productCategory, productType: productCategory });
    const brandValue = getApiObjectFieldValue(objects, ['brand_name', 'brandName', 'brand', 'brand_name_cn'])
      || getApiScalarText(product && product.brand, 0);
    const normalizedBrandValue = normalizeSkuBrandValue(brandValue, { plmCategory: productCategory, productType: productCategory });
    const chineseName = getApiObjectFieldValue(objects, ['product_name', 'productName', 'name', 'name_cn', 'product_name_cn'])
      || getApiProductLanguageName(product, 1)
      || getApiLanguageConfigName(info, 1)
      || getApiAttributeText(attrs, /product[_\s-]*name|商品名称|产品名称|中文品名/i, 1);
    const englishName = getApiEnglishProductName([
      getApiObjectFieldValue(objects, ['product_name_en', 'productNameEn', 'english_name', 'name_en', 'productNameEnglish']),
      getApiProductLanguageName(product, 2),
      getApiLanguageConfigName(info, 2),
      getApiAttributeText(attrs, /product[_\s-]*name|product name|英文品名|英文名称/i, 2),
    ], normalizedBrandValue);
    const specificationText = getApiObjectFieldValue(objects, [
      'specification_model', 'specificationModelName', 'specificationModel', 'spec_model',
      'specification', 'specification_text', 'specificationText', 'product_specification', 'productSpecification',
    ]) || getApiAttributeText(attrs, /specification[_\s-]*(?:model|name)?|规格型号|规格|型号/i, 1);
    const specificationNetContent = normalizeNetContentValue(specificationText);
    const rawProductSizeText = getApiObjectFieldValue(objects, ['product_size', 'productSize', 'product_size_text', 'size_text'])
      || getApiAttributeText(attrs, /product[_\s-]*size|产品尺寸|成品尺寸/i, 1);
    const parsedProductNums = parseDimension(rawProductSizeText, 3);
    const productNums = isToyProduct
      ? innerPackageNums
      : (innerPackageNums || parsedProductNums);
    const productSizeText = isToyProduct ? formatApiDimensionText(productNums) : rawProductSizeText;
    const directImage = getApiObjectAssetUrl(objects, ['sku_image_url', 'skuImageUrl', 'product_image_url', 'productImageUrl', 'pic', 'image', 'picture'])
      || getApiObjectFieldValue(objects, ['sku_image_url', 'skuImageUrl', 'product_image_url', 'productImageUrl', 'pic', 'image', 'picture'])
      || getApiAssetUrl(getApiAttributeValue((attrs || []).find((attr) => /sku[_\s-]*pic|main[_\s-]*image|picture|产品图|主图/i.test(getApiAttributeLabel(attr))), 1), 0);
    const referenceUrl = [
      getApiObjectFieldValue(objects, ['benchmark_link', 'benchmarkLink', 'benchmark_url', 'benchmarkUrl', 'reference_url', 'referenceUrl', 'alibaba_link', 'alibabaLink']),
      getApiAttributeText(attrs, /benchmark|reference|对标链接|参考链接|1688|阿里链接/i, 1),
    ].map((value) => String(value || '').match(/https?:\/\/[^\s]+/i)?.[0] || '').find(Boolean) || '';
    const packQty = getApiObjectFieldValue(objects, ['pack_qty', 'packQty', 'pack_count', 'packCount', 'carton_qty', 'cartonQty'])
      || getApiAttributeText(attrs, /pack[_\s-]*qty|pack[_\s-]*count|装箱数|装箱数量/i, 1);
    const purchasePrice = getApiObjectFieldValue(objects, ['purchase_price', 'purchasePrice', 'procurement_price', 'procurementPrice'])
      || getApiAttributeText(attrs, /purchase[_\s-]*price|procurement[_\s-]*price|采购价|采购价格/i, 1);
    const optional = {
      cartonSpec: getApiObjectFieldValue(objects, ['carton_spec', 'cartonSpec', 'outer_carton_spec', 'outerCartonSpec', 'carton_size', 'cartonSize'])
        || getApiAttributeText(attrs, /carton[_\s-]*(?:spec|size)|外箱规格|外箱尺寸/i, 1),
      packageMaterial: getApiObjectFieldValue(objects, ['package_material', 'packageMaterial', 'packaging_material', 'packagingMaterial'])
        || getApiAttributeText(attrs, /package[_\s-]*material|packaging[_\s-]*material|包装材质|包装材料/i, 1),
      leadTimeText: getApiObjectFieldValue(objects, ['lead_time', 'leadTime', 'delivery_text', 'deliveryText', 'delivery_note', 'deliveryNote'])
        || getApiAttributeText(attrs, /lead[_\s-]*time|delivery[_\s-]*(?:text|note)|交期|交货期/i, 1),
      alibabaLink: getApiObjectFieldValue(objects, ['alibaba_link', 'alibabaLink', '1688_link', '1688Link', 'alibaba_url', 'alibabaUrl'])
        || getApiAttributeText(attrs, /alibaba|1688|阿里链接/i, 1),
    };
    const productDetailResolved = Boolean(infoPayload || contentPayload);
    return {
      product,
      info,
      attrs,
      chineseName: normalizeProductNameValue(cleanExcelFieldValue(chineseName)),
      englishName,
      brand: normalizedBrandValue,
      productType: productCategory || getApiObjectFieldValue(objects, ['product_type_name', 'productTypeName', 'product_type', 'productType']),
      plmCategory: productCategory,
      specificationText,
      netContent: specificationNetContent,
      packageNums: outerPackageNums,
      outerPackageNums,
      outerPackageSizeText: formatApiDimensionText(outerPackageNums),
      innerPackageNums,
      productNums: productNums && productNums.length >= 3 ? productNums.slice(0, 3) : null,
      productSizeText: cleanExcelFieldValue(productSizeText),
      referenceUrl,
      packQty: normalizePackQty(packQty),
      purchasePrice: normalizeLedgerPurchasePrice(purchasePrice),
      productListImageUrl: normalizeApiAssetUrl(directImage),
      infringementImageUrls: infringement.infringementImageUrls,
      infringementImageUrl: infringement.infringementImageUrl,
      infringementImageSource: infringement.infringementImageSource,
      infringementCopywriting: infringement.infringementCopywriting,
      optional,
      imageFileIds: getApiProductArchiveImageIds(attrs),
      categoryId: String(product && product.category_id || info.category_id || ''),
      productId: String(product && (product.product_id || product.id) || info.product_id || ''),
      productVersionId: String(product && (product.product_version_id || product.product_main_id) || info.product_version_id || info.product_main_id || ''),
      languageConfig: Array.isArray(configs) ? configs : [],
      apiFieldStates: {
        product: productDetailResolved ? 'value' : '',
        englishName: getApiFieldState(englishName, productDetailResolved),
        productSize: getApiFieldState(productNums || productSizeText, productDetailResolved),
        netContent: getApiFieldState(specificationNetContent, productDetailResolved),
        ...infringement.apiFieldStates,
      },
    };
  }

  async function fetchApiProductSnapshot(data, options) {
    const sku = String(data && data.sku || '').trim().toUpperCase();
    if (!sku) return { found: false, sku };
    if (options && options.force) delete apiProductSnapshotCache[sku];
    if (!apiProductSnapshotCache[sku]) {
      const request = (async () => {
        const productPayload = await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(sku));
        const list = getApiProductListItems(productPayload);
        const product = list.find((item) => String(item && (item.product_code || item.productCode || item.code || '')).trim().toUpperCase() === sku) || list[0];
        if (!product) return { found: false, sku, reason: '产品列表未找到 SKU' };
        const productId = product.product_id || product.id;
        const productVersionId = product.product_version_id || product.product_main_id;
        const categoryId = product.category_id;
        let contentPayload = null;
        let contentError = '';
        let infoPayload = null;
        if (productId && productVersionId && categoryId) {
          const detailResults = await Promise.all([
            fetchPlmJson('/api/Product/GetDetailContent?is_edit=false&product_id=' + encodeURIComponent(productId) + '&product_version_id=' + encodeURIComponent(productVersionId) + '&category_id=' + encodeURIComponent(categoryId))
              .then((payload) => ({ payload, error: '' }))
              .catch((error) => {
                const message = formatErrorMessage(error);
                addLog('warn', 'Excel 产品详情读取失败', sku + ' | ' + message);
                return { payload: null, error: message };
              }),
            fetchPlmJson('/api/Product/GetDetailInfo?product_id=' + encodeURIComponent(productId) + '&product_version_id=' + encodeURIComponent(productVersionId))
              .then((payload) => ({ payload, error: '' }))
              .catch((error) => {
                addLog('info', 'Excel 产品基础信息暂不可用，继续使用产品列表', sku + ' | ' + formatErrorMessage(error));
                return { payload: null, error: formatErrorMessage(error) };
              }),
          ]);
          const contentResult = detailResults && detailResults[0] || {};
          const infoResult = detailResults && detailResults[1] || {};
          contentPayload = contentResult.payload;
          contentError = contentResult.error;
          infoPayload = infoResult.payload;
        }
        return {
          found: true,
          sku,
          productId: String(productId || ''),
          productVersionId: String(productVersionId || ''),
          categoryId: String(categoryId || ''),
          contentPayload,
          contentError,
          infoPayload,
          ...extractApiProductSnapshot(product, infoPayload, contentPayload),
        };
      })();
      const task = request.finally(() => {
        if (apiProductSnapshotCache[sku] === task) delete apiProductSnapshotCache[sku];
      });
      apiProductSnapshotCache[sku] = task;
    }
    return apiProductSnapshotCache[sku];
  }

  async function fetchApiProjectSnapshot(data, options) {
    const sku = String(data && data.sku || '').trim().toUpperCase();
    if (!sku) return null;
    const existingId = [data && data.projectRowId, data && data.projectId].map((value) => String(value || '').trim()).find((value) => /^\d+$/.test(value));
    const existingReferenceUrl = String(data && (data.referenceUrl || data.benchmarkLink) || '').match(/https?:\/\/[^\s]+/i)?.[0] || '';
    const hasInfringementCache = isApiFieldResolved(data, 'infringementImage') && isApiFieldResolved(data, 'infringementCopywriting');
    const hasCorrectInfringementImageSource = data && data.infringementImageSource === 'frontProductCopy';
    if (existingId && existingReferenceUrl && !(options && options.force) && hasInfringementCache && hasCorrectInfringementImageSource) {
      return {
        found: true,
        sku,
        projectId: existingId,
        referenceUrl: existingReferenceUrl,
        infringementImageUrls: Array.isArray(data && data.infringementImageUrls) ? data.infringementImageUrls : [],
        infringementImageUrl: String(data && data.infringementImageUrl || ''),
        infringementImageSource: 'frontProductCopy',
        infringementCopywriting: String(data && data.infringementCopywriting || ''),
        apiFieldStates: { project: 'value', benchmarkLink: 'value', infringementImage: data.apiFieldStates.infringementImage, infringementCopywriting: data.apiFieldStates.infringementCopywriting },
      };
    }
    if (options && options.force) delete apiProjectSnapshotCache[sku];
    if (!apiProjectSnapshotCache[sku]) {
      const request = (async () => {
        let lastError = null;
        let detailReferenceState = '';
        let detailPayloadForReuse = null;
        let detailInfringement = null;
        if (existingId) {
          try {
            const detailPayload = await fetchPlmJson('/api/ChemicalNew/GetProjectDetail?id=' + encodeURIComponent(existingId));
            detailPayloadForReuse = detailPayload;
            detailInfringement = extractApiInfringementData(detailPayload);
            const detailData = getApiPayloadDataObject(detailPayload);
            const project = detailData && detailData.project && typeof detailData.project === 'object' ? detailData.project : detailData;
            const referenceValue = getApiObjectFieldValue([project, detailData], ['reference_url', 'referenceUrl', 'benchmark_url', 'benchmarkUrl', 'benchmark_link', 'benchmarkLink', 'alibaba_link', 'alibabaLink']);
            const referenceUrl = String(referenceValue || '').match(/https?:\/\/[^\s]+/i)?.[0] || '';
            detailReferenceState = getApiFieldState(referenceUrl, true);
            if (referenceUrl) {
              addLog('info', 'Excel 项目详情已补到对标链接', sku + ' | projectId=' + existingId);
              return {
                found: true,
                sku,
                projectId: existingId,
                productId: String(project.product_id || project.productId || ''),
                productVersionId: String(project.product_main_id || project.product_version_id || project.productVersionId || ''),
                categoryId: String(project.category_id || project.categoryId || ''),
                name: compactText(project.product_name || project.productName || project.name),
                brand: normalizeSkuBrandValue(compactText(project.brand_name || project.brandName || project.brand), { plmCategory: project.category_name || project.categoryName || project.product_category_name || project.productCategoryName || '' }),
                referenceUrl,
                ...detailInfringement,
                raw: project,
                projectPayload: detailPayload,
                apiFieldStates: { project: 'value', benchmarkLink: 'value', ...detailInfringement.apiFieldStates },
              };
            }
          } catch (error) {
            lastError = error;
          }
        }
        for (const endpoint of [
          '/api/ChemicalNewAll/GetList?page=1&pageSize=20&product_codes=' + encodeURIComponent(sku),
          '/api/ChemicalNewDesignTask/GetList?page=1&pageSize=20&product_codes=' + encodeURIComponent(sku),
        ]) {
          try {
            const payload = await fetchPlmJson(endpoint);
            const list = getApiListItems(payload);
            const row = list.find((item) => String(item && (item.product_code || item.productCode || item.code || '')).trim().toUpperCase() === sku);
            if (!row) continue;
            const rowProjectId = String(row.id || row.project_id || row.chemical_id || row.project_row_id || row.projectRowId || '');
            const rowInfringement = extractApiInfringementData({ data: { project: row } });
            const resolvedInfringement = {
              infringementImageUrls: detailInfringement && detailInfringement.infringementImageUrls.length
                ? detailInfringement.infringementImageUrls
                : rowInfringement.infringementImageUrls,
              infringementImageUrl: detailInfringement && detailInfringement.infringementImageUrl
                ? detailInfringement.infringementImageUrl
                : rowInfringement.infringementImageUrl,
              infringementImageSource: detailInfringement && detailInfringement.infringementImageSource
                ? detailInfringement.infringementImageSource
                : rowInfringement.infringementImageSource,
              infringementCopywriting: detailInfringement && detailInfringement.infringementCopywriting
                ? detailInfringement.infringementCopywriting
                : rowInfringement.infringementCopywriting,
              apiFieldStates: mergeApiFieldStates(rowInfringement.apiFieldStates, detailInfringement && detailInfringement.apiFieldStates),
            };
            return {
              found: true,
              sku,
              projectId: rowProjectId,
              productId: String(row.product_id || ''),
              productVersionId: String(row.product_main_id || row.product_version_id || ''),
              categoryId: String(row.category_id || ''),
              name: compactText(row.product_name || row.productName || row.name),
              brand: normalizeSkuBrandValue(compactText(row.brand_name || row.brandName || row.brand), { plmCategory: row.category_name || row.categoryName || row.product_category_name || row.productCategoryName || '' }),
              referenceUrl: String(row.reference_url || row.referenceUrl || row.benchmark_url || row.benchmarkUrl || '').match(/https?:\/\/[^\s]+/i)?.[0] || '',
              ...resolvedInfringement,
              raw: row,
              ...(detailPayloadForReuse && rowProjectId === existingId ? { projectPayload: detailPayloadForReuse } : {}),
              apiFieldStates: {
                project: 'value',
                benchmarkLink: getApiFieldState(String(row.reference_url || row.referenceUrl || row.benchmark_url || row.benchmarkUrl || '').match(/https?:\/\/[^\s]+/i)?.[0] || '', true),
                ...resolvedInfringement.apiFieldStates,
              },
            };
          } catch (error) {
            lastError = error;
          }
        }
        if (lastError) addLog('info', 'Excel 项目列表未命中，继续使用产品/页面数据', sku + ' | ' + formatErrorMessage(lastError));
        if (existingId) return {
          found: true,
          sku,
          projectId: existingId,
          ...(detailPayloadForReuse ? { projectPayload: detailPayloadForReuse } : {}),
          ...(detailInfringement || {}),
          ...(detailReferenceState ? { apiFieldStates: { project: 'value', benchmarkLink: detailReferenceState, ...(detailInfringement && detailInfringement.apiFieldStates || {}) } } : {}),
        };
        return null;
      })();
      const task = request.finally(() => {
        if (apiProjectSnapshotCache[sku] === task) delete apiProjectSnapshotCache[sku];
      });
      apiProjectSnapshotCache[sku] = task;
    }
    return apiProjectSnapshotCache[sku];
  }

  async function fetchApiDomesticThirdTierPrice(data, options) {
    const current = normalizeData(data || {});
    const sku = String(current.sku || '').trim().toUpperCase();
    let projectId = getProjectIdForMaterialApi(current);
    let project = null;
    if (!projectId && sku) {
      project = await fetchApiProjectSnapshot(current, options).catch(() => null);
      projectId = String(project && project.projectId || '').trim();
    }
    const snapshotPrice = extractApiDomesticThirdTierPrice([project, project && project.raw]);
    if (snapshotPrice) return snapshotPrice;
    if (!projectId || !/^\d+$/.test(projectId)) return '';

    if (apiProjectMaterialCache[projectId]) {
      const material = await apiProjectMaterialCache[projectId].catch(() => null);
      const materialPrice = extractApiDomesticThirdTierPrice([material, material && material.apiProject]);
      if (materialPrice) return materialPrice;
    }

    if (options && options.force) delete apiDomesticThirdTierPriceCache[projectId];
    if (!apiDomesticThirdTierPriceCache[projectId]) {
      const request = fetchPlmJson('/api/ChemicalNew/GetProjectDetail?id=' + encodeURIComponent(projectId))
        .then((payload) => extractApiDomesticThirdTierPrice([payload]))
        .catch((error) => {
          delete apiDomesticThirdTierPriceCache[projectId];
          throw error;
        });
      apiDomesticThirdTierPriceCache[projectId] = request;
    }
    return apiDomesticThirdTierPriceCache[projectId];
  }

  async function findApiIngredientPdfFromContent(contentPayload, sku) {
    const attrs = getApiDetailAttributes(contentPayload);
    const candidates = (Array.isArray(attrs) ? attrs : []).map((attr, index) => {
      const label = getApiAttributeLabel(attr);
      if (!/(?:成份|成分|ingredient|supplement\s*facts|material\s*list)/i.test(label)) return null;
      if (/(?:产品文案|product[_\s-]*description|copywriting|description)/i.test(label)) return null;
      const formats = getApiScalarText(attr && (attr.archive_type_attr_data || attr.archiveTypeAttrData), 0);
      const score = (/(?:成份|成分|supplement\s*facts)/i.test(label) ? 100 : 70) + (/(?:pdf)/i.test(formats) ? 30 : 0);
      return { attr, index, label, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.index - b.index);
    if (!candidates.length) return null;
    for (const candidate of candidates) {
      const direct = getApiAssetUrl(getApiAttributeValue(candidate.attr, 1), 0);
      if (direct && /(?:\.pdf(?:\?|$)|download|attachment)/i.test(direct)) {
        return { found: true, fileName: ((direct.match(/[^/?#]+\.pdf(?:[?#]|$)/i) || [])[0] || 'ingredient-' + sku + '.pdf').split(/[?#]/)[0], url: direct, source: 'plm-api' };
      }
      const ids = [];
      getApiAttributeLanguages(candidate.attr).forEach((language) => collectApiCopywritingFileIds(language && language.value, ids));
      if (candidate.attr && candidate.attr.value !== undefined) collectApiCopywritingFileIds(candidate.attr.value, ids);
      const records = await fetchApiArchiveFileRecordsByIds(ids);
      const files = records
        .filter((record) => record && !Number(record.is_invalid || 0))
        .map(buildApiArchiveFileInfo)
        .filter((file) => file.url && (/\.pdf$/i.test(file.fileName) || /pdf/i.test(file.fileFormat)));
      if (!files.length) continue;
      files.sort((a, b) => {
        const aSku = sku && new RegExp(escapeRegExp(sku), 'i').test(a.fileName) ? 1 : 0;
        const bSku = sku && new RegExp(escapeRegExp(sku), 'i').test(b.fileName) ? 1 : 0;
        return bSku - aSku || String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
      return { found: true, ...files[0], source: 'plm-api' };
    }
    return null;
  }

  async function fetchApiIngredientPdfFile(data, options) {
    const sku = String(data && data.sku || '').trim().toUpperCase();
    if (!sku) return { found: false, reason: '缺少 SKU' };
    if (options && options.force) delete apiIngredientFileCache[sku];
    if (!apiIngredientFileCache[sku]) {
      const request = (async () => {
        const snapshot = await fetchApiProductSnapshot({ sku }, options);
        if (snapshot && snapshot.contentError) throw new Error(snapshot.contentError);
        if (!snapshot || !snapshot.found || !snapshot.contentPayload) return { found: false, reason: '产品详情没有可读内容' };
        const file = await findApiIngredientPdfFromContent(snapshot.contentPayload, sku);
        return file || { found: false, reason: '产品详情没有成分表 PDF 附件' };
      })();
      const task = request.finally(() => {
        if (apiIngredientFileCache[sku] === task) delete apiIngredientFileCache[sku];
      });
      apiIngredientFileCache[sku] = task;
    }
    return apiIngredientFileCache[sku];
  }

  function getApiProductMetricState(payload, variableName) {
    let result = '';
    let found = false;
    const visit = (value) => {
      if (found || !value) return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (typeof value !== 'object') return;
      if (value.variable_name === variableName) {
        found = true;
        const languageValues = getApiAttributeLanguages(value);
        const preferred = languageValues.find((item) => Number(item && item.language_id) === 1 && item.value != null)
          || languageValues.find((item) => item && item.value != null);
        const raw = preferred ? preferred.value : (value.value ?? value.attr_value ?? value.attrValue ?? '');
        const rawText = compactText(raw);
        if (rawText && rawText !== '--') {
          const unit = Number(value.attr_display_unit_id) === 3 ? 'g' : (Number(value.attr_display_unit_id) === 4 ? 'ml' : '');
          const text = rawText;
          result = unit && /^\d+(?:\.\d+)?$/.test(text) ? text + unit : text;
        }
        return;
      }
      Object.keys(value).forEach((key) => visit(value[key]));
    };
    visit(payload);
    return { value: result, state: found ? (result ? 'value' : 'empty') : '' };
  }


  function extractApiProductMetrics(payload) {
    const netContentState = getApiProductMetricState(payload, 'suttle');
    const grossWeightState = getApiProductMetricState(payload, 'rough_weight');
    const infringement = extractApiInfringementData(payload);
    const apiFieldStates = {};
    if (netContentState.state) apiFieldStates.netContent = netContentState.state;
    if (grossWeightState.state) apiFieldStates.grossWeight = grossWeightState.state;
    if (infringement.apiFieldStates.infringementImage) apiFieldStates.infringementImage = infringement.apiFieldStates.infringementImage;
    if (infringement.apiFieldStates.infringementCopywriting) apiFieldStates.infringementCopywriting = infringement.apiFieldStates.infringementCopywriting;
    return {
      ...(netContentState.value ? { netContent: netContentState.value } : {}),
      ...(grossWeightState.value ? { grossWeight: grossWeightState.value } : {}),
      ...(netContentState.value || grossWeightState.value ? { apiProductSource: 'plm-product-detail-content' } : {}),
      ...(infringement.infringementCopywriting ? { infringementCopywriting: infringement.infringementCopywriting } : {}),
      ...(infringement.infringementImageSource ? { infringementImageSource: infringement.infringementImageSource } : {}),
      ...(infringement.infringementImageUrls.length ? { infringementImageUrls: infringement.infringementImageUrls, infringementImageUrl: infringement.infringementImageUrl } : {}),
      apiFieldStates,
    };
  }

  function extractApiDomesticThirdTierPrice(payloads) {
    const objects = [];
    (payloads || []).forEach((payload) => {
      if (payload && typeof payload === 'object' && !Array.isArray(payload)) objects.push(payload);
      const data = payload && payload.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        objects.push(data);
        if (data.project && typeof data.project === 'object') objects.push(data.project);
      }
      if (payload && payload.project && typeof payload.project === 'object') objects.push(payload.project);
      if (payload && payload.raw && typeof payload.raw === 'object') objects.push(payload.raw);
      objects.push(...getApiListItems(payload));
    });
    const raw = getApiObjectFieldValue(objects, [
      'domestic_third_tier_price', 'domesticThirdTierPrice',
      'domestic_three_price', 'domesticThreePrice',
    ]);
    return normalizeLedgerPurchasePrice(raw);
  }

  function collectApiCopywritingFileIds(value, ids) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => collectApiCopywritingFileIds(item, ids));
      return;
    }
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      ids.push(String(value));
      return;
    }
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      ids.push(value.trim());
      return;
    }
    if (typeof value !== 'object') return;
    ['archive_file_version_id', 'file_version_id', 'id'].forEach((key) => {
      if (value[key] !== undefined && value[key] !== null) collectApiCopywritingFileIds(value[key], ids);
    });
  }

  function extractApiCopywritingFileIds(payload) {
    const ids = [];
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      const variableName = String(value.variable_name || '').trim();
      const attrName = compactText(value.attr_name);
      if (variableName === 'product_description' || attrName === '\u4ea7\u54c1\u6587\u6848') {
        const languageValues = Array.isArray(value.attr_language_config_json) ? value.attr_language_config_json : [];
        const preferred = languageValues.find((item) => Number(item && item.language_id) === 1 && item.value != null)
          || languageValues.find((item) => item && item.value != null);
        collectApiCopywritingFileIds(preferred && preferred.value, ids);
        return;
      }
      Object.keys(value).forEach((key) => visit(value[key]));
    };
    visit(payload);
    return ids.filter((id, index, list) => list.indexOf(id) === index);
  }

  function getApiArchiveFileRecords(payload) {
    const data = payload && payload.data !== undefined ? payload.data : payload && payload.response && payload.response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.list)) return data.list;
    if (payload && Array.isArray(payload.list)) return payload.list;
    return [];
  }

  function buildApiArchiveFileUrl(filePath) {
    const text = String(filePath || '').trim().replace(/^\/+/, '');
    if (!text) return '';
    if (/^https?:\/\//i.test(text)) return text;
    return PLM_ARCHIVE_OSS_ORIGIN + '/' + text;
  }

  async function fetchApiCopywritingFile(data, options) {
    const sku = String(data && data.sku || '').trim();
    if (!sku) return null;
    if (options && options.force) delete apiCopywritingFileCache[sku];
    if (!apiCopywritingFileCache[sku]) {
      const request = (async () => {
        addLog('info', '产品文案：开始读取产品关联', sku);
        const productPayload = await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(sku));
        const list = productPayload && productPayload.data && Array.isArray(productPayload.data.list) ? productPayload.data.list : [];
        const product = list.find((item) => String(item && (item.product_code || item.code) || '').trim() === sku) || list[0] || {};
        const productId = product.product_id;
        const productVersionId = product.product_version_id;
        const categoryId = product.category_id;
        if (!productId || !productVersionId || !categoryId) {
          throw new Error('产品列表缺少详情关联');
        }
        addLog('info', '产品文案：读取产品详情字段', sku + ' | product_id=' + productId + ' | category_id=' + categoryId);
        const contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=false&product_id=' + encodeURIComponent(productId) + '&product_version_id=' + encodeURIComponent(productVersionId) + '&category_id=' + encodeURIComponent(categoryId));
        const ids = extractApiCopywritingFileIds(contentPayload);
        if (!ids.length) {
          addLog('info', '产品文案：详情中没有关联 Word', sku);
          return { found: false, reason: '产品文案字段没有附件 ID' };
        }
        addLog('info', '产品文案：找到文案附件 ID', sku + ' | ids=' + ids.join(','));
        const filePayload = await fetchPlmApiJson('/api/Product/GetArchiveFileVersionListByFileVersionId', { ids: ids.map((id) => Number(id)) });
        const records = getApiArchiveFileRecords(filePayload)
          .filter((item) => item && !Number(item.is_invalid || 0))
          .filter((item) => /\.docx$/i.test(String(item.file_name || '')) || String(item.file_format || '').toLowerCase() === 'docx');
        const skuMatches = records.filter((item) => !sku || new RegExp(escapeRegExp(sku), 'i').test(String(item.file_name || '')));
        const candidates = skuMatches.length ? skuMatches : records;
        const file = candidates.sort((a, b) => {
          const aStamp = extractCopywritingFileTimestamp(a.file_name) || String(a.create_at || '');
          const bStamp = extractCopywritingFileTimestamp(b.file_name) || String(b.create_at || '');
          return bStamp.localeCompare(aStamp);
        })[0];
        if (!file) {
          addLog('info', '产品文案：附件列表中没有 docx', sku + ' | records=' + records.length);
          return { found: false, reason: '附件列表中没有 docx' };
        }
        const url = buildApiArchiveFileUrl(file.file_path);
        if (!url) throw new Error('文案附件缺少 file_path');
        const fileName = String(file.file_name || '').trim();
        addLog('info', '产品文案：命中文案 Word', sku + ' | ' + fileName + ' | ' + redactCopywritingUrl(url));
        return {
          found: true,
          fileName,
          filePath: String(file.file_path || ''),
          fileFormat: String(file.file_format || 'docx'),
          fileId: String(file.archive_file_version_id || ''),
          fileTimestamp: extractCopywritingFileTimestamp(fileName),
          createdAt: String(file.create_at || ''),
          url,
          source: 'plm-api',
        };
      })();
      const task = request.finally(() => {
        // Keep this cache only for concurrent callers.  A later 30-minute
        // refresh must query the current attachment metadata again.
        if (apiCopywritingFileCache[sku] === task) delete apiCopywritingFileCache[sku];
      });
      apiCopywritingFileCache[sku] = task;
    }
    return apiCopywritingFileCache[sku];
  }

  function getApiMaterialCode(item) {
    const candidates = [
      item && item.code,
      item && item.material_code,
      item && item.materialCode,
      item && item.material_id_code,
      item && item.materialIdCode,
    ];
    const fromFields = candidates.map((value) => compactText(value)).find(Boolean) || '';
    const fromText = getApiMaterialSourceText(item);
    const match = (fromFields + ' ' + fromText).match(/\bMTL\d+\b/i);
    return match ? match[0].toUpperCase() : fromFields;
  }

  function getApiMaterialSourceText(item) {
    return [
      item && item.name,
      item && item.material_name,
      item && item.materialName,
      item && item.category_name,
      item && item.categoryName,
      item && item.properties_value,
      item && item.propertiesValue,
      item && item.specification_model,
      item && item.specificationModelName,
      item && item.specification,
      item && item.specificationModel,
    ].map((value) => compactText(value)).filter(Boolean).join(' ');
  }

  function getApiMaterialUnitIssue(item) {
    const sourceText = getApiMaterialSourceText(item);
    const propertyIssue = detectMaterialDimensionUnitIssue(sourceText);
    if (propertyIssue) return propertyIssue;
    const unitText = [
      item && item.material_unit,
      item && item.material_unit_name,
      item && item.dimension_unit,
      item && item.unit,
      item && item.unit_name,
    ].map((value) => compactText(value)).find((value) => /^(?:m|米)$/i.test(value));
    if (!unitText) return null;
    const values = [item && item.material_length, item && item.material_width, item && item.material_height]
      .map((value) => firstNumber(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    return { unit: 'm', raw: values.length >= 2 ? values.join('x') + 'm' : 'm' };
  }

  function getApiMaterialDimensions(item, count, preserveExtraDimensions) {
    if (getApiMaterialUnitIssue(item)) return null;
    // Keep API extraction aligned with the DOM row parser: the complete
    // human-readable material row is preferred over shifted numeric columns.
    const propertyDimension = extractDimensionString(getApiMaterialSourceText(item));
    const propertyParsed = parseDimension(propertyDimension, count);
    if (propertyParsed && propertyParsed.length >= count) {
      return preserveExtraDimensions ? propertyParsed : propertyParsed.slice(0, count);
    }
    const values = [item && item.material_length, item && item.material_width, item && item.material_height]
      .map((value) => {
        const text = String(value == null ? '' : value);
        const number = Number(text) || firstNumber(text);
        if (!Number.isFinite(number) || number <= 0) return 0;
        return /mm$/i.test(text.trim()) ? number / 10 : number;
      });
    if (values.slice(0, count).every((value) => value > 0)) return values.slice(0, count);
    const parsed = parseDimension(propertyDimension, count);
    return parsed && parsed.length >= count
      ? (preserveExtraDimensions ? parsed : parsed.slice(0, count))
      : null;
  }

  function getApiPrintMaterialDimensions(item) {
    const source = getApiMaterialSourceText(item);
    const markers = Array.from(source.matchAll(/(?:印刷|丝印)(?:尺寸|规格)/ig));
    const explicitSource = markers.length
      ? source.slice(Number(markers[markers.length - 1].index) || 0)
      : '';
    const explicitText = explicitSource ? extractPrintDimensionString(explicitSource) : '';
    const explicitValues = parseDimension(explicitText, 2);
    if (explicitValues && explicitValues.length >= 2) return explicitValues.slice(0, 2);
    const namedValues = extractNamedDimensionStrings(source)
      .map((value) => parseDimension(String(value || '').replace(/^[^:：]{1,16}[:：]\s*/, ''), 2))
      .find((value) => value && value.length >= 2);
    if (namedValues) return namedValues.slice(0, 2);
    return getApiMaterialDimensions(item, 2);
  }

  function extractApiTubeMeasure(text, label) {
    // API specs often write “管身高度138mm” while the DOM form exposes
    // “管身 138mm”. Reuse the DOM parser so both sources accept the same
    // descriptors and unit normalization rules.
    return extractTubeMeasure(text, label);
  }

  function extractApiTubeFields(text) {
    const source = String(text || '');
    const diameter = extractApiTubeMeasure(source, '管径');
    const body = extractApiTubeMeasure(source, '管身');
    const parts = [];
    if (diameter) parts.push('管径 ' + diameter + 'mm');
    if (body) parts.push('管身 ' + body + 'mm');
    return { diameter, body, text: parts.join(' ') };
  }

  function getApiTubeMaterialSource(item) {
    return getApiMaterialSourceText(item);
  }

  function formatApiMaterialDimensions(values) {
    return Array.isArray(values) && values.length >= 2
      ? values.map((value) => trimNumber(value)).join('x') + 'cm'
      : '';
  }

  function getApiMaterialDisplayName(value, keywordPattern) {
    const name = compactText(value);
    if (!name) return '';
    const match = name.match(keywordPattern);
    return match ? name.slice(match.index).trim() : name.trim();
  }

  function getApiPackageDisplayName(item) {
    const name = item && (item.name || item.material_name || item.materialName);
    const category = item && (item.category_name || item.categoryName);
    return getPackageMaterialKind(name)
      || getPackageMaterialKind(category)
      || compactText(name)
      || compactText(category);
  }

  function getApiPrintDisplayName(item) {
    const pattern = /(标签|丝印尺寸|丝印|印刷软管|印刷尺寸|印刷管|印刷瓶|印刷乳液瓶|印刷)/;
    const name = item && (item.name || item.material_name || item.materialName);
    const category = item && (item.category_name || item.categoryName);
    const raw = getApiMaterialDisplayName(name, pattern)
      || getApiMaterialDisplayName(category, pattern)
      || (isPrintMaterialRow(getApiMaterialSourceText(item)) ? '印刷' : '')
      || compactText(name)
      || compactText(category);
    return cleanPrintLabel(raw);
  }

  function isApiBoxCategory(value) {
    const category = compactText(value);
    return /包材/.test(category) && isPaperBoxMaterialText(category);
  }

  function normalizeSkuBrandValue(value, data) {
    const text = compactText(value);
    if (!text || /^(?:--+|—+|－+|未填写|未命名|预设品牌)$/i.test(text)) return '';
    const source = data && typeof data === 'object' ? data : {};
    const categoryValues = [
      source.plmCategory, source.category, source.categoryName, source.category_name,
      source.productCategory, source.productCategoryName, source.product_category, source.product_category_name,
      source.categoryPath, source.category_path, source.productCategoryPath, source.product_category_path,
      source.productType, source.productTypeName, source.product_type, source.product_type_name,
      source.projectSeriesName, source.project_series_name, source.manualCategory,
      ...productDevelopmentObjectCategoryHints(source),
    ];
    return productDevelopmentBrandAndCategory(text, categoryValues).brand || text;
  }

  function getProductDevelopmentTaskMetaForSku(sku, task, detail) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!normalizedSku) return null;
    const memory = state && state.productDevelopmentTaskMeta && state.productDevelopmentTaskMeta[normalizedSku];
    const stored = loadProductDevelopmentTaskMeta()[normalizedSku];
    const fallback = productDevelopmentTaskMetaFallback(task, detail);
    const categoryHint = [
      task && task.plmCategory,
      task && task.categoryName,
      task && task.category,
      task && task.categoryPath,
      task && task.productCategoryName,
      task && task.product_category_name,
      task && task.productType,
      task && task.productTypeName,
      task && task.product_type_name,
      detail && detail.categoryName,
      detail && detail.category,
      detail && detail.categoryPath,
      detail && detail.productType,
      detail && detail.productInfo && detail.productInfo.category_name,
      detail && detail.productInfo && detail.productInfo.categoryName,
      detail && detail.productInfo && detail.productInfo.product_category_name,
      detail && detail.productInfo && detail.productInfo.productCategoryName,
      ...productDevelopmentObjectCategoryHints(task),
      ...productDevelopmentObjectCategoryHints(detail),
      ...productDevelopmentObjectCategoryHints(detail && detail.productInfo),
    ];
    const merged = {
      ...fallback,
      ...(stored && typeof stored === 'object' ? stored : {}),
      ...(memory && typeof memory === 'object' ? memory : {}),
      category: categoryHint,
      productType: task && task.productType || detail && detail.productType,
      name: task && task.name || detail && detail.name,
    };
    const meta = normalizeProductDevelopmentTaskMeta(merged);
    return meta.brand || meta.productNameCn || meta.productNameEn || meta.referenceProductCode || meta.reworkProductCode ? meta : null;
  }

  function resolveProductDevelopmentSkuIdentity(data) {
    const source = data && typeof data === 'object' ? data : {};
    const sku = String(source.sku || '').trim().toUpperCase();
    if (!sku) return source;
    const task = typeof getProductDevelopmentTaskBySku === 'function' ? getProductDevelopmentTaskBySku(sku) : null;
    const detail = state && state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    const meta = getProductDevelopmentTaskMetaForSku(sku, task, detail);
    if (!meta) return source;
    const identityContext = {
      ...source,
      plmCategory: source.plmCategory || task && task.plmCategory || '',
      category: source.category || task && task.category || '',
      productType: source.productType || task && task.productType || '',
      manualCategory: source.manualCategory || task && task.plmCategory || '',
    };
    const currentBrand = normalizeSkuBrandValue(source.brand, identityContext);
    const currentName = normalizeProductNameValue(source.name);
    const fallbackBrand = normalizeSkuBrandValue(meta.brand, identityContext);
    const fallbackName = normalizeProductNameValue(meta.productNameCn || meta.productNameEn);
    if (currentBrand && currentName) return source;
    const next = { ...source };
    if (!currentBrand && fallbackBrand) next.brand = fallbackBrand;
    if (!currentName && fallbackName) next.name = fallbackName;
    return next;
  }

  function isApiBoxMaterial(item) {
    const name = compactText(item && (item.name || item.material_name || item.materialName));
    const category = item && (item.category_name || item.categoryName);
    return isApiBoxCategory(category) || isPaperBoxMaterialText(name);
  }

  function normalizeAccessories(value) {
    const seen = new Set();
    return (Array.isArray(value) ? value : []).slice(0, 30).map((item) => ({
      name: compactText(item && item.name).slice(0, 100),
      code: compactText(item && item.code).slice(0, 100),
      sizeText: compactText(item && item.sizeText).slice(0, 200),
      specification: compactText(item && item.specification).slice(0, 500),
      quantity: Number(item && item.quantity) > 0 ? Math.min(Number(item.quantity), 9999) : 1,
    })).filter((item) => {
      const key = item.code || item.name + '|' + item.specification;
      if (!item.name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function extractBomAccessory(item) {
    const name = compactText(item && (item.name || item.material_name || item.materialName));
    const category = compactText(item && (item.category_name || item.categoryName));
    const specification = compactText(item && (item.properties_value || item.propertiesValue || item.specification_model || item.specificationModelName || item.specification || item.specificationModel));
    // Classify the material itself, never a sponge mentioned in a box's pack specification.
    if (!name || /说明书|使用说明|纸盒|纸箱|标签|印刷|瓶|旋盖|泵头|喷头|软管|滴管|盖子|瓶盖|内卡/.test(name + ' ' + category)) return null;
    const known = /海绵|刷子|毛刷|清洁刷|刮板|刮刀|起泡网|勺|量杯|手套|抹布|擦布|毛巾|棉签|棉片|粉扑|漏斗|梳子|镊子|吸管|搅拌棒/.test(name);
    if (!known && !/配件|附件/.test(category)) return null;
    let sizeText = '';
    const axis = Array.from(specification.matchAll(/(直径|长|宽|高|厚(?:度)?)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(cm|mm|厘米|毫米)/gi));
    if (axis.length) {
      sizeText = axis.map((match) => match[1] + (Number(match[2]) / (/mm|毫米/i.test(match[3]) ? 10 : 1)) + 'cm').join(' × ');
    } else {
      const dimensions = getApiMaterialDimensions(item, 2, true);
      if (dimensions) sizeText = formatApiMaterialDimensions(dimensions);
    }
    const count = specification.match(/(?:^|[,，;；\s])(?:数量\s*[:：]?\s*)?(\d+(?:\.\d+)?)\s*(?:个|把|支|片|条|只|件|套)(?:[,，;；\s]|$)/);
    const rawQuantity = item.usage_value ?? item.usageValue ?? item.usage ?? item.qty ?? item.material_quantity ?? item.materialQuantity;
    return { name, code: getApiMaterialCode(item), sizeText, specification, quantity: Number(rawQuantity) > 0 ? Number(rawQuantity) : (count ? Number(count[1]) : 1) };
  }

  function extractDomAccessories(root) {
    return normalizeAccessories(Array.from(root.querySelectorAll('tr, .ant-table-row, [role="row"]')).filter(isVisibleElement).map((row) => {
      const cells = Array.from(row.querySelectorAll('td, [role="cell"], .ant-table-cell')).map((cell) => compactText(cell.innerText || cell.textContent));
      if (cells.length < 6) return null;
      return extractBomAccessory({ code: cells[1], name: cells[3], category_name: cells[4], specification: cells[5] });
    }).filter(Boolean));
  }

  function extractApiMaterialPackaging(payload) {
    const items = getApiMaterialItems(payload);
    const materialResponseResolved = hasApiMaterialItemsPayload(payload);
    const accessories = normalizeAccessories(items.map(extractBomAccessory).filter(Boolean));
    const packageCandidates = items.map((item, index) => {
      const name = compactText(item && (item.name || item.material_name || item.materialName));
      const category = compactText(item && (item.category_name || item.categoryName));
      const supplier = compactText(item && (item.default_supplier_name || item.supplier_name));
      const text = [getApiMaterialSourceText(item), supplier].filter(Boolean).join(' ');
      const materialClassText = name + ' ' + category;
      const isPackagingCategory = /包材/.test(text);
      const isBoxCategory = isApiBoxMaterial(item);
      const isPrintedBagMaterial = isPrintedBagMaterialText(materialClassText);
      // Keep the DOM material-row rule as the source of truth for print
      // classification, while an explicit/name-level box remains packaging.
      const isPrintMaterial = !isBoxCategory && isPrintMaterialRow(text);
      const unitIssue = getApiMaterialUnitIssue(item);
      const dimensions = getApiMaterialDimensions(item, 3, true);
      let score = 0;
      if (isPaperBoxMaterialText(materialClassText) || isPrintedBagMaterial) score += 160;
      if (isPackagingCategory) score += 20;
      if (isPrintMaterial) score -= 100;
      if (extractBomAccessory(item)) score -= 300;
      if (/瓶|旋盖|泵头|喷头|罐|软管|滴管|刷头|盖子/.test(name)) score -= 180;
      if (dimensions && dimensions.length >= 3) score += 40;
      else if (unitIssue) score += 25;
      return { item, index, name, category, text, dimensions, unitIssue, score, isPackagingCategory, isBoxCategory, isPrintedBagMaterial, isPrintMaterial, displayName: getApiPackageDisplayName(item) };
    });
    const candidates = packageCandidates.filter((item) => item.isPackagingCategory && !item.isPrintMaterial && item.score > 0 && ((item.dimensions && item.dimensions.length >= 3) || item.unitIssue))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    // A printed self-standing bag is the outer package when no paper box
    // exists. It can still contain an explicit "印刷尺寸" field, so it must
    // be considered before the generic print-material filter in that case.
    const boxCandidates = packageCandidates
      .filter((item) => item.isPackagingCategory && item.isBoxCategory && item.score > 0 && !/说明书|使用说明/.test(item.text))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const printedBagCandidates = packageCandidates
      .filter((item) => item.isPackagingCategory && item.isPrintedBagMaterial && !item.isBoxCategory && item.score > 0 && !/说明书|使用说明/.test(item.text))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const packageItem = boxCandidates[0] || printedBagCandidates[0] || candidates[0] || packageCandidates
      .filter((item) => item.score > 0 && item.isPackagingCategory && !item.isPrintMaterial && !/说明书|使用说明/.test(item.text))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0];
    const printItems = items.map((item, index) => {
      const name = compactText(item && (item.name || item.material_name || item.materialName));
      const category = compactText(item && (item.category_name || item.categoryName));
      const text = getApiMaterialSourceText(item);
      const unitIssue = getApiMaterialUnitIssue(item);
      const tubeSource = getApiTubeMaterialSource(item);
      const tubeFields = extractApiTubeFields(tubeSource);
      const tubeSpec = isTubePrintRow(tubeSource) ? findTubeSizeSpec(tubeSource, tubeFields) : null;
      const dimensions = tubeSpec ? [tubeSpec.width, tubeSpec.height] : getApiPrintMaterialDimensions(item);
      const isBoxCategory = isApiBoxMaterial(item);
      const isPrintMaterial = !isBoxCategory && isPrintMaterialRow(text);
      return { item, index, name, category, text, dimensions, unitIssue, tubeSpec, isBoxCategory, isPrintMaterial, displayName: getApiPrintDisplayName(item) };
    }).filter((item) => (!packageItem || item.index !== packageItem.index)
      && !item.isBoxCategory
      && !/说明书|使用说明/.test(item.text)
      && item.isPrintMaterial);
    const packageNums = packageItem && packageItem.dimensions ? packageItem.dimensions : null;
    const packageUnitIssue = packageItem && packageItem.unitIssue ? packageItem.unitIssue : null;
    const tubeItem = printItems.find((item) => item.tubeSpec);
    const tubeSpec = tubeItem && tubeItem.tubeSpec;
    const packageSizeText = packageUnitIssue ? packageUnitIssue.raw : formatApiMaterialDimensions(packageNums);
    const packageSizeLabel = packageItem ? packageItem.displayName : '';
    const packageCode = packageItem ? getApiMaterialCode(packageItem.item) : '';
    const printSizeText = tubeSpec ? tubeSpec.printSizeText : printItems.map((item) => item.unitIssue ? item.unitIssue.raw : formatApiMaterialDimensions(item.dimensions)).filter(Boolean).join('；');
    const printSizeLabel = tubeSpec ? '印刷' : printItems.map((item) => item.displayName).filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index).join('；');
    const printCode = printItems.map((item) => getApiMaterialCode(item.item)).filter(Boolean).join('；');
    const netContent = (packageItem ? extractNetContentFromMaterial(packageItem.text) : '')
      || (printItems[0] ? extractNetContentFromMaterial(printItems[0].text) : '');
    const apiFieldStates = materialResponseResolved ? {
      material: items.length ? 'value' : 'empty',
      accessories: accessories.length ? 'value' : 'empty',
      materialSize: getApiFieldState([packageSizeText, printSizeText].filter(Boolean), true),
      packageSize: getApiFieldState(packageSizeText, true),
      packageLabel: getApiFieldState(packageSizeLabel, true),
      packageCode: getApiFieldState(packageCode, true),
      printSize: getApiFieldState(printSizeText, true),
      printLabel: getApiFieldState(printSizeLabel, true),
      printCode: getApiFieldState(printCode, true),
      netContent: getApiFieldState(netContent, true),
    } : {};
    return {
      accessories,
      packageSizeText,
      packageSizeLabel,
      packageCode,
      packageNums,
      isPrintedBagOuterPackage: Boolean(packageItem && packageItem.isPrintedBagMaterial && !packageItem.isBoxCategory),
      hasInnerCard: items.some((item) => /内卡/.test(getApiMaterialSourceText(item))),
      printSizeText,
      printSizeLabel,
      printCode,
      printRawText: printItems.map((item) => item.text).join('；').slice(0, 1000),
      tubeSegmentText: tubeSpec ? tubeSpec.segmentText : '',
      tubeTailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tubeDiameter: tubeSpec ? tubeSpec.diameter : '',
      tubeBody: tubeSpec ? tubeSpec.body : '',
      tubeSpecKey: tubeSpec ? tubeSpec.key : '',
      isTubePrintMaterial: Boolean(tubeSpec),
      materialDimensionUnitIssues: {
        package: packageUnitIssue,
        print: (printItems.find((item) => item.unitIssue) || {}).unitIssue || null,
      },
      netContent,
      apiMaterialSource: packageItem || printItems.length || accessories.length ? 'plm-project-pms' : '',
      apiFieldStates,
    };
  }

  function hasProductDetailPackage(data) {
    return Boolean(data
      && data.packageSource === 'plm-product-detail'
      && (isUsefulValue(data.packageSizeText) || isUsefulValue(data.packageNums)));
  }

  function resolveApiMaterialPackageSource(base, packaging) {
    const source = packaging || {};
    if (hasProductDetailPackage(base)) return 'plm-product-detail';
    if (isUsefulValue(source.packageSizeText) || isUsefulValue(source.packageNums)) return 'plm-project-pms';
    if (source.apiMaterialSource) return '';
    return base && base.packageSource ? base.packageSource : '';
  }

  function mergeApiPackagingData(base, packaging) {
    const merged = { ...(base || {}) };
    const source = packaging || {};
    const preserveProductDetailPackage = hasProductDetailPackage(merged);
    const packageKeys = new Set(['packageSizeText', 'packageSizeLabel', 'packageCode', 'packageNums']);
    [
      'accessories', 'packageSizeText', 'packageSizeLabel', 'packageCode', 'packageNums', 'hasInnerCard',
      'printSizeText', 'printSizeLabel', 'printCode', 'printRawText', 'isTubePrintMaterial',
      'tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey',
      'netContent', 'grossWeight', 'apiMaterialSource', 'infringementImageUrls', 'infringementImageUrl', 'infringementImageSource', 'infringementCopywriting',
    ].forEach((key) => {
      if (preserveProductDetailPackage && packageKeys.has(key)) return;
      if (isUsefulValue(source[key])) merged[key] = source[key];
      else if (source.apiFieldStates && source.apiFieldStates[key === 'infringementImageUrls' || key === 'infringementImageUrl' ? 'infringementImage' : key] === 'empty') {
        merged[key] = Array.isArray(source[key]) ? [] : '';
      }
    });
    if (source.apiMaterialSource && Object.prototype.hasOwnProperty.call(source, 'isPrintedBagOuterPackage')) {
      merged.isPrintedBagOuterPackage = Boolean(source.isPrintedBagOuterPackage);
    }
    if (source.apiFieldStates && typeof source.apiFieldStates === 'object') {
      merged.apiFieldStates = mergeApiFieldStates(merged.apiFieldStates, source.apiFieldStates);
    }
    const tubeKeys = ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'];
    if (source.apiMaterialSource && Object.prototype.hasOwnProperty.call(source, 'isTubePrintMaterial') && !source.isTubePrintMaterial) {
      tubeKeys.forEach((key) => { merged[key] = ''; });
      merged.isTubePrintMaterial = false;
    }
    const incomingPackage = ['packageSizeText', 'packageSizeLabel', 'packageCode', 'packageNums']
      .some((key) => isUsefulValue(source[key]));
    if (source.apiMaterialSource && !incomingPackage && !preserveProductDetailPackage) {
      merged.packageSizeText = '';
      merged.packageSizeLabel = '';
      merged.packageCode = '';
      merged.packageNums = null;
      merged.packageSource = '';
    }
    const currentIssues = normalizeMaterialDimensionUnitIssues(merged.materialDimensionUnitIssues, merged);
    const incomingIssues = normalizeMaterialDimensionUnitIssues(source.materialDimensionUnitIssues, source);
    merged.materialDimensionUnitIssues = {
      package: preserveProductDetailPackage
        ? currentIssues.package
        : (incomingIssues.package || (source.packageSizeText ? null : currentIssues.package)),
      print: incomingIssues.print || (source.printSizeText ? null : currentIssues.print),
    };
    return merged;
  }

  async function fetchPlmJson(url, options) {
    if (typeof isWestmonthLoginPage === 'function' && isWestmonthLoginPage()) throw new Error('缓存模式：PLM 未登录，无法刷新数据');
    try { return await fetchPlmJsonRequest(url, options); }
    catch (error) {
      reportDiagnosticRequest(error, url, 'plm-api', 'GET');
      throw error;
    }
  }

  async function fetchPlmJsonRequest(url, options) {
    const baseRequestHeaders = {
      Accept: 'application/json, text/plain, */*',
      'x-app-code': 'PLM',
      'x-tenant-code': 'xy',
      'x-tenant-id': 'xy',
    };
    const requestFromPage = async (headers) => {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), 15000) : 0;
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers,
          signal: controller ? controller.signal : undefined,
        });
        if (!response.ok) {
          const error = new Error('HTTP ' + response.status);
          error.status = Number(response.status) || 0;
          throw error;
        }
        return response.json();
      } catch (error) {
        if (error && error.name === 'AbortError') throw new Error('请求超时');
        throw error;
      } finally {
        if (timer) window.clearTimeout(timer);
      }
    };
    const isRetryable = (error) => {
      const status = Number(error && error.status) || Number(String(error && error.message || '').match(/HTTP\s+(\d+)/i)?.[1]) || 0;
      return !status || status === 401 || status === 403 || status === 408 || status === 429 || status >= 500;
    };
    const pageErrors = [];
    // PLM may rotate the page authorization header while a drawer is opening;
    // retry with freshly captured headers so a transient 401 does not become a
    // false “PLM 读取失败”.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (attempt > 0) await wait(attempt === 1 ? 100 : 220);
      const headers = attempt === 0 && !(options && options.singleAttempt)
        ? baseRequestHeaders
        : { ...baseRequestHeaders, ...getPlmAuthHeaders() };
      try {
        return await requestFromPage(headers);
      } catch (error) {
        if (options && options.singleAttempt) throw error;
        pageErrors.push(error);
        if (!isRetryable(error)) break;
      }
    }
    const cookieRequestError = pageErrors[0] || null;
    const pageRequestError = pageErrors[pageErrors.length - 1] || cookieRequestError;
    if (typeof GM_xmlhttpRequest === 'function' && /^\//.test(url)) {
      const capturedAuthHeaders = getPlmAuthHeaders();
      const gmResult = await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          callback(value);
        };
        GM_xmlhttpRequest({
          method: 'GET',
          url: new URL(url, window.location.origin).href,
          withCredentials: true,
          headers: { ...baseRequestHeaders, ...capturedAuthHeaders },
          timeout: 15000,
          onload: (response) => finish(resolve, response),
          onerror: () => finish(reject, new Error('网络请求失败')),
          ontimeout: () => finish(reject, new Error('请求超时')),
        });
      });
      if (!gmResult || gmResult.status < 200 || gmResult.status >= 300) {
        throw new Error('Cookie 会话 ' + formatErrorMessage(cookieRequestError) + '；页面授权 ' + formatErrorMessage(pageRequestError) + '；扩展请求 HTTP ' + (gmResult && gmResult.status || 0));
      }
      return JSON.parse(gmResult.responseText || '{}');
    }
    throw pageRequestError || new Error('PLM 页面请求失败');
  }

  function formatPlmApiMessage(value) {
    const scalar = getApiScalarText(value, 0);
    if (scalar) return scalar;
    if (value && typeof value === 'object') {
      try { return JSON.stringify(value); } catch (_) { return ''; }
    }
    return String(value || '').trim();
  }

  async function fetchPlmApiJson(url, body, options) {
    if (typeof isWestmonthLoginPage === 'function' && isWestmonthLoginPage()) throw new Error('缓存模式：PLM 未登录，无法写入数据');
    try { return await fetchPlmApiJsonRequest(url, body, options); }
    catch (error) {
      reportDiagnosticRequest(error, url, 'plm-api', 'POST');
      throw error;
    }
  }

  async function fetchPlmApiJsonRequest(url, body, options) {
    const opts = options || {};
    const timeout = Math.max(1000, Number(opts.timeout) || 30000);
    const request = {
      method: 'POST',
      url: new URL(url, window.location.origin).href,
      withCredentials: true,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=UTF-8',
        'x-app-code': 'PLM',
        'x-tenant-code': 'xy',
        'x-tenant-id': 'xy',
        ...getPlmAuthHeaders(),
      },
      data: JSON.stringify(body || {}),
      timeout,
    };
    const response = typeof GM_xmlhttpRequest === 'function'
      ? await new Promise((resolve, reject) => GM_xmlhttpRequest({ ...request, onload: resolve, onerror: () => reject(new Error('网络请求失败')), ontimeout: () => reject(new Error('请求超时')) }))
      : await fetchWithTimeout(request.url, timeout, { method: 'POST', credentials: 'include', headers: request.headers, body: request.data });
    const status = Number(response && response.status || 0);
    const text = response && typeof response.responseText === 'string' ? response.responseText : await response.text();
    if (status < 200 || status >= 300) throw new Error('HTTP ' + status);
    const payload = JSON.parse(text || '{}');
    if (payload && payload.success === false) throw new Error(formatPlmApiMessage(payload.msg) || formatPlmApiMessage(payload.message) || 'PLM 数据读取失败');
    return payload;
  }

  async function fetchApiMaterialPackaging(data, options) {
    const sku = String(data && data.sku || '');
    const projectId = getProjectIdForMaterialApi(data);
    if (!projectId || !window.fetch) {
      if (sku) {
        addLog('warn', '详情自动读取物料数据已跳过', sku + ' | 未找到项目 ID');
        setApiReadStatus(sku, 'error', '未找到项目 ID');
      }
      return emptyPackaging();
    }
    setApiReadStatus(sku, 'loading', '正在读取 PLM 数据');
    if (options && options.force) delete apiProjectMaterialCache[projectId];
    if (!apiProjectMaterialCache[projectId]) {
      addLog('info', '详情自动读取 PLM 物料数据', sku + ' | projectId=' + projectId);
      const prefetchedProjectPayload = options && options.projectPayload;
      const prefetchedProduct = options && options.productSnapshot && options.productSnapshot.product;
      const projectRequest = prefetchedProjectPayload
        ? Promise.resolve({
          result: extractApiMaterialPackaging(prefetchedProjectPayload),
          project: getApiPayloadDataObject(prefetchedProjectPayload).project || getApiPayloadDataObject(prefetchedProjectPayload),
          infringement: extractApiInfringementData(prefetchedProjectPayload),
        })
        : fetchPlmJson('/api/ChemicalNew/GetProjectDetail?id=' + encodeURIComponent(projectId))
        .then((payload) => ({
          result: extractApiMaterialPackaging(payload),
          project: payload && payload.data && payload.data.project || {},
          infringement: extractApiInfringementData(payload),
        }))
        .catch((error) => {
          addLog('warn', 'PLM 项目物料读取失败，继续读取产品数据', sku + ' | ' + formatErrorMessage(error));
          return { result: emptyPackaging(), project: {}, infringement: { infringementImageUrls: [], infringementImageUrl: '', infringementImageSource: '', infringementCopywriting: '', apiFieldStates: {} } };
        });
      const productSku = sku;
      const productRequest = prefetchedProduct && typeof prefetchedProduct === 'object'
        ? Promise.resolve({ product: prefetchedProduct, failed: false })
        : productSku
        ? fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(productSku))
          .then((productPayload) => {
            const list = getApiProductListItems(productPayload);
            const product = list.find((item) => String(item && (item.product_code || item.productCode || item.code || '')).trim().toUpperCase() === String(productSku).trim().toUpperCase()) || list[0] || {};
            return { product, failed: false };
          })
          .catch((error) => {
            addLog('warn', 'PLM 产品列表读取失败', productSku + ' | ' + formatErrorMessage(error));
            return { product: {}, failed: true };
          })
        : Promise.resolve({ product: {}, failed: true });
      apiProjectMaterialCache[projectId] = Promise.all([projectRequest, productRequest])
        .then((stages) => {
          const projectStage = stages && stages[0] || {};
          const productStage = stages && stages[1] || {};
          const result = projectStage.result || emptyPackaging();
          const project = projectStage.project && typeof projectStage.project === 'object' ? projectStage.project : {};
          const infringement = projectStage.infringement || { infringementImageUrls: [], infringementImageUrl: '', infringementImageSource: '', infringementCopywriting: '', apiFieldStates: {} };
          const product = productStage.product && typeof productStage.product === 'object' ? productStage.product : {};
          const failed = Boolean(productStage.failed);
          const projectProductId = project.product_id;
          const projectProductVersionId = project.product_main_id;
          const resolvedProductSku = productSku || String(project.product_code || '');
          const projectResult = {
            ...result,
            apiProject: project,
            infringementImageUrls: infringement.infringementImageUrls,
            infringementImageUrl: infringement.infringementImageUrl,
            infringementImageSource: infringement.infringementImageSource,
            infringementCopywriting: infringement.infringementCopywriting,
            apiFieldStates: mergeApiFieldStates(result.apiFieldStates, infringement.apiFieldStates),
          };
          const categoryId = product.category_id;
          if (failed || !categoryId || (!(product.product_id || projectProductId)) || (!(product.product_version_id || projectProductVersionId))) {
            addLog('info', 'PLM 产品列表读取完成但缺少详情关联', resolvedProductSku + ' | 保留已读取物料结果');
            return projectResult;
          }
          const prefetchedContentPayload = options && options.productSnapshot && options.productSnapshot.contentPayload;
          const contentRequest = prefetchedContentPayload
            ? Promise.resolve(prefetchedContentPayload)
            : fetchPlmJson('/api/Product/GetDetailContent?is_edit=false&product_id=' + encodeURIComponent(product.product_id || projectProductId) + '&product_version_id=' + encodeURIComponent(product.product_version_id || projectProductVersionId) + '&category_id=' + encodeURIComponent(categoryId));
          return contentRequest
            .then((contentPayload) => {
              const metrics = extractApiProductMetrics(contentPayload);
              return { ...projectResult, ...metrics, apiFieldStates: mergeApiFieldStates(metrics.apiFieldStates, projectResult.apiFieldStates) };
            })
            .catch((error) => {
              addLog('warn', 'PLM 产品详情字段读取失败', resolvedProductSku + ' | ' + formatErrorMessage(error));
              return projectResult;
            });
        })
        .then((result) => {
          addLog('info', 'PLM 数据读取完成', sku + ' | 纸盒=' + (result.packageSizeText || '无') + ' | 标签/印刷=' + (result.printSizeText || '无') + ' | 净含量=' + (result.netContent || '无') + ' | 毛重=' + (result.grossWeight || '无'));
          setApiReadStatus(sku, 'success', hasApiPackagingResult(result) ? 'PLM 数据读取完成' : 'PLM 读取完成，暂无可用字段');
          return result;
        })
        .catch((error) => {
          const detail = /HTTP 401/.test(formatErrorMessage(error))
            ? formatErrorMessage(error) + ' | 请刷新 PLM 页面后重试，或检查当前账号项目权限'
            : formatErrorMessage(error);
          addLog('warn', 'PLM 物料数据读取失败', sku + ' | ' + detail);
          setApiReadStatus(sku, 'error', 'PLM 读取失败');
          return emptyPackaging();
        });
    }
    return apiProjectMaterialCache[projectId].then((result) => {
      if (state.apiReadStatus && state.apiReadStatus.sku === sku && state.apiReadStatus.phase === 'loading') {
        setApiReadStatus(sku, 'success', hasApiPackagingResult(result) ? 'PLM 数据读取完成' : 'PLM 读取完成，暂无可用字段');
      }
      return result;
    });
  }

  async function refreshMaterialFromApiWithoutDrawer(sku, seedData, options) {
    if (!state.settings.collectionEnabled || !sku) return;
    const opts = options || {};
    const indexed = state.index.find((entry) => entry && entry.sku === sku);
    const current = normalizeData(seedData || loadData(sku) || (state.data && state.data.sku === sku ? state.data : null) || indexed || { sku });
    setApiReadStatus(sku, 'loading', '正在读取 PLM 数据');
    let phase = '读取 PLM 数据';
    let merged = null;
    try {
      const apiResult = await fetchApiExcelData(current, { force: Boolean(opts.force) });
      if (!apiResult || !apiResult.found || !apiResult.data) {
        setApiReadStatus(sku, 'error', '未找到 PLM 数据');
        if (state.selectedSku === sku) showToast('PLM 未找到可更新数据', { quiet: true });
        return;
      }
      phase = '合并 PLM 数据';
      merged = normalizeData({
        ...current,
        ...apiResult.data,
        updatedAt: new Date().toLocaleString(),
        updatedAtMs: Date.now(),
      });
      phase = '保存 PLM 数据';
      saveData(sku, merged, { changeSource: 'PLM 数据服务' });
    } catch (error) {
      setApiReadStatus(sku, 'error', 'PLM 读取失败');
      addLog('warn', '搜索 SKU 自动刷新失败', sku + ' | ' + phase + ' | ' + formatErrorDiagnostic(error));
      if (state.selectedSku === sku) showToast('PLM 刷新失败，请稍后重试', { quiet: true });
      return;
    }
    setApiReadStatus(sku, 'success', 'PLM 数据读取完成');
    if (state.selectedSku === sku && merged) {
      state.data = merged;
      try {
        phase = '刷新详情界面';
        renderShell('已刷新 PLM 数据');
        phase = '显示更新提示';
        showApiDataChangeNotice(sku, current, merged);
      } catch (error) {
        addLog('error', 'PLM 数据已保存但界面刷新失败', sku + ' | ' + phase + ' | ' + formatErrorDiagnostic(error));
        showToast('PLM 数据已保存，但界面刷新失败，请重试', { quiet: true });
      }
    }
  }

  async function fetchApiExcelData(data, options) {
    const current = normalizeData(data || {});
    const sku = String(current.sku || '').trim().toUpperCase();
    if (!sku) return null;
    const opts = options || {};
    let product = null;
    let project = null;
    const initialApiResults = await Promise.all([
      fetchApiProductSnapshot({ sku }, opts).catch((error) => {
        addLog('warn', 'Excel 产品数据补全失败，继续使用页面读取', sku + ' | ' + formatErrorMessage(error));
        return null;
      }),
      fetchApiProjectSnapshot(current, opts).catch((error) => {
        addLog('info', 'Excel 项目数据补全失败，继续使用页面读取', sku + ' | ' + formatErrorMessage(error));
        return null;
      }),
    ]);
    product = initialApiResults && initialApiResults[0] || null;
    project = initialApiResults && initialApiResults[1] || null;
    const productId = String(product && (product.productId || product.product && (product.product.product_id || product.product.id)) || '');
    const productVersionId = String(product && (product.productVersionId || product.product && (product.product.product_version_id || product.product.product_main_id)) || '');
    const categoryId = String(product && (product.categoryId || product.category_id) || project && project.categoryId || '');
    const projectId = String(project && project.projectId || current.projectRowId || current.projectId || '').trim();
    const optional = product && product.optional || {};
    const optionalSeed = Object.keys(optional).reduce((result, key) => {
      if (isUsefulValue(optional[key])) result[key] = optional[key];
      return result;
    }, {});
    const productMetrics = product && product.contentPayload ? extractApiProductMetrics(product.contentPayload) : {};
    const productApiFieldStates = mergeApiFieldStates(product && product.apiFieldStates, productMetrics.apiFieldStates);
    const projectApiFieldStates = mergeApiFieldStates(
      project && project.apiFieldStates,
      project && project.found && project.referenceUrl ? { benchmarkLink: 'value' } : {},
    );
    let imageUrl = product && product.productListImageUrl || '';
    let imageFallbackUrl = imageUrl;
    if (!imageUrl && product && product.imageFileIds && product.imageFileIds.length) {
      try {
        const records = await fetchApiArchiveFileRecordsByIds(product.imageFileIds);
        const image = records.map(buildApiArchiveFileInfo)
          .filter((file) => file.url && (/\.(?:jpe?g|png|webp|bmp|gif)$/i.test(file.fileName) || /(?:jpe?g|png|webp|bmp|gif)/i.test(file.fileFormat)))
          .sort((a, b) => {
            const aSku = sku && new RegExp(escapeRegExp(sku), 'i').test(a.fileName) ? 1 : 0;
            const bSku = sku && new RegExp(escapeRegExp(sku), 'i').test(b.fileName) ? 1 : 0;
            return bSku - aSku || String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
          })[0];
        if (image) {
          imageUrl = image.url;
          imageFallbackUrl = image.url;
        }
      } catch (error) {
        addLog('info', 'Excel 产品图片附件读取失败，继续使用页面图片', sku + ' | ' + formatErrorMessage(error));
      }
    }
    const apiProductFound = Boolean(product && product.found);
    const apiProductCategoryData = {
      ...current,
      plmCategory: product && product.plmCategory || current.plmCategory || '',
      productType: product && product.productType || current.productType || '',
    };
    const toyApiPackageNums = apiProductFound && isToyDimensionProduct(apiProductCategoryData) && product.outerPackageNums
      ? product.outerPackageNums
      : null;
    const seed = normalizeData({
      ...current,
      sku,
      projectRowId: projectId || current.projectRowId || '',
      projectId: projectId || current.projectId || '',
      projectProductId: productId || current.projectProductId || '',
      productVersionId: productVersionId || current.productVersionId || '',
      name: normalizeProductNameValue(product && product.chineseName) || normalizeProductNameValue(project && project.name) || normalizeProductNameValue(current.name),
      brand: product && product.brand || project && project.brand || current.brand || '',
      englishName: product && product.englishName || current.englishName || '',
      productType: product && product.productType || current.productType || '',
      plmCategory: product && product.plmCategory || current.plmCategory || '',
      specificationText: product && product.specificationText || current.specificationText || '',
      packageNums: toyApiPackageNums || current.packageNums || null,
      packageSizeText: product && product.outerPackageSizeText && toyApiPackageNums
        ? product.outerPackageSizeText
        : current.packageSizeText || '',
      referenceUrl: product && product.referenceUrl || project && project.referenceUrl || current.referenceUrl || '',
      benchmarkLink: product && product.referenceUrl || project && project.referenceUrl || current.benchmarkLink || '',
      infringementImageUrls: product && Array.isArray(product.infringementImageUrls) && product.infringementImageUrls.length
        ? product.infringementImageUrls
        : (project && Array.isArray(project.infringementImageUrls) && project.infringementImageUrls.length
          ? project.infringementImageUrls
          : []),
      infringementImageUrl: product && product.infringementImageUrl || project && project.infringementImageUrl || '',
      infringementImageSource: product && product.infringementImageSource || project && project.infringementImageSource || '',
      infringementCopywriting: productMetrics.infringementCopywriting || product && product.infringementCopywriting || project && project.infringementCopywriting || current.infringementCopywriting || '',
      packQty: product && product.packQty || current.packQty || '',
      purchasePrice: current.purchasePrice || '',
      netContent: productMetrics.netContent || product && product.netContent || current.netContent || '',
      grossWeight: productMetrics.grossWeight || current.grossWeight || '',
      plmProductNums: apiProductFound ? (product.productNums || null) : (current.plmProductNums || null),
      productListImageUrl: imageUrl || current.productListImageUrl || '',
      productListImageFallbackUrl: imageFallbackUrl || current.productListImageFallbackUrl || '',
      skuImageUrl: imageUrl || current.skuImageUrl || '',
      skuImageFallbackUrl: imageFallbackUrl || current.skuImageFallbackUrl || '',
      skuImageSource: imageUrl ? 'productListImage' : current.skuImageSource || '',
      apiFieldStates: mergeApiFieldStates(productApiFieldStates, projectApiFieldStates),
      ...optionalSeed,
    });
    let material = emptyPackaging();
    if (getProjectIdForMaterialApi(seed)) {
      try {
        material = await fetchApiMaterialPackaging(seed, {
          force: Boolean(opts.force),
          projectPayload: project && project.projectPayload,
          productSnapshot: product,
        });
      } catch (error) {
        addLog('warn', 'Excel 物料数据补全失败，继续使用页面读取', sku + ' | ' + formatErrorMessage(error));
      }
    }
    const apiSingleBottle = Boolean(current.singleBottle || isApiSingleBottleProduct(product, seed, material));
    const apiBottleNums = apiSingleBottle
      ? (product && product.outerPackageNums || current.bottleNums || current.productNums || null)
      : null;
    const apiNetContentValue = productMetrics.netContent || material && material.netContent || product && product.netContent || '';
    const resolvedNetContent = apiNetContentValue || current.netContent || '';
    const projectDetail = material && material.apiProject || {};
    const projectPayloadData = project && project.projectPayload ? getApiPayloadDataObject(project.projectPayload) : null;
    const projectObjects = [
      project,
      project && project.raw,
      project && project.projectPayload,
      projectPayloadData,
      projectPayloadData && projectPayloadData.project,
      projectDetail,
      projectDetail && projectDetail.project,
    ];
    const projectCartonSpec = getApiObjectFieldValue(projectObjects, ['carton_spec', 'cartonSpec', 'outer_carton_spec', 'outerCartonSpec', 'carton_size', 'cartonSize', 'outer_box_spec', 'outerBoxSpec', 'box_spec', 'boxSpec']);
    const projectPackageMaterial = getApiObjectFieldValue(projectObjects, ['package_material', 'packageMaterial', 'packaging_material', 'packagingMaterial', 'material']);
    const projectLeadTimeText = getApiObjectFieldValue(projectObjects, ['lead_time', 'leadTime', 'delivery_text', 'deliveryText', 'delivery_note', 'deliveryNote', 'delivery_time', 'deliveryTime', 'shipping_time', 'shippingTime']);
    const projectAlibabaLink = getApiObjectFieldValue(projectObjects, ['alibaba_link', 'alibabaLink', '1688_link', '1688Link', 'alibaba_url', 'alibabaUrl'])
      .match(/https?:\/\/[^\s]+/i)?.[0] || '';
    const projectOptionalResolved = Boolean(product && product.found || project && project.found || projectDetail && Object.keys(projectDetail).length);
    const projectOptionalFieldStates = {
      cartonSpec: getApiFieldState(seed.cartonSpec || projectCartonSpec, projectOptionalResolved),
      packageMaterial: getApiFieldState(seed.packageMaterial || projectPackageMaterial, projectOptionalResolved),
      leadTimeText: getApiFieldState(seed.leadTimeText || projectLeadTimeText, projectOptionalResolved),
      alibabaLink: getApiFieldState(seed.alibabaLink || projectAlibabaLink, projectOptionalResolved),
    };
    // Only the explicitly named domestic third-tier field is trusted for Excel.
    // Procurement/reference prices from other product endpoints have different semantics.
    const apiPurchasePrice = extractApiDomesticThirdTierPrice(projectObjects);
    const projectReferenceUrl = getApiObjectFieldValue(projectObjects, ['reference_url', 'referenceUrl', 'benchmark_url', 'benchmarkUrl', 'benchmark_link', 'benchmarkLink', 'alibaba_link', 'alibabaLink'])
      .match(/https?:\/\/[^\s]+/i)?.[0] || '';
    const projectPackQty = normalizePackQty(getApiObjectFieldValue(projectObjects, ['pack_qty', 'packQty', 'pack_count', 'packCount', 'carton_qty', 'cartonQty']));
    const merged = normalizeData({
      ...mergeApiPackagingData(seed, material),
      singleBottle: apiSingleBottle,
      bottleNums: apiBottleNums,
      specificationText: product && product.specificationText || seed.specificationText || '',
      netContent: resolvedNetContent,
      ...(toyApiPackageNums ? {
        packageNums: toyApiPackageNums,
        packageSizeText: product.outerPackageSizeText || formatApiDimensionText(toyApiPackageNums),
      } : {}),
      apiFieldStates: mergeApiFieldStates(
        seed.apiFieldStates,
        material.apiFieldStates,
        projectOptionalFieldStates,
        apiBottleNums ? { productSize: 'value' } : {},
        apiNetContentValue ? { netContent: 'value' } : {},
        toyApiPackageNums ? { packageSize: 'value' } : {},
      ),
      packageSource: toyApiPackageNums
        ? 'plm-product-detail'
        : resolveApiMaterialPackageSource(seed, material),
      referenceUrl: seed.referenceUrl || projectReferenceUrl || current.referenceUrl || '',
      benchmarkLink: seed.benchmarkLink || projectReferenceUrl || current.benchmarkLink || '',
      cartonSpec: seed.cartonSpec || projectCartonSpec || current.cartonSpec || '',
      packageMaterial: seed.packageMaterial || projectPackageMaterial || current.packageMaterial || '',
      leadTimeText: seed.leadTimeText || projectLeadTimeText || current.leadTimeText || '',
      alibabaLink: seed.alibabaLink || projectAlibabaLink || current.alibabaLink || '',
      packQty: seed.packQty || projectPackQty || current.packQty || '',
      purchasePrice: seed.purchasePrice || apiPurchasePrice || current.purchasePrice || '',
      purchasePriceSource: seed.purchasePrice
        ? (seed.purchasePriceSource || current.purchasePriceSource || '')
        : (apiPurchasePrice ? 'plm-api-domestic-third-tier' : (current.purchasePriceSource || '')),
      purchasePriceUpdatedAt: seed.purchasePrice
        ? (seed.purchasePriceUpdatedAt || current.purchasePriceUpdatedAt || '')
        : (apiPurchasePrice ? new Date().toLocaleString() : (current.purchasePriceUpdatedAt || '')),
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    });
    if (apiPurchasePrice && !normalizeLedgerPurchasePrice(current.purchasePrice)) {
      addLog('success', 'Excel 已读取国内三档价格', sku + ' | ' + apiPurchasePrice);
    }
    let ingredientFile = null;
    if (product && product.contentPayload) {
      try {
        ingredientFile = await findApiIngredientPdfFromContent(product.contentPayload, sku);
      } catch (error) {
        addLog('info', 'Excel 成分表附件读取失败，继续使用页面附件', sku + ' | ' + formatErrorMessage(error));
      }
    }
    const apiDataAvailable = Boolean(product && product.found || project && project.found || hasApiPackagingResult(material));
    return {
      found: apiDataAvailable,
      data: merged,
      product,
      project,
      ingredientFile,
      englishName: product && product.englishName || merged.englishName || '',
      chineseName: product && product.chineseName || merged.name || '',
      benchmarkLink: merged.benchmarkLink || merged.referenceUrl || '',
      imageUrl,
      imageFallbackUrl,
      isSkuDesignImage: Boolean(imageUrl && isStrictDesignImageUrl(imageUrl)),
      skuImageUrl: imageUrl,
      skuImageFallbackUrl: imageFallbackUrl,
      skuImageSource: imageUrl ? 'productListImage' : '',
      apiFieldStates: merged.apiFieldStates,
      apiResolved: hasApiResolvedFields(merged),
      productId,
      productVersionId,
      categoryId,
      projectId,
    };
  }
