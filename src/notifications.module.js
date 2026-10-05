
  const NOTIFICATION_CACHE_KEY = 'plm-floating-helper:notifications:v1';
  const NOTIFICATION_REFRESH_MS = 5 * 60 * 1000;
  const HOME_GREETING_CACHE_KEY = 'plm-floating-helper:home-greetings:v1';
  const HOME_TODO_KEY = 'plm-floating-helper:home-todos:v1';
  let homeCarouselTimer = 0;
  let homeClockTimer = 0;
  let homeClockSyncTimer = 0;
  let homeClockOffsetMs = 0;
  let homeClockSyncedAt = 0;
  let homeClockSyncing = false;
  const HOME_GREETING_REFRESH_MS = 15 * 60 * 1000;
  const DEFAULT_HOME_GREETINGS = Object.freeze([
    Object.freeze({ greetingId: 'morning', label: '早上', startTime: '05:00', endTime: '11:00', title: '早上好，今天也一起推进吧', subtitle: '常用功能与今日进度集中在这里', enabled: true, sortOrder: 10 }),
    Object.freeze({ greetingId: 'noon', label: '中午', startTime: '11:00', endTime: '14:00', title: '中午好，今天也一起推进吧', subtitle: '常用功能与今日进度集中在这里', enabled: true, sortOrder: 20 }),
    Object.freeze({ greetingId: 'afternoon', label: '下午', startTime: '14:00', endTime: '18:00', title: '下午好，今天也一起推进吧', subtitle: '常用功能与今日进度集中在这里', enabled: true, sortOrder: 30 }),
    Object.freeze({ greetingId: 'evening', label: '晚上', startTime: '18:00', endTime: '05:00', title: '晚上好，今天也一起推进吧', subtitle: '常用功能与今日进度集中在这里', enabled: true, sortOrder: 40 }),
  ]);
  const BACKEND_UPDATE_PROMPTED_KEY = 'plm-floating-helper:backend-update-prompted-id';
  const GREASYFORK_SCRIPT_URL = 'https://greasyfork.org/zh-CN/scripts/582138-plm%E6%82%AC%E6%B5%AE%E5%8A%A9%E6%89%8B';
  const SCRIPT_UPDATE_META_URL = 'https://update.greasyfork.org/scripts/582138/PLM%E6%82%AC%E6%B5%AE%E5%8A%A9%E6%89%8B.meta.js';
  const SCRIPT_UPDATE_CACHE_KEY = 'plm-floating-helper:script-update:v1';
  const SCRIPT_UPDATE_REFRESH_MS = 15 * 60 * 1000;
  let scriptUpdateCache = loadScriptUpdateCache();
  let scriptUpdateChecking = false;
  let scriptUpdateError = '';
  let stopScriptUpdateConfetti = null;

  function loadScriptUpdateCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(SCRIPT_UPDATE_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(SCRIPT_UPDATE_CACHE_KEY) || 'null');
      return {
        version: /^\d+(?:\.\d+)*$/.test(String(saved && saved.version || '')) ? String(saved.version) : '',
        checkedAt: Number(saved && saved.checkedAt || 0) || 0,
      };
    } catch (error) {
      return { version: '', checkedAt: 0 };
    }
  }

  function compareScriptVersions(left, right) {
    const a = String(left || '').split('.').map(Number);
    const b = String(right || '').split('.').map(Number);
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      const difference = (a[index] || 0) - (b[index] || 0);
      if (difference) return Math.sign(difference);
    }
    return 0;
  }

  function isScriptUpdateAvailable() {
    return Boolean(scriptUpdateCache.version && compareScriptVersions(scriptUpdateCache.version, SCRIPT_VERSION) > 0);
  }

  function refreshScriptUpdateUi() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    updateSettingsNotice(panel);
    const card = panel.querySelector('.pfh-script-update-card');
    if (card) card.outerHTML = renderScriptUpdateCard();
  }

  function celebrateScriptUpdate() {
    showToast(isScriptUpdateAvailable() ? '发现新版本 v' + scriptUpdateCache.version + '，请前往更新' : '已是最新版本 v' + SCRIPT_VERSION);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (stopScriptUpdateConfetti) stopScriptUpdateConfetti();
    const panel = document.getElementById(PANEL_ID);
    const bounds = panel && panel.getBoundingClientRect();
    if (!bounds || !bounds.width || !bounds.height || panel.style.display === 'none') return;
    const width = bounds.width;
    const height = bounds.height;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.className = 'pfh-update-confetti';
    canvas.style.cssText = 'position:fixed;left:' + bounds.left + 'px;top:' + bounds.top + 'px;width:' + width + 'px;height:' + height + 'px;display:block;background:transparent!important;pointer-events:none!important;z-index:2147483647;';
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(pixelRatio, pixelRatio);
    document.documentElement.appendChild(canvas);
    const colors = ['#7c3aed', '#a78bfa', '#22c55e', '#38bdf8', '#fbbf24', '#fb7185'];
    const spread = Math.min(width / 700, 1);
    const particles = Array.from({ length: 88 }, (_, index) => ({
      originX: index < 44 ? width * .08 : width * .92,
      originY: height - 18,
      delay: Math.random() * 380,
      velocityX: (index < 44 ? 1 : -1) * (.03 + Math.random() * .2) * spread,
      velocityY: -(.56 + Math.random() * .34),
      gravity: .0003 + Math.random() * .00013,
      width: 4 + Math.random() * 5,
      height: 7 + Math.random() * 8,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - .5) * .014,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const startedAt = performance.now();
    let frameId = 0;
    const cleanup = () => {
      window.cancelAnimationFrame(frameId);
      canvas.remove();
      if (stopScriptUpdateConfetti === cleanup) stopScriptUpdateConfetti = null;
    };
    stopScriptUpdateConfetti = cleanup;
    const draw = (now) => {
      const elapsed = now - startedAt;
      if (elapsed >= 2500) { cleanup(); return; }
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        const age = elapsed - particle.delay;
        if (age < 0) return;
        const x = particle.originX + particle.velocityX * age;
        const y = particle.originY + particle.velocityY * age + particle.gravity * age * age / 2;
        context.save();
        context.globalAlpha = Math.max(0, Math.min(1, age / 120, (2200 - age) / 420));
        context.translate(x, y);
        context.rotate(particle.rotation + particle.spin * age);
        context.fillStyle = particle.color;
        context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        context.restore();
      });
      frameId = window.requestAnimationFrame(draw);
    };
    frameId = window.requestAnimationFrame(draw);
  }

  async function checkScriptUpdate(force, celebrateOnSuccess) {
    if (scriptUpdateChecking) return;
    if (!force && Date.now() - scriptUpdateCache.checkedAt < SCRIPT_UPDATE_REFRESH_MS) return;
    scriptUpdateChecking = true;
    scriptUpdateError = '';
    refreshScriptUpdateUi();
    try {
      const response = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: SCRIPT_UPDATE_META_URL + '?_=' + Date.now(),
          timeout: 12000,
          onload: resolve,
          onerror: () => reject(new Error('网络请求失败')),
          ontimeout: () => reject(new Error('请求超时')),
        });
      });
      if (response.status !== 200) throw new Error('HTTP ' + response.status);
      const match = String(response.responseText || '').match(/^\s*\/\/\s*@version\s+(\d+(?:\.\d+)*)\s*$/m);
      if (!match) throw new Error('未找到有效版本号');
      scriptUpdateCache = { version: match[1], checkedAt: Date.now() };
      try {
        if (typeof GM_setValue === 'function') GM_setValue(SCRIPT_UPDATE_CACHE_KEY, scriptUpdateCache);
        else localStorage.setItem(SCRIPT_UPDATE_CACHE_KEY, JSON.stringify(scriptUpdateCache));
      } catch (error) {}
      if (celebrateOnSuccess) {
        try { celebrateScriptUpdate(); } catch (error) { reportDiagnostic(error, { feature: 'settings', action: 'update-confetti' }); }
      }
    } catch (error) {
      scriptUpdateError = String(error && error.message || error);
    } finally {
      scriptUpdateChecking = false;
      refreshScriptUpdateUi();
    }
  }

  function scheduleScriptUpdateRefresh(delay, bypassCache) {
    window.setTimeout(() => {
      checkScriptUpdate(Boolean(bypassCache)).finally(() => scheduleScriptUpdateRefresh(SCRIPT_UPDATE_REFRESH_MS, false));
    }, delay);
  }

  function normalizeHomeGreetingTime(value, fallback) {
    const text = String(value || '').trim();
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : fallback;
  }

  function normalizeHomeGreetingItem(item, index) {
    const source = item && typeof item === 'object' ? item : {};
    const fallback = DEFAULT_HOME_GREETINGS[index] || DEFAULT_HOME_GREETINGS[0];
    const greetingId = String(source.greetingId || source.greeting_id || fallback.greetingId || ('period-' + index)).trim().slice(0, 50);
    const title = String(source.title || fallback.title || '').trim().slice(0, 120);
    if (!greetingId || !title) return null;
    return {
      greetingId,
      label: String(source.label || fallback.label || '').trim().slice(0, 30),
      startTime: normalizeHomeGreetingTime(source.startTime || source.start_time, fallback.startTime),
      endTime: normalizeHomeGreetingTime(source.endTime || source.end_time, fallback.endTime),
      title,
      subtitle: String(source.subtitle === undefined ? fallback.subtitle : source.subtitle).trim().slice(0, 180),
      enabled: source.enabled === undefined ? true : ![false, 0, '0', 'false'].includes(source.enabled),
      sortOrder: Number.isFinite(Number(source.sortOrder ?? source.sort_order)) ? Number(source.sortOrder ?? source.sort_order) : (index + 1) * 10,
    };
  }

  function loadHomeGreetingCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(HOME_GREETING_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(HOME_GREETING_CACHE_KEY) || 'null');
      const source = saved && typeof saved === 'object' ? saved : {};
      const items = (Array.isArray(source.items) ? source.items : []).map(normalizeHomeGreetingItem).filter(Boolean);
      return { items: items.length ? items : DEFAULT_HOME_GREETINGS.slice(), checkedAt: Number(source.checkedAt || 0) || 0 };
    } catch (error) {
      return { items: DEFAULT_HOME_GREETINGS.slice(), checkedAt: 0 };
    }
  }

  function saveHomeGreetingCache() {
    const payload = { items: Array.isArray(state.homeGreetings) ? state.homeGreetings : DEFAULT_HOME_GREETINGS.slice(), checkedAt: Number(state.homeGreetingCheckedAt || Date.now()) };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(HOME_GREETING_CACHE_KEY, payload);
      else localStorage.setItem(HOME_GREETING_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {}
  }

  function isVersionUpdateNotification(item) {
    const source = item && typeof item === 'object' ? item : {};
    return /(?:新版本|版本更新|更新提示|脚本更新)/.test(String(source.title || '') + ' ' + String(source.content || ''));
  }

  function normalizeNotificationItem(item) {
    const source = item && typeof item === 'object' ? item : {};
    const notificationId = String(source.notificationId || source.notification_id || '').trim();
    if (!notificationId) return null;
    const title = String(source.title || '\u672a\u547d\u540d\u901a\u77e5').slice(0, 120);
    const content = String(source.content || '').slice(0, 4000);
    return {
      notificationId,
      title,
      content,
      publishedAt: String(source.publishedAt || source.published_at || ''),
      updatedAt: String(source.updatedAt || source.updated_at || ''),
      isRead: Boolean(source.isRead || source.is_read),
      readAt: String(source.readAt || source.read_at || ''),
      actionUrl: String(source.actionUrl || (isVersionUpdateNotification({ title, content }) ? GREASYFORK_SCRIPT_URL : '')).slice(0, 500),
      actionLabel: String(source.actionLabel || (isVersionUpdateNotification({ title, content }) ? '\u53bb\u66f4\u65b0' : '')).slice(0, 40),
    };
  }

  function loadNotificationCache() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(NOTIFICATION_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(NOTIFICATION_CACHE_KEY) || 'null');
      const source = saved && typeof saved === 'object' ? saved : {};
      return {
        items: (Array.isArray(source.items) ? source.items : []).map(normalizeNotificationItem).filter(Boolean),
        pendingReadIds: (Array.isArray(source.pendingReadIds) ? source.pendingReadIds : []).map(String).filter(Boolean),
        checkedAt: Number(source.checkedAt || 0) || 0,
      };
    } catch (error) {
      return { items: [], pendingReadIds: [], checkedAt: 0 };
    }
  }

  function saveNotificationCache() {
    const payload = {
      items: Array.isArray(state.notifications) ? state.notifications.slice(0, 80) : [],
      pendingReadIds: Array.isArray(state.notificationPendingReadIds) ? state.notificationPendingReadIds.slice(0, 100) : [],
      checkedAt: Number(state.notificationCheckedAt || Date.now()),
    };
    try {
      if (typeof GM_setValue === 'function') GM_setValue(NOTIFICATION_CACHE_KEY, payload);
      else localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {}
  }

  function notificationUnreadCount() {
    return (state.notifications || []).filter((item) => item && !item.isRead).length;
  }

  function updateNotificationButton(panel) {
    const button = panel && panel.querySelector('[data-action="notifications"]');
    if (!button) return;
    const count = notificationUnreadCount();
    const badge = button.querySelector('.pfh-notification-badge');
    button.classList.toggle('has-unread', count > 0);
    button.setAttribute('aria-label', count ? '\u901a\u77e5\uff0c' + count + '\u6761\u672a\u8bfb' : '\u901a\u77e5');
    if (badge) {
      badge.textContent = count > 99 ? '99+' : String(count || '');
      badge.setAttribute('aria-hidden', count ? 'false' : 'true');
    }
  }

  function formatNotificationTime(value) {
    if (value === undefined || value === null || value === '') return '';
    const text = String(value).trim();
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
    const isCloudTimestamp = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(text);
    const normalized = typeof value === 'number'
      ? value
      : (isCloudTimestamp && !hasTimezone ? text.replace(' ', 'T') + 'Z' : text);
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  }

  function notificationListHtml(items, emptyText) {
    if (!items.length) return '<div class="pfh-notification-empty">' + escapeHtml(emptyText) + '</div>';
    return items.map((item) => '<article class="pfh-notification-item' + (item.isRead ? ' is-read' : ' is-unread') + '">' +
      '<div class="pfh-notification-item-head"><h4>' + escapeHtml(item.title) + '</h4>' + (!item.isRead ? '<span>\u65b0</span>' : '') + '</div>' +
      '<div class="pfh-notification-content">' + escapeHtml(item.content) + '</div>' +
      '<div class="pfh-notification-foot"><time>' + escapeHtml(formatNotificationTime(item.publishedAt)) + '</time>' +
      (item.actionUrl ? '<a class="pfh-notification-action" href="' + escapeHtml(item.actionUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.actionLabel || '\u53bb\u66f4\u65b0') + '</a>' : '') +
      (!item.isRead ? '<button type="button" data-action="notification-read" data-notification-id="' + escapeHtml(item.notificationId) + '">\u6211\u77e5\u9053\u4e86</button>' : '<span>\u5df2\u8bfb</span>') + '</div></article>').join('');
  }

  function promptBackendUpdateNotification() {
    const updateNotice = (state.notifications || []).find((item) => item && !item.isRead && isVersionUpdateNotification(item));
    if (!updateNotice) return false;
    let promptedId = '';
    try {
      promptedId = String(typeof GM_getValue === 'function' ? GM_getValue(BACKEND_UPDATE_PROMPTED_KEY, '') : localStorage.getItem(BACKEND_UPDATE_PROMPTED_KEY) || '');
    } catch (error) {}
    if (promptedId === updateNotice.notificationId) return false;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(BACKEND_UPDATE_PROMPTED_KEY, updateNotice.notificationId);
      else localStorage.setItem(BACKEND_UPDATE_PROMPTED_KEY, updateNotice.notificationId);
    } catch (error) {}
    state.notificationModalOpen = true;
    state.notificationTab = 'new';
    expandPanel();
    return true;
  }

  function renderNotificationModal(panel) {
    if (!panel) return;
    let layer = panel.querySelector('[data-notification-layer="1"]');
    if (!state.notificationModalOpen) {
      if (layer) layer.remove();
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-notification-layer';
      layer.setAttribute('data-notification-layer', '1');
      layer.setAttribute('data-action', 'notification-close');
      panel.querySelector('.pfh-full').appendChild(layer);
    }
    const tab = state.notificationTab === 'history' ? 'history' : 'new';
    const items = (state.notifications || []).filter((item) => tab === 'new' ? !item.isRead : item.isRead);
    const status = state.notificationsLoading
      ? '<span class="pfh-notification-status">\u6b63\u5728\u540c\u6b65\u2026</span>'
      : state.notificationsError
        ? '<span class="pfh-notification-status is-error">\u5df2\u663e\u793a\u672c\u5730\u7f13\u5b58</span>'
        : '<span class="pfh-notification-status">' + (state.notificationCheckedAt ? '\u66f4\u65b0\u4e8e ' + escapeHtml(formatNotificationTime(state.notificationCheckedAt)) : '\u6682\u672a\u540c\u6b65') + '</span>';
    layer.innerHTML = '<section class="pfh-notification-dialog" role="dialog" aria-modal="true" aria-label="\u901a\u77e5\u4e2d\u5fc3" data-notification-dialog="1">' +
      '<header><div><h3>\u901a\u77e5\u4e2d\u5fc3</h3>' + status + '</div><button type="button" class="pfh-notification-close" data-action="notification-close" aria-label="\u5173\u95ed">\u00d7</button></header>' +
      '<nav><button type="button" data-action="notification-tab" data-tab="new" class="' + (tab === 'new' ? 'is-active' : '') + '">\u65b0\u901a\u77e5 <em>' + notificationUnreadCount() + '</em></button>' +
      '<button type="button" data-action="notification-tab" data-tab="history" class="' + (tab === 'history' ? 'is-active' : '') + '">\u5386\u53f2\u901a\u77e5</button>' +
      '<button type="button" data-action="notification-refresh">\u5237\u65b0</button></nav>' +
      '<div class="pfh-notification-list">' + notificationListHtml(items, tab === 'new' ? '\u6682\u65e0\u65b0\u901a\u77e5' : '\u6682\u65e0\u5386\u53f2\u901a\u77e5') + '</div>' +
      (notificationUnreadCount() ? '<footer><button type="button" data-action="notification-read-all">\u5168\u90e8\u6807\u4e3a\u5df2\u8bfb</button></footer>' : '') + '</section>';
  }

  function openNotificationModal() {
    state.notificationModalOpen = true;
    state.notificationTab = notificationUnreadCount() ? 'new' : 'history';
    expandPanel();
    renderShell();
    refreshNotifications(false);
  }

  function closeNotificationModal() {
    state.notificationModalOpen = false;
    const panel = document.getElementById(PANEL_ID);
    if (panel) renderNotificationModal(panel);
  }

  async function syncPendingNotificationReads(name, instanceId) {
    const pending = Array.from(new Set(state.notificationPendingReadIds || []));
    if (!pending.length) return;
    const completed = [];
    for (const notificationId of pending) {
      try {
        await cloudRequest('/notifications/read', {
          method: 'POST',
          body: { notificationId, name, instanceId, version: SCRIPT_VERSION },
        });
        completed.push(notificationId);
      } catch (error) {}
    }
    if (completed.length) {
      state.notificationPendingReadIds = pending.filter((id) => !completed.includes(id));
      saveNotificationCache();
    }
  }

  async function refreshHomeGreetings(showFeedback) {
    if (state.homeGreetingsLoading) return;
    state.homeGreetingsLoading = true;
    try {
      const response = await cloudRequestWithRetry('/home-greetings?v=' + encodeURIComponent(SCRIPT_VERSION), { method: 'GET' }, { attempts: 2, baseDelayMs: 900 });
      const items = (Array.isArray(response && response.greetings) ? response.greetings : []).map(normalizeHomeGreetingItem).filter(Boolean);
      if (items.length) state.homeGreetings = items;
      state.homeGreetingCheckedAt = Date.now();
      saveHomeGreetingCache();
      if (state.view === 'home') renderShell();
      if (showFeedback) showToast('主页问候语已更新');
    } catch (error) {
      addLog('warn', '主页问候语同步失败：' + formatErrorMessage(error));
      reportCloudConnectivityFailure('home-greetings', error);
      if (showFeedback) showToast('暂时无法更新主页问候语');
    } finally {
      state.homeGreetingsLoading = false;
    }
  }

  function scheduleHomeGreetingRefresh(delay) {
    window.clearTimeout(state.homeGreetingRefreshTimer);
    state.homeGreetingRefreshTimer = window.setTimeout(async () => {
      await refreshHomeGreetings(false);
      scheduleHomeGreetingRefresh(HOME_GREETING_REFRESH_MS + Math.floor(Math.random() * 90 * 1000));
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshNotifications(showFeedback) {
    if (state.notificationsLoading) return;
    const name = findCurrentPlmUserName();
    const instanceId = getClientInstanceId();
    state.notificationsLoading = true;
    state.notificationsError = '';
    if (state.notificationModalOpen) renderShell();
    try {
      await syncPendingNotificationReads(name, instanceId);
      const response = await cloudRequest('/notifications?name=' + encodeURIComponent(name || '') + '&instanceId=' + encodeURIComponent(instanceId) + '&version=' + encodeURIComponent(SCRIPT_VERSION), { method: 'GET' });
      const pending = new Set(state.notificationPendingReadIds || []);
      state.notifications = (Array.isArray(response && response.notifications) ? response.notifications : [])
        .map(normalizeNotificationItem)
        .filter(Boolean)
        .map((item) => pending.has(item.notificationId) ? { ...item, isRead: true } : item);
      state.notificationCheckedAt = Date.now();
      saveNotificationCache();
      promptBackendUpdateNotification();
      if (showFeedback) showToast('\u901a\u77e5\u5df2\u66f4\u65b0');
    } catch (error) {
      state.notificationsError = formatErrorMessage(error);
      if (showFeedback) showToast('\u65e0\u6cd5\u8054\u7f51\uff0c\u5df2\u663e\u793a\u672c\u5730\u7f13\u5b58');
    } finally {
      state.notificationsLoading = false;
      const panel = document.getElementById(PANEL_ID);
      if (panel) {
        updateNotificationButton(panel);
        if (state.notificationModalOpen) renderNotificationModal(panel);
      }
    }
  }

  function scheduleNotificationRefresh(delay) {
    window.clearTimeout(state.notificationRefreshTimer);
    state.notificationRefreshTimer = window.setTimeout(async () => {
      await refreshNotifications(false);
      scheduleNotificationRefresh(NOTIFICATION_REFRESH_MS);
    }, Math.max(0, Number(delay) || 0));
  }

  async function markNotificationRead(notificationId, showFeedback) {
    const id = String(notificationId || '');
    if (!id) return;
    state.notifications = (state.notifications || []).map((item) => item.notificationId === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item);
    state.notificationPendingReadIds = Array.from(new Set([...(state.notificationPendingReadIds || []), id]));
    saveNotificationCache();
    renderShell();
    await syncPendingNotificationReads(findCurrentPlmUserName(), getClientInstanceId());
    if (showFeedback) showToast('\u5df2\u6807\u4e3a\u5df2\u8bfb');
  }

  async function markAllNotificationsRead() {
    const ids = (state.notifications || []).filter((item) => !item.isRead).map((item) => item.notificationId);
    if (!ids.length) return;
    state.notifications = (state.notifications || []).map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }));
    state.notificationPendingReadIds = Array.from(new Set([...(state.notificationPendingReadIds || []), ...ids]));
    state.notificationTab = 'history';
    saveNotificationCache();
    renderShell();
    await syncPendingNotificationReads(findCurrentPlmUserName(), getClientInstanceId());
    showToast('\u5df2\u5168\u90e8\u6807\u4e3a\u5df2\u8bfb');
  }
