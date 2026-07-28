const MODE_LABELS = {
  'box-portrait': '窄纸盒',
  'box-wide': '宽纸盒',
  label: '横向标签',
  'label-wide': '超宽标签',
};

function numberValue(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value._value === 'number') return value._value;
  if (value && typeof value.value === 'number') return value.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function selectionRatio(bounds) {
  if (!bounds) return NaN;
  const left = numberValue(bounds.left);
  const right = numberValue(bounds.right);
  const top = numberValue(bounds.top);
  const bottom = numberValue(bounds.bottom);
  const width = Math.abs(right - left);
  const height = Math.abs(bottom - top);
  return width > 0 && height > 0 ? width / height : NaN;
}

function filenameKind(title) {
  const value = String(title || '').toLowerCase();
  const isBox = /纸盒|彩盒|折盒|包装盒|carton|pack(?:age|aging)?\s*box|\bbox\b/.test(value);
  const isLabel = /标签|贴纸|不干胶|label|sticker|decal|self[-\s]?adhesive/.test(value);
  if (isBox && !isLabel) return 'box';
  if (isLabel && !isBox) return 'label';
  return 'unknown';
}

function detectArtworkMode(title, bounds) {
  const ratio = selectionRatio(bounds);
  const kind = filenameKind(title);
  if (kind === 'label') return Number.isFinite(ratio) && ratio >= 3.2 ? 'label-wide' : 'label';
  if (kind === 'box') return Number.isFinite(ratio) && ratio >= 1.25 ? 'box-wide' : 'box-portrait';
  if (Number.isFinite(ratio) && ratio >= 3.2) return 'label-wide';
  if (Number.isFinite(ratio) && ratio >= 2.0) return 'label';
  if (Number.isFinite(ratio) && ratio >= 1.25) return 'box-wide';
  return 'box-portrait';
}

function modeLabel(mode) {
  return MODE_LABELS[mode] || MODE_LABELS['box-portrait'];
}

if (typeof module !== 'undefined') {
  module.exports = {
    MODE_LABELS,
    selectionRatio,
    filenameKind,
    detectArtworkMode,
    modeLabel,
  };
}
