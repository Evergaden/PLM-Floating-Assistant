
  function loadData(sku) {
    if (!sku) return null;
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(STORAGE_PREFIX + sku, null);
      const raw = localStorage.getItem(STORAGE_PREFIX + sku);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      reportDiagnostic(error, { feature: 'storage', action: 'load-sku-cache', sku });
      return null;
    }
  }

  function collectTrackedDataChanges(previous, next, options) {
    if (!previous || !next) return [];
    const opts = options || {};
    const tracked = ['brand', 'name', 'manualCategory', 'packageCode', 'printCode', 'packageSizeText', 'printSizeText', 'packageLength', 'packageWidth', 'packageHeight', 'productLength', 'productWidth', 'productHeight', 'netContent', 'grossWeight', 'englishName', 'ingredientChinese', 'ingredientEnglish', 'referenceUrl', 'infringementImageUrls', 'infringementCopywriting'];
    const source = opts.changeSource || '自动获取';
    const changedAt = new Date().toLocaleString();
    return tracked.reduce((changes, key) => {
      const before = normalizeTrackedDataValue(key, previous[key]);
      const after = normalizeTrackedDataValue(key, next[key]);
      if (trackedDataValuesEqual(key, before, after) || (!before && !opts.trackEmptyChanges)) return changes;
      changes.push({ key, label: getSkuDataFieldLabel(key), before, after, source, changedAt });
      return changes;
    }, []);
  }

  function saveData(sku, data, options) {
    if (!sku || !data) return;
    const opts = options || {};
    const previous = loadData(sku);
    const previousNormalized = previous ? normalizeData(previous) : null;
    const nowMs = Date.now();
    const nowText = new Date(nowMs).toLocaleString();
    const normalized = normalizeData({ ...data, updatedAt: data.updatedAt || nowText, updatedAtMs: data.updatedAtMs || nowMs });
    const previousAcknowledgedSignature = String(previousNormalized && previousNormalized.recentFieldChangesAcknowledgedSignature || '').trim();
    if (previousNormalized && !Object.prototype.hasOwnProperty.call(data, 'recentFieldChangesAcknowledgedSignature')) {
      normalized.recentFieldChangesAcknowledgedSignature = String(previousNormalized.recentFieldChangesAcknowledgedSignature || '');
    }
    const previousInfringement = getInfringementSnapshot(previousNormalized);
    const nextInfringement = getInfringementSnapshot(normalized);
    const infringementChanged = !previousNormalized || getInfringementSnapshotSignature(previousInfringement) !== getInfringementSnapshotSignature(nextInfringement);
    if (nextInfringement.imageUrls.length || nextInfringement.copywriting) {
      if (infringementChanged || !normalized.infringementUpdatedAt) {
        normalized.infringementUpdatedAt = nowText;
        normalized.infringementUpdatedAtMs = nowMs;
      }
    }
    normalized.infringementHistory = appendInfringementHistory(previousNormalized, normalized, opts);
    if (!opts.suppressChangeTracking && previousNormalized) {
      const storedChangesSource = Object.prototype.hasOwnProperty.call(data, 'recentFieldChanges') ? normalized : previousNormalized;
      normalized.recentFieldChanges = getStoredDataChanges(storedChangesSource);
    }
    const detectedChanges = opts.suppressChangeTracking ? [] : collectTrackedDataChanges(previousNormalized, normalized, opts);
    if (!detectedChanges.length && previousAcknowledgedSignature) {
      // An async PLM read may finish with a snapshot captured before the user
      // acknowledged the update. Keep the acknowledgement from the latest
      // persisted record instead of reactivating that stale change list.
      normalized.recentFieldChanges = getStoredDataChanges(previousNormalized);
      normalized.recentFieldChangesAcknowledgedSignature = previousAcknowledgedSignature;
    }
    if (detectedChanges.length) {
      normalized.recentFieldChangesAcknowledgedSignature = '';
      const combined = detectedChanges.concat(getStoredDataChanges(normalized));
      const seen = new Set();
      normalized.recentFieldChanges = combined.filter((item) => {
        const identity = [item.key, item.before, item.after].join('|');
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      }).slice(0, 20);
    }
    const previousUpdateLog = previousNormalized && Array.isArray(previousNormalized.dataUpdateLog) && previousNormalized.dataUpdateLog.length
      ? previousNormalized.dataUpdateLog
      : normalized.dataUpdateLog;
    const existingUpdateLog = normalizeDataUpdateLog(previousUpdateLog);
    if (detectedChanges.length) {
      existingUpdateLog.push({
        id: 'data-update-' + nowMs + '-' + Math.random().toString(36).slice(2, 7),
        changedAt: detectedChanges[0].changedAt || nowText,
        changedAtMs: nowMs,
        source: opts.changeSource || '自动获取',
        changes: detectedChanges,
      });
    }
    normalized.dataUpdateLog = normalizeDataUpdateLog(existingUpdateLog);
    try {
      saveDataDirect(sku, normalized);
      const viewingSku = state.selectedSku || (state.data && state.data.sku) || '';
      if (!viewingSku || viewingSku === sku) {
        state.data = normalized;
        state.selectedSku = sku;
      }
      upsertIndex(normalized);
      if (!opts.suppressDataQuality) recordDataQuality(normalized, 'saveData');
      queueCloudBackup();
      scheduleDesktopBridgeSnapshot();
      if (detectedChanges.length) {
        addLog('warn', 'SKU 数据发生变化', sku + ' | ' + detectedChanges.map((item) => item.label + '：' + (item.before || '未识别') + ' → ' + (item.after || '已清空')).join('；'));
      }
    } catch (error) {
      console.warn('PLM floating helper save failed:', error);
      addLog('error', '\u7f13\u5b58\u5546\u54c1\u5931\u8d25', (sku || '') + ' ' + formatErrorMessage(error));
    }
  }

  function saveDataDirect(sku, data) {
    const indexed = state.index.find((item) => item && item.sku === sku);
    preserveSkuAcquiredTime(data, indexed || loadData(sku), Date.now());
    if (typeof GM_setValue === 'function') GM_setValue(STORAGE_PREFIX + sku, data);
    else localStorage.setItem(STORAGE_PREFIX + sku, JSON.stringify(data));
  }

  function loadPosition() {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(POSITION_KEY, null);
      const raw = localStorage.getItem(POSITION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function savePosition(pos) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(POSITION_KEY, pos);
      else localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
    } catch (error) {
      console.warn('PLM floating helper position save failed:', error);
    }
  }

  function applySavedPosition(panel) {
    const pos = loadPosition();
    if (!pos) {
      // Scale Violet's preferred full-screen layout, while clamping it into any smaller viewport.
      const initialWidth = clamp(state.panelSize?.width || DEFAULT_PANEL_WIDTH, 520, Math.min(1180, window.innerWidth - 24));
      const initialHeight = clamp(state.panelSize?.height || DEFAULT_PANEL_HEIGHT, 520, getPanelMaxHeight());
      const left = clamp(Math.round(window.innerWidth * INITIAL_LAYOUT.panelLeftRatio), 8, Math.max(8, window.innerWidth - initialWidth - 8));
      const top = clamp(Math.round(window.innerHeight * INITIAL_LAYOUT.panelTopRatio), 8, Math.max(8, window.innerHeight - initialHeight - 8));
      panel.style.right = Math.max(8, window.innerWidth - initialWidth - left) + 'px';
      panel.style.bottom = Math.max(8, window.innerHeight - initialHeight - top) + 'px';
      return;
    }
    if (Number.isFinite(pos.right)) panel.style.right = pos.right + 'px';
    if (Number.isFinite(pos.bottom)) panel.style.bottom = pos.bottom + 'px';
  }

  function getCurrentLayoutSnapshot() {
    const panel = ensurePanel();
    const panelRect = panel.getBoundingClientRect();
    const panelStyle = getComputedStyle(panel);
    const launcher = document.getElementById(LAUNCHER_ID);
    const launcherRect = launcher && launcher.getBoundingClientRect();
    const right = Number.parseFloat(panelStyle.right);
    const bottom = Number.parseFloat(panelStyle.bottom);
    const panelRight = Number.isFinite(right) ? right : Math.max(0, window.innerWidth - panelRect.right);
    const panelBottom = Number.isFinite(bottom) ? bottom : Math.max(0, window.innerHeight - panelRect.bottom);
    const launcherLeft = launcherRect ? Math.round(launcherRect.left) : (loadLauncherPosition()?.left ?? 0);
    const launcherTop = launcherRect ? Math.round(launcherRect.top) : (loadLauncherPosition()?.top ?? 0);
    return [
      'PLM 悬浮助手默认布局',
      '窗口位置：right ' + Math.round(panelRight) + 'px / bottom ' + Math.round(panelBottom) + 'px',
      '窗口尺寸：' + Math.round(panelRect.width) + ' x ' + Math.round(panelRect.height),
      '唤起按钮：left ' + launcherLeft + 'px / top ' + launcherTop + 'px',
      '左右分隔栏：' + Math.round(state.splitWidth) + 'px',
    ].join('\n');
  }

  function positionLauncher(launcher) {
    if (!launcher) return;
    launcher.classList.add('is-floating');
    if (launcher.parentElement !== document.documentElement) document.documentElement.appendChild(launcher);
    const saved = loadLauncherPosition();
    if (saved) {
      launcher.style.left = saved.left + 'px';
      launcher.style.top = saved.top + 'px';
      return;
    }
    const buttonWidth = 86;
    const buttonHeight = 34;
    launcher.style.left = clamp(Math.round(window.innerWidth * INITIAL_LAYOUT.launcherLeftRatio), 8, Math.max(8, window.innerWidth - buttonWidth - 8)) + 'px';
    launcher.style.top = clamp(Math.round(window.innerHeight * INITIAL_LAYOUT.launcherTopRatio), 8, Math.max(8, window.innerHeight - buttonHeight - 8)) + 'px';
  }

  function loadLauncherPosition() {
    try {
      const raw = typeof GM_getValue === 'function' ? GM_getValue(LAUNCHER_POSITION_KEY, null) : JSON.parse(localStorage.getItem(LAUNCHER_POSITION_KEY) || 'null');
      if (!raw || !Number.isFinite(raw.left) || !Number.isFinite(raw.top)) return null;
      return {
        left: clamp(raw.left, 8, Math.max(8, window.innerWidth - 40)),
        top: clamp(raw.top, 8, Math.max(8, window.innerHeight - 24)),
      };
    } catch (error) {
      return null;
    }
  }

  function saveLauncherPosition(pos) {
    const value = {
      left: clamp(pos.left, 8, Math.max(8, window.innerWidth - 40)),
      top: clamp(pos.top, 8, Math.max(8, window.innerHeight - 24)),
    };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LAUNCHER_POSITION_KEY, value);
      else localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('PLM floating helper launcher position save failed:', error);
    }
  }

  function getPanelSizeStorageKey() {
    return isWorkspaceLayoutEnabled() ? WORKSPACE_SIZE_KEY : SIZE_KEY;
  }

  function loadPanelSize() {
    try {
      const key = getPanelSizeStorageKey();
      let value = typeof GM_getValue === 'function' ? GM_getValue(key, null) : JSON.parse(localStorage.getItem(key) || 'null');
      // Seed the new view from the existing size until it is resized manually.
      if (!value && key !== SIZE_KEY) value = typeof GM_getValue === 'function' ? GM_getValue(SIZE_KEY, null) : JSON.parse(localStorage.getItem(SIZE_KEY) || 'null');
      if (value && Number.isFinite(value.width) && Number.isFinite(value.height)) {
        // 仅把旧版内置默认值迁移到新默认值，用户主动保存过的尺寸保持不变。
        if (Number(value.width) === 686 && Number(value.height) === 906) {
          return { width: DEFAULT_PANEL_WIDTH, height: Math.min(DEFAULT_PANEL_HEIGHT, getPanelMaxHeight()) };
        }
        return {
          width: value.width,
          height: value.height,
        };
      }
      return { width: DEFAULT_PANEL_WIDTH, height: Math.min(DEFAULT_PANEL_HEIGHT, getPanelMaxHeight()) };
    } catch (error) {
      return { width: DEFAULT_PANEL_WIDTH, height: Math.min(DEFAULT_PANEL_HEIGHT, getPanelMaxHeight()) };
    }
  }

  function savePanelSize(size) {
    const maxHeight = getPanelMaxHeight();
    const value = {
      width: clamp(size.width, 520, Math.min(1180, window.innerWidth - 24)),
      height: clamp(size.height, 520, maxHeight),
    };
    state.panelSize = value;
    try {
      const key = getPanelSizeStorageKey();
      if (typeof GM_setValue === 'function') GM_setValue(key, value);
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('PLM floating helper size save failed:', error);
    }
  }

  function applyPanelSize(panel) {
    if (!state.panelSize) return;
    const height = clamp(state.panelSize.height, 520, getPanelMaxHeight());
    const width = clamp(state.panelSize.width, 520, Math.min(1180, window.innerWidth - 24));
    panel.style.width = width + 'px';
    panel.style.height = height + 'px';
    panel.style.maxHeight = getPanelMaxHeight() + 'px';
    panel.classList.toggle('is-narrow-panel', width < 920);
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.height = 'auto';
  }

  function getPanelMaxHeight() {
    return Math.max(520, Math.floor(window.innerHeight * 0.96));
  }

  function loadSplitWidth() {
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue(SPLIT_KEY, INITIAL_LAYOUT.splitWidth) : Number(localStorage.getItem(SPLIT_KEY) || INITIAL_LAYOUT.splitWidth);
      return clamp(Number(value) || INITIAL_LAYOUT.splitWidth, 110, 260);
    } catch (error) {
      return INITIAL_LAYOUT.splitWidth;
    }
  }

  function saveSplitWidth(width) {
    const value = clamp(width, 110, 260);
    state.splitWidth = value;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(SPLIT_KEY, value);
      else localStorage.setItem(SPLIT_KEY, String(value));
    } catch (error) {
      console.warn('PLM floating helper split save failed:', error);
    }
  }

  function applySplitWidth(panel) {
    const main = panel.querySelector('.pfh-main');
    if (main) main.style.setProperty('--pfh-list-width', state.splitWidth + 'px');
    const splitter = panel.querySelector('.pfh-splitter');
    if (splitter) splitter.classList.toggle('is-dragging', Boolean(state.splitDragging));
  }

  function makeSplitterDraggable(panel, splitter) {
    state.splitDragging = false;
    splitter.addEventListener('mousedown', (event) => {
      state.splitDragging = true;
      state.ignoreOutsideClickUntil = Date.now() + 500;
      event.preventDefault();
      event.stopPropagation();
    });
    document.addEventListener('mousemove', (event) => {
      if (!state.splitDragging) return;
      const main = panel.querySelector('.pfh-main');
      if (!main) return;
      const rect = main.getBoundingClientRect();
      const width = clamp(event.clientX - rect.left, 110, Math.min(260, rect.width - 220));
      state.splitWidth = width;
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!state.splitDragging) return;
      state.splitDragging = false;
      saveSplitWidth(state.splitWidth);
      state.ignoreOutsideClickUntil = Date.now() + 300;
      applySplitWidth(panel);
    });
  }

  function makePanelResizable(panel) {
    let dragging = false;
    let direction = '';
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startRight = 0;
    let startBottom = 0;
    panel.querySelectorAll('.pfh-resize-handle').forEach((resizer) => resizer.addEventListener('mousedown', (event) => {
      dragging = true;
      direction = resizer.dataset.resizeDir || 'se';
      state.ignoreOutsideClickUntil = Date.now() + 500;
      startX = event.clientX;
      startY = event.clientY;
      const rect = panel.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      startRight = Number.parseFloat(getComputedStyle(panel).right) || 0;
      startBottom = Number.parseFloat(getComputedStyle(panel).bottom) || 0;
      event.preventDefault();
      event.stopPropagation();
    }));
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      let width = startWidth;
      let height = startHeight;
      let right = startRight;
      let bottom = startBottom;
      const minWidth = 520;
      const maxWidth = Math.min(1180, window.innerWidth - 24);
      const maxHeight = getPanelMaxHeight();
      if (direction.includes('w')) width = startWidth - dx;
      if (direction.includes('e')) {
        width = startWidth + dx;
        right = startRight - dx;
      }
      if (direction.includes('n')) height = startHeight - dy;
      if (direction.includes('s')) {
        height = startHeight + dy;
        bottom = startBottom - dy;
      }
      width = clamp(width, minWidth, maxWidth);
      height = clamp(height, 520, maxHeight);
      right = Math.max(0, Math.min(window.innerWidth - width - 8, right));
      bottom = Math.max(0, Math.min(window.innerHeight - height - 8, bottom));
      state.panelSize = { width, height };
      panel.style.right = right + 'px';
      panel.style.bottom = bottom + 'px';
      applyPanelSize(panel);
      applySplitWidth(panel);
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      savePanelSize(state.panelSize);
      addLog('info', '窗口大小已保存', Math.round(state.panelSize.width) + ' x ' + Math.round(state.panelSize.height));
      savePosition({
        right: Number.parseFloat(getComputedStyle(panel).right) || 0,
        bottom: Number.parseFloat(getComputedStyle(panel).bottom) || 0,
      });
      state.ignoreOutsideClickUntil = Date.now() + 300;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeDraggable(panel, handle) {
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;
    let dragging = false;
    handle.addEventListener('mousedown', (event) => {
      if (event.target.tagName === 'BUTTON') return;
      if (event.target !== handle) return;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startRight = Number.parseFloat(getComputedStyle(panel).right) || 0;
      startBottom = Number.parseFloat(getComputedStyle(panel).bottom) || 0;
      event.preventDefault();
    });
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      panel.style.right = Math.max(0, startRight - (event.clientX - startX)) + 'px';
      panel.style.bottom = Math.max(0, startBottom - (event.clientY - startY)) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      savePosition({
        right: Number.parseFloat(getComputedStyle(panel).right) || 0,
        bottom: Number.parseFloat(getComputedStyle(panel).bottom) || 0,
      });
    });
  }

  function makeLauncherDraggable(launcher) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    let moved = false;
    launcher.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      startX = event.clientX;
      startY = event.clientY;
      const rect = launcher.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      moved = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const left = clamp(startLeft + dx, 8, Math.max(8, window.innerWidth - launcher.offsetWidth - 8));
      const top = clamp(startTop + dy, 8, Math.max(8, window.innerHeight - launcher.offsetHeight - 8));
      launcher.style.left = left + 'px';
      launcher.style.top = top + 'px';
      event.preventDefault();
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        state.launcherSuppressClickUntil = Date.now() + 250;
        const rect = launcher.getBoundingClientRect();
        saveLauncherPosition({ left: rect.left, top: rect.top });
      }
    });
  }

  function getVisibleText(root) {
    return normalizeText((root && (root.innerText || root.textContent)) || '');
  }

  function getNodeText(root) {
    if (!root) return '';
    return normalizeText([root.innerText, root.textContent, root.getAttribute && root.getAttribute('title'), root.getAttribute && root.getAttribute('aria-label')]
      .filter(Boolean)
      .join('\n'));
  }

  function normalizeText(text) {
    return String(text || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').trim();
  }

  function truncateFileName(name, max) {
    const text = String(name || '');
    if (!text) return '';
    const limit = Math.max(8, Number(max) || 30);
    if (text.length <= limit) return text;
    const head = Math.ceil(limit * 0.6);
    const tail = limit - head - 1;
    return text.slice(0, head) + '…' + text.slice(-tail);
  }

  function compactText(text) {
    return normalizeText(text).replace(/\s+/g, ' ');
  }

  function compactLabel(text) {
    return compactText(text).replace(/\*+$/g, '').trim();
  }

  function trimNumber(num) {
    return Number(num).toFixed(2).replace(/\.?0+$/, '');
  }

  function isVisibleElement(el) {
    if (!el || !el.isConnected) return false;
    let node = el;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      node = node.parentElement;
    }
    return el.getClientRects().length > 0;
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }


})();
