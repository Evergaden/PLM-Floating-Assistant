
  const DESKTOP_BRIDGE_URL = 'ws://127.0.0.1:37191';
  const DESKTOP_BRIDGE_TOKEN_KEY = 'plm_desktop_bridge_token';
  let desktopBridgeSocket = null;
  let desktopBridgeReconnectTimer = 0;
  let desktopBridgeSnapshotTimer = 0;
  let desktopBridgeStatus = '未配对';
  let desktopBridgeExcelQueue = Promise.resolve();
  const desktopUploadTransfers = new Map();

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
          role: 'assistant',
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
    if (message.type === 'upload.queue.add') {
      receiveDesktopUploadAssets(message).catch((error) => {
        sendDesktopBridgeMessage({
          type: 'upload.queue.ack',
          requestId: String(message.requestId || ''),
          added: 0,
          skipped: 0,
          error: formatErrorMessage(error),
        });
      });
      return;
    }
    if (message.type === 'upload.queue.begin') {
      const requestId = String(message.requestId || '');
      const item = message.item && typeof message.item === 'object' ? message.item : null;
      if (requestId && item) {
        desktopUploadTransfers.set(requestId, {
          requestId,
          mode: String(message.mode || 'legacy'),
          autoStart: Boolean(message.autoStart),
          item,
          files: { xlsx: new Array(Number(item.xlsxTotal) || 0), zip: new Array(Number(item.zipTotal) || 0) },
          received: { xlsx: 0, zip: 0 },
        });
      }
      return;
    }
    if (message.type === 'upload.queue.chunk') {
      receiveDesktopUploadChunk(message);
      return;
    }
    if (message.type === 'ping') sendDesktopBridgeMessage({ type: 'pong', at: Date.now() });
  }

  function sendDesktopBridgeMessage(message) {
    if (!isDesktopBridgeConnected()) return false;
    desktopBridgeSocket.send(JSON.stringify(message));
    return true;
  }

  function decodeDesktopUploadFile(encoded, filename, mime, expectedSize) {
    const value = String(encoded || '');
    if (!value) throw new Error(filename + ' 数据为空');
    const binary = atob(value);
    if (Number(expectedSize) > 0 && binary.length !== Number(expectedSize)) throw new Error(filename + ' invalid size');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error(filename + ' invalid archive');
    return new File([bytes], filename, { type: mime || guessMime(filename), lastModified: Date.now() });
  }

  function decodeDesktopUploadChunks(chunks, filename, mime, expectedSize) {
    const values = Array.isArray(chunks) ? chunks : [];
    const decoded = values.map((chunk) => {
      const binary = atob(String(chunk || ''));
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      return bytes;
    });
    const total = decoded.reduce((sum, bytes) => sum + bytes.length, 0);
    if (Number(expectedSize) > 0 && total !== Number(expectedSize)) throw new Error(filename + ' invalid size');
    const bytes = new Uint8Array(total);
    let offset = 0;
    decoded.forEach((part) => { bytes.set(part, offset); offset += part.length; });
    if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error(filename + ' invalid archive');
    return new File([bytes], filename, { type: mime || guessMime(filename), lastModified: Date.now() });
  }

  function receiveDesktopUploadChunk(message) {
    const requestId = String(message && message.requestId || '');
    const file = String(message && message.file || '');
    const transfer = desktopUploadTransfers.get(requestId);
    if (!transfer || !transfer.files[file]) return;
    const index = Number(message.index);
    if (!Number.isInteger(index) || index < 0 || index >= transfer.files[file].length || transfer.files[file][index]) return;
    transfer.files[file][index] = String(message.data || '');
    transfer.received[file] += 1;
    if (transfer.received.xlsx < transfer.files.xlsx.length || transfer.received.zip < transfer.files.zip.length) return;
    desktopUploadTransfers.delete(requestId);
    const receiver = transfer.mode === 'magic-package' ? receiveDesktopMagicUploadAssets : receiveDesktopUploadAssets;
    receiver({
      requestId,
      autoStart: transfer.autoStart,
      items: [{ ...transfer.item, xlsxChunks: transfer.files.xlsx, zipChunks: transfer.files.zip }],
    }).catch((error) => {
      sendDesktopBridgeMessage({ type: 'upload.queue.ack', mode: transfer.mode, requestId, added: 0, skipped: 0, error: formatErrorMessage(error) });
    });
  }

  async function receiveDesktopUploadAssets(message) {
    const items = Array.isArray(message && message.items) ? message.items : [];
    const queue = loadUploadQueue();
    const history = loadUploadHistory();
    let added = 0;
    let skipped = 0;
    const errors = [];
    for (const item of items) {
      const sku = String(item && item.sku || '').toUpperCase();
      const signature = String(item && item.signature || '');
      if (!/^SKU\d+$/.test(sku) || !signature) {
        errors.push(sku || '未知 SKU');
        continue;
      }
      const duplicate = queue.find((entry) => entry && entry.kind !== 'toy-label' && entry.sku === sku && entry.assetSignature === signature)
        || history.find((entry) => entry && entry.kind !== 'toy-label' && entry.sku === sku && entry.assetSignature === signature);
      if (duplicate) {
        skipped += 1;
        continue;
      }
      try {
        const xlsxName = String(item.xlsxName || (sku + '.xlsx'));
        const zipName = String(item.zipName || (sku + '.zip'));
        const xlsx = Array.isArray(item.xlsxChunks)
          ? decodeDesktopUploadChunks(item.xlsxChunks, xlsxName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', item.xlsxSize)
          : decodeDesktopUploadFile(item.xlsxBase64, xlsxName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', item.xlsxSize);
        const zip = Array.isArray(item.zipChunks)
          ? decodeDesktopUploadChunks(item.zipChunks, zipName, 'application/zip', item.zipSize)
          : decodeDesktopUploadFile(item.zipBase64, zipName, 'application/zip', item.zipSize);
        state.uploadQueue = queue;
        const target = ensureUploadQueueItem(sku, xlsxName);
        const xlsxKey = 'desktop-upload:' + sku + ':' + signature + ':xlsx';
        const zipKey = 'desktop-upload:' + sku + ':' + signature + ':zip';
        await putUploadFile(xlsxKey, cloneUploadFile(xlsx));
        await putUploadFile(zipKey, cloneUploadFile(zip));
        target.xlsxName = xlsxName;
        target.xlsxKey = xlsxKey;
        target.zipName = zipName;
        target.zipKey = zipKey;
        target.assetSignature = signature;
        target.status = '\u5f85\u4e0a\u4f20';
        target.step = '\u684c\u9762\u5de5\u4f5c\u53f0\u5df2\u68c0\u67e5\u6587\u4ef6';
        target.skipReason = '';
        target.forceReplace = false;
        target.updatedAt = new Date().toLocaleString();
        added += 1;
      } catch (error) {
        errors.push(sku + '：' + formatErrorMessage(error));
      }
    }
    state.uploadQueue = queue;
    saveUploadQueue();
    state.uploadExpanded = true;
    state.uploadMode = 'standard';
    state.uploadView = 'queue';
    state.uploadPage = 1;
    renderShell();
    if (added) showToast('已检查并加入 ' + added + ' 个图包上传任务');
    if (errors.length) showToast('上传文件检查失败：' + errors.slice(0, 2).join('；'));
    sendDesktopBridgeMessage({
      type: 'upload.queue.ack',
      requestId: String(message.requestId || ''),
      added,
      skipped,
      errors,
    });
    if (message.autoStart && (added || queue.some((entry) => entry && entry.kind === 'standard' && isUploadItemReady(entry) && !/成功|进行中/.test(entry.status || '')))) {
      startUploadQueue();
    }
  }

  async function receiveDesktopMagicUploadAssets(message) {
    const items = Array.isArray(message && message.items) ? message.items : [];
    const item = items[0] || {};
    const requestId = String(message && message.requestId || '');
    if (!state.magicUploadAccessEnabled) {
      const error = '当前账号没有魔法上传权限';
      magicUploadLog('warn', '桌面工作台任务被拦截', error);
      sendDesktopBridgeMessage({ type: 'upload.queue.ack', mode: 'magic-package', requestId, added: 0, skipped: 0, error });
      showToast('魔法上传暂未开放');
      return;
    }
    try {
      const xlsxName = String(item.xlsxName || 'product.xlsx');
      const zipName = String(item.zipName || 'image-pack.zip');
      const xlsx = decodeDesktopUploadChunks(item.xlsxChunks, xlsxName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', item.xlsxSize);
      const zip = decodeDesktopUploadChunks(item.zipChunks, zipName, 'application/zip', item.zipSize);
      magicUploadLog('info', '收到桌面工作台魔法上传任务', String(item.sku || '') + ' | ' + xlsxName + ' | ' + zipName);
      const result = await processMagicUploadZipFiles([xlsx, zip]);
      if (message.autoStart && result && result.added) startMagicUploadQueue();
      const errors = result && Array.isArray(result.errors) ? result.errors : [];
      sendDesktopBridgeMessage({
        type: 'upload.queue.ack',
        mode: 'magic-package',
        requestId,
        added: result ? Number(result.added) || 0 : 0,
        skipped: 0,
        errors,
      });
    } catch (error) {
      const messageText = formatErrorMessage(error);
      magicUploadLog('warn', '桌面工作台魔法上传任务处理失败', messageText);
      sendDesktopBridgeMessage({ type: 'upload.queue.ack', mode: 'magic-package', requestId, added: 0, skipped: 0, error: messageText });
    }
  }

  function serializeDesktopCopywriting(record) {
    const normalized = normalizeCopywritingRecord(record);
    if (!normalized || !Array.isArray(normalized.sections) || !normalized.sections.length) return null;
    return {
      parserVersion: String(normalized.parserVersion || ''),
      fileName: String(normalized.fileName || ''),
      updatedAt: String(normalized.updatedAt || ''),
      fullText: String(normalized.fullText || '').slice(0, 50000),
      missingSections: Array.isArray(normalized.missingSections) ? normalized.missingSections.slice(0, 40).map((item) => String(item || '')) : [],
      sections: normalized.sections
        .filter((section) => section && section.key && String(section.text || '').trim())
        .map((section) => ({
          key: String(section.key || ''),
          label: String(section.label || section.key || ''),
          text: String(section.text || '').slice(0, 12000),
        })),
    };
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
        finalizedDate: String(row.finalizedDate || ''),
        cacheUpdatedAtMs: Number(data.updatedAtMs || row.updatedAtMs || 0) || 0,
        packageSizeText: String(data.packageSizeText || ''),
        packageSizeLabel: String(data.packageSizeLabel || ''),
        packageNums: Array.isArray(data.packageNums) ? data.packageNums.slice() : [],
        packageLength: String(data.packageLength || ''),
        packageWidth: String(data.packageWidth || ''),
        packageHeight: String(data.packageHeight || ''),
        productNums: Array.isArray(data.productNums) ? data.productNums.slice() : [],
        plmProductNums: Array.isArray(data.plmProductNums) ? data.plmProductNums.slice() : [],
        productLength: String(data.productLength || ''),
        productWidth: String(data.productWidth || ''),
        productHeight: String(data.productHeight || ''),
        singleBottle: Boolean(data.singleBottle),
        hasInnerCard: Boolean(data.hasInnerCard),
        netContent: String(data.netContent || ''),
        grossWeight: String(data.grossWeight || ''),
        ingredients: String(getPreferredExcelIngredients(data) || ''),
        copywriting: serializeDesktopCopywriting(data.copywriting),
        referenceUrl: String(data.referenceUrl || data.benchmarkLink || row.referenceUrl || ''),
        skuImageUrl: String(data.skuImageUrl || ''),
        skuImageFallbackUrl: String(data.skuImageFallbackUrl || data.skuImageUrl || ''),
        benchmarkImageUrl: String(data.benchmarkImageUrl || ''),
        benchmarkImageFallbackUrl: String(data.benchmarkImageFallbackUrl || data.benchmarkImageUrl || ''),
        packageCode: String(data.packageCode || row.packageCode || ''),
        printCode: String(data.printCode || row.printCode || ''),
        purchasePrice: String(data.purchasePrice || row.purchasePrice || ''),
        packQty: getLocalPackQty(data),
        boxFileState: String(row.boxFileState || data.boxFileState || ''),
        labelFileState: String(row.labelFileState || data.labelFileState || ''),
        imagePackState: String(row.imagePackState || data.imagePackState || ''),
        boxFileDone: Boolean(row.boxFileDone || data.boxFileDone),
        labelFileDone: Boolean(row.labelFileDone || data.labelFileDone),
        imagePackDone: Boolean(row.imagePackDone || data.imagePackDone),
      });
      return products;
    }, []);
  }

  function sendDesktopBridgeSnapshot() {
    const products = collectDesktopFinalizedProducts();
    const standardSuccessfulSkus = loadUploadHistory()
      .filter((item) => (item && item.kind || 'standard') === 'standard' && isUploadHistorySuccess(item))
      .map((item) => String(item && item.sku || '').toUpperCase());
    const magicSuccessfulSkus = loadMagicUploadHistory()
      .filter((item) => String(item && item.status || '') === 'success')
      .map((item) => String(item && item.sku || '').toUpperCase());
    const successfulUploadSkus = Array.from(new Set(standardSuccessfulSkus.concat(magicSuccessfulSkus)))
      .filter((sku) => /^SKU\d+$/.test(sku));
    sendDesktopBridgeMessage({
      type: 'snapshot.response',
      version: SCRIPT_VERSION,
      sentAt: new Date().toISOString(),
      products,
      successfulUploadSkus,
    });
    setDesktopBridgeStatus('已同步 ' + products.length + ' 个定稿 SKU');
    addLog('success', '桌面工作台同步完成', products.length + ' 个已定稿 SKU');
  }

  function scheduleDesktopBridgeSnapshot() {
    if (!isDesktopBridgeConnected()) return;
    window.clearTimeout(desktopBridgeSnapshotTimer);
    desktopBridgeSnapshotTimer = window.setTimeout(() => sendDesktopBridgeSnapshot(), 700);
  }

  function countHashDistance(left, right) {
    let value = BigInt('0x' + left) ^ BigInt('0x' + right);
    let count = 0;
    while (value) {
      count += Number(value & 1n);
      value >>= 1n;
    }
    return count;
  }

  async function getSkuImagePerceptualHash(dataUrl) {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('SKU 图片无法解码'));
      element.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 16, 16);
    ctx.drawImage(image, 0, 0, 16, 16);
    const pixels = ctx.getImageData(0, 0, 16, 16).data;
    const luminance = [];
    for (let index = 0; index < pixels.length; index += 4) {
      luminance.push(pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114);
    }
    const average = luminance.reduce((sum, value) => sum + value, 0) / luminance.length;
    let bits = '';
    luminance.forEach((value) => { bits += value < average ? '1' : '0'; });
    return BigInt('0b' + bits).toString(16).padStart(64, '0');
  }

  async function isPlaceholderSkuImage(dataUrl) {
    const hash = await getSkuImagePerceptualHash(dataUrl);
    const placeholders = [
      '0000000000000ff00ff00ff01f70082000000000000000000000000000000000',
      '000000000000000000001ff83ff83ff83ff83ff81ff800000000000000000000',
    ];
    return placeholders.some((placeholder) => countHashDistance(hash, placeholder) <= 14);
  }

  async function convertSkuImageToJpeg(dataUrl) {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('SKU 图片无法解码'));
      element.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL('image/jpeg', .95);
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
    const bridgeRaw = { ...(message && message.product || {}) };
    if (!Array.isArray(bridgeRaw.packageNums) || bridgeRaw.packageNums.length < 3) {
      const packageParts = [bridgeRaw.packageLength, bridgeRaw.packageWidth, bridgeRaw.packageHeight]
        .map(extractCmValue)
        .map(Number);
      if (packageParts.every((value) => Number.isFinite(value) && value > 0)) bridgeRaw.packageNums = packageParts;
    }
    if (!Array.isArray(bridgeRaw.productNums) || bridgeRaw.productNums.length < 3) {
      const productParts = [bridgeRaw.productLength, bridgeRaw.productWidth, bridgeRaw.productHeight]
        .map(extractCmValue)
        .map(Number);
      if (productParts.every((value) => Number.isFinite(value) && value > 0)) bridgeRaw.productNums = productParts;
    }
    const bridgeData = normalizeData(bridgeRaw);
    const data = normalizeData(mergeData(mergeData(cachedData, ledgerData), bridgeData));
    if (!data.sku) throw new Error('本地缓存中找不到 ' + sku);
    state.selectedSku = sku;
    state.data = data;
    resetExcelState();
    addLog('info', '桌面工作台请求悬浮助手生成资产', sku);
    let extra;
    let excelData;
    if (message.auto) {
      extra = buildCachedExcelExtraData(data);
      excelData = data;
      state.excelExtra = { extra, excelData };
      state.excelMissing = getExcelMissingFields(excelData, extra);
      if (state.excelMissing.length) {
        throw new Error(sku + ' 缓存资料尚未完整，等待补齐：' + state.excelMissing.join('、'));
      }
      await fillRecommendedPackQty(excelData);
      await fillRecommendedPurchasePrice(excelData, extra);
    } else {
      await prepareExcelInfo();
      const prepared = state.excelExtra || {};
      extra = prepared.extra || buildCachedExcelExtraData(data);
      excelData = normalizeData(prepared.excelData || data);
    }
    const packQty = normalizePackQty(getLocalPackQty(excelData));
    const purchasePrice = String(state.excelPurchasePrice || excelData.purchasePrice || '6');
    if (!packQty) {
      const packBoxKey = buildPackBoxKey(excelData);
      if (!packBoxKey) throw new Error(sku + ' 缺少完整包装尺寸，无法计算装箱数');
      throw new Error(sku + ' 的包装尺寸为 ' + packBoxKey + '，本地公式无法计算有效装箱数');
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
    removeUnusedExcelTemplateRow(sheet);
    const excelImageSource = getExcelImageSource(excelData, extra);
    const imageInfo = excelImageSource.imageUrl
      ? await fetchImageForExcel(excelImageSource.imageUrl, excelImageSource.imageFallbackUrl).catch(() => null)
      : null;
    if (!imageInfo || !imageInfo.dataUrl) throw new Error(sku + ' 未能读取真实 SKU 产品图');
    if (await isPlaceholderSkuImage(imageInfo.dataUrl)) {
      throw new Error(sku + ' 当前仍是 JPG/透明占位图，等待真实 SKU 产品图后自动生成');
    }
    const skuImageDataUrl = await convertSkuImageToJpeg(imageInfo.dataUrl);

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
      skuImageDataUrl,
      englishDataUrl: assets.englishDataUrl,
      sizeDataUrl: assets.sizeDataUrl,
    });
    addLog('success', '桌面工作台资产已返回', sku + ' / Excel ' + bytes.length + ' bytes');
  }
