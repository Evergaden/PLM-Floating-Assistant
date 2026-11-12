
  async function buildProductDevelopmentDocx(content, templateSource, snapshot) {
    snapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
    // 盒装（外包装长宽高齐全）→ 删除袋装窒息标识行；尺寸缺失 → 弹窗让用户选择。
    if (snapshot.packagingKind !== 'boxed' && snapshot.packagingKind !== 'bagged') {
      snapshot.packagingKind = await productDevelopmentResolvePackagingKind(snapshot).catch(() => 'bagged');
    }
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
