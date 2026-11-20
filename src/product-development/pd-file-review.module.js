  function productDevelopmentFileReviewReference(result) {
    const snapshot = result.snapshot || {};
    const content = result.content;
    const labeling = snapshot.labeling || {};
    const ingredients = snapshot.regularIngredients || {};
    const fields = [
      ['英文产品名', snapshot.englishName],
      ['净含量', snapshot.netContent],
      ['使用方法', labeling.directionsEn],
      ['警示语', labeling.warningsEn],
      ['免责声明', labeling.disclaimerEn],
      ['其他成分', (snapshot.ingredientTable || {}).otherIngredientsEn],
    ];
    for (const [label, values] of [
      ['产品名译文', content.productNameTranslations],
      ['活性成分', ingredients.activeEn],
      ['非活性成分', ingredients.inactiveEn],
    ]) {
      for (const value of values || []) fields.push([label, value]);
    }
    for (const [label, entries] of [
      ['使用方法', content.directions],
      ['产品功效', content.efficacy],
      ['产品优势', content.advantages],
      ['产品卖点', content.sellingPoints],
      ['成分功能', content.ingredientFunctions],
    ]) {
      for (const item of entries || []) {
        if (item.titleEn) fields.push([label + '标题', item.titleEn]);
        if (item.ingredientEn) fields.push(['成分名称', item.ingredientEn]);
        fields.push([label, item.en]);
      }
    }
    for (const item of snapshot.ingredients || []) fields.push(['成分名称', item.en]);
    const seen = new Set();
    return fields.flatMap(([label, text]) => {
      const normalized = productDevelopmentFileReviewNormalize(text);
      if (!normalized || seen.has(normalized)) return [];
      seen.add(normalized);
      return [{ label, text }];
    });
  }

  function productDevelopmentFileReviewNormalize(text) {
    return String(text || '').normalize('NFC').replace(/\s+/gu, ' ').trim();
  }

  function productDevelopmentComparePsdText(layers, reference) {
    const sources = layers.map((layer) => ({
      ...layer,
      normalized: productDevelopmentFileReviewNormalize(layer.text),
    }));
    return reference.map((field) => {
      const value = productDevelopmentFileReviewNormalize(field.text);
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Limit matches to whole words so, for example, 50 mL never matches 150 mL.
      const pattern = (/^[\p{L}\p{N}]/u.test(value) ? '(?<![\\p{L}\\p{N}\\p{M}])' : '') +
        escaped + (/[\p{L}\p{N}\p{M}]$/u.test(value) ? '(?![\\p{L}\\p{N}\\p{M}])' : '');
      const exact = new RegExp(pattern, 'u');
      const anyCase = new RegExp(pattern, 'iu');
      const matching = sources.find((layer) => exact.test(layer.normalized));
      const candidate = matching || sources.find((layer) => anyCase.test(layer.normalized));
      return {
        ...field,
        status: matching ? 'matched' : candidate ? 'case' : 'missing',
        layer: candidate && candidate.name,
        actual: candidate && candidate.normalized.match(matching ? exact : anyCase)[0],
      };
    });
  }

  function productDevelopmentPsdReviewFileHtml(fileName, report, reference) {
    const compared = productDevelopmentComparePsdText(report.layers, reference);
    const sections = [
      ['missing', '未找到一致文字'],
      ['case', '大小写有差异'],
      ['matched', '找到一致文字'],
    ];
    const checks = sections.map(([status, title]) => {
      const rows = compared.filter((row) => row.status === status);
      if (!rows.length) return '';
      return '<details' + (status === 'case' ? ' open' : '') + '><summary>' + title + ' · ' + rows.length + ' 项</summary><ul>' +
        rows.map((row) => '<li><strong>' + escapeHtml(row.label) + '</strong> · ' + escapeHtml(row.text) +
          (row.actual ? '<small>PSD 命中 · ' + escapeHtml(row.actual) + ' ｜ ' + escapeHtml(row.layer) + '</small>' : '') + '</li>').join('') +
        '</ul></details>';
    }).join('');
    const layers = '<details><summary>可见文本框原文 · ' + report.layers.length + ' 个</summary>' +
      report.layers.map((layer) => '<details><summary>' + escapeHtml(layer.name) + '</summary><pre>' +
        escapeHtml(layer.text) + '</pre></details>').join('') + '</details>';
    const coverage = [
      report.hiddenCount ? '已排除 ' + report.hiddenCount + ' 个隐藏文本框' : '',
      report.smartCount ? '有 ' + report.smartCount + ' 个可见智能对象需另外核对' : '',
      report.unreadableCount ? '有 ' + report.unreadableCount + ' 个文本框无法读取' : '',
    ].filter(Boolean).join('，');
    return '<section><h4>' + escapeHtml(fileName) + '</h4>' +
      (coverage ? '<p>' + coverage + '。</p>' : '') +
      (report.layers.length ? checks + layers : '<p>未找到可读取的可见文本框，请检查源文件是否保留可编辑文字。</p>') + '</section>';
  }

  function openProductDevelopmentFileReview(trigger) {
    const sku = getProductDevelopmentCurrentSku();
    const result = state.productDevelopmentCopywriting;
    if (!result || result.sku !== sku || !result.content) {
      showToast('请先生成或恢复当前 SKU 的文案结果');
      return;
    }
    const reference = productDevelopmentFileReviewReference(result);
    if (!reference.length) {
      showToast('当前文案结果没有可核对的包装用语');
      return;
    }
    const panel = ensurePanel();
    if (panel.querySelector('.pfh-psd-review')) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'pfh-psd-review';
    dialog.setAttribute('aria-label', 'PSD 文件审核');
    const version = [sku, result.fileName].filter(Boolean).join(' · ');
    dialog.innerHTML = '<header class="pfh-cw-result-head"><div><h3>PSD 文件审核</h3><p>' + escapeHtml(version) +
      ' · ' + reference.length + ' 项文案</p></div><form method="dialog"><button type="submit">关闭</button></form></header>' +
      (state.productDevelopmentCopywritingDirtySku === sku ? '<p>文案输入有待更新。本次以屏幕中的文案结果为准。</p>' : '') +
      '<label>选择纸盒或标签 PSD <input type="file" accept=".psd,image/vnd.adobe.photoshop" multiple autofocus></label>' +
      '<p>文件在浏览器内读取。转曲字、像素字及智能对象内的文字需另行核对。文案可能分布在不同包材，未找到的项目需结合实际版面复核。</p>' +
      '<div role="status"></div><div data-psd-review-results></div>';
    const input = dialog.querySelector('input');
    const status = dialog.querySelector('[role="status"]');
    const results = dialog.querySelector('[data-psd-review-results]');
    let selection = 0;
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      input.value = '';
      const request = ++selection;
      results.replaceChildren();
      for (const file of files) {
        status.textContent = '正在读取 ' + file.name + '…';
        let html;
        try {
          const report = await productDevelopmentReadPsdText(file);
          html = productDevelopmentPsdReviewFileHtml(file.name, report, reference);
        } catch (error) {
          html = '<section><h4>' + escapeHtml(file.name) + '</h4><p>' + escapeHtml(formatErrorMessage(error)) + '</p></section>';
        }
        if (!dialog.isConnected || selection !== request) return;
        results.insertAdjacentHTML('beforeend', html);
      }
      status.textContent = '已处理 ' + files.length + ' 个文件。';
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (trigger && trigger.isConnected) trigger.focus();
    }, { once: true });
    panel.appendChild(dialog);
    dialog.showModal();
  }
