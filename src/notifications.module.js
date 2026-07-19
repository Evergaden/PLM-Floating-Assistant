  const NOTIFICATION_CACHE_KEY = 'plm-floating-helper:notifications:v1';
  const NOTIFICATION_REFRESH_MS = 5 * 60 * 1000;

  function normalizeNotificationItem(item) {
    const source = item && typeof item === 'object' ? item : {};
    const notificationId = String(source.notificationId || source.notification_id || '').trim();
    if (!notificationId) return null;
    return {
      notificationId,
      title: String(source.title || '\u672a\u547d\u540d\u901a\u77e5').slice(0, 120),
      content: String(source.content || '').slice(0, 4000),
      publishedAt: String(source.publishedAt || source.published_at || ''),
      updatedAt: String(source.updatedAt || source.updated_at || ''),
      isRead: Boolean(source.isRead || source.is_read),
      readAt: String(source.readAt || source.read_at || ''),
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
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('zh-CN', { hour12: false });
  }

  function notificationListHtml(items, emptyText) {
    if (!items.length) return '<div class="pfh-notification-empty">' + escapeHtml(emptyText) + '</div>';
    return items.map((item) => '<article class="pfh-notification-item' + (item.isRead ? ' is-read' : ' is-unread') + '">' +
      '<div class="pfh-notification-item-head"><h4>' + escapeHtml(item.title) + '</h4>' + (!item.isRead ? '<span>\u65b0</span>' : '') + '</div>' +
      '<div class="pfh-notification-content">' + escapeHtml(item.content) + '</div>' +
      '<div class="pfh-notification-foot"><time>' + escapeHtml(formatNotificationTime(item.publishedAt)) + '</time>' +
      (!item.isRead ? '<button type="button" data-action="notification-read" data-notification-id="' + escapeHtml(item.notificationId) + '">\u6211\u77e5\u9053\u4e86</button>' : '<span>\u5df2\u8bfb</span>') + '</div></article>').join('');
  }

  function renderNotificationModal(panel) {
    if (!panel) return;
    let layer = panel.querySelector('.pfh-notification-layer');
    if (!state.notificationModalOpen) {
      if (layer) layer.remove();
      return;
    }
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-notification-layer';
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
