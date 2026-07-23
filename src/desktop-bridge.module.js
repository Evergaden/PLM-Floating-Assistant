  const DESKTOP_BRIDGE_URL = 'ws://127.0.0.1:37191';
  const DESKTOP_BRIDGE_TOKEN_KEY = 'plm_desktop_bridge_token';
  let desktopBridgeSocket = null;
  let desktopBridgeReconnectTimer = 0;
  let desktopBridgeStatus = '未配对';
  let desktopBridgeExcelQueue = Promise.resolve();

  function getDesktopBridgeToken() {
    try {
      return String(GM_getValue(DESKTOP_BRIDGE_TOKEN_KEY, '') || '').trim();
    } catch (_) {
      return '';
    }
  }

  function setDesktopBridgeToken(token) {
    const value = String(token || '').trim();
    if (typeof GM_setValue === 'function') GM_setValue(DESKTOP_BRIDGE_TOKEN_KEY, value);
    return value;
  }

  function isDesktopBridgeConnected() {
    return Boolean(desktopBridgeSocket && desktopBridgeSocket.readyState === WebSocket.OPEN);
  }

  function setDesktopBridgeStatus(text) {
    desktopBridgeStatus = String(text || '');
    const status = document.querySelector('#' + PANEL_ID + ' .pfh-desktop-bridge-status');
    if (status) status.textContent = desktopBridgeStatus;
  }

  function desktopBridgeSettingsHtml() {
    const token = getDesktopBridgeToken();
    return '<div class="pfh-settings-card"><div class="pfh-settings-card-head"><strong>桌面工作台</strong><span>' +
      escapeHtml(isDesktopBridgeConnected() ? '已连接' : '本机直连') +
      '</span></div><label class="pfh-cloud-key"><span>工作台连接码</span><input type="text" name="plm-desktop-pairing-code" class="pfh-desktop-bridge-token" value="' +
      escapeHtml(token) +
      '" placeholder="从 PLM 产品资产工作台复制连接码" autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other" data-lpignore="true" data-1p-ignore="true" style="-webkit-text-security:disc"></label>' +
      '<div class="pfh-about-actions"><button type="button" data-action="desktop-bridge-connect">连接工作台</button>' +
      '<button type="button" data-action="desktop-bridge-disconnect">断开</button>' +
      '<span class="pfh-desktop-bridge-status">' + escapeHtml(desktopBridgeStatus) + '</span></div></div>';
  }

  function pairDesktopBridge(token) {
    const value = setDesktopBridgeToken(token);
    if (value.length < 32) {
      setDesktopBridgeStatus('连接码无效');
      showToast('桌面工作台连接码无效');
      return false;
    }
    connectDesktopBridge(true);
    return true;
  }

  function disconnectDesktopBridge(clearToken) {
    window.clearTimeout(desktopBridgeReconnectTimer);
    desktopBridgeReconnectTimer = 0;
    if (clearToken) setDesktopBridgeToken('');
    const socket = desktopBridgeSocket;
    desktopBridgeSocket = null;
    if (socket) {
      socket.onclose = null;
      try { socket.close(); } catch (_) {}
    }
    setDesktopBridgeStatus(clearToken ? '未配对' : '已断开');
  }

  function connectDesktopBridge(showFeedback) {
    const token = getDesktopBridgeToken();
    if (token.length < 32) {
      setDesktopBridgeStatus('未配对');
      return;
    }
    if (desktopBridgeSocket && (
      desktopBridgeSocket.readyState === WebSocket.OPEN ||
      desktopBridgeSocket.readyState === WebSocket.CONNECTING
    )) return;
    window.clearTimeout(desktopBridgeReconnectTimer);
    setDesktopBridgeStatus('正在连接…');
    try {
      const socket = new WebSocket(DESKTOP_BRIDGE_URL);
      desktopBridgeSocket = socket;
      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: 'hello',
          token,
          version: SCRIPT_VERSION,
          userName: findCurrentPlmUserName() || '',
        }));
        setDesktopBridgeStatus('已连接桌面工作台');
        if (showFeedback) showToast('桌面工作台已连接');
      };
      socket.onmessage = (event) => handleDesktopBridgeMessage(event.data);
      socket.onerror = () => setDesktopBridgeStatus('连接失败，请确认工作台已打开');
      socket.onclose = () => {
        if (desktopBridgeSocket === socket) desktopBridgeSocket = null;
        setDesktopBridgeStatus('工作台未连接');
        desktopBridgeReconnectTimer = window.setTimeout(() => connectDesktopBridge(false), 5000);
      };
    } catch (error) {
      setDesktopBridgeStatus('连接失败：' + formatErrorMessage(error));
      desktopBridgeReconnectTimer = window.setTimeout(() => connectDesktopBridge(false), 5000);
    }
  }

  function startDesktopBridge() {
    desktopBridgeStatus = getDesktopBridgeToken() ? '等待连接工作台' : '未配对';
    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('连接 PLM 产品资产工作台', () => {
        const value = window.prompt('粘贴桌面工作台显示的连接码', getDesktopBridgeToken());
        if (value !== null) pairDesktopBridge(value);
      });
    }
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.PLMDesktopBridge = {
        pair: pairDesktopBridge,
        disconnect: () => disconnectDesktopBridge(true),
        status: () => ({ connected: isDesktopBridgeConnected(), status: desktopBridgeStatus }),
      };
    }
    connectDesktopBridge(false);
  }

  function handleDesktopBridgeMessage(raw) {
    let message;
    try {
      message = JSON.parse(String(raw || ''));
    } catch (_) {
      return;
    }
    if (message.type === 'snapshot.request') {
      sendDesktopBridgeSnapshot();
      return;
    }
    if (message.type === 'excel.generate') {
      desktopBridgeExcelQueue = desktopBridgeExcelQueue
        .then(() => generateDesktopBridgeExcel(message))
        .catch((error) => {
          sendDesktopBridgeMessage({
            type: 'excel.error',
            jobId: String(message.jobId || ''),
            sku: String(message.sku || ''),
            message: formatErrorMessage(error),
          });
        });
      return;
    }
    if (message.type === 'ping') sendDesktopBridgeMessage({ type: 'pong', at: Date.now() });
  }

  function sendDesktopBridgeMessage(message) {
    if (!isDesktopBridgeConnected()) return false;
    desktopBridgeSocket.send(JSON.stringify(message));
    return true;
  }

  function collectDesktopFinalizedProducts() {
    syncDailyLedgerBeforeMutation();
    const rows = sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger())
      .filter((item) => item.finalizedAt && item.status !== '作废')
      .sort((a, b) => Number(b.finalizedAtMs || 0) - Number(a.finalizedAtMs || 0));
    const seen = new Set();
    return rows.reduce((products, row) => {
      const sku = String(row.sku || '').toUpperCase();
      if (!/^SKU\d{8}$/.test(sku) || seen.has(sku)) return products;
      seen.add(sku);
      const data = normalizeData({ ...(loadData(sku) || {}), ...row, sku });
      products.push({
        sku,
        brand: String(data.brand || ''),
        name: String(data.name || ''),
        englishName: String(data.englishName || ''),
        finalizedAt: String(row.finalizedAt || ''),
        packageLength: String(data.packageLength || ''),
        packageWidth: String(data.packageWidth || ''),
        packageHeight: String(data.packageHeight || ''),
        productLength: String(data.productLength || ''),
        productWidth: String(data.productWidth || ''),
        productHeight: String(data.productHeight || ''),
        netContent: String(data.netContent || ''),
        grossWeight: String(data.grossWeight || ''),
        ingredients: String(getPreferredExcelIngredients(data) || ''),
        referenceUrl: String(data.referenceUrl || data.benchmarkLink || row.referenceUrl || ''),
        packageCode: String(data.packageCode || row.packageCode || ''),
        printCode: String(data.printCode || row.printCode || ''),
        purchasePrice: String(data.purchasePrice || row.purchasePrice || ''),
        packQty: String(data.packQty || data.packCount || data.cartonQty || ''),
      });
      return products;
    }, []);
  }

  function sendDesktopBridgeSnapshot() {
    const products = collectDesktopFinalizedProducts();
    sendDesktopBridgeMessage({
      type: 'snapshot.response',
      version: SCRIPT_VERSION,
      sentAt: new Date().toISOString(),
      products,
    });
    setDesktopBridgeStatus('已同步 ' + products.length + ' 个定稿 SKU');
    addLog('success', '桌面工作台同步完成', products.length + ' 个已定稿 SKU');
  }

  async function generateDesktopBridgeExcel(message) {
    const sku = String(message && message.sku || '').toUpperCase();
    const jobId = String(message && message.jobId || '');
    if (!/^SKU\d{8}$/.test(sku) || !jobId) throw new Error('Excel 任务参数无效');
    if (!window.ExcelJS) throw new Error('ExcelJS 尚未加载');
    if (!await ensureExcelTemplateLoaded()) throw new Error('Excel 模板尚未缓存，请联网后重试');
    const cachedData = normalizeData(loadData(sku) || state.index.find((item) => item.sku === sku) || {});
    const ledgerData = normalizeData(
      sanitizeLedgerRecords(state.ledgerRecords || loadDailyLedger()).find((item) => String(item.sku || '').toUpperCase() === sku) || {}
    );
    const bridgeData = normalizeData(message && message.product || {});
    const data = normalizeData(mergeData(mergeData(cachedData, ledgerData), bridgeData));
    if (!data.sku) throw new Error('本地缓存中找不到 ' + sku);
    state.selectedSku = sku;
    state.data = data;
    resetExcelState();
    addLog('info', '桌面工作台请求悬浮助手生成资产', sku);
    await prepareExcelInfo();
    const prepared = state.excelExtra || {};
    const extra = prepared.extra || buildCachedExcelExtraData(data);
    const excelData = normalizeData(prepared.excelData || data);
    const packQty = normalizePackQty(state.excelPackQty || excelData.packQty || excelData.packCount || excelData.cartonQty || '');
    const purchasePrice = String(state.excelPurchasePrice || excelData.purchasePrice || '6');
    if (!packQty) {
      const packBoxKey = buildPackBoxKey(excelData);
      if (!packBoxKey) throw new Error(sku + ' 缺少完整包装尺寸，无法计算装箱数');
      throw new Error(sku + ' 的包装尺寸为 ' + packBoxKey + '，但装箱推荐服务未返回结果');
    }
    if (!extra.isSkuDesignImage || !(extra.skuImageUrl || extra.imageUrl || extra.skuImageFallbackUrl || extra.imageFallbackUrl)) {
      throw new Error(sku + ' 未能读取 SKU 设计图，请确认项目详情中的产品图可预览');
    }
    const imageData = normalizeData({
      ...excelData,
      englishName: extra.englishName || excelData.englishName,
      ingredients: extra.ingredients || getPreferredExcelIngredients(excelData),
    });

    const workbook = new window.ExcelJS.Workbook();
    await workbook.xlsx.load(base64ToArrayBuffer(TEMPLATE_XLSX_BASE64));
    const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
    const excelImageSource = getExcelImageSource(excelData, extra);
    const imageInfo = excelImageSource.imageUrl
      ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch(() => null)
      : null;

    setCell(sheet, 'A4', buildExcelKeyword(excelData, extra));
    setCell(sheet, 'B4', excelData.name || extra.chineseName || '');
    setCell(sheet, 'C4', '');
    setCell(sheet, 'E4', compactText(packQty));
    setCell(sheet, 'G4', excelData.sku || '');
    if (excelData.singleBottle) setCell(sheet, 'H4', '瓶装');
    else sheet.getCell('H4').value = { formula: 'IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"盒装",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"袋装",""))' };
    setCell(sheet, 'I4', formatExcelDimFromParts([excelData.productLength, excelData.productWidth, excelData.productHeight]) || formatExcelDim(excelData.productNums, []));
    setCell(sheet, 'J4', formatExcelDimFromParts([excelData.packageLength, excelData.packageWidth, excelData.packageHeight]) || formatExcelDim(excelData.packageNums, []));
    setCell(sheet, 'L4', formatIngredientsForExcel(extra.ingredients));
    setCell(sheet, 'M4', normalizeExcelUnit(excelData.netContent));
    setCell(sheet, 'N4', normalizeExcelUnit(excelData.grossWeight));
    setCell(sheet, 'O4', normalizeExcelNumberOrText(purchasePrice));
    setCell(sheet, 'P4', getReturnDateText(7));
    setCell(sheet, 'S4', extra.benchmarkLink || '');

    if (shouldOmitToyProductSize(excelData)) {
      sheet.spliceColumns(9, 1);
      sheet.getCell('H4').value = { formula: 'IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=2,"盒装",IF(LEN(I4)-LEN(SUBSTITUTE(I4,"*",""))=1,"袋装",""))' };
      sheet.getCell('F4').value = { formula: 'TEXT(VALUE(LEFT(E4,LEN(E4)-3))*(VALUE(LEFT(M4,LEN(M4)-1))/1000)+0.75,"0.00")&"KG"' };
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="G","净重",IF(RIGHT(L4,2)="ML","容量","规格"))' };
    } else if (shouldRemoveExcelPackageSizeColumn(excelData)) {
      sheet.spliceColumns(10, 1);
      sheet.getCell('F4').value = { formula: 'TEXT(VALUE(LEFT(E4,LEN(E4)-3))*(VALUE(LEFT(M4,LEN(M4)-1))/1000)+0.75,"0.00")&"KG"' };
      sheet.getCell('L3').value = { formula: 'IF(RIGHT(L4,1)="G","净重",IF(RIGHT(L4,2)="ML","容量","规格"))' };
    }
    if (imageInfo) {
      const imageId = workbook.addImage({ base64: imageInfo.dataUrl, extension: imageInfo.extension });
      sheet.addImage(imageId, getExcelImageAnchor(imageInfo));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer);
    const assets = message.transparentImageDataUrl
      ? await parameterImageFeature.generateBridgeAssets(imageData, String(message.transparentImageDataUrl))
      : { englishDataUrl: '', sizeDataUrl: '' };
    sendDesktopBridgeMessage({
      type: 'asset.bundle',
      jobId,
      sku,
      fileName: String(message.fileName || buildExcelFileName(excelData, extra)),
      excelBase64: bytesToBase64(bytes),
      englishDataUrl: assets.englishDataUrl,
      sizeDataUrl: assets.sizeDataUrl,
    });
    addLog('success', '桌面工作台资产已返回', sku + ' / Excel ' + bytes.length + ' bytes');
  }
