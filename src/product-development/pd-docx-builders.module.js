
  async function buildProductDevelopmentDocx(content, templateSource, snapshot) {
    snapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
    // The inline packaging setting overrides detection; missing dimensions need an explicit selection.
    snapshot.packagingKind = await productDevelopmentResolvePackagingKind(snapshot);
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
      directions: productDevelopmentFindRow(rows, [/食用方法/i, /建议使用方法/i, /DIRECTIONS?/i]),
      warnings: productDevelopmentFindRow(rows, [/警告语/i, /WARNINGS?/i]),
      efficacy: productDevelopmentFindRow(rows, [/^A[.．、)]?产品功效/i, /产品功效/i]),
      advantages: productDevelopmentFindRow(rows, [/^B[.．、)]?产品优势/i, /产品优势/i]),
      sellingPoints: productDevelopmentFindRow(rows, [/^C[.．、)]?产品卖点/i, /产品卖点/i]),
      ingredientFunctions: productDevelopmentFindRow(rows, [/^D[.．、)]?成分功能/i, /成分功能/i]),
    };
    const findRowByCellText = (patterns) => rows.find((row) => productDevelopmentXmlElements(row, 'tc').some((cell) => patterns.some((pattern) => pattern.test(productDevelopmentCellText(cell))))) || null;
    const disclaimer = findRowByCellText([/These statements have not been evaluated by the Food and Drug Administration/i, /FDA.*免责声明/i, /FDA.*声明/i]);
    const dietarySupplement = findRowByCellText([/^DIETARY\\s+SUPPLEMENT$/i, /膳食补充剂/]);
    const baggedWarningRow = findRowByCellText([/袋装窒息标识/]);
    if (baggedWarningRow && snapshot.packagingKind === 'boxed') {
      if (baggedWarningRow.parentNode) baggedWarningRow.parentNode.removeChild(baggedWarningRow);
      const baggedRowIndex = rows.indexOf(baggedWarningRow);
      if (baggedRowIndex >= 0) rows.splice(baggedRowIndex, 1);
      productDevelopmentLog('info', '盒装产品：已删除袋装窒息标识行', snapshot.sku || '');
    }
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
        productDevelopmentSetCellHeadingAndLines(cells[1], productNamePrefix, [englishName], doc);
      }
      if (cells[2] && chineseName) productDevelopmentSetCellLines(cells[2], [chineseName], doc);
    }
    const referenceUrl = productDevelopmentCopywritingReferenceUrl(snapshot);
    if (targets.referenceUrl && referenceUrl) {
      const cells = productDevelopmentXmlElements(targets.referenceUrl, 'tc');
      if (cells[1]) productDevelopmentSetCellLines(cells[1], [referenceUrl], doc);
    }
    const labeling = snapshot && snapshot.labeling && typeof snapshot.labeling === 'object' ? { ...snapshot.labeling } : {};
    const directions = Array.isArray(content.directions) ? content.directions : [];
    const usage = snapshot.sourceCopywriting && snapshot.sourceCopywriting.usage || {};
    labeling.directionsEn = labeling.directionsEn || usage.en || productDevelopmentSectionLines(directions, (item, index) => index + '. ' + item.en).join('\n');
    labeling.directionsCn = labeling.directionsCn || usage.cn || productDevelopmentSectionLines(directions, (item, index) => index + '、' + item.cn).join('\n');
    const ingredientTable = snapshot && snapshot.ingredientTable && typeof snapshot.ingredientTable === 'object' ? snapshot.ingredientTable : null;
    const hasLabeling = Boolean(snapshot.labeling && Object.values(snapshot.labeling).some((value) => String(value || '').trim()));
    const hasIngredientTable = Boolean(ingredientTable && Object.values(ingredientTable).some((value) => String(value || '').trim()));
    if (targets.directions && (labeling.directionsEn || labeling.directionsCn)) {
      productDevelopmentSetDirectionsCells(productDevelopmentXmlElements(targets.directions, 'tc'), labeling, doc);
    }
    if (snapshot.copywritingCategory !== 'regular' && (hasLabeling || hasIngredientTable)) {
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
    const efficacyPrefix = productDevelopmentCellHeadingPrefix(efficacyCells[1], /\b(?:FUNCTIONS?|USES?)\b/i);
    if (efficacyPrefix) {
      productDevelopmentSetCellHeadingAndLines(efficacyCells[1], efficacyPrefix, efficacyEnglish, doc);
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
    if (snapshot && snapshot.copywritingCategory === 'regular') {
      // 常规产品（非食品）模板：功效内容同时写入“24国语言功效内容”行，
      // 成分写入“成分表 / 成分活性”行，按行标签决定使用 INGREDIENTS 还是 ACTIVE/INACTIVE 前缀。
      // 24国语言行按参考模板填英文产品名的 24 国语言翻译（分号分隔），中文列留空。
      const efficacyContentRow = findRowByCellText([/24国语言功效内容/]);
      if (efficacyContentRow) {
        try {
          const translations = Array.isArray(content.productNameTranslations)
            ? content.productNameTranslations.filter(Boolean)
            : [];
          const cells24 = productDevelopmentXmlElements(efficacyContentRow, 'tc');
          if (cells24[1] && translations.length) {
            productDevelopmentSetCellLines(cells24[1], [translations.join(';')], doc);
          }
        } catch (regularEfficacyError) {
          productDevelopmentLog('warn', '常规产品24国语言行写入失败', formatErrorMessage(regularEfficacyError));
        }
      }
      const regularIngredients = snapshot.regularIngredients && typeof snapshot.regularIngredients === 'object'
        ? snapshot.regularIngredients
        : null;
      const regularIngredientRow = findRowByCellText([/成分表/, /成分活性/]);
      if (regularIngredientRow && regularIngredients) {
        const ingredientCells = productDevelopmentXmlElements(regularIngredientRow, 'tc');
        if (ingredientCells.length >= 4) {
          const isNdcIngredientRow = /成分活性|ACTIVE/i.test(productDevelopmentCellText(ingredientCells[0]) + ' ' + productDevelopmentCellText(ingredientCells[1]));
          const activeEn = Array.isArray(regularIngredients.activeEn) ? regularIngredients.activeEn.filter(Boolean) : [];
          const inactiveEn = Array.isArray(regularIngredients.inactiveEn) ? regularIngredients.inactiveEn.filter(Boolean) : [];
          const activeCn = Array.isArray(regularIngredients.activeCn) ? regularIngredients.activeCn.filter(Boolean) : [];
          const inactiveCn = Array.isArray(regularIngredients.inactiveCn) ? regularIngredients.inactiveCn.filter(Boolean) : [];
          if (isNdcIngredientRow) {
            // One paragraph per group. Keep the template headings (including
            // their styled runs) and append the 顿号-separated list right after
            // the colon, matching the reference copy deck.
            const enHeadings = productDevelopmentIngredientHeadings(ingredientCells[1], 'en');
            const cnHeadings = productDevelopmentIngredientHeadings(ingredientCells[2], 'cn');
            const enGroups = [];
            if (activeEn.length) enGroups.push({ heading: productDevelopmentIngredientHeading(enHeadings.active, activeEn.length), body: activeEn.join('、') });
            if (inactiveEn.length) enGroups.push({ heading: productDevelopmentIngredientHeading(enHeadings.inactive, inactiveEn.length), body: inactiveEn.join('、') });
            if (enGroups.length) productDevelopmentSetCellIngredientGroups(ingredientCells[1], enGroups, doc);
            const cnGroups = [];
            if (activeCn.length) cnGroups.push({ heading: cnHeadings.active, body: activeCn.join('、') });
            if (inactiveCn.length) cnGroups.push({ heading: cnHeadings.inactive, body: inactiveCn.join('、') });
            if (!cnGroups.length) {
              // Cached results created before the active/inactive split only
              // have one merged Chinese value.
              const legacyCn = String(regularIngredients.cn || '').trim();
              if (legacyCn) cnGroups.push({ heading: cnHeadings.active, body: legacyCn });
            }
            if (cnGroups.length) productDevelopmentSetCellIngredientGroups(ingredientCells[2], cnGroups, doc);
          } else {
            const allEn = activeEn.concat(inactiveEn);
            if (allEn.length) productDevelopmentSetCellHeadingAndLines(ingredientCells[1], productDevelopmentIngredientHeading(productDevelopmentCellHeadingPrefix(ingredientCells[1], /\bINGREDIENTS?\b/i) || 'INGREDIENTS:', allEn.length), [allEn.join('、')], doc);
            const regularCnText = String(regularIngredients.cn || activeCn.concat(inactiveCn).join('、')).trim();
            if (regularCnText) productDevelopmentSetCellLines(ingredientCells[2], [regularCnText], doc);
          }
        }
      }
    }
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

  function productDevelopmentCopywritingUpdatePlan(result) {
    const sku = getProductDevelopmentCurrentSku();
    if (!result) throw new Error('暂无可下载的文案');
    const snapshot = JSON.parse(JSON.stringify(result.snapshot || { sku }));
    const content = JSON.parse(JSON.stringify(result.content));
    if (result.sku !== sku && result.fromHistory) return { snapshot, content, changed: false };
    if (result.sku !== sku) throw new Error('请先打开该文案对应的 SKU');
    const detail = state.productDevelopmentTaskFormData && state.productDevelopmentTaskFormData[sku];
    const task = getProductDevelopmentTaskBySku(sku) || { sku };
    const meta = getProductDevelopmentTaskMeta(task, detail);
    const readName = (key, fallback) => productDevelopmentCleanText(meta[key] || detail && productDevelopmentPage1FieldValue(detail, key) || fallback, 300);
    snapshot.englishName = readName('productNameEn', snapshot.englishName);
    snapshot.name = readName('productNameCn', snapshot.name);
    snapshot.brand = readName('brand', snapshot.brand);
    const translateName = snapshot.englishName !== String(result.snapshot && result.snapshot.englishName || '')
      && (snapshot.copywritingCategory === 'regular' || Array.isArray(content.productNameTranslations) && content.productNameTranslations.length > 0);
    let ingredientsChanged = false;
    let targets = null;
    let removed = [];
    const input = state.productDevelopmentOneShotInput;
    if (snapshot.copywritingCategory === 'regular' && input && input.sku === sku) {
      const parse = (key) => productDevelopmentParseRegularIngredientText(input[key]);
      const active = parse('regularIngredientsEn');
      const inactive = parse('regularIngredientsInactiveEn');
      const activeCn = parse('regularIngredientsCn').map((pair) => pair.cn).filter(Boolean);
      const inactiveCn = parse('regularIngredientsInactiveCn').map((pair) => pair.cn).filter(Boolean);
      const regular = { activeEn: active.map((pair) => pair.en).filter(Boolean), inactiveEn: inactive.map((pair) => pair.en).filter(Boolean), activeCn, inactiveCn, cn: activeCn.concat(inactiveCn).join('、') };
      const previous = snapshot.regularIngredients;
      // Empty untouched drafts from old caches must not erase their saved table.
      const hasDraft = active.length || inactive.length || activeCn.length || inactiveCn.length || state.productDevelopmentCopywritingDirtySku === sku;
      if (hasDraft && JSON.stringify(regular) !== JSON.stringify(previous)) {
        if (!active.length && !inactive.length) throw new Error('成分不能为空，原文案已保留');
        ingredientsChanged = true;
        snapshot.regularIngredients = regular;
        const pairs = active.map((pair, index) => ({ en: pair.en, cn: activeCn[index] || pair.cn })).concat(inactive.map((pair, index) => ({ en: pair.en, cn: inactiveCn[index] || pair.cn })));
        const key = (value) => String(value || '').trim().toLowerCase();
        const all = new Map(pairs.filter((pair) => pair.en).map((pair) => [key(pair.en), pair]));
        const old = Array.isArray(content.ingredientFunctions) ? content.ingredientFunctions : [];
        const retained = old.map((item) => all.get(key(item.ingredientEn)) || pairs.find((pair) => pair.cn && key(pair.cn) === key(item.ingredientCn))).filter(Boolean);
        const selected = new Map(retained.map((pair) => [key(pair.en), pair]));
        productDevelopmentRegularHeroIngredients(pairs).forEach((pair) => { if (selected.size < 4) selected.set(key(pair.en), pair); });
        targets = Array.from(selected.values()).map((pair) => {
          const existing = old.find((item) => key(item.ingredientEn) === key(pair.en) || pair.cn && key(item.ingredientCn) === key(pair.cn));
          return { pair, existing: existing ? { ...existing, ingredientEn: pair.en, ingredientCn: pair.cn || existing.ingredientCn } : null };
        });
        const previousNames = previous ? (previous.activeEn || []).concat(previous.inactiveEn || []) : old.map((item) => item.ingredientEn);
        const previousCn = previous ? (previous.activeCn || []).concat(previous.inactiveCn || []) : old.map((item) => item.ingredientCn);
        removed = previousNames.flatMap((name, index) => !all.has(key(name)) ? [name, previousCn[index]].filter(Boolean) : []);
      }
    }
    const oneShot = state.productDevelopmentOneShotResult;
    if (snapshot.copywritingCategory !== 'regular' && oneShot && oneShot.sku === sku && (result.id === oneShot.id || result.id === oneShot.id + '-copy')) {
      const table = productDevelopmentOneShotConfirmedIngredientTable(oneShot);
      const pairs = productDevelopmentOneShotConfirmedIngredients(oneShot);
      if (!pairs.length || pairs.some((pair) => !pair.en)) throw new Error('请先填写完整的成分名称，原文案已保留');
      snapshot.ingredientTable = { ...snapshot.ingredientTable, otherIngredientsEn: table.otherIngredientsEn, otherIngredientsCn: table.otherIngredientsCn };
      const old = content.ingredientFunctions || [];
      const previous = snapshot.ingredients || old.map((item) => ({ en: item.ingredientEn, cn: item.ingredientCn }));
      ingredientsChanged = JSON.stringify(snapshot.ingredientTable) !== JSON.stringify(result.snapshot && result.snapshot.ingredientTable || {}) || JSON.stringify(pairs) !== JSON.stringify(previous);
      snapshot.ingredients = pairs;
      if (ingredientsChanged) {
        targets = pairs.map((pair) => {
          const existing = old.find((item) => item.ingredientEn.toLowerCase() === pair.en.toLowerCase() || pair.cn && item.ingredientCn === pair.cn);
          return { pair, existing: existing ? { ...existing, ingredientEn: pair.en, ingredientCn: pair.cn || existing.ingredientCn } : null };
        });
        removed = previous.filter((pair) => !pairs.some((item) => item.en.toLowerCase() === pair.en.toLowerCase())).flatMap((pair) => [pair.en, pair.cn].filter(Boolean));
      }
    }
    const changed = ingredientsChanged || snapshot.englishName !== String(result.snapshot && result.snapshot.englishName || '') || snapshot.name !== String(result.snapshot && result.snapshot.name || '') || snapshot.brand !== String(result.snapshot && result.snapshot.brand || '');
    return { snapshot, content, translateName, targets, removed, changed, signature: JSON.stringify([snapshot, targets, result.content]) };
  }

  async function productDevelopmentUpdateCopywritingForDownload(result) {
    const plan = productDevelopmentCopywritingUpdatePlan(result);
    if (!plan.changed) return result;
    const missing = plan.targets ? plan.targets.filter((item) => !item.existing).map((item) => item.pair) : [];
    if (plan.translateName || missing.length) {
      const response = await withCopywritingTimeout(cloudRequest('/ai-image/product-development-copywriting', {
        method: 'POST', timeoutMs: 300000,
        body: { mode: 'partial-update', sku: result.sku, englishName: plan.snapshot.englishName, translateName: plan.translateName, ingredients: missing, copywritingCategory: plan.snapshot.copywritingCategory || 'food' },
      }), 320000, '局部更新文案');
      const patch = response && response.patch;
      if (!patch) throw new Error('局部更新未返回结果，原文案已保留');
      if (plan.translateName) {
        if (!Array.isArray(patch.productNameTranslations) || patch.productNameTranslations.length !== 24 || patch.productNameTranslations.some((item) => typeof item !== 'string' || !item.trim())) throw new Error('24 国名称翻译不完整，原文案已保留');
        if (patch.productNameTranslations[0].trim().toLowerCase() !== plan.snapshot.englishName.toLowerCase()) throw new Error('名称翻译与当前英文名不符，原文案已保留');
        plan.content.productNameTranslations = patch.productNameTranslations;
      }
      if (missing.length) {
        if (!Array.isArray(patch.ingredientFunctions) || patch.ingredientFunctions.length !== missing.length) throw new Error('成分功能更新不完整，原文案已保留');
        missing.forEach((pair, index) => {
          const item = patch.ingredientFunctions[index];
          if (!item || item.ingredientEn !== pair.en || !String(item.en || '').trim() || !String(item.cn || '').trim()) throw new Error('成分功能与输入不匹配，原文案已保留');
        });
        let index = 0;
        plan.targets.forEach((item) => { if (!item.existing) item.existing = patch.ingredientFunctions[index++]; });
      }
    }
    if (plan.targets) plan.content.ingredientFunctions = plan.targets.map((item) => item.existing);
    if (productDevelopmentCopywritingUpdatePlan(result).signature !== plan.signature) throw new Error('资料在更新期间发生变化，请再次下载；原文案已保留');
    const protectedText = JSON.stringify(['efficacy', 'advantages', 'sellingPoints', 'directions'].map((key) => plan.content[key])).toLowerCase();
    const mentioned = plan.removed.filter((name) => protectedText.includes(String(name).toLowerCase()));
    result.snapshot = plan.snapshot;
    result.content = plan.content;
    result.blob = null;
    result.docxBlob = null;
    result.fileName = productDevelopmentCopywritingFileName(plan.snapshot);
    result.docxFileName = result.fileName;
    result.updatedAt = Date.now();
    result.partialUpdateWarning = mentioned.length ? '保留文案中仍提到已移除成分：' + mentioned.join('、') + '，请核对。' : '';
    state.productDevelopmentCopywritingDirtySku = '';
    saveProductDevelopmentCopywritingCache(result);
    const oneShot = state.productDevelopmentOneShotResult;
    if (oneShot && (result.id === oneShot.id || result.id === oneShot.id + '-copy')) {
      oneShot.snapshot = result.snapshot;
      oneShot.content = result.content;
      oneShot.docxBlob = null;
      oneShot.docxFileName = result.fileName;
    }
    return result;
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

  async function productDevelopmentTraceDocxBlob(blob) {
    await ensureCurrentTraceNameInitials();
    const codec = productDevelopmentDocxCodec();
    if (!codec) throw new Error('DOCX 水印组件未加载，请刷新页面后重试');
    const entries = codec.unzipSync(new Uint8Array(await blob.arrayBuffer()));
    if (!entries['word/document.xml'] || !entries['[Content_Types].xml']) throw new Error('文案文件不是完整的 DOCX，请重新生成');
    const parse = (file, initial) => {
      const doc = new DOMParser().parseFromString(entries[file] ? codec.strFromU8(entries[file]) : initial, 'application/xml');
      if (doc.getElementsByTagName('parsererror').length) throw new Error('DOCX 文档属性格式异常：' + file);
      return doc;
    };
    const store = (file, doc) => { entries[file] = codec.strToU8(new XMLSerializer().serializeToString(doc)); };
    const relNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const coreType = 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties';
    const rels = parse('_rels/.rels', '<Relationships xmlns="' + relNs + '"/>');
    let relation = Array.from(rels.getElementsByTagNameNS(relNs, 'Relationship')).find((item) => item.getAttribute('Type') === coreType);
    const coreFile = relation ? String(relation.getAttribute('Target') || '').replace(/^\//, '') : 'docProps/core.xml';
    if (!coreFile || coreFile.includes('..') || relation && relation.getAttribute('TargetMode') === 'External') throw new Error('DOCX 文档属性路径异常');
    if (!relation) {
      relation = rels.createElementNS(relNs, 'Relationship');
      const ids = new Set(Array.from(rels.getElementsByTagNameNS(relNs, 'Relationship')).map((item) => item.getAttribute('Id')));
      let id = 'rIdPfhTrace';
      while (ids.has(id)) id += '1';
      relation.setAttribute('Id', id); relation.setAttribute('Type', coreType); relation.setAttribute('Target', coreFile);
      rels.documentElement.appendChild(relation);
    }
    const cp = 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties';
    const dc = 'http://purl.org/dc/elements/1.1/';
    const dt = 'http://purl.org/dc/terms/';
    const core = parse(coreFile, '<cp:coreProperties xmlns:cp="' + cp + '" xmlns:dc="' + dc + '" xmlns:dcterms="' + dt + '" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>');
    const date = new Date();
    const trace = buildExcelTraceWatermark(date);
    for (const [ns, name, value] of [[dc, 'dc:creator', trace], [cp, 'cp:lastModifiedBy', trace], [dc, 'dc:subject', trace], [dc, 'dc:description', trace], [cp, 'cp:keywords', trace], [dt, 'dcterms:created', date.toISOString()], [dt, 'dcterms:modified', date.toISOString()]]) {
      const matches = Array.from(core.getElementsByTagNameNS(ns, name.split(':')[1]));
      const node = matches.shift() || core.createElementNS(ns, name);
      matches.forEach((duplicate) => duplicate.parentNode.removeChild(duplicate));
      node.textContent = value;
      if (ns === dt) node.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcterms:W3CDTF');
      if (!node.parentNode) core.documentElement.appendChild(node);
    }
    const typesNs = 'http://schemas.openxmlformats.org/package/2006/content-types';
    const types = parse('[Content_Types].xml', '<Types xmlns="' + typesNs + '"/>');
    let override = Array.from(types.getElementsByTagNameNS(typesNs, 'Override')).find((item) => item.getAttribute('PartName') === '/' + coreFile);
    if (!override) { override = types.createElementNS(typesNs, 'Override'); override.setAttribute('PartName', '/' + coreFile); types.documentElement.appendChild(override); }
    override.setAttribute('ContentType', 'application/vnd.openxmlformats-package.core-properties+xml');
    store(coreFile, core); store('_rels/.rels', rels); store('[Content_Types].xml', types);
    return new Blob([codec.zipSync(entries, { level: 0 })], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  async function downloadProductDevelopmentCopywritingResult() {
    let result = state.productDevelopmentCopywriting || restoreProductDevelopmentCopywritingCache(getProductDevelopmentCurrentSku());
    if (!result || !result.content) throw new Error('暂无可下载的 DOCX');
    if (state.productDevelopmentCopywritingBusy || state.productDevelopmentOneShotBusy) return;
    const plan = productDevelopmentCopywritingUpdatePlan(result);
    const handle = await chooseCopywritingSaveTarget(productDevelopmentCopywritingFileName(plan.snapshot));
    if (!handle) return;
    if (plan.changed || !result.blob) {
      state.productDevelopmentCopywritingBusy = true;
      state.productDevelopmentStatus = '正在更新并生成文案 DOCX，其他文案保留…';
      state.productDevelopmentError = '';
      renderShell();
      try {
        result = await productDevelopmentUpdateCopywritingForDownload(result);
        result = await rebuildProductDevelopmentCachedDocx(result);
        state.productDevelopmentStatus = '本地缓存 DOCX 已恢复，可继续下载';
      } finally {
        state.productDevelopmentCopywritingBusy = false;
        renderShell();
      }
    }
    await writeImageBlobToFileHandle(handle, await productDevelopmentTraceDocxBlob(result.blob));
    state.productDevelopmentStatus = result.partialUpdateWarning || '文案已保存，其他文案保留';
    showToast(result.partialUpdateWarning || '文案已保存');
  }
