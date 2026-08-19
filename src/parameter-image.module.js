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
      { category: '洁面', keywords: ['洁面', '洗面奶', 'cleanser', 'face wash'], phrase: 'Gently cleanses & refreshes', priority: 85 },
      { category: '面膜', keywords: ['面膜', 'mask', 'sheet mask'], phrase: 'Deep hydration & renewal', priority: 85 },
      { category: '唇部护理', keywords: ['润唇', '唇膏', 'lip balm', 'lip care'], phrase: 'Moisturizes & protects', priority: 80 },
      { category: '香氛', keywords: ['香水', '香氛', 'perfume', 'fragrance'], phrase: 'Fresh scent & lasting comfort', priority: 75 },
      { category: '手部护理', keywords: ['护手霜', 'hand cream', 'hand care'], phrase: 'Nourishes & softens hands', priority: 75 },
      { category: '口腔护理', keywords: ['牙膏', '漱口', 'toothpaste', 'mouthwash'], phrase: 'Fresh breath & daily care', priority: 75 },
      { category: '卫生护理', keywords: ['卫生巾', '湿巾', '纸巾', 'sanitary', 'wipes', 'tissue'], phrase: 'Gentle care & everyday comfort', priority: 65 },
      { category: '食品', keywords: ['零食', '饼干', '糖果', '食品', 'snack', 'cookie', 'candy', 'food'], phrase: 'Delicious taste for every moment', priority: 65 },
      { category: '饮品', keywords: ['饮料', '茶', '咖啡', 'juice', 'drink', 'tea', 'coffee'], phrase: 'Refreshing taste & daily enjoyment', priority: 65 },
      { category: '玩具', keywords: ['玩具', 'toy', 'toys'], phrase: 'Fun play & happy moments', priority: 100 },
      { category: '毛绒玩具', keywords: ['毛绒', '公仔', 'plush', 'stuffed toy', 'soft toy'], phrase: 'Soft touch & playful comfort', priority: 105 },
      { category: '积木拼图', keywords: ['积木', '拼图', 'building blocks', 'puzzle'], phrase: 'Builds creativity & thinking skills', priority: 105 },
      { category: '娃娃玩偶', keywords: ['娃娃', '玩偶', 'doll', 'dolls'], phrase: 'Imaginative play & joyful moments', priority: 105 },
      { category: '益智玩具', keywords: ['益智', '早教', 'educational toy', 'learning toy'], phrase: 'Learning through fun play', priority: 105 },
      { category: '遥控玩具', keywords: ['遥控', '遥控车', 'remote control', 'rc car'], phrase: 'Exciting play & easy control', priority: 105 },
      { category: '户外玩具', keywords: ['户外玩具', '滑板车', '跳绳', 'outdoor toy', 'scooter'], phrase: 'Active play & outdoor fun', priority: 100 },
      { category: '文具礼品', keywords: ['文具', '礼品', 'stationery', 'gift'], phrase: 'Useful design & everyday delight', priority: 55 },
      { category: '家居用品', keywords: ['家居', '收纳', '厨房', 'home', 'storage', 'kitchen'], phrase: 'Smart design for everyday living', priority: 50 },
      { category: '膳食营养', keywords: ['膳食营养', '入口', '软糖', '胶囊', '缓释粉', 'dietary nutrition', 'gummy', 'gummies', 'capsule', 'extended-release powder'], phrase: 'Daily dietary nutrition', priority: 109 },
      { category: '钻石艺术套装', keywords: ['钻石艺术套装', '珍珠钻石画', '钻石挂饰', 'diamond art', 'diamond painting', 'diamond craft', 'diamond pendant'], phrase: 'Creative craft & sparkling display', priority: 120 },
      { category: '面霜', keywords: ['面霜', '膏', '乳霜', 'face cream', 'facial cream', 'moisturizing cream'], phrase: 'Hydrates & smooths skin', priority: 95 },
      { category: '营养补充', keywords: ['营养补充', '胶囊', '软糖', '滴剂', '粉', 'nutritional supplement', 'dietary supplement', 'gummy', 'gummies', 'drops', 'powder'], phrase: 'Daily nutritional support', priority: 111 },
      { category: '牙科护理', keywords: ['牙科护理', '牙套', '牙贴', '牙膏', '假牙', 'dental care', 'dental aligner', 'teeth strips', 'toothpaste', 'denture'], phrase: 'Daily dental care', priority: 114 },
      { category: '创意玩具', keywords: ['捏捏乐', 'DIY套装', '毛绒', 'stress toy', 'diy kit', 'plush toy'], phrase: 'Fun play & hands-on creativity', priority: 104 },
      { category: '护肤品', keywords: ['护肤品', 'skincare', 'skin care', 'face care'], phrase: 'Daily skin care & radiance', priority: 78 },
      { category: '口服营养', keywords: ['口服营养', '胶囊', '软糖', '滴剂', 'oral nutrition', 'oral supplement', 'gummy', 'gummies', 'drops'], phrase: 'Everyday wellness support', priority: 110 },
      { category: '口腔护理', keywords: ['口腔护理', '牙膏', '牙贴', '牙套', 'oral care', 'toothpaste', 'teeth strips', 'dental aligner'], phrase: 'Fresh breath & daily care', priority: 113 },
      { category: '口服营养品', keywords: ['口服营养品', '胶囊', '软糖', '含片', 'oral nutritional product', 'oral supplement', 'gummy', 'gummies', 'lozenge'], phrase: 'Everyday nutritional support', priority: 112 },
    ];
    let featureRules = defaultRules.slice();
    let rulesLoaded = false;
    let topologyRule = null;
    let topologyRulePromise = null;
    let topologyRuleStatus = 'unloaded';

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
      const sortedRules = featureRules.slice().sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
      const categoryText = String(category).toLowerCase();
      const categoryMatched = categoryText && sortedRules.find((rule) =>
        (rule.keywords || []).some((keyword) => categoryText.includes(String(keyword).toLowerCase()))
      );
      const matched = categoryMatched || sortedRules.find((rule) =>
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
          showSideOverride: false,
          frontIsLength: true,
          frontAxisOverride: false,
          topologyApplied: false,
          topologyRuleVersion: '',
          topologyMessage: '',
          featuresDirty: false,
          editorOpen: false,
          manualTarget: Boolean(data && data.singleBottle) ? 'product' : 'box',
          manualTargetMode: 'auto',
          manualPoints: { box: [], product: [] },
          manualLineTypes: { box: [], product: [] },
          manualLineLayouts: { box: [], product: [] },
          manualPointHistory: [],
          manualAutoInitialized: false,
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
      if (!session.manualLineLayouts) session.manualLineLayouts = { box: [], product: [] };
      if (!['auto', 'box', 'product'].includes(session.manualTargetMode)) session.manualTargetMode = 'auto';
      if (!Array.isArray(session.manualLineTypes.box)) session.manualLineTypes.box = [];
      if (!Array.isArray(session.manualLineTypes.product)) session.manualLineTypes.product = [];
      if (!Array.isArray(session.manualLineLayouts.box)) session.manualLineLayouts.box = [];
      if (!Array.isArray(session.manualLineLayouts.product)) session.manualLineLayouts.product = [];
      if (!Array.isArray(session.manualPointHistory)) session.manualPointHistory = [];
      if (typeof session.manualAutoInitialized !== 'boolean') session.manualAutoInitialized = Boolean(session.manualPoints.box.length || session.manualPoints.product.length);
      if (typeof session.showSideOverride !== 'boolean') session.showSideOverride = false;
      if (typeof session.frontAxisOverride !== 'boolean') session.frontAxisOverride = false;
      if (typeof session.topologyApplied !== 'boolean') session.topologyApplied = false;
      if (typeof session.topologyRuleVersion !== 'string') session.topologyRuleVersion = '';
      if (typeof session.topologyMessage !== 'string') session.topologyMessage = '';
      session.productHeightSide = isFoodParameterProduct(data) ? 'left' : 'right';
      return session;
    }

    function topologyRulePath(manifest) {
      const raw = String(manifest && (manifest.rulePath || manifest.ruleUrl || manifest.path) || '').trim();
      if (!raw) return '/assets/v1/parameter-layout-rules.json';
      if (/^https?:\/\//i.test(raw)) {
        try {
          const parsed = new URL(raw);
          return parsed.pathname + (parsed.search || '');
        } catch (_) { return '/assets/v1/parameter-layout-rules.json'; }
      }
      if (raw.startsWith('/assets/')) return raw;
      if (raw.startsWith('./')) return '/assets/v1/' + raw.slice(2);
      if (raw.startsWith('/')) return '/assets' + raw;
      return '/assets/v1/' + raw;
    }

    async function loadTopologyRule() {
      if (topologyRulePromise) return topologyRulePromise;
      topologyRuleStatus = 'loading';
      topologyRulePromise = (async () => {
        const request = context.cloudAssetRequest;
        if (typeof request !== 'function') throw new Error('云端资源请求不可用');
        const manifest = await request('/assets/v1/parameter-layout-rules.manifest.json', 'json');
        if (!manifest || Number(manifest.schemaVersion || 1) !== 1 || !manifest.ruleVersion) throw new Error('参数图布局规则清单无效');
        const rule = await request(topologyRulePath(manifest), 'json');
        const profiles = Array.isArray(rule && rule.profiles) ? rule.profiles : [];
        const templates = profiles.flatMap((profile) => profile && profile.edgeTopology && Array.isArray(profile.edgeTopology.templates)
          ? profile.edgeTopology.templates : []);
        if (Number(rule && rule.schemaVersion || 1) !== 1 || !templates.length) throw new Error('参数图布局规则没有边拓扑模板');
        topologyRule = { ...rule, ruleVersion: String(rule.ruleVersion || manifest.ruleVersion), manifest };
        topologyRuleStatus = 'ready';
        return topologyRule;
      })().catch((error) => {
        topologyRuleStatus = 'fallback';
        topologyRule = null;
        return null;
      });
      return topologyRulePromise;
    }

    async function loadRules() {
      if (rulesLoaded) return false;
      rulesLoaded = true;
      const results = await Promise.allSettled([
        context.cloudRequest('/parameter-features?v=' + encodeURIComponent(SCRIPT_VERSION), { method: 'GET' }),
        loadTopologyRule(),
      ]);
      const response = results[0] && results[0].status === 'fulfilled' ? results[0].value : null;
      const rows = response && Array.isArray(response.rules) ? response.rules : [];
      if (rows.length) { featureRules = rows; return true; }
      return results.some((result) => result && result.status === 'fulfilled' && result.value);
    }

    function fieldHtml(session, key, label, wide) {
      return '<label' + (wide ? ' class="wide"' : '') + '><span>' + context.escapeHtml(label) + '</span><input class="pfh-parameter-field" data-field="' + key + '" value="' + context.escapeHtml(session.fields[key] == null ? '' : session.fields[key]) + '"></label>';
    }

    function manualDimensionTypes(target) {
      return target === 'box' ? ['length', 'width', 'height'] : ['length', 'height'];
    }

    function manualDimensionLabel(type) {
      return ({ length: '长', width: '宽', height: '高' })[type] || '未识别';
    }

    function requiredManualPoints(target) {
      return manualDimensionTypes(target).length * 2;
    }

    function minimumManualLines(target) {
      return target === 'box' ? 2 : manualDimensionTypes(target).length;
    }

    function completedManualLines(session, target) {
      const points = session.manualPoints && session.manualPoints[target] || [];
      return Math.min(manualDimensionTypes(target).length, Math.floor(points.length / 2));
    }

    function completeManualPath(session, target) {
      const points = session.manualPoints && session.manualPoints[target];
      return Array.isArray(points) && points.length % 2 === 0 && completedManualLines(session, target) >= minimumManualLines(target);
    }

    function manualDimensionValue(session, target, type) {
      if (target === 'product') return type === 'height' ? session.fields.productHeight : session.fields.productLength;
      if (type === 'length') return session.fields.packageLength;
      if (type === 'height') return session.fields.packageHeight;
      return session.fields.packageWidth;
    }

    function sourcePointOrNull(point) {
      const x = Number(point && point.x), y = Number(point && point.y);
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    }

    function appendManualEdge(points, edge) {
      const start = sourcePointOrNull(edge && edge.start), end = sourcePointOrNull(edge && edge.end);
      if (start && end) points.push(start, end);
    }

    function autoManualPoints(session, target) {
      const analysis = session.analysis || {};
      const points = [];
      if (target === 'product') {
        const product = analysis.product;
        if (!product) return points;
        const heightSide = analysis.productHeightSide || session.productHeightSide || 'right';
        const heightX = heightSide === 'left' ? product.left : product.right;
        const horizontalY = session.showSide ? product.top : product.bottom;
        appendManualEdge(points, { start: { x: heightX, y: product.top }, end: { x: heightX, y: product.bottom } });
        appendManualEdge(points, { start: { x: product.left, y: horizontalY }, end: { x: product.right, y: horizontalY } });
        return points;
      }

      const box = analysis.box, product = analysis.product;
      const topology = analysis.transparentTopology;
      if (session.topologyApplied && topology) {
        const heightSide = cartonHeightSide(box, product, topology.sideFace === 'left' ? 'left' : 'right');
        appendManualEdge(points, cartonTopologyHeightEdge(topology, heightSide));
        appendManualEdge(points, topology.frontEdge);
        if (session.showSide && topology.depthEdge) appendManualEdge(points, topology.depthEdge);
        return points;
      }

      const perspective = analysis.perspective;
      if (session.showSide && perspective) {
        const heightSide = cartonHeightSide(box, product, 'left');
        appendManualEdge(points, heightSide === 'right'
          ? { start: perspective.rightTop, end: perspective.rightBottom }
          : { start: perspective.outerTop, end: perspective.outerBottom });
        appendManualEdge(points, { start: perspective.junctionBottom, end: perspective.rightBottom });
        appendManualEdge(points, { start: perspective.outerTop, end: perspective.junctionTop });
        return points;
      }

      if (!box) return points;
      const heightSide = cartonHeightSide(box, product, 'left');
      const heightX = heightSide === 'left' ? box.left : box.right;
      appendManualEdge(points, { start: { x: heightX, y: box.top }, end: { x: heightX, y: box.bottom } });
      appendManualEdge(points, { start: { x: box.left, y: box.bottom }, end: { x: box.right, y: box.bottom } });
      return points;
    }

    function seedManualPointsFromAnalysis(session) {
      if (session.manualAutoInitialized) return false;
      const seeded = { box: autoManualPoints(session, 'box'), product: autoManualPoints(session, 'product') };
      session.manualPoints = seeded;
      session.manualLineTypes = { box: [], product: [] };
      session.manualLineLayouts = { box: [], product: [] };
      session.manualPointHistory = [];
      ['box', 'product'].forEach((target) => {
        seeded[target].forEach(() => session.manualPointHistory.push(target));
      });
      session.manualAutoInitialized = true;
      return Boolean(seeded.box.length || seeded.product.length);
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
      return '纸盒 ' + box + '/2-3 · 产品 ' + product + '/2' + (pending ? ' · 正在画' + (pending === 'box' ? '纸盒' : '产品') + '终点' : '');
    }

    function manualCalibrationHtml(session, target) {
      const lineCount = completedManualLines(session, target);
      const effective = autoAssignedManualTypes(session, target);
      const overrides = session.manualLineTypes[target] || [];
      if (!lineCount) return '<span style="color:' + getActiveTheme().muted + ';font-size:12px">每条尺寸边分别点击起点和终点，纸盒可标长/宽/高（完成 2 或 3 条），产品标长/高。</span>';
      return Array.from({ length: lineCount }, (_, index) => {
        const override = overrides[index] || '';
        const buttons = ['auto'].concat(manualDimensionTypes(target)).map((type) => {
          const label = type === 'auto' ? '自动' : manualDimensionLabel(type);
          const active = (type === 'auto' ? !override : override === type) ? ' is-active' : '';
          return '<button type="button" class="' + active + '" data-action="parameter-editor-line-type" data-object="' + target + '" data-line-index="' + index + '" data-dimension="' + type + '">' + label + '</button>';
        }).join('');
        return '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 6px;border:1px solid ' + getActiveTheme().border + ';border-radius:10px;background:' + getActiveTheme().primarySoft + '"><b style="color:' + getActiveTheme().primaryHover + ';font-size:12px">第' + (index + 1) + '条：' + (override ? '已校准 ' : '智能识别 ') + manualDimensionLabel(effective[index]) + '</b>' + buttons + '</span>';
      }).join('');
    }

    function manualAllCalibrationHtml(session) {
      const sections = ['box', 'product'].filter((target) => completedManualLines(session, target)).map((target) =>
        '<span style="display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap"><strong style="color:' + (target === 'box' ? getActiveTheme().primary : getActiveTheme().secondary) + ';font-size:12px">' + (target === 'box' ? '纸盒' : '产品') + '</strong>' + manualCalibrationHtml(session, target) + '</span>'
      );
      return sections.join('') || '<span style="color:' + getActiveTheme().muted + ';font-size:12px">直接在图片上画线：纸盒与产品都只需标注长和高。</span>';
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
      const targetMode = ['auto', 'box', 'product'].includes(session.manualTargetMode) ? session.manualTargetMode : 'auto';
      const targetButtons = [
        ['auto', '自动判断'],
        ['box', '纸盒'],
        ['product', '产品'],
      ].map(([mode, label]) => '<button type="button" class="pfh-parameter-editor-target-button' + (targetMode === mode ? ' is-active' : '') + '" data-action="parameter-editor-target-mode" data-target-mode="' + mode + '" aria-pressed="' + (targetMode === mode ? 'true' : 'false') + '">' + label + '</button>').join('');
      return '<section class="pfh-parameter-editor">' +
        '<header class="pfh-parameter-editor-head"><h3>手动调整尺寸标注</h3><span>自动尺寸和数值已保留 · 拖动端点调整线，拖动黑色尺寸线/数值调整位置 · Ctrl+Z 撤回端点</span><button type="button" data-action="parameter-editor-close">关闭</button></header>' +
        '<div class="pfh-parameter-editor-tools">' +
          '<span class="pfh-parameter-editor-box-progress" style="padding:7px 10px;border-radius:9px;background:' + getActiveTheme().primarySoft + ';color:' + getActiveTheme().primary + ';font-size:12px">纸盒 ' + boxCount + '/2-3 边</span>' +
          '<span class="pfh-parameter-editor-product-progress" style="padding:7px 10px;border-radius:9px;background:' + getActiveTheme().secondarySoft + ';color:' + getActiveTheme().secondary + ';font-size:12px">产品 ' + productCount + '/2 边</span>' +
          '<span class="pfh-parameter-editor-target-picker" style="display:inline-flex;align-items:center;gap:4px;padding:3px 4px;border:1px solid ' + getActiveTheme().border + ';border-radius:10px"><b style="padding:0 4px;color:' + getActiveTheme().muted + ';font-size:12px">下条线：</b>' + targetButtons + '</span>' +
          '<button type="button" data-action="parameter-editor-undo">撤销一点（Ctrl+Z）</button><button type="button" data-action="parameter-editor-reset">清空线条</button>' +
          '<button type="button" data-action="parameter-editor-retry">重新载入底图</button>' +
          '<button type="button" class="pfh-parameter-editor-apply" data-action="parameter-editor-apply">应用并生成</button>' +
          '<div class="pfh-parameter-editor-calibration" style="display:flex;flex:1 0 100%;align-items:center;gap:12px;flex-wrap:wrap">' + manualAllCalibrationHtml(session) + '</div>' +
        '</div>' +
        '<div class="pfh-parameter-editor-stage' + (!session.editorImage && !session.editorLoadError ? ' is-loading' : '') + '"><canvas class="pfh-parameter-editor-canvas"></canvas></div>' +
        '<footer class="pfh-parameter-editor-foot"><span>自动标注可直接微调；清空线条后再点击图片重新画线</span><span class="pfh-parameter-editor-status' + statusClass + '">' + context.escapeHtml(session.editorStatus || '等待载入底图') + '</span><span class="pfh-parameter-editor-progress">' + manualOverallProgressText(session) + '</span></footer>' +
        '<details class="pfh-parameter-editor-diagnostics"><summary>诊断日志（测试异常时请展开并复制）</summary><pre>' + context.escapeHtml(editorLogText(session)) + '</pre></details>' +
      '</section>';
    }

    function editorScale(image) {
      return Math.max(1, Math.max(image.naturalWidth, image.naturalHeight) / 1200);
    }

    function editorCanvasPadding(image) {
      return Math.round(112 * editorScale(image));
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

    function editorDimensionScale(image) {
      const width = Number(image && (image.naturalWidth || image.width) || 0);
      const height = Number(image && (image.naturalHeight || image.height) || 0);
      const maxSide = Math.max(width, height);
      return maxSide ? Math.max(.65, Math.min(2, maxSide / 1600)) : 1;
    }

    function manualLineLayout(session, target, index) {
      const stored = session.manualLineLayouts && session.manualLineLayouts[target] && session.manualLineLayouts[target][index];
      const offsetValue = Number(stored && stored.offset);
      const offset = Number.isFinite(offsetValue) ? Math.max(8, offsetValue) : 36;
      const labelOffsetValue = Number(stored && stored.labelOffset);
      const labelOffset = Number.isFinite(labelOffsetValue) ? Math.max(8, labelOffsetValue) : offset;
      const tangentValue = Number(stored && stored.tangentShift);
      const tangentShift = Number.isFinite(tangentValue) ? tangentValue : 0;
      return { offset, labelOffset, tangentShift };
    }

    function manualDimensionOptions(session, target, index, options, sourceScale) {
      const stored = session.manualLineLayouts && session.manualLineLayouts[target] && session.manualLineLayouts[target][index];
      if (!stored) return options;
      const layout = manualLineLayout(session, target, index);
      const scale = Number(sourceScale) || 1;
      return { ...(options || {}), offset: layout.offset * scale, labelOffset: layout.labelOffset * scale, tangentShift: layout.tangentShift * scale, manualPlacement: true };
    }

    function editorDimensionGeometry(ctx, start, end, value, normalSign, layout, fontScale) {
      if (!number(value)) return null;
      const dx = end.x - start.x, dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (length < 8) return null;
      const safeScale = Math.max(.65, Number(fontScale) || 1);
      const nx = (-dy / length) * normalSign, ny = (dx / length) * normalSign;
      const tx = dx / length, ty = dy / length;
      const label = dimensionLabel(value);
      let labelWidth = label.length * 23 * safeScale;
      if (ctx) {
        ctx.save(); ctx.font = '42px Arial';
        labelWidth = ctx.measureText(label).width * safeScale;
        ctx.restore();
      }
      const textGap = length > labelWidth + 48 * safeScale ? 26 * safeScale : 46 * safeScale;
      const lineOffset = Number(layout && layout.offset) || 36;
      const labelOffset = Number(layout && layout.labelOffset) || lineOffset;
      const tangentShift = Number(layout && layout.tangentShift) || 0;
      const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const lineStart = { x: start.x + nx * lineOffset, y: start.y + ny * lineOffset };
      const lineEnd = { x: end.x + nx * lineOffset, y: end.y + ny * lineOffset };
      const labelCenter = {
        x: middle.x + nx * (labelOffset + textGap) + tx * tangentShift,
        y: middle.y + ny * (labelOffset + textGap) + ty * tangentShift,
      };
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      return { label, fontScale: safeScale, lineStart, lineEnd, labelCenter, labelWidth, angle, normal: { x: nx, y: ny }, tangent: { x: tx, y: ty } };
    }

    function drawEditorDimension(ctx, geometry) {
      if (!geometry) return;
      const scale = geometry.fontScale;
      const tick = 16 * scale;
      ctx.save();
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5 * scale;
      ctx.setLineDash([]);
      line(ctx, geometry.lineStart.x, geometry.lineStart.y, geometry.lineEnd.x, geometry.lineEnd.y);
      line(ctx, geometry.lineStart.x - geometry.normal.x * tick, geometry.lineStart.y - geometry.normal.y * tick, geometry.lineStart.x + geometry.normal.x * tick, geometry.lineStart.y + geometry.normal.y * tick);
      line(ctx, geometry.lineEnd.x - geometry.normal.x * tick, geometry.lineEnd.y - geometry.normal.y * tick, geometry.lineEnd.x + geometry.normal.x * tick, geometry.lineEnd.y + geometry.normal.y * tick);
      ctx.translate(geometry.labelCenter.x, geometry.labelCenter.y);
      ctx.rotate(geometry.angle);
      ctx.font = Math.round(42 * scale) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(geometry.label, 0, 0);
      ctx.restore();
    }

    function drawEditorLines(ctx, session, target, color, active, scale, offsetX, offsetY) {
      const points = session.manualPoints[target] || [];
      if (!points.length) return;
      const displayPoints = points.map((point) => ({ x: point.x + (offsetX || 0), y: point.y + (offsetY || 0) }));
      const center = manualPathCenter(displayPoints);
      const effective = autoAssignedManualTypes(session, target);
      const overrides = session.manualLineTypes[target] || [];
      const dimensionScale = editorDimensionScale({ naturalWidth: ctx.canvas.width, naturalHeight: ctx.canvas.height });
      ctx.save();
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = (active ? 5 : 3) * scale;
      ctx.setLineDash(active ? [] : [10 * scale, 7 * scale]);
      for (let index = 0; index < displayPoints.length; index += 2) {
        const start = displayPoints[index], end = displayPoints[index + 1];
        if (!start || !end) continue;
        const lineIndex = index / 2;
        const value = manualDimensionValue(session, target, effective[lineIndex]);
        const dimension = editorDimensionGeometry(ctx, start, end, value, outwardNormalSign(start, end, center), manualLineLayout(session, target, lineIndex), dimensionScale);
        drawEditorDimension(ctx, dimension);
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
        const middleX = (start.x + end.x) / 2, middleY = (start.y + end.y) / 2;
        ctx.fillStyle = color; ctx.font = '700 ' + Math.round(18 * scale) + 'px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('第' + (lineIndex + 1) + '条 · ' + manualDimensionLabel(effective[lineIndex]) + (overrides[lineIndex] ? '（已校准）' : '（智能）'), middleX, middleY - 15 * scale);
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

    function distanceToSegment(point, start, end) {
      const dx = end.x - start.x, dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy;
      if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y);
      const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
      return Math.hypot(point.x - (start.x + dx * ratio), point.y - (start.y + dy * ratio));
    }

    function findManualAnnotationHit(session, displayPoint, image, offsetX, offsetY) {
      let best = null;
      const scale = editorDimensionScale(image);
      ['box', 'product'].forEach((target) => {
        const points = session.manualPoints[target] || [];
        const displayPoints = points.map((point) => ({ x: point.x + (offsetX || 0), y: point.y + (offsetY || 0) }));
        const center = manualPathCenter(displayPoints);
        const effective = autoAssignedManualTypes(session, target);
        for (let index = 0; index < displayPoints.length; index += 2) {
          const start = displayPoints[index], end = displayPoints[index + 1];
          if (!start || !end) continue;
          const lineIndex = index / 2;
          const value = manualDimensionValue(session, target, effective[lineIndex]);
          const geometry = editorDimensionGeometry(null, start, end, value, outwardNormalSign(start, end, center), manualLineLayout(session, target, lineIndex), scale);
          if (!geometry) continue;
          const lineDistance = distanceToSegment(displayPoint, geometry.lineStart, geometry.lineEnd);
          const labelDistance = Math.hypot(displayPoint.x - geometry.labelCenter.x, displayPoint.y - geometry.labelCenter.y);
          const lineRadius = 16 * scale;
          const labelRadius = Math.max(28 * scale, geometry.labelWidth / 2 + 14 * scale);
          if (lineDistance <= lineRadius && (!best || lineDistance < best.distance)) best = { kind: 'line', target, index: lineIndex, distance: lineDistance, geometry };
          else if (labelDistance <= labelRadius && (!best || labelDistance < best.distance)) best = { kind: 'label', target, index: lineIndex, distance: labelDistance, geometry };
        }
      });
      return best;
    }

    function updateManualLineLayout(session, target, index, patch) {
      const current = manualLineLayout(session, target, index);
      session.manualLineLayouts[target][index] = { ...current, ...(patch || {}) };
      return session.manualLineLayouts[target][index];
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
      drawEditorLines(ctx, session, 'box', getActiveTheme().primary, true, scale, padding, padding);
      drawEditorLines(ctx, session, 'product', getActiveTheme().secondary, true, scale, padding, padding);
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
      if (session.manualTargetMode && session.manualTargetMode !== 'auto' && available.includes(session.manualTargetMode)) return session.manualTargetMode;
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
      session.manualLineLayouts[target] = session.manualLineLayouts[target].slice(0, Math.ceil(session.manualPoints[target].length / 2));
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
      const targetButtons = root && root.querySelectorAll('.pfh-parameter-editor-target-button');
      if (progress) progress.textContent = manualOverallProgressText(session);
      if (calibration) calibration.innerHTML = manualAllCalibrationHtml(session);
      if (boxProgress) boxProgress.textContent = '纸盒 ' + completedManualLines(session, 'box') + '/2-3 边';
      if (productProgress) productProgress.textContent = '产品 ' + completedManualLines(session, 'product') + '/2 边';
      targetButtons && targetButtons.forEach((button) => {
        const active = button.getAttribute('data-target-mode') === session.manualTargetMode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
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
      session.editorStatus = session.manualPoints.box.length || session.manualPoints.product.length
        ? '自动尺寸和数值已显示，可直接调整'
        : '底图已显示，可开始标注';
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
        const padding = editorCanvasPadding(session.editorImage);
        const displayPoint = { x: point.x + padding, y: point.y + padding };
        const annotationHit = hit ? null : findManualAnnotationHit(session, displayPoint, session.editorImage, padding, padding);
        if (annotationHit) {
          session.manualTarget = annotationHit.target;
          session.editorStatus = annotationHit.kind === 'label'
            ? '正在调整第' + (annotationHit.index + 1) + '条尺寸数据位置'
            : '正在调整第' + (annotationHit.index + 1) + '条尺寸线位置';
          session.editorDragging = {
            kind: 'annotation',
            annotationKind: annotationHit.kind,
            target: annotationHit.target,
            index: annotationHit.index,
            geometry: annotationHit.geometry,
            lastDisplayPoint: displayPoint,
          };
          try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
          redraw();
          return;
        }
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
            const targetLabel = target === 'box' ? '纸盒' : '产品';
            const targetSource = session.manualTargetMode === target ? '已按手动选择归入' : '已自动判断为';
            session.editorStatus = targetLabel + '第' + (lineIndex + 1) + '条边' + targetSource + '“' + targetLabel + '”，尺寸智能识别为“' + manualDimensionLabel(assigned[lineIndex]) + '”，可在上方校准';
            editorLog(session, '智能识别尺寸边', { target, line: lineIndex + 1, dimension: assigned[lineIndex] || '' });
          } else {
            const targetLabel = target === 'box' ? '纸盒' : '产品';
            session.editorStatus = (session.manualTargetMode === target ? '已手动选择' : '已自动判断为') + '“' + targetLabel + '”，请点击这条边的终点';
          }
        }
        if (index < 0) return;
        session.editorDragging = { kind: 'point', target, index, snapAxis };
        try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
        redraw();
      };
      canvas.onpointermove = (event) => {
        const dragging = session.editorDragging;
        const rawPoint = canvasPoint(event, canvas, session.editorImage);
        if (!dragging) return;
        if (dragging.kind === 'annotation') {
          const padding = editorCanvasPadding(session.editorImage);
          const displayPoint = { x: rawPoint.x + padding, y: rawPoint.y + padding };
          const dx = displayPoint.x - dragging.lastDisplayPoint.x, dy = displayPoint.y - dragging.lastDisplayPoint.y;
          const normalDelta = dx * dragging.geometry.normal.x + dy * dragging.geometry.normal.y;
          const tangentDelta = dx * dragging.geometry.tangent.x + dy * dragging.geometry.tangent.y;
          const layout = manualLineLayout(session, dragging.target, dragging.index);
          if (dragging.annotationKind === 'line') {
            updateManualLineLayout(session, dragging.target, dragging.index, {
              offset: layout.offset + normalDelta,
              labelOffset: layout.labelOffset + normalDelta,
            });
          } else {
            updateManualLineLayout(session, dragging.target, dragging.index, {
              labelOffset: layout.labelOffset + normalDelta,
              tangentShift: layout.tangentShift + tangentDelta,
            });
          }
          dragging.lastDisplayPoint = displayPoint;
          redraw();
          return;
        }
        if (!session.manualPoints[dragging.target] || !session.manualPoints[dragging.target][dragging.index]) return;
        const points = session.manualPoints[dragging.target];
        const constrained = constrainEditorPoint(rawPoint, points, dragging.index, event.ctrlKey);
        points[dragging.index] = constrained.point;
        dragging.snapAxis = constrained.axis;
        redraw();
      };
      const release = (event) => {
        const dragging = session.editorDragging;
        if (dragging && dragging.kind === 'annotation') {
          const layout = manualLineLayout(session, dragging.target, dragging.index);
          editorLog(session, '完成尺寸位置调整', {
            target: dragging.target,
            line: dragging.index + 1,
            part: dragging.annotationKind,
            offset: Math.round(layout.offset),
            labelOffset: Math.round(layout.labelOffset),
            tangentShift: Math.round(layout.tangentShift),
          });
        }
        const finalPoint = dragging && session.manualPoints[dragging.target] && session.manualPoints[dragging.target][dragging.index];
        session.editorDragging = null;
        try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
        if (dragging && dragging.kind !== 'annotation' && finalPoint) editorLog(session, '完成标注点定位', {
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
        if (typeof context.applyTheme === 'function') context.applyTheme();
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
      const seeded = seedManualPointsFromAnalysis(session);
      session.editorLoadError = '';
      session.editorStatus = session.editorImage ? '正在恢复底图…' : '正在读取底图…';
      session.error = '';
      editorLog(session, '打开全屏工作区', {
        sku: data && data.sku || '',
        hasCachedImage: Boolean(session.editorImage),
        retainedAutoAnnotations: seeded,
        boxLines: completedManualLines(session, 'box'),
        productLines: completedManualLines(session, 'product'),
      });
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
      if (!data || !data.sku) return '<div class="pfh-parameter-scroll">' + context.detailViewTabs('parameterImage') + '<div class="pfh-parameter-status is-error">请先从左侧选择 SKU。</div></div>';
      const session = ensureSession(data);
      const topologyHint = session.topologyMessage ? ' · ' + session.topologyMessage + (session.topologyRuleVersion ? '（' + session.topologyRuleVersion + '）' : '') : '';
      const status = session.error ? '<div class="pfh-parameter-status is-error">' + context.escapeHtml(session.error) + '</div>' : (session.productResult ? '<div class="pfh-parameter-status">已生成产品尺寸图和英文参数图' + context.escapeHtml(topologyHint) + '。</div>' : '');
      const preview = (label, url) => '<div class="pfh-parameter-preview-card"><b>' + label + '</b>' + (url ? '<img src="' + url + '">' : '<span>导入透明 PNG 后显示预览</span>') + '</div>';
      const heroImage = preferredImageUrl(data);
      const heroThumb = heroImage ? '<span class="pfh-parameter-hero-thumb"><img src="' + context.escapeHtml(heroImage) + '" alt=""></span>' : '<span class="pfh-parameter-hero-thumb is-empty">' + context.escapeHtml(data.sku) + '</span>';
      const html = '<div class="pfh-parameter-scroll">' + context.detailViewTabs('parameterImage') + '<section class="pfh-parameter-page">' +
        '<header class="pfh-parameter-hero">' + heroThumb + '<div class="pfh-parameter-hero-copy"><small>PARAMETER IMAGE</small><h3>' + context.escapeHtml(data.sku) + ' 参数图</h3><p>' + context.escapeHtml([data.brand, data.name].filter(Boolean).join(' ')) + '</p></div></header>' +
        '<div class="pfh-parameter-workspace"><div class="pfh-parameter-controls">' +
          '<button type="button" class="pfh-parameter-drop' + (session.busy ? ' is-busy' : '') + '" data-action="parameter-image-pick"' + (session.busy ? ' disabled' : '') + '>' + (session.busy ? '<i class="pfh-loading-scan" aria-hidden="true"></i>' : '') + '<strong>' + (session.busy ? '正在分析并生成…' : '点击、拖入或悬浮粘贴透明 PNG') + '</strong><span>仅支持透明 PNG（JPG / WebP 请先导出为透明 PNG）</span><span>一张图可同时包含纸盒与产品</span></button>' +
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

    // The workbench rule describes *which* edges to annotate, not a fixed pixel
    // position.  Rebuild the same lightweight geometry from the current PNG so
    // a box can move to either side and its visible side can face either way.
    function transparentObjectComponents(pixels, width, height) {
      const total = width * height;
      const opaque = new Uint8Array(total);
      for (let index = 0; index < total; index += 1) opaque[index] = pixels[index * 4 + 3] > 12 ? 1 : 0;
      const visited = new Uint8Array(total);
      const components = [];
      const stack = [];
      for (let start = 0; start < total; start += 1) {
        if (!opaque[start] || visited[start]) continue;
        visited[start] = 1; stack.push(start);
        let count = 0, left = width, top = height, right = 0, bottom = 0;
        while (stack.length) {
          const index = stack.pop();
          const x = index % width, y = Math.floor(index / width);
          count += 1; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
          for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny += 1) {
            for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx += 1) {
              const neighbor = ny * width + nx;
              if (opaque[neighbor] && !visited[neighbor]) { visited[neighbor] = 1; stack.push(neighbor); }
            }
          }
        }
        const componentWidth = right - left + 1, componentHeight = bottom - top + 1;
        if (count < total / 400 || componentWidth < width / 30 || componentHeight < height / 30) continue;
        components.push({ left, top, right: right + 1, bottom: bottom + 1, width: componentWidth, height: componentHeight, pixelCount: count, fillRatio: count / Math.max(1, componentWidth * componentHeight) });
      }
      return components.sort((a, b) => a.left - b.left);
    }

    function transparentComponentUnion(components) {
      if (!components.length) return null;
      const left = Math.min(...components.map((component) => component.left));
      const top = Math.min(...components.map((component) => component.top));
      const right = Math.max(...components.map((component) => component.right));
      const bottom = Math.max(...components.map((component) => component.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }

    function rgbaDistanceAt(pixels, width, leftX, rightX, y) {
      const left = (y * width + leftX) * 4, right = (y * width + rightX) * 4;
      return (Math.abs(pixels[left] - pixels[right]) + Math.abs(pixels[left + 1] - pixels[right + 1]) + Math.abs(pixels[left + 2] - pixels[right + 2])) / 3;
    }

    function percentile(values, ratio) {
      const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
      if (!sorted.length) return 0;
      return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))];
    }

    function detectTransparentFaceSeam(pixels, width, height, component, preferredSide) {
      const boxWidth = component.width, boxHeight = component.height;
      if (boxWidth < 30 || boxHeight < 40) return null;
      const span = Math.max(1, Math.min(7, Math.floor(boxWidth / 100)));
      const geometrySpread = Math.max(1, Math.min(4, Math.floor(boxWidth / 100)));
      const startX = component.left + Math.floor(boxWidth * .06), endX = component.right - 1 - Math.floor(boxWidth * .06);
      const startY = component.top + Math.floor(boxHeight * .04), endY = component.bottom - 1 - Math.floor(boxHeight * .04);
      const scored = [];
      for (let x = startX; x <= endX; x += 1) {
        const relative = (x - component.left) / Math.max(1, boxWidth);
        const side = relative >= .08 && relative <= .43 ? 'left' : (relative >= .57 && relative <= .92 ? 'right' : '');
        if (!side || (preferredSide && side !== preferredSide)) continue;
        const leftX = Math.max(component.left, x - span), rightX = Math.min(component.right - 1, x + span);
        const differences = [];
        for (let y = startY; y <= endY; y += 2) {
          const leftAlpha = pixels[(y * width + leftX) * 4 + 3], rightAlpha = pixels[(y * width + rightX) * 4 + 3];
          if (leftAlpha <= 12 || rightAlpha <= 12) continue;
          differences.push(rgbaDistanceAt(pixels, width, leftX, rightX, y));
        }
        if (differences.length < Math.max(12, Math.floor(boxHeight / 10))) continue;
        const score = median(differences) * .72 + percentile(differences, .72) * .28;
        // A printed highlight, label, or product artwork can create a strong
        // RGB seam without being a carton side.  A real side face also changes
        // the alpha silhouette at the seam versus the outer edge (perspective
        // top/bottom), so require a small but measurable contour delta.
        const seamRange = alphaColumnRange(pixels, width, height, x, component.top, component.bottom, geometrySpread);
        const outerX = side === 'left' ? component.left : component.right - 1;
        const outerRange = alphaColumnRange(pixels, width, height, outerX, component.top, component.bottom, geometrySpread);
        if (!seamRange || !outerRange) continue;
        const shapeDelta = Math.abs(seamRange.top - outerRange.top) + Math.abs(seamRange.bottom - outerRange.bottom);
        if (shapeDelta < Math.max(3, boxHeight * .005)) continue;
        scored.push({ score, x, side, shapeDelta });
      }
      if (!scored.length) return null;
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0], baseline = median(scored.map((item) => item.score)), separation = best.score - baseline;
      if (best.score < 5 || separation < 1.25) return null;
      return { x: best.x, side: best.side, confidence: Math.max(.54, Math.min(.97, .54 + separation / 26 + (best.score - 5) / 90)) };
    }

    function sourcePoint(point, scale) { return { x: point.x / scale, y: point.y / scale }; }

    function matchTransparentTopologyTemplate(rule, boxPosition, sideFace, hasDepth, allowSideMismatch) {
      const templates = (rule && Array.isArray(rule.profiles) ? rule.profiles : []).flatMap((profile) =>
        profile && profile.edgeTopology && Array.isArray(profile.edgeTopology.templates) ? profile.edgeTopology.templates : []);
      if (!templates.length) return null;
      let best = null;
      templates.forEach((template) => {
        const templateSide = String(template && template.sideFace || 'none');
        const templatePosition = String(template && template.boxPosition || 'single');
        if (!allowSideMismatch && templateSide !== sideFace) return;
        let score = 0;
        if (templateSide === sideFace) score += 5;
        else if (templateSide === 'none' && sideFace === 'none') score += 4;
        if (templatePosition === boxPosition) score += 4;
        else if (templatePosition === 'single' || boxPosition === 'single') score += 1;
        if (Boolean(template && template.depthEdge) === Boolean(hasDepth)) score += 1.5;
        score += Math.min(1, Number(template && template.sampleCount || 0) / 100);
        if (!best || score > best.score) best = { template, score };
      });
      return best && best.score >= 4 ? best.template : null;
    }

    function axisValue(session, axis, fallback) {
      if (axis === 'boxLength') return session.fields.packageLength;
      if (axis === 'boxDepth') return session.fields.packageWidth;
      if (axis === 'boxHeight') return session.fields.packageHeight;
      return fallback;
    }

    function analyzeTransparentTopology(pixels, width, height, session, rule, scale) {
      if (!rule || !Array.isArray(rule.profiles) || !rule.profiles.some((profile) => profile && profile.edgeTopology && Array.isArray(profile.edgeTopology.templates))) return null;
      const components = transparentObjectComponents(pixels, width, height);
      if (components.length < 2) return null;
      const boxComponent = components.slice().sort((a, b) => (b.fillRatio - a.fillRatio) || (b.pixelCount - a.pixelCount))[0];
      const boxIndex = components.indexOf(boxComponent);
      const productComponents = components.filter((component) => component !== boxComponent);
      const productComponent = transparentComponentUnion(productComponents);
      if (!productComponent) return null;
      const boxPosition = components.length <= 1 ? 'single' : (boxIndex === 0 ? 'left' : (boxIndex === components.length - 1 ? 'right' : 'middle'));
      let seam = detectTransparentFaceSeam(pixels, width, height, boxComponent, '');
      let template = matchTransparentTopologyTemplate(rule, boxPosition, seam ? seam.side : 'none', Boolean(seam), true);
      if (template && template.sideFace && template.sideFace !== 'none' && (!seam || seam.side !== template.sideFace)) {
        const hinted = detectTransparentFaceSeam(pixels, width, height, boxComponent, template.sideFace);
        if (hinted && (!seam || hinted.confidence >= seam.confidence * .82)) seam = hinted;
      }
      const sideFace = seam ? seam.side : 'none';
      template = matchTransparentTopologyTemplate(rule, boxPosition, sideFace, Boolean(seam), false) || null;
      const inset = Math.max(1, Math.min(5, Math.floor(boxComponent.width / 120)));
      const leftOuter = boxComponent.left + inset, rightOuter = boxComponent.right - 1 - inset;
      const frontLeftX = sideFace === 'left' ? seam.x : leftOuter;
      const frontRightX = sideFace === 'right' ? seam.x : rightOuter;
      const spread = Math.max(1, Math.min(4, Math.floor(boxComponent.width / 100)));
      const leftRange = alphaColumnRange(pixels, width, height, frontLeftX, boxComponent.top, boxComponent.bottom, spread);
      const rightRange = alphaColumnRange(pixels, width, height, frontRightX, boxComponent.top, boxComponent.bottom, spread);
      if (!leftRange || !rightRange) return null;
      const toSource = (point) => sourcePoint(point, scale);
      const frontTopLeft = toSource({ x: frontLeftX, y: leftRange.top });
      const frontTopRight = toSource({ x: frontRightX, y: rightRange.top });
      const frontBottomRight = toSource({ x: frontRightX, y: rightRange.bottom });
      const frontBottomLeft = toSource({ x: frontLeftX, y: leftRange.bottom });
      const frontCorners = [frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft];
      const heightEdge = sideFace === 'left' ? { start: frontTopRight, end: frontBottomRight } : { start: frontTopLeft, end: frontBottomLeft };
      const frontEdge = { start: frontBottomLeft, end: frontBottomRight };
      let sideCorners = [], depthEdge = null;
      if (seam) {
        const outerX = sideFace === 'left' ? leftOuter : rightOuter;
        const outerRange = alphaColumnRange(pixels, width, height, outerX, boxComponent.top, boxComponent.bottom, spread);
        if (outerRange) {
          const outerTop = toSource({ x: outerX, y: outerRange.top });
          const outerBottom = toSource({ x: outerX, y: outerRange.bottom });
          const seamTop = sideFace === 'left' ? frontTopLeft : frontTopRight;
          const seamBottom = sideFace === 'left' ? frontBottomLeft : frontBottomRight;
          sideCorners = [seamTop, outerTop, outerBottom, seamBottom];
          depthEdge = { start: seamTop, end: outerTop };
        }
      }
      const box = { left: boxComponent.left / scale, top: boxComponent.top / scale, right: boxComponent.right / scale, bottom: boxComponent.bottom / scale, width: boxComponent.width / scale, height: boxComponent.height / scale };
      const product = { left: productComponent.left / scale, top: productComponent.top / scale, right: productComponent.right / scale, bottom: productComponent.bottom / scale, width: productComponent.width / scale, height: productComponent.height / scale };
      const shapeConfidence = Math.max(.58, Math.min(.90, .58 + boxComponent.fillRatio * .32));
      const confidence = seam ? Math.max(0, Math.min(.98, shapeConfidence * .45 + seam.confidence * .55)) : shapeConfidence;
      const topology = {
        boxPosition,
        sideFace,
        confidence,
        frontCorners,
        sideCorners,
        heightEdge,
        frontEdge,
        depthEdge,
        frontAxis: String(template && template.frontAxis || ''),
        depthAxis: String(template && template.depthAxis || ''),
        verticalAxis: String(template && template.verticalAxis || ''),
        axisMappingVerified: Boolean(template && template.axisMappingVerified),
        templateId: String(template && template.id || ''),
      };
      session.topologyApplied = Boolean(template && confidence >= .64);
      if (!session.frontAxisOverride && topology.axisMappingVerified) {
        if (topology.frontAxis === 'boxLength') session.frontIsLength = true;
        else if (topology.frontAxis === 'boxDepth') session.frontIsLength = false;
      }
      if (!session.showSideOverride && session.topologyApplied) session.showSide = sideFace !== 'none';
      session.topologyRuleVersion = String(rule.ruleVersion || (rule.manifest && rule.manifest.ruleVersion) || '');
      session.topologyMessage = session.topologyApplied ? '已按云端边拓扑规则标注' : '边拓扑置信度不足，使用基础识别';
      return {
        box,
        product,
        splitX: (box.right + product.left) / 2,
        sidePixels: seam ? Math.abs((seam.x - (sideFace === 'left' ? boxComponent.left : boxComponent.right)) / scale) : 0,
        detectedSide: sideFace !== 'none',
        perspective: null,
        transparentTopology: topology,
        topologyRuleVersion: session.topologyRuleVersion,
        productHeightSide: product.right <= box.left ? 'left' : 'right',
        sourceWidth: width / scale,
        sourceHeight: height / scale,
      };
    }

    function analyzeImage(image, session, rule, pixelPayload) {
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      let pixels = pixelPayload && pixelPayload.pixels;
      if (!pixels) {
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, width, height);
        pixels = ctx.getImageData(0, 0, width, height).data;
      }
      if (session.singleBottle) {
        const upperBody = alphaBoundsRegion(pixels, width, height, 0, width, 0, Math.round(height * .74));
        const bottle = upperBody && alphaBoundsRegion(pixels, width, height, upperBody.left, upperBody.right, 0, height);
        if (!bottle) throw new Error('没有可靠识别出单瓶产品轮廓，请重新导出透明 PNG。');
        const f = 1 / scale;
        const convert = (rect) => ({ left: rect.left * f, top: rect.top * f, right: rect.right * f, bottom: rect.bottom * f, width: rect.width * f, height: rect.height * f });
        return { box: null, product: convert(bottle), splitX: 0, sidePixels: 0, detectedSide: false, perspective: null, sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight };
      }
      session.topologyApplied = false;
      session.topologyMessage = (session.topologyRuleStatus || topologyRuleStatus) === 'ready' ? '未匹配到边拓扑模板，使用基础识别' : '云端边拓扑规则未加载，使用基础识别';
      const topologyAnalysis = analyzeTransparentTopology(pixels, width, height, session, rule, scale);
      if (topologyAnalysis && session.topologyApplied) return topologyAnalysis;
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
      if (session.showSide === null && !session.showSideOverride) session.showSide = detectedSide;
      session.productHeightSide = originalProduct.right <= originalBox.left ? 'left' : session.productHeightSide;
      return { box: originalBox, product: originalProduct, splitX: split * f, sidePixels, detectedSide, perspective, productHeightSide: originalProduct.right <= originalBox.left ? 'left' : 'right', sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight };
    }

    let parameterAnalysisWorkerSource = '';

    function getParameterAnalysisWorkerSource() {
      if (parameterAnalysisWorkerSource) return parameterAnalysisWorkerSource;
      const functions = [
        'const number = ' + number.toString() + ';',
        alphaBoundsRegion,
        alphaBounds,
        median,
        alphaColumnRange,
        detectPerspectiveGeometry,
        transparentObjectComponents,
        transparentComponentUnion,
        rgbaDistanceAt,
        percentile,
        detectTransparentFaceSeam,
        sourcePoint,
        matchTransparentTopologyTemplate,
        analyzeTransparentTopology,
        analyzeImage,
      ].map((item) => typeof item === 'string' ? item : item.toString()).join('\n');
      parameterAnalysisWorkerSource = `'use strict';\n${functions}\nself.onmessage = function(event) {
  const payload = event.data || {};
  try {
    const pixels = new Uint8ClampedArray(payload.pixelBuffer);
    const session = payload.session || {};
    const image = { naturalWidth: Number(payload.sourceWidth) || 1, naturalHeight: Number(payload.sourceHeight) || 1 };
    const analysis = analyzeImage(image, session, payload.rule || null, { pixels, width: Number(payload.width) || 1, height: Number(payload.height) || 1 });
    self.postMessage({ ok: true, analysis, sessionPatch: { topologyApplied: Boolean(session.topologyApplied), topologyRuleVersion: String(session.topologyRuleVersion || ''), topologyMessage: String(session.topologyMessage || ''), frontIsLength: Boolean(session.frontIsLength), showSide: session.showSide, productHeightSide: String(session.productHeightSide || '') } });
  } catch (error) {
    self.postMessage({ ok: false, error: String(error && error.message || error || '参数图分析失败') });
  }
};`;
      return parameterAnalysisWorkerSource;
    }

    function getParameterAnalysisPixels(image) {
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, width, height);
      return { width, height, pixels: ctx.getImageData(0, 0, width, height).data };
    }

    async function runParameterImageAnalysis(image, session, rule) {
      const canUseWorker = typeof Worker === 'function' && typeof Blob === 'function' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
      if (!canUseWorker) return { analysis: analyzeImage(image, session, rule), worker: false };
      let pixelPayload;
      try {
        pixelPayload = getParameterAnalysisPixels(image);
        const sourceUrl = URL.createObjectURL(new Blob([getParameterAnalysisWorkerSource()], { type: 'application/javascript' }));
        const worker = new Worker(sourceUrl);
        const result = await new Promise((resolve, reject) => {
          let settled = false;
          const finish = (callback, value) => {
            if (settled) return;
            settled = true;
            worker.terminate();
            URL.revokeObjectURL(sourceUrl);
            callback(value);
          };
          worker.onmessage = (event) => {
            const payload = event && event.data || {};
            if (!payload.ok) finish(reject, new Error(payload.error || '参数图分析失败'));
            else finish(resolve, payload);
          };
          worker.onerror = (event) => finish(reject, new Error(event && event.message || '参数图 Worker 启动失败'));
          try {
            worker.postMessage({
              pixelBuffer: pixelPayload.pixels.buffer,
              width: pixelPayload.width,
              height: pixelPayload.height,
              sourceWidth: image.naturalWidth,
              sourceHeight: image.naturalHeight,
              rule,
              session: {
                singleBottle: Boolean(session.singleBottle),
                frontIsLength: Boolean(session.frontIsLength),
                showSide: session.showSide,
                showSideOverride: Boolean(session.showSideOverride),
                frontAxisOverride: Boolean(session.frontAxisOverride),
                topologyRuleStatus,
                productHeightSide: session.productHeightSide || '',
                fields: {
                  packageLength: session.fields && session.fields.packageLength || '',
                  packageWidth: session.fields && session.fields.packageWidth || '',
                  packageHeight: session.fields && session.fields.packageHeight || '',
                },
              },
            }, [pixelPayload.pixels.buffer]);
          } catch (error) {
            finish(reject, error);
          }
        });
        return { analysis: result.analysis, sessionPatch: result.sessionPatch || {}, worker: true };
      } catch (error) {
        // CSP or older userscript sandboxes may reject blob Workers. Preserve the
        // existing behavior as a safe fallback instead of breaking generation.
        return { analysis: analyzeImage(image, session, rule), worker: false, fallback: true };
      }
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

    function dimensionLayoutBox(start, end, labelWidth, angle, center, lineStart, lineEnd) {
      const textHeight = 52;
      const cos = Math.abs(Math.cos(angle)), sin = Math.abs(Math.sin(angle));
      const halfWidth = (labelWidth * cos + textHeight * sin) / 2 + 10;
      const halfHeight = (labelWidth * sin + textHeight * cos) / 2 + 10;
      const textBox = { left: center.x - halfWidth, top: center.y - halfHeight, right: center.x + halfWidth, bottom: center.y + halfHeight };
      const lineBox = {
        left: Math.min(lineStart.x, lineEnd.x) - 9,
        top: Math.min(lineStart.y, lineEnd.y) - 9,
        right: Math.max(lineStart.x, lineEnd.x) + 9,
        bottom: Math.max(lineStart.y, lineEnd.y) + 9,
      };
      return {
        left: Math.min(textBox.left, lineBox.left),
        top: Math.min(textBox.top, lineBox.top),
        right: Math.max(textBox.right, lineBox.right),
        bottom: Math.max(textBox.bottom, lineBox.bottom),
      };
    }

    function dimensionOverlapArea(left, right) {
      const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
      const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
      return width * height;
    }

    function chooseDimensionPlacement(ctx, start, end, value, normalSign, options) {
      const dx = end.x - start.x, dy = end.y - start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const tx = dx / length, ty = dy / length;
      const nx = (-dy / length) * normalSign, ny = (dx / length) * normalSign;
      const label = dimensionLabel(value);
      ctx.save(); ctx.font = '42px Arial';
      const baseOffset = Number(options && options.offset) || 36;
      const textGap = length > ctx.measureText(label).width + 48 ? 26 : 46;
      const labelWidth = ctx.measureText(label).width;
      ctx.restore();
      if (options && options.manualPlacement) {
        const labelOffset = Number(options.labelOffset);
        const tangentShift = Number(options.tangentShift);
        return {
          lineOffset: baseOffset,
          labelOffset: Number.isFinite(labelOffset) ? Math.max(8, labelOffset) : baseOffset,
          textGap,
          tangentShift: Number.isFinite(tangentShift) ? tangentShift : 0,
        };
      }
      // Keep the measurement geometry anchored to the detected edge.  Layout
      // avoidance is allowed to move the value label, but never the dimension
      // line itself; otherwise the line can appear detached from the product.
      const lineStart = { x: start.x + nx * baseOffset, y: start.y + ny * baseOffset };
      const lineEnd = { x: end.x + nx * baseOffset, y: end.y + ny * baseOffset };
      if (!options || !Array.isArray(options.avoidBoxes)) {
        return { lineOffset: baseOffset, labelOffset: baseOffset, textGap, tangentShift: 0 };
      }
      const normalOffsets = [baseOffset, baseOffset + 44, baseOffset + 88, Math.max(18, baseOffset - 18), baseOffset + 132];
      const tangentShifts = [0, 60, -60, 120, -120, 180, -180];
      const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const angle = Math.atan2(dy, dx) > Math.PI / 2 || Math.atan2(dy, dx) < -Math.PI / 2 ? Math.atan2(dy, dx) + Math.PI : Math.atan2(dy, dx);
      let best = null;
      normalOffsets.forEach((offset, normalIndex) => tangentShifts.forEach((tangentShift, tangentIndex) => {
        const textCenter = { x: middle.x + nx * (offset + textGap) + tx * tangentShift, y: middle.y + ny * (offset + textGap) + ty * tangentShift };
        const box = dimensionLayoutBox(start, end, labelWidth, angle, textCenter, lineStart, lineEnd);
        const overlap = options.avoidBoxes.reduce((total, other) => total + dimensionOverlapArea(box, other), 0);
        const bounds = options.bounds;
        const outside = bounds
          ? Math.max(0, bounds.left - box.left) + Math.max(0, bounds.top - box.top) + Math.max(0, box.right - bounds.right) + Math.max(0, box.bottom - bounds.bottom)
          : 0;
        const movementPenalty = normalIndex * 0.2 + tangentIndex * 0.03;
        const score = overlap * 100 + outside * 25 + movementPenalty;
        if (!best || score < best.score) best = { score, lineOffset: baseOffset, labelOffset: offset, textGap, tangentShift, box };
      }));
      if (best) options.avoidBoxes.push(best.box);
      return best || { lineOffset: baseOffset, labelOffset: baseOffset, textGap, tangentShift: 0 };
    }

    function drawVerticalDimension(ctx, rect, value, side, options) {
      if (!number(value)) return;
      if (options && Array.isArray(options.avoidBoxes)) {
        const x = side === 'left' ? rect.left : rect.right;
        const start = { x, y: rect.top }, end = { x, y: rect.bottom };
        drawAngledDimension(ctx, start, end, value, side === 'left' ? 1 : -1, options);
        return;
      }
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

    function drawHorizontalDimension(ctx, rect, value, below, options) {
      if (!number(value)) return;
      if (options && Array.isArray(options.avoidBoxes)) {
        const y = below ? rect.bottom : rect.top;
        drawAngledDimension(ctx, { x: rect.left, y }, { x: rect.right, y }, value, below ? 1 : -1, options);
        return;
      }
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

    function drawAngledDimension(ctx, start, end, value, normalSign, options) {
      if (!number(value)) return;
      const dx = end.x - start.x, dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (length < 8) return;
      const nx = (-dy / length) * normalSign, ny = (dx / length) * normalSign;
      const label = dimensionLabel(value);
      const placement = chooseDimensionPlacement(ctx, start, end, value, normalSign, options);
      const lineOffset = Number.isFinite(placement.lineOffset) ? placement.lineOffset : (Number(placement.offset) || 36);
      const labelOffset = Number.isFinite(placement.labelOffset) ? placement.labelOffset : lineOffset;
      const textGap = placement.textGap, tangentShift = placement.tangentShift || 0;
      const tx = dx / length, ty = dy / length;
      const a = { x: start.x + nx * lineOffset, y: start.y + ny * lineOffset };
      const b = { x: end.x + nx * lineOffset, y: end.y + ny * lineOffset };
      const tick = 16;
      ctx.save(); ctx.font = '42px Arial';
      ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = 3.5;
      line(ctx, a.x, a.y, b.x, b.y);
      line(ctx, a.x - nx * tick, a.y - ny * tick, a.x + nx * tick, a.y + ny * tick);
      line(ctx, b.x - nx * tick, b.y - ny * tick, b.x + nx * tick, b.y + ny * tick);
      let angle = Math.atan2(dy, dx);
      if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI;
      ctx.translate((start.x + end.x) / 2 + nx * (labelOffset + textGap) + tx * tangentShift, (start.y + end.y) / 2 + ny * (labelOffset + textGap) + ty * tangentShift);
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

    function cartonHeightSide(box, product, fallback) {
      if (box && product) {
        const boxCenter = (box.left + box.right) / 2;
        const productCenter = (product.left + product.right) / 2;
        if (product.right <= box.left + 8 || productCenter < boxCenter) return 'right';
        if (product.left >= box.right - 8 || productCenter > boxCenter) return 'left';
      }
      return fallback === 'left' ? 'left' : 'right';
    }

    function cartonTopologyHeightEdge(topology, side) {
      const front = topology && Array.isArray(topology.frontCorners) ? topology.frontCorners : [];
      const sideCorners = topology && Array.isArray(topology.sideCorners) ? topology.sideCorners : [];
      if (front.length >= 4) {
        const face = String(topology.sideFace || 'none');
        if (side === face && sideCorners.length >= 4) return { start: sideCorners[1], end: sideCorners[2] };
        return side === 'left'
          ? { start: front[0], end: front[3] }
          : { start: front[1], end: front[2] };
      }
      return topology && topology.heightEdge;
    }

    function drawManualDimensionPath(ctx, sourcePoints, session, target, fit, layout) {
      const points = sourcePoints.map((point) => mapPoint(point, fit));
      const center = manualPathCenter(points);
      const types = autoAssignedManualTypes(session, target);
      types.forEach((type, index) => {
        const start = points[index * 2], end = points[index * 2 + 1];
        const value = manualDimensionValue(session, target, type);
        if (start && end) drawAngledDimension(ctx, start, end, value, outwardNormalSign(start, end, center), manualDimensionOptions(session, target, index, layout, fit.scale));
      });
    }

    function drawTopologyDimensions(ctx, topology, session, fit, layout, box, product) {
      if (!topology) return 0;
      const center = topology.frontCorners && topology.frontCorners.length
        ? manualPathCenter(topology.frontCorners.map((point) => mapPoint(point, fit)))
        : null;
      if (!center) return 0;
      const heightSide = cartonHeightSide(box, product, topology.sideFace === 'left' ? 'left' : 'right');
      const heightEdge = cartonTopologyHeightEdge(topology, heightSide);
      const frontAxis = topology.frontAxis || (session.frontIsLength ? 'boxLength' : 'boxDepth');
      const depthAxis = topology.depthAxis || (session.frontIsLength ? 'boxDepth' : 'boxLength');
      const verticalAxis = topology.verticalAxis || 'boxHeight';
      let count = 0;
      const drawEdge = (edge, axis, fallback) => {
        if (!edge || !edge.start || !edge.end) return;
        const start = mapPoint(edge.start, fit), end = mapPoint(edge.end, fit);
        const value = axisValue(session, axis, fallback);
        if (!number(value)) return;
        drawAngledDimension(ctx, start, end, value, outwardNormalSign(start, end, center), layout);
        count += 1;
      };
      drawEdge(heightEdge, verticalAxis, session.fields.packageHeight);
      drawEdge(topology.frontEdge, frontAxis, session.frontIsLength ? session.fields.packageLength : session.fields.packageWidth);
      if (session.showSide && topology.depthEdge) drawEdge(topology.depthEdge, depthAxis, session.frontIsLength ? session.fields.packageWidth : session.fields.packageLength);
      return count;
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
      const topology = analysis.transparentTopology;
      const productHeightSide = analysis.productHeightSide || session.productHeightSide || 'right';
      // A product in a front-only composition has no perspective edge above it.
      // Anchor its horizontal measurement to the bottom edge, matching the
      // carton front edge and leaving the product face unobstructed.  Keep the
      // established upper placement when a visible carton side is present.
      const productWidthBelow = !session.showSide;
      const dimensionLayout = Number(area.width) < 600 ? {
        avoidBoxes: [],
        bounds: { left: Number(area.clipLeft) || area.x - 100, top: area.y - 80, right: area.x + area.width + 100, bottom: area.y + area.height + 80 },
      } : null;
      const manualBox = completeManualPath(session, 'box') ? session.manualPoints.box.slice(0, requiredManualPoints('box')) : null;
      const manualProduct = completeManualPath(session, 'product') ? session.manualPoints.product.slice(0, requiredManualPoints('product')) : null;
      if (session.singleBottle) {
        if (manualProduct) drawManualDimensionPath(ctx, manualProduct, session, 'product', fit, dimensionLayout);
        else if (product) {
          drawVerticalDimension(ctx, product, session.fields.productHeight, productHeightSide, dimensionLayout);
          drawHorizontalDimension(ctx, product, session.fields.productLength, productWidthBelow, dimensionLayout);
        }
        ctx.restore();
        return;
      }
      if (manualBox) {
        drawManualDimensionPath(ctx, manualBox, session, 'box', fit, dimensionLayout);
      } else if (session.topologyApplied && topology && drawTopologyDimensions(ctx, topology, session, fit, dimensionLayout, box, product)) {
        // The learned topology has already selected the exact front, depth and height edges.
      } else if (session.showSide && perspective) {
        const heightSide = cartonHeightSide(box, product, 'left');
        const heightStart = heightSide === 'right' ? perspective.rightTop : perspective.outerTop;
        const heightEnd = heightSide === 'right' ? perspective.rightBottom : perspective.outerBottom;
        drawAngledDimension(ctx, heightStart, heightEnd, session.fields.packageHeight, 1, dimensionLayout);
        drawAngledDimension(ctx, perspective.junctionBottom, perspective.rightBottom, frontValue, 1, dimensionLayout);
        drawAngledDimension(ctx, perspective.outerTop, perspective.junctionTop, sideValue, -1, dimensionLayout);
      } else if (box) {
        drawVerticalDimension(ctx, box, session.fields.packageHeight, cartonHeightSide(box, product, 'left'), dimensionLayout);
        drawHorizontalDimension(ctx, { ...box, left: box.left + (session.showSide ? analysis.sidePixels * fit.scale : 0) }, frontValue, true, dimensionLayout);
        if (session.showSide) drawSideDimension(ctx, box, analysis.sidePixels * fit.scale, sideValue);
      }
      if (manualProduct) drawManualDimensionPath(ctx, manualProduct, session, 'product', fit, dimensionLayout);
      else if (product) {
        drawVerticalDimension(ctx, product, session.fields.productHeight, productHeightSide, dimensionLayout);
        drawHorizontalDimension(ctx, product, session.fields.productLength, productWidthBelow, dimensionLayout);
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

    function wrapCanvasText(ctx, text, maxWidth) {
      const normalized = String(text || '').replace(/\s+/g, ' ').trim();
      if (!normalized) return [''];
      const lines = [];
      let current = '';
      const breakWord = (word) => {
        const pieces = [];
        let piece = '';
        Array.from(word).forEach((character) => {
          const candidate = piece + character;
          if (piece && ctx.measureText(candidate).width > maxWidth) {
            pieces.push(piece);
            piece = character;
          } else piece = candidate;
        });
        if (piece) pieces.push(piece);
        return pieces;
      };
      normalized.split(' ').forEach((word) => {
        if (ctx.measureText(word).width > maxWidth) {
          if (current) { lines.push(current); current = ''; }
          const pieces = breakWord(word);
          if (pieces.length > 1) lines.push(...pieces.slice(0, -1));
          current = pieces[pieces.length - 1] || '';
          return;
        }
        const candidate = current ? current + ' ' + word : word;
        if (current && ctx.measureText(candidate).width > maxWidth) {
          lines.push(current);
          current = word;
        } else current = candidate;
      });
      if (current) lines.push(current);
      return lines.length ? lines : [''];
    }

    function drawFittedMultilineText(ctx, text, options) {
      const config = options || {};
      ctx.save();
      const maxWidth = Math.max(1, Number(config.maxWidth) || 1);
      const maxHeight = Math.max(1, Number(config.maxHeight) || 1);
      const startSize = Math.max(1, Number(config.startSize) || 24);
      const minSize = Math.max(1, Math.min(startSize, Number(config.minSize) || 16));
      const maxLines = Math.max(1, Number(config.maxLines) || 2);
      const lineHeightRatio = Number(config.lineHeight) || 1.06;
      const weight = config.weight || '400';
      let chosen = null;
      for (let size = startSize; size >= minSize; size -= 1) {
        ctx.font = weight + ' ' + size + 'px Arial';
        const lines = wrapCanvasText(ctx, text, maxWidth);
        const lineHeight = size * lineHeightRatio;
        if (lines.length <= maxLines && lines.length * lineHeight <= maxHeight) {
          chosen = { font: ctx.font, lines, lineHeight };
          break;
        }
      }
      if (!chosen) {
        ctx.font = weight + ' ' + minSize + 'px Arial';
        const lines = wrapCanvasText(ctx, text, maxWidth);
        chosen = {
          font: ctx.font,
          lines,
          lineHeight: Math.min(minSize * lineHeightRatio, maxHeight / Math.max(1, lines.length)),
        };
      }
      ctx.font = chosen.font;
      ctx.textAlign = config.align || 'center';
      ctx.textBaseline = 'middle';
      const centerY = Number(config.y) || 0;
      const startY = centerY - (chosen.lines.length - 1) * chosen.lineHeight / 2;
      chosen.lines.forEach((lineText, index) => ctx.fillText(lineText, Number(config.x) || 0, startY + index * chosen.lineHeight));
      ctx.restore();
      return chosen;
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
      drawFittedMultilineText(ctx, title, { x: 443, y: 465, maxWidth: 680, maxHeight: 120, startSize: 52, minSize: 30, maxLines: 2, lineHeight: 1.06, weight: '400' });
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
        const rowValue = String(row[1] || '');
        if (row[0] === 'NAME') drawFittedMultilineText(ctx, rowValue, { x: 326, y: y + 34, maxWidth: 455, maxHeight: 60, startSize: 34, minSize: 22, maxLines: 2, lineHeight: 1.04, weight: '400', align: 'left' });
        else { fitText(ctx, rowValue, 455, 34, 20, '400'); ctx.fillText(rowValue, 326, y + 34); }
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

    async function regenerate(data, options) {
      const session = ensureSession(data);
      let generated = false;
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
        const [rule, logo] = await Promise.all([loadTopologyRule(), loadBrandLogo(data.brand)]);
        try {
          const analysisResult = await runParameterImageAnalysis(image, session, rule);
          if (analysisResult.sessionPatch) Object.assign(session, analysisResult.sessionPatch);
          session.analysis = analysisResult.analysis;
          if (hasManualPath) editorLog(session, '自动图像分析成功，手动路径将优先覆盖', {
            hasBox: Boolean(session.analysis && session.analysis.box),
            hasProduct: Boolean(session.analysis && session.analysis.product),
            topologyApplied: Boolean(session.analysis && session.analysis.transparentTopology),
            topologyRuleVersion: session.topologyRuleVersion || '',
            worker: Boolean(analysisResult.worker),
          });
        } catch (analysisError) {
          session.analysis = manualFallbackAnalysis(image, session);
          if (session.analysis && hasManualPath) editorLog(session, '自动分析失败，已使用手动路径回退', { message: String(analysisError && analysisError.message || analysisError) }, 'warn');
          if (!session.analysis) throw analysisError;
        }
        session.productResult = generateProductImage(image, session.analysis, session);
        session.englishResult = generateEnglishImage(image, session.analysis, session, data, logo);
        generated = true;
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
        if (generated && options && options.focusSave) context.focusSaveButton();
      }
    }

    const parameterImageFormatHint = '参数图仅支持透明 PNG；JPG / WebP 等图片请先导出为透明 PNG，再粘贴或拖入。';

    function isParameterPngFile(file) {
      return Boolean(file && (/\.png$/i.test(file.name || '') || /^image\/png$/i.test(file.type || '')));
    }

    function rejectParameterImage(data) {
      const session = ensureSession(data);
      session.error = parameterImageFormatHint;
      context.render();
      if (context.showToast) context.showToast(parameterImageFormatHint);
    }

    async function processFile(file, data, options) {
      const session = ensureSession(data);
      if (!isParameterPngFile(file)) { rejectParameterImage(data); return; }
      session.file = file; session.fileName = file.name; session.showSide = null; session.showSideOverride = false; session.frontAxisOverride = false;
      session.topologyApplied = false; session.topologyRuleVersion = ''; session.topologyMessage = '';
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
      session.manualLineLayouts = { box: [], product: [] };
      session.manualPointHistory = [];
      session.manualAutoInitialized = false;
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
      await regenerate(data, options);
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
      if (typeof context.saveImageFiles === 'function') {
        try {
          const result = await context.saveImageFiles(outputs.map((item) => ({ name: item.name, dataUrl: item.url })));
          if (result && result.cancelled) return;
          if (result && result.mode === 'unsupported') {
            context.showToast('当前浏览器不支持文件夹批量保存，请使用最新版 Chrome 或 Edge。');
            return;
          }
          context.showToast('已保存两张参数图 JPG');
        } catch (error) {
          if (!error || error.name !== 'AbortError') context.showToast('保存失败');
        }
        return;
      }
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
      if (action === 'parameter-editor-target-mode') {
        const requested = String(target && target.getAttribute('data-target-mode') || 'auto');
        if (!['auto', 'box', 'product'].includes(requested)) return true;
        session.manualTargetMode = requested;
        session.editorStatus = requested === 'auto'
          ? '已恢复自动判断纸盒/产品'
          : '下一条尺寸边将手动归入“' + (requested === 'box' ? '纸盒' : '产品') + '”';
        editorLog(session, '切换标注对象模式', { mode: requested });
        renderManualEditor(data);
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
        session.manualLineLayouts = { box: [], product: [] };
        session.manualPointHistory = [];
        session.manualAutoInitialized = true;
        session.editorStatus = '标注已全部清空，可重新直接画线';
        editorLog(session, '清空自动尺寸线', { removedCount });
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
      if (event.target.classList.contains('pfh-parameter-side')) { session.showSide = Boolean(event.target.checked); session.showSideOverride = true; if (session.file) regenerate(data); return true; }
      if (event.target.name === 'pfh-parameter-front') { session.frontIsLength = event.target.value === 'length'; session.frontAxisOverride = true; session.showSide = null; if (session.file) regenerate(data); return true; }
      if (event.target.classList.contains('pfh-parameter-field')) { if (session.file) regenerate(data); return true; }
      return false;
    }

    function handleDrop(files, data, options) {
      const candidates = Array.from(files || []).filter(Boolean);
      const file = candidates.find(isParameterPngFile);
      if (!file) {
        if (candidates.length) rejectParameterImage(data);
        return;
      }
      if (candidates.some((item) => /^image\//i.test(item.type || '') && !isParameterPngFile(item)) && context.showToast) {
        context.showToast('已读取 PNG；其他格式图片已忽略，请使用透明 PNG。');
      }
      processFile(file, data, options);
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
