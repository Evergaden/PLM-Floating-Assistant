const DEFAULT_FONT_SIZE_PT = 4;
const MIN_FONT_SIZE_PT = 2.5;
const APPROX_CHAR_WIDTH = 0.52;

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

function charactersPerLine(width, size, resolution) {
  const fontPixels = Math.max(1, pointsToPixels(size, resolution));
  return Math.max(1, Math.floor(width / (fontPixels * APPROX_CHAR_WIDTH)));
}

function textLineCount(text, width, size, resolution) {
  const maxCharacters = charactersPerLine(width, size, resolution);
  return String(text || '').split(/\r?\n/).reduce((total, line) => {
    const length = line.length || 1;
    return total + Math.max(1, Math.ceil(length / maxCharacters));
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

function wrapLayout(layout, width, size, resolution) {
  if (!layout || !Array.isArray(layout.segments) || !layout.segments.length) return layout;
  const maxCharacters = charactersPerLine(width, size, resolution);
  const segments = [];
  let lineLength = 0;
  const append = (text, bold) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.bold === Boolean(bold)) last.text += text;
    else segments.push({ text, bold: Boolean(bold) });
  };

  layout.segments.forEach((segment) => {
    const bold = Boolean(segment && segment.bold);
    String(segment && segment.text || '').split('').forEach((character) => {
      if (character === '\r' || character === '\n') {
        append('\n', false);
        lineLength = 0;
        return;
      }
      if (lineLength >= maxCharacters) {
        if (character === ' ') {
          append('\n', false);
          lineLength = 0;
          return;
        }
        append('\n', false);
        lineLength = 0;
      }
      append(character, bold);
      lineLength += 1;
    });
  });

  return {
    ...layout,
    segments,
    text: segments.map((segment) => segment.text).join(''),
  };
}

function createBlockSpecs(layout) {
  const boxes = layout && layout.boxes ? layout.boxes : {};
  const specs = [];
  if (layout && (layout.mode === 'label' || layout.mode === 'label-wide')) {
    if (boxes.labelName && boxes.labelName.text) {
      specs.push({ type: 'text', key: 'labelName', name: 'PLM 文案助手｜标签名称', layout: boxes.labelName });
    }
    if (boxes.labelFacts && boxes.labelFacts.text) {
      specs.push({ type: 'text', key: 'labelFacts', name: 'PLM 文案助手｜标签信息', layout: boxes.labelFacts });
    }
  } else if (boxes.info && boxes.info.text) {
    specs.push({ type: 'text', key: 'info', name: 'PLM 文案助手｜信息', layout: boxes.info });
  }
  if (boxes.address && boxes.address.text) {
    specs.push({ type: 'text', key: 'address', name: 'PLM 文案助手｜经销商地址', layout: boxes.address });
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

function buildPortraitSelectionPlan(layout, rawBounds, resolution, options) {
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
    const wrappedLayout = wrapLayout(spec.layout, contentWidth, size, resolution);
    cursor = blockBottom + (index === specs.length - 1 ? 0 : gap);
    if (spec.type !== 'rep') {
      return {
        ...spec,
        layout: wrappedLayout,
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
      layout: wrappedLayout,
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

function buildWideSelectionPlan(layout, rawBounds, resolution, options) {
  const bounds = normalizeBounds(rawBounds);
  if (!bounds) throw new Error('请先用矩形选框框住需要生成文案的区域。');
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
  if (!specs.length) throw new Error('当前 SKU 没有可生成的文案。');
  const textSpecs = specs.filter((spec) => spec.type === 'text');
  const repSpecs = specs.filter((spec) => spec.type === 'rep');
  const columnGap = Math.max(1, Math.round(pointsToPixels(8, resolution)));
  const columnWidth = Math.max(4, (contentWidth - columnGap * 2) / 3);
  let size = Number(options && options.initialSize) || DEFAULT_FONT_SIZE_PT;
  const minimumSize = Number(options && options.minimumSize) || MIN_FONT_SIZE_PT;
  let measured;

  for (;;) {
    const fontPixels = fontPixelsFor(size, resolution);
    const gap = Math.max(1, Math.round(fontPixels * 0.25));
    const textMetricsList = textSpecs.map((spec) => textMetrics(spec.layout, contentWidth, size, resolution));
    const headingHeight = Math.max(fontPixels + Math.max(2, Math.round(fontPixels * 0.2) * 2), 8);
    const repMetrics = repSpecs.map((spec) => textMetrics(spec.layout, columnWidth, size, resolution));
    const repHeight = repSpecs.length
      ? headingHeight + gap + Math.max(...repMetrics.map((metric) => metric.height), 0)
      : 0;
    const textHeight = textMetricsList.reduce((total, metric) => total + metric.height, 0)
      + Math.max(0, textMetricsList.length - 1) * gap;
    const requiredHeight = textHeight
      + (textSpecs.length && repSpecs.length ? gap : 0)
      + repHeight;
    measured = { gap, headingHeight, textMetricsList, repMetrics, repHeight, requiredHeight };
    if (requiredHeight <= availableHeight || size <= minimumSize) break;
    const next = Math.max(minimumSize, Math.round((size - 0.25) * 100) / 100);
    if (next >= size) break;
    size = next;
  }
  if (measured.requiredHeight > availableHeight + 1) {
    throw new Error('选区高度不足，请把矩形选框向下扩大，或减少选区内的其他内容。');
  }

  const blocks = [];
  let cursor = top;
  textSpecs.forEach((spec, index) => {
    const metric = measured.textMetricsList[index];
    const blockBottom = Math.min(bottom, cursor + metric.height);
    blocks.push({
      ...spec,
      layout: wrapLayout(spec.layout, contentWidth, size, resolution),
      bounds: { left, top: cursor, right, bottom: blockBottom },
    });
    cursor = blockBottom + (index === textSpecs.length - 1 && !repSpecs.length ? 0 : measured.gap);
  });

  if (repSpecs.length) {
    const rowTop = cursor;
    repSpecs.forEach((spec, index) => {
      const columnLeft = left + index * (columnWidth + columnGap);
      const headingWidth = Math.min(
        columnWidth * 0.62,
        Math.max(fontPixelsFor(size, resolution) * 5.5, columnWidth * 0.2),
      );
      const headingBounds = {
        left: columnLeft,
        top: rowTop,
        right: columnLeft + headingWidth,
        bottom: rowTop + measured.headingHeight,
      };
      const bodyTop = headingBounds.bottom + measured.gap;
      blocks.push({
        ...spec,
        layout: wrapLayout(spec.layout, columnWidth, size, resolution),
        bounds: {
          left: columnLeft,
          top: rowTop,
          right: columnLeft + columnWidth,
          bottom: Math.min(bottom, rowTop + measured.repHeight),
        },
        headingBounds,
        bodyBounds: {
          left: columnLeft,
          top: bodyTop,
          right: columnLeft + columnWidth,
          bottom: Math.min(bottom, rowTop + measured.repHeight),
        },
      });
    });
  }

  return {
    selection: bounds,
    contentBounds: { left, top, right, bottom },
    contentWidth,
    size,
    blocks,
    orientation: 'wide',
  };
}

function buildSelectionPlan(layout, rawBounds, resolution, options) {
  const mode = layout && layout.mode;
  if (mode === 'box-wide' || mode === 'label' || mode === 'label-wide') {
    return buildWideSelectionPlan(layout, rawBounds, resolution, options);
  }
  return buildPortraitSelectionPlan(layout, rawBounds, resolution, options);
}

function fontPixelsFor(size, resolution) {
  return Math.max(1, pointsToPixels(size, resolution));
}

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_FONT_SIZE_PT,
    MIN_FONT_SIZE_PT,
    normalizeBounds,
    charactersPerLine,
    textLineCount,
    wrapLayout,
    buildSelectionPlan,
  };
}
