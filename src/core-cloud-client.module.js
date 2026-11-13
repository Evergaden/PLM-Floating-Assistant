
  function syncInsightEvent(eventType, payload) {
    window.setTimeout(() => {
      insightSyncQueue = insightSyncQueue.catch(() => {}).then(() => cloudRequestWithRetry('/insights/record', {
        method: 'POST',
        body: {
          ...(payload || {}),
          eventType,
          source: (payload && payload.source) || 'plm-helper',
          version: SCRIPT_VERSION,
        },
      }, { attempts: 2, baseDelayMs: 700 })).catch((error) => {
        addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25', formatErrorMessage(error));
      });
    }, 0);
  }

  async function fetchInsightSummary() {
    return cloudRequest('/insights/summary', { method: 'GET' });
  }

  async function fetchInsightReport() {
    return cloudRequest('/insights/report', { method: 'GET' });
  }

  async function fetchInsightAiReport(options) {
    const opts = options || {};
    const params = new URLSearchParams();
    params.set('model', getInsightAiModelSetting());
    if (opts.refresh) params.set('refresh', '1');
    return cloudRequest('/insights/ai-report?' + params.toString(), { method: 'GET' });
  }

  async function fetchInsightAiStatus() {
    return cloudRequest('/insights/ai-status?model=' + encodeURIComponent(getInsightAiModelSetting()), { method: 'GET' });
  }

  async function fetchInsightReadiness() {
    return cloudRequest('/insights/readiness?model=' + encodeURIComponent(getInsightAiModelSetting()), { method: 'GET' });
  }

  async function fetchClassificationRules() {
    return cloudRequest('/insights/classification-rules?limit=240', { method: 'GET' });
  }

  async function fetchClassificationSummarize(samples) {
    return cloudRequest('/insights/classification-summarize', { method: 'POST', timeoutMs: 90000, body: { version: SCRIPT_VERSION, aiModel: getInsightAiModelSetting(), samples: Array.isArray(samples) ? samples.slice(0, 300) : [] } });
  }



  async function fetchLoadingTips() {
    const now = new Date();
    const params = new URLSearchParams({
      name: findCurrentPlmUserName(),
      instanceId: getClientInstanceId(),
      version: SCRIPT_VERSION,
      date: formatLocalDate(now),
      time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      weekday: String(now.getDay()),
    });
    return cloudRequestWithRetry('/tips?' + params.toString(), { method: 'GET' }, { attempts: 2, baseDelayMs: 900 });
  }

  async function refreshLoadingTips(showFeedback) {
    try {
      const response = await fetchLoadingTips();
      const tips = normalizeLoadingTipItems(response && response.tips);
      state.loadingTips = tips;
      state.loadingTipsLoaded = true;
      if (showFeedback) showToast('\u5c0f\u63d0\u793a\u5df2\u5237\u65b0\uff1a' + tips.length + '\u6761');
    } catch (error) {
      state.loadingTips = DEFAULT_LOADING_TIPS.slice();
      state.loadingTipsLoaded = false;
      addLog('warn', '\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25\uff0c\u5df2\u4f7f\u7528\u672c\u5730\u9ed8\u8ba4\u63d0\u793a', formatErrorMessage(error));
      reportCloudConnectivityFailure('loading-tips', error);
      if (showFeedback) showToast('\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25\uff0c\u5df2\u4f7f\u7528\u9ed8\u8ba4\u63d0\u793a');
    }
  }

  function featureAccessCacheUserKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  function loadFeatureAccessCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(FEATURE_ACCESS_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(FEATURE_ACCESS_CACHE_KEY) || 'null');
      return saved && typeof saved === 'object' && saved.users && typeof saved.users === 'object'
        ? saved
        : { version: 1, users: {} };
    } catch (_) {
      return { version: 1, users: {} };
    }
  }

  function saveFeatureAccessCache(cache) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(FEATURE_ACCESS_CACHE_KEY, cache);
      else localStorage.setItem(FEATURE_ACCESS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('PLM feature access cache save failed:', error);
    }
  }

  function getCachedFeatureAccess(name) {
    const key = featureAccessCacheUserKey(name);
    const cache = loadFeatureAccessCache();
    const value = key && cache.users ? cache.users[key] : null;
    const checkedAt = Number(value && value.checkedAt) || 0;
    const ageMs = checkedAt ? Math.max(0, Date.now() - checkedAt) : Number.POSITIVE_INFINITY;
    return value && typeof value === 'object'
      ? { ...value, ageMs, usable: ageMs <= FEATURE_ACCESS_CACHE_TTL_MS + FEATURE_ACCESS_CACHE_GRACE_MS }
      : null;
  }

  function cacheFeatureAccess(name, patch) {
    const key = featureAccessCacheUserKey(name);
    if (!key) return null;
    const cache = loadFeatureAccessCache();
    const current = cache.users[key] && typeof cache.users[key] === 'object' ? cache.users[key] : {};
    const next = { ...current, ...(patch || {}), userName: String(name || ''), checkedAt: Date.now() };
    cache.users[key] = next;
    saveFeatureAccessCache(cache);
    return next;
  }

  function applyCachedFeatureAccess(name) {
    const cached = getCachedFeatureAccess(name);
    const result = { sizeImage: false, magicUpload: false, parameterImage: false, luluTheme: false };
    const accessNames = ['sizeImageAccessName', 'magicUploadAccessName', 'parameterImageAccessName', 'luluThemeAccessName'];
    const accessFlags = ['sizeImageAccessEnabled', 'magicUploadAccessEnabled', 'parameterImageAccessEnabled', 'luluThemeAccessEnabled'];
    const loadingFlags = ['sizeImageAccessLoading', 'magicUploadAccessLoading', 'parameterImageAccessLoading', 'luluThemeAccessLoading'];
    accessNames.forEach((key, index) => {
      if (state[key] && state[key] !== name) state[accessFlags[index]] = false;
      state[key] = name;
      state[loadingFlags[index]] = true;
    });
    if (!cached || !cached.usable) return result;
    if (typeof cached.sizeImageEnabled === 'boolean') {
      state.sizeImageAccessEnabled = cached.sizeImageEnabled;
      state.sizeImageAccessLoading = false;
      result.sizeImage = true;
    }
    if (typeof cached.magicUploadEnabled === 'boolean') {
      state.magicUploadAccessEnabled = cached.magicUploadEnabled;
      state.magicUploadAccessLoading = false;
      result.magicUpload = true;
    }
    if (typeof cached.parameterImageEnabled === 'boolean') {
      applyParameterImageAccessState(cached.parameterImageEnabled);
      state.parameterImageAccessLoading = false;
      result.parameterImage = true;
    }
    if (typeof cached.luluThemeEnabled === 'boolean') {
      applyLuluThemeAccessState(cached.luluThemeEnabled);
      state.luluThemeAccessLoading = false;
      result.luluTheme = true;
    }
    return result;
  }

  function getClientInstanceId() {
    try {
      let value = typeof GM_getValue === 'function' ? GM_getValue(USER_INSTANCE_KEY, '') : localStorage.getItem(USER_INSTANCE_KEY);
      if (!value) {
        value = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'browser-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
        if (typeof GM_setValue === 'function') GM_setValue(USER_INSTANCE_KEY, value);
        else localStorage.setItem(USER_INSTANCE_KEY, value);
      }
      return String(value).slice(0, 80);
    } catch (_) {
      return 'browser-session';
    }
  }

  function formatLocalDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function recordLoadingTipImpression(item) {
    if (!item || !item.tipId) return;
    cloudRequest('/tips/impression', {
      method: 'POST',
      body: { tipId: item.tipId, name: findCurrentPlmUserName(), instanceId: getClientInstanceId(), shownDay: formatLocalDate(new Date()) },
    }).catch(() => {});
  }

  function scheduleUserHeartbeat(delay) {
    if (state.userHeartbeatTimer) window.clearTimeout(state.userHeartbeatTimer);
    state.userHeartbeatTimer = window.setTimeout(() => {
      state.userHeartbeatTimer = 0;
      sendUserHeartbeat();
    }, Math.max(0, Number(delay) || 0));
  }

  async function sendUserHeartbeat() {
    const name = findCurrentPlmUserName();
    if (!name) {
      scheduleUserHeartbeat(3000);
      return;
    }
    applyCachedFeatureAccess(name);
    try {
      const response = await cloudRequestWithRetry('/users/heartbeat', {
        method: 'POST',
        body: { name, instanceId: getClientInstanceId(), version: SCRIPT_VERSION, skuCount: state.index.length },
      }, { attempts: 3, baseDelayMs: 900 });
      if (findCurrentPlmUserName() !== name) return;
      state.productDevelopmentAccess = { name, ...(response && response.developmentAccess || {}) };
      const accessPatch = {};
      let accessChanged = false;
      if (response && typeof response.sizeImageEnabled === 'boolean') {
        state.sizeImageAccessName = name;
        state.sizeImageAccessEnabled = response.sizeImageEnabled;
        state.sizeImageAccessLoading = false;
        accessPatch.sizeImageEnabled = response.sizeImageEnabled;
        accessChanged = true;
      }
      if (response && typeof response.magicUploadEnabled === 'boolean') {
        state.magicUploadAccessName = name;
        state.magicUploadAccessEnabled = response.magicUploadEnabled;
        state.magicUploadAccessLoading = false;
        accessPatch.magicUploadEnabled = response.magicUploadEnabled;
        accessChanged = true;
      }
      if (response && typeof response.parameterImageEnabled === 'boolean') {
        state.parameterImageAccessName = name;
        applyParameterImageAccessState(response.parameterImageEnabled);
        state.parameterImageAccessLoading = false;
        accessPatch.parameterImageEnabled = response.parameterImageEnabled;
        accessChanged = true;
      }
      if (response && typeof response.luluThemeEnabled === 'boolean') {
        state.luluThemeAccessName = name;
        applyLuluThemeAccessState(response.luluThemeEnabled);
        state.luluThemeAccessLoading = false;
        accessPatch.luluThemeEnabled = response.luluThemeEnabled;
        accessChanged = true;
      }
      if (accessChanged) {
        cacheFeatureAccess(name, accessPatch);
        if (state.view === 'home' || state.view === 'about' || state.view === 'parameterImage' || state.view === 'productDevelopmentTasks') renderShell();
      }
      if (!response || typeof response.magicUploadEnabled !== 'boolean') refreshMagicUploadAccess();
      if (!response || typeof response.parameterImageEnabled !== 'boolean') refreshParameterImageAccess();
      if (!response || typeof response.luluThemeEnabled !== 'boolean') refreshLuluThemeAccess();
      window.setTimeout(() => refreshLoadingTips(false), Math.floor(Math.random() * 30000));
    } catch (error) {
      addLog('warn', '使用状态同步失败', formatErrorMessage(error));
    } finally {
      scheduleUserHeartbeat(30 * 60 * 1000 + Math.floor(Math.random() * 90 * 1000));
    }
  }

  function recordSizeImageUsage(success) {
    const name = findCurrentPlmUserName();
    if (!name) return;
    cloudRequest('/usage/size-image', { method: 'POST', body: { name, success: Boolean(success) } }).catch(() => {});
  }

  function openLoadingTipsManager() {
    const url = CLOUD_BACKUP_API_BASE + '/admin';
    window.open(url, '_blank', 'noopener,noreferrer');
    refreshLoadingTips(true);
  }

  function scheduleSizeImageAccessRefresh(delay) {
    if (state.sizeImageAccessTimer) window.clearTimeout(state.sizeImageAccessTimer);
    state.sizeImageAccessTimer = window.setTimeout(() => {
      state.sizeImageAccessTimer = 0;
      refreshSizeImageAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshSizeImageAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      if (!state.sizeImageAccessName) state.sizeImageAccessLoading = true;
      scheduleSizeImageAccessRefresh(1500);
      return;
    }
    const hasCachedAccess = applyCachedFeatureAccess(name).sizeImage;
    let accessResolved = hasCachedAccess;
    state.sizeImageAccessName = name;
    state.sizeImageAccessLoading = !hasCachedAccess;
    if (state.view === 'home') renderShell();
    try {
      const response = await cloudRequestWithRetry('/features/size-image?name=' + encodeURIComponent(name), { method: 'GET' }, { attempts: 3, baseDelayMs: 900 });
      if (state.sizeImageAccessName !== name) return;
      if (!response || typeof response.enabled !== 'boolean') throw new Error('权限响应格式异常');
      state.sizeImageAccessEnabled = response.enabled;
      cacheFeatureAccess(name, { sizeImageEnabled: response.enabled });
      accessResolved = true;
    } catch (error) {
      addLog('warn', '生成尺寸图权限检查失败', formatErrorMessage(error));
      if (!accessResolved && state.view === 'home') offerNetworkDiagnostics('尺寸图权限获取失败，功能暂不可用', error);
    } finally {
      state.sizeImageAccessLoading = !accessResolved;
      if (state.view === 'home') renderShell();
    }
  }

  function applyParameterImageAccessState(enabled) {
    state.parameterImageAccessEnabled = Boolean(enabled);
    if (!state.parameterImageAccessEnabled && state.view === 'parameterImage') {
      state.view = 'detail';
      state.copywritingMode = false;
    }
  }

  function scheduleParameterImageAccessRefresh(delay) {
    if (state.parameterImageAccessTimer) window.clearTimeout(state.parameterImageAccessTimer);
    state.parameterImageAccessTimer = window.setTimeout(() => {
      state.parameterImageAccessTimer = 0;
      refreshParameterImageAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshParameterImageAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      if (!state.parameterImageAccessName) state.parameterImageAccessLoading = true;
      scheduleParameterImageAccessRefresh(1500);
      return;
    }
    const hasCachedAccess = applyCachedFeatureAccess(name).parameterImage;
    let accessResolved = hasCachedAccess;
    state.parameterImageAccessName = name;
    state.parameterImageAccessLoading = !hasCachedAccess;
    if (state.view === 'home' || state.view === 'detail' || state.view === 'parameterImage') renderShell();
    try {
      const response = await cloudRequestWithRetry('/features/parameter-image?name=' + encodeURIComponent(name), { method: 'GET' }, { attempts: 3, baseDelayMs: 900 });
      if (state.parameterImageAccessName !== name) return;
      if (!response || typeof response.enabled !== 'boolean') throw new Error('权限响应格式异常');
      applyParameterImageAccessState(response.enabled);
      cacheFeatureAccess(name, { parameterImageEnabled: response.enabled });
      accessResolved = true;
    } catch (error) {
      addLog('warn', '生成参数图权限检查失败', formatErrorMessage(error));
      if (!accessResolved && ['home', 'detail', 'parameterImage'].includes(state.view)) offerNetworkDiagnostics('参数图权限获取失败，功能暂不可用', error);
    } finally {
      state.parameterImageAccessLoading = !accessResolved;
      if (state.view === 'home' || state.view === 'detail' || state.view === 'parameterImage') renderShell();
    }
  }

  function applyLuluThemeAccessState(enabled) {
    state.luluThemeAccessEnabled = Boolean(enabled);
    if (!state.luluThemeAccessEnabled && normalizeThemeId(state.settings.theme) === 'lulu') {
      state.settings.theme = DEFAULT_THEME_ID;
      state.settings.themeSkinVersion = THEME_SKIN_VERSION;
      saveSettings(state.settings);
      applyThemeToView();
      showToast('噜噜乐园主题暂未开放，已切回默认主题');
    }
  }

  function scheduleLuluThemeAccessRefresh(delay) {
    if (state.luluThemeAccessTimer) window.clearTimeout(state.luluThemeAccessTimer);
    state.luluThemeAccessTimer = window.setTimeout(() => {
      state.luluThemeAccessTimer = 0;
      refreshLuluThemeAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshLuluThemeAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      if (!state.luluThemeAccessName) state.luluThemeAccessLoading = true;
      scheduleLuluThemeAccessRefresh(1500);
      return;
    }
    const hasCachedAccess = applyCachedFeatureAccess(name).luluTheme;
    let accessResolved = hasCachedAccess;
    state.luluThemeAccessName = name;
    state.luluThemeAccessLoading = !hasCachedAccess;
    if (state.view === 'home' || state.view === 'about') renderShell();
    try {
      const response = await cloudRequestWithRetry('/features/lulu-theme?name=' + encodeURIComponent(name), { method: 'GET' }, { attempts: 3, baseDelayMs: 900 });
      if (state.luluThemeAccessName !== name) return;
      if (!response || typeof response.enabled !== 'boolean') throw new Error('权限响应格式异常');
      applyLuluThemeAccessState(response.enabled);
      cacheFeatureAccess(name, { luluThemeEnabled: response.enabled });
      accessResolved = true;
    } catch (error) {
      addLog('warn', '噜噜乐园主题权限检查失败', formatErrorMessage(error));
      if (!accessResolved && (state.view === 'about' || normalizeThemeId(state.settings.theme) === 'lulu')) offerNetworkDiagnostics('主题权限获取失败', error);
    } finally {
      state.luluThemeAccessLoading = !accessResolved;
      if (state.view === 'home' || state.view === 'about') renderShell();
    }
  }

  function parseCloudAuthExpiry(value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric > 1e12 ? numeric : numeric * 1000;
    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function readCloudAuthToken() {
    const isUsable = (value) => Boolean(
      value && typeof value.token === 'string' && value.token.split('.').length === 3
      && Number(value.expiresAt) > Date.now() + CLOUD_AUTH_TOKEN_SKEW_MS,
    );
    if (isUsable(cloudAuthState)) return cloudAuthState;
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(CLOUD_AUTH_TOKEN_KEY, null) : null;
      if (isUsable(saved)) {
        cloudAuthState = {
          token: String(saved.token),
          expiresAt: Number(saved.expiresAt),
          user: saved.user || null,
        };
        return cloudAuthState;
      }
    } catch (_) {
      // Use the in-memory token when the userscript manager storage is unavailable.
    }
    return null;
  }

  function clearCloudAuthToken() {
    cloudAuthState = null;
    try {
      if (typeof GM_deleteValue === 'function') GM_deleteValue(CLOUD_AUTH_TOKEN_KEY);
    } catch (_) {
      // Ignore storage cleanup failures; the in-memory token is already gone.
    }
  }

  function saveCloudAuthToken(response) {
    const token = String(response && response.token || '').trim();
    const expiresAt = parseCloudAuthExpiry(response && response.expiresAt)
      || (Date.now() + 8 * 60 * 60 * 1000);
    if (!token || token.split('.').length !== 3 || expiresAt <= Date.now()) {
      throw new Error('云端登录令牌无效');
    }
    cloudAuthState = { token, expiresAt, user: response && response.user || null };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(CLOUD_AUTH_TOKEN_KEY, cloudAuthState);
    } catch (_) {
      // The token remains usable for this page session.
    }
    return token;
  }

  async function ensureCloudAuthToken(force) {
    if (!force) {
      const cached = readCloudAuthToken();
      if (cached) return cached.token;
    } else {
      clearCloudAuthToken();
    }
    if (cloudAuthExchangePromise) return cloudAuthExchangePromise;
    cloudAuthExchangePromise = (async () => {
      let plmToken = await waitForPlmBearerToken();
      if (!plmToken) throw new Error('未检测到 PLM 登录态，请先刷新 PLM 页面后重试');
      try {
        const response = await cloudTransport('/auth/exchange', {
          method: 'POST',
          timeoutMs: CLOUD_AUTH_EXCHANGE_TIMEOUT_MS,
        }, { Authorization: 'Bearer ' + plmToken });
        return saveCloudAuthToken(response);
      } finally {
        plmToken = '';
      }
    })().finally(() => {
      cloudAuthExchangePromise = null;
    });
    return cloudAuthExchangePromise;
  }

  function createCloudTransportError(message, details) {
    const error = new Error(message);
    Object.assign(error, details || {});
    return error;
  }

  function shouldRetryCloudTransport(path, method, error) {
    const safeRetry = method === 'GET'
      || path === '/auth/exchange'
      || path === '/backup/save'
      || path === '/backup/chunk'
      || path === '/backup/load'
      || path === '/backup/load-chunk';
    if (!safeRetry) return false;
    const status = Number(error && error.status) || 0;
    return Boolean(error && error.cloudTransportFailure) || status >= 500;
  }

  function cloudTransportOnce(baseUrl, path, options, extraHeaders) {
    const method = (options && options.method) || 'GET';
    const body = options && options.body ? JSON.stringify(options.body) : null;
    const url = baseUrl + path;
    const timeoutMs = Number(options && options.timeoutMs) || 30000;
    const headers = {
      'content-type': 'application/json',
      ...((options && options.headers) || {}),
      ...(extraHeaders || {}),
    };
    return new Promise((resolve, reject) => {
      const handleLoad = (response) => {
        const text = response.responseText || '';
        let data = null;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          if (response.status >= 200 && response.status < 300 && path === '/backup/save') {
            resolve({ ok: true, responseFormat: 'html' });
            return;
          }
          reject(createCloudTransportError('云端返回了非 JSON 响应（HTTP ' + response.status + '）', {
            status: Number(response.status) || 0,
            cloudTransportFailure: true,
          }));
          return;
        }
        if (response.status < 200 || response.status >= 300) {
          reject(buildCloudError(data, response.status));
          return;
        }
        resolve(data);
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method,
          url,
          headers,
          data: body,
          onload: handleLoad,
          onerror: () => reject(createCloudTransportError('云端请求被浏览器拦截或网络不可用', { cloudTransportFailure: true })),
          ontimeout: () => reject(createCloudTransportError('timeout', { cloudTransportFailure: true })),
          timeout: timeoutMs,
        });
        return;
      }
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
      fetch(url, {
        method,
        signal: controller ? controller.signal : undefined,
        headers,
        body,
      }).then(async (response) => {
        const text = await response.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (error) {
          if (response.ok && path === '/backup/save') return { ok: true, responseFormat: 'html' };
          throw createCloudTransportError('云端返回了非 JSON 响应（HTTP ' + response.status + '）', {
            status: Number(response.status) || 0,
            cloudTransportFailure: true,
          });
        }
        if (!response.ok) throw buildCloudError(data, response.status);
        return data;
      }).then(resolve, (error) => {
        if (error && error.name === 'AbortError') {
          reject(createCloudTransportError('timeout', { cloudTransportFailure: true }));
        } else if (error && (error.status || error.cloudTransportFailure)) {
          reject(error);
        } else {
          reject(createCloudTransportError(error && error.message || '云端网络请求失败', { cloudTransportFailure: true, cause: error }));
        }
      }).finally(() => {
        if (timer) window.clearTimeout(timer);
      });
    });
  }

  async function cloudTransport(path, options, extraHeaders) {
    const method = (options && options.method) || 'GET';
    const firstBase = cloudApiBase;
    const secondBase = firstBase === CLOUD_BACKUP_API_BASE
      ? CLOUD_ASSET_FALLBACK_API_BASE
      : CLOUD_BACKUP_API_BASE;
    try {
      return await cloudTransportOnce(firstBase, path, options, extraHeaders);
    } catch (error) {
      if (secondBase === firstBase || !shouldRetryCloudTransport(path, method, error)) throw error;
      const response = await cloudTransportOnce(secondBase, path, options, extraHeaders);
      cloudApiBase = secondBase;
      return response;
    }
  }

  async function cloudRequest(path, options) {
    try {
      const response = await authenticatedCloudRequest(path, options);
      recordNetworkPermissionResult(path, response, null);
      return response;
    }
    catch (error) {
      recordNetworkPermissionResult(path, null, error);
      if (!/^\/diagnostics(?:\/|$)/.test(path)) reportDiagnosticRequest(error, path, 'cloud', options && options.method || 'GET');
      throw error;
    }
  }

  async function authenticatedCloudRequest(path, options) {
    const requestOptions = options || {};
    const token = await ensureCloudAuthToken(Boolean(requestOptions.forceAuth));
    try {
      return await cloudTransport(path, requestOptions, { Authorization: 'Bearer ' + token });
    } catch (error) {
      if (Number(error && error.status) !== 401 || requestOptions.__authRetried) throw error;
      clearCloudAuthToken();
      return cloudTransport(path, { ...requestOptions, __authRetried: true }, {
        Authorization: 'Bearer ' + await ensureCloudAuthToken(true),
      });
    }
  }

  function cloudRequestWithRetry(path, options, retryOptions) {
    const attempts = Math.max(1, Number(retryOptions && retryOptions.attempts) || 1);
    const baseDelayMs = Math.max(100, Number(retryOptions && retryOptions.baseDelayMs) || 600);
    const run = (attempt) => cloudRequest(path, options).catch((error) => {
      const status = Number(error && error.status) || 0;
      const retryable = Boolean(error && error.cloudTransportFailure)
        || status >= 500
        || /timeout|network|internal server error|overload/i.test(formatErrorMessage(error));
      if (!retryable || attempt >= attempts) throw error;
      const delay = baseDelayMs * attempt + Math.floor(Math.random() * baseDelayMs);
      return new Promise((resolve) => window.setTimeout(resolve, delay)).then(() => run(attempt + 1));
    });
    return run(1);
  }

  function buildCloudError(data, status) {
    const error = new Error(formatCloudError(data, status));
    error.cloudData = data || {};
    error.status = status;
    return error;
  }

  function formatCloudError(data, status) {
    const parts = [];
    if (data && data.error) parts.push(data.error);
    if (data && data.message) parts.push(data.message);
    if (data && data.warning) parts.push(data.warning);
    if (data && data.summary) parts.push(data.summary);
    return parts.filter(Boolean).join('\uff1a') || ('HTTP ' + status);
  }

  function formatErrorMessage(error) {
    return error && error.message ? error.message : String(error || '\u672a\u77e5\u9519\u8bef');
  }

  function formatErrorDiagnostic(error) {
    const message = formatErrorMessage(error);
    const stackLine = error && error.stack
      ? String(error.stack).split(/\r?\n/).slice(1).find((line) => line && line.trim())
      : '';
    return [message, stackLine && stackLine.trim()].filter(Boolean).join(' | ').slice(0, 500);
  }

  function neutralizeTechnicalTerms(value) {
    return String(value || '')
      .replace(/\bAPI\b/gi, '\u540e\u53f0\u670d\u52a1')
      .replace(/\u63a5\u53e3/g, '\u6570\u636e\u670d\u52a1');
  }

  function neutralizeVisibleTechnicalText(root) {
    if (!root || typeof document === 'undefined') return;
    const walker = document.createTreeWalker(root, 4);
    let node = walker.nextNode();
    while (node) {
      const next = walker.nextNode();
      const text = neutralizeTechnicalTerms(node.nodeValue);
      if (text !== node.nodeValue) node.nodeValue = text;
      node = next;
    }
    if (root.querySelectorAll) {
      root.querySelectorAll('[title], [aria-label]').forEach((element) => {
        ['title', 'aria-label'].forEach((attribute) => {
          if (element.hasAttribute(attribute)) {
            const value = neutralizeTechnicalTerms(element.getAttribute(attribute));
            if (value !== element.getAttribute(attribute)) element.setAttribute(attribute, value);
          }
        });
      });
    }
  }

  function installVisibleTechnicalTextNeutralizer(panel) {
    if (!panel || panel.__pfhTechnicalTextNeutralizer || typeof MutationObserver === 'undefined') return;
    panel.__pfhTechnicalTextNeutralizer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') neutralizeVisibleTechnicalText(mutation.target.parentElement || panel);
        else mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 || node.nodeType === 3) neutralizeVisibleTechnicalText(node.nodeType === 3 ? node.parentElement : node);
        });
      });
    });
    panel.__pfhTechnicalTextNeutralizer.observe(panel, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['title', 'aria-label'] });
    neutralizeVisibleTechnicalText(panel);
  }
