
  function normalizeToolsActiveTool(value) {
    const tool = String(value || '').trim().toLowerCase();
    if (tool === 'code' || tool === 'copywriting') return tool;
    return 'unit';
  }

  function unitConverterToolPanelHtml() {
    const result = formatCmInchLines(state.cmConverterInput);
    return '<section class="pfh-mini-tool-card pfh-tools-panel"><div class="pfh-tools-panel-head"><small>UNIT CONVERTER</small><h3>厘米换算英寸</h3><p>输入厘米数值，空格或 × 分隔多个尺寸。</p></div><label>厘米（cm）</label><textarea class="pfh-unit-converter-input" placeholder="例如：3.3 11.56 或 3.3 × 3.3 × 12.6">' + escapeHtml(state.cmConverterInput || '') + '</textarea>' +
      '<div class="pfh-mini-tool-result"><span>厘米/英寸（点击单行复制）</span><div class="pfh-unit-converter-result">' + unitConverterResultRowsHtml(result) + '</div></div>' +
      '<div class="pfh-mini-tool-actions"><button type="button" data-action="unit-converter-clear">清空</button><button type="button" data-action="unit-converter-copy"' + (result ? '' : ' disabled') + '>复制全部</button></div></section>';
  }

  function unitConverterResultRowsHtml(result) {
    if (!result) return '<span class="pfh-unit-converter-empty">等待输入</span>';
    return result.split('\n').map((line) => '<button type="button" class="pfh-unit-converter-row" data-action="unit-converter-copy-line" data-unit-line="' + escapeHtml(line) + '" aria-label="复制 ' + escapeHtml(line) + '"><span>' + escapeHtml(line) + '</span><small>复制</small></button>').join('');
  }

  function codeFormatterToolPanelHtml() {
    const result = formatSearchCodes(state.codeFormatterInput);
    return '<section class="pfh-mini-tool-card pfh-tools-panel"><div class="pfh-tools-panel-head"><small>CODE FORMATTER</small><h3>编码格式化</h3><p>把多个编码整理为文件搜索格式，支持空格、换行或逗号分隔。</p></div><label>编码</label><textarea class="pfh-code-formatter-input" placeholder="粘贴多个编码，可用空格、换行或逗号分隔">' + escapeHtml(state.codeFormatterInput || '') + '</textarea>' +
      '<div class="pfh-mini-tool-result"><span>输出格式</span><strong class="pfh-code-formatter-result">' + escapeHtml(result || 'ext:zip|ext:xlsx 编码1|编码2') + '</strong></div>' +
      '<div class="pfh-mini-tool-actions"><button type="button" data-action="code-formatter-clear">清空</button><button type="button" data-action="code-formatter-copy"' + (result ? '' : ' disabled') + '>复制结果</button></div></section>';
  }

  const SUPPLEMENT_FACTS_PAGE_WIDTH = 595.25;
  const SUPPLEMENT_FACTS_PAGE_HEIGHT = 841.85;
  const SUPPLEMENT_FACTS_OUTER_LEFT = 53.88;
  const SUPPLEMENT_FACTS_OUTER_TOP = 71.88;
  const SUPPLEMENT_FACTS_OUTER_WIDTH = 484.68;
  const SUPPLEMENT_FACTS_BASE_HEIGHT = 361.08;
  const SUPPLEMENT_FACTS_ROW_HEIGHT = 30.84;
  const SUPPLEMENT_FACTS_BASE_FINAL_THICK = 400.08;
  const SUPPLEMENT_FACTS_BASE_FOOTER = 413.22;
  const SUPPLEMENT_FACTS_BODY_FONT = 10.812;
  const SUPPLEMENT_FACTS_TITLE_FONT = 24.45;
  const SUPPLEMENT_FACTS_NAME_X = 68.51;
  const SUPPLEMENT_FACTS_AMOUNT_X = 465.66;
  const SUPPLEMENT_FACTS_DAILY_VALUE_X = 524.94;
  let supplementFactsMeasureCanvas = null;

  function supplementFactsTextWidth(value, fontSize, bold) {
    const text = String(value || '');
    if (!text) return 0;
    try {
      if (!supplementFactsMeasureCanvas) supplementFactsMeasureCanvas = document.createElement('canvas');
      const context = supplementFactsMeasureCanvas.getContext('2d');
      if (context) {
        context.font = (bold ? '700 ' : '400 ') + fontSize + 'px Arial';
        return context.measureText(text).width;
      }
    } catch (error) {
      // Fall back to a conservative estimate when canvas is unavailable.
    }
    return text.length * fontSize * 0.55;
  }

  function fitSupplementFactsIngredient(value, amount) {
    const name = String(value || '').trim();
    const amountWidth = supplementFactsTextWidth(amount, SUPPLEMENT_FACTS_BODY_FONT, false);
    const availableWidth = Math.max(120, Math.min(
      350,
      SUPPLEMENT_FACTS_AMOUNT_X - SUPPLEMENT_FACTS_NAME_X - amountWidth - 8
    ));
    let fontSize = SUPPLEMENT_FACTS_BODY_FONT;
    while (fontSize > 6.6 && supplementFactsTextWidth(name, fontSize, false) > availableWidth) fontSize -= 0.2;
    let text = name;
    if (supplementFactsTextWidth(text, fontSize, false) > availableWidth) {
      while (text.length > 4 && supplementFactsTextWidth(text + '...', fontSize, false) > availableWidth) text = text.slice(0, -1);
      text = text.trim() + '...';
    }
    return { text, fontSize };
  }

  function supplementFactsSvgText(x, top, value, options) {
    const config = options || {};
    const fontSize = Number(config.fontSize || SUPPLEMENT_FACTS_BODY_FONT);
    const baseline = top + fontSize * 0.79;
    const anchor = config.anchor ? ' text-anchor="' + config.anchor + '"' : '';
    const weight = config.bold ? ' font-weight="700"' : '';
    return '<text x="' + Number(x).toFixed(2) + '" y="' + baseline.toFixed(2) + '" font-size="' + fontSize.toFixed(3) + '"' + anchor + weight + '>' + escapeHtml(value) + '</text>';
  }

  function renderSupplementFactsSvg(value) {
    const draft = normalizeSupplementFactsDraft(value);
    const rows = Array.isArray(draft.rows) && draft.rows.length
      ? draft.rows
      : [{ name: '', amount: '', dailyValue: '' }];
    const delta = (rows.length - 8) * SUPPLEMENT_FACTS_ROW_HEIGHT;
    const outerHeight = SUPPLEMENT_FACTS_BASE_HEIGHT + delta;
    const finalThickTop = SUPPLEMENT_FACTS_BASE_FINAL_THICK + delta;
    const footerTop = SUPPLEMENT_FACTS_BASE_FOOTER + delta;
    const line = (x, top, width, height) => '<rect x="' + Number(x).toFixed(2) + '" y="' + Number(top).toFixed(2) + '" width="' + Number(width).toFixed(2) + '" height="' + Number(height).toFixed(2) + '" fill="#000"></rect>';
    const parts = [
      '<svg class="pfh-supplement-facts-svg" xmlns="http://www.w3.org/2000/svg" width="' + SUPPLEMENT_FACTS_PAGE_WIDTH + '" height="' + SUPPLEMENT_FACTS_PAGE_HEIGHT + '" viewBox="0 0 ' + SUPPLEMENT_FACTS_PAGE_WIDTH + ' ' + SUPPLEMENT_FACTS_PAGE_HEIGHT + '" role="img" aria-label="Supplement Facts" shape-rendering="geometricPrecision">',
      '<rect x="' + SUPPLEMENT_FACTS_OUTER_LEFT + '" y="' + SUPPLEMENT_FACTS_OUTER_TOP + '" width="' + SUPPLEMENT_FACTS_OUTER_WIDTH + '" height="' + outerHeight.toFixed(2) + '" fill="#fff" stroke="#000" stroke-width="0.6"></rect>',
      '<g font-family="Arial, Helvetica, sans-serif" fill="#000">',
      supplementFactsSvgText(70.45, 80.42, draft.title, { fontSize: SUPPLEMENT_FACTS_TITLE_FONT, bold: true }),
      supplementFactsSvgText(70.45, 104.08, 'Serving Size ' + draft.servingSize),
      supplementFactsSvgText(70.45, 116.91, 'Serving Per Container ' + draft.servingsPerContainer),
      line(65.76, 129.84, 460.92, 1.8),
      supplementFactsSvgText(68.51, 139.58, 'Amount Per Serving', { bold: true }),
      supplementFactsSvgText(445.08, 139.58, '% Daily Value', { bold: true }),
      line(66.36, 153.96, 459.72, 0.6),
    ];
    rows.forEach((row, index) => {
      const top = 166.02 + index * SUPPLEMENT_FACTS_ROW_HEIGHT;
      const fit = fitSupplementFactsIngredient(row.name, row.amount);
      if (index < rows.length - 1) parts.push(line(66.36, 184.80 + index * SUPPLEMENT_FACTS_ROW_HEIGHT, 459.72, 0.6));
      parts.push(supplementFactsSvgText(SUPPLEMENT_FACTS_NAME_X, top, fit.text, { fontSize: fit.fontSize }));
      parts.push(supplementFactsSvgText(SUPPLEMENT_FACTS_AMOUNT_X, top, row.amount, { anchor: 'end' }));
      parts.push(supplementFactsSvgText(SUPPLEMENT_FACTS_DAILY_VALUE_X, top, row.dailyValue || '**', { anchor: 'end' }));
    });
    parts.push(line(65.76, finalThickTop, 460.92, 1.8));
    if (draft.showFooter) parts.push(supplementFactsSvgText(68.51, footerTop, '**Daily Value not established.'));
    parts.push('</g></svg>');
    return parts.join('');
  }




  function renderSupplementFactsPreviewInline() {
    const panel = ensurePanel();
    const preview = panel.querySelector('.pfh-supplement-facts-preview');
    if (preview) preview.innerHTML = renderSupplementFactsSvg(state.supplementFactsDraft);
  }

  function supplementFactsFilename(value) {
    let filename = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
    if (!filename) filename = 'supplement-facts.pdf';
    if (!/\.pdf$/i.test(filename)) filename += '.pdf';
    return filename;
  }

  function getSupplementFactsExportDraft() {
    const draft = normalizeSupplementFactsDraft(state.supplementFactsDraft);
    const rows = draft.rows.filter((row) => row.name || row.amount || (row.dailyValue && row.dailyValue !== '**'));
    if (!rows.length) {
      showToast('请至少填写一行成分');
      return null;
    }
    if (rows.length > 18) {
      showToast('单页最多支持 18 行成分');
      return null;
    }
    for (let index = 0; index < rows.length; index += 1) {
      if (!rows[index].name) {
        showToast('第 ' + (index + 1) + ' 行缺少成分名称');
        return null;
      }
      if (!rows[index].amount) {
        showToast('第 ' + (index + 1) + ' 行缺少每份含量');
        return null;
      }
    }
    return {
      ...draft,
      filename: supplementFactsFilename(draft.filename),
      rows: rows.map((row) => ({ ...row, dailyValue: row.dailyValue || '**' })),
    };
  }

  function printSupplementFactsPdf() {
    const draft = getSupplementFactsExportDraft();
    if (!draft) return;
    const popup = window.open('', '_blank', 'width=900,height=900,scrollbars=yes');
    if (!popup) {
      showToast('打印窗口被浏览器拦截，请允许弹出窗口后重试');
      return;
    }
    const title = escapeHtml(draft.filename);
    popup.document.open();
    popup.document.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + title + '</title><style>@page{size:A4;margin:0}html,body{margin:0;padding:0;width:595.25pt;min-height:841.85pt;background:#fff}body{overflow:hidden}.pfh-supplement-facts-svg{display:block;width:595.25pt;height:841.85pt;background:#fff}</style></head><body>' + renderSupplementFactsSvg(draft) + '</body></html>');
    popup.document.close();
    popup.focus();
    window.setTimeout(() => {
      try { popup.print(); } catch (error) { showToast('打印窗口已打开，请手动选择打印或另存为 PDF'); }
    }, 450);
    showToast('已打开打印窗口，请选择“另存为 PDF”');
  }

  function toolsViewHtml() {
    const activeTool = normalizeToolsActiveTool(state.toolsActiveTool);
    state.toolsActiveTool = activeTool;
    const navItems = [
      ['unit', 'calculator', '厘米换算英寸'],
      ['code', 'tag', '编码格式化'],
      ['copywriting', 'sparkle', '批量文案补全'],
    ];
    const content = activeTool === 'unit'
      ? unitConverterToolPanelHtml()
      : (activeTool === 'code' ? codeFormatterToolPanelHtml() : toyCopywritingBatchCardHtml());
    const nav = navItems.map((item) => '<button type="button" data-action="tools-select" data-tool="' + item[0] + '" class="' + (item[0] === activeTool ? 'is-active' : '') + '" aria-current="' + (item[0] === activeTool ? 'page' : 'false') + '">' + iconHtml(item[1]) + '<span>' + item[2] + '</span></button>').join('');
    return '<div class="pfh-detail-scroll"><section class="pfh-mini-tool-page pfh-tools-page">' +
      '<div class="pfh-mini-tool-head pfh-tools-head"><button type="button" class="pfh-upload-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div><small>QUICK TOOLS</small><h2>小工具</h2><p>厘米换算、编码格式化和批量玩具文案补全，统一在这里切换。</p></div></div>' +
      '<div class="pfh-tools-workbench"><aside class="pfh-tools-sidebar"><div class="pfh-tools-sidebar-head"><small>TOOLS</small><strong>工具列表</strong></div><nav class="pfh-tools-nav" aria-label="小工具列表">' + nav + '</nav></aside><main class="pfh-tools-content">' + content + '</main></div>' +
      '</section></div>';
  }

  function toyCopywritingBatchCardHtml() {
    const queueIsActive = state.toyCopywritingBatchRunning || state.toyCopywritingApplyRunning;
    const queue = queueIsActive
      ? (state.toyCopywritingBatchQueue || loadToyCopywritingBatchQueue())
      : loadToyCopywritingBatchQueue();
    state.toyCopywritingBatchQueue = queue;
    const stats = getToyCopywritingBatchStats(queue);
    const running = Boolean(state.toyCopywritingBatchRunning);
    const applying = Boolean(state.toyCopywritingApplyRunning);
    const downloadReviewing = applying && isToyCopywritingDownloadOnlyMode(state.toyCopywritingApplyMode);
    const locked = running || applying;
    const canStart = !locked && queue.some((entry) => entry.status === 'pending' || entry.status === 'error');
    const canApply = !locked && queue.some((entry) => {
      return (entry.status === 'success' || entry.status === 'noop') && entry.applyStatus !== 'submitted';
    });
    const progressText = state.toyCopywritingBatchStatus || (running
      ? '正在通过 PLM API 读取项目状态，再按状态进入设计任务或商品管理补全文案并生成图片，请保持 PLM 页面登录状态。'
      : '输入 SKU 后，系统会自动识别玩具并只补全缺失的中英文文案字段。');
    return '<section class="pfh-mini-tool-card pfh-tools-panel pfh-toy-copywriting-batch-page">' +
      '<div class="pfh-toy-copywriting-batch-head"><small>TOY COPYWRITING</small><h3>批量智能玩具文案补全</h3><p>只需输入 SKU，自动逐个补全并保存 PLM 草稿。</p></div>' +
      '<div class="pfh-toy-copywriting-batch-card pfh-toy-copywriting-batch-form"><label>SKU 编码</label><textarea class="pfh-toy-copywriting-batch-input" placeholder="例如：SKU00047214\nSKU00047213\nSKU00047212">' + escapeHtml(state.toyCopywritingBatchInput || '') + '</textarea><p class="pfh-toy-copywriting-batch-hint">支持每行一个，也支持空格、逗号或直接粘贴一串文本；重复编码会自动合并。非玩具、基础卖点缺失或保存失败的编码会停在失败列表中。</p><div class="pfh-mini-tool-actions"><button type="button" data-action="toy-copywriting-batch-clear-input">清空</button><button type="button" data-action="toy-copywriting-batch-add">加入文案队列</button></div></div>' +
      '<div class="pfh-toy-copywriting-batch-card"><div class="pfh-toy-copywriting-batch-summary"><strong>文案补全队列</strong><span>共 ' + stats.total + ' 个 · 已完成 ' + stats.done + ' 个 · 待处理 ' + stats.pending + ' 个 · 失败 ' + stats.error + ' 个</span></div><div class="pfh-toy-copywriting-batch-queue">' + getToyCopywritingBatchRowsHtml(queue, locked) + '</div><p class="pfh-toy-copywriting-batch-progress">' + escapeHtml(progressText) + '</p><div class="pfh-mini-tool-actions pfh-toy-copywriting-batch-actions"><button type="button" data-action="toy-copywriting-batch-start"' + (canStart ? '' : ' disabled') + '>' + (running ? '正在补全…' : '开始补全文案') + '</button><button type="button" data-action="toy-copywriting-batch-pause"' + (running ? '' : ' disabled') + '>暂停</button><button type="button" data-action="toy-copywriting-batch-apply"' + (canApply ? '' : ' disabled') + '>' + (applying && !downloadReviewing ? '正在全部应用并提审…' : '批量全部应用并提审') + '</button><button type="button" data-action="toy-copywriting-batch-download-review" title="通过生图 API 查询并按主图、详情图顺序下载，不全部应用、不提审"' + (canApply ? '' : ' disabled') + '>' + (downloadReviewing ? '正在下载生图…' : '下载全部主图和详情图') + '</button><button type="button" data-action="toy-copywriting-batch-clear-completed"' + (stats.done && !locked ? '' : ' disabled') + '>清除已完成</button></div></div>' +
      '</section>';
  }

  function batchExcelViewHtml() {
    const queue = loadExcelBatchQueue();
    state.batchExcelQueue = queue;
    const stats = getExcelBatchQueueStats(queue);
    const mode = state.batchExcelMode === 'merge' ? 'merge' : 'separate';
    const running = Boolean(state.batchExcelWorkerRunning);
    const downloading = Boolean(state.batchExcelDownloadRunning);
    const modeDisabled = running || downloading ? ' disabled' : '';
    const canDownload = stats.generatable > 0 && !running && !downloading;
    const progressText = state.batchExcelStatus || (running ? '正在按顺序补全缓存，请保持 PLM 页面登录状态。' : '数据不完整也可生成；缺失字段会留空，缺少产品图时不插入图片。');
    return '<div class="pfh-detail-scroll"><section class="pfh-mini-tool-page pfh-batch-excel-page">' +
      '<div class="pfh-mini-tool-head pfh-batch-excel-head"><button type="button" class="pfh-upload-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button><div><small>BATCH EXCEL</small><h2>批量生成 Excel</h2><p>输入多个 SKU，补全资料后按需要分别下载或合并下载。</p></div></div><div data-lucian-excel-slot></div>' +
      '<div class="pfh-batch-excel-top"><div class="pfh-mini-tool-card pfh-batch-excel-card pfh-batch-excel-form"><label>SKU 编码</label><textarea class="pfh-batch-excel-input" placeholder="例如：SKU00046398\nSKU00046397\nSKU00046396\nSKU00046395">' + escapeHtml(state.batchExcelInput || '') + '</textarea><p class="pfh-batch-excel-hint">每行一个或直接粘贴一串编码，重复 SKU 会自动合并。</p><div class="pfh-mini-tool-actions"><button type="button" data-action="batch-excel-clear-input">清空</button><button type="button" data-action="batch-excel-add">加入补全队列</button></div></div><div class="pfh-mini-tool-card pfh-batch-excel-card pfh-batch-excel-mode-card"><div class="pfh-batch-excel-mode-head"><strong>导出方式</strong><span>下载前可随时切换</span></div><div class="pfh-batch-excel-mode"><button type="button" data-action="batch-excel-mode" data-mode="separate" class="pfh-batch-excel-mode-option is-separate' + (mode === 'separate' ? ' is-active' : '') + '" aria-pressed="' + (mode === 'separate' ? 'true' : 'false') + '"' + modeDisabled + '>' + iconHtml('download') + '<span><b>分别下载</b><small>每个 SKU 一个文件</small></span></button><button type="button" data-action="batch-excel-mode" data-mode="merge" class="pfh-batch-excel-mode-option is-merge' + (mode === 'merge' ? ' is-active' : '') + '" aria-pressed="' + (mode === 'merge' ? 'true' : 'false') + '"' + modeDisabled + '>' + iconHtml('batchExcel') + '<span><b>合并下载</b><small>合成一个工作簿</small></span></button></div><p class="pfh-batch-excel-mode-hint">分别下载方便逐个发送；合并下载适合一次性整理。</p></div></div>' +
      '<div class="pfh-mini-tool-card pfh-batch-excel-card pfh-batch-excel-queue-card"><div class="pfh-batch-excel-summary"><div><strong>补全与下载队列</strong><small>上下滑动浏览全部任务</small></div><span>共 ' + stats.total + ' 个 · 完整 ' + stats.ready + ' 个 · 可生成 ' + stats.partial + ' 个</span></div><div class="pfh-batch-excel-queue">' + getExcelBatchQueueRowsHtml(queue, running || downloading) + '</div><div class="pfh-batch-excel-footer"><p class="pfh-batch-excel-progress">' + escapeHtml(progressText) + '</p><div class="pfh-mini-tool-actions pfh-batch-excel-actions"><button type="button" class="is-prepare" data-action="batch-excel-prepare"' + (running || downloading || !queue.length ? ' disabled' : '') + '>' + (running ? '<i class="pfh-loading-dots" aria-hidden="true"><i></i><i></i><i></i></i>' : iconHtml('refresh')) + (running ? '正在补全…' : '补全数据') + '</button><button type="button" class="is-download" data-action="batch-excel-download"' + (canDownload ? '' : ' disabled') + '>' + (downloading ? '<i class="pfh-loading-dots" aria-hidden="true"><i></i><i></i><i></i></i>' : iconHtml('download')) + (mode === 'merge' ? '合并下载 Excel' : '分别下载 Excel') + '</button><button type="button" class="is-clear" data-action="batch-excel-clear-completed"' + (stats.downloaded ? '' : ' disabled') + '>清除已下载</button></div></div></div>' +
      '</section></div>';
  }

  function getExcelBatchQueueStats(queue) {
    const items = Array.isArray(queue) ? queue : [];
    return items.reduce((stats, entry) => {
      const snapshot = getExcelBatchCacheSnapshot(entry.sku);
      if (entry.status === 'downloaded') stats.downloaded += 1;
      const generatable = entry.status !== 'preparing';
      if (generatable) stats.generatable += 1;
      if (!snapshot.missing.length && generatable && entry.status !== 'error') stats.ready += 1;
      else if (generatable) stats.partial += 1;
      else stats.pending += 1;
      stats.total += 1;
      return stats;
    }, { total: 0, ready: 0, partial: 0, pending: 0, generatable: 0, downloaded: 0 });
  }

  function getExcelBatchQueueRowsHtml(queue, locked) {
    if (!Array.isArray(queue) || !queue.length) return taskEmptyStateHtml('Excel 队列暂无任务', '先粘贴 SKU，再加入补全队列。');
    return queue.map((entry) => {
      const snapshot = getExcelBatchCacheSnapshot(entry.sku);
      const missing = snapshot.missing;
      const status = getExcelBatchEntryStatus(entry, missing);
      const statusClass = status.kind === 'ready' ? 'is-ready' : (status.kind === 'error' ? 'is-error' : 'is-pending');
      const title = snapshot.data.name || snapshot.data.englishName || '未读取产品名称';
      const detail = status.kind === 'ready'
        ? (entry.status === 'downloaded' ? '已生成文件，可再次下载' : '缓存字段完整，等待下载')
        : (status.text + (missing.length ? '：' + missing.join('、') : '') + (entry.error ? ' / ' + entry.error : ''));
      const retry = !locked && status.kind !== 'ready' ? '<button type="button" data-action="batch-excel-retry" data-sku="' + escapeHtml(entry.sku) + '" title="重新补全">↻</button>' : '';
      return '<div class="pfh-batch-excel-row"><div class="pfh-batch-excel-row-main"><b>' + escapeHtml(entry.sku) + '</b><small title="' + escapeHtml(title + ' / ' + detail) + '">' + escapeHtml(title + ' · ' + detail) + '</small></div><span class="pfh-batch-excel-status ' + statusClass + '">' + escapeHtml(status.text) + '</span>' + retry + '<button type="button" data-action="batch-excel-remove" data-sku="' + escapeHtml(entry.sku) + '" title="移除">×</button></div>';
    }).join('');
  }

  function getExcelBatchEntryStatus(entry, missing) {
    const current = String(entry && entry.status || 'pending');
    if (current === 'preparing') return { kind: 'pending', text: '补全中' };
    if (current === 'error') return { kind: 'error', text: '补全失败，可生成' };
    if (current === 'downloaded') return { kind: 'ready', text: '已下载' };
    if (!missing.length) return { kind: 'ready', text: '缓存完整' };
    if (current === 'partial') return { kind: 'pending', text: '数据不完整，可生成' };
    return { kind: 'pending', text: '待补全，可生成' };
  }

  function getToyCopywritingBatchStats(queue) {
    return (Array.isArray(queue) ? queue : []).reduce((stats, entry) => {
      const status = String(entry && entry.status || 'pending');
      stats.total += 1;
      if (status === 'success' || status === 'noop') stats.done += 1;
      else if (status === 'error') stats.error += 1;
      else stats.pending += 1;
      return stats;
    }, { total: 0, done: 0, pending: 0, error: 0 });
  }

  function getToyCopywritingBatchEntryStatus(entry) {
    const status = String(entry && entry.status || 'pending');
    const applyStatus = String(entry && entry.applyStatus || '');
    const downloadOnly = isToyCopywritingDownloadOnlyMode(entry && entry.applyMode);
    if (applyStatus === 'applying') return { kind: 'running', text: downloadOnly ? '下载生图中' : '应用中' };
    if (applyStatus === 'applied') return { kind: 'running', text: downloadOnly ? '下载完成' : '应用完成，提审中' };
    if (applyStatus === 'downloaded') return { kind: 'done', text: '已下载生图' };
    if (applyStatus === 'submitted') return { kind: 'done', text: '已提审' };
    if (applyStatus === 'error' && (status === 'success' || status === 'noop')) {
      return { kind: 'error', text: downloadOnly ? '下载生图失败' : '应用失败' };
    }
    if (status === 'processing') return { kind: 'running', text: '补全中' };
    if (status === 'success') return { kind: 'done', text: '已完成' };
    if (status === 'noop') return { kind: 'done', text: '无需补充' };
    if (status === 'error') return { kind: 'error', text: '补全失败' };
    return { kind: 'pending', text: '待处理' };
  }

  function getToyCopywritingBatchRowsHtml(queue, locked) {
    if (!Array.isArray(queue) || !queue.length) return '<div class="pfh-toy-copywriting-batch-empty">还没有编码。先粘贴 SKU，再加入文案队列。</div>';
    return queue.map((entry) => {
      const status = getToyCopywritingBatchEntryStatus(entry);
      const data = normalizeData(loadData(entry.sku) || {});
      const title = entry.name || data.name || '等待读取产品名称';
      const generatedImages = Number(entry.generatedImages) || 0;
      const submitted = entry.applyStatus === 'submitted';
      const downloaded = entry.applyStatus === 'downloaded';
      const detail = downloaded
        ? '主图/详情图已下载（未全部应用，未提审）'
        : submitted
        ? (entry.applyMode === 'download-review' ? '主图/详情图已下载并提审（未全部应用）' : '主图/详情图已全部应用并提审')
        : (entry.status === 'success'
          ? (/已生成/.test(entry.step || '')
            ? entry.step
            : '已补充 ' + (Number(entry.filledCount) || 0) + ' 个字段并保存草稿' + (generatedImages ? '，主图/详情图请求已触发' : '')) + (entry.applyError ? ' / ' + entry.applyError : '')
          : (entry.status === 'noop' ? '现有文案已完整' + (entry.applyError ? ' / ' + entry.applyError : '') : (entry.error || entry.step || '等待处理')));
      const retry = !locked && entry.status === 'error' ? '<button type="button" data-action="toy-copywriting-batch-retry" data-sku="' + escapeHtml(entry.sku) + '" title="重新补全">↻</button>' : '';
      const remove = !locked ? '<button type="button" data-action="toy-copywriting-batch-remove" data-sku="' + escapeHtml(entry.sku) + '" title="移除">×</button>' : '';
      return '<div class="pfh-toy-copywriting-batch-row"><div class="pfh-toy-copywriting-batch-row-main"><b>' + escapeHtml(entry.sku) + '</b><small title="' + escapeHtml(title + ' / ' + detail) + '">' + escapeHtml(title + ' · ' + detail) + '</small></div><span class="pfh-toy-copywriting-batch-status is-' + status.kind + '">' + escapeHtml(status.text) + '</span>' + retry + remove + '</div>';
    }).join('');
  }

  function extractToyCopywritingBatchSkus(value) {
    const seen = new Set();
    return extractSearchCodes(value).filter((item) => /^SKU\d+$/i.test(item)).map((item) => String(item).toUpperCase()).filter((sku) => {
      if (seen.has(sku)) return false;
      seen.add(sku);
      return true;
    });
  }

  function addToyCopywritingBatchItems(value) {
    const skus = extractToyCopywritingBatchSkus(value);
    if (!skus.length) {
      showToast('没有找到有效 SKU，请检查编码格式');
      return;
    }
    const existing = new Map(loadToyCopywritingBatchQueue().map((entry) => [entry.sku, entry]));
    const now = Date.now();
    skus.forEach((sku, index) => {
      const previous = existing.get(sku);
      const data = normalizeData(loadData(sku) || {});
      existing.set(sku, {
        ...(previous || {}),
        id: previous && previous.id || 'toy-copywriting-' + sku + '-' + now + '-' + index,
        sku,
        name: data.name || previous && previous.name || '',
        status: 'pending',
        step: '等待打开设计任务编辑入口',
        error: '',
        filledCount: 0,
        generatedImages: 0,
        applyStatus: '',
        applyError: '',
        projectStatus: data.projectStatus || previous && previous.projectStatus || '',
        projectRowId: data.projectRowId || previous && previous.projectRowId || '',
        createdAt: previous && previous.createdAt || now,
        updatedAt: now,
      });
    });
    state.toyCopywritingBatchInput = '';
    state.toyCopywritingBatchStatus = '已加入 ' + skus.length + ' 个 SKU，等待补全文案';
    saveToyCopywritingBatchQueue(Array.from(existing.values()));
    renderShell();
    showToast(state.toyCopywritingBatchStatus);
  }

  function updateToyCopywritingBatchEntry(sku, patch) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const queue = Array.isArray(state.toyCopywritingBatchQueue) ? state.toyCopywritingBatchQueue : loadToyCopywritingBatchQueue();
    const next = queue.map((entry) => entry.sku === normalizedSku ? { ...entry, ...(patch || {}), updatedAt: Date.now() } : entry);
    saveToyCopywritingBatchQueue(next);
    return next.find((entry) => entry.sku === normalizedSku) || null;
  }

  function removeToyCopywritingBatchItem(sku) {
    if (state.toyCopywritingBatchRunning) {
      showToast('当前队列正在处理，请先暂停后再移除');
      return;
    }
    const normalizedSku = String(sku || '').trim().toUpperCase();
    saveToyCopywritingBatchQueue(loadToyCopywritingBatchQueue().filter((entry) => entry.sku !== normalizedSku));
    renderShell();
  }

  function retryToyCopywritingBatchItem(sku) {
    if (state.toyCopywritingBatchRunning) return;
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!loadToyCopywritingBatchQueue().some((entry) => entry.sku === normalizedSku)) return;
    updateToyCopywritingBatchEntry(normalizedSku, { status: 'pending', step: '等待重新补全', error: '', filledCount: 0 });
    renderShell();
  }

  function clearCompletedToyCopywritingBatch() {
    if (state.toyCopywritingBatchRunning) return;
    saveToyCopywritingBatchQueue(loadToyCopywritingBatchQueue().filter((entry) => entry.status !== 'success' && entry.status !== 'noop'));
    state.toyCopywritingBatchStatus = '已清除已完成项目';
    renderShell();
  }

  function pauseToyCopywritingBatch() {
    if (!state.toyCopywritingBatchRunning) return;
    state.toyCopywritingBatchRunning = false;
    const currentSku = state.toyCopywritingBatchCurrentSku;
    if (currentSku) updateToyCopywritingBatchEntry(currentSku, { status: 'pending', step: '已暂停，等待继续', error: '' });
    state.toyCopywritingBatchCurrentSku = '';
    state.toyCopywritingBatchStatus = '已暂停，已完成项目保留在队列中';
    saveToyCopywritingBatchQueue(state.toyCopywritingBatchQueue);
    renderShell();
  }

  async function startToyCopywritingBatch() {
    if (state.toyCopywritingBatchRunning || state.toyCopywritingApplyRunning) return;
    state.toyCopywritingBatchQueue = loadToyCopywritingBatchQueue();
    const pending = state.toyCopywritingBatchQueue.filter((entry) => entry.status === 'pending' || entry.status === 'error');
    if (!pending.length) {
      state.toyCopywritingBatchStatus = state.toyCopywritingBatchQueue.length ? '当前队列没有待处理项目' : '队列暂为空';
      renderShell();
      return;
    }
    state.toyCopywritingBatchRunning = true;
    state.toyCopywritingBatchStatus = '开始批量补全文案';
    saveToyCopywritingBatchQueue(state.toyCopywritingBatchQueue);
    renderShell();
    try {
      await processToyCopywritingBatch();
    } catch (error) {
      state.toyCopywritingBatchRunning = false;
      state.toyCopywritingBatchCurrentSku = '';
      state.toyCopywritingBatchStatus = '批量处理异常：' + formatErrorMessage(error);
      renderShell();
    }
  }

  async function processToyCopywritingBatch() {
    const queue = state.toyCopywritingBatchQueue || [];
    const routeMap = await prepareToyCopywritingBatchRoutes(queue.filter((entry) => entry.status === 'pending' || entry.status === 'error'));
    for (const entry of queue) {
      if (!state.toyCopywritingBatchRunning) break;
      if (entry.status !== 'pending' && entry.status !== 'error') continue;
      const sku = entry.sku;
      state.toyCopywritingBatchCurrentSku = sku;
      updateToyCopywritingBatchEntry(sku, { status: 'processing', step: '正在按项目状态打开对应编辑入口', error: '' });
      let drawer = null;
      try {
        const cached = normalizeData(loadData(sku) || (state.index || []).find((item) => item.sku === sku) || { sku });
        drawer = await openToyCopywritingBatchDrawer(sku, cached, routeMap.get(sku));
        const data = getPageToyCopywritingData(drawer, sku);
        if (!isToyCopywritingProduct(data)) throw new Error('当前编码未识别为玩具，已跳过');
        updateToyCopywritingBatchEntry(sku, { name: data.name || cached.name || '', step: '正在补全中英文缺失字段' });
        const filledCount = await fillToyCopywriting({ data, fromPage: true, throwOnError: true });
        const imageResult = await generateToyImagesForBatch(drawer, sku);
        const generatedImages = imageResult.completed;
        const imageStep = imageResult.triggered === 2
          ? '文案已保存，主图和详情图生成请求已触发'
          : (imageResult.triggered
            ? '已有图片保留，其余图片生成请求已触发'
            : 'PLM 中主图和详情图均已生成');
        updateToyCopywritingBatchEntry(sku, {
          status: filledCount || generatedImages ? 'success' : 'noop',
          step: imageStep,
          error: '',
          filledCount: filledCount || 0,
          generatedImages,
        });
      } catch (error) {
        const message = formatErrorMessage(error) || '文案补全失败';
        updateToyCopywritingBatchEntry(sku, { status: 'error', step: '处理失败', error: message });
        addLog('error', '批量玩具文案补充失败', sku + ' | ' + message);
      } finally {
        if (drawer || getToyCopywritingDrawerForSku(sku) || getProjectDrawerForSku(sku)) {
          await closeToyCopywritingDrawerForSku(sku).catch(() => {});
        }
        state.toyCopywritingBatchCurrentSku = '';
        saveToyCopywritingBatchQueue(state.toyCopywritingBatchQueue);
        if (state.toyCopywritingBatchRunning) {
          state.toyCopywritingBatchStatus = '已处理 ' + sku + '，继续下一个编码';
          renderShell();
        }
      }
    }
    if (state.toyCopywritingBatchRunning) {
      state.toyCopywritingBatchRunning = false;
      state.toyCopywritingBatchStatus = '批量文案补全完成';
      state.toyCopywritingBatchCurrentSku = '';
      saveToyCopywritingBatchQueue(state.toyCopywritingBatchQueue);
      renderShell();
      showToast('批量玩具文案补全完成');
    }
  }

  function normalizeToyCopywritingBatchApiRoute(sku, item, fallback) {
    const row = item && typeof item === 'object' ? item : {};
    const cached = fallback && typeof fallback === 'object' ? fallback : {};
    const projectStatus = compactText([
      row.status_format,
      row.status,
      row.project_status_format,
      row.project_status,
      row.projectStatus,
    ].map((value) => String(value || '').trim()).find(Boolean) || cached.projectStatus || '');
    const projectRowId = String(
      row.id || row.project_id || row.chemical_id || row.project_row_id || row.projectRowId || cached.projectRowId || '',
    ).trim();
    return {
      sku: String(sku || '').trim().toUpperCase(),
      projectStatus,
      projectRowId,
      completed: projectStatus ? /已完成/.test(projectStatus) : Boolean(cached.completed),
    };
  }

  function findToyCopywritingBatchApiRow(items, sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    return (Array.isArray(items) ? items : []).find((item) => {
      const itemSku = String(item && (item.product_code || item.productCode || item.sku || item.sku_code || item.skuCode || '') || '')
        .trim()
        .toUpperCase();
      return itemSku === normalizedSku;
    }) || null;
  }

  async function queryToyCopywritingBatchApiRoute(sku, fallback) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const endpoints = [
      '/api/ChemicalNewAll/GetList?page=1&pageSize=20&product_codes=' + encodeURIComponent(normalizedSku),
      '/api/ChemicalNewDesignTask/GetList?page=1&pageSize=20&product_codes=' + encodeURIComponent(normalizedSku),
    ];
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const payload = await fetchPlmJson(endpoint);
        const row = findToyCopywritingBatchApiRow(getApiListItems(payload), normalizedSku);
        if (row) return normalizeToyCopywritingBatchApiRoute(normalizedSku, row, fallback);
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
    return null;
  }

  async function prepareToyCopywritingBatchRoutes(entries) {
    const skus = Array.from(new Set((entries || []).map((entry) => String(entry && entry.sku || '').trim().toUpperCase()).filter(Boolean)));
    const routes = new Map();
    if (!skus.length) return routes;
    const projectSkus = [];
    const fallbackRoutes = new Map();
    skus.forEach((sku) => {
      const cached = normalizeData(loadData(sku) || (state.index || []).find((item) => item && item.sku === sku) || {});
      const isManual = Boolean(cached.skuListSource === 'manual-code' || cached.manualSkuAddedAt || cached.manualSkuAddedAtMs);
      const projectStatus = compactText(cached.projectStatus || '');
      const fallback = {
        projectStatus: isManual ? '' : projectStatus,
        projectRowId: String(cached.projectRowId || cached.projectId || ''),
        completed: isManual || /已完成/.test(projectStatus),
      };
      routes.set(sku, fallback);
      fallbackRoutes.set(sku, fallback);
      if (isManual) {
        updateToyCopywritingBatchEntry(sku, {
          projectStatus: '',
          projectRowId: '',
          step: '手动添加 SKU，准备从商品管理打开',
        });
      } else {
        projectSkus.push(sku);
      }
    });
    if (!projectSkus.length) return routes;
    updateToyCopywritingBatchEntry(projectSkus[0], { step: '正在通过 PLM API 读取项目状态' });
    state.toyCopywritingBatchStatus = '正在通过 PLM API 读取项目状态';
    renderShell();
    const results = await Promise.all(projectSkus.map(async (sku) => {
      const fallback = fallbackRoutes.get(sku) || {};
      try {
        const route = await withCopywritingTimeout(
          queryToyCopywritingBatchApiRoute(sku, fallback),
          30000,
          '项目 API 查询 ' + sku,
        );
        return { sku, route: route || fallback, error: route ? '' : '项目 API 未返回该 SKU' };
      } catch (error) {
        return { sku, route: fallback, error: formatErrorMessage(error) || '项目 API 查询失败' };
      }
    }));
    results.forEach(({ sku, route, error }) => {
      const resolved = route || fallbackRoutes.get(sku) || {};
      routes.set(sku, {
        projectStatus: compactText(resolved.projectStatus || ''),
        projectRowId: String(resolved.projectRowId || ''),
        completed: Boolean(resolved.completed),
      });
      if (error) addLog('warn', '批量玩具文案：项目 API 查询未命中，继续使用缓存/页面路线', sku + ' | ' + error);
      updateToyCopywritingBatchEntry(sku, {
        projectStatus: resolved.projectStatus || undefined,
        projectRowId: resolved.projectRowId || undefined,
        step: resolved.completed ? '项目已完成，准备从商品管理打开' : '项目未完成，准备从设计任务打开',
      });
    });
    return routes;
  }

  function getToyImageSectionState(drawer, label) {
    if (!drawer) return null;
    const expectedLabel = compactText(label);
    const expectedButton = compactText('AI一键生成');
    const buttons = Array.from(drawer.querySelectorAll('button, a, [role="button"], span.startBtn'))
      .filter(isVisibleElement)
      .filter((button) => compactText(button.innerText || button.textContent) === expectedButton);
    for (const button of buttons) {
      let current = button.parentElement;
      for (let depth = 0; current && current !== drawer && depth < 10; depth += 1, current = current.parentElement) {
        const text = compactText(getVisibleText(current));
        if (!text.includes(expectedLabel)) continue;
        const media = Array.from(current.querySelectorAll('img'))
          .map((img) => img.currentSrc || img.src || img.alt || 'img')
          .join('|');
        return {
          button,
          signature: [text, media, button.className || '', button.disabled ? 'disabled' : 'ready'].join('|'),
        };
      }
    }
    return null;
  }

  function isToyImageButtonBusy(button) {
    if (!button) return false;
    const text = compactText(button.innerText || button.textContent);
    const className = String(button.className || '');
    const html = String(button.innerHTML || '');
    return Boolean(
      button.disabled
      || button.getAttribute('aria-disabled') === 'true'
      || button.getAttribute('aria-busy') === 'true'
      || /\bloading\b|ant-btn-loading|ant-btn-disabled|ant-spin/.test(className + ' ' + html)
      || button.querySelector('.ant-spin, [aria-busy="true"]')
      || /生成中|处理中|上传中|排队中/.test(text)
    );
  }

  async function clickToyImageAiGenerate(drawer, sku, label) {
    const currentDrawer = getToyCopywritingDrawerForSku(sku) || drawer;
    if (isToyImageAlreadyGenerated(currentDrawer, label)) return false;
    const before = getToyImageSectionState(currentDrawer, label);
    if (!before || !before.button) throw new Error('未找到' + label + '的 AI一键生成按钮');
    if (!isActionButtonReady(before.button)) throw new Error(label + ' AI一键生成按钮不可用');
    const beforeText = compactText(before.button.innerText || before.button.textContent);
    clickElement(before.button);
    const started = await waitFor(() => {
      const liveDrawer = getToyCopywritingDrawerForSku(sku) || drawer;
      const current = getToyImageSectionState(liveDrawer, label);
      if (!current) {
        const buttonText = compactText(before.button.innerText || before.button.textContent);
        return !document.body.contains(before.button) || !isVisibleElement(before.button) || buttonText !== beforeText ? before : '';
      }
      return isToyImageButtonBusy(current.button) || current.signature !== before.signature ? current : '';
    }, 5000, 100);
    if (!started) throw new Error(label + ' AI一键生成未进入加载态');
    return true;
  }

  async function generateToyImagesForBatch(drawer, sku) {
    let triggered = 0;
    let completed = 0;
    for (const label of ['主图', '详情图']) {
      const currentDrawer = getToyCopywritingDrawerForSku(sku) || drawer;
      if (isToyImageAlreadyGenerated(currentDrawer, label)) {
        updateToyCopywritingBatchEntry(sku, { step: label + '已生成，继续检查下一项' });
        completed += 1;
        continue;
      }
      updateToyCopywritingBatchEntry(sku, { step: '正在点击' + label + ' AI一键生成' });
      if (await clickToyImageAiGenerate(currentDrawer, sku, label)) triggered += 1;
      completed += 1;
    }
    return { triggered, completed };
  }

  function getToyGeneratedImageSection(drawer, label) {
    if (!drawer) return null;
    const expected = compactText(label);
    return Array.from(drawer.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => {
        const labelNode = item.querySelector('.ant-form-item-label, label');
        const text = compactText(labelNode && (labelNode.innerText || labelNode.textContent)).replace(/[*：:]/g, '');
        return text.startsWith(expected) && /已生成|点击查看|AI(?:一键|重新)生成/.test(getVisibleText(item));
      }) || null;
  }

  function isToyImageAlreadyGenerated(drawer, label) {
    const section = getToyGeneratedImageSection(drawer, label);
    return Boolean(
      section
      && getVisibleText(section).includes('已生成')
      && findToyGeneratedImageAction(section, '点击查看')
    );
  }

  function findToyGeneratedImageAction(scope, text) {
    if (!scope) return null;
    const expected = compactText(text).replace(/\s+/g, '');
    return Array.from(scope.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .filter(isActionButtonReady)
      .find((element) => compactText(element.innerText || element.textContent).replace(/\s+/g, '') === expected) || null;
  }

  function getToyImagePreviewContainer() {
    const applyActions = Array.from(document.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .filter((element) => compactText(element.innerText || element.textContent).replace(/\s+/g, '') === '全部应用');
    for (const action of applyActions) {
      const modal = action.closest('.ant-modal, .ant-drawer-open, [role="dialog"], .ant-image-preview-wrap');
      if (modal && getVisibleText(modal).includes('下载图片')) return modal;
      let fallback = null;
      let current = action.parentElement;
      for (let depth = 0; current && current !== document.body && depth < 14; depth += 1, current = current.parentElement) {
        const text = getVisibleText(current);
        if (!text.includes('下载图片') || !text.includes('全部应用')) continue;
        fallback = current;
        if (findDrawerCloseButton(current)) return current;
      }
      if (fallback) return fallback;
    }
    return null;
  }

  async function closeToyImagePreviewIfPresent() {
    const preview = getToyImagePreviewContainer();
    if (!preview) return true;
    const close = findDrawerCloseButton(preview)
      || findToyGeneratedImageAction(preview, '关闭');
    if (!close) throw new Error('未找到生成图片预览关闭按钮');
    clickElement(close);
    return Boolean(await waitFor(() => {
      return !document.body.contains(preview) || !isVisibleElement(preview) || !getToyImagePreviewContainer();
    }, 10000, 100));
  }

  async function applyToyGeneratedImage(drawer, sku, label, options) {
    const opts = options || {};
    const section = await waitFor(() => {
      const liveDrawer = getToyCopywritingDrawerForSku(sku) || drawer;
      const current = getToyGeneratedImageSection(liveDrawer, label);
      return current && findToyGeneratedImageAction(current, '点击查看') ? current : null;
    }, 300000, 1000);
    if (!section) throw new Error(label + '等待生成完成超时');
    const view = findToyGeneratedImageAction(section, '点击查看');
    if (!view) throw new Error(label + '未找到「点击查看」');
    clickElement(view);
    const preview = await waitFor(() => getToyImagePreviewContainer(), 15000, 150);
    if (!preview) throw new Error(label + '生成图片预览未打开');

    const download = findToyGeneratedImageAction(preview, '下载图片');
    if (!download) throw new Error(label + '未找到「下载图片」');
    clickElement(download);
    const directUse = await waitFor(() => findToyGeneratedImageAction(document.body, '直接使用'), 2500, 100);
    if (directUse) {
      clickElement(directUse);
      const submitDownload = await waitFor(() => findToyGeneratedImageAction(document.body, '提交并下载'), 5000, 100);
      if (!submitDownload) throw new Error(label + '评价后未找到「提交并下载」');
      clickElement(submitDownload);
      const downloadSubmitted = await waitFor(() => {
        return !findToyGeneratedImageAction(document.body, '提交并下载');
      }, 15000, 100);
      if (!downloadSubmitted) throw new Error(label + '「提交并下载」未完成');
    }

    const livePreview = await waitFor(() => getToyImagePreviewContainer(), 10000, 100);
    if (!livePreview) throw new Error(label + '下载后图片预览已意外关闭');
    if (opts.skipApply) {
      if (!(await closeToyImagePreviewIfPresent())) throw new Error(label + '图片预览未关闭');
      return true;
    }
    const applyAll = findToyGeneratedImageAction(livePreview, '全部应用');
    if (!applyAll) throw new Error(label + '未找到「全部应用」');
    await waitFor(() => !/应用成功/.test(getPlmNoticeText()), 5000, 100);
    clickElement(applyAll);
    const applied = await waitFor(() => /应用成功/.test(getPlmNoticeText()), 45000, 100);
    if (!applied) throw new Error(label + '点击全部应用后未收到「应用成功」');
    if (!(await closeToyImagePreviewIfPresent())) throw new Error(label + '图片预览未关闭');
    return true;
  }

  function isToyCopywritingDownloadOnlyMode(mode) {
    return mode === 'download' || mode === 'download-review';
  }

  function ensureToyCopywritingLedgerRecord(sku, entry, dateKey) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const normalizedDate = normalizeLedgerDate(dateKey) || getTodayKey();
    const existing = findLedgerRecord(normalizedSku, normalizedDate);
    if (existing) return existing;
    const cached = normalizeData(loadData(normalizedSku) || { sku: normalizedSku });
    const data = {
      ...cached,
      sku: normalizedSku,
      name: cached.name || String(entry && entry.name || '').trim(),
    };
    return upsertDailyLedgerFromData(data, { date: normalizedDate, isToy: true });
  }

  async function queryToyGeneratedImagesForDownload(sku, entry) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const dateKey = getTodayKey();
    ensureToyCopywritingLedgerRecord(normalizedSku, entry, dateKey);
    for (let attempt = 0; attempt < LEDGER_AI_IMAGE_MAX_POLLS; attempt += 1) {
      const result = await queryLedgerAiImageStatus(normalizedSku, dateKey, {
        openViewer: false,
        reopenViewerOnUpdate: false,
        poll: false,
      });
      const record = findLedgerRecord(normalizedSku, dateKey);
      const status = normalizeLedgerAiImageStatus(record && record.aiImageStatus, record && record.aiImageMessage);
      const mainCount = normalizeLedgerAiImageItems(record && record.aiMainImages, 12).length;
      const detailCount = normalizeLedgerAiImageItems(record && record.aiDetailImages, 20).length;
      if (status === 'success' && (mainCount || detailCount)) return record;
      if (['error', 'task-error', 'result-missing', 'empty', 'needs-copywriting', 'needs-sku-image', 'needs-prerequisites'].includes(status)) {
        const message = String(record && record.aiImageMessage || (result && result.aiImageMessage) || '未返回可下载的生图结果').trim();
        throw new Error('生图后台查询失败：' + message);
      }
      updateToyCopywritingBatchEntry(normalizedSku, { step: '后台查询生图结果中（第 ' + (attempt + 1) + ' 次）' });
      state.toyCopywritingBatchStatus = normalizedSku + '：后台查询生图结果中（第 ' + (attempt + 1) + ' 次）';
      renderShell();
      if (attempt + 1 < LEDGER_AI_IMAGE_MAX_POLLS) await wait(LEDGER_AI_IMAGE_POLL_DELAY_MS);
    }
    throw new Error('生图后台查询超时，暂未返回主图和详情图');
  }

  async function downloadToyGeneratedImagesForBatch(sku, entry) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const dateKey = getTodayKey();
    updateToyCopywritingBatchEntry(normalizedSku, { step: '正在通过后台服务查询已生成图片' });
    state.toyCopywritingBatchStatus = normalizedSku + '：正在通过后台服务查询已生成图片';
    renderShell();
    const record = await queryToyGeneratedImagesForDownload(normalizedSku, entry);
    const downloadKinds = [
      { kind: 'main', label: '主图', count: normalizeLedgerAiImageItems(record.aiMainImages, 12).length },
      { kind: 'detail', label: '详情图', count: normalizeLedgerAiImageItems(record.aiDetailImages, 20).length },
    ];
    const missing = downloadKinds.filter((item) => !item.count).map((item) => item.label);
    if (missing.length) throw new Error('生图后台未返回' + missing.join('、') + '，无法完成全部下载');
    for (const item of downloadKinds) {
      updateToyCopywritingBatchEntry(normalizedSku, { step: '正在下载全部' + item.label + '（' + item.count + ' 张）' });
      state.toyCopywritingBatchStatus = normalizedSku + '：正在下载全部' + item.label + '（' + item.count + ' 张）';
      renderShell();
      if (!(await downloadLedgerAiImageZip(normalizedSku, dateKey, item.kind))) {
        throw new Error('下载全部' + item.label + '失败');
      }
    }
    return downloadKinds;
  }

  async function startToyCopywritingApplyBatch(options) {
    const opts = options || {};
    const skipApply = Boolean(opts.skipApply);
    const actionLabel = skipApply ? '批量下载生成图片' : '批量全部应用并提审';
    const applyMode = skipApply ? 'download' : 'apply';
    if (state.toyCopywritingBatchRunning || state.toyCopywritingApplyRunning) return;
    state.toyCopywritingBatchQueue = loadToyCopywritingBatchQueue();
    const eligible = state.toyCopywritingBatchQueue.filter((entry) => {
      return (entry.status === 'success' || entry.status === 'noop') && entry.applyStatus !== 'submitted';
    });
    if (!eligible.length) {
      state.toyCopywritingBatchStatus = '没有等待' + actionLabel + '的已完成产品';
      renderShell();
      return;
    }
    state.toyCopywritingApplyRunning = true;
    state.toyCopywritingApplyMode = applyMode;
    state.toyCopywritingBatchStatus = '开始' + actionLabel;
    renderShell();
    let routeMap = new Map();
    if (!skipApply) {
      try {
        routeMap = await prepareToyCopywritingBatchRoutes(eligible);
      } catch (error) {
        state.toyCopywritingApplyRunning = false;
        state.toyCopywritingApplyMode = '';
        state.toyCopywritingBatchStatus = actionLabel + '前读取项目状态失败：' + formatErrorMessage(error);
        addLog('error', '玩具生成图片：读取项目状态失败', formatErrorMessage(error));
        renderShell();
        return;
      }
    }
    for (const entry of eligible) {
      const sku = entry.sku;
      let drawer = null;
      state.toyCopywritingApplyCurrentSku = sku;
      updateToyCopywritingBatchEntry(sku, { applyStatus: 'applying', applyMode, applyError: '', step: '正在打开设计资料' });
      state.toyCopywritingBatchStatus = sku + '：正在打开设计资料';
      renderShell();
      try {
        const cached = normalizeData(loadData(sku) || (state.index || []).find((item) => item.sku === sku) || { sku });
        if (skipApply) {
          await downloadToyGeneratedImagesForBatch(sku, cached);
          updateToyCopywritingBatchEntry(sku, {
            applyStatus: 'downloaded',
            applyMode: 'download',
            applyError: '',
            step: '主图和详情图已下载（未全部应用，未提审）',
          });
          addLog('success', '玩具生成图片下载成功（未提审）', sku);
        } else {
          drawer = await openToyCopywritingBatchDrawer(sku, cached, routeMap.get(sku));
          for (const label of ['主图', '详情图']) {
            updateToyCopywritingBatchEntry(sku, { step: '正在处理' + label + '生成图片' });
            state.toyCopywritingBatchStatus = sku + '：正在下载' + label + '并全部应用';
            renderShell();
            await applyToyGeneratedImage(drawer, sku, label, { skipApply: false });
          }
          updateToyCopywritingBatchEntry(sku, { applyStatus: 'applied', applyMode, step: '主图和详情图已全部应用，正在提审' });
          state.toyCopywritingBatchStatus = sku + '：正在提审';
          renderShell();
          await submitProductReview();
          await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
          updateToyCopywritingBatchEntry(sku, {
            applyStatus: 'submitted',
            applyMode,
            applyError: '',
            step: '主图和详情图已全部应用并提审',
          });
          addLog('success', '玩具生成图片' + actionLabel + '成功', sku);
        }
      } catch (error) {
        const message = formatErrorMessage(error) || actionLabel + '失败';
        updateToyCopywritingBatchEntry(sku, { applyStatus: 'error', applyMode, applyError: message, step: actionLabel + '失败' });
        addLog('error', '玩具生成图片' + actionLabel + '失败', sku + ' | ' + message);
        await closeToyImagePreviewIfPresent().catch(() => {});
        await closeToyCopywritingDrawerForSku(sku).catch(() => {});
      } finally {
        state.toyCopywritingApplyCurrentSku = '';
        state.toyCopywritingBatchStatus = '已处理 ' + sku + '，继续下一个编码';
        renderShell();
      }
    }
    state.toyCopywritingApplyRunning = false;
    state.toyCopywritingApplyCurrentSku = '';
    state.toyCopywritingApplyMode = '';
    state.toyCopywritingBatchStatus = actionLabel + '完成';
    renderShell();
    showToast(actionLabel + '完成');
  }

  async function openToyCopywritingBatchDrawer(sku, seed, route) {
    const existingCopywritingDrawer = getToyCopywritingDrawerForSku(sku);
    if (existingCopywritingDrawer) return existingCopywritingDrawer;
    const existingEditDrawer = getProductEditDrawerForSku(sku);
    if (existingEditDrawer) {
      updateToyCopywritingBatchEntry(sku, { step: '正在进入玩具文案编辑页' });
      return ensureToyCopywritingDrawerFromProductEdit(sku);
    }
    const currentDrawer = getToyCopywritingDrawerForSku('') || getProjectDrawer();
    const currentSku = currentDrawer && getProjectDrawerHeaderSku(currentDrawer);
    if (currentDrawer && currentSku !== sku) await closeToyCopywritingDrawerForSku(currentSku).catch(() => {});
    const openFromProductManagement = async (step) => {
      updateToyCopywritingBatchEntry(sku, { step: step || '项目未找到设计任务编辑入口，正在商品管理中搜索编码' });
      await ensureProductManagementPageInPlace();
      await searchProductManagementSku(sku);
      await openProductEditDrawer(sku);
      return ensureToyCopywritingDrawerFromProductEdit(sku);
    };
    if (route && route.completed) {
      return openFromProductManagement('项目已完成，正在商品管理中搜索编码');
    }
    if (!(await ensureNewProductProjectPage())) {
      addLog('info', '批量玩具文案：未能打开新品开发，改用商品管理', sku);
      return openFromProductManagement('新品开发不可用，正在商品管理中搜索编码');
    }
    if (!(await ensureDesignTaskTab())) {
      addLog('info', '批量玩具文案：未能进入设计任务，改用商品管理', sku);
      return openFromProductManagement('设计任务不可用，正在商品管理中搜索编码');
    }
    let rowId = route && route.projectRowId || seed && (seed.projectRowId || seed.projectId) || '';
    if (!rowId || !findOperationButtonByRowId(rowId, '编辑')) rowId = await queryDesignTaskRowIdBySku(sku);
    if (!rowId) {
      addLog('info', '批量玩具文案：设计任务未找到编辑入口，改用商品管理', sku);
      return openFromProductManagement();
    }
    if (!(await clickProjectEditByRowId(rowId, sku))) {
      addLog('info', '批量玩具文案：设计任务编辑抽屉未打开，改用商品管理', sku);
      await closeToyCopywritingDrawerForSku(sku).catch(() => {});
      return openFromProductManagement();
    }
    cacheProjectRowId(sku, rowId);
    const drawer = await waitFor(() => getToyCopywritingDrawerForSku(sku), 15000, 150);
    if (!drawer) throw new Error('编辑抽屉未加载');
    updateToyCopywritingBatchEntry(sku, { step: '正在进入玩具文案编辑页' });
    return advanceToyCopywritingDrawerToFields(drawer, sku);
  }

  async function ensureToyCopywritingDrawerFromProductEdit(sku) {
    let drawer = await waitFor(() => getToyCopywritingDrawerForSku(sku), 8000, 150);
    if (!drawer) {
      await enterProductEditSecondStep(sku);
      drawer = await waitFor(() => getToyCopywritingDrawerForSku(sku), 30000, 150);
    }
    if (!drawer) throw new Error('商品管理编辑页未加载出玩具文案字段');
    return advanceToyCopywritingDrawerToFields(drawer, sku);
  }

  function formatCmInchLines(value) {
    const values = String(value || '').trim().split(/[\s×xX*、,，;；]+/).filter((item) => /^\d+(?:\.\d+)?(?:cm)?$/i.test(item));
    return values.map((item) => {
      const cm = Number(item.replace(/cm$/i, ''));
      return cm + 'cm/' + formatToolNumber(cm * CM_TO_INCH) + 'inch';
    }).join('\n');
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

  function getActiveSizeImageData() {
    const source = state.sizeImageFreeMode ? state.sizeImageCustomData : (state.sizeImageCustomData || state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    return source ? normalizeData(source) : null;
  }

  function getActiveSizeImageSku() {
    const data = getActiveSizeImageData();
    return data && data.sku ? String(data.sku) : '';
  }

  function formatSizeImageCustomDimensionText(value, fallbackNums) {
    const text = String(value || '').trim();
    if (text) return text;
    const nums = Array.isArray(fallbackNums) ? fallbackNums.map(Number).filter((item) => Number.isFinite(item) && item > 0) : [];
    return nums.length ? nums.map(formatSizeImageNumber).join(' × ') + ' cm' : '';
  }

  function getSizeImageCustomDraft(data) {
    const source = data && data.sku ? data : {};
    const sku = source.sku || '';
    const session = sku ? ensureSizeImageSession(sku) : null;
    const remarks = getSizeImageRemarks(source);
    const labelSpecs = getLabelSizeImageSpecs(source);
    const firstLabel = labelSpecs[0] || null;
    const customFlatKind = source.sizeImageCustomFlatKind === 'label' || source.sizeImageCustomFlatKind === 'print'
      ? source.sizeImageCustomFlatKind
      : (!firstLabel || firstLabel.kind === 'label' ? 'label' : 'print');
    return {
      sku: source.sizeImageFreeSku !== undefined ? source.sizeImageFreeSku : (source.sizeImageNoSku ? '' : sku),
      brand: source.brand || '',
      name: source.name || '',
      packageTitle: source.sizeImageCustomPackageTitle || source.packageSizeLabel || '纸盒',
      packageSizeText: formatSizeImageCustomDimensionText(source.packageSizeText, source.packageNums),
      packageCode: source.packageCode || '',
      flatKind: customFlatKind,
      flatTitle: source.sizeImageCustomFlatTitle || source.printSizeLabel || (customFlatKind === 'label' ? '标签' : '印刷'),
      flatSizeText: source.printSizeText || '',
      flatCode: source.printCode || '',
      cartonRemark: source.sizeImageCustomCartonRemark || (session && session.cartonRemarkText) || remarks.carton || '',
      flatRemark: source.sizeImageCustomFlatRemark || (session && firstLabel && session.labelRemarkTexts[firstLabel.key]) || remarks.label || '',
      includeRemark: !session || session.includeRemark !== false,
      includeRoundArc: !session || session.includeRoundArc !== false,
      includeBatchNumber: !session || session.includeBatchNumber !== false,
    };
  }

  function sizeImageCustomInput(key, label, value, placeholder, wide) {
    return '<label class="pfh-size-image-custom-field' + (wide ? ' is-wide' : '') + '"><span>' + escapeHtml(label) + '</span><input type="text" data-size-image-custom-key="' + escapeHtml(key) + '" value="' + escapeHtml(value || '') + '" placeholder="' + escapeHtml(placeholder || '') + '"></label>';
  }

  function sizeImageCustomModalHtml() {
    if (!state.sizeImageCustomOpen) return '';
    const draft = state.sizeImageCustomDraft || getSizeImageCustomDraft(getActiveSizeImageData());
    const selectedLabel = draft.flatKind === 'label' ? ' selected' : '';
    const selectedPrint = draft.flatKind === 'print' ? ' selected' : '';
    return '<div class="pfh-size-image-custom-layer" data-action="size-image-custom-close">' +
      '<div class="pfh-size-image-custom-modal" role="dialog" aria-modal="true" aria-label="自定义尺寸图">' +
        '<div class="pfh-size-image-custom-head"><div><h3>自定义尺寸图</h3><p>填写实际尺寸后上传底图；图片可识别类型和比例，无法直接确定实际尺寸。</p></div><button type="button" class="pfh-size-image-custom-close" data-action="size-image-custom-close" aria-label="关闭">×</button></div>' +
        '<div class="pfh-size-image-custom-form">' +
          '<section class="pfh-size-image-custom-section"><strong class="pfh-size-image-custom-section-title">基础信息</strong><div class="pfh-size-image-custom-grid">' +
            sizeImageCustomInput('sku', 'SKU（可不填）', draft.sku, '例如 SKU00050446') +
            sizeImageCustomInput('brand', '品牌', draft.brand, '可不填') +
            sizeImageCustomInput('name', '商品名称', draft.name, '可不填', true) +
          '</div></section>' +
          '<section class="pfh-size-image-custom-section"><strong class="pfh-size-image-custom-section-title">纸盒信息</strong><div class="pfh-size-image-custom-grid">' +
            sizeImageCustomInput('packageTitle', '纸盒标题', draft.packageTitle, '纸盒') +
            sizeImageCustomInput('packageCode', '纸盒物料编码', draft.packageCode, '可不填') +
            sizeImageCustomInput('packageSizeText', '纸盒尺寸（长×宽×高）', draft.packageSizeText, '例如 5.2×5.2×4.6cm', true) +
          '</div><p class="pfh-size-image-custom-hint">支持 3 个尺寸；多页纸盒可填写 5 个尺寸，例如 5.2×5.2×4.6×5.2×5.2cm。纸盒尺寸可留空，只生成标签/印刷图。</p></section>' +
          '<section class="pfh-size-image-custom-section"><strong class="pfh-size-image-custom-section-title">标签 / 印刷信息</strong><div class="pfh-size-image-custom-grid">' +
            '<label class="pfh-size-image-custom-field"><span>平面图类型</span><select data-size-image-custom-key="flatKind"><option value="label"' + selectedLabel + '>标签</option><option value="print"' + selectedPrint + '>印刷</option></select></label>' +
            sizeImageCustomInput('flatTitle', '标签 / 印刷标题', draft.flatTitle, '例如 标签、印刷') +
            sizeImageCustomInput('flatCode', '标签 / 印刷物料编码', draft.flatCode, '可不填') +
            sizeImageCustomInput('flatSizeText', '平面图尺寸（宽×高）', draft.flatSizeText, '例如 10×2.3cm', true) +
          '</div><p class="pfh-size-image-custom-hint">可填写多个宽×高尺寸，用分号隔开；纸盒、标签、印刷至少填写一组有效尺寸。</p></section>' +
          '<section class="pfh-size-image-custom-section"><strong class="pfh-size-image-custom-section-title">标题备注与生成选项</strong><div class="pfh-size-image-custom-grid">' +
            sizeImageCustomInput('cartonRemark', '纸盒备注', draft.cartonRemark, '例如 多页、内卡') +
            sizeImageCustomInput('flatRemark', '标签 / 印刷备注', draft.flatRemark, '例如 透明、加粘') +
          '</div><div class="pfh-size-image-custom-checks"><label><input type="checkbox" data-size-image-custom-key="includeRemark"' + (draft.includeRemark ? ' checked' : '') + '>生成标题备注</label><label><input type="checkbox" data-size-image-custom-key="includeRoundArc"' + (draft.includeRoundArc ? ' checked' : '') + '>标签圆弧</label><label><input type="checkbox" data-size-image-custom-key="includeBatchNumber"' + (draft.includeBatchNumber ? ' checked' : '') + '>批次号</label></div></section>' +
        '</div>' +
        '<div class="pfh-size-image-custom-foot"><button type="button" class="is-secondary" data-action="size-image-custom-close">取消</button><button type="button" class="is-primary" data-action="size-image-custom-save">保存并继续</button></div>' +
      '</div>' +
    '</div>';
  }

  function openSizeImageCustomEditor() {
    state.sizeImageCustomDraft = getSizeImageCustomDraft(getActiveSizeImageData());
    state.sizeImageCustomOpen = true;
    expandPanel();
    renderShell();
    window.setTimeout(() => {
      const input = ensurePanel().querySelector('[data-size-image-custom-key="sku"]');
      if (input) input.focus();
    }, 0);
  }

  function closeSizeImageCustomEditor() {
    state.sizeImageCustomOpen = false;
    state.sizeImageCustomDraft = null;
    renderShell();
  }

  function readSizeImageCustomField(panel, key) {
    const input = panel && panel.querySelector('[data-size-image-custom-key="' + key + '"]');
    return input ? String(input.value || '').trim() : '';
  }

  function saveSizeImageCustomConfig() {
    const panel = ensurePanel();
    const enteredSku = readSizeImageCustomField(panel, 'sku');
    const sku = state.sizeImageFreeMode || !enteredSku ? '__PFH_FREE_SIZE__' : enteredSku;
    const previousData = state.sizeImageCustomData;
    const previousSession = previousData && state.sizeImageSessions[previousData.sku];
    const previousSpecs = previousData ? getLabelSizeImageSpecs(previousData) : [];
    const packageSizeText = readSizeImageCustomField(panel, 'packageSizeText');
    const flatSizeText = readSizeImageCustomField(panel, 'flatSizeText');
    const flatKind = readSizeImageCustomField(panel, 'flatKind') === 'label' ? 'label' : 'print';
    const packageTitle = readSizeImageCustomField(panel, 'packageTitle') || '纸盒';
    const flatTitle = readSizeImageCustomField(panel, 'flatTitle') || (flatKind === 'label' ? '标签' : '印刷');
    const customData = normalizeData({
      sku,
      brand: readSizeImageCustomField(panel, 'brand'),
      name: readSizeImageCustomField(panel, 'name'),
      packageSizeLabel: packageTitle,
      packageSizeText,
      packageCode: readSizeImageCustomField(panel, 'packageCode'),
      printSizeLabel: flatTitle,
      printSizeText: flatSizeText,
      printRawText: flatTitle,
      printCode: readSizeImageCustomField(panel, 'flatCode'),
      materialDimensionUnitIssues: { package: null, print: null },
      isCustomSizeImage: true,
      sizeImageNoSku: !enteredSku,
      ...(state.sizeImageFreeMode ? { sizeImageFreeSku: enteredSku } : {}),
      sizeImageCustomFlatKind: flatKind,
      sizeImageCustomPackageTitle: packageTitle,
      sizeImageCustomFlatTitle: flatTitle,
      sizeImageCustomCartonRemark: readSizeImageCustomField(panel, 'cartonRemark'),
      sizeImageCustomFlatRemark: readSizeImageCustomField(panel, 'flatRemark'),
    });
    const cartonSpec = getSizeImageSpec(customData);
    const labelSpecs = getLabelSizeImageSpecs(customData);
    if (packageSizeText && !cartonSpec && !isPrintedBagPackageDimensionData(customData)) {
      showToast('纸盒尺寸格式不正确，请填写 3 个或 5 个数字');
      return;
    }
    if (flatSizeText && !labelSpecs.length) {
      showToast('标签 / 印刷尺寸格式不正确，请填写宽×高');
      return;
    }
    if (!cartonSpec && !labelSpecs.length) {
      showToast('纸盒或标签 / 印刷至少填写一组有效尺寸');
      return;
    }
    state.sizeImageCustomData = customData;
    state.sizeImageCustomDraft = null;
    state.sizeImageCustomOpen = false;
    delete state.sizeImageSessions[customData.sku];
    const session = ensureSizeImageSession(customData.sku);
    if (previousSession) {
      session.cartonFile = cartonSpec ? previousSession.cartonFile : null;
      labelSpecs.forEach((spec, index) => {
        const previousSpec = previousSpecs[index];
        if (previousSpec && previousSpec.kind === spec.kind && previousSession.flatFiles[previousSpec.key]) {
          session.flatFiles[spec.key] = previousSession.flatFiles[previousSpec.key];
        }
      });
      session.fileName = previousSession.fileName || '';
    }
    session.includeRemark = Boolean(panel.querySelector('[data-size-image-custom-key="includeRemark"]')?.checked);
    session.includeRoundArc = Boolean(panel.querySelector('[data-size-image-custom-key="includeRoundArc"]')?.checked);
    session.includeBatchNumber = Boolean(panel.querySelector('[data-size-image-custom-key="includeBatchNumber"]')?.checked);
    session.cartonRemarkText = customData.sizeImageCustomCartonRemark || '';
    if (labelSpecs[0]) session.labelRemarkTexts[labelSpecs[0].key] = customData.sizeImageCustomFlatRemark || '';
    state.view = 'sizeImage';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
    if (session.cartonFile || Object.keys(session.flatFiles).length) {
      showToast('尺寸已更新，正在重新生成');
      regenerateCurrentSizeImages();
    } else {
      showToast('自定义尺寸已保存，请上传纸盒或标签底图');
    }
  }

  function sizeImageViewHtml() {
    const data = getActiveSizeImageData();
    if (!data || !data.sku) {
      return '<div class="pfh-detail-view-frame">' + (state.sizeImageFreeMode ? '<button type="button" class="pfh-upload-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button>' : detailViewTabsHtml('sizeImage')) + '<div class="pfh-detail-scroll pfh-size-image-scroll"><section class="pfh-size-image-page"><div class="pfh-size-image-empty"><strong>自定义尺寸图</strong><p>填写纸盒或标签尺寸后，即可粘贴、拖入或选择底图。</p><button type="button" class="pfh-size-image-custom-button" data-action="size-image-custom-open">填写尺寸</button></div></section></div>' + sizeImageCustomModalHtml() + '</div>';
    }
    const cartonSpec = getSizeImageSpec(data);
    const labelSpecs = getLabelSizeImageSpecs(data);
    const labelSpec = labelSpecs[0] || null;
    const session = ensureSizeImageSession(data.sku);
    migrateLegacySizeImageResult(session, labelSpec);
    const transparentLabel = hasTransparentSizeImageLabel(data, labelSpecs);
    if (transparentLabel) {
      session.includeRoundArc = false;
      session.includeBatchNumber = false;
    }
    const transparentOptionAttrs = transparentLabel ? ' disabled title="\u900f\u660e\u6807\u7b7e\u5df2\u81ea\u52a8\u53d6\u6d88\u8be5\u9009\u9879"' : '';
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
      const combinedLegacyRemark = labelSpecs.length > 1 && session.labelRemarkTexts[spec.key] === remarks.label;
      if (typeof session.labelRemarkTexts[spec.key] !== 'string' || combinedLegacyRemark) session.labelRemarkTexts[spec.key] = getSizeImageSpecRemark(data, spec);
    });
    const remarkInputs = [
      cartonSpec ? '<label><span>\u7eb8\u76d2</span><input type="text" class="pfh-size-image-remark-text" data-size-image-type="carton" value="' + escapeHtml(session.cartonRemarkText) + '" placeholder="\u7eb8\u76d2\u6807\u9898\u5907\u6ce8"></label>' : '',
      ...labelSpecs.map((spec) => {
        const flatLabel = spec.kind === 'print' ? '\u5370\u5237' : '\u6807\u7b7e';
        const detail = formatSizeImageNumber(spec.width) + '\u00d7' + formatSizeImageNumber(spec.height);
        return '<label><span>' + flatLabel + ' ' + detail + '</span><input type="text" class="pfh-size-image-remark-text" data-size-image-type="label" data-size-image-key="' + escapeHtml(spec.key) + '" value="' + escapeHtml(session.labelRemarkTexts[spec.key]) + '" placeholder="' + flatLabel + '\u6807\u9898\u5907\u6ce8"></label>';
      }),
    ].filter(Boolean).join('');
    const pendingMatch = sizeImagePendingMatchHtml(session, cartonSpec, labelSpecs);
    return '<div class="pfh-detail-view-frame">' + (state.sizeImageFreeMode ? '<button type="button" class="pfh-upload-back" data-action="home-back" aria-label="返回主页">' + iconHtml('backArrow') + '</button>' : detailViewTabsHtml('sizeImage')) + '<div class="pfh-detail-scroll pfh-size-image-scroll"><section class="pfh-size-image-page">' +
      '<header class="pfh-size-image-hero"><div class="pfh-size-image-hero-media">' + productThumbHtml(data) + '</div><div class="pfh-size-image-hero-copy"><small>SIZE IMAGE</small><h3>' + escapeHtml(data.sizeImageNoSku ? '自由尺寸图' : (data.sizeImageFreeSku || data.sku) + ' 尺寸图') + '</h3><p>' + escapeHtml([data.brand, data.name].filter(Boolean).join(' ') || (data.isCustomSizeImage ? '自定义数据' : '\u9009\u4e2d\u4ea7\u54c1')) + '</p></div><div class="pfh-size-image-hero-actions"><button type="button" class="pfh-size-image-custom-button" data-action="size-image-custom-open">' + (data.isCustomSizeImage ? '修改尺寸' : '自定义尺寸图') + '</button></div></header>' +
      (!(cartonSpec || labelSpec) ? '<div class="pfh-size-image-status is-error">' + escapeHtml(getSizeImageSpecError(data)) + '</div>' : '') +
      '<div class="pfh-size-image-workspace' + (busy ? ' is-busy' : '') + '"><div class="pfh-size-image-controls">' +
        '<div class="pfh-size-image-spec"><span>\u5df2\u8bfb\u53d6\u89c4\u683c</span><b>' + escapeHtml(dimensionText) + '</b><small>\u7eb8\u76d2\u6309\u5200\u6a21\u8f6e\u5ed3\u8bc6\u522b\uff1b\u6807\u7b7e\u548c\u5370\u5237\u6309\u5bbd\u9ad8\u6bd4\u4f8b\u8bc6\u522b\u3002</small></div>' +
        '<div class="pfh-size-image-remark-editor"><span>\u6807\u9898\u5907\u6ce8</span><div>' + remarkInputs + '</div></div>' +
        '<div class="pfh-size-image-options">' + (labelSpecs.some((spec) => spec.kind === 'label') ? '<label><input type="checkbox" class="pfh-size-image-round-arc-input"' + (session.includeRoundArc === false ? '' : ' checked') + transparentOptionAttrs + '><span>\u6807\u7b7e\u5706\u5f27</span></label>' : '') + '<label><input type="checkbox" class="pfh-size-image-batch-number-input"' + (session.includeBatchNumber === false ? '' : ' checked') + transparentOptionAttrs + '><span>\u6279\u6b21\u53f7</span></label></div>' +
        '<button type="button" class="pfh-size-image-drop' + (busy ? ' is-processing' : '') + '" data-action="size-image-pick"' + disabled + '>' + (busy ? '<i class="pfh-loading-scan" aria-hidden="true"></i>' : iconHtml('upload')) + '<strong>' + (busy ? escapeHtml(session.processingStep || '\u6b63\u5728\u5206\u6790\u5e76\u751f\u6210...') : '\u70b9\u51fb\u9009\u62e9\u6216\u62d6\u5165\u56fe\u7247') + '</strong><span>' + (busy ? '\u8bf7\u7a0d\u5019\uff0c\u5927\u5c3a\u5bf8\u56fe\u7247\u9700\u8981\u51e0\u79d2\u5904\u7406\u65f6\u95f4\u3002' : '\u9f20\u6807\u505c\u5728\u8fd9\u91cc\u53ef\u76f4\u63a5 Ctrl+V \u7c98\u8d34\u56fe\u7247\u3002\u7eb8\u76d2\u7528\u900f\u660e PNG\uff0c\u6807\u7b7e/\u5370\u5237\u652f\u6301 PNG / JPG\u3002') + '</span></button>' +
        (session.fileName ? '<p class="pfh-size-image-file">\u6700\u8fd1\u8bfb\u53d6\uff1a' + escapeHtml(session.fileName) + '</p>' : '') +
        '<div class="pfh-size-image-actions"><button type="button" class="is-secondary" data-action="size-image-regenerate"' + (canRegenerate && !busy ? '' : ' disabled') + '>' + iconHtml('refresh') + '\u91cd\u65b0\u751f\u6210</button><button type="button" class="is-primary" data-action="size-image-save-all"' + (resultCount && !busy ? '' : ' disabled') + '>' + iconHtml('download') + '\u53e6\u5b58\u5c3a\u5bf8\u56fe JPG</button></div>' +
        pendingMatch + '<input type="file" class="pfh-size-image-file-input" accept="image/png,image/jpeg,.png,.jpg,.jpeg" multiple>' + status +
      '</div>' + preview + '</div>' +
    '</section></div>' + sizeImageCustomModalHtml() + '</div>';
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

  function sizeImagePendingMatchHtml(session, cartonSpec, labelSpecs) {
    if (!session.pendingLabelMatches.length) return '';
    const cartonOption = cartonSpec ? '<option value="carton">纸盒 ' + escapeHtml([cartonSpec.length, cartonSpec.width, cartonSpec.height].map(formatSizeImageNumber).join(' × ')) + ' cm</option>' : '';
    const flatOptions = labelSpecs.map((spec) => '<option value="label:' + escapeHtml(spec.key) + '">' + escapeHtml((spec.kind === 'print' ? '印刷 ' : '标签 ') + formatSizeImageNumber(spec.width) + ' × ' + formatSizeImageNumber(spec.height) + ' cm') + '</option>').join('');
    return '<div class="pfh-size-image-match-list"><strong>请选择图片类型与对应尺寸</strong>' + session.pendingLabelMatches.map((pending) =>
      (pending.cartonError ? '<p role="status">' + escapeHtml(pending.file.name || '图片') + '：纸盒识别未通过，' + escapeHtml(pending.cartonError) + '</p>' : '') +
      '<div><span>' + escapeHtml(pending.file.name || '待匹配图片') + '</span><select class="pfh-size-image-match-select" aria-label="图片类型与尺寸" data-pending-id="' + escapeHtml(pending.id) + '"><option value="">请选择类型与尺寸</option>' + cartonOption + flatOptions + '</select><button type="button" data-action="size-image-confirm-match" data-pending-id="' + escapeHtml(pending.id) + '">确认生成</button></div>').join('') + '</div>';
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
    // A manually entered carton size may not have the derived material label.
    // The dimensions themselves are sufficient to identify the size-image input.
    if (!data || getMaterialDimensionUnitIssue(data, 'package') || isPrintedBagPackageDimensionData(data)) return null;
    const sourceNums = Array.isArray(data.packageNums) && data.packageNums.length
      ? data.packageNums
      : parseDimension(data.packageSizeText, 3);
    const nums = Array.isArray(sourceNums) ? sourceNums.map(Number) : [];
    if (![3, 5].includes(nums.length) || nums.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    return { length: nums[0], width: nums[1], height: nums[2], extraWidths: nums.slice(3) };
  }

  function getSizeImageSpecError(data) {
    if (Array.isArray(data && data.packageNums) && data.packageNums.length > 3) return '\u591a\u9875\u7eb8\u76d2\u9700\u8981\u201c\u957f X \u5bbd X \u9ad8 X \u7b2c\u4e94\u9762\u5bbd X \u7b2c\u516d\u9762\u5bbd\u201d\u5171 5 \u4e2a\u5c3a\u5bf8\u3002';
    return '\u672a\u627e\u5230\u53ef\u7528\u7684\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\u5c3a\u5bf8\uff0c\u8bf7\u5148\u5237\u65b0 PLM \u7f13\u5b58\u3002';
  }

  function isPrintedBagSizeImageData(data) {
    if (data && data.isPrintedBagOuterPackage) return true;
    const source = [
      data && data.printRawText,
      data && data.printSizeLabel,
      data && data.packageSizeLabel,
    ].filter(Boolean).join(' ');
    return /(?:\u5370\u5237\u81ea\u7acb\u888b|\u81ea\u7acb\u5370\u5237\u888b|\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u8f6f\u888b|\u888b\u5b50|\u888b\/\u819c\u7c7b)/.test(source);
  }

  function isPrintedBagPackageDimensionData(data) {
    if (data && data.isPrintedBagOuterPackage) return true;
    const packageLabel = String(data && data.packageSizeLabel || '').trim();
    const printLabel = String(data && data.printSizeLabel || '').trim();
    const label = [packageLabel, printLabel].filter(Boolean).join(' ');
    if (!label) return false;
    if (/(?:\u7eb8\u76d2|\u5f69\u76d2|\u7eb8\u7bb1|\u5305\u88c5\u76d2|\u5916\u76d2)/.test(packageLabel)) return false;
    return /(?:\u5370\u5237\u81ea\u7acb\u888b|\u81ea\u7acb\u5370\u5237\u888b|\u81ea\u7acb\u888b|\u5370\u5237\u888b|\u5305\u88c5\u888b|\u94dd\u7b94\u888b|\u81ea\u5c01\u888b|\u888b\/\u819c\u7c7b|\u8f6f\u888b|\u888b\u5b50)/.test(label)
      && !/(?:\u7eb8\u76d2|\u5f69\u76d2|\u7eb8\u7bb1|\u5305\u88c5\u76d2|\u5916\u76d2)/.test(packageLabel);
  }

  function getPrintedBagFlatDimensionPair(data) {
    // Printed self-standing bags may be stored as width x gusset x height;
    // naming and flat-image matching use only the two visible dimensions.
    if (!data || !isPrintedBagSizeImageData(data)) return null;
    const sources = [data.printSizeText, data.packageSizeText, data.printRawText];
    const pattern = /\d+(?:\.\d+)?\s*[xX\u00d7*]\s*\d+(?:\.\d+)?(?:\s*[xX\u00d7*]\s*\d+(?:\.\d+)?){0,3}\s*(?:cm|mm)?/i;
    for (const source of sources) {
      const match = String(source || '').match(pattern);
      if (!match) continue;
      const numbers = (match[0].match(/\d+(?:\.\d+)?/g) || []).map(Number);
      if (numbers.length < 2) continue;
      const divisor = /mm/i.test(match[0]) ? 10 : 1;
      const pair = numbers.length >= 3 ? [numbers[0], numbers[2]] : [numbers[0], numbers[1]];
      const result = pair.map((value) => value / divisor);
      if (result.every((value) => Number.isFinite(value) && value > 0)) return result;
    }
    return null;
  }

  function getLabelSizeImageSpecs(data) {
    // printSizeLabel is derived from the PLM material name and may be absent
    // in older/manual cache records. A valid width x height is enough here.
    if (!data) return [];
    if (getMaterialDimensionUnitIssue(data, 'print')) return [];
    const labels = String(data.printSizeLabel || '').split(/\s*[\uff1b;]\s*/).filter(Boolean);
    const codes = String(data.printCode || '').split(/\s*[\uff1b;]\s*/).filter(Boolean);
    const printedBag = isPrintedBagSizeImageData(data);
    const rawPrintLabel = /\u6807\u7b7e/.test(String(data.printRawText || '')) ? '\u6807\u7b7e' : '';
    const dimensions = [];
    const printedBagPair = printedBag ? getPrintedBagFlatDimensionPair(data) : null;
    const pattern = /(\d+(?:\.\d+)?)\s*[xX\u00d7*]\s*(\d+(?:\.\d+)?)\s*(cm|mm)?/ig;
    if (printedBagPair) {
      dimensions.push({ width: printedBagPair[0], height: printedBagPair[1] });
    } else {
      let match;
      while ((match = pattern.exec(String(data.printSizeText || '')))) {
        const divisor = String(match[3] || '').toLowerCase() === 'mm' ? 10 : 1;
        const width = Number(match[1]) / divisor;
        const height = Number(match[2]) / divisor;
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) dimensions.push({ width, height });
      }
    }
    const fallbackLabel = labels[0] || rawPrintLabel || (printedBag ? compactText(data.packageSizeLabel || '\u5370\u5237\u81ea\u7acb\u888b') : '');
    const fallbackCode = codes[0] || (printedBag ? compactText(data.packageCode || '') : '');
    return dimensions.map((dimension, index) => {
      const labelText = labels[index] || fallbackLabel;
      const customKind = data.sizeImageCustomFlatKind === 'label' || data.sizeImageCustomFlatKind === 'print' ? data.sizeImageCustomFlatKind : '';
      const kind = customKind || (/\u6807\u7b7e/.test([labelText, data.printSizeLabel, data.printRawText].filter(Boolean).join(' ')) && !data.isTubePrint ? 'label' : 'print');
      return {
        width: dimension.width,
        height: dimension.height,
        kind,
        index,
        key: 'flat-' + index + '-' + formatSizeImageNumber(dimension.width) + 'x' + formatSizeImageNumber(dimension.height),
        code: codes[index] || fallbackCode,
        labelText,
        remark: collectSizeImageRemark(labelText, []),
        printedBag: kind === 'print' && printedBag,
      };
    });
  }

  function getLabelSizeImageSpec(data) {
    return getLabelSizeImageSpecs(data)[0] || null;
  }

  function isDoubleSidedPrintedBagSizeImage(spec, geometry) {
    return Boolean(spec && spec.kind === 'print' && spec.printedBag && geometry && Number(geometry.panelCount) > 1);
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
      carton: (data && data.sizeImageCustomCartonRemark) || collectSizeImageRemark(data && data.packageSizeLabel, [data && data.hasInnerCard ? '\u5185\u5361' : '']),
      label: (data && data.sizeImageCustomFlatRemark) || collectSizeImageRemark(data && data.printSizeLabel, []),
    };
  }

  function getSizeImageSpecRemark(data, spec) {
    if (!spec) return '';
    const custom = String(data && data.sizeImageCustomFlatRemark || '').trim();
    if (custom) {
      if (/[；;]/.test(String(data && data.printSizeLabel || '')) && custom === collectSizeImageRemark(data.printSizeLabel, [])) return spec.remark || '';
      const entries = custom.split(/\s*[；;]\s*/);
      return entries.length > 1 ? entries[spec.index || 0] || '' : custom;
    }
    return spec.remark || '';
  }

  function isTransparentSizeImageLabel(data, spec) {
    if (!spec || spec.kind !== 'label') return false;
    const source = [
      data && data.printSizeLabel,
      data && data.printRawText,
      data && data.printSizeText,
      spec.labelText,
      spec.remark,
    ].filter(Boolean).join(' ');
    return /\u900f\u660e/.test(source) && !/(?:\u4e0d\u900f\u660e|\u975e\u900f\u660e)/.test(source);
  }

  function hasTransparentSizeImageLabel(data, specs) {
    return (Array.isArray(specs) ? specs : []).some((spec) => isTransparentSizeImageLabel(data, spec));
  }

  function formatSizeImageNumber(value) {
    return trimNumber(Number(value));
  }

  function yieldSizeImageUi() {
    return new Promise((resolve) => window.requestAnimationFrame(() => window.setTimeout(resolve, 0)));
  }

  function createSizeImageCanvas(width, height) {
    if (typeof document !== 'undefined' && document.createElement) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
    throw new Error('当前环境不支持 Canvas');
  }

  function getSizeImageSourceDimensions(image) {
    const width = Number(image && (image.naturalWidth || image.width));
    const height = Number(image && (image.naturalHeight || image.height));
    if (!(width > 0) || !(height > 0)) throw new Error('无法读取图片尺寸');
    return { width, height };
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
    await ensureCurrentTraceNameInitials();
    const data = getActiveSizeImageData();
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
      await setSizeImageProcessingStep(session, '\u6b63\u5728\u8bc6\u522b\u7eb8\u76d2\u6216\u6807\u7b7e...');
      const preferredLabelKey = String(preferredType || '').startsWith('label:') ? String(preferredType).slice(6) : '';
      const productImageAsset = labelSpecs.some((spec) => spec.printedBag)
        ? await loadSizeImageProductImage(data)
        : null;
      const workerResult = await runSizeImageWorker(file, preferredType, cartonSpec, labelSpecs, data, session, productImageAsset && productImageAsset.dataUrl);
      if (workerResult) {
        if (workerResult.status === 'pending') {
          const pendingId = 'pending-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          session.pendingLabelMatches = session.pendingLabelMatches.filter((item) => item.file !== file);
          session.pendingLabelMatches.push({ id: pendingId, file, cartonError: workerResult.cartonError || '' });
          session.error = '';
          if (!silent) showToast('无法唯一确定图片类型与尺寸，请手动选择');
          return 'pending';
        }
        const workerMatchedLabelSpec = workerResult.detectedType === 'label'
          ? labelSpecs.find((spec) => spec.key === workerResult.matchedLabelKey) || null
          : null;
        if (workerResult.detectedType === 'label' && !workerMatchedLabelSpec) {
          throw new Error('\u9009\u62e9\u7684\u6807\u7b7e\u5c3a\u5bf8\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u9009\u62e9\u3002');
        }
        await setSizeImageProcessingStep(session, '\u8bc6\u522b\u5b8c\u6210\uff0c\u6b63\u5728\u56de\u586b Worker \u751f\u6210\u7684 3000 \u00d7 3000 JPG...');
        if (workerResult.transparent) {
          session.includeRoundArc = false;
          session.includeBatchNumber = false;
        }
        if (workerResult.detectedType === 'carton') {
          session.cartonResultDataUrl = workerResult.dataUrl;
          session.cartonFile = file;
          session.pendingLabelMatches = session.pendingLabelMatches.filter((item) => item.file !== file);
        } else {
          const spec = workerMatchedLabelSpec;
          session.flatResults[spec.key] = { dataUrl: workerResult.dataUrl, kind: spec.kind, code: spec.code };
          session.flatFiles[spec.key] = file;
          session.pendingLabelMatches = session.pendingLabelMatches.filter((item) => item.file !== file);
          if (labelSpecs.length === 1) {
            session.labelResultDataUrl = workerResult.dataUrl;
            session.labelResultKind = spec.kind;
            session.labelFile = file;
          }
        }
        session.error = '';
        if (!data.isCustomSizeImage) {
          if (workerResult.detectedType === 'carton') {
            updateDailyLedgerForSku(sku, { boxFileState: 'done', boxFileDone: true }, getTodayKey());
          } else {
            updateDailyLedgerForSku(sku, { labelFileState: 'done', labelFileDone: true }, getTodayKey());
          }
        }
        recordSizeImageUsage(true);
        if (!silent) showToast('\u5df2\u81ea\u52a8\u8bc6\u522b\u4e3a' + (workerResult.detectedType === 'carton' ? '\u7eb8\u76d2' : (workerMatchedLabelSpec.kind === 'print' ? '\u5370\u5237' : '\u6807\u7b7e')) + '\u5e76\u751f\u6210\u5c3a\u5bf8\u56fe');
        return true;
      }
      const image = await loadSizeImageSource(sourceUrl);
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
            session.pendingLabelMatches.push({ id: pendingId, file, cartonError: cartonError ? formatErrorMessage(cartonError) : '' });
            session.error = '';
            if (!silent) showToast('无法唯一确定图片类型与尺寸，请手动选择');
            return 'pending';
          }
          matchedLabelSpec = first.spec;
          geometry = first.geometry;
        }
        detectedType = 'label';
      }
      await setSizeImageProcessingStep(session, '\u8bc6\u522b\u5b8c\u6210\uff0c\u6b63\u5728\u7ed8\u5236 3000 \u00d7 3000 JPG...');
      if (detectedType === 'label' && isTransparentSizeImageLabel(data, matchedLabelSpec)) {
        session.includeRoundArc = false;
        session.includeBatchNumber = false;
      }
      if (detectedType === 'carton') {
        session.cartonResultDataUrl = generateSizeImageJpeg(image, geometry, cartonSpec, data, session.includeRemark, session.includeRoundArc, session.cartonRemarkText);
        session.cartonFile = file;
        session.pendingLabelMatches = session.pendingLabelMatches.filter((item) => item.file !== file);
      } else {
        const customRemark = session.labelRemarkTexts[matchedLabelSpec.key];
        geometry.hasBarcode = !cartonSpec && matchedLabelSpec.kind === 'label' && detectSizeImageBarcode(image, geometry);
        const dataUrl = generateLabelSizeImageJpeg(
          image,
          geometry,
          matchedLabelSpec,
          data,
          session.includeRemark,
          session.includeRoundArc,
          session.includeBatchNumber,
          customRemark,
          productImageAsset && productImageAsset.image ? { productImage: productImageAsset.image } : undefined,
        );
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
      if (!data.isCustomSizeImage) {
        if (detectedType === 'carton') {
          updateDailyLedgerForSku(sku, { boxFileState: 'done', boxFileDone: true }, getTodayKey());
        } else {
          updateDailyLedgerForSku(sku, { labelFileState: 'done', labelFileDone: true }, getTodayKey());
        }
      }
      recordSizeImageUsage(true);
      if (!silent) showToast('\u5df2\u81ea\u52a8\u8bc6\u522b\u4e3a' + (detectedType === 'carton' ? '\u7eb8\u76d2' : (matchedLabelSpec.kind === 'print' ? '\u5370\u5237' : '\u6807\u7b7e')) + '\u5e76\u751f\u6210\u5c3a\u5bf8\u56fe');
      return true;
    } catch (error) {
      session.error = formatSizeImageError(error);
      recordSizeImageUsage(false);
      return false;
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

  async function loadSizeImageProductImage(data) {
    const source = getProductThumbUrl(data) || [
      data && data.skuImageUrl,
      data && data.skuImageFallbackUrl,
      data && data.productListImageUrl,
      data && data.productListImageFallbackUrl,
    ].map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
    if (!source) return null;
    const fallback = data && (
      data.skuImageFallbackUrl
      || data.productListImageFallbackUrl
      || data.skuImageUrl
      || data.productListImageUrl
      || source
    );
    try {
      const imageInfo = /^data:image\//i.test(source)
        ? { dataUrl: source }
        : await fetchImageForExcel(source, fallback).catch(() => null);
      if (!imageInfo || !imageInfo.dataUrl) return null;
      return { dataUrl: imageInfo.dataUrl, image: await loadSizeImageSource(imageInfo.dataUrl) };
    } catch (error) {
      console.warn('PLM floating helper printed bag product image load failed:', error);
      return null;
    }
  }

  async function processSizeImageFiles(files, options) {
    const items = Array.from(files || []).filter(Boolean);
    if (!items.length) return;
    const sku = getActiveSizeImageSku();
    const session = sku && ensureSizeImageSession(sku);
    if (session) {
      state.sizeImageBusySku = sku;
      session.error = '';
      session.fileName = items.map((file) => file.name).join(' / ');
      session.processingStep = '\u6b63\u5728\u8bfb\u53d6 ' + items.length + ' \u5f20\u56fe\u7247...';
      if (state.view === 'sizeImage') renderShell();
      await yieldSizeImageUi();
    }
    let generated = false;
    for (const file of items) generated = (await processSizeImageFile(file, '', true)) === true || generated;
    if (state.sizeImageBusySku === sku) state.sizeImageBusySku = '';
    if (session) session.processingStep = '';
    if (session && !session.error) {
      const flatCount = Object.values(session.flatResults).filter((item) => item && item.dataUrl).length;
      const names = [session.cartonResultDataUrl ? '\u7eb8\u76d2' : '', flatCount ? flatCount + '\u4e2a\u6807\u7b7e/\u5370\u5237' : ''].filter(Boolean).join('\u548c');
      if (names) showToast('\u5df2\u751f\u6210' + names + '\u5c3a\u5bf8\u56fe');
      else if (session.pendingLabelMatches.length) showToast('请选择图片类型与对应尺寸，可选纸盒、标签或印刷');
    }
    if (state.view === 'sizeImage') renderShell();
    if (generated && options && options.focusSave) focusGeneratedAssetSaveButton('size-image-save-all', 'sizeImage');
  }

  function analyzeSizeImageGeometry(image, spec) {
    const maxSide = 1800;
    const source = getSizeImageSourceDimensions(image);
    const ratio = Math.min(1, maxSide / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * ratio));
    const height = Math.max(1, Math.round(source.height * ratio));
    const canvas = createSizeImageCanvas(width, height);
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
      bodyLeft: bodyLeft * source.width / width,
      bodyTop: bestStart * source.height / height,
      pixelsPerCmX: scaleX * source.width / width,
      pixelsPerCmY: scaleY * source.height / height,
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
    const source = getSizeImageSourceDimensions(image);
    const ratio = Math.min(1, maxSide / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * ratio));
    const height = Math.max(1, Math.round(source.height * ratio));
    const canvas = createSizeImageCanvas(width, height);
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
      cropX: left * source.width / width,
      cropY: top * source.height / height,
      cropWidth: cropWidth * source.width / width,
      cropHeight: cropHeight * source.height / height,
      rotated: ratioMatch.rotated,
      panelCount: ratioMatch.panelCount,
      matchDelta: ratioMatch.matchDelta,
    };
  }

  function cartonBottomLabelPositions(context, artX, firstEnd, secondEnd, widthText, lengthText) {
    const first = (artX + firstEnd) / 2;
    const second = (firstEnd + secondEnd) / 2;
    const requiredDistance = (context.measureText(widthText).width + context.measureText(lengthText).width) / 2 + 16;
    const shift = Math.max(0, (requiredDistance - (second - first)) / 2);
    return [first - shift, second + shift];
  }

  function generateSizeImageJpeg(image, geometry, spec, data, includeRemark, includeRoundArc, customRemark, renderOptions) {
    const canvas = createSizeImageCanvas(3000, 3000);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = '#000000';
    context.font = '700 88px "Microsoft YaHei", "PingFang SC", sans-serif';
    const titleText = renderOptions && renderOptions.titleText || getSizeImageTitle('carton', data, includeRemark, includeRoundArc, customRemark);
    context.fillText(titleText, 505, 140);
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
    const source = getSizeImageSourceDimensions(image);
    context.drawImage(image, imageX, imageY, source.width / geometry.pixelsPerCmX * drawScale, source.height / geometry.pixelsPerCmY * drawScale);
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
    const widthText = formatSizeImageNumber(spec.width) + 'cm';
    const lengthText = formatSizeImageNumber(spec.length) + 'cm';
    const [widthLabelX, lengthLabelX] = cartonBottomLabelPositions(context, artX, firstEnd, secondEnd, widthText, lengthText);
    context.fillText(widthText, widthLabelX, bottomY + 34);
    context.fillText(lengthText, lengthLabelX, bottomY + 34);
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
    return exportSizeImageCanvas(canvas, renderOptions);
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

  function drawSizeImageContained(context, image, x, y, width, height) {
    if (!context || !image || !(width > 0) || !(height > 0)) return;
    const source = getSizeImageSourceDimensions(image);
    const scale = Math.min(width / source.width, height / source.height);
    const drawWidth = source.width * scale;
    const drawHeight = source.height * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawPrintedBagSealDimension(context, artX, artY, drawScale) {
    const sealWidth = Math.max(24, 0.5 * drawScale);
    const lineY = artY - 58;
    const tick = 28;
    context.save();
    context.strokeStyle = '#ee1410';
    context.fillStyle = '#ee1410';
    context.lineWidth = 4;
    context.font = '66px "Microsoft YaHei", "PingFang SC", sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText('\u5c01\u8fb90.5cm', Math.max(100, artX - 190), lineY - 106);
    drawSizeImageLine(context, artX, lineY, artX + sealWidth, lineY);
    drawSizeImageLine(context, artX, lineY - tick, artX, lineY + tick);
    drawSizeImageLine(context, artX + sealWidth, lineY - tick, artX + sealWidth, lineY + tick);
    context.restore();
  }

  function generateLabelSizeImageJpeg(image, geometry, spec, data, includeRemark, includeRoundArc, includeBatchNumber, customRemark, renderOptions) {
    const canvas = createSizeImageCanvas(3000, 3000);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = '#000000';
    context.font = '700 88px "Microsoft YaHei", "PingFang SC", sans-serif';
    const titleText = renderOptions && renderOptions.titleText || getSizeImageTitle(spec.kind === 'print' ? 'print' : 'label', data, includeRemark, includeRoundArc, customRemark, spec);
    context.fillText(titleText, 505, 140);
    const titleRight = 505 + context.measureText(titleText).width;
    context.font = '78px "Microsoft YaHei", "PingFang SC", sans-serif';
    const panelCount = Math.max(1, Number(geometry.panelCount) || 1);
    const artworkWidth = spec.width * panelCount;
    const doubleSidedPrintedBag = isDoubleSidedPrintedBagSizeImage(spec, geometry);
    const sizeText = doubleSidedPrintedBag
      ? '\u89c4\u683c\u5c3a\u5bf8\uff1a\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM'
      : panelCount > 1
      ? '\u89c4\u683c\u5c3a\u5bf8\uff1a\u5355\u9762\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM\uff08\u53cc\u9762\u5c55\u5f00\u5bbd' + formatSizeImageNumber(artworkWidth) + 'CM\uff09'
      : '\u89c4\u683c\u5c3a\u5bf8\uff1a\u5bbd' + formatSizeImageNumber(spec.width) + 'X\u9ad8' + formatSizeImageNumber(spec.height) + 'CM';
    context.fillText(sizeText, 505, 260);
    const sizeTextRight = 505 + context.measureText(sizeText).width;
    let batchTextRight = 469;
    if (includeBatchNumber) {
      context.fillStyle = '#ee1410';
      context.font = '76px "Microsoft YaHei", "PingFang SC", sans-serif';
      const batchNote = renderOptions && renderOptions.batchNoteText || getLabelBatchNoteText(shouldUseFullLabelDateRemark(data, spec, geometry.hasBarcode));
      context.fillText(batchNote, 469, 370);
      batchTextRight = 469 + context.measureText(batchNote).width;
    }
    if (doubleSidedPrintedBag && renderOptions && renderOptions.productImage) {
      const effectImageX = Math.max(1800, Math.max(titleRight, sizeTextRight, batchTextRight) + 52);
      const effectImageRight = 2860;
      const effectImageWidth = effectImageRight - effectImageX;
      if (effectImageWidth >= 260) {
        drawSizeImageContained(context, renderOptions.productImage, effectImageX, 42, effectImageWidth, 620);
      }
    }

    const drawScale = Math.min(2050 / artworkWidth, 1550 / spec.height);
    const artWidth = artworkWidth * drawScale;
    const artHeight = spec.height * drawScale;
    const artX = Math.round((3000 - artWidth) / 2);
    const artY = clamp(Math.round((3000 - artHeight) / 2), 760, 1200);
    if (doubleSidedPrintedBag) drawPrintedBagSealDimension(context, artX, artY, drawScale);
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
    return exportSizeImageCanvas(canvas, renderOptions);
  }

  function exportSizeImageCanvas(canvas, renderOptions) {
    const trace = renderOptions && renderOptions.traceWatermark || buildImageTraceWatermark();
    drawImageTraceWatermark(canvas.getContext('2d'), canvas.width, canvas.height, trace);
    return renderOptions && renderOptions.returnCanvas ? canvas : canvas.toDataURL('image/jpeg', 0.96);
  }

  let sizeImageWorkerSource = '';

  function getSizeImageWorkerSource() {
    if (sizeImageWorkerSource) return sizeImageWorkerSource;
    const pureFunctions = [
      'const clamp = ' + clamp.toString() + ';',
      'const trimNumber = ' + trimNumber.toString() + ';',
      'const formatSizeImageNumber = ' + formatSizeImageNumber.toString() + ';',
      createSizeImageCanvas,
      drawImageTraceWatermark,
      exportSizeImageCanvas,
      getSizeImageSourceDimensions,
      getCartonBodyWidths,
      drawSizeImageLine,
      isDoubleSidedPrintedBagSizeImage,
      drawSizeImageContained,
      drawPrintedBagSealDimension,
      traceSizeImageRoundedRect,
      traceCartonSizeImageOutline,
      matchFlatSizeImageRatio,
      analyzeSizeImageGeometry,
      analyzeLabelSizeImageGeometry,
      hasSizeImageBarcodePixels,
      detectSizeImageBarcode,
      getLabelBatchNoteText,
      cartonBottomLabelPositions,
      generateSizeImageJpeg,
      generateLabelSizeImageJpeg,
    ].map((item) => typeof item === 'string' ? item : item.toString()).join('\n');
    sizeImageWorkerSource = `'use strict';
${pureFunctions}

async function canvasToBlob(canvas) {
  if (!canvas || typeof canvas.convertToBlob !== 'function') throw new Error('当前浏览器不支持 Worker 图片导出');
  return canvas.convertToBlob({ type: 'image/jpeg', quality: .96 });
}

self.onmessage = async function(event) {
  const payload = event.data || {};
  let image = null;
  let productImage = null;
  try {
    if (typeof OffscreenCanvas !== 'function' || typeof createImageBitmap !== 'function') throw new Error('当前浏览器不支持 Worker 尺寸图生成');
    image = await createImageBitmap(payload.file);
    const cartonSpec = payload.cartonSpec || null;
    const labelSpecs = Array.isArray(payload.labelSpecs) ? payload.labelSpecs : [];
    if (payload.productImageDataUrl && labelSpecs.some((spec) => spec && spec.printedBag)) {
      const productImageResponse = await fetch(payload.productImageDataUrl);
      if (!productImageResponse.ok) throw new Error('产品效果图读取失败');
      productImage = await createImageBitmap(await productImageResponse.blob());
    }
    const preferredType = String(payload.preferredType || '');
    const preferredLabelKey = preferredType.startsWith('label:') ? preferredType.slice(6) : '';
    const isPng = String(payload.fileName || '').toLowerCase().endsWith('.png') || payload.fileType === 'image/png';
    let detectedType = preferredType === 'carton' ? 'carton' : (preferredType === 'label' || preferredLabelKey ? 'label' : '');
    let geometry = null;
    let matchedLabelSpec = null;
    let cartonError = null;
    if ((!detectedType || detectedType === 'carton') && cartonSpec && isPng) {
      try {
        geometry = analyzeSizeImageGeometry(image, cartonSpec);
        detectedType = 'carton';
      } catch (error) {
        cartonError = error;
        if (preferredType === 'carton') throw error;
      }
    }
    if (!detectedType || detectedType === 'label') {
      if (!labelSpecs.length) throw cartonError || new Error('当前 SKU 没有可用的标签尺寸');
      if (preferredLabelKey) {
        matchedLabelSpec = labelSpecs.find((spec) => spec.key === preferredLabelKey) || null;
        if (!matchedLabelSpec) throw new Error('选择的标签尺寸已失效，请重新选择');
        geometry = analyzeLabelSizeImageGeometry(image, matchedLabelSpec, true);
      } else {
        const matches = labelSpecs.map((spec) => {
          try { return { spec, geometry: analyzeLabelSizeImageGeometry(image, spec) }; } catch (_) { return null; }
        }).filter(Boolean).sort((a, b) => a.geometry.matchDelta - b.geometry.matchDelta);
        if (!matches.length && labelSpecs.length === 1) throw new Error('图片比例与 PLM 中的标签或印刷尺寸不匹配');
        const first = matches[0];
        const second = matches[1];
        const confident = first && (!second || second.geometry.matchDelta - first.geometry.matchDelta >= .012);
        if (!confident) {
          self.postMessage({ ok: true, status: 'pending', cartonError: cartonError ? String(cartonError.message || cartonError) : '', matches: matches.map((item) => ({ key: item.spec.key, matchDelta: item.geometry.matchDelta })) });
          return;
        }
        matchedLabelSpec = first.spec;
        geometry = first.geometry;
      }
      detectedType = 'label';
    }
    const key = detectedType === 'carton' ? 'carton' : matchedLabelSpec.key;
    const transparent = detectedType === 'label' && Array.isArray(payload.transparentLabelKeys) && payload.transparentLabelKeys.includes(key);
    const renderOptions = detectedType === 'carton'
      ? ((payload.renderMeta && payload.renderMeta.carton) || {})
      : ((payload.renderMeta && payload.renderMeta.labels && payload.renderMeta.labels[key]) || {});
    if (detectedType === 'label' && !cartonSpec && matchedLabelSpec.kind === 'label') {
      geometry.hasBarcode = detectSizeImageBarcode(image, geometry);
      if (geometry.hasBarcode) renderOptions.batchNoteText = getLabelBatchNoteText(true);
    }
    renderOptions.traceWatermark = payload.traceWatermark;
    if (detectedType === 'label' && isDoubleSidedPrintedBagSizeImage(matchedLabelSpec, geometry) && productImage) {
      renderOptions.productImage = productImage;
    }
    const includeRoundArc = transparent ? false : Boolean(payload.includeRoundArc);
    const includeBatchNumber = transparent ? false : Boolean(payload.includeBatchNumber);
    const canvas = detectedType === 'carton'
      ? generateSizeImageJpeg(image, geometry, cartonSpec, {}, Boolean(payload.includeRemark), includeRoundArc, payload.cartonRemarkText || '', { ...renderOptions, returnCanvas: true })
      : generateLabelSizeImageJpeg(image, geometry, matchedLabelSpec, {}, Boolean(payload.includeRemark), includeRoundArc, includeBatchNumber, payload.labelRemarkText || '', { ...renderOptions, returnCanvas: true });
    const blob = await canvasToBlob(canvas);
    self.postMessage({ ok: true, status: 'ready', detectedType, matchedLabelKey: matchedLabelSpec ? matchedLabelSpec.key : '', geometry, transparent, blob });
  } catch (error) {
    self.postMessage({ ok: false, error: String(error && error.message || error || '尺寸图生成失败') });
  } finally {
    if (image && typeof image.close === 'function') image.close();
    if (productImage && typeof productImage.close === 'function') productImage.close();
  }
};`;
    return sizeImageWorkerSource;
  }

  function sizeImageBlobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      if (!blob) { reject(new Error('Worker 未返回尺寸图')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('尺寸图结果读取失败'));
      reader.readAsDataURL(blob);
    });
  }

  async function runSizeImageWorker(file, preferredType, cartonSpec, labelSpecs, data, session, productImageDataUrl) {
    const canUseWorker = typeof Worker === 'function'
      && typeof Blob === 'function'
      && typeof OffscreenCanvas === 'function'
      && typeof createImageBitmap === 'function'
      && typeof URL !== 'undefined'
      && typeof URL.createObjectURL === 'function';
    if (!canUseWorker) return null;
    const transparentLabelKeys = labelSpecs.filter((spec) => isTransparentSizeImageLabel(data, spec)).map((spec) => spec.key);
    const renderMeta = { carton: null, labels: {} };
    if (cartonSpec) {
      renderMeta.carton = { titleText: getSizeImageTitle('carton', data, session.includeRemark, session.includeRoundArc, session.cartonRemarkText) };
    }
    labelSpecs.forEach((spec) => {
      const transparent = transparentLabelKeys.includes(spec.key);
      const includeRoundArc = transparent ? false : session.includeRoundArc;
      const includeBatchNumber = transparent ? false : session.includeBatchNumber;
      renderMeta.labels[spec.key] = {
        titleText: getSizeImageTitle(spec.kind === 'print' ? 'print' : 'label', data, session.includeRemark, includeRoundArc, session.labelRemarkTexts[spec.key], spec),
        batchNoteText: includeBatchNumber ? getLabelBatchNoteText(shouldUseFullLabelDateRemark(data, spec)) : '',
      };
    });
    let worker = null;
    let sourceUrl = '';
    try {
      sourceUrl = URL.createObjectURL(new Blob([getSizeImageWorkerSource()], { type: 'application/javascript' }));
      worker = new Worker(sourceUrl);
      const result = await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          callback(value);
        };
        worker.onmessage = (event) => {
          const payload = event && event.data || {};
          if (!payload.ok) finish(reject, new Error(payload.error || '尺寸图 Worker 失败'));
          else finish(resolve, payload);
        };
        worker.onerror = (event) => finish(reject, new Error(event && event.message || '尺寸图 Worker 启动失败'));
        worker.postMessage({
          file,
          fileName: file.name || '',
          fileType: file.type || '',
          preferredType,
          cartonSpec,
          labelSpecs,
          includeRemark: session.includeRemark,
          includeRoundArc: session.includeRoundArc,
          includeBatchNumber: session.includeBatchNumber,
          cartonRemarkText: session.cartonRemarkText || '',
          labelRemarkText: '',
          transparentLabelKeys,
          productImageDataUrl: productImageDataUrl || '',
          renderMeta,
          traceWatermark: buildImageTraceWatermark(),
        });
      });
      if (result.status === 'pending') return { worker: true, status: 'pending', cartonError: result.cartonError || '', matches: result.matches || [] };
      return {
        worker: true,
        status: 'ready',
        detectedType: result.detectedType,
        matchedLabelKey: result.matchedLabelKey || '',
        geometry: result.geometry,
        transparent: Boolean(result.transparent),
        dataUrl: await sizeImageBlobToDataUrl(result.blob),
      };
    } catch (_) {
      return null;
    } finally {
      if (worker) worker.terminate();
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    }
  }

  function hasSizeImageBarcodePixels(pixels, width, height) {
    // Look for many narrow black/white bars that repeat on parallel scan lines.
    // Scan both axes so rotated barcodes work without reading their payload.
    const luminance = (x, y) => {
      const index = (y * width + x) * 4;
      return pixels[index + 3] < 128 ? 255 : pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    };
    for (const vertical of [false, true]) {
      const length = vertical ? height : width;
      const crossLength = vertical ? width : height;
      const value = (position, cross) => vertical ? luminance(cross, position) : luminance(position, cross);
      const maxRun = Math.max(12, Math.ceil(length / 80));
      const step = Math.max(2, Math.floor(crossLength / 100));
      for (let cross = 12; cross < crossLength - 12; cross += step) {
        let start = -1;
        let bars = 0;
        let pale = 0;
        let light = 0;
        let previousDark = value(0, cross) < 110;
        let runStart = 0;
        for (let position = 1; position <= length; position += 1) {
          const shade = position < length ? value(position, cross) : 255;
          const dark = shade < 110;
          if (position < length && dark === previousDark) continue;
          const runLength = position - runStart;
          if (runLength > maxRun || position === length) {
            const end = runStart;
            const span = end - start;
            if (start >= 0 && bars >= 20 && span >= 70 && light > 0 && pale / light >= 0.85) {
              const offset = Math.max(12, Math.ceil(span * 0.025));
              if (cross >= offset && cross + offset < crossLength) {
                const parallel = [-offset, -Math.ceil(offset / 2), Math.ceil(offset / 2), offset].every((delta) => {
                  let matching = 0;
                  for (let sample = start; sample < end; sample += 1) {
                    if ((value(sample, cross) < 110) === (value(sample, cross + delta) < 110)) matching += 1;
                  }
                  return matching / span >= 0.94;
                });
                if (parallel) return true;
              }
            }
            start = -1;
            bars = 0;
            pale = 0;
            light = 0;
          } else if (previousDark) {
            if (start < 0) start = runStart;
            bars += 1;
          } else if (start >= 0) {
            light += runLength;
            for (let sample = runStart; sample < position; sample += 1) if (value(sample, cross) > 190) pale += 1;
          }
          previousDark = dark;
          runStart = position;
        }
      }
    }
    return false;
  }

  function detectSizeImageBarcode(image, geometry) {
    const scale = Math.min(1, 1600 / Math.max(geometry.cropWidth, geometry.cropHeight));
    const width = Math.max(1, Math.round(geometry.cropWidth * scale));
    const height = Math.max(1, Math.round(geometry.cropHeight * scale));
    const canvas = createSizeImageCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, geometry.cropX, geometry.cropY, geometry.cropWidth, geometry.cropHeight, 0, 0, width, height);
    return hasSizeImageBarcodePixels(context.getImageData(0, 0, width, height).data, width, height);
  }

  function getLabelBatchNoteText(fullDate) {
    return fullDate ? '（生产日期+截止日期+批次号）' : '（批次号）';
  }

  function shouldUseFullLabelDateRemark(data, spec, hasBarcode) {
    const brand = String(data && data.brand || '').trim().toUpperCase();
    const flatSpec = spec || getLabelSizeImageSpec(data);
    return !getSizeImageSpec(data) && Boolean(flatSpec && flatSpec.kind === 'label') &&
      (Boolean(hasBarcode) || ['DOCTEAT', 'GOOGEER', 'BUSHAID'].some((name) => brand.includes(name)));
  }

  function getSizeImageTitle(type, data, includeRemark, includeRoundArc, customRemark, spec) {
    let customBase = type === 'carton'
      ? String(data && data.sizeImageCustomPackageTitle || '').trim()
      : String(data && data.sizeImageCustomFlatTitle || '').trim();
    if (type !== 'carton' && spec && customBase) {
      // Custom-size forms previously copied the combined PLM material labels
      // into the title. Pick this material and keep its remarks out of the base.
      const parts = customBase.split(/\s*[；;]\s*/);
      customBase = parts.length > 1 ? parts[spec.index || 0] || '' : customBase;
      if (customBase === String(spec.labelText || '').trim()) customBase = customBase.replace(/[（(].*$/, '').trim();
    }
    const base = customBase || (type === 'label' ? '\u6807\u7b7e' : (type === 'print' ? '\u5370\u5237' : '\u7eb8\u76d2'));
    if (!includeRemark) return base;
    const remarks = getSizeImageRemarks(data);
    const legacyCombined = type !== 'carton' && spec && /[；;]/.test(String(data && data.printSizeLabel || '')) && customRemark === remarks.label;
    const sourceRemark = legacyCombined ? getSizeImageSpecRemark(data, spec) : typeof customRemark === 'string' ? customRemark.trim() : (type === 'carton' ? remarks.carton : spec ? getSizeImageSpecRemark(data, spec) : remarks.label);
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

  function confirmSizeImageFolderPermission() {
    if (typeof window.confirm !== 'function') return true;
    return window.confirm('即将选择尺寸图保存文件夹。\n如果随后出现“允许此网站修改文件？”提示，请点击“允许”，否则尺寸图无法批量写入。\n\n点击“确定”继续，点击“取消”停止。');
  }

  async function saveCurrentSizeImagesToFolder() {
    const sku = getActiveSizeImageSku();
    const session = sku && state.sizeImageSessions[sku];
    const currentData = getActiveSizeImageData();
    const flatSpecs = getLabelSizeImageSpecs(currentData);
    if (session) migrateLegacySizeImageResult(session, flatSpecs[0]);
    const flatFiles = session ? flatSpecs.map((spec) => {
      const result = session.flatResults[spec.key];
      if (!result || !result.dataUrl) return null;
      const flatLabel = (result.kind || spec.kind) === 'print' ? '\u5370\u5237' : '\u6807\u7b7e';
      const defaultCode = currentData.sizeImageNoSku
        ? '尺寸图' + (flatSpecs.length > 1 ? '-' + formatSizeImageNumber(spec.width) + 'x' + formatSizeImageNumber(spec.height) + 'cm' : '')
        : (currentData.sizeImageFreeSku || sku);
      const materialCode = namingCodes(result.code || spec.code)[0] || compactText(result.code || spec.code || '') || defaultCode;
      return { name: sanitizeDownloadFileName(flatLabel + materialCode + '.jpg'), dataUrl: result.dataUrl };
    }).filter(Boolean) : [];
    const cartonCode = namingCodes(currentData.packageCode)[0] || compactText(currentData.packageCode || '') || (currentData.sizeImageNoSku ? '尺寸图' : (currentData.sizeImageFreeSku || sku));
    const files = session ? [
      session.cartonResultDataUrl ? { name: sanitizeDownloadFileName('\u7eb8\u76d2' + cartonCode + '.jpg'), dataUrl: session.cartonResultDataUrl } : null,
      ...flatFiles,
    ].filter(Boolean) : [];
    if (!files.length) {
      showToast('\u8bf7\u5148\u751f\u6210\u7eb8\u76d2\u3001\u6807\u7b7e\u6216\u5370\u5237\u5c3a\u5bf8\u56fe');
      return;
    }
    if (typeof saveImageFiles === 'function' && getDirectoryPicker() && !confirmSizeImageFolderPermission()) return;
    if (typeof saveImageFiles === 'function') {
      try {
        const result = await saveImageFiles(files);
        if (result && result.cancelled) return;
        if (result && result.mode === 'unsupported') {
          showToast('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u53e6\u5b58\u4e3a\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome \u6216 Edge');
          return;
        }
        showToast('\u5df2\u4fdd\u5b58 ' + files.length + ' \u4e2a\u5c3a\u5bf8\u56fe JPG');
      } catch (error) {
        if (error && error.name === 'AbortError') return;
        console.warn('PLM floating helper size image folder save failed:', error);
        showToast('\u4fdd\u5b58\u5931\u8d25\uff1a' + formatErrorMessage(error));
      }
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
    await ensureCurrentTraceNameInitials();
    const sku = getActiveSizeImageSku();
    const session = sku && ensureSizeImageSession(sku);
    if (!session) return;
    if (state.sizeImageBusySku === sku) return;
    const data = getActiveSizeImageData();
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
    const sku = getActiveSizeImageSku();
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
    const type = specKey === 'carton' ? 'carton' : specKey.startsWith('label:') ? specKey : 'label:' + specKey;
    await processSizeImageFile(pending.file, type, false);
  }
