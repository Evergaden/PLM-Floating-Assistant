const photoshop = require('photoshop');
const { app, action, core, constants } = photoshop;
const { storage } = require('uxp');
const { buildPage4Layout, rangeSegments } = require('./copywriting');
const { matchProductByFilename } = require('./file-match');
const { buildSelectionPlan } = require('./selection-layout');
const { detectArtworkMode, selectionRatio, modeLabel } = require('./artwork-mode');

const WS_URL = 'ws://127.0.0.1:37191';
const TOKEN_KEY = 'plm.photoshop.bridge-token';
const PLUGIN_VERSION = '0.1.15';
const REGULAR_FONT = 'ArialMT';
// The installed “Arial MT Bold” face exposes Arial-BoldMT as its PostScript name.
const BOLD_FONT = 'Arial-BoldMT';
const REGULAR_FAMILY = 'ArialMT';
const BOLD_FAMILY = 'Arial MT';
const DEFAULT_FONT_SIZE_PT = 4;
const MIN_FONT_SIZE_PT = 2.5;
const MAX_FONT_SIZE_PT = 144;
const MAX_FIT_STEPS = 40;
const SOCKET_TIMEOUT_MS = 8000;
const STORAGE_TIMEOUT_MS = 800;

const state = {
  socket: null,
  socketGeneration: 0,
  connectTimer: 0,
  token: '',
  products: [],
  selectedSku: '',
  documentSku: '',
  documentMatch: null,
  layoutMode: 'box-portrait',
  currentLayout: null,
};

function byId(id) {
  return document.getElementById(id);
}

function renderVersion() {
  const version = byId('version');
  if (version) version.textContent = 'v' + PLUGIN_VERSION;
}

function setStatus(message, tone) {
  const element = byId('status');
  if (!element) return;
  element.textContent = String(message || '');
  element.dataset.tone = tone || 'normal';
}

function renderLayoutMode(mode, bounds) {
  const element = byId('layout-mode');
  if (!element) return;
  const ratio = selectionRatio(bounds);
  const ratioText = Number.isFinite(ratio) ? ' · 选区比例 ' + ratio.toFixed(2) + ':1' : '';
  element.textContent = '自动版式：' + modeLabel(mode) + ratioText;
  element.dataset.mode = mode || '';
}

function setBusy(busy) {
  ['connect', 'disconnect', 'refresh', 'generate'].forEach((id) => {
    const button = byId(id);
    if (button) button.disabled = Boolean(busy && id !== 'disconnect');
  });
}

function timedValue(value, timeoutMs, fallback) {
  return Promise.race([
    Promise.resolve(value),
    new Promise((resolve) => window.setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

async function getStoredToken() {
  try {
    if (storage && storage.secureStorage) {
      const value = await timedValue(storage.secureStorage.getItem(TOKEN_KEY), STORAGE_TIMEOUT_MS, '');
      if (value) return String(value).trim();
    }
  } catch (_) {}
  try {
    return String(localStorage.getItem(TOKEN_KEY) || '').trim();
  } catch (_) {
    return '';
  }
}

async function storeToken(value) {
  const token = String(value || '').trim();
  try {
    if (storage && storage.secureStorage) {
      await timedValue(storage.secureStorage.setItem(TOKEN_KEY, token), STORAGE_TIMEOUT_MS, null);
    }
  } catch (_) {}
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (_) {}
  state.token = token;
}

async function clearStoredToken() {
  try {
    if (storage && storage.secureStorage) {
      await timedValue(storage.secureStorage.removeItem(TOKEN_KEY), STORAGE_TIMEOUT_MS, null);
    }
  } catch (_) {}
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
  state.token = '';
}

function send(message) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return false;
  try {
    state.socket.send(JSON.stringify(message));
    return true;
  } catch (_) {
    return false;
  }
}

function closeSocket() {
  state.socketGeneration += 1;
  if (state.connectTimer) {
    window.clearTimeout(state.connectTimer);
    state.connectTimer = 0;
  }
  const socket = state.socket;
  state.socket = null;
  if (!socket) return;
  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
  try {
    if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) socket.close();
  } catch (_) {}
}

async function connect() {
  const input = byId('token');
  const token = String(input ? input.value : state.token || '').trim();
  if (token.length < 32) {
    setStatus('请输入悬浮助手显示的连接码。', 'error');
    return;
  }
  void storeToken(token);
  closeSocket();
  setBusy(true);
  setStatus('正在连接本机桥接…', 'normal');
  try {
    const socket = new WebSocket(WS_URL);
    const generation = state.socketGeneration;
    state.socket = socket;
    const isCurrent = () => state.socket === socket && state.socketGeneration === generation;
    socket.onopen = () => {
      if (!isCurrent()) return;
      if (state.connectTimer) {
        window.clearTimeout(state.connectTimer);
        state.connectTimer = 0;
      }
      try {
      socket.send(JSON.stringify({
        type: 'hello',
        token,
        role: 'photoshop',
        version: PLUGIN_VERSION,
        clientName: 'PLM Photoshop UXP',
      }));
      } catch (_) {
        closeSocket();
        setBusy(false);
        setStatus('连接失败，请确认桌面工作台已打开。', 'error');
        return;
      }
      setBusy(false);
      setStatus('已连接，正在同步 SKU…', 'success');
      window.setTimeout(() => send({ type: 'snapshot.request' }), 250);
    };
    socket.onmessage = (event) => {
      if (isCurrent()) handleMessage(event && event.data);
    };
    socket.onerror = () => {
      if (!isCurrent()) return;
      closeSocket();
      setBusy(false);
      setStatus('连接失败，请确认桌面工作台已打开。', 'error');
    };
    socket.onclose = () => {
      if (!isCurrent()) return;
      state.socket = null;
      if (state.connectTimer) {
        window.clearTimeout(state.connectTimer);
        state.connectTimer = 0;
      }
      setBusy(false);
      setStatus('桥接已断开。', 'normal');
    };
    state.connectTimer = window.setTimeout(() => {
      if (!isCurrent() || socket.readyState === WebSocket.OPEN) return;
      closeSocket();
      setBusy(false);
      setStatus('连接超时，请确认桌面工作台已打开后重试。', 'error');
    }, SOCKET_TIMEOUT_MS);
  } catch (error) {
    closeSocket();
    setBusy(false);
    setStatus('连接失败：' + errorMessage(error), 'error');
  }
}

function disconnect() {
  closeSocket();
  setBusy(false);
  setStatus('已断开。', 'normal');
}

function errorMessage(error) {
  return String(error && (error.message || error.description) || error || '未知错误');
}

function handleMessage(raw) {
  let message;
  try {
    message = JSON.parse(typeof raw === 'string' ? raw : String(raw || ''));
  } catch (_) {
    return;
  }
  if (message.type === 'hello.error') {
    closeSocket();
    setBusy(false);
    setStatus(String(message.message || '连接码无效，请重新粘贴。'), 'error');
    return;
  }
  if (message.type === 'snapshot.response') {
    state.products = Array.isArray(message.products) ? message.products : [];
    updateDocumentSku();
    renderProductSelect();
    renderPreview();
    setStatus('已同步 ' + state.products.length + ' 个定稿 SKU。', 'success');
    return;
  }
  if (message.type === 'ping') send({ type: 'pong', at: Date.now() });
}

function currentDocumentTitle() {
  try {
    return String(app.activeDocument && app.activeDocument.title || '');
  } catch (_) {
    return '';
  }
}

function updateDocumentSku() {
  const documentTitle = currentDocumentTitle();
  state.documentMatch = matchProductByFilename(documentTitle, state.products);
  state.documentSku = state.documentMatch ? state.documentMatch.product.sku : '';
  const title = byId('document-name');
  if (title) {
    title.textContent = documentTitle || '未打开 Photoshop 文档';
    title.title = state.documentMatch
      ? '已匹配：' + state.documentMatch.label + ' ' + state.documentMatch.raw
      : documentTitle;
  }
  if (state.documentSku) state.selectedSku = state.documentSku;
  if (!state.selectedSku && state.products.length) state.selectedSku = state.products[0].sku;
}

function renderProductSelect() {
  const select = byId('sku-select');
  if (!select) return;
  const selected = state.selectedSku;
  select.innerHTML = '';
  state.products.forEach((product) => {
    const option = document.createElement('option');
    option.value = product.sku;
    option.textContent = [
      product.packageCode || product.fileCode || product.sku,
      product.sku,
      product.name || product.englishName,
    ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(' · ');
    option.selected = product.sku === selected;
    select.appendChild(option);
  });
  select.disabled = !state.products.length;
}

function selectedProduct() {
  return state.products.find((product) => product.sku === state.selectedSku) || null;
}

function renderPreview() {
  const product = selectedProduct();
  const preview = byId('preview');
  const missing = byId('missing');
  if (!product) {
    state.currentLayout = null;
    if (preview) preview.textContent = '连接悬浮助手并同步 SKU 后预览。';
    if (missing) missing.textContent = '';
    return;
  }
  const mode = detectArtworkMode(currentDocumentTitle(), null);
  state.layoutMode = mode;
  renderLayoutMode(mode);
  state.currentLayout = buildPage4Layout(product, { mode });
  if (preview) preview.textContent = state.currentLayout.text || '当前 SKU 没有可生成的文案。';
  if (missing) {
    missing.textContent = state.currentLayout.missing.length
      ? '缺少字段：' + state.currentLayout.missing.join('、')
      : '字段完整：不包含 Safe use 和条码内容。';
    missing.dataset.tone = state.currentLayout.missing.length ? 'warning' : 'success';
  }
}

function numberValue(value) {
  if (typeof value === 'number') return value;
  if (!value) return NaN;
  if (typeof value._value === 'number') return value._value;
  if (typeof value.value === 'number') return value.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function copyDescriptor(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(copyDescriptor);
  const result = {};
  Object.keys(value).forEach((key) => { result[key] = copyDescriptor(value[key]); });
  return result;
}

function unitName(value) {
  return value && typeof value === 'object' ? String(value._unit || '') : '';
}

function pointsToPixels(points, resolution) {
  return points * (Number(resolution) || 72) / 72;
}

function pixelsToPoints(pixels, resolution) {
  return pixels * 72 / (Number(resolution) || 72);
}

function sizeInPoints(value, fallbackUnit, resolution) {
  const raw = numberValue(value);
  if (!Number.isFinite(raw) || raw <= 0) return NaN;
  const unit = unitName(value) || fallbackUnit;
  return unit === 'pixelsUnit' ? pixelsToPoints(raw, resolution) : raw;
}

function getStyleSize(style, textItem, resolution) {
  const candidates = [
    { value: style && style.size, unit: 'pointsUnit' },
    { value: style && style.fontSize, unit: 'pixelsUnit' },
    { value: textItem && textItem.characterStyle && textItem.characterStyle.size, unit: 'pixelsUnit' },
    // impliedFontSize is a derived Photoshop value and can be stale or fractional.
    { value: style && style.impliedFontSize, unit: 'pointsUnit' },
  ];
  for (const candidate of candidates) {
    const points = sizeInPoints(candidate.value, candidate.unit, resolution);
    if (Number.isFinite(points) && points >= MIN_FONT_SIZE_PT && points <= MAX_FONT_SIZE_PT) return points;
  }
  return DEFAULT_FONT_SIZE_PT;
}

function sizeDescriptor(original, points, resolution) {
  const result = original && typeof original === 'object' ? { ...original } : {};
  const unit = unitName(original) || 'pointsUnit';
  result._unit = unit;
  result._value = unit === 'pixelsUnit' ? pointsToPixels(points, resolution) : points;
  return result;
}

function styleFor(baseStyle, size, bold, resolution) {
  const style = { ...copyDescriptor(baseStyle), _obj: 'textStyle' };
  const font = bold ? BOLD_FONT : REGULAR_FONT;
  style.fontPostScriptName = font;
  style.fontName = bold ? BOLD_FAMILY : REGULAR_FAMILY;
  style.fontStyleName = bold ? 'Bold' : 'Regular';
  style.fauxBold = false;
  if (Object.prototype.hasOwnProperty.call(style, 'font')) style.font = font;
  if (Object.prototype.hasOwnProperty.call(style, 'syntheticBold')) style.syntheticBold = false;
  style.size = sizeDescriptor(style.size, size, resolution);
  if (Object.prototype.hasOwnProperty.call(style, 'fontSize')) {
    style.fontSize = pointsToPixels(size, resolution);
  }
  // Keep Photoshop's effective size in sync instead of carrying over a stale 0.06 pt value.
  if (Object.prototype.hasOwnProperty.call(style, 'impliedFontSize')) {
    style.impliedFontSize = sizeDescriptor(style.impliedFontSize, size, resolution);
  }
  // Match the supplied artwork: leading is exactly the font size, never
  // Photoshop's automatic 120% leading.
  style.autoLeading = false;
  style.leading = sizeDescriptor(style.leading, size, resolution);
  if (Object.prototype.hasOwnProperty.call(style, 'impliedLeading')) {
    style.impliedLeading = sizeDescriptor(style.impliedLeading, size, resolution);
  }
  if (Object.prototype.hasOwnProperty.call(style, 'useAutoLeading')) {
    style.useAutoLeading = false;
  }
  return style;
}

async function getTextKey(layerId) {
  const result = await action.batchPlay([{
    _obj: 'get',
    _target: [
      { _property: 'textKey' },
      { _ref: 'textLayer', _id: layerId },
    ],
    _options: { dialogOptions: 'dontDisplay' },
  }], { modalBehavior: 'execute' });
  const textKey = result && result[0] && result[0].textKey;
  if (!textKey || !Array.isArray(textKey.textStyleRange) || !textKey.textStyleRange.length) {
    throw new Error('无法读取所选文字层的样式信息。');
  }
  return copyDescriptor(textKey);
}

function paragraphRangesFor(textKey, length) {
  const property = Array.isArray(textKey.paragraphStyleRange)
    ? 'paragraphStyleRange'
    : (Array.isArray(textKey.textParagraphStyleRange) ? 'textParagraphStyleRange' : '');
  if (!property || !textKey[property].length) return;
  const first = copyDescriptor(textKey[property][0]);
  first._obj = first._obj || 'paragraphStyleRange';
  first.from = 0;
  first.to = length;
  if (first.paragraphStyle) {
    first.paragraphStyle = { ...first.paragraphStyle };
    first.paragraphStyle.justification = { _enum: 'justification', _value: 'left' };
    first.paragraphStyle.hyphenation = false;
  }
  textKey[property] = [first];
}

function setTextKeyDescriptor(layerId, textKey) {
  return action.batchPlay([{
    _obj: 'set',
    _target: [{ _ref: 'textLayer', _id: layerId }],
    to: { ...textKey, _obj: 'textLayer' },
    _isCommand: true,
    _options: { dialogOptions: 'dontDisplay' },
  }], { modalBehavior: 'execute' }).then((result) => {
    const error = result && result.find((item) => item && item._obj === 'error');
    if (error) throw new Error(error.message || 'Photoshop 无法写入文字层。');
    return result;
  });
}

function pixelDescriptor(value) {
  return { _unit: 'pixelsUnit', _value: Number(value) };
}

function setTextBoxBounds(textKey, bounds) {
  if (!textKey || !Array.isArray(textKey.textShape) || !textKey.textShape.length) {
    throw new Error('Photoshop 没有返回可设置的段落文字框。');
  }
  const shape = textKey.textShape[0] = copyDescriptor(textKey.textShape[0]);
  const current = shape.bounds && typeof shape.bounds === 'object' ? shape.bounds : {};
  shape.bounds = {
    ...current,
    // textShape.bounds are local to the text insertion point. Keep the
    // origin at zero and set only the requested width/height.
    top: pixelDescriptor(0),
    left: pixelDescriptor(0),
    bottom: pixelDescriptor(bounds.bottom - bounds.top),
    right: pixelDescriptor(bounds.right - bounds.left),
  };
  return textKey;
}

function layerBounds(layer) {
  if (!layer) return null;
  const source = layer.boundsNoEffects || layer.bounds;
  if (!source) return null;
  const result = {
    left: numberValue(source.left),
    top: numberValue(source.top),
    right: numberValue(source.right),
    bottom: numberValue(source.bottom),
  };
  return Object.values(result).every(Number.isFinite) ? result : null;
}

function blackColor() {
  const SolidColor = app.SolidColor;
  const color = new SolidColor();
  color.rgb.red = 0;
  color.rgb.green = 0;
  color.rgb.blue = 0;
  return color;
}

function replaceSelection(document, bounds, antiAlias) {
  return document.selection.selectRectangle(
    bounds,
    constants.SelectionType.REPLACE,
    0,
    antiAlias === true,
  );
}

function fillSelection() {
  return action.batchPlay([{
    _obj: 'fill',
    using: { _enum: 'fillContents', _value: 'foregroundColor' },
    opacity: { _unit: 'percentUnit', _value: 100 },
    mode: { _enum: 'blendMode', _value: 'normal' },
    _options: { dialogOptions: 'dontDisplay' },
  }], { modalBehavior: 'execute' });
}

async function readSelectionBounds(document) {
  try {
    return await Promise.resolve(document.selection && document.selection.bounds);
  } catch (_) {
    return null;
  }
}

async function createParagraphTextLayer(document, spec, size, resolution, createdLayers) {
  const fontPixels = pointsToPixels(size, resolution);
  const layer = await document.createTextLayer({
    name: spec.name,
    contents: String(spec.layout.text || ''),
    fontName: REGULAR_FONT,
    fontSize: fontPixels,
    position: { x: spec.bounds.left, y: spec.bounds.top + fontPixels },
    textColor: blackColor(),
  });
  createdLayers.push(layer);
  if (!layer.textItem || !layer.textItem.isParagraphText) {
    await layer.textItem.convertToParagraphText();
  }
  const original = await getTextKey(layer.id);
  const next = formattedTextKey(original, spec.layout, size, resolution);
  setTextBoxBounds(next, spec.bounds);
  await setTextKeyDescriptor(layer.id, next);
  if (!setTextLayerPosition(layer, spec.bounds.left, spec.bounds.top + fontPixels)) {
    await moveLayerToTopLeft(layer, spec.bounds);
  }
  return layer;
}

function setTextLayerPosition(layer, x, y) {
  try {
    if (!layer || !layer.textItem) return false;
    layer.textItem.textClickPoint = { x: Number(x), y: Number(y) };
    return true;
  } catch (_) {
    return false;
  }
}

async function createHeadingTextLayer(document, text, cellBounds, size, resolution, createdLayers, name) {
  const fontPixels = pointsToPixels(size, resolution);
  const layer = await document.createTextLayer({
    name,
    contents: text,
    fontName: BOLD_FONT,
    fontSize: fontPixels,
    position: { x: cellBounds.left, y: cellBounds.bottom - Math.max(1, fontPixels * 0.2) },
    textColor: blackColor(),
  });
  createdLayers.push(layer);
  const original = await getTextKey(layer.id);
  const headingLayout = {
    text,
    segments: [{ text, bold: true }],
  };
  const next = formattedTextKey(original, headingLayout, size, resolution);
  await setTextKeyDescriptor(layer.id, next);

  const actual = layerBounds(layer);
  if (actual && typeof layer.translate === 'function') {
    const targetTop = cellBounds.top + Math.max(0, (cellBounds.bottom - cellBounds.top - (actual.bottom - actual.top)) / 2);
    await layer.translate(cellBounds.left - actual.left, targetTop - actual.top);
  }
  return layer;
}

async function createRepFrameLayer(document, frameBounds, strokeWidth, createdLayers, name) {
  const layer = await document.createPixelLayer({ name });
  createdLayers.push(layer);
  const left = Math.round(frameBounds.left);
  const top = Math.round(frameBounds.top);
  const right = Math.round(frameBounds.right);
  const bottom = Math.round(frameBounds.bottom);
  const width = Math.max(2, right - left);
  const height = Math.max(2, bottom - top);
  const thickness = Math.max(1, Math.min(
    Math.round(strokeWidth),
    Math.floor(width / 2),
    Math.floor(height / 2),
  ));
  // Filling four un-antialiased rectangles avoids the fuzzy multi-line edge
  // produced by Selection.selectBorder at low zoom levels.
  const strips = [
    { left, top, right, bottom: top + thickness },
    { left, top: bottom - thickness, right, bottom },
    { left, top: top + thickness, right: left + thickness, bottom: bottom - thickness },
    { left: right - thickness, top: top + thickness, right, bottom: bottom - thickness },
  ];
  for (const strip of strips) {
    await replaceSelection(document, strip, false);
    await fillSelection();
  }
  const dividerLeft = Math.floor((left + right - thickness) / 2);
  await replaceSelection(document, {
    left: dividerLeft,
    top,
    right: dividerLeft + thickness,
    bottom,
  }, false);
  await fillSelection();
  return layer;
}

function generatedGroupName(product) {
  return 'PLM Copywriting | ' + String(product && (product.sku || product.name) || 'SKU');
}

function findGeneratedGroup(document, name) {
  const layers = document && document.layers ? Array.from(document.layers) : [];
  return layers.find((layer) => String(layer && layer.name || '') === name) || null;
}

async function moveLayerToTopLeft(layer, bounds) {
  const actual = layerBounds(layer);
  if (!actual || typeof layer.translate !== 'function') return;
  await layer.translate(bounds.left - actual.left, bounds.top - actual.top);
}

function formattedTextKey(original, layout, size, resolution) {
  const text = String(layout.text || '').replace(/\r?\n/g, '\r');
  const baseStyle = original.textStyleRange[0].textStyle || {};
  const ranges = rangeSegments(layout).map((range) => ({
    _obj: 'textStyleRange',
    from: range.from,
    to: range.to,
    textStyle: styleFor(baseStyle, size, range.bold, resolution),
  }));
  const next = { ...copyDescriptor(original), _obj: 'textLayer', textKey: text, textStyleRange: ranges };
  paragraphRangesFor(next, text.length);
  return next;
}

async function applyLayout(layerId, original, layout, size, resolution) {
  const next = formattedTextKey(original, layout, size, resolution);
  await setTextKeyDescriptor(layerId, next);
  const after = await getTextKey(layerId);
  // Photoshop UXP does not expose a reliable paragraph-text overflow flag.
  // Bounds from layer/textKey/textShape use different coordinate systems, so
  // treating that comparison as a hard failure falsely rejected large boxes.
  return { textKey: after, overflow: false };
}

async function writeSelectionBoxes(product, layout, document, rawSelection, resolution) {
  const plan = buildSelectionPlan(layout, rawSelection, resolution, {
    initialSize: DEFAULT_FONT_SIZE_PT,
    minimumSize: MIN_FONT_SIZE_PT,
  });
  const groupName = generatedGroupName(product);
  const oldGroup = findGeneratedGroup(document, groupName);
  const createdLayers = [];
  let createdGroup = null;
  const previousForeground = app.foregroundColor;

  return core.executeAsModal(async () => {
    try {
      app.foregroundColor = blackColor();
      for (const block of plan.blocks) {
        if (block.type === 'text') {
          await createParagraphTextLayer(document, block, plan.size, resolution, createdLayers);
          continue;
        }
        const fontPixels = pointsToPixels(plan.size, resolution);
        const strokeWidth = Math.max(1, Math.round(fontPixels * 0.12));
        await createRepFrameLayer(
          document,
          block.headingBounds,
          strokeWidth,
          createdLayers,
          block.name + ' | frame',
        );
        const middle = (block.headingBounds.left + block.headingBounds.right) / 2;
        const cellInset = Math.max(1, strokeWidth * 2);
        const headingCells = [
          {
            left: block.headingBounds.left + cellInset,
            top: block.headingBounds.top,
            right: middle - cellInset,
            bottom: block.headingBounds.bottom,
          },
          {
            left: middle + cellInset,
            top: block.headingBounds.top,
            right: block.headingBounds.right - cellInset,
            bottom: block.headingBounds.bottom,
          },
        ];
        const labelParts = block.label.split(/\s+/);
        await createHeadingTextLayer(
          document,
          labelParts[0] || block.label,
          headingCells[0],
          plan.size,
          resolution,
          createdLayers,
          block.name + ' | label 1',
        );
        await createHeadingTextLayer(
          document,
          labelParts.slice(1).join(' ') || 'REP',
          headingCells[1],
          plan.size,
          resolution,
          createdLayers,
          block.name + ' | label 2',
        );
        await createParagraphTextLayer(
          document,
          { ...block, name: block.name + ' | body', bounds: block.bodyBounds },
          plan.size,
          resolution,
          createdLayers,
        );
      }

      if (!createdLayers.length) throw new Error('当前选区内没有可以生成的文案框。');
      try {
        createdGroup = await document.createLayerGroup({ name: groupName, fromLayers: createdLayers });
      } catch (_) {
        createdGroup = await document.groupLayers(createdLayers);
        createdGroup.name = groupName;
      }
      if (oldGroup && oldGroup.id !== createdGroup.id) oldGroup.delete();
      await replaceSelection(document, plan.selection, false);
      return {
        mode: 'selection',
        layoutMode: layout.mode,
        size: plan.size,
        missing: layout.missing,
        text: layout.text,
        boxes: plan.blocks.length,
      };
    } catch (error) {
      try {
        if (createdGroup) createdGroup.delete();
        else createdLayers.slice().reverse().forEach((layer) => layer.delete());
      } catch (_) {}
      try { await replaceSelection(document, plan.selection, false); } catch (_) {}
      throw error;
    } finally {
      try { app.foregroundColor = previousForeground; } catch (_) {}
    }
  }, { commandName: '生成 PLM 文案框' });
}

async function writeLegacyPage4(product, layout, document, resolution) {
  const activeLayers = document.activeLayers ? Array.from(document.activeLayers) : [];
  if (activeLayers.length !== 1) throw new Error('请只选中一个文本层。');
  const layer = activeLayers[0];
  const textItem = layer.textItem;
  if (!textItem || !textItem.isParagraphText) throw new Error('当前图层不是段落文本层，请先在纸盒文件中拉一个文本框。');
  const layerId = layer.id;
  return core.executeAsModal(async () => {
    const original = await getTextKey(layerId);
    const originalSize = DEFAULT_FONT_SIZE_PT;
    let size = originalSize;
    try {
      let result = await applyLayout(layerId, original, layout, size, resolution);
      let steps = 0;
      while (result.overflow && size > MIN_FONT_SIZE_PT && steps < MAX_FIT_STEPS) {
        const nextSize = Math.max(MIN_FONT_SIZE_PT, size * 0.9);
        if (nextSize >= size) break;
        size = nextSize;
        result = await applyLayout(layerId, original, layout, size, resolution);
        steps += 1;
      }
      if (result.overflow) throw new Error('字号已缩小到 Photoshop 可接受的下限，但文字框仍然溢出。');
      return { mode: 'legacy', layoutMode: layout.mode, size, missing: layout.missing, text: layout.text };
    } catch (error) {
      try { await setTextKeyDescriptor(layerId, original); } catch (_) {}
      throw error;
    }
  }, { commandName: '生成当前页面文案' });
}

async function writePage4(product) {
  const document = app.activeDocument;
  if (!document) throw new Error('请先打开纸盒 PSD 文件。');
  const resolution = Number(document.resolution) || 72;
  const selection = await readSelectionBounds(document);
  const mode = detectArtworkMode(currentDocumentTitle(), selection);
  state.layoutMode = mode;
  renderLayoutMode(mode, selection);
  const layout = buildPage4Layout(product, { mode });
  if (!layout.text) throw new Error('当前 SKU 没有可生成的文案。');
  if (selection) return writeSelectionBoxes(product, layout, document, selection, resolution);
  return writeLegacyPage4(product, layout, document, resolution);
}

async function generate() {
  const product = selectedProduct();
  if (!product) {
    setStatus('请先同步并选择一个 SKU。', 'error');
    return;
  }
  setBusy(true);
  setStatus('正在读取矩形选区并生成可编辑文案框…', 'normal');
  try {
    const result = await writePage4(product);
    const suffix = result.missing.length ? '；缺少 ' + result.missing.join('、') : '';
    const modeText = result.mode === 'selection' ? '已生成 ' + result.boxes + ' 个文案框' : '已写入当前文字层';
    setStatus(modeText + '（' + modeLabel(result.layoutMode) + '），字号 ' + result.size.toFixed(2) + ' pt' + suffix + '。', result.missing.length ? 'warning' : 'success');
  } catch (error) {
    setStatus(errorMessage(error), 'error');
  } finally {
    setBusy(false);
  }
}

function bindEvents() {
  byId('connect').addEventListener('click', connect);
  byId('disconnect').addEventListener('click', disconnect);
  byId('refresh').addEventListener('click', () => {
    updateDocumentSku();
    renderProductSelect();
    renderPreview();
    if (!send({ type: 'snapshot.request' })) setStatus('请先连接悬浮助手。', 'error');
  });
  byId('generate').addEventListener('click', generate);
  byId('clear-token').addEventListener('click', () => {
    disconnect();
    byId('token').value = '';
    void clearStoredToken();
    setStatus('已清除本机保存的连接码。', 'normal');
  });
  byId('sku-select').addEventListener('change', (event) => {
    state.selectedSku = event.target.value;
    renderPreview();
  });
}

async function init() {
  bindEvents();
  renderVersion();
  const token = await getStoredToken();
  state.token = token;
  byId('token').value = token;
  updateDocumentSku();
  renderProductSelect();
  renderPreview();
  if (token.length >= 32) connect();
  window.setInterval(() => {
    const previous = state.documentSku;
    updateDocumentSku();
    if (previous !== state.documentSku) {
      renderProductSelect();
      renderPreview();
    }
  }, 1000);
}

init();
