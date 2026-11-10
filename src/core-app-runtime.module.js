  function handlePanelClick(event) {
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
      return;
    }
    if (state.skuSortMenuOpen && !(event.target && event.target.closest && event.target.closest('.pfh-sku-sort-menu'))) {
      state.skuSortMenuOpen = false;
      renderShell();
      return;
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
      if (!renderProductDevelopmentTaskSidebarList(ensurePanel()) && !renderSkuListContent(ensurePanel())) renderShell();
      return;
    }
    if (action === 'sku-list-sort') {
      state.settings.skuListSort = actionTarget.getAttribute('data-sort') === 'acquired' ? 'acquired' : 'assigned';
      state.skuPage = 1;
      state.skuSortMenuOpen = false;
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

  async function processQueuedUploadFiles(files) {
    const supported = Array.from(files || []).filter((file) => file && getUploadKindFromFileName(file.name));
    if (!supported.length) {
      showToast('\u8bf7\u62d6\u5165\u6216\u7c98\u8d34 xls\u3001xlsx\u3001zip \u6216 rar \u6587\u4ef6');
      return;
    }
    for (const file of supported) await storeQueuedUploadFile(file);
  }

  function isCopyrightImageFile(file) {
    return Boolean(file && (/^image\/(?:jpeg|png)$/i.test(file.type || '') || /\.(?:png|jpe?g)$/i.test(file.name || '')));
  }

  function normalizeCopyrightImageFile(file, index) {
    if (/\.(?:png|jpe?g)$/i.test(file && file.name || '')) return file;
    const extension = file && file.type === 'image/jpeg' ? 'jpg' : 'png';
    return new File([file], '\u7248\u6743\u56fe-' + (Number(index) + 1) + '.' + extension, { type: file.type || 'image/png', lastModified: file.lastModified || Date.now() });
  }

  function stageCopyrightUploadFiles(files) {
    const candidates = Array.from(files || []).filter(isCopyrightImageFile).map(normalizeCopyrightImageFile);
    const supported = candidates.filter((file) => file.size <= 50 * 1024 * 1024);
    if (!supported.length) {
      showToast(candidates.length ? '\u7248\u6743\u56fe\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 50MB' : '\u8bf7\u7c98\u8d34\u6216\u62d6\u5165 JPG / PNG \u56fe\u7247');
      return;
    }
    const current = Array.isArray(state.copyrightPendingFiles) ? state.copyrightPendingFiles : [];
    const seen = new Set(current.map((file) => [file.name, file.size, file.lastModified].join('|')));
    const additions = supported.filter((file) => {
      const key = [file.name, file.size, file.lastModified].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    state.copyrightPendingFiles = current.concat(additions).slice(0, 60);
    renderShell();
    showToast('\u5df2\u9009\u62e9 ' + state.copyrightPendingFiles.length + ' \u5f20\u7248\u6743\u56fe');
  }

  function assignCopyrightFilesToSkus(skus, files) {
    const assignments = new Map(skus.map((sku) => [sku, []]));
    const named = files.map((file) => ({ file, matches: skus.filter((sku) => String(file.name || '').toUpperCase().includes(sku)) }));
    if (named.every((item) => item.matches.length === 1)) {
      named.forEach((item) => assignments.get(item.matches[0]).push(item.file));
      if (skus.every((sku) => assignments.get(sku).length)) return assignments;
      assignments.forEach((value, key) => assignments.set(key, []));
    }
    if (skus.length === 1) {
      assignments.set(skus[0], files.slice());
      return assignments;
    }
    if (files.length === 1) {
      skus.forEach((sku) => assignments.set(sku, files.slice()));
      return assignments;
    }
    if (files.length === skus.length) {
      skus.forEach((sku, index) => assignments.set(sku, [files[index]]));
      return assignments;
    }
    return null;
  }

  async function addCopyrightQueueItems(input, pendingFiles) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    const files = Array.from(pendingFiles || []).filter(isCopyrightImageFile);
    if (!skus.length || !files.length) {
      showToast('\u8bf7\u5148\u8f93\u5165 SKU \u5e76\u7c98\u8d34\u6216\u9009\u62e9\u7248\u6743\u56fe');
      return;
    }
    const assignments = assignCopyrightFilesToSkus(skus, files);
    if (!assignments) {
      showToast('\u591a SKU \u65f6\uff0c\u8bf7\u8ba9\u56fe\u7247\u6570\u91cf\u4e0e SKU \u6570\u91cf\u4e00\u81f4\uff0c\u6216\u5728\u6587\u4ef6\u540d\u4e2d\u5e26\u4e0a SKU');
      return;
    }
    try {
      const queue = loadUploadQueue();
      const now = new Date().toLocaleString();
      for (const sku of skus) {
        let item = queue.find((entry) => entry.kind === 'copyright' && entry.sku === sku && !/\u6210\u529f/.test(entry.status || ''));
        if (!item) {
          const cached = loadData(sku);
          item = {
            id: 'copyright-' + sku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            kind: 'copyright',
            sku,
            name: buildUploadDisplayName(cached, '', sku),
            copyrightFiles: [],
            createdAt: now,
            updatedAt: now,
          };
          queue.unshift(item);
        }
        const existingNames = new Set(getCopyrightUploadEntries(item).map((entry) => entry.name + '|' + entry.size));
        for (const [index, file] of assignments.get(sku).entries()) {
          const identity = file.name + '|' + file.size;
          if (existingNames.has(identity)) continue;
          const key = uploadFileKey(sku, 'copyright') + ':' + Date.now() + ':' + index + ':' + Math.random().toString(36).slice(2, 7);
          await putUploadFile(key, cloneUploadFile(file));
          item.copyrightFiles.push({ key, name: file.name, size: file.size, type: file.type || guessMime(file.name) });
          existingNames.add(identity);
        }
        item.status = getCopyrightUploadEntries(item).length ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = getCopyrightUploadEntries(item).length ? '\u7248\u6743\u56fe\u5df2\u5c31\u7eea' : '\u7f3a\u7248\u6743\u56fe';
        item.skipReason = '';
        item.forceReplace = false;
        item.updatedAt = now;
      }
      state.uploadQueue = queue;
      state.copyrightSkuInput = '';
      state.copyrightPendingFiles = [];
      state.uploadPage = 1;
      saveUploadQueue();
      renderShell();
      showToast(skus.length + ' \u4e2a\u7248\u6743\u56fe\u4efb\u52a1\u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper copyright queue failed:', error);
      showToast('\u7248\u6743\u56fe\u4efb\u52a1\u4fdd\u5b58\u5931\u8d25');
    }
  }

  function startTailSealEdit(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    if (!row) return;
    const valueBox = row.querySelector('.pfh-value');
    if (!valueBox) return;
    row.classList.add('is-inline-editing');
    const current = firstNumber(state.data && state.data.productLength);
    valueBox.innerHTML = '<span class="pfh-inline-edit"><input class="pfh-tail-input" type="text" placeholder="cm" value="' +
      escapeHtml(Number.isFinite(current) ? trimNumber(current) : '') +
      '"><button type="button" data-action="confirm-tail-seal">' + escapeHtml(L.ok) + '</button></span>';
    const input = valueBox.querySelector('input');
    if (input) input.focus();
  }

  function confirmTailSealLength(target) {
    const row = target && target.closest && target.closest('[data-key="productLength"]');
    const input = row && row.querySelector('.pfh-tail-input');
    const cm = firstNumber(input && input.value);
    if (!Number.isFinite(cm) || cm <= 0) {
      showToast(L.invalidCm);
      return;
    }
    const value = formatDimensionPart([cm], 0);
    state.data = normalizeData({ ...(state.data || {}), tailSealLengthValue: value, productLength: value });
    if (state.data.sku) saveData(state.data.sku, state.data);
    renderShell();
  }

  async function storeQueuedUploadFile(file) {
    if (!file) return;
    const kind = getUploadKindFromFileName(file.name);
    if (!kind) return;
    const skus = getSkusFromFileName(file.name);
    if (!skus.length) {
      showToast(L.uploadNoSkuInFile + ': ' + file.name);
      return;
    }
    if (kind === 'zip' && file.size > UPLOAD_MAX_ZIP_BYTES) {
      const skippedItems = [];
      for (const sku of skus) {
        const item = ensureUploadQueueItem(sku, file.name);
        if (item.zipKey) deleteUploadFile(item.zipKey).catch((error) => console.warn('PLM floating helper upload file cleanup failed:', error));
        item.zipName = file.name;
        item.zipKey = '';
        item.status = '\u5df2\u8df3\u8fc7';
        item.step = L.uploadFileTooLarge;
        item.skipReason = L.uploadFileTooLarge;
        item.updatedAt = new Date().toLocaleString();
        skippedItems.push(item);
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + L.uploadFileTooLarge);
      return;
    }
    try {
      for (const sku of skus) {
        const key = uploadFileKey(sku, kind);
        await putUploadFile(key, cloneUploadFile(file));
        const item = ensureUploadQueueItem(sku, file.name);
        if (kind === 'xlsx') {
          item.xlsxName = file.name;
          item.xlsxKey = key;
        } else {
          item.zipName = file.name;
          item.zipKey = key;
        }
        item.status = item.xlsxKey && item.zipKey ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6';
        item.step = item.xlsxKey && item.zipKey ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item);
        item.forceReplace = false;
        item.skipReason = '';
        item.updatedAt = new Date().toLocaleString();
      }
      saveUploadQueue();
      state.uploadExpanded = true;
      state.view = 'upload';
      renderShell();
      showToast(skus.join(' / ') + ' ' + kind.toUpperCase() + ' \u5df2\u52a0\u5165');
    } catch (error) {
      console.warn('PLM floating helper store upload file failed:', error);
      showToast('\u6587\u4ef6\u8bb0\u5f55\u5931\u8d25');
    }
  }

  function ensureUploadQueueItem(sku, filename) {
    let item = state.uploadQueue.find((entry) => (entry.kind || 'standard') === 'standard' && entry.sku === sku && !/成功/.test(entry.status || ''));
    if (item) return item;
    const cached = loadData(sku);
    item = {
      id: sku + '-' + Date.now(),
      sku,
      name: buildUploadDisplayName(cached, filename, sku),
      status: '\u7f3a\u6587\u4ef6',
      step: '',
      forceReplace: false,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString(),
    };
    state.uploadQueue.unshift(item);
    return item;
  }

  function addToyLabelQueueItems(input) {
    const skus = Array.from(new Set((String(input || '').match(/\bSKU\d+\b/ig) || []).map((sku) => sku.toUpperCase())));
    if (!skus.length) {
      showToast('请粘贴至少一个 SKU 编码');
      return;
    }
    const queued = new Set((state.uploadQueue || []).filter((item) => item.kind === 'toy-label' && !/\u6210\u529f/.test(item.status || '')).map((item) => item.sku));
    const now = new Date().toLocaleString();
    const items = skus.filter((sku) => !queued.has(sku)).map((sku, index) => {
      const cached = loadData(sku);
      return {
        id: 'toy-label-' + sku + '-' + Date.now() + '-' + index,
        kind: 'toy-label',
        sku,
        name: buildUploadDisplayName(cached, '', sku),
        xlsxKey: 'toy-label',
        zipKey: 'toy-label',
        status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
        step: cached ? '\u7b49\u5f85\u6279\u91cf\u641c\u7d22' : '\u7b49\u5f85\u4ece\u8bbe\u8ba1\u4efb\u52a1\u83b7\u53d6\u6570\u636e',
        createdAt: now,
        updatedAt: now,
      };
    });
    if (!items.length) {
      showToast('这些 SKU 已在玩具标签任务栏中');
      return;
    }
    state.uploadQueue = items.concat(state.uploadQueue || []);
    state.toyLabelSkuInput = '';
    state.uploadPage = 1;
    saveUploadQueue();
    renderShell();
    showToast(items.length + ' 个玩具标签任务已加入');
  }

  function addUploadTaskFromSku(sku, mode) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const uploadMode = normalizeUploadMode(mode);
    if (!normalizedSku || !isUploadSkuPickerMode(uploadMode)) return;
    const queue = loadUploadQueue();
    const existing = queue.find((item) => getUploadItemMode(item) === uploadMode && item.sku === normalizedSku && !/\u6210\u529f/.test(item.status || ''));
    if (existing) {
      state.uploadMode = uploadMode;
      state.uploadView = 'queue';
      renderShell();
      showToast(normalizedSku + ' 已在当前任务栏中');
      return;
    }
    const cached = loadData(normalizedSku);
    const now = new Date().toLocaleString();
    const item = uploadMode === 'toy-label'
      ? {
        id: 'toy-label-' + normalizedSku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'toy-label',
        sku: normalizedSku,
        name: buildUploadDisplayName(cached, '', normalizedSku),
        xlsxKey: 'toy-label',
        zipKey: 'toy-label',
        status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
        step: cached ? '\u7b49\u5f85\u6279\u91cf\u641c\u7d22' : '\u7b49\u5f85\u4ece\u8bbe\u8ba1\u4efb\u52a1\u83b7\u53d6\u6570\u636e',
        createdAt: now,
        updatedAt: now,
      }
      : {
        id: 'copyright-' + normalizedSku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'copyright',
        sku: normalizedSku,
        name: buildUploadDisplayName(cached, '', normalizedSku),
        copyrightFiles: [],
        status: '\u7f3a\u6587\u4ef6',
        step: '\u7f3a\u7248\u6743\u56fe',
        createdAt: now,
        updatedAt: now,
      };
    queue.unshift(item);
    state.uploadQueue = queue;
    state.uploadMode = uploadMode;
    state.uploadView = 'queue';
    state.uploadPage = 1;
    saveUploadQueue();
    renderShell();
    showToast(normalizedSku + ' 已加入' + (uploadMode === 'copyright' ? '版权图' : '玩具标签') + '任务');
  }

  function cloneUploadFile(file) {
    return new File([file], file.name, { type: file.type || guessMime(file.name), lastModified: file.lastModified || Date.now() });
  }

  function getSkusFromFileName(filename) {
    const matches = String(filename || '').match(/\bSKU\d+\b/ig) || [];
    return matches.map((sku) => sku.toUpperCase()).filter((sku, index, arr) => arr.indexOf(sku) === index);
  }

  function getMagicUploadSkusFromFileName(filename) {
    const matches = String(filename || '').match(/\bSKU\d{8}\b/ig) || [];
    return matches.map((sku) => sku.toUpperCase()).filter((sku, index, arr) => arr.indexOf(sku) === index);
  }

  function getUploadKindFromFileName(filename) {
    const lower = String(filename || '').toLowerCase();
    if (/\.(xlsx|xls)$/.test(lower)) return 'xlsx';
    if (/\.(zip|rar)$/.test(lower)) return 'zip';
    return '';
  }

  function isToyEffectImageFile(file) {
    return Boolean(file && (/^image\/(?:jpeg|png|bmp)$/i.test(file.type || '') || /\.(?:png|jpe?g|bmp)$/i.test(file.name || '')));
  }

  function normalizeToyEffectMatchText(value) {
    return String(value || '')
      .replace(/\.[^.]+$/, '')
      .replace(/(?:效果图|效果|商品图|SKU图)$/i, '')
      .toLowerCase()
      .replace(/[\s_\-—–·•,，。:：/\\()[\]{}【】（）]/g, '');
  }

  function collectProjectNameRows() {
    const header = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => {
        const names = cells.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
        return names.includes('\u5546\u54c1\u7f16\u7801') && names.includes('\u5546\u54c1\u540d\u79f0');
      }) || [];
    const headerNames = header.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
    const skuIndex = headerNames.indexOf('\u5546\u54c1\u7f16\u7801');
    const nameIndex = headerNames.indexOf('\u5546\u54c1\u540d\u79f0');
    const brandIndex = headerNames.indexOf('\u54c1\u724c');
    if (skuIndex < 0 || nameIndex < 0) return [];
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body) return [];
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const sku = (((compactText(cells[skuIndex] && (cells[skuIndex].innerText || cells[skuIndex].textContent)) || '').match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        brand: brandIndex >= 0 ? compactText(cells[brandIndex] && (cells[brandIndex].innerText || cells[brandIndex].textContent)) : '',
        name: nameIndex >= 0 ? compactText(cells[nameIndex] && (cells[nameIndex].innerText || cells[nameIndex].textContent)) : '',
      };
    }).filter((row) => row.sku && row.name && row.rowId);
  }

  function normalizeToyEffectCandidate(value) {
    if (!value) return null;
    const sku = String(value.sku || '').trim().toUpperCase();
    const name = compactText(value.name || '');
    if (!sku || !name) return null;
    return {
      sku,
      rowId: String(value.rowId || value.projectRowId || value.projectId || '').trim(),
      brand: compactText(value.brand || ''),
      name,
    };
  }

  function mergeToyEffectCandidates(...lists) {
    const bySku = new Map();
    lists.forEach((list) => {
      (Array.isArray(list) ? list : []).forEach((value) => {
        const candidate = normalizeToyEffectCandidate(value);
        if (!candidate) return;
        const previous = bySku.get(candidate.sku) || {};
        bySku.set(candidate.sku, {
          sku: candidate.sku,
          rowId: candidate.rowId || previous.rowId || '',
          brand: candidate.brand || previous.brand || '',
          name: candidate.name || previous.name || '',
        });
      });
    });
    return Array.from(bySku.values());
  }

  function readToyEffectCandidateCache() {
    if (toyEffectCandidateCache) return toyEffectCandidateCache;
    let saved = null;
    try {
      saved = typeof GM_getValue === 'function'
        ? GM_getValue(TOY_EFFECT_CANDIDATE_CACHE_KEY, null)
        : JSON.parse(localStorage.getItem(TOY_EFFECT_CANDIDATE_CACHE_KEY) || 'null');
    } catch (_) {
      saved = null;
    }
    const updatedAt = Number(saved && saved.updatedAt) || 0;
    const fresh = updatedAt > 0 && Date.now() - updatedAt <= TOY_EFFECT_CANDIDATE_CACHE_TTL_MS;
    toyEffectCandidateCache = {
      updatedAt,
      candidates: fresh ? mergeToyEffectCandidates(saved && saved.candidates).slice(0, TOY_EFFECT_CANDIDATE_CACHE_MAX) : [],
    };
    return toyEffectCandidateCache;
  }

  function saveToyEffectCandidateCache(candidates) {
    const payload = {
      updatedAt: Date.now(),
      candidates: mergeToyEffectCandidates(candidates).slice(0, TOY_EFFECT_CANDIDATE_CACHE_MAX),
    };
    toyEffectCandidateCache = payload;
    try {
      if (typeof GM_setValue === 'function') GM_setValue(TOY_EFFECT_CANDIDATE_CACHE_KEY, payload);
      else localStorage.setItem(TOY_EFFECT_CANDIDATE_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('PLM floating helper effect candidate cache save failed:', error);
    }
  }

  function getCachedToyEffectCandidates() {
    const saved = readToyEffectCandidateCache();
    const indexed = (state.index || []).map(normalizeToyEffectCandidate).filter(Boolean);
    return mergeToyEffectCandidates(saved.candidates, indexed);
  }

  function canResolveToyEffectFiles(files, candidates) {
    if (!Array.isArray(files) || !files.length || !Array.isArray(candidates) || !candidates.length) return false;
    return files.every((file) => {
      const resolved = resolveToyEffectFile(file, candidates);
      return Boolean(resolved && resolved.candidate && !resolved.ambiguous);
    });
  }

  async function collectToyEffectMatchCandidates(files) {
    const cachedCandidates = getCachedToyEffectCandidates();
    if (canResolveToyEffectFiles(files, cachedCandidates)) {
      magicUploadLog('info', '效果图使用商品候选缓存', cachedCandidates.length + ' 个候选');
      return cachedCandidates;
    }
    let rows = collectProjectNameRows();
    if (!rows.length) {
      const ready = await ensureNewProductProjectPage();
      if (ready && await ensureDesignTaskTab()) {
        await expandProjectResultPageSize(PROJECT_RESULT_MAX_PAGE_SIZE);
        await wait(250);
        rows = collectProjectNameRows();
      }
    } else {
      await expandProjectResultPageSize(PROJECT_RESULT_MAX_PAGE_SIZE);
      await wait(250);
      rows = collectProjectNameRows();
    }
    const indexedCandidates = [];
    (state.index || []).forEach((item) => {
      const data = normalizeData(loadData(item.sku) || item);
      if (data.sku && data.name) indexedCandidates.push({ sku: data.sku, rowId: data.projectRowId || data.projectId || '', brand: data.brand || '', name: data.name });
    });
    const candidates = mergeToyEffectCandidates(cachedCandidates, indexedCandidates, rows).filter((row) => row.sku && row.name);
    if (rows.length) saveToyEffectCandidateCache(candidates);
    return candidates;
  }

  function resolveToyEffectFile(file, candidates) {
    const filename = String(file && file.name || '');
    const normalizedFilename = normalizeToyEffectMatchText(filename);
    const directSkus = getSkusFromFileName(filename);
    const directMatches = directSkus.length ? candidates.filter((candidate) => directSkus.includes(candidate.sku)) : [];
    if (directMatches.length === 1) return { candidate: directMatches[0] };
    const exact = candidates.filter((candidate) => normalizeToyEffectMatchText(candidate.name) === normalizedFilename);
    if (exact.length === 1) return { candidate: exact[0] };
    if (exact.length > 1) return { ambiguous: exact };
    const relaxed = candidates.map((candidate) => {
      const candidateName = normalizeToyEffectMatchText(candidate.name);
      if (!candidateName || candidateName.length < 6 || normalizedFilename.length < 6) return null;
      if (normalizedFilename.includes(candidateName)) return { candidate, score: candidateName.length + 1000 };
      if (candidateName.includes(normalizedFilename)) return { candidate, score: normalizedFilename.length };
      return null;
    }).filter(Boolean).sort((a, b) => b.score - a.score);
    if (!relaxed.length) return { unmatched: true };
    const best = relaxed[0];
    const tied = relaxed.filter((item) => item.score === best.score && item.candidate.sku !== best.candidate.sku);
    return tied.length ? { ambiguous: [best].concat(tied).map((item) => item.candidate) } : { candidate: best.candidate };
  }

  async function addToyEffectQueueFile(file, candidate, queueOverride) {
    const queue = Array.isArray(queueOverride) ? queueOverride : loadUploadQueue();
    let item = queue.find((entry) => entry.kind === 'toy-effect' && entry.sku === candidate.sku && !/\u6210\u529f/.test(entry.status || ''));
    const key = 'toy-effect:' + candidate.sku + ':' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
    await putUploadFile(key, cloneUploadFile(file));
    const effectFiles = getToyEffectUploadEntries(item);
    if (effectFiles.length >= TOY_EFFECT_MAX_FILES) {
      await deleteUploadFile(key);
      return 'limit';
    }
    if (effectFiles.some((entry) => entry.name === file.name)) {
      await deleteUploadFile(key);
      return false;
    }
    const now = new Date().toLocaleString();
    const nextFile = { name: file.name, key, size: file.size || 0, lastModified: file.lastModified || 0 };
    if (!item) {
      const cached = normalizeData(loadData(candidate.sku) || {});
      const next = normalizeData({ ...cached, sku: candidate.sku, brand: candidate.brand || cached.brand || '', name: candidate.name || cached.name || '', projectRowId: candidate.rowId || cached.projectRowId || '' });
      saveDataDirect(candidate.sku, next);
      upsertIndex(next);
      item = {
        id: 'toy-effect-' + candidate.sku + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'toy-effect',
        sku: candidate.sku,
        name: buildUploadDisplayName(next, file.name, candidate.sku),
        projectRowId: candidate.rowId || '',
        effectFiles: [nextFile],
        status: '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe',
        step: '\u5f85\u4e0a\u4f20\u5230 BOM \u6548\u679c\u56fe',
        createdAt: now,
        updatedAt: now,
      };
      queue.unshift(item);
    } else {
      item.effectFiles = effectFiles.concat(nextFile);
      item.projectRowId = item.projectRowId || candidate.rowId || '';
      item.status = '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe';
      item.step = '\u5f85\u4e0a\u4f20\u5230 BOM \u6548\u679c\u56fe';
      item.updatedAt = now;
    }
    state.uploadQueue = queue;
    return true;
  }

  async function stageToyEffectUploadFiles(files, options) {
    const stayInMagic = Boolean(options && options.stayInMagic);
    const candidatesFiles = Array.from(files || []).filter(isToyEffectImageFile);
    const supported = candidatesFiles.filter((file) => file.size <= 50 * 1024 * 1024);
    if (!supported.length) {
      showToast(candidatesFiles.length ? '\u73a9\u5177\u6548\u679c\u56fe\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 50MB' : '\u8bf7\u62d6\u5165 JPG / PNG \u73a9\u5177\u6548\u679c\u56fe');
      return;
    }
    try {
      const candidates = await collectToyEffectMatchCandidates(supported);
      const queue = loadUploadQueue();
      const unmatched = [];
      let added = 0;
      for (const file of supported) {
        const resolved = resolveToyEffectFile(file, candidates);
        if (!resolved.candidate) {
          unmatched.push(file.name + (resolved.ambiguous ? '\uff08\u4ea7\u54c1\u540d\u91cd\u590d\uff09' : ''));
          continue;
        }
        const queued = await addToyEffectQueueFile(file, resolved.candidate, queue);
        if (queued === true) added += 1;
        else if (queued === 'limit') unmatched.push(file.name + '（该 SKU 效果图已达 3 张上限）');
      }
      state.uploadMode = 'toy-effect';
      state.uploadView = 'queue';
      if (stayInMagic) {
        state.view = 'magicUpload';
        state.magicUploadMode = 'effect';
      }
      state.uploadPage = 1;
      state.uploadQueue = queue;
      state.toyEffectMatchStatus = unmatched.length ? '\u672a\u5339\u914d\uff1a' + unmatched.slice(0, 4).join('\u3001') + (unmatched.length > 4 ? '\u2026' : '') : '';
      saveUploadQueue();
      renderShell();
      if (added) showToast('\u5df2\u8bc6\u522b\u5e76\u52a0\u5165 ' + added + ' \u5f20\u73a9\u5177\u6548\u679c\u56fe');
      if (unmatched.length) showToast('\u6709 ' + unmatched.length + ' \u5f20\u6548\u679c\u56fe\u672a\u80fd\u552f\u4e00\u5339\u914d\uff0c\u8bf7\u68c0\u67e5\u6587\u4ef6\u540d');
    } catch (error) {
      console.warn('PLM floating helper toy effect image match failed:', error);
      showToast('\u6548\u679c\u56fe\u5339\u914d\u5931\u8d25\uff1a' + (error && error.message ? error.message : '\u8bf7\u68c0\u67e5\u5f53\u524d\u9875\u9762'));
    }
  }

  function inferUploadNameFromFileName(filename, sku) {
    return compactText(String(filename || '').replace(/\.[^.]+$/, '').replace(sku, ''));
  }

  function buildUploadDisplayName(cached, filename, sku) {
    const fromCache = [cached && cached.brand, cached && cached.name].filter(Boolean).join(' ');
    return cleanName(fromCache) || cleanName(inferUploadNameFromFileName(filename, sku));
  }

  function getUploadDisplayName(item) {
    const cached = item && item.sku ? loadData(item.sku) : null;
    const copyrightEntry = getCopyrightUploadEntries(item)[0];
    const effectEntry = getToyEffectUploadEntries(item)[0];
    const filename = (item && (item.xlsxName || item.zipName)) || (copyrightEntry && copyrightEntry.name) || (effectEntry && effectEntry.name) || '';
    const name = buildUploadDisplayName(cached, filename, item && item.sku);
    if (name && item && item.name !== name) {
      item.name = name;
      window.setTimeout(() => {
        const queue = loadUploadQueue();
        const target = queue.find((entry) => entry.id === item.id);
        if (!target || target.name === name) return;
        target.name = name;
        state.uploadQueue = queue.map((entry) => entry.id === item.id ? target : entry);
        saveUploadQueue();
      }, 0);
    }
    return name || (item && item.name) || '';
  }

  function getMissingUploadText(item) {
    if (item && item.kind === 'copyright') return getCopyrightUploadEntries(item).length ? '\u6587\u4ef6\u5df2\u9f50' : '\u7f3a\u7248\u6743\u56fe';
    if (item && item.kind === 'toy-effect') return getToyEffectUploadEntries(item).length ? '\u6548\u679c\u56fe\u6587\u4ef6\u5df2\u9f50' : '\u7f3a\u6548\u679c\u56fe';
    const missing = [];
    if (!item.xlsxKey) missing.push('XLSX');
    if (!item.zipKey) missing.push('ZIP');
    return '\u7f3a ' + missing.join(' + ');
  }

  function getCopyrightUploadEntries(item) {
    return Array.isArray(item && item.copyrightFiles)
      ? item.copyrightFiles.filter((entry) => entry && entry.name)
      : [];
  }

  function getToyEffectUploadEntries(item) {
    return Array.isArray(item && item.effectFiles)
      ? item.effectFiles.filter((entry) => entry && entry.name)
      : [];
  }

  function isUploadItemReady(item) {
    if (!item) return false;
    if (item.kind === 'toy-label') return Boolean(item.xlsxKey && item.zipKey);
    if (item.kind === 'toy-effect') {
      const entries = getToyEffectUploadEntries(item);
      return Boolean(entries.length && entries.every((entry) => entry.key));
    }
    if (item.kind === 'copyright') {
      const entries = getCopyrightUploadEntries(item);
      return Boolean(entries.length && entries.every((entry) => entry.key));
    }
    return Boolean(item.xlsxKey && item.zipKey);
  }

  function removeUploadQueueItem(id) {
    const target = state.uploadQueue.find((item) => item.id === id);
    cleanupUploadFiles(target);
    state.uploadQueue = state.uploadQueue.filter((item) => item.id !== id);
    saveUploadQueue();
    renderShell();
  }

  function retryUploadQueueItem(id) {
    const latestQueue = loadUploadQueue();
    let found = false;
    state.uploadQueue = latestQueue.map((item) => {
      if (item.id !== id) return item;
      found = true;
      const ready = isUploadItemReady(item);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    showToast(L.uploadRetry + '\uff1a\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function toggleUploadSelection(id) {
    if (!id) return;
    const selected = new Set(state.uploadSelectedIds || []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    state.uploadSelectedIds = Array.from(selected);
    renderShell();
  }

  function retryUploadHistoryItem(id) {
    retryUploadHistoryItems([id]);
  }

  function retrySelectedUploads() {
    if (state.uploadView === 'history') retryUploadHistoryItems(state.uploadSelectedIds || []);
    else retryUploadQueueItems(state.uploadSelectedIds || []);
  }

  function deleteSelectedUploads() {
    if (state.uploadView === 'history') deleteUploadHistoryItems(state.uploadSelectedIds || []);
    else deleteUploadQueueItems(state.uploadSelectedIds || []);
  }

  function retryUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const now = new Date().toLocaleString();
    let changed = false;
    state.uploadQueue = loadUploadQueue().map((item) => {
      if (!idSet.has(item.id)) return item;
      changed = true;
      const ready = isUploadItemReady(item);
      const hadExistingContent = /\u5df2\u6709\u5185\u5bb9/.test(item.status || '');
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: hadExistingContent,
        updatedAt: now,
      };
    });
    if (!changed) return;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u91cd\u65b0\u52a0\u5165\u961f\u5217');
    startUploadQueue();
  }

  function deleteUploadQueueItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const removed = [];
    state.uploadQueue = loadUploadQueue().filter((item) => {
      if (!idSet.has(item.id)) return true;
      removed.push(item);
      return false;
    });
    removed.forEach(cleanupUploadFiles);
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueue();
    renderShell();
    showToast('\u5df2\u5220\u9664\u961f\u5217\u8bb0\u5f55');
  }

  function retryUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    const history = loadUploadHistory();
    const targets = history.filter((item) => idSet.has(item.id));
    if (!targets.length) return;
    const queue = loadUploadQueue();
    const now = new Date().toLocaleString();
    targets.forEach((item) => {
      const ready = isUploadItemReady(item);
      queue.unshift({
        ...item,
        id: item.sku + '-retry-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        skipReason: '',
        forceReplace: true,
        completedAt: '',
        updatedAt: now,
        createdAt: now,
      });
    });
    state.uploadQueue = queue;
    state.uploadHistory = history;
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadQueueAndHistory(state.uploadQueue, state.uploadHistory);
    state.uploadView = 'queue';
    renderShell();
    showToast('\u5df2\u6062\u590d\u5230\u961f\u5217' + (targets.some((item) => !isUploadItemReady(item)) ? '\uff0c\u8bf7\u8865\u5145\u6587\u4ef6' : ''));
  }

  function deleteUploadHistoryItems(ids) {
    const idSet = new Set((ids || []).filter(Boolean));
    if (!idSet.size) return;
    state.uploadHistory = loadUploadHistory().filter((item) => !idSet.has(item.id));
    state.uploadSelectedIds = (state.uploadSelectedIds || []).filter((id) => !idSet.has(id));
    saveUploadHistory();
    renderShell();
    showToast('\u5df2\u5220\u9664\u5386\u53f2\u8bb0\u5f55');
  }

  function startUploadQueue() {
    const mode = normalizeUploadMode(state.uploadMode);
    if (mode === 'toy-effect' && !hasApiUploadAccess()) {
      notifyApiUploadAccessDenied();
      return;
    }
    state.uploadWorkerMode = mode;
    state.uploadRunning = true;
    saveUploadWorkerRunning(mode, true);
    saveUploadQueue();
    state.uploadExpanded = true;
    renderShell();
    showToast(L.uploadQueueStarted);
    const workerUrl = location.origin + '/productManagementProduct?plmUploadWorker=1&plmUploadMode=' + encodeURIComponent(mode);
    if (!isUploadWorkerPage()) window.open(workerUrl, 'plm-upload-worker-' + mode);
    else window.setTimeout(() => processUploadQueue(mode), 800);
  }

  function startMagicEffectQueueInline() {
    const mode = 'toy-effect';
    if (!hasApiUploadAccess()) {
      notifyApiUploadAccessDenied();
      return;
    }
    state.uploadMode = mode;
    state.uploadWorkerMode = mode;
    state.uploadRunning = true;
    saveUploadWorkerRunning(mode, true);
    saveUploadQueue();
    state.view = 'magicUpload';
    state.magicUploadMode = 'effect';
    renderShell();
    showToast('效果图后台队列已开始');
    window.setTimeout(() => processUploadQueue(mode), 80);
  }

  function retryMagicEffectQueueItem(id) {
    const queue = loadUploadQueue();
    let found = false;
    state.uploadQueue = queue.map((item) => {
      if (item.id !== id || getUploadItemMode(item) !== 'toy-effect') return item;
      found = true;
      return {
        ...item,
        status: isUploadItemReady(item) ? '\u5f85\u4e0a\u4f20\u6548\u679c\u56fe' : '\u7f3a\u6587\u4ef6',
        step: isUploadItemReady(item) ? '\u7b49\u5f85\u91cd\u8bd5\uff0c\u5c06\u91cd\u65b0\u67e5\u8be2\u9879\u76ee ID' : getMissingUploadText(item),
        skipReason: '',
        updatedAt: new Date().toLocaleString(),
      };
    });
    if (!found) return;
    saveUploadQueue();
    startMagicEffectQueueInline();
  }

  function clearMagicEffectQueue() {
    const queue = loadUploadQueue();
    const removed = queue.filter((item) => getUploadItemMode(item) === 'toy-effect');
    removed.forEach(cleanupUploadFiles);
    state.uploadQueue = queue.filter((item) => getUploadItemMode(item) !== 'toy-effect');
    state.uploadMode = 'toy-effect';
    state.uploadRunning = false;
    saveUploadWorkerRunning('toy-effect', false);
    saveUploadQueue();
    renderShell();
    showToast('效果图队列已清空');
  }

  function pauseUploadQueue() {
    const mode = getUploadControlMode();
    state.uploadWorkerMode = mode;
    state.uploadRunning = false;
    saveUploadWorkerRunning(mode, false);
    resetRunningUploadsToPending(mode);
    saveUploadQueue();
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  async function finishUploadQueue(mode) {
    const uploadMode = normalizeUploadMode(mode || getUploadControlMode());
    await closeCancelConfigModalIfPresent();
    state.uploadRunning = false;
    state.uploadWorkerMode = uploadMode;
    saveUploadWorkerRunning(uploadMode, false);
    moveCompletedUploadsToHistory(uploadMode);
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    if (uploadMode === 'toy-label') {
      const toyLabelManifest = loadToyLabelExportManifest();
      if (toyLabelManifest.downloaded) await clearToyLabelExportManifest(toyLabelManifest);
      else await downloadToyLabelBatchArchive();
    }
    renderShell();
    showToast(L.uploadQueuePaused);
  }

  function clearCurrentUploadList() {
    state.uploadClearConfirmOpen = true;
    renderShell();
  }

  function confirmClearCurrentUploadList() {
    const mode = normalizeUploadMode(state.uploadMode);
    state.uploadClearConfirmOpen = false;
    if (state.uploadView === 'history') {
      state.uploadHistory = loadUploadHistory().filter((item) => getUploadItemMode(item) !== mode);
      state.uploadHistoryPage = 1;
      state.uploadSelectedIds = [];
      saveUploadHistory();
      renderShell();
      showToast('\u5386\u53f2\u8bb0\u5f55\u5df2\u6e05\u7a7a');
      return;
    }
    const queue = loadUploadQueue();
    const removed = queue.filter((item) => getUploadItemMode(item) === mode);
    removed.forEach(cleanupUploadFiles);
    state.uploadQueue = queue.filter((item) => getUploadItemMode(item) !== mode);
    state.uploadPage = 1;
    state.uploadSelectedIds = [];
    state.uploadRunning = false;
    saveUploadWorkerRunning(mode, false);
    saveUploadQueue();
    renderShell();
    showToast('\u961f\u5217\u5df2\u6e05\u7a7a');
  }

  function resetRunningUploadsToPending(mode) {
    const targetMode = normalizeUploadMode(mode || getUploadControlMode());
    const queue = loadUploadQueue();
    state.uploadQueue = queue.map((item) => {
      if (getUploadItemMode(item) !== targetMode) return item;
      if (!/\u8fdb\u884c\u4e2d/.test(item.status || '')) return item;
      const ready = isUploadItemReady(item);
      return {
        ...item,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(item),
        updatedAt: new Date().toLocaleString(),
      };
    });
  }

  function updateUploadItem(item, status, step, extra) {
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    if (extra && typeof extra === 'object') Object.assign(latestItem, extra);
    latestItem.status = status || latestItem.status;
    latestItem.step = step || '';
    latestItem.updatedAt = new Date().toLocaleString();
    Object.assign(item, latestItem);
    const cleanedQueue = /\u8fdb\u884c\u4e2d/.test(latestItem.status || '')
      ? archiveOtherRunningUploads(latestQueue, latestItem)
      : latestQueue;
    state.uploadQueue = cleanedQueue.some((entry) => entry.id === item.id)
      ? cleanedQueue.map((entry) => entry.id === item.id ? latestItem : entry)
      : [latestItem].concat(cleanedQueue);
    saveUploadQueue();
    renderShell();
  }

  function getCurrentRunningUpload(queue, mode) {
    const targetMode = mode ? normalizeUploadMode(mode) : '';
    return (queue || [])
      .filter((item) => !targetMode || getUploadItemMode(item) === targetMode)
      .filter((item) => /\u8fdb\u884c\u4e2d/.test(item.status || ''))
      .sort((a, b) => getUploadTimeMs(b) - getUploadTimeMs(a))[0] || null;
  }

  function getUploadTimeMs(item) {
    const value = item && (item.updatedAt || item.createdAt || item.completedAt);
    const ms = Date.parse(value || '');
    return Number.isFinite(ms) ? ms : 0;
  }

  function archiveOtherRunningUploads(queue, activeItem) {
    const activeMode = getUploadItemMode(activeItem);
    const stale = (queue || []).filter((entry) => entry.id !== activeItem.id && getUploadItemMode(entry) === activeMode && /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
    if (!stale.length) return queue;
    const now = new Date().toLocaleString();
    return (queue || []).map((entry) => {
      if (!stale.some((item) => item.id === entry.id)) return entry;
      if (entry.kind === 'toy-label') {
        return {
          ...entry,
          status: '\u5f85\u751f\u6210\u73a9\u5177\u6807\u7b7e',
          step: '\u7b49\u5f85\u5904\u7406',
          updatedAt: now,
        };
      }
      const ready = isUploadItemReady(entry);
      return {
        ...entry,
        status: ready ? '\u5f85\u4e0a\u4f20' : '\u7f3a\u6587\u4ef6',
        step: ready ? '\u6587\u4ef6\u5df2\u9f50' : getMissingUploadText(entry),
        updatedAt: now,
      };
    });
  }

  function normalizeRunningUploadsInQueue() {
    const queue = loadUploadQueue();
    let normalizedQueue = queue;
    UPLOAD_MODES.forEach((mode) => {
      const running = normalizedQueue.filter((entry) => getUploadItemMode(entry) === mode && /\u8fdb\u884c\u4e2d/.test(entry.status || ''));
      if (running.length <= 1) return;
      const active = getCurrentRunningUpload(running, mode);
      normalizedQueue = archiveOtherRunningUploads(normalizedQueue, active);
    });
    if (normalizedQueue === queue) return;
    state.uploadQueue = normalizedQueue;
    saveUploadQueue();
  }

  async function prepareToyLabelBatchQueue(queue) {
    const items = (queue || []).filter((entry) => entry.kind === 'toy-label' && entry.xlsxKey && entry.zipKey && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
    if (!items.length) return true;
    const skus = Array.from(new Set(items.map((item) => String(item.sku || '').toUpperCase()).filter(Boolean)));
    const signature = skus.join('|');
    await ensureToyLabelExportRun(signature);
    const prepared = state.toyLabelBatchRows || {};
    if (state.toyLabelBatchPreparedSignature === signature && skus.every((sku) => prepared[sku] && prepared[sku].productImageUrl)) return true;
    // Manually added products have no design-task row; their cached effect image is enough for the local label package.
    const cachedManualRows = new Map();
    const searchSkus = [];
    skus.forEach((sku) => {
      const cached = normalizeData(loadData(sku) || (state.index || []).find((entry) => entry && entry.sku === sku) || { sku });
      const cachedImageUrl = getManualToyLabelCachedEffectImage(cached);
      if (cachedImageUrl) cachedManualRows.set(sku, {
        sku,
        rowId: String(cached.projectRowId || cached.projectId || '').trim(),
        brand: cached.brand || '',
        name: cached.name || '',
        productImageUrl: cachedImageUrl,
        source: 'cached-effect-image',
      });
      else searchSkus.push(sku);
    });
    let rows = [];
    let searchUnavailable = false;
    if (searchSkus.length) {
      if (!(await ensureNewProductProjectPage()) || !(await ensureDesignTaskTab())) {
        searchUnavailable = true;
        addLog(cachedManualRows.size ? 'warn' : 'error', cachedManualRows.size ? '玩具标签：设计任务不可用，继续使用手动 SKU 缓存效果图' : '玩具标签：无法进入设计任务批量搜索', searchSkus.join(' '));
      } else {
        const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
        const button = findButtonByText('\u67e5\u8be2');
        if (!input || !button) {
          searchUnavailable = true;
          addLog(cachedManualRows.size ? 'warn' : 'error', cachedManualRows.size ? '玩具标签：未找到设计任务搜索框，继续使用手动 SKU 缓存效果图' : '玩具标签：未找到商品编码批量搜索框', '');
        } else {
          addLog('info', '玩具标签：批量搜索设计任务', searchSkus.length + '个编码');
          setNativeInputValue(input, searchSkus.join(' '));
          clickElement(button);
          await wait(450);
          await waitFor(() => collectToyLabelBatchRows(searchSkus).length > 0 || (!isProjectResultLoading() && hasProjectResultEmptyState()), 12000, 180);
          await expandProjectResultPageSize(searchSkus.length);
          await wait(350);
          rows = collectToyLabelBatchRows(searchSkus);
        }
      }
    }
    if (searchUnavailable && !cachedManualRows.size) return false;
    const rowMap = {};
    cachedManualRows.forEach((row, sku) => {
      rowMap[sku] = row;
    });
    rows.forEach((row) => {
      rowMap[row.sku] = row;
      const previous = normalizeData(loadData(row.sku) || { sku: row.sku });
      const imageUrl = stripOssResizeParams(row.productImageUrl || '');
      const next = normalizeData({
        ...previous,
        sku: row.sku,
        brand: row.brand || previous.brand || '',
        name: row.name || previous.name || '',
        projectRowId: row.rowId || previous.projectRowId || '',
        toyLabelProductImageUrl: imageUrl || row.productImageUrl || '',
        toyLabelProductImageFallbackUrl: row.productImageUrl || imageUrl || '',
        updatedAt: previous.updatedAt || new Date().toLocaleString(),
        updatedAtMs: previous.updatedAtMs || Date.now(),
      });
      saveDataDirect(row.sku, next);
      upsertIndex(next);
    });
    state.toyLabelBatchRows = rowMap;
    state.toyLabelBatchPreparedSignature = signature;
    state.uploadQueue = loadUploadQueue().map((entry) => {
      if (entry.kind !== 'toy-label' || !rowMap[entry.sku] || !rowMap[entry.sku].productImageUrl) return entry;
      const cached = loadData(entry.sku);
      const cachedRow = rowMap[entry.sku];
      const usesCachedEffectImage = cachedRow.source === 'cached-effect-image';
      return {
        ...entry,
        name: buildUploadDisplayName(cached, '', entry.sku),
        manualPackageOnly: usesCachedEffectImage || Boolean(entry.manualPackageOnly),
        step: usesCachedEffectImage ? '\u5df2\u8bfb\u53d6\u7f13\u5b58\u6548\u679c\u56fe\uff0c\u7b49\u5f85\u751f\u6210\u6807\u7b7e\u96c6\u5408\u5305' : '\u5df2\u83b7\u53d6\u5546\u54c1\u56fe\u7247\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM',
        updatedAt: new Date().toLocaleString(),
      };
    });
    saveUploadQueue();
    queueCloudBackup();
    const missing = skus.filter((sku) => !rowMap[sku]);
    const missingImage = rows.filter((row) => !row.productImageUrl).map((row) => row.sku);
    const unavailable = new Map();
    missing.forEach((sku) => unavailable.set(sku, searchUnavailable ? '\u8bbe\u8ba1\u4efb\u52a1\u4e0d\u53ef\u7528\uff0c\u65e0\u6cd5\u8bfb\u53d6\u5546\u54c1\u884c' : '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u672a\u627e\u5230\u5546\u54c1\u884c'));
    missingImage.forEach((sku) => unavailable.set(sku, '\u8bbe\u8ba1\u4efb\u52a1\u4e2d\u672a\u627e\u5230 SKU \u5546\u54c1\u56fe'));
    if (unavailable.size) {
      const fallbackReason = '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u672a\u627e\u5230\u5546\u54c1\u56fe\u7247\u6216\u884c\u6570\u636e';
      state.uploadQueue = loadUploadQueue().map((entry) => entry.kind === 'toy-label' && unavailable.has(entry.sku)
        ? { ...entry, status: L.uploadFailed, step: unavailable.get(entry.sku) || fallbackReason, skipReason: unavailable.get(entry.sku) || fallbackReason, updatedAt: new Date().toLocaleString() }
        : entry);
      saveUploadQueue();
    }
    await prepareAndDownloadToyLabelBatch(items.filter((item) => rowMap[item.sku] && rowMap[item.sku].productImageUrl), signature);
    const diagnostics = [];
    if (missing.length) diagnostics.push('\u672a\u627e\u5230 ' + missing.join(' '));
    if (missingImage.length) diagnostics.push('\u7f3a\u5c11 SKU \u56fe ' + missingImage.join(' '));
    const cachedEffectSkus = Array.from(cachedManualRows.keys());
    const notices = cachedEffectSkus.length ? ['\u624b\u52a8 SKU \u4f7f\u7528\u7f13\u5b58\u6548\u679c\u56fe ' + cachedEffectSkus.join(' ')] : [];
    const detail = diagnostics.concat(notices);
    addLog(diagnostics.length ? 'warn' : 'success', '玩具标签：批量数据已读取', rows.length + cachedEffectSkus.length + '/' + skus.length + (detail.length ? '\uff0c' + detail.join('\uff0c') : ''));
    renderShell();
    return rows.some((row) => Boolean(row.productImageUrl)) || cachedManualRows.size > 0;
  }

  async function prepareAndDownloadToyLabelBatch(items, signature) {
    let manifest = loadToyLabelExportManifest();
    for (const item of items || []) {
      const sku = String(item && item.sku || '').toUpperCase();
      if (!sku || manifest.files.filter((entry) => entry.sku === sku).length >= 3) continue;
      const data = normalizeData(loadData(sku) || (state.index || []).find((entry) => entry && entry.sku === sku) || {});
      if (!data.sku) continue;
      const manualPackageOnly = isManualSkuProductEffectRoute(data);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u751f\u6210\u6807\u7b7e\u6253\u5305\u6587\u4ef6');
      state.selectedSku = data.sku;
      state.sku = data.sku;
      state.data = data;
      state.view = 'detail';
      resetExcelState();
      const generated = await generateToyLabelFromCurrent({
        collectFiles: state.toyLabelBatchFiles,
        batchSignature: signature,
        skipExcelPrepare: true,
        skipBomUpload: true,
        batchRowOnly: true,
      });
      if (!generated) markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u6587\u4ef6\u751f\u6210\u5931\u8d25');
      else updateUploadItem(item, '\u5f85\u4e0a\u4f20', manualPackageOnly ? '\u5df2\u751f\u6210\u6807\u7b7e\u96c6\u5408\u5305\uff0c\u624b\u52a8 SKU \u8df3\u8fc7 BOM \u4e0a\u4f20' : '\u5df2\u6253\u5305\uff0c\u7b49\u5f85\u4e0a\u4f20 BOM');
      manifest = loadToyLabelExportManifest();
    }
    if (!manifest.files.length || manifest.downloaded) return;
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u56fe\u7247\u5df2\u83b7\u53d6\uff0c\u5148\u4e0b\u8f7d ZIP', manifest.files.length + '\u4e2a\u6587\u4ef6');
    await downloadToyLabelBatchArchive({ keepStagedFiles: true });
  }

  function collectToyLabelBatchRows(requestedSkus) {
    const requested = new Set((requestedSkus || []).map((sku) => String(sku || '').toUpperCase()));
    const header = Array.from(document.querySelectorAll('table.vxe-table--header'))
      .map((table) => Array.from(table.querySelectorAll('thead th')))
      .find((cells) => cells.some((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, '') === '\u5546\u54c1\u56fe\u7247')) || [];
    const headerNames = header.map((cell) => compactText(cell.innerText || cell.textContent).replace(/^\*/, ''));
    const skuIndex = headerNames.indexOf('\u5546\u54c1\u7f16\u7801');
    const brandIndex = headerNames.indexOf('\u54c1\u724c');
    const nameIndex = headerNames.indexOf('\u5546\u54c1\u540d\u79f0');
    const imageIndex = headerNames.indexOf('\u5546\u54c1\u56fe\u7247');
    if (skuIndex < 0 || imageIndex < 0) return [];
    const body = Array.from(document.querySelectorAll('table.vxe-table--body'))
      .find((table) => Array.from(table.querySelectorAll('tbody tr')).some((row) => row.children.length > imageIndex && /SKU\d+/i.test(row.innerText || row.textContent || '')));
    if (!body) return [];
    return Array.from(body.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.children);
      const skuText = cells[skuIndex] ? compactText(cells[skuIndex].innerText || cells[skuIndex].textContent) : '';
      const sku = ((skuText.match(/SKU\d+/i) || [])[0] || '').toUpperCase();
      const image = cells[imageIndex] && cells[imageIndex].querySelector('img');
      return {
        sku,
        rowId: row.getAttribute('rowid') || '',
        brand: brandIndex >= 0 && cells[brandIndex] ? compactText(cells[brandIndex].innerText || cells[brandIndex].textContent) : '',
        name: nameIndex >= 0 && cells[nameIndex] ? compactText(cells[nameIndex].innerText || cells[nameIndex].textContent) : '',
        productImageUrl: image ? (image.currentSrc || image.src || image.getAttribute('src') || '') : '',
      };
    }).filter((row) => row.sku && requested.has(row.sku) && row.rowId);
  }

  function isProjectResultLoading() {
    return Array.from(document.querySelectorAll('.vxe-loading--wrapper, .ant-spin-spinning, .vxe-table--loading')).some(isVisibleElement);
  }

  function hasProjectResultEmptyState() {
    return Array.from(document.querySelectorAll('.vxe-table--empty-content, .vxe-table--empty-block, .ant-empty'))
      .filter(isVisibleElement)
      .some((el) => /\u6682\u65e0\u6570\u636e|\u6682\u65e0|No Data/i.test(compactText(el.innerText || el.textContent)));
  }

  async function expandProjectResultPageSize(minimum) {
    const requestedSize = Number(minimum) || 20;
    const selector = Array.from(document.querySelectorAll('.ant-select-selector'))
      .filter(isVisibleElement)
      .find((el) => /\d+\s*\u6761\s*\/\s*\u9875/.test(compactText(el.innerText || el.textContent)));
    if (!selector) return;
    const current = Number((compactText(selector.innerText || selector.textContent).match(/\d+/) || [])[0]) || 20;
    if (requestedSize <= 20 && current <= PROJECT_RESULT_MAX_PAGE_SIZE) return;
    const targetSize = current > PROJECT_RESULT_MAX_PAGE_SIZE
      ? PROJECT_RESULT_MAX_PAGE_SIZE
      : Math.min(Math.max(requestedSize, 20), PROJECT_RESULT_MAX_PAGE_SIZE);
    if (current === targetSize) return;
    clickElement(selector);
    let options = [];
    try {
      options = await waitUntil(() => {
        const found = Array.from(document.querySelectorAll('.ant-select-item-option, [role="option"]'))
          .filter(isVisibleElement)
          .map((el) => ({ el, size: Number((compactText(el.innerText || el.textContent).match(/\d+/) || [])[0]) || 0 }))
          .filter((item) => item.size && item.size !== current);
        return found.length ? found : null;
      }, 2500, 100);
    } catch (error) {
      return;
    }
    if (!options.length) return;
    options.sort((a, b) => a.size - b.size);
    const target = current > targetSize
      ? options.filter((item) => item.size <= targetSize).pop() || options[0]
      : options.find((item) => item.size >= targetSize) || options[options.length - 1];
    clickElement(target.el);
    await waitFor(() => !isProjectResultLoading(), 8000, 180);
  }

  async function processUploadQueue(mode) {
    const workerMode = normalizeUploadMode(mode || (isUploadWorkerPage() ? getUploadWorkerModeFromUrl() : state.uploadMode));
    state.uploadWorkerMode = workerMode;
    state.uploadRunning = loadUploadWorkerRunning(workerMode);
    state.uploadQueue = loadUploadQueue();
    if (!state.uploadRunning || state.uploadProcessing) return;
    state.uploadProcessing = true;
    const attemptedTaskKeys = new Set();
    try {
      if (workerMode === 'toy-effect') {
        const accessReady = await waitFor(() => !state.magicUploadAccessLoading, 8000, 100);
        if (!accessReady || !hasApiUploadAccess()) {
          state.uploadRunning = false;
          saveUploadWorkerRunning(workerMode, false);
          addLog('warn', '后台效果图队列已拦截', '当前账号没有后台上传权限；普通图包表格仍可使用旧脚本流程');
          showToast('当前账号没有后台上传权限，已停止效果图后台队列');
          renderShell();
          return;
        }
      }
      if (workerMode === 'toy-label') {
        const prepared = await prepareToyLabelBatchQueue(state.uploadQueue.filter((entry) => getUploadItemMode(entry) === workerMode));
        if (!prepared) {
          state.uploadRunning = false;
          state.uploadWorkerMode = workerMode;
          saveUploadWorkerRunning(workerMode, false);
          state.uploadQueue = loadUploadQueue();
          addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u6279\u91cf\u6570\u636e\u672a\u8bfb\u53d6\uff0c\u5df2\u6682\u505c\u4e0a\u4f20', '\u672a\u6267\u884c BOM \u4e0a\u4f20');
          showToast('\u6279\u91cf\u8bbe\u8ba1\u4efb\u52a1\u6570\u636e\u672a\u8bfb\u53d6\uff0c\u5df2\u6682\u505c\uff0c\u672a\u6267\u884c\u4e0a\u4f20');
          renderShell();
          return;
        }
      }
      while (state.uploadRunning) {
        if (await recoverPurchaseEmptyRunningUpload(workerMode)) {
          state.uploadRunning = loadUploadWorkerRunning(workerMode);
          state.uploadQueue = loadUploadQueue();
          continue;
        }
        const pendingItems = state.uploadQueue.filter((entry) => getUploadItemMode(entry) === workerMode && isUploadItemReady(entry) && !attemptedTaskKeys.has(uploadHistoryKey(entry)) && !/成功|进行中|已跳过|已有内容|失败/.test(entry.status || ''));
        const item = pendingItems[0];
        if (!item) {
          await finishUploadQueue(workerMode);
          break;
        }
        attemptedTaskKeys.add(uploadHistoryKey(item));
        if (workerMode !== 'toy-effect') await ensureUploadPageReadyForNextItem();
        try {
          await runUploadQueueItem(item);
        } catch (error) {
          if (await recoverPurchaseEmptyRunningUpload(workerMode)) {
            state.uploadRunning = loadUploadWorkerRunning(workerMode);
            state.uploadQueue = loadUploadQueue();
            continue;
          }
          if (isReviewConfirmWaitError(error)) {
            pauseUploadAfterReviewConfirmTimeout(item, error);
            state.uploadRunning = loadUploadWorkerRunning(workerMode);
            state.uploadQueue = loadUploadQueue();
            continue;
          }
          const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
          console.warn('PLM floating helper upload queue item failed, continue next:', error);
          markUploadQueueBlocked(item, L.uploadFailed, message);
          let closeFailure = null;
          if (workerMode !== 'toy-effect') {
            try {
              await closeTopProductDrawer({ skipDraftSave: true });
            } catch (closeError) {
              closeFailure = closeError;
              console.warn('PLM floating helper close failed after item error:', closeError);
            }
          }
          if (closeFailure || getVisibleModal() || getOpenProductDrawer()) {
            const closeMessage = closeFailure && closeFailure.message
              ? closeFailure.message
              : '\u5f53\u524d\u5546\u54c1\u9875\u6216\u5f39\u7a97\u672a\u5b8c\u5168\u5173\u95ed';
            state.uploadRunning = false;
            saveUploadWorkerRunning(workerMode, false);
            markUploadQueueBlocked(item, L.uploadFailed, message + '\uff1b' + closeMessage + '\uff0c\u5df2\u6682\u505c');
            addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + closeMessage);
            showToast('\u5f53\u524d\u5546\u54c1\u9875\u6216\u5f39\u7a97\u672a\u5173\u95ed\uff0c\u5df2\u6682\u505c\u961f\u5217');
          }
        }
        state.uploadRunning = loadUploadWorkerRunning(workerMode);
        state.uploadQueue = loadUploadQueue();
      }
    } finally {
      await closeCancelConfigModalIfPresent().catch((error) => console.warn('PLM floating helper final modal cleanup failed:', error));
      state.uploadProcessing = false;
      if (loadUploadWorkerRunning(workerMode)) {
        window.setTimeout(() => processUploadQueue(workerMode), 800);
      }
    }
  }

  async function runToyLabelQueueItem(item) {
    const data = normalizeData(loadData(item && item.sku) || (state.index || []).find((entry) => entry && entry.sku === (item && item.sku)) || {});
    if (!data.sku) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u8bbe\u8ba1\u4efb\u52a1\u6279\u91cf\u641c\u7d22\u4e2d\u672a\u627e\u5230\u8be5 SKU');
      return;
    }
    const manualPackageOnly = isManualSkuProductEffectRoute(data);
    const hasProductImage = Boolean(data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl || getProductThumbUrl(data));
    if ((!manualPackageOnly && !data.projectRowId) || !hasProductImage) {
      markUploadQueueBlocked(item, L.uploadFailed, manualPackageOnly ? '\u624b\u52a8 SKU \u7f3a\u5c11\u7f13\u5b58\u6548\u679c\u56fe' : '\u8bbe\u8ba1\u4efb\u52a1\u641c\u7d22\u7ed3\u679c\u4e2d\u672a\u627e\u5230\u5546\u54c1\u56fe\u7247\u6216\u884c\u6807\u8bc6');
      return;
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', manualPackageOnly ? '\u4f7f\u7528\u7f13\u5b58\u6548\u679c\u56fe\u751f\u6210\u6807\u7b7e\u96c6\u5408\u5305' : '\u4f7f\u7528\u8bbe\u8ba1\u4efb\u52a1\u5546\u54c1\u56fe\u7247', manualPackageOnly ? { manualPackageOnly: true } : undefined);
    state.selectedSku = data.sku;
    state.sku = data.sku;
    state.data = data;
    state.view = 'detail';
    resetExcelState();
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', manualPackageOnly ? '\u5df2\u6253\u5305\uff0c\u624b\u52a8 SKU \u65e0\u9700\u4e0a\u4f20 BOM' : '\u4e0a\u4f20\u5df2\u6253\u5305\u7684\u6807\u7b7e\u5230 BOM');
    const stagedPreview = await getStagedToyLabelPreview(data.sku);
    let completed = false;
    if (manualPackageOnly) {
      completed = Boolean(stagedPreview);
      if (!completed) {
        completed = await generateToyLabelFromCurrent({ collectFiles: state.toyLabelBatchFiles, batchSignature: state.toyLabelBatchPreparedSignature, skipExcelPrepare: true, skipBomUpload: true, batchRowOnly: true });
        if (completed) await downloadToyLabelBatchArchive({ keepStagedFiles: true });
      }
    } else if (stagedPreview) {
      try {
        await uploadToyLabelPreviewToBom(data, stagedPreview.blob, stagedPreview.filename, { batchRowOnly: true });
        completed = true;
      } catch (error) {
        console.warn('PLM floating helper staged toy label upload failed:', error);
      }
    } else {
      completed = await generateToyLabelFromCurrent({ collectFiles: state.toyLabelBatchFiles, batchSignature: state.toyLabelBatchPreparedSignature, skipExcelPrepare: true, batchRowOnly: true });
    }
    if (!completed) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6216 BOM \u4e0a\u4f20\u5931\u8d25');
      return;
    }
    archiveUploadItem(item);
    addLog('success', manualPackageOnly ? '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\u96c6\u5408\u5305\u5b8c\u6210' : '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\u5b8c\u6210', data.sku);
  }

  async function getStagedToyLabelPreview(sku) {
    const manifest = loadToyLabelExportManifest();
    const entry = manifest.files.find((file) => file.sku === String(sku || '').toUpperCase() && /\.jpg$/i.test(file.filename) && !/\u5370\u5237/.test(file.filename));
    if (!entry) return null;
    const blob = await getUploadFile(entry.key).catch(() => null);
    return blob ? { filename: entry.filename, blob } : null;
  }

  function getToyEffectProjectId(data) {
    return getProjectIdForMaterialApi(data) || String(data && (data.projectRowId || data.projectId || data.id) || '');
  }

  function isManualSkuProductEffectRoute(data) {
    return Boolean(data && (data.skuListSource === 'manual-code' || data.manualSkuAddedAt || data.manualSkuAddedAtMs));
  }

  function getManualToyLabelCachedEffectImage(data) {
    if (!isManualSkuProductEffectRoute(data) || data.skuImageSource !== 'effectImage') return '';
    return [data.skuImageUrl, data.skuImageFallbackUrl]
      .map((value) => stripOssResizeParams(String(value || '').trim()))
      .find((value) => value && !/^data:image\//i.test(value)) || '';
  }

  async function resolveToyEffectProjectData(item) {
    const sku = String(item && item.sku || '').trim().toUpperCase();
    const cached = loadData(sku) || (state.index || []).find((entry) => entry.sku === sku) || {};
    let data = normalizeData({
      ...cached,
      sku: cached.sku || sku,
      name: cached.name || (item && item.name) || '',
      projectRowId: cached.projectRowId || (item && item.projectRowId) || '',
    });
    let projectId = getToyEffectProjectId(data);
    let project = null;
    if (!projectId || !/^\d+$/.test(projectId)) {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6b63\u5728\u6309 SKU \u67e5\u8be2\u9879\u76ee ID');
      project = await fetchApiProjectSnapshot(data, { force: true });
      projectId = String(project && project.projectId || '').trim();
    }
    if (!projectId || !/^\d+$/.test(projectId)) throw new Error('\u672a\u627e\u5230 ' + sku + ' \u5bf9\u5e94\u7684\u9879\u76ee ID\uff0c\u65e0\u6cd5\u4fdd\u5b58 BOM \u6548\u679c\u56fe');
    data = normalizeData({
      ...data,
      projectRowId: projectId,
      projectId,
      brand: data.brand || project && project.brand || '',
      name: data.name || project && project.name || '',
      referenceUrl: project && project.referenceUrl || data.referenceUrl || '',
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    });
    saveData(sku, data, { changeSource: '\u9b54\u6cd5\u4e0a\u4f20\u8865\u5168\u9879\u76ee ID' });
    if (item) updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5df2\u5339\u914d\u9879\u76ee ID\uff1a' + projectId, { projectRowId: projectId });
    return data;
  }

  async function saveToyEffectPicturesByApi(data, objectNames) {
    const projectId = getToyEffectProjectId(data);
    if (!projectId) throw new Error('缺少项目 ID，无法保存 BOM 效果图');
    const paths = (Array.isArray(objectNames) ? objectNames : [objectNames]).map(normalizeMagicUploadEffectPath).filter(Boolean);
    if (!paths.length) return;
    const [materialsPayload, existingPayload] = await Promise.all([
      fetchPlmJson('/api/ChemicalNewDesignTask/GetProjectPMJoinList?id=' + encodeURIComponent(projectId)),
      fetchPlmJson('/api/ChemicalNew/GetProjectEffectPicture?id=' + encodeURIComponent(projectId)),
    ]);
    const materials = Array.isArray(materialsPayload && materialsPayload.data) ? materialsPayload.data : [];
    if (!materials.length) throw new Error('未读取到 BOM 物料列表，无法保存效果图');
    const previousPaths = getMagicToyLabelEffectPicturePaths(existingPayload);
    const effectPictureFiles = [];
    const seen = new Set();
    const addPath = (value) => {
      const normalized = normalizeMagicUploadEffectPath(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      effectPictureFiles.push(normalized);
    };
    paths.forEach(addPath);
    await fetchPlmApiJson('/api/ChemicalNewBom/MaterialBatchSaveAndSyncToProduct', {
      project_id: Number(projectId) || projectId,
      materials: materials.map(buildMagicUploadBomMaterialPayload),
      effect_picture_files: effectPictureFiles,
    });
    return { replacedCount: previousPaths.length, savedCount: effectPictureFiles.length };
  }

  function buildToyEffectProductDraft(infoPayload, pricePayload, invoicePayload, procurePayload, contentPayload, productContext, objectNames, manualPacking) {
    const info = getMagicUploadPayloadData(infoPayload);
    const price = getMagicUploadPayloadData(pricePayload);
    const invoice = getMagicUploadPayloadData(invoicePayload);
    const values = flattenMagicUploadProductAttributes(contentPayload);
    if (!values.length) throw new Error('未读取到商品模板字段，无法保存商品效果图');
    const target = values.find((item) => Number(item && item.attr_id) === 148 && Number(item && item.language_id) === 1)
      || values.find((item) => compactText(item && item.attr_name) === '图片' && Number(item && item.language_id) === 1);
    if (!target) throw new Error('商品模板中未找到图片字段 attr_id=148');
    const paths = (Array.isArray(objectNames) ? objectNames : [objectNames])
      .map(normalizeMagicUploadEffectPath)
      .filter(Boolean)
      .map((path) => '/' + path);
    if (!paths.length) throw new Error('商品效果图 OSS 路径为空');
    const replacedCount = magicUploadDraftValueList(target.value).filter(Boolean).length;
    target.value = paths;
    const packingSummary = manualPacking ? applyManualToyEffectPacking(values, manualPacking) : { changed: [], source: null };
    const field = (key, fallback) => info[key] === undefined ? fallback : cloneMagicUploadDraftValue(info[key]);
    const procureFallback = Array.isArray(info.product_procure_infos) ? info.product_procure_infos : [];
    return {
      _toyEffectReplacedCount: replacedCount,
      _toyEffectPackingSummary: packingSummary,
      procurement_price: price.procurement_price === undefined ? field('procurement_price', null) : price.procurement_price,
      invoice_item_name: invoice.invoice_item_name === undefined ? field('invoice_item_name', null) : invoice.invoice_item_name,
      invoice_category: invoice.invoice_category === undefined ? field('invoice_category', null) : invoice.invoice_category,
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
    };
  }

  async function saveToyEffectPicturesToProductByApi(item, data, objectNames, productContext, manualPacking) {
    const context = productContext || await resolveMagicUploadProductContext(item);
    const infoPath = '/api/Product/GetDetailInfoByEdit?product_id=' + encodeURIComponent(context.productId) + '&product_version_id=' + encodeURIComponent(context.productVersionId);
    const infoPayload = await fetchPlmJson(infoPath);
    const info = getMagicUploadPayloadData(infoPayload);
    const categoryId = info.category_id || context.categoryId;
    if (!categoryId) throw new Error('目标商品缺少 category_id，无法保存效果图');
    const withVersion = (path) => path + '&product_version_id=' + encodeURIComponent(context.productVersionId);
    const [contentPayload, pricePayload, invoicePayload, procurePayload] = await Promise.all([
      fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(context.productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(context.productVersionId)),
      fetchPlmJson(withVersion('/api/Product/GetProductPriceInfo?type=1')),
      fetchPlmJson(withVersion('/api/Product/GetProductInvoiceInfo?type=1')),
      fetchPlmJson('/api/ProductProcureInfo/GetProductProcureInfo?type=1&product_version_id=' + encodeURIComponent(context.productVersionId) + '&code=' + encodeURIComponent(context.sku)),
    ]);
    const draft = buildToyEffectProductDraft(infoPayload, pricePayload, invoicePayload, procurePayload, contentPayload, context, objectNames, manualPacking);
    const replacedCount = Number(draft._toyEffectReplacedCount) || 0;
    const packingSummary = draft._toyEffectPackingSummary || { changed: [], source: null };
    delete draft._toyEffectReplacedCount;
    delete draft._toyEffectPackingSummary;
    await fetchPlmApiJson('/api/Product/SaveProductDraftByEdit', draft);
    await fetchPlmApiJson('/api/Product/Arraign', { product_id: Number(context.productId) || context.productId });
    const firstPath = (Array.isArray(objectNames) ? objectNames : [objectNames]).map(normalizeMagicUploadEffectPath).find(Boolean) || '';
    const imageUrl = firstPath ? buildApiArchiveFileUrl(firstPath) : '';
    const next = normalizeData({
      ...(data || {}),
      productId: String(context.productId || data && data.productId || ''),
      productVersionId: String(context.productVersionId || data && data.productVersionId || ''),
      skuImageUrl: imageUrl || data && data.skuImageUrl || '',
      skuImageFallbackUrl: imageUrl || data && data.skuImageFallbackUrl || '',
      skuImageSource: imageUrl ? 'effectImage' : data && data.skuImageSource || '',
      updatedAt: new Date().toLocaleString(),
      updatedAtMs: Date.now(),
    });
    saveData(context.sku, next, { changeSource: '魔法上传商品效果图' });
    upsertDailyLedgerFromData(next, { status: '待定稿', stage: '待定稿' });
    return { data: next, replacedCount, packingSummary, savedCount: (Array.isArray(objectNames) ? objectNames : [objectNames]).filter(Boolean).length };
  }

  async function uploadToyEffectFileByApi(item, data, entry, file, index, total, options) {
    const opts = options || {};
    const uploadFileType = Number(opts.uploadFileType) || 40;
    const routeLabel = uploadFileType === 30 ? '商品效果图' : 'BOM 效果图';
    const extension = getMagicUploadFileExtension(file.name || entry.name);
    if (!/\.(?:jpe?g|png|bmp)$/i.test(extension)) throw new Error('效果图仅支持 JPG / PNG / BMP：' + (entry.name || file.name));
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u83b7\u53d6' + routeLabel + ' OSS \u6388\u6743 ' + index + '/' + total);
    const secretPayload = await fetchPlmApiJson('/api/Common/GetOssClientSecretKey', { upload_file_type: uploadFileType });
    const secret = secretPayload && secretPayload.data;
    if (!secret || !secret.bucket || !secret.file_directory) throw new Error('未获取到效果图 OSS 临时授权');
    const uploadMaxBytes = Number(secret.max_file_size) || (20 * 1024 * 1024);
    if (file.size > uploadMaxBytes) throw new Error('效果图超过 PLM 限制：' + Math.round(uploadMaxBytes / 1024 / 1024) + 'MB');
    const Oss = getLazyExternalRuntime('oss') || await ensureLazyExternalScript('oss').catch(() => null);
    if (typeof Oss !== 'function') throw new Error('OSS 上传组件未加载，请刷新脚本');
    const objectName = String(secret.file_directory).replace(/^\/+/, '') + '/' + createMagicObjectName(extension);
    const client = new Oss({ region: 'oss-cn-shenzhen', bucket: secret.bucket, accessKeyId: secret.access_key_id, accessKeySecret: secret.access_key_secret, stsToken: secret.security_token, endpoint: 'https://oss-cn-shenzhen.aliyuncs.com', secure: true, retryMax: OSS_UPLOAD_SDK_RETRY_MAX, timeout: OSS_UPLOAD_TIMEOUT_MS });
    await multipartUploadWithRetry(client, objectName, file, {
      partSize: 2 * 1024 * 1024,
      parallel: 2,
      progress: (percent) => updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u6548\u679c\u56fe ' + index + '/' + total + ' · ' + Math.round(Math.min(1, Math.max(0, Number(percent) || 0)) * 100) + '%'),
    }, (error, retryCount, delay, checkpoint) => {
      const completedParts = checkpoint && Array.isArray(checkpoint.doneParts) ? checkpoint.doneParts.length : 0;
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u7f51\u7edc\u6ce2\u52a8\uff0c\u81ea\u52a8\u91cd\u8bd5 ' + retryCount + '/' + OSS_UPLOAD_RETRY_MAX + ' · \u5df2\u5b8c\u6210\u5206\u7247 ' + completedParts + ' · ' + Math.round(delay / 1000) + '\u79d2\u540e\u7ee7\u7eed');
    });
    await fetchPlmApiJson('/api/Common/SaveUploadFileInfo', { upload_file_type: uploadFileType, oss_path: objectName, original_file_name: file.name || entry.name });
    return objectName;
  }

  async function runToyEffectQueueItem(item) {
    if (!hasApiUploadAccess()) throw new Error('当前账号没有后台上传权限，效果图后台队列已停止');
    const entries = getToyEffectUploadEntries(item);
    if (!item || !item.sku || !entries.length) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u73a9\u5177\u6548\u679c\u56fe\u6587\u4ef6');
      return;
    }
    const cached = normalizeData(loadData(item.sku) || (state.index || []).find((entry) => entry.sku === item.sku) || { sku: item.sku });
    const manualProductRoute = isManualSkuProductEffectRoute(cached);
    const productRoute = manualProductRoute || !/^\d+$/.test(getToyEffectProjectId(cached));
    const manualPacking = manualProductRoute ? normalizeManualToyEffectPacking(state.manualToyEffectPacking) : null;
    if (manualProductRoute && !hasManualToyEffectPacking(manualPacking)) {
      const message = '请先点击“手动设置装箱数/总重”填写装箱数和总重，再处理手动产品效果图';
      markUploadQueueBlocked(item, L.uploadFailed, message);
      showToast(item.sku + ' ' + message);
      return;
    }
    let productContext = null;
    let data = cached;
    if (productRoute) {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u624b\u52a8 SKU \u6b63\u5728\u8bfb\u53d6\u5546\u54c1\u7248\u672c');
      productContext = await resolveMagicUploadProductContext(item);
      data = normalizeData({ ...data, productId: productContext.productId, productVersionId: productContext.productVersionId });
    } else {
      data = await resolveToyEffectProjectData(item);
    }
    const files = [];
    for (const entry of entries) {
      const file = await getUploadFile(entry.key);
      if (!file) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u73a9\u5177\u6548\u679c\u56fe\uff1a' + entry.name);
        return;
      }
      files.push({ entry, file });
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', productRoute ? '\u6309 HAR \u65b9\u5f0f\u4e0a\u4f20\u5546\u54c1\u6548\u679c\u56fe' : '\u901a\u8fc7\u540e\u53f0\u670d\u52a1\u4e0a\u4f20 BOM \u6548\u679c\u56fe', { effectUploadRoute: productRoute ? 'product-draft' : 'project-bom' });
    state.selectedSku = data.sku;
    state.sku = data.sku;
    state.data = data;
    const uploadedPaths = [];
    for (let index = 0; index < files.length; index += 1) {
      const current = files[index];
      uploadedPaths.push(await uploadToyEffectFileByApi(item, data, current.entry, current.file, index + 1, files.length, { uploadFileType: productRoute ? 30 : 40 }));
    }
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', productRoute ? '\u4fdd\u5b58\u5546\u54c1\u8349\u7a3f\u5e76\u63d0\u5ba1' : '\u4fdd\u5b58 BOM \u6548\u679c\u56fe');
    const saveResult = productRoute
      ? await saveToyEffectPicturesToProductByApi(item, data, uploadedPaths, productContext, manualProductRoute ? manualPacking : null)
      : await saveToyEffectPicturesByApi(data, uploadedPaths);
    const replacedCount = Number(saveResult && saveResult.replacedCount) || 0;
    updateUploadItem(item, '\u8fdb\u884c\u4e2d', replacedCount ? '\u5df2\u66ff\u6362 ' + replacedCount + ' \u5f20\u65e7\u6548\u679c\u56fe' : '\u6548\u679c\u56fe\u5df2\u4fdd\u5b58', { effectReplacedCount: replacedCount });
    archiveUploadItem(item);
    addLog('success', '\u73a9\u5177\u6548\u679c\u56fe\u4e0a\u4f20\u6210\u529f', data.sku + ' | ' + (productRoute ? '\u5546\u54c1\u8349\u7a3f' : 'BOM') + ' | ' + uploadedPaths.length + ' 张');
    showToast(data.sku + (replacedCount ? ' \u5df2\u66ff\u6362\u65e7\u6548\u679c\u56fe\u5e76\u63d0\u5ba1\u6210\u529f' : ' \u6548\u679c\u56fe\u4e0a\u4f20\u5e76\u63d0\u5ba1\u6210\u529f'));
  }

  async function runCopyrightUploadQueueItem(item) {
    addLog('info', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const entries = getCopyrightUploadEntries(item);
    const files = [];
    for (const entry of entries) {
      const file = await getUploadFile(entry.key);
      if (!file) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u7248\u6743\u56fe\u6587\u4ef6\uff1a' + entry.name);
        return;
      }
      files.push({ entry, file });
    }
    if (!files.length) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u7248\u6743\u56fe\u6587\u4ef6');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1', { resumeUploadAfterRefresh: false });
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      throwIfUploadRetryNoticeVisible();
      for (let index = 0; index < files.length; index += 1) {
        const current = files[index];
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u7248\u6743\u56fe ' + (index + 1) + '/' + files.length);
        await uploadFileToProductField('\u7248\u6743\u56fe', current.file, current.entry.name || current.file.name);
        throwIfUploadRetryNoticeVisible();
      }
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f');
      const draftSaved = await saveProductDraftBeforeClose();
      if (!draftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' \u7248\u6743\u56fe\u4e0a\u4f20\u6210\u529f');
    } catch (error) {
      addLog('error', '\u7248\u6743\u56fe\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + formatErrorMessage(error));
      throw error;
    }
  }

  async function runUploadQueueItem(item) {
    if (item && item.kind === 'toy-label') {
      await runToyLabelQueueItem(item);
      return;
    }
    if (item && item.kind === 'toy-effect') {
      await runToyEffectQueueItem(item);
      return;
    }
    if (item && item.kind === 'copyright') {
      await runCopyrightUploadQueueItem(item);
      return;
    }
    addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u5f00\u59cb', item && item.sku ? item.sku : '');
    const xlsx = await getUploadFile(item.xlsxKey);
    const zip = await getUploadFile(item.zipKey);
    if (!xlsx || !zip) {
      markUploadQueueBlocked(item, L.uploadFailed, '\u7f3a\u5c11\u6587\u4ef6');
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u7f3a\u5c11\u6587\u4ef6', item && item.sku ? item.sku : '');
      return;
    }
    try {
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6253\u5f00\u5546\u54c1', { resumeUploadAfterRefresh: false });
      await ensureProductManagementPage();
      await searchProductManagementSku(item.sku);
      await openProductEditDrawer(item.sku);
      await enterProductEditSecondStep(item.sku);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u68c0\u67e5\u65e7\u5185\u5bb9');
      const existingSummary = getProductReplaceUploadSummary(item.sku);
      if (existingSummary.total && !item.forceReplace) {
        markUploadQueueBlocked(item, L.uploadExistingContent, '\u65e7\u5185\u5bb9\uff1a' + existingSummary.parts.join(' / '), { existingContent: existingSummary.parts.join(' / ') });
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u5df2\u6709\u5185\u5bb9', item.sku + ' ' + existingSummary.parts.join(' / '));
        showToast(item.sku + ' ' + L.uploadExistingContent + '\uff0c\u5df2\u8df3\u8fc7\uff1b\u52fe\u9009\u91cd\u8bd5\u624d\u4f1a\u6e05\u7406\u540e\u91cd\u4f20');
        try {
          await closeTopProductDrawer({ skipDraftSave: true });
        } catch (closeError) {
          state.uploadRunning = false;
          saveUploadWorkerRunning(getUploadControlMode(), false);
          addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + formatErrorMessage(closeError));
          showToast(item.sku + ' \u5df2\u6709\u5185\u5bb9\uff0c\u4f46\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25\uff0c\u961f\u5217\u5df2\u6682\u505c');
        }
        return;
      }
      if (item.forceReplace) {
        updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6e05\u7406\u65e7\u6587\u4ef6');
        await clearProductReplaceUploadFiles(item.sku);
      }
      if (item.forceReplace) updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u51c6\u5907\u4e0a\u4f20', { forceReplace: false });
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u63a8\u54c1\u8d44\u6599');
      await uploadFileToProductField('\u63a8\u54c1\u8d44\u6599', xlsx, item.xlsxName || xlsx.name);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4e0a\u4f20\u56fe\u5305\u7d20\u6750');
      await uploadFileToProductField('\u56fe\u5305\u7d20\u6750', zip, item.zipName || zip.name);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u6279\u91cf\u4e0a\u4f20');
      await openBatchUploadDialog();
      await uploadBatchZip(zip, item.zipName || zip.name);
      await matchBatchUploadForm();
      await confirmBatchUpload();
      await verifyBatchImagesUploaded(item.sku);
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u8bfb\u53d6\u5e76\u586b\u5199\u88c5\u7bb1\u6570\u548c\u7bb1\u91cd');
      const packingSummary = await fillBatchUploadPackingFields(item, xlsx);
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u4fdd\u5b58\u8349\u7a3f', { excelPacking: packingSummary.source });
      const preReviewDraftSaved = await saveProductDraftBeforeClose();
      if (!preReviewDraftSaved) throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f');
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u63d0\u5ba1');
      await submitProductReview();
      throwIfUploadRetryNoticeVisible();
      updateUploadItem(item, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
      await closeTopProductDrawer({ skipDraftSave: true, allowReviewResultModal: true });
      archiveUploadItem(item);
      addLog('success', '\u63d0\u5ba1\u4e0a\u4f20\u6210\u529f', item.sku);
      showToast(item.sku + ' ' + L.uploadSuccess);
    } catch (error) {
      console.warn('PLM floating helper upload queue failed:', error);
      if (isUploadRetryRefreshError(error) || findUploadRetryNotice()) {
        await refreshPageAndRetryUploadItem(item);
        return;
      }
      if (isReviewConfirmWaitError(error)) {
        pauseUploadAfterReviewConfirmTimeout(item, error);
        return;
      }
      if (error && /产品信息开品中|不能编辑/.test(error.message || '')) {
        markUploadQueueBlocked(item, '\u5df2\u8df3\u8fc7', '\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
        addLog('info', '\u63d0\u5ba1\u4e0a\u4f20\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d', item.sku);
        showToast(item.sku + ' \u5df2\u8df3\u8fc7\uff1a\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u4ea7\u54c1\u5df2\u505c\u7528|\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u4ea7\u54c1\u5df2\u505c\u7528');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u4ea7\u54c1\u5df2\u505c\u7528', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u4ea7\u54c1\u5df2\u505c\u7528');
        await closeTopProductDrawer();
        return;
      }
      if (error && /\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(error.message || '')) {
        markUploadQueueBlocked(item, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', item.sku);
        showToast(item.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
        await closeTopProductDrawer({ skipDraftSave: true });
        return;
      }
      const message = error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
      markUploadQueueBlocked(item, L.uploadFailed, message);
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25', item.sku + ' ' + message);
      showToast(item.sku + ' ' + L.uploadFailed + '\uff1a' + message);
      try {
        await closeTopProductDrawer();
      } catch (closeError) {
        console.warn('PLM floating helper close after upload failure failed:', closeError);
        state.uploadRunning = false;
        saveUploadWorkerRunning(getUploadControlMode(), false);
        markUploadQueueBlocked(item, L.uploadFailed, message + '\uff1b\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c');
        addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u5173\u95ed\u5546\u54c1\u9875\u5931\u8d25', item.sku + ' ' + (closeError && closeError.message ? closeError.message : '\u672a\u77e5\u9519\u8bef'));
        showToast('\u5173\u95ed\u5f53\u524d\u5546\u54c1\u9875\u5931\u8d25\uff0c\u5df2\u6682\u505c\uff0c\u8bf7\u624b\u52a8\u5904\u7406\u5f39\u7a97');
        throw closeError;
      }
    }
  }

  async function ensureUploadPageReadyForNextItem() {
    try {
      assertNoReviewConfirmModal();
      if (getVisibleModal() || getOpenProductDrawer()) await closeTopProductDrawer({ skipDraftSave: true });
      const bomDrawer = getProjectBomDrawerForSku('');
      if (bomDrawer) await closeProjectBomDrawer(bomDrawer);
      await waitForUploadPageIdle();
    } catch (error) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(getUploadControlMode(), false);
      throw error;
    }
  }

  async function waitForUploadPageIdle() {
    const startedAt = Date.now();
    let idleSince = 0;
    while (Date.now() - startedAt < UPLOAD_PAGE_IDLE_TIMEOUT_MS) {
      const modal = getVisibleModal();
      if (modal) {
        idleSince = 0;
        if (isReviewConfirmModal(modal)) {
          throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u6682\u505c\u4e0a\u4f20\u961f\u5217');
        }
        if (isCancelConfigModal(modal)) {
          confirmCancelConfigModal(modal);
          await wait(120);
          continue;
        }
        await wait(120);
        continue;
      }
      if (getOpenProductDrawer()) {
        idleSince = 0;
        await wait(120);
        continue;
      }
      if (!idleSince) idleSince = Date.now();
      if (Date.now() - idleSince >= UPLOAD_PAGE_IDLE_STABLE_MS) return true;
      await wait(120);
    }
    throw new Error('\u7b49\u5f85\u5546\u54c1\u9875\u548c\u5f39\u7a97\u5b8c\u5168\u5173\u95ed\u8d85\u65f6\uff0c\u5df2\u6682\u505c\u4e0a\u4f20\u961f\u5217');
  }

  async function recoverPurchaseEmptyRunningUpload(mode) {
    if (!findPurchaseInfoEmptyError()) return false;
    const queue = loadUploadQueue();
    const running = getCurrentRunningUpload(queue, mode || getUploadControlMode());
    if (!running) return false;
    markUploadQueueBlocked(running, L.uploadFailed, '\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a', running.sku || '');
    await closeTopProductDrawer({ skipDraftSave: true });
    state.uploadQueue = loadUploadQueue();
    state.uploadHistory = loadUploadHistory();
    showToast(running.sku + ' ' + L.uploadFailed + '\uff1a\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    return true;
  }

  async function ensureProductManagementPage() {
    if (!/\/productManagementProduct/.test(location.pathname)) {
      location.href = location.origin + '/productManagementProduct?plmUploadWorker=1&plmUploadMode=' + encodeURIComponent(getUploadControlMode());
      await waitUntil(() => /\/productManagementProduct/.test(location.pathname), 15000, 300);
    }
    await waitUntil(() => document.body && document.body.innerText.includes('\u5546\u54c1\u7ba1\u7406'), 20000, 300);
  }

  function isToyCopywritingProductManagementPageReady() {
    return /\/productManagementProduct/.test(location.pathname)
      && Boolean(findProductSearchInput() && findVisibleButton('\u67e5\u8be2'));
  }

  function findToyCopywritingProductManagementMenuLeaf() {
    const expected = compactText('\u5546\u54c1\u7ba1\u7406');
    const candidates = Array.from(document.querySelectorAll('[data-menu-id], .ant-menu-item, [role="menuitem"]')).filter(isVisibleElement);
    return candidates.find((el) => (el.getAttribute('data-menu-id') || '') === '/productManagementProduct')
      || candidates.find((el) => !el.matches('.ant-menu-submenu-title') && compactText(el.innerText || el.textContent) === expected)
      || null;
  }

  async function ensureProductManagementPageInPlace() {
    if (isToyCopywritingProductManagementPageReady()) return true;
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6587\u6848\uff1a\u7ad9\u5185\u5207\u6362\u5230\u5546\u54c1\u7ba1\u7406');
    const tabButton = findTopTabByText('\u5546\u54c1\u7ba1\u7406');
    if (tabButton) {
      clickElement(tabButton);
      const readyFromTab = await waitFor(() => isToyCopywritingProductManagementPageReady(), 8000, 150);
      if (readyFromTab) return true;
    }
    let menuItem = findToyCopywritingProductManagementMenuLeaf();
    if (!menuItem) {
      const menuRoot = Array.from(document.querySelectorAll('.ant-menu-submenu-title'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === compactText('\u5546\u54c1\u7ba1\u7406')) || null;
      if (menuRoot) {
        clickElement(menuRoot);
        menuItem = await waitFor(() => findToyCopywritingProductManagementMenuLeaf(), 2000, 100);
      }
    }
    if (menuItem) {
      clickElement(menuItem);
      const readyFromMenu = await waitFor(() => isToyCopywritingProductManagementPageReady(), 10000, 150);
      if (readyFromMenu) return true;
    }
    addLog('error', '\u6279\u91cf\u73a9\u5177\u6587\u6848\uff1a\u672a\u80fd\u65e0\u5237\u65b0\u5207\u6362\u5230\u5546\u54c1\u7ba1\u7406');
    throw new Error('\u672a\u80fd\u65e0\u5237\u65b0\u5207\u6362\u5230\u5546\u54c1\u7ba1\u7406');
  }

  async function searchProductManagementSku(sku) {
    const input = findProductSearchInput();
    if (!input) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u641c\u7d22\u6846');
    setNativeInputValue(input, sku);
    const button = findVisibleButton('\u67e5\u8be2');
    if (!button) throw new Error('\u672a\u627e\u5230\u67e5\u8be2\u6309\u94ae');
    button.click();
    await waitUntil(() => findProductRowIdBySku(sku), 20000, 500);
  }

  function findProductSearchInput() {
    const roots = Array.from(document.querySelectorAll('.searchForm, .queryForm, .ant-form, .vxe-toolbar, .el-form, form, body')).filter(isVisibleElement);
    const inputs = Array.from(new Set(roots.flatMap((root) => Array.from(root.querySelectorAll('input')).filter(isVisibleElement))));
    const byPlaceholder = (patterns) => inputs.find((input) => {
      const text = compactText(input.getAttribute('placeholder') || input.placeholder || '');
      return patterns.some((pattern) => pattern.test(text));
    }) || null;
    const exactProductCode = byPlaceholder([/^\s*商品编码(?:\/|$|[\s，,、])/i, /^\s*商品编码/i]);
    if (exactProductCode) return exactProductCode;
    const labelMatched = inputs.find((input) => {
      const item = input.closest('.ant-form-item, .el-form-item, .vxe-form--item, .form-item, div');
      const text = compactText((item && (item.innerText || item.textContent)) || '');
      return /商品编码/.test(text) && !/商品名称|产品名称/.test(text.replace(/商品编码/g, ''));
    });
    if (labelMatched) return labelMatched;
    return byPlaceholder([/SKU/i]) || null;
  }

  function findProductRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid], .ant-table-row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  async function openProductEditDrawer(sku) {
    if (getProductEditDrawerForSku(sku)) return;
    const rowId = findProductRowIdBySku(sku);
    if (!rowId) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u884c');
    const row = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((el) => Array.from(el.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u7f16\u8f91'));
    const button = row && Array.from(row.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u7f16\u8f91');
    if (!button) throw new Error('\u672a\u627e\u5230\u7f16\u8f91\u6309\u94ae');
    if (button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|\bis-disabled\b|ant-btn-disabled/.test(button.className || '')) {
      throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
    }
    button.click();
    const startedAt = Date.now();
    while (Date.now() - startedAt < 20000) {
      const drawer = getProductEditDrawerForSku(sku);
      if (drawer) return;
      if (getVisibleText(document.body).includes('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91')) {
        throw new Error('\u4ea7\u54c1\u4fe1\u606f\u5f00\u54c1\u4e2d\uff0c\u4e0d\u80fd\u7f16\u8f91');
      }
      await wait(300);
    }
    throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
  }

  function getProductEditDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        const headerSku = getProjectDrawerHeaderSku(drawer);
        return /(?:\u7f16\u8f91\u5546\u54c1|\u8bbe\u8ba1\u8d44\u6599)/.test(text)
          && (!sku || headerSku === String(sku).toUpperCase() || text.includes(sku));
      }) || null;
  }

  async function enterProductEditSecondStep(sku) {
    const drawer = getProductEditDrawerForSku(sku);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    if (getVisibleText(drawer).includes('\u63a8\u54c1\u8d44\u6599')) return;
    const ready = await waitFor(() => {
      const readyDrawer = getProductEditDrawerForSku(sku);
      if (!readyDrawer || !isProductCategoryReady(readyDrawer)) return null;
      const button = Array.from(readyDrawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === '\u4e0b\u4e00\u6b65' && isActionButtonReady(el));
      return button ? { drawer: readyDrawer, button } : null;
    }, 20000, 100);
    if (!ready) throw new Error('\u7c7b\u76ee\u672a\u52a0\u8f7d\u5b8c\u6210\u6216\u672a\u627e\u5230\u53ef\u70b9\u51fb\u7684\u300c\u4e0b\u4e00\u6b65\u300d');
    clickElement(ready.button);
    await waitUntil(() => {
      const nextDrawer = getProductEditDrawerForSku(sku);
      return nextDrawer && getVisibleText(nextDrawer).includes('\u63a8\u54c1\u8d44\u6599');
    }, 30000, 500);
  }

  function isProductCategoryReady(drawer) {
    if (!drawer) return false;
    const item = getScopedProductFormItem(drawer, '\u7c7b\u76ee');
    if (!item) return false;
    const text = compactText(item.innerText || item.textContent);
    const value = text.replace(/^\u7c7b\u76ee[*\uff1a:\s]*/, '').trim();
    const html = item.innerHTML || '';
    if (!value || /\u8bf7\u9009\u62e9|--/.test(value)) return false;
    if (/\u52a0\u8f7d|loading|ant-spin|ant-select-loading/.test(text + html)) return false;
    return true;
  }

  function getScopedProductFormItem(scope, labelText) {
    const labels = Array.from(scope.querySelectorAll('.ant-form-item-label label'));
    const normalizeLabel = (el) => compactText(el.innerText || el.textContent).replace(/[*\uff1a:]/g, '').trim();
    const label = labels.find((el) => normalizeLabel(el) === labelText) ||
      labels.find((el) => {
        const text = normalizeLabel(el);
        return text === labelText || text.startsWith(labelText + ' ') || text.startsWith(labelText + '\u3000');
      });
    if (label) return label.closest('.ant-form-item');
    if (labelText === '\u7248\u6743\u56fe') {
      const stableField = scope.querySelector('[id="351"], input[id*="attr_group_408_0_attr_language_config_json_0_value"]');
      return stableField ? stableField.closest('.ant-form-item') : null;
    }
    return null;
  }

  async function uploadFileToProductField(labelText, file, filename) {
    const item = getProductFormItem(labelText);
    if (!item) throw new Error('\u672a\u627e\u5230' + labelText);
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    await putFileIntoUploadItem(item, file, filename);
    await waitUploadItemDone(item, filename, 180000);
  }

  async function clearProductReplaceUploadFiles(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u7f16\u8f91\u62bd\u5c49');
    let removedCount = 0;
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      item.scrollIntoView({ block: 'center', inline: 'nearest' });
      await wait(180);
      removedCount += await clearUploadFilesInFormItem(item, labelText);
    }
    if (removedCount) await wait(500);
  }

  function getProductReplaceUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_REPLACE_UPLOAD_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function verifyBatchImagesUploaded(sku) {
    await waitUntil(() => {
      const summary = getBatchImageUploadSummary(sku);
      return summary.total > 0 ? summary : null;
    }, 30000, 500).catch(() => null);
    const summary = getBatchImageUploadSummary(sku);
    if (summary.total <= 0) {
      throw new Error('\u6279\u91cf\u4e0a\u4f20\u540e\u672a\u68c0\u6d4b\u5230\u4e3b\u56fe/\u8be6\u60c5\u56fe/SKU\u56fe');
    }
  }

  function getBatchImageUploadSummary(sku) {
    const drawer = getProductEditDrawerForSku(sku) || Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    const parts = [];
    let total = 0;
    if (!drawer) return { total, parts };
    for (const labelText of PRODUCT_BATCH_IMAGE_LABELS) {
      const item = getScopedProductFormItem(drawer, labelText);
      if (!item) continue;
      const count = getExistingUploadFileNodes(item).length;
      if (count) {
        total += count;
        parts.push(labelText + count);
      }
    }
    return { total, parts };
  }

  async function clearUploadFilesInFormItem(item, labelText) {
    let removed = 0;
    for (let round = 0; round < 12; round += 1) {
      const fileNodes = getExistingUploadFileNodes(item);
      if (!fileNodes.length) break;
      const before = fileNodes.length;
      const fileNode = fileNodes[0];
      const deleteTarget = findUploadDeleteTarget(fileNode);
      if (!deleteTarget) {
        throw new Error(labelText + '\u65e7\u6587\u4ef6\u65e0\u6cd5\u5220\u9664');
      }
      revealUploadActions(fileNode);
      await wait(80);
      clickElement(deleteTarget);
      await confirmUploadDeleteIfNeeded();
      await waitUntil(() => getExistingUploadFileNodes(item).length < before, 10000, 250);
      removed += 1;
    }
    if (getExistingUploadFileNodes(item).length) {
      throw new Error(labelText + '\u65e7\u6587\u4ef6\u672a\u6e05\u7a7a');
    }
    return removed;
  }

  function getExistingUploadFileNodes(item) {
    return Array.from(item.querySelectorAll('.filePreviewCard, .ant-upload-list-item, .ant-upload-list-picture-card-container, .ant-upload-list-text-container'))
      .filter(isVisibleElement)
      .filter((node) => !/ant-upload-list-item-uploading/.test(node.className || ''))
      .filter((node) => {
        const text = getVisibleText(node);
        const html = node.innerHTML || '';
        return /filePreviewCard|ant-upload-list-item|ant-upload-list-picture-card-container|ant-upload-list-text-container/.test(node.className || '') &&
          (/\u9884\u89c8|anticon-delete|delBtnIcon|ant-upload-list-item-name|ant-upload-list-item-card-actions/.test(text + html));
      });
  }

  function revealUploadActions(node) {
    if (!node) return;
    node.classList.add('pfh-force-upload-actions');
    node.querySelectorAll('.downloadBtn').forEach((el) => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });
    ['mouseenter', 'mouseover', 'mousemove'].forEach((type) => {
      dispatchDomEvent(node, type);
    });
  }

  function findUploadDeleteTarget(node) {
    const selectors = [
      '.delBtnIcon',
      '.anticon-delete.delBtnIcon',
      '.ant-upload-list-item-actions .anticon-delete',
      '.ant-upload-list-item-actions [aria-label*="delete" i]',
      '.ant-upload-list-item-actions [aria-label*="\u5220\u9664"]',
      '.ant-upload-list-item-actions [title*="\u5220\u9664"]',
      '.ant-upload-list-item-actions button',
      '.ant-upload-list-item-card-actions .anticon-delete',
      '.anticon-delete',
      '[aria-label*="delete" i]',
      '[aria-label*="\u5220\u9664"]',
      '[title*="\u5220\u9664"]',
    ];
    for (const selector of selectors) {
      const target = node.querySelector(selector);
      if (target) return getClickableElement(target);
    }
    const candidates = Array.from(node.querySelectorAll('button, span, i, svg, a')).filter((el) => {
      const text = compactText(el.innerText || el.textContent || '');
      const meta = [el.className || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || ''].join(' ');
      return /\u5220\u9664|delete|remove|trash|close/i.test(text + ' ' + meta);
    });
    return candidates.length ? getClickableElement(candidates[0]) : null;
  }

  function getClickableElement(el) {
    return el && (el.closest('button, a, [role="button"], .downloadBtn, .ant-upload-list-item-card-actions-btn, .anticon-delete') || el);
  }

  function clickElement(el) {
    if (!el) return;
    if (typeof el.click === 'function') {
      el.click();
      return;
    }
    dispatchDomEvent(el, 'click');
  }

  function dispatchDomEvent(el, type) {
    if (!el) return false;
    try {
      el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
      return true;
    } catch (error) {
      if (type === 'click' && typeof el.click === 'function') {
        el.click();
        return true;
      }
      console.warn('PLM floating helper dispatch event failed:', type, error);
      return false;
    }
  }

  async function confirmUploadDeleteIfNeeded() {
    await wait(250);
    const popup = Array.from(document.querySelectorAll('.ant-popover, .ant-modal'))
      .filter(isVisibleElement)
      .reverse()
      .find((el) => /\u5220\u9664|\u786e\u5b9a|\u786e\u8ba4/.test(getVisibleText(el)));
    if (!popup) return;
    const button = Array.from(popup.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => /\u786e\u5b9a|\u786e\u8ba4|OK/i.test(compactText(el.innerText || el.textContent)));
    if (button) {
      button.click();
      await wait(250);
    }
  }

  function getProductFormItem(labelText) {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, labelText);
  }

  function getBatchUploadPackingInput(field) {
    const item = getProductFormItem(field.attrName);
    if (!item) return null;
    const input = Array.from(item.querySelectorAll('input'))
      .find((element) => element && element.type !== 'hidden');
    return input ? { item, input } : null;
  }

  async function fillBatchUploadPackingFields(task, xlsx) {
    const controls = MAGIC_UPLOAD_PACKING_FIELDS.map((field) => ({ field, control: getBatchUploadPackingInput(field) }));
    const missingControls = controls.filter((entry) => !entry.control).map((entry) => entry.field.attrName + '字段');
    if (missingControls.length) {
      throw new Error('PLM 未找到' + missingControls.join('、') + '输入框，已停止保存草稿和提审');
    }

    const current = controls.reduce((result, entry) => {
      const value = entry.control.input.value;
      result[entry.field.key] = entry.field.key === 'standardPackingQuantity'
        ? normalizeMagicUploadPackingQuantity(value)
        : normalizeMagicUploadBoxWeight(value);
      return result;
    }, { standardPackingQuantity: '', boxWeight: '' });
    const needsSource = MAGIC_UPLOAD_PACKING_FIELDS.some((field) => !current[field.key]);
    let source = normalizeMagicUploadExcelPacking(task && task.excelPacking);
    let parsedMeta = null;
    if (needsSource) {
      parsedMeta = await readMagicUploadPackingFromFile(xlsx, task && task.sku, source);
      source = normalizeMagicUploadExcelPacking(parsedMeta);
      if (parsedMeta.formulaResultUsed || parsedMeta.formulaFallbackUsed) {
        addLog('info', parsedMeta.formulaFallbackUsed ? '批量提审按 Excel 公式计算箱重' : '批量提审读取 Excel 箱重缓存值', task.sku + ' | ' + parsedMeta.sourceName + ' | 不使用公式文本');
      }
    }

    const changed = [];
    const retained = [];
    const missing = [];
    controls.forEach((entry) => {
      const { field, control } = entry;
      const input = control.input;
      const existing = field.key === 'standardPackingQuantity'
        ? normalizeMagicUploadPackingQuantity(input.value)
        : normalizeMagicUploadBoxWeight(input.value);
      if (existing) {
        retained.push(field.attrName + '=' + existing);
        return;
      }
      if (input.disabled || input.readOnly) {
        missing.push(field.attrName + '输入框不可编辑');
        return;
      }
      if (!source[field.key]) {
        missing.push(field.attrName);
        return;
      }
      control.item.scrollIntoView({ block: 'center', inline: 'nearest' });
      setNativeInputValue(input, source[field.key]);
      changed.push(field.attrName + '=' + source[field.key] + '(Excel)');
    });
    if (missing.length) {
      throw new Error('PLM 缺少' + missing.join('、') + '，Excel 未提供有效值，已停止保存草稿和提审');
    }

    if (changed.length) await wait(180);
    const notAccepted = controls.filter((entry) => changed.some((value) => value.indexOf(entry.field.attrName + '=') === 0))
      .filter((entry) => {
        const actual = entry.field.key === 'standardPackingQuantity'
          ? normalizeMagicUploadPackingQuantity(entry.control.input.value)
          : normalizeMagicUploadBoxWeight(entry.control.input.value);
        return actual !== source[entry.field.key];
      })
      .map((entry) => entry.field.attrName);
    if (notAccepted.length) {
      throw new Error('PLM 未接受' + notAccepted.join('、') + '填写值，已停止保存草稿和提审');
    }
    return { changed, retained, source };
  }

  async function putFileIntoUploadItem(item, file, filename) {
    const input = item.querySelector('input[type="file"]');
    if (!input) throw new Error('\u672a\u627e\u5230\u4e0a\u4f20\u63a7\u4ef6');
    const mime = (file && file.type && /^image\//.test(file.type)) ? file.type : guessMime(filename);
    const uploadFile = file instanceof File ? file : new File([file], filename, { type: mime });
    const namedFile = uploadFile.name === filename && uploadFile.type ? uploadFile : new File([uploadFile], filename, { type: uploadFile.type || mime, lastModified: uploadFile.lastModified || Date.now() });
    const dt = new DataTransfer();
    dt.items.add(namedFile);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitUploadItemDone(item, filename, timeout) {
    const base = String(filename || '').replace(/^.*[\\\/]/, '');
    let failureSeenAt = 0;
    await waitUntil(() => {
      const html = item.innerHTML || '';
      const text = getVisibleText(item);
      throwIfUploadRetryNoticeVisible();
      if (/\u4e0a\u4f20\u5931\u8d25|ant-upload-list-item-error/.test(html + text)) {
        if (!failureSeenAt) failureSeenAt = Date.now();
        if (Date.now() - failureSeenAt < 1800) return false;
        throw new Error('\u4e0a\u4f20\u5931\u8d25');
      }
      return !/ant-progress|uploading|\u4e0a\u4f20\u4e2d/.test(html + text) && (text.includes('\u9884\u89c8') || text.includes(base) || /ant-upload-list-item-done/.test(html));
    }, timeout || 120000, 800);
  }

  async function openBatchUploadDialog() {
    await closeCancelConfigModalIfPresent();
    let button = findBatchUploadEntryButton();
    for (let attempt = 0; !button && attempt < 4; attempt += 1) {
      await wait(300);
      await closeCancelConfigModalIfPresent();
      button = findBatchUploadEntryButton();
    }
    if (!button) throw new Error('\u672a\u627e\u5230\u6279\u91cf\u4e0a\u4f20\u5165\u53e3');
    await wait(120);
    await closeCancelConfigModalIfPresent();
    button = findBatchUploadEntryButton();
    if (!button) {
      await wait(300);
      await closeCancelConfigModalIfPresent();
      button = findBatchUploadEntryButton();
    }
    if (!button) throw new Error('\u6279\u91cf\u4e0a\u4f20\u5165\u53e3\u88ab\u5f39\u7a97\u5360\u7528');
    button.click();
    await waitUntil(() => getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u6587\u4ef6') && getVisibleModal(), 30000, 500);
  }

  function findBatchUploadEntryButton() {
    const bottomRightFloat = Array.from(document.querySelectorAll('.ant-float-btn'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.right > window.innerWidth - 80 && rect.bottom > window.innerHeight - 80)
      .find(({ el, rect }) => isElementTopmostAtCenter(el, rect));
    if (bottomRightFloat) return bottomRightFloat.el;

    const candidates = Array.from(document.querySelectorAll('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right'))
      .filter(isVisibleElement)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0)
      .filter(({ rect }) => rect.left > window.innerWidth - 180 && rect.top > window.innerHeight - 180);
    return candidates.find(({ el, rect }) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const top = document.elementFromPoint(x, y);
      return top && (top === el || el.contains(top) || top.closest('.vcb-chat-button, .vcb-chat-button-with-badge, .vcb-fixed-bottom-right') === el || top.closest('.ant-float-btn'));
    })?.el || null;
  }

  function isElementTopmostAtCenter(el, rect) {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (top === el || el.contains(top) || top.closest('.ant-float-btn') === el));
  }

  async function uploadBatchZip(file, filename) {
    const modal = getVisibleModal();
    if (!modal) throw new Error('\u672a\u6253\u5f00\u6279\u91cf\u4e0a\u4f20\u7a97\u53e3');
    await putFileIntoUploadItem(modal, file, filename);
    await waitUploadItemDone(modal, filename, 180000);
  }

  async function matchBatchUploadForm() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u5339\u914d\u8868\u5355');
    if (!button) throw new Error('\u672a\u627e\u5230\u5339\u914d\u8868\u5355');
    button.click();
    await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (isBatchUploadMappingErrorText(text)) throw new Error('\u56fe\u5305ZIP\u5185\u90e8\u6587\u4ef6\u5206\u7ec4\u4e0d\u6b63\u786e');
      return text.includes('\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    }, 30000, 200);
  }

  function isBatchUploadMappingErrorText(text) {
    return /\u672a\u5728\u8868\u5355\u4e2d\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u672a\u5339\u914d\u5230\u5bf9\u5e94\u7684\u5c5e\u6027|\u8868\u5355.*\u5339\u914d.*\u5c5e\u6027/.test(String(text || ''));
  }

  async function confirmBatchUpload() {
    const modal = getVisibleModal();
    const button = modal && Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => compactText(el.innerText || el.textContent) === '\u786e\u8ba4\u65e0\u8bef\uff0c\u5f00\u59cb\u4e0a\u4f20');
    if (!button) throw new Error('\u672a\u627e\u5230\u5f00\u59cb\u4e0a\u4f20');
    button.click();
    await waitUntil(() => !getVisibleModal() || getVisibleText(document.body).includes('\u6279\u91cf\u4e0a\u4f20\u5b8c\u6210'), 240000, 1000);
    await wait(1500);
  }

  function isReviewConfirmWaitError(error) {
    return Boolean(error && error.code === 'PFH_REVIEW_CONFIRM_TIMEOUT');
  }

  function pauseUploadAfterReviewConfirmTimeout(item, error) {
    const message = error && error.message ? error.message : '\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u7b49\u5f85\u8d85\u65f6';
    reviewConfirmRequestedAt = 0;
    state.uploadRunning = false;
    saveUploadWorkerRunning(getUploadControlMode(), false);
    markUploadQueueBlocked(item, L.uploadFailed, message + '\uff0c\u5df2\u6682\u505c\uff0c\u8bf7\u624b\u52a8\u5904\u7406\u63d0\u5ba1\u5f39\u7a97');
    addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u5931\u8d25\uff1a\u63d0\u5ba1\u5f39\u7a97\u54cd\u5e94\u8d85\u65f6\uff0c\u5df2\u6682\u505c', item && item.sku ? item.sku : '');
    showToast((item && item.sku ? item.sku + ' ' : '') + '\u63d0\u5ba1\u5f39\u7a97\u54cd\u5e94\u8f83\u6162\uff0c\u5df2\u6682\u505c\u961f\u5217\uff0c\u8bf7\u624b\u52a8\u5904\u7406');
  }

  async function submitProductReview() {
    const reviewResult = await clickReviewAndWaitConfirm();
    if (reviewResult === 'disabled') {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    }
    if (reviewResult === 'purchase-empty') {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    if (reviewResult === 'minimum-order') {
      reviewConfirmRequestedAt = 0;
      const filled = await fillMinimumOrderQuantityIfNeeded();
      if (!filled) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
      const retryResult = await clickReviewAndWaitConfirm();
      if (retryResult === 'disabled') {
        reviewConfirmRequestedAt = 0;
        throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
      }
      if (retryResult === 'purchase-empty') {
        reviewConfirmRequestedAt = 0;
        throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
      }
      if (retryResult !== 'confirm') throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    }
    if (findProductDisabledError()) {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    }
    if (findPurchaseInfoEmptyError()) {
      reviewConfirmRequestedAt = 0;
      throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    if (!getVisibleModal()) throw new Error('\u672a\u6253\u5f00\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97');
    const confirm = await waitUntil(() => findReviewConfirmButton(), 30000, 200);
    if (!confirm) throw new Error('\u672a\u627e\u5230\u786e\u8ba4\u63d0\u5ba1');
    confirm.click();
    reviewConfirmRequestedAt = 0;
    const result = await waitUntil(() => {
      const text = getVisibleText(document.body);
      if (text.includes('\u4ea7\u54c1\u63d0\u5ba1\u6210\u529f') || text.includes('\u63d0\u5ba1\u6210\u529f')) {
        return isReviewConfirmModal(getVisibleModal()) ? '' : 'success';
      }
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      return '';
    }, 120000, 200);
    if (result === 'disabled') throw new Error('\u4ea7\u54c1\u5df2\u505c\u7528');
    if (result === 'purchase-empty') throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
  }

  function findReviewConfirmButton() {
    const modal = getVisibleModal();
    if (!modal) return null;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).find((el) => {
      const text = compactText(el.innerText || el.textContent).replace(/\s+/g, '');
      const disabled = el.disabled || el.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(el.className || '');
      return text === '\u63d0\u5ba1' && !disabled;
    }) || null;
  }

  async function clickReviewAndWaitConfirm() {
    const button = await waitUntil(() => findProductReviewButton(), 60000, 800);
    if (!button) throw new Error('\u672a\u627e\u5230\u63d0\u5ba1\u6309\u94ae');
    button.click();
    reviewConfirmRequestedAt = Date.now();
    const startedAt = Date.now();
    while (Date.now() - startedAt < REVIEW_CONFIRM_WAIT_MS) {
      const modal = getVisibleModal();
      if (isReviewConfirmModal(modal)) return 'confirm';
      if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
      if (findProductDisabledError()) return 'disabled';
      if (findPurchaseInfoEmptyError()) return 'purchase-empty';
      await wait(80);
    }
    if (findPurchaseInfoEmptyError()) return 'purchase-empty';
    if (findProductDisabledError()) return 'disabled';
    if (findMinimumOrderQuantityErrorItem()) return 'minimum-order';
    if (findReviewConfirmButton()) return 'confirm';
    const error = new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u54cd\u5e94\u8d85\u65f6');
    error.code = 'PFH_REVIEW_CONFIRM_TIMEOUT';
    throw error;
  }

  function findProductReviewButton() {
    return findProductDrawerActionButton('\u63d0\u5ba1');
  }

  async function fillMinimumOrderQuantityIfNeeded() {
    const item = findMinimumOrderQuantityErrorItem();
    if (!item) return false;
    item.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(300);
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    if (!input) return false;
    setNativeInputValue(input, '1000');
    await wait(300);
    return true;
  }

  function findMinimumOrderQuantityItem() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer')).filter(isVisibleElement).pop();
    if (!drawer) return null;
    return getScopedProductFormItem(drawer, '\u6700\u5c0f\u8d77\u8ba2\u91cf');
  }

  function findMinimumOrderQuantityErrorItem() {
    const item = findMinimumOrderQuantityItem();
    if (!item) return null;
    const input = Array.from(item.querySelectorAll('input')).filter(isVisibleElement)[0];
    const value = input ? compactText(input.value || '') : '';
    const text = getVisibleText(item);
    const hasError = /\u8bf7\u8f93\u5165\u6700\u5c0f\u8d77\u8ba2\u91cf|ant-form-item-has-error|ant-form-item-explain-error/.test(text + ' ' + (item.className || '') + ' ' + (item.innerHTML || ''));
    return hasError && !value ? item : null;
  }

  function findPurchaseInfoEmptyError() {
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const scope = drawer || document.body;
    const text = getNodeText(scope);
    if (/\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a/.test(text)) return true;
    const errorRoot = drawer || document;
    const errorNodes = Array.from(errorRoot.querySelectorAll('.ant-form-item-explain-error, .ant-form-item-has-error, [role="alert"], .ant-message-notice, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID));
    if (errorNodes.some((node) => /\u91c7\u8d2d\u4fe1\u606f|\u4e0d\u53ef\u4e3a\u7a7a/.test(getNodeText(node) + ' ' + (node.className || '') + ' ' + (node.innerHTML || '')))) return true;
    const purchaseTitle = Array.from(scope.querySelectorAll('.ant-form-item-label label, .ant-collapse-header, .ant-anchor-link-title, [title]')).find((node) => compactText(node.innerText || node.textContent || node.getAttribute('title')) === '\u91c7\u8d2d\u4fe1\u606f');
    const purchaseSection = purchaseTitle && (purchaseTitle.closest('.ant-form-item') || purchaseTitle.parentElement);
    if (purchaseSection && /ant-form-item-has-error|ant-form-item-explain-error|\u4e0d\u53ef\u4e3a\u7a7a/.test((purchaseSection.className || '') + ' ' + (purchaseSection.innerHTML || ''))) return true;
    return false;
  }

  function findProductDisabledError() {
    const text = getVisibleText(document.body);
    return /\u5f00\u53d1\u4eba\u5458?\u5df2\u505c\u7528|\u5f53\u524d\u4ea7\u54c1\u5df2\u505c\u7528|\u4ea7\u54c1\u5df2\u505c\u7528/.test(text);
  }

  async function saveProductDraftBeforeClose() {
    const saveDraft = findSaveDraftButton();
    if (!saveDraft) throw new Error('\u672a\u627e\u5230\u4fdd\u5b58\u8349\u7a3f\u6309\u94ae');
    const noticeSnapshot = new Map(getPlmNoticeNodes().map((node) => [node, getNodeText(node)]));
    saveDraft.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    saveDraft.click();
    const result = await waitUntil(() => {
      const freshNoticeText = getPlmNoticeNodes()
        .filter((node) => !noticeSnapshot.has(node) || noticeSnapshot.get(node) !== getNodeText(node))
        .map((node) => getNodeText(node))
        .join('\n');
      if (/\u8349\u7a3f\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u6210\u529f|\u8349\u7a3f.*\u4fdd\u5b58.*\u6210\u529f|\u4fdd\u5b58\u6210\u529f/.test(freshNoticeText)) return 'saved';
      if (/\u8349\u7a3f.*\u672a\u4fdd\u5b58\u6210\u529f|\u4fdd\u5b58\u8349\u7a3f.*\u5931\u8d25|\u8349\u7a3f.*\u4fdd\u5b58.*\u5931\u8d25/.test(freshNoticeText)) return 'failed';
      if (findPurchaseInfoEmptyError()) return '';
      return '';
    }, 8000, 100).catch(() => '');
    return result === 'saved';
  }

  function findSaveDraftButton() {
    const bottomButton = findProductDrawerActionButton('\u4fdd\u5b58\u8349\u7a3f');
    if (bottomButton) return bottomButton;
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => /(?:\u7f16\u8f91\u5546\u54c1|\u8bbe\u8ba1\u8d44\u6599)/.test(getNodeText(drawer)));
    for (const drawer of drawers.reverse()) {
      const button = Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f');
      if (button) return button;
    }
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((el) => isActionButtonReady(el) && compactText(el.innerText || el.textContent).replace(/\s+/g, '') === '\u4fdd\u5b58\u8349\u7a3f') || null;
  }

  function findProductDrawerActionButton(text) {
    const normalizedText = compactText(text).replace(/\s+/g, '');
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open, .pdmDetailDrawer'))
      .filter(isVisibleElement)
      .filter((drawer) => /(?:\u7f16\u8f91\u5546\u54c1|\u8bbe\u8ba1\u8d44\u6599)/.test(getNodeText(drawer)));
    const candidates = drawers.flatMap((drawer) => {
      const drawerRect = drawer.getBoundingClientRect();
      return Array.from(drawer.querySelectorAll('button'))
        .filter(isVisibleElement)
        .filter(isActionButtonReady)
        .filter((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === normalizedText)
        .map((button) => ({ button, rect: button.getBoundingClientRect(), drawerRect }));
    }).filter(({ rect, drawerRect }) => rect.width > 0 && rect.height > 0 && rect.top >= drawerRect.top && rect.bottom <= drawerRect.bottom + 2);
    candidates.sort((a, b) => b.rect.top - a.rect.top || b.rect.left - a.rect.left);
    return candidates[0] ? candidates[0].button : null;
  }

  function isActionButtonReady(button) {
    return Boolean(button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' && !/\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(button.className || ''));
  }

  function getPlmNoticeNodes() {
    return Array.from(document.querySelectorAll('.ant-message, .ant-message-notice, .ant-notification, .ant-notification-notice'))
      .filter((node) => !node.closest('#' + PANEL_ID));
  }

  function getPlmNoticeText() {
    return getPlmNoticeNodes()
      .map((node) => getNodeText(node))
      .join('\n');
  }

  async function saveDraftThenClosePurchaseEmptyProduct() {
    if (!findPurchaseInfoEmptyError()) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    const existingModal = getVisibleModal();
    if (existingModal) {
      if (isCancelConfigModal(existingModal)) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
        await waitUntil(() => findPurchaseInfoEmptyError(), 5000, 100);
      } else {
        closeVisibleModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      }
    }
    const saved = await saveProductDraftBeforeClose();
    if (!saved) {
      state.uploadRunning = false;
      saveUploadWorkerRunning(getUploadControlMode(), false);
      throw new Error('\u8349\u7a3f\u672a\u4fdd\u5b58\u6210\u529f\uff0c\u5df2\u6682\u505c');
    }
    const running = getCurrentRunningUpload(loadUploadQueue(), getUploadControlMode());
    if (running) updateUploadItem(running, '\u8fdb\u884c\u4e2d', '\u5173\u95ed\u5546\u54c1\u9875');
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u5546\u54c1\u9875\u5173\u95ed\u6309\u94ae');
    close.click();
    const modal = await waitUntil(() => {
      const topModal = getVisibleModal();
      return topModal && isCancelConfigModal(topModal) ? topModal : null;
    }, 10000, 100);
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal() && !getOpenProductDrawer(), 10000, 100);
    return { draftSaved: true };
  }

  async function closeTopProductDrawer(options) {
    const result = { draftSaved: false };
    if (!(options && options.allowReviewResultModal)) assertNoReviewConfirmModal();
    if (options && options.allowReviewResultModal && isReviewConfirmModal(getVisibleModal())) {
      await waitUntil(() => !isReviewConfirmModal(getVisibleModal()), 8000, 100);
    }
    const existingModal = getVisibleModal();
    if (existingModal && isCancelConfigModal(existingModal)) {
      if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
        cancelCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      } else {
        confirmCancelConfigModal(existingModal);
        await waitUntil(() => !getVisibleModal(), 10000, 100);
      }
    } else if (existingModal) {
      closeVisibleModal(existingModal);
      await waitUntil(() => !getVisibleModal(), 10000, 100);
    }
    if (!(options && options.skipDraftSave) && findPurchaseInfoEmptyError()) {
      const saved = await saveProductDraftBeforeClose().catch((error) => {
        console.warn('PLM floating helper save draft before close failed:', error);
        return false;
      });
      result.draftSaved = saved;
      if (!saved) throw new Error('\u91c7\u8d2d\u4fe1\u606f\u4e0d\u53ef\u4e3a\u7a7a');
    }
    const drawer = Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .pdmDetailDrawer, .ant-drawer-open'))
      .filter(isVisibleElement)
      .pop();
    const close = findDrawerCloseButton(drawer);
    if (!close) return result;
    close.click();
    await waitUntil(() => {
      const topModal = getVisibleModal();
      if (topModal) {
        if (isReviewConfirmModal(topModal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5546\u54c1\u9875');
        if (isCancelConfigModal(topModal)) {
          confirmCancelConfigModal(topModal);
          return false;
        }
        closeVisibleModal(topModal);
        return false;
      }
      const topDrawer = getOpenProductDrawer();
      return !topDrawer;
    }, 10000, 100);
    return result;
  }

  function closeVisibleModal(modal) {
    if (!modal) return false;
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5f39\u7a97');
    const close = Array.from(modal.querySelectorAll('button, .ant-modal-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        return text === '\u53d6\u6d88' || /\u5173\u95ed|close|ant-modal-close/i.test(signature);
      });
    if (!close) throw new Error('\u672a\u627e\u5230\u5173\u95ed\u5f39\u7a97\u6309\u94ae');
    close.click();
    return true;
  }

  function confirmCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    if (!modal || !isCancelConfigModal(modal)) return false;
    const confirm = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u786e\u5b9a');
    if (!confirm) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u786e\u5b9a\u6309\u94ae');
    confirm.click();
    return true;
  }

  async function closeCancelConfigModalIfPresent() {
    assertNoReviewConfirmModal();
    const modal = getVisibleModal();
    if (!modal || !isCancelConfigModal(modal)) return false;
    confirmCancelConfigModal(modal);
    await waitUntil(() => !getVisibleModal(), 10000, 100);
    return true;
  }

  function cancelCancelConfigModal(modal) {
    if (!modal || !isCancelConfigModal(modal)) return false;
    const cancel = Array.from(modal.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent).replace(/\s+/g, '') === '\u53d6\u6d88');
    if (!cancel) throw new Error('\u672a\u627e\u5230\u53d6\u6d88\u914d\u7f6e\u53d6\u6d88\u6309\u94ae');
    cancel.click();
    return true;
  }

  function isCancelConfigModal(modal) {
    const modalText = modal ? getVisibleText(modal) : '';
    return /\u5f53\u524d\u7c7b\u76ee\u5c5e\u6027\u4fe1\u606f\u672a\u4fdd\u5b58|\u662f\u5426\u786e\u8ba4\u53d6\u6d88\u914d\u7f6e/.test(modalText);
  }

  function isReviewConfirmModal(modal) {
    if (!modal || !isVisibleElement(modal)) return false;
    const text = getVisibleText(modal).replace(/\s+/g, '');
    if (/提审成功|产品提审成功|成功/.test(text)) return false;
    if (!/确定提交审批吗|确认提交审批|提交审批吗/.test(text)) return false;
    return Array.from(modal.querySelectorAll('button')).filter(isVisibleElement).some((button) => {
      const buttonText = compactText(button.innerText || button.textContent).replace(/\s+/g, '');
      const className = String(button.className || '');
      const disabled = button.disabled || button.getAttribute('aria-disabled') === 'true' || /\bdisabled\b|ant-btn-loading|ant-btn-disabled/.test(className);
      return buttonText === '\u63d0\u5ba1' && !disabled;
    });
  }

  function isReviewConfirmRequestPending() {
    return Boolean(reviewConfirmRequestedAt && Date.now() - reviewConfirmRequestedAt < REVIEW_CONFIRM_WAIT_MS);
  }

  function assertNoReviewConfirmModal() {
    const modal = getVisibleModal();
    if (isReviewConfirmModal(modal)) throw new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u672a\u5904\u7406\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u6216\u5207\u6362\u4e0b\u4e00\u4e2a\u7f16\u7801');
    if (isReviewConfirmRequestPending()) {
      const error = new Error('\u63d0\u5ba1\u786e\u8ba4\u5f39\u7a97\u6b63\u5728\u54cd\u5e94\uff0c\u5df2\u963b\u6b62\u5173\u95ed\u5546\u54c1\u9875');
      error.code = 'PFH_REVIEW_CONFIRM_TIMEOUT';
      throw error;
    }
  }

  function findDrawerCloseButton(drawer) {
    if (!drawer) return null;
    const drawerRect = drawer.getBoundingClientRect();
    return Array.from(drawer.querySelectorAll('button, .ant-drawer-close, [aria-label]'))
      .filter(isVisibleElement)
      .find((button) => {
        const text = compactText(button.innerText || button.textContent);
        const signature = text + ' ' + (button.getAttribute('aria-label') || '') + ' ' + (button.className || '');
        if (/\u5173\u95ed|close|ant-drawer-close/i.test(signature)) return true;
        const rect = button.getBoundingClientRect();
        const nearDrawerLeftTop = rect.top <= drawerRect.top + 80 && rect.left <= drawerRect.left + 120 && !text;
        const nearDrawerRightTop = rect.top <= drawerRect.top + 80 && rect.right >= drawerRect.right - 100 && !text;
        return nearDrawerLeftTop || nearDrawerRightTop;
      }) || null;
  }

  function getVisibleModal() {
    return Array.from(document.querySelectorAll('.ant-modal')).filter(isVisibleElement).pop() || null;
  }

  function getOpenProductDrawer() {
    return Array.from(document.querySelectorAll('.pdmDetailDrawer.ant-drawer-open, .ant-drawer-open'))
      .filter(isVisibleElement)
      .find((drawer) => drawer.matches('.pdmDetailDrawer.ant-drawer-open') || getVisibleText(drawer).includes('\u7f16\u8f91\u5546\u54c1')) || null;
  }

  function findVisibleButton(text) {
    return Array.from(document.querySelectorAll('button')).filter(isVisibleElement).find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  async function waitUntil(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval || 200);
    }
    throw new Error('\u7b49\u5f85\u8d85\u65f6');
  }

  function guessMime(filename) {
    const lower = String(filename || '').toLowerCase();
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.rar')) return 'application/vnd.rar';
    return 'application/octet-stream';
  }

  function uploadFileKey(sku, kind) {
    return String(sku || '') + ':' + String(kind || '');
  }

  function renderSkuListForActiveView(panel) {
    if (state.workMode === 'product-development' && state.view === 'productDevelopmentTasks' && typeof renderProductDevelopmentTaskSidebarList === 'function') {
      if (renderProductDevelopmentTaskSidebarList(panel)) return;
    }
    renderSkuList(panel);
  }

  function runSearch(targetView) {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = normalizeSearchInput(input.value);
    state.searchQuery = input ? input.value.trim() : '';
    state.skuPage = 1;
    updateSearchClear();
    if (state.workMode === 'product-development' && state.view === 'productDevelopmentTasks') {
      state.productDevelopmentTaskPage = 1;
      if (!renderProductDevelopmentTaskSidebarList(ensurePanel())) renderShell();
      return;
    }
    const requestedView = normalizeDetailViewTab(targetView || getCurrentDetailViewTab());
    const previousView = getCurrentDetailViewTab();
    if (!parseSearchTokens(state.searchQuery).length && !hasSkuFilters()) {
      showToast('请输入产品名、SKU 或物料编码后再搜索。', { tone: 'quiet', diagnostic: false });
      return;
    }
    const matches = parseSearchTokens(state.searchQuery).length || hasSkuFilters() ? getFilteredSearchMatches(state.searchQuery) : [];
    if (matches.length) {
      const target = matches[0];
      const data = loadData(target.sku);
      state.selectedSku = target.sku;
      state.data = data ? normalizeData(data) : null;
      state.detailViewPreviousTab = previousView !== requestedView ? previousView : '';
      state.view = requestedView === 'copywriting' ? 'detail' : requestedView;
      state.copywritingMode = requestedView === 'copywriting';
      resetExcelState();
      if (requestedView === 'parameterImage') parameterImageFeature.loadRules();
      if (requestedView === 'copywriting' && state.data) {
        state.copywritingMode = false;
        openCopywritingFromCurrent(false);
        return;
      }
    }
    expandPanel();
    renderShell();
    if (!matches.length) {
      const hiddenByFilters = hasSkuFilters() && getSearchMatches(parseSearchTokens(state.searchQuery)).length > 0;
      showToast(hiddenByFilters
        ? '当前筛选条件下没有匹配产品，请调整或清除筛选条件。'
        : '本地资料中未找到' + (state.searchQuery ? '“' + state.searchQuery.slice(0, 60) + '”' : '匹配产品') + '，请检查编码或名称，或先在「我的详情」更新产品资料。', { tone: 'quiet', diagnostic: false });
    }
  }

  function clearSearch() {
    const input = ensurePanel().querySelector('.pfh-search-input');
    if (input) input.value = '';
    state.searchQuery = '';
    state.skuPage = 1;
    updateSearchClear();
    expandPanel();
    renderShell();
  }

  function updateSearchClear() {
    const panel = ensurePanel();
    const input = panel.querySelector('.pfh-search-input');
    const clear = panel.querySelector('.pfh-search-clear');
    if (!clear) return;
    clear.classList.toggle('is-visible', Boolean(input && input.value));
  }

  async function openSelectedProjectDetail(options) {
    if (state.openingProjectDetail) {
      showToast(L.openingDetail);
      return;
    }
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    const sku = data && data.sku;
    if (!sku) {
      showToast(L.excelNeedData);
      return;
    }
    const preserveCopywriting = Boolean(options && options.preserveCopywriting && state.copywritingMode && state.selectedSku === sku);
    state.ignoreOutsideClickUntil = Date.now() + 2500;
    if (preserveCopywriting) {
      state.openingProjectDetail = false;
      state.openingProjectDetailSku = '';
      state.selectedSku = sku;
      state.data = data;
      resetExcelState();
      expandPanel();
    } else {
      showProjectDetailOpeningFeedback(sku, data);
    }
    showToast(L.openingDetail);
    try {
      if (!(await ensureNewProductProjectPage())) throw new Error('new product project page not ready');
      let rowId = data.projectRowId || data.projectId || '';
      if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
        cacheProjectRowId(sku, rowId);
        adoptOpenedProjectDrawer(sku);
        showToast(L.openDetailDone);
        return;
      }

      rowId = await queryProjectRowIdBySku(sku);
      if (!rowId || !(await clickProjectDetailByRowId(rowId, sku))) throw new Error('detail button not found');
      cacheProjectRowId(sku, rowId);
      adoptOpenedProjectDrawer(sku);
      showToast(L.openDetailDone);
    } catch (error) {
      console.warn('PLM floating helper open detail failed:', error);
      showToast(L.openDetailFailed);
    } finally {
      state.openingProjectDetail = false;
      if (state.selectedSku === sku) renderShell(preserveCopywriting ? '' : (state.scanRunning ? L.scanning : ''));
      window.setTimeout(() => {
        if (state.openingProjectDetailSku === sku) state.openingProjectDetailSku = '';
      }, 1000);
    }
  }

  function workspaceInitialSkuItem() {
    const selected = state.index.find((item) => item.sku === state.selectedSku);
    if (selected) return selected;
    const items = sortSkuListItems(getFilteredSearchMatches(parseSearchTokens(state.searchQuery.trim())));
    const page = clamp(state.skuPage || 1, 1, Math.max(1, Math.ceil(items.length / 10)));
    return items[(page - 1) * 10] || null;
  }

  function openFirstCachedDetail() {
    const workspaceEnabled = isWorkspaceLayoutEnabled();
    const previewItem = workspaceEnabled ? workspaceInitialSkuItem() : null;
    const first = workspaceEnabled ? (previewItem && previewItem.sku || '') : (state.index[0] && state.index[0].sku ? state.index[0].sku : '');
    if (!workspaceEnabled && !first && !state.settings.collectionEnabled) {
      showToast(L.emptyList);
      return;
    }
    if (first) {
      state.selectedSku = first;
      state.data = normalizeData(loadData(first) || previewItem || state.index[0]);
    } else {
      state.selectedSku = '';
      state.data = null;
    }
    state.view = 'detail';
    state.copywritingMode = false;
    // Avoid rendering the same detail view twice. renderShell() sorts the local
    // catalog, so the duplicate pass was especially noticeable on large lists.
    expandPanel({ render: false });
    renderShell(first ? '正在后台检查新的设计分配...' : workspaceEnabled ? '' : L.openingDetail);
    if (!state.settings.collectionEnabled) return;
    window.setTimeout(() => {
      if (state.assignedDesignTaskSyncPromise) return;
      syncAssignedDesignTasksFromApi({ deferRender: true }).then((syncResult) => {
        if (syncResult && syncResult.skipped) {
          showToast(syncResult.catalogRunning ? '全部产品正在分批采集，可在首页查看进度' : '五分钟内已查询过，暂不重复请求');
          return;
        }
        if (state.view === 'detail' && !state.selectedSku && state.index[0] && state.index[0].sku) {
          const nextSku = state.index[0].sku;
          state.selectedSku = nextSku;
          state.data = normalizeData(loadData(nextSku) || state.index[0]);
        }
        if (state.view === 'detail') renderShell();
        const addedCount = Math.max(Number(syncResult && syncResult.addedCount || 0), Number(syncResult && syncResult.ledgerAddedCount || 0));
        showToast(addedCount ? '已自动加入 ' + addedCount + ' 个新分配任务' : '已检查，暂无新分配任务');
      }).catch((error) => {
        addLog('warn', '我的详情自动同步分配任务失败', formatErrorMessage(error));
        showToast('分配任务查询失败，已保留当前详情', { tone: 'info' });
      });
    }, 0);
  }

  function findUploadRetryNotice() {
    return Array.from(document.querySelectorAll('.ant-notification-notice, .ant-notification'))
      .filter(isVisibleElement)
      .find((node) => /\u5b58\u5728\s*\u9700\u8981\u91cd\u8bd5\u6587\u4ef6/.test(compactText(node.innerText || node.textContent || ''))) || null;
  }

  function throwIfUploadRetryNoticeVisible() {
    if (!findUploadRetryNotice()) return;
    const error = new Error('\u5b58\u5728\u9700\u8981\u91cd\u8bd5\u6587\u4ef6');
    error.code = 'PFH_UPLOAD_REFRESH_RETRY';
    throw error;
  }

  function isUploadRetryRefreshError(error) {
    return Boolean(error && (error.code === 'PFH_UPLOAD_REFRESH_RETRY' || /\u5b58\u5728\s*\u9700\u8981\u91cd\u8bd5\u6587\u4ef6/.test(error.message || '')));
  }

  async function refreshPageAndRetryUploadItem(item) {
    const mode = getUploadItemMode(item);
    const latestQueue = loadUploadQueue();
    const latestItem = latestQueue.find((entry) => entry.id === item.id) || item;
    const retryCount = Math.max(0, Number(latestItem.uploadPageRefreshRetryCount) || 0) + 1;
    if (retryCount > 3) {
      const reason = '\u8fde\u7eed\u5237\u65b0 3 \u6b21\u4ecd\u63d0\u793a\u5b58\u5728\u9700\u8981\u91cd\u8bd5\u6587\u4ef6';
      markUploadQueueBlocked(item, L.uploadFailed, reason, { uploadPageRefreshRetryCount: retryCount });
      addLog('error', '\u63d0\u5ba1\u4e0a\u4f20\u81ea\u52a8\u6062\u590d\u5931\u8d25', (item.sku || '') + ' ' + reason);
      showToast((item.sku || '') + ' ' + reason);
      return;
    }
    updateUploadItem(item, '\u5f85\u4e0a\u4f20', '\u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u5237\u65b0\u540e\u91cd\u65b0\u641c\u7d22\u4e0a\u4f20', {
      forceReplace: true,
      resumeUploadAfterRefresh: true,
      uploadPageRefreshRetryCount: retryCount,
    });
    state.uploadWorkerMode = mode;
    state.uploadRunning = true;
    saveUploadWorkerRunning(mode, true);
    addLog('warn', '\u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u5237\u65b0\u540e\u91cd\u8bd5\u7f16\u7801', (item.sku || '') + ' (' + retryCount + '/3)');
    showToast((item.sku || '') + ' \u68c0\u6d4b\u5230\u9700\u91cd\u8bd5\u6587\u4ef6\uff0c\u6b63\u5728\u5237\u65b0\u9875\u9762\u91cd\u65b0\u4e0a\u4f20');
    await wait(120);
    const refreshUrl = new URL(window.location.href);
    refreshUrl.pathname = '/productManagementProduct';
    refreshUrl.searchParams.set('plmUploadWorker', '1');
    refreshUrl.searchParams.set('plmUploadMode', mode);
    window.location.replace(refreshUrl.toString());
    await new Promise(() => {});
  }

  function pinCurrentSearchResults() {
    const matches = getFilteredSearchMatches(state.searchQuery);
    if (!matches.length) return;
    matches.forEach((match, index) => {
      const item = state.index.find((entry) => entry.sku === match.sku);
      if (!item) return;
      item.pinned = true;
      // Reserve the very top slots for this batch while retaining result order.
      item.pinOrder = index + 1;
    });
    saveIndex();
    state.skuPage = 1;
    showToast('已置顶 ' + matches.length + ' 个编码');
    renderShell();
  }

  function adoptOpenedProjectDrawer(sku, options) {
    const opts = options || {};
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return;
    const switchingSku = Boolean(state.selectedSku && state.selectedSku !== sku);
    state.drawer = drawer;
    state.sku = sku;
    state.selectedSku = sku;
    const cached = loadData(sku);
    if (cached) state.data = normalizeData(cached);
    else if (!state.data || state.data.sku !== sku) state.data = normalizeData({ sku });
    state.view = opts.keepToolsView ? 'tools' : 'detail';
    if (switchingSku) state.copywritingMode = false;
    resetExcelState();
    expandPanel();
    renderShell(L.scanning);
    scheduleDrawerProductFlow(state.data, { reason: 'cached-open', includeScanTabs: true });
  }

  async function ensureNewProductProjectPage() {
    if (isNewProductProjectPageReady()) return true;
    addLog('info', '\u6253\u5f00\u8be6\u60c5\uff1a\u5207\u6362\u5230\u9879\u76ee\u7ba1\u7406-\u65b0\u54c1\u5f00\u53d1');
    const tabButton = findTopTabByText('\u65b0\u54c1\u5f00\u53d1');
    if (tabButton) {
      clickElement(tabButton);
      const readyFromTab = await waitFor(() => isNewProductProjectPageReady(), 5000, 150);
      if (readyFromTab) return true;
    }
    const menuItem = findMenuItemByPathOrText('/projectManagementChemicalNew', '\u65b0\u54c1\u5f00\u53d1');
    if (menuItem) {
      clickElement(menuItem);
      const readyFromMenu = await waitFor(() => isNewProductProjectPageReady(), 8000, 150);
      if (readyFromMenu) return true;
    }
    addLog('error', '\u6253\u5f00\u8be6\u60c5\uff1a\u672a\u627e\u5230\u65b0\u54c1\u5f00\u53d1\u9876\u90e8\u6807\u7b7e\u6216\u5de6\u4fa7\u83dc\u5355');
    return isNewProductProjectPageReady();
  }

  function isNewProductProjectPageReady() {
    return /\/projectManagementChemicalNew/.test(location.pathname) && Boolean(findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801') && findButtonByText('\u67e5\u8be2'));
  }

  function findTopTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.ant-tabs-tab, .ant-tabs-tab-btn, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  function findMenuItemByPathOrText(path, text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('[data-menu-id], .ant-menu-item, .ant-menu-submenu-title, li'))
      .filter(isVisibleElement)
      .find((el) => (el.getAttribute('data-menu-id') || '') === path || compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function queryProjectRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    const input = findInputByPlaceholder('\u641c\u7d22\u5546\u54c1\u7f16\u7801');
    const button = findButtonByText('\u67e5\u8be2');
    if (!input || !button) return '';
    setNativeInputValue(input, sku);
    button.click();
    return await waitFor(() => findProjectRowIdBySku(sku), 5000, 150);
  }

  async function queryDesignTaskRowIdBySku(sku) {
    if (!(await ensureNewProductProjectPage())) return '';
    if (!(await ensureDesignTaskTab())) return '';
    return await queryProjectRowIdBySku(sku);
  }

  async function ensureDesignTaskTab() {
    const active = getActiveProjectWorkflowTabText();
    if (/^\u8bbe\u8ba1\u4efb\u52a1/.test(active)) return true;
    const tab = findProjectWorkflowTabByText('\u8bbe\u8ba1\u4efb\u52a1');
    if (!tab) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u672a\u627e\u5230\u8bbe\u8ba1\u4efb\u52a1\u9875\u7b7e');
      return false;
    }
    clickElement(tab);
    return Boolean(await waitFor(() => /^\u8bbe\u8ba1\u4efb\u52a1/.test(getActiveProjectWorkflowTabText()), 5000, 120));
  }

  async function ensureProjectAllTab() {
    const active = getActiveProjectWorkflowTabText();
    if (/^\u5168\u90e8/.test(active)) return true;
    const tab = findProjectWorkflowTabByText('\u5168\u90e8');
    if (!tab) {
      addLog('error', '玩具文案：未找到新品开发「全部」页签');
      return false;
    }
    clickElement(tab);
    return Boolean(await waitFor(() => /^\u5168\u90e8/.test(getActiveProjectWorkflowTabText()), 5000, 120));
  }

  function getActiveProjectWorkflowTabText() {
    const tab = Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab-active, .ant-tabs-tab-active'))
      .filter(isVisibleElement)
      .find((el) => /^(?:\u5168\u90e8|\u5f00\u53d1\u4efb\u52a1|\u8bbe\u8ba1\u4efb\u52a1|\u63a8\u5e7f\u4e0a\u67b6)/.test(compactText(el.innerText || el.textContent)));
    return tab ? compactText(tab.innerText || tab.textContent) : '';
  }

  function findProjectWorkflowTabByText(text) {
    const expected = compactText(text);
    return Array.from(document.querySelectorAll('.filterTabs .ant-tabs-tab, .filterTabs .ant-tabs-tab-btn, .ant-tabs-tab, [role="tab"]'))
      .filter(isVisibleElement)
      .find((el) => {
        const current = compactText(el.innerText || el.textContent);
        return current === expected || current.startsWith(expected);
      }) || null;
  }

  async function clickProjectDetailByRowId(rowId, sku) {
    if (isProjectDrawerOpenForSku(sku)) return true;
    const row = findOperationRowByRowId(rowId);
    if (!row) return false;
    const detailButton = Array.from(row.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5');
    if (!detailButton) return false;
    detailButton.click();
    return Boolean(await waitFor(() => isProjectDrawerOpenForSku(sku), 8000, 120));
  }

  async function clickProjectEditByRowId(rowId, sku) {
    if (getToyCopywritingDrawerForSku(sku)) return true;
    const button = findOperationButtonByRowId(rowId, '编辑');
    if (!button) return false;
    clickElement(button);
    const editDrawer = await waitFor(() => getProductEditDrawerForSku(sku), 20000, 150);
    if (!editDrawer) return false;
    await enterProductEditSecondStep(sku);
    return Boolean(await waitFor(() => getToyCopywritingDrawerForSku(sku), 30000, 150));
  }

  function isProjectDrawerOpenForSku(sku) {
    return Boolean(getProjectDrawerForSku(sku));
  }

  function getProjectDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        const headerSku = getProjectDrawerHeaderSku(drawer);
        return /\u67e5\u770b\u9879\u76ee\u8be6\u60c5/.test(text) && Boolean(headerSku) && (!sku || headerSku === String(sku).toUpperCase());
      }) || null;
  }

  function findButtonLikeInScope(scope, text) {
    const expected = compactText(text);
    return Array.from(scope.querySelectorAll('button, a, [role="button"], span'))
      .filter(isVisibleElement)
      .find((el) => compactText(el.innerText || el.textContent) === expected) || null;
  }

  async function ensureProjectDrawerForData(data) {
    const sku = data && data.sku;
    if (!sku) return false;
    if (getProjectDrawerForSku(sku)) return Boolean(await waitForExcelProjectDrawerReady(sku, 12000));
    if (!(await ensureNewProductProjectPage())) return false;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectDetailByRowId(rowId, sku)) {
      return Boolean(await waitForExcelProjectDrawerReady(sku, 12000));
    }
    rowId = await queryProjectRowIdBySku(sku);
    if (!rowId) return false;
    const clicked = await clickProjectDetailByRowId(rowId, sku);
    const ready = clicked && Boolean(await waitForExcelProjectDrawerReady(sku, 12000));
    if (ready) cacheProjectRowId(sku, rowId);
    return ready;
  }

  async function waitForExcelProjectDrawerReady(sku, timeout) {
    const drawer = await waitFor(() => {
      const current = getProjectDrawerForSku(sku);
      if (!current) return '';
      return findTabButton(current, L.productTab) || findTabButton(current, L.materialTab) ? current : '';
    }, Number(timeout || 12000) || 12000, 150);
    if (!drawer) return null;
    const stable = await waitForStableProjectDrawerIdentity(drawer, sku, Math.min(Number(timeout || 12000) || 12000, 6000));
    return stable ? (getProjectDrawerForSku(sku) || drawer) : null;
  }

  async function ensureProjectBomDrawerForData(data, options) {
    const opts = options || {};
    const sku = data && data.sku;
    if (!sku) return null;
    const opened = getProjectBomDrawerForSku(sku);
    if (opened) return opened;
    const otherBom = getProjectBomDrawerForSku('');
    if (otherBom && !getVisibleText(otherBom).includes(sku)) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u5f53\u524d\u6253\u5f00\u7684\u7ed1BOM\u4e0d\u662f\u76ee\u6807 SKU', sku);
      return null;
    }
    await closeProjectDetailDrawerForSku(sku);
    if (!(await ensureNewProductProjectPage())) return null;
    if (!(await ensureDesignTaskTab())) return null;
    let rowId = data.projectRowId || data.projectId || '';
    if (rowId && await clickProjectBomByRowId(rowId, sku)) {
      return getProjectBomDrawerForSku(sku);
    }
    if (opts.batchRowOnly) {
      addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u6279\u91cf\u641c\u7d22\u884c\u5df2\u5931\u6548\uff0c\u672a\u91cd\u65b0\u5355\u72ec\u641c\u7d22', sku);
      return null;
    }
    rowId = await queryDesignTaskRowIdBySku(sku);
    if (!rowId) return null;
    const clicked = await clickProjectBomByRowId(rowId, sku);
    if (clicked) cacheProjectRowId(sku, rowId);
    return clicked ? getProjectBomDrawerForSku(sku) : null;
  }

  async function closeProjectDetailDrawerForSku(sku) {
    const drawer = getProjectDrawerForSku(sku);
    if (!drawer) return true;
    const close = findDrawerCloseButton(drawer);
    if (!close) return false;
    clickElement(close);
    await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 5000, 150);
    return true;
  }

  async function clickProjectBomByRowId(rowId, sku) {
    if (getProjectBomDrawerForSku(sku)) return true;
    const button = findOperationButtonByRowId(rowId, '\u7ed1BOM');
    if (!button) return false;
    clickElement(button);
    return Boolean(await waitFor(() => getProjectBomDrawerForSku(sku), 5000, 150));
  }

  function getProjectBomDrawerForSku(sku) {
    return Array.from(document.querySelectorAll('.ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .find((drawer) => {
        const text = getVisibleText(drawer);
        return /\u7ed1\u5b9aBOM|\u7ed1BOM/.test(text) && (!sku || text.includes(sku));
      }) || null;
  }

  function findBomLabelUploadItem(drawer) {
    if (!drawer) return null;
    const isLabelUploadScope = (el) => {
      if (!el || !el.querySelector('input[type="file"]')) return false;
      const text = getVisibleText(el);
      const compact = compactText(text);
      return /\u6807\u7b7e/.test(text) && (/\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text) || compact.startsWith('\u6807\u7b7e'));
    };
    const upload = Array.from(drawer.querySelectorAll('.ant-upload, .ant-upload-wrapper, input[type="file"]'))
      .filter(isVisibleElement)
      .map((el) => el.closest('.materialCardItemHeader, .ant-collapse-item, .typeCard, .cardBox') || el.parentElement)
      .filter(Boolean)
      .find(isLabelUploadScope);
    if (upload) return upload;
    const cards = Array.from(drawer.querySelectorAll('.cardBox, .typeCard'))
      .filter(isVisibleElement)
      .filter((card) => card.querySelector('input[type="file"]'));
    const byTitle = cards.find((card) => compactText((card.querySelector('.cardTitle') || {}).innerText || '') === '\u6807\u7b7e');
    if (byTitle) return byTitle;
    const byMaterial = cards.find((card) => {
      const text = getVisibleText(card);
      return /\u6807\u7b7e/.test(text) && /\u5305\u6750\s*-\s*\u6807\u7b7e/.test(text);
    });
    if (byMaterial) return byMaterial;
    return Array.from(drawer.querySelectorAll('.ant-collapse-item, .materialCardItemHeader'))
      .filter(isVisibleElement)
      .find(isLabelUploadScope) || null;
  }

  function findBomEffectUploadItem(drawer) {
    if (!drawer) return null;
    const labels = Array.from(drawer.querySelectorAll('span, div'))
      .filter(isVisibleElement)
      .filter((el) => compactText(el.innerText || el.textContent) === '\u6548\u679c\u56fe');
    for (const label of labels) {
      let current = label.parentElement;
      for (let depth = 0; current && current !== drawer && depth < 4; depth += 1, current = current.parentElement) {
        if (current.querySelector('input[type="file"]')) return current;
      }
    }
    return null;
  }

  async function saveProjectBomDrawer(drawer) {
    const button = findButtonLikeInScope(drawer, '\u6279\u91cf\u4fdd\u5b58');
    if (!button) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u6309\u94ae');
    const existingNotices = new Set(getVisiblePlmNoticeNodes());
    clickElement(button);
    const result = await waitFor(() => getFreshBomSaveNoticeResult(existingNotices), 120000, 150);
    if (result === 'saved') return true;
    state.uploadRunning = false;
    saveUploadWorkerRunning(getUploadControlMode(), false);
    if (result === 'failed') {
      throw new Error('\u7ed1BOM\u6279\u91cf\u4fdd\u5b58\u5931\u8d25\uff0c\u5df2\u6682\u505c\u961f\u5217\u5e76\u4fdd\u7559\u5f53\u524d\u62bd\u5c49');
    }
    throw new Error('\u672a\u68c0\u6d4b\u5230\u7ed1BOM\u201c\u4fdd\u5b58\u6210\u529f\u201d\u63d0\u793a\uff0c\u5df2\u6682\u505c\u961f\u5217\u5e76\u4fdd\u7559\u5f53\u524d\u62bd\u5c49');
  }

  function getVisiblePlmNoticeNodes() {
    return Array.from(document.querySelectorAll('.ant-message-notice, .ant-notification-notice'))
      .filter(isVisibleElement)
      .filter((node) => !node.closest('#' + PANEL_ID));
  }

  function getFreshBomSaveNoticeResult(existingNotices) {
    const baseline = existingNotices && typeof existingNotices.has === 'function' ? existingNotices : new Set();
    const text = getVisiblePlmNoticeNodes()
      .filter((node) => !baseline.has(node))
      .map((node) => getNodeText(node))
      .join('\n');
    if (/\u4fdd\u5b58\u5931\u8d25|\u64cd\u4f5c\u5931\u8d25|\u8bf7\u6c42\u5931\u8d25|\u7f51\u7edc\u5f02\u5e38|\u7cfb\u7edf\u5f02\u5e38/.test(text)) return 'failed';
    if (/\u4fdd\u5b58\u6210\u529f|\u64cd\u4f5c\u6210\u529f|\u6279\u91cf\u4fdd\u5b58\u6210\u529f/.test(text)) return 'saved';
    return '';
  }

  async function closeProjectBomDrawer(drawer) {
    const close = findDrawerCloseButton(drawer);
    if (!close) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u62bd\u5c49\u5173\u95ed\u6309\u94ae');
    clickElement(close);
    const closed = await waitFor(() => !isVisibleElement(drawer) || !document.body.contains(drawer), 8000, 150);
    if (!closed) throw new Error('\u7ed1BOM\u62bd\u5c49\u672a\u6210\u529f\u5173\u95ed');
  }

  function findProjectRowIdBySku(sku) {
    const row = Array.from(document.querySelectorAll('tr[rowid], .vxe-body--row[rowid]'))
      .filter(isVisibleElement)
      .find((el) => getVisibleText(el).includes(sku));
    return row ? row.getAttribute('rowid') || '' : '';
  }

  function findOperationRowByRowId(rowId) {
    return Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement)
      .find((row) => Array.from(row.querySelectorAll('button')).some((button) => compactText(button.innerText || button.textContent) === '\u8be6\u60c5')) || null;
  }

  function findOperationButtonByRowId(rowId, text) {
    const expected = compactText(text);
    const rows = Array.from(document.querySelectorAll('tr[rowid="' + cssEscape(rowId) + '"], .vxe-body--row[rowid="' + cssEscape(rowId) + '"]'))
      .filter(isVisibleElement);
    for (const row of rows) {
      const button = Array.from(row.querySelectorAll('button'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === expected);
      if (button) return button;
    }
    return null;
  }

  function cacheProjectRowId(sku, rowId) {
    if (!sku || !rowId) return;
    const data = normalizeData({ ...(loadData(sku) || state.data || {}), sku, projectRowId: String(rowId) });
    saveData(sku, data, { suppressDataQuality: true });
  }

  function findInputByPlaceholder(placeholder) {
    return Array.from(document.querySelectorAll('input'))
      .filter(isVisibleElement)
      .find((input) => input.getAttribute('placeholder') === placeholder) || null;
  }

  function findButtonByText(text) {
    return Array.from(document.querySelectorAll('button'))
      .filter(isVisibleElement)
      .find((button) => compactText(button.innerText || button.textContent) === text) || null;
  }

  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function waitFor(check, timeout, interval) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const value = check();
      if (value) return value;
      await wait(interval);
    }
    return '';
  }

  function resetExcelState() {
    state.exportMenuOpen = false;
    state.excelPanelOpen = false;
    state.excelExtra = null;
    state.excelMissing = [];
    state.excelStatus = '';
    state.excelPackQty = '';
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    state.excelPurchasePrice = String(data && data.purchasePrice || '6');
  }

  function syncExcelInputs() {
    const panel = ensurePanel();
    const pack = panel.querySelector('.pfh-excel-pack');
    const price = panel.querySelector('.pfh-excel-price');
    if (pack) state.excelPackQty = pack.value;
    if (price) state.excelPurchasePrice = price.value;
  }

  function buildCachedExcelExtraData(data) {
    const cached = normalizeData(data || {});
    const imageInfo = getCachedSkuImageInfo(cached.sku);
    return {
      englishName: cleanEnglishProductName(cached.englishName, cached.brand),
      chineseName: cached.name || '',
      ingredients: getPreferredExcelIngredients(cached),
      ingredientEnglish: cached.ingredientEnglish || cached.copywritingIngredientEnglish || '',
      ingredientChinese: cached.ingredientChinese || cached.copywritingIngredientChinese || '',
      benchmarkLink: cached.benchmarkLink || cached.referenceUrl || '',
      imageUrl: imageInfo.imageUrl || '',
      imageFallbackUrl: imageInfo.imageFallbackUrl || '',
      skuImageUrl: imageInfo.skuImageUrl || '',
      skuImageFallbackUrl: imageInfo.skuImageFallbackUrl || '',
      skuImageSource: imageInfo.skuImageSource || '',
      isSkuDesignImage: Boolean(imageInfo.isSkuDesignImage),
      apiResolved: false,
      apiFieldStates: {},
      liveData: null,
    };
  }

  function formatExcelMissingStatus(missing) {
    const fields = Array.isArray(missing) ? missing.filter(Boolean) : [];
    return fields.length ? L.excelIncomplete + '：缺少' + fields.join('、') + '；可直接缺项导出' : L.excelReady;
  }

  function formatExcelCacheDiagnostic(data, extra, missing) {
    const available = [];
    if (extra.englishName) available.push('英文产品名');
    if (extra.ingredients) available.push('成分');
    if (extra.isSkuDesignImage && (extra.imageUrl || extra.imageFallbackUrl)) available.push('产品图');
    if (extra.benchmarkLink) available.push('对标链接');
    if (data.productLength && data.productWidth && data.productHeight) available.push('产品尺寸');
    if (data.packageLength && data.packageWidth && data.packageHeight) available.push('包装尺寸');
    if (data.netContent) available.push('净含量');
    if (data.grossWeight) available.push('毛重');
    return '缓存已有：' + (available.join('、') || '无') + ' | 缓存缺少：' + ((missing || []).join('、') || '无');
  }

  async function prepareExcelInfo() {
    syncExcelInputs();
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    state.view = 'detail';
    state.selectedSku = data.sku;
    state.data = data;
    if (data.purchasePrice) state.excelPurchasePrice = String(data.purchasePrice);
    state.excelPanelOpen = true;
    const cachedExtra = buildCachedExcelExtraData(data);
    const cachedMissing = getExcelMissingFields(data, cachedExtra);
    state.excelExtra = { extra: cachedExtra, excelData: data };
    state.excelMissing = cachedMissing;
    state.excelStatus = cachedMissing.length ? L.excelPreparing + '（缺少：' + cachedMissing.join('、') + '；可直接缺项导出）' : L.excelReady + '（使用缓存）';
    addLog(cachedMissing.length ? 'info' : 'success', 'Excel 缓存预检', data.sku + ' | ' + formatExcelCacheDiagnostic(data, cachedExtra, cachedMissing));
    renderShell();
    if (!cachedMissing.length) {
      await fillRecommendedPackQty(data);
      await fillRecommendedPurchasePrice(data, cachedExtra);
      renderShell();
      return true;
    }
    try {
      addLog('info', 'Excel 开始补全实时数据', data.sku + ' | 需要补全：' + cachedMissing.join('、'));
      let extra = await collectExcelExtraData(data.sku);
      let excelData = normalizeData(mergeData(data, extra.liveData || {}));
      let remaining = getExcelMissingFields(excelData, extra);
      if (getExcelDrawerFallbackMissingFields(excelData, extra).length) {
        if (!(await ensureProjectDrawerForData(excelData))) throw new Error('未能打开目标项目详情抽屉');
        extra = await collectExcelExtraData(data.sku);
        excelData = normalizeData(mergeData(excelData, extra.liveData || {}));
        remaining = getExcelMissingFields(excelData, extra);
      }
      cacheProductThumb(excelData, extra);
      state.excelExtra = { extra, excelData };
      state.excelMissing = remaining;
      state.excelStatus = formatExcelMissingStatus(state.excelMissing);
      addLog(state.excelMissing.length ? 'warn' : 'success', 'Excel 信息补全结果', data.sku + ' | ' + formatExcelCacheDiagnostic(excelData, extra, state.excelMissing));
      await fillRecommendedPackQty(excelData);
      await fillRecommendedPurchasePrice(excelData, extra);
      if (state.excelMissing.length) showExcelMissingToast();
      return true;
    } catch (error) {
      console.warn('PLM floating helper excel prepare failed:', error);
      state.excelExtra = { extra: cachedExtra, excelData: data };
      state.excelMissing = cachedMissing;
      state.excelStatus = formatExcelMissingStatus(cachedMissing);
      addLog('error', '\u83b7\u53d6\u8868\u683c\u4fe1\u606f\u5931\u8d25', data.sku + ' | ' + formatExcelCacheDiagnostic(data, cachedExtra, cachedMissing) + ' | 错误：' + formatErrorMessage(error));
      recordDataQuality(data, 'excelPrepareFailed');
      showExcelMissingToast();
      return true;
    } finally {
      renderShell();
    }
  }

  function cacheProductThumb(data, extra) {
    const sku = data && data.sku;
    const src = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (!sku || !src) return;
    const thumbData = normalizeData({
      ...data,
      skuImageUrl: extra.skuImageUrl || extra.imageUrl || '',
      skuImageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extra.skuImageUrl || extra.imageUrl || '',
      skuImageSource: extra.skuImageSource || data.skuImageSource || 'effectImage',
    });
    saveDataDirect(sku, thumbData);
    if ((state.data && state.data.sku === sku) || (!state.data && state.selectedSku === sku)) state.data = thumbData;
    upsertIndex(thumbData);
  }

  function getExcelMissingFields(data, extra) {
    const missing = [];
    if (!extra.englishName) missing.push('\u82f1\u6587\u4ea7\u54c1\u540d');
    if (!extra.ingredients) missing.push('\u6210\u5206');
    if (!extra.isSkuDesignImage || (!extra.imageUrl && !extra.imageFallbackUrl)) missing.push('\u4ea7\u54c1\u56fe');
    if (!extra.benchmarkLink) missing.push('\u5bf9\u6807\u94fe\u63a5');
    if (!shouldOmitToyProductSize(data) && (!data.productLength || !data.productWidth || !data.productHeight)) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.singleBottle && (!data.packageLength || !data.packageWidth || !data.packageHeight)) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    return missing;
  }

  function getExcelDrawerFallbackMissingFields(data, extra) {
    const missing = getExcelMissingFields(data, extra || {});
    if (!extra || !extra.apiResolved) return missing;
    const stateKeys = {
      '\u82f1\u6587\u4ea7\u54c1\u540d': 'englishName',
      '\u5bf9\u6807\u94fe\u63a5': 'benchmarkLink',
      '\u4ea7\u54c1\u5c3a\u5bf8': 'productSize',
      '\u5305\u88c5\u5c3a\u5bf8': 'packageSize',
      '\u51c0\u542b\u91cf': 'netContent',
      '\u6bdb\u91cd': 'grossWeight',
    };
    const states = mergeApiFieldStates(extra.apiFieldStates, data && data.apiFieldStates);
    return missing.filter((label) => {
      const key = stateKeys[label];
      return !key || (states[key] !== 'value' && states[key] !== 'empty');
    });
  }

  function extractExcelBatchSkus(value) {
    const matches = String(value || '').match(/\bSKU\d{8}\b/gi) || [];
    const seen = new Set();
    return matches.map((item) => String(item).toUpperCase()).filter((sku) => {
      if (seen.has(sku)) return false;
      seen.add(sku);
      return true;
    });
  }

  function getExcelBatchCacheSnapshot(sku) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const indexed = state.index.find((item) => String(item && item.sku || '').toUpperCase() === normalizedSku);
    const data = normalizeData(loadData(normalizedSku) || indexed || { sku: normalizedSku });
    const extra = buildCachedExcelExtraData(data);
    const missing = getExcelMissingFields(data, extra);
    const packQty = normalizePackQty(getLocalPackQty(data));
    if (!packQty) missing.push('\u88c5\u7bb1\u6570');
    return {
      data,
      extra,
      missing: Array.from(new Set(missing)),
      packQty,
      purchasePrice: String(data.purchasePrice || '6'),
    };
  }

  function addExcelBatchQueueItems(value) {
    const skus = extractExcelBatchSkus(value);
    if (!skus.length) {
      showToast('\u6ca1\u6709\u627e\u5230\u6709\u6548 SKU\uff0c\u8bf7\u68c0\u67e5\u7f16\u7801\u683c\u5f0f');
      return;
    }
    const queue = loadExcelBatchQueue();
    const next = queue.slice();
    skus.forEach((sku) => {
      const snapshot = getExcelBatchCacheSnapshot(sku);
      const index = next.findIndex((entry) => entry.sku === sku);
      const previous = index >= 0 ? next[index] : {};
      const item = {
        ...previous,
        sku,
        status: 'pending',
        missing: snapshot.missing,
        packQty: snapshot.packQty,
        purchasePrice: snapshot.purchasePrice,
        error: '',
        updatedAt: Date.now(),
      };
      if (index >= 0) next[index] = item;
      else next.push(item);
    });
    state.batchExcelInput = '';
    saveExcelBatchQueue(next);
    state.batchExcelStatus = '\u5df2\u52a0\u5165 ' + skus.length + ' \u4e2a SKU\uff0c\u7b49\u5f85\u8865\u5168\u7f13\u5b58';
    renderShell();
    showToast(state.batchExcelStatus);
    startExcelBatchPreparation();
  }

  function updateExcelBatchQueueEntry(sku, patch) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const queue = loadExcelBatchQueue();
    const next = queue.map((entry) => entry.sku === normalizedSku ? { ...entry, ...(patch || {}), updatedAt: Date.now() } : entry);
    saveExcelBatchQueue(next);
    return next.find((entry) => entry.sku === normalizedSku) || null;
  }

  function removeExcelBatchQueueItem(sku) {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) {
      showToast('\u5f53\u524d\u961f\u5217\u6b63\u5728\u5904\u7406\uff0c\u8bf7\u7b49\u5f85\u5b8c\u6210');
      return;
    }
    const normalizedSku = String(sku || '').trim().toUpperCase();
    saveExcelBatchQueue(loadExcelBatchQueue().filter((entry) => entry.sku !== normalizedSku));
    renderShell();
  }

  function retryExcelBatchQueueItem(sku) {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    const normalizedSku = String(sku || '').trim().toUpperCase();
    if (!loadExcelBatchQueue().some((entry) => entry.sku === normalizedSku)) return;
    updateExcelBatchQueueEntry(normalizedSku, { status: 'pending', error: '' });
    renderShell();
    startExcelBatchPreparation();
  }

  function pauseExcelBatchPreparation() {
    if (!state.batchExcelWorkerRunning) {
      if (state.batchExcelWorkerPaused) {
        state.batchExcelWorkerPaused = false;
        startExcelBatchPreparation();
      }
      return;
    }
    state.batchExcelWorkerPaused = !state.batchExcelWorkerPaused;
    state.batchExcelStatus = state.batchExcelWorkerPaused
      ? '已请求暂停，当前 SKU 完成后暂停队列'
      : '已继续补全队列';
    renderShell();
  }

  function clearCompletedExcelBatchQueue() {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    saveExcelBatchQueue(loadExcelBatchQueue().filter((entry) => entry.status !== 'downloaded'));
    state.batchExcelStatus = '\u5df2\u6e05\u9664\u5df2\u4e0b\u8f7d\u9879';
    renderShell();
  }

  async function startExcelBatchPreparation() {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    const pending = loadExcelBatchQueue().filter((entry) => entry.status === 'pending' || entry.status === 'error');
    if (!pending.length) {
      state.batchExcelStatus = loadExcelBatchQueue().length ? '\u5f53\u524d\u961f\u5217\u6ca1\u6709\u9700\u8981\u8865\u5168\u7684\u9879\u76ee' : '\u961f\u5217\u6682\u7a7a';
      renderShell();
      return;
    }
    state.batchExcelWorkerRunning = true;
    state.batchExcelWorkerPaused = false;
    state.view = 'batchExcel';
    expandPanel();
    state.batchExcelStatus = '\u5f00\u59cb\u6309\u987a\u5e8f\u8865\u5168 ' + pending.length + ' \u4e2a SKU';
    renderShell();
    try {
      for (let index = 0; index < pending.length; index += 1) {
        if (state.batchExcelWorkerPaused) break;
        const item = loadExcelBatchQueue().find((entry) => entry.sku === pending[index].sku);
        if (!item || (item.status !== 'pending' && item.status !== 'error')) continue;
        const sku = item.sku;
        state.batchExcelCurrentSku = sku;
        state.batchExcelStatus = '\u6b63\u5728\u8865\u5168 ' + (index + 1) + '/' + pending.length + '\uff1a' + sku;
        updateExcelBatchQueueEntry(sku, { status: 'preparing', error: '' });
        renderShell();
        try {
          let prepared = null;
          let lastError = null;
          for (let attempt = 1; attempt <= EXCEL_BATCH_PREPARE_RETRIES; attempt += 1) {
            try {
              prepared = await prepareExcelBatchSku(sku);
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              if (error && error.name === 'AbortError') throw error;
              if (attempt >= EXCEL_BATCH_PREPARE_RETRIES) break;
              state.batchExcelStatus = sku + ' 页面仍在加载，等待重试 ' + attempt + '/' + EXCEL_BATCH_PREPARE_RETRIES;
              addLog('warn', 'Excel 批量补全等待页面加载', sku + ' | 第 ' + attempt + ' 次失败：' + formatErrorMessage(error));
              if (state.view === 'batchExcel') renderShell();
              await wait(1200 * attempt);
            }
          }
          if (!prepared) throw lastError || new Error('未取得完整页面数据');
          const patch = {
            status: prepared.missing.length ? 'partial' : 'ready',
            missing: prepared.missing,
            packQty: prepared.packQty,
            purchasePrice: prepared.purchasePrice,
            error: '',
          };
          updateExcelBatchQueueEntry(sku, patch);
          state.batchExcelStatus = prepared.missing.length
            ? sku + ' \u8fd8\u7f3a\uff1a' + prepared.missing.join('\u3001') + '\uff0c\u4ecd\u53ef\u751f\u6210 Excel'
            : sku + ' API \u5df2\u5237\u65b0\uff0c\u7b49\u5f85\u4e0b\u8f7d';
        } catch (error) {
          if (error && error.name === 'AbortError') {
            updateExcelBatchQueueEntry(sku, { status: 'pending', error: '' });
            state.batchExcelWorkerPaused = true;
            state.batchExcelStatus = '已暂停补全，当前产品保留在队列中，可点击继续';
            addLog('info', 'Excel 批量补全已暂停', sku + ' | ' + formatErrorMessage(error));
            break;
          }
          const message = formatErrorMessage(error) || '\u672a\u77e5\u9519\u8bef';
          updateExcelBatchQueueEntry(sku, { status: 'error', error: message, missing: getExcelBatchCacheSnapshot(sku).missing });
          state.batchExcelStatus = sku + ' \u8865\u5168\u5931\u8d25\uff1a' + message;
          addLog('error', 'Excel \u6279\u91cf\u8865\u5168\u5931\u8d25', sku + ' | ' + message);
        }
        if (state.view === 'batchExcel') renderShell();
        await wait(650);
      }
    } finally {
      const paused = Boolean(state.batchExcelWorkerPaused);
      state.batchExcelWorkerRunning = false;
      state.batchExcelCurrentSku = '';
      if (paused) state.batchExcelStatus = '\u8865\u5168\u5df2\u6682\u505c，可点击“继续补全”继续处理剩余项目';
      else if (!state.batchExcelStatus || /\u6b63\u5728\u8865\u5168/.test(state.batchExcelStatus)) state.batchExcelStatus = '\u8865全队列已完成';
      if (state.view === 'batchExcel') renderShell();
    }
  }

  async function prepareExcelBatchSku(sku) {
    let snapshot = getExcelBatchCacheSnapshot(sku);
    let data = snapshot.data;
    let extra = snapshot.extra;
    state.selectedSku = sku;
    state.data = data;
    resetExcelState();
    state.selectedSku = sku;
    state.data = data;
    try {
      // A batch export must refresh the API snapshot even when the local cache
      // already looks complete; otherwise stale page/manual values can reach Excel.
      extra = await collectExcelExtraData(sku, { force: true });
      data = normalizeData(mergeData(data, extra.liveData || {}));
      if (getExcelDrawerFallbackMissingFields(data, extra).length) {
        const currentDrawer = getProjectDrawer();
        const currentSku = currentDrawer ? getProjectDrawerHeaderSku(currentDrawer) : '';
        if (currentDrawer && currentSku && currentSku !== sku) await closeProjectDetailDrawerForSku(currentSku).catch(() => false);
        if (!(await ensureProjectDrawerForData(data))) throw new Error('\u672a\u80fd\u6253\u5f00 ' + sku + ' \u9879\u76ee\u8be6\u60c5\u62bd\u5c49');
        try {
          extra = await collectExcelExtraData(sku, { force: true });
        } finally {
          await closeProjectDetailDrawerForSku(sku).catch(() => false);
        }
        data = normalizeData(mergeData(data, extra.liveData || {}));
      }
      const ingredientValue = extra.ingredients || extra.ingredientChinese || extra.ingredientEnglish || data.ingredientChinese || data.ingredientEnglish || '';
      const enriched = {
        ...data,
        englishName: extra.englishName || data.englishName || '',
        name: data.name || extra.chineseName || '',
        ingredientChinese: extra.ingredientChinese || ingredientValue,
        ingredientEnglish: extra.ingredientEnglish || ingredientValue,
        copywritingIngredientChinese: extra.ingredientChinese || ingredientValue,
        copywritingIngredientEnglish: extra.ingredientEnglish || ingredientValue,
        benchmarkLink: extra.benchmarkLink || data.benchmarkLink || '',
        referenceUrl: extra.benchmarkLink || data.referenceUrl || '',
        skuImageUrl: extra.skuImageUrl || extra.imageUrl || data.skuImageUrl || '',
        skuImageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || data.skuImageFallbackUrl || '',
        skuImageSource: extra.skuImageSource || data.skuImageSource || '',
      };
      cacheProductThumb(enriched, extra);
      saveData(sku, enriched, { suppressChangeTracking: true, changeSource: '\u6279\u91cf Excel \u8865\u5168' });
      data = normalizeData(loadData(sku) || enriched);
      extra = buildCachedExcelExtraData(data);
      state.data = data;
      state.selectedSku = sku;
      state.excelPackQty = '';
      state.excelPurchasePrice = String(data.purchasePrice || '6');
      await fillRecommendedPackQty(data);
      data = normalizeData(loadData(sku) || data);
      extra = buildCachedExcelExtraData(data);
      await fillRecommendedPurchasePrice(data, extra);
      data = normalizeData(loadData(sku) || data);
      extra = buildCachedExcelExtraData(data);
      const missing = getExcelMissingFields(data, extra);
      const packQty = normalizePackQty(getLocalPackQty(data));
      if (!packQty) missing.push('\u88c5\u7bb1\u6570');
      return {
        data,
        extra,
        missing: Array.from(new Set(missing)),
        packQty,
        purchasePrice: String(state.excelPurchasePrice || data.purchasePrice || '6'),
      };
    } finally {
      await closeProjectDetailDrawerForSku(sku).catch(() => false);
    }
  }

  function getExcelBatchField(data, keys) {
    for (const key of keys || []) {
      const value = data && data[key];
      if (value !== undefined && value !== null && compactText(value)) return compactText(value);
    }
    return '';
  }

  function cloneExcelTemplateValue(value) {
    if (!value || typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return { ...value };
    }
  }

  function captureExcelTemplateRow(sheet, rowNumber) {
    const row = sheet.getRow(rowNumber);
    const count = Math.max(21, Number(sheet.columnCount) || 0);
    return {
      height: row.height,
      cells: Array.from({ length: count }, (_, index) => {
        const cell = row.getCell(index + 1);
        return { value: cloneExcelTemplateValue(cell.value), style: cloneExcelTemplateValue(cell.style) };
      }),
    };
  }

  function removeUnusedExcelTemplateRow(sheet) {
    if (!sheet || Number(sheet.rowCount) < 5 || typeof sheet.spliceRows !== 'function') return;
    const row = sheet.getRow(5);
    const payloadColumns = [1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    const hasPayload = payloadColumns.some((column) => {
      const value = row.getCell(column).value;
      return value !== undefined && value !== null && compactText(value);
    });
    if (!hasPayload) sheet.spliceRows(5, 1);
  }

  function applyExcelTemplateRow(sheet, rowNumber, template) {
    const row = sheet.getRow(rowNumber);
    (template && template.cells || []).forEach((source, index) => {
      const cell = row.getCell(index + 1);
      cell.value = cloneExcelTemplateValue(source.value);
      if (source.style) cell.style = cloneExcelTemplateValue(source.style);
    });
    row.height = Math.max(Number(template && template.height) || 0, 96);
  }

  function abbreviateExcelTraceName(value) {
    const name = String(value || '').trim().replace(/\s+/g, ' ');
    if (!name) return 'U';
    const parts = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[\p{Script=Han}]+|[A-Za-z]+/gu) || [];
    const initials = parts.map((part) => {
      if (/\p{Script=Han}/u.test(part)) {
        return traceNamePinyin(part, { pattern: 'first', toneType: 'none', type: 'array', surname: 'head', nonZh: 'removed' }).join('');
      }
      return part[0];
    }).join('').toUpperCase().replace(/[^A-Z]/g, '');
    return initials || 'U';
  }

  function buildImageTraceWatermark(generatedAt) {
    const date = generatedAt instanceof Date && !Number.isNaN(generatedAt.getTime()) ? generatedAt : new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const timestamp = String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
    const actor = abbreviateExcelTraceName(findCurrentPlmUserName() || state.sizeImageAccessName || state.parameterImageAccessName || '');
    return 'PFH · ' + actor + ' · ' + timestamp + ' · v' + SCRIPT_VERSION;
  }

  function drawImageTraceWatermark(context, width, height, trace) {
    if (!context || !trace) return;
    const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.0075));
    const margin = Math.max(12, Math.round(Math.min(width, height) * 0.008));
    context.save();
    try {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 0.2;
      context.fillStyle = '#c8c8c8';
      context.font = '400 ' + fontSize + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillText(String(trace), width / 2, height - margin, width - margin * 2);
    } finally {
      context.restore();
    }
  }

  function buildExcelTraceWatermark(exportedAt) {
    const date = exportedAt instanceof Date && !Number.isNaN(exportedAt.getTime()) ? exportedAt : new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const timestamp = pad(date.getFullYear() % 100) + pad(date.getMonth() + 1) + pad(date.getDate()) + '-' + pad(date.getHours()) + pad(date.getMinutes());
    const actor = abbreviateExcelTraceName(findCurrentPlmUserName() || state.sizeImageAccessName || (state.settings && state.settings.cloudBackupOwnerName));
    return 'PFH\u00b7' + actor + '\u00b7' + timestamp + '\u00b7V' + String(SCRIPT_VERSION || '').replace(/\D/g, '');
  }

  function applyExcelTraceWatermark(workbook, exportedAt) {
    if (!workbook) return '';
    const date = exportedAt instanceof Date && !Number.isNaN(exportedAt.getTime()) ? exportedAt : new Date();
    const watermark = buildExcelTraceWatermark(date);
    workbook.creator = watermark;
    workbook.lastModifiedBy = watermark;
    workbook.created = date;
    workbook.modified = date;
    workbook.subject = watermark;
    workbook.keywords = watermark;
    workbook.description = watermark;
    return watermark;
  }

  function formatExcelAccessorySize(value) {
    return String(value || '').replace(/(\d+(?:\.\d+)?\s*(?:cm|mm|厘米|毫米)?)\s*[xX×＊*]\s*(?=(?:直径|长|宽|高|厚(?:度)?)?\s*\d)/gi, '$1*');
  }

  function formatExcelQuantityText(value) {
    return String(value || '').replace(/(\d+(?:\.\d+)?\s*(?:kg|mg|mcg|ug|g|ml|cl|dl|l|floz|oz|lbs?|粒|片|支|瓶|袋|盒|包|个|件|套)?)\s*[xX×＊*]\s*(?=\d)/gi, '$1x');
  }

  function buildExcelProductSizeWithAccessories(data) {
    const primarySize = formatExcelDimFromParts([data.productLength, data.productWidth, data.productHeight]) || formatExcelDim(data.productNums, []);
    const accessories = normalizeAccessories(data.accessories).filter((item) => item.sizeText);
    if (!accessories.length) return primarySize;
    return [primarySize ? (data.name || '主产品') + '：\n' + primarySize : '', ...accessories.map((item) => item.name + '：\n' + formatExcelAccessorySize(item.sizeText))].filter(Boolean).join('\n');
  }

  function buildExcelSpecificationWithAccessories(data) {
    const accessories = normalizeAccessories(data.accessories);
    const net = formatExcelQuantityText(normalizeExcelUnit(data.netContent));
    if (!accessories.length) return net;
    return [(data.brand ? data.brand + ' ' : '') + (data.name || '主产品') + (net ? '：' + net : '') + 'x1', ...accessories.map((item) => item.name + 'x' + item.quantity)].join('，\n');
  }

  function writeExcelBatchRow(sheet, rowNumber, data, extra, packQty, purchasePrice) {
    const cell = (column, value) => setCell(sheet, column + rowNumber, value);
    const productSize = buildExcelProductSizeWithAccessories(data);
    const packageSize = formatExcelDimFromParts([data.packageLength, data.packageWidth, data.packageHeight]) || formatExcelDim(data.packageNums, []);
    const cartonSpec = getExcelBatchField(data, ['cartonSpec', 'outerCartonSpec', 'cartonSize', 'cartonSizeText', 'boxSpec']);
    const material = getExcelBatchField(data, ['packageMaterial', 'packagingMaterial', 'material']);
    const dueText = getExcelBatchField(data, ['leadTimeText', 'deliveryText', 'deliveryNote', 'leadTimeNote']);
    const aliLink = getExcelBatchField(data, ['alibabaLink', 'aliLink', '1688Link', 'alibabaUrl']);
    cell('A', buildExcelKeyword(data, extra));
    cell('B', data.name || extra.chineseName || '');
    cell('C', '');
    if (cartonSpec) cell('D', cartonSpec);
    cell('E', compactText(packQty));
    cell('F', buildExcelBatchWeightFormula(rowNumber, 'N'));
    cell('G', data.sku || '');
    if (data.singleBottle) cell('H', '\u74f6\u88c5');
    else cell('H', { formula: 'IF(LEN(J' + rowNumber + ')-LEN(SUBSTITUTE(J' + rowNumber + ',"*",""))=2,"\u76d2\u88c5",IF(LEN(J' + rowNumber + ')-LEN(SUBSTITUTE(J' + rowNumber + ',"*",""))=1,"\u888b\u88c5",""))' });
    cell('I', productSize);
    cell('J', packageSize);
    if (material) cell('K', material);
    cell('L', formatIngredientsForExcel(extra.ingredients || getPreferredExcelIngredients(data)));
    cell('M', buildExcelSpecificationWithAccessories(data));
    if (normalizeAccessories(data.accessories).length) setCell(sheet, 'M3', '规格');
    cell('N', normalizeExcelUnit(data.grossWeight));
    cell('O', normalizeExcelNumberOrText(purchasePrice));
    cell('P', data.returnDate || getReturnDateText(7));
    if (dueText) cell('Q', dueText);
    if (aliLink) cell('R', aliLink);
    cell('S', extra.benchmarkLink || data.benchmarkLink || data.referenceUrl || '');
  }

  function buildExcelBatchWeightFormula(rowNumber, grossWeightColumn) {
    const grossCell = grossWeightColumn + rowNumber;
    const packCell = 'E' + rowNumber;
    return { formula: 'IF(OR(' + packCell + '="",' + grossCell + '=""),"",IFERROR(TEXT(VALUE(LEFT(' + packCell + ',LEN(' + packCell + ')-3))*(VALUE(LEFT(' + grossCell + ',LEN(' + grossCell + ')-1))/1000)+0.75,"0.00")&"kg",""))' };
  }

  function applyExcelBatchSingleColumnLayout(sheet, data) {
    if (shouldOmitToyProductSize(data)) {
      sheet.spliceColumns(9, 1);
      sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
      sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
    } else if (shouldRemoveExcelPackageSizeColumn(data)) {
      sheet.spliceColumns(10, 1);
      sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
      sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
    }
  }

  function applyExcelBatchMergedColumnLayout(sheet, items) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) return;
    const omitProductSize = rows.every((item) => shouldOmitToyProductSize(item.data));
    const removePackageSize = !omitProductSize && rows.every((item) => shouldRemoveExcelPackageSizeColumn(item.data));
    if (!omitProductSize && !removePackageSize) return;
    if (omitProductSize) sheet.spliceColumns(9, 1);
    else sheet.spliceColumns(10, 1);
    const lastRow = 3 + rows.length;
    for (let rowNumber = 4; rowNumber <= lastRow; rowNumber += 1) {
      sheet.getCell('H' + rowNumber).value = rows[rowNumber - 4].data.singleBottle
        ? '\u74f6\u88c5'
        : { formula: 'IF(LEN(I' + rowNumber + ')-LEN(SUBSTITUTE(I' + rowNumber + ',"*",""))=2,"\u76d2\u88c5",IF(LEN(I' + rowNumber + ')-LEN(SUBSTITUTE(I' + rowNumber + ',"*",""))=1,"\u888b\u88c5",""))' };
      sheet.getCell('F' + rowNumber).value = buildExcelBatchWeightFormula(rowNumber, 'M');
    }
    sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
  }

  async function getExcelBatchImageInfo(item) {
    const source = getExcelImageSource(item.data, item.extra);
    const target = source.imageUrl || source.imageFallbackUrl;
    const imageInfo = target ? await fetchImageForExcel(target, source.imageFallbackUrl).catch(() => null) : null;
    if (!imageInfo || !imageInfo.dataUrl) return null;
    if (await isPlaceholderSkuImage(imageInfo.dataUrl)) return null;
    return imageInfo;
  }

  async function buildExcelBatchSingleBuffer(item) {
    const Excel = await ensureExcelJsLoaded();
    const workbook = await loadCloudExcelTemplateWorkbook(Excel);
    const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    removeUnusedExcelTemplateRow(sheet);
    const imageInfo = await getExcelBatchImageInfo(item);
    writeExcelBatchRow(sheet, 4, item.data, item.extra, item.packQty, item.purchasePrice);
    applyExcelBatchSingleColumnLayout(sheet, item.data);
    if (imageInfo) {
      const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
      sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
    }
    applyExcelTraceWatermark(workbook);
    return workbook.xlsx.writeBuffer();
  }

  async function buildExcelBatchMergedBuffer(items) {
    const Excel = await ensureExcelJsLoaded();
    const workbook = await loadCloudExcelTemplateWorkbook(Excel);
    const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    removeUnusedExcelTemplateRow(sheet);
    const template = captureExcelTemplateRow(sheet, 4);
    sheet.getRow(4).height = Math.max(Number(template.height) || 0, 96);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const rowNumber = index === 0 ? 4 : sheet.addRow([]).number;
      if (index > 0) applyExcelTemplateRow(sheet, rowNumber, template);
      const imageInfo = await getExcelBatchImageInfo(item);
      writeExcelBatchRow(sheet, rowNumber, item.data, item.extra, item.packQty, item.purchasePrice);
      if (imageInfo) {
        const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
        sheet.addImage(imageId, getExcelImageAnchor(imageInfo, rowNumber - 4));
      }
    }
    applyExcelBatchMergedColumnLayout(sheet, items);
    applyExcelTraceWatermark(workbook);
    return workbook.xlsx.writeBuffer();
  }

  function getExcelBatchDownloadItems() {
    return loadExcelBatchQueue().map((entry) => {
      const snapshot = getExcelBatchCacheSnapshot(entry.sku);
      return {
        entry,
        data: snapshot.data,
        extra: snapshot.extra,
        missing: snapshot.missing,
        packQty: normalizePackQty(getLocalPackQty(snapshot.data)),
        purchasePrice: String(entry.purchasePrice || snapshot.purchasePrice || '6'),
      };
    }).filter((item) => item.entry.status !== 'preparing');
  }

  function buildExcelBatchFileName(items) {
    const first = items[0] || {};
    const data = first.data || {};
    const skuSummary = [data.sku, items.length > 1 ? '等' + items.length + '个SKU' : ''].filter(Boolean).join(' ');
    const parts = [data.brand, data.name || (first.extra && first.extra.chineseName), skuSummary].filter(Boolean);
    return sanitizeExcelFileName((parts.join(' ').replace(/\s+/g, ' ').trim() || 'PLM\u6279\u91cf\u4ea7\u54c1\u4fe1\u606f') + '.xlsx');
  }

  function markExcelBatchItemsDownloaded(items, fileName) {
    const skus = new Set((items || []).map((item) => item.data && item.data.sku).filter(Boolean));
    saveExcelBatchQueue(loadExcelBatchQueue().map((entry) => skus.has(entry.sku)
      ? { ...entry, status: 'downloaded', missing: [], lastFileName: fileName, downloadedAt: Date.now(), error: '' }
      : entry));
  }

  function recordExcelBatchItems(items, source, fileName) {
    (items || []).forEach((item) => {
      const data = item.data || {};
      const extra = item.extra || {};
      syncInsightEvent('excel_generated', { sku: data.sku || '', name: data.name || '', source });
      recordCommerceInsight(data, extra, { price: item.purchasePrice, packQty: item.packQty, source, fileName });
      upsertDailyLedgerFromData(data, { status: '制作中', stage: '表格/上传处理中', note: '已生成 Excel' });
    });
  }

  async function downloadExcelBatchQueue() {
    if (state.batchExcelWorkerRunning || state.batchExcelDownloadRunning) return;
    try {
      await ensureExcelJsLoaded();
    } catch (error) {
      showToast(formatErrorMessage(error) || L.excelNeedLibrary);
      return;
    }
    if (!await ensureExcelTemplateLoaded()) {
      showToast('\u6a21\u677f\u5c1a\u672a\u7f13\u5b58\uff0c\u8bf7\u8054\u7f51\u540e\u91cd\u8bd5');
      return;
    }
    const items = getExcelBatchDownloadItems();
    if (!items.length) {
      showToast('\u961f\u5217\u4e2d\u6ca1\u6709\u53ef\u751f\u6210\u7684 SKU');
      return;
    }
    state.batchExcelDownloadRunning = true;
    state.view = 'batchExcel';
    expandPanel();
    renderShell();
    try {
      if (state.batchExcelMode === 'merge') {
        const fileName = buildExcelBatchFileName(items);
        const saveTarget = await chooseExcelSaveTarget(fileName);
        if (!saveTarget) {
          state.batchExcelStatus = L.excelSaveCanceled;
          return;
        }
        state.batchExcelStatus = '\u6b63\u5728\u5408\u5e76 ' + items.length + ' \u4e2a SKU \u5e76\u63d2\u5165\u4ea7\u54c1\u56fe';
        renderShell();
        const buffer = await buildExcelBatchMergedBuffer(items);
        await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
        markExcelBatchItemsDownloaded(items, fileName);
        recordExcelBatchItems(items, 'excel-batch-merge', fileName);
        state.batchExcelStatus = '\u5408\u5e76 Excel \u5df2\u4e0b\u8f7d\uff1a' + fileName;
        showToast('\u5df2\u4e0b\u8f7d\u5408\u5e76 Excel');
      } else {
        for (let index = 0; index < items.length; index += 1) {
          const item = items[index];
          const fileName = sanitizeExcelFileName(buildExcelFileName(item.data, item.extra));
          const saveTarget = await chooseExcelSaveTarget(fileName);
          if (!saveTarget) {
            state.batchExcelStatus = L.excelSaveCanceled;
            break;
          }
          state.batchExcelStatus = '\u6b63\u5728\u4e0b\u8f7d ' + (index + 1) + '/' + items.length + '\uff1a' + item.data.sku;
          renderShell();
          try {
            const buffer = await buildExcelBatchSingleBuffer(item);
            await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
            markExcelBatchItemsDownloaded([item], fileName);
            recordExcelBatchItems([item], 'excel-batch', fileName);
          } catch (error) {
            const message = formatExcelExportError(error);
            updateExcelBatchQueueEntry(item.data.sku, { status: 'error', error: message });
            state.batchExcelStatus = item.data.sku + ' \u4e0b\u8f7d\u5931\u8d25\uff1a' + message;
            addLog('error', 'Excel \u5355\u72ec\u4e0b\u8f7d\u5931\u8d25', item.data.sku + ' | ' + message);
          }
          if (state.view === 'batchExcel') renderShell();
          await wait(120);
        }
      }
    } catch (error) {
      const message = formatExcelExportError(error);
      state.batchExcelStatus = '\u6279\u91cf Excel \u751f\u6210\u5931\u8d25\uff1a' + message;
      addLog('error', '\u6279\u91cf Excel \u751f\u6210\u5931\u8d25', message);
      showToast(state.batchExcelStatus);
    } finally {
      state.batchExcelDownloadRunning = false;
      if (state.view === 'batchExcel') renderShell();
    }
  }

  function isExcelFileBusyError(error) {
    const name = String(error && error.name || '');
    const message = String(error && error.message || '');
    return name === 'InvalidStateError'
      || /state cached in an interface object|state had changed since/i.test(message);
  }

  function formatExcelExportError(error) {
    if (isExcelFileBusyError(error)) return L.excelFileBusy;
    return formatErrorMessage(error) || '\u672a\u77e5\u9519\u8bef';
  }

  function showExcelMissingToast() {
    showToast(L.excelMissing + state.excelMissing.join('\u3001'));
  }

  function clearExcelExportResultTimers() {
    window.clearTimeout(state.excelExportResultTimer);
    window.clearInterval(state.excelExportResultInterval);
    state.excelExportResultTimer = 0;
    state.excelExportResultInterval = 0;
  }

  function updateExcelExportResultCountdown(panel) {
    const result = state.excelExportResult;
    const countdown = panel && panel.querySelector('[data-excel-export-countdown]');
    if (!result || !countdown) return;
    countdown.textContent = String(Math.max(0, Math.ceil((Number(result.closesAt) - Date.now()) / 1000)));
  }

  function renderExcelExportResultModal(panel) {
    if (!panel) return;
    let layer = panel.querySelector('[data-excel-export-result-layer="1"]');
    const result = state.excelExportResult;
    if (!result) {
      if (layer) layer.remove();
      return;
    }
    const missing = Array.isArray(result.missing) ? result.missing.filter(Boolean) : [];
    const renderKey = [String(result.fileName || ''), String(result.sku || ''), missing.join('\u0001')].join('\u0002');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-notification-layer pfh-excel-export-result-layer pfh-xr-layer';
      layer.setAttribute('data-excel-export-result-layer', '1');
      layer.setAttribute('data-action', 'excel-export-result-close');
      panel.querySelector('.pfh-full').appendChild(layer);
    } else if (layer.dataset.xrRenderKey === renderKey && layer.querySelector('.pfh-xr-card')) {
      // 内容未变化时只刷新倒计时，避免面板重绘反复重建 DOM 造成闪烁与动画重放。
      layer.style.alignItems = 'center';
      layer.style.justifyContent = 'center';
      layer.style.padding = '24px';
      updateExcelExportResultCountdown(panel);
      return;
    }
    layer.dataset.xrRenderKey = renderKey;
    layer.style.alignItems = 'center';
    layer.style.justifyContent = 'center';
    layer.style.padding = '24px';
    const isOk = !missing.length;
    const statusBlock = isOk
      ? '<div class="pfh-xr-status is-ok"><span class="pfh-xr-status-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.6 9.6 17 20 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</span><div class="pfh-xr-status-copy"><strong>本次导出数据完整</strong><span>没有检测到缺失字段，可直接使用。</span></div></div>'
      : '<div class="pfh-xr-status is-warn"><span class="pfh-xr-status-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8.6v5.1" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><circle cx="12" cy="17.1" r="1.35" fill="currentColor"/></svg>' +
        '</span><div class="pfh-xr-status-copy"><strong>缺少 ' + missing.length + ' 项数据</strong><span>对应单元格已留空，不影响本次文件使用。</span></div>' +
        '<div class="pfh-xr-chips">' + missing.map((item) => '<span class="pfh-xr-chip">' + escapeHtml(item) + '</span>').join('') + '</div></div>';
    layer.innerHTML =
      '<style>' +
        '.pfh-xr-layer,.pfh-xr-layer *{box-sizing:border-box}' +
        '#plm-floating-helper .pfh-xr-layer.pfh-notification-layer,#plm-floating-helper[data-pfh-theme] .pfh-xr-layer.pfh-notification-layer{position:absolute;inset:0;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;border-radius:inherit;background:radial-gradient(120% 90% at 50% 0%,rgba(23,18,48,.28),rgba(15,12,32,.52))!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;animation:pfh-xr-fade .26s ease both}' +
        '.pfh-xr-card{position:relative;width:min(452px,calc(100% - 12px));max-height:calc(100% - 28px);overflow-x:hidden;overflow-y:auto;padding:30px 30px 24px;border-radius:24px;border:1px solid var(--pfh-theme-border,rgba(226,224,240,.9));background:linear-gradient(180deg,var(--pfh-theme-surface,#fff) 0%,var(--pfh-theme-surface-alt,#FBFAFF) 100%);box-shadow:0 30px 80px -24px rgba(31,20,70,.42),0 4px 14px -6px rgba(31,20,70,.16),inset 0 1px 0 rgba(255,255,255,.7);animation:pfh-xr-rise .42s cubic-bezier(.21,.9,.28,1) both;scrollbar-width:thin}' +
        '.pfh-xr-card::-webkit-scrollbar{width:6px}' +
        '.pfh-xr-card::-webkit-scrollbar-thumb{border-radius:999px;background:var(--pfh-theme-border-strong,rgba(120,120,150,.32))}' +
        '.pfh-xr-card::-webkit-scrollbar-track{background:transparent}' +
        '.pfh-xr-card::before{content:"";position:absolute;inset:0 0 auto;height:120px;border-radius:24px 24px 0 0;background:radial-gradient(90% 130% at 50% -30%,var(--pfh-theme-primary-soft,rgba(109,53,232,.14)),transparent 68%);pointer-events:none}' +
        '#plm-floating-helper .pfh-xr-close{position:absolute!important;top:14px!important;right:14px!important;z-index:2;display:grid!important;place-items:center!important;width:32px!important;min-width:32px!important;height:32px!important;min-height:32px!important;margin:0!important;padding:0!important;border:none!important;border-radius:50%!important;background:transparent!important;color:var(--pfh-theme-muted,#9aa0b0)!important;box-shadow:none!important;cursor:pointer;transition:background .18s ease,color .18s ease,transform .18s ease}' +
        '#plm-floating-helper .pfh-xr-close:hover:not(:disabled){background:var(--pfh-theme-soft,rgba(20,16,50,.06))!important;color:var(--pfh-theme-text,#1F2937)!important;transform:rotate(90deg)!important}' +
        '.pfh-xr-close svg{width:16px;height:16px}' +
        '.pfh-xr-hero{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px}' +
        '.pfh-xr-badge{position:relative;display:grid;place-items:center;width:70px;height:70px;border-radius:50%;background:linear-gradient(150deg,#3ddc97 0%,#12b981 52%,#0e9f6e 100%);box-shadow:0 14px 28px -10px rgba(15,150,105,.6),inset 0 2px 4px rgba(255,255,255,.45),inset 0 -4px 10px rgba(6,78,60,.28);animation:pfh-xr-pop .5s cubic-bezier(.2,1.25,.4,1) .06s both}' +
        '.pfh-xr-badge::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(18,185,129,.5);animation:pfh-xr-ring 1.9s ease-out .5s infinite}' +
        '.pfh-xr-badge svg{width:34px;height:34px;color:#fff;filter:drop-shadow(0 1px 1px rgba(4,66,48,.35))}' +
        '.pfh-xr-badge svg path{stroke-dasharray:23.5;stroke-dashoffset:23.5;animation:pfh-xr-draw .55s ease .28s forwards}' +
        '.pfh-xr-title{margin:16px 0 0;font-size:19px;font-weight:700;line-height:1.3;letter-spacing:.2px;color:var(--pfh-theme-text,#1F2937)}' +
        '.pfh-xr-sub{margin:0;font-size:12.5px;line-height:1.5;color:var(--pfh-theme-muted,#9aa0b0)}' +
        '.pfh-xr-sub b{font-weight:600;color:var(--pfh-theme-text,#1F2937);font-variant-numeric:tabular-nums}' +
        '.pfh-xr-body{margin-top:22px;display:flex;flex-direction:column;gap:14px}' +
        '.pfh-xr-file{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:15px;border:1px solid var(--pfh-theme-border,rgba(226,224,240,.95));background:var(--pfh-theme-card,rgba(248,248,253,.9));min-width:0}' +
        '.pfh-xr-file-icon{flex:0 0 auto;display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:linear-gradient(150deg,rgba(23,168,110,.16),rgba(23,168,110,.06));color:#0f9d64}' +
        '.pfh-xr-file-icon svg{width:20px;height:20px}' +
        '.pfh-xr-file-name{flex:1 1 auto;min-width:0;font-size:13.5px;line-height:1.5;font-weight:600;color:var(--pfh-theme-text,#1F2937);word-break:break-all;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
        '.pfh-xr-status{position:relative;display:flex;flex-wrap:wrap;align-items:flex-start;gap:11px;padding:14px 15px;border-radius:15px;font-size:13px;line-height:1.55;border:1px solid transparent}' +
        '.pfh-xr-status.is-ok{background:linear-gradient(180deg,rgba(16,185,129,.1),rgba(16,185,129,.045));border-color:rgba(16,185,129,.22);color:#0f7a52}' +
        '.pfh-xr-status.is-warn{background:linear-gradient(180deg,rgba(245,166,35,.12),rgba(245,166,35,.05));border-color:rgba(226,150,30,.28);color:#93591a}' +
        '.pfh-xr-status-icon{flex:0 0 auto;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;color:#fff}' +
        '.pfh-xr-status.is-ok .pfh-xr-status-icon{background:linear-gradient(150deg,#34d399,#0e9f6e);box-shadow:0 6px 14px -6px rgba(15,150,105,.7)}' +
        '.pfh-xr-status.is-warn .pfh-xr-status-icon{background:linear-gradient(150deg,#fbbf24,#e08600);box-shadow:0 6px 14px -6px rgba(200,120,10,.65)}' +
        '.pfh-xr-status-icon svg{width:15px;height:15px}' +
        '.pfh-xr-status-copy{display:flex;flex-direction:column;gap:2px;min-width:0}' +
        '.pfh-xr-status-copy strong{font-size:13.5px;font-weight:650}' +
        '.pfh-xr-status-copy span{opacity:.82}' +
        '.pfh-xr-chips{flex-basis:100%;display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}' +
        '.pfh-xr-chip{padding:4px 10px;border-radius:999px;border:1px solid rgba(226,150,30,.32);background:rgba(255,247,232,.9);font-size:12px;line-height:1.45;color:#8f4b16}' +
        '.pfh-xr-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;padding-top:14px;border-top:1px solid var(--pfh-theme-border,rgba(226,224,240,.9))}' +
        '.pfh-xr-sku{font-size:12px;letter-spacing:.3px;color:var(--pfh-theme-muted,#9aa0b0);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '#plm-floating-helper .pfh-xr-btn{flex:0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;height:38px!important;min-height:38px!important;padding:0 22px!important;border-radius:11px!important;border:1px solid transparent!important;background:linear-gradient(160deg,var(--pfh-theme-primary,#6d35e8),var(--pfh-theme-primary-hover,#5422c9))!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:13.5px!important;line-height:1!important;font-weight:600!important;cursor:pointer;box-shadow:0 10px 20px -10px rgba(84,34,201,.75)!important;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease}' +
        '#plm-floating-helper .pfh-xr-btn:hover:not(:disabled){background:linear-gradient(160deg,var(--pfh-theme-primary,#6d35e8),var(--pfh-theme-primary-hover,#5422c9))!important;border-color:transparent!important;color:#fff!important;transform:translateY(-1px)!important;filter:brightness(1.06);box-shadow:0 14px 24px -10px rgba(84,34,201,.8)!important}' +
        '#plm-floating-helper .pfh-xr-btn:active:not(:disabled){transform:translateY(0)!important;filter:brightness(.97)}' +
        '@keyframes pfh-xr-fade{from{opacity:0}to{opacity:1}}' +
        '@keyframes pfh-xr-rise{from{opacity:0;transform:translateY(16px) scale(.975)}to{opacity:1;transform:none}}' +
        '@keyframes pfh-xr-pop{0%{opacity:0;transform:scale(.55)}100%{opacity:1;transform:scale(1)}}' +
        '@keyframes pfh-xr-ring{0%{transform:scale(1);opacity:.7}70%{transform:scale(1.32);opacity:0}100%{transform:scale(1.32);opacity:0}}' +
        '@keyframes pfh-xr-draw{to{stroke-dashoffset:0}}' +
        '@media (max-width:520px){#plm-floating-helper .pfh-xr-layer.pfh-notification-layer{padding:14px!important}.pfh-xr-card{padding:24px 20px 20px;border-radius:20px}.pfh-xr-badge{width:60px;height:60px}.pfh-xr-badge svg{width:29px;height:29px}.pfh-xr-title{font-size:17.5px}}' +
        '@media (prefers-reduced-motion:reduce){.pfh-xr-layer,.pfh-xr-card,.pfh-xr-badge,.pfh-xr-badge::after{animation:none!important}.pfh-xr-badge svg path{stroke-dashoffset:0;animation:none!important}}' +
      '</style>' +
      '<section class="pfh-xr-card" role="dialog" aria-modal="true" aria-label="表格导出成功">' +
        '<button type="button" class="pfh-xr-close" data-action="excel-export-result-close" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<div class="pfh-xr-hero">' +
          '<span class="pfh-xr-badge"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.6 9.6 17 20 6.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
          '<h3 class="pfh-xr-title">表格导出成功</h3>' +
          '<p class="pfh-xr-sub"><b data-excel-export-countdown>0</b> 秒后自动关闭</p>' +
        '</div>' +
        '<div class="pfh-xr-body">' +
          '<div class="pfh-xr-file"><span class="pfh-xr-file-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 3h7.2L18.5 8v12.2a.8.8 0 0 1-.8.8H6.5a.8.8 0 0 1-.8-.8V3.8A.8.8 0 0 1 6.5 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.4 3.2V8.2h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.2 12.6l4.4 4.6M13.6 12.6l-4.4 4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><span class="pfh-xr-file-name">' + escapeHtml(result.fileName || 'Excel 文件') + '</span></div>' +
          statusBlock +
          '<div class="pfh-xr-foot"><span class="pfh-xr-sku">' + escapeHtml(result.sku || '') + '</span><button type="button" class="pfh-xr-btn" data-action="excel-export-result-close">关闭</button></div>' +
        '</div>' +
      '</section>';
    updateExcelExportResultCountdown(panel);
  }

  function closeExcelExportResultModal() {
    clearExcelExportResultTimers();
    state.excelExportResult = null;
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('[data-excel-export-result-layer="1"]');
    if (layer) layer.remove();
  }

  function showExcelExportResultModal(result) {
    closeExcelExportResultModal();
    const duration = 7000;
    state.excelExportResult = {
      fileName: String(result && result.fileName || ''),
      sku: String(result && result.sku || ''),
      missing: Array.isArray(result && result.missing) ? result.missing.filter(Boolean) : [],
      closesAt: Date.now() + duration,
    };
    const panel = ensurePanel();
    renderExcelExportResultModal(panel);
    state.excelExportResultInterval = window.setInterval(() => updateExcelExportResultCountdown(panel), 250);
    state.excelExportResultTimer = window.setTimeout(() => closeExcelExportResultModal(), duration);
  }

  async function generateExcelFromCurrent() {
    let generationToastToken = 0;
    const data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    try {
      await ensureExcelJsLoaded();
    } catch (error) {
      showToast(formatErrorMessage(error) || L.excelNeedLibrary);
      return;
    }
    if (!await ensureExcelTemplateLoaded()) {
      showToast('Excel \u6a21\u677f\u5c1a\u672a\u7f13\u5b58\uff0c\u8bf7\u8054\u7f51\u540e\u91cd\u8bd5');
      return;
    }
    syncExcelInputs();
    const purchasePrice = state.excelPurchasePrice === '' ? '6' : state.excelPurchasePrice;
    let exportSnapshot = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku
      ? state.excelExtra
      : null;
    if (!exportSnapshot) {
      addLog('info', '生成 Excel 使用当前缓存并后台补全', data.sku + ' | 当前没有匹配的表格数据快照');
      prepareExcelInfo().catch((error) => {
        addLog('warn', 'Excel 后台补全失败', data.sku + ' | ' + formatErrorMessage(error));
      });
      exportSnapshot = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku
        ? state.excelExtra
        : null;
    }
    if (!exportSnapshot) {
      state.excelStatus = '\ud83d\udd34 \u8868\u683c\u6570\u636e\u51c6\u5907\u5931\u8d25';
      renderShell();
      showToast(state.excelStatus);
      return;
    }
    const extra = exportSnapshot.extra || buildCachedExcelExtraData(data);
    const excelData = normalizeData(exportSnapshot.excelData || data);
    const exportMissing = getExcelMissingFields(excelData, extra);
    state.excelMissing = exportMissing;
    if (exportMissing.length) {
      state.excelStatus = formatExcelMissingStatus(exportMissing);
      addLog('warn', 'Excel 将使用不完整数据立即生成', data.sku + ' | 缺少：' + exportMissing.join('、'));
      renderShell();
    }
    try {
      const Excel = await ensureExcelJsLoaded();
      const packQty = normalizePackQty(getLocalPackQty(excelData));
      state.excelPackQty = packQty;
      if (!packQty) {
        addLog('warn', 'Excel 缺少装箱数，继续生成', excelData.sku + ' | 装箱数单元格留空');
      }
      const fileName = sanitizeExcelFileName(buildExcelFileName(excelData, extra));
      const saveTarget = await chooseExcelSaveTarget(fileName);
      if (!saveTarget) {
        state.excelStatus = L.excelSaveCanceled;
        renderShell();
        showToast(L.excelSaveCanceled);
        return;
      }
      generationToastToken = showToast(L.excelGenerating, { tone: 'info' });
      const workbook = await loadCloudExcelTemplateWorkbook(Excel);
      const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
      state.excelStatus = L.excelImageLoading;
      renderShell();
      const excelImageSource = getExcelImageSource(excelData, extra);
      const imageInfo = excelImageSource.imageUrl ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper image fetch failed:', error);
        return null;
      }) : null;
      cacheProductThumb(data, extra);

      setCell(sheet, 'A4', buildExcelKeyword(excelData, extra));
      setCell(sheet, 'B4', excelData.name || extra.chineseName || '');
      setCell(sheet, 'C4', '');
      setCell(sheet, 'E4', compactText(packQty));
      sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'N');
      setCell(sheet, 'G4', excelData.sku || '');
      if (excelData.singleBottle) setCell(sheet, 'H4', '\u74f6\u88c5');
      else sheet.getCell('H4').value = { formula: 'IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"\u76d2\u88c5",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"\u888b\u88c5",""))' };
      setCell(sheet, 'I4', buildExcelProductSizeWithAccessories(excelData));
      setCell(sheet, 'J4', formatExcelDimFromParts([excelData.packageLength, excelData.packageWidth, excelData.packageHeight]) || formatExcelDim(excelData.packageNums, []));
      setCell(sheet, 'L4', formatIngredientsForExcel(extra.ingredients));
      setCell(sheet, 'M4', buildExcelSpecificationWithAccessories(excelData));
      if (normalizeAccessories(excelData.accessories).length) setCell(sheet, 'M3', '规格');
      setCell(sheet, 'N4', normalizeExcelUnit(excelData.grossWeight));
      setCell(sheet, 'O4', normalizeExcelNumberOrText(purchasePrice));
      setCell(sheet, 'P4', getReturnDateText(7));
      setCell(sheet, 'S4', extra.benchmarkLink || '');

      if (shouldOmitToyProductSize(excelData)) {
        sheet.spliceColumns(9, 1);
        sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"\u76d2\u88c5",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"\u888b\u88c5",""))' };
        sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
        sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","\u51c0\u91cd",IF(RIGHT(L4,2)="ml","\u5bb9\u91cf","\u89c4\u683c"))' };
      } else if (shouldRemoveExcelPackageSizeColumn(excelData)) {
        sheet.spliceColumns(10, 1);
        sheet.getCell('F4').value = buildExcelBatchWeightFormula(4, 'M');
        sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="g","净重",IF(RIGHT(L4,2)="ml","容量","规格"))' };
      }

      if (imageInfo) {
        state.excelStatus = L.excelPacking;
        renderShell();
        const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
        sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
      }
      applyExcelTraceWatermark(workbook);
      const buffer = await workbook.xlsx.writeBuffer();
      state.excelStatus = L.excelDownloading + ' ' + fileName;
      renderShell();
      console.info('PLM floating helper Excel filename:', fileName);
      await saveExcelBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName, saveTarget);
      dismissToast(generationToastToken);
      syncInsightEvent('excel_generated', { sku: excelData.sku || '', name: excelData.name || '', source: 'excel-generation' });
      recordCommerceInsight(excelData, extra, {
        price: purchasePrice,
        packQty,
        source: 'excel',
        fileName,
      });
      upsertDailyLedgerFromData(excelData, { status: '制作中', stage: '表格/上传处理中', note: '已生成 Excel' });
      state.excelStatus = exportMissing.length
        ? L.excelDone + '（缺失字段已留空）'
        : L.excelDone;
      renderShell();
      showExcelExportResultModal({
        fileName,
        sku: excelData.sku,
        missing: exportMissing,
      });
    } catch (error) {
      console.warn('PLM floating helper excel failed:', error);
      const message = formatExcelExportError(error);
      state.excelStatus = L.excelFailed + '：' + message;
      addLog('error', 'Excel 生成失败', data.sku + ' | ' + message);
      renderShell();
      showToast(state.excelStatus);
    } finally {
      dismissToast(generationToastToken);
    }
  }

  async function generateToyLabelFromCurrent(options) {
    const opts = options || {};
    let data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
    if (!data || !data.sku) {
      showToast(L.excelNeedData);
      return;
    }
    syncExcelInputs();
    try {
      if (!opts.skipExcelPrepare && (!state.excelExtra || !state.excelExtra.excelData || state.excelExtra.excelData.sku !== data.sku)) {
        await prepareExcelInfo();
        data = normalizeData(state.data || (state.selectedSku ? loadData(state.selectedSku) : null));
      }
      const matchingExcel = state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === data.sku ? state.excelExtra : null;
      let extra = matchingExcel && matchingExcel.extra ? matchingExcel.extra : {};
      let labelData = normalizeData((matchingExcel && matchingExcel.excelData) || data);
      state.excelStatus = L.labelGenerating;
      renderShell();
      showToast(L.labelGenerating);

      const ensuredImage = await ensureToyLabelProductImage(labelData, extra);
      labelData = ensuredImage.data;
      extra = ensuredImage.extra;
      const imageSource = ensuredImage.imageSource;
      const productImage = imageSource.imageUrl ? await fetchImageForExcel(imageSource.imageUrl, imageSource.imageFallbackUrl).catch((error) => {
        console.warn('PLM floating helper label product image fetch failed:', error);
        addLog('error', '\u73a9\u5177\u6807\u7b7e\uff1a\u4ea7\u54c1\u56fe\u83b7\u53d6\u5931\u8d25', error && error.message ? error.message : '');
        return null;
      }) : null;
      if (!productImage || !productImage.dataUrl) {
        throw new Error('\u672a\u80fd\u8bfb\u53d6 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u53ea\u5269\u6761\u7801\u7684\u6807\u7b7e\u8bf4\u660e\u56fe');
      }
      const barcodeImage = await getBarcodeForToyLabel(labelData.sku);
      const size = getToyLabelSizeCm(labelData);
      const printCanvas = await renderToyLabelPrintCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        productImage,
        barcodeImage,
      });
      const previewCanvas = await renderToyLabelPreviewCanvas({
        sku: labelData.sku,
        widthCm: size.width,
        heightCm: size.height,
        printCanvas,
      });
      const baseName = cleanFileNamePart([labelData.brand, labelData.name, labelData.sku].filter(Boolean).join(' ')) || labelData.sku;
      const sizeName = trimCm(size.width) + 'x' + trimCm(size.height) + 'cm';
      const previewBlob = await canvasToBlob(previewCanvas, 'image/jpeg', 0.95);
      const printBlob = await canvasToBlob(printCanvas, 'image/jpeg', 0.95);
      const psdBlob = canvasToFlatPsdBlob(printCanvas, printCanvas.width / ((Number(size.width) || 4) * CM_TO_INCH));
      const previewFilename = baseName + ' \u6807\u7b7e\u8bf4\u660e\u56fe.jpg';
      const printFilename = baseName + ' \u6807\u7b7e\u5370\u5237' + sizeName + '.jpg';
      const materialCode = cleanFileNamePart(labelData.printCode || '');
      const productName = cleanFileNamePart([labelData.brand, labelData.name].filter(Boolean).join('')) || labelData.sku;
      const psdFilename = '\u6807\u7b7e \uff08' + sizeName + '\uff09' + [materialCode, productName].filter(Boolean).join(' ') + '.psd';
      if (Array.isArray(opts.collectFiles)) {
        const generatedFiles = [
          { sku: labelData.sku, filename: previewFilename, blob: previewBlob },
          { sku: labelData.sku, filename: printFilename, blob: printBlob },
          { sku: labelData.sku, filename: psdFilename, blob: psdBlob }
        ];
        opts.collectFiles.push(...generatedFiles);
        await stageToyLabelBatchFiles(generatedFiles, opts.batchSignature || state.toyLabelBatchPreparedSignature);
      } else {
        downloadBlob(previewBlob, previewFilename);
        await wait(250);
        downloadBlob(printBlob, printFilename);
        await wait(250);
        downloadBlob(psdBlob, psdFilename);
      }
      if (!opts.skipBomUpload) await uploadToyLabelPreviewToBom(labelData, previewBlob, previewFilename, opts);
      state.excelStatus = L.labelDone;
      upsertDailyLedgerFromData(labelData, { status: '制作中', stage: '图包/标签/纸盒处理中', note: '已生成玩具标签', labelFileState: 'done', labelFileDone: true });
      renderShell();
      addLog('success', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u6210\u529f', labelData.sku);
      showToast(L.labelDone);
      return true;
    } catch (error) {
      console.warn('PLM floating helper label failed:', error);
      state.excelStatus = L.labelFailed;
      renderShell();
      addLog('error', '\u73a9\u5177\u6807\u7b7e\u751f\u6210\u5931\u8d25', error && error.message ? error.message : '');
      showToast(L.labelFailed);
      return false;
    }
  }

  async function uploadToyLabelPreviewToBom(data, blob, filename, options) {
    const sku = data && data.sku;
    if (!sku) throw new Error('\u672a\u627e\u5230 SKU\uff0c\u65e0\u6cd5\u4e0a\u4f20\u5230\u7ed1BOM');
    addLog('info', '\u73a9\u5177\u6807\u7b7e\uff1a\u51c6\u5907\u4e0a\u4f20\u8bf4\u660e\u56fe\u5230\u7ed1BOM', sku);
    const drawer = await ensureProjectBomDrawerForData(data, options);
    if (!drawer) throw new Error('\u672a\u6253\u5f00\u5f53\u524d\u7f16\u7801\u7684\u7ed1BOM\u62bd\u5c49');
    const uploadItem = await waitUntil(() => findBomLabelUploadItem(drawer), 12000, 250);
    if (!uploadItem) throw new Error('\u672a\u627e\u5230\u7ed1BOM\u4e2d\u6807\u7b7e\u884c\u7684\u4e0a\u4f20\u52a0\u53f7');
    uploadItem.scrollIntoView({ block: 'center', inline: 'nearest' });
    await wait(180);
    await putFileIntoUploadItem(uploadItem, blob, filename);
    await waitUploadItemDone(uploadItem, filename, 180000);
    await wait(1600);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u8bf4\u660e\u56fe\u5df2\u4e0a\u4f20\u5230\u7ed1BOM\u6807\u7b7e', filename);
    await saveProjectBomDrawer(drawer);
    await closeProjectBomDrawer(drawer);
    addLog('success', '\u73a9\u5177\u6807\u7b7e\uff1a\u7ed1BOM\u5df2\u6279\u91cf\u4fdd\u5b58\u5e76\u5173\u95ed', sku);
  }

  function getToyLabelSizeCm(data) {
    return { width: 4, height: 3 };
  }

  function getToyLabelImageSource(data, extra) {
    const batchImageUrl = data && (data.toyLabelProductImageUrl || data.toyLabelProductImageFallbackUrl || data.productListImageUrl || data.productListImageFallbackUrl);
    if (batchImageUrl) {
      return {
        imageUrl: data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
        imageFallbackUrl: data.toyLabelProductImageFallbackUrl || data.productListImageFallbackUrl || data.toyLabelProductImageUrl || data.productListImageUrl || batchImageUrl,
      };
    }
    const source = getExcelImageSource(data, extra);
    const imageUrl = stripOssResizeParams(source.imageUrl || source.imageFallbackUrl || '');
    const imageFallbackUrl = stripOssResizeParams(source.imageFallbackUrl || '');
    return {
      imageUrl: imageUrl || source.imageUrl || '',
      imageFallbackUrl: imageFallbackUrl || imageUrl || source.imageFallbackUrl || '',
    };
  }

  async function getBarcodeForToyLabel(sku) {
    return { canvas: renderCode128Barcode(sku, 980, 260), source: 'generated-code128b' };
  }

  async function ensureToyLabelProductImage(data, extra) {
    const cachedSource = getToyLabelImageSource(data, extra);
    if (cachedSource.imageUrl || cachedSource.imageFallbackUrl) {
      return { data, extra, imageSource: cachedSource };
    }
    if (!(await ensureProjectDrawerForData(data))) {
      throw new Error('\u672a\u6253\u5f00\u5f53\u524d SKU \u7684\u9879\u76ee\u8be6\u60c5\uff0c\u65e0\u6cd5\u8bfb\u53d6\u6548\u679c\u56fe');
    }
    const drawer = getProjectDrawerForSku(data.sku) || getProjectDrawer();
    const imageInfo = drawer ? await collectProductImageInfo(drawer, {
      sku: data.sku,
      allowPreview: true,
      restoreTab: true,
      productInfoTimeout: 4500,
    }) : { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageUrl = imageInfo.isSkuDesignImage && (imageInfo.imageUrl || imageInfo.imageFallbackUrl);
    if (!imageUrl) {
      throw new Error('\u672a\u627e\u5230 SKU \u6548\u679c\u56fe\uff0c\u5df2\u505c\u6b62\u751f\u6210\u548c\u4e0a\u4f20\uff0c\u907f\u514d\u4e0a\u4f20\u7a7a\u767d\u6807\u7b7e\u8bf4\u660e\u56fe');
    }
    const imageExtra = {
      ...(extra || {}),
      ...imageInfo,
      imageUrl: imageInfo.imageUrl || imageUrl,
      imageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      skuImageUrl: imageInfo.imageUrl || imageUrl,
      skuImageFallbackUrl: imageInfo.imageFallbackUrl || imageUrl,
      isSkuDesignImage: true,
    };
    const imageData = normalizeData({
      ...data,
      skuImageUrl: imageExtra.skuImageUrl,
      skuImageFallbackUrl: imageExtra.skuImageFallbackUrl,
      skuImageSource: 'effectImage',
    });
    cacheProductThumb(imageData, imageExtra);
    if (state.excelExtra && state.excelExtra.excelData && state.excelExtra.excelData.sku === imageData.sku) {
      state.excelExtra = { extra: imageExtra, excelData: imageData };
    }
    return { data: imageData, extra: imageExtra, imageSource: getToyLabelImageSource(imageData, imageExtra) };
  }

  async function getPlmBarcodePreviewImage(sku) {
    stopScan();
    cancelDrawerTabFlow();
    const drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    if (!drawer) return null;
    const token = beginForegroundDrawerTabFlow(sku, drawer);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 4500 }))) return null;
      await waitForDrawerText(drawer, '\u6761\u7801\u6587\u4ef6', 1600);
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) return null;
      const label = Array.from(drawer.querySelectorAll('label, .ant-form-item-label, .ant-form-item-no-colon'))
        .filter(isVisibleElement)
        .find((el) => compactText(el.innerText || el.textContent) === '\u6761\u7801\u6587\u4ef6');
      const item = label && label.closest('.ant-form-item');
      if (!item) return null;
      const img = Array.from(item.querySelectorAll('img'))
        .filter(isVisibleElement)
        .find((el) => {
          const src = el.currentSrc || el.src || '';
          return src && !/filePic\/pdf\.png/i.test(src) && !/filePic\/image\.png/i.test(src);
        });
      if (!img) return null;
      return { dataUrl: img.currentSrc || img.src || '', source: 'plm-preview' };
    } finally {
      finishForegroundDrawerTabFlow(token);
    }
  }

  async function renderToyLabelPrintCanvas(options) {
    const width = Math.round((Number(options.widthCm) || 4) * 300);
    const height = Math.round((Number(options.heightCm) || 3) * 300);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const productBox = { x: width * 0.18, y: height * 0.11, w: width * 0.64, h: height * 0.39 };
    if (options.productImage && options.productImage.dataUrl) {
      const image = await loadImage(options.productImage.dataUrl);
      drawImageContained(ctx, trimImageWhitespace(image), productBox.x, productBox.y, productBox.w, productBox.h);
    }

    const barcodeBox = { x: width * 0.13, y: height * 0.62, w: width * 0.74, h: height * 0.17 };
    const barcode = options.barcodeImage && options.barcodeImage.canvas
      ? options.barcodeImage.canvas
      : options.barcodeImage && options.barcodeImage.dataUrl
        ? await loadImage(options.barcodeImage.dataUrl)
        : renderCode128Barcode(options.sku, 900, 210);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(barcode, barcodeBox.x, barcodeBox.y, barcodeBox.w, barcodeBox.h);
    ctx.imageSmoothingEnabled = true;

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '400 ' + Math.round(height * 0.052) + 'px Arial, sans-serif';
    ctx.fillText(options.sku || '', width / 2, height * 0.86);
    return canvas;
  }

  async function renderToyLabelPreviewCanvas(options) {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 3000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '400 88px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u6807\u7b7e', 640, 300);
    ctx.font = '400 90px Arial, "Microsoft YaHei", "Microsoft YaHei UI", sans-serif';
    ctx.fillText('\u89c4\u683c\u5c3a\u5bf8\uff1a  \u5bbd' + trimCm(options.widthCm) + 'X\u9ad8' + trimCm(options.heightCm) + 'CM', 640, 455);

    const labelX = 585;
    const labelY = 958;
    const labelW = 1888;
    const labelH = Math.round(labelW * (Number(options.heightCm) || 3) / (Number(options.widthCm) || 4));
    ctx.strokeStyle = '#9f9f9f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(labelX, labelY, labelW, labelH);
    ctx.drawImage(options.printCanvas, labelX + 2, labelY + 2, labelW - 4, labelH - 4);
    drawDimensionGuide(ctx, labelX, labelY, labelW, labelH, options.widthCm, options.heightCm);
    return canvas;
  }

  function drawDimensionGuide(ctx, x, y, w, h, widthCm, heightCm) {
    ctx.save();
    ctx.strokeStyle = '#ef1f24';
    ctx.fillStyle = '#ef1f24';
    ctx.lineWidth = 4;
    const leftX = x - 70;
    const bottomY = y + h + 62;
    drawLineWithTicks(ctx, leftX, y, leftX, y + h, 28, true);
    drawLineWithTicks(ctx, x, bottomY, x + w, bottomY, 28, false);
    ctx.font = '700 86px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(leftX - 78, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(trimCm(heightCm) + 'cm', 0, 0);
    ctx.restore();
    ctx.fillText(trimCm(widthCm) + 'cm', x + w / 2, bottomY + 86);
    ctx.restore();
  }

  function drawLineWithTicks(ctx, x1, y1, x2, y2, tick, vertical) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x1 - tick / 2, y1);
      ctx.lineTo(x1 + tick / 2, y1);
      ctx.moveTo(x2 - tick / 2, y2);
      ctx.lineTo(x2 + tick / 2, y2);
    } else {
      ctx.moveTo(x1, y1 - tick / 2);
      ctx.lineTo(x1, y1 + tick / 2);
      ctx.moveTo(x2, y2 - tick / 2);
      ctx.lineTo(x2, y2 + tick / 2);
    }
    ctx.stroke();
  }

  function trimCm(value) {
    const num = Number(value);
    return Number.isFinite(num) ? String(Number(num.toFixed(2))).replace(/\.0$/, '') : String(value || '');
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawImageContained(ctx, image, x, y, w, h) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const ratio = Math.min(w / iw, h / ih);
    const dw = iw * ratio;
    const dh = ih * ratio;
    ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  function trimImageWhitespace(image) {
    const iw = image.naturalWidth || image.width || 1;
    const ih = image.naturalHeight || image.height || 1;
    const canvas = document.createElement('canvas');
    canvas.width = iw;
    canvas.height = ih;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, iw, ih).data;
    let minX = iw;
    let minY = ih;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < ih; y += 1) {
      for (let x = 0; x < iw; x += 1) {
        const index = (y * iw + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
        if (a > 12 && !(r > 245 && g > 245 && b > 245)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return image;
    const pad = Math.round(Math.max(iw, ih) * 0.02);
    const sx = Math.max(0, minX - pad);
    const sy = Math.max(0, minY - pad);
    const sw = Math.min(iw - sx, maxX - minX + 1 + pad * 2);
    const sh = Math.min(ih - sy, maxY - minY + 1 + pad * 2);
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out;
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('canvas export failed')), type || 'image/png', quality);
    });
  }

  function renderCode128Barcode(text, width, height) {
    const patterns = [
      '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'
    ];
    const value = String(text || '').replace(/[^\x20-\x7f]/g, '');
    const codes = [104];
    for (let i = 0; i < value.length; i += 1) codes.push(value.charCodeAt(i) - 32);
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
    codes.push(checksum % 103, 106);
    const quiet = 10;
    const modules = codes.reduce((sum, code) => sum + patterns[code].split('').reduce((a, n) => a + Number(n), 0), quiet * 2);
    const moduleWidth = width / modules;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    let x = quiet * moduleWidth;
    codes.forEach((code) => {
      const pattern = patterns[code];
      for (let i = 0; i < pattern.length; i += 1) {
        const w = Number(pattern[i]) * moduleWidth;
        if (i % 2 === 0) ctx.fillRect(Math.round(x), 0, Math.ceil(w), height);
        x += w;
      }
    });
    return canvas;
  }

  function canvasToFlatPsdBlob(canvas, dpi) {
    const width = canvas.width;
    const height = canvas.height;
    const resolution = Math.max(72, Math.round(Number(dpi) || 300));
    const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const pixelCount = width * height;
    const resolutionResourceLength = 28;
    const size = 26 + 4 + 4 + resolutionResourceLength + 4 + 2 + pixelCount * 3;
    const bytes = new Uint8Array(size);
    let offset = 0;
    const writeText = (value) => {
      for (let i = 0; i < value.length; i += 1) bytes[offset++] = value.charCodeAt(i);
    };
    const write16 = (value) => {
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    const write32 = (value) => {
      bytes[offset++] = (value >> 24) & 255;
      bytes[offset++] = (value >> 16) & 255;
      bytes[offset++] = (value >> 8) & 255;
      bytes[offset++] = value & 255;
    };
    writeText('8BPS');
    write16(1);
    offset += 6;
    write16(3);
    write32(height);
    write32(width);
    write16(8);
    write16(3);
    write32(0);
    write32(resolutionResourceLength);
    writeText('8BIM');
    write16(1005);
    write16(0);
    write32(16);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(resolution * 65536);
    write16(1);
    write16(1);
    write32(0);
    write16(0);
    for (let channel = 0; channel < 3; channel += 1) {
      for (let i = 0; i < pixelCount; i += 1) bytes[offset++] = rgba[i * 4 + channel];
    }
    return new Blob([bytes], { type: 'image/vnd.adobe.photoshop' });
  }

  function setCell(sheet, address, value) {
    sheet.getCell(address).value = value;
    if (/^[IM]\d+$/.test(address) && typeof value === 'string' && value.includes('\n')) {
      const cell = sheet.getCell(address);
      cell.alignment = { ...(cell.alignment || {}), wrapText: true };
      const row = sheet.getRow(Number(address.match(/\d+$/)[0]));
      row.height = Math.max(Number(row.height) || 0, value.split('\n').length * 18 + 20);
    }
  }

  function getExcelImageSource(data, extra) {
    const extraImageUrl = extra && extra.isSkuDesignImage && (extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl);
    if (extraImageUrl) {
      return { imageUrl: extra.skuImageUrl || extra.imageUrl || extraImageUrl, imageFallbackUrl: extra.skuImageFallbackUrl || extra.imageFallbackUrl || extraImageUrl };
    }
    const skuImageUrl = data && /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') && (data.skuImageUrl || data.skuImageFallbackUrl);
    if (skuImageUrl) {
      return { imageUrl: data.skuImageUrl || skuImageUrl, imageFallbackUrl: data.skuImageFallbackUrl || data.skuImageUrl || skuImageUrl };
    }
    const productListImageUrl = data && (data.productListImageUrl || data.productListImageFallbackUrl);
    if (productListImageUrl) {
      return {
        imageUrl: data.productListImageUrl || productListImageUrl,
        imageFallbackUrl: data.productListImageFallbackUrl || data.productListImageUrl || productListImageUrl,
      };
    }
    return { imageUrl: '', imageFallbackUrl: '' };
  }

  function getPreferredExcelIngredients(data) {
    const cached = normalizeData(data || {});
    if (cached.copywritingIngredientSplit && cached.copywritingIngredientChinese) return cached.copywritingIngredientChinese;
    return cached.ingredientChinese
      || cached.copywritingIngredientChinese
      || cached.ingredientEnglish
      || cached.copywritingIngredientEnglish
      || '';
  }

  function buildExcelExtraFromApi(data, apiResult, previous) {
    const cached = buildCachedExcelExtraData(data);
    const result = apiResult || {};
    const imageUrl = result.imageUrl || cached.imageUrl || '';
    const imageFallbackUrl = result.imageFallbackUrl || cached.imageFallbackUrl || imageUrl;
    return {
      ...cached,
      englishName: result.englishName || cached.englishName || '',
      chineseName: result.chineseName || cached.chineseName || '',
      ingredients: getPreferredExcelIngredients(data) || (previous && previous.ingredients) || '',
      benchmarkLink: result.benchmarkLink || cached.benchmarkLink || '',
      imageUrl,
      imageFallbackUrl,
      skuImageUrl: result.skuImageUrl || cached.skuImageUrl || imageUrl,
      skuImageFallbackUrl: result.skuImageFallbackUrl || cached.skuImageFallbackUrl || imageFallbackUrl,
      skuImageSource: result.skuImageSource || cached.skuImageSource || '',
      isSkuDesignImage: Boolean(result.isSkuDesignImage || cached.isSkuDesignImage || imageUrl),
      apiResolved: Boolean(result.apiResolved),
      apiFieldStates: normalizeApiFieldStates(result.apiFieldStates || data && data.apiFieldStates),
      liveData: data,
    };
  }

  async function collectExcelExtraData(sku, options) {
    const opts = options || {};
    stopScan();
    cancelDrawerTabFlow();
    let drawer = sku ? getProjectDrawerForSku(sku) : getProjectDrawer();
    const cachedData = normalizeData((state.data && state.data.sku === sku ? state.data : null) || loadData(sku) || {});
    let apiLiveData = cachedData;
    let extra = buildCachedExcelExtraData(cachedData);
    try {
      const apiResult = await fetchApiExcelData(cachedData, { force: Boolean(opts.force) });
      if (apiResult && apiResult.found) {
        apiLiveData = normalizeData(apiResult.data || cachedData);
        if (apiResult.ingredientFile && (!apiLiveData.ingredientEnglish || !apiLiveData.ingredientChinese || apiLiveData.ingredientPdfFileName !== apiResult.ingredientFile.fileName)) {
          await hydrateIngredientPdfForSku(sku, { silent: true, drawer, apiFile: apiResult.ingredientFile });
          apiLiveData = normalizeData(loadData(sku) || apiLiveData);
        }
        extra = buildExcelExtraFromApi(apiLiveData, apiResult, extra);
        extra.liveData = apiLiveData;
        saveData(sku, apiLiveData, { suppressDataQuality: true, changeSource: 'Excel PLM 数据同步' });
        if (state.selectedSku === sku) state.data = apiLiveData;
        const apiMissing = getExcelMissingFields(apiLiveData, extra);
        addLog(apiMissing.length ? 'info' : 'success', 'Excel PLM 数据补全结果', sku + ' | ' + (apiMissing.length ? '仍缺：' + apiMissing.join('、') : '已取得生成所需字段'));
        if (!getExcelDrawerFallbackMissingFields(apiLiveData, extra).length) return extra;
      }
    } catch (error) {
      addLog('warn', 'Excel PLM 数据补全异常，改用现有页面读取', sku + ' | ' + formatErrorMessage(error));
    }
    if (!drawer) return extra;
    drawer = await waitForExcelProjectDrawerReady(sku, 12000) || drawer;
    const token = beginForegroundDrawerTabFlow(sku, drawer);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 12000 }))) throw new Error('\u4ea7\u54c1\u4fe1\u606f\u9875\u7b7e\u672a\u52a0\u8f7d\u5b8c\u6210');
      let liveData = mergeData(apiLiveData, extractData(drawer, { forceSkuImage: true }));
      if (!liveData.grossWeight && !isApiFieldResolved(liveData, 'grossWeight')) {
        await waitFor(() => getGrossWeightValue(drawer), 2600, 120);
        liveData = mergeData(liveData, extractData(drawer, { forceSkuImage: true }));
      }
      const packageReady = Boolean(liveData.packageSizeText || (liveData.packageLength && liveData.packageWidth && liveData.packageHeight));
      const materialNeedsRead = (!liveData.seenMaterial && !isApiFieldResolved(liveData, 'material'))
        || (!liveData.singleBottle && !packageReady && !isApiFieldResolved(liveData, 'packageSize'))
        || (!liveData.printSizeText && !isApiFieldResolved(liveData, 'printSize'))
        || (!liveData.netContent && !isApiFieldResolved(liveData, 'netContent'));
      if (materialNeedsRead) {
        if (!(await switchDrawerTab(drawer, L.materialTab, { flowToken: token, timeout: 12000 }))) throw new Error('\u7269\u6599\u6e05\u5355\u9875\u7b7e\u672a\u52a0\u8f7d\u5b8c\u6210');
        let materialData = extractData(drawer);
        if (!materialData.seenMaterial) {
          await waitFor(() => {
            materialData = extractData(drawer);
            return materialData.seenMaterial;
          }, 3500, 120);
        }
        if (!materialData.seenMaterial) throw new Error('\u7269\u6599\u6e05\u5355\u5185\u5bb9\u672a\u52a0\u8f7d\u5b8c\u6210');
        liveData = mergeData(liveData, materialData);
      }
      extra.liveData = liveData;
      if (liveData.sku === sku) {
        const refreshed = mergeData(cachedData, liveData);
        saveData(sku, refreshed, { suppressDataQuality: true });
        if (state.selectedSku === sku) state.data = refreshed;
      }
      let ingredientData = normalizeData(loadData(sku) || cachedData);
      let copywritingRecord = normalizeCopywritingRecord(ingredientData.copywriting);
      if (!copywritingRecord || copywritingRecord.parserVersion !== COPYWRITING_PARSER_VERSION) {
        if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 25000, 200);
        ingredientData = normalizeData(loadData(sku) || ingredientData);
        copywritingRecord = normalizeCopywritingRecord(ingredientData.copywriting);
        if (!copywritingRecord || copywritingRecord.parserVersion !== COPYWRITING_PARSER_VERSION) {
          ingredientData = await hydrateCopywritingForSku(sku, { silent: true, drawer });
        }
      }
      if (!ingredientData.ingredientEnglish || !ingredientData.ingredientChinese) {
        if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
        else ingredientData = await hydrateIngredientPdfForSku(sku, { silent: true, drawer });
        ingredientData = normalizeData(loadData(sku) || ingredientData);
      }
      extra.ingredientEnglish = ingredientData.ingredientEnglish || extra.ingredientEnglish;
      extra.ingredientChinese = ingredientData.ingredientChinese || extra.ingredientChinese;
      const productText = getVisibleText(drawer);
      const previewImageInfo = await collectProductImageInfo(drawer, {
        sku,
        includeBenchmark: false,
        allowPreview: true,
        restoreTab: false,
        productInfoTimeout: 4500,
        flowToken: token,
      });
      const resolvedImageInfo = previewImageInfo && previewImageInfo.isSkuDesignImage ? previewImageInfo : getCachedSkuImageInfo(sku);
      if (!isDrawerProductFlowCurrent(sku, token, drawer)) {
        const error = new Error('\u7528\u6237\u5df2\u5207\u6362\u9875\u7b7e\uff0cExcel \u8865\u5145\u8bfb\u53d6\u5df2\u53d6\u6d88');
        error.name = 'AbortError';
        throw error;
      }
      Object.assign(extra, {
        englishName: cleanEnglishProductName(extractLineAfter(productText, 'PRODUCT NAME'), cachedData.brand) || extra.englishName,
        chineseName: extractLineAfter(productText, '\u5546\u54c1\u540d\u79f0') || extra.chineseName,
        ingredients: getPreferredExcelIngredients(ingredientData) || extra.ingredients || extractNamedField(productText, '\u6210\u5206') || extractNamedField(productText, '\u6210\u4efd') || '',
        ...resolvedImageInfo,
        skuImageSource: previewImageInfo && previewImageInfo.isSkuDesignImage ? 'effectImage' : (resolvedImageInfo.skuImageSource || extra.skuImageSource || ''),
      });

      if (!(await switchDrawerTab(drawer, '\u9879\u76ee\u4fe1\u606f', { flowToken: token, timeout: 9000 }))) throw new Error('\u9879\u76ee\u4fe1\u606f\u9875\u7b7e\u672a\u52a0\u8f7d\u5b8c\u6210');
      extra.benchmarkLink = extractBenchmarkLink(getVisibleText(drawer)) || extra.benchmarkLink;
      await switchDrawerTab(drawer, L.productTab, { flowToken: token, timeout: 9000 });
      return extra;
    } finally {
      finishForegroundDrawerTabFlow(token);
    }
  }

  function getCachedSkuImageInfo(sku) {
    const current = state.data && state.data.sku === sku ? state.data : null;
    const data = normalizeData(current || loadData(sku) || {});
    const hasReusableSkuImage = /^(?:effectImage|productListImage)$/.test(data.skuImageSource || '') && Boolean(data.skuImageUrl || data.skuImageFallbackUrl);
    const imageUrl = hasReusableSkuImage
      ? (data.skuImageUrl || data.skuImageFallbackUrl || '')
      : (data.productListImageUrl || data.productListImageFallbackUrl || '');
    if (!imageUrl) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const imageFallbackUrl = hasReusableSkuImage
      ? (data.skuImageFallbackUrl || data.skuImageUrl || imageUrl)
      : (data.productListImageFallbackUrl || data.productListImageUrl || imageUrl);
    const skuImageSource = hasReusableSkuImage ? data.skuImageSource : 'productListImage';
    return {
      imageUrl,
      imageFallbackUrl,
      skuImageUrl: imageUrl,
      skuImageFallbackUrl: imageFallbackUrl,
      skuImageSource,
      isSkuDesignImage: true,
    };
  }

  async function switchDrawerTab(drawer, label, options) {
    const opts = options || {};
    if (!drawer) return false;
    if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
    const timeout = Number(opts.timeout || 3500) || 3500;
    const startedAt = Date.now();
    const button = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      return findTabButton(drawer, label);
    }, timeout, 120);
    if (!button) return false;
    if (!isActiveTab(button)) {
      state.ignoreOutsideClickUntil = Date.now() + 1200;
      button.click();
    }
    const active = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      const current = findTabButton(drawer, label);
      return current && isActiveTab(current);
    }, Math.max(500, timeout - (Date.now() - startedAt)), 100);
    if (!active) return false;
    const readinessTimeout = Math.max(500, timeout - (Date.now() - startedAt));
    const ready = await waitFor(() => {
      if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
      return isDrawerTabContentReady(drawer, label);
    }, readinessTimeout, 120);
    if (opts.flowToken && state.drawerTabFlowToken !== opts.flowToken) return false;
    return Boolean(ready);
  }

  function isDrawerTabContentReady(drawer, label) {
    if (!drawer || getActiveTabText(drawer) !== label) return false;
    const text = getVisibleText(drawer);
    if (label === L.materialTab) return /\u7269\u6599\u7f16\u7801[\s\S]*\u7269\u6599\u540d\u79f0|\u89c4\u683c\u578b\u53f7|\u5305\u88c5\u5c3a\u5bf8|\u5370\u5237\u5c3a\u5bf8|\u51c0\u542b\u91cf/.test(text);
    if (label === L.productTab) return /PRODUCT\s*NAME|\u5546\u54c1\u540d\u79f0|\u4ea7\u54c1\u540d\u79f0|\u89c4\u683c\u4fe1\u606f|\u6bdb\u91cd|\u51c0\u542b\u91cf|\u6548\u679c\u56fe\u4fe1\u606f/.test(text);
    if (label === '\u5907\u8d27\u4fe1\u606f') return /\u56fd\u5185\u4e09\u6863\u4ef7\u683c|\u91c7\u8d2d\u4ef7/.test(text);
    if (label === '\u9879\u76ee\u4fe1\u606f') return /\u9879\u76ee\u7f16\u7801|\u5bf9\u6807\u94fe\u63a5/.test(text);
    return true;
  }

  async function waitForDrawerText(drawer, text, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (getVisibleText(drawer).includes(text)) return true;
      await wait(120);
    }
    return false;
  }

  async function collectProductImageInfo(drawer, options) {
    const opts = options || {};
    const activeText = opts.restoreTab ? getActiveTabText(drawer) : '';
    let imageInfo = { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const ownsFlow = !opts.flowToken && Boolean(opts.sku);
    if (ownsFlow) stopScan();
    const flowToken = opts.flowToken || (ownsFlow ? beginForegroundDrawerTabFlow(opts.sku, drawer) : 0);
    try {
      if (!(await switchDrawerTab(drawer, L.productTab, { flowToken, timeout: opts.productInfoTimeout || 3500 }))) return imageInfo;
      await waitForProductInfoImage(drawer, opts.productInfoTimeout || 1800);
      if (flowToken && state.drawerTabFlowToken !== flowToken) return imageInfo;
      imageInfo = findDesignImageInfo(drawer);
      if ((!imageInfo.imageUrl && !imageInfo.imageFallbackUrl) && opts.allowPreview) {
        imageInfo = await openPreviewAndGetImageInfo(drawer);
      }
      if (opts.restoreTab && activeText) await switchDrawerTab(drawer, activeText, { flowToken });
      return imageInfo;
    } finally {
      if (ownsFlow) finishForegroundDrawerTabFlow(flowToken);
    }
  }

  async function waitForProductInfoImage(drawer, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const imageInfo = findDesignImageInfo(drawer);
      if (imageInfo.imageUrl || imageInfo.imageFallbackUrl) return true;
      scrollDesignImageCardsIntoView(drawer);
      await wait(120);
    }
    return false;
  }

  function scrollDesignImageCardsIntoView(drawer) {
    if (!drawer) return;
    const card = findDesignPreviewCard(drawer);
    if (card && card.scrollIntoView) card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function findDesignPreviewCard(root) {
    const item = findStrictEffectImageItem(root || document);
    if (!item) return null;
    return Array.from(item.querySelectorAll('.filePreviewCard, .filePreviewMainBox, .removeOtherContent, .previewMasker, .preview'))
      .filter(isVisibleElement)
      .find((el) => isStrictEffectImageFileContext(getDesignAssetContext(el))) || null;
  }

  function extractLineAfter(text, label) {
    const lines = getCleanLines(text);
    const normalizedLabel = label.replace(/[：:]\s*$/, '');
    const index = lines.findIndex((line) => line.replace(/[：:]\s*$/, '') === normalizedLabel);
    if (index < 0) return '';
    return cleanExcelFieldValue(lines[index + 1]);
  }

  function extractNamedField(text, label) {
    const lines = getCleanLines(text);
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (lines[index] !== label) continue;
      const value = cleanExcelFieldValue(lines[index + 1]);
      if (value && !isLikelyFieldLabel(value)) return value;
    }
    return '';
  }

  function getCleanLines(text) {
    return String(text || '').split('\n').map((line) => compactText(line)).filter(Boolean);
  }

  function cleanExcelFieldValue(value) {
    const text = compactText(value);
    return text === '--' ? '' : text;
  }

  function cleanEnglishProductName(value, brand) {
    let text = cleanExcelFieldValue(value)
      .replace(/^PRODUCT\s*NAME\s*[:：]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';

    const brandText = compactText(brand).replace(/[._-]+/g, ' ').trim();
    if (brandText) {
      const escapedBrand = brandText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s._-]+');
      text = text.replace(new RegExp('^' + escapedBrand + '(?:[\\s._–—-]+|$)', 'i'), '').trim();
    }

    const logoMatch = text.match(/^([A-Z][A-Z0-9]{3,})(?:[®™©])?[\s._–—-]+(.+)$/);
    if (logoMatch && /[A-Za-z]/.test(logoMatch[2])) text = logoMatch[2].trim();
    return text;
  }

  function isLikelyFieldLabel(value) {
    return /^(PRODUCT NAME|\u4e2d\u6587-\u7b80\u4f53|\u82f1\u8bed|\u6210\u4efd\u8868|\u6210\u5206\u529f\u80fd|\u4ea7\u54c1\u5356\u70b9|\u4ea7\u54c1\u4f18\u52bf|\u4ea7\u54c1\u529f\u6548|\u4f7f\u7528\u65b9\u6cd5|\u8b66\u544a\u8bed|\u4ea7\u54c1\u6807\u8bc6|\u5176\u4ed6\u6807\u8bc6)/.test(value);
  }

  function findDesignImageInfo(drawer) {
    const item = findStrictEffectImageItem(drawer);
    if (!item) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    const fallback = Array.from(item.querySelectorAll('img.ant-image-img, .ant-image img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .find(isStrictDesignImageUrl) || '';
    const original = stripOssResizeParams(fallback);
    return { imageUrl: original, imageFallbackUrl: fallback || original, isSkuDesignImage: Boolean(fallback) };
  }

  function findStrictEffectImageItem(drawer) {
    if (!drawer) return null;
    const root = getDesignContentRoot(drawer);
    if (!root) return null;
    return Array.from(root.querySelectorAll('.ant-form-item'))
      .filter(isVisibleElement)
      .find((item) => isEffectImageFormItem(root, item) && isStrictEffectImageFileContext(item.innerText || item.textContent)) || null;
  }

  function getDesignContentRoot(drawer) {
    const roots = Array.from(drawer.querySelectorAll('.previewFormRoot .tabContent, .tabContent, .previewFormRoot'))
      .filter(isVisibleElement)
      .filter((el) => !el.closest('.searchDropdownPanel, .searchDropdown'));
    return roots.find((el) => /\u6548\u679c\u56fe\u4fe1\u606f[\s\S]*\u56fe\u7247/.test(el.innerText || el.textContent))
      || roots[0]
      || drawer;
  }

  function isEffectImageFormItem(root, item) {
    const label = compactText((item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).innerText || (item.querySelector('.ant-form-item-label label, .ant-form-item-label') || {}).textContent || '');
    if (label !== '\u56fe\u7247') return false;
    return getPreviousDesignSection(root, item) === '\u6548\u679c\u56fe\u4fe1\u606f';
  }

  function getPreviousDesignSection(root, item) {
    const itemTop = item.getBoundingClientRect().top;
    const titles = Array.from(root.querySelectorAll('.titleRow, .titleContent, .title'))
      .filter(isVisibleElement)
      .map((el) => ({ top: el.getBoundingClientRect().top, text: compactText(el.innerText || el.textContent) }))
      .filter((entry) => entry.top <= itemTop && /^(\u57fa\u672c\u4fe1\u606f|\u6548\u679c\u56fe\u4fe1\u606f|\u4ea7\u54c1\u6587\u6848|\u8bbe\u8ba1\u6587\u4ef6|\u5907\u6ce8\u4fe1\u606f)$/.test(entry.text))
      .sort((a, b) => a.top - b.top);
    let section = '';
    titles.forEach((entry) => { section = entry.text; });
    return section;
  }

  function isStrictEffectImageFileContext(context) {
    const text = compactText(context);
    if (!text || isExcludedDesignImageContext(text)) return false;
    return /\.(jpg|jpeg|png|webp)\b/i.test(text);
  }

  function isExcludedDesignImageContext(context) {
    return /(\u6807\u7b7e\u5c3a\u5bf8\u56fe|\u4ea7\u54c1\u6587\u6848|\u4ea7\u54c1\u6b63\u9762\u6587\u6848|\u6587\u6848|\u4f01\u4e1a\u5fae\u4fe1|\u622a\u56fe|\.pdf\b|\.docx?\b|\.xlsx?\b)/i.test(compactText(context));
  }

  async function openPreviewAndGetImageInfo(drawer) {
    const beforeUrls = getVisibleOssImageUrls(document);
    const preview = findDesignPreviewCard(drawer);
    if (!preview) return { imageUrl: '', imageFallbackUrl: '', isSkuDesignImage: false };
    preview.click();
    const images = await waitForPreviewImageUrls(beforeUrls, 1600);
    closeImagePreview();
    const fallback = images[0] || '';
    return { imageUrl: stripOssResizeParams(fallback), imageFallbackUrl: fallback, isSkuDesignImage: Boolean(fallback) };
  }

  async function waitForPreviewImageUrls(beforeUrls, timeout) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      const images = getVisibleOssImageUrls(document)
        .filter((src) => !beforeUrls.includes(src))
        .filter((src) => !/filePic\//i.test(src));
      if (images.length) return images;
      await wait(160);
    }
    return [];
  }

  function getVisibleOssImageUrls(root) {
    return Array.from((root || document).querySelectorAll('.ant-image-preview-img, .ant-image-preview-wrap img, img'))
      .filter(isVisibleElement)
      .map((img) => img.currentSrc || img.src || '')
      .filter((src) => /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(src));
  }

  function isStrictDesignImageUrl(src) {
    return /^https?:\/\/oss-pro\.plm\.westmonth\.cn\//.test(String(src || '')) && !/\/filePic\//i.test(src);
  }

  function closeImagePreview() {
    const close = document.querySelector('.ant-image-preview-close');
    if (close) close.click();
  }

  function isProductDesignImage(img) {
    const context = getDesignAssetContext(img);
    if (isExcludedDesignImageContext(context)) return false;
    return isStrictEffectImageFileContext(context);
  }

  function isProductDesignPreview(el) {
    const context = getDesignAssetContext(el);
    return !isExcludedDesignImageContext(context);
  }

  function getDesignAssetContext(el) {
    const preferred = el.closest('.filePreviewCard, .filePreviewMainBox, .removeOtherContent');
    if (preferred) return compactText(preferred.innerText || preferred.textContent || '');
    let node = el.parentElement;
    while (node && node !== document.body) {
      const text = compactText(node.innerText || node.textContent || '');
      if (text) return text;
      node = node.parentElement;
    }
    return '';
  }

  function stripOssResizeParams(url) {
    return String(url || '').replace(/\?x-oss-process=.*$/i, '');
  }

  function extractBenchmarkLink(text) {
    const lines = getCleanLines(text);
    const index = lines.findIndex((line) => /\u5bf9\u6807\u94fe\u63a5/.test(line));
    const nearby = index >= 0 ? lines.slice(index + 1, index + 5).join(' ') : text;
    return ((nearby.match(/https?:\/\/\S+/) || String(text || '').match(/https?:\/\/\S+/)) || [''])[0];
  }

  function formatExcelDim(nums, fallbackParts) {
    const parts = (Array.isArray(nums) && nums.length >= 3 ? nums.slice(0, 3).map(trimNumber) : fallbackParts.map(extractCmValue))
      .filter((part) => part !== '');
    return parts.length >= 2 ? parts.join('*') + 'cm' : '';
  }

  function formatExcelDimFromParts(parts) {
    const values = (parts || []).map(extractCmValue).filter((part) => part !== '');
    return values.length >= 2 ? values.join('*') + 'cm' : '';
  }

  function extractCmValue(value) {
    const match = String(value || '').match(/\d+(?:\.\d+)?/);
    return match ? trimNumber(Number(match[0])) : '';
  }

  function normalizeExcelUnit(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text || text === L.unknown) return '';
    return text.replace(/(kg|mg|mcg|ug|g|ml|cl|dl|l|floz|oz|lbs?)$/i, (unit) => unit.toLowerCase());
  }

  function formatIngredientsForExcel(value) {
    return String(value || '').replace(/\s*(\u975e\u6d3b\u6027\u6210\u5206[:\uff1a])\s*/g, '\n$1');
  }

  function normalizeExcelNumberOrText(value) {
    const text = compactText(value);
    if (!text) return '';
    const num = Number(text);
    return Number.isFinite(num) ? num : text;
  }

  function normalizePackQty(value) {
    const text = compactText(value).replace(/\s+/g, '');
    if (!text) return '';
    return /pcs$/i.test(text) ? text.replace(/pcs$/i, 'pcs') : text + 'pcs';
  }

  async function fillRecommendedPackQty(data) {
    const boxKey = buildPackBoxKey(data);
    const recommendation = calculateLocalPackRecommendation(boxKey);
    const count = recommendation && recommendation.packCount ? String(recommendation.packCount) : '';
    state.excelPackQty = count;
    if (!count) return false;
    state.excelStatus = '装箱数已按当前尺寸本地计算：' + count;
    return true;
  }

  async function closeToyCopywritingDrawerForSku(sku) {
    const drawer = getToyCopywritingDrawerForSku(sku) || getProjectDrawerForSku(sku);
    if (!drawer) return true;
    const close = findDrawerCloseButton(drawer);
    if (!close) return false;
    clickElement(close);
    const result = await waitFor(() => {
      const modal = getVisibleModal();
      if (modal && isCancelConfigModal(modal)) return { modal };
      if (!isVisibleElement(drawer) || !document.body.contains(drawer)) return { closed: true };
      return null;
    }, 10000, 100);
    if (!result) return false;
    if (result.modal) {
      confirmCancelConfigModal(result.modal);
      return Boolean(await waitFor(() => {
        return !getVisibleModal() && (!isVisibleElement(drawer) || !document.body.contains(drawer));
      }, 10000, 100));
    }
    return Boolean(result.closed);
  }

  async function fillRecommendedPurchasePrice(data, extra) {
    const savedPrice = normalizeLedgerPurchasePrice(data && data.purchasePrice);
    if (savedPrice) {
      state.excelPurchasePrice = savedPrice;
      return false;
    }
    const current = String(state.excelPurchasePrice || '').trim();
    if (current && current !== '6') return false;
    try {
      const domesticThirdTierPrice = await fetchApiDomesticThirdTierPrice(data, { force: false });
      if (domesticThirdTierPrice) {
        cacheDomesticTierPrice(data && data.sku, data, domesticThirdTierPrice, 'plm-api-domestic-third-tier');
        state.excelPurchasePrice = domesticThirdTierPrice;
        state.excelStatus = '\u56fd\u5185\u4e09\u6863\u4ef7\u683c: ' + domesticThirdTierPrice;
        return true;
      }
    } catch (error) {
      addLog('info', '\u56fd\u5185\u4e09\u6863\u4ef7\u683c\u8bfb\u53d6\u5931\u8d25\uff0c\u7ee7\u7eed\u4f7f\u7528\u672c\u5730\u4ef7\u683c', (data && data.sku || '') + ' | ' + formatErrorMessage(error));
    }
    const productType = getProductTypeForInsight(data, extra);
    // 2026-08-07: 停用云端推荐价格 API（fetchInsightRecommendation 推荐价格不准，会写入 Excel）。
    // 价格补全只使用本地历史推荐，避免 Excel 出现错误价格。
    const effectiveProductType = productType;
    const recommendation = getLocalPriceRecommendation(data, effectiveProductType);
    const price = recommendation && recommendation.recommendedPrice ? String(recommendation.recommendedPrice) : '';
    if (!price) return false;
    const reason = recommendation.recommendationReason || buildLocalRecommendationReason(recommendation, effectiveProductType);
    const confidenceText = recommendation.priceConfidence || recommendation.recommendationConfidence || '';
    const priceStatsText = formatRecommendationPriceStats(recommendation.priceStats);
    state.excelPurchasePrice = price;
    state.excelStatus = '\u63a8\u8350\u4ef7\u683c: ' + price + (effectiveProductType ? ' / ' + effectiveProductType : '') + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (recommendation.source ? ' / ' + recommendation.source : '') + (reason ? ' / ' + reason : '');
    addLog('success', '\u5df2\u667a\u80fd\u8865\u5168\u91c7\u8d2d\u4ef7\u683c', (data && data.sku || '') + ' ' + effectiveProductType + ' ' + price + (confidenceText ? ' / \u7f6e\u4fe1\u5ea6' + confidenceText : '') + (priceStatsText ? ' / ' + priceStatsText : '') + (reason ? ' / ' + reason : ''));
    syncInsightEvent('recommendation', {
      sku: data && data.sku || '',
      brand: data && data.brand || '',
      name: data && data.name || '',
      productType: effectiveProductType || productType || '',
      price,
      recommendedPrice: price,
      source: recommendation.source || 'recommendation',
      reason,
      recommendationReason: reason,
      productTypeSource: recommendation.productTypeSource || '',
      productTypeScore: recommendation.productTypeScore || '',
      typeSampleCount: recommendation.typeSampleCount || '',
      recommendedProductType: recommendation.recommendedProductType || '',
      effectiveProductType,
      priceConfidence: confidenceText,
      recommendationConfidence: confidenceText,
      priceStats: recommendation.priceStats || null,
    });
    return true;
  }

  function formatRecommendationPriceStats(stats) {
    if (!stats || !stats.count) return '';
    return '\u6837\u672c' + stats.count + ' / \u4e2d\u4f4d' + stats.median + ' / \u5747\u4ef7' + stats.avg + ' / \u533a\u95f4' + stats.min + '-' + stats.max;
  }

  function buildLocalRecommendationReason(recommendation, productType) {
    if (!recommendation || !recommendation.recommendedPrice) return '';
    if (recommendation.source === 'local-same-sku') return '\u672c\u5730\u540c SKU \u5386\u53f2\u4ef7';
    if (recommendation.source === 'local-same-type') return '\u672c\u5730\u540c\u7c7b\u578b\u5386\u53f2\u4ef7' + (productType ? '\uff1a' + productType : '');
    if (recommendation.source === 'local-name') return '\u672c\u5730\u76f8\u4f3c\u5546\u54c1\u540d\u5386\u53f2\u4ef7';
    return '';
  }

  function getLocalPriceRecommendation(data, productType) {
    const history = state.insights && Array.isArray(state.insights.priceHistory) ? state.insights.priceHistory : [];
    if (!history.length || !data) return null;
    const sku = String(data.sku || '');
    const name = String(data.name || '').trim();
    const valid = history.map((item) => ({
      ...item,
      numericPrice: Number(String(item.price || '').replace(/[^0-9.]/g, '')),
    })).filter((item) => item.numericPrice > 0);
    const sameSku = valid.find((item) => sku && item.sku === sku);
    if (sameSku) return { recommendedPrice: sameSku.numericPrice, source: 'local-same-sku' };
    const sameType = valid.find((item) => productType && item.productType === productType);
    if (sameType) return { recommendedPrice: sameType.numericPrice, source: 'local-same-type' };
    const sameName = valid.find((item) => name && String(item.name || '').includes(name.slice(0, 8)));
    if (sameName) return { recommendedPrice: sameName.numericPrice, source: 'local-name' };
    return null;
  }

  function getReturnDateText(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return '\uff08' + date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '\uff09';
  }

  function buildExcelKeyword(data, extra) {
    if (state.settings.excelKeywordMode === 'brandName') {
      return [data.brand, data.name || (extra && extra.chineseName)].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    return (extra && extra.englishName) || '';
  }

  function buildExcelFileName(data, extra) {
    const parts = [data.brand, data.name || (extra && extra.chineseName), data.sku].map(cleanFileNamePart).filter(Boolean);
    const base = parts.join(' ').replace(/\s+/g, ' ').trim();
    return sanitizeExcelFileName((base || data.sku || 'PLM\u4ea7\u54c1\u4fe1\u606f') + '.xlsx');
  }

  function cleanFileNamePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const EXCEL_FILE_NAME_MAX_LENGTH = 100;
  const EXCEL_FILE_NAME_MAX_BYTES = 180;

  function excelFileNameByteLength(value) {
    return Array.from(value).reduce((total, character) => {
      const point = character.codePointAt(0);
      // Browser downloads replace spaces with NBSP; reserve two bytes for each space.
      return total + (point === 32 ? 2 : point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
    }, 0);
  }

  function sanitizeExcelFileName(filename) {
    const value = String(filename || '').replace(/\.xlsx$/i, '').replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const stem = value || 'PLM\u4ea7\u54c1\u4fe1\u606f';
    const extension = '.xlsx';
    if (stem.length + extension.length <= EXCEL_FILE_NAME_MAX_LENGTH && excelFileNameByteLength(stem + extension) <= EXCEL_FILE_NAME_MAX_BYTES) return stem + extension;
    const skuMatch = stem.match(/(?:^|\s)(SKU\d{1,32}(?:\s+等\d{1,6}个SKU)?)$/i);
    const suffix = skuMatch ? ' ' + skuMatch[1] : '';
    const reserved = '...' + suffix + extension;
    const maxLength = EXCEL_FILE_NAME_MAX_LENGTH - reserved.length;
    const maxBytes = EXCEL_FILE_NAME_MAX_BYTES - excelFileNameByteLength(reserved);
    const source = skuMatch ? stem.slice(0, skuMatch.index) : stem;
    let shortened = '';
    let bytes = 0;
    for (const character of source) {
      const characterBytes = excelFileNameByteLength(character);
      if (shortened.length + character.length > maxLength || bytes + characterBytes > maxBytes) break;
      shortened += character;
      bytes += characterBytes;
    }
    return shortened.trimEnd() + reserved;
  }

  function toBrowserDownloadFileName(filename) {
    return sanitizeDownloadFileName(filename).replace(/ /g, '\u00a0');
  }

  function sanitizeDownloadFileName(filename) {
    const raw = String(filename || '').trim();
    const match = raw.match(/(\.[a-z0-9]{2,8})$/i);
    const ext = match ? match[1] : '';
    const stem = (ext ? raw.slice(0, -ext.length) : raw).replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim();
    return (stem || 'PLM\u6587\u4ef6') + ext;
  }

  async function chooseExcelSaveTarget(filename) {
    if (state.settings.excelDownloadMode === 'direct') return { type: 'download', direct: true };
    const picker = getSaveFilePicker();
    if (!picker) return { type: 'download' };
    try {
      const handle = await picker({
        suggestedName: sanitizeExcelFileName(filename),
        types: [{
          description: 'Excel Workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        }],
      });
      return { type: 'fileSystem', handle };
    } catch (error) {
      if (error && error.name === 'AbortError') return null;
      console.warn('PLM floating helper save picker failed, fallback to download:', error);
      showToast(L.excelSavePickerUnavailable);
      return { type: 'download' };
    }
  }

  function getSaveFilePicker() {
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.showSaveFilePicker === 'function') {
      return (options) => unsafeWindow.showSaveFilePicker(options);
    }
    if (typeof window.showSaveFilePicker === 'function') return (options) => window.showSaveFilePicker(options);
    return null;
  }

  function getDirectoryPicker() {
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.showDirectoryPicker === 'function') {
      return (options) => unsafeWindow.showDirectoryPicker(options);
    }
    if (typeof window.showDirectoryPicker === 'function') return (options) => window.showDirectoryPicker(options);
    return null;
  }

  async function writeImageBlobToFileHandle(handle, blob) {
    const writable = await handle.createWritable();
    try {
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch (_) {}
      throw error;
    }
  }

  async function saveImageFiles(files) {
    const items = (Array.isArray(files) ? files : [])
      .map((item) => ({ name: sanitizeDownloadFileName(item && item.name), dataUrl: String(item && (item.dataUrl || item.url) || '') }))
      .filter((item) => item.name && item.dataUrl);
    if (!items.length) return { mode: 'empty', count: 0 };

    let directory = null;
    const directoryPicker = getDirectoryPicker();
    if (directoryPicker) {
      try {
        directory = await directoryPicker({ mode: 'readwrite' });
      } catch (error) {
        if (error && error.name === 'AbortError') return { mode: 'cancelled', cancelled: true, count: 0 };
        // Permission/security errors fall back to the existing per-file picker.
      }
    }

    const blobs = await Promise.all(items.map(async (item) => {
      const response = await fetch(item.dataUrl);
      if (!response.ok) throw new Error('图片数据读取失败');
      return { ...item, blob: await response.blob() };
    }));

    if (directory) {
      for (const item of blobs) {
        const handle = await directory.getFileHandle(item.name, { create: true });
        await writeImageBlobToFileHandle(handle, item.blob);
      }
      return { mode: 'folder', count: blobs.length };
    }

    const picker = getSaveFilePicker();
    if (!picker) return { mode: 'unsupported', count: 0 };
    for (const item of blobs) {
      const handle = await picker({
        suggestedName: item.name,
        types: [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }],
      });
      await writeImageBlobToFileHandle(handle, item.blob);
    }
    return { mode: 'files', count: blobs.length };
  }

  async function saveExcelBlob(blob, filename, target) {
    if (target && target.type === 'fileSystem' && target.handle) {
      const writable = await target.handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    }
    if (!target || !target.direct) showToast(L.excelSavePickerUnavailable);
    downloadBlob(blob, sanitizeExcelFileName(filename));
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function fetchImageForExcel(url, fallbackUrl) {
    return new Promise((resolve, reject) => {
      const done = async (arrayBuffer, contentType) => {
        const extension = /png/i.test(contentType || url) ? 'png' : 'jpeg';
        const dataUrl = 'data:image/' + extension + ';base64,' + arrayBufferToBase64(arrayBuffer);
        const size = await getImageSize(dataUrl).catch(() => ({ width: 118, height: 64 }));
        resolve({ dataUrl, extension, width: size.width, height: size.height });
      };
      const request = (targetUrl, allowFallback) => {
        if (typeof GM_xmlhttpRequest === 'function') {
          GM_xmlhttpRequest({
            method: 'GET',
            url: targetUrl,
            responseType: 'arraybuffer',
            timeout: 8000,
            onload: (res) => {
              if (res.status >= 200 && res.status < 300) done(res.response, res.responseHeaders || targetUrl);
              else if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
              else reject(new Error('image status ' + res.status));
            },
            onerror: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request failed')),
            ontimeout: () => allowFallback && fallbackUrl && fallbackUrl !== targetUrl ? request(fallbackUrl, false) : reject(new Error('image request timeout')),
          });
          return;
        }
        fetchWithTimeout(targetUrl, 8000).then((res) => {
          if (!res.ok) throw new Error('image status ' + res.status);
          return res.arrayBuffer().then((buffer) => done(buffer, res.headers.get('content-type') || targetUrl));
        }).catch((error) => {
          if (allowFallback && fallbackUrl && fallbackUrl !== targetUrl) request(fallbackUrl, false);
          else reject(error);
        });
      };
      request(url, true);
    });
  }

  function getLedgerAiImageContentType(headers, url) {
    const headerMatch = String(headers || '').match(/(?:^|\r?\n)content-type:\s*([^\r\n]+)/i);
    const headerType = headerMatch ? String(headerMatch[1]).trim().split(';')[0].toLowerCase() : '';
    if (headerType) return headerType;
    if (/\.jpe?g(?:[?#]|$)/i.test(String(url || ''))) return 'image/jpeg';
    if (/\.webp(?:[?#]|$)/i.test(String(url || ''))) return 'image/webp';
    if (/\.gif(?:[?#]|$)/i.test(String(url || ''))) return 'image/gif';
    if (/\.svg(?:[?#]|$)/i.test(String(url || ''))) return 'image/svg+xml';
    return 'image/png';
  }

  function fetchLedgerAiImageBlob(url) {
    return new Promise((resolve, reject) => {
      const targetUrl = String(url || '').trim();
      if (!targetUrl) {
        reject(new Error('图片地址为空'));
        return;
      }
      const resolveArrayBuffer = (buffer, contentType) => {
        if (buffer instanceof ArrayBuffer) {
          resolve(new Blob([buffer], { type: contentType }));
          return;
        }
        if (buffer instanceof Blob) {
          resolve(buffer);
          return;
        }
        if (buffer && buffer.buffer instanceof ArrayBuffer) {
          resolve(new Blob([buffer.buffer], { type: contentType }));
          return;
        }
        reject(new Error('图片响应格式无法识别'));
      };
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET',
          url: targetUrl,
          responseType: 'arraybuffer',
          timeout: 30000,
          onload: (response) => {
            if (response.status < 200 || response.status >= 300) {
              reject(new Error('图片下载失败：HTTP ' + response.status));
              return;
            }
            resolveArrayBuffer(response.response, getLedgerAiImageContentType(response.responseHeaders, targetUrl));
          },
          onerror: () => reject(new Error('图片下载失败：网络错误')),
          ontimeout: () => reject(new Error('图片下载失败：请求超时')),
        });
        return;
      }
      fetchWithTimeout(targetUrl, 30000).then((response) => {
        if (!response.ok) throw new Error('图片下载失败：HTTP ' + response.status);
        return response.blob();
      }).then(resolve).catch(reject);
    });
  }

  function fetchWithTimeout(url, timeout, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...(options || {}), signal: controller.signal }).finally(() => clearTimeout(timer));
  }

  function getImageSize(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function getExcelImageAnchor(imageInfo, rowOffset) {
    const boxWidth = 170;
    const boxHeight = 124;
    const width = Number(imageInfo.width) || boxWidth;
    const height = Number(imageInfo.height) || boxHeight;
    const ratio = Math.min(boxWidth / width, boxHeight / height);
    const fitWidth = Math.max(1, Math.round(width * ratio));
    const fitHeight = Math.max(1, Math.round(height * ratio));
    return {
      tl: { col: 2.85, row: 3.17 + (Number(rowOffset) || 0) },
      ext: { width: fitWidth, height: fitHeight },
      editAs: 'oneCell',
    };
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function downloadBlob(blob, filename) {
    const safeName = sanitizeDownloadFileName(filename);
    const browserName = toBrowserDownloadFileName(safeName);
    const panel = ensurePanel();
    state.ignoreOutsideClickUntil = Date.now() + 1500;
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = URL.createObjectURL(blob);
    link.download = browserName;
    panel.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  async function createStoredZipBlob(files, onProgress) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((Math.floor(now.getSeconds() / 2)) & 31);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const nameBytes = encoder.encode(String(file.path || file.filename || ('file-' + index)));
      const data = new Uint8Array(await file.blob.arrayBuffer());
      if (data.byteLength > 0xffffffff || offset > 0xffffffff) throw new Error('ZIP file is too large');
      const crc = crc32Bytes(data);
      const local = new Uint8Array(30);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.byteLength, true);
      lv.setUint32(22, data.byteLength, true);
      lv.setUint16(26, nameBytes.byteLength, true);
      const central = new Uint8Array(46);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.byteLength, true);
      cv.setUint32(24, data.byteLength, true);
      cv.setUint16(28, nameBytes.byteLength, true);
      cv.setUint32(42, offset, true);
      localParts.push(local, nameBytes, data);
      centralParts.push(central, nameBytes);
      offset += local.byteLength + nameBytes.byteLength + data.byteLength;
      if (typeof onProgress === 'function') onProgress(index + 1, files.length);
      await wait(0);
    }
    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);
    return new Blob(localParts.concat(centralParts, end), { type: 'application/zip' });
  }

  function crc32Bytes(bytes) {
    if (!crc32Bytes.table) {
      crc32Bytes.table = Array.from({ length: 256 }, (_, value) => {
        let entry = value;
        for (let bit = 0; bit < 8; bit += 1) entry = (entry >>> 1) ^ (0xedb88320 & -(entry & 1));
        return entry >>> 0;
      });
    }
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) crc = (crc >>> 8) ^ crc32Bytes.table[(crc ^ bytes[index]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function downloadToyLabelBatchArchive(options) {
    const opts = options || {};
    const memoryFiles = Array.isArray(state.toyLabelBatchFiles) ? state.toyLabelBatchFiles.splice(0) : [];
    const manifest = loadToyLabelExportManifest();
    const persistedFiles = [];
    for (const entry of manifest.files) {
      const blob = await getUploadFile(entry.key).catch((error) => {
        console.warn('PLM floating helper toy label staged file read failed:', error);
        return null;
      });
      if (blob) persistedFiles.push({ sku: entry.sku, filename: entry.filename, blob });
    }
    const files = [];
    const seen = new Set();
    persistedFiles.concat(memoryFiles).forEach((file) => {
      const key = String(file && file.sku || '') + '\u0000' + String(file && file.filename || '');
      if (!file || !file.blob || !file.filename || seen.has(key)) return;
      seen.add(key);
      files.push(file);
    });
    if (!files.length) {
      addLog('warn', '批量玩具标签：没有可打包的 PSD 和图片', '');
      return false;
    }
    const nativeZipFiles = files.map((file) => ({
      ...file,
      path: (cleanFileNamePart(file.sku || '\u73a9\u5177\u6807\u7b7e') || '\u73a9\u5177\u6807\u7b7e') + '/' + sanitizeDownloadFileName(file.filename),
    }));
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u5199\u5165 ZIP', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    const nativeBlob = await createStoredZipBlob(nativeZipFiles, (done, total) => {
      state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + done + '/' + total;
    });
    downloadBlob(nativeBlob, '\u73a9\u5177\u6807\u7b7e\u6279\u91cf\u5305_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', nativeZipFiles.length + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;

    const Zip = getLazyExternalRuntime('jszip') || await ensureLazyExternalScript('jszip').catch(() => null);
    if (!Zip) {
      files.forEach((file) => downloadBlob(file.blob, file.filename));
      if (opts.keepStagedFiles) {
        manifest.downloaded = true;
        saveToyLabelExportManifest(manifest);
      } else await clearToyLabelExportManifest(manifest);
      showToast('未加载压缩组件，已逐个下载玩具标签文件');
      return false;
    }
    const zip = new Zip();
    let validCount = 0;
    files.forEach((file) => {
      if (!file || !file.blob || !file.filename) return;
      const folder = cleanFileNamePart(file.sku || '玩具标签') || '玩具标签';
      zip.file(folder + '/' + sanitizeDownloadFileName(file.filename), file.blob);
      validCount += 1;
    });
    if (!validCount) {
      addLog('warn', '批量玩具标签：文件内容不完整', '');
      return false;
    }
    addLog('info', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e\uff1a\u6b63\u5728\u7ec4\u88c5 ZIP', validCount + '\u4e2a\u6587\u4ef6');
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true }, (metadata) => {
      const percent = Math.floor(Number(metadata && metadata.percent) || 0);
      if (percent > 0 && percent % 25 === 0) state.excelStatus = '\u6b63\u5728\u6253\u5305 ZIP ' + percent + '%';
    });
    downloadBlob(blob, '玩具标签批量包_' + new Date().toISOString().slice(0, 10) + '.zip');
    if (opts.keepStagedFiles) {
      manifest.downloaded = true;
      saveToyLabelExportManifest(manifest);
    } else await clearToyLabelExportManifest(manifest);
    addLog('success', '\u6279\u91cf\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247\u5df2\u6253\u5305', validCount + '\u4e2a\u6587\u4ef6');
    showToast('\u73a9\u5177\u6807\u7b7e PSD \u548c\u56fe\u7247 ZIP \u5df2\u4e0b\u8f7d');
    return true;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function parseSearchTokens(query) {
    const source = String(query || '');
    const skuTokens = source.match(/SKU\d+/ig) || [];
    if (skuTokens.length > 1) {
      return Array.from(new Set(skuTokens.map((token) => token.toLowerCase())));
    }
    return Array.from(new Set(source.split(/[\s,，;；、|/\\]+/).map((token) => token.trim().toLowerCase()).filter(Boolean)));
  }

  function normalizeSearchInput(value) {
    return String(value || '').replace(/[\r\n,，;；、|/\\]+/g, ' ').replace(/\s+/g, ' ').trimStart();
  }

  function extractManualSkuCodes(value) {
    return Array.from(new Set((String(value || '').match(/\bSKU\d+\b/ig) || [])
      .map((sku) => String(sku || '').trim().toUpperCase())
      .filter((sku) => /^SKU\d+$/.test(sku))));
  }

  async function fetchManualSkuProjectImage(sku, data) {
    const current = normalizeData({ ...(data || {}), sku });
    const project = await fetchApiProjectSnapshot(current, { force: true });
    const projectId = String(project && project.projectId || '').trim() || getProjectIdForMaterialApi(current);
    if (!projectId || !/^\d+$/.test(projectId)) return { project, projectId: '', imageUrl: '' };
    const effectPayload = await fetchPlmJson('/api/ChemicalNew/GetProjectEffectPicture?id=' + encodeURIComponent(projectId));
    const imageUrl = getMagicToyLabelEffectPicturePaths(effectPayload).map(getMagicToyLabelImageUrl).find(Boolean) || '';
    return { project, projectId, imageUrl };
  }

  function buildManualSkuData(sku, existing, snapshot, isNew) {
    const current = normalizeData({ ...(existing || {}), sku });
    const metrics = snapshot && snapshot.contentPayload ? extractApiProductMetrics(snapshot.contentPayload) : {};
    const optional = snapshot && snapshot.optional || {};
    const nowMs = Date.now();
    const nowText = new Date(nowMs).toLocaleString();
    const imageUrl = String(snapshot && snapshot.productListImageUrl || '').trim();
    const infringementImageUrls = snapshot && Array.isArray(snapshot.infringementImageUrls) && snapshot.infringementImageUrls.length
      ? snapshot.infringementImageUrls
      : current.infringementImageUrls;
    return normalizeData({
      ...current,
      sku,
      brand: snapshot && snapshot.brand || current.brand || '',
      name: snapshot && snapshot.chineseName || current.name || '',
      englishName: snapshot && snapshot.englishName || current.englishName || '',
      productType: snapshot && snapshot.productType || current.productType || '',
      plmCategory: snapshot && snapshot.plmCategory || current.plmCategory || '',
      categoryId: snapshot && snapshot.categoryId || current.categoryId || '',
      productId: snapshot && snapshot.productId || current.productId || '',
      productVersionId: snapshot && snapshot.productVersionId || current.productVersionId || '',
      packageNums: snapshot && (snapshot.outerPackageNums || snapshot.packageNums) || current.packageNums || null,
      outerPackageNums: snapshot && (snapshot.outerPackageNums || snapshot.packageNums) || current.outerPackageNums || null,
      innerPackageNums: snapshot && snapshot.innerPackageNums || current.innerPackageNums || null,
      productNums: snapshot && snapshot.productNums || current.productNums || null,
      productSizeText: snapshot && snapshot.productSizeText || current.productSizeText || '',
      packageSizeText: snapshot && snapshot.outerPackageSizeText || current.packageSizeText || '',
      referenceUrl: snapshot && snapshot.referenceUrl || current.referenceUrl || '',
      packQty: snapshot && snapshot.packQty || current.packQty || '',
      purchasePrice: snapshot && snapshot.purchasePrice || current.purchasePrice || '',
      netContent: metrics.netContent || current.netContent || '',
      grossWeight: metrics.grossWeight || current.grossWeight || '',
      cartonSpec: optional.cartonSpec || current.cartonSpec || '',
      packageMaterial: optional.packageMaterial || current.packageMaterial || '',
      leadTimeText: optional.leadTimeText || current.leadTimeText || '',
      alibabaLink: optional.alibabaLink || current.alibabaLink || '',
      productListImageUrl: imageUrl || current.productListImageUrl || '',
      productListImageFallbackUrl: imageUrl || current.productListImageFallbackUrl || '',
      designAssignedAt: current.designAssignedAt || (isNew ? nowText : ''),
      infringementImageUrls: infringementImageUrls || [],
      infringementImageUrl: snapshot && snapshot.infringementImageUrl || current.infringementImageUrl || '',
      infringementImageSource: snapshot && snapshot.infringementImageSource || current.infringementImageSource || '',
      infringementCopywriting: snapshot && snapshot.infringementCopywriting || current.infringementCopywriting || '',
      apiFieldStates: mergeApiFieldStates(current.apiFieldStates, snapshot && snapshot.apiFieldStates, metrics.apiFieldStates),
      acquiredAt: current.acquiredAt || nowText,
      acquiredAtMs: current.acquiredAtMs || nowMs,
      skuListSource: current.skuListSource || (isNew ? 'manual-code' : ''),
      manualSkuAddedAt: current.manualSkuAddedAt || (isNew ? nowText : ''),
      manualSkuAddedAtMs: current.manualSkuAddedAtMs || (isNew ? nowMs : 0),
      updatedAt: nowText,
      updatedAtMs: nowMs,
    });
  }

  async function addSkuByCode(value, options) {
    const opts = options || {};
    const sku = String(value || '').trim().toUpperCase();
    if (!/^SKU\d+$/.test(sku)) return { sku: '', added: false, enriched: false, error: '请输入有效的 SKU 编码' };
    const cached = loadData(sku);
    const indexed = state.index.find((item) => item && String(item.sku || '').toUpperCase() === sku) || null;
    const existing = cached || indexed;
    const isNew = !indexed;
    let snapshot = null;
    let apiError = '';
    if (!cached || opts.force) {
      try {
        snapshot = await fetchApiProductSnapshot({ sku }, { force: Boolean(opts.force) });
        if (!snapshot || !snapshot.found) apiError = String(snapshot && snapshot.reason || 'PLM 未返回商品信息');
      } catch (error) {
        apiError = formatErrorMessage(error);
        addLog('warn', '手动添加 SKU 的产品信息读取失败', sku + ' | ' + apiError);
      }
    }
    if (!isNew && cached && !snapshot) return { sku, data: normalizeData(cached), added: false, enriched: false, error: '' };
    let data = buildManualSkuData(sku, existing, snapshot, isNew);
    let projectImage = null;
    try {
      projectImage = await fetchManualSkuProjectImage(sku, data);
    } catch (error) {
      addLog('info', '手动添加 SKU 的项目效果图读取失败，继续使用商品图', sku + ' | ' + formatErrorMessage(error));
    }
    const productImageUrl = String(data.productListImageUrl || data.productListImageFallbackUrl || '').trim();
    const existingEffectImageUrl = data.skuImageSource === 'effectImage'
      ? String(data.skuImageUrl || data.skuImageFallbackUrl || '').trim()
      : '';
    const effectImageUrl = String(projectImage && projectImage.imageUrl || '').trim() || existingEffectImageUrl;
    const resolvedImageUrl = effectImageUrl || productImageUrl || String(data.skuImageUrl || data.skuImageFallbackUrl || '').trim();
    const project = projectImage && projectImage.project;
    data = normalizeData({
      ...data,
      projectRowId: String(projectImage && projectImage.projectId || data.projectRowId || ''),
      projectId: String(projectImage && projectImage.projectId || data.projectId || ''),
      brand: data.brand || project && project.brand || '',
      name: data.name || project && project.name || '',
      referenceUrl: project && project.referenceUrl || data.referenceUrl || '',
      infringementImageUrls: project && Array.isArray(project.infringementImageUrls) && project.infringementImageUrls.length
        ? project.infringementImageUrls
        : data.infringementImageUrls,
      infringementImageUrl: project && project.infringementImageUrl || data.infringementImageUrl || '',
      infringementImageSource: project && project.infringementImageSource || data.infringementImageSource || '',
      infringementCopywriting: project && project.infringementCopywriting || data.infringementCopywriting || '',
      skuImageUrl: resolvedImageUrl,
      skuImageFallbackUrl: resolvedImageUrl,
      skuImageSource: effectImageUrl ? 'effectImage' : (productImageUrl ? 'productListImage' : data.skuImageSource || ''),
      manualSkuImageCheckedAtMs: Date.now(),
      manualSkuImageRefreshVersion: SCRIPT_VERSION,
    });
    saveData(sku, data, { changeSource: isNew ? '手动添加编码' : '手动补充编码信息' });
    upsertDailyLedgerFromData(data, {
      date: getTodayKey(),
      status: '待定稿',
      stage: '待定稿',
      note: isNew ? '手动添加自动加入今日工作台' : undefined,
    });
    if (state.view === 'ledger' && !opts.background && !renderLedgerTabContent(ensurePanel())) renderShell();
    addLog(isNew ? 'success' : 'info', isNew ? '已手动添加 SKU' : '已补充 SKU 信息', sku + (snapshot && snapshot.found ? ' | 已读取产品信息' : ' | ' + apiError));
    return { sku, data, added: isNew, enriched: Boolean(snapshot && snapshot.found), effectImageFound: Boolean(effectImageUrl), error: apiError };
  }

  function scheduleMissingManualSkuImageRefresh(delayMs) {
    window.setTimeout(() => {
      if (manualSkuAddWorkerPromise) {
        scheduleMissingManualSkuImageRefresh(1500);
        return;
      }
      if (manualSkuImageRefreshPromise) return;
      manualSkuImageRefreshPromise = refreshMissingManualSkuImages().catch((error) => {
        addLog('warn', '手动 SKU 图片后台补全失败', formatErrorMessage(error));
        return 0;
      }).finally(() => {
        manualSkuImageRefreshPromise = null;
      });
    }, Math.max(0, Number(delayMs) || 0));
  }

  async function refreshMissingManualSkuImages() {
    syncDailyLedgerBeforeMutation();
    const currentMonth = getMonthKeyFromDateKey(getTodayKey());
    const candidates = Array.from(new Set((state.ledgerRecords || []).filter((record) => {
      if (!record || getMonthKeyFromDateKey(record.date) !== currentMonth || isLedgerFinalizedRecord(record)) return false;
      const sku = String(record.sku || '').trim().toUpperCase();
      if (!sku) return false;
      const cached = normalizeData(loadData(sku) || state.index.find((item) => item && String(item.sku || '').toUpperCase() === sku) || { sku });
      const isManual = cached.skuListSource === 'manual-code' || Boolean(cached.manualSkuAddedAt || cached.manualSkuAddedAtMs);
      if (!isManual) return false;
      const hasProjectId = /^\d+$/.test(getProjectIdForMaterialApi(cached));
      const hasEffectImage = cached.skuImageSource === 'effectImage' && Boolean(String(cached.skuImageUrl || cached.skuImageFallbackUrl || '').trim());
      return (!hasProjectId || !hasEffectImage) && cached.manualSkuImageRefreshVersion !== SCRIPT_VERSION;
    }).map((record) => String(record.sku || '').trim().toUpperCase()).filter(Boolean))).slice(0, 80);
    if (!candidates.length) return 0;
    let updatedCount = 0;
    for (const sku of candidates) {
      try {
        const result = await addSkuByCode(sku, { force: true, background: true });
        if (result && result.data && String(result.data.skuImageUrl || result.data.skuImageFallbackUrl || '').trim()) updatedCount += 1;
      } catch (error) {
        addLog('info', '手动 SKU 图片后台补全跳过', sku + ' | ' + formatErrorMessage(error));
      }
      await wait(450);
    }
    if (updatedCount && state.view === 'ledger' && !renderLedgerTabContent(ensurePanel())) renderShell();
    addLog('info', '手动 SKU 图片后台补全完成', '检查 ' + candidates.length + ' 个，更新 ' + updatedCount + ' 个');
    return updatedCount;
  }

  function getManualSkuAddQueueStats(queue) {
    const items = Array.isArray(queue) ? queue : [];
    return {
      total: items.length,
      pending: items.filter((item) => item.status === 'pending').length,
      processing: items.filter((item) => item.status === 'processing').length,
      success: items.filter((item) => item.status === 'success').length,
      partial: items.filter((item) => item.status === 'partial').length,
      skipped: items.filter((item) => item.status === 'skipped').length,
      error: items.filter((item) => item.status === 'error').length,
    };
  }

  function getManualSkuAddStatusText(status) {
    const labels = {
      pending: '等待中',
      processing: '读取中',
      success: '已完成',
      partial: '已加入·资料不全',
      skipped: '已存在',
      error: '失败',
    };
    return labels[status] || labels.pending;
  }

  function manualSkuAddModalHtml() {
    if (!state.manualSkuAddOpen) return '';
    const queue = Array.isArray(state.manualSkuAddQueue) ? state.manualSkuAddQueue : [];
    const stats = getManualSkuAddQueueStats(queue);
    const running = Boolean(state.manualSkuAddWorkerRunning);
    const retryCount = stats.partial + stats.error;
    const rows = queue.length
      ? queue.map((entry) => {
        const status = String(entry.status || 'pending');
        const detail = [entry.step, entry.error].filter(Boolean).join(' · ') || '等待后台读取产品信息';
        return '<div class="pfh-manual-sku-add-row is-' + escapeHtml(status) + '"><b>' + escapeHtml(entry.sku) + '</b><small title="' + escapeHtml(detail) + '">' + escapeHtml(detail) + '</small><span class="pfh-manual-sku-add-status is-' + escapeHtml(status) + '">' + escapeHtml(getManualSkuAddStatusText(status)) + '</span></div>';
      }).join('')
      : '<div class="pfh-manual-sku-add-empty">还没有手动添加任务。可以一次粘贴多个 SKU，队列会逐个读取。</div>';
    const progress = state.manualSkuAddStatus
      || (running ? '后台正在按顺序读取产品信息' : '关闭弹窗不会停止后台队列');
    const hasPending = stats.pending > 0;
    const canSubmit = Boolean(String(state.manualSkuAddInput || '').trim());
    return '<div class="pfh-manual-sku-add-layer" data-action="sku-manual-add-close"><section class="pfh-manual-sku-add-dialog" role="dialog" aria-modal="true" aria-label="手动添加 SKU" data-manual-sku-add-dialog="true">' +
      '<header><div><h3>手动添加 SKU</h3><p>不经过搜索，逐个从 PLM 产品接口读取并加入 SKU 列表。</p></div><button type="button" data-action="sku-manual-add-close" aria-label="关闭">×</button></header>' +
      '<div class="pfh-manual-sku-add-body"><textarea class="pfh-manual-sku-add-input" placeholder="粘贴多个 SKU，例如：SKU00046398\nSKU00046397\nSKU00046396">' + escapeHtml(state.manualSkuAddInput || '') + '</textarea><p class="pfh-manual-sku-add-hint">支持换行、空格、逗号分隔；每次只处理 1 个 SKU，间隔约 1.1 秒，避免连续读取触发限制。</p>' +
      '<div class="pfh-manual-sku-add-summary"><strong>添加队列</strong><span>共 ' + stats.total + '</span><span>等待 ' + stats.pending + '</span><span>读取中 ' + stats.processing + '</span><span>完成 ' + (stats.success + stats.skipped) + '</span><span>待重试 ' + retryCount + '</span></div>' +
      '<div class="pfh-manual-sku-add-queue">' + rows + '</div><div class="pfh-mini-tool-actions"><button type="button" class="is-primary" data-action="sku-manual-add-submit"' + (canSubmit ? '' : ' disabled') + '>加入后台队列</button></div></div>' +
      '<footer><span title="' + escapeHtml(progress) + '">' + escapeHtml(progress) + (state.manualSkuAddCurrentSku ? '：' + escapeHtml(state.manualSkuAddCurrentSku) : '') + '</span><div>' +
      (running ? '<button type="button" data-action="sku-manual-add-pause">暂停队列</button>' : '<button type="button" data-action="sku-manual-add-start"' + (hasPending ? '' : ' disabled') + '>继续队列</button>') +
      '<button type="button" data-action="sku-manual-add-retry-errors"' + (retryCount ? '' : ' disabled') + '>重试失败</button><button type="button" data-action="sku-manual-add-clear-done"' + ((stats.success + stats.skipped) ? '' : ' disabled') + '>清除已完成</button><button type="button" data-action="sku-manual-add-close">关闭</button></div></footer></section></div>';
  }

  function renderManualSkuAddModal(panel) {
    const root = panel || ensurePanel();
    const existing = root && root.querySelector('.pfh-manual-sku-add-layer');
    if (!state.manualSkuAddOpen) {
      if (existing) existing.remove();
      return;
    }
    const active = existing && document.activeElement && existing.contains(document.activeElement)
      ? document.activeElement
      : null;
    const activeInput = active && active.classList.contains('pfh-manual-sku-add-input');
    const selectionStart = activeInput ? active.selectionStart : null;
    const selectionEnd = activeInput ? active.selectionEnd : null;
    const queueScrollTop = existing && existing.querySelector('.pfh-manual-sku-add-queue')
      ? existing.querySelector('.pfh-manual-sku-add-queue').scrollTop
      : 0;
    if (existing) existing.outerHTML = manualSkuAddModalHtml();
    else root.insertAdjacentHTML('beforeend', manualSkuAddModalHtml());
    const next = root.querySelector('.pfh-manual-sku-add-layer');
    const queue = next && next.querySelector('.pfh-manual-sku-add-queue');
    if (queue) queue.scrollTop = queueScrollTop;
    const input = next && next.querySelector('.pfh-manual-sku-add-input');
    if (activeInput && input) {
      input.focus();
      try { input.setSelectionRange(selectionStart, selectionEnd); } catch (_) { /* ignore selection restore */ }
    }
  }

  function openManualSkuAddModal() {
    state.manualSkuAddOpen = true;
    state.manualSkuAddQueue = loadManualSkuAddQueue();
    expandPanel();
    const panel = ensurePanel();
    renderManualSkuAddModal(panel);
    window.setTimeout(() => {
      const input = panel.querySelector('.pfh-manual-sku-add-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  function closeManualSkuAddModal() {
    state.manualSkuAddOpen = false;
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('.pfh-manual-sku-add-layer');
    if (layer) layer.remove();
  }

  function refreshManualSkuAddUi() {
    state.manualSkuAddQueue = loadManualSkuAddQueue();
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const list = panel.querySelector('.pfh-list');
    if (list && state.view !== 'home' && state.view !== 'about' && state.view !== 'ledger' && state.view !== 'upload' && state.view !== 'magicUpload' && state.view !== 'tools' && state.view !== 'batchExcel' && state.view !== 'feedback') {
      const scroll = list.querySelector('.pfh-sku-scroll');
      const scrollTop = scroll ? scroll.scrollTop : 0;
      renderSkuList(panel);
      const nextScroll = list.querySelector('.pfh-sku-scroll');
      if (nextScroll) nextScroll.scrollTop = scrollTop;
    }
    if (state.manualSkuAddOpen) renderManualSkuAddModal(panel);
  }

  function addManualSkuQueueItems(value) {
    const skus = extractManualSkuCodes(value);
    if (!skus.length) {
      showToast('没有找到有效 SKU，请检查编码格式');
      return;
    }
    const queue = loadManualSkuAddQueue();
    const next = queue.slice();
    let addedCount = 0;
    let refreshCount = 0;
    skus.slice(0, MANUAL_SKU_ADD_MAX_ITEMS).forEach((sku) => {
      const existingIndex = next.findIndex((entry) => entry.sku === sku);
      const previous = existingIndex >= 0 ? next[existingIndex] : null;
      const inCatalog = isSkuInCatalog(sku);
      const item = {
        ...(previous || {}),
        sku,
        status: 'pending',
        step: inCatalog ? '等待刷新产品信息和效果图' : '等待后台读取产品信息和效果图',
        error: '',
        updatedAt: Date.now(),
      };
      if (inCatalog) refreshCount += 1;
      else addedCount += existingIndex >= 0 ? 0 : 1;
      if (existingIndex >= 0) next[existingIndex] = item;
      else next.push(item);
    });
    state.manualSkuAddInput = '';
    state.manualSkuAddStatus = '已加入 ' + skus.slice(0, MANUAL_SKU_ADD_MAX_ITEMS).length + ' 个 SKU，等待后台逐个读取产品信息和效果图';
    saveManualSkuAddQueue(next);
    refreshManualSkuAddUi();
    showToast(refreshCount && !addedCount ? '已加入刷新队列：' + refreshCount + ' 个 SKU' : state.manualSkuAddStatus);
    startManualSkuAddQueue();
  }

  function updateManualSkuAddQueueEntry(sku, patch) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const queue = loadManualSkuAddQueue();
    const next = queue.map((entry) => entry.sku === normalizedSku
      ? { ...entry, ...(patch || {}), updatedAt: Date.now() }
      : entry);
    saveManualSkuAddQueue(next);
    refreshManualSkuAddUi();
    return next.find((entry) => entry.sku === normalizedSku) || null;
  }

  function retryManualSkuAddErrors() {
    const queue = loadManualSkuAddQueue();
    const retryable = queue.filter((entry) => entry.status === 'error' || entry.status === 'partial');
    if (!retryable.length) {
      showToast('当前没有需要重试的任务');
      return;
    }
    saveManualSkuAddQueue(queue.map((entry) => retryable.some((item) => item.sku === entry.sku)
      ? { ...entry, status: 'pending', step: '等待重试', error: '' }
      : entry));
    state.manualSkuAddStatus = '已将 ' + retryable.length + ' 个失败任务放回队列';
    refreshManualSkuAddUi();
    startManualSkuAddQueue();
  }

  function clearManualSkuAddCompleted() {
    const queue = loadManualSkuAddQueue();
    const next = queue.filter((entry) => entry.status !== 'success' && entry.status !== 'skipped');
    saveManualSkuAddQueue(next);
    state.manualSkuAddStatus = '已清除完成任务';
    refreshManualSkuAddUi();
  }

  function pauseManualSkuAddQueue() {
    if (!state.manualSkuAddWorkerRunning) return;
    state.manualSkuAddWorkerRunning = false;
    state.manualSkuAddCurrentSku = '';
    const queue = loadManualSkuAddQueue().map((entry) => entry.status === 'processing'
      ? { ...entry, status: 'pending', step: '已暂停，等待继续', error: '' }
      : entry);
    saveManualSkuAddQueue(queue);
    state.manualSkuAddStatus = '队列已暂停，已完成的任务不会回滚';
    refreshManualSkuAddUi();
  }

  function startManualSkuAddQueue() {
    if (manualSkuAddWorkerPromise) return manualSkuAddWorkerPromise;
    const pending = loadManualSkuAddQueue().filter((entry) => entry.status === 'pending');
    if (!pending.length) {
      if (state.manualSkuAddOpen && !state.manualSkuAddStatus) {
        state.manualSkuAddStatus = '当前没有等待处理的任务';
        refreshManualSkuAddUi();
      }
      return Promise.resolve(false);
    }
    state.manualSkuAddWorkerRunning = true;
    state.manualSkuAddStatus = '开始按顺序读取 ' + pending.length + ' 个 SKU';
    refreshManualSkuAddUi();
    manualSkuAddWorkerPromise = processManualSkuAddQueue().catch((error) => {
      state.manualSkuAddStatus = '队列异常：' + formatErrorMessage(error);
      addLog('error', '手动添加 SKU 队列异常', formatErrorMessage(error));
      return false;
    }).finally(() => {
      state.manualSkuAddWorkerRunning = false;
      state.manualSkuAddCurrentSku = '';
      if (!state.manualSkuAddStatus || /^开始按顺序|^正在读取/.test(state.manualSkuAddStatus)) state.manualSkuAddStatus = '手动添加队列已完成';
      manualSkuAddWorkerPromise = null;
      refreshManualSkuAddUi();
    });
    return manualSkuAddWorkerPromise;
  }

  async function processManualSkuAddQueue() {
    while (state.manualSkuAddWorkerRunning) {
      const entry = loadManualSkuAddQueue().find((item) => item.status === 'pending');
      if (!entry) break;
      const sku = entry.sku;
      state.manualSkuAddCurrentSku = sku;
      state.manualSkuAddStatus = '正在读取 ' + sku + ' 的产品信息和效果图';
      updateManualSkuAddQueueEntry(sku, { status: 'processing', step: '正在读取 PLM 产品和项目效果图', error: '' });
      try {
        const result = await addSkuByCode(sku, { force: true });
        if (!isSkuInCatalog(sku)) throw new Error('SKU 未能写入本地列表');
        updateManualSkuAddQueueEntry(sku, {
          status: result && result.enriched ? 'success' : 'partial',
          step: result && result.enriched
            ? (result.effectImageFound ? '产品信息和效果图已更新，并同步今日工作台' : '产品信息已更新，未找到效果图，已使用商品图')
            : '已加入列表和今日工作台，但产品 API 未返回完整信息',
          error: result && result.error || '',
        });
      } catch (error) {
        updateManualSkuAddQueueEntry(sku, { status: 'error', step: '读取或写入失败', error: formatErrorMessage(error) });
        addLog('warn', '手动添加 SKU 失败', sku + ' | ' + formatErrorMessage(error));
      }
      if (state.manualSkuAddWorkerRunning) await wait(MANUAL_SKU_ADD_DELAY_MS);
    }
  }

  function matchesSearchItem(item, tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    if (!queryTokens.length) return true;
    if ([item.sku, item.brand, item.name, item.packageCode, item.printCode, item.developerName, item.projectStatus, item.designType].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)))) return true;
    const data = loadData(item.sku);
    if (!data) return false;
    return [data.brand, data.name, data.packageCode, data.printCode, data.developerName, data.projectStatus, data.designType].some((value) => queryTokens.some((token) => String(value || '').toLowerCase().includes(token)));
  }

  function getSearchMatches(tokens) {
    const queryTokens = Array.isArray(tokens) ? tokens : parseSearchTokens(tokens);
    const sortedItems = getSortedIndex();
    return queryTokens.length ? sortedItems.filter((item) => matchesSearchItem(item, queryTokens)) : sortedItems;
  }

  function exportCache() {
    const payload = buildCachePayload({ includeLocalTranslateImages: true });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-floating-helper-cache-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  function exportInsights() {
    const payload = buildInsightsPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-floating-helper-insights-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    addLog('success', '\u5df2\u5bfc\u51fa\u6570\u636e\u6d1e\u5bdf', payload.exportedAt);
  }

  function buildInsightsPayload() {
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      insights: state.insights || emptyInsights(),
      promptHint: '\u8bf7\u6574\u7406\u4ef7\u683c\u5386\u53f2\u3001\u5546\u54c1\u7c7b\u578b\u89c4\u5f8b\u548c\u5b57\u6bb5\u7f3a\u5931\u539f\u56e0\uff0c\u8f93\u51fa\u9002\u5408\u5bfc\u5165\u8868\u683c\u7684\u7ed3\u6784\u5316\u8868\u683c\u3002',
    };
  }

  async function refreshCloudInsightSummary() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u4e91\u7aef\u6458\u8981...';
    renderShell();
    try {
      const summary = await fetchInsightSummary();
      const totalText = formatCloudInsightTotals(summary && summary.totals);
      const typeCount = summary && Array.isArray(summary.productTypes) ? summary.productTypes.length : 0;
      state.insightCloudStatus = '\u4e91\u7aef\uff1a' + totalText + '\uff0c\u7c7b\u578b ' + typeCount + '\u7c7b';
      addLog('success', '\u4e91\u7aef\u6d1e\u5bdf\u6458\u8981\u5df2\u66f4\u65b0', state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u6458\u8981\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u6458\u8981\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function checkCloudInsightReadiness() {
    state.insightCloudStatus = '\u6b63\u5728\u4f53\u68c0\u4e91\u7aef\u6d1e\u5bdf\u94fe\u8def...';
    renderShell();
    try {
      const response = await fetchInsightReadiness();
      state.insightReadiness = response || null;
      const checks = Array.isArray(response && response.checks) ? response.checks : [];
      const passed = checks.filter((item) => item.ok).length;
      const failed = checks.length - passed;
      const blockers = (response && response.blockers || []).map((item) => item.label + '\uff1a' + item.detail).join(' / ');
      state.insightCloudStatus = (response && response.ready ? '\u6d1e\u5bdf\u94fe\u8def\u5df2\u5c31\u7eea' : '\u6d1e\u5bdf\u94fe\u8def\u672a\u5c31\u7eea') +
        '\uff1a' + passed + '/' + checks.length + '\u9879\u901a\u8fc7' + (failed ? '\uff0c\u7f3a\u53e3 ' + blockers : '');
      copyText(formatInsightReadinessReport(response));
      addLog(response && response.ready ? 'success' : 'warn', '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0', state.insightCloudStatus);
      showToast(state.insightCloudStatus + '\uff0c\u62a5\u544a\u5df2\u590d\u5236');
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  function formatInsightReadinessReport(response) {
    const checks = Array.isArray(response && response.checks) ? response.checks : [];
    const blockers = Array.isArray(response && response.blockers) ? response.blockers : [];
    const totals = response && response.totals ? response.totals : {};
    const lines = [
      'PLM \u4e91\u7aef\u6d1e\u5bdf\u4f53\u68c0',
      '\u751f\u6210\u65f6\u95f4\uff1a' + new Date().toLocaleString(),
      '\u603b\u72b6\u6001\uff1a' + (response && response.ready ? '\u5df2\u5c31\u7eea' : '\u672a\u5c31\u7eea'),
      '\u4e8b\u4ef6\u7edf\u8ba1\uff1a' + Object.keys(totals).map((key) => key + '=' + totals[key]).join(' / '),
      '',
      '\u68c0\u67e5\u9879',
    ];
    checks.forEach((item) => {
      lines.push((item.ok ? '\u901a\u8fc7' : '\u672a\u901a\u8fc7') + '\t' + (item.label || item.key || '') + '\t' + (item.detail || ''));
    });
    lines.push('', '\u963b\u585e\u9879');
    if (blockers.length) {
      blockers.forEach((item) => lines.push((item.label || item.key || '') + '\t' + (item.detail || '')));
    } else {
      lines.push('\u65e0');
    }
    return lines.join('\n');
  }

  async function copyCloudInsightReport() {
    state.insightCloudStatus = '\u6b63\u5728\u751f\u6210\u4e91\u7aef\u603b\u7ed3...';
    renderShell();
    try {
      const response = await fetchInsightReport();
      const report = response && response.report ? response.report : '';
      if (!report) throw new Error('empty report');
      state.insightCloudReport = report;
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5df2\u590d\u5236\uff0c\u53ef\u76f4\u63a5\u8d34\u5230 AI \u6216\u8868\u683c';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u4e91\u7aef\u603b\u7ed3\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u4e91\u7aef\u6d1e\u5bdf\u603b\u7ed3\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function checkCloudInsightAiStatus() {
    state.insightCloudStatus = '\u6b63\u5728\u68c0\u67e5 AI \u914d\u7f6e...';
    renderShell();
    try {
      const response = await fetchInsightAiStatus();
      state.insightCloudStatus = response && response.configured
        ? (response.provider === 'modelscope' && !response.primaryConfigured && response.fallbackConfigured
          ? '\u9b54\u642d Token \u672a\u914d\u7f6e\uff0cGemini \u515c\u5e95\u53ef\u7528'
          : 'AI \u5df2\u914d\u7f6e\uff1a' + [response.provider || '', response.model || ''].filter(Boolean).join(' / '))
        : 'AI \u672a\u914d\u7f6e\uff0c\u5c06\u4f7f\u7528\u89c4\u5219\u7248\u603b\u7ed3';
      addLog(response && response.configured ? 'success' : 'warn', 'AI \u914d\u7f6e\u68c0\u67e5', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = 'AI \u914d\u7f6e\u68c0\u67e5\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u914d\u7f6e\u68c0\u67e5\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function copyCloudInsightAiReport() {
    state.insightCloudStatus = '\u6b63\u5728\u8bf7\u6c42 AI \u6574\u7406\u6570\u636e...';
    renderShell();
    try {
      const response = await fetchInsightAiReport({ refresh: true });
      const report = response && response.report ? response.report : '';
      if (!report) throw new Error('empty ai report');
      state.insightCloudReport = report;
      state.insightCloudStatus = response.source && response.source !== 'fallback'
        ? 'AI \u6574\u7406\u5df2\u590d\u5236'
        : 'AI \u6682\u4e0d\u53ef\u7528\uff0c\u5df2\u590d\u5236\u89c4\u5219\u7248\u603b\u7ed3';
      copyText(report);
      addLog('success', '\u5df2\u590d\u5236 AI \u6d1e\u5bdf\u6574\u7406', response.source || '');
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = 'AI \u6574\u7406\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u6d1e\u5bdf\u6574\u7406\u5931\u8d25', formatErrorMessage(error));
    }
    renderShell();
  }

  async function summarizeCloudClassificationRules() {
    const samples = collectUnclassifiedClassificationSamples(300);
    if (!samples.length) {
      state.insightCloudStatus = '\u6682\u65e0\u672a\u5206\u7c7b\u4ea7\u54c1';
      renderShell();
      showToast(state.insightCloudStatus);
      return;
    }
    state.insightCloudStatus = '\u6b63\u5728\u8ba9 AI \u603b\u7ed3\u524d ' + samples.length + ' \u6761\u672a\u5206\u7c7b\u4ea7\u54c1...';
    renderShell();
    try {
      const response = await fetchClassificationSummarize(samples);
      const rules = Array.isArray(response && response.rules) ? response.rules : [];
      state.classificationRules = rules;
      const warning = response && response.warning ? '\uff0c\u515c\u5e95\uff1a' + response.warning : '';
      state.insightCloudStatus = '\u5206\u7c7b\u89c4\u5219\u5df2\u751f\u6210\uff1a' + rules.length + '\u6761\uff0c\u672a\u5206\u7c7b\u6837\u672c ' + (response.sampleCount || 0) + '\u6761\uff0c\u6765\u6e90 ' + (response.sampleSource || response.source || '') + warning;
      addLog(response && response.warning ? 'warn' : 'success', 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', 'AI \u603b\u7ed3\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  function collectUnclassifiedClassificationSamples(limit) {
    const result = [];
    (state.index || []).some((item) => {
      if (result.length >= (Number(limit) || 300)) return true;
      const sku = item && item.sku ? String(item.sku) : '';
      if (!sku) return false;
      const data = normalizeData(loadData(sku) || item);
      if (!data || !data.sku) return false;
      const explicitType = String(data.aiProductType || data.aiCategory || '').trim();
      if (explicitType && !/^\u672a\u5206\u7c7b$/i.test(explicitType)) return false;
      const name = String(data.name || item.name || '').trim();
      if (!name) return false;
      result.push({ sku: data.sku, brand: data.brand || '', name, productType: '' });
      return false;
    });
    return result;
  }

  async function viewCloudClassificationRules() {
    state.insightCloudStatus = '\u6b63\u5728\u62c9\u53d6\u5206\u7c7b\u89c4\u5219...';
    renderShell();
    try {
      const response = await fetchClassificationRules();
      const rules = Array.isArray(response && response.rules) ? response.rules : [];
      state.classificationRules = rules;
      const text = formatClassificationRulesForCopy(rules);
      copyText(text || '\u6682\u65e0\u5206\u7c7b\u89c4\u5219');
      state.insightCloudStatus = '\u5206\u7c7b\u89c4\u5219\u5df2\u590d\u5236\uff1a' + rules.length + '\u6761';
      addLog('success', '\u5df2\u67e5\u770b\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(L.copied);
    } catch (error) {
      state.insightCloudStatus = '\u67e5\u770b\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u67e5\u770b\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  async function applyCloudClassificationRulesToLocal() {
    state.insightCloudStatus = '\u6b63\u5728\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219...';
    renderShell();
    try {
      let rules = Array.isArray(state.classificationRules) && state.classificationRules.length ? state.classificationRules : [];
      if (!rules.length) {
        const response = await fetchClassificationRules();
        rules = Array.isArray(response && response.rules) ? response.rules : [];
        state.classificationRules = rules;
      }
      const result = applyClassificationRulesToLocalCache(rules);
      state.insightCloudStatus = '\u5df2\u91cd\u65b0\u5e94\u7528\u89c4\u5219\uff1a\u66f4\u65b0 ' + result.updated + '/' + result.total + '\u4e2a\u7f16\u7801';
      addLog('success', '\u5df2\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219', state.insightCloudStatus);
      showToast(state.insightCloudStatus);
    } catch (error) {
      state.insightCloudStatus = '\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219\u5931\u8d25\uff1a' + formatErrorMessage(error);
      addLog('warn', '\u91cd\u65b0\u5e94\u7528\u5206\u7c7b\u89c4\u5219\u5931\u8d25', formatErrorMessage(error));
      showToast(state.insightCloudStatus);
    }
    renderShell();
  }

  function formatCloudInsightTotals(totals) {
    if (!Array.isArray(totals) || !totals.length) return '\u6682\u65e0\u4e8b\u4ef6';
    return totals.map((item) => {
      const label = item.event_type === 'price' ? '\u4ef7\u683c' : (item.event_type === 'issue' ? '\u5f02\u5e38' : item.event_type);
      return label + ' ' + item.count;
    }).join(' / ');
  }

  function getTodayKey() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  function normalizeLedgerDate(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return '';
    return [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('-');
  }

  function shiftDateKey(value, delta) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const date = new Date(key + 'T00:00:00');
    date.setDate(date.getDate() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function shiftLedgerMonth(value, delta) {
    const month = normalizeLedgerMonth(value || getTodayKey());
    const match = month.match(/^(\d{4})-(\d{2})$/);
    const date = new Date(match ? Number(match[1]) : new Date().getFullYear(), match ? Number(match[2]) - 1 : new Date().getMonth(), 1);
    date.setMonth(date.getMonth() + Number(delta || 0));
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), '01'].join('-');
  }

  function formatLedgerDateLabel(value) {
    const key = normalizeLedgerDate(value) || getTodayKey();
    const parts = key.split('-');
    return Number(parts[1]) + '\u6708' + Number(parts[2]) + '\u65e5';
  }

  function formatLedgerMinuteLabel(value, fallbackDate) {
    const ms = parseLedgerDateTimeMs(value);
    if (ms) {
      const date = new Date(ms);
      return (date.getMonth() + 1) + '\u6708' + date.getDate() + '\u65e5 ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
    return formatLedgerDateLabel(fallbackDate || value);
  }

  function getNowLedgerMinuteLabel() {
    return formatLedgerMinuteLabel(Date.now());
  }

  function parseLedgerDateTimeMs(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    const text = String(value || '').trim();
    if (!text || text === '--') return 0;
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (full) {
      const date = new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]), Number(full[4] || 0), Number(full[5] || 0), 0, 0);
      return date.getTime();
    }
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5(?:\s+(\d{1,2})[:\uff1a](\d{1,2}))?/);
    if (cn) {
      const date = new Date(new Date().getFullYear(), Number(cn[1]) - 1, Number(cn[2]), Number(cn[3] || 0), Number(cn[4] || 0), 0, 0);
      return date.getTime();
    }
    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function parseLedgerDateFromText(value) {
    const text = String(value || '').trim();
    if (!text || text === '--') return '';
    const full = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (full) return [full[1], full[2].padStart(2, '0'), full[3].padStart(2, '0')].join('-');
    const cn = text.match(/(\d{1,2})\s*\u6708\s*(\d{1,2})\s*\u65e5/);
    if (cn) return [String(new Date().getFullYear()), cn[1].padStart(2, '0'), cn[2].padStart(2, '0')].join('-');
    return normalizeLedgerDate(text);
  }

  function getMonthKeyFromDateKey(value) {
    const key = normalizeLedgerDate(value) || parseLedgerDateFromText(value) || getTodayKey();
    return key.slice(0, 7);
  }

  function normalizeLedgerMonth(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})-(\d{1,2})$/);
    if (match) return match[1] + '-' + match[2].padStart(2, '0');
    return getMonthKeyFromDateKey(text);
  }

  function getCurrentLedgerMonth() {
    return normalizeLedgerMonth(state.ledgerDate || getTodayKey());
  }

  function getLedgerDesignDate(record) {
    return parseLedgerDateFromText(record && record.designAssignedAt) || normalizeLedgerDate(record && record.date) || getTodayKey();
  }

  function getLedgerFinalizedDate(record) {
    return normalizeLedgerDate(record && record.finalizedDate)
      || parseLedgerDateFromText(record && record.finalizedAt)
      || (record && record.status === '作废' ? parseLedgerDateFromText(record.updatedAt) : '')
      || getLedgerDesignDate(record);
  }

  function isLedgerFinalizedRecord(record) {
    return Boolean(record && (record.finalizedAt || record.status === '作废'));
  }

  function loadDailyLedger() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_KEY) || 'null');
      return sanitizeLedgerRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedger() {
    try {
      state.ledgerRecords = sanitizeLedgerRecords(state.ledgerRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_KEY, state.ledgerRecords);
      else localStorage.setItem(DAILY_LEDGER_KEY, JSON.stringify(state.ledgerRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger save failed:', error);
    }
  }

  function loadLedgerSeriesExcludedSkus() {
    try {
      const saved = typeof GM_getValue === 'function'
        ? GM_getValue(DAILY_LEDGER_SERIES_EXCLUDED_KEY, null)
        : JSON.parse(localStorage.getItem(DAILY_LEDGER_SERIES_EXCLUDED_KEY) || 'null');
      return new Set((Array.isArray(saved) ? saved : []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean));
    } catch (error) {
      return new Set();
    }
  }

  function saveLedgerSeriesExcludedSkus() {
    const values = Array.from(state.ledgerSeriesExcludedSkus || []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean).slice(0, 1200);
    try {
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_SERIES_EXCLUDED_KEY, values);
      else localStorage.setItem(DAILY_LEDGER_SERIES_EXCLUDED_KEY, JSON.stringify(values));
    } catch (error) {
      console.warn('PLM floating helper ledger series exclusion save failed:', error);
    }
  }

  function startDailyLedgerSync() {
    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(DAILY_LEDGER_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerRecords = filterLedgerRecordsNotInTrash(newValue);
        if (state.view === 'ledger') renderShell();
      });
      GM_addValueChangeListener(DAILY_LEDGER_TRASH_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerTrashRecords = sanitizeLedgerTrashRecords(newValue);
        state.ledgerRecords = filterLedgerRecordsNotInTrash(state.ledgerRecords);
        if (state.view === 'ledger') renderShell();
      });
      GM_addValueChangeListener(DAILY_LEDGER_SERIES_EXCLUDED_KEY, (_name, _oldValue, newValue, remote) => {
        if (!remote) return;
        state.ledgerSeriesExcludedSkus = new Set((Array.isArray(newValue) ? newValue : []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean));
        if (state.view === 'ledger') renderShell();
      });
    }
    window.addEventListener('storage', (event) => {
      if (typeof GM_getValue === 'function') return;
      try {
        if (event.key === DAILY_LEDGER_SERIES_EXCLUDED_KEY) {
          const values = JSON.parse(event.newValue || '[]');
          state.ledgerSeriesExcludedSkus = new Set((Array.isArray(values) ? values : []).map((sku) => String(sku || '').trim().toUpperCase()).filter(Boolean));
        } else if (event.key === DAILY_LEDGER_KEY) {
          state.ledgerRecords = filterLedgerRecordsNotInTrash(JSON.parse(event.newValue || '[]'));
        } else {
          return;
        }
        if (state.view === 'ledger') renderShell();
      } catch (_) {}
    });
  }

  function syncDailyLedgerBeforeMutation() {
    state.ledgerTrashRecords = loadDailyLedgerTrash();
    state.ledgerRecords = filterLedgerRecordsNotInTrash(loadDailyLedger()).slice(0, 1200);
  }

  function loadDailyLedgerTrash() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(DAILY_LEDGER_TRASH_KEY, null) : JSON.parse(localStorage.getItem(DAILY_LEDGER_TRASH_KEY) || 'null');
      return sanitizeLedgerTrashRecords(saved);
    } catch (error) {
      return [];
    }
  }

  function saveDailyLedgerTrash() {
    try {
      state.ledgerTrashRecords = sanitizeLedgerTrashRecords(state.ledgerTrashRecords);
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_TRASH_KEY, state.ledgerTrashRecords);
      else localStorage.setItem(DAILY_LEDGER_TRASH_KEY, JSON.stringify(state.ledgerTrashRecords));
      queueCloudBackup();
    } catch (error) {
      console.warn('PLM floating helper daily ledger trash save failed:', error);
    }
  }

  function sanitizeLedgerTrashRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => {
      const record = sanitizeLedgerRecords([item])[0];
      if (!record) return null;
      return {
        ...record,
        removedAt: String(item.removedAt || item.updatedAt || new Date().toLocaleString()).slice(0, 80),
        removedAtMs: Number(item.removedAtMs || item.updatedAtMs || 0) || Date.now(),
        purged: Boolean(item.purged),
      };
    }).filter(Boolean);
  }

  function isLedgerRecordTrashed(sku, dateKey) {
    const month = getMonthKeyFromDateKey(normalizeLedgerDate(dateKey) || getTodayKey());
    return (state.ledgerTrashRecords || []).some((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month);
  }

  function filterLedgerRecordsNotInTrash(records) {
    return sanitizeLedgerRecords(records).filter((item) => !isLedgerRecordTrashed(item.sku, item.date));
  }

  function sanitizeLedgerRecords(records) {
    const normalized = (Array.isArray(records) ? records : []).slice(0, 1200).map((item) => ({
      date: normalizeLedgerDate(item.date) || getTodayKey(),
      sku: String(item.sku || '').slice(0, 80),
      brand: cleanName(item.brand || '').slice(0, 120),
      name: cleanName(item.name || '').slice(0, 220),
      skuImageUrl: String(item.skuImageUrl || '').slice(0, 600),
      benchmarkImageUrl: String(item.benchmarkImageUrl || '').slice(0, 600),
      designType: cleanName(item.designType || '').slice(0, 80),
      artPriority: cleanName(item.artPriority || '').slice(0, 80),
      referenceUrl: String(item.referenceUrl || '').slice(0, 800),
      developerName: cleanName(item.developerName || '').slice(0, 80),
      designAssignedAt: String(item.designAssignedAt || '').slice(0, 80),
      developmentAssignedAt: String(item.developmentAssignedAt || '').slice(0, 80),
      performanceGroupId: String(item.performanceGroupId || '').slice(0, 80),
      performanceGroupMode: item.performanceGroupMode === 'series' ? 'series' : '',
      performanceType: item.performanceType === 'extension' ? 'extension' : '',
      seriesExcluded: Boolean(item.seriesExcluded),
      isToy: Boolean(item.isToy),
      packageCode: String(item.packageCode || '').slice(0, 120),
      printCode: String(item.printCode || '').slice(0, 180),
      purchasePrice: normalizeLedgerPurchasePrice(item.purchasePrice),
      boxFileState: normalizeLedgerFileState(item.boxFileState, item.boxFileDone),
      labelFileState: normalizeLedgerFileState(item.labelFileState, item.labelFileDone),
      imagePackState: normalizeLedgerFileState(item.imagePackState, item.imagePackDone),
      artworkState: normalizeLedgerArtworkState(item.artworkState),
      aiImageStatus: normalizeLedgerAiImageStatus(item.aiImageStatus, item.aiImageMessage),
      aiImageMessage: String(item.aiImageMessage || '').slice(0, 180),
      aiImageJobId: String(item.aiImageJobId || '').slice(0, 120),
      aiImageCheckedAtMs: Number(item.aiImageCheckedAtMs || 0) || 0,
      aiMainImages: normalizeLedgerAiImageItems(item.aiMainImages, 12),
      aiDetailImages: normalizeLedgerAiImageItems(item.aiDetailImages, 20),
      aiMainRetouchedImages: normalizeLedgerAiImageItems(item.aiMainRetouchedImages || item.aiMainEditedImages, LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiDetailRetouchedImages: normalizeLedgerAiImageItems(item.aiDetailRetouchedImages || item.aiDetailEditedImages, LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiMainRetouchTasks: normalizeLedgerAiImageRetouchTasks(item.aiMainRetouchTasks, LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiDetailRetouchTasks: normalizeLedgerAiImageRetouchTasks(item.aiDetailRetouchTasks, LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiMainHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(item.aiMainHiddenImageKeys, LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetailHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(item.aiDetailHiddenImageKeys, LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetail3Audit: normalizeLedgerDetail3Audit(item.aiDetail3Audit),
      boxFileDone: normalizeLedgerFileState(item.boxFileState, item.boxFileDone) === 'done',
      labelFileDone: normalizeLedgerFileState(item.labelFileState, item.labelFileDone) === 'done',
      imagePackDone: normalizeLedgerFileState(item.imagePackState, item.imagePackDone) === 'done',
      filesAutoCompleted: Boolean(item.filesAutoCompleted),
      status: normalizeLedgerStatus(item.status),
      stage: String(item.stage || '').slice(0, 80) || '待定稿',
      imageGeneratedAt: String(item.imageGeneratedAt || '').slice(0, 40),
      imageGeneratedAtMs: Number(item.imageGeneratedAtMs || 0) || parseLedgerDateTimeMs(item.imageGeneratedAt) || 0,
      finalizedAt: String(item.finalizedAt || '').slice(0, 40),
      finalizedDate: normalizeLedgerDate(item.finalizedDate) || '',
      finalizedAtMs: Number(item.finalizedAtMs || 0) || parseLedgerDateTimeMs(item.finalizedAt) || 0,
      note: String(item.note || '').slice(0, 240),
      createdAt: String(item.createdAt || new Date().toLocaleString()).slice(0, 80),
      createdAtMs: Number(item.createdAtMs || item.updatedAtMs || 0) || Date.now(),
      updatedAt: String(item.updatedAt || new Date().toLocaleString()).slice(0, 80),
      updatedAtMs: Number(item.updatedAtMs || 0) || Date.now(),
    })).map(reconcileLedgerFileCompletion).filter((item) => item.sku);
    return dedupeLedgerRecords(normalized);
  }

  function normalizeLedgerFileState(value, doneFallback) {
    const text = String(value || '').trim();
    if (/^(pending|done|skip)$/.test(text)) return text;
    if (/^(?:\u5b8c\u6210|\u5df2\u5b8c\u6210|done)$/i.test(text)) return 'done';
    if (/^(?:\u4e0d\u9700\u8981|\u65e0\u9700|\u8df3\u8fc7|skip)$/i.test(text)) return 'skip';
    return doneFallback ? 'done' : 'pending';
  }

  function normalizeLedgerArtworkState(value) {
    return /^(pending|doing|done)$/.test(String(value || '')) ? String(value) : 'pending';
  }

  function isLedgerAiImageCopywritingError(value) {
    return /缺少产品文案|产品文案.{0,12}(缺少|为空|不存在)|missing.{0,18}copy(?:writing|write)/i.test(String(value || ''));
  }

  function isLedgerAiImageSkuImageError(value) {
    const text = String(value || '');
    return /(?:缺少|缺失|为空|未找到|无法确认|未检测到)[^。\n]{0,28}(?:SKU\s*(?:效果图|图)|SKU图)/i.test(text)
      || /(?:SKU\s*(?:效果图|图)|SKU图)[^。\n]{0,28}(?:缺少|缺失|为空|未找到|无法确认|未检测到)/i.test(text);
  }

  function normalizeLedgerAiImageStatus(value, message) {
    const status = String(value || '').trim();
    if (status === 'error') {
      const copywritingError = isLedgerAiImageCopywritingError(message);
      const skuImageError = isLedgerAiImageSkuImageError(message);
      if (copywritingError && skuImageError) return 'needs-prerequisites';
      if (skuImageError) return 'needs-sku-image';
      if (copywritingError) return 'needs-copywriting';
    }
    return /^(unknown|loading|running|success|empty|error|needs-copywriting|needs-sku-image|needs-prerequisites|task-error|result-missing)$/.test(status) ? status : 'unknown';
  }

  function getLedgerAiImageSourceFilename(item) {
    const source = item && typeof item === 'object' ? item : { url: item };
    const explicit = String(source.filename || source.fileName || source.baseFilename || source.originalFilename || '').trim();
    const raw = explicit || String(source.url || source.imageUrl || source.path || source.sourceUrl || source.baseUrl || '').trim();
    if (!raw) return '';
    let filename = raw;
    try {
      if (/^https?:/i.test(raw)) filename = new URL(raw, window.location.origin).pathname.split('/').pop() || raw;
    } catch (_) {
      filename = raw;
    }
    filename = filename.split(/[\\/]/).pop() || filename;
    filename = filename.split(/[?#]/)[0] || filename;
    try { return decodeURIComponent(filename).trim(); } catch (_) { return filename.trim(); }
  }

  function getLedgerAiImageFilenameStem(item) {
    return getLedgerAiImageSourceFilename(item).replace(/\.[^.]+$/, '').trim();
  }

  function getLedgerAiImageSequence(item) {
    const source = item && typeof item === 'object' ? item : { url: item };
    const stem = getLedgerAiImageFilenameStem(source);
    const names = [
      source.displayName,
      source.logicalName,
      source.slotName,
      source.baseFilename,
      source.originalFilename,
      source.filename,
      stem,
    ].map((value) => String(value || '').trim()).filter(Boolean);
    const labelPattern = /(?:主图|详情图)\s*[-_# ]*(\d+)/;
    for (const name of names) {
      const match = name.match(labelPattern);
      const sequence = Number(match && match[1]);
      if (Number.isFinite(sequence) && sequence > 0) return Math.floor(sequence);
    }
    const rule = stem && LEDGER_AI_IMAGE_RENAME_RULES.find((candidate) => candidate.pattern.test(stem));
    const ruleSequence = String(rule && rule.name || '').match(/(\d+)$/);
    if (ruleSequence) return Number(ruleSequence[1]);
    const explicit = [source.sequence, source.sortIndex]
      .map((value) => Number(value))
      .find((value) => Number.isFinite(value) && value > 0);
    if (explicit) return Math.floor(explicit);
    const patterns = [
      /(?:^|[-_ ])(?:main|detail)[-_ ]*(\d+)/i,
      /(?:main|detail)[-_ ]*prompt[-_ ]*(\d+)/i,
      /prompt[-_ ]*(\d+)/i,
    ];
    for (const name of names) {
      for (const pattern of patterns) {
        const match = name.match(pattern);
        const sequence = Number(match && match[1]);
        if (Number.isFinite(sequence) && sequence > 0) return Math.floor(sequence);
      }
    }
    const positional = [source.order, source.index]
      .map((value) => Number(value))
      .find((value) => Number.isFinite(value) && value > 0);
    return positional ? Math.floor(positional) : 0;
  }

  function compareLedgerAiImageItems(left, right) {
    const leftSequence = getLedgerAiImageSequence(left);
    const rightSequence = getLedgerAiImageSequence(right);
    if (leftSequence && rightSequence && leftSequence !== rightSequence) return leftSequence - rightSequence;
    if (leftSequence !== rightSequence) return leftSequence ? -1 : 1;
    const leftCreated = Number(left && left.createdAtMs || 0);
    const rightCreated = Number(right && right.createdAtMs || 0);
    if (leftCreated && rightCreated && leftCreated !== rightCreated) return leftCreated - rightCreated;
    return String(getLedgerAiImageSourceFilename(left) || left && left.url || '')
      .localeCompare(String(getLedgerAiImageSourceFilename(right) || right && right.url || ''), 'zh-CN', { numeric: true });
  }

  function getLedgerAiImageDisplayName(item, kind, index) {
    const source = item && typeof item === 'object' ? item : { url: item };
    const explicitDisplayName = String(source.displayName || source.logicalName || source.slotName || '').trim();
    if (explicitDisplayName) return explicitDisplayName.replace(/\.[^.]+$/, '');
    const sequence = getLedgerAiImageSequence(source);
    const fallback = (kind === 'detail' ? '详情图' : '主图') + (sequence || Number(index) + 1);
    const stem = getLedgerAiImageFilenameStem(item);
    const rule = stem && LEDGER_AI_IMAGE_RENAME_RULES.find((candidate) => candidate.pattern.test(stem));
    return rule ? rule.name : fallback;
  }

  function getLedgerAiImageExtension(item, blob) {
    const sourceFilename = getLedgerAiImageSourceFilename(item);
    const filenameMatch = sourceFilename.match(/\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i);
    if (filenameMatch) return '.' + filenameMatch[1].toLowerCase();
    const type = String(blob && blob.type || '').toLowerCase().split(';')[0];
    const typeMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/bmp': '.bmp',
      'image/avif': '.avif',
      'image/svg+xml': '.svg',
    };
    return typeMap[type] || '.png';
  }

  function normalizeLedgerAiImageItems(value, limit) {
    const max = Number(limit) > 0 ? Number(limit) : 12;
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map((item, sourceIndex) => {
      const source = item && typeof item === 'object' ? item : { url: item };
      const rawUrl = String(source.url || source.imageUrl || source.path || '').trim();
      if (!rawUrl) return null;
      let url = '';
      try {
        const parsed = new URL(rawUrl, window.location.origin);
        if (!/^https?:$/.test(parsed.protocol)) return null;
        url = parsed.href;
      } catch (_) {
        return null;
      }
      if (url.length > 1600 || seen.has(url)) return null;
      seen.add(url);
      const fallbackName = url.split('/').pop().split('?')[0];
      const normalized = {
        url,
        filename: String(source.filename || source.fileName || fallbackName || '').slice(0, 180),
      };
      const displayName = String(source.displayName || source.logicalName || source.slotName || '').trim();
      const baseUrl = String(source.baseUrl || source.originalUrl || '').trim();
      const parentUrl = String(source.parentUrl || source.sourceUrl || '').trim();
      const baseFilename = String(source.baseFilename || source.originalFilename || '').trim();
      const prompt = String(source.prompt || '').trim();
      const createdAt = String(source.createdAt || '').trim();
      const createdAtMs = Number(source.createdAtMs || 0) || 0;
      const sequence = getLedgerAiImageSequence(source);
      if (displayName) normalized.displayName = displayName.slice(0, 80);
      if (baseUrl) normalized.baseUrl = baseUrl.slice(0, 1600);
      if (parentUrl) normalized.parentUrl = parentUrl.slice(0, 1600);
      if (baseFilename) normalized.baseFilename = baseFilename.slice(0, 180);
      if (prompt) normalized.prompt = prompt.slice(0, 1000);
      if (createdAt) normalized.createdAt = createdAt.slice(0, 80);
      if (createdAtMs) normalized.createdAtMs = createdAtMs;
      if (sequence) normalized.sequence = sequence;
      normalized._sourceIndex = sourceIndex;
      return normalized;
    }).filter(Boolean).sort((left, right) => {
      const compared = compareLedgerAiImageItems(left, right);
      return compared || left._sourceIndex - right._sourceIndex;
    }).map((item) => {
      const normalized = { ...item };
      delete normalized._sourceIndex;
      return normalized;
    }).filter(Boolean).slice(0, max);
  }

  function normalizeLedgerAiImageHiddenKeys(value, limit) {
    const max = Number(limit) > 0 ? Number(limit) : LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS;
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map((item) => {
      const raw = String(item || '').trim();
      if (!raw) return '';
      if (/^task:/i.test(raw)) {
        const id = raw.slice(raw.indexOf(':') + 1).trim().slice(0, 180);
        return id ? 'task:' + id : '';
      }
      const imageRaw = /^image:/i.test(raw) ? raw.slice(raw.indexOf(':') + 1).trim() : raw;
      const normalized = normalizeLedgerAiImageItems([{ url: imageRaw }], 1)[0];
      return normalized ? 'image:' + normalized.url : '';
    }).filter((key) => {
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, max);
  }

  function normalizeLedgerAiImageRetouchTasks(value, limit) {
    const max = Number(limit) > 0 ? Number(limit) : LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS;
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map((item, sourceIndex) => {
      const source = item && typeof item === 'object' ? item : {};
      const sourceUrl = String(source.sourceUrl || source.imageUrl || source.url || '').trim();
      const prompt = String(source.prompt || '').trim();
      if (!sourceUrl || !prompt) return null;
      const id = String(source.id || [sourceUrl, prompt, source.createdAtMs || sourceIndex].join('|')).slice(0, 180);
      if (seen.has(id)) return null;
      seen.add(id);
      const status = /^(running|success|error)$/.test(String(source.status || '')) ? String(source.status) : 'running';
      return {
        id,
        sourceUrl: sourceUrl.slice(0, 1600),
        displayName: String(source.displayName || source.logicalName || source.slotName || '').slice(0, 80),
        baseFilename: String(source.baseFilename || source.originalFilename || '').slice(0, 180),
        sequence: getLedgerAiImageSequence(source) || 0,
        prompt: prompt.slice(0, 1000),
        status,
        error: String(source.error || '').slice(0, 240),
        createdAt: String(source.createdAt || '').slice(0, 80),
        createdAtMs: Number(source.createdAtMs || 0) || 0,
        updatedAtMs: Number(source.updatedAtMs || source.createdAtMs || 0) || 0,
        _sourceIndex: sourceIndex,
      };
    }).filter(Boolean).sort((left, right) => {
      const leftTime = Number(left.createdAtMs || left.updatedAtMs || 0);
      const rightTime = Number(right.createdAtMs || right.updatedAtMs || 0);
      return rightTime - leftTime || left._sourceIndex - right._sourceIndex;
    }).map((item) => {
      const normalized = { ...item };
      delete normalized._sourceIndex;
      return normalized;
    }).slice(0, max);
  }

  function localizeLedgerDetail3AuditText(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^The image contains no ingredient list\b.*verify the expected ingredients/i.test(text)) return '图片中没有成分列表，无法核对预期成分。';
    if (/^No ingredient list is present on the packaging\b.*image/i.test(text)) return '包装或图片文字中没有成分列表。';
    if (/^The English ingredients shown in the image match the expected copy/i.test(text)) return '图片中的英文成分与预期文案一致。';
    if (/^The English ingredient text in the image could not be read reliably/i.test(text)) return '图片中的英文成分文字无法可靠识别。';
    if (/^The ingredient image needs review because discrepancies or generation anomalies were found/i.test(text)) return '成分图存在缺漏、重复或显示异常，需要检查。';
    if (/^The image displays materials instead of cosmetic ingredients/i.test(text)) return '图片中的名称已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/^No English ingredients provided in the expected list/i.test(text)) return '预期成分已按图片中的实际名称进行对照。';
    if (/^The image lists materials\s*\(([^)]+)\) rather than cosmetic ingredients/i.test(text)) return '图片中的名称（' + text.replace(/^The image lists materials\s*\(([^)]+)\).*$/i, '$1') + '）已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/^The image displays materials\s*\(([^)]+)\) rather than cosmetic ingredients/i.test(text)) return '图片中的名称（' + text.replace(/^The image displays materials\s*\(([^)]+)\).*$/i, '$1') + '）已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/^The expected ingredient list provided is in Chinese/i.test(text)) return '预期成分已按图片中的实际名称进行对照。';
    if (/expected ingredient list.*Chinese.*not English/i.test(text)) return '预期成分已按图片中的实际名称进行对照。';
    if (/image (?:text|labels?) is in English/i.test(text)) return '图片中的文字为英文。';
    if (/materials?.*rather than cosmetic ingredients/i.test(text)) return '图片中的名称已按实际文字纳入核对，当前只检查完整显示和重复情况。';
    if (/image type does not match its content|image bytes are not a supported/i.test(text)) return '图片格式与内容不匹配，请重新上传有效的 JPEG、PNG 或 WebP 图片。';
    if (/image is too large/i.test(text)) {
      const limit = (text.match(/max\s+([^\)]+)/i) || [])[1];
      return limit ? '图片文件过大（上限 ' + limit.trim() + '），请压缩图片后重试。' : '图片文件过大，请压缩后重试。';
    }
    if (/insufficient balance/i.test(text)) return 'AI 视觉服务余额不足，请检查服务配置后重试。';
    if (/timeout|operation was aborted/i.test(text)) return 'AI 视觉服务请求超时，请稍后重试。';
    return text;
  }

  function normalizeLedgerDetail3Audit(value) {
    const source = value && typeof value === 'object' ? value : {};
    const list = (items, limit) => Array.from(new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))).slice(0, limit || 30);
    const isIgnoredFinding = (value) => /材料.*(?:化妆品|成分)|materials?.*(?:cosmetic ingredients|rather than)|No English ingredients provided in the expected list|expected ingredient list.*Chinese.*(?:not English|while the image text is English)|预期成分(?:列表为中文|已按图片中的实际名称进行对照)|提供的预期成分列表为中文/i.test(String(value || ''));
    const rawStatus = String(source.status || '').toLowerCase();
    const summary = localizeLedgerDetail3AuditText(String(source.summary || '').slice(0, 500));
    const missing = list(source.missing || source.missingInImage, 40).map(localizeLedgerDetail3AuditText).filter((item) => !isIgnoredFinding(item));
    const duplicates = list(source.duplicates, 40).map(localizeLedgerDetail3AuditText);
    const anomalies = list(source.anomalies || source.visualIssues || source.spellingIssues, 40)
      .map(localizeLedgerDetail3AuditText)
      .filter((item) => !isIgnoredFinding(item));
    const hasExtraFinding = list(source.extra || source.unexpectedInImage, 40).length > 0;
    const ignoredOnlyFinding = [
      source.summary,
      ...(Array.isArray(source.extra) ? source.extra : [source.extra]),
      ...(Array.isArray(source.missing) ? source.missing : [source.missing]),
      ...(Array.isArray(source.anomalies) ? source.anomalies : [source.anomalies]),
    ].some(isIgnoredFinding);
    const status = (ignoredOnlyFinding || hasExtraFinding) && !missing.length && !duplicates.length && !anomalies.length
      ? 'pass'
      : (rawStatus === 'fail' || rawStatus === 'unreadable'
        ? 'warning'
        : (/^(?:idle|loading|pass|warning|error)$/.test(rawStatus) ? rawStatus : 'idle'));
    return {
      status,
      summary,
      imageUrl: String(source.imageUrl || '').slice(0, 1600),
      expectedIngredients: String(source.expectedIngredients || '').slice(0, 4000),
      extractedIngredients: list(source.extractedIngredients || source.recognizedEnglishIngredients, 60),
      missing,
      // Readable labels are valid even when they describe a material rather
      // than a cosmetic ingredient. Do not render legacy category-based
      // "extra/incorrect" findings from older audit responses.
      extra: [],
      duplicates,
      anomalies,
      provider: String(source.provider || '').slice(0, 80),
      model: String(source.model || '').slice(0, 120),
      retryable: Boolean(source.retryable),
      checkedAtMs: Number(source.checkedAtMs || 0) || 0,
    };
  }

  function normalizeLedgerPurchasePrice(value) {
    const text = String(value === undefined || value === null ? '' : value).trim().replace(/^¥\s*/, '');
    if (!text) return '';
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return '';
    const number = Number(text);
    return Number.isFinite(number) && number >= 0 ? String(number) : '';
  }

  function nextLedgerFileState(value, doneFallback) {
    const current = normalizeLedgerFileState(value, doneFallback);
    if (current === 'pending') return 'done';
    if (current === 'done') return 'skip';
    return 'pending';
  }

  function ledgerFileStateLabel(value) {
    const stateValue = normalizeLedgerFileState(value);
    if (stateValue === 'done') return '\u5df2\u5b8c\u6210';
    if (stateValue === 'skip') return '\u4e0d\u9700\u8981\u5236\u4f5c\u6587\u4ef6';
    return '\u672a\u5b8c\u6210';
  }

  function reconcileLedgerFileCompletion(record) {
    const allFilesDone = ['boxFileState', 'labelFileState', 'imagePackState']
      .every((field) => normalizeLedgerFileState(record[field]) === 'done');
    if (record.finalizedAt && record.status === '已定稿' && allFilesDone) {
      return { ...record, status: '已完成', stage: '完成', filesAutoCompleted: true };
    }
    if (record.filesAutoCompleted && record.status === '已完成' && !allFilesDone) {
      return { ...record, status: '已定稿', stage: '已定稿', filesAutoCompleted: false };
    }
    return record;
  }

  function getLedgerSkuKey(value) {
    return String(value || '').trim().toUpperCase();
  }

  function hasLedgerRecordValue(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    return String(value).trim() !== '';
  }

  function getLedgerRecordActivityMs(record) {
    const candidates = [
      record && record.updatedAtMs,
      record && record.updatedAt,
      record && record.finalizedAtMs,
      record && record.finalizedAt,
      record && record.createdAtMs,
      record && record.createdAt,
      record && record.date,
    ];
    for (const candidate of candidates) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
      const parsed = parseLedgerDateTimeMs(candidate);
      if (parsed > 0) return parsed;
    }
    return 0;
  }

  function getLedgerRecordFinalizedMs(record) {
    const numeric = Number(record && record.finalizedAtMs);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const parsed = parseLedgerDateTimeMs(record && record.finalizedAt);
    return parsed || getLedgerRecordActivityMs(record);
  }

  function getLedgerRecordCreatedMs(record) {
    const numeric = Number(record && record.createdAtMs);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return parseLedgerDateTimeMs(record && record.createdAt) || getLedgerRecordActivityMs(record);
  }

  function mergeLedgerFileStates(records, field) {
    const states = records.map((item) => normalizeLedgerFileState(item && item[field]));
    if (states.includes('done')) return 'done';
    if (states.includes('skip')) return 'skip';
    return 'pending';
  }

  function mergeLedgerArtworkStates(records) {
    const states = records.map((item) => normalizeLedgerArtworkState(item && item.artworkState));
    if (states.includes('done')) return 'done';
    if (states.includes('doing')) return 'doing';
    return 'pending';
  }

  function mergeLedgerRecordGroup(records) {
    const items = (Array.isArray(records) ? records : []).filter((item) => item && item.sku);
    if (!items.length) return null;
    const finalizedItems = items.filter(isLedgerFinalizedRecord);
    const candidates = (finalizedItems.length ? finalizedItems : items).slice().sort((a, b) => {
      const timeA = finalizedItems.length ? getLedgerRecordFinalizedMs(a) : getLedgerRecordActivityMs(a);
      const timeB = finalizedItems.length ? getLedgerRecordFinalizedMs(b) : getLedgerRecordActivityMs(b);
      return timeB - timeA;
    });
    const winner = candidates[0] || items[0];
    const recentItems = items.slice().sort((a, b) => getLedgerRecordActivityMs(b) - getLedgerRecordActivityMs(a));
    const merged = { ...winner };
    [
      'brand', 'name', 'skuImageUrl', 'benchmarkImageUrl', 'designType', 'artPriority',
      'referenceUrl', 'developerName', 'developmentAssignedAt', 'performanceGroupId', 'performanceGroupMode',
      'packageCode', 'printCode', 'purchasePrice', 'imageGeneratedAt', 'imageGeneratedAtMs',
      'aiImageStatus', 'aiImageMessage', 'aiImageJobId', 'aiImageCheckedAtMs', 'aiMainImages', 'aiDetailImages',
      'aiMainRetouchedImages', 'aiDetailRetouchedImages', 'aiMainRetouchTasks', 'aiDetailRetouchTasks',
      'aiMainHiddenImageKeys', 'aiDetailHiddenImageKeys',
      'aiDetail3Audit',
    ].forEach((field) => {
      const source = recentItems.find((item) => hasLedgerRecordValue(item[field]));
      if (source) merged[field] = source[field];
    });
    if (!merged.performanceType) {
      const extension = recentItems.find((item) => item.performanceType === 'extension');
      if (extension) merged.performanceType = 'extension';
    }
    merged.seriesExcluded = items.some((item) => Boolean(item.seriesExcluded));
    merged.isToy = items.some((item) => Boolean(item.isToy));
    merged.boxFileState = mergeLedgerFileStates(items, 'boxFileState');
    merged.labelFileState = mergeLedgerFileStates(items, 'labelFileState');
    merged.imagePackState = mergeLedgerFileStates(items, 'imagePackState');
    merged.artworkState = mergeLedgerArtworkStates(items);
    merged.boxFileDone = merged.boxFileState === 'done';
    merged.labelFileDone = merged.labelFileState === 'done';
    merged.imagePackDone = merged.imagePackState === 'done';
    if (!hasLedgerRecordValue(merged.note)) {
      const noteSource = recentItems.find((item) => hasLedgerRecordValue(item.note));
      if (noteSource) merged.note = noteSource.note;
    }
    const oldest = items.slice().sort((a, b) => getLedgerRecordCreatedMs(a) - getLedgerRecordCreatedMs(b))[0];
    const latest = recentItems[0];
    if (oldest && hasLedgerRecordValue(oldest.createdAt)) merged.createdAt = oldest.createdAt;
    if (oldest && hasLedgerRecordValue(oldest.createdAtMs)) merged.createdAtMs = oldest.createdAtMs;
    if (latest && hasLedgerRecordValue(latest.updatedAt)) merged.updatedAt = latest.updatedAt;
    if (latest && hasLedgerRecordValue(latest.updatedAtMs)) merged.updatedAtMs = latest.updatedAtMs;
    return reconcileLedgerFileCompletion(merged);
  }

  function dedupeLedgerRecords(records) {
    const groups = new Map();
    (Array.isArray(records) ? records : []).forEach((record) => {
      const key = getLedgerSkuKey(record && record.sku);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });
    const output = [];
    groups.forEach((items) => {
      if (items.some(isLedgerFinalizedRecord)) {
        const merged = mergeLedgerRecordGroup(items);
        if (merged) output.push(merged);
        return;
      }
      const months = new Map();
      items.forEach((item) => {
        const month = getMonthKeyFromDateKey(item.date);
        if (!months.has(month)) months.set(month, []);
        months.get(month).push(item);
      });
      months.forEach((monthItems) => {
        const merged = mergeLedgerRecordGroup(monthItems);
        if (merged) output.push(merged);
      });
    });
    return output.sort((a, b) => getLedgerRecordActivityMs(b) - getLedgerRecordActivityMs(a)).slice(0, 1200);
  }

  function normalizeLedgerStatus(value) {
    const text = String(value || '').trim();
    return /^(待出图|待定稿|已定稿|制作中|已完成|异常|作废|跳过)$/.test(text) ? text : '待定稿';
  }

  function getLedgerRecordsForMonth(view, monthKey) {
    const month = normalizeLedgerMonth(monthKey || getTodayKey());
    if (view === 'trash') {
      return (state.ledgerTrashRecords || [])
        .filter((item) => !item.purged && getMonthKeyFromDateKey(item.date) === month)
        .sort((a, b) => (b.removedAtMs || b.updatedAtMs || 0) - (a.removedAtMs || a.updatedAtMs || 0));
    }
    const mode = view === 'finalized' ? 'finalized' : 'design';
    return (state.ledgerRecords || [])
      .filter((item) => {
        const finalized = isLedgerFinalizedRecord(item);
        if (mode === 'finalized' && !finalized) return false;
        if (mode === 'design' && finalized) return false;
        const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
        return getMonthKeyFromDateKey(key) === month;
      })
      .sort((a, b) => {
        const dateA = mode === 'finalized' ? getLedgerFinalizedDate(a) : getLedgerDesignDate(a);
        const dateB = mode === 'finalized' ? getLedgerFinalizedDate(b) : getLedgerDesignDate(b);
        if (dateA !== dateB) return dateA < dateB ? 1 : -1;
        if (mode === 'finalized') return (b.finalizedAtMs || b.createdAtMs || 0) - (a.finalizedAtMs || a.createdAtMs || 0);
        return (b.createdAtMs || b.updatedAtMs || 0) - (a.createdAtMs || a.updatedAtMs || 0);
      });
  }

  function groupLedgerRecordsByDate(records, view) {
    const mode = view === 'finalized' ? 'finalized' : 'design';
    const map = new Map();
    (records || []).forEach((item) => {
      const key = mode === 'finalized' ? getLedgerFinalizedDate(item) : getLedgerDesignDate(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }

  function shouldSkipLedgerDrawer(drawer) {
    const text = drawer ? compactText(getVisibleText(drawer)).replace(/\s+/g, '') : '';
    return /已完成|已作废|已拒绝/.test(text);
  }

  function hasMeaningfulLedgerRecordChange(previous, next) {
    const ignored = new Set(['updatedAt', 'updatedAtMs']);
    const comparable = (record) => Object.keys(record || {}).sort().reduce((result, key) => {
      if (!ignored.has(key)) result[key] = record[key];
      return result;
    }, {});
    return JSON.stringify(comparable(previous)) !== JSON.stringify(comparable(next));
  }

  function upsertDailyLedgerFromData(data, options) {
    if (!data || !data.sku) return null;
    const opts = options || {};
    if (!opts.skipStorageSync) syncDailyLedgerBeforeMutation();
    const assignedDate = parseLedgerDateFromText(data.designAssignedAt);
    const dateKey = normalizeLedgerDate(opts.date) || assignedDate || getTodayKey();
    if (opts.requireCurrentMonth && assignedDate && getMonthKeyFromDateKey(dateKey) !== getMonthKeyFromDateKey(getTodayKey())) return null;
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    const sku = data.sku;
    const dateMonth = getMonthKeyFromDateKey(dateKey);
    if (!opts.allowTrashRestore && isLedgerRecordTrashed(sku, dateKey)) return null;
    const existingInMonth = (state.ledgerRecords || []).find((item) => getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku) && getMonthKeyFromDateKey(item.date) === dateMonth);
    const finalizedExisting = (opts.status === '待定稿' || opts.status === undefined)
      ? (state.ledgerRecords || []).filter((item) => getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku) && isLedgerFinalizedRecord(item)).sort((a, b) => getLedgerRecordFinalizedMs(b) - getLedgerRecordFinalizedMs(a))[0]
      : null;
    const existing = finalizedExisting || existingInMonth;
    const preserveFinalizedState = Boolean(existing && isLedgerFinalizedRecord(existing) && (opts.status === '待定稿' || opts.status === undefined) && opts.finalizedAt === undefined);
    const imageUrl = getProductThumbUrl(data) || data.skuImageUrl || data.skuImageFallbackUrl || '';
    const next = {
      ...(existing || {}),
      date: dateKey,
      sku,
      brand: cleanName(data.brand || (existing && existing.brand) || ''),
      name: cleanName(data.name || (existing && existing.name) || ''),
      skuImageUrl: imageUrl || (existing && existing.skuImageUrl) || '',
      benchmarkImageUrl: String(data.benchmarkImageUrl || data.benchmarkImageFallbackUrl || (existing && existing.benchmarkImageUrl) || ''),
      designType: cleanName(data.designType || (existing && existing.designType) || ''),
      artPriority: cleanName(data.artPriority || (existing && existing.artPriority) || ''),
      referenceUrl: String(data.referenceUrl || (existing && existing.referenceUrl) || ''),
      developerName: cleanName(data.developerName || (existing && existing.developerName) || ''),
      designAssignedAt: String(data.designAssignedAt || (existing && existing.designAssignedAt) || ''),
      developmentAssignedAt: String(data.developmentAssignedAt || (existing && existing.developmentAssignedAt) || ''),
      isToy: opts.isToy !== undefined ? Boolean(opts.isToy) : (Boolean(existing && existing.isToy) || isToyDimensionProduct(data)),
      packageCode: String(data.packageCode || (existing && existing.packageCode) || ''),
      printCode: String(data.printCode || (existing && existing.printCode) || ''),
      purchasePrice: normalizeLedgerPurchasePrice(opts.purchasePrice !== undefined ? opts.purchasePrice : (data.purchasePrice || (existing && existing.purchasePrice) || '')),
      boxFileState: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)),
      labelFileState: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)),
      imagePackState: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)),
      artworkState: normalizeLedgerArtworkState(opts.artworkState !== undefined ? opts.artworkState : (existing && existing.artworkState)),
      aiImageStatus: normalizeLedgerAiImageStatus(
        opts.aiImageStatus !== undefined ? opts.aiImageStatus : (existing && existing.aiImageStatus),
        opts.aiImageMessage !== undefined ? opts.aiImageMessage : (existing && existing.aiImageMessage)
      ),
      aiImageMessage: String(opts.aiImageMessage !== undefined ? opts.aiImageMessage || '' : (existing && existing.aiImageMessage) || '').slice(0, 180),
      aiImageJobId: String(opts.aiImageJobId !== undefined ? opts.aiImageJobId || '' : (existing && existing.aiImageJobId) || '').slice(0, 120),
      aiImageCheckedAtMs: Number(opts.aiImageCheckedAtMs !== undefined ? opts.aiImageCheckedAtMs || 0 : (existing && existing.aiImageCheckedAtMs) || 0) || 0,
      aiMainImages: normalizeLedgerAiImageItems(opts.aiMainImages !== undefined ? opts.aiMainImages : (existing && existing.aiMainImages), 12),
      aiDetailImages: normalizeLedgerAiImageItems(opts.aiDetailImages !== undefined ? opts.aiDetailImages : (existing && existing.aiDetailImages), 20),
      aiMainRetouchedImages: normalizeLedgerAiImageItems(opts.aiMainRetouchedImages !== undefined ? opts.aiMainRetouchedImages : (existing && existing.aiMainRetouchedImages), LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiDetailRetouchedImages: normalizeLedgerAiImageItems(opts.aiDetailRetouchedImages !== undefined ? opts.aiDetailRetouchedImages : (existing && existing.aiDetailRetouchedImages), LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS),
      aiMainRetouchTasks: normalizeLedgerAiImageRetouchTasks(opts.aiMainRetouchTasks !== undefined ? opts.aiMainRetouchTasks : (existing && existing.aiMainRetouchTasks), LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiDetailRetouchTasks: normalizeLedgerAiImageRetouchTasks(opts.aiDetailRetouchTasks !== undefined ? opts.aiDetailRetouchTasks : (existing && existing.aiDetailRetouchTasks), LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS),
      aiMainHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(opts.aiMainHiddenImageKeys !== undefined ? opts.aiMainHiddenImageKeys : (existing && existing.aiMainHiddenImageKeys), LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetailHiddenImageKeys: normalizeLedgerAiImageHiddenKeys(opts.aiDetailHiddenImageKeys !== undefined ? opts.aiDetailHiddenImageKeys : (existing && existing.aiDetailHiddenImageKeys), LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS),
      aiDetail3Audit: normalizeLedgerDetail3Audit(opts.aiDetail3Audit !== undefined ? opts.aiDetail3Audit : (existing && existing.aiDetail3Audit)),
      boxFileDone: normalizeLedgerFileState(opts.boxFileState !== undefined ? opts.boxFileState : (existing && existing.boxFileState), opts.boxFileDone !== undefined ? opts.boxFileDone : (existing && existing.boxFileDone)) === 'done',
      labelFileDone: normalizeLedgerFileState(opts.labelFileState !== undefined ? opts.labelFileState : (existing && existing.labelFileState), opts.labelFileDone !== undefined ? opts.labelFileDone : (existing && existing.labelFileDone)) === 'done',
      imagePackDone: normalizeLedgerFileState(opts.imagePackState !== undefined ? opts.imagePackState : (existing && existing.imagePackState), opts.imagePackDone !== undefined ? opts.imagePackDone : (existing && existing.imagePackDone)) === 'done',
      filesAutoCompleted: opts.filesAutoCompleted !== undefined ? Boolean(opts.filesAutoCompleted) : Boolean(existing && existing.filesAutoCompleted),
      performanceType: opts.performanceType !== undefined ? (opts.performanceType === 'extension' ? 'extension' : '') : ((existing && existing.performanceType) || ''),
      performanceGroupMode: opts.performanceGroupMode !== undefined
        ? (opts.performanceGroupMode === 'series' ? 'series' : '')
        : ((existing && existing.performanceGroupMode) || ''),
      seriesExcluded: opts.seriesExcluded !== undefined ? Boolean(opts.seriesExcluded) : (Boolean(existing && existing.seriesExcluded) || Boolean(state.ledgerSeriesExcludedSkus && state.ledgerSeriesExcludedSkus.has(sku))),
      status: preserveFinalizedState ? normalizeLedgerStatus(existing.status || '已定稿') : normalizeLedgerStatus(opts.status || (existing && existing.status) || '待定稿'),
      stage: preserveFinalizedState ? (existing.stage || '已定稿') : (opts.stage || (existing && existing.stage) || '待定稿'),
      note: opts.note !== undefined ? String(opts.note || '') : ((existing && existing.note) || ''),
      imageGeneratedAt: opts.imageGeneratedAt !== undefined ? String(opts.imageGeneratedAt || '') : ((existing && existing.imageGeneratedAt) || ''),
      imageGeneratedAtMs: opts.imageGeneratedAtMs !== undefined ? (Number(opts.imageGeneratedAtMs || 0) || 0) : (Number(existing && existing.imageGeneratedAtMs) || 0),
      finalizedAt: opts.finalizedAt !== undefined ? String(opts.finalizedAt || '') : ((existing && existing.finalizedAt) || ''),
      finalizedDate: opts.finalizedDate !== undefined ? normalizeLedgerDate(opts.finalizedDate) : ((existing && existing.finalizedDate) || ''),
      finalizedAtMs: opts.finalizedAtMs !== undefined ? (Number(opts.finalizedAtMs || 0) || 0) : (Number(existing && existing.finalizedAtMs) || 0),
      createdAt: (existing && existing.createdAt) || nowText,
      createdAtMs: (existing && existing.createdAtMs) || nowMs,
      updatedAt: nowText,
      updatedAtMs: nowMs,
    };
    const reconciled = reconcileLedgerFileCompletion(next);
    if (opts.skipUnchanged && existing && !hasMeaningfulLedgerRecordChange(existing, reconciled)) return existing;
    state.ledgerRecords = [reconciled].concat((state.ledgerRecords || []).filter((item) => !(getLedgerSkuKey(item.sku) === getLedgerSkuKey(sku) && getMonthKeyFromDateKey(item.date) === dateMonth))).slice(0, 1200);
    if (!opts.deferSave) saveDailyLedger();
    return reconciled;
  }

  function hasCompletedLegacyManualSkuLedgerMigration() {
    try {
      if (typeof GM_getValue === 'function') return Boolean(GM_getValue(DAILY_LEDGER_MANUAL_MIGRATION_KEY, false));
      return localStorage.getItem(DAILY_LEDGER_MANUAL_MIGRATION_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function markLegacyManualSkuLedgerMigrationComplete() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(DAILY_LEDGER_MANUAL_MIGRATION_KEY, true);
      else localStorage.setItem(DAILY_LEDGER_MANUAL_MIGRATION_KEY, '1');
    } catch (error) {
      console.warn('PLM floating helper manual ledger migration flag save failed:', error);
    }
  }

  function scheduleLegacyManualSkuLedgerMigration(delayMs) {
    if (hasCompletedLegacyManualSkuLedgerMigration()) return;
    window.setTimeout(() => {
      try {
        migrateLegacyManualSkuLedger();
      } catch (error) {
        console.warn('PLM floating helper manual ledger migration failed:', error);
        addLog('warn', '历史手动 SKU 补录失败', formatErrorMessage(error));
      }
    }, Math.max(0, Number(delayMs) || 0));
  }

  function migrateLegacyManualSkuLedger() {
    const candidates = (Array.isArray(state.index) ? state.index.slice() : []).map((indexItem) => {
      const sku = String(indexItem && indexItem.sku || '').trim().toUpperCase();
      if (!sku) return null;
      const cached = loadData(sku);
      const data = normalizeData({ ...(indexItem || {}), ...(cached || {}), sku });
      const isManual = data.skuListSource === 'manual-code' || Boolean(data.manualSkuAddedAt);
      if (!isManual) return null;
      const addedAtMs = Number(data.manualSkuAddedAtMs || 0) || 0;
      const addedAt = String(data.manualSkuAddedAt || data.designAssignedAt || '').trim()
        || (addedAtMs ? new Date(addedAtMs).toLocaleString() : new Date().toLocaleString());
      const next = data.designAssignedAt ? data : normalizeData({ ...data, designAssignedAt: addedAt });
      return {
        data: next,
        date: addedAtMs ? formatLocalDate(new Date(addedAtMs)) : (parseLedgerDateFromText(addedAt) || getTodayKey()),
      };
    }).filter(Boolean);
    if (!candidates.length) {
      markLegacyManualSkuLedgerMigrationComplete();
      return;
    }
    syncDailyLedgerBeforeMutation();
    const existingSkus = new Set((state.ledgerRecords || []).map((item) => getLedgerSkuKey(item && item.sku)).filter(Boolean));
    let changedCount = 0;
    candidates.forEach((candidate) => {
      const skuKey = getLedgerSkuKey(candidate.data.sku);
      if (!skuKey || existingSkus.has(skuKey)) return;
      const record = upsertDailyLedgerFromData(candidate.data, {
        date: candidate.date,
        status: '待定稿',
        stage: '待定稿',
        note: '历史手动添加自动补录',
        deferSave: true,
        skipStorageSync: true,
        skipUnchanged: true,
      });
      if (record) {
        existingSkus.add(skuKey);
        changedCount += 1;
      }
    });
    if (changedCount) {
      saveDailyLedger();
      addLog('info', '历史手动 SKU 已补录今日工作台', changedCount + ' 个');
      if (state.view === 'ledger' && !renderLedgerTabContent(ensurePanel())) renderShell();
    }
    markLegacyManualSkuLedgerMigrationComplete();
  }

  function updateDailyLedgerForSku(sku, patch, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const data = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
    return upsertDailyLedgerFromData(data, { ...(patch || {}), date: key });
  }

  function normalizeLedgerRegistrationDesignType(value) {
    const text = cleanName(value || '').trim();
    const compact = text.replace(/\s+/g, '');
    if (/^设计近似(?:50|80)%$/.test(compact)) return '设计';
    if (/^(?:无|换)logo$/i.test(compact)) return '换LOGO';
    return text;
  }

  function getLedgerRegistrationRows(rows) {
    const source = Array.isArray(rows) ? rows : [];
    const groups = summarizeLedgerPerformance(source).groups || [];
    const recordGroupIds = new Map();
    groups.forEach((group) => {
      (group.recordKeys || []).forEach((key) => recordGroupIds.set(key, group.id));
    });
    const exportedGroupIds = new Set();
    return source.filter((record) => {
      const groupId = recordGroupIds.get(getLedgerSelectionKey(record));
      if (!groupId) return true;
      if (exportedGroupIds.has(groupId)) return false;
      exportedGroupIds.add(groupId);
      return true;
    });
  }

  function copyLedgerTsv(dateKey) {
    const rows = getLedgerRecordsForMonth('finalized', normalizeLedgerMonth(dateKey || state.ledgerDate)).filter((item) => item.finalizedAt && item.status !== '作废');
    if (!rows.length) {
      showToast('本月没有可复制的已定稿记录');
      return;
    }
    const person = findCurrentPlmUserName();
    if (!person) {
      showToast('未识别到当前 PLM 用户姓名，请刷新页面后重试');
      return;
    }
    const exportedRows = getLedgerRegistrationRows(rows);
    const tsv = exportedRows.map((item) => {
      const cached = normalizeData(loadData(item.sku) || {});
      const productName = [item.brand || cached.brand, item.name || cached.name].filter(Boolean).join(' ');
      const date = item.finalizedAt || '';
      const designType = normalizeLedgerRegistrationDesignType(item.designType || cached.designType || '');
      return [productName, item.sku || '', '', date, designType, person].map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ').trim()).join('\t');
    }).join('\n');
    copyText(tsv);
    const omittedCount = rows.length - exportedRows.length;
    showToast('本月登记已复制：' + exportedRows.length + '条' + (omittedCount ? ' · 系列省略' + omittedCount + '条' : '') + ' · 6列');
  }

  function copySelectedFinalizedLedgerSkus() {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const rows = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((item) => selected.has(getLedgerSelectionKey(item)));
    if (!rows.length) {
      showToast('请先勾选需要复制的产品');
      return;
    }
    const skus = Array.from(new Set(rows.map((item) => item.sku).filter(Boolean)));
    copyText(skus.join('\n'));
    showToast('已复制选中编码：' + skus.length + '个');
  }

  function getLedgerSelectionKey(record) {
    return normalizeLedgerDate(record && record.date || '') + '::' + String(record && record.sku || '');
  }

  function setLedgerVisibleSelection(selectAll) {
    if (state.ledgerView === 'trash') return;
    const records = getVisibleLedgerWorkbenchRecords();
    if (selectAll && !records.length) {
      showToast('当前筛选没有可选择的记录');
      return;
    }
    state.ledgerSelectedKeys = selectAll ? Array.from(new Set(records.map(getLedgerSelectionKey))) : [];
    if (!renderLedgerTabContent(ensurePanel())) renderShell();
    showToast(selectAll ? '已全选当前筛选的 ' + records.length + ' 条记录' : '已取消全选');
  }

  function toggleLedgerSelection(sku, dateKey) {
    const normalizedDate = normalizeLedgerDate(dateKey);
    const record = (state.ledgerRecords || []).find((item) => item.sku === sku && normalizeLedgerDate(item.date) === normalizedDate);
    if (!record) return;
    const key = getLedgerSelectionKey(record);
    const selected = new Set(state.ledgerSelectedKeys || []);
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    state.ledgerSelectedKeys = Array.from(selected);
    refreshLedgerCard(record);
    refreshLedgerPerformanceMergeButton();
  }

  function toggleLedgerDateSelection(dateKey) {
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth()).filter((item) => getLedgerFinalizedDate(item) === normalizeLedgerDate(dateKey));
    const selected = new Set(state.ledgerSelectedKeys || []);
    const keys = records.map(getLedgerSelectionKey);
    const remove = keys.length && keys.every((key) => selected.has(key));
    keys.forEach((key) => remove ? selected.delete(key) : selected.add(key));
    state.ledgerSelectedKeys = Array.from(selected);
    renderShell();
  }

  function updateSelectedLedgerPerformanceGroups(merge) {
    const selectedKeys = new Set(state.ledgerSelectedKeys || []);
    const selectedRecords = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((record) => selectedKeys.has(getLedgerSelectionKey(record)));
    if (merge && selectedRecords.length < 2) {
      showToast('请至少选择两个编码再合并绩效');
      return;
    }
    if (!merge && !selectedRecords.some((record) => record.performanceGroupId)) {
      showToast('选中的编码尚未合并绩效');
      return;
    }
    const targetKeys = new Set(selectedRecords.map(getLedgerSelectionKey));
    const groupId = merge ? 'performance-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) : '';
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    state.ledgerRecords = (state.ledgerRecords || []).map((record) => targetKeys.has(getLedgerSelectionKey(record))
      ? { ...record, performanceGroupId: groupId, performanceGroupMode: '', updatedAt: nowText, updatedAtMs: nowMs }
      : record);
    state.ledgerSelectedKeys = [];
    saveDailyLedger();
    renderShell();
    showToast(merge ? '已合并为 1 个绩效单位' : '已取消绩效合并');
  }

  function openLedgerPerformanceGroupModal() {
    const records = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth());
    const selected = new Set(state.ledgerSelectedKeys || []);
    const selectedSkus = records
      .filter((record) => selected.has(getLedgerSelectionKey(record)))
      .map((record) => getLedgerSkuKey(record.sku))
      .filter(Boolean);
    state.ledgerPerformanceGroupOpen = true;
    state.ledgerPerformanceGroupInput = selectedSkus.join('\n');
    state.ledgerPerformanceGroupStatus = '';
    renderShell();
    window.setTimeout(() => {
      const panel = document.getElementById(PANEL_ID);
      const input = panel && panel.querySelector('.pfh-ledger-performance-group-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  }

  function closeLedgerPerformanceGroupModal() {
    state.ledgerPerformanceGroupOpen = false;
    state.ledgerPerformanceGroupInput = '';
    state.ledgerPerformanceGroupStatus = '';
    const panel = document.getElementById(PANEL_ID);
    const modal = panel && panel.querySelector('.pfh-ledger-performance-group-modal');
    if (modal) modal.remove();
  }

  function applyLedgerPerformanceGroupFromInput() {
    const summary = getLedgerPerformanceGroupInputSummary(state.ledgerPerformanceGroupInput);
    if (summary.matched.length < 2) {
      state.ledgerPerformanceGroupStatus = summary.matched.length
        ? '当前月份已定稿记录只找到 1 个编码，至少需要 2 个才能编组。'
        : '当前月份已定稿记录中没有找到可编组编码。';
      const panel = document.getElementById(PANEL_ID);
      refreshLedgerPerformanceGroupPreview(panel && panel.querySelector('.pfh-ledger-performance-group-modal'));
      const status = panel && panel.querySelector('[data-ledger-performance-group-status]');
      if (status) status.textContent = state.ledgerPerformanceGroupStatus;
      showToast(state.ledgerPerformanceGroupStatus);
      return;
    }
    const targetKeys = new Set(summary.matched.map(getLedgerSelectionKey));
    const groupId = 'performance-manual-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const nowText = new Date().toLocaleString();
    const nowMs = Date.now();
    let changedCount = 0;
    state.ledgerRecords = (state.ledgerRecords || []).map((record) => {
      if (!targetKeys.has(getLedgerSelectionKey(record))) return record;
      changedCount += 1;
      return { ...record, performanceGroupId: groupId, performanceGroupMode: 'series', updatedAt: nowText, updatedAtMs: nowMs };
    });
    state.ledgerSelectedKeys = [];
    saveDailyLedger();
    closeLedgerPerformanceGroupModal();
    renderShell();
    const missingText = summary.missing.length ? '；未找到 ' + summary.missing.length + ' 个，未处理' : '';
    const truncatedText = summary.truncated ? '（最多处理 ' + LEDGER_PERFORMANCE_GROUP_MAX_ITEMS + ' 个）' : '';
    showToast('已按编码编组 ' + changedCount + ' 个产品' + missingText + truncatedText);
  }

  function copySelectedLedgerVideoRows() {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const rows = getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth()).filter((item) => selected.has(getLedgerSelectionKey(item)));
    if (!rows.length) {
      showToast('请先选择产品卡片或日期');
      return;
    }
    const person = findCurrentPlmUserName() || state.sizeImageAccessName || String(state.settings.cloudBackupOwnerName || '').trim();
    if (!person) {
      showToast('未识别到当前 PLM 用户姓名，请刷新页面后重试');
      return;
    }
    const text = rows.map((item) => {
      const cached = normalizeData(loadData(item.sku) || {});
      return [person, item.referenceUrl || cached.referenceUrl || '', item.name || cached.name || item.sku]
        .map((value) => String(value || '').replace(/[\t\r\n]+/g, ' ').trim()).join('\t');
    }).join('\n');
    copyText(text);
    showToast('视频申请内容已复制：' + rows.length + '个产品');
  }

  function exportLedgerRecords(dateKey) {
    const month = normalizeLedgerMonth(dateKey || state.ledgerDate);
    const records = getLedgerRecordsForMonth('design', month);
    const payload = { plugin: L.title, version: SCRIPT_VERSION, exportedAt: new Date().toLocaleString(), month, records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plm-daily-ledger-' + payload.month + '.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    showToast('本月记录已导出');
  }

  function clearLedgerDate(dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    if (!window.confirm('确定清空 ' + formatLedgerDateLabel(key) + ' 的今日工作台记录吗？')) return;
    state.ledgerRecords = (state.ledgerRecords || []).filter((item) => item.date !== key);
    saveDailyLedger();
    renderShell();
  }

  function updateLedgerFromAction(action, sku, dateKey, options) {
    if (!sku) return;
    syncDailyLedgerBeforeMutation();
    state.ledgerMenuSku = '';
    state.ledgerMenuDate = '';
    if (action === 'ledger-image-generated') {
      state.ledgerFlowTransitionSku = sku;
      window.clearTimeout(state.ledgerFlowTransitionTimer);
      state.ledgerFlowTransitionTimer = window.setTimeout(() => {
        if (state.ledgerFlowTransitionSku !== sku) return;
        state.ledgerFlowTransitionSku = '';
        const current = (state.ledgerRecords || []).find((item) => item.sku === sku && item.date === normalizeLedgerDate(dateKey));
        if (current) refreshLedgerCard(current);
      }, 680);
    }
    if (action === 'ledger-remove') {
      const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
      const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
      if (!record) return;
      const nowText = new Date().toLocaleString();
      const nowMs = Date.now();
      const month = getMonthKeyFromDateKey(key);
      state.ledgerTrashRecords = [{ ...record, removedAt: nowText, removedAtMs: nowMs }]
        .concat((state.ledgerTrashRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month)))
        .slice(0, 1200);
      state.ledgerRecords = (state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month));
      state.ledgerSelectedKeys = (state.ledgerSelectedKeys || []).filter((item) => item !== getLedgerSelectionKey(record));
      saveDailyLedger();
      saveDailyLedgerTrash();
      renderShell();
      showToast('已移入垃圾篓，不会再次自动加入');
      return;
    }
    const today = getNowLedgerMinuteLabel();
    const todayKey = getTodayKey();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const nextSeriesExcluded = action === 'ledger-series-exclude' ? !isLedgerSeriesExcluded(existing || { sku }) : false;
    if (action === 'ledger-series-exclude') {
      const excluded = new Set(state.ledgerSeriesExcludedSkus || []);
      if (nextSeriesExcluded) excluded.add(String(sku).trim().toUpperCase());
      else excluded.delete(String(sku).trim().toUpperCase());
      state.ledgerSeriesExcludedSkus = excluded;
      saveLedgerSeriesExcludedSkus();
    }
    const patch = action === 'ledger-image-generated'
      ? { status: '待定稿', stage: '待定稿', imageGeneratedAt: today, imageGeneratedAtMs: Date.now(), note: '已出图，等待定稿' }
      : action === 'ledger-unmark-image-generated'
        ? { status: '待出图', stage: '待出图', imageGeneratedAt: '', imageGeneratedAtMs: 0, note: '已撤回出图' }
        : action === 'ledger-unfinalize'
          ? { status: '待定稿', stage: '待定稿', finalizedAt: '', finalizedDate: '', finalizedAtMs: 0, note: '已撤回定稿' }
        : action === 'ledger-extension'
          ? {
            performanceType: existing && existing.performanceType === 'extension' ? '' : 'extension',
            note: existing && existing.performanceType === 'extension' ? '已取消延伸绩效' : '延伸绩效按 0.3 计算',
          }
        : action === 'ledger-series-exclude'
          ? { seriesExcluded: nextSeriesExcluded, note: nextSeriesExcluded ? '已手动剔除自动系列' : '已恢复自动系列' }
          : action === 'ledger-finalize'
            ? { status: '已定稿', stage: '已定稿', finalizedAt: today, finalizedDate: todayKey, finalizedAtMs: Date.now(), note: '手动定稿' }
            : action === 'ledger-void'
              ? {
                status: '作废',
                stage: '作废',
                finalizedAt: existing && existing.finalizedAt || today,
                finalizedDate: existing && existing.finalizedDate || todayKey,
                finalizedAtMs: Number(existing && existing.finalizedAtMs) || Date.now(),
                note: '手动作废',
              }
              : { status: '已完成', stage: '完成', note: '手动完成', filesAutoCompleted: false };
    const opts = options || {};
    const finalPatch = opts.purchasePrice ? { ...patch, purchasePrice: opts.purchasePrice } : patch;
    const updatedRecord = updateDailyLedgerForSku(sku, { ...finalPatch, skipStorageSync: true }, key);
    if (action === 'ledger-finalize' && opts.purchasePrice) {
      const currentData = normalizeData(loadData(sku) || (state.data && state.data.sku === sku ? state.data : { sku }));
      const changed = String(currentData.purchasePrice || '') !== opts.purchasePrice;
      const pricedData = normalizeData({ ...currentData, purchasePrice: opts.purchasePrice });
      saveData(sku, pricedData);
      if (state.data && state.data.sku === sku) state.data = pricedData;
      if (changed) recordCommerceInsight(pricedData, null, { price: opts.purchasePrice, source: 'ledger-finalize' });
    }
    refreshLedgerCard(updatedRecord);
    refreshLedgerPerformanceSummary();
    if (action === 'ledger-extension') showToast(updatedRecord && updatedRecord.performanceType === 'extension' ? '已设为延伸，绩效按 0.3 分计算' : '已取消延伸绩效');
    if (action === 'ledger-series-exclude') showToast(nextSeriesExcluded ? '已剔除自动系列，按单独产品计算' : '已恢复自动系列匹配');
    if (action === 'ledger-finalize') scheduleDesktopBridgeSnapshot();
  }

  function updateLedgerTrashFromAction(action, sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    const month = getMonthKeyFromDateKey(key);
    const record = (state.ledgerTrashRecords || []).find((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month);
    if (!record) return;
    if (action === 'ledger-trash-delete' && !window.confirm('确定从垃圾篓清除 ' + sku + ' 吗？清除后仍会保留防回抓标记。')) return;
    if (action === 'ledger-trash-restore') {
      state.ledgerTrashRecords = (state.ledgerTrashRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month));
      const restored = sanitizeLedgerRecords([{ ...record, updatedAt: new Date().toLocaleString(), updatedAtMs: Date.now() }])[0];
      state.ledgerRecords = [restored].concat((state.ledgerRecords || []).filter((item) => !(item.sku === sku && getMonthKeyFromDateKey(item.date) === month))).slice(0, 1200);
      saveDailyLedger();
    } else {
      state.ledgerTrashRecords = (state.ledgerTrashRecords || []).map((item) => item.sku === sku && getMonthKeyFromDateKey(item.date) === month ? { ...item, purged: true } : item);
    }
    saveDailyLedgerTrash();
    renderShell();
    showToast(action === 'ledger-trash-restore' ? '已恢复到今日工作台' : '已从垃圾篓清除，仍会阻止自动加入');
  }

  function emptyLedgerTrashMonth(dateKey) {
    const month = normalizeLedgerMonth(dateKey || getTodayKey());
    const count = (state.ledgerTrashRecords || []).filter((item) => !item.purged && getMonthKeyFromDateKey(item.date) === month).length;
    if (!count || !window.confirm('确定清空 ' + formatLedgerMonthLabel(month) + ' 的 ' + count + ' 条垃圾篓记录吗？清空后仍会保留防回抓标记。')) return;
    state.ledgerTrashRecords = (state.ledgerTrashRecords || []).map((item) => getMonthKeyFromDateKey(item.date) === month ? { ...item, purged: true } : item);
    saveDailyLedgerTrash();
    renderShell();
    showToast('本月垃圾篓已清空，移除编码仍不会自动加入');
  }

  function openLedgerFinalizedTimeEditor(sku, dateKey) {
    if (!sku) return;
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    if (!existing || !existing.finalizedAt) {
      showToast('请先定稿后再修改时间');
      return;
    }
    state.ledgerTimeEditor = { sku, dateKey: key, timeMs: existing.finalizedAtMs || parseLedgerDateTimeMs(existing.finalizedAt) || Date.now() };
    renderShell();
  }

  function saveLedgerFinalizedTimeEditor() {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hour = panel.querySelector('.pfh-ledger-time-hour');
    const minute = panel.querySelector('.pfh-ledger-time-minute');
    const value = String(dateInput && dateInput.value || '').trim() + ' ' + String(hour && hour.value || '').trim().padStart(2, '0') + ':' + String(minute && minute.value || '').trim().padStart(2, '0');
    const timeMs = parseLedgerDateTimeMs(value);
    if (!timeMs) {
      showToast('时间格式不正确，请使用 2026-07-10 14:30');
      return;
    }
    const date = new Date(timeMs);
    const finalizedDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    updateDailyLedgerForSku(editor.sku, {
      status: '已定稿',
      stage: '已定稿',
      finalizedAt: formatLedgerMinuteLabel(timeMs),
      finalizedDate,
      finalizedAtMs: timeMs,
      note: '已修改定稿时间',
    }, editor.dateKey);
    state.ledgerTimeEditor = null;
    showToast('定稿时间已更新');
    renderShell();
  }

  function updateLedgerTimeEditorPreset(action) {
    const editor = state.ledgerTimeEditor;
    if (!editor) return;
    const date = new Date();
    if (action === 'ledger-time-yesterday') date.setDate(date.getDate() - 1);
    else if (action === 'ledger-time-day-before') date.setDate(date.getDate() - 2);
    date.setHours(9, 0, 0, 0);
    editor.timeMs = date.getTime();
    const panel = ensurePanel();
    const dateInput = panel.querySelector('.pfh-ledger-time-date');
    const hourInput = panel.querySelector('.pfh-ledger-time-hour');
    const minuteInput = panel.querySelector('.pfh-ledger-time-minute');
    if (dateInput) dateInput.value = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    if (hourInput) hourInput.value = String(date.getHours()).padStart(2, '0');
    if (minuteInput) minuteInput.value = String(date.getMinutes()).padStart(2, '0');
  }

  function getSelectedLedgerWorkFlagRecords(sku, dateKey) {
    const selected = new Set(state.ledgerSelectedKeys || []);
    const key = normalizeLedgerDate(dateKey);
    if (!sku || !key || !selected.has(getLedgerSelectionKey({ sku, date: key }))) return [];
    return getLedgerRecordsForMonth('finalized', getCurrentLedgerMonth())
      .filter((record) => selected.has(getLedgerSelectionKey(record)));
  }

  function toggleLedgerWorkFlag(action, sku, dateKey) {
    if (!sku) return;
    syncDailyLedgerBeforeMutation();
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const field = action === 'ledger-toggle-box-file'
      ? 'boxFileState'
      : (action === 'ledger-toggle-label-file' ? 'labelFileState' : 'imagePackState');
    const doneField = action === 'ledger-toggle-box-file'
      ? 'boxFileDone'
      : (action === 'ledger-toggle-label-file' ? 'labelFileDone' : 'imagePackDone');
    const label = field === 'boxFileState' ? '\u7eb8\u76d2\u6587\u4ef6' : (field === 'labelFileState' ? '\u6807\u7b7e\u5370\u5237\u6587\u4ef6' : '\u56fe\u5305');
    const nextValue = nextLedgerFileState(existing && existing[field], existing && existing[doneField]);
    if (action === 'ledger-toggle-image-pack' && nextValue !== 'pending') state.ledgerFilterWorkflow = 'image-pack-pending';
    const selectedRecords = getSelectedLedgerWorkFlagRecords(sku, key);
    if (selectedRecords.length > 1) {
      const patch = { [field]: nextValue, [doneField]: nextValue === 'done', note: label + ledgerFileStateLabel(nextValue), skipStorageSync: true, deferSave: true, skipUnchanged: true };
      let changedCount = 0;
      selectedRecords.forEach((record) => {
        const updatedRecord = updateDailyLedgerForSku(record.sku, patch, record.date);
        if (updatedRecord !== record) changedCount += 1;
      });
      if (changedCount) saveDailyLedger();
      if (state.view === 'ledger' && !renderLedgerTabContent(ensurePanel())) renderShell();
      refreshLedgerPerformanceSummary();
      scheduleDesktopBridgeSnapshot();
      showToast('已同步 ' + selectedRecords.length + ' 个选中产品的' + label + '：' + ledgerFileStateLabel(nextValue));
      return;
    }
    const updatedRecord = updateDailyLedgerForSku(sku, { [field]: nextValue, [doneField]: nextValue === 'done', note: label + ledgerFileStateLabel(nextValue), skipStorageSync: true }, key);
    refreshLedgerCard(updatedRecord);
    scheduleDesktopBridgeSnapshot();
  }

  function getLedgerAiImageStatusMeta(record) {
    const status = normalizeLedgerAiImageStatus(record && record.aiImageStatus, record && record.aiImageMessage);
    const manual = normalizeLedgerArtworkState(record && record.artworkState);
    const mainCount = normalizeLedgerAiImageItems(record && record.aiMainImages, 12).length;
    const detailCount = normalizeLedgerAiImageItems(record && record.aiDetailImages, 20).length;
    const total = mainCount + detailCount;
    if (status === 'success' && total) return { status, label: '查看生图 · ' + total, title: '点击查看 AI 生图（主图 ' + mainCount + ' 张，详情图 ' + detailCount + ' 张）', count: total };
    if (status === 'result-missing') return { status, label: '结果缺失', title: 'PLM 返回完成状态但没有图片列表，打开后可手动重新生成', count: 0 };
    if (status === 'success') return { status, label: '结果缺失', title: 'AI 生图完成但没有图片列表，打开后可手动重新生成', count: 0 };
    if (status === 'loading') {
      const message = String(record && record.aiImageMessage || '');
      const preparing = /正在准备|提交 PLM AI 生图/.test(message);
      return { status, label: preparing ? '准备生图…' : '检查生图历史…', title: preparing ? '正在准备生图资料并提交 PLM AI 生图' : '正在检查是否存在 PLM AI 生图历史，不会提交生成请求', count: 0 };
    }
    if (status === 'running') return { status, label: '生图中…', title: 'PLM AI 生图正在执行，只跟踪当前 SKU', count: 0 };
    if (status === 'empty') return { status, label: '查询生图', title: '当前没有可查看的 PLM AI 生图；打开后可手动选择主图或详情图生成', count: 0 };
    if (status === 'needs-prerequisites') return { status, label: '需补全资料', title: '生图前置校验未通过，请先补齐产品文案和 SKU 效果图', count: 0 };
    if (status === 'needs-sku-image') return { status, label: '需补全 SKU 图', title: 'PLM 缺少 SKU 效果图，请先上传 SKU 图后再生成', count: 0 };
    if (status === 'needs-copywriting') return { status, label: '需补全文案', title: 'PLM 缺少有效产品文案，请先补齐产品文案后再生成', count: 0 };
    if (status === 'task-error') return { status, label: '任务异常', title: 'PLM 有生图任务记录但查询不到结果，请刷新或联系管理员清理任务', count: 0 };
    if (status === 'error') return { status, label: '查询失败', title: 'AI 生图状态查询失败，打开后可手动刷新', count: 0 };
    if (manual === 'doing') return { status, label: '生图中 · 查询', title: '当前是手动生图标记，点击查询 PLM 实际状态', count: 0 };
    if (manual === 'done') return { status, label: '已生图 · 查询', title: '当前是手动完成标记，点击查询并查看 PLM AI 生图', count: 0 };
    return { status, label: '查询生图', title: '点击查询 PLM AI 生图状态；不会自动提交文案或开始生成', count: 0 };
  }

  function ledgerArtworkStateButtonHtml(record, sku, dateAttr) {
    const meta = getLedgerAiImageStatusMeta(record);
    return '<button type="button" class="pfh-ledger-artwork is-ai-' + escapeHtml(meta.status) + '" data-action="ledger-ai-image" data-sku="' + escapeHtml(sku) + '" data-date="' + dateAttr + '" title="' + escapeHtml(meta.title) + '" aria-label="' + escapeHtml('生图状态：' + meta.label) + '">' + escapeHtml(meta.label) + '</button>';
  }

  function ledgerAiImageGenerateButtonHtml(record, kind, status) {
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const label = normalizedKind === 'detail' ? '详情图' : '主图';
    const requestKey = getLedgerAiImageRequestKey(record && record.sku);
    const busy = ['loading', 'running'].includes(status) || Boolean(state.ledgerAiImageRequests[requestKey]);
    const retry = ['error', 'needs-copywriting', 'needs-sku-image', 'needs-prerequisites', 'task-error', 'result-missing'].includes(status);
    const text = busy ? '生成中…' : (retry ? '重新生成' + label + ' AI' : '生成' + label + ' AI');
    return '<button type="button" class="pfh-ledger-ai-image-generate" data-action="ledger-ai-image-generate" data-kind="' + normalizedKind + '" data-sku="' + escapeHtml(record && record.sku || '') + '" data-date="' + escapeHtml(record && record.date || '') + '" title="点击后读取实时产品文案并提交 PLM AI 生图；PLM 接口会同时返回主图和详情图"' + (busy ? ' disabled' : '') + '>' + escapeHtml(text) + '</button>';
  }

  function getLedgerAiImageRequestKey(sku) {
    return getLedgerSkuKey(sku);
  }

  function getLedgerAiImageDownloadKey(sku, dateKey, kind) {
    return getLedgerAiImageRequestKey(sku) + '|' + (normalizeLedgerDate(dateKey) || '') + '|' + (kind === 'detail' ? 'detail' : 'main');
  }

  function findLedgerRecord(sku, dateKey) {
    const normalizedSku = getLedgerSkuKey(sku);
    const normalizedDate = normalizeLedgerDate(dateKey);
    return (state.ledgerRecords || []).find((item) => getLedgerSkuKey(item.sku) === normalizedSku && (!normalizedDate || normalizeLedgerDate(item.date) === normalizedDate)) || null;
  }

  function parseLedgerAiImageResult(payload) {
    const data = payload && payload.data && typeof payload.data === 'object' ? payload.data : {};
    const mainImages = normalizeLedgerAiImageItems(data.mainImages || data.main_images, 12);
    const detailImages = normalizeLedgerAiImageItems(data.detailImages || data.detail_images, 20);
    const statusCode = Number(data.status);
    const message = String(data.message || payload && (payload.message || payload.msg) || '').trim();
    const jobId = String(data.job_id || data.jobId || '').trim();
    const hasImages = mainImages.length || detailImages.length;
    const status = hasImages
      ? 'success'
      : statusCode === 1
        ? 'running'
        : statusCode === 2
          ? 'result-missing'
          : /失败|错误|异常|fail|error/i.test(message)
            ? 'error'
            : 'empty';
    return {
      status,
      message: message || (status === 'running'
        ? 'AI 生成提示：任务执行中'
        : (status === 'result-missing' ? 'PLM 返回完成状态但没有图片列表' : (status === 'empty' ? '未发现可用的 AI 生图任务' : '执行成功'))),
      jobId,
      mainImages,
      detailImages,
    };
  }

  function getLedgerAiImageCopywriteList(payload) {
    const data = payload && payload.data !== undefined ? payload.data : payload;
    if (Array.isArray(data)) return data;
    const candidates = [
      data && data.textList,
      data && data.text_list,
      data && data.copywrite,
      data && data.copyWrite,
      payload && payload.textList,
      payload && payload.text_list,
    ];
    return candidates.find((value) => Array.isArray(value)) || [];
  }

  const LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS = [
    {
      key: 'new_product_usage',
      label: '使用说明',
      types: ['new_product_usage', 'product_usage', 'usage'],
      labels: ['建议使用方法', '使用说明', 'recommended usage', 'directions of safe use'],
    },
    {
      key: 'new_product_selling_points',
      label: '产品卖点',
      types: ['new_product_selling_points', 'product_selling_points', 'selling_points'],
      labels: ['产品卖点', 'product selling points'],
    },
    {
      key: 'new_product_efficacy',
      label: '产品功效',
      types: ['new_product_efficacy', 'product_efficacy', 'efficacy'],
      labels: ['产品功效', 'product efficacy'],
    },
    {
      key: 'new_product_advantages',
      label: '产品优势',
      types: ['new_product_advantages', 'product_advantages', 'advantages'],
      labels: ['产品优势', 'product advantages'],
    },
  ];

  function isLedgerAiImageRecommendationItem(source) {
    const item = source && typeof source === 'object' ? source : {};
    const type = String(item.type || item.key || '').trim().toLowerCase();
    const title = [item.title, item.title_cn, item.titleCn, item.label, item.name]
      .map((part) => String(part || '').trim().toLowerCase())
      .filter(Boolean)
      .join(' ');
    return type === 'new_product_recommendation'
      || type === 'product_recommendation'
      || /new product recommendation|recommendation list|新品(?:temu)?推荐类目|新品文案/.test(title);
  }

  function getLedgerAiImageCopywriteValues(item) {
    const source = item && typeof item === 'object' ? item : { value: item };
    const rawValueEn = getApiScalarText(source.value !== undefined ? source.value : (source.value_en !== undefined ? source.value_en : (source.valueEn !== undefined ? source.valueEn : (source.english !== undefined ? source.english : source.en))), 0);
    const rawValueCn = getApiScalarText(source.value_cn !== undefined ? source.value_cn : (source.valueCn !== undefined ? source.valueCn : (source.chinese !== undefined ? source.chinese : source.zh)), 0);
    const valueEn = isLedgerAiImageRecommendationItem(source) && !rawValueEn ? rawValueCn : rawValueEn;
    const valueCn = rawValueCn;
    const fallback = getApiScalarText(source.text !== undefined ? source.text : source.content, 0);
    return {
      value: String(valueEn || '').trim(),
      value_cn: String(valueCn || '').trim(),
      fallback: String(fallback || '').trim(),
    };
  }

  function getLedgerAiImageMissingRequiredCopywriteFields(value) {
    const items = Array.isArray(value) ? value : [];
    return LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.filter((rule) => {
      const item = items.find((candidate) => {
        const source = candidate && typeof candidate === 'object' ? candidate : {};
        const type = String(source.type || source.key || '').trim().toLowerCase();
        const title = [source.title_cn, source.titleCn, source.title_zh, source.titleZh, source.title, source.label_cn, source.labelCn, source.label, source.name]
          .map((part) => String(part || '').trim().toLowerCase())
          .filter(Boolean)
          .join(' ');
        return rule.types.some((candidateType) => type === candidateType)
          || rule.labels.some((candidateLabel) => title.includes(String(candidateLabel).toLowerCase()));
      });
      if (!item) return true;
      const values = getLedgerAiImageCopywriteValues(item);
      const fallbackIsChinese = /[\u3400-\u9fff]/.test(values.fallback);
      const english = values.value || (!fallbackIsChinese ? values.fallback : '');
      const chinese = values.value_cn || (fallbackIsChinese ? values.fallback : '');
      return !english || !chinese;
    }).map((rule) => rule.label);
  }

  function normalizeLedgerAiImageCopywriteItems(value) {
    return (Array.isArray(value) ? value : []).map((item, index) => {
      const source = item && typeof item === 'object' ? item : { value: item };
      const values = getLedgerAiImageCopywriteValues(source);
      const fallbackIsChinese = /[\u3400-\u9fff]/.test(values.fallback);
      const normalizedEn = String(values.value || (!fallbackIsChinese ? values.fallback : '') || '').trim();
      const normalizedCn = String(values.value_cn || (fallbackIsChinese ? values.fallback : '') || '').trim();
      if (!normalizedEn && !normalizedCn) return null;
      return {
        id: Number(source.id || source.key || index + 1) || index + 1,
        type: String(source.type || source.key || 'product_text_' + (index + 1)).trim().slice(0, 80),
        title: String(source.title || source.title_en || source.titleEn || source.label || source.name || source.type || '').trim().slice(0, 160),
        title_cn: String(source.title_cn || source.titleCn || source.title_zh || source.titleZh || source.label_cn || source.labelCn || source.label || source.name || source.title || '').trim().slice(0, 160),
        value: normalizedEn.slice(0, 12000),
        value_cn: normalizedCn.slice(0, 12000),
      };
    }).filter(Boolean).slice(0, 40);
  }

  function buildLedgerAiImageCopywriteFromCache(data) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    if (!record) return [];
    const sections = Array.isArray(record.sections) ? record.sections : [];
    const source = sections.length ? sections : (record.fullText ? [{ key: 'product_description', label: '产品文案', text: record.fullText }] : []);
    return normalizeLedgerAiImageCopywriteItems(source.map((section, index) => ({
      id: index + 1,
      type: section.key || 'product_text_' + (index + 1),
      title: section.label || section.key || '',
      title_cn: section.label || section.key || '',
      value: section.text || '',
      value_cn: section.text || '',
    })));
  }

  function getLedgerAiImagePayloadRoots(payload) {
    const roots = [];
    const add = (value) => {
      if (!value || typeof value !== 'object' || roots.includes(value)) return;
      roots.push(value);
    };
    add(payload);
    add(payload && payload.data);
    add(payload && payload.result);
    add(payload && payload.data && payload.data.data);
    add(payload && payload.data && payload.data.result);
    return roots;
  }

  function getLedgerAiImagePayloadField(payload, keys) {
    const roots = getLedgerAiImagePayloadRoots(payload);
    for (const root of roots) {
      for (const key of keys || []) {
        if (root[key] === undefined || root[key] === null) continue;
        const value = getApiScalarText(root[key], 0);
        if (value) return value;
      }
    }
    return '';
  }

  function getLedgerAiImageLiveIngredientPayload(payload) {
    return {
      product_ingredients_efficacy_ch: getLedgerAiImagePayloadField(payload, ['product_ingredients_efficacy_ch', 'productIngredientsEfficacyCh']),
      product_ingredients_summary_ch: getLedgerAiImagePayloadField(payload, ['product_ingredients_summary_ch', 'productIngredientsSummaryCh']),
      product_ingredients_efficacy_en: getLedgerAiImagePayloadField(payload, ['product_ingredients_efficacy_en', 'productIngredientsEfficacyEn']),
      product_ingredients_summary_en: getLedgerAiImagePayloadField(payload, ['product_ingredients_summary_en', 'productIngredientsSummaryEn']),
    };
  }

  function getLedgerAiImagePlmAttributeValue(values, spec, languageId) {
    const candidates = Array.isArray(values) ? values : [];
    const language = Number(languageId) || 1;
    const ids = new Set((spec && spec.ids || []).map((value) => String(value)));
    const variables = new Set((spec && spec.variables || []).map((value) => String(value).toLowerCase()));
    const labels = spec && spec.label instanceof RegExp ? spec.label : null;
    const matches = candidates.filter((item) => {
      if (!item || Number(item.language_id) !== language) return false;
      const idMatch = ids.size && ids.has(String(item.attr_id));
      const variable = String(item.variable_name || '').trim().toLowerCase();
      const label = String(item.attr_name || '').trim();
      return idMatch || (variables.size && variables.has(variable)) || (labels && labels.test(label));
    });
    const match = matches.find((item) => isValidLedgerAiImageText(getApiScalarText(item.value, 0))) || matches[0];
    return match ? String(getApiScalarText(match.value, 0) || '').trim() : '';
  }

  function getLedgerAiImagePlmCopywritingPayload(contentPayload) {
    const values = flattenMagicUploadProductAttributes(contentPayload);
    const value = (spec) => ({
      cn: getLedgerAiImagePlmAttributeValue(values, spec, 1),
      en: getLedgerAiImagePlmAttributeValue(values, spec, 2),
    });
    return {
      usage: value({ ids: [370], variables: ['usage_method'], label: /使用方法|directions/i }),
      sellingPoints: value({ ids: [223], variables: ['product_selling_points'], label: /产品卖点|selling points/i }),
      efficacy: value({ ids: [368], variables: ['product_efficacy'], label: /产品功效|product efficacy/i }),
      advantages: value({ ids: [222], variables: ['product_advantages'], label: /产品优势|product advantages/i }),
      ingredientSummary: value({ ids: [395], variables: ['ingredients'], label: /^成分$|ingredients?/i }),
      ingredientEfficacy: value({ ids: [217], variables: ['ingredient_function'], label: /成分功能|component function/i }),
    };
  }

  function mergeLedgerAiImagePlmCopywritingPayload(preparation, payload, options) {
    const target = preparation || {};
    const source = payload || {};
    const authoritative = Boolean(options && options.authoritative);
    const byKey = {
      usage: 'new_product_usage',
      sellingPoints: 'new_product_selling_points',
      efficacy: 'new_product_efficacy',
      advantages: 'new_product_advantages',
    };
    Object.keys(byKey).forEach((key) => {
      const values = source[key] || {};
      const rule = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.find((item) => item.key === byKey[key]);
      if (!rule) return;
      const item = ensureLedgerAiPreparationCopyItem(target, rule);
      if (authoritative || !String(item.value_cn || '').trim()) item.value_cn = String(values.cn || '').trim();
      if (authoritative || !String(item.value || '').trim()) item.value = String(values.en || '').trim();
    });
    const ingredientMap = {
      ingredientSummary: ['product_ingredients_summary_ch', 'product_ingredients_summary_en'],
      ingredientEfficacy: ['product_ingredients_efficacy_ch', 'product_ingredients_efficacy_en'],
    };
    target.ingredients = target.ingredients && typeof target.ingredients === 'object' ? target.ingredients : {};
    Object.keys(ingredientMap).forEach((key) => {
      const values = source[key] || {};
      const fields = ingredientMap[key];
      if (authoritative || !String(target.ingredients[fields[0]] || '').trim()) target.ingredients[fields[0]] = String(values.cn || '').trim();
      if (authoritative || !String(target.ingredients[fields[1]] || '').trim()) target.ingredients[fields[1]] = String(values.en || '').trim();
    });
    return target;
  }

  function getLedgerAiImageMissingIngredientFields(ingredientPayload) {
    const payload = ingredientPayload || {};
    const missing = [];
    if (!String(payload.product_ingredients_summary_ch || '').trim() || !String(payload.product_ingredients_summary_en || '').trim()) missing.push('成分');
    if (!String(payload.product_ingredients_efficacy_ch || '').trim() || !String(payload.product_ingredients_efficacy_en || '').trim()) missing.push('成分功能');
    return missing;
  }

  function isValidLedgerAiImageText(value) {
    const text = String(value || '').trim();
    return text.length >= 3 && !/^(?:--+|null|undefined|none|n\/a|无|暂无|待补|待填写)$/i.test(text);
  }

  function getLedgerAiPreparationKey(sku) {
    return getLedgerSkuKey(sku);
  }

  function findLedgerAiPreparationCopyItem(preparation, rule) {
    const items = preparation && Array.isArray(preparation.copywrite) ? preparation.copywrite : [];
    return items.find((candidate) => {
      const source = candidate && typeof candidate === 'object' ? candidate : {};
      const type = String(source.type || source.key || '').trim().toLowerCase();
      const title = [source.title_cn, source.title, source.label, source.name].map((part) => String(part || '').trim().toLowerCase()).join(' ');
      return rule.types.some((candidateType) => type === candidateType) || rule.labels.some((label) => title.includes(String(label).toLowerCase()));
    }) || null;
  }

  function findLedgerAiImageRecommendationItem(preparation) {
    const items = preparation && Array.isArray(preparation.copywrite) ? preparation.copywrite : [];
    return items.find(isLedgerAiImageRecommendationItem) || null;
  }

  function ensureLedgerAiPreparationCopyItem(preparation, rule) {
    let item = findLedgerAiPreparationCopyItem(preparation, rule);
    if (item) return item;
    item = { id: (preparation.copywrite || []).length + 1, type: rule.key, title: rule.label, title_cn: rule.label, value: '', value_cn: '' };
    preparation.copywrite = (preparation.copywrite || []).concat(item);
    return item;
  }

  function calculateLedgerAiPreparationMissing(preparation) {
    const missing = [];
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      const item = findLedgerAiPreparationCopyItem(preparation, rule);
      if (!item || !isValidLedgerAiImageText(getLedgerAiImageCopywriteValues(item).value_cn)) missing.push(rule.label + '（中文）');
      if (!item || !isValidLedgerAiImageText(getLedgerAiImageCopywriteValues(item).value)) missing.push(rule.label + '（英文）');
    });
    const ingredients = preparation && preparation.ingredients || {};
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_summary_ch)) missing.push('成分（中文）');
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_summary_en)) missing.push('成分（英文）');
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_efficacy_ch)) missing.push('成分功能（中文）');
    if (!isValidLedgerAiImageText(ingredients.product_ingredients_efficacy_en)) missing.push('成分功能（英文）');
    const recommendation = getLedgerAiImageCopywriteValues(findLedgerAiImageRecommendationItem(preparation));
    if (!isValidLedgerAiImageText(recommendation.value)) missing.push('新品推荐类目');
    if (preparation && preparation.plmDetailLoaded === false) missing.push('PLM 详情资料');
    if (!preparation || !preparation.skuImage || preparation.skuImage.status !== 'available') missing.push('SKU 效果图');
    return missing;
  }

  function getLedgerAiPreparationMissing(preparation) {
    return preparation && Array.isArray(preparation.plmMissing)
      ? preparation.plmMissing.slice()
      : calculateLedgerAiPreparationMissing(preparation);
  }

  async function loadLedgerAiImagePreparation(sku, force) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const key = getLedgerAiPreparationKey(normalizedSku);
    if (!force && state.ledgerAiImagePreparations[key]) return state.ledgerAiImagePreparations[key];
    const data = normalizeData(loadData(normalizedSku) || { sku: normalizedSku });
    const preparation = { sku: normalizedSku, copywrite: [], ingredients: {}, skuImage: { status: 'unknown', reason: '' }, loading: true, loadingStage: '正在读取产品文案', loadingDetail: '先检查使用方法、卖点、功效、优势和成分；不会自动提交生图。', saving: false, error: '', plmDetailLoaded: false, updatedAtMs: Date.now() };
    state.ledgerAiImagePreparations[key] = preparation;
    const renderStage = (stage, detail) => {
      preparation.loadingStage = stage;
      preparation.loadingDetail = detail;
      preparation.updatedAtMs = Date.now();
      if (state.view === 'ledger' && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku)) {
        renderLedgerAiImageViewer(ensurePanel());
      }
    };
    renderStage('正在读取产品文案', '检查使用方法、卖点、功效、优势和成分；不会自动提交生图。');
    try {
      const payload = await fetchPlmJson(LEDGER_AI_IMAGE_COPYWRITING_ENDPOINT + '?code=' + encodeURIComponent(normalizedSku));
      if (payload && payload.success === false) throw new Error(formatPlmApiMessage(payload.msg) || formatPlmApiMessage(payload.message) || 'PLM 产品文案接口返回失败');
      preparation.copywrite = normalizeLedgerAiImageCopywriteItems(getLedgerAiImageCopywriteList(payload));
      preparation.ingredients = getLedgerAiImageLiveIngredientPayload(payload);
    } catch (error) {
      preparation.error = '读取 PLM 文案失败：' + (formatErrorMessage(error) || '接口异常');
    }
    renderStage('正在读取商品详情字段', '继续核对 PLM 详情中的中英文文案和功能字段…');
    try {
      const snapshot = await fetchApiProductSnapshot(data, { force: true });
      let contentPayload = snapshot && snapshot.contentPayload;
      if (snapshot && snapshot.productId && snapshot.productVersionId && snapshot.categoryId) {
        try {
          contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(snapshot.productId) + '&category_id=' + encodeURIComponent(snapshot.categoryId) + '&product_version_id=' + encodeURIComponent(snapshot.productVersionId));
        } catch (_) {
          // The read-only snapshot remains a compatible fallback for older PLM deployments.
        }
      }
      if (!contentPayload) throw new Error('PLM 商品详情未返回字段数据');
      const plmCopywriting = getLedgerAiImagePlmCopywritingPayload(contentPayload);
      preparation.plmDetailLoaded = true;
      mergeLedgerAiImagePlmCopywritingPayload(preparation, plmCopywriting, { authoritative: true });
    } catch (error) {
      preparation.plmDetailError = '读取 PLM 详情字段失败：' + (formatErrorMessage(error) || '接口异常');
    }
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      ensureLedgerAiPreparationCopyItem(preparation, rule);
    });
    renderStage('正在检查 SKU 效果图', '检查 PLM 的 sku_pic / SKU 效果图字段，确认是否具备生图条件…');
    try { preparation.skuImage = await fetchLedgerAiImageSkuPreflight(normalizedSku, data); }
    catch (error) { preparation.skuImage = { status: 'unknown', reason: formatErrorMessage(error) || '接口异常' }; }
    preparation.plmMissing = calculateLedgerAiPreparationMissing(preparation);
    preparation.loading = false;
    preparation.loadingStage = '生图资料检查完成';
    preparation.loadingDetail = preparation.plmMissing.length ? '已完成读取，正在展示缺少的字段和效果图检查结果。' : '文案和 SKU 效果图已完成检查，可以继续保存或提交。';
    preparation.updatedAtMs = Date.now();
    if (state.view === 'ledger' && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku)) {
      renderLedgerAiImageViewer(ensurePanel());
    }
    return preparation;
  }

  function getLedgerAiImagePreparationPayload(preparation) {
    const missing = getLedgerAiPreparationMissing(preparation);
    if (missing.length) {
      const error = new Error('AI 生图资料不完整：' + missing.join('、'));
      error.ledgerAiImagePreflight = {
        missingCopywriting: missing.some((item) => item !== 'SKU 效果图'),
        missingCopywriteFields: missing.filter((item) => !/^成分/.test(item) && item !== 'SKU 效果图'),
        missingIngredientFields: missing.filter((item) => /^成分/.test(item)),
        skuImageStatus: preparation && preparation.skuImage && preparation.skuImage.status || 'unknown',
        skuImageReason: preparation && preparation.skuImage && preparation.skuImage.reason || '',
      };
      throw error;
    }
    return { code: preparation.sku, copywrite: normalizeLedgerAiImageCopywriteItems(preparation.copywrite), ...(preparation.ingredients || {}) };
  }

  function ledgerAiImageLoadingHtml(title, detail, options) {
    const submitting = Boolean(options && options.submitting);
    const note = submitting
      ? '已开始向 PLM 提交生图请求，请勿重复点击；提交完成后会显示“生图中”，可手动刷新查看结果。'
      : '这是后台读取和校验，不会自动提交生图；网络较慢时仍可继续等待。';
    return '<div class="pfh-ledger-ai-image-loading" role="status" aria-live="polite"><span class="pfh-ledger-ai-loading-spinner" aria-hidden="true"></span><div><strong>' + escapeHtml(title || '正在读取生图资料') + '</strong><p>' + escapeHtml(detail || '正在从 PLM 读取资料，请稍候…') + '</p><small>' + escapeHtml(note) + '</small></div></div>';
  }

  function ledgerAiImagePreparationHtml(record, kind) {
    const preparation = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(record && record.sku)];
    const submitting = /(?:准备提交|提交 PLM AI 生图|已开始提交|生图请求)/i.test(String(record && record.aiImageMessage || ''));
    if (!preparation) return ledgerAiImageLoadingHtml('正在准备生图资料', '页面会依次读取产品文案、商品详情和 SKU 效果图，请稍候…', { submitting });
    if (preparation.loading) return ledgerAiImageLoadingHtml(preparation.loadingStage || '正在读取生图资料', preparation.loadingDetail || '正在从 PLM 读取生图前置资料，请稍候…', { submitting });
    const rows = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.map((rule) => {
      const item = ensureLedgerAiPreparationCopyItem(preparation, rule);
      const values = getLedgerAiImageCopywriteValues(item);
      return '<fieldset class="pfh-ledger-ai-prep-row"><legend>' + escapeHtml(rule.label) + '</legend><label>中文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(values.value_cn) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="copy" data-prep-key="' + escapeHtml(rule.key) + '" data-prep-lang="cn" placeholder="填写 PLM 中文' + escapeHtml(rule.label) + '">' + escapeHtml(values.value_cn) + '</textarea></label><label>英文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(values.value) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="copy" data-prep-key="' + escapeHtml(rule.key) + '" data-prep-lang="en" placeholder="填写 PLM 英文' + escapeHtml(rule.label) + '">' + escapeHtml(values.value) + '</textarea></label></fieldset>';
    }).join('');
    const ingredientRows = [
      ['product_ingredients_summary', '成分'],
      ['product_ingredients_efficacy', '成分功能'],
    ].map(([key, label]) => '<fieldset class="pfh-ledger-ai-prep-row"><legend>' + label + '</legend><label>中文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(preparation.ingredients[key + '_ch']) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="ingredient" data-prep-key="' + key + '_ch" placeholder="填写 PLM 中文' + label + '">' + escapeHtml(preparation.ingredients[key + '_ch'] || '') + '</textarea></label><label>英文<textarea class="pfh-ledger-ai-prep-input' + (isValidLedgerAiImageText(preparation.ingredients[key + '_en']) ? '' : ' is-missing') + '" data-prep-sku="' + escapeHtml(record.sku) + '" data-prep-kind="ingredient" data-prep-key="' + key + '_en" placeholder="填写 PLM 英文' + escapeHtml(label) + '">' + escapeHtml(preparation.ingredients[key + '_en'] || '') + '</textarea></label></fieldset>').join('');
    const missing = getLedgerAiPreparationMissing(preparation);
    const imageStatus = preparation.skuImage && preparation.skuImage.status === 'available' ? 'SKU 效果图已就绪' : 'SKU 效果图不可用：' + (preparation.skuImage && preparation.skuImage.reason || '未找到');
    const prepKey = getLedgerAiPreparationKey(record.sku);
    const busy = Boolean(state.ledgerAiImageAutofillRequests[prepKey]);
    const saving = Boolean(state.ledgerAiImageSaveRequests[prepKey] || preparation.saving);
    const preparationNotice = preparation.error || preparation.plmDetailError
      ? (preparation.error || preparation.plmDetailError) + '；当前按 PLM 资料不完整处理。'
      : (missing.length
        ? 'PLM 数据检测缺少：' + missing.join('、') + '。填写后请点击“保存到 PLM 草稿”；没有 SKU 效果图时不会允许开始 AI 生图。'
        : 'PLM 草稿已保存且后台回读完整；提交前还会再次校验文案和 SKU 效果图。');
    return '<div class="pfh-ledger-ai-preparation"><div class="pfh-ledger-ai-prep-head"><div><strong>生图资料</strong><span class="' + (missing.length ? 'is-missing' : 'is-ready') + '">' + escapeHtml(missing.length ? 'PLM 还缺 ' + missing.length + ' 项' : 'PLM 资料已完整') + '</span></div><p>' + escapeHtml(imageStatus) + '</p></div><div class="pfh-ledger-ai-prep-grid">' + rows + ingredientRows + '</div><div class="pfh-ledger-ai-prep-actions"><button type="button" data-action="ledger-ai-prep-save" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (saving ? ' disabled' : '') + '>' + (saving ? '正在保存…' : '保存到 PLM 草稿') + '</button><button type="button" data-action="ledger-ai-prep-refresh" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '">重新检测</button><button type="button" data-action="ledger-ai-prep-autofill" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (busy || saving ? ' disabled' : '') + '>' + (busy ? '正在补齐并保存…' : 'AI 补齐并保存草稿') + '</button><button type="button" class="is-primary pfh-ledger-ai-prep-submit" data-action="ledger-ai-image-generate" data-kind="' + (kind === 'detail' ? 'detail' : 'main') + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (missing.length || saving ? ' disabled' : '') + '>PLM 资料完整，提交 AI 生图</button></div><p class="pfh-ledger-ai-prep-missing">' + escapeHtml(preparationNotice) + '</p></div>';
  }

  function isLedgerAiImageDedicatedAttribute(attr) {
    const variableName = String(attr && attr.variable_name || '').trim();
    const label = getApiAttributeLabel(attr);
    return /^sku[_\s-]*pic$/i.test(variableName)
      || /(?:SKU\s*(?:图|效果图|diagram)|SKU图)/i.test(label);
  }

  function getLedgerAiImageSkuAttributes(contentPayload) {
    const attrs = getApiDetailAttributes(contentPayload);
    const list = Array.isArray(attrs) ? attrs : [];
    const dedicated = list.find(isLedgerAiImageDedicatedAttribute);
    const genericPicture = list.find((attr) => {
      const variableName = String(attr && attr.variable_name || '').trim();
      const label = getApiAttributeLabel(attr);
      return Number(attr && attr.attr_id) === 148
        || /^(?:picture|product[_\s-]*(?:pic|image))$/i.test(variableName)
        || /(?:^|\s)(?:picture|图片|产品图)(?:\s|$)/i.test(label);
    });
    return [dedicated, genericPicture].filter((attr, index, items) => attr && items.indexOf(attr) === index);
  }

  function getLedgerAiImageSkuAttribute(contentPayload) {
    return getLedgerAiImageSkuAttributes(contentPayload)[0] || null;
  }

  async function inspectLedgerAiImageSkuContent(contentPayload) {
    const attrs = getLedgerAiImageSkuAttributes(contentPayload);
    if (!attrs.length) return { status: 'unknown', reason: 'PLM 产品详情未返回 SKU 图或产品图片字段' };
    let foundField = false;
    const candidates = [];
    for (const attr of attrs) {
      const rawValue = getApiAttributeValue(attr, 1);
      const directUrl = getApiAssetUrl(rawValue, 0);
      const ids = getApiAttributeFileIds([attr], /sku[_\s-]*pic|SKU\s*(?:图|效果图|diagram)|picture|图片|产品图/i);
      if (directUrl || ids.length) foundField = true;
      candidates.push({
        attr,
        directUrl,
        fileIds: ids,
        source: isLedgerAiImageDedicatedAttribute(attr) ? 'plm-sku-pic' : 'plm-picture',
      });
    }

    const resolveArchiveImage = async (candidate) => {
      if (!candidate || !candidate.fileIds.length) return null;
      const files = (await fetchApiArchiveFileRecordsByIds(candidate.fileIds))
        .map(buildApiArchiveFileInfo)
        .filter((file) => file.url && (/(?:jpg|jpeg|png|webp|gif|bmp|avif)/i.test(file.fileName) || /(?:jpg|jpeg|png|webp|gif|bmp|avif)/i.test(file.fileFormat)));
      return files.find((file) => candidate.fileIds.includes(String(file.fileId))) || null;
    };

    const dedicated = candidates.find((candidate) => isLedgerAiImageDedicatedAttribute(candidate.attr));
    const generic = candidates.find((candidate) => !isLedgerAiImageDedicatedAttribute(candidate.attr));
    if (dedicated && dedicated.directUrl) return { status: 'available', url: dedicated.directUrl, source: dedicated.source };
    try {
      const dedicatedImage = await resolveArchiveImage(dedicated);
      if (dedicatedImage) return { status: 'available', url: dedicatedImage.url, source: dedicated.source, fileId: dedicatedImage.fileId };
      if (generic && generic.directUrl) return { status: 'available', url: generic.directUrl, source: generic.source };
      const genericImage = await resolveArchiveImage(generic);
      if (genericImage) return { status: 'available', url: genericImage.url, source: generic.source, fileId: genericImage.fileId };
      return { status: 'missing', reason: foundField ? 'PLM 的 SKU 图附件不存在' : 'PLM 的 SKU 图/产品图片字段为空' };
    } catch (error) {
      if (generic && generic.directUrl) return { status: 'available', url: generic.directUrl, source: generic.source };
      return { status: 'unknown', reason: '读取 SKU 图附件失败：' + (formatErrorMessage(error) || '接口异常') };
    }
  }

  async function fetchLedgerAiImageSkuPreflight(sku, data) {
    const normalizedSku = String(sku || '').trim().toUpperCase();
    const seed = normalizeData({ ...(data || {}), sku: normalizedSku });
    let fallbackReason = '';
    try {
      const snapshot = await fetchApiProductSnapshot(seed, { force: true });
      let contentPayload = snapshot && snapshot.contentPayload;
      if (snapshot && snapshot.productId && snapshot.productVersionId && snapshot.categoryId) {
        try {
          contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(snapshot.productId) + '&category_id=' + encodeURIComponent(snapshot.categoryId) + '&product_version_id=' + encodeURIComponent(snapshot.productVersionId));
        } catch (_) {
          // Fall back to the read-only snapshot when the edit endpoint is unavailable.
        }
      }
      if (contentPayload) {
        const result = await inspectLedgerAiImageSkuContent(contentPayload);
        if (result.status !== 'unknown') return result;
        fallbackReason = result.reason || '';
      } else if (snapshot && snapshot.contentError) {
        fallbackReason = snapshot.contentError;
      }
    } catch (error) {
      fallbackReason = formatErrorMessage(error) || '';
    }

    let projectId = getProjectIdForMaterialApi(seed);
    if (!projectId) {
      try {
        const project = await fetchApiProjectSnapshot(seed, { force: true });
        projectId = String(project && project.projectId || '').trim();
      } catch (error) {
        fallbackReason = fallbackReason || formatErrorMessage(error) || '';
      }
    }
    if (!projectId || !/^\d+$/.test(projectId)) {
      return { status: 'unknown', reason: fallbackReason || '未找到对应的 PLM 项目，无法确认 SKU 图' };
    }

    try {
      const infoPayload = await fetchPlmJson('/api/ChemicalNewDesignTask/GetProductDetailInfo?id=' + encodeURIComponent(projectId));
      const info = getApiPayloadDataObject(infoPayload);
      const categoryId = String(info.category_id || seed.categoryId || '').trim();
      if (!categoryId) return { status: 'unknown', reason: 'PLM 项目缺少类目，无法确认 SKU 图' };
      const contentPayload = await fetchPlmJson('/api/ChemicalNewDesignTask/GetProductDetailContent?id=' + encodeURIComponent(projectId) + '&category_id=' + encodeURIComponent(categoryId));
      return inspectLedgerAiImageSkuContent(contentPayload);
    } catch (error) {
      return { status: 'unknown', reason: '读取 PLM SKU 图字段失败：' + (formatErrorMessage(error) || fallbackReason || '接口异常') };
    }
  }

  async function getLedgerAiImageTaskExists(sku) {
    const normalizedSku = String(sku || '').trim();
    if (!normalizedSku) return null;
    try {
      const payload = await fetchPlmJson(LEDGER_AI_IMAGE_TASK_ENDPOINT + '?code=' + encodeURIComponent(normalizedSku));
      if (payload && payload.success === false) return null;
      return payload && payload.data === true;
    } catch (_) {
      return null;
    }
  }

  async function prepareLedgerAiImageGenerationPayload(sku, suppliedPreparation) {
    const normalizedSku = String(sku || '').trim();
    if (!normalizedSku) throw new Error('缺少 SKU，无法开始 AI 生图');
    const prepared = suppliedPreparation && !suppliedPreparation.loading
      ? suppliedPreparation
      : await loadLedgerAiImagePreparation(normalizedSku, true);
    return getLedgerAiImagePreparationPayload(prepared);
  }

  function ledgerAiImageResultMatches(record, result) {
    if (!record || !result) return false;
    return normalizeLedgerAiImageStatus(record.aiImageStatus) === result.status
      && String(record.aiImageMessage || '') === String(result.message || '')
      && String(record.aiImageJobId || '') === String(result.jobId || '')
      && JSON.stringify(normalizeLedgerAiImageItems(record.aiMainImages, 12)) === JSON.stringify(result.mainImages)
      && JSON.stringify(normalizeLedgerAiImageItems(record.aiDetailImages, 20)) === JSON.stringify(result.detailImages);
  }

  function updateLedgerAiImageRecord(sku, dateKey, patch, shouldSave) {
    const updated = updateDailyLedgerForSku(sku, { ...(patch || {}), deferSave: true, skipStorageSync: true }, dateKey);
    if (updated && shouldSave) saveDailyLedger();
    return updated;
  }

  function getLedgerAiImageFieldNames(kind) {
    const isDetail = kind === 'detail';
    return {
      kind: isDetail ? 'detail' : 'main',
      originalField: isDetail ? 'aiDetailImages' : 'aiMainImages',
      retouchedField: isDetail ? 'aiDetailRetouchedImages' : 'aiMainRetouchedImages',
      taskField: isDetail ? 'aiDetailRetouchTasks' : 'aiMainRetouchTasks',
      hiddenField: isDetail ? 'aiDetailHiddenImageKeys' : 'aiMainHiddenImageKeys',
      imageLimit: isDetail ? 20 : 12,
    };
  }

  function getLedgerAiImageRetouchRequestKey(sku, dateKey, kind, imageUrl, prompt) {
    return [getLedgerSkuKey(sku), normalizeLedgerDate(dateKey) || '', kind === 'detail' ? 'detail' : 'main', String(imageUrl || ''), String(prompt || '').trim()].join('|');
  }

  function createLedgerAiImageRetouchTaskId() {
    const random = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
    return 'retouch-' + Date.now().toString(36) + '-' + random;
  }

  function getLedgerAiImageRetouchSource(record, kind, imageUrl) {
    if (!record) return null;
    const fields = getLedgerAiImageFieldNames(kind);
    const targetUrl = String(imageUrl || '').trim();
    return normalizeLedgerAiImageItems(record[fields.originalField], fields.imageLimit)
      .concat(normalizeLedgerAiImageItems(record[fields.retouchedField], LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS))
      .find((item) => item.url === targetUrl) || null;
  }

  function getLedgerAiImageRetouchTasks(record, kind) {
    const fields = getLedgerAiImageFieldNames(kind);
    return normalizeLedgerAiImageRetouchTasks(record && record[fields.taskField], LEDGER_AI_IMAGE_RETOUCH_MAX_TASKS);
  }

  function getLedgerAiImageHiddenKeys(record, kind) {
    const fields = getLedgerAiImageFieldNames(kind);
    return new Set(normalizeLedgerAiImageHiddenKeys(record && record[fields.hiddenField], LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS));
  }

  function isLedgerAiImageViewerFor(sku, dateKey) {
    const viewer = state.ledgerAiImageViewer;
    return Boolean(viewer
      && getLedgerSkuKey(viewer.sku) === getLedgerSkuKey(sku)
      && (!dateKey || normalizeLedgerDate(viewer.date) === normalizeLedgerDate(dateKey)));
  }

  function renderLedgerAiImageRetouchState(sku, dateKey) {
    if (isLedgerAiImageViewerFor(sku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
  }

  function parseLedgerAiImageRetouchResult(payload) {
    const raw = payload && typeof payload.data === 'object'
      ? payload.data.url || payload.data.imageUrl || payload.data.path
      : payload && payload.data;
    const normalized = normalizeLedgerAiImageItems([{ url: raw }], 1)[0];
    if (!normalized) throw new Error('PLM 未返回有效的修改图片地址');
    return normalized.url;
  }

  async function submitLedgerAiImageRetouch(sku, dateKey, kind, imageUrl, prompt) {
    const normalizedSku = String(sku || '').trim();
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const normalizedDate = normalizeLedgerDate(dateKey) || getTodayKey();
    const normalizedPrompt = String(prompt || '').trim();
    const record = findLedgerRecord(normalizedSku, normalizedDate);
    const source = getLedgerAiImageRetouchSource(record, normalizedKind, imageUrl);
    if (!record || !source || !normalizedPrompt) return null;
    const requestKey = getLedgerAiImageRetouchRequestKey(normalizedSku, normalizedDate, normalizedKind, source.url, normalizedPrompt);
    const existingRequest = state.ledgerAiImageRetouchRequests[requestKey];
    if (existingRequest) {
      showToast('这张图的相同修改正在处理中，关闭弹窗也会继续');
      return existingRequest;
    }
    const fields = getLedgerAiImageFieldNames(normalizedKind);
    const allOriginals = normalizeLedgerAiImageItems(record[fields.originalField], fields.imageLimit);
    const sourceIndex = allOriginals.findIndex((item) => item.url === source.url);
    const displayName = getLedgerAiImageDisplayName(source, normalizedKind, sourceIndex >= 0 ? sourceIndex : 0);
    const baseUrl = String(source.baseUrl || source.url || '').trim();
    const baseFilename = String(source.baseFilename || getLedgerAiImageSourceFilename(source) || displayName + '.png').trim();
    const sequence = getLedgerAiImageSequence(source) || (sourceIndex >= 0 ? sourceIndex + 1 : 0);
    const now = Date.now();
    const task = {
      id: createLedgerAiImageRetouchTaskId(),
      sourceUrl: source.url,
      displayName,
      baseFilename,
      sequence,
      prompt: normalizedPrompt,
      status: 'running',
      error: '',
      createdAt: new Date(now).toLocaleString(),
      createdAtMs: now,
      updatedAtMs: now,
    };
    const currentTasks = getLedgerAiImageRetouchTasks(record, normalizedKind)
      .filter((item) => !(item.sourceUrl === task.sourceUrl && item.prompt === task.prompt));
    const taskUpdated = updateLedgerAiImageRecord(normalizedSku, normalizedDate, {
      [fields.taskField]: [task].concat(currentTasks),
    }, true);
    if (!taskUpdated) return null;
    showToast(displayName + ' 修改任务已提交，完成后可关闭并重新打开查看');
    const request = (async () => {
      try {
        const payload = await fetchPlmApiJson(LEDGER_AI_IMAGE_RETOUCH_ENDPOINT, {
          code: normalizedSku,
          prompt: normalizedPrompt,
          image: source.url,
        }, { timeout: LEDGER_AI_IMAGE_RETOUCH_TIMEOUT_MS });
        const resultUrl = parseLedgerAiImageRetouchResult(payload);
        const extension = getLedgerAiImageExtension(source) || '.png';
        const retouchedItem = normalizeLedgerAiImageItems([{
          url: resultUrl,
          filename: displayName + extension,
          displayName,
          baseUrl,
          parentUrl: source.url,
          baseFilename,
          prompt: normalizedPrompt,
          sequence,
          createdAt: new Date().toLocaleString(),
          createdAtMs: Date.now(),
        }], 1)[0];
        if (!retouchedItem) throw new Error('修改图片地址无法保存');
        const latest = findLedgerRecord(normalizedSku, normalizedDate) || record;
        const latestRetouched = normalizeLedgerAiImageItems(latest[fields.retouchedField], LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS);
        const latestTasks = getLedgerAiImageRetouchTasks(latest, normalizedKind)
          .filter((item) => item.id !== task.id && !(item.sourceUrl === task.sourceUrl && item.prompt === task.prompt));
        const updated = updateLedgerAiImageRecord(normalizedSku, normalizedDate, {
          [fields.retouchedField]: [retouchedItem].concat(latestRetouched.filter((item) => item.url !== retouchedItem.url)),
          [fields.taskField]: latestTasks,
          aiImageMessage: 'AI 生图与修改图已保存到工作台',
        }, true) || latest;
        refreshLedgerCard(updated);
        renderLedgerAiImageRetouchState(normalizedSku, normalizedDate);
        showToast(displayName + ' 修改完成，原图和修改图都已保留');
        return updated;
      } catch (error) {
        const latest = findLedgerRecord(normalizedSku, normalizedDate) || record;
        const latestTasks = getLedgerAiImageRetouchTasks(latest, normalizedKind).map((item) => item.id === task.id
          ? { ...item, status: 'error', error: formatErrorMessage(error) || '修改图片失败', updatedAtMs: Date.now() }
          : item);
        const updated = updateLedgerAiImageRecord(normalizedSku, normalizedDate, {
          [fields.taskField]: latestTasks,
        }, true) || latest;
        refreshLedgerCard(updated);
        renderLedgerAiImageRetouchState(normalizedSku, normalizedDate);
        showToast(displayName + ' 修改失败：' + (formatErrorMessage(error) || '网络请求失败'));
        return updated;
      }
    })();
    state.ledgerAiImageRetouchRequests[requestKey] = request;
    renderLedgerAiImageRetouchState(normalizedSku, normalizedDate);
    try {
      return await request;
    } finally {
      if (state.ledgerAiImageRetouchRequests[requestKey] === request) delete state.ledgerAiImageRetouchRequests[requestKey];
    }
  }

  function closeLedgerAiImageRetouchComposer() {
    const panel = document.getElementById(PANEL_ID);
    const layer = panel && panel.querySelector('.pfh-ledger-ai-retouch-composer-layer');
    if (layer) layer.remove();
    state.ledgerAiImageRetouchComposer = null;
  }

  function renderLedgerAiImageRetouchComposer() {
    const composer = state.ledgerAiImageRetouchComposer;
    const panel = document.getElementById(PANEL_ID) || ensurePanel();
    if (!composer || !panel) {
      const stale = panel && panel.querySelector('.pfh-ledger-ai-retouch-composer-layer');
      if (stale) stale.remove();
      return;
    }
    const full = panel.querySelector('.pfh-full') || panel;
    let layer = full.querySelector('.pfh-ledger-ai-retouch-composer-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-ledger-ai-retouch-composer-layer';
      layer.setAttribute('data-action', 'ledger-ai-retouch-composer-close');
      full.appendChild(layer);
    }
    const groups = [];
    LEDGER_AI_IMAGE_RETOUCH_QUICK_PHRASES.forEach((phrase) => {
      let group = groups.find((item) => item.name === phrase.group);
      if (!group) {
        group = { name: phrase.group, items: [] };
        groups.push(group);
      }
      group.items.push(phrase.text);
    });
    const quickHtml = groups.map((group) => '<div class="pfh-ledger-ai-retouch-quick-group"><strong>' + escapeHtml(group.name) + '</strong><div class="pfh-ledger-ai-retouch-quick-items">' + group.items.map((text) => '<button type="button" data-action="ledger-ai-retouch-quick-phrase" data-text="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>').join('') + '</div></div>').join('');
    const sourceFilename = String(composer.sourceFilename || '').trim();
    layer.innerHTML = '<section class="pfh-ledger-ai-retouch-composer" role="dialog" aria-modal="true" aria-label="修改图片"><header><div><h3>修改图 · ' + escapeHtml(composer.displayName || '当前图片') + '</h3><p>可直接输入修改要求，也可以点击右侧快捷语录追加；提交后原图仍会保留。</p></div><button type="button" data-action="ledger-ai-retouch-composer-close" aria-label="关闭">×</button></header><div class="pfh-ledger-ai-retouch-compose-body"><div class="pfh-ledger-ai-retouch-compose-target"><img src="' + escapeHtml(composer.imageUrl) + '" alt="' + escapeHtml(composer.displayName || '当前图片') + '" loading="eager" decoding="async"><strong>' + escapeHtml(composer.displayName || '当前图片') + '</strong><small>' + escapeHtml(sourceFilename || '保留原图文件名') + '</small></div><div class="pfh-ledger-ai-retouch-compose-editor"><label>修改要求<textarea class="pfh-ledger-ai-retouch-composer-input" data-action="ledger-ai-retouch-composer-input" placeholder="例如：内料改成蓝色，纸盒只展示正面，其他元素保持不变"></textarea></label><div class="pfh-ledger-ai-retouch-quick-head"><span>快捷语录 <small>点击后追加到输入框</small></span><button type="button" data-action="ledger-ai-retouch-composer-clear">清空</button></div><div class="pfh-ledger-ai-retouch-quick-list">' + quickHtml + '</div><p class="pfh-ledger-ai-retouch-quick-tip">提示：XX色、XX材质等占位词可以直接改成你的具体要求；多条语录可以连续点击。</p></div></div><footer><span>通常约 45 秒返回；关闭工作台不会取消任务。</span><div><button type="button" data-action="ledger-ai-retouch-composer-close">取消</button><button type="button" class="is-primary" data-action="ledger-ai-retouch-composer-submit">提交修改</button></div></footer></section>';
    const input = layer.querySelector('.pfh-ledger-ai-retouch-composer-input');
    if (input) {
      input.value = String(composer.value || '');
      if (!layer.dataset.focused) {
        layer.dataset.focused = '1';
        window.requestAnimationFrame(() => {
          if (input.isConnected) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        });
      }
    }
  }

  function openLedgerAiImageRetouchComposer(sku, dateKey, kind, imageUrl) {
    const record = findLedgerRecord(sku, dateKey);
    const source = getLedgerAiImageRetouchSource(record, kind, imageUrl);
    if (!record || !source) return;
    const fields = getLedgerAiImageFieldNames(kind);
    const originalItems = normalizeLedgerAiImageItems(record[fields.originalField], fields.imageLimit);
    const sourceIndex = originalItems.findIndex((item) => item.url === source.url);
    const displayName = getLedgerAiImageDisplayName(source, kind, sourceIndex >= 0 ? sourceIndex : 0);
    closeLedgerAiImageRetouchComposer();
    state.ledgerAiImageRetouchComposer = {
      sku: String(sku || '').trim(),
      dateKey: normalizeLedgerDate(dateKey) || getTodayKey(),
      kind: kind === 'detail' ? 'detail' : 'main',
      imageUrl: source.url,
      displayName,
      sourceFilename: getLedgerAiImageSourceFilename(source),
      value: '',
    };
    renderLedgerAiImageRetouchComposer();
  }

  function promptLedgerAiImageRetouch(sku, dateKey, kind, imageUrl) {
    openLedgerAiImageRetouchComposer(sku, dateKey, kind, imageUrl);
  }

  function appendLedgerAiImageRetouchPhrase(text) {
    const composer = state.ledgerAiImageRetouchComposer;
    const phrase = String(text || '').trim();
    if (!composer || !phrase) return;
    const current = String(composer.value || '').trim();
    const lines = current.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (lines.includes(phrase)) {
      showToast('这条快捷语录已经添加');
      return;
    }
    composer.value = current ? current + '\n' + phrase : phrase;
    const input = document.querySelector('#' + PANEL_ID + ' .pfh-ledger-ai-retouch-composer-input');
    if (input) {
      input.value = composer.value;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  function clearLedgerAiImageRetouchComposer() {
    const composer = state.ledgerAiImageRetouchComposer;
    if (!composer) return;
    composer.value = '';
    const input = document.querySelector('#' + PANEL_ID + ' .pfh-ledger-ai-retouch-composer-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  function submitLedgerAiImageRetouchComposer() {
    const composer = state.ledgerAiImageRetouchComposer;
    if (!composer) return;
    const prompt = String(composer.value || '').trim();
    if (!prompt) {
      showToast('修改提示词不能为空');
      const input = document.querySelector('#' + PANEL_ID + ' .pfh-ledger-ai-retouch-composer-input');
      if (input) input.focus();
      return;
    }
    const payload = { ...composer };
    closeLedgerAiImageRetouchComposer();
    submitLedgerAiImageRetouch(payload.sku, payload.dateKey, payload.kind, payload.imageUrl, prompt);
  }

  function getLedgerDetail3Image(record) {
    const items = normalizeLedgerAiImageItems(record && record.aiDetailImages, 20);
    return items.find((item, index) => getLedgerAiImageSequence(item) === 3 || getLedgerAiImageDisplayName(item, 'detail', index) === '详情图3') || null;
  }

  function getLedgerDetail3ExpectedIngredients(sku) {
    const preparation = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(sku)];
    const data = normalizeData(loadData(sku) || { sku });
    const record = normalizeCopywritingRecord(data.copywriting);
    const candidates = [
      preparation && preparation.ingredients && preparation.ingredients.product_ingredients_summary_en,
      data.ingredientEnglish,
      data.copywritingIngredientEnglish,
      record && record.cleanedIngredientEnglish,
      preparation && preparation.ingredients && preparation.ingredients.product_ingredients_summary_ch,
      data.ingredientChinese,
      data.copywritingIngredientChinese,
    ].map((value) => String(value || '').trim()).filter(isValidLedgerAiImageText);
    // Some PLM deployments put the Chinese value in the *_en field. Prefer a
    // candidate without CJK characters whenever another English cache exists,
    // but keep Chinese as a last-resort input so the Worker can translate it
    // internally instead of incorrectly rejecting the audit.
    return candidates.find((value) => !/[\u3400-\u9fff]/.test(value)) || candidates[0] || '';
  }

  async function auditLedgerDetail3(sku, dateKey, force) {
    const normalizedSku = getLedgerSkuKey(sku);
    const key = [normalizedSku, normalizeLedgerDate(dateKey) || ''].join('|');
    if (state.ledgerDetail3AuditRequests[key]) return state.ledgerDetail3AuditRequests[key];
    const record = findLedgerRecord(normalizedSku, dateKey);
    const image = getLedgerDetail3Image(record);
    if (!record || !image) return null;
    const expectedIngredients = getLedgerDetail3ExpectedIngredients(normalizedSku);
    const current = normalizeLedgerDetail3Audit(record.aiDetail3Audit);
    if (!force && current.imageUrl === image.url && current.expectedIngredients === expectedIngredients && current.status !== 'idle' && current.status !== 'loading') return current;
    const loading = normalizeLedgerDetail3Audit({ status: 'loading', summary: '正在识别详情图3并核对英文成分…', imageUrl: image.url, expectedIngredients, checkedAtMs: Date.now() });
    const loadingRecord = updateLedgerAiImageRecord(normalizedSku, dateKey, { aiDetail3Audit: loading }, true) || record;
    if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
    const request = (async () => {
      try {
        if (!isValidLedgerAiImageText(expectedIngredients)) throw new Error('英文成分文案为空，无法核对详情图3');
        const response = await cloudRequest('/ai-image/ingredient-audit', { method: 'POST', timeoutMs: 150000, body: { sku: normalizedSku, imageUrl: image.url, expectedIngredients } });
        if (!response || !response.ok) throw new Error(response && response.summary || response && response.error || 'AI 识别失败');
        const audit = normalizeLedgerDetail3Audit({ ...response, imageUrl: image.url, expectedIngredients, checkedAtMs: Date.now() });
        const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, { aiDetail3Audit: audit }, true) || loadingRecord;
        refreshLedgerCard(updated);
        if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
        if (audit.status === 'warning' || audit.status === 'error') showToast(normalizedSku + ' 详情图3发现异常：' + (audit.summary || '请检查成分展示'));
        return audit;
      } catch (error) {
        const audit = normalizeLedgerDetail3Audit({ status: 'error', summary: formatErrorMessage(error) || '详情图3识别失败', retryable: Boolean(error && error.cloudData && error.cloudData.retryable) || /insufficient balance|timeout|aborted|overload|high demand|429|5\d\d/i.test(formatErrorMessage(error)), imageUrl: image.url, expectedIngredients, checkedAtMs: Date.now() });
        const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, { aiDetail3Audit: audit }, true) || loadingRecord;
        refreshLedgerCard(updated);
        if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
        return audit;
      }
    })();
    state.ledgerDetail3AuditRequests[key] = request;
    try { return await request; }
    finally { if (state.ledgerDetail3AuditRequests[key] === request) delete state.ledgerDetail3AuditRequests[key]; }
  }

  function clearLedgerAiImagePoll(sku) {
    const key = getLedgerAiImageRequestKey(sku);
    window.clearTimeout(state.ledgerAiImagePollTimers[key]);
    delete state.ledgerAiImagePollTimers[key];
    delete state.ledgerAiImagePollCounts[key];
  }

  function scheduleLedgerAiImagePoll(sku, dateKey) {
    const key = getLedgerAiImageRequestKey(sku);
    window.clearTimeout(state.ledgerAiImagePollTimers[key]);
    const count = Number(state.ledgerAiImagePollCounts[key] || 0) + 1;
    if (count > LEDGER_AI_IMAGE_MAX_POLLS) {
      delete state.ledgerAiImagePollTimers[key];
      return;
    }
    state.ledgerAiImagePollCounts[key] = count;
    state.ledgerAiImagePollTimers[key] = window.setTimeout(() => {
      delete state.ledgerAiImagePollTimers[key];
      if (state.view !== 'ledger' || state.ledgerView !== 'finalized') return;
      const viewer = state.ledgerAiImageViewer;
      queryLedgerAiImageStatus(sku, dateKey, {
        openViewer: Boolean(viewer && getLedgerSkuKey(viewer.sku) === getLedgerSkuKey(sku)),
      });
    }, LEDGER_AI_IMAGE_POLL_DELAY_MS);
  }

  function openLedgerAiImageViewer(record) {
    if (!record) return;
    const previous = state.ledgerAiImageViewer;
    const sameRecord = Boolean(previous
      && getLedgerSkuKey(previous.sku) === getLedgerSkuKey(record.sku)
      && normalizeLedgerDate(previous.date) === normalizeLedgerDate(record.date));
    state.ledgerAiImageViewer = {
      sku: record.sku,
      date: record.date,
      tab: sameRecord ? previous.tab : 'main',
      selected: sameRecord && previous.selected
        ? { ...previous.selected }
        : { main: '', detail: '' },
    };
    renderLedgerAiImageViewer(ensurePanel());
  }

  function closeLedgerAiImageViewer() {
    closeLedgerAiImageRetouchComposer();
    state.ledgerAiImageViewer = null;
    renderLedgerAiImageViewer(ensurePanel());
  }

  function hideLedgerAiImageEntry(sku, dateKey, kind, entryKey) {
    const normalizedSku = String(sku || '').trim();
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const key = String(entryKey || '').trim();
    const record = findLedgerRecord(normalizedSku, dateKey);
    if (!record || !key) return;
    const fields = getLedgerAiImageFieldNames(normalizedKind);
    const hiddenKeys = normalizeLedgerAiImageHiddenKeys(record[fields.hiddenField], LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS);
    if (!hiddenKeys.includes(key)) hiddenKeys.push(key);
    const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
      [fields.hiddenField]: hiddenKeys,
    }, true);
    if (!updated) return;
    refreshLedgerCard(updated);
    showToast((normalizedKind === 'detail' ? '详情图' : '主图') + '已从悬浮助手隐藏，PLM 原图未删除');
    renderLedgerAiImageViewer(ensurePanel());
  }

  function restoreLedgerAiImageHidden(sku, dateKey, kind) {
    const normalizedSku = String(sku || '').trim();
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const record = findLedgerRecord(normalizedSku, dateKey);
    if (!record) return;
    const fields = getLedgerAiImageFieldNames(normalizedKind);
    const hiddenKeys = normalizeLedgerAiImageHiddenKeys(record[fields.hiddenField], LEDGER_AI_IMAGE_HIDDEN_MAX_KEYS);
    if (!hiddenKeys.length) return;
    const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
      [fields.hiddenField]: [],
    }, true);
    if (!updated) return;
    refreshLedgerCard(updated);
    showToast('已恢复' + (normalizedKind === 'detail' ? '详情图' : '主图') + '列表');
    renderLedgerAiImageViewer(ensurePanel());
  }

  function downloadLedgerAiImageZip(sku, dateKey, kind) {
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    if (state.ledgerAiImageDownloadKey) return Promise.resolve(false);
    const record = findLedgerRecord(sku, dateKey);
    if (!record) return Promise.resolve(false);
    const images = getLedgerAiImageDownloadItems(record, normalizedKind);
    const label = normalizedKind === 'detail' ? '详情图' : '主图';
    if (!images.length) {
      showToast('当前没有可下载的' + label);
      return Promise.resolve(false);
    }
    const downloadKey = getLedgerAiImageDownloadKey(record.sku, record.date, normalizedKind);
    state.ledgerAiImageDownloadKey = downloadKey;
    state.ledgerAiImageDownloadProgress = '准备并发下载 ' + images.length + ' 张' + label + '（' + LEDGER_AI_IMAGE_DOWNLOAD_CONCURRENCY + ' 路）…';
    renderLedgerAiImageViewer(ensurePanel());
    return (async () => {
      const downloaded = new Array(images.length);
      const workerCount = Math.min(LEDGER_AI_IMAGE_DOWNLOAD_CONCURRENCY, images.length);
      let nextIndex = 0;
      let completed = 0;
      let firstError = null;
      const workers = Array.from({ length: workerCount }, async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= images.length) return;
          const item = images[index];
          const displayName = getLedgerAiImageDisplayName(item, normalizedKind, index);
          try {
            const blob = await fetchLedgerAiImageBlob(item.url);
            downloaded[index] = { item, displayName, blob };
          } catch (error) {
            firstError = firstError || new Error(displayName + '：' + (formatErrorMessage(error) || '下载失败'));
          } finally {
            completed += 1;
            state.ledgerAiImageDownloadProgress = '并发下载中 ' + completed + '/' + images.length + ' 张' + label + '…';
            renderLedgerAiImageViewer(ensurePanel());
          }
        }
      });
      await Promise.all(workers);
      if (firstError) throw firstError;
      const files = [];
      const usedNames = Object.create(null);
      downloaded.forEach((entry) => {
        if (!entry || !entry.blob) return;
        const extension = getLedgerAiImageExtension(entry.item, entry.blob);
        const baseFilename = entry.displayName + extension;
        const occurrence = Number(usedNames[baseFilename] || 0) + 1;
        usedNames[baseFilename] = occurrence;
        const filename = occurrence === 1
          ? baseFilename
          : entry.displayName + '-' + occurrence + extension;
        files.push({ path: filename, blob: entry.blob });
      });
      state.ledgerAiImageDownloadProgress = '正在打包 ' + images.length + ' 张' + label + '…';
      renderLedgerAiImageViewer(ensurePanel());
      const zip = await createStoredZipBlob(files, (done, total) => {
        state.ledgerAiImageDownloadProgress = '正在打包 ' + done + '/' + total + ' 张' + label + '…';
        renderLedgerAiImageViewer(ensurePanel());
      });
      downloadBlob(zip, String(record.sku || 'SKU') + '-' + label + '.zip');
      showToast(record.sku + ' 的' + label + '已下载');
      return true;
    })().catch((error) => {
      showToast('下载' + label + '失败：' + (formatErrorMessage(error) || '网络请求失败'));
      return false;
    }).finally(() => {
      if (state.ledgerAiImageDownloadKey === downloadKey) {
        state.ledgerAiImageDownloadKey = '';
        state.ledgerAiImageDownloadProgress = '';
        renderLedgerAiImageViewer(ensurePanel());
      }
    });
  }

  function getLedgerAiImageSingleDownloadKey(sku, dateKey, kind, imageUrl) {
    return getLedgerAiImageDownloadKey(sku, dateKey, kind) + '|item|' + String(imageUrl || '');
  }

  function downloadLedgerAiImageItem(sku, dateKey, kind, imageUrl, displayName) {
    if (state.ledgerAiImageDownloadKey) return;
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const record = findLedgerRecord(sku, dateKey);
    const item = getLedgerAiImageRetouchSource(record, normalizedKind, imageUrl);
    if (!record || !item) return;
    const name = String(displayName || getLedgerAiImageDisplayName(item, normalizedKind, 0)).trim() || (normalizedKind === 'detail' ? '详情图' : '主图');
    const downloadKey = getLedgerAiImageSingleDownloadKey(record.sku, record.date, normalizedKind, item.url);
    state.ledgerAiImageDownloadKey = downloadKey;
    state.ledgerAiImageDownloadProgress = '正在下载 ' + name + '…';
    renderLedgerAiImageViewer(ensurePanel());
    (async () => {
      try {
        const blob = await fetchLedgerAiImageBlob(item.url);
        const extension = getLedgerAiImageExtension(item, blob);
        downloadBlob(blob, name + extension);
        showToast(name + ' 已下载');
      } catch (error) {
        showToast('下载' + name + '失败：' + (formatErrorMessage(error) || '网络请求失败'));
      } finally {
        if (state.ledgerAiImageDownloadKey === downloadKey) {
          state.ledgerAiImageDownloadKey = '';
          state.ledgerAiImageDownloadProgress = '';
          renderLedgerAiImageViewer(ensurePanel());
        }
      }
    })();
  }

  function getLedgerAiImageViewerEntries(record, kind) {
    const fields = getLedgerAiImageFieldNames(kind);
    const originals = normalizeLedgerAiImageItems(record && record[fields.originalField], fields.imageLimit);
    const retouched = normalizeLedgerAiImageItems(record && record[fields.retouchedField], LEDGER_AI_IMAGE_RETOUCH_MAX_ITEMS);
    const tasks = getLedgerAiImageRetouchTasks(record, kind);
    const entries = [];
    originals.forEach((item, index) => entries.push({
      item,
      displayName: getLedgerAiImageDisplayName(item, kind, index),
      sequence: getLedgerAiImageSequence(item) || index + 1,
      isRetouched: false,
      isTask: false,
      rank: 0,
      order: index,
    }));
    retouched.forEach((item, index) => entries.push({
      item,
      displayName: getLedgerAiImageDisplayName(item, kind, index),
      sequence: getLedgerAiImageSequence(item) || Number(item.sequence) || 9999,
      isRetouched: true,
      isTask: false,
      rank: 1,
      order: index,
    }));
    tasks.forEach((task, index) => {
      const source = getLedgerAiImageRetouchSource(record, kind, task.sourceUrl);
      entries.push({
        item: source,
        task,
        displayName: task.displayName || (source ? getLedgerAiImageDisplayName(source, kind, 0) : ((kind === 'detail' ? '详情图' : '主图') + (task.sequence || index + 1))),
        sequence: Number(task.sequence) || (source ? getLedgerAiImageSequence(source) : 9999),
        isRetouched: false,
        isTask: true,
        rank: 2,
        order: index,
      });
    });
    const sortedEntries = entries.sort((left, right) => {
      const leftSequence = Number(left.sequence) || 9999;
      const rightSequence = Number(right.sequence) || 9999;
      const leftTime = Number(left.task && left.task.createdAtMs || left.item && left.item.createdAtMs || 0);
      const rightTime = Number(right.task && right.task.createdAtMs || right.item && right.item.createdAtMs || 0);
      return leftSequence - rightSequence
        || left.rank - right.rank
        || rightTime - leftTime
        || left.order - right.order;
    });
    const hiddenKeys = getLedgerAiImageHiddenKeys(record, kind);
    return sortedEntries.filter((entry) => !hiddenKeys.has(getLedgerAiImageViewerEntryKey(entry)));
  }

  function getLedgerAiImageViewerEntryKey(entry) {
    if (!entry) return '';
    if (entry.isTask) return 'task:' + String(entry.task && entry.task.id || '');
    return 'image:' + String(entry.item && entry.item.url || '');
  }

  function getLedgerAiImageDownloadItems(record, kind) {
    const seen = new Set();
    return getLedgerAiImageViewerEntries(record, kind)
      .filter((entry) => !entry.isTask && entry.item && entry.item.url)
      .map((entry) => entry.item)
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
  }

  function getLedgerAiImageViewerTabCount(record, kind) {
    const entries = getLedgerAiImageViewerEntries(record, kind);
    const originalCount = entries.filter((entry) => !entry.isRetouched && !entry.isTask).length;
    const retouchedCount = entries.filter((entry) => entry.isRetouched).length;
    const taskCount = entries.filter((entry) => entry.isTask).length;
    return String(originalCount) + (retouchedCount ? ' + 改' + retouchedCount : '') + (taskCount ? ' · 中' + taskCount : '');
  }

  function renderLedgerAiImageViewer(panel) {
    if (!panel) return;
    let layer = panel.querySelector('.pfh-ledger-ai-image-layer');
    if (state.view !== 'ledger' || !state.ledgerAiImageViewer) {
      if (layer) layer.remove();
      return;
    }
    const viewer = state.ledgerAiImageViewer;
    const record = findLedgerRecord(viewer.sku, viewer.date);
    if (!record) {
      state.ledgerAiImageViewer = null;
      if (layer) layer.remove();
      return;
    }
    const mainEntries = getLedgerAiImageViewerEntries(record, 'main');
    const detailEntries = getLedgerAiImageViewerEntries(record, 'detail');
    const mainImages = getLedgerAiImageDownloadItems(record, 'main');
    const detailImages = getLedgerAiImageDownloadItems(record, 'detail');
    const tab = viewer.tab === 'detail' ? 'detail' : 'main';
    state.ledgerAiImageViewer.tab = tab;
    const entries = tab === 'detail' ? detailEntries : mainEntries;
    const meta = getLedgerAiImageStatusMeta(record);
    const mainDownloadKey = getLedgerAiImageDownloadKey(record.sku, record.date, 'main');
    const detailDownloadKey = getLedgerAiImageDownloadKey(record.sku, record.date, 'detail');
    const isCurrentDownload = state.ledgerAiImageDownloadKey === mainDownloadKey
      || state.ledgerAiImageDownloadKey === detailDownloadKey
      || String(state.ledgerAiImageDownloadKey || '').indexOf(getLedgerAiImageDownloadKey(record.sku, record.date, tab) + '|item|') === 0;
    const retouchTasks = getLedgerAiImageRetouchTasks(record, tab);
    const detail3Audit = normalizeLedgerDetail3Audit(record.aiDetail3Audit);
    const message = String(record.aiImageMessage || meta.title || '').trim();
    const isSubmissionLoading = meta.status === 'loading' && /(?:准备提交|提交 PLM AI 生图|已开始提交|生图请求)/i.test(message);
    const getEntryViewState = (entry) => {
      const item = entry && entry.item;
      const task = entry && entry.task;
      const displayName = entry && entry.displayName || (tab === 'detail' ? '详情图' : '主图');
      const sourceFilename = item ? getLedgerAiImageSourceFilename(item) : (task && task.baseFilename || '');
      const title = sourceFilename && sourceFilename !== displayName
        ? displayName + ' · ' + sourceFilename
        : displayName;
      const activeTask = task || (item && retouchTasks.find((candidate) => candidate.sourceUrl === item.url && candidate.status === 'running'));
      const activeRequest = activeTask && activeTask.status === 'running'
        ? state.ledgerAiImageRetouchRequests[getLedgerAiImageRetouchRequestKey(record.sku, record.date, tab, activeTask.sourceUrl, activeTask.prompt)]
        : null;
      const taskStatus = activeTask && activeTask.status === 'error'
        ? '修改失败'
        : (activeTask && activeTask.status === 'running' ? '生成中' : (activeTask ? '待重试' : ''));
      const variantLabel = entry && entry.isRetouched ? '修改版' : (task ? taskStatus : '原图');
      const prompt = entry && entry.isRetouched && item && item.prompt
        ? item.prompt
        : (activeTask && activeTask.prompt || '');
      return {
        entry,
        item,
        task,
        displayName,
        sourceFilename,
        title,
        activeTask,
        activeRequest,
        taskStatus,
        variantLabel,
        prompt,
        key: getLedgerAiImageViewerEntryKey(entry),
        isGenerating: Boolean(activeTask && activeTask.status === 'running'),
      };
    };
    if (!viewer.selected) viewer.selected = { main: '', detail: '' };
    let selectedKey = String(viewer.selected[tab] || '');
    let selectedEntry = entries.find((entry) => getLedgerAiImageViewerEntryKey(entry) === selectedKey) || entries[0] || null;
    if (selectedEntry) {
      selectedKey = getLedgerAiImageViewerEntryKey(selectedEntry);
      viewer.selected[tab] = selectedKey;
    }
    const selectedView = selectedEntry ? getEntryViewState(selectedEntry) : null;
    const targetLabel = tab === 'detail' ? '详情图' : '主图';
    const emptyMessage = meta.status === 'loading'
      ? (isSubmissionLoading ? '正在提交 AI 生图请求；提交完成后会显示“生图中”，本次不会自动轮询。' : '正在检查这个 SKU 是否已有生图历史，不会自动提交生图。')
      : (meta.status === 'running'
        ? '图片还在生成，当前只跟踪这个 SKU。'
      : (meta.status === 'task-error'
        ? 'PLM 有生图任务记录，但暂时没有返回图片结果；请先刷新，必要时联系管理员清理任务。'
        : (meta.status === 'result-missing'
          ? 'PLM 返回了完成状态，但没有图片列表；点击下方按钮可手动重新生成。'
          : (meta.status === 'needs-prerequisites'
            ? '生图前置校验未通过，请先补齐产品文案和 SKU 效果图。'
            : (meta.status === 'needs-sku-image'
              ? 'PLM 缺少 SKU 效果图，请先上传 SKU 图后再生成。'
              : (meta.status === 'needs-copywriting'
                ? 'PLM 缺少有效产品文案，请先补齐产品文案后再生成。'
                : (meta.status === 'error'
                  ? '状态查询失败；可以先刷新状态，再手动提交生成。'
                  : '当前没有可查看的' + targetLabel + '；点击下方按钮后才会开始生成。')))))));
    const preparation = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(record.sku)];
    const showPreparation = Boolean(preparation && (preparation.loading || !['loading', 'running'].includes(meta.status)));
    const emptyStateHtml = showPreparation
      ? ledgerAiImagePreparationHtml(record, tab)
      : (meta.status === 'loading'
        ? ledgerAiImageLoadingHtml(meta.label || '正在检查生图历史', emptyMessage, { submitting: isSubmissionLoading })
        : '<div class="pfh-ledger-ai-image-empty-state"><span>' + escapeHtml(emptyMessage) + '</span>' + ledgerAiImageGenerateButtonHtml(record, tab, meta.status) + '</div>');
    const thumbnailHtml = entries.length
      ? entries.map((entry) => {
        const view = getEntryViewState(entry);
        const selected = view.key === selectedKey;
        const imageHtml = view.item
          ? '<img src="' + escapeHtml(view.item.url) + '" alt="' + escapeHtml(view.displayName) + '" loading="lazy" decoding="async">'
          : '<span class="pfh-ledger-ai-image-thumb-missing">无图</span>';
        const isDetail3 = tab === 'detail' && view.displayName === '详情图3';
        const auditClass = isDetail3 && /^(?:warning|error)$/.test(detail3Audit.status) ? ' is-audit-error' : (isDetail3 && detail3Audit.status === 'pass' ? ' is-audit-pass' : '');
        const auditLabel = isDetail3 && detail3Audit.status !== 'idle' ? '<em class="pfh-ledger-detail3-badge is-' + escapeHtml(detail3Audit.status) + '">' + escapeHtml(detail3Audit.status === 'pass' ? '核对通过' : (detail3Audit.status === 'loading' ? '识别中' : '有异常')) + '</em>' : '';
        const hideLabel = entry.isTask ? '隐藏此修改任务' : '从悬浮助手隐藏此图片';
        return '<div class="pfh-ledger-ai-image-thumb-row"><button type="button" class="pfh-ledger-ai-image-thumb' + (selected ? ' is-selected' : '') + (entry.isRetouched ? ' is-retouched' : '') + (entry.isTask ? ' is-retouch-task is-' + escapeHtml(view.task && view.task.status || 'running') : '') + auditClass + '" data-action="ledger-ai-image-select" data-kind="' + tab + '" data-entry-key="' + escapeHtml(view.key) + '" title="' + escapeHtml(view.title) + '">' +
          '<span class="pfh-ledger-ai-image-thumb-media">' + imageHtml + '</span><span class="pfh-ledger-ai-image-thumb-copy"><strong>' + escapeHtml(view.displayName) + '</strong><small>' + escapeHtml(view.variantLabel) + '</small>' + auditLabel + '</span></button><button type="button" class="pfh-ledger-ai-image-delete" data-action="ledger-ai-image-hide" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '" data-entry-key="' + escapeHtml(view.key) + '" title="' + escapeHtml(hideLabel) + '" aria-label="' + escapeHtml(hideLabel) + '">×</button></div>';
      }).join('')
      : (showPreparation
        ? (preparation.loading
          ? '<div class="pfh-ledger-ai-image-thumb-loading"><span class="pfh-ledger-ai-loading-spinner" aria-hidden="true"></span><small>正在读取生图资料</small></div>'
          : '<div class="pfh-ledger-ai-image-thumb-missing">暂无生图<br>请先补全右侧资料</div>')
        : emptyStateHtml);
    const previewImageHtml = selectedView && selectedView.item
      ? '<a class="pfh-ledger-ai-image-preview-link" href="' + escapeHtml(selectedView.item.url) + '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(selectedView.title + '（点击打开图片）') + '"><img src="' + escapeHtml(selectedView.item.url) + '" alt="' + escapeHtml(selectedView.displayName) + '" loading="eager" decoding="async"></a>'
      : '<div class="pfh-ledger-ai-image-preview-missing">' + (selectedView ? '原图地址已失效' : escapeHtml(emptyMessage)) + '</div>';
    const selectedIsDetail3 = Boolean(selectedView && tab === 'detail' && selectedView.displayName === '详情图3');
    const detail3AuditHtml = selectedIsDetail3 && detail3Audit.status !== 'idle'
      ? '<div class="pfh-ledger-detail3-audit is-' + escapeHtml(detail3Audit.status) + '"><strong>' + escapeHtml(detail3Audit.status === 'pass' ? '详情图3成分核对通过' : (detail3Audit.status === 'loading' ? '正在识别详情图3' : '详情图3需要检查')) + '</strong><p>' + escapeHtml(detail3Audit.summary || '') + '</p>' + (detail3Audit.retryable ? '<span>AI 服务暂时不可用，可点击“重新核对成分”重试。</span>' : '') + (detail3Audit.missing.length ? '<span>缺漏：' + escapeHtml(detail3Audit.missing.join('、')) + '</span>' : '') + (detail3Audit.extra.length ? '<span>多余/错误：' + escapeHtml(detail3Audit.extra.join('、')) + '</span>' : '') + (detail3Audit.duplicates.length ? '<span>重复：' + escapeHtml(detail3Audit.duplicates.join('、')) + '</span>' : '') + (detail3Audit.anomalies.length ? '<span>生图异常：' + escapeHtml(detail3Audit.anomalies.join('、')) + '</span>' : '') + '</div>'
      : '';
    const previewActionHtml = selectedView && selectedView.item
      ? '<div class="pfh-ledger-ai-image-preview-actions">' + (selectedIsDetail3 ? '<button type="button" data-action="ledger-detail3-audit" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '">重新核对成分</button>' : '') + '<button type="button" data-action="ledger-ai-image-download-item" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '" data-image-url="' + escapeHtml(selectedView.item.url) + '" data-image-name="' + escapeHtml(selectedView.displayName) + '"' + (state.ledgerAiImageDownloadKey ? ' disabled' : '') + '>下载</button><button type="button" data-action="ledger-ai-image-retouch" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '" data-image-url="' + escapeHtml(selectedView.item.url) + '"' + (selectedView.isGenerating ? ' disabled' : '') + '>' + (selectedView.isGenerating ? '生成中…' : (selectedView.activeTask ? '重新修改' : '修改图')) + '</button></div>'
      : '';
    const previewHtml = selectedView
      ? '<div class="pfh-ledger-ai-image-preview-stage">' + (lucianComparisonHtml(selectedEntry && selectedEntry.isRetouched && selectedView.item) || previewImageHtml) + '</div><div class="pfh-ledger-ai-image-preview-info"><div class="pfh-ledger-ai-image-preview-heading"><div><strong>' + escapeHtml(selectedView.displayName) + '</strong><em class="pfh-ledger-ai-image-variant">' + escapeHtml(selectedView.variantLabel) + '</em></div><small title="' + escapeHtml(selectedView.title) + '">' + escapeHtml(selectedView.sourceFilename || '保留原图文件名') + '</small></div>' + (selectedView.prompt ? '<p class="pfh-ledger-ai-image-prompt" title="' + escapeHtml(selectedView.prompt) + '">提示词：' + escapeHtml(selectedView.prompt) + '</p>' : '') + detail3AuditHtml + previewActionHtml + '</div>'
      : '<div class="pfh-ledger-ai-image-preview-empty">' + emptyStateHtml + '</div>';
    const downloadButtonHtml = (kind, count, label, downloadKey) => {
      const busy = state.ledgerAiImageDownloadKey === downloadKey;
      const disabled = !count || Boolean(state.ledgerAiImageDownloadKey);
      return '<button type="button" data-action="ledger-ai-image-download" data-kind="' + kind + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (disabled ? ' disabled' : '') + '>' + escapeHtml(busy ? '打包中…' : label) + '</button>';
    };
    const downloadProgress = isCurrentDownload && state.ledgerAiImageDownloadProgress
      ? state.ledgerAiImageDownloadProgress
      : '原图和修改图都会保存在今日工作台；本功能不会自动替换或保存 PLM 商品草稿。';
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-ledger-ai-image-layer';
      layer.setAttribute('data-action', 'ledger-ai-image-close');
      const full = panel.querySelector('.pfh-full');
      if (full) full.appendChild(layer);
      else panel.appendChild(layer);
    }
    layer.style.setProperty('z-index', '320', 'important');
    const hiddenKeys = getLedgerAiImageHiddenKeys(record, tab);
    const restoreHiddenHtml = hiddenKeys.size
      ? '<button type="button" class="pfh-ledger-ai-image-restore" data-action="ledger-ai-image-restore-hidden" data-kind="' + tab + '" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '">恢复隐藏 ' + hiddenKeys.size + ' 张</button>'
      : '';
    layer.innerHTML = '<section class="pfh-ledger-ai-image-dialog" role="dialog" aria-modal="true" aria-label="AI 生图" data-ledger-ai-image-dialog="1">' +
      '<header><div><h3>AI 生图 · ' + escapeHtml(record.sku) + '</h3><p class="pfh-ledger-ai-image-status is-' + escapeHtml(meta.status) + '">' + escapeHtml(meta.label) + (message ? ' · ' + escapeHtml(message) : '') + '</p></div><button type="button" class="pfh-ledger-ai-image-close" data-action="ledger-ai-image-close" aria-label="关闭">×</button></header>' +
      '<nav><button type="button" data-action="ledger-ai-image-tab" data-tab="main" class="' + (tab === 'main' ? 'is-active' : '') + '">主图 <em>' + getLedgerAiImageViewerTabCount(record, 'main') + '</em></button><button type="button" data-action="ledger-ai-image-tab" data-tab="detail" class="' + (tab === 'detail' ? 'is-active' : '') + '">详情图 <em>' + getLedgerAiImageViewerTabCount(record, 'detail') + '</em></button></nav>' +
      '<div class="pfh-ledger-ai-image-workspace"><aside class="pfh-ledger-ai-image-sidebar"><div class="pfh-ledger-ai-image-sidebar-head"><div><strong>图片列表</strong><span>' + entries.length + ' 张</span></div>' + restoreHiddenHtml + '</div><div class="pfh-ledger-ai-image-thumbs">' + thumbnailHtml + '</div></aside><main class="pfh-ledger-ai-image-preview">' + previewHtml + '</main></div>' +
      '<footer><span>' + escapeHtml(downloadProgress || '原图和修改图会保存在今日工作台记录中；关闭弹窗不会清除。') + '</span><div class="pfh-ledger-ai-image-download-actions">' + downloadButtonHtml('main', mainImages.length, '下载全部主图', mainDownloadKey) + downloadButtonHtml('detail', detailImages.length, '下载全部详情图', detailDownloadKey) + '<button type="button" data-action="ledger-ai-image-refresh" data-sku="' + escapeHtml(record.sku) + '" data-date="' + escapeHtml(record.date) + '"' + (state.ledgerAiImageDownloadKey ? ' disabled' : '') + '>刷新状态</button></div></footer>' +
      '</section>';
    bindLucianComparisons(layer);
  }

  function handleLedgerAiImageButton(sku, dateKey) {
    const record = findLedgerRecord(sku, dateKey);
    if (!record) return;
    const hasImages = getLedgerAiImageViewerEntries(record, 'main').length || getLedgerAiImageViewerEntries(record, 'detail').length;
    if (hasImages) {
      openLedgerAiImageViewer(record);
      return;
    }
    queryLedgerAiImageStatus(sku, dateKey, {
      openViewer: true,
      submit: false,
    });
  }

  async function handleLedgerAiImageGenerate(sku, dateKey, kind) {
    const record = findLedgerRecord(sku, dateKey);
    if (!record) return;
    const normalizedKind = kind === 'detail' ? 'detail' : 'main';
    const key = getLedgerAiImageRequestKey(sku);
    if (state.ledgerAiImageRequests[key]) {
      showToast('这个 SKU 的 AI 生图正在处理中，请等待结果');
      return;
    }
    const status = normalizeLedgerAiImageStatus(record.aiImageStatus, record.aiImageMessage);
    if (status === 'loading' || status === 'running') {
      showToast('这个 SKU 的 AI 生图正在处理中，请等待结果');
      return;
    }
    const preparing = updateLedgerAiImageRecord(sku, dateKey, {
      aiImageStatus: 'loading',
      aiImageMessage: '正在准备并提交 PLM AI 生图（' + (normalizedKind === 'detail' ? '详情图' : '主图') + '）；请勿重复点击…',
      aiImageCheckedAtMs: Date.now(),
    }, false) || record;
    refreshLedgerCard(preparing);
    if (isLedgerAiImageViewerFor(sku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
    showToast(sku + ' 已开始准备提交 AI 生图，请稍候；提交成功后会显示“生图中”');
    let preparation = null;
    try {
      const preparationKey = getLedgerAiPreparationKey(sku);
      preparation = state.ledgerAiImagePreparations[preparationKey] || null;
      if (preparation && !preparation.loading) preparation = collectLedgerAiImagePreparationForm(sku) || preparation;
      if (!preparation || preparation.loading) preparation = await loadLedgerAiImagePreparation(sku, false);
      const missing = getLedgerAiPreparationMissing(preparation);
      if (missing.length) {
        const blocked = updateLedgerAiImageRecord(sku, dateKey, {
          aiImageStatus: missing.includes('SKU 效果图')
            ? (missing.length > 1 ? 'needs-prerequisites' : 'needs-sku-image')
            : 'needs-copywriting',
          aiImageMessage: '生图前置校验未通过：' + missing.join('、'),
          aiImageCheckedAtMs: Date.now(),
        }, true) || record;
        openLedgerAiImageViewer(blocked);
        showToast('已拦截 AI 生图：请先补齐 ' + missing.join('、'));
        return;
      }
    } catch (error) {
      const message = formatErrorMessage(error) || '接口异常';
      const failed = updateLedgerAiImageRecord(sku, dateKey, {
        aiImageStatus: 'error',
        aiImageMessage: '生图资料检查失败：' + message,
        aiImageCheckedAtMs: Date.now(),
      }, true) || findLedgerRecord(sku, dateKey) || record;
      refreshLedgerCard(failed);
      openLedgerAiImageViewer(failed);
      showToast('无法确认生图资料，已停止提交：' + message);
      return;
    }
    queryLedgerAiImageStatus(sku, dateKey, {
      openViewer: false,
      reopenViewerOnUpdate: false,
      poll: false,
      submit: true,
      generationKind: normalizedKind,
      preparation,
    });
  }

  function getLedgerAiPreparationFieldsForApi(preparation) {
    const result = {};
    const keyMap = {
      new_product_usage: 'usage',
      new_product_selling_points: 'sellingPoints',
      new_product_efficacy: 'efficacy',
      new_product_advantages: 'advantages',
    };
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      const values = getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparation, rule));
      result[keyMap[rule.key]] = { cn: values.value_cn || '', en: values.value || '' };
    });
    result.ingredientSummary = { cn: preparation.ingredients.product_ingredients_summary_ch || '', en: preparation.ingredients.product_ingredients_summary_en || '' };
    result.ingredientEfficacy = { cn: preparation.ingredients.product_ingredients_efficacy_ch || '', en: preparation.ingredients.product_ingredients_efficacy_en || '' };
    return result;
  }

  function getLedgerAiPreparationPlmPatch(fields, language) {
    const source = fields || {};
    const lang = language === 'cn' ? 'cn' : 'en';
    const valueOf = (key) => String(source[key] && source[key][lang] || '').trim();
    return {
      directions: valueOf('usage'),
      sellingPoints: valueOf('sellingPoints'),
      efficacy: valueOf('efficacy'),
      advantages: valueOf('advantages'),
      ingredients: valueOf('ingredientSummary'),
    };
  }

  function mergeLedgerAiImagePreparationFields(preparation, fields) {
    const target = preparation || {};
    const source = fields || {};
    const keyMap = {
      new_product_usage: 'usage',
      new_product_selling_points: 'sellingPoints',
      new_product_efficacy: 'efficacy',
      new_product_advantages: 'advantages',
    };
    let filledCount = 0;
    LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.forEach((rule) => {
      const item = ensureLedgerAiPreparationCopyItem(target, rule);
      const values = source[keyMap[rule.key]] || {};
      const cn = String(values.cn || '').trim();
      const en = String(values.en || '').trim();
      if (!String(item.value_cn || '').trim() && cn) { item.value_cn = cn; filledCount += 1; }
      if (!String(item.value || '').trim() && en) { item.value = en; filledCount += 1; }
    });
    target.ingredients = target.ingredients && typeof target.ingredients === 'object' ? target.ingredients : {};
    const ingredientFields = [
      ['ingredientSummary', 'product_ingredients_summary_ch', 'product_ingredients_summary_en'],
      ['ingredientEfficacy', 'product_ingredients_efficacy_ch', 'product_ingredients_efficacy_en'],
    ];
    ingredientFields.forEach(([sourceKey, cnKey, enKey]) => {
      const values = source[sourceKey] || {};
      const cn = String(values.cn || '').trim();
      const en = String(values.en || '').trim();
      if (!String(target.ingredients[cnKey] || '').trim() && cn) { target.ingredients[cnKey] = cn; filledCount += 1; }
      if (!String(target.ingredients[enKey] || '').trim() && en) { target.ingredients[enKey] = en; filledCount += 1; }
    });
    target.plmMissing = calculateLedgerAiPreparationMissing(target);
    return filledCount;
  }

  function getLedgerAiImagePlmDraftAttribute(values, spec, languageId) {
    const candidates = Array.isArray(values) ? values : [];
    const language = Number(languageId) || 1;
    const ids = new Set((spec && spec.ids || []).map((value) => String(value)));
    const variables = new Set((spec && spec.variables || []).map((value) => String(value).toLowerCase()));
    const labels = spec && spec.label instanceof RegExp ? spec.label : null;
    return candidates.find((item) => {
      if (!item || Number(item.language_id) !== language) return false;
      const idMatch = ids.size && ids.has(String(item.attr_id));
      const variable = String(item.variable_name || '').trim().toLowerCase();
      const label = String(item.attr_name || '').trim();
      return idMatch || (variables.size && variables.has(variable)) || (labels && labels.test(label));
    }) || null;
  }

  function buildLedgerAiImageProductDraft(infoPayload, contentPayload, sku, preparation, productContext) {
    const info = getMagicUploadPayloadData(infoPayload);
    const values = flattenMagicUploadProductAttributes(contentPayload);
    if (!values.length) throw new Error('未读取到商品模板字段，无法保存生图资料');
    const normalizedSku = getLedgerSkuKey(sku);
    const context = productContext || {};
    const draft = {};
    [
      'procurement_price', 'invoice_item_name', 'invoice_category', 'product_procure_infos',
      'is_need_to_process_product_procure_infos', 'language_config', 'product_type',
      'same_style_code', 'style_code', 'is_AMZ', 'brand_id', 'category_id', 'product_group_id',
      'virtual_classification', 'financial_settlement_classification', 'jst_old_code',
      'basic_unit_id', 'purchase_unit_id', 'sale_unit_id', 'purchase_conversion', 'sale_conversion',
      'is_SRS', 'srs_code', 'data_source', 'srs_product_code', 'srs_store_information', 'srs_store_supplier',
    ].forEach((key) => {
      draft[key] = info[key] === undefined ? null : cloneMagicUploadDraftValue(info[key]);
    });
    if (draft.product_procure_infos === null) draft.product_procure_infos = [];
    if (draft.is_need_to_process_product_procure_infos === null) draft.is_need_to_process_product_procure_infos = true;
    draft.product_version_id = Number(info.product_version_id || context.productVersionId) || info.product_version_id || context.productVersionId;
    draft.product_id = Number(info.product_id || context.productId) || info.product_id || context.productId;
    draft.code = String(info.code || context.productCode || normalizedSku).trim().toUpperCase();
    draft.attr_values = values.map((item) => ({ attr_id: item.attr_id, language_id: item.language_id, value: cloneMagicUploadDraftValue(item.value) }));
    const preparationData = preparation || {};
    const copyFields = [
      ['usage', { ids: [370], variables: ['usage_method'], label: /使用方法|directions/i }],
      ['sellingPoints', { ids: [223], variables: ['product_selling_points'], label: /产品卖点|selling points/i }],
      ['efficacy', { ids: [368], variables: ['product_efficacy'], label: /产品功效|product efficacy/i }],
      ['advantages', { ids: [222], variables: ['product_advantages'], label: /产品优势|product advantages/i }],
      ['ingredientSummary', { ids: [395], variables: ['ingredients'], label: /^成分$|ingredients?/i }],
      ['ingredientEfficacy', { ids: [217], variables: ['ingredient_function'], label: /成分功能|component function/i }],
    ];
    const copyValues = {
      usage: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[0])),
      sellingPoints: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[1])),
      efficacy: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[2])),
      advantages: getLedgerAiImageCopywriteValues(findLedgerAiPreparationCopyItem(preparationData, LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS[3])),
      ingredientSummary: { value: preparationData.ingredients && preparationData.ingredients.product_ingredients_summary_en || '', value_cn: preparationData.ingredients && preparationData.ingredients.product_ingredients_summary_ch || '' },
      ingredientEfficacy: { value: preparationData.ingredients && preparationData.ingredients.product_ingredients_efficacy_en || '', value_cn: preparationData.ingredients && preparationData.ingredients.product_ingredients_efficacy_ch || '' },
    };
    copyFields.forEach(([key, spec]) => {
      const itemCn = getLedgerAiImagePlmDraftAttribute(values, spec, 1);
      const itemEn = getLedgerAiImagePlmDraftAttribute(values, spec, 2);
      if (!itemCn || !itemEn) throw new Error('商品模板缺少“' + (key === 'ingredientSummary' ? '成分' : (key === 'ingredientEfficacy' ? '成分功能' : key)) + '”中英文字段');
      const draftCn = draft.attr_values.find((item) => String(item.attr_id) === String(itemCn.attr_id) && Number(item.language_id) === 1);
      const draftEn = draft.attr_values.find((item) => String(item.attr_id) === String(itemEn.attr_id) && Number(item.language_id) === 2);
      if (!draftCn || !draftEn) throw new Error('商品模板字段“' + key + '”无法转换为保存格式');
      draftCn.value = String(copyValues[key].value_cn || '').trim();
      draftEn.value = String(copyValues[key].value || '').trim();
    });
    return draft;
  }

  async function saveLedgerAiImagePreparationDirect(sku, preparation) {
    const normalizedSku = getLedgerSkuKey(sku);
    if (!normalizedSku) throw new Error('缺少 SKU，无法保存生图资料');
    const listPayload = await fetchPlmJson('/api/Product/GetProductList?page=1&pageSize=20&codes=' + encodeURIComponent(normalizedSku));
    const list = getApiProductListItems(listPayload);
    const product = list.find((item) => String(item && (item.product_code || item.productCode || item.code || '')).trim().toUpperCase() === normalizedSku) || list[0];
    if (!product) throw new Error('产品列表未找到 SKU：' + normalizedSku);
    const productId = product.product_id || product.id;
    const productVersionId = product.product_version_id || product.product_main_id;
    if (!productId || !productVersionId) throw new Error('目标 SKU 缺少商品版本信息：' + normalizedSku);
    const infoPayload = await fetchPlmJson('/api/Product/GetDetailInfoByEdit?product_id=' + encodeURIComponent(productId) + '&product_version_id=' + encodeURIComponent(productVersionId));
    const info = getMagicUploadPayloadData(infoPayload);
    const categoryId = info.category_id || product.category_id;
    if (!categoryId) throw new Error('目标 SKU 缺少商品类目，无法保存生图资料');
    const contentPayload = await fetchPlmJson('/api/Product/GetDetailContent?is_edit=true&product_id=' + encodeURIComponent(productId) + '&category_id=' + encodeURIComponent(categoryId) + '&product_version_id=' + encodeURIComponent(productVersionId));
    const draft = buildLedgerAiImageProductDraft(infoPayload, contentPayload, normalizedSku, preparation, {
      productId: String(productId),
      productVersionId: String(productVersionId),
      productCode: String(product.product_code || product.code || normalizedSku),
    });
    return fetchPlmApiJson('/api/Product/SaveProductDraftByEdit', draft);
  }

  function collectLedgerAiImagePreparationForm(sku) {
    const normalizedSku = getLedgerSkuKey(sku);
    const current = state.ledgerAiImagePreparations[getLedgerAiPreparationKey(normalizedSku)];
    if (!current) return null;
    const preparation = {
      ...current,
      copywrite: Array.isArray(current.copywrite) ? current.copywrite.map((item) => ({ ...(item || {}) })) : [],
      ingredients: { ...(current.ingredients || {}) },
    };
    const layer = ensurePanel().querySelector('.pfh-ledger-ai-image-layer');
    if (layer) {
      layer.querySelectorAll('.pfh-ledger-ai-prep-input').forEach((input) => {
        const kind = input.getAttribute('data-prep-kind');
        const key = input.getAttribute('data-prep-key') || '';
        const value = String(input.value || '').trim();
        if (kind === 'copy') {
          const rule = LEDGER_AI_IMAGE_REQUIRED_COPYWRITE_FIELDS.find((item) => item.key === key);
          if (!rule) return;
          const item = ensureLedgerAiPreparationCopyItem(preparation, rule);
          if (input.getAttribute('data-prep-lang') === 'cn') item.value_cn = value;
          else item.value = value;
        } else if (kind === 'ingredient' && key) {
          preparation.ingredients[key] = value;
        }
      });
    }
    preparation.plmMissing = calculateLedgerAiPreparationMissing(preparation);
    preparation.localDirty = true;
    state.ledgerAiImagePreparations[getLedgerAiPreparationKey(normalizedSku)] = preparation;
    return preparation;
  }

  function updateLedgerAiImagePreparationInlineState(sku) {
    const preparation = collectLedgerAiImagePreparationForm(sku);
    if (!preparation) return;
    const layer = ensurePanel().querySelector('.pfh-ledger-ai-image-layer');
    if (!layer) return;
    const missing = getLedgerAiPreparationMissing(preparation);
    layer.querySelectorAll('.pfh-ledger-ai-prep-input').forEach((input) => {
      const value = String(input.value || '').trim();
      input.classList.toggle('is-missing', !isValidLedgerAiImageText(value));
    });
    const badge = layer.querySelector('.pfh-ledger-ai-prep-head span');
    if (badge) {
      badge.textContent = missing.length ? 'PLM 还缺 ' + missing.length + ' 项' : 'PLM 资料已完整';
      badge.classList.toggle('is-missing', Boolean(missing.length));
      badge.classList.toggle('is-ready', !missing.length);
    }
    const submit = layer.querySelector('.pfh-ledger-ai-prep-submit');
    if (submit) submit.disabled = Boolean(missing.length);
    const notice = layer.querySelector('.pfh-ledger-ai-prep-missing');
    if (notice) notice.textContent = missing.length
      ? '当前缺少：' + missing.join('、') + '。保存后会由 PLM API 回读确认；没有 SKU 效果图时不能开始 AI 生图。'
      : 'PLM 资料已完整；提交前还会再次检查文案和 SKU 效果图。';
  }

  async function saveLedgerAiImagePreparationDraft(sku) {
    const normalizedSku = getLedgerSkuKey(sku);
    const key = getLedgerAiPreparationKey(normalizedSku);
    if (state.ledgerAiImageSaveRequests[key]) return state.ledgerAiImageSaveRequests[key];
    const preparation = collectLedgerAiImagePreparationForm(normalizedSku);
    if (!preparation) return null;
    preparation.saving = true;
    renderLedgerAiImageViewer(ensurePanel());
    const request = (async () => {
      await saveLedgerAiImagePreparationDirect(normalizedSku, preparation);
      showToast('生图资料已保存到 PLM 草稿，正在回读校验…');
      await wait(350);
      const verified = await loadLedgerAiImagePreparation(normalizedSku, true);
      renderLedgerAiImageViewer(ensurePanel());
      const missing = getLedgerAiPreparationMissing(verified);
      showToast(missing.length ? '已保存，但当前仍缺：' + missing.join('、') : 'PLM 草稿已保存，文案和 SKU 效果图均已通过校验');
      return verified;
    })();
    state.ledgerAiImageSaveRequests[key] = request;
    try { return await request; }
    catch (error) { showToast('保存生图资料失败：' + (formatErrorMessage(error) || '接口异常')); return null; }
    finally {
      if (state.ledgerAiImageSaveRequests[key] === request) delete state.ledgerAiImageSaveRequests[key];
      const current = state.ledgerAiImagePreparations[key];
      if (current) current.saving = false;
      renderLedgerAiImageViewer(ensurePanel());
    }
  }

  async function applyLedgerAiPreparationToPlmDraft(sku, fields) {
    const normalizedSku = getLedgerSkuKey(sku);
    const preparation = await loadLedgerAiImagePreparation(normalizedSku, true);
    const filledCount = mergeLedgerAiImagePreparationFields(preparation, fields);
    await saveLedgerAiImagePreparationDirect(normalizedSku, preparation);
    return filledCount;
  }

  async function refreshLedgerAiImagePreparation(sku) {
    const key = getLedgerAiPreparationKey(sku);
    const existing = state.ledgerAiImagePreparations[key];
    state.ledgerAiImagePreparations[key] = { ...(existing || {}), sku: getLedgerSkuKey(sku), copywrite: existing && existing.copywrite || [], ingredients: existing && existing.ingredients || {}, skuImage: existing && existing.skuImage || { status: 'unknown' }, loading: true, loadingStage: '正在重新读取生图资料', loadingDetail: '正在重新检查产品文案、成分和 SKU 效果图…' };
    renderLedgerAiImageViewer(ensurePanel());
    await loadLedgerAiImagePreparation(sku, true);
    renderLedgerAiImageViewer(ensurePanel());
  }

  async function autofillLedgerAiImagePreparation(sku) {
    const key = getLedgerAiPreparationKey(sku);
    if (state.ledgerAiImageAutofillRequests[key]) return state.ledgerAiImageAutofillRequests[key];
    const request = (async () => {
      const preparation = await loadLedgerAiImagePreparation(sku, true);
      const data = normalizeData(loadData(sku) || { sku });
      const response = await cloudRequest('/ai-image/copywriting-complete', {
        method: 'POST',
        timeoutMs: 90000,
        body: { sku, name: data.name || '', fields: getLedgerAiPreparationFieldsForApi(preparation) },
      });
      if (!response || !response.ok) throw new Error(response && response.error || 'AI 未返回可用文案');
      const filledCount = await applyLedgerAiPreparationToPlmDraft(sku, response.fields || {});
      showToast('PLM 草稿保存成功，正在通过后台服务回读校验…');
      await wait(500);
      const verified = await loadLedgerAiImagePreparation(sku, true);
      renderLedgerAiImageViewer(ensurePanel());
      const missing = getLedgerAiPreparationMissing(verified);
      showToast(missing.length
        ? '草稿已保存，但 PLM 后台回读仍缺 ' + missing.length + ' 项：' + missing.join('、')
        : '已补齐 ' + filledCount + ' 个字段、保存 PLM 草稿并通过后台完整性校验');
      return verified;
    })();
    state.ledgerAiImageAutofillRequests[key] = request;
    renderLedgerAiImageViewer(ensurePanel());
    try { return await request; }
    catch (error) { showToast('AI 补齐或保存草稿失败：' + (formatErrorMessage(error) || '接口异常')); return null; }
    finally {
      if (state.ledgerAiImageAutofillRequests[key] === request) delete state.ledgerAiImageAutofillRequests[key];
      renderLedgerAiImageViewer(ensurePanel());
    }
  }

  async function queryLedgerAiImageStatus(sku, dateKey, options) {
    const normalizedSku = String(sku || '').trim();
    const key = getLedgerAiImageRequestKey(normalizedSku);
    if (!normalizedSku) return null;
    const opts = options || {};
    const existingRequest = state.ledgerAiImageRequests[key];
    if (existingRequest) {
      const current = findLedgerRecord(normalizedSku, dateKey);
      if (opts.openViewer && current) openLedgerAiImageViewer(current);
      else if (current && isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
      return existingRequest;
    }
    const current = findLedgerRecord(normalizedSku, dateKey);
    if (!current) return null;
    const shouldSubmit = Boolean(opts.submit);
    const allowPolling = opts.poll !== false;
    if (shouldSubmit && !allowPolling) clearLedgerAiImagePoll(normalizedSku);
    let taskExists = null;
    let loadingRecord = current;
    if (normalizeLedgerAiImageStatus(current.aiImageStatus) !== 'loading') {
      loadingRecord = updateLedgerAiImageRecord(normalizedSku, dateKey, {
        aiImageStatus: 'loading',
        aiImageMessage: shouldSubmit
          ? '正在提交 PLM AI 生图（' + (opts.generationKind === 'detail' ? '详情图' : '主图') + '入口）；不会自动查询结果…'
          : '正在检查这个 SKU 是否已有生图历史；不会提交生成请求…',
      }, false) || current;
      refreshLedgerCard(loadingRecord);
    }
    if (opts.openViewer) openLedgerAiImageViewer(loadingRecord);
    else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
    const request = (async () => {
      try {
        if (!shouldSubmit) {
          taskExists = await getLedgerAiImageTaskExists(normalizedSku);
          if (taskExists !== true) {
            if (taskExists === null) {
              const failed = updateLedgerAiImageRecord(normalizedSku, dateKey, {
                aiImageStatus: 'error',
                aiImageMessage: '无法确认是否存在生图历史；已停止查询，不会提交生成',
                aiImageCheckedAtMs: Date.now(),
              }, true) || loadingRecord;
              refreshLedgerCard(failed);
              if (opts.openViewer) openLedgerAiImageViewer(failed);
              else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
              showToast(normalizedSku + ' 生图历史查询失败，未提交任何生图请求');
              return failed;
            }
            const preparation = await loadLedgerAiImagePreparation(normalizedSku, true);
            const missing = getLedgerAiPreparationMissing(preparation);
            const status = missing.includes('SKU 效果图')
              ? (missing.length > 1 ? 'needs-prerequisites' : 'needs-sku-image')
              : (missing.length ? 'needs-copywriting' : 'empty');
            const ready = updateLedgerAiImageRecord(normalizedSku, dateKey, {
              aiImageStatus: status,
              aiImageMessage: missing.length ? '没有生图历史；请先补齐：' + missing.join('、') : '没有生图历史；资料已完整，可手动提交 AI 生图',
              aiImageJobId: '',
              aiImageCheckedAtMs: Date.now(),
            }, true) || loadingRecord;
            refreshLedgerCard(ready);
            if (opts.openViewer) openLedgerAiImageViewer(ready);
            else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
            return ready;
          }
        }
        const requestBody = shouldSubmit
          ? await prepareLedgerAiImageGenerationPayload(normalizedSku, opts.preparation)
          : { code: normalizedSku };
        if (shouldSubmit) {
          const preparing = findLedgerRecord(normalizedSku, dateKey) || loadingRecord;
          const preparingUpdated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
            aiImageStatus: 'loading',
            aiImageMessage: '生图资料已准备，正在提交 PLM AI 生图（' + (opts.generationKind === 'detail' ? '详情图' : '主图') + '入口）；不会自动查询结果…',
          }, true) || preparing;
          refreshLedgerCard(preparingUpdated);
          if (opts.openViewer) openLedgerAiImageViewer(preparingUpdated);
          else if (isLedgerAiImageViewerFor(normalizedSku, dateKey)) renderLedgerAiImageViewer(ensurePanel());
        }
        const payload = await fetchPlmApiJson(LEDGER_AI_IMAGE_RESULT_ENDPOINT, requestBody);
        const result = parseLedgerAiImageResult(payload);
        const latest = findLedgerRecord(normalizedSku, dateKey) || loadingRecord;
        const changed = !ledgerAiImageResultMatches(latest, result);
        const patch = {
          aiImageStatus: result.status,
          aiImageMessage: result.message,
          aiImageJobId: result.jobId,
          aiMainImages: result.mainImages,
          aiDetailImages: result.detailImages,
          artworkState: result.status === 'success' ? 'done' : (result.status === 'running' ? 'doing' : latest.artworkState),
        };
        if (changed) patch.aiImageCheckedAtMs = Date.now();
        const updated = changed ? (updateLedgerAiImageRecord(normalizedSku, dateKey, patch, true) || latest) : latest;
        if (changed) refreshLedgerCard(updated);
        if (result.status === 'running' && allowPolling) scheduleLedgerAiImagePoll(normalizedSku, dateKey);
        else clearLedgerAiImagePoll(normalizedSku);
        const viewerMatches = isLedgerAiImageViewerFor(normalizedSku, dateKey);
        if (opts.openViewer || (opts.reopenViewerOnUpdate !== false && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku))) {
          openLedgerAiImageViewer(updated);
        } else if (viewerMatches) {
          renderLedgerAiImageViewer(ensurePanel());
        }
        if (!shouldSubmit && result.status === 'success' && getLedgerDetail3Image(updated)) auditLedgerDetail3(normalizedSku, dateKey, false);
        if (result.status === 'empty' && opts.openViewer) showToast(normalizedSku + ' 暂无可查看的 AI 生图');
        if (shouldSubmit) showToast(normalizedSku + ' AI 生图已提交，后台生成中；本次不会自动轮询。');
        return updated;
      } catch (error) {
        const latest = findLedgerRecord(normalizedSku, dateKey) || loadingRecord;
        const message = formatErrorMessage(error);
        const queryCopywritingFailure = !shouldSubmit && isLedgerAiImageCopywritingError(message);
        const preflight = error && error.ledgerAiImagePreflight;
        const preflightStatus = preflight
          ? (preflight.missingCopywriting && preflight.skuImageStatus !== 'available'
            ? 'needs-prerequisites'
            : (preflight.skuImageStatus !== 'available' ? 'needs-sku-image' : 'needs-copywriting'))
          : '';
        const status = preflightStatus || (queryCopywritingFailure
          ? (taskExists === true ? 'task-error' : (taskExists === false ? 'empty' : 'error'))
          : normalizeLedgerAiImageStatus('error', message));
        let statusMessage = message || (shouldSubmit ? 'AI 生图提交失败' : 'AI 生图状态查询失败');
        if (status === 'needs-prerequisites') {
          statusMessage = '生图前置校验未通过：请先补齐产品文案和 SKU 效果图，再开始生成';
        } else if (status === 'needs-sku-image') {
          statusMessage = '生图前置校验未通过：请先上传 SKU 效果图，再开始生成';
        } else if (status === 'needs-copywriting') {
          statusMessage = '生图前置校验未通过：请先补齐有效产品文案，再开始生成';
        } else if (status === 'task-error') {
          statusMessage = 'PLM 有生图任务记录，但查询不到图片结果，请刷新或联系管理员清理任务';
        } else if (status === 'empty' && queryCopywritingFailure) {
          statusMessage = '当前未发现 PLM AI 生图结果，请在弹窗中手动选择主图或详情图生成';
        }
        const updated = updateLedgerAiImageRecord(normalizedSku, dateKey, {
          aiImageStatus: status,
          aiImageMessage: statusMessage,
          aiImageJobId: '',
          aiImageCheckedAtMs: Date.now(),
        }, true) || latest;
        clearLedgerAiImagePoll(normalizedSku);
        refreshLedgerCard(updated);
        const viewerMatches = isLedgerAiImageViewerFor(normalizedSku, dateKey);
        if (opts.openViewer || (opts.reopenViewerOnUpdate !== false && state.ledgerAiImageViewer && getLedgerSkuKey(state.ledgerAiImageViewer.sku) === getLedgerSkuKey(normalizedSku))) openLedgerAiImageViewer(updated);
        else if (viewerMatches) renderLedgerAiImageViewer(ensurePanel());
        if (status === 'needs-prerequisites') {
          showToast(normalizedSku + ' 缺少产品文案或 SKU 效果图，已拦截生图请求');
        } else if (status === 'needs-sku-image') {
          showToast(normalizedSku + ' 缺少 SKU 效果图，已拦截生图请求');
        } else if (status === 'needs-copywriting') {
          showToast(normalizedSku + ' 缺少产品文案，暂时无法开始 AI 生图');
        } else if (status === 'task-error') {
          showToast(normalizedSku + ' 有生图任务记录，但查询不到结果，请联系管理员清理任务');
        } else if (status === 'empty' && queryCopywritingFailure) {
          showToast(normalizedSku + ' 当前未生成 AI 生图，请在弹窗内手动选择主图或详情图生成');
        } else {
          showToast((shouldSubmit ? '提交 ' : '查询 ') + normalizedSku + ' AI 生图失败：' + (message || '网络请求失败'));
        }
        return updated;
      }
    })();
    state.ledgerAiImageRequests[key] = request;
    try {
      return await request;
    } finally {
      if (state.ledgerAiImageRequests[key] === request) delete state.ledgerAiImageRequests[key];
    }
  }

  function cycleLedgerArtworkState(sku, dateKey) {
    syncDailyLedgerBeforeMutation();
    const key = normalizeLedgerDate(dateKey) || getTodayKey();
    const existing = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const current = normalizeLedgerArtworkState(existing && existing.artworkState);
    const next = current === 'pending' ? 'doing' : (current === 'doing' ? 'done' : 'pending');
    const label = next === 'doing' ? '生图中' : (next === 'done' ? '完成生图' : '待生图');
    const updated = updateDailyLedgerForSku(sku, { artworkState: next, note: label, skipStorageSync: true }, key);
    refreshLedgerCard(updated);
  }

  function openLedgerReference(sku, dateKey) {
    const key = normalizeLedgerDate(dateKey) || normalizeLedgerDate(state.ledgerDate) || getTodayKey();
    const record = (state.ledgerRecords || []).find((item) => item.date === key && item.sku === sku);
    const url = record && record.referenceUrl;
    if (!url) {
      showToast('这个编码没有参考链接');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function openReverseImageSearch(engine, imageUrl) {
    const source = String(imageUrl || '').trim();
    let parsed;
    try { parsed = new URL(source, window.location.origin); } catch (_) { parsed = null; }
    if (!parsed || !/^https?:$/.test(parsed.protocol)) {
      showToast('当前图片没有可公开搜索的地址');
      return;
    }
    const normalized = parsed.href;
    if (engine === 'google') {
      window.open('https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(normalized), '_blank', 'noopener,noreferrer');
      return;
    }
    if (engine === 'yandex') {
      window.open('https://yandex.com/images/search?rpt=imageview&url=' + encodeURIComponent(normalized), '_blank', 'noopener,noreferrer');
      return;
    }
    copyText(normalized);
    window.open('https://s.1688.com/youyuan/index.htm?tab=imageSearch', '_blank', 'noopener,noreferrer');
    showToast('图片地址已复制；1688 打开后点相机并粘贴/上传当前图');
  }

  function captureLedgerReturnScroll(originCard) {
    const panel = document.getElementById(PANEL_ID);
    const detailScroll = panel && panel.querySelector('.pfh-detail-scroll');
    const ledgerList = panel && panel.querySelector('.pfh-ledger-list');
    const card = originCard && originCard.classList && originCard.classList.contains('pfh-ledger-item') ? originCard : null;
    const detailRect = detailScroll && detailScroll.getBoundingClientRect();
    const cardRect = card && card.getBoundingClientRect();
    return {
      detailTop: detailScroll ? detailScroll.scrollTop : 0,
      detailLeft: detailScroll ? detailScroll.scrollLeft : 0,
      listTop: ledgerList ? ledgerList.scrollTop : 0,
      listLeft: ledgerList ? ledgerList.scrollLeft : 0,
      sku: card && card.getAttribute('data-ledger-sku') || '',
      date: card && card.getAttribute('data-ledger-date') || '',
      cardOffset: detailRect && cardRect ? cardRect.top - detailRect.top : null,
    };
  }

  function restoreLedgerReturnScroll(snapshot) {
    if (!snapshot) return;
    window.requestAnimationFrame(() => {
      const panel = document.getElementById(PANEL_ID);
      const detailScroll = panel && panel.querySelector('.pfh-detail-scroll');
      const ledgerList = panel && panel.querySelector('.pfh-ledger-list');
      if (detailScroll) {
        detailScroll.scrollTop = Number(snapshot.detailTop) || 0;
        detailScroll.scrollLeft = Number(snapshot.detailLeft) || 0;
      }
      if (ledgerList) {
        ledgerList.scrollTop = Number(snapshot.listTop) || 0;
        ledgerList.scrollLeft = Number(snapshot.listLeft) || 0;
      }
      window.requestAnimationFrame(() => {
        if (!detailScroll || !Number.isFinite(snapshot.cardOffset) || !snapshot.sku) return;
        const card = Array.from(panel.querySelectorAll('.pfh-ledger-item')).find((item) =>
          item.getAttribute('data-ledger-sku') === snapshot.sku && (!snapshot.date || item.getAttribute('data-ledger-date') === snapshot.date)
        );
        if (!card) return;
        const delta = card.getBoundingClientRect().top - detailScroll.getBoundingClientRect().top - snapshot.cardOffset;
        if (Math.abs(delta) > 1) detailScroll.scrollTop += delta;
      });
    });
  }

  function openLedgerSku(sku, originCard) {
    if (!sku) return;
    const data = normalizeData(loadData(sku) || { sku });
    state.detailReturnScroll = state.view === 'ledger' ? captureLedgerReturnScroll(originCard) : null;
    state.selectedSku = sku;
    state.data = data;
    state.detailReturnView = state.view || 'ledger';
    state.view = 'detail';
    state.copywritingMode = false;
    expandPanel();
    renderShell();
    window.setTimeout(() => refreshMaterialFromApiWithoutDrawer(sku, data).catch((error) => {
      addLog('warn', '今日工作台后台刷新物料失败', sku + ' | ' + formatErrorMessage(error));
    }), 0);
  }

  function getLedgerStatusClass(status) {
    if (status === '已完成') return 'done';
    if (status === '异常') return 'error';
    if (status === '作废') return 'void';
    if (status === '已定稿') return 'final';
    if (status === '制作中') return 'doing';
    if (status === '跳过') return 'skip';
    return 'draft';
  }

  function buildCachePayload(options) {
    const opts = options || {};
    const items = {};
    state.index.forEach((item) => {
      const data = loadData(item.sku);
      if (data) items[item.sku] = data;
    });
    return {
      plugin: L.title,
      version: SCRIPT_VERSION,
      exportedAt: new Date().toLocaleString(),
      backupOwnerName: getCloudBackupOwnerName(),
      includesImageLinks: true,
      index: state.index,
      items,
      uploadRecords: {
        queue: sanitizeUploadRecords(loadUploadQueue()),
        history: sanitizeUploadRecords(loadUploadHistory()),
      },
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(undefined, { includeLocalImages: Boolean(opts.includeLocalTranslateImages) }),
      dailyLedger: sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger()),
      dailyLedgerTrash: sanitizeLedgerTrashRecords(state.ledgerTrashRecords || loadDailyLedgerTrash()),
      insights: state.insights || emptyInsights(),
    };
  }

  function buildCompactCopywritingBackup(record) {
    const source = normalizeCopywritingRecord(record);
    if (!source) return null;
    return {
      ...source,
      fullText: String(source.fullText || '').slice(0, 12000),
      sections: (source.sections || []).slice(0, 40).map((section) => ({
        ...section,
        text: String(section.text || '').slice(0, 2200),
      })),
      previousSections: [],
      changedSectionKeys: [],
      removedSections: [],
    };
  }

  function buildCompactCachePayload(fullPayload) {
    const source = fullPayload || buildCachePayload();
    const compactIndex = Array.isArray(source.index) ? source.index.slice(0, 2000) : [];
    const indexedSkus = new Set(compactIndex.map((item) => String(item && (item.sku || item.code) || item || '').trim()).filter(Boolean));
    const items = {};
    let itemCount = 0;
    Object.keys(source.items || {}).forEach((sku) => {
      if (indexedSkus.size && !indexedSkus.has(String(sku))) return;
      if (itemCount >= 2000) return;
      const item = source.items[sku];
      if (!item || typeof item !== 'object') return;
      const compact = { ...item };
      if (compact.copywriting) compact.copywriting = buildCompactCopywritingBackup(compact.copywriting);
      if (Array.isArray(compact.ingredientItems)) compact.ingredientItems = compact.ingredientItems.slice(0, 40);
      delete compact.lastMissingDiagnostic;
      delete compact.recentFieldChanges;
      items[sku] = compact;
      itemCount += 1;
    });
    const uploadRecords = source.uploadRecords || {};
    const compactUploadRecords = {
      queue: sanitizeUploadRecords(uploadRecords.queue).slice(0, 120),
      history: sanitizeUploadRecords(uploadRecords.history).slice(0, 120),
    };
    const insights = sanitizeInsights(source.insights || emptyInsights());
    insights.priceHistory = insights.priceHistory.slice(0, 400);
    insights.dataIssues = insights.dataIssues.slice(0, 400);
    return {
      plugin: source.plugin || L.title,
      version: source.version || SCRIPT_VERSION,
      exportedAt: source.exportedAt || new Date().toLocaleString(),
      backupOwnerName: source.backupOwnerName || '',
      backupMode: 'compact-v1',
      includesImageLinks: true,
      index: compactIndex,
      items,
      uploadRecords: compactUploadRecords,
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(source.productDevelopmentTranslateWorkspaces),
      dailyLedger: sanitizeLedgerRecords(source.dailyLedger).slice(0, 600),
      dailyLedgerTrash: sanitizeLedgerTrashRecords(source.dailyLedgerTrash).slice(0, 600),
      insights,
    };
  }

  function compactBackupText(value, limit) {
    const maxLength = Number(limit) > 0 ? Number(limit) : 240;
    return String(value === undefined || value === null ? '' : value).slice(0, maxLength);
  }

  function buildCompactBackupIndex(index) {
    return (Array.isArray(index) ? index : []).slice(0, 2000).map((item) => {
      const source = item && typeof item === 'object' ? item : { sku: item };
      return {
        sku: compactBackupText(source.sku || source.code, 80),
        brand: compactBackupText(source.brand, 120),
        name: compactBackupText(source.name || source.productName, 220),
        packageCode: compactBackupText(source.packageCode, 120),
        printCode: compactBackupText(source.printCode, 180),
        designAssignedAt: compactBackupText(source.designAssignedAt, 80),
        acquiredAt: compactBackupText(source.acquiredAt, 80),
        acquiredAtMs: Number(source.acquiredAtMs || 0) || 0,
        skuListSource: compactBackupText(source.skuListSource, 40),
        pinned: Boolean(source.pinned),
        pinOrder: Number(source.pinOrder || 0) || 0,
        updatedAt: compactBackupText(source.updatedAt, 80),
        updatedAtMs: Number(source.updatedAtMs || 0) || 0,
      };
    }).filter((item) => item.sku);
  }

  function buildMinimalCopywritingBackup(record) {
    const source = normalizeCopywritingRecord(record);
    if (!source) return null;
    return {
      fileName: compactBackupText(source.fileName, 180),
      parserVersion: compactBackupText(source.parserVersion, 30),
      fileTimestamp: compactBackupText(source.fileTimestamp, 24),
      fileHash: compactBackupText(source.fileHash, 80),
      fetchedAt: compactBackupText(source.fetchedAt, 60),
      lastCheckedAtMs: Number(source.lastCheckedAtMs || 0) || 0,
      fullText: compactBackupText(source.fullText, 2400),
      sections: (source.sections || []).slice(0, 8).map((section) => ({
        key: compactBackupText(section.key, 60),
        label: compactBackupText(section.label, 100),
        text: compactBackupText(section.text, 450),
      })).filter((section) => section.key && section.text),
      ingredientEnglish: compactBackupText(source.ingredientEnglish, 1600),
      ingredientChinese: compactBackupText(source.ingredientChinese, 1600),
      cleanedIngredientEnglish: compactBackupText(source.cleanedIngredientEnglish, 1600),
      cleanedIngredientChinese: compactBackupText(source.cleanedIngredientChinese, 1600),
      ingredientSplit: Boolean(source.ingredientSplit),
      missingSections: (source.missingSections || []).slice(0, 12).map((item) => compactBackupText(item, 80)).filter(Boolean),
      updatePending: Boolean(source.updatePending),
      changedSectionKeys: (source.changedSectionKeys || []).slice(0, 12).map((item) => compactBackupText(item, 60)).filter(Boolean),
      removedSections: (source.removedSections || []).slice(0, 12).map((item) => compactBackupText(item, 80)).filter(Boolean),
      previousSections: [],
      copiedSectionKeys: (source.copiedSectionKeys || []).slice(0, 20).map((item) => compactBackupText(item, 60)).filter(Boolean),
      copiedFullText: Boolean(source.copiedFullText),
    };
  }

  function buildMinimalInfringementHistoryBackup(history) {
    return normalizeInfringementHistory(history).slice(-8).map((entry) => ({
      id: compactBackupText(entry.id, 80),
      updatedAt: compactBackupText(entry.updatedAt, 80),
      updatedAtMs: Number(entry.updatedAtMs || 0) || 0,
      source: compactBackupText(entry.source, 80),
      imageUrls: entry.imageUrls.slice(0, 8).map((url) => compactBackupText(url, 600)).filter(Boolean),
      copywriting: compactBackupText(entry.copywriting, 2400),
    })).filter((entry) => entry.imageUrls.length || entry.copywriting);
  }

  function buildMinimalDataUpdateLogBackup(log) {
    return normalizeDataUpdateLog(log).slice(-20).map((entry) => ({
      id: compactBackupText(entry.id, 80),
      changedAt: compactBackupText(entry.changedAt, 80),
      changedAtMs: Number(entry.changedAtMs || 0) || 0,
      source: compactBackupText(entry.source, 80),
      changes: entry.changes.slice(0, 12).map((change) => ({
        key: compactBackupText(change.key, 80),
        label: compactBackupText(change.label, 100),
        before: compactBackupText(change.before, 700),
        after: compactBackupText(change.after, 700),
      })).filter((change) => change.key),
    })).filter((entry) => entry.changes.length);
  }

  const MINIMAL_BACKUP_ITEM_FIELDS = [
    'accessories', 'specificationText',
    'sku', 'brand', 'name', 'englishName', 'manualCategory', 'plmCategory', 'category', 'productType', 'aiCategory', 'aiProductType',
    'developerText', 'developerName', 'projectStatus', 'projectId', 'projectRowId', 'projectVersionId', 'apiMaterialSource',
    'designType', 'artPriority', 'designAssignedAt', 'developmentAssignedAt', 'acquiredAt', 'acquiredAtMs', 'skuListSource', 'referenceUrl',
    'infringementImageUrls', 'infringementImageSource', 'infringementCopywriting', 'infringementUpdatedAt', 'infringementUpdatedAtMs',
    'packageSizeText', 'packageSizeLabel', 'packageCode', 'packageNums', 'manualFieldOverrides',
    'printSizeText', 'printSizeLabel', 'printCode',
    'tubeSegmentText', 'tubeTailSealLengthValue', 'tailSealLengthValue', 'tubeDiameter', 'tubeBody', 'tubeSpecKey', 'isTubePrintMaterial',
    'productNums', 'plmProductNums', 'bottleNums', 'singleBottle', 'hasInnerCard', 'productSizeSource', 'omitEstimatedProductSize',
    'netContent', 'grossWeight', 'purchasePrice', 'packageSource', 'materialDimensionUnitIssues',
    'plmIngredientText', 'plmIngredientEnglishText', 'plmIngredientParserVersion', 'plmIngredientCheckedAt',
    'ingredientEnglish', 'ingredientChinese', 'copywritingIngredientEnglish', 'copywritingIngredientChinese', 'copywritingIngredientSplit',
    'ingredientWordFileName', 'ingredientWordHash', 'ingredientWordUpdatedAt',
    'ingredientPdfFileName', 'ingredientPdfHash', 'ingredientPdfModel', 'ingredientPdfUpdatedAt', 'ingredientNormalizerVersion', 'ingredientSource',
    'seenProject', 'seenMaterial', 'seenProduct', 'seenDesign', 'isToy', 'seriesExcluded', 'updatedAt', 'updatedAtMs',
  ];

  function buildMinimalCacheItem(item, sku) {
    const source = item && typeof item === 'object' ? item : {};
    const compact = {};
    MINIMAL_BACKUP_ITEM_FIELDS.forEach((key) => {
      const value = source[key];
      if (value === undefined || value === null || value === '') return;
      if (key === 'accessories') {
        compact[key] = normalizeAccessories(value);
      } else if (key === 'materialDimensionUnitIssues') {
        const issues = value && typeof value === 'object' ? value : {};
        compact[key] = {
          package: issues.package ? { unit: 'm', raw: compactBackupText(issues.package.raw, 120) } : null,
          print: issues.print ? { unit: 'm', raw: compactBackupText(issues.print.raw, 120) } : null,
        };
      } else if (Array.isArray(value)) {
        compact[key] = value.slice(0, 12).map((entry) => typeof entry === 'number'
          ? entry
          : compactBackupText(entry, key === 'infringementImageUrls' ? 600 : 120)).filter(Boolean);
      } else if (typeof value === 'string') {
        compact[key] = compactBackupText(value, /ingredient/i.test(key) ? 1800 : (key === 'referenceUrl' ? 600 : (key === 'infringementCopywriting' ? 2400 : 400)));
      } else {
        compact[key] = value;
      }
    });
    compact.sku = compactBackupText(source.sku || sku, 80);
    const infringementHistory = buildMinimalInfringementHistoryBackup(source.infringementHistory);
    if (infringementHistory.length) compact.infringementHistory = infringementHistory;
    const dataUpdateLog = buildMinimalDataUpdateLogBackup(source.dataUpdateLog);
    if (dataUpdateLog.length) compact.dataUpdateLog = dataUpdateLog;
    if (source.copywriting) compact.copywriting = buildMinimalCopywritingBackup(source.copywriting);
    if (Array.isArray(source.ingredientItems)) {
      compact.ingredientItems = source.ingredientItems.slice(0, 20).map((itemValue) => {
        const entry = itemValue && typeof itemValue === 'object' ? itemValue : { value: itemValue };
        return {
          name: compactBackupText(entry.name || entry.label || entry.ingredient || entry.ingredientName, 120),
          english: compactBackupText(entry.english || entry.en || entry.englishName, 300),
          chinese: compactBackupText(entry.chinese || entry.zh || entry.chineseName, 300),
          amount: compactBackupText(entry.amount || entry.content || entry.quantity, 120),
          value: compactBackupText(entry.value || entry.text, 400),
        };
      }).filter((itemValue) => Object.values(itemValue).some(Boolean));
    }
    return compact;
  }

  function buildMinimalUploadRecords(records) {
    const fields = [
      ['id', 120], ['sku', 80], ['name', 180], ['kind', 40], ['mode', 40], ['sourceName', 180],
      ['xlsxName', 180], ['zipName', 180], ['status', 80], ['step', 160], ['error', 220],
      ['createdAt', 80], ['updatedAt', 80], ['finishedAt', 80],
    ];
    return (Array.isArray(records) ? records : []).slice(0, 60).map((record) => {
      const source = record && typeof record === 'object' ? record : {};
      const compact = {};
      fields.forEach(([key, limit]) => {
        const value = source[key];
        if (value === undefined || value === null || value === '') return;
        compact[key] = typeof value === 'number' || typeof value === 'boolean' ? value : compactBackupText(value, limit);
      });
      ['fileCount', 'successCount', 'failedCount'].forEach((key) => {
        if (source[key] !== undefined && source[key] !== null) compact[key] = Number(source[key]) || 0;
      });
      return compact;
    }).filter((record) => record.id || record.sku);
  }

  function stripMinimalBackupLedgerLinks(record) {
    const compact = { ...record };
    delete compact.skuImageUrl;
    delete compact.benchmarkImageUrl;
    delete compact.referenceUrl;
    delete compact.aiMainImages;
    delete compact.aiDetailImages;
    delete compact.aiMainRetouchedImages;
    delete compact.aiDetailRetouchedImages;
    delete compact.aiMainRetouchTasks;
    delete compact.aiDetailRetouchTasks;
    return compact;
  }

  function buildMinimalLedgerRecords(records) {
    return sanitizeLedgerRecords(records).slice(0, 360).map(stripMinimalBackupLedgerLinks);
  }

  function buildMinimalLedgerTrashRecords(records) {
    return sanitizeLedgerTrashRecords(records).slice(0, 360).map(stripMinimalBackupLedgerLinks);
  }

  function buildMinimalCachePayload(fullPayload) {
    const source = fullPayload || buildCachePayload();
    const compactIndex = buildCompactBackupIndex(source.index);
    const indexedSkus = new Set(compactIndex.map((item) => item.sku));
    const items = {};
    let itemCount = 0;
    Object.keys(source.items || {}).forEach((sku) => {
      if (indexedSkus.size && !indexedSkus.has(String(sku))) return;
      if (itemCount >= 2000) return;
      const item = source.items[sku];
      if (!item || typeof item !== 'object') return;
      items[sku] = buildMinimalCacheItem(item, sku);
      itemCount += 1;
    });
    const uploadRecords = source.uploadRecords || {};
    const insights = sanitizeInsights(source.insights || emptyInsights());
    insights.priceHistory = insights.priceHistory.slice(0, 120);
    insights.dataIssues = insights.dataIssues.slice(0, 120);
    return {
      plugin: source.plugin || L.title,
      version: source.version || SCRIPT_VERSION,
      exportedAt: source.exportedAt || new Date().toLocaleString(),
      backupOwnerName: source.backupOwnerName || '',
      backupMode: 'minimal-v1',
      includesImageLinks: false,
      index: compactIndex,
      items,
      uploadRecords: {
        queue: buildMinimalUploadRecords(uploadRecords.queue),
        history: buildMinimalUploadRecords(uploadRecords.history),
      },
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(source.productDevelopmentTranslateWorkspaces),
      dailyLedger: buildMinimalLedgerRecords(source.dailyLedger),
      dailyLedgerTrash: buildMinimalLedgerTrashRecords(source.dailyLedgerTrash),
      insights,
    };
  }

  function buildIndexOnlyCachePayload(fullPayload) {
    const source = fullPayload || buildCachePayload();
    const compactIndex = buildCompactBackupIndex(source.index);
    const items = {};
    compactIndex.forEach((item) => {
      items[item.sku] = {
        sku: item.sku,
        brand: item.brand,
        name: item.name,
        packageCode: item.packageCode,
        printCode: item.printCode,
        designAssignedAt: item.designAssignedAt,
        acquiredAt: item.acquiredAt,
        acquiredAtMs: item.acquiredAtMs,
        skuListSource: item.skuListSource,
        updatedAt: item.updatedAt,
        updatedAtMs: item.updatedAtMs,
      };
    });
    return {
      plugin: source.plugin || L.title,
      version: source.version || SCRIPT_VERSION,
      exportedAt: source.exportedAt || new Date().toLocaleString(),
      backupOwnerName: source.backupOwnerName || '',
      backupMode: 'index-only-v1',
      includesImageLinks: false,
      index: compactIndex,
      items,
      uploadRecords: { queue: [], history: [] },
      productDevelopmentTranslateWorkspaces: buildProductDevelopmentTranslateWorkspacesBackup(source.productDevelopmentTranslateWorkspaces),
      dailyLedger: [],
      dailyLedgerTrash: [],
      insights: emptyInsights(),
    };
  }

  function getCloudBackupCryptoApi() {
    const cryptoApi = typeof window !== 'undefined' && window.crypto
      ? window.crypto
      : (typeof crypto !== 'undefined' ? crypto : null);
    if (!cryptoApi || !cryptoApi.subtle || typeof cryptoApi.getRandomValues !== 'function') {
      throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u4e91\u5907\u4efd\u52a0\u5bc6');
    }
    return cryptoApi;
  }

  function createCloudBackupRandomBytes(length) {
    const bytes = new Uint8Array(length);
    getCloudBackupCryptoApi().getRandomValues(bytes);
    return bytes;
  }

  function createCloudBackupSnapshotId() {
    return Array.from(createCloudBackupRandomBytes(18))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function getCloudBackupId(backupKey) {
    const digest = await getCloudBackupCryptoApi().subtle.digest('SHA-256', new TextEncoder().encode(String(backupKey || '')));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function deriveCloudBackupCryptoKey(backupKey, salt, iterations) {
    const cryptoApi = getCloudBackupCryptoApi();
    const requestedIterations = Number(iterations);
    const kdfIterations = Number.isInteger(requestedIterations) && requestedIterations >= 100000 && requestedIterations <= 500000
      ? requestedIterations
      : CLOUD_BACKUP_KDF_ITERATIONS;
    const passwordKey = await cryptoApi.subtle.importKey(
      'raw',
      new TextEncoder().encode(String(backupKey || '')),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return cryptoApi.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: kdfIterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function compressCloudBackupText(serialized) {
    const raw = new TextEncoder().encode(serialized);
    if (typeof CompressionStream !== 'function') return { bytes: raw, compression: 'none' };
    const stream = new Blob([raw], { type: 'application/json' })
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return compressed.byteLength < raw.byteLength
      ? { bytes: compressed, compression: 'gzip' }
      : { bytes: raw, compression: 'none' };
  }

  async function encodeCloudBackupPayload(payload, backupKey) {
    const serialized = JSON.stringify(payload);
    const prepared = await compressCloudBackupText(serialized);
    const salt = createCloudBackupRandomBytes(16);
    const iv = createCloudBackupRandomBytes(12);
    const key = await deriveCloudBackupCryptoKey(backupKey, salt, payload.kdfIterations);
    const encrypted = await getCloudBackupCryptoApi().subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      prepared.bytes
    );
    return {
      format: 'plm-backup-v2',
      encryption: 'aes-256-gcm',
      compression: prepared.compression,
      kdf: 'pbkdf2-sha256',
      kdfIterations: CLOUD_BACKUP_KDF_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      uncompressedLength: new TextEncoder().encode(serialized).byteLength,
      plugin: payload.plugin || L.title,
      version: payload.version || SCRIPT_VERSION,
      exportedAt: payload.exportedAt || new Date().toLocaleString(),
      backupOwnerName: payload.backupOwnerName || '',
      backupMode: payload.backupMode || 'full',
      data: bytesToBase64(new Uint8Array(encrypted)),
    };
  }

  async function decodeCloudBackupPayload(payload, backupKey) {
    if (!payload || payload.format !== 'plm-backup-v2') {
      if (!payload || payload.compression !== 'gzip-base64' || !payload.data) return payload;
      if (typeof DecompressionStream !== 'function') throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u89e3\u538b\u4e91\u5907\u4efd\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
      const compressed = base64ToArrayBuffer(payload.data);
      const stream = new Blob([compressed])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      const serialized = await new Response(stream).text();
      return JSON.parse(serialized);
    }
    if (!payload.data) throw new Error('\u4e91\u5907\u4efd\u5206\u7247\u4e0d\u5b8c\u6574');
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt || ''));
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv || ''));
    const key = await deriveCloudBackupCryptoKey(backupKey, salt);
    let decrypted;
    try {
      decrypted = new Uint8Array(await getCloudBackupCryptoApi().subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        base64ToArrayBuffer(payload.data)
      ));
    } catch (_) {
      throw new Error('\u4e91\u5907\u4efd\u5bc6\u94a5\u4e0d\u6b63\u786e\u6216\u6570\u636e\u5df2\u635f\u574f');
    }
    if (payload.compression === 'gzip') {
      if (typeof DecompressionStream !== 'function') throw new Error('\u5f53\u524d\u6d4f\u89c8\u5668\u65e0\u6cd5\u89e3\u538b\u4e91\u5907\u4efd\uff0c\u8bf7\u4f7f\u7528\u6700\u65b0\u7248 Chrome');
      const stream = new Blob([decrypted])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      decrypted = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return JSON.parse(new TextDecoder('utf-8').decode(decrypted));
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function isCloudBackupIdentityCompatibilityError(error) {
    const cloudData = error && error.cloudData ? error.cloudData : {};
    return Boolean(error && error.status === 400 && cloudData.error === 'backupKey too short');
  }

  function createCloudBackupTooLargeError() {
    const error = new Error('payload too large');
    error.cloudData = { error: 'payload too large' };
    error.status = 413;
    return error;
  }

  async function uploadCloudBackupEnvelope(backupId, backupKey, version, envelope) {
    const inlineBody = { backupId, version, payload: envelope };
    if (JSON.stringify(envelope).length <= CLOUD_BACKUP_INLINE_LIMIT) {
      try {
        return { ...(await cloudRequest('/backup/save', { method: 'POST', body: inlineBody })), chunked: false };
      } catch (error) {
        if (!isCloudBackupIdentityCompatibilityError(error)) throw error;
        return { ...(await cloudRequest('/backup/save', { method: 'POST', body: { backupKey, version, payload: envelope } })), chunked: false, legacyIdentity: true };
      }
    }
    const data = String(envelope.data || '');
    const chunkCount = Math.ceil(data.length / CLOUD_BACKUP_CHUNK_SIZE);
    if (!data || chunkCount > CLOUD_BACKUP_MAX_CHUNKS) throw createCloudBackupTooLargeError();
    const snapshotId = createCloudBackupSnapshotId();
    // Re-upload the same immutable snapshot once if an older server pruned it
    // while another window was committing its backup. Never retry other conflicts.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
        const chunk = data.slice(chunkIndex * CLOUD_BACKUP_CHUNK_SIZE, (chunkIndex + 1) * CLOUD_BACKUP_CHUNK_SIZE);
        try {
          await cloudRequest('/backup/chunk', {
            method: 'POST',
            body: { backupId, version, snapshotId, chunkIndex, chunkCount, data: chunk },
          });
        } catch (error) {
          if (error && error.status === 404) throw createCloudBackupTooLargeError();
          throw error;
        }
      }
      const manifest = { ...envelope, chunked: true, snapshotId, chunkCount, chunkSize: CLOUD_BACKUP_CHUNK_SIZE };
      delete manifest.data;
      try {
        const response = await cloudRequest('/backup/save', {
          method: 'POST',
          body: { backupId, version, payload: manifest },
        });
        return { ...(response || {}), chunked: true, bytes: data.length };
      } catch (error) {
        if (attempt || Number(error && error.status) !== 409 || !/backup chunks incomplete/i.test(String(error && error.message || ''))) throw error;
      }
    }
  }

  async function loadCloudBackupRecord(backupKey) {
    const backupId = await getCloudBackupId(backupKey);
    let response;
    try {
      response = await cloudRequest('/backup/load?backupId=' + encodeURIComponent(backupId), { method: 'GET' });
    } catch (error) {
      if (!isCloudBackupIdentityCompatibilityError(error)) throw error;
      response = await cloudRequest('/backup/load?backupKey=' + encodeURIComponent(backupKey), { method: 'GET' });
    }
    if (!response || !response.found || !response.payload || !response.payload.chunked) return response;
    const manifest = response.payload;
    const snapshotId = String(manifest.snapshotId || '');
    const chunkCount = Number(manifest.chunkCount || 0);
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(snapshotId) || !Number.isInteger(chunkCount) || chunkCount <= 0 || chunkCount > CLOUD_BACKUP_MAX_CHUNKS) {
      throw new Error('\u4e91\u5907\u4efd\u5206\u7247\u4fe1\u606f\u65e0\u6548');
    }
    const chunks = [];
    for (let start = 0; start < chunkCount; start += 4) {
      const group = await Promise.all(Array.from({ length: Math.min(4, chunkCount - start) }, (_, offset) => {
        const chunkIndex = start + offset;
        return cloudRequest('/backup/load-chunk?backupId=' + encodeURIComponent(backupId) + '&snapshotId=' + encodeURIComponent(snapshotId) + '&chunkIndex=' + chunkIndex, { method: 'GET' });
      }));
      group.forEach((chunk) => chunks.push(String(chunk && chunk.data || '')));
    }
    if (chunks.length !== chunkCount || chunks.some((chunk) => !chunk)) throw new Error('\u4e91\u5907\u4efd\u5206\u7247\u4e0d\u5b8c\u6574');
    response.payload = { ...manifest, data: chunks.join('') };
    delete response.payload.chunked;
    delete response.payload.snapshotId;
    delete response.payload.chunkCount;
    delete response.payload.chunkSize;
    return response;
  }

  function sanitizeUploadRecords(records) {
    return (Array.isArray(records) ? records : []).slice(0, 300).map((item) => ({
      ...item,
      xlsxKey: '',
      zipKey: '',
      copyrightFiles: getCopyrightUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      effectFiles: getToyEffectUploadEntries(item).map((entry) => ({ ...entry, key: '' })),
      selected: false,
    }));
  }

  function handleImportFile(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importCachePayload(JSON.parse(String(reader.result || '{}')));
        showToast(L.importDone);
        state.view = 'about';
        renderShell();
      } catch (error) {
        console.warn('PLM floating helper import failed:', error);
        showToast(L.importFailed);
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      showToast(L.importFailed);
      event.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  function importCachePayload(payload) {
    const items = payload && payload.items ? payload.items : payload;
    if (!items || typeof items !== 'object') throw new Error('Invalid cache payload');
    Object.keys(items).forEach((sku) => {
      const data = normalizeData({ ...items[sku], sku: (items[sku] && items[sku].sku) || sku });
      if (!data.sku) return;
      saveDataDirect(data.sku, data);
      upsertIndex(data);
    });
    if (Array.isArray(payload.index)) {
      payload.index.forEach((item) => {
        const existing = state.index.find((entry) => entry.sku === item.sku);
        if (!existing) return;
        if (item.brand && !existing.brand) existing.brand = item.brand;
        if (item.pinned) existing.pinned = true;
        if (item.pinOrder) existing.pinOrder = item.pinOrder;
      });
      saveIndex();
    }
    if (payload.uploadRecords && typeof payload.uploadRecords === 'object') {
      if (Array.isArray(payload.uploadRecords.queue)) {
        state.uploadQueue = sanitizeUploadRecords(payload.uploadRecords.queue).map((item) => ({
          ...item,
          status: item.status && /\u6210\u529f|\u5931\u8d25|\u5df2\u8df3\u8fc7|\u5df2\u4fdd\u5b58/.test(item.status) ? item.status : '\u8bf7\u8865\u5145\u6587\u4ef6',
          step: item.step || '\u4e91\u5907\u4efd\u6062\u590d\uff0c\u9700\u91cd\u65b0\u9009\u62e9\u6587\u4ef6',
        }));
        saveUploadQueue();
      }
      if (Array.isArray(payload.uploadRecords.history)) {
        state.uploadHistory = sanitizeUploadRecords(payload.uploadRecords.history);
        saveUploadHistory();
      }
    }
    if (Array.isArray(payload.dailyLedgerTrash)) {
      const importedTrash = sanitizeLedgerTrashRecords(payload.dailyLedgerTrash);
      const importedTrashKeys = new Set(importedTrash.map((item) => getMonthKeyFromDateKey(item.date) + '|' + item.sku));
      state.ledgerTrashRecords = importedTrash.concat((state.ledgerTrashRecords || loadDailyLedgerTrash()).filter((item) => !importedTrashKeys.has(getMonthKeyFromDateKey(item.date) + '|' + item.sku))).slice(0, 1200);
      saveDailyLedgerTrash();
    }
    if (Array.isArray(payload.dailyLedger)) {
      const imported = filterLedgerRecordsNotInTrash(payload.dailyLedger);
      const importedKeys = new Set(imported.map((item) => item.date + '|' + item.sku));
      state.ledgerRecords = filterLedgerRecordsNotInTrash(imported.concat((state.ledgerRecords || loadDailyLedger()).filter((item) => !importedKeys.has(item.date + '|' + item.sku)))).slice(0, 1200);
      saveDailyLedger();
    }
    if (payload.insights && typeof payload.insights === 'object') {
      state.insights = sanitizeInsights(payload.insights);
      saveInsights();
    }
    if (payload.productDevelopmentTranslateWorkspaces) {
      const imported = productDevelopmentTranslateWorkspaceEntries(payload.productDevelopmentTranslateWorkspaces);
      const current = loadProductDevelopmentTranslateWorkspaces();
      Object.keys(imported).forEach((sku) => {
        const incoming = imported[sku];
        const existing = current[sku];
        if (!existing || Number(incoming.updatedAt) >= Number(existing.updatedAt)) {
          current[sku] = existing && existing.imageDataUrl && !incoming.imageDataUrl
            ? { ...incoming, imageDataUrl: existing.imageDataUrl }
            : incoming;
        }
      });
      writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_WORKSPACE_KEY, { version: 1, entries: buildProductDevelopmentTranslateWorkspacesBackup(current, { includeLocalImages: true }) });
      const latest = Object.values(current).sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))[0];
      if (latest) writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_ACTIVE_KEY, { sku: latest.sku, updatedAt: latest.updatedAt });
    }
  }

  function getCloudBackupKey() {
    return String(state.settings.cloudBackupKey || '').trim();
  }

  function isCloudBackupKeyConflict() {
    const key = getCloudBackupKey();
    return Boolean(key && state.settings.cloudBackupConflictKeyHash === diagnosticHash(key));
  }

  function notifyCloudBackupKeyConflict() {
    showToast('备份密钥已由其他账号使用，自动备份已暂停。请打开设置 → 云备份，点击“生成个人密钥并验证”，或填写自己的新密钥', { diagnostic: false });
  }

  function cloudBackupKeyGuideHtml() {
    const conflict = isCloudBackupKeyConflict();
    return '<div class="pfh-about-note"' + (conflict ? ' role="alert"' : '') + '>' +
      (conflict ? '此密钥已由其他账号使用，自动备份已暂停。请换一个仅自己使用的密钥，再保存并验证。' :
        '每人使用不同的备份密钥，请勿与同事共用。同一账号在其他电脑恢复备份时，请使用自己的同一密钥。请妥善保存，恢复备份时需要它。') +
      '</div><div class="pfh-about-actions"><button type="button" data-action="cloud-backup-rekey"' +
      (state.cloudBackupRunning ? ' disabled' : '') + '>生成个人密钥并验证</button></div>';
  }

  function refreshCloudBackupKeyGuide() {
    const guide = ensurePanel().querySelector('.pfh-cloud-key-guide');
    if (guide) guide.innerHTML = cloudBackupKeyGuideHtml();
  }

  function updateCloudBackupKey(value) {
    const key = String(value || '').trim();
    if (key === getCloudBackupKey()) return;
    state.settings.cloudBackupKey = key;
    setCloudBackupStatus(isCloudBackupKeyConflict()
      ? '此密钥已由其他账号使用，请更换个人密钥'
      : '密钥已更换，尚未验证，请点击“保存并验证密钥”');
  }

  async function generatePersonalCloudBackupKey() {
    if (state.cloudBackupRunning) {
      showToast('备份正在进行，请稍后再更换密钥');
      return false;
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const key = 'plm-' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    updateCloudBackupKey(key);
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) input.value = key;
    return saveCloudBackupNow();
  }

  function getCloudBackupOwnerName() {
    const backupKey = getCloudBackupKey();
    if (!backupKey) return '';
    const savedName = String(state.settings.cloudBackupOwnerName || '').trim();
    if (state.settings.cloudBackupOwnerKey === backupKey && savedName) return savedName;
    const name = findCurrentPlmUserName();
    state.settings.cloudBackupOwnerKey = backupKey;
    state.settings.cloudBackupOwnerName = name;
    saveSettings(state.settings);
    return name;
  }

  function findCurrentPlmUserName() {
    const candidates = Array.from(document.querySelectorAll(
      '.btnBoxMainText.ant-dropdown-trigger, [data-user-name], [data-username], .user-name, .userName, .username, .nick-name, .nickName, .nickname, .ant-layout-header .ant-dropdown-trigger, header .ant-dropdown-trigger, [class*="user-info"], [class*="userInfo"], [class*="account-name"], [class*="accountName"], [class*="profile-name"], [class*="profileName"]'
    )).filter(isVisibleElement);
    for (const element of candidates) {
      const ownText = Array.from(element.childNodes || []).filter((node) => node.nodeType === 3).map((node) => node.textContent || '').join(' ').trim();
      const rawValues = [
        element.getAttribute('data-user-name'),
        element.getAttribute('data-username'),
        ownText,
        ...String(element.innerText || element.textContent || '').split(/[\r\n]+/),
      ];
      for (const rawValue of rawValues) {
        const value = String(rawValue || '').trim().replace(/\s+/g, ' ');
        const name = value.replace(/\s+(?:(?:开发|设计|供应链|运营|采购|销售|品控|产品|项目|高级|储备)[^\s]{0,12}(?:主管|经理|专员|工程师|助理|总监|组长|负责人)?).*$/i, '').trim();
        if (/^[\u4e00-\u9fa5A-Za-z][\u4e00-\u9fa5A-Za-z ._-]{1,30}$/.test(name) && !/^(PLM|\u7528\u6237|\u8d26\u53f7|\u6211\u7684|\u5f53\u524d\u7528\u6237)$/.test(name) && !/\u9000\u51fa|\u767b\u5f55|\u8bbe\u7f6e|\u5e2e\u52a9/.test(name)) return name;
      }
    }
    return '';
  }

  function getCloudBackupStatusText() {
    if (isCloudBackupKeyConflict()) return '密钥与其他账号冲突，自动备份已暂停，请更换个人密钥';
    return redactCloudBackupOwnerMismatch(state.cloudBackupStatus || state.settings.cloudBackupStatus || L.cloudBackupReady);
  }

  function getInsightAiModelSetting() {
    const saved = state.settings && state.settings.insightAiModel;
    return saved === MODELSCOPE_INSIGHT_MODEL || saved === 'gemini-3.5-flash' ? MODELSCOPE_INSIGHT_MODEL : 'glm-4.7-flash';
  }

  function setCloudBackupStatus(text) {
    state.cloudBackupStatus = text || '';
    state.settings.cloudBackupStatus = state.cloudBackupStatus;
    saveSettings(state.settings);
    const status = ensurePanel().querySelector('.pfh-cloud-status');
    if (status) status.textContent = getCloudBackupStatusText();
    refreshCloudBackupKeyGuide();
  }

  function queueCloudBackup() {
    if (!getCloudBackupKey() || isCloudBackupKeyConflict()) return;
    state.cloudBackupQueued = true;
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
  }

  async function runQueuedCloudBackup() {
    if (!state.cloudBackupQueued || state.cloudBackupRunning) return;
    state.cloudBackupQueued = false;
    await saveCloudBackup({ silent: true });
    if (state.cloudBackupQueued) {
      window.clearTimeout(state.cloudBackupTimer);
      state.cloudBackupTimer = window.setTimeout(() => runQueuedCloudBackup(), CLOUD_BACKUP_DEBOUNCE_MS);
    }
  }

  async function saveCloudBackupNow() {
    window.clearTimeout(state.cloudBackupTimer);
    state.cloudBackupQueued = false;
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      updateCloudBackupKey(input.value);
    }
    try {
      return await saveCloudBackup({ silent: false });
    } catch (error) {
      console.warn('PLM floating helper cloud backup failed:', error);
    }
  }

  async function saveCloudBackup(options) {
    const backupKey = getCloudBackupKey();
    if (isCloudBackupKeyConflict()) {
      if (!(options && options.silent)) notifyCloudBackupKeyConflict();
      return false;
    }
    if (!backupKey) {
      if (!(options && options.silent)) showToast(L.cloudBackupMissingKey);
      return false;
    }
    if (backupKey.length < 4) {
      if (!(options && options.silent)) showToast(L.cloudBackupKeyTooShort);
      return false;
    }
    if (state.cloudBackupRunning) {
      state.cloudBackupQueued = true;
      return false;
    }
    state.cloudBackupRunning = true;
    setCloudBackupStatus(L.cloudBackupSaving);
    if (!(options && options.silent)) showToast(L.cloudBackupSaving);
    const translateDirty = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
    const translateDirtyAt = Number(translateDirty && translateDirty.updatedAt) || 0;
    try {
      const payload = buildCachePayload();
      payload.insights = sanitizeInsightsForCloudBackup(payload.insights);
      if (!payload.backupOwnerName) throw new Error(L.cloudBackupOwnerMissing);
      const backupId = await getCloudBackupId(backupKey);
      const backupAttempts = [
        { label: '\u5b8c\u6574', build: () => payload },
        { label: '\u7cbe\u7b80', build: () => buildCompactCachePayload(payload) },
        { label: '\u8d85\u7cbe\u7b80', build: () => buildMinimalCachePayload(payload) },
        { label: '\u7d22\u5f15', build: () => buildIndexOnlyCachePayload(payload) },
      ];
      let response;
      let uploadedMode = '';
      for (let attemptIndex = 0; attemptIndex < backupAttempts.length; attemptIndex += 1) {
        const attempt = backupAttempts[attemptIndex];
        if (attemptIndex > 0) {
          addLog('warn', '\u4e91\u5907\u4efd' + backupAttempts[attemptIndex - 1].label + '\u5feb\u7167\u8d85\u9650\uff0c\u6539\u7528' + attempt.label + '\u5feb\u7167\u91cd\u8bd5', state.index.length + ' \u4e2a\u7f16\u7801');
        }
        try {
          response = await uploadCloudBackupEnvelope(backupId, backupKey, SCRIPT_VERSION, await encodeCloudBackupPayload(attempt.build(), backupKey));
          uploadedMode = attempt.label;
          break;
        } catch (error) {
          const cloudData = error && error.cloudData ? error.cloudData : {};
          const tooLarge = cloudData.error === 'payload too large' || (error && error.message === 'payload too large');
          if (!tooLarge || attemptIndex === backupAttempts.length - 1) throw error;
        }
      }
      if (!response || !response.ok || response.userId !== backupId) throw new Error(response && response.error ? response.error : '云端未确认密钥与备份保存结果，请稍后重新验证');
      if (getCloudBackupKey() !== backupKey) return true;
      myProfile.backupOrigin = null;
      myProfile.backupKey = '';
      if (myProfile.open) refreshMyProfileBackup();
      state.settings.cloudBackupConflictKeyHash = '';
      const downgraded = uploadedMode && uploadedMode !== '\u5b8c\u6574';
      const chunked = Boolean(response.chunked);
      const backupModeText = downgraded ? '\uff08' + uploadedMode + (chunked ? '\u00b7\u5206\u7247' : '') + '\uff09' : (chunked ? '\uff08\u5206\u7247\uff09' : '');
      setCloudBackupStatus('密钥验证通过 · ' + L.cloudBackupSavedAt + ' ' + new Date().toLocaleTimeString() + '\uff0c' + state.index.length + '\u4e2a\u7f16\u7801' + backupModeText);
      addLog('success', downgraded ? '\u4e91\u5907\u4efd' + uploadedMode + '\u4e0a\u4f20\u6210\u529f' : '\u4e91\u5907\u4efd\u4e0a\u4f20\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801' + (chunked ? '\u00b7\u5206\u7247' : ''));
      const translateDirtyAfter = readProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
      if (!translateDirtyAfter || Number(translateDirtyAfter.updatedAt) <= translateDirtyAt) writeProductDevelopmentStorage(PRODUCT_DEVELOPMENT_TRANSLATE_BACKUP_DIRTY_KEY, null);
      if (!(options && options.silent)) showToast(L.cloudBackupSaved);
      return true;
    } catch (error) {
      if (error && error.cloudData && error.cloudData.error === 'backup owner mismatch') {
        state.settings.cloudBackupConflictKeyHash = diagnosticHash(backupKey);
        saveSettings(state.settings);
        if (getCloudBackupKey() === backupKey) {
          state.cloudBackupQueued = false;
          window.clearTimeout(state.cloudBackupTimer);
          notifyCloudBackupKeyConflict();
        }
      }
      if (getCloudBackupKey() !== backupKey) return false;
      const errorMessage = formatCloudBackupSaveError(error);
      console.warn('PLM floating helper cloud backup save failed:', errorMessage);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + errorMessage);
      addLog('error', '\u4e91\u5907\u4efd\u4e0a\u4f20\u5931\u8d25', errorMessage);
      if (!(options && options.silent) && !isCloudBackupKeyConflict()) showToast(L.cloudBackupFailed + '\uff1a' + errorMessage);
      return false;
    } finally {
      state.cloudBackupRunning = false;
      refreshCloudBackupKeyGuide();
    }
  }

  function formatCloudBackupSaveError(error) {
    const cloudData = error && error.cloudData ? error.cloudData : {};
    if (cloudData.error === 'backup owner mismatch') {
      return '该备份密钥不可用于当前账号，请更换备份密钥';
    }
    if (cloudData.error === 'payload too large' || (error && error.message === 'payload too large')) {
      return '\u4e91\u5907\u4efd\u5206\u7ea7\u5feb\u7167\u5747\u8d85\u8fc7\u4e0a\u9650';
    }
    return error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef';
  }

  async function restoreCloudBackup() {
    const input = ensurePanel().querySelector('.pfh-cloud-backup-key');
    if (input) {
      state.settings.cloudBackupKey = input.value.trim();
      saveSettings(state.settings);
    }
    const backupKey = getCloudBackupKey();
    if (!backupKey) {
      showToast(L.cloudBackupMissingKey);
      return;
    }
    if (backupKey.length < 4) {
      showToast(L.cloudBackupKeyTooShort);
      return;
    }
    if (!window.confirm('\u786e\u5b9a\u8981\u4ece\u4e91\u5907\u4efd\u6062\u590d\u6570\u636e\u5417\uff1f')) return;
    setCloudBackupStatus(L.cloudBackupRestoring);
    showToast(L.cloudBackupRestoring);
    try {
      const response = await loadCloudBackupRecord(backupKey);
      if (!response || !response.found) {
        setCloudBackupStatus(L.cloudBackupNotFound);
        showToast(L.cloudBackupNotFound);
        return;
      }
      importCachePayload(await decodeCloudBackupPayload(response.payload, backupKey));
      saveSettings(state.settings);
      setCloudBackupStatus(L.cloudBackupRestored + '\uff1a' + state.index.length + '\u4e2a\u7f16\u7801');
      addLog('success', '\u4e91\u5907\u4efd\u6062\u590d\u6210\u529f', state.index.length + '\u4e2a\u7f16\u7801');
      showToast(L.cloudBackupRestored);
      state.view = 'about';
      renderShell();
    } catch (error) {
      console.warn('PLM floating helper cloud backup restore failed:', error);
      setCloudBackupStatus(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
      addLog('error', '\u4e91\u5907\u4efd\u6062\u590d\u5931\u8d25', error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef');
      showToast(L.cloudBackupFailed + '\uff1a' + (error && error.message ? error.message : '\u672a\u77e5\u9519\u8bef'));
    }
  }

  function buildPackBoxKey(data) {
    if (!data) return '';
    const source = shouldUseProductSizeForPacking(data)
      ? [data.productLength, data.productWidth, data.productHeight]
      : [data.packageLength, data.packageWidth, data.packageHeight];
    const parts = source
      .map((value) => normalizePackDimensionPart(value))
      .filter(Boolean);
    return parts.length === 3 ? parts.join('x') : '';
  }

  function calculateLocalPackRecommendation(boxKey) {
    const itemDims = String(boxKey || '')
      .split('x')
      .map((part) => Number(part));
    if (itemDims.length !== 3 || itemDims.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    const cartonDims = [56, 36, 21];
    const permutations = [
      [itemDims[0], itemDims[1], itemDims[2]],
      [itemDims[0], itemDims[2], itemDims[1]],
      [itemDims[1], itemDims[0], itemDims[2]],
      [itemDims[1], itemDims[2], itemDims[0]],
      [itemDims[2], itemDims[0], itemDims[1]],
      [itemDims[2], itemDims[1], itemDims[0]],
    ];
    const best = permutations.reduce((current, dims) => {
      const count = Math.floor(cartonDims[0] / dims[0])
        * Math.floor(cartonDims[1] / dims[1])
        * Math.floor(cartonDims[2] / dims[2]);
      return count > current.packCount ? { packCount: count, orientation: dims.join('x') } : current;
    }, { packCount: 0, orientation: '' });
    if (!best.packCount) return null;
    return {
      boxKey,
      packCount: best.packCount,
      orientation: best.orientation,
      cartonKey: cartonDims.join('x'),
      source: 'local-calc',
    };
  }

  function getLocalPackQty(data) {
    const boxKey = buildPackBoxKey(data);
    const recommendation = calculateLocalPackRecommendation(boxKey);
    return recommendation && recommendation.packCount ? String(recommendation.packCount) : '';
  }

  function shouldUseProductSizeForPacking(data) {
    return Boolean(data && data.singleBottle && !/纸盒/.test(String(data.packageSizeLabel || '')));
  }

  function shouldRemoveExcelPackageSizeColumn(data) {
    return shouldUseProductSizeForPacking(data);
  }

  function normalizePackDimensionPart(value) {
    const text = String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\u5398\u7c73|\u516c\u5206/g, 'cm')
      .replace(/[\u00d7*]/g, 'x');
    const cmPart = text.split('/')[0].replace(/cm/g, '');
    const match = cmPart.match(/\d+(?:\.\d+)?/);
    if (!match) return '';
    const number = Number(match[0]);
    return Number.isFinite(number) && number > 0 ? trimNumber(number) : '';
  }

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

  async function fetchInsightRecommendation(data, productType) {
    const params = new URLSearchParams();
    if (data && data.sku) params.set('sku', data.sku);
    if (productType) params.set('productType', productType);
    if (data && data.name) params.set('name', data.name);
    return cloudRequest('/insights/recommend?' + params.toString(), { method: 'GET' });
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
        if (state.view === 'home' || state.view === 'about' || state.view === 'parameterImage') renderShell();
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

  function formatCopyAll(data) {
    if (!data) return '';
    return [
      '[' + L.fileSection + ']',
      L.brand + ' / ' + L.name + ' / ' + L.sku + ': ' + [data.brand, data.name, data.sku].filter(Boolean).join(' | '),
      L.packageCode + ': ' + (data.packageCode || L.unknown),
      L.printCode + ': ' + (data.printCode || L.unknown),
      (data.packageSizeLabel || L.packageSize) + ': ' + (data.packageSizeText || L.noPackage),
      (data.printSizeLabel || L.printSize) + ': ' + (data.printSizeText || L.noPrint),
      '',
      '[' + L.graphicSection + ']',
      L.cartonLength + ': ' + (data.packageLength || L.noDimension),
      L.cartonWidth + ': ' + (data.packageWidth || L.noDimension),
      L.cartonHeight + ': ' + (data.packageHeight || L.noDimension),
      L.productLength + ': ' + (data.isTubePrint ? (data.productLength || L.tailSealLength) : (data.productLength || L.noDimension)),
      L.productWidth + ': ' + (data.productWidth || L.noDimension),
      L.productHeight + ': ' + (data.productHeight || L.noDimension),
      L.netContent + ': ' + (data.netContent || L.unknown),
      L.grossWeight + ': ' + (data.grossWeight || L.unknown),
    ].join('\n');
  }

  function formatTitleMeta(data) {
    if (!data) return '';
    return [data.brand, data.name, data.sku].filter(Boolean).join(' ');
  }

  function copyText(text) {
    const value = text || L.unknown;
    if (typeof GM_setClipboard === 'function') GM_setClipboard(value, 'text');
    else if (navigator.clipboard) navigator.clipboard.writeText(value);
  }

  function presentToast(toast, item, token) {
    if (!toast || token !== state.toastToken) return;
    const message = item.message;
    const quiet = item.quiet;
    const tone = item.tone;
    const duration = item.duration;
    toast.textContent = message;
    toast.dataset.message = message;
    toast.classList.toggle('is-quiet', quiet);
    toast.classList.toggle('is-success', tone === 'success');
    toast.classList.toggle('is-error', tone === 'error');
    toast.classList.toggle('is-info', tone === 'info');
    toast.style.setProperty('--pfh-toast-life', duration + 'ms');
    toast.classList.remove('is-leaving', 'is-visible');
    toast.classList.add('is-mounted');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    state.toastTimer = window.setTimeout(() => {
      if (!toast.isConnected || token !== state.toastToken) return;
      toast.classList.remove('is-visible');
      toast.classList.add('is-leaving');
      state.toastExitTimer = window.setTimeout(() => {
        if (toast.isConnected && token === state.toastToken) toast.remove();
        state.toastTimer = 0;
        state.toastExitTimer = 0;
      }, 420);
    }, duration);
  }

  function dismissToast(token) {
    if (!token || token !== state.toastToken) return;
    ++state.toastToken;
    window.clearTimeout(state.toastTimer);
    window.clearTimeout(state.toastExitTimer);
    state.toastTimer = 0;
    state.toastExitTimer = 0;
    if (state.toastSwapAnimation) {
      try { state.toastSwapAnimation.cancel(); } catch (_) {}
      state.toastSwapAnimation = null;
    }
    const panel = document.getElementById(PANEL_ID);
    const toast = panel && panel.querySelector('.pfh-toast');
    if (toast) toast.remove();
  }

  function showToast(text, options) {
    if (!(options && options.diagnostic === false) && shouldReportDiagnosticLog('warn', text)) {
      reportDiagnosticFromLog(text, '', 'warn');
    }
    const message = neutralizeTechnicalTerms(text);
    if (!message) return;
    const quiet = Boolean(options && options.quiet);
    const requestedTone = String(options && options.tone || '').trim();
    const tone = requestedTone || (quiet ? 'quiet' : (/失败|错误|异常|不可用|无法|不能为空|请先|缺少|拦截|未找到|没有可/.test(message) ? 'error' : 'success'));
    if (!quiet && tone === 'error' && /network|failed to fetch|timeout|网络|云端连接|外部连接|加载失败/i.test(message)) offerNetworkDiagnostics('当前操作因通信异常未能完成');
    const duration = message.length > 12 ? 12000 : 7000;
    const item = { message, quiet, tone, duration };
    const panel = ensurePanel();
    let toast = panel.querySelector('.pfh-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pfh-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      panel.appendChild(toast);
    }
    const token = ++state.toastToken;
    window.clearTimeout(state.toastTimer);
    window.clearTimeout(state.toastExitTimer);
    state.toastTimer = 0;
    state.toastExitTimer = 0;
    if (state.toastSwapAnimation) {
      try { state.toastSwapAnimation.cancel(); } catch (_) {}
      state.toastSwapAnimation = null;
    }
    const shouldTransition = toast.classList.contains('is-visible')
      && toast.dataset.message
      && toast.dataset.message !== message
      && toast.animate
      && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!shouldTransition) {
      presentToast(toast, item, token);
      return token;
    }
    const startOpacity = Number.parseFloat(getComputedStyle(toast).opacity);
    const animation = toast.animate([
      { opacity: Number.isFinite(startOpacity) ? startOpacity : 1, transform: 'translate(0, 0) scale(1)' },
      { opacity: 0, transform: 'translate(9px, 4px) scale(.96)' },
    ], {
      duration: 150,
      easing: 'cubic-bezier(.55, .05, .8, .4)',
      fill: 'forwards',
    });
    state.toastSwapAnimation = animation;
    animation.onfinish = () => {
      if (state.toastSwapAnimation === animation) state.toastSwapAnimation = null;
      try { animation.cancel(); } catch (_) {}
      presentToast(toast, item, token);
    };
    return token;
  }

  function addLog(level, message, detail) {
    const diagnosticCode = shouldReportDiagnosticLog(level, message, detail)
      ? reportDiagnosticFromLog(message, detail, String(level).toLowerCase())
      : '';
    const text = neutralizeTechnicalTerms([message, detail, diagnosticCode && ('错误编号 ' + diagnosticCode)].filter(Boolean).join(' | '));
    const item = {
      time: new Date().toLocaleTimeString(),
      level: level || 'info',
      message: String(text || '').slice(0, 600),
    };
    state.logs = [item].concat(state.logs || []).slice(0, 300);
    saveLogs();
    syncImportantLog(item, detail);
    const panel = document.getElementById(PANEL_ID);
    if (panel && panel.dataset.view === 'about') {
      const logPanel = panel.querySelector('.pfh-runtime-log-panel');
      if (logPanel) logPanel.outerHTML = renderLogSection();
    }
  }

  function loadLogs() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(LOG_KEY, null) : JSON.parse(localStorage.getItem(LOG_KEY) || 'null');
      const sanitized = Array.isArray(saved) ? saved.map((item) => ({
        ...item,
        message: redactCloudBackupOwnerMismatch(item && item.message),
      })) : [];
      if (Array.isArray(saved) && sanitized.some((item, index) => item.message !== (saved[index] && saved[index].message))) {
        if (typeof GM_setValue === 'function') GM_setValue(LOG_KEY, sanitized);
        else localStorage.setItem(LOG_KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch (error) {
      return [];
    }
  }

  function redactCloudBackupOwnerMismatch(value) {
    const text = String(value || '');
    return text.includes('该备份密钥已绑定') || text.includes('backup owner mismatch')
      ? '云备份上传失败 | 该备份密钥不可用于当前账号，请更换备份密钥'
      : text;
  }

  function saveLogs() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(LOG_KEY, state.logs || []);
      else localStorage.setItem(LOG_KEY, JSON.stringify(state.logs || []));
    } catch (error) {
      console.warn('PLM floating helper log save failed:', error);
      reportDiagnostic(error, { feature: 'storage', action: 'save-logs' });
    }
  }

  function formatLogsForCopy() {
    return (state.logs || []).map((item) => '[' + (item.time || '') + '] ' + (item.level || 'info').toUpperCase() + ' ' + (item.message || '')).join('\n') || L.logEmpty;
  }

  function syncImportantLog(item, detail) {
    const level = String(item && item.level || '').toLowerCase();
    if (!/^(success|warn|error)$/.test(level)) return;
    const message = String(item && item.message || '');
    if (!message || shouldSkipCloudLogSync(level, message)) return;
    const now = Date.now();
    const key = [level, message.slice(0, 180)].join('|');
    state.logSyncDedup = state.logSyncDedup || {};
    if (state.logSyncDedup[key] && now - state.logSyncDedup[key] < 5 * 60 * 1000) return;
    state.logSyncDedup[key] = now;
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null) || {};
    const logSku = findSku([message, detail].filter(Boolean).join(' '));
    syncInsightEvent('log', {
      sku: logSku || data.sku || state.selectedSku || state.sku || '',
      brand: logSku && logSku !== data.sku ? '' : (data.brand || ''),
      name: logSku && logSku !== data.sku ? '' : (data.name || ''),
      level,
      message,
      detail: String(detail || '').slice(0, 600),
      url: location.href,
      source: 'plm-helper-log',
    });
  }

  function shouldSkipCloudLogSync(level, message) {
    const text = String(message || '');
    if (/\u4e91\u7aef\u6d1e\u5bdf\u540c\u6b65\u5931\u8d25|\u4e91\u5907\u4efd|\u4f7f\u7528\u72b6\u6001\u540c\u6b65\u5931\u8d25|\u4e3b\u9875\u95ee\u5019\u8bed\u540c\u6b65\u5931\u8d25|\u5c0f\u63d0\u793a\u62c9\u53d6\u5931\u8d25/.test(text)) return true;
    if (level === 'success' && !/(\u63d0\u5ba1|\u4e0a\u4f20|\u751f\u6210|Excel|\u6807\u7b7e|\u590d\u5236|AI|\u8868\u683c|\u6e05\u6d17|\u667a\u80fd|\u4ef7\u683c|\u7c7b\u578b|\u6570\u636e|\u56fe\u7247)/i.test(text)) return true;
    if (/^\u56fe\u7247\u4e0b\u8f7d\u6210\u529f/.test(text)) return true;
    if (/^\u6279\u91cf\u4e0b\u8f7d\u56fe\u7247\uff1aURL \u515c\u5e95\u4e0b\u8f7d/.test(text)) return true;
    return false;
  }

  function emptyInsights() {
    return { priceHistory: [], dataIssues: [], typeStats: {} };
  }

  function sanitizeInsights(value) {
    const source = value && typeof value === 'object' ? value : {};
    const clean = emptyInsights();
    clean.priceHistory = (Array.isArray(source.priceHistory) ? source.priceHistory : []).slice(0, 1000).map((item) => ({
      sku: String(item.sku || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 120),
      name: String(item.name || '').slice(0, 200),
      productType: String(item.productType || '').slice(0, 120),
      price: String(item.price || '').slice(0, 40),
      packQty: String(item.packQty || '').slice(0, 40),
      packageSize: String(item.packageSize || '').slice(0, 120),
      productSize: String(item.productSize || '').slice(0, 120),
      source: String(item.source || '').slice(0, 80),
      fileName: String(item.fileName || '').slice(0, 220),
      recordedAt: String(item.recordedAt || '').slice(0, 80),
      recordedAtMs: Number(item.recordedAtMs || 0) || 0,
    })).filter((item) => item.sku);
    clean.dataIssues = (Array.isArray(source.dataIssues) ? source.dataIssues : []).slice(0, 1000).map((item) => ({
      sku: String(item.sku || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 120),
      name: String(item.name || '').slice(0, 200),
      missing: Array.isArray(item.missing) ? item.missing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      seen: String(item.seen || '').slice(0, 120),
      issueKind: String(item.issueKind || '').slice(0, 80),
      readiness: String(item.readiness || '').slice(0, 160),
      diagnosticAttempt: sanitizeMissingDiagnostic(item.diagnosticAttempt),
      fieldDiagnostics: sanitizeFieldDiagnostics(item.fieldDiagnostics),
      source: String(item.source || '').slice(0, 80),
      recordedAt: String(item.recordedAt || '').slice(0, 80),
      recordedAtMs: Number(item.recordedAtMs || 0) || 0,
    })).filter((item) => item.sku && item.missing.length);
    const stats = source.typeStats && typeof source.typeStats === 'object' ? source.typeStats : {};
    Object.keys(stats).slice(0, 300).forEach((key) => {
      const item = stats[key] || {};
      clean.typeStats[String(key).slice(0, 120)] = {
        count: Number(item.count || 0) || 0,
        latestSku: String(item.latestSku || '').slice(0, 80),
        latestPrice: String(item.latestPrice || '').slice(0, 40),
        latestAt: String(item.latestAt || '').slice(0, 80),
      };
    });
    return clean;
  }

  function sanitizeInsightsForCloudBackup(value) {
    const clean = sanitizeInsights(value);
    clean.priceHistory = clean.priceHistory.map((item) => {
      const { packQty, ...rest } = item;
      return rest;
    });
    return clean;
  }

  function sanitizeFieldDiagnostics(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 20).map((item) => ({
      field: String(item && item.field || '').slice(0, 80),
      targetTab: String(item && item.targetTab || '').slice(0, 80),
      tabRead: Boolean(item && item.tabRead),
      issueKind: String(item && item.issueKind || '').slice(0, 80),
      action: String(item && item.action || '').slice(0, 120),
    })).filter((item) => item.field);
  }

  function loadInsights() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(INSIGHTS_KEY, null) : JSON.parse(localStorage.getItem(INSIGHTS_KEY) || 'null');
      return sanitizeInsights(saved);
    } catch (error) {
      return emptyInsights();
    }
  }

  function saveInsights() {
    try {
      state.insights = sanitizeInsights(state.insights);
      if (typeof GM_setValue === 'function') GM_setValue(INSIGHTS_KEY, state.insights);
      else localStorage.setItem(INSIGHTS_KEY, JSON.stringify(state.insights));
    } catch (error) {
      console.warn('PLM floating helper insights save failed:', error);
    }
  }

  function getProductTypeForInsight(data, extra) {
    const manualCategory = normalizeManualProductCategory(data && data.manualCategory);
    if (manualCategory) return manualCategory;
    if (isDowmooBrand(data)) return '\u73a9\u5177';
    if (data && data.aiProductType && !/^\u672a\u5206\u7c7b$/i.test(String(data.aiProductType))) return String(data.aiProductType);
    const text = [
      extra && extra.englishName,
      extra && extra.chineseName,
      data && data.name,
      data && data.netContent,
    ].filter(Boolean).join(' ');
    const ruleMatch = matchClassificationRules(data, state.classificationRules || [], 'category');
    if (ruleMatch && ruleMatch.label) return ruleMatch.label;
    if (/(?:\u80f6\u56ca|capsule)\s*(?:\u9762\u971c|cream)|(?:\u9762\u971c|cream)\s*(?:\u80f6\u56ca|capsule)/i.test(text)) return '\u9762\u971c';
    if (/\u8f6f\u7cd6|gumm/i.test(text)) return '\u8f6f\u7cd6';
    if (/\u7cbe\u6cb9|oil/i.test(text)) return '\u7cbe\u6cb9';
    if (/\u9762\u971c|face\s*cream/i.test(text)) return '\u9762\u971c';
    if (/\u80f6\u56ca|capsule/i.test(text)) return '\u80f6\u56ca';
    if (/\u971c|cream/i.test(text)) return '\u971c\u7c7b';
    if (/\u9999\u6c34|perfume/i.test(text)) return '\u9999\u6c34';
    if (/\u73a9\u5177|toy|\u516c\u4ed4|\u634f\u634f/i.test(text)) return '\u73a9\u5177';
    return '\u672a\u5206\u7c7b';
  }

  function getClassificationText(data) {
    return [
      data && data.sku,
      data && data.brand,
      data && data.name,
      data && data.manualCategory,
      data && data.netContent,
      data && data.packageSizeLabel,
      data && data.packageSizeText,
      data && data.printSizeLabel,
      data && data.printSizeText,
      data && data.plmCategory,
      data && data.logoText,
      data && data.aiProductType,
      data && data.aiCategory,
      Array.isArray(data && data.aiPackageTypes) ? data.aiPackageTypes.join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function scheduleMagicUploadAccessRefresh(delay) {
    if (state.magicUploadAccessTimer) window.clearTimeout(state.magicUploadAccessTimer);
    state.magicUploadAccessTimer = window.setTimeout(() => {
      state.magicUploadAccessTimer = 0;
      refreshMagicUploadAccess();
    }, Math.max(0, Number(delay) || 0));
  }

  async function refreshMagicUploadAccess() {
    const name = findCurrentPlmUserName();
    if (!name) {
      if (!state.magicUploadAccessName) state.magicUploadAccessLoading = true;
      scheduleMagicUploadAccessRefresh(1500);
      return;
    }
    const hasCachedAccess = applyCachedFeatureAccess(name).magicUpload;
    let accessResolved = hasCachedAccess;
    state.magicUploadAccessName = name;
    state.magicUploadAccessLoading = !hasCachedAccess;
    if (state.view === 'home' || state.view === 'magicUpload') renderShell();
    try {
      const response = await cloudRequestWithRetry('/features/magic-upload?name=' + encodeURIComponent(name), { method: 'GET' }, { attempts: 3, baseDelayMs: 900 });
      if (state.magicUploadAccessName !== name) return;
      if (!response || typeof response.enabled !== 'boolean') throw new Error('权限响应格式异常');
      state.magicUploadAccessEnabled = response.enabled;
      cacheFeatureAccess(name, { magicUploadEnabled: response.enabled });
      accessResolved = true;
    } catch (error) {
      addLog('warn', '魔法上传权限检查失败', formatErrorMessage(error));
      if (!accessResolved && ['home', 'magicUpload'].includes(state.view)) offerNetworkDiagnostics('魔法上传权限获取失败，功能暂不可用', error);
    } finally {
      state.magicUploadAccessLoading = !accessResolved;
      if (state.view === 'home' || state.view === 'magicUpload') renderShell();
    }
  }

  function normalizeManualProductCategory(value) {
    const text = String(value || '').replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || /^(?:未设置|自动识别|未分类)$/i.test(text)) return '';
    if (/玩具/i.test(text)) return '玩具';
    if (/食品/i.test(text)) return '食品';
    return text.slice(0, 60);
  }

  function getDisplayedProductCategory(data, editing) {
    if (!data) return '';
    const manualCategory = normalizeManualProductCategory(data.manualCategory);
    if (manualCategory) return manualCategory;
    const automaticCategory = String(data.aiProductType || data.aiCategory || data.productType || data.category || '').trim();
    if (automaticCategory && !/^\u672a\u5206\u7c7b$/i.test(automaticCategory)) return automaticCategory;
    const inferred = getProductTypeForInsight(data, null);
    return inferred && !/^\u672a\u5206\u7c7b$/i.test(inferred) ? inferred : (editing ? '' : '未分类');
  }

  function normalizeRuleKeywords(value) {
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return normalizeRuleKeywords(parsed);
      } catch (error) {
        return value.split(/[,，/、\s]+/).map((item) => item.trim()).filter(Boolean);
      }
    }
    return [];
  }

  function matchClassificationRules(data, rules, kind) {
    const text = getClassificationText(data);
    if (!text) return null;
    const scored = (Array.isArray(rules) ? rules : [])
      .filter((rule) => !kind || rule.kind === kind)
      .map((rule) => {
        const keywords = normalizeRuleKeywords(rule.keywords);
        const negative = normalizeRuleKeywords(rule.negativeKeywords);
        if (!keywords.length || negative.some((kw) => kw && text.includes(kw.toLowerCase()))) return null;
        const hits = keywords.filter((kw) => kw && text.includes(kw.toLowerCase()));
        if (!hits.length) return null;
        const confidence = Number(rule.confidence || 0.65) || 0.65;
        return { rule, hits, score: hits.reduce((sum, kw) => {
          const length = Math.min(String(kw).length, 24);
          return sum + length * length;
        }, 0) * confidence };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    return scored[0] ? { ...scored[0].rule, hits: scored[0].hits, score: scored[0].score } : null;
  }

  function matchPackageTypeRules(data, rules) {
    const matches = (Array.isArray(rules) ? rules : [])
      .filter((rule) => rule.kind === 'packageType')
      .map((rule) => matchClassificationRules(data, [rule], 'packageType'))
      .filter(Boolean)
      .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));
    const seen = new Set();
    return matches.filter((item) => {
      const label = item.label || '';
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    }).slice(0, 6);
  }

  function applyClassificationRulesToLocalCache(rules) {
    const usable = Array.isArray(rules) ? rules : [];
    if (!usable.length) throw new Error('\u6682\u65e0\u53ef\u7528\u5206\u7c7b\u89c4\u5219');
    let total = 0;
    let updated = 0;
    const now = new Date().toLocaleString();
    (state.index || []).forEach((item) => {
      const sku = item && item.sku;
      if (!sku) return;
      const data = normalizeData(loadData(sku) || item);
      if (!data || !data.sku) return;
      const explicitType = String(data.aiProductType || data.aiCategory || '').trim();
      if (explicitType && !/^\u672a\u5206\u7c7b$/i.test(explicitType)) return;
      total += 1;
      const category = matchClassificationRules(data, usable, 'category');
      const packageTypes = matchPackageTypeRules(data, usable);
      const next = { ...data };
      let changed = false;
      if (category && category.label && next.aiProductType !== category.label) {
        next.aiProductType = category.label;
        next.aiCategory = category.label;
        next.aiCategoryRule = category.ruleId || '';
        changed = true;
      }
      const packageLabels = packageTypes.map((rule) => rule.label).filter(Boolean);
      if (packageLabels.length && JSON.stringify(next.aiPackageTypes || []) !== JSON.stringify(packageLabels)) {
        next.aiPackageTypes = packageLabels;
        next.aiPackageRuleIds = packageTypes.map((rule) => rule.ruleId || '').filter(Boolean);
        changed = true;
      }
      if (changed) {
        next.aiClassifiedAt = now;
        saveDataDirect(sku, normalizeData(next));
        upsertIndex(next);
        updated += 1;
      }
    });
    saveIndex();
    if (state.selectedSku) {
      const current = loadData(state.selectedSku);
      if (current) state.data = normalizeData(current);
    }
    return { total, updated };
  }

  function formatClassificationRulesForCopy(rules) {
    const lines = ['类型\t名称\t置信度\t关键词\t排除词\t样例\t来源\t更新时间'];
    (Array.isArray(rules) ? rules : []).forEach((rule) => {
      lines.push([
        rule.kind === 'packageType' ? '包材' : '品类',
        rule.label || '',
        rule.confidence || '',
        normalizeRuleKeywords(rule.keywords).join('/'),
        normalizeRuleKeywords(rule.negativeKeywords).join('/'),
        normalizeRuleKeywords(rule.examples).join('/'),
        rule.source || '',
        rule.updatedAt || '',
      ].join('\t'));
    });
    return lines.join('\n');
  }

  function compactSizeForInsight(parts, fallback) {
    const text = Array.isArray(parts) ? parts.filter(Boolean).join('x') : '';
    return text || String(fallback || '');
  }

  function recordCommerceInsight(data, extra, options) {
    if (!data || !data.sku) return;
    const insight = state.insights || emptyInsights();
    const productType = getProductTypeForInsight(data, extra);
    const item = {
      sku: data.sku,
      brand: data.brand || '',
      name: data.name || (extra && extra.chineseName) || '',
      productType,
      price: String(options && options.price || ''),
      packQty: String(options && options.packQty || ''),
      packageSize: compactSizeForInsight([data.packageLength, data.packageWidth, data.packageHeight], data.packageSizeText),
      productSize: compactSizeForInsight([data.productLength, data.productWidth, data.productHeight], data.productNums),
      source: options && options.source || 'manual',
      fileName: options && options.fileName || '',
      recordedAt: new Date().toLocaleString(),
      recordedAtMs: Date.now(),
    };
    insight.priceHistory = [item].concat(insight.priceHistory || []).slice(0, 1000);
    const stat = insight.typeStats[productType] || { count: 0 };
    insight.typeStats[productType] = {
      count: Number(stat.count || 0) + 1,
      latestSku: data.sku,
      latestPrice: item.price,
      latestAt: item.recordedAt,
    };
    state.insights = insight;
    saveInsights();
    addLog('success', '\u5df2\u8bb0\u5f55\u4ef7\u683c/\u7c7b\u578b\u5386\u53f2', data.sku + ' ' + productType + ' ' + item.price);
    const { packQty, ...cloudItem } = item;
    syncInsightEvent('price', cloudItem);
    queueCloudBackup();
  }

  function recordDataQuality(data, source) {
    if (!data || !data.sku) return;
    const missing = getMissingFieldsForData(data);
    if (!missing.length) return;
    const seen = [
      data.seenMaterial ? '\u7269\u6599' : '',
      data.seenProduct ? '\u4ea7\u54c1' : '',
    ].filter(Boolean).join('/');
    const issueMeta = getDataQualityIssueMeta(data, missing);
    const item = {
      sku: data.sku,
      brand: data.brand || '',
      name: data.name || '',
      missing,
      seen,
      issueKind: issueMeta.kind,
      readiness: issueMeta.readiness,
      diagnosticAttempt: issueMeta.diagnosticAttempt,
      fieldDiagnostics: issueMeta.fieldDiagnostics,
      source: source || 'scan',
      recordedAt: new Date().toLocaleString(),
      recordedAtMs: Date.now(),
    };
    const insight = state.insights || emptyInsights();
    const exists = (insight.dataIssues || []).some((old) => old.sku === item.sku && old.missing.join(',') === item.missing.join(',') && Date.now() - Number(old.recordedAtMs || 0) < 10 * 60 * 1000);
    if (!exists) {
      insight.dataIssues = [item].concat(insight.dataIssues || []).slice(0, 1000);
      state.insights = insight;
      saveInsights();
      addLog('warn', '\u6570\u636e\u7f3a\u5931', data.sku + ' \u7f3a\uff1a' + missing.join('\u3001') + (seen ? ' / \u5df2\u8bfb\uff1a' + seen : '') + ' / ' + issueMeta.kind);
      syncInsightEvent('issue', {
        ...item,
        missingFields: item.missing,
        diagnosticAttempt: item.diagnosticAttempt,
        fieldDiagnostics: item.fieldDiagnostics,
      });
    }
  }

  function getMissingFieldsForData(data) {
    const missing = [];
    if (!data) return missing;
    if (!data.brand) missing.push('\u54c1\u724c');
    if (!data.name) missing.push('\u5546\u54c1\u540d\u79f0');
    if (!data.packageSizeText && !(data.packageLength && data.packageWidth && data.packageHeight)) missing.push('\u5305\u88c5\u5c3a\u5bf8');
    if (!data.printSizeText) missing.push('\u5370\u5237\u5c3a\u5bf8');
    if (!shouldOmitToyProductSize(data) && (!data.productLength || !data.productWidth || !data.productHeight)) missing.push('\u4ea7\u54c1\u5c3a\u5bf8');
    if (!data.netContent) missing.push('\u51c0\u542b\u91cf');
    if (!data.grossWeight) missing.push('\u6bdb\u91cd');
    if (data.seenProduct && !getProductThumbUrl(data)) missing.push('SKU\u56fe');
    return missing;
  }

  function getDataQualityIssueMeta(data, missing) {
    const readTabs = [
      data.seenMaterial ? '\u7269\u6599\u6e05\u5355' : '',
      data.seenProduct ? '\u4ea7\u54c1\u4fe1\u606f' : '',
    ].filter(Boolean);
    const allCoreTabsRead = Boolean(data.seenMaterial && data.seenProduct);
    const materialFields = ['\u5305\u88c5\u5c3a\u5bf8', '\u5370\u5237\u5c3a\u5bf8', '\u51c0\u542b\u91cf'];
    const productFields = ['\u4ea7\u54c1\u5c3a\u5bf8', '\u6bdb\u91cd'];
    const productAssetFields = ['SKU\u56fe'];
    const projectFields = ['\u54c1\u724c', '\u5546\u54c1\u540d\u79f0'];
    const missingMaterial = missing.some((field) => materialFields.includes(field));
    const missingProduct = missing.some((field) => productFields.includes(field));
    const missingProductAsset = missing.some((field) => productAssetFields.includes(field));
    const missingProject = missing.some((field) => projectFields.includes(field));
    const targetTabUnread = (missingMaterial && !data.seenMaterial) || ((missingProduct || missingProductAsset) && !data.seenProduct);
    let kind = '\u53ef\u80fd PLM \u7a7a\u503c';
    if (targetTabUnread || !readTabs.length) {
      kind = '\u9875\u9762\u672a\u8bfb\u5b8c';
    } else if (missingProject || (missingMaterial && data.seenMaterial) || ((missingProduct || missingProductAsset) && data.seenProduct) || allCoreTabsRead) {
      kind = '\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790';
    }
    const diagnosticAttempt = sanitizeMissingDiagnostic(data.lastMissingDiagnostic);
    const fieldDiagnostics = missing.map((field) => buildFieldDiagnostic(data, field, diagnosticAttempt));
    return {
      kind,
      readiness: (readTabs.length ? '\u5df2\u8bfb\u9875\u7b7e\uff1a' + readTabs.join('/') : '\u672a\u8bfb\u5230\u6838\u5fc3\u9875\u7b7e') + formatDiagnosticReadinessSuffix(diagnosticAttempt),
      diagnosticAttempt,
      fieldDiagnostics,
    };
  }

  function buildFieldDiagnostic(data, field, diagnosticAttempt) {
    const targetTab = getMissingFieldTargetTab(field);
    const tabRead = targetTab === '\u9879\u76ee\u8be6\u60c5'
      ? Boolean(data.sku)
      : (targetTab === '\u7269\u6599\u6e05\u5355'
      ? Boolean(data.seenMaterial)
      : (targetTab === '\u4ea7\u54c1\u4fe1\u606f' ? Boolean(data.seenProduct) : false));
    const issueKind = tabRead ? '\u9875\u9762\u5df2\u8bfb\u4f46\u672a\u89e3\u6790' : '\u9875\u9762\u672a\u8bfb\u5b8c';
    const retryText = formatFieldRetryAction(field, diagnosticAttempt);
    return {
      field,
      targetTab,
      tabRead,
      issueKind,
      action: (tabRead
        ? '\u8865\u5145\u201c' + field + '\u201d\u7684\u9009\u62e9\u5668\u6216\u89e3\u6790\u89c4\u5219'
        : '\u5148\u68c0\u67e5\u201c' + (targetTab || '\u5bf9\u5e94') + '\u201d\u533a\u57df\u662f\u5426\u6210\u529f\u6253\u5f00\u5e76\u52a0\u8f7d') + retryText,
    };
  }

  function sanitizeMissingDiagnostic(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      status: String(source.status || '').slice(0, 40),
      reason: String(source.reason || '').slice(0, 160),
      beforeMissing: Array.isArray(source.beforeMissing) ? source.beforeMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      afterMissing: Array.isArray(source.afterMissing) ? source.afterMissing.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      fixed: Array.isArray(source.fixed) ? source.fixed.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 20) : [],
      tabs: Array.isArray(source.tabs) ? source.tabs.map((text) => String(text || '').slice(0, 80)).filter(Boolean).slice(0, 8) : [],
      attempts: sanitizeDiagnosticAttempts(source.attempts),
      elapsedMs: Number(source.elapsedMs || 0) || 0,
      at: String(source.at || '').slice(0, 80),
    };
  }

  function formatDiagnosticReadinessSuffix(diagnostic) {
    if (!diagnostic || !diagnostic.status) return '';
    const parts = ['\u4e8c\u6b21\u8bfb\u53d6\uff1a' + diagnostic.status];
    if (diagnostic.tabs && diagnostic.tabs.length) parts.push('\u9875\u7b7e ' + diagnostic.tabs.join('/'));
    if (diagnostic.attempts && diagnostic.attempts.length) parts.push('\u5c1d\u8bd5 ' + diagnostic.attempts.map((item) => item.tab + 'x' + item.count).join('/'));
    if (diagnostic.elapsedMs) parts.push(trimNumber(diagnostic.elapsedMs / 1000) + 's');
    if (diagnostic.reason) parts.push(diagnostic.reason);
    return ' / ' + parts.join(' / ');
  }

  function formatFieldRetryAction(field, diagnostic) {
    if (!diagnostic || !diagnostic.status) return '';
    if (diagnostic.fixed && diagnostic.fixed.includes(field)) return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\u5df2\u8865\u5230';
    if (diagnostic.afterMissing && diagnostic.afterMissing.includes(field)) {
      return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\u540e\u4ecd\u7f3a\uff1a' + (diagnostic.reason || diagnostic.status);
    }
    return '\uff1b\u4e8c\u6b21\u8bfb\u53d6\uff1a' + diagnostic.status;
  }

  function getMissingFieldTargetTab(field) {
    if (field === '\u5305\u88c5\u5c3a\u5bf8' || field === '\u5370\u5237\u5c3a\u5bf8' || field === '\u51c0\u542b\u91cf') return '\u7269\u6599\u6e05\u5355';
    if (field === '\u54c1\u724c' || field === '\u5546\u54c1\u540d\u79f0') return '\u9879\u76ee\u8be6\u60c5';
    if (field === '\u4ea7\u54c1\u5c3a\u5bf8' || field === '\u6bdb\u91cd' || field === 'SKU\u56fe') return '\u4ea7\u54c1\u4fe1\u606f';
    return '';
  }

  function normalizeFieldLabel(text) {
    return compactLabel(text).replace(/[:\uff1a]\s*$/g, '').trim();
  }

  function loadIndex() {
    try {
      if (typeof GM_getValue === 'function') {
        const value = GM_getValue(STORAGE_INDEX_KEY, []);
        return Array.isArray(value) ? value : [];
      }
      const raw = localStorage.getItem(STORAGE_INDEX_KEY);
      const value = raw ? JSON.parse(raw) : [];
      return Array.isArray(value) ? value : [];
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

  function sortSkuListItems(items) {
    const sort = getSkuListSort();
    // The index is deliberately a lightweight projection of each cached SKU and
    // already contains every field needed for list sorting. Reading every full
    // record here makes a single render perform hundreds of synchronous
    // GM_getValue/localStorage calls and blocks the first visual response.
    const records = (items || []).map((item, index) => ({ item, index, record: item || {} }));
    const time = (record) => {
      const assigned = parseSkuListTime(record.designAssignedAt);
      const acquired = [record.acquiredAtMs, record.fetchedAtMs, record.listPrefetchedAtMs, record.updatedAtMs, record.firstSeenAtMs, record.listPrefetchedAt, record.updatedAt, record.createdAt].map(parseSkuListTime).find((value) => value > 0) || 0;
      // Manually added SKUs do not have a design-assignment timestamp, so
      // fall back to their local acquisition time in the assignment view.
      return sort === 'acquired' ? acquired : (assigned || acquired);
    };
    return records.map((entry) => ({ ...entry, time: time(entry.record) })).sort((a, b) => {
      if (a.item.pinned && b.item.pinned) return (a.item.pinOrder || 0) - (b.item.pinOrder || 0);
      if (a.item.pinned) return -1;
      if (b.item.pinned) return 1;
      if (a.time !== b.time) return b.time - a.time;
      return a.index - b.index;
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
    const old = state.index.find((entry) => entry.sku === data.sku);
    if (old && old.pinned) {
      item.pinned = true;
      item.pinOrder = old.pinOrder || Date.now();
    }
    state.index = state.index.filter((entry) => entry.sku !== data.sku);
    state.index.unshift(item);
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
