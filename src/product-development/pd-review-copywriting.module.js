
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

  function productDevelopmentFileDate() {
    const date = new Date();
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
    const date = productDevelopmentFileDate();
    const brand = productDevelopmentSafeFileLabel(productDevelopmentCopywritingOutputBrand(source.brand), 60);
    let name = productDevelopmentSafeFileLabel(productDevelopmentCopywritingNameWithoutInternalBrand(source.name), 120);
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
      const humanSupplement = productDevelopmentIsHumanSupplement({ ...snapshot, netContent: reviewNetContent }, '');
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
          humanSupplement,
          petAudience,
          ingredients: snapshot.ingredients,
          ingredientEvidence: snapshot.ingredientEvidence,
          sourceCopywriting: snapshot.sourceCopywriting,
          attributeEvidence: snapshot.attributeEvidence,
          claimEvidence: snapshot.claimEvidence,
          sourceEvidence: snapshot.sourceEvidence,
          origin: snapshot.origin,
          countryOfOrigin: snapshot.countryOfOrigin,
          madeIn: snapshot.madeIn,
          sellingPoints: snapshot.sourceCopywriting.sellingPoints,
          efficacy: snapshot.sourceCopywriting.efficacy,
          namingExamples: PRODUCT_DEVELOPMENT_NAME_EXAMPLES,
          reviewRuleVersion: PRODUCT_DEVELOPMENT_REVIEW_RULE_VERSION,
          namingRule: '英文产品名取对标图上清晰可见的产品主标题；如果产品名带有（入口），英文产品名固定填写 Dietary Supplement；中文产品名使用适用对象、朦胧作用/状态和剂型组合，不使用医疗、预防、治疗、绝对化或夸大表达。',
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
      const reviewResult = {
        id,
        sku: snapshot.sku,
        brand: reviewBrand,
        productType: reviewProductType,
        netContent: reviewNetContent,
        humanSupplement,
        sourceImageDataUrl: image.dataUrl,
        sourceImageName: state.productDevelopmentBenchmarkImageName,
        comparisonDataUrl: comparison.dataUrl,
        items: validated.items,
        extractedTexts: validated.extractedTexts,
        packagingBboxes: validated.packagingBboxes,
        warnings: validated.warnings,
        provider: validated.provider,
        model: validated.model,
        plainTextCopy: '',
        productNaming: validated.productNaming,
        fileName,
        createdAt: new Date().toLocaleString(),
      };
      reviewResult.plainTextCopy = productDevelopmentReviewCopyValue(reviewResult, 'revised');
      state.productDevelopmentReview = reviewResult;
      saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
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

  // The review editor overlay uses position:fixed, but the home feature track
  // (.pfh-home-feature-track) carries a transform + will-change, which hijacks
  // fixed positioning for anything rendered inside it. Move the overlay up to
  // the panel root (no transform) so it can cover the whole viewport.
  function productDevelopmentMountReviewEditorOverlay(panel) {
    const root = panel || (typeof ensurePanel === 'function' ? ensurePanel() : null);
    if (!root || root.nodeType !== 1) return;
    let overlay = null;
    root.querySelectorAll('.pfh-product-development-review-editor-float').forEach((element) => {
      if (element.parentElement === root) {
        // Stale leftovers parked at the panel root by the legacy fallback path.
        element.remove();
        return;
      }
      if (!overlay) overlay = element;
      else element.remove();
    });
    if (!overlay) return;
    // The panel root carries backdrop-filter, which hijacks position:fixed for
    // everything inside it (including direct children). Rendering the overlay
    // via the Popover API (top layer) is the only reliable escape; the DOM
    // position is kept so the panel-scoped styles and CSS vars keep applying.
    if (typeof overlay.showPopover === 'function' && overlay.classList.contains('is-open') && !overlay.matches(':popover-open')) {
      try {
        overlay.showPopover();
        return;
      } catch (_) {
        // Fall through to the legacy move below.
      }
    }
    root.appendChild(overlay);
  }

  // --- Standalone editor tab -------------------------------------------------
  // The panel root carries backdrop-filter, which hijacks position:fixed for
  // every descendant, so an in-panel overlay can never truly leave the panel.
  // The editor therefore renders in a dedicated browser tab and syncs edits
  // back to the helper state via window.postMessage.
  let productDevelopmentEditorTabWindow = null;
  let productDevelopmentEditorTabBridgeInstalled = false;

  function productDevelopmentEditorTabRiskInfo(item) {
    const riskTypes = Array.isArray(item && item.riskTypes) ? item.riskTypes : [];
    const isRisk = riskTypes.length > 0;
    let actionLabel = '';
    if (item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.remove) actionLabel = '删除禁词';
    else if (item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replaceLogo) actionLabel = '更换 Logo';
    else if (item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeCount) actionLabel = '数量统一为 60';
    else if (item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.standardizeNetContent) actionLabel = '统一净含量';
    else if (item && item.revisionAction === PRODUCT_DEVELOPMENT_REVIEW_ACTIONS.replacePhrase) actionLabel = '替换表述';
    const reason = productDevelopmentCompactSemanticText(item && (item.riskReason || item.reason || item.warning), 400)
      || (isRisk ? '识别到：' + riskTypes.join('、') : '请人工确认该文字是否需要替换。');
    return { isRisk, label: riskTypes.join('、') + (actionLabel ? ' · ' + actionLabel : ''), reason };
  }

  function productDevelopmentReadReviewEditorLayout() {
    const raw = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_REVIEW_LAYOUT_KEY, null);
    const source = raw && typeof raw === 'object' ? raw : {};
    const w1 = Math.round(Number(source.w1) || 0);
    const w2 = Math.round(Number(source.w2) || 0);
    return {
      w1: w1 >= 220 && w1 <= 1200 ? w1 : 0,
      w2: w2 >= 240 && w2 <= 1600 ? w2 : 0,
    };
  }

  function productDevelopmentWriteReviewEditorLayout(layout) {
    const source = layout && typeof layout === 'object' ? layout : {};
    const w1 = Math.round(Number(source.w1) || 0);
    const w2 = Math.round(Number(source.w2) || 0);
    const next = {
      w1: w1 >= 220 && w1 <= 1200 ? w1 : 0,
      w2: w2 >= 240 && w2 <= 1600 ? w2 : 0,
    };
    writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_REVIEW_LAYOUT_KEY, next);
    return next;
  }

  function productDevelopmentEditorTabPayload() {
    const result = state.productDevelopmentReview;
    const list = Array.isArray(result && result.items) ? result.items : [];
    const warnings = result && Array.isArray(result.warnings)
      ? result.warnings.map((item) => productDevelopmentCompactSemanticText(item, 240)).filter(Boolean).slice(0, 8)
      : [];
    return {
      sku: (result && result.sku) || '',
      image: (result && result.sourceImageDataUrl) || '',
      comparison: (result && result.comparisonDataUrl) || '',
      status: state.productDevelopmentStatus || '',
      items: list.map((item, index) => {
        const risk = productDevelopmentEditorTabRiskInfo(item);
        return {
          index,
          sourceText: productDevelopmentCleanText(item && item.sourceText, 400),
          replacementEn: productDevelopmentCleanText(item && item.replacementEn, 300),
          replacementZh: productDevelopmentCleanText(item && (item.replacementZh || item.translationZh), 500),
          isRisk: risk.isRisk,
          riskLabel: risk.label,
          riskReason: risk.reason,
        };
      }),
      warnings,
      layout: productDevelopmentReadReviewEditorLayout(),
      busy: {
        translate: state.productDevelopmentReviewTranslateBusy === true,
        recompose: state.productDevelopmentReviewBusy === true,
      },
    };
  }

  function productDevelopmentPushEditorTabData() {
    const win = productDevelopmentEditorTabWindow;
    if (!win || win.closed) return;
    try {
      win.postMessage({ source: 'pfh-review-editor-tab', type: 'pfh-review-data', payload: productDevelopmentEditorTabPayload() }, '*');
    } catch (_) { /* child gone */ }
  }

  function productDevelopmentEditorTabDocumentHtml() {
    const css = [
      '* { box-sizing: border-box; }',
      'html, body { margin: 0; padding: 0; height: 100%; }',
      "body { font: 13px/1.5 -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif; background: #f6f5fb; color: #1f1937; display: flex; flex-direction: column; }",
      'header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 13px 24px; background: #fff; border-bottom: 1px solid #e6e2f2; }',
      'header b { font-size: 15px; }',
      'header #status { color: #6b6484; font-size: 12px; margin-left: 12px; }',
      'header #meta { color: #6b6484; font-size: 12px; white-space: nowrap; }',
      '#warnings { display: none; flex-wrap: wrap; gap: 6px; padding: 10px 24px; background: #fff7e6; border-bottom: 1px solid #ffe3ad; }',
      '#warnings span { font-size: 11px; color: #8a5b00; background: #fff; border: 1px solid #ffd88a; border-radius: 999px; padding: 3px 10px; }',
      'main { flex: 1; overflow: auto; padding: 18px 24px; }',
      '#board-wrap { position: relative; }',
      '#board { display: grid; grid-template-columns: var(--w1, 440px) var(--w2, minmax(0, 1fr)) minmax(260px, 1fr); gap: 14px; }',
      '#board.is-empty { display: block; }',
      '.colhead { font-weight: 600; font-size: 12px; padding-bottom: 6px; border-bottom: 2px solid #d9d4ea; margin-bottom: 4px; }',
      '.colhead.blue { border-color: #7b9dff; color: #4463c9; }',
      '.colhead.teal { border-color: #4fc3c0; color: #2c8f8c; }',
      '.imgwrap { background: #fff; border: 1px solid #e2ddf0; border-radius: 14px; padding: 10px; margin-bottom: 12px; text-align: center; }',
      '.imgwrap img { max-width: 100%; border-radius: 8px; display: block; margin: 0 auto; cursor: zoom-in; }',
      '.imgwrap img:hover { opacity: .9; }',
      '.imgwrap small { color: #8b84a6; font-size: 11px; display: block; margin-top: 6px; }',
      '.imgside { position: sticky; top: 0; align-self: start; }',
      '.card { background: #fff; border: 1px solid #e2ddf0; border-radius: 14px; padding: 12px; margin-bottom: 12px; }',
      '.card.is-risk { border-color: #f3b9b9; background: #fffafa; }',
      '.cardhead { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }',
      '.num { color: #8b84a6; font-size: 11px; font-weight: 700; }',
      '.badge { font-size: 11px; border-radius: 999px; padding: 2px 10px; }',
      '.badge.bad { background: #fbe4e4; color: #b43636; }',
      '.badge.ok { background: #e2f4ea; color: #2e7d4f; }',
      '.del { margin-left: auto; width: 22px; height: 22px; border: 0; border-radius: 50%; background: transparent; color: #a39cbb; font-size: 15px; cursor: pointer; }',
      '.del:hover { background: #f0edf9; color: #6b6484; }',
      'textarea { width: 100%; min-height: 64px; resize: vertical; border: 1px solid #d9d4ea; border-radius: 10px; padding: 8px 10px; font: 12.5px/1.55 ui-monospace, Consolas, monospace; color: #1f1937; background: #fbfaff; }',
      'textarea:focus { outline: none; border-color: #8b6ae0; background: #fff; }',
      '.rev textarea { margin-bottom: 8px; }',
      '.rev textarea:last-child { margin-bottom: 0; }',
      '.rev textarea.zh { border-color: #bfe3e2; background: #f7fdfd; }',
      '.reason { margin-top: 8px; color: #b43636; font-size: 11px; }',
      '.empty { padding: 40px; text-align: center; color: #8b84a6; background: #fff; border: 1px dashed #d9d4ea; border-radius: 14px; }',
      'footer { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 12px 24px; background: #fff; border-top: 1px solid #e6e2f2; }',
      'footer button { border: 1px solid #d9d4ea; background: #fff; color: #4a4462; border-radius: 10px; padding: 7px 14px; font-size: 12.5px; cursor: pointer; }',
      'footer button:hover { border-color: #8b6ae0; color: #6d51c7; }',
      'footer button:disabled { opacity: .55; cursor: default; }',
      'footer button.primary { background: #6d51c7; border-color: #6d51c7; color: #fff; }',
      'footer button.primary:hover { background: #5d44b2; }',
      'footer button.ghost { background: transparent; border-color: transparent; color: #8b84a6; }',
      'footer button.ghost:hover { border-color: #d9d4ea; color: #6d51c7; }',
      'footer .hint { margin-left: auto; color: #a39cbb; font-size: 11px; }',
      '.splitter { position: absolute; top: 0; bottom: 0; width: 10px; z-index: 3; display: none; cursor: col-resize; touch-action: none; }',
      '#board.is-empty ~ .splitter { display: none !important; }',
      '.splitter::before { content: ""; position: absolute; left: 4px; top: 0; bottom: 0; width: 2px; border-radius: 2px; background: transparent; transition: background .18s; }',
      '.splitter:hover::before, .splitter.is-active::before { background: #8b6ae0; }',
      'body.is-resizing { cursor: col-resize; user-select: none; }',
      'body.is-resizing textarea { pointer-events: none; }',
      '#lightbox { position: fixed; inset: 0; background: rgba(20, 16, 38, .88); display: none; align-items: center; justify-content: center; z-index: 99; cursor: zoom-out; padding: 40px; }',
      '#lightbox.is-open { display: flex; }',
      '#lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 10px; box-shadow: 0 24px 80px rgba(0,0,0,.45); }',
      '#lightbox .lb-tip { position: absolute; bottom: 18px; left: 0; right: 0; text-align: center; color: rgba(255,255,255,.7); font-size: 12px; }',
    ].join('');
    const js = [
      "(function(){",
      "var payload=null;",
      "var LS_KEY='pfh-review-editor-layout:v1';",
      "var DEFAULT_W1=440;",
      "var layout={w1:0,w2:0};",
      "var layoutReady=false;",
      "var drag=null;",
      "function clamp(v,a,b){return Math.max(a,Math.min(b,v));}",
      "function boardEl(){return document.getElementById('board');}",
      "function readLocalLayout(){try{var raw=localStorage.getItem(LS_KEY);if(!raw)return null;var v=JSON.parse(raw);if(!v||typeof v!=='object')return null;return {w1:clamp(Math.round(Number(v.w1)||0),0,1200),w2:clamp(Math.round(Number(v.w2)||0),0,1600)};}catch(_){return null;}}",
      "function saveLayout(){try{localStorage.setItem(LS_KEY,JSON.stringify({w1:layout.w1,w2:layout.w2}));}catch(_){}send({type:'pfh-review-tab-layout',layout:{w1:layout.w1,w2:layout.w2}});}",
      "function applyLayout(w1,w2){layout={w1:Math.round(Number(w1)||0),w2:Math.round(Number(w2)||0)};var b=boardEl();if(!b)return;b.style.setProperty('--w1',(layout.w1||DEFAULT_W1)+'px');b.style.setProperty('--w2',layout.w2?layout.w2+'px':'minmax(0, 1fr)');placeSplitters();}",
      "function placeSplitters(){var wrap=document.getElementById('board-wrap');var s1=document.getElementById('sp1');var s2=document.getElementById('sp2');if(!wrap||!s1||!s2)return;var img=boardEl().querySelector('.imgside');var src=boardEl().querySelector('.card:not(.rev)');if(!img||!src){s1.style.display=s2.style.display='none';return;}var base=wrap.getBoundingClientRect().left;s1.style.display=s2.style.display='block';s1.style.left=(img.getBoundingClientRect().right-base+2)+'px';s2.style.left=(src.getBoundingClientRect().right-base+2)+'px';}",
      "function lockWidths(){var b=boardEl();var img=b.querySelector('.imgside');var src=b.querySelector('.card:not(.rev)');if(img&&!layout.w1)layout.w1=Math.round(img.getBoundingClientRect().width);if(src&&!layout.w2)layout.w2=Math.round(src.getBoundingClientRect().width);applyLayout(layout.w1,layout.w2);}",
      "function initLayout(p){if(layoutReady)return;layoutReady=true;var cached=readLocalLayout();if(cached&&(cached.w1||cached.w2)){applyLayout(cached.w1,cached.w2);return;}var r=p&&p.layout?p.layout:{w1:0,w2:0};applyLayout(r.w1,r.w2);}",
      "function resetLayout(){applyLayout(0,0);saveLayout();flash('已恢复默认列宽');}",
      "function renderKey(p){return p.items.map(function(x){return (x.isRisk?'1':'0')+String(x.riskLabel||'')+'~'+String(x.riskReason||'');}).join('|');}",
      "function updateImages(p){var a=document.getElementById('bench2');var b=document.getElementById('compare2');if(a&&a.getAttribute('src')!==(p.image||''))a.src=p.image||'';if(b&&b.getAttribute('src')!==(p.comparison||''))b.src=p.comparison||'';}",
      "function postRender(p){var b=boardEl();if(!b)return;b.querySelectorAll('.imgwrap img').forEach(function(im){im.setAttribute('data-zoom','');im.title='点击查看大图';});b.dataset.key=p.items.length?renderKey(p):'';initLayout(p);placeSplitters();}",
      "function updateBoard(p){var b=boardEl();if(!b||!p.items.length)return false;var key=renderKey(p);if(b.dataset.key!==key||!b.querySelector('.imgside')||b.querySelectorAll('.card:not(.rev)').length!==p.items.length)return false;b.querySelectorAll('textarea[data-field]').forEach(function(ta){if(document.activeElement===ta)return;var item=p.items[Number(ta.dataset.i)];if(!item)return;var v=String(item[ta.dataset.field]==null?'':item[ta.dataset.field]);if(ta.value!==v)ta.value=v;});updateImages(p);postRender(p);return true;}",
      "function openLightbox(src){var lb=document.getElementById('lightbox');var img=document.getElementById('lightbox-img');if(!lb||!img||!src)return;img.src=src;lb.classList.add('is-open');}",
      "function closeLightbox(){var lb=document.getElementById('lightbox');if(lb)lb.classList.remove('is-open');}",
      "function endDrag(){if(!drag)return;if(drag.node)drag.node.classList.remove('is-active');drag=null;document.body.classList.remove('is-resizing');saveLayout();}",
      "function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');}",
      "function send(msg){try{if(window.opener)window.opener.postMessage(Object.assign({source:'pfh-review-tab'},msg),'*');}catch(_){}}",
      "function copyText(t){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){flash('已复制');}).catch(function(){fallbackCopy(t);});}else{fallbackCopy(t);}}",
      "function fallbackCopy(t){var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');flash('已复制');}catch(_){flash('复制失败');}ta.remove();}",
      "function flash(msg){var el=document.getElementById('status');if(el){el.textContent=msg;setTimeout(function(){if(payload&&el.textContent===msg)el.textContent=payload.status||'';},1600);}}",
      "function pad(n){return String(n).length<2?'0'+n:String(n);}",
      "function render(p){",
      "payload=p;",
      "document.getElementById('status').textContent=p.status||'';",
      "document.getElementById('meta').textContent=(p.sku?'SKU '+p.sku+' · ':'')+p.items.length+' 个文字块';",
      "var w=document.getElementById('warnings');",
      "w.style.display=(p.warnings&&p.warnings.length)?'flex':'none';",
      "w.innerHTML=(p.warnings||[]).map(function(x){return '<span>'+esc(x)+'</span>';}).join('');",
      "var board=document.getElementById('board');",
      "if(!p.items.length)board.classList.add('is-empty');else board.classList.remove('is-empty');",
      "if(!p.items.length)postRender(p);",
      "if(updateBoard(p)){syncButtons(p);return;}",
      "if(!p.items.length){board.innerHTML='<div class=\"empty\">未检测到文字，请点下方「手动添加文字」。</div>';syncButtons(p);return;}",
      "var n=p.items.length;",
      "var html='<aside class=\"imgside\" style=\"grid-row:1 / span '+n+'\"><div class=\"colhead\">Benchmark Image / 对标图</div><div class=\"imgwrap\"><img id=\"bench2\"></div><div class=\"imgwrap\"><small>对照图预览</small><img id=\"compare2\"></div></aside>';",
      "p.items.forEach(function(item){",
      "html+='<div class=\"card'+(item.isRisk?' is-risk':'')+'\"><div class=\"cardhead\"><span class=\"num\">'+pad(item.index+1)+'</span><span class=\"badge '+(item.isRisk?'bad\">风险 · '+esc(item.riskLabel):'ok\">可保留')+'</span><button class=\"del\" data-del=\"'+item.index+'\" title=\"删除该行\">×</button></div>'+" +
        "'<textarea data-i=\"'+item.index+'\" data-field=\"sourceText\" spellcheck=\"false\" placeholder=\"图片原文（可编辑）\">'+esc(item.sourceText)+'</textarea>'" +
        "+(item.isRisk?'<div class=\"reason\">'+esc(item.riskReason)+'</div>':'')+'</div>';",
      "html+='<div class=\"card rev'+(item.isRisk?' is-risk':'')+'\"><textarea class=\"en\" data-i=\"'+item.index+'\" data-field=\"replacementEn\" spellcheck=\"false\" placeholder=\"English rewrite / 英文改写\">'+esc(item.replacementEn)+'</textarea><textarea class=\"zh\" data-i=\"'+item.index+'\" data-field=\"replacementZh\" spellcheck=\"false\" placeholder=\"中文翻译\">'+esc(item.replacementZh)+'</textarea></div>';",
      "});",
      "board.innerHTML=html;",
      "document.getElementById('bench2').src=p.image||'';",
      "document.getElementById('compare2').src=p.comparison||'';",
      "syncButtons(p);",
      "postRender(p);",
      "}",
      "function syncButtons(p){",
      "var t=document.getElementById('btn-translate');",
      "t.disabled=!!p.busy.translate;",
      "t.textContent=p.busy.translate?'正在翻译…':'改写翻译为中文';",
      "var r=document.getElementById('btn-recompose');",
      "r.disabled=!!p.busy.recompose;",
      "r.textContent=p.busy.recompose?'正在重新生成…':'按修改重新生成对照图';",
      "}",
      "document.addEventListener('input',function(e){",
      "var t=e.target;",
      "if(t&&t.tagName==='TEXTAREA'&&t.dataset.field){send({type:'pfh-review-tab-input',index:Number(t.dataset.i),field:t.dataset.field,value:t.value});}",
      "});",
      "document.addEventListener('click',function(e){",
      "var lb=document.getElementById('lightbox');",
      "if(lb&&lb.classList.contains('is-open')){closeLightbox();return;}",
      "if(e.target&&e.target.id==='btn-reset-layout'){resetLayout();return;}",
      "var zoom=e.target&&e.target.closest?e.target.closest('[data-zoom]'):null;",
      "if(zoom){openLightbox(zoom.getAttribute('src')||'');return;}",
      "var el=e.target&&e.target.closest?e.target.closest('[data-del]'):null;",
      "if(el){send({type:'pfh-review-tab-remove',index:Number(el.dataset.del)});return;}",
      "var id=e.target&&e.target.id;",
      "if(id==='btn-translate'){send({type:'pfh-review-tab-translate'});}",
      "else if(id==='btn-add'){send({type:'pfh-review-tab-add'});}",
      "else if(id==='btn-recompose'){send({type:'pfh-review-tab-recompose'});}",
      "else if(id==='btn-copy-all'){if(payload){copyText(payload.items.map(function(x){return x.sourceText;}).filter(Boolean).join('\\n'));}}",
      "else if(id==='btn-copy-revised'){if(payload){copyText(payload.items.map(function(x){return (x.replacementEn||x.sourceText||'')+(x.replacementZh?' / '+x.replacementZh:'');}).filter(Boolean).join('\\n'));}}",
      "});",
      "window.addEventListener('message',function(e){",
      "var d=e&&e.data;",
      "if(!d||typeof d!=='object'||d.source!=='pfh-review-editor-tab'||d.type!=='pfh-review-data')return;",
      "render(d.payload);",
      "});",
      "document.addEventListener('pointerdown',function(e){",
      "var sp=e.target&&e.target.closest?e.target.closest('.splitter'):null;",
      "if(!sp)return;",
      "e.preventDefault();",
      "lockWidths();",
      "var r=sp.getBoundingClientRect();",
      "drag={which:sp.dataset.split,off:e.clientX-r.left,node:sp};",
      "sp.classList.add('is-active');",
      "document.body.classList.add('is-resizing');",
      "if(sp.setPointerCapture&&e.pointerId!=null){try{sp.setPointerCapture(e.pointerId);}catch(_){}}",
      "});",
      "document.addEventListener('pointermove',function(e){",
      "if(!drag)return;",
      "var b=boardEl();var src=b.querySelector('.card:not(.rev)');if(!src)return;",
      "var br=b.getBoundingClientRect();var sr=src.getBoundingClientRect();",
      "var target=e.clientX-drag.off;",
      "if(drag.which==='1'){applyLayout(clamp(target-br.left-2,220,1000),layout.w2);}",
      "else{applyLayout(layout.w1,clamp(target-sr.left-2,240,1200));}",
      "});",
      "document.addEventListener('pointerup',endDrag);",
      "document.addEventListener('pointercancel',endDrag);",
      "document.addEventListener('dblclick',function(e){if(e.target&&e.target.closest&&e.target.closest('.splitter'))resetLayout();});",
      "document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLightbox();});",
      "window.addEventListener('resize',placeSplitters);",
      "applyLayout(0,0);",
      "send({type:'pfh-review-tab-ready'});",
      "})();",
    ].join('\n');
    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>图片文字对照编辑</title><style>' + css + '</style></head><body>' +
      '<header><div><b>图片文字对照编辑</b><span id="status"></span></div><div id="meta"></div></header>' +
      '<div id="warnings"></div>' +
      '<main><div id="board-wrap"><div id="board" class="is-empty"><div class="empty">正在载入分析结果…</div></div>' +
      '<div class="splitter" id="sp1" data-split="1" title="拖动调整图片列宽度，双击恢复默认"></div>' +
      '<div class="splitter" id="sp2" data-split="2" title="拖动调整原文列宽度，双击恢复默认"></div></div></main>' +
      '<footer><button id="btn-translate" class="primary" type="button">改写翻译为中文</button><button id="btn-add" type="button">手动添加文字</button><button id="btn-copy-all" type="button">复制全文</button><button id="btn-copy-revised" type="button">复制修改后的文案</button><button id="btn-recompose" type="button">按修改重新生成对照图</button><button id="btn-reset-layout" class="ghost" type="button">恢复默认列宽</button><span class="hint">拖动列边界可调整宽度 · 点击图片查看大图</span></footer>' +
      '<div id="lightbox"><img id="lightbox-img" alt=""><div class="lb-tip">点击任意位置关闭</div></div>' +
      '<script>' + js + '</scr' + 'ipt></body></html>';
  }

  function productDevelopmentOpenReviewEditorTab() {
    const result = state.productDevelopmentReview;
    if (!result) {
      showToast('当前结果不可编辑，请重新分析当前对标图片');
      return true;
    }
    productDevelopmentInstallEditorTabBridge();
    let win = null;
    try {
      win = window.open('', '_blank');
    } catch (_) { win = null; }
    if (!win) {
      showToast('浏览器拦截了新标签页，请允许本站弹出窗口后重试');
      return true;
    }
    productDevelopmentEditorTabWindow = win;
    try {
      win.document.open();
      win.document.write(productDevelopmentEditorTabDocumentHtml());
      win.document.close();
    } catch (_) {
      try { win.close(); } catch (_2) { /* ignore */ }
      showToast('新标签页创建失败，请重试');
      return true;
    }
    productDevelopmentPushEditorTabData();
    return true;
  }

  function productDevelopmentInstallEditorTabBridge() {
    if (productDevelopmentEditorTabBridgeInstalled) return;
    productDevelopmentEditorTabBridgeInstalled = true;
    window.addEventListener('message', (event) => {
      const data = event && event.data;
      if (!data || typeof data !== 'object' || data.source !== 'pfh-review-tab') return;
      const result = state.productDevelopmentReview;
      const list = result && Array.isArray(result.items) ? result.items : [];
      if (data.type === 'pfh-review-tab-ready') {
        productDevelopmentPushEditorTabData();
        return;
      }
      if (data.type === 'pfh-review-tab-layout') {
        productDevelopmentWriteReviewEditorLayout(data.layout);
        return;
      }
      if (!result) return;
      if (data.type === 'pfh-review-tab-input') {
        const item = list[Number(data.index)];
        const field = String(data.field || '');
        const value = String(data.value == null ? '' : data.value);
        if (!item) return;
        if (field === 'sourceText') item.sourceText = value.slice(0, 400);
        else if (field === 'replacementEn') item.replacementEn = value.slice(0, 300);
        else if (field === 'replacementZh') item.replacementZh = value.slice(0, 500);
        else return;
        scheduleProductDevelopmentReviewDraftSave(result);
        return;
      }
      if (data.type === 'pfh-review-tab-remove') {
        const index = Number(data.index);
        if (Number.isInteger(index) && list[index]) {
          list.splice(index, 1);
          saveProductDevelopmentReviewDraft(result);
          productDevelopmentPushEditorTabData();
        }
        return;
      }
      if (data.type === 'pfh-review-tab-add') {
        if (list.length >= 80) return;
        list.push({
          id: 'manual-' + Date.now().toString(36),
          sourceText: '',
          riskTypes: ['other'],
          replacementEn: '',
          replacementZh: '',
          confidence: 0,
        });
        saveProductDevelopmentReviewDraft(result);
        productDevelopmentPushEditorTabData();
        return;
      }
      if (data.type === 'pfh-review-tab-translate') {
        const targets = list.filter((item) => productDevelopmentCompactSemanticText(item && item.replacementEn, 300));
        if (!targets.length || state.productDevelopmentReviewTranslateBusy) {
          productDevelopmentPushEditorTabData();
          return;
        }
        state.productDevelopmentReviewTranslateBusy = true;
        productDevelopmentPushEditorTabData();
        productDevelopmentTranslatePool(targets, (item) => productDevelopmentTranslateEnToZh(productDevelopmentCompactSemanticText(item.replacementEn, 300)).then((translated) => {
          item.replacementZh = productDevelopmentCleanText(translated, 500);
        }), 4).then(() => {
          state.productDevelopmentReviewTranslateBusy = false;
          saveProductDevelopmentReviewDraft(result);
          state.productDevelopmentStatus = '已把英文改写翻译为中文，可继续手动调整';
          productDevelopmentPushEditorTabData();
          renderShell();
        }).catch((error) => {
          state.productDevelopmentReviewTranslateBusy = false;
          saveProductDevelopmentReviewDraft(result);
          productDevelopmentPushEditorTabData();
          showToast('翻译失败：' + String(error && error.message || '未知错误'));
        });
        return;
      }
      if (data.type === 'pfh-review-tab-recompose') {
        if (!state.productDevelopmentReviewBusy) {
          recomposeProductDevelopmentReview().then(() => productDevelopmentPushEditorTabData()).catch(() => productDevelopmentPushEditorTabData());
        } else {
          productDevelopmentPushEditorTabData();
        }
      }
    });
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
    const meta = list.map((item, index) => {
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
      return {
        index,
        isRisk,
        riskText: isRisk ? item.riskTypes.join('、') + (actionLabel ? ' · ' + actionLabel : '') : '',
        riskReason: productDevelopmentCompactSemanticText(item && (item.riskReason || item.reason || item.warning), 400)
          || (Array.isArray(item && item.riskTerms) && item.riskTerms.length ? '识别到：' + item.riskTerms.join('、') : '请人工确认该文字是否需要替换。'),
      };
    });
    const badge = (m) => m.isRisk
      ? '<span class="pfh-product-development-review-risk-badge">风险 · ' + escapeHtml(m.riskText) + '</span>'
      : '<span class="pfh-product-development-review-clear-badge">可保留</span>';
    const imageCol = '<div class="pfh-product-development-review-col is-image"><div class="pfh-product-development-review-col-head"><span>Benchmark Image / 对标图</span></div>' +
      (result && result.sourceImageDataUrl
        ? '<img src="' + escapeHtml(result.sourceImageDataUrl) + '" alt="对标图">'
        : '<div class="pfh-product-development-result-empty">本次分析没有保存对标原图。</div>') +
      (result && result.comparisonDataUrl ? '<img class="pfh-product-development-review-compare-thumb" src="' + escapeHtml(result.comparisonDataUrl) + '" alt="对照图预览">' : '') +
      '</div>';
    const originalCol = '<div class="pfh-product-development-review-col is-original-col"><div class="pfh-product-development-review-col-head"><span>English Original / 英文原文</span><small>可编辑</small></div>' +
      (list.length
        ? meta.map((m) => '<div class="pfh-product-development-review-line' + (m.isRisk ? ' is-risk' : '') + '"><div class="pfh-product-development-review-line-head"><b>' + String(m.index + 1).padStart(2, '0') + '</b>' + badge(m) +
          '<button type="button" aria-label="删除第 ' + (m.index + 1) + ' 个文字块" data-action="product-development-review-remove" data-review-index="' + m.index + '">×</button></div>' +
          '<textarea class="pfh-product-development-review-input is-original" data-review-index="' + m.index + '" data-review-field="sourceText" rows="3" aria-label="英文原文" placeholder="图片原文（可编辑）">' + escapeHtml(productDevelopmentCompactSemanticText(list[m.index] && list[m.index].sourceText, 240)) + '</textarea>' +
          (m.isRisk ? '<p class="pfh-product-development-review-line-note">' + escapeHtml(m.riskReason) + '</p>' : '') +
          '</div>').join('')
        : '<div class="pfh-product-development-result-empty">未检测到可靠风险文字，可点击「手动添加文字」补充核对。</div>') +
      '</div>';
    const revisedCol = '<div class="pfh-product-development-review-col is-revised-col"><div class="pfh-product-development-review-col-head"><span>Revised Copy / 改写与翻译</span><small>可编辑</small></div>' +
      (list.length
        ? meta.map((m) => '<div class="pfh-product-development-review-line' + (m.isRisk ? ' is-risk' : '') + '">' +
          '<textarea class="pfh-product-development-review-input is-rewrite" data-review-index="' + m.index + '" data-review-field="replacementEn" rows="3" aria-label="英文改写" placeholder="English rewrite / 英文改写">' + escapeHtml(productDevelopmentCompactSemanticText(list[m.index] && list[m.index].replacementEn, 300)) + '</textarea>' +
          '<textarea class="pfh-product-development-review-input is-translation" data-review-index="' + m.index + '" data-review-field="replacementZh" rows="3" aria-label="中文翻译" placeholder="中文翻译">' + escapeHtml(productDevelopmentCompactSemanticText(list[m.index] && (list[m.index].replacementZh || list[m.index].translationZh), 300)) + '</textarea></div>').join('')
        : '') +
      '</div>';
    const isOpen = Boolean(state.productDevelopmentReviewEditorOpen);
    return '<div class="pfh-product-development-review-editor-float' + (isOpen ? ' is-open' : '') + '" popover="manual" aria-hidden="' + (isOpen ? 'false' : 'true') + '"><button type="button" class="pfh-product-development-review-editor-backdrop" data-action="product-development-review-editor-close" aria-label="关闭编辑浮窗"></button><section class="pfh-product-development-review-editor is-compare" role="dialog" aria-modal="true" aria-label="侵权对照文字编辑"><header><div><small>INFRINGING COMPARISON</small><h3>侵权对照 · 直接编辑文字</h3></div><span>' + list.length + ' 个文字块 · ' + riskCount + ' 个风险</span><button type="button" class="pfh-product-development-review-editor-close" data-action="product-development-review-editor-close" aria-label="关闭编辑浮窗">×</button></header>' +
      warningHtml +
      '<div class="pfh-product-development-review-editor-compare">' + imageCol + originalCol + revisedCol + '</div>' +
      '<div class="pfh-product-development-review-editor-actions"><button type="button" data-action="product-development-review-translate-revised"' + (state.productDevelopmentReviewTranslateBusy ? ' disabled' : '') + '>' + (state.productDevelopmentReviewTranslateBusy ? '正在翻译…' : '改写翻译为中文') + '</button><button type="button" data-action="product-development-review-add">手动添加文字</button><button type="button" data-action="product-development-review-copy-all">复制全文</button><button type="button" data-action="product-development-review-copy-revised">复制修改后的文案</button><button type="button" data-action="product-development-review-recompose"' + (!result || state.productDevelopmentReviewBusy ? ' disabled' : '') + '>按修改重新生成对照图</button></div></section></div>';
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
      '<textarea class="pfh-product-development-plain-copy-input" data-review-plain-copy rows="6" aria-label="用户确定的纯文字文案版本" placeholder="粘贴用户确定好的纯文字文案，输入即自动保存。">' + escapeHtml(value) + '</textarea></section>';
  }

  function productDevelopmentReviewCopyContext(result) {
    const sku = String(result && result.sku || '').trim().toUpperCase();
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === sku
      ? state.productDevelopmentSnapshot
      : null;
    return snapshot || {
      sku,
      brand: productDevelopmentNormalizeBrandValue(result && result.brand || ''),
      productType: result && result.productType || '',
      netContent: result && result.netContent || '',
      humanSupplement: Boolean(result && result.humanSupplement),
    };
  }

  function productDevelopmentReviewCopyValue(result, mode) {
    const context = productDevelopmentReviewCopyContext(result);
    const items = (Array.isArray(result && result.items) ? result.items : []).map((item) => ({ ...item }));
    productDevelopmentEnsureHumanSupplementLine(items, context);
    if (mode === 'revised') {
      let value = productDevelopmentCleanText(result && (result.plainTextCopy || result.approvedPlainText || result.finalCopy), 12000);
      if (!value) {
        value = items.map((item) => {
          const sourceText = productDevelopmentCompactSemanticText(item && item.sourceText, 240);
          const english = productDevelopmentIsNetContentText(item && item.textRole, sourceText)
            ? String(item && item.replacementEn || '').toUpperCase()
            : productDevelopmentCompactSemanticText(item && item.replacementEn, 300);
          const chinese = productDevelopmentCompactSemanticText(item && (item.replacementZh || item.translationZh), 300);
          return [english, chinese].filter(Boolean).join('\n');
        }).filter(Boolean).join('\n');
      } else {
        const netContent = productDevelopmentCleanText(context && context.netContent, 120).toUpperCase();
        const normalizedNetContent = netContent.replace(/\s+/g, '').toLowerCase();
        value = value.split('\n').map((line) => {
          const normalizedLine = String(line || '').replace(/\s+/g, '').toLowerCase();
          return /net[\s_-]*(?:content|contents|wt|weight)|净含量/i.test(line)
            || normalizedNetContent && normalizedLine === normalizedNetContent
            ? line.toUpperCase()
            : line;
        }).join('\n');
      }
      value = value.replace(/\bDIETARY\s+SUPPLEMENT\b/gi, 'DIETARY SUPPLEMENT');
      if (productDevelopmentIsHumanSupplement(context, value) && !/\bDIETARY\s+SUPPLEMENT\b/i.test(value)) value = [value, 'DIETARY SUPPLEMENT'].filter(Boolean).join('\n');
      return productDevelopmentCompactSemanticText(value, 12000);
    }
    return items.map((item) => productDevelopmentCompactSemanticText(item && item.sourceText, 240)).filter(Boolean).join('\n');
  }

  // Manual edits are the final copy when regenerating the comparison. The
  // initial-analysis pipeline re-applies the automated compliance rewrite
  // rules (logo / banned-term / fixed-phrase / count / net-content rules),
  // inserts supplement rows and drops incomplete rows, so reusing it here
  // would silently overwrite, add or delete the copy the user just typed.
  // This pass only normalizes line endings and caps lengths. Compliance
  // validation belongs to the initial analysis, not to the editor's output.
  function productDevelopmentReviewManualItems(sourceItems) {
    const list = Array.isArray(sourceItems) ? sourceItems.slice(0, 80) : [];
    const items = list.map((entry, index) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      const sourceText = productDevelopmentCleanText(item.sourceText, 400);
      const replacementEn = productDevelopmentCleanText(item.replacementEn, 300);
      const replacementZh = productDevelopmentCleanText(item.replacementZh || item.translationZh, 500);
      return {
        ...item,
        id: String(item.id || index + 1),
        sourceText,
        replacementEn,
        replacementZh,
        translationZh: productDevelopmentCleanText(item.translationZh || replacementZh, 500),
        riskTypes: Array.isArray(item.riskTypes) ? item.riskTypes : [],
        riskTerms: Array.isArray(item.riskTerms) ? item.riskTerms : [],
        manualEdited: true,
      };
    });
    items.packagingBboxes = productDevelopmentReviewPackagingBboxes({ items: list });
    return items;
  }

  async function recomposeProductDevelopmentReview() {
    const result = state.productDevelopmentReview;
    if (!result || !result.sourceImageDataUrl) {
      showToast('请先完成一次图片文字分析');
      return;
    }
    const items = Array.isArray(result.items) ? result.items : [];
    if (!items.length) {
      showToast('请先添加文字内容');
      return;
    }
    const snapshot = state.productDevelopmentSnapshot && state.productDevelopmentSnapshot.sku === result.sku
      ? state.productDevelopmentSnapshot
      : {
        sku: result.sku,
        brand: productDevelopmentNormalizeBrandValue(result.brand || ''),
        productType: result.productType || '',
        netContent: result.netContent || '',
        humanSupplement: result.humanSupplement === true,
      };
    state.productDevelopmentReviewBusy = true;
    state.productDevelopmentError = '';
    state.productDevelopmentStatus = '正在按人工修改重新生成对照图…';
    renderShell();
    try {
      const reviewedItems = productDevelopmentReviewManualItems(items);
      const comparison = await composeProductDevelopmentComparison(result.sourceImageDataUrl, reviewedItems, snapshot);
      result.items = reviewedItems;
      result.comparisonDataUrl = comparison.dataUrl;
      result.manualEditedAt = new Date().toLocaleString();
      saveProductDevelopmentReviewDraft(result);

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
    return productDevelopmentXmlSafeText(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function productDevelopmentXmlSafeText(value) {
    const input = String(value || '');
    let output = '';
    for (let index = 0; index < input.length; index += 1) {
      const code = input.charCodeAt(index);
      if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 0xfffe || code === 0xffff) continue;
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = input.charCodeAt(index + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          output += input[index] + input[index + 1];
          index += 1;
        }
        continue;
      }
      if (code >= 0xdc00 && code <= 0xdfff) continue;
      output += input[index];
    }
    return output;
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
    const Zip = getLazyExternalRuntime('jszip') || await ensureLazyExternalScript('jszip').catch(() => null);
    if (typeof Zip !== 'function') throw new Error('DOCX 组件未加载');
    const zip = new Zip();
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

  function productDevelopmentBodyRunProperties(source, doc) {
    if (!doc) return null;
    const clone = source ? source.cloneNode(true) : doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:rPr');
    Array.from(clone.childNodes || []).forEach((child) => {
      const localName = String(child.localName || child.nodeName || '').replace(/^w:/, '');
      if (localName === 'b' || localName === 'bCs' || localName === 'rStyle' || localName === 'vanish') clone.removeChild(child);
    });
    // 英文正文统一 Calibri；中文正文统一宋体。标题前缀由调用方单独保留模板字体，
    // 这里对正文 run 的字体做确定性覆盖，避免空单元格 fallback 继承标题字体（如 Arial Black）。
    let fonts = Array.from(clone.childNodes || []).find((child) => {
      const localName = String(child.localName || child.nodeName || '').replace(/^w:/, '');
      return localName === 'rFonts';
    });
    if (!fonts) {
      fonts = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:rFonts');
      clone.insertBefore(fonts, clone.firstChild);
    }
    ['ascii', 'hAnsi', 'cs'].forEach((attr) => fonts.setAttribute('w:' + attr, 'Calibri'));
    fonts.setAttribute('w:eastAsia', '宋体');
    // A template can make a run bold through paragraph/character styles even
    // when the source run has no direct <w:b>. Explicitly turn bold off on
    // generated text so Word cannot re-inherit that formatting.
    const bold = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:b');
    bold.setAttribute('w:val', '0');
    const boldCs = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:bCs');
    boldCs.setAttribute('w:val', '0');
    // Keep the OOXML run-property order valid: rFonts/rStyle come before
    // b/bCs, while size/color/etc. follow them.
    const firstAfterFonts = Array.from(clone.childNodes || []).find((child) => {
      const localName = String(child.localName || child.nodeName || '').replace(/^w:/, '');
      return localName !== 'rStyle' && localName !== 'rFonts';
    }) || null;
    clone.insertBefore(bold, firstAfterFonts);
    clone.insertBefore(boldCs, firstAfterFonts);
    return clone;
  }

  function productDevelopmentSetCellLines(cell, lines, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRuns = sourceParagraph ? productDevelopmentXmlElements(sourceParagraph, 'r').filter((run) => productDevelopmentCellText(run)) : [];
    const sourceRun = sourceRuns[1] || sourceRuns[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const sourceRPr = sourceRun && productDevelopmentXmlElements(sourceRun, 'rPr')[0];
    productDevelopmentClearCell(cell);
    const values = Array.isArray(lines) ? lines : [lines];
    values.filter((line) => String(line || '').trim()).forEach((line) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      const bodyRPr = productDevelopmentBodyRunProperties(sourceRPr, doc);
      if (bodyRPr) run.appendChild(bodyRPr);
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = productDevelopmentXmlSafeText(line);
      run.appendChild(text);
      paragraph.appendChild(run);
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentDocxTextLines(value) {
    return String(value || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function productDevelopmentSetCellHeadingAndLines(cell, heading, lines, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRuns = sourceParagraph ? productDevelopmentXmlElements(sourceParagraph, 'r').filter((run) => productDevelopmentCellText(run)) : [];
    const headingRPr = sourceRuns[0] && productDevelopmentXmlElements(sourceRuns[0], 'rPr')[0];
    const bodyRun = sourceRuns[1] || sourceRuns[0];
    const bodyRPr = bodyRun && productDevelopmentXmlElements(bodyRun, 'rPr')[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const values = [heading].concat(Array.isArray(lines) ? lines : [lines])
      .map((line) => String(line || '').trim())
      .filter(Boolean);
    const appendRun = (paragraph, textValue, runProperties) => {
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      if (runProperties) run.appendChild(runProperties.cloneNode(true));
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = productDevelopmentXmlSafeText(textValue);
      run.appendChild(text);
      paragraph.appendChild(run);
    };
    productDevelopmentClearCell(cell);
    values.forEach((line, index) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      appendRun(
        paragraph,
        line,
        index === 0 ? headingRPr : productDevelopmentBodyRunProperties(bodyRPr, doc),
      );
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentCellGridSpan(cell) {
    const gridSpan = cell && productDevelopmentXmlElements(cell, 'gridSpan')[0];
    const value = gridSpan && (gridSpan.getAttribute('w:val') || gridSpan.getAttribute('val'));
    return Math.max(1, Number(value) || 1);
  }

  function productDevelopmentSetDirectionsCells(cells, labeling, doc) {
    if (!cells || !cells[1]) return;
    const directionsEn = productDevelopmentDocxTextLines(labeling && labeling.directionsEn);
    const directionsCn = productDevelopmentDocxTextLines(labeling && labeling.directionsCn);
    const isMergedLanguageCell = productDevelopmentCellGridSpan(cells[1]) > 1 || cells.length < 4;
    if (isMergedLanguageCell) {
      productDevelopmentSetCellHeadingAndLines(cells[1], productDevelopmentCellHeadingPrefix(cells[1], /DIRECTIONS?/i) || 'DIRECTIONS:', directionsEn.concat(directionsCn), doc);
      // In the three-cell templates this is the auxiliary sample/rules cell,
      // not a second language column. Clear it after moving both languages
      // into the merged content cell so the sample text is not exported.
      if (cells[2]) productDevelopmentSetCellLines(cells[2], [], doc);
      return;
    }
    productDevelopmentSetCellHeadingAndLines(cells[1], productDevelopmentCellHeadingPrefix(cells[1], /DIRECTIONS?/i) || 'DIRECTIONS:', directionsEn, doc);
    if (cells[2]) productDevelopmentSetCellLines(cells[2], directionsCn, doc);
  }


  // The NDC template ships the ingredient headings as styled runs, e.g.
  // "ACTIVE INGREDIENTS:" (Arial Black) / "INACTIVE INGREDIENTS：" in the
  // English cell and "活性成分：" / "非活性成分：" in the Chinese cell. Reuse
  // their exact wording (including half/full-width colons) instead of
  // hardcoding it, so template updates keep working.
  function productDevelopmentIngredientHeadings(cell, language) {
    const text = productDevelopmentCellText(cell);
    if (language === 'cn') {
      const beforeInactive = text.split(/非活性成分\s*[:：]?/)[0] || '';
      return {
        active: (beforeInactive.match(/活性成分\s*[:：]/) || ['活性成分：'])[0],
        inactive: (text.match(/非活性成分\s*[:：]/) || ['非活性成分：'])[0],
      };
    }
    return {
      active: (text.match(/\bACTIVE\s+INGREDIENTS?\s*[:：]/i) || ['ACTIVE INGREDIENTS:'])[0],
      inactive: (text.match(/\bINACTIVE\s+INGREDIENTS?\s*[:：]/i) || ['INACTIVE INGREDIENTS：'])[0],
    };
  }

  function productDevelopmentIngredientHeading(heading, count) {
    // Template note: with only one active/inactive ingredient, the label uses
    // INGREDIENT (singular) instead of INGREDIENTS.
    return count === 1 ? String(heading || '').replace(/INGREDIENTS/i, 'INGREDIENT') : String(heading || '');
  }

  function productDevelopmentSetCellIngredientGroups(cell, groups, doc) {
    const sourceParagraph = productDevelopmentXmlElements(cell, 'p')[0];
    const sourceRuns = sourceParagraph ? productDevelopmentXmlElements(sourceParagraph, 'r').filter((run) => productDevelopmentCellText(run)) : [];
    const headingRPr = sourceRuns[0] && productDevelopmentXmlElements(sourceRuns[0], 'rPr')[0];
    const bodyRun = sourceRuns[1] || sourceRuns[0];
    const bodyRPr = bodyRun && productDevelopmentXmlElements(bodyRun, 'rPr')[0];
    const sourcePPr = sourceParagraph && productDevelopmentXmlElements(sourceParagraph, 'pPr')[0];
    const appendRun = (paragraph, textValue, runProperties) => {
      const run = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:r');
      if (runProperties) run.appendChild(runProperties.cloneNode(true));
      const text = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:t');
      text.setAttribute('xml:space', 'preserve');
      text.textContent = productDevelopmentXmlSafeText(textValue);
      run.appendChild(text);
      paragraph.appendChild(run);
    };
    productDevelopmentClearCell(cell);
    (Array.isArray(groups) ? groups : []).filter((group) => group && String(group.body || '').trim()).forEach((group) => {
      const paragraph = doc.createElementNS(PRODUCT_DEVELOPMENT_W_NS, 'w:p');
      if (sourcePPr) paragraph.appendChild(sourcePPr.cloneNode(true));
      // Heading keeps the template's display font (Arial Black / bold), body
      // is normalized to Calibri + 宋体 by productDevelopmentBodyRunProperties.
      appendRun(paragraph, String(group.heading || '').trim(), headingRPr);
      appendRun(paragraph, String(group.body || '').trim(), productDevelopmentBodyRunProperties(bodyRPr, doc));
      cell.appendChild(paragraph);
    });
  }

  function productDevelopmentCellHeadingPrefix(cell, pattern) {
    const runs = productDevelopmentXmlElements(cell, 'r');
    return runs.map((run) => productDevelopmentCellText(run)).find((text) => text && pattern.test(text)) || '';
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
    const translations = list('productNameTranslations')
      .map((item) => productDevelopmentCleanText(item, 300))
      .slice(0, 24);
    return {
      directions: list('directions').map((item) => productDevelopmentCopywritingPairValues(item)).filter((item) => item.en && item.cn),
      productNameTranslations: translations,
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
          ingredientEn: productDevelopmentCleanText(sourceItem.ingredientEn || sourceItem.englishName || sourceItem.ingredientEnglish || sourceItem.ingredient_en, 300),
          ingredientCn: productDevelopmentCleanText(sourceItem.ingredientCn || sourceItem.chineseName || sourceItem.ingredientChinese || sourceItem.ingredient_cn, 300),
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
    const brand = snapshot && snapshot.brand ? [snapshot.brand] : [];
    const rewriteGeneratedPair = (item) => ({
      ...item,
      titleEn: productDevelopmentRewriteGeneratedCopyText(item && item.titleEn, brand),
      titleCn: productDevelopmentRewriteGeneratedCopyText(item && item.titleCn, brand),
      en: productDevelopmentRewriteGeneratedCopyText(item && item.en, brand),
      cn: productDevelopmentRewriteGeneratedCopyText(item && item.cn, brand),
    });
    const errors = [];
    const copywritingRestrictionError = (label, item) => {
      const rule = productDevelopmentFindCopywritingRestriction([item && item.en, item && item.cn, item && item.titleEn, item && item.titleCn].filter(Boolean).join(' '), snapshot);
      return rule ? label + '含' + rule.label : '';
    };
    const preRewriteRestricted = [
      ...result.efficacy.map((item, index) => copywritingRestrictionError('A 第 ' + (index + 1) + ' 条', item)),
      ...result.advantages.map((item, index) => copywritingRestrictionError('B 第 ' + (index + 1) + ' 条', item)),
      ...result.sellingPoints.map((item, index) => copywritingRestrictionError('C 第 ' + (index + 1) + ' 条', item)),
      ...result.ingredientFunctions.map((item, index) => copywritingRestrictionError('D 第 ' + (index + 1) + ' 条', item)),
    ].find(Boolean);
    if (preRewriteRestricted) errors.push(preRewriteRestricted);
    result.efficacy = result.efficacy.map(rewriteGeneratedPair);
    result.advantages = result.advantages.map(rewriteGeneratedPair);
    result.sellingPoints = result.sellingPoints.map(rewriteGeneratedPair);
    result.ingredientFunctions = result.ingredientFunctions.map(rewriteGeneratedPair);
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
      if (productDevelopmentChineseCount(item.cn) > 30 || productDevelopmentEnglishWordCount(item.en) > 30) errors.push('A 第 ' + (index + 1) + ' 条超出长度');
    });
    result.advantages.forEach((item, index) => {
      addComplianceText('B 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('B 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('B 第 ' + (index + 1) + ' 条中英文不完整');
      if (productDevelopmentChineseCount(item.cn) > 24 || productDevelopmentEnglishWordCount(item.en) > 14) errors.push('B 第 ' + (index + 1) + ' 条超出长度');
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
    if (result.ingredientFunctions.length === expected.length && expected.length) {
      const aligned = productDevelopmentAlignIngredientFunctions(result.ingredientFunctions, expected);
      if (aligned) result.ingredientFunctions = aligned;
    }
    result.ingredientFunctions.forEach((item, index) => {
      // ingredientEn/ingredientCn are PLM source labels. They must match the
      // input ingredients, but a source ingredient name must not invalidate the
      // generated copywriting compliance check by itself.
      addComplianceText('D 第 ' + (index + 1) + ' 条英文', item.en);
      addComplianceText('D 第 ' + (index + 1) + ' 条中文', item.cn);
      if (!item.en || !item.cn) errors.push('D 第 ' + (index + 1) + ' 条中英文不完整');
      const target = expected[index] || {};
      const targetKeys = productDevelopmentIngredientLabelKeys(target, true);
      const actualKeys = productDevelopmentIngredientLabelKeys(item, false);
      if (!actualKeys.length || !targetKeys.length || !actualKeys.some((key) => targetKeys.includes(key))) errors.push('D 第 ' + (index + 1) + ' 个成分与 PLM 不一致');
      if (productDevelopmentChineseCount(item.cn) > 30 || productDevelopmentEnglishWordCount(item.en) > 30) errors.push('D 第 ' + (index + 1) + ' 条超出长度');
    });
    const invalid = complianceTexts.map((entry) => {
      const rule = productDevelopmentFindCopywritingRestriction(entry.value, snapshot);
      if (rule) return entry.label + '含' + rule.label;
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
    if (/D item \d+ exceeds length|D 第 \d+ 条超出长度/i.test(message)) {
      return '文案生成未完成：D 成分功能文案过长，请再次生成。';
    }
    if (/dosage|frequency|serving or supply|dietary-attribute|manufacturing.*quality|quality-process|服用|用量|频次|供应周期|素食|非转基因|无麸质|质量控制|产品一致性/i.test(message)) {
      const position = message.match(/\b([ABCD])\s+item\s+(\d+)/i) || message.match(/([ABCD])\s*第\s*(\d+)/);
      const label = position ? position[1].toUpperCase() + ' 第 ' + position[2] + ' 条' : '生成内容';
      const reason = /dietary-attribute|素食|非转基因|无麸质/i.test(message) ? '含无依据的饮食属性' : /manufacturing|quality-process|quality|质量控制|产品一致性/i.test(message) ? '含无依据的生产或质量背书' : '含用量或频次描述';
      return '文案生成未完成：' + label + reason + '，自动修复仍未通过，请再次生成。';
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
      return '文案生成未完成：Qwen 响应超时或内容未通过校验，请再次点击生成。';
    }
    return message;
  }

  function productDevelopmentCopywritingNameWithBrand(brand, name) {
    const brandText = productDevelopmentCopywritingOutputBrand(brand);
    const nameText = productDevelopmentCopywritingNameWithoutInternalBrand(name);
    if (!brandText) return nameText;
    if (!nameText) return brandText;
    return nameText.toLowerCase().includes(brandText.toLowerCase()) ? nameText : brandText + ' ' + nameText;
  }

  function productDevelopmentCopywritingOutputBrand(value) {
    const brandText = productDevelopmentCleanText(value, 160);
    return /^AMZ$/i.test(brandText) ? '' : brandText;
  }

  function productDevelopmentCopywritingNameWithoutInternalBrand(value) {
    return productDevelopmentCleanText(value, 300)
      .replace(/^\s*AMZ(?=\s|[\/／>＞|:_：-]|[\u3400-\u9fff])[\s\/／>＞|:_：-]*/i, '')
      .trim();
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
