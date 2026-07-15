  function createParameterImageFeature(context) {
    const sessions = Object.create(null);
    const logoCache = Object.create(null);
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
    const sanitizeEnglishName = (value) => {
      const text = String(value || '').replace(/^PRODUCT\s*NAME\s*[:：]?\s*/i, '').split(/[\r\n|]/)[0].trim();
      return /[A-Za-z]/.test(text) && !hasCjk(text) ? text : '';
    };

    function collectTextValues(value, output, depth) {
      if (depth > 5 || value == null) return;
      if (typeof value === 'string') { output.push(value); return; }
      if (Array.isArray(value)) { value.forEach((item) => collectTextValues(item, output, depth + 1)); return; }
      if (typeof value === 'object') Object.values(value).forEach((item) => collectTextValues(item, output, depth + 1));
    }

    function extractEnglishName(data) {
      const direct = sanitizeEnglishName(data && (data.englishName || data.productEnglishName || ''));
      if (direct) return direct;
      const values = [];
      collectTextValues(data && (data.copywriting || data), values, 0);
      for (const value of values) {
        const matched = String(value).match(/PRODUCT\s*NAME\s*[:：]\s*([^\r\n|]+)/i);
        const result = sanitizeEnglishName(matched ? matched[1] : '');
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
          sourceDataUrl: '',
          analysis: null,
          productResult: '',
          englishResult: '',
          busy: false,
          error: '',
          showSide: null,
          frontIsLength: true,
          featuresDirty: false,
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
            productWidth: fieldValue(data, 'productWidth', 'productWidth'),
            productHeight: fieldValue(data, 'productHeight', 'productHeight'),
          },
        };
      }
      return sessions[sku];
    }

    function ensureStyles() {
      if (document.getElementById('pfh-parameter-image-styles')) return;
      const style = document.createElement('style');
      style.id = 'pfh-parameter-image-styles';
      style.textContent = `
        #${context.panelId}[data-view="parameterImage"] .pfh-detail{overflow:hidden;container-type:inline-size;background:linear-gradient(145deg,#fbfaff,#f4f9ff)}
        #${context.panelId}[data-view="parameterImage"] .pfh-main{min-width:0}
        #${context.panelId} .pfh-parameter-scroll{height:100%;overflow:auto;padding:14px}
        #${context.panelId} .pfh-parameter-page{display:grid;gap:12px;min-width:0}
        #${context.panelId} .pfh-parameter-hero{display:flex;justify-content:space-between;gap:12px;padding:15px 17px;border:1px solid rgba(124,58,237,.14);border-radius:17px;background:rgba(255,255,255,.8)}
        #${context.panelId} .pfh-parameter-hero small{color:#8b5cf6;font-weight:800}.pfh-parameter-hero h3{margin:4px 0;color:#2f2760;font-size:18px}.pfh-parameter-hero p{margin:0;color:#7b84a1;font-size:12px}
        #${context.panelId} .pfh-parameter-workspace{display:grid;grid-template-columns:minmax(250px,330px) minmax(300px,1fr);gap:12px;min-width:0}
        #${context.panelId} .pfh-parameter-controls,#${context.panelId} .pfh-parameter-preview-card{border:1px solid rgba(124,58,237,.13);border-radius:17px;background:rgba(255,255,255,.82);box-shadow:0 14px 35px rgba(70,55,130,.06)}
        #${context.panelId} .pfh-parameter-controls{display:grid;align-content:start;gap:10px;padding:12px}
        #${context.panelId} .pfh-parameter-drop{min-height:108px;display:grid;place-content:center;gap:6px;text-align:center;border:1px dashed rgba(124,58,237,.45);border-radius:14px;background:#faf8ff;color:#6d35e8;cursor:pointer}.pfh-parameter-drop span{color:#8991ab;font-size:11px}.pfh-parameter-drop.is-busy{cursor:wait;opacity:.72}
        #${context.panelId} .pfh-parameter-fields{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pfh-parameter-fields label{display:grid;gap:3px;min-width:0}.pfh-parameter-fields label.wide{grid-column:1/-1}.pfh-parameter-fields span{color:#777f9a;font-size:10px;font-weight:700}.pfh-parameter-fields input{width:100%;min-width:0;height:32px;padding:5px 8px;border:1px solid #e2dcf7;border-radius:9px;background:#fff;color:#302760;box-sizing:border-box}
        #${context.panelId} .pfh-parameter-options{display:flex;flex-wrap:wrap;gap:10px;padding:8px;border-radius:10px;background:#f8f6ff;font-size:11px}.pfh-parameter-options label{display:inline-flex;align-items:center;gap:5px}.pfh-parameter-options input{accent-color:#7c3aed}
        #${context.panelId} .pfh-parameter-actions{display:grid;grid-template-columns:1fr 1.3fr;gap:8px}.pfh-parameter-actions button{min-height:37px;border:1px solid #dcd4f5;border-radius:10px;background:#fff;color:#6d35e8;font-weight:700}.pfh-parameter-actions button:last-child{border-color:#7c3aed;background:linear-gradient(135deg,#8b5cf6,#6d35e8);color:#fff}.pfh-parameter-actions button:disabled{opacity:.45}
        #${context.panelId} .pfh-parameter-status{padding:8px 10px;border-radius:9px;background:#eefbf6;color:#27735d;font-size:11px}.pfh-parameter-status.is-error{background:#fff0f3;color:#a33a48}
        #${context.panelId} .pfh-parameter-previews{display:grid;grid-template-columns:1fr 1fr;gap:10px;min-width:0}.pfh-parameter-preview-card{position:relative;display:grid;place-items:center;min-height:360px;padding:10px;overflow:hidden}.pfh-parameter-preview-card b{position:absolute;top:8px;left:8px;z-index:1;padding:3px 7px;border-radius:99px;background:rgba(255,255,255,.9);color:#6d35e8;font-size:10px}.pfh-parameter-preview-card img{display:block;max-width:100%;max-height:100%;object-fit:contain}.pfh-parameter-preview-card span{color:#9299b0;font-size:12px}
        @container (max-width:760px){#${context.panelId} .pfh-parameter-workspace{grid-template-columns:minmax(220px,280px) minmax(280px,1fr)}#${context.panelId} .pfh-parameter-previews{grid-template-columns:1fr}.pfh-parameter-preview-card{min-height:300px}}
        @container (max-width:520px){#${context.panelId} .pfh-parameter-scroll{padding:8px}#${context.panelId} .pfh-parameter-workspace{grid-template-columns:1fr}.pfh-parameter-controls{position:static}.pfh-parameter-preview-card{min-height:280px}}
      `;
      document.head.appendChild(style);
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

    function viewHtml(data) {
      ensureStyles();
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
      return '<div class="pfh-parameter-scroll"><section class="pfh-parameter-page">' +
        '<header class="pfh-parameter-hero"><div><small>PARAMETER IMAGE</small><h3>' + context.escapeHtml(data.sku) + ' 参数图</h3><p>' + context.escapeHtml([data.brand, data.name].filter(Boolean).join(' ')) + '</p></div></header>' +
        '<div class="pfh-parameter-workspace"><div class="pfh-parameter-controls">' +
          '<button type="button" class="pfh-parameter-drop' + (session.busy ? ' is-busy' : '') + '" data-action="parameter-image-pick"' + (session.busy ? ' disabled' : '') + '><strong>' + (session.busy ? '正在分析并生成…' : '点击、拖入或悬浮粘贴透明 PNG') + '</strong><span>一张图可同时包含纸盒与产品</span></button>' +
          (session.fileName ? '<small>已读取：' + context.escapeHtml(session.fileName) + '</small>' : '') +
          '<div class="pfh-parameter-fields">' +
            fieldHtml(session, 'englishName', '英文产品名', true) + fieldHtml(session, 'netContent', '净含量') + fieldHtml(session, 'grossWeight', '毛重') + fieldHtml(session, 'shelfLife', '保质期') + fieldHtml(session, 'features', 'FEATURES', true) +
            fieldHtml(session, 'packageLength', '纸盒正面/长') + fieldHtml(session, 'packageWidth', '纸盒侧面/宽') + fieldHtml(session, 'packageHeight', '纸盒高') + fieldHtml(session, 'productWidth', '产品宽') + fieldHtml(session, 'productHeight', '产品高') +
          '</div>' +
          '<div class="pfh-parameter-options"><label><input type="checkbox" class="pfh-parameter-side"' + (session.showSide ? ' checked' : '') + '>纸盒展示侧面</label><label><input type="radio" name="pfh-parameter-front" value="length"' + (session.frontIsLength ? ' checked' : '') + '>正面为长</label><label><input type="radio" name="pfh-parameter-front" value="width"' + (!session.frontIsLength ? ' checked' : '') + '>正面为宽</label></div>' +
          '<div class="pfh-parameter-actions"><button type="button" data-action="parameter-image-refresh-data">刷新英文名</button><button type="button" data-action="parameter-image-regenerate"' + (!session.file || session.busy ? ' disabled' : '') + '>重新生成</button><button type="button" data-action="parameter-image-save"' + (!session.productResult || session.busy ? ' disabled' : '') + '>另存两张 JPG</button></div>' +
          '<input type="file" class="pfh-parameter-file" accept="image/png,.png" hidden>' + status +
        '</div><div class="pfh-parameter-previews">' + preview('产品尺寸图', session.productResult) + preview('英文参数图', session.englishResult) + '</div></div>' +
      '</section></div>';
    }

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('无法读取图片，请重新导出透明 PNG。'));
        image.src = url;
      });
    }

    function alphaBounds(pixels, width, height, x0, x1) {
      let left = x1, top = height, right = -1, bottom = -1;
      for (let y = 0; y < height; y += 1) for (let x = x0; x < x1; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] <= 12) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
      return right >= left ? { left, top, right: right + 1, bottom: bottom + 1, width: right - left + 1, height: bottom - top + 1 } : null;
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
      ctx.save();
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, x, rect.top, x, rect.bottom); line(ctx, x - 16, rect.top, x + 16, rect.top); line(ctx, x - 16, rect.bottom, x + 16, rect.bottom);
      ctx.translate(x + (side === 'left' ? -58 : 58), (rect.top + rect.bottom) / 2);
      ctx.rotate(Math.PI / 2); ctx.font = '42px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(dimensionLabel(value), 0, 0); ctx.restore();
    }

    function drawHorizontalDimension(ctx, rect, value, below) {
      if (!number(value)) return;
      const y = below ? rect.bottom + 36 : rect.top - 36;
      ctx.save();
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, rect.left, y, rect.right, y); line(ctx, rect.left, y - 16, rect.left, y + 16); line(ctx, rect.right, y - 16, rect.right, y + 16);
      ctx.font = '42px Arial'; ctx.textAlign = 'center';
      ctx.textBaseline = below ? 'top' : 'bottom';
      ctx.fillText(dimensionLabel(value), (rect.left + rect.right) / 2, y + (below ? 20 : -20));
      ctx.restore();
    }

    function drawSideDimension(ctx, rect, sidePixels, value) {
      if (!number(value) || sidePixels < 8) return;
      const depth = Math.min(rect.width * .3, Math.max(30, sidePixels));
      const x2 = rect.left + depth, y2 = rect.top - 30, x1 = rect.left - 12, y1 = rect.top + 12;
      ctx.save(); ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, x1, y1, x2, y2); line(ctx, x1 - 9, y1 - 14, x1 + 9, y1 + 14); line(ctx, x2 - 9, y2 - 14, x2 + 9, y2 + 14);
      ctx.translate((x1 + x2) / 2 - 12, (y1 + y2) / 2 - 42); ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
      ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(dimensionLabel(value), 0, 0); ctx.restore();
    }

    function drawAngledDimension(ctx, start, end, value, normalSign) {
      if (!number(value)) return;
      const dx = end.x - start.x, dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (length < 8) return;
      const nx = (-dy / length) * normalSign, ny = (dx / length) * normalSign;
      const offset = 36, textGap = 22, tick = 16;
      const a = { x: start.x + nx * offset, y: start.y + ny * offset };
      const b = { x: end.x + nx * offset, y: end.y + ny * offset };
      ctx.save(); ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, a.x, a.y, b.x, b.y);
      line(ctx, a.x - nx * tick, a.y - ny * tick, a.x + nx * tick, a.y + ny * tick);
      line(ctx, b.x - nx * tick, b.y - ny * tick, b.x + nx * tick, b.y + ny * tick);
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      ctx.translate((a.x + b.x) / 2 + nx * textGap, (a.y + b.y) / 2 + ny * textGap);
      ctx.rotate(angle); ctx.font = '42px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(dimensionLabel(value), 0, 0); ctx.restore();
    }

    function drawProductModule(ctx, image, analysis, session, area) {
      const fit = fitSource(image, analysis, area);
      ctx.save();
      if (number(area.clipLeft)) {
        ctx.beginPath(); ctx.rect(area.clipLeft, 0, 1600 - area.clipLeft, 1600); ctx.clip();
      }
      ctx.drawImage(image, fit.x, fit.y, analysis.sourceWidth * fit.scale, analysis.sourceHeight * fit.scale);
      const box = mapRect(analysis.box, fit), product = mapRect(analysis.product, fit);
      const frontValue = session.frontIsLength ? session.fields.packageLength : session.fields.packageWidth;
      const sideValue = session.frontIsLength ? session.fields.packageWidth : session.fields.packageLength;
      const perspective = analysis.perspective && Object.fromEntries(Object.entries(analysis.perspective).map(([key, point]) => [key, mapPoint(point, fit)]));
      if (session.showSide && perspective) {
        drawAngledDimension(ctx, perspective.outerTop, perspective.outerBottom, session.fields.packageHeight, 1);
        drawAngledDimension(ctx, perspective.junctionBottom, perspective.rightBottom, frontValue, 1);
        drawAngledDimension(ctx, perspective.outerTop, perspective.junctionTop, sideValue, -1);
      } else {
        drawVerticalDimension(ctx, box, session.fields.packageHeight, 'left');
        drawHorizontalDimension(ctx, { ...box, left: box.left + (session.showSide ? analysis.sidePixels * fit.scale : 0) }, frontValue, true);
        if (session.showSide) drawSideDimension(ctx, box, analysis.sidePixels * fit.scale, sideValue);
      }
      drawVerticalDimension(ctx, product, session.fields.productHeight, 'right');
      drawHorizontalDimension(ctx, product, session.fields.productWidth, false);
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
      if (!normalized || /^(AMZ|ODM|OEM)$/i.test(normalized)) return;
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
      const rightArea = session.showSide
        ? { x: 900, y: 280, width: 590, height: 1080, clipLeft: 815 }
        : { x: 890, y: 280, width: 610, height: 1080, clipLeft: 815 };
      drawProductModule(ctx, image, analysis, session, rightArea);
      return canvas.toDataURL('image/jpeg', .96);
    }

    async function regenerate(data) {
      const session = ensureSession(data);
      if (!session.file) return;
      session.busy = true; session.error = ''; context.render();
      const url = URL.createObjectURL(session.file);
      try {
        const image = await loadImage(url);
        const logo = await loadBrandLogo(data.brand);
        session.analysis = analyzeImage(image, session);
        session.productResult = generateProductImage(image, session.analysis, session);
        session.englishResult = generateEnglishImage(image, session.analysis, session, data, logo);
        if (!session.fields.englishName) session.error = '未读取到英文产品名，请手动填写英文产品名后重新生成。';
      } catch (error) {
        session.error = String(error && error.message || error || '生成失败');
      } finally {
        URL.revokeObjectURL(url); session.busy = false; context.render();
      }
    }

    async function processFile(file, data) {
      const session = ensureSession(data);
      if (!file || !/\.png$/i.test(file.name || '')) { session.error = '请选择透明 PNG 图片。'; context.render(); return; }
      session.file = file; session.fileName = file.name; session.showSide = null;
      if (!session.fields.englishName) {
        session.busy = true; session.error = ''; context.render();
        try { await applyExtraData(data, session); } catch (_) {}
        finally { session.busy = false; }
      }
      await regenerate(data);
    }

    async function applyExtraData(data, session) {
      const extra = await context.collectExtra(data.sku);
      if (extra && extra.englishName) session.fields.englishName = sanitizeEnglishName(extra.englishName);
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

    function handleAction(action, target, data) {
      if (action === 'parameter-image-pick') { const input = document.querySelector('#' + context.panelId + ' .pfh-parameter-file'); if (input) input.click(); return true; }
      if (action === 'parameter-image-regenerate') { regenerate(data); return true; }
      if (action === 'parameter-image-refresh-data') { refreshData(data); return true; }
      if (action === 'parameter-image-save') { save(data); return true; }
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
