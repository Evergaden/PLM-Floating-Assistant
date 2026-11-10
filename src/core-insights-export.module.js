
  function matchesSearchItem(item, tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    if (!queryTokens.length) return true;
    if ([item.sku, item.brand, item.name, item.packageCode, item.printCode, item.developerName, item.projectStatus, item.designType].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)))) return true;
    const data = loadData(item.sku);
    if (!data) return false;
    return [data.brand, data.name, data.packageCode, data.printCode, data.developerName, data.projectStatus, data.designType].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)));
  }

  function getSearchMatches(tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    const sortedItems = getSortedIndex();
    return queryTokens.length ? sortedItems.filter((item) => matchesSearchItem(item, queryTokens)) : sortedItems;
  }

  function exportCache() {
    const payload = buildCachePayload({ includeLocalTranslateImages: true });
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
      promptHint: '\u8bf7\u6574\u7406\u4ef7\u683c\u5386\u53f2\u3001\u5546\u54c1\u7c7b\u578b\u89c4\u5f8b\u548c\u5b57\u6bb5\u7f3a\u5931\u539f\u56e0\uff0c\u8f93\u51fa\u9002\u5408\u5bfc\u5165\u8868\u683c\u7684\u7ed3\u6784\u5316\u8868\u683c\u3002',
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
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5df2\u590d\u5236\uff0c\u53ef\u76f4\u63a5\u8d34\u5230 AI \u6216\u8868\u683c';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
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

  function formatCloudInsightTotals(totals) {
    if (!Array.isArray(totals) || !totals.length) return '\u6682\u65e0\u4e8b\u4ef6';
    return totals.map((item) => {
      const label = item.event_type === 'price' ? '\u4ef7\u683c' : (item.event_type === 'issue' ? '\u5f02\u5e38' : item.event_type);
      return label + ' ' + item.count;
    }).join(' / ');
  }
