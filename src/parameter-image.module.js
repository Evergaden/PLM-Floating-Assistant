  function createParameterImageFeature(context) {
    const sessions = Object.create(null);
    const logoCache = Object.create(null);
    const editorOverlayId = context.panelId + '-parameter-editor-overlay';
    const editorLogPrefix = '[PLM参数图][手动标注]';
    let editorPreviousRootOverflow = '';
    const defaultRules = [
      { category: '精华液', keywords: ['精华液', 'serum', 'essence'], phrase: 'Anti-wrinkle & glow', priority: 100 },
      { category: '眼霜', keywords: ['眼霜', 'eye cream', 'eye treatment'], phrase: 'Brightens & smooths', priority: 100 },
      { category: '面霜', keywords: ['面霜', 'face cream', 'moisturizer'], phrase: 'Hydrates & firms', priority: 90 },
      { category: '防晒', keywords: ['防晒', 'sunscreen', 'sun cream'], phrase: 'Daily UV protection', priority: 90 },
      { category: '身体护理', keywords: ['身体乳', 'body lotion', 'body cream'], phrase: 'Softens & moisturizes', priority: 80 },
      { category: '洗护', keywords: ['洗发', 'shampoo', '护发', 'conditioner'], phrase: 'Cleanses & nourishes', priority: 70 },
      { category: '营养补充', keywords: ['胶囊', 'capsule', 'supplement'], phrase: 'Daily nutrition support', priority: 60 },
    ];
    let featureRules = defaultRules.slice();
    let rulesLoaded = false;

    const number = (value) => {
      const matched = String(value == null ? '' : value).match(/\d+(?:\.\d+)?/);
      return matched ? Number(matched[0]) : 0;
    };
    const sizeText = (value) => context.formatNumber(number(value));
    const inchText = (value) => (number(value) / 2.54).toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
    const fieldValue = (data, key, index) => number(data && data[key]) || number(data && data[index + 'Value']);
    const hasCjk = (value) => /[\u3400-\u9fff]/.test(String(value || ''));
    const sanitizeEnglishName = (value, brand) => {
      const text = String(value || '').replace(/^PRODUCT\s*NAME\s*[:：]?\s*/i, '').split(/[\r\n|]/)[0].trim();
      return /[A-Za-z]/.test(text) && !hasCjk(text) ? cleanEnglishProductName(text, brand) : '';
    };

    const preferredImageUrl = (data) => {
      const candidates = data && [
        data.skuImageUrl,
        data.skuImageFallbackUrl,
        data.productListImageUrl,
        data.productListImageFallbackUrl,
        data.toyLabelProductImageUrl,
        data.toyLabelProductImageFallbackUrl,
        data.benchmarkImageUrl,
        data.benchmarkImageFallbackUrl,
      ];
      return (candidates || []).map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
    };

    function collectTextValues(value, output, depth) {
      if (depth > 5 || value == null) return;
      if (typeof value === 'string') { output.push(value); return; }
      if (Array.isArray(value)) { value.forEach((item) => collectTextValues(item, output, depth + 1)); return; }
      if (typeof value === 'object') Object.values(value).forEach((item) => collectTextValues(item, output, depth + 1));
    }

    function extractEnglishName(data) {
      const direct = sanitizeEnglishName(data && (data.englishName || data.productEnglishName || ''), data && data.brand);
      if (direct) return direct;
      const values = [];
      collectTextValues(data && (data.copywriting || data), values, 0);
      for (const value of values) {
        const matched = String(value).match(/PRODUCT\s*NAME\s*[:：]\s*([^\r\n|]+)/i);
        const result = sanitizeEnglishName(matched ? matched[1] : '', data && data.brand);
        if (result) return result;
      }
      return '';
    }
    function extractShelfLife(data) {
      const source = JSON.stringify(data && data.copywriting || data || {});
      const matched = source.match(/SHELF\s*LIFE\s*[:：]?\s*(\d+)\s*(Years?|Months?)/i);
      return matched ? matched[1] + matched[2].toLowerCase() : '3years';
    }

    function matchFeature(data, englishName) {
      const category = context.productType(data) || '';
      const haystack = [category, data && data.name, englishName].filter(Boolean).join(' ').toLowerCase();
      const matched = featureRules.slice().sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)).find((rule) =>
        (rule.keywords || []).some((keyword) => haystack.includes(String(keyword).toLowerCase()))
      );
      return matched ? matched.phrase : 'Everyday care & comfort';
    }

    function ensureSession(data) {
      const sku = String(data && data.sku || '');
      if (!sessions[sku]) {
        const englishName = extractEnglishName(data);
        sessions[sku] = {
          file: null,
          fileName: '',
          analysis: null,
          productResult: '',
          englishResult: '',
          busy: false,
          error: '',
          singleBottle: Boolean(data && data.singleBottle),
          showSide: null,
          frontIsLength: true,
          featuresDirty: false,
          editorOpen: false,
          manualTarget: Boolean(data && data.singleBottle) ? 'product' : 'box',
          manualPoints: { box: [], product: [] },
          editorImage: null,
          editorSourceUrl: '',
          editorDragging: null,
          editorMountToken: 0,
          editorStatus: '',
          editorLoadError: '',
          editorLogs: [],
          editorLastDrawKey: '',
          editorResizeObserver: null,
          fields: {
            englishName,
            netContent: String(data && data.netContent || ''),
            shelfLife: extractShelfLife(data),
            grossWeight: String(data && data.grossWeight || ''),
            features: matchFeature(data, englishName),
            store: 'Store in a cool and dry place',
            packageLength: fieldValue(data, 'packageLength', 'cartonLength'),
            packageWidth: fieldValue(data, 'packageWidth', 'cartonWidth'),
            packageHeight: fieldValue(data, 'packageHeight', 'cartonHeight'),
            productWidth: data && data.omitEstimatedProductSize
              ? 0
              : (data && data.isTubePrint
                ? (fieldValue(data, 'tailSealLengthValue', 'tailSealLength') || fieldValue(data, 'tubeTailSealLengthValue', 'tubeTailSealLength') || fieldValue(data, 'productWidth', 'productWidth'))
                : fieldValue(data, 'productWidth', 'productWidth')),
            productHeight: data && data.omitEstimatedProductSize ? 0 : fieldValue(data, 'productHeight', 'productHeight'),
          },
        };
      }
      return sessions[sku];
    }

    async function loadRules() {
      if (rulesLoaded) return false;
      rulesLoaded = true;
      try {
        const response = await context.cloudRequest('/parameter-features', { method: 'GET' });
        const rows = response && Array.isArray(response.rules) ? response.rules : [];
        if (rows.length) { featureRules = rows; return true; }
      } catch (_) {}
      return false;
    }

    function fieldHtml(session, key, label, wide) {
      return '<label' + (wide ? ' class="wide"' : '') + '><span>' + context.escapeHtml(label) + '</span><input class="pfh-parameter-field" data-field="' + key + '" value="' + context.escapeHtml(session.fields[key] == null ? '' : session.fields[key]) + '"></label>';
    }

    function manualPointLabels(target) {
      return target === 'box' ? ['起点', '长', '宽', '高'] : ['起点', '宽', '高'];
    }

    function requiredManualPoints(target) {
      return manualPointLabels(target).length;
    }

    function completeManualPath(session, target) {
      const points = session.manualPoints && session.manualPoints[target];
      return Array.isArray(points) && points.length >= requiredManualPoints(target);
    }

    function editorLog(session, step, detail, level) {
      const payload = detail && typeof detail === 'object' ? detail : (detail == null ? {} : { detail: String(detail) });
      const entry = { time: new Date().toLocaleTimeString(), step: String(step || '状态'), detail: payload };
      if (!Array.isArray(session.editorLogs)) session.editorLogs = [];
      session.editorLogs.push(entry);
      if (session.editorLogs.length > 80) session.editorLogs.splice(0, session.editorLogs.length - 80);
      const method = level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log');
      try { console[method](editorLogPrefix + ' ' + entry.step, payload); } catch (_) {}
      refreshEditorDiagnostics(session);
    }

    function editorLogText(session) {
      return (session.editorLogs || []).map((entry) => {
        let detail = '';
        try { detail = Object.keys(entry.detail || {}).length ? ' ' + JSON.stringify(entry.detail) : ''; } catch (_) {}
        return '[' + entry.time + '] ' + entry.step + detail;
      }).join('\n') || '暂无日志';
    }

    function manualEditorHtml(session) {
      const target = session.manualTarget === 'product' ? 'product' : 'box';
      const boxCount = (session.manualPoints.box || []).length;
      const productCount = (session.manualPoints.product || []).length;
      const targetLabel = target === 'box' ? '纸盒' : '产品';
      const labels = manualPointLabels(target);
      const statusClass = session.editorLoadError ? ' is-error' : '';
      return '<section class="pfh-parameter-editor">' +
        '<header class="pfh-parameter-editor-head"><h3>手动标注尺寸路径</h3><span>拖动已有点可微调 · 按住 Ctrl 吸附横线/竖线</span><button type="button" data-action="parameter-editor-close">关闭</button></header>' +
        '<div class="pfh-parameter-editor-tools">' +
          '<button type="button" data-action="parameter-editor-target" data-target="box" class="' + (target === 'box' ? 'is-active' : '') + '">纸盒 ' + boxCount + '/4</button>' +
          '<button type="button" data-action="parameter-editor-target" data-target="product" class="' + (target === 'product' ? 'is-active' : '') + '">产品 ' + productCount + '/3</button>' +
          '<button type="button" data-action="parameter-editor-undo">撤销一点</button><button type="button" data-action="parameter-editor-reset">重画当前</button>' +
          '<button type="button" data-action="parameter-editor-retry">重新载入底图</button>' +
          '<button type="button" class="pfh-parameter-editor-apply" data-action="parameter-editor-apply">应用并生成</button>' +
        '</div>' +
        '<div class="pfh-parameter-editor-stage' + (!session.editorImage && !session.editorLoadError ? ' is-loading' : '') + '"><canvas class="pfh-parameter-editor-canvas"></canvas></div>' +
        '<footer class="pfh-parameter-editor-foot"><span>当前：<b>' + targetLabel + '</b>，依次点击 ' + labels.join(' → ') + '</span><span class="pfh-parameter-editor-status' + statusClass + '">' + context.escapeHtml(session.editorStatus || '等待载入底图') + '</span><span class="pfh-parameter-editor-progress">已标 ' + (session.manualPoints[target] || []).length + '/' + labels.length + ' 点</span></footer>' +
        '<details class="pfh-parameter-editor-diagnostics"><summary>诊断日志（测试异常时请展开并复制）</summary><pre>' + context.escapeHtml(editorLogText(session)) + '</pre></details>' +
      '</section>';
    }

    function editorScale(image) {
      return Math.max(1, Math.max(image.naturalWidth, image.naturalHeight) / 1200);
    }

    function editorCanvasPadding(image) {
      return Math.round(68 * editorScale(image));
    }

    function fitEditorCanvas(canvas) {
      const stage = canvas && canvas.parentElement;
      if (!canvas || !stage || !canvas.width || !canvas.height) return { scale: 0, width: 0, height: 0 };
      const availableWidth = Math.max(1, stage.clientWidth - 32);
      const availableHeight = Math.max(1, stage.clientHeight - 32);
      const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height, 1);
      const width = Math.max(1, Math.floor(canvas.width * scale));
      const height = Math.max(1, Math.floor(canvas.height * scale));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      return { scale, width, height, stageWidth: stage.clientWidth, stageHeight: stage.clientHeight };
    }

    function drawEditorPath(ctx, points, labels, color, active, scale, offsetX, offsetY) {
      if (!points.length) return;
      const displayPoints = points.map((point) => ({ x: point.x + (offsetX || 0), y: point.y + (offsetY || 0) }));
      ctx.save();
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = (active ? 5 : 3) * scale;
      ctx.setLineDash(active ? [] : [10 * scale, 7 * scale]);
      ctx.beginPath(); ctx.moveTo(displayPoints[0].x, displayPoints[0].y);
      displayPoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke(); ctx.setLineDash([]);
      displayPoints.forEach((point, index) => {
        ctx.beginPath(); ctx.arc(point.x, point.y, 12 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(11 * scale) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(index + 1), point.x, point.y);
        ctx.fillStyle = color; ctx.font = '700 ' + Math.round(18 * scale) + 'px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(labels[index] || '', point.x + 16 * scale, point.y - 10 * scale);
      });
      ctx.restore();
    }

    function drawManualEditorCanvas(canvas, image, session) {
      if (!canvas || !image) throw new Error('标注画布或底图不存在。');
      const width = Number(image.naturalWidth || image.width || 0);
      const height = Number(image.naturalHeight || image.height || 0);
      if (!width || !height) throw new Error('底图尺寸为 0，浏览器没有完成解码。');
      const padding = editorCanvasPadding(image);
      const canvasWidth = width + padding * 2;
      const canvasHeight = height + padding * 2;
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('浏览器无法创建 2D 画布。');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image.source || image, padding, padding, width, height);
      const scale = editorScale(image);
      drawEditorPath(ctx, session.manualPoints.box || [], manualPointLabels('box'), '#7c3aed', session.manualTarget === 'box', scale, padding, padding);
      drawEditorPath(ctx, session.manualPoints.product || [], manualPointLabels('product'), '#0891b2', session.manualTarget === 'product', scale, padding, padding);
      const fit = fitEditorCanvas(canvas);
      const drawKey = [width, height, padding, image.sourceKind || 'image'].join('x');
      if (session.editorLastDrawKey !== drawKey) {
        session.editorLastDrawKey = drawKey;
        editorLog(session, '画布绘制成功', {
          imageWidth: width,
          imageHeight: height,
          safePadding: padding,
          sourceKind: image.sourceKind || 'image',
          cssWidth: fit.width,
          cssHeight: fit.height,
          fitScale: Number(fit.scale.toFixed(4)),
          stageWidth: fit.stageWidth,
          stageHeight: fit.stageHeight,
        });
      }
    }

    function canvasPoint(event, canvas, image) {
      const rect = canvas.getBoundingClientRect();
      const padding = editorCanvasPadding(image);
      const width = Number(image.naturalWidth || image.width || 0);
      const height = Number(image.naturalHeight || image.height || 0);
      const rawX = (event.clientX - rect.left) * canvas.width / Math.max(1, rect.width) - padding;
      const rawY = (event.clientY - rect.top) * canvas.height / Math.max(1, rect.height) - padding;
      return {
        x: Math.max(0, Math.min(width, rawX)),
        y: Math.max(0, Math.min(height, rawY)),
      };
    }

    function constrainEditorPoint(point, points, index, enabled) {
      if (!enabled || !Array.isArray(points) || !points.length) return { point, axis: '' };
      const anchor = index > 0 ? points[index - 1] : points[1];
      if (!anchor) return { point, axis: '' };
      const dx = point.x - anchor.x;
      const dy = point.y - anchor.y;
      if (Math.abs(dx) >= Math.abs(dy)) return { point: { x: point.x, y: anchor.y }, axis: 'horizontal' };
      return { point: { x: anchor.x, y: point.y }, axis: 'vertical' };
    }

    function refreshEditorProgress(session) {
      const root = document.getElementById(editorOverlayId);
      const progress = root && root.querySelector('.pfh-parameter-editor-progress');
      const target = session.manualTarget === 'product' ? 'product' : 'box';
      if (progress) progress.textContent = '已标 ' + (session.manualPoints[target] || []).length + '/' + requiredManualPoints(target) + ' 点';
    }

    function refreshEditorDiagnostics(session) {
      const root = document.getElementById(editorOverlayId);
      const pre = root && root.querySelector('.pfh-parameter-editor-diagnostics pre');
      const status = root && root.querySelector('.pfh-parameter-editor-status');
      if (pre) pre.textContent = editorLogText(session);
      if (status) {
        status.textContent = session.editorStatus || '等待载入底图';
        status.classList.toggle('is-error', Boolean(session.editorLoadError));
      }
    }

    function readFileDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Unable to read annotation image.'));
        reader.readAsDataURL(file);
      });
    }

    function inspectEditorSnapshot(snapshot) {
      try {
        const sample = document.createElement('canvas');
        const maxSide = 80;
        const scale = Math.min(1, maxSide / Math.max(snapshot.width, snapshot.height));
        sample.width = Math.max(1, Math.round(snapshot.width * scale));
        sample.height = Math.max(1, Math.round(snapshot.height * scale));
        const ctx = sample.getContext('2d', { willReadFrequently: true });
        if (!ctx) return { sampled: false, reason: 'no-2d-context' };
        ctx.drawImage(snapshot, 0, 0, sample.width, sample.height);
        const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
        let visible = 0;
        for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 8) visible += 1;
        return {
          sampled: true,
          sampleWidth: sample.width,
          sampleHeight: sample.height,
          visiblePixels: visible,
          alphaCoveragePercent: Number((visible / Math.max(1, pixels.length / 4) * 100).toFixed(2)),
        };
      } catch (error) {
        return { sampled: false, reason: String(error && error.message || error) };
      }
    }

    function snapshotEditorImage(source, width, height, sourceKind) {
      if (!width || !height) throw new Error(sourceKind + ' 解码后的尺寸为 0。');
      const snapshot = document.createElement('canvas');
      snapshot.width = width;
      snapshot.height = height;
      const ctx = snapshot.getContext('2d');
      if (!ctx) throw new Error('无法创建底图快照画布。');
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(source, 0, 0, width, height);
      return {
        source: snapshot,
        sourceKind,
        naturalWidth: width,
        naturalHeight: height,
        inspection: inspectEditorSnapshot(snapshot),
      };
    }

    async function loadFileImageBitmap(file, sourceUrl, session) {
      editorLog(session, '开始读取底图', {
        fileName: file && file.name || '',
        fileType: file && file.type || '',
        fileSize: file && file.size || 0,
        hasCachedDataUrl: Boolean(sourceUrl),
      });
      let blobUrl = '';
      try {
        blobUrl = URL.createObjectURL(file);
        const image = await loadImage(blobUrl);
        const result = snapshotEditorImage(image, image.naturalWidth, image.naturalHeight, 'blob-url');
        editorLog(session, 'Blob URL 解码成功', { width: result.naturalWidth, height: result.naturalHeight, inspection: result.inspection });
        return result;
      } catch (error) {
        editorLog(session, 'Blob URL 读取失败，准备回退', { message: String(error && error.message || error) }, 'warn');
      } finally {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      }
      const bitmapFactory = typeof createImageBitmap === 'function'
        ? createImageBitmap
        : (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function' ? window.createImageBitmap.bind(window) : null);
      if (bitmapFactory) {
        let bitmap = null;
        try {
          bitmap = await bitmapFactory(file);
          const result = snapshotEditorImage(bitmap, bitmap.width, bitmap.height, 'image-bitmap');
          editorLog(session, 'ImageBitmap 解码成功', { width: result.naturalWidth, height: result.naturalHeight, inspection: result.inspection });
          return result;
        } catch (error) {
          editorLog(session, 'ImageBitmap 读取失败，准备回退', { message: String(error && error.message || error) }, 'warn');
        } finally {
          try { if (bitmap && bitmap.close) bitmap.close(); } catch (_) {}
        }
      }
      let dataUrl = sourceUrl;
      if (!dataUrl) {
        dataUrl = await readFileDataUrl(file);
        session.editorSourceUrl = dataUrl;
        editorLog(session, 'FileReader 转换成功', { dataUrlLength: dataUrl.length });
      }
      const image = await loadImage(dataUrl);
      const result = snapshotEditorImage(image, image.naturalWidth, image.naturalHeight, 'data-url');
      editorLog(session, 'Data URL 解码成功', { width: result.naturalWidth, height: result.naturalHeight, inspection: result.inspection });
      return result;
    }

    async function mountManualEditor(data, suppliedRoot) {
      const session = ensureSession(data);
      if (!session.editorOpen || !session.file) return;
      const root = suppliedRoot || document.getElementById(editorOverlayId);
      const canvas = root && root.querySelector('.pfh-parameter-editor-canvas');
      if (!canvas) {
        editorLog(session, '挂载失败', { reason: '找不到 canvas 节点' }, 'error');
        return;
      }
      const mountToken = ++session.editorMountToken;
      editorLog(session, '开始挂载工作区', { mountToken, hasCachedImage: Boolean(session.editorImage) });
      try {
        session.editorStatus = session.editorImage ? '正在恢复底图…' : '正在读取底图…';
        refreshEditorDiagnostics(session);
        if (!session.editorImage) session.editorImage = await loadFileImageBitmap(session.file, session.editorSourceUrl, session);
      } catch (error) {
        session.editorLoadError = String(error && error.message || error || '无法读取标注图片。');
        session.editorStatus = '底图读取失败：' + session.editorLoadError;
        editorLog(session, '底图读取最终失败', { mountToken, message: session.editorLoadError }, 'error');
        const failedStage = root.querySelector('.pfh-parameter-editor-stage');
        if (failedStage) failedStage.classList.remove('is-loading');
        refreshEditorDiagnostics(session);
        return;
      }
      const activeRoot = document.getElementById(editorOverlayId);
      // The userscript mounts UI directly under <html>, so document.body.contains(canvas) is always false here.
      if (!session.editorOpen || mountToken !== session.editorMountToken || activeRoot !== root || !root.contains(canvas)) {
        editorLog(session, '放弃过期挂载', { mountToken, currentMountToken: session.editorMountToken }, 'warn');
        return;
      }
      try {
        drawManualEditorCanvas(canvas, session.editorImage, session);
      } catch (error) {
        session.editorLoadError = String(error && error.message || error || '底图绘制失败。');
        session.editorStatus = '底图绘制失败：' + session.editorLoadError;
        editorLog(session, '画布绘制失败', { mountToken, message: session.editorLoadError }, 'error');
        refreshEditorDiagnostics(session);
        return;
      }
      session.editorLoadError = '';
      session.editorStatus = '底图已显示，可开始标注';
      const stage = root.querySelector('.pfh-parameter-editor-stage');
      if (stage) stage.classList.remove('is-loading');
      if (session.editorResizeObserver) {
        try { session.editorResizeObserver.disconnect(); } catch (_) {}
        session.editorResizeObserver = null;
      }
      if (stage && typeof ResizeObserver === 'function') {
        session.editorResizeObserver = new ResizeObserver(() => {
          if (root.contains(canvas)) fitEditorCanvas(canvas);
        });
        session.editorResizeObserver.observe(stage);
      }
      refreshEditorDiagnostics(session);
      const redraw = () => { drawManualEditorCanvas(canvas, session.editorImage, session); refreshEditorProgress(session); };
      canvas.onpointerdown = (event) => {
        event.preventDefault();
        const target = session.manualTarget === 'product' ? 'product' : 'box';
        const points = session.manualPoints[target];
        let point = canvasPoint(event, canvas, session.editorImage);
        const radius = 28 * editorScale(session.editorImage);
        let index = points.findIndex((existing) => Math.hypot(existing.x - point.x, existing.y - point.y) <= radius);
        let snapAxis = '';
        if (index < 0 && points.length < requiredManualPoints(target)) {
          const constrained = constrainEditorPoint(point, points, points.length, event.ctrlKey);
          point = constrained.point;
          snapAxis = constrained.axis;
          points.push(point); index = points.length - 1;
          editorLog(session, '新增标注点', { target, index: index + 1, x: Math.round(point.x), y: Math.round(point.y), ctrlSnap: snapAxis || 'none' });
        }
        if (index < 0) return;
        session.editorDragging = { target, index, snapAxis };
        try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
        redraw();
      };
      canvas.onpointermove = (event) => {
        const dragging = session.editorDragging;
        if (!dragging || !session.manualPoints[dragging.target] || !session.manualPoints[dragging.target][dragging.index]) return;
        const points = session.manualPoints[dragging.target];
        const rawPoint = canvasPoint(event, canvas, session.editorImage);
        const constrained = constrainEditorPoint(rawPoint, points, dragging.index, event.ctrlKey);
        points[dragging.index] = constrained.point;
        dragging.snapAxis = constrained.axis;
        redraw();
      };
      const release = (event) => {
        const dragging = session.editorDragging;
        const finalPoint = dragging && session.manualPoints[dragging.target] && session.manualPoints[dragging.target][dragging.index];
        session.editorDragging = null;
        try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
        if (dragging && finalPoint) editorLog(session, '完成标注点定位', {
          target: dragging.target,
          index: dragging.index + 1,
          x: Math.round(finalPoint.x),
          y: Math.round(finalPoint.y),
          ctrlSnap: dragging.snapAxis || 'none',
        });
      };
      canvas.onpointerup = release; canvas.onpointercancel = release;
    }

    function closeManualEditor(session, reason) {
      session.editorOpen = false;
      session.editorDragging = null;
      session.editorMountToken += 1;
      if (session.editorResizeObserver) {
        try { session.editorResizeObserver.disconnect(); } catch (_) {}
        session.editorResizeObserver = null;
      }
      const overlay = document.getElementById(editorOverlayId);
      if (overlay) overlay.remove();
      document.documentElement.style.overflow = editorPreviousRootOverflow;
      document.documentElement.classList.remove('pfh-parameter-editor-open');
      editorLog(session, '关闭工作区', { reason: reason || 'close' });
    }

    function renderManualEditor(data) {
      const session = ensureSession(data);
      if (!session.editorOpen) {
        closeManualEditor(session, 'render-closed');
        return;
      }
      let overlay = document.getElementById(editorOverlayId);
      document.documentElement.classList.add('pfh-parameter-editor-open');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = editorOverlayId;
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.tabIndex = -1;
        editorPreviousRootOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.appendChild(overlay);
        overlay.addEventListener('click', (event) => {
          const actionTarget = event.target && event.target.closest && event.target.closest('[data-action]');
          const action = actionTarget && actionTarget.getAttribute('data-action');
          if (action) handleEditorAction(action, actionTarget, data);
        });
        overlay.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') { event.preventDefault(); closeManualEditor(session, 'escape'); }
        });
      }
      overlay.innerHTML = manualEditorHtml(session);
      overlay.focus({ preventScroll: true });
      mountManualEditor(data, overlay);
    }

    function openManualEditor(data) {
      const session = ensureSession(data);
      if (!session.file) return;
      session.editorOpen = true;
      session.editorLoadError = '';
      session.editorStatus = session.editorImage ? '正在恢复底图…' : '正在读取底图…';
      session.error = '';
      editorLog(session, '打开全屏工作区', { sku: data && data.sku || '', hasCachedImage: Boolean(session.editorImage) });
      renderManualEditor(data);
    }

    function viewHtml(data) {
      loadRules().then((changed) => {
        if (!changed) return;
        const session = ensureSession(data);
        if (!session.file && !session.featuresDirty) {
          session.fields.features = matchFeature(data, session.fields.englishName);
          context.render();
        }
      });
      if (!data || !data.sku) return '<div class="pfh-parameter-scroll"><div class="pfh-parameter-status is-error">请先从左侧选择 SKU。</div></div>';
      const session = ensureSession(data);
      const status = session.error ? '<div class="pfh-parameter-status is-error">' + context.escapeHtml(session.error) + '</div>' : (session.productResult ? '<div class="pfh-parameter-status">已生成产品尺寸图和英文参数图。</div>' : '');
      const preview = (label, url) => '<div class="pfh-parameter-preview-card"><b>' + label + '</b>' + (url ? '<img src="' + url + '">' : '<span>导入透明 PNG 后显示预览</span>') + '</div>';
      const heroImage = preferredImageUrl(data);
      const heroThumb = heroImage ? '<span class="pfh-parameter-hero-thumb"><img src="' + context.escapeHtml(heroImage) + '" alt=""></span>' : '<span class="pfh-parameter-hero-thumb is-empty">' + context.escapeHtml(data.sku) + '</span>';
      const html = '<div class="pfh-parameter-scroll"><section class="pfh-parameter-page">' +
        '<header class="pfh-parameter-hero">' + heroThumb + '<div class="pfh-parameter-hero-copy"><small>PARAMETER IMAGE</small><h3>' + context.escapeHtml(data.sku) + ' 参数图</h3><p>' + context.escapeHtml([data.brand, data.name].filter(Boolean).join(' ')) + '</p></div></header>' +
        '<div class="pfh-parameter-workspace"><div class="pfh-parameter-controls">' +
          '<button type="button" class="pfh-dropzone pfh-parameter-drop' + (session.busy ? ' is-busy' : '') + '" data-action="parameter-image-pick"' + (session.busy ? ' disabled' : '') + '><strong>' + (session.busy ? '正在分析并生成…' : '点击、拖入或悬浮粘贴透明 PNG') + '</strong><span>一张图可同时包含纸盒与产品</span></button>' +
          (session.fileName ? '<small>已读取：' + context.escapeHtml(session.fileName) + '</small>' : '') +
          '<div class="pfh-parameter-fields">' +
            fieldHtml(session, 'englishName', '英文产品名', true) + fieldHtml(session, 'netContent', '净含量') + fieldHtml(session, 'grossWeight', '毛重') + fieldHtml(session, 'shelfLife', '保质期') + fieldHtml(session, 'features', 'FEATURES', true) +
            fieldHtml(session, 'packageLength', '纸盒正面/长') + fieldHtml(session, 'packageWidth', '纸盒侧面/宽') + fieldHtml(session, 'packageHeight', '纸盒高') + fieldHtml(session, 'productWidth', '产品宽') + fieldHtml(session, 'productHeight', '产品高') +
          '</div>' +
          '<div class="pfh-parameter-options"><label><input type="checkbox" class="pfh-parameter-side"' + (session.showSide ? ' checked' : '') + '>纸盒展示侧面</label><label><input type="radio" name="pfh-parameter-front" value="length"' + (session.frontIsLength ? ' checked' : '') + '>正面为长</label><label><input type="radio" name="pfh-parameter-front" value="width"' + (!session.frontIsLength ? ' checked' : '') + '>正面为宽</label></div>' +
          '<div class="pfh-parameter-actions"><button type="button" data-action="parameter-image-refresh-data">刷新英文名</button><button type="button" data-action="parameter-editor-open"' + (!session.file || session.busy ? ' disabled' : '') + '>手动标注</button><button type="button" data-action="parameter-image-regenerate"' + (!session.file || session.busy ? ' disabled' : '') + '>重新生成</button><button type="button" data-action="parameter-image-save"' + (!session.productResult || session.busy ? ' disabled' : '') + '>另存两张 JPG</button></div>' +
          '<input type="file" class="pfh-parameter-file" accept="image/png,.png" hidden>' + status +
        '</div><div class="pfh-parameter-previews">' + preview('产品尺寸图', session.productResult) + preview('英文参数图', session.englishResult) + '</div></div>' +
        '</section></div>';
      return html;
    }

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('无法读取图片，请重新导出透明 PNG。'));
        image.src = url;
      });
    }

    function loadFileImage(file) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        const release = () => URL.revokeObjectURL(url);
        image.onload = () => { release(); resolve(image); };
        image.onerror = () => { release(); reject(new Error('无法读取标注图片，请重新导入 PNG。')); };
        image.src = url;
      });
    }

    function alphaBoundsRegion(pixels, width, height, x0, x1, y0, y1) {
      let left = x1, top = height, right = -1, bottom = -1;
      for (let y = Math.max(0, y0); y < Math.min(height, y1); y += 1) for (let x = Math.max(0, x0); x < Math.min(width, x1); x += 1) {
        if (pixels[(y * width + x) * 4 + 3] <= 12) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
      return right >= left ? { left, top, right: right + 1, bottom: bottom + 1, width: right - left + 1, height: bottom - top + 1 } : null;
    }

    function alphaBounds(pixels, width, height, x0, x1) {
      return alphaBoundsRegion(pixels, width, height, x0, x1, 0, height);
    }

    function median(values) {
      const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
      return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    }

    function alphaColumnRange(pixels, width, height, centerX, top, bottom, spread) {
      const tops = [], bottoms = [];
      for (let x = Math.max(0, Math.round(centerX) - spread); x <= Math.min(width - 1, Math.round(centerX) + spread); x += 1) {
        let first = -1, last = -1;
        for (let y = Math.max(0, top); y < Math.min(height, bottom); y += 1) {
          if (pixels[(y * width + x) * 4 + 3] <= 12) continue;
          if (first < 0) first = y;
          last = y;
        }
        if (first >= 0) { tops.push(first); bottoms.push(last); }
      }
      return tops.length ? { top: median(tops), bottom: median(bottoms) + 1 } : null;
    }

    function detectPerspectiveGeometry(pixels, width, height, box, frontPhysical, packageHeight) {
      const expectedFront = frontPhysical && packageHeight ? box.height * frontPhysical / packageHeight : box.width * .68;
      const expectedJunction = box.right - expectedFront;
      const searchStart = Math.max(box.left + box.width * .12, expectedJunction - box.width * .15);
      const searchEnd = Math.min(box.left + box.width * .58, expectedJunction + box.width * .15);
      const columns = [];
      for (let x = Math.round(searchStart); x <= Math.round(searchEnd); x += 1) {
        const range = alphaColumnRange(pixels, width, height, x, box.top, box.bottom, 0);
        if (range) columns.push({ x, ...range });
      }
      if (!columns.length) return null;
      const minimumTop = Math.min(...columns.map((column) => column.top));
      const junctionX = median(columns.filter((column) => column.top <= minimumTop + 2).map((column) => column.x));
      const outer = alphaColumnRange(pixels, width, height, box.left + 1, box.top, box.bottom, 2);
      const junction = alphaColumnRange(pixels, width, height, junctionX, box.top, box.bottom, 2);
      const right = alphaColumnRange(pixels, width, height, box.right - 2, box.top, box.bottom, 2);
      if (!outer || !junction || !right) return null;
      return {
        outerTop: { x: box.left, y: outer.top }, outerBottom: { x: box.left, y: outer.bottom },
        junctionTop: { x: junctionX, y: junction.top }, junctionBottom: { x: junctionX, y: junction.bottom },
        rightTop: { x: box.right, y: right.top }, rightBottom: { x: box.right, y: right.bottom },
      };
    }

    function analyzeImage(image, session) {
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, width, height);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      if (session.singleBottle) {
        const upperBody = alphaBoundsRegion(pixels, width, height, 0, width, 0, Math.round(height * .74));
        const bottle = upperBody && alphaBoundsRegion(pixels, width, height, upperBody.left, upperBody.right, 0, height);
        if (!bottle) throw new Error('没有可靠识别出单瓶产品轮廓，请重新导出透明 PNG。');
        const f = 1 / scale;
        const convert = (rect) => ({ left: rect.left * f, top: rect.top * f, right: rect.right * f, bottom: rect.bottom * f, width: rect.width * f, height: rect.height * f });
        return { box: null, product: convert(bottle), splitX: 0, sidePixels: 0, detectedSide: false, perspective: null, sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight };
      }
      const occupancy = [];
      for (let x = 0; x < width; x += 1) {
        let count = 0;
        for (let y = 0; y < height; y += 2) if (pixels[(y * width + x) * 4 + 3] > 12) count += 1;
        occupancy.push(count);
      }
      const start = Math.round(width * .32), end = Math.round(width * .72);
      let split = Math.round(width * .52), best = Infinity;
      for (let x = start; x < end; x += 1) if (occupancy[x] < best) { best = occupancy[x]; split = x; }
      const box = alphaBounds(pixels, width, height, 0, split);
      const product = alphaBounds(pixels, width, height, split, width);
      if (!box || !product) throw new Error('没有可靠识别出纸盒和产品，请使用同时包含两者的透明 PNG。');
      const f = 1 / scale;
      const convert = (rect) => ({ left: rect.left * f, top: rect.top * f, right: rect.right * f, bottom: rect.bottom * f, width: rect.width * f, height: rect.height * f });
      const originalBox = convert(box), originalProduct = convert(product);
      const frontPhysical = session.frontIsLength ? number(session.fields.packageLength) : number(session.fields.packageWidth);
      const packageHeight = number(session.fields.packageHeight);
      const perspectiveScaled = detectPerspectiveGeometry(pixels, width, height, box, frontPhysical, packageHeight);
      const convertPoint = (point) => ({ x: point.x * f, y: point.y * f });
      const perspective = perspectiveScaled ? Object.fromEntries(Object.entries(perspectiveScaled).map(([key, point]) => [key, convertPoint(point)])) : null;
      const expectedFrontPixels = packageHeight && frontPhysical ? originalBox.height * frontPhysical / packageHeight : originalBox.width;
      const sidePixels = Math.max(0, originalBox.width - expectedFrontPixels);
      // Front-only carton renders often include a small shadow/edge. Treat it as a
      // visible side only when the excess is substantial; users can still override.
      const detectedSide = sidePixels > originalBox.width * .18;
      if (session.showSide === null) session.showSide = detectedSide;
      return { box: originalBox, product: originalProduct, splitX: split * f, sidePixels, detectedSide, perspective, sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight };
    }

    function fitSource(image, analysis, area) {
      const scale = Math.min(area.width / analysis.sourceWidth, area.height / analysis.sourceHeight);
      return { scale, x: area.x + (area.width - analysis.sourceWidth * scale) / 2, y: area.y + (area.height - analysis.sourceHeight * scale) / 2 };
    }

    function mapRect(rect, fit) {
      return { left: fit.x + rect.left * fit.scale, top: fit.y + rect.top * fit.scale, right: fit.x + rect.right * fit.scale, bottom: fit.y + rect.bottom * fit.scale, width: rect.width * fit.scale, height: rect.height * fit.scale };
    }

    function mapPoint(point, fit) {
      return { x: fit.x + point.x * fit.scale, y: fit.y + point.y * fit.scale };
    }

    function line(ctx, x1, y1, x2, y2) {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    function dimensionLabel(value) {
      return sizeText(value) + 'cm/' + inchText(value) + 'inch';
    }

    function drawVerticalDimension(ctx, rect, value, side) {
      if (!number(value)) return;
      const x = side === 'left' ? rect.left - 36 : rect.right + 36;
      const label = dimensionLabel(value);
      ctx.save();
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, x, rect.top, x, rect.bottom); line(ctx, x - 16, rect.top, x + 16, rect.top); line(ctx, x - 16, rect.bottom, x + 16, rect.bottom);
      ctx.font = '42px Arial';
      const gap = rect.height > ctx.measureText(label).width + 48 ? 58 : 82;
      ctx.translate(x + (side === 'left' ? -gap : gap), (rect.top + rect.bottom) / 2);
      ctx.rotate(Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0); ctx.restore();
    }

    function drawHorizontalDimension(ctx, rect, value, below) {
      if (!number(value)) return;
      const y = below ? rect.bottom + 36 : rect.top - 36;
      const label = dimensionLabel(value);
      ctx.save();
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, rect.left, y, rect.right, y); line(ctx, rect.left, y - 16, rect.left, y + 16); line(ctx, rect.right, y - 16, rect.right, y + 16);
      ctx.font = '42px Arial'; ctx.textAlign = 'center';
      const gap = rect.width > ctx.measureText(label).width + 48 ? 20 : 38;
      ctx.textBaseline = below ? 'top' : 'bottom';
      ctx.fillText(label, (rect.left + rect.right) / 2, y + (below ? gap : -gap));
      ctx.restore();
    }

    function drawSideDimension(ctx, rect, sidePixels, value) {
      if (!number(value) || sidePixels < 8) return;
      const depth = Math.min(rect.width * .3, Math.max(30, sidePixels));
      const x2 = rect.left + depth, y2 = rect.top - 30, x1 = rect.left - 12, y1 = rect.top + 12;
      ctx.save(); ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, x1, y1, x2, y2); line(ctx, x1 - 9, y1 - 14, x1 + 9, y1 + 14); line(ctx, x2 - 9, y2 - 14, x2 + 9, y2 + 14);
      ctx.translate((x1 + x2) / 2 - 12, (y1 + y2) / 2 - 60); ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
      ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(dimensionLabel(value), 0, 0); ctx.restore();
    }

    function drawAngledDimension(ctx, start, end, value, normalSign) {
      if (!number(value)) return;
      const dx = end.x - start.x, dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (length < 8) return;
      const nx = (-dy / length) * normalSign, ny = (dx / length) * normalSign;
      const label = dimensionLabel(value);
      ctx.save(); ctx.font = '42px Arial';
      const offset = 36, textGap = length > ctx.measureText(label).width + 48 ? 26 : 46, tick = 16;
      const a = { x: start.x + nx * offset, y: start.y + ny * offset };
      const b = { x: end.x + nx * offset, y: end.y + ny * offset };
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, a.x, a.y, b.x, b.y);
      line(ctx, a.x - nx * tick, a.y - ny * tick, a.x + nx * tick, a.y + ny * tick);
      line(ctx, b.x - nx * tick, b.y - ny * tick, b.x + nx * tick, b.y + ny * tick);
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      ctx.translate((a.x + b.x) / 2 + nx * textGap, (a.y + b.y) / 2 + ny * textGap);
      ctx.rotate(angle); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0); ctx.restore();
    }

    function manualPathCenter(points) {
      const total = points.reduce((result, point) => ({ x: result.x + point.x, y: result.y + point.y }), { x: 0, y: 0 });
      return { x: total.x / Math.max(1, points.length), y: total.y / Math.max(1, points.length) };
    }

    function outwardNormalSign(start, end, center) {
      const dx = end.x - start.x, dy = end.y - start.y, length = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / length, ny = dx / length;
      const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      return ((center.x - middle.x) * nx + (center.y - middle.y) * ny) >= 0 ? -1 : 1;
    }

    function drawManualDimensionPath(ctx, sourcePoints, values, fit) {
      const points = sourcePoints.map((point) => mapPoint(point, fit));
      const center = manualPathCenter(points);
      values.forEach((value, index) => {
        const start = points[index], end = points[index + 1];
        if (start && end) drawAngledDimension(ctx, start, end, value, outwardNormalSign(start, end, center));
      });
    }

    function drawProductModule(ctx, image, analysis, session, area) {
      const fit = fitSource(image, analysis, area);
      ctx.save();
      if (number(area.clipLeft)) {
        ctx.beginPath(); ctx.rect(area.clipLeft, 0, 1600 - area.clipLeft, 1600); ctx.clip();
      }
      ctx.drawImage(image, fit.x, fit.y, analysis.sourceWidth * fit.scale, analysis.sourceHeight * fit.scale);
      const box = analysis.box ? mapRect(analysis.box, fit) : null, product = analysis.product ? mapRect(analysis.product, fit) : null;
      const frontValue = session.frontIsLength ? session.fields.packageLength : session.fields.packageWidth;
      const sideValue = session.frontIsLength ? session.fields.packageWidth : session.fields.packageLength;
      const perspective = analysis.perspective && Object.fromEntries(Object.entries(analysis.perspective).map(([key, point]) => [key, mapPoint(point, fit)]));
      const manualBox = completeManualPath(session, 'box') ? session.manualPoints.box.slice(0, requiredManualPoints('box')) : null;
      const manualProduct = completeManualPath(session, 'product') ? session.manualPoints.product.slice(0, requiredManualPoints('product')) : null;
      if (session.singleBottle) {
        if (manualProduct) drawManualDimensionPath(ctx, manualProduct, [session.fields.productWidth, session.fields.productHeight], fit);
        else if (product) {
          drawVerticalDimension(ctx, product, session.fields.productHeight, 'right');
          drawHorizontalDimension(ctx, product, session.fields.productWidth, false);
        }
        ctx.restore();
        return;
      }
      if (manualBox) {
        drawManualDimensionPath(ctx, manualBox, [session.fields.packageLength, session.fields.packageWidth, session.fields.packageHeight], fit);
      } else if (session.showSide && perspective) {
        drawAngledDimension(ctx, perspective.outerTop, perspective.outerBottom, session.fields.packageHeight, 1);
        drawAngledDimension(ctx, perspective.junctionBottom, perspective.rightBottom, frontValue, 1);
        drawAngledDimension(ctx, perspective.outerTop, perspective.junctionTop, sideValue, -1);
      } else if (box) {
        drawVerticalDimension(ctx, box, session.fields.packageHeight, 'left');
        drawHorizontalDimension(ctx, { ...box, left: box.left + (session.showSide ? analysis.sidePixels * fit.scale : 0) }, frontValue, true);
        if (session.showSide) drawSideDimension(ctx, box, analysis.sidePixels * fit.scale, sideValue);
      }
      if (manualProduct) drawManualDimensionPath(ctx, manualProduct, [session.fields.productWidth, session.fields.productHeight], fit);
      else if (product) {
        drawVerticalDimension(ctx, product, session.fields.productHeight, 'right');
        drawHorizontalDimension(ctx, product, session.fields.productWidth, false);
      }
      ctx.restore();
    }

    function baseCanvas() {
      const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1600;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1600, 1600); return { canvas, ctx };
    }

    function generateProductImage(image, analysis, session) {
      const { canvas, ctx } = baseCanvas();
      drawProductModule(ctx, image, analysis, session, { x: 380, y: 230, width: 840, height: 1080 });
      return canvas.toDataURL('image/jpeg', .96);
    }

    function fitText(ctx, text, maxWidth, startSize, minSize, weight) {
      let size = startSize;
      do { ctx.font = (weight || '400') + ' ' + size + 'px Arial'; size -= 1; } while (size >= minSize && ctx.measureText(text).width > maxWidth);
    }

    async function loadBrandLogo(brand) {
      const key = typeof getParameterLogoKey === 'function' ? getParameterLogoKey(brand) : '';
      if (!key) return null;
      if (!logoCache[key]) {
        logoCache[key] = context.cloudRequest('/parameter-logo?brand=' + encodeURIComponent(key), { method: 'GET' })
          .then((response) => response && response.dataUrl ? loadImage(response.dataUrl) : null)
          .catch(() => null);
      }
      return logoCache[key];
    }

    function drawBrandHeader(ctx, logo, brand) {
      const centerX = 443;
      if (logo) {
        const maxWidth = 500, maxHeight = 120;
        const scale = Math.min(maxWidth / logo.naturalWidth, maxHeight / logo.naturalHeight);
        const width = logo.naturalWidth * scale, height = logo.naturalHeight * scale;
        ctx.drawImage(logo, centerX - width / 2, 240 - height / 2, width, height);
        return;
      }
      const normalized = String(brand || '').trim();
      if (!normalized || /^(AMZ|ODM|OEM|DOWMOO)$/i.test(normalized)) return;
      ctx.fillStyle = '#080808'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, normalized, 500, 70, 38, '400'); ctx.fillText(normalized, centerX, 240);
    }

    function generateEnglishImage(image, analysis, session, data, logo) {
      const { canvas, ctx } = baseCanvas();
      drawBrandHeader(ctx, logo, data.brand);
      const title = String(session.fields.englishName || '').toUpperCase();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(75, 393, 736, 144);
      ctx.fillStyle = '#080808'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, title, 680, 52, 26, '400'); ctx.fillText(title, 443, 465);
      const rows = [
        ['NAME', session.fields.englishName || ''], ['NET CONTENT', session.fields.netContent], ['SHELF LIFE', session.fields.shelfLife],
        ['STORE', session.fields.store], ['FEATURES', session.fields.features], ['WEIGHT', session.fields.grossWeight],
      ];
      rows.forEach((row, index) => {
        const y = 709 + index * 123;
        ctx.fillStyle = '#050505'; ctx.fillRect(70, y, 230, 67);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        fitText(ctx, row[0], 205, 32, 20, '400'); ctx.fillText(row[0], 185, y + 34);
        ctx.fillStyle = '#111'; ctx.textAlign = 'left';
        fitText(ctx, String(row[1] || ''), 455, 34, 20, '400'); ctx.fillText(String(row[1] || ''), 326, y + 34);
        ctx.setLineDash([8, 5]); ctx.lineWidth = 2; line(ctx, 303, y + 67, 785, y + 67); ctx.setLineDash([]);
      });
      const rightArea = { x: 960, y: 300, width: 470, height: 1040, clipLeft: 815 };
      drawProductModule(ctx, image, analysis, session, rightArea);
      return canvas.toDataURL('image/jpeg', .96);
    }

    function manualFallbackAnalysis(image, session) {
      if (!completeManualPath(session, 'box') && !completeManualPath(session, 'product')) return null;
      return {
        box: null, product: null, splitX: 0, sidePixels: 0, detectedSide: false, perspective: null,
        sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight,
      };
    }

    async function regenerate(data) {
      const session = ensureSession(data);
      if (!session.file) return;
      const hasManualPath = completeManualPath(session, 'box') || completeManualPath(session, 'product');
      if (hasManualPath) editorLog(session, '开始生成参数图', {
        boxPoints: session.manualPoints.box.length,
        productPoints: session.manualPoints.product.length,
      });
      session.busy = true; session.error = ''; context.render();
      const url = URL.createObjectURL(session.file);
      try {
        const image = await loadImage(url);
        if (hasManualPath) editorLog(session, '生成阶段底图解码成功', { width: image.naturalWidth, height: image.naturalHeight });
        const logo = await loadBrandLogo(data.brand);
        try {
          session.analysis = analyzeImage(image, session);
          if (hasManualPath) editorLog(session, '自动图像分析成功，手动路径将优先覆盖', {
            hasBox: Boolean(session.analysis && session.analysis.box),
            hasProduct: Boolean(session.analysis && session.analysis.product),
          });
        } catch (analysisError) {
          session.analysis = manualFallbackAnalysis(image, session);
          if (session.analysis && hasManualPath) editorLog(session, '自动分析失败，已使用手动路径回退', { message: String(analysisError && analysisError.message || analysisError) }, 'warn');
          if (!session.analysis) throw analysisError;
        }
        session.productResult = generateProductImage(image, session.analysis, session);
        session.englishResult = generateEnglishImage(image, session.analysis, session, data, logo);
        if (hasManualPath) editorLog(session, '两张参数图生成成功', {
          productResultLength: session.productResult.length,
          englishResultLength: session.englishResult.length,
        });
        if (!session.fields.englishName) session.error = '未读取到英文产品名，请手动填写英文产品名后重新生成。';
      } catch (error) {
        session.error = String(error && error.message || error || '生成失败');
        if (hasManualPath) editorLog(session, '参数图生成失败', { message: session.error }, 'error');
      } finally {
        URL.revokeObjectURL(url); session.busy = false; context.render();
      }
    }

    async function processFile(file, data) {
      const session = ensureSession(data);
      if (!file || !/\.png$/i.test(file.name || '')) { session.error = '请选择透明 PNG 图片。'; context.render(); return; }
      session.file = file; session.fileName = file.name; session.showSide = null;
      session.editorImage = null;
      session.editorSourceUrl = '';
      session.editorOpen = false;
      session.editorDragging = null;
      session.editorMountToken += 1;
      session.editorStatus = '';
      session.editorLoadError = '';
      session.editorLogs = [];
      session.editorLastDrawKey = '';
      if (session.editorResizeObserver) {
        try { session.editorResizeObserver.disconnect(); } catch (_) {}
        session.editorResizeObserver = null;
      }
      session.manualPoints = { box: [], product: [] };
      const oldEditor = document.getElementById(editorOverlayId);
      if (oldEditor) {
        oldEditor.remove();
        document.documentElement.style.overflow = editorPreviousRootOverflow;
      }
      document.documentElement.classList.remove('pfh-parameter-editor-open');
      if (!session.fields.englishName) {
        session.busy = true; session.error = ''; context.render();
        try { await applyExtraData(data, session); } catch (_) {}
        finally { session.busy = false; }
      }
      await regenerate(data);
    }

    async function applyExtraData(data, session) {
      const extra = await context.collectExtra(data.sku);
      if (extra && extra.englishName) session.fields.englishName = sanitizeEnglishName(extra.englishName, data && data.brand);
      if (!session.fields.englishName) session.fields.englishName = extractEnglishName(extra && extra.liveData || data);
      if (extra && extra.liveData) {
        const live = extra.liveData;
        if (live.netContent) session.fields.netContent = live.netContent;
        if (live.grossWeight) session.fields.grossWeight = live.grossWeight;
      }
      if (!session.featuresDirty) session.fields.features = matchFeature(data, session.fields.englishName);
    }

    async function refreshData(data) {
      const session = ensureSession(data);
      session.busy = true; session.error = ''; context.render();
      try {
        await applyExtraData(data, session);
        if (session.file) await regenerate(data);
      } catch (error) { session.error = '英文产品名读取失败，请手动填写。'; }
      finally { session.busy = false; context.render(); }
    }

    async function save(data) {
      const session = ensureSession(data);
      const outputs = [
        { name: data.sku + '-产品尺寸图.jpg', url: session.productResult },
        { name: data.sku + '-英文参数图.jpg', url: session.englishResult },
      ].filter((item) => item.url);
      if (!outputs.length) return;
      const picker = context.getSaveFilePicker();
      if (!picker) { context.showToast('当前浏览器不支持另存为，请使用最新版 Chrome。'); return; }
      try {
        for (const output of outputs) {
          const handle = await picker({ suggestedName: output.name, types: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }] });
          const writable = await handle.createWritable();
          await writable.write(await (await fetch(output.url)).blob()); await writable.close();
        }
        context.showToast('已保存两张参数图 JPG');
      } catch (error) { if (!error || error.name !== 'AbortError') context.showToast('保存失败'); }
    }

    function handleEditorAction(action, target, data) {
      const session = ensureSession(data);
      if (action === 'parameter-editor-close') {
        closeManualEditor(session, 'button');
        return true;
      }
      if (action === 'parameter-editor-target') {
        session.manualTarget = target && target.getAttribute('data-target') === 'product' ? 'product' : 'box';
        editorLog(session, '切换标注对象', { target: session.manualTarget });
        renderManualEditor(data);
        return true;
      }
      const current = session.manualTarget === 'product' ? 'product' : 'box';
      if (action === 'parameter-editor-undo') {
        const removed = session.manualPoints[current].pop();
        editorLog(session, '撤销标注点', { target: current, removed: Boolean(removed), remaining: session.manualPoints[current].length });
        renderManualEditor(data);
        return true;
      }
      if (action === 'parameter-editor-reset') {
        const removedCount = session.manualPoints[current].length;
        session.manualPoints[current] = [];
        editorLog(session, '重画当前对象', { target: current, removedCount });
        renderManualEditor(data);
        return true;
      }
      if (action === 'parameter-editor-retry') {
        session.editorImage = null;
        session.editorLastDrawKey = '';
        session.editorLoadError = '';
        session.editorStatus = '正在重新读取底图…';
        editorLog(session, '用户要求重新载入底图');
        renderManualEditor(data);
        return true;
      }
      if (action === 'parameter-editor-apply') {
        const incomplete = ['box', 'product'].find((key) => session.manualPoints[key].length && !completeManualPath(session, key));
        if (incomplete) { context.showToast((incomplete === 'box' ? '纸盒' : '产品') + '路径还没有标完整。'); return true; }
        if (!completeManualPath(session, 'box') && !completeManualPath(session, 'product')) { context.showToast('请先完成纸盒或产品路径。'); return true; }
        editorLog(session, '应用手动路径', { boxPoints: session.manualPoints.box.length, productPoints: session.manualPoints.product.length });
        closeManualEditor(session, 'apply');
        regenerate(data);
        return true;
      }
      return false;
    }

    function handleAction(action, target, data) {
      if (action === 'parameter-image-pick') { const input = document.querySelector('#' + context.panelId + ' .pfh-parameter-file'); if (input) input.click(); return true; }
      if (action === 'parameter-image-regenerate') { regenerate(data); return true; }
      if (action === 'parameter-image-refresh-data') { refreshData(data); return true; }
      if (action === 'parameter-image-save') { save(data); return true; }
      if (action === 'parameter-editor-open') { openManualEditor(data); return true; }
      if (/^parameter-editor-/.test(action)) return handleEditorAction(action, target, data);
      return false;
    }

    function handleInput(event, data) {
      if (!event.target.classList.contains('pfh-parameter-field')) return false;
      const key = event.target.getAttribute('data-field');
      const session = ensureSession(data);
      session.fields[key] = event.target.value;
      if (key === 'features') session.featuresDirty = true;
      return true;
    }

    function handleChange(event, data) {
      const session = ensureSession(data);
      if (event.target.classList.contains('pfh-parameter-file')) { const file = event.target.files && event.target.files[0]; if (file) processFile(file, data); event.target.value = ''; return true; }
      if (event.target.classList.contains('pfh-parameter-side')) { session.showSide = Boolean(event.target.checked); if (session.file) regenerate(data); return true; }
      if (event.target.name === 'pfh-parameter-front') { session.frontIsLength = event.target.value === 'length'; session.showSide = null; if (session.file) regenerate(data); return true; }
      if (event.target.classList.contains('pfh-parameter-field')) { if (session.file) regenerate(data); return true; }
      return false;
    }

    function handleDrop(files, data) {
      const file = Array.from(files || []).find((item) => /\.png$/i.test(item.name || '') || item.type === 'image/png');
      if (file) processFile(file, data);
    }

    return { viewHtml, handleAction, handleInput, handleChange, handleDrop, loadRules };
  }
