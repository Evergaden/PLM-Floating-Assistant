  const DIAGNOSTIC_QUEUE_KEY = 'plm-floating-helper:diagnostics:v1';
  const DIAGNOSTIC_QUEUE_LIMIT = 200;
  const DIAGNOSTIC_DEDUP_MS = 5 * 60 * 1000;
  const diagnosticRecent = Object.create(null);
  let diagnosticFlushPromise = null;
  let diagnosticInstalled = false;
  let diagnosticRetryTimer = 0;
  let diagnosticRetryCount = 0;
  let diagnosticMemoryQueue = null;

  function diagnosticStoreGet() {
    if (diagnosticMemoryQueue) return diagnosticMemoryQueue.slice();
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(DIAGNOSTIC_QUEUE_KEY, [])
        : JSON.parse(localStorage.getItem(DIAGNOSTIC_QUEUE_KEY) || '[]');
      return Array.isArray(saved) ? saved.slice(-DIAGNOSTIC_QUEUE_LIMIT) : [];
    } catch (_) {
      return [];
    }
  }

  function diagnosticStoreSet(items) {
    const queue = (Array.isArray(items) ? items : []).slice(-DIAGNOSTIC_QUEUE_LIMIT);
    diagnosticMemoryQueue = queue;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(DIAGNOSTIC_QUEUE_KEY, queue);
      else localStorage.setItem(DIAGNOSTIC_QUEUE_KEY, JSON.stringify(queue));
    } catch (_) {
      // Keep reports in memory for immediate delivery when persistent storage is full.
    }
  }

  function sanitizeDiagnosticText(value, maxLength) {
    return String(value || '')
      .replace(/data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi, '[image]')
      .replace(/(authorization|cookie|token|password|backup(?:Key|Password)|secret)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
      .replace(/Bearer\s+[a-z0-9._~-]+/gi, 'Bearer [redacted]')
      .replace(/https?:\/\/([^\s?#]+)[^\s]*/gi, 'https://$1/[redacted]')
      .replace(/[a-z0-9+/]{180,}={0,2}/gi, '[large-data]')
      .slice(0, maxLength || 600);
  }

  function diagnosticHash(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36).toUpperCase();
  }

  function makeDiagnosticCode(fingerprint) {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return 'ERR-' + String(now.getFullYear()).slice(-2) + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + fingerprint.slice(0, 6);
  }

  function inferDiagnosticFeature(message) {
    const text = String(message || '');
    if (/Excel|XLSX|表格|Workbook|worksheet|sheets/i.test(text)) return 'excel';
    if (/备份|恢复/i.test(text)) return 'backup';
    if (/参数图|尺寸图/i.test(text)) return 'image';
    if (/上传|提审|图包|标签|OSS/i.test(text)) return 'upload';
    if (/AI|文案|成分|翻译/i.test(text)) return 'ai-content';
    if (/缓存|存储|配额|QuotaExceeded/i.test(text)) return 'storage';
    if (/建品|BOM|开发任务/i.test(text)) return 'product-development';
    if (/条码|导出|下载|剪贴板|复制/i.test(text)) return 'export';
    if (/权限|鉴权|登录|401|403/i.test(text)) return 'auth';
    if (/读取|抓取|物料|数据缺失/i.test(text)) return 'data-read';
    if (/云端|同步|网络|请求|HTTP|timeout|fetch/i.test(text)) return 'cloud';
    return 'runtime';
  }

  function shouldReportDiagnosticLog(level, message, detail) {
    const severity = String(level || '').toLowerCase();
    if (severity === 'error') return true;
    return severity === 'warn' && /失败|错误|异常|超时|不可用|无法|拦截|未找到|未获取|缺失|缺少|超过.*上限|超过入口限制|失效|未加载|未就绪|中断|拒绝|timeout|network|error|HTTP\s*[45]\d\d/i.test([message, detail && detail.message || detail].filter(Boolean).join(' '));
  }

  function currentDiagnosticSku(message) {
    const fromMessage = typeof findSku === 'function' ? findSku(String(message || '')) : '';
    return String(fromMessage || state && state.data && state.data.sku || state && state.selectedSku || '').trim().slice(0, 80);
  }

  function createDiagnosticEvent(error, options) {
    const source = error && typeof error === 'object' && error.message ? error : { message: String(error || '未知错误') };
    const message = sanitizeDiagnosticText(source.message || error, 600) || '未知错误';
    const stack = sanitizeDiagnosticText(source.stack || '', 3000);
    const feature = sanitizeDiagnosticText(options && options.feature || inferDiagnosticFeature(message), 60);
    const action = sanitizeDiagnosticText(options && options.action || 'runtime', 80);
    const fingerprint = diagnosticHash([feature, action, message.replace(/SKU\d+/gi, 'SKU#').replace(/\b\d{8,}\b/g, '#'), stack.split(/\r?\n/)[1] || ''].join('|'));
    const errorCode = makeDiagnosticCode(fingerprint);
    const eventId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : errorCode + '-' + Date.now().toString(36);
    return {
      eventId,
      errorCode,
      fingerprint,
      severity: sanitizeDiagnosticText(options && options.severity || 'error', 20),
      feature,
      action,
      message,
      stack,
      scriptVersion: SCRIPT_VERSION,
      uiVersion: typeof UI_ASSET_VERSION === 'undefined' ? '' : String(UI_ASSET_VERSION || '').slice(0, 80),
      userName: typeof findCurrentPlmUserName === 'function' ? String(findCurrentPlmUserName() || '').slice(0, 80) : '',
      instanceId: typeof getClientInstanceId === 'function' ? String(getClientInstanceId() || '').slice(0, 120) : '',
      sku: String(options && options.sku || currentDiagnosticSku([message, options && options.detail].filter(Boolean).join(' '))).slice(0, 80),
      pagePath: String(location && location.pathname || '').slice(0, 240),
      occurredAt: new Date().toISOString(),
      context: {
        online: typeof navigator === 'undefined' ? null : navigator.onLine,
        language: typeof navigator === 'undefined' ? '' : String(navigator.language || '').slice(0, 30),
        platform: typeof navigator === 'undefined' ? '' : String(navigator.platform || '').slice(0, 80),
      },
    };
  }

  function enqueueDiagnostic(event) {
    const queue = diagnosticStoreGet();
    queue.push(event);
    diagnosticStoreSet(queue);
    window.setTimeout(flushDiagnosticQueue, 80);
  }

  function flushDiagnosticQueue() {
    if (diagnosticFlushPromise || typeof cloudRequest !== 'function') return diagnosticFlushPromise;
    window.clearTimeout(diagnosticRetryTimer);
    diagnosticRetryTimer = 0;
    const queue = diagnosticStoreGet();
    if (!queue.length) return null;
    const event = queue[0];
    diagnosticFlushPromise = cloudRequest('/diagnostics/report', {
      method: 'POST',
      timeoutMs: 10000,
      body: event,
      headers: { 'x-plm-request-id': event.eventId },
    }).then(() => {
      diagnosticRetryCount = 0;
      const current = diagnosticStoreGet();
      diagnosticStoreSet(current.filter((item) => item && item.eventId !== event.eventId));
      diagnosticFlushPromise = null;
      if (diagnosticStoreGet().length) window.setTimeout(flushDiagnosticQueue, 120);
    }).catch(() => {
      diagnosticFlushPromise = null;
      diagnosticRetryCount += 1;
      diagnosticRetryTimer = window.setTimeout(flushDiagnosticQueue, Math.min(60000, 2000 * Math.pow(2, Math.min(diagnosticRetryCount - 1, 5))));
    });
    return diagnosticFlushPromise;
  }

  function reportDiagnostic(error, options) {
    try {
      const event = createDiagnosticEvent(error, options || {});
      const dedupKey = [event.fingerprint, event.sku, event.severity].join('|');
      const recent = diagnosticRecent[dedupKey];
      if (recent && Date.now() - recent.at < DIAGNOSTIC_DEDUP_MS) return recent.code;
      Object.keys(diagnosticRecent).forEach((key) => {
        if (Date.now() - diagnosticRecent[key].at >= DIAGNOSTIC_DEDUP_MS) delete diagnosticRecent[key];
      });
      diagnosticRecent[dedupKey] = { at: Date.now(), code: event.errorCode };
      enqueueDiagnostic(event);
      return event.errorCode;
    } catch (_) {
      return '';
    }
  }

  function reportDiagnosticFromLog(message, detail, severity) {
    const error = { message: [message, detail && detail.message || detail].filter(Boolean).join(' | '), stack: detail && detail.stack || '' };
    return reportDiagnostic(error, {
      feature: inferDiagnosticFeature(error.message),
      action: sanitizeDiagnosticText(message, 80),
      severity: severity || 'error',
      detail,
    });
  }

  function runDiagnosticAction(handler, event) {
    const target = event && event.target;
    const button = target && target.closest && target.closest('[data-action]');
    const action = button && button.getAttribute('data-action') || handler.name || 'panel-action';
    const sku = button && button.getAttribute('data-sku') || '';
    const failed = (error) => {
      if (error && error.name === 'AbortError') return;
      const code = reportDiagnostic(error, { feature: inferDiagnosticFeature(action), action, sku });
      showToast('操作失败：' + formatErrorMessage(error) + (code ? ' · 错误编号 ' + code : ''), { diagnostic: false });
    };
    try {
      const result = handler(event);
      if (result && typeof result.then === 'function') result.catch(failed);
    } catch (error) { failed(error); }
  }

  function reportDiagnosticRequest(error, url, feature, method) {
    const endpoint = String(url || '').split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/i, '').slice(0, 160);
    return reportDiagnostic(error, { feature, action: method + ' ' + endpoint, sku: typeof findSku === 'function' ? findSku(String(url || '')) : '' });
  }

  function isUserscriptDiagnostic(error, filename) {
    return /plm-material-summary|plm-floating-helper|pfh-|userscript/i.test([
      filename,
      error && error.stack,
      error && error.message,
    ].filter(Boolean).join(' '));
  }

  function installObservability() {
    if (diagnosticInstalled) return;
    diagnosticInstalled = true;
    window.addEventListener('error', (event) => {
      const target = event.target;
      const resource = target && (target.src || target.href) || '';
      if (resource && /exceljs|jszip|ali-oss|plm-material-summary|plm-floating-helper/i.test(resource)) {
        reportDiagnostic('依赖资源加载失败', { feature: 'resource', action: sanitizeDiagnosticText(resource, 120), severity: 'error' });
        return;
      }
      if (!isUserscriptDiagnostic(event.error, event.filename)) return;
      reportDiagnostic(event.error || event.message, { feature: 'runtime', action: 'window-error' });
    }, true);
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event && event.reason;
      if (!isUserscriptDiagnostic(reason, '')) return;
      reportDiagnostic(reason, { feature: 'runtime', action: 'unhandled-rejection' });
    });
    window.addEventListener('online', flushDiagnosticQueue);
    window.setTimeout(flushDiagnosticQueue, 1800);
  }
