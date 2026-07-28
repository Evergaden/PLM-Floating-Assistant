const DEFAULT_FONT_SIZE_PT = 4;
const MIN_FONT_SIZE_PT = 2.5;

function numeric(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value._value === 'number') return value._value;
  if (value && typeof value.value === 'number') return value.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeBounds(value) {
  if (!value) return null;
  const bounds = {
    left: numeric(value.left),
    top: numeric(value.top),
    right: numeric(value.right),
    bottom: numeric(value.bottom),
  };
  if (!Object.values(bounds).every(Number.isFinite)) return null;
  if (bounds.right < bounds.left) [bounds.left, bounds.right] = [bounds.right, bounds.left];
  if (bounds.bottom < bounds.top) [bounds.top, bounds.bottom] = [bounds.bottom, bounds.top];
  if (bounds.right - bounds.left < 4 || bounds.bottom - bounds.top < 4) return null;
  return bounds;
}

function pointsToPixels(points, resolution) {
  return points * (Number(resolution) || 72) / 72;
}

function textLineCount(text, width, size, resolution) {
  const fontPixels = Math.max(1, pointsToPixels(size, resolution));
  const charactersPerLine = Math.max(1, Math.floor(width / (fontPixels * 0.52)));
  return String(text || '').split(/\r?\n/).reduce((total, line) => {
    const length = line.length || 1;
    return total + Math.max(1, Math.ceil(length / charactersPerLine));
  }, 0);
}

function textMetrics(layout, width, size, resolution) {
  const fontPixels = Math.max(1, pointsToPixels(size, resolution));
  // The artwork uses a fixed leading equal to the font size. Do not use
  // Photoshop's automatic 120% leading and do not stretch boxes to fill the
  // whole marquee selection.
  const lineHeight = fontPixels;
  const lines = textLineCount(layout && layout.text, width, size, resolution);
  return {
    lines,
    lineHeight,
    height: lines * lineHeight,
  };
}

function createBlockSpecs(layout) {
  const boxes = layout && layout.boxes ? layout.boxes : {};
  const specs = [];
  if (boxes.info && boxes.info.text) {
    specs.push({ type: 'text', key: 'info', name: 'PLM 文案助手｜信息', layout: boxes.info });
  }
  if (boxes.address && boxes.address.text) {
    specs.push({ type: 'text', key: 'address', name: 'PLM 文案助手｜地址', layout: boxes.address });
  }
  (boxes.reps || []).forEach((rep) => {
    if (!rep || !rep.complete || !rep.text) return;
    specs.push({
      type: 'rep',
      key: rep.key,
      name: 'PLM 文案助手｜' + rep.label,
      label: rep.label,
      layout: { segments: rep.segments, text: rep.text },
    });
  });
  return specs;
}

function buildSelectionPlan(layout, rawBounds, resolution, options) {
  const bounds = normalizeBounds(rawBounds);
  if (!bounds) throw new Error('请先用矩形选框框住第四页右侧文案区域。');
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const marginX = Math.max(1, Math.round(width * 0.01));
  const marginY = Math.max(1, Math.round(height * 0.01));
  const left = bounds.left + marginX;
  const right = bounds.right - marginX;
  const top = bounds.top + marginY;
  const bottom = bounds.bottom - marginY;
  const contentWidth = Math.max(4, right - left);
  const availableHeight = Math.max(4, bottom - top);
  const specs = createBlockSpecs(layout);
  if (!specs.length) throw new Error('当前 SKU 没有可生成的第四页文案。');

  let size = Number(options && options.initialSize) || DEFAULT_FONT_SIZE_PT;
  const minimumSize = Number(options && options.minimumSize) || MIN_FONT_SIZE_PT;
  let metrics = [];
  let requiredHeight = 0;
  for (;;) {
    const fontPixels = Math.max(1, pointsToPixels(size, resolution));
    const gap = Math.max(1, Math.round(fontPixels * 0.25));
    metrics = specs.map((spec) => {
      const body = textMetrics(spec.layout, contentWidth, size, resolution);
      if (spec.type === 'rep') {
        const headingHeight = Math.max(fontPixels + Math.max(2, Math.round(fontPixels * 0.2) * 2), 8);
        return {
          ...body,
          headingHeight,
          required: headingHeight + gap + body.height + gap,
        };
      }
      return { ...body, required: body.height + gap };
    });
    requiredHeight = metrics.reduce((total, metric) => total + metric.required, 0)
      + Math.max(0, metrics.length - 1) * gap;
    if (requiredHeight <= availableHeight || size <= minimumSize) break;
    const next = Math.max(minimumSize, Math.round((size - 0.25) * 100) / 100);
    if (next >= size) break;
    size = next;
  }
  if (requiredHeight > availableHeight + 1) {
    throw new Error('选区高度不足，请把矩形选框向下扩大，或减少选区内的其他内容。');
  }

  let cursor = top;
  const blocks = specs.map((spec, index) => {
    const metric = metrics[index];
    const blockTop = cursor;
    const blockBottom = Math.min(bottom, blockTop + metric.required);
    const fontPixels = fontPixelsFor(size, resolution);
    const gap = Math.max(1, Math.round(fontPixels * 0.25));
    cursor = blockBottom + (index === specs.length - 1 ? 0 : gap);
    if (spec.type !== 'rep') {
      return {
        ...spec,
        bounds: { left, top: blockTop, right, bottom: blockBottom },
      };
    }
    const headingWidth = Math.min(
      contentWidth * 0.3,
      Math.max(fontPixelsFor(size, resolution) * 5.5, contentWidth * 0.18),
    );
    const headingBounds = {
      left,
      top: blockTop,
      right: left + headingWidth,
      bottom: blockTop + metric.headingHeight,
    };
    const bodyTop = headingBounds.bottom + gap;
    return {
      ...spec,
      bounds: { left, top: blockTop, right, bottom: blockBottom },
      headingBounds,
      bodyBounds: { left, top: bodyTop, right, bottom: blockBottom },
    };
  });

  return {
    selection: bounds,
    contentBounds: { left, top, right, bottom },
    contentWidth,
    size,
    blocks,
  };
}

function fontPixelsFor(size, resolution) {
  return Math.max(1, pointsToPixels(size, resolution));
}

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_FONT_SIZE_PT,
    MIN_FONT_SIZE_PT,
    normalizeBounds,
    textLineCount,
    buildSelectionPlan,
  };
}
