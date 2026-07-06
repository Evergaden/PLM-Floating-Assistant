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
  if (!eventType || !/^(price|issue|type|summary)$/.test(eventType)) return json({ error: 'invalid eventType' }, 400);

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

  return {
    totals: totals.results || [],
    productTypes: productTypes.results || [],
    recentIssues: recentIssues.results || [],
    recentPrices: recentPrices.results || [],
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
    '四、最近字段异常',
    'SKU\t品牌\t商品名\t缺失字段\t来源\t时间',
    ...tableLines(summary.recentIssues, ['sku', 'brand', 'name', 'missing_fields', 'source', 'created_at']),
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
  const sections = [
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
      '字段异常',
      ['SKU', '品牌', '商品名', '缺失字段', '来源', '记录时间'],
      summary.recentIssues,
      ['sku', 'brand', 'name', 'missing_fields', 'source', 'created_at']
    ),
  ];
  return json({
    ok: true,
    format: 'tsv',
    copiedAt: new Date().toISOString(),
    tsv: sections.join('\n\n'),
    summary,
  });
}

function normalizePrice(value) {
  const number = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(number) && number > 0 ? Number(number.toFixed(2)) : 0;
}

async function handleInsightRecommend(request, env) {
  if (!requireApiKey(request, env)) return json({ error: 'unauthorized' }, 401);
  const url = new URL(request.url);
  const sku = cleanText(url.searchParams.get('sku'), 80);
  const productType = cleanText(url.searchParams.get('productType'), 120);
  const name = cleanText(url.searchParams.get('name'), 200);

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
  if (productType) {
    typeRows = await env.DB.prepare(`
      SELECT price, pack_qty, sku, name, created_at
      FROM insight_events
      WHERE event_type = 'price' AND product_type = ? AND price IS NOT NULL AND price != ''
      ORDER BY id DESC
      LIMIT 30
    `).bind(productType).all();
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
  }

  const prices = (typeRows.results || []).map((row) => normalizePrice(row.price)).filter(Boolean);
  const avgPrice = prices.length ? Number((prices.reduce((sum, value) => sum + value, 0) / prices.length).toFixed(2)) : 0;
  const latestTypePrice = prices.length ? prices[0] : 0;
  const skuPrice = latestSkuPrice ? normalizePrice(latestSkuPrice.price) : 0;
  const recommendedPrice = skuPrice || latestTypePrice || avgPrice || 0;
  const source = skuPrice ? 'same-sku' : (latestTypePrice ? 'same-type-latest' : (avgPrice ? 'same-type-average' : 'none'));

  return json({
    ok: true,
    sku,
    productType,
    name,
    recommendedPrice,
    source,
    latestSkuPrice,
    typeSampleCount: prices.length,
    avgTypePrice: avgPrice,
    latestTypePrice,
    typeSamples: (typeRows.results || []).slice(0, 10),
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
    if (url.pathname === '/insights/feishu-tsv' && request.method === 'GET') return handleInsightFeishuTsv(request, env);
    if (url.pathname === '/insights/recommend' && request.method === 'GET') return handleInsightRecommend(request, env);

    return json({ error: 'not found' }, 404);
  },
};
