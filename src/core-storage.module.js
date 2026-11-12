
  function loadIndex() {
    try {
      if (typeof GM_getValue === 'function') {
        const value = GM_getValue(STORAGE_INDEX_KEY, []);
        return normalizeSkuIndexAcquisition(value);
      }
      const raw = localStorage.getItem(STORAGE_INDEX_KEY);
      const value = raw ? JSON.parse(raw) : [];
      return normalizeSkuIndexAcquisition(value);
    } catch (error) {
      return [];
    }
  }

  function saveIndex() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(STORAGE_INDEX_KEY, state.index);
      else localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(state.index));
    } catch (error) {
      console.warn('PLM floating helper index save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-index' });
    }
    const notifyFrontendCatalogChanged = typeof window !== 'undefined' && window.notifyFrontendV2CatalogChanged;
    if (typeof notifyFrontendCatalogChanged === 'function') {
      try {
        notifyFrontendCatalogChanged();
      } catch (error) {
        console.warn('PLM floating helper frontend catalog notification failed:', error);
      }
    }
  }

  function loadSettings() {
    const defaults = { pixelRoomEnabled: false, pixelRoomEndTime: '18:00', excelKeywordMode: 'english', excelDownloadMode: 'picker', backgroundNoticeSeen: false, collectionEnabled: true, insightAiModel: 'glm-4.7-flash', skuListMode: 'waterfall', skuListSort: 'assigned', skuListPreferenceVersion: SKU_LIST_PREFERENCE_VERSION, theme: DEFAULT_THEME_ID, themeSkinVersion: THEME_SKIN_VERSION, copywritingCollapsed: false, workMode: 'daily', homeFeatureGroups: normalizeHomeFeatureGroups(DEFAULT_HOME_FEATURE_GROUPS), productDevelopmentFeatureGroups: normalizeProductDevelopmentFeatureGroups(DEFAULT_PRODUCT_DEVELOPMENT_FEATURE_GROUPS) };
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(SETTINGS_KEY, null) : JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      const settings = { ...defaults, ...(saved || {}) };
      settings.workspaceLayout = settings.workspaceLayout === 'classic' || settings.workspaceLayout === 'workspace' ? settings.workspaceLayout : (WORKSPACE_PREVIEW ? 'workspace' : 'classic');
      // The removed collection switch must not leave existing installations paused.
      settings.collectionEnabled = true;
      const previousBackupStatus = settings.cloudBackupStatus;
      settings.cloudBackupStatus = redactCloudBackupOwnerMismatch(previousBackupStatus);
      const needsBackupConflictMigration = !settings.cloudBackupConflictKeyHash && settings.cloudBackupKey &&
        /backup owner mismatch|该备份密钥已绑定|该备份密钥不可用于当前账号/.test(String(previousBackupStatus || ''));
      if (needsBackupConflictMigration) settings.cloudBackupConflictKeyHash = diagnosticHash(String(settings.cloudBackupKey).trim());
      const needsThemeMigration = Number(saved && saved.themeSkinVersion || 0) < THEME_SKIN_VERSION;
      if (needsThemeMigration && (!saved || !saved.theme)) settings.theme = DEFAULT_THEME_ID;
      settings.themeSkinVersion = THEME_SKIN_VERSION;
      settings.theme = normalizeThemeId(settings.theme);
      settings.copywritingCollapsed = settings.copywritingCollapsed === true;
      settings.shortcutBindings = normalizeShortcutBindings(settings.shortcutBindings);
      settings.shortcutEnabled = settings.shortcutEnabled === true;
      settings.pixelRoomEnabled = settings.pixelRoomEnabled === true;
      settings.pixelRoomAnimation = settings.pixelRoomAnimation !== false;
      settings.pixelRoomEndTime = normalizePixelRoomTime(settings.pixelRoomEndTime);
      settings.pixelRoomLamp = typeof settings.pixelRoomLamp === 'boolean' ? settings.pixelRoomLamp : null;
      settings.pixelRoomCurtains = settings.pixelRoomCurtains === true;
      settings.pixelRoomCup = Math.max(0, Math.min(3, Math.trunc(Number(settings.pixelRoomCup)) || 0));
      settings.workMode = normalizeProductDevelopmentWorkMode(settings.workMode);
      settings.homeFeatureGroups = normalizeHomeFeatureGroups(settings.homeFeatureGroups);
      settings.productDevelopmentFeatureGroups = normalizeProductDevelopmentFeatureGroups(settings.productDevelopmentFeatureGroups);
      const needsSkuMigration = Number(saved && saved.skuListPreferenceVersion || 0) < SKU_LIST_PREFERENCE_VERSION;
      if (needsSkuMigration || needsThemeMigration || needsBackupConflictMigration || settings.cloudBackupStatus !== previousBackupStatus) {
        if (needsSkuMigration) {
          settings.skuListMode = 'waterfall';
          settings.skuListSort = 'assigned';
          settings.skuListPreferenceVersion = SKU_LIST_PREFERENCE_VERSION;
        }
        try {
          if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, settings);
          else localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
          console.warn('PLM floating helper list preference migration save failed:', error);
        }
      }
      return settings;
    } catch (error) {
      return defaults;
    }
  }

  function saveSettings(settings) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SETTINGS_KEY, settings);
      else localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('PLM floating helper settings save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-settings' });
    }
  }

  function loadTutorialSeen() {
    try {
      return Boolean(typeof GM_getValue === 'function' ? GM_getValue(TUTORIAL_SEEN_KEY, false) : JSON.parse(localStorage.getItem(TUTORIAL_SEEN_KEY) || 'false'));
    } catch (error) {
      return false;
    }
  }

  function saveTutorialSeen(value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(TUTORIAL_SEEN_KEY, Boolean(value));
      else localStorage.setItem(TUTORIAL_SEEN_KEY, JSON.stringify(Boolean(value)));
    } catch (error) {
      console.warn('PLM floating helper tutorial flag save failed:', error);
    }
  }

  function loadUploadQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(UPLOAD_QUEUE_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function loadExcelBatchQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(EXCEL_BATCH_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(EXCEL_BATCH_QUEUE_KEY) || 'null');
      const workerActive = (() => {
        try { return Boolean(state && state.batchExcelWorkerRunning); } catch (error) { return false; }
      })();
      return (Array.isArray(saved) ? saved : []).map(normalizeExcelBatchQueueEntry).filter(Boolean).map((entry) => !workerActive && entry.status === 'preparing' ? { ...entry, status: 'pending' } : entry).slice(0, 300);
    } catch (error) {
      return [];
    }
  }

  function saveExcelBatchQueue(queue) {
    const snapshot = (Array.isArray(queue) ? queue : []).map(normalizeExcelBatchQueueEntry).filter(Boolean).slice(0, 300);
    state.batchExcelQueue = snapshot;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(EXCEL_BATCH_QUEUE_KEY, snapshot);
      else localStorage.setItem(EXCEL_BATCH_QUEUE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('PLM floating helper Excel batch queue save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-excel-queue' });
    }
  }

  function loadManualSkuAddQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(MANUAL_SKU_ADD_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(MANUAL_SKU_ADD_QUEUE_KEY) || 'null');
      const seen = new Set();
      const workerActive = (() => {
        try { return Boolean(state && state.manualSkuAddWorkerRunning); } catch (error) { return false; }
      })();
      return (Array.isArray(saved) ? saved : [])
        .map((entry) => normalizeManualSkuAddQueueEntry(entry, !workerActive))
        .filter((entry) => entry && !seen.has(entry.sku) && seen.add(entry.sku))
        .slice(0, MANUAL_SKU_ADD_MAX_ITEMS);
    } catch (error) {
      return [];
    }
  }

  function saveManualSkuAddQueue(queue) {
    const seen = new Set();
    const snapshot = (Array.isArray(queue) ? queue : [])
      .map((entry) => normalizeManualSkuAddQueueEntry(entry, false))
      .filter((entry) => entry && !seen.has(entry.sku) && seen.add(entry.sku))
      .slice(0, MANUAL_SKU_ADD_MAX_ITEMS);
    state.manualSkuAddQueue = snapshot;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(MANUAL_SKU_ADD_QUEUE_KEY, snapshot);
      else localStorage.setItem(MANUAL_SKU_ADD_QUEUE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('PLM floating helper manual SKU queue save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-manual-sku-queue' });
    }
  }

  function normalizeManualSkuAddQueueEntry(entry, resetProcessing) {
    const sku = String(entry && entry.sku || '').trim().toUpperCase();
    if (!/^SKU\d+$/.test(sku)) return null;
    const validStatuses = new Set(['pending', 'processing', 'success', 'partial', 'skipped', 'error']);
    let status = validStatuses.has(String(entry && entry.status || '')) ? String(entry.status) : 'pending';
    if (resetProcessing && status === 'processing') status = 'pending';
    return {
      ...(entry || {}),
      sku,
      status,
      step: String(entry && entry.step || ''),
      error: String(entry && entry.error || ''),
      updatedAt: Number(entry && entry.updatedAt) || Date.now(),
    };
  }

  function normalizeExcelBatchQueueEntry(entry) {
    const sku = String(entry && entry.sku || '').trim().toUpperCase();
    if (!/^SKU\d{8}$/.test(sku)) return null;
    const validStatuses = new Set(['pending', 'preparing', 'ready', 'downloaded', 'error']);
    const status = validStatuses.has(String(entry && entry.status || '')) ? String(entry.status) : 'pending';
    return {
      ...(entry || {}),
      sku,
      status,
      missing: Array.isArray(entry && entry.missing) ? entry.missing.filter(Boolean).slice(0, 20) : [],
      packQty: normalizePackQty(entry && entry.packQty || ''),
      purchasePrice: String(entry && entry.purchasePrice || ''),
      error: String(entry && entry.error || ''),
      updatedAt: Number(entry && entry.updatedAt) || Date.now(),
    };
  }

  function normalizeToyCopywritingBatchEntry(entry, resetProcessing) {
    const sku = String(entry && entry.sku || '').trim().toUpperCase();
    if (!/^SKU\d+$/.test(sku)) return null;
    const validStatuses = new Set(['pending', 'processing', 'success', 'noop', 'error']);
    let status = validStatuses.has(String(entry && entry.status || '')) ? String(entry.status) : 'pending';
    if (resetProcessing && status === 'processing') status = 'pending';
    const validApplyStatuses = new Set(['applying', 'applied', 'downloaded', 'submitted', 'error']);
    let applyStatus = validApplyStatuses.has(String(entry && entry.applyStatus || '')) ? String(entry.applyStatus) : '';
    const validApplyModes = new Set(['apply', 'download', 'download-review']);
    const applyMode = validApplyModes.has(String(entry && entry.applyMode || '')) ? String(entry.applyMode) : '';
    if (resetProcessing && (applyStatus === 'applying' || applyStatus === 'applied')) applyStatus = 'error';
    return {
      ...(entry || {}),
      id: String(entry && entry.id || 'toy-copywriting-' + sku),
      sku,
      name: String(entry && entry.name || ''),
      status,
      step: String(entry && entry.step || ''),
      error: String(entry && entry.error || ''),
      filledCount: Math.max(0, Number(entry && entry.filledCount) || 0),
      generatedImages: Math.max(0, Number(entry && entry.generatedImages) || 0),
      projectStatus: String(entry && entry.projectStatus || ''),
      projectRowId: String(entry && entry.projectRowId || ''),
      applyStatus,
      applyMode,
      applyError: String(entry && entry.applyError || ''),
      createdAt: Number(entry && entry.createdAt) || Date.now(),
      updatedAt: Number(entry && entry.updatedAt) || Date.now(),
    };
  }

  function loadToyCopywritingBatchQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(TOY_COPYWRITING_BATCH_KEY, null) : JSON.parse(localStorage.getItem(TOY_COPYWRITING_BATCH_KEY) || 'null');
      return (Array.isArray(saved) ? saved : []).map((entry) => normalizeToyCopywritingBatchEntry(entry, true)).filter(Boolean).slice(0, 300);
    } catch (error) {
      return [];
    }
  }

  function saveToyCopywritingBatchQueue(queue) {
    const snapshot = (Array.isArray(queue) ? queue : []).map((entry) => normalizeToyCopywritingBatchEntry(entry, false)).filter(Boolean).slice(0, 300);
    state.toyCopywritingBatchQueue = snapshot;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(TOY_COPYWRITING_BATCH_KEY, snapshot);
      else localStorage.setItem(TOY_COPYWRITING_BATCH_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('PLM floating helper toy copywriting batch queue save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-copywriting-queue' });
    }
  }

  function saveUploadQueue() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_QUEUE_KEY, state.uploadQueue);
      else localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(state.uploadQueue));
    } catch (error) {
      console.warn('PLM floating helper upload queue save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-upload-queue' });
    }
  }

  function loadUploadHistory() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(UPLOAD_HISTORY_KEY, null) : JSON.parse(localStorage.getItem(UPLOAD_HISTORY_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveUploadHistory() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(UPLOAD_HISTORY_KEY, state.uploadHistory);
      else localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(state.uploadHistory));
    } catch (error) {
      console.warn('PLM floating helper upload history save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-upload-history' });
    }
  }

  function saveUploadQueueAndHistory(queue, history) {
    const queueSnapshot = Array.isArray(queue) ? queue : [];
    const historySnapshot = Array.isArray(history) ? history : [];
    state.uploadQueue = queueSnapshot;
    state.uploadHistory = historySnapshot;
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue(UPLOAD_HISTORY_KEY, historySnapshot);
        GM_setValue(UPLOAD_QUEUE_KEY, queueSnapshot);
      } else {
        localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(historySnapshot));
        localStorage.setItem(UPLOAD_QUEUE_KEY, JSON.stringify(queueSnapshot));
      }
    } catch (error) {
      console.warn('PLM floating helper upload state save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-upload-state' });
    }
    state.uploadQueue = queueSnapshot;
    state.uploadHistory = historySnapshot;
  }

  function moveCompletedUploadsToHistory(mode) {
    const targetMode = mode ? normalizeUploadMode(mode) : '';
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const queueSource = latestQueue.length ? latestQueue : (state.uploadQueue || []);
    const completed = queueSource.filter((item) => {
      if (targetMode && getUploadItemMode(item) !== targetMode) return false;
      const status = String(item && item.status || '');
      if (/\u8fdb\u884c\u4e2d/.test(status)) return false;
      if (item && item.kind === 'toy-effect' && /\u5931\u8d25/.test(status)) return false;
      return /\u6210\u529f|\u5931\u8d25|\u8df3\u8fc7|\u5df2\u6709\u5185\u5bb9/.test(status);
    });
    if (!completed.length) return;
    const additionsByProduct = new Map();
    completed.forEach((item) => {
      const uploadSucceeded = /\u6210\u529f/.test(item.status || '');
      const successStatus = item.kind === 'toy-label' ? (item.manualPackageOnly ? '\u6807\u7b7e\u96c6\u5408\u5305\u751f\u6210\u6210\u529f' : '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f') : (item.kind === 'toy-effect' ? '\u6548\u679c\u56fe\u4e0a\u4f20\u6210\u529f' : (item.kind === 'copyright' ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : L.uploadSuccess));
      const archived = {
        ...item,
        status: uploadSucceeded ? successStatus : (item.status || L.uploadFailed),
        step: uploadSucceeded ? successStatus : (item.step || item.status || L.uploadFailed),
        completedAt: item.completedAt || item.updatedAt || new Date().toLocaleString(),
        xlsxKey: '',
        zipKey: '',
        copyrightFiles: getCopyrightUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
        effectFiles: getToyEffectUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      };
      additionsByProduct.set(uploadHistoryProductKey(archived), archived);
    });
    const additions = Array.from(additionsByProduct.values());
    const completedProductKeys = new Set(additions.map(uploadHistoryProductKey));
    const archivedKeys = new Set(completed.map(uploadHistoryKey));
    state.uploadQueue = queueSource.filter((item) => !archivedKeys.has(uploadHistoryKey(item)));
    state.uploadHistory = additions.concat(latestHistory.filter((item) => !completedProductKeys.has(uploadHistoryProductKey(item)))).slice(0, 200);
    completed.forEach(cleanupUploadFiles);
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
  }

  function archiveUploadItem(item) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const successText = latestItem.kind === 'toy-label' ? (latestItem.manualPackageOnly ? '\u6807\u7b7e\u96c6\u5408\u5305\u751f\u6210\u6210\u529f' : '\u6807\u7b7e\u4e0a\u4f20\u6210\u529f') : (latestItem.kind === 'toy-effect' ? '\u6548\u679c\u56fe\u4e0a\u4f20\u6210\u529f' : (latestItem.kind === 'copyright' ? '\u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f' : L.uploadSuccess));
    const archived = { ...latestItem, status: successText, step: successText, completedAt, updatedAt: completedAt, xlsxKey: '', zipKey: '', copyrightFiles: getCopyrightUploadEntries(latestItem).map((entry) => ({ ...entry, key: '' })), effectFiles: getToyEffectUploadEntries(latestItem).map((entry) => ({ ...entry, key: '' })) };
    const archivedProductKey = uploadHistoryProductKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryProductKey(entry) !== archivedProductKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryProductKey(entry) !== archivedProductKey)).slice(0, 200);
    cleanupUploadFiles(latestItem);
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    if ((archived.kind || 'standard') === 'standard') syncInsightEvent('image_pack_upload_success', { sku: archived.sku || '', name: archived.name || '', source: 'upload-queue' });
    if (archived.kind === 'toy-label' && !archived.manualPackageOnly && /\u6210\u529f/.test(archived.status || '')) syncInsightEvent('toy_label_upload_success', { sku: archived.sku || '', name: archived.name || '', source: 'upload-queue' });
    if (archived.sku) {
      if ((archived.kind || 'standard') === 'standard') {
        updateDailyLedgerForSku(archived.sku, { status: '已完成', stage: '完成', note: '上传成功', imagePackState: 'done', imagePackDone: true }, getTodayKey());
      } else if (archived.kind === 'toy-label' && /\u6210\u529f/.test(archived.status || '')) {
        updateDailyLedgerForSku(archived.sku, { labelFileState: 'done', labelFileDone: true }, getTodayKey());
      }
    }
    renderShell();
  }

  function archiveUploadFailure(item, status, reason, options) {
    const completedAt = new Date().toLocaleString();
    const latestQueue = loadUploadQueue();
    const latestHistory = loadUploadHistory();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const keepFiles = Boolean(options && options.keepFiles);
    const archived = {
      ...latestItem,
      status: status || L.uploadFailed,
      step: reason || latestItem.step || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      completedAt,
      updatedAt: completedAt,
      xlsxKey: keepFiles ? (latestItem.xlsxKey || '') : '',
      zipKey: keepFiles ? (latestItem.zipKey || '') : '',
      copyrightFiles: getCopyrightUploadEntries(latestItem).map((entry) => ({ ...entry, key: keepFiles ? (entry.key || '') : '' })),
      effectFiles: getToyEffectUploadEntries(latestItem).map((entry) => ({ ...entry, key: keepFiles ? (entry.key || '') : '' })),
    };
    const archivedKey = uploadHistoryKey(archived);
    state.uploadQueue = latestQueue.filter((entry) => entry.id !== item.id && uploadHistoryKey(entry) !== archivedKey);
    state.uploadHistory = [archived].concat(latestHistory.filter((entry) => uploadHistoryKey(entry) !== archivedKey)).slice(0, 200);
    if (!keepFiles) cleanupUploadFiles(latestItem);
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    renderShell();
  }

  function markUploadQueueBlocked(item, status, reason, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const updatedAt = new Date().toLocaleString();
    const blocked = {
      ...latestItem,
      ...(extra || {}),
      status: status || L.uploadFailed,
      step: reason || latestItem.step || status || L.uploadFailed,
      skipReason: reason || latestItem.skipReason || '',
      forceReplace: false,
      updatedAt,
    };
    Object.assign(item, blocked);
    state.uploadQueue = latestQueue.some((entry) => entry.id === item.id)
      ? latestQueue.map((entry) => entry.id === item.id ? blocked : entry)
      : [blocked].concat(latestQueue);
    saveUploadQueue();
    renderShell();
  }

  function uploadHistoryKey(item) {
    const copyrightNames = getCopyrightUploadEntries(item).map((entry) => entry.name).join(',');
    const effectNames = getToyEffectUploadEntries(item).map((entry) => entry.name).join(',');
    return [item && item.sku, item && item.xlsxName, item && item.zipName, copyrightNames, effectNames].filter(Boolean).join('|') || (item && item.id) || '';
  }

  function uploadHistoryProductKey(item) {
    return [(item && item.kind) || 'standard', item && item.sku].filter(Boolean).join('|') || (item && item.id) || '';
  }

  function findPreviousSuccessfulUpload(item, successfulHistory) {
    const history = Array.isArray(successfulHistory) ? successfulHistory : [];
    const key = uploadHistoryKey(item);
    const kind = item && item.kind || 'standard';
    return history.find((entry) => uploadHistoryKey(entry) === key && (entry.kind || 'standard') === kind)
      || history.find((entry) => entry.sku === item.sku && (entry.kind || 'standard') === kind)
      || null;
  }

  function isUploadHistorySuccess(item) {
    return /\u6210\u529f/.test(String(item && item.status || ''));
  }

  function normalizeUploadMode(value) {
    return UPLOAD_MODES.includes(value) ? value : 'standard';
  }

  function getUploadItemMode(item) {
    return normalizeUploadMode(item && item.kind);
  }

  function isUploadWorkerPage() {
    return /[?&]plmUploadWorker=1\b/.test(location.search);
  }

  function getUploadWorkerModeFromUrl() {
    try {
      return normalizeUploadMode(new URLSearchParams(location.search).get('plmUploadMode'));
    } catch (error) {
      return 'standard';
    }
  }

  function getUploadControlMode() {
    return isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : normalizeUploadMode(state.uploadMode);
  }

  function loadUploadWorkerStates() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(UPLOAD_WORKER_STATES_KEY, null)
        : JSON.parse(localStorage.getItem(UPLOAD_WORKER_STATES_KEY) || 'null');
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      const legacy = typeof GM_getValue === 'function'
        ? GM_getValue(UPLOAD_WORKER_KEY, false)
        : JSON.parse(localStorage.getItem(UPLOAD_WORKER_KEY) || 'false');
      return {
        standard: Boolean(parsed && parsed.standard !== undefined ? parsed.standard : legacy),
        'toy-label': Boolean(parsed && parsed['toy-label']),
        'toy-effect': Boolean(parsed && parsed['toy-effect']),
        copyright: Boolean(parsed && parsed.copyright),
      };
    } catch (error) {
      return { standard: false, 'toy-label': false, 'toy-effect': false, copyright: false };
    }
  }

  function loadUploadWorkerRunning(mode) {
    const targetMode = normalizeUploadMode(mode || (isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : 'standard'));
    return Boolean(loadUploadWorkerStates()[targetMode]);
  }

  function saveUploadWorkerRunning(mode, value) {
    let targetMode = mode;
    let targetValue = value;
    if (typeof value === 'undefined') {
      targetValue = mode;
      targetMode = isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : 'standard';
    }
    targetMode = normalizeUploadMode(targetMode);
    try {
      const states = loadUploadWorkerStates();
      states[targetMode] = Boolean(targetValue);
      const anyRunning = UPLOAD_MODES.some((item) => Boolean(states[item]));
      if (typeof GM_setValue === 'function') {
        GM_setValue(UPLOAD_WORKER_STATES_KEY, states);
        GM_setValue(UPLOAD_WORKER_KEY, anyRunning);
      } else {
        localStorage.setItem(UPLOAD_WORKER_STATES_KEY, JSON.stringify(states));
        localStorage.setItem(UPLOAD_WORKER_KEY, JSON.stringify(anyRunning));
      }
    } catch (error) {
      console.warn('PLM floating helper upload worker save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-upload-worker' });
    }
  }

  function hasUploadRefreshRecovery(mode) {
    const targetMode = mode ? normalizeUploadMode(mode) : '';
    return loadUploadQueue().some((item) => {
      if (targetMode && getUploadItemMode(item) !== targetMode) return false;
      if (!item || !item.xlsxKey || !item.zipKey) return false;
      if (item.resumeUploadAfterRefresh) return true;
      return Number(item.uploadPageRefreshRetryCount) > 0
        && /\u5f85\u4e0a\u4f20/.test(item.status || '')
        && /\u5237\u65b0\u540e\u91cd\u65b0\u641c\u7d22\u4e0a\u4f20/.test(item.step || '');
    });
  }

  function shouldStartUploadWorkerOnLoad() {
    const mode = isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : '';
    return loadUploadWorkerRunning(mode) && (isUploadWorkerPage() || hasUploadRefreshRecovery(mode));
  }

  function loadToyLabelExportManifest() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(TOY_LABEL_EXPORT_MANIFEST_KEY, null)
        : JSON.parse(localStorage.getItem(TOY_LABEL_EXPORT_MANIFEST_KEY) || 'null');
      return saved && typeof saved === 'object'
        ? { signature: String(saved.signature || ''), files: Array.isArray(saved.files) ? saved.files : [], downloaded: Boolean(saved.downloaded) }
        : { signature: '', files: [], downloaded: false };
    } catch (error) {
      return { signature: '', files: [], downloaded: false };
    }
  }

  function saveToyLabelExportManifest(manifest) {
    const value = {
      signature: String(manifest && manifest.signature || ''),
      files: Array.isArray(manifest && manifest.files) ? manifest.files : [],
      downloaded: Boolean(manifest && manifest.downloaded),
    };
    if (typeof GM_setValue === 'function') GM_setValue(TOY_LABEL_EXPORT_MANIFEST_KEY, value);
    else localStorage.setItem(TOY_LABEL_EXPORT_MANIFEST_KEY, JSON.stringify(value));
  }

  async function clearToyLabelExportManifest(manifest) {
    const current = manifest || loadToyLabelExportManifest();
    await Promise.all((current.files || []).map((entry) => deleteUploadFile(entry.key).catch((error) => {
      console.warn('PLM floating helper toy label staged file cleanup failed:', error);
    })));
    saveToyLabelExportManifest({ signature: '', files: [], downloaded: false });
  }

  async function ensureToyLabelExportRun(signature) {
    const current = loadToyLabelExportManifest();
    const requestedSignature = String(signature || '');
    const previousSkus = new Set(current.signature.split('|').filter(Boolean));
    const requestedSkus = requestedSignature.split('|').filter(Boolean);
    if (current.signature === requestedSignature || (current.files.length && requestedSkus.length && requestedSkus.every((sku) => previousSkus.has(sku)))) return current;
    await clearToyLabelExportManifest(current);
    const next = { signature: requestedSignature, files: [], downloaded: false };
    saveToyLabelExportManifest(next);
    state.toyLabelBatchFiles = [];
    return next;
  }

  async function stageToyLabelBatchFiles(files, signature) {
    const manifest = await ensureToyLabelExportRun(signature);
    for (const file of files || []) {
      if (!file || !file.blob || !file.filename) continue;
      const key = 'toy-label-export:' + Date.now() + ':' + Math.random().toString(36).slice(2);
      await putUploadFile(key, file.blob);
      manifest.files.push({ key, sku: String(file.sku || ''), filename: String(file.filename) });
    }
    manifest.downloaded = false;
    saveToyLabelExportManifest(manifest);
  }

  function openUploadDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(UPLOAD_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(UPLOAD_DB_STORE)) db.createObjectStore(UPLOAD_DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putUploadFile(key, file) {
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readwrite');
      tx.objectStore(UPLOAD_DB_STORE).put(file, key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function getUploadFile(key) {
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readonly');
      const request = tx.objectStore(UPLOAD_DB_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function cleanupUploadFiles(item) {
    if (!item) return;
    [item.xlsxKey, item.zipKey]
      .concat(getCopyrightUploadEntries(item).map((entry) => entry.key))
      .concat(getToyEffectUploadEntries(item).map((entry) => entry.key))
      .filter(Boolean).forEach((key) => {
      deleteUploadFile(key).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
    });
  }

  async function deleteUploadFile(key) {
    if (!key) return;
    const db = await openUploadDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(UPLOAD_DB_STORE, 'readwrite');
      tx.objectStore(UPLOAD_DB_STORE).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  function getSkuListMode() {
    if (isWorkspaceSkuView()) return 'list';
    return state.settings && state.settings.skuListMode === 'waterfall' ? 'waterfall' : 'list';
  }

  function isSkuInCatalog(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    return Boolean(normalizedSku && state.index.some((item) => item && String(item.sku || '').trim().toUpperCase() === normalizedSku));
  }

  function getSkuListSort() {
    return state.settings && state.settings.skuListSort === 'acquired' ? 'acquired' : 'assigned';
  }

  function parseSkuListTime(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value > 0 && value < 100000000000 ? value * 1000 : value;
    const text = String(value || '').trim();
    if (!text) return 0;
    if (/^\d+(?:\.\d+)?$/.test(text)) {
      const number = Number(text);
      return number > 0 && number < 100000000000 ? number * 1000 : number;
    }
    const parts = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?(?:\s+|T)(\d{1,2})[:：](\d{1,2})(?:[:：](\d{1,2}))?/);
    if (parts) {
      const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6] || 0), 0);
      const timestamp = date.getTime();
      if (Number.isFinite(timestamp)
        && date.getFullYear() === Number(parts[1])
        && date.getMonth() === Number(parts[2]) - 1
        && date.getDate() === Number(parts[3])) return timestamp;
    }
    const parsed = Date.parse(text.replace(/[年\/]/g, '-').replace(/月/g, '-').replace(/日/g, ' '));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getSkuAcquiredTime(record) {
    const source = record || {};
    return [source.acquiredAtMs, source.acquiredAt].map(parseSkuListTime).find((value) => value > 0) || 0;
  }

  function preserveSkuAcquiredTime(data, previous, fallbackMs) {
    if (!data || typeof data !== 'object') return data;
    const old = previous || {};
    const legacyTime = (record) => [record.firstSeenAtMs, record.firstSeenAt, record.manualSkuAddedAtMs, record.manualSkuAddedAt,
      record.listPrefetchedAtMs, record.listPrefetchedAt, record.fetchedAtMs, record.fetchedAt, record.createdAt, record.updatedAtMs, record.updatedAt]
      .map(parseSkuListTime).find((value) => value > 0) || 0;
    const acquired = getSkuAcquiredTime(old) || getSkuAcquiredTime(data) || legacyTime(old) || fallbackMs || legacyTime(data) || Date.now();
    data.acquiredAtMs = acquired;
    data.acquiredAt = old.acquiredAt || data.acquiredAt || new Date(acquired).toLocaleString();
    return data;
  }

  function normalizeSkuIndexAcquisition(value) {
    if (!Array.isArray(value)) return [];
    const fallbackMs = Date.now();
    let changed = false;
    const items = value.map((item, index) => {
      if (!item || !item.sku) return item;
      const next = preserveSkuAcquiredTime({ ...item }, item, fallbackMs - index);
      if (next.acquiredAtMs !== item.acquiredAtMs || next.acquiredAt !== item.acquiredAt) changed = true;
      return next;
    });
    if (changed) {
      try {
        if (typeof GM_setValue === 'function') GM_setValue(STORAGE_INDEX_KEY, items);
        else localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(items));
      } catch (error) {
        console.warn('PLM acquisition-time migration save failed:', error);
      }
    }
    return items;
  }

  function sortSkuListItems(items) {
    const sort = getSkuListSort();
    // The index is deliberately a lightweight projection of each cached SKU and
    // already contains every field needed for list sorting. Reading every full
    // record here makes a single render perform hundreds of synchronous
    // GM_getValue/localStorage calls and blocks the first visual response.
    const catalog = new Map((state.index || []).filter(Boolean).map((item, index) => [item.sku, { item, index }]));
    const records = (items || []).map((item, index) => ({ item, index, record: item || {}, cached: catalog.get(item && item.sku) }));
    const time = (record, cached) => {
      const assigned = parseSkuListTime(record.designAssignedAt);
      const acquired = getSkuAcquiredTime(cached && cached.item) || getSkuAcquiredTime(record);
      // Manually added SKUs do not have a design-assignment timestamp, so
      // fall back to their local acquisition time in the assignment view.
      return sort === 'acquired' ? acquired : (assigned || acquired);
    };
    return records.map((entry) => ({ ...entry, time: time(entry.record, entry.cached) })).sort((a, b) => {
      if (a.item.pinned && b.item.pinned) return (a.item.pinOrder || 0) - (b.item.pinOrder || 0);
      if (a.item.pinned) return -1;
      if (b.item.pinned) return 1;
      if (a.time !== b.time) return b.time - a.time;
      if (a.cached && b.cached) return a.cached.index - b.cached.index;
      if (a.cached) return -1;
      if (b.cached) return 1;
      return String(a.item.sku || '').localeCompare(String(b.item.sku || '')) || a.index - b.index;
    }).map((entry) => entry.item);
  }

  function getSkuListImageUrl(data) {
    if (!data) return '';
    const candidates = [
      getProductThumbUrl(data),
      data.skuImageUrl,
      data.skuImageFallbackUrl,
      data.productListImageUrl,
      data.productListImageFallbackUrl,
      data.toyLabelProductImageUrl,
      data.toyLabelProductImageFallbackUrl,
      data.benchmarkImageUrl,
      data.benchmarkImageFallbackUrl,
    ];
    return candidates.map((value) => String(value || '').trim()).find((value) => value && !/^data:image\//i.test(value)) || '';
  }

  function getSortedIndex() {
    return [...state.index].sort((a, b) => {
      if (a.pinned && b.pinned) return (a.pinOrder || 0) - (b.pinOrder || 0);
      if (a.pinned) return -1;
      if (b.pinned) return 1;
      return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
    });
  }

  function upsertIndex(data) {
    if (!data || !data.sku) return;
    const oldIndex = state.index.findIndex((entry) => entry.sku === data.sku);
    const old = oldIndex >= 0 ? state.index[oldIndex] : null;
    preserveSkuAcquiredTime(data, old, Date.now());
    const item = {
      sku: data.sku,
      brand: cleanName(data.brand || ''),
      name: cleanName(data.name || ''),
      packageCode: data.packageCode || '',
      printCode: data.printCode || '',
      developerName: cleanName(data.developerName || ''),
      projectStatus: cleanName(data.projectStatus || ''),
      designType: cleanName(data.designType || ''),
      designAssignedAt: data.designAssignedAt || '',
      projectCreatedAt: data.projectCreatedAt || '',
      skuImageUrl: data.skuImageUrl || '',
      skuImageFallbackUrl: data.skuImageFallbackUrl || '',
      skuImageSource: data.skuImageSource || '',
      productListImageUrl: data.productListImageUrl || '',
      productListImageFallbackUrl: data.productListImageFallbackUrl || '',
      toyLabelProductImageUrl: data.toyLabelProductImageUrl || '',
      toyLabelProductImageFallbackUrl: data.toyLabelProductImageFallbackUrl || '',
      benchmarkImageUrl: data.benchmarkImageUrl || '',
      benchmarkImageFallbackUrl: data.benchmarkImageFallbackUrl || '',
      acquiredAt: data.acquiredAt || '',
      acquiredAtMs: data.acquiredAtMs || 0,
      skuListSource: data.skuListSource || '',
      updatedAt: data.updatedAt || new Date().toLocaleString(),
      updatedAtMs: data.updatedAtMs || Date.now(),
    };
    if (old && old.pinned) {
      item.pinned = true;
      item.pinOrder = old.pinOrder || Date.now();
    }
    if (oldIndex >= 0) state.index[oldIndex] = item;
    else state.index.unshift(item);
    skuSearchFacetCache.set(item.sku, { developer: item.developerName, brand: item.brand, status: item.projectStatus, designType: item.designType });
    saveIndex();
    if (!old || getSkuListImageUrl(old) !== getSkuListImageUrl(item)) scheduleSkuImageColorIndex();
  }

  function togglePin(sku) {
    const item = state.index.find((entry) => entry.sku === sku);
    if (!item) return;
    if (item.pinned) {
      delete item.pinned;
      delete item.pinOrder;
    } else {
      item.pinned = true;
      item.pinOrder = Date.now();
    }
    saveIndex();
  }

  function deleteSkuFromList(sku) {
    if (!sku || !state.index.some((entry) => entry.sku === sku)) return;
    if (state.drawerTabFlowSku === sku) {
      stopScan();
      cancelDrawerTabFlow();
    }
    state.skuResultGeneration[sku] = Number(state.skuResultGeneration[sku] || 0) + 1;
    try {
      if (typeof GM_deleteValue === 'function') GM_deleteValue(STORAGE_PREFIX + sku);
      else if (typeof GM_setValue === 'function') GM_setValue(STORAGE_PREFIX + sku, null);
      else localStorage.removeItem(STORAGE_PREFIX + sku);
    } catch (error) {
      console.warn('PLM floating helper SKU delete failed:', error);
      addLog('error', '删除产品缓存失败', error);
      showToast('删除产品失败：' + formatErrorMessage(error), { diagnostic: false });
      return;
    }
    state.index = state.index.filter((entry) => entry.sku !== sku);
    saveIndex();
    state.ingredientHydratingSkus.delete(sku);
    state.copywritingHydratingSkus.delete(sku);
    delete state.ingredientHydrateFailedAt[sku];
    delete state.copywritingHydrateFailedAt[sku];
    delete state.sizeImageSessions[sku];
    if (state.selectedSku === sku || (state.data && state.data.sku === sku)) {
      const next = sortSkuListItems(state.index)[0] || null;
      state.selectedSku = next ? next.sku : '';
      state.data = next ? normalizeData(loadData(next.sku) || next) : null;
      state.skuPage = 1;
    }
    queueCloudBackup();
    addLog('info', '已删除 SKU 缓存', sku);
    showToast('已删除 ' + sku);
  }
