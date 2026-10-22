// Web-only quality adapter. Layout stays identical to the userscript.
function drawImageContained(ctx, image, x, y, w, h) {
  const iw = image.naturalWidth || image.width || 1;
  const ih = image.naturalHeight || image.height || 1;
  const ratio = Math.min(w / iw, h / ih);
  const dw = iw * ratio;
  const dh = ih * ratio;
  let source = image;
  let sw = iw, sh = ih;
  // Halve large reductions in stages rather than discarding fine detail in
  // one low-quality browser sampling step. Never upscale the source here.
  while (sw > dw * 2 && sh > dh * 2) {
    const next = document.createElement('canvas');
    next.width = Math.max(1, Math.round(sw / 2));
    next.height = Math.max(1, Math.round(sh / 2));
    const context = next.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, next.width, next.height);
    if (source !== image) source.width = source.height = 1;
    source = next;
    sw = next.width;
    sh = next.height;
  }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
  if (source !== image) source.width = source.height = 1;
}
