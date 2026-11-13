
  function productDevelopmentOneShotNormalizeResponse(response, input, options) {
    const opts = options && typeof options === 'object' ? options : {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(opts.ingredientKind || input && input.ingredientKind);
    const isPet = ingredientKind === 'pet';
    const table = response && response.ingredientTable && typeof response.ingredientTable === 'object' ? response.ingredientTable : {};
    const rawRows = Array.isArray(table.rows) ? table.rows : [];
    const normalizedRows = rawRows.map((row) => {
      const source = row && typeof row === 'object' ? row : {};
      const rawAmount = ['amountText', 'amount', 'amountPerServing', 'quantity', 'dosage', '含量', 'amountMg']
        .map((key) => source[key])
        .find((value) => value !== undefined && value !== null && String(value).trim());
      const parsedAmount = productDevelopmentOneShotParseAmount(rawAmount);
      return {
        ...source,
        amountText: parsedAmount.valid ? parsedAmount.amountText : String(source.amountText || rawAmount || ''),
        amountValue: parsedAmount.valid ? parsedAmount.value : Number(source.amountValue) || 0,
        amountUnit: parsedAmount.valid ? parsedAmount.unit : String(source.amountUnit || ''),
        amountIsMass: Boolean(parsedAmount.valid && parsedAmount.isMass),
        amountMg: parsedAmount.valid && parsedAmount.isMass ? parsedAmount.massMg : 0,
      };
    });
    const frontFacts = productDevelopmentOneShotFrontFacts(input && input.sourcePlainTextCopy);
    const rows = productDevelopmentOneShotApplyFrontFacts(
      productDevelopmentOneShotFrontCopyRows(normalizedRows, input && input.sourcePlainTextCopy),
      frontFacts,
      input && input.sourcePlainTextCopy,
    );
    const otherIngredientsEn = productDevelopmentCleanText(input && input.otherIngredientsEn || (input && input.sourcePlainTextCopy ? '' : table.otherIngredientsEn), 1600);
    const otherIngredientsCn = productDevelopmentCleanText(input && input.otherIngredientsCn || (input && input.sourcePlainTextCopy ? '' : table.otherIngredientsCn), 1200);
    const rowTotalMg = rows.reduce((sum, row) => sum + (Number(row && row.amountMg) || 0), 0);
    const activeTotalMg = productDevelopmentOneShotRounded(rowTotalMg);
    const standardizedActiveMg = productDevelopmentOneShotRounded(rows.reduce((sum, row) => sum + (Number(row && row.markerActiveMg) || 0), 0));
    const standardizedActivePercent = activeTotalMg > 0 ? productDevelopmentOneShotRounded(standardizedActiveMg / activeTotalMg * 100, 2) : 0;
    const targetActiveMg = Number(input && input.targetActiveMg) > 0 ? Number(input.targetActiveMg) : 0;
    const targetActivePercentText = input && input.targetActivePercent !== undefined && input.targetActivePercent !== null
      ? String(input.targetActivePercent).trim()
      : '';
    const targetActivePercent = targetActivePercentText === '' ? 0 : Number(targetActivePercentText);
    const invalidRow = rows.some((row) => !row || !row.nameEn || !row.nameCn || !productDevelopmentOneShotHasMeasuredAmount(productDevelopmentOneShotEditableAmountText(row)));
    const hasMassAmounts = rows.some((row) => row.amountIsMass);
    const allMassAmounts = rows.length > 0 && rows.every((row) => row.amountIsMass);
    if (rows.length < 1 || rows.length > 6 || invalidRow || !Number.isFinite(activeTotalMg) || (targetActiveMg > 0 && allMassAmounts && Math.abs(rowTotalMg - targetActiveMg) > 0.01)) {
      throw new Error('一次生成结果未达到每份活性成分目标');
    }
    if (!isPet && targetActivePercent > 0 && hasMassAmounts && standardizedActivePercent + 0.001 < targetActivePercent) {
      throw new Error('一次生成结果未达到标准化活性目标');
    }
    let content = null;
    if (opts.requireCopywriting !== false) {
      const copySource = response && response.copywriting && typeof response.copywriting === 'object'
        ? (response.copywriting.sections && typeof response.copywriting.sections === 'object' ? response.copywriting.sections : response.copywriting)
        : response && response.sections && typeof response.sections === 'object' ? response.sections : {};
      const provisionalSnapshot = {
        ingredients: rows.map((row) => ({ en: productDevelopmentCleanText(row.nameEn, 300), cn: productDevelopmentCleanText(row.nameCn, 300) })),
        brand: productDevelopmentNormalizeBrandValue(input.brand),
      };
      content = productDevelopmentValidateCopywriting({ sections: copySource }, provisionalSnapshot);
    }
    const snapshot = productDevelopmentOneShotSnapshot(response, input, content, opts);
    const id = 'pd-one-shot-' + Date.now().toString(36);
    const safeName = productDevelopmentSafeFileLabel(snapshot.englishName || snapshot.name || snapshot.sku, 100) || snapshot.sku;
    return {
      id,
      sku: snapshot.sku,
      product: response.product || {},
      snapshot,
      ingredientTable: {
        ...table,
        title: isPet ? 'Product Facts' : 'Supplement Facts',
        servingSize: frontFacts.servingSize || String(table.servingSize || input && input.servingSize || (isPet ? '1 Dropper (1 mL)' : '1 mL')),
        servingsPerContainer: frontFacts.servingsPerContainer || Number(table.servingsPerContainer) || Number(input && input.servingsPerContainer) || 60,
        activeTotalMg: productDevelopmentOneShotRounded(activeTotalMg),
        standardizedActiveMg: productDevelopmentOneShotRounded(standardizedActiveMg),
        standardizedActivePercent: productDevelopmentOneShotRounded(Number.isFinite(standardizedActivePercent) ? standardizedActivePercent : 0, 2),
        requiredActiveMg: targetActiveMg,
        requiredStandardizedActivePercent: targetActivePercent > 0 ? targetActivePercent : 0,
        showFooter: !isPet && table.showFooter !== false,
        otherIngredientsLabel: isPet ? 'Inactive Ingredients' : 'Other Ingredients',
        otherIngredientsEn,
        otherIngredientsCn,
        rows: rows.map((row) => ({ ...row, labelEn: productDevelopmentOneShotIngredientLabel(row, false) })),
      },
      labeling: response && response.labeling && typeof response.labeling === 'object' ? response.labeling : {},
      content,
      ingredientConfirmed: false,
      ingredientKind,
      ingredientTemplateId: productDevelopmentCleanText(opts.ingredientTemplateId, 80),
      ingredientTemplateLabel: productDevelopmentCleanText(opts.ingredientTemplateLabel, 120),
      ingredientTemplateSheetName: productDevelopmentCleanText(opts.ingredientTemplateSheetName, 120),
      copywritingTemplateId: productDevelopmentCleanText(opts.copywritingTemplateId, 80),
      copywritingTemplateLabel: productDevelopmentCleanText(opts.copywritingTemplateLabel, 120),
      warnings: Array.isArray(response && response.warnings) ? response.warnings : [],
      provider: productDevelopmentCleanText(response && response.provider, 80),
      model: productDevelopmentCleanText(response && response.model, 120),
      oneShotRuleVersion: productDevelopmentCleanText(response && response.oneShotRuleVersion || PRODUCT_DEVELOPMENT_ONE_SHOT_RULE_VERSION, 80),
      pdfFileName: productDevelopmentFileDate() + '-' + safeName + '-' + (isPet ? 'Product-Facts' : 'Supplement-Facts') + '.pdf',
      docxFileName: productDevelopmentCopywritingFileName(snapshot),
      pdfBlob: null,
      docxBlob: null,
      createdAt: new Date().toLocaleString(),
    };
  }

  async function productDevelopmentOneShotBuildDocx(result) {
    if (!result || !result.content) throw new Error('请先确认成分表并生成文案');
    const templateId = String(result.copywritingTemplateId || '').trim();
    const template = templateId === 'local'
      ? resolveProductDevelopmentCopywritingTemplate()
      : productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === templateId)
        || productDevelopmentCopywritingBuiltinTemplates().find((item) => item.id === 'drops')
        || resolveProductDevelopmentCopywritingTemplate();
    const source = await withCopywritingTimeout(loadProductDevelopmentCopywritingTemplateSource(template), 60000, 'DOCX 模板下载');
    return {
      blob: await withCopywritingTimeout(buildProductDevelopmentDocx(result.content, source, result.snapshot), 180000, 'DOCX 生成'),
      fileName: result.docxFileName,
    };
  }

  function productDevelopmentOneShotPdfAscii(value) {
    let text = String(value === undefined || value === null ? '' : value)
      .replace(/[μµ]/g, 'u')
      .replace(/[–—]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    if (typeof text.normalize === 'function') text = text.normalize('NFKD');
    return text.replace(/[^\x20-\x7e]/g, '?').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function productDevelopmentOneShotPdfNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '0';
    return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  function productDevelopmentOneShotPdfEscape(value) {
    return productDevelopmentOneShotPdfAscii(value).replace(/([\\()])/g, '\\$1');
  }

  function productDevelopmentOneShotPdfWidth(value, fontSize) {
    const text = productDevelopmentOneShotPdfAscii(value);
    let units = 0;
    Array.from(text).forEach((character) => {
      if (character === ' ') units += 0.28;
      else if ('ilI.,:;!|'.includes(character)) units += 0.25;
      else if ('MW@#%'.includes(character)) units += 0.82;
      else if ('()[]{}-_/'.includes(character)) units += 0.34;
      else units += /[A-Z0-9]/.test(character) ? 0.58 : 0.5;
    });
    return units * Number(fontSize || 10.812);
  }

  function productDevelopmentOneShotPdfWrapText(value, fontSize, maxWidth) {
    const text = productDevelopmentOneShotPdfAscii(value);
    if (!text) return [];
    const lines = [];
    let line = '';
    const appendToken = (token) => {
      let remaining = String(token || '');
      while (remaining && productDevelopmentOneShotPdfWidth(remaining, fontSize) > maxWidth) {
        let length = 1;
        while (length < remaining.length && productDevelopmentOneShotPdfWidth(remaining.slice(0, length + 1), fontSize) <= maxWidth) length += 1;
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(remaining.slice(0, length));
        remaining = remaining.slice(length);
      }
      if (!remaining) return;
      if (!line) line = remaining;
      else if (productDevelopmentOneShotPdfWidth(line + ' ' + remaining, fontSize) <= maxWidth) line += ' ' + remaining;
      else {
        lines.push(line);
        line = remaining;
      }
    };
    text.split(/\s+/).filter(Boolean).forEach(appendToken);
    if (line) lines.push(line);
    return lines;
  }

  function productDevelopmentOneShotPdfFitText(value, fontSize, maxWidth, minimumSize) {
    let text = productDevelopmentOneShotPdfAscii(value);
    let size = Number(fontSize) || 10.812;
    const min = Number(minimumSize) || 6.6;
    while (size > min && productDevelopmentOneShotPdfWidth(text, size) > maxWidth) size -= 0.2;
    if (productDevelopmentOneShotPdfWidth(text, size) <= maxWidth) return { text, size };
    const suffix = '...';
    while (text.length && productDevelopmentOneShotPdfWidth(text + suffix, size) > maxWidth) text = text.slice(0, -1);
    return { text: (text.trimEnd() || '') + suffix, size };
  }

  function productDevelopmentOneShotPdfEncode(value) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(String(value || ''));
    const text = String(value || '');
    const bytes = new Uint8Array(text.length);
    for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index) & 0xff;
    return bytes;
  }

  function productDevelopmentOneShotPdfFileName(result) {
    const snapshot = result && result.snapshot && typeof result.snapshot === 'object' ? result.snapshot : {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || snapshot.ingredientKind));
    const factsLabel = ingredientKind === 'pet' ? 'Product-Facts' : 'Supplement-Facts';
    const label = productDevelopmentSafeFileLabel(snapshot.englishName || snapshot.name || snapshot.sku || factsLabel, 100) || factsLabel;
    return productDevelopmentFileDate() + '-' + label + '-' + factsLabel + '.pdf';
  }

  function productDevelopmentOneShotBuildPdf(result, options) {
    const validation = options && options.skipValidation
      ? { valid: true, errors: [] }
      : productDevelopmentOneShotApplyDraftMetrics(result);
    if (!validation.valid) throw new Error('成分表仍有问题：' + validation.errors.slice(0, 5).join('；'));
    const table = result.ingredientTable;
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    const pageWidth = 595.25;
    const pageHeight = 841.85;
    const outerLeft = 53.88;
    const outerRight = 538.56;
    const outerTopOffset = 71.88;
    const baseOuterBottomOffset = 432.96;
    const innerLeft = 68.51;
    const thickLeft = 65.76;
    const thickRight = 526.68;
    const thinLeft = 66.36;
    const thinRight = 526.08;
    const amountRight = 465.66;
    const dailyValueRight = 524.94;
    const rowHeight = 30.84;
    const rowLineHeight = 12.83;
    const rowStart = 166.02;
    const bodyFontSize = 10.812;
    const titleFontSize = 24.45;
    const amountRightEdge = isPet ? dailyValueRight : amountRight;
    const rowLayouts = rows.map((row) => {
      const amount = productDevelopmentOneShotEditableAmountText(row);
      const amountWidth = productDevelopmentOneShotPdfWidth(amount, bodyFontSize);
      // Keep the body font size fixed. Long ingredient descriptions wrap in
      // the name column instead of being shrunk or truncated.
      const maxNameWidth = Math.max(120, Math.min(350, amountRightEdge - amountWidth - innerLeft - 18));
      const nameLines = productDevelopmentOneShotPdfWrapText(productDevelopmentOneShotEditableRowLabel(row), bodyFontSize, maxNameWidth);
      return {
        amount,
        nameLines: nameLines.length ? nameLines : [''],
        height: rowHeight + Math.max(0, nameLines.length - 1) * rowLineHeight,
      };
    });
    const totalRowHeight = rowLayouts.reduce((sum, row) => sum + row.height, 0);
    const rowDelta = totalRowHeight - 8 * rowHeight;
    const hasOtherIngredients = Boolean(String(table.otherIngredientsEn || '').trim());
    const otherDelta = hasOtherIngredients ? 30 : 0;
    const outerBottomOffset = baseOuterBottomOffset + rowDelta + otherDelta;
    const finalThickOffset = 400.08 + rowDelta;
    const footerOffset = 413.22 + rowDelta;
    const commands = [];
    const number = productDevelopmentOneShotPdfNumber;
    const rect = (left, right, top, height, fill) => {
      const y = pageHeight - top - height;
      commands.push([number(left), number(y), number(right - left), number(height), 're', fill ? 'f' : 'S'].join(' '));
    };
    const text = (font, size, x, top, value) => {
      const baseline = pageHeight - top - size * 0.79;
      const safe = productDevelopmentOneShotPdfEscape(value);
      if (!safe) return;
      commands.push('BT /' + font + ' ' + number(size) + ' Tf 1 0 0 1 ' + number(x) + ' ' + number(baseline) + ' Tm (' + safe + ') Tj ET');
    };
    const rightText = (font, size, right, top, value) => {
      const safe = productDevelopmentOneShotPdfAscii(value);
      text(font, size, right - productDevelopmentOneShotPdfWidth(safe, size), top, safe);
    };
    commands.push('q 0 0 0 RG 0 0 0 rg 0.6 w');
    rect(outerLeft, outerRight, outerTopOffset, outerBottomOffset - outerTopOffset, false);
    const title = productDevelopmentOneShotPdfFitText(isPet ? 'Product Facts' : 'Supplement Facts', titleFontSize, thickRight - 70.45, 18);
    text('F2', title.size, 70.45, 80.42, title.text);
    text('F1', bodyFontSize, 70.45, 104.08, 'Serving Size ' + (table.servingSize || '1 mL'));
    text('F1', bodyFontSize, 70.45, 116.91, 'Servings Per Container ' + String(table.servingsPerContainer || 60));
    rect(thickLeft, thickRight, 129.84, 1.8, true);
    if (isPet) text('F2', bodyFontSize, innerLeft, 139.58, 'Active Ingredients Per ' + (table.servingSize || '1 Dropper (1 mL)'));
    else {
      text('F2', bodyFontSize, innerLeft, 139.58, 'Amount Per Serving');
      rightText('F2', bodyFontSize, dailyValueRight, 139.58, '% Daily Value');
    }
    rect(thinLeft, thinRight, 153.96, 0.6, true);
    let rowTop = rowStart;
    rowLayouts.forEach((layout, index) => {
      layout.nameLines.forEach((line, lineIndex) => text('F1', bodyFontSize, innerLeft, rowTop + lineIndex * rowLineHeight, line));
      rightText('F1', bodyFontSize, isPet ? dailyValueRight : amountRight, rowTop, layout.amount);
      if (!isPet) rightText('F1', bodyFontSize, dailyValueRight, rowTop, rows[index] && rows[index].dailyValue || '**');
      if (index < rows.length - 1) rect(thinLeft, thinRight, rowTop + 18.78 + Math.max(0, layout.nameLines.length - 1) * rowLineHeight, 0.6, true);
      rowTop += layout.height;
    });
    rect(thickLeft, thickRight, finalThickOffset, 1.8, true);
    if (!isPet && table.showFooter !== false) text('F1', bodyFontSize, innerLeft, footerOffset, '**Daily Value not established.');
    if (hasOtherIngredients) {
      const otherLabel = isPet ? 'Inactive Ingredients' : 'Other Ingredients';
      const otherText = productDevelopmentOneShotPdfFitText(otherLabel + ': ' + table.otherIngredientsEn, 8.6, thickRight - innerLeft - 8, 6.6);
      text('F1', otherText.size, innerLeft, isPet ? footerOffset : footerOffset + 14, otherText.text);
    }
    commands.push('Q');
    const content = commands.join('\n') + '\n';
    const objects = [
      null,
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + number(pageWidth) + ' ' + number(pageHeight) + '] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      '<< /Length ' + productDevelopmentOneShotPdfEncode(content).length + ' >>\nstream\n' + content + 'endstream',
    ];
    const chunks = [];
    let byteLength = 0;
    const append = (value) => {
      const bytes = productDevelopmentOneShotPdfEncode(value);
      chunks.push(bytes);
      byteLength += bytes.length;
    };
    append('%PDF-1.4\n% PLM Supplement Facts\n');
    const offsets = [0];
    for (let index = 1; index < objects.length; index += 1) {
      offsets[index] = byteLength;
      append(index + ' 0 obj\n' + objects[index] + '\nendobj\n');
    }
    const xrefOffset = byteLength;
    append('xref\n0 ' + objects.length + '\n0000000000 65535 f \n');
    for (let index = 1; index < objects.length; index += 1) append(String(offsets[index]).padStart(10, '0') + ' 00000 n \n');
    append('trailer\n<< /Size ' + objects.length + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n');
    return new Blob(chunks, { type: 'application/pdf' });
  }

  async function downloadProductDevelopmentOneShotIngredient() {
    const result = state.productDevelopmentOneShotResult;
    if (!result) {
      showToast('请先完成一次生成');
      return;
    }
    const validation = productDevelopmentOneShotDraftValidation(result);
    if (!validation.valid) {
      state.productDevelopmentStatus = '成分表仍需修正：' + validation.errors.slice(0, 3).join('；');
      showToast('成分表未通过校验，暂不能导出 PDF');
      renderShell();
      return;
    }
    if (!result.pdfBlob) {
      state.productDevelopmentOneShotBusy = true;
      const factsLabel = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind) === 'pet' ? 'Product Facts' : 'Supplement Facts';
      state.productDevelopmentStatus = '正在生成 ' + factsLabel + ' PDF…';
      renderShell();
      try {
        result.pdfBlob = productDevelopmentOneShotBuildPdf(result);
        result.pdfFileName = result.pdfFileName || productDevelopmentOneShotPdfFileName(result);
      } finally {
        state.productDevelopmentOneShotBusy = false;
        renderShell();
      }
    }
    downloadBlob(result.pdfBlob, result.pdfFileName || productDevelopmentOneShotPdfFileName(result));
    const factsLabel = normalizeProductDevelopmentIngredientKind(result.ingredientKind || result.snapshot && result.snapshot.ingredientKind) === 'pet' ? 'Product Facts' : 'Supplement Facts';
    state.productDevelopmentStatus = factsLabel + ' PDF 已导出：' + (result.pdfFileName || productDevelopmentOneShotPdfFileName(result));
    showToast(factsLabel + ' PDF 已导出');
    renderShell();
  }

  async function downloadProductDevelopmentOneShotDocx() {
    const result = state.productDevelopmentOneShotResult;
    if (!result || !result.content) {
      showToast('请先确认成分表并生成文案');
      return;
    }
    if (state.productDevelopmentOneShotBusy || state.productDevelopmentCopywritingBusy) return;
    const plan = productDevelopmentCopywritingUpdatePlan(result);
    const handle = await chooseCopywritingSaveTarget(productDevelopmentCopywritingFileName(plan.snapshot));
    if (!handle) return;
    if (plan.changed || !result.docxBlob) {
      state.productDevelopmentOneShotBusy = true;
      state.productDevelopmentStatus = '正在恢复文案 DOCX…';
      renderShell();
      try {
        await productDevelopmentUpdateCopywritingForDownload(result);
        const file = await productDevelopmentOneShotBuildDocx(result);
        result.docxBlob = file.blob;
      } finally {
        state.productDevelopmentOneShotBusy = false;
        renderShell();
      }
    }
    await writeImageBlobToFileHandle(handle, await productDevelopmentTraceDocxBlob(result.docxBlob));
    showToast(result.partialUpdateWarning || '文案已保存');
  }

  function productDevelopmentOneShotConfirmedIngredientTable(result) {
    const table = result && result.ingredientTable && typeof result.ingredientTable === 'object' ? result.ingredientTable : {};
    const ingredientKind = normalizeProductDevelopmentIngredientKind(result && (result.ingredientKind || result.snapshot && result.snapshot.ingredientKind));
    const isPet = ingredientKind === 'pet';
    const rows = Array.isArray(table.rows) ? table.rows.slice(0, 6) : [];
    return {
      title: isPet ? 'Product Facts' : 'Supplement Facts',
      servingSize: productDevelopmentCleanText(table.servingSize || (isPet ? '1 Dropper (1 mL)' : '1 mL'), 80),
      servingsPerContainer: Math.max(1, Math.min(365, Math.round(Number(table.servingsPerContainer) || 60))),
      requiredActiveMg: Number(table.requiredActiveMg) || 0,
      requiredStandardizedActivePercent: Number(table.requiredStandardizedActivePercent) || 0,
      activeTotalMg: Number(table.activeTotalMg) || 0,
      standardizedActiveMg: Number(table.standardizedActiveMg) || 0,
      standardizedActivePercent: Number(table.standardizedActivePercent) || 0,
      otherIngredientsEn: productDevelopmentCleanText(table.otherIngredientsEn, 1600),
      otherIngredientsCn: productDevelopmentCleanText(table.otherIngredientsCn, 1200),
      footnote: productDevelopmentCleanText(table.footnote || '**Daily Value not established.', 180),
      otherIngredientsLabel: isPet ? 'Inactive Ingredients' : 'Other Ingredients',
      showFooter: !isPet && table.showFooter !== false,
      rows: rows.map((row) => ({
        nameEn: productDevelopmentCleanText(productDevelopmentOneShotEditableRowLabel(row) || row && row.nameEn, 300),
        nameCn: productDevelopmentCleanText(row && row.nameCn, 300),
        labelEn: productDevelopmentCleanText(productDevelopmentOneShotEditableRowLabel(row), 600),
        latinName: productDevelopmentCleanText(row && row.latinName, 220),
        sourcePart: productDevelopmentCleanText(row && row.sourcePart, 160),
        standardization: productDevelopmentCleanText(row && row.standardization, 220),
        amountMg: Number(row && row.amountMg) || 0,
        amountText: productDevelopmentCleanText(productDevelopmentOneShotEditableAmountText(row), 80),
        dailyValue: productDevelopmentCleanText(row && row.dailyValue || '**', 40),
        markerActiveMg: Number(row && row.markerActiveMg) || 0,
      })),
    };
  }

  function productDevelopmentOneShotConfirmedIngredients(result) {
    const table = productDevelopmentOneShotConfirmedIngredientTable(result);
    return table.rows.map((row) => ({ en: row.nameEn, cn: row.nameCn })).filter((row) => row.en && row.cn);
  }
