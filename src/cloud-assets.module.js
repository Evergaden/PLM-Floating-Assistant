
  const CLOUD_ASSET_CACHE_KEY = 'plm-floating-helper:cloud-assets:v3';
  const CLOUD_RECOVERY_SESSION_KEY = 'plm-floating-helper:cloud-recovery:v1';
  const CLOUD_RECOVERY_REFRESH_MAX_AGE_MS = 10 * 60 * 1000;
  const CLOUD_ASSET_CACHE_SCHEMA = 1;
  const CLOUD_ASSET_REFRESH_MS = 24 * 60 * 60 * 1000;
  const FALLBACK_TUBE_SIZE_RULES = [
    { diameter: 19, bodies: [59, 64, 65, 75, 82, 85, 86, 88, 95, 98, 100, 104, 110, 112, 120], widths: [0.8, 1.5, 1.5, 1.5, 1.2] },
    { diameter: 22, bodies: [72, 81, 100, 110, 111], widths: [0.8, 1.75, 1.75, 1.75, 1.45] },
    { diameter: 25, bodies: [70, 75, 80, 85, 88, 90, 92, 94, 95, 97, 104, 108, 110, 114, 115, 116, 134, 135, 154], widths: [0.8, 2, 2, 2, 1.65] },
    { diameter: 30, bodies: [65, 70, 78, 80, 85, 86, 89, 90, 92, 94, 98, 100, 105, 106, 108, 109, 110, 111, 113, 114, 115, 118, 120, 122, 148], widths: [0.8, 2.375, 2.375, 2.375, 2.075] },
    { diameter: 35, bodies: [89, 96, 100, 101, 104, 105, 114, 120, 121, 125, 130, 134, 135, 140, 142, 148, 151, 155, 164], widths: [0.9, 2.75, 2.75, 2.75, 2.35] },
    { diameter: 40, bodies: [82, 90, 106, 114, 118, 122, 126, 130, 133, 134, 135, 137, 138, 140, 145, 150, 160], widths: [0.9, 3.15, 3.15, 3.15, 2.75] },
    { diameter: 45, bodies: [94, 107, 158], widths: [0.9, 3.55, 3.55, 3.55, 3.15] },
    { diameter: 50, bodies: [95, 180], widths: [0.9, 3.925, 3.925, 3.925, 3.525] },
  ];
  let BRAND_COMPLIANCE_DATA = [];
  let TUBE_SIZE_RULES = FALLBACK_TUBE_SIZE_RULES.slice();
  let TUBE_SIZE_SPECS = [];
  let TEMPLATE_XLSX_BASE64 = '';
  let ICON_ASSETS = Object.create(null);
  let cloudAssetCache = loadCloudAssetCache();
  let cloudAssetRefreshPromise = null;

  applyCloudAssetCache(cloudAssetCache);

  function loadCloudAssetCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(CLOUD_ASSET_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(CLOUD_ASSET_CACHE_KEY) || 'null');
      if (!saved || Number(saved.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  function saveCloudAssetCache(value) {
    if (typeof GM_setValue === 'function') GM_setValue(CLOUD_ASSET_CACHE_KEY, value);
    else localStorage.setItem(CLOUD_ASSET_CACHE_KEY, JSON.stringify(value));
  }

  function hasCompleteCloudAssetCache(value) {
    const runtime = value && value.runtimeData;
    return Boolean(
      Number(value && value.schemaVersion) === CLOUD_ASSET_CACHE_SCHEMA
      && runtime && Array.isArray(runtime.brands) && runtime.brands.length
      && Array.isArray(runtime.tubeRules) && runtime.tubeRules.length
      && Array.isArray(runtime.tubeSpecs) && runtime.tubeSpecs.length
      && typeof value.templateBase64 === 'string' && value.templateBase64.length > 1000
      && value.icons && typeof value.icons === 'object' && Object.keys(value.icons).length
    );
  }

  function applyCloudAssetCache(value) {
    if (!value || Number(value.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA) return false;
    const runtime = value.runtimeData || {};
    if (Array.isArray(runtime.brands) && runtime.brands.length) BRAND_COMPLIANCE_DATA = runtime.brands;
    if (Array.isArray(runtime.tubeRules) && runtime.tubeRules.length) TUBE_SIZE_RULES = runtime.tubeRules;
    if (Array.isArray(runtime.tubeSpecs) && runtime.tubeSpecs.length) TUBE_SIZE_SPECS = runtime.tubeSpecs;
    if (typeof value.templateBase64 === 'string' && value.templateBase64.length > 1000) TEMPLATE_XLSX_BASE64 = value.templateBase64;
    if (value.icons && typeof value.icons === 'object') ICON_ASSETS = value.icons;
    return true;
  }

  function getCachedCloudUiStyles() {
    if (String(cloudAssetCache && cloudAssetCache.uiAssetVersion || '') !== UI_ASSET_VERSION) return '';
    if (!cloudUiAssetPathMatchesVersion(cloudAssetCache && cloudAssetCache.uiAssetPath)) return '';
    const css = cloudAssetCache && cloudAssetCache.uiCss;
    return typeof css === 'string' && css.length > 10000 ? css : '';
  }

  function cloudUiAssetPathMatchesVersion(value) {
    const path = String(value || '').replace(/\\/g, '/');
    return path.endsWith('/ui-' + UI_ASSET_VERSION + '.css') || path === 'ui-' + UI_ASSET_VERSION + '.css';
  }

  function cloudUiDescriptorMatchesVersion(descriptor) {
    return Boolean(descriptor && cloudUiAssetPathMatchesVersion(descriptor.path));
  }

  function cloudBrandComplianceNeedsRefresh(cache) {
    const brands = cache && cache.runtimeData && cache.runtimeData.brands;
    if (!Array.isArray(brands)) return false;
    const amz = brands.find((item) => String(item && item.brand || '').trim().toUpperCase() === 'AMZ');
    return Boolean(amz && (!amz.us_rep || !cleanComplianceValue(amz.us_rep.company)));
  }

  function scheduleCloudAssetRefresh(delay) {
    window.setTimeout(async () => {
      let assetsReady = false;
      try {
        await refreshCloudAssets(false);
        assetsReady = true;
      } catch (error) {
        if (typeof showUiOfflineFallback === 'function') showUiOfflineFallback(error);
        addLog('warn', '\u4e91\u7aef\u8d44\u6e90\u66f4\u65b0\u5931\u8d25', formatErrorMessage(error));
        reportCloudConnectivityFailure('cloud-assets', error);
      }
      try {
        await refreshBrandComplianceData();
        if (assetsReady) markCloudRecoverySucceeded();
      } catch (error) {
        addLog('warn', '\u54c1\u724c\u5730\u5740\u66f4\u65b0\u5931\u8d25\uff0c\u7ee7\u7eed\u4f7f\u7528\u672c\u5730\u5907\u7528\u6570\u636e', formatErrorMessage(error));
        reportCloudConnectivityFailure('brand-compliance', error);
      }
    }, Math.max(0, Number(delay) || 0));
  }

  function readCloudRecoverySession() {
    try {
      const value = JSON.parse(sessionStorage.getItem(CLOUD_RECOVERY_SESSION_KEY) || 'null');
      const refreshExpired = value && value.status === 'refreshing'
        && Date.now() - Number(value.updatedAt || 0) > CLOUD_RECOVERY_REFRESH_MAX_AGE_MS;
      if (!value || !value.status || refreshExpired) {
        sessionStorage.removeItem(CLOUD_RECOVERY_SESSION_KEY);
        return null;
      }
      return value;
    } catch (_) {
      return null;
    }
  }

  function writeCloudRecoverySession(status) {
    try {
      sessionStorage.setItem(CLOUD_RECOVERY_SESSION_KEY, JSON.stringify({ status, updatedAt: Date.now() }));
    } catch (_) {}
  }

  function isCloudConnectivityFailure(error) {
    const message = formatErrorMessage(error).toLowerCase();
    return /network|failed to fetch|load failed|timeout|browser|blocked|cloud asset|internal server error|\u7f51\u7edc|\u6d4f\u89c8\u5668|\u62e6\u622a|\u8d85\u65f6|\u4e91\u7aef\u8bf7\u6c42/.test(message);
  }

  function reportCloudConnectivityFailure(source, error) {
    if (!isCloudConnectivityFailure(error) || !state) return;
    const sources = Array.isArray(state.cloudRecoveryFailureSources) ? state.cloudRecoveryFailureSources : [];
    if (source && !sources.includes(source)) sources.push(source);
    state.cloudRecoveryFailureSources = sources;
    if (state.cloudRecoveryCheckTimer || state.cloudRecoveryChecking || state.cloudRecoveryPromptVisible) return;
    state.cloudRecoveryCheckTimer = window.setTimeout(runCloudRecoveryCheck, 1400);
  }

  async function runCloudRecoveryCheck() {
    window.clearTimeout(state.cloudRecoveryCheckTimer);
    state.cloudRecoveryCheckTimer = 0;
    if (state.cloudRecoveryChecking) return;
    state.cloudRecoveryChecking = true;
    try {
      await refreshCloudAssets(true);
      await refreshBrandComplianceData();
      markCloudRecoverySucceeded();
    } catch (error) {
      const session = readCloudRecoverySession();
      if (session && (session.status === 'refreshing' || session.status === 'suppressed')) {
        writeCloudRecoverySession('suppressed');
        state.cloudRecoveryPromptVisible = false;
      } else {
        state.cloudRecoveryPromptVisible = true;
      }
      if (state.view === 'home') renderShell();
    } finally {
      state.cloudRecoveryChecking = false;
    }
  }

  function markCloudRecoverySucceeded() {
    if (!state) return;
    window.clearTimeout(state.cloudRecoveryCheckTimer);
    state.cloudRecoveryCheckTimer = 0;
    state.cloudRecoveryChecking = false;
    state.cloudRecoveryFailureSources = [];
    const wasVisible = Boolean(state.cloudRecoveryPromptVisible);
    state.cloudRecoveryPromptVisible = false;
    try { sessionStorage.removeItem(CLOUD_RECOVERY_SESSION_KEY); } catch (_) {}
    if (wasVisible && state.view === 'home') renderShell();
  }

  function refreshPageForCloudRecovery() {
    writeCloudRecoverySession('refreshing');
    window.location.reload();
  }

  function cloudRecoveryNoticeHtml() {
    if (!state.cloudRecoveryPromptVisible) return '';
    return '<aside class="pfh-cloud-recovery" role="status"><span class="pfh-cloud-recovery-icon" aria-hidden="true">!</span><div><strong>部分主页功能暂时不可用</strong><p>已自动重试，云端请求仍被浏览器拦截或网络不可用。刷新页面通常可以恢复权限状态。</p></div><button type="button" data-action="cloud-recovery-refresh-page">刷新本网页</button></aside>';
  }

  async function refreshBrandComplianceData() {
    const response = await cloudRequest('/brand-compliance', { method: 'GET' });
    const brands = response && response.brands;
    if (!Array.isArray(brands) || !brands.length) throw new Error('cloud brand compliance data is empty');
    BRAND_COMPLIANCE_DATA = brands;
    if (cloudAssetCache && cloudAssetCache.runtimeData) {
      cloudAssetCache = {
        ...cloudAssetCache,
        runtimeData: { ...cloudAssetCache.runtimeData, brands },
        brandComplianceUpdatedAt: String(response.updatedAt || new Date().toISOString()),
      };
      saveCloudAssetCache(cloudAssetCache);
    }
    return brands;
  }

  async function ensureBrandComplianceDataLoaded() {
    if (Array.isArray(BRAND_COMPLIANCE_DATA) && BRAND_COMPLIANCE_DATA.length) return true;
    try {
      await refreshCloudAssets(false);
    } catch (error) {
      addLog('warn', '\u54c1\u724c\u5730\u5740\u8d44\u6e90\u52a0\u8f7d\u5931\u8d25', formatErrorMessage(error));
    }
    if (Array.isArray(BRAND_COMPLIANCE_DATA) && BRAND_COMPLIANCE_DATA.length) return true;
    try {
      await refreshBrandComplianceData();
    } catch (error) {
      addLog('warn', '\u54c1\u724c\u5730\u5740\u8bfb\u53d6\u5931\u8d25', formatErrorMessage(error));
    }
    return Boolean(Array.isArray(BRAND_COMPLIANCE_DATA) && BRAND_COMPLIANCE_DATA.length);
  }

  function refreshCloudAssets(force) {
    if (cloudAssetRefreshPromise) return cloudAssetRefreshPromise;
    cloudAssetRefreshPromise = refreshCloudAssetsNow(Boolean(force)).finally(() => {
      cloudAssetRefreshPromise = null;
    });
    return cloudAssetRefreshPromise;
  }

  async function refreshCloudAssetsNow(force) {
    const now = Date.now();
    const hasUiStyles = Boolean(getCachedCloudUiStyles());
    const staleBrandCompliance = cloudBrandComplianceNeedsRefresh(cloudAssetCache);
    const staleUiAsset = String(cloudAssetCache && cloudAssetCache.uiAssetVersion || '') !== UI_ASSET_VERSION;
    if (!force && !staleBrandCompliance && !staleUiAsset && hasCompleteCloudAssetCache(cloudAssetCache) && hasUiStyles && now - Number(cloudAssetCache.checkedAt || 0) < CLOUD_ASSET_REFRESH_MS) {
      return cloudAssetCache;
    }
    const manifest = await cloudAssetRequest('/assets/manifest.json', 'json');
    if (!manifest || Number(manifest.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA || !manifest.assets) {
      throw new Error('unsupported cloud asset manifest');
    }
    const runtimeDescriptor = manifest.assets.runtimeData;
    const templateDescriptor = manifest.assets.excelTemplate;
    const iconsDescriptor = manifest.assets.icons;
    const uiDescriptor = manifest.assets.uiStyles;
    if (!runtimeDescriptor || !templateDescriptor || !iconsDescriptor || !uiDescriptor) throw new Error('cloud asset manifest is incomplete');
    if (!cloudUiDescriptorMatchesVersion(uiDescriptor)) throw new Error('cloud UI asset version mismatch');
    const cachedUiHash = String(cloudAssetCache && cloudAssetCache.uiAssetHash || '').toLowerCase();
    const manifestUiHash = String(uiDescriptor.sha256 || '').toLowerCase();
    const uiDescriptorUnchanged = String(cloudAssetCache && cloudAssetCache.uiAssetPath || '') === String(uiDescriptor.path || '')
      && Boolean(cachedUiHash && manifestUiHash && cachedUiHash === manifestUiHash);
    if (!force && !staleBrandCompliance && hasCompleteCloudAssetCache(cloudAssetCache) && hasUiStyles && uiDescriptorUnchanged && cloudAssetCache.dataVersion === manifest.dataVersion) {
      cloudAssetCache = { ...cloudAssetCache, checkedAt: now };
      saveCloudAssetCache(cloudAssetCache);
      return cloudAssetCache;
    }
    const uiCss = await fetchCloudAsset(uiDescriptor, 'text');
    if (typeof uiCss !== 'string' || uiCss.length < 10000 || !uiCss.includes('#' + PANEL_ID)) {
      throw new Error('cloud UI stylesheet is invalid');
    }
    applyCloudUiStyles(uiCss);
    cloudAssetCache = {
      ...(cloudAssetCache || {}),
      schemaVersion: CLOUD_ASSET_CACHE_SCHEMA,
      dataVersion: String(manifest.dataVersion || ''),
      uiAssetVersion: UI_ASSET_VERSION,
      uiAssetPath: String(uiDescriptor.path || ''),
      uiAssetHash: String(uiDescriptor.sha256 || '').toLowerCase(),
      uiCss,
      uiCssUpdatedAt: new Date(now).toISOString(),
    };
    saveCloudAssetCache(cloudAssetCache);
    const [runtimeText, templateBuffer, iconsText] = await Promise.all([
      fetchCloudAsset(runtimeDescriptor, 'text'),
      fetchCloudAsset(templateDescriptor, 'arraybuffer'),
      fetchCloudAsset(iconsDescriptor, 'text'),
    ]);
    const runtimeData = JSON.parse(runtimeText);
    const iconPackage = JSON.parse(iconsText);
    if (!runtimeData || Number(runtimeData.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA
      || !Array.isArray(runtimeData.brands) || !Array.isArray(runtimeData.tubeRules) || !Array.isArray(runtimeData.tubeSpecs)) {
      throw new Error('cloud runtime data is invalid');
    }
    if (!iconPackage || Number(iconPackage.schemaVersion) !== CLOUD_ASSET_CACHE_SCHEMA
      || !iconPackage.icons || typeof iconPackage.icons !== 'object') {
      throw new Error('cloud icon data is invalid');
    }
    const nextCache = {
      schemaVersion: CLOUD_ASSET_CACHE_SCHEMA,
      dataVersion: String(manifest.dataVersion || ''),
      uiAssetVersion: UI_ASSET_VERSION,
      uiAssetPath: String(uiDescriptor.path || ''),
      uiAssetHash: String(uiDescriptor.sha256 || '').toLowerCase(),
      checkedAt: now,
      updatedAt: new Date(now).toISOString(),
      runtimeData,
      templateBase64: arrayBufferToBase64(templateBuffer),
      icons: iconPackage.icons,
      uiCss,
    };
    if (!hasCompleteCloudAssetCache(nextCache)) throw new Error('cloud asset cache is incomplete');
    saveCloudAssetCache(nextCache);
    cloudAssetCache = nextCache;
    applyCloudAssetCache(nextCache);
    const panel = document.getElementById(PANEL_ID);
    if (panel) {
      if (!refreshUploadViewInPlace(panel)) renderShell();
    }
    addLog('success', '\u4e91\u7aef\u8d44\u6e90\u5df2\u66f4\u65b0', nextCache.dataVersion);
    return nextCache;
  }

  async function fetchCloudAsset(descriptor, responseType) {
    const path = String(descriptor && descriptor.path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
    if (!path) throw new Error('cloud asset path is missing');
    const value = await cloudAssetRequest('/assets/' + path, responseType);
    const bytes = responseType === 'arraybuffer'
      ? value.byteLength
      : new TextEncoder().encode(value).byteLength;
    if (Number(descriptor.bytes) && bytes !== Number(descriptor.bytes)) throw new Error('cloud asset size mismatch: ' + path);
    if (descriptor.sha256) {
      const digest = await sha256Asset(responseType === 'arraybuffer' ? value : new TextEncoder().encode(value));
      if (digest && digest !== String(descriptor.sha256).toLowerCase()) throw new Error('cloud asset checksum mismatch: ' + path);
    }
    return value;
  }

  async function sha256Asset(value) {
    if (!window.crypto || !window.crypto.subtle) return '';
    const buffer = value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    const digest = await window.crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function cloudAssetRequest(path, responseType) {
    return new Promise((resolve, reject) => {
      const bases = Array.from(new Set([CLOUD_BACKUP_API_BASE, CLOUD_ASSET_FALLBACK_API_BASE].filter(Boolean)));
      const suffix = (String(path || '').includes('?') ? '&' : '?')
        + 'plm-ui=' + encodeURIComponent(UI_ASSET_VERSION + '-' + SCRIPT_VERSION);
      const attempt = (index, previousError) => {
        if (index >= bases.length) {
          reject(previousError || new Error('cloud asset network unavailable'));
          return;
        }
        const url = bases[index] + path + suffix;
        const retry = (error) => attempt(index + 1, error);
        const finish = (status, text, buffer) => {
          if (status < 200 || status >= 300) {
            retry(new Error('cloud asset HTTP ' + status));
            return;
          }
          try {
            if (responseType === 'arraybuffer') resolve(buffer);
            else if (responseType === 'json') resolve(JSON.parse(text || '{}'));
            else resolve(text || '');
          } catch (error) {
            retry(error);
          }
        };
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            responseType: responseType === 'arraybuffer' ? 'arraybuffer' : 'text',
            timeout: 30000,
            onload: (response) => finish(
              response.status,
              responseType === 'arraybuffer' ? '' : String(response.responseText || response.response || ''),
              response.response
            ),
            onerror: () => retry(new Error('cloud asset network unavailable')),
            ontimeout: () => retry(new Error('cloud asset timeout')),
          });
          return;
        }
        fetch(url, { cache: 'no-store' }).then(async (response) => {
          const value = responseType === 'arraybuffer' ? await response.arrayBuffer() : await response.text();
          finish(response.status, responseType === 'arraybuffer' ? '' : value, responseType === 'arraybuffer' ? value : null);
        }).catch(retry);
      };
      attempt(0, null);
    });
  }

  async function ensureExcelTemplateLoaded() {
    if (TEMPLATE_XLSX_BASE64) return true;
    try {
      await refreshCloudAssets(true);
    } catch (error) {
      addLog('warn', '\u4e91\u7aef Excel \u6a21\u677f\u52a0\u8f7d\u5931\u8d25', formatErrorMessage(error));
    }
    return Boolean(TEMPLATE_XLSX_BASE64);
  }

  async function loadCloudExcelTemplateWorkbook(Excel) {
    if (!Excel || typeof Excel.Workbook !== 'function') throw new Error('ExcelJS 尚未加载');
    if (!await ensureExcelTemplateLoaded()) throw new Error('Excel 模板尚未缓存，请联网后重试');
    const load = async () => {
      const workbook = new Excel.Workbook();
      await workbook.xlsx.load(base64ToArrayBuffer(TEMPLATE_XLSX_BASE64));
      return workbook;
    };
    try {
      return await load();
    } catch (error) {
      addLog('warn', 'Excel 模板缓存损坏，正在重新下载', formatErrorMessage(error));
      TEMPLATE_XLSX_BASE64 = '';
      await refreshCloudAssets(true);
      if (!TEMPLATE_XLSX_BASE64) throw error;
      return load();
    }
  }
