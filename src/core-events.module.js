  function handlePanelClick(event) {
    const offlineTarget = event.target && event.target.closest && event.target.closest('[data-action]');
    const offlineAction = offlineTarget && offlineTarget.getAttribute('data-action') || '';
    if (typeof isWestmonthLoginPage === 'function' && isWestmonthLoginPage() && (/^(?:upload|magic-upload|scan|refresh|sku-color-scan)/.test(offlineAction) || /^product-development-(?:product-fill-page[12]|product-save-plm|bom-fill-plm|bom-save-plm|tasks-refresh|context-refresh)/.test(offlineAction))) {
      showToast('当前为缓存模式，请在 PLM 恢复并登录后操作');
      return;
    }
    if (handleLucianFilterAction(event, ensurePanel())) return;
    const skuContextMenu = event.target && event.target.closest && event.target.closest('.pfh-sku-context-menu');
    const skuDetailMore = event.target && event.target.closest && event.target.closest('[data-action="sku-detail-more"]');
    if (!skuContextMenu && !skuDetailMore) closeSkuWaterfallContextMenu(ensurePanel());
    const namingCard = event.target && event.target.closest && event.target.closest('.pfh-packaging-naming-card');
    const namingCopy = event.target && event.target.closest && event.target.closest('[data-naming-copy]');
    if (namingCopy) {
      copyText(namingCopy.getAttribute('data-naming-copy') || '');
      namingCopy.classList.add('is-copied');
      window.setTimeout(() => namingCopy.classList.remove('is-copied'), 650);
      showToast(L.copied);
      return;
    }
    if (event.target && event.target.closest && event.target.closest('[data-naming-close]')) {
      closePackagingNamingCard(ensurePanel());
      return;
    }
    if (!namingCard) closePackagingNamingCard(ensurePanel());
    const actionTarget = event.target && event.target.closest && event.target.closest('[data-action]');
    const action = actionTarget && actionTarget.getAttribute('data-action');
    if (action === 'my-profile-toggle') { toggleMyProfile(); return; }
    if (action === 'my-profile-close') {
      closeMyProfile();
      return;
    }
    if (myProfile.open && action && (action === 'collapse' || actionTarget.closest('.pfh-my-dialog'))) closeMyProfile(false);
    if (action === 'network-diagnostics-retry') { requestNetworkDiagnostics(true, networkDiagnostics.simulation); return; }
    if (action === 'network-diagnostics-copy') { copyText(networkDiagnosticsReport()); showToast('已复制检测结果，请发给 IT 或脚本维护人员。'); return; }
    if (action === 'network-diagnostics-close') {
      networkDiagnostics.open = false;
      networkDiagnostics.offerOpen = false;
      renderNetworkDiagnostics(ensurePanel());
      return;
    }
    if (handleShortcutSettingsAction(action, actionTarget)) return;
    if (action === 'cloud-recovery-refresh-page') {
      refreshPageForCloudRecovery();
      return;
    }
    if (productDevelopmentHandleAction(action, actionTarget)) return;
    if (action === 'ledger-more') {
      event.preventDefault();
      event.stopPropagation();
      handleLedgerMoreAction(actionTarget);
      return;
    }
    if (action === 'sku-cache-editor-close') {
      if (actionTarget.classList.contains('pfh-cache-editor-layer') && event.target !== actionTarget) return;
      closeSkuCacheEditor();
      return;
    }
    if (action === 'sku-cache-editor-expand') {
      toggleSkuCacheEditorDetails(true);
      return;
    }
    if (action === 'sku-cache-editor-collapse') {
      toggleSkuCacheEditorDetails(false);
      return;
    }
    if (action === 'sku-cache-editor-save') {
      saveSkuCacheEditor();
      return;
    }
    if (action === 'home-feature-edit-toggle') {
      state.homeFeatureEditMode = !state.homeFeatureEditMode;
      state.homeFeatureDragId = '';
      renderShell();
      if (!state.homeFeatureEditMode) showToast('主页功能入口已更新');
      return;
    }
    if (action === 'home-feature-edit-card') return;
    const ledgerMoreArea = event.target && event.target.closest && event.target.closest('.pfh-ledger-more,.pfh-ledger-overflow-menu');
    if (state.view === 'ledger' && state.ledgerMenuSku && !ledgerMoreArea) {
      state.ledgerMenuSku = '';
      state.ledgerMenuDate = '';
      closeRenderedLedgerMenus(ensurePanel(), null);
    }
    if (!action && state.view === 'ledger') {
      const card = event.target && event.target.closest && event.target.closest('.pfh-ledger-item.is-clickable');
      const interactive = event.target && event.target.closest && event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"]');
      if (card && !interactive) {
        if (Date.now() < Number(state.ledgerSkuDragSuppressClickUntil || 0)) {
          event.preventDefault();
          return;
        }
        toggleLedgerSelection(card.getAttribute('data-ledger-sku'), card.getAttribute('data-ledger-date'));
        return;
      }
    }
    if (action === 'notifications') {
      openNotificationModal();
      return;
    }
    if (action === 'notification-close') {
      if (actionTarget.classList.contains('pfh-notification-layer') && event.target !== actionTarget) return;
      closeNotificationModal();
      return;
    }
    if (action === 'notification-tab') {
      state.notificationTab = actionTarget.getAttribute('data-tab') === 'history' ? 'history' : 'new';
      renderNotificationModal(ensurePanel());
      return;
    }
    if (action === 'notification-refresh') {
      refreshNotifications(true);
      return;
    }
    if (action === 'script-update-check') {
      checkScriptUpdate(true, true);
      return;
    }
    if (action === 'script-update-open') {
      window.open(GREASYFORK_SCRIPT_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action === 'notification-read') {
      markNotificationRead(actionTarget.getAttribute('data-notification-id'), true);
      return;
    }
    if (action === 'notification-read-all') {
      markAllNotificationsRead();
      return;
    }
    if (action === 'excel-export-result-close') {
      if (actionTarget.classList.contains('pfh-excel-export-result-layer') && event.target !== actionTarget) return;
      closeExcelExportResultModal();
      return;
    }
    if (action === 'infringement-image-viewer-close') {
      if (actionTarget.classList.contains('pfh-infringement-image-viewer-layer') && event.target !== actionTarget) return;
      closeInfringementImageViewer();
      return;
    }
    if (action === 'infringement-history-open') {
      state.infringementHistoryOpen = true;
      state.skuDataLogOpen = false;
      renderInfringementHistoryViewer(ensurePanel());
      return;
    }
    if (action === 'infringement-history-close') {
      if (actionTarget.classList && actionTarget.classList.contains('pfh-infringement-history-layer') && event.target !== actionTarget) return;
      state.infringementHistoryOpen = false;
      renderInfringementHistoryViewer(ensurePanel());
      return;
    }
    if (action === 'sku-data-log-open') {
      state.skuDataLogOpen = true;
      state.infringementHistoryOpen = false;
      renderSkuDataLogViewer(ensurePanel());
      return;
    }
    if (action === 'sku-data-log-close') {
      if (actionTarget.classList && actionTarget.classList.contains('pfh-sku-data-log-layer') && event.target !== actionTarget) return;
      state.skuDataLogOpen = false;
      renderSkuDataLogViewer(ensurePanel());
      return;
    }
    if (action === 'infringement-image-open') {
      openInfringementImageViewer(
        actionTarget.getAttribute('data-image-url'),
        actionTarget.getAttribute('data-image-label') || '侵权图'
      );
      return;
    }
    if (action === 'ledger-ai-image-close') {
      if (actionTarget.classList.contains('pfh-ledger-ai-image-layer') && event.target !== actionTarget) return;
      closeLedgerAiImageViewer();
      return;
    }
    if (action === 'ledger-ai-image-select') {
      if (state.ledgerAiImageViewer) {
        const tab = actionTarget.getAttribute('data-kind') === 'detail' ? 'detail' : 'main';
        const selected = String(actionTarget.getAttribute('data-entry-key') || '');
        state.ledgerAiImageViewer.tab = tab;
        state.ledgerAiImageViewer.selected = {
          ...(state.ledgerAiImageViewer.selected || {}),
          [tab]: selected,
        };
        renderLedgerAiImageViewer(ensurePanel());
      }
      return;
    }
    if (action === 'ledger-ai-image-hide') {
      hideLedgerAiImageEntry(
        actionTarget.getAttribute('data-sku'),
        actionTarget.getAttribute('data-date'),
        actionTarget.getAttribute('data-kind'),
        actionTarget.getAttribute('data-entry-key')
      );
      return;
    }
    if (action === 'ledger-ai-image-restore-hidden') {
      restoreLedgerAiImageHidden(
        actionTarget.getAttribute('data-sku'),
        actionTarget.getAttribute('data-date'),
        actionTarget.getAttribute('data-kind')
      );
      return;
    }
    if (action === 'ledger-ai-image-tab') {
      if (state.ledgerAiImageViewer) {
        state.ledgerAiImageViewer.tab = actionTarget.getAttribute('data-tab') === 'detail' ? 'detail' : 'main';
        renderLedgerAiImageViewer(ensurePanel());
      }
      return;
    }
    if (action === 'ledger-ai-retouch-composer-close') {
      if (actionTarget.classList.contains('pfh-ledger-ai-retouch-composer-layer') && event.target !== actionTarget) return;
      closeLedgerAiImageRetouchComposer();
      return;
    }
    if (action === 'ledger-ai-retouch-composer-submit') {
      submitLedgerAiImageRetouchComposer();
      return;
    }
    if (action === 'ledger-ai-retouch-composer-clear') {
      clearLedgerAiImageRetouchComposer();
      return;
    }
    if (action === 'ledger-ai-retouch-quick-phrase') {
      appendLedgerAiImageRetouchPhrase(actionTarget.getAttribute('data-text'));
      return;
    }
    if (action === 'ledger-ai-image-retouch') {
      promptLedgerAiImageRetouch(
        actionTarget.getAttribute('data-sku'),
        actionTarget.getAttribute('data-date'),
        actionTarget.getAttribute('data-kind'),
        actionTarget.getAttribute('data-image-url')
      );
      return;
    }
    if (action === 'reverse-image-search') {
      openReverseImageSearch(actionTarget.getAttribute('data-engine'), actionTarget.getAttribute('data-image-url'));
      return;
    }
    if (action === 'ledger-ai-image-generate') {
      handleLedgerAiImageGenerate(
        actionTarget.getAttribute('data-sku'),
        actionTarget.getAttribute('data-date'),
        actionTarget.getAttribute('data-kind')
      );
      return;
    }
    if (action === 'ledger-ai-prep-refresh') {
      refreshLedgerAiImagePreparation(actionTarget.getAttribute('data-sku'));
      return;
    }
    if (action === 'ledger-ai-prep-save') {
      saveLedgerAiImagePreparationDraft(actionTarget.getAttribute('data-sku'));
      return;
    }
    if (action === 'ledger-ai-prep-autofill') {
      autofillLedgerAiImagePreparation(actionTarget.getAttribute('data-sku'));
      return;
    }
    if (action === 'ledger-ai-image-download-item') {
      downloadLedgerAiImageItem(
        actionTarget.getAttribute('data-sku'),
        actionTarget.getAttribute('data-date'),
        actionTarget.getAttribute('data-kind'),
        actionTarget.getAttribute('data-image-url'),
        actionTarget.getAttribute('data-image-name')
      );
      return;
    }
    if (action === 'ledger-ai-image-download') {
      downloadLedgerAiImageZip(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'), actionTarget.getAttribute('data-kind'));
      return;
    }
    if (action === 'ledger-ai-image-refresh') {
      queryLedgerAiImageStatus(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'), { openViewer: true });
      return;
    }
    if (action === 'ledger-detail3-audit') {
      auditLedgerDetail3(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'), true);
      return;
    }
    if (action === 'ledger-ai-image') {
      handleLedgerAiImageButton(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-display-mode') {
      state.ledgerDisplayMode = actionTarget.getAttribute('data-mode') === 'table' ? 'table' : 'cards';
      if (!renderLedgerTabContent(ensurePanel())) renderShell();
      return;
    }
    if (action === 'ledger-copy-filtered-skus') {
      copyLedgerWorkbenchTable(false);
      return;
    }
    if (action === 'ledger-copy-filtered-table') {
      copyLedgerWorkbenchTable(true);
      return;
    }
    if (action === 'detail-view-tab') {
      switchDetailViewTab(actionTarget.getAttribute('data-detail-view') || 'detail');
      return;
    }
    if (state.view === 'parameterImage' && action && parameterImageFeature.handleAction(action, actionTarget, state.data || {})) return;
    if (action === 'sku-context-barcode') {
      const sku = actionTarget.getAttribute('data-sku') || '';
      if (!sku) return;
      const source = loadData(sku)
        || (state.data && state.data.sku === sku ? state.data : null)
        || state.index.find((entry) => entry.sku === sku)
        || { sku };
      const data = normalizeData(source);
      closeSkuWaterfallContextMenu(ensurePanel());
      try { downloadSkuBarcode(sku, data.name); } catch (error) { addLog('error', '生成条码失败', error); showToast(formatErrorMessage(error)); }
      return;
    }
    if (action === 'sku-context-delete') {
      const sku = actionTarget.getAttribute('data-sku') || '';
      closeSkuWaterfallContextMenu(ensurePanel());
      closeSkuCacheEditor();
      deleteSkuFromList(sku);
      renderShell();
      return;
    }
    if (action === 'sku-context-cache') {
      const sku = actionTarget.getAttribute('data-sku') || '';
      closeSkuWaterfallContextMenu(ensurePanel());
      showSkuCacheEditor(sku);
      return;
    }
    if (state.exportMenuOpen && !(event.target && event.target.closest && event.target.closest('.pfh-export-menu, .pfh-readiness-menu'))) {
      syncExcelInputs();
      state.exportMenuOpen = false;
      updateExportMenuVisibility();
    }
    if (state.skuSortMenuOpen && !(event.target && event.target.closest && event.target.closest('.pfh-sku-sort-menu'))) {
      state.skuSortMenuOpen = false;
      updateSkuSortMenuVisibility(ensurePanel());
    }
    if (action === 'expand') {
      expandPanel();
      return;
    }
    if (action === 'panel-close') {
      suppressPanelTooltips(actionTarget);
      collapsePanel(true);
      return;
    }
    if (action === 'theme-resource-enable') {
      if (!state.luluThemeAccessEnabled) {
        showToast(state.luluThemeAccessLoading ? '正在准备功能' : '噜噜乐园主题暂未开放，敬请期待');
        scheduleLuluThemeAccessRefresh(0);
        return;
      }
      state.settings.theme = 'lulu';
      saveSettings(state.settings);
      applyThemeToView();
      renderShell();
      loadLuluThemeResource();
      return;
    }
    if (action === 'theme-select') {
      state.settings.theme = normalizeThemeId(actionTarget.getAttribute('data-theme-id'));
      saveSettings(state.settings);
      applyThemeToView();
      renderShell();
      showToast('\u4e3b\u9898\u5df2\u5207\u6362\u4e3a ' + getActiveTheme().name);
      return;
    }
    if (action === 'pixel-room-overtime') {
      pixelRoomOvertime = !pixelRoomOvertime;
      updatePixelRoom();
      return;
    }
    if (action === 'pixel-room-rest') {
      pixelRoomRestUntil = pixelRoomRestUntil > Date.now() ? 0 : Date.now() + 30 * 60 * 1000;
      pixelRoomCatCommand = null;
      updatePixelRoom();
      return;
    }
    if (action === 'pixel-room-picture') { choosePixelRoomPicture(); return; }
    if (action === 'pixel-room-picture-reset') {
      if (typeof GM_setValue === 'function') GM_setValue('pfh-pixel-room-picture-v1', '');
      else localStorage.removeItem('pfh-pixel-room-picture-v1');
      loadPixelRoomPicture(''); updatePixelRoom(); showToast('已恢复默认画'); return;
    }
    if (action === 'developer-settings-tap') {
      const now = Date.now();
      if (now - state.developerSettingsTapAt > 1800) state.developerSettingsTapCount = 0;
      state.developerSettingsTapAt = now;
      state.developerSettingsTapCount += 1;
      if (state.developerSettingsTapCount >= 5) {
        state.developerSettingsTapCount = 0;
        state.developerInsightsUnlocked = true;
        state.developerToolsOpen = false;
        renderShell();
        showToast('已解锁开发者模式按钮');
      }
      return;
    }
    if (action === 'developer-mode-toggle' && state.developerInsightsUnlocked) {
      state.developerToolsOpen = !state.developerToolsOpen;
      renderShell(); return;
    }
    if (action === 'developer-insights-toggle' && state.developerInsightsUnlocked) {
      state.developerInsightsOpen = !state.developerInsightsOpen;
      renderShell(); return;
    }
    if ((action === 'developer-network-demo' || action === 'developer-network-check') && state.developerInsightsUnlocked) {
      if (networkDiagnostics.checking) { showToast('检测正在进行，请稍后再试'); return; }
      if (action === 'developer-network-demo') openNetworkDiagnosticsDemo();
      else requestNetworkDiagnostics(true, false);
      return;
    }
    if (action === 'plm-api-monitor-toggle') {
      plmApiMonitorState.enabled = !plmApiMonitorState.enabled;
      savePlmApiMonitorState();
      renderShell();
      showToast(plmApiMonitorState.enabled ? '数据监听已开启，请刷新页面后操作 PLM' : '数据监听已关闭');
      return;
    }
    if (action === 'plm-api-monitor-export') {
      downloadBlob(new Blob([JSON.stringify(plmApiMonitorState.entries || [], null, 2)], { type: 'application/json' }), 'plm-data-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
      showToast('PLM 数据监听结果已导出');
      return;
    }
    if (action === 'plm-api-monitor-clear') {
      plmApiMonitorState.entries = [];
      savePlmApiMonitorState();
      renderShell();
      showToast('PLM 数据监听结果已清空');
      return;
    }
    if (action === 'developer-tools-close') {
      if (actionTarget.classList.contains('pfh-developer-backdrop') && event.target !== actionTarget) return;
      state.developerToolsOpen = false;
      renderShell();
      return;
    }
    if (action === 'developer-layout-copy') {
      const layout = getCurrentLayoutSnapshot();
      copyText(layout);
      addLog('info', '已复制当前布局', layout.replace(/\n/g, ' | '));
      showToast('当前布局已复制');
      return;
    }
    if (action === 'refresh') {
      refreshSelectedData();
      return;
    }
    if (action === 'sku-manual-add-open') {
      openManualSkuAddModal();
      return;
    }
    if (action === 'sku-manual-add-close') {
      if (actionTarget.classList.contains('pfh-manual-sku-add-layer') && event.target !== actionTarget) return;
      closeManualSkuAddModal();
      return;
    }
    if (action === 'sku-manual-add-submit') {
      addManualSkuQueueItems(state.manualSkuAddInput);
      return;
    }
    if (action === 'sku-manual-add-pause') {
      pauseManualSkuAddQueue();
      return;
    }
    if (action === 'sku-manual-add-start') {
      startManualSkuAddQueue();
      return;
    }
    if (action === 'sku-manual-add-retry-errors') {
      retryManualSkuAddErrors();
      return;
    }
    if (action === 'sku-manual-add-clear-done') {
      clearManualSkuAddCompleted();
      return;
    }
    if (action === 'search') {
      const searchView = getCurrentDetailViewTab();
      state.skuPage = 1;
      runSearch(searchView);
      return;
    }
    if (action === 'clear-search') {
      state.skuPage = 1;
      clearSearch();
      return;
    }
    if (action === 'catalog-collection-toggle') {
      toggleCatalogCollectionPause(); return;
    }
    if (action === 'sku-sync-all') { syncAllCatalogProducts(); return; }
    if (action === 'sku-filter-toggle') {
      state.skuFilterOpen = !state.skuFilterOpen;
      if (state.skuFilterOpen) loadSkuSearchFacets();
      renderSkuFilterModal(ensurePanel());
      return;
    }
    if (action === 'sku-filter-close') {
      if (actionTarget.classList.contains('pfh-sku-filter-modal') && event.target !== actionTarget) return;
      closeSkuFilterModal(ensurePanel());
      return;
    }
    if (action === 'sku-filter-color') {
      const color = actionTarget.getAttribute('data-sku-color') || '';
      if (color && !SKU_IMAGE_COLORS.some(([id]) => id === color)) return;
      state.skuFilters.imageColor = color;
      state.skuPage = 1;
      renderSkuListForActiveView(ensurePanel());
      return;
    }
    if (action === 'sku-filter-clear') {
      state.skuFilters = { developer: '', brand: '', status: '', designType: '', imageColor: '' };
      state.skuPage = 1;
      renderSkuListForActiveView(ensurePanel());
      return;
    }
    if (action === 'sku-color-scan') {
      startSkuImageColorScan();
      return;
    }
    if (action === 'sku-color-stop') {
      pauseSkuImageColorIndex();
      return;
    }
    if (action === 'sku-list-mode') {
      const mode = actionTarget.getAttribute('data-mode') === 'waterfall' ? 'waterfall' : 'list';
      state.settings.skuListMode = mode;
      state.skuPage = 1;
      if (state.view === 'productDevelopmentTasks') state.productDevelopmentTaskPage = 1;
      state.skuSortMenuOpen = false;
      saveSettings(state.settings);
      if (!renderProductDevelopmentTaskSidebarList(ensurePanel()) && !renderSkuListContent(ensurePanel())) renderShell();
      return;
    }
    if (action === 'sku-sort-toggle') {
      state.skuSortMenuOpen = !state.skuSortMenuOpen;
      state.exportMenuOpen = false;
      updateSkuSortMenuVisibility(ensurePanel());
      updateExportMenuVisibility();
      return;
    }
    if (action === 'sku-list-sort') {
      state.settings.skuListSort = actionTarget.getAttribute('data-sort') === 'acquired' ? 'acquired' : 'assigned';
      state.skuPage = 1;
      state.skuSortMenuOpen = false;
      updateSkuSortMenuVisibility(ensurePanel());
      saveSettings(state.settings);
      if (!renderProductDevelopmentTaskSidebarList(ensurePanel()) && !renderSkuListContent(ensurePanel())) renderShell();
      return;
    }
    if (action === 'sku-page-prev') {
      state.skuPage = Math.max(1, (state.skuPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'sku-page-next') {
      state.skuPage = (state.skuPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'sku-page-goto') {
      state.skuPage = Number(actionTarget.getAttribute('data-page')) || state.skuPage || 1;
      renderShell();
      return;
    }
    if (action === 'copy-title-meta') {
      copyText(formatTitleMeta(resolveProductDevelopmentSkuIdentity(state.data)));
      showToast(L.copied);
      return;
    }
    if (action === 'copy-sku') {
      copyText(state.data && state.data.sku ? state.data.sku : '');
      showToast(L.copied);
      return;
    }
    if (action === 'sku-detail-more') {
      const sku = actionTarget.getAttribute('data-sku') || state.selectedSku || '';
      if (!sku) return;
      const panel = ensurePanel();
      if (state.skuContextMenuSku === sku && panel.querySelector('.pfh-sku-context-menu')) {
        closeSkuWaterfallContextMenu(panel);
        return;
      }
      const rect = actionTarget.getBoundingClientRect();
      showSkuWaterfallContextMenu(sku, { clientX: rect.right - 4, clientY: rect.bottom - 4 }, { allowCache: false, includeSearch: true });
      return;
    }
    if (action === 'pin-search-results') {
      pinCurrentSearchResults();
      return;
    }
    if (action === 'about') {
      if (!state.settings.backgroundNoticeSeen) {
        state.settings.backgroundNoticeSeen = true;
        saveSettings(state.settings);
      }
      if (state.view === 'about') {
        state.view = state.settingsReturnView || (state.data ? 'detail' : 'home');
        state.settingsReturnView = '';
      } else {
        state.settingsReturnView = state.view || (state.data ? 'detail' : 'home');
        state.view = 'about';
        state.settingsPage = 'general';
      }
      expandPanel();
      renderShell();
      if (state.view === 'about' && isScriptUpdateAvailable()) {
        window.requestAnimationFrame(() => {
          const card = document.getElementById(PANEL_ID)?.querySelector('.pfh-script-update-card');
          if (state.view === 'about' && card) card.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        });
      }
      return;
    }
    if (action === 'first-run-tutorial-done') {
      const keyInput = ensurePanel().querySelector('.pfh-tutorial-cloud-key');
      if (keyInput) {
        state.settings.cloudBackupKey = keyInput.value.trim();
        saveSettings(state.settings);
      }
      if (!getCloudBackupKey()) {
        state.tutorialEmptyKeyClickCount = (state.tutorialEmptyKeyClickCount || 0) + 1;
        if (state.tutorialEmptyKeyClickCount >= 5) {
          saveTutorialSeen(true);
          state.tutorialModalOpen = false;
          state.tutorialEmptyKeyClickCount = 0;
          renderShell();
          guideShortcutUpdate();
          return;
        }
      } else {
        state.tutorialEmptyKeyClickCount = 0;
      }
      if (!getCloudBackupKey()) {
        showToast(L.cloudBackupMissingKey);
        if (keyInput) keyInput.focus();
        return;
      }
      if (getCloudBackupKey().length < 4) {
        showToast(L.cloudBackupKeyTooShort);
        if (keyInput) keyInput.focus();
        return;
      }
      saveTutorialSeen(true);
      state.tutorialModalOpen = false;
      renderShell();
      guideShortcutUpdate();
      return;
    }
    if (action === 'home-main') {
      state.sizeImageCustomData = null;
      state.sizeImageCustomDraft = null;
      state.sizeImageCustomOpen = false;
      state.view = 'home';
      state.copywritingMode = false;
      state.uploadExpanded = false;
      state.uploadReturnView = '';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-feedback') {
      state.view = 'feedback';
      state.copywritingMode = false;
      state.detailReturnView = '';
      state.detailReturnScroll = null;
      expandPanel();
      renderShell();
      const name = findCurrentPlmUserName();
      if (!name || state.feedbackLoadedName !== name) loadFeedbackHistory();
      return;
    }
    if (action === 'feedback-submit') {
      submitFeedback();
      return;
    }
    if (action === 'feedback-refresh') {
      loadFeedbackHistory();
      return;
    }
    if (action === 'open-detail') {
      openSelectedProjectDetail();
      return;
    }
    if (action === 'sku-edit-open') {
      state.skuEditMode = true;
      renderShell();
      const focusKey = actionTarget.getAttribute('data-focus-key') || '';
      const editInputs = Array.from(ensurePanel().querySelectorAll('[data-sku-edit-key]'));
      const firstInput = editInputs.find((input) => input.getAttribute('data-sku-edit-key') === focusKey)
        || editInputs.find((input) => input.getAttribute('data-sku-edit-key') === 'manualCategory')
        || editInputs[0];
      if (firstInput) firstInput.focus();
      return;
    }
    if (action === 'sku-edit-cancel') {
      state.skuEditMode = false;
      renderShell();
      return;
    }
    if (action === 'sku-edit-save') {
      saveSkuManualEdits();
      return;
    }
    if (action === 'sku-changes-ack') {
      acknowledgeSkuDataChanges();
      return;
    }
    if (action === 'copywriting-open') {
      openCopywritingFromCurrent(false);
      return;
    }
    if (action === 'toy-copywriting-fill') {
      fillToyCopywriting();
      return;
    }
    if (action === 'copywriting-toggle-collapse') {
      state.settings.copywritingCollapsed = !Boolean(state.settings.copywritingCollapsed);
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (action === 'copywriting-copy') {
      const record = getCopywritingDisplayRecord(state.data);
      if (!record || !record.fullText) showToast('没有可复制的文案');
      else {
        copyText(record.fullText);
        showToast('文案已复制');
      }
      return;
    }
    if (action === 'copywriting-section-copy') {
      const record = getCopywritingDisplayRecord(state.data);
      const key = actionTarget.getAttribute('data-copywriting-key') || '';
      const section = record && record.sections ? record.sections.find((item) => item.key === key) : null;
      const value = copywritingSectionCopyValue(section);
      if (!value) showToast('本段没有可复制内容');
      else {
        copyText(value);
        showToast((section && section.label ? section.label : '本段') + '已复制');
      }
      return;
    }
    if (action === 'copywriting-refresh') {
      openCopywritingFromCurrent(true);
      return;
    }
    if (action === 'copywriting-ack') {
      acknowledgeCopywritingUpdate();
      return;
    }
    if (action === 'open-first-detail') {
      openFirstCachedDetail();
      return;
    }
    if (action === 'home-chart-period') {
      state.homeChartPeriod = Number(actionTarget.getAttribute('data-period')) === 30 ? 30 : 7;
      renderShell();
      return;
    }
    if (action === 'home-todo-add') {
      const text = String(state.homeTodoDraft || '').trim().slice(0, 120);
      if (!text) return;
      state.homeTodos.unshift({ id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8), text, done: false });
      state.homeTodos = state.homeTodos.slice(0, 30);
      state.homeTodoDraft = '';
      saveHomeTodos();
      renderShell();
      const input = ensurePanel().querySelector('.pfh-home-todo-input');
      if (input) input.focus();
      return;
    }
    if (action === 'home-todo-toggle' || action === 'home-todo-remove') {
      const id = actionTarget.getAttribute('data-todo-id');
      if (action === 'home-todo-remove') state.homeTodos = state.homeTodos.filter((item) => item.id !== id);
      else state.homeTodos = state.homeTodos.map((item) => item.id === id ? { ...item, done: !item.done } : item);
      saveHomeTodos();
      renderShell();
      return;
    }
    if (action === 'home-size-image') {
      if (!state.sizeImageAccessEnabled) {
        showToast(state.sizeImageAccessLoading ? '正在准备功能' : '该功能暂未开放，敬请期待');
        scheduleSizeImageAccessRefresh(0);
        return;
      }
      state.view = 'sizeImage';
      state.copywritingMode = false;
      state.skuPage = 1;
      if (!state.selectedSku && state.index[0]) state.selectedSku = state.index[0].sku;
      state.data = state.selectedSku ? normalizeData(loadData(state.selectedSku) || { sku: state.selectedSku }) : null;
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'size-image-custom-open') {
      openSizeImageCustomEditor();
      return;
    }
    if (action === 'size-image-custom-close') {
      if (actionTarget.classList.contains('pfh-size-image-custom-layer') && event.target !== actionTarget) return;
      closeSizeImageCustomEditor();
      return;
    }
    if (action === 'size-image-custom-save') {
      saveSizeImageCustomConfig();
      return;
    }
    if (action === 'home-parameter-image') {
      if (!state.parameterImageAccessEnabled) {
        showToast(state.parameterImageAccessLoading ? '正在准备功能' : '生成参数图暂未开放，敬请期待');
        scheduleParameterImageAccessRefresh(0);
        return;
      }
      state.view = 'parameterImage';
      state.copywritingMode = false;
      state.skuPage = 1;
      if (!state.selectedSku && state.index[0]) state.selectedSku = state.index[0].sku;
      state.data = state.selectedSku ? normalizeData(loadData(state.selectedSku) || { sku: state.selectedSku }) : null;
      parameterImageFeature.loadRules();
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'size-image-pick') {
      const input = ensurePanel().querySelector('.pfh-size-image-file-input');
      if (input && !input.disabled) input.click();
      return;
    }
    if (action === 'size-image-save-all') {
      saveCurrentSizeImagesToFolder();
      return;
    }
    if (action === 'size-image-regenerate') {
      regenerateCurrentSizeImages();
      return;
    }
    if (action === 'size-image-confirm-match') {
      confirmPendingSizeImageMatch(actionTarget.getAttribute('data-pending-id') || '');
      return;
    }
    if (action === 'excel-prepare') {
      prepareExcelInfo();
      return;
    }
    if (action === 'excel-generate' || action === 'export-submit') {
      if (state.exportType === 'toy-label') generateToyLabelFromCurrent({ skipExcelPrepare: true });
      else generateExcelFromCurrent();
      return;
    }
    if (action === 'export-menu-toggle') {
      syncExcelInputs();
      state.exportMenuOpen = !state.exportMenuOpen;
      updateExportMenuVisibility();
      return;
    }
    if (action === 'export-type') {
      syncExcelInputs();
      state.exportType = actionTarget.getAttribute('data-export-type') === 'toy-label' ? 'toy-label' : 'excel';
      state.excelStatus = '';
      state.exportMenuOpen = true;
      const panel = ensurePanel();
      const snapshot = capturePanelScroll(panel);
      renderDetail(panel);
      setupDetailViewTabs(panel);
      restorePanelScroll(panel, snapshot);
      return;
    }
    if (action === 'upload-toggle') {
      if (state.view === 'upload') {
        state.view = state.uploadReturnView || 'home';
        state.uploadReturnView = '';
        state.uploadExpanded = false;
      } else {
        state.uploadReturnView = state.view === 'detail' ? 'detail' : 'home';
        state.view = 'upload';
        state.uploadExpanded = true;
      }
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-unit-converter') {
      state.view = 'tools';
      state.toolsActiveTool = 'unit';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'home-tools') {
      state.view = 'tools';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'tools-select') {
      state.toolsActiveTool = normalizeToolsActiveTool(actionTarget.getAttribute('data-tool'));
      state.view = 'tools';
      state.copywritingMode = false;
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'unit-converter-clear') {
      state.cmConverterInput = '';
      renderShell();
      return;
    }
    if (action === 'unit-converter-copy') {
      const result = formatCmInchLines(state.cmConverterInput);
      if (result) {
        copyText(result);
        showToast('全部换算结果已复制');
      }
      return;
    }
    if (action === 'unit-converter-copy-line') {
      const line = actionTarget.getAttribute('data-unit-line') || '';
      if (line) {
        copyText(line);
        showToast('该尺寸已复制');
      }
      return;
    }
    if (action === 'code-formatter-clear') {
      state.codeFormatterInput = '';
      renderShell();
      return;
    }
    if (action === 'code-formatter-copy') {
      const result = formatSearchCodes(state.codeFormatterInput);
      if (result) {
        copyText(result);
        showToast('编码格式已复制');
      }
      return;
    }
    if (action === 'supplement-facts-add-row') {
      const draft = normalizeSupplementFactsDraft(state.supplementFactsDraft);
      if (draft.rows.length >= 18) {
        showToast('单页最多支持 18 行成分');
        return;
      }
      draft.rows.push({ name: '', amount: '', dailyValue: '**' });
      state.supplementFactsDraft = saveSupplementFactsDraft(draft);
      renderShell();
      const panel = ensurePanel();
      const inputs = panel.querySelectorAll('[data-supplement-facts-row-field="name"]');
      const input = inputs[inputs.length - 1];
      if (input) input.focus();
      return;
    }
    if (action === 'supplement-facts-remove-row') {
      const draft = normalizeSupplementFactsDraft(state.supplementFactsDraft);
      const index = Number(actionTarget.getAttribute('data-index'));
      if (Number.isInteger(index) && index >= 0 && index < draft.rows.length) draft.rows.splice(index, 1);
      if (!draft.rows.length) draft.rows.push({ name: '', amount: '', dailyValue: '**' });
      state.supplementFactsDraft = saveSupplementFactsDraft(draft);
      renderShell();
      return;
    }
    if (action === 'supplement-facts-load-sample') {
      state.supplementFactsDraft = saveSupplementFactsDraft(cloneSupplementFactsDefaultDraft());
      renderShell();
      showToast('已载入成分表示例');
      return;
    }
    if (action === 'supplement-facts-print') {
      printSupplementFactsPdf();
      return;
    }
    if (handleMagicUploadPanelAction(event, actionTarget, action)) return;
    if (action === 'toy-copywriting-batch-clear-input') {
      state.toyCopywritingBatchInput = '';
      renderShell();
      return;
    }
    if (action === 'toy-copywriting-batch-add') {
      addToyCopywritingBatchItems(state.toyCopywritingBatchInput);
      return;
    }
    if (action === 'toy-copywriting-batch-start') {
      startToyCopywritingBatch();
      return;
    }
    if (action === 'toy-copywriting-batch-apply') {
      startToyCopywritingApplyBatch();
      return;
    }
    if (action === 'toy-copywriting-batch-download-review') {
      startToyCopywritingApplyBatch({ skipApply: true });
      return;
    }
    if (action === 'toy-copywriting-batch-pause') {
      pauseToyCopywritingBatch();
      return;
    }
    if (action === 'toy-copywriting-batch-remove') {
      removeToyCopywritingBatchItem(actionTarget.getAttribute('data-sku') || '');
      return;
    }
    if (action === 'toy-copywriting-batch-retry') {
      retryToyCopywritingBatchItem(actionTarget.getAttribute('data-sku') || '');
      return;
    }
    if (action === 'toy-copywriting-batch-clear-completed') {
      clearCompletedToyCopywritingBatch();
      return;
    }
    if (action === 'ledger-open') {
      state.view = 'ledger';
      state.ledgerDate = state.ledgerDate || getTodayKey();
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'ledger-toggle-tools') {
      state.ledgerToolsCollapsed = !state.ledgerToolsCollapsed;
      const ledgerPanel = ensurePanel();
      const toolsPanel = ledgerPanel && ledgerPanel.querySelector('.pfh-ledger-tools-panel');
      const toolsToggle = toolsPanel && toolsPanel.querySelector('.pfh-ledger-tools-toggle');
      if (toolsPanel && toolsToggle) {
        const collapsed = Boolean(state.ledgerToolsCollapsed);
        toolsPanel.classList.toggle('is-collapsed', collapsed);
        toolsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        const stateText = toolsToggle.querySelector('[data-ledger-tools-state]');
        if (stateText) stateText.textContent = collapsed ? '展开' : '收起';
      }
      return;
    }
    if (action === 'ledger-view-design' || action === 'ledger-view-finalized' || action === 'ledger-view-trash') {
      const nextLedgerView = action === 'ledger-view-trash' ? 'trash' : (action === 'ledger-view-finalized' ? 'finalized' : 'design');
      state.ledgerView = nextLedgerView;
      const renderToken = (Number(state.ledgerTabRenderToken) || 0) + 1;
      state.ledgerTabRenderToken = renderToken;
      const repaintLedgerContent = () => {
        if (state.ledgerTabRenderToken !== renderToken || state.view !== 'ledger') return;
        if (!renderLedgerTabContent(ensurePanel())) renderShell();
      };
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => window.requestAnimationFrame(repaintLedgerContent));
      } else {
        window.setTimeout(repaintLedgerContent, 32);
      }
      return;
    }
    if (action === 'ledger-prev-day') {
      state.ledgerDate = shiftDateKey(state.ledgerDate, -1);
      renderShell();
      return;
    }
    if (action === 'ledger-prev-month' || action === 'ledger-next-month') {
      state.ledgerDate = shiftLedgerMonth(state.ledgerDate, action === 'ledger-next-month' ? 1 : -1);
      renderShell();
      return;
    }
    if (action === 'ledger-today') {
      state.ledgerDate = getTodayKey();
      renderShell();
      return;
    }
    if (action === 'ledger-fullscreen-toggle') {
      state.ledgerFullscreen = !state.ledgerFullscreen;
      renderShell();
      return;
    }
    if (action === 'ledger-copy') {
      copyLedgerTsv(state.ledgerDate);
      return;
    }
    if (action === 'ledger-copy-selected') {
      copySelectedFinalizedLedgerSkus();
      return;
    }
    if (action === 'ledger-select-all') {
      setLedgerVisibleSelection(true);
      return;
    }
    if (action === 'ledger-clear-selection') {
      setLedgerVisibleSelection(false);
      return;
    }
    if (action === 'ledger-copy-video') {
      copySelectedLedgerVideoRows();
      return;
    }
    if (action === 'ledger-toggle-select') {
      toggleLedgerSelection(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-select-date') {
      toggleLedgerDateSelection(actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-performance-merge' || action === 'ledger-performance-unmerge') {
      updateSelectedLedgerPerformanceGroups(action === 'ledger-performance-merge');
      return;
    }
    if (action === 'ledger-performance-group-open') {
      openLedgerPerformanceGroupModal();
      return;
    }
    if (action === 'ledger-performance-group-close') {
      if (actionTarget.classList.contains('pfh-ledger-performance-group-modal') && event.target !== actionTarget) return;
      closeLedgerPerformanceGroupModal();
      return;
    }
    if (action === 'ledger-performance-group-submit') {
      applyLedgerPerformanceGroupFromInput();
      return;
    }
    if (action === 'ledger-highlight-performance-group') {
      highlightLedgerPerformanceGroup(actionTarget.getAttribute('data-group-id'));
      return;
    }
    if (action === 'ledger-export') {
      exportLedgerRecords(state.ledgerDate);
      return;
    }
    if (action === 'ledger-clear') {
      clearLedgerDate(state.ledgerDate);
      return;
    }
    if (action === 'ledger-trash-restore' || action === 'ledger-trash-delete') {
      updateLedgerTrashFromAction(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-trash-empty') {
      emptyLedgerTrashMonth(state.ledgerDate);
      return;
    }
    if (action === 'ledger-image-generated' || action === 'ledger-unmark-image-generated' || action === 'ledger-finalize' || action === 'ledger-unfinalize' || action === 'ledger-extension' || action === 'ledger-series-exclude' || action === 'ledger-void' || action === 'ledger-done' || action === 'ledger-remove') {
      const options = {};
      if (action === 'ledger-finalize') {
        const card = actionTarget.closest('.pfh-ledger-item');
        const input = card && card.querySelector('.pfh-ledger-price input');
        const rawPrice = String(input && input.value || '').trim();
        const purchasePrice = normalizeLedgerPurchasePrice(rawPrice);
        if (rawPrice && !purchasePrice) {
          showToast('价格格式不正确，请输入数字，例如 6 或 6.50');
          if (input) input.focus();
          return;
        }
        if (purchasePrice) options.purchasePrice = purchasePrice;
      }
      updateLedgerFromAction(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'), options);
      return;
    }
    if (action === 'ledger-edit-finalized-time') {
      openLedgerFinalizedTimeEditor(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-time-close') {
      state.ledgerTimeEditor = null;
      renderShell();
      return;
    }
    if (action === 'ledger-time-today' || action === 'ledger-time-yesterday' || action === 'ledger-time-day-before') {
      updateLedgerTimeEditorPreset(action);
      return;
    }
    if (action === 'ledger-time-save') {
      saveLedgerFinalizedTimeEditor();
      return;
    }
    if (action === 'ledger-toggle-box-file' || action === 'ledger-toggle-label-file' || action === 'ledger-toggle-image-pack') {
      toggleLedgerWorkFlag(action, actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-cycle-artwork-state') {
      cycleLedgerArtworkState(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-open-reference') {
      openLedgerReference(actionTarget.getAttribute('data-sku'), actionTarget.getAttribute('data-date'));
      return;
    }
    if (action === 'ledger-copy-sku') {
      if (Date.now() < Number(state.ledgerSkuDragSuppressClickUntil || 0)) {
        event.preventDefault();
        return;
      }
      const sku = actionTarget.getAttribute('data-sku') || '';
      if (sku) {
        copyText(sku);
        actionTarget.classList.add('is-copied');
        window.setTimeout(() => actionTarget.classList.remove('is-copied'), 650);
        showToast('已复制编码：' + sku);
      }
      return;
    }
    if (action === 'ledger-open-sku') {
      openLedgerSku(actionTarget.getAttribute('data-sku'), actionTarget.closest('.pfh-ledger-item'));
      return;
    }
    if (action === 'home-batch-excel' || action === 'home-excel-coming-soon') {
      state.view = 'batchExcel';
      state.batchExcelStatus = '';
      expandPanel();
      renderShell();
      return;
    }
    if (action === 'batch-excel-mode') {
      state.batchExcelMode = actionTarget.getAttribute('data-mode') === 'merge' ? 'merge' : 'separate';
      renderShell();
      return;
    }
    if (action === 'batch-excel-clear-input') {
      state.batchExcelInput = '';
      renderShell();
      return;
    }
    if (action === 'batch-excel-add') {
      addExcelBatchQueueItems(state.batchExcelInput);
      return;
    }
    if (action === 'batch-excel-prepare') {
      startExcelBatchPreparation();
      return;
    }
    if (action === 'batch-excel-pause') {
      pauseExcelBatchPreparation();
      return;
    }
    if (action === 'batch-excel-download') {
      downloadExcelBatchQueue();
      return;
    }
    if (action === 'batch-excel-remove') {
      removeExcelBatchQueueItem(actionTarget.getAttribute('data-sku'));
      return;
    }
    if (action === 'batch-excel-retry') {
      retryExcelBatchQueueItem(actionTarget.getAttribute('data-sku'));
      return;
    }
    if (action === 'batch-excel-clear-completed') {
      clearCompletedExcelBatchQueue();
      return;
    }
    if (action === 'home-back') {
      if (state.searchQuery.trim()) {
        state.searchQuery = '';
        state.skuPage = 1;
        const input = ensurePanel().querySelector('.pfh-search-input');
        if (input) input.value = '';
        updateSearchClear();
      }
      const returnView = state.detailReturnView || '';
      const returnScroll = state.detailReturnScroll;
      if (state.view === 'ledger' && returnView !== 'ledger') state.ledgerFullscreen = false;
      state.view = returnView || 'home';
      state.detailReturnView = '';
      state.detailReturnScroll = null;
      state.uploadExpanded = false;
      state.uploadReturnView = '';
      renderShell();
      if (returnView === 'ledger') restoreLedgerReturnScroll(returnScroll);
      return;
    }
    if (action === 'upload-history-toggle') {
      state.uploadView = state.uploadView === 'history' ? 'queue' : 'history';
      if (state.uploadView === 'history') state.uploadHistoryPage = 1;
      renderShell();
      return;
    }
    if (action === 'upload-clear-list') {
      clearCurrentUploadList();
      return;
    }
    if (action === 'upload-clear-cancel') {
      state.uploadClearConfirmOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-clear-confirm') {
      confirmClearCurrentUploadList();
      return;
    }
    if (action === 'upload-guide') {
      state.uploadGuideOpen = true;
      renderShell();
      return;
    }
    if (action === 'upload-guide-close') {
      if (actionTarget.classList.contains('pfh-upload-guide-modal') && event.target !== actionTarget) return;
      state.uploadGuideOpen = false;
      renderShell();
      return;
    }
    if (action === 'upload-mode') {
      const mode = actionTarget.getAttribute('data-upload-mode');
      state.uploadMode = /^(?:standard|toy-label|toy-effect|copyright)$/.test(mode || '') ? mode : 'standard';
      if (!renderUploadModeContent(ensurePanel(), { animate: true })) renderShell();
      return;
    }
    if (action === 'toy-label-queue-add') {
      addToyLabelQueueItems(state.toyLabelSkuInput);
      return;
    }
    if (action === 'copyright-queue-add') {
      addCopyrightQueueItems(state.copyrightSkuInput, state.copyrightPendingFiles);
      return;
    }
    if (action === 'copyright-pending-clear') {
      state.copyrightPendingFiles = [];
      renderShell();
      return;
    }
    if (action === 'upload-page-prev') {
      state.uploadPage = Math.max(1, (state.uploadPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'upload-page-next') {
      state.uploadPage = (state.uploadPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'upload-page-goto') {
      state.uploadPage = Math.max(1, parseInt(actionTarget.getAttribute('data-page') || '1', 10) || 1);
      renderShell();
      return;
    }
    if (action === 'upload-history-page-prev') {
      state.uploadHistoryPage = Math.max(1, (state.uploadHistoryPage || 1) - 1);
      renderShell();
      return;
    }
    if (action === 'upload-history-page-next') {
      state.uploadHistoryPage = (state.uploadHistoryPage || 1) + 1;
      renderShell();
      return;
    }
    if (action === 'upload-history-page-goto') {
      state.uploadHistoryPage = Math.max(1, parseInt(actionTarget.getAttribute('data-page') || '1', 10) || 1);
      renderShell();
      return;
    }
    if (action === 'upload-pick') {
      const input = ensurePanel().querySelector('.pfh-upload-file');
      if (input) input.click();
      return;
    }
    if (action === 'upload-start') {
      startUploadQueue();
      return;
    }
    if (action === 'upload-pause') {
      pauseUploadQueue();
      return;
    }
    if (action === 'upload-remove') {
      removeUploadQueueItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-retry') {
      retryUploadQueueItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-queue-select') {
      toggleUploadSelection(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-select') {
      toggleUploadSelection(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-retry') {
      retryUploadHistoryItem(actionTarget.getAttribute('data-upload-id'));
      return;
    }
    if (action === 'upload-history-delete') {
      deleteUploadHistoryItems([actionTarget.getAttribute('data-upload-id')]);
      return;
    }
    if (action === 'upload-selected-retry') {
      retrySelectedUploads();
      return;
    }
    if (action === 'upload-selected-delete') {
      deleteSelectedUploads();
      return;
    }
    if (action === 'export-cache') {
      exportCache();
      return;
    }
    if (action === 'import-cache') {
      const input = ensurePanel().querySelector('.pfh-import-file');
      if (input) input.click();
      return;
    }
    if (action === 'cloud-backup-save') {
      saveCloudBackupNow();
      return;
    }
    if (action === 'cloud-backup-rekey') {
      return generatePersonalCloudBackupKey();
    }
    if (action === 'cloud-rule-versions-refresh') {
      refreshCloudRuleVersions();
      return;
    }
    if (action === 'cloud-backup-restore') {
      restoreCloudBackup();
      return;
    }
    if (action === 'desktop-bridge-connect') {
      const input = ensurePanel().querySelector('.pfh-desktop-bridge-token');
      pairDesktopBridge(input && input.value);
      return;
    }
    if (action === 'desktop-bridge-disconnect') {
      disconnectDesktopBridge(true);
      renderShell();
      return;
    }
    if (action === 'copy-logs') {
      copyText(formatLogsForCopy());
      showToast(L.copied);
      return;
    }
    if (action === 'clear-logs') {
      state.logs = [];
      saveLogs();
      showToast('\u65e5\u5fd7\u5df2\u6e05\u7a7a');
      renderShell();
      return;
    }
    if (action === 'export-insights') {
      exportInsights();
      return;
    }
    if (action === 'insights-cloud-summary') {
      refreshCloudInsightSummary();
      return;
    }
    if (action === 'insights-readiness') {
      checkCloudInsightReadiness();
      return;
    }
    if (action === 'tips-manage') {
      openLoadingTipsManager();
      return;
    }
    if (action === 'insights-ai-classify') {
      summarizeCloudClassificationRules();
      return;
    }
    if (action === 'insights-apply-classify') {
      applyCloudClassificationRulesToLocal();
      return;
    }
    if (action === 'insights-view-classify') {
      viewCloudClassificationRules();
      return;
    }
    if (action === 'insights-check-ai') {
      checkCloudInsightAiStatus();
      return;
    }
    if (action === 'insights-copy-report') {
      copyCloudInsightReport();
      return;
    }
    if (action === 'insights-copy-ai') {
      copyCloudInsightAiReport();
      return;
    }
    if (action === 'clear-insights') {
      state.insights = emptyInsights();
      saveInsights();
      showToast('\u6d1e\u5bdf\u6570\u636e\u5df2\u6e05\u7a7a');
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-keyword-mode') {
      state.settings.excelKeywordMode = event.target.value === 'brandName' ? 'brandName' : 'english';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-download-mode') {
      state.settings.excelDownloadMode = event.target.value === 'direct' ? 'direct' : 'picker';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target && event.target.name === 'pfh-trace-name-initials') {
      const name = event.target.getAttribute('data-trace-name');
      if (!name || name !== currentTraceName()) { renderShell(); return; }
      const initials = String(event.target.value || '').trim().toUpperCase();
      if (initials && !/^[A-Z]{1,20}$/.test(initials)) {
        showToast('缩写请输入 1–20 个英文字母');
        event.target.value = getTraceNameInitials(currentTraceName());
        return;
      }
      saveTraceNameInitials(name, initials);
      event.target.value = initials;
      if (!initials) {
        traceNameInitialsRetryAt.delete(currentTraceName());
        ensureCurrentTraceNameInitials().then(() => renderShell());
      }
      return;
    }
    if (event.target && event.target.name === 'pfh-ai-model') {
      state.settings.insightAiModel = event.target.value === MODELSCOPE_INSIGHT_MODEL ? MODELSCOPE_INSIGHT_MODEL : 'glm-4.7-flash';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (action === 'confirm-tail-seal') {
      confirmTailSealLength(event.target);
      return;
    }
    if (action === 'copy-all') {
      copyText(formatCopyAll(state.data));
      showToast(L.copied);
      return;
    }

    const pinElement = event.target && event.target.closest && event.target.closest('[data-pin-sku]');
    const pinTarget = pinElement && pinElement.getAttribute('data-pin-sku');
    if (pinTarget) {
      event.stopPropagation();
      togglePin(pinTarget);
      renderShell();
      return;
    }

    const skuButton = event.target && event.target.closest && event.target.closest('[data-sku]');
    if (skuButton) {
      const currentTab = getCurrentDetailViewTab();
      const sku = skuButton.getAttribute('data-sku');
      const data = loadData(sku) || state.index.find((entry) => entry && entry.sku === sku) || null;
      state.sizeImageCustomData = null;
      state.sizeImageCustomDraft = null;
      state.sizeImageCustomOpen = false;
      state.selectedSku = sku;
      state.data = data ? normalizeData(data) : (currentTab === 'sizeImage' || currentTab === 'parameterImage' ? normalizeData({ sku }) : null);
      window.setTimeout(() => refreshMaterialFromApiWithoutDrawer(sku, data).catch((error) => {
        addLog('warn', '悬浮窗后台刷新物料失败', sku + ' | ' + formatErrorMessage(error));
      }), 0);
      state.detailViewPreviousTab = '';
      if (currentTab === 'sizeImage' || currentTab === 'parameterImage') {
        state.view = currentTab;
        state.copywritingMode = false;
        state.skuEditMode = false;
        resetExcelState();
        if (currentTab === 'parameterImage') parameterImageFeature.loadRules();
        expandPanel();
        return;
      }
      state.view = 'detail';
      state.copywritingMode = currentTab === 'copywriting' && Boolean(state.data);
      state.skuEditMode = false;
      resetExcelState();
      if (state.copywritingMode) {
        openCopywritingFromCurrent(false);
        return;
      }
      expandPanel();
      return;
    }

    const editTarget = event.target && event.target.closest && event.target.closest('[data-edit-key]');
    const editKey = editTarget && editTarget.getAttribute('data-edit-key');
    if (editKey === 'productLength') {
      startTailSealEdit(editTarget);
      return;
    }

    const copyTarget = event.target && event.target.closest && event.target.closest('[data-copy-key], [data-material-copy-key]');
    const key = copyTarget && (copyTarget.getAttribute('data-copy-key') || copyTarget.getAttribute('data-material-copy-key'));
    if (key) {
      if (event.target.closest('button, input, textarea, select')) return;
      copyText(copyTarget.hasAttribute('data-copy-value') ? copyTarget.getAttribute('data-copy-value') : (key === 'printSizeText' ? formatPrintSizeDisplay(state.data) : ((state.data && state.data[key]) || '')));
      copyTarget.classList.add('is-copied');
      window.setTimeout(() => copyTarget.classList.remove('is-copied'), 650);
      showToast(L.copied);
    }
  }

  function handlePanelKeydown(event) {
    if (productDevelopmentCopywritingHandleToolsKeydown(event)) return;
    if (state.skuFilterOpen && (event.key === 'Escape' || event.key === 'Tab')) {
      const panel = ensurePanel();
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeSkuFilterModal(panel);
        return;
      }
      const dialog = panel.querySelector('.pfh-sku-filter-dialog');
      const controls = dialog && Array.from(dialog.querySelectorAll('button:not(:disabled):not([hidden]),select:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter((node) => node.getClientRects().length);
      if (controls && controls.length) {
        const first = controls[0], last = controls[controls.length - 1];
        if ((event.shiftKey && event.target === first) || (!event.shiftKey && event.target === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }
      }
    }
    if (myProfile.open && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMyProfile();
      return;
    }
    if (event.key === 'Escape' && (networkDiagnostics.open || networkDiagnostics.offerOpen)) {
      event.preventDefault();
      event.stopPropagation();
      networkDiagnostics.open = false;
      networkDiagnostics.offerOpen = false;
      renderNetworkDiagnostics(ensurePanel());
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target && event.target.matches('[data-material-copy-key]')) {
      event.preventDefault();
      event.target.click();
      return;
    }
    if (state.view === 'home' && event.key === 'Enter' && !event.isComposing && event.target && event.target.classList && event.target.classList.contains('pfh-home-todo-input')) {
      event.preventDefault();
      const addButton = ensurePanel().querySelector('[data-action="home-todo-add"]');
      if (addButton) addButton.click();
      return;
    }
    if (state.ledgerPerformanceGroupOpen && event.key === 'Escape') {
      event.preventDefault();
      closeLedgerPerformanceGroupModal();
      return;
    }
    if (state.ledgerAiImageRetouchComposer && event.key === 'Escape') {
      event.preventDefault();
      closeLedgerAiImageRetouchComposer();
      return;
    }
    if (state.ledgerAiImageViewer && event.key === 'Escape') {
      event.preventDefault();
      closeLedgerAiImageViewer();
      return;
    }
    if (state.infringementImageViewer && event.key === 'Escape') {
      event.preventDefault();
      closeInfringementImageViewer();
      return;
    }
    if (state.view === 'ledger' && state.ledgerFullscreen && event.key === 'Escape') {
      event.preventDefault();
      state.ledgerFullscreen = false;
      renderShell();
      return;
    }
    if (state.skuEditMode && event.target && event.target.matches && event.target.matches('[data-sku-edit-key]')) {
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        saveSkuManualEdits();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        state.skuEditMode = false;
        renderShell();
        return;
      }
    }
    if (state.view === 'ledger' && state.ledgerTimeEditor && event.key === 'Enter' && !event.isComposing && event.target && event.target.matches && event.target.matches('.pfh-ledger-time-date,.pfh-ledger-time-hour,.pfh-ledger-time-minute')) {
      event.preventDefault();
      saveLedgerFinalizedTimeEditor();
      return;
    }
    if (state.view === 'ledger' && event.target && event.target.classList && event.target.classList.contains('pfh-ledger-item') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      toggleLedgerSelection(event.target.getAttribute('data-ledger-sku'), event.target.getAttribute('data-ledger-date'));
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input') && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      runSearch();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-tail-input') && event.key === 'Enter') {
      event.preventDefault();
      confirmTailSealLength(event.target);
    }
  }

  function handlePanelInput(event) {
    if (event.target && event.target.classList && event.target.classList.contains('pfh-home-todo-input')) {
      state.homeTodoDraft = event.target.value;
      return;
    }
    if (productDevelopmentHandleInput(event)) return;
    if (event.target && event.target.classList && event.target.classList.contains('pfh-cache-editor-search')) {
      filterSkuCacheEditorFields(event.target.value);
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-ai-retouch-composer-input')) {
      if (state.ledgerAiImageRetouchComposer) state.ledgerAiImageRetouchComposer.value = event.target.value;
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-ai-prep-input')) {
      const sku = event.target.getAttribute('data-prep-sku')
        || (state.ledgerAiImageViewer && state.ledgerAiImageViewer.sku)
        || '';
      if (sku) updateLedgerAiImagePreparationInlineState(sku);
      return;
    }
    if (state.view === 'parameterImage' && parameterImageFeature.handleInput(event, state.data || {})) return;
    if (event.target && event.target.classList && event.target.classList.contains('pfh-feedback-content')) {
      state.feedbackContent = event.target.value;
      state.feedbackError = '';
      const counter = ensurePanel().querySelector('.pfh-feedback-count');
      if (counter) counter.textContent = Array.from(state.feedbackContent).length + '/2000';
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-filter-query')) {
      state.ledgerFilterQuery = event.target.value;
      window.clearTimeout(state.ledgerFilterTimer);
      state.ledgerFilterTimer = window.setTimeout(() => {
        state.ledgerFilterTimer = 0;
        if (!renderLedgerTabContent(ensurePanel())) renderShell();
        const input = ensurePanel().querySelector('.pfh-ledger-filter-query');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }, 260);
      return;
    }
    if (event.target && event.target.getAttribute && event.target.getAttribute('data-supplement-facts-state')) {
      const key = event.target.getAttribute('data-supplement-facts-state');
      const draft = normalizeSupplementFactsDraft(state.supplementFactsDraft);
      if (Object.prototype.hasOwnProperty.call(draft, key)) draft[key] = event.target.type === 'checkbox' ? Boolean(event.target.checked) : event.target.value;
      state.supplementFactsDraft = saveSupplementFactsDraft(draft);
      renderSupplementFactsPreviewInline();
      return;
    }
    if (event.target && event.target.getAttribute && event.target.getAttribute('data-supplement-facts-row-index') != null) {
      const index = Number(event.target.getAttribute('data-supplement-facts-row-index'));
      const field = event.target.getAttribute('data-supplement-facts-row-field');
      const draft = normalizeSupplementFactsDraft(state.supplementFactsDraft);
      if (Number.isInteger(index) && draft.rows[index] && (field === 'name' || field === 'amount' || field === 'dailyValue')) {
        draft.rows[index][field] = event.target.value;
        state.supplementFactsDraft = saveSupplementFactsDraft(draft);
        renderSupplementFactsPreviewInline();
      }
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-unit-converter-input')) {
      state.cmConverterInput = event.target.value;
      const result = formatCmInchLines(state.cmConverterInput);
      const panel = ensurePanel();
      const output = panel.querySelector('.pfh-unit-converter-result');
      const copyButton = panel.querySelector('[data-action="unit-converter-copy"]');
      if (output) output.innerHTML = unitConverterResultRowsHtml(result);
      if (copyButton) copyButton.disabled = !result;
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-code-formatter-input')) {
      state.codeFormatterInput = event.target.value;
      const result = formatSearchCodes(state.codeFormatterInput);
      const panel = ensurePanel();
      const output = panel.querySelector('.pfh-code-formatter-result');
      const copyButton = panel.querySelector('[data-action="code-formatter-copy"]');
      if (output) output.textContent = result || 'ext:zip|ext:xlsx 编码1|编码2';
      if (copyButton) copyButton.disabled = !result;
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-text')) {
      const sku = getActiveSizeImageSku();
      const type = event.target.getAttribute('data-size-image-type');
      if (sku && type === 'carton') ensureSizeImageSession(sku).cartonRemarkText = event.target.value;
      if (sku && type === 'label') {
        const key = event.target.getAttribute('data-size-image-key') || '';
        if (key) ensureSizeImageSession(sku).labelRemarkTexts[key] = event.target.value;
      }
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-search-input')) {
      event.target.value = normalizeSearchInput(event.target.value);
      updateSearchClear();
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-excel-price')) {
      state.excelPurchasePrice = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-batch-excel-input')) {
      state.batchExcelInput = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-performance-group-input')) {
      state.ledgerPerformanceGroupInput = event.target.value;
      refreshLedgerPerformanceGroupPreview(event.target.closest('.pfh-ledger-performance-group-modal'));
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-manual-sku-add-input')) {
      state.manualSkuAddInput = event.target.value;
      const submit = event.target.closest('.pfh-manual-sku-add-dialog') && event.target.closest('.pfh-manual-sku-add-dialog').querySelector('[data-action="sku-manual-add-submit"]');
      if (submit) submit.disabled = !String(state.manualSkuAddInput || '').trim();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-toy-copywriting-batch-input')) {
      state.toyCopywritingBatchInput = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-magic-toy-label-input')) {
      state.magicToyLabelInput = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-cloud-backup-key')) {
      updateCloudBackupKey(event.target.value);
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-tutorial-cloud-key')) {
      state.settings.cloudBackupKey = event.target.value.trim();
      saveSettings(state.settings);
      state.tutorialEmptyKeyClickCount = 0;
      const tutorialButton = ensurePanel().querySelector('[data-action="first-run-tutorial-done"]');
      if (tutorialButton) tutorialButton.setAttribute('aria-disabled', getCloudBackupKey().length < 4 ? 'true' : 'false');
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-toy-label-sku-input') && !event.target.classList.contains('pfh-copyright-sku-input')) {
      state.toyLabelSkuInput = event.target.value;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-copyright-sku-input')) {
      state.copyrightSkuInput = event.target.value;
      const button = ensurePanel().querySelector('[data-action="copyright-queue-add"]');
      if (button) button.disabled = !state.copyrightSkuInput.trim() || !(state.copyrightPendingFiles || []).length;
    }
  }

  function handlePanelPaste(event) {
    if (event.defaultPrevented) return;
    if (state.view === 'magicUpload' && handleMagicUploadPaste(event)) return;
    if (state.view === 'upload') {
      const panel = document.getElementById(PANEL_ID);
      const drop = event.target && event.target.closest && event.target.closest('.pfh-upload-drop')
        || (panel && panel.querySelector('.pfh-upload-drop:hover'));
      const files = state.uploadMode === 'copyright'
        ? getClipboardCopyrightFiles(event)
        : (state.uploadMode === 'toy-effect' ? getClipboardToyEffectFiles(event) : getClipboardUploadFiles(event));
      if (drop && files.length) {
        event.preventDefault();
        event.stopPropagation();
        drop.classList.add('is-paste-received');
        window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
        if (state.uploadMode === 'copyright') stageCopyrightUploadFiles(files);
        else if (state.uploadMode === 'toy-effect') stageToyEffectUploadFiles(files);
        else processQueuedUploadFiles(files);
        return;
      }
    }
    if (!(event.target && event.target.classList && event.target.classList.contains('pfh-search-input'))) return;
    const pasted = event.clipboardData && event.clipboardData.getData('text');
    if (!pasted || !/[\r\n,，;；、|/\\]/.test(pasted)) return;
    event.preventDefault();
    const input = event.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || start;
    const next = input.value.slice(0, start) + ' ' + pasted + ' ' + input.value.slice(end);
    input.value = normalizeSearchInput(next);
    input.setSelectionRange(input.value.length, input.value.length);
    updateSearchClear();
  }

  function handleSizeImageHoverPaste(event) {
    if (state.view === 'magicUpload' && handleMagicUploadPaste(event)) return;
    if (state.view === 'upload') {
      const panel = document.getElementById(PANEL_ID);
      const drop = panel && panel.querySelector('.pfh-upload-drop:hover, .pfh-upload-drop:focus');
      const files = state.uploadMode === 'copyright'
        ? getClipboardCopyrightFiles(event)
        : (state.uploadMode === 'toy-effect' ? getClipboardToyEffectFiles(event) : getClipboardUploadFiles(event));
      if (!drop || !files.length) return;
      event.preventDefault();
      event.stopPropagation();
      drop.classList.add('is-paste-received');
      window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
      if (state.uploadMode === 'copyright') stageCopyrightUploadFiles(files);
      else if (state.uploadMode === 'toy-effect') stageToyEffectUploadFiles(files);
      else processQueuedUploadFiles(files);
      return;
    }
    if (state.view === 'parameterImage') {
      const panel = document.getElementById(PANEL_ID);
      const drop = panel && panel.querySelector('.pfh-parameter-drop:hover');
      if (!drop || drop.disabled) return;
      const clipboard = event.clipboardData;
      const itemFiles = Array.from(clipboard && clipboard.items || [])
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile()).filter(Boolean);
      const files = itemFiles.concat(Array.from(clipboard && clipboard.files || []));
      if (!files.length) return;
      event.preventDefault();
      event.stopPropagation();
      parameterImageFeature.handleDrop(files, state.data || {});
      return;
    }
    if (state.view !== 'sizeImage' || state.sizeImageBusySku) return;
    const panel = document.getElementById(PANEL_ID);
    const drop = panel && panel.querySelector('.pfh-size-image-drop:hover');
    if (!drop || drop.disabled) return;
    const clipboard = event.clipboardData;
    const imageFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file' && /^image\/(?:png|jpeg)$/.test(item.type || ''))
      .map((item) => item.getAsFile())
      .filter(Boolean)
      .map((file, index) => {
        if (/\.(?:png|jpe?g)$/i.test(file.name || '')) return file;
        const extension = file.type === 'image/jpeg' ? 'jpg' : 'png';
        return new File([file], '\u7c98\u8d34\u56fe\u7247-' + (index + 1) + '.' + extension, { type: file.type || 'image/png' });
      });
    if (!imageFiles.length) return;
    event.preventDefault();
    event.stopPropagation();
    drop.classList.add('is-paste-received');
    window.setTimeout(() => drop.classList.remove('is-paste-received'), 360);
    processSizeImageFiles(imageFiles);
  }

  function getClipboardUploadFiles(event) {
    const clipboard = event && event.clipboardData;
    const itemFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const directFiles = Array.from(clipboard && clipboard.files || []);
    const seen = new Set();
    return itemFiles.concat(directFiles).filter((file) => {
      if (!file || !getUploadKindFromFileName(file.name)) return false;
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getClipboardMagicUploadFiles(event) {
    const clipboard = event && event.clipboardData;
    const itemFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const directFiles = Array.from(clipboard && clipboard.files || []);
    const seen = new Set();
    return itemFiles.concat(directFiles).filter(Boolean).map((file, index) => {
      const name = String(file.name || '');
      const type = String(file.type || '').toLowerCase();
      const isZip = /\.zip$/i.test(name) || /zip/i.test(type);
      const isXlsx = /\.xlsx$/i.test(name) || /spreadsheet|excel/i.test(type);
      if (!isZip && !isXlsx) return null;
      const extension = isZip ? '.zip' : '.xlsx';
      const normalized = /\.(?:zip|xlsx)$/i.test(name)
        ? file
        : new File([file], '粘贴图包-' + (index + 1) + extension, { type: file.type || (isZip ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), lastModified: file.lastModified || Date.now() });
      const key = [normalized.name, normalized.size, normalized.lastModified].join('|');
      if (seen.has(key)) return null;
      seen.add(key);
      return normalized;
    }).filter(Boolean);
  }

  function describeMagicClipboard(event) {
    const clipboard = event && event.clipboardData;
    const items = Array.from(clipboard && clipboard.items || []).map((item) => [item.kind || 'unknown', item.type || 'no-type'].join(':'));
    const files = Array.from(clipboard && clipboard.files || []).map((file) => [file.name || 'no-name', file.type || 'no-type', file.size || 0].join('|'));
    return 'types=' + Array.from(clipboard && clipboard.types || []).join(',') + ' | items=' + (items.join(',') || 'none') + ' | files=' + (files.join(',') || 'none');
  }

  async function readMagicClipboardFiles(event) {
    const direct = getClipboardMagicUploadFiles(event);
    if (direct.length) return direct;
    if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') return [];
    try {
      const clipboardItems = await navigator.clipboard.read();
      const files = [];
      let index = 0;
      for (const item of clipboardItems || []) {
        for (const type of item.types || []) {
          if (!/zip|spreadsheet|excel|octet-stream/i.test(type)) continue;
          const blob = await item.getType(type);
          const isZip = /zip/i.test(type);
          const extension = isZip ? '.zip' : '.xlsx';
          files.push(new File([blob], '粘贴图包-' + (++index) + extension, { type, lastModified: Date.now() }));
        }
      }
      if (files.length) magicUploadLog('info', '通过 Clipboard API 读取到文件', files.map((file) => file.name + '|' + file.type).join('；'));
      return files;
    } catch (error) {
      magicUploadLog('warn', 'Clipboard API 读取失败', formatErrorMessage(error));
      return [];
    }
  }

  function handleMagicUploadPaste(event) {
    if (event.defaultPrevented || state.view !== 'magicUpload') return false;
    if (state.magicUploadMode === 'toy-label') return false;
    const panel = document.getElementById(PANEL_ID);
    const target = event.target;
    const effectMode = state.magicUploadMode === 'effect';
    const dropSelector = effectMode
      ? '.pfh-magic-upload-drop[data-upload-drop="magic-effect"]'
      : '.pfh-magic-upload-drop[data-upload-drop="magic"]';
    const targetDrop = target && typeof target.closest === 'function'
      ? target.closest(dropSelector)
      : null;
    const drop = targetDrop || (panel && panel.querySelector(dropSelector + ':hover, ' + dropSelector + ':focus'));
    if (!drop) return false;

    const flashDrop = () => {
      drop.classList.add('is-paste-received');
      window.setTimeout(() => drop.classList.remove('is-paste-received'), 520);
    };
    if (effectMode) {
      const files = getClipboardToyEffectFiles(event);
      if (!files.length) return false;
      event.preventDefault();
      event.stopPropagation();
      flashDrop();
      magicUploadLog('info', '通过悬浮区域粘贴效果图', files.map((file) => file.name + '|' + Number(file.size || 0)).join('；'));
      stageToyEffectUploadFiles(files, { stayInMagic: true });
      return true;
    }

    event.preventDefault();
    event.stopPropagation();
    const acceptFiles = (files, source) => {
      if (!files || !files.length) return false;
      flashDrop();
      magicUploadLog('info', '通过悬浮区域粘贴文件', source + ' | ' + files.map((file) => file.name + '|' + Number(file.size || 0)).join('；'));
      processMagicUploadZipFiles(files);
      return true;
    };
    const directFiles = getClipboardMagicUploadFiles(event);
    if (acceptFiles(directFiles, 'clipboardData')) return true;

    readMagicClipboardFiles(event).then((files) => {
      if (acceptFiles(files, 'Clipboard API')) return;
      magicUploadLog('warn', '悬浮粘贴未找到可处理文件', describeMagicClipboard(event));
      showToast('剪贴板里没有 ZIP 或 XLSX 文件');
    }).catch((error) => {
      magicUploadLog('warn', '悬浮粘贴读取失败', formatErrorMessage(error));
      showToast('读取剪贴板文件失败，请重试');
    });
    return true;
  }

  function getClipboardCopyrightFiles(event) {
    const clipboard = event && event.clipboardData;
    const itemFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const directFiles = Array.from(clipboard && clipboard.files || []);
    const seen = new Set();
    return itemFiles.concat(directFiles).filter((file) => {
      if (!file || !isCopyrightImageFile(file)) return false;
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((file, index) => normalizeCopyrightImageFile(file, index));
  }

  function getClipboardToyEffectFiles(event) {
    const clipboard = event && event.clipboardData;
    const itemFiles = Array.from(clipboard && clipboard.items || [])
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter(Boolean);
    const directFiles = Array.from(clipboard && clipboard.files || []);
    const seen = new Set();
    return itemFiles.concat(directFiles).filter((file) => {
      if (!isToyEffectImageFile(file)) return false;
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function handlePanelChange(event) {
    if (event.target?.classList?.contains('pfh-design-development-enabled')) {
      if (state.productDevelopmentReview) saveProductDevelopmentReviewDraft(state.productDevelopmentReview);
      state.productDevelopmentReviewEditorOpen = false;
      state.settings.designDevelopmentTabs = event.target.checked === true;
      state.designDevelopmentTab = '';
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target?.classList?.contains('pfh-workspace-layout-enabled')) {
      setWorkspaceLayoutEnabled(event.target.checked === true);
      return;
    }
    if (event.target?.classList?.contains('pfh-pixel-room-animation')) {
      state.settings.pixelRoomAnimation = event.target.checked === true;
      saveSettings(state.settings);
      return;
    }
    if (event.target?.classList?.contains('pfh-pixel-room-enabled')) {
      state.settings.pixelRoomEnabled = event.target.checked === true;
      pixelRoomOvertime = false;
      saveSettings(state.settings);
      renderShell();
      return;
    }
    if (event.target?.classList?.contains('pfh-pixel-room-time')) {
      state.settings.pixelRoomEndTime = normalizePixelRoomTime(event.target.value);
      event.target.value = state.settings.pixelRoomEndTime;
      saveSettings(state.settings);
      return;
    }
    if (productDevelopmentHandleChange(event)) return;
    const skuFilterField = event.target && event.target.getAttribute && event.target.getAttribute('data-sku-filter');
    if (skuFilterField && Object.prototype.hasOwnProperty.call(state.skuFilters, skuFilterField)) {
      state.skuFilters[skuFilterField] = event.target.value || '';
      state.skuPage = 1;
      renderSkuListForActiveView(ensurePanel());
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-cache-value-type')) {
      updateSkuCacheEditorValueControl(event.target);
      return;
    }
    if (state.view === 'parameterImage' && parameterImageFeature.handleChange(event, state.data || {})) return;
    if (event.target && event.target.classList && event.target.classList.contains('pfh-feedback-type')) {
      state.feedbackType = normalizeFeedbackTypeClient(event.target.value);
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-filter-status')) {
      state.ledgerFilterStatus = event.target.value || 'all';
      if (!renderLedgerTabContent(ensurePanel())) renderShell();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-filter-image')) {
      state.ledgerFilterImage = event.target.value || 'all';
      if (!renderLedgerTabContent(ensurePanel())) renderShell();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-filter-workflow')) {
      state.ledgerFilterWorkflow = event.target.value || 'all';
      if (!renderLedgerTabContent(ensurePanel())) renderShell();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-copywriting-view-select')) {
      state.copywritingView = event.target.value === 'full' ? 'full' : 'file';
      renderShell();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-text')) {
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-remark-input')) {
      const sku = getActiveSizeImageSku();
      if (!sku) return;
      ensureSizeImageSession(sku).includeRemark = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-round-arc-input')) {
      const sku = getActiveSizeImageSku();
      if (!sku) return;
      ensureSizeImageSession(sku).includeRoundArc = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-batch-number-input')) {
      const sku = getActiveSizeImageSku();
      if (!sku) return;
      ensureSizeImageSession(sku).includeBatchNumber = Boolean(event.target.checked);
      regenerateCurrentSizeImages();
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-size-image-file-input')) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length) processSizeImageFiles(files);
      return;
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-upload-file')) {
      const files = Array.from(event.target.files || []);
      const kind = event.target.getAttribute('data-upload-kind') || '';
      event.target.value = '';
      if (kind === 'magic') {
        magicUploadLog('info', '通过文件选择器收到文件', files.map((file) => file.name + '|' + file.type + '|' + file.size).join('；') || '没有文件');
        processMagicUploadZipFiles(files);
      }
      else if (kind === 'magic-effect') {
        magicUploadLog('info', '效果图文件选择', files.map((file) => file.name + '|' + file.type + '|' + file.size).join('；') || '没有文件');
        stageToyEffectUploadFiles(files, { stayInMagic: true });
      }
      else if (kind === 'copyright') stageCopyrightUploadFiles(files);
      else if (kind === 'toy-effect') stageToyEffectUploadFiles(files);
      else processQueuedUploadFiles(files);
    }
    if (event.target && event.target.classList && event.target.classList.contains('pfh-ledger-date')) {
      const month = normalizeLedgerMonth(event.target.value);
      state.ledgerDate = month + '-01';
      renderShell();
    }
  }

  function handlePanelDragStart(event) {
    const homeCard = event.target && event.target.closest && event.target.closest('[data-home-feature-card]');
    if (homeCard && state.view === 'home' && state.homeFeatureEditMode) {
      const featureId = homeCard.getAttribute('data-home-feature-id') || '';
      if (!featureId || !event.dataTransfer) return;
      state.homeFeatureDragId = featureId;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/x-pfh-home-feature', featureId);
      event.dataTransfer.setData('text/plain', featureId);
      homeCard.classList.add('is-dragging');
      return;
    }
    const card = event.target && event.target.closest && event.target.closest('[data-upload-drag-sku]');
    if (!card || state.view !== 'upload' || !isUploadSkuPickerMode(state.uploadMode)) return;
    const sku = card.getAttribute('data-upload-drag-sku') || card.getAttribute('data-sku') || '';
    if (!sku || !event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-pfh-upload-sku', sku);
    event.dataTransfer.setData('text/plain', sku);
    card.classList.add('is-dragging');
  }

  function handlePanelDragEnd(event) {
    const homeCard = event.target && event.target.closest && event.target.closest('[data-home-feature-card]');
    if (homeCard) homeCard.classList.remove('is-dragging');
    const card = event.target && event.target.closest && event.target.closest('[data-upload-drag-sku]');
    if (card) card.classList.remove('is-dragging');
    const panel = event.currentTarget;
    if (panel && panel.querySelectorAll) {
      panel.querySelectorAll('.is-drag-over,.is-drop-target').forEach((item) => item.classList.remove('is-drag-over', 'is-drop-target'));
    }
    state.homeFeatureDragId = '';
  }

  function handlePanelDragOver(event) {
    const homeGroup = event.target && event.target.closest && event.target.closest('.pfh-home-feature-edit-group');
    if (homeGroup && state.view === 'home' && state.homeFeatureEditMode && state.homeFeatureDragId) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      const panel = event.currentTarget;
      if (panel && panel.querySelectorAll) panel.querySelectorAll('.is-drop-target').forEach((item) => item.classList.remove('is-drop-target'));
      homeGroup.classList.add('is-drag-over');
      const targetCard = event.target.closest && event.target.closest('[data-home-feature-card]');
      if (targetCard && targetCard.getAttribute('data-home-feature-id') !== state.homeFeatureDragId) targetCard.classList.add('is-drop-target');
      return;
    }
    if (state.view === 'magicUpload' && event.target && event.target.closest && event.target.closest('.pfh-magic-upload-drop')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      event.target.closest('.pfh-magic-upload-drop').classList.add('is-drag-over');
      return;
    }
    const skuDrop = event.target && event.target.closest && event.target.closest('[data-upload-sku-drop]');
    if (skuDrop && state.view === 'upload' && isUploadSkuPickerMode(state.uploadMode)) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      skuDrop.classList.add('is-drag-over');
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-parameter-page')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-size-image-page')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-upload-section')) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handlePanelDrop(event) {
    const homeGroup = event.target && event.target.closest && event.target.closest('.pfh-home-feature-edit-group');
    if (homeGroup && state.view === 'home' && state.homeFeatureEditMode) {
      const featureId = state.homeFeatureDragId || (event.dataTransfer && event.dataTransfer.getData('application/x-pfh-home-feature'));
      if (!featureId) return;
      event.preventDefault();
      const panel = event.currentTarget;
      if (panel && panel.querySelectorAll) panel.querySelectorAll('.is-drag-over,.is-drop-target').forEach((item) => item.classList.remove('is-drag-over', 'is-drop-target'));
      const moved = state.workMode === 'product-development'
        ? moveProductDevelopmentFeatureCard(featureId, homeGroup.getAttribute('data-home-feature-group'), event.target.closest('[data-home-feature-card]'), event)
        : moveHomeFeatureCard(featureId, homeGroup.getAttribute('data-home-feature-group'), event.target.closest('[data-home-feature-card]'), event);
      if (!moved) state.homeFeatureDragId = '';
      return;
    }
    if (state.view === 'magicUpload' && event.target && event.target.closest && event.target.closest('.pfh-magic-upload-drop')) {
      event.preventDefault();
      const drop = event.target.closest('.pfh-magic-upload-drop');
      drop.classList.remove('is-drag-over');
      const rawFiles = Array.from(event.dataTransfer && event.dataTransfer.files || []);
      const isEffectDrop = drop.getAttribute('data-upload-drop') === 'magic-effect';
      const files = isEffectDrop ? rawFiles.filter(isToyEffectImageFile) : rawFiles.filter((file) => /\.(?:zip|xlsx)$/i.test(file.name || ''));
      magicUploadLog('info', '收到拖拽文件', rawFiles.map((file) => [file.name || '无文件名', file.type || '无类型', file.size || 0].join('|')).join('；') || '没有文件');
      if (files.length && isEffectDrop) stageToyEffectUploadFiles(files, { stayInMagic: true });
      else if (files.length) processMagicUploadZipFiles(files);
      else {
        magicUploadLog('warn', isEffectDrop ? '拖拽内容不是效果图' : '拖拽内容不是 ZIP/XLSX', rawFiles.map((file) => file.name || file.type || '未知').join('；') || '浏览器未提供文件');
        showToast(isEffectDrop ? '效果图只接受 JPG / PNG / BMP' : '魔法上传只接受 ZIP 图包或 XLSX');
      }
      return;
    }
    const skuDrop = event.target && event.target.closest && event.target.closest('[data-upload-sku-drop]');
    const draggedSku = event.dataTransfer && event.dataTransfer.getData('application/x-pfh-upload-sku');
    if (skuDrop && draggedSku && state.view === 'upload' && isUploadSkuPickerMode(state.uploadMode)) {
      event.preventDefault();
      skuDrop.classList.remove('is-drag-over');
      addUploadTaskFromSku(draggedSku, state.uploadMode);
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-parameter-page')) {
      event.preventDefault();
      parameterImageFeature.handleDrop(Array.from(event.dataTransfer && event.dataTransfer.files || []), state.data || {}, { focusSave: true });
      return;
    }
    if (event.target && event.target.closest && event.target.closest('.pfh-size-image-page')) {
      event.preventDefault();
      const files = Array.from(event.dataTransfer && event.dataTransfer.files || []);
      if (files.length) processSizeImageFiles(files, { focusSave: true });
      return;
    }
    if (!(event.target && event.target.closest && event.target.closest('.pfh-upload-section'))) return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer && event.dataTransfer.files || []);
    if (state.uploadMode === 'copyright') stageCopyrightUploadFiles(files);
    else if (state.uploadMode === 'toy-effect') stageToyEffectUploadFiles(files);
    else processQueuedUploadFiles(files);
  }
