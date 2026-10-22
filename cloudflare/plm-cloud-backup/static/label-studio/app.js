(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const engine = window.LabelEngine;
  const state = { items: [], selected: '', view: 'print', exporting: false, toastTimer: 0 };
  const selected = () => state.items.find((item) => item.sku === state.selected);
  const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4500);
  }
  function parseSkus(value) {
    const tokens = String(value).trim().toUpperCase().split(/[\s,，;；、]+/).filter(Boolean);
    const invalid = tokens.filter((sku) => !/^[A-Z0-9][A-Z0-9_-]{0,59}$/.test(sku));
    return { skus: [...new Set(tokens.filter((sku) => !invalid.includes(sku)))], invalid };
  }
  function addSkus() {
    if (state.exporting) return;
    const { skus, invalid } = parseSkus($('sku-input').value);
    if (invalid.length) return toast('编码仅支持英文字母、数字、下划线和连字符，请检查：' + invalid.slice(0, 3).join('、'));
    if (!skus.length) return toast('请先输入商品编码');
    const additions = skus.filter((sku) => !state.items.some((item) => item.sku === sku));
    if (state.items.length + additions.length > 100) return toast('每批最多 100 个编码，请分批制作');
    additions.forEach((sku) => state.items.push({ sku, image: '', version: 0, result: null, job: null, status: '', error: '' }));
    state.selected = additions[0] || skus[0];
    $('sku-input').value = '';
    render();
    toast(additions.length ? '已添加 ' + additions.length + ' 个商品，粘贴对应商品图即可' : '这些编码已在列表中，已为你选中');
  }
  function releaseResult(item) {
    if (item.result) {
      URL.revokeObjectURL(item.result.printUrl);
      URL.revokeObjectURL(item.result.sizeUrl);
      item.result = null;
    }
  }
  function dispose(item) {
    item.version++;
    if (item.image) URL.revokeObjectURL(item.image);
    releaseResult(item);
  }
  function render() {
    $('count').textContent = state.items.length;
    $('queue').innerHTML = state.items.length ? state.items.map((item) =>
      '<div class="queue-row' + (item.sku === state.selected ? ' selected' : '') + '"><button class="queue-select" data-select="' + escape(item.sku) + '" aria-pressed="' + (item.sku === state.selected) + '"><span class="queue-thumb">' + (item.image ? '<img src="' + item.image + '" alt="">' : '▧') + '</span><span class="queue-text"><strong>' + escape(item.sku) + '</strong><small class="' + (item.error ? 'error' : item.result ? 'ready' : '') + '">' + escape(item.error || item.status || (item.image ? '等待生成' : '待添加商品图')) + '</small></span></button><button class="remove" data-remove="' + escape(item.sku) + '" aria-label="移除 ' + escape(item.sku) + '" title="移除此商品"' + (state.exporting ? ' disabled' : '') + '>×</button></div>'
    ).join('') : '<div class="list-empty">添加商品编码，开始制作第一张标签。</div>';
    const ready = state.items.filter((item) => item.image).length;
    $('queue-summary').textContent = state.items.length ? ready + ' / ' + state.items.length + ' 个商品已添加图片' : '等待添加商品';
    $('clear').disabled = !state.items.length || state.exporting;
    $('add').disabled = state.exporting;
    $('sku-input').disabled = state.exporting;
    $('image-input').disabled = state.exporting;
    $('download-all').disabled = !ready || state.exporting;
    $('download-all').textContent = state.exporting ? '正在打包…' : '批量导出 ZIP ↓';
    const item = selected();
    $('download-current').disabled = !item || !item.image || state.exporting;
    $('active-sku').textContent = item ? item.sku : '未选择商品';
    $('source-image').hidden = !item || !item.image;
    if (item && item.image) $('source-image').src = item.image;
    else $('source-image').removeAttribute('src');
    $('drop-copy').hidden = !!(item && item.image);
    $('replace-hint').hidden = !(item && item.image);
    $('item-status').textContent = item ? (item.error || item.status || '等待商品图片') : '等待商品图片';
    const result = item && item.result;
    $('preview-empty').hidden = !!result;
    $('preview-image').hidden = !result;
    if (result) $('preview-image').src = state.view === 'print' ? result.printUrl : result.sizeUrl;
    else $('preview-image').removeAttribute('src');
    $('preview-image').alt = state.view === 'print' ? '标签预览' : '标签尺寸说明图';
    $('preview-meta').textContent = state.view === 'print' ? '4 × 3 cm' : '3000 × 3000 px';
    $('tab-print').setAttribute('aria-selected', String(state.view === 'print'));
    $('tab-size').setAttribute('aria-selected', String(state.view === 'size'));
  }
  async function generate(item) {
    if (!item.image || item.result) return;
    if (item.job) return item.job;
    const version = item.version;
    const image = item.image;
    const work = (async () => {
      item.status = '正在生成预览…';
      item.error = '';
      render();
      // Give the browser a paint before the existing high-resolution renderer runs.
      await new Promise((resolve) => setTimeout(resolve, 20));
      try {
        const print = await engine.renderToyLabelPrintCanvas({ sku: item.sku, widthCm: 4, heightCm: 3, productImage: { dataUrl: image } });
        const size = await engine.renderToyLabelPreviewCanvas({ sku: item.sku, widthCm: 4, heightCm: 3, printCanvas: print });
        const [printBlob, sizeBlob] = await Promise.all([engine.canvasToBlob(print, 'image/jpeg', .95), engine.canvasToBlob(size, 'image/jpeg', .95)]);
        // Existing layout is 300 pixels/cm: 1200x900 at 762ppi = 4x3cm.
        const psdBlob = engine.canvasToFlatPsdBlob(print, 762);
        print.width = print.height = size.width = size.height = 1;
        if (item.version !== version || !state.items.includes(item)) return;
        item.result = { printBlob, sizeBlob, psdBlob, printUrl: URL.createObjectURL(printBlob), sizeUrl: URL.createObjectURL(sizeBlob) };
        item.status = '已生成 · 可导出';
      } catch (error) {
        if (item.version === version) {
          item.error = '生成失败，请替换图片后重试';
          item.status = '';
          toast(item.sku + '：图片无法读取，请使用 PNG、JPG 或 WebP');
        }
      }
    })();
    item.job = work;
    await work;
    if (item.job === work) item.job = null;
    render();
    // A replacement may have arrived while the previous image was rendering.
    if (item.version !== version && item.image && state.items.includes(item)) return generate(item);
  }
  async function setImage(item, file) {
    if (state.exporting) return;
    if (!/^image\/(?:png|jpeg|webp)$/.test(file.type)) return toast('支持 PNG、JPG 和 WebP 图片');
    if (file.size > 20 * 1024 * 1024) return toast('单张图片请小于 20 MB');
    // Reject oversized decoded images before the whitespace trim reads all pixels.
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return toast('这张图片无法读取，请重新复制或选择文件');
    const tooLarge = bitmap.width * bitmap.height > 25000000;
    bitmap.close();
    if (tooLarge) return toast('图片超过 2500 万像素，请缩小后添加');
    if (state.exporting || !state.items.includes(item)) return;
    dispose(item);
    item.image = URL.createObjectURL(file);
    item.error = '';
    item.status = '图片已添加';
    render();
    await generate(item);
  }
  async function acceptFiles(files) {
    if (state.exporting) return toast('正在导出，请稍候');
    const images = Array.from(files).filter((file) => /^image\//.test(file.type));
    if (!images.length) return toast('请粘贴或选择图片文件');
    if (!selected()) return toast('请先添加商品编码');
    if (images.length === 1) {
      const matches = fileMatches(images[0].name);
      if (matches.length > 1) return toast('文件名包含多个商品编码，请为每张图片保留一个完整编码');
      const item = matches[0] || selected();
      state.selected = item.sku;
      await setImage(item, images[0]);
      return;
    }
    const assigned = new Set();
    let skipped = 0;
    for (const file of images) {
      const matches = fileMatches(file.name);
      if (matches.length !== 1 || assigned.has(matches[0].sku)) { skipped++; continue; }
      assigned.add(matches[0].sku);
      await setImage(matches[0], file);
    }
    toast('批量匹配完成' + (skipped ? '；' + skipped + ' 张未匹配或重复，请以完整商品编码命名后添加' : ''));
  }
  function fileMatches(name) {
    const tokens = String(name).toUpperCase().replace(/\.[^.]+$/, '').split(/[^A-Z0-9_-]+/).filter(Boolean);
    // Delimiters must surround the complete code: SKU1 must never match SKU10.
    return state.items.filter((item) => tokens.some((token) => token === item.sku || token.split(/[_-]/).includes(item.sku)));
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  // Dependency-free ZIP (stored files), UTF-8 filenames and CRC32.
  const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
    for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function zipHeader(size) {
    const bytes = new Uint8Array(size);
    const data = new DataView(bytes.buffer);
    return { bytes, u16: (offset, n) => data.setUint16(offset, n, true), u32: (offset, n) => data.setUint32(offset, n, true) };
  }
  async function zipFiles(files) {
    const local = [], central = [];
    let offset = 0, centralSize = 0;
    for (const file of files) {
      const name = new TextEncoder().encode(file.name);
      const data = new Uint8Array(await file.blob.arrayBuffer());
      const crc = crc32(data);
      const h = zipHeader(30);
      h.u32(0, 0x04034b50); h.u16(4, 20); h.u16(6, 0x800); h.u16(12, 33);
      h.u32(14, crc); h.u32(18, data.length); h.u32(22, data.length); h.u16(26, name.length);
      local.push(h.bytes, name, file.blob);
      const c = zipHeader(46);
      c.u32(0, 0x02014b50); c.u16(4, 20); c.u16(6, 20); c.u16(8, 0x800); c.u16(14, 33);
      c.u32(16, crc); c.u32(20, data.length); c.u32(24, data.length); c.u16(28, name.length); c.u32(42, offset);
      central.push(c.bytes, name);
      offset += 30 + name.length + data.length;
      centralSize += 46 + name.length;
      if (offset > 0xffffffff) throw new Error('导出文件超过 ZIP 容量，请分批导出');
    }
    const end = zipHeader(22);
    end.u32(0, 0x06054b50); end.u16(8, files.length); end.u16(10, files.length); end.u32(12, centralSize); end.u32(16, offset);
    return new Blob([...local, ...central, end.bytes], { type: 'application/zip' });
  }
  async function exportItems(items, batch) {
    if (state.exporting) return;
    const missing = items.filter((item) => !item.image);
    if (missing.length) {
      state.selected = missing[0].sku;
      render();
      return toast('有 ' + missing.length + ' 个商品未添加图片，请先补齐后批量导出');
    }
    state.exporting = true;
    render();
    try {
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        toast('正在准备 ' + (i + 1) + ' / ' + items.length + '：' + item.sku);
        await generate(item);
        if (!item.result) throw new Error(item.sku + ' 生成失败，请重新添加图片后导出');
        const prefix = batch ? item.sku + '/' : '';
        files.push(
          { name: prefix + item.sku + ' 标签（4x3cm）.psd', blob: item.result.psdBlob },
          { name: prefix + item.sku + ' 标签印刷4x3cm.jpg', blob: item.result.printBlob },
          { name: prefix + item.sku + ' 标签尺寸说明图.jpg', blob: item.result.sizeBlob }
        );
      }
      const archive = await zipFiles(files);
      download(archive, batch ? '标签制作_' + items.length + '个商品.zip' : items[0].sku + ' 标签文件.zip');
      toast('已导出 ' + items.length + ' 个商品，每个商品含 PSD、印刷图和尺寸说明图');
    } catch (error) { toast(error.message || '导出失败，请重试'); }
    finally { state.exporting = false; render(); }
  }
  $('add').addEventListener('click', addSkus);
  $('sku-input').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') addSkus(); });
  $('queue').addEventListener('click', (event) => {
    const choose = event.target.closest('[data-select]');
    const remove = event.target.closest('[data-remove]');
    if (choose) { state.selected = choose.dataset.select; render(); }
    if (remove && !state.exporting) {
      const item = state.items.find((entry) => entry.sku === remove.dataset.remove);
      if (!item) return;
      dispose(item);
      state.items = state.items.filter((entry) => entry !== item);
      if (!selected()) state.selected = state.items[0]?.sku || '';
      render();
    }
  });
  $('clear').addEventListener('click', () => {
    if (state.exporting) return;
    if (state.items.some((item) => item.image) && !confirm('清空制作列表？当前商品图片和生成文件将一并移除。')) return;
    state.items.forEach(dispose); state.items = []; state.selected = ''; render();
  });
  $('image-input').addEventListener('change', async (event) => { await acceptFiles(event.target.files); event.target.value = ''; });
  $('dropzone').addEventListener('click', (event) => { if (!selected() || state.exporting) { event.preventDefault(); toast(state.exporting ? '正在导出，请稍候' : '请先添加商品编码'); } });
  $('dropzone').addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (selected() && !state.exporting) $('image-input').click(); else toast('请先添加商品编码'); } });
  $('dropzone').addEventListener('dragover', (event) => { event.preventDefault(); $('dropzone').classList.add('dragover'); });
  $('dropzone').addEventListener('dragleave', () => $('dropzone').classList.remove('dragover'));
  $('dropzone').addEventListener('drop', (event) => { event.preventDefault(); $('dropzone').classList.remove('dragover'); acceptFiles(event.dataTransfer.files); });
  document.addEventListener('dragover', (event) => event.preventDefault());
  document.addEventListener('drop', (event) => event.preventDefault());
  document.addEventListener('paste', (event) => {
    const files = Array.from(event.clipboardData?.items || []).filter((item) => item.kind === 'file' && item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
    if (files.length) { event.preventDefault(); acceptFiles(files); }
  });
  for (const id of ['tab-print', 'tab-size']) {
    $(id).addEventListener('click', () => { state.view = $(id).dataset.view; render(); });
    $(id).addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = $(id === 'tab-print' ? 'tab-size' : 'tab-print'); next.click(); next.focus(); }
    });
  }
  $('download-current').addEventListener('click', () => { if (selected()) exportItems([selected()], false); });
  $('download-all').addEventListener('click', () => exportItems([...state.items], true));
  window.addEventListener('beforeunload', (event) => { if (state.items.some((item) => item.image)) { event.preventDefault(); event.returnValue = ''; } });
  render();
})();
