  const DIAGNOSTIC_QUEUE_KEY = 'plm-floating-helper:diagnostics:v1';
  const DIAGNOSTIC_QUEUE_LIMIT = 30;
  const DIAGNOSTIC_DEDUP_MS = 5 * 60 * 1000;
  const diagnosticRecent = Object.create(null);
  let diagnosticFlushPromise = null;
  let diagnosticInstalled = false;

  function diagnosticStoreGet() {
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
    try {
      if (typeof GM_setValue === 'function') GM_setValue(DIAGNOSTIC_QUEUE_KEY, queue);
      else localStorage.setItem(DIAGNOSTIC_QUEUE_KEY, JSON.stringify(queue));
    } catch (_) {
      // The report still remains visible in the runtime log when storage is full.
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
    if (/Excel|表格|Workbook|worksheet|sheets/i.test(text)) return 'excel';
    if (/上传|提审|图包|标签/i.test(text)) return 'upload';
    if (/备份|恢复/i.test(text)) return 'backup';
    if (/参数图|尺寸图/i.test(text)) return 'image';
    if (/AI|文案|成分表/i.test(text)) return 'ai-content';
    if (/云端|同步|网络|请求/i.test(text)) return 'cloud';
    return 'runtime';
  }

  function currentDiagnosticSku(message) {
    const fromMessage = typeof findSku === 'function' ? findSku(String(message || '')) : '';
    return String(fromMessage || state && state.data && state.data.sku || state && state.selectedSku || '').trim().slice(0, 80);
  }

  function createDiagnosticEvent(error, options) {
    const source = error instanceof Error ? error : new Error(String(error || '未知错误'));
    const message = sanitizeDiagnosticText(source.message || error, 600) || '未知错误';
    const stack = sanitizeDiagnosticText(source.stack || '', 3000);
    const feature = sanitizeDiagnosticText(options && options.feature || inferDiagnosticFeature(message), 60);
    const action = sanitizeDiagnosticText(options && options.action || 'runtime', 80);
    const fingerprint = diagnosticHash([feature, action, message.replace(/\d+/g, '#'), stack.split(/\r?\n/)[1] || ''].join('|'));
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
      sku: currentDiagnosticSku([message, options && options.detail].filter(Boolean).join(' ')),
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
    const queue = diagnosticStoreGet();
    if (!queue.length) return null;
    const event = queue[0];
    diagnosticFlushPromise = cloudRequest('/diagnostics/report', {
      method: 'POST',
      timeoutMs: 10000,
      body: event,
      headers: { 'x-plm-request-id': event.eventId },
    }).then(() => {
      const current = diagnosticStoreGet();
      diagnosticStoreSet(current.filter((item) => item && item.eventId !== event.eventId));
      diagnosticFlushPromise = null;
      if (diagnosticStoreGet().length) window.setTimeout(flushDiagnosticQueue, 120);
    }).catch(() => {
      diagnosticFlushPromise = null;
    });
    return diagnosticFlushPromise;
  }

  function reportDiagnostic(error, options) {
    try {
      const event = createDiagnosticEvent(error, options || {});
      const recent = diagnosticRecent[event.fingerprint];
      if (recent && Date.now() - recent.at < DIAGNOSTIC_DEDUP_MS) return recent.code;
      diagnosticRecent[event.fingerprint] = { at: Date.now(), code: event.errorCode };
      enqueueDiagnostic(event);
      return event.errorCode;
    } catch (_) {
      return '';
    }
  }

  function reportDiagnosticFromLog(message, detail) {
    const error = detail instanceof Error ? detail : new Error([message, detail].filter(Boolean).join(' | '));
    return reportDiagnostic(error, {
      feature: inferDiagnosticFeature(message),
      action: sanitizeDiagnosticText(message, 80),
      detail,
    });
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
      if (!isUserscriptDiagnostic(event.error, event.filename)) return;
      reportDiagnostic(event.error || event.message, { feature: 'runtime', action: 'window-error' });
    });
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event && event.reason;
      if (!isUserscriptDiagnostic(reason, '')) return;
      reportDiagnostic(reason, { feature: 'runtime', action: 'unhandled-rejection' });
    });
    window.addEventListener('online', flushDiagnosticQueue);
    window.setTimeout(flushDiagnosticQueue, 1800);
  }
