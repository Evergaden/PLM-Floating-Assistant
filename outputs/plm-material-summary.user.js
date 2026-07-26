// ==UserScript==
// @name         PLM悬浮助手
// @namespace    https://plm.westmonth.com/
// @version      2.5.166
// @description  Store PLM project packaging specs locally and show them in a floating helper.
// @author       Violet
// @match        https://plm.westmonth.com/*
// @match        https://auth.westmonth.com/*
// @require      https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @require      https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
// @require      https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @connect      oss-pro.plm.westmonth.cn
// @connect      ai-obj.westmonth.com
// @connect      plm.westmonth.com
// @connect      velvet.qzz.io
// @connect      plm-cloud-backup.wt196731.workers.dev
// @connect      127.0.0.1
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const PANEL_ID = 'plm-floating-helper';
  const LAUNCHER_ID = 'plm-floating-helper-launcher';
  const SCRIPT_VERSION = '2.5.166';
  // Bump with the versioned cloud stylesheet so incompatible cached UI is never rendered.
  const UI_ASSET_VERSION = '2.5.136';
  const INGREDIENT_NORMALIZER_VERSION = '3';
  const COPYWRITING_PARSER_VERSION = '8';
  const SKU_LIST_PREFERENCE_VERSION = 1;
  const MODELSCOPE_INSIGHT_MODEL = 'Qwen/Qwen3.5-397B-A17B';
  // <parameter-logo-assets-module>
  const PARAMETER_LOGO_ALIASES = Object.freeze({
    'eastmoon': 'eastmoon', 'east moon': 'eastmoon', 'southmoon': 'southmoon', 'south moon': 'southmoon',
    'westmonth': 'westmonth', 'west month': 'westmonth', '한초빛': 'hanchobit', 'hanchobit': 'hanchobit'
  });

  function normalizeParameterBrandName(value) {
    return String(value || '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
  }

  function getParameterLogoKey(brand) {
    const normalized = normalizeParameterBrandName(brand);
    if (!normalized || /^(amz|odm|oem|dowmoo)$/.test(normalized)) return '';
    const compact = normalized.replace(/[^a-z0-9\u3400-\u9fff\uac00-\ud7af]+/g, '');
    return PARAMETER_LOGO_ALIASES[normalized] || PARAMETER_LOGO_ALIASES[compact] || compact;
  }
  // </parameter-logo-assets-module>
  // <parameter-image-module>
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

    function isFoodParameterProduct(data) {
      const resolvedType = String(context.productType(data) || '').trim();
      if (/面霜|精华|眼霜|防晒|身体护理|洗护|护肤|化妆|cream|serum|skincare|cosmetic/i.test(resolvedType)) return false;
      const text = [
        resolvedType,
        data && data.aiProductType,
        data && data.aiCategory,
        data && data.productType,
        data && data.category,
        data && data.departmentName,
        data && data.name,
        data && data.englishName,
      ].filter(Boolean).join(' ');
      if (/面霜|精华液?|眼霜|防晒|洗发|护发|身体乳|face\s*cream|serum|shampoo|conditioner|sunscreen|body\s*lotion/i.test(text)) return false;
      return /食品|保健品?|保健食品|营养补充|营养品|膳食补充|胶囊|软糖|片剂|咀嚼片|口服液|饮品|固体饮料|维生素|益生菌|鱼油|钙片|蛋白粉|supplement|capsule|gumm(?:y|ies)?|vitamin|mineral|probiotic|fish\s*oil|protein\s*powder/i.test(text);
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
          productHeightSide: isFoodParameterProduct(data) ? 'left' : 'right',
          showSide: null,
          frontIsLength: true,
          featuresDirty: false,
          editorOpen: false,
          manualTarget: Boolean(data && data.singleBottle) ? 'product' : 'box',
          manualPoints: { box: [], product: [] },
          manualLineTypes: { box: [], product: [] },
          manualPointHistory: [],
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
            productLength: data && data.omitEstimatedProductSize
              ? 0
              : (data && data.isTubePrint
                ? (fieldValue(data, 'tailSealLengthValue', 'tailSealLength') || fieldValue(data, 'tubeTailSealLengthValue', 'tubeTailSealLength') || fieldValue(data, 'productLength', 'productLength'))
                : fieldValue(data, 'productLength', 'productLength')),
            productHeight: data && data.omitEstimatedProductSize ? 0 : fieldValue(data, 'productHeight', 'productHeight'),
          },
        };
      }
      const session = sessions[sku];
      if (!session.manualPoints) session.manualPoints = { box: [], product: [] };
      if (!session.manualLineTypes) session.manualLineTypes = { box: [], product: [] };
      if (!Array.isArray(session.manualLineTypes.box)) session.manualLineTypes.box = [];
      if (!Array.isArray(session.manualLineTypes.product)) session.manualLineTypes.product = [];
      if (!Array.isArray(session.manualPointHistory)) session.manualPointHistory = [];
      session.productHeightSide = isFoodParameterProduct(data) ? 'left' : 'right';
      return session;
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

    function manualDimensionTypes(target) {
      return ['length', 'height'];
    }

    function manualDimensionLabel(type) {
      return ({ length: '长', width: '宽', height: '高' })[type] || '未识别';
    }

    function requiredManualPoints(target) {
      return manualDimensionTypes(target).length * 2;
    }

    function completedManualLines(session, target) {
      const points = session.manualPoints && session.manualPoints[target] || [];
      return Math.min(manualDimensionTypes(target).length, Math.floor(points.length / 2));
    }

    function completeManualPath(session, target) {
      const points = session.manualPoints && session.manualPoints[target];
      return Array.isArray(points) && points.length >= requiredManualPoints(target);
    }

    function manualDimensionValue(session, target, type) {
      if (target === 'product') return type === 'height' ? session.fields.productHeight : session.fields.productLength;
      if (type === 'length') return session.fields.packageLength;
      if (type === 'height') return session.fields.packageHeight;
      return session.fields.packageWidth;
    }

    function manualLineGeometry(session, target, index) {
      const points = session.manualPoints && session.manualPoints[target] || [];
      const start = points[index * 2], end = points[index * 2 + 1];
      if (!start || !end) return null;
      const dx = Math.abs(end.x - start.x), dy = Math.abs(end.y - start.y);
      const length = Math.max(1, Math.hypot(dx, dy));
      return { start, end, length, horizontal: dx / length, vertical: dy / length };
    }

    function manualTypeOrientationScore(session, target, type, geometry) {
      if (type === 'height') return geometry.vertical * 4;
      if (type === 'length') return geometry.horizontal * 4;
      const diagonal = 1 - Math.abs(geometry.horizontal - geometry.vertical);
      return diagonal * 2 + geometry.horizontal * .35;
    }

    function autoAssignedManualTypes(session, target) {
      const lineCount = completedManualLines(session, target);
      const allowed = manualDimensionTypes(target);
      const overrides = session.manualLineTypes && session.manualLineTypes[target] || [];
      const base = new Array(lineCount).fill('');
      const used = new Set();
      for (let index = 0; index < lineCount; index += 1) {
        const type = overrides[index];
        if (allowed.includes(type) && !used.has(type)) { base[index] = type; used.add(type); }
      }
      const freeLines = base.map((type, index) => type ? -1 : index).filter((index) => index >= 0);
      const freeTypes = allowed.filter((type) => !used.has(type));
      let best = base.slice(), bestScore = -Infinity;
      const scoreAssignment = (assignment) => {
        let score = 0;
        const measurements = [];
        for (let index = 0; index < lineCount; index += 1) {
          const geometry = manualLineGeometry(session, target, index);
          if (!geometry || !assignment[index]) continue;
          score += manualTypeOrientationScore(session, target, assignment[index], geometry);
          const value = number(manualDimensionValue(session, target, assignment[index]));
          if (value > 0) measurements.push({ pixels: geometry.length, value });
        }
        if (measurements.length > 1) {
          const scale = measurements.reduce((sum, item) => sum + item.pixels * item.value, 0) /
            Math.max(1, measurements.reduce((sum, item) => sum + item.value * item.value, 0));
          const residual = measurements.reduce((sum, item) => sum + Math.abs(item.pixels - scale * item.value) / Math.max(item.pixels, scale * item.value, 1), 0) / measurements.length;
          score -= residual * 2;
        }
        return score;
      };
      const assign = (depth, candidate, remaining) => {
        if (depth >= freeLines.length) {
          const score = scoreAssignment(candidate);
          if (score > bestScore) { bestScore = score; best = candidate.slice(); }
          return;
        }
        remaining.forEach((type, typeIndex) => {
          candidate[freeLines[depth]] = type;
          assign(depth + 1, candidate, remaining.filter((_, index) => index !== typeIndex));
        });
      };
      assign(0, base.slice(), freeTypes);
      return best;
    }

    function manualOverallProgressText(session) {
      const box = completedManualLines(session, 'box');
      const product = completedManualLines(session, 'product');
      const pending = ['box', 'product'].find((target) => (session.manualPoints[target] || []).length % 2 === 1);
      return '纸盒 ' + box + '/2 · 产品 ' + product + '/2' + (pending ? ' · 正在画' + (pending === 'box' ? '纸盒' : '产品') + '终点' : '');
    }

    function manualCalibrationHtml(session, target) {
      const lineCount = completedManualLines(session, target);
      const effective = autoAssignedManualTypes(session, target);
      const overrides = session.manualLineTypes[target] || [];
      if (!lineCount) return '<span style="color:#7b84a1;font-size:12px">每条尺寸边分别点击起点和终点，画完后可在这里校准长/高。</span>';
      return Array.from({ length: lineCount }, (_, index) => {
        const override = overrides[index] || '';
        const buttons = ['auto'].concat(manualDimensionTypes(target)).map((type) => {
          const label = type === 'auto' ? '自动' : manualDimensionLabel(type);
          const active = (type === 'auto' ? !override : override === type) ? ' is-active' : '';
          return '<button type="button" class="' + active + '" data-action="parameter-editor-line-type" data-object="' + target + '" data-line-index="' + index + '" data-dimension="' + type + '">' + label + '</button>';
        }).join('');
        return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 6px;border:1px solid #e4def4;border-radius:10px;background:#f8f6ff"><b style="color:#4d3a8b;font-size:12px">第' + (index + 1) + '条：' + (override ? '已校准 ' : '智能识别 ') + manualDimensionLabel(effective[index]) + '</b>' + buttons + '</span>';
      }).join('');
    }

    function manualAllCalibrationHtml(session) {
      const sections = ['box', 'product'].filter((target) => completedManualLines(session, target)).map((target) =>
        '<span style="display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap"><strong style="color:' + (target === 'box' ? '#7c3aed' : '#0891b2') + ';font-size:12px">' + (target === 'box' ? '纸盒' : '产品') + '</strong>' + manualCalibrationHtml(session, target) + '</span>'
      );
      return sections.join('') || '<span style="color:#7b84a1;font-size:12px">直接在图片上画线：纸盒与产品都只需标注长和高。</span>';
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
      const boxCount = completedManualLines(session, 'box');
      const productCount = completedManualLines(session, 'product');
      const statusClass = session.editorLoadError ? ' is-error' : '';
      return '<section class="pfh-parameter-editor">' +
        '<header class="pfh-parameter-editor-head"><h3>手动标注独立尺寸边</h3><span>直接画线，自动判断纸盒/产品 · Ctrl+Z 撤回端点 · Ctrl 吸附横/竖线</span><button type="button" data-action="parameter-editor-close">关闭</button></header>' +
        '<div class="pfh-parameter-editor-tools">' +
          '<span class="pfh-parameter-editor-box-progress" style="padding:7px 10px;border-radius:9px;background:#f1edff;color:#6541ce;font-size:12px;font-weight:800">纸盒 ' + boxCount + '/2 边</span>' +
          '<span class="pfh-parameter-editor-product-progress" style="padding:7px 10px;border-radius:9px;background:#e8f7fa;color:#087f95;font-size:12px;font-weight:800">产品 ' + productCount + '/2 边</span>' +
          '<button type="button" data-action="parameter-editor-undo">撤销一点（Ctrl+Z）</button><button type="button" data-action="parameter-editor-reset">全部重画</button>' +
          '<button type="button" data-action="parameter-editor-retry">重新载入底图</button>' +
          '<button type="button" class="pfh-parameter-editor-apply" data-action="parameter-editor-apply">应用并生成</button>' +
          '<div class="pfh-parameter-editor-calibration" style="display:flex;flex:1 0 100%;align-items:center;gap:12px;flex-wrap:wrap">' + manualAllCalibrationHtml(session) + '</div>' +
        '</div>' +
        '<div class="pfh-parameter-editor-stage' + (!session.editorImage && !session.editorLoadError ? ' is-loading' : '') + '"><canvas class="pfh-parameter-editor-canvas"></canvas></div>' +
        '<footer class="pfh-parameter-editor-foot"><span>无需选择对象，每条尺寸边点击“起点 → 终点”</span><span class="pfh-parameter-editor-status' + statusClass + '">' + context.escapeHtml(session.editorStatus || '等待载入底图') + '</span><span class="pfh-parameter-editor-progress">' + manualOverallProgressText(session) + '</span></footer>' +
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

    function drawEditorLines(ctx, session, target, color, active, scale, offsetX, offsetY) {
      const points = session.manualPoints[target] || [];
      if (!points.length) return;
      const displayPoints = points.map((point) => ({ x: point.x + (offsetX || 0), y: point.y + (offsetY || 0) }));
      const effective = autoAssignedManualTypes(session, target);
      const overrides = session.manualLineTypes[target] || [];
      ctx.save();
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = (active ? 5 : 3) * scale;
      ctx.setLineDash(active ? [] : [10 * scale, 7 * scale]);
      for (let index = 0; index < displayPoints.length; index += 2) {
        const start = displayPoints[index], end = displayPoints[index + 1];
        if (!start || !end) continue;
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
        const middleX = (start.x + end.x) / 2, middleY = (start.y + end.y) / 2;
        ctx.fillStyle = color; ctx.font = '700 ' + Math.round(18 * scale) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('第' + (index / 2 + 1) + '条 · ' + manualDimensionLabel(effective[index / 2]) + (overrides[index / 2] ? '（已校准）' : '（智能）'), middleX, middleY - 15 * scale);
      }
      ctx.setLineDash([]);
      displayPoints.forEach((point, index) => {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(point.x, point.y, 12 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(10 * scale) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(index % 2 ? '终' : '起', point.x, point.y);
        if (index === displayPoints.length - 1 && displayPoints.length % 2 === 1) {
          ctx.fillStyle = color; ctx.font = '700 ' + Math.round(18 * scale) + 'px Arial'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('第' + (Math.floor(index / 2) + 1) + '条起点', point.x + 16 * scale, point.y - 10 * scale);
        }
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
      drawEditorLines(ctx, session, 'box', '#7c3aed', true, scale, padding, padding);
      drawEditorLines(ctx, session, 'product', '#0891b2', true, scale, padding, padding);
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

    function manualPointRectScore(point, rect) {
      if (!rect) return Infinity;
      const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
      const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
      const diagonal = Math.max(1, Math.hypot(rect.width, rect.height));
      const centerDistance = Math.hypot(point.x - (rect.left + rect.right) / 2, point.y - (rect.top + rect.bottom) / 2);
      return Math.hypot(dx, dy) / diagonal + centerDistance / diagonal * .04;
    }

    function autoManualTarget(session, point) {
      const pending = ['box', 'product'].find((target) => (session.manualPoints[target] || []).length % 2 === 1);
      if (pending) return pending;
      if (session.singleBottle) return 'product';
      const available = ['box', 'product'].filter((target) => (session.manualPoints[target] || []).length < requiredManualPoints(target));
      if (available.length === 1) return available[0];
      if (!available.length) return '';
      const analysis = session.analysis || {};
      const boxScore = manualPointRectScore(point, analysis.box);
      const productScore = manualPointRectScore(point, analysis.product);
      if (Number.isFinite(boxScore) || Number.isFinite(productScore)) return boxScore <= productScore ? 'box' : 'product';
      if (number(analysis.splitX)) return point.x < analysis.splitX ? 'box' : 'product';
      const imageWidth = Number(session.editorImage && (session.editorImage.naturalWidth || session.editorImage.width) || 0);
      return !imageWidth || point.x < imageWidth / 2 ? 'box' : 'product';
    }

    function findManualPointHit(session, point, radius) {
      let best = null;
      ['box', 'product'].forEach((target) => {
        (session.manualPoints[target] || []).forEach((existing, index) => {
          const distance = Math.hypot(existing.x - point.x, existing.y - point.y);
          if (distance <= radius && (!best || distance < best.distance)) best = { target, index, distance };
        });
      });
      return best;
    }

    function undoLastManualPoint(session) {
      let target = session.manualPointHistory.pop();
      if (!target || !session.manualPoints[target] || !session.manualPoints[target].length) {
        const pending = ['box', 'product'].find((key) => (session.manualPoints[key] || []).length % 2 === 1);
        target = pending || (session.manualPoints[session.manualTarget] || []).length && session.manualTarget ||
          ['product', 'box'].find((key) => (session.manualPoints[key] || []).length);
      }
      if (!target || !session.manualPoints[target] || !session.manualPoints[target].length) return { target: '', removed: null };
      const removed = session.manualPoints[target].pop();
      session.manualLineTypes[target] = session.manualLineTypes[target].slice(0, Math.ceil(session.manualPoints[target].length / 2));
      session.manualTarget = target;
      session.editorStatus = '已撤回最近的' + (target === 'box' ? '纸盒' : '产品') + '端点';
      return { target, removed };
    }

    function constrainEditorPoint(point, points, index, enabled) {
      if (!enabled || !Array.isArray(points) || !points.length) return { point, axis: '' };
      const anchorIndex = index % 2 === 0 ? index + 1 : index - 1;
      const anchor = points[anchorIndex];
      if (!anchor) return { point, axis: '' };
      const dx = point.x - anchor.x;
      const dy = point.y - anchor.y;
      if (Math.abs(dx) >= Math.abs(dy)) return { point: { x: point.x, y: anchor.y }, axis: 'horizontal' };
      return { point: { x: anchor.x, y: point.y }, axis: 'vertical' };
    }

    function refreshEditorProgress(session) {
      const root = document.getElementById(editorOverlayId);
      const progress = root && root.querySelector('.pfh-parameter-editor-progress');
      const calibration = root && root.querySelector('.pfh-parameter-editor-calibration');
      const boxProgress = root && root.querySelector('.pfh-parameter-editor-box-progress');
      const productProgress = root && root.querySelector('.pfh-parameter-editor-product-progress');
      if (progress) progress.textContent = manualOverallProgressText(session);
      if (calibration) calibration.innerHTML = manualAllCalibrationHtml(session);
      if (boxProgress) boxProgress.textContent = '纸盒 ' + completedManualLines(session, 'box') + '/2 边';
      if (productProgress) productProgress.textContent = '产品 ' + completedManualLines(session, 'product') + '/2 边';
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
        let point = canvasPoint(event, canvas, session.editorImage);
        const radius = 28 * editorScale(session.editorImage);
        const hit = findManualPointHit(session, point, radius);
        const target = hit ? hit.target : autoManualTarget(session, point);
        if (!target) {
          session.editorStatus = '纸盒和产品尺寸边都已画完，可校准后应用生成';
          refreshEditorDiagnostics(session);
          return;
        }
        session.manualTarget = target;
        const points = session.manualPoints[target];
        let index = hit ? hit.index : -1;
        let snapAxis = '';
        if (index < 0 && points.length < requiredManualPoints(target)) {
          const constrained = constrainEditorPoint(point, points, points.length, event.ctrlKey);
          point = constrained.point;
          snapAxis = constrained.axis;
          points.push(point); index = points.length - 1;
          session.manualPointHistory.push(target);
          editorLog(session, '新增标注点', { target, index: index + 1, x: Math.round(point.x), y: Math.round(point.y), ctrlSnap: snapAxis || 'none' });
          if (points.length % 2 === 0) {
            const lineIndex = points.length / 2 - 1;
            const assigned = autoAssignedManualTypes(session, target);
            session.editorStatus = (target === 'box' ? '纸盒' : '产品') + '第' + (lineIndex + 1) + '条边智能识别为“' + manualDimensionLabel(assigned[lineIndex]) + '”，可在上方校准';
            editorLog(session, '智能识别尺寸边', { target, line: lineIndex + 1, dimension: assigned[lineIndex] || '' });
          } else session.editorStatus = '已自动判断为“' + (target === 'box' ? '纸盒' : '产品') + '”，请点击这条边的终点';
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
          else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && String(event.key).toLowerCase() === 'z') {
            event.preventDefault();
            handleEditorAction('parameter-editor-undo', null, data);
          }
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
          '<button type="button" class="pfh-parameter-drop' + (session.busy ? ' is-busy' : '') + '" data-action="parameter-image-pick"' + (session.busy ? ' disabled' : '') + '><strong>' + (session.busy ? '正在分析并生成…' : '点击、拖入或悬浮粘贴透明 PNG') + '</strong><span>一张图可同时包含纸盒与产品</span></button>' +
          (session.fileName ? '<small>已读取：' + context.escapeHtml(session.fileName) + '</small>' : '') +
          '<div class="pfh-parameter-fields">' +
            fieldHtml(session, 'englishName', '英文产品名', true) + fieldHtml(session, 'netContent', '净含量') + fieldHtml(session, 'grossWeight', '毛重') + fieldHtml(session, 'shelfLife', '保质期') + fieldHtml(session, 'features', 'FEATURES', true) +
            fieldHtml(session, 'packageLength', '纸盒正面/长') + fieldHtml(session, 'packageWidth', '纸盒侧面/宽') + fieldHtml(session, 'packageHeight', '纸盒高') + fieldHtml(session, 'productLength', '产品长') + fieldHtml(session, 'productHeight', '产品高') +
          '</div>' +
          '<div class="pfh-parameter-options"><label><input type="checkbox" class="pfh-parameter-side"' + (session.showSide ? ' checked' : '') + '>纸盒展示侧面</label><label><input type="radio" name="pfh-parameter-front" value="length"' + (session.frontIsLength ? ' checked' : '') + '>正面为长</label><label><input type="radio" name="pfh-parameter-front" value="width"' + (!session.frontIsLength ? ' checked' : '') + '>正面为宽</label></div>' +
          '<div class="pfh-parameter-actions" style="grid-template-columns:repeat(3,minmax(0,1fr))"><button type="button" data-action="parameter-editor-open"' + (!session.file || session.busy ? ' disabled' : '') + '>手动修改</button><button type="button" data-action="parameter-image-regenerate"' + (!session.file || session.busy ? ' disabled' : '') + '>重新生成</button><button type="button" data-action="parameter-image-save"' + (!session.productResult || session.busy ? ' disabled' : '') + '>保存图片</button></div>' +
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

    function drawManualDimensionPath(ctx, sourcePoints, session, target, fit) {
      const points = sourcePoints.map((point) => mapPoint(point, fit));
      const center = manualPathCenter(points);
      const types = autoAssignedManualTypes(session, target);
      types.forEach((type, index) => {
        const start = points[index * 2], end = points[index * 2 + 1];
        const value = manualDimensionValue(session, target, type);
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
        if (manualProduct) drawManualDimensionPath(ctx, manualProduct, session, 'product', fit);
        else if (product) {
          drawVerticalDimension(ctx, product, session.fields.productHeight, session.productHeightSide || 'right');
          drawHorizontalDimension(ctx, product, session.fields.productLength, false);
        }
        ctx.restore();
        return;
      }
      if (manualBox) {
        drawManualDimensionPath(ctx, manualBox, session, 'box', fit);
      } else if (session.showSide && perspective) {
        drawAngledDimension(ctx, perspective.outerTop, perspective.outerBottom, session.fields.packageHeight, 1);
        drawAngledDimension(ctx, perspective.junctionBottom, perspective.rightBottom, frontValue, 1);
        drawAngledDimension(ctx, perspective.outerTop, perspective.junctionTop, sideValue, -1);
      } else if (box) {
        drawVerticalDimension(ctx, box, session.fields.packageHeight, 'left');
        drawHorizontalDimension(ctx, { ...box, left: box.left + (session.showSide ? analysis.sidePixels * fit.scale : 0) }, frontValue, true);
        if (session.showSide) drawSideDimension(ctx, box, analysis.sidePixels * fit.scale, sideValue);
      }
      if (manualProduct) drawManualDimensionPath(ctx, manualProduct, session, 'product', fit);
      else if (product) {
        drawVerticalDimension(ctx, product, session.fields.productHeight, session.productHeightSide || 'right');
        drawHorizontalDimension(ctx, product, session.fields.productLength, false);
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
      session.manualLineTypes = { box: [], product: [] };
      session.manualPointHistory = [];
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
        { name: '尺寸.jpg', url: session.productResult },
        { name: '英文参数图.jpg', url: session.englishResult },
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
      if (action === 'parameter-editor-line-type') {
        const current = target && target.getAttribute('data-object') === 'product' ? 'product' : 'box';
        const lineIndex = Number(target && target.getAttribute('data-line-index'));
        const requested = String(target && target.getAttribute('data-dimension') || 'auto');
        const allowed = manualDimensionTypes(current);
        if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= completedManualLines(session, current)) return true;
        if (requested === 'auto') session.manualLineTypes[current][lineIndex] = '';
        else if (allowed.includes(requested)) {
          session.manualLineTypes[current] = Array.from({ length: allowed.length }, (_, index) => {
            const type = session.manualLineTypes[current][index] || '';
            return index !== lineIndex && type === requested ? '' : type;
          });
          session.manualLineTypes[current][lineIndex] = requested;
        }
        const effective = autoAssignedManualTypes(session, current);
        session.editorStatus = '第' + (lineIndex + 1) + '条边已' + (requested === 'auto' ? '恢复智能识别：' : '校准为：') + manualDimensionLabel(effective[lineIndex]);
        editorLog(session, '校准尺寸边', { target: current, line: lineIndex + 1, dimension: requested });
        renderManualEditor(data);
        return true;
      }
      if (action === 'parameter-editor-undo') {
        const result = undoLastManualPoint(session);
        editorLog(session, '撤销最近标注点', { target: result.target, removed: Boolean(result.removed), remaining: result.target ? session.manualPoints[result.target].length : 0 });
        renderManualEditor(data);
        return true;
      }
      if (action === 'parameter-editor-reset') {
        const removedCount = session.manualPoints.box.length + session.manualPoints.product.length;
        session.manualPoints = { box: [], product: [] };
        session.manualLineTypes = { box: [], product: [] };
        session.manualPointHistory = [];
        session.editorStatus = '标注已全部清空，可重新直接画线';
        editorLog(session, '全部重画', { removedCount });
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
        if (incomplete) { context.showToast((incomplete === 'box' ? '纸盒' : '产品') + '尺寸边还没有标完整。'); return true; }
        if (!completeManualPath(session, 'box') && !completeManualPath(session, 'product')) { context.showToast('请先完成纸盒或产品的独立尺寸边。'); return true; }
        editorLog(session, '应用手动尺寸边', {
          boxPoints: session.manualPoints.box.length,
          productPoints: session.manualPoints.product.length,
          boxTypes: autoAssignedManualTypes(session, 'box'),
          productTypes: autoAssignedManualTypes(session, 'product'),
        });
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

    async function generateBridgeAssets(data, imageDataUrl) {
      const sku = String(data && data.sku || '');
      if (!sku) throw new Error('参数图任务缺少 SKU');
      if (!/^data:image\/png;base64,/i.test(String(imageDataUrl || ''))) throw new Error('本地透明.png 数据无效');
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      if (!blob.size) throw new Error('本地透明.png 为空');
      delete sessions[sku];
      const file = new File([blob], '透明.png', { type: 'image/png' });
      await processFile(file, data);
      const session = ensureSession(data);
      if (session.error && (!session.productResult || !session.englishResult)) throw new Error(session.error);
      if (!session.productResult || !session.englishResult) throw new Error('悬浮助手参数图生成失败');
      return {
        englishDataUrl: session.englishResult,
        sizeDataUrl: session.productResult,
      };
    }

    return { viewHtml, handleAction, handleInput, handleChange, handleDrop, loadRules, generateBridgeAssets };
  }
  // </parameter-image-module>
  const STORAGE_PREFIX = 'plm-floating-helper:data:';
  const STORAGE_INDEX_KEY = 'plm-floating-helper:index';
  const POSITION_KEY = 'plm-floating-helper:position';
  const LAUNCHER_POSITION_KEY = 'plm-floating-helper:launcher-position';
  const SPLIT_KEY = 'plm-floating-helper:split-width';
  const SIZE_KEY = 'plm-floating-helper:size';
  const INITIAL_LAYOUT = Object.freeze({
    panelLeftRatio: 67 / 1920,
    panelTopRatio: 129 / 1080,
    launcherLeftRatio: 674 / 1920,
    launcherTopRatio: 940 / 1080,
    splitWidth: 237,
  });
  const SETTINGS_KEY = 'plm-floating-helper:settings';
  const TUTORIAL_SEEN_KEY = 'plm-floating-helper:tutorial-seen';
  const UPLOAD_QUEUE_KEY = 'plm-floating-helper:upload-queue';
  const UPLOAD_HISTORY_KEY = 'plm-floating-helper:upload-history';
  const UPLOAD_WORKER_KEY = 'plm-floating-helper:upload-worker-running';
  const TOY_LABEL_EXPORT_MANIFEST_KEY = 'plm-floating-helper:toy-label-export-manifest';
  const LOG_KEY = 'plm-floating-helper:logs';
  const INSIGHTS_KEY = 'plm-floating-helper:insights';
  const USER_INSTANCE_KEY = 'plm-floating-helper:user-instance';
  const DAILY_LEDGER_KEY = 'plm-floating-helper:daily-ledger';
  const DAILY_LEDGER_TRASH_KEY = 'plm-floating-helper:daily-ledger-trash';
  const UPLOAD_DB_NAME = 'plm-floating-helper-files';
  const UPLOAD_DB_STORE = 'files';
  const UPLOAD_MAX_ZIP_BYTES = 100 * 1024 * 1024;
  const CLOUD_BACKUP_API_BASE = 'https://velvet.qzz.io';
  const CLOUD_BACKUP_API_KEY = '53xFiTF3SY4hAcuJZyIz/JR3C2fTQrZrnS96ruV2jXA=';
  const CLOUD_BACKUP_DEBOUNCE_MS = 8000;
  const PRODUCT_REPLACE_UPLOAD_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe', '\u89c6\u9891', '\u52a8\u56fe', '\u63a8\u54c1\u8d44\u6599', '\u56fe\u5305\u7d20\u6750'];
  const PRODUCT_BATCH_IMAGE_LABELS = ['\u4e3b\u56fe', '\u82f1\u6587\u53c2\u6570\u56fe', '\u8be6\u60c5\u56fe', 'SKU\u56fe'];
  // <cloud-assets-module>
  const CLOUD_ASSET_CACHE_KEY = 'plm-floating-helper:cloud-assets:v1';
  const CLOUD_ASSET_CACHE_SCHEMA = 1;
  const CLOUD_ASSET_REFRESH_MS = 24 * 60 * 60 * 1000;
  const FALLBACK_TUBE_SIZE_RULES = [
    { diameter: 19, bodies: [59, 64, 65, 75, 82, 85, 86, 88, 95, 98, 100, 104, 110, 112, 120], widths: [0.8, 1.5, 1.5, 1.5, 1.2] },
    { diameter: 22, bodies: [72, 81, 100, 110, 111], widths: [0.8, 1.75, 1.75, 1.75, 1.45] },
    { diameter: 25, bodies: [70, 75, 80, 85, 88, 90, 92, 94, 95, 97, 104, 108, 110, 114, 115, 116, 134, 135, 154], widths: [0.8, 2, 2, 2, 1.65] },
    { diameter: 30, bodies: [65, 70, 78, 80, 85, 86, 89, 90, 92, 94, 98, 100, 105, 106, 108, 109, 110, 111, 113, 114, 115, 118, 120, 122, 148], widths: [0.8, 2.375, 2.375, 2.375, 2.075] },
    { diameter: 35, bodies: [89, 96, 100, 101, 104, 105, 114, 120, 121, 125, 130, 134, 135, 140, 142, 148, 151, 155, 164], widths: [0.9, 2.75, 2.75, 2.75, 2.35] },
    { diameter: 40, bodies: [82, 90, 106, 114, 118, 122, 126, 130, 133, 134, 135, 137, 138, 140, 145, 150, 160], widths: [0.9, 3.15, 3.15, 3.15, 2.75] },
    { diameter: 45, bodies: [94, 107, 158], widths: [0.9, 3.55, 3.55, 3.55, 3.15] },
    { diameter: 50, bodies: [95, 180], widths: [0.9, 3.925, 3.925, 3.925, 3.525] },
  ];
  let BRAND_COMPLIANCE_DATA = [];
  let TUBE_SIZE_RULES = FALLBACK_TUBE_SIZE_RULES.slice();
  let TUBE_SIZE_SPECS = [];
  let TEMPLATE_XLSX_BASE64 = '';
  let ICON_ASSETS = Object.create(null);
  let cloudAssetCache = loadCloudAssetCache();
  let cloudAssetRefreshPromise = null;

  applyCloudAssetCache(cloudAssetCache);

  function loadCloudAssetCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(CLOUD_ASSET_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(CLOUD_ASSET_CACHE_KEY) || 'null');
      if (!saved || Number(saved.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  function saveCloudAssetCache(value) {
    if (typeof GM_setValue === 'function') GM_setValue(CLOUD_ASSET_CACHE_KEY, value);
    else localStorage.setItem(CLOUD_ASSET_CACHE_KEY, JSON.stringify(value));
  }

  function hasCompleteCloudAssetCache(value) {
    const runtime = value && value.runtimeData;
    return Boolean(
      Number(value && value.schemaVersion) === CLOUD_ASSET_CACHE_SCHEMA
      && runtime && Array.isArray(runtime.brands) && runtime.brands.length
      && Array.isArray(runtime.tubeRules) && runtime.tubeRules.length
      && Array.isArray(runtime.tubeSpecs) && runtime.tubeSpecs.length
      && typeof value.templateBase64 === 'string' && value.templateBase64.length > 1000
      && value.icons && typeof value.icons === 'object' && Object.keys(value.icons).length
    );
  }

  function applyCloudAssetCache(value) {
    if (!value || Number(value.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA) return false;
    const runtime = value.runtimeData || {};
    if (Array.isArray(runtime.brands) && runtime.brands.length) BRAND_COMPLIANCE_DATA = runtime.brands;
    if (Array.isArray(runtime.tubeRules) && runtime.tubeRules.length) TUBE_SIZE_RULES = runtime.tubeRules;
    if (Array.isArray(runtime.tubeSpecs) && runtime.tubeSpecs.length) TUBE_SIZE_SPECS = runtime.tubeSpecs;
    if (typeof value.templateBase64 === 'string' && value.templateBase64.length > 1000) TEMPLATE_XLSX_BASE64 = value.templateBase64;
    if (value.icons && typeof value.icons === 'object') ICON_ASSETS = value.icons;
    return true;
  }

  function getCachedCloudUiStyles() {
    if (String(cloudAssetCache && cloudAssetCache.uiAssetVersion || '') !== UI_ASSET_VERSION) return '';
    const css = cloudAssetCache && cloudAssetCache.uiCss;
    return typeof css === 'string' && css.length > 10000 ? css : '';
  }

  function cloudBrandComplianceNeedsRefresh(cache) {
    const brands = cache && cache.runtimeData && cache.runtimeData.brands;
    if (!Array.isArray(brands)) return false;
    const amz = brands.find((item) => String(item && item.brand || '').trim().toUpperCase() === 'AMZ');
    return Boolean(amz && (!amz.us_rep || !cleanComplianceValue(amz.us_rep.company)));
  }

  function scheduleCloudAssetRefresh(delay) {
    window.setTimeout(async () => {
      try {
        await refreshCloudAssets(false);
      } catch (error) {
        if (typeof showUiOfflineFallback === 'function') showUiOfflineFallback(error);
        addLog('warn', '\u4e91\u7aef\u8d44\u6e90\u66f4\u65b0\u5931\u8d25', formatErrorMessage(error));
      }
      try {
        await refreshBrandComplianceData();
      } catch (error) {
        addLog('warn', '\u54c1\u724c\u5730\u5740\u66f4\u65b0\u5931\u8d25\uff0c\u7ee7\u7eed\u4f7f\u7528\u672c\u5730\u5907\u7528\u6570\u636e', formatErrorMessage(error));
      }
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshBrandComplianceData() {
    const response = await cloudRequest('/brand-compliance', { method: 'GET' });
    const brands = response && response.brands;
    if (!Array.isArray(brands) || !brands.length) throw new Error('cloud brand compliance data is empty');
    BRAND_COMPLIANCE_DATA = brands;
    if (cloudAssetCache && cloudAssetCache.runtimeData) {
      cloudAssetCache = {
        ...cloudAssetCache,
        runtimeData: { ...cloudAssetCache.runtimeData, brands },
        brandComplianceUpdatedAt: String(response.updatedAt || new Date().toISOString()),
      };
      saveCloudAssetCache(cloudAssetCache);
    }
    return brands;
  }

  function refreshCloudAssets(force) {
    if (cloudAssetRefreshPromise) return cloudAssetRefreshPromise;
    cloudAssetRefreshPromise = refreshCloudAssetsNow(Boolean(force)).finally(() => {
      cloudAssetRefreshPromise = null;
    });
    return cloudAssetRefreshPromise;
  }

  async function refreshCloudAssetsNow(force) {
    const now = Date.now();
    const hasUiStyles = Boolean(getCachedCloudUiStyles());
    const staleBrandCompliance = cloudBrandComplianceNeedsRefresh(cloudAssetCache);
    const staleUiAsset = String(cloudAssetCache && cloudAssetCache.uiAssetVersion || '') !== UI_ASSET_VERSION;
    if (!force && !staleBrandCompliance && !staleUiAsset && hasCompleteCloudAssetCache(cloudAssetCache) && hasUiStyles && now - Number(cloudAssetCache.checkedAt || 0) < CLOUD_ASSET_REFRESH_MS) {
      return cloudAssetCache;
    }
    const manifest = await cloudAssetRequest('/assets/manifest.json', 'json');
    if (!manifest || Number(manifest.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA || !manifest.assets) {
      throw new Error('unsupported cloud asset manifest');
    }
    if (!staleBrandCompliance && hasCompleteCloudAssetCache(cloudAssetCache) && hasUiStyles && cloudAssetCache.dataVersion === manifest.dataVersion) {
      cloudAssetCache = { ...cloudAssetCache, checkedAt: now, uiAssetVersion: UI_ASSET_VERSION };
      saveCloudAssetCache(cloudAssetCache);
      return cloudAssetCache;
    }
    const runtimeDescriptor = manifest.assets.runtimeData;
    const templateDescriptor = manifest.assets.excelTemplate;
    const iconsDescriptor = manifest.assets.icons;
    const uiDescriptor = manifest.assets.uiStyles;
    if (!runtimeDescriptor || !templateDescriptor || !iconsDescriptor || !uiDescriptor) throw new Error('cloud asset manifest is incomplete');
    const uiCss = await fetchCloudAsset(uiDescriptor, 'text');
    if (typeof uiCss !== 'string' || uiCss.length < 10000 || !uiCss.includes('#' + PANEL_ID)) {
      throw new Error('cloud UI stylesheet is invalid');
    }
    applyCloudUiStyles(uiCss);
    cloudAssetCache = {
      ...(cloudAssetCache || {}),
      schemaVersion: CLOUD_ASSET_CACHE_SCHEMA,
      dataVersion: String(manifest.dataVersion || ''),
      uiAssetVersion: UI_ASSET_VERSION,
      uiCss,
      uiCssUpdatedAt: new Date(now).toISOString(),
    };
    saveCloudAssetCache(cloudAssetCache);
    const [runtimeText, templateBuffer, iconsText] = await Promise.all([
      fetchCloudAsset(runtimeDescriptor, 'text'),
      fetchCloudAsset(templateDescriptor, 'arraybuffer'),
      fetchCloudAsset(iconsDescriptor, 'text'),
    ]);
    const runtimeData = JSON.parse(runtimeText);
    const iconPackage = JSON.parse(iconsText);
    if (!runtimeData || Number(runtimeData.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA
      || !Array.isArray(runtimeData.brands) || !Array.isArray(runtimeData.tubeRules) || !Array.isArray(runtimeData.tubeSpecs)) {
      throw new Error('cloud runtime data is invalid');
    }
    if (!iconPackage || Number(iconPackage.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA
      || !iconPackage.icons || typeof iconPackage.icons !== 'object') {
      throw new Error('cloud icon data is invalid');
    }
    const nextCache = {
      schemaVersion: CLOUD_ASSET_CACHE_SCHEMA,
      dataVersion: String(manifest.dataVersion || ''),
      uiAssetVersion: UI_ASSET_VERSION,
      checkedAt: now,
      updatedAt: new Date(now).toISOString(),
      runtimeData,
      templateBase64: arrayBufferToBase64(templateBuffer),
      icons: iconPackage.icons,
      uiCss,
    };
    if (!hasCompleteCloudAssetCache(nextCache)) throw new Error('cloud asset cache is incomplete');
    saveCloudAssetCache(nextCache);
    cloudAssetCache = nextCache;
    applyCloudAssetCache(nextCache);
    const panel = document.getElementById(PANEL_ID);
    if (panel) renderShell();
    addLog('success', '\u4e91\u7aef\u8d44\u6e90\u5df2\u66f4\u65b0', nextCache.dataVersion);
    return nextCache;
  }

  async function fetchCloudAsset(descriptor, responseType) {
    const path = String(descriptor && descriptor.path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
    if (!path) throw new Error('cloud asset path is missing');
    const value = await cloudAssetRequest('/assets/' + path, responseType);
    const bytes = responseType === 'arraybuffer'
      ? value.byteLength
      : new TextEncoder().encode(value).byteLength;
    if (Number(descriptor.bytes) && bytes !== Number(descriptor.bytes)) throw new Error('cloud asset size mismatch: ' + path);
    if (descriptor.sha256) {
      const digest = await sha256Asset(responseType === 'arraybuffer' ? value : new TextEncoder().encode(value));
      if (digest && digest !== String(descriptor.sha256).toLowerCase()) throw new Error('cloud asset checksum mismatch: ' + path);
    }
    return value;
  }

  async function sha256Asset(value) {
    if (!window.crypto || !window.crypto.subtle) return '';
    const buffer = value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function cloudAssetRequest(path, responseType) {
    const url = CLOUD_BACKUP_API_BASE + path;
    return new Promise((resolve, reject) => {
      const finish = (status, text, buffer) => {
        if (status < 200 || status >= 300) {
          reject(new Error('cloud asset HTTP ' + status));
          return;
        }
        try {
          if (responseType === 'arraybuffer') resolve(buffer);
          else if (responseType === 'json') resolve(JSON.parse(text || '{}'));
          else resolve(text || '');
        } catch (error) {
          reject(error);
        }
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          responseType: responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
          timeout: 30000,
          onload: (response) => finish(response.status, response.responseText, response.response),
          onerror: () => reject(new Error('cloud asset network unavailable')),
          ontimeout: () => reject(new Error('cloud asset timeout')),
        });
        return;
      }
      fetch(url).then(async (response) => {
        const value = responseType === 'arraybuffer' ? await response.arrayBuffer() : await response.text();
        finish(response.status, responseType === 'arraybuffer' ? '' : value, responseType === 'arraybuffer' ? value : null);
      }).catch(reject);
    });
  }

  async function ensureExcelTemplateLoaded() {
    if (TEMPLATE_XLSX_BASE64) return true;
    try {
      await refreshCloudAssets(true);
    } catch (error) {
      addLog('warn', '\u4e91\u7aef Excel \u6a21\u677f\u52a0\u8f7d\u5931\u8d25', formatErrorMessage(error));
    }
    return Boolean(TEMPLATE_XLSX_BASE64);
  }
  // </cloud-assets-module>
  // <icon-assets-module>
  const CORE_ICON_ASSETS = Object.freeze({
    home: "<svg viewBox=\"0 0 1024 1024\" aria-hidden=\"true\"><path d=\"M453.037 86.017c33.826-29.356 84.099-29.356 117.926 0l374.262 324.79c16.676 14.472 18.461 39.72 3.988 56.393a39.982 39.982 0 0 1-30.194 13.773h-69.096v389.083c0 49.178-39.472 89.138-88.467 89.932l-1.488 0.012H263.904c-49.681 0-89.956-40.27-89.956-89.944V480.973H104.98c-21.86 0-39.622-17.541-39.98-39.314v-0.661a39.973 39.973 0 0 1 13.774-30.19z m78.617 45.285c-11.276-9.785-28.033-9.785-39.309 0L158.508 421.01h35.43c21.86 0 39.622 17.541 39.975 39.314l0.006 0.661v409.07c0 16.559 13.424 29.982 29.985 29.982h496.064c16.56 0 29.985-13.423 29.985-29.981v-409.07c0-22.078 17.9-39.976 39.98-39.976h35.557z m110.285 654.805c16.558 0 29.981 13.423 29.981 29.982 0 16.558-13.423 29.981-29.981 29.981H382.06c-16.559 0-29.982-13.423-29.982-29.981 0-16.559 13.423-29.982 29.982-29.982h259.878z\"></path></svg>",
    settings: "<svg viewBox=\"0 0 1024 1024\" aria-hidden=\"true\"><path d=\"M512.7 664.3c-82.9 0-150.4-67.4-150.4-150.4 0-82.9 67.4-150.4 150.4-150.4 82.9 0 150.4 67.4 150.4 150.4-0.1 83-67.5 150.4-150.4 150.4z m0-244.7c-52 0-94.4 42.3-94.4 94.4 0 52 42.3 94.4 94.4 94.4S607 566 607 514c0-52-42.3-94.4-94.3-94.4z\"></path><path d=\"M631.2 940.5c-15.2 0-30.1-6-41.2-17.3l-63.5-64.8c-4.1-4.2-9.5-6.5-15.4-6.5-5.8 0-11.3 2.3-15.3 6.4l-63.5 64.4c-17.4 17.6-44 22.2-66.2 11.4l-94.5-45.7c-22.2-10.8-35.2-34.5-32.2-59l11-90.1c0.7-5.8-0.9-11.5-4.5-16-3.6-4.6-8.8-7.4-14.6-8l-89.9-9.5c-24.6-2.6-44.8-20.5-50.2-44.6L67.7 558.8c-5.5-24.1 5-49 26-62l77.3-47.6c5-3.1 8.4-7.9 9.7-13.5 1.3-5.7 0.3-11.5-2.8-16.4L129.2 343c-13.3-20.8-11.9-47.8 3.5-67.1l65.5-82c15.4-19.3 41.4-26.7 64.7-18.3l85.4 30.7c5.5 2 11.4 1.7 16.6-0.9 5.2-2.5 9.2-7 11.1-12.5l29.2-85.6c8-23.4 29.9-39.1 54.6-39.1h105c24.7 0 46.7 15.7 54.6 39.1l29.6 86.8c1.9 5.5 5.8 9.9 11 12.5s11.1 2.8 16.6 0.9l86.1-30.6c23.3-8.3 49.2-0.8 64.6 18.5l65.2 82.3c15.3 19.4 16.7 46.3 3.3 67.1l-49.1 76.3c-3.2 4.9-4.2 10.7-2.9 16.4 1.3 5.7 4.7 10.5 9.7 13.6l76.8 47.7c21 13 31.4 38 25.8 62l-23.6 102.3a57.67 57.67 0 0 1-50.4 44.4l-90.3 9.2c-5.8 0.6-11 3.4-14.6 8-3.6 4.5-5.3 10.2-4.6 16l10.7 89.8c2.9 24.5-10.1 48.2-32.4 58.9l-94.7 45.4c-8.1 3.9-16.6 5.7-25 5.7zM511 795.9h0.1c21 0 40.6 8.3 55.3 23.3l63.5 64.8c0.5 0.5 1.3 0.7 2 0.4l94.7-45.4c0.7-0.3 1.1-1 1-1.8l-10.7-89.8c-2.5-20.8 3.4-41.3 16.5-57.6s31.8-26.5 52.7-28.7l90.3-9.2c0.7-0.1 1.3-0.6 1.5-1.3l23.6-102.3c0.2-0.7-0.1-1.5-0.8-1.9l-76.8-47.7c-17.8-11.1-30.2-28.4-34.8-48.8-4.6-20.4-0.9-41.4 10.5-59l49.1-76.3c0.4-0.6 0.4-1.4-0.1-2l-65.2-82.3c-0.5-0.6-1.2-0.8-1.9-0.6l-86.1 30.6c-19.7 7-40.9 5.9-59.7-3.2-18.8-9.1-32.9-25-39.7-44.8l-29.6-86.8c-0.2-0.7-0.9-1.2-1.6-1.2h-105c-0.7 0-1.4 0.5-1.6 1.2L429 211c-6.8 19.8-20.9 35.8-39.8 44.9-18.9 9.1-40.1 10.2-59.9 3.1l-85.4-30.7c-0.7-0.2-1.5 0-1.9 0.5l-65.5 82c-0.5 0.6-0.5 1.4-0.1 2l48.7 76.2c11.3 17.7 14.9 38.6 10.2 59.1-4.7 20.4-17.1 37.7-34.9 48.7l-77.3 47.6c-0.6 0.4-0.9 1.1-0.8 1.9l23.3 102.4c0.2 0.7 0.8 1.3 1.5 1.3l89.9 9.5c20.8 2.2 39.5 12.4 52.6 28.8 13 16.4 18.8 36.9 16.3 57.7l-11 90.1c-0.1 0.7 0.3 1.4 1 1.8l94.5 45.7c0.7 0.3 1.5 0.2 2-0.3l63.5-64.4c14.6-14.8 34.2-23 55.1-23z\"></path></svg>",
    notification: "<svg viewBox=\"0 0 1024 1024\" aria-hidden=\"true\"><path d=\"M512 1024c-85.333333 0-159.288889-62.577778-159.288889-136.533333 0-17.066667 11.377778-28.444444 28.444445-28.444445s28.444444 11.377778 28.444444 28.444445c0 45.511111 45.511111 79.644444 102.4 79.644444s102.4-34.133333 102.4-79.644444c0-17.066667 11.377778-28.444444 28.444444-28.444445s28.444444 11.377778 28.444445 28.444445c0 73.955556-73.955556 136.533333-159.288889 136.533333zM853.333333 853.333333H170.666667c-39.822222 0-73.955556-34.133333-73.955556-73.955555 0-39.822222 28.444444-68.266667 68.266667-68.266667 11.377778-17.066667 17.066667-79.644444 17.066666-142.222222V449.422222c0-147.911111 85.333333-284.444444 216.177778-335.644444 0-62.577778 51.2-113.777778 113.777778-113.777778s113.777778 45.511111 113.777778 108.088889c130.844444 51.2 216.177778 187.733333 216.177778 335.644444V568.888889c0 62.577778 11.377778 125.155556 22.755555 142.222222 34.133333 0 68.266667 34.133333 68.266667 68.266667-5.688889 39.822222-39.822222 73.955556-79.644445 73.955555zM512 56.888889c-34.133333 0-56.888889 28.444444-56.888889 56.888889v11.377778c0 11.377778-5.688889 28.444444-17.066667 34.133333-113.777778 39.822222-199.111111 159.288889-199.111111 290.133333V568.888889c0 130.844444-22.755556 199.111111-68.266666 199.111111-11.377778 0-17.066667 5.688889-17.066667 17.066667 0 5.688889 5.688889 11.377778 17.066667 11.377777h682.666666c5.688889 0 17.066667-5.688889 17.066667-17.066666 0-5.688889-5.688889-17.066667-17.066667-17.066667-45.511111 0-73.955556-68.266667-73.955555-199.111111v-113.777778c0-130.844444-79.644444-250.311111-193.422222-290.133333-11.377778-5.688889-17.066667-22.755556-17.066667-34.133333V113.777778c0-28.444444-22.755556-56.888889-56.888889-56.888889z\"></path></svg>",
    edit: '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M343.291 560.334c-.585.776-1.168 1.577-1.434 2.543l-45.09 170.896c-2.615 9.952.073 20.683 7.194 28.238 5.326 5.376 12.352 8.334 19.834 8.334 2.467 0 4.934-.294 7.359-.974l164.117-46.28c.263 0 .386.246.58.246 1.887 0 3.755-.7 5.133-2.207l438.852-453.64C952.859 254.001 960 235.623 960 215.615c0-22.668-9.294-45.311-25.572-62.112l-41.432-42.911c-16.272-16.829-38.212-26.474-60.102-26.474-19.35 0-37.123 7.393-50.203 20.851L343.943 558.76c-.462.437-.341 1.07-.652 1.574m553.58-337.287-43.589 45.045-70.636-74.223 42.959-44.409c6.779-7.073 19.952-6.032 27.748 2.055l41.486 42.914c4.312 4.478 6.782 10.411 6.782 16.297-.026 4.822-1.675 9.201-4.75 12.321m-475.557 344.41 316.655-327.405 70.709 74.268L492.606 641.1l-71.292-73.643zm-57.685 132.752 22.884-86.838 61.051 63.109-83.935 23.729zm561.043-297.381c-16.614 0-30.223 13.976-30.293 31.388v422.941c0 22.181-17.412 40.198-38.893 40.198H163.482c-21.453 0-38.937-18.017-38.937-40.198V166.824c0-22.209 17.485-40.226 38.937-40.226h445.681c16.701 0 30.268-14.046 30.268-31.312 0-17.244-13.567-31.287-30.268-31.287H158.855C106.572 64 64 107.98 64 162.075V861.95C64 916.051 106.572 960 158.855 960h701.207c52.337 0 94.855-43.95 94.855-98.051V434c-.047-17.196-13.634-31.172-30.245-31.172"></path></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8 8 8 8M16 8l-8 8"></path></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"></path><path d="M6.2 8a7 7 0 0 1 11.5-1L20 12M4 12l2.3 5a7 7 0 0 0 11.5-1"></path></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6M10 12h9"></path></svg>',
    warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3Z"></path><path d="M12 9v5M12 18h.01"></path></svg>',
  });
  const DEFAULT_ICON_ASSET = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"></rect><circle cx="12" cy="12" r="2"></circle></svg>';

  function iconHtml(name) {
    const svg = ICON_ASSETS[name] || CORE_ICON_ASSETS[name] || DEFAULT_ICON_ASSET;
    return '<span class="pfh-icon pfh-icon-' + escapeHtml(name) + '">' + svg + '</span>';
  }
  // </icon-assets-module>
  // <notifications-module>
  const NOTIFICATION_CACHE_KEY = 'plm-floating-helper:notifications:v1';
  const NOTIFICATION_REFRESH_MS = 5 * 60 * 1000;
  const BACKEND_UPDATE_PROMPTED_KEY = 'plm-floating-helper:backend-update-prompted-id';
  const GREASYFORK_SCRIPT_URL = 'https://greasyfork.org/zh-CN/scripts/582138-plm%E6%82%AC%E6%B5%AE%E5%8A%A9%E6%89%8B';

  function isVersionUpdateNotification(item) {
    const source = item && typeof item === 'object' ? item : {};
    return /(?:新版本|版本更新|更新提示|脚本更新)/.test(String(source.title || '') + ' ' + String(source.content || ''));
  }

  function normalizeNotificationItem(item) {
    const source = item && typeof item === 'object' ? item : {};
    const notificationId = String(source.notificationId || source.notification_id || '').trim();
    if (!notificationId) return null;
    const title = String(source.title || '\u672a\u547d\u540d\u901a\u77e5').slice(0, 120);
    const content = String(source.content || '').slice(0, 4000);
    return {
      notificationId,
      title,
      content,
      publishedAt: String(source.publishedAt || source.published_at || ''),
      updatedAt: String(source.updatedAt || source.updated_at || ''),
      isRead: Boolean(source.isRead || source.is_read),
      readAt: String(source.readAt || source.read_at || ''),
      actionUrl: String(source.actionUrl || (isVersionUpdateNotification({ title, content }) ? GREASYFORK_SCRIPT_URL : '')).slice(0, 500),
      actionLabel: String(source.actionLabel || (isVersionUpdateNotification({ title, content }) ? '\u53bb\u66f4\u65b0' : '')).slice(0, 40),
    };
  }

  function loadNotificationCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(NOTIFICATION_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(NOTIFICATION_CACHE_KEY) || 'null');
      const source = saved && typeof saved === 'object' ? saved : {};
      return {
        items: (Array.isArray(source.items) ? source.items : []).map(normalizeNotificationItem).filter(Boolean),
        pendingReadIds: (Array.isArray(source.pendingReadIds) ? source.pendingReadIds : []).map(String).filter(Boolean),
        checkedAt: Number(source.checkedAt || 0) || 0,
      };
    } catch (error) {
      return { items: [], pendingReadIds: [], checkedAt: 0 };
    }
  }

  function saveNotificationCache() {
    const payload = {
      items: Array.isArray(state.notifications) ? state.notifications.slice(0, 80) : [],
      pendingReadIds: Array.isArray(state.notificationPendingReadIds) ? state.notificationPendingReadIds.slice(0, 100) : [],
      checkedAt: Number(state.notificationCheckedAt || Date.now()),
    };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(NOTIFICATION_CACHE_KEY, payload);
      else localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {}
  }

  function notificationUnreadCount() {
    return (state.notifications || []).filter((item) => item && !item.isRead).length;
  }

  function updateNotificationButton(panel) {
    const button = panel && panel.querySelector('[data-action="notifications"]');
    if (!button) return;
    const count = notificationUnreadCount();
    const badge = button.querySelector('.pfh-notification-badge');
    button.classList.toggle('has-unread', count > 0);
    button.setAttribute('aria-label', count ? '\u901a\u77e5\uff0c' + count + '\u6761\u672a\u8bfb' : '\u901a\u77e5');
    if (badge) {
      badge.textContent = count > 99 ? '99+' : String(count || '');
      badge.setAttribute('aria-hidden', count ? 'false' : 'true');
    }
  }

  function formatNotificationTime(value) {
    if (value === undefined || value === null || value === '') return '';
    const text = String(value).trim();
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
    const isCloudTimestamp = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(text);
    const normalized = typeof value === 'number'
      ? value
      : (isCloudTimestamp && !hasTimezone ? text.replace(' ', 'T') + 'Z' : text);
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  }

  function notificationListHtml(items, emptyText) {
    if (!items.length) return '<div class="pfh-notification-empty">' + escapeHtml(emptyText) + '</div>';
    return items.map((item) => '<article class="pfh-notification-item' + (item.isRead ? ' is-read' : ' is-unread') + '">' +
      '<div class="pfh-notification-item-head"><h4>' + escapeHtml(item.title) + '</h4>' + (!item.isRead ? '<span>\u65b0</span>' : '') + '</div>' +
      '<div class="pfh-notification-content">' + escapeHtml(item.content) + '</div>' +
      '<div class="pfh-notification-foot"><time>' + escapeHtml(formatNotificationTime(item.publishedAt)) + '</time>' +
      (item.actionUrl ? '<a class="pfh-notification-action" href="' + escapeHtml(item.actionUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.actionLabel || '\u53bb\u66f4\u65b0') + '</a>' : '') +
      (!item.isRead ? '<button type="button" data-action="notification-read" data-notification-id="' + escapeHtml(item.notificationId) + '">\u6211\u77e5\u9053\u4e86</button>' : '<span>\u5df2\u8bfb</span>') + '</div></article>').join('');
  }

  function promptBackendUpdateNotification() {
    const updateNotice = (state.notifications || []).find((item) => item && !item.isRead && isVersionUpdateNotification(item));
    if (!updateNotice) return false;
    let promptedId = '';
    try {
      promptedId = String(typeof GM_getValue === 'function' ? GM_getValue(BACKEND_UPDATE_PROMPTED_KEY, '') : localStorage.getItem(BACKEND_UPDATE_PROMPTED_KEY) || '');
    } catch (error) {}
    if (promptedId === updateNotice.notificationId) return false;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(BACKEND_UPDATE_PROMPTED_KEY, updateNotice.notificationId);
      else localStorage.setItem(BACKEND_UPDATE_PROMPTED_KEY, updateNotice.notificationId);
    } catch (error) {}
    state.notificationModalOpen = true;
    state.notificationTab = 'new';
    expandPanel();
    return true;
  }

  function renderNotificationModal(panel) {
    if (!panel) return;
    if (!document.getElementById(PANEL_ID + '-notification-action-styles')) {
      const style = document.createElement('style');
      style.id = PANEL_ID + '-notification-action-styles';
      style.textContent = '#' + PANEL_ID + ' .pfh-notification-action{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 12px;border:1px solid rgba(124,58,237,.28);border-radius:9px;background:#7c3aed;color:#fff;font-size:12px;font-weight:650;text-decoration:none;}';
      document.documentElement.appendChild(style);
    }
    let layer = panel.querySelector('.pfh-notification-layer');
    if (!state.notificationModalOpen) {
      if (layer) layer.remove();
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-notification-layer';
      layer.setAttribute('data-action', 'notification-close');
      panel.querySelector('.pfh-full').appendChild(layer);
    }
    const tab = state.notificationTab === 'history' ? 'history' : 'new';
    const items = (state.notifications || []).filter((item) => tab === 'new' ? !item.isRead : item.isRead);
    const status = state.notificationsLoading
      ? '<span class="pfh-notification-status">\u6b63\u5728\u540c\u6b65\u2026</span>'
      : state.notificationsError
        ? '<span class="pfh-notification-status is-error">\u5df2\u663e\u793a\u672c\u5730\u7f13\u5b58</span>'
        : '<span class="pfh-notification-status">' + (state.notificationCheckedAt ? '\u66f4\u65b0\u4e8e ' + escapeHtml(formatNotificationTime(state.notificationCheckedAt)) : '\u6682\u672a\u540c\u6b65') + '</span>';
    layer.innerHTML = '<section class="pfh-notification-dialog" role="dialog" aria-modal="true" aria-label="\u901a\u77e5\u4e2d\u5fc3" data-notification-dialog="1">' +
      '<header><div><h3>\u901a\u77e5\u4e2d\u5fc3</h3>' + status + '</div><button type="button" class="pfh-notification-close" data-action="notification-close" aria-label="\u5173\u95ed">\u00d7</button></header>' +
      '<nav><button type="button" data-action="notification-tab" data-tab="new" class="' + (tab === 'new' ? 'is-active' : '') + '">\u65b0\u901a\u77e5 <em>' + notificationUnreadCount() + '</em></button>' +
      '<button type="button" data-action="notification-tab" data-tab="history" class="' + (tab === 'history' ? 'is-active' : '') + '">\u5386\u53f2\u901a\u77e5</button>' +
      '<button type="button" data-action="notification-refresh">\u5237\u65b0</button></nav>' +
      '<div class="pfh-notification-list">' + notificationListHtml(items, tab === 'new' ? '\u6682\u65e0\u65b0\u901a\u77e5' : '\u6682\u65e0\u5386\u53f2\u901a\u77e5') + '</div>' +
      (notificationUnreadCount() ? '<footer><button type="button" data-action="notification-read-all">\u5168\u90e8\u6807\u4e3a\u5df2\u8bfb</button></footer>' : '') + '</section>';
  }

  function openNotificationModal() {
    state.notificationModalOpen = true;
    state.notificationTab = notificationUnreadCount() ? 'new' : 'history';
    expandPanel();
    renderShell();
    refreshNotifications(false);
  }

  function closeNotificationModal() {
    state.notificationModalOpen = false;
    const panel = document.getElementById(PANEL_ID);
    if (panel) renderNotificationModal(panel);
  }

  async function syncPendingNotificationReads(name, instanceId) {
    const pending = Array.from(new Set(state.notificationPendingReadIds || []));
    if (!pending.length) return;
    const completed = [];
    for (const notificationId of pending) {
      try {
        await cloudRequest('/notifications/read', {
          method: 'POST',
          body: { notificationId, name, instanceId, version: SCRIPT_VERSION },
        });
        completed.push(notificationId);
      } catch (error) {}
    }
    if (completed.length) {
      state.notificationPendingReadIds = pending.filter((id) => !completed.includes(id));
      saveNotificationCache();
    }
  }

  async function refreshNotifications(showFeedback) {
    if (state.notificationsLoading) return;
    const name = findCurrentPlmUserName();
    const instanceId = getClientInstanceId();
    state.notificationsLoading = true;
    state.notificationsError = '';
    if (state.notificationModalOpen) renderShell();
    try {
      await syncPendingNotificationReads(name, instanceId);
      const response = await cloudRequest('/notifications?name=' + encodeURIComponent(name || '') + '&instanceId=' + encodeURIComponent(instanceId) + '&version=' + encodeURIComponent(SCRIPT_VERSION), { method: 'GET' });
      const pending = new Set(state.notificationPendingReadIds || []);
      state.notifications = (Array.isArray(response && response.notifications) ? response.notifications : [])
        .map(normalizeNotificationItem)
        .filter(Boolean)
        .map((item) => pending.has(item.notificationId) ? { ...item, isRead: true } : item);
      state.notificationCheckedAt = Date.now();
      saveNotificationCache();
      promptBackendUpdateNotification();
      if (showFeedback) showToast('\u901a\u77e5\u5df2\u66f4\u65b0');
    } catch (error) {
      state.notificationsError = formatErrorMessage(error);
      if (showFeedback) showToast('\u65e0\u6cd5\u8054\u7f51\uff0c\u5df2\u663e\u793a\u672c\u5730\u7f13\u5b58');
    } finally {
      state.notificationsLoading = false;
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        updateNotificationButton(panel);
        if (state.notificationModalOpen) renderNotificationModal(panel);
      }
    }
  }

  function scheduleNotificationRefresh(delay) {
    window.clearTimeout(state.notificationRefreshTimer);
    state.notificationRefreshTimer = window.setTimeout(async () => {
      await refreshNotifications(false);
      scheduleNotificationRefresh(NOTIFICATION_REFRESH_MS);
    }, Math.max(0, Number(delay) || 0));
  }

  async function markNotificationRead(notificationId, showFeedback) {
    const id = String(notificationId || '');
    if (!id) return;
    state.notifications = (state.notifications || []).map((item) => item.notificationId === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item);
    state.notificationPendingReadIds = Array.from(new Set([...(state.notificationPendingReadIds || []), id]));
    saveNotificationCache();
    renderShell();
    await syncPendingNotificationReads(findCurrentPlmUserName(), getClientInstanceId());
    if (showFeedback) showToast('\u5df2\u6807\u4e3a\u5df2\u8bfb');
  }

  async function markAllNotificationsRead() {
    const ids = (state.notifications || []).filter((item) => !item.isRead).map((item) => item.notificationId);
    if (!ids.length) return;
    state.notifications = (state.notifications || []).map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }));
    state.notificationPendingReadIds = Array.from(new Set([...(state.notificationPendingReadIds || []), ...ids]));
    state.notificationTab = 'history';
    saveNotificationCache();
    renderShell();
    await syncPendingNotificationReads(findCurrentPlmUserName(), getClientInstanceId());
    showToast('\u5df2\u5168\u90e8\u6807\u4e3a\u5df2\u8bfb');
  }
  // </notifications-module>
  // <desktop-bridge-module>
  const DESKTOP_BRIDGE_URL = 'ws://127.0.0.1:37191';
  const DESKTOP_BRIDGE_TOKEN_KEY = 'plm_desktop_bridge_token';
  let desktopBridgeSocket = null;
  let desktopBridgeReconnectTimer = 0;
  let desktopBridgeSnapshotTimer = 0;
  let desktopBridgeStatus = '未配对';
  let desktopBridgeExcelQueue = Promise.resolve();

  function getDesktopBridgeToken() {
    try {
      return String(GM_getValue(DESKTOP_BRIDGE_TOKEN_KEY, '') || '').trim();
    } catch (_) {
      return '';
    }
  }

  function setDesktopBridgeToken(token) {
    const value = String(token || '').trim();
    if (typeof GM_setValue === 'function') GM_setValue(DESKTOP_BRIDGE_TOKEN_KEY, value);
    return value;
  }

  function isDesktopBridgeConnected() {
    return Boolean(desktopBridgeSocket && desktopBridgeSocket.readyState === WebSocket.OPEN);
  }

  function setDesktopBridgeStatus(text) {
    desktopBridgeStatus = String(text || '');
    const status = document.querySelector('#' + PANEL_ID + ' .pfh-desktop-bridge-status');
    if (status) status.textContent = desktopBridgeStatus;
  }

  function desktopBridgeSettingsHtml() {
    const token = getDesktopBridgeToken();
    return '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>桌面工作台</strong><span>' +
      escapeHtml(isDesktopBridgeConnected() ? '已连接' : '本机直连') +
      '</span></div><label class="pfh-cloud-key"><span>工作台连接码</span><input type="text" name="plm-desktop-pairing-code" class="pfh-desktop-bridge-token" value="' +
      escapeHtml(token) +
      '" placeholder="从 PLM 产品资产工作台复制连接码" autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-lpignore="true" data-1p-ignore="true" style="-webkit-text-security:disc"></label>' +
      '<div class="pfh-about-actions"><button type="button" data-action="desktop-bridge-connect">连接工作台</button>' +
      '<button type="button" data-action="desktop-bridge-disconnect">断开</button>' +
      '<span class="pfh-desktop-bridge-status">' + escapeHtml(desktopBridgeStatus) + '</span></div></div>';
  }

  function pairDesktopBridge(token) {
    const value = setDesktopBridgeToken(token);
    if (value.length < 32) {
      setDesktopBridgeStatus('连接码无效');
      showToast('桌面工作台连接码无效');
      return false;
    }
    connectDesktopBridge(true);
    return true;
  }

  function disconnectDesktopBridge(clearToken) {
    window.clearTimeout(desktopBridgeReconnectTimer);
    desktopBridgeReconnectTimer = 0;
    if (clearToken) setDesktopBridgeToken('');
    const socket = desktopBridgeSocket;
    desktopBridgeSocket = null;
    if (socket) {
      socket.onclose = null;
      try { socket.close(); } catch (_) {}
    }
    setDesktopBridgeStatus(clearToken ? '未配对' : '已断开');
  }

  function connectDesktopBridge(showFeedback) {
    const token = getDesktopBridgeToken();
    if (token.length < 32) {
      setDesktopBridgeStatus('未配对');
      return;
    }
    if (desktopBridgeSocket && (
      desktopBridgeSocket.readyState === WebSocket.OPEN ||
      desktopBridgeSocket.readyState === WebSocket.CONNECTING
    )) return;
    window.clearTimeout(desktopBridgeReconnectTimer);
    setDesktopBridgeStatus('正在连接…');
    try {
      const socket = new WebSocket(DESKTOP_BRIDGE_URL);
      desktopBridgeSocket = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: 'hello',
          token,
          version: SCRIPT_VERSION,
          userName: findCurrentPlmUserName() || '',
        }));
        setDesktopBridgeStatus('已连接桌面工作台');
        if (showFeedback) showToast('桌面工作台已连接');
      };
      socket.onmessage = (event) => handleDesktopBridgeMessage(event.data);
      socket.onerror = () => setDesktopBridgeStatus('连接失败，请确认工作台已打开');
      socket.onclose = () => {
        if (desktopBridgeSocket === socket) desktopBridgeSocket = null;
        setDesktopBridgeStatus('工作台未连接');
        desktopBridgeReconnectTimer = window.setTimeout(() => connectDesktopBridge(false), 5000);
      };
    } catch (error) {
      setDesktopBridgeStatus('连接失败：' + formatErrorMessage(error));
      desktopBridgeReconnectTimer = window.setTimeout(() => connectDesktopBridge(false), 5000);
    }
  }

  function startDesktopBridge() {
    desktopBridgeStatus = getDesktopBridgeToken() ? '等待连接工作台' : '未配对';
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('连接 PLM 产品资产工作台', () => {
        const value = window.prompt('粘贴桌面工作台显示的连接码', getDesktopBridgeToken());
        if (value !== null) pairDesktopBridge(value);
      });
    }
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.PLMDesktopBridge = {
        pair: pairDesktopBridge,
        disconnect: () => disconnectDesktopBridge(true),
        status: () => ({ connected: isDesktopBridgeConnected(), status: desktopBridgeStatus }),
      };
    }
    connectDesktopBridge(false);
  }

  function handleDesktopBridgeMessage(raw) {
    let message;
    try {
      message = JSON.parse(String(raw || ''));
    } catch (_) {
      return;
    }
    if (message.type === 'snapshot.request') {
      sendDesktopBridgeSnapshot();
      return;
    }
    if (message.type === 'excel.generate') {
      desktopBridgeExcelQueue = desktopBridgeExcelQueue
        .then(() => generateDesktopBridgeExcel(message))
        .catch((error) => {
          sendDesktopBridgeMessage({
            type: 'excel.error',
            jobId: String(message.jobId || ''),
            sku: String(message.sku || ''),
            message: formatErrorMessage(error),
          });
        });
      return;
    }
    if (message.type === 'ping') sendDesktopBridgeMessage({ type: 'pong', at: Date.now() });
  }

  function sendDesktopBridgeMessage(message) {
    if (!isDesktopBridgeConnected()) return false;
    desktopBridgeSocket.send(JSON.stringify(message));
    return true;
  }

  function collectDesktopFinalizedProducts() {
    syncDailyLedgerBeforeMutation();
    const rows = sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger())
      .filter((item) => item.finalizedAt && item.status !== '作废')
      .sort((a, b) => Number(b.finalizedAtMs || 0) - Number(a.finalizedAtMs || 0));
    const seen = new Set();
    return rows.reduce((products, row) => {
      const sku = String(row.sku || '').toUpperCase();
      if (!/^SKU\d{8}$/.test(sku) || seen.has(sku)) return products;
      seen.add(sku);
      const data = normalizeData({ ...(loadData(sku) || {}), ...row, sku });
      products.push({
        sku,
        brand: String(data.brand || ''),
        name: String(data.name || ''),
        englishName: String(data.englishName || ''),
        finalizedAt: String(row.finalizedAt || ''),
        finalizedDate: String(row.finalizedDate || ''),
        cacheUpdatedAtMs: Number(data.updatedAtMs || row.updatedAtMs || 0) || 0,
        packageSizeText: String(data.packageSizeText || ''),
        packageSizeLabel: String(data.packageSizeLabel || ''),
        packageNums: Array.isArray(data.packageNums) ? data.packageNums.slice() : [],
        packageLength: String(data.packageLength || ''),
        packageWidth: String(data.packageWidth || ''),
        packageHeight: String(data.packageHeight || ''),
        productNums: Array.isArray(data.productNums) ? data.productNums.slice() : [],
        plmProductNums: Array.isArray(data.plmProductNums) ? data.plmProductNums.slice() : [],
        productLength: String(data.productLength || ''),
        productWidth: String(data.productWidth || ''),
        productHeight: String(data.productHeight || ''),
        singleBottle: Boolean(data.singleBottle),
        hasInnerCard: Boolean(data.hasInnerCard),
        netContent: String(data.netContent || ''),
        grossWeight: String(data.grossWeight || ''),
        ingredients: String(getPreferredExcelIngredients(data) || ''),
        referenceUrl: String(data.referenceUrl || data.benchmarkLink || row.referenceUrl || ''),
        skuImageUrl: String(data.skuImageUrl || ''),
        skuImageFallbackUrl: String(data.skuImageFallbackUrl || data.skuImageUrl || ''),
        benchmarkImageUrl: String(data.benchmarkImageUrl || ''),
        benchmarkImageFallbackUrl: String(data.benchmarkImageFallbackUrl || data.benchmarkImageUrl || ''),
        packageCode: String(data.packageCode || row.packageCode || ''),
        printCode: String(data.printCode || row.printCode || ''),
        purchasePrice: String(data.purchasePrice || row.purchasePrice || ''),
        packQty: String(data.packQty || data.packCount || data.cartonQty || ''),
        boxFileState: String(row.boxFileState || data.boxFileState || ''),
        labelFileState: String(row.labelFileState || data.labelFileState || ''),
        imagePackState: String(row.imagePackState || data.imagePackState || ''),
        boxFileDone: Boolean(row.boxFileDone || data.boxFileDone),
        labelFileDone: Boolean(row.labelFileDone || data.labelFileDone),
        imagePackDone: Boolean(row.imagePackDone || data.imagePackDone),
      });
      return products;
    }, []);
  }

  function sendDesktopBridgeSnapshot() {
    const products = collectDesktopFinalizedProducts();
    sendDesktopBridgeMessage({
      type: 'snapshot.response',
      version: SCRIPT_VERSION,
      sentAt: new Date().toISOString(),
      products,
    });
    setDesktopBridgeStatus('已同步 ' + products.length + ' 个定稿 SKU');
    addLog('success', '桌面工作台同步完成', products.length + ' 个已定稿 SKU');
  }

  function scheduleDesktopBridgeSnapshot() {
    if (!isDesktopBridgeConnected()) return;
    window.clearTimeout(desktopBridgeSnapshotTimer);
    desktopBridgeSnapshotTimer = window.setTimeout(() => sendDesktopBridgeSnapshot(), 700);
  }

  function countHashDistance(left, right) {
    let value = BigInt('0x' + left) ^ BigInt('0x' + right);
    let count = 0;
    while (value) {
      count += Number(value & 1n);
      value >>= 1n;
    }
    return count;
  }

  async function getSkuImagePerceptualHash(dataUrl) {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('SKU 图片无法解码'));
      element.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 16, 16);
    ctx.drawImage(image, 0, 0, 16, 16);
    const pixels = ctx.getImageData(0, 0, 16, 16).data;
    const luminance = [];
    for (let index = 0; index < pixels.length; index += 4) {
      luminance.push(pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114);
    }
    const average = luminance.reduce((sum, value) => sum + value, 0) / luminance.length;
    let bits = '';
    luminance.forEach((value) => { bits += value < average ? '1' : '0'; });
    return BigInt('0b' + bits).toString(16).padStart(64, '0');
  }

  async function isPlaceholderSkuImage(dataUrl) {
    const hash = await getSkuImagePerceptualHash(dataUrl);
    const placeholders = [
      '0000000000000ff00ff00ff01f70082000000000000000000000000000000000',
      '000000000000000000001ff83ff83ff83ff83ff81ff800000000000000000000',
    ];
    return placeholders.some((placeholder) => countHashDistance(hash, placeholder) <= 14);
  }

  async function convertSkuImageToJpeg(dataUrl) {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('SKU 图片无法解码'));
      element.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL('image/jpeg', .95);
  }

  async function generateDesktopBridgeExcel(message) {
    const sku = String(message && message.sku || '').toUpperCase();
    const jobId = String(message && message.jobId || '');
    if (!/^SKU\d{8}$/.test(sku) || !jobId) throw new Error('Excel 任务参数无效');
    if (!window.ExcelJS) throw new Error('ExcelJS 尚未加载');
    if (!await ensureExcelTemplateLoaded()) throw new Error('Excel 模板尚未缓存，请联网后重试');
    const cachedData = normalizeData(loadData(sku) || state.index.find((item) => item.sku === sku) || {});
    const ledgerData = normalizeData(
      sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger()).find((item) => String(item.sku || '').toUpperCase() === sku) || {}
    );
    const bridgeRaw = { ...(message && message.product || {}) };
    if (!Array.isArray(bridgeRaw.packageNums) || bridgeRaw.packageNums.length < 3) {
      const packageParts = [bridgeRaw.packageLength, bridgeRaw.packageWidth, bridgeRaw.packageHeight]
        .map(extractCmValue)
        .map(Number);
      if (packageParts.every((value) => Number.isFinite(value) && value > 0)) bridgeRaw.packageNums = packageParts;
    }
    if (!Array.isArray(bridgeRaw.productNums) || bridgeRaw.productNums.length < 3) {
      const productParts = [bridgeRaw.productLength, bridgeRaw.productWidth, bridgeRaw.productHeight]
        .map(extractCmValue)
        .map(Number);
      if (productParts.every((value) => Number.isFinite(value) && value > 0)) bridgeRaw.productNums = productParts;
    }
    const bridgeData = normalizeData(bridgeRaw);
    const data = normalizeData(mergeData(mergeData(cachedData, ledgerData), bridgeData));
    if (!data.sku) throw new Error('本地缓存中找不到 ' + sku);
    state.selectedSku = sku;
    state.data = data;
    resetExcelState();
    addLog('info', '桌面工作台请求悬浮助手生成资产', sku);
    let extra;
    let excelData;
    if (message.auto) {
      extra = buildCachedExcelExtraData(data);
      excelData = data;
      state.excelExtra = { extra, excelData };
      state.excelMissing = getExcelMissingFields(excelData, extra);
      if (state.excelMissing.length) {
        throw new Error(sku + ' 缓存资料尚未完整，等待补齐：' + state.excelMissing.join('、'));
      }
      await fillRecommendedPackQty(excelData);
      await fillRecommendedPurchasePrice(excelData, extra);
    } else {
      await prepareExcelInfo();
      const prepared = state.excelExtra || {};
      extra = prepared.extra || buildCachedExcelExtraData(data);
      excelData = normalizeData(prepared.excelData || data);
    }
    const packQty = normalizePackQty(state.excelPackQty || excelData.packQty || excelData.packCount || excelData.cartonQty || '');
    const purchasePrice = String(state.excelPurchasePrice || excelData.purchasePrice || '6');
    if (!packQty) {
      const packBoxKey = buildPackBoxKey(excelData);
      if (!packBoxKey) throw new Error(sku + ' 缺少完整包装尺寸，无法计算装箱数');
      throw new Error(sku + ' 的包装尺寸为 ' + packBoxKey + '，但装箱推荐服务未返回结果');
    }
    if (!extra.isSkuDesignImage || !(extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl)) {
      throw new Error(sku + ' 未能读取 SKU 设计图，请确认项目详情中的产品图可预览');
    }
    const imageData = normalizeData({
      ...excelData,
      englishName: extra.englishName || excelData.englishName,
      ingredients: extra.ingredients || getPreferredExcelIngredients(excelData),
    });

    const workbook = new window.ExcelJS.Workbook();
    await workbook.xlsx.load(base64ToArrayBuffer(TEMPLATE_XLSX_BASE64));
    const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    const excelImageSource = getExcelImageSource(excelData, extra);
    const imageInfo = excelImageSource.imageUrl
      ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch(() => null)
      : null;
    if (!imageInfo || !imageInfo.dataUrl) throw new Error(sku + ' 未能读取真实 SKU 产品图');
    if (await isPlaceholderSkuImage(imageInfo.dataUrl)) {
      throw new Error(sku + ' 当前仍是 JPG/透明占位图，等待真实 SKU 产品图后自动生成');
    }
    const skuImageDataUrl = await convertSkuImageToJpeg(imageInfo.dataUrl);

    setCell(sheet, 'A4', buildExcelKeyword(excelData, extra));
    setCell(sheet, 'B4', excelData.name || extra.chineseName || '');
    setCell(sheet, 'C4', '');
    setCell(sheet, 'E4', compactText(packQty));
    setCell(sheet, 'G4', excelData.sku || '');
    if (excelData.singleBottle) setCell(sheet, 'H4', '瓶装');
    else sheet.getCell('H4').value = { formula: 'IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"盒装",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"袋装",""))' };
    setCell(sheet, 'I4', formatExcelDimFromParts([excelData.productLength, excelData.productWidth, excelData.productHeight]) || formatExcelDim(excelData.productNums, []));
    setCell(sheet, 'J4', formatExcelDimFromParts([excelData.packageLength, excelData.packageWidth, excelData.packageHeight]) || formatExcelDim(excelData.packageNums, []));
    setCell(sheet, 'L4', formatIngredientsForExcel(extra.ingredients));
    setCell(sheet, 'M4', normalizeExcelUnit(excelData.netContent));
    setCell(sheet, 'N4', normalizeExcelUnit(excelData.grossWeight));
    setCell(sheet, 'O4', normalizeExcelNumberOrText(purchasePrice));
    setCell(sheet, 'P4', getReturnDateText(7));
    setCell(sheet, 'S4', extra.benchmarkLink || '');

    if (shouldOmitToyProductSize(excelData)) {
      sheet.spliceColumns(9, 1);
      sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"盒装",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"袋装",""))' };
      sheet.getCell('F4').value = { formula: 'TEXT(VALUE(LEFT(E4,LEN(E4)-3))*(VALUE(LEFT(M4,LEN(M4)-1))/1000)+0.75,"0.00")&"KG"' };
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="G","净重",IF(RIGHT(L4,2)="ML","容量","规格"))' };
    } else if (shouldRemoveExcelPackageSizeColumn(excelData)) {
      sheet.spliceColumns(10, 1);
      sheet.getCell('F4').value = { formula: 'TEXT(VALUE(LEFT(E4,LEN(E4)-3))*(VALUE(LEFT(M4,LEN(M4)-1))/1000)+0.75,"0.00")&"KG"' };
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="G","净重",IF(RIGHT(L4,2)="ML","容量","规格"))' };
    }
    if (imageInfo) {
      const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
      sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer);
    const assets = message.transparentImageDataUrl
      ? await parameterImageFeature.generateBridgeAssets(imageData, String(message.transparentImageDataUrl))
      : { englishDataUrl: '', sizeDataUrl: '' };
    sendDesktopBridgeMessage({
      type: 'asset.bundle',
      jobId,
      sku,
      fileName: String(message.fileName || buildExcelFileName(excelData, extra)),
      excelBase64: bytesToBase64(bytes),
      skuImageDataUrl,
      englishDataUrl: assets.englishDataUrl,
      sizeDataUrl: assets.sizeDataUrl,
    });
    addLog('success', '桌面工作台资产已返回', sku + ' / Excel ' + bytes.length + ' bytes');
  }
  // </desktop-bridge-module>
  // <ui-loader-module>
  const UI_STYLE_ID = 'pfh-ui-styles';
  let uiFallbackNoticeTimer = 0;
  let uiAssetRecoveryBound = false;
  const LOCAL_UI_FALLBACK_CSS = `
    #${PANEL_ID} {
      position:fixed;right:18px;bottom:78px;z-index:2147483647;width:686px;height:min(906px,96vh);min-width:520px;min-height:520px;
      overflow:visible;border:1px solid #D8DEEA;border-radius:16px;background:#fff;box-shadow:0 22px 70px rgba(31,25,55,.20);
      color:#1F2937;font:13px/1.5 Arial,"Microsoft YaHei",sans-serif;
    }
    #${PANEL_ID},#${PANEL_ID} *{box-sizing:border-box}
    #${PANEL_ID}.is-collapsed{display:none!important}
    #${PANEL_ID} .pfh-full{position:relative;width:100%;height:100%;overflow:hidden;border-radius:inherit;background:#FAFAFC}
    html.pfh-ui-fallback #${PANEL_ID} .pfh-full>*{visibility:hidden!important;pointer-events:none!important}
    html.pfh-ui-fallback #${PANEL_ID} .pfh-full::before{
      content:"";position:absolute;inset:0;z-index:1;visibility:visible;border-radius:inherit;pointer-events:none;
      background:
        linear-gradient(#B9BDC6,#B9BDC6) 18px 17px/38px 38px no-repeat,
        linear-gradient(#E2E4EA,#E2E4EA) 68px 22px/118px 14px no-repeat,
        linear-gradient(#ECEEF3,#ECEEF3) 68px 42px/82px 9px no-repeat,
        linear-gradient(#F0EDF9,#F0EDF9) 212px 16px/calc(100% - 386px) 40px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 148px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 108px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 68px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 28px) 20px/20px 32px no-repeat,
        linear-gradient(#E5E8EF,#E5E8EF) 0 67px/100% 1px no-repeat,
        linear-gradient(#E9EBF1,#E9EBF1) 14px 86px/158px 38px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 134px/158px 66px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 210px/158px 66px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 286px/158px 66px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 362px/158px 66px no-repeat,
        linear-gradient(#E5E8EF,#E5E8EF) 185px 68px/1px calc(100% - 68px) no-repeat,
        linear-gradient(#E9EBF1,#E9EBF1) 204px 88px/calc(100% - 224px) 88px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 204px 190px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(50% + 97px) 190px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 204px 320px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(50% + 97px) 320px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 204px 450px/calc(100% - 224px) 94px no-repeat,
        #FAFAFC;
    }
    html.pfh-ui-fallback #${PANEL_ID}[data-view="home"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="about"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="ledger"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="upload"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="unitConverter"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="tools"] .pfh-full::before{
      background:
        linear-gradient(#B9BDC6,#B9BDC6) 18px 17px/38px 38px no-repeat,
        linear-gradient(#E2E4EA,#E2E4EA) 68px 22px/118px 14px no-repeat,
        linear-gradient(#ECEEF3,#ECEEF3) 68px 42px/82px 9px no-repeat,
        linear-gradient(#F0EDF9,#F0EDF9) 212px 16px/calc(100% - 386px) 40px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 148px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 108px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 68px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 28px) 20px/20px 32px no-repeat,
        linear-gradient(#E5E8EF,#E5E8EF) 0 67px/100% 1px no-repeat,
        linear-gradient(#E9EBF1,#E9EBF1) 20px 88px/calc(100% - 40px) 88px no-repeat,
        linear-gradient(#ECEEF3,#ECEEF3) 20px 190px/170px 58px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 20px 264px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(33.333% + 3px) 264px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(66.666% - 14px) 264px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 20px 402px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(33.333% + 3px) 402px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(66.666% - 14px) 402px/calc(33.333% - 27px) 126px no-repeat,
        #FAFAFC;
    }
    html.pfh-ui-fallback #${PANEL_ID} .pfh-full::after{
      content:"";position:absolute;inset:0;z-index:2;visibility:visible;pointer-events:none;
      background:linear-gradient(105deg,transparent 32%,rgba(255,255,255,.82) 46%,transparent 60%) 130% 0/240% 100% no-repeat;
      animation:pfh-ui-skeleton-sweep 1.45s ease-in-out infinite;
    }
    html.pfh-ui-offline #${PANEL_ID} .pfh-full::after{animation-duration:2.4s;opacity:.48}
    html.pfh-ui-fallback #${PANEL_ID}::after{
      content:"正在加载界面资源…";position:absolute;left:50%;bottom:18px;z-index:5;display:block;min-width:210px;padding:8px 13px;
      border:1px solid #DDD5F4;border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(52,38,95,.10);
      color:#6D35E8;font-size:11px;font-weight:700;text-align:center;transform:translateX(-50%);visibility:visible;
    }
    html.pfh-ui-waiting #${PANEL_ID}::after{content:"网络较慢，正在继续加载完整界面…"}
    html.pfh-ui-offline #${PANEL_ID}::after{content:"当前无网络，联网后会自动恢复完整界面";border-color:#F2D4A6;background:#FFFAEB;color:#B54708}
    #${LAUNCHER_ID}{position:fixed;z-index:2147483647;display:inline-flex;width:86px;height:34px;align-items:center;justify-content:center;border:1px solid #D8DEEA;border-radius:10px;background:#fff;box-shadow:0 8px 24px rgba(35,25,70,.14);color:#403657;cursor:pointer;font:600 13px/1 "Microsoft YaHei",sans-serif}
    @keyframes pfh-ui-skeleton-sweep{from{background-position:130% 0}to{background-position:-130% 0}}
    @media(max-width:620px){
      html.pfh-ui-fallback #${PANEL_ID} .pfh-full::before{
        background:
          linear-gradient(#B9BDC6,#B9BDC6) 16px 16px/36px 36px no-repeat,
          linear-gradient(#E2E4EA,#E2E4EA) 64px 22px/104px 14px no-repeat,
          linear-gradient(#F0EDF9,#F0EDF9) 184px 16px/calc(100% - 264px) 38px no-repeat,
          linear-gradient(#E5E8EF,#E5E8EF) 0 66px/100% 1px no-repeat,
          linear-gradient(#E9EBF1,#E9EBF1) 14px 84px/calc(100% - 28px) 82px no-repeat,
          linear-gradient(#F0F1F5,#F0F1F5) 14px 180px/calc(100% - 28px) 112px no-repeat,
          linear-gradient(#F0F1F5,#F0F1F5) 14px 304px/calc(100% - 28px) 112px no-repeat,
          linear-gradient(#F0F1F5,#F0F1F5) 14px 428px/calc(100% - 28px) 112px no-repeat,
          #FAFAFC;
      }
    }
    @media(prefers-reduced-motion:reduce){html.pfh-ui-fallback #${PANEL_ID} .pfh-full::after{animation:none;opacity:.38}}
  `;

  function getCloudUiStyleText() {
    return typeof getCachedCloudUiStyles === 'function' ? getCachedCloudUiStyles() : '';
  }

  function updateUiFallbackState(state) {
    const root = document.documentElement;
    root.classList.toggle('pfh-ui-fallback', state !== 'ready');
    root.classList.toggle('pfh-ui-waiting', state === 'waiting');
    root.classList.toggle('pfh-ui-offline', state === 'offline');
  }

  function scheduleUiFallbackNotice() {
    window.clearTimeout(uiFallbackNoticeTimer);
    if (navigator && navigator.onLine === false) {
      updateUiFallbackState('offline');
      return;
    }
    uiFallbackNoticeTimer = window.setTimeout(() => {
      if (document.documentElement.classList.contains('pfh-ui-fallback')) updateUiFallbackState('waiting');
    }, 4500);
  }

  function showUiOfflineFallback() {
    if (!document.documentElement.classList.contains('pfh-ui-fallback')) return;
    window.clearTimeout(uiFallbackNoticeTimer);
    updateUiFallbackState('offline');
  }

  function bindUiAssetRecovery() {
    if (uiAssetRecoveryBound) return;
    uiAssetRecoveryBound = true;
    window.addEventListener('offline', showUiOfflineFallback);
    window.addEventListener('online', () => {
      if (!document.documentElement.classList.contains('pfh-ui-fallback')) return;
      updateUiFallbackState('loading');
      scheduleUiFallbackNotice();
      refreshCloudAssets(true).catch(showUiOfflineFallback);
    });
  }

  function setUiStyleText(cssText, source) {
    const text = String(cssText || '');
    if (!text.trim()) return false;
    let style = document.getElementById(UI_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = UI_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== text) style.textContent = text;
    style.dataset.source = source || 'fallback';
    style.dataset.version = SCRIPT_VERSION;
    return true;
  }

  function applyCloudUiStyles(cssText) {
    const text = String(cssText || '');
    if (text.length < 10000 || !text.includes('#' + PANEL_ID)) return false;
    const legacy = document.getElementById('pfh-parameter-image-styles');
    if (legacy) legacy.remove();
    window.clearTimeout(uiFallbackNoticeTimer);
    updateUiFallbackState('ready');
    return setUiStyleText(text, 'cloud-cache');
  }

  function injectStyle() {
    bindUiAssetRecovery();
    const cached = getCloudUiStyleText();
    if (applyCloudUiStyles(cached)) return;
    setUiStyleText(LOCAL_UI_FALLBACK_CSS, 'local-placeholder');
    updateUiFallbackState(navigator && navigator.onLine === false ? 'offline' : 'loading');
    scheduleUiFallbackNotice();
  }
  // </ui-loader-module>
  const CM_TO_INCH = 1 / 2.54;
  const NORMAL_DELTA_CM = 0.2;
  const INNER_CARD_DELTA_CM = 0.5;
  const SCAN_INTERVAL_MS = 650;
  const MATERIAL_WATCH_ATTEMPTS = 4;




  const L = {
    title: '\u0050\u004c\u004d\u60ac\u6d6e\u52a9\u624b',
    mini: '\u0050\u004c\u004d',
    refresh: '\ud83d\udd04',
    about: '\u2699\ufe0f',
    openDetail: '\ud83d\udcc2',
    collapse: '\u6536\u8d77',
    close: '\u5173\u95ed',
    copyAll: '\u5168\u90e8\u590d\u5236',
    copy: '\u2702\ufe0f',
    copied: '\u5df2\u590d\u5236',
    copyHint: '\u70b9\u51fb\u590d\u5236',
    edit: '\u7f16\u8f91',
    ok: '\u786e\u5b9a',
    invalidCm: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684cm\u6570\u503c',
    search: '\u641c\u7d22',
    clearSearch: '\u6e05\u7a7a',
    searchPlaceholder: '\u641c\u7d22\u4ea7\u54c1\u540d/SKU/\u7269\u6599\u7f16\u7801',
    searchResult: '\u641c\u7d22\u7ed3\u679c',
    noSearchResult: '\u6ca1\u627e\u5230\u76f8\u5173\u4ea7\u54c1',
    pin: '\ud83d\udd1d',
    unpin: '\ud83d\udd1d',
    scanning: '\u6b63\u5728\u8bc6\u522b...',
    cached: '\u5df2\u8bfb\u53d6\u672c\u5730\u5b58\u50a8\uff0c\u5982\u9700\u91cd\u65b0\u8bc6\u522b\u8bf7\u70b9\u5237\u65b0',
    checkingMaterial: '\u5df2\u547d\u4e2d\u7f13\u5b58\uff0c\u6b63\u5728\u68c0\u67e5\u7269\u6599\u6e05\u5355\u5c3a\u5bf8...',
    noDrawer: '\u672a\u6253\u5f00\u9879\u76ee\u8be6\u60c5\uff0c\u53ef\u4ece\u5de6\u4fa7\u9009\u62e9\u5df2\u5b58\u50a8\u7f16\u7801\u67e5\u770b',
    scanDone: '\u672c\u8f6e\u8bc6\u522b\u5df2\u505c\u6b62',
    emptyList: '\u6682\u65e0\u5b58\u50a8\u8bb0\u5f55',
    fileSection: '\u6587\u4ef6\u89c4\u683c',
    graphicSection: '\u56fe\u5305\u4fe1\u606f',
    item: '\u9879\u76ee',
    size: '\u5c3a\u5bf8',
    action: '\u64cd\u4f5c',
    sku: '\u7f16\u7801',
    name: '\u4ea7\u54c1\u540d',
    brand: '\u54c1\u724c',
    packageSize: '\u7eb8\u76d2/\u5370\u5237\u888b\u5c3a\u5bf8',
    printSize: '\u6807\u7b7e/\u5370\u5237\u5c3a\u5bf8',
    packageCode: '\u7eb8\u76d2\u7f16\u7801',
    printCode: '\u6807\u7b7e/\u5370\u5237\u7f16\u7801',
    cartonLength: '\u7eb8\u76d2-\u957f',
    cartonWidth: '\u7eb8\u76d2-\u5bbd',
    cartonHeight: '\u7eb8\u76d2-\u9ad8',
    productLength: '\u4ea7\u54c1-\u957f',
    tailSealLength: '\u5c01\u5c3e\u957f\u5ea6',
    productWidth: '\u4ea7\u54c1-\u5bbd',
    productHeight: '\u4ea7\u54c1-\u9ad8',
    netContent: '\u51c0\u542b\u91cf',
    grossWeight: '\u6bdb\u91cd',
    materialTab: '\u7269\u6599\u6e05\u5355',
    productTab: '\u4ea7\u54c1\u4fe1\u606f',
    unknown: '\u672a\u8bc6\u522b',
    noPackage: '\u672a\u8bc6\u522b',
    noPrint: '\u672a\u8bc6\u522b',
    noDimension: '\u65e0\u53ef\u7528\u4e09\u7ef4\u5c3a\u5bf8',
    sourceMaterial: '\u6765\u6e90\uff1a\u7269\u6599\u6e05\u5355',
    sourceOuter: '\u6765\u6e90\uff1a\u4ea7\u54c1\u4fe1\u606f\u5916\u5305\u88c5',
    updatedAt: '\u66f4\u65b0',
    pluginName: '\u63d2\u4ef6\u540d',
    version: '\u5f53\u524d\u7248\u672c',
    cachedCount: '\u5df2\u5b58\u50a8\u7f16\u7801\u6570\u91cf',
    storageNote: '\u5b58\u50a8\u4f4d\u7f6e\u8bf4\u660e',
    storageNoteText: '\u6570\u636e\u5b58\u5728 Tampermonkey/Violentmonkey \u7684\u811a\u672c\u672c\u5730\u5b58\u50a8\u4e2d\uff0c\u6e05\u7406\u6269\u5c55\u6570\u636e\u6216\u5378\u8f7d\u811a\u672c\u53ef\u80fd\u4f1a\u4e22\u5931\u3002',
    excelKeywordSetting: '\u8868\u683c\u5173\u952e\u8bcd',
    excelKeywordBrandName: '\u54c1\u724c \u4ea7\u54c1\u540d',
    excelKeywordEnglish: '\u82f1\u6587\u540d',
    excelDownloadSetting: '\u56fe\u5305\u4e0b\u8f7d\u65b9\u5f0f',
    excelDownloadPicker: '\u5f39\u51fa\u9009\u9879\u6846',
    excelDownloadDirect: '\u76f4\u63a5\u4e0b\u8f7d',
    exportTypeExcel: '\u751f\u6210 Excel',
    exportTypeToyLabel: '\u73a9\u5177\u6807\u7b7e',
    labelGenerating: '\u6b63\u5728\u751f\u6210\u6807\u7b7e...',
    labelDone: '\u6807\u7b7e\u5df2\u751f\u6210',
    labelFailed: '\u751f\u6210\u6807\u7b7e\u5931\u8d25',
    labelNeedBarcode: '\u672a\u627e\u5230 PLM \u6761\u7801\u6587\u4ef6\uff0c\u5df2\u6539\u7528 SKU \u751f\u6210\u6761\u7801',
    easterEgg: '\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14\ud83d\udc14',
    exportCache: '\u5bfc\u51fa\u7f13\u5b58',
    importCache: '\u5bfc\u5165\u7f13\u5b58',
    importDone: '\u7f13\u5b58\u5df2\u5bfc\u5165',
    importFailed: '\u5bfc\u5165\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u6587\u4ef6',
    cloudBackupTitle: '\u4e91\u5907\u4efd',
    cloudBackupKey: '\u5907\u4efd\u5bc6\u94a5',
    cloudBackupPlaceholder: '\u8f93\u5165\u81ea\u5df1\u7684\u5907\u4efd\u5bc6\u94a5',
    cloudBackupSave: '\u4e0a\u4f20\u5907\u4efd',
    cloudBackupRestore: '\u6062\u590d\u5907\u4efd',
    cloudBackupSaving: '\u6b63\u5728\u4e0a\u4f20\u4e91\u5907\u4efd...',
    cloudBackupSaved: '\u4e91\u5907\u4efd\u5df2\u4e0a\u4f20',
    cloudBackupReady: '\u672a\u8fde\u63a5',
    cloudBackupSavedAt: '\u5df2\u4e0a\u4f20',
    cloudBackupRestoring: '\u6b63\u5728\u6062\u590d\u4e91\u5907\u4efd...',
    cloudBackupRestored: '\u4e91\u5907\u4efd\u5df2\u6062\u590d',
    cloudBackupMissingKey: '\u8bf7\u5148\u586b\u5199\u5907\u4efd\u5bc6\u94a5',
    cloudBackupKeyTooShort: '\u5907\u4efd\u5bc6\u94a5\u81f3\u5c11 4 \u4f4d',
    cloudBackupOwnerMissing: '\u672a\u8bfb\u53d6\u5230\u5f53\u524d PLM \u59d3\u540d\uff0c\u5df2\u53d6\u6d88\u4e0a\u4f20',
    cloudBackupNotFound: '\u672a\u627e\u5230\u8fd9\u4e2a\u5bc6\u94a5\u7684\u4e91\u5907\u4efd',
    cloudBackupFailed: '\u4e91\u5907\u4efd\u5931\u8d25',
    cloudBackupHint: '\u586b\u5199\u540e\u4f1a\u4fdd\u5b58\u5728\u672c\u5730 PLM \u811a\u672c\u91cc\uff0c\u6bcf\u6b21\u65b0\u589e/\u66f4\u65b0\u7f16\u7801\u540e\u81ea\u52a8\u5907\u4efd\u4e00\u6b21\u3002',
    excel: '\u5bfc\u51fa',
    excelPackQty: '\u88c5\u7bb1\u6570',
    excelPurchasePrice: '\u4ef7\u683c',
    excelGenerating: '\u6b63\u5728\u751f\u6210 Excel...',
    excelImageLoading: '\u6b63\u5728\u4e0b\u8f7d\u4ea7\u54c1\u56fe...',
    excelPacking: '\u6b63\u5728\u63d2\u5165\u4ea7\u54c1\u56fe...',
    excelDownloading: '\u6b63\u5728\u4fdd\u5b58\u6587\u4ef6...',
    excelRefresh: '\u91cd\u65b0\u83b7\u53d6',
    excelPreparing: '\u6b63\u5728\u83b7\u53d6\u8868\u683c\u4fe1\u606f...',
    excelReady: '\ud83d\udfe2 \u8868\u683c\u4fe1\u606f\u5df2\u5b8c\u6574',
    excelPackRecommended: '\u5df2\u586b\u5165\u63a8\u8350\u88c5\u7bb1\u6570',
    excelMissing: '\ud83d\udd34 \u7f3a\u5931\uff1a',
    excelIncomplete: '\ud83d\udd34 \u4fe1\u606f\u4e0d\u5b8c\u6574',
    excelDone: '\u5df2\u751f\u6210 Excel',
    excelFailed: '\u751f\u6210 Excel \u5931\u8d25',
    excelSaveCanceled: '\u5df2\u53d6\u6d88\u4fdd\u5b58',
    excelSavePickerUnavailable: '\u6d4f\u89c8\u5668\u53e6\u5b58\u4e3a\u63a5\u53e3\u4e0d\u53ef\u7528\uff0c\u5df2\u6539\u7528\u666e\u901a\u4e0b\u8f7d',
    excelNeedData: '\u8bf7\u5148\u9009\u4e2d\u4e00\u4e2a\u5df2\u8bc6\u522b\u7684\u4ea7\u54c1',
    excelNeedLibrary: '\u0045\u0078\u0063\u0065\u006c\u004a\u0053 \u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u811a\u672c\u6743\u9650',
    openingDetail: '\u6b63\u5728\u6253\u5f00\u8be6\u60c5...',
    openDetailDone: '\u5df2\u6253\u5f00\u8be6\u60c5',
    openDetailFailed: '\u672a\u627e\u5230\u5bf9\u5e94\u8be6\u60c5',
    uploadSection: '\u63d0\u5ba1\u4e0a\u4f20',
    uploadIcon: '\ud83d\udce4',
    uploadToggle: '\u4e0a\u4f20',
    uploadXlsx: 'XLSX',
    uploadZip: 'ZIP',
    uploadDropHint: '\u628a xlsx/zip/rar \u62d6\u5230\u8fd9\u91cc\uff0c\u6216\u60ac\u505c\u540e Ctrl+V \u7c98\u8d34\u6587\u4ef6',
    uploadStartQueue: '\u5f00\u59cb\u961f\u5217',
    uploadPauseQueue: '\u6682\u505c',
    uploadWorker: '\u4e13\u7528\u4e0a\u4f20\u9875',
    uploadQueueEmpty: '\u961f\u5217\u6682\u7a7a',
    uploadHistoryEmpty: '\u6682\u65e0\u4e0a\u4f20\u5386\u53f2',
    uploadHistory: '\u5386\u53f2\u8bb0\u5f55',
    uploadQueueView: '\u8fd4\u56de\u961f\u5217',
    uploadClearList: '\u6e05\u7a7a\u5217\u8868',
    uploadSelectedRetry: '\u91cd\u8bd5\u9009\u4e2d',
    uploadSelectedDelete: '\u5220\u9664\u9009\u4e2d',
    uploadClearConfirm: '\u786e\u5b9a\u8981\u6e05\u7a7a\u5f53\u524d\u5217\u8868\u5417\uff1f',
    uploadCompletedAt: '\u5b8c\u6210\u65f6\u95f4',
    uploadNoSkuInFile: '\u6587\u4ef6\u540d\u91cc\u6ca1\u627e\u5230 SKU',
    uploadQueued: '\u5df2\u52a0\u5165\u4e0a\u4f20\u961f\u5217',
    uploadQueueStarted: '\u961f\u5217\u5df2\u5f00\u59cb',
    uploadQueuePaused: '\u961f\u5217\u5df2\u6682\u505c',
    uploadRetry: '\u91cd\u8bd5',
    uploadDelete: '\u5220\u9664',
    uploadSuccess: '\u63d0\u5ba1\u6210\u529f',
    uploadDraftSaved: '\u5df2\u4fdd\u5b58\u8349\u7a3f',
    uploadExistingContent: '\u5df2\u6709\u5185\u5bb9',
    uploadFailed: '\u4e0a\u4f20\u5931\u8d25',
    uploadFileTooLarge: '\u56fe\u5305\u8d85\u8fc7 100MB\uff0c\u5df2\u8df3\u8fc7',
    backgroundAutomationTitle: '\u540e\u53f0\u81ea\u52a8\u5316\u63d0\u793a',
    backgroundAutomationText: '\u5982\u9700\u8ba9\u6d4f\u89c8\u5668\u5728\u540e\u53f0\u7a33\u5b9a\u6267\u884c\u6279\u91cf\u4e0a\u4f20\uff0c\u5efa\u8bae\u5728 Chrome \u5feb\u6377\u65b9\u5f0f\u7684\u76ee\u6807\u8def\u5f84\u672b\u5c3e\u8ffd\u52a0\u542f\u52a8\u53c2\u6570\uff1a --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-gpu-sandbox --no-sandbox\u3002\u4fee\u6539\u540e\u9700\u5b8c\u5168\u9000\u51fa\u5e76\u91cd\u65b0\u542f\u52a8 Chrome \u624d\u4f1a\u751f\u6548\u3002',
    panelPin: '\u5173\u95ed',
    settingsTitle: '\u8bbe\u7f6e',
    logTitle: '\u8fd0\u884c\u65e5\u5fd7',
    logCopy: '\u590d\u5236\u65e5\u5fd7',
    logClear: '\u6e05\u7a7a\u65e5\u5fd7',
    logEmpty: '\u6682\u65e0\u65e5\u5fd7',
    insightsTitle: '\u6570\u636e\u6d1e\u5bdf',
    insightsExport: '\u5bfc\u51fa\u6d1e\u5bdf',
    insightsClear: '\u6e05\u7a7a\u6d1e\u5bdf',
    insightsEmpty: '\u6682\u65e0\u6570\u636e',
    insightsCloudSummary: '\u4e91\u7aef\u6458\u8981',
    insightsCopyReport: '\u590d\u5236\u603b\u7ed3',
    insightsCopyAi: '\u590d\u5236 AI \u6574\u7406',
    insightsCopyRules: '\u590d\u5236\u6e05\u6d17\u89c4\u5219',
    insightsCheckAi: '\u68c0\u67e5 AI',
    insightsAiModel: 'AI \u6a21\u578b',
    loadingTipsManage: '\u7ef4\u62a4\u5c0f\u63d0\u793a',
  };
  const DEFAULT_LOADING_TIPS = [
    '\u591a\u4e2a\u7f16\u7801\u53ef\u4ee5\u4e00\u884c\u4e00\u4e2a\u7c98\u8fdb\u641c\u7d22\u6846\uff0c\u811a\u672c\u4f1a\u81ea\u52a8\u62c6\u5f00\u3002',
    '\u53cc\u51fb\u7d2b\u8272 SKU \u80fd\u5feb\u901f\u590d\u5236\u7f16\u7801\uff0c\u6838\u5bf9\u6587\u4ef6\u540d\u65f6\u6700\u7701\u624b\u3002',
    '\u53f3\u4e0b\u89d2\u5237\u65b0\u4f1a\u91cd\u65b0\u8bfb\u53d6\u8be6\u60c5\uff0c\u9002\u5408\u9875\u9762\u521a\u52a0\u8f7d\u5b8c\u7684\u4ea7\u54c1\u3002',
    '\u76f8\u540c\u7eb8\u76d2\u5c3a\u5bf8\u586b\u8fc7\u88c5\u7bb1\u6570\uff0c\u4e0b\u6b21\u751f\u6210 Excel \u4f1a\u81ea\u52a8\u63a8\u8350\u3002',
    '\u91c7\u8d2d\u4fe1\u606f\u4e3a\u7a7a\u65f6\uff0c\u961f\u5217\u4f1a\u5148\u4fdd\u5b58\u8349\u7a3f\u518d\u7ee7\u7eed\uff0c\u4e0d\u8981\u624b\u52a8\u6253\u65ad\u3002',
    '\u8bbe\u7f6e\u91cc\u7684\u8fd0\u884c\u65e5\u5fd7\u80fd\u770b\u51fa\u5361\u5728\u54ea\u4e00\u6b65\uff0c\u6bd4\u53ea\u770b\u5f39\u7a97\u66f4\u51c6\u3002',
    '\u73a9\u5177\u6807\u7b7e\u4f1a\u56fa\u5b9a\u751f\u6210 4x3cm \u5370\u5237\u56fe\uff0c\u4e0d\u8ddf\u968f\u666e\u901a\u5370\u5237\u5c3a\u5bf8\u8dd1\u3002',
    '\u6709\u65e7\u5185\u5bb9\u7684\u63d0\u5ba1\u9879\u5148\u6807\u8bb0\u4e3a\u5df2\u6709\u5185\u5bb9\uff0c\u52fe\u9009\u91cd\u8bd5\u65f6\u624d\u4f1a\u6e05\u7406\u91cd\u4f20\u3002',
  ];
  const TOOLTIP = {
    about: '\u5173\u4e8e',
    openDetail: '\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u9879\u76ee\u8be6\u60c5',
    refresh: '\u5237\u65b0',
    copy: '\u590d\u5236',
    pin: '\u7f6e\u9876',
    unpin: '\u53d6\u6d88\u7f6e\u9876',
    panelPin: '\u5173\u95ed\u60ac\u6d6e\u7a97',
    collapse: '\u5173\u95ed',
    search: '\u641c\u7d22',
    excel: '\u5bfc\u51fa',
  };

  const firstTutorial = !loadTutorialSeen();
  const initialNotificationCache = loadNotificationCache();
  const state = {
    drawer: null,
    sku: '',
    selectedSku: '',
    data: null,
    index: loadIndex(),
    expanded: false,
    scanTimer: 0,
    scanRunning: false,
    scanTargetSku: '',
    scanData: null,
    observedDrawer: null,
    observedSku: '',
    observedTab: '',
    manualCollectTimer: 0,
    diagnosticRunning: false,
    drawerTabFlowTimer: 0,
    drawerTabFlowToken: 0,
    drawerTabFlowRunning: false,
    drawerTabFlowSku: '',
    drawerTabFlowDrawer: null,
    drawerTabFlowUserInterrupted: false,
    toastTimer: 0,
    materialWatchTimer: 0,
    materialWatchAttempts: 0,
    ignoreOutsideClickUntil: 0,
    splitWidth: loadSplitWidth(),
    panelSize: loadPanelSize(),
    developerSettingsTapCount: 0,
    developerSettingsTapAt: 0,
    developerInsightsUnlocked: false,
    developerToolsOpen: false,
    tutorialModalOpen: firstTutorial,
    tutorialEmptyKeyClickCount: 0,
    settingsReturnView: '',
    detailReturnScroll: null,
    searchQuery: '',
    view: firstTutorial ? 'home' : 'home',
    settings: loadSettings(),
    excelPanelOpen: false,
    excelExtra: null,
    excelMissing: [],
    excelStatus: '',
    excelPackQty: '',
    excelPurchasePrice: '6',
    insightRecommendationSku: '',
    insightRecommendationLoading: false,
    insightRecommendation: null,
    exportType: 'excel',
    exportMenuOpen: false,
    skuSortMenuOpen: false,
    skuContextMenuSku: '',
    copywritingMode: false,
    copywritingView: 'file',
    skuEditMode: false,
    copywritingLoading: false,
    copywritingError: '',
    copywritingStatus: '',
    toyCopywritingBusy: false,
    toyCopywritingError: '',
    toyCopywritingErrorSku: '',
    toyCopywritingErrorKind: '',
    openingProjectDetail: false,
    openingProjectDetailSku: '',
    uploadExpanded: false,
    uploadReturnView: '',
    uploadQueue: loadUploadQueue(),
    uploadHistory: loadUploadHistory(),
    uploadRunning: loadUploadWorkerRunning(),
    uploadProcessing: false,
    uploadView: 'queue',
    uploadMode: 'standard',
    copyrightSkuInput: '',
    copyrightPendingFiles: [],
    toyLabelSkuInput: '',
    toyLabelBatchFiles: [],
    toyLabelBatchPreparedSignature: '',
    toyLabelBatchRows: {},
    projectListPrefetchTimer: 0,
    projectListPrefetchSignature: '',
    uploadGuideOpen: false,
    uploadClearConfirmOpen: false,
    uploadPage: 1,
    uploadHistoryPage: 1,
    uploadSelectedIds: [],
    ledgerRecords: loadDailyLedger(),
    ledgerTrashRecords: loadDailyLedgerTrash(),
    ledgerDate: getTodayKey(),
    ledgerView: 'design',
    ledgerTimeEditor: null,
    ledgerSelectedKeys: [],
    ledgerMenuSku: '',
    ledgerMenuDate: '',
    ledgerFullscreen: false,
    ledgerGroupHighlightTimer: 0,
    ledgerFlowTransitionSku: '',
    ledgerFlowTransitionTimer: 0,
    ledgerTabTransition: '',
    ledgerTabTransitionTimer: 0,
    manuallyCollapsedForSku: '',
    userCollapsedPanel: false,
    launcherClickAt: 0,
    launcherSuppressClickUntil: 0,
    ingredientHydratingSkus: new Set(),
    ingredientHydrateFailedAt: {},
    copywritingHydratingSkus: new Set(),
    copywritingHydrateFailedAt: {},
    skuResultGeneration: {},
    skuPage: 1,
    sizeImageSessions: {},
    sizeImageBusySku: '',
    sizeImageAccessName: '',
    sizeImageAccessEnabled: false,
    sizeImageAccessLoading: true,
    sizeImageAccessTimer: 0,
    cmConverterInput: '',
    codeFormatterInput: '',
    cloudBackupRunning: false,
    cloudBackupQueued: false,
    cloudBackupStatus: '',
    classificationRules: [],
    packAiEstimatingKeys: new Set(),
    packAiFailedAt: {},
    logs: loadLogs(),
    logSyncDedup: {},
    insights: loadInsights(),
    insightCloudStatus: '',
    insightCloudReport: '',
    insightReadiness: null,
    maintainedCleaningRules: [],
    maintainedCleaningRulesLoaded: false,
    loadingTips: DEFAULT_LOADING_TIPS.slice(),
    loadingTipsLoaded: false,
    loadingTipText: '',
    loadingTipSeed: '',
    loadingTipId: '',
    userHeartbeatTimer: 0,
    notifications: initialNotificationCache.items,
    notificationPendingReadIds: initialNotificationCache.pendingReadIds,
    notificationCheckedAt: initialNotificationCache.checkedAt,
    notificationsLoading: false,
    notificationsError: '',
    notificationModalOpen: false,
    notificationTab: 'new',
    notificationRefreshTimer: 0,
  };
  const parameterImageFeature = createParameterImageFeature({
    panelId: PANEL_ID,
    escapeHtml,
    formatNumber: formatSizeImageNumber,
    productType: (data) => getProductTypeForInsight(data, null),
    cloudRequest,
    collectExtra: collectExcelExtraData,
    getSaveFilePicker,
    showToast,
    render: () => { if (state.view === 'parameterImage') renderShell(); },
  });
  state.expanded = firstTutorial;

  if (isWestmonthLoginPage()) {
    autoClickWestmonthLogin();
    return;
  }

  injectStyle();
  ensurePanel();
  document.addEventListener('paste', handleSizeImageHoverPaste, true);
  document.addEventListener('click', handleUserDrawerTabClick, true);
  ensureLauncher();
  renderShell(L.noDrawer);
  refreshLoadingTips(false);
  scheduleCloudAssetRefresh(50);
  scheduleSizeImageAccessRefresh(300);
  scheduleUserHeartbeat(800);
  scheduleNotificationRefresh(1600);
  window.addEventListener('resize', () => positionLauncher(document.getElementById(LAUNCHER_ID)));
  startDrawerWatcher();
  startDailyLedgerSync();
  startDesktopBridge();
  startUploadQueueSync();
  handleDrawerState();
  scheduleProjectListPrefetch();
  if (shouldStartUploadWorkerOnLoad()) {
    window.setTimeout(() => processUploadQueue(), 1200);
  }

  function startDrawerWatcher() {
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        handleDrawerState();
        observeManualTabRead();
        scheduleProjectListPrefetch();
        positionLauncher(document.getElementById(LAUNCHER_ID));
      }, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function handleUserDrawerTabClick(event) {
    if (!event || !event.isTrusted || !(event.target instanceof Element)) return;
    const detailButton = event.target.closest('button, a, [role="button"]');
    const projectRow = detailButton && detailButton.closest('tr');
    if (
      detailButton && projectRow &&
      !detailButton.closest('#' + PANEL_ID + ', .ant-drawer-open, .ant-drawer') &&
      /\/projectManagementChemicalNew/.test(location.pathname) &&
      compactText(detailButton.innerText || detailButton.textContent) === '\u8be6\u60c5'
    ) {
      const sku = findProjectSkuForActionRow(projectRow);
      if (sku) showProjectDetailOpeningFeedback(sku, loadData(sku) || { sku });
      return;
    }
    const tab = event.target.closest('[role="tab"], .ant-tabs-tab');
    if (!tab) return;
    const drawer = tab.closest('.ant-drawer-open, .ant-drawer');
    if (!drawer || drawer !== getProjectDrawer()) return;
    if (state.scanRunning) {
      const partial = state.scanData && state.scanData.sku ? state.scanData : null;
      stopScan();
      if (partial) {
        saveData(partial.sku, partial);
        if (state.selectedSku === partial.sku) state.data = normalizeData(loadData(partial.sku) || partial);
      }
    }
    if (state.drawerTabFlowRunning || state.drawerTabFlowTimer) {
      state.drawerTabFlowUserInterrupted = true;
      cancelDrawerTabFlow({ preserveUserInterrupted: true });
    }
    const sku = getProjectDrawerHeaderSku(drawer);
    const tabName = compactText(tab.innerText || tab.textContent || '');
    if (sku && tabName) {
      state.observedDrawer = drawer;
      state.observedSku = sku;
      state.observedTab = tabName;
      stopManualTabRead();
      state.manualCollectTimer = window.setTimeout(() => readCurrentManualTab(drawer, sku, tabName), 420);
    }
  }

  function findProjectSkuForActionRow(row) {
    if (!row) return '';
    const directSku = findSku(getVisibleText(row));
    if (directSku) return directSku;
    const rowId = row.getAttribute('rowid');
    if (!rowId) return '';
    const linkedRow = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"]'))
      .find((candidate) => candidate !== row && findSku(getVisibleText(candidate)));
    return linkedRow ? findSku(getVisibleText(linkedRow)) : '';
  }

  function showProjectDetailOpeningFeedback(sku, data) {
    if (!sku) return;
    state.openingProjectDetail = true;
    state.openingProjectDetailSku = sku;
    state.view = 'detail';
    state.selectedSku = sku;
    state.data = normalizeData(data || { sku });
    resetExcelState();
    lockLoadingTip(sku);
    expandPanel();
    renderShell(L.openingDetail);
    window.setTimeout(() => {
      if (!state.openingProjectDetail || state.openingProjectDetailSku !== sku) return;
      state.openingProjectDetail = false;
      state.openingProjectDetailSku = '';
      renderShell();
    }, 7000);
  }

  function cancelDrawerTabFlow(options) {
    const preserveUserInterrupted = Boolean(options && options.preserveUserInterrupted);
    if (state.drawerTabFlowTimer) window.clearTimeout(state.drawerTabFlowTimer);
    state.drawerTabFlowTimer = 0;
    state.drawerTabFlowToken += 1;
    state.drawerTabFlowRunning = false;
    state.drawerTabFlowSku = '';
    state.drawerTabFlowDrawer = null;
    if (!preserveUserInterrupted) state.drawerTabFlowUserInterrupted = false;
  }

  function beginForegroundDrawerTabFlow(sku, drawer) {
    cancelDrawerTabFlow();
    const token = state.drawerTabFlowToken + 1;
    state.drawerTabFlowToken = token;
    state.drawerTabFlowRunning = true;
    state.drawerTabFlowSku = String(sku || '');
    state.drawerTabFlowDrawer = drawer || null;
    state.drawerTabFlowUserInterrupted = false;
    return token;
  }

  function finishForegroundDrawerTabFlow(token) {
    if (state.drawerTabFlowToken !== token) return;
    state.drawerTabFlowRunning = false;
    state.drawerTabFlowSku = '';
    state.drawerTabFlowDrawer = null;
  }

  function scheduleProjectListPrefetch() {
    if (!state.settings.collectionEnabled || !/\/projectManagementChemicalNew/.test(location.pathname)) return;
    window.clearTimeout(state.projectListPrefetchTimer);
    state.projectListPrefetchTimer = window.setTimeout(prefetchProjectAllListData, 360);
  }

  function prefetchProjectAllListData() {
    state.projectListPrefetchTimer = 0;
    if (!state.settings.collectionEnabled || getActiveProjectWorkflowTabText() !== '\u5168\u90e8') return;
    const rows = collectProjectAllListRows();
    if (!rows.length) return;
    const signature = JSON.stringify(rows);
    if (signature === state.projectListPrefetchSignature) return;
    state.projectListPrefetchSignature = signature;
    let changedCount = 0;
    let ledgerChangedCount = 0;
    let ledgerEligibleCount = 0;
    syncDailyLedgerBeforeMutation();
    rows.forEach((row) => {
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const benchmarkImageUrl = stripOssResizeParams(row.benchmarkImageUrl || '');
      const productListImageUrl = stripOssResizeParams(row.productListImageUrl || '');
      const preserveEffectImage = previous.skuImageSource === 'effectImage' && Boolean(previous.skuImageUrl || previous.skuImageFallbackUrl);
      const useProductListAsSkuImage = row.projectStatus === '\u5df2\u5b8c\u6210' && Boolean(productListImageUrl || row.productListImageUrl) && !preserveEffectImage;
      const candidate = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: row.name || previous.name || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        developerName: row.developerName || previous.developerName || '',
        developerText: row.developerText || previous.developerText || '',
        benchmarkImageUrl: benchmarkImageUrl || previous.benchmarkImageUrl || '',
        benchmarkImageFallbackUrl: row.benchmarkImageUrl || previous.benchmarkImageFallbackUrl || benchmarkImageUrl || '',
        referenceUrl: row.referenceUrl || previous.referenceUrl || '',
        developmentAdvice: row.developmentAdvice || previous.developmentAdvice || '',
        artPriority: row.artPriority || previous.artPriority || '',
        projectStatus: row.projectStatus || previous.projectStatus || '',
        designType: row.designType || previous.designType || '',
        specificationText: row.specificationText || previous.specificationText || '',
        productListImageUrl: productListImageUrl || previous.productListImageUrl || '',
        productListImageFallbackUrl: row.productListImageUrl || previous.productListImageFallbackUrl || productListImageUrl || '',
        designAssignedAt: row.designAssignedAt || previous.designAssignedAt || '',
        projectCreatedAt: row.projectCreatedAt || previous.projectCreatedAt || '',
        departmentName: row.departmentName || previous.departmentName || '',
        projectOwnerName: row.projectOwnerName || previous.projectOwnerName || '',
        promotionStatus: row.promotionStatus || previous.promotionStatus || '',
        listingStatus: row.listingStatus || previous.listingStatus || '',
        bomStatus: row.bomStatus || previous.bomStatus || '',
        requiresPlanStock: row.requiresPlanStock || previous.requiresPlanStock || '',
        bomAuditStatus: row.bomAuditStatus || previous.bomAuditStatus || '',
        plmCategory: row.plmCategory || previous.plmCategory || '',
        skuImageUrl: useProductListAsSkuImage ? (productListImageUrl || row.productListImageUrl) : (previous.skuImageUrl || ''),
        skuImageFallbackUrl: useProductListAsSkuImage ? (row.productListImageUrl || productListImageUrl) : (previous.skuImageFallbackUrl || ''),
        skuImageSource: useProductListAsSkuImage ? 'productListImage' : (previous.skuImageSource || ''),
        listPrefetchSource: 'project-all',
      });
      const assignedDate = parseLedgerDateFromText(row.designAssignedAt);
      if (assignedDate) {
        ledgerEligibleCount += 1;
        const assignedMonth = getMonthKeyFromDateKey(assignedDate);
        const existingLedger = (state.ledgerRecords || []).find((item) => item.sku === row.sku && getMonthKeyFromDateKey(item.date) === assignedMonth);
        const syncedLedger = upsertDailyLedgerFromData(candidate, {
          deferSave: true,
          skipStorageSync: true,
          skipUnchanged: true,
          note: existingLedger ? undefined : '\u6574\u9875\u5217\u8868\u81ea\u52a8\u52a0\u5165',
        });
        if (syncedLedger && syncedLedger !== existingLedger) ledgerChangedCount += 1;
      }
      if (!hasMeaningfulDataChange(previous, candidate)) return;
      const saved = normalizeData({
        ...candidate,
        listPrefetchedAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
        updatedAtMs: Date.now(),
      });
      saveDataDirect(row.sku, saved);
      upsertIndex(saved);
      if (state.data && state.data.sku === row.sku) state.data = saved;
      changedCount += 1;
    });
    if (ledgerChangedCount) {
      saveDailyLedger();
      addLog('info', '\u6574\u9875\u8bbe\u8ba1\u5206\u914d\u4efb\u52a1\u5df2\u540c\u6b65\u5230\u4eca\u65e5\u5de5\u4f5c\u53f0', ledgerChangedCount + '/' + ledgerEligibleCount + '\u4e2a\u7f16\u7801');
    }
    if (!changedCount && !ledgerChangedCount) return;
    if (changedCount) {
      queueCloudBackup();
      addLog('info', '\u65b0\u54c1\u5f00\u53d1\u5217\u8868\u57fa\u7840\u4fe1\u606f\u5df2\u9759\u9ed8\u7f13\u5b58', changedCount + '/' + rows.length + '\u4e2a\u7f16\u7801');
    }
    if (state.view === 'home' || state.view === 'detail' || state.view === 'ledger') renderShell();
  }

  function collectProjectAllListRows() {
    const headerCells = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => {
        const names = cells.map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
        return names.includes('\u5546\u54c1\u7f16\u7801') && names.includes('\u9879\u76ee\u72b6\u6001') && names.includes('BOM\u72b6\u6001');
      }) || [];
    if (!headerCells.length) return [];
    const headers = headerCells.map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
    const indexOf = (name) => headers.indexOf(name);
    const skuIndex = indexOf('\u5546\u54c1\u7f16\u7801');
    const imageIndex = indexOf('\u5546\u54c1\u56fe\u7247');
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body || skuIndex < 0) return [];
    const textAt = (cells, name) => {
      const index = indexOf(name);
      return index >= 0 && cells[index] ? cleanProjectListCell(cells[index].innerText || cells[index].textContent) : '';
    };
    const imageAt = (cells, name) => {
      const index = indexOf(name);
      const cell = index >= 0 ? cells[index] : null;
      if (!cell) return '';
      const image = cell.querySelector('img');
      const candidates = image ? [
        image.getAttribute('data-src'),
        image.getAttribute('data-original'),
        image.getAttribute('data-url'),
        image.currentSrc,
        image.src,
        image.getAttribute('src'),
      ] : [];
      const link = cell.querySelector('a[href]');
      if (link) candidates.push(link.href || link.getAttribute('href'));
      return candidates.map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
    };
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const developerText = textAt(cells, '\u5f00\u53d1\u4eba\u5458');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        developerText,
        developerName: (developerText.match(/^[\u4e00-\u9fa5A-Za-z ._-]+?(?=\s+(?:\u5f00\u53d1|\u4e3b\u7ba1|\u7ecf\u7406|\u4e13\u5458)|\s*\||$)/) || [])[0] || '',
        brand: textAt(cells, '\u54c1\u724c'),
        name: textAt(cells, '\u5546\u54c1\u540d\u79f0'),
        benchmarkImageUrl: imageAt(cells, '\u5bf9\u6807\u56fe\u7247'),
        referenceUrl: textAt(cells, '\u5bf9\u6807\u4ea7\u54c1\u94fe\u63a5'),
        developmentAdvice: textAt(cells, '\u5f00\u53d1\u5efa\u8bae'),
        artPriority: textAt(cells, '\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7'),
        projectStatus: textAt(cells, '\u9879\u76ee\u72b6\u6001'),
        designType: textAt(cells, '\u8bbe\u8ba1\u7c7b\u578b'),
        specificationText: textAt(cells, '\u89c4\u683c\u578b\u53f7'),
        productListImageUrl: imageAt(cells, '\u5546\u54c1\u56fe\u7247'),
        designAssignedAt: textAt(cells, '\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4'),
        projectCreatedAt: textAt(cells, '\u521b\u5efa\u65f6\u95f4'),
        departmentName: textAt(cells, '\u6240\u5728\u90e8\u95e8'),
        projectOwnerName: textAt(cells, '\u7528\u6237\u540d\u79f0'),
        promotionStatus: textAt(cells, '\u63a8\u5e7f\u72b6\u6001'),
        listingStatus: textAt(cells, '\u4e0a\u67b6\u72b6\u6001'),
        bomStatus: textAt(cells, 'BOM\u72b6\u6001'),
        requiresPlanStock: textAt(cells, '\u662f\u5426\u8981\u6c42\u8ba1\u5212\u5907\u8d27'),
        bomAuditStatus: textAt(cells, '\u5ba1\u6838Bom\u72b6\u6001'),
        plmCategory: textAt(cells, '\u54c1\u7c7b'),
      };
    }).filter((row) => row.sku && row.rowId);
  }

  function normalizeProjectListHeader(value) {
    return compactText(value).replace(/^\*\s*/, '').replace(/[\ue000-\uf8ff]/g, '').trim();
  }

  function cleanProjectListCell(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function isWestmonthLoginPage() {
    return /auth\.westmonth\.com\/auth\/login/.test(location.href);
  }

  function autoClickWestmonthLogin() {
    const tryClick = () => {
      const inputs = Array.from(document.querySelectorAll('input')).filter(isVisibleElement);
      const account = inputs.find((input) => /工号|手机号|邮箱|账号|用户名/i.test(input.placeholder || '') || input.type === 'text');
      const password = inputs.find((input) => input.type === 'password' || /密码/i.test(input.placeholder || ''));
      if (!account || !password || !account.value || !password.value) return false;
      const button = findWestmonthLoginButton();
      if (!button || !isActionButtonReady(button)) return false;
      button.click();
      return true;
    };
    if (tryClick()) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (tryClick() || Date.now() - startedAt > 15000) window.clearInterval(timer);
    }, 500);
  }

  function findWestmonthLoginButton() {
    return Array.from(document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const text = compactText(el.innerText || el.textContent || el.value).replace(/\s+/g, '');
        return text === '\u767b\u5f55' || /^log\s*in$/i.test(text);
      }) || null;
  }

  function startUploadQueueSync() {
    let refreshTimer = 0;
    const refresh = () => {
      state.uploadQueue = loadUploadQueue();
      state.uploadHistory = loadUploadHistory();
      state.uploadRunning = loadUploadWorkerRunning();
      if (state.view === 'upload' || state.uploadExpanded) renderShell();
    };
    const scheduleRefresh = (resetHistoryPage) => {
      if (resetHistoryPage && state.uploadView === 'history') state.uploadHistoryPage = 1;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh, 0);
    };
    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(UPLOAD_QUEUE_KEY, (_name, _oldValue, _newValue, remote) => {
        if (!remote && isUploadWorkerPage()) return;
        scheduleRefresh(false);
      });
      GM_addValueChangeListener(UPLOAD_HISTORY_KEY, () => {
        scheduleRefresh(true);
      });
      GM_addValueChangeListener(UPLOAD_WORKER_KEY, () => scheduleRefresh(false));
    }
    window.addEventListener('storage', (event) => {
      if (event.key === UPLOAD_QUEUE_KEY || event.key === UPLOAD_HISTORY_KEY || event.key === UPLOAD_WORKER_KEY) refresh();
    });
    window.setInterval(refresh, 5000);
  }

  function handleDrawerState() {
    const lockedSku = state.openingProjectDetailSku || '';
    const drawer = getProjectDrawer();
    if (!drawer) {
      if (lockedSku) return;
      scheduleDrawerClosedCollapse();
      return;
    }

    const text = getVisibleText(drawer);
    const sku = getProjectDrawerHeaderSku(drawer);
    if (!sku) return;
    if (state.drawerTabFlowSku && ((state.drawerTabFlowDrawer && drawer !== state.drawerTabFlowDrawer) || (sku && sku !== state.drawerTabFlowSku))) {
      stopScan();
      cancelDrawerTabFlow();
    }
    if (sku && state.selectedSku && sku !== state.selectedSku) {
      state.copywritingMode = false;
      state.copywritingError = '';
      state.copywritingStatus = '';
    }
    if (lockedSku && sku && sku !== lockedSku) return;
    if (lockedSku && !sku && state.openingProjectDetail) return;
    if (state.userCollapsedPanel && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    const shouldAdoptProgrammaticDetail = sku && state.openingProjectDetailSku && sku === state.openingProjectDetailSku;
    if (!shouldAdoptProgrammaticDetail && (state.view === 'sizeImage' || state.view === 'parameterImage')) {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      return;
    }
    if (!shouldAdoptProgrammaticDetail && (state.view === 'about' || state.view === 'upload')) {
      state.drawer = drawer;
      state.sku = sku || state.sku || '';
      if (sku) state.selectedSku = sku;
      return;
    }
    const changed = drawer !== state.drawer || (sku && sku !== state.sku);
    if (state.scanRunning && drawer === state.drawer) {
      if (sku && sku !== state.sku) {
        state.sku = sku;
        state.scanTargetSku = sku;
        state.scanData = normalizeData(loadData(sku) || {
          sku,
          name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
        });
      }
      return;
    }
    if (!changed && state.manuallyCollapsedForSku && state.manuallyCollapsedForSku === (sku || state.sku)) return;
    if (!changed) return;
    state.manuallyCollapsedForSku = '';
    if (shouldAdoptProgrammaticDetail) {
      state.openingProjectDetail = false;
      state.openingProjectDetailSku = '';
    }

    const cached = sku ? loadData(sku) : null;
    if (cached) {
      state.drawer = drawer;
      state.sku = sku || '';
      state.data = normalizeData(cached);
      const projectStatus = extractProjectStatus(text);
      if (projectStatus && projectStatus !== state.data.projectStatus) {
        state.data = normalizeData({ ...state.data, projectStatus });
        saveData(sku, state.data);
      }
      state.selectedSku = sku;
      state.view = 'detail';
      resetExcelState();
      expandPanel();
      upsertIndex(state.data);
      stopScan();
      if (!shouldSkipLedgerDrawer(drawer)) {
        upsertDailyLedgerFromData(state.data, { status: '待定稿', stage: '待定稿', note: '打开详情自动记录', requireCurrentMonth: true });
      }
      renderShell(L.scanning);
      scheduleDrawerProductFlow(state.data, { reason: 'cached-open', includeScanTabs: true });
      return;
    }

    state.drawer = drawer;
    state.sku = sku || '';
    state.data = sku ? normalizeData({ sku, name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''), projectStatus: extractProjectStatus(text) }) : null;
    state.selectedSku = sku || '';
    state.view = 'detail';
    resetExcelState();
    expandPanel();
    if (state.settings.collectionEnabled) {
      resetRound();
      state.scanTargetSku = sku || '';
      startScan();
      return;
    }
    renderShell();
  }

  function scheduleDrawerClosedCollapse() {
    const hadDrawer = Boolean(state.drawer || state.sku);
    stopScan();
    cancelDrawerTabFlow();
    stopMaterialWatch();
    stopManualTabRead();
    state.drawer = null;
    state.sku = '';
    state.observedDrawer = null;
    state.observedSku = '';
    state.observedTab = '';
    if (hadDrawer) collapsePanel(true);
  }

  function resetRound() {
    stopScan();
    cancelDrawerTabFlow();
    state.scanRunning = false;
    state.scanTargetSku = '';
    state.scanData = null;
  }

  function startScan(options) {
    const opts = options || {};
    if (!state.settings.collectionEnabled) return;
    const drawer = getProjectDrawer();
    if (!drawer) {
      showToast('\u8bf7\u5148\u6253\u5f00\u9879\u76ee\u8be6\u60c5');
      return;
    }
    stopScan();
    const drawerSku = getProjectDrawerHeaderSku(drawer);
    const requestedSku = state.scanTargetSku || state.sku || '';
    if (!drawerSku || (requestedSku && requestedSku !== drawerSku)) {
      state.scanRunning = true;
      state.scanTimer = window.setTimeout(startScan, 250);
      return;
    }
    const targetSku = drawerSku;
    if (targetSku) {
      state.scanTargetSku = targetSku;
      if (!state.scanData || state.scanData.sku !== targetSku) {
        const activeData = state.data && state.data.sku === targetSku ? state.data : null;
        state.scanData = normalizeData(activeData || loadData(targetSku) || { sku: targetSku });
      }
    }
    lockLoadingTip(targetSku || state.selectedSku || '');
    state.scanRunning = true;
    if (!isLoadingTipVisible()) renderShell(L.scanning);
    scheduleDrawerProductFlow(state.scanData || { sku: targetSku }, {
      reason: 'scan',
      includeScanTabs: true,
      replace: true,
      forceAllTabs: Boolean(opts.forceAllTabs),
    });
  }

  async function refreshSelectedData() {
    if (!state.settings.collectionEnabled) {
      showToast('数据采集已关闭');
      return;
    }
    const targetSku = (state.data && state.data.sku) || state.selectedSku || '';
    if (!targetSku) {
      showToast(L.excelNeedData);
      return;
    }

    state.view = 'detail';
    stopMaterialWatch();
    stopScan();
    expandPanel();

    let drawer = getProjectDrawer();
    const drawerText = drawer ? getVisibleText(drawer) : '';
    if (!drawer || !drawerText.includes(targetSku)) {
      renderShell('\u6b63\u5728\u6253\u5f00\u6b63\u786e\u7f16\u7801\u8be6\u60c5...');
      await openSelectedProjectDetail();
      drawer = await waitFor(() => getProjectDrawerForSku(targetSku), 5000, 150);
      if (!drawer) {
        showToast(L.openDetailFailed);
        renderShell();
        return;
      }
    }

    state.drawer = drawer;
    state.sku = targetSku;
    state.selectedSku = targetSku;
    state.data = createRefreshSeedData(targetSku);
    resetExcelState();
    resetRound();
    state.scanTargetSku = targetSku;
    renderShell(L.scanning);
    startScan({ forceAllTabs: true });
  }

  function createRefreshSeedData(sku) {
    const cached = normalizeData(loadData(sku) || {});
    const preservedImageSource = /^(?:effectImage|productListImage)$/.test(cached.skuImageSource || '') ? cached.skuImageSource : '';
    return normalizeData({
      sku,
      name: cached.name || '',
      brand: cached.brand || '',
      manualCategory: cached.manualCategory || '',
      aiProductType: cached.aiProductType || '',
      aiCategory: cached.aiCategory || '',
      productType: cached.productType || '',
      category: cached.category || '',
      departmentName: cached.departmentName || '',
      projectRowId: cached.projectRowId || '',
      projectId: cached.projectId || '',
      copywriting: cached.copywriting || null,
      copywritingIngredientEnglish: cached.copywritingIngredientEnglish || '',
      copywritingIngredientChinese: cached.copywritingIngredientChinese || '',
      copywritingIngredientSplit: Boolean(cached.copywritingIngredientSplit),
      ingredientEnglish: cached.ingredientEnglish || '',
      ingredientChinese: cached.ingredientChinese || '',
      ingredientItems: Array.isArray(cached.ingredientItems) ? cached.ingredientItems : [],
      ingredientPdfFileName: cached.ingredientPdfFileName || '',
      ingredientPdfHash: cached.ingredientPdfHash || '',
      ingredientPdfModel: cached.ingredientPdfModel || '',
      ingredientPdfUpdatedAt: cached.ingredientPdfUpdatedAt || '',
      ingredientNormalizerVersion: cached.ingredientNormalizerVersion || '',
      ingredientSource: cached.ingredientSource || '',
      ingredientWordFileName: cached.ingredientWordFileName || '',
      ingredientWordHash: cached.ingredientWordHash || '',
      ingredientWordUpdatedAt: cached.ingredientWordUpdatedAt || '',
      tailSealLengthValue: cached.tailSealLengthValue || '',
      purchasePrice: cached.purchasePrice || '',
      purchasePriceSource: cached.purchasePriceSource || '',
      purchasePriceUpdatedAt: cached.purchasePriceUpdatedAt || '',
      seenDesign: cached.seenDesign,
      productListImageUrl: cached.productListImageUrl || '',
      productListImageFallbackUrl: cached.productListImageFallbackUrl || '',
      benchmarkImageUrl: cached.benchmarkImageUrl || '',
      benchmarkImageFallbackUrl: cached.benchmarkImageFallbackUrl || '',
      skuImageUrl: preservedImageSource ? (cached.skuImageUrl || '') : '',
      skuImageFallbackUrl: preservedImageSource ? (cached.skuImageFallbackUrl || '') : '',
      skuImageSource: preservedImageSource,
    });
  }

  function stopScan() {
    if (state.scanTimer) {
      window.clearTimeout(state.scanTimer);
      state.scanTimer = 0;
    }
    state.scanRunning = false;
  }

  function stopManualTabRead() {
    if (state.manualCollectTimer) {
      window.clearTimeout(state.manualCollectTimer);
      state.manualCollectTimer = 0;
    }
  }

  function observeManualTabRead() {
    const drawer = getProjectDrawer();
    if (!drawer || state.scanRunning || !state.settings.collectionEnabled) return;
    const sku = getProjectDrawerHeaderSku(drawer);
    const tab = getActiveTabText(drawer);
    if (!sku || !tab) return;
    if (drawer !== state.observedDrawer || sku !== state.observedSku) {
      state.observedDrawer = drawer;
      state.observedSku = sku;
      state.observedTab = tab;
      return;
    }
    if (tab === state.observedTab) return;
    state.observedTab = tab;
    stopManualTabRead();
    state.manualCollectTimer = window.setTimeout(() => readCurrentManualTab(drawer, sku, tab), 420);
  }

  function readCurrentManualTab(drawer, sku, tab) {
    state.manualCollectTimer = 0;
    if (!state.settings.collectionEnabled || state.scanRunning || drawer !== getProjectDrawerForSku(sku) || getActiveTabText(drawer) !== tab) return;
    const next = extractData(drawer, { forceSkuImage: tab === L.productTab });
    if (!next.sku || next.sku !== sku) return;
    const merged = mergeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }), next);
    const previous = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    const changed = hasMeaningfulDataChange(previous, merged);
    if (changed) {
      saveData(sku, merged);
      if (state.selectedSku === sku) renderShell();
    }
    if (tab === L.productTab) {
      scheduleDrawerProductFlow(merged, { reason: 'manual-product-tab', includeScanTabs: false, replace: true });
    }
  }

  function stopMaterialWatch() {
    if (state.materialWatchTimer) {
      window.clearTimeout(state.materialWatchTimer);
      state.materialWatchTimer = 0;
    }
  }

  function checkMaterialOnce() {
    const targetSku = state.scanTargetSku || state.sku || (state.data && state.data.sku) || '';
    const drawer = targetSku ? getProjectDrawerForSku(targetSku) : null;
    const trackedData = state.scanData && state.scanData.sku === targetSku
      ? state.scanData
      : normalizeData(loadData(targetSku) || {});
    if (!drawer || !targetSku || !trackedData.sku) {
      stopMaterialWatch();
      return;
    }

    state.materialWatchAttempts += 1;
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const onMaterial = activeTabText === L.materialTab || /\u7269\u6599\u7f16\u7801.*\u7269\u6599\u540d\u79f0.*\u89c4\u683c\u578b\u53f7/.test(text);

    if (!onMaterial) {
      const tab = findTabButton(drawer, L.materialTab);
      if (tab && !isActiveTab(tab)) {
        state.ignoreOutsideClickUntil = Date.now() + 1200;
        tab.click();
      }
    } else {
      const packaging = extractPackaging(drawer);
      if (hasPackagingChanged(trackedData, packaging)) {
        const packageNums = packaging.packageNums || trackedData.packageNums || null;
        const hasInnerCard = hasInnerCardMark(packaging) || hasInnerCardMark(trackedData);
        const productNums = productNumsFromPackage(packageNums, hasInnerCard);
        const updatedData = normalizeData({
          ...trackedData,
          packageSizeText: packaging.packageSizeText || trackedData.packageSizeText,
          packageSizeLabel: packaging.packageSizeLabel || trackedData.packageSizeLabel,
          packageCode: packaging.packageCode || trackedData.packageCode,
          printSizeText: packaging.printSizeText || trackedData.printSizeText,
          printSizeLabel: packaging.printSizeLabel || trackedData.printSizeLabel,
          printCode: packaging.printCode || trackedData.printCode,
          packageNums,
          productNums,
          packageSource: packaging.packageSizeText ? L.sourceMaterial : trackedData.packageSource,
          hasInnerCard,
          netContent: packaging.netContent || trackedData.netContent,
          updatedAt: new Date().toLocaleString(),
          updatedAtMs: Date.now(),
        });
        if (state.scanData && state.scanData.sku === targetSku) state.scanData = updatedData;
        saveData(targetSku, updatedData);
        renderShell('\u7269\u6599\u6e05\u5355\u5c3a\u5bf8\u5df2\u66f4\u65b0');
        stopMaterialWatch();
        return;
      }
    }

    if (state.materialWatchAttempts >= MATERIAL_WATCH_ATTEMPTS) {
      stopMaterialWatch();
      renderShell(L.cached);
      return;
    }
    state.materialWatchTimer = window.setTimeout(checkMaterialOnce, SCAN_INTERVAL_MS);
  }

  function hasPackagingChanged(data, packaging) {
    if (!packaging) return false;
    if (packaging.packageSizeText && packaging.packageSizeText !== data.packageSizeText) return true;
    if (packaging.packageSizeLabel && packaging.packageSizeLabel !== data.packageSizeLabel) return true;
    if (hasInnerCardMark(packaging) !== hasInnerCardMark(data)) return true;
    if (packaging.printSizeText && packaging.printSizeText !== data.printSizeText) return true;
    if (packaging.printSizeLabel && packaging.printSizeLabel !== data.printSizeLabel) return true;
    return false;
  }

  function scheduleDrawerProductFlow(data, options) {
    const opts = options || {};
    const sku = String(data && data.sku || '');
    if (!state.settings.collectionEnabled || !sku) return;
    if (!opts.replace && state.drawerTabFlowRunning && state.drawerTabFlowSku === sku) return;
    cancelDrawerTabFlow();
    const token = state.drawerTabFlowToken + 1;
    state.drawerTabFlowToken = token;
    state.drawerTabFlowSku = sku;
    state.drawerTabFlowUserInterrupted = false;
    if (opts.includeScanTabs) {
      state.scanRunning = true;
      state.scanTargetSku = sku;
      state.scanData = normalizeData(data);
    }
    state.drawerTabFlowTimer = window.setTimeout(() => {
      state.drawerTabFlowTimer = 0;
      runDrawerProductFlow(sku, token, opts).catch((error) => {
        addLog('warn', '\u4ea7\u54c1\u4fe1\u606f\u96c6\u4e2d\u83b7\u53d6\u5931\u8d25', sku + ' | ' + formatErrorMessage(error));
      });
    }, opts.reason === 'cached-open' ? 220 : 0);
  }

  function hasCurrentCopywritingCache(data) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    return Boolean(record && record.fullText && record.parserVersion === COPYWRITING_PARSER_VERSION);
  }

  function getDrawerCollectionTabs(data, includeScanTabs, forceAllTabs) {
    if (!includeScanTabs) return [L.productTab];
    if (forceAllTabs) return ['\u9879\u76ee\u4fe1\u606f', L.materialTab, L.productTab];
    const cached = normalizeData(data || {});
    const tabs = [];
    const hasProjectCache = Boolean(cached.name && cached.projectStatus);
    if (!hasProjectCache) tabs.push('\u9879\u76ee\u4fe1\u606f');
    const hasPackageDimensions = Boolean(cached.packageLength && cached.packageWidth && cached.packageHeight);
    const missingMaterialSize = !hasPackageDimensions && !cached.printSizeText;
    if (!cached.seenMaterial || missingMaterialSize) tabs.push(L.materialTab);
    if (!cached.seenProduct || !cached.grossWeight || !hasCurrentCopywritingCache(cached)) tabs.push(L.productTab);
    return tabs;
  }

  function isDrawerProductFlowCurrent(sku, token, drawer) {
    return Boolean(
      !state.drawerTabFlowUserInterrupted &&
      state.drawerTabFlowToken === token &&
      state.drawerTabFlowSku === sku &&
      drawer && drawer === getProjectDrawerForSku(sku) &&
      getProjectDrawerHeaderSku(drawer) === sku
    );
  }

  async function waitForStableProjectDrawerIdentity(drawer, sku, timeout) {
    const startedAt = Date.now();
    let stableSince = 0;
    while (Date.now() - startedAt < (Number(timeout) || 5000)) {
      if (getProjectDrawerHeaderSku(drawer) === sku && drawer === getProjectDrawerForSku(sku)) {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince >= 300) return true;
      } else {
        stableSince = 0;
      }
      await wait(100);
    }
    return false;
  }

  function getProductAttachmentFiles(drawer, sku) {
    const ingredientItem = findIngredientPdfItem(drawer);
    const copywritingItem = findProductCopywritingItem(drawer);
    return {
      ingredientFile: ingredientItem ? findIngredientPdfFile(ingredientItem) : null,
      copywritingFile: copywritingItem ? findProductCopywritingFile(copywritingItem, sku) : null,
    };
  }

  async function waitForProductAttachmentFiles(drawer, sku, token) {
    let files = getProductAttachmentFiles(drawer, sku);
    const copywritingDeadline = Date.now() + 2600;
    while (!files.copywritingFile && Date.now() < copywritingDeadline) {
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) return null;
      await wait(140);
      files = getProductAttachmentFiles(drawer, sku);
    }
    const ingredientDeadline = Date.now() + 800;
    while (!files.ingredientFile && Date.now() < ingredientDeadline) {
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) return null;
      await wait(140);
      files = getProductAttachmentFiles(drawer, sku);
    }
    return isDrawerProductFlowCurrent(sku, token, drawer) ? files : null;
  }

  async function runDrawerProductFlow(sku, token, options) {
    const includeScanTabs = Boolean(options && options.includeScanTabs);
    const drawer = getProjectDrawerForSku(sku);
    const identityReady = drawer && await waitForStableProjectDrawerIdentity(drawer, sku, 5000);
    if (!identityReady || state.drawerTabFlowToken !== token || state.drawerTabFlowSku !== sku) {
      if (state.drawerTabFlowToken === token) {
        if (includeScanTabs) {
          stopScan();
          state.scanTargetSku = '';
          state.scanData = null;
          renderShell(L.openDetailFailed);
        }
        state.drawerTabFlowRunning = false;
        state.drawerTabFlowSku = '';
        state.drawerTabFlowDrawer = null;
      }
      return;
    }
    state.drawerTabFlowRunning = true;
    state.drawerTabFlowDrawer = drawer;
    const scanSeed = includeScanTabs && state.scanData && state.scanData.sku === sku ? state.scanData : null;
    let merged = normalizeData(scanSeed || loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    try {
      const tabs = getDrawerCollectionTabs(merged, includeScanTabs, Boolean(options && options.forceAllTabs));
      const refreshProductPage = tabs.includes(L.productTab);
      for (const tab of tabs) {
        const ready = await switchDrawerTab(drawer, tab, { flowToken: token, timeout: 4500 });
        if (!ready || !isDrawerProductFlowCurrent(sku, token, drawer)) return;
        let live = extractData(drawer, { forceSkuImage: tab === L.productTab });
        if (live.sku !== sku) return;
        merged = mergeData(merged, live);
        const needsShortReread = (tab === '\u9879\u76ee\u4fe1\u606f' && !live.name && !live.projectStatus)
          || (tab === L.materialTab && !live.seenMaterial)
          || (tab === L.productTab && (!live.seenProduct || !live.grossWeight));
        if (needsShortReread) {
          if (tab === L.productTab && !live.grossWeight) await waitFor(() => getGrossWeightValue(drawer), 2600, 120);
          else await wait(280);
          if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
          live = extractData(drawer, { forceSkuImage: tab === L.productTab });
          if (live.sku !== sku) return;
          merged = mergeData(merged, live);
        }
        if (tab === L.productTab && requiresSkuImage(merged) && !getProductThumbUrl(merged)) {
          await waitForProductInfoImage(drawer, 420);
          if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
          live = extractData(drawer, { forceSkuImage: true });
          if (live.sku !== sku) return;
          merged = mergeData(merged, live);
        }
        if (includeScanTabs) state.scanData = merged;
      }
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
      saveData(sku, merged);
      if (state.selectedSku === sku) state.data = normalizeData(loadData(sku) || merged);
      if (includeScanTabs && !shouldSkipLedgerDrawer(drawer)) {
        upsertDailyLedgerFromData(merged, { status: '\u5f85\u5b9a\u7a3f', stage: '\u5f85\u5b9a\u7a3f', note: '\u6253\u5f00\u8be6\u60c5\u81ea\u52a8\u8bb0\u5f55', requireCurrentMonth: true });
      }

      if (merged.projectStatus === '\u5df2\u5b8c\u6210' && !normalizeLedgerPurchasePrice(merged.purchasePrice)) {
        const stockReady = await switchDrawerTab(drawer, '\u5907\u8d27\u4fe1\u606f', { flowToken: token, timeout: 3800 });
        if (stockReady && isDrawerProductFlowCurrent(sku, token, drawer)) {
          const price = await waitFor(() => extractDomesticTierPrice(drawer), 2200, 120);
          if (price && isDrawerProductFlowCurrent(sku, token, drawer)) merged = cacheDomesticTierPrice(sku, merged, price);
        }
      }

      if (refreshProductPage) {
        if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;
        await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 4500 });
        if (!isDrawerProductFlowCurrent(sku, token, drawer)) return;

        const attachmentFiles = await waitForProductAttachmentFiles(drawer, sku, token);
        if (!attachmentFiles) return;
        if (attachmentFiles.copywritingFile) {
          const cached = await hydrateCopywritingForSku(sku, {
            silent: true,
            force: true,
            drawer,
            file: attachmentFiles.copywritingFile,
          });
          if (attachmentFiles.ingredientFile && (
            cached.ingredientPdfFileName !== attachmentFiles.ingredientFile.fileName
            || cached.ingredientNormalizerVersion !== INGREDIENT_NORMALIZER_VERSION
          )) {
            await hydrateIngredientPdfForSku(sku, { silent: true, drawer, file: attachmentFiles.ingredientFile });
          }
        } else {
          addLog('info', '\u4ea7\u54c1\u4fe1\u606f\u672a\u627e\u5230\u4ea7\u54c1\u6587\u6848 Word', sku);
          if (attachmentFiles.ingredientFile) await hydrateIngredientPdfForSku(sku, { silent: true, drawer, file: attachmentFiles.ingredientFile });
        }
        if (!attachmentFiles.ingredientFile) addLog('info', '\u4ea7\u54c1\u4fe1\u606f\u672a\u627e\u5230\u6210\u5206\u8868 PDF', sku);
      }
    } finally {
      if (includeScanTabs && isDrawerProductFlowCurrent(sku, token, drawer)) {
        await switchDrawerTab(drawer, L.materialTab, { flowToken: token, timeout: 4500 }).catch(() => false);
      }
      if (state.drawerTabFlowToken === token) {
        if (includeScanTabs) {
          stopScan();
          state.scanTargetSku = '';
          state.scanData = null;
          renderShell(L.scanDone);
        } else if (state.selectedSku === sku) {
          renderShell(L.cached);
        }
        state.drawerTabFlowRunning = false;
        state.drawerTabFlowSku = '';
        state.drawerTabFlowDrawer = null;
      }
    }
  }

  function extractDomesticTierPrice(drawer) {
    if (!drawer || getActiveTabText(drawer) !== '\u5907\u8d27\u4fe1\u606f') return '';
    const labeled = getFormValueByLooseLabel('\u56fd\u5185\u4e09\u6863\u4ef7\u683c', drawer);
    const fromLabel = normalizeLedgerPurchasePrice(String(labeled || '').replace(/^[^\d]*/, ''));
    if (fromLabel) return fromLabel;
    const text = getVisibleText(drawer);
    const match = text.match(/\u56fd\u5185\u4e09\u6863\u4ef7\u683c\s*[:\uff1a]?\s*(?:[\uffe5\u00a5]|RMB)?\s*(\d+(?:\.\d+)?)(?![\d.])/i);
    return normalizeLedgerPurchasePrice(match ? match[1] : '');
  }

  function cacheDomesticTierPrice(sku, data, price) {
    const normalizedPrice = normalizeLedgerPurchasePrice(price);
    if (!sku || !normalizedPrice) return data;
    const previousPrice = normalizeLedgerPurchasePrice(data && data.purchasePrice);
    const next = normalizeData({
      ...(data || {}),
      purchasePrice: normalizedPrice,
      purchasePriceSource: 'plm-stock-domestic-tier',
      purchasePriceUpdatedAt: new Date().toLocaleString(),
    });
    saveData(sku, next);
    if (state.selectedSku === sku) {
      state.data = next;
      state.excelPurchasePrice = normalizedPrice;
    }
    upsertDailyLedgerFromData(next, { purchasePrice: normalizedPrice });
    if (previousPrice !== normalizedPrice) recordCommerceInsight(next, null, { price: normalizedPrice, source: 'plm-stock-domestic-tier' });
    addLog('success', '\u5df2\u7f13\u5b58\u56fd\u5185\u4e09\u6863\u4ef7\u683c', sku + ' | ' + normalizedPrice);
    return next;
  }

  async function diagnoseMissingDataBeforeSave(data) {
    const missing = getMissingFieldsForData(data);
    if (!missing.length || state.diagnosticRunning) return data;
    const issueMeta = getDataQualityIssueMeta(data, missing);
    if (issueMeta.kind === '\u53ef\u80fd PLM \u7a7a\u503c') return data;

    const drawer = getProjectDrawerForSku(data.sku) || getProjectDrawer();
    if (!drawer) {
      addLog('warn', '\u6570\u636e\u7f3a\u5931\u8bca\u65ad\u8df3\u8fc7', data.sku + ' \u672a\u627e\u5230\u5bf9\u5e94\u62bd\u5c49');
      return attachMissingDiagnostic(data, {
        status: '\u672a\u6267\u884c',
        reason: '\u672a\u627e\u5230\u5bf9\u5e94\u62bd\u5c49',
        beforeMissing: missing,
        afterMissing: missing,
        fixed: [],
        tabs: [],
      });
    }

    const tabs = getDiagnosticTabsForMissing(missing);
    if (!tabs.length) {
      return attachMissingDiagnostic(data, {
        status: '\u672a\u6267\u884c',
        reason: '\u672a\u627e\u5230\u9700\u4e8c\u6b21\u8bfb\u53d6\u7684\u9875\u7b7e',
        beforeMissing: missing,
        afterMissing: missing,
        fixed: [],
        tabs: [],
      });
    }
    state.diagnosticRunning = true;
    addLog('info', '\u5f00\u59cb\u4e8c\u6b21\u8bfb\u53d6\u7f3a\u5931\u6570\u636e', data.sku + ' \u7f3a\uff1a' + missing.join('\u3001') + ' / ' + issueMeta.kind);
    let merged = data;
    const startedAt = Date.now();
    const attempts = [];
    try {
      for (const tabName of tabs) {
        await switchDrawerTab(drawer, tabName);
        const beforeTabMissing = getMissingFieldsForData(merged);
        let tabAttempts = 1;
        merged = mergeData(merged, extractData(drawer, { forceSkuImage: tabName === L.productTab }));
        let afterTabMissing = getMissingFieldsForData(merged);
        if (afterTabMissing.length >= beforeTabMissing.length && afterTabMissing.some((field) => beforeTabMissing.includes(field))) {
          tabAttempts += 1;
          await wait(280);
          merged = mergeData(merged, extractData(drawer, { forceSkuImage: tabName === L.productTab }));
          afterTabMissing = getMissingFieldsForData(merged);
        }
        attempts.push({
          tab: tabName,
          count: tabAttempts,
          beforeMissing: beforeTabMissing,
          afterMissing: afterTabMissing,
        });
      }
      const afterMissing = getMissingFieldsForData(merged);
      const fixed = missing.filter((field) => !afterMissing.includes(field));
      if (fixed.length) {
        addLog('success', '\u4e8c\u6b21\u8bfb\u53d6\u5df2\u8865\u5230\u6570\u636e', data.sku + ' \u8865\u5230\uff1a' + fixed.join('\u3001'));
      } else {
        addLog('warn', '\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\u6570\u636e', data.sku + ' \u4ecd\u7f3a\uff1a' + afterMissing.join('\u3001'));
      }
      return attachMissingDiagnostic(merged, {
        status: fixed.length ? '\u90e8\u5206\u8865\u5230' : '\u4ecd\u7f3a',
        reason: fixed.length ? '\u4e8c\u6b21\u8bfb\u53d6\u6210\u529f\u8865\u5230\u90e8\u5206\u5b57\u6bb5' : '\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\u5b57\u6bb5',
        beforeMissing: missing,
        afterMissing,
        fixed,
        tabs,
        attempts,
        elapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      addLog('warn', '\u4e8c\u6b21\u8bfb\u53d6\u7f3a\u5931\u6570\u636e\u5931\u8d25', data.sku + ' ' + formatErrorMessage(error));
      return attachMissingDiagnostic(data, {
        status: '\u5931\u8d25',
        reason: formatErrorMessage(error),
        beforeMissing: missing,
        afterMissing: getMissingFieldsForData(data),
        fixed: [],
        tabs,
        attempts,
        elapsedMs: Date.now() - startedAt,
      });
    } finally {
      state.diagnosticRunning = false;
    }
  }

  function attachMissingDiagnostic(data, diagnostic) {
    return normalizeData({
      ...(data || {}),
      lastMissingDiagnostic: {
        status: String(diagnostic && diagnostic.status || '').slice(0, 40),
        reason: String(diagnostic && diagnostic.reason || '').slice(0, 160),
        beforeMissing: Array.isArray(diagnostic && diagnostic.beforeMissing) ? diagnostic.beforeMissing.slice(0, 20) : [],
        afterMissing: Array.isArray(diagnostic && diagnostic.afterMissing) ? diagnostic.afterMissing.slice(0, 20) : [],
        fixed: Array.isArray(diagnostic && diagnostic.fixed) ? diagnostic.fixed.slice(0, 20) : [],
        tabs: Array.isArray(diagnostic && diagnostic.tabs) ? diagnostic.tabs.slice(0, 8) : [],
        attempts: sanitizeDiagnosticAttempts(diagnostic && diagnostic.attempts),
        elapsedMs: Number(diagnostic && diagnostic.elapsedMs || 0) || 0,
        at: new Date().toLocaleString(),
      },
    });
  }

  function sanitizeDiagnosticAttempts(attempts) {
    return Array.isArray(attempts) ? attempts.slice(0, 8).map((item) => ({
      tab: String(item && item.tab || '').slice(0, 40),
      count: Number(item && item.count || 0) || 0,
      beforeMissing: Array.isArray(item && item.beforeMissing) ? item.beforeMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      afterMissing: Array.isArray(item && item.afterMissing) ? item.afterMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
    })).filter((item) => item.tab) : [];
  }

  function getDiagnosticTabsForMissing(missing) {
    const tabs = [];
    const needMaterial = missing.some((field) => ['\u5305\u88c5\u5c3a\u5bf8', '\u5370\u5237\u5c3a\u5bf8', '\u51c0\u542b\u91cf'].includes(field));
    const needProduct = missing.some((field) => ['\u4ea7\u54c1\u5c3a\u5bf8', '\u6bdb\u91cd'].includes(field));
    const needProductAsset = missing.some((field) => ['SKU\u56fe'].includes(field));
    if (needMaterial) tabs.push(L.materialTab);
    if (needProduct) tabs.push(L.productTab);
    if (needProductAsset && !tabs.includes(L.productTab)) tabs.push(L.productTab);
    return tabs;
  }

  function requiresSkuImage(data) {
    return Boolean(data && data.projectStatus === '\u5df2\u5b8c\u6210');
  }

  function getProjectDrawerHeaderSku(drawer) {
    if (!drawer) return '';
    const header = drawer.querySelector('.taskInfo');
    if (!header || !isVisibleElement(header)) return '';
    const match = getVisibleText(header).match(/\u5546\u54c1\u7f16\u7801\s*[:\uff1a]\s*(SKU\d+)/i);
    return match ? match[1].toUpperCase() : '';
  }

  function getProjectDrawer() {
    if (state.openingProjectDetailSku) {
      const locked = getProjectDrawerForSku(state.openingProjectDetailSku);
      return locked || null;
    }
    const drawers = Array.from(document.querySelectorAll('.ant-drawer-open'))
      .filter(isVisibleElement)
      .filter((drawer) => {
        const text = getVisibleText(drawer);
        if (/\u67e5\u770b\u5546\u54c1/.test(text)) return false;
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text);
      });
    return drawers[drawers.length - 1] || null;
  }

  function extractData(drawer, options) {
    const opts = options || {};
    const text = getVisibleText(drawer);
    const activeTabText = getActiveTabText(drawer);
    const hasMaterialContent = /\u7269\u6599\u7f16\u7801[\s\S]*\u7269\u6599\u540d\u79f0[\s\S]*\u89c4\u683c\u578b\u53f7/.test(text);
    const hasProductContent = /PRODUCT\s*NAME|\u89c4\u683c\u4fe1\u606f[\s\S]{0,500}\u6bdb\u91cd|\u6548\u679c\u56fe\u4fe1\u606f/.test(text);
    const seenMaterial = activeTabText === L.materialTab && hasMaterialContent;
    const seenProduct = activeTabText === L.productTab && hasProductContent;
    const projectStatus = extractProjectStatus(text);
    const packaging = seenMaterial ? extractPackaging(drawer) : emptyPackaging();
    const outer = extractOuterPackage(drawer);
    const inner = seenProduct ? extractInnerPackage(drawer) : { productNums: null };
    const food = seenMaterial ? extractFoodSemiFinished(drawer) : emptyFoodSemiFinished();
    const imageInfo = seenProduct && (projectStatus === '\u5df2\u5b8c\u6210' || opts.forceSkuImage) ? findDesignImageInfo(drawer) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const tubeFields = extractTubeFields(drawer);
    const tubeSpec = packaging.isTubePrintMaterial
      ? findTubeSizeSpec([tubeFields.text, packaging.printRawText, packaging.printSizeText, packaging.printSizeLabel].filter(Boolean).join('\n'), tubeFields)
      : null;
    const isTubePrint = Boolean(tubeSpec);
    const singleBottle = Boolean(
      food.productNums && !packaging.packageNums && outer.packageNums &&
      !/\u7eb8\u76d2/.test(String(packaging.packageSizeLabel || '') + String(packaging.packageSizeText || ''))
    );
    const packageNums = singleBottle ? null : (packaging.packageNums || outer.packageNums);
    const hasInnerCard = hasInnerCardMark(packaging);
    const productNums = singleBottle ? outer.packageNums : (packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : food.productNums);

    const brand = getProjectField(text, '\u54c1\u724c') || getFormValueByLabel('\u54c1\u724c', drawer);
    return {
      sku: getProjectDrawerHeaderSku(drawer),
      name: cleanName((text.match(/\u5546\u54c1\u540d\u79f0[:\uff1a]\s*([^\n]+)/) || [])[1] || ''),
      packageSizeText: packaging.packageSizeText || '',
      packageSizeLabel: packaging.packageSizeLabel || '',
      packageCode: packaging.packageCode || '',
      printSizeText: tubeSpec ? tubeSpec.printSizeText : (packaging.printSizeText || ''),
      printSizeLabel: tubeSpec ? '\u5370\u5237' : (packaging.printSizeLabel || ''),
      printCode: packaging.printCode || '',
      tubeSegmentText: tubeSpec ? tubeSpec.segmentText : '',
      tubeTailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tailSealLengthValue: tubeSpec ? tubeSpec.tailSealText : '',
      tubeDiameter: tubeSpec ? tubeSpec.diameter : '',
      tubeBody: tubeSpec ? tubeSpec.body : '',
      tubeSpecKey: tubeSpec ? tubeSpec.key : '',
      isTubePrintMaterial: isTubePrint || packaging.isTubePrintMaterial,
      packageNums,
      productNums: inner.productNums || productNums,
      plmProductNums: inner.productNums,
      bottleNums: singleBottle ? outer.packageNums : null,
      singleBottle,
      packageSource: packaging.packageSizeText || food.productNums || isTubePrint ? L.sourceMaterial : (outer.packageNums ? L.sourceOuter : ''),
      hasInnerCard,
      brand,
      englishName: seenProduct ? cleanEnglishProductName(extractLineAfter(text, 'PRODUCT NAME'), brand) : '',
      designType: getProjectLooseField(text, '\u8bbe\u8ba1\u7c7b\u578b'),
      artPriority: getProjectLooseField(text, '\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7') || extractArtPriority(text),
      projectStatus,
      referenceUrl: extractReferenceUrl(text),
      designAssignedAt: getProjectLooseField(text, '\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4'),
      developmentAssignedAt: getProjectLooseField(text, '\u5f00\u53d1\u5206\u914d\u65f6\u95f4'),
      netContent: normalizeNetContentValue(getBestNetContent(drawer) || food.netContent || packaging.netContent),
      grossWeight: getGrossWeightValue(drawer),
      skuImageUrl: imageInfo.isSkuDesignImage ? (imageInfo.imageUrl || '') : '',
      skuImageFallbackUrl: imageInfo.isSkuDesignImage ? (imageInfo.imageFallbackUrl || '') : '',
      skuImageSource: imageInfo.isSkuDesignImage ? 'effectImage' : '',
      seenMaterial,
      seenProduct,
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    };
  }

  function mergeData(previous, next) {
    if (!previous) return normalizeData(next);
    const sameSku = previous.sku && next.sku && previous.sku === next.sku;
    if (!sameSku) return normalizeData(next);

    const merged = { ...previous };
    for (const key of Object.keys(next)) {
      if (isUsefulValue(next[key])) merged[key] = next[key];
    }
    if (next.seenMaterial) {
      const hasTubeSpec = Boolean(next.tubeSegmentText || next.tubeTailSealLengthValue || next.tailSealLengthValue || next.tubeDiameter || next.tubeBody || next.tubeSpecKey || next.isTubePrintMaterial);
      if (hasTubeSpec) {
        ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'].forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(next, key)) merged[key] = next[key] || '';
        });
        if (Object.prototype.hasOwnProperty.call(next, 'isTubePrintMaterial')) merged.isTubePrintMaterial = Boolean(next.isTubePrintMaterial);
      } else {
        ['tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey'].forEach((key) => {
          merged[key] = '';
        });
        merged.isTubePrintMaterial = false;
      }
    }
    if (next.seenProduct && (next.skuImageUrl || next.skuImageFallbackUrl)) {
      merged.skuImageUrl = next.skuImageUrl || merged.skuImageUrl || '';
      merged.skuImageFallbackUrl = next.skuImageFallbackUrl || merged.skuImageFallbackUrl || '';
      merged.skuImageSource = next.skuImageSource || merged.skuImageSource || 'effectImage';
    }
    if (next.seenProduct && Object.prototype.hasOwnProperty.call(next, 'plmProductNums')) {
      merged.plmProductNums = Array.isArray(next.plmProductNums) ? next.plmProductNums : null;
    }
    merged.seenMaterial = previous.seenMaterial || next.seenMaterial;
    merged.seenProduct = previous.seenProduct || next.seenProduct;
    return normalizeData(merged);
  }

  function hasMeaningfulDataChange(previous, next) {
    const ignored = new Set(['updatedAt', 'updatedAtMs', 'lastMissingDiagnostic', 'recentFieldChanges']);
    const before = {};
    const after = {};
    Object.keys(previous || {}).forEach((key) => {
      if (!ignored.has(key)) before[key] = previous[key];
    });
    Object.keys(next || {}).forEach((key) => {
      if (!ignored.has(key)) after[key] = next[key];
    });
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  function normalizeData(data) {
    const safe = data || {};
    migrateLabelValue(safe, 'packageSizeLabel', 'packageSizeText');
    migrateLabelValue(safe, 'printSizeLabel', 'printSizeText');
    stripKnownLabelPrefix(safe, 'packageSizeLabel', 'packageSizeText');
    stripKnownLabelPrefix(safe, 'printSizeLabel', 'printSizeText');
    const detectedPackageNums = Array.isArray(safe.packageNums) ? safe.packageNums : parseDimension(safe.packageSizeText, 3);
    const classificationText = [safe.name, safe.netContent, safe.packageSizeLabel, safe.packageSizeText, safe.printSizeLabel, safe.printSizeText].filter(Boolean).join(' ');
    const singleBottle = Boolean(safe.singleBottle || (
      detectedPackageNums &&
      !/\u7eb8\u76d2/.test(String(safe.packageSizeLabel || '') + String(safe.packageSizeText || '')) &&
      /\u6807\u7b7e/.test(String(safe.printSizeLabel || '') + String(safe.printSizeText || '')) &&
      /\u98df\u54c1|\u80f6\u56ca|\u8f6f\u7cd6|capsules?|gumm(?:y|ies)|tablets?/i.test(classificationText)
    ));
    const bottleNums = singleBottle
      ? (Array.isArray(safe.bottleNums) ? safe.bottleNums : (detectedPackageNums || (Array.isArray(safe.productNums) ? safe.productNums : null)))
      : null;
    const packageNums = singleBottle ? null : detectedPackageNums;
    const hasInnerCard = hasInnerCardMark(safe);
    if (packageNums && packageNums.length >= 5 && !/\u591a\u9875/.test(String(safe.packageSizeLabel || ''))) {
      safe.packageSizeLabel = appendChineseRemark(safe.packageSizeLabel, '\u591a\u9875');
    }
    const plmProductNums = Array.isArray(safe.plmProductNums) && safe.plmProductNums.length >= 3
      ? safe.plmProductNums.slice(0, 3).map(Number)
      : null;
    const hasPlmProductSize = Boolean(plmProductNums && plmProductNums.every((value) => Number.isFinite(value) && value > 0));
    const omitEstimatedProductSize = !singleBottle && !hasPlmProductSize && isToyDimensionProduct(safe);
    const productNums = singleBottle
      ? bottleNums
      : (hasPlmProductSize
        ? plmProductNums
        : (!omitEstimatedProductSize
          ? (packageNums ? productNumsFromPackage(packageNums, hasInnerCard) : (Array.isArray(safe.productNums) ? safe.productNums : null))
          : null));
    const isTubePrint = isTubePrintData(safe);
    const copywriting = normalizeCopywritingRecord(safe.copywriting);
    const copywritingIngredientEnglish = String(safe.copywritingIngredientEnglish || copywriting && copywriting.cleanedIngredientEnglish || '').trim();
    const copywritingIngredientChinese = String(safe.copywritingIngredientChinese || copywriting && copywriting.cleanedIngredientChinese || '').trim();
    return {
      ...safe,
      copywriting,
      copywritingIngredientEnglish,
      copywritingIngredientChinese,
      copywritingIngredientSplit: Boolean(safe.copywritingIngredientSplit || copywriting && copywriting.ingredientSplit),
      ingredientEnglish: safe.ingredientEnglish || copywritingIngredientEnglish,
      ingredientChinese: safe.ingredientChinese || copywritingIngredientChinese,
      hasInnerCard,
      singleBottle,
      bottleNums,
      isTubePrint,
      isTubePrintMaterial: Boolean(safe.isTubePrintMaterial),
      packageNums,
      productNums,
      plmProductNums: hasPlmProductSize ? plmProductNums : null,
      productSizeSource: singleBottle ? 'product' : (hasPlmProductSize ? 'plm' : (productNums ? 'estimated' : 'none')),
      omitEstimatedProductSize,
      packageLength: formatDimensionPart(packageNums, 0),
      packageWidth: formatDimensionPart(packageNums, 1),
      packageHeight: formatDimensionPart(packageNums, 2),
      tubeSegmentText: isTubePrint ? (safe.tubeSegmentText || '') : '',
      tubeTailSealLengthValue: isTubePrint ? (safe.tubeTailSealLengthValue || '') : '',
      tailSealLengthValue: isTubePrint ? (safe.tailSealLengthValue || safe.tubeTailSealLengthValue || '') : '',
      productLength: isTubePrint ? (safe.tailSealLengthValue || safe.tubeTailSealLengthValue || '') : formatDimensionPart(productNums, 0),
      productWidth: formatDimensionPart(productNums, 1),
      productHeight: formatDimensionPart(productNums, 2),
    };
  }

  function hasInnerCardMark(data) {
    if (!data) return false;
    return Boolean(data.hasInnerCard || /\u5185\u5361/.test(String(data.packageSizeLabel || '') + String(data.packageSizeText || '')));
  }

  function isDowmooBrand(data) {
    return Boolean(data && /\bDOWMOO\b/i.test(String(data.brand || '').trim()));
  }

  function isToyDimensionProduct(data) {
    if (isDowmooBrand(data)) return true;
    const text = [
      data && data.name,
      data && data.manualCategory,
      data && data.aiProductType,
      data && data.aiCategory,
      data && data.productType,
      data && data.category,
      data && data.departmentName,
    ].filter(Boolean).join(' ');
    if (/\btoys?\b|\bdolls?\b|玩具|公仔|玩偶|捏捏|积木|盲盒|史莱姆|解压/i.test(text)) return true;
    try {
      return getProductTypeForInsight(data, null) === '\u73a9\u5177';
    } catch (error) {
      return false;
    }
  }

  function shouldOmitToyProductSize(data) {
    return Boolean(data && (data.omitEstimatedProductSize || (isToyDimensionProduct(data) && data.productSizeSource !== 'plm' && !data.singleBottle)));
  }

  function migrateLabelValue(data, labelKey, valueKey) {
    if (!data || data[labelKey] || !data[valueKey]) return;
    const text = String(data[valueKey]);
    const index = text.indexOf('\uff1a');
    if (index <= 0) return;
    data[labelKey] = text.slice(0, index);
    data[valueKey] = text.slice(index + 1);
  }

  function stripKnownLabelPrefix(data, labelKey, valueKey) {
    if (!data || !data[labelKey] || !data[valueKey]) return;
    const prefix = data[labelKey] + '\uff1a';
    if (String(data[valueKey]).startsWith(prefix)) {
      data[valueKey] = String(data[valueKey]).slice(prefix.length);
    }
    data[valueKey] = stripGenericDimensionPrefixes(data[valueKey]);
  }

  function stripGenericDimensionPrefixes(value) {
    return String(value || '')
      .split(/\s*[\uff1b;]\s*/)
      .map((item) => item.replace(/^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)[:\uff1a]\s*(?=\d)/, ''))
      .filter(Boolean)
      .join('\uff1b');
  }

  function isUsefulValue(value) {
    if (value === '' || value === undefined || value === null || value === false) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  function extractPackaging(root) {
    const rows = getMaterialRows(root);
    const packageRows = rows
      .map((row, index) => ({ row, index, score: getPackageMaterialRowScore(row) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((item) => item.row);
    const printRows = rows.filter(isPrintMaterialRow);
    const packageRow = packageRows[0] || '';
    const packageDim = extractDimensionString(packageRow);
    const packageNums = parseDimension(packageDim, 3);
    let packageName = getMaterialDisplayName(packageRow, /(\u7eb8\u76d2|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/);
    if (packageNums && packageNums.length >= 5 && !/\u591a\u9875/.test(packageName + packageRow)) {
      packageName = appendChineseRemark(packageName, '\u591a\u9875');
    }
    const printItems = printRows.map((row) => {
      const dims = extractNamedDimensionStrings(row);
      if (!dims.length) return '';
      return dims.join('\uff1b');
    }).filter(Boolean);

    return {
      packageSizeText: packageDim,
      packageSizeLabel: packageName || '',
      packageCode: extractMaterialCode(packageRow),
      packageNums,
      hasInnerCard: /\u5185\u5361/.test(packageRow),
      printSizeText: printItems.join('\uff1b'),
      printSizeLabel: getCombinedPrintLabel(printRows),
      printCode: printRows.map(extractMaterialCode).filter(Boolean).join('\uff1b'),
      isTubePrintMaterial: printRows.some(isTubePrintRow),
      printRawText: printRows.join('\uff1b').slice(0, 1000),
      netContent: extractNetContentFromMaterial(packageRow) || extractNetContentFromMaterial(printRows[0] || ''),
    };
  }

  function isPrintMaterialRow(row) {
    const text = String(row || '');
    const excludedPackaging = /(\u8bf4\u660e\u4e66|\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/.test(text);
    const hasExplicitPrintSize = /\u5370\u5237\u5c3a\u5bf8\s*[:\uff1a]?\s*\d/i.test(text) && hasPrintDimensionText(text);
    // PLM categories are sometimes entered as "printed bag" even when the material description clearly identifies a tube.
    // A real printed bag with an explicitly labeled print size is both packaging and a printable material.
    if (excludedPackaging && !isTubePrintRow(text) && !hasExplicitPrintSize) return false;
    return (/\u5305\u6750/.test(text) && /(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6)/.test(text))
      || (/\u5305\u6750/.test(text) && /\u5370\u5237/.test(text) && hasPrintDimensionText(text))
      || (/\u5370\u5237(?:\u74f6|\u7ba1|\u8f6f\u7ba1|\u4e73\u6db2\u74f6)/.test(text) && hasPrintDimensionText(text));
  }

  function getProjectField(text, fieldName) {
    const escaped = escapeRegExp(fieldName);
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5e73\u53f0|\u4ea7\u54c1\u540d\u79f0|\u5173\u952e\u8bcd|\u8bbe\u8ba1\u7c7b\u578b|\u662f\u5426\u7206\u6b3e|\u662f\u5426\u4ee3\u53d1|\u5f00\u53d1\u5206\u914d|\u54c1\u724c\u7c7b\u522b|\u5f00\u53d1\u4e3b\u7ba1|\u8bbe\u8ba1\u5206\u914d|\u5f00\u53d1\u5206\u914d\u65f6\u95f4|\u8bbe\u8ba1\u5206\u914d\u65f6\u95f4|\u521b\u5efa\u65f6\u95f4|\u6700\u540e\u4fee\u6539\u65f6\u95f4|\u9879\u76ee\u4fe1\u606f|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '[:\uff1a]\\s*([\\s\\S]{0,80})'));
    if (!match) return '';
    return compactText(match[1]).split(stop)[0].trim();
  }

  function getProjectLooseField(text, fieldName) {
    const escaped = escapeRegExp(fieldName);
    const stop = /(\u9879\u76ee\u7f16\u7801|\u9700\u6c42\u7f16\u7801|\u5546\u54c1\u540d\u79f0|\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|\u5e73\u53f0|\u4ea7\u54c1\u540d\u79f0|\u5173\u952e\u8bcd|\u8bbe\u8ba1\u7c7b\u578b|\u662f\u5426\u7206\u6b3e|\u662f\u5426\u4ee3\u53d1|\u5f00\u53d1\u5206\u914d|\u54c1\u724c\u7c7b\u522b|\u5f00\u53d1\u4e3b\u7ba1|\u8bbe\u8ba1\u5206\u914d|\u5176\u4ed6\u4fe1\u606f|\u5ba1\u6279\u72b6\u6001|\u9879\u76ee\u72b6\u6001|\u7269\u6599\u6e05\u5355|\u4ea7\u54c1\u4fe1\u606f)/;
    const match = String(text || '').match(new RegExp(escaped + '\\s*[:\uff1a]?\\s*([\\s\\S]{0,120})'));
    if (!match) return '';
    return compactText(match[1]).split(stop)[0].trim();
  }

  function extractProjectStatus(text) {
    const source = compactText(text || '');
    const statuses = ['\u5f85\u5ba1\u6838', '\u8fdb\u884c\u4e2d', '\u5df2\u62d2\u7edd', '\u5df2\u4f5c\u5e9f', '\u5df2\u5b8c\u6210'];
    const labeled = source.match(/\u9879\u76ee\u72b6\u6001\s*[:\uff1a]?\s*(\u5f85\u5ba1\u6838|\u8fdb\u884c\u4e2d|\u5df2\u62d2\u7edd|\u5df2\u4f5c\u5e9f|\u5df2\u5b8c\u6210)/);
    if (labeled) return labeled[1];
    return statuses.find((status) => source.includes(status)) || '';
  }

  function extractReferenceUrl(text) {
    const match = String(text || '').match(/\u5bf9\u6807\u94fe\u63a5\s*[:\uff1a]?\s*(https?:\/\/[^\s]+)/i);
    return match ? match[1].trim() : '';
  }

  function extractArtPriority(text) {
    const source = compactText(text || '');
    const match = source.match(/\bP[0-9]\s*[-\uff0d]\s*[\u4e00-\u9fa5A-Za-z0-9]{1,8}/);
    return match ? match[0].replace(/\s+/g, '') : '';
  }

  function getMaterialDisplayName(row, keywordPattern) {
    const name = extractMaterialName(row);
    if (!name) return '';
    const match = name.match(keywordPattern);
    return match ? name.slice(match.index).trim() : name.trim();
  }

  function extractMaterialCode(row) {
    const match = String(row || '').match(/\b(MTL\d+)\b/);
    return match ? match[1] : '';
  }

  function getCombinedPrintLabel(rows) {
    const labels = rows.map((row) => cleanPrintLabel(getMaterialDisplayName(row, /(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u5370\u5237)/) || extractPrintLabelFallback(row))).filter(Boolean);
    return labels.filter((label, index) => labels.indexOf(label) === index).join('\uff1b');
  }

  function extractPrintLabelFallback(row) {
    const match = String(row || '').match(/(\u6807\u7b7e|\u5370\u5237\u8f6f\u7ba1|\u5370\u5237\u5c3a\u5bf8|\u5370\u5237\u7ba1|\u5370\u5237\u74f6|\u5370\u5237\u4e73\u6db2\u74f6|\u5370\u5237)/);
    return match ? match[1] : '';
  }

  function cleanPrintLabel(label) {
    const text = compactText(label);
    if (/\u5370\u5237(?:\u4e73\u6db2\u74f6|\u8f6f\u7ba1|\u7ba1|\u74f6)/.test(text) || (/\u8f6f\u7ba1/.test(text) && /\u5370\u5237/.test(text))) return '\u5370\u5237';
    return text
      .replace(/\uff08\u4ef7\u683c\u5305\u542b\u4e8e\u534a\u6210\u54c1\uff09/g, '')
      .replace(/[\uff08(]\s*\u4ef7\u683c\u5305\u542b[\u5728\u4e8e]\s*\u534a\u6210\u54c1\s*[\uff09)]/g, '')
      .replace(/\uff08\u8fd4\u5de5\s*\u4e00\u6b21\u6027\uff09/g, '')
      .replace(/\uff08\u888b\u542b\u6599\uff09/g, '')
      .trim();
  }

  function extractMaterialName(row) {
    const match = String(row || '').match(/(?:MTL\d+\s+){1,2}(.+?)\s+\u5305\u6750\s*-/);
    return match ? match[1].trim() : '';
  }

  function extractNamedDimensionStrings(text) {
    const source = String(text || '');
    if (isTubePrintRow(source)) {
      const tubeDim = extractPrintDimensionString(source);
      return tubeDim ? [tubeDim] : [];
    }
    const axisDim = extractAxisDimensionString(source);
    const pattern = /(?:([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,16})[:\uff1a]\s*)?(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm))/ig;
    const items = [];
    if (axisDim) items.push(axisDim);
    let match;
    while ((match = pattern.exec(source))) {
      let name = match[1] ? match[1].trim() : '';
      if (!name) {
        const before = source.slice(Math.max(0, match.index - 12), match.index);
        const implicit = before.match(/([\u4e00-\u9fa5A-Za-z0-9锛堬級()_-]{1,8})$/);
        name = implicit ? implicit[1].trim() : '';
      }
      const dim = normalizeDimensionText(match[2]);
      if (!dim) continue;
      if (items.includes(dim)) continue;
      items.push(name && !isGenericDimensionName(name) ? name + '\uff1a' + dim : dim);
    }
    return items;
  }

  function hasPrintDimensionText(text) {
    const source = String(text || '');
    return /\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm)/i.test(source) || !!extractAxisDimensionString(source);
  }

  function extractPrintDimensionString(text) {
    const source = String(text || '');
    const axisDim = extractAxisDimensionString(source);
    if (axisDim) return axisDim;
    const match = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,12}(\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,4}\s*(?:cm|mm))/i);
    return match ? normalizeDimensionText(match[1]) : '';
  }

  function extractAxisDimensionString(text) {
    const source = String(text || '');
    const match = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,12}(?:\u957f|\u5bbd|\u9ad8)?\s*(\d+(?:\.\d+)?)\s*(cm|mm)?\s*(?:[xX\u00d7*]\s*)?(?:\u957f|\u5bbd|\u9ad8)\s*(\d+(?:\.\d+)?)\s*(cm|mm)/i);
    if (!match) return '';
    const unit = (match[4] || match[2] || 'cm').toLowerCase();
    return normalizeDimensionParts([match[1], match[3]], unit);
  }

  function isGenericDimensionName(name) {
    return /^(?:\u5370\u5237|\u6807\u7b7e|\u5370\u5237\u5c3a\u5bf8|\u6807\u7b7e\u5c3a\u5bf8|\u5c3a\u5bf8)$/.test(String(name || '').trim());
  }

  function isTubePrintRow(row) {
    const text = String(row || '');
    return /\u5370\u5237(?:\u8f6f\u7ba1|\u7ba1|\u74f6|\u4e73\u6db2\u74f6)/.test(text) || (hasStrongTubeMaterialFeatures(text) && /\u5370\u5237(?:\u5c3a\u5bf8)?/.test(text));
  }

  function hasStrongTubeMaterialFeatures(text) {
    const source = String(text || '');
    if (/\u8f6f\u7ba1|\u767d\u7ba1|\u9ed1\u7ba1|(?:PE|pe)[^\s,，;；]{0,4}\u7ba1/.test(source)) return true;
    const structuralMarkers = ['\u7ba1\u5f84', '\u7ba1\u8eab', '\u5c01\u5c3e', '\u76d6\u5b50\u9ad8\u5ea6', '\u603b\u9ad8\u5ea6'].filter((marker) => source.includes(marker));
    return structuralMarkers.length >= 2;
  }

  function isTubePrintData(data) {
    const text = String(data.printRawText || '') + String(data.printSizeLabel || '') + String(data.printSizeText || '');
    if (data.tubeDiameter && data.tubeBody) return true;
    if (Boolean(data.isTubePrintMaterial) || isTubePrintRow(text)) return true;
    // A 2D print size plus a 3D carton also describes printed bags, so geometry alone is not tube evidence.
    const fallbackEvidence = [data.name, data.packageSizeLabel, data.packageSizeText].filter(Boolean).join(' ');
    return hasStrongTubeMaterialFeatures(fallbackEvidence) && hasPrintDimensionText(data.printSizeText);
  }

  function findTubeSizeSpec(text, fields) {
    const diameter = fields && fields.diameter ? fields.diameter : 0;
    const body = fields && fields.body ? fields.body : 0;
    if (!diameter || !body) return null;
    let spec = diameter && body ? TUBE_SIZE_SPECS.find((item) => item.diameter === diameter && item.body === body) : null;
    let rule = null;
    if (!spec && diameter && body) {
      rule = TUBE_SIZE_RULES.find((item) => item.diameter === diameter && item.bodies.includes(body));
      if (rule) spec = buildTubeSpecFromRule(rule, body);
    }
    if (!spec) return null;
    const tailSeal = (Number(spec.widths[1]) || 0) + (Number(spec.widths[2]) || 0);
    return {
      diameter,
      body,
      key: spec.key || (diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab'),
      widths: spec.widths.slice(),
      printSizeText: formatTubeSpecPrintSize(spec),
      segmentText: spec.widths.map(formatCmSegment).join('-') + 'cm',
      tailSealText: formatSingleDimension(tailSeal),
    };
  }

  function buildTubeSpecFromRule(rule, body) {
    const size = getTubeRulePrintSize(rule, body);
    return {
      key: rule.diameter + '\u7ba1\u5f84' + body + '\u7ba1\u8eab',
      diameter: rule.diameter,
      body,
      widths: rule.widths.slice(),
      width: size.width,
      height: size.height,
    };
  }

  function extractTubeFields(root) {
    if (!root) return { diameter: 0, body: 0, text: '' };
    const fullText = getVisibleText(root);
    const diameter = normalizeTubeMeasureText(getFormValueByLooseLabel('\u7ba1\u5f84', root)) || extractTubeMeasure(fullText, '\u7ba1\u5f84');
    const body = normalizeTubeMeasureText(getFormValueByLooseLabel('\u7ba1\u8eab', root)) || extractTubeMeasure(fullText, '\u7ba1\u8eab');
    const parts = [];
    if (diameter) parts.push('\u7ba1\u5f84 ' + diameter + 'mm');
    if (body) parts.push('\u7ba1\u8eab ' + body + 'mm');
    return { diameter, body, text: parts.join(' ') };
  }

  function extractTubePrintDimensionNums(text) {
    const source = String(text || '');
    const labeled = source.match(/\u5370\u5237(?:\u5c3a\u5bf8)?[^\d]{0,20}(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (labeled) {
      const unit = labeled[3].toLowerCase();
      return [normalizeDimensionUnitNumber(labeled[1], unit), normalizeDimensionUnitNumber(labeled[2], unit)];
    }
    const dimension = source.match(/(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (!dimension) return null;
    const unit = dimension[3].toLowerCase();
    return [normalizeDimensionUnitNumber(dimension[1], unit), normalizeDimensionUnitNumber(dimension[2], unit)];
  }

  function getTubeRulePrintSize(rule, body) {
    const width = rule.widths.reduce((sum, value) => sum + (Number(value) || 0), 0);
    const height = Math.max(0, (Number(body) || 0) / 10 - 0.1);
    return { width, height };
  }

  function formatTubeSpecPrintSize(spec) {
    if (!spec || !Number.isFinite(Number(spec.width)) || !Number.isFinite(Number(spec.height))) return '';
    return trimNumber(Number(spec.width)) + 'x' + trimNumber(Number(spec.height)) + 'cm';
  }

  function normalizeDimensionUnitNumber(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return String(unit || '').toLowerCase() === 'mm' ? num / 10 : num;
  }

  function extractTubeMeasure(text, label) {
    const source = String(text || '');
    const escaped = escapeRegExp(label);
    const labelPair = source.match(/\u7ba1\u5f84\s+\u7ba1\u8eab\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/i);
    if (labelPair) return normalizeTubeMeasureValue(label === '\u7ba1\u5f84' ? labelPair[1] : labelPair[2], '');
    const inlinePair = source.match(/\u7ba1\u5f84[^\d]{0,12}(\d+(?:\.\d+)?)\s*(mm|cm)?[^\u7ba1\d]{0,20}\u7ba1\u8eab[^\d]{0,12}(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
    if (inlinePair) {
      const diameterUnit = inlinePair[2] || inlinePair[4] || '';
      const bodyUnit = inlinePair[4] || inlinePair[2] || '';
      return label === '\u7ba1\u5f84'
        ? normalizeTubeMeasureValue(inlinePair[1], diameterUnit)
        : normalizeTubeMeasureValue(inlinePair[3], bodyUnit);
    }
    const labelIndex = source.search(new RegExp(escaped, 'i'));
    const scope = labelIndex >= 0 ? source.slice(labelIndex, labelIndex + 120) : source;
    const direct = scope.match(new RegExp(escaped + '[^\\d]{0,24}(\\d+(?:\\.\\d+)?)\\s*(mm|cm)?', 'i'));
    if (direct) return normalizeTubeMeasureValue(direct[1], direct[2]);
    const tableLike = scope.match(/(\d+(?:\.\d+)?)\s*(mm|cm)/i);
    if (tableLike) return normalizeTubeMeasureValue(tableLike[1], tableLike[2]);
    return 0;
  }

  function normalizeTubeMeasureText(text) {
    const match = String(text || '').match(/(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
    return match ? normalizeTubeMeasureValue(match[1], match[2]) : 0;
  }

  function normalizeTubeMeasureValue(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    const normalized = String(unit || '').toLowerCase() === 'cm' ? num * 10 : num;
    return Math.round(normalized);
  }

  function formatCmSegment(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    const text = String(number);
    return text.includes('.') ? text : text + '.0';
  }

  function getMaterialRows(root) {
    return Array.from(root.querySelectorAll('tr, .ant-table-row, [role="row"]'))
      .filter(isVisibleElement)
      .map((el) => compactText(el.innerText || el.textContent || ''))
      .flatMap(splitCombinedMaterialRow)
      .filter((text, idx, arr) => text && arr.indexOf(text) === idx);
  }

  function splitCombinedMaterialRow(text) {
    const source = String(text || '');
    const matches = Array.from(source.matchAll(/\bMTL\d+\b/gi));
    if (matches.length < 2) return [source];
    const starts = [];
    let previousCode = '';
    matches.forEach((match) => {
      const code = String(match[0] || '').toUpperCase();
      if (code !== previousCode) starts.push(Number(match.index) || 0);
      previousCode = code;
    });
    if (starts.length < 2) return [source];
    return starts.map((start, index) => source.slice(start, starts[index + 1] || source.length).trim()).filter(Boolean);
  }

  function extractNetContentFromMaterial(row) {
    const tabletMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*\u7247\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (tabletMatch) return trimNumber(Number(tabletMatch[1])) + 'TABLETS';
    const pcsMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*PCS?\s*(?:\/\s*(?:\u4ef6|\u76d2|\u74f6|\u888b))?/i);
    if (pcsMatch) return trimNumber(Number(pcsMatch[1])) + 'PC';
    const pairMatch = String(row || '').match(/(\d+(?:\.\d+)?)\s*\u5957\s*\/\s*\u76d2/i);
    if (pairMatch) {
      const count = Number(pairMatch[1]);
      return trimNumber(count) + (count === 1 ? 'PAIR' : 'PAIRS');
    }
    const match = String(row || '').match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|mL|l|L|\u514b|\u5343\u514b|\u6beb\u5347|\u5347)\s*\/\s*\u76d2/i);
    if (!match) return '';
    const unitMap = {
      '\u514b': 'g',
      '\u5343\u514b': 'kg',
      '\u6beb\u5347': 'ml',
      '\u5347': 'L',
    };
    const unit = unitMap[match[2]] || match[2];
    return trimNumber(Number(match[1])) + unit;
  }

  function extractDimensionString(text) {
    const matches = String(text || '').match(/\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?\s*(?:(?:cm|mm))?){1,4}\s*(?:cm|mm)/ig);
    if (!matches || !matches.length) return '';
    return normalizeDimensionText(matches[matches.length - 1]);
  }

  function normalizeDimensionText(text) {
    const source = String(text || '');
    const nums = source.match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) return '';
    const unitMatch = source.match(/(mm|cm)\s*$/i) || source.match(/\b(mm|cm)\b/i);
    return normalizeDimensionParts(nums, unitMatch ? unitMatch[1] : 'cm');
  }

  function normalizeDimensionParts(nums, unit) {
    const divisor = String(unit || '').toLowerCase() === 'mm' ? 10 : 1;
    return nums.map((n) => trimNumber(Number(n) / divisor)).join('x') + 'cm';
  }

  function extractOuterPackage(root) {
    const nums = [
      getFormValueByLabel('\u957f\uff08\u5916\u5305\u88c5\uff09', root),
      getFormValueByLabel('\u5bbd\uff08\u5916\u5305\u88c5\uff09', root),
      getFormValueByLabel('\u9ad8\uff08\u5916\u5305\u88c5\uff09', root),
    ].map(firstNumber);
    return nums.every((n) => Number.isFinite(n)) ? { packageNums: nums } : { packageNums: null };
  }

  function getPackageMaterialRowScore(row) {
    const text = String(row || '');
    if (!/\u5305\u6750/.test(text)) return 0;
    const name = extractMaterialName(text);
    const bagPattern = /(\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\u5b50)/;
    let score = 0;
    if (/\u7eb8\u76d2/.test(name)) score += 140;
    else if (bagPattern.test(name)) score += 120;
    if (/\u5305\u6750\s*-\s*\u7eb8\u76d2/.test(text)) score += 80;
    else if (new RegExp('\\u5305\\u6750\\s*-\\s*[^;]{0,36}' + bagPattern.source).test(text)) score += 35;
    if (/\u767d\u5361|\u9ed1\u5361|\u725b\u76ae\u7eb8|\u74e6\u695e/.test(text)) score += 10;
    if (/\u74f6|\u65cb\u76d6|\u6cf5\u5934|\u55b7\u5934|\u7f50|\u8f6f\u7ba1|\u6ef4\u7ba1|\u5237\u5934|\u76d6\u5b50/.test(name)) score -= 180;
    return score;
  }

  function extractInnerPackage(root) {
    const labelGroups = [
      ['\u957f（\u5185\u5305\u6750）', '\u957f（\u4ea7\u54c1）'],
      ['\u5bbd（\u5185\u5305\u6750）', '\u5bbd（\u4ea7\u54c1）'],
      ['\u9ad8（\u5185\u5305\u6750）', '\u9ad8（\u4ea7\u54c1）'],
    ];
    const nums = labelGroups.map((labels) => {
      const value = labels.map((label) => getFormValueByLabel(label, root)).find(Boolean) || '';
      return firstNumber(value);
    });
    return nums.every((value) => Number.isFinite(value) && value > 0) ? { productNums: nums } : { productNums: null };
  }

  function emptyPackaging() {
    return { packageSizeText: '', packageSizeLabel: '', packageCode: '', packageNums: null, hasInnerCard: false, printSizeText: '', printSizeLabel: '', printCode: '', netContent: '' };
  }

  function extractFoodSemiFinished(root) {
    const row = getMaterialRows(root).find((text) => /\u534a\u6210\u54c1/.test(text) && /\u98df\u54c1\u7c7b/.test(text) && /(\u80f6\u56ca|\u8f6f\u7cd6)/.test(text)) || '';
    if (!row) return emptyFoodSemiFinished();
    const dim = extractDimensionString(row);
    const nums = parseDimension(dim, 2);
    const productNums = nums && nums.length >= 2 ? [nums[0], nums[0], nums[1]] : null;
    const count = (row.match(/(\d+(?:\.\d+)?)\s*\u7c92/) || [])[1];
    const type = /\u8f6f\u7cd6/.test(row) ? 'GUMMIES' : 'CAPSULES';
    return {
      productNums,
      netContent: count ? trimNumber(Number(count)) + type : '',
    };
  }

  function emptyFoodSemiFinished() {
    return { productNums: null, netContent: '' };
  }

  function getBestNetContent(root) {
    return extractSpecModelNetContent(root);
  }

  function normalizeNetContentValue(value) {
    const text = compactText(value);
    if (!text) return '';
    const pcMatch = text.match(/(\d+(?:\.\d+)?)\s*PCS?\s*(?:\/\s*(?:\u4ef6|\u76d2|\u74f6|\u888b))?/i);
    if (pcMatch) return trimNumber(Number(pcMatch[1])) + 'PC';
    if (/^\d+(?:\.\d+)?\s*(CAPSULES|GUMMIES|TABLETS|PAIR|PAIRS|PC)$/i.test(text)) return text.replace(/\s+/g, '').toUpperCase();
    const capsuleMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\u7c92|\u80f6\u56ca)\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (capsuleMatch) return trimNumber(Number(capsuleMatch[1])) + 'CAPSULES';
    const tabletMatch = text.match(/(\d+(?:\.\d+)?)\s*\u7247\s*(?:\/\s*(?:\u76d2|\u74f6|\u888b))?/i);
    if (tabletMatch) return trimNumber(Number(tabletMatch[1])) + 'TABLETS';
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|\u514b|\u5343\u514b|\u6beb\u5347|\u5347)\s*(?:\/\s*[\u4e00-\u9fa5A-Za-z]+)?/i);
    if (weightMatch) {
      return formatNetContentAmount(weightMatch[1], weightMatch[2]);
    }
    return '';
  }

  function extractSpecModelNetContent(root) {
    const lines = getVisibleText(root).split('\n').map((line) => compactText(line)).filter(Boolean);
    for (let i = 0; i < lines.length; i += 1) {
      if (!/\u89c4\u683c\u578b\u53f7/.test(lines[i])) continue;
      const sameLine = lines[i].replace(/\u89c4\u683c\u578b\u53f7[:\uff1a]?/, '').trim();
      const candidates = [sameLine, lines[i + 1] || ''].filter(Boolean);
      for (const candidate of candidates) {
        const normalized = normalizeNetContentValue(candidate);
        if (normalized) return normalized;
      }
    }
    return '';
  }

  function formatNetContentAmount(amount, unitRaw) {
    const unitMap = { '\u514b': 'g', '\u5343\u514b': 'kg', '\u6beb\u5347': 'ml', '\u5347': 'L' };
    return trimNumber(Number(amount)) + (unitMap[unitRaw] || unitRaw);
  }

  function productNumsFromPackage(packageNums, hasInnerCard) {
    if (!Array.isArray(packageNums) || packageNums.length < 3) return null;
    const delta = hasInnerCard ? INNER_CARD_DELTA_CM : NORMAL_DELTA_CM;
    return packageNums.slice(0, 3).map((n) => Math.max(0, n - delta));
  }

  function formatDimensionPart(nums, index) {
    if (!Array.isArray(nums) || !Number.isFinite(nums[index])) return '';
    return formatSingleDimension(nums[index]);
  }

  function formatSingleDimension(value) {
    if (!Number.isFinite(Number(value))) return '';
    const cm = trimNumber(Number(value));
    const inch = trimNumber(Number(value) * CM_TO_INCH);
    return cm + 'cm/' + inch + 'inch';
  }

  function getFormValueByLabel(fieldLabel, root) {
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => normalizeFieldLabel(el.textContent) === fieldLabel);
    for (const labelEl of labels) {
      const item = labelEl.closest('.ant-form-item') || labelEl.parentElement;
      if (!item || !isVisibleElement(item)) continue;
      const controlValue = getVisibleFormControlValue(item);
      if (controlValue) return controlValue;
      const text = compactText(item.innerText || item.textContent || '');
      const value = text.replace(new RegExp('^' + escapeRegExp(fieldLabel) + '\\*?\\s*'), '').trim();
      const cleaned = cleanValue(value);
      if (cleaned) return cleaned;
    }
    return '';
  }

  function getFormValueByLooseLabel(fieldLabel, root) {
    const expected = normalizeLooseFieldLabel(fieldLabel);
    const labels = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
      .filter(isVisibleElement)
      .filter((el) => normalizeLooseFieldLabel(el.textContent) === expected);
    for (const labelEl of labels) {
      const item = labelEl.closest('.ant-form-item') || labelEl.closest('.ant-descriptions-item') || labelEl.parentElement;
      if (!item || !isVisibleElement(item)) continue;
      const controlValue = getVisibleFormControlValue(item);
      if (controlValue) return controlValue;
      const text = compactText(item.innerText || item.textContent || '');
      const value = text
        .replace(new RegExp('^' + escapeRegExp(normalizeFieldLabel(labelEl.textContent)) + '\\*?\\s*'), '')
        .replace(new RegExp('^' + escapeRegExp(fieldLabel) + '(?:\\s*[\\uff08(][^\\uff09)]*[\\uff09)])?\\*?\\s*'), '')
        .trim();
      const cleaned = cleanValue(value);
      if (cleaned) return cleaned;
    }
    return getFormValueByLabel(fieldLabel, root);
  }

  function getVisibleFormControlValue(item) {
    if (!item) return '';
    const control = Array.from(item.querySelectorAll('input, textarea, select'))
      .filter(isVisibleElement)
      .find((element) => cleanValue(element.value || element.getAttribute('value') || ''));
    if (control) return cleanValue(control.value || control.getAttribute('value') || '');
    const valueNode = Array.from(item.querySelectorAll('.ant-select-selection-item, .ant-input-number-input, .ant-descriptions-item-content'))
      .filter(isVisibleElement)
      .find((element) => cleanValue(element.innerText || element.textContent || ''));
    return valueNode ? cleanValue(valueNode.innerText || valueNode.textContent || '') : '';
  }

  function normalizeLooseFieldLabel(text) {
    return normalizeFieldLabel(text)
      .replace(/[\uff08(]\s*(?:mm|cm|kg|g|ml|l|\u6beb\u7c73|\u5398\u7c73|\u5343\u514b|\u514b|\u6beb\u5347|\u5347)\s*[\uff09)]/ig, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function normalizeWeight(raw) {
    if (!raw) return '';
    const match = String(raw).match(/(\d+(?:\.\d+)?)\s*(kg|\u5343\u514b|g|\u514b)/i);
    if (!match) return cleanValue(raw);
    const unit = /kg|\u5343\u514b/i.test(match[2]) ? 'kg' : 'g';
    return trimNumber(Number(match[1])) + unit;
  }

  function getGrossWeightValue(root) {
    const raw = getFormValueByLooseLabel('\u6bdb\u91cd', root);
    if (!raw) return '';
    if (/(?:kg|\u5343\u514b|g|\u514b)/i.test(raw)) return normalizeWeight(raw);
    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      const label = Array.from(root.querySelectorAll('label, .ant-form-item-label, .ant-descriptions-item-label, [class*="label"], [class*="Label"]'))
        .filter(isVisibleElement)
        .find((element) => normalizeLooseFieldLabel(element.textContent) === '\u6bdb\u91cd');
      const unitText = String(label && label.textContent || '');
      if (/(?:kg|\u5343\u514b)/i.test(unitText)) return normalizeWeight(raw + 'kg');
      if (/(?:g|\u514b)/i.test(unitText)) return normalizeWeight(raw + 'g');
    }
    return normalizeWeight(raw);
  }

  function cleanValue(value) {
    const text = compactText(value);
    if (!text || text === '--' || /^--\s*(g|kg|ml|mL|l|L|\u514b|\u5343\u514b|\u6beb\u5347|\u5347|\w*\([^)]*\))?/i.test(text)) return '';
    if (/^[\s:：*]*(\u51c0\u542b\u91cf|\u51c0\u91cd|\u6bdb\u91cd|\u89c4\u683c\u578b\u53f7|\u5bb9\u91cf)(\s+|\u3000)*(\u51c0\u542b\u91cf|\u51c0\u91cd|\u6bdb\u91cd|\u89c4\u683c\u578b\u53f7|\u5bb9\u91cf)?[\s:：*]*$/.test(text)) return '';
    return text;
  }

  function parseDimension(text, limit) {
    const nums = String(text || '').match(/\d+(?:\.\d+)?/g);
    if (!nums || nums.length < limit) return null;
    return nums.map(Number);
  }

  function appendChineseRemark(label, remark) {
    const base = label || L.packageSize;
    return new RegExp('\uff08' + escapeRegExp(remark) + '\uff09').test(base) ? base : base + '\uff08' + remark + '\uff09';
  }

  function firstNumber(text) {
    const match = String(text || '').match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function findSku(text) {
    return (text.match(/\u5546\u54c1\u7f16\u7801[:\uff1a]\s*(SKU\d+)/i) || text.match(/\b(SKU\d+)\b/i) || [])[1] || '';
  }

  function cleanName(name) {
    return compactText(name)
      .replace(/\s*(\u5546\u54c1\u7f16\u7801|\u7f8e\u5de5\u5904\u7406\u4f18\u5148\u7ea7|PRODUCT NAME)[:\uff1a].*$/i, '')
      .replace(/\s*[\uff08(]\d+[\uff09)]\s*$/g, '')
      .trim();
  }

  function findTabButton(root, text) {
    const candidates = Array.from(root.querySelectorAll('[role="tab"], .ant-tabs-tab, .ant-tabs-tab-btn, button, div'))
      .filter(isVisibleElement)
      .filter((el) => compactText(el.textContent) === text);
    return candidates.find((el) => el.getAttribute('role') === 'tab')
      || candidates.find((el) => String(el.className || '').includes('ant-tabs-tab-btn'))
      || candidates[0]
      || null;
  }

  function getActiveTabText(root) {
    const active = Array.from(root.querySelectorAll('[role="tab"], .ant-tabs-tab'))
      .filter(isVisibleElement)
      .find(isActiveTab);
    return active ? compactText(active.textContent) : '';
  }

  function isActiveTab(tab) {
    const tabRoot = tab.closest('.ant-tabs-tab') || tab;
    return /\bant-tabs-tab-active\b/.test(String(tabRoot.className || ''))
      || tab.getAttribute('aria-selected') === 'true';
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel) {
      if (panel.dataset.version !== SCRIPT_VERSION) {
        panel.remove();
        panel = null;
      } else {
        panel.dataset.version = SCRIPT_VERSION;
        return panel;
      }
    }
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.dataset.version = SCRIPT_VERSION;
    panel.innerHTML = '<div class="pfh-full"><div class="pfh-header"><div class="pfh-heading"><strong></strong><div class="pfh-search"><span class="pfh-search-box"><input type="search" name="plm-sku-search" role="searchbox" class="pfh-search-input" autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-lpignore="true" data-1p-ignore="true"><button type="button" class="pfh-search-clear" data-action="clear-search"></button></span><button type="button" data-action="search"></button></div></div><div class="pfh-actions"><button type="button" data-action="home-main"></button><button type="button" data-action="notifications"></button><button type="button" data-action="about"></button><button type="button" data-action="collapse"></button></div></div><div class="pfh-main"><aside class="pfh-list"></aside><div class="pfh-splitter" title="\u62d6\u52a8\u8c03\u6574\u5de6\u53f3\u5bbd\u5ea6"></div><div class="pfh-detail"></div></div><input type="file" class="pfh-import-file" accept="application/json,.json"><div class="pfh-resize-handle pfh-resize-n" data-resize-dir="n"></div><div class="pfh-resize-handle pfh-resize-e" data-resize-dir="e"></div><div class="pfh-resize-handle pfh-resize-s" data-resize-dir="s"></div><div class="pfh-resize-handle pfh-resize-w" data-resize-dir="w"></div><div class="pfh-resize-handle pfh-resize-ne" data-resize-dir="ne"></div><div class="pfh-resize-handle pfh-resize-nw" data-resize-dir="nw"></div><div class="pfh-resize-handle pfh-resize-se" data-resize-dir="se" title="\u62d6\u52a8\u8c03\u6574\u7a97\u53e3\u5927\u5c0f"></div><div class="pfh-resize-handle pfh-resize-sw" data-resize-dir="sw"></div></div>';
    document.documentElement.appendChild(panel);
    panel.querySelector('.pfh-heading').insertAdjacentHTML('afterbegin', '<button type="button" class="pfh-collection-mark" data-action="toggle-collection" role="switch" aria-label="\u6570\u636e\u91c7\u96c6">P</button>');
    panel.querySelector('strong').textContent = L.title;
    panel.querySelector('.pfh-search-input').placeholder = L.searchPlaceholder;
    panel.querySelector('.pfh-search-clear').textContent = '\u00d7';
    panel.querySelector('.pfh-search-clear').title = L.clearSearch;
    panel.querySelector('[data-action="search"]').innerHTML = '<span class="pfh-btn-text">' + escapeHtml(L.search) + '</span>';
    panel.querySelector('[data-action="search"]').title = TOOLTIP.search;
    panel.querySelector('[data-action="about"]').innerHTML = iconHtml('settings') + '<span>\u8bbe\u7f6e</span>';
    panel.querySelector('[data-action="about"]').removeAttribute('title');
    panel.querySelector('[data-action="about"]').setAttribute('aria-label', TOOLTIP.about);
    panel.querySelector('[data-action="about"]').setAttribute('data-tooltip', TOOLTIP.about);
    panel.querySelector('[data-action="home-main"]').innerHTML = iconHtml('home') + '<span>\u4e3b\u9875</span>';
    panel.querySelector('[data-action="home-main"]').removeAttribute('title');
    panel.querySelector('[data-action="home-main"]').setAttribute('aria-label', '\u4e3b\u9875');
    panel.querySelector('[data-action="home-main"]').setAttribute('data-tooltip', '\u4e3b\u9875');
    panel.querySelector('[data-action="notifications"]').innerHTML = iconHtml('notification') + '<span>\u901a\u77e5</span><i class="pfh-notification-badge" aria-hidden="true"></i>';
    panel.querySelector('[data-action="notifications"]').setAttribute('aria-label', '\u901a\u77e5');
    panel.querySelector('[data-action="notifications"]').setAttribute('data-tooltip', '\u901a\u77e5');
    panel.querySelector('[data-action="collapse"]').setAttribute('data-action', 'panel-close');
    panel.addEventListener('click', handlePanelClick);
    panel.addEventListener('contextmenu', handlePanelContextMenu);
    panel.addEventListener('keydown', handlePanelKeydown);
    panel.addEventListener('input', handlePanelInput);
    panel.addEventListener('paste', handlePanelPaste);
    panel.addEventListener('change', handlePanelChange);
    panel.addEventListener('dragover', handlePanelDragOver);
    panel.addEventListener('drop', handlePanelDrop);
    panel.querySelector('.pfh-import-file').addEventListener('change', handleImportFile);
    makeDraggable(panel, panel.querySelector('.pfh-header'));
    makeSplitterDraggable(panel, panel.querySelector('.pfh-splitter'));
    makePanelResizable(panel);
    applySavedPosition(panel);
    applyPanelSize(panel);
    applySplitWidth(panel);
    updatePanelPinButton(panel);
    return panel;
  }

  function ensureLauncher() {
    let launcher = document.getElementById(LAUNCHER_ID);
    if (!launcher) {
      launcher = document.createElement('button');
      launcher.id = LAUNCHER_ID;
      launcher.type = 'button';
      launcher.textContent = L.mini;
      launcher.addEventListener('click', handleLauncherClick, true);
      document.documentElement.appendChild(launcher);
      makeLauncherDraggable(launcher);
    }
    positionLauncher(launcher);
    return launcher;
  }

  function expandPanel() {
    state.expanded = true;
    state.userCollapsedPanel = false;
    state.manuallyCollapsedForSku = '';
    state.ignoreOutsideClickUntil = Date.now() + 250;
    const panel = ensurePanel();
    panel.style.display = 'block';
    panel.classList.remove('is-collapsed', 'is-hover-resetting');
    window.clearTimeout(state.tooltipSuppressTimer);
    state.tooltipSuppressTimer = window.setTimeout(() => {
      panel.classList.remove('is-tooltip-suppressed');
    }, 260);
    ensureLauncher();
    renderShell();
  }

  function togglePanelVisible() {
    if (isPanelVisible()) collapsePanel(true);
    else expandPanel();
  }

  function stopLauncherEvent(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleLauncherClick(event) {
    stopLauncherEvent(event);
    const now = Date.now();
    if (now < state.launcherSuppressClickUntil) return;
    if (now - state.launcherClickAt < 350) return;
    state.launcherClickAt = now;
    togglePanelVisible();
  }

  function collapsePanel(force) {
    if (!force && window.getSelection && String(window.getSelection()).trim()) return;
    if (!force && state.drawer && state.sku) state.manuallyCollapsedForSku = state.sku;
    state.userCollapsedPanel = true;
    state.expanded = false;
    const panel = ensurePanel();
    panel.classList.add('is-collapsed', 'is-tooltip-suppressed', 'is-hover-resetting');
    suppressPanelTooltips(panel);
    panel.style.display = 'none';
    ensureLauncher();
    renderShell(L.noDrawer);
    resetPanelActionHover(panel);
    window.clearTimeout(state.hoverResetTimer);
    state.hoverResetTimer = window.setTimeout(() => {
      const current = document.getElementById(PANEL_ID);
      if (current) current.classList.remove('is-hover-resetting');
    }, 350);
  }

  function suppressPanelTooltips(scope) {
    const panel = document.getElementById(PANEL_ID);
    const root = panel && scope && panel.contains(scope) ? panel : (panel || scope);
    if (!root) return;
    if (root.classList) root.classList.add('is-tooltip-suppressed');
    if (document.activeElement && root.contains && root.contains(document.activeElement) && document.activeElement.blur) {
      document.activeElement.blur();
    }
    resetPanelActionHover(root);
  }

  function resetPanelActionHover(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('.pfh-header .pfh-actions button').forEach((button) => {
      if (button.blur) button.blur();
      const clone = button.cloneNode(true);
      button.replaceWith(clone);
    });
  }

  function isPanelVisible() {
    const panel = document.getElementById(PANEL_ID);
    return Boolean(panel && panel.style.display !== 'none' && !panel.classList.contains('is-collapsed'));
  }

  function updatePanelPinButton(panel) {
    const button = panel && panel.querySelector('[data-action="panel-close"]');
    if (!button) return;
    button.innerHTML = iconHtml('close') + '<span>' + escapeHtml(L.close) + '</span>';
    button.removeAttribute('title');
    button.setAttribute('aria-label', TOOLTIP.collapse);
    button.setAttribute('data-tooltip', TOOLTIP.collapse);
  }

  function updateSettingsNotice(panel) {
    const button = panel && panel.querySelector('[data-action="about"]');
    if (!button) return;
    button.classList.toggle('has-notice', !state.settings.backgroundNoticeSeen);
  }

  function updateCollectionSwitch(panel) {
    const button = panel && panel.querySelector('.pfh-collection-mark');
    if (!button) return;
    const enabled = Boolean(state.settings.collectionEnabled);
    button.classList.toggle('is-on', enabled);
    button.setAttribute('aria-checked', String(enabled));
    button.title = enabled ? '\u6570\u636e\u91c7\u96c6\u5df2\u5f00\u542f' : '\u6570\u636e\u91c7\u96c6\u5df2\u5173\u95ed';
  }

  function renderShell(statusText) {
    const panel = ensurePanel();
    panel.dataset.view = state.view || 'home';
    panel.classList.toggle('is-ledger-fullscreen', state.view === 'ledger' && Boolean(state.ledgerFullscreen));
    const main = panel.querySelector('.pfh-main');
    const isFullView = state.view === 'home' || state.view === 'about' || state.view === 'ledger' || state.view === 'upload' || state.view === 'unitConverter' || state.view === 'tools';
    if (main) {
      main.classList.toggle('is-home', state.view === 'home');
      main.classList.toggle('is-full', isFullView);
    }
    const scrollSnapshot = capturePanelScroll(panel);
    updatePanelPinButton(panel);
    updateSettingsNotice(panel);
    updateNotificationButton(panel);
    updateCollectionSwitch(panel);
    renderUploadProgressOverlay(panel);
    renderFirstRunTutorialModal(panel);
    renderNotificationModal(panel);
    if (state.view === 'home') {
      renderHome(panel, statusText);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload') {
      const list = panel.querySelector('.pfh-list');
      if (list) list.innerHTML = '';
    }
    else if (state.view !== 'about' && state.view !== 'ledger' && state.view !== 'unitConverter' && state.view !== 'tools') renderSkuList(panel);
    if (state.view === 'about') {
      renderAbout(panel);
      updateSettingsNotice(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'ledger') {
      renderLedger(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'upload') {
      renderUpload(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'unitConverter') {
      renderStandaloneTool(panel, unitConverterViewHtml());
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'tools') {
      renderStandaloneTool(panel, toolsViewHtml());
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'sizeImage') {
      renderSizeImage(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    if (state.view === 'parameterImage') {
      renderParameterImage(panel);
      restorePanelScroll(panel, scrollSnapshot);
      return;
    }
    renderDetail(panel, statusText);
    restorePanelScroll(panel, scrollSnapshot);
  }

  function renderUploadProgressOverlay(panel) {
    if (!panel) return;
    const queue = state.uploadQueue || loadUploadQueue();
    const currentUpload = getCurrentRunningUpload(queue);
    const oldInlineOverlay = panel.querySelector('.pfh-upload-progress-pop');
    if (oldInlineOverlay) oldInlineOverlay.remove();
    let overlay = document.getElementById(PANEL_ID + '-upload-progress');
    if (!currentUpload) {
      if (overlay) overlay.remove();
      return;
    }
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = PANEL_ID + '-upload-progress';
      overlay.className = 'pfh-upload-progress-pop';
      document.documentElement.appendChild(overlay);
    }
    const percent = getUploadStepProgress(currentUpload.step);
    overlay.innerHTML = '<div class="pfh-upload-progress-icon">' + iconHtml('upload') + '</div>' +
      '<div class="pfh-upload-progress-main"><strong>' + escapeHtml(currentUpload.sku + '-' + (currentUpload.step || '\u5904\u7406\u4e2d')) + '</strong>' +
      '<div><span style="width:' + percent + '%"></span></div></div>' +
      '<b>' + percent + '%</b>';
    positionUploadProgressOverlay(panel, overlay);
  }

  function positionUploadProgressOverlay(panel, overlay) {
    if (!panel || !overlay) return;
    const rect = panel.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width * 0.58, 220), 320);
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + Math.max(0, (rect.width - width) / 2)));
    const aboveTop = rect.top - 54;
    const top = aboveTop >= 12 ? aboveTop : Math.min(window.innerHeight - 50, rect.bottom + 8);
    overlay.style.width = width + 'px';
    overlay.style.left = left + 'px';
    overlay.style.top = Math.max(12, top) + 'px';
    overlay.classList.toggle('is-below', aboveTop < 12);
  }

  function getUploadStepProgress(step) {
    const text = String(step || '');
    if (/\u6253\u5f00\u5546\u54c1|\u51c6\u5907/.test(text)) return 12;
    if (/\u68c0\u67e5\u65e7\u5185\u5bb9|\u6e05\u7406/.test(text)) return 22;
    if (/\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599/.test(text)) return 38;
    if (/\u4e0a\u4f20\u56fe\u5305\u7d20\u6750/.test(text)) return 52;
    if (/\u6279\u91cf\u4e0a\u4f20|\u5339\u914d\u8868\u5355/.test(text)) return 68;
    if (/\u63d0\u5ba1/.test(text)) return 82;
    if (/\u4fdd\u5b58\u8349\u7a3f|\u5173\u95ed/.test(text)) return 92;
    return 18;
  }

  function capturePanelScroll(panel) {
    const selectors = ['.pfh-sku-scroll', '.pfh-detail-scroll', '.pfh-upload-list', '.pfh-ledger-list'];
    return selectors.reduce((snapshot, selector) => {
      const node = panel && panel.querySelector(selector);
      if (node) snapshot[selector] = { top: node.scrollTop, left: node.scrollLeft };
      return snapshot;
    }, {});
  }

  function restorePanelScroll(panel, snapshot) {
    if (!snapshot) return;
    window.requestAnimationFrame(() => {
      Object.keys(snapshot).forEach((selector) => {
        const node = panel && panel.querySelector(selector);
        const pos = snapshot[selector];
        if (!node || !pos) return;
        node.scrollTop = pos.top || 0;
        node.scrollLeft = pos.left || 0;
      });
    });
  }

  function renderAbout(panel) {
    const detail = panel.querySelector('.pfh-detail');
    const cloudBody = '<label class="pfh-cloud-key"><span>' + escapeHtml(L.cloudBackupKey) + '</span><input type="text" class="pfh-cloud-backup-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="' + escapeHtml(L.cloudBackupPlaceholder) + '" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label>' +
      '<div class="pfh-about-actions"><button type="button" data-action="cloud-backup-save">' + escapeHtml(L.cloudBackupSave) + '</button><button type="button" data-action="cloud-backup-restore">' + escapeHtml(L.cloudBackupRestore) + '</button><span class="pfh-cloud-status">' + escapeHtml(getCloudBackupStatusText()) + '</span></div>';
    const preferenceBody = [
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelKeywordSetting) + '</span><label><input type="radio" name="pfh-keyword-mode" value="brandName"' + (state.settings.excelKeywordMode === 'brandName' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordBrandName) + '</label><label><input type="radio" name="pfh-keyword-mode" value="english"' + (state.settings.excelKeywordMode === 'english' ? ' checked' : '') + '> ' + escapeHtml(L.excelKeywordEnglish) + '</label></div>',
      '<div class="pfh-setting-row"><span>' + escapeHtml(L.excelDownloadSetting) + '</span><label><input type="radio" name="pfh-download-mode" value="picker"' + (state.settings.excelDownloadMode === 'picker' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadPicker) + '</label><label><input type="radio" name="pfh-download-mode" value="direct"' + (state.settings.excelDownloadMode === 'direct' ? ' checked' : '') + '> ' + escapeHtml(L.excelDownloadDirect) + '</label></div>',
    ].join('');
    const cacheBody = '<div class="pfh-about-actions"><button type="button" data-action="export-cache">' + escapeHtml(L.exportCache) + '</button><button type="button" data-action="import-cache">' + escapeHtml(L.importCache) + '</button></div>';
    detail.innerHTML = [
      '<div class="pfh-detail-scroll"><section class="pfh-section pfh-about-section pfh-settings-page">',
      '<div class="pfh-settings-hero"><div><h3 data-action="developer-settings-tap">' + escapeHtml(L.settingsTitle) + '</h3><p>\u4e91\u5907\u4efd\u3001\u8fd0\u884c\u504f\u597d\u548c\u8c03\u8bd5\u8bb0\u5f55</p></div><span>v' + escapeHtml(SCRIPT_VERSION) + ' / ' + escapeHtml(String(state.index.length)) + ' \u4e2a\u7f16\u7801</span></div>',
      desktopBridgeSettingsHtml(),
      '<div class="pfh-cloud-backup pfh-settings-card"><div class="pfh-settings-card-head"><strong>' + escapeHtml(L.cloudBackupTitle) + '</strong><span>\u4f18\u5148</span></div>' + cloudBody + '</div>',
      state.developerInsightsUnlocked ? renderInsightsSection() : '',
      renderLogSection(),
      '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>\u5bfc\u51fa\u504f\u597d</strong><span>Excel</span></div>' + preferenceBody + '</div>',
      '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>\u672c\u5730\u7f13\u5b58</strong><span>\u5907\u4efd\u8fc1\u79fb</span></div>' + cacheBody + '</div>',
      state.developerToolsOpen ? renderDeveloperTools() : '',
      '</section></div>',
    ].join('');
  }

  function renderFirstRunTutorialModal(panel) {
    const existing = panel.querySelector('.pfh-first-run-backdrop');
    if (existing) existing.remove();
    if (!state.tutorialModalOpen) return;
    const overlay = document.createElement('div');
    overlay.className = 'pfh-first-run-backdrop';
    overlay.innerHTML = '<section class="pfh-first-run-dialog" role="dialog" aria-modal="true" aria-label="\u4f7f\u7528\u5f15\u5bfc">' +
      '<div class="pfh-first-run-head"><strong>\u6b22\u8fce\u4f7f\u7528 PLM \u60ac\u6d6e\u52a9\u624b</strong><span>\u9996\u6b21\u5f15\u5bfc</span></div>' +
      '<ol>' +
        '<li><b>1</b><p>\u6253\u5f00\u4efb\u610f\u4ea7\u54c1\u8be6\u60c5\u9875\uff0c\u6b63\u5f0f\u542f\u52a8\u7a0b\u5e8f\u3002</p></li>' +
        '<li><b>2</b><p>\u62d6\u52a8\u7a97\u53e3\u8c03\u6574\u5230\u5408\u9002\u4f4d\u7f6e\uff0c\u8ba9\u5b83\u4fdd\u6301\u8212\u670d\u7684\u5de5\u4f5c\u59ff\u52bf\u3002</p></li>' +
        '<li><b>3</b><div><p>\u5728\u6d4f\u89c8\u5668\u5c5e\u6027\u300c\u76ee\u6807\u300d\u680f\u672b\u5c3e\u6dfb\u52a0\u53c2\u6570\uff1a</p><code>--disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding</code><p>\u907f\u514d\u6d4f\u89c8\u5668\u9000\u5230\u540e\u53f0\u540e\u6682\u505c\u4efb\u52a1\uff0c\u8ba9\u81ea\u52a8\u4e0a\u4f20\u5b89\u9759\u5730\u7ee7\u7eed\u5de5\u4f5c\u3002</p></div></li>' +
        '<li><b>4</b><div><p>\u5148\u8bbe\u7f6e\u4e00\u4e32\u4ec5\u4f60\u77e5\u9053\u7684\u4e91\u5907\u4efd\u5bc6\u94a5\uff08\u81f3\u5c11 4 \u4f4d\uff09\u3002\u5b83\u7528\u6765\u533a\u5206\u548c\u627e\u56de\u4f60\u81ea\u5df1\u7684\u5907\u4efd\u3002</p><label class="pfh-tutorial-key"><span>\u5907\u4efd\u5bc6\u94a5</span><input type="text" class="pfh-tutorial-cloud-key" value="' + escapeHtml(state.settings.cloudBackupKey || '') + '" placeholder="\u8bf7\u8f93\u5165\u81f3\u5c11 4 \u4f4d\u5bc6\u94a5" minlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true"></label></div></li>' +
      '</ol>' +
      '<button type="button" data-action="first-run-tutorial-done"' + (getCloudBackupKey().length >= 4 ? '' : ' aria-disabled="true"') + '>\u5f00\u59cb\u4f7f\u7528</button>' +
    '</section>';
    panel.appendChild(overlay);
  }

  function renderDeveloperTools() {
    return '<div class="pfh-developer-backdrop" data-action="developer-tools-close">' +
      '<section class="pfh-developer-dialog" role="dialog" aria-modal="true" aria-label="开发者工具">' +
        '<div><strong>开发者工具</strong><span>当前布局</span></div>' +
        '<p>复制窗口、唤起按钮、尺寸和左右分隔栏数据，用于设定新用户首次打开时的默认布局。</p>' +
        '<button type="button" data-action="developer-layout-copy">复制当前布局</button>' +
        '<button type="button" data-action="developer-tools-close">关闭</button>' +
      '</section>' +
    '</div>';
  }

  function renderInsightsSection() {
    const insights = state.insights || emptyInsights();
    const priceCount = Array.isArray(insights.priceHistory) ? insights.priceHistory.length : 0;
    const issueCount = Array.isArray(insights.dataIssues) ? insights.dataIssues.length : 0;
    const typeCount = insights.typeStats && typeof insights.typeStats === 'object' ? Object.keys(insights.typeStats).length : 0;
    const summary = priceCount || issueCount || typeCount
      ? '\u4ef7\u683c ' + priceCount + '\u6761 / \u5f02\u5e38 ' + issueCount + '\u6761 / \u7c7b\u578b ' + typeCount + '\u7c7b'
      : L.insightsEmpty;
    const cloudStatus = state.insightCloudStatus ? '<p class="pfh-insight-status">' + escapeHtml(state.insightCloudStatus) + '</p>' : '';
    return '<div class="pfh-log-panel pfh-insights-panel pfh-settings-card"><div class="pfh-log-head"><strong>' + escapeHtml(L.insightsTitle) + '</strong><span>' + escapeHtml(summary) + '</span></div>' + renderInsightAiModelPicker() + '<div class="pfh-about-actions"><button type="button" data-action="insights-readiness">\u4f53\u68c0</button><button type="button" data-action="tips-manage">' + escapeHtml(L.loadingTipsManage) + '</button><button type="button" data-action="insights-cloud-summary">' + escapeHtml(L.insightsCloudSummary) + '</button><button type="button" data-action="insights-ai-classify">\u0041\u0049\u603b\u7ed3\u89c4\u5219</button><button type="button" data-action="insights-apply-classify">\u91cd\u65b0\u5e94\u7528\u89c4\u5219</button><button type="button" data-action="insights-view-classify">\u67e5\u770b\u89c4\u5219</button><button type="button" data-action="insights-refresh-rules">\u5237\u65b0\u89c4\u5219</button><button type="button" data-action="insights-check-ai">' + escapeHtml(L.insightsCheckAi) + '</button><button type="button" data-action="insights-copy-ai">' + escapeHtml(L.insightsCopyAi) + '</button><button type="button" data-action="insights-copy-rules">' + escapeHtml(L.insightsCopyRules) + '</button><button type="button" data-action="insights-copy-report">' + escapeHtml(L.insightsCopyReport) + '</button><button type="button" data-action="export-insights">' + escapeHtml(L.insightsExport) + '</button><button type="button" data-action="clear-insights">' + escapeHtml(L.insightsClear) + '</button></div>' + cloudStatus + renderInsightReadinessPanel() + renderClassificationRulesPanel() + renderMaintainedCleaningRules() + '</div>';
  }

  function renderInsightAiModelPicker() {
    const current = getInsightAiModelSetting();
    return '<div class="pfh-setting-row pfh-ai-model-row"><span>' + escapeHtml(L.insightsAiModel) + '</span>' +
      '<label><input type="radio" name="pfh-ai-model" value="glm-4.7-flash"' + (current === 'glm-4.7-flash' ? ' checked' : '') + '> GLM-4.7-Flash</label>' +
      '<label><input type="radio" name="pfh-ai-model" value="' + MODELSCOPE_INSIGHT_MODEL + '"' + (current === MODELSCOPE_INSIGHT_MODEL ? ' checked' : '') + '> 魔搭 Qwen3.5-397B-A17B</label>' +
      '</div>';
  }

  function renderClassificationRulesPanel() {
    const rules = Array.isArray(state.classificationRules) ? state.classificationRules : [];
    if (!rules.length) return '';
    const categoryCount = rules.filter((rule) => rule.kind === 'category').length;
    const packageCount = rules.filter((rule) => rule.kind === 'packageType').length;
    const rows = rules.slice(0, 10).map((rule) => {
      const keywords = Array.isArray(rule.keywords) ? rule.keywords.slice(0, 8).join(' / ') : '';
      return '<div class="pfh-rule-mini"><b>' + escapeHtml((rule.kind === 'packageType' ? '\u5305\u6750 ' : '\u54c1\u7c7b ') + (rule.label || '')) + '</b><small>' + escapeHtml(keywords) + '</small></div>';
    }).join('');
    return '<div class="pfh-rule-maintenance-summary"><strong>\u5546\u54c1\u5206\u7c7b\u89c4\u5219</strong><span>\u54c1\u7c7b ' + categoryCount + ' / \u5305\u6750 ' + packageCount + '</span>' + rows + '</div>';
  }

  function renderInsightReadinessPanel() {
    const data = state.insightReadiness;
    if (!data) return '';
    const checks = Array.isArray(data.checks) ? data.checks : [];
    const passed = checks.filter((item) => item.ok).length;
    const summary = (data.ready ? '\u5df2\u5c31\u7eea' : '\u672a\u5c31\u7eea') + ' / ' + passed + '/' + checks.length;
    const rows = checks.length ? checks.map((item) => {
      const ok = item.ok ? ' is-ok' : ' is-bad';
      return '<div class="pfh-readiness-row' + ok + '">' +
        '<span>' + escapeHtml(item.ok ? '\u901a\u8fc7' : '\u672a\u901a\u8fc7') + '</span>' +
        '<b>' + escapeHtml(item.label || item.key || '') + '</b>' +
        '<small>' + escapeHtml(item.detail || '') + '</small>' +
      '</div>';
    }).join('') : '<div class="pfh-empty">\u6682\u65e0\u4f53\u68c0\u7ed3\u679c</div>';
    const blockers = Array.isArray(data.blockers) && data.blockers.length
      ? '<p class="pfh-readiness-blockers">' + escapeHtml(data.blockers.map((item) => (item.label || item.key || '') + '\uff1a' + (item.detail || '')).join(' / ')) + '</p>'
      : '';
    const ruleSummary = renderRuleMaintenanceSummary(data.ruleMaintenance);
    return '<div class="pfh-readiness-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u94fe\u8def\u4f53\u68c0</strong><span>' + escapeHtml(summary) + '</span></div>' + rows + blockers + ruleSummary + '</div>';
  }

  function renderRuleMaintenanceSummary(ruleMaintenance) {
    if (!ruleMaintenance || !ruleMaintenance.total) return '';
    const topRules = Array.isArray(ruleMaintenance.topRules) ? ruleMaintenance.topRules : [];
    const status = ruleMaintenance.byStatus && typeof ruleMaintenance.byStatus === 'object'
      ? Object.keys(ruleMaintenance.byStatus).map((key) => key + ' ' + ruleMaintenance.byStatus[key]).join(' / ')
      : '';
    const rows = topRules.length ? topRules.map((rule) => {
      const detail = [rule.priority, rule.status, rule.action, rule.examples ? '例：' + rule.examples : ''].filter(Boolean).join(' / ');
      return '<div class="pfh-rule-mini"><b>' + escapeHtml(rule.field || rule.ruleId || '') + '</b><small>' + escapeHtml(detail) + '</small></div>';
    }).join('') : '';
    return '<div class="pfh-rule-maintenance-summary"><strong>\u89c4\u5219\u7ef4\u62a4\u6458\u8981</strong><span>' + escapeHtml(status || ('\u603b\u6570 ' + ruleMaintenance.total)) + '</span>' + rows + '</div>';
  }

  function renderMaintainedCleaningRules() {
    const rules = Array.isArray(state.maintainedCleaningRules) ? state.maintainedCleaningRules.slice(0, 8) : [];
    if (!state.maintainedCleaningRulesLoaded) {
      return '<div class="pfh-rule-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u6e05\u6d17\u89c4\u5219</strong><span>\u672a\u52a0\u8f7d</span></div><div class="pfh-empty">\u70b9\u51fb\u201c\u5237\u65b0\u89c4\u5219\u201d\u67e5\u770b\u53ef\u7ef4\u62a4\u7684\u89c4\u5219\u72b6\u6001</div></div>';
    }
    if (!rules.length) {
      return '<div class="pfh-rule-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u6e05\u6d17\u89c4\u5219</strong><span>0</span></div><div class="pfh-empty">\u6682\u65e0\u89c4\u5219</div></div>';
    }
    const rows = rules.map((rule) => {
      const status = rule.maintenanceStatus || rule.computedMaintenanceStatus || '\u5f85\u590d\u6838';
      const detail = [rule.actionLabel, rule.reason].filter(Boolean).join(' / ');
      const diagnostic = formatMaintainedRuleDiagnostic(rule);
      return '<div class="pfh-rule-row">' +
        '<div><b>' + escapeHtml(rule.priority || 'P3') + ' ' + escapeHtml(rule.missingField || rule.ruleId || '') + '</b><small>' + escapeHtml(detail || rule.ruleId || '') + '</small></div>' +
        '<span>' + escapeHtml(status) + '</span>' +
        (diagnostic ? '<p>' + escapeHtml(diagnostic) + '</p>' : '') +
        '<div class="pfh-rule-actions">' +
          '<button type="button" data-action="insights-rule-auto" data-rule-id="' + escapeHtml(rule.ruleId || '') + '">\u81ea\u52a8</button>' +
          '<button type="button" data-action="insights-rule-done" data-rule-id="' + escapeHtml(rule.ruleId || '') + '">\u5df2\u5904\u7406</button>' +
          '<button type="button" data-action="insights-rule-ignore" data-rule-id="' + escapeHtml(rule.ruleId || '') + '">\u5ffd\u7565</button>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="pfh-rule-panel"><div class="pfh-log-head"><strong>\u4e91\u7aef\u6e05\u6d17\u89c4\u5219</strong><span>' + escapeHtml(String(state.maintainedCleaningRules.length)) + '</span></div><div class="pfh-rule-list">' + rows + '</div></div>';
  }

  function formatMaintainedRuleDiagnostic(rule) {
    if (!rule) return '';
    const parts = [];
    if (Number(rule.count || 0)) parts.push('\u6b21\u6570 ' + rule.count);
    if (rule.likelyPlmEmpty) parts.push('PLM\u7a7a\u503c');
    const kinds = Array.isArray(rule.issueKinds) ? rule.issueKinds.slice(0, 3).filter(Boolean).join('/') : '';
    if (kinds) parts.push(kinds);
    const examples = Array.isArray(rule.examples) ? rule.examples.slice(0, 2).filter(Boolean).join(' / ') : '';
    if (examples) parts.push('\u4f8b\u5b50 ' + examples);
    return parts.join(' | ');
  }

  function renderLogSection() {
    const logs = (state.logs || []).slice(0, 80);
    const rows = logs.length ? logs.map((item) => {
      const level = item.level || 'info';
      return '<div class="pfh-log-row is-' + escapeHtml(level) + '"><span>' + escapeHtml(item.time || '') + '</span><b>' + escapeHtml(level.toUpperCase()) + '</b><p>' + escapeHtml(item.message || '') + '</p></div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(L.logEmpty) + '</div>';
    return '<div class="pfh-log-panel pfh-runtime-log-panel"><div class="pfh-log-head"><strong>' + escapeHtml(L.logTitle) + '</strong><span>' + escapeHtml(String((state.logs || []).length)) + '</span></div><div class="pfh-about-actions"><button type="button" data-action="copy-logs">' + escapeHtml(L.logCopy) + '</button><button type="button" data-action="clear-logs">' + escapeHtml(L.logClear) + '</button></div><div class="pfh-log-list">' + rows + '</div></div>';
  }

  function renderUpload(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.classList.remove('is-loading');
    detail.innerHTML = uploadPanelHtml();
  }

  function renderSkuList(panel) {
    const list = panel.querySelector('.pfh-list');
    const query = state.searchQuery.trim();
    const searchTokens = parseSearchTokens(query);
    const allItems = sortSkuListItems(getSearchMatches(searchTokens));
    const listMode = getSkuListMode();
    const pageSize = listMode === 'waterfall' ? 20 : 10;
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state.skuPage = clamp(state.skuPage || 1, 1, totalPages);
    const items = allItems.slice((state.skuPage - 1) * pageSize, state.skuPage * pageSize);
    const listTitle = state.view === 'sizeImage' ? '\u5c3a\u5bf8\u56fe SKU' : (state.view === 'parameterImage' ? '\u53c2\u6570\u56fe SKU' : 'SKU\u5217\u8868');
    const listSort = getSkuListSort();
    const listSortLabel = listSort === 'acquired' ? '\u83b7\u53d6\u65f6\u95f4' : '\u5206\u914d\u65f6\u95f4';
    const listSortMenu = '<div class="pfh-export-menu pfh-sku-sort-menu' + (state.skuSortMenuOpen ? ' is-open' : '') + '">' +
      '<button type="button" class="pfh-export-menu-button" data-action="sku-sort-toggle" aria-expanded="' + (state.skuSortMenuOpen ? 'true' : 'false') + '"><span>' + escapeHtml(listSortLabel) + '</span><i></i></button>' +
      '<div class="pfh-export-menu-list">' +
        '<button type="button" data-action="sku-list-sort" data-sort="assigned" class="' + (listSort === 'assigned' ? 'is-active' : '') + '">\u5206\u914d\u65f6\u95f4</button>' +
        '<button type="button" data-action="sku-list-sort" data-sort="acquired" class="' + (listSort === 'acquired' ? 'is-active' : '') + '">\u83b7\u53d6\u65f6\u95f4</button>' +
      '</div></div>';
    const listTools = '<div class="pfh-sku-list-toolbar"><div class="pfh-sku-view-switch" role="group" aria-label="SKU\u5217\u8868\u89c6\u56fe">' +
      '<button type="button" data-action="sku-list-mode" data-mode="list" class="' + (listMode === 'list' ? 'is-active' : '') + '">\u5217\u8868</button>' +
      '<button type="button" data-action="sku-list-mode" data-mode="waterfall" class="' + (listMode === 'waterfall' ? 'is-active' : '') + '">\u7011\u5e03\u6d41</button></div>' +
      '<label class="pfh-sku-sort"><span>\u6392\u5e8f</span>' + listSortMenu + '</label></div>';
    const listHead = '<div class="pfh-list-head"><button type="button" data-action="home-back" aria-label="\u8fd4\u56de\u4e3b\u9875">' + iconHtml('backArrow') + '</button><strong>' + listTitle + '</strong><span>\u5171 ' + allItems.length + ' \u6761</span></div>' + listTools;
    const pager = '<div class="pfh-list-pager"><div><button type="button" data-action="sku-page-prev"' + (state.skuPage <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager('sku-page', state.skuPage, totalPages) + '<button type="button" data-action="sku-page-next"' + (state.skuPage >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    if (!allItems.length) {
      list.innerHTML = listHead + '<div class="pfh-sku-scroll"><div class="pfh-empty">' + escapeHtml(searchTokens.length ? L.noSearchResult : L.emptyList) + '</div></div>' + pager;
      return;
    }
    const searchToolbar = searchTokens.length
      ? '<div class="pfh-search-result-toolbar"><button type="button" data-action="pin-search-results">全部置顶</button><span>' + escapeHtml(L.searchResult + ': ' + allItems.length) + '</span></div>'
      : '';
    const cards = items.map((item) => {
      const active = item.sku === state.selectedSku ? ' is-active' : '';
      const pinned = item.pinned ? ' is-pinned' : '';
      const title = [item.brand, item.name, item.sku].filter(Boolean).join(' ');
      const pinTitle = item.pinned ? TOOLTIP.unpin : TOOLTIP.pin;
      const pinControl = active ? '<em data-pin-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(pinTitle) + '">' + iconHtml('pin') + '</em>' : '';
      if (listMode === 'waterfall') {
        const data = normalizeData(loadData(item.sku) || item);
        const image = getSkuListImageUrl(data);
        const imageHtml = image ? '<img src="' + escapeHtml(image) + '" alt="" loading="lazy" decoding="async">' : iconHtml('image');
        const productName = data.name || item.name || '\u672a\u547d\u540d\u4ea7\u54c1';
        return '<button type="button" class="pfh-sku-waterfall-card' + active + pinned + '" data-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(title) + '">' +
          '<span class="pfh-sku-waterfall-thumb">' + imageHtml + '</span><span class="pfh-sku-waterfall-meta"><b>' + escapeHtml(productName) + '</b></span></button>';
      }
      return '<button type="button" class="pfh-sku' + active + pinned + '" data-sku="' + escapeHtml(item.sku) + '" title="' + escapeHtml(title) + '">' +
        '<span><b>' + escapeHtml(item.sku) + '</b>' + pinControl + '</span>' +
        ([item.brand, item.name].filter(Boolean).join(' ') ? '<small>' + escapeHtml([item.brand, item.name].filter(Boolean).join(' ')) + '</small>' : '') +
        '</button>';
    }).join('');
    list.innerHTML = listHead + '<div class="pfh-sku-scroll' + (listMode === 'waterfall' ? ' is-waterfall' : '') + '">' + searchToolbar + (listMode === 'waterfall' ? '<div class="pfh-sku-waterfall-grid">' + cards + '</div>' : cards) + '</div>' + pager;
  }

  function renderHome(panel, statusText) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    const first = state.index[0] ? normalizeData(loadData(state.index[0].sku) || state.index[0]) : null;
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = homeViewHtml(statusText, first);
  }

  function renderStandaloneTool(panel, html) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = html;
  }

  function renderSizeImage(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.classList.remove('is-loading');
    detail.innerHTML = sizeImageViewHtml();
  }

  function renderParameterImage(panel) {
    const detail = panel.querySelector('.pfh-detail');
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    detail.classList.remove('is-loading');
    detail.innerHTML = parameterImageFeature.viewHtml(data || {});
  }

  function renderLedger(panel) {
    ensureLedgerInteractionStyles();
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    const records = getLedgerRecordsForMonth(state.ledgerView, getCurrentLedgerMonth());
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = ledgerViewHtml(records);
  }

  function ensureLedgerInteractionStyles() {
    const styleId = PANEL_ID + '-ledger-interaction-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      '#' + PANEL_ID + ' .pfh-ledger-list{isolation:isolate!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-day{position:relative!important;z-index:0!important;overflow:visible!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-day:has(.pfh-ledger-item.is-menu-open){z-index:90!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-clickable{position:relative!important;z-index:0!important;cursor:pointer!important;transform:none!important;transform-origin:50% 55%!important;transition:transform .46s cubic-bezier(.18,.88,.32,1.08),border-color .3s cubic-bezier(.22,1,.36,1),background .3s cubic-bezier(.22,1,.36,1),box-shadow .44s cubic-bezier(.16,1,.3,1)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-clickable:hover{z-index:2!important;transform:scale(1.008)!important;border-color:#b9a7ff!important;background:linear-gradient(135deg,#fff,#faf7ff)!important;box-shadow:0 15px 32px rgba(91,62,180,.15)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-clickable.is-menu-open,#' + PANEL_ID + ' .pfh-ledger-item.is-clickable.is-menu-open:hover{z-index:100!important;transform:scale(1.006)!important;border-color:#ad98f8!important;box-shadow:0 18px 38px rgba(91,62,180,.18)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-clickable .pfh-ledger-thumb{transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .4s cubic-bezier(.16,1,.3,1)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-clickable:hover .pfh-ledger-thumb{transform:translate3d(0,-1px,0) scale(1.025)!important;box-shadow:0 7px 16px rgba(83,60,168,.12)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-menu-open .pfh-ledger-more{position:relative!important;z-index:101!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-menu-open .pfh-ledger-overflow-menu{z-index:102!important;pointer-events:auto!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-overflow-menu button.is-active{background:#eee8ff!important;color:#6030cf!important;font-weight:700!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-page:has(.pfh-ledger-performance){grid-template-rows:auto auto auto auto minmax(0,1fr)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance{display:grid!important;gap:8px!important;min-height:58px!important;padding:10px 16px!important;border:1px solid rgba(139,92,246,.20)!important;border-radius:14px!important;background:linear-gradient(135deg,rgba(248,245,255,.96),rgba(255,255,255,.94))!important;box-shadow:0 9px 24px rgba(91,62,180,.08)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance-summary{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;min-width:0!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance-summary>div{display:grid!important;gap:3px!important;min-width:0!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance span{color:#5e36cc!important;font-size:12px!important;font-weight:700!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance small{color:#8a83a3!important;font-size:10px!important;line-height:1.35!important;white-space:normal!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance strong{flex:0 0 auto!important;color:#6d35e8!important;font-size:27px!important;font-weight:750!important;line-height:1!important;letter-spacing:-.03em!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-performance strong::after{content:" 分"!important;margin-left:3px!important;color:#9b87db!important;font-size:10px!important;font-weight:600!important;letter-spacing:0!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-groups{border-top:1px solid rgba(139,92,246,.13)!important;padding-top:7px!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-groups summary{color:#6b4bc2!important;font-size:10px!important;font-weight:700!important;cursor:pointer!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-list{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:6px!important;max-height:88px!important;overflow:auto!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-group{display:flex!important;align-items:center!important;gap:7px!important;max-width:100%!important;padding:5px 8px!important;border:1px solid rgba(139,92,246,.17)!important;border-radius:8px!important;background:rgba(255,255,255,.78)!important;color:#756c88!important;font:inherit!important;font-size:9px!important;text-align:left!important;cursor:pointer!important;transition:border-color .18s ease,background .18s ease,box-shadow .18s ease!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-group:hover{border-color:#9f85f5!important;background:#f4f0ff!important;box-shadow:0 5px 14px rgba(91,62,180,.11)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-group b{flex:0 0 auto!important;color:#6336cd!important;font-size:9px!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-merge-group span{overflow:hidden!important;color:#756c88!important;font-size:9px!important;font-weight:500!important;text-overflow:ellipsis!important;white-space:nowrap!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-group-highlighted{z-index:4!important;border-color:#7c3aed!important;background:linear-gradient(135deg,#f4efff,#fff)!important;box-shadow:0 0 0 3px rgba(124,58,237,.18),0 16px 34px rgba(91,62,180,.20)!important;transform:scale(1.012)!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-tags .is-extension,#' + PANEL_ID + ' .pfh-ledger-tags .is-performance-group{border-color:#cabcf7!important;background:#f3efff!important;color:#6537ce!important;font-weight:700!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-toolbar .pfh-ledger-performance-merge{border-color:#a991f4!important;background:#f4f0ff!important;color:#6737d5!important;font-weight:650!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-toolbar .pfh-ledger-performance-merge:hover{border-color:#7c3aed!important;background:#ebe4ff!important;color:#5525c4!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-toolbar .pfh-ledger-performance-merge:disabled{border-color:#ded9ed!important;background:#f5f4f8!important;color:#aaa5b7!important;cursor:not-allowed!important;opacity:.72!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-clickable:focus-visible{outline:3px solid rgba(124,58,237,.22)!important;outline-offset:2px!important;border-color:#9b7cf5!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-tags button.is-sku{flex:0 1 auto!important;max-width:130px!important;height:21px!important;min-height:21px!important;padding:0 7px!important;overflow:hidden!important;border-radius:999px!important;font-size:10px!important;font-weight:500!important;line-height:19px!important;text-overflow:ellipsis!important;white-space:nowrap!important;cursor:copy!important;transition:transform .18s ease,background .18s ease,border-color .18s ease!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-tags button.is-sku:hover{transform:translateY(-1px)!important;border-color:#9f85f5!important;background:#f0ebff!important;color:#6036d8!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-trash-actions{display:flex!important;align-items:center!important;gap:7px!important;margin-left:auto!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-trash-actions button{min-height:30px!important;padding:0 12px!important;border:1px solid #d9d3e8!important;border-radius:9px!important;background:#fff!important;color:#6b647a!important;font-size:11px!important;cursor:pointer!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-trash-actions button.is-restore{border-color:#bdaaf7!important;background:#f2edff!important;color:#6433d5!important;font-weight:650!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-trash-actions button.is-delete{color:#a44c5c!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-item.is-trash{cursor:default!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-hero-actions{display:flex!important;align-items:center!important;gap:8px!important;margin-left:auto!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-hero-actions>span{white-space:nowrap!important;}' +
      '#' + PANEL_ID + ' .pfh-ledger-fullscreen-toggle{min-height:30px!important;padding:0 10px!important;border:1px solid rgba(124,58,237,.28)!important;border-radius:9px!important;background:#f4f0ff!important;color:#6232cf!important;font-size:11px!important;font-weight:700!important;cursor:pointer!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen{position:fixed!important;inset:12px!important;width:calc(100vw - 24px)!important;height:calc(100vh - 24px)!important;max-width:none!important;max-height:none!important;z-index:2147483647!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen .pfh-resize-handle{display:none!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen .pfh-ledger-list{gap:10px!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen .pfh-ledger-day{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(430px,1fr))!important;gap:9px!important;align-items:start!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen .pfh-ledger-day>h4{grid-column:1/-1!important;margin-bottom:0!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen .pfh-ledger-item{min-width:0!important;min-height:104px!important;padding:9px!important;}' +
      '#' + PANEL_ID + '.is-ledger-fullscreen .pfh-ledger-performance{padding:8px 13px!important;}' +
      '@media(max-width:940px){#' + PANEL_ID + '.is-ledger-fullscreen .pfh-ledger-day{grid-template-columns:minmax(0,1fr)!important;}#' + PANEL_ID + ' .pfh-ledger-hero-actions>span{display:none!important;}}' +
      '@media (prefers-reduced-motion:reduce){#' + PANEL_ID + ' .pfh-ledger-item.is-clickable,#' + PANEL_ID + ' .pfh-ledger-item.is-clickable .pfh-ledger-thumb{transition:none!important;}#' + PANEL_ID + ' .pfh-ledger-item.is-clickable:hover,#' + PANEL_ID + ' .pfh-ledger-item.is-clickable.is-menu-open{transform:none!important;}}';
    document.documentElement.appendChild(style);
  }

  function ensureSkuDataInteractionStyles() {
    const styleId = PANEL_ID + '-sku-data-interaction-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      '#' + PANEL_ID + ' .pfh-info-grid .pfh-row:hover{border-color:rgba(139,92,246,.58)!important;background:linear-gradient(135deg,rgba(250,247,255,.94),rgba(255,255,255,.82))!important;box-shadow:0 8px 20px rgba(91,62,180,.12),inset 0 1px 0 rgba(255,255,255,.94)!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions{flex-wrap:wrap!important;justify-content:flex-start!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions .is-primary{border-color:rgba(124,58,237,.38)!important;background:#eee8ff!important;color:#6030cf!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions .pfh-title-edit-data{display:inline-flex!important;width:34px!important;min-width:34px!important;padding:0!important;align-items:center!important;justify-content:center!important;border-color:rgba(124,58,237,.28)!important;background:#f3efff!important;color:#7040d8!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions .pfh-title-edit-data:hover{border-color:#8b5cf6!important;background:#e9e1ff!important;color:#5b21b6!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions .pfh-title-edit-data .pfh-icon{display:inline-flex!important;flex:0 0 16px!important;width:16px!important;min-width:16px!important;height:16px!important;margin:0!important;padding:0!important;align-items:center!important;justify-content:center!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;line-height:1!important;box-sizing:content-box!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions .pfh-title-edit-data .pfh-icon svg{display:block!important;width:16px!important;height:16px!important;}' +
      '#' + PANEL_ID + ' .pfh-title-actions .pfh-title-edit-data .pfh-icon svg,#' + PANEL_ID + ' .pfh-title-actions .pfh-title-edit-data .pfh-icon path{fill:currentColor!important;stroke:none!important;}' +
      '#' + PANEL_ID + ' .pfh-sku-edit-input{grid-column:1/-1!important;width:100%!important;min-width:0!important;height:31px!important;box-sizing:border-box!important;padding:0 9px!important;border:1px solid rgba(139,92,246,.34)!important;border-radius:9px!important;outline:none!important;background:rgba(255,255,255,.95)!important;color:#292337!important;font:inherit!important;box-shadow:0 0 0 0 rgba(124,58,237,0)!important;transition:border-color .18s ease,box-shadow .18s ease!important;}' +
      '#' + PANEL_ID + ' .pfh-sku-edit-input:focus{border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(139,92,246,.14)!important;}' +
      '#' + PANEL_ID + ' .pfh-smart-category-input{display:inline-block!important;width:92px!important;min-width:72px!important;height:25px!important;box-sizing:border-box!important;margin:0 2px!important;padding:0 7px!important;border:1px solid rgba(139,92,246,.42)!important;border-radius:7px!important;outline:none!important;background:#fff!important;color:#4d2aad!important;font:inherit!important;font-weight:700!important;vertical-align:middle!important;}' +
      '#' + PANEL_ID + ' .pfh-smart-category-input:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.13)!important;}' +
      '#' + PANEL_ID + ' .pfh-row.is-sku-editing{cursor:text!important;border-color:rgba(139,92,246,.30)!important;background:rgba(250,248,255,.82)!important;}' +
      '#' + PANEL_ID + ' .pfh-row.is-sku-editing .pfh-value,#' + PANEL_ID + ' .pfh-row.is-sku-editing .pfh-row-actions{display:none!important;}' +
      '#' + PANEL_ID + ' .pfh-data-change-alert{margin:0 0 11px;padding:12px 14px;border:1px solid rgba(245,158,11,.38);border-radius:14px;background:linear-gradient(135deg,rgba(255,251,235,.98),rgba(255,247,237,.94));box-shadow:0 10px 24px rgba(180,83,9,.10);}' +
      '#' + PANEL_ID + ' .pfh-data-change-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:#8a4b08;font-size:12px;}' +
      '#' + PANEL_ID + ' .pfh-data-change-head strong{font-size:13px;}' +
      '#' + PANEL_ID + ' .pfh-data-change-head button{min-height:26px;padding:0 10px;border:1px solid rgba(180,83,9,.25);border-radius:999px;background:rgba(255,255,255,.76);color:#92400e;font-size:11px;cursor:pointer;}' +
      '#' + PANEL_ID + ' .pfh-data-change-list{display:grid;gap:7px;}' +
      '#' + PANEL_ID + ' .pfh-data-change-item{display:grid;grid-template-columns:70px minmax(0,1fr);gap:8px;align-items:start;font-size:11px;line-height:1.45;}' +
      '#' + PANEL_ID + ' .pfh-data-change-item>span{color:#9a6a30;font-weight:700;}' +
      '#' + PANEL_ID + ' .pfh-data-change-values{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:center;min-width:0;}' +
      '#' + PANEL_ID + ' .pfh-data-change-values del{color:#a15d63;text-decoration:none;overflow-wrap:anywhere;}' +
      '#' + PANEL_ID + ' .pfh-data-change-values i{color:#b28a57;font-style:normal;}' +
      '#' + PANEL_ID + ' .pfh-data-change-values ins{color:#5f32c6;font-weight:700;text-decoration:none;overflow-wrap:anywhere;}' +
      '#' + PANEL_ID + ' .pfh-sparkle-entrance-icon{display:inline-block!important;flex:0 0 auto!important;width:17px!important;height:17px!important;vertical-align:-3px!important;margin-right:4px!important;}' +
      '@media(max-width:680px){#' + PANEL_ID + ' .pfh-data-change-item{grid-template-columns:1fr;}#' + PANEL_ID + ' .pfh-data-change-values{grid-template-columns:1fr;}#' + PANEL_ID + ' .pfh-data-change-values i{transform:rotate(90deg);justify-self:start;}}';
    document.documentElement.appendChild(style);
  }

  function skuDataChangeAlertHtml(data) {
    const changes = getStoredDataChanges(data).slice(0, 8);
    if (!changes.length) return '';
    const rows = changes.map((change) => '<div class="pfh-data-change-item"><span>' + escapeHtml(change.label) + '</span><div class="pfh-data-change-values"><del>' + escapeHtml(change.before || '未识别') + '</del><i>→</i><ins>' + escapeHtml(change.after || '已清空') + '</ins></div></div>').join('');
    return '<div class="pfh-data-change-alert" role="status"><div class="pfh-data-change-head"><strong>SKU 数据有更新，请核对</strong><button type="button" data-action="sku-changes-ack">已核对</button></div><div class="pfh-data-change-list">' + rows + '</div></div>';
  }

  function renderDetail(panel, statusText) {
    ensureSkuDataInteractionStyles();
    const detail = panel.querySelector('.pfh-detail');
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    const openingDetail = state.openingProjectDetail || statusText === L.openingDetail;
    const loading = openingDetail || state.scanRunning || state.copywritingLoading || statusText === L.scanning || statusText === L.checkingMaterial;
    detail.classList.toggle('is-loading', loading);
    if (openingDetail) {
      const main = panel.querySelector('.pfh-main');
      if (main) main.classList.remove('is-home');
      detail.innerHTML = renderStatusHtml(L.openingDetail) + '<div class="pfh-detail-scroll"></div>';
      return;
    }
    if (!data) {
      if (loading) {
        const main = panel.querySelector('.pfh-main');
        if (main) main.classList.remove('is-home');
        detail.innerHTML = renderStatusHtml(statusText) + '<div class="pfh-detail-scroll"></div>';
      } else {
        detail.innerHTML = homeViewHtml(statusText, null);
      }
      return;
    }
    state.data = normalizeData(data);
    if (!state.copywritingMode) {
      scheduleInsightRecommendation(state.data);
    }
    const main = panel.querySelector('.pfh-main');
    if (main) main.classList.remove('is-home');
    if (state.copywritingMode) {
      detail.innerHTML = [
        '<div class="pfh-detail-scroll pfh-copywriting-scroll">',
        productHeroSectionHtml(state.data, true),
        copywritingViewHtml(state.data),
        '</div>',
      ].join('');
      return;
    }
    detail.innerHTML = [
      renderStatusHtml(statusText),
      '<div class="pfh-detail-scroll">',
      productHeroSectionHtml(state.data, false),
      skuDataChangeAlertHtml(state.data),
      '<div class="pfh-info-grid">',
      rowHtml('packageCode', L.packageCode, state.data.packageCode),
      rowHtml('printCode', L.printCode, state.data.printCode),
      rowHtml('packageSizeText', state.data.packageSizeLabel || L.packageSize, state.data.packageSizeText || L.noPackage),
      rowHtml('printSizeText', state.data.printSizeLabel || L.printSize, formatPrintSizeDisplay(state.data) || L.noPrint),
      '</div>',
      '</section>',
      '<section class="pfh-section pfh-graphic-section"><div class="pfh-section-title pfh-graphic-title"><h3>' + escapeHtml(L.graphicSection) + '</h3>' + toyCopywritingButtonHtml(state.data) + excelTriggerHtml() + '</div>' + toyCopywritingFeedbackHtml(state.data) + '<div class="pfh-excel-options-row">' + excelOptionsHtml() + '</div>',
      '<div class="pfh-graphic-table pfh-info-grid">',
      rowHtml('packageLength', L.cartonLength, state.data.packageLength || L.noDimension),
      rowHtml('productLength', state.data.isTubePrint ? L.tailSealLength : L.productLength, state.data.isTubePrint ? (state.data.productLength || L.noDimension) : (state.data.productLength || L.noDimension), { editable: state.data.isTubePrint }),
      rowHtml('packageWidth', L.cartonWidth, state.data.packageWidth || L.noDimension),
      rowHtml('productWidth', L.productWidth, state.data.productWidth || L.noDimension),
      rowHtml('packageHeight', L.cartonHeight, state.data.packageHeight || L.noDimension),
      rowHtml('productHeight', L.productHeight, state.data.productHeight || L.noDimension),
      rowHtml('netContent', L.netContent, state.data.netContent || L.unknown),
      rowHtml('grossWeight', L.grossWeight, state.data.grossWeight || L.unknown),
      '</div>' + insightRecommendationHtml(state.data) + '</section>',
      '</div>',
      '<div class="pfh-note"><span class="pfh-note-source">' + escapeHtml(state.data.updatedAt ? (L.updatedAt + ': ' + state.data.updatedAt) : '') + '</span><span class="pfh-note-toast" aria-live="polite"></span><button type="button" data-action="refresh" title="' + escapeHtml(TOOLTIP.refresh) + '">' + iconHtml('refresh') + '</button></div>',
    ].join('');
  }

  function productHeroSectionHtml(data, copywritingMode) {
    const title = [data && data.brand, data && data.name].filter(Boolean).join(' ') || formatTitleMeta(data) || L.noDrawer;
    const actions = copywritingMode
      ? '<div class="pfh-copywriting-hero-actions">' +
          '<button type="button" class="is-primary" data-action="copywriting-back">' + iconHtml('back') + '返回数据</button>' +
          '<button type="button" data-action="copywriting-copy">' + copywritingCopyIconHtml() + '复制全文</button>' +
          '<button type="button" data-action="copywriting-refresh">' + iconHtml('refresh') + '重新获取</button>' +
        '</div>'
      : '<div class="pfh-title-actions"><button type="button" class="pfh-title-open-detail" data-action="open-detail">打开详情</button><button type="button" class="pfh-title-open-detail" data-action="copywriting-open">文案</button>' +
          (state.skuEditMode
            ? '<button type="button" class="pfh-title-open-detail is-primary" data-action="sku-edit-save">保存校准</button><button type="button" class="pfh-title-open-detail" data-action="sku-edit-cancel">取消</button>'
            : '<button type="button" class="pfh-title-open-detail pfh-title-edit-data" data-action="sku-edit-open" title="编辑数据" aria-label="编辑数据">' + iconHtml('edit') + '</button>') +
        '</div>';
    return '<section class="pfh-section pfh-file-section' + (copywritingMode ? ' pfh-copywriting-hero-section' : '') + '"><div class="pfh-product-hero"><div class="pfh-title-meta" title="' + escapeHtml(L.copyHint) + '">' +
      productThumbHtml(data) +
      '<div class="pfh-product-title-copy"><span data-action="copy-sku">' + escapeHtml((data && data.sku) || L.sku) + '</span><strong data-action="copy-title-meta">' + escapeHtml(title) + '</strong>' + actions + '</div>' +
      '</div></div>' + (copywritingMode ? '</section>' : '');
  }

  function copywritingCopyIconHtml() {
    return '<svg class="pfh-copywriting-copy-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';
  }

  function copywritingCopiedIconHtml() {
    return '<svg class="pfh-copywriting-copied-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m7.5 12.2 3 3 6-6"></path></svg>';
  }

  function isCopywritingFileViewSection(section) {
    return Boolean(section && section.key !== 'directionsChinese');
  }

  function copywritingViewHtml(data) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (state.copywritingLoading && !(record && record.fullText)) {
      return '<section class="pfh-copywriting-page is-loading"><div class="pfh-copywriting-empty"><span class="pfh-copywriting-spinner"></span><strong>正在读取产品文案</strong><p>' + escapeHtml(state.copywritingStatus || '正在定位产品信息里的 Word 附件...') + '</p></div></section>';
    }
    const errorHtml = state.copywritingError
      ? '<div class="pfh-copywriting-alert is-error"><strong>文案读取未完成</strong><span>' + escapeHtml(state.copywritingError) + '</span></div>'
      : '';
    if (!record || !record.fullText) {
      return '<section class="pfh-copywriting-page">' + errorHtml + '<div class="pfh-copywriting-empty"><strong>还没有可展示的文案</strong><p>点击重新获取后，脚本会读取产品信息里的产品文案 Word。</p></div></section>';
    }
    const changed = new Set(record.changedSectionKeys || []);
    const copied = new Set(record.copiedSectionKeys || []);
    const view = state.copywritingView === 'full' ? 'full' : 'file';
    const visibleSections = record.sections.filter(isCopywritingFileViewSection);
    const copiedCount = visibleSections.filter((section) => copied.has(section.key)).length;
    const updateHtml = record.updatePending
      ? '<div class="pfh-copywriting-alert is-update"><strong>文案已更新</strong><span>' + escapeHtml(formatCopywritingUpdateSummary(record)) + '</span><button type="button" data-action="copywriting-ack">我知道了</button></div>'
      : '';
    const loadingHtml = state.copywritingLoading
      ? '<div class="pfh-copywriting-alert is-update"><strong>正在更新文案</strong><span>' + escapeHtml(state.copywritingStatus || '已显示历史内容，正在读取新的文案文件...') + '</span></div>'
      : '';
    const missingHtml = record.missingSections && record.missingSections.length
      ? '<div class="pfh-copywriting-alert is-warning"><strong>部分字段缺失</strong><span>' + escapeHtml(record.missingSections.join('、')) + '</span></div>'
      : '';
    const toolbarHtml = '<div class="pfh-copywriting-toolbar"><label><span>查看方式</span><select class="pfh-copywriting-view-select" aria-label="选择文案查看方式">' +
      '<option value="file"' + (view === 'file' ? ' selected' : '') + '>文件视图</option>' +
      '<option value="full"' + (view === 'full' ? ' selected' : '') + '>全文视图</option>' +
      '</select></label><span class="pfh-copywriting-progress">' + (view === 'file' ? ('已复制 ' + copiedCount + ' / ' + visibleSections.length + ' · 点击卡片右侧按钮复制') : '完整展示全部文案内容') + '</span></div>';
    const contentHtml = view === 'full'
      ? '<div class="pfh-copywriting-full-card' + (record.copiedFullText ? ' is-copied' : '') + '"><div class="pfh-copywriting-block-head"><span><b>全文</b><small>全部文案内容</small></span><button type="button" data-action="copywriting-copy">' + (record.copiedFullText ? copywritingCopiedIconHtml() + '已复制全文' : copywritingCopyIconHtml() + '复制全文') + '</button></div><pre>' + escapeHtml(record.fullText) + '</pre></div>'
      : visibleSections.map((section, index) => {
          const isCopied = copied.has(section.key);
          return '<div class="pfh-copywriting-block' + (changed.has(section.key) ? ' is-changed' : '') + (isCopied ? ' is-copied' : '') + '" data-copywriting-key="' + escapeHtml(section.key) + '">' +
            '<div class="pfh-copywriting-block-head"><span><b>' + String(index + 1).padStart(2, '0') + '</b><strong>' + escapeHtml(section.label || section.key) + '</strong></span><button type="button" data-action="copywriting-section-copy" data-copywriting-key="' + escapeHtml(section.key) + '">' + (isCopied ? copywritingCopiedIconHtml() + '已复制本段' : copywritingCopyIconHtml() + '复制本段') + '</button></div>' +
            '<pre>' + escapeHtml(section.text) + '</pre>' + (isCopied ? '<div class="pfh-copywriting-copied-note">' + copywritingCopiedIconHtml() + '<span>已复制：' + escapeHtml(section.label || section.key) + '</span></div>' : '') + '</div>';
        }).join('');
    return '<section class="pfh-copywriting-page">' + errorHtml + loadingHtml + updateHtml + missingHtml + toolbarHtml + '<div class="pfh-copywriting-content is-' + view + '">' + contentHtml + '</div></section>';
  }

  function copywritingSectionCopyValue(section) {
    if (!section || !section.text) return '';
    const lines = String(section.text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const first = lines[0] || '';
    if (/^(?:DISTRIBUTED BY|ADDRESS|EU REP|UK REP|US REP)$/i.test(first)) return lines.slice(1).join('\n');
    const inlineHeading = first.match(/^\s*[A-Z][A-Z0-9 /().-]*\s*[:\uff1a]\s*(.*)$/);
    if (!inlineHeading) return lines.join('\n');
    const body = lines.slice(1);
    if (inlineHeading[1]) body.unshift(inlineHeading[1].trim());
    return body.filter(Boolean).join('\n');
  }

  function isToyCopywritingProduct(data) {
    if (!data) return false;
    const productType = getProductTypeForInsight(data, null);
    return productType === '\u73a9\u5177' || /\u73a9\u5177|\u516c\u4ed4|\u73a9\u5076|\u634f\u634f|\u79ef\u6728|\u76f2\u76d2|\u53f2\u83b1\u59c6|\u89e3\u538b|\btoy\b|\bdoll\b/i.test(getClassificationText(data));
  }

  function isFoodEntryCopywritingProduct(data) {
    if (!data || !/\u5165\u53e3/.test(String(data.name || ''))) return false;
    const manualCategory = normalizeManualProductCategory(data.manualCategory);
    if (manualCategory) return manualCategory === '\u98df\u54c1';
    const text = [data.name, data.manualCategory, data.plmCategory, data.aiProductType, data.aiCategory, data.departmentName].filter(Boolean).join(' ');
    return /\u98df\u54c1|\u4fdd\u5065|\u6ecb\u8865|\u81b3\u98df|\u8425\u517b|\u80f6\u56ca|\u8f6f\u7cd6|\u56fa\u4f53\u996e\u6599|\u7c89/i.test(text);
  }

  function toyCopywritingButtonHtml(data) {
    if (!data || !data.sku) return '';
    const isToy = isToyCopywritingProduct(data);
    const isFoodEntry = isFoodEntryCopywritingProduct(data);
    const isIngredientOnly = !isToy && !isFoodEntry;
    const label = isFoodEntry ? '\u667a\u80fd\u8865\u5145\u98df\u54c1\u6587\u6848' : (isToy ? '\u667a\u80fd\u8865\u5145\u73a9\u5177\u6587\u6848' : '\u8865\u5168\u6210\u5206');
    const hasError = Boolean(data && data.sku && state.toyCopywritingErrorSku === data.sku && state.toyCopywritingError);
    return '<button type="button" class="pfh-toy-copywriting-button' + (state.toyCopywritingBusy ? ' is-busy' : '') + (hasError ? ' is-error' : '') + '" data-action="toy-copywriting-fill"' + (state.toyCopywritingBusy ? ' disabled' : '') + '>' +
      (state.toyCopywritingBusy ? '<span class="pfh-toy-copywriting-spinner"></span>' + (isIngredientOnly ? '\u6210\u5206\u8865\u5145\u4e2d' : '\u667a\u80fd\u8865\u5145\u4e2d') : (hasError && !isToy ? '\u26a0 ' + (isFoodEntry ? '\u98df\u54c1\u6587\u6848\u8865\u5145\u5931\u8d25' : '\u6210\u5206\u8865\u5145\u5931\u8d25') : sparkleEntranceIconHtml() + '<span>' + label + '</span>')) + '</button>';
  }

  function sparkleEntranceIconHtml() {
    return '<svg class="pfh-sparkle-entrance-icon" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">' +
      '<path d="M571.993043 77.913043a89.043478 89.043478 0 0 1 87.485218 69.676522l43.52 194.003478A18.921739 18.921739 0 0 0 716.8 356.173913l192.333913 50.309565a89.043478 89.043478 0 0 1 22.928696 163.06087l-171.074783 101.398261a18.810435 18.810435 0 0 0-9.238261 17.474782l11.130435 198.455652a89.043478 89.043478 0 0 1-89.043478 94.608696 87.485217 87.485217 0 0 1-58.434783-22.260869L466.031304 827.770435a18.810435 18.810435 0 0 0-12.577391-4.786087 18.587826 18.587826 0 0 0-6.90087 1.335652l-185.09913 72.347826a91.492174 91.492174 0 0 1-33.391304 6.344348 89.043478 89.043478 0 0 1-81.363479-124.883478l78.692174-182.427826a19.144348 19.144348 0 0 0-2.782608-19.70087L96.946087 422.288696a89.043478 89.043478 0 0 1 68.452174-145.808696 80.806957 80.806957 0 0 1 8.904348 0l197.89913 18.476522h1.78087a18.810435 18.810435 0 0 0 15.582608-8.236522l107.297392-166.956522A87.485217 87.485217 0 0 1 571.993043 77.913043" fill="#FFD652"/><path d="M505.433043 546.393043l-418.83826-222.608695a87.04 87.04 0 0 1 86.483478-46.747826l193.669565 18.031304a27.714783 27.714783 0 0 0 15.026087-2.671304z" fill="#FFCD69"/><path d="M588.02087 78.692174l-82.476522 467.478261-123.881739-253.996522a28.382609 28.382609 0 0 0 11.130434-10.128696l104.96-163.84a87.707826 87.707826 0 0 1 90.267827-39.513043z" fill="#FFC952"/><path d="M709.008696 349.829565L505.544348 546.281739l82.476522-467.478261a87.373913 87.373913 0 0 1 71.123478 67.895652l42.629565 189.885218a27.603478 27.603478 0 0 0 7.234783 13.245217z" fill="#FFC248"/><path d="M975.693913 480.389565l-470.149565 66.003478L709.008696 349.829565a29.384348 29.384348 0 0 0 13.022608 7.791305l188.438261 49.196521a87.04 87.04 0 0 1 65.224348 73.572174zM933.286957 568.876522L765.885217 667.826087a26.824348 26.824348 0 0 0-11.130434 11.130435L505.655652 546.726957l470.149565-66.003479a86.928696 86.928696 0 0 1-42.51826 88.153044z" fill="#FFC536"/><path d="M713.572174 973.245217a87.81913 87.81913 0 0 1-97.28-13.245217L470.26087 831.443478a27.714783 27.714783 0 0 0-13.913044-6.678261l49.085217-278.260869z" fill="#F7A116"/><path d="M505.544348 546.504348L456.347826 824.765217a28.271304 28.271304 0 0 0-15.137391 1.558261L260.118261 897.113043a87.485217 87.485217 0 0 1-96.166957-21.036521L505.321739 546.504348z" fill="#F99C15"/><path d="M505.321739 546.504348L163.951304 876.076522A87.373913 87.373913 0 0 1 146.476522 779.130435l77.133913-178.086957a28.382609 28.382609 0 0 0 2.003478-15.137391z" fill="#FFB727"/><path d="M505.321739 546.504348l-279.707826 39.17913a27.937391 27.937391 0 0 0-6.121739-14.024348L96.166957 421.286957a87.151304 87.151304 0 0 1-9.683479-97.725218zM505.433043 546.54887l0.011131-0.111305 0.111304 0.022261-0.022261 0.111304z" fill="#FFC536"/><path d="M713.572174 973.245217L505.655652 546.726957 755.2 678.956522a27.492174 27.492174 0 0 0-3.116522 14.580869l11.130435 194.226087a87.262609 87.262609 0 0 1-49.641739 85.481739z" fill="#FFB727"/><path d="M463.544082 272.373941a21.481739 44.410435 36.19 1 0 52.445598-71.684071 21.481739 44.410435 36.19 1 0-52.445598 71.684071Z" fill="#fff"/><path d="M798.052174 168.292174l3.784348 8.013913a6.344348 6.344348 0 0 0 4.674782 3.450435l8.681739 1.446956a6.233043 6.233043 0 0 1 3.339131 11.130435l-6.455652 6.121739a6.455652 6.455652 0 0 0-1.892174 5.565218l1.335652 8.681739a6.233043 6.233043 0 0 1-9.126957 6.455652l-7.791304-4.229565a6.233043 6.233043 0 0 0-5.787826 0l-7.902609 4.006956a6.344348 6.344348 0 0 1-9.015652-6.789565l1.669565-8.570435a6.678261 6.678261 0 0 0-1.780869-5.676522l-6.233044-6.121739a6.344348 6.344348 0 0 1 3.673044-11.130434l8.681739-1.224348a5.89913 5.89913 0 0 0 4.786087-3.339131l4.006956-7.791304a6.344348 6.344348 0 0 1 11.353044 0z" fill="#FFC840"/><path d="M326.455652 202.24l-2.671304 26.37913a19.033043 19.033043 0 0 0 6.678261 16.473044l20.257391 17.140869a19.033043 19.033043 0 0 1-8.236522 33.391305l-25.933913 5.676522a19.144348 19.144348 0 0 0-13.57913 11.130434l-10.017392 24.598261a19.033043 19.033043 0 0 1-34.05913 2.448696l-13.356522-22.928696a18.921739 18.921739 0 0 0-15.026087-9.349565l-26.490434-2.003478a19.033043 19.033043 0 0 1-12.911305-31.610435l17.697392-19.812174a18.69913 18.69913 0 0 0 4.229565-17.252174l-6.344348-25.822609a19.033043 19.033043 0 0 1 26.156522-22.260869l24.375652 11.130435a19.255652 19.255652 0 0 0 17.586087-1.224348l22.260869-14.024348a19.033043 19.033043 0 0 1 29.384348 17.92zM889.655652 793.266087l-5.676522 10.462609a8.681739 8.681739 0 0 0 0 8.125217l5.342609 11.130435a8.236522 8.236522 0 0 1-9.126956 11.798261l-11.130435-2.893913a8.125217 8.125217 0 0 0-7.568696 1.892174l-8.45913 8.125217a8.793043 8.793043 0 0 1-14.469565-5.89913L836.452174 823.652174a9.572174 9.572174 0 0 0-4.563478-7.012174l-11.130435-6.121739a8.793043 8.793043 0 0 1 0-15.693913l11.130435-4.563478a8.125217 8.125217 0 0 0 4.786087-6.233044l1.780869-12.020869a8.236522 8.236522 0 0 1 14.692174-3.673044l8.236522 9.349565a8.45913 8.45913 0 0 0 7.457391 3.005218l11.798261-1.113044a9.126957 9.126957 0 0 1 9.015652 13.690435z" fill="#F99C15"/>' +
      '</svg>';
  }

  function toyCopywritingFeedbackHtml(data) {
    if (!data || !data.sku || state.toyCopywritingErrorSku !== data.sku || !state.toyCopywritingError) return '';
    const label = isFoodEntryCopywritingProduct(data) ? '\u98df\u54c1\u6587\u6848\u8865\u5145\u5931\u8d25' : '\u6210\u5206\u8865\u5145\u5931\u8d25';
    return '<div class="pfh-toy-copywriting-feedback is-error" role="alert">' +
      '<span><strong>' + label + '</strong><b>' + escapeHtml(state.toyCopywritingError) + '</b></span>' +
      '<button type="button" data-action="open-detail">\u6253\u5f00\u5f53\u524d\u8be6\u60c5</button>' +
      '</div>';
  }

  function setToyCopywritingError(sku, message, kind) {
    state.toyCopywritingErrorSku = String(sku || '');
    state.toyCopywritingError = String(message || '').trim();
    state.toyCopywritingErrorKind = String(kind || 'general');
  }

  function clearToyCopywritingError(sku) {
    if (sku && state.toyCopywritingErrorSku && state.toyCopywritingErrorSku !== sku) return;
    state.toyCopywritingErrorSku = '';
    state.toyCopywritingError = '';
    state.toyCopywritingErrorKind = '';
  }

  function getToyCopywritingFieldConfig(key) {
    return {
      ingredients: { group: '270', labels: /^(?:\u6210\u5206|INGREDIENTS?(?:\(\u6210\u5206\))?)$/i },
      sellingPoints: { group: '', labels: /^(?:\u4ea7\u54c1\u5356\u70b9|PRODUCT SELLING POINTS?(?:\(\u4ea7\u54c1\u5356\u70b9\))?)$/i },
      advantages: { group: '587', labels: /^(?:\u4ea7\u54c1\u4f18\u52bf|PRODUCT ADVANTAGES?(?:\(\u4ea7\u54c1\u4f18\u52bf\))?)$/i },
      efficacy: { group: '652', labels: /^(?:\u4ea7\u54c1\u529f\u6548|PRODUCT EFFICACY(?:\(\u4ea7\u54c1\u529f\u6548\))?)$/i },
      directions: { group: '717', labels: /^(?:\u4f7f\u7528\u65b9\u6cd5|DIRECTIONS OF SAFE USE(?:\(\u4f7f\u7528\u65b9\u6cd5\))?)$/i },
    }[key] || null;
  }

  function findToyCopywritingField(drawer, key) {
    const config = getToyCopywritingFieldConfig(key);
    if (!drawer || !config) return null;
    if (config.group) {
      const byGroup = Array.from(drawer.querySelectorAll('textarea[id*="_attr_group_' + config.group + '_"][id$="_value"], input[id*="_attr_group_' + config.group + '_"][id$="_value"]'))
        .filter(isVisibleElement)[0];
      if (byGroup) return byGroup;
    }
    const items = Array.from(drawer.querySelectorAll('.ant-form-item')).filter(isVisibleElement);
    const item = items.find((candidate) => {
      const label = candidate.querySelector('.ant-form-item-label, label');
      const text = compactText(label && (label.innerText || label.textContent)).replace(/[\uff1a:*]/g, '').replace(/\s+/g, ' ');
      return config.labels.test(text);
    });
    return item ? Array.from(item.querySelectorAll('textarea, input')).filter(isVisibleElement)[0] || null : null;
  }

  function getActiveToyCopywritingLanguage(drawer) {
    const tab = Array.from(drawer && drawer.querySelectorAll('[role="tab"], .ant-tabs-tab') || [])
      .filter(isVisibleElement)
      .filter((item) => /^(?:\u4e2d\u6587-\u7b80\u4f53|\u82f1\u8bed\(\u7f8e\u56fd\))$/.test(compactText(item.textContent)))
      .find(isActiveTab);
    return tab ? compactText(tab.textContent) : '';
  }

  function getToyCopywritingDrawerForSku(sku) {
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer, .ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .filter((drawer) => {
        const text = getVisibleText(drawer);
        return (!sku || text.includes(sku)) && text.includes('\u4e2d\u6587-\u7b80\u4f53') && text.includes('\u82f1\u8bed(\u7f8e\u56fd)') && text.includes('\u4fdd\u5b58\u8349\u7a3f');
      });
    return drawers[drawers.length - 1] || null;
  }

  async function switchToyCopywritingLanguage(drawer, language) {
    if (getActiveToyCopywritingLanguage(drawer) === language) return;
    const tab = findTabButton(drawer, language);
    if (!tab) throw new Error('\u672a\u627e\u5230\u300c' + language + '\u300d\u9875\u7b7e');
    clickElement(tab);
    const switched = await waitFor(() => getActiveToyCopywritingLanguage(drawer) === language, 5000, 120);
    if (!switched) throw new Error('\u5207\u6362\u300c' + language + '\u300d\u9875\u7b7e\u8d85\u65f6');
    await waitFor(() => findToyCopywritingField(drawer, 'ingredients') || findToyCopywritingField(drawer, 'advantages'), 4000, 120);
  }

  function readToyCopywritingFields(drawer) {
    const result = {};
    ['ingredients', 'sellingPoints', 'advantages', 'efficacy', 'directions'].forEach((key) => {
      const field = findToyCopywritingField(drawer, key);
      result[key] = field ? String(field.value || '').trim() : '';
    });
    return result;
  }

  function setNativeFormValue(field, value) {
    if (!field) return false;
    const next = String(value || '').trim();
    if (!next || String(field.value || '').trim()) return false;
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(field, next);
    else field.value = next;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function applyToyCopywritingPatch(drawer, patch) {
    let count = 0;
    Object.keys(patch || {}).forEach((key) => {
      if (setNativeFormValue(findToyCopywritingField(drawer, key), patch[key])) count += 1;
    });
    return count;
  }

  function getCachedCopywritingSectionValue(data, key) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    const section = record && record.sections.find((item) => item.key === key);
    return copywritingSectionCopyValue(section);
  }

  async function fillFoodEntryCopywriting(data, drawer) {
    const sku = data.sku;
    if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
    if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 65000, 250);
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    const chinese = readToyCopywritingFields(drawer);
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    const english = readToyCopywritingFields(drawer);
    const needsIngredients = !chinese.ingredients || !english.ingredients;
    const needsDirections = !chinese.directions || !english.directions;
    if (!needsIngredients && !needsDirections) return 0;
    let cached = normalizeData(loadData(sku) || data);
    if (needsIngredients && (!cached.ingredientChinese || !cached.ingredientEnglish)) cached = await hydrateIngredientPdfForSku(sku);
    if (needsDirections && (!getCachedCopywritingSectionValue(cached, 'directions') || !getCachedCopywritingSectionValue(cached, 'directionsChinese'))) {
      cached = await hydrateCopywritingForSku(sku, { force: true });
    }
    const chineseIngredients = String(cached.ingredientChinese || '').trim();
    const englishIngredients = String(cached.ingredientEnglish || '').trim();
    const chineseDirections = getCachedCopywritingSectionValue(cached, 'directionsChinese');
    const englishDirections = getCachedCopywritingSectionValue(cached, 'directions');
    if ((!chinese.ingredients && !chineseIngredients) || (!english.ingredients && !englishIngredients)) throw new Error('\u6210\u5206\u8868\u4e2d\u6587\u6216\u82f1\u6587\u7f13\u5b58\u4e3a\u7a7a');
    if ((!chinese.directions && !chineseDirections) || (!english.directions && !englishDirections)) throw new Error('\u4ea7\u54c1\u6587\u6848 Word \u4e2d\u672a\u8bc6\u522b\u5230\u4e2d\u82f1\u6587\u4f7f\u7528\u65b9\u6cd5');
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    let filledCount = applyToyCopywritingPatch(drawer, {
      ingredients: chinese.ingredients ? '' : chineseIngredients,
      directions: chinese.directions ? '' : chineseDirections,
    });
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    filledCount += applyToyCopywritingPatch(drawer, {
      ingredients: english.ingredients ? '' : englishIngredients,
      directions: english.directions ? '' : englishDirections,
    });
    if (!filledCount) return 0;
    const saved = await saveProductDraftBeforeClose();
    if (!saved) throw new Error('\u98df\u54c1\u6587\u6848\u5df2\u586b\u5199\uff0c\u4f46 PLM \u672a\u8fd4\u56de\u300c\u4fdd\u5b58\u6210\u529f\u300d');
    return filledCount;
  }

  function getCleanedWordIngredientValue(data, language) {
    const cached = normalizeData(data || {});
    const record = normalizeCopywritingRecord(cached.copywriting);
    if (language === 'chinese') {
      return String(record && record.cleanedIngredientChinese || cached.copywritingIngredientChinese || '').trim();
    }
    return String(record && record.cleanedIngredientEnglish || cached.copywritingIngredientEnglish || '').trim();
  }

  async function fillOtherProductIngredients(data, drawer) {
    const sku = data.sku;
    if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 65000, 250);
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    const chinese = readToyCopywritingFields(drawer);
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    const english = readToyCopywritingFields(drawer);
    if (chinese.ingredients && english.ingredients) return 0;
    let cached = normalizeData(loadData(sku) || data);
    if ((!chinese.ingredients && !getCleanedWordIngredientValue(cached, 'chinese'))
      || (!english.ingredients && !getCleanedWordIngredientValue(cached, 'english'))) {
      cached = await hydrateCopywritingForSku(sku, { force: true, drawer });
    }
    const chineseIngredients = getCleanedWordIngredientValue(cached, 'chinese');
    const englishIngredients = getCleanedWordIngredientValue(cached, 'english');
    if ((!chinese.ingredients && !chineseIngredients) || (!english.ingredients && !englishIngredients)) {
      throw new Error('\u4ea7\u54c1\u6587\u6848 Word \u4e2d\u672a\u8bc6\u522b\u5230\u5b8c\u6574\u7684\u4e2d\u82f1\u6587\u6210\u5206');
    }
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    let filledCount = applyToyCopywritingPatch(drawer, {
      ingredients: chinese.ingredients ? '' : chineseIngredients,
    });
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    filledCount += applyToyCopywritingPatch(drawer, {
      ingredients: english.ingredients ? '' : englishIngredients,
    });
    if (!filledCount) return 0;
    const saved = await saveProductDraftBeforeClose();
    if (!saved) throw new Error('\u6210\u5206\u5df2\u586b\u5199\uff0c\u4f46 PLM \u672a\u8fd4\u56de\u300c\u4fdd\u5b58\u6210\u529f\u300d');
    return filledCount;
  }

  async function fillToyCopywriting() {
    if (state.toyCopywritingBusy) return;
    const data = normalizeData(state.data || {});
    const isToy = isToyCopywritingProduct(data);
    const isFoodEntry = isFoodEntryCopywritingProduct(data);
    const isIngredientOnly = !isToy && !isFoodEntry;
    if (!data.sku) {
      showToast('\u672a\u627e\u5230\u5f53\u524d SKU');
      return;
    }
    if (isFoodEntry) {
      const cached = normalizeData(loadData(data.sku) || data);
      if (!cached.ingredientChinese || !cached.ingredientEnglish) {
        const message = '\u672a\u627e\u5230\u5b8c\u6574\u7684\u6210\u5206\u8868\u7f13\u5b58\u3002\u8bf7\u5148\u6253\u5f00\u5f53\u524d SKU \u7684\u300c\u4ea7\u54c1\u4fe1\u606f\u300d\uff0c\u7b49\u5f85\u6210\u5206\u8868\u8bfb\u53d6\u5b8c\u6210\u540e\u518d\u8bd5\u3002';
        setToyCopywritingError(data.sku, message, 'ingredient-cache');
        addLog('warn', '\u98df\u54c1\u6587\u6848\u667a\u80fd\u8865\u5145\u7f3a\u5c11\u6210\u5206\u8868\u7f13\u5b58', data.sku);
        renderShell();
        showToast('\u98df\u54c1\u6587\u6848\u8865\u5145\u5931\u8d25\uff1a' + message);
        return;
      }
    }
    clearToyCopywritingError(data.sku);
    const drawer = getToyCopywritingDrawerForSku(data.sku);
    if (!drawer) {
      const message = '\u8bf7\u5148\u6253\u5f00\u5f53\u524d SKU \u7684 PLM \u8be6\u60c5';
      if (!isToy) {
        setToyCopywritingError(data.sku, message, isFoodEntry ? 'detail' : 'ingredient-detail');
        renderShell();
      }
      showToast(message);
      return;
    }
    state.toyCopywritingBusy = true;
    renderShell();
    const originalLanguage = getActiveToyCopywritingLanguage(drawer) || '\u4e2d\u6587-\u7b80\u4f53';
    let filledCount = 0;
    try {
      if (isFoodEntry) {
        filledCount = await fillFoodEntryCopywriting(data, drawer);
        if (!filledCount) {
          showToast('\u98df\u54c1\u6587\u6848\u5df2\u5b8c\u6574\uff0c\u65e0\u9700\u8865\u5145');
          return;
        }
        addLog('success', '\u98df\u54c1\u6587\u6848\u667a\u80fd\u8865\u5145\u5b8c\u6210', data.sku + ' | ' + filledCount + '\u4e2a\u5b57\u6bb5');
        showToast('\u5df2\u8865\u5145 ' + filledCount + ' \u4e2a\u98df\u54c1\u6587\u6848\u5b57\u6bb5\u5e76\u4fdd\u5b58\u8349\u7a3f');
        return;
      }
      if (isIngredientOnly) {
        filledCount = await fillOtherProductIngredients(data, drawer);
        if (!filledCount) {
          showToast('\u4e2d\u82f1\u6587\u6210\u5206\u5df2\u5b8c\u6574\uff0c\u65e0\u9700\u8865\u5145');
          return;
        }
        addLog('success', '\u4ea7\u54c1\u6210\u5206\u8865\u5168\u5b8c\u6210', data.sku + ' | ' + filledCount + '\u4e2a\u5b57\u6bb5');
        showToast('\u5df2\u8865\u5168 ' + filledCount + ' \u4e2a\u4e2d\u82f1\u6587\u6210\u5206\u5b57\u6bb5\u5e76\u4fdd\u5b58\u8349\u7a3f');
        return;
      }
      await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
      const chinese = readToyCopywritingFields(drawer);
      await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
      const english = readToyCopywritingFields(drawer);
      const needsAi = !chinese.advantages || !chinese.efficacy || !english.advantages || !english.efficacy || !english.ingredients || !english.directions;
      if (!chinese.efficacy && !chinese.sellingPoints) throw new Error('\u4e2d\u6587\u4ea7\u54c1\u5356\u70b9\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u751f\u6210\u4e09\u53e5\u4ea7\u54c1\u529f\u6548');
      if (!english.ingredients && !chinese.ingredients) throw new Error('\u4e2d\u6587\u6210\u5206\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u751f\u6210\u82f1\u6587 INGREDIENTS');
      if (!english.directions && !chinese.directions) throw new Error('\u4e2d\u6587\u4f7f\u7528\u65b9\u6cd5\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u751f\u6210\u82f1\u6587 DIRECTIONS OF SAFE USE');
      let generated = {};
      if (needsAi) {
        showToast('\u9b54\u642d Qwen \u6b63\u5728\u6574\u7406\u73a9\u5177\u6587\u6848...');
        generated = await cloudRequest('/toy-copywriting/complete', {
          method: 'POST',
          timeoutMs: 90000,
          body: {
            sku: data.sku,
            name: data.name || '',
            chineseSellingPoints: chinese.sellingPoints,
            chineseAdvantages: chinese.advantages,
            chineseEfficacy: chinese.efficacy,
            chineseIngredients: chinese.ingredients,
            chineseDirections: chinese.directions,
            needsChineseAdvantages: !chinese.advantages,
            needsEnglishAdvantages: !english.advantages,
            needsChineseEfficacy: !chinese.efficacy,
            needsEnglishEfficacy: !english.efficacy,
            needsEnglishIngredients: !english.ingredients,
            needsEnglishDirections: !english.directions,
          },
        });
        if (!generated || !generated.ok) throw new Error(generated && generated.error ? generated.error : 'AI \u672a\u8fd4\u56de\u6709\u6548\u73a9\u5177\u6587\u6848');
      }
      const finalChineseAdvantages = chinese.advantages || String(generated.chineseAdvantages || '').trim();
      const finalEnglishAdvantages = english.advantages || String(generated.englishAdvantages || '').trim();
      const finalChineseEfficacy = chinese.efficacy || String(generated.chineseEfficacy || '').trim();
      const finalEnglishEfficacy = english.efficacy || String(generated.englishEfficacy || '').trim();
      if (!chinese.advantages && !finalChineseAdvantages) throw new Error('\u672a\u751f\u6210\u6709\u6548\u7684\u4e2d\u6587\u4ea7\u54c1\u4f18\u52bf');
      if (!english.advantages && !finalEnglishAdvantages) throw new Error('\u672a\u751f\u6210\u6709\u6548\u7684\u82f1\u6587 PRODUCT ADVANTAGES');
      if (!chinese.efficacy && !finalChineseEfficacy) throw new Error('\u672a\u6839\u636e\u4ea7\u54c1\u5356\u70b9\u751f\u6210\u4e2d\u6587\u4ea7\u54c1\u529f\u6548');
      if (!english.efficacy && !finalEnglishEfficacy) throw new Error('\u672a\u751f\u6210\u82f1\u6587 PRODUCT EFFICACY');
      const chinesePatch = {};
      if (!chinese.advantages) chinesePatch.advantages = finalChineseAdvantages;
      if (!chinese.efficacy) chinesePatch.efficacy = finalChineseEfficacy;
      const englishPatch = {};
      if (!english.advantages) englishPatch.advantages = finalEnglishAdvantages;
      if (!english.efficacy) englishPatch.efficacy = finalEnglishEfficacy;
      if (!english.ingredients) englishPatch.ingredients = String(generated.englishIngredients || '').trim();
      if (!english.directions) englishPatch.directions = String(generated.englishDirections || '').trim();
      if (!Object.keys(chinesePatch).length && !Object.keys(englishPatch).length) {
        showToast('\u73a9\u5177\u6587\u6848\u5df2\u5b8c\u6574\uff0c\u65e0\u9700\u8865\u5145');
        return;
      }
      if (englishPatch.ingredients === '' || englishPatch.directions === '') throw new Error('Gemini \u8fd4\u56de\u7684\u82f1\u6587\u6210\u5206\u6216\u4f7f\u7528\u65b9\u6cd5\u4e3a\u7a7a');
      await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
      filledCount += applyToyCopywritingPatch(drawer, chinesePatch);
      await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
      filledCount += applyToyCopywritingPatch(drawer, englishPatch);
      if (!filledCount) throw new Error('\u76ee\u6807\u5b57\u6bb5\u672a\u5199\u5165\uff0cPLM \u8868\u5355\u7ed3\u6784\u53ef\u80fd\u5df2\u53d8\u5316');
      const saved = await saveProductDraftBeforeClose();
      if (!saved) throw new Error('\u6587\u6848\u5df2\u586b\u5199\uff0c\u4f46 PLM \u672a\u8fd4\u56de\u300c\u4fdd\u5b58\u6210\u529f\u300d');
      addLog('success', '\u73a9\u5177\u6587\u6848\u667a\u80fd\u8865\u5145\u5b8c\u6210', data.sku + ' | ' + filledCount + '\u4e2a\u5b57\u6bb5');
      syncInsightEvent('toy_copywriting_supplement_success', { sku: data.sku, name: data.name || '', source: 'toy-copywriting', filledCount });
      showToast('\u5df2\u8865\u5145 ' + filledCount + ' \u4e2a\u73a9\u5177\u6587\u6848\u5b57\u6bb5\u5e76\u4fdd\u5b58\u8349\u7a3f');
    } catch (error) {
      const message = formatErrorMessage(error) || '\u667a\u80fd\u8865\u5145\u5931\u8d25';
      const label = isFoodEntry ? '\u98df\u54c1\u6587\u6848' : (isIngredientOnly ? '\u6210\u5206' : '\u73a9\u5177\u6587\u6848');
      if (!isToy) setToyCopywritingError(data.sku, message, isIngredientOnly ? 'ingredient' : 'general');
      addLog('error', label + '\u667a\u80fd\u8865\u5145\u5931\u8d25', data.sku + ' | ' + message);
      showToast(label + '\u8865\u5145\u5931\u8d25\uff1a' + message);
    } finally {
      if (originalLanguage && getToyCopywritingDrawerForSku(data.sku)) {
        await switchToyCopywritingLanguage(drawer, originalLanguage).catch(() => {});
      }
      state.toyCopywritingBusy = false;
      renderShell();
    }
  }

  function formatCopywritingUpdateSummary(record) {
    const changedCount = (record.changedSectionKeys || []).length;
    const removed = record.removedSections || [];
    const parts = [];
    if (changedCount) parts.push(changedCount + ' 段有变化');
    if (removed.length) parts.push('删除：' + removed.join('、'));
    return parts.join('；') || '检测到新的产品文案文件';
  }

  function homeViewHtml(statusText) {
    const count = state.index.length;
    const status = statusText || '打开项目后，我会自动沉淀尺寸、净含量、重量与图包信息。';
    const sizeImageLocked = !state.sizeImageAccessEnabled;
    const sizeImageLockText = state.sizeImageAccessLoading ? '正在准备功能。' : '该功能暂未开放，敬请期待。';
    const cards = [
      ['open-first-detail', 'folder', '我的详情', '打开我的详情', '默认打开第一个编码的详情页。'],
      ['ledger-open', 'taskPlan', '今日台账', '今日工作台', '记录定稿和粗流程，一键复制到月登记表。'],
      ['home-excel-coming-soon', 'batchExcel', '规格成表', '批量生成 Excel', '把纸盒、标签、净含量与图片整理成可交付表格。', true],
      ['upload-toggle', 'upload', '提审流转', '批量提审上传', '按 SKU 队列上传文件，记录成功、草稿与异常状态。'],
      ['home-size-image', 'image', '包装辅助', '生成尺寸图', sizeImageLocked ? sizeImageLockText : '选择 SKU 并拖入图片，自动识别纸盒或标签并生成 JPG。', sizeImageLocked],
      ['home-parameter-image', 'image', '套图辅助', '生成参数图', '选择 SKU 并拖入透明产品图，生成产品尺寸图和英文参数图。', false, true],
      ['home-unit-converter', 'calculator', '单位换算', '厘米换算英寸', '输入一个或多个厘米尺寸，立即换算为英寸。'],
      ['home-tools', 'tools', '效率辅助', '小工具', '整理编码并输出可直接使用的搜索格式。'],
    ];
    return '<div class="pfh-detail-scroll"><section class="pfh-home">' +
      '<div class="pfh-home-orbit"><i class="wave"></i><i class="wave"></i><i class="wave"></i><span></span></div>' +
      '<h2>PLM 工作台</h2>' +
      '<p>' + escapeHtml(status) + '</p>' +
      '<div class="pfh-home-stats"><span>CACHED</span><b>' + escapeHtml(String(count)) + '</b><em>本地产品档案</em></div>' +
      '<div class="pfh-home-grid">' + cards.map((card) => '<button type="button" class="pfh-home-card' + (card[5] ? ' is-disabled' : '') + '" data-action="' + card[0] + '"' + (card[5] ? ' disabled aria-disabled="true"' : '') + '>' +
        iconHtml(card[1]) +
        '<small>' + escapeHtml(card[2]) + '</small>' +
        '<strong class="pfh-home-card-title"><b>' + escapeHtml(card[3]) + '</b>' + (card[6] ? '<i class="pfh-beta-badge">BETA</i>' : '') + '</strong>' +
        '<span>' + escapeHtml(card[4]) + '</span>' +
      '</button>').join('') + '</div>' +
      '</section></div>';
  }

  function unitConverterViewHtml() {
    const result = convertCmInputToInches(state.cmConverterInput);
    return '<div class="pfh-detail-scroll"><section class="pfh-mini-tool-page">' +
      '<div class="pfh-mini-tool-head"><button type="button" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div><small>UNIT CONVERTER</small><h2>厘米换算英寸</h2><p>支持单个数值或多个尺寸，例如 3.3 × 3.3 × 12.6。</p></div></div>' +
      '<div class="pfh-mini-tool-card"><label>厘米（cm）</label><textarea class="pfh-unit-converter-input" placeholder="例如：3.3 × 3.3 × 12.6">' + escapeHtml(state.cmConverterInput || '') + '</textarea>' +
      '<div class="pfh-mini-tool-result"><span>英寸（inch）</span><strong class="pfh-unit-converter-result">' + escapeHtml(result || '等待输入') + '</strong></div>' +
      '<div class="pfh-mini-tool-actions"><button type="button" data-action="unit-converter-clear">清空</button><button type="button" data-action="unit-converter-copy"' + (result ? '' : ' disabled') + '>复制结果</button></div></div>' +
      '</section></div>';
  }

  function toolsViewHtml() {
    const result = formatSearchCodes(state.codeFormatterInput);
    return '<div class="pfh-detail-scroll"><section class="pfh-mini-tool-page">' +
      '<div class="pfh-mini-tool-head"><button type="button" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div><small>QUICK TOOLS</small><h2>小工具</h2><p>把多个编码整理为文件搜索格式。</p></div></div>' +
      '<div class="pfh-mini-tool-card"><label>编码格式化</label><textarea class="pfh-code-formatter-input" placeholder="粘贴多个编码，可用空格、换行或逗号分隔">' + escapeHtml(state.codeFormatterInput || '') + '</textarea>' +
      '<div class="pfh-mini-tool-result"><span>输出格式</span><strong class="pfh-code-formatter-result">' + escapeHtml(result || 'ext:zip|ext:xlsx 编码1|编码2') + '</strong></div>' +
      '<div class="pfh-mini-tool-actions"><button type="button" data-action="code-formatter-clear">清空</button><button type="button" data-action="code-formatter-copy"' + (result ? '' : ' disabled') + '>复制结果</button></div></div>' +
      '</section></div>';
  }

  function convertCmInputToInches(value) {
    const numbers = String(value || '').match(/-?\d+(?:\.\d+)?/g) || [];
    if (!numbers.length) return '';
    return numbers.map((item) => formatToolNumber(Number(item) * CM_TO_INCH)).join(' × ') + ' inch';
  }

  function formatToolNumber(value) {
    if (!Number.isFinite(value)) return '';
    return value.toFixed(2);
  }

  function extractSearchCodes(value) {
    const text = String(value || '').replace(/^\s*ext:zip\|ext:xlsx\s*/i, '');
    const matched = text.match(/\b(?:SKU|MTL)\d+\b/gi);
    const raw = matched && matched.length ? matched : text.split(/[\s,，;；、|/\\]+/).filter(Boolean);
    const seen = new Set();
    return raw.map((item) => String(item).trim().toUpperCase()).filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }

  function formatSearchCodes(value) {
    const codes = extractSearchCodes(value);
    return codes.length ? 'ext:zip|ext:xlsx ' + codes.join('|') : '';
  }

  function sizeImageViewHtml() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      return '<div class="pfh-detail-scroll pfh-size-image-scroll"><section class="pfh-size-image-page"><div class="pfh-size-image-empty"><strong>\u9009\u62e9\u4e00\u4e2a SKU</strong><p>\u4ece\u5de6\u4fa7\u9009\u62e9 SKU \u540e\uff0c\u53ef\u751f\u6210\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\u5c3a\u5bf8\u56fe\u3002</p></div></section></div>';
    }
    const cartonSpec = getSizeImageSpec(data);
    const labelSpecs = getLabelSizeImageSpecs(data);
    const labelSpec = labelSpecs[0] || null;
    const session = ensureSizeImageSession(data.sku);
    migrateLegacySizeImageResult(session, labelSpec);
    const busy = state.sizeImageBusySku === data.sku;
    const cartonDimension = cartonSpec ? [cartonSpec.length, cartonSpec.width, cartonSpec.height].concat(cartonSpec.extraWidths || []).map(formatSizeImageNumber).join(' \u00d7 ') + ' cm' : '';
    const labelDimensions = labelSpecs.map((spec) => (spec.kind === 'print' ? '\u5370\u5237' : '\u6807\u7b7e') + ' ' + formatSizeImageNumber(spec.width) + ' \u00d7 ' + formatSizeImageNumber(spec.height) + ' cm');
    const dimensionText = [cartonDimension ? '\u7eb8\u76d2 ' + cartonDimension : ''].concat(labelDimensions).filter(Boolean).join(' / ') || '\u5c3a\u5bf8\u4e0d\u53ef\u7528';
    const flatResultCount = labelSpecs.filter((spec) => session.flatResults[spec.key] && session.flatResults[spec.key].dataUrl).length;
    const resultCount = Number(Boolean(session.cartonResultDataUrl)) + flatResultCount;
    const canRegenerate = Boolean(session.cartonFile || Object.keys(session.flatFiles).length);
    const status = busy
      ? '<div class="pfh-size-image-status is-processing"><i></i><span>' + escapeHtml(session.processingStep || '\u6b63\u5728\u8bfb\u53d6\u56fe\u7247...') + '</span><em></em></div>'
      : session.error
      ? '<div class="pfh-size-image-status is-error">' + escapeHtml(session.error) + '</div>'
      : (resultCount ? '<div class="pfh-size-image-status is-ready">\u5df2\u751f\u6210 ' + resultCount + ' \u4e2a 3000 \u00d7 3000 JPG\u3002</div>' : '');
    const previewCard = (type, url, detail) => {
      const label = type === 'label' ? '\u6807\u7b7e' : (type === 'print' ? '\u5370\u5237' : '\u7eb8\u76d2');
      return url
        ? '<div class="pfh-size-image-preview"><span class="pfh-size-image-preview-type">' + label + (detail ? ' ' + escapeHtml(detail) : '') + '\u9884\u89c8</span><img src="' + url + '" alt="' + escapeHtml(data.sku + ' ' + label + '\u5c3a\u5bf8\u56fe') + '"></div>'
        : '<div class="pfh-size-image-placeholder is-compact">' + iconHtml(type === 'carton' ? 'box' : 'tag') + '<strong>\u6682\u65e0' + label + (detail ? ' ' + escapeHtml(detail) : '') + '\u9884\u89c8</strong><span>\u53ef\u540c\u65f6\u62d6\u5165\u591a\u5f20\u56fe\u7247</span></div>';
    };
    const flatPreviews = labelSpecs.map((spec) => {
      const result = session.flatResults[spec.key];
      const detail = formatSizeImageNumber(spec.width) + '\u00d7' + formatSizeImageNumber(spec.height) + 'cm';
      return previewCard(spec.kind, result && result.dataUrl, detail);
    }).join('');
    const preview = '<div class="pfh-size-image-preview-grid">' + (cartonSpec ? previewCard('carton', session.cartonResultDataUrl) : '') + flatPreviews + '</div>';
    const disabled = (cartonSpec || labelSpec) && !busy ? '' : ' disabled';
    const remarks = getSizeImageRemarks(data);
    if (typeof session.cartonRemarkText !== 'string') session.cartonRemarkText = remarks.carton || '';
    labelSpecs.forEach((spec) => {
      if (typeof session.labelRemarkTexts[spec.key] !== 'string') session.labelRemarkTexts[spec.key] = spec.remark || remarks.label || '';
    });
    const remarkInputs = [
      cartonSpec ? '<label><span>\u7eb8\u76d2</span><input type="text" class="pfh-size-image-remark-text" data-size-image-type="carton" value="' + escapeHtml(session.cartonRemarkText) + '" placeholder="\u7eb8\u76d2\u6807\u9898\u5907\u6ce8"></label>' : '',
      ...labelSpecs.map((spec) => {
        const flatLabel = spec.kind === 'print' ? '\u5370\u5237' : '\u6807\u7b7e';
        const detail = formatSizeImageNumber(spec.width) + '\u00d7' + formatSizeImageNumber(spec.height);
        return '<label><span>' + flatLabel + ' ' + detail + '</span><input type="text" class="pfh-size-image-remark-text" data-size-image-type="label" data-size-image-key="' + escapeHtml(spec.key) + '" value="' + escapeHtml(session.labelRemarkTexts[spec.key]) + '" placeholder="' + flatLabel + '\u6807\u9898\u5907\u6ce8"></label>';
      }),
    ].filter(Boolean).join('');
    const pendingMatch = session.pendingLabelMatches.length ? '<div class="pfh-size-image-match-list"><strong>\u8bf7\u9009\u62e9\u56fe\u7247\u5bf9\u5e94\u7684\u5c3a\u5bf8</strong>' + session.pendingLabelMatches.map((pending) => '<div><span>' + escapeHtml(pending.file.name || '\u5f85\u5339\u914d\u56fe\u7247') + '</span><select class="pfh-size-image-match-select" data-pending-id="' + escapeHtml(pending.id) + '">' + labelSpecs.map((spec) => '<option value="' + escapeHtml(spec.key) + '">' + escapeHtml((spec.kind === 'print' ? '\u5370\u5237 ' : '\u6807\u7b7e ') + formatSizeImageNumber(spec.width) + ' \u00d7 ' + formatSizeImageNumber(spec.height) + ' cm') + '</option>').join('') + '</select><button type="button" data-action="size-image-confirm-match" data-pending-id="' + escapeHtml(pending.id) + '">\u786e\u8ba4\u751f\u6210</button></div>').join('') + '</div>' : '';
    return '<div class="pfh-detail-scroll pfh-size-image-scroll"><section class="pfh-size-image-page">' +
      '<header class="pfh-size-image-hero"><div class="pfh-size-image-hero-media">' + productThumbHtml(data) + '</div><div class="pfh-size-image-hero-copy"><small>SIZE IMAGE</small><h3>' + escapeHtml(data.sku) + ' \u5c3a\u5bf8\u56fe</h3><p>' + escapeHtml([data.brand, data.name].filter(Boolean).join(' ') || '\u9009\u4e2d\u4ea7\u54c1') + '</p></div></header>' +
      (!(cartonSpec || labelSpec) ? '<div class="pfh-size-image-status is-error">' + escapeHtml(getSizeImageSpecError(data)) + '</div>' : '') +
      '<div class="pfh-size-image-workspace' + (busy ? ' is-busy' : '') + '"><div class="pfh-size-image-controls">' +
        '<div class="pfh-size-image-spec"><span>\u5df2\u8bfb\u53d6\u89c4\u683c</span><b>' + escapeHtml(dimensionText) + '</b><small>\u7eb8\u76d2\u6309\u5200\u6a21\u8f6e\u5ed3\u8bc6\u522b\uff1b\u6807\u7b7e\u548c\u5370\u5237\u6309\u5bbd\u9ad8\u6bd4\u4f8b\u8bc6\u522b\u3002</small></div>' +
        '<div class="pfh-size-image-remark-editor"><span>\u6807\u9898\u5907\u6ce8</span><div>' + remarkInputs + '</div></div>' +
        '<div class="pfh-size-image-options">' + (labelSpecs.some((spec) => spec.kind === 'label') ? '<label><input type="checkbox" class="pfh-size-image-round-arc-input"' + (session.includeRoundArc === false ? '' : ' checked') + '><span>\u6807\u7b7e\u5706\u5f27</span></label>' : '') + '<label><input type="checkbox" class="pfh-size-image-batch-number-input"' + (session.includeBatchNumber === false ? '' : ' checked') + '><span>\u6279\u6b21\u53f7</span></label></div>' +
        '<button type="button" class="pfh-size-image-drop' + (busy ? ' is-processing' : '') + '" data-action="size-image-pick"' + disabled + '>' + (busy ? '<i class="pfh-size-image-spinner"></i>' : iconHtml('upload')) + '<strong>' + (busy ? escapeHtml(session.processingStep || '\u6b63\u5728\u5206\u6790\u5e76\u751f\u6210...') : '\u70b9\u51fb\u9009\u62e9\u6216\u62d6\u5165\u56fe\u7247') + '</strong><span>' + (busy ? '\u8bf7\u7a0d\u5019\uff0c\u5927\u5c3a\u5bf8\u56fe\u7247\u9700\u8981\u51e0\u79d2\u5904\u7406\u65f6\u95f4\u3002' : '\u9f20\u6807\u505c\u5728\u8fd9\u91cc\u53ef\u76f4\u63a5 Ctrl+V \u7c98\u8d34\u56fe\u7247\u3002\u7eb8\u76d2\u7528\u900f\u660e PNG\uff0c\u6807\u7b7e/\u5370\u5237\u652f\u6301 PNG / JPG\u3002') + '</span></button>' +
        (session.fileName ? '<p class="pfh-size-image-file">\u6700\u8fd1\u8bfb\u53d6\uff1a' + escapeHtml(session.fileName) + '</p>' : '') +
        '<div class="pfh-size-image-actions"><button type="button" class="is-secondary" data-action="size-image-regenerate"' + (canRegenerate && !busy ? '' : ' disabled') + '>' + iconHtml('refresh') + '\u91cd\u65b0\u751f\u6210</button><button type="button" class="is-primary" data-action="size-image-save-all"' + (resultCount && !busy ? '' : ' disabled') + '>' + iconHtml('download') + '\u53e6\u5b58\u5c3a\u5bf8\u56fe JPG</button></div>' +
        pendingMatch + '<input type="file" class="pfh-size-image-file-input" accept="image/png,image/jpeg,.png,.jpg,.jpeg" multiple>' + status +
      '</div>' + preview + '</div>' +
    '</section></div>';
  }

  function ensureSizeImageSession(sku) {
    if (!state.sizeImageSessions[sku]) state.sizeImageSessions[sku] = { includeRemark: true, includeRoundArc: true, includeBatchNumber: true };
    if (typeof state.sizeImageSessions[sku].includeRemark !== 'boolean') state.sizeImageSessions[sku].includeRemark = true;
    if (typeof state.sizeImageSessions[sku].includeRoundArc !== 'boolean') state.sizeImageSessions[sku].includeRoundArc = true;
    if (typeof state.sizeImageSessions[sku].includeBatchNumber !== 'boolean') state.sizeImageSessions[sku].includeBatchNumber = true;
    if (!state.sizeImageSessions[sku].flatResults || typeof state.sizeImageSessions[sku].flatResults !== 'object') state.sizeImageSessions[sku].flatResults = {};
    if (!state.sizeImageSessions[sku].flatFiles || typeof state.sizeImageSessions[sku].flatFiles !== 'object') state.sizeImageSessions[sku].flatFiles = {};
    if (!state.sizeImageSessions[sku].labelRemarkTexts || typeof state.sizeImageSessions[sku].labelRemarkTexts !== 'object') state.sizeImageSessions[sku].labelRemarkTexts = {};
    if (!Array.isArray(state.sizeImageSessions[sku].pendingLabelMatches)) state.sizeImageSessions[sku].pendingLabelMatches = [];
    return state.sizeImageSessions[sku];
  }

  function migrateLegacySizeImageResult(session, firstSpec) {
    if (!session || !firstSpec) return;
    if (session.labelResultDataUrl && !session.flatResults[firstSpec.key]) {
      session.flatResults[firstSpec.key] = { dataUrl: session.labelResultDataUrl, kind: session.labelResultKind || firstSpec.kind };
    }
    if (session.labelFile && !session.flatFiles[firstSpec.key]) session.flatFiles[firstSpec.key] = session.labelFile;
    if (typeof session.labelRemarkText === 'string' && typeof session.labelRemarkTexts[firstSpec.key] !== 'string') session.labelRemarkTexts[firstSpec.key] = session.labelRemarkText;
  }

  function getSizeImageSpec(data) {
    if (!data || !/\u7eb8\u76d2/.test(String(data.packageSizeLabel || ''))) return null;
    const nums = Array.isArray(data.packageNums) ? data.packageNums.map(Number) : [];
    if (![3, 5].includes(nums.length) || nums.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    return { length: nums[0], width: nums[1], height: nums[2], extraWidths: nums.slice(3) };
  }

  function getSizeImageSpecError(data) {
    if (Array.isArray(data && data.packageNums) && data.packageNums.length > 3) return '\u591a\u9875\u7eb8\u76d2\u9700\u8981\u201c\u957f X \u5bbd X \u9ad8 X \u7b2c\u4e94\u9762\u5bbd X \u7b2c\u516d\u9762\u5bbd\u201d\u5171 5 \u4e2a\u5c3a\u5bf8\u3002';
    return '\u672a\u627e\u5230\u53ef\u7528\u7684\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\u5c3a\u5bf8\uff0c\u8bf7\u5148\u5237\u65b0 PLM \u7f13\u5b58\u3002';
  }

  function isPrintedBagSizeImageData(data) {
    const source = [
      data && data.printRawText,
      data && data.printSizeLabel,
      data && data.packageSizeLabel,
    ].filter(Boolean).join(' ');
    return /(?:\u5370\u5237\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\/\u819c\u7c7b)/.test(source);
  }

  function getLabelSizeImageSpecs(data) {
    if (!data || (!/(?:\u6807\u7b7e|\u5370\u5237)/.test(String(data.printSizeLabel || '')) && !data.isTubePrint)) return [];
    const labels = String(data.printSizeLabel || '').split(/\s*[\uff1b;]\s*/).filter(Boolean);
    const codes = String(data.printCode || '').split(/\s*[\uff1b;]\s*/).filter(Boolean);
    const printedBag = isPrintedBagSizeImageData(data);
    const dimensions = [];
    const pattern = /(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(cm|mm)?/ig;
    let match;
    while ((match = pattern.exec(String(data.printSizeText || '')))) {
      const divisor = String(match[3] || '').toLowerCase() === 'mm' ? 10 : 1;
      const width = Number(match[1]) / divisor;
      const height = Number(match[2]) / divisor;
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) dimensions.push({ width, height });
    }
    return dimensions.map((dimension, index) => {
      const labelText = labels[index] || labels[0] || '';
      const kind = /\u6807\u7b7e/.test(labelText || String(data.printSizeLabel || '')) && !data.isTubePrint ? 'label' : 'print';
      return {
        width: dimension.width,
        height: dimension.height,
        kind,
        index,
        key: 'flat-' + index + '-' + formatSizeImageNumber(dimension.width) + 'x' + formatSizeImageNumber(dimension.height),
        code: codes[index] || '',
        labelText,
        remark: collectSizeImageRemark(labelText, []),
        printedBag: kind === 'print' && printedBag,
      };
    });
  }

  function getLabelSizeImageSpec(data) {
    return getLabelSizeImageSpecs(data)[0] || null;
  }

  function collectSizeImageRemark(label, extra) {
    const values = [];
    const source = String(label || '');
    let match;
    const pattern = /[\uff08(]([^\uff09)]+)[\uff09)]/g;
    while ((match = pattern.exec(source))) {
      const value = cleanCopywritingLine(match[1]);
      if (value && !/\d+(?:\.\d+)?\s*[xX\u00d7*]/.test(value)) values.push(value);
    }
    ['\u5185\u5361', '\u900f\u660e', '\u52a0\u7c98'].forEach((keyword) => {
      if (!source.includes(keyword) || values.some((value) => value.includes(keyword))) return;
      const sourceIndex = source.indexOf(keyword);
      const insertAt = values.findIndex((value) => source.indexOf(value) > sourceIndex);
      if (insertAt >= 0) values.splice(insertAt, 0, keyword);
      else values.push(keyword);
    });
    (extra || []).forEach((value) => { if (value) values.push(value); });
    return Array.from(new Set(values)).join(' ');
  }

  function getSizeImageRemarks(data) {
    return {
      carton: collectSizeImageRemark(data && data.packageSizeLabel, [data && data.hasInnerCard ? '\u5185\u5361' : '']),
      label: collectSizeImageRemark(data && data.printSizeLabel, []),
    };
  }

  function formatSizeImageNumber(value) {
    return trimNumber(Number(value));
  }

  function yieldSizeImageUi() {
    return new Promise((resolve) => window.requestAnimationFrame(() => window.setTimeout(resolve, 0)));
  }

  async function setSizeImageProcessingStep(session, text) {
    session.processingStep = text;
    const panel = document.getElementById(PANEL_ID);
    const strong = panel && panel.querySelector('.pfh-size-image-drop.is-processing strong');
    const status = panel && panel.querySelector('.pfh-size-image-status.is-processing span');
    if (strong) strong.textContent = text;
    if (status) status.textContent = text;
    await yieldSizeImageUi();
  }

  async function processSizeImageFile(file, preferredType, silent) {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const cartonSpec = getSizeImageSpec(data);
    const labelSpecs = getLabelSizeImageSpecs(data);
    if (!data || !data.sku || !(cartonSpec || labelSpecs.length)) {
      showToast(data ? getSizeImageSpecError(data) : '\u8bf7\u5148\u9009\u62e9 SKU');
      return;
    }
    if (!file || !/\.(?:png|jpe?g)$/i.test(file.name || '') || (file.type && !/^image\/(?:png|jpeg)$/.test(file.type))) {
      const invalidSession = ensureSizeImageSession(data.sku);
      invalidSession.fileName = file && file.name || '';
      invalidSession.error = '\u8bf7\u9009\u62e9 PNG \u6216 JPG \u56fe\u7247\uff1b\u7eb8\u76d2\u5fc5\u987b\u4f7f\u7528\u900f\u660e PNG\u3002';
      renderShell();
      return;
    }
    const sku = data.sku;
    const session = ensureSizeImageSession(sku);
    migrateLegacySizeImageResult(session, labelSpecs[0]);
    state.sizeImageBusySku = sku;
    session.fileName = file.name;
    session.error = '';
    session.processingStep = '\u6b63\u5728\u8bfb\u53d6 ' + file.name;
    if (!silent) renderShell();
    if (!silent) await yieldSizeImageUi();
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = await loadSizeImageSource(sourceUrl);
      await setSizeImageProcessingStep(session, '\u6b63\u5728\u8bc6\u522b\u7eb8\u76d2\u6216\u6807\u7b7e...');
      const preferredLabelKey = String(preferredType || '').startsWith('label:') ? String(preferredType).slice(6) : '';
      let detectedType = preferredType === 'carton' ? 'carton' : (preferredType === 'label' || preferredLabelKey ? 'label' : '');
      let matchedLabelSpec = null;
      let geometry = null;
      let cartonError = null;
      if ((!detectedType || detectedType === 'carton') && cartonSpec && /\.png$/i.test(file.name || '')) {
        try {
          geometry = analyzeSizeImageGeometry(image, cartonSpec);
          detectedType = 'carton';
        } catch (error) {
          cartonError = error;
          if (preferredType === 'carton') throw error;
        }
      }
      if (!detectedType || detectedType === 'label') {
        if (!labelSpecs.length) throw cartonError || new Error('\u5f53\u524d SKU \u6ca1\u6709\u53ef\u7528\u7684\u6807\u7b7e\u5c3a\u5bf8\u3002');
        if (preferredLabelKey) {
          matchedLabelSpec = labelSpecs.find((spec) => spec.key === preferredLabelKey) || null;
          if (!matchedLabelSpec) throw new Error('\u9009\u62e9\u7684\u6807\u7b7e\u5c3a\u5bf8\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u9009\u62e9\u3002');
          geometry = analyzeLabelSizeImageGeometry(image, matchedLabelSpec, true);
        } else {
          const matches = labelSpecs.map((spec) => {
            try {
              return { spec, geometry: analyzeLabelSizeImageGeometry(image, spec) };
            } catch (_) {
              return null;
            }
          }).filter(Boolean).sort((a, b) => a.geometry.matchDelta - b.geometry.matchDelta);
          if (!matches.length && labelSpecs.length === 1) throw new Error('\u56fe\u7247\u6bd4\u4f8b\u4e0e PLM \u4e2d\u7684\u6807\u7b7e\u6216\u5370\u5237\u5c3a\u5bf8\u4e0d\u5339\u914d\u3002');
          const first = matches[0];
          const second = matches[1];
          const confident = first && (!second || second.geometry.matchDelta - first.geometry.matchDelta >= 0.012);
          if (!confident) {
            const pendingId = 'pending-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
            session.pendingLabelMatches = session.pendingLabelMatches.filter((item) => item.file !== file);
            session.pendingLabelMatches.push({ id: pendingId, file });
            session.error = '';
            if (!silent) showToast('\u4e24\u4e2a\u5c3a\u5bf8\u6bd4\u4f8b\u592a\u63a5\u8fd1\uff0c\u8bf7\u624b\u52a8\u9009\u62e9\u5bf9\u5e94\u5c3a\u5bf8');
            return 'pending';
          }
          matchedLabelSpec = first.spec;
          geometry = first.geometry;
        }
        detectedType = 'label';
      }
      await setSizeImageProcessingStep(session, '\u8bc6\u522b\u5b8c\u6210\uff0c\u6b63\u5728\u7ed8\u5236 3000 \u00d7 3000 JPG...');
      if (detectedType === 'carton') {
        session.cartonResultDataUrl = generateSizeImageJpeg(image, geometry, cartonSpec, data, session.includeRemark, session.includeRoundArc, session.cartonRemarkText);
        session.cartonFile = file;
      } else {
        const customRemark = session.labelRemarkTexts[matchedLabelSpec.key];
        const dataUrl = generateLabelSizeImageJpeg(image, geometry, matchedLabelSpec, data, session.includeRemark, session.includeRoundArc, session.includeBatchNumber, customRemark);
        session.flatResults[matchedLabelSpec.key] = { dataUrl, kind: matchedLabelSpec.kind, code: matchedLabelSpec.code };
        session.flatFiles[matchedLabelSpec.key] = file;
        session.pendingLabelMatches = session.pendingLabelMatches.filter((item) => item.file !== file);
        if (labelSpecs.length === 1) {
          session.labelResultDataUrl = dataUrl;
          session.labelResultKind = matchedLabelSpec.kind;
          session.labelFile = file;
        }
      }
      session.error = '';
      if (detectedType === 'carton') {
        updateDailyLedgerForSku(sku, { boxFileState: 'done', boxFileDone: true }, getTodayKey());
      } else {
        updateDailyLedgerForSku(sku, { labelFileState: 'done', labelFileDone: true }, getTodayKey());
      }
      recordSizeImageUsage(true);
      if (!silent) showToast('\u5df2\u81ea\u52a8\u8bc6\u522b\u4e3a' + (detectedType === 'carton' ? '\u7eb8\u76d2' : (matchedLabelSpec.kind === 'print' ? '\u5370\u5237' : '\u6807\u7b7e')) + '\u5e76\u751f\u6210\u5c3a\u5bf8\u56fe');
    } catch (error) {
      session.error = formatSizeImageError(error);
      recordSizeImageUsage(false);
    } finally {
      URL.revokeObjectURL(sourceUrl);
      if (!silent) {
        if (state.sizeImageBusySku === sku) state.sizeImageBusySku = '';
        session.processingStep = '';
        if (state.view === 'sizeImage') renderShell();
      }
    }
  }

  function loadSizeImageSource(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('\u65e0\u6cd5\u8bfb\u53d6\u56fe\u7247\uff0c\u6587\u4ef6\u53ef\u80fd\u5df2\u635f\u574f\u3002'));
      image.src = url;
    });
  }

  async function processSizeImageFiles(files) {
    const items = Array.from(files || []).filter(Boolean);
    if (!items.length) return;
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && ensureSizeImageSession(sku);
    if (session) {
      state.sizeImageBusySku = sku;
      session.error = '';
      session.fileName = items.map((file) => file.name).join(' / ');
      session.processingStep = '\u6b63\u5728\u8bfb\u53d6 ' + items.length + ' \u5f20\u56fe\u7247...';
      if (state.view === 'sizeImage') renderShell();
      await yieldSizeImageUi();
    }
    for (const file of items) await processSizeImageFile(file, '', true);
    if (state.sizeImageBusySku === sku) state.sizeImageBusySku = '';
    if (session) session.processingStep = '';
    if (session && !session.error) {
      const flatCount = Object.values(session.flatResults).filter((item) => item && item.dataUrl).length;
      const names = [session.cartonResultDataUrl ? '\u7eb8\u76d2' : '', flatCount ? flatCount + '\u4e2a\u6807\u7b7e/\u5370\u5237' : ''].filter(Boolean).join('\u548c');
      if (names) showToast('\u5df2\u751f\u6210' + names + '\u5c3a\u5bf8\u56fe');
      else if (session.pendingLabelMatches.length) showToast('\u8bf7\u624b\u52a8\u9009\u62e9\u56fe\u7247\u5bf9\u5e94\u7684\u6807\u7b7e\u5c3a\u5bf8');
    }
    if (state.view === 'sizeImage') renderShell();
  }

  function analyzeSizeImageGeometry(image, spec) {
    const maxSide = 1800;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const rows = new Array(height);
    let transparentPixels = 0;
    let opaquePixels = 0;
    for (let y = 0; y < height; y += 1) {
      let count = 0;
      let left = width;
      let right = -1;
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= 12) transparentPixels += 1;
        if (alpha >= 220) opaquePixels += 1;
        if (alpha >= 220) {
          count += 1;
          if (left === width) left = x;
          right = x;
        }
      }
      rows[y] = { count, left, right };
    }
    const totalPixels = width * height;
    if (transparentPixels < totalPixels * 0.03 || opaquePixels < totalPixels * 0.05) {
      throw new Error('\u56fe\u7247\u6ca1\u6709\u53ef\u9760\u7684\u900f\u660e\u8f6e\u5ed3\uff0c\u8bf7\u5728 Photoshop \u4e2d\u4fdd\u7559\u900f\u660e\u80cc\u666f\u540e\u5bfc\u51fa PNG\u3002');
    }
    const maxRow = rows.reduce((max, row) => Math.max(max, row.count), 0);
    const threshold = maxRow * 0.92;
    let bestStart = -1;
    let bestEnd = -1;
    let start = -1;
    for (let y = 0; y <= height; y += 1) {
      const active = y < height && rows[y].count >= threshold;
      if (active && start < 0) start = y;
      if (!active && start >= 0) {
        if (bestStart < 0 || y - start > bestEnd - bestStart) {
          bestStart = start;
          bestEnd = y;
        }
        start = -1;
      }
    }
    if (bestStart < 0 || bestEnd - bestStart < 20) throw new Error('\u65e0\u6cd5\u5b9a\u4f4d\u8fde\u7eed\u7684\u7eb8\u76d2\u4e3b\u4f53\u3002');
    const sampleRows = rows.slice(bestStart, bestEnd).filter((row) => row.count >= threshold);
    const bodyLeft = Math.min(...sampleRows.map((row) => row.left));
    const bodyRight = Math.max(...sampleRows.map((row) => row.right + 1));
    const bodyWidth = bodyRight - bodyLeft;
    const bodyHeight = bestEnd - bestStart;
    const physicalBodyWidth = getCartonBodyWidths(spec).reduce((sum, value) => sum + value, 0);
    const scaleX = bodyWidth / physicalBodyWidth;
    const scaleY = bodyHeight / spec.height;
    const scaleDelta = Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY);
    if (scaleDelta > 0.045) throw new Error('\u7eb8\u76d2\u4e3b\u4f53\u6bd4\u4f8b\u4e0e PLM \u5c3a\u5bf8\u4e0d\u4e00\u81f4\uff0c\u8bf7\u786e\u8ba4 SKU \u548c\u5bfc\u51fa\u56fe\u662f\u5426\u5339\u914d\u3002');
    const topRect = {
      x: bodyLeft + spec.width * scaleX,
      y: bestStart - spec.width * scaleY,
      width: spec.length * scaleX,
      height: spec.width * scaleY,
    };
    const bottomRect = {
      x: bodyLeft + (2 * spec.width + spec.length) * scaleX,
      y: bestEnd,
      width: spec.length * scaleX,
      height: spec.width * scaleY,
    };
    if (topRect.y < -2 || bottomRect.y + bottomRect.height > height + 2) throw new Error('\u9876\u76d6\u6216\u5e95\u76d6\u4e0d\u5b8c\u6574\uff0c\u8bf7\u5bfc\u51fa\u5305\u542b\u5b8c\u6574\u7eb8\u76d2\u8f6e\u5ed3\u7684 PNG\u3002');
    const coverage = (rect) => {
      const x0 = Math.max(0, Math.round(rect.x));
      const y0 = Math.max(0, Math.round(rect.y));
      const x1 = Math.min(width, Math.round(rect.x + rect.width));
      const y1 = Math.min(height, Math.round(rect.y + rect.height));
      let hits = 0;
      let samples = 0;
      const step = Math.max(1, Math.floor(Math.min(rect.width, rect.height) / 90));
      for (let y = y0; y < y1; y += step) {
        for (let x = x0; x < x1; x += step) {
          samples += 1;
          if (pixels[(y * width + x) * 4 + 3] > 12) hits += 1;
        }
      }
      return samples ? hits / samples : 0;
    };
    const bodyCoverage = coverage({ x: bodyLeft, y: bestStart, width: bodyWidth, height: bodyHeight });
    if (bodyCoverage < 0.94 || coverage(topRect) < 0.82 || coverage(bottomRect) < 0.82) {
      throw new Error('\u900f\u660e\u8f6e\u5ed3\u4e0d\u7b26\u5408\u201c\u8fde\u7eed\u4e3b\u4f53 + \u7b2c\u4e8c\u9762\u9876\u76d6 + \u7b2c\u56db\u9762\u5e95\u76d6\u201d\u7ed3\u6784\u3002');
    }
    return {
      bodyLeft: bodyLeft * image.naturalWidth / width,
      bodyTop: bestStart * image.naturalHeight / height,
      pixelsPerCmX: scaleX * image.naturalWidth / width,
      pixelsPerCmY: scaleY * image.naturalHeight / height,
    };
  }

  function matchFlatSizeImageRatio(sourceRatio, spec) {
    const panelCounts = spec && spec.printedBag ? [1, 2] : [1];
    const candidates = [];
    panelCounts.forEach((panelCount) => {
      const expectedRatio = spec.width * panelCount / spec.height;
      candidates.push({
        panelCount,
        rotated: false,
        matchDelta: Math.abs(sourceRatio - expectedRatio) / expectedRatio,
      });
      candidates.push({
        panelCount,
        rotated: true,
        matchDelta: Math.abs((1 / sourceRatio) - expectedRatio) / expectedRatio,
      });
    });
    return candidates.sort((a, b) => a.matchDelta - b.matchDelta)[0];
  }

  function analyzeLabelSizeImageGeometry(image, spec, allowMismatch) {
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    let transparent = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha <= 12) transparent += 1;
        if (alpha > 12) {
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    const useAlphaBounds = transparent > width * height * 0.02 && right >= left && bottom >= top;
    if (!useAlphaBounds) {
      left = 0;
      top = 0;
      right = width - 1;
      bottom = height - 1;
    }
    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;
    const sourceRatio = cropWidth / cropHeight;
    const ratioMatch = matchFlatSizeImageRatio(sourceRatio, spec);
    if (!allowMismatch && ratioMatch.matchDelta > 0.065) {
      throw new Error('\u56fe\u7247\u6bd4\u4f8b\u4e0e PLM \u6807\u7b7e\u5c3a\u5bf8 ' + formatSizeImageNumber(spec.width) + ' \u00d7 ' + formatSizeImageNumber(spec.height) + ' cm \u4e0d\u5339\u914d\u3002');
    }
    return {
      cropX: left * image.naturalWidth / width,
      cropY: top * image.naturalHeight / height,
      cropWidth: cropWidth * image.naturalWidth / width,
      cropHeight: cropHeight * image.naturalHeight / height,
      rotated: ratioMatch.rotated,
      panelCount: ratioMatch.panelCount,
      matchDelta: ratioMatch.matchDelta,
    };
  }

  function generateSizeImageJpeg(image, geometry, spec, data, includeRemark, includeRoundArc, customRemark) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = '#000000';
    context.font = '700 88px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText(getSizeImageTitle('carton', data, includeRemark, includeRoundArc, customRemark), 505, 140);
    context.font = '78px "Microsoft YaHei", "PingFang SC", sans-serif';
    const extraSizeText = (spec.extraWidths || []).map((value) => 'X' + formatSizeImageNumber(value)).join('');
    context.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a\u957f' + formatSizeImageNumber(spec.length) + 'X\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + extraSizeText + 'CM', 505, 260);
    context.fillStyle = '#ee1410';
    context.font = '76px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText('(\u751f\u4ea7\u65e5\u671f+\u622a\u6b62\u65e5\u671f+\u6279\u6b21\u53f7)', 505, 370);

    const bodyWidths = getCartonBodyWidths(spec);
    const physicalWidth = bodyWidths.reduce((sum, value) => sum + value, 0);
    const physicalHeight = spec.height + 2 * spec.width;
    const cartonAspect = physicalWidth / physicalHeight;
    const widthLimit = clamp(1600 + ((cartonAspect - 0.72) / 0.38) * 450, 1600, 2050);
    const drawScale = Math.min(widthLimit / physicalWidth, 2020 / physicalHeight);
    const artWidth = physicalWidth * drawScale;
    const artHeight = physicalHeight * drawScale;
    const artX = Math.round((3000 - artWidth) / 2);
    const artY = clamp(Math.round((3000 - artHeight) / 2), 650, 900);
    const bodyTop = artY + spec.width * drawScale;
    const bodyBottom = bodyTop + spec.height * drawScale;
    context.save();
    context.beginPath();
    context.rect(artX + spec.width * drawScale, artY, spec.length * drawScale, spec.width * drawScale);
    context.rect(artX, bodyTop, physicalWidth * drawScale, spec.height * drawScale);
    context.rect(artX + (2 * spec.width + spec.length) * drawScale, bodyBottom, spec.length * drawScale, spec.width * drawScale);
    context.clip();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const imageX = artX - geometry.bodyLeft / geometry.pixelsPerCmX * drawScale;
    const imageY = bodyTop - geometry.bodyTop / geometry.pixelsPerCmY * drawScale;
    context.drawImage(image, imageX, imageY, image.naturalWidth / geometry.pixelsPerCmX * drawScale, image.naturalHeight / geometry.pixelsPerCmY * drawScale);
    context.restore();
    traceCartonSizeImageOutline(context, artX, artY, drawScale, spec);
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.stroke();

    context.strokeStyle = '#ee1410';
    context.fillStyle = '#ee1410';
    context.lineWidth = 4;
    const tick = 28;
    const heightX = artX - 48;
    drawSizeImageLine(context, heightX, bodyTop, heightX, bodyBottom);
    drawSizeImageLine(context, heightX - tick, bodyTop, heightX + tick, bodyTop);
    drawSizeImageLine(context, heightX - tick, bodyBottom, heightX + tick, bodyBottom);
    context.save();
    context.translate(heightX - 112, (bodyTop + bodyBottom) / 2);
    context.rotate(-Math.PI / 2);
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.height) + 'cm', 0, 0);
    context.restore();

    const bottomY = bodyBottom + 48;
    const firstEnd = artX + spec.width * drawScale;
    const secondEnd = firstEnd + spec.length * drawScale;
    drawSizeImageLine(context, artX, bottomY, secondEnd, bottomY);
    [artX, firstEnd, secondEnd].forEach((x) => drawSizeImageLine(context, x, bottomY - tick, x, bottomY + tick));
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.width) + 'cm', (artX + firstEnd) / 2, bottomY + 34);
    context.fillText(formatSizeImageNumber(spec.length) + 'cm', (firstEnd + secondEnd) / 2, bottomY + 34);
    if (bodyWidths.length > 4) {
      const extraStart = artX + bodyWidths.slice(0, 4).reduce((sum, value) => sum + value, 0) * drawScale;
      const extraLineY = bodyTop - 48;
      let cursorX = extraStart;
      drawSizeImageLine(context, extraStart, extraLineY, artX + artWidth, extraLineY);
      drawSizeImageLine(context, extraStart, extraLineY - tick, extraStart, extraLineY + tick);
      bodyWidths.slice(4).forEach((width) => {
        const nextX = cursorX + width * drawScale;
        drawSizeImageLine(context, nextX, extraLineY - tick, nextX, extraLineY + tick);
        context.fillText(formatSizeImageNumber(width) + 'cm', (cursorX + nextX) / 2, extraLineY - 102);
        cursorX = nextX;
      });
    }
    return canvas.toDataURL('image/jpeg', 0.96);
  }

  function getCartonBodyWidths(spec) {
    return [spec.width, spec.length, spec.width, spec.length].concat(Array.isArray(spec.extraWidths) ? spec.extraWidths : []);
  }

  function traceCartonSizeImageOutline(context, artX, artY, scale, spec) {
    const width = spec.width;
    const length = spec.length;
    const bodyTop = artY + width * scale;
    const bodyBottom = bodyTop + spec.height * scale;
    const flapBottom = bodyBottom + width * scale;
    context.beginPath();
    context.moveTo(artX, bodyTop);
    context.lineTo(artX + width * scale, bodyTop);
    context.lineTo(artX + width * scale, artY);
    context.lineTo(artX + (width + length) * scale, artY);
    context.lineTo(artX + (width + length) * scale, bodyTop);
    const bodyWidth = getCartonBodyWidths(spec).reduce((sum, value) => sum + value, 0);
    context.lineTo(artX + bodyWidth * scale, bodyTop);
    context.lineTo(artX + bodyWidth * scale, bodyBottom);
    context.lineTo(artX + 2 * (width + length) * scale, bodyBottom);
    context.lineTo(artX + 2 * (width + length) * scale, flapBottom);
    context.lineTo(artX + (2 * width + length) * scale, flapBottom);
    context.lineTo(artX + (2 * width + length) * scale, bodyBottom);
    context.lineTo(artX, bodyBottom);
    context.closePath();
  }

  function generateLabelSizeImageJpeg(image, geometry, spec, data, includeRemark, includeRoundArc, includeBatchNumber, customRemark) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = '#000000';
    context.font = '700 88px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.fillText(getSizeImageTitle(spec.kind === 'print' ? 'print' : 'label', data, includeRemark, includeRoundArc, customRemark), 505, 140);
    context.font = '78px "Microsoft YaHei", "PingFang SC", sans-serif';
    const panelCount = Math.max(1, Number(geometry.panelCount) || 1);
    const artworkWidth = spec.width * panelCount;
    const sizeText = panelCount > 1
      ? '\u89c4\u683c\u5c3a\u5bf8\uff1a\u5355\u9762\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM\uff08\u53cc\u9762\u5c55\u5f00\u5bbd' + formatSizeImageNumber(artworkWidth) + 'CM\uff09'
      : '\u89c4\u683c\u5c3a\u5bf8\uff1a\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM';
    context.fillText(sizeText, 505, 260);
    if (includeBatchNumber) {
      context.fillStyle = '#ee1410';
      context.font = '76px "Microsoft YaHei", "PingFang SC", sans-serif';
      const batchNote = shouldUseFullLabelDateRemark(data) ? '\uff08\u751f\u4ea7\u65e5\u671f+\u622a\u6b62\u65e5\u671f+\u6279\u6b21\u53f7\uff09' : '\uff08\u6279\u6b21\u53f7\uff09';
      context.fillText(batchNote, 469, 370);
    }

    const drawScale = Math.min(2050 / artworkWidth, 1550 / spec.height);
    const artWidth = artworkWidth * drawScale;
    const artHeight = spec.height * drawScale;
    const artX = Math.round((3000 - artWidth) / 2);
    const artY = clamp(Math.round((3000 - artHeight) / 2), 760, 1200);
    const cornerRadius = spec.kind === 'label' && includeRoundArc ? Math.min(18, Math.max(6, drawScale * 0.08)) : 0;
    context.save();
    context.beginPath();
    if (cornerRadius) traceSizeImageRoundedRect(context, artX, artY, artWidth, artHeight, cornerRadius);
    else context.rect(artX, artY, artWidth, artHeight);
    context.clip();
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (geometry.rotated) {
      context.translate(artX + artWidth / 2, artY + artHeight / 2);
      context.rotate(-Math.PI / 2);
      context.drawImage(image, geometry.cropX, geometry.cropY, geometry.cropWidth, geometry.cropHeight, -artHeight / 2, -artWidth / 2, artHeight, artWidth);
    } else {
      context.drawImage(image, geometry.cropX, geometry.cropY, geometry.cropWidth, geometry.cropHeight, artX, artY, artWidth, artHeight);
    }
    context.restore();
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    if (cornerRadius) {
      context.beginPath();
      traceSizeImageRoundedRect(context, artX + 0.5, artY + 0.5, artWidth - 1, artHeight - 1, Math.max(0, cornerRadius - 0.5));
      context.stroke();
    } else {
      context.strokeRect(artX + 0.5, artY + 0.5, artWidth - 1, artHeight - 1);
    }

    context.strokeStyle = '#ee1410';
    context.fillStyle = '#ee1410';
    context.lineWidth = 4;
    const tick = 28;
    const heightX = artX - 48;
    drawSizeImageLine(context, heightX, artY, heightX, artY + artHeight);
    drawSizeImageLine(context, heightX - tick, artY, heightX + tick, artY);
    drawSizeImageLine(context, heightX - tick, artY + artHeight, heightX + tick, artY + artHeight);
    context.save();
    context.translate(heightX - 112, artY + artHeight / 2);
    context.rotate(-Math.PI / 2);
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    context.fillText(formatSizeImageNumber(spec.height) + 'cm', 0, 0);
    context.restore();
    const bottomY = artY + artHeight + 48;
    drawSizeImageLine(context, artX, bottomY, artX + artWidth, bottomY);
    drawSizeImageLine(context, artX, bottomY - tick, artX, bottomY + tick);
    drawSizeImageLine(context, artX + artWidth, bottomY - tick, artX + artWidth, bottomY + tick);
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'center';
    if (panelCount > 1) {
      for (let panelIndex = 1; panelIndex < panelCount; panelIndex += 1) {
        const dividerX = artX + artWidth * panelIndex / panelCount;
        context.save();
        context.strokeStyle = 'rgba(238, 20, 16, 0.65)';
        context.setLineDash([18, 14]);
        drawSizeImageLine(context, dividerX, artY, dividerX, artY + artHeight);
        context.restore();
        drawSizeImageLine(context, dividerX, bottomY - tick, dividerX, bottomY + tick);
      }
      for (let panelIndex = 0; panelIndex < panelCount; panelIndex += 1) {
        context.fillText(formatSizeImageNumber(spec.width) + 'cm', artX + artWidth * (panelIndex + 0.5) / panelCount, bottomY + 34);
      }
    } else {
      context.fillText(formatSizeImageNumber(spec.width) + 'cm', artX + artWidth / 2, bottomY + 34);
    }
    return canvas.toDataURL('image/jpeg', 0.96);
  }

  function shouldUseFullLabelDateRemark(data) {
    const brand = String(data && data.brand || '').trim().toUpperCase();
    const flatSpec = getLabelSizeImageSpec(data);
    return ['DOCTEAT', 'GOOGEER', 'BUSHAID'].some((name) => brand.includes(name)) && !getSizeImageSpec(data) && Boolean(flatSpec && flatSpec.kind === 'label');
  }

  function getSizeImageTitle(type, data, includeRemark, includeRoundArc, customRemark) {
    const base = type === 'label' ? '\u6807\u7b7e' : (type === 'print' ? '\u5370\u5237' : '\u7eb8\u76d2');
    if (!includeRemark && typeof customRemark !== 'string') return base;
    const remarks = getSizeImageRemarks(data);
    const sourceRemark = typeof customRemark === 'string' ? customRemark.trim() : (type === 'carton' ? remarks.carton : remarks.label);
    const roundArcRemark = type === 'label' && includeRoundArc && !String(sourceRemark || '').includes('\u5706\u5f27') ? '\u5706\u5f27' : '';
    const remark = [sourceRemark, roundArcRemark].filter(Boolean).join(' ');
    return remark ? base + '\uff08' + remark + '\uff09' : base;
  }

  function traceSizeImageRoundedRect(context, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(Number(radius) || 0, width / 2, height / 2));
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawSizeImageLine(context, x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(Math.round(x1), Math.round(y1));
    context.lineTo(Math.round(x2), Math.round(y2));
    context.stroke();
  }

  function formatSizeImageError(error) {
    const message = String(error && error.message || error || '').trim();
    return message || '\u65e0\u6cd5\u8bc6\u522b\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\uff0c\u8bf7\u68c0\u67e5\u56fe\u7247\u4e0e PLM \u5c3a\u5bf8\u662f\u5426\u5339\u914d\u3002';
  }

  async function saveCurrentSizeImagesToFolder() {
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && state.sizeImageSessions[sku];
    const currentData = normalizeData(state.data || (sku ? loadData(sku) : null));
    const flatSpecs = getLabelSizeImageSpecs(currentData);
    if (session) migrateLegacySizeImageResult(session, flatSpecs[0]);
    const flatFiles = session ? flatSpecs.map((spec) => {
      const result = session.flatResults[spec.key];
      if (!result || !result.dataUrl) return null;
      const flatLabel = (result.kind || spec.kind) === 'print' ? '\u5370\u5237' : '\u6807\u7b7e';
      const materialCode = namingCodes(result.code || spec.code)[0] || compactText(result.code || spec.code || '') || sku;
      return { name: sanitizeDownloadFileName(flatLabel + materialCode + '.jpg'), dataUrl: result.dataUrl };
    }).filter(Boolean) : [];
    const cartonCode = namingCodes(currentData.packageCode)[0] || compactText(currentData.packageCode || '') || sku;
    const files = session ? [
      session.cartonResultDataUrl ? { name: sanitizeDownloadFileName('\u7eb8\u76d2' + cartonCode + '.jpg'), dataUrl: session.cartonResultDataUrl } : null,
      ...flatFiles,
    ].filter(Boolean) : [];
    if (!files.length) {
      showToast('\u8bf7\u5148\u751f\u6210\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\u5c3a\u5bf8\u56fe');
      return;
    }
    const picker = getSaveFilePicker();
    if (!picker) {
      showToast('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u53e6\u5b58\u4e3a\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
      return;
    }
    try {
      for (const file of files) {
        const handle = await picker({
          suggestedName: file.name,
          types: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(await (await fetch(file.dataUrl)).blob());
        await writable.close();
      }
      showToast('\u5df2\u4fdd\u5b58 ' + files.length + ' \u4e2a\u5c3a\u5bf8\u56fe JPG');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      console.warn('PLM floating helper size image folder save failed:', error);
      showToast('\u4fdd\u5b58\u5931\u8d25\uff1a' + formatErrorMessage(error));
    }
  }

  async function regenerateCurrentSizeImages() {
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && ensureSizeImageSession(sku);
    if (!session) return;
    if (state.sizeImageBusySku === sku) return;
    const data = normalizeData(state.data || (sku ? loadData(sku) : null));
    const flatSpecs = getLabelSizeImageSpecs(data);
    migrateLegacySizeImageResult(session, flatSpecs[0]);
    const sources = [
      session.cartonFile ? { file: session.cartonFile, type: 'carton' } : null,
      ...flatSpecs.map((spec) => session.flatFiles[spec.key] ? { file: session.flatFiles[spec.key], type: 'label:' + spec.key } : null),
    ].filter(Boolean);
    if (!sources.length) {
      showToast('\u8bf7\u5148\u5bfc\u5165\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\u56fe\u7247');
      return;
    }
    state.sizeImageBusySku = sku;
    session.error = '';
    session.processingStep = '\u6b63\u5728\u6309\u6700\u65b0\u9009\u9879\u91cd\u65b0\u751f\u6210...';
    if (state.view === 'sizeImage') renderShell();
    await yieldSizeImageUi();
    try {
      const errors = [];
      for (const source of sources) {
        await processSizeImageFile(source.file, source.type, true);
        if (session.error) errors.push(session.error);
      }
      session.error = errors.join('\n');
      if (!errors.length) showToast('\u5df2\u6309\u6700\u65b0\u9009\u9879\u91cd\u65b0\u751f\u6210\u5c3a\u5bf8\u56fe');
    } finally {
      if (state.sizeImageBusySku === sku) state.sizeImageBusySku = '';
      session.processingStep = '';
      if (state.view === 'sizeImage') renderShell();
    }
  }

  async function confirmPendingSizeImageMatch(pendingId) {
    const sku = state.selectedSku || (state.data && state.data.sku) || '';
    const session = sku && ensureSizeImageSession(sku);
    if (!session || state.sizeImageBusySku === sku) return;
    const pending = session.pendingLabelMatches.find((item) => item.id === pendingId);
    const panel = document.getElementById(PANEL_ID);
    const select = panel && panel.querySelector('.pfh-size-image-match-select[data-pending-id="' + cssEscape(pendingId) + '"]');
    const specKey = select && select.value;
    if (!pending || !specKey) {
      showToast('\u8bf7\u9009\u62e9\u56fe\u7247\u5bf9\u5e94\u7684\u5c3a\u5bf8');
      return;
    }
    await processSizeImageFile(pending.file, 'label:' + specKey, false);
  }

  function getLedgerPerformanceKind(record) {
    if (record && record.status === '作废') return 'void';
    if (record && record.performanceType === 'extension') return 'extension';
    const designType = String(record && record.designType || '').replace(/\s+/g, '');
    return /(?:换|无)(?:logo|标识|商标)/i.test(designType) ? 'logo' : 'design';
  }

  function summarizeLedgerPerformance(records) {
    const summary = { design: 0, logo: 0, void: 0, extension: 0, mergedGroups: 0, groups: [], total: 0 };
    const units = new Map();
    const weight = { extension: 3, void: 5, logo: 10, design: 14 };
    (records || []).forEach((record, index) => {
      const groupId = String(record && record.performanceGroupId || '').trim();
      const unitKey = groupId ? 'group:' + groupId : 'record:' + getLedgerSelectionKey(record) + ':' + index;
      const kind = getLedgerPerformanceKind(record);
      const current = units.get(unitKey);
      if (!current) units.set(unitKey, { kind, count: 1, grouped: Boolean(groupId), groupId, records: [record] });
      else {
        current.count += 1;
        current.records.push(record);
        if (weight[kind] > weight[current.kind]) current.kind = kind;
      }
    });
    units.forEach((unit) => {
      summary[unit.kind] += 1;
      if (unit.grouped && unit.count > 1) {
        summary.mergedGroups += 1;
        summary.groups.push({
          id: unit.groupId,
          kind: unit.kind,
          skus: unit.records.map((record) => String(record && record.sku || '')).filter(Boolean),
        });
      }
    });
    summary.total = (summary.design * 14 + summary.logo * 10 + summary.void * 5 + summary.extension * 3) / 10;
    return summary;
  }

  function formatLedgerPerformance(value) {
    const number = Math.round((Number(value) || 0) * 10) / 10;
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  }

  function ledgerPerformanceHtml(summary) {
    const value = summary || summarizeLedgerPerformance([]);
    const breakdown = '设计 ' + value.design + ' × 1.4 · 换/无 Logo ' + value.logo + ' × 1 · 作废 ' + value.void + ' × 0.5 · 延伸 ' + value.extension + ' × 0.3';
    const kindLabels = { design: '设计 1.4 分', logo: '换/无 Logo 1 分', void: '作废 0.5 分', extension: '延伸 0.3 分' };
    const groups = Array.isArray(value.groups) ? value.groups : [];
    const groupHtml = groups.length
      ? '<details class="pfh-ledger-merge-groups"><summary>已合并 ' + escapeHtml(String(groups.length)) + ' 组，点击展开组合明细</summary><div class="pfh-ledger-merge-list">' +
        groups.map((group, index) => '<button type="button" class="pfh-ledger-merge-group" data-action="ledger-highlight-performance-group" data-group-id="' + escapeHtml(group.id) + '" title="高亮这一组的产品卡片"><b>合并组 ' + escapeHtml(String(index + 1)) + ' · ' + escapeHtml(kindLabels[group.kind] || '') + '</b><span>' + escapeHtml((group.skus || []).join(' + ')) + '</span></button>').join('') +
        '</div></details>'
      : '';
    return '<div class="pfh-ledger-performance" aria-live="polite"><div class="pfh-ledger-performance-summary"><div><span>当月总绩效</span><small>' + escapeHtml(breakdown) + '</small></div><strong>' + escapeHtml(formatLedgerPerformance(value.total)) + '</strong></div>' + groupHtml + '</div>';
  }

  function refreshLedgerPerformanceSummary() {
    if (state.view !== 'ledger' || state.ledgerView !== 'finalized') return;
    const panel = document.getElementById(PANEL_ID);
    const current = panel && panel.querySelector('.pfh-ledger-performance');
    if (!current) return;
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    current.outerHTML = ledgerPerformanceHtml(summarizeLedgerPerformance(records));
  }

  function highlightLedgerPerformanceGroup(groupId) {
    const id = String(groupId || '').trim();
    const panel = document.getElementById(PANEL_ID);
    if (!id || !panel) return;
    const cards = Array.from(panel.querySelectorAll('.pfh-ledger-item[data-performance-group-id="' + cssEscape(id) + '"]'));
    panel.querySelectorAll('.pfh-ledger-item.is-group-highlighted').forEach((card) => card.classList.remove('is-group-highlighted'));
    if (!cards.length) {
      showToast('当前列表中没有找到这一组合并产品');
      return;
    }
    cards.forEach((card) => card.classList.add('is-group-highlighted'));
    cards[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    window.clearTimeout(state.ledgerGroupHighlightTimer);
    state.ledgerGroupHighlightTimer = window.setTimeout(() => {
      cards.forEach((card) => card.classList.remove('is-group-highlighted'));
      state.ledgerGroupHighlightTimer = 0;
    }, 2600);
    showToast('已高亮这一组的 ' + cards.length + ' 个产品');
  }

  function ledgerPerformanceMergeButtonHtml(records, selectedKeys) {
    const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
    const selectedRecords = (records || []).filter((record) => selected.has(getLedgerSelectionKey(record)));
    const selectedGroupId = String(selectedRecords[0] && selectedRecords[0].performanceGroupId || '');
    const canUnmerge = Boolean(selectedGroupId) && selectedRecords.every((record) => String(record.performanceGroupId || '') === selectedGroupId);
    const disabled = !canUnmerge && selectedRecords.length < 2;
    return '<button type="button" class="pfh-ledger-performance-merge" data-action="' + (canUnmerge ? 'ledger-performance-unmerge' : 'ledger-performance-merge') + '" title="' + (canUnmerge ? '取消选中编码的绩效合并' : '将选中的多个编码合并为一个绩效单位') + '"' + (disabled ? ' disabled' : '') + '>' + (canUnmerge ? '取消合并' : '合并绩效') + '</button>';
  }

  function refreshLedgerPerformanceMergeButton() {
    if (state.view !== 'ledger' || state.ledgerView !== 'finalized') return;
    const panel = document.getElementById(PANEL_ID);
    const current = panel && panel.querySelector('.pfh-ledger-performance-merge');
    if (!current) return;
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    current.outerHTML = ledgerPerformanceMergeButtonHtml(records, new Set(state.ledgerSelectedKeys || []));
  }

  function ledgerViewHtml(records) {
    const mode = state.ledgerView === 'trash' ? 'trash' : (state.ledgerView === 'finalized' ? 'finalized' : 'design');
    const groups = groupLedgerRecordsByDate(records, mode === 'trash' ? 'design' : mode);
    const performanceSummary = mode === 'finalized' ? summarizeLedgerPerformance(records) : null;
    const performanceHtml = performanceSummary ? ledgerPerformanceHtml(performanceSummary) : '';
    const performanceGroupLabels = new Map((performanceSummary && performanceSummary.groups || []).map((group, index) => [group.id, '合并组 ' + (index + 1)]));
    const selectedKeys = new Set(state.ledgerSelectedKeys || []);
    const mergePerformanceHtml = mode === 'finalized' ? ledgerPerformanceMergeButtonHtml(records, selectedKeys) : '';
    const rows = groups.length ? groups.map((group) => {
      const allSelected = mode === 'finalized' && group.items.length && group.items.every((record) => selectedKeys.has(getLedgerSelectionKey(record)));
      const daySelect = mode === 'finalized' ? '<button type="button" class="pfh-ledger-day-select' + (allSelected ? ' is-selected' : '') + '" data-action="ledger-select-date" data-date="' + escapeHtml(group.date) + '">' + (allSelected ? '取消当天' : '选择当天') + '</button>' : '';
      return '<section class="pfh-ledger-day"><h4>' + escapeHtml(formatLedgerDateLabel(group.date)) + '<span>' + escapeHtml(String(group.items.length)) + ' 条</span>' + daySelect + '</h4>' + group.items.map((record) => mode === 'trash' ? ledgerTrashRowHtml(record) : ledgerRowHtml(record, mode, performanceGroupLabels)).join('') + '</section>';
    }).join('') : '<div class="pfh-ledger-empty">' + escapeHtml(mode === 'trash' ? '本月垃圾篓是空的。' : (mode === 'finalized' ? '本月还没有已定稿记录。' : '本月还没有出图记录。打开设计分配在本月的 PLM 详情后会自动加入。')) + '</div>';
    const month = getCurrentLedgerMonth();
    return '<div class="pfh-detail-scroll"><section class="pfh-ledger-page">' +
      '<div class="pfh-ledger-hero"><button type="button" class="pfh-ledger-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div><h3>今日工作台</h3><p>' + escapeHtml(mode === 'trash' ? '移除记录会阻止 PLM 再次自动加入，恢复后才解除拦截。' : '按设计分配日期整理出图，定稿后继续跟纸盒、标签和图包。') + '</p></div><div class="pfh-ledger-hero-actions"><span>' + escapeHtml(records.length + ' 条 / ' + month) + '</span><button type="button" class="pfh-ledger-fullscreen-toggle" data-action="ledger-fullscreen-toggle" aria-pressed="' + (state.ledgerFullscreen ? 'true' : 'false') + '">' + (state.ledgerFullscreen ? '退出全屏' : '全屏') + '</button></div></div>' +
      '<div class="pfh-ledger-tabs">' +
        '<button type="button" class="' + (mode === 'design' ? 'is-active' : '') + (state.ledgerTabTransition === 'design' ? ' is-tab-transition' : '') + '" data-action="ledger-view-design">待定稿</button>' +
        '<button type="button" class="' + (mode === 'finalized' ? 'is-active' : '') + (state.ledgerTabTransition === 'finalized' ? ' is-tab-transition' : '') + '" data-action="ledger-view-finalized">已定稿</button>' +
        '<button type="button" class="' + (mode === 'trash' ? 'is-active' : '') + (state.ledgerTabTransition === 'trash' ? ' is-tab-transition' : '') + '" data-action="ledger-view-trash">垃圾篓</button>' +
      '</div>' +
      performanceHtml +
      '<div class="pfh-ledger-toolbar">' +
        '<button type="button" class="pfh-ledger-month" data-action="ledger-prev-month" title="上个月">‹</button>' +
        '<button type="button" class="pfh-ledger-month-label" data-action="ledger-today">' + escapeHtml(formatLedgerMonthLabel(month)) + '</button>' +
        '<button type="button" class="pfh-ledger-month" data-action="ledger-next-month" title="下个月">›</button>' +
        '<button type="button" data-action="ledger-today">本月</button>' +
        (mode === 'trash'
          ? '<button type="button" data-action="ledger-trash-empty"' + (records.length ? '' : ' disabled') + '>清空本月垃圾篓</button>'
          : mergePerformanceHtml +
            '<button type="button" data-action="ledger-copy" title="导出已定稿内容到登记表">导出到登记</button>' +
            '<button type="button" data-action="ledger-copy-selected" title="复制当前勾选的产品编码">复制选中编码</button>' +
            '<button type="button" data-action="ledger-copy-video" title="复制选中产品的视频申请内容">制作视频</button>') +
      '</div>' +
      '<div class="pfh-ledger-list">' + rows + '</div>' +
      ledgerTimeEditorHtml() +
      '</section></div>';
  }

  function ledgerRowHtml(record, mode, performanceGroupLabels) {
    const sku = record.sku || '';
    const title = [record.brand, record.name].filter(Boolean).join(' ') || sku;
    const thumbUrl = mode === 'design' ? record.benchmarkImageUrl : (record.skuImageUrl || record.benchmarkImageUrl);
    const thumb = thumbUrl ? '<img src="' + escapeHtml(thumbUrl) + '" alt="">' : '<span class="pfh-ledger-thumb-empty">' + iconHtml('image') + '</span>';
    const status = record.status || '待定稿';
    const imageGenerated = Boolean(record.imageGeneratedAt);
    const workflowStatus = /^(?:作废|已完成|异常)$/.test(status) ? status : (record.finalizedAt ? '已定稿' : (imageGenerated ? '待定稿' : '待出图'));
    const workDate = mode === 'finalized' ? getLedgerFinalizedDate(record) : getLedgerDesignDate(record);
    const designType = record.designType || '未分类';
    const artPriority = record.artPriority || '';
    const priorityClass = /^P0.*(?:紧急|urgent)/i.test(artPriority) ? ' is-p0-urgent' : (/^P0.*(?:当日|当天|today)/i.test(artPriority) ? ' is-p0-today' : (/^P0/i.test(artPriority) ? ' is-p0-urgent' : (/^P1/i.test(artPriority) ? ' is-p1' : '')));
    const packageCode = record.packageCode || '';
    const printCode = record.printCode || '';
    const purchasePrice = String(record.purchasePrice || '').trim();
    const dateAttr = escapeHtml(record.date || workDate);
    const selected = (state.ledgerSelectedKeys || []).includes(getLedgerSelectionKey(record));
    const referenceButton = record.referenceUrl
      ? '<button type="button" class="pfh-ledger-link" data-action="ledger-open-reference" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="打开参考链接">' + iconHtml('link') + '</button>'
      : '<button type="button" class="pfh-ledger-link is-disabled" disabled title="没有参考链接">' + iconHtml('link') + '</button>';
    const statusPill = '<span class="pfh-ledger-status is-' + escapeHtml(getLedgerStatusClass(workflowStatus)) + '">' + escapeHtml(workflowStatus) + '</span>';
    const dateText = mode === 'finalized'
      ? ((record.status === '作废' ? '作废 ' : '定稿 ') + (record.finalizedAt ? formatLedgerMinuteLabel(record.finalizedAt, workDate) : formatLedgerDateLabel(workDate)))
      : ('分配 ' + formatLedgerMinuteLabel(record.designAssignedAt || workDate, workDate));
    const tagHtml = '<div class="pfh-ledger-tags">' +
      '<button type="button" class="is-sku" data-action="ledger-copy-sku" data-sku="' + escapeHtml(sku) + '" title="点击复制产品编码">' + escapeHtml(sku) + '</button>' +
      '<span class="is-design-type" title="设计类型">' + escapeHtml(designType) + '</span>' +
      (artPriority ? '<span class="is-priority' + priorityClass + '" title="美工处理优先级">' + escapeHtml(artPriority) + '</span>' : '') +
      (record.performanceType === 'extension' ? '<span class="is-extension" title="绩效按 0.3 分计算">延伸 · 0.3</span>' : '') +
      (performanceGroupLabels && performanceGroupLabels.get(record.performanceGroupId) ? '<span class="is-performance-group" title="此编码已合并绩效">' + escapeHtml(performanceGroupLabels.get(record.performanceGroupId)) + '</span>' : '') +
      '</div>';
    const assignmentHtml = '<div class="pfh-ledger-assignment">' + escapeHtml(dateText) +
      (mode === 'finalized' ? '<button type="button" class="pfh-ledger-edit-time" data-action="ledger-edit-finalized-time" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">改时间</button>' : '') +
      '</div>';
    const workflowHtml = mode === 'finalized' ? '' : '<div class="pfh-ledger-flow is-step-' + (record.finalizedAt ? '3' : (imageGenerated ? '2' : '1')) + '">' +
      '<span><i></i>出图</span><em></em><span><i></i>定稿</span><em></em><span><i></i>文件</span></div>';
    const menuHtml = ledgerOverflowMenuHtml(record, sku, dateAttr, imageGenerated);
    const menuOpen = state.ledgerMenuSku === sku && state.ledgerMenuDate === normalizeLedgerDate(record.date || workDate);
    const moreButton = '<div class="pfh-ledger-more"><button type="button" data-action="ledger-more" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" aria-label="更多操作" aria-expanded="' + (menuOpen ? 'true' : 'false') + '"><span class="pfh-more-dots"><i></i><i></i><i></i></span></button>' + menuHtml + '</div>';
    const actions = mode === 'finalized'
      ? '<div class="pfh-ledger-file-actions">' +
        ledgerArtworkStateButtonHtml(sku, dateAttr, record.artworkState) +
        ledgerFileButtonHtml('ledger-toggle-box-file', sku, dateAttr, '纸盒', packageCode, record.boxFileState, record.boxFileDone) +
        ledgerFileButtonHtml('ledger-toggle-label-file', sku, dateAttr, '标签', printCode, record.labelFileState, record.labelFileDone) +
        ledgerFileButtonHtml('ledger-toggle-image-pack', sku, dateAttr, '图包', '', record.imagePackState, record.imagePackDone) +
        moreButton +
      '</div>'
      : '<div class="pfh-ledger-actions">' +
        (!imageGenerated ? '<button type="button" class="is-primary is-generate" data-action="ledger-image-generated" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '"><span>出图</span></button>' : (record.finalizedAt ? '<span class="pfh-ledger-complete">已定稿</span>' : '<label class="pfh-ledger-price' + (state.ledgerFlowTransitionSku === sku ? ' is-flow-transition' : '') + '"><span>¥</span><input type="text" inputmode="decimal" value="' + escapeHtml(purchasePrice) + '" placeholder="价格" aria-label="产品价格"></label><button type="button" class="is-primary is-finalize' + (state.ledgerFlowTransitionSku === sku ? ' is-flow-transition' : '') + '" data-action="ledger-finalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">' + ledgerFinalizeCheckIconHtml() + '<span>定稿</span><em>已出图</em></button>')) +
        moreButton +
      '</div>';
    const selectButton = mode === 'finalized' ? '<button type="button" class="pfh-ledger-select' + (selected ? ' is-selected' : '') + '" data-action="ledger-toggle-select" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" aria-label="' + (selected ? '取消选择' : '选择产品') + '"></button>' : '';
    return '<article class="pfh-ledger-item is-clickable is-' + escapeHtml(mode) + (selected ? ' is-selected' : '') + (menuOpen ? ' is-menu-open' : '') + '" data-ledger-sku="' + escapeHtml(sku) + '" data-ledger-date="' + dateAttr + '" data-performance-group-id="' + escapeHtml(record.performanceGroupId || '') + '" role="button" tabindex="0" title="点击进入 SKU 数据界面">' +
      selectButton +
      '<button type="button" class="pfh-ledger-thumb" data-action="ledger-open-sku" data-sku="' + escapeHtml(sku) + '">' + thumb + '</button>' +
      '<div class="pfh-ledger-main">' +
        '<div class="pfh-ledger-title-row"><button type="button" class="pfh-ledger-title" data-action="ledger-open-sku" data-sku="' + escapeHtml(sku) + '"><b>' + escapeHtml(title) + '</b></button>' + referenceButton + statusPill + '</div>' +
        tagHtml +
        assignmentHtml +
        '<div class="pfh-ledger-bottom">' + workflowHtml + actions + '</div>' +
      '</div>' +
    '</article>';
  }

  function refreshLedgerCard(record) {
    if (!record || state.view !== 'ledger') {
      renderShell();
      return;
    }
    const mode = state.ledgerView === 'finalized' ? 'finalized' : 'design';
    const panel = ensurePanel();
    const card = Array.from(panel.querySelectorAll('.pfh-ledger-item')).find((item) => item.getAttribute('data-ledger-sku') === record.sku && item.getAttribute('data-ledger-date') === record.date);
    const finalized = isLedgerFinalizedRecord(record);
    if ((mode === 'finalized' && !finalized) || (mode === 'design' && finalized)) {
      if (card) card.remove();
      else renderShell();
      return;
    }
    if (!card) {
      renderShell();
      return;
    }
    const performanceGroupLabels = mode === 'finalized'
      ? new Map(summarizeLedgerPerformance(getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())).groups.map((group, index) => [group.id, '合并组 ' + (index + 1)]))
      : null;
    card.outerHTML = ledgerRowHtml(record, mode, performanceGroupLabels);
  }

  function ledgerTrashRowHtml(record) {
    const sku = record.sku || '';
    const title = [record.brand, record.name].filter(Boolean).join(' ') || sku;
    const thumbUrl = record.skuImageUrl || record.benchmarkImageUrl || '';
    const thumb = thumbUrl ? '<img src="' + escapeHtml(thumbUrl) + '" alt="">' : '<span class="pfh-ledger-thumb-empty">' + iconHtml('image') + '</span>';
    const dateAttr = escapeHtml(record.date || '');
    const removedAt = record.removedAt ? '移除 ' + formatLedgerMinuteLabel(record.removedAt, record.date) : '已从工作台移除';
    return '<article class="pfh-ledger-item is-trash" data-ledger-sku="' + escapeHtml(sku) + '" data-ledger-date="' + dateAttr + '">' +
      '<div class="pfh-ledger-thumb">' + thumb + '</div>' +
      '<div class="pfh-ledger-main"><div class="pfh-ledger-title-row"><b>' + escapeHtml(title) + '</b><span class="pfh-ledger-status is-skip">垃圾篓</span></div>' +
      '<div class="pfh-ledger-tags"><button type="button" class="is-sku" data-action="ledger-copy-sku" data-sku="' + escapeHtml(sku) + '">' + escapeHtml(sku) + '</button><span class="is-design-type">' + escapeHtml(record.designType || '未分类') + '</span></div>' +
      '<div class="pfh-ledger-bottom"><div class="pfh-ledger-assignment">' + escapeHtml(removedAt) + '</div><div class="pfh-ledger-trash-actions"><button type="button" class="is-restore" data-action="ledger-trash-restore" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">恢复</button><button type="button" class="is-delete" data-action="ledger-trash-delete" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">清除</button></div></div></div>' +
      '</article>';
  }

  function closeRenderedLedgerMenus(panel, keepCard) {
    if (!panel) return;
    panel.querySelectorAll('.pfh-ledger-item.is-menu-open').forEach((card) => {
      if (keepCard && card === keepCard) return;
      card.classList.remove('is-menu-open');
      const menu = card.querySelector('.pfh-ledger-overflow-menu');
      const button = card.querySelector('[data-action="ledger-more"]');
      if (menu) menu.remove();
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  }

  function ledgerOverflowMenuHtml(record, sku, dateAttr, imageGenerated) {
    if (state.ledgerMenuSku !== sku || state.ledgerMenuDate !== normalizeLedgerDate(dateAttr)) return '';
    const rollback = record.status === '作废'
      ? '<button type="button" data-action="ledger-unfinalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回作废</button>'
      : record.finalizedAt
      ? '<button type="button" data-action="ledger-unfinalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回定稿</button>'
      : (imageGenerated ? '<button type="button" data-action="ledger-unmark-image-generated" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回出图</button>' : '');
    return '<div class="pfh-ledger-overflow-menu">' + rollback +
      '<button type="button" class="' + (record.performanceType === 'extension' ? 'is-active' : '') + '" data-action="ledger-extension" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">' + (record.performanceType === 'extension' ? '取消延伸（当前 0.3）' : '延伸（绩效 0.3）') + '</button>' +
      '<button type="button" data-action="ledger-void" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">作废</button>' +
      '<button type="button" data-action="ledger-done" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">完成</button>' +
      '<button type="button" data-action="ledger-remove" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">移除</button>' +
      '</div>';
  }

  function ledgerFileButtonHtml(action, sku, dateAttr, label, code, stateValue, doneFallback) {
    const value = normalizeLedgerFileState(stateValue, doneFallback);
    const title = label + '\uff1a' + ledgerFileStateLabel(value) + (code ? ' \u00b7 ' + code : '');
    return '<button type="button" class="is-' + escapeHtml(value) + '" data-action="' + action + '" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="' + escapeHtml(title) + '"><span>' + escapeHtml(label) + '</span>' + (value !== 'skip' && code ? '<small>' + escapeHtml(code) + '</small>' : '') + '</button>';
  }

  function ledgerFinalizeCheckIconHtml() {
    return '<svg class="pfh-ledger-finalize-check" viewBox="0 0 1024 1024" aria-hidden="true"><path d="M511.93 64.07C264.54 64.07 64 264.62 64 512s200.54 447.93 447.93 447.93c58.83 0.07 117.09-11.5 171.43-34.04 167.5-69.32 276.7-232.76 276.64-414.03-0.08-247.39-200.69-447.87-448.07-447.79z m0.41 831.87c-212.04 0.11-384.03-171.69-384.14-383.73-0.11-212.04 171.69-384.03 383.73-384.14 50.5 0 100.51 9.93 147.18 29.24C802.49 216.72 895.99 356.6 896.08 511.8c0.11 212.04-171.7 384.02-383.74 384.14z"></path><path d="M431.85 660.55l-121.19-121.2c-12.49-12.49-12.49-32.75 0-45.24 12.49-12.49 32.75-12.49 45.24 0l92.11 92.11L668.1 366.13c12.49-12.49 32.75-12.49 45.24 0 12.49 12.49 12.49 32.75 0 45.24L464.17 660.55c-8.92 8.92-23.39 8.92-32.32 0z"></path></svg>';
  }

  function ledgerTimeEditorHtml() {
    const editor = state.ledgerTimeEditor;
    if (!editor) return '';
    const date = new Date(editor.timeMs || Date.now());
    const dateValue = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return '<div class="pfh-ledger-time-modal" role="dialog" aria-modal="true" aria-label="修改定稿时间">' +
      '<div class="pfh-ledger-time-card">' +
        '<div class="pfh-ledger-time-head"><div><b>修改定稿时间</b><span>' + escapeHtml(editor.sku) + '</span></div><button type="button" data-action="ledger-time-close" aria-label="关闭">×</button></div>' +
        '<div class="pfh-ledger-time-fields"><label>日期<input class="pfh-ledger-time-date" type="text" inputmode="numeric" value="' + escapeHtml(dateValue) + '" placeholder="2026-07-10"></label><label>时间<span class="pfh-ledger-time-clock"><input class="pfh-ledger-time-hour" type="text" inputmode="numeric" maxlength="2" value="' + hour + '"><i>:</i><input class="pfh-ledger-time-minute" type="text" inputmode="numeric" maxlength="2" value="' + minute + '"></span></label></div>' +
        '<div class="pfh-ledger-time-presets"><button type="button" data-action="ledger-time-today">今天</button><button type="button" data-action="ledger-time-yesterday">昨天</button><button type="button" data-action="ledger-time-day-before">前天</button></div>' +
        '<div class="pfh-ledger-time-actions"><button type="button" data-action="ledger-time-close">取消</button><button type="button" class="is-primary" data-action="ledger-time-save">保存时间</button></div>' +
      '</div></div>';
  }

  function formatLedgerMonthLabel(month) {
    const match = String(month || '').match(/^(\d{4})-(\d{2})$/);
    return match ? (match[1] + ' 年 ' + Number(match[2]) + ' 月') : String(month || '本月');
  }

  function productThumbHtml(data) {
    const src = getSkuListImageUrl(data);
    if (!src) return '<span class="pfh-product-thumb is-empty">' + iconHtml('image') + '</span>';
    return '<button type="button" class="pfh-product-thumb" title="悬浮放大预览">' +
      '<span class="pfh-thumb-frame"><img src="' + escapeHtml(src) + '" alt=""></span>' +
      '<span class="pfh-thumb-preview"><img src="' + escapeHtml(src) + '" alt=""></span>' +
      '</button>';
  }

  function updateProductThumbInPlace(data) {
    if (!data || !data.sku || state.view !== 'detail' || !state.data || state.data.sku !== data.sku) return false;
    const panel = ensurePanel();
    const current = panel.querySelector('.pfh-product-hero .pfh-product-thumb');
    if (!current) return false;
    const src = getSkuListImageUrl(data);
    if (!src) return false;
    if (current.matches('button')) {
      current.querySelectorAll('img').forEach((image) => {
        if (image.getAttribute('src') !== src) image.setAttribute('src', src);
      });
    } else {
      current.outerHTML = productThumbHtml(data);
    }
    return true;
  }

  function updateInsightRecommendationInPlace(sku) {
    if (!sku || state.view !== 'detail' || !state.data || state.data.sku !== sku) return false;
    if (state.skuEditMode) return true;
    const panel = ensurePanel();
    const section = panel.querySelector('.pfh-graphic-section');
    if (!section) return false;
    const current = section.querySelector('.pfh-smart-recommend');
    const html = insightRecommendationHtml(state.data);
    if (current && html) current.outerHTML = html;
    else if (current) current.remove();
    else if (html) section.insertAdjacentHTML('beforeend', html);
    return true;
  }

  function formatPrintSizeDisplay(data) {
    if (!data) return '';
    return [data.printSizeText || '', data.tubeSegmentText || ''].filter(Boolean).join('\n');
  }

  function renderStatusHtml(statusText) {
    const openingDetail = state.openingProjectDetail || statusText === L.openingDetail;
    if (openingDetail || state.scanRunning || statusText === L.scanning || statusText === L.checkingMaterial) {
      const tip = getCurrentLoadingTip();
      return '<div class="pfh-status pfh-loading-tip"><span>' + (openingDetail ? '\u52a0\u8f7d\u4e2d' : '\u8bc6\u522b\u4e2d') + '</span><strong>' + escapeHtml(tip) + '</strong></div>';
    }
    return '';
  }

  function isLoadingTipVisible() {
    const panel = document.getElementById(PANEL_ID);
    return Boolean(panel && panel.querySelector('.pfh-detail.is-loading .pfh-loading-tip'));
  }

  function getCurrentLoadingTip() {
    const tips = normalizeLoadingTips(state.loadingTips);
    const seed = state.scanTargetSku || state.selectedSku || state.sku || String(Date.now());
    if (!state.loadingTipText || !tips.includes(state.loadingTipText)) lockLoadingTip(seed);
    return state.loadingTipText || DEFAULT_LOADING_TIPS[0];
  }

  function lockLoadingTip(seed) {
    const stableSeed = String(seed || state.scanTargetSku || state.selectedSku || state.sku || Date.now());
    if (state.loadingTipSeed === stableSeed && state.loadingTipText) return;
    const picked = pickLoadingTipItem(state.loadingTips, stableSeed);
    state.loadingTipText = picked.text;
    state.loadingTipId = picked.tipId || '';
    state.loadingTipSeed = stableSeed;
    recordLoadingTipImpression(picked);
  }

  function pickLoadingTipItem(tips, seed) {
    const items = normalizeLoadingTipItems(tips);
    let hash = 0;
    String(seed || '').split('').forEach((char) => {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    });
    const total = items.reduce((sum, item) => sum + item.weight, 0) || 1;
    let target = Math.abs(hash) % total;
    for (const item of items) {
      target -= item.weight;
      if (target < 0) return item;
    }
    return items[0] || { text: DEFAULT_LOADING_TIPS[0], tipId: '', weight: 1 };
  }

  function normalizeLoadingTips(tips) {
    return normalizeLoadingTipItems(tips).map((item) => item.text);
  }

  function normalizeLoadingTipItems(tips) {
    const seen = new Set();
    const list = (Array.isArray(tips) ? tips : []).map((item) => ({
      text: String(typeof item === 'string' ? item : (item && item.text) || '').trim(),
      tipId: String(item && typeof item === 'object' ? item.tipId || '' : ''),
      weight: Math.max(1, Math.min(20, Number(item && typeof item === 'object' ? item.weight : 1) || 1)),
    })).filter((item) => item.text && !seen.has(item.text) && seen.add(item.text));
    return list.length ? list.slice(0, 80) : DEFAULT_LOADING_TIPS.map((text) => ({ text, tipId: '', weight: 1 }));
  }

  function insightRecommendationHtml(data) {
    if (!data || !data.sku) return '';
    const recommendation = state.insightRecommendationSku === data.sku ? state.insightRecommendation : null;
    const categoryEditor = state.skuEditMode
      ? '<input type="text" class="pfh-smart-category-input" data-sku-edit-key="manualCategory" value="' + escapeHtml(getDisplayedProductCategory(data, true)) + '" placeholder="例如：玩具" autocomplete="off" spellcheck="false">'
      : '';
    if (state.insightRecommendationLoading && state.insightRecommendationSku === data.sku && !state.skuEditMode) {
      return '<div class="pfh-smart-recommend is-loading"><strong>\u667a\u80fd\u8865\u5168</strong><span>\u6b63\u5728\u5339\u914d\u5386\u53f2\u4ef7\u683c\u548c\u5546\u54c1\u7c7b\u578b...</span></div>';
    }
    if (!recommendation || !recommendation.recommendedPrice) {
      return state.skuEditMode
        ? '<div class="pfh-smart-recommend"><strong>\u667a\u80fd\u8865\u5168</strong><span>产品分类 / ' + categoryEditor + '</span></div>'
        : '';
    }
    const type = recommendation.effectiveProductType || recommendation.recommendedProductType || recommendation.productType || '';
    const confidence = recommendation.priceConfidence || recommendation.recommendationConfidence || '';
    const stats = formatRecommendationPriceStats(recommendation.priceStats);
    const reason = recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, type);
    const samples = formatRecommendationSamples(recommendation.priceSamples);
    return '<div class="pfh-smart-recommend"><strong>\u667a\u80fd\u8865\u5168</strong>' +
      '<span>\u63a8\u8350\u4ef7\u683c <b>' + escapeHtml(String(recommendation.recommendedPrice)) + '</b>' + (state.skuEditMode ? ' / ' + categoryEditor : (type ? ' / ' + escapeHtml(type) : '')) + (confidence ? ' / \u7f6e\u4fe1\u5ea6' + escapeHtml(confidence) : '') + '</span>' +
      (stats || reason ? '<small>' + escapeHtml([stats, reason].filter(Boolean).join(' / ')) + '</small>' : '') +
      (samples ? '<em>\u6837\u672c\u4f9d\u636e\uff1a' + escapeHtml(samples) + '</em>' : '') +
      '</div>';
  }

  function formatRecommendationSamples(samples) {
    if (!Array.isArray(samples) || !samples.length) return '';
    return samples.slice(0, 3).map((item) => {
      const sku = item && item.sku ? String(item.sku) : '';
      const price = item && item.price ? String(item.price) : '';
      const type = item && item.productType ? String(item.productType) : '';
      const packQty = item && item.packQty ? '\u88c5' + String(item.packQty) : '';
      return [sku, price ? '\uffe5' + price : '', type, packQty].filter(Boolean).join(' ');
    }).filter(Boolean).join('；');
  }

  function scheduleInsightRecommendation(data) {
    const sku = data && data.sku;
    if (!sku || state.insightRecommendationLoading || state.insightRecommendationSku === sku) return;
    state.insightRecommendationSku = sku;
    state.insightRecommendation = null;
    state.insightRecommendationLoading = true;
    window.setTimeout(() => loadInsightRecommendationForDetail(sku).catch((error) => {
      addLog('warn', '\u667a\u80fd\u8865\u5168\u5efa\u8bae\u83b7\u53d6\u5931\u8d25', sku + ' ' + formatErrorMessage(error));
    }).finally(() => {
      if (state.insightRecommendationSku === sku) {
        state.insightRecommendationLoading = false;
        if (!updateInsightRecommendationInPlace(sku)) renderShell();
      }
    }), 120);
  }

  async function loadInsightRecommendationForDetail(sku) {
    const data = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : null));
    if (!data || !data.sku) return;
    const productType = getProductTypeForInsight(data, null);
    const cloudRecommendation = await fetchInsightRecommendation(data, productType).catch(() => null);
    const recommendedType = cloudRecommendation && cloudRecommendation.recommendedProductType && cloudRecommendation.recommendedProductType !== productType ? cloudRecommendation.recommendedProductType : '';
    const effectiveProductType = recommendedType || (cloudRecommendation && cloudRecommendation.effectiveProductType) || productType;
    const recommendation = cloudRecommendation && cloudRecommendation.recommendedPrice ? cloudRecommendation : getLocalPriceRecommendation(data, effectiveProductType);
    if (!recommendation || !recommendation.recommendedPrice || state.insightRecommendationSku !== sku) return;
    state.insightRecommendation = {
      ...recommendation,
      productType,
      effectiveProductType,
      recommendedProductType: recommendation.recommendedProductType || recommendedType || '',
      recommendationReason: recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, effectiveProductType),
    };
    syncInsightEvent('recommendation', {
      sku: data.sku || '',
      brand: data.brand || '',
      name: data.name || '',
      productType: effectiveProductType || productType || '',
      price: String(recommendation.recommendedPrice || ''),
      recommendedPrice: String(recommendation.recommendedPrice || ''),
      source: recommendation.source || 'detail-recommendation',
      reason: state.insightRecommendation.recommendationReason || '',
      recommendationReason: state.insightRecommendation.recommendationReason || '',
      productTypeSource: recommendation.productTypeSource || '',
      productTypeScore: recommendation.productTypeScore || '',
      typeSampleCount: recommendation.typeSampleCount || '',
      recommendedProductType: state.insightRecommendation.recommendedProductType || '',
      effectiveProductType,
      priceConfidence: recommendation.priceConfidence || recommendation.recommendationConfidence || '',
      recommendationConfidence: recommendation.priceConfidence || recommendation.recommendationConfidence || '',
      priceStats: recommendation.priceStats || null,
    });
  }

  function getProductThumbUrl(data) {
    if (!data) return '';
    return /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') ? (data.skuImageUrl || data.skuImageFallbackUrl || '') : '';
  }

  function getSkuEditableFields() {
    return ['packageCode', 'printCode', 'packageSizeText', 'printSizeText', 'packageLength', 'packageWidth', 'packageHeight', 'productLength', 'productWidth', 'productHeight', 'netContent', 'grossWeight'];
  }

  function isSkuEditableField(key) {
    return getSkuEditableFields().includes(key);
  }

  function getSkuEditInputValue(data, key) {
    const rawValue = data && data[key] != null ? data[key] : '';
    if (!/^(?:package|product)(?:Length|Width|Height)$/.test(key)) return rawValue;
    const cmValue = extractCmValue(rawValue);
    return Number.isFinite(Number(cmValue)) && Number(cmValue) > 0 ? trimNumber(Number(cmValue)) : '';
  }

  function getSkuDataFieldLabel(key) {
    const labels = {
      brand: '品牌',
      name: '商品名称',
      manualCategory: '产品分类',
      packageCode: L.packageCode,
      printCode: L.printCode,
      packageSizeText: L.packageSize,
      printSizeText: L.printSize,
      packageLength: L.cartonLength,
      packageWidth: L.cartonWidth,
      packageHeight: L.cartonHeight,
      productLength: L.productLength,
      productWidth: L.productWidth,
      productHeight: L.productHeight,
      netContent: L.netContent,
      grossWeight: L.grossWeight,
      englishName: '英文产品名',
      ingredientChinese: '中文成分',
      ingredientEnglish: '英文成分',
      referenceUrl: '对标链接',
    };
    return labels[key] || key;
  }

  function getStoredDataChanges(data) {
    return Array.isArray(data && data.recentFieldChanges)
      ? data.recentFieldChanges.filter((item) => item && item.key && item.before !== item.after).slice(0, 20)
      : [];
  }

  function saveSkuManualEdits() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) return;
    const panel = ensurePanel();
    const values = {};
    Array.from(panel.querySelectorAll('[data-sku-edit-key]')).forEach((input) => {
      values[input.getAttribute('data-sku-edit-key')] = String(input.value || '').trim();
    });
    const next = { ...data };
    if (Object.prototype.hasOwnProperty.call(values, 'manualCategory')) {
      next.manualCategory = normalizeManualProductCategory(values.manualCategory);
      next.manualCategoryUpdatedAt = next.manualCategory ? new Date().toLocaleString() : '';
    }
    ['packageCode', 'printCode', 'packageSizeText', 'printSizeText', 'netContent', 'grossWeight'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) next[key] = values[key];
    });

    const packageKeys = ['packageLength', 'packageWidth', 'packageHeight'];
    const packageChanged = packageKeys.some((key) => compactText(values[key]) !== compactText(data[key]));
    if (packageChanged) {
      const packageNums = packageKeys.map((key) => firstNumber(values[key]));
      if (!packageNums.every((value) => Number.isFinite(value) && value > 0)) {
        showToast('纸盒长、宽、高需要填写完整的有效数字');
        return;
      }
      next.packageNums = packageNums;
      next.packageSizeText = packageNums.map(trimNumber).join('x') + 'cm';
    } else if (Object.prototype.hasOwnProperty.call(values, 'packageSizeText') && compactText(values.packageSizeText) !== compactText(data.packageSizeText)) {
      next.packageNums = null;
    }

    const productKeys = ['productLength', 'productWidth', 'productHeight'];
    const productChanged = productKeys.some((key) => compactText(values[key]) !== compactText(data[key]));
    if (productChanged) {
      const productNums = productKeys.map((key) => firstNumber(values[key]));
      if (!productNums.every((value) => Number.isFinite(value) && value > 0)) {
        showToast('产品长、宽、高需要填写完整的有效数字');
        return;
      }
      next.plmProductNums = productNums;
      next.productNums = productNums;
      if (data.isTubePrint) {
        next.tailSealLengthValue = formatSingleDimension(productNums[0]);
        next.tubeTailSealLengthValue = next.tailSealLengthValue;
      }
    }
    next.updatedAt = new Date().toLocaleString();
    next.updatedAtMs = Date.now();
    const categoryChanged = compactText(next.manualCategory) !== compactText(data.manualCategory);
    saveData(data.sku, next, { changeSource: '手动校准', trackEmptyChanges: true });
    state.skuEditMode = false;
    if (categoryChanged) {
      state.insightRecommendationSku = '';
      state.insightRecommendation = null;
      state.toyCopywritingErrorSku = '';
      state.toyCopywritingError = '';
    }
    resetExcelState();
    renderShell();
    addLog('success', 'SKU 数据手动校准已保存', data.sku);
    showToast('校准数据已保存');
  }

  function acknowledgeSkuDataChanges() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) return;
    const next = { ...data, recentFieldChanges: [] };
    saveData(data.sku, next, { suppressChangeTracking: true });
    renderShell();
    showToast('已确认本次数据更新');
  }

  function rowHtml(key, title, value, options) {
    const shown = value || L.unknown;
    const colorClass = /^package(Length|Width|Height)$/.test(key) ? ' is-carton-dim' : (/^product(Length|Width|Height)$/.test(key) ? ' is-product-dim' : '');
    const skuEditing = state.skuEditMode && isSkuEditableField(key);
    const editButton = !skuEditing && options && options.editable ? '<button type="button" data-edit-key="' + escapeHtml(key) + '">' + escapeHtml(L.edit) + '</button>' : '';
    const namingHint = /^(?:packageSizeText|printSizeText)$/.test(key) ? '左键复制尺寸，右键查看命名与历史编码' : L.copyHint;
    const copyAttr = skuEditing || options && options.noCopy ? '' : ' data-copy-key="' + escapeHtml(key) + '" title="' + escapeHtml(namingHint) + '"';
    const rawEditValue = getSkuEditInputValue(state.data, key);
    const dimensionPlaceholder = /^(?:package|product)(?:Length|Width|Height)$/.test(key) ? 'cm（自动换算 inch）' : '';
    const inputHtml = skuEditing ? '<input type="text" class="pfh-sku-edit-input" data-sku-edit-key="' + escapeHtml(key) + '" value="' + escapeHtml(rawEditValue) + '" placeholder="' + escapeHtml(dimensionPlaceholder) + '" autocomplete="off" spellcheck="false">' : '';
    return '<div class="pfh-row' + colorClass + (skuEditing ? ' is-sku-editing' : '') + '"' + copyAttr + ' data-key="' + escapeHtml(key) + '">' +
      '<span class="pfh-label"><span>' + escapeHtml(title) + '</span></span>' +
      '<span class="pfh-value">' + escapeHtml(shown).replace(/\n/g, '<br>') + '</span>' +
      inputHtml +
      '<span class="pfh-row-actions">' + editButton +
      '</span>' +
      '</div>';
  }

  function excelTriggerHtml() {
    return '<div class="pfh-excel-controls"><button type="button" data-action="excel-prepare">' + iconHtml('download') + '<span>' + escapeHtml(L.excel) + '</span></button></div>';
  }

  function excelOptionsHtml() {
    if (!state.excelPanelOpen) {
      return '';
    }
    const status = state.excelStatus || formatExcelMissingStatus(state.excelMissing);
    const statusClass = state.excelMissing.length || !state.excelExtra ? ' is-bad' : ' is-good';
    const priceValue = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    const exportLabel = state.exportType === 'toy-label' ? L.exportTypeToyLabel : L.exportTypeExcel;
    return '<div class="pfh-excel-form is-open">' +
      '<div class="pfh-export-menu' + (state.exportMenuOpen ? ' is-open' : '') + '">' +
        '<button type="button" class="pfh-export-menu-button" data-action="export-menu-toggle" aria-expanded="' + (state.exportMenuOpen ? 'true' : 'false') + '">' +
          '<span>' + escapeHtml(exportLabel) + '</span><i></i>' +
        '</button>' +
        '<div class="pfh-export-menu-list">' +
          '<button type="button" data-action="export-type" data-export-type="excel" class="' + (state.exportType === 'excel' ? 'is-active' : '') + '">' + escapeHtml(L.exportTypeExcel) + '</button>' +
          '<button type="button" data-action="export-type" data-export-type="toy-label" class="' + (state.exportType === 'toy-label' ? 'is-active' : '') + '">' + escapeHtml(L.exportTypeToyLabel) + '</button>' +
        '</div>' +
      '</div>' +
      '<input type="number" min="0" step="1" class="pfh-excel-price" placeholder="' + escapeHtml(L.excelPurchasePrice) + '" value="' + escapeHtml(priceValue) + '">' +
      '<button type="button" data-action="excel-prepare" title="' + escapeHtml(L.excelRefresh) + '">' + iconHtml('refresh') + '</button>' +
      '<button type="button" data-action="excel-generate">' + escapeHtml(L.excel) + '</button>' +
      '<span class="pfh-excel-status' + statusClass + '">' + escapeHtml(status) + '</span>' +
      '</div>';
  }

  function namingLogoKey(data) {
    return compactText((data && (data.logoText || data.brand)) || '').toUpperCase().replace(/[^A-Z0-9\u3400-\u9fff]/g, '');
  }

  function namingProductText(data) {
    const brand = cleanName((data && data.brand) || '');
    const name = cleanName((data && data.name) || '');
    return brand && name.toUpperCase().startsWith(brand.toUpperCase()) ? name : brand + name;
  }

  function namingSizeText(values) {
    return values.map((value) => trimNumber(Number(value))).join('x') + 'cm';
  }

  function namingCodes(value) {
    const matches = String(value || '').match(/\bMTL\d+\b/gi);
    return matches ? matches.map((code) => code.toUpperCase()) : [];
  }

  function packagingNamingEntries(data, key) {
    if (!data) return [];
    if (key === 'packageSizeText') {
      const values = Array.isArray(data.packageNums) ? data.packageNums.slice(0, 3).map(Number) : parseDimension(data.packageSizeText, 3);
      if (!values || values.length < 3 || values.slice(0, 3).some((value) => !Number.isFinite(value))) return [];
      const codes = namingCodes(data.packageCode);
      return [{
        type: 'package',
        label: compactText(data.packageSizeLabel || '纸盒'),
        values: values.slice(0, 3),
        size: namingSizeText(values.slice(0, 3)),
        code: codes[0] || compactText(data.packageCode || ''),
      }];
    }
    if (key !== 'printSizeText') return [];
    return getLabelSizeImageSpecs(data).map((spec) => ({
      type: 'print',
      label: compactText(spec.labelText || (spec.kind === 'label' ? '标签' : '印刷')),
      values: [Number(spec.width), Number(spec.height)],
      size: namingSizeText([spec.width, spec.height]),
      code: compactText(spec.code || ''),
    }));
  }

  function namingLine(entry, data) {
    const codeAndName = [entry.code, namingProductText(data)].filter(Boolean).join(' ');
    return entry.label + (/[）)]$/.test(entry.label) ? ' ' : '') + '（' + entry.size + '）' + codeAndName;
  }

  function namingDimensionDistance(left, right) {
    if (!left || !right || left.length !== right.length) return null;
    const distances = left.map((value, index) => Math.abs(Number(value) - Number(right[index])));
    if (left.length === 2) {
      const rotated = [Math.abs(Number(left[0]) - Number(right[1])), Math.abs(Number(left[1]) - Number(right[0]))];
      if (Math.max(...rotated) < Math.max(...distances)) distances.splice(0, distances.length, ...rotated);
    }
    if (distances.some((value) => !Number.isFinite(value) || value > 0.5 + 1e-8)) return null;
    return { max: Math.max(...distances), total: distances.reduce((sum, value) => sum + value, 0) };
  }

  function historicalNamingRecommendations(data, key, entries) {
    const currentSku = String((data && data.sku) || '');
    const currentLogo = namingLogoKey(data);
    const currentCodes = new Set(entries.map((entry) => entry.code).filter(Boolean));
    const recommendations = [];
    (state.index || []).forEach((item) => {
      if (!item || !item.sku || item.sku === currentSku) return;
      const history = normalizeData(loadData(item.sku) || item);
      packagingNamingEntries(history, key).forEach((candidate) => {
        if (!candidate.code || currentCodes.has(candidate.code)) return;
        let best = null;
        entries.forEach((entry) => {
          const distance = namingDimensionDistance(entry.values, candidate.values);
          if (distance && (!best || distance.max < best.max || (distance.max === best.max && distance.total < best.total))) best = distance;
        });
        if (!best) return;
        recommendations.push({
          code: candidate.code,
          size: candidate.size,
          label: candidate.label,
          brandName: namingProductText(history),
          sameLogo: Boolean(currentLogo && namingLogoKey(history) === currentLogo),
          exact: best.max < 0.01,
          max: best.max,
          total: best.total,
          updatedAtMs: Number(history.updatedAtMs || item.updatedAtMs || 0),
        });
      });
    });
    const deduped = new Map();
    recommendations.forEach((item) => {
      const old = deduped.get(item.code);
      if (!old || item.max < old.max || (item.max === old.max && item.sameLogo && !old.sameLogo)) deduped.set(item.code, item);
    });
    return Array.from(deduped.values()).sort((left, right) =>
      Number(right.sameLogo) - Number(left.sameLogo) || left.max - right.max || left.total - right.total || right.updatedAtMs - left.updatedAtMs || left.code.localeCompare(right.code)
    ).slice(0, 5);
  }

  function closePackagingNamingCard(panel) {
    const card = (panel || document).querySelector && (panel || document).querySelector('.pfh-packaging-naming-card');
    if (card) card.remove();
  }

  function showPackagingNamingCard(row, key, event) {
    const panel = row && row.closest('#' + PANEL_ID);
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!panel || !data) return;
    const entries = packagingNamingEntries(data, key);
    if (!entries.length) {
      showToast('当前尺寸无法生成命名');
      return;
    }
    closePackagingNamingCard(panel);
    const recommendations = historicalNamingRecommendations(data, key, entries);
    const entryHtml = entries.map((entry) => {
      const line = namingLine(entry, data);
      return '<button type="button" class="pfh-packaging-naming-current" data-naming-copy="' + escapeHtml(line) + '"><span>' + escapeHtml(line) + '</span></button>';
    }).join('');
    const recommendationHtml = recommendations.length ? recommendations.map((item) =>
      '<button type="button" class="pfh-packaging-naming-history" data-naming-copy="' + escapeHtml(item.code) + '">' +
        '<span><b>' + escapeHtml(item.code) + '</b><i>' + escapeHtml(item.exact ? '同尺寸' : '相近') + '</i>' + (item.sameLogo ? '<i class="is-logo">同 Logo</i>' : '') + '</span>' +
        '<small>' + escapeHtml(item.label + (/[）)]$/.test(item.label) ? ' ' : '') + '（' + item.size + '）' + (item.brandName ? ' ' + item.brandName : '')) + '</small>' +
      '</button>'
    ).join('') : '<p class="pfh-packaging-naming-empty">暂无同尺寸或偏差 0.5cm 以内的历史文件</p>';
    const card = document.createElement('section');
    card.className = 'pfh-packaging-naming-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', '包材命名与历史编码');
    card.innerHTML = '<header><div><b>' + (key === 'packageSizeText' ? '纸盒命名' : '标签 / 印刷命名') + '</b><span>点击内容即可复制</span></div><button type="button" data-naming-close aria-label="关闭">×</button></header>' +
      '<div class="pfh-packaging-naming-current-list">' + entryHtml + '</div>' +
      '<div class="pfh-packaging-naming-subtitle"><b>历史相近文件编码</b><span>同 Logo 优先 · 偏差 ≤ 0.5cm</span></div>' +
      '<div class="pfh-packaging-naming-history-list">' + recommendationHtml + '</div>';
    panel.appendChild(card);
    const panelRect = panel.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    card.style.left = Math.max(8, Math.min(event.clientX - panelRect.left, panelRect.width - cardRect.width - 8)) + 'px';
    card.style.top = Math.max(8, Math.min(event.clientY - panelRect.top, panelRect.height - cardRect.height - 8)) + 'px';
  }

  function handlePanelContextMenu(event) {
    const waterfallCard = event.target && event.target.closest && event.target.closest('.pfh-sku-waterfall-card[data-sku]');
    if (waterfallCard) {
      event.preventDefault();
      event.stopPropagation();
      closePackagingNamingCard(ensurePanel());
      showSkuWaterfallContextMenu(waterfallCard.getAttribute('data-sku'), event);
      return;
    }
    const row = event.target && event.target.closest && event.target.closest('.pfh-row[data-key="packageSizeText"], .pfh-row[data-key="printSizeText"]');
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    showPackagingNamingCard(row, row.getAttribute('data-key'), event);
  }

  function closeSkuWaterfallContextMenu(panel) {
    const menu = panel && panel.querySelector('.pfh-sku-context-menu');
    if (menu) menu.remove();
    state.skuContextMenuSku = '';
  }

  function showSkuWaterfallContextMenu(sku, event) {
    const panel = ensurePanel();
    closeSkuWaterfallContextMenu(panel);
    const item = state.index.find((entry) => entry.sku === sku);
    if (!item) return;
    const menu = document.createElement('div');
    menu.className = 'pfh-sku-context-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<button type="button" data-action="sku-context-pin" data-sku="' + escapeHtml(sku) + '">' + (item.pinned ? '取消置顶' : '置顶') + '</button>' +
      '<button type="button" data-action="sku-context-parameter" data-sku="' + escapeHtml(sku) + '">生成参数图</button>' +
      '<button type="button" data-action="sku-context-size" data-sku="' + escapeHtml(sku) + '"' + (!state.sizeImageAccessEnabled ? ' disabled title="当前账号暂无权限"' : '') + '>生成尺寸图</button>' +
      '<button type="button" class="is-danger" data-action="sku-context-delete" data-sku="' + escapeHtml(sku) + '">删除</button>';
    panel.appendChild(menu);
    state.skuContextMenuSku = sku;
    const panelRect = panel.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(event.clientX - panelRect.left, panelRect.width - menuRect.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(event.clientY - panelRect.top, panelRect.height - menuRect.height - 8)) + 'px';
  }

  async function openCopywritingFromCurrent(force) {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast('请先选择一个产品');
      return;
    }
    const sku = data.sku;
    const storedData = normalizeData(loadData(sku) || data);
    const currentCached = normalizeCopywritingRecord(data.copywriting);
    const storedCached = normalizeCopywritingRecord(storedData.copywriting);
    const initialCached = (currentCached && currentCached.fullText ? currentCached : null)
      || (storedCached && storedCached.fullText ? storedCached : null)
      || currentCached
      || storedCached;
    if (initialCached && initialCached.fullText && !(data.copywriting && data.copywriting.fullText)) {
      state.data = normalizeData({ ...data, copywriting: initialCached });
    }
    if (!state.copywritingMode) state.copywritingView = 'file';
    state.copywritingMode = true;
    state.copywritingLoading = !(initialCached && initialCached.fullText);
    state.copywritingError = '';
    state.copywritingStatus = state.copywritingLoading ? '正在打开产品信息...' : '';
    stopScan();
    stopMaterialWatch();
    cancelDrawerTabFlow();
    expandPanel();
    addLog('info', '产品文案：开始读取', sku + (force ? ' 重新获取' : ''));
    try {
      let drawer = getProjectDrawerForSku(sku);
      if (!drawer) {
        await openSelectedProjectDetail();
        drawer = await waitFor(() => getProjectDrawerForSku(sku), 6000, 150);
      }
      if (!drawer) throw new Error('未打开当前编码的项目详情');
      stopScan();
      state.copywritingStatus = '正在定位产品信息里的产品文案...';
      renderShell();
      await switchDrawerTab(drawer, L.productTab);
      const productReady = await waitFor(() => {
        const tab = findTabButton(drawer, L.productTab);
        return tab && isActiveTab(tab);
      }, 5000, 120);
      if (!productReady) throw new Error('无法切换到产品信息');
      const item = await waitFor(() => findProductCopywritingItem(drawer), 5000, 160);
      if (!item) throw new Error('产品信息中未找到“产品文案”字段');
      const file = findProductCopywritingFile(item, sku);
      if (!file) throw new Error('产品文案字段中未找到当前编码的 Word 文件');
      const workingData = normalizeData(loadData(sku) || state.data || data);
      const cached = normalizeCopywritingRecord(workingData.copywriting);
      const fileTimestamp = extractCopywritingFileTimestamp(file.fileName);
      if (!force && cached && cached.fullText && cached.parserVersion === COPYWRITING_PARSER_VERSION && compactText(cached.fileName).toLowerCase() === compactText(file.fileName).toLowerCase()) {
        state.data = workingData;
        state.copywritingStatus = '';
        state.copywritingError = '';
        addLog('info', '产品文案：命中历史缓存', file.fileName);
        return;
      }
      if (!force && cached && cached.fileTimestamp && fileTimestamp && fileTimestamp < cached.fileTimestamp) {
        state.copywritingError = '页面中的 Word 版本早于缓存，已保留较新的文案';
        addLog('warn', '产品文案：检测到旧附件', file.fileName + ' < ' + cached.fileName);
        return;
      }
      state.copywritingLoading = true;
      state.copywritingStatus = '正在触发 Word 下载 ' + file.fileName;
      renderShell();
      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, 'Word 下载监听');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('未读取到 Word 文件内容');
      addLog('info', '产品文案：已取得文件内容', source.arrayBuffer ? '内存 Word 数据' : String(source.url || '').replace(/\?.*$/, '?...'));
      let arrayBuffer;
      try {
        state.copywritingStatus = source.arrayBuffer ? '正在校验 Word 文件...' : '正在读取 Word 文件...';
        renderShell();
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, 'Word 文件读取');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('读取到的内容不是有效 Word 文件');
      } catch (error) {
        if (source.kind === 'captured') throw error;
        addLog('warn', '产品文案：组件地址不可直接读取，改用下载监听', formatErrorMessage(error));
        state.copywritingStatus = '正在重新监听 Word 下载...';
        renderShell();
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '备用下载监听')), kind: 'captured' };
        if (!source.url && !source.arrayBuffer) throw error;
        state.copywritingStatus = source.arrayBuffer ? '正在校验 Word 文件...' : '正在读取 Word 文件...';
        renderShell();
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '备用 Word 文件读取');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('下载监听取得的内容不是有效 Word 文件');
      }
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      state.copywritingStatus = '正在解析 Word 表格...';
      renderShell();
      addLog('info', '产品文案：开始解析 Word', file.fileName + ' | ' + arrayBuffer.byteLength + 'B');
      const parsedDocument = await withCopywritingTimeout(parseCopywritingDocxRows(arrayBuffer), 20000, 'Word 表格解析');
      const built = buildMainstreamCopywriting(parsedDocument, workingData);
      if (!built.sections.length) throw new Error('Word 中未识别到主流版文案字段');
      const next = buildCopywritingRecord(file.fileName, fileTimestamp, fileHash, built, cached);
      saveData(sku, mergeCopywritingCacheIntoData(workingData, next));
      state.copywritingStatus = '';
      state.copywritingError = '';
      const updated = Boolean(cached && cached.fullText && next.updatePending && (
        next.fileHash !== cached.fileHash
        || next.fileName !== cached.fileName
        || next.fullText !== cached.fullText
      ));
      addLog('info', updated ? '产品文案：检测到更新' : '产品文案：读取成功', file.fileName + ' ' + built.sections.length + '段');
      showToast(updated ? '文案已更新，差异已高亮' : '文案读取成功');
    } catch (error) {
      state.copywritingError = formatErrorMessage(error) || '产品文案读取失败';
      addLog('error', '产品文案读取失败', sku + ' ' + state.copywritingError);
      showToast('产品文案读取失败');
    } finally {
      state.copywritingLoading = false;
      renderShell();
    }
  }

  function acknowledgeCopywritingUpdate() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (!data || !data.sku || !record) return;
    const next = {
      ...record,
      updatePending: false,
      changedSectionKeys: [],
      removedSections: [],
      previousSections: [],
    };
    saveData(data.sku, { ...data, copywriting: next });
    showToast('已标记为查看');
    renderShell();
  }

  function markCopywritingCopied(sectionKey, copiedFullText) {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (!data || !data.sku || !record) return;
    const keys = new Set(record.copiedSectionKeys || []);
    if (copiedFullText) record.sections.forEach((section) => keys.add(section.key));
    else if (sectionKey) keys.add(sectionKey);
    const nextRecord = normalizeCopywritingRecord({
      ...record,
      copiedSectionKeys: Array.from(keys),
      copiedFullText: Boolean(record.copiedFullText || copiedFullText),
    });
    saveData(data.sku, {
      ...data,
      copywriting: nextRecord,
    }, { suppressChangeTracking: true });
    updateCopywritingCopiedUi(nextRecord);
  }

  function updateCopywritingCopiedUi(record) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || !state.copywritingMode || !record) return;
    const copied = new Set(record.copiedSectionKeys || []);
    const sectionMap = new Map((record.sections || []).map((section) => [section.key, section]));
    panel.querySelectorAll('.pfh-copywriting-block[data-copywriting-key]').forEach((block) => {
      const key = block.getAttribute('data-copywriting-key') || '';
      if (!copied.has(key)) return;
      const section = sectionMap.get(key);
      block.classList.add('is-copied');
      const button = block.querySelector('[data-action="copywriting-section-copy"]');
      if (button) button.innerHTML = copywritingCopiedIconHtml() + '已复制本段';
      if (!block.querySelector('.pfh-copywriting-copied-note')) {
        block.insertAdjacentHTML('beforeend', '<div class="pfh-copywriting-copied-note">' + copywritingCopiedIconHtml() + '<span>已复制：' + escapeHtml(section && (section.label || section.key) || key) + '</span></div>');
      }
    });
    const fullCard = panel.querySelector('.pfh-copywriting-full-card');
    if (fullCard && record.copiedFullText) {
      fullCard.classList.add('is-copied');
      const button = fullCard.querySelector('[data-action="copywriting-copy"]');
      if (button) button.innerHTML = copywritingCopiedIconHtml() + '已复制全文';
    }
    const progress = panel.querySelector('.pfh-copywriting-progress');
    if (progress && state.copywritingView !== 'full') {
      const visibleSections = (record.sections || []).filter(isCopywritingFileViewSection);
      const copiedCount = visibleSections.filter((section) => copied.has(section.key)).length;
      progress.textContent = '已复制 ' + copiedCount + ' / ' + visibleSections.length + ' · 点击卡片右侧按钮复制';
    }
  }

  async function hydrateCopywritingForSku(sku, options) {
    const opts = options || {};
    const resultGeneration = Number(state.skuResultGeneration[sku] || 0);
    if (!sku || state.copywritingHydratingSkus.has(sku)) return normalizeData(loadData(sku) || {});
    const failedAt = Number(state.copywritingHydrateFailedAt[sku] || 0);
    if (!opts.force && failedAt && Date.now() - failedAt < 10 * 60 * 1000) return normalizeData(loadData(sku) || {});
    if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
    const drawer = opts.drawer || getProjectDrawerForSku(sku);
    if (!drawer || drawer !== getProjectDrawerForSku(sku)) return normalizeData(loadData(sku) || {});
    state.copywritingHydratingSkus.add(sku);
    const originalTab = getActiveTabText(drawer);
    try {
      if (opts.silent && !opts.file && getActiveTabText(drawer) !== L.productTab) return normalizeData(loadData(sku) || {});
      if (!opts.file) await switchDrawerTab(drawer, L.productTab);
      if (!opts.file) await waitFor(() => findProductCopywritingItem(drawer), 5000, 160);
      const item = opts.file ? null : findProductCopywritingItem(drawer);
      if (!opts.file && !item) return normalizeData(loadData(sku) || {});
      const file = opts.file || findProductCopywritingFile(item, sku);
      if (!file) return normalizeData(loadData(sku) || {});
      const cached = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      const oldRecord = normalizeCopywritingRecord(cached.copywriting);
      const sameFile = oldRecord && oldRecord.fullText
        && oldRecord.parserVersion === COPYWRITING_PARSER_VERSION
        && compactText(oldRecord.fileName).toLowerCase() === compactText(file.fileName).toLowerCase();
      if (!opts.force && sameFile) return cached;
      const fileTimestamp = extractCopywritingFileTimestamp(file.fileName);
      if (!opts.force && oldRecord && oldRecord.fileTimestamp && fileTimestamp && fileTimestamp < oldRecord.fileTimestamp) return cached;

      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, '\u4ea7\u54c1\u6587\u6848 Word \u4e0b\u8f7d\u76d1\u542c');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('\u672a\u8bfb\u53d6\u5230\u4ea7\u54c1\u6587\u6848 Word');
      let arrayBuffer;
      try {
        arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '\u4ea7\u54c1\u6587\u6848 Word \u8bfb\u53d6');
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw new Error('\u8bfb\u53d6\u5230\u7684\u5185\u5bb9\u4e0d\u662f\u6709\u6548 Word \u6587\u4ef6');
      } catch (error) {
        if (source.kind === 'captured') throw error;
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '\u5907\u7528\u4ea7\u54c1\u6587\u6848 Word \u4e0b\u8f7d\u76d1\u542c')), kind: 'captured' };
        arrayBuffer = source.arrayBuffer || (source.url ? await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '\u5907\u7528\u4ea7\u54c1\u6587\u6848 Word \u8bfb\u53d6') : null);
        if (!isCopywritingDocxBuffer(arrayBuffer)) throw error;
      }
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      const parsedDocument = await withCopywritingTimeout(parseCopywritingDocxRows(arrayBuffer), 20000, '\u4ea7\u54c1\u6587\u6848 Word \u8868\u683c\u89e3\u6790');
      const built = buildMainstreamCopywriting(parsedDocument, cached);
      if (!built.sections.length) throw new Error('Word \u4e2d\u672a\u8bc6\u522b\u5230\u4e3b\u6d41\u7248\u6587\u6848\u5b57\u6bb5');
      const nextRecord = buildCopywritingRecord(file.fileName, fileTimestamp, fileHash, built, oldRecord);
      const next = mergeCopywritingCacheIntoData(cached, nextRecord);
      if (drawer !== getProjectDrawerForSku(sku) || Number(state.skuResultGeneration[sku] || 0) !== resultGeneration) return normalizeData(loadData(sku) || {});
      saveData(sku, next);
      delete state.copywritingHydrateFailedAt[sku];
      addLog('success', '\u4ea7\u54c1\u6587\u6848\u9759\u9ed8\u7f13\u5b58\u5b8c\u6210', sku + ' | ' + file.fileName);
      return next;
    } catch (error) {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) {
        state.copywritingHydrateFailedAt[sku] = Date.now();
        addLog('warn', '\u4ea7\u54c1\u6587\u6848\u9759\u9ed8\u8bfb\u53d6\u5931\u8d25', sku + ' | ' + formatErrorMessage(error));
      }
      return normalizeData(loadData(sku) || {});
    } finally {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) state.copywritingHydratingSkus.delete(sku);
      const currentDrawer = getProjectDrawerForSku(sku);
      if (!opts.silent && currentDrawer && originalTab && getActiveTabText(currentDrawer) !== originalTab) await switchDrawerTab(currentDrawer, originalTab);
    }
  }

  async function hydrateIngredientPdfForSku(sku, options) {
    const opts = options || {};
    const resultGeneration = Number(state.skuResultGeneration[sku] || 0);
    if (!sku || state.ingredientHydratingSkus.has(sku)) return normalizeData(loadData(sku) || {});
    const failedAt = Number(state.ingredientHydrateFailedAt[sku] || 0);
    if (!opts.force && failedAt && Date.now() - failedAt < 10 * 60 * 1000) return normalizeData(loadData(sku) || {});
    const drawer = opts.drawer || getProjectDrawerForSku(sku);
    if (!drawer || drawer !== getProjectDrawerForSku(sku)) return normalizeData(loadData(sku) || {});
    state.ingredientHydratingSkus.add(sku);
    const originalTab = getActiveTabText(drawer);
    try {
      if (opts.silent && !opts.file && getActiveTabText(drawer) !== L.productTab) return normalizeData(loadData(sku) || {});
      if (!opts.file) await switchDrawerTab(drawer, L.productTab);
      if (!opts.file) await waitFor(() => findIngredientPdfItem(drawer), 3500, 140);
      const item = opts.file ? null : findIngredientPdfItem(drawer);
      if (!opts.file && !item) return normalizeData(loadData(sku) || {});
      const file = opts.file || findIngredientPdfFile(item);
      if (!file) return normalizeData(loadData(sku) || {});
      const cached = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      if (!opts.force && cached.ingredientNormalizerVersion === INGREDIENT_NORMALIZER_VERSION && cached.ingredientPdfFileName === file.fileName && cached.ingredientEnglish && cached.ingredientChinese) return cached;

      let source = await withCopywritingTimeout(resolveCopywritingDocumentSource(file.card, file.fileName), 12000, '成分表 PDF 下载监听');
      if (!source || (!source.url && !source.arrayBuffer)) throw new Error('未读取到成分表 PDF');
      let arrayBuffer = source.arrayBuffer || await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '成分表 PDF 读取');
      if (!isPdfBuffer(arrayBuffer) && source.kind !== 'captured') {
        source = { ...(await withCopywritingTimeout(captureCopywritingDownloadSource(file.card, file.fileName), 12000, '备用成分表 PDF 下载监听')), kind: 'captured' };
        arrayBuffer = source.arrayBuffer || (source.url ? await withCopywritingTimeout(downloadCopywritingDocument(source.url), 18000, '备用成分表 PDF 读取') : null);
      }
      if (!isPdfBuffer(arrayBuffer)) throw new Error('读取到的内容不是有效 PDF');
      const fileHash = await hashCopywritingBuffer(arrayBuffer);
      if (!opts.force && cached.ingredientNormalizerVersion === INGREDIENT_NORMALIZER_VERSION && cached.ingredientPdfHash === fileHash && cached.ingredientEnglish && cached.ingredientChinese) {
        if (cached.ingredientPdfFileName !== file.fileName && drawer === getProjectDrawerForSku(sku) && Number(state.skuResultGeneration[sku] || 0) === resultGeneration) saveData(sku, { ...cached, ingredientPdfFileName: file.fileName });
        return cached;
      }
      let rawText = '';
      try {
        rawText = await withCopywritingTimeout(extractIngredientPdfText(arrayBuffer), 20000, '成分表 PDF 解析');
      } catch (error) {
        addLog('warn', '成分表 PDF 文本层不可用', sku + ' | 将转为图片交给魔搭读取 | ' + formatErrorMessage(error));
      }
      const requestBody = { sku, fileName: file.fileName, rawText };
      if (!rawText || rawText.length < 20) {
        try {
          requestBody.pageImages = await withCopywritingTimeout(renderIngredientPdfImages(arrayBuffer), 25000, '成分表 PDF 转图片');
        } catch (error) {
          addLog('warn', '成分表 PDF 转图片失败', sku + ' | 将回退 Gemini 直接读取 PDF | ' + formatErrorMessage(error));
        }
        requestBody.pdfBase64 = arrayBufferToBase64(arrayBuffer);
      }
      const response = await cloudRequest('/ingredients/normalize', {
        method: 'POST',
        timeoutMs: 90000,
        body: requestBody,
      });
      if (!response || !response.ok || !response.english || !response.chinese) throw new Error(response && response.error ? response.error : 'AI 未返回有效成分');
      const next = normalizeData({
        ...cached,
        ingredientEnglish: String(response.english || '').slice(0, 8000),
        ingredientChinese: String(response.chinese || '').slice(0, 8000),
        ingredientItems: Array.isArray(response.items) ? response.items.slice(0, 100) : [],
        ingredientPdfFileName: file.fileName,
        ingredientPdfHash: fileHash,
        ingredientPdfModel: String(response.model || ''),
        ingredientPdfUpdatedAt: new Date().toLocaleString(),
        ingredientNormalizerVersion: String(response.normalizerVersion || INGREDIENT_NORMALIZER_VERSION),
        ingredientSource: 'ingredientPdf',
      });
      if (drawer !== getProjectDrawerForSku(sku) || Number(state.skuResultGeneration[sku] || 0) !== resultGeneration) return normalizeData(loadData(sku) || {});
      saveData(sku, next);
      const clearedCopywritingError = state.toyCopywritingErrorSku === sku && state.toyCopywritingErrorKind === 'ingredient-cache' && Boolean(state.toyCopywritingError);
      if (clearedCopywritingError) {
        clearToyCopywritingError(sku);
        if (state.selectedSku === sku) renderShell();
        showToast('\u6210\u5206\u8868\u7f13\u5b58\u5df2\u83b7\u53d6\uff0c\u73b0\u5728\u53ef\u4ee5\u91cd\u8bd5\u667a\u80fd\u8865\u5145\u98df\u54c1\u6587\u6848');
      }
      delete state.ingredientHydrateFailedAt[sku];
      addLog('success', '成分表静默缓存完成', sku + ' | ' + next.ingredientEnglish);
      return next;
    } catch (error) {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) {
        state.ingredientHydrateFailedAt[sku] = Date.now();
        addLog('warn', '成分表静默读取失败', sku + ' | ' + formatErrorMessage(error));
      }
      return normalizeData(loadData(sku) || {});
    } finally {
      if (Number(state.skuResultGeneration[sku] || 0) === resultGeneration) state.ingredientHydratingSkus.delete(sku);
      const currentDrawer = getProjectDrawerForSku(sku);
      if (!opts.silent && currentDrawer && originalTab && getActiveTabText(currentDrawer) !== originalTab) await switchDrawerTab(currentDrawer, originalTab);
    }
  }

  function findIngredientPdfItem(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => {
        const label = item.querySelector('.ant-form-item-label');
        return /^(?:成份表|成分表)$/.test(compactText(label && (label.innerText || label.textContent)).replace(/[：:*]/g, ''));
      }) || null;
  }

  function findIngredientPdfFile(item) {
    const cards = Array.from(item.querySelectorAll('.filePreviewMainBox, .filePreviewCard, .removeOtherContent'))
      .filter(isVisibleElement)
      .map((card) => ({ card, fileName: extractPdfFileName(card) }))
      .filter((entry) => /\.pdf$/i.test(entry.fileName));
    const unique = cards.filter((entry, index) => cards.findIndex((candidate) => candidate.fileName === entry.fileName) === index);
    return unique[0] || null;
  }

  function isPdfBuffer(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 4) return false;
    const bytes = new Uint8Array(arrayBuffer, 0, 4);
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  function arrayBufferToBase64(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer || new ArrayBuffer(0));
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
    }
    return btoa(binary);
  }

  async function extractIngredientPdfText(arrayBuffer) {
    const Pdf = (typeof pdfjsLib !== 'undefined' && pdfjsLib) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.pdfjsLib);
    if (!Pdf || typeof Pdf.getDocument !== 'function') throw new Error('PDF 解析组件未加载');
    if (Pdf.GlobalWorkerOptions && !Pdf.GlobalWorkerOptions.workerSrc) {
      Pdf.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    const task = Pdf.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
    const documentHandle = await task.promise;
    const pages = [];
    try {
      const pageCount = Math.min(Number(documentHandle.numPages) || 0, 12);
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await documentHandle.getPage(pageNumber);
        const content = await page.getTextContent();
        let line = '';
        const lines = [];
        (content.items || []).forEach((item) => {
          const value = String(item && item.str || '').trim();
          if (value) line += (line ? ' ' : '') + value;
          if (item && item.hasEOL && line) {
            lines.push(line);
            line = '';
          }
        });
        if (line) lines.push(line);
        pages.push(lines.join('\n'));
      }
    } finally {
      if (documentHandle && typeof documentHandle.destroy === 'function') await documentHandle.destroy();
    }
    return pages.join('\n\n').replace(/[ \t]+/g, ' ').trim().slice(0, 30000);
  }

  async function renderIngredientPdfImages(arrayBuffer) {
    const Pdf = (typeof pdfjsLib !== 'undefined' && pdfjsLib) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.pdfjsLib);
    if (!Pdf || typeof Pdf.getDocument !== 'function') throw new Error('PDF 解析组件未加载');
    if (Pdf.GlobalWorkerOptions && !Pdf.GlobalWorkerOptions.workerSrc) {
      Pdf.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    const task = Pdf.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
    const documentHandle = await task.promise;
    const images = [];
    let totalLength = 0;
    try {
      const pageCount = Math.min(Number(documentHandle.numPages) || 0, 6);
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await documentHandle.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1800 / Math.max(1, baseViewport.width), 2400 / Math.max(1, baseViewport.height));
        const viewport = page.getViewport({ scale: Math.max(0.1, scale) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('无法创建 PDF 图片画布');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
        const image = canvas.toDataURL('image/jpeg', 0.82);
        canvas.width = 1;
        canvas.height = 1;
        if (typeof page.cleanup === 'function') page.cleanup();
        if (image.length > 4500000 || (images.length && totalLength + image.length > 12000000)) break;
        images.push(image);
        totalLength += image.length;
      }
    } finally {
      if (documentHandle && typeof documentHandle.destroy === 'function') await documentHandle.destroy();
    }
    if (!images.length) throw new Error('PDF 页面未生成图片');
    return images;
  }

  function findProductCopywritingItem(drawer) {
    if (!drawer) return null;
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => {
        const label = item.querySelector('.ant-form-item-label');
        return compactText(label && (label.innerText || label.textContent)).replace(/[：:*]/g, '') === '产品文案';
      }) || null;
  }

  function findProductCopywritingFile(item, sku) {
    const cards = Array.from(item.querySelectorAll('.filePreviewMainBox, .filePreviewCard, .removeOtherContent'))
      .filter(isVisibleElement)
      .map((card) => ({ card, fileName: extractCopywritingFileName(card) }))
      .filter((entry) => /\.docx$/i.test(entry.fileName));
    const unique = cards.filter((entry, index) => cards.findIndex((candidate) => candidate.fileName === entry.fileName) === index);
    if (!unique.length) return null;
    const skuMatches = unique.filter((entry) => !sku || new RegExp(escapeRegExp(sku), 'i').test(entry.fileName));
    const pool = skuMatches.length ? skuMatches : (unique.length === 1 ? unique : []);
    if (!pool.length) return null;
    return pool.sort((a, b) => extractCopywritingFileTimestamp(b.fileName).localeCompare(extractCopywritingFileTimestamp(a.fileName)))[0];
  }

  function extractCopywritingFileName(card) {
    if (!card) return '';
    const titleSpans = Array.from(card.querySelectorAll('.title span, [class*="title"] span'))
      .map((el) => compactText(el.innerText || el.textContent))
      .filter((text) => /\.docx$/i.test(text));
    if (titleSpans.length) return titleSpans[titleSpans.length - 1];
    return ((compactText(card.innerText || card.textContent).match(/[^\n\\/:*?"<>|]+\.docx\b/i) || [])[0] || '').trim();
  }

  function extractPdfFileName(card) {
    if (!card) return '';
    const titleSpans = Array.from(card.querySelectorAll('.title span, [class*="title"] span'))
      .map((el) => compactText(el.innerText || el.textContent))
      .filter((text) => /\.pdf$/i.test(text));
    if (titleSpans.length) return titleSpans[titleSpans.length - 1];
    return ((compactText(card.innerText || card.textContent).match(/[^\n\\/:*?"<>|]+\.pdf\b/i) || [])[0] || '').trim();
  }

  function extractCopywritingFileTimestamp(fileName) {
    return ((String(fileName || '').match(/_(\d{14,17})(?=\.docx$)/i) || [])[1] || '');
  }

  async function resolveCopywritingDocumentSource(card, fileName) {
    const attachmentLabel = /\.pdf$/i.test(String(fileName || '')) ? '成分表' : '产品文案';
    const direct = findCopywritingUrlInCard(card);
    if (direct) {
      addLog('info', attachmentLabel + '：命中卡片地址', fileName + ' | ' + redactCopywritingUrl(direct));
      return { url: direct, arrayBuffer: null, kind: 'direct' };
    }
    addLog('info', attachmentLabel + '：未发现静态地址，直接监听下载动作', fileName);
    return { ...(await captureCopywritingDownloadSource(card, fileName)), kind: 'captured' };
  }

  function withCopywritingTimeout(promise, timeout, stage) {
    let timer = null;
    const limit = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error((stage || '产品文案处理') + '超时')), Math.max(1000, Number(timeout) || 12000));
    });
    return Promise.race([Promise.resolve(promise), limit]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  function redactCopywritingUrl(value) {
    return String(value || '').replace(/\?.*$/, '?...').slice(0, 500);
  }

  function findCopywritingUrlInCard(card) {
    if (!card) return '';
    const attrs = ['href', 'src', 'data-url', 'data-src', 'data-file-url', 'data-download-url', 'download-url'];
    const nodes = [card].concat(Array.from(card.querySelectorAll('*')));
    for (const node of nodes) {
      for (const name of attrs) {
        const value = node.getAttribute && node.getAttribute(name);
        const url = normalizeCopywritingUrl(value);
        if (url && isUsableCopywritingUrl(url)) return url;
      }
    }
    const html = String(card.outerHTML || '').replace(/&amp;/g, '&');
    const urls = html.match(/https?:\/\/[^"'<>\s]+/g) || [];
    return urls.map(normalizeCopywritingUrl).find(isUsableCopywritingUrl) || '';
  }

  function normalizeCopywritingUrl(value) {
    const text = String(value || '').trim().replace(/&amp;/g, '&').replace(/\\\//g, '/');
    if (!text || /^(?:data:|javascript:)/i.test(text) || /filePic\/word\.png/i.test(text)) return '';
    if (/^(?:https?:|blob:)/i.test(text)) return text;
    if (/^\/\//.test(text)) return location.protocol + text;
    if (/^\//.test(text)) return location.origin + text;
    return '';
  }

  function isUsableCopywritingUrl(url) {
    const text = String(url || '');
    return /^blob:/i.test(text) || (/^https?:/i.test(text) && /(?:\.(?:docx|pdf)(?:\?|$)|download|attachment)/i.test(text));
  }

  function scoreCopywritingUrl(url, fileName) {
    const text = String(url || '').toLowerCase();
    if (!text || /filepic\/word\.png|data:image/i.test(text)) return -100;
    let score = /^(?:https?:|blob:)/i.test(text) ? 1 : 0;
    if (/^blob:/i.test(text)) score += 100;
    if (/\.docx(?:\?|$)/i.test(text)) score += 90;
    if (/\.pdf(?:\?|$)/i.test(text)) score += 90;
    if (/download|attachment/i.test(text)) score += 45;
    if (/file(?:\/|=|\?|_)/i.test(text)) score += 18;
    if (/oss|object|storage/i.test(text)) score += 10;
    const normalizedName = String(fileName || '').toLowerCase();
    if (normalizedName && (text.includes(normalizedName) || text.includes(encodeURIComponent(normalizedName).toLowerCase()))) score += 80;
    return score;
  }

  function findCopywritingUrlInVueState(card, fileName) {
    if (!card) return '';
    const roots = [];
    let element = card;
    for (let level = 0; element && level < 6; level += 1, element = element.parentElement) {
      try {
        Object.getOwnPropertyNames(element).filter((key) => /^__vue/i.test(key)).forEach((key) => roots.push(element[key]));
      } catch (error) { /* no-op */ }
    }
    const queue = [];
    roots.forEach((instance) => {
      if (!instance || typeof instance !== 'object') return;
      ['props', 'setupState', 'data', 'ctx', 'attrs'].forEach((key) => {
        try { if (instance[key]) queue.push({ value: instance[key], depth: 0, key }); } catch (error) { /* no-op */ }
      });
      try { if (instance.vnode && instance.vnode.props) queue.push({ value: instance.vnode.props, depth: 0, key: 'vnode.props' }); } catch (error) { /* no-op */ }
    });
    const seen = new Set();
    const candidates = [];
    let inspected = 0;
    const addCandidate = (value, key, sameFileObject) => {
      const raw = String(value || '').replace(/\\u002f/gi, '/').replace(/\\\//g, '/');
      const values = [raw].concat(raw.match(/https?:\/\/[^"'<>\s]+/gi) || []);
      values.forEach((candidate) => {
        const url = normalizeCopywritingUrl(candidate);
        if (!url) return;
        const baseScore = scoreCopywritingUrl(url, fileName);
        const score = baseScore + (/url|path|download|file/i.test(String(key || '')) ? 20 : 0) + (sameFileObject ? 40 : 0);
        if (baseScore > 20 || sameFileObject) candidates.push({ url, score });
      });
    };
    while (queue.length && inspected < 700) {
      const entry = queue.shift();
      const value = entry.value;
      inspected += 1;
      if (typeof value === 'string') {
        addCandidate(value, entry.key, false);
        continue;
      }
      if (!value || typeof value !== 'object' || entry.depth >= 5 || seen.has(value)) continue;
      if (value.nodeType || value === window || value === document) continue;
      seen.add(value);
      let keys = [];
      try { keys = Object.keys(value).slice(0, 80); } catch (error) { continue; }
      const normalizedName = String(fileName || '').toLowerCase();
      const sameFileObject = Boolean(normalizedName && keys.some((key) => {
        try { return typeof value[key] === 'string' && String(value[key]).toLowerCase().includes(normalizedName); } catch (error) { return false; }
      }));
      keys.forEach((key) => {
        if (/^(?:parent|root|appContext|subTree|component|el|proxy|provides)$/i.test(key)) return;
        let child;
        try { child = value[key]; } catch (error) { return; }
        if (typeof child === 'string') addCandidate(child, key, sameFileObject);
        else if (child && typeof child === 'object') queue.push({ value: child, depth: entry.depth + 1, key });
      });
    }
    return candidates.sort((a, b) => b.score - a.score)[0]?.url || '';
  }

  async function captureCopywritingDownloadSource(card, fileName) {
    const wantsPdf = /\.pdf$/i.test(String(fileName || ''));
    const attachmentLogLabel = wantsPdf ? '成分表' : '产品文案';
    if (!card) {
      addLog('error', attachmentLogLabel + '：下载监听失败', '附件卡片不存在');
      return { url: '', arrayBuffer: null };
    }
    // PLM only reveals this control on hover, but HTMLElement.click() works while it is hidden.
    const control = card.querySelector('.delBtn .anticon-vertical-align-bottom, .delBtn [aria-label="vertical-align-bottom"], .anticon-vertical-align-bottom, [aria-label="vertical-align-bottom"], [class*="download" i]');
    const clickable = control && (control.closest('.delBtn, button, a, [role="button"]') || control);
    if (!clickable) {
      addLog('error', attachmentLogLabel + '：下载监听失败', fileName + ' | 未找到下载图标，卡片类名：' + String(card.className || ''));
      return { url: '', arrayBuffer: null };
    }
    let captured = '';
    let capturedScore = -100;
    let capturedAt = 0;
    let capturedReady = false;
    let capturedBuffer = null;
    const root = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const restores = [];
    const trace = [];
    const capture = (value, bonus, ready) => {
      const url = normalizeCopywritingUrl(value);
      const score = scoreCopywritingUrl(url, fileName) + Number(bonus || 0);
      if (!url || (score < 25 && !ready)) return false;
      if (url && score > capturedScore) {
        captured = url;
        capturedScore = score;
        capturedAt = Date.now();
        capturedReady = Boolean(ready);
        trace.push('地址:' + redactCopywritingUrl(url));
      }
      return Boolean(url);
    };
    const captureBuffer = (value) => {
      if (!value) return;
      const convert = Object.prototype.toString.call(value) === '[object ArrayBuffer]'
        ? Promise.resolve(value)
        : (typeof value.arrayBuffer === 'function' ? value.arrayBuffer() : Promise.resolve(null));
      convert.then((buffer) => {
        if (!buffer || !buffer.byteLength) return;
        const bytes = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
        const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
        const isDocx = bytes[0] === 0x50 && bytes[1] === 0x4b;
        if ((wantsPdf && isPdf) || (!wantsPdf && isDocx)) {
          capturedBuffer = buffer;
          trace.push('内存' + (wantsPdf ? 'PDF:' : 'Word:') + buffer.byteLength + 'B');
        } else trace.push('非目标文件响应:' + buffer.byteLength + 'B');
      }).catch(() => {});
    };
    try {
      const anchorProto = root.HTMLAnchorElement && root.HTMLAnchorElement.prototype;
      if (anchorProto && anchorProto.click) {
        const originalAnchorClick = anchorProto.click;
        anchorProto.click = function () {
          const url = this.href || this.getAttribute('href') || '';
          if (capture(url, 70, true)) return;
          return originalAnchorClick.apply(this, arguments);
        };
        restores.push(() => { anchorProto.click = originalAnchorClick; });
      }
      if (typeof root.open === 'function') {
        const originalOpen = root.open;
        root.open = function (url) {
          if (capture(url, 70, true)) return null;
          return originalOpen.apply(this, arguments);
        };
        restores.push(() => { root.open = originalOpen; });
      }
      if (root.URL && typeof root.URL.createObjectURL === 'function') {
        const originalCreate = root.URL.createObjectURL;
        root.URL.createObjectURL = function () {
          const url = originalCreate.apply(this, arguments);
          captureBuffer(arguments[0]);
          capture(url, 100, true);
          return url;
        };
        restores.push(() => { root.URL.createObjectURL = originalCreate; });
      }
      if (root.URL && typeof root.URL.revokeObjectURL === 'function') {
        const originalRevoke = root.URL.revokeObjectURL;
        root.URL.revokeObjectURL = function (url) {
          if (captured && String(url || '') === captured) return;
          return originalRevoke.apply(this, arguments);
        };
        restores.push(() => { root.URL.revokeObjectURL = originalRevoke; });
      }
      if (typeof root.fetch === 'function') {
        const originalFetch = root.fetch;
        root.fetch = function (input) {
          const requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
          capture(requestUrl, 15, false);
          const result = originalFetch.apply(this, arguments);
          result.then((response) => {
            const disposition = response.headers && response.headers.get ? (response.headers.get('content-disposition') || '') : '';
            const contentType = response.headers && response.headers.get ? (response.headers.get('content-type') || '') : '';
            capture(response.url || requestUrl, 25, false);
            if (/docx|pdf|officedocument|octet-stream|attachment/i.test(disposition + ' ' + contentType + ' ' + requestUrl)) {
              try { captureBuffer(response.clone()); } catch (error) { /* no-op */ }
            }
          }).catch(() => {});
          return result;
        };
        restores.push(() => { root.fetch = originalFetch; });
      }
      const xhrProto = root.XMLHttpRequest && root.XMLHttpRequest.prototype;
      if (xhrProto && xhrProto.open && xhrProto.send) {
        const originalXhrOpen = xhrProto.open;
        const originalXhrSend = xhrProto.send;
        xhrProto.open = function (method, url) {
          this.__pfhCopywritingUrl = String(url || '');
          capture(url, 15, false);
          return originalXhrOpen.apply(this, arguments);
        };
        xhrProto.send = function () {
          const xhr = this;
          const requestUrl = xhr.__pfhCopywritingUrl || '';
          xhr.addEventListener('load', () => {
            let disposition = '';
            let contentType = '';
            try {
              disposition = xhr.getResponseHeader('content-disposition') || '';
              contentType = xhr.getResponseHeader('content-type') || '';
            } catch (error) { /* no-op */ }
            capture(xhr.responseURL || requestUrl, 25, false);
            if (/docx|pdf|officedocument|octet-stream|attachment/i.test(disposition + ' ' + contentType + ' ' + requestUrl)) captureBuffer(xhr.response);
          }, { once: true });
          return originalXhrSend.apply(this, arguments);
        };
        restores.push(() => {
          xhrProto.open = originalXhrOpen;
          xhrProto.send = originalXhrSend;
        });
      }
    } catch (error) {
      addLog('warn', attachmentLogLabel + '：下载地址监听受限', formatErrorMessage(error));
    }
    const before = new Set((performance.getEntriesByType && performance.getEntriesByType('resource') || []).map((entry) => entry.name));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => Array.from(mutation.addedNodes || []).forEach((node) => {
        if (!node || node.nodeType !== 1) return;
        capture(node.href || (node.getAttribute && (node.getAttribute('href') || node.getAttribute('src'))) || '', 45, true);
        if (!captured && node.querySelectorAll) {
          Array.from(node.querySelectorAll('a[href], [src]')).some((el) => capture(el.href || el.src || '', 45, true));
        }
      }));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    try {
      clickElement(clickable);
      trace.push('已点击:' + String(clickable.className || clickable.getAttribute('aria-label') || clickable.tagName));
      const observed = await waitUntil(() => {
        if (capturedBuffer) return 'buffer';
        if (captured && capturedReady) return 'url';
        const resources = (performance.getEntriesByType && performance.getEntriesByType('resource') || [])
          .map((entry) => entry.name)
          .filter((name) => !before.has(name));
        resources.forEach((url) => capture(url, 20, false));
        if (captured && capturedAt && Date.now() - capturedAt > 6500) return 'url';
        return '';
      }, 9000, 100);
      if (!observed && captured) capturedReady = true;
    } finally {
      observer.disconnect();
      restores.reverse().forEach((restore) => {
        try { restore(); } catch (error) { /* no-op */ }
      });
    }
    if (capturedBuffer) addLog('info', attachmentLogLabel + '：下载监听成功', fileName + ' | 内存 ' + (wantsPdf ? 'PDF ' : 'Word ') + capturedBuffer.byteLength + 'B');
    else if (captured) addLog('info', attachmentLogLabel + '：下载监听捕获地址', fileName + ' | ' + redactCopywritingUrl(captured));
    else addLog('error', attachmentLogLabel + '：下载监听未取得文件', fileName + ' | ' + (trace.join('；') || '点击后未发现下载地址、Blob 或目标文件响应'));
    return { url: captured, arrayBuffer: capturedBuffer };
  }

  function downloadCopywritingDocument(url) {
    if (/^blob:/i.test(url)) {
      return fetch(url).then((response) => {
        if (!response.ok) throw new Error('Word 下载失败：' + response.status);
        return response.arrayBuffer();
      }).finally(() => {
        try { URL.revokeObjectURL(url); } catch (error) { /* no-op */ }
      });
    }
    return new Promise((resolve, reject) => {
      if (typeof GM_xmlhttpRequest !== 'function') {
        fetch(url).then((response) => {
          if (!response.ok) throw new Error('Word 下载失败：' + response.status);
          return response.arrayBuffer();
        }).then(resolve, reject);
        return;
      }
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        timeout: 20000,
        onload: (response) => {
          if (response.status < 200 || response.status >= 300) {
            reject(new Error('Word 下载失败：HTTP ' + response.status));
            return;
          }
          if (response.response instanceof ArrayBuffer) resolve(response.response);
          else if (response.response && response.response.arrayBuffer) response.response.arrayBuffer().then(resolve, reject);
          else reject(new Error('Word 下载内容为空'));
        },
        onerror: () => reject(new Error('Word 下载请求失败')),
        ontimeout: () => reject(new Error('Word 下载超时')),
      });
    });
  }

  function isCopywritingDocxBuffer(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength < 4) return false;
    const bytes = new Uint8Array(arrayBuffer, 0, 4);
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  async function parseCopywritingDocxRows(arrayBuffer) {
    let xmlText = '';
    try {
      xmlText = await readDocxDocumentXmlNative(arrayBuffer);
      addLog('info', '产品文案：Word 原生解压成功', xmlText.length + ' 字符');
    } catch (nativeError) {
      addLog('warn', '产品文案：原生解压不可用，尝试 JSZip', formatErrorMessage(nativeError));
      const Zip = (typeof JSZip !== 'undefined' && JSZip) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.JSZip);
      if (!Zip) throw new Error('Word 解析组件未加载，且原生解压失败：' + formatErrorMessage(nativeError));
      const zip = await Zip.loadAsync(arrayBuffer, { checkCRC32: false, createFolders: false });
      const documentFile = zip.file('word/document.xml');
      if (!documentFile) throw new Error('Word 文件结构不完整');
      xmlText = await documentFile.async('string');
      addLog('info', '产品文案：JSZip 解压成功', xmlText.length + ' 字符');
    }
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Word XML 解析失败');
    const rows = [];
    Array.from(xml.getElementsByTagNameNS('*', 'tr')).forEach((row) => {
      const cells = Array.from(row.children || []).filter((node) => node.localName === 'tc').map(copywritingCellLines);
      if (cells.length >= 2) rows.push(cells);
    });
    const fullText = rows
      .filter((cells) => !/^内容说明$/.test(cleanCopywritingLine((cells[0] || []).join('')).replace(/\s+/g, '')))
      .map((cells) => [
        (cells[1] || []).map(cleanCopywritingLine).filter(Boolean).join('\n'),
        (cells[2] || []).map(cleanCopywritingLine).filter(Boolean).join('\n'),
      ].filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n');
    return { rows, fullText: fullText.slice(0, 50000) };
  }

  async function readDocxDocumentXmlNative(arrayBuffer) {
    if (typeof DecompressionStream !== 'function') throw new Error('浏览器不支持原生 ZIP 解压');
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const readU16 = (offset) => view.getUint16(offset, true);
    const readU32 = (offset) => view.getUint32(offset, true);
    let eocd = -1;
    const start = Math.max(0, bytes.length - 65557);
    for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
      if (readU32(offset) === 0x06054b50) {
        eocd = offset;
        break;
      }
    }
    if (eocd < 0) throw new Error('未找到 Word ZIP 目录');
    const entryCount = readU16(eocd + 10);
    let offset = readU32(eocd + 16);
    const decoder = new TextDecoder('utf-8');
    for (let index = 0; index < entryCount; index += 1) {
      if (offset + 46 > bytes.length || readU32(offset) !== 0x02014b50) throw new Error('Word ZIP 目录损坏');
      const compression = readU16(offset + 10);
      const compressedSize = readU32(offset + 20);
      const nameLength = readU16(offset + 28);
      const extraLength = readU16(offset + 30);
      const commentLength = readU16(offset + 32);
      const localOffset = readU32(offset + 42);
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
      offset += 46 + nameLength + extraLength + commentLength;
      if (name !== 'word/document.xml') continue;
      if (localOffset + 30 > bytes.length || readU32(localOffset) !== 0x04034b50) throw new Error('Word 正文位置无效');
      const localNameLength = readU16(localOffset + 26);
      const localExtraLength = readU16(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      if (compression === 0) return decoder.decode(compressed);
      if (compression !== 8) throw new Error('Word 使用了不支持的压缩方式：' + compression);
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const inflated = await new Response(stream).arrayBuffer();
      return decoder.decode(new Uint8Array(inflated));
    }
    throw new Error('Word 中没有正文 XML');
  }

  function copywritingCellLines(cell) {
    return Array.from(cell.getElementsByTagNameNS('*', 'p'))
      .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS('*', 't')).map((node) => node.textContent || '').join(''))
      .map(cleanCopywritingLine)
      .filter(Boolean);
  }

  function cleanCopywritingLine(value) {
    return String(value || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/[ \t]+/g, ' ').trim();
  }

  function cleanCopywritingIngredientValue(lines, language) {
    let text = (lines || []).map(cleanCopywritingLine).filter(Boolean).join('\n').trim();
    if (!text) return '';
    if (language === 'chinese') {
      text = text.replace(/(?:非活性成分|活性成分|(?:中文)?成[分份]表|(?:中文)?成[分份])\s*[:：]?/gi, '、');
    } else {
      text = text.replace(/\b(?:(?:INACTIVE|ACTIVE)\s+)?INGREDIENTS?\s*[:：]?/gi, '、');
    }
    return text
      .split(/[\n、,，;；]+/)
      .map((item) => cleanCopywritingLine(item).replace(/^[\s:：.。]+|[\s:：.。]+$/g, ''))
      .filter(Boolean)
      .join('、')
      .slice(0, 8000);
  }

  function hasSplitCopywritingIngredients(englishLines, chineseLines) {
    const english = (englishLines || []).map(cleanCopywritingLine).join('\n');
    const chinese = (chineseLines || []).map(cleanCopywritingLine).join('\n');
    return (/\bACTIVE\s+INGREDIENTS?\s*[:：]?/i.test(english) && /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i.test(english))
      || (/(?:^|\n)\s*活性成分\s*[:：]?/.test(chinese) && /(?:^|\n)\s*非活性成分\s*[:：]?/.test(chinese));
  }

  function buildMainstreamCopywriting(parsedDocument, data) {
    const rows = Array.isArray(parsedDocument) ? parsedDocument : (parsedDocument && parsedDocument.rows || []);
    const wordFullText = Array.isArray(parsedDocument) ? '' : String(parsedDocument && parsedDocument.fullText || '').trim();
    const rowMap = {};
    (rows || []).forEach((cells) => {
      const label = cleanCopywritingLine((cells[0] || []).join('')).replace(/\s+/g, '');
      if (label && !rowMap[label]) rowMap[label] = { english: cells[1] || [], chinese: cells[2] || [] };
    });
    const find = (pattern, language) => {
      const key = Object.keys(rowMap).find((label) => pattern.test(label));
      const entry = key ? rowMap[key] : null;
      return entry ? (entry[language === 'chinese' ? 'chinese' : 'english'] || []).slice() : [];
    };
    const sections = [];
    const missingSections = [];
    const add = (key, label, text, required) => {
      const value = String(text || '').trim();
      if (value) sections.push({ key, label, text: value.slice(0, 12000) });
      else if (required !== false) missingSections.push(label);
    };
    const productSection = preserveCopywritingHeading(find(/^产品名称$/), /^PRODUCT\s+NAME\s*[:：]?$/i, 'PRODUCT NAME:');
    add('productName', '产品名称', joinCopywritingSection(productSection.heading, productSection.lines));
    const functionsHeading = find(/^24国语言功效标题/).join('').trim();
    add('functionsHeading', '24国语言功效标题', functionsHeading, false);
    const functionLines = find(/^24国语言功效内容/).map((line) => line.replace(/;\s*$/, '').trim()).filter(Boolean);
    add('functions', '24国语言功效内容', functionLines.join(';  '), false);
    const ingredientLines = find(/^(?:成分表|成分活性非活性成分)/);
    const ingredientChineseLines = find(/^(?:成分表|成分活性非活性成分)/, 'chinese');
    const ingredientEnglish = cleanCopywritingIngredientValue(ingredientLines, 'english');
    const ingredientChinese = cleanCopywritingIngredientValue(ingredientChineseLines, 'chinese');
    const ingredientSplit = hasSplitCopywritingIngredients(ingredientLines, ingredientChineseLines);
    const activeIngredients = extractLabeledCopywritingSection(ingredientLines, /\bACTIVE\s+INGREDIENTS?\s*[:：]?/i, /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i, 'ACTIVE INGREDIENTS:');
    const inactiveIngredients = extractLabeledCopywritingSection(ingredientLines, /\bINACTIVE\s+INGREDIENTS?\s*[:：]?/i, null, 'INACTIVE INGREDIENTS:');
    if (activeIngredients.lines.length || inactiveIngredients.lines.length) {
      add('activeIngredients', 'ACTIVE INGREDIENTS', joinCopywritingSection(activeIngredients.heading, activeIngredients.lines));
      add('inactiveIngredients', 'INACTIVE INGREDIENTS', joinCopywritingSection(inactiveIngredients.heading, inactiveIngredients.lines));
    } else {
      const ingredientSection = preserveCopywritingHeading(ingredientLines, /^INGREDIENTS?\s*[:：]?$/i, 'INGREDIENTS:');
      add('ingredients', '成分表', joinCopywritingSection(ingredientSection.heading, ingredientSection.lines));
    }
    const materialEnglish = find(/^(?:材质|材料)$/);
    const materialChinese = find(/^(?:材质|材料)$/, 'chinese');
    add('material', '材质', [materialEnglish.join('\n'), materialChinese.join('\n')].filter(Boolean).join('\n'), false);
    const directionSection = preserveCopywritingHeading(find(/^(?:[AB][.．、]?\s*)?(?:建议使用方法|使用方法|食用方法)/i), /^DIRECTIONS(?:\s+OF\s+SAFE\s+USE)?\s*[:：]?$/i, 'DIRECTIONS:');
    add('directions', '建议使用方法', joinCopywritingSection(directionSection.heading, directionSection.lines));
    add('directionsChinese', '中文使用方法', find(/^(?:[AB][.．、]?\s*)?(?:建议使用方法|使用方法|食用方法)/i, 'chinese').join('\n'));
    const warningSection = preserveCopywritingHeading(find(/^警告语$/), /^WARNINGS?\s*[:：]?$/i, 'WARNINGS:');
    add('warning', '警告语', joinCopywritingSection(warningSection.heading, warningSection.lines));
    const emailLines = find(/^美国不良事故联系人邮箱$/);
    const emailSection = preserveCopywritingHeading(emailLines, /^E-?MAIL\s*[:：]?$/i, 'e-mail:');
    add('email', '联系邮箱', joinCopywritingSection(emailSection.heading, emailSection.lines), false);
    const net = formatCopywritingNetContent(data && data.netContent);
    if (net.warning && net.text) missingSections.push(net.warning);
    add('netContent', '净含量', net.text);
    const originLines = find(/^原产国$/);
    add('origin', '原产国', originLines.join('\n'));
    const shelfLines = find(/^保质期$/);
    add('shelfLife', '保质期', shelfLines.join('\n'));
    formatBrandComplianceSections(data).forEach((section) => add(section.key, section.label, section.text));
    return {
      sections,
      fullText: (wordFullText || sections.map((section) => section.text).join('\n')).slice(0, 50000),
      missingSections,
      ingredientEnglish,
      ingredientChinese,
      ingredientSplit,
    };
  }

  function findBrandCompliance(data) {
    const brand = String(data && data.brand || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
    if (!brand) return null;
    return BRAND_COMPLIANCE_DATA.find((item) => {
      const names = [item && item.brand].concat(Array.isArray(item && item.aliases) ? item.aliases : []);
      return names.some((name) => String(name || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase() === brand);
    }) || null;
  }

  function cleanComplianceValue(value) {
    return String(value || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean).join('\n').trim();
  }

  function formatBrandComplianceSections(data) {
    const info = findBrandCompliance(data);
    if (!info || !cleanComplianceValue(info.distributed_by)) return [];
    const sections = [
      { key: 'distributedBy', label: 'DISTRIBUTED BY', text: 'DISTRIBUTED BY: ' + cleanComplianceValue(info.distributed_by) },
      { key: 'address', label: 'ADDRESS', text: 'ADDRESS: ' + cleanComplianceValue(info.address) },
    ];
    [['EU REP', 'euRep', info.eu_rep], ['UK REP', 'ukRep', info.uk_rep], ['US REP', 'usRep', info.us_rep]].forEach(([label, key, rep]) => {
      if (!rep || !cleanComplianceValue(rep.company)) return;
      const lines = [cleanComplianceValue(rep.company), cleanComplianceValue(rep.address), cleanComplianceValue(rep.contact), cleanComplianceValue(rep.phone), cleanComplianceValue(rep.postal_code)].filter(Boolean);
      if (lines.length) sections.push({ key, label, text: label + '\n' + lines.join('\n') });
    });
    return sections;
  }

  function extractLabeledCopywritingSection(lines, headingPattern, nextHeadingPattern, fallbackHeading) {
    const text = (lines || []).map(cleanCopywritingLine).filter(Boolean).join('\n');
    const match = text.match(headingPattern);
    if (!match) return { heading: fallbackHeading, lines: [] };
    const start = Number(match.index) || 0;
    const heading = String(match[0] || '').trim() || fallbackHeading;
    let value = text.slice(start + match[0].length).replace(/^\s*[:：]\s*/, '');
    if (nextHeadingPattern) {
      const next = value.search(nextHeadingPattern);
      if (next >= 0) value = value.slice(0, next);
    }
    return { heading, lines: value.split(/\r?\n/).map(cleanCopywritingLine).filter(Boolean) };
  }

  function preserveCopywritingHeading(lines, headingPattern, fallbackHeading) {
    const result = (lines || []).map(cleanCopywritingLine).filter(Boolean);
    if (!result.length) return { heading: fallbackHeading, lines: [] };
    const first = result[0];
    const colonIndex = first.search(/[:：]/);
    const prefix = colonIndex >= 0 ? first.slice(0, colonIndex + 1).trim() : first.trim();
    const hasExpectedHeading = headingPattern.test(first) || (colonIndex >= 0 && headingPattern.test(prefix));
    const hasSourceHeading = colonIndex >= 0 && /^[A-Z][A-Z0-9 /().&-]*[:：]$/.test(prefix);
    if (!hasExpectedHeading && !hasSourceHeading) {
      return { heading: fallbackHeading, lines: result };
    }
    const body = colonIndex >= 0 ? first.slice(colonIndex + 1).trim() : '';
    result.shift();
    if (body) result.unshift(body);
    return { heading: prefix || fallbackHeading, lines: result };
  }

  function joinCopywritingSection(heading, lines) {
    const body = (lines || []).map(cleanCopywritingLine).filter(Boolean);
    return body.length ? [heading].concat(body).join('\n') : '';
  }

  function formatCopywritingNetContent(value) {
    const text = cleanCopywritingLine(value);
    if (!text || text === '--' || text === L.unknown) return { text: '', warning: '净含量' };
    if (/^\d+(?:\.\d+)?(?:CAPSULES|GUMMIES|TABLETS|PAIR|PAIRS|PC)$/i.test(text)) return { text: text.toUpperCase(), warning: '' };
    const match = text.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/i);
    if (!match) return { text, warning: '净含量单位无法换算' };
    const amount = Number(match[1]);
    const unit = match[2].toUpperCase();
    if (!Number.isFinite(amount)) return { text, warning: '净含量单位无法换算' };
    const imperial = unit === 'G' ? amount / 28.349523125 : amount / 29.5735295625;
    return { text: trimNumber(amount) + unit + '/ ' + imperial.toFixed(2) + (unit === 'G' ? ' OZ' : ' FL OZ'), warning: '' };
  }

  async function hashCopywritingBuffer(arrayBuffer) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', arrayBuffer.slice(0));
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      const bytes = new Uint8Array(arrayBuffer);
      let hash = 2166136261;
      for (let index = 0; index < bytes.length; index += 1) hash = Math.imul(hash ^ bytes[index], 16777619);
      return (hash >>> 0).toString(16);
    }
  }

  function buildCopywritingRecord(fileName, fileTimestamp, fileHash, built, cached) {
    const now = new Date().toLocaleString();
    const old = normalizeCopywritingRecord(cached);
    const changedFile = Boolean(old && old.fullText && (
      old.fileHash !== fileHash
      || old.fileName !== fileName
      || old.fullText !== built.fullText
    ));
    const oldMap = new Map((old && old.sections || []).map((section) => [section.key, section]));
    const nextMap = new Map((built.sections || []).map((section) => [section.key, section]));
    const changedSectionKeys = changedFile
      ? built.sections.filter((section) => !oldMap.has(section.key) || oldMap.get(section.key).text !== section.text).map((section) => section.key)
      : (old && old.updatePending ? old.changedSectionKeys.slice() : []);
    const removedSections = changedFile
      ? (old.sections || []).filter((section) => !nextMap.has(section.key)).map((section) => section.label || section.key)
      : (old && old.updatePending ? old.removedSections.slice() : []);
    return normalizeCopywritingRecord({
      fileName,
      parserVersion: COPYWRITING_PARSER_VERSION,
      fileTimestamp,
      fileHash,
      fetchedAt: now,
      sections: built.sections,
      fullText: built.fullText,
      ingredientEnglish: built.ingredientEnglish,
      ingredientChinese: built.ingredientChinese,
      cleanedIngredientEnglish: built.ingredientEnglish,
      cleanedIngredientChinese: built.ingredientChinese,
      ingredientSplit: Boolean(built.ingredientSplit),
      missingSections: built.missingSections,
      updatePending: changedFile || Boolean(old && old.updatePending),
      changedSectionKeys,
      removedSections,
      previousSections: changedFile ? old.sections : (old && old.updatePending ? old.previousSections : []),
      copiedSectionKeys: changedFile ? [] : (old && old.copiedSectionKeys || []),
      copiedFullText: changedFile ? false : Boolean(old && old.copiedFullText),
    });
  }

  function normalizeCopywritingRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const normalizeSections = (items) => (Array.isArray(items) ? items : []).slice(0, 80).map((section) => ({
      key: String(section && section.key || '').slice(0, 60),
      label: String(section && section.label || '').slice(0, 100),
      text: String(section && section.text || '').slice(0, 12000),
    })).filter((section) => section.key && section.text);
    return {
      fileName: String(record.fileName || '').slice(0, 300),
      parserVersion: String(record.parserVersion || '').slice(0, 20),
      fileTimestamp: String(record.fileTimestamp || '').slice(0, 20),
      fileHash: String(record.fileHash || '').slice(0, 128),
      fetchedAt: String(record.fetchedAt || '').slice(0, 80),
      sections: normalizeSections(record.sections),
      fullText: String(record.fullText || '').slice(0, 50000),
      ingredientEnglish: String(record.ingredientEnglish || '').trim().slice(0, 8000),
      ingredientChinese: String(record.ingredientChinese || '').trim().slice(0, 8000),
      cleanedIngredientEnglish: String(record.cleanedIngredientEnglish || record.ingredientEnglish || '').trim().slice(0, 8000),
      cleanedIngredientChinese: String(record.cleanedIngredientChinese || record.ingredientChinese || '').trim().slice(0, 8000),
      ingredientSplit: Boolean(record.ingredientSplit),
      missingSections: (Array.isArray(record.missingSections) ? record.missingSections : []).map((item) => String(item || '').slice(0, 100)).filter(Boolean).slice(0, 16),
      updatePending: Boolean(record.updatePending),
      changedSectionKeys: (Array.isArray(record.changedSectionKeys) ? record.changedSectionKeys : []).map((item) => String(item || '').slice(0, 60)).filter(Boolean).slice(0, 16),
      removedSections: (Array.isArray(record.removedSections) ? record.removedSections : []).map((item) => String(item || '').slice(0, 100)).filter(Boolean).slice(0, 16),
      previousSections: normalizeSections(record.previousSections),
      copiedSectionKeys: (Array.isArray(record.copiedSectionKeys) ? record.copiedSectionKeys : []).map((item) => String(item || '').slice(0, 60)).filter(Boolean).slice(0, 80),
      copiedFullText: Boolean(record.copiedFullText),
    };
  }

  function mergeCopywritingCacheIntoData(data, record) {
    const cached = normalizeCopywritingRecord(record);
    const english = String(cached && cached.cleanedIngredientEnglish || '').trim();
    const chinese = String(cached && cached.cleanedIngredientChinese || '').trim();
    const hasExistingIngredients = Boolean(data && (data.ingredientEnglish || data.ingredientChinese));
    return normalizeData({
      ...(data || {}),
      copywriting: cached,
      copywritingIngredientEnglish: english,
      copywritingIngredientChinese: chinese,
      copywritingIngredientSplit: Boolean(cached && cached.ingredientSplit),
      ingredientEnglish: data && data.ingredientEnglish || english,
      ingredientChinese: data && data.ingredientChinese || chinese,
      ingredientSource: hasExistingIngredients ? (data && data.ingredientSource || '') : (english || chinese ? 'copywritingWord' : data && data.ingredientSource || ''),
      ingredientWordFileName: english || chinese ? cached.fileName : data && data.ingredientWordFileName || '',
      ingredientWordHash: english || chinese ? cached.fileHash : data && data.ingredientWordHash || '',
      ingredientWordUpdatedAt: english || chinese ? cached.fetchedAt : data && data.ingredientWordUpdatedAt || '',
    });
  }

  function uploadPanelHtml() {
    state.uploadExpanded = true;
    moveCompletedUploadsToHistory();
    normalizeRunningUploadsInQueue();
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    const viewingHistory = state.uploadView === 'history';
    const history = state.uploadHistory || [];
    const successfulHistory = history.filter(isUploadHistorySuccess);
    const queue = (state.uploadQueue || []).filter((item) => !/\u6210\u529f/.test(item.status || ''));
    if (queue.length !== (state.uploadQueue || []).length) {
      state.uploadQueue = queue;
      saveUploadQueue();
    }
    const allItems = viewingHistory ? history : queue;
    const pageSize = 10;
    const pageKey = viewingHistory ? 'uploadHistoryPage' : 'uploadPage';
    const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
    state[pageKey] = clamp(state[pageKey] || 1, 1, totalPages);
    const pageItems = allItems.slice((state[pageKey] - 1) * pageSize, state[pageKey] * pageSize);
    const currentSku = state.data && state.data.sku ? state.data.sku : '';
    const currentUpload = state.uploadRunning ? getCurrentRunningUpload(queue) : null;
    const statusText = (state.uploadRunning ? '\u8fd0\u884c\u4e2d' : '\u5df2\u6682\u505c') + (currentUpload ? ' | ' + currentUpload.sku : '');
    const visibleIdSet = new Set(allItems.map((item) => item.id));
    const selectedIds = new Set((state.uploadSelectedIds || []).filter((id) => visibleIdSet.has(id)));
    const rows = pageItems.length ? pageItems.map((item) => {
      const active = currentSku && item.sku === currentSku ? ' is-current' : '';
      const isToyLabel = item.kind === 'toy-label';
      const isCopyright = item.kind === 'copyright';
      const ready = isUploadItemReady(item);
      const historyStatus = isToyLabel && (!item.status || item.status === L.uploadSuccess)
        ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f'
        : (isCopyright && (!item.status || item.status === L.uploadSuccess) ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : (item.status || L.uploadSuccess));
      const defaultStatus = isToyLabel ? '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e' : '\u5f85\u4e0a\u4f20';
      const status = viewingHistory ? historyStatus : (ready ? (item.status || defaultStatus) : '\u7f3a\u6587\u4ef6');
      const statusClass = /\u6210\u529f/.test(status) ? 'is-success' : (!ready || /\u5931\u8d25|\u8df3\u8fc7|\u5df2\u6709\u5185\u5bb9/.test(status) ? 'is-missing' : 'is-ready');
      const copyrightFiles = getCopyrightUploadEntries(item);
      const files = isToyLabel
        ? '\u73a9\u5177\u6807\u7b7e\uff1a\u751f\u6210 / \u4e0a\u4f20 BOM / \u4e0b\u8f7d PSD \u4e0e\u56fe\u7247'
        : (isCopyright
          ? '\u7248\u6743\u56fe\uff1a' + (copyrightFiles.length ? copyrightFiles.map((entry) => entry.name).join(' / ') : '\u7f3a\u5c11\u56fe\u7247')
          : [
            item.xlsxName ? 'XLSX \u5df2\u6709 ' + item.xlsxName : 'XLSX \u7f3a\u5c11',
            item.zipName ? 'ZIP \u5df2\u6709 ' + item.zipName : 'ZIP \u7f3a\u5c11',
          ].join(' | '));
      const previousUpload = viewingHistory ? null : findPreviousSuccessfulUpload(item, successfulHistory);
      const previousUploadText = previousUpload ? '\u4e0a\u6b21\u4e0a\u4f20\uff1a' + (previousUpload.completedAt || previousUpload.updatedAt || '') : '';
      const progressText = viewingHistory ? (item.completedAt || item.updatedAt || '') : [previousUploadText, item.step || files].filter(Boolean).join(' \u00b7 ');
      const progressTitle = viewingHistory ? (item.step || item.skipReason || '') : [previousUploadText, files].filter(Boolean).join('\n');
      const uploadName = getUploadDisplayName(item);
      const selectAction = viewingHistory ? 'upload-history-select' : 'upload-queue-select';
      const selectHtml = '<button type="button" class="pfh-upload-check' + (selectedIds.has(item.id) ? ' is-checked' : '') + '" data-action="' + selectAction + '" data-upload-id="' + escapeHtml(item.id) + '" title="\u9009\u4e2d"></button>';
      const actionHtml = selectHtml;
      return '<div class="pfh-upload-item' + active + (viewingHistory ? ' is-history' : '') + '" data-upload-id="' + escapeHtml(item.id) + '">' +
        '<div><b>' + escapeHtml(item.sku) + '</b><small>' + escapeHtml(uploadName) + '</small></div>' +
        '<span class="' + statusClass + '">' + escapeHtml(status) + '</span>' +
        '<em title="' + escapeHtml(progressTitle) + '">' + escapeHtml(progressText) + '</em>' +
        actionHtml +
        '</div>';
    }).join('') : '<div class="pfh-empty">' + escapeHtml(viewingHistory ? L.uploadHistoryEmpty : L.uploadQueueEmpty) + '</div>';
    const historyHeadActions = '<span class="pfh-upload-head-project"><b>\u9879\u76ee</b></span>';
    const tableHead = '<div class="pfh-upload-table-head' + (viewingHistory ? ' is-history' : '') + '">' + historyHeadActions + '<span>\u72b6\u6001</span><span>' + escapeHtml(viewingHistory ? '\u65f6\u95f4' : '\u6587\u4ef6/\u8fdb\u5ea6') + '</span><span>\u9009\u62e9</span></div>';
    const pagerAction = viewingHistory ? 'upload-history-page' : 'upload-page';
    const pager = '<div class="pfh-upload-pager"><span>\u5171 ' + allItems.length + ' \u6761</span><div><button type="button" data-action="' + pagerAction + '-prev"' + (state[pageKey] <= 1 ? ' disabled' : '') + '>\u2039</button>' + renderCompactPager(pagerAction, state[pageKey], totalPages) + '<button type="button" data-action="' + pagerAction + '-next"' + (state[pageKey] >= totalPages ? ' disabled' : '') + '>\u203a</button></div></div>';
    const selectedActionHtml = '<div class="pfh-upload-bottom-actions"><button type="button" data-action="upload-selected-delete"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadDelete) + '</button><button type="button" data-action="upload-selected-retry"' + (!selectedIds.size ? ' disabled' : '') + '>' + escapeHtml(L.uploadRetry) + '</button></div>';
    const modeButtonText = viewingHistory ? '\u8fd4\u56de\u961f\u5217' : '\u5386\u53f2\u8bb0\u5f55';
    const backAction = viewingHistory ? 'upload-history-toggle' : 'home-back';
    const backLabel = viewingHistory ? '\u8fd4\u56de\u63d0\u5ba1\u4e0a\u4f20' : '\u8fd4\u56de\u4e3b\u9875';
    const uploadModeIndex = state.uploadMode === 'toy-label' ? 1 : (state.uploadMode === 'copyright' ? 2 : 0);
    const uploadModeTabs = !viewingHistory ? '<div class="pfh-upload-mode-tabs is-three' + (state.uploadMode === 'toy-label' ? ' is-toy-label' : '') + (state.uploadMode === 'copyright' ? ' is-copyright' : '') + '" style="grid-template-columns:repeat(3,minmax(82px,1fr));width:min(100%,286px)"><i class="pfh-upload-mode-indicator" style="width:calc(33.333% - 2px);transform:translateX(' + (uploadModeIndex * 100) + '%) scale(.96)"></i><button type="button" data-action="upload-mode" data-upload-mode="standard" class="' + (state.uploadMode === 'standard' ? 'is-active' : '') + '">\u56fe\u5305\u8868\u683c</button><button type="button" data-action="upload-mode" data-upload-mode="toy-label" class="' + (state.uploadMode === 'toy-label' ? 'is-active' : '') + '">\u73a9\u5177\u6807\u7b7e</button><button type="button" data-action="upload-mode" data-upload-mode="copyright" class="' + (state.uploadMode === 'copyright' ? 'is-active' : '') + '">\u7248\u6743\u56fe</button></div>' : '';
    const copyrightPendingFiles = Array.isArray(state.copyrightPendingFiles) ? state.copyrightPendingFiles : [];
    const queueControl = state.uploadRunning ? '<button type="button" data-action="upload-pause">' + escapeHtml(L.uploadPauseQueue) + '</button>' : '<button type="button" data-action="upload-start">' + escapeHtml(L.uploadStartQueue) + '</button>';
    const copyrightModeHtml = '<textarea class="pfh-toy-label-sku-input pfh-copyright-sku-input" placeholder="\u7c98\u8d34\u4e00\u4e2a\u6216\u591a\u4e2a SKU \u7f16\u7801">' + escapeHtml(state.copyrightSkuInput || '') + '</textarea>' +
      '<div class="pfh-upload-drop pfh-copyright-drop" data-action="upload-pick" data-upload-drop="copyright" tabindex="0" role="button" aria-label="\u7c98\u8d34\u6216\u62d6\u5165\u7248\u6743\u56fe">\u7c98\u8d34\u6216\u62d6\u5165\u7248\u6743\u56fe\uff08JPG / PNG\uff09' + (copyrightPendingFiles.length ? '<small>\u5df2\u9009 ' + copyrightPendingFiles.length + ' \u5f20\uff1a' + escapeHtml(copyrightPendingFiles.slice(0, 6).map((file) => file.name).join(' / ') + (copyrightPendingFiles.length > 6 ? ' ...' : '')) + '</small>' : '') + '</div>' +
      '<input class="pfh-upload-file" data-upload-kind="copyright" type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png">' +
      '<div class="pfh-upload-actions"><button type="button" data-action="copyright-queue-add"' + (!(state.copyrightSkuInput || '').trim() || !copyrightPendingFiles.length ? ' disabled' : '') + '>\u52a0\u5165\u7248\u6743\u56fe\u4efb\u52a1</button>' + (copyrightPendingFiles.length ? '<button type="button" data-action="copyright-pending-clear">\u6e05\u7a7a\u5df2\u9009</button>' : '') + queueControl + '</div>';
    return '<div class="pfh-detail-scroll pfh-upload-scroll"><section class="pfh-section pfh-upload-section is-open' + (viewingHistory ? ' is-history-view' : '') + '">' +
      '<div class="pfh-section-title pfh-upload-title"><button type="button" class="pfh-upload-back" data-action="' + backAction + '" aria-label="' + backLabel + '">' + iconHtml('backArrow') + '</button><h3>' + escapeHtml(L.uploadSection) + '</h3>' +
      '<span class="pfh-upload-status">' + escapeHtml(statusText) + '</span>' +
      '<button type="button" class="pfh-upload-guide-button" data-action="upload-guide" title="\u4f7f\u7528\u8bf4\u660e" aria-label="\u4f7f\u7528\u8bf4\u660e">' + uploadGuideIconHtml() + '</button>' +
      '<button type="button" data-action="upload-history-toggle">' + escapeHtml(modeButtonText) + '</button>' +
      '<button type="button" data-action="upload-clear-list">' + escapeHtml(L.uploadClearList) + '</button></div>' +
      '<div class="pfh-upload-body">' +
        (viewingHistory ? '' : uploadModeTabs + (state.uploadMode === 'toy-label'
          ? '<textarea class="pfh-toy-label-sku-input" placeholder="\u7c98\u8d34\u591a\u4e2a SKU \u7f16\u7801\uff0c\u6bcf\u884c\u4e00\u4e2a\u6216\u7528\u7a7a\u683c/\u9017\u53f7\u5206\u9694">' + escapeHtml(state.toyLabelSkuInput || '') + '</textarea><div class="pfh-upload-actions"><button type="button" data-action="toy-label-queue-add">\u52a0\u5165\u73a9\u5177\u6807\u7b7e\u4efb\u52a1</button>' + queueControl + '</div>'
          : (state.uploadMode === 'copyright' ? copyrightModeHtml : '<div class="pfh-upload-drop" data-action="upload-pick" data-upload-drop="any" tabindex="0" role="button" aria-label="' + escapeHtml(L.uploadDropHint) + '">' + escapeHtml(L.uploadDropHint) + '</div>' +
        '<input class="pfh-upload-file" data-upload-kind="any" type="file" multiple accept=".xls,.xlsx,.zip,.rar">' +
        '<div class="pfh-upload-actions"><button type="button" data-action="upload-pick" data-upload-kind="any">\u9009\u62e9\u6587\u4ef6</button>' + queueControl + '</div>'))) +
        tableHead + '<div class="pfh-upload-list">' + rows + '</div>' +
      '</div>' +
      '</section></div>' +
      '<div class="pfh-upload-bottom"><div class="pfh-upload-bottom-line">' + pager + selectedActionHtml + '</div></div>' +
      uploadGuideModalHtml() + uploadClearConfirmModalHtml();
  }

  function uploadGuideIconHtml() {
    return '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path d="M512 85.3c235.3 0 426.7 191.4 426.7 426.7 0 235.3-191.4 426.7-426.7 426.7S85.3 747.3 85.3 512C85.3 276.7 276.7 85.3 512 85.3m0-64C241 21.3 21.3 241 21.3 512S241 1002.7 512 1002.7 1002.7 783 1002.7 512 783 21.3 512 21.3z"></path><path d="M512 277.3m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z"></path><path d="M512 810.7c-35.3 0-64-28.7-64-64v-256c0-35.3 28.7-64 64-64s64 28.7 64 64v256c0 35.3-28.7 64-64 64z"></path></svg>';
  }

  function uploadGuideModalHtml() {
    if (!state.uploadGuideOpen) return '';
    return '<div class="pfh-upload-guide-modal" data-action="upload-guide-close"><section role="dialog" aria-modal="true" aria-label="\u4f7f\u7528\u8bf4\u660e"><header><h3>\u4f7f\u7528\u8bf4\u660e</h3><button type="button" data-action="upload-guide-close" aria-label="\u5173\u95ed">\u00d7</button></header><article><b>\u56fe\u5305\u8868\u683c</b><p>\u628a XLSX \u548c ZIP \u4e00\u8d77\u62d6\u5165\uff0c\u811a\u672c\u6309\u6587\u4ef6\u540d\u4e2d\u7684 SKU \u81ea\u52a8\u5339\u914d\u5e76\u52a0\u5165\u4efb\u52a1\u680f\u3002</p><b>\u73a9\u5177\u6807\u7b7e</b><p>\u7c98\u8d34\u591a\u4e2a SKU \u540e\u52a0\u5165\u4efb\u52a1\uff1b\u961f\u5217\u4f1a\u9010\u4e2a\u751f\u6210\u6807\u7b7e\u3001\u4e0a\u4f20 BOM\uff0c\u5e76\u5728\u7ed3\u675f\u540e\u4e0b\u8f7d\u4e00\u4e2a ZIP \u538b\u7f29\u5305\u3002</p><b>\u7248\u6743\u56fe</b><p>\u8f93\u5165 SKU \u540e\u7c98\u8d34\u6216\u62d6\u5165 JPG/PNG\uff1b\u961f\u5217\u4f1a\u4e0a\u4f20\u5230\u300c\u8bbe\u8ba1\u6587\u4ef6 - \u7248\u6743\u56fe\u300d\uff0c\u4fdd\u5b58\u8349\u7a3f\u540e\u63d0\u5ba1\u3002\u591a SKU \u53ef\u6309\u6587\u4ef6\u540d\u4e2d\u7684 SKU \u5339\u914d\uff0c\u6216\u6309\u56fe\u7247\u987a\u5e8f\u4e00\u5bf9\u4e00\u5206\u914d\u3002</p><p class="pfh-upload-guide-tip">\u8bf7\u5148\u4fdd\u8bc1 SKU \u5df2\u6709\u672c\u5730\u7f13\u5b58\uff0c\u4ee5\u907f\u514d\u4efb\u52a1\u65e0\u6cd5\u83b7\u53d6\u5236\u4f5c\u6570\u636e\u3002</p></article></section></div>';
  }

  function uploadClearConfirmModalHtml() {
    if (!state.uploadClearConfirmOpen) return '';
    const history = state.uploadView === 'history';
    return '<div class="pfh-upload-guide-modal pfh-upload-clear-modal"><section role="dialog" aria-modal="true" aria-label="确认清空"><header><h3>确认清空</h3><button type="button" data-action="upload-clear-cancel" aria-label="关闭">×</button></header><article><b>' + (history ? '清空全部历史记录？' : '清空当前提审队列？') + '</b><p>' + (history ? '清空后将无法在历史记录中查看已上传或报错的产品。' : '队列中的待上传文件会被移除，这项操作无法撤销。') + '</p><footer><button type="button" data-action="upload-clear-cancel">取消</button><button type="button" class="is-danger" data-action="upload-clear-confirm">确认清空</button></footer></article></section></div>';
  }

  function renderCompactPager(actionPrefix, currentPage, totalPages) {
    const pages = buildCompactPages(currentPage, totalPages);
    return pages.map((page) => {
      if (page === '...') return '<span class="pfh-pager-ellipsis">\u2026</span>';
      const active = page === currentPage;
      return active
        ? '<b>' + page + '</b>'
        : '<button type="button" class="pfh-pager-page" data-action="' + actionPrefix + '-goto" data-page="' + page + '">' + page + '</button>';
    }).join('');
  }

  function buildCompactPages(currentPage, totalPages) {
    if (totalPages <= 1) return [1];
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage <= 3) {
      [2, 3, 4].forEach((page) => pages.add(page));
    } else if (currentPage >= totalPages - 2) {
      [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
    } else {
      [currentPage - 1, currentPage + 1].forEach((page) => pages.add(page));
    }
    const sorted = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    return sorted.reduce((result, page) => {
      const previous = result[result.length - 1];
      if (typeof previous === 'number' && page - previous > 1) result.push('...');
      result.push(page);
      return result;
    }, []);
  }

  function handlePanelClick(event) {
    const skuContextMenu = event.target && event.target.closest && event.target.closest('.pfh-sku-context-menu');
    if (!skuContextMenu) closeSkuWaterfallContextMenu(ensurePanel());
    const namingCard = event.target && event.target.closest && event.target.closest('.pfh-packaging-naming-card');
    const namingCopy = event.target && event.target.closest && event.target.closest('[data-naming-copy]');
    if (namingCopy) {
      copyText(namingCopy.getAttribute('data-naming-copy') || '');
      namingCopy.classList.add('is-copied');
      window.setTimeout(() => namingCopy.classList.remove('is-copied'), 650);
      showToast(L.copied);
      return;
    }
    if (event.target && event.target.closest && event.target.closest('[data-naming-close]')) {
      closePackagingNamingCard(ensurePanel());
      return;
    }
    if (!namingCard) closePackagingNamingCard(ensurePanel());
    const actionTarget = event.target && event.target.closest && event.target.closest('[data-action]');
    const action = actionTarget && actionTarget.getAttribute('data-action');
    const ledgerMoreArea = event.target && event.target.closest && event.target.closest('.pfh-ledger-more');
    if (state.view === 'ledger' && state.ledgerMenuSku && !ledgerMoreArea) {
      state.ledgerMenuSku = '';
      state.ledgerMenuDate = '';
      closeRenderedLedgerMenus(ensurePanel(), null);
    }
    if (!action && state.view === 'ledger') {
      const card = event.target && event.target.closest && event.target.closest('.pfh-ledger-item.is-clickable');
      const interactive = event.target && event.target.closest && event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"]');
      if (card && !interactive) {
        openLedgerSku(card.getAttribute('data-ledger-sku'), card);
        return;
      }
    }
    if (action === 'notifications') {
      openNotificationModal();
      return;
    }
    if (action === 'notification-close') {
      if (actionTarget.classList.contains('pfh-notification-layer') && event.target !== actionTarget) return;
      closeNotificationModal();
      return;
    }
    if (action === 'notification-tab') {
      state.notificationTab = actionTarget.getAttribute('data-tab') === 'history' ? 'history' : 'new';
      renderNotificationModal(ensurePanel());
      return;
    }
    if (action === 'notification-refresh') {
      refreshNotifications(true);
      return;
    }
    if (action === 'notification-read') {
      markNotificationRead(actionTarget.getAttribute('data-notification-id'), true);
      return;
    }
    if (action === 'notification-read-all') {
      markAllNotificationsRead();
      return;
    }
    if (state.view === 'parameterImage' && action && parameterImageFeature.handleAction(action, actionTarget, state.data || {})) return;
    if (action === 'sku-context-pin' || action === 'sku-context-parameter' || action === 'sku-context-size' || action === 'sku-context-delete') {
      const sku = actionTarget.getAttribute('data-sku') || '';
      if (!sku) return;
      if (action === 'sku-context-delete') {
        deleteSkuFromList(sku);
        closeSkuWaterfallContextMenu(ensurePanel());
        renderShell();
        return;
      }
      if (action === 'sku-context-pin') {
        togglePin(sku);
        closeSkuWaterfallContextMenu(ensurePanel());
        renderShell();
        return;
      }
      if (action === 'sku-context-size' && !state.sizeImageAccessEnabled) {
        closeSkuWaterfallContextMenu(ensurePanel());
        showToast(state.sizeImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待');
        return;
      }
      state.selectedSku = sku;
      state.data = normalizeData(loadData(sku) || { sku });
      state.view = action === 'sku-context-size' ? 'sizeImage' : 'parameterImage';
      state.copywritingMode = false;
      state.skuEditMode = false;
      state.skuPage = 1;
      closeSkuWaterfallContextMenu(ensurePanel());
      if (state.view === 'parameterImage') parameterImageFeature.loadRules();
      expandPanel();
      renderShell();
      return;
    }
    if (state.exportMenuOpen && !(event.target && event.target.closest && event.target.closest('.pfh-export-menu'))) {
      state.exportMenuOpen = false;
      renderShell();
      return;
    }
    if (state.skuSortMenuOpen && !(event.target && event.target.closest && event.target.closest('.pfh-sku-sort-menu'))) {
      state.skuSortMenuOpen = false;
      renderShell();
      return;
    }
    if (action === 'expand') {
      expandPanel();
      return;
    }
    if (action === 'panel-close') {
      suppressPanelTooltips(actionTarget);
      collapsePanel(true);
      return;
    }
    if (action === 'developer-settings-tap') {
      const now = Date.now();
      if (now - state.developerSettingsTapAt > 1800) state.developerSettingsTapCount = 0;
      state.developerSettingsTapAt = now;
      state.developerSettingsTapCount += 1;
      if (state.developerSettingsTapCount >= 5) {
        state.developerSettingsTapCount = 0;
        state.developerInsightsUnlocked = true;
        state.developerToolsOpen = false;
        renderShell();
        showToast('\u6570\u636e\u6d1e\u5bdf\u5df2\u663e\u793a');
      }
      return;
    }
    if (action === 'developer-tools-close') {
      if (actionTarget.classList.contains('pfh-developer-backdrop') && event.target !== actionTarget) return;
      state.developerToolsOpen = false;
      renderShell();
      return;
    }
    if (action === 'developer-layout-copy') {
      const layout = getCurrentLayoutSnapshot();
      copyText(layout);
      addLog('info', '已复制当前布局', layout.replace(/\n/g, ' | '));
      showToast('当前布局已复制');
      return;
    }
    if (action === 'toggle-collection') {
      state.settings.collectionEnabled = !state.settings.collectionEnabled;
      saveSettings(state.settings);
      if (!state.settings.collectionEnabled) {
        stopScan();
        stopMaterialWatch();
        stopManualTabRead();
      } else {
        state.observedDrawer = getProjectDrawer();
        state.observedSku = state.observedDrawer ? findSku(getVisibleText(state.observedDrawer)) : '';
        state.observedTab = state.observedDrawer ? getActiveTabText(state.observedDrawer) : '';
      }
      showToast(state.settings.collectionEnabled ? '\u6570\u636e\u91c7\u96c6\u5df2\u5f00\u542f' : '\u6570\u636e\u91c7\u96c6\u5df2\u5173\u95ed');
      renderShell();
      return;
    }
    if (action === 'refresh') {
      refreshSelectedData();
      return;
    }
    if (action === 'search') {
      const searchView = state.view === 'sizeImage' || state.view === 'parameterImage' ? state.view : 'detail';
      state.view = searchView;
      state.copywritingMode = false;
      state.skuPage = 1;
      runSearch(searchView);
      return;
    }
    if (action === 'clear-search') {
      state.skuPage = 1;
      clearSearch();
      return;
    }
    if (action === 'sku-list-mode') {
      const mode = actionTarget.getAttribute('data-mode') === 'waterfall' ? 'waterfall' : 'list';
      state.settings.skuListMode = mode;
      state.skuPage = 1;
      state.skuSortMenuOpen = false;
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (action === 'sku-sort-toggle') {
      state.skuSortMenuOpen = !state.skuSortMenuOpen;
      state.exportMenuOpen = false;
      renderShell();
      return;
    }
    if (action === 'sku-list-sort') {
      state.settings.skuListSort = actionTarget.getAttribute('data-sort') === 'acquired' ? 'acquired' : 'assigned';
      state.skuPage = 1;
      state.skuSortMenuOpen = false;
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (action === 'sku-page-prev') {
      state.skuPage = Math.max(1, (state.skuPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'sku-page-next') {
      state.skuPage = (state.skuPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'sku-page-goto') {
      state.skuPage = Number(actionTarget.getAttribute('data-page')) || state.skuPage || 1;
      renderShell();
      return;
    }
    if (action === 'copy-title-meta') {
      copyText(formatTitleMeta(state.data));
      showToast(L.copied);
      return;
    }
    if (action === 'copy-sku') {
      copyText(state.data && state.data.sku ? state.data.sku : '');
      showToast(L.copied);
      return;
    }
    if (action === 'pin-search-results') {
      pinCurrentSearchResults();
      return;
    }
    if (action === 'about') {
      if (!state.settings.backgroundNoticeSeen) {
        state.settings.backgroundNoticeSeen = true;
        saveSettings(state.settings);
      }
      if (state.view === 'about') {
        state.view = state.settingsReturnView || (state.data ? 'detail' : 'home');
        state.settingsReturnView = '';
      } else {
        state.settingsReturnView = state.view || (state.data ? 'detail' : 'home');
        state.view = 'about';
      }
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'first-run-tutorial-done') {
      const keyInput = ensurePanel().querySelector('.pfh-tutorial-cloud-key');
      if (keyInput) {
        state.settings.cloudBackupKey = keyInput.value.trim();
        saveSettings(state.settings);
      }
      if (!getCloudBackupKey()) {
        state.tutorialEmptyKeyClickCount = (state.tutorialEmptyKeyClickCount || 0) + 1;
        if (state.tutorialEmptyKeyClickCount >= 5) {
          saveTutorialSeen(true);
          state.tutorialModalOpen = false;
          state.tutorialEmptyKeyClickCount = 0;
          renderShell();
          return;
        }
      } else {
        state.tutorialEmptyKeyClickCount = 0;
      }
      if (!getCloudBackupKey()) {
        showToast(L.cloudBackupMissingKey);
        if (keyInput) keyInput.focus();
        return;
      }
      if (getCloudBackupKey().length < 4) {
        showToast(L.cloudBackupKeyTooShort);
        if (keyInput) keyInput.focus();
        return;
      }
      saveTutorialSeen(true);
      state.tutorialModalOpen = false;
      renderShell();
      return;
    }
    if (action === 'home-main') {
      state.view = 'home';
      state.copywritingMode = false;
      state.uploadExpanded = false;
      state.uploadReturnView = '';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'open-detail') {
      openSelectedProjectDetail();
      return;
    }
    if (action === 'sku-edit-open') {
      state.skuEditMode = true;
      renderShell();
      const firstInput = ensurePanel().querySelector('[data-sku-edit-key="manualCategory"]') || ensurePanel().querySelector('[data-sku-edit-key]');
      if (firstInput) firstInput.focus();
      return;
    }
    if (action === 'sku-edit-cancel') {
      state.skuEditMode = false;
      renderShell();
      return;
    }
    if (action === 'sku-edit-save') {
      saveSkuManualEdits();
      return;
    }
    if (action === 'sku-changes-ack') {
      acknowledgeSkuDataChanges();
      return;
    }
    if (action === 'copywriting-open') {
      openCopywritingFromCurrent(false);
      return;
    }
    if (action === 'toy-copywriting-fill') {
      fillToyCopywriting();
      return;
    }
    if (action === 'copywriting-back') {
      state.copywritingMode = false;
      state.copywritingError = '';
      state.copywritingStatus = '';
      renderShell();
      return;
    }
    if (action === 'copywriting-copy') {
      const record = normalizeCopywritingRecord(state.data && state.data.copywriting);
      if (!record || !record.fullText) showToast('没有可复制的文案');
      else {
        copyText(record.fullText);
        showToast('文案已复制');
        markCopywritingCopied('', true);
      }
      return;
    }
    if (action === 'copywriting-section-copy') {
      const record = normalizeCopywritingRecord(state.data && state.data.copywriting);
      const key = actionTarget.getAttribute('data-copywriting-key') || '';
      const section = record && record.sections ? record.sections.find((item) => item.key === key) : null;
      const value = copywritingSectionCopyValue(section);
      if (!value) showToast('本段没有可复制内容');
      else {
        copyText(value);
        showToast((section && section.label ? section.label : '本段') + '已复制');
        markCopywritingCopied(key, false);
      }
      return;
    }
    if (action === 'copywriting-refresh') {
      openCopywritingFromCurrent(true);
      return;
    }
    if (action === 'copywriting-ack') {
      acknowledgeCopywritingUpdate();
      return;
    }
    if (action === 'open-first-detail') {
      openFirstCachedDetail();
      return;
    }
    if (action === 'home-size-image') {
      if (!state.sizeImageAccessEnabled) {
        showToast(state.sizeImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待');
        scheduleSizeImageAccessRefresh(0);
        return;
      }
      state.view = 'sizeImage';
      state.copywritingMode = false;
      state.skuPage = 1;
      if (!state.selectedSku && state.index[0]) state.selectedSku = state.index[0].sku;
      state.data = state.selectedSku ? normalizeData(loadData(state.selectedSku) || { sku: state.selectedSku }) : null;
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-parameter-image') {
      state.view = 'parameterImage';
      state.copywritingMode = false;
      state.skuPage = 1;
      if (!state.selectedSku && state.index[0]) state.selectedSku = state.index[0].sku;
      state.data = state.selectedSku ? normalizeData(loadData(state.selectedSku) || { sku: state.selectedSku }) : null;
      parameterImageFeature.loadRules();
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'size-image-pick') {
      const input = ensurePanel().querySelector('.pfh-size-image-file-input');
      if (input && !input.disabled) input.click();
      return;
    }
    if (action === 'size-image-save-all') {
      saveCurrentSizeImagesToFolder();
      return;
    }
    if (action === 'size-image-regenerate') {
      regenerateCurrentSizeImages();
      return;
    }
    if (action === 'size-image-confirm-match') {
      confirmPendingSizeImageMatch(actionTarget.getAttribute('data-pending-id') || '');
      return;
    }
    if (action === 'excel-prepare') {
      prepareExcelInfo();
      return;
    }
    if (action === 'excel-generate') {
      if (state.exportType === 'toy-label') generateToyLabelFromCurrent();
      else generateExcelFromCurrent();
      return;
    }
    if (action === 'export-menu-toggle') {
      state.exportMenuOpen = !state.exportMenuOpen;
      renderShell();
      return;
    }
    if (action === 'export-type') {
      state.exportType = actionTarget.getAttribute('data-export-type') === 'toy-label' ? 'toy-label' : 'excel';
      state.exportMenuOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-toggle') {
      if (state.view === 'upload') {
        state.view = state.uploadReturnView || 'home';
        state.uploadReturnView = '';
        state.uploadExpanded = false;
      } else {
        state.uploadReturnView = state.view === 'detail' ? 'detail' : 'home';
        state.view = 'upload';
        state.uploadExpanded = true;
      }
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-unit-converter') {
      state.view = 'unitConverter';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-tools') {
      state.view = 'tools';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'unit-converter-clear') {
      state.cmConverterInput = '';
      renderShell();
      return;
    }
    if (action === 'unit-converter-copy') {
      const result = convertCmInputToInches(state.cmConverterInput);
      if (result) {
        copyText(result);
        showToast('换算结果已复制');
      }
      return;
    }
    if (action === 'code-formatter-clear') {
      state.codeFormatterInput = '';
      renderShell();
      return;
    }
    if (action === 'code-formatter-copy') {
      const result = formatSearchCodes(state.codeFormatterInput);
      if (result) {
        copyText(result);
        showToast('编码格式已复制');
      }
      return;
    }
    if (action === 'ledger-open') {
      state.view = 'ledger';
      state.ledgerDate = state.ledgerDate || getTodayKey();
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'ledger-view-design' || action === 'ledger-view-finalized' || action === 'ledger-view-trash') {
      state.ledgerView = action === 'ledger-view-trash' ? 'trash' : (action === 'ledger-view-finalized' ? 'finalized' : 'design');
      state.ledgerTabTransition = state.ledgerView;
      window.clearTimeout(state.ledgerTabTransitionTimer);
      state.ledgerTabTransitionTimer = window.setTimeout(() => {
        state.ledgerTabTransition = '';
        if (state.view === 'ledger') renderShell();
      }, 460);
      renderShell();
      return;
    }
    if (action === 'ledger-prev-day') {
      state.ledgerDate = shiftDateKey(state.ledgerDate, -1);
      renderShell();
      return;
    }
    if (action === 'ledger-prev-month' || action === 'ledger-next-month') {
      state.ledgerDate = shiftLedgerMonth(state.ledgerDate, action === 'ledger-next-month' ? 1 : -1);
      renderShell();
      return;
    }
    if (action === 'ledger-today') {
      state.ledgerDate = getTodayKey();
      renderShell();
      return;
    }
    if (action === 'ledger-fullscreen-toggle') {
      state.ledgerFullscreen = !state.ledgerFullscreen;
      renderShell();
      return;
    }
    if (action === 'ledger-copy') {
      copyLedgerTsv(state.ledgerDate);
      return;
    }
    if (action === 'ledger-copy-selected') {
      copySelectedFinalizedLedgerSkus();
      return;
    }
    if (action === 'ledger-copy-video') {
      copySelectedLedgerVideoRows();
      return;
    }
    if (action === 'ledger-toggle-select') {
      toggleLedgerSelection(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-select-date') {
      toggleLedgerDateSelection(actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-performance-merge' || action === 'ledger-performance-unmerge') {
      updateSelectedLedgerPerformanceGroups(action === 'ledger-performance-merge');
      return;
    }
    if (action === 'ledger-highlight-performance-group') {
      highlightLedgerPerformanceGroup(actionTarget.getAttribute('data-group-id'));
      return;
    }
    if (action === 'ledger-export') {
      exportLedgerRecords(state.ledgerDate);
      return;
    }
    if (action === 'ledger-clear') {
      clearLedgerDate(state.ledgerDate);
      return;
    }
    if (action === 'ledger-trash-restore' || action === 'ledger-trash-delete') {
      updateLedgerTrashFromAction(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-trash-empty') {
      emptyLedgerTrashMonth(state.ledgerDate);
      return;
    }
    if (action === 'ledger-more') {
      const sku = actionTarget.getAttribute('data-sku');
      const date = normalizeLedgerDate(actionTarget.getAttribute('data-date')) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
      state.ledgerFlowTransitionSku = '';
      const opening = state.ledgerMenuSku !== sku || state.ledgerMenuDate !== date;
      state.ledgerMenuSku = opening ? sku : '';
      state.ledgerMenuDate = opening ? date : '';
      closeRenderedLedgerMenus(ensurePanel(), opening ? actionTarget.closest('.pfh-ledger-item') : null);
      const record = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === date);
      if (record) refreshLedgerCard(record);
      else renderShell();
      return;
    }
    if (action === 'ledger-image-generated' || action === 'ledger-unmark-image-generated' || action === 'ledger-finalize' || action === 'ledger-unfinalize' || action === 'ledger-extension' || action === 'ledger-void' || action === 'ledger-done' || action === 'ledger-remove') {
      const options = {};
      if (action === 'ledger-finalize') {
        const card = actionTarget.closest('.pfh-ledger-item');
        const input = card && card.querySelector('.pfh-ledger-price input');
        const rawPrice = String(input && input.value || '').trim();
        const purchasePrice = normalizeLedgerPurchasePrice(rawPrice);
        if (rawPrice && !purchasePrice) {
          showToast('价格格式不正确，请输入数字，例如 6 或 6.50');
          if (input) input.focus();
          return;
        }
        if (purchasePrice) options.purchasePrice = purchasePrice;
      }
      updateLedgerFromAction(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'), options);
      return;
    }
    if (action === 'ledger-edit-finalized-time') {
      openLedgerFinalizedTimeEditor(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-time-close') {
      state.ledgerTimeEditor = null;
      renderShell();
      return;
    }
    if (action === 'ledger-time-today' || action === 'ledger-time-yesterday' || action === 'ledger-time-day-before') {
      updateLedgerTimeEditorPreset(action);
      return;
    }
    if (action === 'ledger-time-save') {
      saveLedgerFinalizedTimeEditor();
      return;
    }
    if (action === 'ledger-toggle-box-file' || action === 'ledger-toggle-label-file' || action === 'ledger-toggle-image-pack') {
      toggleLedgerWorkFlag(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-cycle-artwork-state') {
      cycleLedgerArtworkState(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-open-reference') {
      openLedgerReference(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-copy-sku') {
      const sku = actionTarget.getAttribute('data-sku') || '';
      if (sku) {
        copyText(sku);
        actionTarget.classList.add('is-copied');
        window.setTimeout(() => actionTarget.classList.remove('is-copied'), 650);
        showToast('已复制编码：' + sku);
      }
      return;
    }
    if (action === 'ledger-open-sku') {
      openLedgerSku(actionTarget.getAttribute('data-sku'), actionTarget.closest('.pfh-ledger-item'));
      return;
    }
    if (action === 'home-excel-coming-soon') {
      showToast('\u656c\u8bf7\u671f\u5f85');
      return;
    }
    if (action === 'home-back') {
      if (state.searchQuery.trim()) {
        state.searchQuery = '';
        state.skuPage = 1;
        const input = ensurePanel().querySelector('.pfh-search-input');
        if (input) input.value = '';
        updateSearchClear();
      }
      const returnView = state.detailReturnView || '';
      const returnScroll = state.detailReturnScroll;
      if (state.view === 'ledger' && returnView !== 'ledger') state.ledgerFullscreen = false;
      state.view = returnView || 'home';
      state.detailReturnView = '';
      state.detailReturnScroll = null;
      state.uploadExpanded = false;
      state.uploadReturnView = '';
      renderShell();
      if (returnView === 'ledger') restoreLedgerReturnScroll(returnScroll);
      return;
    }
    if (action === 'upload-history-toggle') {
      state.uploadView = state.uploadView === 'history' ? 'queue' : 'history';
      if (state.uploadView === 'history') state.uploadHistoryPage = 1;
      renderShell();
      return;
    }
    if (action === 'upload-clear-list') {
      clearCurrentUploadList();
      return;
    }
    if (action === 'upload-clear-cancel') {
      state.uploadClearConfirmOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-clear-confirm') {
      confirmClearCurrentUploadList();
      return;
    }
    if (action === 'upload-guide') {
      state.uploadGuideOpen = true;
      renderShell();
      return;
    }
    if (action === 'upload-guide-close') {
      if (actionTarget.classList.contains('pfh-upload-guide-modal') && event.target !== actionTarget) return;
      state.uploadGuideOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-mode') {
      const mode = actionTarget.getAttribute('data-upload-mode');
      state.uploadMode = /^(?:standard|toy-label|copyright)$/.test(mode || '') ? mode : 'standard';
      renderShell();
      return;
    }
    if (action === 'toy-label-queue-add') {
      addToyLabelQueueItems(state.toyLabelSkuInput);
      return;
    }
    if (action === 'copyright-queue-add') {
      addCopyrightQueueItems(state.copyrightSkuInput, state.copyrightPendingFiles);
      return;
    }
    if (action === 'copyright-pending-clear') {
      state.copyrightPendingFiles = [];
      renderShell();
      return;
    }
    if (action === 'upload-page-prev') {
      state.uploadPage = Math.max(1, (state.uploadPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'upload-page-next') {
      state.uploadPage = (state.uploadPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'upload-page-goto') {
      state.uploadPage = Math.max(1, parseInt(actionTarget.getAttribute('data-page') || '1', 10) || 1);
      renderShell();
      return;
    }
    if (action === 'upload-history-page-prev') {
      state.uploadHistoryPage = Math.max(1, (state.uploadHistoryPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'upload-history-page-next') {
      state.uploadHistoryPage = (state.uploadHistoryPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'upload-history-page-goto') {
      state.uploadHistoryPage = Math.max(1, parseInt(actionTarget.getAttribute('data-page') || '1', 10) || 1);
      renderShell();
      return;
    }
    if (action === 'upload-pick') {
      const input = ensurePanel().querySelector('.pfh-upload-file');
      if (input) input.click();
      return;
    }
    if (action === 'upload-start') {
      startUploadQueue();
      return;
    }
    if (action === 'upload-pause') {
      pauseUploadQueue();
      return;
    }
    if (action === 'upload-remove') {
      removeUploadQueueItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-retry') {
      retryUploadQueueItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-queue-select') {
      toggleUploadSelection(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-select') {
      toggleUploadSelection(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-retry') {
      retryUploadHistoryItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-delete') {
      deleteUploadHistoryItems([actionTarget.getAttribute('data-upload-id')]);
      return;
    }
    if (action === 'upload-selected-retry') {
      retrySelectedUploads();
      return;
    }
    if (action === 'upload-selected-delete') {
      deleteSelectedUploads();
      return;
    }
    if (action === 'export-cache') {
      exportCache();
      return;
    }
    if (action === 'import-cache') {
      const input = ensurePanel().querySelector('.pfh-import-file');
      if (input) input.click();
      return;
    }
    if (action === 'cloud-backup-save') {
      saveCloudBackupNow();
      return;
    }
    if (action === 'cloud-backup-restore') {
      restoreCloudBackup();
      return;
    }
    if (action === 'desktop-bridge-connect') {
      const input = ensurePanel().querySelector('.pfh-desktop-bridge-token');
      pairDesktopBridge(input && input.value);
      return;
    }
    if (action === 'desktop-bridge-disconnect') {
      disconnectDesktopBridge(true);
      renderShell();
      return;
    }
    if (action === 'copy-logs') {
      copyText(formatLogsForCopy());
      showToast(L.copied);
      return;
    }
    if (action === 'clear-logs') {
      state.logs = [];
      saveLogs();
      showToast('\u65e5\u5fd7\u5df2\u6e05\u7a7a');
      renderShell();
      return;
    }
    if (action === 'export-insights') {
      exportInsights();
      return;
    }
    if (action === 'insights-cloud-summary') {
      refreshCloudInsightSummary();
      return;
    }
    if (action === 'insights-readiness') {
      checkCloudInsightReadiness();
      return;
    }
    if (action === 'tips-manage') {
      openLoadingTipsManager();
      return;
    }
    if (action === 'insights-ai-classify') {
      summarizeCloudClassificationRules();
      return;
    }
    if (action === 'insights-apply-classify') {
      applyCloudClassificationRulesToLocal();
      return;
    }
    if (action === 'insights-view-classify') {
      viewCloudClassificationRules();
      return;
    }
    if (action === 'insights-refresh-rules') {
      refreshMaintainedCleaningRules();
      return;
    }
    if (action === 'insights-check-ai') {
      checkCloudInsightAiStatus();
      return;
    }
    if (action === 'insights-copy-report') {
      copyCloudInsightReport();
      return;
    }
    if (action === 'insights-copy-ai') {
      copyCloudInsightAiReport();
      return;
    }
    if (action === 'insights-copy-rules') {
      copyCloudInsightRules();
      return;
    }
    if (/^insights-rule-/.test(action)) {
      updateMaintainedCleaningRuleStatus(actionTarget.getAttribute('data-rule-id'), action);
      return;
    }
    if (action === 'clear-insights') {
      state.insights = emptyInsights();
      saveInsights();
      showToast('\u6d1e\u5bdf\u6570\u636e\u5df2\u6e05\u7a7a');
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-keyword-mode') {
      state.settings.excelKeywordMode = event.target.value === 'brandName' ? 'brandName' : 'english';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-download-mode') {
      state.settings.excelDownloadMode = event.target.value === 'direct' ? 'direct' : 'picker';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-ai-model') {
      state.settings.insightAiModel = event.target.value === MODELSCOPE_INSIGHT_MODEL ? MODELSCOPE_INSIGHT_MODEL : 'glm-4.7-flash';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (action === 'confirm-tail-seal') {
      confirmTailSealLength(event.target);
      return;
    }
    if (action === 'copy-all') {
      copyText(formatCopyAll(state.data));
      showToast(L.copied);
      return;
    }

    const pinElement = event.target && event.target.closest && event.target.closest('[data-pin-sku]');
    const pinTarget = pinElement && pinElement.getAttribute('data-pin-sku');
    if (pinTarget) {
      event.stopPropagation();
      togglePin(pinTarget);
      renderShell();
      return;
    }

    const skuButton = event.target && event.target.closest && event.target.closest('[data-sku]');
    if (skuButton) {
      const sku = skuButton.getAttribute('data-sku');
      const data = loadData(sku);
      state.selectedSku = sku;
      state.data = data ? normalizeData(data) : (state.view === 'sizeImage' || state.view === 'parameterImage' ? normalizeData({ sku }) : null);
      if (state.view === 'sizeImage' || state.view === 'parameterImage') {
        expandPanel();
        return;
      }
      state.view = 'detail';
      state.copywritingMode = false;
      state.skuEditMode = false;
      resetExcelState();
      expandPanel();
      return;
    }

    const editTarget = event.target && event.target.closest && event.target.closest('[data-edit-key]');
    const editKey = editTarget && editTarget.getAttribute('data-edit-key');
    if (editKey === 'productLength') {
      startTailSealEdit(editTarget);
      return;
    }

    const copyTarget = event.target && event.target.closest && event.target.closest('[data-copy-key]');
    const key = copyTarget && copyTarget.getAttribute('data-copy-key');
    if (key) {
      if (event.target.closest('button, input, textarea, select')) return;
      copyText(key === 'printSizeText' ? formatPrintSizeDisplay(state.data) : ((state.data && state.data[key]) || ''));
      copyTarget.classList.add('is-copied');
      window.setTimeout(() => copyTarget.classList.remove('is-copied'), 650);
      showToast(L.copied);
    }
  }

  function handlePanelKeydown(event) {
    if (state.view === 'ledger' && state.ledgerFullscreen && event.key === 'Escape') {
      event.preventDefault();
      state.ledgerFullscreen = false;
      renderShell();
      return;
    }
    if (state.skuEditMode && event.target && event.target.matches && event.target.matches('[data-sku-edit-key]')) {
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        saveSkuManualEdits();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        state.skuEditMode = false;
        renderShell();
        return;
      }
    }
    if (state.view === 'ledger' && state.ledgerTimeEditor && event.key === 'Enter' && !event.isComposing && event.target && event.target.matches && event.target.matches('.pfh-ledger-time-date,.pfh-ledger-time-hour,.pfh-ledger-time-minute')) {
      event.preventDefault();
      saveLedgerFinalizedTimeEditor();
      return;
    }
    if (state.view === 'ledger' && event.target && event.target.classList && event.target.classList.contains('pfh-ledger-item') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openLedgerSku(event.target.getAttribute('data-ledger-sku'), event.target);
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input') && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      runSearch();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-tail-input') && event.key === 'Enter') {
      event.preventDefault();
      confirmTailSealLength(event.target);
    }
  }

  function handlePanelInput(event) {
    if (state.view === 'parameterImage' && parameterImageFeature.handleInput(event, state.data || {})) return;
    if (event.target && event.target.classList && event.target.classList.contains('pfh-unit-converter-input')) {
      state.cmConverterInput = event.target.value;
      const result = convertCmInputToInches(state.cmConverterInput);
      const panel = ensurePanel();
      const output = panel.querySelector('.pfh-unit-converter-result');
      const copyButton = panel.querySelector('[data-action="unit-converter-copy"]');
      if (output) output.textContent = result || '等待输入';
      if (copyButton) copyButton.disabled = !result;
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-code-formatter-input')) {
      state.codeFormatterInput = event.target.value;
      const result = formatSearchCodes(state.codeFormatterInput);
      const panel = ensurePanel();
      const output = panel.querySelector('.pfh-code-formatter-result');
      const copyButton = panel.querySelector('[data-action="code-formatter-copy"]');
      if (output) output.textContent = result || 'ext:zip|ext:xlsx 编码1|编码2';
      if (copyButton) copyButton.disabled = !result;
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-text')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      const type = event.target.getAttribute('data-size-image-type');
      if (sku && type === 'carton') ensureSizeImageSession(sku).cartonRemarkText = event.target.value;
      if (sku && type === 'label') {
        const key = event.target.getAttribute('data-size-image-key') || '';
        if (key) ensureSizeImageSession(sku).labelRemarkTexts[key] = event.target.value;
      }
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input')) {
      event.target.value = normalizeSearchInput(event.target.value);
      updateSearchClear();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-price')) {
      state.excelPurchasePrice = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-cloud-backup-key')) {
      state.settings.cloudBackupKey = event.target.value.trim();
      saveSettings(state.settings);
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-tutorial-cloud-key')) {
      state.settings.cloudBackupKey = event.target.value.trim();
      saveSettings(state.settings);
      state.tutorialEmptyKeyClickCount = 0;
      const tutorialButton = ensurePanel().querySelector('[data-action="first-run-tutorial-done"]');
      if (tutorialButton) tutorialButton.setAttribute('aria-disabled', getCloudBackupKey().length < 4 ? 'true' : 'false');
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-toy-label-sku-input') && !event.target.classList.contains('pfh-copyright-sku-input')) {
      state.toyLabelSkuInput = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-copyright-sku-input')) {
      state.copyrightSkuInput = event.target.value;
      const button = ensurePanel().querySelector('[data-action="copyright-queue-add"]');
      if (button) button.disabled = !state.copyrightSkuInput.trim() || !(state.copyrightPendingFiles || []).length;
    }
  }

  function handlePanelPaste(event) {
    if (event.defaultPrevented) return;
    if (state.view === 'upload') {
      const panel = document.getElementById(PANEL_ID);
      const drop = event.target && event.target.closest && event.target.closest('.pfh-upload-drop')
        || (panel && panel.querySelector('.pfh-upload-drop:hover'));
      const files = state.uploadMode === 'copyright' ? getClipboardCopyrightFiles(event) : getClipboardUploadFiles(event);
      if (drop && files.length) {
        event.preventDefault();
        event.stopPropagation();
        drop.classList.add('is-paste-received');
        window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
        if (state.uploadMode === 'copyright') stageCopyrightUploadFiles(files);
        else processQueuedUploadFiles(files);
        return;
      }
    }
    if (!(event.target && event.target.classList && event.target.classList.contains('pfh-search-input'))) return;
    const pasted = event.clipboardData && event.clipboardData.getData('text');
    if (!pasted || !/[\r\n,，;；、|/\\]/.test(pasted)) return;
    event.preventDefault();
    const input = event.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || start;
    const next = input.value.slice(0, start) + ' ' + pasted + ' ' + input.value.slice(end);
    input.value = normalizeSearchInput(next);
    input.setSelectionRange(input.value.length, input.value.length);
    updateSearchClear();
  }

  function handleSizeImageHoverPaste(event) {
    if (state.view === 'upload') {
      const panel = document.getElementById(PANEL_ID);
      const drop = panel && panel.querySelector('.pfh-upload-drop:hover, .pfh-upload-drop:focus');
      const files = state.uploadMode === 'copyright' ? getClipboardCopyrightFiles(event) : getClipboardUploadFiles(event);
      if (!drop || !files.length) return;
      event.preventDefault();
      event.stopPropagation();
      drop.classList.add('is-paste-received');
      window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
      if (state.uploadMode === 'copyright') stageCopyrightUploadFiles(files);
      else processQueuedUploadFiles(files);
      return;
    }
    if (state.view === 'parameterImage') {
      const panel = document.getElementById(PANEL_ID);
      const drop = panel && panel.querySelector('.pfh-parameter-drop:hover');
      if (!drop || drop.disabled) return;
      const files = Array.from(event.clipboardData && event.clipboardData.items || [])
        .filter((item) => item.kind === 'file' && item.type === 'image/png')
        .map((item) => item.getAsFile()).filter(Boolean);
      if (!files.length) return;
      event.preventDefault();
      event.stopPropagation();
      parameterImageFeature.handleDrop(files, state.data || {});
      return;
    }
    if (state.view !== 'sizeImage' || state.sizeImageBusySku) return;
    const panel = document.getElementById(PANEL_ID);
    const drop = panel && panel.querySelector('.pfh-size-image-drop:hover');
    if (!drop || drop.disabled) return;
    const clipboard = event.clipboardData;
    const imageFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file' && /^image\/(?:png|jpeg)$/.test(item.type || ''))
      .map((item) => item.getAsFile())
      .filter(Boolean)
      .map((file, index) => {
        if (/\.(?:png|jpe?g)$/i.test(file.name || '')) return file;
        const extension = file.type === 'image/jpeg' ? 'jpg' : 'png';
        return new File([file], '\u7c98\u8d34\u56fe\u7247-' + (index + 1) + '.' + extension, { type: file.type || 'image/png' });
      });
    if (!imageFiles.length) return;
    event.preventDefault();
    event.stopPropagation();
    drop.classList.add('is-paste-received');
    window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
    processSizeImageFiles(imageFiles);
  }

  function getClipboardUploadFiles(event) {
    const clipboard = event && event.clipboardData;
    const itemFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const directFiles = Array.from(clipboard && clipboard.files || []);
    const seen = new Set();
    return itemFiles.concat(directFiles).filter((file) => {
      if (!file || !getUploadKindFromFileName(file.name)) return false;
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getClipboardCopyrightFiles(event) {
    const clipboard = event && event.clipboardData;
    const itemFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const directFiles = Array.from(clipboard && clipboard.files || []);
    const seen = new Set();
    return itemFiles.concat(directFiles).filter((file) => {
      if (!file || !isCopyrightImageFile(file)) return false;
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((file, index) => normalizeCopyrightImageFile(file, index));
  }

  function handlePanelChange(event) {
    if (state.view === 'parameterImage' && parameterImageFeature.handleChange(event, state.data || {})) return;
    if (event.target && event.target.classList && event.target.classList.contains('pfh-copywriting-view-select')) {
      state.copywritingView = event.target.value === 'full' ? 'full' : 'file';
      renderShell();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-text')) {
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-input')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!sku) return;
      ensureSizeImageSession(sku).includeRemark = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-round-arc-input')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!sku) return;
      ensureSizeImageSession(sku).includeRoundArc = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-batch-number-input')) {
      const sku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!sku) return;
      ensureSizeImageSession(sku).includeBatchNumber = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-file-input')) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length) processSizeImageFiles(files);
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-upload-file')) {
      const files = Array.from(event.target.files || []);
      const kind = event.target.getAttribute('data-upload-kind') || '';
      event.target.value = '';
      if (kind === 'copyright') stageCopyrightUploadFiles(files);
      else processQueuedUploadFiles(files);
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-date')) {
      const month = normalizeLedgerMonth(event.target.value);
      state.ledgerDate = month + '-01';
      renderShell();
    }
  }

  function handlePanelDragOver(event) {
    if (event.target && event.target.closest && event.target.closest('.pfh-parameter-page')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-size-image-page')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-upload-section')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handlePanelDrop(event) {
    if (event.target && event.target.closest && event.target.closest('.pfh-parameter-page')) {
      event.preventDefault();
      parameterImageFeature.handleDrop(Array.from(event.dataTransfer && event.dataTransfer.files || []), state.data || {});
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-size-image-page')) {
      event.preventDefault();
      const files = Array.from(event.dataTransfer && event.dataTransfer.files || []);
      if (files.length) processSizeImageFiles(files);
      return;
    }
    if (!(event.target && event.target.closest && event.target.closest('.pfh-upload-section'))) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer && event.dataTransfer.files || []);
    if (state.uploadMode === 'copyright') stageCopyrightUploadFiles(files);
    else processQueuedUploadFiles(files);
  }

  async function processQueuedUploadFiles(files) {
    const supported = Array.from(files || []).filter((file) => file && getUploadKindFromFileName(file.name));
    if (!supported.length) {
      showToast('\u8bf7\u62d6\u5165\u6216\u7c98\u8d34 xls\u3001xlsx\u3001zip \u6216 rar \u6587\u4ef6');
      return;
    }
    for (const file of supported) await storeQueuedUploadFile(file);
  }

  function isCopyrightImageFile(file) {
    return Boolean(file && (/^image\/(?:jpeg|png)$/i.test(file.type || '') || /\.(?:png|jpe?g)$/i.test(file.name || '')));
  }

  function normalizeCopyrightImageFile(file, index) {
    if (/\.(?:png|jpe?g)$/i.test(file && file.name || '')) return file;
    const extension = file && file.type === 'image/jpeg' ? 'jpg' : 'png';
    return new File([file], '\u7248\u6743\u56fe-' + (Number(index) + 1) + '.' + extension, { type: file.type || 'image/png', lastModified: file.lastModified || Date.now() });
  }

  function stageCopyrightUploadFiles(files) {
    const candidates = Array.from(files || []).filter(isCopyrightImageFile).map(normalizeCopyrightImageFile);
    const supported = candidates.filter((file) => file.size <= 50 * 1024 * 1024);
    if (!supported.length) {
      showToast(candidates.length ? '\u7248\u6743\u56fe\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 50MB' : '\u8bf7\u7c98\u8d34\u6216\u62d6\u5165 JPG / PNG \u56fe\u7247');
      return;
    }
    const current = Array.isArray(state.copyrightPendingFiles) ? state.copyrightPendingFiles : [];
    const seen = new Set(current.map((file) => [file.name, file.size, file.lastModified].join('|')));
    const additions = supported.filter((file) => {
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    state.copyrightPendingFiles = current.concat(additions).slice(0, 60);
    renderShell();
    showToast('\u5df2\u9009\u62e9 ' + state.copyrightPendingFiles.length + ' \u5f20\u7248\u6743\u56fe');
  }

  function assignCopyrightFilesToSkus(skus, files) {
    const assignments = new Map(skus.map((sku) => [sku, []]));
    const named = files.map((file) => ({ file, matches: skus.filter((sku) => String(file.name || '').toUpperCase().includes(sku)) }));
    if (named.every((item) => item.matches.length === 1)) {
      named.forEach((item) => assignments.get(item.matches[0]).push(item.file));
      if (skus.every((sku) => assignments.get(sku).length)) return assignments;
      assignments.forEach((value, key) => assignments.set(key, []));
    }
    if (skus.length === 1) {
      assignments.set(skus[0], files.slice());
      return assignments;
    }
    if (files.length === 1) {
      skus.forEach((sku) => assignments.set(sku, files.slice()));
      return assignments;
    }
    if (files.length === skus.length) {
      skus.forEach((sku, index) => assignments.set(sku, [files[index]]));
      return assignments;
    }
    return null;
  }

  async function addCopyrightQueueItems(input, pendingFiles) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    const files = Array.from(pendingFiles || []).filter(isCopyrightImageFile);
    if (!skus.length || !files.length) {
      showToast('\u8bf7\u5148\u8f93\u5165 SKU \u5e76\u7c98\u8d34\u6216\u9009\u62e9\u7248\u6743\u56fe');
      return;
    }
    const assignments = assignCopyrightFilesToSkus(skus, files);
    if (!assignments) {
      showToast('\u591a SKU \u65f6\uff0c\u8bf7\u8ba9\u56fe\u7247\u6570\u91cf\u4e0e SKU \u6570\u91cf\u4e00\u81f4\uff0c\u6216\u5728\u6587\u4ef6\u540d\u4e2d\u5e26\u4e0a SKU');
      return;
    }
    try {
      const queue = loadUploadQueue();
      const now = new Date().toLocaleString();
      for (const sku of skus) {
        let item = queue.find((entry) => entry.kind === 'copyright' && entry.sku === sku && !/\u6210\u529f/.test(entry.status || ''));
        if (!item) {
          const cached = loadData(sku);
          item = {
            id: 'copyright-' + sku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            kind: 'copyright',
            sku,
            name: buildUploadDisplayName(cached, '', sku),
            copyrightFiles: [],
            createdAt: now,
            updatedAt: now,
          };
          queue.unshift(item);
        }
        const existingNames = new Set(getCopyrightUploadEntries(item).map((entry) => entry.name + '|' + entry.size));
        for (const [index, file] of assignments.get(sku).entries()) {
          const identity = file.name + '|' + file.size;
          if (existingNames.has(identity)) continue;
          const key = uploadFileKey(sku, 'copyright') + ':' + Date.now() + ':' + index + ':' + Math.random().toString(36).slice(2, 7);
          await putUploadFile(key, cloneUploadFile(file));
          item.copyrightFiles.push({ key, name: file.name, size: file.size, type: file.type || guessMime(file.name) });
          existingNames.add(identity);
        }
        item.status = getCopyrightUploadEntries(item).length ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = getCopyrightUploadEntries(item).length ? '\u7248\u6743\u56fe\u5df2\u5c31\u7eea' : '\u7f3a\u7248\u6743\u56fe';
        item.skipReason = '';
        item.forceReplace = false;
        item.updatedAt = now;
      }
      state.uploadQueue = queue;
      state.copyrightSkuInput = '';
      state.copyrightPendingFiles = [];
      state.uploadPage = 1;
      saveUploadQueue();
      renderShell();
      showToast(skus.length + ' \u4e2a\u7248\u6743\u56fe\u4efb\u52a1\u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper copyright queue failed:', error);
      showToast('\u7248\u6743\u56fe\u4efb\u52a1\u4fdd\u5b58\u5931\u8d25');
    }
  }

  function startTailSealEdit(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    if (!row) return;
    const valueBox = row.querySelector('.pfh-value');
    if (!valueBox) return;
    row.classList.add('is-inline-editing');
    const current = firstNumber(state.data && state.data.productLength);
    valueBox.innerHTML = '<span class="pfh-inline-edit"><input class="pfh-tail-input" type="text" placeholder="cm" value="' +
      escapeHtml(Number.isFinite(current) ? trimNumber(current) : '') +
      '"><button type="button" data-action="confirm-tail-seal">' + escapeHtml(L.ok) + '</button></span>';
    const input = valueBox.querySelector('input');
    if (input) input.focus();
  }

  function confirmTailSealLength(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    const input = row && row.querySelector('.pfh-tail-input');
    const cm = firstNumber(input && input.value);
    if (!Number.isFinite(cm) || cm <= 0) {
      showToast(L.invalidCm);
      return;
    }
    const value = formatDimensionPart([cm], 0);
    state.data = normalizeData({ ...(state.data || {}), tailSealLengthValue: value, productLength: value });
    if (state.data.sku) saveData(state.data.sku, state.data);
    renderShell();
  }

  async function storeQueuedUploadFile(file) {
    if (!file) return;
    const kind = getUploadKindFromFileName(file.name);
    if (!kind) return;
    const skus = getSkusFromFileName(file.name);
    if (!skus.length) {
      showToast(L.uploadNoSkuInFile + ': ' + file.name);
      return;
    }
    if (kind === 'zip' && file.size > UPLOAD_MAX_ZIP_BYTES) {
      const skippedItems = [];
      for (const sku of skus) {
        const item = ensureUploadQueueItem(sku, file.name);
        if (item.zipKey) deleteUploadFile(item.zipKey).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
        item.zipName = file.name;
        item.zipKey = '';
        item.status = '\u5df2\u8df3\u8fc7';
        item.step = L.uploadFileTooLarge;
        item.skipReason = L.uploadFileTooLarge;
        item.updatedAt = new Date().toLocaleString();
        skippedItems.push(item);
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + L.uploadFileTooLarge);
      return;
    }
    try {
      for (const sku of skus) {
        const key = uploadFileKey(sku, kind);
        await putUploadFile(key, cloneUploadFile(file));
        const item = ensureUploadQueueItem(sku, file.name);
        if (kind === 'xlsx') {
          item.xlsxName = file.name;
          item.xlsxKey = key;
        } else {
          item.zipName = file.name;
          item.zipKey = key;
        }
        item.status = item.xlsxKey && item.zipKey ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = item.xlsxKey && item.zipKey ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item);
        item.forceReplace = false;
        item.skipReason = '';
        item.updatedAt = new Date().toLocaleString();
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + kind.toUpperCase() + ' \u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper store upload file failed:', error);
      showToast('\u6587\u4ef6\u8bb0\u5f55\u5931\u8d25');
    }
  }

  function ensureUploadQueueItem(sku, filename) {
    let item = state.uploadQueue.find((entry) => (entry.kind || 'standard') === 'standard' && entry.sku === sku && !/成功/.test(entry.status || ''));
    if (item) return item;
    const cached = loadData(sku);
    item = {
      id: sku + '-' + Date.now(),
      sku,
      name: buildUploadDisplayName(cached, filename, sku),
      status: '\u7f3a\u6587\u4ef6',
      step: '',
      forceReplace: false,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    state.uploadQueue.unshift(item);
    return item;
  }

  function addToyLabelQueueItems(input) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    if (!skus.length) {
      showToast('请粘贴至少一个 SKU 编码');
      return;
    }
    const queued = new Set((state.uploadQueue || []).filter((item) => item.kind === 'toy-label' && !/\u6210\u529f/.test(item.status || '')).map((item) => item.sku));
    const now = new Date().toLocaleString();
    const items = skus.filter((sku) => !queued.has(sku)).map((sku, index) => {
      const cached = loadData(sku);
      return {
        id: 'toy-label-' + sku + '-' + Date.now() + '-' + index,
        kind: 'toy-label',
        sku,
        name: buildUploadDisplayName(cached, '', sku),
        xlsxKey: 'toy-label',
        zipKey: 'toy-label',
        status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
        step: cached ? '\u7b49\u5f85\u6279\u91cf\u641c\u7d22' : '\u7b49\u5f85\u4ece\u8bbe\u8ba1\u4efb\u52a1\u83b7\u53d6\u6570\u636e',
        createdAt: now,
        updatedAt: now,
      };
    });
    if (!items.length) {
      showToast('这些 SKU 已在玩具标签任务栏中');
      return;
    }
    state.uploadQueue = items.concat(state.uploadQueue || []);
    state.toyLabelSkuInput = '';
    state.uploadPage = 1;
    saveUploadQueue();
    renderShell();
    showToast(items.length + ' 个玩具标签任务已加入');
  }

  function cloneUploadFile(file) {
    return new File([file], file.name, { type: file.type || guessMime(file.name), lastModified: file.lastModified || Date.now() });
  }

  function getSkusFromFileName(filename) {
    const matches = String(filename || '').match(/\bSKU\d+\b/ig) || [];
    return matches.map((sku) => sku.toUpperCase()).filter((sku, index, arr) => arr.indexOf(sku) === index);
  }

  function getUploadKindFromFileName(filename) {
    const lower = String(filename || '').toLowerCase();
    if (/\.(xlsx|xls)$/.test(lower)) return 'xlsx';
    if (/\.(zip|rar)$/.test(lower)) return 'zip';
    return '';
  }

  function inferUploadNameFromFileName(filename, sku) {
    return compactText(String(filename || '').replace(/\.[^.]+$/, '').replace(sku, ''));
  }

  function buildUploadDisplayName(cached, filename, sku) {
    const fromCache = [cached && cached.brand, cached && cached.name].filter(Boolean).join(' ');
    return cleanName(fromCache) || cleanName(inferUploadNameFromFileName(filename, sku));
  }

  function getUploadDisplayName(item) {
    const cached = item && item.sku ? loadData(item.sku) : null;
    const copyrightEntry = getCopyrightUploadEntries(item)[0];
    const filename = (item && (item.xlsxName || item.zipName)) || (copyrightEntry && copyrightEntry.name) || '';
    const name = buildUploadDisplayName(cached, filename, item && item.sku);
    if (name && item && item.name !== name) {
      item.name = name;
      window.setTimeout(() => {
        const queue = loadUploadQueue();
        const target = queue.find((entry) => entry.id === item.id);
        if (!target || target.name === name) return;
        target.name = name;
        state.uploadQueue = queue.map((entry) => entry.id === item.id ? target : entry);
        saveUploadQueue();
      }, 0);
    }
    return name || (item && item.name) || '';
  }

  function getMissingUploadText(item) {
    if (item && item.kind === 'copyright') return getCopyrightUploadEntries(item).length ? '\u6587\u4ef6\u5df2\u9f50' : '\u7f3a\u7248\u6743\u56fe';
    const missing = [];
    if (!item.xlsxKey) missing.push('XLSX');
    if (!item.zipKey) missing.push('ZIP');
    return '\u7f3a ' + missing.join(' + ');
  }

  function getCopyrightUploadEntries(item) {
    return Array.isArray(item && item.copyrightFiles)
      ? item.copyrightFiles.filter((entry) => entry && entry.name)
      : [];
  }

  function isUploadItemReady(item) {
    if (!item) return false;
    if (item.kind === 'toy-label') return Boolean(item.xlsxKey && item.zipKey);
    if (item.kind === 'copyright') {
      const entries = getCopyrightUploadEntries(item);
      return Boolean(entries.length && entries.every((entry) => entry.key));
    }
    return Boolean(item.xlsxKey && item.zipKey);
  }

  function removeUploadQueueItem(id) {
    const target = state.uploadQueue.find((item) => item.id === id);
    cleanupUploadFiles(target);
    state.uploadQueue = state.uploadQueue.filter((item) => item.id !== id);
    saveUploadQueue();
    renderShell();
  }

  function retryUploadQueueItem(id) {
    const latestQueue = loadUploadQueue();
    let found = false;
    state.uploadQueue = latestQueue.map((item) => {
      if (item.id !== id) return item;
      found = true;
      const ready = isUploadItemReady(item);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    showToast(L.uploadRetry + '\uff1a\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function toggleUploadSelection(id) {
    if (!id) return;
    const selected = new Set(state.uploadSelectedIds || []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    state.uploadSelectedIds = Array.from(selected);
    renderShell();
  }

  function retryUploadHistoryItem(id) {
    retryUploadHistoryItems([id]);
  }

  function retrySelectedUploads() {
    if (state.uploadView === 'history') retryUploadHistoryItems(state.uploadSelectedIds || []);
    else retryUploadQueueItems(state.uploadSelectedIds || []);
  }

  function deleteSelectedUploads() {
    if (state.uploadView === 'history') deleteUploadHistoryItems(state.uploadSelectedIds || []);
    else deleteUploadQueueItems(state.uploadSelectedIds || []);
  }

  function retryUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const now = new Date().toLocaleString();
    let changed = false;
    state.uploadQueue = loadUploadQueue().map((item) => {
      if (!idSet.has(item.id)) return item;
      changed = true;
      const ready = isUploadItemReady(item);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: now,
      };
    });
    if (!changed) return;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function deleteUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const removed = [];
    state.uploadQueue = loadUploadQueue().filter((item) => {
      if (!idSet.has(item.id)) return true;
      removed.push(item);
      return false;
    });
    removed.forEach(cleanupUploadFiles);
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u5220\u9664\u961f\u5217\u8bb0\u5f55');
  }

  function retryUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const history = loadUploadHistory();
    const targets = history.filter((item) => idSet.has(item.id));
    if (!targets.length) return;
    const queue = loadUploadQueue();
    const now = new Date().toLocaleString();
    targets.forEach((item) => {
      const ready = isUploadItemReady(item);
      queue.unshift({
        ...item,
        id: item.sku + '-retry-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: true,
        completedAt: '',
        updatedAt: now,
        createdAt: now,
      });
    });
    state.uploadQueue = queue;
    state.uploadHistory = history;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    state.uploadView = 'queue';
    renderShell();
    showToast('\u5df2\u6062\u590d\u5230\u961f\u5217' + (targets.some((item) => !isUploadItemReady(item)) ? '\uff0c\u8bf7\u8865\u5145\u6587\u4ef6' : ''));
  }

  function deleteUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    state.uploadHistory = loadUploadHistory().filter((item) => !idSet.has(item.id));
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadHistory();
    renderShell();
    showToast('\u5df2\u5220\u9664\u5386\u53f2\u8bb0\u5f55');
  }

  function startUploadQueue() {
    state.uploadRunning = true;
    saveUploadWorkerRunning(true);
    saveUploadQueue();
    state.uploadExpanded = true;
    renderShell();
    showToast(L.uploadQueueStarted);
    const workerUrl = location.origin + '/productManagementProduct?plmUploadWorker=1';
    if (!isUploadWorkerPage()) window.open(workerUrl, 'plm-upload-worker');
    else window.setTimeout(() => processUploadQueue(), 800);
  }

  function pauseUploadQueue() {
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    resetRunningUploadsToPending();
    saveUploadQueue();
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  async function finishUploadQueue() {
    await closeCancelConfigModalIfPresent();
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    moveCompletedUploadsToHistory();
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    const toyLabelManifest = loadToyLabelExportManifest();
    if (toyLabelManifest.downloaded) await clearToyLabelExportManifest(toyLabelManifest);
    else await downloadToyLabelBatchArchive();
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  function clearCurrentUploadList() {
    state.uploadClearConfirmOpen = true;
    renderShell();
  }

  function confirmClearCurrentUploadList() {
    state.uploadClearConfirmOpen = false;
    if (state.uploadView === 'history') {
      state.uploadHistory = [];
      state.uploadHistoryPage = 1;
      state.uploadSelectedIds = [];
      saveUploadHistory();
      renderShell();
      showToast('\u5386\u53f2\u8bb0\u5f55\u5df2\u6e05\u7a7a');
      return;
    }
    const queue = loadUploadQueue();
    queue.forEach(cleanupUploadFiles);
    state.uploadQueue = [];
    state.uploadPage = 1;
    state.uploadSelectedIds = [];
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    saveUploadQueue();
    renderShell();
    showToast('\u961f\u5217\u5df2\u6e05\u7a7a');
  }

  function resetRunningUploadsToPending() {
    const queue = loadUploadQueue();
    state.uploadQueue = queue.map((item) => {
      if (!/\u8fdb\u884c\u4e2d/.test(item.status || '')) return item;
      const ready = isUploadItemReady(item);
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        updatedAt: new Date().toLocaleString(),
      };
    });
  }

  function updateUploadItem(item, status, step, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    if (extra && typeof extra === 'object') Object.assign(latestItem, extra);
    latestItem.status = status || latestItem.status;
    latestItem.step = step || '';
    latestItem.updatedAt = new Date().toLocaleString();
    Object.assign(item, latestItem);
    const cleanedQueue = /\u8fdb\u884c\u4e2d/.test(latestItem.status || '')
      ? archiveOtherRunningUploads(latestQueue, latestItem)
      : latestQueue;
    state.uploadQueue = cleanedQueue.some((entry) => entry.id === item.id)
      ? cleanedQueue.map((entry) => entry.id === item.id ? latestItem : entry)
      : [latestItem].concat(cleanedQueue);
    saveUploadQueue();
    renderShell();
  }

  function getCurrentRunningUpload(queue) {
    return (queue || [])
      .filter((item) => /\u8fdb\u884c\u4e2d/.test(item.status || ''))
      .sort((a, b) => getUploadTimeMs(b) - getUploadTimeMs(a))[0] || null;
  }

  function getUploadTimeMs(item) {
    const value = item && (item.updatedAt || item.createdAt || item.completedAt);
    const ms = Date.parse(value || '');
    return Number.isFinite(ms) ? ms : 0;
  }

  function archiveOtherRunningUploads(queue, activeItem) {
    const stale = (queue || []).filter((entry) => entry.id !== activeItem.id && /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
    if (!stale.length) return queue;
    const now = new Date().toLocaleString();
    return (queue || []).map((entry) => {
      if (!stale.some((item) => item.id === entry.id)) return entry;
      if (entry.kind === 'toy-label') {
        return {
          ...entry,
          status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
          step: '\u7b49\u5f85\u5904\u7406',
          updatedAt: now,
        };
      }
      const ready = isUploadItemReady(entry);
      return {
        ...entry,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(entry),
        updatedAt: now,
      };
    });
  }

  function normalizeRunningUploadsInQueue() {
    const queue = loadUploadQueue();
    const running = queue.filter((entry) => /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
    if (running.length <= 1) return;
    const active = getCurrentRunningUpload(running);
    state.uploadQueue = archiveOtherRunningUploads(queue, active);
    saveUploadQueue();
  }

  async function prepareToyLabelBatchQueue(queue) {
    const items = (queue || []).filter((entry) => entry.kind === 'toy-label' && entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
    if (!items.length) return true;
    const skus = Array.from(new Set(items.map((item) => String(item.sku || '').toUpperCase()).filter(Boolean)));
    const signature = skus.join('|');
    await ensureToyLabelExportRun(signature);
    const prepared = state.toyLabelBatchRows || {};
    if (state.toyLabelBatchPreparedSignature === signature && skus.every((sku) => prepared[sku])) return true;
    if (!(await ensureNewProductProjectPage()) || !(await ensureDesignTaskTab())) {
      addLog('error', '玩具标签：无法进入设计任务批量搜索', skus.join(' '));
      return false;
    }
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) {
      addLog('error', '玩具标签：未找到商品编码批量搜索框', '');
      return false;
    }
    addLog('info', '玩具标签：批量搜索设计任务', skus.length + '个编码');
    setNativeInputValue(input, skus.join(' '));
    clickElement(button);
    await wait(450);
    await waitFor(() => collectToyLabelBatchRows(skus).length > 0 || (!isProjectResultLoading() && hasProjectResultEmptyState()), 12000, 180);
    await expandProjectResultPageSize(skus.length);
    await wait(350);
    const rows = collectToyLabelBatchRows(skus);
    const rowMap = {};
    rows.forEach((row) => {
      rowMap[row.sku] = row;
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const imageUrl = stripOssResizeParams(row.productImageUrl || '');
      const next = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: row.name || previous.name || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        toyLabelProductImageUrl: imageUrl || row.productImageUrl || '',
        toyLabelProductImageFallbackUrl: row.productImageUrl || imageUrl || '',
        updatedAt: previous.updatedAt || new Date().toLocaleString(),
        updatedAtMs: previous.updatedAtMs || Date.now(),
      });
      saveDataDirect(row.sku, next);
      upsertIndex(next);
    });
    state.toyLabelBatchRows = rowMap;
    state.toyLabelBatchPreparedSignature = signature;
    state.uploadQueue = loadUploadQueue().map((entry) => {
      if (entry.kind !== 'toy-label' || !rowMap[entry.sku]) return entry;
      const cached = loadData(entry.sku);
      return {
        ...entry,
        name: buildUploadDisplayName(cached, '', entry.sku),
        step: '\u5df2\u83b7\u53d6\u5546\u54c1\u56fe\u7247\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM',
        updatedAt: new Date().toLocaleString(),
      };
    });
    saveUploadQueue();
    queueCloudBackup();
    const missing = skus.filter((sku) => !rowMap[sku]);
    await prepareAndDownloadToyLabelBatch(items.filter((item) => rowMap[item.sku]), signature);
    addLog(missing.length ? 'warn' : 'success', '玩具标签：设计任务批量数据已读取', rows.length + '/' + skus.length + (missing.length ? '，未找到 ' + missing.join(' ') : ''));
    renderShell();
    return rows.length > 0;
  }

  async function prepareAndDownloadToyLabelBatch(items, signature) {
    let manifest = loadToyLabelExportManifest();
    for (const item of items || []) {
      const sku = String(item && item.sku || '').toUpperCase();
      if (!sku || manifest.files.filter((entry) => entry.sku === sku).length >= 3) continue;
      const data = normalizeData(loadData(sku) || {});
      if (!data.sku) continue;
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u751f\u6210\u6807\u7b7e\u6253\u5305\u6587\u4ef6');
      state.selectedSku = data.sku;
      state.sku = data.sku;
      state.data = data;
      state.view = 'detail';
      resetExcelState();
      const generated = await generateToyLabelFromCurrent({
        collectFiles: state.toyLabelBatchFiles,
        batchSignature: signature,
        skipExcelPrepare: true,
        skipBomUpload: true,
        batchRowOnly: true,
      });
      if (!generated) markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u6587\u4ef6\u751f\u6210\u5931\u8d25');
      else updateUploadItem(item, '\u5f85\u4e0a\u4f20', '\u5df2\u6253\u5305\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM');
      manifest = loadToyLabelExportManifest();
    }
    if (!manifest.files.length || manifest.downloaded) return;
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u56fe\u7247\u5df2\u83b7\u53d6\uff0c\u5148\u4e0b\u8f7d ZIP', manifest.files.length + '\u4e2a\u6587\u4ef6');
    await downloadToyLabelBatchArchive({ keepStagedFiles: true });
  }

  function collectToyLabelBatchRows(requestedSkus) {
    const requested = new Set((requestedSkus || []).map((sku) => String(sku || '').toUpperCase()));
    const header = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => cells.some((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, '') === '\u5546\u54c1\u56fe\u7247')) || [];
    const headerNames = header.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
    const skuIndex = headerNames.indexOf('\u5546\u54c1\u7f16\u7801');
    const brandIndex = headerNames.indexOf('\u54c1\u724c');
    const nameIndex = headerNames.indexOf('\u5546\u54c1\u540d\u79f0');
    const imageIndex = headerNames.indexOf('\u5546\u54c1\u56fe\u7247');
    if (skuIndex < 0 || imageIndex < 0) return [];
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body) return [];
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const image = cells[imageIndex] && cells[imageIndex].querySelector('img');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        brand: brandIndex >= 0 && cells[brandIndex] ? compactText(cells[brandIndex].innerText || cells[brandIndex].textContent) : '',
        name: nameIndex >= 0 && cells[nameIndex] ? compactText(cells[nameIndex].innerText || cells[nameIndex].textContent) : '',
        productImageUrl: image ? (image.currentSrc || image.src || image.getAttribute('src') || '') : '',
      };
    }).filter((row) => row.sku && requested.has(row.sku) && row.rowId && row.productImageUrl);
  }

  function isProjectResultLoading() {
    return Array.from(document.querySelectorAll('.vxe-loading--wrapper, .ant-spin-spinning, .vxe-table--loading')).some(isVisibleElement);
  }

  function hasProjectResultEmptyState() {
    return Array.from(document.querySelectorAll('.vxe-table--empty-content, .vxe-table--empty-block, .ant-empty'))
      .filter(isVisibleElement)
      .some((el) => /\u6682\u65e0\u6570\u636e|\u6682\u65e0|No Data/i.test(compactText(el.innerText || el.textContent)));
  }

  async function expandProjectResultPageSize(minimum) {
    if (Number(minimum) <= 20) return;
    const selector = Array.from(document.querySelectorAll('.ant-select-selector'))
      .filter(isVisibleElement)
      .find((el) => /\d+\s*\u6761\s*\/\s*\u9875/.test(compactText(el.innerText || el.textContent)));
    if (!selector) return;
    const current = Number((compactText(selector.innerText || selector.textContent).match(/\d+/) || [])[0]) || 20;
    if (current >= minimum) return;
    clickElement(selector);
    let options = [];
    try {
      options = await waitUntil(() => {
        const found = Array.from(document.querySelectorAll('.ant-select-item-option, [role="option"]'))
          .filter(isVisibleElement)
          .map((el) => ({ el, size: Number((compactText(el.innerText || el.textContent).match(/\d+/) || [])[0]) || 0 }))
          .filter((item) => item.size > current);
        return found.length ? found : null;
      }, 2500, 100);
    } catch (error) {
      return;
    }
    if (!options.length) return;
    options.sort((a, b) => a.size - b.size);
    const target = options.find((item) => item.size >= minimum) || options[options.length - 1];
    clickElement(target.el);
    await waitFor(() => !isProjectResultLoading(), 8000, 180);
  }

  async function processUploadQueue() {
    state.uploadRunning = loadUploadWorkerRunning();
    state.uploadQueue = loadUploadQueue();
    if (!state.uploadRunning || state.uploadProcessing) return;
    state.uploadProcessing = true;
    const attemptedTaskKeys = new Set();
    try {
      await prepareToyLabelBatchQueue(state.uploadQueue);
      while (state.uploadRunning) {
        if (await recoverPurchaseEmptyRunningUpload()) {
          state.uploadRunning = loadUploadWorkerRunning();
          state.uploadQueue = loadUploadQueue();
          continue;
        }
        const pendingItems = state.uploadQueue.filter((entry) => isUploadItemReady(entry) && !attemptedTaskKeys.has(uploadHistoryKey(entry)) && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
        const item = pendingItems.find((entry) => entry.kind === 'toy-label') || pendingItems[0];
        if (!item) {
          await finishUploadQueue();
          break;
        }
        attemptedTaskKeys.add(uploadHistoryKey(item));
        await ensureUploadPageReadyForNextItem();
        try {
          await runUploadQueueItem(item);
        } catch (error) {
          if (await recoverPurchaseEmptyRunningUpload()) {
            state.uploadRunning = loadUploadWorkerRunning();
            state.uploadQueue = loadUploadQueue();
            continue;
          }
          const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
          console.warn('PLM floating helper upload queue item failed, continue next:', error);
          markUploadQueueBlocked(item, L.uploadFailed, message);
          await closeTopProductDrawer({ skipDraftSave: true }).catch((closeError) => {
            console.warn('PLM floating helper close failed after item error:', closeError);
          });
        }
        state.uploadRunning = loadUploadWorkerRunning();
        state.uploadQueue = loadUploadQueue();
      }
    } finally {
      await closeCancelConfigModalIfPresent().catch((error) => console.warn('PLM floating helper final modal cleanup failed:', error));
      state.uploadProcessing = false;
      if (loadUploadWorkerRunning()) {
        window.setTimeout(() => processUploadQueue(), 800);
      }
    }
  }

  async function runToyLabelQueueItem(item) {
    const data = normalizeData(loadData(item && item.sku) || {});
    if (!data.sku) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u4e2d\u672a\u627e\u5230\u8be5 SKU');
      return;
    }
    if (!data.projectRowId || !(data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl || getProductThumbUrl(data))) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u8bbe\u8ba1\u4efb\u52a1\u641c\u7d22\u7ed3\u679c\u4e2d\u672a\u627e\u5230\u5546\u54c1\u56fe\u7247\u6216\u884c\u6807\u8bc6');
      return;
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4f7f\u7528\u8bbe\u8ba1\u4efb\u52a1\u5546\u54c1\u56fe\u7247');
    state.selectedSku = data.sku;
    state.sku = data.sku;
    state.data = data;
    state.view = 'detail';
    resetExcelState();
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u5df2\u6253\u5305\u7684\u6807\u7b7e\u5230 BOM');
    const stagedPreview = await getStagedToyLabelPreview(data.sku);
    let completed = false;
    if (stagedPreview) {
      try {
        await uploadToyLabelPreviewToBom(data, stagedPreview.blob, stagedPreview.filename, { batchRowOnly: true });
        completed = true;
      } catch (error) {
        console.warn('PLM floating helper staged toy label upload failed:', error);
      }
    } else {
      completed = await generateToyLabelFromCurrent({ collectFiles: state.toyLabelBatchFiles, batchSignature: state.toyLabelBatchPreparedSignature, skipExcelPrepare: true, batchRowOnly: true });
    }
    if (!completed) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6216 BOM \u4e0a\u4f20\u5931\u8d25');
      return;
    }
    archiveUploadItem(item);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\u5b8c\u6210', data.sku);
  }

  async function getStagedToyLabelPreview(sku) {
    const manifest = loadToyLabelExportManifest();
    const entry = manifest.files.find((file) => file.sku === String(sku || '').toUpperCase() && /\.jpg$/i.test(file.filename) && !/\u5370\u5237/.test(file.filename));
    if (!entry) return null;
    const blob = await getUploadFile(entry.key).catch(() => null);
    return blob ? { filename: entry.filename, blob } : null;
  }

  async function runCopyrightUploadQueueItem(item) {
    addLog('info', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const entries = getCopyrightUploadEntries(item);
    const files = [];
    for (const entry of entries) {
      const file = await getUploadFile(entry.key);
      if (!file) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u7248\u6743\u56fe\u6587\u4ef6\uff1a' + entry.name);
        return;
      }
      files.push({ entry, file });
    }
    if (!files.length) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u7248\u6743\u56fe\u6587\u4ef6');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1', { resumeUploadAfterRefresh: false });
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      throwIfUploadRetryNoticeVisible();
      for (let index = 0; index < files.length; index += 1) {
        const current = files[index];
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u7248\u6743\u56fe ' + (index + 1) + '/' + files.length);
        await uploadFileToProductField('\u7248\u6743\u56fe', current.file, current.entry.name || current.file.name);
        throwIfUploadRetryNoticeVisible();
      }
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f');
      const draftSaved = await saveProductDraftBeforeClose();
      if (!draftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' \u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f');
    } catch (error) {
      addLog('error', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + formatErrorMessage(error));
      throw error;
    }
  }

  async function runUploadQueueItem(item) {
    if (item && item.kind === 'toy-label') {
      await runToyLabelQueueItem(item);
      return;
    }
    if (item && item.kind === 'copyright') {
      await runCopyrightUploadQueueItem(item);
      return;
    }
    addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const xlsx = await getUploadFile(item.xlsxKey);
    const zip = await getUploadFile(item.zipKey);
    if (!xlsx || !zip) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u6587\u4ef6');
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u7f3a\u5c11\u6587\u4ef6', item && item.sku ? item.sku : '');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1', { resumeUploadAfterRefresh: false });
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u68c0\u67e5\u65e7\u5185\u5bb9');
      const existingSummary = getProductReplaceUploadSummary(item.sku);
      if (existingSummary.total && !item.forceReplace) {
        markUploadQueueBlocked(item, L.uploadExistingContent, '\u65e7\u5185\u5bb9\uff1a' + existingSummary.parts.join(' / '), { existingContent: existingSummary.parts.join(' / ') });
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u5df2\u6709\u5185\u5bb9', item.sku + ' ' + existingSummary.parts.join(' / '));
        showToast(item.sku + ' ' + L.uploadExistingContent + '\uff0c\u5df2\u8df3\u8fc7\uff1b\u52fe\u9009\u91cd\u8bd5\u624d\u4f1a\u6e05\u7406\u540e\u91cd\u4f20');
        await closeTopProductDrawer({ skipDraftSave: true });
        return;
      }
      if (item.forceReplace) {
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6e05\u7406\u65e7\u6587\u4ef6');
        await clearProductReplaceUploadFiles(item.sku);
      }
      if (item.forceReplace) updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u51c6\u5907\u4e0a\u4f20', { forceReplace: false });
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599');
      await uploadFileToProductField('\u63a8\u54c1\u8d44\u6599', xlsx, item.xlsxName || xlsx.name);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u56fe\u5305\u7d20\u6750');
      await uploadFileToProductField('\u56fe\u5305\u7d20\u6750', zip, item.zipName || zip.name);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6279\u91cf\u4e0a\u4f20');
      await openBatchUploadDialog();
      await uploadBatchZip(zip, item.zipName || zip.name);
      await matchBatchUploadForm();
      await confirmBatchUpload();
      await verifyBatchImagesUploaded(item.sku);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f');
      const preReviewDraftSaved = await saveProductDraftBeforeClose();
      if (!preReviewDraftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' ' + L.uploadSuccess);
    } catch (error) {
      console.warn('PLM floating helper upload queue failed:', error);
      if (isUploadRetryRefreshError(error) || findUploadRetryNotice()) {
        await refreshPageAndRetryUploadItem(item);
        return;
      }
      if (error && /产品信息开品中|不能编辑/.test(error.message || '')) {
        markUploadQueueBlocked(item, '\u5df2\u8df3\u8fc7', '\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d', item.sku);
        showToast(item.sku + ' \u5df2\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u4ea7\u54c1\u5df2\u505c\u7528|\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u4ea7\u54c1\u5df2\u505c\u7528');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u4ea7\u54c1\u5df2\u505c\u7528', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u4ea7\u54c1\u5df2\u505c\u7528');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        await closeTopProductDrawer({ skipDraftSave: true });
        return;
      }
      const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
      markUploadQueueBlocked(item, L.uploadFailed, message);
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + message);
      showToast(item.sku + ' ' + L.uploadFailed + '\uff1a' + message);
      try {
        await closeTopProductDrawer();
      } catch (closeError) {
        console.warn('PLM floating helper close after upload failure failed:', closeError);
        state.uploadRunning = false;
        saveUploadWorkerRunning(false);
        markUploadQueueBlocked(item, L.uploadFailed, message + '\uff1b\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + (closeError && closeError.message ? closeError.message : '\u672a\u77e5\u9519\u8bef'));
        showToast('\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c\uff0c\u8bf7\u624b\u52a8\u5904\u7406\u5f39\u7a97');
        throw closeError;
      }
    }
  }

  async function ensureUploadPageReadyForNextItem() {
    assertNoReviewConfirmModal();
    if (!getVisibleModal() && !getOpenProductDrawer()) return;
    await closeTopProductDrawer({ skipDraftSave: true });
    if (getVisibleModal() || getOpenProductDrawer()) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(false);
      throw new Error('\u5f53\u524d\u5f39\u7a97\u6216\u5546\u54c1\u9875\u672a\u5173\u95ed\uff0c\u5df2\u6682\u505c\u4e0a\u4f20\u961f\u5217');
    }
  }

  async function recoverPurchaseEmptyRunningUpload() {
    if (!findPurchaseInfoEmptyError()) return false;
    const queue = loadUploadQueue();
    const running = getCurrentRunningUpload(queue);
    if (!running) return false;
    markUploadQueueBlocked(running, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', running.sku || '');
    await closeTopProductDrawer({ skipDraftSave: true });
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    showToast(running.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    return true;
  }

  async function ensureProductManagementPage() {
    if (!/\/productManagementProduct/.test(location.pathname)) {
      location.href = location.origin + '/productManagementProduct?plmUploadWorker=1';
      await waitUntil(() => /\/productManagementProduct/.test(location.pathname), 15000, 300);
    }
    await waitUntil(() => document.body && document.body.innerText.includes('\u5546\u54c1\u7ba1\u7406'), 20000, 300);
  }

  async function searchProductManagementSku(sku) {
    const input = findProductSearchInput();
    if (!input) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u641c\u7d22\u6846');
    setNativeInputValue(input, sku);
    const button = findVisibleButton('\u67e5\u8be2');
    if (!button) throw new Error('\u672a\u627e\u5230\u67e5\u8be2\u6309\u94ae');
    button.click();
    await waitUntil(() => findProductRowIdBySku(sku), 20000, 500);
  }

  function findProductSearchInput() {
    const roots = Array.from(document.querySelectorAll('.searchForm, .queryForm, .ant-form, .vxe-toolbar, .el-form, form, body')).filter(isVisibleElement);
    const inputs = Array.from(new Set(roots.flatMap((root) => Array.from(root.querySelectorAll('input')).filter(isVisibleElement))));
    const byPlaceholder = (patterns) => inputs.find((input) => {
      const text = compactText(input.getAttribute('placeholder') || input.placeholder || '');
      return patterns.some((pattern) => pattern.test(text));
    }) || null;
    const exactProductCode = byPlaceholder([/^\s*商品编码(?:\/|$|[\s，,、])/i, /^\s*商品编码/i]);
    if (exactProductCode) return exactProductCode;
    const labelMatched = inputs.find((input) => {
      const item = input.closest('.ant-form-item, .el-form-item, .vxe-form--item, .form-item, div');
      const text = compactText((item && (item.innerText || item.textContent)) || '');
      return /商品编码/.test(text) && !/商品名称|产品名称/.test(text.replace(/商品编码/g, ''));
    });
    if (labelMatched) return labelMatched;
    return byPlaceholder([/SKU/i]) || null;
  }

  function findProductRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid], .ant-table-row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  async function openProductEditDrawer(sku) {
    if (getProductEditDrawerForSku(sku)) return;
    const rowId = findProductRowIdBySku(sku);
    if (!rowId) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u884c');
    const row = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((el) => Array.from(el.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u7f16\u8f91'));
    const button = row && Array.from(row.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u7f16\u8f91');
    if (!button) throw new Error('\u672a\u627e\u5230\u7f16\u8f91\u6309\u94ae');
    if (button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|\bis-disabled\b|ant-btn-disabled/.test(button.className || '')) {
      throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
    }
    button.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 20000) {
      const drawer = getProductEditDrawerForSku(sku);
      if (drawer) return;
      if (getVisibleText(document.body).includes('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91')) {
        throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
      }
      await wait(300);
    }
    throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
  }

  function getProductEditDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .find((drawer) => /\u7f16\u8f91\u5546\u54c1/.test(getVisibleText(drawer)) && (!sku || getVisibleText(drawer).includes(sku))) || null;
  }

  async function enterProductEditSecondStep(sku) {
    const drawer = getProductEditDrawerForSku(sku);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    if (getVisibleText(drawer).includes('\u63a8\u54c1\u8d44\u6599')) return;
    await waitUntil(() => isProductCategoryReady(getProductEditDrawerForSku(sku)), 30000, 500);
    const readyDrawer = getProductEditDrawerForSku(sku);
    const button = readyDrawer && Array.from(readyDrawer.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u4e0b\u4e00\u6b65');
    if (!button) throw new Error('\u672a\u627e\u5230\u4e0b\u4e00\u6b65');
    button.click();
    await waitUntil(() => {
      const nextDrawer = getProductEditDrawerForSku(sku);
      return nextDrawer && getVisibleText(nextDrawer).includes('\u63a8\u54c1\u8d44\u6599');
    }, 30000, 500);
  }

  function isProductCategoryReady(drawer) {
    if (!drawer) return false;
    const item = getScopedProductFormItem(drawer, '\u7c7b\u76ee');
    if (!item) return false;
    const text = compactText(item.innerText || item.textContent);
    const value = text.replace(/^\u7c7b\u76ee[*\uff1a:\s]*/, '').trim();
    const html = item.innerHTML || '';
    if (!value || /\u8bf7\u9009\u62e9|--/.test(value)) return false;
    if (/\u52a0\u8f7d|loading|ant-spin|ant-select-loading/.test(text + html)) return false;
    return true;
  }

  function getScopedProductFormItem(scope, labelText) {
    const labels = Array.from(scope.querySelectorAll('.ant-form-item-label label'));
    const normalizeLabel = (el) => compactText(el.innerText || el.textContent).replace(/[*\uff1a:]/g, '').trim();
    const label = labels.find((el) => normalizeLabel(el) === labelText) ||
      labels.find((el) => {
        const text = normalizeLabel(el);
        return text === labelText || text.startsWith(labelText + ' ') || text.startsWith(labelText + '\u3000');
      });
    if (label) return label.closest('.ant-form-item');
    if (labelText === '\u7248\u6743\u56fe') {
      const stableField = scope.querySelector('[id="351"], input[id*="attr_group_408_0_attr_language_config_json_0_value"]');
      return stableField ? stableField.closest('.ant-form-item') : null;
    }
    return null;
  }

  async function uploadFileToProductField(labelText, file, filename) {
    const item = getProductFormItem(labelText);
    if (!item) throw new Error('\u672a\u627e\u5230' + labelText);
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    await putFileIntoUploadItem(item, file, filename);
    await waitUploadItemDone(item, filename, 180000);
  }

  async function clearProductReplaceUploadFiles(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    let removedCount = 0;
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      item.scrollIntoView({ block: 'center', inline: 'nearest' });
      await wait(180);
      removedCount += await clearUploadFilesInFormItem(item, labelText);
    }
    if (removedCount) await wait(500);
  }

  function getProductReplaceUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function verifyBatchImagesUploaded(sku) {
    await waitUntil(() => {
      const summary = getBatchImageUploadSummary(sku);
      return summary.total > 0 ? summary : null;
    }, 30000, 500).catch(() => null);
    const summary = getBatchImageUploadSummary(sku);
    if (summary.total <= 0) {
      throw new Error('\u6279\u91cf\u4e0a\u4f20\u540e\u672a\u68c0\u6d4b\u5230\u4e3b\u56fe/\u8be6\u60c5\u56fe/SKU\u56fe');
    }
  }

  function getBatchImageUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_BATCH_IMAGE_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function clearUploadFilesInFormItem(item, labelText) {
    let removed = 0;
    for (let round = 0; round < 12; round += 1) {
      const fileNodes = getExistingUploadFileNodes(item);
      if (!fileNodes.length) break;
      const before = fileNodes.length;
      const fileNode = fileNodes[0];
      const deleteTarget = findUploadDeleteTarget(fileNode);
      if (!deleteTarget) {
        throw new Error(labelText + '\u65e7\u6587\u4ef6\u65e0\u6cd5\u5220\u9664');
      }
      revealUploadActions(fileNode);
      await wait(80);
      clickElement(deleteTarget);
      await confirmUploadDeleteIfNeeded();
      await waitUntil(() => getExistingUploadFileNodes(item).length < before, 10000, 250);
      removed += 1;
    }
    if (getExistingUploadFileNodes(item).length) {
      throw new Error(labelText + '\u65e7\u6587\u4ef6\u672a\u6e05\u7a7a');
    }
    return removed;
  }

  function getExistingUploadFileNodes(item) {
    return Array.from(item.querySelectorAll('.filePreviewCard, .ant-upload-list-item, .ant-upload-list-picture-card-container, .ant-upload-list-text-container'))
      .filter(isVisibleElement)
      .filter((node) => !/ant-upload-list-item-uploading/.test(node.className || ''))
      .filter((node) => {
        const text = getVisibleText(node);
        const html = node.innerHTML || '';
        return /filePreviewCard|ant-upload-list-item|ant-upload-list-picture-card-container|ant-upload-list-text-container/.test(node.className || '') &&
          (/\u9884\u89c8|anticon-delete|delBtnIcon|ant-upload-list-item-name|ant-upload-list-item-card-actions/.test(text + html));
      });
  }

  function revealUploadActions(node) {
    if (!node) return;
    node.classList.add('pfh-force-upload-actions');
    node.querySelectorAll('.downloadBtn').forEach((el) => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
    ['mouseenter', 'mouseover', 'mousemove'].forEach((type) => {
      dispatchDomEvent(node, type);
    });
  }

  function findUploadDeleteTarget(node) {
    const selectors = [
      '.delBtnIcon',
      '.anticon-delete.delBtnIcon',
      '.ant-upload-list-item-actions .anticon-delete',
      '.ant-upload-list-item-actions [aria-label*="delete" i]',
      '.ant-upload-list-item-actions [aria-label*="\u5220\u9664"]',
      '.ant-upload-list-item-actions [title*="\u5220\u9664"]',
      '.ant-upload-list-item-actions button',
      '.ant-upload-list-item-card-actions .anticon-delete',
      '.anticon-delete',
      '[aria-label*="delete" i]',
      '[aria-label*="\u5220\u9664"]',
      '[title*="\u5220\u9664"]',
    ];
    for (const selector of selectors) {
      const target = node.querySelector(selector);
      if (target) return getClickableElement(target);
    }
    const candidates = Array.from(node.querySelectorAll('button, span, i, svg, a')).filter((el) => {
      const text = compactText(el.innerText || el.textContent || '');
      const meta = [el.className || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || ''].join(' ');
      return /\u5220\u9664|delete|remove|trash|close/i.test(text + ' ' + meta);
    });
    return candidates.length ? getClickableElement(candidates[0]) : null;
  }

  function getClickableElement(el) {
    return el && (el.closest('button, a, [role="button"], .downloadBtn, .ant-upload-list-item-card-actions-btn, .anticon-delete') || el);
  }

  function clickElement(el) {
    if (!el) return;
    if (typeof el.click === 'function') {
      el.click();
      return;
    }
    dispatchDomEvent(el, 'click');
  }

  function dispatchDomEvent(el, type) {
    if (!el) return false;
    try {
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      return true;
    } catch (error) {
      if (type === 'click' && typeof el.click === 'function') {
        el.click();
        return true;
      }
      console.warn('PLM floating helper dispatch event failed:', type, error);
      return false;
    }
  }

  async function confirmUploadDeleteIfNeeded() {
    await wait(250);
    const popup = Array.from(document.querySelectorAll('.ant-popover, .ant-modal'))
      .filter(isVisibleElement)
      .reverse()
      .find((el) => /\u5220\u9664|\u786e\u5b9a|\u786e\u8ba4/.test(getVisibleText(el)));
    if (!popup) return;
    const button = Array.from(popup.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => /\u786e\u5b9a|\u786e\u8ba4|OK/i.test(compactText(el.innerText || el.textContent)));
    if (button) {
      button.click();
      await wait(250);
    }
  }

  function getProductFormItem(labelText) {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, labelText);
  }

  async function putFileIntoUploadItem(item, file, filename) {
    const input = item.querySelector('input[type="file"]');
    if (!input) throw new Error('\u672a\u627e\u5230\u4e0a\u4f20\u63a7\u4ef6');
    const mime = (file && file.type && /^image\//.test(file.type)) ? file.type : guessMime(filename);
    const uploadFile = file instanceof File ? file : new File([file], filename, { type: mime });
    const namedFile = uploadFile.name === filename && uploadFile.type ? uploadFile : new File([uploadFile], filename, { type: uploadFile.type || mime, lastModified: uploadFile.lastModified || Date.now() });
    const dt = new DataTransfer();
    dt.items.add(namedFile);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitUploadItemDone(item, filename, timeout) {
    const base = String(filename || '').replace(/^.*[\\\/]/, '');
    let failureSeenAt = 0;
    await waitUntil(() => {
      const html = item.innerHTML || '';
      const text = getVisibleText(item);
      throwIfUploadRetryNoticeVisible();
      if (/\u4e0a\u4f20\u5931\u8d25|ant-upload-list-item-error/.test(html + text)) {
        if (!failureSeenAt) failureSeenAt = Date.now();
        if (Date.now() - failureSeenAt < 1800) return false;
        throw new Error('\u4e0a\u4f20\u5931\u8d25');
      }
      return !/ant-progress|uploading|\u4e0a\u4f20\u4e2d/.test(html + text) && (text.includes('\u9884\u89c8') || text.includes(base) || /ant-upload-list-item-done/.test(html));
    }, timeout || 120000, 800);
  }

  async function openBatchUploadDialog() {
    const button = findBatchUploadEntryButton();
    if (!button) throw new Error('\u672a\u627e\u5230\u6279\u91cf\u4e0a\u4f20\u5165\u53e3');
    button.click();
    await waitUntil(() => getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u6587\u4ef6') && getVisibleModal(), 30000, 500);
  }

  function findBatchUploadEntryButton() {
    const bottomRightFloat = Array.from(document.querySelectorAll('.ant-float-btn'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.right > window.innerWidth - 80 && rect.bottom > window.innerHeight - 80)
      .find(({ el, rect }) => isElementTopmostAtCenter(el, rect));
    if (bottomRightFloat) return bottomRightFloat.el;

    const candidates = Array.from(document.querySelectorAll('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.left > window.innerWidth - 180 && rect.top > window.innerHeight - 180);
    return candidates.find(({ el, rect }) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const top = document.elementFromPoint(x, y);
      return top && (top === el || el.contains(top) || top.closest('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right') === el || top.closest('.ant-float-btn'));
    })?.el || null;
  }

  function isElementTopmostAtCenter(el, rect) {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (top === el || el.contains(top) || top.closest('.ant-float-btn') === el));
  }

  async function uploadBatchZip(file, filename) {
    const modal = getVisibleModal();
    if (!modal) throw new Error('\u672a\u6253\u5f00\u6279\u91cf\u4e0a\u4f20\u7a97\u53e3');
    await putFileIntoUploadItem(modal, file, filename);
    await waitUploadItemDone(modal, filename, 180000);
  }

  async function matchBatchUploadForm() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u5339\u914d\u8868\u5355');
    if (!button) throw new Error('\u672a\u627e\u5230\u5339\u914d\u8868\u5355');
    button.click();
    await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (isBatchUploadMappingErrorText(text)) throw new Error('\u56fe\u5305ZIP\u5185\u90e8\u6587\u4ef6\u5206\u7ec4\u4e0d\u6b63\u786e');
      return text.includes('\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    }, 30000, 200);
  }

  function isBatchUploadMappingErrorText(text) {
    return /\u672a\u5728\u8868\u5355\u4e2d\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u672a\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u8868\u5355.*\u5339\u914d.*\u5c5e\u6027/.test(String(text || ''));
  }

  async function confirmBatchUpload() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    if (!button) throw new Error('\u672a\u627e\u5230\u5f00\u59cb\u4e0a\u4f20');
    button.click();
    await waitUntil(() => !getVisibleModal() || getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u5b8c\u6210'), 240000, 1000);
    await wait(1500);
  }

  async function submitProductReview() {
    const reviewResult = await clickReviewAndWaitConfirm();
    if (reviewResult === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (reviewResult === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    if (reviewResult === 'minimum-order') {
      const filled = await fillMinimumOrderQuantityIfNeeded();
      if (!filled) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
      const retryResult = await clickReviewAndWaitConfirm();
      if (retryResult === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
      if (retryResult === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
      if (retryResult !== 'confirm') throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    }
    if (findProductDisabledError()) throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    if (!getVisibleModal()) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    const confirm = await waitUntil(() => findReviewConfirmButton(), 30000, 200);
    if (!confirm) throw new Error('\u672a\u627e\u5230\u786e\u8ba4\u63d0\u5ba1');
    confirm.click();
    const result = await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (text.includes('\u4ea7\u54c1\u63d0\u5ba1\u6210\u529f') || text.includes('\u63d0\u5ba1\u6210\u529f')) {
        return isReviewConfirmModal(getVisibleModal()) ? '' : 'success';
      }
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      return '';
    }, 120000, 200);
    if (result === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (result === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
  }

  function findReviewConfirmButton() {
    const modal = getVisibleModal();
    if (!modal) return null;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => {
      const text = compactText(el.innerText || el.textContent).replace(/\s+/g, '');
      const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(el.className || '');
      return text === '\u63d0\u5ba1' && !disabled;
    }) || null;
  }

  async function clickReviewAndWaitConfirm() {
    const button = await waitUntil(() => findProductReviewButton(), 60000, 800);
    if (!button) throw new Error('\u672a\u627e\u5230\u63d0\u5ba1\u6309\u94ae');
    button.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 8000) {
      const modal = getVisibleModal();
      if (isReviewConfirmModal(modal)) return 'confirm';
      if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      await wait(80);
    }
    if (findPurchaseInfoEmptyError()) return 'purchase-empty';
    if (findProductDisabledError()) return 'disabled';
    if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
    if (findReviewConfirmButton()) return 'confirm';
    return '';
  }

  function findProductReviewButton() {
    return findProductDrawerActionButton('\u63d0\u5ba1');
  }

  async function fillMinimumOrderQuantityIfNeeded() {
    const item = findMinimumOrderQuantityErrorItem();
    if (!item) return false;
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    if (!input) return false;
    setNativeInputValue(input, '1000');
    await wait(300);
    return true;
  }

  function findMinimumOrderQuantityItem() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, '\u6700\u5c0f\u8d77\u8ba2\u91cf');
  }

  function findMinimumOrderQuantityErrorItem() {
    const item = findMinimumOrderQuantityItem();
    if (!item) return null;
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    const value = input ? compactText(input.value || '') : '';
    const text = getVisibleText(item);
    const hasError = /\u8bf7\u8f93\u5165\u6700\u5c0f\u8d77\u8ba2\u91cf|ant-form-item-has-error|ant-form-item-explain-error/.test(text + ' ' + (item.className || '') + ' ' + (item.innerHTML || ''));
    return hasError && !value ? item : null;
  }

  function findPurchaseInfoEmptyError() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const scope = drawer || document.body;
    const text = getNodeText(scope);
    if (/\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(text)) return true;
    const errorRoot = drawer || document;
    const errorNodes = Array.from(errorRoot.querySelectorAll('.ant-form-item-explain-error, .ant-form-item-has-error, [role="alert"], .ant-message-notice, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID));
    if (errorNodes.some((node) => /\u91c7\u8d2d\u4fe1\u606f|\u4e0d\u53ef\u4e3a\u7a7a/.test(getNodeText(node) + ' ' + (node.className || '') + ' ' + (node.innerHTML || '')))) return true;
    const purchaseTitle = Array.from(scope.querySelectorAll('.ant-form-item-label label, .ant-collapse-header, .ant-anchor-link-title, [title]')).find((node) => compactText(node.innerText || node.textContent || node.getAttribute('title')) === '\u91c7\u8d2d\u4fe1\u606f');
    const purchaseSection = purchaseTitle && (purchaseTitle.closest('.ant-form-item') || purchaseTitle.parentElement);
    if (purchaseSection && /ant-form-item-has-error|ant-form-item-explain-error|\u4e0d\u53ef\u4e3a\u7a7a/.test((purchaseSection.className || '') + ' ' + (purchaseSection.innerHTML || ''))) return true;
    return false;
  }

  function findProductDisabledError() {
    const text = getVisibleText(document.body);
    return /\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528|\u5f53\u524d\u4ea7\u54c1\u5df2\u505c\u7528|\u4ea7\u54c1\u5df2\u505c\u7528/.test(text);
  }

  async function saveProductDraftBeforeClose() {
    const saveDraft = findSaveDraftButton();
    if (!saveDraft) throw new Error('\u672a\u627e\u5230\u4fdd\u5b58\u8349\u7a3f\u6309\u94ae');
    saveDraft.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    saveDraft.click();
    const result = await waitUntil(() => {
      const text = getNodeText(document.body);
      const plmNoticeText = getPlmNoticeText();
      if (/\u8349\u7a3f\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u6210\u529f|\u8349\u7a3f.*\u4fdd\u5b58.*\u6210\u529f|\u4fdd\u5b58\u6210\u529f/.test(text)) return 'saved';
      if (/\u8349\u672a\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u5931\u8d25|\u8349\u7a3f.*\u4fdd\u5b58.*\u5931\u8d25/.test(plmNoticeText)) return 'failed';
      if (findPurchaseInfoEmptyError()) return '';
      return '';
    }, 8000, 100).catch(() => '');
    return result === 'saved';
  }

  function findSaveDraftButton() {
    const bottomButton = findProductDrawerActionButton('\u4fdd\u5b58\u8349\u7a3f');
    if (bottomButton) return bottomButton;
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => getNodeText(drawer).includes('\u7f16\u8f91\u5546\u54c1'));
    for (const drawer of drawers.reverse()) {
      const button = Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f');
      if (button) return button;
    }
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f') || null;
  }

  function findProductDrawerActionButton(text) {
    const normalizedText = compactText(text).replace(/\s+/g, '');
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => getNodeText(drawer).includes('\u7f16\u8f91\u5546\u54c1'));
    const candidates = drawers.flatMap((drawer) => {
      const drawerRect = drawer.getBoundingClientRect();
      return Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .filter(isActionButtonReady)
        .filter((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === normalizedText)
        .map((button) => ({ button, rect: button.getBoundingClientRect(), drawerRect }));
    }).filter(({ rect, drawerRect }) => rect.width > 0 && rect.height > 0 && rect.top >= drawerRect.top && rect.bottom <= drawerRect.bottom + 2);
    candidates.sort((a, b) => b.rect.top - a.rect.top || b.rect.left - a.rect.left);
    return candidates[0] ? candidates[0].button : null;
  }

  function isActionButtonReady(button) {
    return Boolean(button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' && !/\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(button.className || ''));
  }

  function getPlmNoticeText() {
    return Array.from(document.querySelectorAll('.ant-message, .ant-message-notice, .ant-notification, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID))
      .map((node) => getNodeText(node))
      .join('\n');
  }

  async function saveDraftThenClosePurchaseEmptyProduct() {
    if (!findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    const existingModal = getVisibleModal();
    if (existingModal) {
      if (isCancelConfigModal(existingModal)) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
        await waitUntil(() => findPurchaseInfoEmptyError(), 5000, 100);
      } else {
        closeVisibleModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      }
    }
    const saved = await saveProductDraftBeforeClose();
    if (!saved) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(false);
      throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f\uff0c\u5df2\u6682\u505c');
    }
    const running = getCurrentRunningUpload(loadUploadQueue());
    if (running) updateUploadItem(running, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u9875\u5173\u95ed\u6309\u94ae');
    close.click();
    const modal = await waitUntil(() => {
      const topModal = getVisibleModal();
      return topModal && isCancelConfigModal(topModal) ? topModal : null;
    }, 10000, 100);
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal() && !getOpenProductDrawer(), 10000, 100);
    return { draftSaved: true };
  }

  async function closeTopProductDrawer(options) {
    const result = { draftSaved: false };
    if (!(options && options.allowReviewResultModal)) assertNoReviewConfirmModal();
    if (options && options.allowReviewResultModal && isReviewConfirmModal(getVisibleModal())) {
      await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
    }
    const existingModal = getVisibleModal();
    if (existingModal && isCancelConfigModal(existingModal)) {
      if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      } else {
        confirmCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
        return result;
      }
    } else if (existingModal) {
      closeVisibleModal(existingModal);
      await waitUntil(() => !getVisibleModal(), 10000, 100);
    }
    if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
      const saved = await saveProductDraftBeforeClose().catch((error) => {
        console.warn('PLM floating helper save draft before close failed:', error);
        return false;
      });
      result.draftSaved = saved;
      if (!saved) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) return result;
    close.click();
    await waitUntil(() => {
      const topModal = getVisibleModal();
      if (topModal) {
        if (isReviewConfirmModal(topModal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5546\u54c1\u9875');
        if (isCancelConfigModal(topModal)) {
          confirmCancelConfigModal(topModal);
          return false;
        }
        closeVisibleModal(topModal);
        return false;
      }
      const topDrawer = getOpenProductDrawer();
      return !topDrawer;
    }, 10000, 100);
    return result;
  }

  function closeVisibleModal(modal) {
    if (!modal) return false;
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5f39\u7a97');
    const close = Array.from(modal.querySelectorAll('button, .ant-modal-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        return text === '\u53d6\u6d88' || /\u5173\u95ed|close|ant-modal-close/i.test(signature);
      });
    if (!close) throw new Error('\u672a\u627e\u5230\u5173\u95ed\u5f39\u7a97\u6309\u94ae');
    close.click();
    return true;
  }

  function confirmCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    if (!modal || !isCancelConfigModal(modal)) return false;
    const confirm = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u786e\u5b9a');
    if (!confirm) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u786e\u5b9a\u6309\u94ae');
    confirm.click();
    return true;
  }

  async function closeCancelConfigModalIfPresent() {
    assertNoReviewConfirmModal();
    const modal = getVisibleModal();
    if (!modal || !isCancelConfigModal(modal)) return false;
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal(), 10000, 100);
    return true;
  }

  function cancelCancelConfigModal(modal) {
    if (!modal || !isCancelConfigModal(modal)) return false;
    const cancel = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u53d6\u6d88');
    if (!cancel) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u53d6\u6d88\u6309\u94ae');
    cancel.click();
    return true;
  }

  function isCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    return /\u5f53\u524d\u7c7b\u76ee\u5c5e\u6027\u4fe1\u606f\u672a\u4fdd\u5b58|\u662f\u5426\u786e\u8ba4\u53d6\u6d88\u914d\u7f6e/.test(modalText);
  }

  function isReviewConfirmModal(modal) {
    if (!modal || !isVisibleElement(modal)) return false;
    const text = getVisibleText(modal).replace(/\s+/g, '');
    if (/提审成功|产品提审成功|成功/.test(text)) return false;
    if (!/确定提交审批吗|确认提交审批|提交审批吗/.test(text)) return false;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).some((button) => {
      const buttonText = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
      const className = String(button.className || '');
      const disabled = button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(className);
      return buttonText === '\u63d0\u5ba1' && !disabled;
    });
  }

  function assertNoReviewConfirmModal() {
    const modal = getVisibleModal();
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u6216\u5207\u6362\u4e0b\u4e00\u4e2a\u7f16\u7801');
  }

  function findDrawerCloseButton(drawer) {
    if (!drawer) return null;
    const drawerRect = drawer.getBoundingClientRect();
    return Array.from(drawer.querySelectorAll('button, .ant-drawer-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent);
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        if (/\u5173\u95ed|close|ant-drawer-close/i.test(signature)) return true;
        const rect = button.getBoundingClientRect();
        const nearDrawerLeftTop = rect.top <= drawerRect.top + 80 && rect.left <= drawerRect.left + 120 && !text;
        const nearDrawerRightTop = rect.top <= drawerRect.top + 80 && rect.right >= drawerRect.right - 100 && !text;
        return nearDrawerLeftTop || nearDrawerRightTop;
      }) || null;
  }

  function getVisibleModal() {
    return Array.from(document.querySelectorAll('.ant-modal')).filter(isVisibleElement).pop() || null;
  }

  function getOpenProductDrawer() {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open'))
      .filter(isVisibleElement)
      .find((drawer) => getVisibleText(drawer).includes('\u7f16\u8f91\u5546\u54c1')) || null;
  }

  function findVisibleButton(text) {
    return Array.from(document.querySelectorAll('button')).filter(isVisibleElement).find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  async function waitUntil(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval || 200);
    }
    throw new Error('\u7b49\u5f85\u8d85\u65f6');
  }

  function guessMime(filename) {
    const lower = String(filename || '').toLowerCase();
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.rar')) return 'application/vnd.rar';
    return 'application/octet-stream';
  }

  function uploadFileKey(sku, kind) {
    return String(sku || '') + ':' + String(kind || '');
  }

  function runSearch(targetView) {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = normalizeSearchInput(input.value);
    state.searchQuery = input ? input.value.trim() : '';
    state.skuPage = 1;
    updateSearchClear();
    const matches = parseSearchTokens(state.searchQuery).length ? getSearchMatches(state.searchQuery) : [];
    if (matches.length) {
      const target = matches[0];
      const data = loadData(target.sku);
      state.selectedSku = target.sku;
      state.data = data ? normalizeData(data) : null;
      state.view = targetView === 'sizeImage' ? 'sizeImage' : 'detail';
      resetExcelState();
    }
    expandPanel();
    renderShell();
  }

  function clearSearch() {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    state.skuPage = 1;
    updateSearchClear();
    expandPanel();
    renderShell();
  }

  function updateSearchClear() {
    const panel = ensurePanel();
    const input = panel.querySelector('.pfh-search-input');
    const clear = panel.querySelector('.pfh-search-clear');
    if (!clear) return;
    clear.classList.toggle('is-visible', Boolean(input && input.value));
  }

  async function openSelectedProjectDetail() {
    if (state.openingProjectDetail) {
      showToast(L.openingDetail);
      return;
    }
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const sku = data && data.sku;
    if (!sku) {
      showToast(L.excelNeedData);
      return;
    }
    state.ignoreOutsideClickUntil = Date.now() + 2500;
    showProjectDetailOpeningFeedback(sku, data);
    showToast(L.openingDetail);
    try {
      if (!(await ensureNewProductProjectPage())) throw new Error('new product project page not ready');
      let rowId = data.projectRowId || data.projectId || '';
      if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
        cacheProjectRowId(sku, rowId);
        adoptOpenedProjectDrawer(sku);
        showToast(L.openDetailDone);
        return;
      }

      rowId = await queryProjectRowIdBySku(sku);
      if (!rowId || !(await clickProjectDetailByRowId(rowId, sku))) throw new Error('detail button not found');
      cacheProjectRowId(sku, rowId);
      adoptOpenedProjectDrawer(sku);
      showToast(L.openDetailDone);
    } catch (error) {
      console.warn('PLM floating helper open detail failed:', error);
      showToast(L.openDetailFailed);
    } finally {
      state.openingProjectDetail = false;
      if (state.selectedSku === sku) renderShell(state.scanRunning ? L.scanning : '');
      window.setTimeout(() => {
        if (state.openingProjectDetailSku === sku) state.openingProjectDetailSku = '';
      }, 1000);
    }
  }

  async function openFirstCachedDetail() {
    const first = state.index[0] && state.index[0].sku ? state.index[0].sku : '';
    if (!first) {
      showToast(L.emptyList);
      return;
    }
    const data = normalizeData(loadData(first) || state.index[0]);
    state.selectedSku = first;
    state.data = data;
    state.view = 'detail';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
  }

  function findUploadRetryNotice() {
    return Array.from(document.querySelectorAll('.ant-notification-notice, .ant-notification'))
      .filter(isVisibleElement)
      .find((node) => /\u5b58\u5728\s*\u9700\u8981\u91cd\u8bd5\u6587\u4ef6/.test(compactText(node.innerText || node.textContent || ''))) || null;
  }

  function throwIfUploadRetryNoticeVisible() {
    if (!findUploadRetryNotice()) return;
    const error = new Error('\u5b58\u5728\u9700\u8981\u91cd\u8bd5\u6587\u4ef6');
    error.code = 'PFH_UPLOAD_REFRESH_RETRY';
    throw error;
  }

  function isUploadRetryRefreshError(error) {
    return Boolean(error && (error.code === 'PFH_UPLOAD_REFRESH_RETRY' || /\u5b58\u5728\s*\u9700\u8981\u91cd\u8bd5\u6587\u4ef6/.test(error.message || '')));
  }

  async function refreshPageAndRetryUploadItem(item) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const retryCount = Math.max(0, Number(latestItem.uploadPageRefreshRetryCount) || 0) + 1;
    if (retryCount > 3) {
      const reason = '\u8fde\u7eed\u5237\u65b0 3 \u6b21\u4ecd\u63d0\u793a\u5b58\u5728\u9700\u8981\u91cd\u8bd5\u6587\u4ef6';
      markUploadQueueBlocked(item, L.uploadFailed, reason, { uploadPageRefreshRetryCount: retryCount });
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u81ea\u52a8\u6062\u590d\u5931\u8d25', (item.sku || '') + ' ' + reason);
      showToast((item.sku || '') + ' ' + reason);
      return;
    }
    updateUploadItem(item, '\u5f85\u4e0a\u4f20', '\u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u5237\u65b0\u540e\u91cd\u65b0\u641c\u7d22\u4e0a\u4f20', {
      forceReplace: true,
      resumeUploadAfterRefresh: true,
      uploadPageRefreshRetryCount: retryCount,
    });
    state.uploadRunning = true;
    saveUploadWorkerRunning(true);
    addLog('warn', '\u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u5237\u65b0\u540e\u91cd\u8bd5\u7f16\u7801', (item.sku || '') + ' (' + retryCount + '/3)');
    showToast((item.sku || '') + ' \u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u6b63\u5728\u5237\u65b0\u9875\u9762\u91cd\u65b0\u4e0a\u4f20');
    await wait(120);
    const refreshUrl = new URL(window.location.href);
    refreshUrl.pathname = '/productManagementProduct';
    refreshUrl.searchParams.set('plmUploadWorker', '1');
    window.location.replace(refreshUrl.toString());
    await new Promise(() => {});
  }

  function pinCurrentSearchResults() {
    const matches = getSearchMatches(state.searchQuery);
    if (!matches.length) return;
    matches.forEach((match, index) => {
      const item = state.index.find((entry) => entry.sku === match.sku);
      if (!item) return;
      item.pinned = true;
      // Reserve the very top slots for this batch while retaining result order.
      item.pinOrder = index + 1;
    });
    saveIndex();
    state.skuPage = 1;
    showToast('已置顶 ' + matches.length + ' 个编码');
    renderShell();
  }

  function adoptOpenedProjectDrawer(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return;
    const switchingSku = Boolean(state.selectedSku && state.selectedSku !== sku);
    state.drawer = drawer;
    state.sku = sku;
    state.selectedSku = sku;
    const cached = loadData(sku);
    if (cached) state.data = normalizeData(cached);
    else if (!state.data || state.data.sku !== sku) state.data = normalizeData({ sku });
    state.view = 'detail';
    if (switchingSku) state.copywritingMode = false;
    resetExcelState();
    expandPanel();
    renderShell(L.scanning);
    scheduleDrawerProductFlow(state.data, { reason: 'cached-open', includeScanTabs: true });
  }

  async function ensureNewProductProjectPage() {
    if (isNewProductProjectPageReady()) return true;
    addLog('info', '\u6253\u5f00\u8be6\u60c5\uff1a\u5207\u6362\u5230\u9879\u76ee\u7ba1\u7406-\u65b0\u54c1\u5f00\u53d1');
    const tabButton = findTopTabByText('\u65b0\u54c1\u5f00\u53d1');
    if (tabButton) {
      clickElement(tabButton);
      const readyFromTab = await waitFor(() => isNewProductProjectPageReady(), 5000, 150);
      if (readyFromTab) return true;
    }
    const menuItem = findMenuItemByPathOrText('/projectManagementChemicalNew', '\u65b0\u54c1\u5f00\u53d1');
    if (menuItem) {
      clickElement(menuItem);
      const readyFromMenu = await waitFor(() => isNewProductProjectPageReady(), 8000, 150);
      if (readyFromMenu) return true;
    }
    addLog('error', '\u6253\u5f00\u8be6\u60c5\uff1a\u672a\u627e\u5230\u65b0\u54c1\u5f00\u53d1\u9876\u90e8\u6807\u7b7e\u6216\u5de6\u4fa7\u83dc\u5355');
    return isNewProductProjectPageReady();
  }

  function isNewProductProjectPageReady() {
    return /\/projectManagementChemicalNew/.test(location.pathname) && Boolean(findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801') && findButtonByText('\u67e5\u8be2'));
  }

  function findTopTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.ant-tabs-tab, .ant-tabs-tab-btn, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  function findMenuItemByPathOrText(path, text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('[data-menu-id], .ant-menu-item, .ant-menu-submenu-title, li'))
      .filter(isVisibleElement)
      .find((el) => (el.getAttribute('data-menu-id') || '') === path || compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function queryProjectRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) return '';
    setNativeInputValue(input, sku);
    button.click();
    return await waitFor(() => findProjectRowIdBySku(sku), 5000, 150);
  }

  async function queryDesignTaskRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    if (!(await ensureDesignTaskTab())) return '';
    return await queryProjectRowIdBySku(sku);
  }

  async function ensureDesignTaskTab() {
    const active = getActiveProjectWorkflowTabText();
    if (/^\u8bbe\u8ba1\u4efb\u52a1/.test(active)) return true;
    const tab = findProjectWorkflowTabByText('\u8bbe\u8ba1\u4efb\u52a1');
    if (!tab) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u672a\u627e\u5230\u8bbe\u8ba1\u4efb\u52a1\u9875\u7b7e');
      return false;
    }
    clickElement(tab);
    return Boolean(await waitFor(() => /^\u8bbe\u8ba1\u4efb\u52a1/.test(getActiveProjectWorkflowTabText()), 5000, 120));
  }

  function getActiveProjectWorkflowTabText() {
    const tab = Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab-active, .ant-tabs-tab-active'))
      .filter(isVisibleElement)
      .find((el) => /^(?:\u5168\u90e8|\u5f00\u53d1\u4efb\u52a1|\u8bbe\u8ba1\u4efb\u52a1|\u63a8\u5e7f\u4e0a\u67b6)/.test(compactText(el.innerText || el.textContent)));
    return tab ? compactText(tab.innerText || tab.textContent) : '';
  }

  function findProjectWorkflowTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab, .filterTabs .ant-tabs-tab-btn, .ant-tabs-tab, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const current = compactText(el.innerText || el.textContent);
        return current === expected || current.startsWith(expected);
      }) || null;
  }

  async function clickProjectDetailByRowId(rowId, sku) {
    if (isProjectDrawerOpenForSku(sku)) return true;
    const row = findOperationRowByRowId(rowId);
    if (!row) return false;
    const detailButton = Array.from(row.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5');
    if (!detailButton) return false;
    detailButton.click();
    await waitFor(() => isProjectDrawerOpenForSku(sku), 3000, 120);
    return true;
  }

  function isProjectDrawerOpenForSku(sku) {
    return Boolean(getProjectDrawerForSku(sku));
  }

  function getProjectDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        const headerSku = getProjectDrawerHeaderSku(drawer);
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text) && Boolean(headerSku) && (!sku || headerSku === String(sku).toUpperCase());
      }) || null;
  }

  function findButtonLikeInScope(scope, text) {
    const expected = compactText(text);
    return Array.from(scope.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function ensureProjectDrawerForData(data) {
    const sku = data && data.sku;
    if (!sku) return false;
    if (getProjectDrawerForSku(sku)) return true;
    if (!(await ensureNewProductProjectPage())) return false;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
      return Boolean(await waitFor(() => getProjectDrawerForSku(sku), 5000, 150));
    }
    rowId = await queryProjectRowIdBySku(sku);
    if (!rowId) return false;
    const clicked = await clickProjectDetailByRowId(rowId, sku);
    if (clicked) cacheProjectRowId(sku, rowId);
    return clicked && Boolean(await waitFor(() => getProjectDrawerForSku(sku), 5000, 150));
  }

  async function ensureProjectBomDrawerForData(data, options) {
    const opts = options || {};
    const sku = data && data.sku;
    if (!sku) return null;
    const opened = getProjectBomDrawerForSku(sku);
    if (opened) return opened;
    const otherBom = getProjectBomDrawerForSku('');
    if (otherBom && !getVisibleText(otherBom).includes(sku)) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u5f53\u524d\u6253\u5f00\u7684\u7ed1BOM\u4e0d\u662f\u76ee\u6807 SKU', sku);
      return null;
    }
    await closeProjectDetailDrawerForSku(sku);
    if (!(await ensureNewProductProjectPage())) return null;
    if (!(await ensureDesignTaskTab())) return null;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectBomByRowId(rowId, sku)) {
      return getProjectBomDrawerForSku(sku);
    }
    if (opts.batchRowOnly) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u6279\u91cf\u641c\u7d22\u884c\u5df2\u5931\u6548\uff0c\u672a\u91cd\u65b0\u5355\u72ec\u641c\u7d22', sku);
      return null;
    }
    rowId = await queryDesignTaskRowIdBySku(sku);
    if (!rowId) return null;
    const clicked = await clickProjectBomByRowId(rowId, sku);
    if (clicked) cacheProjectRowId(sku, rowId);
    return clicked ? getProjectBomDrawerForSku(sku) : null;
  }

  async function closeProjectDetailDrawerForSku(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return true;
    const close = findDrawerCloseButton(drawer);
    if (!close) return false;
    clickElement(close);
    await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 5000, 150);
    return true;
  }

  async function clickProjectBomByRowId(rowId, sku) {
    if (getProjectBomDrawerForSku(sku)) return true;
    const button = findOperationButtonByRowId(rowId, '\u7ed1BOM');
    if (!button) return false;
    clickElement(button);
    return Boolean(await waitFor(() => getProjectBomDrawerForSku(sku), 5000, 150));
  }

  function getProjectBomDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        return /\u7ed1\u5b9aBOM|\u7ed1BOM/.test(text) && (!sku || text.includes(sku));
      }) || null;
  }

  function findBomLabelUploadItem(drawer) {
    if (!drawer) return null;
    const isLabelUploadScope = (el) => {
      if (!el || !el.querySelector('input[type="file"]')) return false;
      const text = getVisibleText(el);
      const compact = compactText(text);
      return /\u6807\u7b7e/.test(text) && (/\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text) || compact.startsWith('\u6807\u7b7e'));
    };
    const upload = Array.from(drawer.querySelectorAll('.ant-upload, .ant-upload-wrapper, input[type="file"]'))
      .filter(isVisibleElement)
      .map((el) => el.closest('.materialCardItemHeader, .ant-collapse-item, .typeCard, .cardBox') || el.parentElement)
      .filter(Boolean)
      .find(isLabelUploadScope);
    if (upload) return upload;
    const cards = Array.from(drawer.querySelectorAll('.cardBox, .typeCard'))
      .filter(isVisibleElement)
      .filter((card) => card.querySelector('input[type="file"]'));
    const byTitle = cards.find((card) => compactText((card.querySelector('.cardTitle') || {}).innerText || '') === '\u6807\u7b7e');
    if (byTitle) return byTitle;
    const byMaterial = cards.find((card) => {
      const text = getVisibleText(card);
      return /\u6807\u7b7e/.test(text) && /\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text);
    });
    if (byMaterial) return byMaterial;
    return Array.from(drawer.querySelectorAll('.ant-collapse-item, .materialCardItemHeader'))
      .filter(isVisibleElement)
      .find(isLabelUploadScope) || null;
  }

  async function saveProjectBomDrawer(drawer) {
    const button = findButtonLikeInScope(drawer, '\u6279\u91cf\u4fdd\u5b58');
    if (!button) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u6309\u94ae');
    const existingNotices = new Set(getVisiblePlmNoticeNodes());
    clickElement(button);
    const result = await waitFor(() => getFreshBomSaveNoticeResult(existingNotices), 120000, 150);
    if (result === 'saved') return true;
    state.uploadRunning = false;
    saveUploadWorkerRunning(false);
    if (result === 'failed') {
      throw new Error('\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u5931\u8d25\uff0c\u5df2\u6682\u505c\u961f\u5217\u5e76\u4fdd\u7559\u5f53\u524d\u62bd\u5c49');
    }
    throw new Error('\u672a\u68c0\u6d4b\u5230\u7ed1BOM\u201c\u4fdd\u5b58\u6210\u529f\u201d\u63d0\u793a\uff0c\u5df2\u6682\u505c\u961f\u5217\u5e76\u4fdd\u7559\u5f53\u524d\u62bd\u5c49');
  }

  function getVisiblePlmNoticeNodes() {
    return Array.from(document.querySelectorAll('.ant-message-notice, .ant-notification-notice'))
      .filter(isVisibleElement)
      .filter((node) => !node.closest('#' + PANEL_ID));
  }

  function getFreshBomSaveNoticeResult(existingNotices) {
    const baseline = existingNotices && typeof existingNotices.has === 'function' ? existingNotices : new Set();
    const text = getVisiblePlmNoticeNodes()
      .filter((node) => !baseline.has(node))
      .map((node) => getNodeText(node))
      .join('\n');
    if (/\u4fdd\u5b58\u5931\u8d25|\u64cd\u4f5c\u5931\u8d25|\u8bf7\u6c42\u5931\u8d25|\u7f51\u7edc\u5f02\u5e38|\u7cfb\u7edf\u5f02\u5e38/.test(text)) return 'failed';
    if (/\u4fdd\u5b58\u6210\u529f|\u64cd\u4f5c\u6210\u529f|\u6279\u91cf\u4fdd\u5b58\u6210\u529f/.test(text)) return 'saved';
    return '';
  }

  async function closeProjectBomDrawer(drawer) {
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u62bd\u5c49\u5173\u95ed\u6309\u94ae');
    clickElement(close);
    const closed = await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 8000, 150);
    if (!closed) throw new Error('\u7ed1BOM\u62bd\u5c49\u672a\u6210\u529f\u5173\u95ed');
  }

  function findProjectRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  function findOperationRowByRowId(rowId) {
    return Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((row) => Array.from(row.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5')) || null;
  }

  function findOperationButtonByRowId(rowId, text) {
    const expected = compactText(text);
    const rows = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement);
    for (const row of rows) {
      const button = Array.from(row.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === expected);
      if (button) return button;
    }
    return null;
  }

  function cacheProjectRowId(sku, rowId) {
    if (!sku || !rowId) return;
    const data = normalizeData({ ...(loadData(sku) || state.data || {}), sku, projectRowId: String(rowId) });
    saveData(sku, data);
  }

  function findInputByPlaceholder(placeholder) {
    return Array.from(document.querySelectorAll('input'))
      .filter(isVisibleElement)
      .find((input) => input.getAttribute('placeholder') === placeholder) || null;
  }

  function findButtonByText(text) {
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitFor(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval);
    }
    return '';
  }

  function resetExcelState() {
    state.excelPanelOpen = false;
    state.excelExtra = null;
    state.excelMissing = [];
    state.excelStatus = '';
    state.excelPackQty = '';
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    state.excelPurchasePrice = String(data && data.purchasePrice || '6');
  }

  function syncExcelInputs() {
    const panel = ensurePanel();
    const pack = panel.querySelector('.pfh-excel-pack');
    const price = panel.querySelector('.pfh-excel-price');
    if (pack) state.excelPackQty = pack.value;
    if (price) state.excelPurchasePrice = price.value;
  }

  function buildCachedExcelExtraData(data) {
    const cached = normalizeData(data || {});
    const imageInfo = getCachedSkuImageInfo(cached.sku);
    return {
      englishName: cleanEnglishProductName(cached.englishName, cached.brand),
      chineseName: cached.name || '',
      ingredients: getPreferredExcelIngredients(cached),
      ingredientEnglish: cached.ingredientEnglish || cached.copywritingIngredientEnglish || '',
      ingredientChinese: cached.ingredientChinese || cached.copywritingIngredientChinese || '',
      benchmarkLink: cached.benchmarkLink || cached.referenceUrl || '',
      imageUrl: imageInfo.imageUrl || '',
      imageFallbackUrl: imageInfo.imageFallbackUrl || '',
      skuImageUrl: imageInfo.skuImageUrl || '',
      skuImageFallbackUrl: imageInfo.skuImageFallbackUrl || '',
      skuImageSource: imageInfo.skuImageSource || '',
      isSkuDesignImage: Boolean(imageInfo.isSkuDesignImage),
      liveData: null,
    };
  }

  function formatExcelMissingStatus(missing) {
    const fields = Array.isArray(missing) ? missing.filter(Boolean) : [];
    return fields.length ? L.excelIncomplete + '：缺少' + fields.join('、') : L.excelReady;
  }

  function formatExcelCacheDiagnostic(data, extra, missing) {
    const available = [];
    if (extra.englishName) available.push('英文产品名');
    if (extra.ingredients) available.push('成分');
    if (extra.isSkuDesignImage && (extra.imageUrl || extra.imageFallbackUrl)) available.push('产品图');
    if (extra.benchmarkLink) available.push('对标链接');
    if (data.productLength && data.productWidth && data.productHeight) available.push('产品尺寸');
    if (data.packageLength && data.packageWidth && data.packageHeight) available.push('包装尺寸');
    if (data.netContent) available.push('净含量');
    if (data.grossWeight) available.push('毛重');
    return '缓存已有：' + (available.join('、') || '无') + ' | 缓存缺少：' + ((missing || []).join('、') || '无');
  }

  async function prepareExcelInfo() {
    syncExcelInputs();
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    state.view = 'detail';
    state.selectedSku = data.sku;
    state.data = data;
    if (data.purchasePrice) state.excelPurchasePrice = String(data.purchasePrice);
    state.excelPanelOpen = true;
    const cachedExtra = buildCachedExcelExtraData(data);
    const cachedMissing = getExcelMissingFields(data, cachedExtra);
    state.excelExtra = { extra: cachedExtra, excelData: data };
    state.excelMissing = cachedMissing;
    state.excelStatus = cachedMissing.length ? L.excelPreparing + '（缓存缺少：' + cachedMissing.join('、') + '）' : L.excelReady + '（使用缓存）';
    addLog(cachedMissing.length ? 'info' : 'success', 'Excel 缓存预检', data.sku + ' | ' + formatExcelCacheDiagnostic(data, cachedExtra, cachedMissing));
    renderShell();
    if (!cachedMissing.length) {
      await fillRecommendedPackQty(data);
      await fillRecommendedPurchasePrice(data, cachedExtra);
      renderShell();
      return true;
    }
    try {
      addLog('info', 'Excel 开始补全实时数据', data.sku + ' | 需要补全：' + cachedMissing.join('、'));
      if (!(await ensureProjectDrawerForData(data))) throw new Error('未能打开目标项目详情抽屉');
      const extra = await collectExcelExtraData(data.sku);
      const excelData = normalizeData(mergeData(data, extra.liveData || {}));
      cacheProductThumb(excelData, extra);
      state.excelExtra = { extra, excelData };
      state.excelMissing = getExcelMissingFields(excelData, extra);
      state.excelStatus = formatExcelMissingStatus(state.excelMissing);
      addLog(state.excelMissing.length ? 'warn' : 'success', 'Excel 信息补全结果', data.sku + ' | ' + formatExcelCacheDiagnostic(excelData, extra, state.excelMissing));
      await fillRecommendedPackQty(excelData);
      await fillRecommendedPurchasePrice(excelData, extra);
      if (state.excelMissing.length) showExcelMissingToast();
      return true;
    } catch (error) {
      console.warn('PLM floating helper excel prepare failed:', error);
      state.excelExtra = { extra: cachedExtra, excelData: data };
      state.excelMissing = cachedMissing;
      state.excelStatus = formatExcelMissingStatus(cachedMissing);
      addLog('error', '\u83b7\u53d6\u8868\u683c\u4fe1\u606f\u5931\u8d25', data.sku + ' | ' + formatExcelCacheDiagnostic(data, cachedExtra, cachedMissing) + ' | 错误：' + formatErrorMessage(error));
      recordDataQuality(data, 'excelPrepareFailed');
      showExcelMissingToast();
      return true;
    } finally {
      renderShell();
    }
  }

  function cacheProductThumb(data, extra) {
    const sku = data && data.sku;
    const src = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (!sku || !src) return;
    const thumbData = normalizeData({
      ...data,
      skuImageUrl: extra.skuImageUrl || extra.imageUrl || '',
      skuImageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extra.skuImageUrl || extra.imageUrl || '',
      skuImageSource: extra.skuImageSource || data.skuImageSource || 'effectImage',
    });
    saveDataDirect(sku, thumbData);
    if ((state.data && state.data.sku === sku) || (!state.data && state.selectedSku === sku)) state.data = thumbData;
    upsertIndex(thumbData);
  }

  function getExcelMissingFields(data, extra) {
    const missing = [];
    if (!extra.englishName) missing.push('\u82f1\u6587\u4ea7\u54c1\u540d');
    if (!extra.ingredients) missing.push('\u6210\u5206');
    if (!extra.isSkuDesignImage || (!extra.imageUrl && !extra.imageFallbackUrl)) missing.push('\u4ea7\u54c1\u56fe');
    if (!extra.benchmarkLink) missing.push('\u5bf9\u6807\u94fe\u63a5');
    if (!shouldOmitToyProductSize(data) && (!data.productLength || !data.productWidth || !data.productHeight)) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.singleBottle && (!data.packageLength || !data.packageWidth || !data.packageHeight)) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    return missing;
  }

  function showExcelMissingToast() {
    showToast(L.excelMissing + state.excelMissing.join('\u3001'));
  }

  async function generateExcelFromCurrent() {
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    if (!window.ExcelJS) {
      showToast(L.excelNeedLibrary);
      return;
    }
    if (!await ensureExcelTemplateLoaded()) {
      showToast('Excel \u6a21\u677f\u5c1a\u672a\u7f13\u5b58\uff0c\u8bf7\u8054\u7f51\u540e\u91cd\u8bd5');
      return;
    }
    syncExcelInputs();
    const packQty = normalizePackQty(state.excelPackQty);
    const purchasePrice = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    if (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku || state.excelMissing.length) {
      addLog('info', '生成 Excel 前自动准备数据', data.sku + ' | ' + (state.excelMissing.length ? '上次仍缺：' + state.excelMissing.join('、') : '当前没有匹配的表格数据快照'));
      await prepareExcelInfo();
      if (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku) {
        state.excelStatus = '\ud83d\udd34 \u8868\u683c\u6570\u636e\u51c6\u5907\u5931\u8d25';
        renderShell();
        showToast(state.excelStatus);
        return;
      }
    }
    if (state.excelMissing.length) {
      state.excelStatus = formatExcelMissingStatus(state.excelMissing);
      addLog('warn', 'Excel 将使用不完整数据生成', data.sku + ' | 缺少：' + state.excelMissing.join('、'));
      renderShell();
    }
    if (state.excelMissing.length) showExcelMissingToast();
    try {
      const extra = state.excelExtra.extra;
      const excelData = state.excelExtra.excelData;
      const fileName = sanitizeExcelFileName(buildExcelFileName(excelData, extra));
      const saveTarget = await chooseExcelSaveTarget(fileName);
      if (!saveTarget) {
        state.excelStatus = L.excelSaveCanceled;
        renderShell();
        showToast(L.excelSaveCanceled);
        return;
      }
      showToast(L.excelGenerating);
      const workbook = new window.ExcelJS.Workbook();
      await workbook.xlsx.load(base64ToArrayBuffer(TEMPLATE_XLSX_BASE64));
      const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
      state.excelStatus = L.excelImageLoading;
      renderShell();
      const excelImageSource = getExcelImageSource(excelData, extra);
      const imageInfo = excelImageSource.imageUrl ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper image fetch failed:', error);
        return null;
      }) : null;
      cacheProductThumb(data, extra);

      setCell(sheet, 'A4', buildExcelKeyword(excelData, extra));
      setCell(sheet, 'B4', excelData.name || extra.chineseName || '');
      setCell(sheet, 'C4', '');
      setCell(sheet, 'E4', compactText(packQty));
      setCell(sheet, 'G4', excelData.sku || '');
      if (excelData.singleBottle) setCell(sheet, 'H4', '\u74f6\u88c5');
      else sheet.getCell('H4').value = { formula: 'IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"\u76d2\u88c5",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"\u888b\u88c5",""))' };
      setCell(sheet, 'I4', formatExcelDimFromParts([excelData.productLength, excelData.productWidth, excelData.productHeight]) || formatExcelDim(excelData.productNums, []));
      setCell(sheet, 'J4', formatExcelDimFromParts([excelData.packageLength, excelData.packageWidth, excelData.packageHeight]) || formatExcelDim(excelData.packageNums, []));
      setCell(sheet, 'L4', formatIngredientsForExcel(extra.ingredients));
      setCell(sheet, 'M4', normalizeExcelUnit(excelData.netContent));
      setCell(sheet, 'N4', normalizeExcelUnit(excelData.grossWeight));
      setCell(sheet, 'O4', normalizeExcelNumberOrText(purchasePrice));
      setCell(sheet, 'P4', getReturnDateText(7));
      setCell(sheet, 'S4', extra.benchmarkLink || '');

      if (shouldOmitToyProductSize(excelData)) {
        sheet.spliceColumns(9, 1);
        sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
        sheet.getCell('F4').value = { formula: 'TEXT(VALUE(LEFT(E4,LEN(E4)-3))*(VALUE(LEFT(M4,LEN(M4)-1))/1000)+0.75,"0.00")&"KG"' };
        sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="G","\u51c0\u91cd",IF(RIGHT(L4,2)="ML","\u5bb9\u91cf","\u89c4\u683c"))' };
      } else if (shouldRemoveExcelPackageSizeColumn(excelData)) {
        sheet.spliceColumns(10, 1);
        sheet.getCell('F4').value = { formula: 'TEXT(VALUE(LEFT(E4,LEN(E4)-3))*(VALUE(LEFT(M4,LEN(M4)-1))/1000)+0.75,"0.00")&"KG"' };
        sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="G","净重",IF(RIGHT(L4,2)="ML","容量","规格"))' };
      }

      if (imageInfo) {
        state.excelStatus = L.excelPacking;
        renderShell();
        const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
        sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
      }
      const packBoxKey = buildPackBoxKey(excelData);
      if (packBoxKey) {
        const recommended = await fetchPackRecommendation(packBoxKey).catch(() => null);
        if (recommended && recommended.packCount) {
          state.excelStatus = '推荐装箱数: ' + recommended.packCount;
          renderShell();
        }
        if (packQty) {
          await savePackRecord(packBoxKey, packQty, data.sku).catch((error) => console.warn('PLM floating helper pack record failed:', error));
        }
      }
      const buffer = await workbook.xlsx.writeBuffer();
      state.excelStatus = L.excelDownloading + ' ' + fileName;
      renderShell();
      console.info('PLM floating helper Excel filename:', fileName);
      await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
      syncInsightEvent('excel_generated', { sku: excelData.sku || '', name: excelData.name || '', source: 'excel-generation' });
      recordCommerceInsight(excelData, extra, {
        price: purchasePrice,
        packQty,
        source: 'excel',
        fileName,
      });
      upsertDailyLedgerFromData(excelData, { status: '制作中', stage: '表格/上传处理中', note: '已生成 Excel' });
      state.excelStatus = L.excelDone;
      renderShell();
      showToast(L.excelDone);
    } catch (error) {
      console.warn('PLM floating helper excel failed:', error);
      state.excelStatus = L.excelFailed;
      renderShell();
      showToast(L.excelFailed);
    }
  }

  async function generateToyLabelFromCurrent(options) {
    const opts = options || {};
    let data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    syncExcelInputs();
    try {
      if (!opts.skipExcelPrepare && (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku)) {
        await prepareExcelInfo();
        data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
      }
      const matchingExcel = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku ? state.excelExtra : null;
      let extra = matchingExcel && matchingExcel.extra ? matchingExcel.extra : {};
      let labelData = normalizeData((matchingExcel && matchingExcel.excelData) || data);
      state.excelStatus = L.labelGenerating;
      renderShell();
      showToast(L.labelGenerating);

      const ensuredImage = await ensureToyLabelProductImage(labelData, extra);
      labelData = ensuredImage.data;
      extra = ensuredImage.extra;
      const imageSource = ensuredImage.imageSource;
      const productImage = imageSource.imageUrl ? await fetchImageForExcel(imageSource.imageUrl, imageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper label product image fetch failed:', error);
        addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u4ea7\u54c1\u56fe\u83b7\u53d6\u5931\u8d25', error && error.message ? error.message : '');
        return null;
      }) : null;
      if (!productImage || !productImage.dataUrl) {
        throw new Error('\u672a\u80fd\u8bfb\u53d6 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u53ea\u5269\u6761\u7801\u7684\u6807\u7b7e\u8bf4\u660e\u56fe');
      }
      const barcodeImage = await getBarcodeForToyLabel(labelData.sku);
      const size = getToyLabelSizeCm(labelData);
      const printCanvas = await renderToyLabelPrintCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        productImage,
        barcodeImage,
      });
      const previewCanvas = await renderToyLabelPreviewCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        printCanvas,
      });
      const baseName = cleanFileNamePart([labelData.brand, labelData.name, labelData.sku].filter(Boolean).join(' ')) || labelData.sku;
      const sizeName = trimCm(size.width) + 'x' + trimCm(size.height) + 'cm';
      const previewBlob = await canvasToBlob(previewCanvas, 'image/jpeg', 0.95);
      const printBlob = await canvasToBlob(printCanvas, 'image/jpeg', 0.95);
      const psdBlob = canvasToFlatPsdBlob(printCanvas, printCanvas.width / ((Number(size.width) || 4) * CM_TO_INCH));
      const previewFilename = baseName + ' \u6807\u7b7e\u8bf4\u660e\u56fe.jpg';
      const printFilename = baseName + ' \u6807\u7b7e\u5370\u5237' + sizeName + '.jpg';
      const materialCode = cleanFileNamePart(labelData.printCode || '');
      const productName = cleanFileNamePart([labelData.brand, labelData.name].filter(Boolean).join('')) || labelData.sku;
      const psdFilename = '\u6807\u7b7e \uff08' + sizeName + '\uff09' + [materialCode, productName].filter(Boolean).join(' ') + '.psd';
      if (Array.isArray(opts.collectFiles)) {
        const generatedFiles = [
          { sku: labelData.sku, filename: previewFilename, blob: previewBlob },
          { sku: labelData.sku, filename: printFilename, blob: printBlob },
          { sku: labelData.sku, filename: psdFilename, blob: psdBlob }
        ];
        opts.collectFiles.push(...generatedFiles);
        await stageToyLabelBatchFiles(generatedFiles, opts.batchSignature || state.toyLabelBatchPreparedSignature);
      } else {
        downloadBlob(previewBlob, previewFilename);
        await wait(250);
        downloadBlob(printBlob, printFilename);
        await wait(250);
        downloadBlob(psdBlob, psdFilename);
      }
      if (!opts.skipBomUpload) await uploadToyLabelPreviewToBom(labelData, previewBlob, previewFilename, opts);
      state.excelStatus = L.labelDone;
      upsertDailyLedgerFromData(labelData, { status: '制作中', stage: '图包/标签/纸盒处理中', note: '已生成玩具标签', labelFileState: 'done', labelFileDone: true });
      renderShell();
      addLog('success', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6210\u529f', labelData.sku);
      showToast(L.labelDone);
      return true;
    } catch (error) {
      console.warn('PLM floating helper label failed:', error);
      state.excelStatus = L.labelFailed;
      renderShell();
      addLog('error', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u5931\u8d25', error && error.message ? error.message : '');
      showToast(L.labelFailed);
      return false;
    }
  }

  async function uploadToyLabelPreviewToBom(data, blob, filename, options) {
    const sku = data && data.sku;
    if (!sku) throw new Error('\u672a\u627e\u5230 SKU\uff0c\u65e0\u6cd5\u4e0a\u4f20\u5230\u7ed1BOM');
    addLog('info', '\u73a9\u5177\u6807\u7b7e\uff1a\u51c6\u5907\u4e0a\u4f20\u8bf4\u660e\u56fe\u5230\u7ed1BOM', sku);
    const drawer = await ensureProjectBomDrawerForData(data, options);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u7ed1BOM\u62bd\u5c49');
    const uploadItem = await waitUntil(() => findBomLabelUploadItem(drawer), 12000, 250);
    if (!uploadItem) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u4e2d\u6807\u7b7e\u884c\u7684\u4e0a\u4f20\u52a0\u53f7');
    uploadItem.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(180);
    await putFileIntoUploadItem(uploadItem, blob, filename);
    await waitUploadItemDone(uploadItem, filename, 180000);
    await wait(1600);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u8bf4\u660e\u56fe\u5df2\u4e0a\u4f20\u5230\u7ed1BOM\u6807\u7b7e', filename);
    await saveProjectBomDrawer(drawer);
    await closeProjectBomDrawer(drawer);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u7ed1BOM\u5df2\u6279\u91cf\u4fdd\u5b58\u5e76\u5173\u95ed', sku);
  }

  function getToyLabelSizeCm(data) {
    return { width: 4, height: 3 };
  }

  function getToyLabelImageSource(data, extra) {
    const batchImageUrl = data && (data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl);
    if (batchImageUrl) {
      return {
        imageUrl: data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
        imageFallbackUrl: data.toyLabelProductImageFallbackUrl || data.productListImageFallbackUrl || data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
      };
    }
    const source = getExcelImageSource(data, extra);
    const imageUrl = stripOssResizeParams(source.imageUrl || source.imageFallbackUrl || '');
    const imageFallbackUrl = stripOssResizeParams(source.imageFallbackUrl || '');
    return {
      imageUrl: imageUrl || source.imageUrl || '',
      imageFallbackUrl: imageFallbackUrl || imageUrl || source.imageFallbackUrl || '',
    };
  }

  async function getBarcodeForToyLabel(sku) {
    return { canvas: renderCode128Barcode(sku, 980, 260), source: 'generated-code128b' };
  }

  async function ensureToyLabelProductImage(data, extra) {
    const cachedSource = getToyLabelImageSource(data, extra);
    if (cachedSource.imageUrl || cachedSource.imageFallbackUrl) {
      return { data, extra, imageSource: cachedSource };
    }
    if (!(await ensureProjectDrawerForData(data))) {
      throw new Error('\u672a\u6253\u5f00\u5f53\u524d SKU \u7684\u9879\u76ee\u8be6\u60c5\uff0c\u65e0\u6cd5\u8bfb\u53d6\u6548\u679c\u56fe');
    }
    const drawer = getProjectDrawerForSku(data.sku) || getProjectDrawer();
    const imageInfo = drawer ? await collectProductImageInfo(drawer, {
      sku: data.sku,
      allowPreview: true,
      restoreTab: true,
      productInfoTimeout: 4500,
    }) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageUrl = imageInfo.isSkuDesignImage && (imageInfo.imageUrl || imageInfo.imageFallbackUrl);
    if (!imageUrl) {
      throw new Error('\u672a\u627e\u5230 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u4e0a\u4f20\u7a7a\u767d\u6807\u7b7e\u8bf4\u660e\u56fe');
    }
    const imageExtra = {
      ...(extra || {}),
      ...imageInfo,
      imageUrl: imageInfo.imageUrl || imageUrl,
      imageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      skuImageUrl: imageInfo.imageUrl || imageUrl,
      skuImageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      isSkuDesignImage: true,
    };
    const imageData = normalizeData({
      ...data,
      skuImageUrl: imageExtra.skuImageUrl,
      skuImageFallbackUrl: imageExtra.skuImageFallbackUrl,
      skuImageSource: 'effectImage',
    });
    cacheProductThumb(imageData, imageExtra);
    if (state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === imageData.sku) {
      state.excelExtra = { extra: imageExtra, excelData: imageData };
    }
    return { data: imageData, extra: imageExtra, imageSource: getToyLabelImageSource(imageData, imageExtra) };
  }

  async function getPlmBarcodePreviewImage(sku) {
    stopScan();
    cancelDrawerTabFlow();
    const drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    if (!drawer) return null;
    const token = beginForegroundDrawerTabFlow(sku, drawer);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 4500 }))) return null;
      await waitForDrawerText(drawer, '\u6761\u7801\u6587\u4ef6', 1600);
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) return null;
      const label = Array.from(drawer.querySelectorAll('label, .ant-form-item-label, .ant-form-item-no-colon'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === '\u6761\u7801\u6587\u4ef6');
      const item = label && label.closest('.ant-form-item');
      if (!item) return null;
      const img = Array.from(item.querySelectorAll('img'))
        .filter(isVisibleElement)
        .find((el) => {
          const src = el.currentSrc || el.src || '';
          return src && !/filePic\/pdf\.png/i.test(src) && !/filePic\/image\.png/i.test(src);
        });
      if (!img) return null;
      return { dataUrl: img.currentSrc || img.src || '', source: 'plm-preview' };
    } finally {
      finishForegroundDrawerTabFlow(token);
    }
  }

  async function renderToyLabelPrintCanvas(options) {
    const width = Math.round((Number(options.widthCm) || 4) * 300);
    const height = Math.round((Number(options.heightCm) || 3) * 300);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const productBox = { x: width * 0.18, y: height * 0.11, w: width * 0.64, h: height * 0.39 };
    if (options.productImage && options.productImage.dataUrl) {
      const image = await loadImage(options.productImage.dataUrl);
      drawImageContained(ctx, trimImageWhitespace(image), productBox.x, productBox.y, productBox.w, productBox.h);
    }

    const barcodeBox = { x: width * 0.13, y: height * 0.62, w: width * 0.74, h: height * 0.17 };
    const barcode = options.barcodeImage && options.barcodeImage.canvas
      ? options.barcodeImage.canvas
      : options.barcodeImage && options.barcodeImage.dataUrl
        ? await loadImage(options.barcodeImage.dataUrl)
        : renderCode128Barcode(options.sku, 900, 210);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(barcode, barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + Math.round(height * 0.052) + 'px Arial, sans-serif';
    ctx.fillText(options.sku || '', width / 2, height * 0.86);
    return canvas;
  }

  async function renderToyLabelPreviewCanvas(options) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '400 88px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u6807\u7b7e', 640, 300);
    ctx.font = '400 90px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a  \u5bbd' + trimCm(options.widthCm) + 'X\u9ad8' + trimCm(options.heightCm) + 'CM', 640, 455);

    const labelX = 585;
    const labelY = 958;
    const labelW = 1888;
    const labelH = Math.round(labelW * (Number(options.heightCm) || 3) / (Number(options.widthCm) || 4));
    ctx.strokeStyle = '#9f9f9f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(labelX, labelY, labelW, labelH);
    ctx.drawImage(options.printCanvas, labelX + 2, labelY + 2, labelW - 4, labelH - 4);
    drawDimensionGuide(ctx, labelX, labelY, labelW, labelH, options.widthCm, options.heightCm);
    return canvas;
  }

  function drawDimensionGuide(ctx, x, y, w, h, widthCm, heightCm) {
    ctx.save();
    ctx.strokeStyle = '#ef1f24';
    ctx.fillStyle = '#ef1f24';
    ctx.lineWidth = 4;
    const leftX = x - 70;
    const bottomY = y + h + 62;
    drawLineWithTicks(ctx, leftX, y, leftX, y + h, 28, true);
    drawLineWithTicks(ctx, x, bottomY, x + w, bottomY, 28, false);
    ctx.font = '700 86px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(leftX - 78, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(trimCm(heightCm) + 'cm', 0, 0);
    ctx.restore();
    ctx.fillText(trimCm(widthCm) + 'cm', x + w / 2, bottomY + 86);
    ctx.restore();
  }

  function drawLineWithTicks(ctx, x1, y1, x2, y2, tick, vertical) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x1 - tick / 2, y1);
      ctx.lineTo(x1 + tick / 2, y1);
      ctx.moveTo(x2 - tick / 2, y2);
      ctx.lineTo(x2 + tick / 2, y2);
    } else {
      ctx.moveTo(x1, y1 - tick / 2);
      ctx.lineTo(x1, y1 + tick / 2);
      ctx.moveTo(x2, y2 - tick / 2);
      ctx.lineTo(x2, y2 + tick / 2);
    }
    ctx.stroke();
  }

  function trimCm(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Number(num.toFixed(2))).replace(/\.0$/, '') : String(value || '');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawImageContained(ctx, image, x, y, w, h) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const ratio = Math.min(w / iw, h / ih);
    const dw = iw * ratio;
    const dh = ih * ratio;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function trimImageWhitespace(image) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const canvas = document.createElement('canvas');
    canvas.width = iw;
    canvas.height = ih;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, iw, ih).data;
    let minX = iw;
    let minY = ih;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < ih; y += 1) {
      for (let x = 0; x < iw; x += 1) {
        const index = (y * iw + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        if (a > 12 && !(r > 245 && g > 245 && b > 245)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return image;
    const pad = Math.round(Math.max(iw, ih) * 0.02);
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(iw - sx, maxX - minX + 1 + pad * 2);
    const sh = Math.min(ih - sy, maxY - minY + 1 + pad * 2);
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('canvas export failed')), type || 'image/png', quality);
    });
  }

  function renderCode128Barcode(text, width, height) {
    const patterns = [
      '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
    ];
    const value = String(text || '').replace(/[^\x20-\x7f]/g, '');
    const codes = [104];
    for (let i = 0; i < value.length; i += 1) codes.push(value.charCodeAt(i) - 32);
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
    codes.push(checksum % 103, 106);
    const quiet = 10;
    const modules = codes.reduce((sum, code) => sum + patterns[code].split('').reduce((a, n) => a + Number(n), 0), quiet * 2);
    const moduleWidth = width / modules;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    let x = quiet * moduleWidth;
    codes.forEach((code) => {
      const pattern = patterns[code];
      for (let i = 0; i < pattern.length; i += 1) {
        const w = Number(pattern[i]) * moduleWidth;
        if (i % 2 === 0) ctx.fillRect(Math.round(x), 0, Math.ceil(w), height);
        x += w;
      }
    });
    return canvas;
  }

  function canvasToFlatPsdBlob(canvas, dpi) {
    const width = canvas.width;
    const height = canvas.height;
    const resolution = Math.max(72, Math.round(Number(dpi) || 300));
    const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const pixelCount = width * height;
    const resolutionResourceLength = 28;
    const size = 26 + 4 + 4 + resolutionResourceLength + 4 + 2 + pixelCount * 3;
    const bytes = new Uint8Array(size);
    let offset = 0;
    const writeText = (value) => {
      for (let i = 0; i < value.length; i += 1) bytes[offset++] = value.charCodeAt(i);
    };
    const write16 = (value) => {
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    const write32 = (value) => {
      bytes[offset++] = (value >> 24) & 255;
      bytes[offset++] = (value >> 16) & 255;
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    writeText('8BPS');
    write16(1);
    offset += 6;
    write16(3);
    write32(height);
    write32(width);
    write16(8);
    write16(3);
    write32(0);
    write32(resolutionResourceLength);
    writeText('8BIM');
    write16(1005);
    write16(0);
    write32(16);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(0);
    write16(0);
    for (let channel = 0; channel < 3; channel += 1) {
      for (let i = 0; i < pixelCount; i += 1) bytes[offset++] = rgba[i * 4 + channel];
    }
    return new Blob([bytes], { type: 'image/vnd.adobe.photoshop' });
  }

  function setCell(sheet, address, value) {
    sheet.getCell(address).value = value;
  }

  function getExcelImageSource(data, extra) {
    const extraImageUrl = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (extraImageUrl) {
      return { imageUrl: extra.skuImageUrl || extra.imageUrl || extraImageUrl, imageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extraImageUrl };
    }
    const skuImageUrl = data && /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') && (data.skuImageUrl || data.skuImageFallbackUrl);
    if (skuImageUrl) {
      return { imageUrl: data.skuImageUrl || skuImageUrl, imageFallbackUrl: data.skuImageFallbackUrl || data.skuImageUrl || skuImageUrl };
    }
    const productListImageUrl = data && (data.productListImageUrl || data.productListImageFallbackUrl);
    if (productListImageUrl) {
      return {
        imageUrl: data.productListImageUrl || productListImageUrl,
        imageFallbackUrl: data.productListImageFallbackUrl || data.productListImageUrl || productListImageUrl,
      };
    }
    return { imageUrl: '', imageFallbackUrl: '' };
  }

  function getPreferredExcelIngredients(data) {
    const cached = normalizeData(data || {});
    if (cached.copywritingIngredientSplit && cached.copywritingIngredientChinese) return cached.copywritingIngredientChinese;
    return cached.ingredientChinese
      || cached.copywritingIngredientChinese
      || cached.ingredientEnglish
      || cached.copywritingIngredientEnglish
      || '';
  }

  async function collectExcelExtraData(sku) {
    stopScan();
    cancelDrawerTabFlow();
    const drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    const cachedData = normalizeData((state.data && state.data.sku === sku ? state.data : null) || loadData(sku) || {});
    const extra = buildCachedExcelExtraData(cachedData);
    if (!drawer) return extra;
    const token = beginForegroundDrawerTabFlow(sku, drawer);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 4500 }))) throw new Error('\u4ea7\u54c1\u4fe1\u606f\u8bfb\u53d6\u5df2\u53d6\u6d88');
      extra.liveData = extractData(drawer, { forceSkuImage: true });
      if (!extra.liveData.grossWeight) {
        await waitFor(() => getGrossWeightValue(drawer), 2600, 120);
        extra.liveData = extractData(drawer, { forceSkuImage: true });
      }
      if (extra.liveData.sku === sku) {
        const refreshed = mergeData(cachedData, extra.liveData);
        saveData(sku, refreshed);
        if (state.selectedSku === sku) state.data = refreshed;
      }
      let ingredientData = normalizeData(loadData(sku) || cachedData);
      let copywritingRecord = normalizeCopywritingRecord(ingredientData.copywriting);
      if (!copywritingRecord || copywritingRecord.parserVersion !== COPYWRITING_PARSER_VERSION) {
        if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 25000, 200);
        ingredientData = normalizeData(loadData(sku) || ingredientData);
        copywritingRecord = normalizeCopywritingRecord(ingredientData.copywriting);
        if (!copywritingRecord || copywritingRecord.parserVersion !== COPYWRITING_PARSER_VERSION) {
          const copywritingItem = findProductCopywritingItem(drawer);
          const copywritingFile = copywritingItem ? findProductCopywritingFile(copywritingItem, sku) : null;
          if (copywritingFile) ingredientData = await hydrateCopywritingForSku(sku, { silent: true, drawer, file: copywritingFile });
        }
      }
      const ingredientItem = findIngredientPdfItem(drawer);
      const ingredientFile = ingredientItem ? findIngredientPdfFile(ingredientItem) : null;
      if (ingredientFile && (
        ingredientData.ingredientPdfFileName !== ingredientFile.fileName
        || ingredientData.ingredientNormalizerVersion !== INGREDIENT_NORMALIZER_VERSION
      )) {
        if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
        else ingredientData = await hydrateIngredientPdfForSku(sku, { silent: true, drawer, file: ingredientFile });
        ingredientData = normalizeData(loadData(sku) || ingredientData);
      }
      extra.ingredientEnglish = ingredientData.ingredientEnglish || extra.ingredientEnglish;
      extra.ingredientChinese = ingredientData.ingredientChinese || extra.ingredientChinese;
      const productText = getVisibleText(drawer);
      const previewImageInfo = await collectProductImageInfo(drawer, {
        sku,
        includeBenchmark: false,
        allowPreview: true,
        restoreTab: false,
        productInfoTimeout: 4500,
        flowToken: token,
      });
      const resolvedImageInfo = previewImageInfo && previewImageInfo.isSkuDesignImage ? previewImageInfo : getCachedSkuImageInfo(sku);
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) throw new Error('\u7528\u6237\u5df2\u5207\u6362\u9875\u7b7e\uff0cExcel \u8865\u5145\u8bfb\u53d6\u5df2\u53d6\u6d88');
      Object.assign(extra, {
        englishName: cleanEnglishProductName(extractLineAfter(productText, 'PRODUCT NAME'), cachedData.brand) || extra.englishName,
        chineseName: extractLineAfter(productText, '\u5546\u54c1\u540d\u79f0') || extra.chineseName,
        ingredients: getPreferredExcelIngredients(ingredientData) || extractNamedField(productText, '\u6210\u5206') || extractNamedField(productText, '\u6210\u4efd') || '',
        ...resolvedImageInfo,
        skuImageSource: previewImageInfo && previewImageInfo.isSkuDesignImage ? 'effectImage' : (resolvedImageInfo.skuImageSource || extra.skuImageSource || ''),
      });

      if (!(await switchDrawerTab(drawer, '\u9879\u76ee\u4fe1\u606f', { flowToken: token, timeout: 3500 }))) throw new Error('\u9879\u76ee\u4fe1\u606f\u8bfb\u53d6\u5df2\u53d6\u6d88');
      extra.benchmarkLink = extractBenchmarkLink(getVisibleText(drawer)) || extra.benchmarkLink;
      await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 4500 });
      return extra;
    } finally {
      finishForegroundDrawerTabFlow(token);
    }
  }

  function getCachedSkuImageInfo(sku) {
    const current = state.data && state.data.sku === sku ? state.data : null;
    const data = normalizeData(current || loadData(sku) || {});
    const hasReusableSkuImage = /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') && Boolean(data.skuImageUrl || data.skuImageFallbackUrl);
    const imageUrl = hasReusableSkuImage
      ? (data.skuImageUrl || data.skuImageFallbackUrl || '')
      : (data.productListImageUrl || data.productListImageFallbackUrl || '');
    if (!imageUrl) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageFallbackUrl = hasReusableSkuImage
      ? (data.skuImageFallbackUrl || data.skuImageUrl || imageUrl)
      : (data.productListImageFallbackUrl || data.productListImageUrl || imageUrl);
    const skuImageSource = hasReusableSkuImage ? data.skuImageSource : 'productListImage';
    return {
      imageUrl,
      imageFallbackUrl,
      skuImageUrl: imageUrl,
      skuImageFallbackUrl: imageFallbackUrl,
      skuImageSource,
      isSkuDesignImage: true,
    };
  }

  async function switchDrawerTab(drawer, label, options) {
    const opts = options || {};
    if (!drawer) return false;
    if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
    const button = findTabButton(drawer, label);
    if (!button) return false;
    if (!isActiveTab(button)) {
      state.ignoreOutsideClickUntil = Date.now() + 1200;
      button.click();
    }
    const timeout = Number(opts.timeout || 3500) || 3500;
    const startedAt = Date.now();
    const active = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      const current = findTabButton(drawer, label);
      return current && isActiveTab(current);
    }, timeout, 100);
    if (!active) return false;
    const readinessTimeout = Math.max(250, timeout - (Date.now() - startedAt));
    const ready = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      return isDrawerTabContentReady(drawer, label);
    }, readinessTimeout, 120);
    if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
    return Boolean(ready);
  }

  function isDrawerTabContentReady(drawer, label) {
    if (!drawer || getActiveTabText(drawer) !== label) return false;
    const text = getVisibleText(drawer);
    if (label === L.materialTab) return /\u7269\u6599\u7f16\u7801[\s\S]*\u7269\u6599\u540d\u79f0|\u89c4\u683c\u578b\u53f7/.test(text);
    if (label === L.productTab) return /PRODUCT\s*NAME|\u89c4\u683c\u4fe1\u606f[\s\S]*\u6bdb\u91cd|\u6548\u679c\u56fe\u4fe1\u606f/.test(text);
    if (label === '\u5907\u8d27\u4fe1\u606f') return /\u56fd\u5185\u4e09\u6863\u4ef7\u683c|\u91c7\u8d2d\u4ef7/.test(text);
    if (label === '\u9879\u76ee\u4fe1\u606f') return /\u9879\u76ee\u7f16\u7801|\u5bf9\u6807\u94fe\u63a5/.test(text);
    return true;
  }

  async function waitForDrawerText(drawer, text, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (getVisibleText(drawer).includes(text)) return true;
      await wait(120);
    }
    return false;
  }

  async function collectProductImageInfo(drawer, options) {
    const opts = options || {};
    const activeText = opts.restoreTab ? getActiveTabText(drawer) : '';
    let imageInfo = { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const ownsFlow = !opts.flowToken && Boolean(opts.sku);
    if (ownsFlow) stopScan();
    const flowToken = opts.flowToken || (ownsFlow ? beginForegroundDrawerTabFlow(opts.sku, drawer) : 0);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken, timeout: opts.productInfoTimeout || 3500 }))) return imageInfo;
      await waitForProductInfoImage(drawer, opts.productInfoTimeout || 1800);
      if (flowToken && state.drawerTabFlowToken !== flowToken) return imageInfo;
      imageInfo = findDesignImageInfo(drawer);
      if ((!imageInfo.imageUrl && !imageInfo.imageFallbackUrl) && opts.allowPreview) {
        imageInfo = await openPreviewAndGetImageInfo(drawer);
      }
      if (opts.restoreTab && activeText) await switchDrawerTab(drawer, activeText, { flowToken });
      return imageInfo;
    } finally {
      if (ownsFlow) finishForegroundDrawerTabFlow(flowToken);
    }
  }

  async function waitForProductInfoImage(drawer, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const imageInfo = findDesignImageInfo(drawer);
      if (imageInfo.imageUrl || imageInfo.imageFallbackUrl) return true;
      scrollDesignImageCardsIntoView(drawer);
      await wait(120);
    }
    return false;
  }

  function scrollDesignImageCardsIntoView(drawer) {
    if (!drawer) return;
    const card = findDesignPreviewCard(drawer);
    if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function findDesignPreviewCard(root) {
    const item = findStrictEffectImageItem(root || document);
    if (!item) return null;
    return Array.from(item.querySelectorAll('.filePreviewCard, .filePreviewMainBox, .removeOtherContent, .previewMasker, .preview'))
      .filter(isVisibleElement)
      .find((el) => isStrictEffectImageFileContext(getDesignAssetContext(el))) || null;
  }

  function extractLineAfter(text, label) {
    const lines = getCleanLines(text);
    const normalizedLabel = label.replace(/[：:]\s*$/, '');
    const index = lines.findIndex((line) => line.replace(/[：:]\s*$/, '') === normalizedLabel);
    if (index < 0) return '';
    return cleanExcelFieldValue(lines[index + 1]);
  }

  function extractNamedField(text, label) {
    const lines = getCleanLines(text);
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (lines[index] !== label) continue;
      const value = cleanExcelFieldValue(lines[index + 1]);
      if (value && !isLikelyFieldLabel(value)) return value;
    }
    return '';
  }

  function getCleanLines(text) {
    return String(text || '').split('\n').map((line) => compactText(line)).filter(Boolean);
  }

  function cleanExcelFieldValue(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function cleanEnglishProductName(value, brand) {
    let text = cleanExcelFieldValue(value)
      .replace(/^PRODUCT\s*NAME\s*[:：]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';

    const brandText = compactText(brand).replace(/[._-]+/g, ' ').trim();
    if (brandText) {
      const escapedBrand = brandText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s._-]+');
      text = text.replace(new RegExp('^' + escapedBrand + '(?:[\\s._–—-]+|$)', 'i'), '').trim();
    }

    const logoMatch = text.match(/^([A-Z][A-Z0-9]{3,})(?:[®™©])?[\s._–—-]+(.+)$/);
    if (logoMatch && /[A-Za-z]/.test(logoMatch[2])) text = logoMatch[2].trim();
    return text;
  }

  function isLikelyFieldLabel(value) {
    return /^(PRODUCT NAME|\u4e2d\u6587-\u7b80\u4f53|\u82f1\u8bed|\u6210\u4efd\u8868|\u6210\u5206\u529f\u80fd|\u4ea7\u54c1\u5356\u70b9|\u4ea7\u54c1\u4f18\u52bf|\u4ea7\u54c1\u529f\u6548|\u4f7f\u7528\u65b9\u6cd5|\u8b66\u544a\u8bed|\u4ea7\u54c1\u6807\u8bc6|\u5176\u4ed6\u6807\u8bc6)/.test(value);
  }

  function findDesignImageInfo(drawer) {
    const item = findStrictEffectImageItem(drawer);
    if (!item) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const fallback = Array.from(item.querySelectorAll('img.ant-image-img, .ant-image img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .find(isStrictDesignImageUrl) || '';
    const original = stripOssResizeParams(fallback);
    return { imageUrl: original, imageFallbackUrl: fallback || original, isSkuDesignImage: Boolean(fallback) };
  }

  function findStrictEffectImageItem(drawer) {
    if (!drawer) return null;
    const root = getDesignContentRoot(drawer);
    if (!root) return null;
    return Array.from(root.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => isEffectImageFormItem(root, item) && isStrictEffectImageFileContext(item.innerText || item.textContent)) || null;
  }

  function getDesignContentRoot(drawer) {
    const roots = Array.from(drawer.querySelectorAll('.previewFormRoot .tabContent, .tabContent, .previewFormRoot'))
      .filter(isVisibleElement)
      .filter((el) => !el.closest('.searchDropdownPanel, .searchDropdown'));
    return roots.find((el) => /\u6548\u679c\u56fe\u4fe1\u606f[\s\S]*\u56fe\u7247/.test(el.innerText || el.textContent))
      || roots[0]
      || drawer;
  }

  function isEffectImageFormItem(root, item) {
    const label = compactText((item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).innerText || (item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).textContent || '');
    if (label !== '\u56fe\u7247') return false;
    return getPreviousDesignSection(root, item) === '\u6548\u679c\u56fe\u4fe1\u606f';
  }

  function getPreviousDesignSection(root, item) {
    const itemTop = item.getBoundingClientRect().top;
    const titles = Array.from(root.querySelectorAll('.titleRow, .titleContent, .title'))
      .filter(isVisibleElement)
      .map((el) => ({ top: el.getBoundingClientRect().top, text: compactText(el.innerText || el.textContent) }))
      .filter((entry) => entry.top <= itemTop && /^(\u57fa\u672c\u4fe1\u606f|\u6548\u679c\u56fe\u4fe1\u606f|\u4ea7\u54c1\u6587\u6848|\u8bbe\u8ba1\u6587\u4ef6|\u5907\u6ce8\u4fe1\u606f)$/.test(entry.text))
      .sort((a, b) => a.top - b.top);
    let section = '';
    titles.forEach((entry) => { section = entry.text; });
    return section;
  }

  function isStrictEffectImageFileContext(context) {
    const text = compactText(context);
    if (!text || isExcludedDesignImageContext(text)) return false;
    return /\.(jpg|jpeg|png|webp)\b/i.test(text);
  }

  function isExcludedDesignImageContext(context) {
    return /(\u6807\u7b7e\u5c3a\u5bf8\u56fe|\u4ea7\u54c1\u6587\u6848|\u4ea7\u54c1\u6b63\u9762\u6587\u6848|\u6587\u6848|\u4f01\u4e1a\u5fae\u4fe1|\u622a\u56fe|\.pdf\b|\.docx?\b|\.xlsx?\b)/i.test(compactText(context));
  }

  async function openPreviewAndGetImageInfo(drawer) {
    const beforeUrls = getVisibleOssImageUrls(document);
    const preview = findDesignPreviewCard(drawer);
    if (!preview) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    preview.click();
    const images = await waitForPreviewImageUrls(beforeUrls, 1600);
    closeImagePreview();
    const fallback = images[0] || '';
    return { imageUrl: stripOssResizeParams(fallback), imageFallbackUrl: fallback, isSkuDesignImage: Boolean(fallback) };
  }

  async function waitForPreviewImageUrls(beforeUrls, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const images = getVisibleOssImageUrls(document)
        .filter((src) => !beforeUrls.includes(src))
        .filter((src) => !/filePic\//i.test(src));
      if (images.length) return images;
      await wait(160);
    }
    return [];
  }

  function getVisibleOssImageUrls(root) {
    return Array.from((root || document).querySelectorAll('.ant-image-preview-img, .ant-image-preview-wrap img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(src));
  }

  function isStrictDesignImageUrl(src) {
    return /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(String(src || '')) && !/\/filePic\//i.test(src);
  }

  function closeImagePreview() {
    const close = document.querySelector('.ant-image-preview-close');
    if (close) close.click();
  }

  function isProductDesignImage(img) {
    const context = getDesignAssetContext(img);
    if (isExcludedDesignImageContext(context)) return false;
    return isStrictEffectImageFileContext(context);
  }

  function isProductDesignPreview(el) {
    const context = getDesignAssetContext(el);
    return !isExcludedDesignImageContext(context);
  }

  function getDesignAssetContext(el) {
    const preferred = el.closest('.filePreviewCard, .filePreviewMainBox, .removeOtherContent');
    if (preferred) return compactText(preferred.innerText || preferred.textContent || '');
    let node = el.parentElement;
    while (node && node !== document.body) {
      const text = compactText(node.innerText || node.textContent || '');
      if (text) return text;
      node = node.parentElement;
    }
    return '';
  }

  function stripOssResizeParams(url) {
    return String(url || '').replace(/\?x-oss-process=.*$/i, '');
  }

  function extractBenchmarkLink(text) {
    const lines = getCleanLines(text);
    const index = lines.findIndex((line) => /\u5bf9\u6807\u94fe\u63a5/.test(line));
    const nearby = index >= 0 ? lines.slice(index + 1, index + 5).join(' ') : text;
    return ((nearby.match(/https?:\/\/\S+/) || String(text || '').match(/https?:\/\/\S+/)) || [''])[0];
  }

  function formatExcelDim(nums, fallbackParts) {
    const parts = (Array.isArray(nums) && nums.length >= 3 ? nums.slice(0, 3).map(trimNumber) : fallbackParts.map(extractCmValue))
      .filter((part) => part !== '');
    return parts.length >= 2 ? parts.join('*') + 'CM' : '';
  }

  function formatExcelDimFromParts(parts) {
    const values = (parts || []).map(extractCmValue).filter((part) => part !== '');
    return values.length >= 2 ? values.join('*') + 'CM' : '';
  }

  function extractCmValue(value) {
    const match = String(value || '').match(/\d+(?:\.\d+)?/);
    return match ? trimNumber(Number(match[0])) : '';
  }

  function normalizeExcelUnit(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text || text === L.unknown) return '';
    return text.replace(/g\b/i, 'G').replace(/ml\b/i, 'ML');
  }

  function formatIngredientsForExcel(value) {
    return String(value || '').replace(/\s*(\u975e\u6d3b\u6027\u6210\u5206[:\uff1a])\s*/g, '\n$1');
  }

  function normalizeExcelNumberOrText(value) {
    const text = compactText(value);
    if (!text) return '';
    const num = Number(text);
    return Number.isFinite(num) ? num : text;
  }

  function normalizePackQty(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text) return '';
    return /pcs$/i.test(text) ? text.toUpperCase() : text + 'PCS';
  }

  async function fillRecommendedPackQty(data) {
    if (state.excelPackQty) return false;
    const boxKey = buildPackBoxKey(data);
    if (!boxKey) return false;
    const cachedCount = normalizePackCountValue(data && (data.packQty || data.packCount || data.cartonQty));
    const cachedBoxKey = String(data && data.packQtyBoxKey || '');
    if (cachedCount && (!cachedBoxKey || cachedBoxKey === boxKey)) {
      state.excelPackQty = cachedCount;
      state.excelStatus = L.excelPackRecommended + ': ' + cachedCount + '（缓存）';
      return true;
    }
    let recommendation = await fetchPackRecommendation(boxKey).catch(() => null);
    if (!recommendation || !recommendation.packCount) {
      recommendation = await requestPackAiEstimate(boxKey, data && data.sku).catch((error) => {
        addLog('warn', '装箱数计算失败', formatErrorMessage(error));
        return null;
      });
    }
    if (!recommendation || !recommendation.packCount) {
      recommendation = calculateLocalPackRecommendation(boxKey);
    }
    const count = recommendation && recommendation.packCount ? String(recommendation.packCount) : '';
    if (!count) return false;
    state.excelPackQty = count;
    const sourceText = recommendation.source === 'local-calc'
      ? '本地计算 56x36x21cm'
      : (recommendation.source || '历史推荐');
    state.excelStatus = L.excelPackRecommended + ': ' + count + '（' + sourceText + '）';
    cachePackRecommendation(data, boxKey, recommendation);
    addLog('success', '已补全装箱数', String(data && data.sku || '') + ' ' + boxKey + ' → ' + count + '（' + sourceText + '）');
    return true;
  }

  async function fillRecommendedPurchasePrice(data, extra) {
    const savedPrice = normalizeLedgerPurchasePrice(data && data.purchasePrice);
    if (savedPrice) {
      state.excelPurchasePrice = savedPrice;
      return false;
    }
    const current = String(state.excelPurchasePrice || '').trim();
    if (current && current !== '6') return false;
    const productType = getProductTypeForInsight(data, extra);
    const cloudRecommendation = await fetchInsightRecommendation(data, productType).catch((error) => {
      addLog('warn', '\u4ef7\u683c\u63a8\u8350\u83b7\u53d6\u5931\u8d25', formatErrorMessage(error));
      return null;
    });
    const recommendedType = cloudRecommendation && cloudRecommendation.recommendedProductType && cloudRecommendation.recommendedProductType !== productType ? cloudRecommendation.recommendedProductType : '';
    const effectiveProductType = recommendedType || (cloudRecommendation && cloudRecommendation.effectiveProductType) || productType;
    if (recommendedType) {
      addLog('success', '\u5df2\u6839\u636e\u5386\u53f2\u5546\u54c1\u540d\u63a8\u65ad\u7c7b\u578b', (data && data.sku || '') + ' ' + productType + ' -> ' + recommendedType);
    }
    const recommendation = cloudRecommendation && cloudRecommendation.recommendedPrice ? cloudRecommendation : getLocalPriceRecommendation(data, effectiveProductType);
    const price = recommendation && recommendation.recommendedPrice ? String(recommendation.recommendedPrice) : '';
    if (!price) return false;
    const reason = recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, effectiveProductType);
    const confidenceText = recommendation.priceConfidence || recommendation.recommendationConfidence || '';
    const priceStatsText = formatRecommendationPriceStats(recommendation.priceStats);
    state.excelPurchasePrice = price;
    state.excelStatus = '\u63a8\u8350\u4ef7\u683c: ' + price + (effectiveProductType ? ' / ' + effectiveProductType : '') + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (recommendation.source ? ' / ' + recommendation.source : '') + (reason ? ' / ' + reason : '');
    addLog('success', '\u5df2\u667a\u80fd\u8865\u5168\u91c7\u8d2d\u4ef7\u683c', (data && data.sku || '') + ' ' + effectiveProductType + ' ' + price + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (priceStatsText ? ' / ' + priceStatsText : '') + (reason ? ' / ' + reason : ''));
    syncInsightEvent('recommendation', {
      sku: data && data.sku || '',
      brand: data && data.brand || '',
      name: data && data.name || '',
      productType: effectiveProductType || productType || '',
      price,
      recommendedPrice: price,
      source: recommendation.source || 'recommendation',
      reason,
      recommendationReason: reason,
      productTypeSource: recommendation.productTypeSource || '',
      productTypeScore: recommendation.productTypeScore || '',
      typeSampleCount: recommendation.typeSampleCount || '',
      recommendedProductType: recommendation.recommendedProductType || '',
      effectiveProductType,
      priceConfidence: confidenceText,
      recommendationConfidence: confidenceText,
      priceStats: recommendation.priceStats || null,
    });
    return true;
  }

  function formatRecommendationPriceStats(stats) {
    if (!stats || !stats.count) return '';
    return '\u6837\u672c' + stats.count + ' / \u4e2d\u4f4d' + stats.median + ' / \u5747\u4ef7' + stats.avg + ' / \u533a\u95f4' + stats.min + '-' + stats.max;
  }

  function buildLocalRecommendationReason(recommendation, productType) {
    if (!recommendation || !recommendation.recommendedPrice) return '';
    if (recommendation.source === 'local-same-sku') return '\u672c\u5730\u540c SKU \u5386\u53f2\u4ef7';
    if (recommendation.source === 'local-same-type') return '\u672c\u5730\u540c\u7c7b\u578b\u5386\u53f2\u4ef7' + (productType ? '\uff1a' + productType : '');
    if (recommendation.source === 'local-name') return '\u672c\u5730\u76f8\u4f3c\u5546\u54c1\u540d\u5386\u53f2\u4ef7';
    return '';
  }

  function getLocalPriceRecommendation(data, productType) {
    const history = state.insights && Array.isArray(state.insights.priceHistory) ? state.insights.priceHistory : [];
    if (!history.length || !data) return null;
    const sku = String(data.sku || '');
    const name = String(data.name || '').trim();
    const valid = history.map((item) => ({
      ...item,
      numericPrice: Number(String(item.price || '').replace(/[^0-9.]/g, '')),
    })).filter((item) => item.numericPrice > 0);
    const sameSku = valid.find((item) => sku && item.sku === sku);
    if (sameSku) return { recommendedPrice: sameSku.numericPrice, source: 'local-same-sku' };
    const sameType = valid.find((item) => productType && item.productType === productType);
    if (sameType) return { recommendedPrice: sameType.numericPrice, source: 'local-same-type' };
    const sameName = valid.find((item) => name && String(item.name || '').includes(name.slice(0, 8)));
    if (sameName) return { recommendedPrice: sameName.numericPrice, source: 'local-name' };
    return null;
  }

  function getReturnDateText(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return '\uff08' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '\uff09';
  }

  function buildExcelKeyword(data, extra) {
    if (state.settings.excelKeywordMode === 'brandName') {
      return [data.brand, data.name || (extra && extra.chineseName)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    return (extra && extra.englishName) || '';
  }

  function buildExcelFileName(data, extra) {
    const parts = [data.brand, data.name || (extra && extra.chineseName), data.sku].map(cleanFileNamePart).filter(Boolean);
    const base = parts.join(' ').replace(/\s+/g, ' ').trim();
    return sanitizeExcelFileName((base || data.sku || 'PLM\u4ea7\u54c1\u4fe1\u606f') + '.xlsx');
  }

  function cleanFileNamePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function sanitizeExcelFileName(filename) {
    const value = String(filename || '').replace(/\.xlsx$/i, '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (value || 'PLM\u4ea7\u54c1\u4fe1\u606f') + '.xlsx';
  }

  function toBrowserDownloadFileName(filename) {
    return sanitizeDownloadFileName(filename).replace(/ /g, '\u00a0');
  }

  function sanitizeDownloadFileName(filename) {
    const raw = String(filename || '').trim();
    const match = raw.match(/(\.[a-z0-9]{2,8})$/i);
    const ext = match ? match[1] : '';
    const stem = (ext ? raw.slice(0, -ext.length) : raw).replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (stem || 'PLM\u6587\u4ef6') + ext;
  }

  async function chooseExcelSaveTarget(filename) {
    if (state.settings.excelDownloadMode === 'direct') return { type: 'download', direct: true };
    const picker = getSaveFilePicker();
    if (!picker) return { type: 'download' };
    try {
      const handle = await picker({
        suggestedName: sanitizeExcelFileName(filename),
        types: [{
          description: 'Excel Workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      return { type: 'fileSystem', handle };
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      console.warn('PLM floating helper save picker failed, fallback to download:', error);
      showToast(L.excelSavePickerUnavailable);
      return { type: 'download' };
    }
  }

  function getSaveFilePicker() {
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.showSaveFilePicker === 'function') {
      return (options) => unsafeWindow.showSaveFilePicker(options);
    }
    if (typeof window.showSaveFilePicker === 'function') return (options) => window.showSaveFilePicker(options);
    return null;
  }

  async function saveExcelBlob(blob, filename, target) {
    if (target && target.type === 'fileSystem' && target.handle) {
      const writable = await target.handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }
    if (!target || !target.direct) showToast(L.excelSavePickerUnavailable);
    downloadBlob(blob, filename);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function fetchImageForExcel(url, fallbackUrl) {
    return new Promise((resolve, reject) => {
      const done = async (arrayBuffer, contentType) => {
        const extension = /png/i.test(contentType || url) ? 'png' : 'jpeg';
        const dataUrl = 'data:image/' + extension + ';base64,' + arrayBufferToBase64(arrayBuffer);
        const size = await getImageSize(dataUrl).catch(() => ({ width: 118, height: 64 }));
        resolve({ dataUrl, extension, width: size.width, height: size.height });
      };
      const request = (targetUrl, allowFallback) => {
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            responseType: 'arraybuffer',
            timeout: 8000,
            onload: (res) => {
              if (res.status >= 200 && res.status < 300) done(res.response, res.responseHeaders || targetUrl);
              else if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
              else reject(new Error('image status ' + res.status));
            },
            onerror: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request failed')),
            ontimeout: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request timeout')),
          });
          return;
        }
        fetchWithTimeout(targetUrl, 8000).then((res) => {
          if (!res.ok) throw new Error('image status ' + res.status);
          return res.arrayBuffer().then((buffer) => done(buffer, res.headers.get('content-type') || targetUrl));
        }).catch((error) => {
          if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
          else reject(error);
        });
      };
      request(url, true);
    });
  }

  function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  function getImageSize(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function getExcelImageAnchor(imageInfo) {
    const boxWidth = 170;
    const boxHeight = 124;
    const width = Number(imageInfo.width) || boxWidth;
    const height = Number(imageInfo.height) || boxHeight;
    const ratio = Math.min(boxWidth / width, boxHeight / height);
    const fitWidth = Math.max(1, Math.round(width * ratio));
    const fitHeight = Math.max(1, Math.round(height * ratio));
    return {
      tl: { col: 2.12, row: 3.06 },
      ext: { width: fitWidth, height: fitHeight },
      editAs: 'oneCell',
    };
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function downloadBlob(blob, filename) {
    const safeName = sanitizeDownloadFileName(filename);
    const browserName = toBrowserDownloadFileName(safeName);
    const panel = ensurePanel();
    state.ignoreOutsideClickUntil = Date.now() + 1500;
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = browserName;
    panel.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  async function createStoredZipBlob(files, onProgress) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((Math.floor(now.getSeconds() / 2)) & 31);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const nameBytes = encoder.encode(String(file.path || file.filename || ('file-' + index)));
      const data = new Uint8Array(await file.blob.arrayBuffer());
      if (data.byteLength > 0xffffffff || offset > 0xffffffff) throw new Error('ZIP file is too large');
      const crc = crc32Bytes(data);
      const local = new Uint8Array(30);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.byteLength, true);
      lv.setUint32(22, data.byteLength, true);
      lv.setUint16(26, nameBytes.byteLength, true);
      const central = new Uint8Array(46);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.byteLength, true);
      cv.setUint32(24, data.byteLength, true);
      cv.setUint16(28, nameBytes.byteLength, true);
      cv.setUint32(42, offset, true);
      localParts.push(local, nameBytes, data);
      centralParts.push(central, nameBytes);
      offset += local.byteLength + nameBytes.byteLength + data.byteLength;
      if (typeof onProgress === 'function') onProgress(index + 1, files.length);
      await wait(0);
    }
    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    return new Blob(localParts.concat(centralParts, end), { type: 'application/zip' });
  }

  function crc32Bytes(bytes) {
    if (!crc32Bytes.table) {
      crc32Bytes.table = Array.from({ length: 256 }, (_, value) => {
        let entry = value;
        for (let bit = 0; bit < 8; bit += 1) entry = (entry >>> 1) ^ (0xedb88320 & -(entry & 1));
        return entry >>> 0;
      });
    }
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) crc = (crc >>> 8) ^ crc32Bytes.table[(crc ^ bytes[index]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function downloadToyLabelBatchArchive(options) {
    const opts = options || {};
    const memoryFiles = Array.isArray(state.toyLabelBatchFiles) ? state.toyLabelBatchFiles.splice(0) : [];
    const manifest = loadToyLabelExportManifest();
    const persistedFiles = [];
    for (const entry of manifest.files) {
      const blob = await getUploadFile(entry.key).catch((error) => {
        console.warn('PLM floating helper toy label staged file read failed:', error);
        return null;
      });
      if (blob) persistedFiles.push({ sku: entry.sku, filename: entry.filename, blob });
    }
    const files = [];
    const seen = new Set();
    persistedFiles.concat(memoryFiles).forEach((file) => {
      const key = String(file && file.sku || '') + '\u0000' + String(file && file.filename || '');
      if (!file || !file.blob || !file.filename || seen.has(key)) return;
      seen.add(key);
      files.push(file);
    });
    if (!files.length) {
      addLog('warn', '批量玩具标签：没有可打包的 PSD 和图片', '');
      return false;
    }
    const nativeZipFiles = files.map((file) => ({
      ...file,
      path: (cleanFileNamePart(file.sku || '\u73a9\u5177\u6807\u7b7e') || '\u73a9\u5177\u6807\u7b7e') + '/' + sanitizeDownloadFileName(file.filename),
    }));
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u5199\u5165 ZIP', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    const nativeBlob = await createStoredZipBlob(nativeZipFiles, (done, total) => {
      state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + done + '/' + total;
    });
    downloadBlob(nativeBlob, '\u73a9\u5177\u6807\u7b7e\u6279\u91cf\u5305_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;

    const Zip = (typeof JSZip !== 'undefined' && JSZip) || (typeof unsafeWindow !== 'undefined' && unsafeWindow.JSZip);
    if (!Zip) {
      files.forEach((file) => downloadBlob(file.blob, file.filename));
      if (opts.keepStagedFiles) {
        manifest.downloaded = true;
        saveToyLabelExportManifest(manifest);
      } else await clearToyLabelExportManifest(manifest);
      showToast('未加载压缩组件，已逐个下载玩具标签文件');
      return false;
    }
    const zip = new Zip();
    let validCount = 0;
    files.forEach((file) => {
      if (!file || !file.blob || !file.filename) return;
      const folder = cleanFileNamePart(file.sku || '玩具标签') || '玩具标签';
      zip.file(folder + '/' + sanitizeDownloadFileName(file.filename), file.blob);
      validCount += 1;
    });
    if (!validCount) {
      addLog('warn', '批量玩具标签：文件内容不完整', '');
      return false;
    }
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u7ec4\u88c5 ZIP', validCount + '\u4e2a\u6587\u4ef6');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true }, (metadata) => {
      const percent = Math.floor(Number(metadata && metadata.percent) || 0);
      if (percent > 0 && percent % 25 === 0) state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + percent + '%';
    });
    downloadBlob(blob, '玩具标签批量包_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', validCount + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function parseSearchTokens(query) {
    const source = String(query || '');
    const skuTokens = source.match(/SKU\d+/ig) || [];
    if (skuTokens.length > 1) {
      return Array.from(new Set(skuTokens.map((token) => token.toLowerCase())));
    }
    return Array.from(new Set(source.split(/[\s,，;；、|/\\]+/).map((token) => token.trim().toLowerCase()).filter(Boolean)));
  }

  function normalizeSearchInput(value) {
    return String(value || '').replace(/[\r\n,，;；、|/\\]+/g, ' ').replace(/\s+/g, ' ').trimStart();
  }

  function matchesSearchItem(item, tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    if (!queryTokens.length) return true;
    if ([item.sku, item.brand, item.name, item.packageCode, item.printCode].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)))) return true;
    const data = loadData(item.sku);
    if (!data) return false;
    return [data.brand, data.name, data.packageCode, data.printCode].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)));
  }

  function getSearchMatches(tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    const sortedItems = getSortedIndex();
    return queryTokens.length ? sortedItems.filter((item) => matchesSearchItem(item, queryTokens)) : sortedItems;
  }

  function exportCache() {
    const payload = buildCachePayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-floating-helper-cache-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  function exportInsights() {
    const payload = buildInsightsPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-floating-helper-insights-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    addLog('success', '\u5df2\u5bfc\u51fa\u6570\u636e\u6d1e\u5bdf', payload.exportedAt);
  }

  function buildInsightsPayload() {
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      insights: state.insights || emptyInsights(),
      promptHint: '\u8bf7\u6574\u7406\u4ef7\u683c\u5386\u53f2\u3001\u5546\u54c1\u7c7b\u578b\u89c4\u5f8b\u548c\u5b57\u6bb5\u7f3a\u5931\u539f\u56e0\uff0c\u8f93\u51fa\u9002\u5408\u5bfc\u5165\u98de\u4e66\u8868\u683c\u7684\u7ed3\u6784\u5316\u8868\u683c\u3002',
    };
  }

  async function refreshCloudInsightSummary() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u4e91\u7aef\u6458\u8981...';
    renderShell();
    try {
      const summary = await fetchInsightSummary();
      const totalText = formatCloudInsightTotals(summary && summary.totals);
      const typeCount = summary && Array.isArray(summary.productTypes) ? summary.productTypes.length : 0;
      state.insightCloudStatus = '\u4e91\u7aef\uff1a' + totalText + '\uff0c\u7c7b\u578b ' + typeCount + '\u7c7b';
      addLog('success', '\u4e91\u7aef\u6d1e\u5bdf\u6458\u8981\u5df2\u66f4\u65b0', state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u6458\u8981\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u6458\u8981\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function checkCloudInsightReadiness() {
    state.insightCloudStatus = '\u6b63\u5728\u4f53\u68c0\u4e91\u7aef\u6d1e\u5bdf\u94fe\u8def...';
    renderShell();
    try {
      const response = await fetchInsightReadiness();
      state.insightReadiness = response || null;
      const checks = Array.isArray(response && response.checks) ? response.checks : [];
      const passed = checks.filter((item) => item.ok).length;
      const failed = checks.length - passed;
      const blockers = (response && response.blockers || []).map((item) => item.label + '\uff1a' + item.detail).join(' / ');
      state.insightCloudStatus = (response && response.ready ? '\u6d1e\u5bdf\u94fe\u8def\u5df2\u5c31\u7eea' : '\u6d1e\u5bdf\u94fe\u8def\u672a\u5c31\u7eea') +
        '\uff1a' + passed + '/' + checks.length + '\u9879\u901a\u8fc7' + (failed ? '\uff0c\u7f3a\u53e3 ' + blockers : '');
      copyText(formatInsightReadinessReport(response));
      addLog(response && response.ready ? 'success' : 'warn', '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0', state.insightCloudStatus);
      showToast(state.insightCloudStatus + '\uff0c\u62a5\u544a\u5df2\u590d\u5236');
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatInsightReadinessReport(response) {
    const checks = Array.isArray(response && response.checks) ? response.checks : [];
    const blockers = Array.isArray(response && response.blockers) ? response.blockers : [];
    const totals = response && response.totals ? response.totals : {};
    const lines = [
      'PLM \u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0',
      '\u751f\u6210\u65f6\u95f4\uff1a' + new Date().toLocaleString(),
      '\u603b\u72b6\u6001\uff1a' + (response && response.ready ? '\u5df2\u5c31\u7eea' : '\u672a\u5c31\u7eea'),
      '\u4e8b\u4ef6\u7edf\u8ba1\uff1a' + Object.keys(totals).map((key) => key + '=' + totals[key]).join(' / '),
      '',
      '\u68c0\u67e5\u9879',
    ];
    checks.forEach((item) => {
      lines.push((item.ok ? '\u901a\u8fc7' : '\u672a\u901a\u8fc7') + '\t' + (item.label || item.key || '') + '\t' + (item.detail || ''));
    });
    lines.push('', '\u963b\u585e\u9879');
    if (blockers.length) {
      blockers.forEach((item) => lines.push((item.label || item.key || '') + '\t' + (item.detail || '')));
    } else {
      lines.push('\u65e0');
    }
    return lines.join('\n');
  }

  async function copyCloudInsightReport() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u4e91\u7aef\u603b\u7ed3...';
    renderShell();
    try {
      const response = await fetchInsightReport();
      const report = response && response.report ? response.report : '';
      if (!report) throw new Error('empty report');
      state.insightCloudReport = report;
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5df2\u590d\u5236\uff0c\u53ef\u76f4\u63a5\u8d34\u5230 AI \u6216\u98de\u4e66\u8868\u683c';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function syncCloudInsightToFeishu() {
    state.insightCloudStatus = '\u6b63\u5728\u540c\u6b65\u5230\u98de\u4e66\uff08\u542b AI \u6574\u7406\uff09...';
    renderShell();
    try {
      const response = await syncInsightFeishu();
      if (!response || response.ok === false) throw buildCloudError(response || { error: 'feishu sync failed' }, 200);
      state.insightCloudStatus = '\u98de\u4e66\u540c\u6b65\u5b8c\u6210\uff1a' + (response.inserted || 0) + '\u6761' + (response.skipped ? '\uff0c\u8df3\u8fc7\u5df2\u540c\u6b65 ' + response.skipped + '\u6761' : '') + formatFeishuPreviewSuffix(response.preview);
      addLog('success', '\u98de\u4e66\u540c\u6b65\u5b8c\u6210', String(response.inserted || 0) + '\u6761' + (response.skipped ? ' / skipped ' + response.skipped : ''));
      showToast(state.insightCloudStatus);
    } catch (error) {
      if (isRecoverableFeishuSyncError(error)) {
        addLog('warn', '\u98de\u4e66\u76f4\u5199\u4e0d\u53ef\u7528\uff0c\u5df2\u56de\u9000\u590d\u5236\u8868\u683c', formatFeishuSyncErrorDetail(error));
        await copyCloudInsightFeishuTable({ fallbackFromSync: true, reason: formatFeishuSyncErrorDetail(error) });
      } else {
        state.insightCloudStatus = '\u98de\u4e66\u540c\u6b65\u5931\u8d25\uff1a' + formatErrorMessage(error);
        addLog('warn', '\u98de\u4e66\u540c\u6b65\u5931\u8d25', formatErrorMessage(error));
        showToast(state.insightCloudStatus);
      }
    }
    renderShell();
  }

  async function checkCloudInsightFeishuStatus() {
    state.insightCloudStatus = '\u6b63\u5728\u68c0\u67e5\u98de\u4e66\u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightFeishuStatus();
      if (response && response.configured) {
        const preview = await fetchInsightFeishuPreview().catch(() => null);
        state.insightCloudStatus = '\u98de\u4e66\u914d\u7f6e\u5df2\u5b8c\u6574\uff0c\u5b57\u6bb5\uff1a' + (response.requiredFields || []).join(' / ') + formatFeishuPreviewSuffix(preview);
        addLog('success', '\u98de\u4e66\u914d\u7f6e\u68c0\u67e5\u901a\u8fc7');
      } else {
        const preview = await fetchInsightFeishuPreview().catch(() => null);
        state.insightCloudStatus = formatFeishuSetupStatus(response);
        if (preview) state.insightCloudStatus += '\n\n\u5f85\u5199\u5165\u9884\u89c8\uff1a' + formatFeishuPreviewText(preview);
        copyText(state.insightCloudStatus);
        addLog('warn', '\u98de\u4e66\u914d\u7f6e\u4e0d\u5b8c\u6574', state.insightCloudStatus);
        showToast('\u98de\u4e66\u914d\u7f6e\u547d\u4ee4\u5df2\u590d\u5236');
      }
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u98de\u4e66\u914d\u7f6e\u68c0\u67e5\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u98de\u4e66\u914d\u7f6e\u68c0\u67e5\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightFeishuSetup() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u98de\u4e66\u5efa\u8868\u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightFeishuStatus();
      const text = formatFeishuSetupStatus(response);
      if (!text) throw new Error('empty feishu setup');
      state.insightCloudStatus = '\u98de\u4e66\u5efa\u8868\u5b57\u6bb5\u548c Worker secrets \u547d\u4ee4\u5df2\u590d\u5236';
      copyText(text);
      addLog('success', '\u5df2\u590d\u5236\u98de\u4e66\u914d\u7f6e\u6307\u5357');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u98de\u4e66\u914d\u7f6e\u751f\u6210\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u98de\u4e66\u914d\u7f6e\u751f\u6210\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatFeishuSetupStatus(response) {
    if (response && response.setupGuide) return response.setupGuide;
    const missing = (response && response.missing || []).join(' / ') || '\u672a\u77e5';
    const tableMissing = (response && response.tableMissingFields || []).join(' / ');
    const checkError = response && response.checkError ? String(response.checkError) : '';
    const fields = (response && response.requiredFields || []).join(' / ');
    const schema = Array.isArray(response && response.requiredFieldSchema)
      ? response.requiredFieldSchema.map((field) => [field.name || '', field.type || '', field.note || ''].join('\t')).join('\n')
      : '';
    const commands = (response && response.setupCommands || []).join('\n');
    return [
      '\u98de\u4e66\u7f3a\u914d\u7f6e\uff1a' + missing,
      tableMissing ? '\u98de\u4e66\u8868\u7f3a\u5b57\u6bb5\uff1a' + tableMissing : '',
      checkError ? '\u98de\u4e66\u68c0\u67e5\u9519\u8bef\uff1a' + checkError : '',
      fields ? '\u9700\u8981\u5efa\u8868\u5b57\u6bb5\uff1a' + fields : '',
      schema ? '\u5b57\u6bb5\u6a21\u677f\uff1a\n\u5b57\u6bb5\u540d\t\u5efa\u8bae\u7c7b\u578b\t\u7528\u9014\n' + schema : '',
      commands ? '\u914d\u7f6e\u547d\u4ee4\uff1a\n' + commands : '',
    ].filter(Boolean).join('\n');
  }

  function formatFeishuPreviewSuffix(preview) {
    const text = formatFeishuPreviewText(preview);
    return text ? '\uff1b' + text : '';
  }

  function formatFeishuPreviewText(preview) {
    if (!preview || typeof preview !== 'object') return '';
    const total = Number(preview.totalRecords || 0);
    const unsynced = Number(preview.unsyncedRecords || 0);
    const skipped = Number(preview.skippedRecords || 0);
    const types = preview.unsyncedRecordTypes || preview.recordTypes || {};
    const typeText = Object.keys(types).map((key) => key + ' ' + types[key]).join(' / ');
    const sampleText = formatFeishuPreviewSamples(preview.samplesByType);
    return '\u5171 ' + total + '\u6761\uff0c\u5f85\u5199\u5165 ' + unsynced + '\u6761' + (skipped ? '\uff0c\u5df2\u8df3\u8fc7 ' + skipped + '\u6761' : '') + (typeText ? '\uff0c' + typeText : '') + (sampleText ? '\n' + sampleText : '');
  }

  function formatFeishuPreviewSamples(samplesByType) {
    if (!samplesByType || typeof samplesByType !== 'object') return '';
    return Object.keys(samplesByType).slice(0, 6).map((type) => {
      const group = samplesByType[type] || {};
      const samples = Array.isArray(group.samples) ? group.samples : [];
      const sample = samples[0] || {};
      const brief = [sample.sku || '', sample.summary || ''].filter(Boolean).join(' ');
      return type + '\uff1a' + (group.count || samples.length || 0) + '\u6761' + (brief ? '\uff0c\u4f8b\uff1a' + brief : '');
    }).join('\n');
  }

  async function checkCloudInsightAiStatus() {
    state.insightCloudStatus = '\u6b63\u5728\u68c0\u67e5 AI \u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightAiStatus();
      state.insightCloudStatus = response && response.configured
        ? (response.provider === 'modelscope' && !response.primaryConfigured && response.fallbackConfigured
          ? '\u9b54\u642d Token \u672a\u914d\u7f6e\uff0cGemini \u515c\u5e95\u53ef\u7528'
          : 'AI \u5df2\u914d\u7f6e\uff1a' + [response.provider || '', response.model || ''].filter(Boolean).join(' / '))
        : 'AI \u672a\u914d\u7f6e\uff0c\u5c06\u4f7f\u7528\u89c4\u5219\u7248\u603b\u7ed3';
      addLog(response && response.configured ? 'success' : 'warn', 'AI \u914d\u7f6e\u68c0\u67e5', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = 'AI \u914d\u7f6e\u68c0\u67e5\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u914d\u7f6e\u68c0\u67e5\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightAiReport() {
    state.insightCloudStatus = '\u6b63\u5728\u8bf7\u6c42 AI \u6574\u7406\u6570\u636e...';
    renderShell();
    try {
      const response = await fetchInsightAiReport({ refresh: true });
      const report = response && response.report ? response.report : '';
      if (!report) throw new Error('empty ai report');
      state.insightCloudReport = report;
      state.insightCloudStatus = response.source && response.source !== 'fallback'
        ? 'AI \u6574\u7406\u5df2\u590d\u5236'
        : 'AI \u6682\u4e0d\u53ef\u7528\uff0c\u5df2\u590d\u5236\u89c4\u5219\u7248\u603b\u7ed3';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236 AI \u6d1e\u5bdf\u6574\u7406', response.source || '');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = 'AI \u6574\u7406\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u6d1e\u5bdf\u6574\u7406\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightRules() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u6e05\u6d17\u89c4\u5219\u5019\u9009...';
    renderShell();
    try {
      const response = await fetchInsightRules();
      const text = response && response.tsv ? response.tsv : '';
      if (!text) throw new Error('empty rules');
      const pkg = response && response.rulePackage;
      if (pkg && Array.isArray(pkg.maintainedRules)) {
        state.maintainedCleaningRules = pkg.maintainedRules;
        state.maintainedCleaningRulesLoaded = true;
      }
      state.insightCloudStatus = pkg
        ? '\u6e05\u6d17\u89c4\u5219\u5019\u9009\u5df2\u590d\u5236\uff1a\u5171 ' + (pkg.total || 0) + '\u6761\uff0c\u9700\u5904\u7406 ' + (pkg.actionableCount || 0) + '\u6761\uff0c\u7591\u4f3c PLM \u7a7a\u503c ' + (pkg.likelyPlmEmptyCount || 0) + '\u6761'
        : '\u6e05\u6d17\u89c4\u5219\u5019\u9009\u5df2\u590d\u5236';
      copyText(text);
      addLog('success', '\u5df2\u590d\u5236\u6e05\u6d17\u89c4\u5219\u5019\u9009', state.insightCloudStatus);
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u6e05\u6d17\u89c4\u5219\u751f\u6210\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u6e05\u6d17\u89c4\u5219\u751f\u6210\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function refreshMaintainedCleaningRules() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u4e91\u7aef\u6e05\u6d17\u89c4\u5219...';
    renderShell();
    try {
      const response = await fetchMaintainedCleaningRules();
      state.maintainedCleaningRules = Array.isArray(response && response.rules) ? response.rules : [];
      state.maintainedCleaningRulesLoaded = true;
      state.insightCloudStatus = '\u4e91\u7aef\u6e05\u6d17\u89c4\u5219\uff1a' + state.maintainedCleaningRules.length + '\u6761';
      addLog('success', '\u4e91\u7aef\u6e05\u6d17\u89c4\u5219\u5df2\u5237\u65b0', state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u6e05\u6d17\u89c4\u5219\u5237\u65b0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u6e05\u6d17\u89c4\u5219\u5237\u65b0\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function summarizeCloudClassificationRules() {
    const samples = collectUnclassifiedClassificationSamples(300);
    if (!samples.length) {
      state.insightCloudStatus = '\u6682\u65e0\u672a\u5206\u7c7b\u4ea7\u54c1';
      renderShell();
      showToast(state.insightCloudStatus);
      return;
    }
    state.insightCloudStatus = '\u6b63\u5728\u8ba9 AI \u603b\u7ed3\u524d ' + samples.length + ' \u6761\u672a\u5206\u7c7b\u4ea7\u54c1...';
    renderShell();
    try {
      const response = await fetchClassificationSummarize(samples);
      const rules = Array.isArray(response && response.rules) ? response.rules : [];
      state.classificationRules = rules;
      const warning = response && response.warning ? '\uff0c\u515c\u5e95\uff1a' + response.warning : '';
      state.insightCloudStatus = '\u5206\u7c7b\u89c4\u5219\u5df2\u751f\u6210\uff1a' + rules.length + '\u6761\uff0c\u672a\u5206\u7c7b\u6837\u672c ' + (response.sampleCount || 0) + '\u6761\uff0c\u6765\u6e90 ' + (response.sampleSource || response.source || '') + warning;
      addLog(response && response.warning ? 'warn' : 'success', 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  function collectUnclassifiedClassificationSamples(limit) {
    const result = [];
    (state.index || []).some((item) => {
      if (result.length >= (Number(limit) || 300)) return true;
      const sku = item && item.sku ? String(item.sku) : '';
      if (!sku) return false;
      const data = normalizeData(loadData(sku) || item);
      if (!data || !data.sku) return false;
      const explicitType = String(data.aiProductType || data.aiCategory || '').trim();
      if (explicitType && !/^\u672a\u5206\u7c7b$/i.test(explicitType)) return false;
      const name = String(data.name || item.name || '').trim();
      if (!name) return false;
      result.push({ sku: data.sku, brand: data.brand || '', name, productType: '' });
      return false;
    });
    return result;
  }

  async function viewCloudClassificationRules() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u5206\u7c7b\u89c4\u5219...';
    renderShell();
    try {
      const response = await fetchClassificationRules();
      const rules = Array.isArray(response && response.rules) ? response.rules : [];
      state.classificationRules = rules;
      const text = formatClassificationRulesForCopy(rules);
      copyText(text || '\u6682\u65e0\u5206\u7c7b\u89c4\u5219');
      state.insightCloudStatus = '\u5206\u7c7b\u89c4\u5219\u5df2\u590d\u5236\uff1a' + rules.length + '\u6761';
      addLog('success', '\u5df2\u67e5\u770b\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u67e5\u770b\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u67e5\u770b\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  async function applyCloudClassificationRulesToLocal() {
    state.insightCloudStatus = '\u6b63\u5728\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219...';
    renderShell();
    try {
      let rules = Array.isArray(state.classificationRules) && state.classificationRules.length ? state.classificationRules : [];
      if (!rules.length) {
        const response = await fetchClassificationRules();
        rules = Array.isArray(response && response.rules) ? response.rules : [];
        state.classificationRules = rules;
      }
      const result = applyClassificationRulesToLocalCache(rules);
      state.insightCloudStatus = '\u5df2\u91cd\u65b0\u5e94\u7528\u89c4\u5219\uff1a\u66f4\u65b0 ' + result.updated + '/' + result.total + '\u4e2a\u7f16\u7801';
      addLog('success', '\u5df2\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  async function updateMaintainedCleaningRuleStatus(ruleId, action) {
    if (!ruleId) return;
    const status = action === 'insights-rule-done'
      ? '\u5df2\u5904\u7406'
      : (action === 'insights-rule-ignore' ? '\u5ffd\u7565' : '\u81ea\u52a8');
    state.insightCloudStatus = '\u6b63\u5728\u66f4\u65b0\u89c4\u5219\u72b6\u6001...';
    renderShell();
    try {
      const response = await updateCleaningRuleStatus(ruleId, status);
      if (!response || response.ok === false) throw new Error(response && response.error ? response.error : 'rule status failed');
      await refreshMaintainedCleaningRules();
      state.insightCloudStatus = '\u89c4\u5219\u72b6\u6001\u5df2\u66f4\u65b0\uff1a' + status;
      addLog('success', '\u6e05\u6d17\u89c4\u5219\u72b6\u6001\u5df2\u66f4\u65b0', ruleId + ' -> ' + status);
      showToast(state.insightCloudStatus);
      renderShell();
    } catch (error) {
      state.insightCloudStatus = '\u89c4\u5219\u72b6\u6001\u66f4\u65b0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u6e05\u6d17\u89c4\u5219\u72b6\u6001\u66f4\u65b0\u5931\u8d25', ruleId + ' ' + formatErrorMessage(error));
      renderShell();
    }
  }

  async function copyCloudInsightFeishuTable(options) {
    const opts = options || {};
    state.insightCloudStatus = opts.fallbackFromSync ? '\u98de\u4e66\u76f4\u5199\u672a\u914d\u7f6e\uff0c\u6b63\u5728\u590d\u5236\u53ef\u7c98\u8d34\u8868\u683c...' : '\u6b63\u5728\u751f\u6210\u98de\u4e66\u8868\u683c\u6570\u636e...';
    renderShell();
    try {
      const response = await fetchInsightFeishuTsv();
      const tsv = response && response.tsv ? response.tsv : '';
      if (!tsv) throw new Error('empty tsv');
      state.insightCloudStatus = opts.fallbackFromSync
        ? '\u98de\u4e66\u76f4\u5199\u4e0d\u53ef\u7528\uff0c\u5df2\u6539\u4e3a\u590d\u5236\u8868\u683c\u6570\u636e\uff0c\u76f4\u63a5\u7c98\u8d34\u5230\u8868\u683c\u5373\u53ef' + (opts.reason ? '\uff1b\u539f\u56e0\uff1a' + opts.reason : '')
        : '\u98de\u4e66\u8868\u683c\u6570\u636e\u5df2\u590d\u5236\uff0c\u76f4\u63a5\u7c98\u8d34\u5230\u8868\u683c\u5373\u53ef\u5206\u5217';
      copyText(tsv);
      addLog('success', opts.fallbackFromSync ? '\u98de\u4e66\u540c\u6b65\u56de\u9000\u4e3a\u590d\u5236\u8868\u683c' : '\u5df2\u590d\u5236\u98de\u4e66\u8868\u683c\u6570\u636e');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u98de\u4e66\u8868\u683c\u6570\u636e\u751f\u6210\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u98de\u4e66\u8868\u683c\u6570\u636e\u751f\u6210\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatCloudInsightTotals(totals) {
    if (!Array.isArray(totals) || !totals.length) return '\u6682\u65e0\u4e8b\u4ef6';
    return totals.map((item) => {
      const label = item.event_type === 'price' ? '\u4ef7\u683c' : (item.event_type === 'issue' ? '\u5f02\u5e38' : item.event_type);
      return label + ' ' + item.count;
    }).join(' / ');
  }

  function getTodayKey() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  function normalizeLedgerDate(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return '';
    return [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-');
  }

  function shiftDateKey(value, delta) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const date = new Date(key + 'T00:00:00');
    date.setDate(date.getDate() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function shiftLedgerMonth(value, delta) {
    const month = normalizeLedgerMonth(value || getTodayKey());
    const match = month.match(/^(\d{4})-(\d{2})$/);
    const date = new Date(match ? Number(match[1]) : new Date().getFullYear(), match ? Number(match[2]) - 1 : new Date().getMonth(), 1);
    date.setMonth(date.getMonth() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), '01'].join('-');
  }

  function formatLedgerDateLabel(value) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const parts = key.split('-');
    return Number(parts[1]) + '\u6708' + Number(parts[2]) + '\u65e5';
  }

  function formatLedgerMinuteLabel(value, fallbackDate) {
    const ms = parseLedgerDateTimeMs(value);
    if (ms) {
      const date = new Date(ms);
      return (date.getMonth() + 1) + '\u6708' + date.getDate() + '\u65e5 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
    return formatLedgerDateLabel(fallbackDate || value);
  }

  function getNowLedgerMinuteLabel() {
    return formatLedgerMinuteLabel(Date.now());
  }

  function parseLedgerDateTimeMs(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    const text = String(value || '').trim();
    if (!text || text === '--') return 0;
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (full) {
      const date = new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]), Number(full[4] || 0), Number(full[5] || 0), 0, 0);
      return date.getTime();
    }
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (cn) {
      const date = new Date(new Date().getFullYear(), Number(cn[1]) - 1, Number(cn[2]), Number(cn[3] || 0), Number(cn[4] || 0), 0, 0);
      return date.getTime();
    }
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseLedgerDateFromText(value) {
    const text = String(value || '').trim();
    if (!text || text === '--') return '';
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (full) return [full[1], full[2].padStart(2, '0'), full[3].padStart(2, '0')].join('-');
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5/);
    if (cn) return [String(new Date().getFullYear()), cn[1].padStart(2, '0'), cn[2].padStart(2, '0')].join('-');
    return normalizeLedgerDate(text);
  }

  function getMonthKeyFromDateKey(value) {
    const key = normalizeLedgerDate(value) || parseLedgerDateFromText(value) || getTodayKey();
    return key.slice(0, 7);
  }

  function normalizeLedgerMonth(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})$/);
    if (match) return match[1] + '-' + match[2].padStart(2, '0');
    return getMonthKeyFromDateKey(text);
  }

  function getCurrentLedgerMonth() {
    return normalizeLedgerMonth(state.ledgerDate || getTodayKey());
  }

  function getLedgerDesignDate(record) {
    return parseLedgerDateFromText(record && record.designAssignedAt) || normalizeLedgerDate(record && record.date) || getTodayKey();
  }

  function getLedgerFinalizedDate(record) {
    return normalizeLedgerDate(record && record.finalizedDate)
      || parseLedgerDateFromText(record && record.finalizedAt)
      || (record && record.status === '作废' ? parseLedgerDateFromText(record.updatedAt) : '')
      || getLedgerDesignDate(record);
  }

  function isLedgerFinalizedRecord(record) {
    return Boolean(record && (record.finalizedAt || record.status === '作废'));
  }

  function loadDailyLedger() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_KEY) || 'null');
      return sanitizeLedgerRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedger() {
    try {
      state.ledgerRecords = sanitizeLedgerRecords(state.ledgerRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_KEY, state.ledgerRecords);
      else localStorage.setItem(DAILY_LEDGER_KEY, JSON.stringify(state.ledgerRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger save failed:', error);
    }
  }

  function startDailyLedgerSync() {
    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(DAILY_LEDGER_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerRecords = filterLedgerRecordsNotInTrash(newValue);
        if (state.view === 'ledger') renderShell();
      });
      GM_addValueChangeListener(DAILY_LEDGER_TRASH_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerTrashRecords = sanitizeLedgerTrashRecords(newValue);
        state.ledgerRecords = filterLedgerRecordsNotInTrash(state.ledgerRecords);
        if (state.view === 'ledger') renderShell();
      });
    }
    window.addEventListener('storage', (event) => {
      if (event.key !== DAILY_LEDGER_KEY || typeof GM_getValue === 'function') return;
      try {
        state.ledgerRecords = filterLedgerRecordsNotInTrash(JSON.parse(event.newValue || '[]'));
        if (state.view === 'ledger') renderShell();
      } catch (_) {}
    });
  }

  function syncDailyLedgerBeforeMutation() {
    state.ledgerTrashRecords = loadDailyLedgerTrash();
    state.ledgerRecords = filterLedgerRecordsNotInTrash(loadDailyLedger()).slice(0, 1200);
  }

  function loadDailyLedgerTrash() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_TRASH_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_TRASH_KEY) || 'null');
      return sanitizeLedgerTrashRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedgerTrash() {
    try {
      state.ledgerTrashRecords = sanitizeLedgerTrashRecords(state.ledgerTrashRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_TRASH_KEY, state.ledgerTrashRecords);
      else localStorage.setItem(DAILY_LEDGER_TRASH_KEY, JSON.stringify(state.ledgerTrashRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger trash save failed:', error);
    }
  }

  function sanitizeLedgerTrashRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => {
      const record = sanitizeLedgerRecords([item])[0];
      if (!record) return null;
      return {
        ...record,
        removedAt: String(item.removedAt || item.updatedAt || new Date().toLocaleString()).slice(0, 80),
        removedAtMs: Number(item.removedAtMs || item.updatedAtMs || 0) || Date.now(),
        purged: Boolean(item.purged),
      };
    }).filter(Boolean);
  }

  function isLedgerRecordTrashed(sku, dateKey) {
    const month = getMonthKeyFromDateKey(normalizeLedgerDate(dateKey) || getTodayKey());
    return (state.ledgerTrashRecords || []).some((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month);
  }

  function filterLedgerRecordsNotInTrash(records) {
    return sanitizeLedgerRecords(records).filter((item) => !isLedgerRecordTrashed(item.sku, item.date));
  }

  function sanitizeLedgerRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => ({
      date: normalizeLedgerDate(item.date) || getTodayKey(),
      sku: String(item.sku || '').slice(0, 80),
      brand: cleanName(item.brand || '').slice(0, 120),
      name: cleanName(item.name || '').slice(0, 220),
      skuImageUrl: String(item.skuImageUrl || '').slice(0, 600),
      benchmarkImageUrl: String(item.benchmarkImageUrl || '').slice(0, 600),
      designType: cleanName(item.designType || '').slice(0, 80),
      artPriority: cleanName(item.artPriority || '').slice(0, 80),
      referenceUrl: String(item.referenceUrl || '').slice(0, 800),
      developerName: cleanName(item.developerName || '').slice(0, 80),
      designAssignedAt: String(item.designAssignedAt || '').slice(0, 80),
      developmentAssignedAt: String(item.developmentAssignedAt || '').slice(0, 80),
      performanceGroupId: String(item.performanceGroupId || '').slice(0, 80),
      performanceType: item.performanceType === 'extension' ? 'extension' : '',
      packageCode: String(item.packageCode || '').slice(0, 120),
      printCode: String(item.printCode || '').slice(0, 180),
      purchasePrice: normalizeLedgerPurchasePrice(item.purchasePrice),
      boxFileState: normalizeLedgerFileState(item.boxFileState, item.boxFileDone),
      labelFileState: normalizeLedgerFileState(item.labelFileState, item.labelFileDone),
      imagePackState: normalizeLedgerFileState(item.imagePackState, item.imagePackDone),
      artworkState: normalizeLedgerArtworkState(item.artworkState),
      boxFileDone: normalizeLedgerFileState(item.boxFileState, item.boxFileDone) === 'done',
      labelFileDone: normalizeLedgerFileState(item.labelFileState, item.labelFileDone) === 'done',
      imagePackDone: normalizeLedgerFileState(item.imagePackState, item.imagePackDone) === 'done',
      filesAutoCompleted: Boolean(item.filesAutoCompleted),
      status: normalizeLedgerStatus(item.status),
      stage: String(item.stage || '').slice(0, 80) || '待定稿',
      imageGeneratedAt: String(item.imageGeneratedAt || '').slice(0, 40),
      imageGeneratedAtMs: Number(item.imageGeneratedAtMs || 0) || parseLedgerDateTimeMs(item.imageGeneratedAt) || 0,
      finalizedAt: String(item.finalizedAt || '').slice(0, 40),
      finalizedDate: normalizeLedgerDate(item.finalizedDate) || '',
      finalizedAtMs: Number(item.finalizedAtMs || 0) || parseLedgerDateTimeMs(item.finalizedAt) || 0,
      note: String(item.note || '').slice(0, 240),
      createdAt: String(item.createdAt || new Date().toLocaleString()).slice(0, 80),
      createdAtMs: Number(item.createdAtMs || item.updatedAtMs || 0) || Date.now(),
      updatedAt: String(item.updatedAt || new Date().toLocaleString()).slice(0, 80),
      updatedAtMs: Number(item.updatedAtMs || 0) || Date.now(),
    })).map(reconcileLedgerFileCompletion).filter((item) => item.sku);
  }

  function normalizeLedgerFileState(value, doneFallback) {
    const text = String(value || '').trim();
    if (/^(pending|done|skip)$/.test(text)) return text;
    if (/^(?:\u5b8c\u6210|\u5df2\u5b8c\u6210|done)$/i.test(text)) return 'done';
    if (/^(?:\u4e0d\u9700\u8981|\u65e0\u9700|\u8df3\u8fc7|skip)$/i.test(text)) return 'skip';
    return doneFallback ? 'done' : 'pending';
  }

  function normalizeLedgerArtworkState(value) {
    return /^(pending|doing|done)$/.test(String(value || '')) ? String(value) : 'pending';
  }

  function normalizeLedgerPurchasePrice(value) {
    const text = String(value === undefined || value === null ? '' : value).trim().replace(/^¥\s*/, '');
    if (!text) return '';
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return '';
    const number = Number(text);
    return Number.isFinite(number) && number >= 0 ? String(number) : '';
  }

  function nextLedgerFileState(value, doneFallback) {
    const current = normalizeLedgerFileState(value, doneFallback);
    if (current === 'pending') return 'done';
    if (current === 'done') return 'skip';
    return 'pending';
  }

  function ledgerFileStateLabel(value) {
    const stateValue = normalizeLedgerFileState(value);
    if (stateValue === 'done') return '\u5df2\u5b8c\u6210';
    if (stateValue === 'skip') return '\u4e0d\u9700\u8981\u5236\u4f5c\u6587\u4ef6';
    return '\u672a\u5b8c\u6210';
  }

  function reconcileLedgerFileCompletion(record) {
    const allFilesDone = ['boxFileState', 'labelFileState', 'imagePackState']
      .every((field) => normalizeLedgerFileState(record[field]) === 'done');
    if (record.finalizedAt && record.status === '已定稿' && allFilesDone) {
      return { ...record, status: '已完成', stage: '完成', filesAutoCompleted: true };
    }
    if (record.filesAutoCompleted && record.status === '已完成' && !allFilesDone) {
      return { ...record, status: '已定稿', stage: '已定稿', filesAutoCompleted: false };
    }
    return record;
  }

  function normalizeLedgerStatus(value) {
    const text = String(value || '').trim();
    return /^(待出图|待定稿|已定稿|制作中|已完成|异常|作废|跳过)$/.test(text) ? text : '待定稿';
  }

  function getLedgerRecordsForMonth(view, monthKey) {
    const month = normalizeLedgerMonth(monthKey || getTodayKey());
    if (view === 'trash') {
      return (state.ledgerTrashRecords || [])
        .filter((item) => !item.purged && getMonthKeyFromDateKey(item.date) === month)
        .sort((a, b) => (b.removedAtMs || b.updatedAtMs || 0) - (a.removedAtMs || a.updatedAtMs || 0));
    }
    const mode = view === 'finalized' ? 'finalized' : 'design';
    return (state.ledgerRecords || [])
      .filter((item) => {
        const finalized = isLedgerFinalizedRecord(item);
        if (mode === 'finalized' && !finalized) return false;
        if (mode === 'design' && finalized) return false;
        const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
        return getMonthKeyFromDateKey(key) === month;
      })
      .sort((a, b) => {
        const dateA = mode === 'finalized' ? getLedgerFinalizedDate(a) : getLedgerDesignDate(a);
        const dateB = mode === 'finalized' ? getLedgerFinalizedDate(b) : getLedgerDesignDate(b);
        if (dateA !== dateB) return dateA < dateB ? 1 : -1;
        if (mode === 'finalized') return (b.finalizedAtMs || b.createdAtMs || 0) - (a.finalizedAtMs || a.createdAtMs || 0);
        return (b.createdAtMs || b.updatedAtMs || 0) - (a.createdAtMs || a.updatedAtMs || 0);
      });
  }

  function groupLedgerRecordsByDate(records, view) {
    const mode = view === 'finalized' ? 'finalized' : 'design';
    const map = new Map();
    (records || []).forEach((item) => {
      const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }

  function shouldSkipLedgerDrawer(drawer) {
    const text = drawer ? compactText(getVisibleText(drawer)).replace(/\s+/g, '') : '';
    return /已完成|已作废|已拒绝/.test(text);
  }

  function hasMeaningfulLedgerRecordChange(previous, next) {
    const ignored = new Set(['updatedAt', 'updatedAtMs']);
    const comparable = (record) => Object.keys(record || {}).sort().reduce((result, key) => {
      if (!ignored.has(key)) result[key] = record[key];
      return result;
    }, {});
    return JSON.stringify(comparable(previous)) !== JSON.stringify(comparable(next));
  }

  function upsertDailyLedgerFromData(data, options) {
    if (!data || !data.sku) return null;
    const opts = options || {};
    if (!opts.skipStorageSync) syncDailyLedgerBeforeMutation();
    const assignedDate = parseLedgerDateFromText(data.designAssignedAt);
    const dateKey = normalizeLedgerDate(opts.date) || assignedDate || getTodayKey();
    if (opts.requireCurrentMonth && assignedDate && getMonthKeyFromDateKey(dateKey) !== getMonthKeyFromDateKey(getTodayKey())) return null;
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    const sku = data.sku;
    const dateMonth = getMonthKeyFromDateKey(dateKey);
    if (!opts.allowTrashRestore && isLedgerRecordTrashed(sku, dateKey)) return null;
    const existing = (state.ledgerRecords || []).find((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === dateMonth);
    const imageUrl = getProductThumbUrl(data) || data.skuImageUrl || data.skuImageFallbackUrl || '';
    const next = {
      ...(existing || {}),
      date: dateKey,
      sku,
      brand: cleanName(data.brand || (existing && existing.brand) || ''),
      name: cleanName(data.name || (existing && existing.name) || ''),
      skuImageUrl: imageUrl || (existing && existing.skuImageUrl) || '',
      benchmarkImageUrl: String(data.benchmarkImageUrl || data.benchmarkImageFallbackUrl || (existing && existing.benchmarkImageUrl) || ''),
      designType: cleanName(data.designType || (existing && existing.designType) || ''),
      artPriority: cleanName(data.artPriority || (existing && existing.artPriority) || ''),
      referenceUrl: String(data.referenceUrl || (existing && existing.referenceUrl) || ''),
      developerName: cleanName(data.developerName || (existing && existing.developerName) || ''),
      designAssignedAt: String(data.designAssignedAt || (existing && existing.designAssignedAt) || ''),
      developmentAssignedAt: String(data.developmentAssignedAt || (existing && existing.developmentAssignedAt) || ''),
      packageCode: String(data.packageCode || (existing && existing.packageCode) || ''),
      printCode: String(data.printCode || (existing && existing.printCode) || ''),
      purchasePrice: normalizeLedgerPurchasePrice(opts.purchasePrice !== undefined ? opts.purchasePrice : (data.purchasePrice || (existing && existing.purchasePrice) || '')),
      boxFileState: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)),
      labelFileState: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)),
      imagePackState: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)),
      artworkState: normalizeLedgerArtworkState(opts.artworkState !== undefined ? opts.artworkState : (existing && existing.artworkState)),
      boxFileDone: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)) === 'done',
      labelFileDone: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)) === 'done',
      imagePackDone: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)) === 'done',
      filesAutoCompleted: opts.filesAutoCompleted !== undefined ? Boolean(opts.filesAutoCompleted) : Boolean(existing && existing.filesAutoCompleted),
      performanceType: opts.performanceType !== undefined ? (opts.performanceType === 'extension' ? 'extension' : '') : ((existing && existing.performanceType) || ''),
      status: normalizeLedgerStatus(opts.status || (existing && existing.status) || '待定稿'),
      stage: opts.stage || (existing && existing.stage) || '待定稿',
      note: opts.note !== undefined ? String(opts.note || '') : ((existing && existing.note) || ''),
      imageGeneratedAt: opts.imageGeneratedAt !== undefined ? String(opts.imageGeneratedAt || '') : ((existing && existing.imageGeneratedAt) || ''),
      imageGeneratedAtMs: opts.imageGeneratedAtMs !== undefined ? (Number(opts.imageGeneratedAtMs || 0) || 0) : (Number(existing && existing.imageGeneratedAtMs) || 0),
      finalizedAt: opts.finalizedAt !== undefined ? String(opts.finalizedAt || '') : ((existing && existing.finalizedAt) || ''),
      finalizedDate: opts.finalizedDate !== undefined ? normalizeLedgerDate(opts.finalizedDate) : ((existing && existing.finalizedDate) || ''),
      finalizedAtMs: opts.finalizedAtMs !== undefined ? (Number(opts.finalizedAtMs || 0) || 0) : (Number(existing && existing.finalizedAtMs) || 0),
      createdAt: (existing && existing.createdAt) || nowText,
      createdAtMs: (existing && existing.createdAtMs) || nowMs,
      updatedAt: nowText,
      updatedAtMs: nowMs,
    };
    const reconciled = reconcileLedgerFileCompletion(next);
    if (opts.skipUnchanged && existing && !hasMeaningfulLedgerRecordChange(existing, reconciled)) return existing;
    state.ledgerRecords = [reconciled].concat((state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === dateMonth))).slice(0, 1200);
    if (!opts.deferSave) saveDailyLedger();
    return reconciled;
  }

  function updateDailyLedgerForSku(sku, patch, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const data = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    return upsertDailyLedgerFromData(data, { ...(patch || {}), date: key });
  }

  function copyLedgerTsv(dateKey) {
    const rows = getLedgerRecordsForMonth('finalized', normalizeLedgerMonth(dateKey || state.ledgerDate)).filter((item) => item.finalizedAt && item.status !== '作废');
    if (!rows.length) {
      showToast('本月没有可复制的已定稿记录');
      return;
    }
    const tsv = rows.map((item) => {
      const productName = [item.brand, item.name].filter(Boolean).join(' ') || item.name || '';
      const mainImageMark = item.skuImageUrl ? '主图' : '';
      const skuImageMark = item.skuImageUrl ? 'SKU图' : '';
      const date = item.finalizedAt || '';
      return [productName, item.sku || '', mainImageMark, date, skuImageMark, date].map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ')).join('\t');
    }).join('\n');
    copyText(tsv);
    showToast('本月登记已复制：' + rows.length + '条');
  }

  function copySelectedFinalizedLedgerSkus() {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const rows = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((item) => selected.has(getLedgerSelectionKey(item)));
    if (!rows.length) {
      showToast('请先勾选需要复制的产品');
      return;
    }
    const skus = Array.from(new Set(rows.map((item) => item.sku).filter(Boolean)));
    copyText(skus.join('\n'));
    showToast('已复制选中编码：' + skus.length + '个');
  }

  function getLedgerSelectionKey(record) {
    return String(record && record.date || '') + '::' + String(record && record.sku || '');
  }

  function toggleLedgerSelection(sku, dateKey) {
    const record = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === normalizeLedgerDate(dateKey));
    if (!record) return;
    const key = getLedgerSelectionKey(record);
    const selected = new Set(state.ledgerSelectedKeys || []);
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    state.ledgerSelectedKeys = Array.from(selected);
    refreshLedgerCard(record);
    refreshLedgerPerformanceMergeButton();
  }

  function toggleLedgerDateSelection(dateKey) {
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth()).filter((item) => getLedgerFinalizedDate(item) === normalizeLedgerDate(dateKey));
    const selected = new Set(state.ledgerSelectedKeys || []);
    const keys = records.map(getLedgerSelectionKey);
    const remove = keys.length && keys.every((key) => selected.has(key));
    keys.forEach((key) => remove ? selected.delete(key) : selected.add(key));
    state.ledgerSelectedKeys = Array.from(selected);
    renderShell();
  }

  function updateSelectedLedgerPerformanceGroups(merge) {
    const selectedKeys = new Set(state.ledgerSelectedKeys || []);
    const selectedRecords = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((record) => selectedKeys.has(getLedgerSelectionKey(record)));
    if (merge && selectedRecords.length < 2) {
      showToast('请至少选择两个编码再合并绩效');
      return;
    }
    if (!merge && !selectedRecords.some((record) => record.performanceGroupId)) {
      showToast('选中的编码尚未合并绩效');
      return;
    }
    const targetKeys = new Set(selectedRecords.map(getLedgerSelectionKey));
    const groupId = merge ? 'performance-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) : '';
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    state.ledgerRecords = (state.ledgerRecords || []).map((record) => targetKeys.has(getLedgerSelectionKey(record))
      ? { ...record, performanceGroupId: groupId, updatedAt: nowText, updatedAtMs: nowMs }
      : record);
    state.ledgerSelectedKeys = [];
    saveDailyLedger();
    renderShell();
    showToast(merge ? '已合并为 1 个绩效单位' : '已取消绩效合并');
  }

  function copySelectedLedgerVideoRows() {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const rows = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth()).filter((item) => selected.has(getLedgerSelectionKey(item)));
    if (!rows.length) {
      showToast('请先选择产品卡片或日期');
      return;
    }
    const person = findCurrentPlmUserName() || state.sizeImageAccessName || String(state.settings.cloudBackupOwnerName || '').trim();
    if (!person) {
      showToast('未识别到当前 PLM 用户姓名，请刷新页面后重试');
      return;
    }
    const text = rows.map((item) => {
      const cached = normalizeData(loadData(item.sku) || {});
      return [person, item.referenceUrl || cached.referenceUrl || '', item.name || cached.name || item.sku]
        .map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ').trim()).join('\t');
    }).join('\n');
    copyText(text);
    showToast('视频申请内容已复制：' + rows.length + '个产品');
  }

  function exportLedgerRecords(dateKey) {
    const month = normalizeLedgerMonth(dateKey || state.ledgerDate);
    const records = getLedgerRecordsForMonth('design', month);
    const payload = { plugin: L.title, version: SCRIPT_VERSION, exportedAt: new Date().toLocaleString(), month, records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-daily-ledger-' + payload.month + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    showToast('本月记录已导出');
  }

  function clearLedgerDate(dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    if (!window.confirm('确定清空 ' + formatLedgerDateLabel(key) + ' 的今日工作台记录吗？')) return;
    state.ledgerRecords = (state.ledgerRecords || []).filter((item) => item.date !== key);
    saveDailyLedger();
    renderShell();
  }

  function updateLedgerFromAction(action, sku, dateKey, options) {
    if (!sku) return;
    syncDailyLedgerBeforeMutation();
    state.ledgerMenuSku = '';
    state.ledgerMenuDate = '';
    if (action === 'ledger-image-generated') {
      state.ledgerFlowTransitionSku = sku;
      window.clearTimeout(state.ledgerFlowTransitionTimer);
      state.ledgerFlowTransitionTimer = window.setTimeout(() => {
        if (state.ledgerFlowTransitionSku !== sku) return;
        state.ledgerFlowTransitionSku = '';
        const current = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === normalizeLedgerDate(dateKey));
        if (current) refreshLedgerCard(current);
      }, 680);
    }
    if (action === 'ledger-remove') {
      const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
      const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
      if (!record) return;
      const nowText = new Date().toLocaleString();
      const nowMs = Date.now();
      const month = getMonthKeyFromDateKey(key);
      state.ledgerTrashRecords = [{ ...record, removedAt: nowText, removedAtMs: nowMs }]
        .concat((state.ledgerTrashRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month)))
        .slice(0, 1200);
      state.ledgerRecords = (state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month));
      state.ledgerSelectedKeys = (state.ledgerSelectedKeys || []).filter((item) => item !== getLedgerSelectionKey(record));
      saveDailyLedger();
      saveDailyLedgerTrash();
      renderShell();
      showToast('已移入垃圾篓，不会再次自动加入');
      return;
    }
    const today = getNowLedgerMinuteLabel();
    const todayKey = getTodayKey();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const patch = action === 'ledger-image-generated'
      ? { status: '待定稿', stage: '待定稿', imageGeneratedAt: today, imageGeneratedAtMs: Date.now(), note: '已出图，等待定稿' }
      : action === 'ledger-unmark-image-generated'
        ? { status: '待出图', stage: '待出图', imageGeneratedAt: '', imageGeneratedAtMs: 0, note: '已撤回出图' }
        : action === 'ledger-unfinalize'
          ? { status: '待定稿', stage: '待定稿', finalizedAt: '', finalizedDate: '', finalizedAtMs: 0, note: '已撤回定稿' }
        : action === 'ledger-extension'
          ? {
            performanceType: existing && existing.performanceType === 'extension' ? '' : 'extension',
            note: existing && existing.performanceType === 'extension' ? '已取消延伸绩效' : '延伸绩效按 0.3 计算',
          }
          : action === 'ledger-finalize'
            ? { status: '已定稿', stage: '已定稿', finalizedAt: today, finalizedDate: todayKey, finalizedAtMs: Date.now(), note: '手动定稿' }
            : action === 'ledger-void'
              ? {
                status: '作废',
                stage: '作废',
                finalizedAt: existing && existing.finalizedAt || today,
                finalizedDate: existing && existing.finalizedDate || todayKey,
                finalizedAtMs: Number(existing && existing.finalizedAtMs) || Date.now(),
                note: '手动作废',
              }
              : { status: '已完成', stage: '完成', note: '手动完成', filesAutoCompleted: false };
    const opts = options || {};
    const finalPatch = opts.purchasePrice ? { ...patch, purchasePrice: opts.purchasePrice } : patch;
    const updatedRecord = updateDailyLedgerForSku(sku, finalPatch, key);
    if (action === 'ledger-finalize' && opts.purchasePrice) {
      const currentData = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      const changed = String(currentData.purchasePrice || '') !== opts.purchasePrice;
      const pricedData = normalizeData({ ...currentData, purchasePrice: opts.purchasePrice });
      saveData(sku, pricedData);
      if (state.data && state.data.sku === sku) state.data = pricedData;
      if (changed) recordCommerceInsight(pricedData, null, { price: opts.purchasePrice, source: 'ledger-finalize' });
    }
    refreshLedgerCard(updatedRecord);
    refreshLedgerPerformanceSummary();
    if (action === 'ledger-extension') showToast(updatedRecord && updatedRecord.performanceType === 'extension' ? '已设为延伸，绩效按 0.3 分计算' : '已取消延伸绩效');
    if (action === 'ledger-finalize') scheduleDesktopBridgeSnapshot();
  }

  function updateLedgerTrashFromAction(action, sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    const month = getMonthKeyFromDateKey(key);
    const record = (state.ledgerTrashRecords || []).find((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month);
    if (!record) return;
    if (action === 'ledger-trash-delete' && !window.confirm('确定从垃圾篓清除 ' + sku + ' 吗？清除后仍会保留防回抓标记。')) return;
    if (action === 'ledger-trash-restore') {
      state.ledgerTrashRecords = (state.ledgerTrashRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month));
      const restored = sanitizeLedgerRecords([{ ...record, updatedAt: new Date().toLocaleString(), updatedAtMs: Date.now() }])[0];
      state.ledgerRecords = [restored].concat((state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month))).slice(0, 1200);
      saveDailyLedger();
    } else {
      state.ledgerTrashRecords = (state.ledgerTrashRecords || []).map((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month ? { ...item, purged: true } : item);
    }
    saveDailyLedgerTrash();
    renderShell();
    showToast(action === 'ledger-trash-restore' ? '已恢复到今日工作台' : '已从垃圾篓清除，仍会阻止自动加入');
  }

  function emptyLedgerTrashMonth(dateKey) {
    const month = normalizeLedgerMonth(dateKey || getTodayKey());
    const count = (state.ledgerTrashRecords || []).filter((item) => !item.purged && getMonthKeyFromDateKey(item.date) === month).length;
    if (!count || !window.confirm('确定清空 ' + formatLedgerMonthLabel(month) + ' 的 ' + count + ' 条垃圾篓记录吗？清空后仍会保留防回抓标记。')) return;
    state.ledgerTrashRecords = (state.ledgerTrashRecords || []).map((item) => getMonthKeyFromDateKey(item.date) === month ? { ...item, purged: true } : item);
    saveDailyLedgerTrash();
    renderShell();
    showToast('本月垃圾篓已清空，移除编码仍不会自动加入');
  }

  function openLedgerFinalizedTimeEditor(sku, dateKey) {
    if (!sku) return;
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    if (!existing || !existing.finalizedAt) {
      showToast('请先定稿后再修改时间');
      return;
    }
    state.ledgerTimeEditor = { sku, dateKey: key, timeMs: existing.finalizedAtMs || parseLedgerDateTimeMs(existing.finalizedAt) || Date.now() };
    renderShell();
  }

  function saveLedgerFinalizedTimeEditor() {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hour = panel.querySelector('.pfh-ledger-time-hour');
    const minute = panel.querySelector('.pfh-ledger-time-minute');
    const value = String(dateInput && dateInput.value || '').trim() + ' ' + String(hour && hour.value || '').trim().padStart(2, '0') + ':' + String(minute && minute.value || '').trim().padStart(2, '0');
    const timeMs = parseLedgerDateTimeMs(value);
    if (!timeMs) {
      showToast('时间格式不正确，请使用 2026-07-10 14:30');
      return;
    }
    const date = new Date(timeMs);
    const finalizedDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    updateDailyLedgerForSku(editor.sku, {
      status: '已定稿',
      stage: '已定稿',
      finalizedAt: formatLedgerMinuteLabel(timeMs),
      finalizedDate,
      finalizedAtMs: timeMs,
      note: '已修改定稿时间',
    }, editor.dateKey);
    state.ledgerTimeEditor = null;
    showToast('定稿时间已更新');
    renderShell();
  }

  function updateLedgerTimeEditorPreset(action) {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const date = new Date();
    if (action === 'ledger-time-yesterday') date.setDate(date.getDate() - 1);
    else if (action === 'ledger-time-day-before') date.setDate(date.getDate() - 2);
    date.setHours(9, 0, 0, 0);
    editor.timeMs = date.getTime();
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hourInput = panel.querySelector('.pfh-ledger-time-hour');
    const minuteInput = panel.querySelector('.pfh-ledger-time-minute');
    if (dateInput) dateInput.value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    if (hourInput) hourInput.value = String(date.getHours()).padStart(2, '0');
    if (minuteInput) minuteInput.value = String(date.getMinutes()).padStart(2, '0');
  }

  function toggleLedgerWorkFlag(action, sku, dateKey) {
    if (!sku) return;
    syncDailyLedgerBeforeMutation();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const field = action === 'ledger-toggle-box-file'
      ? 'boxFileState'
      : (action === 'ledger-toggle-label-file' ? 'labelFileState' : 'imagePackState');
    const doneField = action === 'ledger-toggle-box-file'
      ? 'boxFileDone'
      : (action === 'ledger-toggle-label-file' ? 'labelFileDone' : 'imagePackDone');
    const label = field === 'boxFileState' ? '\u7eb8\u76d2\u6587\u4ef6' : (field === 'labelFileState' ? '\u6807\u7b7e\u5370\u5237\u6587\u4ef6' : '\u56fe\u5305');
    const nextValue = nextLedgerFileState(existing && existing[field], existing && existing[doneField]);
    const updatedRecord = updateDailyLedgerForSku(sku, { [field]: nextValue, [doneField]: nextValue === 'done', note: label + ledgerFileStateLabel(nextValue) }, key);
    refreshLedgerCard(updatedRecord);
    scheduleDesktopBridgeSnapshot();
  }

  function ledgerArtworkStateButtonHtml(sku, dateAttr, value) {
    const current = normalizeLedgerArtworkState(value);
    const label = current === 'doing' ? '生图中' : (current === 'done' ? '完成生图' : '待生图');
    return '<button type="button" class="pfh-ledger-artwork is-' + escapeHtml(current) + '" data-action="ledger-cycle-artwork-state" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="点击切换生图状态">' + label + '</button>';
  }

  function cycleLedgerArtworkState(sku, dateKey) {
    syncDailyLedgerBeforeMutation();
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const current = normalizeLedgerArtworkState(existing && existing.artworkState);
    const next = current === 'pending' ? 'doing' : (current === 'doing' ? 'done' : 'pending');
    const label = next === 'doing' ? '生图中' : (next === 'done' ? '完成生图' : '待生图');
    const updated = updateDailyLedgerForSku(sku, { artworkState: next, note: label }, key);
    refreshLedgerCard(updated);
  }

  function openLedgerReference(sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const url = record && record.referenceUrl;
    if (!url) {
      showToast('这个编码没有参考链接');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function captureLedgerReturnScroll(originCard) {
    const panel = document.getElementById(PANEL_ID);
    const detailScroll = panel && panel.querySelector('.pfh-detail-scroll');
    const ledgerList = panel && panel.querySelector('.pfh-ledger-list');
    const card = originCard && originCard.classList && originCard.classList.contains('pfh-ledger-item') ? originCard : null;
    const detailRect = detailScroll && detailScroll.getBoundingClientRect();
    const cardRect = card && card.getBoundingClientRect();
    return {
      detailTop: detailScroll ? detailScroll.scrollTop : 0,
      detailLeft: detailScroll ? detailScroll.scrollLeft : 0,
      listTop: ledgerList ? ledgerList.scrollTop : 0,
      listLeft: ledgerList ? ledgerList.scrollLeft : 0,
      sku: card && card.getAttribute('data-ledger-sku') || '',
      date: card && card.getAttribute('data-ledger-date') || '',
      cardOffset: detailRect && cardRect ? cardRect.top - detailRect.top : null,
    };
  }

  function restoreLedgerReturnScroll(snapshot) {
    if (!snapshot) return;
    window.requestAnimationFrame(() => {
      const panel = document.getElementById(PANEL_ID);
      const detailScroll = panel && panel.querySelector('.pfh-detail-scroll');
      const ledgerList = panel && panel.querySelector('.pfh-ledger-list');
      if (detailScroll) {
        detailScroll.scrollTop = Number(snapshot.detailTop) || 0;
        detailScroll.scrollLeft = Number(snapshot.detailLeft) || 0;
      }
      if (ledgerList) {
        ledgerList.scrollTop = Number(snapshot.listTop) || 0;
        ledgerList.scrollLeft = Number(snapshot.listLeft) || 0;
      }
      window.requestAnimationFrame(() => {
        if (!detailScroll || !Number.isFinite(snapshot.cardOffset) || !snapshot.sku) return;
        const card = Array.from(panel.querySelectorAll('.pfh-ledger-item')).find((item) =>
          item.getAttribute('data-ledger-sku') === snapshot.sku && (!snapshot.date || item.getAttribute('data-ledger-date') === snapshot.date)
        );
        if (!card) return;
        const delta = card.getBoundingClientRect().top - detailScroll.getBoundingClientRect().top - snapshot.cardOffset;
        if (Math.abs(delta) > 1) detailScroll.scrollTop += delta;
      });
    });
  }

  function openLedgerSku(sku, originCard) {
    if (!sku) return;
    const data = normalizeData(loadData(sku) || { sku });
    state.detailReturnScroll = state.view === 'ledger' ? captureLedgerReturnScroll(originCard) : null;
    state.selectedSku = sku;
    state.data = data;
    state.detailReturnView = state.view || 'ledger';
    state.view = 'detail';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
  }

  function getLedgerStatusClass(status) {
    if (status === '已完成') return 'done';
    if (status === '异常') return 'error';
    if (status === '作废') return 'void';
    if (status === '已定稿') return 'final';
    if (status === '制作中') return 'doing';
    if (status === '跳过') return 'skip';
    return 'draft';
  }

  function buildCachePayload() {
    const items = {};
    state.index.forEach((item) => {
      const data = loadData(item.sku);
      if (data) items[item.sku] = data;
    });
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      backupOwnerName: getCloudBackupOwnerName(),
      includesImageLinks: true,
      index: state.index,
      items,
      uploadRecords: {
        queue: sanitizeUploadRecords(loadUploadQueue()),
        history: sanitizeUploadRecords(loadUploadHistory()),
      },
      dailyLedger: sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger()),
      dailyLedgerTrash: sanitizeLedgerTrashRecords(state.ledgerTrashRecords || loadDailyLedgerTrash()),
      insights: state.insights || emptyInsights(),
    };
  }

  async function encodeCloudBackupPayload(payload) {
    const serialized = JSON.stringify(payload);
    if (serialized.length < 400000 || typeof CompressionStream !== 'function') return payload;
    const stream = new Blob([serialized], { type: 'application/json' })
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return {
      plugin: payload.plugin || L.title,
      version: payload.version || SCRIPT_VERSION,
      exportedAt: payload.exportedAt || new Date().toLocaleString(),
      backupOwnerName: payload.backupOwnerName || '',
      compression: 'gzip-base64',
      uncompressedLength: serialized.length,
      data: bytesToBase64(compressed),
    };
  }

  async function decodeCloudBackupPayload(payload) {
    if (!payload || payload.compression !== 'gzip-base64' || !payload.data) return payload;
    if (typeof DecompressionStream !== 'function') throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u89e3\u538b\u4e91\u5907\u4efd\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
    const compressed = base64ToArrayBuffer(payload.data);
    const stream = new Blob([compressed])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    const serialized = await new Response(stream).text();
    return JSON.parse(serialized);
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function sanitizeUploadRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 300).map((item) => ({
      ...item,
      xlsxKey: '',
      zipKey: '',
      copyrightFiles: getCopyrightUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      selected: false,
    }));
  }

  function handleImportFile(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importCachePayload(JSON.parse(String(reader.result || '{}')));
        showToast(L.importDone);
        state.view = 'about';
        renderShell();
      } catch (error) {
        console.warn('PLM floating helper import failed:', error);
        showToast(L.importFailed);
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      showToast(L.importFailed);
      event.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  function importCachePayload(payload) {
    const items = payload && payload.items ? payload.items : payload;
    if (!items || typeof items !== 'object') throw new Error('Invalid cache payload');
    Object.keys(items).forEach((sku) => {
      const data = normalizeData({ ...items[sku], sku: (items[sku] && items[sku].sku) || sku });
      if (!data.sku) return;
      saveDataDirect(data.sku, data);
      upsertIndex(data);
    });
    if (Array.isArray(payload.index)) {
      payload.index.forEach((item) => {
        const existing = state.index.find((entry) => entry.sku === item.sku);
        if (!existing) return;
        if (item.brand && !existing.brand) existing.brand = item.brand;
        if (item.pinned) existing.pinned = true;
        if (item.pinOrder) existing.pinOrder = item.pinOrder;
      });
      saveIndex();
    }
    if (payload.uploadRecords && typeof payload.uploadRecords === 'object') {
      if (Array.isArray(payload.uploadRecords.queue)) {
        state.uploadQueue = sanitizeUploadRecords(payload.uploadRecords.queue).map((item) => ({
          ...item,
          status: item.status && /\u6210\u529f|\u5931\u8d25|\u5df2\u8df3\u8fc7|\u5df2\u4fdd\u5b58/.test(item.status) ? item.status : '\u8bf7\u8865\u5145\u6587\u4ef6',
          step: item.step || '\u4e91\u5907\u4efd\u6062\u590d\uff0c\u9700\u91cd\u65b0\u9009\u62e9\u6587\u4ef6',
        }));
        saveUploadQueue();
      }
      if (Array.isArray(payload.uploadRecords.history)) {
        state.uploadHistory = sanitizeUploadRecords(payload.uploadRecords.history);
        saveUploadHistory();
      }
    }
    if (Array.isArray(payload.dailyLedgerTrash)) {
      const importedTrash = sanitizeLedgerTrashRecords(payload.dailyLedgerTrash);
      const importedTrashKeys = new Set(importedTrash.map((item) => getMonthKeyFromDateKey(item.date) + '|' + item.sku));
      state.ledgerTrashRecords = importedTrash.concat((state.ledgerTrashRecords || loadDailyLedgerTrash()).filter((item) => !importedTrashKeys.has(getMonthKeyFromDateKey(item.date) + '|' + item.sku))).slice(0, 1200);
      saveDailyLedgerTrash();
    }
    if (Array.isArray(payload.dailyLedger)) {
      const imported = filterLedgerRecordsNotInTrash(payload.dailyLedger);
      const importedKeys = new Set(imported.map((item) => item.date + '|' + item.sku));
      state.ledgerRecords = filterLedgerRecordsNotInTrash(imported.concat((state.ledgerRecords || loadDailyLedger()).filter((item) => !importedKeys.has(item.date + '|' + item.sku)))).slice(0, 1200);
      saveDailyLedger();
    }
    if (payload.insights && typeof payload.insights === 'object') {
      state.insights = sanitizeInsights(payload.insights);
      saveInsights();
    }
  }

  function getCloudBackupKey() {
    return String(state.settings.cloudBackupKey || '').trim();
  }

  function getCloudBackupOwnerName() {
    const backupKey = getCloudBackupKey();
    if (!backupKey) return '';
    const savedName = String(state.settings.cloudBackupOwnerName || '').trim();
    if (state.settings.cloudBackupOwnerKey === backupKey && savedName) return savedName;
    const name = findCurrentPlmUserName();
    state.settings.cloudBackupOwnerKey = backupKey;
    state.settings.cloudBackupOwnerName = name;
    saveSettings(state.settings);
    return name;
  }

  function findCurrentPlmUserName() {
    const candidates = Array.from(document.querySelectorAll(
      '.btnBoxMainText.ant-dropdown-trigger, [data-user-name], [data-username], .user-name, .userName, .username, .nick-name, .nickName, .nickname, .ant-layout-header .ant-dropdown-trigger, header .ant-dropdown-trigger, [class*="user-info"], [class*="userInfo"], [class*="account-name"], [class*="accountName"], [class*="profile-name"], [class*="profileName"]'
    )).filter(isVisibleElement);
    for (const element of candidates) {
      const ownText = Array.from(element.childNodes || []).filter((node) => node.nodeType === 3).map((node) => node.textContent || '').join(' ').trim();
      const value = String(element.getAttribute('data-user-name') || element.getAttribute('data-username') || ownText || element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ');
      if (/^[\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z ._-]{1,30}$/.test(value) && !/^(PLM|\u7528\u6237|\u8d26\u53f7|\u6211\u7684)$/.test(value) && !/\u9000\u51fa|\u767b\u5f55|\u8bbe\u7f6e|\u5e2e\u52a9/.test(value)) return value;
    }
    return '';
  }

  function getCloudBackupStatusText() {
    return state.cloudBackupStatus || state.settings.cloudBackupStatus || L.cloudBackupReady;
  }

  function getInsightAiModelSetting() {
    const saved = state.settings && state.settings.insightAiModel;
    return saved === MODELSCOPE_INSIGHT_MODEL || saved === 'gemini-3.5-flash' ? MODELSCOPE_INSIGHT_MODEL : 'glm-4.7-flash';
  }

  function setCloudBackupStatus(text) {
    state.cloudBackupStatus = text || '';
    state.settings.cloudBackupStatus = state.cloudBackupStatus;
    saveSettings(state.settings);
    const status = ensurePanel().querySelector('.pfh-cloud-status');
    if (status) status.textContent = getCloudBackupStatusText();
  }

  function queueCloudBackup() {
    if (!getCloudBackupKey()) return;
    state.cloudBackupQueued = true;
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
  }

  async function runQueuedCloudBackup() {
    if (!state.cloudBackupQueued || state.cloudBackupRunning) return;
    state.cloudBackupQueued = false;
    await saveCloudBackup({ silent: true });
    if (state.cloudBackupQueued) {
      window.clearTimeout(state.cloudBackupTimer);
      state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
    }
  }

  async function saveCloudBackupNow() {
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupQueued = false;
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      state.settings.cloudBackupKey = input.value.trim();
      saveSettings(state.settings);
    }
    try {
      await saveCloudBackup({ silent: false });
    } catch (error) {
      console.warn('PLM floating helper cloud backup failed:', error);
    }
  }

  async function saveCloudBackup(options) {
    const backupKey = getCloudBackupKey();
    if (!backupKey) {
      if (!(options && options.silent)) showToast(L.cloudBackupMissingKey);
      return false;
    }
    if (backupKey.length < 4) {
      if (!(options && options.silent)) showToast(L.cloudBackupKeyTooShort);
      return false;
    }
    if (state.cloudBackupRunning) {
      state.cloudBackupQueued = true;
      return false;
    }
    state.cloudBackupRunning = true;
    setCloudBackupStatus(L.cloudBackupSaving);
    if (!(options && options.silent)) showToast(L.cloudBackupSaving);
    try {
      const payload = buildCachePayload();
      if (!payload.backupOwnerName) throw new Error(L.cloudBackupOwnerMissing);
      const cloudPayload = await encodeCloudBackupPayload(payload);
      const response = await cloudRequest('/backup/save', {
        method: 'POST',
        body: {
          backupKey,
          version: SCRIPT_VERSION,
          payload: cloudPayload,
        },
      });
      if (!response || !response.ok) throw new Error(response && response.error ? response.error : 'save failed');
      setCloudBackupStatus(L.cloudBackupSavedAt + ' ' + new Date().toLocaleTimeString() + '\uff0c' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u4e0a\u4f20\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      if (!(options && options.silent)) showToast(L.cloudBackupSaved);
      return true;
    } catch (error) {
      const errorMessage = formatCloudBackupSaveError(error);
      console.warn('PLM floating helper cloud backup save failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + errorMessage);
      addLog('error', '\u4e91\u5907\u4efd\u4e0a\u4f20\u5931\u8d25', errorMessage);
      if (!(options && options.silent)) showToast(L.cloudBackupFailed + '\uff1a' + errorMessage);
      return false;
    } finally {
      state.cloudBackupRunning = false;
    }
  }

  function formatCloudBackupSaveError(error) {
    const cloudData = error && error.cloudData ? error.cloudData : {};
    if (cloudData.error === 'backup owner mismatch') {
      const ownerName = String(cloudData.ownerName || '').trim() || '\u5176\u4ed6\u7528\u6237';
      const currentName = String(cloudData.currentOwnerName || getCloudBackupOwnerName() || '').trim();
      return '\u8be5\u5907\u4efd\u5bc6\u94a5\u5df2\u7ed1\u5b9a\u300c' + ownerName + '\u300d' + (currentName ? '\uff0c\u5f53\u524d PLM \u7528\u6237\u4e3a\u300c' + currentName + '\u300d' : '') + '\uff0c\u5df2\u963b\u6b62\u8986\u76d6';
    }
    if (cloudData.error === 'payload too large' || (error && error.message === 'payload too large')) {
      return '\u4e91\u5907\u4efd\u538b\u7f29\u540e\u4ecd\u8d85\u8fc7\u4e0a\u9650';
    }
    return error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
  }

  async function restoreCloudBackup() {
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      state.settings.cloudBackupKey = input.value.trim();
      saveSettings(state.settings);
    }
    const backupKey = getCloudBackupKey();
    if (!backupKey) {
      showToast(L.cloudBackupMissingKey);
      return;
    }
    if (backupKey.length < 4) {
      showToast(L.cloudBackupKeyTooShort);
      return;
    }
    if (!window.confirm('\u786e\u5b9a\u8981\u4ece\u4e91\u5907\u4efd\u6062\u590d\u6570\u636e\u5417\uff1f')) return;
    setCloudBackupStatus(L.cloudBackupRestoring);
    showToast(L.cloudBackupRestoring);
    try {
      const response = await cloudRequest('/backup/load?backupKey=' + encodeURIComponent(backupKey), { method: 'GET' });
      if (!response || !response.found) {
        setCloudBackupStatus(L.cloudBackupNotFound);
        showToast(L.cloudBackupNotFound);
        return;
      }
      importCachePayload(await decodeCloudBackupPayload(response.payload));
      saveSettings(state.settings);
      setCloudBackupStatus(L.cloudBackupRestored + '\uff1a' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u6062\u590d\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      showToast(L.cloudBackupRestored);
      state.view = 'about';
      renderShell();
    } catch (error) {
      console.warn('PLM floating helper cloud backup restore failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
      addLog('error', '\u4e91\u5907\u4efd\u6062\u590d\u5931\u8d25', error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef');
      showToast(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
    }
  }

  function buildPackBoxKey(data) {
    if (!data) return '';
    const source = shouldUseProductSizeForPacking(data)
      ? [data.productLength, data.productWidth, data.productHeight]
      : [data.packageLength, data.packageWidth, data.packageHeight];
    const parts = source
      .map((value) => normalizePackDimensionPart(value))
      .filter(Boolean);
    return parts.length === 3 ? parts.join('x') : '';
  }

  function normalizePackCountValue(value) {
    const count = Number.parseInt(String(value || '').replace(/[^0-9]/g, ''), 10);
    return Number.isInteger(count) && count > 0 ? String(count) : '';
  }

  function calculateLocalPackRecommendation(boxKey) {
    const itemDims = String(boxKey || '')
      .split('x')
      .map((part) => Number(part));
    if (itemDims.length !== 3 || itemDims.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    const cartonDims = [56, 36, 21];
    const permutations = [
      [itemDims[0], itemDims[1], itemDims[2]],
      [itemDims[0], itemDims[2], itemDims[1]],
      [itemDims[1], itemDims[0], itemDims[2]],
      [itemDims[1], itemDims[2], itemDims[0]],
      [itemDims[2], itemDims[0], itemDims[1]],
      [itemDims[2], itemDims[1], itemDims[0]],
    ];
    const best = permutations.reduce((current, dims) => {
      const count = Math.floor(cartonDims[0] / dims[0])
        * Math.floor(cartonDims[1] / dims[1])
        * Math.floor(cartonDims[2] / dims[2]);
      return count > current.packCount ? { packCount: count, orientation: dims.join('x') } : current;
    }, { packCount: 0, orientation: '' });
    if (!best.packCount) return null;
    return {
      boxKey,
      packCount: best.packCount,
      orientation: best.orientation,
      cartonKey: cartonDims.join('x'),
      source: 'local-calc',
    };
  }

  function cachePackRecommendation(data, boxKey, recommendation) {
    const sku = String(data && data.sku || '').trim();
    const count = normalizePackCountValue(recommendation && recommendation.packCount);
    if (!sku || !boxKey || !count) return;
    const current = normalizeData(loadData(sku) || data);
    if (
      normalizePackCountValue(current.packQty || current.packCount || current.cartonQty) === count
      && String(current.packQtyBoxKey || '') === boxKey
    ) return;
    saveData(sku, {
      ...current,
      packQty: count,
      packCount: count,
      packQtyBoxKey: boxKey,
      packQtySource: String(recommendation.source || 'recommendation'),
      packQtyUpdatedAt: new Date().toLocaleString(),
    }, {
      suppressChangeTracking: true,
      changeSource: '装箱数推荐',
    });
  }

  function shouldUseProductSizeForPacking(data) {
    return Boolean(data && data.singleBottle && !/纸盒/.test(String(data.packageSizeLabel || '')));
  }

  function shouldRemoveExcelPackageSizeColumn(data) {
    return shouldUseProductSizeForPacking(data);
  }

  function normalizePackDimensionPart(value) {
    const text = String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\u5398\u7c73|\u516c\u5206/g, 'cm')
      .replace(/[\u00d7*]/g, 'x');
    const cmPart = text.split('/')[0].replace(/cm/g, '');
    const match = cmPart.match(/\d+(?:\.\d+)?/);
    if (!match) return '';
    const number = Number(match[0]);
    return Number.isFinite(number) && number > 0 ? trimNumber(number) : '';
  }

  async function fetchPackRecommendation(boxKey) {
    return cloudRequest('/pack/recommend?boxKey=' + encodeURIComponent(boxKey), { method: 'GET' });
  }

  function schedulePackAiEstimate(data) {
    const boxKey = buildPackBoxKey(data);
    if (!boxKey) {
      if (hasPackDimensionInput(data)) showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u7eb8\u76d2\u5c3a\u5bf8\u4e0d\u5b8c\u6574\uff0c\u65e0\u6cd5\u8ba1\u7b97');
      return;
    }
    if (state.packAiEstimatingKeys.has(boxKey)) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a' + boxKey + ' \u6b63\u5728\u8ba1\u7b97\u4e2d');
      return;
    }
    const failedAt = state.packAiFailedAt && state.packAiFailedAt[boxKey] || 0;
    if (failedAt && Date.now() - failedAt < 10 * 60 * 1000) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a' + boxKey + ' \u521a\u521a\u5931\u8d25\u8fc7\uff0c10\u5206\u949f\u540e\u91cd\u8bd5');
      return;
    }
    state.packAiEstimatingKeys.add(boxKey);
    window.setTimeout(() => runPackAiEstimate(data, boxKey).catch((error) => {
      console.warn('PLM floating helper pack AI estimate failed:', error);
      showPackAiToast('\u88c5\u7bb1\u6570\u8ba1\u7b97\u5931\u8d25\uff1a' + formatErrorMessage(error));
      state.packAiFailedAt[boxKey] = Date.now();
    }).finally(() => {
      state.packAiEstimatingKeys.delete(boxKey);
    }), 100);
  }

  async function runPackAiEstimate(data, boxKey) {
    const recommendation = await fetchPackRecommendation(boxKey).catch(() => null);
    if (recommendation && recommendation.found && recommendation.packCount) {
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u5df2\u5b58\u5728\u5386\u53f2 ' + recommendation.packCount);
      cachePackRecommendation(data, boxKey, recommendation);
      return recommendation;
    }
    showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u672a\u67e5\u5230\u5386\u53f2\uff0c\u540e\u53f0\u8ba1\u7b97\u4e2d ' + boxKey);
    let estimated = await requestPackAiEstimate(boxKey, data && data.sku).catch((error) => {
      addLog('warn', '在线装箱推荐不可用，改用本地计算', String(data && data.sku || '') + ' ' + formatErrorMessage(error));
      return null;
    });
    if (!estimated || !estimated.packCount) estimated = calculateLocalPackRecommendation(boxKey);
    if (estimated && estimated.packCount) {
      const sourceText = estimated.source === 'local-calc' ? '本地计算 56x36x21cm' : estimated.source;
      showPackAiToast('\u88c5\u7bb1\u6570\uff1a\u5df2\u5199\u5165 ' + estimated.packCount + (sourceText ? '\uff08' + sourceText + '\uff09' : ''));
      cachePackRecommendation(data, boxKey, estimated);
      if (state.excelPanelOpen && state.data && data && state.data.sku === data.sku && !state.excelPackQty) {
        state.excelPackQty = String(estimated.packCount);
        state.excelStatus = L.excelPackRecommended + ': ' + estimated.packCount + (sourceText ? '（' + sourceText + '）' : '');
        renderShell();
      }
      return estimated;
    }
    return null;
  }

  function hasPackDimensionInput(data) {
    if (!data) return false;
    return shouldUseProductSizeForPacking(data)
      ? Boolean(data.productLength || data.productWidth || data.productHeight || data.productNums)
      : Boolean(data.packageLength || data.packageWidth || data.packageHeight || data.packageSizeText);
  }

  function showPackAiToast(text) {
    showToast(text);
  }

  async function requestPackAiEstimate(boxKey, sku) {
    return cloudRequest('/pack/ai-estimate', {
      method: 'POST',
      body: {
        boxKey,
        sku: String(sku || ''),
      },
    });
  }

  async function savePackRecord(boxKey, packCount, sku) {
    const count = Number.parseInt(String(packCount || '').replace(/[^0-9]/g, ''), 10);
    if (!boxKey || !Number.isInteger(count) || count <= 0) return false;
    const response = await cloudRequest('/pack/record', {
      method: 'POST',
      body: {
        boxKey,
        packCount: count,
        sku: String(sku || ''),
        source: 'plm-helper',
      },
    });
    return Boolean(response && response.ok);
  }

  function syncInsightEvent(eventType, payload) {
    window.setTimeout(() => {
      cloudRequest('/insights/record', {
        method: 'POST',
        body: {
          ...(payload || {}),
          eventType,
          source: (payload && payload.source) || 'plm-helper',
          version: SCRIPT_VERSION,
        },
      }).catch((error) => {
        addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25', formatErrorMessage(error));
      });
    }, 0);
  }

  async function fetchInsightSummary() {
    return cloudRequest('/insights/summary', { method: 'GET' });
  }

  async function fetchInsightReport() {
    return cloudRequest('/insights/report', { method: 'GET' });
  }

  async function fetchInsightAiReport(options) {
    const opts = options || {};
    const params = new URLSearchParams();
    params.set('model', getInsightAiModelSetting());
    if (opts.refresh) params.set('refresh', '1');
    return cloudRequest('/insights/ai-report?' + params.toString(), { method: 'GET' });
  }

  async function fetchInsightAiStatus() {
    return cloudRequest('/insights/ai-status?model=' + encodeURIComponent(getInsightAiModelSetting()), { method: 'GET' });
  }

  async function fetchInsightReadiness() {
    return cloudRequest('/insights/readiness?model=' + encodeURIComponent(getInsightAiModelSetting()), { method: 'GET' });
  }

  async function fetchInsightRules() {
    return cloudRequest('/insights/rules', { method: 'GET' });
  }

  async function fetchClassificationRules() {
    return cloudRequest('/insights/classification-rules?limit=240', { method: 'GET' });
  }

  async function fetchClassificationSummarize(samples) {
    return cloudRequest('/insights/classification-summarize', { method: 'POST', timeoutMs: 90000, body: { version: SCRIPT_VERSION, aiModel: getInsightAiModelSetting(), samples: Array.isArray(samples) ? samples.slice(0, 300) : [] } });
  }

  async function fetchMaintainedCleaningRules() {
    return cloudRequest('/insights/rules/maintained?limit=50', { method: 'GET' });
  }

  async function updateCleaningRuleStatus(ruleId, status) {
    return cloudRequest('/insights/rules/status', {
      method: 'POST',
      body: {
        ruleId: String(ruleId || ''),
        status: String(status || ''),
      },
    });
  }

  async function fetchInsightRecommendation(data, productType) {
    const params = new URLSearchParams();
    if (data && data.sku) params.set('sku', data.sku);
    if (productType) params.set('productType', productType);
    if (data && data.name) params.set('name', data.name);
    return cloudRequest('/insights/recommend?' + params.toString(), { method: 'GET' });
  }

  async function fetchLoadingTips() {
    const now = new Date();
    const params = new URLSearchParams({
      name: findCurrentPlmUserName(),
      instanceId: getClientInstanceId(),
      version: SCRIPT_VERSION,
      date: formatLocalDate(now),
      time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      weekday: String(now.getDay()),
    });
    return cloudRequest('/tips?' + params.toString(), { method: 'GET' });
  }

  async function refreshLoadingTips(showFeedback) {
    try {
      const response = await fetchLoadingTips();
      const tips = normalizeLoadingTipItems(response && response.tips);
      state.loadingTips = tips;
      state.loadingTipsLoaded = true;
      if (showFeedback) showToast('\u5c0f\u63d0\u793a\u5df2\u5237\u65b0\uff1a' + tips.length + '\u6761');
    } catch (error) {
      state.loadingTips = DEFAULT_LOADING_TIPS.slice();
      state.loadingTipsLoaded = false;
      addLog('warn', '\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25\uff0c\u5df2\u4f7f\u7528\u672c\u5730\u9ed8\u8ba4\u63d0\u793a', formatErrorMessage(error));
      if (showFeedback) showToast('\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25\uff0c\u5df2\u4f7f\u7528\u9ed8\u8ba4\u63d0\u793a');
    }
  }

  function getClientInstanceId() {
    try {
      let value = typeof GM_getValue === 'function' ? GM_getValue(USER_INSTANCE_KEY, '') : localStorage.getItem(USER_INSTANCE_KEY);
      if (!value) {
        value = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'browser-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
        if (typeof GM_setValue === 'function') GM_setValue(USER_INSTANCE_KEY, value);
        else localStorage.setItem(USER_INSTANCE_KEY, value);
      }
      return String(value).slice(0, 80);
    } catch (_) {
      return 'browser-session';
    }
  }

  function formatLocalDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function recordLoadingTipImpression(item) {
    if (!item || !item.tipId) return;
    cloudRequest('/tips/impression', {
      method: 'POST',
      body: { tipId: item.tipId, name: findCurrentPlmUserName(), instanceId: getClientInstanceId(), shownDay: formatLocalDate(new Date()) },
    }).catch(() => {});
  }

  function scheduleUserHeartbeat(delay) {
    if (state.userHeartbeatTimer) window.clearTimeout(state.userHeartbeatTimer);
    state.userHeartbeatTimer = window.setTimeout(() => {
      state.userHeartbeatTimer = 0;
      sendUserHeartbeat();
    }, Math.max(0, Number(delay) || 0));
  }

  async function sendUserHeartbeat() {
    const name = findCurrentPlmUserName();
    if (!name) {
      scheduleUserHeartbeat(3000);
      return;
    }
    try {
      const response = await cloudRequest('/users/heartbeat', {
        method: 'POST',
        body: { name, instanceId: getClientInstanceId(), version: SCRIPT_VERSION, skuCount: state.index.length },
      });
      if (response && typeof response.sizeImageEnabled === 'boolean') {
        state.sizeImageAccessName = name;
        state.sizeImageAccessEnabled = response.sizeImageEnabled;
        state.sizeImageAccessLoading = false;
        if (state.view === 'home') renderShell();
      }
      refreshLoadingTips(false);
    } catch (error) {
      addLog('warn', '使用状态同步失败', formatErrorMessage(error));
    } finally {
      scheduleUserHeartbeat(30 * 60 * 1000);
    }
  }

  function recordSizeImageUsage(success) {
    const name = findCurrentPlmUserName();
    if (!name) return;
    cloudRequest('/usage/size-image', { method: 'POST', body: { name, success: Boolean(success) } }).catch(() => {});
  }

  function openLoadingTipsManager() {
    const url = CLOUD_BACKUP_API_BASE + '/admin';
    window.open(url, '_blank', 'noopener,noreferrer');
    refreshLoadingTips(true);
  }

  function scheduleSizeImageAccessRefresh(delay) {
    if (state.sizeImageAccessTimer) window.clearTimeout(state.sizeImageAccessTimer);
    state.sizeImageAccessTimer = window.setTimeout(() => {
      state.sizeImageAccessTimer = 0;
      refreshSizeImageAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshSizeImageAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      state.sizeImageAccessEnabled = false;
      state.sizeImageAccessLoading = true;
      scheduleSizeImageAccessRefresh(1500);
      return;
    }
    state.sizeImageAccessName = name;
    state.sizeImageAccessLoading = true;
    if (state.view === 'home') renderShell();
    try {
      const response = await cloudRequest('/features/size-image?name=' + encodeURIComponent(name), { method: 'GET' });
      if (state.sizeImageAccessName !== name) return;
      state.sizeImageAccessEnabled = Boolean(response && response.enabled);
    } catch (error) {
      state.sizeImageAccessEnabled = false;
      addLog('warn', '生成尺寸图权限检查失败', formatErrorMessage(error));
    } finally {
      state.sizeImageAccessLoading = false;
      if (state.view === 'home') renderShell();
    }
  }

  function cloudRequest(path, options) {
    const method = (options && options.method) || 'GET';
    const body = options && options.body ? JSON.stringify(options.body) : null;
    const url = CLOUD_BACKUP_API_BASE + path;
    const timeoutMs = Number(options && options.timeoutMs) || 30000;
    return new Promise((resolve, reject) => {
      const handleLoad = (response) => {
        const text = response.responseText || '';
        let data = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          if (response.status >= 200 && response.status < 300 && path === '/backup/save') {
            resolve({ ok: true, responseFormat: 'html' });
            return;
          }
          reject(new Error('云端返回了非 JSON 响应（HTTP ' + response.status + '）'));
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          reject(buildCloudError(data, response.status));
          return;
        }
        resolve(data);
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method,
          url,
          headers: {
            'content-type': 'application/json',
            'x-api-key': CLOUD_BACKUP_API_KEY,
          },
          data: body,
          onload: handleLoad,
          onerror: () => reject(new Error('云端请求被浏览器拦截或网络不可用')),
          ontimeout: () => reject(new Error('timeout')),
          timeout: timeoutMs,
        });
        return;
      }
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
      fetch(url, {
        method,
        signal: controller ? controller.signal : undefined,
        headers: {
          'content-type': 'application/json',
          'x-api-key': CLOUD_BACKUP_API_KEY,
        },
        body,
      }).then(async (response) => {
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          if (response.ok && path === '/backup/save') return { ok: true, responseFormat: 'html' };
          throw new Error('云端返回了非 JSON 响应（HTTP ' + response.status + '）');
        }
        if (!response.ok) throw buildCloudError(data, response.status);
        return data;
      }).then(resolve, (error) => {
        reject(error && error.name === 'AbortError' ? new Error('timeout') : error);
      }).finally(() => {
        if (timer) window.clearTimeout(timer);
      });
    });
  }

  function buildCloudError(data, status) {
    const error = new Error(formatCloudError(data, status));
    error.cloudData = data || {};
    error.status = status;
    return error;
  }

  function formatCloudError(data, status) {
    const parts = [];
    if (data && data.error) parts.push(data.error);
    if (data && data.message) parts.push(data.message);
    if (data && data.warning) parts.push(data.warning);
    return parts.filter(Boolean).join('\uff1a') || ('HTTP ' + status);
  }

  function formatErrorMessage(error) {
    return error && error.message ? error.message : String(error || '\u672a\u77e5\u9519\u8bef');
  }

  function isRecoverableFeishuSyncError(error) {
    const data = error && error.cloudData || {};
    const message = formatErrorMessage(error);
    return /FEISHU_.*not configured|not configured|feishu table missing required fields|missing required fields|missing fields|fields check failed/i.test(message) ||
      Array.isArray(data.missingFields) ||
      Array.isArray(data.tableMissingFields);
  }

  function formatFeishuSyncErrorDetail(error) {
    const data = error && error.cloudData || {};
    const fields = []
      .concat(Array.isArray(data.missingFields) ? data.missingFields : [])
      .concat(Array.isArray(data.tableMissingFields) ? data.tableMissingFields : []);
    const uniqueFields = fields.filter((field, index) => field && fields.indexOf(field) === index);
    const parts = [formatErrorMessage(error)];
    if (uniqueFields.length) parts.push('\u7f3a\u5b57\u6bb5 ' + uniqueFields.join('/'));
    return parts.filter(Boolean).join(' / ');
  }

  function formatCopyAll(data) {
    if (!data) return '';
    return [
      '[' + L.fileSection + ']',
      L.brand + ' / ' + L.name + ' / ' + L.sku + ': ' + [data.brand, data.name, data.sku].filter(Boolean).join(' | '),
      L.packageCode + ': ' + (data.packageCode || L.unknown),
      L.printCode + ': ' + (data.printCode || L.unknown),
      (data.packageSizeLabel || L.packageSize) + ': ' + (data.packageSizeText || L.noPackage),
      (data.printSizeLabel || L.printSize) + ': ' + (data.printSizeText || L.noPrint),
      '',
      '[' + L.graphicSection + ']',
      L.cartonLength + ': ' + (data.packageLength || L.noDimension),
      L.cartonWidth + ': ' + (data.packageWidth || L.noDimension),
      L.cartonHeight + ': ' + (data.packageHeight || L.noDimension),
      L.productLength + ': ' + (data.isTubePrint ? (data.productLength || L.tailSealLength) : (data.productLength || L.noDimension)),
      L.productWidth + ': ' + (data.productWidth || L.noDimension),
      L.productHeight + ': ' + (data.productHeight || L.noDimension),
      L.netContent + ': ' + (data.netContent || L.unknown),
      L.grossWeight + ': ' + (data.grossWeight || L.unknown),
    ].join('\n');
  }

  function formatTitleMeta(data) {
    if (!data) return '';
    return [data.brand, data.name, data.sku].filter(Boolean).join(' ');
  }

  function copyText(text) {
    const value = text || L.unknown;
    if (typeof GM_setClipboard === 'function') GM_setClipboard(value, 'text');
    else if (navigator.clipboard) navigator.clipboard.writeText(value);
  }

  function showToast(text) {
    const panel = ensurePanel();
    const noteToast = panel.querySelector('.pfh-note-toast');
    if (noteToast) {
      noteToast.textContent = text || '';
      noteToast.classList.toggle('is-visible', Boolean(text));
      clearTimeout(state.toastTimer);
      state.toastTimer = setTimeout(() => {
        noteToast.textContent = '';
        noteToast.classList.remove('is-visible');
      }, String(text || '').length > 12 ? 12000 : 7000);
      return;
    }
    let toast = panel.querySelector('.pfh-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pfh-toast';
      panel.appendChild(toast);
    }
    toast.textContent = text;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.remove(), String(text || '').length > 12 ? 12000 : 7000);
  }

  function addLog(level, message, detail) {
    const text = [message, detail].filter(Boolean).join(' | ');
    const item = {
      time: new Date().toLocaleTimeString(),
      level: level || 'info',
      message: String(text || '').slice(0, 600),
    };
    state.logs = [item].concat(state.logs || []).slice(0, 300);
    saveLogs();
    syncImportantLog(item, detail);
    const panel = document.getElementById(PANEL_ID);
    if (panel && panel.dataset.view === 'about') {
      const logPanel = panel.querySelector('.pfh-runtime-log-panel');
      if (logPanel) logPanel.outerHTML = renderLogSection();
    }
  }

  function loadLogs() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(LOG_KEY, null) : JSON.parse(localStorage.getItem(LOG_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveLogs() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LOG_KEY, state.logs || []);
      else localStorage.setItem(LOG_KEY, JSON.stringify(state.logs || []));
    } catch (error) {
      console.warn('PLM floating helper log save failed:', error);
    }
  }

  function formatLogsForCopy() {
    return (state.logs || []).map((item) => '[' + (item.time || '') + '] ' + (item.level || 'info').toUpperCase() + ' ' + (item.message || '')).join('\n') || L.logEmpty;
  }

  function syncImportantLog(item, detail) {
    const level = String(item && item.level || '').toLowerCase();
    if (!/^(success|warn|error)$/.test(level)) return;
    const message = String(item && item.message || '');
    if (!message || shouldSkipCloudLogSync(level, message)) return;
    const now = Date.now();
    const key = [level, message.slice(0, 180)].join('|');
    state.logSyncDedup = state.logSyncDedup || {};
    if (state.logSyncDedup[key] && now - state.logSyncDedup[key] < 5 * 60 * 1000) return;
    state.logSyncDedup[key] = now;
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null) || {};
    const logSku = findSku([message, detail].filter(Boolean).join(' '));
    syncInsightEvent('log', {
      sku: logSku || data.sku || state.selectedSku || state.sku || '',
      brand: logSku && logSku !== data.sku ? '' : (data.brand || ''),
      name: logSku && logSku !== data.sku ? '' : (data.name || ''),
      level,
      message,
      detail: String(detail || '').slice(0, 600),
      url: location.href,
      source: 'plm-helper-log',
    });
  }

  function shouldSkipCloudLogSync(level, message) {
    const text = String(message || '');
    if (/\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25|\u4e91\u5907\u4efd/.test(text)) return true;
    if (level === 'success' && !/(\u63d0\u5ba1|\u4e0a\u4f20|\u751f\u6210|Excel|\u6807\u7b7e|\u590d\u5236|AI|\u98de\u4e66|\u6e05\u6d17|\u667a\u80fd|\u4ef7\u683c|\u7c7b\u578b|\u6570\u636e|\u56fe\u7247)/i.test(text)) return true;
    if (/^\u56fe\u7247\u4e0b\u8f7d\u6210\u529f/.test(text)) return true;
    if (/^\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1aURL \u515c\u5e95\u4e0b\u8f7d/.test(text)) return true;
    return false;
  }

  function emptyInsights() {
    return { priceHistory: [], dataIssues: [], typeStats: {} };
  }

  function sanitizeInsights(value) {
    const source = value && typeof value === 'object' ? value : {};
    const clean = emptyInsights();
    clean.priceHistory = (Array.isArray(source.priceHistory) ? source.priceHistory : []).slice(0, 1000).map((item) => ({
      sku: String(item.sku || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 120),
      name: String(item.name || '').slice(0, 200),
      productType: String(item.productType || '').slice(0, 120),
      price: String(item.price || '').slice(0, 40),
      packQty: String(item.packQty || '').slice(0, 40),
      packageSize: String(item.packageSize || '').slice(0, 120),
      productSize: String(item.productSize || '').slice(0, 120),
      source: String(item.source || '').slice(0, 80),
      fileName: String(item.fileName || '').slice(0, 220),
      recordedAt: String(item.recordedAt || '').slice(0, 80),
      recordedAtMs: Number(item.recordedAtMs || 0) || 0,
    })).filter((item) => item.sku);
    clean.dataIssues = (Array.isArray(source.dataIssues) ? source.dataIssues : []).slice(0, 1000).map((item) => ({
      sku: String(item.sku || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 120),
      name: String(item.name || '').slice(0, 200),
      missing: Array.isArray(item.missing) ? item.missing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      seen: String(item.seen || '').slice(0, 120),
      issueKind: String(item.issueKind || '').slice(0, 80),
      readiness: String(item.readiness || '').slice(0, 160),
      diagnosticAttempt: sanitizeMissingDiagnostic(item.diagnosticAttempt),
      fieldDiagnostics: sanitizeFieldDiagnostics(item.fieldDiagnostics),
      source: String(item.source || '').slice(0, 80),
      recordedAt: String(item.recordedAt || '').slice(0, 80),
      recordedAtMs: Number(item.recordedAtMs || 0) || 0,
    })).filter((item) => item.sku && item.missing.length);
    const stats = source.typeStats && typeof source.typeStats === 'object' ? source.typeStats : {};
    Object.keys(stats).slice(0, 300).forEach((key) => {
      const item = stats[key] || {};
      clean.typeStats[String(key).slice(0, 120)] = {
        count: Number(item.count || 0) || 0,
        latestSku: String(item.latestSku || '').slice(0, 80),
        latestPrice: String(item.latestPrice || '').slice(0, 40),
        latestAt: String(item.latestAt || '').slice(0, 80),
      };
    });
    return clean;
  }

  function sanitizeFieldDiagnostics(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 20).map((item) => ({
      field: String(item && item.field || '').slice(0, 80),
      targetTab: String(item && item.targetTab || '').slice(0, 80),
      tabRead: Boolean(item && item.tabRead),
      issueKind: String(item && item.issueKind || '').slice(0, 80),
      action: String(item && item.action || '').slice(0, 120),
    })).filter((item) => item.field);
  }

  function loadInsights() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(INSIGHTS_KEY, null) : JSON.parse(localStorage.getItem(INSIGHTS_KEY) || 'null');
      return sanitizeInsights(saved);
    } catch (error) {
      return emptyInsights();
    }
  }

  function saveInsights() {
    try {
      state.insights = sanitizeInsights(state.insights);
      if (typeof GM_setValue === 'function') GM_setValue(INSIGHTS_KEY, state.insights);
      else localStorage.setItem(INSIGHTS_KEY, JSON.stringify(state.insights));
    } catch (error) {
      console.warn('PLM floating helper insights save failed:', error);
    }
  }

  function getProductTypeForInsight(data, extra) {
    const manualCategory = normalizeManualProductCategory(data && data.manualCategory);
    if (manualCategory) return manualCategory;
    if (isDowmooBrand(data)) return '\u73a9\u5177';
    if (data && data.aiProductType && !/^\u672a\u5206\u7c7b$/i.test(String(data.aiProductType))) return String(data.aiProductType);
    const text = [
      extra && extra.englishName,
      extra && extra.chineseName,
      data && data.name,
      data && data.netContent,
    ].filter(Boolean).join(' ');
    const ruleMatch = matchClassificationRules(data, state.classificationRules || [], 'category');
    if (ruleMatch && ruleMatch.label) return ruleMatch.label;
    if (/(?:\u80f6\u56ca|capsule)\s*(?:\u9762\u971c|cream)|(?:\u9762\u971c|cream)\s*(?:\u80f6\u56ca|capsule)/i.test(text)) return '\u9762\u971c';
    if (/\u8f6f\u7cd6|gumm/i.test(text)) return '\u8f6f\u7cd6';
    if (/\u7cbe\u6cb9|oil/i.test(text)) return '\u7cbe\u6cb9';
    if (/\u9762\u971c|face\s*cream/i.test(text)) return '\u9762\u971c';
    if (/\u80f6\u56ca|capsule/i.test(text)) return '\u80f6\u56ca';
    if (/\u971c|cream/i.test(text)) return '\u971c\u7c7b';
    if (/\u9999\u6c34|perfume/i.test(text)) return '\u9999\u6c34';
    if (/\u73a9\u5177|toy|\u516c\u4ed4|\u634f\u634f/i.test(text)) return '\u73a9\u5177';
    return '\u672a\u5206\u7c7b';
  }

  function getClassificationText(data) {
    return [
      data && data.sku,
      data && data.brand,
      data && data.name,
      data && data.manualCategory,
      data && data.netContent,
      data && data.packageSizeLabel,
      data && data.packageSizeText,
      data && data.printSizeLabel,
      data && data.printSizeText,
      data && data.logoText,
      data && data.aiProductType,
      data && data.aiCategory,
      Array.isArray(data && data.aiPackageTypes) ? data.aiPackageTypes.join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function normalizeManualProductCategory(value) {
    const text = String(value || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || /^(?:未设置|自动识别|未分类)$/i.test(text)) return '';
    if (/玩具/i.test(text)) return '玩具';
    if (/食品/i.test(text)) return '食品';
    return text.slice(0, 60);
  }

  function getDisplayedProductCategory(data, editing) {
    if (!data) return '';
    const manualCategory = normalizeManualProductCategory(data.manualCategory);
    if (manualCategory) return manualCategory;
    const automaticCategory = String(data.aiProductType || data.aiCategory || data.productType || data.category || '').trim();
    if (automaticCategory && !/^\u672a\u5206\u7c7b$/i.test(automaticCategory)) return automaticCategory;
    const inferred = getProductTypeForInsight(data, null);
    return inferred && !/^\u672a\u5206\u7c7b$/i.test(inferred) ? inferred : (editing ? '' : '未分类');
  }

  function normalizeRuleKeywords(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return normalizeRuleKeywords(parsed);
      } catch (error) {
        return value.split(/[,，/、\s]+/).map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }

  function matchClassificationRules(data, rules, kind) {
    const text = getClassificationText(data);
    if (!text) return null;
    const scored = (Array.isArray(rules) ? rules : [])
      .filter((rule) => !kind || rule.kind === kind)
      .map((rule) => {
        const keywords = normalizeRuleKeywords(rule.keywords);
        const negative = normalizeRuleKeywords(rule.negativeKeywords);
        if (!keywords.length || negative.some((kw) => kw && text.includes(kw.toLowerCase()))) return null;
        const hits = keywords.filter((kw) => kw && text.includes(kw.toLowerCase()));
        if (!hits.length) return null;
        const confidence = Number(rule.confidence || 0.65) || 0.65;
        return { rule, hits, score: hits.reduce((sum, kw) => {
          const length = Math.min(String(kw).length, 24);
          return sum + length * length;
        }, 0) * confidence };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    return scored[0] ? { ...scored[0].rule, hits: scored[0].hits, score: scored[0].score } : null;
  }

  function matchPackageTypeRules(data, rules) {
    const matches = (Array.isArray(rules) ? rules : [])
      .filter((rule) => rule.kind === 'packageType')
      .map((rule) => matchClassificationRules(data, [rule], 'packageType'))
      .filter(Boolean)
      .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));
    const seen = new Set();
    return matches.filter((item) => {
      const label = item.label || '';
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    }).slice(0, 6);
  }

  function applyClassificationRulesToLocalCache(rules) {
    const usable = Array.isArray(rules) ? rules : [];
    if (!usable.length) throw new Error('\u6682\u65e0\u53ef\u7528\u5206\u7c7b\u89c4\u5219');
    let total = 0;
    let updated = 0;
    const now = new Date().toLocaleString();
    (state.index || []).forEach((item) => {
      const sku = item && item.sku;
      if (!sku) return;
      const data = normalizeData(loadData(sku) || item);
      if (!data || !data.sku) return;
      const explicitType = String(data.aiProductType || data.aiCategory || '').trim();
      if (explicitType && !/^\u672a\u5206\u7c7b$/i.test(explicitType)) return;
      total += 1;
      const category = matchClassificationRules(data, usable, 'category');
      const packageTypes = matchPackageTypeRules(data, usable);
      const next = { ...data };
      let changed = false;
      if (category && category.label && next.aiProductType !== category.label) {
        next.aiProductType = category.label;
        next.aiCategory = category.label;
        next.aiCategoryRule = category.ruleId || '';
        changed = true;
      }
      const packageLabels = packageTypes.map((rule) => rule.label).filter(Boolean);
      if (packageLabels.length && JSON.stringify(next.aiPackageTypes || []) !== JSON.stringify(packageLabels)) {
        next.aiPackageTypes = packageLabels;
        next.aiPackageRuleIds = packageTypes.map((rule) => rule.ruleId || '').filter(Boolean);
        changed = true;
      }
      if (changed) {
        next.aiClassifiedAt = now;
        saveDataDirect(sku, normalizeData(next));
        upsertIndex(next);
        updated += 1;
      }
    });
    saveIndex();
    if (state.selectedSku) {
      const current = loadData(state.selectedSku);
      if (current) state.data = normalizeData(current);
    }
    return { total, updated };
  }

  function formatClassificationRulesForCopy(rules) {
    const lines = ['类型\t名称\t置信度\t关键词\t排除词\t样例\t来源\t更新时间'];
    (Array.isArray(rules) ? rules : []).forEach((rule) => {
      lines.push([
        rule.kind === 'packageType' ? '包材' : '品类',
        rule.label || '',
        rule.confidence || '',
        normalizeRuleKeywords(rule.keywords).join('/'),
        normalizeRuleKeywords(rule.negativeKeywords).join('/'),
        normalizeRuleKeywords(rule.examples).join('/'),
        rule.source || '',
        rule.updatedAt || '',
      ].join('\t'));
    });
    return lines.join('\n');
  }

  function compactSizeForInsight(parts, fallback) {
    const text = Array.isArray(parts) ? parts.filter(Boolean).join('x') : '';
    return text || String(fallback || '');
  }

  function recordCommerceInsight(data, extra, options) {
    if (!data || !data.sku) return;
    const insight = state.insights || emptyInsights();
    const productType = getProductTypeForInsight(data, extra);
    const item = {
      sku: data.sku,
      brand: data.brand || '',
      name: data.name || (extra && extra.chineseName) || '',
      productType,
      price: String(options && options.price || ''),
      packQty: String(options && options.packQty || ''),
      packageSize: compactSizeForInsight([data.packageLength, data.packageWidth, data.packageHeight], data.packageSizeText),
      productSize: compactSizeForInsight([data.productLength, data.productWidth, data.productHeight], data.productNums),
      source: options && options.source || 'manual',
      fileName: options && options.fileName || '',
      recordedAt: new Date().toLocaleString(),
      recordedAtMs: Date.now(),
    };
    insight.priceHistory = [item].concat(insight.priceHistory || []).slice(0, 1000);
    const stat = insight.typeStats[productType] || { count: 0 };
    insight.typeStats[productType] = {
      count: Number(stat.count || 0) + 1,
      latestSku: data.sku,
      latestPrice: item.price,
      latestAt: item.recordedAt,
    };
    state.insights = insight;
    saveInsights();
    addLog('success', '\u5df2\u8bb0\u5f55\u4ef7\u683c/\u7c7b\u578b\u5386\u53f2', data.sku + ' ' + productType + ' ' + item.price);
    syncInsightEvent('price', item);
    queueCloudBackup();
  }

  function recordDataQuality(data, source) {
    if (!data || !data.sku) return;
    const missing = getMissingFieldsForData(data);
    if (!missing.length) return;
    const seen = [
      data.seenMaterial ? '\u7269\u6599' : '',
      data.seenProduct ? '\u4ea7\u54c1' : '',
    ].filter(Boolean).join('/');
    const issueMeta = getDataQualityIssueMeta(data, missing);
    const item = {
      sku: data.sku,
      brand: data.brand || '',
      name: data.name || '',
      missing,
      seen,
      issueKind: issueMeta.kind,
      readiness: issueMeta.readiness,
      diagnosticAttempt: issueMeta.diagnosticAttempt,
      fieldDiagnostics: issueMeta.fieldDiagnostics,
      source: source || 'scan',
      recordedAt: new Date().toLocaleString(),
      recordedAtMs: Date.now(),
    };
    const insight = state.insights || emptyInsights();
    const exists = (insight.dataIssues || []).some((old) => old.sku === item.sku && old.missing.join(',') === item.missing.join(',') && Date.now() - Number(old.recordedAtMs || 0) < 10 * 60 * 1000);
    if (!exists) {
      insight.dataIssues = [item].concat(insight.dataIssues || []).slice(0, 1000);
      state.insights = insight;
      saveInsights();
      addLog('warn', '\u6570\u636e\u7f3a\u5931', data.sku + ' \u7f3a\uff1a' + missing.join('\u3001') + (seen ? ' / \u5df2\u8bfb\uff1a' + seen : '') + ' / ' + issueMeta.kind);
      syncInsightEvent('issue', {
        ...item,
        missingFields: item.missing,
        diagnosticAttempt: item.diagnosticAttempt,
        fieldDiagnostics: item.fieldDiagnostics,
      });
    }
  }

  function getMissingFieldsForData(data) {
    const missing = [];
    if (!data) return missing;
    if (!data.brand) missing.push('\u54c1\u724c');
    if (!data.name) missing.push('\u5546\u54c1\u540d\u79f0');
    if (!data.packageSizeText && !(data.packageLength && data.packageWidth && data.packageHeight)) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.printSizeText) missing.push('\u5370\u5237\u5c3a\u5bf8');
    if (!shouldOmitToyProductSize(data) && (!data.productLength || !data.productWidth || !data.productHeight)) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    if (data.seenProduct && !getProductThumbUrl(data)) missing.push('SKU\u56fe');
    return missing;
  }

  function getDataQualityIssueMeta(data, missing) {
    const readTabs = [
      data.seenMaterial ? '\u7269\u6599\u6e05\u5355' : '',
      data.seenProduct ? '\u4ea7\u54c1\u4fe1\u606f' : '',
    ].filter(Boolean);
    const allCoreTabsRead = Boolean(data.seenMaterial && data.seenProduct);
    const materialFields = ['\u5305\u88c5\u5c3a\u5bf8', '\u5370\u5237\u5c3a\u5bf8', '\u51c0\u542b\u91cf'];
    const productFields = ['\u4ea7\u54c1\u5c3a\u5bf8', '\u6bdb\u91cd'];
    const productAssetFields = ['SKU\u56fe'];
    const projectFields = ['\u54c1\u724c', '\u5546\u54c1\u540d\u79f0'];
    const missingMaterial = missing.some((field) => materialFields.includes(field));
    const missingProduct = missing.some((field) => productFields.includes(field));
    const missingProductAsset = missing.some((field) => productAssetFields.includes(field));
    const missingProject = missing.some((field) => projectFields.includes(field));
    const targetTabUnread = (missingMaterial && !data.seenMaterial) || ((missingProduct || missingProductAsset) && !data.seenProduct);
    let kind = '\u53ef\u80fd PLM \u7a7a\u503c';
    if (targetTabUnread || !readTabs.length) {
      kind = '\u9875\u9762\u672a\u8bfb\u5b8c';
    } else if (missingProject || (missingMaterial && data.seenMaterial) || ((missingProduct || missingProductAsset) && data.seenProduct) || allCoreTabsRead) {
      kind = '\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790';
    }
    const diagnosticAttempt = sanitizeMissingDiagnostic(data.lastMissingDiagnostic);
    const fieldDiagnostics = missing.map((field) => buildFieldDiagnostic(data, field, diagnosticAttempt));
    return {
      kind,
      readiness: (readTabs.length ? '\u5df2\u8bfb\u9875\u7b7e\uff1a' + readTabs.join('/') : '\u672a\u8bfb\u5230\u6838\u5fc3\u9875\u7b7e') + formatDiagnosticReadinessSuffix(diagnosticAttempt),
      diagnosticAttempt,
      fieldDiagnostics,
    };
  }

  function buildFieldDiagnostic(data, field, diagnosticAttempt) {
    const targetTab = getMissingFieldTargetTab(field);
    const tabRead = targetTab === '\u9879\u76ee\u8be6\u60c5'
      ? Boolean(data.sku)
      : (targetTab === '\u7269\u6599\u6e05\u5355'
      ? Boolean(data.seenMaterial)
      : (targetTab === '\u4ea7\u54c1\u4fe1\u606f' ? Boolean(data.seenProduct) : false));
    const issueKind = tabRead ? '\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790' : '\u9875\u9762\u672a\u8bfb\u5b8c';
    const retryText = formatFieldRetryAction(field, diagnosticAttempt);
    return {
      field,
      targetTab,
      tabRead,
      issueKind,
      action: (tabRead
        ? '\u8865\u5145\u201c' + field + '\u201d\u7684\u9009\u62e9\u5668\u6216\u89e3\u6790\u89c4\u5219'
        : '\u5148\u68c0\u67e5\u201c' + (targetTab || '\u5bf9\u5e94') + '\u201d\u533a\u57df\u662f\u5426\u6210\u529f\u6253\u5f00\u5e76\u52a0\u8f7d') + retryText,
    };
  }

  function sanitizeMissingDiagnostic(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      status: String(source.status || '').slice(0, 40),
      reason: String(source.reason || '').slice(0, 160),
      beforeMissing: Array.isArray(source.beforeMissing) ? source.beforeMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      afterMissing: Array.isArray(source.afterMissing) ? source.afterMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      fixed: Array.isArray(source.fixed) ? source.fixed.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      tabs: Array.isArray(source.tabs) ? source.tabs.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 8) : [],
      attempts: sanitizeDiagnosticAttempts(source.attempts),
      elapsedMs: Number(source.elapsedMs || 0) || 0,
      at: String(source.at || '').slice(0, 80),
    };
  }

  function formatDiagnosticReadinessSuffix(diagnostic) {
    if (!diagnostic || !diagnostic.status) return '';
    const parts = ['\u4e8c\u6b21\u8bfb\u53d6\uff1a' + diagnostic.status];
    if (diagnostic.tabs && diagnostic.tabs.length) parts.push('\u9875\u7b7e ' + diagnostic.tabs.join('/'));
    if (diagnostic.attempts && diagnostic.attempts.length) parts.push('\u5c1d\u8bd5 ' + diagnostic.attempts.map((item) => item.tab + 'x' + item.count).join('/'));
    if (diagnostic.elapsedMs) parts.push(trimNumber(diagnostic.elapsedMs / 1000) + 's');
    if (diagnostic.reason) parts.push(diagnostic.reason);
    return ' / ' + parts.join(' / ');
  }

  function formatFieldRetryAction(field, diagnostic) {
    if (!diagnostic || !diagnostic.status) return '';
    if (diagnostic.fixed && diagnostic.fixed.includes(field)) return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\u5df2\u8865\u5230';
    if (diagnostic.afterMissing && diagnostic.afterMissing.includes(field)) {
      return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\uff1a' + (diagnostic.reason || diagnostic.status);
    }
    return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\uff1a' + diagnostic.status;
  }

  function getMissingFieldTargetTab(field) {
    if (field === '\u5305\u88c5\u5c3a\u5bf8' || field === '\u5370\u5237\u5c3a\u5bf8' || field === '\u51c0\u542b\u91cf') return '\u7269\u6599\u6e05\u5355';
    if (field === '\u54c1\u724c' || field === '\u5546\u54c1\u540d\u79f0') return '\u9879\u76ee\u8be6\u60c5';
    if (field === '\u4ea7\u54c1\u5c3a\u5bf8' || field === '\u6bdb\u91cd' || field === 'SKU\u56fe') return '\u4ea7\u54c1\u4fe1\u606f';
    return '';
  }

  function normalizeFieldLabel(text) {
    return compactLabel(text).replace(/[:\uff1a]\s*$/g, '').trim();
  }

  function loadIndex() {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(STORAGE_INDEX_KEY, []);
      const raw = localStorage.getItem(STORAGE_INDEX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveIndex() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(STORAGE_INDEX_KEY, state.index);
      else localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(state.index));
    } catch (error) {
      console.warn('PLM floating helper index save failed:', error);
    }
  }

  function loadSettings() {
    const defaults = { excelKeywordMode: 'english', excelDownloadMode: 'picker', backgroundNoticeSeen: false, collectionEnabled: true, insightAiModel: 'glm-4.7-flash', skuListMode: 'waterfall', skuListSort: 'assigned', skuListPreferenceVersion: SKU_LIST_PREFERENCE_VERSION };
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(SETTINGS_KEY, null) : JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      const settings = { ...defaults, ...(saved || {}) };
      if (Number(saved && saved.skuListPreferenceVersion || 0) < SKU_LIST_PREFERENCE_VERSION) {
        settings.skuListMode = 'waterfall';
        settings.skuListSort = 'assigned';
        settings.skuListPreferenceVersion = SKU_LIST_PREFERENCE_VERSION;
        try {
          if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, settings);
          else localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
          console.warn('PLM floating helper list preference migration save failed:', error);
        }
      }
      return settings;
    } catch (error) {
      return defaults;
    }
  }

  function saveSettings(settings) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, settings);
      else localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('PLM floating helper settings save failed:', error);
    }
  }

  function loadTutorialSeen() {
    try {
      return Boolean(typeof GM_getValue === 'function' ? GM_getValue(TUTORIAL_SEEN_KEY, false) : JSON.parse(localStorage.getItem(TUTORIAL_SEEN_KEY) || 'false'));
    } catch (error) {
      return false;
    }
  }

  function saveTutorialSeen(value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(TUTORIAL_SEEN_KEY, Boolean(value));
      else localStorage.setItem(TUTORIAL_SEEN_KEY, JSON.stringify(Boolean(value)));
    } catch (error) {
      console.warn('PLM floating helper tutorial flag save failed:', error);
    }
  }

  function loadUploadQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveUploadQueue() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_QUEUE_KEY, state.uploadQueue);
      else localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(state.uploadQueue));
    } catch (error) {
      console.warn('PLM floating helper upload queue save failed:', error);
    }
  }

  function loadUploadHistory() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_HISTORY_KEY, null) : JSON.parse(localStorage.getItem(UPLOAD_HISTORY_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveUploadHistory() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_HISTORY_KEY, state.uploadHistory);
      else localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(state.uploadHistory));
    } catch (error) {
      console.warn('PLM floating helper upload history save failed:', error);
    }
  }

  function saveUploadQueueAndHistory(queue, history) {
    const queueSnapshot = Array.isArray(queue) ? queue : [];
    const historySnapshot = Array.isArray(history) ? history : [];
    state.uploadQueue = queueSnapshot;
    state.uploadHistory = historySnapshot;
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue(UPLOAD_HISTORY_KEY, historySnapshot);
        GM_setValue(UPLOAD_QUEUE_KEY, queueSnapshot);
      } else {
        localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(historySnapshot));
        localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queueSnapshot));
      }
    } catch (error) {
      console.warn('PLM floating helper upload state save failed:', error);
    }
    state.uploadQueue = queueSnapshot;
    state.uploadHistory = historySnapshot;
  }

  function moveCompletedUploadsToHistory() {
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const queueSource = latestQueue.length ? latestQueue : (state.uploadQueue || []);
    const completed = queueSource.filter((item) => /\u6210\u529f|\u5931\u8d25|\u8df3\u8fc7|\u5df2\u6709\u5185\u5bb9/.test(item.status || '') && !/\u8fdb\u884c\u4e2d/.test(item.status || ''));
    if (!completed.length) return;
    const additionsByProduct = new Map();
    completed.forEach((item) => {
      const archived = {
        ...item,
        status: item.kind === 'toy-label' ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : (item.kind === 'copyright' ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : (item.status || L.uploadSuccess)),
        step: item.kind === 'toy-label' ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : (item.kind === 'copyright' ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : item.step),
        completedAt: item.completedAt || item.updatedAt || new Date().toLocaleString(),
        xlsxKey: '',
        zipKey: '',
        copyrightFiles: getCopyrightUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      };
      additionsByProduct.set(uploadHistoryProductKey(archived), archived);
    });
    const additions = Array.from(additionsByProduct.values());
    const completedProductKeys = new Set(additions.map(uploadHistoryProductKey));
    const archivedKeys = new Set(completed.map(uploadHistoryKey));
    state.uploadQueue = queueSource.filter((item) => !archivedKeys.has(uploadHistoryKey(item)));
    state.uploadHistory = additions.concat(latestHistory.filter((item) => !completedProductKeys.has(uploadHistoryProductKey(item)))).slice(0, 200);
    completed.forEach(cleanupUploadFiles);
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
  }

  function archiveUploadItem(item) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const successText = latestItem.kind === 'toy-label' ? '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f' : (latestItem.kind === 'copyright' ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : L.uploadSuccess);
    const archived = { ...latestItem, status: successText, step: successText, completedAt, updatedAt: completedAt, xlsxKey: '', zipKey: '', copyrightFiles: getCopyrightUploadEntries(latestItem).map((entry) => ({ ...entry, key: '' })) };
    const archivedProductKey = uploadHistoryProductKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryProductKey(entry) !== archivedProductKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryProductKey(entry) !== archivedProductKey)).slice(0, 200);
    cleanupUploadFiles(latestItem);
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    if ((archived.kind || 'standard') === 'standard') syncInsightEvent('image_pack_upload_success', { sku: archived.sku || '', name: archived.name || '', source: 'upload-queue' });
    if (archived.kind === 'toy-label') syncInsightEvent('toy_label_upload_success', { sku: archived.sku || '', name: archived.name || '', source: 'upload-queue' });
    if (archived.sku) {
      if ((archived.kind || 'standard') === 'standard') {
        updateDailyLedgerForSku(archived.sku, { status: '已完成', stage: '完成', note: '上传成功', imagePackState: 'done', imagePackDone: true }, getTodayKey());
      } else if (archived.kind === 'toy-label') {
        updateDailyLedgerForSku(archived.sku, { labelFileState: 'done', labelFileDone: true }, getTodayKey());
      }
    }
    renderShell();
  }

  function archiveUploadFailure(item, status, reason, options) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const keepFiles = Boolean(options && options.keepFiles);
    const archived = {
      ...latestItem,
      status: status || L.uploadFailed,
      step: reason || latestItem.step || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      completedAt,
      updatedAt: completedAt,
      xlsxKey: keepFiles ? (latestItem.xlsxKey || '') : '',
      zipKey: keepFiles ? (latestItem.zipKey || '') : '',
      copyrightFiles: getCopyrightUploadEntries(latestItem).map((entry) => ({ ...entry, key: keepFiles ? (entry.key || '') : '' })),
    };
    const archivedKey = uploadHistoryKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryKey(entry) !== archivedKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryKey(entry) !== archivedKey)).slice(0, 200);
    if (!keepFiles) cleanupUploadFiles(latestItem);
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    renderShell();
  }

  function markUploadQueueBlocked(item, status, reason, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const updatedAt = new Date().toLocaleString();
    const blocked = {
      ...latestItem,
      ...(extra || {}),
      status: status || L.uploadFailed,
      step: reason || latestItem.step || status || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      forceReplace: false,
      updatedAt,
    };
    Object.assign(item, blocked);
    state.uploadQueue = latestQueue.some((entry) => entry.id === item.id)
      ? latestQueue.map((entry) => entry.id === item.id ? blocked : entry)
      : [blocked].concat(latestQueue);
    saveUploadQueue();
    renderShell();
  }

  function uploadHistoryKey(item) {
    const copyrightNames = getCopyrightUploadEntries(item).map((entry) => entry.name).join(',');
    return [item && item.sku, item && item.xlsxName, item && item.zipName, copyrightNames].filter(Boolean).join('|') || (item && item.id) || '';
  }

  function uploadHistoryProductKey(item) {
    return [(item && item.kind) || 'standard', item && item.sku].filter(Boolean).join('|') || (item && item.id) || '';
  }

  function findPreviousSuccessfulUpload(item, successfulHistory) {
    const history = Array.isArray(successfulHistory) ? successfulHistory : [];
    const key = uploadHistoryKey(item);
    const kind = item && item.kind || 'standard';
    return history.find((entry) => uploadHistoryKey(entry) === key && (entry.kind || 'standard') === kind)
      || history.find((entry) => entry.sku === item.sku && (entry.kind || 'standard') === kind)
      || null;
  }

  function isUploadHistorySuccess(item) {
    return /\u6210\u529f/.test(String(item && item.status || ''));
  }

  function loadUploadWorkerRunning() {
    try {
      return Boolean(typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_WORKER_KEY, false) : JSON.parse(localStorage.getItem(UPLOAD_WORKER_KEY) || 'false'));
    } catch (error) {
      return false;
    }
  }

  function saveUploadWorkerRunning(value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_WORKER_KEY, Boolean(value));
      else localStorage.setItem(UPLOAD_WORKER_KEY, JSON.stringify(Boolean(value)));
    } catch (error) {
      console.warn('PLM floating helper upload worker save failed:', error);
    }
  }

  function isUploadWorkerPage() {
    return /[?&]plmUploadWorker=1\b/.test(location.search);
  }

  function hasUploadRefreshRecovery() {
    return loadUploadQueue().some((item) => {
      if (!item || !item.xlsxKey || !item.zipKey) return false;
      if (item.resumeUploadAfterRefresh) return true;
      return Number(item.uploadPageRefreshRetryCount) > 0
        && /\u5f85\u4e0a\u4f20/.test(item.status || '')
        && /\u5237\u65b0\u540e\u91cd\u65b0\u641c\u7d22\u4e0a\u4f20/.test(item.step || '');
    });
  }

  function shouldStartUploadWorkerOnLoad() {
    return loadUploadWorkerRunning() && (isUploadWorkerPage() || hasUploadRefreshRecovery());
  }

  function loadToyLabelExportManifest() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(TOY_LABEL_EXPORT_MANIFEST_KEY, null)
        : JSON.parse(localStorage.getItem(TOY_LABEL_EXPORT_MANIFEST_KEY) || 'null');
      return saved && typeof saved === 'object'
        ? { signature: String(saved.signature || ''), files: Array.isArray(saved.files) ? saved.files : [], downloaded: Boolean(saved.downloaded) }
        : { signature: '', files: [], downloaded: false };
    } catch (error) {
      return { signature: '', files: [], downloaded: false };
    }
  }

  function saveToyLabelExportManifest(manifest) {
    const value = {
      signature: String(manifest && manifest.signature || ''),
      files: Array.isArray(manifest && manifest.files) ? manifest.files : [],
      downloaded: Boolean(manifest && manifest.downloaded),
    };
    if (typeof GM_setValue === 'function') GM_setValue(TOY_LABEL_EXPORT_MANIFEST_KEY, value);
    else localStorage.setItem(TOY_LABEL_EXPORT_MANIFEST_KEY, JSON.stringify(value));
  }

  async function clearToyLabelExportManifest(manifest) {
    const current = manifest || loadToyLabelExportManifest();
    await Promise.all((current.files || []).map((entry) => deleteUploadFile(entry.key).catch((error) => {
      console.warn('PLM floating helper toy label staged file cleanup failed:', error);
    })));
    saveToyLabelExportManifest({ signature: '', files: [], downloaded: false });
  }

  async function ensureToyLabelExportRun(signature) {
    const current = loadToyLabelExportManifest();
    const requestedSignature = String(signature || '');
    const previousSkus = new Set(current.signature.split('|').filter(Boolean));
    const requestedSkus = requestedSignature.split('|').filter(Boolean);
    if (current.signature === requestedSignature || (current.files.length && requestedSkus.length && requestedSkus.every((sku) => previousSkus.has(sku)))) return current;
    await clearToyLabelExportManifest(current);
    const next = { signature: requestedSignature, files: [], downloaded: false };
    saveToyLabelExportManifest(next);
    state.toyLabelBatchFiles = [];
    return next;
  }

  async function stageToyLabelBatchFiles(files, signature) {
    const manifest = await ensureToyLabelExportRun(signature);
    for (const file of files || []) {
      if (!file || !file.blob || !file.filename) continue;
      const key = 'toy-label-export:' + Date.now() + ':' + Math.random().toString(36).slice(2);
      await putUploadFile(key, file.blob);
      manifest.files.push({ key, sku: String(file.sku || ''), filename: String(file.filename) });
    }
    manifest.downloaded = false;
    saveToyLabelExportManifest(manifest);
  }

  function openUploadDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(UPLOAD_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(UPLOAD_DB_STORE)) db.createObjectStore(UPLOAD_DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putUploadFile(key, file) {
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readwrite');
      tx.objectStore(UPLOAD_DB_STORE).put(file, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function getUploadFile(key) {
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readonly');
      const request = tx.objectStore(UPLOAD_DB_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function cleanupUploadFiles(item) {
    if (!item) return;
    [item.xlsxKey, item.zipKey].concat(getCopyrightUploadEntries(item).map((entry) => entry.key)).filter(Boolean).forEach((key) => {
      deleteUploadFile(key).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
    });
  }

  async function deleteUploadFile(key) {
    if (!key) return;
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readwrite');
      tx.objectStore(UPLOAD_DB_STORE).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function getSkuListMode() {
    return state.settings && state.settings.skuListMode === 'waterfall' ? 'waterfall' : 'list';
  }

  function getSkuListSort() {
    return state.settings && state.settings.skuListSort === 'acquired' ? 'acquired' : 'assigned';
  }

  function parseSkuListTime(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value > 0 && value < 100000000000 ? value * 1000 : value;
    const text = String(value || '').trim();
    if (!text) return 0;
    if (/^\d+(?:\.\d+)?$/.test(text)) {
      const number = Number(text);
      return number > 0 && number < 100000000000 ? number * 1000 : number;
    }
    const parts = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?(?:\s+|T)(\d{1,2})[:：](\d{1,2})(?:[:：](\d{1,2}))?/);
    if (parts) {
      const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6] || 0), 0);
      const timestamp = date.getTime();
      if (Number.isFinite(timestamp)
        && date.getFullYear() === Number(parts[1])
        && date.getMonth() === Number(parts[2]) - 1
        && date.getDate() === Number(parts[3])) return timestamp;
    }
    const parsed = Date.parse(text.replace(/[年\/]/g, '-').replace(/月/g, '-').replace(/日/g, ' '));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getSkuListRecord(item) {
    const cached = item && item.sku ? loadData(item.sku) : null;
    return cached && typeof cached === 'object' ? { ...item, ...cached } : (item || {});
  }

  function sortSkuListItems(items) {
    const sort = getSkuListSort();
    const records = (items || []).map((item, index) => ({ item, index, record: getSkuListRecord(item) }));
    const time = (record) => {
      const assigned = parseSkuListTime(record.designAssignedAt);
      const acquired = [record.acquiredAtMs, record.fetchedAtMs, record.listPrefetchedAtMs, record.updatedAtMs, record.firstSeenAtMs, record.listPrefetchedAt, record.updatedAt, record.createdAt].map(parseSkuListTime).find((value) => value > 0) || 0;
      return sort === 'acquired' ? acquired : assigned;
    };
    return records.map((entry) => ({ ...entry, time: time(entry.record) })).sort((a, b) => {
      if (a.item.pinned && b.item.pinned) return (a.item.pinOrder || 0) - (b.item.pinOrder || 0);
      if (a.item.pinned) return -1;
      if (b.item.pinned) return 1;
      if (a.time !== b.time) return b.time - a.time;
      return a.index - b.index;
    }).map((entry) => entry.item);
  }

  function getSkuListImageUrl(data) {
    if (!data) return '';
    const candidates = [
      getProductThumbUrl(data),
      data.skuImageUrl,
      data.skuImageFallbackUrl,
      data.productListImageUrl,
      data.productListImageFallbackUrl,
      data.toyLabelProductImageUrl,
      data.toyLabelProductImageFallbackUrl,
      data.benchmarkImageUrl,
      data.benchmarkImageFallbackUrl,
    ];
    return candidates.map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
  }

  function getSortedIndex() {
    return [...state.index].sort((a, b) => {
      if (a.pinned && b.pinned) return (a.pinOrder || 0) - (b.pinOrder || 0);
      if (a.pinned) return -1;
      if (b.pinned) return 1;
      return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
    });
  }

  function upsertIndex(data) {
    if (!data || !data.sku) return;
    const item = {
      sku: data.sku,
      brand: cleanName(data.brand || ''),
      name: cleanName(data.name || ''),
      packageCode: data.packageCode || '',
      printCode: data.printCode || '',
      designAssignedAt: data.designAssignedAt || '',
      projectCreatedAt: data.projectCreatedAt || '',
      skuImageUrl: data.skuImageUrl || '',
      skuImageFallbackUrl: data.skuImageFallbackUrl || '',
      skuImageSource: data.skuImageSource || '',
      productListImageUrl: data.productListImageUrl || '',
      productListImageFallbackUrl: data.productListImageFallbackUrl || '',
      toyLabelProductImageUrl: data.toyLabelProductImageUrl || '',
      toyLabelProductImageFallbackUrl: data.toyLabelProductImageFallbackUrl || '',
      benchmarkImageUrl: data.benchmarkImageUrl || '',
      benchmarkImageFallbackUrl: data.benchmarkImageFallbackUrl || '',
      updatedAt: data.updatedAt || new Date().toLocaleString(),
      updatedAtMs: data.updatedAtMs || Date.now(),
    };
    const old = state.index.find((entry) => entry.sku === data.sku);
    if (old && old.pinned) {
      item.pinned = true;
      item.pinOrder = old.pinOrder || Date.now();
    }
    state.index = state.index.filter((entry) => entry.sku !== data.sku);
    state.index.unshift(item);
    saveIndex();
  }

  function togglePin(sku) {
    const item = state.index.find((entry) => entry.sku === sku);
    if (!item) return;
    if (item.pinned) {
      delete item.pinned;
      delete item.pinOrder;
    } else {
      item.pinned = true;
      item.pinOrder = Date.now();
    }
    saveIndex();
  }

  function deleteSkuFromList(sku) {
    if (!sku || !state.index.some((entry) => entry.sku === sku)) return;
    if (state.drawerTabFlowSku === sku) {
      stopScan();
      cancelDrawerTabFlow();
    }
    state.skuResultGeneration[sku] = Number(state.skuResultGeneration[sku] || 0) + 1;
    try {
      if (typeof GM_deleteValue === 'function') GM_deleteValue(STORAGE_PREFIX + sku);
      else if (typeof GM_setValue === 'function') GM_setValue(STORAGE_PREFIX + sku, null);
      else localStorage.removeItem(STORAGE_PREFIX + sku);
    } catch (error) {
      console.warn('PLM floating helper SKU delete failed:', error);
    }
    state.index = state.index.filter((entry) => entry.sku !== sku);
    saveIndex();
    state.ingredientHydratingSkus.delete(sku);
    state.copywritingHydratingSkus.delete(sku);
    delete state.ingredientHydrateFailedAt[sku];
    delete state.copywritingHydrateFailedAt[sku];
    delete state.sizeImageSessions[sku];
    if (state.selectedSku === sku || (state.data && state.data.sku === sku)) {
      const next = sortSkuListItems(state.index)[0] || null;
      state.selectedSku = next ? next.sku : '';
      state.data = next ? normalizeData(loadData(next.sku) || next) : null;
      state.skuPage = 1;
    }
    queueCloudBackup();
    addLog('info', '已删除 SKU 缓存', sku);
    showToast('已删除 ' + sku);
  }

  function loadData(sku) {
    if (!sku) return null;
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(STORAGE_PREFIX + sku, null);
      const raw = localStorage.getItem(STORAGE_PREFIX + sku);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function collectTrackedDataChanges(previous, next, options) {
    if (!previous || !next) return [];
    const opts = options || {};
    const tracked = ['brand', 'name', 'manualCategory', 'packageCode', 'printCode', 'packageSizeText', 'printSizeText', 'packageLength', 'packageWidth', 'packageHeight', 'productLength', 'productWidth', 'productHeight', 'netContent', 'grossWeight', 'englishName', 'ingredientChinese', 'ingredientEnglish', 'referenceUrl'];
    const source = opts.changeSource || '自动获取';
    const changedAt = new Date().toLocaleString();
    return tracked.reduce((changes, key) => {
      const before = compactText(previous[key]);
      const after = compactText(next[key]);
      if (before === after || (!before && !opts.trackEmptyChanges)) return changes;
      changes.push({ key, label: getSkuDataFieldLabel(key), before, after, source, changedAt });
      return changes;
    }, []);
  }

  function saveData(sku, data, options) {
    if (!sku || !data) return;
    const opts = options || {};
    const previous = loadData(sku);
    const previousNormalized = previous ? normalizeData(previous) : null;
    const normalized = normalizeData({ ...data, updatedAt: data.updatedAt || new Date().toLocaleString(), updatedAtMs: data.updatedAtMs || Date.now() });
    if (!opts.suppressChangeTracking && !Object.prototype.hasOwnProperty.call(data, 'recentFieldChanges') && previousNormalized) {
      normalized.recentFieldChanges = getStoredDataChanges(previousNormalized);
    }
    const detectedChanges = opts.suppressChangeTracking ? [] : collectTrackedDataChanges(previousNormalized, normalized, opts);
    if (detectedChanges.length) {
      const combined = detectedChanges.concat(getStoredDataChanges(normalized));
      const seen = new Set();
      normalized.recentFieldChanges = combined.filter((item) => {
        const identity = [item.key, item.before, item.after].join('|');
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      }).slice(0, 20);
    }
    try {
      saveDataDirect(sku, normalized);
      const viewingSku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!viewingSku || viewingSku === sku) {
        state.data = normalized;
        state.selectedSku = sku;
      }
      upsertIndex(normalized);
      recordDataQuality(normalized, 'saveData');
      queueCloudBackup();
      scheduleDesktopBridgeSnapshot();
      const previousPackKey = previousNormalized ? buildPackBoxKey(previousNormalized) : '';
      const nextPackKey = buildPackBoxKey(normalized);
      if (nextPackKey && nextPackKey !== previousPackKey) schedulePackAiEstimate(normalized);
      if (detectedChanges.length) {
        addLog('warn', 'SKU 数据发生变化', sku + ' | ' + detectedChanges.map((item) => item.label + '：' + (item.before || '未识别') + ' → ' + (item.after || '已清空')).join('；'));
      }
    } catch (error) {
      console.warn('PLM floating helper save failed:', error);
      addLog('error', '\u7f13\u5b58\u5546\u54c1\u5931\u8d25', (sku || '') + ' ' + formatErrorMessage(error));
    }
  }

  function saveDataDirect(sku, data) {
    if (typeof GM_setValue === 'function') GM_setValue(STORAGE_PREFIX + sku, data);
    else localStorage.setItem(STORAGE_PREFIX + sku, JSON.stringify(data));
  }

  function loadPosition() {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(POSITION_KEY, null);
      const raw = localStorage.getItem(POSITION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function savePosition(pos) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(POSITION_KEY, pos);
      else localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
    } catch (error) {
      console.warn('PLM floating helper position save failed:', error);
    }
  }

  function applySavedPosition(panel) {
    const pos = loadPosition();
    if (!pos) {
      // Scale Violet's preferred full-screen layout, while clamping it into any smaller viewport.
      const initialWidth = clamp(state.panelSize?.width || 686, 520, Math.min(1180, window.innerWidth - 24));
      const initialHeight = clamp(state.panelSize?.height || 906, 520, getPanelMaxHeight());
      const left = clamp(Math.round(window.innerWidth * INITIAL_LAYOUT.panelLeftRatio), 8, Math.max(8, window.innerWidth - initialWidth - 8));
      const top = clamp(Math.round(window.innerHeight * INITIAL_LAYOUT.panelTopRatio), 8, Math.max(8, window.innerHeight - initialHeight - 8));
      panel.style.right = Math.max(8, window.innerWidth - initialWidth - left) + 'px';
      panel.style.bottom = Math.max(8, window.innerHeight - initialHeight - top) + 'px';
      return;
    }
    if (Number.isFinite(pos.right)) panel.style.right = pos.right + 'px';
    if (Number.isFinite(pos.bottom)) panel.style.bottom = pos.bottom + 'px';
  }

  function getCurrentLayoutSnapshot() {
    const panel = ensurePanel();
    const panelRect = panel.getBoundingClientRect();
    const panelStyle = getComputedStyle(panel);
    const launcher = document.getElementById(LAUNCHER_ID);
    const launcherRect = launcher && launcher.getBoundingClientRect();
    const right = Number.parseFloat(panelStyle.right);
    const bottom = Number.parseFloat(panelStyle.bottom);
    const panelRight = Number.isFinite(right) ? right : Math.max(0, window.innerWidth - panelRect.right);
    const panelBottom = Number.isFinite(bottom) ? bottom : Math.max(0, window.innerHeight - panelRect.bottom);
    const launcherLeft = launcherRect ? Math.round(launcherRect.left) : (loadLauncherPosition()?.left ?? 0);
    const launcherTop = launcherRect ? Math.round(launcherRect.top) : (loadLauncherPosition()?.top ?? 0);
    return [
      'PLM 悬浮助手默认布局',
      '窗口位置：right ' + Math.round(panelRight) + 'px / bottom ' + Math.round(panelBottom) + 'px',
      '窗口尺寸：' + Math.round(panelRect.width) + ' x ' + Math.round(panelRect.height),
      '唤起按钮：left ' + launcherLeft + 'px / top ' + launcherTop + 'px',
      '左右分隔栏：' + Math.round(state.splitWidth) + 'px',
    ].join('\n');
  }

  function positionLauncher(launcher) {
    if (!launcher) return;
    launcher.classList.add('is-floating');
    if (launcher.parentElement !== document.documentElement) document.documentElement.appendChild(launcher);
    const saved = loadLauncherPosition();
    if (saved) {
      launcher.style.left = saved.left + 'px';
      launcher.style.top = saved.top + 'px';
      return;
    }
    const buttonWidth = 86;
    const buttonHeight = 34;
    launcher.style.left = clamp(Math.round(window.innerWidth * INITIAL_LAYOUT.launcherLeftRatio), 8, Math.max(8, window.innerWidth - buttonWidth - 8)) + 'px';
    launcher.style.top = clamp(Math.round(window.innerHeight * INITIAL_LAYOUT.launcherTopRatio), 8, Math.max(8, window.innerHeight - buttonHeight - 8)) + 'px';
  }

  function loadLauncherPosition() {
    try {
      const raw = typeof GM_getValue === 'function' ? GM_getValue(LAUNCHER_POSITION_KEY, null) : JSON.parse(localStorage.getItem(LAUNCHER_POSITION_KEY) || 'null');
      if (!raw || !Number.isFinite(raw.left) || !Number.isFinite(raw.top)) return null;
      return {
        left: clamp(raw.left, 8, Math.max(8, window.innerWidth - 40)),
        top: clamp(raw.top, 8, Math.max(8, window.innerHeight - 24)),
      };
    } catch (error) {
      return null;
    }
  }

  function saveLauncherPosition(pos) {
    const value = {
      left: clamp(pos.left, 8, Math.max(8, window.innerWidth - 40)),
      top: clamp(pos.top, 8, Math.max(8, window.innerHeight - 24)),
    };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LAUNCHER_POSITION_KEY, value);
      else localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('PLM floating helper launcher position save failed:', error);
    }
  }

  function loadPanelSize() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(SIZE_KEY, null) : JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
      if (value && Number.isFinite(value.width) && Number.isFinite(value.height)) {
        return {
          width: value.width,
          height: value.height,
        };
      }
      return { width: 686, height: Math.min(906, getPanelMaxHeight()) };
    } catch (error) {
      return { width: 686, height: Math.min(906, getPanelMaxHeight()) };
    }
  }

  function savePanelSize(size) {
    const maxHeight = getPanelMaxHeight();
    const value = {
      width: clamp(size.width, 640, Math.min(1180, window.innerWidth - 24)),
      height: clamp(size.height, 520, maxHeight),
    };
    state.panelSize = value;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SIZE_KEY, value);
      else localStorage.setItem(SIZE_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('PLM floating helper size save failed:', error);
    }
  }

  function applyPanelSize(panel) {
    if (!state.panelSize) return;
    const height = clamp(state.panelSize.height, 520, getPanelMaxHeight());
    const width = clamp(state.panelSize.width, 520, Math.min(1180, window.innerWidth - 24));
    panel.style.width = width + 'px';
    panel.style.height = height + 'px';
    panel.style.maxHeight = getPanelMaxHeight() + 'px';
    panel.classList.toggle('is-narrow-panel', width < 920);
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.height = 'auto';
  }

  function getPanelMaxHeight() {
    return Math.max(520, Math.floor(window.innerHeight * 0.96));
  }

  function loadSplitWidth() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(SPLIT_KEY, INITIAL_LAYOUT.splitWidth) : Number(localStorage.getItem(SPLIT_KEY) || INITIAL_LAYOUT.splitWidth);
      return clamp(Number(value) || INITIAL_LAYOUT.splitWidth, 110, 260);
    } catch (error) {
      return INITIAL_LAYOUT.splitWidth;
    }
  }

  function saveSplitWidth(width) {
    const value = clamp(width, 110, 260);
    state.splitWidth = value;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SPLIT_KEY, value);
      else localStorage.setItem(SPLIT_KEY, String(value));
    } catch (error) {
      console.warn('PLM floating helper split save failed:', error);
    }
  }

  function applySplitWidth(panel) {
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.setProperty('--pfh-list-width', state.splitWidth + 'px');
    const splitter = panel.querySelector('.pfh-splitter');
    if (splitter) splitter.classList.toggle('is-dragging', Boolean(state.splitDragging));
  }

  function makeSplitterDraggable(panel, splitter) {
    state.splitDragging = false;
    splitter.addEventListener('mousedown', (event) => {
      state.splitDragging = true;
      state.ignoreOutsideClickUntil = Date.now() + 500;
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener('mousemove', (event) => {
      if (!state.splitDragging) return;
      const main = panel.querySelector('.pfh-main');
      if (!main) return;
      const rect = main.getBoundingClientRect();
      const width = clamp(event.clientX - rect.left, 110, Math.min(260, rect.width - 220));
      state.splitWidth = width;
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!state.splitDragging) return;
      state.splitDragging = false;
      saveSplitWidth(state.splitWidth);
      state.ignoreOutsideClickUntil = Date.now() + 300;
      applySplitWidth(panel);
    });
  }

  function makePanelResizable(panel) {
    let dragging = false;
    let direction = '';
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startRight = 0;
    let startBottom = 0;
    panel.querySelectorAll('.pfh-resize-handle').forEach((resizer) => resizer.addEventListener('mousedown', (event) => {
      dragging = true;
      direction = resizer.dataset.resizeDir || 'se';
      state.ignoreOutsideClickUntil = Date.now() + 500;
      startX = event.clientX;
      startY = event.clientY;
      const rect = panel.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      startRight = Number.parseFloat(getComputedStyle(panel).right) || 0;
      startBottom = Number.parseFloat(getComputedStyle(panel).bottom) || 0;
      event.preventDefault();
      event.stopPropagation();
    }));
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      let width = startWidth;
      let height = startHeight;
      let right = startRight;
      let bottom = startBottom;
      const minWidth = 520;
      const maxWidth = Math.min(1180, window.innerWidth - 24);
      const maxHeight = getPanelMaxHeight();
      if (direction.includes('w')) width = startWidth - dx;
      if (direction.includes('e')) {
        width = startWidth + dx;
        right = startRight - dx;
      }
      if (direction.includes('n')) height = startHeight - dy;
      if (direction.includes('s')) {
        height = startHeight + dy;
        bottom = startBottom - dy;
      }
      width = clamp(width, minWidth, maxWidth);
      height = clamp(height, 520, maxHeight);
      right = Math.max(0, Math.min(window.innerWidth - width - 8, right));
      bottom = Math.max(0, Math.min(window.innerHeight - height - 8, bottom));
      state.panelSize = { width, height };
      panel.style.right = right + 'px';
      panel.style.bottom = bottom + 'px';
      applyPanelSize(panel);
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      savePanelSize(state.panelSize);
      addLog('info', '窗口大小已保存', Math.round(state.panelSize.width) + ' x ' + Math.round(state.panelSize.height));
      savePosition({
        right: Number.parseFloat(getComputedStyle(panel).right) || 0,
        bottom: Number.parseFloat(getComputedStyle(panel).bottom) || 0,
      });
      state.ignoreOutsideClickUntil = Date.now() + 300;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeDraggable(panel, handle) {
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;
    let dragging = false;
    handle.addEventListener('mousedown', (event) => {
      if (event.target.tagName === 'BUTTON') return;
      if (event.target !== handle) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startRight = Number.parseFloat(getComputedStyle(panel).right) || 0;
      startBottom = Number.parseFloat(getComputedStyle(panel).bottom) || 0;
      event.preventDefault();
    });
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      panel.style.right = Math.max(0, startRight - (event.clientX - startX)) + 'px';
      panel.style.bottom = Math.max(0, startBottom - (event.clientY - startY)) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      savePosition({
        right: Number.parseFloat(getComputedStyle(panel).right) || 0,
        bottom: Number.parseFloat(getComputedStyle(panel).bottom) || 0,
      });
    });
  }

  function makeLauncherDraggable(launcher) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    let moved = false;
    launcher.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      const rect = launcher.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      moved = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const left = clamp(startLeft + dx, 8, Math.max(8, window.innerWidth - launcher.offsetWidth - 8));
      const top = clamp(startTop + dy, 8, Math.max(8, window.innerHeight - launcher.offsetHeight - 8));
      launcher.style.left = left + 'px';
      launcher.style.top = top + 'px';
      event.preventDefault();
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        state.launcherSuppressClickUntil = Date.now() + 250;
        const rect = launcher.getBoundingClientRect();
        saveLauncherPosition({ left: rect.left, top: rect.top });
      }
    });
  }

  function getVisibleText(root) {
    return normalizeText((root && (root.innerText || root.textContent)) || '');
  }

  function getNodeText(root) {
    if (!root) return '';
    return normalizeText([root.innerText, root.textContent, root.getAttribute && root.getAttribute('title'), root.getAttribute && root.getAttribute('aria-label')]
      .filter(Boolean)
      .join('\n'));
  }

  function normalizeText(text) {
    return String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').trim();
  }

  function compactText(text) {
    return normalizeText(text).replace(/\s+/g, ' ');
  }

  function compactLabel(text) {
    return compactText(text).replace(/\*+$/g, '').trim();
  }

  function trimNumber(num) {
    return Number(num).toFixed(2).replace(/\.?0+$/, '');
  }

  function isVisibleElement(el) {
    if (!el || !el.isConnected) return false;
    let node = el;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      node = node.parentElement;
    }
    return el.getClientRects().length > 0;
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }


})();
