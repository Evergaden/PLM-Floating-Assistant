
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

  function presentToast(toast, item, token) {
    if (!toast || token !== state.toastToken) return;
    const message = item.message;
    const quiet = item.quiet;
    const tone = item.tone;
    const duration = item.duration;
    toast.textContent = message;
    toast.dataset.message = message;
    toast.classList.toggle('is-quiet', quiet);
    toast.classList.toggle('is-success', tone === 'success');
    toast.classList.toggle('is-error', tone === 'error');
    toast.classList.toggle('is-info', tone === 'info');
    toast.style.setProperty('--pfh-toast-life', duration + 'ms');
    toast.classList.remove('is-leaving', 'is-visible');
    toast.classList.add('is-mounted');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    state.toastTimer = window.setTimeout(() => {
      if (!toast.isConnected || token !== state.toastToken) return;
      toast.classList.remove('is-visible');
      toast.classList.add('is-leaving');
      state.toastExitTimer = window.setTimeout(() => {
        if (toast.isConnected && token === state.toastToken) toast.remove();
        state.toastTimer = 0;
        state.toastExitTimer = 0;
      }, 420);
    }, duration);
  }

  function dismissToast(token) {
    if (!token || token !== state.toastToken) return;
    ++state.toastToken;
    window.clearTimeout(state.toastTimer);
    window.clearTimeout(state.toastExitTimer);
    state.toastTimer = 0;
    state.toastExitTimer = 0;
    if (state.toastSwapAnimation) {
      try { state.toastSwapAnimation.cancel(); } catch (_) {}
      state.toastSwapAnimation = null;
    }
    const panel = document.getElementById(PANEL_ID);
    const toast = panel && panel.querySelector('.pfh-toast');
    if (toast) toast.remove();
  }

  function showToast(text, options) {
    if (!(options && options.diagnostic === false) && shouldReportDiagnosticLog('warn', text)) {
      reportDiagnosticFromLog(text, '', 'warn');
    }
    const message = neutralizeTechnicalTerms(text);
    if (!message) return;
    const quiet = Boolean(options && options.quiet);
    const requestedTone = String(options && options.tone || '').trim();
    const tone = requestedTone || (quiet ? 'quiet' : (/失败|错误|异常|不可用|无法|不能为空|请先|缺少|拦截|未找到|没有可/.test(message) ? 'error' : 'success'));
    if (!quiet && tone === 'error' && /network|failed to fetch|timeout|网络|云端连接|外部连接|加载失败/i.test(message)) offerNetworkDiagnostics('当前操作因通信异常未能完成');
    const duration = message.length > 12 ? 12000 : 7000;
    const item = { message, quiet, tone, duration };
    const panel = ensurePanel();
    let toast = panel.querySelector('.pfh-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pfh-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      panel.appendChild(toast);
    }
    const token = ++state.toastToken;
    window.clearTimeout(state.toastTimer);
    window.clearTimeout(state.toastExitTimer);
    state.toastTimer = 0;
    state.toastExitTimer = 0;
    if (state.toastSwapAnimation) {
      try { state.toastSwapAnimation.cancel(); } catch (_) {}
      state.toastSwapAnimation = null;
    }
    const shouldTransition = toast.classList.contains('is-visible')
      && toast.dataset.message
      && toast.dataset.message !== message
      && toast.animate
      && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!shouldTransition) {
      presentToast(toast, item, token);
      return token;
    }
    const startOpacity = Number.parseFloat(getComputedStyle(toast).opacity);
    const animation = toast.animate([
      { opacity: Number.isFinite(startOpacity) ? startOpacity : 1, transform: 'translate(0, 0) scale(1)' },
      { opacity: 0, transform: 'translate(9px, 4px) scale(.96)' },
    ], {
      duration: 150,
      easing: 'cubic-bezier(.55, .05, .8, .4)',
      fill: 'forwards',
    });
    state.toastSwapAnimation = animation;
    animation.onfinish = () => {
      if (state.toastSwapAnimation === animation) state.toastSwapAnimation = null;
      try { animation.cancel(); } catch (_) {}
      presentToast(toast, item, token);
    };
    return token;
  }

  function addLog(level, message, detail) {
    const diagnosticCode = shouldReportDiagnosticLog(level, message, detail)
      ? reportDiagnosticFromLog(message, detail, String(level).toLowerCase())
      : '';
    const text = neutralizeTechnicalTerms([message, detail, diagnosticCode && ('错误编号 ' + diagnosticCode)].filter(Boolean).join(' | '));
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
      const sanitized = Array.isArray(saved) ? saved.map((item) => ({
        ...item,
        message: redactCloudBackupOwnerMismatch(item && item.message),
      })) : [];
      if (Array.isArray(saved) && sanitized.some((item, index) => item.message !== (saved[index] && saved[index].message))) {
        if (typeof GM_setValue === 'function') GM_setValue(LOG_KEY, sanitized);
        else localStorage.setItem(LOG_KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch (error) {
      return [];
    }
  }

  function redactCloudBackupOwnerMismatch(value) {
    const text = String(value || '');
    return text.includes('该备份密钥已绑定') || text.includes('backup owner mismatch')
      ? '云备份上传失败 | 该备份密钥不可用于当前账号，请更换备份密钥'
      : text;
  }

  function saveLogs() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LOG_KEY, state.logs || []);
      else localStorage.setItem(LOG_KEY, JSON.stringify(state.logs || []));
    } catch (error) {
      console.warn('PLM floating helper log save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-logs' });
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
    if (/\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25|\u4e91\u5907\u4efd|\u4f7f\u7528\u72b6\u6001\u540c\u6b65\u5931\u8d25|\u4e3b\u9875\u95ee\u5019\u8bed\u540c\u6b65\u5931\u8d25|\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25/.test(text)) return true;
    if (level === 'success' && !/(\u63d0\u5ba1|\u4e0a\u4f20|\u751f\u6210|Excel|\u6807\u7b7e|\u590d\u5236|AI|\u8868\u683c|\u6e05\u6d17|\u667a\u80fd|\u4ef7\u683c|\u7c7b\u578b|\u6570\u636e|\u56fe\u7247)/i.test(text)) return true;
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

  function sanitizeInsightsForCloudBackup(value) {
    const clean = sanitizeInsights(value);
    clean.priceHistory = clean.priceHistory.map((item) => {
      const { packQty, ...rest } = item;
      return rest;
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
      data && data.plmCategory,
      data && data.logoText,
      data && data.aiProductType,
      data && data.aiCategory,
      Array.isArray(data && data.aiPackageTypes) ? data.aiPackageTypes.join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function scheduleMagicUploadAccessRefresh(delay) {
    if (state.magicUploadAccessTimer) window.clearTimeout(state.magicUploadAccessTimer);
    state.magicUploadAccessTimer = window.setTimeout(() => {
      state.magicUploadAccessTimer = 0;
      refreshMagicUploadAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshMagicUploadAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      if (!state.magicUploadAccessName) state.magicUploadAccessLoading = true;
      scheduleMagicUploadAccessRefresh(1500);
      return;
    }
    const hasCachedAccess = applyCachedFeatureAccess(name).magicUpload;
    let accessResolved = hasCachedAccess;
    state.magicUploadAccessName = name;
    state.magicUploadAccessLoading = !hasCachedAccess;
    if (state.view === 'home' || state.view === 'magicUpload') renderShell();
    try {
      const response = await cloudRequestWithRetry('/features/magic-upload?name=' + encodeURIComponent(name), { method: 'GET' }, { attempts: 3, baseDelayMs: 900 });
      if (state.magicUploadAccessName !== name) return;
      if (!response || typeof response.enabled !== 'boolean') throw new Error('权限响应格式异常');
      state.magicUploadAccessEnabled = response.enabled;
      cacheFeatureAccess(name, { magicUploadEnabled: response.enabled });
      accessResolved = true;
    } catch (error) {
      addLog('warn', '魔法上传权限检查失败', formatErrorMessage(error));
      if (!accessResolved && ['home', 'magicUpload'].includes(state.view)) offerNetworkDiagnostics('魔法上传权限获取失败，功能暂不可用', error);
    } finally {
      state.magicUploadAccessLoading = !accessResolved;
      if (state.view === 'home' || state.view === 'magicUpload') renderShell();
    }
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
    const { packQty, ...cloudItem } = item;
    syncInsightEvent('price', cloudItem);
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
