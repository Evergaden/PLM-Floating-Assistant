
  async function runProductDevelopmentIngredientTable() {
    if (state.productDevelopmentOneShotBusy) return;
    const currentSku = getProductDevelopmentCurrentSku();
    if (!currentSku) {
      showToast('请先在编辑文案页选择当前 SKU');
      return;
    }
    if (state.productDevelopmentCopywritingBusy) {
      productDevelopmentLog('warn', '忽略成分表生成请求', currentSku + ' | PLM 成分表文案仍在生成');
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
      stage = '生成 文案';
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
      stage = '校验 文案';
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

  async function runProductDevelopmentRegularCopywriting() {
    if (state.productDevelopmentCopywritingBusy || state.productDevelopmentOneShotBusy) return;
    const sku = getProductDevelopmentCurrentSku();
    if (!sku) {
      showToast('请先在编辑文案页选择当前 SKU');
      return;
    }
    const input = state.productDevelopmentOneShotInput && typeof state.productDevelopmentOneShotInput === 'object'
      ? state.productDevelopmentOneShotInput
      : productDevelopmentOneShotLoadDraft();
    const isNdc = productDevelopmentEffectiveRegularNdcKind() === 'ndc';
    const activeEnPairs = productDevelopmentParseRegularIngredientText(input.regularIngredientsEn);
    // Parse inactive ingredients unconditionally. The selected DOCX template,
    // not the NDC dropdown state, decides whether they get their own group; a
    // stale dropdown value must never silently discard what the user typed.
    const inactivePairs = productDevelopmentParseRegularIngredientText(input.regularIngredientsInactiveEn);
    const cnActiveNames = productDevelopmentParseRegularIngredientText(input.regularIngredientsCn).map((pair) => pair.cn).filter(Boolean);
    const cnInactiveNames = productDevelopmentParseRegularIngredientText(input.regularIngredientsInactiveCn).map((pair) => pair.cn).filter(Boolean);
    // activePairs is the combined working list for hero ingredients and the AI
    // prompt; activeEnPairs stays pure for the ACTIVE INGREDIENTS row.
    const activePairs = activeEnPairs.slice();
    const dedupeKeys = new Set(activePairs.map((pair) => productDevelopmentNormalizedClaimText(pair.en || pair.cn)).filter(Boolean));
    inactivePairs.forEach((pair) => {
      const key = productDevelopmentNormalizedClaimText(pair.en || pair.cn);
      if (!key || dedupeKeys.has(key)) return;
      dedupeKeys.add(key);
      activePairs.push(pair);
    });
    if (!activePairs.length) {
      showToast(isNdc ? '请先填写活性成分或非活性成分（英文，逗号或换行分隔）' : '请先填写成分（英文，逗号或换行分隔）');
      return;
    }
    const heroPairs = productDevelopmentRegularHeroIngredients(activePairs);
    const cnSummary = cnActiveNames.concat(cnInactiveNames).join('、');
    state.productDevelopmentCopywritingBusy = true;
    state.productDevelopmentError = '';
    const startedAt = Date.now();
    let stage = '准备';
    state.productDevelopmentStatus = '正在读取当前 SKU 产品资料…';
    productDevelopmentLog('info', '开始常规产品文案生成', sku + ' | NDC=' + (isNdc ? '涉NDC' : '非NDC') + ' | 成分=' + activePairs.length + ' 项 | D 卖点成分=' + heroPairs.map((pair) => pair.en || pair.cn).join(' / '));
    renderShell();
    try {
      stage = '读取 PLM 产品资料';
      const snapshot = await withCopywritingTimeout(
        loadProductDevelopmentSnapshot(sku, false, { requireIngredients: false, includeImage: false }),
        180000,
        '产品资料读取',
      );
      state.productDevelopmentSnapshot = snapshot;
      const referenceUrl = /^https?:\/\//i.test(String(snapshot.referenceUrl || '')) ? String(snapshot.referenceUrl) : '';
      const copywritingTemplate = resolveProductDevelopmentCopywritingTemplate();
      stage = '加载 DOCX 模板';
      state.productDevelopmentStatus = copywritingTemplate.local
        ? '正在读取本地 DOCX 模板…'
        : '正在从云端加载“' + copywritingTemplate.label + '”文案模板…';
      renderShell();
      const templateSource = await withCopywritingTimeout(
        loadProductDevelopmentCopywritingTemplateSource(copywritingTemplate),
        60000,
        'DOCX 模板下载',
      );
      state.productDevelopmentStatus = '正在生成常规产品 文案（D 成分功能取 3-4 条卖点成分，每条 10-15 词），最长等待约 10 分钟…';
      renderShell();
      stage = 'AI 生成完整文案';
      const regularSnapshot = {
        ...snapshot,
        productType: input.productType || snapshot.productType || 'Cosmetic / personal care product',
        referenceUrl,
        ingredients: heroPairs,
        copywritingCategory: 'regular',
      };
      const response = await withCopywritingTimeout(cloudRequest('/ai-image/product-development-copywriting', {
        method: 'POST',
        timeoutMs: 600000,
        body: {
          sku: snapshot.sku,
          name: snapshot.name,
          englishName: regularSnapshot.englishName || snapshot.englishName || '',
          productType: regularSnapshot.productType,
          brand: snapshot.brand,
          ingredients: heroPairs,
          ingredientSummary: {
            en: activePairs.map((pair) => pair.en).filter(Boolean).join(', '),
            cn: cnSummary,
          },
          ingredientFunctions: {
            en: snapshot.ingredientFunctions && snapshot.ingredientFunctions.en || '',
            cn: snapshot.ingredientFunctions && snapshot.ingredientFunctions.cn || '',
            policy: '常规产品（非食品）：输入 ingredients 已预先筛好 3-4 条最有卖点的成分，D 成分功能必须按输入顺序逐条覆盖全部输入成分，每条英文 10-15 个单词，突出该成分卖点。',
          },
          sourcePlainTextCopy: snapshot.sourcePlainTextCopy || productDevelopmentOneShotPlainTextCopy(sku, snapshot),
          sourceCopywriting: snapshot.sourceCopywriting,
          templateVersion: copywritingTemplate.version,
          templateId: copywritingTemplate.id,
          templateLabel: copywritingTemplate.label,
          copywritingCategory: 'regular',
          regularNdcKind: isNdc ? 'ndc' : 'non-ndc',
          regularIngredients: {
            activeEn: activeEnPairs.filter((pair) => pair.en).map((pair) => pair.en),
            inactiveEn: inactivePairs.filter((pair) => pair.en).map((pair) => pair.en),
            activeCn: cnActiveNames,
            inactiveCn: cnInactiveNames,
            cn: cnSummary,
          },
        },
      }), 620000, 'AI 文案生成');
      productDevelopmentLog('success', '常规产品 AI 文案返回', sku + ' | provider=' + productDevelopmentCleanText(response && response.provider, 80) + ' | model=' + productDevelopmentCleanText(response && response.model, 120) + ' | 用时=' + (Date.now() - startedAt) + 'ms');
      stage = '校验中英文条目';
      const content = productDevelopmentValidateCopywriting(response, regularSnapshot);
      productDevelopmentLog('success', '常规产品文案校验通过', sku + ' | A=' + content.efficacy.length + ' | B=' + content.advantages.length + ' | C=' + content.sellingPoints.length + ' | D=' + content.ingredientFunctions.length);
      const id = 'pd-regular-' + Date.now().toString(36);
      const fileName = productDevelopmentCopywritingFileName(regularSnapshot);
      const resultSnapshot = productDevelopmentCopywritingSnapshotValue(regularSnapshot);
      resultSnapshot.ingredients = heroPairs;
      resultSnapshot.ingredientSummary = {
        en: activePairs.map((pair) => pair.en).filter(Boolean).join(', '),
        cn: cnSummary,
      };
      // DOCX 成分行依赖 regularIngredients；不写回会导致成分表行为空。
      resultSnapshot.regularIngredients = {
        activeEn: activeEnPairs.filter((pair) => pair.en).map((pair) => pair.en),
        inactiveEn: inactivePairs.filter((pair) => pair.en).map((pair) => pair.en),
        activeCn: cnActiveNames,
        inactiveCn: cnInactiveNames,
        cn: cnSummary,
      };
      state.productDevelopmentCopywriting = {
        id,
        sku: resultSnapshot.sku || sku,
        content,
        snapshot: resultSnapshot,
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
        sku,
        name: snapshot.name,
        kind: 'copywriting',
        createdAt: state.productDevelopmentCopywriting.createdAt,
        fileName,
        itemCount: content.efficacy.length + content.advantages.length + content.sellingPoints.length + content.ingredientFunctions.length,
        templateVersion: state.productDevelopmentCopywriting.templateVersion,
      });
      if (state.productDevelopmentOneShotResult && state.productDevelopmentOneShotResult.sku === sku) {
        state.productDevelopmentOneShotResult = null;
        state.productDevelopmentOneShotIngredientConfirmed = false;
      }
      state.productDevelopmentStatus = '正在按“' + copywritingTemplate.label + '”模板生成 DOCX…';
      renderShell();
      stage = '生成 DOCX';
      const blob = await withCopywritingTimeout(
        buildProductDevelopmentDocx(content, templateSource, resultSnapshot),
        180000,
        'DOCX 生成',
      );
      state.productDevelopmentCopywriting.blob = blob;
      state.productDevelopmentStatus = '常规产品文案 DOCX 已按“' + copywritingTemplate.label + '”模板生成';
      productDevelopmentLog('success', '常规产品文案生成完成', sku + ' | 模板=' + copywritingTemplate.id + ' | 用时=' + (Date.now() - startedAt) + 'ms');
      showToast('常规产品文案 DOCX 已生成');
    } catch (error) {
      productDevelopmentLog('error', '常规产品文案生成失败', 'SKU=' + sku + ' | 阶段=' + stage + ' | ' + formatErrorMessage(error));
      state.productDevelopmentError = productDevelopmentFriendlyCopywritingError(error);
      state.productDevelopmentStatus = '';
      showToast(state.productDevelopmentError);
    } finally {
      state.productDevelopmentCopywritingBusy = false;
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
    return '<div class="pfh-product-development pfh-product-development-subview">' +
      '<header class="pfh-product-development-subview-head"><button type="button" class="pfh-upload-back" data-action="product-development-home" aria-label="返回产品开发主页">' + iconHtml('backArrow') + '</button><strong>制作成分表</strong></header>' +
      '<section class="pfh-product-development-work-card"><div><h3>编辑成分表内容</h3></div><div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-ingredient-save-local"' + (canExport ? '' : ' disabled') + '>保存本地</button><button type="button" data-action="product-development-ingredient-export"' + (canExport ? '' : ' disabled') + '>导出 ' + factsLabel + ' PDF</button></div></section>' +
      '<section class="pfh-product-development-detail-form"><header><div><h3>模板选择</h3></div></header><div class="pfh-product-development-form-grid">' +
        '<label class="pfh-product-development-material-field"><span>食品类型</span><select class="pfh-product-development-ingredient-kind-input">' + typeOptions + '</select></label>' +
        '<label class="pfh-product-development-material-field"><span>成分表模板</span><select class="pfh-product-development-ingredient-template-input">' + (templateOptions || (state.productDevelopmentIngredientBusy ? '<option value="">正在加载云端模板…</option>' : '<option value="">暂无模板</option>')) + '</select></label>' +
        '<label class="pfh-product-development-material-field"><span>工作表</span><select class="pfh-product-development-ingredient-sheet-input"' + (sheetNames.length ? '' : ' disabled') + '>' + sheetOptions + '</select></label>' +
      '</div></section>' +
      (state.productDevelopmentIngredientStatus ? '<p class="pfh-product-development-status">' + escapeHtml(state.productDevelopmentIngredientStatus) + '</p>' : '') +
      (state.productDevelopmentIngredientError ? '<p class="pfh-product-development-error">' + escapeHtml(state.productDevelopmentIngredientError) + '</p>' : '') +
      productDevelopmentIngredientEditorHtml(editor) +
      '</div>';
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
