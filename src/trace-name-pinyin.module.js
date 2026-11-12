  const TRACE_NAME_INITIALS_KEY = 'plm-floating-helper:trace-name-initials:v1';
  const traceNameInitialsPending = new Map();
  const traceNameInitialsRetryAt = new Map();

  function normalizeTraceName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function currentTraceName() {
    return normalizeTraceName(findCurrentPlmUserName() || state.sizeImageAccessName || state.parameterImageAccessName || (state.settings && state.settings.cloudBackupOwnerName));
  }

  function readTraceNameInitialsCache() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(TRACE_NAME_INITIALS_KEY, {}) : JSON.parse(localStorage.getItem(TRACE_NAME_INITIALS_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }

  function getTraceNameInitials(value) {
    const cache = readTraceNameInitialsCache();
    const key = encodeURIComponent(normalizeTraceName(value));
    const result = Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : '';
    return /^[A-Z]{1,80}$/.test(result) ? result : '';
  }

  function saveTraceNameInitials(value, initials) {
    const name = normalizeTraceName(value);
    if (!name) return;
    const cache = readTraceNameInitialsCache();
    const key = encodeURIComponent(name);
    if (initials) cache[key] = initials;
    else delete cache[key];
    if (typeof GM_setValue === 'function') GM_setValue(TRACE_NAME_INITIALS_KEY, cache);
    else localStorage.setItem(TRACE_NAME_INITIALS_KEY, JSON.stringify(cache));
  }

  function ensureCurrentTraceNameInitials(quiet) {
    const name = currentTraceName();
    if (!name || getTraceNameInitials(name) || !/\p{Script=Han}/u.test(name)) return Promise.resolve();
    if (traceNameInitialsPending.has(name)) return traceNameInitialsPending.get(name);
    if (Date.now() < (traceNameInitialsRetryAt.get(name) || 0)) return Promise.resolve();
    const pending = cloudRequest('/users/name-initials', { method: 'POST', timeoutMs: 10000, body: { name } })
      .then((result) => {
        if (!result || result.name !== name || !/^[A-Z]{1,80}$/.test(result.initials)) throw new Error('invalid name initials');
        // A correction entered while the request was running takes precedence.
        if (!getTraceNameInitials(name)) saveTraceNameInitials(name, result.initials);
        traceNameInitialsRetryAt.delete(name);
      }).catch(() => {
        traceNameInitialsRetryAt.set(name, Date.now() + 30000);
        if (!quiet && !getTraceNameInitials(name)) showToast('姓名缩写暂未获取，水印使用原姓名；可在设置中填写缩写');
      }).finally(() => { traceNameInitialsPending.delete(name); });
    traceNameInitialsPending.set(name, pending);
    return pending;
  }

  function traceNameInitialsSettingsHtml() {
    const name = currentTraceName();
    return '<label class="pfh-setting-row"><span>水印署名缩写</span><input type="text" name="pfh-trace-name-initials" data-trace-name="' + escapeHtml(name) + '" maxlength="20" value="' + escapeHtml(getTraceNameInitials(name)) + '" placeholder="自动获取，可手动修改"' + (name ? '' : ' disabled') + '></label>';
  }
