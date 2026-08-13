
  const UI_STYLE_ID = 'pfh-ui-styles';
  // Full component and theme CSS is delivered by the versioned cloud UI asset. Keep only the offline skeleton locally.
  let uiFallbackNoticeTimer = 0;
  let uiAssetRetryTimer = 0;
  let uiAssetRetryCount = 0;
  let uiAssetRecoveryBound = false;
  const LOCAL_UI_FALLBACK_CSS = `
    #${PANEL_ID} {
      position:fixed;right:18px;bottom:78px;z-index:2147483647;width:686px;height:min(906px,96vh);min-width:520px;min-height:520px;
      overflow:visible;border:1px solid var(--pfh-theme-border,#D8DEEA);border-radius:16px;background:var(--pfh-theme-surface,#fff);box-shadow:0 22px 70px rgba(31,25,55,.20);
      color:var(--pfh-theme-text,#1F2937);font:13px/1.5 Arial,"Microsoft YaHei",sans-serif;
    }
    #${PANEL_ID},#${PANEL_ID} *{box-sizing:border-box}
    #${PANEL_ID}.is-collapsed{display:none!important}
    #${PANEL_ID} .pfh-full{position:relative;width:100%;height:100%;overflow:hidden;border-radius:inherit;background:#FAFAFC}
    html.pfh-ui-fallback #${PANEL_ID} .pfh-full>*{visibility:hidden!important;pointer-events:none!important}
    html.pfh-ui-waiting #${PANEL_ID} .pfh-full>*,
    html.pfh-ui-error #${PANEL_ID} .pfh-full>*,
    html.pfh-ui-offline #${PANEL_ID} .pfh-full>*{visibility:visible!important;pointer-events:auto!important}
    html.pfh-ui-waiting #${PANEL_ID} .pfh-full::before,
    html.pfh-ui-waiting #${PANEL_ID} .pfh-full::after,
    html.pfh-ui-error #${PANEL_ID} .pfh-full::before,
    html.pfh-ui-error #${PANEL_ID} .pfh-full::after,
    html.pfh-ui-offline #${PANEL_ID} .pfh-full::before,
    html.pfh-ui-offline #${PANEL_ID} .pfh-full::after{display:none!important}
    html.pfh-ui-fallback #${PANEL_ID} .pfh-full::before{
      content:"";position:absolute;inset:0;z-index:1;visibility:visible;border-radius:inherit;pointer-events:none;
      background:
        linear-gradient(#B9BDC6,#B9BDC6) 18px 17px/38px 38px no-repeat,
        linear-gradient(#E2E4EA,#E2E4EA) 68px 22px/118px 14px no-repeat,
        linear-gradient(#ECEEF3,#ECEEF3) 68px 42px/82px 9px no-repeat,
        linear-gradient(#F0EDF9,#F0EDF9) 212px 16px/calc(100% - 386px) 40px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 148px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 108px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 68px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 28px) 20px/20px 32px no-repeat,
        linear-gradient(#E5E8EF,#E5E8EF) 0 67px/100% 1px no-repeat,
        linear-gradient(#E9EBF1,#E9EBF1) 14px 86px/158px 38px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 134px/158px 66px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 210px/158px 66px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 286px/158px 66px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 14px 362px/158px 66px no-repeat,
        linear-gradient(#E5E8EF,#E5E8EF) 185px 68px/1px calc(100% - 68px) no-repeat,
        linear-gradient(#E9EBF1,#E9EBF1) 204px 88px/calc(100% - 224px) 88px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 204px 190px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(50% + 97px) 190px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 204px 320px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(50% + 97px) 320px/calc(50% - 117px) 118px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 204px 450px/calc(100% - 224px) 94px no-repeat,
        #FAFAFC;
    }
    html.pfh-ui-fallback #${PANEL_ID}[data-view="home"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="about"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="ledger"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="upload"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="tools"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="batchExcel"] .pfh-full::before,
    html.pfh-ui-fallback #${PANEL_ID}[data-view="feedback"] .pfh-full::before{
      background:
        linear-gradient(#B9BDC6,#B9BDC6) 18px 17px/38px 38px no-repeat,
        linear-gradient(#E2E4EA,#E2E4EA) 68px 22px/118px 14px no-repeat,
        linear-gradient(#ECEEF3,#ECEEF3) 68px 42px/82px 9px no-repeat,
        linear-gradient(#F0EDF9,#F0EDF9) 212px 16px/calc(100% - 386px) 40px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 148px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 108px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 68px) 20px/32px 32px no-repeat,
        linear-gradient(#E9E5F5,#E9E5F5) calc(100% - 28px) 20px/20px 32px no-repeat,
        linear-gradient(#E5E8EF,#E5E8EF) 0 67px/100% 1px no-repeat,
        linear-gradient(#E9EBF1,#E9EBF1) 20px 88px/calc(100% - 40px) 88px no-repeat,
        linear-gradient(#ECEEF3,#ECEEF3) 20px 190px/170px 58px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 20px 264px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(33.333% + 3px) 264px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(66.666% - 14px) 264px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) 20px 402px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(33.333% + 3px) 402px/calc(33.333% - 27px) 126px no-repeat,
        linear-gradient(#F0F1F5,#F0F1F5) calc(66.666% - 14px) 402px/calc(33.333% - 27px) 126px no-repeat,
        #FAFAFC;
    }
    html.pfh-ui-fallback #${PANEL_ID} .pfh-full::after{
      content:"";position:absolute;inset:0;z-index:2;visibility:visible;pointer-events:none;
      background:linear-gradient(105deg,transparent 32%,rgba(255,255,255,.82) 46%,transparent 60%) 130% 0/240% 100% no-repeat;
      animation:pfh-ui-skeleton-sweep 1.45s ease-in-out infinite;
    }
    html.pfh-ui-offline #${PANEL_ID} .pfh-full::after{animation-duration:2.4s;opacity:.48}
    html.pfh-ui-fallback #${PANEL_ID}::after{
      content:"正在加载界面资源…";position:absolute;left:50%;bottom:18px;z-index:5;display:block;min-width:210px;padding:8px 13px;
      border:1px solid #DDD5F4;border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(52,38,95,.10);
      color:#6D35E8;font-size:11px;font-weight:700;text-align:center;transform:translateX(-50%);visibility:visible;
    }
    html.pfh-ui-waiting #${PANEL_ID}::after{content:"网络较慢，正在继续加载完整界面…"}
    html.pfh-ui-error #${PANEL_ID}::after{content:"界面资源暂时不可用，正在等待恢复";border-color:var(--pfh-theme-border-strong,#D8DEEA);background:var(--pfh-theme-surface-alt,#F7F8FC);color:var(--pfh-theme-primary,#6D35E8)}
    html.pfh-ui-offline #${PANEL_ID}::after{content:"当前无网络，联网后会自动恢复完整界面";border-color:var(--pfh-theme-border-strong,#F2D4A6);background:var(--pfh-theme-surface-alt,#FFFAEB);color:var(--pfh-theme-primary,#B54708)}
    #${LAUNCHER_ID}{position:fixed;z-index:2147483647;display:inline-flex;width:86px;height:34px;align-items:center;justify-content:center;border:1px solid #D8DEEA;border-radius:10px;background:#fff;box-shadow:0 8px 24px rgba(35,25,70,.14);color:#403657;cursor:pointer;font:600 13px/1 "Microsoft YaHei",sans-serif}
    @keyframes pfh-ui-skeleton-sweep{from{background-position:130% 0}to{background-position:-130% 0}}
    @media(max-width:620px){
      html.pfh-ui-fallback #${PANEL_ID} .pfh-full::before{
        background:
          linear-gradient(#B9BDC6,#B9BDC6) 16px 16px/36px 36px no-repeat,
          linear-gradient(#E2E4EA,#E2E4EA) 64px 22px/104px 14px no-repeat,
          linear-gradient(#F0EDF9,#F0EDF9) 184px 16px/calc(100% - 264px) 38px no-repeat,
          linear-gradient(#E5E8EF,#E5E8EF) 0 66px/100% 1px no-repeat,
          linear-gradient(#E9EBF1,#E9EBF1) 14px 84px/calc(100% - 28px) 82px no-repeat,
          linear-gradient(#F0F1F5,#F0F1F5) 14px 180px/calc(100% - 28px) 112px no-repeat,
          linear-gradient(#F0F1F5,#F0F1F5) 14px 304px/calc(100% - 28px) 112px no-repeat,
          linear-gradient(#F0F1F5,#F0F1F5) 14px 428px/calc(100% - 28px) 112px no-repeat,
          #FAFAFC;
      }
    }
    @media(prefers-reduced-motion:reduce){html.pfh-ui-fallback #${PANEL_ID} .pfh-full::after{animation:none;opacity:.38}}
  `;


  const THEME_RESOURCE_STYLE_ID = 'pfh-theme-resource-styles';
  const THEME_RESOURCE_CSS = `
    #${PANEL_ID}[data-pfh-theme] .pfh-theme-option-lulu {
      min-height: 74px !important;
      border-color: #edc47e !important;
      background: linear-gradient(135deg, #fff8d9, #ffe8bd) !important;
    }
    #${PANEL_ID}[data-pfh-theme] .pfh-theme-option-lulu:hover {
      border-color: #dfa052 !important;
      background: linear-gradient(135deg, #fff1b9, #ffd9a5) !important;
    }
    #${PANEL_ID}[data-pfh-theme] .pfh-theme-option-lulu .pfh-theme-option-download {
      display: block;
      margin-top: auto;
      color: #bd6a20 !important;
      font-size: 10px;
      font-weight: 800;
      line-height: 1.2;
    }
    #${PANEL_ID}[data-pfh-theme] .pfh-theme-option-lulu.is-selected .pfh-theme-option-download {
      color: #a85b16 !important;
    }
  `;

  function setThemeResourceStyle() {
    let style = document.getElementById(THEME_RESOURCE_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = THEME_RESOURCE_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== THEME_RESOURCE_CSS) style.textContent = THEME_RESOURCE_CSS;
    style.dataset.version = SCRIPT_VERSION;
  }

  function getCloudUiStyleText() {
    return typeof getCachedCloudUiStyles === 'function' ? getCachedCloudUiStyles() : '';
  }

  function getStaleCloudUiStyleText() {
    const css = cloudAssetCache && cloudAssetCache.uiCss;
    return typeof css === 'string' && css.length > 10000 && css.includes('#' + PANEL_ID) ? css : '';
  }

  function updateUiFallbackState(state) {
    const root = document.documentElement;
    root.classList.toggle('pfh-ui-fallback', state !== 'ready');
    root.classList.toggle('pfh-ui-waiting', state === 'waiting');
    root.classList.toggle('pfh-ui-error', state === 'error');
    root.classList.toggle('pfh-ui-offline', state === 'offline');
  }

  function scheduleUiFallbackNotice() {
    window.clearTimeout(uiFallbackNoticeTimer);
    if (navigator && navigator.onLine === false) {
      updateUiFallbackState('offline');
      return;
    }
    uiFallbackNoticeTimer = window.setTimeout(() => {
      if (document.documentElement.classList.contains('pfh-ui-fallback')) updateUiFallbackState('waiting');
    }, 4500);
  }

  function showUiOfflineFallback() {
    if (!document.documentElement.classList.contains('pfh-ui-fallback')) return;
    window.clearTimeout(uiFallbackNoticeTimer);
    const offline = navigator && navigator.onLine === false;
    updateUiFallbackState(offline ? 'offline' : 'error');
    if (!offline) scheduleUiAssetRetry();
  }

  function scheduleUiAssetRetry() {
    window.clearTimeout(uiAssetRetryTimer);
    if (!document.documentElement.classList.contains('pfh-ui-fallback') || (navigator && navigator.onLine === false)) return;
    const delays = [3000, 8000, 20000, 60000];
    const delay = delays[Math.min(uiAssetRetryCount, delays.length - 1)];
    uiAssetRetryCount += 1;
    uiAssetRetryTimer = window.setTimeout(() => {
      if (!document.documentElement.classList.contains('pfh-ui-fallback')) return;
      updateUiFallbackState('loading');
      scheduleUiFallbackNotice();
      refreshCloudAssets(true).catch(showUiOfflineFallback);
    }, delay);
  }

  function bindUiAssetRecovery() {
    if (uiAssetRecoveryBound) return;
    uiAssetRecoveryBound = true;
    window.addEventListener('offline', showUiOfflineFallback);
    window.addEventListener('online', () => {
      if (!document.documentElement.classList.contains('pfh-ui-fallback')) return;
      window.clearTimeout(uiAssetRetryTimer);
      updateUiFallbackState('loading');
      scheduleUiFallbackNotice();
      refreshCloudAssets(true).catch(showUiOfflineFallback);
    });
  }

  function setUiStyleText(cssText, source) {
    const text = String(cssText || '');
    if (!text.trim()) return false;
    let style = document.getElementById(UI_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = UI_STYLE_ID;
      document.documentElement.appendChild(style);
    }
    if (style.textContent !== text) style.textContent = text;
    style.dataset.source = source || 'fallback';
    style.dataset.version = SCRIPT_VERSION;
    return true;
  }

  function normalizeThemeId(value) {
    const id = String(value || '').trim();
    return THEME_BY_ID[id] ? id : DEFAULT_THEME_ID;
  }

  function getActiveTheme() {
    const configuredId = typeof state !== 'undefined' && state.settings ? state.settings.theme : DEFAULT_THEME_ID;
    return THEME_BY_ID[normalizeThemeId(configuredId)] || THEME_BY_ID[DEFAULT_THEME_ID];
  }

  function applyThemeToView() {
    const theme = getActiveTheme();
    const variables = {
      '--pfh-theme-primary': theme.primary,
      '--pfh-theme-primary-hover': theme.primaryHover,
      '--pfh-theme-primary-soft': theme.primarySoft,
      '--pfh-theme-secondary': theme.secondary,
      '--pfh-theme-secondary-soft': theme.secondarySoft,
      '--pfh-theme-page': theme.page,
      '--pfh-theme-surface': theme.surface,
      '--pfh-theme-surface-alt': theme.surfaceAlt,
      '--pfh-theme-border': theme.border,
      '--pfh-theme-border-strong': theme.borderStrong,
      '--pfh-theme-text': theme.text,
      '--pfh-theme-muted': theme.muted,
      '--pfh-theme-header': theme.header,
    };
    [document.getElementById(PANEL_ID), document.getElementById(LAUNCHER_ID), document.getElementById(PANEL_ID + '-upload-progress'), document.getElementById(PANEL_ID + '-parameter-editor-overlay')].forEach((element) => {
      if (!element) return;
      element.dataset.pfhTheme = theme.id;
      Object.keys(variables).forEach((key) => element.style.setProperty(key, variables[key]));
    });
  }

  async function loadLuluThemeResource() {
    const pageWindow = typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window;
    const runtime = pageWindow.__PFH_LULU_THEME_RESOURCE__;
    if (runtime && runtime.version === LULU_THEME_RESOURCE_VERSION && typeof runtime.refresh === 'function') {
      runtime.refresh();
      addLog('success', '噜噜乐园皮肤已启用', LULU_THEME_RESOURCE_PATH);
      showToast('噜噜乐园已启用');
      return;
    }
    showToast('噜噜配色已启用，正在加载皮肤彩蛋…');
    try {
      const code = await cloudAssetRequest(LULU_THEME_RESOURCE_PATH, 'text');
      if (typeof code !== 'string' || code.length < 1000 || !code.includes('pfh-lulu-theme-resource-styles')) {
        throw new Error('噜噜资源代码内容不完整');
      }
      const script = typeof GM_addElement === 'function'
        ? GM_addElement(document.head || document.documentElement, 'script', { textContent: code })
        : (() => {
          const element = document.createElement('script');
          element.type = 'text/javascript';
          element.textContent = code;
          (document.head || document.documentElement).appendChild(element);
          return element;
        })();
      if (script && script.parentNode) script.remove();
      addLog('success', '噜噜乐园皮肤已加载', LULU_THEME_RESOURCE_PATH);
      showToast('噜噜乐园已启用，无需下载或安装');
    } catch (error) {
      addLog('warn', '噜噜乐园皮肤加载失败', error && error.message ? error.message : String(error));
      showToast('已切换噜噜配色，但皮肤彩蛋加载失败，请稍后重试');
    }
  }

  function applyCloudUiStyles(cssText) {
    const text = String(cssText || '');
    if (text.length < 10000 || !text.includes('#' + PANEL_ID)) return false;
    const legacy = document.getElementById('pfh-parameter-image-styles');
    if (legacy) legacy.remove();
    window.clearTimeout(uiFallbackNoticeTimer);
    window.clearTimeout(uiAssetRetryTimer);
    uiAssetRetryCount = 0;
    updateUiFallbackState('ready');
    return setUiStyleText(text, 'cloud-cache');
  }

  function injectStyle() {
    bindUiAssetRecovery();
    const cached = getCloudUiStyleText();
    if (!applyCloudUiStyles(cached)) {
      // Keep the last complete stylesheet usable while the newly versioned
      // stylesheet is downloaded in the background.
      const staleCached = getStaleCloudUiStyleText();
      if (applyCloudUiStyles(staleCached)) {
        applyThemeToView();
        setThemeResourceStyle();
        return;
      }
      setUiStyleText(LOCAL_UI_FALLBACK_CSS, 'local-placeholder');
      updateUiFallbackState(navigator && navigator.onLine === false ? 'offline' : 'loading');
      scheduleUiFallbackNotice();
    }
    applyThemeToView();
    setThemeResourceStyle();
  }
