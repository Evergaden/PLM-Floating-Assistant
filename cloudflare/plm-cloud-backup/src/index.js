const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-api-key',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

function normalizeBoxKey(value) {
  const normalizedParts = String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\u00d7*]/g, 'x')
    .replace(/\u5398\u7c73|\u516c\u5206/g, 'cm')
    .split('x')
    .map((part) => {
      const cmPart = part.split('/')[0].replace(/cm/g, '');
      const match = cmPart.match(/\d+(?:\.\d+)?/);
      if (!match) return '';
      const number = Number(match[0]);
      return Number.isFinite(number) && number > 0 ? String(Number(number.toFixed(3))) : '';
    })
    .filter(Boolean);
  return normalizedParts.length === 3 ? normalizedParts.join('x') : '';
}

function parseBoxDims(boxKey) {
  const dims = normalizeBoxKey(boxKey)
    .split('x')
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value) && value > 0);
  return dims.length === 3 ? dims : null;
}

function calculateMaxPackCount(itemDims, cartonDims = [56, 36, 21]) {
  if (!Array.isArray(itemDims) || itemDims.length !== 3) return 0;
  const permutations = [
    [itemDims[0], itemDims[1], itemDims[2]],
    [itemDims[0], itemDims[2], itemDims[1]],
    [itemDims[1], itemDims[0], itemDims[2]],
    [itemDims[1], itemDims[2], itemDims[0]],
    [itemDims[2], itemDims[0], itemDims[1]],
    [itemDims[2], itemDims[1], itemDims[0]],
  ];
  return permutations.reduce((best, dims) => {
    const count = Math.floor(cartonDims[0] / dims[0])
      * Math.floor(cartonDims[1] / dims[1])
      * Math.floor(cartonDims[2] / dims[2]);
    return Math.max(best, count);
  }, 0);
}

async function getPackRecommendation(env, boxKey) {
  const row = await env.DB.prepare(`
    SELECT pack_count, COUNT(*) AS votes, MAX(created_at) AS latest_at
    FROM pack_records
    WHERE box_key = ?
    GROUP BY pack_count
    ORDER BY votes DESC, latest_at DESC
    LIMIT 1
  `).bind(boxKey).first();

  const candidates = await env.DB.prepare(`
    SELECT pack_count, COUNT(*) AS votes, MAX(created_at) AS latest_at
    FROM pack_records
    WHERE box_key = ?
    GROUP BY pack_count
    ORDER BY votes DESC, latest_at DESC
    LIMIT 5
  `).bind(boxKey).all();

  return {
    row,
    candidates: candidates.results || [],
  };
}

async function recordPackCount(env, boxKey, packCount, source, sku) {
  await env.DB.prepare(`
    INSERT INTO pack_records (box_key, pack_count, source, sku)
    VALUES (?, ?, ?, ?)
  `).bind(boxKey, packCount, source, sku || '').run();
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(String(value || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function requireApiKey(request, env) {
  if (!env.API_KEY) return true;
  return request.headers.get('x-api-key') === env.API_KEY;
}

async function parseJson(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  return request.json().catch(() => null);
}

async function handleBackupSave(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const body = await parseJson(request);
  const backupKey = String((body && body.backupKey) || '');
  const payload = body && body.payload;
  const version = String((body && body.version) || '').slice(0, 40);

  if (backupKey.length < 4) return json({ error: 'backupKey too short' }, 400);
  if (!payload || typeof payload !== 'object') return json({ error: 'payload required' }, 400);

  const serialized = JSON.stringify(payload);
  if (serialized.length > 900000) return json({ error: 'payload too large' }, 413);

  const userId = await sha256Hex(backupKey);
  await env.DB.prepare(`
    INSERT INTO user_backups (user_id, payload, version, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      payload = excluded.payload,
      version = excluded.version,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, serialized, version).run();

  return json({ ok: true, userId, bytes: serialized.length });
}

async function handleBackupLoad(request, env) {
  const url = new URL(request.url);
  const backupKey = String(url.searchParams.get('backupKey') || '');
  if (backupKey.length < 4) return json({ error: 'backupKey too short' }, 400);

  const userId = await sha256Hex(backupKey);
  const row = await env.DB.prepare(`
    SELECT payload, version, updated_at
    FROM user_backups
    WHERE user_id = ?
  `).bind(userId).first();

  if (!row) return json({ found: false, userId });
  return json({
    found: true,
    userId,
    version: row.version,
    updatedAt: row.updated_at,
    payload: JSON.parse(row.payload),
  });
}

async function handlePackRecord(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const body = await parseJson(request);
  const boxKey = normalizeBoxKey(body && body.boxKey);
  const packCount = Number(body && body.packCount);
  const sku = String((body && body.sku) || '').slice(0, 80);
  const source = String((body && body.source) || 'plm-helper').slice(0, 80);

  if (!boxKey) return json({ error: 'boxKey required' }, 400);
  if (!Number.isInteger(packCount) || packCount <= 0 || packCount > 999999) {
    return json({ error: 'invalid packCount' }, 400);
  }

  await recordPackCount(env, boxKey, packCount, source, sku);

  return json({ ok: true, boxKey, packCount });
}

async function handlePackRecommend(request, env) {
  const url = new URL(request.url);
  const boxKey = normalizeBoxKey(url.searchParams.get('boxKey'));
  if (!boxKey) return json({ error: 'boxKey required' }, 400);

  const { row, candidates } = await getPackRecommendation(env, boxKey);

  return json({
    boxKey,
    found: Boolean(row),
    packCount: row ? row.pack_count : null,
    votes: row ? row.votes : 0,
    candidates,
  });
}

function parseAiPackCount(text) {
  const raw = String(text || '').trim();
  if (!raw) return 0;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      const value = Number(data.packCount || data.count || data.maxCount);
      if (Number.isInteger(value) && value > 0) return value;
    } catch (error) {
      // Fall back to number extraction below.
    }
  }
  const match = raw.match(/\d+/);
  const value = match ? Number(match[0]) : 0;
  return Number.isInteger(value) && value > 0 ? value : 0;
}

async function callZhipuPackEstimator(env, boxKey) {
  const apiKey = env.ZHIPU_API_KEY;
  if (!apiKey) throw new Error('ZHIPU_API_KEY not configured');
  const itemDims = parseBoxDims(boxKey);
  if (!itemDims) throw new Error('invalid boxKey');
  const localCount = calculateMaxPackCount(itemDims);
  if (!localCount) throw new Error('invalid calculated pack count');
  const model = env.ZHIPU_MODEL || 'glm-4-flash';
  const prompt = [
    '外箱内径 56x36x21cm，货物 ' + itemDims.join('x') + 'cm。',
    '请遍历长宽高全部 6 种摆放方向，计算每个方向 floor(56/a)*floor(36/b)*floor(21/c)，直接给出一箱最多可装数量。',
    '只输出 JSON：{"packCount":数字,"orientation":"a x b x c","reason":"简短说明"}，不要输出 Markdown。'
  ].join('\n');

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(12000),
    headers: {
      authorization: 'Bearer ' + apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: '你是严谨的装箱数计算器，只做整数装箱数量计算。' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data && data.error && data.error.message ? data.error.message : 'zhipu HTTP ' + response.status);
  }
  const text = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  const aiCount = parseAiPackCount(text);
  return {
    packCount: aiCount || localCount,
    aiCount,
    localCount,
    model,
    raw: text,
  };
}

async function handlePackAiEstimate(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const body = await parseJson(request);
  const boxKey = normalizeBoxKey(body && body.boxKey);
  const sku = String((body && body.sku) || '').slice(0, 80);
  if (!boxKey) return json({ error: 'boxKey required' }, 400);

  const { row } = await getPackRecommendation(env, boxKey);
  if (row) {
    return json({ ok: true, boxKey, found: true, packCount: row.pack_count, source: 'history' });
  }

  const itemDims = parseBoxDims(boxKey);
  const packCount = calculateMaxPackCount(itemDims);
  if (!Number.isInteger(packCount) || packCount <= 0 || packCount > 999999) {
    return json({ ok: false, boxKey, error: 'invalid calculated packCount' }, 422);
  }
  await recordPackCount(env, boxKey, packCount, 'local-calc', sku);
  return json({
    ok: true,
    boxKey,
    found: false,
    packCount,
    source: 'local-calc',
    localCount: packCount,
  });
}

function cleanText(value, maxLength = 200) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanList(value, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, 80)).filter(Boolean).slice(0, maxItems);
}

async function handleInsightRecord(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const body = await parseJson(request);
  const eventType = cleanText(body && body.eventType, 40);
  if (!eventType || !/^(price|issue|type|summary|log|recommendation)$/.test(eventType)) return json({ error: 'invalid eventType' }, 400);

  const missingFields = cleanList(body && body.missingFields);
  const payload = JSON.stringify(body || {});
  if (payload.length > 12000) return json({ error: 'payload too large' }, 413);

  await env.DB.prepare(`
    INSERT INTO insight_events (
      event_type, sku, brand, name, product_type, price, pack_qty,
      package_size, product_size, missing_fields, source, payload
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    eventType,
    cleanText(body && body.sku, 80),
    cleanText(body && body.brand, 120),
    cleanText(body && body.name, 200),
    cleanText(body && body.productType, 120),
    cleanText(body && body.price, 40),
    cleanText(body && body.packQty, 40),
    cleanText(body && body.packageSize, 120),
    cleanText(body && body.productSize, 120),
    missingFields.join(','),
    cleanText(body && body.source, 80),
    payload
  ).run();

  return json({ ok: true, eventType });
}

async function handleInsightSummary(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const summary = await buildInsightSummary(env);
  return json({ ok: true, ...summary });
}

async function buildInsightSummary(env) {
  const totals = await env.DB.prepare(`
    SELECT event_type, COUNT(*) AS count
    FROM insight_events
    GROUP BY event_type
  `).all();
  const productTypes = await env.DB.prepare(`
    SELECT product_type, COUNT(*) AS count, MAX(created_at) AS latest_at
    FROM insight_events
    WHERE product_type IS NOT NULL AND product_type != ''
    GROUP BY product_type
    ORDER BY count DESC, latest_at DESC
    LIMIT 30
  `).all();
  const recentIssues = await env.DB.prepare(`
    SELECT sku, brand, name, missing_fields, source, created_at
    FROM insight_events
    WHERE event_type = 'issue'
    ORDER BY id DESC
    LIMIT 30
  `).all();
  const recentPrices = await env.DB.prepare(`
    SELECT sku, brand, name, product_type, price, pack_qty, package_size, product_size, created_at
    FROM insight_events
    WHERE event_type = 'price'
    ORDER BY id DESC
    LIMIT 30
  `).all();
  const recentRecommendationRows = await env.DB.prepare(`
    SELECT sku, brand, name, product_type, price, pack_qty, source, payload, created_at
    FROM insight_events
    WHERE event_type = 'recommendation'
    ORDER BY id DESC
    LIMIT 30
  `).all();
  const recentLogRows = await env.DB.prepare(`
    SELECT sku, brand, name, source, payload, created_at
    FROM insight_events
    WHERE event_type = 'log'
    ORDER BY id DESC
    LIMIT 50
  `).all();
  const ruleRows = await env.DB.prepare(`
    SELECT sku, brand, name, missing_fields, source, payload, created_at
    FROM insight_events
    WHERE event_type = 'issue'
    ORDER BY id DESC
    LIMIT 500
  `).all();
  const ruleCandidates = buildRuleCandidates(ruleRows.results || []);
  const rulePackage = buildRuleMaintenancePackage(ruleCandidates);
  await upsertCleaningRules(env, rulePackage).catch(() => {});
  const maintainedRules = await getMaintainedCleaningRules(env, 100).catch(() => []);
  const maintainedById = new Map(maintainedRules.map((rule) => [rule.ruleId, rule]));
  rulePackage.rules = rulePackage.rules.map((rule) => {
    const maintained = maintainedById.get(rule.ruleId);
    return maintained ? { ...rule, maintenanceStatus: maintained.maintenanceStatus, statusOverride: maintained.statusOverride, note: maintained.note } : rule;
  });
  rulePackage.maintainedCount = maintainedRules.length;
  rulePackage.maintainedRules = maintainedRules;

  const recentLogs = normalizeRecentLogs(recentLogRows.results || []);
  const recentRecommendations = normalizeRecentRecommendations(recentRecommendationRows.results || []);
  const summary = {
    totals: totals.results || [],
    productTypes: productTypes.results || [],
    recentIssues: recentIssues.results || [],
    recentPrices: recentPrices.results || [],
    recentRecommendations,
    recentLogs,
    logDiagnostics: buildLogDiagnostics(recentLogs),
    ruleCandidates,
    rulePackage,
  };
  return summary;
}

function parsePayloadJson(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

function normalizeRecentLogs(rows) {
  return (rows || []).map((row) => {
    const payload = parsePayloadJson(row.payload);
    return {
      sku: cleanText(row.sku || payload.sku, 80),
      brand: cleanText(row.brand || payload.brand, 120),
      name: cleanText(row.name || payload.name, 200),
      level: cleanText(payload.level, 20),
      message: cleanText(payload.message, 500),
      detail: cleanText(payload.detail, 500),
      url: cleanText(payload.url, 300),
      version: cleanText(payload.version, 40),
      source: cleanText(row.source || payload.source || 'plm-helper-log', 80),
      created_at: row.created_at || '',
    };
  }).filter((item) => item.level || item.message || item.detail);
}

function normalizeRecentRecommendations(rows) {
  return (rows || []).map((row) => {
    const payload = parsePayloadJson(row.payload);
    return {
      sku: cleanText(row.sku || payload.sku, 80),
      brand: cleanText(row.brand || payload.brand, 120),
      name: cleanText(row.name || payload.name, 200),
      product_type: cleanText(row.product_type || payload.productType || payload.effectiveProductType, 120),
      recommended_price: cleanText(row.price || payload.recommendedPrice, 40),
      recommended_pack_qty: cleanText(row.pack_qty || payload.recommendedPackQty, 40),
      source: cleanText(row.source || payload.source || payload.recommendationSource || 'recommendation', 80),
      reason: cleanText(payload.reason || payload.recommendationReason, 500),
      product_type_source: cleanText(payload.productTypeSource, 80),
      product_type_score: cleanText(payload.productTypeScore, 40),
      sample_count: cleanText(payload.typeSampleCount, 40),
      confidence: cleanText(payload.priceConfidence || payload.recommendationConfidence, 40),
      price_stats: cleanText(formatPriceStats(payload.priceStats), 160),
      created_at: row.created_at || '',
    };
  }).filter((item) => item.sku || item.recommended_price || item.reason);
}

function buildLogDiagnostics(logs) {
  const items = Array.isArray(logs) ? logs : [];
  const levels = {};
  const messages = new Map();
  items.forEach((item) => {
    const level = cleanText(item.level || 'info', 20) || 'info';
    const message = cleanText(item.message, 160) || cleanText(item.detail, 160) || 'unknown';
    levels[level] = (levels[level] || 0) + 1;
    const key = [level, message].join('|');
    const current = messages.get(key) || {
      level,
      message,
      count: 0,
      latest_at: '',
      examples: [],
      sources: new Set(),
    };
    current.count += 1;
    current.latest_at = item.created_at || current.latest_at;
    if (item.source) current.sources.add(item.source);
    if (current.examples.length < 3) {
      current.examples.push({
        sku: item.sku || '',
        detail: item.detail || '',
        at: item.created_at || '',
      });
    }
    messages.set(key, current);
  });
  const topMessages = Array.from(messages.values())
    .sort((a, b) => b.count - a.count || String(b.latest_at).localeCompare(String(a.latest_at)))
    .slice(0, 12)
    .map((item) => ({
      level: item.level,
      message: item.message,
      count: item.count,
      latest_at: item.latest_at,
      sources: Array.from(item.sources),
      examples: item.examples,
    }));
  return {
    total: items.length,
    levels,
    topMessages,
  };
}

function tableLines(rows, columns) {
  if (!rows || !rows.length) return ['暂无'];
  return rows.map((row) => columns.map((column) => cleanText(row[column], 120) || '-').join('\t'));
}

function tsvEscape(value) {
  return String(value || '').replace(/[\t\r\n]+/g, ' ').trim();
}

function tsvSection(title, headers, rows, columns) {
  const lines = [title, headers.join('\t')];
  if (!rows || !rows.length) {
    lines.push('暂无');
  } else {
    rows.forEach((row) => {
      lines.push(columns.map((column) => tsvEscape(row[column])).join('\t'));
    });
  }
  return lines.join('\n');
}

function recordsToUnifiedTsv(records) {
  const headers = ['记录类型', 'SKU', '品牌', '商品名', '商品类型', '价格', '装箱数', '包装尺寸', '产品尺寸', '缺失字段', '来源', '记录时间'];
  const lines = ['飞书统一表', headers.join('\t')];
  if (!records || !records.length) {
    lines.push('暂无');
    return lines.join('\n');
  }
  records.forEach((record) => {
    const fields = record && record.fields || {};
    lines.push(headers.map((header) => tsvEscape(fields[header])).join('\t'));
  });
  return lines.join('\n');
}

function formatRuleTargetTabs(rule) {
  return (rule && rule.targetTabs || []).filter(Boolean).join('/');
}

function formatRuleActions(rule) {
  const actions = (rule && rule.actions || []).filter(Boolean);
  return actions.length ? actions.slice(0, 3).join('；') : (rule && rule.suggestion || '');
}

function formatRuleRetryStatus(rule) {
  const statuses = (rule && rule.retryStatuses || []).filter(Boolean);
  const tabs = (rule && rule.retryTabs || []).filter(Boolean);
  const parts = [];
  if (statuses.length) parts.push(statuses.join('/'));
  if (tabs.length) parts.push('页签 ' + tabs.join('/'));
  if (rule && (rule.retryStillMissingCount || rule.retryFixedCount)) {
    parts.push('仍缺 ' + (rule.retryStillMissingCount || 0) + ' / 补到 ' + (rule.retryFixedCount || 0));
  }
  return parts.join('；');
}

function formatRuleExampleSkus(rule) {
  return (rule && rule.examples || []).map((example) => example.sku).filter(Boolean).join(',');
}

function formatRuleRows(summary, limit) {
  return ((summary && summary.rulePackage && summary.rulePackage.rules) || [])
    .filter((item) => item.maintenanceStatus !== '\u5df2\u5904\u7406' && item.maintenanceStatus !== '\u5ffd\u7565')
    .slice(0, limit || 30)
    .map((item) => ({
      priority: item.priority || '',
      missingField: item.missingField || '',
      count: item.count || 0,
      actionLabel: item.actionLabel || '',
      maintenanceStatus: item.maintenanceStatus || '',
      likelyPlmEmpty: item.likelyPlmEmpty ? '\u662f' : '\u5426',
      targetTabs: formatRuleTargetTabs(item),
      parsedButMissingCount: item.parsedButMissingCount || 0,
      unreadCount: item.unreadCount || 0,
      retryStatus: formatRuleRetryStatus(item),
      actions: formatRuleActions(item),
      examples: formatRuleExampleSkus(item),
      latestAt: item.latestAt || '',
    }));
}

async function handleInsightReport(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const summary = await buildInsightSummary(env);
  const totalText = (summary.totals || []).map((item) => cleanText(item.event_type, 40) + ':' + item.count).join(' / ') || '暂无';
  const lines = [
    'PLM 数据洞察报告',
    '生成时间：' + new Date().toISOString(),
    '',
    '一、事件总览',
    totalText,
    '',
    '二、商品类型规律',
    '商品类型\t记录数\t最近时间',
    ...tableLines(summary.productTypes, ['product_type', 'count', 'latest_at']),
    '',
    '三、最近价格记录',
    'SKU\t品牌\t商品名\t类型\t价格\t装箱数\t包装尺寸\t产品尺寸\t时间',
    ...tableLines(summary.recentPrices, ['sku', 'brand', 'name', 'product_type', 'price', 'pack_qty', 'package_size', 'product_size', 'created_at']),
    '',
    '三-补全推荐记录',
    'SKU\t品牌\t商品名\t类型\t推荐价格\t推荐装箱数\t来源\t置信度\t价格统计\t原因\t类型来源\t样本数\t时间',
    ...tableLines(summary.recentRecommendations, ['sku', 'brand', 'name', 'product_type', 'recommended_price', 'recommended_pack_qty', 'source', 'confidence', 'price_stats', 'reason', 'product_type_source', 'sample_count', 'created_at']),
    '',
    '四、最近字段异常',
    'SKU\t品牌\t商品名\t缺失字段\t来源\t时间',
    ...tableLines(summary.recentIssues, ['sku', 'brand', 'name', 'missing_fields', 'source', 'created_at']),
    '',
    'Runtime logs',
    'Level\tSKU\tMessage\tDetail\tSource\tTime',
    ...tableLines(summary.recentLogs, ['level', 'sku', 'message', 'detail', 'source', 'created_at']),
    '',
    'Runtime log diagnostics',
    'Level\tMessage\tCount\tLatest\tSources',
    ...tableLines((summary.logDiagnostics && summary.logDiagnostics.topMessages || []), ['level', 'message', 'count', 'latest_at', 'sources']),
    '',
    '清洗规则候选',
    '优先级\t字段\t次数\t动作\t状态\t可能PLM空值\t目标页签\t已读未解析\t未读完\t二次读取\t建议动作\t样例SKU\t最近时间',
    ...tableLines(formatRuleRows(summary, 20), ['priority', 'missingField', 'count', 'actionLabel', 'maintenanceStatus', 'likelyPlmEmpty', 'targetTabs', 'parsedButMissingCount', 'unreadCount', 'retryStatus', 'actions', 'examples', 'latestAt']),
    '',
    '五、AI 处理建议',
    '1. 按商品类型统计价格区间和常见装箱数，给新 SKU 做默认推荐。',
    '2. 对高频缺失字段维护清洗规则；如果 PLM 页面不是空值但脚本未获取到，优先记录为规则待修复。',
    '3. 飞书表格建议列：SKU、品牌、商品名、商品类型、价格、装箱数、包装尺寸、产品尺寸、缺失字段、记录时间。',
  ];
  return json({
    ok: true,
    report: lines.join('\n'),
    summary,
  });
}

async function handleInsightFeishuTsv(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const summary = await buildInsightSummary(env);
  const aiPayload = await buildInsightAiReportPayload(env, summary);
  const unifiedRecords = buildFeishuRecords(summary, aiPayload);
  const sections = [
    recordsToUnifiedTsv(unifiedRecords),
    tsvSection(
      '价格历史',
      ['SKU', '品牌', '商品名', '商品类型', '价格', '装箱数', '包装尺寸', '产品尺寸', '记录时间'],
      summary.recentPrices,
      ['sku', 'brand', 'name', 'product_type', 'price', 'pack_qty', 'package_size', 'product_size', 'created_at']
    ),
    tsvSection(
      '商品类型统计',
      ['商品类型', '记录数', '最近时间'],
      summary.productTypes,
      ['product_type', 'count', 'latest_at']
    ),
    tsvSection(
      '补全推荐记录',
      ['SKU', '品牌', '商品名', '商品类型', '推荐价格', '推荐装箱数', '来源', '置信度', '价格统计', '原因', '类型来源', '样本数', '记录时间'],
      summary.recentRecommendations,
      ['sku', 'brand', 'name', 'product_type', 'recommended_price', 'recommended_pack_qty', 'source', 'confidence', 'price_stats', 'reason', 'product_type_source', 'sample_count', 'created_at']
    ),
    tsvSection(
      '字段异常',
      ['SKU', '品牌', '商品名', '缺失字段', '来源', '记录时间'],
      summary.recentIssues,
      ['sku', 'brand', 'name', 'missing_fields', 'source', 'created_at']
    ),
    tsvSection(
      'Runtime logs',
      ['Level', 'SKU', 'Message', 'Detail', 'Source', 'Time'],
      summary.recentLogs,
      ['level', 'sku', 'message', 'detail', 'source', 'created_at']
    ),
    tsvSection(
      'Runtime log diagnostics',
      ['Level', 'Message', 'Count', 'Latest', 'Sources'],
      summary.logDiagnostics && summary.logDiagnostics.topMessages,
      ['level', 'message', 'count', 'latest_at', 'sources']
    ),
    tsvSection(
      '清洗规则候选',
      ['优先级', '字段', '次数', '动作', '状态', '可能PLM空值', '目标页签', '已读未解析', '未读完', '二次读取', '建议动作', '样例SKU', '最近时间'],
      formatRuleRows(summary, 30),
      ['priority', 'missingField', 'count', 'actionLabel', 'maintenanceStatus', 'likelyPlmEmpty', 'targetTabs', 'parsedButMissingCount', 'unreadCount', 'retryStatus', 'actions', 'examples', 'latestAt']
    ),
  ];
  return json({
    ok: true,
    format: 'tsv',
    copiedAt: new Date().toISOString(),
    unifiedCount: unifiedRecords.length,
    tsv: sections.join('\n\n'),
    summary,
  });
}

async function callZhipuInsightReporter(env, summary) {
  const apiKey = env.ZHIPU_API_KEY;
  if (!apiKey) throw new Error('ZHIPU_API_KEY not configured');
  const model = env.ZHIPU_MODEL || 'glm-4-flash';
  const compactSummary = buildCompactAiInsightSummary(summary);
  const prompt = [
    '你是 PLM 商品数据清洗和采购数据分析助手。',
    '请根据下面精简 JSON 输出中文报告，最多 900 字。',
    '必须包含：1）商品类型/价格规律；2）智能补全建议；3）清洗规则优先级；4）飞书表格记录建议。',
    '根据 ruleRows/logDiagnostics 判断原因类别：PLM空值、脚本解析缺口、页面未读完、网络/流程问题。不要编造 JSON 外的数据。',
    JSON.stringify(compactSummary),
  ].join('\n');

  let response;
  try {
    response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(Number(env.ZHIPU_INSIGHT_TIMEOUT_MS || 22000)),
      headers: {
        authorization: 'Bearer ' + apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: '你只做 PLM 商品数据洞察、价格规律总结和数据清洗规则建议。输出简洁中文。' },
          { role: 'user', content: prompt },
        ],
      }),
    });
  } catch (error) {
    if (error && (error.name === 'AbortError' || /aborted|timeout/i.test(String(error.message || '')))) {
      throw new Error('AI 洞察请求超时，已使用规则版总结');
    }
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data && data.error && data.error.message ? data.error.message : 'zhipu HTTP ' + response.status);
  }
  return data && data.choices && data.choices[0] && data.choices[0].message
    ? String(data.choices[0].message.content || '').trim()
    : '';
}

function buildCompactAiInsightSummary(summary) {
  const rules = ((summary && summary.rulePackage && summary.rulePackage.rules) || [])
    .filter((item) => item.maintenanceStatus !== '\u5df2\u5904\u7406' && item.maintenanceStatus !== '\u5ffd\u7565')
    .slice(0, 12)
    .map((item) => ({
      priority: item.priority || '',
      field: item.missingField || '',
      count: item.count || 0,
      action: item.actionLabel || '',
      status: item.maintenanceStatus || '',
      likelyPlmEmpty: Boolean(item.likelyPlmEmpty),
      targetTabs: item.targetTabs || [],
      parsedButMissing: item.parsedButMissingCount || 0,
      unread: item.unreadCount || 0,
      retry: formatRuleRetryStatus(item),
      examples: formatRuleExampleSkus(item),
      suggestion: cleanText(item.suggestion, 180),
    }));
  return {
    totals: summary.totals || [],
    productTypes: (summary.productTypes || []).slice(0, 10),
    prices: (summary.recentPrices || []).slice(0, 10).map((item) => ({
      sku: item.sku || '',
      type: item.product_type || '',
      price: item.price || '',
      packQty: item.pack_qty || '',
      packageSize: item.package_size || '',
      productSize: item.product_size || '',
    })),
    recommendations: (summary.recentRecommendations || []).slice(0, 8).map((item) => ({
      sku: item.sku || '',
      type: item.product_type || '',
      price: item.recommended_price || '',
      source: item.source || '',
      confidence: item.confidence || '',
      priceStats: item.price_stats || '',
      reason: cleanText(item.reason, 160),
    })),
    issues: (summary.recentIssues || []).slice(0, 10),
    logs: (summary.logDiagnostics && summary.logDiagnostics.topMessages || []).slice(0, 8),
    rules,
    ruleStats: summary.rulePackage ? {
      total: summary.rulePackage.total,
      actionable: summary.rulePackage.actionableCount,
      likelyPlmEmpty: summary.rulePackage.likelyPlmEmptyCount,
    } : null,
  };
}

function buildAiReportCacheKey(summary) {
  const totals = (summary.totals || []).map((item) => item.event_type + ':' + item.count).join('|');
  const latestPrice = summary.recentPrices && summary.recentPrices[0] ? summary.recentPrices[0].created_at || '' : '';
  const latestRecommendation = summary.recentRecommendations && summary.recentRecommendations[0] ? summary.recentRecommendations[0].created_at || '' : '';
  const latestIssue = summary.recentIssues && summary.recentIssues[0] ? summary.recentIssues[0].created_at || '' : '';
  const latestLog = summary.recentLogs && summary.recentLogs[0] ? summary.recentLogs[0].created_at || '' : '';
  return ['insight', totals, latestPrice, latestRecommendation, latestIssue, latestLog].join('|').slice(0, 500);
}

async function getCachedAiReport(env, cacheKey) {
  const row = await env.DB.prepare(`
    SELECT source, report, error, created_at
    FROM ai_report_cache
    WHERE cache_key = ?
  `).bind(cacheKey).first();
  if (!row) return null;
  const ageMs = Date.now() - Number(row.created_at || 0);
  const ttlMs = row.source === 'zhipu' ? 10 * 60 * 1000 : 2 * 60 * 1000;
  if (ageMs > ttlMs) return null;
  return {
    source: row.source || 'cache',
    report: row.report || '',
    error: row.error || '',
    cached: true,
  };
}

async function setCachedAiReport(env, cacheKey, payload) {
  if (!payload || !payload.report) return;
  await env.DB.prepare(`
    INSERT INTO ai_report_cache (cache_key, source, report, error, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      source = excluded.source,
      report = excluded.report,
      error = excluded.error,
      created_at = excluded.created_at
  `).bind(cacheKey, payload.source || '', payload.report || '', payload.error || '', Date.now()).run();
}

async function handleInsightAiReport(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const summary = await buildInsightSummary(env);
  const payload = await buildInsightAiReportPayload(env, summary);
  return json({ ok: true, ...payload, summary });
}

async function buildInsightAiReportPayload(env, summary) {
  const cacheKey = buildAiReportCacheKey(summary);
  const cached = await getCachedAiReport(env, cacheKey);
  if (cached) return cached;
  let payload = null;
  try {
    const report = await callZhipuInsightReporter(env, summary);
    if (!report) throw new Error('empty ai report');
    payload = { source: 'zhipu', report };
  } catch (error) {
    const totalText = (summary.totals || []).map((item) => cleanText(item.event_type, 40) + ':' + item.count).join(' / ') || '暂无';
    const report = [
      'AI 洞察暂不可用，已使用规则版总结。',
      '原因：' + cleanText(error && error.message, 200),
      '',
      '事件总览：' + totalText,
      '',
      '商品类型统计',
      '商品类型\t记录数\t最近时间',
      ...tableLines(summary.productTypes, ['product_type', 'count', 'latest_at']),
      '',
      '补全推荐记录',
      'SKU\t品牌\t商品名\t类型\t推荐价格\t推荐装箱数\t来源\t置信度\t价格统计\t原因\t类型来源\t样本数\t时间',
      ...tableLines(summary.recentRecommendations, ['sku', 'brand', 'name', 'product_type', 'recommended_price', 'recommended_pack_qty', 'source', 'confidence', 'price_stats', 'reason', 'product_type_source', 'sample_count', 'created_at']),
      '',
      '最近字段异常',
      'SKU\t品牌\t商品名\t缺失字段\t来源\t时间',
      ...tableLines(summary.recentIssues, ['sku', 'brand', 'name', 'missing_fields', 'source', 'created_at']),
      '',
      'Runtime logs',
      'Level\tSKU\tMessage\tDetail\tSource\tTime',
      ...tableLines(summary.recentLogs, ['level', 'sku', 'message', 'detail', 'source', 'created_at']),
      '',
      'Runtime log diagnostics',
      'Level\tMessage\tCount\tLatest\tSources',
      ...tableLines((summary.logDiagnostics && summary.logDiagnostics.topMessages || []), ['level', 'message', 'count', 'latest_at', 'sources']),
      '',
      '\u6e05\u6d17\u89c4\u5219\u5019\u9009',
      '\u4f18\u5148\u7ea7\t\u5b57\u6bb5\t\u6b21\u6570\t\u52a8\u4f5c\t\u72b6\u6001\t\u53ef\u80fdPLM\u7a7a\u503c\t\u76ee\u6807\u9875\u7b7e\t\u5df2\u8bfb\u672a\u89e3\u6790\t\u672a\u8bfb\u5b8c\t\u4e8c\u6b21\u8bfb\u53d6\t\u5efa\u8bae\u52a8\u4f5c\t\u6837\u4f8bSKU',
      ...tableLines(formatRuleRows(summary, 20), ['priority', 'missingField', 'count', 'actionLabel', 'maintenanceStatus', 'likelyPlmEmpty', 'targetTabs', 'parsedButMissingCount', 'unreadCount', 'retryStatus', 'actions', 'examples']),
    ].join('\n');
    payload = { source: 'fallback', error: cleanText(error && error.message, 200), report };
  }
  await setCachedAiReport(env, cacheKey, payload).catch(() => {});
  return payload;
}

async function handleInsightAiStatus(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const model = env.ZHIPU_MODEL || 'glm-4-flash';
  return json({
    ok: true,
    configured: Boolean(env.ZHIPU_API_KEY),
    model,
    capabilities: ['洞察总结', '价格规律总结', '清洗规则建议'],
    note: 'ZHIPU_API_KEY 只配置在 Worker 环境变量；未配置或超时时会自动使用规则版总结。',
  });
}

async function handleInsightReadiness(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const summary = await buildInsightSummary(env);
  const totals = {};
  (summary.totals || []).forEach((item) => {
    totals[item.event_type] = Number(item.count || 0) || 0;
  });
  const recommendationProbe = await probeRecommendationEngine(env, summary);
  const feishuStatus = await getFeishuConfigStatus(env);
  const checks = [
    { key: 'cloudEvents', ok: Object.values(totals).some((count) => count > 0), label: '云端洞察事件', detail: JSON.stringify(totals) },
    { key: 'priceSamples', ok: (totals.price || 0) > 0, label: '历史价格样本', detail: String(totals.price || 0) },
    { key: 'typeSamples', ok: (summary.productTypes || []).length > 0, label: '商品类型样本', detail: String((summary.productTypes || []).length) },
    { key: 'recommendationEngine', ok: recommendationProbe.ok, label: '智能补全推荐引擎', detail: recommendationProbe.detail },
    { key: 'issueSamples', ok: (totals.issue || 0) > 0, label: '字段异常样本', detail: String(totals.issue || 0) },
    { key: 'runtimeLogs', ok: (summary.logDiagnostics && summary.logDiagnostics.total || 0) > 0, label: '运行日志诊断', detail: String(summary.logDiagnostics && summary.logDiagnostics.total || 0) },
    { key: 'cleaningRules', ok: Boolean(summary.rulePackage && summary.rulePackage.rules && summary.rulePackage.rules.length), label: '清洗规则候选', detail: String(summary.rulePackage && summary.rulePackage.rules ? summary.rulePackage.rules.length : 0) },
    { key: 'ai', ok: Boolean(env.ZHIPU_API_KEY), label: 'AI 配置', detail: env.ZHIPU_API_KEY ? (env.ZHIPU_MODEL || 'glm-4-flash') : 'ZHIPU_API_KEY missing' },
    { key: 'feishu', ok: feishuStatus.configured, label: '飞书直写配置', detail: getFeishuStatusDetail(feishuStatus) },
  ];
  const blockers = checks.filter((item) => !item.ok).map((item) => ({
    key: item.key,
    label: item.label,
    detail: item.detail,
  }));
  return json({
    ok: true,
    ready: blockers.length === 0,
    checks,
    blockers,
    totals,
    recommendationProbe,
    feishuStatus,
    logDiagnostics: summary.logDiagnostics,
    generatedAt: new Date().toISOString(),
  });
}

async function probeRecommendationEngine(env, summary) {
  const latest = summary && summary.recentPrices && summary.recentPrices[0];
  if (!latest) return { ok: false, detail: 'no price sample' };
  try {
    const result = await buildInsightRecommendation(env, {
      sku: latest.sku || '',
      productType: latest.product_type || '',
      name: latest.name || '',
    });
    const price = result && result.recommendedPrice ? String(result.recommendedPrice) : '';
    if (!price || price === '0') return { ok: false, detail: 'no recommendation from latest sample' };
    return {
      ok: true,
      detail: [latest.sku || latest.name || 'latest price', price, result.source || ''].filter(Boolean).join(' / '),
      result: {
        sku: result.sku || '',
        recommendedPrice: result.recommendedPrice || '',
        source: result.source || '',
        effectiveProductType: result.effectiveProductType || '',
        reason: result.recommendationReason || '',
      },
    };
  } catch (error) {
    return { ok: false, detail: cleanText(error && error.message, 160) || 'recommendation probe failed' };
  }
}

function normalizePrice(value) {
  const number = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(number) && number > 0 ? Number(number.toFixed(2)) : 0;
}

function summarizePriceSamples(rows) {
  return (rows || []).slice(0, 5).map((row) => ({
    sku: row.sku || '',
    name: cleanText(row.name, 120),
    productType: row.product_type || '',
    price: normalizePrice(row.price),
    packQty: row.pack_qty || '',
    createdAt: row.created_at || '',
  })).filter((row) => row.price > 0);
}

function buildPriceStats(rows) {
  const values = (rows || []).map((row) => normalizePrice(row.price)).filter(Boolean).sort((a, b) => a - b);
  if (!values.length) {
    return { count: 0, min: 0, max: 0, avg: 0, median: 0, spreadRatio: 0 };
  }
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : Number(((values[mid - 1] + values[mid]) / 2).toFixed(2));
  const avg = Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  const min = values[0];
  const max = values[values.length - 1];
  const spreadRatio = avg ? Number(((max - min) / avg).toFixed(3)) : 0;
  return { count: values.length, min, max, avg, median, spreadRatio };
}

function formatPriceStats(stats) {
  if (!stats || !stats.count) return '';
  return '样本' + stats.count + ' / 中位' + stats.median + ' / 均价' + stats.avg + ' / 区间' + stats.min + '-' + stats.max;
}

function buildRecommendationConfidence(source, stats, skuPrice) {
  if (skuPrice) return 96;
  if (!stats || !stats.count) return 0;
  let score = source === 'same-type-median' || source === 'same-type-latest' ? 72 : 58;
  score += Math.min(18, stats.count * 2);
  if (stats.spreadRatio <= 0.15) score += 8;
  else if (stats.spreadRatio >= 0.5) score -= 12;
  return Math.max(20, Math.min(92, Math.round(score)));
}

function buildRecommendationReason(payload) {
  if (!payload || !payload.recommendedPrice) return '暂无可用历史价格样本';
  if (payload.source === 'same-sku') {
    return '使用同 SKU 最近一次历史价格 ' + payload.recommendedPrice;
  }
  if (payload.source === 'same-type-latest') {
    return '使用商品类型“' + (payload.effectiveProductType || payload.productType || '未分类') + '”最近样本价格 ' + payload.recommendedPrice + '，样本数 ' + (payload.typeSampleCount || 0);
  }
  if (payload.source === 'same-type-median') {
    return '使用商品类型“' + (payload.effectiveProductType || payload.productType || '未分类') + '”历史中位价 ' + payload.recommendedPrice + '，' + formatPriceStats(payload.priceStats);
  }
  if (payload.source === 'same-type-average') {
    return '使用商品类型“' + (payload.effectiveProductType || payload.productType || '未分类') + '”平均价格 ' + payload.recommendedPrice + '，样本数 ' + (payload.typeSampleCount || 0);
  }
  if (payload.source === 'name-latest') {
    return '使用相似商品名最近样本价格 ' + payload.recommendedPrice + '，样本数 ' + (payload.typeSampleCount || 0);
  }
  if (payload.source === 'name-median') {
    return '使用相似商品名历史中位价 ' + payload.recommendedPrice + '，' + formatPriceStats(payload.priceStats);
  }
  return '使用历史样本价格 ' + payload.recommendedPrice;
}

function tokenizeForRecommendation(value) {
  const text = cleanText(value, 240).toLowerCase();
  const tokens = new Set();
  const words = text.match(/[a-z0-9]+/g) || [];
  words.forEach((word) => {
    if (word.length >= 2) tokens.add(word);
  });
  const cjk = text.replace(/[^\u4e00-\u9fa5]/g, '');
  for (let size = 2; size <= 4; size += 1) {
    for (let index = 0; index + size <= cjk.length; index += 1) {
      tokens.add(cjk.slice(index, index + size));
    }
  }
  return Array.from(tokens).slice(0, 80);
}

function scoreNameSimilarity(name, row) {
  const target = tokenizeForRecommendation(name);
  if (!target.length) return 0;
  const candidateText = [row.name, row.product_type].filter(Boolean).join(' ');
  const candidateTokens = new Set(tokenizeForRecommendation(candidateText));
  let score = 0;
  target.forEach((token) => {
    if (candidateTokens.has(token)) score += token.length >= 3 ? 2 : 1;
  });
  const targetText = cleanText(name, 240).toLowerCase();
  const candidateName = cleanText(row.name, 240).toLowerCase();
  if (targetText && candidateName && (candidateName.includes(targetText.slice(0, 12)) || targetText.includes(candidateName.slice(0, 12)))) {
    score += 6;
  }
  return score;
}

async function recommendProductType(env, params) {
  const sku = params.sku || '';
  const productType = params.productType || '';
  const name = params.name || '';
  if (productType && productType !== '未分类') {
    return {
      recommendedProductType: productType,
      productTypeSource: 'provided',
      productTypeScore: 100,
      productTypeSamples: [],
    };
  }
  if (sku) {
    const latestSkuType = await env.DB.prepare(`
      SELECT product_type, sku, name, created_at
      FROM insight_events
      WHERE sku = ? AND product_type IS NOT NULL AND product_type != '' AND product_type != '未分类'
      ORDER BY id DESC
      LIMIT 1
    `).bind(sku).first();
    if (latestSkuType && latestSkuType.product_type) {
      return {
        recommendedProductType: latestSkuType.product_type,
        productTypeSource: 'same-sku',
        productTypeScore: 100,
        productTypeSamples: [latestSkuType],
      };
    }
  }
  if (!name) {
    return { recommendedProductType: '', productTypeSource: 'none', productTypeScore: 0, productTypeSamples: [] };
  }
  const rows = await env.DB.prepare(`
    SELECT product_type, sku, name, created_at
    FROM insight_events
    WHERE product_type IS NOT NULL AND product_type != '' AND product_type != '未分类'
      AND name IS NOT NULL AND name != ''
    ORDER BY id DESC
    LIMIT 300
  `).all();
  const scored = (rows.results || [])
    .map((row) => ({ ...row, score: scoreNameSimilarity(name, row) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || String(b.created_at || '').localeCompare(String(a.created_at || '')));
  if (!scored.length || scored[0].score < 2) {
    return { recommendedProductType: '', productTypeSource: 'none', productTypeScore: 0, productTypeSamples: scored.slice(0, 10) };
  }
  return {
    recommendedProductType: scored[0].product_type || '',
    productTypeSource: 'similar-name',
    productTypeScore: scored[0].score,
    productTypeSamples: scored.slice(0, 10),
  };
}

async function handleInsightRecommend(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const url = new URL(request.url);
  const payload = await buildInsightRecommendation(env, {
    sku: cleanText(url.searchParams.get('sku'), 80),
    productType: cleanText(url.searchParams.get('productType'), 120),
    name: cleanText(url.searchParams.get('name'), 200),
  });
  return json(payload);
}

async function buildInsightRecommendation(env, params) {
  const sku = params && params.sku || '';
  const productType = params && params.productType || '';
  const name = params && params.name || '';
  const typeSuggestion = await recommendProductType(env, { sku, productType, name });
  const effectiveProductType = productType && productType !== '未分类' ? productType : typeSuggestion.recommendedProductType;

  let latestSkuPrice = null;
  if (sku) {
    latestSkuPrice = await env.DB.prepare(`
      SELECT price, pack_qty, product_type, created_at
      FROM insight_events
      WHERE event_type = 'price' AND sku = ? AND price IS NOT NULL AND price != ''
      ORDER BY id DESC
      LIMIT 1
    `).bind(sku).first();
  }

  let typeRows = { results: [] };
  let priceMatchMode = 'none';
  if (effectiveProductType) {
    typeRows = await env.DB.prepare(`
      SELECT price, pack_qty, sku, name, product_type, created_at
      FROM insight_events
      WHERE event_type = 'price' AND product_type = ? AND price IS NOT NULL AND price != ''
      ORDER BY id DESC
      LIMIT 30
    `).bind(effectiveProductType).all();
    if (typeRows.results && typeRows.results.length) priceMatchMode = 'type';
  }
  if ((!typeRows.results || !typeRows.results.length) && name) {
    const keyword = '%' + name.slice(0, 20) + '%';
    typeRows = await env.DB.prepare(`
      SELECT price, pack_qty, sku, name, product_type, created_at
      FROM insight_events
      WHERE event_type = 'price' AND name LIKE ? AND price IS NOT NULL AND price != ''
      ORDER BY id DESC
      LIMIT 30
    `).bind(keyword).all();
    if (typeRows.results && typeRows.results.length) priceMatchMode = 'name';
  }

  const prices = (typeRows.results || []).map((row) => normalizePrice(row.price)).filter(Boolean);
  const priceStats = buildPriceStats(typeRows.results || []);
  const avgPrice = prices.length ? Number((prices.reduce((sum, value) => sum + value, 0) / prices.length).toFixed(2)) : 0;
  const latestTypePrice = prices.length ? prices[0] : 0;
  const skuPrice = latestSkuPrice ? normalizePrice(latestSkuPrice.price) : 0;
  const medianTypePrice = priceStats.count >= 3 ? priceStats.median : 0;
  const recommendedPrice = skuPrice || medianTypePrice || latestTypePrice || avgPrice || 0;
  const source = skuPrice
    ? 'same-sku'
    : (medianTypePrice ? (priceMatchMode === 'name' ? 'name-median' : 'same-type-median') : (latestTypePrice ? (priceMatchMode === 'name' ? 'name-latest' : 'same-type-latest') : (avgPrice ? 'same-type-average' : 'none')));
  const recommendationConfidence = buildRecommendationConfidence(source, priceStats, skuPrice);
  const priceSamples = summarizePriceSamples(typeRows.results || []);
  const reasonPayload = {
    recommendedPrice,
    source,
    effectiveProductType,
    productType,
    typeSampleCount: prices.length,
    priceStats,
  };

  return {
    ok: true,
    sku,
    productType,
    effectiveProductType,
    name,
    recommendedPrice,
    source,
    recommendationReason: buildRecommendationReason(reasonPayload),
    recommendationConfidence,
    priceConfidence: recommendationConfidence,
    ...typeSuggestion,
    latestSkuPrice,
    typeSampleCount: prices.length,
    avgTypePrice: avgPrice,
    latestTypePrice,
    medianTypePrice,
    priceStats,
    priceSamples,
    typeSamples: (typeRows.results || []).slice(0, 10),
  };
}

function buildRuleCandidates(issueRows) {
  const groups = new Map();
  (issueRows || []).forEach((row) => {
    let payload = {};
    try {
      payload = row.payload ? JSON.parse(row.payload) : {};
    } catch (error) {
      payload = {};
    }
    const diagnosticAttempt = normalizeDiagnosticAttempt(payload && payload.diagnosticAttempt);
    const diagnostics = normalizeFieldDiagnostics(payload, row);
    const fields = diagnostics.length
      ? diagnostics
      : String(row.missing_fields || '').split(',').map((item) => ({ field: item.trim(), issueKind: payload.issueKind || '', action: '', targetTab: '', tabRead: false })).filter((item) => item.field);
    fields.forEach((diagnostic) => {
      const field = diagnostic.field;
      const current = groups.get(field) || {
        missingField: field,
        count: 0,
        sources: new Set(),
        examples: [],
        latestAt: '',
        issueKinds: new Set(),
        targetTabs: new Set(),
        actions: new Set(),
        retryStatuses: new Set(),
        retryTabs: new Set(),
        parsedButMissingCount: 0,
        unreadCount: 0,
        retryStillMissingCount: 0,
        retryFixedCount: 0,
      };
      current.count += 1;
      if (row.source) current.sources.add(row.source);
      if (payload.issueKind) current.issueKinds.add(payload.issueKind);
      if (diagnostic.issueKind) current.issueKinds.add(diagnostic.issueKind);
      if (diagnostic.targetTab) current.targetTabs.add(diagnostic.targetTab);
      if (diagnostic.action) current.actions.add(diagnostic.action);
      if (diagnosticAttempt.status) current.retryStatuses.add(diagnosticAttempt.status);
      (diagnosticAttempt.tabs || []).forEach((tab) => current.retryTabs.add(tab));
      if ((diagnosticAttempt.afterMissing || []).includes(field)) current.retryStillMissingCount += 1;
      if ((diagnosticAttempt.fixed || []).includes(field)) current.retryFixedCount += 1;
      if (diagnostic.tabRead) current.parsedButMissingCount += 1;
      else current.unreadCount += 1;
      if (current.examples.length < 5) {
        current.examples.push({
          sku: row.sku || '',
          brand: row.brand || '',
          name: row.name || '',
          source: row.source || '',
          issueKind: diagnostic.issueKind || payload.issueKind || '',
          readiness: payload.readiness || '',
          targetTab: diagnostic.targetTab || '',
          action: diagnostic.action || '',
          diagnosticAttempt: summarizeDiagnosticAttempt(diagnosticAttempt),
          createdAt: row.created_at || '',
        });
      }
      if (!current.latestAt || String(row.created_at || '') > current.latestAt) current.latestAt = row.created_at || '';
      groups.set(field, current);
    });
  });
  return Array.from(groups.values()).map((item) => {
    const issueKinds = Array.from(item.issueKinds);
    const highPriority = item.issueKinds.has('页面已读但未解析');
    const mediumPriority = item.count >= 3 || item.issueKinds.has('页面未读完');
    const priority = highPriority ? 'P1' : (mediumPriority ? 'P2' : 'P3');
    const reason = highPriority
      ? '页面已读到对应区域但字段为空，更可能是选择器或解析规则缺失'
      : (item.issueKinds.has('页面未读完') ? '页面读取流程可能不完整，先检查 tab 切换/等待' : '可能是 PLM 本身为空或低频异常');
    const retryReason = buildRetryReason(item);
    const actionSuggestion = item.actions && item.actions.size
      ? Array.from(item.actions).slice(0, 3).join('；')
      : (highPriority
      ? '高优先级：页面已读但字段为空，优先补充“' + item.missingField + '”的选择器/解析规则。'
      : '优先检查“' + item.missingField + '”字段的页面标签、表格列名和兜底来源；如果 PLM 页面有值但脚本为空，应补充选择器/解析规则。');
    return {
      missingField: item.missingField,
      count: item.count,
      priority,
      reason: [reason, retryReason].filter(Boolean).join('；'),
      sources: Array.from(item.sources),
      issueKinds,
      targetTabs: Array.from(item.targetTabs || []),
      actions: Array.from(item.actions || []),
      retryStatuses: Array.from(item.retryStatuses || []),
      retryTabs: Array.from(item.retryTabs || []),
      parsedButMissingCount: item.parsedButMissingCount || 0,
      unreadCount: item.unreadCount || 0,
      retryStillMissingCount: item.retryStillMissingCount || 0,
      retryFixedCount: item.retryFixedCount || 0,
      examples: item.examples,
      latestAt: item.latestAt,
      suggestion: [actionSuggestion, retryReason].filter(Boolean).join('；'),
    };
  }).sort((a, b) => a.priority.localeCompare(b.priority) || b.count - a.count || String(b.latestAt).localeCompare(String(a.latestAt)));
}

function normalizeDiagnosticAttempt(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    status: cleanText(source.status, 40),
    reason: cleanText(source.reason, 160),
    beforeMissing: cleanList(source.beforeMissing),
    afterMissing: cleanList(source.afterMissing),
    fixed: cleanList(source.fixed),
    tabs: cleanList(source.tabs, 8),
    at: cleanText(source.at, 80),
  };
}

function summarizeDiagnosticAttempt(diagnostic) {
  if (!diagnostic || !diagnostic.status) return '';
  const parts = [diagnostic.status];
  if (diagnostic.tabs && diagnostic.tabs.length) parts.push('页签 ' + diagnostic.tabs.join('/'));
  if (diagnostic.fixed && diagnostic.fixed.length) parts.push('补到 ' + diagnostic.fixed.join('/'));
  if (diagnostic.afterMissing && diagnostic.afterMissing.length) parts.push('仍缺 ' + diagnostic.afterMissing.join('/'));
  if (diagnostic.reason) parts.push(diagnostic.reason);
  return parts.join('；');
}

function buildRetryReason(item) {
  const statuses = Array.from(item.retryStatuses || []);
  if (!statuses.length) return '';
  const parts = ['二次读取 ' + statuses.join('/')];
  const retryTabs = Array.from(item.retryTabs || []);
  if (retryTabs.length) parts.push('尝试页签 ' + retryTabs.join('/'));
  if (item.retryStillMissingCount || item.retryFixedCount) {
    parts.push('仍缺 ' + (item.retryStillMissingCount || 0) + ' 次，补到 ' + (item.retryFixedCount || 0) + ' 次');
  }
  return parts.join('，');
}

function normalizeFieldDiagnostics(payload, row) {
  const items = Array.isArray(payload && payload.fieldDiagnostics) ? payload.fieldDiagnostics : [];
  return items.map((item) => ({
    field: cleanText(item && item.field, 80),
    targetTab: cleanText(item && item.targetTab, 80),
    tabRead: Boolean(item && item.tabRead),
    issueKind: cleanText(item && item.issueKind, 80),
    action: cleanText(item && item.action, 160),
  })).filter((item) => item.field);
}

function classifyRuleMaintenance(candidate) {
  const issueKinds = candidate.issueKinds || [];
  const pageParsedButEmpty = issueKinds.includes('\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790');
  const pageNotReady = issueKinds.includes('\u9875\u9762\u672a\u8bfb\u5b8c');
  const likelyPlmEmpty = issueKinds.includes('\u53ef\u80fd PLM \u7a7a\u503c') && !pageParsedButEmpty && !pageNotReady;
  if (pageParsedButEmpty) {
    return {
      actionCode: 'parser-rule',
      actionLabel: '\u8865\u5145\u89e3\u6790\u89c4\u5219',
      maintenanceStatus: '\u9700\u5904\u7406',
      likelyPlmEmpty: false,
    };
  }
  if (pageNotReady) {
    return {
      actionCode: 'read-flow',
      actionLabel: '\u68c0\u67e5\u9875\u7b7e\u5207\u6362\u548c\u7b49\u5f85',
      maintenanceStatus: '\u9700\u5904\u7406',
      likelyPlmEmpty: false,
    };
  }
  return {
    actionCode: likelyPlmEmpty ? 'plm-empty-watch' : 'review',
    actionLabel: likelyPlmEmpty ? '\u53ef\u80fd PLM \u7a7a\u503c\uff0c\u5148\u89c2\u5bdf' : '\u4eba\u5de5\u590d\u6838',
    maintenanceStatus: likelyPlmEmpty ? '\u89c2\u5bdf' : '\u5f85\u590d\u6838',
    likelyPlmEmpty,
  };
}

function buildStableRuleId(candidate) {
  const field = cleanText(candidate && candidate.missingField, 80) || 'field';
  return 'clean-' + field.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function buildRuleMaintenancePackage(candidates) {
  const rules = (candidates || []).map((candidate, index) => {
    const classified = classifyRuleMaintenance(candidate);
    return {
      ruleId: buildStableRuleId(candidate) || ['clean', candidate.priority || 'P3', index + 1].join('-'),
      missingField: candidate.missingField || '',
      priority: candidate.priority || 'P3',
      count: candidate.count || 0,
      latestAt: candidate.latestAt || '',
      sources: candidate.sources || [],
      issueKinds: candidate.issueKinds || [],
      targetTabs: candidate.targetTabs || [],
      actions: candidate.actions || [],
      retryStatuses: candidate.retryStatuses || [],
      retryTabs: candidate.retryTabs || [],
      parsedButMissingCount: candidate.parsedButMissingCount || 0,
      unreadCount: candidate.unreadCount || 0,
      retryStillMissingCount: candidate.retryStillMissingCount || 0,
      retryFixedCount: candidate.retryFixedCount || 0,
      examples: candidate.examples || [],
      reason: candidate.reason || '',
      suggestion: candidate.suggestion || '',
      ...classified,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    total: rules.length,
    actionableCount: rules.filter((item) => item.maintenanceStatus === '\u9700\u5904\u7406').length,
    likelyPlmEmptyCount: rules.filter((item) => item.likelyPlmEmpty).length,
    rules,
  };
}

async function upsertCleaningRules(env, rulePackage) {
  const rules = rulePackage && Array.isArray(rulePackage.rules) ? rulePackage.rules : [];
  for (const rule of rules) {
    await env.DB.prepare(`
      INSERT INTO cleaning_rules (
        rule_id, missing_field, priority, action_code, action_label, maintenance_status,
        likely_plm_empty, count, sources, issue_kinds, examples, reason, suggestion,
        latest_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(rule_id) DO UPDATE SET
        missing_field = excluded.missing_field,
        priority = excluded.priority,
        action_code = excluded.action_code,
        action_label = excluded.action_label,
        maintenance_status = excluded.maintenance_status,
        likely_plm_empty = excluded.likely_plm_empty,
        count = excluded.count,
        sources = excluded.sources,
        issue_kinds = excluded.issue_kinds,
        examples = excluded.examples,
        reason = excluded.reason,
        suggestion = excluded.suggestion,
        latest_at = excluded.latest_at,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      rule.ruleId || '',
      rule.missingField || '',
      rule.priority || '',
      rule.actionCode || '',
      rule.actionLabel || '',
      rule.maintenanceStatus || '',
      rule.likelyPlmEmpty ? 1 : 0,
      Number(rule.count || 0),
      JSON.stringify(rule.sources || []),
      JSON.stringify(rule.issueKinds || []),
      JSON.stringify(rule.examples || []),
      rule.reason || '',
      rule.suggestion || '',
      rule.latestAt || '',
    ).run();
  }
}

function parseJsonArray(value) {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function getMaintainedCleaningRules(env, limit) {
  const rows = await env.DB.prepare(`
    SELECT rule_id, missing_field, priority, action_code, action_label, maintenance_status,
      status_override, likely_plm_empty, count, sources, issue_kinds, examples, reason, suggestion, note,
      first_seen_at, latest_at, updated_at
    FROM cleaning_rules
    ORDER BY
      CASE priority WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
      count DESC,
      updated_at DESC
    LIMIT ?
  `).bind(Math.max(1, Math.min(Number(limit || 100), 300))).all();
  return (rows.results || []).map((row) => ({
    ruleId: row.rule_id || '',
    missingField: row.missing_field || '',
    priority: row.priority || '',
    actionCode: row.action_code || '',
    actionLabel: row.action_label || '',
    maintenanceStatus: row.status_override || row.maintenance_status || '',
    computedMaintenanceStatus: row.maintenance_status || '',
    statusOverride: row.status_override || '',
    likelyPlmEmpty: Boolean(row.likely_plm_empty),
    count: Number(row.count || 0),
    sources: parseJsonArray(row.sources),
    issueKinds: parseJsonArray(row.issue_kinds),
    examples: parseJsonArray(row.examples),
    reason: row.reason || '',
    suggestion: row.suggestion || '',
    note: row.note || '',
    firstSeenAt: row.first_seen_at || '',
    latestAt: row.latest_at || '',
    updatedAt: row.updated_at || '',
  }));
}

function formatRuleCandidates(candidates) {
  if (!candidates.length) return '暂无清洗规则候选。';
  const lines = [
    'PLM 数据清洗规则候选',
    '优先级\t字段\t次数\t异常类型\t二次读取\t原因\t来源\t样例SKU\t建议',
  ];
  candidates.forEach((item) => {
    lines.push([
      item.priority,
      item.missingField,
      item.count,
      item.issueKinds.join('/') || '-',
      formatRuleRetryStatus(item) || '-',
      item.reason,
      item.sources.join('/') || '-',
      item.examples.map((example) => example.sku).filter(Boolean).join(',') || '-',
      item.suggestion,
    ].map(tsvEscape).join('\t'));
  });
  return lines.join('\n');
}

async function handleInsightRules(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const rows = await env.DB.prepare(`
    SELECT sku, brand, name, missing_fields, source, payload, created_at
    FROM insight_events
    WHERE event_type = 'issue'
    ORDER BY id DESC
    LIMIT 500
  `).all();
  const candidates = buildRuleCandidates(rows.results || []);
  const rulePackage = buildRuleMaintenancePackage(candidates);
  await upsertCleaningRules(env, rulePackage).catch(() => {});
  const maintainedRules = await getMaintainedCleaningRules(env, 100).catch(() => []);
  const maintainedById = new Map(maintainedRules.map((rule) => [rule.ruleId, rule]));
  rulePackage.rules = rulePackage.rules.map((rule) => {
    const maintained = maintainedById.get(rule.ruleId);
    return maintained ? { ...rule, maintenanceStatus: maintained.maintenanceStatus, statusOverride: maintained.statusOverride, note: maintained.note } : rule;
  });
  rulePackage.maintainedCount = maintainedRules.length;
  rulePackage.maintainedRules = maintainedRules;
  return json({
    ok: true,
    candidates,
    rulePackage,
    tsv: formatRuleCandidates(candidates),
  });
}

async function handleMaintainedCleaningRules(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || 100);
  const rules = await getMaintainedCleaningRules(env, limit);
  return json({
    ok: true,
    total: rules.length,
    rules,
  });
}

async function handleCleaningRuleStatusUpdate(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const body = await parseJson(request);
  const ruleId = cleanText(body && body.ruleId, 120);
  const status = cleanText(body && body.status, 40);
  const note = cleanText(body && body.note, 500);
  const allowedStatuses = new Set(['\u81ea\u52a8', '\u9700\u5904\u7406', '\u89c2\u5bdf', '\u5f85\u590d\u6838', '\u5df2\u5904\u7406', '\u5ffd\u7565']);
  if (!ruleId) return json({ error: 'ruleId required' }, 400);
  if (!allowedStatuses.has(status)) return json({ error: 'invalid status' }, 400);
  const existing = await env.DB.prepare(`
    SELECT rule_id
    FROM cleaning_rules
    WHERE rule_id = ?
  `).bind(ruleId).first();
  if (!existing) return json({ error: 'rule not found' }, 404);
  await env.DB.prepare(`
    UPDATE cleaning_rules
    SET status_override = ?, note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE rule_id = ?
  `).bind(status === '\u81ea\u52a8' ? null : status, note, ruleId).run();
  const rules = await getMaintainedCleaningRules(env, 300);
  const rule = rules.find((item) => item.ruleId === ruleId) || null;
  return json({ ok: true, rule });
}

async function getFeishuTenantToken(env) {
  const appId = env.FEISHU_APP_ID;
  const appSecret = env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) throw new Error('FEISHU_APP_ID/FEISHU_APP_SECRET not configured');
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(data && data.msg ? data.msg : 'feishu tenant token failed');
  }
  return data.tenant_access_token;
}

async function getFeishuTableFields(env, token) {
  const appToken = env.FEISHU_BITABLE_APP_TOKEN;
  const tableId = env.FEISHU_BITABLE_TABLE_ID;
  if (!appToken || !tableId) throw new Error('FEISHU_BITABLE_APP_TOKEN/FEISHU_BITABLE_TABLE_ID not configured');
  const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/' + encodeURIComponent(appToken) + '/tables/' + encodeURIComponent(tableId) + '/fields?page_size=100', {
    headers: {
      authorization: 'Bearer ' + token,
      'content-type': 'application/json; charset=utf-8',
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    throw new Error(data && data.msg ? data.msg : 'feishu fields check failed');
  }
  const items = data && data.data && Array.isArray(data.data.items) ? data.data.items : [];
  return items.map((item) => item.field_name || item.name || '').filter(Boolean);
}

async function checkFeishuTableSchema(env, token) {
  const existingFields = await getFeishuTableFields(env, token);
  const existingSet = new Set(existingFields);
  const requiredFields = getFeishuRequiredFields();
  const missingFields = requiredFields.filter((field) => !existingSet.has(field));
  return {
    ok: missingFields.length === 0,
    existingFields,
    requiredFields,
    missingFields,
  };
}

function buildFeishuRecords(summary, aiPayload) {
  const rows = [];
  if (aiPayload && aiPayload.report) {
    const report = cleanText(aiPayload.report, 1000);
    rows.push({
      syncKey: ['ai-summary', aiPayload.source || '', report.slice(0, 80)].join('|'),
      recordType: 'AI整理总结',
      sku: '',
      fields: {
        '记录类型': 'AI整理总结',
        'SKU': '',
        '品牌': '',
        '商品名': report.slice(0, 200),
        '商品类型': '',
        '价格': '',
        '装箱数': '',
        '包装尺寸': '',
        '产品尺寸': '',
        '缺失字段': report,
        '来源': aiPayload.source || 'insight-summary',
        '记录时间': new Date().toISOString(),
      },
    });
  }
  (summary.recentPrices || []).forEach((item) => {
    const syncKey = ['price', item.sku || '', item.price || '', item.pack_qty || '', item.created_at || ''].join('|');
    rows.push({
      syncKey,
      recordType: '价格历史',
      sku: item.sku || '',
      fields: {
        '记录类型': '价格历史',
        'SKU': item.sku || '',
        '品牌': item.brand || '',
        '商品名': item.name || '',
        '商品类型': item.product_type || '',
        '价格': item.price || '',
        '装箱数': item.pack_qty || '',
        '包装尺寸': item.package_size || '',
        '产品尺寸': item.product_size || '',
        '缺失字段': '',
        '来源': 'cloud-insight',
        '记录时间': item.created_at || '',
      },
    });
  });
  (summary.productTypes || []).forEach((item) => {
    const syncKey = ['type', item.product_type || '', item.count || '', item.latest_at || ''].join('|');
    rows.push({
      syncKey,
      recordType: '商品类型统计',
      sku: '',
      fields: {
        '记录类型': '商品类型统计',
        'SKU': '',
        '品牌': '',
        '商品名': '',
        '商品类型': item.product_type || '',
        '价格': '',
        '装箱数': '',
        '包装尺寸': '',
        '产品尺寸': '',
        '缺失字段': '记录数：' + (item.count || 0),
        '来源': 'cloud-insight',
        '记录时间': item.latest_at || '',
      },
    });
  });
  (summary.recentRecommendations || []).forEach((item) => {
    const syncKey = ['recommendation', item.sku || '', item.recommended_price || '', item.source || '', item.created_at || ''].join('|');
    rows.push({
      syncKey,
      recordType: '智能补全推荐',
      sku: item.sku || '',
      fields: {
        '记录类型': '智能补全推荐',
        'SKU': item.sku || '',
        '品牌': item.brand || '',
        '商品名': item.name || '',
        '商品类型': item.product_type || '',
        '价格': item.recommended_price || '',
        '装箱数': item.recommended_pack_qty || '',
        '包装尺寸': '',
        '产品尺寸': '',
        '缺失字段': [item.reason || '', item.confidence ? '置信度：' + item.confidence : '', item.price_stats || '', item.product_type_source ? '类型来源：' + item.product_type_source : '', item.sample_count ? '样本数：' + item.sample_count : ''].filter(Boolean).join(' / '),
        '来源': item.source || 'recommendation',
        '记录时间': item.created_at || '',
      },
    });
  });
  ((summary.rulePackage && summary.rulePackage.rules) || [])
    .filter((item) => item.maintenanceStatus !== '\u5df2\u5904\u7406' && item.maintenanceStatus !== '\u5ffd\u7565')
    .filter((item) => item.priority === 'P1' || item.priority === 'P2' || item.maintenanceStatus === '\u9700\u5904\u7406')
    .slice(0, 30)
    .forEach((item) => {
      const exampleSkus = formatRuleExampleSkus(item);
      const targetTabs = formatRuleTargetTabs(item);
      const actions = formatRuleActions(item);
      const retryStatus = formatRuleRetryStatus(item);
      const syncKey = ['clean-rule', item.ruleId || '', item.count || '', item.latestAt || ''].join('|');
      rows.push({
        syncKey,
        recordType: '\u6e05\u6d17\u89c4\u5219\u5019\u9009',
        sku: exampleSkus.slice(0, 80),
        fields: {
          '\u8bb0\u5f55\u7c7b\u578b': '\u6e05\u6d17\u89c4\u5219\u5019\u9009',
          'SKU': exampleSkus,
          '\u54c1\u724c': '',
          '\u5546\u54c1\u540d': item.reason || '',
          '\u5546\u54c1\u7c7b\u578b': item.priority || '',
          '\u4ef7\u683c': '',
          '\u88c5\u7bb1\u6570': '',
          '\u5305\u88c5\u5c3a\u5bf8': item.actionLabel || '',
          '\u4ea7\u54c1\u5c3a\u5bf8': item.maintenanceStatus || '',
          '\u7f3a\u5931\u5b57\u6bb5': [item.missingField || '', targetTabs ? '\u76ee\u6807\u9875\u7b7e\uff1a' + targetTabs : '', retryStatus ? '\u4e8c\u6b21\u8bfb\u53d6\uff1a' + retryStatus : '', actions || item.suggestion || ''].filter(Boolean).join(' / '),
          '\u6765\u6e90': (item.sources || []).join('/') || item.actionCode || 'clean-rule',
          '\u8bb0\u5f55\u65f6\u95f4': item.latestAt || (summary.rulePackage && summary.rulePackage.generatedAt) || '',
        },
      });
    });
  (summary.recentIssues || []).forEach((item) => {
    const syncKey = ['issue', item.sku || '', item.missing_fields || '', item.source || '', item.created_at || ''].join('|');
    rows.push({
      syncKey,
      recordType: '字段异常',
      sku: item.sku || '',
      fields: {
        '记录类型': '字段异常',
        'SKU': item.sku || '',
        '品牌': item.brand || '',
        '商品名': item.name || '',
        '商品类型': '',
        '价格': '',
        '装箱数': '',
        '包装尺寸': '',
        '产品尺寸': '',
        '缺失字段': item.missing_fields || '',
        '来源': item.source || '',
        '记录时间': item.created_at || '',
      },
    });
  });
  (summary.recentLogs || []).forEach((item) => {
    const syncKey = ['log', item.level || '', (item.message || '').slice(0, 120), item.created_at || ''].join('|');
    rows.push({
      syncKey,
      recordType: '运行日志',
      sku: item.sku || '',
      fields: {
        '\u8bb0\u5f55\u7c7b\u578b': '运行日志',
        'SKU': item.sku || '',
        '\u54c1\u724c': item.brand || '',
        '\u5546\u54c1\u540d': item.name || (item.message || '').slice(0, 200),
        '\u5546\u54c1\u7c7b\u578b': item.level || '',
        '\u4ef7\u683c': '',
        '\u88c5\u7bb1\u6570': '',
        '\u5305\u88c5\u5c3a\u5bf8': item.version || '',
        '\u4ea7\u54c1\u5c3a\u5bf8': item.url || '',
        '\u7f3a\u5931\u5b57\u6bb5': [item.message || '', item.detail || ''].filter(Boolean).join(' | '),
        '\u6765\u6e90': item.source || 'plm-helper-log',
        '\u8bb0\u5f55\u65f6\u95f4': item.created_at || '',
      },
    });
  });
  return rows.slice(0, 500);
}

async function filterUnsyncedFeishuRecords(env, records) {
  const result = [];
  for (const record of records) {
    const row = await env.DB.prepare(`
      SELECT sync_key
      FROM feishu_synced_records
      WHERE sync_key = ?
    `).bind(record.syncKey).first();
    if (!row) result.push(record);
  }
  return result;
}

async function markFeishuRecordsSynced(env, records) {
  for (const record of records) {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO feishu_synced_records (sync_key, record_type, sku)
      VALUES (?, ?, ?)
    `).bind(record.syncKey, record.recordType || '', record.sku || '').run();
  }
}

async function handleInsightFeishuSync(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const appToken = env.FEISHU_BITABLE_APP_TOKEN;
  const tableId = env.FEISHU_BITABLE_TABLE_ID;
  if (!appToken || !tableId) {
    return json({ ok: false, error: 'FEISHU_BITABLE_APP_TOKEN/FEISHU_BITABLE_TABLE_ID not configured' }, 400);
  }
  const summary = await buildInsightSummary(env);
  const aiPayload = await buildInsightAiReportPayload(env, summary);
  const allRecords = buildFeishuRecords(summary, aiPayload);
  const records = await filterUnsyncedFeishuRecords(env, allRecords);
  if (!records.length) return json({ ok: true, inserted: 0, message: 'no records' });
  const token = await getFeishuTenantToken(env);
  const schema = await checkFeishuTableSchema(env, token);
  if (!schema.ok) {
    return json({
      ok: false,
      error: 'feishu table missing required fields',
      missingFields: schema.missingFields,
      requiredFields: schema.requiredFields,
      existingFields: schema.existingFields,
    }, 400);
  }
  let inserted = 0;
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500);
    const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/' + encodeURIComponent(appToken) + '/tables/' + encodeURIComponent(tableId) + '/records/batch_create', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ records: chunk.map((record) => ({ fields: record.fields || {} })) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.code !== 0) {
      throw new Error(data && data.msg ? data.msg : 'feishu batch_create failed');
    }
    inserted += chunk.length;
    await markFeishuRecordsSynced(env, chunk);
  }
  return json({ ok: true, inserted, skipped: allRecords.length - records.length });
}

function getFeishuRequiredFields() {
  return ['记录类型', 'SKU', '品牌', '商品名', '商品类型', '价格', '装箱数', '包装尺寸', '产品尺寸', '缺失字段', '来源', '记录时间'];
}

function getFeishuRequiredFieldSchema() {
  return [
    { name: '记录类型', type: '单行文本', note: 'AI整理总结/价格历史/商品类型统计/清洗规则候选/字段异常/运行日志' },
    { name: 'SKU', type: '单行文本', note: '商品编码或样例 SKU' },
    { name: '品牌', type: '单行文本', note: '品牌名' },
    { name: '商品名', type: '多行文本', note: '商品名；AI 总结会放摘要' },
    { name: '商品类型', type: '单行文本', note: '自动识别或历史推荐类型' },
    { name: '价格', type: '单行文本', note: '历史采购价/推荐价' },
    { name: '装箱数', type: '单行文本', note: '历史装箱数' },
    { name: '包装尺寸', type: '单行文本', note: '纸盒/外包装尺寸' },
    { name: '产品尺寸', type: '单行文本', note: '产品尺寸或日志 URL' },
    { name: '缺失字段', type: '多行文本', note: '字段异常、清洗规则建议或日志详情' },
    { name: '来源', type: '单行文本', note: 'cloud-insight/clean-rule/plm-helper-log 等' },
    { name: '记录时间', type: '日期或单行文本', note: '事件发生时间' },
  ];
}

function buildFeishuSetupGuide(requiredEnv, missing) {
  const fieldLines = getFeishuRequiredFieldSchema().map((field) => [
    field.name,
    field.type,
    field.note,
  ].join('\t'));
  const secretLines = requiredEnv.map((key) => 'npx.cmd wrangler secret put ' + key);
  return [
    'PLM 云洞察飞书多维表配置',
    '',
    '一、Worker secrets',
    '缺失：' + (missing.length ? missing.join(' / ') : '无'),
    ...secretLines,
    'npx.cmd wrangler deploy',
    '',
    '二、多维表字段模板',
    '字段名\t建议类型\t用途',
    ...fieldLines,
    '',
    '三、说明',
    '字段名需要和模板完全一致；密钥只配置在 Cloudflare Worker 环境变量，不要写进油猴脚本。',
  ].join('\n');
}

async function getFeishuConfigStatus(env) {
  const requiredEnv = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_BITABLE_APP_TOKEN', 'FEISHU_BITABLE_TABLE_ID'];
  const setupCommands = requiredEnv
    .map((key) => 'npx.cmd wrangler secret put ' + key)
    .concat('npx.cmd wrangler deploy');
  const missing = requiredEnv.filter((key) => !env[key]);
  let tableSchema = null;
  let checkError = '';
  if (!missing.length) {
    try {
      const token = await getFeishuTenantToken(env);
      tableSchema = await checkFeishuTableSchema(env, token);
    } catch (error) {
      checkError = cleanText(error && error.message, 300);
    }
  }
  const configured = missing.length === 0 && !checkError && (!tableSchema || tableSchema.ok);
  return {
    configured,
    missing,
    requiredEnv,
    requiredFields: getFeishuRequiredFields(),
    requiredFieldSchema: getFeishuRequiredFieldSchema(),
    tableSchema,
    tableMissingFields: tableSchema && tableSchema.missingFields || [],
    checkError,
    setupCommands,
    setupGuide: buildFeishuSetupGuide(requiredEnv, missing),
    note: '飞书多维表字段名需要和 requiredFields 完全一致；密钥只配置在 Worker 环境变量，不要写进油猴脚本。',
  };
}

function getFeishuStatusDetail(status) {
  if (!status) return 'unknown';
  if (status.missing && status.missing.length) return status.missing.join(',');
  if (status.tableMissingFields && status.tableMissingFields.length) return 'missing fields: ' + status.tableMissingFields.join(',');
  if (status.checkError) return status.checkError;
  return status.configured ? 'configured' : 'not configured';
}

async function handleInsightFeishuStatus(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const status = await getFeishuConfigStatus(env);
  return json({
    ok: true,
    ...status,
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return json({ ok: true });

    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true });
    if (url.pathname === '/backup/save' && request.method === 'POST') return handleBackupSave(request, env);
    if (url.pathname === '/backup/load' && request.method === 'GET') return handleBackupLoad(request, env);
    if (url.pathname === '/pack/record' && request.method === 'POST') return handlePackRecord(request, env);
    if (url.pathname === '/pack/recommend' && request.method === 'GET') return handlePackRecommend(request, env);
    if (url.pathname === '/pack/ai-estimate' && request.method === 'POST') return handlePackAiEstimate(request, env);
    if (url.pathname === '/insights/record' && request.method === 'POST') return handleInsightRecord(request, env);
    if (url.pathname === '/insights/summary' && request.method === 'GET') return handleInsightSummary(request, env);
    if (url.pathname === '/insights/report' && request.method === 'GET') return handleInsightReport(request, env);
    if (url.pathname === '/insights/ai-report' && request.method === 'GET') return handleInsightAiReport(request, env);
    if (url.pathname === '/insights/ai-status' && request.method === 'GET') return handleInsightAiStatus(request, env);
    if (url.pathname === '/insights/readiness' && request.method === 'GET') return handleInsightReadiness(request, env);
    if (url.pathname === '/insights/feishu-tsv' && request.method === 'GET') return handleInsightFeishuTsv(request, env);
    if (url.pathname === '/insights/recommend' && request.method === 'GET') return handleInsightRecommend(request, env);
    if (url.pathname === '/insights/rules' && request.method === 'GET') return handleInsightRules(request, env);
    if (url.pathname === '/insights/rules/maintained' && request.method === 'GET') return handleMaintainedCleaningRules(request, env);
    if (url.pathname === '/insights/rules/status' && request.method === 'POST') return handleCleaningRuleStatusUpdate(request, env);
    if (url.pathname === '/insights/feishu-status' && request.method === 'GET') return handleInsightFeishuStatus(request, env);
    if (url.pathname === '/insights/feishu-sync' && request.method === 'POST') return handleInsightFeishuSync(request, env);

    return json({ error: 'not found' }, 404);
  },
};
