
  function getLedgerPerformanceKind(record) {
    if (record && record.status === '作废') return 'void';
    if (record && record.performanceType === 'extension') return 'extension';
    const designType = String(record && record.designType || '').replace(/\s+/g, '');
    return /(?:换|无)(?:logo|标识|商标)/i.test(designType) ? 'logo' : 'design';
  }

  function getLedgerToySeriesKey(record) {
    if (!record || record.status === '作废' || record.performanceGroupId || record.performanceType === 'extension' || isLedgerSeriesExcluded(record)) return '';
    const cached = normalizeData(loadData(record.sku) || {});
    const toyData = { ...cached, brand: record.brand || cached.brand || '', name: record.name || cached.name || '', isToy: record.isToy };
    // Reuse the smart toy-copywriting classification as well: it includes PLM
    // category fields that are not present in the dimension-only toy check.
    if (!record.isToy && !isToyDimensionProduct(toyData) && !isToyCopywritingProduct(toyData)) return '';
    const name = cleanName(record.name || cached.name || '').replace(/\s+/g, ' ').trim();
    const match = name.match(/^(.+?)[\-－–—_](?:\s*.+)$/);
    const root = cleanName(match ? match[1] : '').replace(/\s+/g, ' ').trim();
    return root.length >= 3 ? root : '';
  }

  function getLedgerSkuSortValue(sku) {
    const match = String(sku || '').match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function getLedgerSeriesGroupId(seriesKey, part) {
    let hash = 0;
    for (let index = 0; index < seriesKey.length; index += 1) hash = ((hash * 31) + seriesKey.charCodeAt(index)) >>> 0;
    return 'auto-series-' + hash.toString(36) + '-' + String(part);
  }

  function getLedgerAutomaticSeriesGroups(records) {
    const bySeries = new Map();
    (records || []).forEach((record) => {
      const seriesKey = getLedgerToySeriesKey(record);
      if (!seriesKey) return;
      if (!bySeries.has(seriesKey)) bySeries.set(seriesKey, []);
      bySeries.get(seriesKey).push(record);
    });
    const groups = [];
    bySeries.forEach((items, seriesKey) => {
      if (items.length < 2) return;
      items.sort((a, b) => getLedgerSkuSortValue(a.sku) - getLedgerSkuSortValue(b.sku) || String(a.sku || '').localeCompare(String(b.sku || '')));
      for (let offset = 0, part = 1; offset < items.length; offset += 5, part += 1) {
        const members = items.slice(offset, offset + 5);
        groups.push({
          id: getLedgerSeriesGroupId(seriesKey, part),
          source: 'auto-series',
          seriesKey,
          kind: 'series',
          points: 1,
          records: members,
          recordKeys: members.map(getLedgerSelectionKey),
          skus: members.map((record) => String(record.sku || '')).filter(Boolean),
        });
      }
    });
    return groups;
  }

  function getLedgerManualSeriesGroupId(groupId, part) {
    const source = String(groupId || '');
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) hash = ((hash * 31) + source.charCodeAt(index)) >>> 0;
    return 'manual-series-' + hash.toString(36) + '-' + String(part);
  }

  function getLedgerManualSeriesGroups(records) {
    const byGroup = new Map();
    (records || []).forEach((record) => {
      const groupId = String(record && record.performanceGroupId || '').trim();
      const isLegacyManualGroup = /^performance-manual-/.test(groupId);
      if (!groupId || (record.performanceGroupMode !== 'series' && !isLegacyManualGroup)) return;
      if (!byGroup.has(groupId)) byGroup.set(groupId, []);
      byGroup.get(groupId).push(record);
    });
    const groups = [];
    byGroup.forEach((items, groupId) => {
      items.sort((a, b) => getLedgerSkuSortValue(a.sku) - getLedgerSkuSortValue(b.sku) || String(a.sku || '').localeCompare(String(b.sku || '')));
      for (let offset = 0, part = 1; offset < items.length; offset += 5, part += 1) {
        const members = items.slice(offset, offset + 5);
        groups.push({
          id: getLedgerManualSeriesGroupId(groupId, part),
          source: 'manual-series',
          seriesKey: '手动按编码',
          kind: 'series',
          points: 1,
          records: members,
          recordKeys: members.map(getLedgerSelectionKey),
          skus: members.map((record) => String(record.sku || '')).filter(Boolean),
        });
      }
    });
    return groups;
  }

  function summarizeLedgerPerformance(records) {
    const summary = { design: 0, logo: 0, void: 0, extension: 0, series: 0, mergedGroups: 0, autoSeriesGroups: 0, groups: [], total: 0 };
    const units = new Map();
    const weight = { extension: 3, void: 5, logo: 10, design: 14 };
    const manualSeriesGroups = getLedgerManualSeriesGroups(records);
    const automaticGroups = getLedgerAutomaticSeriesGroups(records);
    const groupedRecordKeys = new Set(manualSeriesGroups.concat(automaticGroups).flatMap((group) => group.recordKeys));
    (records || []).forEach((record, index) => {
      if (groupedRecordKeys.has(getLedgerSelectionKey(record))) return;
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
          source: 'manual',
          kind: unit.kind,
          points: weight[unit.kind] / 10,
          recordKeys: unit.records.map(getLedgerSelectionKey),
          skus: unit.records.map((record) => String(record && record.sku || '')).filter(Boolean),
        });
      }
    });
    manualSeriesGroups.forEach((group) => {
      summary.series += 1;
      summary.groups.push(group);
    });
    automaticGroups.forEach((group) => {
      summary.series += 1;
      summary.autoSeriesGroups += 1;
      summary.groups.push(group);
    });
    summary.total = (summary.design * 14 + summary.logo * 10 + summary.void * 5 + summary.extension * 3) / 10 + summary.series;
    return summary;
  }

  function formatLedgerPerformance(value) {
    const number = Math.round((Number(value) || 0) * 10) / 10;
    return Number.isInteger(number) ? String(number) : number.toFixed(1);
  }

  function getLedgerTodayPerformanceSummary() {
    const todayKey = getTodayKey();
    const records = getLedgerRecordsForMonth('finalized', getMonthKeyFromDateKey(todayKey))
      .filter((record) => getLedgerFinalizedDate(record) === todayKey);
    return { summary: summarizeLedgerPerformance(records), count: records.length };
  }

  function ledgerPerformanceHtml(summary, todayValue) {
    const value = summary || summarizeLedgerPerformance([]);
    const today = todayValue || getLedgerTodayPerformanceSummary();
    const breakdown = '设计 ' + value.design + ' × 1.4 · 换/无 Logo ' + value.logo + ' × 1 · 作废 ' + value.void + ' × 0.5 · 延伸 ' + value.extension + ' × 0.3 · 系列编组 ' + value.series + ' × 1（每 5 个）';
    const kindLabels = { design: '设计 1.4 分', logo: '换/无 Logo 1 分', void: '作废 0.5 分', extension: '延伸 0.3 分' };
    const groups = Array.isArray(value.groups) ? value.groups : [];
    const groupHtml = groups.length
      ? '<details class="pfh-ledger-merge-groups"><summary>绩效分组 ' + escapeHtml(String(groups.length)) + ' 组，点击展开组合明细</summary><div class="pfh-ledger-merge-list">' +
        groups.map((group) => {
          const isSeriesGroup = group.source === 'auto-series' || group.source === 'manual-series';
          const seriesLabel = group.source === 'manual-series' ? '手动系列' : '玩具系列';
          const title = isSeriesGroup
            ? getLedgerPerformanceGroupLabel(group, groups) + ' · ' + seriesLabel + ' 1 分 · ' + String((group.skus || []).length) + ' 个'
            : getLedgerPerformanceGroupLabel(group, groups) + ' · ' + (kindLabels[group.kind] || '');
          return '<button type="button" class="pfh-ledger-merge-group" data-action="ledger-highlight-performance-group" data-group-id="' + escapeHtml(group.id) + '" title="高亮这一组的产品卡片"><b>' + escapeHtml(title) + '</b><span>' + escapeHtml((group.seriesKey ? group.seriesKey + '：' : '') + (group.skus || []).join(' + ')) + '</span></button>';
        }).join('') +
        '</div></details>'
      : '';
    return '<div class="pfh-ledger-performance" aria-live="polite"><div class="pfh-ledger-performance-scores"><div class="pfh-ledger-performance-summary is-today"><div><span>当天绩效</span><small>今天已定稿 ' + escapeHtml(String(today.count || 0)) + ' 条</small></div><strong>' + escapeHtml(formatLedgerPerformance(today.summary && today.summary.total)) + '</strong></div><div class="pfh-ledger-performance-summary"><div><span>当月总绩效</span><small>' + escapeHtml(breakdown) + '</small></div><strong>' + escapeHtml(formatLedgerPerformance(value.total)) + '</strong></div></div>' + groupHtml + '</div>';
  }

  function refreshLedgerPerformanceSummary() {
    if (state.view !== 'ledger' || state.ledgerView !== 'finalized') return;
    const panel = document.getElementById(PANEL_ID);
    const current = panel && panel.querySelector('.pfh-ledger-performance');
    if (!current) return;
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    current.outerHTML = ledgerPerformanceHtml(summarizeLedgerPerformance(records), getLedgerTodayPerformanceSummary());
  }

  function getLedgerPerformanceGroupLabel(group, groups) {
    const source = group && (group.source === 'auto-series' || group.source === 'manual-series') ? group.source : 'manual';
    const position = (groups || []).filter((item) => {
      const itemSource = item && (item.source === 'auto-series' || item.source === 'manual-series') ? item.source : 'manual';
      return itemSource === source;
    }).indexOf(group) + 1;
    return source === 'auto-series' ? '自动系列 ' + position : (source === 'manual-series' ? '手动系列 ' + position : '合并组 ' + position);
  }

  function getLedgerPerformanceGroupMaps(summary) {
    const labels = new Map();
    const recordGroupIds = new Map();
    const groups = summary && summary.groups || [];
    groups.forEach((group) => {
      const label = getLedgerPerformanceGroupLabel(group, groups);
      labels.set(group.id, label);
      (group.recordKeys || []).forEach((key) => recordGroupIds.set(key, group.id));
    });
    return { labels, recordGroupIds };
  }

  function isLedgerSeriesExcluded(record) {
    const sku = String(record && record.sku || '').trim().toUpperCase();
    return Boolean(record && record.seriesExcluded) || Boolean(sku && state.ledgerSeriesExcludedSkus && state.ledgerSeriesExcludedSkus.has(sku));
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
    return '<span class="pfh-ledger-performance-merge-actions" style="display:contents">' +
      '<button type="button" class="pfh-ledger-performance-merge" data-action="' + (canUnmerge ? 'ledger-performance-unmerge' : 'ledger-performance-merge') + '" title="' + (canUnmerge ? '取消选中编码的绩效合并' : '将选中的多个编码合并为一个绩效单位') + '"' + (disabled ? ' disabled' : '') + '>' + (canUnmerge ? '取消合并' : '合并绩效') + '</button>' +
      '<button type="button" class="pfh-ledger-performance-merge" data-action="ledger-performance-group-open" title="不看产品名，按输入的 SKU 编码直接编组">按编码编组</button>' +
      '</span>';
  }

  function refreshLedgerPerformanceMergeButton() {
    if (state.view !== 'ledger' || state.ledgerView !== 'finalized') return;
    const panel = document.getElementById(PANEL_ID);
    const current = panel && panel.querySelector('.pfh-ledger-performance-merge-actions');
    if (!current) return;
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    current.outerHTML = ledgerPerformanceMergeButtonHtml(records, new Set(state.ledgerSelectedKeys || []));
  }

  function getLedgerPerformanceGroupInputSummary(value) {
    const rawSkus = extractManualSkuCodes(value);
    const requested = rawSkus.slice(0, LEDGER_PERFORMANCE_GROUP_MAX_ITEMS);
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    const bySku = new Map();
    records.forEach((record) => {
      const sku = getLedgerSkuKey(record && record.sku);
      if (sku && !bySku.has(sku)) bySku.set(sku, record);
    });
    const matched = [];
    const missing = [];
    requested.forEach((sku) => {
      const record = bySku.get(getLedgerSkuKey(sku));
      if (record) matched.push(record);
      else missing.push(sku);
    });
    return { requested, matched, missing, truncated: rawSkus.length > requested.length };
  }

  function ledgerPerformanceGroupPreviewText(summary) {
    const value = summary || { requested: [], matched: [], missing: [], truncated: false };
    if (!value.requested.length) return '等待输入 SKU 编码';
    let text = '已识别 ' + value.requested.length + ' 个，当前月份已定稿匹配 ' + value.matched.length + ' 个';
    if (value.missing.length) text += '，未找到 ' + value.missing.length + ' 个';
    if (value.truncated) text += '（最多处理 ' + LEDGER_PERFORMANCE_GROUP_MAX_ITEMS + ' 个）';
    return text;
  }

  function refreshLedgerPerformanceGroupPreview(layer) {
    if (!layer) return;
    const input = layer.querySelector('.pfh-ledger-performance-group-input');
    const summary = getLedgerPerformanceGroupInputSummary(input ? input.value : state.ledgerPerformanceGroupInput);
    const summaryNode = layer.querySelector('[data-ledger-performance-group-summary]');
    const detailNode = layer.querySelector('[data-ledger-performance-group-detail]');
    const submit = layer.querySelector('[data-action="ledger-performance-group-submit"]');
    if (summaryNode) summaryNode.textContent = ledgerPerformanceGroupPreviewText(summary);
    if (detailNode) {
      detailNode.textContent = summary.missing.length
        ? '未找到：' + summary.missing.join('、')
        : (summary.matched.length ? '将按编码归为同一个绩效单位，不读取产品名。' : '只匹配当前月份已定稿记录，产品名称不参与判断。');
      detailNode.title = summary.missing.join('、');
    }
    if (submit) submit.disabled = summary.matched.length < 2;
  }

  function ledgerPerformanceGroupModalHtml() {
    if (!state.ledgerPerformanceGroupOpen) return '';
    const summary = getLedgerPerformanceGroupInputSummary(state.ledgerPerformanceGroupInput);
    const status = state.ledgerPerformanceGroupStatus || '按当前月份已定稿记录匹配；系列名称不规则也可以直接编组。';
    return '<div class="pfh-ledger-time-modal pfh-ledger-performance-group-modal" data-action="ledger-performance-group-close" role="dialog" aria-modal="true" aria-label="按编码编组">' +
      '<div class="pfh-ledger-time-card" style="width:min(100%,520px)!important;max-height:calc(100% - 8px)!important;overflow:auto!important;">' +
        '<div class="pfh-ledger-time-head"><div><b>按编码编组</b><span>' + escapeHtml(getCurrentLedgerMonth()) + ' · 不依赖产品名称规则</span></div><button type="button" data-action="ledger-performance-group-close" aria-label="关闭">×</button></div>' +
        '<div class="pfh-ledger-performance-group-fields" style="display:flex!important;flex-direction:column!important;gap:8px!important;margin:16px 0 10px!important;">' +
          '<label style="display:grid!important;gap:6px!important;color:#73708d;font-size:11px;">产品编码（每行一个，也支持空格、逗号、分号）<textarea class="pfh-ledger-performance-group-input" rows="8" placeholder="例如：SKU00046398\nSKU00046397\nSKU00046396" style="width:100%;min-height:170px;resize:vertical;padding:10px;border:1px solid rgba(167,139,250,.32);border-radius:10px;outline:0;background:#fff;color:#30285e;font:inherit;font-size:12px;line-height:1.5;">' + escapeHtml(state.ledgerPerformanceGroupInput || '') + '</textarea></label>' +
          '<div style="display:grid;gap:4px;padding:8px 10px;border-radius:10px;background:rgba(240,237,255,.72);color:#6f6690;font-size:10px;line-height:1.45;"><strong data-ledger-performance-group-summary style="color:#5e36cc;font-size:11px;">' + escapeHtml(ledgerPerformanceGroupPreviewText(summary)) + '</strong><small data-ledger-performance-group-detail title="' + escapeHtml(summary.missing.join('、')) + '">' + escapeHtml(summary.missing.length ? '未找到：' + summary.missing.join('、') : (summary.matched.length ? '将按编码归为同一个绩效单位，不读取产品名。' : '只匹配当前月份已定稿记录，产品名称不参与判断。')) + '</small></div>' +
          '<p data-ledger-performance-group-status title="' + escapeHtml(status) + '" style="margin:0;color:#8d8aa8;font-size:10px;line-height:1.45;">' + escapeHtml(status) + '</p>' +
        '</div>' +
        '<div class="pfh-ledger-time-actions"><button type="button" data-action="ledger-performance-group-close">取消</button><button type="button" class="is-primary" data-action="ledger-performance-group-submit"' + (summary.matched.length < 2 ? ' disabled' : '') + '>确定编组</button></div>' +
      '</div></div>';
  }

  function getLedgerWorkflowFilterForMode(mode) {
    const value = String(state.ledgerFilterWorkflow || 'all');
    const allowed = mode === 'design'
      ? ['all', 'not-generated', 'generated-not-finalized']
      : (mode === 'finalized' ? ['all', 'box-pending', 'label-pending', 'image-pack-pending', 'any-file-pending'] : ['all']);
    return allowed.includes(value) ? value : 'all';
  }

  function ledgerWorkflowFilterHtml(mode) {
    if (mode === 'trash') return '';
    const selected = getLedgerWorkflowFilterForMode(mode);
    const options = mode === 'design'
      ? [
        ['all', '全部待定稿'],
        ['not-generated', '未出图'],
        ['generated-not-finalized', '出图未定稿'],
      ]
      : [
        ['image-pack-pending', '图包未做'],
        ['all', '全部已定稿'],
        ['box-pending', '纸盒未做'],
        ['label-pending', '标签未做'],
        ['any-file-pending', '任一文件未做'],
      ];
    return '<select class="pfh-ledger-filter-workflow" aria-label="' + escapeHtml(mode === 'design' ? '出图流程筛选' : '文件制作筛选') + '">' + options.map(([value, label]) => '<option value="' + escapeHtml(value) + '"' + (selected === value ? ' selected' : '') + '>' + escapeHtml(label) + '</option>').join('') + '</select>';
  }

  function isLedgerFilePending(value, doneFallback) {
    return normalizeLedgerFileState(value, doneFallback) === 'pending';
  }

  function matchesLedgerWorkflowFilter(record, mode, filter) {
    if (filter === 'all') return true;
    if (mode === 'design') {
      const imageGenerated = Boolean(record && record.imageGeneratedAt);
      return filter === 'not-generated' ? !imageGenerated : (filter === 'generated-not-finalized' ? imageGenerated : true);
    }
    if (mode !== 'finalized') return true;
    if (filter === 'box-pending') return isLedgerFilePending(record && record.boxFileState, record && record.boxFileDone);
    if (filter === 'label-pending') return isLedgerFilePending(record && record.labelFileState, record && record.labelFileDone);
    if (filter === 'image-pack-pending') return isLedgerFilePending(record && record.imagePackState, record && record.imagePackDone);
    if (filter === 'any-file-pending') return [['boxFileState', 'boxFileDone'], ['labelFileState', 'labelFileDone'], ['imagePackState', 'imagePackDone']].some(([field, doneField]) => isLedgerFilePending(record && record[field], record && record[doneField]));
    return true;
  }

  function getLedgerStatusFilterForMode(mode) {
    const value = String(state.ledgerFilterStatus || 'all');
    const allowed = mode === 'design'
      ? ['all', '待出图', '待定稿', '异常', 'ai-error']
      : (mode === 'finalized' ? ['all', '已定稿', '已完成', '作废', '异常', 'ai-error'] : ['all', '异常', 'ai-error']);
    return allowed.includes(value) ? value : 'all';
  }

  function ledgerStatusFilterHtml(mode) {
    const selected = getLedgerStatusFilterForMode(mode);
    const options = mode === 'design'
      ? [['all', '全部状态'], ['待出图', '待出图'], ['待定稿', '待定稿'], ['异常', '异常'], ['ai-error', 'AI 异常']]
      : (mode === 'finalized'
        ? [['all', '全部状态'], ['已定稿', '已定稿'], ['已完成', '已完成'], ['作废', '作废'], ['异常', '异常'], ['ai-error', 'AI 异常']]
        : [['all', '全部状态'], ['待出图', '待出图'], ['待定稿', '待定稿'], ['已定稿', '已定稿'], ['已完成', '已完成'], ['异常', '异常'], ['ai-error', 'AI 异常']]);
    return '<select class="pfh-ledger-filter-status" aria-label="状态筛选">' + options.map(([value, label]) => '<option value="' + escapeHtml(value) + '"' + (selected === value ? ' selected' : '') + '>' + escapeHtml(label) + '</option>').join('') + '</select>';
  }

  function filterLedgerWorkbenchRecords(records, mode) {
    const query = String(state.ledgerFilterQuery || '').trim().toLowerCase();
    const tokens = parseSearchTokens(query);
    const statusFilter = getLedgerStatusFilterForMode(mode);
    const imageFilter = String(state.ledgerFilterImage || 'all');
    const workflowFilter = getLedgerWorkflowFilterForMode(mode);
    return (records || []).filter((record) => {
      if (tokens.length) {
        const haystack = [record.sku, record.brand, record.name, record.designType, record.artPriority, record.packageCode, record.printCode, record.developerName].filter(Boolean).join(' ').toLowerCase();
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }
      const finalized = isLedgerFinalizedRecord(record);
      const imageGenerated = Boolean(record.imageGeneratedAt);
      const workflow = /^(?:作废|已完成|异常)$/.test(record.status || '') ? record.status : (finalized ? '已定稿' : (imageGenerated ? '待定稿' : '待出图'));
      if (statusFilter !== 'all') {
        if (statusFilter === 'ai-error') {
          if (!/^(?:error|needs-|task-error|result-missing)/.test(normalizeLedgerAiImageStatus(record.aiImageStatus, record.aiImageMessage))) return false;
        } else if (workflow !== statusFilter) return false;
      }
      if (!matchesLedgerWorkflowFilter(record, mode, workflowFilter)) return false;
      const preferredImage = mode === 'design' ? record.benchmarkImageUrl : record.skuImageUrl;
      if (imageFilter === 'benchmark' && !record.benchmarkImageUrl) return false;
      if (imageFilter === 'effect' && !record.skuImageUrl) return false;
      if (imageFilter === 'missing' && preferredImage) return false;
      return true;
    });
  }

  function ledgerTableRowsHtml(records, mode) {
    if (!records.length) return '<div class="pfh-ledger-empty">当前筛选条件下没有记录。</div>';
    const rows = records.map((record) => {
      const finalized = isLedgerFinalizedRecord(record);
      const workflow = /^(?:作废|已完成|异常)$/.test(record.status || '') ? record.status : (finalized ? '已定稿' : (record.imageGeneratedAt ? '待定稿' : '待出图'));
      const ai = getLedgerAiImageStatusMeta(record).label;
      const date = mode === 'finalized' ? getLedgerFinalizedDate(record) : getLedgerDesignDate(record);
      return '<tr><td class="pfh-ledger-table-sku-cell"><button type="button" class="pfh-ledger-table-sku" data-action="ledger-copy-sku" data-ledger-table-sku="' + escapeHtml(record.sku) + '" data-sku="' + escapeHtml(record.sku) + '" title="单击复制；按住并向下拖可连续复制编码">' + escapeHtml(record.sku) + '</button></td><td>' + escapeHtml([record.brand, record.name].filter(Boolean).join(' ')) + '</td><td>' + escapeHtml(record.designType || '') + '</td><td>' + escapeHtml(record.artPriority || '') + '</td><td>' + escapeHtml(workflow) + '</td><td>' + escapeHtml(date || '') + '</td><td>' + escapeHtml(record.purchasePrice || '') + '</td><td>' + escapeHtml(ledgerFileStateLabel(record.boxFileState)) + '</td><td>' + escapeHtml(ledgerFileStateLabel(record.labelFileState)) + '</td><td>' + escapeHtml(ledgerFileStateLabel(record.imagePackState)) + '</td><td>' + escapeHtml(ai) + '</td></tr>';
    }).join('');
    return '<div class="pfh-ledger-table-wrap"><table class="pfh-ledger-table"><thead><tr><th>SKU</th><th>产品</th><th>设计类型</th><th>优先级</th><th>状态</th><th>日期</th><th>价格</th><th>纸盒</th><th>标签</th><th>图包</th><th>AI 生图</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function getVisibleLedgerWorkbenchRecords() {
    const mode = state.ledgerView === 'trash' ? 'trash' : (state.ledgerView === 'finalized' ? 'finalized' : 'design');
    return filterLedgerWorkbenchRecords(getLedgerRecordsForMonth(state.ledgerView, getCurrentLedgerMonth()), mode);
  }

  function copyLedgerWorkbenchTable(asTsv) {
    const records = getVisibleLedgerWorkbenchRecords();
    const text = asTsv
      ? ['SKU\t产品\t设计类型\t优先级\t状态\t日期\t价格\t纸盒\t标签\t图包\tAI生图'].concat(records.map((record) => [record.sku, [record.brand, record.name].filter(Boolean).join(' '), record.designType || '', record.artPriority || '', record.status || '', state.ledgerView === 'finalized' ? getLedgerFinalizedDate(record) : getLedgerDesignDate(record), record.purchasePrice || '', ledgerFileStateLabel(record.boxFileState), ledgerFileStateLabel(record.labelFileState), ledgerFileStateLabel(record.imagePackState), getLedgerAiImageStatusMeta(record).label].join('\t'))).join('\n')
      : records.map((record) => record.sku).filter(Boolean).join('\n');
    copyText(text);
    showToast('已复制 ' + records.length + ' 条' + (asTsv ? '表格' : '编码'));
  }

  let ledgerTableSkuDragSession = null;

  function getLedgerTableSkuButtonAtPoint(clientX, clientY, wrapper) {
    const hit = document.elementFromPoint(clientX, clientY);
    const row = hit && hit.closest && hit.closest('.pfh-ledger-table tbody tr');
    const button = row && row.querySelector('.pfh-ledger-table-sku[data-ledger-table-sku]');
    return button && wrapper && wrapper.contains(button) ? button : null;
  }

  function ensureLedgerTableSkuDragTip(panel) {
    let tip = panel && panel.querySelector('.pfh-ledger-drag-copy-tip');
    if (!tip && panel) {
      tip = document.createElement('div');
      tip.className = 'pfh-ledger-drag-copy-tip';
      tip.setAttribute('aria-hidden', 'true');
      (panel.querySelector('.pfh-full') || panel).appendChild(tip);
    }
    return tip;
  }

  function updateLedgerTableSkuDragSelection(button, clientX, clientY) {
    const session = ledgerTableSkuDragSession;
    if (!session || !button) return;
    const currentIndex = session.buttons.indexOf(button);
    if (currentIndex < 0) return;
    const distance = Math.hypot(clientX - session.startX, clientY - session.startY);
    if (currentIndex !== session.startIndex || distance >= 6) session.active = true;
    if (!session.active) return;
    const lower = Math.min(session.startIndex, currentIndex);
    const upper = Math.max(session.startIndex, currentIndex);
    session.selectedButtons = session.buttons.slice(lower, upper + 1);
    session.buttons.forEach((item, index) => item.classList.toggle('is-drag-selected', index >= lower && index <= upper));
    session.panel.classList.add('is-ledger-sku-dragging');
    const tip = ensureLedgerTableSkuDragTip(session.panel);
    if (tip) {
      tip.textContent = '松开复制 ' + session.selectedButtons.length + ' 个编码';
      tip.style.left = Math.min(window.innerWidth - 142, clientX + 14) + 'px';
      tip.style.top = Math.min(window.innerHeight - 36, clientY + 14) + 'px';
      tip.classList.add('is-visible');
    }
  }

  function runLedgerTableSkuAutoScroll() {
    const session = ledgerTableSkuDragSession;
    if (!session || !session.autoScrollSpeed) return;
    session.wrapper.scrollTop += session.autoScrollSpeed;
    const button = getLedgerTableSkuButtonAtPoint(session.clientX, session.clientY, session.wrapper);
    if (button) updateLedgerTableSkuDragSelection(button, session.clientX, session.clientY);
    session.autoScrollFrame = window.requestAnimationFrame(runLedgerTableSkuAutoScroll);
  }

  function handleLedgerTableSkuPointerDown(event) {
    if (state.view !== 'ledger' || state.ledgerDisplayMode !== 'table' || event.button !== 0) return;
    const button = event.target && event.target.closest && event.target.closest('.pfh-ledger-table-sku[data-ledger-table-sku]');
    const wrapper = button && button.closest('.pfh-ledger-table-wrap');
    if (!button || !wrapper) return;
    const buttons = Array.from(wrapper.querySelectorAll('.pfh-ledger-table-sku[data-ledger-table-sku]'));
    const startIndex = buttons.indexOf(button);
    if (startIndex < 0) return;
    resetLedgerTableSkuDrag(false);
    ledgerTableSkuDragSession = {
      pointerId: event.pointerId,
      panel: event.currentTarget,
      wrapper,
      button,
      buttons,
      startIndex,
      startX: event.clientX,
      startY: event.clientY,
      clientX: event.clientX,
      clientY: event.clientY,
      selectedButtons: [button],
      active: false,
      autoScrollSpeed: 0,
      autoScrollFrame: 0,
    };
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
  }

  function handleLedgerTableSkuPointerMove(event) {
    const session = ledgerTableSkuDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    session.clientX = event.clientX;
    session.clientY = event.clientY;
    const button = getLedgerTableSkuButtonAtPoint(event.clientX, event.clientY, session.wrapper);
    if (button) updateLedgerTableSkuDragSelection(button, event.clientX, event.clientY);
    const rect = session.wrapper.getBoundingClientRect();
    const edge = 42;
    session.autoScrollSpeed = event.clientY > rect.bottom - edge ? Math.min(18, Math.max(4, (event.clientY - rect.bottom + edge) * 0.45))
      : (event.clientY < rect.top + edge ? -Math.min(18, Math.max(4, (rect.top + edge - event.clientY) * 0.45)) : 0);
    if (session.autoScrollSpeed && !session.autoScrollFrame) session.autoScrollFrame = window.requestAnimationFrame(runLedgerTableSkuAutoScroll);
    if (!session.autoScrollSpeed && session.autoScrollFrame) {
      window.cancelAnimationFrame(session.autoScrollFrame);
      session.autoScrollFrame = 0;
    }
    if (session.active) event.preventDefault();
  }

  function handleLedgerTableSkuPointerEnd(event) {
    const session = ledgerTableSkuDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    const active = session.active && session.selectedButtons.length > 1;
    const skus = active ? session.selectedButtons.map((button) => button.getAttribute('data-ledger-table-sku') || '').filter(Boolean) : [];
    try { session.button.releasePointerCapture(event.pointerId); } catch (_) {}
    resetLedgerTableSkuDrag(false);
    if (!active || !skus.length) return;
    event.preventDefault();
    state.ledgerSkuDragSuppressClickUntil = Date.now() + 700;
    copyText(skus.join('\n'));
    showToast('已连续复制 ' + skus.length + ' 个编码');
  }

  function resetLedgerTableSkuDrag(clearSuppressClick) {
    const session = ledgerTableSkuDragSession;
    if (session && session.autoScrollFrame) window.cancelAnimationFrame(session.autoScrollFrame);
    ledgerTableSkuDragSession = null;
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      panel.classList.remove('is-ledger-sku-dragging');
      panel.querySelectorAll('.pfh-ledger-table-sku.is-drag-selected').forEach((button) => button.classList.remove('is-drag-selected'));
      const tip = panel.querySelector('.pfh-ledger-drag-copy-tip');
      if (tip) tip.remove();
    }
    if (clearSuppressClick) state.ledgerSkuDragSuppressClickUntil = 0;
  }

  let ledgerCardSelectionDragSession = null;

  function getLedgerCardSelectionKey(card) {
    if (!card) return '';
    return getLedgerSelectionKey({
      sku: card.getAttribute('data-ledger-sku') || '',
      date: normalizeLedgerDate(card.getAttribute('data-ledger-date') || ''),
    });
  }

  function getLedgerCardAtPoint(clientX, clientY, wrapper) {
    const hit = document.elementFromPoint(clientX, clientY);
    const card = hit && hit.closest && hit.closest('.pfh-ledger-item.is-clickable[data-ledger-sku]');
    return card && wrapper && wrapper.contains(card) ? card : null;
  }

  function syncLedgerCardSelectionClasses(panel) {
    if (!panel) return;
    const selected = new Set(state.ledgerSelectedKeys || []);
    panel.querySelectorAll('.pfh-ledger-item.is-clickable[data-ledger-sku]').forEach((card) => {
      const isSelected = selected.has(getLedgerCardSelectionKey(card));
      card.classList.toggle('is-selected', isSelected);
      card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }

  function updateLedgerCardSelectionRange(card, clientX, clientY) {
    const session = ledgerCardSelectionDragSession;
    if (!session || !card) return;
    const currentIndex = session.cards.indexOf(card);
    if (currentIndex < 0) return;
    const distance = Math.hypot(clientX - session.startX, clientY - session.startY);
    if (currentIndex !== session.startIndex || distance >= 6) session.active = true;
    if (!session.active) return;
    const lower = Math.min(session.startIndex, currentIndex);
    const upper = Math.max(session.startIndex, currentIndex);
    const selected = new Set(session.baseSelectedKeys);
    session.cards.slice(lower, upper + 1).forEach((item) => {
      const key = getLedgerCardSelectionKey(item);
      if (key) selected.add(key);
      if (key && session.selectionMode === 'remove') selected.delete(key);
    });
    state.ledgerSelectedKeys = Array.from(selected);
    syncLedgerCardSelectionClasses(session.panel);
    session.panel.classList.add('is-ledger-card-dragging');
  }

  function handleLedgerCardSelectionPointerDown(event) {
    if (state.view !== 'ledger' || state.ledgerDisplayMode !== 'cards' || state.ledgerView === 'trash' || event.button !== 0) return;
    const card = event.target && event.target.closest && event.target.closest('.pfh-ledger-item.is-clickable[data-ledger-sku]');
    const interactive = event.target && event.target.closest && event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"]');
    const wrapper = card && card.closest('.pfh-ledger-list');
    if (!card || interactive || !wrapper) return;
    const cards = Array.from(wrapper.querySelectorAll('.pfh-ledger-item.is-clickable[data-ledger-sku]'));
    const startIndex = cards.indexOf(card);
    if (startIndex < 0) return;
    resetLedgerCardSelectionDrag();
    ledgerCardSelectionDragSession = {
      pointerId: event.pointerId,
      panel: event.currentTarget,
      wrapper,
      card,
      cards,
      startIndex,
      startX: event.clientX,
      startY: event.clientY,
      baseSelectedKeys: new Set(state.ledgerSelectedKeys || []),
      selectionMode: (state.ledgerSelectedKeys || []).includes(getLedgerCardSelectionKey(card)) ? 'remove' : 'add',
      active: false,
    };
    try { card.setPointerCapture(event.pointerId); } catch (_) {}
  }

  function handleLedgerCardSelectionPointerMove(event) {
    const session = ledgerCardSelectionDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    const card = getLedgerCardAtPoint(event.clientX, event.clientY, session.wrapper);
    if (card) updateLedgerCardSelectionRange(card, event.clientX, event.clientY);
    if (session.active) event.preventDefault();
  }

  function handleLedgerCardSelectionPointerEnd(event) {
    const session = ledgerCardSelectionDragSession;
    if (!session || event.pointerId !== session.pointerId) return;
    const active = session.active;
    try { session.card.releasePointerCapture(event.pointerId); } catch (_) {}
    resetLedgerCardSelectionDrag();
    if (!active) return;
    event.preventDefault();
    state.ledgerSkuDragSuppressClickUntil = Date.now() + 700;
    refreshLedgerPerformanceMergeButton();
  }

  function resetLedgerCardSelectionDrag() {
    const session = ledgerCardSelectionDragSession;
    ledgerCardSelectionDragSession = null;
    const panel = session && session.panel || document.getElementById(PANEL_ID);
    if (panel) panel.classList.remove('is-ledger-card-dragging');
  }

  function getLedgerThumbnailUrl(url) {
    const source = String(url || '').trim();
    if (!source) return '';
    try {
      const parsed = new URL(source, window.location.origin);
      const hostname = String(parsed.hostname || '').toLowerCase();
      const isOssHost = hostname === 'oss-pro.plm.westmonth.cn'
        || hostname === 'oss-cn-shenzhen.aliyuncs.com'
        || hostname.endsWith('.oss-cn-shenzhen.aliyuncs.com');
      if (!/^https?:$/.test(parsed.protocol) || !isOssHost) return source;
      if (/(?:^|&)(?:ossaccesskeyid|signature|expires|x-oss-signature|x-oss-credential|x-oss-security-token)=/i.test(parsed.search.slice(1))) return source;
      parsed.searchParams.delete('x-oss-process');
      parsed.searchParams.set('x-oss-process', 'image/resize,w_240/quality,q_80');
      return parsed.href;
    } catch (_) {
      return source;
    }
  }

  function ledgerSelectionToolbarHtml(records, selectedKeys) {
    const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
    const visibleRecords = Array.isArray(records) ? records : [];
    const selectedCount = visibleRecords.filter((record) => selected.has(getLedgerSelectionKey(record))).length;
    const total = visibleRecords.length;
    return '<span class="pfh-ledger-selection-count" aria-live="polite" title="选中多个产品后，点击任一卡片的纸盒、标签或图包按钮，会同步对应状态">已选 ' + escapeHtml(String(selectedCount)) + ' / ' + escapeHtml(String(total)) + '</span>' +
      '<button type="button" data-action="ledger-select-all"' + (total ? '' : ' disabled') + '>全选</button>' +
      '<button type="button" data-action="ledger-clear-selection"' + (selected.size ? '' : ' disabled') + '>取消全选</button>';
  }

  function ledgerViewContentHtml(records) {
    if (state.ledgerView === 'canvas') return ledgerCanvasViewHtml();
    const mode = state.ledgerView === 'trash' ? 'trash' : (state.ledgerView === 'finalized' ? 'finalized' : 'design');
    const filteredRecords = filterLedgerWorkbenchRecords(records, mode);
    const groups = groupLedgerRecordsByDate(filteredRecords, mode === 'trash' ? 'design' : mode);
    const performanceSummary = mode === 'finalized' ? summarizeLedgerPerformance(filteredRecords) : null;
    const performanceHtml = performanceSummary ? ledgerPerformanceHtml(performanceSummary, getLedgerTodayPerformanceSummary()) : '';
    const performanceGroupMaps = getLedgerPerformanceGroupMaps(performanceSummary);
    const selectedKeys = new Set(state.ledgerSelectedKeys || []);
    const mergePerformanceHtml = mode === 'finalized' ? ledgerPerformanceMergeButtonHtml(records, selectedKeys) : '';
    const selectionToolbarHtml = mode === 'finalized' ? ledgerSelectionToolbarHtml(filteredRecords, selectedKeys) : '';
    const rows = groups.length ? groups.map((group) => {
      const allSelected = mode === 'finalized' && group.items.length && group.items.every((record) => selectedKeys.has(getLedgerSelectionKey(record)));
      const daySelect = mode === 'finalized' ? '<button type="button" class="pfh-ledger-day-select' + (allSelected ? ' is-selected' : '') + '" data-action="ledger-select-date" data-date="' + escapeHtml(group.date) + '">' + (allSelected ? '取消当天' : '选择当天') + '</button>' : '';
      return '<section class="pfh-ledger-day"><h4><span class="pfh-ledger-day-date">' + escapeHtml(formatLedgerDateLabel(group.date)) + '</span><span class="pfh-ledger-day-count">' + escapeHtml(String(group.items.length)) + ' 条</span>' + daySelect + '</h4>' + group.items.map((record) => mode === 'trash' ? ledgerTrashRowHtml(record) : ledgerRowHtml(record, mode, performanceGroupMaps.labels, performanceGroupMaps.recordGroupIds)).join('') + '</section>';
    }).join('') : '<div class="pfh-ledger-empty">' + escapeHtml(records.length ? '当前筛选条件下没有记录。' : (mode === 'trash' ? '本月垃圾篓是空的。' : (mode === 'finalized' ? '本月还没有已定稿记录。' : '本月还没有出图记录。打开设计分配在本月的 PLM 详情后会自动加入。'))) + '</div>';
    const month = getCurrentLedgerMonth();
    const ledgerScrollContext = ['ledger', mode, month].join('|');
    const toolsCollapsed = Boolean(state.ledgerToolsCollapsed);
    const toolsTitle = performanceHtml ? '绩效与筛选' : '筛选与操作';
    return '<section class="pfh-ledger-tools-panel' + (toolsCollapsed ? ' is-collapsed' : '') + '">' +
      '<button type="button" class="pfh-ledger-tools-toggle" data-action="ledger-toggle-tools" aria-expanded="' + (toolsCollapsed ? 'false' : 'true') + '"><span class="pfh-ledger-tools-toggle-copy"><strong>' + toolsTitle + '</strong><small>收起后列表会展示更多产品</small></span><span class="pfh-ledger-tools-toggle-state" data-ledger-tools-state>' + (toolsCollapsed ? '展开' : '收起') + '</span><span class="pfh-ledger-tools-toggle-chevron" aria-hidden="true">⌄</span></button>' +
      '<div class="pfh-ledger-tools-body">' +
      performanceHtml +
      '<div class="pfh-ledger-controlbar"><div class="pfh-ledger-toolbar">' +
        '<button type="button" class="pfh-ledger-month" data-action="ledger-prev-month" title="上个月">‹</button>' +
        '<button type="button" class="pfh-ledger-month-label" data-action="ledger-today">' + escapeHtml(formatLedgerMonthLabel(month)) + '</button>' +
        '<button type="button" class="pfh-ledger-month" data-action="ledger-next-month" title="下个月">›</button>' +
        '<button type="button" data-action="ledger-today">本月</button>' +
        (mode === 'trash'
          ? '<button type="button" data-action="ledger-trash-empty"' + (records.length ? '' : ' disabled') + '>清空本月垃圾篓</button>'
          : mergePerformanceHtml +
            selectionToolbarHtml +
            '<button type="button" data-action="ledger-copy" title="导出已定稿内容到登记表">导出到登记</button>' +
            '<button type="button" data-action="ledger-copy-selected" title="复制当前勾选的产品编码">复制选中编码</button>' +
            '<button type="button" data-action="ledger-copy-video" title="复制选中产品的视频申请内容">制作视频</button>') +
      '</div>' +
      '<div class="pfh-ledger-filterbar"><input type="search" class="pfh-ledger-filter-query" value="' + escapeHtml(state.ledgerFilterQuery || '') + '" placeholder="筛选 SKU / 品牌 / 品名 / 编码">' + ledgerStatusFilterHtml(mode) + ledgerWorkflowFilterHtml(mode) + '<select class="pfh-ledger-filter-image"><option value="all">全部图片</option><option value="benchmark"' + (state.ledgerFilterImage === 'benchmark' ? ' selected' : '') + '>有对标图</option><option value="effect"' + (state.ledgerFilterImage === 'effect' ? ' selected' : '') + '>有效果图</option><option value="missing"' + (state.ledgerFilterImage === 'missing' ? ' selected' : '') + '>缺当前图</option></select><button type="button" data-action="ledger-copy-filtered-skus">复制当前编码</button><button type="button" data-action="ledger-copy-filtered-table">复制当前表格</button><div class="pfh-ledger-view-switch"><button type="button" data-action="ledger-display-mode" data-mode="cards" class="' + (state.ledgerDisplayMode === 'cards' ? 'is-active' : '') + '">卡片</button><button type="button" data-action="ledger-display-mode" data-mode="table" class="' + (state.ledgerDisplayMode === 'table' ? 'is-active' : '') + '">表格</button></div></div></div>' +
      '</div></section>' +
      (state.ledgerDisplayMode === 'table' ? ledgerTableRowsHtml(filteredRecords, mode) : '<div class="pfh-ledger-list" data-scroll-context="' + escapeHtml(ledgerScrollContext) + '">' + rows + '</div>') +
      ledgerTimeEditorHtml() +
      ledgerPerformanceGroupModalHtml();
  }

  function ledgerViewHtml(records) {
    if (!document.getElementById(PANEL_ID + '-ledger-workspace-style')) {
      const style = document.createElement('style');
      style.id = PANEL_ID + '-ledger-workspace-style';
      style.textContent = LEDGER_WORKSPACE_CSS;
      document.documentElement.appendChild(style);
    }
    const mode = state.ledgerView === 'trash' ? 'trash' : (state.ledgerView === 'finalized' ? 'finalized' : (state.ledgerView === 'canvas' ? 'canvas' : 'design'));
    const month = getCurrentLedgerMonth();
    const ledgerScrollContext = ['ledger', mode, month].join('|');
    return '<div class="pfh-detail-scroll" data-scroll-context="' + escapeHtml(ledgerScrollContext) + '"><section class="pfh-ledger-page pfh-ledger-unified">' +
      '<div class="pfh-ledger-hero"><button type="button" class="pfh-upload-back pfh-ledger-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div class="pfh-ledger-hero-copy"><h3>今日工作台</h3><p data-ledger-hero-note>' + escapeHtml(mode === 'trash' ? '移除记录会阻止 PLM 再次自动加入，恢复后才解除拦截。' : (mode === 'finalized' ? '默认只显示图包未完成；选中多个产品后，点击纸盒、标签或图包会同步选中产品，图包完成后自动收纳。' : (mode === 'canvas' ? '画布汇总今日出图与定稿：拖动卡片与视口，手动备注只保存在本地。' : '按设计分配日期整理出图，定稿后继续跟纸盒、标签和图包。'))) + '</p></div><div class="pfh-ledger-hero-actions"><span data-ledger-record-count>' + escapeHtml(mode === 'canvas' ? ledgerCanvasRecordCountLabel(month) : records.length + ' 条 / ' + month) + '</span><button type="button" class="pfh-ledger-fullscreen-toggle" data-action="ledger-fullscreen-toggle" aria-pressed="' + (state.ledgerFullscreen ? 'true' : 'false') + '" title="' + (state.ledgerFullscreen ? '返回悬浮窗' : '打开专注工作区') + '">' + (state.ledgerFullscreen ? '退出工作区' : '全屏工作区') + '</button></div><div class="pfh-ledger-hero-tabs"><div class="pfh-ledger-tabs-shell">' +
           '<div class="pfh-ledger-tabs-main"><div class="pfh-ledger-tabs" data-active-tab="' + mode + '">' +
             '<span class="pfh-ledger-tab-indicator" aria-hidden="true"></span>' +
             '<button type="button" class="' + (mode === 'design' ? 'is-active active' : '') + '" data-action="ledger-view-design">待定稿</button>' +
             '<button type="button" class="' + (mode === 'finalized' ? 'is-active active' : '') + '" data-action="ledger-view-finalized">已定稿</button>' +
             '<button type="button" class="' + (mode === 'canvas' ? 'is-active active' : '') + '" data-action="ledger-view-canvas">画布</button>' +
           '</div></div>' +
           '<button type="button" class="pfh-ledger-trash-entry' + (mode === 'trash' ? ' is-active' : '') + '" data-action="ledger-view-trash" aria-label="垃圾篓" title="垃圾篓" aria-current="' + (mode === 'trash' ? 'page' : 'false') + '">' + iconHtml('trash') + '</button>' +
         '</div></div></div>' +
       '<div class="pfh-ledger-workbench-shell"><div class="pfh-ledger-content-anchor">' +
           ledgerViewContentHtml(records) +
         '</div>' +
       '</div>' +
       '</section></div>';
  }

  function ledgerRowHtml(record, mode, performanceGroupLabels, performanceRecordGroupIds) {
    const sku = record.sku || '';
    const title = [record.brand, record.name].filter(Boolean).join(' ') || sku;
    const thumbUrl = record.skuImageUrl || record.benchmarkImageUrl;
    const thumbnailUrl = getLedgerThumbnailUrl(thumbUrl);
    const thumb = thumbUrl
      ? '<span class="pfh-ledger-thumb-frame"><img data-local-image="' + escapeHtml(thumbnailUrl || thumbUrl) + '" alt="" loading="lazy" decoding="async"></span>'
      : '<span class="pfh-ledger-thumb-empty">' + iconHtml('image') + '</span>';
    const imageGenerated = Boolean(record.imageGeneratedAt);
    const workDate = mode === 'finalized' ? getLedgerFinalizedDate(record) : getLedgerDesignDate(record);
    const designType = record.designType || '未分类';
    const artPriority = record.artPriority || '';
    const priorityClass = /^P0.*(?:紧急|urgent)/i.test(artPriority) ? ' is-p0-urgent' : (/^P0.*(?:当日|当天|today)/i.test(artPriority) ? ' is-p0-today' : (/^P0/i.test(artPriority) ? ' is-p0-urgent' : (/^P1/i.test(artPriority) ? ' is-p1' : '')));
    const packageCode = record.packageCode || '';
    const printCode = record.printCode || '';
    const purchasePrice = String(record.purchasePrice || '').trim();
    const dateAttr = escapeHtml(record.date || workDate);
    const selected = (state.ledgerSelectedKeys || []).includes(getLedgerSelectionKey(record));
    const effectivePerformanceGroupId = (performanceRecordGroupIds && performanceRecordGroupIds.get(getLedgerSelectionKey(record))) || record.performanceGroupId || '';
    const dateText = mode === 'finalized'
      ? ((record.status === '作废' ? '作废 ' : '定稿 ') + (record.finalizedAt ? formatLedgerMinuteLabel(record.finalizedAt, workDate) : formatLedgerDateLabel(workDate)))
      : ('分配 ' + formatLedgerMinuteLabel(record.designAssignedAt || workDate, workDate));
    const tagHtml = '<div class="pfh-ledger-tags">' +
      '<button type="button" class="is-sku" data-action="ledger-copy-sku" data-sku="' + escapeHtml(sku) + '" title="点击复制产品编码">' + escapeHtml(sku) + '</button>' +
      '<span class="is-design-type" title="设计类型">' + escapeHtml(designType) + '</span>' +
      (artPriority ? '<span class="is-priority' + priorityClass + '" title="美工处理优先级">' + escapeHtml(artPriority) + '</span>' : '') +
      (record.performanceType === 'extension' ? '<span class="is-extension" title="绩效按 0.3 分计算">延伸 · 0.3</span>' : '') +
      (isLedgerSeriesExcluded(record) ? '<span class="is-series-excluded" title="已手动剔除自动系列">已剔除系列</span>' : '') +
      (performanceGroupLabels && performanceGroupLabels.get(effectivePerformanceGroupId) ? '<span class="is-performance-group" title="此编码已纳入绩效分组">' + escapeHtml(performanceGroupLabels.get(effectivePerformanceGroupId)) + '</span>' : '') +
      '</div>';
    const assignmentHtml = '<div class="pfh-ledger-assignment">' + escapeHtml(dateText) +
      (mode === 'finalized' ? '<button type="button" class="pfh-ledger-edit-time" data-action="ledger-edit-finalized-time" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">改时间</button>' : '') +
      '</div>';
    const stageClass = record.finalizedAt || mode === 'finalized'
      ? ' is-stage-finalized'
      : (imageGenerated ? ' is-stage-generated' : ' is-stage-pending');
    const menuHtml = ledgerOverflowMenuHtml(record, sku, dateAttr, imageGenerated);
    const menuOpen = state.ledgerMenuSku === sku && state.ledgerMenuDate === normalizeLedgerDate(record.date || workDate);
    const moreButton = '<div class="pfh-ledger-more"><button type="button" data-action="ledger-more" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" aria-label="更多操作" aria-expanded="' + (menuOpen ? 'true' : 'false') + '"><span class="pfh-more-dots"><i></i><i></i><i></i></span></button>' + menuHtml + '</div>';
    const actions = mode === 'finalized'
      ? '<div class="pfh-ledger-file-actions">' +
        ledgerArtworkStateButtonHtml(record, sku, dateAttr) +
        ledgerFileButtonHtml('ledger-toggle-box-file', sku, dateAttr, '纸盒', packageCode, record.boxFileState, record.boxFileDone) +
        ledgerFileButtonHtml('ledger-toggle-label-file', sku, dateAttr, '标签', printCode, record.labelFileState, record.labelFileDone) +
        ledgerFileButtonHtml('ledger-toggle-image-pack', sku, dateAttr, '图包', '', record.imagePackState, record.imagePackDone) +
        moreButton +
      '</div>'
      : '<div class="pfh-ledger-actions">' +
        (!imageGenerated ? '<button type="button" class="is-primary is-generate" data-action="ledger-image-generated" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '"><span>出图</span></button>' : (record.finalizedAt ? '<span class="pfh-ledger-complete">已定稿</span>' : '<label class="pfh-ledger-price' + (state.ledgerFlowTransitionSku === sku ? ' is-flow-transition' : '') + '"><span>¥</span><input type="text" inputmode="decimal" value="' + escapeHtml(purchasePrice) + '" placeholder="价格" aria-label="产品价格"></label><button type="button" class="is-primary is-finalize' + (state.ledgerFlowTransitionSku === sku ? ' is-flow-transition' : '') + '" data-action="ledger-finalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">' + ledgerFinalizeCheckIconHtml() + '<span>定稿</span><em>已出图</em></button>')) +
        moreButton +
      '</div>';
    return '<article class="pfh-ledger-item is-clickable is-' + escapeHtml(mode) + stageClass + (selected ? ' is-selected' : '') + (menuOpen ? ' is-menu-open' : '') + '" data-ledger-stage="' + escapeHtml(record.finalizedAt || mode === 'finalized' ? 'finalized' : (imageGenerated ? 'generated' : 'pending')) + '" data-ledger-sku="' + escapeHtml(sku) + '" data-ledger-date="' + dateAttr + '" data-performance-group-id="' + escapeHtml(effectivePerformanceGroupId) + '" role="button" aria-pressed="' + (selected ? 'true' : 'false') + '" tabindex="0" title="点击卡片选择产品">' +
      '<button type="button" class="pfh-ledger-thumb" data-action="ledger-open-sku" data-sku="' + escapeHtml(sku) + '">' + thumb + '</button>' +
      '<div class="pfh-ledger-main">' +
        '<div class="pfh-ledger-title-row"><button type="button" class="pfh-ledger-title" data-action="ledger-open-sku" data-sku="' + escapeHtml(sku) + '"><b>' + escapeHtml(title) + '</b></button></div>' +
        tagHtml +
        assignmentHtml +
      '</div>' +
      '<div class="pfh-ledger-bottom">' + actions + '</div>' +
    '</article>';
  }

  function refreshLedgerCard(record) {
    // Canvas view shows a frozen snapshot; per-card repaints would rebuild the
    // dragged layout, so background record updates wait for an explicit refresh.
    // Narrow to the ledger view: a stale ledgerView must not swallow the
    // renderShell() fallback that other views rely on.
    if (state.view === 'ledger' && state.ledgerView === 'canvas') return;
    if (!record || state.view !== 'ledger') {
      renderShell();
      return;
    }
    const mode = state.ledgerView === 'finalized' ? 'finalized' : 'design';
    const panel = ensurePanel();
    const card = Array.from(panel.querySelectorAll('.pfh-ledger-item')).find((item) => item.getAttribute('data-ledger-sku') === record.sku && normalizeLedgerDate(item.getAttribute('data-ledger-date')) === normalizeLedgerDate(record.date));
    const finalized = isLedgerFinalizedRecord(record);
    if ((mode === 'finalized' && !finalized) || (mode === 'design' && finalized)) {
      if (card) card.remove();
      else renderShell();
      return;
    }
    if (!filterLedgerWorkbenchRecords([record], mode).length) {
      if (!renderLedgerTabContent(panel)) renderShell();
      return;
    }
    if (!card) {
      renderShell();
      return;
    }
    const performanceGroupMaps = mode === 'finalized'
      ? getLedgerPerformanceGroupMaps(summarizeLedgerPerformance(getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())))
      : { labels: null, recordGroupIds: null };
    card.outerHTML = ledgerRowHtml(record, mode, performanceGroupMaps.labels, performanceGroupMaps.recordGroupIds);
    if (state.ledgerMenuSku === record.sku && state.ledgerMenuDate === normalizeLedgerDate(record.date)) {
      const nextButton = Array.from(panel.querySelectorAll('[data-action="ledger-more"]')).find((button) => button.getAttribute('data-sku') === record.sku && normalizeLedgerDate(button.getAttribute('data-date')) === normalizeLedgerDate(record.date));
      if (nextButton) positionRenderedLedgerMenu(panel, nextButton);
    }
  }

  function ledgerTrashRowHtml(record) {
    const sku = record.sku || '';
    const title = [record.brand, record.name].filter(Boolean).join(' ') || sku;
    const thumbUrl = record.skuImageUrl || record.benchmarkImageUrl || '';
    const thumb = thumbUrl ? '<img data-local-image="' + escapeHtml(thumbUrl) + '" alt="">' : '<span class="pfh-ledger-thumb-empty">' + iconHtml('image') + '</span>';
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
      const button = card.querySelector('[data-action="ledger-more"]');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
    panel.querySelectorAll('.pfh-ledger-overflow-menu').forEach((menu) => menu.remove());
  }

  function positionRenderedLedgerMenu(panel, button) {
    if (!panel || !button || !button.isConnected) return;
    const card = button.closest('.pfh-ledger-item');
    const menu = card && card.querySelector('.pfh-ledger-overflow-menu');
    const host = panel.querySelector('.pfh-full') || panel;
    if (!menu || !host) return;
    menu.setAttribute('data-ledger-menu-sku', button.getAttribute('data-sku') || '');
    menu.setAttribute('data-ledger-menu-date', button.getAttribute('data-date') || '');
    host.appendChild(menu);
    // The panel's backdrop-filter makes fixed descendants use the panel as
    // their containing block. Anchor the menu to this positioned host instead.
    menu.style.setProperty('position', 'absolute', 'important');
    menu.style.setProperty('right', 'auto', 'important');
    menu.style.setProperty('bottom', 'auto', 'important');
    menu.style.setProperty('left', '0px', 'important');
    menu.style.setProperty('top', '0px', 'important');
    menu.style.setProperty('display', 'grid', 'important');
    menu.style.setProperty('z-index', '2147483646', 'important');
    menu.style.setProperty('pointer-events', 'auto', 'important');
    menu.style.visibility = 'hidden';
    window.requestAnimationFrame(() => {
      if (!menu.isConnected || !button.isConnected) return;
      const buttonRect = button.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();
      const sideInset = 10;
      const topBoundary = Math.max(8, panelRect.top + sideInset);
      const bottomBoundary = Math.min(window.innerHeight - 8, panelRect.bottom - sideInset);
      const leftBoundary = Math.max(8, panelRect.left + sideInset);
      const rightBoundary = Math.min(window.innerWidth - 8, panelRect.right - sideInset);
      menu.style.maxHeight = Math.max(0, bottomBoundary - topBoundary) + 'px';
      menu.style.overflowY = 'auto';
      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const left = Math.max(leftBoundary, Math.min(rightBoundary - menuWidth, buttonRect.right - menuWidth));
      const spaceBelow = bottomBoundary - buttonRect.bottom - 7;
      const spaceAbove = buttonRect.top - topBoundary - 7;
      const openBelow = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;
      const top = openBelow
        ? Math.min(bottomBoundary - menuHeight, buttonRect.bottom + 7)
        : Math.max(topBoundary, buttonRect.top - menuHeight - 7);
      menu.style.setProperty('left', Math.round(left - hostRect.left) + 'px', 'important');
      menu.style.setProperty('top', Math.round(top - hostRect.top) + 'px', 'important');
      menu.style.setProperty('--pfh-menu-origin', openBelow ? 'right top' : 'right bottom');
      menu.style.visibility = 'visible';
    });
  }

  function handleLedgerMenuScroll(event) {
    if (!state.ledgerMenuSku || state.view !== 'ledger') return;
    if (event.target && event.target.closest && event.target.closest('.pfh-ledger-overflow-menu')) return;
    const panel = event.currentTarget;
    window.cancelAnimationFrame(state.ledgerMenuPositionFrame || 0);
    state.ledgerMenuPositionFrame = window.requestAnimationFrame(() => {
      state.ledgerMenuPositionFrame = 0;
      const button = Array.from(panel.querySelectorAll('[data-action="ledger-more"][aria-expanded="true"]')).find((item) => item.getAttribute('data-sku') === state.ledgerMenuSku && normalizeLedgerDate(item.getAttribute('data-date')) === state.ledgerMenuDate);
      const menu = panel.querySelector('.pfh-ledger-overflow-menu');
      if (!button || !menu) return;
      const card = button.closest('.pfh-ledger-item');
      if (card) card.appendChild(menu);
      positionRenderedLedgerMenu(panel, button);
    });
  }

  function ledgerOverflowMenuHtml(record, sku, dateAttr, imageGenerated) {
    if (state.ledgerMenuSku !== sku || state.ledgerMenuDate !== normalizeLedgerDate(dateAttr)) return '';
    const rollback = record.status === '作废'
      ? '<button type="button" data-action="ledger-unfinalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回作废</button>'
      : record.finalizedAt
      ? '<button type="button" data-action="ledger-unfinalize" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回定稿</button>'
      : (imageGenerated ? '<button type="button" data-action="ledger-unmark-image-generated" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">撤回出图</button>' : '');
    const seriesAction = isLedgerSeriesExcluded(record) ? '恢复自动系列' : '剔除自动系列';
    const artworkState = normalizeLedgerArtworkState(record.artworkState);
    const artworkLabel = artworkState === 'doing' ? '生图中' : (artworkState === 'done' ? '完成生图' : '待生图');
    const searchUsesBenchmark = state.ledgerView === 'design' || !record.skuImageUrl;
    const searchImageUrl = searchUsesBenchmark ? (record.benchmarkImageUrl || '') : record.skuImageUrl;
    const searchImageLabel = searchUsesBenchmark ? '对标图' : '效果图';
    const searchActions = searchImageUrl
      ? '<button type="button" data-action="reverse-image-search" data-engine="1688" data-image-url="' + escapeHtml(searchImageUrl) + '">1688 搜' + searchImageLabel + '</button><button type="button" data-action="reverse-image-search" data-engine="google" data-image-url="' + escapeHtml(searchImageUrl) + '">Google 搜' + searchImageLabel + '</button><button type="button" data-action="reverse-image-search" data-engine="yandex" data-image-url="' + escapeHtml(searchImageUrl) + '">Yandex 搜' + searchImageLabel + '</button>'
      : '';
    return '<div class="pfh-ledger-overflow-menu">' + rollback +
      searchActions +
      '<button type="button" data-action="ledger-cycle-artwork-state" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">手动切换生图标记（当前：' + artworkLabel + '）</button>' +
      '<button type="button" class="' + (record.performanceType === 'extension' ? 'is-active' : '') + '" data-action="ledger-extension" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">' + (record.performanceType === 'extension' ? '取消延伸（当前 0.3）' : '延伸（绩效 0.3）') + '</button>' +
      '<button type="button" class="' + (isLedgerSeriesExcluded(record) ? 'is-active' : '') + '" data-action="ledger-series-exclude" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">' + seriesAction + '</button>' +
      '<button type="button" data-action="ledger-void" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">作废</button>' +
      '<button type="button" data-action="ledger-done" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">完成</button>' +
      '<button type="button" data-action="ledger-remove" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '">移除</button>' +
      '</div>';
  }

  function ledgerFileButtonHtml(action, sku, dateAttr, label, code, stateValue, doneFallback) {
    const value = normalizeLedgerFileState(stateValue, doneFallback);
    const title = label + '\uff1a' + ledgerFileStateLabel(value) + (code ? ' \u00b7 ' + code : '');
    const displayLabel = value === 'skip' ? String.fromCharCode(0x65e0, 0x9700) + label : label;
    return '<button type="button" class="is-' + escapeHtml(value) + '" data-action="' + action + '" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="' + escapeHtml(title) + '"><span>' + escapeHtml(displayLabel) + '</span>' + (value !== 'skip' && code ? '<small>' + escapeHtml(code) + '</small>' : '') + '</button>';
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

  function productThumbHtml(data, sourceUrl) {
    const src = sourceUrl || getSkuListImageUrl(data);
    if (!src) return '<span class="pfh-product-thumb is-empty">' + iconHtml('image') + '</span>';
    const thumbnail = getLedgerThumbnailUrl(src);
    return '<button type="button" class="pfh-product-thumb" data-product-thumb-source="' + escapeHtml(src) + '" data-product-thumb-thumbnail="' + escapeHtml(thumbnail) + '" title="悬浮放大预览">' +
      '<span class="pfh-thumb-frame"><img data-local-image="' + escapeHtml(thumbnail) + '" data-local-image-fallback="' + escapeHtml(src) + '" alt=""></span>' +
      '<span class="pfh-thumb-preview"><img data-local-image="' + escapeHtml(src) + '" data-local-image-fallback="' + escapeHtml(thumbnail) + '" alt=""></span>' +
      '</button>';
  }

  function formatSkuDetailPriority(value) {
    const text = cleanName(value || '').replace(/\s+/g, '');
    if (!text) return '';
    const match = text.match(/^(P\d+)[\-\uFF0D\u2013\u2014·•|/:：]?(.*)$/i);
    if (!match) return text;
    const level = match[1].toUpperCase();
    const detail = String(match[2] || '').replace(/^[\-\uFF0D\u2013\u2014·•|/:：]+/, '');
    return detail ? level + '-' + detail : level;
  }

  function formatSkuDetailLinkLabel(value) {
    const source = String(value || '').trim();
    if (!source) return '';
    let label = source;
    try {
      if (/^https?:\/\//i.test(source)) {
        const url = new URL(source);
        label = url.hostname + (url.pathname || '').replace(/\/$/, '');
      }
    } catch (error) {
      label = source;
    }
    return label.length > 30 ? label.slice(0, 29) + '\u2026' : label;
  }



  function formatPrintSizeDisplay(data) {
    if (!data) return '';
    return [data.printSizeText || '', data.tubeSegmentText || ''].filter(Boolean).join('\n');
  }

  function renderStatusHtml(statusText) {
    const openingDetail = state.openingProjectDetail || statusText === L.openingDetail;
    if (openingDetail || state.scanRunning || statusText === L.scanning || statusText === L.checkingMaterial) {
      const tip = getCurrentLoadingTip();
      return '<div class="pfh-status pfh-loading-tip"><i class="pfh-loading-ring" aria-hidden="true"></i><span>' + (openingDetail ? '\u52a0\u8f7d\u4e2d' : '\u8bc6\u522b\u4e2d') + '</span><strong>' + escapeHtml(tip) + '</strong></div>';
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
      infringementImageUrls: '侵权图',
      infringementCopywriting: '侵权图文案',
    };
    return labels[key] || key;
  }

  function getStoredDataChanges(data) {
    return Array.isArray(data && data.recentFieldChanges)
      ? data.recentFieldChanges.filter((item) => item && item.key && !trackedDataValuesEqual(item.key, item.before, item.after)).slice(0, 20)
      : [];
  }

  function getDataChangeSignature(changes) {
    const normalized = (Array.isArray(changes) ? changes : [])
      .filter((item) => item && item.key && !trackedDataValuesEqual(item.key, item.before, item.after))
      .map((item) => [
        String(item.key),
        normalizeTrackedDataValue(item.key, item.before),
        normalizeTrackedDataValue(item.key, item.after),
      ])
      .sort((left, right) => {
        const leftText = JSON.stringify(left);
        const rightText = JSON.stringify(right);
        return leftText < rightText ? -1 : (leftText > rightText ? 1 : 0);
      });
    return normalized.length ? JSON.stringify(normalized) : '';
  }

  function getVisibleStoredDataChanges(data) {
    const changes = getStoredDataChanges(data);
    const acknowledged = String(data && data.recentFieldChangesAcknowledgedSignature || '').trim();
    return acknowledged && getDataChangeSignature(changes) === acknowledged ? [] : changes;
  }

  function getStoredDataUpdateLogs(data) {
    const logs = normalizeDataUpdateLog(data && data.dataUpdateLog);
    if (logs.length) return logs;
    const changes = getStoredDataChanges(data);
    return changes.length
      ? [{ id: 'recent-data-changes', changedAt: changes[0].changedAt || String(data && data.updatedAt || ''), changedAtMs: Number(data && data.updatedAtMs || 0) || 0, source: changes[0].source || '自动获取', changes }]
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
    const manualFieldOverrides = { ...normalizeManualFieldOverrides(data) };
    const rememberManualValue = (key, value) => {
      if (isManualOverrideField(key)) manualFieldOverrides[key] = value == null ? '' : String(value).trim();
    };
    if (Object.prototype.hasOwnProperty.call(values, 'manualCategory')) {
      next.manualCategory = normalizeManualProductCategory(values.manualCategory);
      next.manualCategoryUpdatedAt = next.manualCategory ? new Date().toLocaleString() : '';
      if (compactText(next.manualCategory) !== compactText(data.manualCategory)) rememberManualValue('manualCategory', next.manualCategory);
    }
    ['packageCode', 'printCode', 'packageSizeText', 'printSizeText', 'netContent', 'grossWeight'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        next[key] = values[key];
        if (compactText(values[key]) !== compactText(data[key])) rememberManualValue(key, values[key]);
      }
    });

    const packageKeys = ['packageLength', 'packageWidth', 'packageHeight'];
    // Dimension inputs use plain centimetre numbers, while stored fields include
    // the formatted cm/inch text. Compare the same input representation so that
    // editing packageSizeText alone is not overwritten by the old dimensions.
    const packageChanged = packageKeys.some((key) => compactText(values[key]) !== compactText(getSkuEditInputValue(data, key)));
    if (packageChanged) {
      const packageNums = packageKeys.map((key) => firstNumber(values[key]));
      if (!packageNums.every((value) => Number.isFinite(value) && value > 0)) {
        showToast('纸盒长、宽、高需要填写完整的有效数字');
        return;
      }
      next.packageNums = packageNums;
      next.packageSizeText = packageNums.map(trimNumber).join('x') + 'cm';
      packageKeys.forEach((key) => rememberManualValue(key, values[key]));
      rememberManualValue('packageSizeText', next.packageSizeText);
    } else if (Object.prototype.hasOwnProperty.call(values, 'packageSizeText') && compactText(values.packageSizeText) !== compactText(data.packageSizeText)) {
      next.packageNums = null;
      delete manualFieldOverrides.packageLength;
      delete manualFieldOverrides.packageWidth;
      delete manualFieldOverrides.packageHeight;
      rememberManualValue('packageSizeText', values.packageSizeText);
    }

    const productKeys = ['productLength', 'productWidth', 'productHeight'];
    const productChanged = productKeys.some((key) => compactText(values[key]) !== compactText(getSkuEditInputValue(data, key)));
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
      productKeys.forEach((key) => rememberManualValue(key, values[key]));
    }
    const correctedUnitIssues = normalizeMaterialDimensionUnitIssues(data.materialDimensionUnitIssues, data);
    if (Object.prototype.hasOwnProperty.call(values, 'packageSizeText')) {
      correctedUnitIssues.package = detectMaterialDimensionUnitIssue(next.packageSizeText)
        || (extractDimensionString(next.packageSizeText) ? null : correctedUnitIssues.package);
    }
    if (Object.prototype.hasOwnProperty.call(values, 'printSizeText')) {
      correctedUnitIssues.print = detectMaterialDimensionUnitIssue(next.printSizeText)
        || (extractDimensionString(next.printSizeText) ? null : correctedUnitIssues.print);
    }
    next.materialDimensionUnitIssues = correctedUnitIssues;
    next.manualFieldOverrides = manualFieldOverrides;
    next.updatedAt = new Date().toLocaleString();
    next.updatedAtMs = Date.now();
    const categoryChanged = compactText(next.manualCategory) !== compactText(data.manualCategory);
    saveData(data.sku, next, { changeSource: '手动校准', trackEmptyChanges: true });
    state.skuEditMode = false;
    if (categoryChanged) {

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
    const next = {
      ...data,
      recentFieldChanges: [],
      recentFieldChangesAcknowledgedSignature: getDataChangeSignature(getStoredDataChanges(data)),
    };
    saveData(data.sku, next, { suppressChangeTracking: true });
    renderShell();
    showToast('已确认本次数据更新');
  }

  function materialSummaryCardHtml(kind, title, size, code) {
    if (state.skuEditMode) return rowHtml(kind + 'Code', '', code) + rowHtml(kind + 'SizeText', title, size);
    return '<article class="pfh-material-card"><small>' + escapeHtml(title) + '</small>' +
      '<span role="button" tabindex="0" class="pfh-material-size" data-key="' + kind + 'SizeText" data-material-copy-key="' + kind + 'SizeText" title="左键复制尺寸，右键查看命名与历史编码">' + escapeHtml(size).replace(/\n/g, '<br>') + '</span>' +
      (code ? '<span role="button" tabindex="0" class="pfh-material-code" data-key="' + kind + 'Code" data-material-copy-key="' + kind + 'Code" title="点击复制物料编码">' + escapeHtml(code) + '</span>' : '') + '</article>';
  }

  function accessoryCardsHtml(data) {
    return normalizeAccessories(data.accessories).map((item) => '<article class="pfh-material-card"><small>' + escapeHtml(item.name) + ' · ×' + item.quantity + '</small>' +
      '<span role="button" tabindex="0" class="pfh-material-size" data-material-copy-key="accessory" data-copy-value="' + escapeHtml(item.sizeText || item.specification) + '" title="点击复制尺寸或规格">' + escapeHtml(item.sizeText || item.specification || '尺寸待补充') + '</span>' +
      (item.code ? '<span role="button" tabindex="0" class="pfh-material-code" data-material-copy-key="accessory" data-copy-value="' + escapeHtml(item.code) + '" title="点击复制物料编码">' + escapeHtml(item.code) + '</span>' : '') + '</article>').join('');
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
    const readiness = getCurrentExportReadiness();
    const exportIcon = (type) => '<img class="pfh-export-choice-icon" src="' + escapeHtml(CLOUD_BACKUP_API_BASE + '/assets/export-icons/' + (type === 'excel' ? 'excel-glass-v1.png' : 'toy-label-glass-v1.png')) + '" alt="" width="36" height="36" decoding="async">';
    const option = (type, label, missing) => '<button type="button" class="pfh-export-choice' + (missing.length ? ' is-missing' : ' is-ready') + (state.exportType === type ? ' is-active' : '') + '" data-action="export-type" data-export-type="' + type + '" aria-pressed="' + String(state.exportType === type) + '">' + exportIcon(type) + '<span class="pfh-export-choice-copy"><b>' + escapeHtml(label) + '</b><small>' + escapeHtml(missing.length ? '缺' + missing.join('、') + (type === 'excel' ? ' · 可缺项导出' : ' · 需获取') : '资料齐全 · 可直接导出') + '</small></span></button>';
    return '<div class="pfh-readiness-menu' + (state.exportMenuOpen ? ' is-open' : '') + '"><button type="button" class="pfh-readiness-trigger" data-action="export-menu-toggle" aria-expanded="' + String(state.exportMenuOpen) + '" title="选择导出类型">导出</button><div class="pfh-readiness-dropdown">' + option('excel', L.exportTypeExcel, readiness.excelMissing) + option('toy-label', L.exportTypeToyLabel, readiness.toyMissing) + excelOptionsHtml() + '</div></div>';
  }

  function getCurrentExportReadiness() {
    const current = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null) || {});
    const prepared = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === current.sku ? state.excelExtra : null;
    const data = prepared ? prepared.excelData : current;
    const extra = prepared ? prepared.extra : buildCachedExcelExtraData(data);
    const image = getToyLabelImageSource(data, extra);
    return { data, extra, excelMissing: (data.sku ? [] : ['SKU']).concat(getExcelMissingFields(data, extra)), toyMissing: (data.sku ? [] : ['SKU']).concat(image.imageUrl || image.imageFallbackUrl ? [] : ['产品图']) };
  }

  function excelOptionsHtml() {
    const readiness = getCurrentExportReadiness();
    const missing = state.exportType === 'toy-label' ? readiness.toyMissing : readiness.excelMissing;
    const statusClass = missing.length ? ' is-bad' : ' is-good';
    const priceValue = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    const excelGenerateLabel = missing.length ? (state.exportType === 'excel' ? '缺项导出 Excel' : '获取图片并导出') : '导出' + (state.exportType === 'toy-label' ? '玩具标签' : ' Excel');
    const excelGenerateTitle = state.exportType === 'excel' && missing.length
      ? '缺少' + missing.join('、') + '；仍会立即导出，缺失单元格留空'
      : '';
    return '<div class="pfh-export-readiness-controls">' +
      (state.exportType === 'toy-label' ? '' : '<label class="pfh-export-price-label">采购价<input type="number" min="0" step="1" class="pfh-excel-price" placeholder="' + escapeHtml(L.excelPurchasePrice) + '" value="' + escapeHtml(priceValue) + '"></label>') +
      (state.exportType === 'toy-label' ? '' : '<button type="button" data-action="excel-prepare" title="补全 Excel 数据">补全资料</button>') +
      '<button type="button" class="pfh-export-submit" data-action="export-submit"' + (excelGenerateTitle ? ' title="' + escapeHtml(excelGenerateTitle) + '"' : '') + '>' + escapeHtml(excelGenerateLabel) + '</button>' +
      (state.excelStatus ? '<span role="status" class="pfh-export-feedback' + statusClass + '">' + escapeHtml(state.excelStatus) + '</span>' : '') +
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
      const printedBag = isPrintedBagPackageDimensionData(data);
      const printedBagValues = printedBag ? getPrintedBagFlatDimensionPair(data) : null;
      if (printedBag && (!printedBagValues || printedBagValues.length < 2)) return [];
      const values = printedBagValues || (Array.isArray(data.packageNums) ? data.packageNums.slice(0, 3).map(Number) : parseDimension(data.packageSizeText, 3));
      const requiredCount = printedBag ? 2 : 3;
      if (!values || values.length < requiredCount || values.slice(0, requiredCount).some((value) => !Number.isFinite(value))) return [];
      const codes = namingCodes(data.packageCode);
      return [{
        type: printedBag ? 'printed-bag' : 'package',
        label: compactText(data.packageSizeLabel || (printedBag ? '印刷自立袋' : '纸盒')),
        values: printedBag ? printedBagValues : values.slice(0, 3),
        size: namingSizeText(printedBag ? printedBagValues : values.slice(0, 3)),
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

  let packagingNamingHistoryCache = new WeakMap();

  function invalidatePackagingNamingHistoryCache() {
    packagingNamingHistoryCache = new WeakMap();
  }

  function packagingNamingHistorySummary(item, key) {
    let cached = packagingNamingHistoryCache.get(item);
    if (!cached || !cached[key]) {
      const history = normalizeData(loadData(item.sku) || item);
      cached = cached || {};
      cached[key] = {
        entries: packagingNamingEntries(history, key),
        brandName: namingProductText(history),
        logo: namingLogoKey(history),
        updatedAtMs: Number(history.updatedAtMs || item.updatedAtMs || 0),
      };
      packagingNamingHistoryCache.set(item, cached);
    }
    return cached[key];
  }

  async function historicalNamingRecommendations(data, key, entries, isCurrent) {
    const currentSku = String((data && data.sku) || '');
    const currentLogo = namingLogoKey(data);
    const currentCodes = new Set(entries.map((entry) => entry.code).filter(Boolean));
    const recommendations = [];
    const index = (state.index || []).slice();
    let sliceStarted = performance.now();
    for (let indexPosition = 0; indexPosition < index.length; indexPosition++) {
      if (isCurrent && !isCurrent()) return [];
      if (indexPosition && (indexPosition % 8 === 0 || performance.now() - sliceStarted >= 4)) {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
        if (isCurrent && !isCurrent()) return [];
        sliceStarted = performance.now();
      }
      const item = index[indexPosition];
      if (!item || !item.sku || item.sku === currentSku) continue;
      const history = packagingNamingHistorySummary(item, key);
      history.entries.forEach((candidate) => {
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
          brandName: history.brandName,
          sameLogo: Boolean(currentLogo && history.logo === currentLogo),
          exact: best.max < 0.01,
          max: best.max,
          total: best.total,
          updatedAtMs: Number(history.updatedAtMs || item.updatedAtMs || 0),
        });
      });
    }
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

  function positionPackagingNamingCard(panel, card, clientX, clientY) {
    const panelRect = panel.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    card.style.left = Math.max(8, Math.min(clientX - panelRect.left, panelRect.width - cardRect.width - 8)) + 'px';
    card.style.top = Math.max(8, Math.min(clientY - panelRect.top, panelRect.height - cardRect.height - 8)) + 'px';
  }

  function showPackagingNamingCard(row, key, event) {
    const panel = row && row.closest('#' + PANEL_ID);
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!panel || !data) return;
    const entries = packagingNamingEntries(data, key);
    if (!entries.length) {
      showToast('当前尺寸无法生成命名', { quiet: true });
      return;
    }
    closePackagingNamingCard(panel);
    const entryHtml = entries.map((entry) => {
      const line = namingLine(entry, data);
      return '<button type="button" class="pfh-packaging-naming-current" data-naming-copy="' + escapeHtml(line) + '"><span>' + escapeHtml(line) + '</span></button>';
    }).join('');
    const renderRecommendations = (recommendations) => recommendations.length ? recommendations.map((item) =>
      '<button type="button" class="pfh-packaging-naming-history" data-naming-copy="' + escapeHtml(item.code) + '">' +
        '<span><b>' + escapeHtml(item.code) + '</b><i>' + escapeHtml(item.exact ? '同尺寸' : '相近') + '</i>' + (item.sameLogo ? '<i class="is-logo">同 Logo</i>' : '') + '</span>' +
        '<small>' + escapeHtml(item.label + (/[）)]$/.test(item.label) ? ' ' : '') + '（' + item.size + '）' + (item.brandName ? ' ' + item.brandName : '')) + '</small>' +
      '</button>'
    ).join('') : '<p class="pfh-packaging-naming-empty">暂无同尺寸或偏差 0.5cm 以内的历史文件</p>';
    const card = document.createElement('section');
    card.className = 'pfh-packaging-naming-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', '包材命名与历史编码');
    const namingTitle = key === 'packageSizeText' && entries.some((entry) => entry.type === 'printed-bag') ? '印刷自立袋命名' : (key === 'packageSizeText' ? '纸盒命名' : '标签 / 印刷命名');
    card.innerHTML = '<header><div><b>' + namingTitle + '</b><span>点击内容即可复制</span></div><button type="button" data-naming-close aria-label="关闭">×</button></header>' +
      '<div class="pfh-packaging-naming-current-list">' + entryHtml + '</div>' +
      '<div class="pfh-packaging-naming-subtitle"><b>历史相近文件编码</b><span>同 Logo 优先 · 偏差 ≤ 0.5cm</span></div>' +
      '<div class="pfh-packaging-naming-history-list" aria-busy="true"><p class="pfh-packaging-naming-empty" role="status">正在查找历史相近文件编码…</p></div>';
    panel.appendChild(card);
    const clientX = event.clientX;
    const clientY = event.clientY;
    positionPackagingNamingCard(panel, card, clientX, clientY);
    // Give the current naming/copy controls a paint before reading any history.
    window.requestAnimationFrame(() => window.requestAnimationFrame(async () => {
      if (!card.isConnected) return;
      const list = card.querySelector('.pfh-packaging-naming-history-list');
      try {
        const recommendations = await historicalNamingRecommendations(data, key, entries, () => card.isConnected);
        if (!card.isConnected) return;
        list.innerHTML = renderRecommendations(recommendations);
      } catch (error) {
        if (!card.isConnected) return;
        list.innerHTML = '<p class="pfh-packaging-naming-empty">历史编码读取失败，请重新右键重试</p>';
        reportDiagnostic(error, { feature: 'packaging-naming', action: 'history-recommendations' });
      }
      list.setAttribute('aria-busy', 'false');
      if (card.isConnected) positionPackagingNamingCard(panel, card, clientX, clientY);
    }));
  }

  function handlePanelContextMenu(event) {
    const detailLink = event.target && event.target.closest && event.target.closest('.pfh-detail-link-value[data-reference-url]');
    if (detailLink) {
      event.preventDefault();
      event.stopPropagation();
      copyText(detailLink.getAttribute('data-reference-url') || '');
      detailLink.classList.add('is-copied');
      window.setTimeout(() => detailLink.classList.remove('is-copied'), 650);
      showToast('链接已复制');
      return;
    }
    const skuCard = event.target && event.target.closest && event.target.closest('.pfh-sku-waterfall-card[data-sku], .pfh-sku[data-sku], .pfh-workspace-row[data-sku]');
    if (skuCard) {
      event.preventDefault();
      event.stopPropagation();
      closePackagingNamingCard(ensurePanel());
      showSkuWaterfallContextMenu(skuCard.getAttribute('data-sku'), event, { allowCache: true, includeSearch: false });
      return;
    }
    const row = event.target && event.target.closest && event.target.closest('[data-key="packageSizeText"], [data-key="printSizeText"]');
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    showPackagingNamingCard(row, row.getAttribute('data-key'), event);
  }

  function encodeSkuCode128B(value) {
    const text = String(value || '').trim();
    if (!text) throw new Error('SKU 不能为空');
    if (!/^[\x20-\x7e]+$/.test(text)) throw new Error('SKU 含有 Code 128 不支持的字符');
    const values = [104];
    let checksum = 104;
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index) - 32;
      values.push(code);
      checksum += code * (index + 1);
    }
    values.push(checksum % 103);
    return { value: text, pattern: values.map((code) => CODE128_PATTERNS[code]).concat(CODE128_PATTERNS[106]).join('') };
  }

  function buildSkuBarcodeSvg(value) {
    const encoded = encodeSkuCode128B(value);
    const format = (number) => Number(number.toFixed(4));
    const moduleWidth = 1.13;
    const barReduction = 0.13;
    const barStartX = 11.268;
    const barY = 9.8218;
    const barHeight = 36.01;
    let moduleOffset = 0;
    let isBar = true;
    const bars = [];
    for (const token of encoded.pattern) {
      const modules = Number(token);
      if (isBar) {
        bars.push('<rect x="' + format(barStartX + moduleOffset * moduleWidth) + '" y="' + barY + '" width="' + format(modules * moduleWidth - barReduction) + '" height="' + barHeight + '"></rect>');
      }
      moduleOffset += modules;
      isBar = !isBar;
    }
    return '<?xml version="1.0" encoding="UTF-8"?>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="198.463pt" height="60.4398pt" viewBox="0 0 198.463 60.4398">' +
      '<rect width="198.463" height="60.4398" fill="#fff"></rect>' +
      '<rect x="11.203" y="9.8218" width="176.28" height="45.01" fill="#fff"></rect>' +
      '<g fill="#000">' + bars.join('') + '</g>' +
      '<rect x="77.343" y="46.8318" width="44" height="8" fill="#fff"></rect>' +
      '<text x="77.3433" y="54.0306" fill="#000" font-family="SimSun, Songti SC, serif" font-size="8pt" font-weight="400" textLength="44" lengthAdjust="spacingAndGlyphs">' + escapeHtml(encoded.value) + '</text>' +
      '</svg>';
  }

  function downloadSkuBarcode(sku, productName) {
    const value = String(sku || '').trim();
    const name = cleanFileNamePart(productName);
    const filename = [value, name].filter(Boolean).join(' ') + '.svg';
    const svg = buildSkuBarcodeSvg(value);
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename);
    addLog('success', '已生成 SKU 条码', value + ' / Code 128-B');
    showToast(value + ' 条码已下载');
  }

  function closeSkuWaterfallContextMenu(panel) {
    const menu = panel && panel.querySelector('.pfh-sku-context-menu');
    if (menu) menu.remove();
    if (panel) panel.querySelectorAll('[data-action="sku-detail-more"]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    state.skuContextMenuSku = '';
  }

  function getSkuContextSearchSources(data) {
    const source = data && typeof data === 'object' ? data : {};
    const firstImage = (values) => values
      .map((value) => String(value || '').trim())
      .find((value) => value && !/^data:image\//i.test(value)) || '';
    return {
      effect: firstImage([
        source.skuImageUrl,
        source.skuImageFallbackUrl,
        source.effectImage,
        source.productListImageUrl,
        source.productListImageFallbackUrl,
        source.productListImage,
      ]),
      benchmark: firstImage([
        source.benchmarkImageUrl,
        source.benchmarkImageFallbackUrl,
        source.benchmarkImage,
      ]),
    };
  }

  function skuContextReverseSearchGroupHtml(label, imageUrl) {
    const url = String(imageUrl || '').trim();
    if (!url) return '';
    const encodedUrl = escapeHtml(url);
    return '<div class="pfh-sku-context-search-group"><span class="pfh-sku-context-search-title">' + escapeHtml(label) + '</span><div class="pfh-sku-context-search-actions">' +
      '<button type="button" data-action="reverse-image-search" data-engine="1688" data-image-url="' + encodedUrl + '" title="1688 搜' + escapeHtml(label) + '">1688</button>' +
      '<button type="button" data-action="reverse-image-search" data-engine="google" data-image-url="' + encodedUrl + '" title="Google 搜' + escapeHtml(label) + '">Google</button>' +
      '<button type="button" data-action="reverse-image-search" data-engine="yandex" data-image-url="' + encodedUrl + '" title="Yandex 搜' + escapeHtml(label) + '">Yandex</button>' +
      '</div></div>';
  }

  function showSkuWaterfallContextMenu(sku, event, options) {
    const opts = options || {};
    const panel = ensurePanel();
    closeSkuWaterfallContextMenu(panel);
    const item = state.index.find((entry) => entry.sku === sku) || (state.data && state.data.sku === sku ? state.data : null);
    if (!item) return;
    const sourceData = opts.includeSearch
      ? normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : item))
      : item;
    const searchSources = opts.includeSearch ? getSkuContextSearchSources(sourceData) : { effect: '', benchmark: '' };
    const searchHtml = opts.includeSearch
      ? skuContextReverseSearchGroupHtml('搜 SKU 效果图', searchSources.effect) + skuContextReverseSearchGroupHtml('搜对标图', searchSources.benchmark)
      : '';
    const cacheHtml = opts.allowCache === false
      ? ''
      : '<button type="button" data-action="sku-context-cache" data-sku="' + escapeHtml(sku) + '">完整缓存信息</button>';
    const menu = document.createElement('div');
    menu.className = 'pfh-sku-context-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = searchHtml + cacheHtml +
      '<button type="button" data-action="sku-context-barcode" data-sku="' + escapeHtml(sku) + '">生成条码</button>';
    panel.appendChild(menu);
    state.skuContextMenuSku = sku;
    panel.querySelectorAll('[data-action="sku-detail-more"]').forEach((button) => {
      if (button.getAttribute('data-sku') === sku) button.setAttribute('aria-expanded', 'true');
    });
    const panelRect = panel.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(event.clientX - panelRect.left, panelRect.width - menuRect.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(event.clientY - panelRect.top, panelRect.height - menuRect.height - 8)) + 'px';
  }

  function closeSkuCacheEditor() {
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('.pfh-cache-editor-layer');
    if (layer) layer.remove();
    state.skuCacheEditorSku = '';
  }

  const SKU_CACHE_EDITOR_LABELS = Object.freeze({
    sku: 'SKU 编码',
    name: '产品名称',
    productName: '产品名称',
    brand: '品牌',
    brandName: '品牌',
    categoryName: '产品分类',
    productType: '产品类型',
    developerName: '开发人员',
    packageCode: '纸盒编码',
    printCode: '印刷编码',
    packageSizeText: '纸盒尺寸',
    printSizeText: '印刷尺寸',
    productSizeText: '产品尺寸',
    purchasePrice: '采购价格',
    ingredientEnglish: '英文成分',
    ingredientChinese: '中文成分',
    copywriting: '产品文案',
    benchmarkImageUrl: '对标图片',
    effectImage: '效果图片',
    productListImage: '列表图片',
    manualFieldOverrides: '手动覆盖字段',
    recentFieldChanges: '近期字段变更',
    updatedAt: '更新时间',
    updatedAtMs: '更新时间戳',
    createdAt: '创建时间',
  });

  function getSkuCacheEditorValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value && typeof value === 'object') return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }

  function getSkuCacheEditorFieldLabel(key, isArrayItem) {
    if (isArrayItem) return '第 ' + (Number(key) + 1) + ' 项';
    return SKU_CACHE_EDITOR_LABELS[key] || String(key || '未命名字段');
  }

  function encodeSkuCacheEditorPath(path) {
    return encodeURIComponent(JSON.stringify(path || []));
  }

  function decodeSkuCacheEditorPath(value) {
    const parsed = JSON.parse(decodeURIComponent(String(value || '')));
    if (!Array.isArray(parsed)) throw new Error('字段路径无效');
    return parsed;
  }

  function collectSkuCacheEditorSearchText(key, value, seen) {
    const parts = [String(key || ''), getSkuCacheEditorFieldLabel(key, false)];
    const visited = seen || new WeakSet();
    if (value && typeof value === 'object') {
      if (visited.has(value)) return parts.join(' ');
      visited.add(value);
      Object.keys(value).forEach((childKey) => parts.push(collectSkuCacheEditorSearchText(childKey, value[childKey], visited)));
    } else {
      parts.push(String(value === null ? 'null' : (value === undefined ? 'undefined' : value)));
    }
    return parts.join(' ').replace(/\s+/g, ' ').slice(0, 12000);
  }

  function renderSkuCacheEditorScalar(key, value, path, depth, isArrayItem) {
    const type = getSkuCacheEditorValueType(value);
    const label = getSkuCacheEditorFieldLabel(key, isArrayItem);
    const technicalKey = isArrayItem ? '[' + key + ']' : String(key || '');
    const pathText = path.map((part) => typeof part === 'number' ? '[' + part + ']' : String(part)).join('.').replace('.[', '[');
    const encodedPath = encodeSkuCacheEditorPath(path);
    const valueText = type === 'null' ? '' : String(value);
    const longText = type === 'string' && (valueText.length > 88 || /[\r\n]/.test(valueText));
    const isSku = path.length === 1 && path[0] === 'sku';
    const options = ['string', 'number', 'boolean', 'null'].map((candidate) => '<option value="' + candidate + '"' + (candidate === type ? ' selected' : '') + '>' + ({ string: '文本', number: '数字', boolean: '布尔', null: '空值' }[candidate]) + '</option>').join('');
    const control = type === 'boolean'
      ? '<select class="pfh-cache-value-input" data-cache-role="value"><option value="true"' + (value ? ' selected' : '') + '>是 / true</option><option value="false"' + (!value ? ' selected' : '') + '>否 / false</option></select>'
      : (longText
        ? '<textarea class="pfh-cache-value-input" data-cache-role="value"' + (type === 'null' ? ' disabled' : '') + (isSku ? ' readonly' : '') + '>' + escapeHtml(valueText) + '</textarea>'
        : '<input class="pfh-cache-value-input" data-cache-role="value" value="' + escapeHtml(valueText) + '"' + (type === 'null' ? ' disabled' : '') + (isSku ? ' readonly' : '') + '>');
    return '<div class="pfh-cache-field pfh-cache-scalar" data-cache-path="' + escapeHtml(encodedPath) + '" data-cache-search="' + escapeHtml(collectSkuCacheEditorSearchText(key, value)) + '">' +
      '<div class="pfh-cache-field-head"><div class="pfh-cache-field-key"><strong>' + escapeHtml(label) + '</strong><code title="' + escapeHtml(pathText) + '">' + escapeHtml(technicalKey) + '</code></div>' +
      '<div class="pfh-cache-field-control"><select class="pfh-cache-value-type" data-cache-role="type"' + (isSku ? ' disabled' : '') + '>' + options + '</select>' + control + '</div></div></div>';
  }

  function renderSkuCacheEditorField(key, value, path, depth, isArrayItem) {
    const type = getSkuCacheEditorValueType(value);
    if (type !== 'object' && type !== 'array') return renderSkuCacheEditorScalar(key, value, path, depth, isArrayItem);
    const entries = Object.entries(value);
    const label = getSkuCacheEditorFieldLabel(key, isArrayItem);
    const technicalKey = isArrayItem ? '[' + key + ']' : String(key || '');
    const children = entries.length
      ? entries.map(([childKey, childValue]) => renderSkuCacheEditorField(type === 'array' ? Number(childKey) : childKey, childValue, path.concat(type === 'array' ? Number(childKey) : childKey), depth + 1, type === 'array')).join('')
      : '<div class="pfh-cache-empty">' + (type === 'array' ? '空数组' : '空对象') + '</div>';
    return '<details class="pfh-cache-field pfh-cache-container" data-cache-search="' + escapeHtml(collectSkuCacheEditorSearchText(key, value)) + '"' + (depth < 2 ? ' open' : '') + '>' +
      '<summary><span class="pfh-cache-container-title"><strong>' + escapeHtml(label) + '</strong><code>' + escapeHtml(technicalKey) + '</code></span><span class="pfh-cache-container-count">' + escapeHtml((type === 'array' ? '数组 ' : '对象 ') + entries.length + ' 项') + '</span></summary>' +
      '<div class="pfh-cache-children">' + children + '</div></details>';
  }

  function getSkuCacheEditorGroup(key) {
    const text = String(key || '');
    if (/copy|ingredient|direction|description|selling|efficacy|benefit|warning|claim|文案|成分/i.test(text)) return 'copy';
    if (/image|img|photo|picture|pic|thumbnail|url|file|attachment|asset|图片|文件/i.test(text)) return 'asset';
    if (/package|print|material|size|length|width|height|weight|volume|dimension|纸盒|印刷|尺寸|包材/i.test(text)) return 'material';
    if (/status|state|task|ledger|upload|seen|error|sync|source|history|record|log|time|date|created|updated|状态|记录/i.test(text)) return 'workflow';
    if (/^(?:sku|name|productName|brand|brandName|category|categoryName|productType|developer|developerName|purchasePrice|price)$/i.test(text)) return 'basic';
    return 'other';
  }

  function renderSkuCacheEditorGroups(raw) {
    const definitions = [
      ['basic', '基础信息'],
      ['material', '包材与尺寸'],
      ['asset', '图片与文件'],
      ['copy', '文案与成分'],
      ['workflow', '流程与记录'],
      ['other', '其他缓存'],
    ];
    const groups = Object.fromEntries(definitions.map(([key]) => [key, []]));
    Object.entries(raw).forEach(([key, value]) => groups[getSkuCacheEditorGroup(key)].push([key, value]));
    return definitions.map(([groupKey, label]) => {
      const entries = groups[groupKey];
      if (!entries.length) return '';
      const fields = entries.map(([key, value]) => '<div class="pfh-cache-top-field" data-cache-search="' + escapeHtml(collectSkuCacheEditorSearchText(key, value)) + '">' + renderSkuCacheEditorField(key, value, [key], 0, false) + '</div>').join('');
      return '<section class="pfh-cache-group" data-cache-group="' + groupKey + '"><header><strong>' + label + '</strong><span>' + entries.length + ' 个顶层字段</span></header><div class="pfh-cache-group-fields">' + fields + '</div></section>';
    }).join('');
  }

  function setSkuCacheEditorPathValue(target, path, value) {
    let cursor = target;
    for (let index = 0; index < path.length - 1; index += 1) {
      if (!cursor || typeof cursor !== 'object') throw new Error('字段路径不存在：' + path.join('.'));
      cursor = cursor[path[index]];
    }
    cursor[path[path.length - 1]] = value;
  }

  function parseSkuCacheEditorScalar(type, rawValue, label) {
    const text = String(rawValue == null ? '' : rawValue);
    if (type === 'null') return null;
    if (type === 'string') return text;
    if (type === 'number') {
      if (!text.trim()) throw new Error(label + ' 不能为空数字');
      const number = Number(text.trim());
      if (!Number.isFinite(number)) throw new Error(label + ' 不是有效数字');
      return number;
    }
    if (type === 'boolean') {
      if (/^(?:true|1|yes|是)$/i.test(text.trim())) return true;
      if (/^(?:false|0|no|否)$/i.test(text.trim())) return false;
      throw new Error(label + ' 的布尔值请填写 true 或 false');
    }
    return text;
  }

  function updateSkuCacheEditorValueControl(typeControl) {
    const field = typeControl && typeControl.closest('.pfh-cache-scalar');
    const current = field && field.querySelector('[data-cache-role="value"]');
    if (!field || !current) return;
    const type = typeControl.value;
    if (type === 'boolean' && current.tagName !== 'SELECT') {
      const select = document.createElement('select');
      select.className = 'pfh-cache-value-input';
      select.setAttribute('data-cache-role', 'value');
      const truthy = /^(?:true|1|yes|是)$/i.test(String(current.value || '').trim());
      select.innerHTML = '<option value="true"' + (truthy ? ' selected' : '') + '>是 / true</option><option value="false"' + (!truthy ? ' selected' : '') + '>否 / false</option>';
      current.replaceWith(select);
      return;
    }
    if (type !== 'boolean' && current.tagName === 'SELECT') {
      const input = document.createElement('input');
      input.className = 'pfh-cache-value-input';
      input.setAttribute('data-cache-role', 'value');
      input.value = current.value;
      current.replaceWith(input);
      input.disabled = type === 'null';
      input.placeholder = type === 'number' ? '请输入数字' : '请输入内容';
      return;
    }
    current.disabled = type === 'null';
    current.placeholder = type === 'number' ? '请输入数字' : '请输入内容';
  }

  function filterSkuCacheEditorFields(query) {
    const layer = document.querySelector('#' + PANEL_ID + ' .pfh-cache-editor-layer');
    if (!layer) return;
    const needle = String(query || '').trim().toLowerCase();
    layer.querySelectorAll('.pfh-cache-top-field').forEach((field) => {
      field.classList.toggle('is-hidden', Boolean(needle && !String(field.getAttribute('data-cache-search') || '').toLowerCase().includes(needle)));
    });
    layer.querySelectorAll('.pfh-cache-group').forEach((group) => {
      group.hidden = !Array.from(group.querySelectorAll(':scope .pfh-cache-top-field')).some((field) => !field.classList.contains('is-hidden'));
    });
  }

  function toggleSkuCacheEditorDetails(open) {
    const layer = document.querySelector('#' + PANEL_ID + ' .pfh-cache-editor-layer');
    if (!layer) return;
    layer.querySelectorAll('details.pfh-cache-field').forEach((item) => { item.open = Boolean(open); });
  }

  function showSkuCacheEditor(sku) {
    const normalizedSku = String(sku || '').trim();
    const raw = loadData(normalizedSku);
    if (!normalizedSku || !raw || typeof raw !== 'object' || Array.isArray(raw)) {
      showToast('没有找到 ' + (normalizedSku || '当前 SKU') + ' 的完整缓存');
      return;
    }
    const panel = ensurePanel();
    closeSkuCacheEditor();
    const layer = document.createElement('div');
    layer.className = 'pfh-cache-editor-layer';
    layer.setAttribute('data-action', 'sku-cache-editor-close');
    layer.innerHTML = '<section class="pfh-cache-editor" role="dialog" aria-modal="true" aria-label="SKU 完整缓存信息">' +
      '<header><div><h3>完整缓存信息 · ' + escapeHtml(normalizedSku) + '</h3><p>全部缓存已按用途整理；对象和数组可展开后逐项修改。</p></div><button type="button" data-action="sku-cache-editor-close" aria-label="关闭">×</button></header>' +
      '<div class="pfh-cache-editor-summary"><span>' + escapeHtml(Object.keys(raw).length + ' 个顶层字段') + '</span><input type="search" class="pfh-cache-editor-search" placeholder="搜索字段名或内容"><button type="button" data-action="sku-cache-editor-expand">全部展开</button><button type="button" data-action="sku-cache-editor-collapse">全部折叠</button></div>' +
      '<div class="pfh-cache-editor-body">' + renderSkuCacheEditorGroups(raw) + '</div>' +
      '<p class="pfh-cache-editor-error" aria-live="polite"></p>' +
      '<footer><span>SKU 键不可修改；尺寸等派生字段保存时会按现有兼容规则重新计算。</span><div><button type="button" data-action="sku-cache-editor-close">取消</button><button type="button" class="is-primary" data-action="sku-cache-editor-save">保存修改</button></div></footer>' +
      '</section>';
    panel.appendChild(layer);
    layer.style.setProperty('z-index', '360', 'important');
    layer._pfhCacheOriginal = JSON.parse(JSON.stringify(raw));
    state.skuCacheEditorSku = normalizedSku;
    const search = layer.querySelector('.pfh-cache-editor-search');
    if (search) search.focus();
  }

  function saveSkuCacheEditor() {
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('.pfh-cache-editor-layer');
    const errorNode = layer && layer.querySelector('.pfh-cache-editor-error');
    const sku = String(state.skuCacheEditorSku || '').trim();
    if (!sku || !layer || !layer._pfhCacheOriginal) return;
    try {
      const edited = JSON.parse(JSON.stringify(layer._pfhCacheOriginal));
      layer.querySelectorAll('.pfh-cache-scalar[data-cache-path]').forEach((field) => {
        const path = decodeSkuCacheEditorPath(field.getAttribute('data-cache-path'));
        const typeControl = field.querySelector('[data-cache-role="type"]');
        const valueControl = field.querySelector('[data-cache-role="value"]');
        const label = field.querySelector('.pfh-cache-field-key strong');
        const value = parseSkuCacheEditorScalar(typeControl && typeControl.value || 'string', valueControl && valueControl.value || '', label && label.textContent || path.join('.'));
        setSkuCacheEditorPathValue(edited, path, value);
      });
      const previous = normalizeData(loadData(sku) || { sku });
      edited.sku = sku;
      const overrides = { ...(edited.manualFieldOverrides && typeof edited.manualFieldOverrides === 'object' ? edited.manualFieldOverrides : {}) };
      MANUAL_OVERRIDE_FIELDS.forEach((key) => {
        if (!trackedDataValuesEqual(key, previous[key], edited[key])) overrides[key] = edited[key] == null ? '' : String(edited[key]).trim();
      });
      edited.manualFieldOverrides = overrides;
      saveData(sku, edited, { changeSource: '完整信息编辑', trackEmptyChanges: true });
      closeSkuCacheEditor();
      renderShell();
      showToast(sku + ' 完整缓存已保存');
    } catch (error) {
      if (errorNode) errorNode.textContent = '无法保存：' + (formatErrorMessage(error) || '字段格式错误');
    }
  }
