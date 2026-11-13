
  function compactMagicPackageOverview(root) {
    if (!root || typeof root.querySelector !== 'function') return;
    const tabs = root.querySelector('.pfh-magic-mode-tabs');
    if (!tabs || String(tabs.dataset.activeMode || '') !== 'package') return;
    const overview = root.querySelector('.pfh-magic-overview');
    if (!overview) return;
    const queue = Array.isArray(state.magicUploadQueue) ? state.magicUploadQueue : [];
    const totalFiles = queue.reduce((sum, task) => sum + getMagicUploadTaskFileCount(task), 0);
    const doneFiles = queue.reduce((sum, task) => sum + getMagicUploadTaskDoneFileCount(task), 0);
    const doneTasks = queue.filter((task) => task && task.status === 'success').length;
    const etaSeconds = getMagicUploadQueueEtaSeconds();
    const baselineSeconds = getMagicUploadBaselineTaskSeconds(queue, totalFiles);
    let queueDoneUnits = 0;
    let queueTotalUnits = 0;
    queue.forEach((task) => {
      const totals = getMagicUploadTaskByteTotals(task);
      if (totals.totalBytes > 0) {
        queueTotalUnits += totals.totalBytes;
        queueDoneUnits += Math.min(totals.totalBytes, totals.uploadedBytes + totals.currentBytes);
      } else {
        const taskFiles = getMagicUploadTaskFileCount(task);
        queueTotalUnits += taskFiles;
        queueDoneUnits += Math.min(taskFiles, getMagicUploadTaskDoneFileCount(task));
      }
    });
    const queuePercent = queueTotalUnits > 0 ? Math.min(100, Math.max(0, queueDoneUnits / queueTotalUnits * 100)) : 0;
    const etaLabel = etaSeconds > 0 ? formatMagicUploadDuration(etaSeconds) : (state.magicUploadRunning && queue.length ? '正在估算' : '—');
    const baselineLabel = baselineSeconds > 0 ? '基准：' + baselineSeconds + ' 秒/任务' : '基准：按历史估算';
    overview.classList.add('pfh-magic-overview-compact');
    overview.setAttribute('aria-label', '上传进度概览');
    overview.innerHTML = '<div class="pfh-magic-overview-head"><div class="pfh-magic-eta-copy"><span>预计剩余</span><strong data-magic-overall-eta>' + escapeHtml(etaLabel) + '</strong></div><span class="pfh-magic-task-baseline" data-magic-task-baseline>' + escapeHtml(baselineLabel) + '</span></div><div class="pfh-magic-queue-progress"><div class="pfh-magic-queue-progress-track"><div class="pfh-magic-queue-progress-bar" data-magic-queue-progress-bar style="width:' + queuePercent.toFixed(2) + '%"></div></div></div><div class="pfh-magic-overview-metrics"><span>队列 <b data-magic-queue-count>' + queue.length + '</b> 任务</span><span>完成 <b data-magic-done-tasks>' + doneTasks + '/' + queue.length + '</b></span><span>文件 <b data-magic-queue-progress-text>' + doneFiles + '/' + totalFiles + '</b></span></div>';
  }

  function mountMagicUploadLayout(root) {
    if (!root || typeof root.querySelector !== 'function') return;
    const canvas = root.querySelector('.pfh-magic-canvas');
    const labHead = canvas && canvas.querySelector('.pfh-magic-lab-head');
    if (!canvas || !labHead) return;
    const directChildren = Array.from(canvas.children);
    const backButton = canvas.querySelector('.pfh-magic-back');
    if (backButton) backButton.innerHTML = iconHtml('backArrow');
    const modeTabs = directChildren.find((element) => element.classList.contains('pfh-magic-mode-tabs'));
    const currentContent = directChildren.find((element) => element.classList.contains('pfh-magic-mode-content'));
    if (modeTabs && !currentContent) {
      const modeIndex = directChildren.indexOf(modeTabs);
      const modeContent = document.createElement('div');
      modeContent.className = 'pfh-magic-mode-content';
      directChildren.slice(modeIndex + 1).forEach((element) => modeContent.appendChild(element));
      canvas.appendChild(modeContent);
    }
    if (modeTabs && !labHead.contains(modeTabs)) {
      let headRight = labHead.querySelector('.pfh-magic-head-right');
      if (!headRight) {
        headRight = document.createElement('div');
        headRight.className = 'pfh-magic-head-right';
        labHead.appendChild(headRight);
      }
      const pipeline = labHead.querySelector('.pfh-magic-pipeline');
      if (pipeline && pipeline.parentNode !== headRight) headRight.appendChild(pipeline);
      headRight.insertBefore(modeTabs, pipeline || null);
    }
    const modeContent = canvas.querySelector('.pfh-magic-mode-content');
    const overview = modeContent && modeContent.querySelector(':scope > .pfh-magic-overview');
    const intake = modeContent && modeContent.querySelector(':scope > .pfh-magic-upload-drop, :scope > .pfh-magic-toy-label-form');
    if (modeContent && overview && intake && !modeContent.querySelector(':scope > .pfh-magic-workspace')) {
      const workspace = document.createElement('div');
      workspace.className = 'pfh-magic-workspace';
      modeContent.insertBefore(workspace, overview);
      workspace.appendChild(overview);
      workspace.appendChild(intake);
    }
    root.querySelectorAll('.pfh-magic-activity').forEach((element) => element.remove());
    const activeMode = String(modeTabs && modeTabs.dataset.activeMode || 'package');
    compactMagicPackageOverview(root);
    const pipeline = root.querySelector('.pfh-magic-pipeline');
    if (pipeline) pipeline.textContent = activeMode === 'effect' ? '效果图上传' : (activeMode === 'toy-label' ? '标签生成' : '智能上传');
    const labelFlow = root.querySelector('.pfh-magic-toy-label-form-head > strong');
    if (labelFlow) labelFlow.textContent = '自动生成并保存';
    const labelHint = root.querySelector('.pfh-magic-toy-label-hint');
    if (labelHint) labelHint.textContent = '玩具标签固定按宽4×高3cm生成，不读取 BOM 或普通印刷尺寸。';
    const queueSummary = root.querySelector('.pfh-magic-queue-head > span');
    if (queueSummary) queueSummary.textContent = queueSummary.textContent.replace('API 写入标签物料', '自动保存到标签物料');
    root.querySelectorAll('.pfh-magic-task-meta > span:last-child').forEach((element) => {
      if (/API|OSS/i.test(element.textContent || '')) element.textContent = '自动保存';
    });
    root.querySelectorAll('.pfh-magic-stage,.pfh-magic-status').forEach((element) => {
      element.textContent = String(element.textContent || '')
        .replace('上传标签尺寸图到 OSS', '正在上传标签尺寸图')
        .replace('调用 BOM API 保存标签', '正在保存标签物料')
        .replace(/获取效果图 OSS 授权/g, '正在准备效果图上传')
        .replace(/通过 API 上传 BOM 效果图/g, '正在上传效果图');
    });
    root.querySelectorAll('.pfh-magic-drop-icon').forEach((element) => element.remove());
    const effectDrop = root.querySelector('.pfh-magic-upload-drop[data-upload-drop="magic-effect"]');
    if (effectDrop) {
      effectDrop.setAttribute('aria-label', '拖入 JPG 或 PNG 效果图，悬浮后可按 Ctrl+V 粘贴');
      const hint = effectDrop.querySelector('div > span:last-child');
      if (hint) hint.textContent = '悬浮此框后按 Ctrl+V，可直接粘贴图片 · JPG / PNG / BMP · 按 SKU 或产品名自动匹配并保存';
    }
  }

  function updateMagicUploadProcessingNotice() {
    const panel = document.getElementById(PANEL_ID);
    const detail = panel && panel.querySelector('.pfh-detail');
    if (!detail) return;
    let notice = detail.querySelector('.pfh-magic-processing');
    if (!state.magicUploadProcessing) {
      if (notice) notice.remove();
      return;
    }
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'pfh-magic-processing';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      notice.innerHTML = '<span class="pfh-magic-spinner" aria-hidden="true"></span><span class="pfh-magic-processing-text"></span>';
      const workspace = detail.querySelector('.pfh-magic-workspace');
      const drop = detail.querySelector('.pfh-magic-upload-drop');
      if (workspace && workspace.parentNode) workspace.parentNode.insertBefore(notice, workspace.nextSibling);
      else if (drop && drop.parentNode) drop.parentNode.insertBefore(notice, drop);
      else detail.appendChild(notice);
    }
    const text = notice.querySelector('.pfh-magic-processing-text');
    if (text) text.textContent = state.magicUploadProcessingText || '正在处理文件…';
  }

  function renderSizeImage(panel) {
    const detail = panel.querySelector('.pfh-detail');
    detail.classList.remove('is-loading');
    detail.innerHTML = sizeImageViewHtml();
  }

  function renderParameterImage(panel) {
    const detail = panel.querySelector('.pfh-detail');
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    detail.classList.remove('is-loading');
    detail.innerHTML = parameterImageFeature.viewHtml(data || {});
  }

  function loadMagicUploadQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(MAGIC_UPLOAD_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(MAGIC_UPLOAD_QUEUE_KEY) || 'null');
      return Array.isArray(saved) ? saved.map(normalizeMagicUploadTask).filter(Boolean).slice(0, 300) : [];
    } catch (_) { return []; }
  }

  function normalizeManualToyEffectPacking(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      standardPackingQuantity: normalizeMagicUploadPackingQuantity(source.standardPackingQuantity || source.packQty || ''),
      boxWeight: normalizeMagicUploadBoxWeight(source.boxWeight || source.grossWeight || source.totalWeight || ''),
    };
  }

  function hasManualToyEffectPacking(value) {
    const normalized = normalizeManualToyEffectPacking(value);
    return Boolean(normalized.standardPackingQuantity && normalized.boxWeight);
  }

  function manualToyEffectPackingSummary(value) {
    const normalized = normalizeManualToyEffectPacking(value);
    if (!hasManualToyEffectPacking(normalized)) return '未设置装箱数和总重';
    return '装箱数 ' + normalized.standardPackingQuantity + ' · 总重 ' + normalized.boxWeight + ' kg';
  }

  function loadManualToyEffectPacking() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(MANUAL_TOY_EFFECT_PACKING_KEY, null)
        : JSON.parse(localStorage.getItem(MANUAL_TOY_EFFECT_PACKING_KEY) || 'null');
      return normalizeManualToyEffectPacking(saved);
    } catch (_) {
      return { standardPackingQuantity: '', boxWeight: '' };
    }
  }


  function saveMagicUploadQueue(queue) {
    // Keep runtime task/file references intact. Upload workers continue to
    // update those objects after a save; only the persisted snapshot is cloned
    // and normalized. The load path converts stale processing tasks to pending.
    const runtimeQueue = (Array.isArray(queue) ? queue : []).filter((task) => task && task.id).slice(0, 300);
    const snapshot = runtimeQueue.map((task) => normalizeMagicUploadTask(task, { preserveProcessing: true })).filter(Boolean);
    state.magicUploadQueue = runtimeQueue;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(MAGIC_UPLOAD_QUEUE_KEY, snapshot);
      else localStorage.setItem(MAGIC_UPLOAD_QUEUE_KEY, JSON.stringify(snapshot));
    } catch (error) { console.warn('PLM magic upload queue save failed:', error); }
  }

  function loadMagicUploadHistory() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(MAGIC_UPLOAD_HISTORY_KEY, null) : JSON.parse(localStorage.getItem(MAGIC_UPLOAD_HISTORY_KEY) || 'null');
      return Array.isArray(saved) ? saved.slice(0, 300) : [];
    } catch (_) { return []; }
  }

  function saveMagicUploadHistory(history) {
    const snapshot = Array.isArray(history) ? history.slice(0, 300) : [];
    state.magicUploadHistory = snapshot;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(MAGIC_UPLOAD_HISTORY_KEY, snapshot);
      else localStorage.setItem(MAGIC_UPLOAD_HISTORY_KEY, JSON.stringify(snapshot));
    } catch (error) { console.warn('PLM magic upload history save failed:', error); }
  }

  function normalizeMagicToyLabelTask(task, options) {
    if (!task || typeof task !== 'object') return null;
    const sku = String(task.sku || '').trim().toUpperCase();
    if (!sku) return null;
    const opts = options || {};
    const allowedStatuses = new Set(['pending', 'processing', 'success', 'error', 'waiting']);
    let status = allowedStatuses.has(task.status) ? task.status : 'pending';
    if (status === 'processing' && !opts.preserveProcessing) status = 'pending';
    const progress = Math.min(1, Math.max(0, Number(task.progress) || 0));
    return {
      ...task,
      id: String(task.id || createMagicUploadId()),
      sku,
      name: String(task.name || '').trim(),
      status,
      progress: status === 'success' ? 1 : progress,
      step: String(task.step || '').trim(),
      error: String(task.error || '').trim(),
      projectId: String(task.projectId || '').trim(),
      materialId: task.materialId === undefined || task.materialId === null ? '' : String(task.materialId),
      materialCode: String(task.materialCode || '').trim(),
      materialName: String(task.materialName || '').trim(),
      objectPath: String(task.objectPath || '').trim(),
      generatedFilename: String(task.generatedFilename || '').trim(),
      widthCm: Number(task.widthCm) || 0,
      heightCm: Number(task.heightCm) || 0,
      existingImagePaths: Array.from(new Set((Array.isArray(task.existingImagePaths) ? task.existingImagePaths : []).map((path) => normalizeMagicUploadEffectPath(path)).filter(Boolean))).slice(0, 20),
      replacementCheckStatus: String(task.replacementCheckStatus || 'idle'),
      replacementCheckError: String(task.replacementCheckError || '').trim(),
      replacementCheckToken: String(task.replacementCheckToken || '').trim(),
      replacementCheckedAt: Number(task.replacementCheckedAt) || 0,
      replacedExistingImage: Boolean(task.replacedExistingImage),
      replacementCompleted: Boolean(task.replacementCompleted),
      updatedAt: Number(task.updatedAt) || Date.now(),
    };
  }

  function loadMagicToyLabelQueue() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(MAGIC_TOY_LABEL_QUEUE_KEY, null) : JSON.parse(localStorage.getItem(MAGIC_TOY_LABEL_QUEUE_KEY) || 'null');
      return Array.isArray(saved) ? saved.map((task) => normalizeMagicToyLabelTask(task)).filter(Boolean).slice(0, 300) : [];
    } catch (_) { return []; }
  }

  function saveMagicToyLabelQueue(queue) {
    const runtimeQueue = (Array.isArray(queue) ? queue : []).filter((task) => task && task.id).slice(0, 300);
    const snapshot = runtimeQueue.map((task) => normalizeMagicToyLabelTask(task, { preserveProcessing: true })).filter(Boolean);
    state.magicToyLabelQueue = runtimeQueue;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(MAGIC_TOY_LABEL_QUEUE_KEY, snapshot);
      else localStorage.setItem(MAGIC_TOY_LABEL_QUEUE_KEY, JSON.stringify(snapshot));
    } catch (error) { console.warn('PLM magic toy label queue save failed:', error); }
  }

  function loadMagicToyLabelHistory() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(MAGIC_TOY_LABEL_HISTORY_KEY, null) : JSON.parse(localStorage.getItem(MAGIC_TOY_LABEL_HISTORY_KEY) || 'null');
      return Array.isArray(saved) ? saved.slice(0, 300) : [];
    } catch (_) { return []; }
  }

  function saveMagicToyLabelHistory(history) {
    const snapshot = Array.isArray(history) ? history.slice(0, 300) : [];
    state.magicToyLabelHistory = snapshot;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(MAGIC_TOY_LABEL_HISTORY_KEY, snapshot);
      else localStorage.setItem(MAGIC_TOY_LABEL_HISTORY_KEY, JSON.stringify(snapshot));
    } catch (error) { console.warn('PLM magic toy label history save failed:', error); }
  }

  function magicToyLabelStatusLabel(task) {
    if (!task) return '等待生成';
    if (task.status === 'success') return task.replacedExistingImage ? '已替换 BOM 标签图' : '已写入 BOM 标签';
    if (task.status === 'error') return task.error || '生成或上传失败';
    if (task.status === 'waiting') return '已暂停';
    return task.step || '等待生成';
  }

  function refreshMagicToyLabelPage() {
    if (state.view !== 'magicUpload' || state.magicUploadMode !== 'toy-label') return;
    if (!renderMagicUploadModeContent(ensurePanel())) renderShell();
  }

  function updateMagicToyLabelTask(task, patch, options) {
    if (!task) return;
    Object.assign(task, patch || {});
    task.updatedAt = Date.now();
    saveMagicToyLabelQueue(state.magicToyLabelQueue);
    const opts = options || {};
    if (opts.render !== false) refreshMagicToyLabelPage();
  }

  function parseMagicToyLabelSkus(value) {
    const matches = String(value || '').match(/\bSKU[A-Z0-9_-]+\b/gi) || [];
    const seen = new Set();
    return matches.map((item) => String(item).trim().toUpperCase()).filter((sku) => {
      if (!sku || seen.has(sku)) return false;
      seen.add(sku);
      return true;
    });
  }

  function addMagicToyLabelTasks(value) {
    if (!hasApiUploadAccess()) {
      notifyApiUploadAccessDenied();
      return;
    }
    const skus = parseMagicToyLabelSkus(value);
    if (!skus.length) {
      showToast('请粘贴 SKU 编码，例如 SKU12345678');
      return;
    }
    const queue = Array.isArray(state.magicToyLabelQueue) ? state.magicToyLabelQueue : [];
    const existing = new Set(queue.map((task) => String(task && task.sku || '').toUpperCase()));
    const addedTasks = [];
    let added = 0;
    skus.forEach((sku) => {
      if (existing.has(sku)) return;
      const cached = loadData(sku) || (state.index || []).find((item) => item && item.sku === sku) || {};
      const task = normalizeMagicToyLabelTask({
        id: createMagicUploadId(),
        sku,
        name: cached.name || '',
        status: 'pending',
        progress: 0,
        step: '等待生成',
        createdAt: Date.now(),
      }, { preserveProcessing: true });
      queue.push(task);
      addedTasks.push(task);
      existing.add(sku);
      added += 1;
    });
    state.magicToyLabelInput = '';
    state.magicToyLabelStatus = added ? '已加入 ' + added + ' 个玩具标签任务' : '这些 SKU 已在队列中';
    saveMagicToyLabelQueue(queue);
    scheduleMagicToyLabelReplacementChecks(addedTasks);
    refreshMagicToyLabelPage();
  }

  function removeMagicToyLabelTask(id) {
    const taskId = String(id || '');
    state.magicToyLabelQueue = (state.magicToyLabelQueue || []).filter((task) => task.id !== taskId);
    saveMagicToyLabelQueue(state.magicToyLabelQueue);
    refreshMagicToyLabelPage();
  }

  function retryMagicToyLabelTask(id) {
    const task = (state.magicToyLabelQueue || []).find((item) => item && item.id === String(id || ''));
    if (!task) return;
    updateMagicToyLabelTask(task, { status: 'pending', progress: 0, step: '等待重试', error: '', objectPath: '', existingImagePaths: [], replacementCheckStatus: task.sku ? 'checking' : 'idle', replacementCheckError: '', replacedExistingImage: false, replacementCompleted: false });
    scheduleMagicToyLabelReplacementChecks([task]);
  }

  function clearMagicToyLabelQueue() {
    state.magicToyLabelRunning = false;
    state.magicToyLabelQueue = [];
    state.magicToyLabelStatus = '队列已清空';
    saveMagicToyLabelQueue([]);
    refreshMagicToyLabelPage();
  }

  function retryMagicToyLabelHistory(id) {
    const entry = (state.magicToyLabelHistory || []).find((item) => item && item.id === String(id || ''));
    if (!entry || !entry.sku) return;
    const queue = Array.isArray(state.magicToyLabelQueue) ? state.magicToyLabelQueue : [];
    if (queue.some((task) => task && task.sku === entry.sku && task.status !== 'success')) {
      showToast(entry.sku + ' 已在玩具标签队列中');
      return;
    }
    const task = normalizeMagicToyLabelTask({ ...entry, id: createMagicUploadId(), status: 'pending', progress: 0, step: '等待重试', error: '', objectPath: '', existingImagePaths: [], replacementCheckStatus: entry.sku ? 'checking' : 'idle', replacementCheckError: '', replacedExistingImage: false, replacementCompleted: false }, { preserveProcessing: true });
    queue.push(task);
    state.magicToyLabelStatus = entry.sku + ' 已恢复到队列';
    saveMagicToyLabelQueue(queue);
    scheduleMagicToyLabelReplacementChecks([task]);
    state.magicToyLabelHistoryOpen = false;
    refreshMagicToyLabelPage();
  }

  function loadMagicUploadMetrics() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(MAGIC_UPLOAD_METRICS_KEY, null) : JSON.parse(localStorage.getItem(MAGIC_UPLOAD_METRICS_KEY) || 'null');
      const source = saved && typeof saved === 'object' ? saved : {};
      return { samples: Array.isArray(source.samples) ? source.samples.slice(-120) : [] };
    } catch (_) { return { samples: [] }; }
  }

  function saveMagicUploadMetrics(metrics) {
    const source = metrics && typeof metrics === 'object' ? metrics : { samples: [] };
    const snapshot = { samples: Array.isArray(source.samples) ? source.samples.slice(-120) : [] };
    state.magicUploadMetrics = snapshot;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(MAGIC_UPLOAD_METRICS_KEY, snapshot);
      else localStorage.setItem(MAGIC_UPLOAD_METRICS_KEY, JSON.stringify(snapshot));
    } catch (error) { console.warn('PLM magic upload metrics save failed:', error); }
  }

  function formatMagicUploadBytes(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value >= 1024 * 1024 * 1024) return (value / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    if (value >= 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + ' MB';
    if (value >= 1024) return Math.round(value / 1024) + ' KB';
    return value + ' B';
  }

  function formatMagicUploadDuration(seconds) {
    const value = Math.max(0, Math.round(Number(seconds) || 0));
    if (!value) return '—';
    if (value < 60) return value + ' 秒';
    const minutes = Math.floor(value / 60);
    const rest = value % 60;
    return minutes + ' 分' + (rest ? ' ' + rest + ' 秒' : '');
  }


  function getMagicUploadTaskByteTotals(task) {
    const fallbackTotalBytes = (task && task.files || []).reduce((sum, entry) => sum + Math.max(0, Number(entry && entry.size) || 0), 0) + (task && task.zipKey ? Math.max(0, Number(task.sourceSize) || 0) : 0);
    const totalBytes = Math.max(0, Number(task && task.totalBytes) || fallbackTotalBytes);
    const uploadedBytes = Math.min(totalBytes, Math.max(0, Number(task && task.uploadedBytes) || 0));
    const currentFileSize = Math.max(0, Number(task && task.currentFileSize) || 0);
    const currentFileProgress = Math.min(1, Math.max(0, Number(task && task.currentFileProgress) || 0));
    const currentBytes = Math.min(currentFileSize, currentFileSize * currentFileProgress);
    return { totalBytes, uploadedBytes, currentBytes };
  }


  function getMagicUploadTaskFileCount(task) {
    return (task && Array.isArray(task.files) ? task.files.length : 0) + (task && task.zipKey ? 1 : 0);
  }

  function getMagicUploadTaskDoneFileCount(task) {
    return (task && Array.isArray(task.files) ? task.files.filter((entry) => entry && entry.status === 'success').length : 0) + (task && task.sourceUploaded ? 1 : 0);
  }


  function getMagicUploadAvgFileDurationMs() {
    const samples = state.magicUploadMetrics && Array.isArray(state.magicUploadMetrics.samples) ? state.magicUploadMetrics.samples.slice(-60) : [];
    const durations = samples.map((sample) => Math.max(0, Number(sample && sample.durationMs) || 0)).filter((value) => value > 0);
    if (!durations.length) return 0;
    const median = (values) => {
      const sorted = values.slice().sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    };
    const recent = durations.slice(-12);
    return median(durations) * .7 + median(recent) * .3;
  }

  function getMagicUploadBaselineTaskSeconds(queue, totalFiles) {
    const taskCount = Array.isArray(queue) ? queue.filter(Boolean).length : 0;
    const avgFileMs = getMagicUploadAvgFileDurationMs();
    const fileCount = Math.max(0, Number(totalFiles) || 0);
    if (!taskCount || !fileCount || !avgFileMs) return 0;
    return Math.max(1, Math.round((avgFileMs / 1000) * fileCount / taskCount));
  }

  function getMagicUploadTaskRemainingFileCount(task) {
    const entries = Array.isArray(task && task.files) ? task.files : [];
    const pendingEntries = entries.filter((entry) => entry && entry.status !== 'success').length;
    const zipPending = task && task.zipKey && !task.sourceUploaded ? 1 : 0;
    return pendingEntries + zipPending;
  }

  function calibrateMagicUploadTaskEta(task) {
    if (!task) return 0;
    const avgFileMs = getMagicUploadAvgFileDurationMs();
    const remainingFiles = getMagicUploadTaskRemainingFileCount(task);
    const targetSeconds = avgFileMs > 0 ? Math.ceil(remainingFiles * avgFileMs / 1000) : 0;
    task.etaSeconds = targetSeconds;
    task._etaCalibratedSeconds = targetSeconds;
    task._etaCalibratedAt = Date.now();
    return targetSeconds;
  }

  function getMagicUploadTaskDisplayEta(task) {
    if (!task) return 0;
    const base = Math.max(0, Number(task.etaSeconds) || 0);
    if (!base) return 0;
    if (typeof task._etaCalibratedSeconds !== 'number' || !task._etaCalibratedAt) return base;
    const elapsed = Math.max(0, (Date.now() - task._etaCalibratedAt) / 1000);
    return Math.max(0, Math.round(task._etaCalibratedSeconds - elapsed));
  }

  function updateMagicUploadTaskEstimate(task) {
    if (!task) return 0;
    return calibrateMagicUploadTaskEta(task);
  }

  function getMagicUploadQueueEtaSeconds() {
    let total = 0;
    let any = false;
    (state.magicUploadQueue || []).forEach((task) => {
      if (!task || task.status === 'success' || task.status === 'waiting') return;
      any = true;
      const displayEta = getMagicUploadTaskDisplayEta(task);
      if (displayEta > 0) {
        total += displayEta;
      } else {
        const avgFileMs = getMagicUploadAvgFileDurationMs();
        if (avgFileMs > 0) total += Math.ceil(getMagicUploadTaskRemainingFileCount(task) * avgFileMs / 1000);
      }
    });
    return any ? total : 0;
  }

  function readMagicUploadProgressPercent(bar) {
    if (!bar) return 0;
    const inlineWidth = Number.parseFloat(String(bar.style.width || '').replace('%', ''));
    if (Number.isFinite(inlineWidth)) return Math.min(100, Math.max(0, inlineWidth));
    const track = bar.parentElement;
    const trackWidth = track && track.clientWidth;
    if (!trackWidth) return 0;
    const renderedWidth = Number.parseFloat(window.getComputedStyle(bar).width || '0');
    return Number.isFinite(renderedWidth) ? Math.min(100, Math.max(0, renderedWidth / trackWidth * 100)) : 0;
  }

  function animateMagicUploadProgressBar(bar, targetPercent) {
    if (!bar) return;
    const target = Math.min(100, Math.max(0, Number(targetPercent) || 0));
    const previous = magicUploadProgressAnimations.get(bar);
    if (previous && Math.abs(previous.target - target) < .01) return;
    if (previous && previous.frame) window.cancelAnimationFrame(previous.frame);
    const start = previous ? previous.value : readMagicUploadProgressPercent(bar);
    bar.style.setProperty('transition', 'none', 'important');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || Math.abs(target - start) < .05) {
      bar.style.width = target + '%';
      magicUploadProgressAnimations.set(bar, { target, value: target, frame: 0 });
      return;
    }
    const animation = { target, value: start, frame: 0 };
    const startedAt = window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now();
    const duration = Math.min(1180, Math.max(560, 520 + Math.abs(target - start) * 5));
    const tick = (timestamp) => {
      if (magicUploadProgressAnimations.get(bar) !== animation) return;
      const elapsed = timestamp - startedAt;
      const ratio = Math.min(1, Math.max(0, elapsed / duration));
      const eased = 1 - Math.pow(1 - ratio, 3);
      animation.value = start + (target - start) * eased;
      bar.style.width = animation.value.toFixed(3) + '%';
      if (ratio < 1) {
        animation.frame = window.requestAnimationFrame(tick);
        return;
      }
      animation.value = target;
      animation.frame = 0;
      bar.style.width = target + '%';
    };
    magicUploadProgressAnimations.set(bar, animation);
    animation.frame = window.requestAnimationFrame(tick);
  }

  function updateMagicUploadOverviewEta() {
    if (state.view !== 'magicUpload') return;
    const panel = document.getElementById(PANEL_ID);
    const eta = panel && panel.querySelector('[data-magic-overall-eta]');
    const bar = panel && panel.querySelector('[data-magic-queue-progress-bar]');
    const text = panel && panel.querySelector('[data-magic-queue-progress-text]');
    const queueCount = panel && panel.querySelector('[data-magic-queue-count]');
    const doneTasks = panel && panel.querySelector('[data-magic-done-tasks]');
    const baseline = panel && panel.querySelector('[data-magic-task-baseline]');
    if (!eta) return;
    const queue = Array.isArray(state.magicUploadQueue) ? state.magicUploadQueue : [];
    const hasWork = queue.some((task) => task && (task.status === 'pending' || task.status === 'processing' || task.status === 'error'));
    const targetSeconds = getMagicUploadQueueEtaSeconds();
    let doneFiles = 0;
    let totalFiles = 0;
    let queueDoneBytes = 0;
    let queueTotalBytes = 0;
    queue.forEach((task) => {
      totalFiles += getMagicUploadTaskFileCount(task);
      doneFiles += getMagicUploadTaskDoneFileCount(task);
      const totals = getMagicUploadTaskByteTotals(task);
      if (totals.totalBytes > 0) {
        queueTotalBytes += totals.totalBytes;
        queueDoneBytes += Math.min(totals.totalBytes, totals.uploadedBytes + totals.currentBytes);
      } else {
        const taskFiles = getMagicUploadTaskFileCount(task);
        queueTotalBytes += taskFiles;
        queueDoneBytes += Math.min(taskFiles, getMagicUploadTaskDoneFileCount(task));
      }
    });
    const queuePercent = queueTotalBytes > 0 ? Math.min(100, Math.max(0, queueDoneBytes / queueTotalBytes * 100)) : 0;
    if (bar) animateMagicUploadProgressBar(bar, queuePercent);
    if (text) text.textContent = doneFiles + '/' + totalFiles;
    if (queueCount) queueCount.textContent = String(queue.length);
    if (doneTasks) doneTasks.textContent = queue.filter((task) => task && task.status === 'success').length + '/' + queue.length;
    if (baseline) {
      const baselineSeconds = getMagicUploadBaselineTaskSeconds(queue, totalFiles);
      baseline.textContent = baselineSeconds > 0 ? '基准：' + baselineSeconds + ' 秒/任务' : '基准：按历史估算';
    }
    eta.textContent = targetSeconds > 0 ? formatMagicUploadDuration(targetSeconds) : (state.magicUploadRunning && hasWork ? '正在估算' : '—');
  }

  function updateMagicUploadEtaDisplay() {
    if (state.view !== 'magicUpload') return;
    (state.magicUploadQueue || []).filter((task) => task && task.status === 'processing').forEach((task) => updateMagicUploadProgress(task));
    updateMagicUploadOverviewEta();
  }

  function recordMagicUploadMetric(task, entry, durationMs) {
    const bytes = Math.max(0, Number(entry && entry.size) || 0);
    const elapsed = Math.max(1, Number(durationMs) || 1);
    if (!bytes) return;
    const metrics = state.magicUploadMetrics || { samples: [] };
    metrics.samples = (Array.isArray(metrics.samples) ? metrics.samples : []).concat({ bytes, durationMs: elapsed, category: String(entry.category || ''), recordedAt: Date.now() }).slice(-120);
    saveMagicUploadMetrics(metrics);
    magicUploadLog('info', '上传耗时已记录', task.sku + ' | ' + (entry.category || '文件') + ' | ' + formatMagicUploadBytes(bytes) + ' | ' + formatMagicUploadDuration(elapsed / 1000));
  }

  function updateMagicUploadProgress(task) {
    if (!task || state.view !== 'magicUpload') return;
    const totals = getMagicUploadTaskByteTotals(task);
    task.progress = totals.totalBytes > 0 ? Math.min(1, Math.max(0, (totals.uploadedBytes + totals.currentBytes) / totals.totalBytes)) : 0;
    const panel = document.getElementById(PANEL_ID);
    const row = panel && panel.querySelector('.pfh-magic-task[data-magic-id="' + CSS.escape(String(task.id)) + '"]');
    if (!row) return;
    const progress = Math.min(100, Math.max(0, Number(task.progress) || 0) * 100);
    const bar = row.querySelector('[data-magic-progress-bar]');
    const value = row.querySelector('[data-magic-progress-value]');
    const eta = row.querySelector('[data-magic-eta]');
    const stage = row.querySelector('[data-magic-stage]');
    const displayEta = getMagicUploadTaskDisplayEta(task);
    if (bar) animateMagicUploadProgressBar(bar, progress);
    if (value) value.textContent = Math.round(progress) + '%';
    if (eta) eta.textContent = task.status === 'success' ? '已完成' : (displayEta ? '约 ' + formatMagicUploadDuration(displayEta) : '正在建立估算');
    if (stage) stage.textContent = task.currentFileName ? (task.step || '上传中') + ' · ' + (task.currentFileName.split('/').pop() || task.currentFileName) : (task.step || '等待上传');
    updateMagicUploadOverviewEta();
  }

  async function hydrateMagicUploadTaskMetrics(task) {
    if (!task) return;
    let totalBytes = 0;
    let uploadedBytes = 0;
    for (const entry of task.files || []) {
      if (!entry.size) {
        const file = await getUploadFile(entry.key);
        if (file) entry.size = Number(file.size) || 0;
      }
      totalBytes += Number(entry.size) || 0;
      if (entry.status === 'success') uploadedBytes += Number(entry.size) || 0;
    }
    if (task.zipKey) {
      if (!task.sourceSize) {
        const sourceFile = await getUploadFile(task.zipKey);
        if (sourceFile) task.sourceSize = Number(sourceFile.size) || 0;
      }
      totalBytes += Number(task.sourceSize) || 0;
      if (task.sourceUploaded) uploadedBytes += Number(task.sourceSize) || 0;
    }
    task.totalBytes = totalBytes;
    task.uploadedBytes = uploadedBytes;
    updateMagicUploadTaskEstimate(task);
  }

  function recordMagicUploadHistory(task) {
    if (!task || !task.id) return;
    const files = Array.isArray(task.files) ? task.files : [];
    const successCount = files.filter((entry) => entry.status === 'success').length;
    const failedCount = files.filter((entry) => entry.status === 'error').length;
    const snapshot = normalizeMagicUploadTask(task, { preserveProcessing: true });
    const startedAt = Number(task.startedAt) || Number(task.createdAt) || Date.now();
    const finishedAt = Number(task.finishedAt) || (task.status === 'success' || task.status === 'error' ? Date.now() : 0);
    const entry = {
      id: String(task.id),
      sku: String(task.sku || ''),
      sourceName: String(task.sourceName || task.zipName || ''),
      sourceSize: Math.max(0, Number(task.sourceSize) || 0),
      status: String(task.status || ''),
      error: String(task.error || ''),
      fileCount: files.length,
      successCount,
      failedCount,
      startedAt,
      finishedAt,
      durationMs: Math.max(0, finishedAt ? finishedAt - startedAt : 0),
      task: snapshot,
      updatedAt: Date.now(),
    };
    const history = (state.magicUploadHistory || []).filter((item) => item && item.id !== entry.id);
    saveMagicUploadHistory([entry].concat(history).slice(0, 300));
    scheduleDesktopBridgeSnapshot();
  }

  function normalizeMagicUploadTask(task, options) {
    if (!task || !task.id) return null;
    const preserveProcessing = Boolean(options && options.preserveProcessing);
    const allowed = new Set(['pending', 'processing', 'success', 'error', 'waiting']);
    const files = Array.isArray(task.files) ? task.files.map((entry, index) => ({
      ...(entry || {}),
      index,
      name: String(entry && entry.name || ''),
      key: String(entry && entry.key || ''),
      size: Math.max(0, Number(entry && entry.size) || 0),
      category: MAGIC_UPLOAD_CATEGORIES[String(entry && entry.category || '')] ? String(entry.category) : '待确认',
      archiveTypeId: Number(entry && entry.archiveTypeId) || 0,
      status: String(entry && entry.status || 'pending'),
      error: String(entry && entry.error || ''),
      generatedName: String(entry && entry.generatedName || ''),
      fileVersionId: String(entry && (entry.fileVersionId || entry.file_version_id) || ''),
      fileId: String(entry && (entry.fileId || entry.file_id) || ''),
      fileSavePath: String(entry && (entry.fileSavePath || entry.file_save_path) || ''),
    })).filter((entry) => entry.name && entry.key) : [];
    const status = allowed.has(String(task.status || '')) ? String(task.status) : 'pending';
    return {
      ...(task || {}),
      id: String(task.id),
      sku: String(task.sku || '').toUpperCase(),
      zipName: String(task.zipName || ''),
      sourceType: String(task.sourceType || (task.zipKey ? 'zip' : '')),
      sourceName: String(task.sourceName || task.zipName || ''),
      sourceUploaded: Boolean(task.sourceUploaded),
      sourceGeneratedName: String(task.sourceGeneratedName || ''),
      sourceFileVersionId: String(task.sourceFileVersionId || ''),
      replaceCategories: Array.isArray(task.replaceCategories) ? Array.from(new Set(task.replaceCategories.map((category) => String(category || '')).filter((category) => MAGIC_UPLOAD_ATTRIBUTE_VARIABLES[category]))) : [],
      existingFileVersionIds: task.existingFileVersionIds && typeof task.existingFileVersionIds === 'object' ? Object.keys(task.existingFileVersionIds).reduce((result, category) => {
        result[category] = Array.from(new Set((Array.isArray(task.existingFileVersionIds[category]) ? task.existingFileVersionIds[category] : []).map((id) => String(id || '')).filter(Boolean)));
        return result;
      }, {}) : {},
      existingFiles: task.existingFiles && typeof task.existingFiles === 'object' ? Object.keys(task.existingFiles).reduce((result, category) => {
        result[category] = (Array.isArray(task.existingFiles[category]) ? task.existingFiles[category] : []).map((file) => ({ id: String(file && file.id || ''), name: String(file && file.name || ''), path: String(file && file.path || '') })).filter((file) => file.id);
        return result;
      }, {}) : {},
      replacementCheckStatus: String(task.replacementCheckStatus || 'idle'),
      replacementCheckError: String(task.replacementCheckError || ''),
      replacementCheckToken: String(task.replacementCheckToken || ''),
      replacementCheckedAt: Number(task.replacementCheckedAt) || 0,
      submitted: Boolean(task.submitted),
      draftSaved: Boolean(task.draftSaved),
      zipKey: String(task.zipKey || ''),
      projectId: String(task.projectId || ''),
      productId: String(task.productId || ''),
      productVersionId: String(task.productVersionId || ''),
      excelPacking: normalizeMagicUploadExcelPacking(task.excelPacking),
      files,
      totalBytes: Math.max(0, Number(task.totalBytes) || 0),
      uploadedBytes: Math.max(0, Number(task.uploadedBytes) || 0),
      currentFileName: String(task.currentFileName || ''),
      currentFileSize: Math.max(0, Number(task.currentFileSize) || 0),
      currentFileProgress: Math.min(1, Math.max(0, Number(task.currentFileProgress) || 0)),
      progress: Math.min(1, Math.max(0, Number(task.progress) || 0)),
      etaSeconds: Math.max(0, Number(task.etaSeconds) || 0),
      startedAt: Number(task.startedAt) || 0,
      finishedAt: Number(task.finishedAt) || 0,
      status: status === 'processing' && !preserveProcessing ? 'pending' : status,
      step: String(task.step || ''),
      error: String(task.error || ''),
      updatedAt: Number(task.updatedAt) || Date.now(),
      createdAt: Number(task.createdAt) || Date.now(),
    };
  }

  function isMagicUploadIgnoredEntry(name) {
    const normalized = String(name || '').replace(/\\/g, '/');
    const firstFolder = normalized.split('/').filter(Boolean)[0] || '';
    return MAGIC_UPLOAD_IGNORE_DIRS.indexOf(firstFolder) !== -1;
  }

  function classifyMagicUploadName(name) {
    const normalized = String(name || '').replace(/\\/g, '/');
    const firstFolder = normalized.split('/').filter(Boolean)[0] || '';
    const candidates = [firstFolder, normalized];
    for (const candidate of candidates) {
      for (const label of Object.keys(MAGIC_UPLOAD_CATEGORIES)) {
        if (candidate === label || candidate.includes(label)) return label;
      }
    }
    if (/\.(?:mp4|mov|avi|webm)$/i.test(normalized)) return '视频';
    if (/\.gif$/i.test(normalized)) return '动图';
    return '待确认';
  }

  function getMagicUploadFileExtension(name) {
    const match = String(name || '').match(/(\.[^.\\/]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  function getMagicUploadRule(category, extension) {
    const item = MAGIC_UPLOAD_CATEGORIES[category];
    return item || (extension === '.zip' ? MAGIC_UPLOAD_CATEGORIES['图包素材'] : null);
  }

  function createMagicUploadId() {
    return 'magic-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function magicUploadLog(level, message, detail) {
    addLog(level || 'info', '魔法上传 ' + message, detail || '');
  }

  function withMagicUploadTimeout(promise, timeoutMs, label) {
    let timer = 0;
    const timeout = new Promise((resolve, reject) => {
      timer = window.setTimeout(() => reject(new Error(String(label || '操作') + '超时（' + Math.round(timeoutMs / 1000) + '秒）')), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
  }

  function isRetryableOssUploadError(error) {
    const status = Number(error && error.status);
    const message = String(error && (error.message || error.name || error.code) || error || '');
    return status === -1 || status === -2 || /ConnectionTimeoutError|ResponseTimeoutError|NetworkError|Network request failed|Failed to upload some parts|ECONNRESET|ETIMEDOUT|timeout/i.test(message);
  }

  async function multipartUploadWithRetry(client, objectName, file, options, onRetry) {
    const sourceOptions = options && typeof options === 'object' ? options : {};
    let checkpoint = null;
    let retryCount = 0;
    let parallel = Math.max(1, Number(sourceOptions.parallel) || 1);
    while (true) {
      try {
        const uploadOptions = { ...sourceOptions, parallel, timeout: Number(sourceOptions.timeout) || OSS_UPLOAD_TIMEOUT_MS };
        if (checkpoint && checkpoint.uploadId) uploadOptions.checkpoint = checkpoint;
        const progress = sourceOptions.progress;
        uploadOptions.progress = (percent, nextCheckpoint, response) => {
          if (nextCheckpoint && nextCheckpoint.uploadId) checkpoint = nextCheckpoint;
          if (typeof progress === 'function') return progress(percent, nextCheckpoint, response);
        };
        return await client.multipartUpload(objectName, file, uploadOptions);
      } catch (error) {
        if (!isRetryableOssUploadError(error) || retryCount >= OSS_UPLOAD_RETRY_MAX) throw error;
        retryCount += 1;
        // A single in-flight part is safer after a connection failure. The checkpoint
        // keeps already completed parts out of the next attempt.
        parallel = 1;
        const delay = Math.min(10000, OSS_UPLOAD_RETRY_DELAY_MS * Math.pow(2, retryCount - 1)) + Math.floor(Math.random() * 400);
        if (typeof onRetry === 'function') onRetry(error, retryCount, delay, checkpoint);
        await wait(delay);
      }
    }
  }

  function readMagicUploadArrayBuffer(file) {
    if (file && typeof file.arrayBuffer === 'function') return file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('无法读取文件内容'));
      reader.readAsArrayBuffer(file);
    });
  }

  function formatMagicUploadDecimal(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '';
    return String(Math.round(number * 100000) / 100000);
  }

  function normalizeMagicUploadPackingQuantity(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().replace(/,/g, '');
    if (!text || /^=/.test(text)) return '';
    const match = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
    if (!match) return '';
    const number = Number(match[0]);
    if (!Number.isFinite(number) || number <= 0 || !Number.isInteger(number) || number > 10000) return '';
    return String(number);
  }

  function normalizeMagicUploadBoxWeight(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().replace(/,/g, '');
    if (!text || /^=/.test(text)) return '';
    const match = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*(kg|千克|公斤|g|克)?/i);
    if (!match) return '';
    let number = Number(match[0].replace(/\s*(kg|千克|公斤|g|克)\s*$/i, ''));
    if (!Number.isFinite(number) || number <= 0 || number > 10000) return '';
    if (/^(g|克)$/i.test(match[1] || '')) number /= 1000;
    return formatMagicUploadDecimal(number);
  }

  function normalizeMagicUploadGrossWeightGrams(value) {
    const text = String(value === null || value === undefined ? '' : value).trim().replace(/,/g, '');
    if (!text || /^=/.test(text)) return 0;
    const match = text.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*(kg|千克|公斤|g|克)?/i);
    if (!match) return 0;
    let number = Number(match[0].replace(/\s*(kg|千克|公斤|g|克)\s*$/i, ''));
    if (!Number.isFinite(number) || number <= 0 || number > 1000000) return 0;
    if (/^(kg|千克|公斤)$/i.test(match[1] || '')) number *= 1000;
    return number;
  }

  function calculateMagicUploadFormulaBoxWeight(packValue, grossWeightValue) {
    const quantity = Number(normalizeMagicUploadPackingQuantity(packValue));
    const grossWeightGrams = normalizeMagicUploadGrossWeightGrams(grossWeightValue);
    if (!Number.isFinite(quantity) || quantity <= 0 || !grossWeightGrams) return '';
    const boxWeight = quantity * grossWeightGrams / 1000 + 0.75;
    return formatMagicUploadDecimal(Math.round(boxWeight * 100) / 100);
  }

  function normalizeMagicUploadExcelCartonSpec(value) {
    const text = String(value === null || value === undefined ? '' : value)
      .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return !text || /^=/.test(text) ? '' : text.slice(0, 180);
  }

  function normalizeMagicUploadExcelPacking(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      standardPackingQuantity: normalizeMagicUploadPackingQuantity(source.standardPackingQuantity || source.packQty || ''),
      boxWeight: normalizeMagicUploadBoxWeight(source.boxWeight || ''),
      cartonSpec: normalizeMagicUploadExcelCartonSpec(source.cartonSpec || source.cartonSpecText || source.outerCartonSpec || source.boxSpec || ''),
      sourceName: String(source.sourceName || '').slice(0, 180),
      parsedAt: Number(source.parsedAt) || 0,
    };
  }

  function getMagicUploadExcelCellRead(cell) {
    const raw = cell && cell.value;
    if (raw === null || raw === undefined) return { value: '', formula: '' };
    if (raw && typeof raw === 'object') {
      if (raw.result !== undefined && raw.result !== null && raw.result !== '') {
        return { value: raw.result, formula: String(raw.formula || '') };
      }
      if (Array.isArray(raw.richText)) {
        return { value: raw.richText.map((item) => item && item.text || '').join(''), formula: '' };
      }
      if (raw.text !== undefined && raw.text !== null) {
        const rawText = String(raw.text);
        return /^=/.test(rawText.trim())
          ? { value: '', formula: rawText.trim() }
          : { value: raw.text, formula: String(raw.formula || '') };
      }
      if (raw.formula !== undefined) return { value: '', formula: String(raw.formula || '') };
    }
    const text = cell && typeof cell.text === 'string' ? cell.text : raw;
    const value = text === null || text === undefined ? '' : text;
    return /^=/.test(String(value).trim())
      ? { value: '', formula: String(value).trim() }
      : { value, formula: '' };
  }

  function normalizeMagicUploadExcelHeader(value) {
    return compactText(value).replace(/[\s:：()（）【】\[\]]/g, '').toLowerCase();
  }

  function getMagicUploadExcelHeaderKey(value) {
    const label = normalizeMagicUploadExcelHeader(value);
    if (!label) return '';
    if (/^(产品编码|商品编码|sku)$/.test(label)) return 'sku';
    if (/^(?:箱规|箱规尺寸|外箱规格|外箱尺寸)(?:cm|厘米)?$/.test(label)) return 'cartonSpec';
    if (/^(装箱数|标准装箱数)$/.test(label)) return 'standardPackingQuantity';
    if (/^(一箱重量|箱重|箱重量)$/.test(label)) return 'boxWeight';
    if (/^(毛重|毛重约|产品毛重)$/.test(label)) return 'grossWeight';
    return '';
  }

  async function parseMagicUploadPackingExcel(file, sku, cachedPackingQuantity) {
    const Excel = await ensureExcelJsLoaded();
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(await readMagicUploadArrayBuffer(file));
    const worksheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    if (!worksheet) throw new Error('Excel 中没有可读取的工作表');

    let header = null;
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      if (header) return;
      const columns = {};
      row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
        const key = getMagicUploadExcelHeaderKey(getMagicUploadExcelCellRead(cell).value);
        if (key && columns[key] === undefined) columns[key] = columnNumber;
      });
      if (columns.standardPackingQuantity !== undefined && columns.boxWeight !== undefined && columns.sku !== undefined) {
        header = { rowNumber: row.number, columns };
      }
    });
    if (!header) throw new Error('Excel 未找到产品编码、装箱数和一箱重量表头');

    const targetSku = String(sku || '').trim().toUpperCase();
    let matchedRow = null;
    for (let rowNumber = header.rowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const rowSku = String(getMagicUploadExcelCellRead(row.getCell(header.columns.sku)).value || '').trim().toUpperCase();
      if (rowSku === targetSku) {
        matchedRow = row;
        break;
      }
    }
    if (!matchedRow) throw new Error('Excel 未找到 SKU：' + targetSku);

    const quantityRead = getMagicUploadExcelCellRead(matchedRow.getCell(header.columns.standardPackingQuantity));
    const weightRead = getMagicUploadExcelCellRead(matchedRow.getCell(header.columns.boxWeight));
    const cartonSpecRead = header.columns.cartonSpec === undefined
      ? { value: '', formula: '' }
      : getMagicUploadExcelCellRead(matchedRow.getCell(header.columns.cartonSpec));
    const cellPackingQuantity = normalizeMagicUploadPackingQuantity(quantityRead.value);
    const cachedQuantity = normalizeMagicUploadPackingQuantity(cachedPackingQuantity);
    let parsed = normalizeMagicUploadExcelPacking({
      standardPackingQuantity: cellPackingQuantity || cachedQuantity,
      boxWeight: weightRead.value,
      cartonSpec: cartonSpecRead.value,
      sourceName: file && file.name || '',
      parsedAt: Date.now(),
    });
    let formulaFallbackUsed = false;
    if (!parsed.boxWeight && header.columns.grossWeight !== undefined) {
      const grossWeightRead = getMagicUploadExcelCellRead(matchedRow.getCell(header.columns.grossWeight));
      const formulaBoxWeight = calculateMagicUploadFormulaBoxWeight(parsed.standardPackingQuantity, grossWeightRead.value);
      if (formulaBoxWeight) {
        parsed = { ...parsed, boxWeight: formulaBoxWeight };
        formulaFallbackUsed = true;
      }
    }
    if (!parsed.boxWeight) {
      throw new Error(weightRead.formula
        ? 'Excel 箱重公式没有缓存计算结果，且无法按装箱数和毛重约计算，已停止上传，避免把公式写入 PLM'
        : 'Excel 未读取到箱重，且无法按装箱数和毛重约计算，已停止上传');
    }
    return {
      ...parsed,
      formulaResultUsed: Boolean(weightRead.formula && parsed.boxWeight),
      formulaFallbackUsed,
    };
  }

  async function readMagicUploadPackingFromFile(file, sku, cachedPacking) {
    const cached = normalizeMagicUploadExcelPacking(cachedPacking);
    const parsed = await parseMagicUploadPackingExcel(file, sku, cached.standardPackingQuantity);
    const result = { ...cached };
    MAGIC_UPLOAD_EXCEL_PACKING_FIELDS.forEach((field) => {
      const incoming = parsed[field.key];
      if (!incoming) return;
      if (result[field.key] && result[field.key] !== incoming) {
        throw new Error('同一 SKU 的多个 Excel 中“' + field.label + '”不一致');
      }
      result[field.key] = incoming;
    });
    if (!result.sourceName) result.sourceName = parsed.sourceName;
    result.parsedAt = parsed.parsedAt || result.parsedAt;
    return {
      ...result,
      formulaResultUsed: Boolean(parsed.formulaResultUsed),
      formulaFallbackUsed: Boolean(parsed.formulaFallbackUsed),
    };
  }

  async function readMagicUploadPackingFromTask(task) {
    const cached = normalizeMagicUploadExcelPacking(task && task.excelPacking);
    const entries = (task && task.files || []).filter((entry) => entry && /\.xlsx$/i.test(entry.name || ''));
    if (!entries.length) return cached;
    let result = cached;
    for (const entry of entries) {
      const file = await getUploadFile(entry.key);
      if (!file) throw new Error('Excel 文件已丢失：' + (entry.name || '未命名文件'));
      const parsed = await readMagicUploadPackingFromFile(file, task && task.sku, result);
      result = parsed;
      if (parsed.formulaResultUsed || parsed.formulaFallbackUsed) {
        magicUploadLog('info', parsed.formulaFallbackUsed ? '已按 Excel 公式计算箱重' : '已读取 Excel 箱重缓存值', task.sku + ' | ' + parsed.sourceName + ' | 不使用公式文本');
      }
    }
    task.excelPacking = result;
    task.updatedAt = Date.now();
    saveMagicUploadQueue(state.magicUploadQueue);
    magicUploadLog('info', 'Excel 装箱信息读取完成', task.sku + ' | 装箱数=' + (result.standardPackingQuantity || '空') + ' | 箱规=' + (result.cartonSpec || '空') + ' | 箱重=' + (result.boxWeight || '空'));
    return result;
  }

  // ZIP 内文件名编码兼容：Windows 中文压缩工具生成的 zip 常用 GBK 编码且不设置
  // UTF-8 标志位（bit 11）。fflate 会按 Latin-1 直转（产生 Ó¢ÎÄ²ÎÊýÍ¼ 类乱码，可逆），
  // JSZip 默认则产生 U+FFFD（不可逆）。以下函数负责正确还原文件名。
  function decodeMagicUploadZipFileName(bytes) {
    let u8;
    try {
      u8 = new Uint8Array(bytes);
    } catch (error) {
      u8 = Uint8Array.from(bytes || []);
    }
    if (!u8.length) return '';
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(u8);
    } catch (error) {
      try {
        return new TextDecoder('gbk').decode(u8);
      } catch (error2) {
        return String.fromCharCode.apply(null, Array.from(u8));
      }
    }
  }

  function fixMagicUploadZipEntryName(name) {
    if (!name) return name;
    let hasHighChar = false;
    const bytes = new Uint8Array(name.length);
    for (let i = 0; i < name.length; i++) {
      const code = name.charCodeAt(i);
      if (code > 0xFF) {
        hasHighChar = true;
        break;
      }
      bytes[i] = code;
    }
    if (hasHighChar || !bytes.length) return name;
    try {
      const decoded = new TextDecoder('gbk').decode(bytes);
      return decoded.indexOf('\uFFFD') !== -1 ? name : decoded;
    } catch (error) {
      return name;
    }
  }

  async function decodeMagicUploadZipEntries(zipBuffer, sourceName) {
    const decoder = typeof fflate !== 'undefined' && fflate && typeof fflate.unzip === 'function' ? fflate : null;
    if (decoder) {
      magicUploadLog('info', 'ZIP 开始批量解压', sourceName + ' | 解码器=fflate');
      try {
        const decoded = await withMagicUploadTimeout(new Promise((resolve, reject) => {
          decoder.unzip(new Uint8Array(zipBuffer), (error, files) => error ? reject(error) : resolve(files || {}));
        }), 120000, 'ZIP 批量解压');
        const entries = Object.keys(decoded).map((name) => {
          const fixedName = fixMagicUploadZipEntryName(name);
          return {
            name: fixedName,
            dir: /\/$/.test(fixedName),
            bytes: decoded[name],
          };
        });
        magicUploadLog('info', 'ZIP 批量解压完成', sourceName + ' | 解码文件=' + entries.filter((entry) => !entry.dir).length + ' | 条目=' + entries.length);
        return entries;
      } catch (error) {
        const message = formatErrorMessage(error);
        if (/超时/.test(message)) throw error;
        magicUploadLog('warn', 'fflate 解压失败，回退 JSZip', sourceName + ' | ' + message);
      }
    } else {
      magicUploadLog('warn', '未找到 fflate，回退 JSZip', sourceName);
    }
    const Zip = getLazyExternalRuntime('jszip') || await ensureLazyExternalScript('jszip');
    const zip = await withMagicUploadTimeout(Zip.loadAsync(zipBuffer, { decodeFileName: decodeMagicUploadZipFileName }), 120000, 'ZIP 解析');
    const entries = Object.values(zip.files).map((entry) => ({
      name: entry.name,
      dir: Boolean(entry.dir),
      zipEntry: entry,
    }));
    magicUploadLog('info', 'ZIP JSZip 解析完成', sourceName + ' | 条目=' + entries.length);
    return entries;
  }

  async function processMagicUploadZipFiles(files) {
    if (!state.magicUploadAccessEnabled) {
      magicUploadLog('warn', '文件处理被拦截', '当前账号没有魔法上传权限');
      showToast('魔法上传暂未开放');
      return { added: 0, errors: ['魔法上传暂未开放'] };
    }
    const sourceFiles = (files || []).filter((file) => {
      if (!file || !/\.(?:zip|xlsx)$/i.test(file.name || '')) return false;
      const maxBytes = /\.zip$/i.test(file.name || '') ? MAGIC_UPLOAD_ARCHIVE_MAX_FILE_BYTES : MAGIC_UPLOAD_XLSX_MAX_FILE_BYTES;
      return Number(file.size || 0) <= maxBytes;
    })
      .sort((a, b) => Number(/\.xlsx$/i.test(b.name || '')) - Number(/\.xlsx$/i.test(a.name || '')));
    const oversizedFiles = (files || []).filter((file) => {
      if (!file || !/\.(?:zip|xlsx)$/i.test(file.name || '')) return false;
      const maxBytes = /\.zip$/i.test(file.name || '') ? MAGIC_UPLOAD_ARCHIVE_MAX_FILE_BYTES : MAGIC_UPLOAD_XLSX_MAX_FILE_BYTES;
      return Number(file.size || 0) > maxBytes;
    });
    if (oversizedFiles.length) magicUploadLog('warn', '文件超过入口限制', oversizedFiles.map((file) => file.name + '|' + Math.round(Number(file.size || 0) / 1024 / 1024) + 'MB').join('；') + ' | ZIP 上限=150MB；XLSX 上限=50MB');
    if (!sourceFiles.length) {
      magicUploadLog('warn', '没有识别到可处理文件', (files || []).map((file) => (file && ((file.name || '无文件名') + '|' + (file.type || '无类型'))) || '空').join('；'));
      showToast('请选择 ZIP 图包或 XLSX');
      return { added: 0, errors: ['请选择 ZIP 图包或 XLSX'] };
    }
    if (state.magicUploadProcessing) {
      magicUploadLog('warn', '忽略重复处理请求', '已有文件正在处理：' + (state.magicUploadProcessingText || '处理中'));
      showToast('已有文件正在处理，请等待当前任务完成');
      return { added: 0, errors: ['已有文件正在处理'] };
    }
    magicUploadLog('info', '开始处理文件', sourceFiles.map((file) => file.name + '|' + Math.round(Number(file.size || 0) / 1024) + 'KB').join('；'));
    state.magicUploadProcessing = true;
    state.magicUploadProcessingText = '正在准备读取 ' + sourceFiles.length + ' 个文件…';
    showToast(state.magicUploadProcessingText);
    const replacingId = state.magicUploadReplaceId;
    state.magicUploadReplaceId = '';
    state.magicUploadFileInputOpen = true;
    let addedTaskCount = 0;
    const processingErrors = [];
    const setProcessingText = (text, notify) => {
      state.magicUploadProcessingText = String(text || '正在处理文件…');
      updateMagicUploadProcessingNotice();
      if (notify) showToast(state.magicUploadProcessingText);
    };
    try {
      if (replacingId && sourceFiles[0]) {
        const oldTask = (state.magicUploadQueue || []).find((item) => item.id === replacingId);
        if (oldTask) {
          state.magicUploadQueue = state.magicUploadQueue.filter((item) => item.id !== replacingId);
          cleanupMagicUploadTaskFiles(oldTask, state.magicUploadQueue);
        }
      }
      renderShell();
      for (const zipFile of sourceFiles) {
        try {
          if (/\.xlsx$/i.test(zipFile.name || '')) {
            const duplicateXlsxTask = findMagicUploadDuplicateSourceTask('xlsx', zipFile.name, zipFile.size);
            if (duplicateXlsxTask) {
              magicUploadLog('warn', '跳过重复 XLSX', zipFile.name + ' | 队列中已存在相同推品资料，忽略本次拖入');
              showToast('已存在相同推品资料，已跳过：' + zipFile.name);
              continue;
            }
            setProcessingText('正在缓存 XLSX：' + zipFile.name, true);
            magicUploadLog('info', 'XLSX 开始本地缓存', zipFile.name + ' | bytes=' + Number(zipFile.size || 0));
            const skus = getMagicUploadSkusFromFileName(zipFile.name);
            const key = 'magic-upload:' + createMagicUploadId() + ':source.xlsx';
            await withMagicUploadTimeout(putUploadFile(key, cloneUploadFile(zipFile)), 120000, 'XLSX 本地缓存');
            magicUploadLog('info', 'XLSX 本地缓存完成', zipFile.name + ' | key=' + key);
            const additions = (skus.length ? skus : ['']).map((sku) => ({
              id: createMagicUploadId(), sku, sourceType: 'xlsx', sourceName: zipFile.name, zipName: '', zipKey: '', projectId: getProjectIdForMaterialApi(loadData(sku) || {}),
              files: [{ name: zipFile.name, key, size: Number(zipFile.size) || 0, category: '推品资料', archiveTypeId: 4, status: 'pending', error: '' }], status: sku ? 'pending' : 'waiting', step: sku ? '等待上传' : '请确认 SKU', error: '', totalBytes: Number(zipFile.size) || 0, createdAt: Date.now(), updatedAt: Date.now(),
            }));
            mergeMagicUploadTasks(additions);
            addedTaskCount += additions.length;
            magicUploadLog('info', 'XLSX 已加入队列', zipFile.name + ' | SKU=' + (skus.join(',') || '待确认'));
            showToast(zipFile.name + ' 已加入推品资料');
            renderShell();
            continue;
          }

          const duplicateZipTask = findMagicUploadDuplicateSourceTask('zip', zipFile.name, zipFile.size);
          if (duplicateZipTask) {
            magicUploadLog('warn', '跳过重复 ZIP', zipFile.name + ' | 队列中已存在相同图包，忽略本次拖入');
            showToast('已存在相同图包，已跳过：' + zipFile.name);
            continue;
          }
          setProcessingText('正在读取 ZIP：' + zipFile.name, true);
          magicUploadLog('info', 'ZIP 开始读取', zipFile.name + ' | bytes=' + Number(zipFile.size || 0) + ' | type=' + (zipFile.type || '无类型'));
          const zipBuffer = await withMagicUploadTimeout(readMagicUploadArrayBuffer(zipFile), 120000, 'ZIP 文件读取');
          magicUploadLog('info', 'ZIP 文件已读入内存', zipFile.name + ' | bytes=' + Number(zipBuffer && zipBuffer.byteLength || 0));
          setProcessingText('正在解析 ZIP：' + zipFile.name, true);
          const decodedEntries = await decodeMagicUploadZipEntries(zipBuffer, zipFile.name);
          const entries = decodedEntries.filter((entry) => entry && !entry.dir && entry.name && !/(^|\/)__MACOSX\//i.test(entry.name) && !isMagicUploadIgnoredEntry(entry.name));
          const ignoredCount = decodedEntries.filter((entry) => entry && !entry.dir && entry.name && isMagicUploadIgnoredEntry(entry.name)).length;
          if (ignoredCount) magicUploadLog('warn', 'ZIP 跳过忽略目录文件', zipFile.name + ' | 忽略=' + ignoredCount + ' 个（' + MAGIC_UPLOAD_IGNORE_DIRS.join('/') + '）');
          magicUploadLog('info', 'ZIP 文件清单完成', zipFile.name + ' | 可处理文件=' + entries.length);
          const fileSkus = getMagicUploadSkusFromFileName(zipFile.name);
          const allSkus = new Set(fileSkus);
          entries.forEach((entry) => getMagicUploadSkusFromFileName(entry.name).forEach((sku) => allSkus.add(sku)));
          const skus = Array.from(allSkus);
          const groups = new Map((skus.length ? skus : ['']).map((sku) => [sku, []]));
          let entryIndex = 0;
          for (const entry of entries) {
            entryIndex += 1;
            const innerSkus = getMagicUploadSkusFromFileName(entry.name);
            const targetSkus = innerSkus.length ? innerSkus : (skus.length ? skus : ['']);
            const entryName = entry.name.split('/').pop() || 'asset';
            setProcessingText('正在解压 ZIP（' + entryIndex + '/' + entries.length + '）：' + entryName, false);
            magicUploadLog('info', 'ZIP 开始处理文件', zipFile.name + ' | ' + entryIndex + '/' + entries.length + ' | ' + entry.name);
            const buffer = entry.bytes || await withMagicUploadTimeout(entry.zipEntry.async('arraybuffer'), 120000, 'ZIP 文件解压');
            magicUploadLog('info', 'ZIP 文件已完成解压', zipFile.name + ' | ' + entryIndex + '/' + entries.length + ' | ' + entry.name + ' | bytes=' + Number(buffer && buffer.byteLength || buffer && buffer.length || 0));
            const file = new File([buffer], entryName, { type: guessMime(entry.name) });
            const key = 'magic-upload:' + createMagicUploadId() + ':' + entry.name;
            magicUploadLog('info', 'ZIP 开始缓存文件', zipFile.name + ' | ' + entryIndex + '/' + entries.length + ' | ' + entry.name + ' | bytes=' + Number(buffer && buffer.byteLength || 0));
            await withMagicUploadTimeout(putUploadFile(key, file), 120000, '素材本地缓存');
            const category = classifyMagicUploadName(entry.name);
            const rule = getMagicUploadRule(category, getMagicUploadFileExtension(entry.name));
            targetSkus.forEach((sku) => {
              if (!groups.has(sku)) groups.set(sku, []);
              groups.get(sku).push({ name: entry.name, key, size: Number(file.size) || 0, category, archiveTypeId: rule ? rule.archiveTypeId : 0, status: 'pending', error: '' });
            });
            magicUploadLog('info', 'ZIP 文件已缓存', zipFile.name + ' | ' + entryIndex + '/' + entries.length + ' | ' + entry.name + ' | 分类=' + category + ' | SKU=' + (targetSkus.join(',') || '待确认'));
            updateMagicUploadProcessingNotice();
          }
          setProcessingText('正在保留原始 ZIP：' + zipFile.name, true);
          const zipKey = 'magic-upload:' + createMagicUploadId() + ':source.zip';
          await withMagicUploadTimeout(putUploadFile(zipKey, cloneUploadFile(zipFile)), 120000, '原始 ZIP 本地缓存');
          magicUploadLog('info', '原始 ZIP 已缓存', zipFile.name + ' | key=' + zipKey + ' | 将上传到图包素材');
          const additions = Array.from(groups.entries()).map(([sku, group]) => ({
            id: createMagicUploadId(), sku, zipName: zipFile.name, zipKey, sourceSize: Number(zipFile.size) || 0, projectId: getProjectIdForMaterialApi(loadData(sku) || {}), files: group,
            status: group.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending', step: group.some((entry) => entry.category === '待确认') ? '请确认文件分类' : '等待上传', error: '', createdAt: Date.now(), updatedAt: Date.now(),
          }));
          mergeMagicUploadTasks(additions);
          addedTaskCount += additions.length;
          magicUploadLog('info', 'ZIP 识别完成', zipFile.name + ' | 文件=' + entries.length + ' | SKU=' + (skus.join(',') || '待确认') + ' | 任务=' + additions.length);
          showToast(zipFile.name + ' 已识别 ' + additions.length + ' 个任务');
          renderShell();
        } catch (error) {
          const message = formatErrorMessage(error);
          processingErrors.push(zipFile.name + '：' + message);
          magicUploadLog('warn', '图包处理失败', zipFile.name + ' | ' + message);
          showToast('图包处理失败：' + message);
        }
      }
    } finally {
      state.magicUploadFileInputOpen = false;
      state.magicUploadProcessing = false;
      state.magicUploadProcessingText = '';
      magicUploadLog('info', '文件处理结束', '当前队列=' + (state.magicUploadQueue || []).length);
      renderShell();
    }
    return { added: addedTaskCount, errors: processingErrors };
  }

  function findMagicUploadDuplicateSourceTask(sourceType, fileName, fileSize) {
    const isZip = sourceType === 'zip';
    return (state.magicUploadQueue || []).find((task) => task && task.status !== 'success' &&
      (isZip ? task.zipKey : (!task.zipKey && task.sourceType === 'xlsx')) &&
      String(isZip ? (task.zipName || '') : (task.sourceName || '')) === String(fileName || '') &&
      Math.abs((Number(isZip ? task.sourceSize : task.totalBytes) || 0) - (Number(fileSize) || 0)) < 16) || null;
  }

  function mergeMagicUploadTasks(additions) {
    const queue = state.magicUploadQueue || [];
    const affectedTasks = [];
    (additions || []).forEach((addition) => {
      const existing = addition.sku && queue.find((task) => task.sku === addition.sku && task.status !== 'success');
      if (existing) {
        const existingKeys = new Set((existing.files || []).map((entry) => String(entry && entry.name || '') + '|' + Number(entry && entry.size) || 0));
        const freshFiles = (addition.files || []).filter((entry) => !existingKeys.has(String(entry && entry.name || '') + '|' + Number(entry && entry.size) || 0));
        existing.files = (existing.files || []).concat(freshFiles);
        if (addition.zipKey) {
          existing.zipKey = addition.zipKey;
          existing.zipName = addition.zipName;
          existing.sourceSize = Number(addition.sourceSize) || existing.sourceSize || 0;
          existing.sourceType = 'zip';
          existing.sourceName = addition.zipName;
        }
        existing.status = existing.files.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending';
        existing.step = existing.status === 'waiting' ? '请确认文件分类' : '等待上传';
        existing.submitted = false;
        existing.draftSaved = false;
        existing.updatedAt = Date.now();
        affectedTasks.push(existing);
      } else {
        addition.replacementCheckStatus = addition.sku ? 'checking' : 'idle';
        addition.replaceCategories = [];
        addition.existingFileVersionIds = {};
        addition.existingFiles = {};
        queue.push(addition);
        affectedTasks.push(addition);
      }
    });
    state.magicUploadQueue = queue.slice(-300);
    saveMagicUploadQueue(state.magicUploadQueue);
    scheduleMagicUploadReplacementChecks(affectedTasks);
  }

  function magicUploadStatusLabel(task) {
    if (!task) return '';
    if (task.status === 'success') return '上传并提审完成';
    if (task.status === 'processing') return task.step || '上传中';
    if (task.status === 'waiting') return task.step || '待确认';
    if (task.status === 'error') return task.error || '上传失败';
    return task.step || '等待上传';
  }

  function getMagicUploadTaskCategories(task) {
    const categories = (task && task.files || [])
      .map((entry) => String(entry && entry.category || ''))
      .filter((category) => category && category !== '待确认' && MAGIC_UPLOAD_ATTRIBUTE_VARIABLES[category]);
    if (task && task.zipKey) categories.push('图包素材');
    return Array.from(new Set(categories));
  }

  function getMagicUploadReplacementSnapshot(task, contentPayload) {
    const values = flattenMagicUploadProductAttributes(contentPayload);
    const existingFileVersionIds = Object.create(null);
    const categories = [];
    getMagicUploadTaskCategories(task).forEach((category) => {
      const target = findMagicUploadProductAttribute(values, category);
      if (!target) return;
      const ids = magicUploadDraftValueList(target.value)
        .map((value) => normalizeMagicUploadFileVersionValue(value))
        .filter((value) => value !== null);
      if (!ids.length) return;
      existingFileVersionIds[category] = Array.from(new Set(ids.map((value) => String(value))));
      categories.push(category);
    });
    return { categories, existingFileVersionIds, existingFiles: Object.create(null) };
  }

  async function fetchMagicUploadArchiveFiles(ids) {
    const normalizedIds = Array.from(new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));
    if (!normalizedIds.length) return [];
    let lastError = null;
    for (const endpoint of ['/api/ProjectFormData/GetArchiveFileVersionListByFileVersionId', '/api/Product/GetArchiveFileVersionListByFileVersionId']) {
      try {
        const payload = await fetchPlmApiJson(endpoint, { ids: normalizedIds });
        const data = payload && payload.data;
        return Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : []);
      } catch (error) {
        lastError = error;
        if (/\b401\b|\b403\b/.test(formatErrorMessage(error))) throw error;
      }
    }
    throw lastError || new Error('无法读取现有归档文件信息');
  }

  function attachMagicUploadArchiveFiles(snapshot, records) {
    const byId = Object.create(null);
    (records || []).forEach((record) => {
      const id = record && (record.archive_file_version_id || record.file_version_id || record.id);
      if (id !== undefined && id !== null) byId[String(id)] = {
        id: String(id),
        name: String(record.file_name || record.file_original_name || ''),
        path: String(record.file_path || record.file_save_full_path || ''),
      };
    });
    Object.keys(snapshot.existingFileVersionIds || {}).forEach((category) => {
      snapshot.existingFiles[category] = (snapshot.existingFileVersionIds[category] || []).map((id) => byId[String(id)] || { id: String(id), name: '', path: '' });
    });
    return snapshot;
  }

  function getMagicUploadProductReviewStatus(product) {
    const candidates = ['audit_status_format', 'auditStatusFormat', 'review_status_format', 'reviewStatusFormat', 'audit_status_name', 'auditStatusName', 'review_status_name', 'reviewStatusName', 'product_status_format', 'productStatusFormat', 'status_format', 'statusFormat', 'status_name', 'statusName'];
    const statuses = ['\u5f85\u5ba1\u6838', '\u5ba1\u6838\u4e2d', '\u5df2\u5ba1\u6838', '\u5df2\u62d2\u7edd', '\u5df2\u4f5c\u5e9f', '\u5df2\u5b8c\u6210', '\u8349\u7a3f'];
    for (const key of candidates) {
      const value = compactText(product && product[key]);
      if (!value) continue;
      const status = statuses.find((item) => value === item || value.includes(item));
      if (status) return status;
    }
    return '';
  }

  function applyMagicUploadReplacementSnapshot(task, snapshot, status, errorMessage) {
    if (!task) return;
    task.replaceCategories = Array.isArray(snapshot && snapshot.categories) ? snapshot.categories.slice() : [];
    task.existingFileVersionIds = snapshot && snapshot.existingFileVersionIds || {};
    task.existingFiles = snapshot && snapshot.existingFiles || {};
    task.replacementCheckStatus = status || 'ready';
    task.replacementCheckError = String(errorMessage || '');
    task.replacementCheckedAt = status === 'ready' ? Date.now() : (Number(task.replacementCheckedAt) || 0);
    task.updatedAt = Date.now();
  }

  async function refreshMagicUploadTaskReplacement(task, token) {
    if (!task || !task.sku) return;
    const context = await resolveMagicUploadProductContext(task);
    const categoryId = context.categoryId;
    if (!categoryId) throw new Error('商品缺少 category_id，无法查询现有图片');
    const contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=false&product_id=' + encodeURIComponent(context.productId) + '&product_version_id=' + encodeURIComponent(context.productVersionId) + '&category_id=' + encodeURIComponent(categoryId));
    const snapshot = getMagicUploadReplacementSnapshot(task, contentPayload);
    const ids = Object.keys(snapshot.existingFileVersionIds || {}).flatMap((category) => snapshot.existingFileVersionIds[category] || []);
    if (ids.length) {
      try {
        const records = await fetchMagicUploadArchiveFiles(ids);
        attachMagicUploadArchiveFiles(snapshot, records);
      } catch (error) {
        magicUploadLog('warn', '现有图片名称读取失败，仍保留替换判断', task.sku + ' | ' + formatErrorMessage(error));
      }
    }
    const liveTask = (state.magicUploadQueue || []).find((item) => item && item.id === task.id);
    if (!liveTask || (token && liveTask.replacementCheckToken !== token)) return;
    if (context.productReviewStatus && context.productReviewStatus !== '\u5f85\u5ba1\u6838') {
      const statusMessage = '\u5f53\u524d\u4ea7\u54c1\u4e3a' + context.productReviewStatus + '\uff0c\u4e0d\u662f\u5f85\u5ba1\u6838\u72b6\u6001';
      liveTask.status = 'waiting';
      liveTask.step = '\u5df2\u8df3\u8fc7：' + statusMessage;
      liveTask.error = statusMessage;
      applyMagicUploadReplacementSnapshot(liveTask, snapshot, 'blocked', statusMessage);
      saveMagicUploadQueue(state.magicUploadQueue);
      if (state.view === 'magicUpload') renderShell();
      magicUploadLog('info', '\u73b0\u6709\u56fe\u7247\u68c0\u67e5\u540c\u6b65\u53d1\u73b0\u4ea7\u54c1\u72b6\u6001', task.sku + ' | ' + context.productReviewStatus);
      return;
    }
    applyMagicUploadReplacementSnapshot(liveTask, snapshot, 'ready', '');
    saveMagicUploadQueue(state.magicUploadQueue);
    if (state.view === 'magicUpload') renderShell();
    magicUploadLog('info', '现有图片检查完成', task.sku + ' | ' + (snapshot.categories.length ? '替换=' + snapshot.categories.join('、') : '没有同分类旧文件'));
  }

  function scheduleMagicUploadReplacementChecks(tasks) {
    const uniqueTasks = Array.from(new Map((tasks || []).filter((task) => task && task.id).map((task) => [task.id, task])).values());
    let changed = false;
    uniqueTasks.forEach((task) => {
      if (!task.sku) {
        task.replacementCheckStatus = 'idle';
        task.replaceCategories = [];
        return;
      }
      const token = createMagicUploadId();
      task.replacementCheckToken = token;
      task.replacementCheckStatus = 'checking';
      task.replacementCheckError = '';
      task.updatedAt = Date.now();
      changed = true;
      Promise.resolve().then(() => refreshMagicUploadTaskReplacement(task, token)).catch((error) => {
        const liveTask = (state.magicUploadQueue || []).find((item) => item && item.id === task.id);
        if (!liveTask || liveTask.replacementCheckToken !== token) return;
        liveTask.replacementCheckStatus = 'error';
        liveTask.replacementCheckError = formatErrorMessage(error);
        liveTask.updatedAt = Date.now();
        saveMagicUploadQueue(state.magicUploadQueue);
        if (state.view === 'magicUpload') renderShell();
        magicUploadLog('warn', '现有图片检查失败', task.sku + ' | ' + liveTask.replacementCheckError);
      });
    });
    if (changed) saveMagicUploadQueue(state.magicUploadQueue);
  }

  function magicUploadReplacementSummary(task) {
    const status = String(task && task.replacementCheckStatus || '');
    if (status === 'checking') return '正在查询当前图片…';
    if (status === 'blocked') return task.replacementCheckError || task.error || '当前产品状态不允许提审';
    if (status === 'error') return '开始时会重新查询当前图片';
    const categories = Array.isArray(task && task.replaceCategories) ? task.replaceCategories : [];
    if (!categories.length) return '新增任务';
    const count = categories.reduce((sum, category) => sum + ((task.existingFileVersionIds && task.existingFileVersionIds[category]) || []).length, 0);
    const names = categories.flatMap((category) => (task.existingFiles && task.existingFiles[category] || []).map((file) => file && file.name || '')).filter(Boolean);
    const nameText = names.length ? '：' + names.slice(0, 2).join('、') + (names.length > 2 ? '…' : '') : '';
    return '替换 ' + categories.join('、') + (count ? ' · 现有 ' + count + ' 个文件' : '') + nameText;
  }

  function magicUploadCategorySummary(task) {
    const counts = new Map();
    (Array.isArray(task && task.files) ? task.files : []).forEach((entry) => {
      const category = String(entry && entry.category || '待确认');
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return MAGIC_UPLOAD_CATEGORY_DISPLAY_ORDER
      .filter((category) => counts.has(category))
      .map((category) => (MAGIC_UPLOAD_CATEGORY_DISPLAY_LABELS[category] || category) + counts.get(category))
      .concat(Array.from(counts.keys())
        .filter((category) => !MAGIC_UPLOAD_CATEGORY_DISPLAY_ORDER.includes(category))
        .map((category) => category + counts.get(category)))
      .join(' · ');
  }

  function magicToyLabelReplacementSummary(task) {
    const status = String(task && task.replacementCheckStatus || 'idle');
    if (status === 'checking') return '正在查询当前 BOM 标签图…';
    if (status === 'error') return '开始时会重新查询当前 BOM 标签图';
    if (status === 'idle') return '待检查当前 BOM 标签图';
    const count = Array.isArray(task && task.existingImagePaths) ? task.existingImagePaths.length : 0;
    return count ? '替换任务 · 现有 ' + count + ' 张标签图' : '新增任务';
  }

  function magicToyLabelViewHtml(modeTabs) {
    const queue = Array.isArray(state.magicToyLabelQueue) ? state.magicToyLabelQueue : [];
    const uncheckedTasks = queue.filter((task) => task && (task.status === 'pending' || task.status === 'error') && (!task.replacementCheckStatus || task.replacementCheckStatus === 'idle'));
    if (uncheckedTasks.length) scheduleMagicToyLabelReplacementChecks(uncheckedTasks);
    const running = Boolean(state.magicToyLabelRunning);
    const pendingCount = queue.filter((task) => task.status === 'pending' || task.status === 'error').length;
    const errorCount = queue.filter((task) => task.status === 'error').length;
    const successCount = queue.filter((task) => task.status === 'success').length;
    const activeCount = queue.filter((task) => task.status === 'processing').length;
    const history = Array.isArray(state.magicToyLabelHistory) ? state.magicToyLabelHistory : [];
    const historyOpen = Boolean(state.magicToyLabelHistoryOpen);
    const rows = queue.length ? queue.map((task) => {
      const progress = Math.round((task.status === 'success' ? 1 : Math.min(1, Math.max(0, Number(task.progress) || 0))) * 100);
      const statusClass = task.status === 'success' ? 'is-success' : (task.status === 'error' ? 'is-error' : '');
      const statusText = magicToyLabelStatusLabel(task);
      const title = task.name || '标签尺寸说明图';
      const replacementStatus = String(task.replacementCheckStatus || 'idle');
      const existingImageCount = Array.isArray(task.existingImagePaths) ? task.existingImagePaths.length : 0;
      const replacementBadge = replacementStatus === 'checking' ? '<span class="pfh-magic-file-badge is-checking">检查现有图</span>' : (existingImageCount ? '<span class="pfh-magic-file-badge is-replace">替换任务</span>' : '');
      const taskClass = statusClass + (existingImageCount ? ' is-replace' : '');
      const stageText = task.status === 'pending' || task.status === 'waiting' ? magicToyLabelReplacementSummary(task) : (task.step || statusText);
      const dimension = '4 × 3 cm';
      return '<article class="pfh-magic-task ' + taskClass + '" data-magic-toy-label-id="' + escapeHtml(task.id) + '"><div class="pfh-magic-task-main"><div class="pfh-magic-task-icon">✦</div><div class="pfh-magic-task-copy"><div class="pfh-magic-task-title"><span class="pfh-magic-sku-text" title="' + escapeHtml(task.sku) + '">' + escapeHtml(task.sku) + '</span><span class="pfh-magic-task-source" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</span><span class="pfh-magic-file-badge">PNG</span>' + replacementBadge + '</div><div class="pfh-magic-task-meta"><span>' + escapeHtml(task.materialCode || '标签物料待匹配') + '</span><span>' + escapeHtml(dimension) + '</span></div><div class="pfh-magic-stage" data-magic-stage>' + escapeHtml(stageText) + '</div><div class="pfh-magic-progress-line"><div class="pfh-magic-progress-track"><div class="pfh-magic-progress-bar" data-magic-progress-bar style="width:' + progress + '%"></div></div></div></div><div class="pfh-magic-task-side"><button type="button" class="pfh-magic-task-delete" data-action="magic-toy-label-remove" data-magic-toy-label-id="' + escapeHtml(task.id) + '">删除</button>' + (task.status === 'error' ? '<button type="button" class="pfh-magic-task-delete" data-action="magic-toy-label-retry" data-magic-toy-label-id="' + escapeHtml(task.id) + '">重试</button>' : '') + '<strong class="pfh-magic-progress-value" data-magic-progress-value>' + progress + '%</strong><span class="pfh-magic-status ' + statusClass + '" title="' + escapeHtml(statusText) + '">' + escapeHtml(statusText) + '</span></div></div></article>';
    }).join('') : taskEmptyStateHtml('标签队列暂无任务', '在上方粘贴 SKU，生成带产品图、条码和尺寸标注的标签说明图');
    const historyHtml = historyOpen ? '<div class="pfh-magic-history-modal" data-action="magic-toy-label-history-close"><section class="pfh-magic-history-dialog" role="dialog" aria-modal="true" aria-label="玩具标签历史"><header><span>' + iconHtml('history') + ' 玩具标签历史 · ' + history.length + ' 条</span><button type="button" data-action="magic-toy-label-history-close">×</button></header><div class="pfh-magic-history-list">' + (history.length ? history.slice(0, 40).map((entry) => '<div class="pfh-magic-history-item"><div><strong>' + escapeHtml(entry.sku || '待确认 SKU') + ' · ' + escapeHtml(entry.status === 'success' ? '成功' : '失败') + '</strong><span>' + escapeHtml(entry.name || '标签尺寸说明图') + ' · ' + escapeHtml(entry.materialCode || '标签物料') + ' · ' + escapeHtml(entry.finishedAt ? new Date(entry.finishedAt).toLocaleString() : '') + '</span></div>' + (entry.status === 'success' ? '' : '<button type="button" data-action="magic-toy-label-history-retry" data-magic-toy-label-history-id="' + escapeHtml(entry.id) + '">' + iconHtml('refresh') + '恢复</button>') + '</div>').join('') : '<div class="pfh-magic-history-empty">还没有玩具标签历史</div>') + '</div></section></div>' : '';
    const activity = queue.filter((task) => task.status === 'processing' || task.status === 'success' || task.status === 'error').slice(0, 3);
    const activityHtml = activity.length ? activity.map((task) => '<p><i></i><span>' + escapeHtml(task.sku + ' · ' + magicToyLabelStatusLabel(task)) + '</span></p>').join('') : '<p><i></i><span>' + escapeHtml(state.magicToyLabelStatus || '等待 SKU 进入队列') + '</span></p>';
    return '<div class="pfh-detail-scroll"><section class="pfh-magic-page"><div class="pfh-magic-canvas"><div class="pfh-magic-lab-head"><div class="pfh-magic-head-left"><button type="button" class="pfh-upload-back pfh-magic-back" data-action="home-back" aria-label="返回主页">' + iconHtml('back') + '</button><h1 class="pfh-magic-lab-title">魔法上传 <em>BETA</em></h1></div><span class="pfh-magic-pipeline">TOY LABEL FLOW</span></div>' + modeTabs + '<section class="pfh-magic-overview"><h3>运行概览</h3><div class="pfh-magic-stats"><div class="pfh-magic-stat"><span>当前任务</span><strong>' + String(activeCount).padStart(2, '0') + '</strong></div><div class="pfh-magic-stat"><span>已写入 BOM</span><strong>' + successCount + '/' + queue.length + '</strong></div><div class="pfh-magic-stat"><span>待处理/失败</span><strong>' + pendingCount + '/' + errorCount + '</strong></div><div class="pfh-magic-stat"><span>运行状态</span><strong>' + (running ? 'ON' : '--') + '</strong></div></div><div class="pfh-magic-activity"><h3>实时动态</h3>' + activityHtml + '</div></section><section class="pfh-magic-toy-label-form"><div class="pfh-magic-toy-label-form-head"><div><b>批量输入 SKU</b><span>每行一个，也支持空格、逗号或分号分隔</span></div><strong>尺寸图 → OSS → BOM 写入</strong></div><textarea class="pfh-magic-toy-label-input" rows="4" placeholder="SKU12345678\nSKU12345679">' + escapeHtml(state.magicToyLabelInput || '') + '</textarea><p class="pfh-magic-toy-label-hint">玩具标签固定按宽4×高3cm生成，不读取 BOM 或普通印刷尺寸；生成 3000×3000 PNG 后，按 HAR 中的 upload_file_type 40 上传，并回写对应标签物料。</p></section><div class="pfh-magic-actions"><button type="button" class="is-primary" data-action="magic-toy-label-add">加入队列</button><button type="button" class="is-primary" data-action="magic-toy-label-start"' + (running || !pendingCount ? ' disabled' : '') + '>' + iconHtml('upload') + '开始生成并上传</button><button type="button" data-action="magic-toy-label-pause"' + (!running ? ' disabled' : '') + '>' + iconHtml(running ? 'pause' : 'play') + (running ? '暂停' : '继续') + '</button><button type="button" data-action="magic-toy-label-clear"' + (!queue.length ? ' disabled' : '') + '>清空队列</button><button type="button" class="pfh-magic-history-toggle" data-action="magic-toy-label-history-toggle">' + iconHtml('history') + '历史</button></div><div class="pfh-magic-queue-head"><b>玩具标签队列</b><span>' + queue.length + ' 个 SKU · 后台写入标签物料</span></div><div class="pfh-magic-queue">' + rows + '</div>' + historyHtml + '</div></section></div>';
  }

  function magicUploadViewHtml() {
    if (!state.magicUploadAccessEnabled) return '<div class="pfh-detail-scroll"><section class="pfh-magic-page is-locked"><div class="pfh-magic-canvas"><div class="pfh-magic-lab-head"><div class="pfh-magic-head-left"><button type="button" class="pfh-upload-back pfh-magic-back" data-action="home-back" aria-label="返回主页">' + iconHtml('back') + '</button><h1 class="pfh-magic-lab-title">魔法上传 <em>BETA</em></h1></div><span class="pfh-magic-pipeline">后台流程</span></div><div class="pfh-magic-main-card"><div class="pfh-magic-hero"><div><small>MAGIC UPLOAD / AURORA GLASS</small><h2>极光投放</h2><p>' + escapeHtml(state.magicUploadAccessLoading ? '正在检查权限…' : '该功能暂未开放，请联系管理员开通。') + '</p></div></div></div></div></section></div>';
    const magicMode = state.magicUploadMode === 'effect' ? 'effect' : (state.magicUploadMode === 'toy-label' ? 'toy-label' : 'package');
    const modeTabs = '<div class="pfh-magic-mode-tabs ' + (magicMode === 'effect' ? 'is-effect' : (magicMode === 'toy-label' ? 'is-toy-label' : '')) + '" data-active-mode="' + magicMode + '"><i class="pfh-magic-mode-indicator" aria-hidden="true"></i><button type="button" data-action="magic-upload-mode" data-magic-mode="package" class="' + (magicMode === 'package' ? 'is-active' : '') + '">图包上传</button><button type="button" data-action="magic-upload-mode" data-magic-mode="effect" class="' + (magicMode === 'effect' ? 'is-active' : '') + '">效果图</button><button type="button" data-action="magic-upload-mode" data-magic-mode="toy-label" class="' + (magicMode === 'toy-label' ? 'is-active' : '') + '">玩具标签</button></div>';
    if (magicMode === 'toy-label') return magicToyLabelViewHtml(modeTabs);
    if (magicMode === 'effect') {
      const uploadQueue = loadUploadQueue();
      const queue = uploadQueue.filter((item) => item.kind === 'toy-effect' && !/\u6210\u529f/.test(item.status || ''));
      const effectHistory = loadUploadHistory().filter((item) => item.kind === 'toy-effect');
      const effectHistoryOpen = Boolean(state.magicEffectHistoryOpen);
      const manualPacking = normalizeManualToyEffectPacking(state.manualToyEffectPacking);
      const manualPackingSummary = manualToyEffectPackingSummary(manualPacking);
      const manualPackingModal = state.manualToyEffectPackingOpen ? '<div class="pfh-magic-history-modal pfh-manual-effect-packing-modal" data-action="magic-effect-packing-close"><section class="pfh-magic-history-dialog" role="dialog" aria-modal="true" aria-label="手动产品装箱信息"><header><span>手动产品提审设置</span><button type="button" data-action="magic-effect-packing-close" aria-label="关闭">×</button></header><div class="pfh-magic-history-list" style="display:grid;gap:12px;padding:16px 17px 18px"><p style="margin:0;color:#8990a6;font-size:11px;line-height:1.5">仅手动添加的产品效果图提审会使用这里的值；BOM 设计任务不受影响。</p><label style="display:grid;gap:6px;color:#1d2232;font-size:11px">装箱数（标准装箱数）<input type="number" min="1" max="10000" step="1" data-manual-toy-effect-packing-field="standardPackingQuantity" value="' + escapeHtml(manualPacking.standardPackingQuantity) + '" placeholder="例如 5" style="width:100%;box-sizing:border-box;border:1px solid rgba(112,86,232,.18);border-radius:10px;background:#fff;color:#1d2232;padding:9px 10px;outline:none"></label><label style="display:grid;gap:6px;color:#1d2232;font-size:11px">总重 / 箱重（kg）<input type="number" min="0.001" max="10000" step="0.01" data-manual-toy-effect-packing-field="boxWeight" value="' + escapeHtml(manualPacking.boxWeight) + '" placeholder="例如 1.13" style="width:100%;box-sizing:border-box;border:1px solid rgba(112,86,232,.18);border-radius:10px;background:#fff;color:#1d2232;padding:9px 10px;outline:none"></label><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:2px"><button type="button" data-action="magic-effect-packing-close" style="min-height:34px;border:0;border-radius:10px;background:rgba(29,34,50,.07);color:#1d2232;padding:7px 12px;font-size:11px;cursor:pointer">取消</button><button type="button" class="is-primary" data-action="magic-effect-packing-save" style="min-height:34px;border:0;border-radius:10px;background:linear-gradient(135deg,#7056e8,#4636a8);color:#fff;padding:7px 12px;font-size:11px;cursor:pointer">保存设置</button></div></div></section></div>' : '';
      const running = loadUploadWorkerRunning('toy-effect');
      const totalFiles = queue.reduce((sum, item) => sum + getToyEffectUploadEntries(item).length, 0);
      const doneCount = effectHistory.filter((item) => /成功/.test(item.status || '')).length;
      const waitingCount = queue.filter((item) => !isUploadItemReady(item)).length;
      const errorCount = queue.filter((item) => /失败/.test(item.status || '')).length;
      const rows = queue.length ? queue.map((item) => {
        const files = getToyEffectUploadEntries(item);
        const statusText = item.step || item.status || '等待上传';
        const progress = /成功/.test(item.status || '') ? 100 : (/进行中/.test(item.status || '') ? 45 : 0);
        const statusClass = /失败/.test(item.status || '') ? 'is-error' : (/成功/.test(item.status || '') ? 'is-success' : '');
        return '<article class="pfh-magic-task ' + statusClass + '"><div class="pfh-magic-task-main"><div class="pfh-magic-task-icon">✦</div><div class="pfh-magic-task-copy"><div class="pfh-magic-task-title"><span class="pfh-magic-sku-text" title="' + escapeHtml(item.sku || '待确认 SKU') + '">' + escapeHtml(item.sku || '待确认 SKU') + '</span><span class="pfh-magic-task-source" title="' + escapeHtml(getUploadDisplayName(item) || item.name || '') + '">' + escapeHtml(getUploadDisplayName(item) || item.name || '效果图任务') + '</span><span class="pfh-magic-file-badge">' + files.length + ' 张图</span></div><div class="pfh-magic-task-meta"><span>效果图</span><span>商品草稿 / BOM API + OSS</span></div><div class="pfh-magic-progress-line"><div class="pfh-magic-progress-track"><div class="pfh-magic-progress-bar" style="width:' + progress + '%"></div></div></div></div><div class="pfh-magic-task-side"><button type="button" class="pfh-magic-task-delete" data-action="upload-remove" data-upload-id="' + escapeHtml(item.id) + '">删除</button>' + (/失败/.test(item.status || '') ? '<button type="button" class="pfh-magic-task-delete" data-action="magic-effect-retry" data-upload-id="' + escapeHtml(item.id) + '">重试</button>' : '') + '<strong class="pfh-magic-progress-value">' + progress + '%</strong><span class="pfh-magic-status ' + statusClass + '" title="' + escapeHtml(statusText) + '">' + escapeHtml(statusText) + '</span></div></div></article>';
      }).join('') : taskEmptyStateHtml('效果图队列暂无任务', '拖入 JPG / PNG 效果图，按文件名或 SKU 自动匹配商品后上传到 BOM 效果图');
      const effectHistoryHtml = effectHistoryOpen ? '<div class="pfh-magic-history-modal" data-action="magic-effect-history-close"><section class="pfh-magic-history-dialog" role="dialog" aria-modal="true" aria-label="效果图历史"><header><span>' + iconHtml('history') + ' 效果图历史 · ' + effectHistory.length + ' 条</span><button type="button" data-action="magic-effect-history-close">×</button></header><div class="pfh-magic-history-list">' + (effectHistory.length ? effectHistory.slice(0, 40).map((entry) => { const detail = entry.step || entry.skipReason || ''; return '<div class="pfh-magic-history-item"><div><strong>' + escapeHtml(entry.sku || '待确认 SKU') + ' · ' + escapeHtml(entry.status || '已完成') + '</strong><span title="' + escapeHtml(detail) + '">' + escapeHtml(entry.name || entry.sourceName || '效果图任务') + ' · ' + getToyEffectUploadEntries(entry).length + ' 张 · ' + escapeHtml(entry.completedAt || entry.updatedAt || '') + (detail ? ' · ' + escapeHtml(detail) : '') + '</span></div></div>'; }).join('') : '<div class="pfh-magic-history-empty">还没有效果图历史</div>') + '</div></section></div>' : '';
      return '<div class="pfh-detail-scroll"><section class="pfh-magic-page"><div class="pfh-magic-canvas"><div class="pfh-magic-lab-head"><div class="pfh-magic-head-left"><button type="button" class="pfh-upload-back pfh-magic-back" data-action="home-back" aria-label="返回主页">' + iconHtml('back') + '</button><h1 class="pfh-magic-lab-title">魔法上传 <em>BETA</em></h1></div><span class="pfh-magic-pipeline">PRODUCT / BOM EFFECT API</span></div>' + modeTabs + '<section class="pfh-magic-overview"><h3>运行概览</h3><div class="pfh-magic-stats"><div class="pfh-magic-stat"><span>当前任务</span><strong>' + String(queue.length).padStart(2, '0') + '</strong></div><div class="pfh-magic-stat"><span>效果图</span><strong>' + totalFiles + '</strong></div><div class="pfh-magic-stat"><span>待确认/失败</span><strong>' + waitingCount + '/' + errorCount + '</strong></div><div class="pfh-magic-stat"><span>运行状态</span><strong>' + (running ? 'ON' : '--') + '</strong></div><div class="pfh-magic-stat"><span>已完成</span><strong>' + doneCount + '</strong></div></div><div class="pfh-magic-activity"><h3>实时动态</h3><p><i></i><span>' + escapeHtml(state.toyEffectMatchStatus || '等待效果图进入队列') + '</span></p></div></section><div class="pfh-upload-drop pfh-magic-upload-drop" data-action="upload-pick" data-upload-drop="magic-effect" tabindex="0" role="button" aria-label="拖入 JPG 或 PNG 效果图"><div><span class="pfh-magic-drop-icon">' + iconHtml('image') + '</span><strong>拖入效果图</strong><span>JPG / PNG / BMP · 手动商品保存到商品图片，设计任务保存到 BOM 效果图</span></div></div><input class="pfh-upload-file pfh-magic-effect-file" data-upload-kind="magic-effect" type="file" multiple accept=".jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp" hidden><div class="pfh-magic-actions"><button type="button" class="is-primary" data-action="magic-effect-start"' + (running || !queue.some(isUploadItemReady) ? ' disabled' : '') + '>' + iconHtml('upload') + '开始上传</button><button type="button" data-action="magic-effect-pause"' + (!running ? ' disabled' : '') + '>' + iconHtml(running ? 'pause' : 'play') + (running ? '暂停' : '继续') + '</button><button type="button" data-action="magic-effect-clear"' + (!queue.length ? ' disabled' : '') + '>清空队列</button><button type="button" data-action="magic-effect-packing-open">手动设置装箱数/总重</button><span style="align-self:center;color:#8990a6;font-size:10px;white-space:nowrap" title="仅手动产品使用">' + escapeHtml(manualPackingSummary) + '</span><button type="button" class="pfh-magic-history-toggle" data-action="magic-effect-history-toggle">' + iconHtml('history') + '上传历史</button></div><div class="pfh-magic-queue-head"><b>效果图队列</b><span>' + queue.length + ' 个商品 · ' + totalFiles + ' 张图</span></div><div class="pfh-magic-queue">' + rows + '</div>' + effectHistoryHtml + manualPackingModal + '</div></section></div>';
    }
    const queue = state.magicUploadQueue || [];
    const running = Boolean(state.magicUploadRunning);
    const pendingCount = queue.filter((task) => task.status === 'pending' || task.status === 'error').length;
    const history = Array.isArray(state.magicUploadHistory) ? state.magicUploadHistory : [];
    const historyOpen = Boolean(state.magicUploadHistoryOpen);
    const totalFiles = queue.reduce((sum, task) => sum + getMagicUploadTaskFileCount(task), 0);
    const doneFiles = queue.reduce((sum, task) => sum + getMagicUploadTaskDoneFileCount(task), 0);
    const activeCount = queue.filter((task) => task.status === 'processing').length;
    const waitingCount = queue.filter((task) => task.status === 'waiting').length;
    const errorCount = queue.filter((task) => task.status === 'error').length;
    const successCount = queue.filter((task) => task.status === 'success').length;
    const etaWork = queue.filter((task) => task && (task.status === 'pending' || task.status === 'processing' || task.status === 'error'));
    const etaSeconds = getMagicUploadQueueEtaSeconds();
    const recentTasks = queue.filter((task) => task.status === 'processing' || task.status === 'success' || task.status === 'error' || task.status === 'waiting').slice(0, 3);
    const rows = queue.length ? queue.map((task) => {
      const progress = Math.round((task.status === 'success' ? 1 : Math.min(1, Math.max(0, Number(task.progress) || 0))) * 100);
      const statusClass = task.status === 'success' ? 'is-success' : (task.status === 'error' ? 'is-error' : '');
      const statusText = task.currentFileName ? (task.step || '上传中') : magicUploadStatusLabel(task);
      const replacementStatus = String(task.replacementCheckStatus || 'idle');
      const replacementCategories = Array.isArray(task.replaceCategories) ? task.replaceCategories : [];
      const replacementBadge = replacementStatus === 'checking' ? '<span class="pfh-magic-file-badge is-checking">检查现有图</span>' : (replacementCategories.length ? '<span class="pfh-magic-file-badge is-replace">替换任务</span>' : '');
      const replacementSummary = magicUploadReplacementSummary(task);
      const taskDisplayEta = getMagicUploadTaskDisplayEta(task);
      const taskEta = task.status === 'success' ? '已完成' : (taskDisplayEta ? '约 ' + formatMagicUploadDuration(taskDisplayEta) : (running ? '正在建立估算' : '--'));
      const taskFileCount = getMagicUploadTaskFileCount(task);
      const taskData = loadData(task.sku) || (state.index || []).find((item) => item && item.sku === task.sku) || {};
      const taskTitle = [task.brand || taskData.brand, task.name || taskData.name, task.sku].map((value) => String(value || '').trim()).filter(Boolean).join(' ') || task.sku || '待确认 SKU';
      const categorySummary = magicUploadCategorySummary(task) || (taskFileCount ? taskFileCount + '个文件' : '待确认');
      return '<article class="pfh-magic-task pfh-magic-package-task ' + (replacementCategories.length ? 'is-replace ' : '') + statusClass + '" data-magic-id="' + escapeHtml(task.id) + '"><div class="pfh-magic-task-main"><div class="pfh-magic-task-icon">✦</div><div class="pfh-magic-task-copy"><div class="pfh-magic-task-title"><span class="pfh-magic-package-title-text" title="' + escapeHtml(taskTitle) + '">' + escapeHtml(taskTitle) + '</span>' + replacementBadge + '</div><div class="pfh-magic-task-meta"><span class="pfh-magic-package-summary" title="' + escapeHtml(categorySummary) + '">' + escapeHtml(categorySummary) + '</span><span class="pfh-magic-stage" data-magic-stage>' + escapeHtml(replacementSummary) + '</span></div><div class="pfh-magic-progress-line"><div class="pfh-magic-progress-track"><div class="pfh-magic-progress-bar" data-magic-progress-bar style="width:' + progress + '%"></div></div></div></div><div class="pfh-magic-task-side"><button type="button" class="pfh-magic-task-delete" data-action="magic-upload-remove" data-magic-id="' + escapeHtml(task.id) + '">删除</button><strong class="pfh-magic-progress-value" data-magic-progress-value>' + progress + '%</strong><span class="pfh-magic-eta" data-magic-eta>' + escapeHtml(taskEta) + '</span><span class="pfh-magic-status ' + statusClass + '" title="' + escapeHtml(statusText) + '">' + escapeHtml(statusText) + '</span></div></div></article>';
    }).join('') : taskEmptyStateHtml('极光队列暂无任务', '拖入 ZIP 图包或 XLSX，队列会在这里生成商品任务');
    const historyHtml = historyOpen ? '<div class="pfh-magic-history-modal" data-action="magic-upload-history-close"><section class="pfh-magic-history-dialog" role="dialog" aria-modal="true" aria-label="魔法上传历史"><header><span>' + iconHtml('history') + ' 上传历史 · ' + history.length + ' 条</span><button type="button" data-action="magic-upload-history-close">×</button></header><div class="pfh-magic-history-list">' + (history.length ? history.slice(0, 40).map((entry) => { const fullSourceName = entry.sourceName || '未命名来源'; const historySourceName = truncateFileName(fullSourceName, 30); return '<div class="pfh-magic-history-item"><div><strong>' + escapeHtml(entry.sku || '待确认 SKU') + ' · ' + escapeHtml(entry.status === 'success' ? '成功' : (entry.status === 'waiting' ? '已暂停' : '失败')) + '</strong><span><span class="pfh-magic-history-source" title="' + escapeHtml(fullSourceName) + '">' + escapeHtml(historySourceName) + '</span> · ' + Number(entry.successCount || 0) + '/' + Number(entry.fileCount || 0) + ' 文件 · ' + escapeHtml(entry.finishedAt ? new Date(entry.finishedAt).toLocaleString() : '未完成') + '</span></div>' + (entry.status === 'success' ? '' : '<button type="button" data-action="magic-upload-history-retry" data-magic-history-id="' + escapeHtml(entry.id) + '">' + iconHtml('refresh') + '恢复</button>') + '</div>'; }).join('') : '<div class="pfh-magic-history-empty">还没有上传历史</div>') + '</div></section></div>' : '';
    const activityHtml = recentTasks.length ? recentTasks.map((task) => '<p><i></i><span>' + escapeHtml((task.sku || '待确认 SKU') + ' · ' + magicUploadStatusLabel(task)) + '</span></p>').join('') : '<p><i></i><span>等待 ZIP 或 XLSX 进入队列</span></p>';
    return '<div class="pfh-detail-scroll"><section class="pfh-magic-page"><div class="pfh-magic-canvas"><div class="pfh-magic-lab-head"><div class="pfh-magic-head-left"><button type="button" class="pfh-upload-back pfh-magic-back" data-action="home-back" aria-label="返回主页">' + iconHtml('back') + '</button><h1 class="pfh-magic-lab-title">魔法上传 <em>BETA</em></h1></div><span class="pfh-magic-pipeline">API PIPELINE</span></div>' + modeTabs + '<section class="pfh-magic-overview"><h3>运行概览</h3><div class="pfh-magic-stats"><div class="pfh-magic-stat"><span>当前任务</span><strong>' + String(activeCount).padStart(2, '0') + '</strong></div><div class="pfh-magic-stat"><span>已完成文件</span><strong>' + doneFiles + '/' + totalFiles + '</strong></div><div class="pfh-magic-stat"><span>待确认/失败</span><strong>' + waitingCount + '/' + errorCount + '</strong></div><div class="pfh-magic-stat"><span>已提审商品</span><strong>' + successCount + '</strong></div><div class="pfh-magic-stat"><span>预计剩余</span><strong data-magic-overall-eta>' + (etaSeconds ? formatMagicUploadDuration(etaSeconds) : (running && pendingCount ? '正在建立估算' : '--')) + '</strong></div></div><div class="pfh-magic-queue-progress"><div class="pfh-magic-queue-progress-track"><div class="pfh-magic-queue-progress-bar" data-magic-queue-progress-bar style="width:0%"></div></div><span data-magic-queue-progress-text>0/' + totalFiles + ' 文件</span></div><div class="pfh-magic-activity"><h3>实时动态</h3>' + activityHtml + '</div></section><div class="pfh-upload-drop pfh-magic-upload-drop" data-action="upload-pick" data-upload-drop="magic" tabindex="0" role="button" aria-label="拖入 ZIP 图包或 XLSX，悬浮后可按 Ctrl+V 粘贴"><div><span class="pfh-magic-drop-icon">' + iconHtml('upload') + '</span><strong>拖入 ZIP 或 XLSX</strong><span>悬浮此框后按 Ctrl+V，可直接粘贴文件 · ZIP 单文件 150MB · 自动识别 SKU · 原包保留到图包素材</span></div></div><input class="pfh-upload-file pfh-magic-upload-file" data-upload-kind="magic" type="file" multiple accept=".zip,.xlsx,application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden><div class="pfh-magic-actions"><button type="button" class="is-primary" data-action="magic-upload-start"' + (running || !pendingCount ? ' disabled' : '') + '>' + iconHtml('upload') + '开始上传</button><button type="button" data-action="magic-upload-pause"' + (!running ? ' disabled' : '') + '>' + iconHtml(running ? 'pause' : 'play') + (running ? '暂停' : '继续') + '</button><button type="button" data-action="magic-upload-clear"' + (!queue.length ? ' disabled' : '') + '>清空队列</button><button type="button" class="pfh-magic-history-toggle" data-action="magic-upload-history-toggle">' + iconHtml('history') + '上传历史</button></div><div class="pfh-magic-queue-head"><b>上传队列</b><span>' + queue.length + ' 个商品 · ' + totalFiles + ' 个文件</span></div><div class="pfh-magic-queue">' + rows + '</div>' + historyHtml + '</div></section></div>';
  }

  function saveMagicUploadTaskEdits(id) {
    const task = (state.magicUploadQueue || []).find((item) => item.id === id);
    const root = ensurePanel().querySelector('.pfh-magic-task[data-magic-id="' + CSS.escape(id) + '"]');
    if (!task || !root) return;
    const skuInput = root.querySelector('.pfh-magic-sku');
    if (skuInput) task.sku = String(skuInput.value || '').trim().toUpperCase();
    root.querySelectorAll('[data-magic-file-index]').forEach((select) => {
      const index = Number(select.getAttribute('data-magic-file-index'));
      const entry = task.files[index];
      if (!entry) return;
      entry.category = select.value;
      const rule = getMagicUploadRule(entry.category, getMagicUploadFileExtension(entry.name));
      entry.archiveTypeId = rule ? rule.archiveTypeId : 0;
      entry.status = 'pending';
      entry.error = '';
      entry.fileVersionId = '';
      entry.fileId = '';
      entry.generatedName = '';
    });
    task.status = task.files.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending';
    task.step = task.status === 'waiting' ? '请确认文件分类' : '等待上传';
    task.submitted = false;
    task.draftSaved = false;
    task.projectId = getProjectIdForMaterialApi(loadData(task.sku) || {});
    task.replaceCategories = [];
    task.existingFileVersionIds = {};
    task.existingFiles = {};
    task.replacementCheckStatus = task.sku ? 'checking' : 'idle';
    task.updatedAt = Date.now();
    saveMagicUploadQueue(state.magicUploadQueue);
    scheduleMagicUploadReplacementChecks([task]);
    renderShell();
    showToast('任务修改已保存');
  }

  function toggleMagicUploadTask(id) {
    const task = (state.magicUploadQueue || []).find((item) => item.id === id);
    if (!task) return;
    task.expanded = !task.expanded;
    renderShell();
  }

  function moveMagicUploadFile(id, index, direction) {
    const task = (state.magicUploadQueue || []).find((item) => item.id === id);
    const currentIndex = Number(index);
    if (!task || !Array.isArray(task.files) || !Number.isInteger(currentIndex)) return;
    const targetIndex = currentIndex + Number(direction || 0);
    if (targetIndex < 0 || targetIndex >= task.files.length) return;
    const files = task.files.slice();
    const current = files[currentIndex];
    files[currentIndex] = files[targetIndex];
    files[targetIndex] = current;
    task.files = files;
    task.status = task.files.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending';
    task.step = task.status === 'waiting' ? '请确认文件分类' : '等待上传';
    task.submitted = false;
    task.draftSaved = false;
    task.updatedAt = Date.now();
    saveMagicUploadQueue(state.magicUploadQueue);
    renderShell();
  }

  async function retryMagicUploadHistory(id) {
    const historyEntry = (state.magicUploadHistory || []).find((entry) => entry && entry.id === id);
    const savedTask = historyEntry && historyEntry.task;
    if (!savedTask) return;
    const task = normalizeMagicUploadTask(savedTask, { preserveProcessing: false });
    if (!task) return;
    const references = [task.zipKey].concat((task.files || []).map((entry) => entry.key)).filter(Boolean);
    const missing = [];
    for (const key of references) {
      if (!await getUploadFile(key)) missing.push(key);
    }
    if (missing.length) {
      showToast('历史源文件已失效，请重新选择 ZIP/XLSX');
      magicUploadLog('warn', '历史任务无法恢复', task.sku + ' | 本地文件已丢失=' + missing.length);
      return;
    }
    const existing = (state.magicUploadQueue || []).find((item) => item.id === task.id);
    if (!existing) state.magicUploadQueue = (state.magicUploadQueue || []).concat(task);
    state.magicUploadHistoryOpen = false;
    saveMagicUploadQueue(state.magicUploadQueue);
    renderShell();
    retryMagicUploadTask(task.id);
  }

  function removeMagicUploadTask(id) {
    const task = (state.magicUploadQueue || []).find((item) => item.id === id);
    if (!task) return;
    state.magicUploadQueue = state.magicUploadQueue.filter((item) => item.id !== id);
    cleanupMagicUploadTaskFiles(task, state.magicUploadQueue);
    saveMagicUploadQueue(state.magicUploadQueue);
    renderShell();
  }

  function clearMagicUploadQueue() {
    const removed = state.magicUploadQueue || [];
    removed.forEach((task) => cleanupMagicUploadTaskFiles(task, []));
    state.magicUploadQueue = [];
    state.magicUploadRunning = false;
    if (magicUploadEtaTimer) {
      window.clearInterval(magicUploadEtaTimer);
      magicUploadEtaTimer = 0;
    }
    saveMagicUploadQueue(state.magicUploadQueue);
    renderShell();
    showToast('魔法上传队列已清空');
  }

  function cleanupMagicUploadTaskFiles(task, remainingTasks) {
    const referenced = new Set((remainingTasks || []).flatMap((item) => [item.zipKey].concat((item.files || []).map((entry) => entry.key))).filter(Boolean));
    [task.zipKey].concat((task.files || []).map((entry) => entry.key)).filter((key) => key && !referenced.has(key)).forEach((key) => deleteUploadFile(key).catch(() => {}));
  }

  function retryMagicUploadTask(id) {
    if (magicUploadAuthPaused) {
      showToast('请先刷新 PLM 页面，再重试魔法上传');
      return;
    }
    const task = (state.magicUploadQueue || []).find((item) => item.id === id);
    if (!task) return;
    task.status = task.files.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending';
    task.error = '';
    task.step = task.status === 'waiting' ? '请确认文件分类' : '等待上传';
    task.submitted = false;
    task.draftSaved = false;
    task.files.forEach((entry) => { if (entry.status !== 'success') { entry.status = 'pending'; entry.error = ''; } });
    saveMagicUploadQueue(state.magicUploadQueue);
    renderShell();
    if (state.magicUploadAccessEnabled && task.status === 'pending') {
      const restart = () => { if (state.magicUploadAccessEnabled) startMagicUploadQueue(); };
      const activeRun = magicUploadQueueRunPromise;
      if (activeRun) activeRun.then(() => { restart(); }, () => { restart(); });
      else restart();
    }
  }

  function isMagicUploadAuthError(error) {
    return /\b401\b/.test(String(error && error.message || error || ''));
  }

  function getMagicUploadAuthPauseMessage(error) {
    const message = formatErrorMessage(error);
    return /请刷新 PLM 页面后重试/.test(message) ? message : message + ' | 请刷新 PLM 页面后重试';
  }

  function getMagicUploadTaskErrorMessage(error) {
    const message = formatErrorMessage(error);
    if (/属性\[设计人员\].*已停用/.test(message)) {
      return '商品原有设计人员已停用。请先在 PLM 商品编辑页改选有效设计人员并保存，再点击“开始上传”重试；已上传文件会复用。';
    }
    return message;
  }

  function startMagicUploadQueue() {
    if (magicUploadQueueRunPromise) return magicUploadQueueRunPromise;
    if (state.magicUploadRunning) return Promise.resolve();
    if (!state.magicUploadAccessEnabled) {
      showToast('魔法上传暂未开放');
      return Promise.resolve();
    }
    if (magicUploadAuthPaused) {
      showToast('PLM 登录态可能已失效，请刷新 PLM 页面后再重试');
      return Promise.resolve();
    }
    magicUploadAuthPaused = false;
    state.magicUploadRunning = true;
    state.magicUploadEtaDisplaySeconds = 0;
    if (!magicUploadEtaTimer) magicUploadEtaTimer = window.setInterval(updateMagicUploadEtaDisplay, 1000);
    const attemptedTaskIds = new Set();
    const runner = async () => {
      try {
        saveMagicUploadQueue(state.magicUploadQueue);
        renderShell();
        const workers = Array.from({ length: MAGIC_UPLOAD_CONCURRENCY }, () => (async () => {
          while (state.magicUploadRunning && !magicUploadAuthPaused) {
            const task = (state.magicUploadQueue || []).find((item) => (item.status === 'pending' || item.status === 'error') && !attemptedTaskIds.has(item.id));
            if (!task) break;
            // Each task may be claimed only once in a queue run. This also
            // prevents a freshly failed task from being retried in a tight loop.
            attemptedTaskIds.add(task.id);
            task.status = 'processing';
            task.error = '';
            task.startedAt = Date.now();
            task.finishedAt = 0;
            task.currentFileName = '';
            task.currentFileSize = 0;
            task.currentFileProgress = 0;
            task.updatedAt = Date.now();
            saveMagicUploadQueue(state.magicUploadQueue);
            try {
              await uploadMagicUploadTask(task);
              task.status = 'success';
              task.step = '上传完成';
              task.progress = 1;
              task.uploadedBytes = task.totalBytes || task.uploadedBytes;
              task.currentFileName = '';
              task.currentFileProgress = 0;
              task.finishedAt = Date.now();
              task.updatedAt = Date.now();
              recordMagicUploadHistory(task);
            } catch (error) {
              const message = getMagicUploadTaskErrorMessage(error);
              if (isMagicUploadAuthError(error)) {
                const firstAuthPause = !magicUploadAuthPaused;
                magicUploadAuthPaused = true;
                state.magicUploadRunning = false;
                task.status = 'waiting';
                task.error = getMagicUploadAuthPauseMessage(error);
                task.step = '已暂停：请刷新 PLM 页面后重试';
                task.updatedAt = Date.now();
                if (firstAuthPause) {
                  addLog('warn', '魔法上传鉴权失败，队列已暂停', task.sku + ' | ' + task.error);
                  showToast('PLM 登录态已失效，魔法上传队列已暂停，请刷新页面后重试');
                }
              } else if (magicUploadAuthPaused) {
                task.status = task.files.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending';
                task.error = '队列因 HTTP 401 暂停，请刷新 PLM 页面后重试';
                task.step = '已暂停：请刷新 PLM 页面后重试';
                task.updatedAt = Date.now();
              } else if (!state.magicUploadRunning && /已暂停/.test(message)) {
                task.status = task.files.some((entry) => entry.category === '待确认') ? 'waiting' : 'pending';
                task.error = '';
                task.step = task.status === 'waiting' ? '请确认文件分类' : '已暂停，点击开始继续';
                task.updatedAt = Date.now();
              } else {
                task.status = 'error';
                task.error = message;
                task.step = '上传失败';
                task.updatedAt = Date.now();
                addLog('warn', '魔法上传任务失败', task.sku + ' | ' + task.error);
              }
              task.finishedAt = Date.now();
              recordMagicUploadHistory(task);
            }
            saveMagicUploadQueue(state.magicUploadQueue);
            if (state.view === 'magicUpload') renderShell();
          }
        })());
        await Promise.all(workers);
      } finally {
        state.magicUploadRunning = false;
        state.magicUploadEtaDisplaySeconds = 0;
        if (magicUploadEtaTimer) {
          window.clearInterval(magicUploadEtaTimer);
          magicUploadEtaTimer = 0;
        }
        saveMagicUploadQueue(state.magicUploadQueue);
        if (state.view === 'magicUpload') renderShell();
        showToast(magicUploadAuthPaused ? '魔法上传队列已暂停，请刷新 PLM 页面后重试' : '魔法上传队列已停止');
      }
    };
    let runPromise;
    runPromise = runner().finally(() => {
      if (magicUploadQueueRunPromise === runPromise) magicUploadQueueRunPromise = null;
    });
    magicUploadQueueRunPromise = runPromise;
    return runPromise;
  }

  function hasApiUploadAccess() {
    return Boolean(state.magicUploadAccessEnabled);
  }

  function notifyApiUploadAccessDenied() {
    if (state.magicUploadAccessLoading) {
      showToast('正在检查 API 权限，请稍后再试');
      scheduleMagicUploadAccessRefresh(0);
    } else {
      showToast('当前账号没有 API 上传权限，普通图包表格仍可使用');
    }
  }

  function ensureMagicToyLabelRunning() {
    if (!state.magicToyLabelRunning) throw new Error('已暂停');
  }

  function startMagicToyLabelQueue() {
    if (!hasApiUploadAccess()) {
      notifyApiUploadAccessDenied();
      return;
    }
    if (magicToyLabelQueueRunPromise) return magicToyLabelQueueRunPromise;
    const runner = async () => {
      state.magicToyLabelRunning = true;
      state.magicToyLabelStatus = '正在准备玩具标签队列';
      refreshMagicToyLabelPage();
      try {
        while (state.magicToyLabelRunning) {
          const task = (state.magicToyLabelQueue || []).find((item) => item && (item.status === 'pending' || item.status === 'error'));
          if (!task) break;
          updateMagicToyLabelTask(task, { status: 'processing', progress: Math.max(.01, Number(task.progress) || 0), step: '读取项目 BOM 和效果图', error: '' });
          try {
            const result = await processMagicToyLabelTask(task);
            const replacedExistingImage = Boolean(result.replacedExistingImage || task.replacedExistingImage);
            updateMagicToyLabelTask(task, { status: 'success', progress: 1, step: replacedExistingImage ? '已替换旧标签图并写入 BOM' : '已写入 BOM 标签物料', error: '', objectPath: result.objectPath || task.objectPath, replacedExistingImage, finishedAt: Date.now() });
            state.magicToyLabelHistory = [{ ...normalizeMagicToyLabelTask(task, { preserveProcessing: true }), status: 'success', finishedAt: Date.now() }, ...(state.magicToyLabelHistory || [])].slice(0, 300);
            saveMagicToyLabelHistory(state.magicToyLabelHistory);
            addLog('success', '魔法上传玩具标签 API 成功', task.sku + ' | ' + (task.objectPath || result.objectPath || ''));
          } catch (error) {
            const paused = !state.magicToyLabelRunning || String(error && error.message || error) === '已暂停';
            if (paused) {
              updateMagicToyLabelTask(task, { status: 'pending', step: '已暂停，等待继续', error: '' });
              break;
            }
            const message = formatErrorMessage(error);
            updateMagicToyLabelTask(task, { status: 'error', step: '处理失败', error: message });
            state.magicToyLabelHistory = [{ ...normalizeMagicToyLabelTask(task, { preserveProcessing: true }), status: 'error', error: message, finishedAt: Date.now() }, ...(state.magicToyLabelHistory || [])].slice(0, 300);
            saveMagicToyLabelHistory(state.magicToyLabelHistory);
            addLog('error', '魔法上传玩具标签 API 失败', task.sku + ' | ' + message);
          }
          if (state.magicToyLabelRunning) refreshMagicToyLabelPage();
        }
      } finally {
        state.magicToyLabelRunning = false;
        state.magicToyLabelStatus = (state.magicToyLabelQueue || []).some((task) => task.status === 'pending' || task.status === 'error')
          ? '队列等待继续'
          : '玩具标签队列已完成';
        saveMagicToyLabelQueue(state.magicToyLabelQueue);
        refreshMagicToyLabelPage();
      }
    };
    let runPromise;
    runPromise = runner().finally(() => {
      if (magicToyLabelQueueRunPromise === runPromise) magicToyLabelQueueRunPromise = null;
    });
    magicToyLabelQueueRunPromise = runPromise;
    return runPromise;
  }

  async function processMagicToyLabelTask(task) {
    ensureMagicToyLabelRunning();
    if (!task || !task.sku) throw new Error('缺少 SKU 编码');
    const context = await resolveMagicToyLabelContext(task);
    ensureMagicToyLabelRunning();
    const existingImagePaths = getMagicToyLabelExistingImagePaths(context.labelMaterial);
    updateMagicToyLabelTask(task, {
      projectId: context.projectId,
      name: task.name || context.data.name || '',
      materialId: context.labelMaterial.id,
      materialCode: context.labelMaterial.code || '',
      materialName: context.labelMaterial.name || context.labelMaterial.category_name || '',
      existingImagePaths,
      replacementCheckStatus: 'ready',
      replacementCheckError: '',
      replacementCheckedAt: Date.now(),
      replacedExistingImage: false,
      replacementCompleted: false,
      step: existingImagePaths.length ? '检查到现有标签图，准备替换' : '未发现现有标签图，准备新增',
      progress: .2,
    });
    const generated = await generateMagicToyLabelSizeImage(task, context);
    ensureMagicToyLabelRunning();
    updateMagicToyLabelTask(task, {
      generatedFilename: generated.filename,
      widthCm: generated.widthCm,
      heightCm: generated.heightCm,
      step: '上传标签尺寸图到 OSS',
      progress: .42,
    });
    const objectPath = await uploadMagicToyLabelSizeImage(task, generated);
    ensureMagicToyLabelRunning();
    task.objectPath = objectPath;
    updateMagicToyLabelTask(task, { objectPath, step: '调用 BOM API 保存标签', progress: .82 });
    const saved = await saveMagicToyLabelToBom(task, context, objectPath);
    return { objectPath, replacedExistingImage: Boolean(saved && saved.replacedExistingImage) };
  }

  function getMagicToyLabelEffectPicturePaths(payload) {
    const raw = payload && payload.data;
    const values = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.list) ? raw.list : []);
    return values.map((value) => {
      if (typeof value === 'string') return normalizeMagicUploadEffectPath(value);
      if (!value || typeof value !== 'object') return '';
      return normalizeMagicUploadEffectPath(value.path || value.file_path || value.filePath || value.oss_path || value.ossPath || value.url || value.src || '');
    }).filter(Boolean).filter((value, index, list) => list.indexOf(value) === index);
  }

  function getMagicToyLabelImageUrl(path) {
    const text = String(path || '').trim();
    if (!text) return '';
    return /^https?:\/\//i.test(text) ? stripOssResizeParams(text) : buildApiArchiveFileUrl(text);
  }

  function getMagicToyLabelExistingImagePaths(material) {
    const paths = [];
    const seen = new Set();
    const add = (value) => {
      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }
      if (value && typeof value === 'object') {
        add(value.path || value.file_path || value.filePath || value.oss_path || value.ossPath || value.url || value.src || value.value || '');
        return;
      }
      const path = normalizeMagicUploadEffectPath(String(value || '').trim());
      if (!path || /^(?:null|undefined)$/i.test(path) || seen.has(path)) return;
      seen.add(path);
      paths.push(path);
    };
    add(material && material.pics);
    return paths.slice(0, 20);
  }

  function getMagicToyLabelMaterial(materials, sku) {
    const list = Array.isArray(materials) ? materials : [];
    if (!list.length) throw new Error('项目 BOM 没有物料：' + sku);
    const labelMaterials = list.filter((material) => /标签/.test([material && material.category_name, material && material.categoryName].filter(Boolean).join(' ')));
    const namedLabelMaterials = list.filter((material) => /标签/.test([material && material.name, material && material.material_name].filter(Boolean).join(' ')));
    const labelMaterial = labelMaterials[0] || namedLabelMaterials[0] || (list.length === 1 ? list[0] : null);
    if (!labelMaterial) throw new Error('项目 BOM 未找到标签物料：' + sku);
    return labelMaterial;
  }

  async function resolveMagicToyLabelProject(task, options) {
    const sku = String(task && task.sku || '').trim().toUpperCase();
    if (!sku) throw new Error('缺少 SKU 编码');
    if (!(options && options.allowPaused)) ensureMagicToyLabelRunning();
    const cached = loadData(sku) || (state.index || []).find((item) => item && item.sku === sku) || {};
    let data = normalizeData({ ...cached, sku });
    const projectSnapshot = await fetchApiProjectSnapshot(data, { force: true }).catch((error) => {
      magicUploadLog('info', '玩具标签项目查询失败，继续使用缓存项目', sku + ' | ' + formatErrorMessage(error));
      return null;
    });
    const projectId = getProjectIdForMaterialApi(data) || String(projectSnapshot && projectSnapshot.projectId || '').trim();
    if (!projectId || !/^\d+$/.test(projectId)) throw new Error('未找到 ' + sku + ' 对应的项目 ID');
    data = normalizeData({
      ...data,
      projectRowId: data.projectRowId || projectId,
      projectId: data.projectId || projectId,
      name: data.name || projectSnapshot && projectSnapshot.name || '',
      brand: data.brand || projectSnapshot && projectSnapshot.brand || '',
    });
    return { sku, projectId, data };
  }

  async function resolveMagicToyLabelBomContext(task) {
    const project = await resolveMagicToyLabelProject(task, { allowPaused: true });
    const materialsPayload = await fetchPlmJson('/api/ChemicalNewDesignTask/GetProjectPMJoinList?id=' + encodeURIComponent(project.projectId));
    const materials = getApiMaterialItems(materialsPayload);
    return { ...project, materials, labelMaterial: getMagicToyLabelMaterial(materials, project.sku) };
  }

  function applyMagicToyLabelReplacementSnapshot(task, imagePaths, status, errorMessage) {
    if (!task) return;
    task.existingImagePaths = Array.isArray(imagePaths) ? imagePaths.slice(0, 20) : [];
    task.replacementCheckStatus = status || 'ready';
    task.replacementCheckError = String(errorMessage || '');
    task.replacementCheckedAt = status === 'ready' ? Date.now() : (Number(task.replacementCheckedAt) || 0);
    task.updatedAt = Date.now();
  }

  async function refreshMagicToyLabelReplacement(task, token) {
    if (!task || !task.sku) return;
    const context = await resolveMagicToyLabelBomContext(task);
    const imagePaths = getMagicToyLabelExistingImagePaths(context.labelMaterial);
    const liveTask = (state.magicToyLabelQueue || []).find((item) => item && item.id === task.id);
    if (!liveTask || (token && liveTask.replacementCheckToken !== token)) return;
    applyMagicToyLabelReplacementSnapshot(liveTask, imagePaths, 'ready', '');
    if (liveTask.status === 'pending' || liveTask.status === 'waiting' || liveTask.status === 'error') {
      liveTask.step = magicToyLabelReplacementSummary(liveTask);
    }
    saveMagicToyLabelQueue(state.magicToyLabelQueue);
    refreshMagicToyLabelPage();
    magicUploadLog('info', '玩具标签现有图检查完成', task.sku + ' | ' + (imagePaths.length ? '替换旧图=' + imagePaths.length : '没有旧标签图'));
  }

  function scheduleMagicToyLabelReplacementChecks(tasks) {
    const uniqueTasks = Array.from(new Map((tasks || []).filter((task) => task && task.id).map((task) => [task.id, task])).values());
    let changed = false;
    uniqueTasks.forEach((task) => {
      if (!task.sku) {
        task.replacementCheckStatus = 'idle';
        task.existingImagePaths = [];
        return;
      }
      const token = createMagicUploadId();
      task.replacementCheckToken = token;
      task.existingImagePaths = [];
      task.replacementCheckStatus = 'checking';
      task.replacementCheckError = '';
      task.replacedExistingImage = false;
      task.replacementCompleted = false;
      if (task.status !== 'processing' && task.status !== 'success') task.step = magicToyLabelReplacementSummary(task);
      task.updatedAt = Date.now();
      changed = true;
      Promise.resolve().then(() => refreshMagicToyLabelReplacement(task, token)).catch((error) => {
        const liveTask = (state.magicToyLabelQueue || []).find((item) => item && item.id === task.id);
        if (!liveTask || liveTask.replacementCheckToken !== token) return;
        liveTask.replacementCheckStatus = 'error';
        liveTask.replacementCheckError = formatErrorMessage(error);
        liveTask.step = '现有图检查失败，开始时会重新查询';
        liveTask.updatedAt = Date.now();
        saveMagicToyLabelQueue(state.magicToyLabelQueue);
        refreshMagicToyLabelPage();
        magicUploadLog('warn', '玩具标签现有图检查失败', task.sku + ' | ' + liveTask.replacementCheckError);
      });
    });
    if (changed) saveMagicToyLabelQueue(state.magicToyLabelQueue);
  }

  async function resolveMagicToyLabelContext(task) {
    const project = await resolveMagicToyLabelProject(task);
    const { sku, projectId, data } = project;
    const [materialsPayload, effectPayload] = await Promise.all([
      fetchPlmJson('/api/ChemicalNewDesignTask/GetProjectPMJoinList?id=' + encodeURIComponent(projectId)),
      fetchPlmJson('/api/ChemicalNew/GetProjectEffectPicture?id=' + encodeURIComponent(projectId)),
    ]);
    const materials = getApiMaterialItems(materialsPayload);
    const labelMaterial = getMagicToyLabelMaterial(materials, sku);
    const effectPictureFiles = getMagicToyLabelEffectPicturePaths(effectPayload);
    const cachedImageSource = getToyLabelImageSource(data, {});
    let imageUrl = effectPictureFiles.map(getMagicToyLabelImageUrl).find(Boolean) || cachedImageSource.imageUrl || cachedImageSource.imageFallbackUrl || '';
    let imageFallbackUrl = cachedImageSource.imageFallbackUrl || imageUrl;
    if (!imageUrl) {
      const productSnapshot = await fetchApiProductSnapshot(data).catch(() => null);
      imageUrl = productSnapshot && (productSnapshot.productListImageUrl || productSnapshot.productListImageFallbackUrl) || '';
      imageFallbackUrl = productSnapshot && (productSnapshot.productListImageFallbackUrl || productSnapshot.productListImageUrl) || imageUrl;
    }
    if (!imageUrl) throw new Error('未找到 ' + sku + ' 的效果图或产品图片');
    return { projectId, data, materials, labelMaterial, effectPictureFiles, imageUrl, imageFallbackUrl };
  }

  function getMagicToyLabelSizeCm() {
    // Toy labels use a fixed 4x3cm layout. Do not inherit dimensions from BOM or print materials.
    return { width: 4, height: 3 };
  }

  async function generateMagicToyLabelSizeImage(task, context) {
    ensureMagicToyLabelRunning();
    const data = normalizeData({
      ...(context.data || {}),
      sku: task.sku,
      toyLabelProductImageUrl: context.imageUrl,
      toyLabelProductImageFallbackUrl: context.imageFallbackUrl || context.imageUrl,
    });
    const productImage = await fetchImageForExcel(context.imageUrl, context.imageFallbackUrl || context.imageUrl).catch((error) => {
      throw new Error('产品图读取失败：' + formatErrorMessage(error));
    });
    if (!productImage || !productImage.dataUrl) throw new Error('产品图为空，已停止生成');
    const size = getMagicToyLabelSizeCm();
    const barcodeImage = await getBarcodeForToyLabel(task.sku);
    const printCanvas = await renderToyLabelPrintCanvas({ sku: task.sku, widthCm: size.width, heightCm: size.height, productImage, barcodeImage });
    const previewCanvas = await renderToyLabelPreviewCanvas({ sku: task.sku, widthCm: size.width, heightCm: size.height, printCanvas });
    const blob = await canvasToBlob(previewCanvas, 'image/png');
    const filename = (cleanFileNamePart([data.brand, data.name, task.sku].filter(Boolean).join(' ')) || task.sku) + '.png';
    return { blob, filename, widthCm: size.width, heightCm: size.height };
  }

  async function uploadMagicToyLabelSizeImage(task, generated) {
    ensureMagicToyLabelRunning();
    const blob = generated && generated.blob;
    if (!blob || !blob.size) throw new Error('标签尺寸图生成结果为空');
    const secretPayload = await fetchPlmApiJson('/api/Common/GetOssClientSecretKey', { upload_file_type: 40 });
    const secret = secretPayload && secretPayload.data;
    if (!secret || !secret.bucket || !secret.file_directory) throw new Error('未获取到标签尺寸图 OSS 临时授权');
    const uploadMaxBytes = Number(secret.max_file_size) || (20 * 1024 * 1024);
    if (blob.size > uploadMaxBytes) throw new Error('标签尺寸图超过 PLM 限制：' + Math.round(uploadMaxBytes / 1024 / 1024) + 'MB');
    const Oss = getLazyExternalRuntime('oss') || await ensureLazyExternalScript('oss').catch(() => null);
    if (typeof Oss !== 'function') throw new Error('OSS 上传组件未加载，请刷新脚本');
    const objectName = String(secret.file_directory).replace(/^\/+/, '') + '/' + createMagicObjectName('.png');
    const client = new Oss({ region: 'oss-cn-shenzhen', bucket: secret.bucket, accessKeyId: secret.access_key_id, accessKeySecret: secret.access_key_secret, stsToken: secret.security_token, endpoint: 'https://oss-cn-shenzhen.aliyuncs.com', secure: true, retryMax: OSS_UPLOAD_SDK_RETRY_MAX, timeout: OSS_UPLOAD_TIMEOUT_MS });
    await multipartUploadWithRetry(client, objectName, blob, {
      partSize: 2 * 1024 * 1024,
      parallel: 2,
      progress: (percent) => updateMagicToyLabelTask(task, { progress: .42 + .3 * Math.min(1, Math.max(0, Number(percent) || 0)), step: '上传标签尺寸图到 OSS · ' + Math.round(Math.min(1, Math.max(0, Number(percent) || 0)) * 100) + '%' }, { render: false }),
    }, (error, retryCount, delay, checkpoint) => {
      const completedParts = checkpoint && Array.isArray(checkpoint.doneParts) ? checkpoint.doneParts.length : 0;
      updateMagicToyLabelTask(task, { step: '网络波动，自动重试 ' + retryCount + '/' + OSS_UPLOAD_RETRY_MAX + ' · 已完成分片 ' + completedParts }, { render: false });
    });
    await fetchPlmApiJson('/api/Common/SaveUploadFileInfo', { upload_file_type: 40, oss_path: objectName, original_file_name: generated.filename || task.sku + '.png' });
    return objectName;
  }

  async function saveMagicToyLabelToBom(task, context, objectPath) {
    ensureMagicToyLabelRunning();
    const materials = (context.materials || []).map(buildMagicUploadBomMaterialPayload);
    const target = materials.find((material) => String(material && material.id || '') === String(context.labelMaterial && context.labelMaterial.id || ''));
    if (!target) throw new Error('BOM 标签物料已变化，无法定位保存行');
    const previousImagePaths = getMagicToyLabelExistingImagePaths(context.labelMaterial);
    target.pics = [normalizeMagicUploadEffectPath(objectPath)];
    await fetchPlmApiJson('/api/ChemicalNewBom/MaterialBatchSaveAndSyncToProduct', {
      project_id: Number(context.projectId) || context.projectId,
      materials,
      effect_picture_files: context.effectPictureFiles || [],
    });
    const replacedExistingImage = previousImagePaths.length > 0;
    updateMagicToyLabelTask(task, {
      progress: 1,
      step: replacedExistingImage ? '已替换旧标签图并保存 BOM' : 'BOM 标签物料已保存',
      existingImagePaths: previousImagePaths,
      replacedExistingImage,
      replacementCheckStatus: 'ready',
      replacementCompleted: true,
    });
    return { replacedExistingImage, previousImagePaths };
  }

  async function resolveMagicUploadProductContext(task) {
    const sku = String(task && task.sku || '').trim().toUpperCase();
    if (!sku) throw new Error('缺少 SKU 编码，请先编辑任务');
    magicUploadLog('info', '确认商品版本', sku);
    const payload = await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(sku));
    const list = payload && payload.data && Array.isArray(payload.data.list) ? payload.data.list : [];
    const product = list.find((item) => String(item && (item.product_code || item.code || '')).trim().toUpperCase() === sku);
    if (!product) throw new Error('产品列表未找到目标 SKU：' + sku);
    const productId = product.product_id || product.id;
    const productVersionId = product.product_version_id;
    if (!productId || !productVersionId) throw new Error('目标 SKU 缺少 product_id 或 product_version_id：' + sku);
    const context = {
      sku,
      productId: String(productId),
      productVersionId: String(productVersionId),
      categoryId: String(product.category_id || ''),
      productCode: String(product.product_code || product.code || sku).trim().toUpperCase(),
      productReviewStatus: getMagicUploadProductReviewStatus(product),
    };
    task.productId = context.productId;
    task.productVersionId = context.productVersionId;
    task.updatedAt = Date.now();
    magicUploadLog('info', '商品版本已确认', sku + ' | product_id=' + context.productId + ' | product_version_id=' + context.productVersionId);
    return context;
  }

  function isMagicGeneratedNameForSku(name, sku) {
    const filename = String(name || '').trim();
    const code = String(sku || '').trim().toUpperCase();
    return Boolean(filename && code && new RegExp('(?:^|[^A-Z0-9])' + escapeRegExp(code) + '(?:[^A-Z0-9]|$)', 'i').test(filename));
  }

  function cloneMagicUploadDraftValue(value) {
    if (Array.isArray(value)) return value.map((item) => cloneMagicUploadDraftValue(item));
    if (!value || typeof value !== 'object') return value;
    return Object.keys(value).reduce((result, key) => {
      result[key] = cloneMagicUploadDraftValue(value[key]);
      return result;
    }, {});
  }

  function normalizeMagicUploadFileVersionValue(value) {
    const text = String(value === null || value === undefined ? '' : value).trim();
    if (!text) return null;
    return /^\d+$/.test(text) ? Number(text) : text;
  }

  function magicUploadDraftValueList(value) {
    if (Array.isArray(value)) return value.map((item) => cloneMagicUploadDraftValue(item));
    if (value === null || value === undefined || value === '') return [];
    return [cloneMagicUploadDraftValue(value)];
  }

  function flattenMagicUploadProductAttributes(contentPayload) {
    const groups = contentPayload && Array.isArray(contentPayload.data) ? contentPayload.data : [];
    const values = [];
    groups.forEach((group) => {
      const attrs = group && Array.isArray(group.category_template_attrs) ? group.category_template_attrs : [];
      attrs.forEach((attr) => {
        if (!attr || attr.attr_id === undefined || attr.attr_id === null) return;
        const languages = Array.isArray(attr.attr_language_config_json) ? attr.attr_language_config_json : [];
        if (!languages.length) {
          values.push({
            attr_id: attr.attr_id,
            language_id: attr.language_id === undefined || attr.language_id === null ? 1 : attr.language_id,
            value: cloneMagicUploadDraftValue(attr.value),
            attr_name: attr.attr_name,
            variable_name: attr.variable_name,
          });
          return;
        }
        languages.forEach((language) => {
          if (!language) return;
          values.push({
            attr_id: attr.attr_id,
            language_id: language.language_id === undefined || language.language_id === null ? (attr.language_id || 1) : language.language_id,
            value: cloneMagicUploadDraftValue(language.value),
            attr_name: attr.attr_name,
            variable_name: attr.variable_name,
          });
        });
      });
    });
    return values;
  }

  function findMagicUploadProductAttribute(values, category) {
    const variable = MAGIC_UPLOAD_ATTRIBUTE_VARIABLES[category] || '';
    const exactVariable = values.find((item) => String(item && item.variable_name || '') === variable);
    if (exactVariable) return exactVariable;
    const exactName = values.find((item) => compactText(item && item.attr_name) === compactText(category));
    if (exactName) return exactName;
    return values.find((item) => compactText(item && item.attr_name).includes(compactText(category))) || null;
  }

  function findMagicUploadProductAttributeByVariable(values, variableName, attrName, attrId) {
    const exactVariable = (values || []).find((item) => String(item && item.variable_name || '') === variableName && Number(item && item.language_id) === 1);
    if (exactVariable) return exactVariable;
    const anyVariable = (values || []).find((item) => String(item && item.variable_name || '') === variableName);
    if (anyVariable) return anyVariable;
    const exactId = (values || []).find((item) => String(item && item.attr_id) === String(attrId) && Number(item && item.language_id) === 1);
    if (exactId) return exactId;
    const anyId = (values || []).find((item) => String(item && item.attr_id) === String(attrId));
    if (anyId) return anyId;
    return (values || []).find((item) => compactText(item && item.attr_name) === compactText(attrName) && Number(item && item.language_id) === 1)
      || (values || []).find((item) => compactText(item && item.attr_name) === compactText(attrName))
      || null;
  }

  function findMagicUploadProductAttributeDefinition(contentPayload, variableName, attrName, attrId) {
    const groups = contentPayload && Array.isArray(contentPayload.data) ? contentPayload.data : [];
    const attrs = groups.reduce((result, group) => result.concat(Array.isArray(group && group.category_template_attrs) ? group.category_template_attrs : []), []);
    return attrs.find((attr) => String(attr && attr.variable_name || '') === variableName)
      || attrs.find((attr) => String(attr && attr.attr_id) === String(attrId))
      || attrs.find((attr) => compactText(attr && attr.attr_name) === compactText(attrName))
      || null;
  }

  function normalizeMagicUploadBoxGaugeValue(value) {
    let source = value;
    if (typeof source === 'string') {
      const text = source.trim();
      if (!text) return [];
      try {
        source = JSON.parse(text);
      } catch (_) {
        source = text.split(/[,，、\s]+/);
      }
    }
    const list = Array.isArray(source) ? source : (source === null || source === undefined || source === '' ? [] : [source]);
    return list.map((item) => {
      if (item && typeof item === 'object') return item.id === undefined ? item.value : item.id;
      return item;
    }).map((item) => String(item === null || item === undefined ? '' : item).trim()).filter(Boolean);
  }

  function getMagicUploadBoxGaugeOptions(definition) {
    const configs = Array.isArray(definition && definition.multi_attr_value_options_json)
      ? definition.multi_attr_value_options_json
      : [];
    const config = configs.find((item) => Number(item && item.language_id) === 1) || configs[0];
    return (config && Array.isArray(config.options) ? config.options : []).map((option) => {
      const rawId = option && (option.id === undefined ? option.value : option.id);
      const id = normalizeMagicUploadFileVersionValue(rawId);
      return id === null ? null : {
        id,
        name: String(option && (option.mult_attr_value_name || option.label || option.name) || '').trim(),
        enabled: option && option.is_enabled !== false,
      };
    }).filter(Boolean);
  }

  function getMagicUploadCartonDimensions(value) {
    const numbers = String(value === null || value === undefined ? '' : value)
      .replace(/,/g, '')
      .match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/g) || [];
    return numbers.map(Number).filter((item) => Number.isFinite(item)).slice(-3);
  }

  function normalizeMagicUploadCartonSpecCompareText(value) {
    return normalizeMagicUploadExcelCartonSpec(value)
      .toLowerCase()
      .replace(/[×＊*]/g, 'x')
      .replace(/[\s:：()（）]/g, '');
  }

  function findMagicUploadBoxGaugeOption(sourceSpec, definition) {
    const sourceDimensions = getMagicUploadCartonDimensions(sourceSpec);
    const options = getMagicUploadBoxGaugeOptions(definition).filter((option) => option.enabled);
    if (sourceDimensions.length === 3) {
      const sameDimensions = options.find((option) => {
        const optionDimensions = getMagicUploadCartonDimensions(option.name);
        return optionDimensions.length === 3 && optionDimensions.every((value, index) => Math.abs(value - sourceDimensions[index]) <= 0.01);
      });
      if (sameDimensions) return sameDimensions;
    }
    const sourceText = normalizeMagicUploadCartonSpecCompareText(sourceSpec);
    if (!sourceText) return null;
    return options.find((option) => {
      const optionText = normalizeMagicUploadCartonSpecCompareText(option.name);
      return optionText === sourceText || optionText.endsWith(sourceText) || sourceText.endsWith(optionText);
    }) || null;
  }

  function getMagicUploadPackingFieldState(values) {
    const result = MAGIC_UPLOAD_PACKING_FIELDS.reduce((state, field) => {
      const target = findMagicUploadProductAttributeByVariable(values, field.variableName, field.attrName, field.attrId);
      const value = target && target.value;
      state[field.key] = field.key === 'standardPackingQuantity'
        ? normalizeMagicUploadPackingQuantity(value)
        : normalizeMagicUploadBoxWeight(value);
      return state;
    }, { standardPackingQuantity: '', boxWeight: '' });
    const cartonTarget = findMagicUploadProductAttributeByVariable(values, MAGIC_UPLOAD_CARTON_GAUGE_FIELD.variableName, MAGIC_UPLOAD_CARTON_GAUGE_FIELD.attrName, MAGIC_UPLOAD_CARTON_GAUGE_FIELD.attrId);
    result.boxGauge = normalizeMagicUploadBoxGaugeValue(cartonTarget && cartonTarget.value);
    return result;
  }

  function applyMagicUploadExcelPacking(values, excelPacking, contentPayload) {
    const source = normalizeMagicUploadExcelPacking(excelPacking);
    const changed = [];
    const retained = [];
    const missing = [];
    MAGIC_UPLOAD_PACKING_FIELDS.forEach((field) => {
      const target = findMagicUploadProductAttributeByVariable(values, field.variableName, field.attrName, field.attrId);
      if (!target) {
        missing.push(field.label + '字段');
        return;
      }
      const language = (values || []).find((item) => String(item && item.attr_id) === String(target.attr_id) && Number(item && item.language_id) === 1);
      if (!language) {
        missing.push(field.label + '中文字段');
        return;
      }
      const current = field.key === 'standardPackingQuantity'
        ? normalizeMagicUploadPackingQuantity(language.value)
        : normalizeMagicUploadBoxWeight(language.value);
      if (current) {
        retained.push(field.label + '=' + current);
        return;
      }
      if (!source[field.key]) {
        missing.push(field.label);
        return;
      }
      language.value = source[field.key];
      changed.push(field.label + '=' + source[field.key] + '(Excel)');
    });
    const cartonField = MAGIC_UPLOAD_CARTON_GAUGE_FIELD;
    const cartonDefinition = findMagicUploadProductAttributeDefinition(contentPayload, cartonField.variableName, cartonField.attrName, cartonField.attrId);
    const cartonTarget = findMagicUploadProductAttributeByVariable(values, cartonField.variableName, cartonField.attrName, cartonField.attrId);
    if (cartonDefinition || cartonTarget) {
      if (!cartonTarget) {
        if (cartonDefinition && cartonDefinition.is_must) missing.push(cartonField.label + '字段');
      } else {
        const language = (values || []).find((item) => String(item && item.attr_id) === String(cartonTarget.attr_id) && Number(item && item.language_id) === 1);
        if (!language) {
          if (cartonDefinition && cartonDefinition.is_must) missing.push(cartonField.label + '中文字段');
        } else {
          const current = normalizeMagicUploadBoxGaugeValue(language.value);
          const options = getMagicUploadBoxGaugeOptions(cartonDefinition);
          const optionIds = new Set(options.map((option) => String(option.id)));
          const currentValid = current.length && (!options.length || current.every((id) => optionIds.has(String(id))));
          if (currentValid) {
            retained.push(cartonField.label + '=' + current.join(','));
          } else if (source.cartonSpec) {
            const matched = findMagicUploadBoxGaugeOption(source.cartonSpec, cartonDefinition);
            if (!matched) {
              missing.push(cartonField.label + '（Excel 值“' + source.cartonSpec + '”未匹配 PLM 选项）');
            } else {
              language.value = [matched.id];
              changed.push(cartonField.label + '=' + (matched.name || matched.id) + '(Excel)');
            }
          } else if (cartonDefinition.is_must || current.length) {
            missing.push(cartonField.label);
          }
        }
      }
    }
    if (missing.length) {
      throw new Error('PLM 缺少' + missing.join('、') + '，未找到有效匹配值，已停止保存草稿和提审');
    }
    return { changed, retained };
  }

  function applyManualToyEffectPacking(values, manualPacking) {
    const source = normalizeManualToyEffectPacking(manualPacking);
    if (!hasManualToyEffectPacking(source)) {
      throw new Error('请先点击“手动设置装箱数/总重”填写有效的装箱数和总重');
    }
    const changed = [];
    const missing = [];
    MAGIC_UPLOAD_PACKING_FIELDS.forEach((field) => {
      const target = findMagicUploadProductAttributeByVariable(values, field.variableName, field.attrName, field.attrId);
      if (!target) {
        missing.push(field.label + '字段');
        return;
      }
      const language = (values || []).find((item) => String(item && item.attr_id) === String(target.attr_id) && Number(item && item.language_id) === 1);
      if (!language) {
        missing.push(field.label + '中文字段');
        return;
      }
      language.value = source[field.key];
      changed.push(field.label + '=' + source[field.key] + '(手动设置)');
    });
    if (missing.length) throw new Error('商品模板中缺少' + missing.join('、') + '，无法保存手动产品效果图');
    return { changed, source };
  }

  function collectMagicUploadFileVersionIds(task) {
    const byCategory = Object.create(null);
    const add = (category, value) => {
      const normalized = normalizeMagicUploadFileVersionValue(value);
      if (normalized === null) return;
      const list = byCategory[category] || (byCategory[category] = []);
      if (!list.some((item) => String(item) === String(normalized))) list.push(normalized);
    };
    (task && task.files || []).forEach((entry) => {
      if (!entry || entry.category === '待确认' || !entry.fileVersionId) return;
      add(entry.category, entry.fileVersionId);
    });
    if (task && task.sourceFileVersionId) add('图包素材', task.sourceFileVersionId);
    return byCategory;
  }

  function getMagicUploadPayloadData(payload) {
    return payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : {};
  }

  function getMagicUploadProcureList(payload, fallback) {
    const data = payload && payload.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.list)) return data.list;
    return Array.isArray(fallback) ? fallback : [];
  }

  function sanitizeMagicUploadProcureInfos(list) {
    return (Array.isArray(list) ? list : []).map((item) => {
      if (!item || typeof item !== 'object') return item;
      const copy = cloneMagicUploadDraftValue(item);
      delete copy.company_supplier_name;
      return copy;
    });
  }

  function buildMagicUploadProductDraft(task, productContext, infoPayload, pricePayload, invoicePayload, procurePayload, contentPayload, excelPacking) {
    const info = getMagicUploadPayloadData(infoPayload);
    const price = getMagicUploadPayloadData(pricePayload);
    const invoice = getMagicUploadPayloadData(invoicePayload);
    const values = flattenMagicUploadProductAttributes(contentPayload);
    if (!values.length) throw new Error('未读取到商品模板字段，已停止保存商品草稿');
    const additions = collectMagicUploadFileVersionIds(task);
    const categories = Object.keys(additions);
    if (!categories.length) throw new Error('未获取到上传文件版本 ID，已停止保存商品草稿');
    const replaceCategories = new Set(Array.isArray(task && task.replaceCategories) ? task.replaceCategories : []);
    const changed = [];
    categories.forEach((category) => {
      const target = findMagicUploadProductAttribute(values, category);
      if (!target) throw new Error('商品模板中未找到“' + category + '”字段，已停止保存商品草稿');
      const language = values.find((item) => String(item.attr_id) === String(target.attr_id) && Number(item.language_id) === 1);
      if (!language) throw new Error('商品模板中“' + category + '”缺少中文字段，已停止保存商品草稿');
      const existing = replaceCategories.has(category) ? [] : magicUploadDraftValueList(language.value);
      const existingIds = new Set(existing.map((item) => String(item)));
      additions[category].forEach((fileVersionId) => {
        if (existingIds.has(String(fileVersionId))) return;
        existing.push(fileVersionId);
        existingIds.add(String(fileVersionId));
      });
      language.value = existing;
      changed.push(category + ':' + additions[category].length + (replaceCategories.has(category) ? '(replace)' : ''));
    });
    const packingSummary = applyMagicUploadExcelPacking(values, excelPacking, contentPayload);
    packingSummary.changed.forEach((item) => changed.push(item));
    const field = (key, fallback) => info[key] === undefined ? fallback : cloneMagicUploadDraftValue(info[key]);
    const procurementPrice = price.procurement_price === undefined ? field('procurement_price', null) : price.procurement_price;
    const invoiceItemName = invoice.invoice_item_name === undefined ? field('invoice_item_name', null) : invoice.invoice_item_name;
    const invoiceCategory = invoice.invoice_category === undefined ? field('invoice_category', null) : invoice.invoice_category;
    const procureFallback = Array.isArray(info.product_procure_infos) ? info.product_procure_infos : [];
    return {
      procurement_price: procurementPrice,
      invoice_item_name: invoiceItemName,
      invoice_category: invoiceCategory,
      product_procure_infos: sanitizeMagicUploadProcureInfos(getMagicUploadProcureList(procurePayload, procureFallback)),
      is_need_to_process_product_procure_infos: true,
      product_version_id: Number(info.product_version_id || productContext.productVersionId) || info.product_version_id || productContext.productVersionId,
      product_id: Number(productContext.productId) || productContext.productId,
      code: field('code', productContext.productCode),
      language_config: field('language_config', []),
      product_type: field('product_type', 1),
      same_style_code: field('same_style_code', null),
      style_code: field('style_code', productContext.productCode),
      is_AMZ: field('is_AMZ', false),
      brand_id: field('brand_id', null),
      category_id: field('category_id', null),
      product_group_id: field('product_group_id', null),
      virtual_classification: field('virtual_classification', null),
      financial_settlement_classification: field('financial_settlement_classification', null),
      jst_old_code: field('jst_old_code', null),
      basic_unit_id: field('basic_unit_id', null),
      purchase_unit_id: field('purchase_unit_id', null),
      sale_unit_id: field('sale_unit_id', null),
      purchase_conversion: field('purchase_conversion', null),
      sale_conversion: field('sale_conversion', null),
      is_SRS: field('is_SRS', false),
      srs_code: field('srs_code', null),
      data_source: field('data_source', null),
      srs_product_code: field('srs_product_code', null),
      srs_store_information: field('srs_store_information', null),
      srs_store_supplier: field('srs_store_supplier', null),
      attr_values: values.map((item) => ({ attr_id: item.attr_id, language_id: item.language_id, value: cloneMagicUploadDraftValue(item.value) })),
      _magicUploadChangedFields: changed,
      _magicUploadPackingSummary: packingSummary,
    };
  }

  async function saveMagicUploadProductDraft(task, productContext) {
    const context = productContext || await resolveMagicUploadProductContext(task);
    let stage = '读取商品基础信息';
    try {
      const base = '/api/Product/GetDetailInfoByEdit?product_id=' + encodeURIComponent(context.productId) + '&product_version_id=' + encodeURIComponent(context.productVersionId);
      const infoPayload = await fetchPlmJson(base);
      const info = getMagicUploadPayloadData(infoPayload);
      const categoryId = info.category_id;
      if (!info.product_id || !categoryId) throw new Error('商品草稿基础信息不完整，缺少 product_id 或 category_id');
      magicUploadLog('info', '读取商品草稿字段', task.sku + ' | product_id=' + context.productId + ' | product_version_id=' + context.productVersionId + ' | category_id=' + categoryId);
      const query = (path) => path + '&product_version_id=' + encodeURIComponent(context.productVersionId);
      stage = '读取商品模板及采购字段';
      const [contentPayload, pricePayload, invoicePayload, procurePayload] = await Promise.all([
        fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(context.productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(context.productVersionId)),
        fetchPlmJson(query('/api/Product/GetProductPriceInfo?type=1')),
        fetchPlmJson(query('/api/Product/GetProductInvoiceInfo?type=1')),
        fetchPlmJson('/api/ProductProcureInfo/GetProductProcureInfo?type=1&product_version_id=' + encodeURIComponent(context.productVersionId) + '&code=' + encodeURIComponent(task.sku)),
      ]);
      stage = '检查现有图片及装箱字段';
      const latestReplacement = getMagicUploadReplacementSnapshot(task, contentPayload);
      applyMagicUploadReplacementSnapshot(task, latestReplacement, 'ready', '');
      const currentPacking = getMagicUploadPackingFieldState(flattenMagicUploadProductAttributes(contentPayload));
      magicUploadLog('info', '商品草稿数据读取完成', task.sku + ' | 装箱数=' + (currentPacking.standardPackingQuantity || '空') + ' | 箱规=' + (currentPacking.boxGauge.join(',') || '空') + ' | 箱重=' + (currentPacking.boxWeight || '空') + ' | XLSX=' + (task.files || []).filter((entry) => entry && /\.xlsx$/i.test(entry.name || '')).length);
      stage = '读取 Excel 装箱信息';
      const excelPacking = currentPacking.standardPackingQuantity && currentPacking.boxWeight && currentPacking.boxGauge.length
        ? currentPacking
        : await readMagicUploadPackingFromTask(task);
      stage = '校验并组装商品草稿';
      const draft = buildMagicUploadProductDraft(task, context, infoPayload, pricePayload, invoicePayload, procurePayload, contentPayload, excelPacking);
      const changedFields = draft._magicUploadChangedFields || [];
      const packingSummary = draft._magicUploadPackingSummary || { changed: [], retained: [] };
      delete draft._magicUploadChangedFields;
      delete draft._magicUploadPackingSummary;
      magicUploadLog('info', '准备保存商品草稿', task.sku + ' | attr_values=' + draft.attr_values.length + ' | 文件字段=' + changedFields.join('；') + ' | 装箱字段=' + (packingSummary.changed.join('；') || '无（保留 PLM 原值）') + ' | 保留=' + (packingSummary.retained.join('；') || '无'));
      stage = '调用商品草稿保存接口';
      return await fetchPlmApiJson('/api/Product/SaveProductDraftByEdit', draft);
    } catch (error) {
      magicUploadLog('warn', '商品草稿处理失败', task.sku + ' | ' + stage + ' | ' + formatErrorDiagnostic(error));
      throw new Error(stage + '失败：' + formatErrorMessage(error));
    }
  }

  async function uploadMagicUploadTask(task) {
    if (!task.sku) throw new Error('缺少 SKU 编码，请先编辑任务');
    const data = normalizeData(loadData(task.sku) || {});
    const projectId = getProjectIdForMaterialApi(data);
    const productContext = await resolveMagicUploadProductContext(task);
    const staleEntries = (task.files || []).filter((entry) => entry.status === 'success'
      && (!entry.fileVersionId || (entry.generatedName && !isMagicGeneratedNameForSku(entry.generatedName, task.sku))));
    if (staleEntries.length) {
      staleEntries.forEach((entry) => {
        entry.status = 'pending';
        entry.error = '历史文件名与目标 SKU 不一致，已准备重新上传';
        entry.generatedName = '';
        entry.fileVersionId = '';
        entry.fileId = '';
      });
      task.submitted = false;
      task.draftSaved = false;
      magicUploadLog('warn', '发现历史错误商品绑定，准备重新上传', task.sku + ' | 文件=' + staleEntries.length);
      if (task.sourceUploaded && task.zipKey && !task.sourceGeneratedName) {
        task.sourceUploaded = false;
        task.sourceFileVersionId = '';
        magicUploadLog('warn', '历史图包绑定无法校验，准备重新上传原始 ZIP', task.sku);
      }
    }
    if (task.sourceUploaded && (!task.sourceFileVersionId || (task.sourceGeneratedName && !isMagicGeneratedNameForSku(task.sourceGeneratedName, task.sku)))) {
      task.sourceUploaded = false;
      task.sourceGeneratedName = '';
      task.sourceFileVersionId = '';
      task.submitted = false;
      task.draftSaved = false;
      magicUploadLog('warn', '发现历史错误图包绑定，准备重新上传原始 ZIP', task.sku);
    }
    if (!projectId) magicUploadLog('warn', '未找到项目 ID，仍按商品版本上传', task.sku + ' | product_version_id=' + productContext.productVersionId);
    magicUploadLog('info', '任务开始上传', task.sku + ' | projectId=' + (projectId || '无') + ' | product_version_id=' + productContext.productVersionId + ' | 文件=' + (task.files || []).length);
    task.projectId = String(projectId || '');
    await hydrateMagicUploadTaskMetrics(task);
    updateMagicUploadProgress(task);
    const entries = (task.files || []).filter((entry) => entry.status !== 'success');
    if (entries.some((entry) => entry.category === '待确认' || !entry.archiveTypeId)) throw new Error('存在待确认文件分类');
    const totalUploadItems = (task.files || []).length + (task.zipKey ? 1 : 0);
    let completedUploadItems = (task.files || []).filter((entry) => entry.status === 'success').length + (task.sourceUploaded ? 1 : 0);
    for (let index = 0; index < entries.length; index += 1) {
      if (!state.magicUploadRunning) throw new Error('已暂停');
      const entry = entries[index];
      task.step = '上传文件 ' + (completedUploadItems + 1) + '/' + totalUploadItems;
      task.currentFileName = entry.name;
      task.currentFileSize = Number(entry.size) || 0;
      task.currentFileProgress = 0;
      entry.status = 'processing';
      saveMagicUploadQueue(state.magicUploadQueue);
      updateMagicUploadProgress(task);
      try {
        const file = await getUploadFile(entry.key);
        if (!file) throw new Error('本地文件已丢失：' + entry.name);
        await uploadMagicUploadFile(task, entry, file, productContext);
        entry.status = 'success';
        entry.error = '';
        task.uploadedBytes = (Number(task.uploadedBytes) || 0) + Math.max(0, Number(entry.size) || 0);
        completedUploadItems += 1;
        task.currentFileName = '';
        task.currentFileSize = 0;
        task.currentFileProgress = 0;
        updateMagicUploadProgress(task);
      } catch (error) {
        entry.status = 'error';
        entry.error = formatErrorMessage(error);
        throw error;
      }
    }
    if (!state.magicUploadRunning) throw new Error('已暂停');
    if (task.zipKey && !task.sourceUploaded) {
      task.step = '上传原始 ZIP（' + (completedUploadItems + 1) + '/' + totalUploadItems + '）';
      const zipFile = await getUploadFile(task.zipKey);
      if (zipFile) {
        const zipEntry = { name: task.zipName, category: '图包素材', archiveTypeId: 7, status: 'processing', key: task.zipKey };
        task.currentFileName = task.zipName;
        task.currentFileSize = Number(zipFile.size) || Number(task.sourceSize) || 0;
        task.currentFileProgress = 0;
        updateMagicUploadProgress(task);
        await uploadMagicUploadFile(task, zipEntry, zipFile, productContext);
        task.sourceGeneratedName = zipEntry.generatedName || '';
        task.sourceFileVersionId = zipEntry.fileVersionId || '';
        task.sourceUploaded = true;
        task.uploadedBytes = (Number(task.uploadedBytes) || 0) + Math.max(0, Number(zipFile.size) || Number(task.sourceSize) || 0);
        completedUploadItems += 1;
      }
    }
    task.currentFileName = '';
    task.currentFileSize = 0;
    task.currentFileProgress = 0;
    updateMagicUploadProgress(task);
    if (task.zipKey && !task.sourceUploaded) throw new Error('原始 ZIP 文件已丢失，无法保存图包素材');
    if (!task.draftSaved) {
      if (!state.magicUploadRunning) throw new Error('已暂停');
      task.step = '素材上传完成，正在保存商品草稿';
      magicUploadLog('info', '开始保存商品草稿', task.sku + ' | product_id=' + productContext.productId + ' | product_version_id=' + productContext.productVersionId);
      const savedDraft = await saveMagicUploadProductDraft(task, productContext);
      task.draftSaved = true;
      if (savedDraft && savedDraft.data && savedDraft.data.product_version_id) {
        task.productVersionId = String(savedDraft.data.product_version_id);
        productContext.productVersionId = task.productVersionId;
      }
      task.updatedAt = Date.now();
      saveMagicUploadQueue(state.magicUploadQueue);
      magicUploadLog('success', '商品草稿保存完成', task.sku + ' | 文件已写入商品字段；下一步提审');
    }
    if (!task.submitted) {
      if (!state.magicUploadRunning) throw new Error('已暂停');
      task.step = '商品草稿已保存，正在提审';
      magicUploadLog('info', '商品草稿已保存，开始提审', task.sku);
      await submitMagicUploadTask(task, productContext);
      task.submitted = true;
    }
  }

  async function submitMagicUploadTask(task, productContext) {
    const context = productContext || await resolveMagicUploadProductContext(task);
    magicUploadLog('info', '调用提审接口', task.sku + ' | product_id=' + context.productId);
    await fetchPlmApiJson('/api/Product/Arraign', { product_id: Number(context.productId) || context.productId });
    addLog('success', '魔法上传并提审成功', task.sku + ' | product_id=' + context.productId);
  }

  function normalizeMagicUploadEffectPath(path) {
    return String(path || '').replace(/^\/+/, '');
  }

  function buildMagicUploadBomMaterialPayload(material) {
    return {
      id: material.id,
      pics: Array.isArray(material.pics) ? material.pics : (material.pics || null),
      code: material.code,
      material_id: material.material_id,
      material_type: material.material_type,
      usage_value: material.usage_value,
      product_main_id: material.product_main_id ? material.product_main_id : null,
      type: material.type,
    };
  }

  async function uploadMagicUploadFile(task, entry, file, productContext) {
    const uploadStartedAt = Date.now();
    entry.size = Number(entry.size) || Number(file && file.size) || 0;
    task.currentFileName = entry.name || file.name || '';
    task.currentFileSize = entry.size;
    task.currentFileProgress = 0;
    updateMagicUploadProgress(task);
    const extension = getMagicUploadFileExtension(file.name || entry.name);
    const category = entry.category || (extension === '.zip' ? '图包素材' : '待确认');
    const rule = getMagicUploadRule(category, extension);
    if (!rule) throw new Error('无法确定上传区域：' + (entry.name || file.name));
    const context = productContext || await resolveMagicUploadProductContext(task);
    magicUploadLog('info', '开始上传文件', task.sku + ' | ' + category + ' | ' + (file.name || entry.name));
    const namePayload = await fetchPlmApiJson('/api/Product/GenerateFileNameByRule', {
      source: 2,
      source_id: Number(context.productVersionId) || context.productVersionId,
      file_name_rules: [rule.rule, '_', '商品编码', '_', '品牌', '_', '商品名称', '_', '日期'],
      file_extension_names: [extension],
      product_code: null,
    });
    const generatedName = namePayload && Array.isArray(namePayload.data) ? namePayload.data[0] : '';
    if (!generatedName) throw new Error('PLM 未返回生成文件名');
    if (!isMagicGeneratedNameForSku(generatedName, task.sku)) {
      magicUploadLog('error', 'PLM 商品上下文校验失败', task.sku + ' | product_version_id=' + context.productVersionId + ' | 返回文件名=' + generatedName);
      throw new Error('PLM 生成文件名与目标 SKU 不一致，已阻止上传：' + generatedName);
    }
    const sharedOssKey = [entry.key || '', category, extension, file.name || entry.name || '', Number(file.size) || 0].join('|');
    const sharedOss = await getMagicUploadSharedOssFile(sharedOssKey, file, entry, category, task);
    const bindPayload = await fetchPlmApiJson('/api/Product/UploadArchiveFileFromExternal', { archive_type_id: rule.archiveTypeId, source: 2, file_display_names: [generatedName], file_url_list: [{ file_original_name: sharedOss.originalFileName, file_save_full_path: sharedOss.objectName }] });
    const records = Array.isArray(bindPayload && bindPayload.data) ? bindPayload.data : (bindPayload && bindPayload.data ? [bindPayload.data] : []);
    const record = records[0] || {};
    const fileVersionId = record.file_version_id || record.archive_file_version_id || record.id;
    if (!fileVersionId) throw new Error('PLM 未返回 file_version_id，已停止保存商品草稿');
    entry.generatedName = generatedName;
    entry.fileVersionId = String(fileVersionId);
    entry.fileId = String(record.file_id || record.archive_file_id || '');
    task.currentFileProgress = 1;
    recordMagicUploadMetric(task, entry, Date.now() - uploadStartedAt);
    updateMagicUploadTaskEstimate(task);
    magicUploadLog('info', '文件归档完成，待保存商品草稿', task.sku + ' | ' + category + ' | file_version_id=' + entry.fileVersionId + ' | ' + generatedName);
    return entry.fileVersionId;
  }

  async function getMagicUploadSharedOssFile(cacheKey, file, entry, category, task) {
    const existing = magicUploadSharedOssCache.get(cacheKey);
    if (existing) {
      existing.listeners.add((percent) => {
        task.currentFileProgress = Math.min(1, Math.max(0, Number(percent) || 0));
        updateMagicUploadProgress(task);
      });
      magicUploadLog('info', '复用同一源文件的 OSS 上传', task.sku + ' | 分类=' + category + ' | 源文件=' + (file.name || entry.name));
      return existing.promise;
    }

    const shared = { listeners: new Set(), promise: null };
    shared.listeners.add((percent) => {
      task.currentFileProgress = Math.min(1, Math.max(0, Number(percent) || 0));
      updateMagicUploadProgress(task);
    });
    shared.promise = (async () => {
      const secretPayload = await fetchPlmApiJson('/api/Common/GetOssClientSecretKey', { upload_file_type: 30 });
      const secret = secretPayload && secretPayload.data;
      if (!secret || !secret.bucket || !secret.file_directory) throw new Error('未获取到 OSS 临时授权');
      const declaredMaxBytes = Number(secret.max_file_size) || 0;
      // 按文件类型设置上传上限：OSS 授权接口的 max_file_size(20MB) 是通用默认回复，
      // 按类型设置助手上限：XLSX/图片 50MB、动图/视频 200MB、图包素材 150MB。
      const extension = getMagicUploadFileExtension(file.name || entry.name);
      const isImageFile = /\.(?:jpe?g|png|webp|bmp)$/i.test(extension);
      const isMediaFile = category === '视频' || category === '动图' || /\.(?:mp4|mov|avi|webm|gif)$/i.test(extension);
      let uploadMaxBytes;
      if (category === '图包素材') uploadMaxBytes = MAGIC_UPLOAD_ARCHIVE_MAX_FILE_BYTES;
      else if (/\.xlsx$/i.test(extension)) uploadMaxBytes = MAGIC_UPLOAD_XLSX_MAX_FILE_BYTES;
      else if (isMediaFile) uploadMaxBytes = MAGIC_UPLOAD_MEDIA_MAX_FILE_BYTES;
      else if (isImageFile) uploadMaxBytes = MAGIC_UPLOAD_IMAGE_MAX_FILE_BYTES;
      else uploadMaxBytes = declaredMaxBytes || MAGIC_UPLOAD_MAX_FILE_BYTES;
      if (file.size > uploadMaxBytes) throw new Error('文件超过 ' + Math.round(uploadMaxBytes / 1024 / 1024) + 'MB 上限：' + (file.name || entry.name));
      if (declaredMaxBytes && declaredMaxBytes < uploadMaxBytes) magicUploadLog('info', '采用文件类型上限', '接口通用提示=' + Math.round(declaredMaxBytes / 1024 / 1024) + 'MB；' + category + '/' + (extension || '无扩展名') + ' 上限=' + Math.round(uploadMaxBytes / 1024 / 1024) + 'MB');
      const Oss = getLazyExternalRuntime('oss') || await ensureLazyExternalScript('oss').catch(() => null);
      if (typeof Oss !== 'function') throw new Error('OSS 上传组件未加载，请刷新脚本');
      const objectName = String(secret.file_directory).replace(/^\/+/, '') + '/' + createMagicObjectName(getMagicUploadFileExtension(file.name || entry.name));
      const client = new Oss({ region: 'oss-cn-shenzhen', bucket: secret.bucket, accessKeyId: secret.access_key_id, accessKeySecret: secret.access_key_secret, stsToken: secret.security_token, endpoint: 'https://oss-cn-shenzhen.aliyuncs.com', secure: true, retryMax: OSS_UPLOAD_SDK_RETRY_MAX, timeout: OSS_UPLOAD_TIMEOUT_MS });
      await multipartUploadWithRetry(client, objectName, file, {
        partSize: 2 * 1024 * 1024,
        parallel: 2,
        progress: (percent) => shared.listeners.forEach((listener) => listener(percent)),
      }, (error, retryCount, delay, checkpoint) => {
        const completedParts = checkpoint && Array.isArray(checkpoint.doneParts) ? checkpoint.doneParts.length : 0;
        magicUploadLog('warn', 'OSS 分片上传失败，自动重试', (file.name || entry.name) + ' | 第' + retryCount + '/' + OSS_UPLOAD_RETRY_MAX + '次 | ' + Math.round(delay / 1000) + '秒后继续 | 已完成分片=' + completedParts + ' | ' + formatErrorMessage(error));
      });
      const originalFileName = file.name || entry.name;
      await fetchPlmApiJson('/api/Common/SaveUploadFileInfo', { upload_file_type: 30, oss_path: objectName, original_file_name: originalFileName });
      magicUploadLog('info', '源文件 OSS 上传完成，可供多个 SKU 绑定', originalFileName + ' | oss_path=' + objectName);
      return { objectName, originalFileName };
    })().catch((error) => {
      magicUploadSharedOssCache.delete(cacheKey);
      throw error;
    });
    magicUploadSharedOssCache.set(cacheKey, shared);
    return shared.promise;
  }

  function createMagicObjectName(extension) {
    const random = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(16) + Math.random().toString(16).slice(2)).slice(0, 32);
    return random + (extension || '');
  }
