  const EXCELJS_URL = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
  const LAZY_EXTERNAL_SCRIPT_DEFINITIONS = Object.freeze({
    exceljs: Object.freeze({
      url: EXCELJS_URL,
      global: 'ExcelJS',
      ready: (value) => Boolean(value && typeof value.Workbook === 'function'),
    }),
    jszip: Object.freeze({
      url: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
      global: 'JSZip',
      ready: (value) => typeof value === 'function',
    }),
    oss: Object.freeze({
      url: 'https://cdn.jsdelivr.net/npm/ali-oss@6.23.0/dist/aliyun-oss-sdk.min.js',
      global: 'OSS',
      ready: (value) => typeof value === 'function',
    }),
    pdfjs: Object.freeze({
      url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
      global: 'pdfjsLib',
      ready: (value) => Boolean(value && typeof value.getDocument === 'function'),
    }),
  });
  const lazyExternalScriptPromises = Object.create(null);

  function getLazyExternalGlobal(name) {
    try {
      if (typeof unsafeWindow !== 'undefined' && unsafeWindow && unsafeWindow[name]) return unsafeWindow[name];
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window && window[name]) return window[name];
    } catch (_) {}
    return null;
  }

  function getLazyExternalRuntime(key) {
    const definition = LAZY_EXTERNAL_SCRIPT_DEFINITIONS[key];
    if (!definition) return null;
    const value = getLazyExternalGlobal(definition.global);
    return definition.ready(value) ? value : null;
  }

  function ensureLazyExternalScript(key) {
    const definition = LAZY_EXTERNAL_SCRIPT_DEFINITIONS[key];
    if (!definition) return Promise.reject(new Error('未知的按需组件：' + key));
    const existing = getLazyExternalRuntime(key);
    if (existing) return Promise.resolve(existing);
    if (lazyExternalScriptPromises[key]) return lazyExternalScriptPromises[key];
    const promise = new Promise((resolve, reject) => {
      const parent = document.head || document.documentElement;
      if (!parent) {
        reject(new Error('按需组件加载时页面容器不可用：' + definition.global));
        return;
      }
      let script = null;
      try {
        script = typeof GM_addElement === 'function'
          ? GM_addElement(parent, 'script', { src: definition.url, async: true })
          : (() => {
            const element = document.createElement('script');
            element.src = definition.url;
            element.async = true;
            parent.appendChild(element);
            return element;
          })();
      } catch (error) {
        reject(error);
        return;
      }
      if (!script) {
        reject(new Error('按需组件脚本节点创建失败：' + definition.global));
        return;
      }
      const resolveRuntime = () => {
        const runtime = getLazyExternalRuntime(key);
        if (runtime) resolve(runtime);
        else {
          const error = Object.assign(new Error('按需组件加载完成但运行时不可用：' + definition.global), { scriptRuntimeFailure: true, componentKey: key });
          offerNetworkDiagnostics(definition.global + ' 组件没有正常运行', error);
          reject(error);
        }
      };
      script.addEventListener('load', resolveRuntime, { once: true });
      script.addEventListener('error', () => {
        offerNetworkDiagnostics(definition.global + ' 下载失败，当前功能无法继续');
        reject(new Error(definition.global + ' 加载失败，可点击“开始检测”检查通信情况。'));
      }, { once: true });
    }).catch((error) => {
      delete lazyExternalScriptPromises[key];
      throw error;
    });
    lazyExternalScriptPromises[key] = promise;
    return promise;
  }

  function getExcelJsRuntime() {
    return getLazyExternalRuntime('exceljs');
  }

  function ensureExcelJsLoaded() {
    const existing = getExcelJsRuntime();
    if (existing) return Promise.resolve(existing);
    return ensureLazyExternalScript('exceljs');
  }

  function focusGeneratedAssetSaveButton(action, expectedView) {
    window.setTimeout(() => {
      const panel = document.getElementById(PANEL_ID);
      if (!panel || (expectedView && panel.dataset.view !== expectedView)) return;
      const button = Array.from(panel.querySelectorAll('button[data-action]'))
        .find((element) => element.getAttribute('data-action') === action);
      if (!button || button.disabled) return;
      button.classList.remove('is-generated-save-focus');
      button.classList.add('is-generated-save-focus');
      button.addEventListener('blur', () => button.classList.remove('is-generated-save-focus'), { once: true });
      try { button.focus({ preventScroll: true }); } catch (_) { button.focus(); }
    }, 0);
  }

  const REVIEW_CONFIRM_WAIT_MS = 30000;
  const UPLOAD_PAGE_IDLE_TIMEOUT_MS = 12000;
  const UPLOAD_PAGE_IDLE_STABLE_MS = 1200;
  // Bump with the versioned cloud stylesheet so incompatible cached UI is never rendered.
  const UI_ASSET_VERSION = '2.5.330';
  const PRODUCT_EDITION = Object.freeze({ id: 'design', label: '测试版', code: 'TEST' });
  const INGREDIENT_NORMALIZER_VERSION = '3';
  const COPYWRITING_PARSER_VERSION = '14';
  const PLM_INGREDIENT_CACHE_VERSION = 2;
  const PLM_INGREDIENT_CHECK_WINDOW_MS = 6 * 60 * 60 * 1000;
  const COPYWRITING_CACHE_DEBOUNCE_MS = 120;
  const COPYWRITING_CHECK_WINDOW_MS = 30 * 60 * 1000;
  const SKU_LIST_PREFERENCE_VERSION = 1;
  // Code 128 patterns, represented as alternating bar/space module widths.
  const CODE128_PATTERNS = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];
  const apiProjectMaterialCache = Object.create(null);
  const apiCopywritingFileCache = Object.create(null);
  const apiProductSnapshotCache = Object.create(null);
  const apiProjectSnapshotCache = Object.create(null);
  const apiDomesticThirdTierPriceCache = Object.create(null);
  const apiIngredientFileCache = Object.create(null);
  const ASSIGNED_DESIGN_TASK_ENDPOINT = '/api/ChemicalNewDesignTask/GetList';
  const ASSIGNED_DESIGN_TASK_PAGE_SIZE = 20;
  const ASSIGNED_DESIGN_TASK_SORT_FIELD = 'design_assign_at';
  const ASSIGNED_DESIGN_TASK_SORT_ASC = false;
  const ASSIGNED_DESIGN_TASK_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
  const PLM_ARCHIVE_OSS_ORIGIN = 'https://oss-pro.plm.westmonth.cn';
  let reviewConfirmRequestedAt = 0;
  let insightSyncQueue = Promise.resolve();
  const MODELSCOPE_INSIGHT_MODEL = 'Qwen/Qwen3.5-397B-A17B';
