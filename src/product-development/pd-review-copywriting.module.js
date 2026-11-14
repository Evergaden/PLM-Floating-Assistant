
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
          reviewMode: 'original-report',
          namingRule: '英文产品名取对标图上清晰可见的产品主标题；如果产品名带有（入口），英文产品名固定填写 Dietary Supplement；中文产品名使用适用对象、朦胧作用/状态和剂型组合，不使用医疗、预防、治疗、绝对化或夸大表达。',
          imageDataUrl: image.dataUrl,
          referenceUrl: snapshot.referenceUrl,
        },
      });
      if (response.reviewMode !== 'original-report') throw new Error('服务端尚未更新到原文与中文报告模式，请先部署新版 Worker');
      const validated = productDevelopmentValidateReview(response, snapshot);
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
        reviewMode: 'original-report',
        comparisonDataUrl: '',
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
      state.productDevelopmentStatus = '已识别 ' + validated.extractedTexts.length + ' 项包装文字，发现 ' + riskCount + ' 项待核查风险；打开编辑页修改英文';
      showToast('原文与中文风险报告已生成');
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
  const productDevelopmentReviewTranslationTimers = new WeakMap();

  function productDevelopmentReviewDocument(result) {
    if (!result.editorDocument || typeof result.editorDocument.replacementEn !== 'string') {
      result.editorDocument = {
        replacementEn: (result.items || []).map((item) => String(item.sourceText || '')).join('\n'),
        replacementZh: '',
      };
    }
    return result.editorDocument;
  }

  function productDevelopmentReviewSuggestions(item) {
    const options = (Array.isArray(item.replacementOptions) ? item.replacementOptions : []).filter((option) => option && option.en).map((option) => ({ en: String(option.en), zh: String(option.zh || '') }));
    if (!options.length && item.replacementEn && item.replacementEn !== item.sourceText) options.push({ en: item.replacementEn, zh: item.replacementZh || '' });
    return options;
  }

  function productDevelopmentFormatReviewNetContent(value) {
    const match = String(value).trim().match(/^(\d+(?:\.\d+)?|\.\d+)\s*(g|ml)$/i);
    if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) <= 0) return '';
    const amount = Number(match[1]);
    const volume = match[2].toLowerCase() === 'ml';
    return amount + (volume ? 'ML/ ' : 'G/ ') + (amount / (volume ? 29.5735295625 : 28.349523125)).toFixed(2) + (volume ? ' FL.OZ' : ' OZ');
  }

  function productDevelopmentTranslateReviewItem(result, item) {
    const previous = productDevelopmentReviewTranslationTimers.get(item);
    if (previous) window.clearTimeout(previous);
    const english = item.replacementEn;
    item.replacementZh = '';
    productDevelopmentReviewTranslationTimers.set(item, window.setTimeout(async () => {
      try {
        const translated = english.trim() ? await productDevelopmentTranslateReviewText(english) : '';
        if (item.replacementEn !== english || state.productDevelopmentReview !== result) return;
        item.replacementZh = translated;
        saveProductDevelopmentReviewDraft(result);
        state.productDevelopmentStatus = '英文已保存 · 中文翻译已更新';
      } catch (_) {
        if (item.replacementEn !== english) return;
        state.productDevelopmentStatus = '英文已保存 · 翻译失败，请点击重新翻译';
      }
      productDevelopmentPushEditorTabData();
    }, 600));
  }

  async function productDevelopmentTranslateReviewText(text) {
    const chunks = [];
    let remaining = text;
    while (remaining.length > 350) {
      const prefix = remaining.slice(0, 350);
      const boundary = Math.max(prefix.lastIndexOf('\n'), prefix.lastIndexOf(' '));
      let end = boundary > 175 ? boundary + 1 : 350;
      if (/[\uD800-\uDBFF]/.test(remaining[end - 1])) end--;
      chunks.push(remaining.slice(0, end));
      remaining = remaining.slice(end);
    }
    if (remaining) chunks.push(remaining);
    const translated = [];
    for (const chunk of chunks) {
      translated.push(chunk.trim() ? await productDevelopmentTranslateEnToZh(chunk) : '');
    }
    return translated.join('\n');
  }

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
    const draft = result ? productDevelopmentReviewDocument(result) : { replacementEn: '', replacementZh: '' };
    const list = Array.isArray(result && result.items) ? result.items : [];
    const warnings = result && Array.isArray(result.warnings)
      ? result.warnings.map((item) => productDevelopmentCompactSemanticText(item, 240)).filter(Boolean).slice(0, 8)
      : [];
    return {
      sku: (result && result.sku) || '',
      english: draft.replacementEn,
      annotations: result && Array.isArray(result.annotations) ? result.annotations : [],
      chinese: draft.replacementZh,
      image: (result && result.sourceImageDataUrl) || '',
      comparison: (result && result.comparisonDataUrl) || '',
      status: state.productDevelopmentStatus || '',
      items: list.map((item, index) => {
        const risk = productDevelopmentEditorTabRiskInfo(item);
        return {
          index,
          sourceText: String(item && item.sourceText || ''),
          replacementEn: String(item && item.replacementEn != null ? item.replacementEn : item.sourceText || ''),
          replacementZh: String(item && item.replacementZh || ''),
          isRisk: risk.isRisk,
          riskLabel: risk.label,
          riskReason: risk.reason,
          suggestions: productDevelopmentReviewSuggestions(item),
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
    function editorClient() {
      let current = null;
      let marks = [], active = null, tool = 'view', annotationKey = '', dirty = false, revision = 0;
      const redo = [], history = [];
      let selected = -1, drag = null;
      function checkpoint() { history.push(JSON.stringify(marks)); if (history.length > 100) history.shift(); redo.length = 0; }
      function screenPoints(mark) {
        const rect = document.getElementById('benchmark').getBoundingClientRect();
        return mark.points.map((p) => mark.page ? [p[0] * innerWidth, p[1] - scrollY] : [rect.left + p[0] * rect.width, rect.top + p[1] * rect.height]);
      }
      function bounds(mark) {
        const points = screenPoints(mark), xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
        if (mark.tool === 'text') { xs.push(xs[0] + Math.max(50, String(mark.text || '').length * Math.max(20, mark.width * 5) * .65)); ys.push(ys[0] + Math.max(24, mark.width * 6)); }
        return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
      }
      function editText(x, y, value, done) {
        const input = document.createElement('textarea');
        input.className = 'annotation-input'; input.value = value || '';
        input.style.left = Math.max(8, Math.min(x, innerWidth - 220)) + 'px'; input.style.top = Math.max(8, y) + 'px';
        document.body.appendChild(input); input.focus();
        let finished = false;
        const finish = (save) => { if (finished) return; finished = true; const text = input.value; input.remove(); if (save && text.trim()) done(text); };
        input.addEventListener('keydown', (event) => { if (event.key === 'Escape') finish(false); if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') finish(true); });
        input.addEventListener('blur', () => finish(true));
      }
      const send = (data) => window.opener && window.opener.postMessage({ source: 'pfh-review-tab', ...data }, '*');
      const persistMarks = () => {
        dirty = true;
        send({ type: 'pfh-review-annotations', sku: current.sku, revision: ++revision, annotations: marks });
      };
      function drawMarks() {
        const canvas = document.getElementById('annotation-canvas');
        const image = document.getElementById('benchmark');
        if (!canvas || !image || !image.naturalWidth) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        for (const mark of active ? marks.concat(active) : marks) {
          const rect = image.getBoundingClientRect();
          const points = mark.points.map((p) => mark.page ? [p[0] * canvas.width, p[1] - window.scrollY] : [rect.left + p[0] * rect.width, rect.top + p[1] * rect.height]);
          if (!points.length) continue;
          const [x, y] = points[0], [ex, ey] = points[points.length - 1];
          ctx.save(); ctx.strokeStyle = mark.color; ctx.fillStyle = mark.color;
          ctx.lineWidth = mark.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          if (mark.tool === 'mosaic') {
            const left = Math.max(0, Math.min(x, ex)), top = Math.max(0, Math.min(y, ey));
            const right = Math.min(canvas.width, Math.max(x, ex)), bottom = Math.min(canvas.height, Math.max(y, ey));
            for (let py = top; py < bottom; py += 14) for (let px = left; px < right; px += 14) {
              const shade = (Math.floor(px / 14) + Math.floor((py + window.scrollY) / 14)) % 2 ? 125 : 155;
              ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
              ctx.fillRect(px, py, Math.min(14, right - px), Math.min(14, bottom - py));
            }
          } else if (mark.tool === 'text') {
            ctx.font = Math.max(20, mark.width * 5) + 'px sans-serif';
            ctx.textBaseline = 'top';
            String(mark.text || '').split('\n').forEach((line, i) => ctx.fillText(line, x, y + i * Math.max(24, mark.width * 6)));
          } else if (mark.tool === 'rect') ctx.strokeRect(x, y, ex - x, ey - y);
          else {
            if (mark.tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = mark.width * 5; }
            ctx.beginPath(); ctx.moveTo(x, y);
            points.forEach((p) => ctx.lineTo(p[0], p[1]));
            if (points.length === 1) ctx.lineTo(x + .01, y + .01);
            ctx.stroke();
            if (mark.tool === 'arrow') {
              const angle = Math.atan2(ey - y, ex - x), size = Math.max(16, mark.width * 4);
              ctx.beginPath(); ctx.moveTo(ex, ey);
              ctx.lineTo(ex - size * Math.cos(angle - .5), ey - size * Math.sin(angle - .5));
              ctx.moveTo(ex, ey); ctx.lineTo(ex - size * Math.cos(angle + .5), ey - size * Math.sin(angle + .5)); ctx.stroke();
            }
          }
          ctx.restore();
        }
        if (tool === 'select' && selected >= 0 && marks[selected]) {
          const b = bounds(marks[selected]); ctx.save(); ctx.strokeStyle = '#17695f'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.strokeRect(b.left - 8, b.top - 8, Math.max(16, b.right - b.left + 16), Math.max(16, b.bottom - b.top + 16)); ctx.restore();
        }
      }
      function point(event) {
        const r = event.target.getBoundingClientRect();
        return [Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)), event.clientY + window.scrollY];
      }
      function finishMark() {
        if (!active) return;
        checkpoint(); marks.push(active); active = null;
        drawMarks(); persistMarks();
      }
      document.addEventListener('pointerdown', (event) => {
        if (event.target.id !== 'annotation-canvas' || event.button !== 0 || active) return;
        event.preventDefault();
        const p = point(event);
        if (tool === 'view') { document.getElementById('benchmark').click(); return; }
        if (tool === 'select') {
          selected = -1;
          for (let i = marks.length - 1; i >= 0; i--) {
            if (marks[i].tool === 'eraser') continue;
            const b = bounds(marks[i]);
            if (event.clientX >= b.left - 12 && event.clientX <= b.right + 12 && event.clientY >= b.top - 12 && event.clientY <= b.bottom + 12) { selected = i; break; }
          }
          if (selected >= 0) {
            const m = marks[selected], pts = screenPoints(m), end = pts[pts.length - 1];
            drag = { start: p, original: JSON.parse(JSON.stringify(m)), changed: false, resize: ['rect', 'arrow', 'mosaic'].includes(m.tool) && Math.hypot(event.clientX - end[0], event.clientY - end[1]) < 18 };
            event.target.setPointerCapture(event.pointerId);
          }
          drawMarks(); return;
        }
        active = { page: true, tool, points: [p], color: document.getElementById('mark-color').value, width: Number(document.getElementById('mark-width').value) };
        if (tool === 'text') {
          const pending = active; active = null;
          editText(event.clientX, event.clientY, '', (text) => { active = pending; active.text = text; finishMark(); }); return;
        }
        event.target.setPointerCapture(event.pointerId);
      });
      document.addEventListener('pointermove', (event) => {
        if (drag && selected >= 0 && event.target.id === 'annotation-canvas') {
          const p = point(event), mark = marks[selected], original = drag.original;
          if (!drag.changed && (Math.abs(p[0] - drag.start[0]) * innerWidth > 2 || Math.abs(p[1] - drag.start[1]) > 2)) { checkpoint(); drag.changed = true; }
          if (drag.changed) {
            const rect = document.getElementById('benchmark').getBoundingClientRect();
            const dx = p[0] - drag.start[0], dy = p[1] - drag.start[1];
            mark.points = original.points.map((v) => mark.page ? [v[0] + dx, v[1] + dy] : [v[0] + dx * innerWidth / rect.width, v[1] + dy / rect.height]);
            if (drag.resize) mark.points[0] = original.points[0].slice();
            drawMarks();
          }
          return;
        }
        if (!active || event.target.id !== 'annotation-canvas') return;
        const p = point(event);
        if (['pen', 'eraser'].includes(active.tool)) active.points.push(p);
        else active.points[1] = p;
        drawMarks();
      });
      document.addEventListener('pointerup', () => { if (drag) { if (drag.changed) persistMarks(); drag = null; } else finishMark(); });
      document.addEventListener('dblclick', (event) => {
        if (tool !== 'select' || event.target.id !== 'annotation-canvas' || selected < 0 || marks[selected].tool !== 'text') return;
        const index = selected;
        editText(event.clientX, event.clientY, marks[index].text, (text) => { checkpoint(); marks[index].text = text; drawMarks(); persistMarks(); });
      });
      document.addEventListener('keydown', (event) => {
        if (tool !== 'select' || selected < 0 || event.target.matches('input,textarea,select')) return;
        if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); checkpoint(); marks.splice(selected, 1); selected = -1; drawMarks(); persistMarks(); }
      });
      document.addEventListener('pointercancel', () => { active = null; drawMarks(); });
      document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-mark-tool]');
        if (button) {
          tool = button.dataset.markTool;
          document.getElementById('annotation-canvas').style.pointerEvents = tool === 'view' ? 'none' : 'auto';
          document.querySelectorAll('[data-mark-tool]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
          drawMarks();
        }
        if (event.target.id === 'mark-delete' && selected >= 0) { checkpoint(); marks.splice(selected, 1); selected = -1; drawMarks(); persistMarks(); }
        if (event.target.id === 'mark-undo' && history.length) { redo.push(JSON.stringify(marks)); marks = JSON.parse(history.pop()); selected = -1; drawMarks(); persistMarks(); }
        if (event.target.id === 'mark-redo' && redo.length) { history.push(JSON.stringify(marks)); marks = JSON.parse(redo.pop()); selected = -1; drawMarks(); persistMarks(); }
      });
      window.addEventListener('scroll', drawMarks, { passive: true });
      window.addEventListener('resize', drawMarks);
      document.getElementById('save-close').onclick = () => {
        finishMark();
        if (!current || !window.opener || window.opener.closed) { document.getElementById('status').textContent = '保存失败：请保持 PLM 原页面打开'; return; }
        document.getElementById('status').textContent = '正在保存…';
        send({ type: 'pfh-review-save-close', sku: current.sku, value: document.getElementById('english-document').value, annotations: marks });
      };
      const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      window.addEventListener('message', (event) => {
        if (event.source === window.opener && event.data && event.data.type === 'pfh-review-save-result') {
          if (event.data.ok) { dirty = false; window.close(); }
          else document.getElementById('status').textContent = '保存失败，请重试：' + event.data.error;
          return;
        }
        if (event.source === window.opener && event.data && event.data.type === 'pfh-review-annotation-saved') {
          if (event.data.ok && event.data.revision === revision) dirty = false;
          document.getElementById('status').textContent = event.data.ok ? '标注已保存' : '标注保存失败，请点击保存并关闭重试';
          return;
        }
        if (event.source !== window.opener || !event.data || event.data.type !== 'pfh-review-data') return;
        const p = event.data.payload;
        current = p;
        document.getElementById('meta').textContent = p.sku + ' · 英文输入即保存到本地';
        document.getElementById('status').textContent = p.status || '';
        const board = document.getElementById('board');
        if (p.layout && p.layout.w1) board.style.setProperty('--w1', p.layout.w1 + 'px');
        if (p.layout && p.layout.w2) board.style.setProperty('--w2', p.layout.w2 + 'px');
        if (board.dataset.count !== String(p.items.length)) {
          board.dataset.count = p.items.length;
          board.innerHTML = '<aside><h2>产品对标图</h2><div class="annotation-stage"><img id="benchmark" alt="产品对标图"></div><p>选择查看可编辑文字或查看大图；选择标注工具可在网页上绘制</p></aside><section><h2>英文文案 <small>由你编辑</small></h2><div id="english"></div></section><section class="translation"><h2>中文翻译 <small>Google 翻译</small></h2><div id="chinese"></div></section>';
          document.getElementById('english').innerHTML = '<textarea id="english-document" aria-label="完整英文文案" placeholder="包装原文，可直接修改"></textarea>';
          document.getElementById('chinese').innerHTML = '<textarea readonly id="chinese-document" aria-label="完整中文翻译" placeholder="等待翻译…"></textarea>';
        }
        if (annotationKey !== p.sku + p.image) { annotationKey = p.sku + p.image; marks = p.annotations || []; redo.length = 0; dirty = false; }
        const image = document.getElementById('benchmark');
        image.onload = drawMarks;
        if (image.getAttribute('src') !== p.image) image.src = p.image;
        drawMarks();
        const en = document.getElementById('english-document');
        if (document.activeElement !== en) en.value = p.english;
        document.getElementById('chinese-document').value = p.chinese;
        document.getElementById('report').innerHTML = '<h2>侵权风险报告</h2><p class="muted">建议仅供挑选，点击选用后才写入英文文案。</p>' + p.items.map((x) => '<article><strong>' + (x.isRisk ? '需核查' : '暂未发现明显风险') + ' · 文字块 ' + (x.index + 1) + '</strong><blockquote>' + esc(x.sourceText) + '</blockquote><p>' + esc(x.isRisk ? x.riskReason : '当前文字未发现明确风险，仍需结合实际产品资料确认。') + '</p>' + (x.suggestions || []).map((option, index) => '<div class="suggestion"><b>建议 ' + (index + 1) + '</b><p>' + esc(option.en) + '</p><p class="muted">' + esc(option.zh || '暂无中文翻译') + '</p><button data-suggestion-item="' + x.index + '" data-suggestion-option="' + index + '">选用这条英文</button></div>').join('') + (x.isRisk && !x.suggestions.length ? '<p class="muted">旧报告没有建议，请重新分析获取。</p>' : '') + '</article>').join('') + (p.warnings || []).map((x) => '<p>' + esc(x) + '</p>').join('');
      });
      document.addEventListener('input', (event) => {
        const t = event.target;
        if (t.id !== 'english-document') return;
        current.english = t.value;
        document.getElementById('chinese-document').value = '';
        send({ type: 'pfh-review-document-input', value: t.value });
      });
      document.getElementById('retry').onclick = () => send({ type: 'pfh-review-tab-translate' });
      document.getElementById('net-add').onclick = () => {
        const formatted = formatNetContent(document.getElementById('net-value').value);
        if (!formatted) { document.getElementById('status').textContent = '请输入正数和单位，例如 60g 或 100ml'; return; }
        const en = document.getElementById('english-document');
        en.value += (en.value && !en.value.endsWith('\n') ? '\n' : '') + formatted;
        en.dispatchEvent(new Event('input', { bubbles: true }));
      };
      document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-suggestion-item]');
        if (!button || !current) return;
        const item = current.items[Number(button.dataset.suggestionItem)];
        const option = item.suggestions[Number(button.dataset.suggestionOption)];
        const en = document.getElementById('english-document');
        // Select only the first exact occurrence; edited or removed text is left for manual insertion.
        const position = en.value.indexOf(item.sourceText);
        if (!item.sourceText || position < 0) { document.getElementById('status').textContent = '原文已修改，请复制建议后手动替换'; return; }
        en.value = en.value.slice(0, position) + option.en + en.value.slice(position + item.sourceText.length);
        en.dispatchEvent(new Event('input', { bubbles: true }));
      });
      document.getElementById('copy').onclick = () => {
        if (current) navigator.clipboard.writeText(document.getElementById('english-document').value).then(() => { document.getElementById('status').textContent = '英文已复制'; }).catch(() => { document.getElementById('status').textContent = '复制失败，请选中文本复制'; });
      };
      document.addEventListener('click', (event) => { if (event.target.id === 'benchmark') { const dialog = document.getElementById('zoom'); dialog.querySelector('img').src = event.target.src; dialog.showModal(); } });
      document.getElementById('zoom').onclick = () => document.getElementById('zoom').close();
      send({ type: 'pfh-review-tab-ready' });
    }
    const css = `*{box-sizing:border-box}body{margin:0;background:#f5f7f8;color:#243339;font:15px/1.6 'Segoe UI','Microsoft YaHei',sans-serif}header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 32px;background:#fff;border-bottom:1px solid #dce3e5}h1{font-size:21px;margin:0}h2{font-size:16px;margin:0 0 20px}small,.muted,#meta{font-size:13px;color:#596970}small{display:block;font-weight:400}main{padding:28px 32px}#board{display:grid;grid-template-columns:var(--w1,minmax(220px,.85fr)) var(--w2,minmax(260px,1fr)) minmax(260px,1fr);gap:28px;align-items:start}section,aside{min-width:0}aside{position:sticky;top:20px}#benchmark{display:block;width:100%;max-height:65vh;object-fit:contain;background:#fff;border-radius:12px;cursor:zoom-in}aside p{font-size:12px;color:#596970}textarea{display:block;width:100%;height:65vh;min-height:360px;resize:vertical;padding:16px;border:1px solid #cbd5d9;border-radius:10px;background:#fff;font:inherit;line-height:1.7;color:#243339;caret-color:#17695f}textarea:focus-visible,button:focus-visible{outline:2px solid #17695f;outline-offset:3px}.translation textarea{background:#eaf1f0;border-color:transparent;resize:vertical}.text-row{margin-bottom:20px}.text-row label,.text-row span{display:block;margin-bottom:7px;font-size:12px;color:#596970}button{padding:9px 16px;border:1px solid #cbd5d9;border-radius:8px;background:#fff;color:#243339;cursor:pointer}button:hover{background:#edf3f2}#copy{background:#17695f;color:white;border-color:#17695f}nav{display:flex;gap:10px;align-items:center;flex-wrap:wrap}#status{color:#17695f;font-size:13px}#report{margin-top:36px;padding:28px;background:#fff;border-radius:12px}article{border-top:1px solid #e1e7e9;padding:18px 0}article strong{font-size:14px}blockquote{margin:8px 0;color:#596970;white-space:pre-wrap}article p{margin:6px 0;max-width:75ch}dialog{border:0;border-radius:12px;max-width:90vw;max-height:90vh;padding:12px}dialog::backdrop{background:#14252bd9}dialog img{max-width:85vw;max-height:82vh}::selection{background:#cce5df}@media(max-width:900px){header{align-items:start;flex-direction:column}main{padding:20px}#board{grid-template-columns:1fr 1fr;gap:16px}aside{grid-column:1/-1;position:static}#benchmark{max-height:300px}}@media(max-width:560px){#board{grid-template-columns:1fr}aside{grid-column:auto}header{padding:20px}}`;
    return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>包装文案编辑</title><style>' + css + '.tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 32px;background:#fff;border-bottom:1px solid #dce3e5}.tools input{padding:10px;border:1px solid #cbd5d9;border-radius:8px;font:inherit;width:160px}.suggestion{margin:16px 0;padding:16px;background:#f5f7f8;border-radius:8px}.suggestion p{white-space:pre-wrap}.annotation-stage{position:relative;background:#fff;border-radius:12px;overflow:hidden}.annotation-stage #benchmark{max-height:none;height:auto;border-radius:0}.annotation-stage canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair}.annotation-tools button[aria-pressed="true"]{background:#17695f;color:#fff}.annotation-tools input[type="color"]{width:44px;padding:2px;height:32px}.annotation-tools label{display:flex;gap:8px;align-items:center}header{position:sticky;top:0;z-index:30;align-items:center}.header-tools{flex:1;min-width:0}.header-tools .tools{padding:3px 8px;border:0;gap:6px}.header-tools .tools input{padding:5px;width:120px}.header-tools button{padding:5px 9px}.header-tools .muted{display:none}#annotation-canvas{position:fixed;inset:0;width:100vw;height:100vh;z-index:20;pointer-events:none;touch-action:none;cursor:crosshair}@media(max-width:900px){header{position:relative}.header-tools .tools{padding:6px 0}}.header-tools .tools{gap:5px}.header-tools button{border-color:transparent;background:#f1f5f4;color:#34534f;border-radius:8px;font-weight:600;transition:background .15s,color .15s}.header-tools button:hover{background:#dcebe7}.header-tools input{background:#f5f8f7;border-color:#dce7e3;border-radius:8px}.annotation-tools select{appearance:none;border:0;border-radius:7px;padding:6px 20px 6px 9px;background:#edf4f1;color:#34534f}.annotation-tools label{font-size:12px;color:#526d66}.annotation-tools input[type="color"]{width:30px;height:30px;border:0;border-radius:50%;overflow:hidden;background:none}.annotation-input{position:fixed;z-index:100;width:220px;height:90px;min-height:0;padding:10px;background:white;border:2px solid #17695f;border-radius:8px;box-shadow:0 10px 30px #173d3433;resize:both}</style><body><header><div><h1>包装文案编辑</h1><div id="meta"></div></div><div class="header-tools"><div class="tools"><label for="net-value">净含量换算</label><input id="net-value" placeholder="60g / 100ml"><button id="net-add">换算并添加到英文</button><span class="muted">克 → OZ · 毫升 → 美制 FL.OZ</span></div><div class="tools annotation-tools" aria-label="图片标注工具"><button data-mark-tool="view" aria-pressed="true">查看</button><button data-mark-tool="select" aria-pressed="false" title="拖动标注，拖动终点调整大小，双击编辑文字">选择</button><button data-mark-tool="arrow" aria-pressed="false">箭头</button><button data-mark-tool="rect" aria-pressed="false">方框</button><button data-mark-tool="mosaic" aria-pressed="false">马赛克</button><button data-mark-tool="text" aria-pressed="false">文字</button><button data-mark-tool="pen" aria-pressed="false">画笔</button><button data-mark-tool="eraser" aria-pressed="false">橡皮擦</button><label>颜色 <input id="mark-color" type="color" value="#d63638"></label><label>粗细 <select id="mark-width"><option value="3">细</option><option value="6" selected>中</option><option value="10">粗</option></select></label><button id="mark-delete" title="删除选中标注">删除</button><button id="mark-undo">撤销</button><button id="mark-redo">重做</button></div></div><nav><span id="status" role="status"></span><button id="save-close">保存并关闭</button><button id="retry">重新翻译</button><button id="copy">复制英文文案</button></nav></header><canvas id="annotation-canvas" aria-label="网页标注画布"></canvas><main><div id="board"></div><section id="report"></section></main><dialog id="zoom"><img alt="产品对标大图"></dialog><script>const formatNetContent = ' + productDevelopmentFormatReviewNetContent.toString() + ';(' + editorClient.toString() + ')();</scr' + 'ipt></body></html>';
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
      if (!data || typeof data !== 'object' || data.source !== 'pfh-review-tab' || event.source !== productDevelopmentEditorTabWindow) return;
      const result = state.productDevelopmentReview;
      const list = result && Array.isArray(result.items) ? result.items : [];
      if (data.type === 'pfh-review-tab-ready') {
        productDevelopmentPushEditorTabData();
        if (result) {
          const draft = productDevelopmentReviewDocument(result);
          if (!draft.replacementZh) productDevelopmentTranslateReviewItem(result, draft);
        }
        return;
      }
      if (data.type === 'pfh-review-tab-layout') {
        productDevelopmentWriteReviewEditorLayout(data.layout);
        return;
      }
      if (!result) return;
      if (data.type === 'pfh-review-annotations' || data.type === 'pfh-review-save-close') {
        const close = data.type === 'pfh-review-save-close';
        try {
          if (data.sku !== result.sku) throw new Error('当前产品已切换，请重新打开编辑页');
          if (!Array.isArray(data.annotations)) throw new Error('标注数据无效');
          result.annotations = data.annotations;
          if (close) {
            productDevelopmentReviewDocument(result).replacementEn = String(data.value == null ? '' : data.value);
            result.plainTextCopy = result.editorDocument.replacementEn;
          }
          saveProductDevelopmentReviewDraft(result);
          const saved = getProductDevelopmentReviewDraft(result.sku);
          if (!saved || JSON.stringify(saved.annotations) !== JSON.stringify(result.annotations) || (close && saved.editorDocument.replacementEn !== result.editorDocument.replacementEn)) throw new Error('本地缓存写入失败或空间不足');
          event.source.postMessage({ type: close ? 'pfh-review-save-result' : 'pfh-review-annotation-saved', ok: true, revision: data.revision }, '*');
          if (close) renderShell();
        } catch (error) {
          event.source.postMessage({ type: close ? 'pfh-review-save-result' : 'pfh-review-annotation-saved', ok: false, revision: data.revision, error: String(error.message || error) }, '*');
        }
        return;
      }
      if (data.type === 'pfh-review-document-input') {
        const draft = productDevelopmentReviewDocument(result);
        draft.replacementEn = String(data.value == null ? '' : data.value);
        result.plainTextCopy = draft.replacementEn;
        productDevelopmentTranslateReviewItem(result, draft);
        saveProductDevelopmentReviewDraft(result);
        state.productDevelopmentStatus = '英文已保存 · 正在翻译…';
        productDevelopmentPushEditorTabData();
        renderShell();
        return;
      }
      if (data.type === 'pfh-review-tab-input') {
        const item = list[Number(data.index)];
        const field = String(data.field || '');
        const value = String(data.value == null ? '' : data.value);
        if (!item) return;
        if (field !== 'replacementEn') return;
        item.replacementEn = value;
        result.plainTextCopy = list.map((row) => row.replacementEn == null ? row.sourceText : row.replacementEn).join('\n');
        saveProductDevelopmentReviewDraft(result);
        state.productDevelopmentStatus = '英文已保存 · 正在翻译…';
        productDevelopmentTranslateReviewItem(result, item);
        productDevelopmentPushEditorTabData();
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
        productDevelopmentTranslateReviewItem(result, productDevelopmentReviewDocument(result));
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
    if (mode === 'revised' && result && result.editorDocument) return result.editorDocument.replacementEn;
    if (result && result.reviewMode === 'original-report') {
      return (result.items || []).map((item) => mode === 'revised' ? String(item.replacementEn == null ? item.sourceText : item.replacementEn) : item.sourceText).join('\n');
    }
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
    showToast('文案输入即保存，不再生成对照图片');
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
