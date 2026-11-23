
  function syncLedgerSurfaceBridge(panel) {
    const surface = panel && panel.querySelector('.pfh-detail');
    if (!surface) return;
    // Temporary bridge for old hosted base CSS that forces the detail frame.
    // Match ledger-workspace.css and restore original inline values on exit.
    const values = { border: '0', 'border-radius': '0', background: 'transparent', 'box-shadow': 'none' };
    if (state.view === 'ledger') {
      if (!surface.pfhLedgerSurfaceStyle) surface.pfhLedgerSurfaceStyle = Object.keys(values).map(key => [key, surface.style.getPropertyValue(key), surface.style.getPropertyPriority(key)]);
      Object.entries(values).forEach(([key, value]) => surface.style.setProperty(key, value, 'important'));
    } else if (surface.pfhLedgerSurfaceStyle) {
      surface.pfhLedgerSurfaceStyle.forEach(([key, value, priority]) => {
        if (value) surface.style.setProperty(key, value, priority); else surface.style.removeProperty(key);
      });
      delete surface.pfhLedgerSurfaceStyle;
    }
  }

  function renderLedger(panel) {
    const list = panel.querySelector('.pfh-list');
    const detail = panel.querySelector('.pfh-detail');
    const records = getLedgerRecordsForMonth(state.ledgerView, getCurrentLedgerMonth());
    state.ledgerMenuSku = '';
    state.ledgerMenuDate = '';
    closeRenderedLedgerMenus(panel, null);
    resetLedgerTableSkuDrag(false);
    if (list) list.innerHTML = '';
    detail.classList.remove('is-loading');
    detail.innerHTML = ledgerViewHtml(records);
    setupLedgerTabFusion(detail);
  }

  function renderLedgerTabContent(panel) {
    const detail = panel && panel.querySelector('.pfh-detail');
    const page = detail && detail.querySelector('.pfh-ledger-page');
    const tabs = page && page.querySelector('.pfh-ledger-tabs');
    const contentAnchor = page && (page.querySelector('.pfh-ledger-content-anchor') || page.querySelector('.pfh-ledger-tabs-shell') || tabs);
    if (!detail || !page || !tabs || !contentAnchor) return false;
    state.ledgerMenuSku = '';
    state.ledgerMenuDate = '';
    closeRenderedLedgerMenus(panel, null);
    resetLedgerTableSkuDrag(false);
    const records = getLedgerRecordsForMonth(state.ledgerView, getCurrentLedgerMonth());
    const template = document.createElement('template');
    template.innerHTML = ledgerViewContentHtml(records);
    const nextContent = Array.from(template.content.childNodes);
    if (!nextContent.length) return false;
    const mode = state.ledgerView === 'trash' ? 'trash' : (state.ledgerView === 'finalized' ? 'finalized' : 'design');
    const month = getCurrentLedgerMonth();
    const currentDetailScroll = detail.querySelector('.pfh-detail-scroll');
    if (currentDetailScroll) currentDetailScroll.setAttribute('data-scroll-context', ['ledger', mode, month].join('|'));
    const currentHeroNote = page.querySelector('[data-ledger-hero-note]');
    if (currentHeroNote) currentHeroNote.textContent = mode === 'trash'
      ? '移除记录会阻止 PLM 再次自动加入，恢复后才解除拦截。'
      : (mode === 'finalized' ? '默认只显示图包未完成；选中多个产品后，点击纸盒、标签或图包会同步选中产品，图包完成后自动收纳。' : '按设计分配日期整理出图，定稿后继续跟纸盒、标签和图包。');
    const currentRecordCount = page.querySelector('[data-ledger-record-count]');
    if (currentRecordCount) currentRecordCount.textContent = records.length + ' 条 / ' + month;
    tabs.setAttribute('data-active-tab', mode);
    const nextActiveAction = mode === 'trash' ? 'ledger-view-trash' : (mode === 'finalized' ? 'ledger-view-finalized' : 'ledger-view-design');
    tabs.querySelectorAll('button[data-action^="ledger-view-"]').forEach((button) => {
      const active = button.getAttribute('data-action') === nextActiveAction;
      button.classList.toggle('active', active);
      button.classList.toggle('is-active', active);
    });
    const trashEntry = page.querySelector('.pfh-ledger-trash-entry');
    if (trashEntry) {
      trashEntry.classList.toggle('is-active', mode === 'trash');
      trashEntry.setAttribute('aria-current', mode === 'trash' ? 'page' : 'false');
    }
    if (contentAnchor.classList.contains('pfh-ledger-content-anchor')) {
      while (contentAnchor.firstChild) contentAnchor.removeChild(contentAnchor.firstChild);
      nextContent.forEach((node) => contentAnchor.appendChild(node));
    } else {
      while (contentAnchor.nextElementSibling) contentAnchor.nextElementSibling.remove();
      nextContent.forEach((node) => page.appendChild(node));
    }
    const indicator = tabs.querySelector('.pfh-ledger-tab-indicator');
    const activeButton = tabs.querySelector('button.is-active,button.active');
    if (indicator && activeButton) {
      alignLedgerTabIndicator(tabs, indicator, activeButton);
    }
    return true;
  }

  function alignLedgerTabIndicator(tabs, indicator, button) {
    if (!tabs || !indicator || !button) return;
    indicator.style.setProperty('left', (button.offsetLeft - tabs.clientLeft) + 'px', 'important');
    indicator.style.setProperty('width', button.offsetWidth + 'px', 'important');
    indicator.style.setProperty('top', (button.offsetTop - tabs.clientTop) + 'px', 'important');
    indicator.style.setProperty('height', button.offsetHeight + 'px', 'important');
    indicator.style.setProperty('bottom', 'auto', 'important');
  }

  function setupLedgerTabFusion(detail) {
    if (state.ledgerTabResizeObserver) {
      state.ledgerTabResizeObserver.disconnect();
      state.ledgerTabResizeObserver = null;
    }
    const tabs = detail && detail.querySelector('.pfh-ledger-tabs');
    const indicator = tabs && tabs.querySelector('.pfh-ledger-tab-indicator');
    if (!tabs || !indicator) return;
    const indicatorTransition = 'left .6s cubic-bezier(.25,1.2,.35,1),width .6s cubic-bezier(.25,1.2,.35,1)';
    indicator.style.setProperty('transition', indicatorTransition, 'important');
    const buttons = Array.from(tabs.querySelectorAll('button[data-action^="ledger-view-"]'));
    const moveIndicator = (button) => {
      alignLedgerTabIndicator(tabs, indicator, button);
    };
    buttons.forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        button.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100) + '%');
        button.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100) + '%');
      });
      button.addEventListener('click', () => {
        buttons.forEach((item) => item.classList.remove('active', 'is-active'));
        button.classList.add('active', 'is-active');
        const action = button.getAttribute('data-action') || '';
        tabs.setAttribute('data-active-tab', action === 'ledger-view-finalized' ? 'finalized' : (action === 'ledger-view-trash' ? 'trash' : 'design'));
        moveIndicator(button);
      });
    });
    const activeButton = tabs.querySelector('button.is-active,button.active') || buttons[0];
    if (!activeButton) return;
    moveIndicator(activeButton);
    if (typeof ResizeObserver === 'function') {
      state.ledgerTabResizeObserver = new ResizeObserver(() => {
        const button = tabs.querySelector('button.is-active,button.active') || buttons[0];
        moveIndicator(button);
      });
      state.ledgerTabResizeObserver.observe(tabs);
      buttons.forEach((button) => state.ledgerTabResizeObserver.observe(button));
    }
  }

  function skuDataChangeAlertHtml(data) {
    const changes = getVisibleStoredDataChanges(data).slice(0, 8);
    if (!changes.length) return '';
    const rows = changes.map((change) => '<div class="pfh-data-change-item"><span>' + escapeHtml(change.label) + '</span><div class="pfh-data-change-values"><del>' + escapeHtml(change.before || '未识别') + '</del><i>→</i><ins>' + escapeHtml(change.after || '已清空') + '</ins></div></div>').join('');
    return '<div class="pfh-data-change-alert" role="status"><div class="pfh-data-change-head"><strong>SKU 数据有更新，请核对</strong><div class="pfh-data-change-actions"><button type="button" data-action="sku-data-log-open">查看更新日志</button><button type="button" data-action="sku-changes-ack">已核对</button></div></div><div class="pfh-data-change-list">' + rows + '</div></div>';
  }

  function skuDataLogTriggerHtml(data) {
    const count = getStoredDataUpdateLogs(data).length;
    return '<button type="button" class="pfh-sku-data-log-trigger pfh-history-text-action" data-action="sku-data-log-open"' + (!count ? ' data-empty="true"' : '') + '><span>数据更新日志</span>' + (count ? '<em>' + count + '</em>' : '') + '</button>';
  }

  function materialDimensionUnitAlertHtml(data) {
    const issues = normalizeMaterialDimensionUnitIssues(data && data.materialDimensionUnitIssues, data);
    const developer = getMaterialDimensionIssueDeveloper(data);
    const messages = [];
    if (issues.package) {
      messages.push({
        label: '纸盒',
        text: '纸盒尺寸单位翻车，cm 打成 m，这纸盒能装下整间仓库，速找开发' + developer + '纠错。',
        focusKey: 'packageSizeText',
      });
    }
    if (issues.print) {
      messages.push({
        label: '标签',
        text: '标签尺寸直接离谱，cm 打成 m，标签大到能当海报，赶紧揪开发' + developer + '改尺寸。',
        focusKey: 'printSizeText',
      });
    }
    if (!messages.length) return '';
    const focusKey = messages[0].focusKey;
    const rows = messages.map((item) => '<div class="pfh-material-unit-item"><b>' + escapeHtml(item.label) + '</b><span>' + escapeHtml(item.text) + '</span></div>').join('');
    return '<div class="pfh-material-unit-alert" role="alert"><div class="pfh-material-unit-head"><strong>发现尺寸单位异常</strong><button type="button" data-action="sku-edit-open" data-focus-key="' + escapeHtml(focusKey) + '">点击纠错</button></div><div class="pfh-material-unit-list">' + rows + '</div></div>';
  }

  function getActiveApiStatusSku() {
    return String(state.selectedSku || (state.data && state.data.sku) || '');
  }

  function apiReadStatusHtml() {
    const status = state.apiReadStatus || {};
    if (!status.sku || status.sku !== getActiveApiStatusSku() || status.phase === 'idle') return '';
    const phase = status.phase === 'error' ? 'error' : (status.phase === 'success' ? 'success' : 'loading');
    const icon = phase === 'loading'
      ? '<i class="pfh-loading-ring" aria-hidden="true"></i>'
      : '<span class="pfh-api-status-icon" aria-hidden="true">' + (phase === 'error' ? '!' : '✓') + '</span>';
    return '<span class="pfh-api-status is-' + phase + '" role="status" aria-live="polite">' + icon + '<span>' + escapeHtml(status.message || '正在读取 PLM 数据') + '</span></span>';
  }

  function updateApiReadStatusView() {
    const panel = document.getElementById(PANEL_ID);
    const note = panel && panel.querySelector('.pfh-note');
    if (!note) return;
    const current = note.querySelector('.pfh-api-status');
    const html = apiReadStatusHtml();
    if (current) {
      if (html) {
        const next = document.createElement('template');
        next.innerHTML = html;
        reconcileAssistantPanelNode(current, next.content.firstElementChild);
      }
      else current.remove();
      return;
    }
    if (html) {
      const button = note.querySelector('button');
      if (button) button.insertAdjacentHTML('beforebegin', html);
    }
  }

  function setApiReadStatus(sku, phase, message) {
    const normalizedSku = String(sku || '');
    if (!normalizedSku) return;
    window.clearTimeout(state.apiReadStatusTimer);
    state.apiReadStatus = { sku: normalizedSku, phase: phase || 'loading', message: message || '' };
    updateApiReadStatusView();
    if (phase === 'success' || phase === 'error') {
      state.apiReadStatusTimer = window.setTimeout(() => {
        if (state.apiReadStatus && state.apiReadStatus.sku === normalizedSku) {
          state.apiReadStatus = { sku: '', phase: 'idle', message: '' };
          updateApiReadStatusView();
        }
      }, 2600);
    }
  }

  function hasUsableApiData(data) {
    return Boolean(data && (data.packageSizeText || data.printSizeText || data.hasInnerCard || data.netContent || data.grossWeight));
  }

  function hasApiResolvedFields(data) {
    return Boolean(data && Object.keys(normalizeApiFieldStates(data.apiFieldStates)).length);
  }

  function hasApiPackagingResult(data) {
    return Boolean(data && (hasUsableApiData(data) || hasApiResolvedFields(data)));
  }

  function getApiPackagingFieldStateKeys() {
    return ['material', 'accessories', 'materialSize', 'packageSize', 'packageLabel', 'packageCode', 'printSize', 'printLabel', 'printCode', 'netContent', 'grossWeight'];
  }

  function omitApiFieldStates(states, keys) {
    const omitted = new Set(keys || []);
    return Object.keys(normalizeApiFieldStates(states)).reduce((result, key) => {
      if (!omitted.has(key)) result[key] = states[key];
      return result;
    }, {});
  }

  function getDataChangeLabels(previous, next) {
    return collectTrackedDataChanges(previous, next, { changeSource: 'PLM 数据服务' })
      .map((item) => item.label)
      .filter((label, index, labels) => label && labels.indexOf(label) === index);
  }

  function showApiDataChangeNotice(sku, previous, next) {
    const labels = getDataChangeLabels(previous, next);
    const key = String(sku || '') + '|' + labels.join('、') + '|' + ['packageCode', 'printCode', 'packageSizeText', 'printSizeText', 'netContent', 'grossWeight'].map((field) => compactText(next && next[field])).join('|');
    if (state.apiLastNoticeKey === key && Date.now() - state.apiLastNoticeAt < 5000) return labels;
    state.apiLastNoticeKey = key;
    state.apiLastNoticeAt = Date.now();
    if (labels.length) {
      const suffix = labels.length > 4 ? '等' : '';
      showToast('PLM 已更新 ' + sku + '：' + labels.slice(0, 4).join('、') + suffix);
    } else {
      showToast('PLM 已读取 ' + sku + '，历史数据无变化', { quiet: true });
    }
    return labels;
  }

  function renderLoadingDetail(detail, statusText) {
    const openingDetail = state.openingProjectDetail || statusText === L.openingDetail;
    const loadingTip = detail && detail.firstElementChild && detail.firstElementChild.classList.contains('pfh-loading-tip')
      ? detail.firstElementChild
      : null;
    if (loadingTip) {
      const label = loadingTip.querySelector(':scope > span');
      const tip = loadingTip.querySelector(':scope > strong');
      if (label) label.textContent = openingDetail ? '加载中' : '识别中';
      if (tip) tip.textContent = getCurrentLoadingTip();
      if (!detail.querySelector(':scope > .pfh-detail-scroll')) detail.insertAdjacentHTML('beforeend', '<div class="pfh-detail-scroll"></div>');
      return;
    }
    detail.innerHTML = renderStatusHtml(statusText) + '<div class="pfh-detail-scroll"></div>';
  }

  function renderDetail(panel, statusText) {
    const detail = panel.querySelector('.pfh-detail');
    const data = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    const openingDetail = state.openingProjectDetail || statusText === L.openingDetail;
    const hasVisibleCopywriting = Boolean(state.copywritingMode && data && normalizeCopywritingRecord(data.copywriting) && normalizeCopywritingRecord(data.copywriting).fullText);
    const loading = openingDetail || state.copywritingLoading || (!hasVisibleCopywriting && (state.scanRunning || statusText === L.scanning || statusText === L.checkingMaterial));
    // Refreshing cached data is a background operation: the loading class dims
    // every section, making otherwise stable pictures visibly flash.
    detail.classList.toggle('is-loading', loading && (!data || openingDetail || state.copywritingLoading && !hasVisibleCopywriting));
    if (openingDetail) {
      const main = panel.querySelector('.pfh-main');
      if (main) main.classList.remove('is-home');
      renderLoadingDetail(detail, L.openingDetail);
      return;
    }
    if (!data) {
      if (loading) {
        const main = panel.querySelector('.pfh-main');
        if (main) main.classList.remove('is-home');
        renderLoadingDetail(detail, statusText);
      } else {
        detail.innerHTML = isWorkspaceSkuView() ? '<div class="pfh-empty">选择一个 SKU 查看详情；暂无产品时，可先添加 SKU。</div>' : homeViewHtml(statusText, null);
        if (state.workMode === 'product-development' && typeof productDevelopmentMountReviewEditorOverlay === 'function') productDevelopmentMountReviewEditorOverlay(panel);
      }
      return;
    }
    state.data = normalizeData(data);
    const main = panel.querySelector('.pfh-main');
    if (main) main.classList.remove('is-home');
    if (state.settings.designDevelopmentTabs === true && renderDesignDevelopmentDetail(panel, statusText)) return;
    if (state.copywritingMode) {
      updateAssistantDetailMarkup(detail, [
        '<div class="pfh-detail-scroll pfh-copywriting-scroll">',
        detailViewTabsHtml('copywriting'),
        productHeroSectionHtml(state.data, true),
        copywritingViewHtml(state.data),
        '</div>',
      ].join(''), String(state.data.sku || '') + '|copywriting');
      return;
    }
    updateAssistantDetailMarkup(detail, [
      renderStatusHtml(statusText),
      '<div class="pfh-detail-view-frame pfh-sku-detail-frame">',
      detailViewTabsHtml('detail'),
      productHeroSectionHtml(state.data, false),
      '<div class="pfh-detail-scroll pfh-sku-detail-content">',
      materialDimensionUnitAlertHtml(state.data),
      skuDataChangeAlertHtml(state.data),
      '<section class="pfh-section pfh-sku-info-section">',
      '<div class="pfh-info-grid">',
      materialSummaryCardHtml('package', state.data.packageSizeLabel || L.packageSize, state.data.packageSizeText || L.noPackage, state.data.packageCode),
      materialSummaryCardHtml('print', state.data.printSizeLabel || L.printSize, formatPrintSizeDisplay(state.data) || L.noPrint, state.data.printCode),
      accessoryCardsHtml(state.data),
      '</div>',
      '</section>',
      '<section class="pfh-section pfh-graphic-section"><div class="pfh-section-title pfh-graphic-title"><h3>' + escapeHtml(L.graphicSection) + '</h3>' + toyCopywritingButtonHtml(state.data) + excelTriggerHtml() + '</div>' + toyCopywritingFeedbackHtml(state.data),
      '<div class="pfh-graphic-table pfh-info-grid">',
      rowHtml('packageLength', L.cartonLength, state.data.packageLength || L.noDimension),
      rowHtml('productLength', state.data.isTubePrint ? L.tailSealLength : L.productLength, state.data.isTubePrint ? (state.data.productLength || L.noDimension) : (state.data.productLength || L.noDimension), { editable: state.data.isTubePrint }),
      rowHtml('packageWidth', L.cartonWidth, state.data.packageWidth || L.noDimension),
      rowHtml('productWidth', L.productWidth, state.data.productWidth || L.noDimension),
      rowHtml('packageHeight', L.cartonHeight, state.data.packageHeight || L.noDimension),
      rowHtml('productHeight', L.productHeight, state.data.productHeight || L.noDimension),
      rowHtml('netContent', L.netContent, state.data.netContent || L.unknown),
      rowHtml('grossWeight', L.grossWeight, state.data.grossWeight || L.unknown),
      '</div></section>',
      infringementSectionHtml(state.data),
      '</div></div>',
      '<div class="pfh-note"><span class="pfh-note-source">' + escapeHtml(state.data.updatedAt ? (L.updatedAt + ': ' + state.data.updatedAt) : '') + '</span>' + apiReadStatusHtml() + '<span class="pfh-note-toast" aria-live="polite"></span>' + skuDataLogTriggerHtml(state.data) + '<button type="button" data-action="refresh" title="' + escapeHtml(TOOLTIP.refresh) + '">' + iconHtml('refresh') + '</button></div>',
    ].join(''), String(state.data.sku || '') + '|detail');
  }

  function productHeroSectionHtml(data, copywritingMode) {
    const displayData = resolveProductDevelopmentSkuIdentity(data);
    if (copywritingMode) return copywritingHeroSectionHtml(displayData);
    const sku = String(data && data.sku || L.sku);
    const menuOpen = state.skuContextMenuSku === sku;
    const title = [displayData && displayData.brand, displayData && displayData.name].filter(Boolean).join(' ') || formatTitleMeta(data) || L.noDrawer;
    const priorityText = formatSkuDetailPriority(data && data.artPriority);
    const priorityClass = /^P0.*(?:紧急|urgent)/i.test(priorityText) ? ' is-p0-urgent' : (/^P0.*(?:当日|当天|today)/i.test(priorityText) ? ' is-p0-today' : (/^P0/i.test(priorityText) ? ' is-p0-urgent' : (/^P1/i.test(priorityText) ? ' is-p1' : '')));
    const designType = String(data && data.designType || '').trim() || '未分类';
    const developerName = extractDeveloperName(data && (data.developerName || data.developerText || ''));
    const referenceUrl = String(data && (data.referenceUrl || data.benchmarkLink) || '').trim();
    const referenceLabel = formatSkuDetailLinkLabel(referenceUrl);
    const referenceLink = referenceUrl
      ? (/^https?:\/\//i.test(referenceUrl)
        ? '<a class="pfh-detail-link-value" href="' + escapeHtml(referenceUrl) + '" target="_blank" rel="noopener noreferrer" data-reference-url="' + escapeHtml(referenceUrl) + '" title="左键打开链接；右键复制链接：' + escapeHtml(referenceUrl) + '">' + iconHtml('link') + '<span class="pfh-detail-link-text">' + escapeHtml(referenceLabel) + '</span></a>'
        : '<span class="pfh-detail-link-value" data-reference-url="' + escapeHtml(referenceUrl) + '" title="右键复制链接：' + escapeHtml(referenceUrl) + '">' + iconHtml('link') + '<span class="pfh-detail-link-text">' + escapeHtml(referenceLabel) + '</span></span>')
      : '';
    const metaHtml = '<div class="pfh-detail-card-meta">' +
      (priorityText ? '<span class="is-priority' + priorityClass + '" title="' + escapeHtml(priorityText) + '">' + iconHtml('warning') + '<span>' + escapeHtml(priorityText) + '</span></span>' : '') +
      '<span class="is-design-type" title="' + escapeHtml(designType) + '">' + iconHtml('tag') + '<span>' + escapeHtml(designType) + '</span></span>' +
      '</div>';
    const infoHtml = developerName || referenceLink
      ? '<div class="pfh-detail-card-info">' +
        (developerName ? '<span class="pfh-detail-developer-value" title="' + escapeHtml(developerName) + '">' + escapeHtml(developerName) + '</span>' : '') +
        referenceLink +
        '</div>'
      : '';
    const actions = '<div class="' + (isWorkspaceLayoutEnabled() ? 'pfh-workspace-detail-controls' : 'pfh-title-actions') + ' pfh-detail-card-actions">' +
      '<button type="button" class="pfh-detail-view-button pfh-title-open-detail" data-action="open-detail"><span>查看详情</span><span aria-hidden="true">›</span></button>' +
      '<div class="pfh-detail-secondary-actions">' +
        (state.skuEditMode
          ? '<button type="button" class="pfh-detail-edit-button pfh-title-open-detail is-primary" data-action="sku-edit-save">保存校准</button><button type="button" class="pfh-detail-more-button" data-action="sku-edit-cancel" aria-label="取消编辑">取消</button>'
          : '<button type="button" class="pfh-detail-edit-button pfh-title-open-detail" data-action="sku-edit-open" title="编辑数据" aria-label="编辑数据">' + iconHtml('edit') + '<span>编辑</span></button><button type="button" class="pfh-detail-more-button" data-action="sku-detail-more" data-sku="' + escapeHtml(sku) + '" aria-label="更多操作" aria-expanded="' + (menuOpen ? 'true' : 'false') + '"><span class="pfh-detail-more-dots"><i></i><i></i><i></i></span></button>') +
      '</div>' +
      '</div>';
    return '<section class="pfh-section pfh-file-section"><div class="pfh-product-hero"><div class="' + (isWorkspaceLayoutEnabled() ? 'pfh-workspace-detail-card' : 'pfh-title-meta pfh-sku-detail-card') + '">' +
      productThumbHtml(data) +
      '<div class="pfh-detail-card-content"><div class="pfh-detail-card-heading"><span class="pfh-detail-sku-badge" data-action="copy-sku" title="点击复制 SKU">' + iconHtml('tag') + '<span>' + escapeHtml(sku) + '</span></span><strong class="pfh-detail-product-title" data-action="copy-title-meta" title="' + escapeHtml(L.copyHint) + '">' + escapeHtml(title) + '</strong></div>' +
      metaHtml + infoHtml + '</div>' +
      actions +
      '</div></div></section>';
  }

  function copywritingHeroSectionHtml(data) {
    const sku = String(data && data.sku || L.sku);
    const imageUrl = getSkuListImageUrl(data);
    const heroThumb = imageUrl
      ? '<span class="pfh-parameter-hero-thumb"><img src="' + escapeHtml(imageUrl) + '" alt=""></span>'
      : '<span class="pfh-parameter-hero-thumb is-empty">' + escapeHtml(sku) + '</span>';
    const title = sku + ' 文案';
    const subtitle = [data && data.brand, data && data.name].filter(Boolean).join(' ') || L.noDrawer;
    return '<section class="pfh-section pfh-file-section pfh-copywriting-hero-section"><header class="pfh-parameter-hero pfh-copywriting-parameter-hero">' + heroThumb + '<div class="pfh-parameter-hero-copy"><small>COPYWRITING</small><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(subtitle) + '</p></div>' + copywritingHeroControlsHtml(data) + '</header></section>';
  }

  function copywritingCopyIconHtml() {
    return '<svg class="pfh-copywriting-copy-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';
  }

  function copywritingHeroControlsHtml(data) {
    const record = getCopywritingDisplayRecord(data);
    const reviewUnavailable = plmCopywritingFileReviewUnavailable(record);
    const view = state.copywritingView === 'full' ? 'full' : 'file';
    const visibleSections = record && record.sections ? record.sections.filter(isCopywritingFileViewSection) : [];
    const collapsed = Boolean(state.settings && state.settings.copywritingCollapsed);
    const collapseButton = view === 'file' && visibleSections.length
      ? '<button type="button" data-action="copywriting-toggle-collapse" aria-expanded="' + (collapsed ? 'false' : 'true') + '" title="' + (collapsed ? '展开全部文案' : '折叠全部文案') + '">' + (collapsed ? '展开文案' : '折叠文案') + '</button>'
      : '';
    return '<div class="pfh-copywriting-hero-controls"><label><span>查看方式</span><select class="pfh-copywriting-view-select" aria-label="选择文案查看方式">' +
      '<option value="file"' + (view === 'file' ? ' selected' : '') + '>文件视图</option>' +
      '<option value="full"' + (view === 'full' ? ' selected' : '') + '>全文视图</option>' +
      '</select></label>' +
      '<div class="pfh-copywriting-hero-action-row">' + collapseButton + '<button type="button" data-action="copywriting-refresh"' + (state.copywritingLoading || state.copywritingChecking ? ' disabled' : '') + '>' + iconHtml('refresh') + '重新获取</button>' +
      (record && record.fullText ? '<button type="button" data-action="copywriting-copy">' + copywritingCopyIconHtml() + '复制全文</button>' : '') +
      '<button type="button" data-action="copywriting-file-review"' + (reviewUnavailable ? ' disabled title="' + escapeHtml(reviewUnavailable) + '"' : '') + '>文件审核</button>' +
      '</div></div>';
  }

  function isCopywritingFileViewSection(section) {
    return Boolean(section && section.key !== 'directionsChinese');
  }

  function getInfringementImageUrls(data) {
    if (!data || data.infringementImageSource !== 'frontProductCopy') return [];
    const candidates = [
      ...(Array.isArray(data && data.infringementImageUrls) ? data.infringementImageUrls : []),
      data && data.infringementImageUrl,
    ];
    return Array.from(new Set(candidates.map((value) => normalizeApiAssetUrl(value) || String(value || '').trim()).filter(Boolean))).slice(0, 20);
  }

  function infringementSectionHtml(data) {
    const imageUrls = getInfringementImageUrls(data);
    const copywriting = String(data && data.infringementCopywriting || '').replace(/\r\n?/g, '\n').trim();
    const history = normalizeInfringementHistory(data && data.infringementHistory);
    if (!imageUrls.length && !copywriting && !history.length) return '';
    const historyButton = history.length
      ? '<button type="button" class="pfh-infringement-history-button pfh-history-text-action" data-action="infringement-history-open"><span>历史版本</span><em>' + history.length + '</em></button>'
      : '<span class="pfh-infringement-history-empty-label">暂未形成历史版本</span>';
    const imageHtml = imageUrls.length
      ? imageUrls.map((url, index) => '<button type="button" class="pfh-infringement-image-card" data-action="infringement-image-open" data-image-url="' + escapeHtml(url) + '" data-image-label="侵权图 ' + (index + 1) + '" aria-label="点击放大查看侵权图 ' + (index + 1) + '"><span class="pfh-infringement-image-media"><img src="' + escapeHtml(url) + '" alt="侵权图 ' + (index + 1) + '" loading="lazy"></span><span class="pfh-infringement-image-caption"><strong>侵权图 ' + String(index + 1).padStart(2, '0') + '</strong><small>点击放大查看</small></span></button>').join('')
      : '<div class="pfh-infringement-empty">当前版本未返回侵权图片</div>';
    const copywritingHtml = copywriting
      ? '<pre>' + escapeHtml(copywriting) + '</pre>'
      : '<div class="pfh-infringement-empty">当前版本未返回产品文案修改</div>';
    return '<section class="pfh-infringement-section"><div class="pfh-section-title pfh-infringement-title"><div class="pfh-infringement-title-copy"><h3>侵权图</h3></div><div class="pfh-infringement-title-actions">' + historyButton + '</div></div><div class="pfh-infringement-content"><div class="pfh-infringement-images"><div class="pfh-infringement-subhead"><strong>效果图制作参考</strong><span>' + imageUrls.length + ' 张</span></div>' + imageHtml + '</div><div class="pfh-infringement-copy"><div class="pfh-infringement-copy-head"><div><strong>产品文案修改</strong><small>保留 PLM 原始换行</small></div><span>当前版本</span></div>' + copywritingHtml + '</div></div></section>';
  }

  function closeInfringementImageViewer() {
    state.infringementImageViewer = null;
    const layer = document.getElementById(PANEL_ID + '-infringement-image-viewer');
    if (layer) layer.remove();
  }

  function openInfringementImageViewer(url, label) {
    const imageUrl = normalizeApiAssetUrl(url) || String(url || '').trim();
    if (!imageUrl) return;
    state.infringementImageViewer = { url: imageUrl, label: String(label || '侵权图') };
    renderInfringementImageViewer(ensurePanel());
    const close = document.querySelector('#' + PANEL_ID + '-infringement-image-viewer .pfh-infringement-image-viewer-close');
    if (close) close.focus();
  }

  function renderInfringementImageViewer(panel) {
    if (!panel) return;
    let layer = document.getElementById(PANEL_ID + '-infringement-image-viewer');
    if (state.view !== 'detail' || !state.infringementImageViewer) {
      if (layer) layer.remove();
      return;
    }
    const viewer = state.infringementImageViewer;
    if (!layer) {
      layer = document.createElement('div');
      layer.id = PANEL_ID + '-infringement-image-viewer';
      layer.className = 'pfh-infringement-image-viewer-layer';
      layer.setAttribute('data-action', 'infringement-image-viewer-close');
      layer.addEventListener('click', (event) => {
        const closeTarget = event.target && event.target.closest && event.target.closest('[data-action="infringement-image-viewer-close"]');
        if (event.target === layer || (closeTarget && closeTarget !== layer)) closeInfringementImageViewer();
      });
      layer.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeInfringementImageViewer();
      });
      document.documentElement.appendChild(layer);
    }
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:24px;background:rgba(18,15,30,.72);backdrop-filter:blur(8px);';
    layer.innerHTML = '<section class="pfh-infringement-image-viewer-dialog" role="dialog" aria-modal="true" aria-label="' + escapeHtml(viewer.label) + '" style="display:flex;width:min(1400px,calc(100vw - 48px));height:min(940px,calc(100vh - 48px));max-width:none;max-height:none;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.28);border-radius:18px;background:#fff;box-shadow:0 28px 90px rgba(0,0,0,.42)"><header class="pfh-infringement-image-viewer-head" style="display:flex;min-height:52px;align-items:center;justify-content:space-between;box-sizing:border-box;padding:10px 16px;border-bottom:1px solid #e9e6f2;background:#fff"><strong style="color:#302747;font-size:15px;line-height:1.4">' + escapeHtml(viewer.label) + '</strong><button type="button" class="pfh-infringement-image-viewer-close" data-action="infringement-image-viewer-close" aria-label="关闭图片预览" style="display:grid;width:34px;height:34px;place-items:center;padding:0;border:1px solid #ddd6ee;border-radius:10px;background:#f8f6fc;color:#655b76;font-size:24px;line-height:1;cursor:pointer">×</button></header><div class="pfh-infringement-image-viewer-stage" style="display:flex;min-width:0;min-height:0;flex:1 1 auto;align-items:center;justify-content:center;overflow:auto;padding:16px;background:#24212b"><img src="' + escapeHtml(viewer.url) + '" alt="' + escapeHtml(viewer.label) + '" loading="eager" decoding="async" style="display:block;width:100%;height:100%;object-fit:contain;box-shadow:0 12px 38px rgba(0,0,0,.28)"></div></section>';
  }

  function renderInfringementHistoryViewer(panel) {
    if (!panel) return;
    let layer = panel.querySelector('.pfh-infringement-history-layer');
    if (state.view !== 'detail' || !state.infringementHistoryOpen) {
      if (layer) layer.remove();
      return;
    }
    const rawData = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    if (!rawData) {
      if (layer) layer.remove();
      return;
    }
    const data = normalizeData(rawData);
    const history = normalizeInfringementHistory(data && data.infringementHistory).slice().reverse();
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-infringement-history-layer';
      layer.setAttribute('data-action', 'infringement-history-close');
      const full = panel.querySelector('.pfh-full');
      if (full) full.appendChild(layer);
      else panel.appendChild(layer);
    }
    const versionsHtml = history.length
      ? history.map((entry, index) => {
        const time = formatNotificationTime(entry.updatedAtMs || entry.updatedAt) || entry.updatedAt || '未知时间';
        const versionLabel = index === 0 ? '当前版本' : '历史版本 ' + String(history.length - index);
        const images = entry.imageUrls.map((url, imageIndex) => '<button type="button" class="pfh-infringement-history-image" data-action="infringement-image-open" data-image-url="' + escapeHtml(url) + '" data-image-label="' + escapeHtml('侵权图 · ' + versionLabel + ' · ' + (imageIndex + 1)) + '" aria-label="查看' + escapeHtml(versionLabel) + '侵权图"><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(versionLabel) + '侵权图" loading="lazy"></button>').join('');
        const copy = entry.copywriting
          ? '<pre>' + escapeHtml(entry.copywriting) + '</pre>'
          : '<span class="pfh-infringement-history-empty">该版本没有文案修改记录</span>';
        return '<article class="pfh-infringement-history-version' + (index === 0 ? ' is-current' : '') + '"><header><div><strong>' + escapeHtml(versionLabel) + '</strong><small>' + escapeHtml(time) + ' · ' + escapeHtml(entry.source || 'PLM 接口') + '</small></div><span>' + entry.imageUrls.length + ' 张图</span></header><div class="pfh-infringement-history-version-body">' + (images ? '<div class="pfh-infringement-history-images">' + images + '</div>' : '<div class="pfh-infringement-history-empty">该版本没有侵权图片</div>') + '<div class="pfh-infringement-history-copy"><strong>产品文案修改</strong>' + copy + '</div></div></article>';
      }).join('')
      : '<div class="pfh-infringement-history-empty pfh-infringement-history-empty-panel">还没有可对比的侵权图版本</div>';
    layer.innerHTML = '<section class="pfh-infringement-history-dialog" role="dialog" aria-modal="true" aria-label="侵权图历史版本"><header class="pfh-infringement-history-head"><div><small>VERSION HISTORY</small><h3>侵权图历史版本</h3><p>图片、修改文案和时间会按版本保留，便于后续核查。</p></div><button type="button" data-action="infringement-history-close" aria-label="关闭历史版本">×</button></header><div class="pfh-infringement-history-list">' + versionsHtml + '</div></section>';
  }

  function renderSkuDataLogViewer(panel) {
    if (!panel) return;
    let layer = panel.querySelector('.pfh-sku-data-log-layer');
    if (state.view !== 'detail' || !state.skuDataLogOpen) {
      if (layer) layer.remove();
      return;
    }
    const rawData = state.data || (state.selectedSku ? loadData(state.selectedSku) : null);
    if (!rawData) {
      if (layer) layer.remove();
      return;
    }
    const data = normalizeData(rawData);
    const logs = getStoredDataUpdateLogs(data).slice().reverse();
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'pfh-sku-data-log-layer';
      layer.setAttribute('data-action', 'sku-data-log-close');
      const full = panel.querySelector('.pfh-full');
      if (full) full.appendChild(layer);
      else panel.appendChild(layer);
    }
    const logsHtml = logs.length
      ? logs.map((log) => {
        const time = formatNotificationTime(log.changedAtMs || log.changedAt) || log.changedAt || '未知时间';
        const changes = log.changes.map((change) => '<div class="pfh-sku-data-log-change"><span>' + escapeHtml(change.label) + '</span><del>' + escapeHtml(change.before || '未识别') + '</del><i>→</i><ins>' + escapeHtml(change.after || '已清空') + '</ins></div>').join('');
        return '<article class="pfh-sku-data-log-entry"><header><div><strong>' + escapeHtml(log.source || '自动获取') + '</strong><small>' + escapeHtml(time) + '</small></div><span>' + log.changes.length + ' 项</span></header><div class="pfh-sku-data-log-changes">' + changes + '</div></article>';
      }).join('')
      : '<div class="pfh-sku-data-log-empty">暂无字段更新记录</div>';
    layer.innerHTML = '<section class="pfh-sku-data-log-dialog" role="dialog" aria-modal="true" aria-label="SKU 数据更新日志"><header class="pfh-sku-data-log-head"><div><small>DATA CHANGE LOG</small><h3>SKU 数据更新日志</h3><p>' + escapeHtml(data.sku || '') + ' · 保留最近 ' + DATA_UPDATE_LOG_LIMIT + ' 次更新</p></div><button type="button" data-action="sku-data-log-close" aria-label="关闭数据更新日志">×</button></header><div class="pfh-sku-data-log-list">' + logsHtml + '</div></section>';
  }

  function copywritingViewHtml(data) {
    const record = getCopywritingDisplayRecord(data);
    const view = state.copywritingView === 'full' ? 'full' : 'file';
    const visibleSections = record && record.sections ? record.sections.filter(isCopywritingFileViewSection) : [];
    const collapsed = view === 'file' && visibleSections.length > 0 && Boolean(state.settings && state.settings.copywritingCollapsed);
    if (state.copywritingLoading && !(record && record.fullText)) {
      return '<section class="pfh-copywriting-page is-loading"><div class="pfh-copywriting-empty"><span class="pfh-loading-ring" aria-hidden="true"></span><strong>正在读取产品文案</strong><p>' + escapeHtml(state.copywritingStatus || '正在定位产品信息里的 Word 附件...') + '</p></div></section>';
    }
    const errorHtml = state.copywritingError
      ? '<div class="pfh-copywriting-alert is-error"><strong>文案读取未完成</strong><span>' + escapeHtml(state.copywritingError) + '</span></div>'
      : '';
    if (!record || !record.fullText) {
      return '<section class="pfh-copywriting-page">' + errorHtml + '<div class="pfh-copywriting-empty"><strong>还没有可展示的文案</strong><p>点击重新获取后，脚本会读取产品信息里的产品文案 Word。</p></div></section>';
    }
    const changed = new Set(record.changedSectionKeys || []);
    const updateHtml = record.updatePending
      ? '<div class="pfh-copywriting-alert is-update"><strong>文案已更新</strong><span>' + escapeHtml(formatCopywritingUpdateSummary(record)) + '</span><button type="button" data-action="copywriting-ack">我知道了</button></div>'
      : '';
    const loadingHtml = state.copywritingChecking
      ? '<div class="pfh-copywriting-alert is-update"><strong>正在检查新文案</strong><span>' + escapeHtml(state.copywritingStatus || '已显示历史内容，正在读取新的文案文件...') + '</span></div>'
      : state.copywritingLoading
        ? '<div class="pfh-copywriting-alert is-update"><strong>正在更新文案</strong><span>' + escapeHtml(state.copywritingStatus || '正在读取新的文案文件...') + '</span></div>'
        : '';
    const missingHtml = record.missingSections && record.missingSections.length
      ? '<div class="pfh-copywriting-alert is-warning"><strong>部分字段缺失</strong><span>' + escapeHtml(record.missingSections.join('、')) + '</span></div>'
      : '';
    const contentHtml = view === 'full'
      ? '<div class="pfh-copywriting-full-card"><div class="pfh-copywriting-block-head"><span><b>全文</b><small>全部文案内容</small></span><button type="button" data-action="copywriting-copy">' + copywritingCopyIconHtml() + '复制全文</button></div><pre>' + escapeHtml(record.fullText) + '</pre></div>'
      : visibleSections.map((section, index) => {
          const netNotice = !collapsed && section.key === 'netContent'
            ? '<small class="pfh-copywriting-net-notice" style="display:block;margin-top:7px;color:#a06a20;font-size:10px;line-height:1.45;">仅供参考，请注意审查</small>'
            : '';
          return '<div class="pfh-copywriting-block' + (changed.has(section.key) ? ' is-changed' : '') + '" data-copywriting-key="' + escapeHtml(section.key) + '">' +
            '<div class="pfh-copywriting-block-head"><span><b>' + String(index + 1).padStart(2, '0') + '</b><strong>' + escapeHtml(section.label || section.key) + '</strong></span><button type="button" data-action="copywriting-section-copy" data-copywriting-key="' + escapeHtml(section.key) + '">' + copywritingCopyIconHtml() + '复制本段</button></div>' +
            '<pre>' + escapeHtml(section.text) + '</pre>' + netNotice + '</div>';
        }).join('');
    return '<section class="pfh-copywriting-page' + (collapsed ? ' is-collapsed' : '') + '">' + errorHtml + loadingHtml + updateHtml + missingHtml + '<div class="pfh-copywriting-content is-' + view + (collapsed ? ' is-collapsed' : '') + '">' + contentHtml + '</div></section>';
  }

  function copywritingSectionCopyValue(section) {
    if (!section || !section.text) return '';
    const lines = String(section.text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return '';
    const first = lines[0] || '';
    if (/^(?:DISTRIBUTED BY|ADDRESS|EU REP|UK REP|US REP)$/i.test(first)) return lines.slice(1).join('\n');
    const inlineHeading = first.match(/^\s*[A-Z][A-Z0-9 /().-]*\s*[:\uff1a]\s*(.*)$/);
    if (!inlineHeading) return lines.join('\n');
    const body = lines.slice(1);
    if (inlineHeading[1]) body.unshift(inlineHeading[1].trim());
    return body.filter(Boolean).join('\n');
  }

  function isToyCopywritingProduct(data) {
    if (!data) return false;
    const productType = getProductTypeForInsight(data, null);
    const categoryText = [data.plmCategory, data.productType, data.category, data.departmentName].filter(Boolean).join(' ');
    return productType === '\u73a9\u5177' || /\u73a9\u5177|\u516c\u4ed4|\u73a9\u5076|\u634f\u634f|\u79ef\u6728|\u76f2\u76d2|\u53f2\u83b1\u59c6|\u89e3\u538b|\btoy\b|\bdoll\b/i.test(getClassificationText(data) + ' ' + categoryText);
  }

  function isFoodEntryCopywritingProduct(data) {
    if (!data || !/\u5165\u53e3/.test(String(data.name || ''))) return false;
    const manualCategory = normalizeManualProductCategory(data.manualCategory);
    if (manualCategory) return manualCategory === '\u98df\u54c1';
    const text = [data.name, data.manualCategory, data.plmCategory, data.aiProductType, data.aiCategory, data.departmentName].filter(Boolean).join(' ');
    return /\u98df\u54c1|\u4fdd\u5065|\u6ecb\u8865|\u81b3\u98df|\u8425\u517b|\u80f6\u56ca|\u8f6f\u7cd6|\u56fa\u4f53\u996e\u6599|\u7c89/i.test(text);
  }

  function findPageToyCopywritingListRow(sku) {
    if (!sku) return null;
    let rows = [];
    try { rows = collectProjectAllListRows(); } catch (error) { rows = []; }
    const collected = rows.find((row) => row && row.sku === sku);
    if (collected) return collected;
    const headerTable = Array.from(document.querySelectorAll('table.vxe-table--header')).find((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
      return headers.includes('\u5546\u54c1\u7f16\u7801') && (headers.includes('\u7c7b\u76ee') || headers.includes('\u54c1\u7c7b'));
    });
    if (!headerTable) return null;
    const headers = Array.from(headerTable.querySelectorAll('thead th')).map((cell) => normalizeProjectListHeader(cell.innerText || cell.textContent));
    const headerIndex = (names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0);
    const skuIndex = headerIndex(['\u5546\u54c1\u7f16\u7801']);
    const categoryIndex = headerIndex(['\u7c7b\u76ee', '\u54c1\u7c7b']);
    const nameIndex = headerIndex(['\u5546\u54c1\u540d\u79f0']);
    if (skuIndex < 0) return null;
    const bodyRow = Array.from(document.querySelectorAll('table.vxe-table--body tbody tr')).find((row) => {
      const cell = row.children[skuIndex];
      return cell && new RegExp(sku, 'i').test(cell.innerText || cell.textContent || '');
    });
    if (!bodyRow) return null;
    const textAt = (index) => index >= 0 && bodyRow.children[index]
      ? cleanProjectListCell(bodyRow.children[index].innerText || bodyRow.children[index].textContent)
      : '';
    return {
      sku,
      name: textAt(nameIndex),
      plmCategory: textAt(categoryIndex),
    };
  }

  function getPageToyCopywritingData(drawer, sku) {
    const current = state.data && state.data.sku === sku ? state.data : null;
    const cached = loadData(sku);
    const indexed = (state.index || []).find((entry) => entry && entry.sku === sku) || null;
    const listRow = findPageToyCopywritingListRow(sku);
    const sources = [current, cached, indexed, listRow].filter(Boolean);
    const pick = (key) => sources.map((source) => String(source[key] || '').trim()).find(Boolean) || '';
    const drawerText = drawer ? getVisibleText(drawer) : '';
    const nameFromDrawer = cleanName((drawerText.match(/\u5546\u54c1\u540d\u79f0\s*[:\uff1a]\s*([^\n]+)/) || [])[1] || '');
    return normalizeData({
      ...(listRow || {}),
      ...(indexed || {}),
      ...(cached || {}),
      ...(current || {}),
      sku,
      name: pick('name') || nameFromDrawer,
      plmCategory: pick('plmCategory') || pick('category'),
      category: pick('category') || pick('plmCategory'),
    });
  }

  function findPageToyCopywritingAnchor(drawer) {
    if (!drawer) return null;
    const labels = Array.from(drawer.querySelectorAll('.ant-form-item-label label')).filter(isVisibleElement);
    const label = labels.find((item) => {
      const title = Array.from(item.children).find((child) => child.tagName === 'SPAN' && !child.classList.contains('aiBox'));
      const titleText = compactText(title ? title.textContent : item.textContent).replace(/[*\uff1a:]/g, '');
      return titleText === '\u4e3b\u56fe' && item.querySelector('.aiBox');
    }) || labels.find((item) => /^\u4e3b\u56fe/.test(compactText(item.textContent)) && item.querySelector('.aiBox'));
    return label ? { label, aiBox: label.querySelector('.aiBox') } : null;
  }

  function pageToyCopywritingLabel(data) {
    return isFoodEntryCopywritingProduct(data) ? '\u667a\u80fd\u8865\u5145\u98df\u54c1\u6587\u6848' : '\u667a\u80fd\u8865\u5145\u73a9\u5177\u6587\u6848';
  }

  function updatePageToyCopywritingButton(button, data) {
    if (!button || !data || !data.sku) return;
    const label = pageToyCopywritingLabel(data);
    const busy = Boolean((state.pageToyCopywritingBusy && state.pageToyCopywritingSku === data.sku) || (state.toyCopywritingBusy && state.selectedSku === data.sku));
    const hasError = Boolean(state.toyCopywritingErrorSku === data.sku && state.toyCopywritingError);
    const content = busy
      ? '<span class="pfh-page-toy-copywriting-spinner pfh-loading-ring-global" aria-hidden="true"></span><span>\u667a\u80fd\u8865\u5145\u4e2d</span>'
      : (hasError
        ? '<span aria-hidden="true">\u26a0</span><span>' + escapeHtml(label + '\u5931\u8d25') + '</span>'
        : '<span aria-hidden="true">\u2726</span><span>' + escapeHtml(label) + '</span>');
    if (button.innerHTML !== content) button.innerHTML = content;
    button.disabled = busy;
    button.classList.toggle('is-busy', busy);
    button.classList.toggle('is-error', !busy && hasError);
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    button.setAttribute('aria-label', busy ? '\u667a\u80fd\u8865\u5145\u4e2d' : label);
    button.title = busy ? '\u6b63\u5728\u6574\u7406\u6587\u6848' : label;
  }

  function removePageToyCopywritingButtons() {
    document.querySelectorAll('[data-pfh-page-toy-copywriting]').forEach((button) => button.remove());
  }

  function ensurePageToyCopywritingButton() {
    if (!document.body || !/projectManagementChemicalNew/.test(location.pathname)) {
      removePageToyCopywritingButtons();
      return null;
    }
    const drawer = getToyCopywritingDrawerForSku('');
    if (!drawer) {
      removePageToyCopywritingButtons();
      return null;
    }
    const sku = getProjectDrawerHeaderSku(drawer) || findSku(getVisibleText(drawer));
    const data = getPageToyCopywritingData(drawer, sku);
    const isToy = isToyCopywritingProduct(data);
    const isFoodEntry = isFoodEntryCopywritingProduct(data);
    const anchor = findPageToyCopywritingAnchor(drawer);
    if (!sku || (!isToy && !isFoodEntry) || !anchor || !anchor.aiBox) {
      removePageToyCopywritingButtons();
      return null;
    }
    const targetLabel = anchor.label;
    const existing = Array.from(document.querySelectorAll('[data-pfh-page-toy-copywriting]'));
    let button = Array.from(targetLabel.querySelectorAll('[data-pfh-page-toy-copywriting]'))[0] || null;
    existing.forEach((item) => { if (item !== button) item.remove(); });
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-pfh-page-toy-copywriting', 'true');
      anchor.aiBox.insertAdjacentElement('afterend', button);
    }
    button.setAttribute('data-sku', sku);
    button.setAttribute('data-kind', isFoodEntry ? 'food' : 'toy');
    updatePageToyCopywritingButton(button, data);
    return button;
  }

  function handlePageToyCopywritingClick(event) {
    if (!event || !(event.target instanceof Element)) return;
    const button = event.target.closest('[data-pfh-page-toy-copywriting]');
    if (!button || button.disabled || !isVisibleElement(button)) return;
    event.preventDefault();
    event.stopPropagation();
    runPageToyCopywriting(button);
  }

  async function runPageToyCopywriting(button) {
    const sku = button && button.getAttribute('data-sku');
    if (!sku || state.pageToyCopywritingBusy || state.toyCopywritingBusy) return;
    const drawer = getToyCopywritingDrawerForSku(sku);
    const data = getPageToyCopywritingData(drawer, sku);
    if (!isToyCopywritingProduct(data) && !isFoodEntryCopywritingProduct(data)) {
      showToast('\u5f53\u524d\u7f16\u7801\u4e0d\u9002\u7528\u73a9\u5177\u6216\u98df\u54c1\u6587\u6848\u8865\u5168');
      return;
    }
    state.pageToyCopywritingBusy = true;
    state.pageToyCopywritingSku = sku;
    updatePageToyCopywritingButton(button, data);
    try {
      await fillToyCopywriting({ data, fromPage: true });
    } finally {
      state.pageToyCopywritingBusy = false;
      state.pageToyCopywritingSku = '';
      ensurePageToyCopywritingButton();
    }
  }

  function toyCopywritingButtonHtml(data) {
    if (!data || !data.sku) return '';
    const isToy = isToyCopywritingProduct(data);
    const isFoodEntry = isFoodEntryCopywritingProduct(data);
    const label = isFoodEntry ? '\u667a\u80fd\u8865\u5145\u98df\u54c1\u6587\u6848' : (isToy ? '\u667a\u80fd\u8865\u5145\u73a9\u5177\u6587\u6848' : '\u8865\u5168\u6210\u5206');
    const hasError = Boolean(data && data.sku && state.toyCopywritingErrorSku === data.sku && state.toyCopywritingError);
    if (!isToy) {
      const source = normalizeData(loadData(data.sku) || data);
      const missing = [];
      if (!(isFoodEntry ? source.ingredientChinese : getCleanedWordIngredientValue(source, 'chinese'))) missing.push('中文成分');
      if (!(isFoodEntry ? source.ingredientEnglish : getCleanedWordIngredientValue(source, 'english'))) missing.push('英文成分');
      if (isFoodEntry && !getCachedCopywritingSectionValue(source, 'directionsChinese')) missing.push('中文使用方法');
      if (isFoodEntry && !getCachedCopywritingSectionValue(source, 'directions')) missing.push('英文使用方法');
      const loading = state.toyCopywritingBusy || state.ingredientHydratingSkus.has(data.sku) || state.copywritingHydratingSkus.has(data.sku);
      const drawerReady = Boolean(getToyCopywritingDrawerForSku(data.sku));
      const ready = !missing.length;
      const hint = loading ? '正在读取 / 补充…' : missing.length ? '缺' + missing.join('、') + ' · 去详情获取' : drawerReady ? '资料齐全 · 可直接补充' : '资料齐全 · 打开详情后补充';
      const shortStatus = loading ? '读取中' : !ready ? '需获取' : drawerReady ? '可补充' : '去详情补充';
      return '<button type="button" class="pfh-source-readiness' + (loading ? '' : ready ? ' is-ready' : ' is-missing') + '" data-action="' + (ready && drawerReady ? 'toy-copywriting-fill' : 'open-detail') + '" title="' + escapeHtml(hint) + '"' + (loading ? ' disabled' : '') + '><span><span>' + label + '</span><small>' + shortStatus + '</small></span></button>';
    }
    return '<button type="button" class="pfh-source-readiness' + (state.toyCopywritingBusy ? '' : hasError ? ' is-missing' : ' is-ready') + '" data-action="toy-copywriting-fill" title="' + escapeHtml(hasError ? state.toyCopywritingError : '智能补充玩具文案') + '"' + (state.toyCopywritingBusy ? ' disabled' : '') + '><span><span>' + label + '</span><small>' + (state.toyCopywritingBusy ? '补充中' : hasError ? '重试' : '可补充') + '</small></span></button>';
  }


  function toyCopywritingFeedbackHtml(data) {
    if (!data || !data.sku || state.toyCopywritingErrorSku !== data.sku || !state.toyCopywritingError) return '';
    const label = isFoodEntryCopywritingProduct(data) ? '\u98df\u54c1\u6587\u6848\u8865\u5145\u5931\u8d25' : '\u6210\u5206\u8865\u5145\u5931\u8d25';
    return '<div class="pfh-toy-copywriting-feedback is-error" role="alert">' +
      '<span><strong>' + label + '</strong><b>' + escapeHtml(state.toyCopywritingError) + '</b></span>' +
      '<button type="button" data-action="open-detail">\u6253\u5f00\u5f53\u524d\u8be6\u60c5</button>' +
      '</div>';
  }

  function setToyCopywritingError(sku, message, kind) {
    state.toyCopywritingErrorSku = String(sku || '');
    state.toyCopywritingError = String(message || '').trim();
    state.toyCopywritingErrorKind = String(kind || 'general');
  }

  function clearToyCopywritingError(sku) {
    if (sku && state.toyCopywritingErrorSku && state.toyCopywritingErrorSku !== sku) return;
    state.toyCopywritingErrorSku = '';
    state.toyCopywritingError = '';
    state.toyCopywritingErrorKind = '';
  }

  function getToyCopywritingFieldConfig(key) {
    return {
      ingredients: { group: '270', labels: /^(?:\u6210\u5206|INGREDIENTS?(?:\(\u6210\u5206\))?)$/i },
      sellingPoints: { group: '', labels: /^(?:\u4ea7\u54c1\u5356\u70b9|PRODUCT SELLING POINTS?(?:\(\u4ea7\u54c1\u5356\u70b9\))?)$/i },
      advantages: { group: '587', labels: /^(?:\u4ea7\u54c1\u4f18\u52bf|PRODUCT ADVANTAGES?(?:\(\u4ea7\u54c1\u4f18\u52bf\))?)$/i },
      efficacy: { group: '652', labels: /^(?:\u4ea7\u54c1\u529f\u6548|PRODUCT EFFICACY(?:\(\u4ea7\u54c1\u529f\u6548\))?)$/i },
      directions: { group: '717', labels: /^(?:\u4f7f\u7528\u65b9\u6cd5|DIRECTIONS OF SAFE USE(?:\(\u4f7f\u7528\u65b9\u6cd5\))?)$/i },
    }[key] || null;
  }

  function findToyCopywritingField(drawer, key) {
    const config = getToyCopywritingFieldConfig(key);
    if (!drawer || !config) return null;
    if (config.group) {
      const byGroup = Array.from(drawer.querySelectorAll('textarea[id*="_attr_group_' + config.group + '_"][id$="_value"], input[id*="_attr_group_' + config.group + '_"][id$="_value"]'))
        .filter(isVisibleElement)[0];
      if (byGroup) return byGroup;
    }
    const items = Array.from(drawer.querySelectorAll('.ant-form-item')).filter(isVisibleElement);
    const item = items.find((candidate) => {
      const label = candidate.querySelector('.ant-form-item-label, label');
      const text = compactText(label && (label.innerText || label.textContent)).replace(/[\uff1a:*]/g, '').replace(/\s+/g, ' ');
      return config.labels.test(text);
    });
    return item ? Array.from(item.querySelectorAll('textarea, input')).filter(isVisibleElement)[0] || null : null;
  }

  function getActiveToyCopywritingLanguage(drawer) {
    const tab = Array.from(drawer && drawer.querySelectorAll('[role="tab"], .ant-tabs-tab') || [])
      .filter(isVisibleElement)
      .filter((item) => /^(?:\u4e2d\u6587-\u7b80\u4f53|\u82f1\u8bed\(\u7f8e\u56fd\))$/.test(compactText(item.textContent)))
      .find(isActiveTab);
    return tab ? compactText(tab.textContent) : '';
  }

  function getToyCopywritingDrawerForSku(sku) {
    const drawers = Array.from(document.querySelectorAll('.pdmDetailDrawer, .ant-drawer-open, .ant-drawer'))
      .filter(isVisibleElement)
      .filter((drawer) => {
        const text = getVisibleText(drawer);
        return (!sku || text.includes(sku))
          && text.includes('\u4e2d\u6587-\u7b80\u4f53')
          && text.includes('\u82f1\u8bed(\u7f8e\u56fd)')
          && text.includes('\u4fdd\u5b58\u8349\u7a3f')
          && (text.includes('\u63a8\u54c1\u8d44\u6599') || hasToyCopywritingFields(drawer));
      });
    return drawers[drawers.length - 1] || null;
  }

  async function switchToyCopywritingLanguage(drawer, language) {
    if (getActiveToyCopywritingLanguage(drawer) === language) return;
    const tab = findTabButton(drawer, language);
    if (!tab) throw new Error('\u672a\u627e\u5230\u300c' + language + '\u300d\u9875\u7b7e');
    clickElement(tab);
    const switched = await waitFor(() => getActiveToyCopywritingLanguage(drawer) === language, 5000, 120);
    if (!switched) throw new Error('\u5207\u6362\u300c' + language + '\u300d\u9875\u7b7e\u8d85\u65f6');
    await waitFor(() => findToyCopywritingField(drawer, 'ingredients') || findToyCopywritingField(drawer, 'advantages'), 4000, 120);
  }

  function readToyCopywritingFields(drawer) {
    const result = {};
    ['ingredients', 'sellingPoints', 'advantages', 'efficacy', 'directions'].forEach((key) => {
      const field = findToyCopywritingField(drawer, key);
      result[key] = field ? String(field.value || '').trim() : '';
    });
    return result;
  }

  function hasToyCopywritingFields(drawer) {
    return Boolean(
      findToyCopywritingField(drawer, 'sellingPoints')
      || findToyCopywritingField(drawer, 'advantages')
      || findToyCopywritingField(drawer, 'efficacy')
      || findToyCopywritingField(drawer, 'directions')
    );
  }

  function findToyCopywritingNextButton(drawer) {
    if (!drawer) return null;
    const buttons = Array.from(drawer.querySelectorAll('button'))
      .filter(isVisibleElement)
      .filter(isActionButtonReady)
      .filter((button) => compactText(button.innerText || button.textContent) === '\u4e0b\u4e00\u6b65');
    return buttons.length === 1 ? buttons[0] : null;
  }

  async function advanceToyCopywritingDrawerToFields(drawer, sku) {
    if (hasToyCopywritingFields(drawer)) return drawer;
    const nextButton = findToyCopywritingNextButton(drawer);
    if (!nextButton) throw new Error('\u7f16\u8f91\u62bd\u5c49\u672a\u8fdb\u5165\u6587\u6848\u9875\uff0c\u4e14\u672a\u627e\u5230\u552f\u4e00\u53ef\u7528\u7684\u300c\u4e0b\u4e00\u6b65\u300d');
    clickElement(nextButton);
    const readyDrawer = await waitFor(() => {
      const liveDrawer = getToyCopywritingDrawerForSku(sku) || drawer;
      return hasToyCopywritingFields(liveDrawer) ? liveDrawer : null;
    }, 15000, 150);
    if (!readyDrawer) throw new Error('\u5df2\u70b9\u51fb\u300c\u4e0b\u4e00\u6b65\u300d\uff0c\u4f46\u73a9\u5177\u6587\u6848\u5b57\u6bb5\u672a\u52a0\u8f7d');
    return readyDrawer;
  }

  function setNativeFormValue(field, value) {
    if (!field) return false;
    const next = String(value || '').trim();
    if (!next || String(field.value || '').trim()) return false;
    const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(field, next);
    else field.value = next;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function applyToyCopywritingPatch(drawer, patch) {
    let count = 0;
    Object.keys(patch || {}).forEach((key) => {
      if (setNativeFormValue(findToyCopywritingField(drawer, key), patch[key])) count += 1;
    });
    return count;
  }

  function getCachedCopywritingSectionValue(data, key) {
    const record = normalizeCopywritingRecord(data && data.copywriting);
    const section = record && record.sections.find((item) => item.key === key);
    return copywritingSectionCopyValue(section);
  }

  async function fillFoodEntryCopywriting(data, drawer) {
    const sku = data.sku;
    if (state.ingredientHydratingSkus.has(sku)) await waitFor(() => !state.ingredientHydratingSkus.has(sku), 65000, 250);
    if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 65000, 250);
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    const chinese = readToyCopywritingFields(drawer);
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    const english = readToyCopywritingFields(drawer);
    const needsIngredients = !chinese.ingredients || !english.ingredients;
    const needsDirections = !chinese.directions || !english.directions;
    if (!needsIngredients && !needsDirections) return 0;
    let cached = normalizeData(loadData(sku) || data);
    if (needsIngredients && (!cached.ingredientChinese || !cached.ingredientEnglish)) cached = await hydrateIngredientPdfForSku(sku);
    if (needsDirections && (!getCachedCopywritingSectionValue(cached, 'directions') || !getCachedCopywritingSectionValue(cached, 'directionsChinese'))) {
      cached = await hydrateCopywritingForSku(sku, { force: true });
    }
    const chineseIngredients = String(cached.ingredientChinese || '').trim();
    const englishIngredients = String(cached.ingredientEnglish || '').trim();
    const chineseDirections = getCachedCopywritingSectionValue(cached, 'directionsChinese');
    const englishDirections = getCachedCopywritingSectionValue(cached, 'directions');
    if ((!chinese.ingredients && !chineseIngredients) || (!english.ingredients && !englishIngredients)) throw new Error('\u6210\u5206\u8868\u4e2d\u6587\u6216\u82f1\u6587\u7f13\u5b58\u4e3a\u7a7a');
    if ((!chinese.directions && !chineseDirections) || (!english.directions && !englishDirections)) throw new Error('\u4ea7\u54c1\u6587\u6848 Word \u4e2d\u672a\u8bc6\u522b\u5230\u4e2d\u82f1\u6587\u4f7f\u7528\u65b9\u6cd5');
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    let filledCount = applyToyCopywritingPatch(drawer, {
      ingredients: chinese.ingredients ? '' : chineseIngredients,
      directions: chinese.directions ? '' : chineseDirections,
    });
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    filledCount += applyToyCopywritingPatch(drawer, {
      ingredients: english.ingredients ? '' : englishIngredients,
      directions: english.directions ? '' : englishDirections,
    });
    if (!filledCount) return 0;
    const saved = await saveProductDraftBeforeClose();
    if (!saved) throw new Error('\u98df\u54c1\u6587\u6848\u5df2\u586b\u5199\uff0c\u4f46 PLM \u672a\u8fd4\u56de\u300c\u4fdd\u5b58\u6210\u529f\u300d');
    return filledCount;
  }

  function getCleanedWordIngredientValue(data, language) {
    const cached = normalizeData(data || {});
    const record = normalizeCopywritingRecord(cached.copywriting);
    if (language === 'chinese') {
      return String(record && record.cleanedIngredientChinese || cached.copywritingIngredientChinese || '').trim();
    }
    return String(record && record.cleanedIngredientEnglish || cached.copywritingIngredientEnglish || '').trim();
  }

  async function fillOtherProductIngredients(data, drawer) {
    const sku = data.sku;
    if (state.copywritingHydratingSkus.has(sku)) await waitFor(() => !state.copywritingHydratingSkus.has(sku), 65000, 250);
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    const chinese = readToyCopywritingFields(drawer);
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    const english = readToyCopywritingFields(drawer);
    if (chinese.ingredients && english.ingredients) return 0;
    let cached = normalizeData(loadData(sku) || data);
    if ((!chinese.ingredients && !getCleanedWordIngredientValue(cached, 'chinese'))
      || (!english.ingredients && !getCleanedWordIngredientValue(cached, 'english'))) {
      cached = await hydrateCopywritingForSku(sku, { force: true, drawer });
    }
    const chineseIngredients = getCleanedWordIngredientValue(cached, 'chinese');
    const englishIngredients = getCleanedWordIngredientValue(cached, 'english');
    if ((!chinese.ingredients && !chineseIngredients) || (!english.ingredients && !englishIngredients)) {
      throw new Error('\u4ea7\u54c1\u6587\u6848 Word \u4e2d\u672a\u8bc6\u522b\u5230\u5b8c\u6574\u7684\u4e2d\u82f1\u6587\u6210\u5206');
    }
    await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
    let filledCount = applyToyCopywritingPatch(drawer, {
      ingredients: chinese.ingredients ? '' : chineseIngredients,
    });
    await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
    filledCount += applyToyCopywritingPatch(drawer, {
      ingredients: english.ingredients ? '' : englishIngredients,
    });
    if (!filledCount) return 0;
    const saved = await saveProductDraftBeforeClose();
    if (!saved) throw new Error('\u6210\u5206\u5df2\u586b\u5199\uff0c\u4f46 PLM \u672a\u8fd4\u56de\u300c\u4fdd\u5b58\u6210\u529f\u300d');
    return filledCount;
  }

  async function fillToyCopywriting(options) {
    const opts = options || {};
    if (state.toyCopywritingBusy) return 0;
    const renderPanel = () => { if (!opts.fromPage) renderShell(); };
    const data = normalizeData(opts.data || state.data || {});
    const isToy = isToyCopywritingProduct(data);
    const isFoodEntry = isFoodEntryCopywritingProduct(data);
    const isIngredientOnly = !isToy && !isFoodEntry;
    if (!data.sku) {
      showToast('\u672a\u627e\u5230\u5f53\u524d SKU');
      return 0;
    }
    if (isFoodEntry) {
      const cached = normalizeData(loadData(data.sku) || data);
      if (!cached.ingredientChinese || !cached.ingredientEnglish) {
        const message = '\u672a\u627e\u5230\u5b8c\u6574\u7684\u6210\u5206\u8868\u7f13\u5b58\u3002\u8bf7\u5148\u6253\u5f00\u5f53\u524d SKU \u7684\u300c\u4ea7\u54c1\u4fe1\u606f\u300d\uff0c\u7b49\u5f85\u6210\u5206\u8868\u8bfb\u53d6\u5b8c\u6210\u540e\u518d\u8bd5\u3002';
        setToyCopywritingError(data.sku, message, 'ingredient-cache');
        addLog('warn', '\u98df\u54c1\u6587\u6848\u667a\u80fd\u8865\u5145\u7f3a\u5c11\u6210\u5206\u8868\u7f13\u5b58', data.sku);
        renderPanel();
        showToast('\u98df\u54c1\u6587\u6848\u8865\u5145\u5931\u8d25\uff1a' + message);
        return 0;
      }
    }
    clearToyCopywritingError(data.sku);
    const drawer = getToyCopywritingDrawerForSku(data.sku);
    if (!drawer) {
      const message = '\u8bf7\u5148\u6253\u5f00\u5f53\u524d SKU \u7684 PLM \u8be6\u60c5';
      if (!isToy) {
        setToyCopywritingError(data.sku, message, isFoodEntry ? 'detail' : 'ingredient-detail');
        renderPanel();
      }
      showToast(message);
      return 0;
    }
    state.toyCopywritingBusy = true;
    renderPanel();
    const originalLanguage = getActiveToyCopywritingLanguage(drawer) || '\u4e2d\u6587-\u7b80\u4f53';
    let filledCount = 0;
    try {
      if (isFoodEntry) {
        filledCount = await fillFoodEntryCopywriting(data, drawer);
        if (!filledCount) {
          showToast('\u98df\u54c1\u6587\u6848\u5df2\u5b8c\u6574\uff0c\u65e0\u9700\u8865\u5145');
          return 0;
        }
        addLog('success', '\u98df\u54c1\u6587\u6848\u667a\u80fd\u8865\u5145\u5b8c\u6210', data.sku + ' | ' + filledCount + '\u4e2a\u5b57\u6bb5');
        syncInsightEvent('toy_copywriting_supplement_success', { sku: data.sku, name: data.name || '', source: 'food-copywriting', copywritingType: 'food', filledCount });
        showToast('\u5df2\u8865\u5145 ' + filledCount + ' \u4e2a\u98df\u54c1\u6587\u6848\u5b57\u6bb5\u5e76\u4fdd\u5b58\u8349\u7a3f');
        return filledCount;
      }
      if (isIngredientOnly) {
        filledCount = await fillOtherProductIngredients(data, drawer);
        if (!filledCount) {
          showToast('\u4e2d\u82f1\u6587\u6210\u5206\u5df2\u5b8c\u6574\uff0c\u65e0\u9700\u8865\u5145');
          return 0;
        }
        addLog('success', '\u4ea7\u54c1\u6210\u5206\u8865\u5168\u5b8c\u6210', data.sku + ' | ' + filledCount + '\u4e2a\u5b57\u6bb5');
        syncInsightEvent('toy_copywriting_supplement_success', { sku: data.sku, name: data.name || '', source: 'product-ingredients', copywritingType: 'ingredients', filledCount });
        showToast('\u5df2\u8865\u5168 ' + filledCount + ' \u4e2a\u4e2d\u82f1\u6587\u6210\u5206\u5b57\u6bb5\u5e76\u4fdd\u5b58\u8349\u7a3f');
        return filledCount;
      }
      await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
      const chinese = readToyCopywritingFields(drawer);
      await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
      const english = readToyCopywritingFields(drawer);
      const needsAi = !chinese.advantages || !chinese.efficacy || !chinese.directions || !english.advantages || !english.efficacy || !english.ingredients || !english.directions;
      if (!chinese.efficacy && !chinese.sellingPoints) throw new Error('\u4e2d\u6587\u4ea7\u54c1\u5356\u70b9\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u751f\u6210\u4e09\u53e5\u4ea7\u54c1\u529f\u6548');
      if (!english.ingredients && !chinese.ingredients) throw new Error('\u4e2d\u6587\u6210\u5206\u4e3a\u7a7a\uff0c\u65e0\u6cd5\u751f\u6210\u82f1\u6587 INGREDIENTS');
      let generated = {};
      if (needsAi) {
        showToast('\u9b54\u642d Qwen \u6b63\u5728\u6574\u7406\u73a9\u5177\u6587\u6848...');
        generated = await cloudRequest('/toy-copywriting/complete', {
          method: 'POST',
          timeoutMs: 90000,
          body: {
            sku: data.sku,
            name: data.name || '',
            chineseSellingPoints: chinese.sellingPoints,
            chineseAdvantages: chinese.advantages,
            chineseEfficacy: chinese.efficacy,
            chineseIngredients: chinese.ingredients,
            chineseDirections: chinese.directions,
            needsChineseAdvantages: !chinese.advantages,
            needsEnglishAdvantages: !english.advantages,
            needsChineseEfficacy: !chinese.efficacy,
            needsEnglishEfficacy: !english.efficacy,
            needsChineseDirections: !chinese.directions,
            needsEnglishIngredients: !english.ingredients,
            needsEnglishDirections: !english.directions,
          },
        });
        if (!generated || !generated.ok) throw new Error(generated && generated.error ? generated.error : 'AI \u672a\u8fd4\u56de\u6709\u6548\u73a9\u5177\u6587\u6848');
      }
      const finalChineseAdvantages = chinese.advantages || String(generated.chineseAdvantages || '').trim();
      const finalEnglishAdvantages = english.advantages || String(generated.englishAdvantages || '').trim();
      const finalChineseEfficacy = chinese.efficacy || String(generated.chineseEfficacy || '').trim();
      const finalEnglishEfficacy = english.efficacy || String(generated.englishEfficacy || '').trim();
      const finalChineseDirections = chinese.directions || String(generated.chineseDirections || '').trim();
      const finalEnglishDirections = english.directions || String(generated.englishDirections || '').trim();
      if (!chinese.advantages && !finalChineseAdvantages) throw new Error('\u672a\u751f\u6210\u6709\u6548\u7684\u4e2d\u6587\u4ea7\u54c1\u4f18\u52bf');
      if (!english.advantages && !finalEnglishAdvantages) throw new Error('\u672a\u751f\u6210\u6709\u6548\u7684\u82f1\u6587 PRODUCT ADVANTAGES');
      if (!chinese.efficacy && !finalChineseEfficacy) throw new Error('\u672a\u6839\u636e\u4ea7\u54c1\u5356\u70b9\u751f\u6210\u4e2d\u6587\u4ea7\u54c1\u529f\u6548');
      if (!english.efficacy && !finalEnglishEfficacy) throw new Error('\u672a\u751f\u6210\u82f1\u6587 PRODUCT EFFICACY');
      if (!chinese.directions && !finalChineseDirections) throw new Error('\u672a\u4ece\u4ea7\u54c1\u5356\u70b9\u548c\u4ea7\u54c1\u4f18\u52bf\u751f\u6210\u4e2d\u6587\u4f7f\u7528\u65b9\u6cd5');
      if (!english.directions && !finalEnglishDirections) throw new Error('\u672a\u751f\u6210\u82f1\u6587 DIRECTIONS OF SAFE USE');
      const chinesePatch = {};
      if (!chinese.advantages) chinesePatch.advantages = finalChineseAdvantages;
      if (!chinese.efficacy) chinesePatch.efficacy = finalChineseEfficacy;
      if (!chinese.directions) chinesePatch.directions = finalChineseDirections;
      const englishPatch = {};
      if (!english.advantages) englishPatch.advantages = finalEnglishAdvantages;
      if (!english.efficacy) englishPatch.efficacy = finalEnglishEfficacy;
      if (!english.ingredients) englishPatch.ingredients = String(generated.englishIngredients || '').trim();
      if (!english.directions) englishPatch.directions = finalEnglishDirections;
      if (!Object.keys(chinesePatch).length && !Object.keys(englishPatch).length) {
        showToast('\u73a9\u5177\u6587\u6848\u5df2\u5b8c\u6574\uff0c\u65e0\u9700\u8865\u5145');
        return 0;
      }
      if (englishPatch.ingredients === '' || englishPatch.directions === '') throw new Error('Gemini \u8fd4\u56de\u7684\u82f1\u6587\u6210\u5206\u6216\u4f7f\u7528\u65b9\u6cd5\u4e3a\u7a7a');
      await switchToyCopywritingLanguage(drawer, '\u4e2d\u6587-\u7b80\u4f53');
      filledCount += applyToyCopywritingPatch(drawer, chinesePatch);
      await switchToyCopywritingLanguage(drawer, '\u82f1\u8bed(\u7f8e\u56fd)');
      filledCount += applyToyCopywritingPatch(drawer, englishPatch);
      if (!filledCount) throw new Error('\u76ee\u6807\u5b57\u6bb5\u672a\u5199\u5165\uff0cPLM \u8868\u5355\u7ed3\u6784\u53ef\u80fd\u5df2\u53d8\u5316');
      const saved = await saveProductDraftBeforeClose();
      if (!saved) throw new Error('\u6587\u6848\u5df2\u586b\u5199\uff0c\u4f46 PLM \u672a\u8fd4\u56de\u300c\u4fdd\u5b58\u6210\u529f\u300d');
      addLog('success', '\u73a9\u5177\u6587\u6848\u667a\u80fd\u8865\u5145\u5b8c\u6210', data.sku + ' | ' + filledCount + '\u4e2a\u5b57\u6bb5');
      syncInsightEvent('toy_copywriting_supplement_success', { sku: data.sku, name: data.name || '', source: 'toy-copywriting', copywritingType: 'toy', filledCount });
      showToast('\u5df2\u8865\u5145 ' + filledCount + ' \u4e2a\u73a9\u5177\u6587\u6848\u5b57\u6bb5\u5e76\u4fdd\u5b58\u8349\u7a3f');
      return filledCount;
    } catch (error) {
      const message = formatErrorMessage(error) || '\u667a\u80fd\u8865\u5145\u5931\u8d25';
      const label = isFoodEntry ? '\u98df\u54c1\u6587\u6848' : (isIngredientOnly ? '\u6210\u5206' : '\u73a9\u5177\u6587\u6848');
      if (!isToy) setToyCopywritingError(data.sku, message, isIngredientOnly ? 'ingredient' : 'general');
      addLog('error', label + '\u667a\u80fd\u8865\u5145\u5931\u8d25', data.sku + ' | ' + message);
      showToast(label + '\u8865\u5145\u5931\u8d25\uff1a' + message);
      if (opts.throwOnError) throw error;
      return 0;
    } finally {
      if (originalLanguage && getToyCopywritingDrawerForSku(data.sku)) {
        await switchToyCopywritingLanguage(drawer, originalLanguage).catch(() => {});
      }
      state.toyCopywritingBusy = false;
      renderPanel();
    }
  }

  function formatCopywritingUpdateSummary(record) {
    const changedCount = (record.changedSectionKeys || []).length;
    const removed = record.removedSections || [];
    const parts = [];
    if (changedCount) parts.push(changedCount + ' 段有变化');
    if (removed.length) parts.push('删除：' + removed.join('、'));
    return parts.join('；') || '检测到新的产品文案文件';
  }

  function homeAssignedDateKey(record) {
    return parseLedgerDateFromText(record && record.designAssignedAt);
  }

  function homeDashboardStats(period) {
    const todayKey = getTodayKey();
    const yesterdayKey = shiftDateKey(todayKey, -1);
    const assignedCounts = new Map();
    (state.index || []).forEach((record) => {
      const key = homeAssignedDateKey(record);
      if (key) assignedCounts.set(key, (assignedCounts.get(key) || 0) + 1);
    });
    const days = Array.from({ length: period }, (_, index) => shiftDateKey(todayKey, index - period + 1));
    const values = days.map((key) => assignedCounts.get(key) || 0);
    const today = assignedCounts.get(todayKey) || 0;
    const yesterday = assignedCounts.get(yesterdayKey) || 0;
    const finalizedToday = (state.ledgerRecords || []).filter((record) => isLedgerFinalizedRecord(record) && getLedgerFinalizedDate(record) === todayKey).length;
    return {
      today,
      yesterday,
      finalizedToday,
      completionRate: today ? Math.min(100, Math.round(finalizedToday / today * 100)) : 0,
      days,
      values,
      total: values.reduce((sum, value) => sum + value, 0),
    };
  }

  function homeChartGeometry(values) {
    const width = 620;
    const baseline = 112;
    const top = 20;
    const safeValues = values.length ? values : [0];
    const maxValue = Math.max(1, ...safeValues);
    const step = safeValues.length > 1 ? width / (safeValues.length - 1) : width;
    const points = safeValues.map((value, index) => ({
      x: Number((index * step).toFixed(2)),
      y: Number((baseline - (Number(value) || 0) / maxValue * (baseline - top)).toFixed(2)),
    }));
    let line = 'M' + points[0].x + ',' + points[0].y;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const middleX = Number(((previous.x + current.x) / 2).toFixed(2));
      line += ' C' + middleX + ',' + previous.y + ' ' + middleX + ',' + current.y + ' ' + current.x + ',' + current.y;
    }
    return {
      line,
      area: line + ' L' + width + ',' + baseline + ' L0,' + baseline + ' Z',
      last: points[points.length - 1],
      points,
    };
  }

  function homeChartLabelsHtml(days, period) {
    const indexes = period === 30 ? [0, 6, 12, 18, 24, 29] : days.map((_day, index) => index);
    return indexes.map((index) => {
      const key = days[index] || days[days.length - 1] || getTodayKey();
      const label = index === days.length - 1 ? '今天' : Number(key.slice(5, 7)) + '/' + Number(key.slice(8, 10));
      return '<span>' + escapeHtml(label) + '</span>';
    }).join('');
  }

  function homeChartPointsHtml(stats, chart) {
    return chart.points.map((point, index) => {
      const day = stats.days[index] || getTodayKey();
      const label = index === stats.days.length - 1
        ? '今天'
        : Number(day.slice(5, 7)) + '月' + Number(day.slice(8, 10)) + '日';
      const x = Number((point.x / 620 * 100).toFixed(3));
      const y = Number((point.y / 130 * 100).toFixed(3));
      return '<button type="button" class="pfh-home-chart-point' + (index === chart.points.length - 1 ? ' is-latest' : '') + '" style="--pfh-chart-x:' + x + '%;--pfh-chart-y:' + y + '%" data-chart-index="' + index + '" data-chart-x="' + x + '" data-chart-y="' + y + '" data-chart-label="' + escapeHtml(label) + '" data-chart-count="' + (Number(stats.values[index]) || 0) + '" aria-label="' + escapeHtml(label) + '，新分配 ' + (Number(stats.values[index]) || 0) + ' 个任务"></button>';
    }).join('');
  }

  function setupHomeChartInteraction(root) {
    const plot = root && root.querySelector('.pfh-home-chart-plot');
    if (!plot) return;
    const points = Array.from(plot.querySelectorAll('.pfh-home-chart-point'));
    const tooltip = plot.querySelector('.pfh-home-chart-tooltip');
    const tooltipDate = tooltip && tooltip.querySelector('strong');
    const tooltipValue = tooltip && tooltip.querySelector('span');
    if (!points.length || !tooltip || !tooltipDate || !tooltipValue) return;

    const activate = (index) => {
      const safeIndex = Math.max(0, Math.min(points.length - 1, Number(index) || 0));
      const point = points[safeIndex];
      const x = Number(point.getAttribute('data-chart-x')) || 0;
      const y = Number(point.getAttribute('data-chart-y')) || 0;
      points.forEach((item) => item.classList.toggle('is-active', item === point));
      tooltipDate.textContent = point.getAttribute('data-chart-label') || '';
      tooltipValue.textContent = '新分配 ' + (point.getAttribute('data-chart-count') || '0') + ' 个任务';
      tooltip.style.setProperty('--pfh-chart-tip-x', Math.max(12, Math.min(88, x)) + '%');
      plot.style.setProperty('--pfh-chart-guide-x', x + '%');
      plot.classList.add('is-inspecting');
      tooltip.classList.toggle('is-below', y < 32);
    };
    const deactivate = () => {
      plot.classList.remove('is-inspecting', 'is-scrubbing');
      points.forEach((item) => item.classList.remove('is-active'));
    };
    const activateFromPointer = (event) => {
      const rect = plot.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      activate(Math.round(ratio * (points.length - 1)));
    };

    plot.addEventListener('pointerenter', activateFromPointer);
    plot.addEventListener('pointermove', activateFromPointer);
    plot.addEventListener('pointerdown', (event) => {
      plot.classList.add('is-scrubbing');
      try { plot.setPointerCapture(event.pointerId); } catch (_) {}
      activateFromPointer(event);
    });
    plot.addEventListener('pointerup', (event) => {
      plot.classList.remove('is-scrubbing');
      try { plot.releasePointerCapture(event.pointerId); } catch (_) {}
      activateFromPointer(event);
    });
    plot.addEventListener('pointerleave', deactivate);
    points.forEach((point, index) => {
      point.addEventListener('focus', () => activate(index));
      point.addEventListener('blur', () => {
        window.setTimeout(() => {
          if (!plot.contains(document.activeElement)) deactivate();
        }, 0);
      });
      point.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const offset = event.key === 'ArrowLeft' ? -1 : 1;
        points[Math.max(0, Math.min(points.length - 1, index + offset))].focus();
      });
    });
  }

  function loadHomeTodos() {
    try {
      const saved = typeof GM_getValue === 'function' ? GM_getValue(HOME_TODO_KEY, []) : JSON.parse(localStorage.getItem(HOME_TODO_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((item) => item && typeof item.text === 'string' && item.id).slice(0, 30) : [];
    } catch (_) {
      return [];
    }
  }

  function saveHomeTodos() {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(HOME_TODO_KEY, state.homeTodos);
      else localStorage.setItem(HOME_TODO_KEY, JSON.stringify(state.homeTodos));
    } catch (error) {
      console.warn('PLM floating helper todo save failed:', error);
    }
  }

  function homeTodoCardHtml() {
    const todos = state.homeTodos || [];
    return '<article class="pfh-home-todo"><header><div><h3>待办项</h3><p>可以简短记录一些待办</p></div><span>' + todos.filter((item) => !item.done).length + ' 项未完成</span></header>' +
      '<div class="pfh-home-todo-entry"><input class="pfh-home-todo-input" type="text" maxlength="120" placeholder="写下一件待办，按回车添加" value="' + escapeHtml(state.homeTodoDraft || '') + '"><button type="button" data-action="home-todo-add">添加</button></div>' +
      '<div class="pfh-home-todo-list">' + (todos.length ? todos.map((item) => '<div class="pfh-home-todo-item' + (item.done ? ' is-done' : '') + '"><button type="button" class="pfh-home-todo-check" data-action="home-todo-toggle" data-todo-id="' + escapeHtml(item.id) + '" aria-label="' + (item.done ? '标记为未完成' : '标记为完成') + '">' + (item.done ? '✓' : '') + '</button><span title="' + escapeHtml(item.text) + '">' + escapeHtml(item.text) + '</span><button type="button" class="pfh-home-todo-remove" data-action="home-todo-remove" data-todo-id="' + escapeHtml(item.id) + '" aria-label="删除待办">×</button></div>').join('') : '<p class="pfh-home-todo-empty">还没有待办，写下第一件事吧。</p>') + '</div></article>';
  }

  function homeTrendCardHtml(stats, chart, period, chartSummary) {
    return '<article class="pfh-home-chart"><header><div><h3>新任务趋势</h3><p>' + escapeHtml(chartSummary) + '</p></div></header><div class="pfh-home-chart-canvas"><div class="pfh-home-chart-plot"><svg viewBox="0 0 620 130" preserveAspectRatio="none" role="img" aria-label="新任务趋势图"><defs><linearGradient id="pfh-home-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b50e9" stop-opacity=".25"></stop><stop offset="1" stop-color="#5b50e9" stop-opacity="0"></stop></linearGradient></defs><line x1="0" y1="26" x2="620" y2="26"></line><line x1="0" y1="68" x2="620" y2="68"></line><line x1="0" y1="110" x2="620" y2="110"></line><path class="pfh-home-chart-area" d="' + chart.area + '"></path><path class="pfh-home-chart-line" d="' + chart.line + '"></path></svg><div class="pfh-home-chart-points">' + homeChartPointsHtml(stats, chart) + '</div><div class="pfh-home-chart-tooltip" role="status"><strong></strong><span></span></div></div><div class="pfh-home-chart-labels">' + homeChartLabelsHtml(stats.days, period) + '</div></div></article>';
  }

  function normalizePixelRoomTime(value) {
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')) ? String(value) : '18:00';
  }

  function pixelRoomSettingsHtml() {
    return '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>窗边日常</strong><span>精细像素小房间</span></div>' +
      '<div class="pfh-about-note">开启后，主页的新任务趋势卡片变为像素小房间。随下班时间从白天渐变到黄昏；加班夜景由你主动开启。时间按北京时间计算。</div>' +
      '<div class="pfh-pixel-room-toggle"><label><input type="checkbox" class="pfh-pixel-room-enabled"' + (state.settings.pixelRoomEnabled === true ? ' checked' : '') + '><span>开启像素小房间</span></label></div>' +
      '<div class="pfh-pixel-room-toggle"><label><input type="checkbox" class="pfh-pixel-room-animation"' + (state.settings.pixelRoomAnimation !== false ? ' checked' : '') + '><span>播放小人动作与飘云</span></label></div><div class="pfh-about-note">关闭动画后，仍保留倒计时和昼夜变化。</div>' +
      '<label class="pfh-pixel-room-field"><span>下班时间</span><input type="time" class="pfh-pixel-room-time" value="' + normalizePixelRoomTime(state.settings.pixelRoomEndTime) + '"></label>' +
      '<div class="pfh-about-note">午休 12:00–13:30：小人去吃饭，猫占领椅子。点猫回头、点地板召唤，双击桌面跳上桌；台灯、窗帘和杯子也可以切换。</div>' +
      '<div class="pfh-pixel-room-picture-actions pfh-about-actions"><button type="button" data-action="pixel-room-picture">更换墙上的画</button><button type="button" data-action="pixel-room-picture-reset">恢复默认画</button></div>' +
      '<div class="pfh-about-note">点墙上画框也可换自己的图片，图片只保存在本机。</div>' +
      '<div class="pfh-about-note">天气地点：汕头市龙湖区。太阳随日出、日落移动，每 15 分钟刷新天气；断网时显示缓存。数据来源：<a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>。</div></div>';
  }

  function pixelRoomWeatherKind(code) {
    if ([95, 96, 97, 99].includes(code)) return { kind: 'storm', label: '雷雨' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { kind: 'snow', label: '雪' };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { kind: 'rain', label: '雨' };
    if ([45, 48].includes(code)) return { kind: 'fog', label: '雾' };
    if (code === 3) return { kind: 'overcast', label: '阴' };
    if (code === 2) return { kind: 'cloudy', label: '多云' };
    if (code === 0 || code === 1) return { kind: 'clear', label: '晴' };
    return { kind: 'unknown', label: '天气未知' };
  }

  function parsePixelRoomWeather(data, fetchedAt) {
    const current = data && data.current;
    const daily = data && data.daily;
    if (!current || !Number.isFinite(current.temperature_2m) || !Number.isInteger(current.weather_code) || !Number.isFinite(current.time) || !daily || !Array.isArray(daily.sunrise) || !Array.isArray(daily.sunset)) throw new Error('Invalid pixel room weather');
    const sun = daily.sunrise.map((rise, i) => ({ rise, set: daily.sunset[i] })).filter((item) => Number.isFinite(item.rise) && Number.isFinite(item.set) && item.set > item.rise && item.set - item.rise < 86400);
    if (!sun.length) throw new Error('Missing sunrise and sunset');
    return { fetchedAt, observedAt: current.time * 1000, code: current.weather_code, temperature: current.temperature_2m, cloud: Number.isFinite(current.cloud_cover) ? Math.max(0, Math.min(100, current.cloud_cover)) : 0, wind: Number.isFinite(current.wind_speed_10m) ? Math.max(0, current.wind_speed_10m) : 0, sun };
  }

  function loadPixelRoomWeatherCache() {
    if (pixelRoomWeatherLoaded) return;
    pixelRoomWeatherLoaded = true;
    try {
      const value = typeof GM_getValue === 'function' ? GM_getValue('pfh-pixel-room-weather-longhu-v1', null) : JSON.parse(localStorage.getItem('pfh-pixel-room-weather-longhu-v1') || 'null');
      if (value && Number.isFinite(value.fetchedAt) && Number.isFinite(value.observedAt) && Number.isFinite(value.temperature) && Number.isInteger(value.code) && Array.isArray(value.sun) && value.sun.every((item) => Number.isFinite(item.rise) && Number.isFinite(item.set) && item.set > item.rise)) pixelRoomWeather = value;
    } catch (_) {}
  }

  function refreshPixelRoomWeather() {
    if (state.settings.pixelRoomEnabled !== true || !state.expanded || document.hidden) return;
    loadPixelRoomWeatherCache();
    const now = Date.now();
    if (pixelRoomWeatherPromise || now < pixelRoomWeatherNextAttempt || (pixelRoomWeather && now >= pixelRoomWeather.fetchedAt && now - pixelRoomWeather.fetchedAt < 15 * 60 * 1000)) return;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=23.3740&longitude=116.7320&current=temperature_2m,weather_code,cloud_cover,precipitation,wind_speed_10m&daily=sunrise,sunset&timezone=Asia%2FShanghai&forecast_days=2&timeformat=unixtime';
    pixelRoomWeatherNextAttempt = now + 5 * 60 * 1000;
    const request = typeof GM_xmlhttpRequest === 'function' ? new Promise((resolve, reject) => {
      GM_xmlhttpRequest({ method: 'GET', url, timeout: 12000,
        onload: (response) => { try { if (response.status < 200 || response.status >= 300) throw new Error('Weather HTTP ' + response.status); resolve(JSON.parse(response.responseText)); } catch (error) { reject(error); } },
        onerror: () => reject(new Error('Weather network unavailable')), ontimeout: () => reject(new Error('Weather request timed out')),
      });
    }) : (async () => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      try { const response = await fetch(url, { signal: controller.signal }); if (!response.ok) throw new Error('Weather HTTP ' + response.status); return await response.json(); }
      finally { window.clearTimeout(timer); }
    })();
    pixelRoomWeatherPromise = request.then((data) => {
      pixelRoomWeather = parsePixelRoomWeather(data, Date.now());
      try {
        if (typeof GM_setValue === 'function') GM_setValue('pfh-pixel-room-weather-longhu-v1', pixelRoomWeather);
        else localStorage.setItem('pfh-pixel-room-weather-longhu-v1', JSON.stringify(pixelRoomWeather));
      } catch (_) {}
    }).catch(() => {}).finally(() => { pixelRoomWeatherPromise = null; updatePixelRoom(); });
  }

  function pixelRoomOutdoor(now, weather) {
    const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
    const day = dayFormatter.format(now);
    const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    const minutes = (date) => { const parts = clock.format(date).split(':').map(Number); return parts[0] * 60 + parts[1] + parts[2] / 60; };
    const today = weather?.sun?.find((item) => dayFormatter.format(new Date(item.rise * 1000)) === day);
    const rise = today ? minutes(new Date(today.rise * 1000)) : 360;
    const set = today ? minutes(new Date(today.set * 1000)) : 1080;
    const time = minutes(now);
    const progress = Math.max(0, Math.min(1, (time - rise) / (set - rise)));
    const age = weather ? now.getTime() - weather.observedAt : Infinity;
    const usable = weather && age >= -60 * 60 * 1000 && age < 24 * 60 * 60 * 1000;
    const type = usable ? pixelRoomWeatherKind(weather.code) : { kind: 'unknown', label: '天气未连接' };
    const stale = usable && (age > 90 * 60 * 1000 || now.getTime() - weather.fetchedAt > 30 * 60 * 1000);
    return { night: time < rise || time >= set, sunX: Math.round(38 + progress * 218), sunY: Math.round(85 - Math.sin(progress * Math.PI) * 56), warmth: Math.max(0, Math.min(1, (time - (set - 90)) / 90)), kind: type.kind, cloud: usable ? weather.cloud : 0, wind: usable ? weather.wind : 0,
      label: '龙湖 · ' + type.label + (usable ? ' ' + Math.round(weather.temperature) + '°C' + (stale ? '（缓存）' : '') : ' · 昼夜示意') };
  }

  function pixelRoomMoment(now, endTime, overtime) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const time = normalizePixelRoomTime(endTime).split(':').map(Number);
    const minutes = Number(values.hour) * 60 + Number(values.minute);
    const remaining = time[0] * 60 + time[1] - minutes;
    const phase = overtime ? 'night' : remaining <= 0 ? 'closed' : remaining <= 15 ? 'packing' : remaining <= 60 ? 'sunset' : 'day';
    const title = overtime ? '夜色已到，小房间陪你加班' : remaining <= 0 ? '今天收工，小房间休息啦' : '距下班还有 ' + (remaining >= 60 ? Math.floor(remaining / 60) + ' 小时 ' : '') + remaining % 60 + ' 分钟';
    return { phase, remaining, title, minutes, day: values.year + values.month + values.day, warmth: Math.max(0, Math.min(1, (60 - remaining) / 60)) };
  }

  function pixelRoomCardHtml() {
    return '<article class="pfh-home-chart"><header><div><h3>窗边日常</h3><p class="pfh-pixel-room-caption">小房间正在开窗…</p></div>' +
      '<div class="pfh-home-period-tabs"><button type="button" data-action="pixel-room-rest" aria-pressed="false">休息一会儿</button><button type="button" data-action="pixel-room-overtime" aria-pressed="false">今晚加班</button></div></header>' +
      '<canvas class="pfh-pixel-room-canvas" width="480" height="168" role="img" aria-label="像素小办公室" title="点猫回头 · 点地板召唤 · 双击桌子跳上桌 · 点灯、窗帘、杯子、画框互动" style="display:block;width:100%;height:auto;image-rendering:pixelated;border-radius:8px;cursor:pointer"></canvas></article>';
  }

  function pixelRoomRest(moment, nowMs) {
    return { lunch: moment.minutes >= 720 && moment.minutes < 810 && moment.phase !== 'closed', manual: pixelRoomRestUntil > nowMs };
  }

  function resolvePixelRoomCat(tick, moment) {
    const base = { ...pixelRoomCatActivity(tick, moment.phase === 'closed'), y: 143 };
    const command = pixelRoomCatCommand;
    if (command && tick < command.until) {
      const progress = state.settings.pixelRoomAnimation === false ? 1 : Math.max(0, Math.min(1, (tick - command.started) / command.duration));
      return { action: progress < 1 && command.action !== 'turning' ? 'walking' : 'sitting', x: Math.round(command.fromX + (command.x - command.fromX) * progress), y: Math.round(command.fromY + (command.y - command.fromY) * progress - (command.action === 'jumping' ? Math.sin(progress * Math.PI) * 28 : 0)), frame: Math.floor(tick * 4) % 2, flip: command.action === 'turning' ? !command.flip : command.x > command.fromX };
    }
    if (moment.rest?.lunch || moment.rest?.manual) return { ...base, action: 'sleeping', x: 278, y: 121 };
    if (['rain', 'storm'].includes(moment.outdoor?.kind)) return { ...base, action: 'sleeping', x: 87, y: 139, box: true };
    if (moment.phase === 'closed') return base;
    if (tick % 180 >= 155 && tick % 180 < 166) return { ...base, action: 'grooming', x: 198, y: 98, blocking: true };
    if (moment.outdoor?.kind === 'clear' && !moment.outdoor.night && tick % 120 < 40) return { ...base, action: 'sleeping', x: 68, y: 101 };
    return base;
  }

  function pixelRoomHit(x, y, cat, doubleClick) {
    if (doubleClick) return x >= 165 && x <= 375 && y >= 87 && y <= 131 ? 'desk' : '';
    if (cat && x >= cat.x - 4 && x <= cat.x + 34 && y >= cat.y - 4 && y <= cat.y + 18) return 'cat';
    if (x >= 310 && x <= 341 && y >= 82 && y <= 122) return 'lamp';
    if (state.settings.pixelRoomCurtains && x >= 23 && x <= 296 && y >= 21 && y <= 86) return 'curtain';
    if (y >= 14 && y <= 121 && ((x >= 8 && x <= 27) || (x >= 298 && x <= 313))) return 'curtain';
    if (x >= 237 && x <= 257 && y >= 110 && y <= 124) return 'cup';
    if (x >= 414 && x <= 442 && y >= 15 && y <= 45) return 'picture';
    return y >= 132 && y <= 163 && x >= 61 && x <= 393 ? 'floor' : '';
  }

  function interactPixelRoom(hit, x, tick) {
    const from = pixelRoomLastCat || { x: 75, y: 143, flip: false };
    if (['cat', 'floor', 'desk'].includes(hit)) {
      const targetX = hit === 'floor' ? Math.max(62, Math.min(359, x - 15)) : hit === 'desk' ? 246 : from.x;
      const duration = state.settings.pixelRoomAnimation === false ? 0.001 : hit === 'desk' ? 0.9 : Math.max(0.3, Math.abs(targetX - from.x) / 60);
      pixelRoomCatCommand = { action: hit === 'cat' ? 'turning' : hit === 'desk' ? 'jumping' : 'walking', fromX: from.x, fromY: from.y, flip: from.flip, x: targetX, y: hit === 'desk' ? 103 : hit === 'floor' ? 143 : from.y, duration, started: tick, until: tick + duration + 10 };
    } else if (hit === 'lamp') {
      const automatic = pixelRoomLastCat?.night || false;
      state.settings.pixelRoomLamp = !(typeof state.settings.pixelRoomLamp === 'boolean' ? state.settings.pixelRoomLamp : automatic);
      saveSettings(state.settings);
    } else if (hit === 'curtain') {
      state.settings.pixelRoomCurtains = !state.settings.pixelRoomCurtains;
      saveSettings(state.settings);
    } else if (hit === 'cup') {
      state.settings.pixelRoomCup = ((Number(state.settings.pixelRoomCup) || 0) + 1) % 4;
      saveSettings(state.settings);
    } else if (hit === 'picture') choosePixelRoomPicture();
  }

  function setupPixelRoomInteractions(canvas) {
    if (canvas.pfhRoomBound) return;
    canvas.pfhRoomBound = true;
    const activate = (event, doubleClick) => {
      if (!doubleClick && event.detail > 1) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = (event.clientX - bounds.left) * 480 / bounds.width;
      const y = (event.clientY - bounds.top) * 168 / bounds.height;
      const hit = pixelRoomHit(x, y, pixelRoomLastCat, doubleClick);
      if (!hit) return;
      event.preventDefault(); event.stopPropagation();
      const tick = window.performance.now() / 1000;
      interactPixelRoom(hit, x, tick);
      updatePixelRoom(tick);
    };
    canvas.addEventListener('click', (event) => activate(event, false));
    canvas.addEventListener('dblclick', (event) => activate(event, true));
  }

  function loadPixelRoomPicture(value) {
    pixelRoomPictureLoaded = true;
    if (!value || typeof value !== 'string' || value.length > 100000 || !/^data:image\/(?:png|jpeg);base64,/.test(value)) { pixelRoomPicture = null; return; }
    const image = new Image();
    image.onload = () => { pixelRoomPicture = image; updatePixelRoom(); };
    image.onerror = () => { pixelRoomPicture = null; };
    image.src = value;
  }

  function choosePixelRoomPicture() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!/^image\/(?:png|jpeg|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024) { showToast('请选择 10MB 以内的 PNG、JPG 或 WebP 图片'); return; }
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
        const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 128, 128);
        const value = canvas.toDataURL('image/jpeg', .85);
        if (typeof GM_setValue === 'function') GM_setValue('pfh-pixel-room-picture-v1', value);
        else localStorage.setItem('pfh-pixel-room-picture-v1', value);
        loadPixelRoomPicture(value); showToast('小房间已换上你的画');
      } catch (_) { showToast('图片读取失败，请换一张图片'); }
      finally { URL.revokeObjectURL(url); }
    };
    input.click();
  }

  function pixelRoomActivity(tick, packing) {
    const seconds = Math.max(0, Number(tick) || 0);
    const frame = Math.floor(seconds * 4);
    const cycle = Math.floor(seconds) % 80;
    return { action: packing ? 'packing' : cycle >= 24 && cycle < 32 ? 'drinking' : cycle >= 32 && cycle < 38 ? 'stretching' : cycle >= 38 && cycle < 44 ? 'waving' : cycle >= 44 && cycle < 50 ? 'watching-cat' : cycle >= 50 && cycle < 58 ? 'standing' : 'typing', frame: frame % 2 };
  }

  function pixelRoomCatActivity(tick, closed) {
    const seconds = Math.max(0, Number(tick) || 0);
    const cycle = seconds % 84;
    const frame = Math.floor(seconds * 4) % 2;
    if (closed) return { action: 'sleeping', x: 92, frame, flip: false };
    if (cycle < 16) return { action: 'walking', x: 75 + Math.floor(cycle * 3), frame, flip: true };
    if (cycle < 28) return { action: 'grooming', x: 123, frame, flip: false };
    if (cycle < 44) return { action: 'sleeping', x: 123, frame, flip: false };
    if (cycle < 52) return { action: 'stretching', x: 123, frame, flip: false };
    if (cycle < 68) return { action: 'walking', x: 123 - Math.floor((cycle - 52) * 3), frame, flip: false };
    return { action: 'sitting', x: 75, frame, flip: false };
  }

  function drawPixelRoomCat(ctx, tick, closed, resolvedCat) {
    const cat = resolvedCat || pixelRoomCatActivity(tick, closed);
    const r = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
    ctx.save(); ctx.translate(cat.x, cat.y ?? 143);
    if (cat.flip) { ctx.translate(29, 0); ctx.scale(-1, 1); }
    r(0, 16, 31, 2, '#947b86');
    const fur = '#d49c6d', light = '#f2d8b2', dark = '#aa735b';
    if (cat.action === 'sleeping') {
      r(3, 8 - cat.frame, 22, 9 + cat.frame, fur); r(0, 10, 9, 6, light); r(1, 7, 4, 5, fur); r(23, 11, 6, 5, dark); r(5, 13, 3, 1, dark);
      r(12, 10 - cat.frame, 2, 3, dark); r(17, 9 - cat.frame, 2, 3, dark);
      r(29, 4 - cat.frame * 2, 3, 1, '#b4a6bd'); r(31, 5 - cat.frame * 2, 1, 2, '#b4a6bd'); r(29, 7 - cat.frame * 2, 3, 1, '#b4a6bd');
    } else {
      const sitting = cat.action === 'sitting' || cat.action === 'grooming';
      const stretch = cat.action === 'stretching';
      const bodyY = sitting ? 5 : stretch ? 11 : 8;
      r(8, bodyY, sitting ? 14 : 19, sitting ? 11 : stretch ? 5 : 8, fur);
      r(10, bodyY + 2, 3, 4, dark); r(17, bodyY + 1, 3, 4, dark);
      const headY = stretch ? 7 : sitting ? 0 : 3 + cat.frame;
      r(0, headY, 12, 10, fur); r(1, headY - 3, 3, 5, fur); r(8, headY - 3, 3, 5, fur);
      r(2, headY - 1, 1, 2, '#e9b3a0'); r(9, headY - 1, 1, 2, '#e9b3a0'); r(0, headY + 6, 8, 4, light);
      r(2, headY + 4, 2, 2, '#615361'); r(7, headY + 4, 2, 2, '#615361'); r(-1, headY + 7, 2, 1, '#a77573');
      const step = cat.action === 'walking' ? cat.frame * 3 : 0;
      r(3 + step, 14, 4, 3, light); r(20 - step, 14, 4, 3, light);
      r(26, bodyY - 3 - cat.frame * 2, 3, 8, fur); r(24, bodyY - 5 - cat.frame * 2, 4, 3, fur);
      if (cat.action === 'grooming') { r(3, headY + 6 - cat.frame * 3, 5, 3, light); r(5, headY + 7 - cat.frame * 3, 2, 1, '#d9908e'); }
      if (stretch) { r(0, 14, 11, 3, light); r(22, 9 - cat.frame, 5, 7, fur); }
    }
    ctx.restore();
  }

  function drawPixelRoom(ctx, moment, tick) {
    ctx.imageSmoothingEnabled = false;
    const outdoor = moment.outdoor;
    const night = moment.phase === 'night' || Boolean(outdoor?.night);
    const closed = moment.phase === 'closed';
    const packing = moment.phase === 'packing';
    const activity = pixelRoomActivity(tick, packing);
    const drinking = activity.action === 'drinking';
    const stretching = activity.action === 'stretching';
    const standing = activity.action === 'standing';
    const resting = Boolean(moment.rest?.lunch || moment.rest?.manual);
    const lampOn = typeof state.settings.pixelRoomLamp === 'boolean' ? state.settings.pixelRoomLamp : night;
    const cupColor = ['#ece1cf', '#d1a2b6', '#9cbab4', '#a4b4d6'][Math.abs(Number(state.settings.pixelRoomCup) || 0) % 4];
    const warm = outdoor ? outdoor.warmth : closed ? 1 : moment.warmth;
    const weatherKind = outdoor?.kind || 'clear';
    const dull = ['overcast', 'rain', 'storm', 'fog', 'snow'].includes(weatherKind);
    const blend = (a, b, t) => '#' + a.map((value, i) => Math.round(value + (b[i] - value) * t).toString(16).padStart(2, '0')).join('');
    const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.floor(x), Math.floor(y), w, h); };
    // A native 480 x 168 pixel scene, with crisp layers rather than scaled photographs.
    rect(0, 0, 480, 168, night ? '#32354e' : '#e8deeb');
    rect(0, 0, 480, 5, '#aaa0b8'); rect(0, 5, 480, 3, '#f9f0ec');
    for (let y = 16; y < 127; y += 12) rect(0, y, 480, 1, night ? '#3c3e59' : '#dfd3df');
    rect(19, 17, 281, 103, '#80758d'); rect(23, 21, 273, 95, '#f7eadb');
    const sky = night ? '#202e52' : dull ? '#929fae' : blend([161, 204, 225], [205, 154, 194], warm);
    rect(27, 25, 265, 87, sky);
    rect(27, 74, 265, 38, night ? '#364363' : blend([192, 222, 226], [252, 190, 154], warm));
    if (night && !dull) {
      rect(245, 34, 12, 12, '#f6e6af'); rect(249, 32, 8, 16, '#f6e6af'); rect(253, 31, 8, 12, sky);
      for (let i = 0; i < 19; i++) rect(33 + i * 13, 31 + (i * 17) % 38, 1, 1, '#dee3f3');
    } else if (!night) {
      const sunY = outdoor ? outdoor.sunY : 37 + Math.round(warm * 42);
      const sunX = outdoor ? outdoor.sunX : 247;
      if (!dull) { rect(sunX, sunY, 16, 16, '#ffe8b4'); rect(sunX + 4, sunY - 3, 8, 22, '#ffe8b4'); }
    }
    // Clouds and precipitation stay behind the window frame and inside the glass.
    ctx.save(); ctx.beginPath(); ctx.rect(27, 25, 265, 87); ctx.clip();
    if (!night || weatherKind !== 'clear') {
      for (let i = 0; i < (dull ? 7 : weatherKind === 'cloudy' ? 5 : 3); i++) {
        const x = 22 + (i * 79 + Math.floor(tick * (1 + Math.min(30, outdoor?.wind || 0) / 10) / 3)) % 260;
        const cloudColor = dull ? night ? '#66738a' : '#b7c1cb' : '#ede7ec';
        rect(x, 40 + i * 9, dull ? 48 : 30, 4, cloudColor); rect(x + 6, 36 + i * 9, dull ? 32 : 17, 4, cloudColor);
      }
    }
    ctx.restore();
    for (let i = 0; i < 10; i++) {
      const x = 28 + i * 27; const h = 15 + (i * 13) % 31;
      rect(x, 112 - h, 24, h, night ? '#47516c' : '#9b9aac');
      rect(x + 4, 109 - h, 15, 2, night ? '#5a647d' : '#b7b0bc');
      for (let y = 117 - h; y < 109; y += 7) for (let j = 0; j < 3; j++) rect(x + 4 + j * 6, y, 3, 3, night ? ((i + j + y) % 3 ? '#eac98b' : '#65718c') : '#cfced7');
    }
    ctx.save(); ctx.beginPath(); ctx.rect(27, 25, 265, 87); ctx.clip();
    if (weatherKind === 'rain' || weatherKind === 'storm' || weatherKind === 'snow') {
      for (let i = 0; i < (weatherKind === 'storm' ? 44 : 26); i++) {
        const x = 27 + (i * 37 + Math.floor(tick * 9)) % 265;
        const y = 25 + (i * 19 + Math.floor(tick * (weatherKind === 'snow' ? 9 : 38))) % 87;
        rect(x, y, weatherKind === 'snow' ? 2 : 1, weatherKind === 'snow' ? 2 : 5, night ? '#b4c5da' : '#dce7ee');
      }
    }
    if (weatherKind === 'fog') { ctx.globalAlpha = .3; rect(27, 25, 265, 87, '#d3dce0'); ctx.globalAlpha = 1; }
    ctx.restore();
    rect(112, 25, 4, 87, '#e4d5cc'); rect(204, 25, 4, 87, '#e4d5cc'); rect(27, 65, 265, 3, '#e4d5cc');
    rect(15, 116, 290, 5, '#f6eadd'); rect(19, 121, 282, 4, '#b8a3a5');
    const curtainSway = (outdoor?.wind || 0) >= 20 ? Math.round(Math.sin(tick * 1.7) * 2) : 0;
    for (const x of [9, 299]) { rect(x + curtainSway, 14, 9, 107, night ? '#5b566d' : '#c1accb'); rect(x + 3 + curtainSway, 17, 2, 100, night ? '#74677e' : '#dcc5de'); }
    if (state.settings.pixelRoomCurtains) {
      for (const [x, width] of [[23, 135], [158, 138]]) {
        rect(x, 21, width, 99, night ? '#655a78' : '#c5b0d0');
        for (let fold = x + 7; fold < x + width; fold += 12) rect(fold + curtainSway, 23, 3, 94, night ? '#7b6a8d' : '#dcc6df');
      }
    }
    // Shelves, books, clock and a small framed landscape.
    rect(333, 43, 114, 5, '#947e87'); rect(339, 48, 4, 5, '#b49a9a'); rect(437, 48, 4, 5, '#b49a9a');
    ['#b1a0cc', '#c5898a', '#e0bc83', '#829f95', '#909fc3'].forEach((color, i) => { rect(338 + i * 10, 22 + i % 2 * 4, 8, 21 - i % 2 * 4, color); rect(340 + i * 10, 37, 4, 1, '#eee0cf'); });
    rect(416, 17, 24, 26, '#806d7c'); rect(419, 20, 18, 20, '#e4d4b4'); rect(421, 23, 14, 9, '#98b6ba'); rect(421, 32, 14, 6, '#829885');
    if (pixelRoomPicture) ctx.drawImage(pixelRoomPicture, 419, 20, 18, 20);
    rect(341, 65, 28, 28, '#b59a9b'); rect(344, 68, 22, 22, '#f5e9d6'); rect(354, 72, 2, 10, '#786c80'); rect(354, 80, 7, 2, '#786c80');
    rect(0, 132, 480, 36, night ? '#5f4c5a' : '#b79490'); rect(0, 130, 480, 3, '#806c7c');
    for (let y = 139; y < 168; y += 11) { rect(0, y, 480, 1, '#947780'); for (let x = y % 2 ? 30 : 65; x < 480; x += 88) rect(x, y - 10, 1, 10, '#a38284'); }
    rect(115, 148, 252, 13, night ? '#675977' : '#b1a0bd'); rect(120, 151, 242, 1, '#c1adc6');
    // Plant, cabinet and door.
    rect(38, 132, 18, 21, '#b98070'); rect(35, 128, 24, 5, '#d4a28a');
    rect(46, 104, 3, 24, '#6d8975'); rect(32, 103, 14, 5, '#7da18b'); rect(35, 108, 12, 4, '#638b77'); rect(49, 96, 12, 7, '#88a68d'); rect(49, 107, 15, 5, '#6e947e');
    rect(398, 110, 42, 35, '#a28788'); rect(401, 113, 36, 13, '#c1a7a0'); rect(416, 118, 7, 2, '#806979'); rect(401, 128, 36, 13, '#b39a96'); rect(416, 133, 7, 2, '#806979');
    rect(450, 65, 25, 83, '#8a788c'); rect(453, 69, 19, 75, '#b29ca7'); rect(455, 74, 15, 32, '#c0aab3'); rect(456, 114, 3, 3, '#ead3a5');
    if (['rain', 'storm'].includes(weatherKind) && moment.remaining <= 60) {
      rect(443, 117, 2, 32, '#71687f'); rect(440, 115, 5, 3, '#71687f');
      rect(434, 124, 17, 4, '#849fc0'); rect(437, 120, 11, 5, '#a5b8cd'); rect(439, 128, 7, 15, '#849fc0'); rect(439, 146, 6, 3, '#71687f');
    }
    // Desk and its familiar little objects.
    rect(168, 124, 204, 7, '#8f737c'); rect(165, 121, 210, 4, '#d4b09b'); rect(177, 131, 7, 22, '#897180'); rect(357, 131, 7, 22, '#897180');
    rect(185, 87, 47, 28, '#5a546e'); rect(188, 90, 41, 22, closed ? '#747389' : '#8db5bc');
    if (!closed) { rect(192, 94, 21, 2, '#d7ece3'); rect(192, 99, 31, 2, '#b3d6d3'); rect(192, 104, 17, 2, '#d7ece3'); }
    rect(205, 115, 6, 5, '#71657b'); rect(197, 119, 23, 2, '#71657b');
    rect(190, 121, 73, 3, '#e8d8cc');
    for (let x = 193; x < 259; x += 6) rect(x, 122, 3, 1, '#b4a2af');
    if (!drinking || closed || resting) { rect(241, 114, 9, 7, cupColor); rect(250, 115, 3, 4, cupColor); rect(243, 112, 5, 2, '#b29a99'); }
    rect(314, 119, 23, 2, '#7a6a80'); rect(324, 92, 3, 27, '#7a6a80'); rect(313, 90, 26, 4, lampOn ? '#e5bd7a' : '#b69ca7'); rect(317, 85, 18, 5, lampOn ? '#f4d69a' : '#d0b0b2');
    if (lampOn) { ctx.globalAlpha = 0.14; rect(305, 94, 42, 26, '#ffdc91'); ctx.globalAlpha = 1; }
    rect(344, 107, 10, 14, '#b791a7'); rect(347, 101, 2, 8, '#7d6d91'); rect(352, 99, 2, 11, '#c6a176');
    rect(276, 136, 28, 5, '#73667e'); rect(278, 116, 24, 20, '#9485a6'); rect(288, 141, 4, 11, '#73667e'); rect(278, 152, 24, 3, '#73667e');
    if (packing || closed) { rect(257, 117, 22, 4, '#c78681'); rect(259, 116, 18, 1, '#efdbbd'); rect(368, 132, 17, 17, '#776d8c'); rect(372, 127, 9, 5, '#776d8c'); rect(372, 128, 7, 4, '#b79490'); }
    else { rect(260, 117, 20, 3, '#f4e9d5'); rect(271, 117, 1, 3, '#b3a2a8'); }
    if (resting) {
      rect(350, 64, 1, 12, '#917582'); rect(367, 64, 1, 12, '#917582'); rect(341, 75, 37, 16, '#f0dfbc');
      ctx.fillStyle = '#796375'; ctx.font = '9px sans-serif'; ctx.fillText(moment.rest.manual ? '休息中' : '午饭中', 344, 87);
      if (moment.rest.lunch && moment.minutes === 720) {
        // The first lunchtime minute catches the little commuter heading out with lunch.
        rect(422, 100, 13, 11, '#e8b49b'); rect(420, 97, 16, 5, '#574e67'); rect(421, 112, 15, 17, '#8b9bbb');
        rect(422, 129, 5, 13, '#66617e'); rect(432, 129, 5, 13, '#66617e'); rect(412, 123, 9, 7, '#d6b391');
      }
    }
    if (!closed && !resting) {
      ctx.save();
      if (standing) ctx.translate(30 + activity.frame * 2, -8);
      const bob = stretching ? -4 : drinking ? -1 : activity.frame;
      rect(279, 86 + bob, 22, 6, '#574e67'); rect(276, 92 + bob, 27, 14, '#574e67'); rect(279, 94 + bob, 21, 16, '#e8b49b');
      rect(278, 93 + bob, 7, 7, '#574e67'); rect(286, 103 + bob, Math.floor(tick) % 8 === 0 ? 3 : 2, Math.floor(tick) % 8 === 0 ? 1 : 2, '#7b5966');
      rect(279, 110 + bob, 24, 17, '#8b9bbb'); rect(279, 125, 22, 11, '#66617e'); rect(280, 134, 7, standing ? 20 : 10, '#66617e'); rect(296, 134, 7, standing ? 20 : 10, '#66617e');
      if (drinking) {
        const lift = activity.frame * 2;
        rect(271, 104 - lift, 8, 14, '#8b9bbb'); rect(268, 102 - lift, 10, 5, '#e8b49b');
        rect(265, 96 - lift, 9, 9, cupColor); rect(274, 98 - lift, 3, 5, cupColor); rect(267, 95 - lift, 5, 2, '#b29a99');
      } else if (stretching) {
        const lift = activity.frame * 3;
        rect(269, 95 - lift, 7, 17, '#8b9bbb'); rect(266, 87 - lift, 7, 10, '#8b9bbb'); rect(265, 82 - lift, 7, 6, '#e8b49b');
        rect(304, 95 - lift, 7, 17, '#8b9bbb'); rect(308, 87 - lift, 7, 10, '#8b9bbb'); rect(310, 82 - lift, 7, 6, '#e8b49b');
      } else if (activity.action === 'waving') {
        rect(303, 99, 7, 18, '#8b9bbb'); rect(307 + activity.frame * 3, 88, 6, 13, '#8b9bbb'); rect(306 + activity.frame * 3, 83, 7, 6, '#e8b49b');
        rect(267, 115, 13, 6, '#8b9bbb');
      } else if (activity.action === 'watching-cat' || standing) {
        rect(271, 115, 7, 15, '#8b9bbb'); rect(268 - activity.frame * 2, 129, 7, 5, '#e8b49b');
      } else {
        const reach = packing ? activity.frame * 7 : activity.frame * 4;
        rect(264 - reach, 113 + activity.frame, 18 + reach, 6, '#8b9bbb'); rect(259 - reach, 116 + activity.frame, 6, 4, '#e8b49b');
      }
      rect(278, standing ? 153 : 143, 10, 4, '#554e65'); rect(294, standing ? 153 : 143, 12, 4, '#554e65');
      ctx.restore();
    }
    const cat = resolvePixelRoomCat(tick, moment);
    pixelRoomLastCat = { ...cat, night };
    if (cat.box) { rect(81, 140, 42, 22, '#b8906c'); rect(83, 142, 38, 3, '#d5b18a'); }
    drawPixelRoomCat(ctx, tick, closed, cat);
    if (cat.box) { rect(81, 151, 42, 11, '#bf9872'); rect(100, 153, 4, 9, '#a87c59'); }
    if (cat.blocking) { rect(302, 79, 2, 7, '#ce9c79'); rect(302, 89, 2, 2, '#ce9c79'); }
    rect(0, 164, 480, 4, '#8f7c92');
  }

  function stopPixelRoomAnimation() {
    if (pixelRoomAnimationFrame) window.cancelAnimationFrame(pixelRoomAnimationFrame);
    pixelRoomAnimationFrame = 0;
  }

  function setupPixelRoomAnimation() {
    stopPixelRoomAnimation();
    if (!pixelRoomVisibilityBound) {
      pixelRoomVisibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopPixelRoomAnimation();
        else { updatePixelRoom(); setupPixelRoomAnimation(); }
      });
    }
    if (state.settings.pixelRoomEnabled !== true || state.settings.pixelRoomAnimation === false || !state.expanded || document.hidden) return;
    const canvas = document.querySelector('#plm-floating-helper .pfh-pixel-room-canvas');
    if (!canvas || canvas.closest('.pfh-home-carousel-slide')?.getAttribute('aria-hidden') === 'true') return;
    let lastPaint = -Infinity;
    const animate = (timestamp) => {
      pixelRoomAnimationFrame = 0;
      if (!canvas.isConnected || document.hidden || !state.expanded || state.settings.pixelRoomEnabled !== true || state.settings.pixelRoomAnimation === false || canvas.closest('.pfh-home-carousel-slide')?.getAttribute('aria-hidden') === 'true') return;
      // Six crisp pixel frames per second, independent of the homepage clock.
      if (timestamp - lastPaint >= 1000 / 6) {
        lastPaint = timestamp;
        updatePixelRoom(timestamp / 1000);
      }
      pixelRoomAnimationFrame = window.requestAnimationFrame(animate);
    };
    pixelRoomAnimationFrame = window.requestAnimationFrame(animate);
  }

  function updatePixelRoom(animationSeconds) {
    if (state.settings.pixelRoomEnabled !== true || !state.expanded || document.hidden) return;
    const canvas = document.querySelector('#plm-floating-helper .pfh-pixel-room-canvas');
    if (!canvas) return;
    if (canvas.closest('.pfh-home-carousel-slide')?.getAttribute('aria-hidden') === 'true') return;
    setupPixelRoomInteractions(canvas);
    if (!pixelRoomPictureLoaded) {
      try { loadPixelRoomPicture(typeof GM_getValue === 'function' ? GM_getValue('pfh-pixel-room-picture-v1', '') : localStorage.getItem('pfh-pixel-room-picture-v1')); }
      catch (_) { pixelRoomPictureLoaded = true; }
    }
    const now = new Date(Date.now() + homeClockOffsetMs);
    let moment = pixelRoomMoment(now, state.settings.pixelRoomEndTime, pixelRoomOvertime);
    if (pixelRoomDay !== moment.day) { pixelRoomDay = moment.day; pixelRoomOvertime = false; moment = pixelRoomMoment(now, state.settings.pixelRoomEndTime, false); }
    refreshPixelRoomWeather();
    moment.outdoor = pixelRoomOutdoor(now, pixelRoomWeather);
    moment.rest = pixelRoomRest(moment, Date.now());
    const caption = canvas.parentElement.querySelector('.pfh-pixel-room-caption');
    if (caption) caption.textContent = (moment.rest.manual ? '休息一会儿 · 小牌子已挂上' : moment.rest.lunch ? '午休中 · 13:30 回来，椅子先借给猫' : moment.title) + ' · ' + moment.outdoor.label;
    const restButton = canvas.parentElement.querySelector('[data-action="pixel-room-rest"]');
    if (restButton) { restButton.textContent = moment.rest.manual ? '回来啦' : '休息一会儿'; restButton.setAttribute('aria-pressed', String(moment.rest.manual)); }
    const button = canvas.parentElement.querySelector('[data-action="pixel-room-overtime"]');
    if (button) { button.textContent = pixelRoomOvertime ? '结束加班' : '今晚加班'; button.setAttribute('aria-pressed', String(pixelRoomOvertime)); }
    canvas.setAttribute('aria-label', (moment.rest.manual ? '休息一会儿' : moment.rest.lunch ? '午休中，猫占领椅子' : moment.title) + '，' + ({ day: '白天办公', sunset: '黄昏办公', packing: '整理桌面', closed: '空房间已收工', night: '城市夜景与暖色台灯' })[moment.phase]);
    const ctx = canvas.getContext('2d');
    const tick = state.settings.pixelRoomAnimation === false ? 0 : typeof animationSeconds === 'number' ? animationSeconds : window.performance.now() / 1000;
    if (ctx) drawPixelRoom(ctx, moment, tick);
  }

  function homeClockText() {
    return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(Date.now() + homeClockOffsetMs));
  }

  function homeClockDateText() {
    const parts = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', weekday: 'long' }).formatToParts(new Date(Date.now() + homeClockOffsetMs));
    const value = (type) => (parts.find((part) => part.type === type) || {}).value || '';
    return Number(value('month')) + '月' + Number(value('day')) + '日 ' + value('weekday');
  }

  function updateHomeClock() {
    updatePixelRoom();
    const clock = document.querySelector('#plm-floating-helper .pfh-home-clock');
    if (!clock) return;
    clock.textContent = homeClockText();
    clock.setAttribute('aria-label', '汕头时间 ' + clock.textContent);
    const date = clock.parentElement && clock.parentElement.querySelector('.pfh-home-clock-date');
    if (date) date.textContent = homeClockDateText();
  }

  function syncHomeClock() {
    if (homeClockSyncing) return;
    homeClockSyncing = true;
    const startedAt = Date.now();
    const onSuccess = (dateHeader) => {
      const serverTime = Date.parse(dateHeader || '');
      if (!Number.isFinite(serverTime)) throw new Error('Missing server date');
      homeClockOffsetMs = serverTime - (startedAt + Date.now()) / 2;
      homeClockSyncedAt = Date.now();
      homeClockSyncing = false;
      updateHomeClock();
    };
    const onFailure = () => {
      homeClockSyncing = false;
      updateHomeClock();
    };
    if (typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'GET', url: cloudApiBase + '/health?clock=' + startedAt, timeout: 8000,
        onload: (response) => {
          try {
            if (response.status < 200 || response.status >= 300) throw new Error('Network time unavailable');
            onSuccess((response.responseHeaders || '').match(/^date:\s*(.+)$/im)?.[1]);
          } catch (_) { onFailure(); }
        },
        onerror: onFailure, ontimeout: onFailure,
      });
      return;
    }
    fetch(cloudApiBase + '/health?clock=' + startedAt, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('Network time unavailable'); onSuccess(response.headers.get('date')); })
      .catch(onFailure);
  }

  function setupHomeClock() {
    updateHomeClock();
    if (!homeClockTimer) homeClockTimer = window.setInterval(updateHomeClock, 1000);
    if (!homeClockSyncTimer) homeClockSyncTimer = window.setInterval(() => {
      if (state.view === 'home') syncHomeClock();
    }, 5 * 60 * 1000);
    if (!homeClockSyncedAt || Date.now() - homeClockSyncedAt > 5 * 60 * 1000) syncHomeClock();
  }

  function setupHomeCarousel(root) {
    const carousel = root.querySelector('.pfh-home-carousel');
    if (!carousel) return;
    const viewport = carousel.querySelector('.pfh-home-carousel-viewport');
    const track = carousel.querySelector('.pfh-home-carousel-track');
    const nav = carousel.querySelector('.pfh-home-carousel-nav');
    const indicator = nav && nav.querySelector('.pfh-home-carousel-indicator');
    const buttons = nav ? Array.from(nav.querySelectorAll('button')) : [];
    const slides = Array.from(carousel.querySelectorAll('.pfh-home-carousel-slide'));
    const count = slides.length;
    let slideAnimation = null;
    let indicatorAnimation = null;
    let pointer = null;
    let pauseUntil = 0;
    const move = (element, property, value, previous, animate) => {
      const from = getComputedStyle(element)[property];
      if (previous) previous.cancel();
      element.style.transition = 'none';
      element.style[property] = value;
      if (!animate) return null;
      // Explicit spring motion for this switch, independent of inherited transitions.
      if (typeof element.animate === 'function') return element.animate([{ [property]: from }, { [property]: value }], { duration: 600, easing: 'cubic-bezier(.25,1.2,.35,1)' });
      element.style[property] = from;
      element.getBoundingClientRect();
      element.style.transition = property + ' .6s cubic-bezier(.25,1.2,.35,1)';
      element.style[property] = value;
      return null;
    };
    const show = (index, animate = true) => {
      state.homeCarouselIndex = Math.max(0, Math.min(count - 1, Number(index) || 0));
      slideAnimation = move(track, 'transform', 'translate3d(-' + (state.homeCarouselIndex * 100) + '%,0,0)', slideAnimation, animate);
      if (indicator && buttons[state.homeCarouselIndex]) {
        const button = buttons[state.homeCarouselIndex];
        indicatorAnimation = move(indicator, 'left', (button.offsetLeft + (button.offsetWidth - 16) / 2) + 'px', indicatorAnimation, animate);
        buttons.forEach((item, index) => item.setAttribute('aria-pressed', String(index === state.homeCarouselIndex)));
      }
      slides.forEach((slide, slideIndex) => {
        slide.setAttribute('aria-hidden', slideIndex === state.homeCarouselIndex ? 'false' : 'true');
        slide.inert = slideIndex !== state.homeCarouselIndex;
        const collection = slide.querySelector('.pfh-home-collection');
        if (collection) animateHomeCollectionProgress(collection);
      });
      updatePixelRoom();
      setupPixelRoomAnimation();
    };
    show(state.homeCarouselIndex, false);
    buttons.forEach((button, index) => button.addEventListener('click', () => { pauseUntil = Date.now() + 12000; show(index); }));
    if (nav) nav.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      pauseUntil = Date.now() + 12000;
      show((state.homeCarouselIndex + (event.key === 'ArrowRight' ? 1 : count - 1)) % count);
      buttons[state.homeCarouselIndex].focus();
    });
    viewport.addEventListener('dragstart', (event) => { event.preventDefault(); });
    viewport.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.pfh-pixel-room-canvas')) { pauseUntil = Date.now() + 60000; return; }
      if (!event.isPrimary || event.button !== 0 || event.target.closest('button,input,textarea,select,a,[contenteditable="true"]')) return;
      if (slideAnimation) { slideAnimation.cancel(); slideAnimation = null; }
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startIndex: state.homeCarouselIndex };
      track.style.transition = 'none';
      pauseUntil = Date.now() + 12000;
      if (!event.target.closest('.pfh-home-chart-plot')) {
        try { viewport.setPointerCapture(event.pointerId); } catch (_) {}
      }
    });
    viewport.addEventListener('pointermove', (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const deltaX = event.clientX - pointer.x;
      const deltaY = event.clientY - pointer.y;
      if (Math.abs(deltaX) < Math.abs(deltaY)) return;
      if (event.cancelable) event.preventDefault();
      const edgeLimited = pointer.startIndex === 0 && deltaX > 0 || pointer.startIndex === count - 1 && deltaX < 0;
      track.style.transform = 'translate3d(calc(-' + (pointer.startIndex * 100) + '% + ' + (edgeLimited ? deltaX * 0.25 : deltaX) + 'px),0,0)';
    });
    const finishDrag = (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const deltaX = event.clientX - pointer.x;
      const deltaY = event.clientY - pointer.y;
      const cancelled = event.type === 'pointercancel' || event.type === 'lostpointercapture';
      const next = !cancelled && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) ? pointer.startIndex + (deltaX < 0 ? 1 : -1) : pointer.startIndex;
      pointer = null;
      // Commit the dragged position before restoring the spring transition.
      track.getBoundingClientRect();
      show(next);
      try { if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId); } catch (_) {}
    };
    viewport.addEventListener('pointerup', finishDrag);
    viewport.addEventListener('pointercancel', finishDrag);
    viewport.addEventListener('lostpointercapture', finishDrag);
    carousel.addEventListener('pointerenter', () => { pauseUntil = Date.now() + 2000; });
    carousel.addEventListener('focusin', () => { pauseUntil = Date.now() + 12000; });
    if (homeCarouselTimer) window.clearInterval(homeCarouselTimer);
    homeCarouselTimer = window.setInterval(() => {
      if (!carousel.isConnected || state.view !== 'home' || document.hidden || pointer || Date.now() < pauseUntil || carousel.matches(':hover') || carousel.contains(document.activeElement)) return;
      if (state.settings.pixelRoomEnabled === true && slides[state.homeCarouselIndex]?.querySelector('.pfh-pixel-room-canvas')) return;
      show((state.homeCarouselIndex + 1) % count);
    }, 8000);
  }

  function profileTaskProgress(status, explicitProgress) {
    if (Number.isFinite(Number(explicitProgress)) && Number(explicitProgress) > 0) {
      const value = Number(explicitProgress) <= 1 ? Number(explicitProgress) * 100 : Number(explicitProgress);
      return Math.max(4, Math.min(100, Math.round(value)));
    }
    const text = String(status || '');
    if (/成功|完成|ready|downloaded/i.test(text)) return 100;
    if (/进行中|上传中|生成中|preparing|processing/i.test(text)) return 56;
    if (/待|已齐|pending/i.test(text)) return 18;
    return 7;
  }

  function profileTaskItems() {
    const tasks = [];
    (state.magicUploadQueue || []).filter((task) => task && task.status !== 'success').forEach((task) => tasks.push({
      action: 'home-magic-upload',
      icon: 'upload',
      title: (task.sku || '待确认 SKU') + ' · 魔法上传',
      status: magicUploadStatusLabel(task),
      progress: profileTaskProgress(task.status, task.progress),
      tone: task.status === 'error' ? 'error' : (task.status === 'processing' ? 'active' : ''),
    }));
    (state.uploadQueue || []).filter((task) => task && !/成功/.test(task.status || '')).forEach((task) => tasks.push({
      action: 'upload-toggle',
      icon: 'upload',
      title: (task.sku || '待确认 SKU') + ' · 提审上传',
      status: task.step || task.status || '等待处理',
      progress: profileTaskProgress(task.step || task.status),
      tone: /失败|缺/.test((task.step || '') + (task.status || '')) ? 'error' : (/进行中|上传中/.test((task.step || '') + (task.status || '')) ? 'active' : ''),
    }));
    (state.batchExcelQueue || []).filter((task) => task && task.status !== 'downloaded').forEach((task) => tasks.push({
      action: 'home-batch-excel',
      icon: 'batchExcel',
      title: task.sku + ' · 批量生成 Excel',
      status: task.status === 'ready' ? '已准备，可下载' : (task.status === 'preparing' ? '正在补全缓存' : (task.status === 'error' ? '生成失败' : '等待处理')),
      progress: profileTaskProgress(task.status),
      tone: task.status === 'error' ? 'error' : (task.status === 'preparing' ? 'active' : (task.status === 'ready' ? 'done' : '')),
    }));
    return tasks.slice(0, 4);
  }


  function getHomeFeatureGroups() {
    const groups = normalizeHomeFeatureGroups(state.settings && state.settings.homeFeatureGroups);
    if (state.settings) state.settings.homeFeatureGroups = groups;
    return groups;
  }

  function saveHomeFeatureGroups(groups) {
    const normalized = normalizeHomeFeatureGroups(groups);
    state.settings.homeFeatureGroups = normalized;
    saveSettings(state.settings);
    return normalized;
  }

  function moveHomeFeatureCard(featureId, targetGroup, targetCard, event) {
    const id = String(featureId || '').trim();
    const group = targetGroup === 'more' ? 'more' : 'common';
    if (!id || !HOME_FEATURE_DEFINITIONS.some((item) => item.id === id)) return false;
    const groups = getHomeFeatureGroups();
    const targetId = targetCard && targetCard.getAttribute('data-home-feature-id');
    const source = groups.common.includes(id) ? 'common' : (groups.more.includes(id) ? 'more' : '');
    if (!source) return false;
    groups.common = groups.common.filter((item) => item !== id);
    groups.more = groups.more.filter((item) => item !== id);
    const targetList = groups[group];
    let index = targetList.length;
    const targetIndex = targetList.indexOf(targetId);
    if (targetIndex >= 0) {
      const rect = targetCard.getBoundingClientRect();
      index = targetIndex + (event && Number(event.clientY) > rect.top + rect.height / 2 ? 1 : 0);
    }
    targetList.splice(Math.max(0, Math.min(index, targetList.length)), 0, id);
    saveHomeFeatureGroups(groups);
    state.homeFeatureDragId = '';
    renderShell();
    return true;
  }

  function moveProductDevelopmentFeatureCard(featureId, targetGroup, targetCard, event) {
    const id = String(featureId || '').trim();
    const group = targetGroup === 'more' ? 'more' : 'common';
    if (!PRODUCT_DEVELOPMENT_HOME_FEATURE_IDS.includes(id)) return false;
    const groups = getProductDevelopmentFeatureGroups();
    const targetId = targetCard && targetCard.getAttribute('data-home-feature-id');
    const source = groups.common.includes(id) ? 'common' : (groups.more.includes(id) ? 'more' : '');
    if (!source) return false;
    groups.common = groups.common.filter((item) => item !== id);
    groups.more = groups.more.filter((item) => item !== id);
    const targetList = groups[group];
    let index = targetList.length;
    const targetIndex = targetList.indexOf(targetId);
    if (targetIndex >= 0) {
      const rect = targetCard.getBoundingClientRect();
      index = targetIndex + (event && Number(event.clientY) > rect.top + rect.height / 2 ? 1 : 0);
    }
    targetList.splice(Math.max(0, Math.min(index, targetList.length)), 0, id);
    saveProductDevelopmentFeatureGroups(groups);
    state.homeFeatureDragId = '';
    renderShell();
    return true;
  }

  function getHomeFeatureEntries() {
    const magicLocked = !state.magicUploadAccessEnabled;
    const parameterImageLocked = !state.parameterImageAccessEnabled;
    return HOME_FEATURE_DEFINITIONS.map((definition) => {
      const entry = { ...definition };
      if (entry.id === 'magicUpload') {
        entry.description = magicLocked
          ? (state.magicUploadAccessLoading ? '正在准备功能' : '该功能暂未开放')
          : definition.description;
        entry.disabled = magicLocked;
      }
      if (entry.id === 'parameterImage') {
        entry.description = parameterImageLocked
          ? (state.parameterImageAccessLoading ? '正在准备功能' : '该功能暂未开放')
          : definition.description;
        entry.disabled = parameterImageLocked;
      }
      if (entry.id === 'freeSizeImage') {
        entry.description = !state.sizeImageAccessEnabled
          ? (state.sizeImageAccessLoading ? '正在准备功能' : '该功能暂未开放')
          : definition.description;
        entry.disabled = !state.sizeImageAccessEnabled;
      }
      return entry;
    });
  }


  function homeFeatureEntryHtml(entry, className, options) {
    const settings = options || {};
    const editing = Boolean(settings.editing);
    const disabled = Boolean(entry.disabled);
    const group = String(settings.group || '');
    const tag = editing ? 'div' : 'button';
    const attrs = editing
      ? ' draggable="true" data-home-feature-card="true" data-home-feature-id="' + escapeHtml(entry.id) + '" data-home-feature-group="' + escapeHtml(group) + '" role="listitem" tabindex="0" aria-label="拖动调整' + escapeHtml(entry.title) + '的位置"'
      : ' type="button" data-action="' + escapeHtml(entry.action) + '"';
    const editHandle = editing ? '<span class="pfh-home-entry-drag-handle" aria-hidden="true">⋮⋮</span>' : '';
    return '<' + tag + ' class="pfh-home-entry ' + (className || '') + (disabled || entry.accessLocked ? ' is-disabled' : '') + (editing ? ' is-editing-card' : '') + '"' + attrs + (disabled && !editing ? ' disabled aria-disabled="true"' : '') + '>' +
      (entry.id === 'detail' ? '' : '<span class="pfh-home-entry-icon">' + iconHtml(entry.icon) + '</span>') +
      '<span class="pfh-home-entry-copy"><strong>' + escapeHtml(entry.title) + '</strong><small class="pfh-home-entry-description">' + escapeHtml(entry.description) + '</small></span>' +
      (!editing && entry.id === 'detail' ? '<span class="pfh-home-entry-detail-cta">进入详情</span>' : '') +
      (entry.badge ? '<i class="pfh-home-entry-badge">' + escapeHtml(entry.badge) + '</i>' : '') +
      (entry.meta ? '<em class="pfh-home-entry-meta">' + escapeHtml(entry.meta) + '</em>' : '') +
      editHandle +
      '</' + tag + '>';
  }

  function normalizeProductDevelopmentFeatureGroups(value) {
    const source = value && typeof value === 'object' ? value : {};
    const known = new Set(PRODUCT_DEVELOPMENT_HOME_FEATURE_IDS);
    const seen = new Set();
    const groups = { common: [], more: [] };
    const append = (group, item) => {
      const id = String(item || '').trim();
      if (!known.has(id) || seen.has(id)) return;
      seen.add(id);
      groups[group].push(id);
    };
    (Array.isArray(source.common) ? source.common : []).forEach((id) => append('common', id));
    (Array.isArray(source.more) ? source.more : []).forEach((id) => append('more', id));
    DEFAULT_PRODUCT_DEVELOPMENT_FEATURE_GROUPS.common.forEach((id) => append('common', id));
    DEFAULT_PRODUCT_DEVELOPMENT_FEATURE_GROUPS.more.forEach((id) => append('more', id));
    return groups;
  }

  function getProductDevelopmentFeatureGroups() {
    const groups = normalizeProductDevelopmentFeatureGroups(state.settings && state.settings.productDevelopmentFeatureGroups);
    if (state.settings) state.settings.productDevelopmentFeatureGroups = groups;
    return groups;
  }

  function saveProductDevelopmentFeatureGroups(groups) {
    const normalized = normalizeProductDevelopmentFeatureGroups(groups);
    state.settings.productDevelopmentFeatureGroups = normalized;
    saveSettings(state.settings);
    return normalized;
  }

  function productDevelopmentHomeFeatureEntries() {
    return PRODUCT_DEVELOPMENT_FEATURES.map((feature) => ({
      id: 'product-development-' + feature.id,
      action: feature.action || 'product-development-placeholder',
      icon: feature.icon,
      title: feature.title,
      description: feature.subtitle,
      disabled: !feature.action,
      accessLocked: Boolean(productDevelopmentFeatureForView(feature.id) && !productDevelopmentHasAccess(productDevelopmentFeatureForView(feature.id))),
    }));
  }

  function productDevelopmentHomeFeatureEditHtml(entries) {
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    const groups = getProductDevelopmentFeatureGroups();
    const common = groups.common.map((id) => byId.get(id)).filter(Boolean);
    const more = groups.more.map((id) => byId.get(id)).filter(Boolean);
    return '<div class="pfh-home-feature-edit-groups">' +
      homeFeatureEditGroupHtml('开发常用功能', '上面区域会优先展示', common, 'common') +
      homeFeatureEditGroupHtml('其他开发功能', '不常用入口放在这里', more, 'more') +
      '</div>';
  }

  function productDevelopmentHomeFeaturePageHtml() {
    const featureEntries = productDevelopmentHomeFeatureEntries();
    if (state.homeFeatureEditMode) {
      return '<div class="pfh-home-feature-page pfh-home-feature-page-product">' + productDevelopmentHomeFeatureEditHtml(featureEntries) + '</div>';
    }
    const byId = new Map(featureEntries.map((entry) => [entry.id, entry]));
    const groups = getProductDevelopmentFeatureGroups();
    const commonEntries = groups.common.map((id) => byId.get(id)).filter(Boolean);
    const secondaryEntries = groups.more.map((id) => byId.get(id)).filter(Boolean);
    const primary = commonEntries[0] || null;
    const quickEntries = commonEntries.slice(1);

    return '<div class="pfh-home-feature-page pfh-home-feature-page-product">' +
      '<div class="pfh-home-feature-layout">' + (primary ? homeFeatureEntryHtml(primary, 'pfh-home-entry-primary') : '<div class="pfh-home-feature-empty">暂无开发入口</div>') + '<div class="pfh-home-quick-grid">' + quickEntries.map((entry) => homeFeatureEntryHtml(entry, 'pfh-home-entry-quick')).join('') + '</div></div>' +
      '<div class="pfh-home-secondary-label">其他开发功能</div><div class="pfh-home-secondary-grid">' + secondaryEntries.map((entry) => homeFeatureEntryHtml(entry, 'pfh-home-entry-secondary')).join('') + '</div>' +
      '</div>';
  }

  function playProductDevelopmentHomeFeatureRailAnimation(track, nextIsProduct, hasModeChange) {
    if (!track || !hasModeChange) return;
    track.classList.remove('is-to-product', 'is-to-daily');
    const previousAnimation = track.__pfhHomeFeatureRailAnimation;
    if (previousAnimation && typeof previousAnimation.cancel === 'function') {
      try { previousAnimation.cancel(); } catch (_) {}
    }
    track.__pfhHomeFeatureRailAnimation = null;
    const dragStartTransform = String(track.__pfhHomeFeatureRailStartTransform || '').trim();
    track.__pfhHomeFeatureRailStartTransform = '';
    const from = dragStartTransform || (nextIsProduct ? 'translateX(0)' : 'translateX(-100%)');
    const to = nextIsProduct ? 'translateX(-100%)' : 'translateX(0)';
    const easing = 'cubic-bezier(.25, 1.2, .35, 1)';
    if (typeof track.animate === 'function') {
      if (dragStartTransform) track.style.removeProperty('transform');
      const animation = track.animate(
        [{ transform: from }, { transform: to }],
        { duration: 620, easing, fill: 'both' },
      );
      track.__pfhHomeFeatureRailAnimation = animation;
      const cleanup = () => {
        if (track.__pfhHomeFeatureRailAnimation !== animation) return;
        track.__pfhHomeFeatureRailAnimation = null;
        if (dragStartTransform) track.style.removeProperty('transform');
        try { animation.cancel(); } catch (_) {}
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
      return;
    }
    track.style.setProperty('transition', 'none');
    track.style.setProperty('transform', from);
    void track.offsetWidth;
    track.style.setProperty('transition', 'transform .62s cubic-bezier(.25, 1.2, .35, 1)');
    track.style.setProperty('transform', to);
    window.setTimeout(() => {
      if (!track.isConnected) return;
      track.style.removeProperty('transform');
      track.style.removeProperty('transition');
    }, 700);
  }

  function updateProductDevelopmentHomeModeDom(mode) {
    const next = normalizeProductDevelopmentWorkMode(mode);
    const panel = document.getElementById(PANEL_ID);
    const track = panel && panel.querySelector('.pfh-home-feature-track');
    if (!track) return false;
    const nextIsProduct = next === 'product-development';
    const wasProduct = track.classList.contains('is-product-development');
    const hasModeChange = wasProduct !== nextIsProduct;
    track.style.setProperty('transition', 'none');
    track.classList.toggle('is-product-development', nextIsProduct);
    track.classList.toggle('is-daily', !nextIsProduct);
    void track.offsetWidth;
    track.style.removeProperty('transition');
    playProductDevelopmentHomeFeatureRailAnimation(track, nextIsProduct, hasModeChange);
    const title = panel.querySelector('[data-work-mode-title]');
    if (title) title.textContent = nextIsProduct ? '开发功能' : '常用功能';
    const actions = panel.querySelector('.pfh-home-feature-actions');
    if (actions) actions.innerHTML = nextIsProduct
      ? '<span>可自定义开发入口</span><button type="button" data-action="home-feature-edit-toggle">编辑</button>'
      : '<span>可自定义常用入口</span><button type="button" data-action="home-feature-edit-toggle">编辑</button>';
    panel.classList.toggle('is-product-development', nextIsProduct);
    panel.querySelectorAll('.pfh-work-mode-switch button[data-work-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-work-mode') === next);
    });
    return true;
  }

  function homeFeatureEditGroupHtml(label, description, entries, group) {
    const cards = entries.length
      ? entries.map((entry) => homeFeatureEntryHtml(entry, 'pfh-home-entry-edit', { editing: true, group })).join('')
      : '<div class="pfh-home-feature-dropzone">把功能卡片拖到这里</div>';
    return '<section class="pfh-home-feature-edit-group" data-home-feature-group="' + escapeHtml(group) + '">' +
      '<header><b>' + escapeHtml(label) + '</b><small>' + escapeHtml(description) + '</small></header>' +
      '<div class="pfh-home-feature-edit-list">' + cards + '</div>' +
      '</section>';
  }

  function homeGreetingMinutes(value) {
    const parts = String(value || '').split(':');
    if (parts.length !== 2) return -1;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    return Number.isInteger(hours) && hours >= 0 && hours < 24 && Number.isInteger(minutes) && minutes >= 0 && minutes < 60
      ? hours * 60 + minutes
      : -1;
  }

  function homeGreetingMatches(item, minutesNow) {
    if (!item || !item.enabled) return false;
    const start = homeGreetingMinutes(item.startTime);
    const end = homeGreetingMinutes(item.endTime);
    if (start < 0 || end < 0) return false;
    if (start === end) return true;
    return start < end ? minutesNow >= start && minutesNow < end : minutesNow >= start || minutesNow < end;
  }

  function currentHomeGreeting(now) {
    const date = now instanceof Date ? now : new Date();
    const minutesNow = date.getHours() * 60 + date.getMinutes();
    const configured = (Array.isArray(state.homeGreetings) ? state.homeGreetings : [])
      .map(normalizeHomeGreetingItem)
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.greetingId.localeCompare(b.greetingId));
    return configured.find((item) => homeGreetingMatches(item, minutesNow))
      || DEFAULT_HOME_GREETINGS.find((item) => homeGreetingMatches(item, minutesNow))
      || DEFAULT_HOME_GREETINGS[0];
  }

  function homeCollectionCardHtml() {
    const task = state.catalogCollection || {};
    const phase = task.phase || 'idle';
    const labels = { idle: '未开始', reading: '正在读取', waiting: '等待下一批', paused: '已暂停', saving: '正在保存', done: '已完成', error: '已停止' };
    const count = Number(task.count) || 0, total = Number(task.total) || 0;
    const percent = total ? Math.min(100, Math.round(count / total * 100)) : 0;
    const running = Boolean(state.catalogSyncRunning);
    const note = phase === 'error' ? '本轮未写入，已有缓存保留。' + (task.error || '')
      : phase === 'done' ? '已保存 ' + task.unique + ' 个 SKU，新增 ' + task.added + ' 个。'
      : phase === 'paused' ? '当前请求返回后停止翻页；继续时从下一页读取。'
      : '每批 20 条，批次间隔 2–3 秒；异常即停止，不自动重试。';
    const progressClass = 'ux pfh-lucian u083 pfh-home-collection-progress' + (total || !running || state.catalogSyncPaused ? ' is-det' : '') + (phase === 'done' ? ' is-done' : '') + (state.catalogSyncPaused || !running ? ' is-paused' : '');
    return '<article class="pfh-home-panel pfh-home-collection" aria-label="采集详情"><header><div class="pfh-home-collection-heading"><h3>采集详情</h3><small>同步全部产品列表缓存</small></div><span data-collection-status role="status">' + escapeHtml(labels[phase] || labels.idle) + '</span></header>' +
      '<div class="pfh-home-collection-summary"><strong>全部产品</strong><span>' + count + ' / ' + (total || '—') + ' 条 · 已读 ' + (Number(task.page) || 0) + ' 页</span></div>' +
      '<div class="' + progressClass + '"><div class="u083-trk" role="progressbar" aria-label="全部产品采集进度" aria-valuemin="0" aria-valuemax="100"' + (total || !running ? ' aria-valuenow="' + percent + '"' : '') + '><span class="u083-seg a" aria-hidden="true"></span><span class="u083-seg b" aria-hidden="true"></span><span class="u083-fill" style="--p:' + (percent / 100) + '" aria-hidden="true"></span></div><div class="u083-meta"><span class="u083-l">' + escapeHtml(labels[phase] || labels.idle) + '</span><span class="u083-r">' + (total || !running ? percent + '%' : '准备中') + '</span></div></div>' +
      '<p>' + escapeHtml(note) + '</p><footer><small>只读取列表基础信息，不逐个打开产品详情。</small>' +
      (running ? '<button type="button" data-action="catalog-collection-toggle" aria-pressed="' + String(Boolean(state.catalogSyncPaused)) + '"' + (phase === 'saving' ? ' disabled' : '') + '>' + (state.catalogSyncPaused ? '继续采集' : '暂停采集') + '</button>'
        : '<button type="button" data-action="sku-sync-all">' + (phase === 'error' ? '重新采集' : phase === 'done' ? '再次采集' : '开始采集') + '</button>') + '</footer></article>';
  }

  function refreshHomeCollectionCard() {
    document.querySelectorAll('#' + PANEL_ID + ' [data-catalog-pause]').forEach(button => {
      button.hidden = !state.catalogSyncRunning;
      button.disabled = state.catalogCollection && state.catalogCollection.phase === 'saving';
      button.textContent = state.catalogSyncPaused ? '继续采集' : '暂停采集';
    });
    const card = document.querySelector('#' + PANEL_ID + ' .pfh-home-collection');
    if (!card) return;
    const template = document.createElement('template'); template.innerHTML = homeCollectionCardHtml();
    const next = template.content.firstElementChild;
    // Keep the action node stable while progress updates arrive.
    ['[data-collection-status]', '.pfh-home-collection-summary', 'p', 'footer small'].forEach(selector => {
      const current = card.querySelector(selector), updated = next.querySelector(selector);
      if (current && updated) current.innerHTML = updated.innerHTML;
    });
    const progress = card.querySelector('.pfh-home-collection-progress'), updatedProgress = next.querySelector('.pfh-home-collection-progress');
    const fill = progress.querySelector('.u083-fill');
    const previous = fill.style.getPropertyValue('--p');
    progress.className = updatedProgress.className;
    fill.style.setProperty('--p', updatedProgress.querySelector('.u083-fill').style.getPropertyValue('--p'));
    progress.querySelector('.u083-meta').innerHTML = updatedProgress.querySelector('.u083-meta').innerHTML;
    const track = progress.querySelector('.u083-trk'), updatedTrack = updatedProgress.querySelector('.u083-trk');
    if (updatedTrack.hasAttribute('aria-valuenow')) track.setAttribute('aria-valuenow', updatedTrack.getAttribute('aria-valuenow')); else track.removeAttribute('aria-valuenow');
    animateHomeCollectionProgress(card, previous);
    const button = card.querySelector('footer button'), updated = next.querySelector('footer button');
    if (button && updated) {
      button.textContent = updated.textContent; button.disabled = updated.disabled;
      button.dataset.action = updated.dataset.action;
      if (updated.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', updated.getAttribute('aria-pressed'));
      else button.removeAttribute('aria-pressed');
    }
  }

  // Lucian UX/UI Prompt #083 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#083
  function animateHomeCollectionProgress(card, previous) {
    const progress = card && card.querySelector('.pfh-home-collection-progress');
    if (!progress) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hidden = card.closest('.pfh-home-carousel-slide')?.getAttribute('aria-hidden') === 'true';
    const unknown = !progress.classList.contains('is-det') && !progress.classList.contains('is-paused');
    const fill = progress.querySelector('.u083-fill');
    if (fill.pfhProgressAnimation && (reduced || hidden || (previous != null && previous !== fill.style.getPropertyValue('--p')))) { fill.pfhProgressAnimation.cancel(); fill.pfhProgressAnimation = null; }
    if (!reduced && !hidden && previous != null && previous !== fill.style.getPropertyValue('--p') && fill.animate) {
      fill.pfhProgressAnimation = fill.animate([{ transform: 'scaleX(' + (Number(previous) || 0) + ')' }, { transform: 'scaleX(' + (Number(fill.style.getPropertyValue('--p')) || 0) + ')' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    progress.querySelectorAll('.u083-seg').forEach((segment, index) => {
      if (reduced || hidden || !unknown) {
        if (segment.pfhProgressAnimation) { segment.pfhProgressAnimation.cancel(); segment.pfhProgressAnimation = null; }
      } else if (!segment.pfhProgressAnimation && segment.animate) {
        segment.pfhProgressAnimation = segment.animate(index ? [{ left: '-200%', right: '100%' }, { left: '107%', right: '-8%', offset: .6 }, { left: '107%', right: '-8%' }] : [{ left: '-35%', right: '100%' }, { left: '100%', right: '-90%', offset: .6 }, { left: '100%', right: '-90%' }], { duration: 1600, delay: index ? 550 : 0, iterations: Infinity, easing: index ? 'cubic-bezier(.25,.6,.4,1)' : 'cubic-bezier(.65,.05,.35,1)' });
      }
    });
  }

  function homeViewHtml(statusText) {
    if (state.workMode === 'product-development' && state.productDevelopmentView !== 'home') return productDevelopmentViewHtml(statusText);
    const period = 7;
    const stats = homeDashboardStats(period);
    const chart = homeChartGeometry(stats.values);
    const now = new Date(Date.now() + homeClockOffsetMs);
    const greeting = currentHomeGreeting(now);
    const dateText = homeClockDateText();
    const delta = stats.today - stats.yesterday;
    const deltaPercent = stats.yesterday ? Math.round(Math.abs(delta) / stats.yesterday * 100) : 0;
    const compareClass = delta > 0 ? ' is-up' : (delta < 0 ? ' is-down' : '');
    const compareBadge = delta > 0 ? '↗ ' + deltaPercent + '%' : (delta < 0 ? '↘ ' + deltaPercent + '%' : '持平');
    const compareText = stats.yesterday ? '比昨天' + (delta > 0 ? '多 ' + delta : (delta < 0 ? '少 ' + Math.abs(delta) : '相同')) + ' 个' : '昨日暂无新任务';
    const homeFeatureEntries = getHomeFeatureEntries();
    const homeFeatureById = new Map(homeFeatureEntries.map((entry) => [entry.id, entry]));
    const homeFeatureGroups = getHomeFeatureGroups();
    const commonEntries = homeFeatureGroups.common.map((id) => homeFeatureById.get(id)).filter(Boolean);
    const secondaryEntries = homeFeatureGroups.more.map((id) => homeFeatureById.get(id)).filter(Boolean);
    const primary = commonEntries[0] || null;
    const quickEntries = commonEntries.slice(1);
    const isProductDevelopment = state.workMode === 'product-development';
    const featureEditActions = '<div class="pfh-home-feature-actions">' +
      (isProductDevelopment
        ? (state.homeFeatureEditMode ? '<span>拖动卡片调整位置</span><button type="button" data-action="home-feature-edit-toggle" class="is-done">完成</button>' : '<span>可自定义开发入口</span><button type="button" data-action="home-feature-edit-toggle">编辑</button>')
        : (state.homeFeatureEditMode ? '<span>拖动卡片调整位置</span><button type="button" data-action="home-feature-edit-toggle" class="is-done">完成</button>' : '<span>可自定义常用入口</span><button type="button" data-action="home-feature-edit-toggle">编辑</button>')) +
      '</div>';
    const dailyFeaturePage = '<div class="pfh-home-feature-page pfh-home-feature-page-daily">' +
      (state.homeFeatureEditMode
        ? '<div class="pfh-home-feature-edit-groups">' + homeFeatureEditGroupHtml('常用功能', '上面区域会优先展示', commonEntries, 'common') + homeFeatureEditGroupHtml('更多功能', '不常用入口放在这里', secondaryEntries, 'more') + '</div>'
        : '<div class="pfh-home-feature-layout">' + (primary ? homeFeatureEntryHtml(primary, 'pfh-home-entry-primary') : '<div class="pfh-home-feature-empty">暂无常用入口</div>') + '<div class="pfh-home-quick-grid">' + quickEntries.map((entry) => homeFeatureEntryHtml(entry, 'pfh-home-entry-quick')).join('') + '</div></div><div class="pfh-home-secondary-label">更多功能</div><div class="pfh-home-secondary-grid">' + secondaryEntries.map((entry) => homeFeatureEntryHtml(entry, 'pfh-home-entry-secondary')).join('') + '</div>') +
      '</div>';
    const featureTrackClass = 'pfh-home-feature-track ' + (isProductDevelopment ? 'is-product-development' : 'is-daily') + (state.homeModeTransition ? ' is-' + escapeHtml(state.homeModeTransition) : '');
    const chartSummary = '近 ' + period + ' 日共新分配 ' + stats.total + ' 个任务';
    const carouselModules = [
      { id: 'trend', label: state.settings.pixelRoomEnabled === true ? '窗边日常' : '新任务趋势', html: state.settings.pixelRoomEnabled === true ? pixelRoomCardHtml() : homeTrendCardHtml(stats, chart, period, chartSummary) },
      { id: 'todo', label: '待办项', html: homeTodoCardHtml() },
    ];
    const carouselSlides = carouselModules.map((module) => '<div class="pfh-home-carousel-slide" data-module-id="' + module.id + '" data-module-label="' + escapeHtml(module.label) + '">' + module.html + '</div>').join('');
    const status = statusText || greeting.subtitle || '常用功能与今日进度集中在这里';
    const modeSwitch = productDevelopmentModeSwitchHtml();
    return '<div class="pfh-detail-scroll pfh-home-scroll"><section class="pfh-home-dashboard">' +
      '<header class="pfh-home-welcome"><div class="pfh-home-welcome-main"><div class="pfh-home-clock-block"><span class="pfh-home-clock-date">' + escapeHtml(dateText) + '</span><time class="pfh-home-clock" role="timer" aria-label="汕头时间">' + escapeHtml(homeClockText()) + '</time></div><div class="pfh-home-welcome-copy"><h2><span class="pfh-home-greeting-title">' + escapeHtml(greeting.title) + '</span></h2><p><span class="pfh-home-goal">' + escapeHtml(status) + '</span></p></div></div>' + modeSwitch + '</header>' +
      cloudRecoveryNoticeHtml() +
      '<div class="pfh-home-analytics">' +
        '<article class="pfh-home-metric"><small>今日新分配</small><div><strong>' + stats.today + '</strong><span>个任务</span></div><p class="pfh-home-compare' + compareClass + '"><b>' + escapeHtml(compareBadge) + '</b><span>' + escapeHtml(compareText) + '</span></p><footer><span><small>昨日</small><b>' + stats.yesterday + '</b></span><span><small>今日已定稿</small><b>' + stats.finalizedToday + '</b></span><span><small>完成率</small><b>' + (stats.today ? stats.completionRate + '%' : '--') + '</b></span></footer></article>' +
        '<div class="pfh-home-carousel"><div class="pfh-home-carousel-viewport"><div class="pfh-home-carousel-track">' + carouselSlides + '</div></div><nav class="pfh-home-carousel-nav" aria-label="主页模块切换"><span class="pfh-home-carousel-indicator" aria-hidden="true"></span>' + carouselModules.map((module, index) => '<button type="button" aria-label="' + escapeHtml(module.label) + '" aria-pressed="' + String(index === state.homeCarouselIndex) + '"></button>').join('') + '</nav></div>' +
      '</div>' +
      '<div class="pfh-home-lower">' +
        '<section class="pfh-home-panel pfh-home-feature-panel' + (state.homeFeatureEditMode ? ' is-editing' : '') + (isProductDevelopment ? ' is-product-development' : '') + '"><div class="pfh-home-panel-title"><h3 data-work-mode-title>' + (isProductDevelopment ? '开发功能' : '常用功能') + '</h3>' + featureEditActions + '</div>' +
          '<div class="pfh-home-feature-viewport"><div class="' + featureTrackClass + '">' + dailyFeaturePage + productDevelopmentHomeFeaturePageHtml() + '</div></div>' +
          '</section>' +
      '</div>' +
      '</section></div>';
  }
