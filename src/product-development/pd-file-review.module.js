  const PRODUCT_DEVELOPMENT_PSD_REVIEW_STATUS = {
    difference: '有差异', unread: '待确认图层', match: '一致', reference: '仅提取',
  };

  function productDevelopmentPsdReviewHighlight(expected, actual) {
    const tokenize = (value) => value.match(/[\p{L}\p{N}\p{M}]+|[^\s]|\s+/gu) || [];
    const left = tokenize(expected);
    const right = tokenize(actual);
    // Bound the token alignment cost for long multilingual paragraphs.
    if (left.length * right.length > 160000) return [escapeHtml(expected), escapeHtml(actual)];
    const normalized = (tokens) => tokens.map((value) => /^\s+$/.test(value) ? ' ' : value.toLowerCase());
    const a = normalized(left);
    const b = normalized(right);
    const matrix = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        matrix[i][j] = a[i] === b[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    const keptLeft = new Set();
    const keptRight = new Set();
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        keptLeft.add(i++);
        keptRight.add(j++);
      } else if (matrix[i + 1][j] >= matrix[i][j + 1]) i++;
      else j++;
    }
    const render = (tokens, kept) => tokens.map((token, index) => kept.has(index) || !token.trim()
      ? escapeHtml(token) : '<mark>' + escapeHtml(token) + '</mark>').join('');
    return [render(left, keptLeft), render(right, keptRight)];
  }

  function productDevelopmentPsdReviewCurrentHtml(file) {
    if (!file) return '<div class="pfh-psd-empty"><strong>选择要核对的包装稿</strong><p>可以一次加入纸盒和标签，逐份查看对照结果。</p></div>';
    if (file.error) return '<div class="pfh-psd-empty"><strong>文件读取失败</strong><p>' + escapeHtml(file.error) + '</p></div>';
    const report = file.report;
    if (!report) return '<div class="pfh-psd-empty"><strong>正在读取 PSD 图层</strong></div>';
    const coverage = [report.layers.length + ' 个可见文本框'];
    if (report.hiddenCount) coverage.push('已过滤 ' + report.hiddenCount + ' 个隐藏文本框');
    if (report.smartCount) coverage.push(report.smartCount + ' 个智能对象需人工确认');
    if (report.unreadableCount) coverage.push(report.unreadableCount + ' 个文本框读取失败');
    const summary = '<div class="pfh-psd-coverage">' + escapeHtml(coverage.join(' · ')) + '</div>';
    const rawButton = report.layers.length ? '<button type="button" data-psd-control="raw" aria-pressed="' + file.raw + '">' +
      (file.raw ? '返回对照' : '查看图层原文') + '</button>' : '';
    if (file.raw) {
      return '<div class="pfh-psd-toolbar"><strong>可见文本框</strong>' + rawButton + '</div><div class="pfh-psd-raw">' +
        report.layers.map((layer) => '<details><summary>' + escapeHtml(layer.name) + '</summary><pre>' + escapeHtml(layer.text) + '</pre></details>').join('') + '</div>' + summary;
    }
    if (!report.type) {
      return '<div class="pfh-psd-toolbar"><strong>模板待确认</strong>' + rawButton + '</div><div class="pfh-psd-empty">' +
        (report.layers.length ? '<p>此文件的版面尚未登记。可查看图层原文。</p>' : '<p>没有读到可编辑的可见文字。请检查 Photoshop 源文件。</p>') + '</div>' + summary;
    }

    const review = report.rows.filter((row) => row.status === 'difference' || row.status === 'unread');
    const rows = file.filter === 'review' ? review : report.rows;
    const active = rows.find((row) => row.key === file.field) || rows[0];
    const consistent = report.rows.filter((row) => row.status === 'match').length;
    const controls = '<div class="pfh-psd-filter" aria-label="筛选审核字段">' +
      '<button type="button" data-psd-filter="review" aria-pressed="' + (file.filter === 'review') + '">待复核 <b>' + review.length + '</b></button>' +
      '<button type="button" data-psd-filter="all" aria-pressed="' + (file.filter === 'all') + '">全部字段 <b>' + report.rows.length + '</b></button></div>';
    const nav = '<div class="pfh-psd-fields" aria-label="对照字段">' + rows.map((row) =>
      '<button type="button" data-psd-field="' + row.key + '" aria-pressed="' + (row === active) + '"><strong>' + row.label +
      '</strong><span data-status="' + row.status + '">' + PRODUCT_DEVELOPMENT_PSD_REVIEW_STATUS[row.status] + '</span></button>').join('') + '</div>';
    const extractedOnly = report.rows.filter((row) => row.status === 'reference').length;
    const passed = !review.length && consistent > 0
      ? '<div class="pfh-psd-pass"><span class="pfh-psd-pass-icon">' + CORE_ICON_ASSETS.check + '</span>' +
        '<div><strong>本次没有待复核字段</strong><p>已核对一致 ' + consistent + ' 项' +
        (extractedOnly ? ' · 仅提取 ' + extractedOnly + ' 项' : '') + '</p></div></div>'
      : '';
    let body = passed ? '' : '<div class="pfh-psd-empty"><strong>暂无可核对字段</strong><p>可在「全部字段」查看已提取的原文。</p></div>';
    if (active) {
      const [expected, actual] = active.status === 'difference'
        ? productDevelopmentPsdReviewHighlight(active.expected, active.actual)
        : [escapeHtml(active.expected), escapeHtml(active.actual)];
      body = '<div class="pfh-psd-comparison">' + nav + '<section class="pfh-psd-readout"><div class="pfh-psd-field-heading"><h4>' +
        active.label + '</h4><span data-status="' + active.status + '">' + PRODUCT_DEVELOPMENT_PSD_REVIEW_STATUS[active.status] + '</span></div>' +
        '<div class="pfh-psd-pair"><div><h5>设计端 PLM 文案</h5><pre>' + (expected || '当前 PLM 文案中无此字段') +
        '</pre></div><div><h5>PSD 图层原文</h5><pre>' + (actual || '可读取的图层中未定位到此字段') + '</pre></div></div>' +
        (active.key === 'net' ? '<p class="pfh-psd-field-note">按 PLM 文案里的计量单位核对。</p>' : '') + '</section></div>';
    }
    return '<div class="pfh-psd-toolbar">' + controls + rawButton + '</div>' + passed + body + summary;
  }

  function plmCopywritingFileReviewUnavailable(record) {
    if (state.copywritingLoading || state.copywritingChecking && !state.copywritingQuietCheck) return '正在获取 PLM 文案，请稍候';
    if (state.copywritingError) return '请重新获取当前 SKU 的 PLM 文案';
    if (!record?.fileName || !record.sections.length) return '请先获取当前 SKU 的 PLM 产品文案';
    return '';
  }

  function openPlmCopywritingFileReview(trigger) {
    if (state.view !== 'detail' || !state.copywritingMode || !state.data?.sku) return;
    const sku = state.data.sku;
    const record = getCopywritingDisplayRecord(state.data);
    const unavailable = plmCopywritingFileReviewUnavailable(record);
    if (unavailable) {
      showToast(unavailable);
      return;
    }
    const reference = productDevelopmentPsdReviewReference(record);
    const panel = ensurePanel();
    if (panel.querySelector('.pfh-psd-review')) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'pfh-psd-review';
    dialog.setAttribute('aria-label', 'PSD 文件审核');
    dialog.innerHTML = '<header class="pfh-psd-header"><div><h3>包装文件审核</h3><p>' + escapeHtml(sku) +
      ' · PLM 文案 · ' + escapeHtml(record.fileName) + '</p></div>' +
      '<form method="dialog"><button type="submit" class="pfh-psd-close" aria-label="关闭文件审核">' + CORE_ICON_ASSETS.close + '</button></form></header>' +
      '<div class="pfh-psd-body">' +
      '<button type="button" class="pfh-psd-drop" data-psd-control="browse" autofocus>' + iconHtml('upload') +
      '<span><strong>拖入 PSD，或点击选择</strong><small>也可将鼠标停在这里，按 Ctrl+V 粘贴文件</small></span></button>' +
      '<input type="file" accept=".psd,image/vnd.adobe.photoshop" multiple hidden>' +
      '<div class="pfh-psd-message" role="status" hidden></div><div data-psd-results></div></div>';
    const input = dialog.querySelector('input');
    const drop = dialog.querySelector('.pfh-psd-drop');
    const status = dialog.querySelector('[role="status"]');
    const results = dialog.querySelector('[data-psd-results]');
    const entries = [];
    let selected = -1;
    let reading = false;

    function render() {
      const previous = results.contains(document.activeElement) && document.activeElement;
      const focused = previous && Array.from(previous.attributes).find(({ name }) => name.startsWith('data-psd-'));
      const files = entries.length ? '<nav class="pfh-psd-files" aria-label="包装文件">' + entries.map((file, index) => {
        const type = file.report?.type;
        const label = type === 'carton' ? '纸盒' : type === 'label' ? '标签' : file.error ? '失败' : file.report ? '待确认' : '读取中';
        return '<button type="button" data-psd-file="' + index + '" aria-pressed="' + (index === selected) + '" title="' +
          escapeHtml(file.name) + '"><span>' + label + '</span><strong>' + escapeHtml(file.name) + '</strong></button>';
      }).join('') + '</nav>' : '';
      results.innerHTML = files + productDevelopmentPsdReviewCurrentHtml(entries[selected]);
      if (focused) results.querySelector('[' + focused.name + '="' + focused.value + '"]')?.focus({ preventScroll: true });
    }

    function message(text) {
      status.textContent = text;
      status.hidden = !text;
    }

    async function addFiles(files) {
      let added = 0;
      let unsupported = 0;
      for (const file of files) {
        if (!/\.psd$/i.test(file.name) && file.type !== 'image/vnd.adobe.photoshop') {
          unsupported++;
          continue;
        }
        const id = [file.name, file.size, file.lastModified].join('|');
        if (entries.some((entry) => entry.id === id)) continue;
        if (!added) selected = entries.length;
        entries.push({ id, name: file.name, pending: file, filter: 'review', field: '', raw: false });
        added++;
      }
      message(unsupported ? '仅支持 PSD。已忽略 ' + unsupported + ' 个其他格式的文件。' : added ? '' : '所选 PSD 已在列表中。');
      if (!added) return;
      render();
      if (reading) return;
      reading = true;
      for (const entry of entries) {
        if (!entry.pending) continue;
        try {
          const report = await productDevelopmentReadPsdText(entry.pending);
          entry.report = productDevelopmentPsdReviewAssess(report, entry.name, reference);
        } catch (error) {
          entry.error = formatErrorMessage(error);
        }
        delete entry.pending;
        if (!dialog.open || !dialog.isConnected) break;
        render();
      }
      reading = false;
    }

    dialog.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.psdControl === 'browse') {
        input.click();
        return;
      }
      const file = entries[selected];
      const setting = [
        ['psdFile', 'file'], ['psdFilter', 'filter'], ['psdField', 'field'], ['psdControl', 'control'],
      ].find(([key]) => button.dataset[key] !== undefined);
      if (!file || !setting) return;
      const [key, attribute] = setting;
      const value = button.dataset[key];
      if (attribute === 'file') selected = Number(value);
      if (attribute === 'filter') file.filter = value;
      if (attribute === 'field') file.field = value;
      if (value === 'raw') file.raw = !file.raw;
      render();
    });
    input.addEventListener('change', () => {
      const files = Array.from(input.files || []);
      input.value = '';
      if (files.length) addFiles(files);
    });
    dialog.addEventListener('dragover', (event) => {
      if (!Array.from(event.dataTransfer?.types || []).includes('Files')) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      drop.classList.add('is-dragging');
    });
    dialog.addEventListener('dragleave', (event) => {
      if (!event.relatedTarget || !dialog.contains(event.relatedTarget)) drop.classList.remove('is-dragging');
    });
    dialog.addEventListener('drop', (event) => {
      const files = Array.from(event.dataTransfer?.files || []);
      drop.classList.remove('is-dragging');
      if (!files.length) return;
      event.preventDefault();
      event.stopPropagation();
      addFiles(files);
    });
    function handlePaste(event) {
      if (!dialog.isConnected) {
        document.removeEventListener('paste', handlePaste, true);
        return;
      }
      if (!dialog.open || !dialog.contains(document.activeElement) && !drop.matches(':hover')) return;
      const clipboard = event.clipboardData;
      const files = Array.from(clipboard?.files || []);
      if (!files.length) files.push(...Array.from(clipboard?.items || []).filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter(Boolean));
      if (!files.length) {
        if (drop.matches(':hover, :focus')) message('剪贴板中没有浏览器可读取的文件。可把 PSD 拖进此窗口。');
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      addFiles(files);
    }
    dialog.addEventListener('close', () => {
      document.removeEventListener('paste', handlePaste, true);
      dialog.remove();
      if (trigger && trigger.isConnected) trigger.focus();
    }, { once: true });
    render();
    panel.appendChild(dialog);
    dialog.showModal();
    document.addEventListener('paste', handlePaste, true);
  }
